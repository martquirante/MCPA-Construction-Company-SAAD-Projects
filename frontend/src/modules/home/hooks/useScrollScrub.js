"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export const MILESTONES = [0, 0.20, 0.40, 0.60, 0.80, 1.00];

export const STAGE_LABELS = [
  "00 · Ground Zero & Site Layout",
  "01 · Excavation & Foundation Pouring",
  "02 · Reinforced Masonry & Structural Framing",
  "03 · Second Level Slab & Scaffolding",
  "04 · Architectural Glass & Facade Enclosure",
  "05 · Luxury Residence · Ready for Living",
];

export function useScrollScrub(containerRef) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayedPct, setDisplayedPct] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCompletedBuild, setHasCompletedBuild] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stageName, setStageName] = useState(STAGE_LABELS[0]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef(null);
  const currentStepRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const cooldownRef = useRef(false);
  const rafIdRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasCompletedRef = useRef(false);

  // Sync ref with completed state
  useEffect(() => {
    hasCompletedRef.current = hasCompletedBuild;
  }, [hasCompletedBuild]);

  // Viewport orientation check (desktop landscape vs mobile portrait)
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const targetStepRef = useRef(0);
  const playRafRef = useRef(null);

  const isProgrammaticScrollRef = useRef(false);

  // Transition to target step (0..5) with milestone percentages [0, 20, 40, 60, 80, 100]
  const goToStep = useCallback((targetStep, immediate = false) => {
    const clampedStep = Math.max(0, Math.min(5, targetStep));
    targetStepRef.current = clampedStep;
    const targetProgress = MILESTONES[clampedStep];
    const targetPercentage = Math.round(targetProgress * 100);
    const targetLabel = STAGE_LABELS[clampedStep];

    currentStepRef.current = clampedStep;
    setCurrentStep(clampedStep);
    setStageName(targetLabel);

    const video = videoRef.current;
    const duration = video?.duration && isFinite(video.duration) ? video.duration : 9.97;
    const targetTimestamp = clampedStep === 5
      ? Math.max(0, duration - 0.04)
      : (clampedStep / 5) * Math.max(0, duration - 0.04);

    if (clampedStep === 5) {
      setIsCompleted(true);
      setHasCompletedBuild(true);
    } else {
      setIsCompleted(false);
    }

    if (immediate || !video) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      isAnimatingRef.current = false;
      setProgress(targetProgress);
      setDisplayedPct(targetPercentage);
      if (video) {
        video.pause();
        video.currentTime = Math.max(0.01, targetTimestamp);
      }
      return;
    }

    const currentVideoTime = video.currentTime || 0;
    const isForward = targetTimestamp > currentVideoTime + 0.04;

    if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    isAnimatingRef.current = true;

    if (isForward) {
      // 1. FORWARD PLAY: Native hardware-accelerated video playback until exact 20% milestone
      video.playbackRate = 1.35; // Crisp time-lapse construction speed
      const playPromise = video.play();

      const monitorForward = () => {
        const nowTime = video.currentTime;
        const currentProg = Math.min(targetProgress, Math.max(0, nowTime / duration));
        const currentPct = Math.min(targetPercentage, Math.round(currentProg * 100));

        setDisplayedPct(currentPct);
        setProgress(currentProg);

        // Check if milestone reached
        if (nowTime >= targetTimestamp - 0.03 || video.ended) {
          video.pause();
          video.currentTime = targetTimestamp;
          setDisplayedPct(targetPercentage);
          setProgress(targetProgress);
          isAnimatingRef.current = false;
          playRafRef.current = null;
        } else {
          playRafRef.current = requestAnimationFrame(monitorForward);
        }
      };

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            playRafRef.current = requestAnimationFrame(monitorForward);
          })
          .catch(() => {
            // Autoplay blocked fallback: smooth scrub
            scrubBackward(currentVideoTime, targetTimestamp, targetProgress, targetPercentage);
          });
      } else {
        playRafRef.current = requestAnimationFrame(monitorForward);
      }
    } else {
      // 2. BACKWARD SCRUB: Smooth reverse interpolation
      video.pause();
      scrubBackward(currentVideoTime, targetTimestamp, targetProgress, targetPercentage);
    }

    // Scroll window smoothly to match step position
    if (typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      const vh = window.innerHeight;
      window.scrollTo({
        top: clampedStep * vh,
        behavior: "instant",
      });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    }
  }, []);

  // Backward interpolation helper for reverse scrolling
  const scrubBackward = (startTime, targetTime, targetProg, targetPct) => {
    const video = videoRef.current;
    const startMs = performance.now();
    const durationMs = 450;
    const startPct = displayedPct;
    const startProg = progress;

    const animateScrub = (now) => {
      const elapsed = now - startMs;
      const t = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);

      const nextTime = Math.max(0.01, startTime + (targetTime - startTime) * ease);
      if (video) video.currentTime = nextTime;

      const nextProg = startProg + (targetProg - startProg) * ease;
      const nextPct = Math.round(startPct + (targetPct - startPct) * ease);
      setProgress(nextProg);
      setDisplayedPct(nextPct);

      if (t < 1) {
        playRafRef.current = requestAnimationFrame(animateScrub);
      } else {
        if (video) {
          video.pause();
          video.currentTime = targetTime;
        }
        setProgress(targetProg);
        setDisplayedPct(targetPct);
        isAnimatingRef.current = false;
        playRafRef.current = null;
      }
    };
    playRafRef.current = requestAnimationFrame(animateScrub);
  };

  // Advance to next milestone (0 -> 20 -> 40 -> 60 -> 80 -> 100 -> 6th scroll exits to site)
  const nextStep = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 350);

    const curr = currentStepRef.current;
    if (curr < 5) {
      goToStep(curr + 1);
    } else {
      // 6th scroll: Finished! Smoothly enter the rest of the website
      const overviewEl = document.getElementById("overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        const vh = window.innerHeight;
        window.scrollTo({ top: 6 * vh, behavior: "smooth" });
      }
    }
  }, [goToStep]);

  // Step back to previous milestone (100 -> 80 -> 60 -> 40 -> 20 -> 0)
  const prevStep = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 450);

    const curr = currentStepRef.current;
    if (curr > 0) {
      goToStep(curr - 1);
    }
  }, [goToStep]);

  // Interactive gestures: Desktop Wheel, Mobile Touch Swipe, and Keyboard
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Desktop Mouse Wheel handler
    const handleWheel = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroMaxScroll = 5 * vh;

      // Inside the 600vh hero sequence
      if (scrollY <= heroMaxScroll + 30) {
        if (e.deltaY > 25) {
          // Scroll Down: 0 -> 20 -> 40 -> 60 -> 80 -> 100, and 6th scroll smoothly exits to #overview
          e.preventDefault();
          nextStep();
        } else if (e.deltaY < -25) {
          // Scroll Up: previous step
          if (currentStepRef.current > 0) {
            e.preventDefault();
            prevStep();
          }
        }
      }
    };

    // Mobile Touch Gesture handlers
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
        touchStartTimeRef.current = performance.now();
      }
    };

    const handleTouchEnd = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroMaxScroll = 5 * vh;

      if (scrollY <= heroMaxScroll + 30 && e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY;
        const deltaY = touchStartYRef.current - endY;

        // Minimum swipe threshold of 28px
        if (Math.abs(deltaY) > 28) {
          if (deltaY > 0) {
            // Swiped UP = scroll down to next stage / exit on 6th swipe
            nextStep();
          } else {
            // Swiped DOWN = scroll up to previous stage
            if (currentStepRef.current > 0) {
              prevStep();
            }
          }
        }
      }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroMaxScroll = 5 * vh;

      if (scrollY <= heroMaxScroll + 30) {
        if (["ArrowDown", "PageDown", " "].includes(e.key)) {
          e.preventDefault();
          nextStep();
        } else if (["ArrowUp", "PageUp"].includes(e.key)) {
          if (currentStepRef.current > 0) {
            e.preventDefault();
            prevStep();
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, nextStep, prevStep]);

  // Window scroll sync for manual scrollbar navigation
  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroEnd = 5 * vh;

      if (scrollY >= heroEnd) {
        // Scrolled beyond hero into the rest of the site! Lock completion!
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setHasCompletedBuild(true);
          currentStepRef.current = 5;
          setCurrentStep(5);
          setProgress(1.0);
          setDisplayedPct(100);
          setStageName(STAGE_LABELS[5]);
          setIsCompleted(true);
          const video = videoRef.current;
          if (video && video.duration) {
            video.pause();
            video.currentTime = video.duration - 0.04;
          }
        }
        return;
      }

      // If user drags scrollbar directly within hero, debounce snap to nearest milestone
      if (!isAnimatingRef.current && !cooldownRef.current && !isProgrammaticScrollRef.current) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (isProgrammaticScrollRef.current || isAnimatingRef.current) return;
          const nearestStep = Math.min(5, Math.max(0, Math.round(scrollY / vh)));
          if (nearestStep !== currentStepRef.current) {
            goToStep(nearestStep, false);
          }
        }, 150);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [goToStep]);

  // Video metadata readiness listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => {
      setVideoLoaded(true);
      if (video.currentTime < 0.005) {
        video.currentTime = 0.01;
      }
    };

    if (video.readyState >= 1) {
      handleReady();
    }

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);

    const timer = setTimeout(() => {
      setVideoLoaded(true);
      if (video.currentTime < 0.005) {
        video.currentTime = 0.01;
      }
    }, 500);

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      clearTimeout(timer);
    };
  }, [isPortrait]);

  const handleVideoLoadedMetadata = useCallback(() => {
    setVideoLoaded(true);
    const video = videoRef.current;
    if (video) {
      video.pause();
      if (video.currentTime < 0.005) {
        video.currentTime = 0.01;
      }
    }
  }, []);

  // Replay build functionality
  const replayBuild = useCallback(() => {
    hasCompletedRef.current = false;
    setHasCompletedBuild(false);
    goToStep(0, true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [goToStep]);

  return {
    videoRef,
    currentStep,
    progress,
    displayedPct,
    isCompleted,
    hasCompletedBuild,
    isPortrait,
    stageName,
    videoLoaded,
    handleVideoLoadedMetadata,
    nextStep,
    prevStep,
    goToStep,
    replayBuild,
  };
}
