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
}) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-[6px] p-5 bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-[border-color,box-shadow] duration-150 cursor-pointer overflow-hidden select-none flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 leading-tight">
          {label}
        </span>
        {/* Pure stroke icon — no rectangle background box */}
        {Icon && (
          <div className="shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-mono font-bold tabular-nums leading-none tracking-tight"
          style={{ color: accentColor }}
        >
          <AnimatedNumber value={value} />
        </span>
        {sub && (
          <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 leading-tight">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
