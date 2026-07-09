/**
 * =========================================================
 * Order / Product / Customer Utilities
 * ---------------------------------------------------------
 * Author: Development Team
 * Date: 1405/03/25
 * Purpose:
 * - دریافت و نرمال‌سازی داده‌های محصول و مشتری
 * - نگهداری سبد سفارش در localStorage
 * - ادغام سبد ذخیره‌شده با لیست محصولات
 * - استخراج ساختار دسته‌بندی برای دراور / سایدبار
 * =========================================================
 * Map Holo backend product to UI product structure
 * @param {Object} item - Raw product from backend
 * @param {number} index - Product index
 * @returns {Object} Normalized product object
 */
export function mapHoloProductToUi(item, index) {
  const {
    Code: code,
    ErpCode: erpCode,
    Name: name,
    CountInKarton = 1,
    CountInBasteh = 1,
    SellPrice10: sellPriceSingle = 0,
    SelPriceKarton: sellPriceCarton = 0,
    SelPriceBasteh: sellPriceBasteh = 0,
    Few: few = 0,
    FewKarton: fewKarton = 0,
    FewBasteh: fewBasteh = 0,
    FewTak: fewTak = 0,
    FewSpd: fewSpd = 0,
    MainGroupName: mainGroupName = '',
    MainGroupErpCode: mainGroupErpCode = '',
    SideGroupName: sideGroupName = '',
    SideGroupErpCode: SideGroupErpCode = '',
    Other5: other5 = '',
    Other7: other7 = '',
    Other8: other8 = '',
    UnitErpCode: unitErpCode = '',
    IsActive: isActive = true,
  } = item;

  const productImg = './advie1.jpeg';

  return {
    id: erpCode || code || `product-${index}`,
    code,
    erpCode,
    name: name || 'بدون نام',
    
    // Groups
    group: mainGroupName,
    groupCode: mainGroupErpCode,
    groups: mainGroupName,
    sideGroupName,
    SideGroupErpCode,
    sideGroupNames: sideGroupName,
    
    // Categories
    category: other7 || mainGroupName,
    subCategory: other8 || sideGroupName,
    categories: [other7, other8].filter(Boolean).join(' / '),
    
    // Unit & Material
    unitErpCode,
    material: other5,
    place: '',
    assetId: code,
    isActive,
    
    // Stock
    stock: {
      total: few,
      carton: fewKarton,
      Basteh: fewBasteh,
      single: fewTak || few,
      tak: fewTak || few,
    },
    
    few,
    fewKarton,
    fewBasteh,
    CountInKarton,
    CountInBasteh,
    
    // Sizes
    sizes: {
      carton: CountInKarton,
      Basteh: CountInBasteh,
    },
    
    // Prices
    sellPriceSingle,
    sellPriceCarton,
    sellPriceBasteh,
    prices: {
      single: sellPriceSingle,
      Basteh: sellPriceBasteh,
      carton: sellPriceCarton,
      tak: sellPriceSingle,
      discountPercent: item.DiscountPercent || 0,
      discountPrice: item.DiscountPrice || 0,
    },
    
    // Order quantities (initialized to 0)
    qty: {
      carton: 0,
      Basteh: 0,
      single: 0,
      tak: 0,
    },
    
    // Order totals (initialized to 0)
    total: {
      carton: 0,
      Basteh: 0,
      single: 0,
      tak: 0,
    },
    
    productImg,
    image: '/advie1.jpeg',
    raw: item,
  };
}

/**
 * Normalize product data
 * @param {Object} item - Raw product
 * @param {number} index - Product index
 * @returns {Object} Normalized product
 */
export function normalizeProduct(item, index) {
  return mapHoloProductToUi(item, index);
}

/**
 * Merge products with cart data
 * @param {Array} products - Products from API
 * @param {Array} cart - Cart items from storage
 * @returns {Array} Products with cart quantities
 */
export function mergeProductsWithStoredCart(products, cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return products;
  }

  return products.map(product => {
    const cartItem = cart.find(
      item =>
        item.id === product.id ||
        item.erpCode === product.erpCode ||
        item.code === product.code
    );

    if (!cartItem) return product;

    // Merge quantities
    const cartonQty = cartItem.qty?.carton || 0;
    const BastehQty = cartItem.qty?.Basteh || 0;
    const singleQty = cartItem.qty?.single || cartItem.qty?.tak || 0;

    return {
      ...product,
      qty: {
        carton: cartonQty,
        Basteh: BastehQty,
        single: singleQty,
        tak: singleQty,
      },
      total: {
        carton: cartonQty * (product.prices.carton || 0),
        Basteh: BastehQty * (product.prices.Basteh || 0),
        single: singleQty * (product.prices.single || product.prices.tak || 0),
        tak: singleQty * (product.prices.tak || product.prices.single || 0),
      },
    };
  });
}


/* =========================================================
 * Function: buildCategoryTree
 * Purpose : ساخت درخت دسته‌بندی برای تب‌ها / دراور
 * Notes   :
 * - از category و subCategory نرمال‌شده استفاده می‌کند
 * - خروجی مناسب UI است
 * Input   : normalized product array
 * Output  : [{ title, count, children }]
 * ========================================================= */
export const buildCategoryTree = (products = []) => {
  if (!Array.isArray(products)) return [];

  const treeMap = new Map();

  products.forEach((item) => {
    const main = String(item?.category || "").trim() || "دسته بندی نشده";
    const sub = String(item?.subCategory || "").trim() || "بدون دسته بندی";

    if (!treeMap.has(main)) {
      treeMap.set(main, {
        key: `cat-${main}`,
        title: main,
        label: main,
        count: 0,
        children: new Map(),
      });
    }

    const mainNode = treeMap.get(main);
    mainNode.count += 1;

    if (!mainNode.children.has(sub)) {
      mainNode.children.set(sub, {
        key: `sub-${main}-${sub}`,
        title: sub,
        label: sub,
        count: 0,
      });
    }

    mainNode.children.get(sub).count += 1;
  });

  return Array.from(treeMap.values()).map((mainNode) => ({
    key: mainNode.key,
    title: mainNode.title,
    label: mainNode.label,
    count: mainNode.count,
    children: Array.from(mainNode.children.values()),
  }));
};