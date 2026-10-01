"use client";

import { useState, useEffect } from "react";
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  SettingsIcon,
  XIcon,
  CheckIcon,
  RefreshCwIcon,
} from "@/modules/shared/Icons";
import { getThemePreference, setThemePreference } from "@/modules/shared/SystemThemeSync";

export default function AdminSettingsModal({
  isOpen,
  onClose,
  onOpenResetPin,
}) {
  const [themePref, setThemePref] = useState("system"); // "system" | "light" | "dark"
  const [activeMode, setActiveMode] = useState("dark"); // "light" | "dark" (actual rendered mode)
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  // Initialize and synchronize with SystemThemeSync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const currentSysDark = mq ? mq.matches : false;
    setSystemIsDark(currentSysDark);

    const pref = getThemePreference();
    setThemePref(pref);
    setActiveMode(document.documentElement.classList.contains("dark") ? "dark" : "light");

    const handleThemeChange = (e) => {
      if (e?.detail) {
        setThemePref(e.detail.mode || "system");
        setActiveMode(e.detail.isDark ? "dark" : "light");
      }
    };

    const handleMediaChange = (e) => {
      setSystemIsDark(e.matches);
      const current = getThemePreference();
      if (current === "system") {
        setActiveMode(e.matches ? "dark" : "light");
      }
    };

    window.addEventListener("mcpa-theme-change", handleThemeChange);
    if (mq) {
      try {
        mq.addEventListener("change", handleMediaChange);
      } catch (err) {
        mq.addListener(handleMediaChange);
      }
    }

    return () => {
      window.removeEventListener("mcpa-theme-change", handleThemeChange);
      if (mq) {
        try {
          mq.removeEventListener("change", handleMediaChange);
        } catch (err) {
          mq.removeListener(handleMediaChange);
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleSwitch = () => {
    // If currently dark, flip to light. If currently light, flip to dark.
    const nextMode = activeMode === "dark" ? "light" : "dark";
    setThemePreference(nextMode);
    setThemePref(nextMode);
    setActiveMode(nextMode);
    triggerNotice(`Theme set to ${nextMode.toUpperCase()}`);
  };

  const handleSelectMode = (mode) => {
    setThemePreference(mode);
    setThemePref(mode);
    if (mode === "system") {
      setActiveMode(systemIsDark ? "dark" : "light");
      triggerNotice("Synced with Browser / System Theme");
    } else {
      setActiveMode(mode);
      triggerNotice(`Theme set to ${mode.toUpperCase()}`);
    }
  };

  const triggerNotice = (msg) => {
    setSavedNotice(msg);
    setTimeout(() => {
      setSavedNotice("");
    }, 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl rounded-[8px] bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/[0.08] shadow-2xl overflow-hidden transition-all duration-300 z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Admin Console Settings
              </h2>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Appearance, themes, and console preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Toast Alert */}
        {savedNotice && (
          <div className="mx-6 mt-4 p-2.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <CheckIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">{savedNotice}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-800 dark:text-neutral-200">
          {/* SECTION 1: THEME TOGGLE SWITCH */}
          <div className="p-5 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                  Interface Theme
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  Light / Dark Appearance Toggle
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                  Switch between high-contrast daylight mode and deep industrial dark mode.
                </p>
              </div>

              {/* TOGGLE SWITCH COMPONENT (Icon only inside the sliding thumb) */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeMode === "dark"}
                  onClick={handleToggleSwitch}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                    activeMode === "dark"
                      ? "bg-neutral-900 border-amber-500/50"
                      : "bg-amber-100 border-amber-400/60"
                  }`}
                  title={`Switch to ${activeMode === "dark" ? "Light" : "Dark"} Mode`}
                >
                  <span className="sr-only">Toggle Theme</span>
                  {/* Animated Sliding Thumb with icon inside */}
                  <span
                    className={`pointer-events-none flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition duration-300 ease-in-out mt-[2px] ml-[2px] ${
                      activeMode === "dark"
                        ? "translate-x-8 bg-amber-500 text-neutral-950"
                        : "translate-x-0 bg-white text-amber-600 border border-amber-200"
                    }`}
                  >
                    {activeMode === "dark" ? (
                      <MoonIcon className="w-3.5 h-3.5" />
                    ) : (
                      <SunIcon className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                  {activeMode === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
            </div>

            {/* THREE THEME SELECTION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Option 1: Light Theme */}
              <button
                type="button"
                onClick={() => handleSelectMode("light")}
                className={`p-3.5 rounded-[6px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                  themePref === "light"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                    : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <SunIcon className="w-5 h-5 text-amber-500" />
                  {themePref === "light" && (
                    <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                      <CheckIcon className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Light Theme
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Clean daylight canvas
                  </p>
                </div>
              </button>

              {/* Option 2: Dark Theme */}
              <button
                type="button"
                onClick={() => handleSelectMode("dark")}
                className={`p-3.5 rounded-[6px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                  themePref === "dark"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                    : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <MoonIcon className="w-5 h-5 text-amber-400" />
                  {themePref === "dark" && (
                    <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                      <CheckIcon className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Dark Theme
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Deep industrial tone
                  </p>
                </div>
              </button>

              {/* Option 3: System Default Sync */}
              <button
                type="button"
                onClick={() => handleSelectMode("system")}
                className={`p-3.5 rounded-[6px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                  themePref === "system"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                    : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <MonitorIcon className="w-5 h-5 text-sky-500" />
                  {themePref === "system" && (
                    <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                      <CheckIcon className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      System Auto
                    </p>
                    <span className="px-1 py-0.2 rounded-[2px] bg-neutral-200 dark:bg-white/10 text-[9px] font-mono text-neutral-600 dark:text-neutral-400">
                      Default
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Syncs with OS / Browser
                  </p>
                </div>
              </button>
            </div>

            {/* SYSTEM STATUS ROW */}
            <div className="pt-2 border-t border-neutral-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <MonitorIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Detected OS / Browser Theme:{" "}
                  <strong className="text-neutral-900 dark:text-white">
                    {systemIsDark ? "Dark" : "Light"}
                  </strong>
                </span>
              </div>
              {themePref !== "system" && (
                <button
                  type="button"
                  onClick={() => handleSelectMode("system")}
                  className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-bold shrink-0 self-start sm:self-auto"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  <span>Restore System Default</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-500">
            Current Mode: <strong className="text-neutral-900 dark:text-white uppercase">{activeMode}</strong>
            {themePref === "system" && " (System Sync)"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-[4px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold font-mono text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


