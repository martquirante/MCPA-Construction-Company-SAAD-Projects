"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheckIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightIcon,
  CloseIcon,
  CheckIcon,
} from "@/modules/shared/Icons";
import { useLanguage } from "@/modules/shared/LanguageContext";
import { saveBookingIntent } from "@/modules/shared/bookingAuthHelper";

export default function BookingAuthModal({
  isOpen = true,
  onClose,
  redirectUrl = "/book",
  selectedStyle = "",
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const isFil = language === "fil";

  if (!isOpen) return null;

  const handleGoToAuth = (mode = "login") => {
    // Preserve originating booking intent
    saveBookingIntent(redirectUrl, { selectedStyle });

    const target = `/portal?redirect=${encodeURIComponent(redirectUrl)}&mode=${mode}`;
    router.push(target);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 transition-all">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Header Icon & Close */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>

          <Link
            href="/"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            title={isFil ? "Bumalik sa Home" : "Return to Home"}
          >
            <CloseIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold tracking-[0.14em] uppercase mb-2 border border-amber-500/25">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>
            {isFil ? "Kinakailangan ang Account • Konsultasyon" : "Account Required • Consultation"}
          </span>
        </div>

        {/* Title */}
        <h2
          id="booking-auth-modal-title"
          className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white leading-snug"
        >
          {isFil ? "Mag-log in o Gumawa ng Account" : "Please Sign In or Create an Account"}
        </h2>

        {/* Subtitle / Explanation */}
        <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
          {isFil
            ? "Upang makapag-proceed sa inquiry at appointment booking, kailangan munang mag-log in o gumawa ng libreng account. Sa ganitong paraan, ligtas na ma-save ang iyong project parameters at masusubaybayan mo ang updates sa Client Portal."
            : "To proceed with your consultation inquiry and appointment booking, please sign in or create a free client account first. This ensures your project brief is securely saved and trackable in your Client Portal."}
        </p>

        {/* Style Preview Note if present */}
        {selectedStyle && (
          <div className="mt-3.5 flex items-center gap-2 p-2.5 rounded-lg bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/5 text-xs font-mono text-neutral-700 dark:text-neutral-300">
            <CheckIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {isFil ? "Napiling Estilo:" : "Selected Style:"}{" "}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">{selectedStyle}</strong>
            </span>
          </div>
        )}

        {/* Benefits list */}
        <div className="my-5 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isFil
                ? "Direktang appointment calendar confirmation (Google Meet o In-Person)"
                : "Direct appointment calendar confirmation (Google Meet or In-Person)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isFil
                ? "Awtomatikong pag-attach ng project brief sa iyong Client Portal"
                : "Automated project brief attachment to your Client Portal"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isFil
                ? "Rekta babalik sa form pagkatapos mag-log in / mag-sign up"
                : "Instant return to booking form right after login / signup"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Button 1: Sign In */}
          <button
            type="button"
            onClick={() => handleGoToAuth("login")}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider font-mono bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <span>{isFil ? "Mag-log in sa Aking Account" : "Sign In to Existing Account"}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>

          {/* Button 2: Sign Up */}
          <button
            type="button"
            onClick={() => handleGoToAuth("signup")}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider font-mono border border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <UserIcon className="w-4 h-4 text-amber-500" />
            <span>{isFil ? "Gumawa ng Bagong Account (Sign Up)" : "Create New Account (Sign Up)"}</span>
          </button>
        </div>

        {/* Bottom Home Link */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-white/5 text-center">
          <Link
            href="/"
            className="text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>{isFil ? "Bumalik muna sa Homepage" : "Return to Homepage"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
