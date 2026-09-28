"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, CheckCircle2, X, RefreshCw } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function NetworkStatusBar() {
  const { language, t } = useLanguage();
  const isFil = language === "fil";

  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check initial online status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setIsRestored(false);
      setShowBanner(true);
    }

    const handleOffline = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsOnline(false);
      setIsRestored(false);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setIsRestored(true);
      setShowBanner(true);

      // Auto-hide the emerald green restored banner after exactly 3 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowBanner(false);
        setIsRestored(false);
        timerRef.current = null;
      }, 3000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && typeof navigator !== "undefined") {
        if (!navigator.onLine && isOnline) {
          handleOffline();
        } else if (navigator.onLine && !isOnline) {
          handleOnline();
        }
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnline]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        try {
          await fetch("http://localhost:5000/api/health", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          });
        } catch (_) {
          // Fallback to navigator.onLine if backend is on another host
        } finally {
          clearTimeout(timeoutId);
        }
        setIsOnline(true);
        setIsRestored(true);
        setShowBanner(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowBanner(false);
          setIsRestored(false);
          timerRef.current = null;
        }, 3000);
      } else {
        setIsOnline(false);
        setIsRestored(false);
        setShowBanner(true);
      }
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowBanner(false);
  };

  return (
    <aside
      aria-label="Network Status Announcement"
      role="status"
      aria-live="assertive"
      className={`fixed top-0 inset-x-0 z-[99999] transition-all duration-500 ease-in-out transform ${
        showBanner
          ? "translate-y-0 opacity-100 shadow-2xl"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`relative w-full py-2.5 px-4 sm:px-6 flex flex-col justify-center transition-colors duration-500 text-white ${
          isRestored
            ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-b border-emerald-400/50 shadow-emerald-950/40"
            : "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border-b border-rose-400/40 shadow-red-950/40"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          {/* Status Icon & Message */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isRestored ? (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20 shrink-0 shadow-xs">
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                </span>
                <WifiOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className="truncate">
              {isRestored ? (
                <span className="font-semibold tracking-wide drop-shadow-xs">
                  {t("networkRestoredBanner") ||
                    (isFil
                      ? "Naibalik na ang koneksyon sa internet! Online ka na muli."
                      : "Internet connection restored! You are back online.")}
                </span>
              ) : (
                <span className="font-semibold tracking-wide drop-shadow-xs">
                  {t("networkOfflineBanner") ||
                    (isFil
                      ? "Walang koneksyon sa internet. Pakisuri ang iyong network."
                      : "No internet connection. Please check your network.")}
                </span>
              )}
            </div>
          </div>

          {/* Right Action / Countdown / Close */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isRestored ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono tracking-wider uppercase text-emerald-100 font-semibold shadow-xs">
                <Wifi className="w-3 h-3 text-emerald-200" />
                <span>Online (3s)</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleManualRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer border border-white/20 shadow-xs disabled:opacity-50"
                  title={isFil ? "Subukang kumonekta muli" : "Retry connection"}
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                  <span className="hidden xs:inline">{isFil ? "Subukan Muli" : "Retry"}</span>
                </button>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-[11px] font-mono tracking-wider uppercase text-amber-200 font-semibold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span>{isFil ? "Offline" : "Offline"}</span>
                </span>
              </>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss Network Alert"
              className="p-1 rounded-md bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3-second shrinking countdown progress bar when connection is restored */}
        {isRestored && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 overflow-hidden">
            <div className="h-full bg-white/80 animate-shrink-bar" />
          </div>
        )}
      </div>
    </aside>
  );
}
