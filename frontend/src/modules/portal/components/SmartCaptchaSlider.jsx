"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheckIcon, LockIcon, CheckIcon, ChevronRightIcon } from "@/modules/shared/Icons";

export default function SmartCaptchaSlider({ onVerified, isVerified, resetTrigger }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const trackRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (resetTrigger) {
      setSliderPos(0);
      setVerified(false);
    }
  }, [resetTrigger]);

  const handleStart = (clientX) => {
    if (verified || isVerified) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || verified || isVerified) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxDrag = rect.width - 48; // width minus thumb
    const currentX = Math.max(0, Math.min(clientX - rect.left - 24, maxDrag));
    setSliderPos(currentX);

    // If reached 95% threshold -> verify
    if (currentX >= maxDrag * 0.92) {
      setIsDragging(false);
      setSliderPos(maxDrag);
      setVerified(true);
      if (onVerified) onVerified(true);
    }
  };

  const handleEnd = () => {
    if (verified || isVerified) return;
    setIsDragging(false);
    // Snap back if threshold not reached
    setSliderPos(0);
  };

  return (
    <div className="space-y-1.5 select-none">
      {/* Invisible Honeypot Trap field for automated bots */}
      <input
        type="text"
        name="website_url_security_trap"
        autoComplete="off"
        tabIndex="-1"
        style={{ display: "none" }}
      />

      <div
        ref={trackRef}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        className={`relative h-12 rounded-[6px] overflow-hidden border transition-colors flex items-center px-2 cursor-pointer ${
          verified || isVerified
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            : "bg-neutral-100 dark:bg-[#141722] border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400"
        }`}
      >
        {/* Dynamic track fill */}
        <div
          className="absolute inset-y-0 left-0 bg-amber-500/15 dark:bg-amber-500/20 transition-all pointer-events-none"
          style={{ width: `${sliderPos + 48}px` }}
        />

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono font-medium tracking-wide">
          {verified || isVerified ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckIcon className="w-4 h-4" />
              Human Verification Confirmed
            </span>
          ) : (
            <span className="opacity-80 flex items-center gap-1">
              <span>Slide to Confirm Verification</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Sliding Thumb Handle */}
        <div
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => e.touches[0] && handleStart(e.touches[0].clientX)}
          className={`relative z-10 w-10 h-9 rounded-[4px] shadow-sm flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ${
            verified || isVerified
              ? "bg-emerald-500 text-neutral-950 font-bold shadow-emerald-500/20"
              : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20"
          }`}
          style={{ transform: `translateX(${sliderPos}px)` }}
        >
          {verified || isVerified ? (
            <ShieldCheckIcon className="w-4 h-4" />
          ) : (
            <LockIcon className="w-4 h-4" />
          )}
        </div>
      </div>
      <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
        <span>Frictionless Bot &amp; DDoS Shield</span>
        <span>MCPA Security Gate</span>
      </p>
    </div>
  );
}
