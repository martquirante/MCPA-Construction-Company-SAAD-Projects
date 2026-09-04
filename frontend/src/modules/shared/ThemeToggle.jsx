"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./Icons";

export default function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("mcpa-theme");
    if (stored) {
      const dark = stored === "dark";
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark mode for MCPA
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    const themeStr = nextIsDark ? "dark" : "light";
    localStorage.setItem("mcpa-theme", themeStr);

    if (nextIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div
        className={`w-13 h-7 rounded-full bg-neutral-900 border border-white/20 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      role="switch"
      aria-checked={isDark}
      className={`relative inline-flex items-center h-7 w-14 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out border focus:outline-none select-none ${
        isDark
          ? "bg-neutral-900/90 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400"
          : "bg-neutral-200 border-amber-500/50 shadow-inner hover:border-amber-600"
      } ${className}`}
      title={`Current: ${isDark ? "Dark" : "Light"} Mode (Click to toggle)`}
    >
      {/* Background Track Icons */}
      <span className="absolute left-1.5 text-amber-500 pointer-events-none opacity-80">
        <SunIcon className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-1.5 text-amber-400 pointer-events-none opacity-80">
        <MoonIcon className="w-3.5 h-3.5" />
      </span>

      {/* Smooth Sliding Pill Knob */}
      <span
        className={`pointer-events-none flex items-center justify-center h-5.5 w-5.5 rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
          isDark
            ? "translate-x-7 bg-gradient-to-br from-amber-400 to-amber-500 text-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            : "translate-x-0.5 bg-white text-amber-600 shadow-sm"
        }`}
      >
        {isDark ? (
          <MoonIcon className="w-3 h-3 text-neutral-950 stroke-[2.5]" />
        ) : (
          <SunIcon className="w-3 h-3 text-amber-600 stroke-[2.5]" />
        )}
      </span>
    </button>
  );
}
