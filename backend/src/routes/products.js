const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { validatePackProduct, validateWeightProduct } = require('../utils/productValidation');
const { calculatePackProduct, calculateWeightProduct } = require('../utils/productCalculations');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/products - Obtener todos los productos del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/:id - Obtener producto específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products/pack - Crear producto por pack
router.post('/pack', authMiddleware, async (req, res) => {
  try {
    const { name, packQuantity, productsPerPack, buyPricePerPack, sellPricePerUnit } = req.body;

    // Validar datos
    const validation = validatePackProduct(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: validation.errors
      });
    }

    // Verificar si el producto ya existe para este usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: name.trim(),
        userId: req.user.userId
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con este nombre'
      });
    }

    // Calcular valores
    const calculations = calculatePackProduct(
      parseInt(packQuantity),
      parseInt(productsPerPack),
      parseFloat(buyPricePerPack),
      parseFloat(sellPricePerUnit)
    );

    // Crear producto
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        type: 'pack',
        userId: req.user.userId,
        packQuantity: parseInt(packQuantity),
        productsPerPack: parseInt(productsPerPack),
        buyPricePerPack: parseFloat(buyPricePerPack),
        sellPricePerUnit: parseFloat(sellPricePerUnit),
        totalUnits: calculations.totalUnits,
        totalInvested: calculations.totalInvested,
        totalProfit: calculations.totalProfit
      }
    });

    res.status(201).json({
      success: true,
      message: 'Producto registrado exitosamente',
      product
    });

  } catch (error) {
    console.error('Error al crear producto por pack:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products/weight - Crear producto por peso
router.post('/weight', authMiddleware, async (req, res) => {
  try {
    const { name, weightUnit, totalWeight, buyPricePerUnit, sellPricePerUnit } = req.body;

    // Validar datos
    const validation = validateWeightProduct(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: validation.errors
      });
    }

    // Verificar si el producto ya existe para este usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: name.trim(),
        userId: req.user.userId
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con este nombre'
      });
    }

    // Calcular valores
    const calculations = calculateWeightProduct(
      parseFloat(totalWeight),
      parseFloat(buyPricePerUnit),
      parseFloat(sellPricePerUnit)
    );

    // Crear producto
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        type: 'weight',
        userId: req.user.userId,
        weightUnit,
        totalWeight: parseFloat(totalWeight),
        buyPricePerUnit: parseFloat(buyPricePerUnit),
        sellPricePerUnit: parseFloat(sellPricePerUnit),
        totalUnits: calculations.totalUnits,
        totalInvested: calculations.totalInvested,
        totalProfit: calculations.totalProfit
      }
    });

    res.status(201).json({
      success: true,
      message: 'Producto registrado exitosamente',
      product
    });

  } catch (error) {
    console.error('Error al crear producto por peso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/pack/:id - Actualizar producto por pack
router.put('/pack/:id', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, packQuantity, productsPerPack, buyPricePerPack, sellPricePerUnit } = req.body;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId,
        type: 'pack'
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto pack no encontrado'
      });
    }

    // Validar datos
    const validation = validatePackProduct(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: validation.errors
      });
    }

    // Verificar si el nombre ya existe en otro producto
    if (name.trim() !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: { 
          name: name.trim(),
          userId: req.user.userId,
          id: { not: productId }
        }
      });

      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con este nombre'
        });
      }
    }

    // Calcular valores
    const calculations = calculatePackProduct(
      parseInt(packQuantity),
      parseInt(productsPerPack),
      parseFloat(buyPricePerPack),
      parseFloat(sellPricePerUnit)
    );

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        packQuantity: parseInt(packQuantity),
        productsPerPack: parseInt(productsPerPack),
        buyPricePerPack: parseFloat(buyPricePerPack),
        sellPricePerUnit: parseFloat(sellPricePerUnit),
        totalUnits: calculations.totalUnits,
        totalInvested: calculations.totalInvested,
        totalProfit: calculations.totalProfit
      }
    });

    res.json({
      success: true,
      message: 'Producto pack actualizado exitosamente',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error al actualizar producto pack:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/weight/:id - Actualizar producto por peso
router.put('/weight/:id', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, weightUnit, totalWeight, buyPricePerUnit, sellPricePerUnit } = req.body;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId,
        type: 'weight'
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto peso no encontrado'
      });
    }

    // Validar datos
    const validation = validateWeightProduct(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: validation.errors
      });
    }

    // Verificar si el nombre ya existe en otro producto
    if (name.trim() !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: { 
          name: name.trim(),
          userId: req.user.userId,
          id: { not: productId }
        }
      });

      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con este nombre'
        });
      }
    }

    // Calcular valores
    const calculations = calculateWeightProduct(
      parseFloat(totalWeight),
      parseFloat(buyPricePerUnit),
      parseFloat(sellPricePerUnit)
    );

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        weightUnit,
        totalWeight: parseFloat(totalWeight),
        buyPricePerUnit: parseFloat(buyPricePerUnit),
        sellPricePerUnit: parseFloat(sellPricePerUnit),
        totalUnits: calculations.totalUnits,
        totalInvested: calculations.totalInvested,
        totalProfit: calculations.totalProfit
      }
    });

    res.json({
      success: true,
      message: 'Producto peso actualizado exitosamente',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error al actualizar producto peso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Verificar que el producto pertenece al usuario
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products/:id/add-stock - Agregar stock a producto existente
router.post('/:id/add-stock', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { quantity, reason, notes } = req.body;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar cantidad
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Crear entrada en transacción
    const result = await prisma.$transaction(async (prismaTransaction) => {
      // Actualizar stock del producto
      const updatedProduct = await prismaTransaction.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            increment: parseFloat(quantity)
          }
        }
      });

      // Crear registro de movimiento de stock
      await prismaTransaction.stockMovement.create({
        data: {
          productId: productId,
          userId: req.user.userId,
          type: 'IN',
          quantity: parseFloat(quantity),
          previousStock: existingProduct.currentStock,
          newStock: updatedProduct.currentStock,
          reason: reason || 'RESTOCK',
          notes: notes || null
        }
      });

      return updatedProduct;
    });

    res.json({
      success: true,
      message: 'Stock agregado exitosamente',
      product: result
    });

  } catch (error) {
    console.error('Error al agregar stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/:id/stock-movements - Obtener movimientos de stock
router.get('/:id/stock-movements', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verificar que el producto pertenece al usuario
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId: productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      }),
      prisma.stockMovement.count({
        where: { productId: productId }
      })
    ]);

    res.json({
      success: true,
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener movimientos de stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products/:id/adjust-stock - Ajustar stock (corrección manual)
router.post('/:id/adjust-stock', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { newStock, reason, notes } = req.body;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user.userId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar nuevo stock
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }

    const difference = parseFloat(newStock) - existingProduct.currentStock;

    // Crear entrada en transacción
    const result = await prisma.$transaction(async (prismaTransaction) => {
      // Actualizar stock del producto
      const updatedProduct = await prismaTransaction.product.update({
        where: { id: productId },
        data: {
          currentStock: parseFloat(newStock)
        }
      });

      // Crear registro de movimiento de stock
      await prismaTransaction.stockMovement.create({
        data: {
          productId: productId,
          userId: req.user.userId,
          type: difference >= 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          previousStock: existingProduct.currentStock,
          newStock: updatedProduct.currentStock,
          reason: reason || 'ADJUSTMENT',
          notes: notes || null
        }
      });

      return updatedProduct;
    });

    res.json({
      success: true,
      message: 'Stock ajustado exitosamente',
      product: result
    });

  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;