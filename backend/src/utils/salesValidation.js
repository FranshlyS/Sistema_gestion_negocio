const validateSaleData = (saleItems) => {
  const errors = {};

  if (!Array.isArray(saleItems) || saleItems.length === 0) {
    errors.items = 'Debe incluir al menos un producto en la venta';
    return { isValid: false, errors };
  }

  saleItems.forEach((item, index) => {
    if (!item.productId || typeof item.productId !== 'number') {
      errors[`item_${index}_productId`] = 'ID de producto inválido';
    }

    if (!item.quantity || item.quantity <= 0) {
      errors[`item_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
    }

    if (item.unitPrice && item.unitPrice < 0) {
      errors[`item_${index}_unitPrice`] = 'El precio unitario no puede ser negativo';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateStockAvailability = (products, saleItems) => {
  const errors = {};

  saleItems.forEach((item, index) => {
    const product = products.find(p => p.id === item.productId);
    
    if (!product) {
      errors[`item_${index}_product`] = 'Producto no encontrado';
      return;
    }

    if (product.currentStock < item.quantity) {
      errors[`item_${index}_stock`] = `Stock insuficiente. Disponible: ${product.currentStock}, Solicitado: ${item.quantity}`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateSaleData,
  validateStockAvailability
};