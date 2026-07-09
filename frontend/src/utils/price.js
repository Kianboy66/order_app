// محاسبات قیمت و تخفیف
export const calculatePrice = (product, quantity, unit = "box") => {
  const basePrice = product.price;
  let unitPrice = basePrice;

  // تبدیل به قیمت واحد بر اساس نوع خرید
  if (unit === "carton") {
    unitPrice = basePrice * product.unitsPerBox * product.boxesPerCarton;
  } else if (unit === "box") {
    unitPrice = basePrice * product.unitsPerBox;
  }

  const totalBeforeDiscount = unitPrice * quantity;
  const discountAmount = product.discount
    ? (totalBeforeDiscount * product.discount) / 100
    : 0;
  const totalAfterDiscount = totalBeforeDiscount - discountAmount;

  return {
    unitPrice,
    totalBeforeDiscount,
    discountAmount,
    totalAfterDiscount,
    finalPrice: totalAfterDiscount,
  };
};

// فرمت قیمت با جداکننده هزارگان
export const formatPrice = (price) => {
  return new Intl.NumberFormat("fa-IR").format(Math.round(price));
};

// محاسبه جمع کل سبد خرید
export const calculateCartTotal = (cartItems, products) => {
  return cartItems.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return total;

    const { finalPrice } = calculatePrice(product, item.quantity, item.unit);
    return total + finalPrice;
  }, 0);
};
