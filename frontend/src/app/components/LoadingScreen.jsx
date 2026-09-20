"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import McpaVectorLogo from "./McpaVectorLogo";

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });
  const [animMode, setAnimMode] = useState("draw"); // "draw" (Vector Stroke Draw) | "sweep" (Laser Blade Etch)
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Auto-detect browser/OS theme (prefers-color-scheme) & listen for live changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleThemeChange = (e) => {
        setTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleThemeChange);
      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    }
  }, []);

  const isDark = theme === "dark";

  // Replay animation
  const handleReplay = useCallback(() => {
    setProgress(0);
    setIsCompleted(false);
    setIsFadingOut(false);
    setAnimKey((prev) => prev + 1);
  }, []);

  // Mode toggle (Shortcut: M)
  const toggleMode = useCallback(() => {
    setAnimMode((prev) => (prev === "draw" ? "sweep" : "draw"));
    handleReplay();
  }, [handleReplay]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 300);
  }, []);

  // Keyboard shortcuts: 'R' for replay, 'M' for mode, 'Escape' to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "r" || e.key === "R") handleReplay();
      if (e.key === "m" || e.key === "M") toggleMode();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReplay, toggleMode, handleSkip]);

  // Smooth, satisfying 2.4-second progress loop (0% -> 100%)
  useEffect(() => {
    let start = Date.now();
    const duration = 2400; // 2.4 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        setProgress(100);
        setIsCompleted(true);
        clearInterval(timer);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onCompleteRef.current?.();
          }, 600);
        }, 400);
      }
    }, 16);

    // Guaranteed fallback timeout so it never stays stuck under any condition
    const safetyTimeout = setTimeout(() => {
      clearInterval(timer);
      setProgress(100);
      setIsCompleted(true);
      setIsFadingOut(true);
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 500);
    }, 3200);

    return () => {
      clearInterval(timer);
      clearTimeout(safetyTimeout);
    };
  }, [animKey, animMode]);

  return (
    <div
      key={animKey}
      className={`fixed inset-0 z-[100] flex items-center justify-center w-screen h-screen overflow-hidden select-none transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      } ${
        isDark ? "bg-[#09090b] text-[#f4f4f4]" : "bg-white text-[#141414]"
      }`}
    >
      {/* 1. Subtle CAD Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-700"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Ambient Focal Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 255, 255, 0.04) 0%, rgba(9, 9, 11, 0.85) 60%, #09090b 100%)"
            : "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0, 0, 0, 0.02) 0%, rgba(255, 255, 255, 0.85) 60%, #ffffff 100%)",
        }}
      />

      {/* ========================================================================= */}
      {/* CENTER: 100% PURE VECTOR LOGO ANIMATION (ZERO RASTER IMAGES)             */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        <div className="relative w-full max-w-[560px] md:max-w-[700px] flex items-center justify-center">

          {animMode === "draw" ? (
            /* MODE 1: ARCHITECTURAL VECTOR STROKE DRAW ("NAGSUSULAT" ANIMATION) */
            <div className="relative w-full">
              {/* Ghost blueprint wireframe in background */}
              <div
                className={`w-full transition-opacity duration-700 ${
                  isDark ? "opacity-10" : "opacity-15"
                }`}
              >
                <McpaVectorLogo
                  isDark={isDark}
                  isDrawing={false}
                  progress={100}
                  isCompleted={false}
                />
              </div>

              {/* Foreground real-time stroke drawing layer */}
              <div className="absolute inset-0">
                <McpaVectorLogo
                  isDark={isDark}
                  isDrawing={true}
                  progress={progress}
                  isCompleted={isCompleted}
                />
              </div>
            </div>
          ) : (
            /* MODE 2: LASER BLADE SWEEP ETCH REVEAL */
            <div className="relative w-full">
              {/* Ghost blueprint background */}
              <div
                className={`w-full transition-opacity duration-700 ${
                  isDark ? "opacity-15" : "opacity-20"
                }`}
              >
                <McpaVectorLogo
                  isDark={isDark}
                  isDrawing={false}
                  progress={100}
                  isCompleted={false}
                />
              </div>

              {/* Active laser etched logo revealed via clipPath */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: `inset(0 ${Math.max(0, 100 - progress)}% 0 0)`,
                }}
              >
                <McpaVectorLogo
                  isDark={isDark}
                  isDrawing={false}
                  progress={100}
                  isCompleted={isCompleted}
                />

                {/* Sweeping Laser Blade with Silver/White Flare */}
                {progress > 0 && progress < 100 && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-30"
                    style={{
                      left: `${progress}%`,
                      width: "2px",
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 20%, #ffffff 50%, rgba(255,255,255,0.4) 80%, transparent 100%)",
                      boxShadow:
                        "0 0 14px 3px rgba(255, 255, 255, 0.8), 0 0 24px 6px rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <div
                      className="absolute top-[48%] -translate-y-1/2 -left-1.5 w-3.5 h-3.5 rounded-full bg-white blur-[1.5px]"
                      style={{
                        boxShadow:
                          "0 0 12px 4px rgba(255, 255, 255, 0.9), 0 0 20px 6px rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ambient Glow Puddle under the logo */}
          <div
            className="absolute -bottom-6 w-80 h-4 rounded-full blur-[14px] pointer-events-none transition-all duration-500"
            style={{
              background:
                isDark
                  ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, transparent 75%)"
                  : "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.15) 0%, transparent 75%)",
              opacity: progress > 10 ? 0.75 : 0,
              transform: `scaleX(${progress / 100})`,
            }}
          />
        </div>
      </main>
    </div>
  );
}
