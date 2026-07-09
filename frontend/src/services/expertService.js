import { mapExpertToViewModel } from "../adapters/expertAdapter";

export const syncExperts = async () => {
  const response = await fetch(`/api/Expert/sync?t=${Date.now()}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("خطا در بروزرسانی لیست کارشناسان");
  }

  return response.json().catch(() => null);
};

export const fetchExperts = async ({ sync = true } = {}) => {
  if (sync) {
    await syncExperts();
  }

  const response = await fetch(`/api/Expert?t=${Date.now()}`);

  if (!response.ok) {
    throw new Error("خطا در دریافت لیست کارشناسان");
  }

  const data = await response.json();

  const list = Array.isArray(data)
    ? data
    : data?.expert || data?.Expert || data?.items || data?.result || [];

  return list.map((item, index) => mapExpertToViewModel(item, index));
};
