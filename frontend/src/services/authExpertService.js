export async function lookupExpertAuth(mobile) {
  const response = await fetch(`/api/Auth/Expert?t=${Date.now()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mobile }),
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("پاسخ سرور JSON معتبر نیست");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "خطا در بررسی وضعیت کارشناس");
  }

  return data;
}

export async function registerExpert({ mobile, password }) {
  const response = await fetch(`/api/Auth/Expert/Register?t=${Date.now()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "خطا در ثبت‌نام کارشناس");
  }

  return data;
}

export async function loginExpert({ mobile, password }) {
  const response = await fetch("/api/Auth/Expert/Login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "خطا در ورود کارشناس");
  }

  return data;
}