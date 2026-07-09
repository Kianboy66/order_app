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

export function writeCartQtyToStorage(products) {
  try {
    const qtyMap = {};

    (products || []).forEach((item) => {
      const carton = Number(item?.qty?.carton || 0);
      const Basteh = Number(item?.qty?.Basteh || 0);
      const single = Number(item?.qty?.single || item?.qty?.tak || 0);

      if (carton > 0 || Basteh > 0 || single > 0) {
        qtyMap[item.id] = {
          carton,
          Basteh,
          single,
          tak: single,
        };
      }
    });

    // نکته: متغیر ORDER_CART_KEY و selectedItems باید اینجا در دسترس باشن (یا ایمپورت بشن یا به عنوان ورودی پاس داده بشن)
    localStorage.setItem(ORDER_CART_KEY, JSON.stringify(selectedItems));
  } catch (error) {
    console.error("[CART] write storage error:", error);
  }
}
