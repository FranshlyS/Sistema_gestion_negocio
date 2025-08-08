const validatePackProduct = (data) => {
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
};