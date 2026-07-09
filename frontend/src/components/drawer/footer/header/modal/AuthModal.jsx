import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import {
    validateLoginMobile,
    validateLoginPassword,
} from "../../utils/validation";
import { X, Check } from "lucide-react";
import "./AuthModal.css";

const AuthModal = ({
    isOpen,
    onClose,
    authStep = "lookup",
    pendingExpert,
    username,
    password,
    onUsernameChange,
    onPasswordChange,
    acceptedTerms,
    onAcceptedTermsChange,
    loading,
    error,
    onLookup,
    onLogin,
    onRegister,
    onBackToLookup,
    confirmPassword,
    onConfirmPasswordChange,
    simpleCode,
    onSimpleCodeChange,
}) => {
    const [mobileError, setMobileError] = useState("");
    const [passError, setPassError] = useState("");

    const isLookupStep = authStep === "lookup";
    const isLoginStep = authStep === "login";
    const isRegisterStep = authStep === "register";

    useEffect(() => {
        setMobileError(validateLoginMobile(username));
    }, [username]);

    useEffect(() => {
        if (isLookupStep) {
            setPassError("");
            return;
        }

        setPassError(validateLoginPassword(password));
    }, [password, isLookupStep]);

    if (!isOpen) return null;

    const getTitle = () => {
        if (isLookupStep) return "احراز هویت کارشناس";
        if (isLoginStep) return "ورود کارشناس";
        if (isRegisterStep) return "ثبت‌نام کارشناس";
        return "احراز هویت";
    };

    const getSubmitText = () => {
        if (isLookupStep) return "ادامه";
        if (isLoginStep) return "ورود";
        if (isRegisterStep) return "ثبت‌نام";
        return "ادامه";
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mobileError) return;

        if (isLookupStep) {
            onLookup?.(e);
            return;
        }

        if (passError) return;

        if (isLoginStep) {
            onLogin?.(e);
            return;
        }

        if (isRegisterStep) {
            onRegister?.(e);
            if (password !== confirmPassword) {
                setPassError("رمز عبور و تکرار آن یکسان نیستند.");
                return;
            }
            if (simpleCode !== "0000") {
                setPassError("کد امنیتی نادرست است.");
                return;
            }
        }
    };

    return (
        <div className="authModal" role="dialog" aria-modal="true">
            <button
                type="button"
                className="authModal__backdrop"
                onClick={() => onClose?.()}
            />

            <div className="authModal__panel">
                <div className="authModal__header">
                    <h3 className="authModal__title">{getTitle()}</h3>

                    <button
                        type="button"
                        className="authModal__close"
                        onClick={() => onClose?.()}
                    >
                        ✕
                    </button>
                </div>

                <form className="authModal__body" onSubmit={handleSubmit}>
                    {/* ===== موبایل ===== */}
                    <label className="authModal__label">شماره موبایل</label>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                            className="authModal__input"
                            value={username}
                            onChange={(e) => onUsernameChange?.(e.target.value)}
                            placeholder="09xxxxxxxxx"
                            disabled={!isLookupStep || loading}
                            style={{
                                borderColor: username
                                    ? mobileError
                                        ? "#ef4444"
                                        : "#10b981"
                                    : undefined,
                            }}
                        />

                        {username && (
                            <Badge variant={mobileError ? "danger" : "success"}>
                                {mobileError ? <X size={14} /> : <Check size={14} />}
                                {mobileError ? "نامعتبر" : "معتبر"}
                            </Badge>
                        )}
                    </div>

                    {mobileError && (
                        <p className="authModal__errorText">{mobileError}</p>
                    )}

                    {/* ===== اطلاعات کارشناس بعد از Lookup ===== */}
                    {pendingExpert?.name && !isLookupStep && (
                        <div className="authModal__expertBox">
                            <div>
                                <strong>{pendingExpert.name}</strong>
                            </div>

                            {pendingExpert.code && (
                                <div>کد کارشناس: {pendingExpert.code}</div>
                            )}
                        </div>
                    )}

                    {/* ===== رمز عبور فقط در Login/Register ===== */}
                    {!isLookupStep && (
                        <>

                            <label className="authModal__label">
                                {isRegisterStep ? "رمز عبور جدید" : "رمز عبور"}
                            </label>

                            <div
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <input
                                    className="authModal__input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => onPasswordChange?.(e.target.value)}
                                    placeholder={
                                        isRegisterStep ? "رمز عبور دلخواه" : "رمز عبور"
                                    }
                                    disabled={loading}
                                    style={{
                                        borderColor: password
                                            ? passError
                                                ? "#ef4444"
                                                : "#10b981"
                                            : undefined,
                                    }}
                                />


                                {password && (
                                    <Badge variant={passError ? "danger" : "success"}>
                                        {passError ? <X size={14} /> : <Check size={14} />}
                                        {passError ? "نامعتبر" : "معتبر"}
                                    </Badge>
                                )}
                            </div>

                            {passError && (
                                <p className="authModal__errorText">{passError}</p>
                            )}

                            {isRegisterStep && (
                                <>
                                    <label className="authModal__label">تکرار رمز عبور</label>

                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            className="authModal__input"
                                            type="password"
                                            value={confirmPassword || ""}
                                            onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
                                            placeholder="رمز عبور را دوباره وارد کنید"
                                            disabled={loading}
                                        />

                                        {confirmPassword && confirmPassword === password && (
                                            <Badge variant="success">
                                                <Check size={14} />
                                                یکسان
                                            </Badge>
                                        )}
                                    </div>

                                    <label className="authModal__label">کد امنیتی</label>

                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            className="authModal__input"
                                            type="number"
                                            value={simpleCode || ""}
                                            onChange={(e) => onSimpleCodeChange?.(e.target.value)}
                                            placeholder="رمز یکبار مصرف را وارد کنید"
                                            disabled={loading}
                                        />

                                        {simpleCode && (
                                            <Badge variant={simpleCode === "1234" ? "success" : "danger"}>
                                                {simpleCode === "0000" ? <Check size={14} /> : <X size={14} />}
                                                {simpleCode === "0000" ? "درست" : "اشتباه"}
                                            </Badge>
                                        )}
                                    </div>

                                    {simpleCode && simpleCode !== "0000" && (
                                        <p className="authModal__errorText">کد امنیتی نادرست است.</p>
                                    )}
                                </>
                            )}


                            {/* ===== قوانین ===== */}
                            <label className="authModal__checkbox">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) =>
                                        onAcceptedTermsChange?.(e.target.checked)
                                    }
                                    disabled={loading}
                                />
                                <span>قوانین مجموعه را می‌پذیرم</span>
                            </label>

                        </>
                    )}

                    {/* ===== خطا از سرور ===== */}
                    {error && <div className="authModal__error">{error}</div>}

                    <div className="authModal__actions">
                        {!isLookupStep && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => onBackToLookup?.()}
                                disabled={loading}
                            >
                                تغییر شماره
                            </Button>
                        )}

                        <Button type="submit" disabled={loading}>
                            {loading ? "در حال پردازش..." : getSubmitText()}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
