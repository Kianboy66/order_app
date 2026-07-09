export async function submitOrderApi(payload) {
  console.log("[ORDER] hey api ok");
  const response = await fetch("/api/Invoice/Order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {
      success: false,
      message: "پاسخ سرور قابل پردازش نیست",
      raw: text,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    raw: text,
  };
}
