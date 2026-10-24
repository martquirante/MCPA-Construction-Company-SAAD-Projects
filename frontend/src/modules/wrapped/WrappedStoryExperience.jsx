"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Shuffle,
  Sun,
  Moon,
  X,
  Play,
  Pause,
  Link as LinkIcon,
  Check,
  Sparkles,
} from "lucide-react";
import {
  STORY_W,
  STORY_H,
  CHAPTER_TITLES,
  buildScenes,
  resolveFonts,
} from "./wrappedScenes";
import { downloadSlidePng, shareSlideToSocial } from "./wrappedSlideExporter";

const SLIDE_DURATION_MS = 8000;

export default function WrappedStoryExperience({
  payload,
  initialTheme = "dark",
  onClose = null,
  mode = "standalone", // "standalone" | "modal" | "onboarding" | "public"
  onCompleteOnboarding = null,
  shareToken = null,
}) {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : initialTheme;
    }
    return initialTheme;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [seeds, setSeeds] = useState(() => Array(12).fill(0));
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const containerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);

  const fonts = useMemo(() => resolveFonts(), []);

  // Re-build all 12 scenes based on current payload, active theme, and random seeds
  const scenes = useMemo(() => {
    if (!payload) return [];
    return buildScenes({
      payload,
      theme,
      fonts,
      seeds,
    });
  }, [payload, theme, fonts, seeds]);

  const currentScene = scenes[currentIdx] || null;

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Next / Previous slide navigation
  const goToNext = useCallback(() => {
    setProgress(0);
    if (currentIdx < scenes.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      if (mode === "onboarding" && onCompleteOnboarding) {
        onCompleteOnboarding();
      } else {
        setIsPaused(true);
      }
    }
  }, [currentIdx, scenes.length, mode, onCompleteOnboarding]);

  const goToPrev = useCallback(() => {
    setProgress(0);
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }, [currentIdx]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Auto-advance progress timer
  useEffect(() => {
    if (isPaused || !scenes.length) return;
    const interval = 50;
    const step = interval / SLIDE_DURATION_MS;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, scenes.length, goToNext]);

  // Shuffle photos on collage slides
  const handleShuffle = () => {
    setSeeds((prev) => {
      const next = [...prev];
      next[currentIdx] = (next[currentIdx] || 0) + 1;
      return next;
    });
    showToast("Collage selection re-shuffled");
  };

  // Download slide as 1080x1920 PNG
  const handleDownload = async () => {
    if (!currentScene || isExporting) return;
    setIsExporting(true);
    showToast("Rendering 1080×1920 Story Card...");
    try {
      const code = payload?.project?.projectCode || "mcpa";
      const filename = `${code}-wrapped-chapter-${currentIdx + 1}.png`;
      const ok = await downloadSlidePng(currentScene, filename);
      if (ok) showToast("Story Card downloaded successfully!");
      else showToast("Download failed. Please try again.");
    } catch (err) {
      console.warn("Export error:", err);
      showToast("Download failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Share slide to social / Web Share API
  const handleShareSlide = async () => {
    if (!currentScene || isExporting) return;
    setIsExporting(true);
    showToast("Preparing Story Card for share...");
    try {
      const code = payload?.project?.projectCode || "mcpa";
      const filename = `${code}-wrapped-chapter-${currentIdx + 1}.png`;
      const res = await shareSlideToSocial(currentScene, {
        filename,
        title: `${payload?.project?.title || "My Residence"} · Chapter ${currentIdx + 1}`,
        text: `From inquiry to turnkey handover with MCPA Construction.`,
      });
      if (res.method === "native-share") {
        showToast("Shared to social stories!");
      } else if (res.method === "download-fallback") {
        showToast("Story image downloaded! Post it directly to your IG Story.");
      }
    } catch (err) {
      console.warn("Share error:", err);
      showToast("Sharing failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Copy public link
  const handleCopyLink = () => {
    const token = shareToken || payload?.share_token || payload?.shareToken;
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/wrapped/${token || "story"}`
      : `/wrapped/${token || "story"}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast("Public Wrapped Monograph link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Touch and hold to pause
  const handleHoldStart = () => {
    isHoldingRef.current = true;
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsPaused(false);
    }
  };

  if (!payload || !scenes.length) {
    return (
      <div className="min-h-screen bg-[#080a0e] text-neutral-400 flex items-center justify-center font-mono text-xs">
        LOADING ARCHITECTURAL WRAPPED...
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen flex flex-col items-center justify-center select-none overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#080a0e] text-white" : "bg-[#f4f2ee] text-neutral-900"
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 z-50 px-4 py-2 rounded-md bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 text-xs font-mono tracking-tight shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <header className="w-full max-w-5xl px-4 py-3 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-none bg-amber-500" />
          <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-80">
            {payload.project?.title || "Project Monograph"}
          </span>
          <span className="text-xs font-mono opacity-40 hidden sm:inline">
            · {CHAPTER_TITLES[currentIdx]}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={`p-2 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
              isDark
                ? "bg-[#141820] border-white/15 text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700 hover:text-black shadow-xs"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Theme`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-600" />}
          </button>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className={`p-2 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
              isDark
                ? "bg-[#141820] border-white/15 text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700 hover:text-black shadow-xs"
            }`}
            title={isPaused ? "Play" : "Pause"}
            aria-label={isPaused ? "Play Story" : "Pause Story"}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Copy Public Link */}
          {(shareToken || payload?.share_token) && (
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-md border text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? "bg-[#141820] border-white/15 text-neutral-300 hover:text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:text-black shadow-xs"
              }`}
              title="Copy Public Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Share Link</span>
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
                isDark
                  ? "bg-[#141820] border-white/15 text-neutral-300 hover:text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:text-black shadow-xs"
              }`}
              title="Close Story"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport Container (Aspect ratio 9:16 bounded) */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-4 max-h-[calc(100vh-140px)]">
        {/* Navigation Arrow Left (Desktop) */}
        {currentIdx > 0 && (
          <button
            type="button"
            onClick={goToPrev}
            className={`hidden md:flex absolute left-6 z-30 w-11 h-11 items-center justify-center rounded-md border transition-all cursor-pointer ${
              isDark
                ? "bg-[#11141a]/80 border-white/15 text-neutral-300 hover:text-white hover:bg-[#181d26]"
                : "bg-white/80 border-neutral-300 text-neutral-700 hover:text-black hover:bg-white shadow-sm"
            }`}
            title="Previous Chapter (Left Arrow)"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 9:16 Slide Frame */}
        <div
          className={`relative h-full aspect-[9/16] max-w-[500px] max-h-[880px] rounded-sm overflow-hidden shadow-2xl transition-shadow ${
            isDark
              ? "border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              : "border border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
          }`}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          {/* Top 12-segment Progress Rail */}
          <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 flex gap-1 pointer-events-none">
            {scenes.map((sc, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              const fillPct = isPast ? 100 : isCurrent ? progress * 100 : 0;
              return (
                <div
                  key={sc.id}
                  className="flex-1 h-1 rounded-none overflow-hidden bg-white/20 dark:bg-white/15 backdrop-blur-xs"
                >
                  <div
                    className="h-full bg-amber-500 transition-all duration-75 ease-linear"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Left/Right Tap Target Zones (Mobile story UX) */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          />

          {/* Vector SVG Scene Renderer (Always 100% vector-sharp at any viewport) */}
          <svg
            viewBox={`0 0 ${STORY_W} ${STORY_H}`}
            className="w-full h-full block pointer-events-none"
            style={{ backgroundColor: currentScene.bg }}
          >
            {currentScene.items.map((it, idx) => {
              if (it.t === "rect") {
                return (
                  <rect
                    key={idx}
                    x={it.x}
                    y={it.y}
                    width={it.w}
                    height={it.h}
                    fill={it.fill || "none"}
                    stroke={it.stroke || "none"}
                    strokeWidth={it.sw || 1}
                  />
                );
              }
              if (it.t === "line") {
                return (
                  <line
                    key={idx}
                    x1={it.x1}
                    y1={it.y1}
                    x2={it.x2}
                    y2={it.y2}
                    stroke={it.color}
                    strokeWidth={it.w || 1}
                  />
                );
              }
              if (it.t === "image") {
                return (
                  <image
                    key={idx}
                    href={it.src}
                    x={it.x}
                    y={it.y}
                    width={it.w}
                    height={it.h}
                    preserveAspectRatio="xMidYMid slice"
                  />
                );
              }
              if (it.t === "text") {
                const anchor =
                  it.align === "center"
                    ? "middle"
                    : it.align === "right"
                    ? "end"
                    : "start";
                return (
                  <text
                    key={idx}
                    x={it.x}
                    y={it.y}
                    textAnchor={anchor}
                    fill={it.color}
                    fontSize={it.size}
                    fontWeight={it.weight}
                    letterSpacing={it.ls ? `${it.ls}px` : undefined}
                    fontFamily={it.font === "mono" ? fonts.mono : fonts.display}
                  >
                    {it.text}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>

        {/* Navigation Arrow Right (Desktop) */}
        {currentIdx < scenes.length - 1 && (
          <button
            type="button"
            onClick={goToNext}
            className={`hidden md:flex absolute right-6 z-30 w-11 h-11 items-center justify-center rounded-md border transition-all cursor-pointer ${
              isDark
                ? "bg-[#11141a]/80 border-white/15 text-neutral-300 hover:text-white hover:bg-[#181d26]"
                : "bg-white/80 border-neutral-300 text-neutral-700 hover:text-black hover:bg-white shadow-sm"
            }`}
            title="Next Chapter (Right Arrow)"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Architectural Action Bar (Per-Slide Actions) */}
      <footer className="w-full max-w-xl px-4 py-3 flex items-center justify-between gap-2 z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Shuffle Collage Photos (for collage slides only) */}
          {currentScene.shuffle && (
            <button
              type="button"
              onClick={handleShuffle}
              className={`px-3 py-2 rounded-md border text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? "bg-[#141820] border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  : "bg-white border-amber-500/50 text-amber-700 hover:bg-amber-50 shadow-xs"
              }`}
              title="Shuffle randomized photos for this chapter"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Photos</span>
            </button>
          )}

          {/* Chapter indicator */}
          <span className="text-[11px] font-mono opacity-60">
            CHAPTER {String(currentIdx + 1).padStart(2, "0")} OF 12
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download 1080x1920 IG Story PNG */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className={`px-3 py-2 rounded-md border text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? "bg-[#141820] border-white/15 text-neutral-200 hover:text-white hover:bg-[#1a202c]"
                : "bg-white border-neutral-300 text-neutral-800 hover:text-black hover:bg-neutral-50 shadow-xs"
            }`}
            title="Download crisp 9:16 Story (1080×1920 PNG)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Story</span>
          </button>

          {/* Share directly to IG Story / Native apps */}
          <button
            type="button"
            onClick={handleShareSlide}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Share to Instagram Story"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Story</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
