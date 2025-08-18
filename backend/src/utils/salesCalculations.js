const calculateSaleTotal = (saleItems) => {
  let totalAmount = 0;
  let totalItems = 0;

  const calculatedItems = saleItems.map(item => {
    const itemTotal = item.quantity * item.unitPrice;
    totalAmount += itemTotal;
    totalItems += item.quantity;

    return {
      ...item,
      totalPrice: parseFloat(itemTotal.toFixed(2))
    };
  });

  return {
    items: calculatedItems,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalItems: parseFloat(totalItems.toFixed(2))
  };
};

const generateSaleNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SALE-${timestamp}-${random}`;
};

module.exports = {
  calculateSaleTotal,
  generateSaleNumber
};