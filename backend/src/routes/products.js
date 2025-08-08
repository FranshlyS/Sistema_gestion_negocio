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

module.exports = router;