"use client";

import React from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";

/**
 * World-Class Executive Theme Selector Cards
 * Crafted based on elite human UI/UX design specifications.
 * Supports Daylight (Light), Midnight Sapphire (Dark), and System Match (OS Auto).
 */
export const THEME_OPTIONS = [
  {
    id: "light",
    name: "Daylight",
    icon: Sun,
    description:
      "Crisp white canvas with royal navy and warm academic gold accents.",
  },
  {
    id: "dark",
    name: "Midnight Sapphire",
    icon: Moon,
    description:
      "Deep velvet slate with luminous blue elements. Ideal for late-night classes.",
  },
  {
    id: "system",
    name: "System Match",
    icon: Laptop,
    description:
      "Automatically synchronizes with your device's light or dark mode schedule.",
  },
];

export default function ThemeSelectorCards({
  currentTheme = "system",
  onSelectTheme,
  systemIsDark = false,
  className = "",
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color Theme Selection"
      className={`grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 ${className}`}
    >
      {THEME_OPTIONS.map((theme) => {
        const isSelected = currentTheme === theme.id;
        const Icon = theme.icon;

        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => onSelectTheme?.(theme.id)}
            className={`group relative rounded-2xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none active:scale-[0.98] ${
              isSelected
                ? "border-2 border-[#1e40af] dark:border-[#38bdf8] bg-white dark:bg-[#121620] shadow-md ring-4 ring-[#1e40af]/10 dark:ring-[#38bdf8]/15"
                : "border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121620] hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-xs"
            }`}
          >
            {/* Top Preview Illustration Graphic */}
            <div className="w-full">
              {theme.id === "light" && (
                <div className="w-full h-24 sm:h-28 rounded-xl p-2.5 bg-[#f1f5f9] border border-neutral-200/90 flex flex-col justify-between overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Top Header Dots / Bar */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e40af] shrink-0" />
                    <span className="w-12 sm:w-14 h-1.5 rounded-full bg-[#1e40af]/90" />
                  </div>

                  {/* Window Content */}
                  <div className="flex gap-2 h-14 sm:h-16 mt-1">
                    <div className="w-6 sm:w-7 h-full bg-[#cbd5e1]/80 rounded-md shrink-0" />
                    <div className="flex-1 h-full bg-white rounded-md p-2 sm:p-2.5 shadow-xs border border-neutral-100 flex flex-col justify-center gap-2">
                      <div className="w-4/5 h-1.5 rounded-full bg-[#334155]" />
                      <div className="w-2/5 h-1.5 rounded-full bg-[#f59e0b]" />
                    </div>
                  </div>
                </div>
              )}

              {theme.id === "dark" && (
                <div className="w-full h-24 sm:h-28 rounded-xl p-2.5 bg-[#0b101b] border border-white/10 flex flex-col justify-between overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Top Header Dots / Bar */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0" />
                    <span className="w-12 sm:w-14 h-1.5 rounded-full bg-[#38bdf8]/90" />
                  </div>

                  {/* Window Content */}
                  <div className="flex gap-2 h-14 sm:h-16 mt-1">
                    <div className="w-6 sm:w-7 h-full bg-[#162035] rounded-md shrink-0" />
                    <div className="flex-1 h-full bg-[#101828] rounded-md p-2 sm:p-2.5 shadow-xs border border-white/5 flex flex-col justify-center gap-2">
                      <div className="w-4/5 h-1.5 rounded-full bg-[#94a3b8]" />
                      <div className="w-2/5 h-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                </div>
              )}

              {theme.id === "system" && (
                <div className="relative w-full h-24 sm:h-28 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden flex shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Left Half (Daylight Canvas) */}
                  <div className="w-1/2 h-full bg-[#f1f5f9] border-r border-neutral-200/50" />

                  {/* Right Half (Midnight Sapphire Canvas) */}
                  <div className="w-1/2 h-full bg-[#0b101b]" />

                  {/* Center Floating Laptop Pill */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#162035] border border-neutral-200 dark:border-white/15 shadow-md flex items-center justify-center text-[#1e40af] dark:text-[#38bdf8] transition-transform duration-200 group-hover:scale-105">
                      <Laptop className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Meta & Description */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-neutral-800 dark:text-neutral-200 stroke-[2.2]" />
                  <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                    {theme.name}
                  </span>
                </div>

                {/* Selected Checkmark Badge (Exact styling from reference) */}
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-[#1e40af] dark:bg-[#38bdf8] text-white dark:text-neutral-950 flex items-center justify-center shadow-xs shrink-0 animate-in zoom-in-75 duration-150">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shrink-0 group-hover:border-neutral-400 dark:group-hover:border-neutral-500 transition-colors" />
                )}
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans text-left">
                {theme.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

