"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  WifiIcon,
  WifiOffIcon,
  SignalIcon,
  SignalZeroIcon,
  CloseIcon,
  RefreshCwIcon,
} from "./Icons";
import { useLanguage } from "./LanguageContext";


export default function NetworkStatusBar() {
  const { language, t } = useLanguage();
  const isFil = language === "fil";

  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isOnlineRef = useRef(true);

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

  const [connectionType, setConnectionType] = useState("wifi");

  // Keep isOnlineRef in sync
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Dedicated 3-second auto-dismiss effect whenever connection is restored
  useEffect(() => {
    if (showBanner && isRestored) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, isRestored]);

  // Network event listeners attached ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect initial state
    setConnectionType(detectConnectionType());
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setIsRestored(false);
      setShowBanner(true);
    }

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

    const handleOffline = () => {
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
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && typeof navigator !== "undefined") {
        if (!navigator.onLine && isOnlineRef.current) {
          handleOffline();
        } else if (navigator.onLine && !isOnlineRef.current) {
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
    };
  }, [detectConnectionType]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch("/api/translations", {
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
    setShowBanner(false);
  };

  return (
    <aside
      aria-label="Network Status Announcement"
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-2rem)] sm:w-auto max-w-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        showBanner
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto visible"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none invisible"
      }`}
    >
      <div
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[8px] bg-white/95 dark:bg-[#0c0e12]/95 text-neutral-900 dark:text-neutral-100 backdrop-blur-xl border shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] transition-colors duration-200 ${
          isRestored
            ? "border-emerald-500/40 dark:border-emerald-500/30"
            : "border-rose-500/40 dark:border-rose-500/30"
        }`}
      >
        {/* Left: Architectural Icon Badge with explicit SVG sizing */}
        <div
          className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 border transition-colors ${
            isRestored
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {isRestored ? (
            connectionType === "cellular" ? (
              <SignalIcon className="w-[15px] h-[15px]" strokeWidth={2.25} />
            ) : (
              <WifiIcon className="w-[15px] h-[15px]" strokeWidth={2.25} />
            )
          ) : connectionType === "cellular" ? (
            <SignalZeroIcon className="w-[15px] h-[15px]" strokeWidth={2.25} />
          ) : (
            <WifiOffIcon className="w-[15px] h-[15px]" strokeWidth={2.25} />
          )}
        </div>

        {/* Center: Status Message with High Contrast & Hierarchy */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`font-mono text-[9px] tracking-widest uppercase font-semibold ${
                isRestored
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {isRestored
                ? (isFil ? "KONEKSYON NAIBALIK" : "CONNECTION RESTORED")
                : (isFil ? "WALANG INTERNET" : "SYSTEM OFFLINE")}
            </span>
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-tight truncate sm:whitespace-normal">
            {isRestored
              ? (t("networkRestoredBanner") ||
                  (isFil
                    ? "Naibalik na ang koneksyon. Online ka na muli."
                    : "Internet restored. You are back online."))
              : (t("networkOfflineBanner") ||
                  (isFil
                    ? "Walang koneksyon. Pakisuri ang network."
                    : "No internet. Please check your network."))}
          </p>
        </div>

        {/* Right Actions: Retry button (when offline) & Close button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isRestored && (
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border dark:border-white/10 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              title={isFil ? "Subukang kumonekta muli" : "Retry connection"}
            >
              <RefreshCwIcon className={`w-[11px] h-[11px] ${isRetrying ? "animate-spin" : ""}`} strokeWidth={2.5} />
              <span className="hidden xs:inline">{isFil ? "Subukan" : "Retry"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Network Alert"
            className="p-1 rounded-[4px] text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
