/* =========================================
   [AUTH_HELPER] نرمال‌سازی شماره موبایل
   هدف:
   - تبدیل اعداد به فارسی/عربی
========================================= */

export function normalizeLoginValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
