import { useState } from "react";
import { submitOrderApi } from "../services/orderApi";

export function useSubmitOrder({ onSuccess } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const closeSubmitResult = () => {
    setSubmitResult(null);
  };

  const submitOrder = async (payload) => {
    try {
      setIsSubmitting(true);
      setSubmitResult(null);

      const { ok, status, data, raw } = await submitOrderApi(payload);

      console.log("[ORDER] status:", status);
      console.log("[ORDER] raw response:", raw);
      console.log("[ORDER] parsed response:", data);
      console.log("[ORDER] hey hook ok");

      if (!ok || data?.success === false) {
        if (data?.queued) {
          const queuedResult = {
            type: "queued",
            title: "سفارش در صف ثبت قرار گرفت",
            message:
              data?.message ||
              "سرور حسابداری در دسترس نیست. سفارش در صف انتظار ذخیره شد.",
          };

          setSubmitResult(queuedResult);
          return queuedResult;
        }

        throw new Error(data?.message || "خطا در ثبت سفارش");
      }

      const successResult = {
        type: "success",
        title: "سفارش با موفقیت ثبت شد",
        message: data?.message || "سفارش با موفقیت ثبت شد",
        orderId: data?.orderId || "-",
        orderNumber: data?.orderNumber || "-",
        erpCode: data?.erpCode || "-",
        holoo: data?.holoo || null,
      };

      onSuccess?.(successResult);

      setSubmitResult(successResult);
      return successResult;
    } catch (error) {
      console.error("[ORDER] Submit Error:", error);

      const errorResult = {
        type: "error",
        title: "خطا در ثبت سفارش",
        message: error?.message || "خطا در ثبت سفارش",
      };

      setSubmitResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitResult,
    submitOrder,
    closeSubmitResult,
  };
}
