import { useEffect, useState } from "react";
import { fetchExperts } from "../services/expertService";
import {
  lookupExpertAuth,
  loginExpert,
  registerExpert,
} from "../services/authExpertService";
import {
  clearAuthUser,
  loadAuthUser,
  saveAuthUser,
} from "../utils/authStorage";
import { normalizeLoginValue } from "../utils/textNormalizer";
import { validateExpertLogin } from "../utils/expertValidation";
import { guestExpert } from "./guestExpert";

/**
 *
 *
 *   نقشه‌ها و مجوزهای متناظر در فرانت‌اند
 *
 */
export const ROLE_PERMISSIONS = {
  guest: {
    canLogin: true,
    canViewProducts: true,
    canViewOrder: false,
    canViewCustomers: false,
    canEditCustomers: false,
    canAddExperts: false,
  },
  expert: {
    canLogin: true,
    canViewProducts: true,
    canViewOrder: true,
    canViewCustomers: true,
    canEditCustomers: false,
    canAddExperts: false,
  },
  admin: {
    canLogin: true,
    canViewProducts: true,
    canViewOrder: true,
    canViewCustomers: true,
    canEditCustomers: true,
    canAddExperts: true,
  },
};

/**
 * مراحل مودال:
 * 
 * 
 * 
 */
export function enrichUserWithPermissions(rawUser) {
  if (!rawUser) return null;

  // خواندن نقش کاربر (اگر نداشت، پیش‌فرض guest)
  const role = rawUser.role || "admin";

  // استخراج مجوزهای مربوط به این نقش
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;

  return {
    ...rawUser,
    permissions,
  };
}

/**
 * مراحل مودال:
 * lookup   => فقط دریافت موبایل و بررسی وضعیت
 * login    => کارشناس قبلاً ثبت‌نام کرده
 * register => کارشناس در لیست اصلی هست ولی هنوز در auth_expert نیست
 */
export function useAuthExpert() {
  const [showWelcome, setShowWelcome] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [authStep, setAuthStep] = useState("lookup");

  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [pendingExpert, setPendingExpert] = useState(null);
  const [lookupExpertResult, setLookupExpertResult] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [simpleCode, setSimpleCode] = useState("");

  useEffect(() => {
    const savedUser = loadAuthUser();


    if (!savedUser) return;

    if (savedUser?.isGuest) {
      setSelectedExpert(savedUser);
      setIsAuthenticated(true);
      return;
    }

    if (savedUser?.mobile) {
      const validation = validateExpertLogin(savedUser);


      if (validation.ok) {
        setSelectedExpert(savedUser);
        setIsAuthenticated(true);
      } else {
        clearAuthUser();
      }
    }
  }, []);

  const resetAuthForm = () => {
    setAuthStep("lookup");
    setAuthError("");
    setAuthPassword("");
    setAcceptedTerms(false);
    setPendingExpert(null);
    setLookupExpertResult(null);
  };

  const openAuth = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    resetAuthForm();
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  /**
   * فاز اول:
   * فقط بررسی می‌کند کارشناس باید Login کند یا Register.
   */
  const lookupExpert = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const normalizedMobile = normalizeLoginValue(authUsername);

    if (!normalizedMobile) {
      setAuthError("شماره موبایل را وارد کنید");
      return;
    }

    try {
      setLoadingAuth(true);
      setAuthError("");

      const result = await lookupExpertAuth(normalizedMobile);

      setLookupExpertResult(result);
      setPendingExpert(result.expert || null);

      if (result.status === "needs_login") {
        setAuthStep("login");
        return;
      }

      if (result.status === "needs_register") {
        setAuthStep("register");
        return;
      }

      setAuthError("وضعیت احراز هویت نامعتبر است");
    } catch (error) {
      console.error("EXPERT LOOKUP ERROR:", error);
      setAuthError(error.message || "خطا در بررسی وضعیت کارشناس");
    } finally {
      setLoadingAuth(false);
    }
  };

  /**
   * فعلاً منطق login قبلی تو حفظ شده.
   * نکته:
   * این login هنوز از fetchExperts استفاده می‌کند.
   * وقتی روت /api/Auth/Expert/Login آماده شد، همین تابع را به API واقعی وصل می‌کنیم.
   */
  const login = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    setLoadingAuth(true);
    setAuthError("");

    try {
      const result = await loginExpert({
        mobile: authUsername,
        password: authPassword,
      });

      if (!result?.success) {
        setAuthError(result?.message || "ورود ناموفق بود.");
        return;
      }

      const rawExpert = result.expert || null;

      const completeExpert = enrichUserWithPermissions(rawExpert);


      if (!completeExpert) {
        setAuthError("اطلاعات کارشناس از سرور دریافت نشد.");
        return;
      }

      saveAuthUser(completeExpert);
setSelectedExpert(completeExpert);
      // setCurrentUser?.(expert); // اگر داری
      setIsAuthenticated?.(true); // اگر داری
      setIsAuthOpen?.(false); // اگر داری
      setShowWelcome(true);

      setPendingExpert(null);
      setConfirmPassword("");
      setSimpleCode("");
      setAcceptedTerms(false);
    } catch (error) {
      console.error("Expert login error:", error);
      setAuthError(error?.message || "خطا در فرایند ورود");
    } finally {
      setLoadingAuth(false);
    }
  };

  /**
   *  Register.
   *   /api/Auth/Expert/Register
   */
  const register = async (e) => {
    e?.preventDefault();

    setAuthError("");

    if (!authUsername) {
      setAuthError("شماره موبایل وارد نشده است.");
      return;
    }

    if (!authPassword) {
      setAuthError("رمز عبور وارد نشده است.");
      return;
    }

    if (!acceptedTerms) {
      setAuthError("لطفاً قوانین را بپذیرید.");
      return;
    }

    try {
      setLoadingAuth(true);

      const result = await registerExpert({
        mobile: authUsername,
        password: authPassword,
      });

      const expert = result.expert;
      saveAuthUser(expert);
      setSelectedExpert(expert);
      setIsAuthenticated(true);
      setShowWelcome(true);

      closeAuth();
    } catch (err) {
      setAuthError(err.message || "ثبت‌نام انجام نشد.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const backToLookup = () => {
    setAuthStep("lookup");
    setAuthError("");
    setAuthPassword("");
    setAcceptedTerms(false);
  };

  const loginAsGuest = () => {
    saveAuthUser(guestExpert);
    setSelectedExpert(guestExpert);
    setIsAuthenticated(true);
    setIsAuthOpen(false);
  };

  const logout = () => {
    clearAuthUser();
    setSelectedExpert(null);
    setPendingExpert(null);
    setLookupExpertResult(null);
    setIsAuthenticated(false);
    setAuthUsername("");
    setAuthPassword("");
    setAcceptedTerms(false);
    setAuthError("");
    setAuthStep("lookup");
  };

  return {
    isAuthOpen,
    authStep,
    setAuthStep,
    authUsername,
    authPassword,
    acceptedTerms,
    authError,
    loadingAuth,
    confirmPassword,
    simpleCode,
    showWelcome,
    setShowWelcome,
    experts,
    selectedExpert,
    pendingExpert,
    lookupExpertResult,
    isAuthenticated,
    setAuthUsername,
    setAuthPassword,
    setAcceptedTerms,
    setConfirmPassword,
    setSimpleCode,
    openAuth,
    closeAuth,
    lookupExpert,
    login,
    register,
    backToLookup,
    loginAsGuest,
    logout,
  };
}
