"use client";

import { useState, useEffect } from "react";
import { RotateCcwIcon, ArrowDownIcon } from "../../shared/Icons";
import { useLanguage } from "../../shared/LanguageContext";

export default function BuildProgressBadge({
  progress,
  displayedPct,
  stageName,
  isCompleted,
  onReplay,
  onAdvance,
}) {
  const { t } = useLanguage();
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
      {/* 1. DURING HERO SCROLL: HIGH-CONTRAST FROSTED PILL CUE WITH ANIMATED BOUNCING ARROW */}
      {!isCompleted && (
        <div className="absolute bottom-10 sm:bottom-8 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-all duration-700 select-none pb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={onAdvance}
            aria-label="Scroll or tap to continue construction animation"
            className="pointer-events-auto inline-flex flex-col items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/25 hover:border-amber-400/60 shadow-[0_4px_24px_rgba(0,0,0,0.7)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 group cursor-pointer active:scale-95"
          >
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-white group-hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none text-center">
              {t("scrollToContinue")}
            </span>
            <div className="animate-bounce flex items-center justify-center pt-0.5">
              <ArrowDownIcon className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.95)] group-hover:scale-110 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* 2. ONCE COMPLETED: REFINED BOTTOM CUE & REPLAY PILL */}
      {isCompleted && (
        <div className="absolute bottom-10 sm:bottom-8 inset-x-0 z-30 px-4 sm:px-6 pointer-events-none transition-all duration-700 ease-out pb-[env(safe-area-inset-bottom,0px)]">
          <div className="relative flex flex-col sm:flex-row items-center justify-center sm:justify-between min-h-[36px] gap-2 sm:gap-0">
            {/* Centered indicator with safe mobile stacking */}
            <div className="sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={onAdvance}
                aria-label="Scroll or click to explore website"
                className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/25 hover:border-amber-400/60 text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-white hover:text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] shadow-[0_4px_24px_rgba(0,0,0,0.7)] select-none text-center cursor-pointer transition-all active:scale-95 group"
              >
                <span>{t("scrollExplore")}</span>
                <ArrowDownIcon className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              </button>
            </div>

            {/* Replay Build pill docked to the right */}
            {onReplay && (
              <div className="sm:ml-auto pointer-events-auto group/replay">
                <button
                  onClick={handleReplay}
                  aria-label="Replay Construction Build Animation"
                    className={`relative z-10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-amber-300 transition-colors duration-300 cursor-pointer inline-flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                    showReplay
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-2 pointer-events-none group-hover/replay:opacity-100 group-hover/replay:translate-y-0 group-hover/replay:pointer-events-auto"
                  }`}
                >
                  <RotateCcwIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-300 transition-colors" />
                  <span>{t("replayBuild")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
