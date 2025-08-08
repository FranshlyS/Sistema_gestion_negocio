const calculatePackProduct = (packQuantity, productsPerPack, buyPricePerPack, sellPricePerUnit) => {
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
};