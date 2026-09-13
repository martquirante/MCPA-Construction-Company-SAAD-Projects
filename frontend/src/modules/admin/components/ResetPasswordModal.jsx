"use client";

import { useState, useRef, useEffect } from "react";
import {
  CloseIcon,
  ShieldCheckIcon,
  LockIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  KeyRoundIcon,
  RefreshCwIcon,
} from "@/modules/shared/Icons";

export default function ResetPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccessReturn,
}) {
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

  // Sync initial email when modal opens
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

  // Handle countdown timer for Step 2
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

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 1: SEND RESET CODE
  // ═════════════════════════════════════════════════════════════════════════
  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to dispatch reset code.");
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
      setErrorMsg("Network error connecting to security service.");
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 2: 6-BOX SEGMENTED OTP HANDLING
  // ═════════════════════════════════════════════════════════════════════════
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
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

    // Auto-advance to next box
    if (index < 5 && lastDigit) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Move back and clear previous
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
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to resend verification code.");
      } else {
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setErrorMsg("Network error trying to resend code.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Invalid or expired verification code.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(3);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg("Error verifying OTP code.");
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 3: RESET PASSWORD
  // ═════════════════════════════════════════════════════════════════════════
  const handleSaveNewPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New Password and Confirm Password do not match.");
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
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.message && data.message.toLowerCase().includes("expired")) {
          setStep(2);
          setErrorMsg(data.message);
        } else {
          setErrorMsg(data.message || "Failed to update password.");
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(4);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg("Network error while saving new password.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close dialog"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10 relative z-10">
          {/* ================================================================= */}
          {/* STEP 1: EMAIL REQUEST */}
          {/* ================================================================= */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <LockIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Reset Account Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs font-light">
                  Enter your registered administrator email address to receive a secure 6-digit verification code.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-mono">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@mcpa.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm transition-colors"
                    />
                    <MailIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>Send Reset Code</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-mono text-neutral-500 hover:text-amber-500 transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: 6-BOX SEGMENTED OTP VERIFICATION */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Security Verification
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs font-light">
                  Enter the 6-digit verification code sent to{" "}
                  <strong className="text-amber-600 dark:text-amber-400">{email}</strong>
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-mono">
                  {errorMsg}
                </div>
              )}

              {/* 6 Segmented Input Boxes */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-6" onPaste={handleOtpPaste}>
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
                    className="w-11 sm:w-12 h-13 sm:h-14 text-center font-mono text-xl font-bold rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                ))}
              </div>

              {/* Resend Timer / Action Button */}
              <div className="text-center mb-6">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                    <span>Resend Verification Code</span>
                  </button>
                ) : (
                  <p className="text-xs font-mono text-neutral-500">
                    Resend code in{" "}
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {formatTime(secondsRemaining)}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isLoading || otpDigits.join("").length !== 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon className="w-4 h-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg("");
                    }}
                    className="text-xs font-mono text-neutral-500 hover:text-amber-500 transition-colors"
                  >
                    ← Change Email Address
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: CREATE NEW PASSWORD */}
          {/* ================================================================= */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <KeyRoundIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Create New Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs font-light">
                  Your identity has been verified. Enter your new administrative master password.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-mono">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                    New Password (Min. 6 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-amber-500 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-mono transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-mono text-neutral-500 hover:text-amber-500 transition-colors"
                  >
                    ← Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: SUCCESS COMPLETION */}
          {/* ================================================================= */}
          {step === 4 && (
            <div className="text-center py-4 animate-fadeIn">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500 mb-6 animate-bounce">
                <CheckCircle2Icon className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Password Reset Successful!
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-xs mx-auto">
                Your administrative password has been updated. You may now sign in using your new credentials.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccessReturn) onSuccessReturn(email);
                  }}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
