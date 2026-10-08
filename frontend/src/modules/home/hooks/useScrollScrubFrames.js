"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getReturnToCompletedHome, setReturnToCompletedHome } from "../homeState";
import { MILESTONES, STAGE_LABELS } from "./useScrollScrub";

// 50 frames per part, 3 parts = 150 total frames
// Each part maps to: part1 (0-33%), part2 (33-66%), part3 (66-100%)
const FRAMES_PER_PART = 50;

// Preload a set of images and return them as an array of HTMLImageElement
function preloadFrames(basePath, count, onProgress) {
  const images = new Array(count);
  let loaded = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < count; i++) {
      const img = new Image();
      const n = String(i).padStart(3, "0");
      img.src = `${basePath}/f_${n}.webp`;
      img.onload = img.onerror = () => {
        loaded++;
        if (onProgress) onProgress(loaded / count);
        if (loaded === count) resolve(images);
      };
      images[i] = img;
    }
  });
}

export function useScrollScrubFrames(containerRef) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayedPct, setDisplayedPct] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCompletedBuild, setHasCompletedBuild] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stageName, setStageName] = useState(STAGE_LABELS[0]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [frameLoadProgress, setFrameLoadProgress] = useState(0);

  // Canvas ref for drawing frames
  const canvasRef = useRef(null);

  // Preloaded frame sets per part
  const framesRef = useRef([null, null, null]); // [part1[], part2[], part3[]]
  const partLoadedRef = useRef([false, false, false]);
  const currentFrameRef = useRef(0);
  const activePartIndexRef = useRef(0);
  const currentStepRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const cooldownRef = useRef(false);
  const touchStartYRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastDisplayedPctRef = useRef(0);
  const targetStepRef = useRef(0);
  const animRafRef = useRef(null);
  const lastGestureTimeRef = useRef(0);

  // Sync refs
  useEffect(() => { activePartIndexRef.current = activePartIndex; }, [activePartIndex]);
  useEffect(() => {
    hasCompletedRef.current = hasCompletedBuild;
  }, [hasCompletedBuild]);

  // Viewport orientation
  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined") {
        const portrait = window.innerHeight > window.innerWidth;
        setIsPortrait((p) => p !== portrait ? portrait : p);
      }
    };
    requestAnimationFrame(check);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    };
  }, []);

  // Get frame base path for a part index (selects native portrait frames on vertical viewports, landscape on desktop)
  const getFrameBasePath = useCallback((partIdx) => {
    const orientation = isPortrait ? "portrait" : "landscape";
    return `/assets/frames/${orientation}/part${partIdx + 1}`;
  }, [isPortrait]);

  // Preload Part 1 frames on mount, and eagerly prefetch Parts 2 & 3 in background on idle
  useEffect(() => {
    const loadPart = async (partIdx) => {
      if (partLoadedRef.current[partIdx]) return;
      const basePath = getFrameBasePath(partIdx);
      const frames = await preloadFrames(basePath, FRAMES_PER_PART, (pct) => {
        if (partIdx === 0) setFrameLoadProgress(pct);
      });
      framesRef.current[partIdx] = frames;
      partLoadedRef.current[partIdx] = true;
      if (partIdx === 0) {
        setVideoLoaded(true);
        drawFrame(0, 0);
        // Prefetch parts 2 and 3 frames in background so transitions are 0ms instant
        setTimeout(() => {
          loadPart(1).then(() => loadPart(2));
        }, 200);
      }
    };
    loadPart(0);
  }, [getFrameBasePath, drawFrame]);

  // When orientation changes between portrait and landscape, reload Part 1 frames for the new orientation
  useEffect(() => {
    partLoadedRef.current = [false, false, false];
    framesRef.current = [null, null, null];
    const loadPart0 = async () => {
      const basePath = getFrameBasePath(0);
      const frames = await preloadFrames(basePath, FRAMES_PER_PART);
      framesRef.current[0] = frames;
      partLoadedRef.current[0] = true;
      setVideoLoaded(true);
      drawFrame(activePartIndexRef.current, currentFrameRef.current);
    };
    loadPart0();
  }, [isPortrait, getFrameBasePath, drawFrame]);

  // On resize, redraw current frame on resized canvas
  useEffect(() => {
    const handleResize = () => {
      drawFrame(activePartIndexRef.current, currentFrameRef.current);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [drawFrame]);

  // Draw a specific frame from a specific part onto canvas
  const drawFrame = useCallback((partIdx, frameIdx) => {
    currentFrameRef.current = frameIdx;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const frames = framesRef.current[partIdx];
    if (!frames || !frames[frameIdx]) return;
    const img = frames[frameIdx];
    if (!img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure canvas resolution matches display dimensions (cap dpr at 1.5 to strictly prevent RAM bloat on mobile)
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
    const targetW = Math.round((canvas.clientWidth || window.innerWidth) * dpr);
    const targetH = Math.round((canvas.clientHeight || window.innerHeight) * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // Fit to canvas maintaining aspect ratio (cover)
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const dx = (cw - sw) / 2;
    const dy = (ch - sh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, sw, sh);
  }, []);

  // Animate frame transitions (smooth interpolation between frames)
  const animateToFrame = useCallback((partIdx, targetFrameIdx, startFrameIdx, durationMs, onDone) => {
    const startMs = performance.now();
    if (animRafRef.current) cancelAnimationFrame(animRafRef.current);

    const animate = (now) => {
      const elapsed = now - startMs;
      const t = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const frameIdx = Math.round(startFrameIdx + (targetFrameIdx - startFrameIdx) * ease);
      drawFrame(partIdx, Math.min(FRAMES_PER_PART - 1, Math.max(0, frameIdx)));

      // Update progress display
      const globalFrameStart = partIdx * FRAMES_PER_PART + startFrameIdx;
      const globalFrameTarget = partIdx * FRAMES_PER_PART + targetFrameIdx;
      const globalFrameCurrent = globalFrameStart + (globalFrameTarget - globalFrameStart) * ease;
      const totalFrames = 3 * FRAMES_PER_PART;
      const newPct = Math.round((globalFrameCurrent / totalFrames) * 100);
      if (newPct !== lastDisplayedPctRef.current) {
        lastDisplayedPctRef.current = newPct;
        setDisplayedPct(newPct);
        setProgress(globalFrameCurrent / totalFrames);
      }

      if (t < 1) {
        animRafRef.current = requestAnimationFrame(animate);
      } else {
        drawFrame(partIdx, targetFrameIdx);
        isAnimatingRef.current = false;
        animRafRef.current = null;
        if (onDone) onDone();
      }
    };
    animRafRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  // Go to a specific step
  const goToStep = useCallback(function advanceFramesStep(targetStep, immediate = false) {
    if (hasCompletedRef.current && targetStep < 3) return;

    const clampedStep = Math.max(0, Math.min(3, targetStep));
    const prevStep = currentStepRef.current;
    targetStepRef.current = clampedStep;
    currentStepRef.current = clampedStep;

    const milestoneIndex = Math.min(3, clampedStep);
    const targetProgress = MILESTONES[milestoneIndex];
    const targetPct = Math.round(targetProgress * 100);
    const targetPart = clampedStep <= 1 ? 0 : clampedStep === 2 ? 1 : 2;

    setCurrentStep(clampedStep);
    setStageName(STAGE_LABELS[milestoneIndex]);

    if (clampedStep < 3) {
      setIsCompleted(false);
      setHasCompletedBuild(false);
      hasCompletedRef.current = false;
    }

    if (immediate) {
      setActivePartIndex(targetPart);
      setProgress(targetProgress);
      setDisplayedPct(targetPct);
      lastDisplayedPctRef.current = targetPct;
      activePartIndexRef.current = targetPart;
      const frameIdx = clampedStep === 3 ? FRAMES_PER_PART - 1 : 0;
      drawFrame(targetPart, frameIdx);

      if (clampedStep === 3) {
        setIsCompleted(true);
        setHasCompletedBuild(true);
        hasCompletedRef.current = true;
      }

      if (typeof window !== "undefined") {
        isProgrammaticScrollRef.current = true;
        window.scrollTo({ top: clampedStep * window.innerHeight, behavior: "instant" });
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 300);
      }
      return;
    }

    isAnimatingRef.current = true;

    const isForward = clampedStep > prevStep;

    const finishStep = () => {
      if (clampedStep === 3) {
        setIsCompleted(true);
        setHasCompletedBuild(true);
        hasCompletedRef.current = true;
        setReturnToCompletedHome(true);
        setActivePartIndex(2);
        setProgress(1.0);
        setDisplayedPct(100);
        lastDisplayedPctRef.current = 100;
        isAnimatingRef.current = false;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 500);
      } else if (targetStepRef.current > clampedStep) {
        // CONTINUOUS PROGRESSION ("tuloy-tuloy, di humihinto-hinto"):
        // User has already scrolled towards the next step!
        // Seamlessly flow directly into the next part without stopping or pausing.
        const nextStepNum = clampedStep + 1;
        setActivePartIndex(clampedStep);
        isAnimatingRef.current = false;
        advanceFramesStep(nextStepNum);
      } else {
        // Single scroll: rest cleanly at this milestone
        setActivePartIndex(clampedStep);
        setProgress(targetProgress);
        setDisplayedPct(targetPct);
        lastDisplayedPctRef.current = targetPct;
        isAnimatingRef.current = false;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 200);
      }
    };

    if (isForward) {
      // Preload next part lazily if not ready
      if (targetPart === 1 && !partLoadedRef.current[1]) {
        preloadFrames(getFrameBasePath(1), FRAMES_PER_PART).then((frames) => {
          framesRef.current[1] = frames;
          partLoadedRef.current[1] = true;
        });
      } else if (targetPart === 2 && !partLoadedRef.current[2]) {
        preloadFrames(getFrameBasePath(2), FRAMES_PER_PART).then((frames) => {
          framesRef.current[2] = frames;
          partLoadedRef.current[2] = true;
        });
      }

      setActivePartIndex(targetPart);
      activePartIndexRef.current = targetPart;
      // Snappy ~750ms per part (~2.25s total sequence for 1-3s goal)
      animateToFrame(targetPart, FRAMES_PER_PART - 1, 0, 750, finishStep);
    } else {
      // Backward — animate from last frame back to 0
      const prevPart = prevStep <= 1 ? 0 : prevStep === 2 ? 1 : 2;
      animateToFrame(prevPart, 0, FRAMES_PER_PART - 1, 420, () => {
        setActivePartIndex(targetPart);
        activePartIndexRef.current = targetPart;
        setProgress(targetProgress);
        setDisplayedPct(targetPct);
        lastDisplayedPctRef.current = targetPct;
        isAnimatingRef.current = false;
      });
    }

    if (typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      window.scrollTo({ top: clampedStep * window.innerHeight, behavior: "instant" });
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 400);
    }
  }, [animateToFrame, drawFrame, getFrameBasePath]);

  // Instant skip / fast-forward to 100% completed residence
  const skipBuild = useCallback(() => {
    if (hasCompletedRef.current) return;

    if (animRafRef.current) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }

    setActivePartIndex(2);
    activePartIndexRef.current = 2;
    setCurrentStep(3);
    currentStepRef.current = 3;
    targetStepRef.current = 3;
    setProgress(1.0);
    setDisplayedPct(100);
    lastDisplayedPctRef.current = 100;
    setStageName(STAGE_LABELS[3]);
    setIsCompleted(true);
    setHasCompletedBuild(true);
    hasCompletedRef.current = true;
    setReturnToCompletedHome(true);
    isAnimatingRef.current = false;

    // Draw final frame of part 3
    drawFrame(2, FRAMES_PER_PART - 1);

    if (typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      window.scrollTo({ top: 3 * window.innerHeight, behavior: "instant" });
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 300);
    }

    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 500);
  }, [drawFrame]);

  // Advance build smoothly, or 4th scroll navigates to homepage #overview
  const nextStep = useCallback(() => {
    // If build is already completed: 4th scroll transitions to homepage #overview
    if (hasCompletedRef.current || currentStepRef.current >= 3) {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 600);
      const overviewEl = document.getElementById("overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        window.scrollTo({ top: 4 * window.innerHeight, behavior: "smooth" });
      }
      return;
    }

    // Advance 1 milestone per scroll (Steps 0 -> 1 -> 2 -> 3):
    // Even if animation is running, increment targetStepRef so
    // playback chains continuously ("tuloy-tuloy") into the next part.
    const currentTarget = targetStepRef.current;
    const newTarget = Math.min(3, Math.max(currentTarget + 1, currentStepRef.current + 1));
    targetStepRef.current = newTarget;

    if (!isAnimatingRef.current) {
      goToStep(newTarget);
    }
  }, [goToStep]);

  const prevStep = useCallback(() => {}, []); // locked forward-only

  // Gesture & keyboard handlers (same as useScrollScrub)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const isInHero = scrollY <= 3.15 * vh;
      if (isInHero) {
        e.preventDefault();
        // CASE 1: Build completed
        if (hasCompletedRef.current && currentStepRef.current >= 3) {
          if (e.deltaY > 0 && !cooldownRef.current) {
            const now = performance.now();
            if (now - lastGestureTimeRef.current > 200 && Math.abs(e.deltaY) > 12) {
              lastGestureTimeRef.current = now;
              nextStep();
            }
          } else if (e.deltaY < 0 && scrollY < 3 * vh) {
            window.scrollTo({ top: 3 * vh, behavior: "instant" });
          }
          return;
        }

        // CASE 2: Build in progress - continuous non-blocking progression
        if (e.deltaY > 0) {
          const now = performance.now();
          if (now - lastGestureTimeRef.current > 180 && Math.abs(e.deltaY) > 12) {
            lastGestureTimeRef.current = now;
            nextStep();
          }
        }
        return;
      }
      if (e.deltaY < 0 && scrollY <= 3.25 * vh) {
        e.preventDefault();
        window.scrollTo({ top: 3 * vh, behavior: "smooth" });
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const isInHero = window.scrollY <= 3.15 * window.innerHeight;
      if (isInHero) {
        const target = e.target;
        if (target?.closest?.("button") || target?.closest?.("a") || target?.closest?.("input")) return;
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      const isInHero = window.scrollY <= 3.15 * window.innerHeight;
      if (e.changedTouches.length === 1 && isInHero) {
        const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
        if (Math.abs(deltaY) > 24) {
          if (deltaY > 0) {
            const now = performance.now();
            if (now - lastGestureTimeRef.current > 180) {
              lastGestureTimeRef.current = now;
              nextStep();
            }
          }
        }
      }
    };

    const handleKeyDown = (e) => {
      const isInHero = window.scrollY <= 3.15 * window.innerHeight;
      if (isInHero) {
        if (!hasCompletedRef.current) {
          if (["ArrowDown", "PageDown", " "].includes(e.key)) {
            e.preventDefault();
            const now = performance.now();
            if (now - lastGestureTimeRef.current > 180) {
              lastGestureTimeRef.current = now;
              nextStep();
            }
          } else if (["ArrowUp", "PageUp"].includes(e.key)) {
            e.preventDefault();
          }
        } else {
          if (["ArrowDown", "PageDown", " "].includes(e.key)) {
            e.preventDefault();
            nextStep();
          } else if (["ArrowUp", "PageUp"].includes(e.key)) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, nextStep]);

  // Scroll sync
  useEffect(() => {
    let scrollTimeout = null;
    const handleScroll = () => {
      if (isAnimatingRef.current || isProgrammaticScrollRef.current) return;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      if (hasCompletedRef.current) {
        if (!isProgrammaticScrollRef.current && scrollY < 3 * vh - 8) window.scrollTo({ top: 3 * vh, behavior: "instant" });
        return;
      }
      if (!hasCompletedRef.current && scrollY > 3.05 * vh) {
        window.scrollTo({ top: currentStepRef.current * vh, behavior: "instant" });
        return;
      }
      if (!isAnimatingRef.current && !cooldownRef.current && !isProgrammaticScrollRef.current && scrollY <= 3.05 * vh) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (isProgrammaticScrollRef.current || isAnimatingRef.current) return;
          const nearestStep = Math.min(3, Math.max(0, Math.round(scrollY / vh)));
          if (nearestStep !== currentStepRef.current) goToStep(nearestStep, false);
        }, 150);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(scrollTimeout); };
  }, [goToStep]);

  // Return-to-completed-home
  useEffect(() => {
    const isRet = getReturnToCompletedHome();
    if (isRet && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        setCurrentStep(3);
        setActivePartIndex(2);
        setProgress(1.0);
        setDisplayedPct(100);
        setIsCompleted(true);
        setHasCompletedBuild(true);
        setStageName(STAGE_LABELS[3]);
        currentStepRef.current = 3;
        activePartIndexRef.current = 2;
        hasCompletedRef.current = true;
        targetStepRef.current = 3;
        lastDisplayedPctRef.current = 100;
        isProgrammaticScrollRef.current = true;
        window.scrollTo({ top: 3 * window.innerHeight, behavior: "instant" });
        // Show last frame
        if (framesRef.current[2]) drawFrame(2, FRAMES_PER_PART - 1);
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 300);
      });
    }
  }, [drawFrame]);

  // Goto-completed event
  useEffect(() => {
    const handleGotoCompleted = () => {
      goToStep(3, true);
      setReturnToCompletedHome(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 3 * window.innerHeight, behavior: "smooth" });
    };
    window.addEventListener("mcpa:goto-completed", handleGotoCompleted);
    return () => window.removeEventListener("mcpa:goto-completed", handleGotoCompleted);
  }, [goToStep]);

  const replayBuild = useCallback(() => {
    setReturnToCompletedHome(false);
    hasCompletedRef.current = false;
    setHasCompletedBuild(false);
    setIsCompleted(false);
    goToStep(0, true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [goToStep]);

  return {
    canvasRef,
    activePartIndex,
    currentStep,
    progress,
    displayedPct,
    isCompleted,
    hasCompletedBuild,
    isPortrait,
    stageName,
    videoLoaded,
    frameLoadProgress,
    nextStep,
    prevStep,
    goToStep,
    skipBuild,
    replayBuild,
  };
}
