"use client";

import { useState, useRef, useEffect } from "react";
import {
  CloseIcon,
  LockIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@/modules/shared/Icons";
import { useLanguage } from "@/modules/shared/LanguageContext";
import { PORTAL_TRANSLATIONS } from "../data/portalTranslations";

/**
 * Client Portal Password Reset Modal
 * Strictly handles Client & Homeowner accounts with multi-step OTP verification.
 * Adheres to human UI/UX architectural design principles (anti-vibe-coded).
 */
export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccessReturn,
}) {
  const { language } = useLanguage();
  const t =
    PORTAL_TRANSLATIONS[language]?.forgotPasswordModal ||
    PORTAL_TRANSLATIONS.en.forgotPasswordModal;

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass, 4: Success
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef([]);
  const timerRef = useRef(null);

  // Sync initial email when modal opens and lock body scroll
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || "");
      setOtpDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setIsLoading(false);
      setShowPassword(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      clearInterval(timerRef.current);
    }
    return () => {
      document.body.style.overflow = "";
      clearInterval(timerRef.current);
    };
  }, [isOpen, initialEmail]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Countdown timer for Step 2 OTP
  const startResendTimer = () => {
    clearInterval(timerRef.current);
    setSecondsRemaining(120);
    setCanResend(false);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  // =========================================================================
  // STEP 1: SEND RESET CODE (CLIENT PORTAL ONLY)
  // =========================================================================
  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t.errEmailRequired);
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          portalType: "client",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || t.errNetwork);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(2);
      startResendTimer();
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(t.errNetwork);
    }
  };

  // =========================================================================
  // STEP 2: 6-BOX SEGMENTED OTP HANDLING
  // =========================================================================
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const lastDigit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = lastDigit;
    setOtpDigits(newDigits);

    if (index < 5 && lastDigit) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg("");
    startResendTimer();
    setOtpDigits(["", "", "", "", "", ""]);

    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          portalType: "client",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || t.errNetwork);
      } else {
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setErrorMsg(t.errNetwork);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setErrorMsg(t.errOtpLength);
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          portalType: "client",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || t.errNetwork);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(3);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(t.errNetwork);
    }
  };

  // =========================================================================
  // STEP 3: RESET PASSWORD
  // =========================================================================
  const handleSaveNewPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg(t.errPasswordLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t.errPasswordMismatch);
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const code = otpDigits.join("");
      const res = await fetch("/api/auth/reset-password-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          newPassword: newPassword.trim(),
          portalType: "client",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.message && data.message.toLowerCase().includes("expired")) {
          setStep(2);
          setErrorMsg(data.message);
        } else {
          setErrorMsg(data.message || t.errNetwork);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(4);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(t.errNetwork);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#111317] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-7 overflow-hidden transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        {/* Eyebrow Category Tag */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <LockIcon className="w-3 h-3 text-amber-500" />
            <span>{t.clientBadge || "CLIENT ACCOUNT RECOVERY"}</span>
          </span>
        </div>

        {/* ================================================================= */}
        {/* STEP 1: EMAIL REQUEST */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-4">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {t.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <MailIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-neutral-950 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    <span>{t.sendingCode}</span>
                  </>
                ) : (
                  <span>{t.sendCodeButton}</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer font-medium"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>{t.backToLogin}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: 6-BOX SEGMENTED OTP VERIFICATION */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-4">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {t.step2Title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.step2Subtitle}{" "}
                <span className="font-semibold text-neutral-900 dark:text-white break-all">
                  {email}
                </span>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* 6 Segmented Input Boxes */}
            <div
              className="flex items-center justify-between gap-1.5 sm:gap-2 my-4"
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 sm:w-12 h-12 text-center font-mono text-xl font-bold rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                />
              ))}
            </div>

            {/* Resend Timer / Action Button */}
            <div className="text-center mb-4">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <RefreshCwIcon className="w-3.5 h-3.5" />
                  <span>{t.resendCodeButton}</span>
                </button>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.resendCodeIn}{" "}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {formatTime(secondsRemaining)}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isLoading || otpDigits.join("").length !== 6}
                onClick={handleVerifyOtp}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-neutral-950 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    <span>{t.verifyingCode}</span>
                  </>
                ) : (
                  <span>{t.verifyCodeButton}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>{t.changeEmail}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: CREATE NEW PASSWORD */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-4">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {t.step3Title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.step3Subtitle}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t.newPasswordLabel}
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <KeyRoundIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Password checks helper */}
              <div className="space-y-1 pt-1 pb-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      newPassword.length >= 6
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    ✓
                  </span>
                  <span>Minimum 6 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      newPassword && confirmPassword && newPassword === confirmPassword
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    ✓
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-neutral-950 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    <span>{t.savingPassword}</span>
                  </>
                ) : (
                  <span>{t.savePasswordButton}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: SUCCESS COMPLETION */}
        {/* ================================================================= */}
        {step === 4 && (
          <div className="text-center py-2 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3.5">
              <CheckCircle2Icon className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t.successTitle}
            </h3>

            <p className="mt-1.5 text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {t.successSubtitle}
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSuccessReturn) onSuccessReturn(email);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-neutral-950 font-semibold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{t.returnToSignIn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
