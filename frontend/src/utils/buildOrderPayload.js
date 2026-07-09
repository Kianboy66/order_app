export function buildOrderPayload({
  selectedCustomer,
  cartItems = [],
  orderDescription = "",
  currentUser,
  discountpercent = 0,
}) {
  const baseIdNumber = Math.floor(Date.now() / 1000);
  const baseId = String(baseIdNumber);

  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date();

  const expertName = String(currentUser?.name || "").trim();
  const expertMobile = String(currentUser?.mobile || "").trim();

  const userSignature = expertName
    ? `ثبت سفارش توسط:${expertName}${expertMobile ? ` شماره تماس: ${expertMobile}` : ""}`
    : "";

  const finalOrderComment = [userSignature, orderDescription]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" || ");

  const getQtyCarton = (item) => Number(item?.qty?.carton || 0);
  const getQtyBasteh = (item) => Number(item?.qty?.Basteh || 0);
  const getQtySingle = (item) =>
    Number(item?.qty?.single || item?.qty?.tak || 0);

  const calcFewTotal = (item) => {
    const qtyCarton = getQtyCarton(item);
    const qtyBasteh = getQtyBasteh(item);
    const qtySingle = getQtySingle(item);

    const sizeCarton = Number(item?.sizes?.carton ?? 1);
    const sizeBasteh = Number(item?.sizes?.Basteh ?? 1);

    return qtyCarton * sizeCarton + qtyBasteh * sizeBasteh + qtySingle;
  };

  const getUnitPrice = (item) => {
    const qtySingle = getQtySingle(item);
    const qtyBasteh = getQtyBasteh(item);
    const qtyCarton = getQtyCarton(item);

    if (qtySingle > 0) return Number(item?.prices?.single || 0);
    if (qtyBasteh > 0) return Number(item?.prices?.Basteh || 0);
    if (qtyCarton > 0) return Number(item?.prices?.carton || 0);

    return 0;
  };

  const orderItems = cartItems
    .filter((item) => {
      return (
        getQtyCarton(item) > 0 ||
        getQtyBasteh(item) > 0 ||
        getQtySingle(item) > 0
      );
    })
    .map((item, index) => ({
      id: String(baseIdNumber + index + 1),
      ProductErpCode: String(item?.erpCode || "").trim(),
      few: calcFewTotal(item),
      karton: getQtyCarton(item),
      price: getUnitPrice(item),
      levy: 0,
      scot: 0,
      discountpercent: Number(discountpercent || 0),
      uniterpcode: String(item?.unitErpCode || "").trim(),
      comment: finalOrderComment,
    }));

  if (!orderItems.length) {
    throw new Error("سبد سفارش خالی است");
  }

  return {
    invoiceinfo: [
      {
        id: baseId,
        type: 1,
        customererpcode: String(
          selectedCustomer?.erpcode || selectedCustomer?.customererpcode || "",
        ).trim(),
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        comment: finalOrderComment,
        detailinfo: orderItems,
      },
    ],
  };
}
