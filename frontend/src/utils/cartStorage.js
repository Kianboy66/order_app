// Local storage utilities for cart management

const CART_STORAGE_KEY = "orderCart";

/**
 * Load cart from localStorage
 * @returns {Array} Array of cart items
 */
export function loadOrderCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading cart:", error);
    return [];
  }
}

/**
 * Save cart to localStorage
 * @param {Array} products - Products array with quantities
 */
export function saveOrderCart(products) {
  try {
    // Filter products that have quantities
    const cartItems = products
      .filter(
        (p) =>
          p.qty?.carton > 0 ||
          p.qty?.Basteh > 0 ||
          p.qty?.single > 0 ||
          p.qty?.tak > 0,
      )
      .map((p) => ({
        id: p.id,
        code: p.code,
        erpCode: p.erpCode,
        name: p.name,
        qty: p.qty,
        prices: p.prices,
        sizes: p.sizes || { carton: p.CountInKarton, Basteh: p.CountInBasteh },
      }));

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
}

/**
 * Clear cart from localStorage
 */
export function clearOrderCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}

/**
 * Get cart summary
 * @param {Array} products - Products array
 * @returns {Object} Cart summary with itemCount and totalPrice
 */
export function getCartSummary(products) {
  let itemCount = 0;
  let totalPrice = 0;

  products.forEach((product) => {
    const cartonQty = product.qty?.carton || 0;
    const BastehQty = product.qty?.Basteh || 0;
    const singleQty = product.qty?.single || product.qty?.tak || 0;

    if (cartonQty > 0 || BastehQty > 0 || singleQty > 0) {
      itemCount++;

      const cartonSize = product.CountInKarton || product.sizes?.carton || 1;
      const BastehSize = product.CountInBasteh || product.sizes?.Basteh || 1;

      const totalUnits =
        cartonQty * cartonSize + BastehQty * BastehSize + singleQty;
      const unitPrice = product.prices?.single || product.prices?.tak || 0;

      totalPrice += totalUnits * unitPrice;
    }
  });

  return { itemCount, totalPrice };
}
