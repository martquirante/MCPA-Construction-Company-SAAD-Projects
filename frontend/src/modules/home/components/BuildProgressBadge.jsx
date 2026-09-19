"use client";

import { useState, useEffect } from "react";
import { RotateCcwIcon, ArrowDownIcon } from "../../shared/Icons";

export default function BuildProgressBadge({
  progress,
  displayedPct,
  stageName,
  isCompleted,
  onReplay,
  onAdvance,
}) {
  const percentage = displayedPct !== undefined ? displayedPct : Math.round(progress * 100);
  const [isDismissed, setIsDismissed] = useState(false);

  // 5-second countdown to auto-dismiss "Replay Build" once the user reaches the completed UI state
  useEffect(() => {
    if (!isCompleted) return;

    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isCompleted]);

  const handleReplay = () => {
    setIsDismissed(false);
    if (onReplay) onReplay();
  };

  const showReplay = isCompleted && !isDismissed;

  return (
    <>
      {/* 1. DURING HERO SCROLL: CLEAN TEXT-ONLY CUE (NO BG), LIKE "SCROLL TO EXPLORE" */}
      {!isCompleted && (
        <div className="absolute bottom-10 sm:bottom-6 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-all duration-700 select-none pb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={onAdvance}
            aria-label="Scroll or tap to continue construction animation"
            className="pointer-events-auto inline-flex flex-col items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity duration-300 group cursor-pointer"
          >
            <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] select-none text-center">
              Scroll to Continue
            </span>
            <ArrowDownIcon className="w-3.5 h-3.5 text-amber-400 animate-bounce drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. ONCE COMPLETED: REFINED BOTTOM CUE & REPLAY PILL */}
      {isCompleted && (
        <div className="absolute bottom-10 sm:bottom-6 inset-x-0 z-30 px-6 pointer-events-none transition-all duration-700 ease-out pb-[env(safe-area-inset-bottom,0px)]">
          <div className="relative flex items-center justify-between min-h-[32px]">
            {/* Perfectly centered indicator across the entire viewport width */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={onAdvance}
                aria-label="Scroll or click to explore website"
                className="pointer-events-auto text-xs font-medium tracking-[0.25em] uppercase text-neutral-300 hover:text-amber-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] select-none text-center cursor-pointer transition-colors"
              >
                Scroll to Explore
              </button>
            </div>

            {/* Replay Build pill docked to the right */}
            {onReplay && (
              <div className="ml-auto pointer-events-auto group/replay">
                <button
                  onClick={handleReplay}
                  aria-label="Replay Construction Build Animation"
                  className={`relative z-10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-amber-300 transition-colors duration-300 cursor-pointer inline-flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                    showReplay
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-2 pointer-events-none group-hover/replay:opacity-100 group-hover/replay:translate-y-0 group-hover/replay:pointer-events-auto"
                  }`}
                >
                  <RotateCcwIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-300 transition-colors" />
                  <span>Replay Build</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
