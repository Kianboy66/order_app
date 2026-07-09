export const normalizeText = (text = "") => {
  return String(text)
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/\u200C/g, " ") // حذف نیم‌فاصله
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};
