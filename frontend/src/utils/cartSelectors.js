export function getCartItems(products = []) {
  return products.filter((item) => {
    const cartonQty = Number(item?.qty?.carton || 0);
    const bastehQty = Number(item?.qty?.Basteh || 0);
    const singleQty = Number(item?.qty?.single || item?.qty?.tak || 0);

    return cartonQty > 0 || bastehQty > 0 || singleQty > 0;
  });
}

export function getCartTotals(products = []) {
  return products.reduce(
    (acc, item) => {
      const cartonQty = Number(item?.qty?.carton || 0);
      const bastehQty = Number(item?.qty?.Basteh || 0);
      const singleQty = Number(item?.qty?.single || item?.qty?.tak || 0);

      const cartonSize = Number(item?.sizes?.carton || 0);
      const bastehSize = Number(item?.sizes?.Basteh || 0);

      const totalUnits =
        cartonQty * cartonSize + bastehQty * bastehSize + singleQty;

      const unitPrice = Number(item?.prices?.single || item?.prices?.tak || 0);



      acc.totalCartonCount += cartonQty;
      acc.totalBastehCount += bastehQty;
      acc.totalTakCount += singleQty;
      acc.totalPrice += totalUnits * unitPrice;

      return acc;
    },
    {
      totalPrice: 0,
      totalCartonCount: 0,
      totalBastehCount: 0,
      totalTakCount: 0,
    },
  );
}
