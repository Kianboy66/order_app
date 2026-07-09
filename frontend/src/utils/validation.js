// اعتبارسنجی شماره موبایل ایران
export const validateMobile = (mobile) => {
  const pattern = /^09[0-9]{9}$/;
  return pattern.test(mobile);
};

// اعتبارسنجی کد ملی
export const validateNationalCode = (code) => {
  if (!/^\d{10}$/.test(code)) return false;

  const check = parseInt(code[9]);
  const sum = code
    .split("")
    .slice(0, 9)
    .reduce((acc, digit, index) => {
      return acc + parseInt(digit) * (10 - index);
    }, 0);

  const remainder = sum % 11;
  return (
    (remainder < 2 && check === remainder) ||
    (remainder >= 2 && check === 11 - remainder)
  );
};

// اعتبارسنجی نام (حداقل 3 کاراکتر)
export const validateName = (name) => {
  return name && name.trim().length >= 3;
};

export const validateLoginMobile = (mobile) => {
  if (!mobile.trim()) return "شماره موبایل نمی‌تواند خالی باشد.";
  if (!/^\d+$/.test(mobile)) return "شماره موبایل باید فقط شامل عدد باشد.";
  if (!mobile.startsWith("09")) return "شماره موبایل باید با 09 شروع شود.";
  if (mobile.length !== 11) return "شماره موبایل باید 11 رقم باشد.";
  return "";
};

export const validateLoginPassword = (pass) => {
  if (!pass.trim()) return "رمز عبور نمی‌تواند خالی باشد.";
  if (pass.length < 4) return "رمز عبور باید حداقل ۴ رقم باشد.";
  return "";
};
