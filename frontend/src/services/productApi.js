  import {
    normalizeProduct,
  } from "../adapters/productAdapter";

/**
 * Fetch products from backend
 * @returns {Promise<Array>} Array of raw product objects
 */
export async function fetchProducts() {
  try {
    const response = await fetch(`/api/Product?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error("خطا در دریافت محصولات");
    }

    const data = await response.json();

    // Handle different response structures
    const rawProducts = Array.isArray(data)
      ? data
      : data?.product || data?.products || [];

    return rawProducts.map(normalizeProduct).filter(Boolean);
  } catch (error) {
    console.error("fetchProducts error:", error);
    throw error;
  }
}
