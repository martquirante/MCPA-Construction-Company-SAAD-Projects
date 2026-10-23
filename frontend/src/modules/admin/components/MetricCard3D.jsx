"use client";

import React, { useState, useEffect, useRef } from "react";

export function AnimatedNumber({ value, duration = 800, prefix = "", suffix = "" }) {
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const [displayVal, setDisplayVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(num * easeOut(progress));
      setDisplayVal(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayVal(num);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [num, duration]);

  return (
    <span>
      {prefix}
      {displayVal.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function MetricCard3D({
  label,
  value,
  sub,
  accentColor = "#F59E0B",
  icon: Icon,
  onClick,
  badgeText,
  showBadge = true,
  tone = "amber",
}) {
  const toneStyles = {
    amber: {
      iconBg: "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
      pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
      hoverBorder: "hover:border-amber-500/40 dark:hover:border-amber-500/40",
    },
    sky: {
      iconBg: "bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
      dot: "bg-sky-500",
      hoverBorder: "hover:border-sky-500/40 dark:hover:border-sky-500/40",
    },
    emerald: {
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
      hoverBorder: "hover:border-emerald-500/40 dark:hover:border-emerald-500/40",
    },
    rose: {
      iconBg: "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
      pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dot: "bg-rose-500",
      hoverBorder: "hover:border-rose-500/40 dark:hover:border-rose-500/40",
    },
  };

  const currentTone = toneStyles[tone] || toneStyles.amber;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative rounded-xl p-5 bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/[0.08] ${currentTone.hoverBorder} transition-all duration-200 hover:-translate-y-0.5 cursor-pointer select-none flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]`}
    >
      {/* Top Header: Icon in architectural container & optional badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {Icon && (
          <div className={`w-9 h-9 flex items-center justify-center ${currentTone.iconBg.replace(/bg-[^\s]+|border-[^\s]+/g, "").trim()} transition-transform group-hover:scale-105 duration-200 shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        {showBadge && badgeText ? (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase ${currentTone.pill.replace(/bg-[^\s]+|border-[^\s]+/g, "").trim()}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentTone.dot}`} />
            {badgeText}
          </span>
        ) : showBadge ? (
          <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Overview
          </span>
        ) : null}
      </div>

      {/* Main Metric Value & Label */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight tabular-nums font-sans">
            <AnimatedNumber value={value} />
          </span>
        </div>
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 tracking-tight font-sans">
          {label}
        </p>
      </div>

      {/* Footer Subtitle / Context with micro-interaction */}
      <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="truncate">{sub}</span>
        <span className="text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all text-xs font-bold shrink-0 ml-1">
          →
        </span>
      </div>
    </div>
  );
}
