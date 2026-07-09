/**
 * customer Service
 * Author: Development Team
 * Date: 1405/04/08
 * Purpose: تبدیل داده خام API به مدل استاندارد UI
 */
export const mapCustomerToViewModel = (item = {}, index = 0) => {
  const code = String(item?.Code ?? "").trim();
  const erpcode = String(item?.ErpCode ?? "").trim();
  const name = String(item?.Name ?? "").trim();
  const isvaseteh = Boolean(item?.IsVaseteh);
  const isPurchaser = Boolean(item?.IsPurchaser);
  const isSeller = Boolean(item?.IsSeller);
  const mobile = String(item?.Mobile ?? "").trim();

  return {
    id: erpcode || `customer-${index}`,
    code,
    name,
    mobile,
    category: String(item?.CityName ?? "").trim(),
    categorycode: Number(item?.CityCode ?? 0),
    bedsarfasl: Number(item?.BedSarfasl ?? 0),
    mandeh: Number(item?.Mandeh ?? 0),
    vasetehporsant: Number(item?.VasetehPorsant ?? 0),
    cityCode: Number(item?.CityCode ?? 0),
    cityName: String(item?.CityName ?? "").trim(),
    city: String(item?.City ?? "").trim(),
    ostan: String(item?.Ostan ?? "").trim(),
    address: String(item?.Address ?? "").trim(),
    isvaseteh,
    isPurchaser,
    isSeller,
    erpcode,
  };
};

/* =========================================================
 * Function: fetchCustomers
 * Purpose : دریافت لیست مشتریان از API و نرمال‌سازی آن‌ها
 * Input   : -
 * Output  : normalized customer array
 * ========================================================= */
export const fetchCustomers = async () => {
  try {
    const response = await fetch(`/api/Customers?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error("خطا در دریافت لیست مشتریان");
    }

    const data = await response.json();

    const list = Array.isArray(data)
      ? data
      : data?.customer || data?.customers || [];

    const mapped = list.map((item, index) =>
      mapCustomerToViewModel(item, index),
    );

    return mapped;
  } catch {
    return [];
  }
};

export const syncCustomers = async () => {
  console.log("[syncCustomers] start");

  const response = await fetch(`/api/Customer/sync?t=${Date.now()}`);

  console.log("[syncCustomers] response status:", response.status);
  if (!response.ok) {
    throw new Error("خطا در همگام‌سازی مشتریان");
  }

  console.log("[syncCustomers] parsed data:", data);
  return response.json();
};

export const createCustomer = async (payload) => {
  const response = await fetch("/api/Customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await response.json();
};