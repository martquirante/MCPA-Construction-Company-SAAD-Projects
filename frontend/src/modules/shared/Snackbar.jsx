"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

/**
 * World-Class Architectural Snackbar / Toast System
 * - Positioned at Bottom Right (desktop & mobile-safe)
 * - Masterclass human UI/UX craft (no generic AI/vibe-coded styles)
 * - Seamless Light & Dark mode adaptation
 * - Micro-interactions: Pause-on-hover, 60fps smooth progress countdown, tactile dismiss
 * - Auto-detects severity (success, error, warning, info)
 */

export function resolveToastType(message, explicitType) {
  if (explicitType) {
    const t = String(explicitType).toLowerCase();
    if (t.includes("err") || t.includes("fail") || t.includes("danger")) return "error";
    if (t.includes("warn")) return "warning";
    if (t.includes("info") || t.includes("notice")) return "info";
    return "success";
  }

  if (!message) return "success";
  const str = typeof message === "string" ? message : (message.message || "");
  const lower = str.toLowerCase();

  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("could not") ||
    lower.includes("cannot") ||
    lower.includes("rejected") ||
    lower.includes("invalid") ||
    lower.includes("unable")
  ) {
    return "error";
  }

  if (
    lower.includes("warn") ||
    lower.includes("please") ||
    lower.includes("maximum") ||
    lower.includes("⚠️") ||
    lower.includes("caution") ||
    lower.includes("must be")
  ) {
    return "warning";
  }

  if (
    lower.includes("refresh") ||
    lower.includes("switched") ||
    lower.includes("connecting") ||
    lower.includes("attendance") ||
    lower.includes("notice") ||
    lower.includes("info")
  ) {
    return "info";
  }

  return "success";
}

const TYPE_CONFIG = {
  success: {
    tag: "CONFIRMED",
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    pulseColor: "bg-emerald-500",
    progressColor: "bg-emerald-500 dark:bg-emerald-400",
    accentGlow: "from-emerald-500/10 via-transparent to-transparent",
  },
  error: {
    tag: "SYSTEM NOTICE",
    icon: AlertCircle,
    badgeBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border-rose-500/25",
    iconColor: "text-rose-600 dark:text-rose-400",
    pulseColor: "bg-rose-500",
    progressColor: "bg-rose-500 dark:bg-rose-400",
    accentGlow: "from-rose-500/10 via-transparent to-transparent",
  },
  warning: {
    tag: "ATTENTION REQUIRED",
    icon: AlertTriangle,
    badgeBg: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
    pulseColor: "bg-amber-500",
    progressColor: "bg-amber-500 dark:bg-amber-400",
    accentGlow: "from-amber-500/10 via-transparent to-transparent",
  },
  info: {
    tag: "TELEMETRY",
    icon: Info,
    badgeBg: "bg-neutral-500/10 text-neutral-700 dark:bg-white/10 dark:text-neutral-200 border-neutral-300 dark:border-white/15",
    iconColor: "text-neutral-700 dark:text-neutral-300",
    pulseColor: "bg-neutral-400 dark:bg-neutral-300",
    progressColor: "bg-neutral-400 dark:bg-neutral-500",
    accentGlow: "from-neutral-500/10 via-transparent to-transparent",
  },
};

function SnackbarItem({ toast, rawMessage, onClose, duration }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);
  const rafRef = useRef(null);

  const explicitType = typeof toast === "object" && toast !== null ? toast.type : null;
  const explicitTitle = typeof toast === "object" && toast !== null ? toast.title : null;
  const toastDuration = typeof toast === "object" && toast?.duration ? toast.duration : duration;

  const resolvedType = resolveToastType(rawMessage, explicitType);
  const config = TYPE_CONFIG[resolvedType] || TYPE_CONFIG.success;
  const IconComponent = config.icon;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const tick = (now) => {
      if (!isHovered) {
        if (!startTimeRef.current) startTimeRef.current = now;
        const delta = now - startTimeRef.current;
        startTimeRef.current = now;
        elapsedRef.current += delta;

        const remainingPct = Math.max(0, 100 - (elapsedRef.current / toastDuration) * 100);
        setProgress(remainingPct);

        if (elapsedRef.current >= toastDuration) {
          handleDismiss();
          return;
        }
      } else {
        startTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [toastDuration, isHovered, handleDismiss]);

  // Escape key listener to close toast
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] pointer-events-auto max-w-[calc(100vw-2rem)] sm:max-w-md w-full sm:w-auto"
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ease-out select-none
          /* Light mode surface */
          bg-white/95 text-neutral-900 border border-neutral-200/90 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] backdrop-blur-xl
          /* Dark mode surface */
          dark:bg-[#10121a]/95 dark:text-neutral-100 dark:border-white/10 dark:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] dark:ring-1 dark:ring-white/[0.05]
          ${
            isExiting
              ? "opacity-0 translate-y-3 scale-95"
              : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 duration-300"
          }
        `}
      >
        {/* Subtle architectural ambient gradient accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.accentGlow} pointer-events-none opacity-40 dark:opacity-20`}
        />

        {/* Content body */}
        <div className="relative p-3.5 sm:p-4 flex items-start gap-3.5 z-10">
          {/* Status Icon Pill */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${config.badgeBg}`}
          >
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>

          {/* Text block */}
          <div className="min-w-0 flex-1 pt-0.5">
            {/* Monospace Architectural Eyebrow */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                {explicitTitle || config.tag}
              </span>
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.pulseColor}`}
                />
              </span>
            </div>

            {/* Message Body */}
            <p className="text-[13px] font-medium leading-relaxed font-sans text-neutral-800 dark:text-neutral-200 break-words">
              {rawMessage}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hairline Progress Timer Bar */}
        <div className="relative w-full h-[2px] bg-neutral-100 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Snackbar({
  toast,
  onClose,
  duration = 4000,
}) {
  const rawMessage = typeof toast === "object" && toast !== null ? toast.message : toast;
  if (!rawMessage) return null;

  const toastId = typeof toast === "object" && toast?.id ? toast.id : rawMessage;

  return (
    <SnackbarItem
      key={toastId}
      toast={toast}
      rawMessage={rawMessage}
      onClose={onClose}
      duration={duration}
    />
  );
}
