"use client";

import { useState, useRef } from "react";

export default function PillarCard({
  idx,
  number,
  icon,
  title,
  description,
  isVisible,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState("");
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D perspective tilt
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`
    );
    setGlowPos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)");
  };

  const transitionDelay = `${idx * 160}ms`;

  const getInitialTransform = () => {
    if (idx === 0) {
      return "perspective(1200px) rotateY(16deg) translateX(-36px) translateY(24px) scale(0.94)";
    }
    if (idx === 2) {
      return "perspective(1200px) rotateY(-16deg) translateX(36px) translateY(24px) scale(0.94)";
    }
    return "perspective(1200px) translateY(45px) scale(0.92) rotateX(8deg)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isVisible
          ? (transform || "perspective(1200px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)")
          : getInitialTransform(),
        filter: isVisible ? "blur(0px)" : "blur(3px)",
        transition: isHovered
          ? "transform 0.1s ease-out, box-shadow 0.3s ease-out"
          : `transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? transitionDelay : "0ms"}, opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? transitionDelay : "0ms"}, filter 0.85s ease-out ${isVisible ? transitionDelay : "0ms"}`,
        opacity: isVisible ? 1 : 0,
      }}
      className={`group relative overflow-hidden rounded-2xl p-8 sm:p-9 transition-all duration-300 border select-none ${
        isHovered
          ? "border-amber-500/80 shadow-[0_20px_50px_rgba(245,158,11,0.2)] bg-white dark:bg-neutral-900/90"
          : "border-neutral-200 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/50 hover:border-amber-500/50"
      } backdrop-blur-xl`}
    >
      {/* 1. Interactive Cursor Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${glowPos.x}px ${glowPos.y}px, rgba(245, 158, 11, 0.18), transparent 70%)`,
        }}
      />

      {/* 2. Top Shimmer Border Morph */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* 3. Architectural Watermark Number (01, 02, 03) */}
      <div className="pointer-events-none absolute top-4 right-5 text-6xl font-extrabold font-mono text-neutral-900/[0.05] dark:text-white/[0.04] group-hover:text-amber-500/[0.12] transition-colors duration-500 select-none">
        {number}
      </div>

      {/* 4. Morphing Icon Container */}
      <div className="relative mb-6">
        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-400/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          {icon}
        </div>
        <div className="absolute -inset-1 rounded-xl bg-amber-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* 5. Title */}
      <h3 className="relative text-xl font-bold uppercase tracking-wide text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-300 mb-3">
        {title}
      </h3>

      {/* 6. Description */}
      <p className="relative text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed group-hover:text-neutral-800 dark:group-hover:text-neutral-300 transition-colors duration-300 font-light">
        {description}
      </p>

      {/* 7. Bottom Corner Accent Line */}
      <div className="absolute bottom-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-16 h-[1.5px] bg-amber-500/40 rotate-45 transform origin-bottom-right group-hover:bg-amber-400 transition-colors duration-300" />
      </div>
    </div>
  );
}
