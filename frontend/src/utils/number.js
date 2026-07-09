export const fmt = (n) =>
  Number(n ?? 0).toLocaleString("fa-IR", {
    maximumFractionDigits: 0,
  });

export const fmtCurrency = (n) => `${fmt(n)} ريال`;
