const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { validateSaleData, validateStockAvailability } = require('../utils/salesValidation');
const { calculateSaleTotal, generateSaleNumber } = require('../utils/salesCalculations');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/sales - Obtener todas las ventas del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { userId: req.user.userId },
        include: {
          saleDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.sale.count({
        where: { userId: req.user.userId }
      })
    ]);

    res.json({
      success: true,
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/:id - Obtener venta específica
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);

    const sale = await prisma.sale.findFirst({
      where: { 
        id: saleId,
        userId: req.user.userId
      },
      include: {
        saleDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      sale
    });

  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/sales - Crear nueva venta
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, notes } = req.body;

    // Validar datos básicos
    const validation = validateSaleData(items);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de venta inválidos',
        errors: validation.errors
      });
    }

    // Obtener productos para verificar stock y precios
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        userId: req.user.userId
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos productos no fueron encontrados'
      });
    }

    // Preparar items con precios actuales
    const enrichedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        unitPrice: item.unitPrice || product.sellPricePerUnit
      };
    });

    // Validar stock disponible
    const stockValidation = validateStockAvailability(products, enrichedItems);
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para algunos productos',
        errors: stockValidation.errors
      });
    }

    // Calcular totales
    const calculations = calculateSaleTotal(enrichedItems);
    const saleNumber = generateSaleNumber();

    // Crear venta en transacción
    const result = await prisma.$transaction(async (prismaTransaction) => {
      // Crear la venta
      const sale = await prismaTransaction.sale.create({
        data: {
          userId: req.user.userId,
          saleNumber,
          totalAmount: calculations.totalAmount,
          totalItems: calculations.totalItems,
          notes: notes || null
        }
      });

      // Crear detalles de venta y actualizar stock
      for (const item of calculations.items) {
        // Crear detalle de venta
        await prismaTransaction.saleDetail.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }
        });

        // Actualizar stock del producto
        await prismaTransaction.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Obtener venta completa con detalles
      return await prismaTransaction.sale.findUnique({
        where: { id: sale.id },
        include: {
          saleDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              }
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      sale: result
    });

  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/products/available - Obtener productos disponibles para venta
router.get('/products/available', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.userId,
        currentStock: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        sellPricePerUnit: true,
        currentStock: true,
        weightUnit: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/reports/summary - Resumen de ventas
router.get('/reports/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [summary, recentSales] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          userId: req.user.userId,
          status: 'COMPLETED',
          ...dateFilter
        },
        _sum: {
          totalAmount: true,
          totalItems: true
        },
        _count: {
          id: true
        }
      }),
      prisma.sale.findMany({
        where: {
          userId: req.user.userId,
          ...dateFilter
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          saleDetails: {
            include: {
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      summary: {
        totalSales: summary._count.id || 0,
        totalRevenue: summary._sum.totalAmount || 0,
        totalItemsSold: summary._sum.totalItems || 0,
        averageSale: summary._count.id > 0 ? (summary._sum.totalAmount / summary._count.id) : 0
      },
      recentSales
    });
  } catch (error) {
    console.error('Error al obtener resumen de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;