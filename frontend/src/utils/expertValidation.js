export const validateExpertLogin = (expert) => {
  if (!expert) {
    return {
      ok: false,
      message: "اطلاعات کاربر یافت نشد",
    };
  }

  if (!expert.mobile) {
    return {
      ok: false,
      message: "شماره موبایل کاربر نامعتبر است",
    };
  }

  if (!expert.role) {
    return {
      ok: false,
      message: "نقش کاربر مشخص نیست",
    };
  }

  if (!expert.permissions || expert.permissions.canLogin !== true) {
    return {
      ok: false,
      message: "کاربر مجوز ورود ندارد",
    };
  }

  return {
    ok: true,
    message: "",
  };
};
