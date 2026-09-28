"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export function AnimatedNumber({ value, duration = 900, prefix = "", suffix = "" }) {
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
  glowColor = "rgba(245, 158, 11, 0.15)",
  icon: Icon,
  onClick,
}) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // rAF-throttled 3D Tilt calculation tracking exact mouse coordinates
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalize [-1, +1] mapped to ±8deg rotation for subtle, elegant depth
      const normX = (relX - centerX) / centerX;
      const normY = (relY - centerY) / centerY;

      setTilt({ x: normY * -8, y: normX * 8 });
      setGlare({
        x: (relX / rect.width) * 100,
        y: (relY / rect.height) * 100,
        opacity: 0.18,
      });
    });
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare((g) => ({ ...g, opacity: 0 }));
  }, []);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick?.();
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`group relative rounded-2xl p-5 border transition-all cursor-pointer overflow-hidden select-none flex flex-col justify-between ${
        hovered
          ? "border-neutral-300 dark:border-white/[0.14] bg-white dark:bg-[#16181f]"
          : "border-neutral-200/90 dark:border-white/[0.07] bg-white dark:bg-[#12141a]"
      }`}
      style={{
        transform: hovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02) translateZ(6px)`
          : `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(${clicked ? 0.98 : 1}) translateZ(0px)`,
        transition: hovered
          ? "transform 0.08s ease-out, border-color 0.2s ease, box-shadow 0.25s ease, background 0.2s ease"
          : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.35s ease, background 0.3s ease",
        boxShadow: hovered
          ? `0 14px 28px -12px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}20`
          : "0 2px 6px -2px rgba(0, 0, 0, 0.2)",
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Dynamic Cursor-Tracking Glare Overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl z-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity * 0.4}) 0%, rgba(255,255,255,0) 65%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Top ambient shine reflection */}
      <div
        className="absolute top-0 inset-x-0 h-1/2 rounded-t-2xl pointer-events-none z-10 opacity-40 dark:opacity-20"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
        }}
      />

      {/* Card Content with 3D Depth Layering */}
      <div className="relative z-30 flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 leading-tight">
            {label}
          </span>
          {Icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${accentColor}12`,
                borderColor: `${accentColor}25`,
                color: accentColor,
                transform: hovered ? "translateZ(8px)" : "translateZ(0)",
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div
          className="flex items-baseline gap-2 transition-transform duration-200"
          style={{ transform: hovered ? "translateZ(6px)" : "translateZ(0)" }}
        >
          <span
            className="text-3xl sm:text-4xl font-bold tabular-nums leading-none tracking-tight"
            style={{ color: accentColor }}
          >
            <AnimatedNumber value={value} />
          </span>
          {sub && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
