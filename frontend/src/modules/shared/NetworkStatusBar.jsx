"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff, Signal, SignalZero, X, RefreshCw } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function NetworkStatusBar() {
  const { language, t } = useLanguage();
  const isFil = language === "fil";

  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const detectConnectionType = useCallback(() => {
    if (typeof navigator === "undefined") return "wifi";
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (conn) {
      if (conn.type === "cellular") {
        return "cellular";
      }
      if (conn.type === "wifi" || conn.type === "ethernet") {
        return "wifi";
      }
      const isMobile =
        typeof window !== "undefined" &&
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile && conn.effectiveType && conn.type !== "wifi" && conn.type !== "ethernet") {
        return "cellular";
      }
    }

    return "wifi";
  }, []);

  const [connectionType, setConnectionType] = useState(detectConnectionType);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for connection changes (e.g. WiFi <-> Cellular Data)
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const handleConnectionChange = () => {
      setConnectionType(detectConnectionType());
    };

    if (conn && conn.addEventListener) {
      conn.addEventListener("change", handleConnectionChange);
    }

    // Check initial online status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      requestAnimationFrame(() => {
        setIsOnline(false);
        setIsRestored(false);
        setShowBanner(true);
      });
    }

    const handleOffline = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setConnectionType(detectConnectionType());
      setIsOnline(false);
      setIsRestored(false);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setConnectionType(detectConnectionType());
      setIsOnline(true);
      setIsRestored(true);
      setShowBanner(true);

      // Auto-hide the restored toast after exactly 3 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowBanner(false);
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
      if (conn && conn.removeEventListener) {
        conn.removeEventListener("change", handleConnectionChange);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnline, detectConnectionType]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch("/api/health", {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
          }).catch(() => {});
        } catch (_) {
          // Fallback gracefully
        } finally {
          clearTimeout(timeoutId);
        }

        setConnectionType(detectConnectionType());
        setIsOnline(true);
        setIsRestored(true);
        setShowBanner(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowBanner(false);
          timerRef.current = null;
        }, 3000);
      } else {
        setConnectionType(detectConnectionType());
        setIsOnline(false);
        setIsRestored(false);
        setShowBanner(true);
      }
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowBanner(false);
  };

  return (
    <aside
      aria-label="Network Status Announcement"
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 sm:bottom-7 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[99999] flex justify-center pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        showBanner
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
    >
      <div
        className={`pointer-events-auto w-full sm:w-auto max-w-lg flex items-center justify-between gap-3 sm:gap-4 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-neutral-900/95 dark:bg-neutral-950/95 text-neutral-100 backdrop-blur-xl border transition-colors duration-300 select-none ${
          isRestored
            ? "border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.18)]"
            : "border-rose-500/30 shadow-[0_12px_40px_rgba(244,63,94,0.18)]"
        }`}
      >
        {/* Left: Icon according to WiFi / ISP vs Cellular Mobile Data (No dots, no checkmarks) */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
            isRestored
              ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/25 text-rose-400"
          }`}
        >
          {isRestored ? (
            connectionType === "cellular" ? (
              <Signal className="w-4 h-4 text-emerald-400" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400" />
            )
          ) : connectionType === "cellular" ? (
            <SignalZero className="w-4 h-4 text-rose-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400" />
          )}
        </div>

        {/* Center: Clean Status Message */}
        <div className="flex-1 min-w-0 pr-1 text-xs sm:text-sm font-medium leading-tight">
          {isRestored ? (
            <span className="text-emerald-100 font-semibold tracking-tight">
              {t("networkRestoredBanner") ||
                (isFil
                  ? "Naibalik na ang koneksyon sa internet! Online ka na muli."
                  : "Internet connection restored! You are back online.")}
            </span>
          ) : (
            <span className="text-rose-100 font-medium tracking-tight">
              {t("networkOfflineBanner") ||
                (isFil
                  ? "Walang koneksyon sa internet. Pakisuri ang iyong network."
                  : "No internet connection. Please check your network.")}
            </span>
          )}
        </div>

        {/* Right Actions: Retry button (when offline) & subtle Dismiss button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isRestored && (
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white tracking-wide transition-all cursor-pointer border border-white/10 shadow-xs disabled:opacity-50"
              title={isFil ? "Subukang kumonekta muli" : "Retry connection"}
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">{isFil ? "Subukan Muli" : "Retry"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Network Alert"
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
