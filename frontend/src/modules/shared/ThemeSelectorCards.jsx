"use client";

import React from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";

/**
 * MCPA Executive Theme Selector Cards
 * Tailored specifically for MCPA Construction & Supply's architectural brand identity:
 * - Amber 500 safety & construction gold
 * - Obsidian deep slate canvas (#09090b)
 * - Crisp daytime architectural canvas (#ffffff)
 */
export const THEME_OPTIONS = [
  {
    id: "light",
    name: "Light Theme",
    icon: Sun,
    description:
      "Crisp daytime architectural canvas with high-clarity typography and warm amber accents.",
  },
  {
    id: "dark",
    name: "Dark Theme",
    icon: Moon,
    description:
      "Industrial obsidian canvas with high-contrast structural elements and luminous amber glow.",
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
                ? "border-2 border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] shadow-md ring-4 ring-amber-500/15"
                : "border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#12141a] hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-xs"
            }`}
          >
            {/* Top Preview Illustration Graphic (Crafted for MCPA Construction Website) */}
            <div className="w-full">
              {/* 1. LIGHT THEME PREVIEW */}
              {theme.id === "light" && (
                <div className="w-full h-24 sm:h-28 rounded-xl p-2.5 bg-neutral-100 border border-neutral-200/90 flex flex-col justify-between overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Mini Top Navbar */}
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="w-10 h-1.5 rounded-[2px] bg-neutral-900 font-mono tracking-tighter" />
                    </div>
                    {/* Mini Amber Inquire Button */}
                    <div className="w-7 h-2 rounded-[2px] bg-amber-500 shadow-xs" />
                  </div>

                  {/* Mini Web Hero Showcase */}
                  <div className="flex-1 mt-1 rounded-md bg-white border border-neutral-200/60 p-2 flex flex-col justify-between shadow-xs">
                    <div className="space-y-1">
                      {/* "BUILT BY HANDS." */}
                      <div className="w-3/4 h-1.5 rounded-full bg-neutral-900" />
                      {/* "PERFECTED BY PROCESS." */}
                      <div className="w-1/2 h-1.5 rounded-full bg-amber-500" />
                    </div>

                    {/* 3 Mini Construction Milestone Blocks */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <div className="h-1.5 rounded-xs bg-neutral-200" />
                      <div className="h-1.5 rounded-xs bg-neutral-200" />
                      <div className="h-1.5 rounded-xs bg-amber-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DARK THEME PREVIEW */}
              {theme.id === "dark" && (
                <div className="w-full h-24 sm:h-28 rounded-xl p-2.5 bg-[#09090b] border border-white/10 flex flex-col justify-between overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Mini Top Navbar */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] shrink-0" />
                      <span className="w-10 h-1.5 rounded-[2px] bg-white font-mono tracking-tighter" />
                    </div>
                    {/* Mini Amber Inquire Button */}
                    <div className="w-7 h-2 rounded-[2px] bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  </div>

                  {/* Mini Web Hero Showcase */}
                  <div className="flex-1 mt-1 rounded-md bg-[#12141a] border border-white/5 p-2 flex flex-col justify-between shadow-xs">
                    <div className="space-y-1">
                      {/* "BUILT BY HANDS." */}
                      <div className="w-3/4 h-1.5 rounded-full bg-white" />
                      {/* "PERFECTED BY PROCESS." */}
                      <div className="w-1/2 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                    </div>

                    {/* 3 Mini Construction Milestone Blocks */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <div className="h-1.5 rounded-xs bg-white/10" />
                      <div className="h-1.5 rounded-xs bg-white/10" />
                      <div className="h-1.5 rounded-xs bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SYSTEM MATCH PREVIEW */}
              {theme.id === "system" && (
                <div className="relative w-full h-24 sm:h-28 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden flex shadow-xs transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Left Half (MCPA Light Mode Canvas) */}
                  <div className="w-1/2 h-full bg-neutral-100 p-2 flex flex-col justify-between border-r border-neutral-300/80">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      <span className="w-6 h-1 rounded-[1px] bg-neutral-900" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-4/5 h-1 rounded-full bg-neutral-800" />
                      <div className="w-2/5 h-1 rounded-full bg-amber-500" />
                    </div>
                  </div>

                  {/* Right Half (MCPA Dark Mode Canvas) */}
                  <div className="w-1/2 h-full bg-[#09090b] p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-end gap-1">
                      <span className="w-6 h-1 rounded-[1px] bg-white" />
                      <span className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)] shrink-0" />
                    </div>
                    <div className="space-y-1 flex flex-col items-end">
                      <div className="w-4/5 h-1 rounded-full bg-white" />
                      <div className="w-2/5 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
                    </div>
                  </div>

                  {/* Center Floating Laptop Pill */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/15 shadow-md flex items-center justify-center text-amber-500 transition-transform duration-200 group-hover:scale-105">
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

                {/* Selected Checkmark Badge (Clean Amber Construction Styling) */}
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xs shrink-0 animate-in zoom-in-75 duration-150">
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
