"use client";

import { useState, useEffect, useCallback } from "react";
import McpaVectorLogo from "./McpaVectorLogo";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState("dark"); // Auto-detected from browser: "dark" | "light"
  const [animMode, setAnimMode] = useState("draw"); // "draw" (Vector Stroke Draw) | "sweep" (Laser Blade Etch)
  const [statusText, setStatusText] = useState("CALIBRATING ARCHITECTURAL VECTORS...");
  const [isCompleted, setIsCompleted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Auto-detect browser/OS theme (prefers-color-scheme) & listen for live changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(mediaQuery.matches ? "dark" : "light");

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
    setStatusText("CALIBRATING ARCHITECTURAL VECTORS...");
    setAnimKey((prev) => prev + 1);
  }, []);

  // Manual theme override toggle (Shortcut: T)
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Mode toggle (Shortcut: M)
  const toggleMode = useCallback(() => {
    setAnimMode((prev) => (prev === "draw" ? "sweep" : "draw"));
    handleReplay();
  }, [handleReplay]);

  // Keyboard shortcuts: 'R' for replay, 'T' for theme, 'M' for mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "r" || e.key === "R") handleReplay();
      if (e.key === "t" || e.key === "T") toggleTheme();
      if (e.key === "m" || e.key === "M") toggleMode();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReplay, toggleTheme, toggleMode]);

  // Smooth, satisfying 2.4-second progress loop (0% -> 100%)
  useEffect(() => {
    let start = Date.now();
    const duration = 2400; // 2.4 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 25) {
        setStatusText(
          animMode === "draw"
            ? "PEN DRAFTING: ARCHITECTURAL VECTORS..."
            : "CALIBRATING BLUEPRINT GEOMETRY..."
        );
      } else if (pct < 65) {
        setStatusText(
          animMode === "draw"
            ? "DRAWING STRUCTURAL MCPA GLYPHS..."
            : "LASER-PRECISION ETCHING REVEAL..."
        );
      } else if (pct < 98) {
        setStatusText("SOLIDIFYING BRAND INTEGRITY...");
      } else {
        setStatusText("MCPA SYSTEM READY · 100%");
        setIsCompleted(true);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [animKey, animMode]);

  return (
    <div
      key={animKey}
      className={`fixed inset-0 z-50 flex flex-col justify-between w-screen h-screen overflow-hidden select-none transition-colors duration-700 ${
        isDark ? "bg-[#070708] text-[#f4f4f4]" : "bg-[#f7f6f3] text-[#141414]"
      }`}
    >
      {/* 1. Subtle CAD Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-700"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Ambient Focal Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(245, 158, 11, 0.14) 0%, rgba(7, 7, 8, 0.85) 60%, #070708 100%)"
            : "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245, 158, 11, 0.09) 0%, rgba(247, 246, 243, 0.85) 60%, #f7f6f3 100%)",
        }}
      />

      {/* Top spacer for balanced vertical alignment */}
      <div className="pt-8" />

      {/* ========================================================================= */}
      {/* CENTER: 100% PURE VECTOR LOGO ANIMATION (ZERO RASTER IMAGES)             */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
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

                {/* Sweeping Laser Blade with Golden Flare */}
                {progress > 0 && progress < 100 && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-30"
                    style={{
                      left: `${progress}%`,
                      width: "2px",
                      background:
                        "linear-gradient(to bottom, transparent 0%, #ffedd5 20%, #f59e0b 50%, #d97706 80%, transparent 100%)",
                      boxShadow:
                        "0 0 14px 3px rgba(245, 158, 11, 0.95), 0 0 28px 6px rgba(245, 158, 11, 0.5)",
                    }}
                  >
                    <div
                      className="absolute top-[48%] -translate-y-1/2 -left-1.5 w-3.5 h-3.5 rounded-full bg-white blur-[1.5px]"
                      style={{
                        boxShadow:
                          "0 0 12px 4px rgba(245, 158, 11, 1), 0 0 24px 8px rgba(251, 191, 36, 0.7)",
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
                "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.75) 0%, transparent 75%)",
              opacity: progress > 10 ? 0.75 : 0,
              transform: `scaleX(${progress / 100})`,
            }}
          />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM: SLEEK HAIRLINE PROGRESS BAR & DIGITAL COUNTER                     */}
      {/* ========================================================================= */}
      <footer className="relative z-20 flex flex-col items-center justify-end pb-12 px-6">
        <div className="flex flex-col items-center w-full max-w-[280px]">
          {/* Progress Bar Track */}
          <div
            className={`relative w-full h-[1.6px] rounded-full overflow-hidden transition-colors ${
              isDark ? "bg-zinc-800/80" : "bg-zinc-300/80"
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)",
                boxShadow: "0 0 10px rgba(245, 158, 11, 0.9)",
              }}
            />
          </div>

          {/* Telemetry Status & Crisp Digital Percentage */}
          <div className="flex items-center justify-between w-full mt-3 font-mono text-[10px] tracking-[0.2em]">
            <span
              className={`truncate max-w-[200px] transition-colors ${
                isDark ? "text-zinc-500" : "text-zinc-500"
              }`}
            >
              {statusText}
            </span>
            <span className="text-amber-500 font-semibold pl-2">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>


      </footer>
    </div>
  );
}
