"use client";

import { RotateCcwIcon } from "../../shared/Icons";

export default function BuildProgressBadge({
  progress,
  displayedPct,
  stageName,
  isCompleted,
  onReplay,
  onAdvance,
}) {
  const percentage = displayedPct !== undefined ? displayedPct : Math.round(progress * 100);

  return (
    <>
      {/* 1. PROGRESS COUNTER & STAGE BADGE (ONLY VISIBLE DURING BUILD PHASES 0% - 95%) */}
      {!isCompleted && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-all duration-500 animate-fade-in">
          {/* Construction Stage Pill - Clickable to advance */}
          <button
            onClick={onAdvance}
            className="pointer-events-auto mb-2 px-4 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/10 hover:border-brand-yellow/50 text-white/90 text-[11px] font-mono tracking-widest uppercase shadow-lg transition-all duration-200 cursor-pointer"
            aria-label="Current construction stage. Tap to advance."
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-yellow mr-2 animate-ping" />
            {stageName}
          </button>

          {/* Clean Percentage: 0%, 20%, 40%, 60%, 80%, 100% */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg md:text-xl font-bold font-mono tracking-wider text-brand-yellow drop-shadow-[0_2px_12px_rgba(254,226,2,0.65)]">
              {percentage}%
            </span>
            <span className="text-white/60 text-xs font-mono font-semibold tracking-wider">
              BUILT
            </span>
          </div>

          {/* Scroll or Tap to build instruction */}
          <button
            onClick={onAdvance}
            className="pointer-events-auto flex flex-col items-center mt-2 space-y-1 text-white/70 hover:text-brand-yellow cursor-pointer transition-colors duration-200 group"
            aria-label="Scroll or tap to advance construction build"
          >
            <span className="text-[10px] tracking-[0.25em] font-semibold uppercase text-neutral-200 group-hover:text-brand-yellow transition-colors">
              Scroll or Tap to Build
            </span>
            <div className="w-4 h-6 rounded-full border border-white/40 group-hover:border-brand-yellow/70 flex justify-center pt-1 transition-colors">
              <div className="w-1 h-2 rounded-full bg-brand-yellow animate-bounce" />
            </div>
          </button>
        </div>
      )}

      {/* 2. ONCE COMPLETED: CLEAN BOTTOM CUE & REPLAY PILL (ZERO COLLISION WITH BUTTON) */}
      {isCompleted && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-6 pointer-events-none transition-all duration-700 ease-out">
          <div className="relative flex items-center justify-between min-h-[32px]">
            {/* Perfectly centered indicator across the entire viewport width */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-400/70 select-none text-center">
                — Scroll to Explore —
              </span>
            </div>

            {/* Optional Replay Build pill button docked to the right */}
            {onReplay && (
              <button
                onClick={onReplay}
                aria-label="Replay Construction Build Animation"
                className="group relative z-10 pointer-events-auto ml-auto px-3 py-1 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 hover:border-amber-400/40 text-[11px] font-mono tracking-wider text-neutral-400 hover:text-amber-300 transition-all duration-200 backdrop-blur-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcwIcon className="w-3 h-3 text-neutral-400 group-hover:text-amber-300 transition-colors" />
                <span>Replay Build</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
