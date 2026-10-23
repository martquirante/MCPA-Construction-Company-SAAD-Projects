"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  KeyRound,
} from "lucide-react";

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  // Component states: 'verifying' | 'valid' | 'invalid' | 'submitting' | 'success'
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [staffInfo, setStaffInfo] = useState(null);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Validate Token on Mount
  useEffect(() => {
    let isMounted = true;

    async function verifyToken() {
      if (!token || token.trim().length < 32) {
        if (isMounted) {
          setStatus("invalid");
          setErrorMessage("The activation link is missing or malformed. Please verify the URL in your invitation email.");
        }
        return;
      }

      try {
        const res = await fetch(`/api/admin/verify-invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success && data.valid) {
          setStaffInfo(data.user);
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorMessage(data.message || "This invitation link is invalid or has expired.");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("invalid");
          setErrorMessage("Unable to connect to security server. Please ensure backend is reachable.");
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password Strength and Criteria Validations (Client signup style)
  const criteria = useMemo(() => {
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const missing = [];
    if (!hasMinLen) missing.push("8+ characters");
    if (!hasUpper || !hasLower) missing.push("letters (A-Z/a-z)");
    if (!hasNumOrSpecial) missing.push("number or symbol");

    const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumOrSpecial;

    return {
      hasMinLen,
      hasUpper,
      hasLower,
      hasNumOrSpecial,
      passwordsMatch,
      isPasswordValid,
      missing,
      allPassed: isPasswordValid && passwordsMatch,
    };
  }, [password, confirmPassword]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!criteria.allPassed) {
      if (!criteria.passwordsMatch) {
        setFormError("The passwords you entered do not match.");
      } else {
        setFormError("Please satisfy all password security criteria before continuing.");
      }
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/admin/complete-setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("valid");
        setFormError(data.message || "Failed to establish password. Please try again.");
      }
    } catch (err) {
      setStatus("valid");
      setFormError("Network error while submitting credentials. Please try again.");
    }
  };

  // Auto redirect countdown on success
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/admin");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, router]);

  // Resolve role presentation
  const roleMeta = useMemo(() => {
    const rawRole = (staffInfo?.role || "").toLowerCase();
    if (rawRole === "architect") {
      return {
        label: "Project Architect",
        icon: Building,
        colorClass: "text-violet-600 dark:text-violet-400",
      };
    }
    if (rawRole === "engineer") {
      return {
        label: "Site Engineer",
        icon: Sparkles,
        colorClass: "text-emerald-600 dark:text-emerald-400",
      };
    }
    return {
      label: "System Administrator",
      icon: ShieldCheck,
      colorClass: "text-amber-600 dark:text-amber-400",
    };
  }, [staffInfo]);

  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#0a0c10] text-neutral-900 dark:text-white flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950 font-sans relative overflow-x-hidden">
      {/* Background Architectural Grid Accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgba(217, 119, 6, 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png"
            alt="MCPA Construction and Supply"
            className="h-9 sm:h-11 w-auto object-contain dark:hidden transition-transform duration-300 group-hover:scale-105"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png"
            alt="MCPA Construction and Supply"
            className="h-9 sm:h-11 w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>MCPA Staff Portal</span>
        </div>
      </header>

      {/* Main Body Card */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 pt-4 pb-12 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="bg-white/95 dark:bg-[#11141c]/95 border border-neutral-200/90 dark:border-white/[0.08] rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl transition-all">
          {/* ── State 1: Verifying Token ─────────────────────────────────── */}
          {status === "verifying" && (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Verifying Invitation Token</h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Confirming cryptographic credentials and team onboarding clearance with MCPA Security Engine…
              </p>
            </div>
          )}

          {/* ── State 2: Invalid or Expired Token ────────────────────────── */}
          {status === "invalid" && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Activation Link Expired or Invalid
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  {errorMessage}
                </p>
              </div>

              <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                <p>Staff activation links are single-use and expire strictly 48 hours after dispatch.</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors text-center cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
                >
                  <span>Go to Admin Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors text-center cursor-pointer"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}

          {/* ── State 3: Valid Token — Set Password Form ─────────────────── */}
          {(status === "valid" || status === "submitting") && (
            <div className="space-y-6">
              {/* Account Induction Identity Header */}
              <div className="space-y-2 pb-5 border-b border-neutral-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <RoleIcon className={`w-3.5 h-3.5 ${roleMeta.colorClass}`} />
                    <span className={`text-xs font-semibold ${roleMeta.colorClass}`}>
                      {roleMeta.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                    Official Onboarding
                  </span>
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Set Up Your Account Password
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Welcome to MCPA, <strong className="text-neutral-800 dark:text-neutral-200">{staffInfo?.fullName || "Colleague"}</strong>.
                  </p>
                </div>

                {/* Email text line (No button-like container or background) */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {staffInfo?.email || emailParam}
                  </span>
                  {staffInfo?.occupation && (
                    <span className="text-neutral-400 hidden sm:inline">
                      • {staffInfo.occupation}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Error Message (Pure text & icon, no button-like background) */}
              {formError && (
                <div className="flex items-center gap-2 text-xs font-sans text-rose-600 dark:text-rose-400 py-0.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Password Setup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input 1: New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    New Password <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="Enter minimum 8 characters…"
                      disabled={status === "submitting"}
                      autoFocus
                      required
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/90 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 transition-all"
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 cursor-pointer transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Password Security Reminder Text (1 sentence, client signup style) */}
                  {(() => {
                    if (password && criteria.isPasswordValid) {
                      return (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium pl-0.5 animate-in fade-in duration-200">
                          <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                          <span>All security criteria met</span>
                        </div>
                      );
                    }

                    const missingCount = criteria.missing.length;
                    let colorClass = "text-neutral-500 dark:text-neutral-400 font-normal";
                    let dotClass = "bg-neutral-400 dark:bg-neutral-500";
                    let prefix = "Requires";

                    if (password) {
                      prefix = "Missing";
                      if (missingCount >= 3) {
                        colorClass = "text-red-500 dark:text-red-400 font-medium";
                        dotClass = "bg-red-500";
                      } else if (missingCount === 2) {
                        colorClass = "text-orange-500 dark:text-orange-400 font-medium";
                        dotClass = "bg-orange-500";
                      } else {
                        colorClass = "text-amber-500 dark:text-amber-400 font-medium";
                        dotClass = "bg-amber-500";
                      }
                    }

                    return (
                      <div className={`mt-1.5 flex items-start gap-1.5 text-[11.5px] pl-0.5 transition-colors ${colorClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${dotClass}`} />
                        <p className="leading-tight">
                          <strong className="font-semibold">{prefix}:</strong>{" "}
                          {criteria.missing.length
                            ? criteria.missing.join(", ")
                            : "8+ characters, letters (A-Z/a-z), number (0-9), symbol (!@#$)"}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Input 2: Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Confirm Password <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="Repeat new password…"
                      disabled={status === "submitting"}
                      required
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/90 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 cursor-pointer transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time 1-Sentence Match Status */}
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] pl-0.5 animate-in fade-in duration-200">
                      {criteria.passwordsMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5] shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Passwords match precisely</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="text-rose-500 dark:text-rose-400 font-medium">Passwords do not match yet</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={!criteria.allPassed || status === "submitting"}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-200 dark:disabled:bg-white/10 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-4"
                >
                  {status === "submitting" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encrypting &amp; Activating Account…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Activate Account &amp; Save Password</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── State 4: Setup Successful ────────────────────────────────── */}
          {status === "success" && (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authentication Configured</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Welcome to the Team!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Your password has been securely established with bcrypt encryption. Your account is now fully active.
                </p>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Redirecting you to the MCPA Administrative Portal sign-in in{" "}
                <span className="font-mono font-bold text-amber-500">{redirectCountdown}s</span>…
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Admin Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
        <p>© {new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.</p>
        <p className="mt-0.5">2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan • (0949) 775 8239</p>
      </footer>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#0a0c10] flex items-center justify-center text-neutral-500">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-sans">Loading MCPA Password Setup…</span>
          </div>
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  );
}
