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
  const watchdogRef = useRef(null);
  const lastSeekTimeRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isLowEndRef = useRef(false);
  const lastDisplayedPctRef = useRef(0);

  // Detect low-end hardware (<= 4 cores, <= 4GB RAM, or mobile) to tune playback rate and seek throttling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = window.navigator;
      const cores = nav?.hardwareConcurrency || 4;
      const memory = nav?.deviceMemory || 4;
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(nav?.userAgent || "");
      isLowEndRef.current = cores <= 4 || memory <= 4 || isMobile;
    }
  }, []);

  // Backward interpolation helper for reverse scrolling
  const scrubBackward = useCallback((startTime, targetTime, targetProg, targetPct) => {
    const video = videoRef.current;
    const duration = video?.duration && isFinite(video.duration) ? video.duration : 10.0;
    const startProg = Math.min(1, Math.max(0, startTime / duration));
    const startPct = lastDisplayedPctRef.current || Math.round(startProg * 100);
    const startMs = performance.now();
    const durationMs = 450;

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    watchdogRef.current = setTimeout(() => {
      if (playRafRef.current) {
        cancelAnimationFrame(playRafRef.current);
        playRafRef.current = null;
      }
      if (video) {
        video.pause();
        try {
          video.currentTime = targetTime;
        } catch (e) {}
      }
      lastDisplayedPctRef.current = targetPct;
      setProgress(targetProg);
      setDisplayedPct(targetPct);
      isAnimatingRef.current = false;
      watchdogRef.current = null;
    }, durationMs + 200);

    const animateScrub = (now) => {
      const elapsed = now - startMs;
      const t = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);

      const nextTime = Math.max(0.01, startTime + (targetTime - startTime) * ease);

      // Throttle video seeking: 110ms on low-end / mobile to avoid decoder stalls, 75ms on high-end
      const seekInterval = isLowEndRef.current ? 110 : 75;
      if (video && (now - lastSeekTimeRef.current > seekInterval || t >= 1)) {
        lastSeekTimeRef.current = now;
        try {
          video.currentTime = nextTime;
        } catch (e) {}
      }

      const nextProg = startProg + (targetProg - startProg) * ease;
      const nextPct = Math.round(startPct + (targetPct - startPct) * ease);

      // Performance optimization: Only update React state when percentage integer changes
      if (nextPct !== lastDisplayedPctRef.current) {
        lastDisplayedPctRef.current = nextPct;
        setDisplayedPct(nextPct);
        setProgress(nextProg);
      }

      if (t < 1) {
        playRafRef.current = requestAnimationFrame(animateScrub);
      } else {
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }
        if (video) {
          video.pause();
          try {
            video.currentTime = targetTime;
          } catch (e) {}
        }
        lastDisplayedPctRef.current = targetPct;
        setProgress(targetProg);
        setDisplayedPct(targetPct);
        isAnimatingRef.current = false;
        playRafRef.current = null;
      }
    };
    playRafRef.current = requestAnimationFrame(animateScrub);
  }, []);

  // Transition to target step (0..6):
  // Steps 0..5 = Construction stages (0%, 20%, 40%, 60%, 80%, 100% built showcase)
  // Step 6 = UI Reveal ("tas isa pang scroll para lumabas ung UI nya")
  const goToStep = useCallback((targetStep, immediate = false) => {
    const clampedStep = Math.max(0, Math.min(6, targetStep));
    targetStepRef.current = clampedStep;

    // Progress calculation: Steps 0..5 map to milestones [0, 0.2, 0.4, 0.6, 0.8, 1.0]. Step 6 stays at 1.0.
    const milestoneIndex = Math.min(5, clampedStep);
    const targetProgress = MILESTONES[milestoneIndex];
    const targetPercentage = Math.round(targetProgress * 100);
    const targetLabel = STAGE_LABELS[milestoneIndex];

    currentStepRef.current = clampedStep;
    setCurrentStep(clampedStep);
    setStageName(targetLabel);

    const video = videoRef.current;
    const duration = video?.duration && isFinite(video.duration) ? video.duration : 10.0;
    const maxTimestamp = Math.max(0, duration - 0.04);
    const targetTimestamp = clampedStep >= 5
      ? maxTimestamp
      : (clampedStep / 5) * maxTimestamp;

    // Only Step 6 triggers isCompleted (UI overlay revealed). Step 5 keeps the build badge at 100% BUILT.
    if (clampedStep === 6) {
      setIsCompleted(true);
      setHasCompletedBuild(true);
      hasCompletedRef.current = true;
    } else {
      setIsCompleted(false);
    }

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    if (immediate || !video) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      isAnimatingRef.current = false;
      setProgress(targetProgress);
      setDisplayedPct(targetPercentage);
      if (video) {
        video.pause();
        try {
          video.currentTime = Math.max(0.01, targetTimestamp);
        } catch (e) {}
      }
      return;
    }

    // If moving between Step 5 (100% built) and Step 6 (UI reveal), video is already at final frame
    const currentVideoTime = video.currentTime || 0;
    if (clampedStep >= 5 && currentStepRef.current >= 5 && Math.abs(currentVideoTime - targetTimestamp) < 0.1) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      isAnimatingRef.current = false;
      setProgress(1.0);
      setDisplayedPct(100);
      video.pause();
      try {
        video.currentTime = targetTimestamp;
      } catch (e) {}

      if (typeof window !== "undefined") {
        isProgrammaticScrollRef.current = true;
        const vh = window.innerHeight;
        window.scrollTo({
          top: clampedStep * vh,
          behavior: "instant",
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 300);
      }
      return;
    }

    const isForward = targetTimestamp > currentVideoTime + 0.04;

    if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    isAnimatingRef.current = true;

    if (isForward) {
      // 1. FORWARD PLAY: Native hardware-accelerated video playback until exact milestone
      // Adaptive speed: 1.12x on mobile/low-end devices (~33fps, butter smooth on budget decoders), 1.30x on high-end desktop
      video.playbackRate = isLowEndRef.current ? 1.12 : 1.30;
      const playPromise = video.play();

      // Mobile & buffering safety watchdog: Force complete if video stalls or takes > 1600ms
      watchdogRef.current = setTimeout(() => {
        if (playRafRef.current) {
          cancelAnimationFrame(playRafRef.current);
          playRafRef.current = null;
        }
        if (video) {
          video.pause();
          try {
            video.currentTime = targetTimestamp;
          } catch (e) {}
        }
        lastDisplayedPctRef.current = targetPercentage;
        setDisplayedPct(targetPercentage);
        setProgress(targetProgress);
        isAnimatingRef.current = false;
        watchdogRef.current = null;
      }, 1600);

      const monitorForward = () => {
        const nowTime = video.currentTime;
        const currentProg = Math.min(targetProgress, Math.max(0, nowTime / duration));
        const currentPct = Math.min(targetPercentage, Math.round(currentProg * 100));

        // Performance optimization: Only update React state when percentage integer changes
        if (currentPct !== lastDisplayedPctRef.current) {
          lastDisplayedPctRef.current = currentPct;
          setDisplayedPct(currentPct);
          setProgress(currentProg);
        }

        // Check if milestone reached
        if (nowTime >= targetTimestamp - 0.04 || video.ended) {
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }
          video.pause();
          try {
            video.currentTime = targetTimestamp;
          } catch (e) {}
          lastDisplayedPctRef.current = targetPercentage;
          setDisplayedPct(targetPercentage);
          setProgress(targetProgress);
          isAnimatingRef.current = false;
          playRafRef.current = null;
        } else {
          // If mobile browser paused playback mid-transition, try to resume
          if (video.paused && !video.ended && nowTime < targetTimestamp - 0.05) {
            video.play().catch(() => {});
          }
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
  }, [scrubBackward]);

  // Advance to next milestone (0 -> 20 -> 40 -> 60 -> 80 -> 100 -> UI Reveal -> exit to site)
  const nextStep = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 350);

    const curr = currentStepRef.current;
    if (curr < 6) {
      goToStep(curr + 1);
    } else {
      // 7th scroll: Finished! Smoothly enter the rest of the website
      const overviewEl = document.getElementById("overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        const vh = window.innerHeight;
        window.scrollTo({ top: 7 * vh, behavior: "smooth" });
      }
    }
  }, [goToStep]);

  // Step back to previous milestone (UI Reveal -> 100 -> 80 -> 60 -> 40 -> 20 -> 0)
  const prevStep = useCallback(() => {
    // If build has reached Step 6 (UI revealed / build complete), lock it:
    // User cannot scroll up backwards to un-build the house. Replay Build button is used instead.
    if (currentStepRef.current >= 6 || hasCompletedRef.current) {
      return;
    }
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 350);

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
      const heroMaxScroll = 6 * vh;

      // Inside the 700vh hero sequence
      if (scrollY <= heroMaxScroll + 20) {
        if (e.deltaY > 25) {
          if (currentStepRef.current < 6) {
            e.preventDefault();
            nextStep();
          }
        } else if (e.deltaY < -25) {
          // Once at Step 6 or completed: do not allow scrolling up backwards to reverse build!
          if (currentStepRef.current >= 6 || hasCompletedRef.current) {
            e.preventDefault();
            return;
          }
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

    const handleTouchMove = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroMaxScroll = 6 * vh;

      // Prevent native momentum runaway while stepping through build sequence (steps 0 to 5)
      if (scrollY <= heroMaxScroll + 20 && currentStepRef.current < 6) {
        const target = e.target;
        if (target && target.closest && (target.closest("button") || target.closest("a") || target.closest("input"))) {
          return;
        }
        if (e.cancelable) {
          e.preventDefault();
        }
      }

      // If at step 6 / completed, prevent swiping down (which is scrolling up backwards into unbuilt stages)
      if (scrollY <= heroMaxScroll + 20 && (currentStepRef.current >= 6 || hasCompletedRef.current)) {
        if (e.touches.length === 1) {
          const currentY = e.touches[0].clientY;
          if (currentY - touchStartYRef.current > 10) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        }
      }
    };

    const handleTouchEnd = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroMaxScroll = 6 * vh;

      if (scrollY <= heroMaxScroll + 40 && e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY;
        const deltaY = touchStartYRef.current - endY;

        // Minimum swipe threshold of 28px
        if (Math.abs(deltaY) > 28) {
          if (deltaY > 0) {
            // Swiped UP = advance to next stage
            nextStep();
          } else {
            // Swiped DOWN = back to previous stage
            // Once at Step 6 or completed, locking prevents unbuilding!
            if (currentStepRef.current >= 6 || hasCompletedRef.current) {
              return;
            }
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
      const heroMaxScroll = 6 * vh;

      if (scrollY <= heroMaxScroll + 30) {
        if (["ArrowDown", "PageDown", " "].includes(e.key)) {
          if (currentStepRef.current < 6) {
            e.preventDefault();
            nextStep();
          }
        } else if (["ArrowUp", "PageUp"].includes(e.key)) {
          // Once at Step 6 or completed: do not allow scrolling up backwards
          if (currentStepRef.current >= 6 || hasCompletedRef.current) {
            e.preventDefault();
            return;
          }
          if (currentStepRef.current > 0) {
            e.preventDefault();
            prevStep();
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
  }, [containerRef, nextStep, prevStep]);

  // Window scroll sync for manual scrollbar navigation
  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const heroEnd = 6 * vh;

      if (scrollY >= heroEnd) {
        // Scrolled beyond hero into the rest of the site! Lock completion!
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setHasCompletedBuild(true);
          currentStepRef.current = 6;
          setCurrentStep(6);
          setProgress(1.0);
          setDisplayedPct(100);
          setStageName(STAGE_LABELS[5]);
          setIsCompleted(true);
          const video = videoRef.current;
          if (video && video.duration) {
            video.pause();
            try {
              video.currentTime = video.duration - 0.04;
            } catch (e) {}
          }
        }
        return;
      }

      // If already at Step 6 or completed, lock scroll from reversing to earlier stages
      if (hasCompletedRef.current || currentStepRef.current >= 6) {
        if (!isProgrammaticScrollRef.current && scrollY < heroEnd - 30) {
          window.scrollTo({ top: heroEnd, behavior: "instant" });
        }
        return;
      }

      // If user drags scrollbar directly within hero, debounce snap to nearest milestone
      if (!isAnimatingRef.current && !cooldownRef.current && !isProgrammaticScrollRef.current) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (isProgrammaticScrollRef.current || isAnimatingRef.current) return;
          const nearestStep = Math.min(6, Math.max(0, Math.round(scrollY / vh)));
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
    setIsCompleted(false);
    isProgrammaticScrollRef.current = true;
    goToStep(0, true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 650);
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
