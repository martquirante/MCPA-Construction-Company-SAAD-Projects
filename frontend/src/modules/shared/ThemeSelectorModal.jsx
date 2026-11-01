"use client";

import React, { useState, useEffect } from "react";
import { X, Palette, Sparkles, Monitor } from "lucide-react";
import ThemeSelectorCards from "./ThemeSelectorCards";
import { getThemePreference, setThemePreference } from "./SystemThemeSync";

export default function ThemeSelectorModal({ isOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("system");
  const [systemIsDark, setSystemIsDark] = useState(false);

  // Sync state on mount and listen to global open event
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTheme = () => {
      const pref = getThemePreference?.() || "system";
      setCurrentTheme(pref);
      const isSysDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
      setSystemIsDark(Boolean(isSysDark));
    };

    syncTheme();

    const handleOpen = () => setInternalOpen(true);
    const handleThemeChange = (e) => {
      setCurrentTheme(e.detail?.mode || "system");
    };

    window.addEventListener("mcpa-open-theme-selector", handleOpen);
    window.addEventListener("mcpa-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("mcpa-open-theme-selector", handleOpen);
      window.removeEventListener("mcpa-theme-change", handleThemeChange);
    };
  }, []);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    setInternalOpen(false);
  };

  const handleSelectTheme = (mode) => {
    setThemePreference(mode);
    setCurrentTheme(mode);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#0e121a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Palette className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="theme-modal-title"
                className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight"
              >
                Appearance & Display Theme
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Personalize your workspace canvas to match your environment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Theme Modal"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Theme Cards */}
        <div className="p-6 overflow-y-auto space-y-5">
          <ThemeSelectorCards
            currentTheme={currentTheme}
            onSelectTheme={handleSelectTheme}
            systemIsDark={systemIsDark}
          />

          {/* System Device Status Bar */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Monitor className="w-4 h-4 text-sky-500 shrink-0" />
              <span>
                Detected OS Setting:{" "}
                <strong className="text-neutral-900 dark:text-white">
                  {systemIsDark ? "Dark Mode" : "Light Mode"}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-time instant rendering</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01] flex items-center justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

