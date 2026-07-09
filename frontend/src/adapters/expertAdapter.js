export const mapExpertToViewModel = (item = {}, index = 0) => {
  const code = String(item?.Code ?? item?.code ?? "").trim();
  const erpCode = String(item?.ErpCode ?? item?.erpCode ?? "").trim();
  const name = String(item?.Name ?? item?.name ?? "").trim();
  const mobile = String(item?.Mobile ?? item?.mobile ?? "").trim();

  const isActive = item?.IsActive !== false && item?.isActive !== false;
  const isBlackList = Boolean(item?.IsBlackList ?? item?.isBlackList);

  const isSeller = Boolean(item?.IsSeller ?? item?.isSeller);
  const isPurchaser = Boolean(item?.IsPurchaser ?? item?.isPurchaser);
  const isVaseteh = Boolean(item?.IsVaseteh ?? item?.isVaseteh);

  return {
    id: erpCode || code || `expert-${index}`,

    code,
    erpCode,
    name,
    mobile,

    // فعلاً رمز را از API می‌خوانیم؛ اگر نبود code به عنوان fallback
    password: String(
      item?.Password ?? item?.password ?? item?.Pass ?? item?.pass ?? code,
    ).trim(),

    isVaseteh,
    isActive,
    isPurchaser,
    isSeller,
    isBlackList,

    cityCode: Number(item?.CityCode ?? item?.cityCode ?? 0),
    cityName: String(item?.CityName ?? item?.cityName ?? "").trim(),
    city: String(item?.City ?? item?.city ?? "").trim(),
    ostan: String(item?.Ostan ?? item?.ostan ?? "").trim(),
    address: String(item?.Address ?? item?.address ?? "").trim(),

    bedSarfasl: Number(item?.BedSarfasl ?? item?.bedSarfasl ?? 0),
    mandeh: Number(item?.Mandeh ?? item?.mandeh ?? 0),
    credit: Number(item?.Credit ?? item?.credit ?? 0),
    vasetehPorsant: Number(item?.VasetehPorsant ?? item?.vasetehPorsant ?? 0),

    selectedPriceType: Number(item?.selectedPriceType ?? 1),
    sellerWithTax: Boolean(item?.sellerWithTax),

    roles: {
      seller: isSeller,
      purchaser: isPurchaser,
      mediator: isVaseteh,
    },

    permissions: {
      canLogin: isActive && !isBlackList,
      canCreateOrder: isActive && !isBlackList && isSeller,
      canViewCustomers: isActive && !isBlackList && isSeller,
      canViewProducts: isActive && !isBlackList,
      canApplyDiscount: isActive && !isBlackList && isSeller,
    },
  };
};
