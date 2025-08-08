#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = {
  'src/utils/productValidation.js': `const validatePackProduct = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'El nombre del producto debe tener al menos 2 caracteres';
  }

  if (!data.packQuantity || data.packQuantity <= 0) {
    errors.packQuantity = 'La cantidad de packs debe ser mayor a 0';
  }

  if (!data.productsPerPack || data.productsPerPack <= 0) {
    errors.productsPerPack = 'La cantidad de productos por pack debe ser mayor a 0';
  }

  if (!data.buyPricePerPack || data.buyPricePerPack <= 0) {
    errors.buyPricePerPack = 'El precio de compra por pack debe ser mayor a 0';
  }

  if (!data.sellPricePerUnit || data.sellPricePerUnit <= 0) {
    errors.sellPricePerUnit = 'El precio de venta por unidad debe ser mayor a 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateWeightProduct = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'El nombre del producto debe tener al menos 2 caracteres';
  }

  if (!data.weightUnit || !['lb', 'kg'].includes(data.weightUnit)) {
    errors.weightUnit = 'La unidad de peso debe ser "lb" o "kg"';
  }

  if (!data.totalWeight || data.totalWeight <= 0) {
    errors.totalWeight = 'El peso total debe ser mayor a 0';
  }

  if (!data.buyPricePerUnit || data.buyPricePerUnit <= 0) {
    errors.buyPricePerUnit = 'El precio de compra por unidad debe ser mayor a 0';
  }

  if (!data.sellPricePerUnit || data.sellPricePerUnit <= 0) {
    errors.sellPricePerUnit = 'El precio de venta por unidad debe ser mayor a 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validatePackProduct,
  validateWeightProduct
};`,

  'src/utils/productCalculations.js': `const calculatePackProduct = (packQuantity, productsPerPack, buyPricePerPack, sellPricePerUnit) => {
  const totalUnits = packQuantity * productsPerPack;
  const totalInvested = packQuantity * buyPricePerPack;
  const totalProfit = (sellPricePerUnit * totalUnits) - totalInvested;

  return {
    totalUnits,
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2))
  };
};

const calculateWeightProduct = (totalWeight, buyPricePerUnit, sellPricePerUnit) => {
  const totalInvested = totalWeight * buyPricePerUnit;
  const totalProfit = (sellPricePerUnit * totalWeight) - totalInvested;

  return {
    totalUnits: totalWeight,
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2))
  };
};

module.exports = {
  calculatePackProduct,
  calculateWeightProduct
};`
};

console.log('🔧 Creando archivos faltantes...');

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  // Crear directorio si no existe
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
  
  // Crear archivo si no existe
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Archivo creado: ${filePath}`);
  } else {
    console.log(`ℹ️ Archivo ya existe: ${filePath}`);
  }
}

console.log('✅ Archivos verificados/creados correctamente');