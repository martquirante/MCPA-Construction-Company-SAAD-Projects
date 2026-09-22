"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getReturnToCompletedHome, setReturnToCompletedHome } from "../homeState";

export const MILESTONES = [0, 0.33, 0.66, 1.00];

export const STAGE_LABELS = [
  "00 · Ground Zero & Site Layout",
  "01 · Excavation & Structural Foundation",
  "02 · Framing & Architectural Enclosure",
  "03 · Modern Residence · 100% Completed",
];

export function useScrollScrub(containerRef) {
  const isReturning = getReturnToCompletedHome();
  const [currentStep, setCurrentStep] = useState(isReturning ? 3 : 0);
  const [progress, setProgress] = useState(isReturning ? 1.0 : 0);
  const [displayedPct, setDisplayedPct] = useState(isReturning ? 100 : 0);
  const [isCompleted, setIsCompleted] = useState(isReturning);
  const [hasCompletedBuild, setHasCompletedBuild] = useState(isReturning);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stageName, setStageName] = useState(isReturning ? STAGE_LABELS[3] : STAGE_LABELS[0]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef(null);
  const currentStepRef = useRef(isReturning ? 3 : 0);
  const isAnimatingRef = useRef(false);
  const cooldownRef = useRef(false);
  const rafIdRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasCompletedRef = useRef(isReturning);
  const videoFinishedRef = useRef(isReturning);

  // Sync ref with completed state
  useEffect(() => {
    hasCompletedRef.current = hasCompletedBuild;
    if (hasCompletedBuild) {
      videoFinishedRef.current = true;
    }
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

  const targetStepRef = useRef(isReturning ? 3 : 0);
  const playRafRef = useRef(null);
  const watchdogRef = useRef(null);
  const lastSeekTimeRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isLowEndRef = useRef(false);
  const lastDisplayedPctRef = useRef(isReturning ? 100 : 0);

  useEffect(() => {
    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, []);

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

  // Transition to target step (0..3):
  // Steps 0..2 = Construction stages (0%, 33%, 66%)
  // Step 3 = 100% Completed Residence + UI Reveal ("3 scroll lang sya, tas pang apat is nasa homepage")
  const goToStep = useCallback((targetStep, immediate = false) => {
    // If build is completed, lock progression at completed residence - never unbuild!
    if (hasCompletedRef.current && targetStep < 3) {
      return;
    }
    const clampedStep = Math.max(0, Math.min(3, targetStep));
    targetStepRef.current = clampedStep;

    // Progress calculation: Steps 0..3 map to milestones [0, 0.33, 0.66, 1.0]
    const milestoneIndex = Math.min(3, clampedStep);
    const targetProgress = MILESTONES[milestoneIndex];
    const targetPercentage = Math.round(targetProgress * 100);
    const targetLabel = STAGE_LABELS[milestoneIndex];

    currentStepRef.current = clampedStep;
    setCurrentStep(clampedStep);
    setStageName(targetLabel);

    const video = videoRef.current;
    const duration = video?.duration && isFinite(video.duration) ? video.duration : 10.0;
    const maxTimestamp = Math.max(0, duration - 0.04);
    const targetTimestamp = clampedStep >= 3
      ? maxTimestamp
      : (clampedStep / 3) * maxTimestamp;

    // If moving back to earlier steps, reset completed flags
    if (clampedStep < 3) {
      setIsCompleted(false);
      setHasCompletedBuild(false);
      hasCompletedRef.current = false;
      videoFinishedRef.current = false;
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
      if (clampedStep === 3) {
        setIsCompleted(true);
        setHasCompletedBuild(true);
        hasCompletedRef.current = true;
        videoFinishedRef.current = true;
      }
      return;
    }

    // If already at Step 3 (100% built), video is at final frame
    const currentVideoTime = video.currentTime || 0;
    if (clampedStep >= 3 && currentStepRef.current >= 3 && Math.abs(currentVideoTime - targetTimestamp) < 0.1) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      isAnimatingRef.current = false;
      setProgress(1.0);
      setDisplayedPct(100);
      setIsCompleted(true);
      setHasCompletedBuild(true);
      hasCompletedRef.current = true;
      videoFinishedRef.current = true;
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
      // Adaptive speed: 1.25x on mobile/low-end devices, 1.45x on desktop for brisk, smooth progression
      const playbackSpeed = isLowEndRef.current ? 1.25 : 1.45;
      video.playbackRate = playbackSpeed;
      const playPromise = video.play();

      // Dynamic watchdog timeout tailored to distance + safety margin (never kills video prematurely)
      const travelDistance = Math.abs(targetTimestamp - currentVideoTime);
      const watchdogMs = Math.max(3500, Math.ceil((travelDistance / playbackSpeed) * 1000) + 1200);

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

        if (clampedStep === 3) {
          setIsCompleted(true);
          setHasCompletedBuild(true);
          hasCompletedRef.current = true;
          videoFinishedRef.current = true;
        }
      }, watchdogMs);

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

          // Crucial: Step 3 only reveals completion UI once the house is 100% finished building
          if (clampedStep === 3) {
            setIsCompleted(true);
            setHasCompletedBuild(true);
            hasCompletedRef.current = true;
            videoFinishedRef.current = true;
          }
        } else {
          // If browser paused playback mid-transition, try to resume
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

  // Advance to next milestone (0 -> 33% -> 66% -> 100% -> 4th scroll enters homepage #overview)
  // Guarantees the video is 100% finished/built BEFORE transitioning to the homepage
  const nextStep = useCallback(() => {
    if (cooldownRef.current) return;

    const curr = currentStepRef.current;
    if (curr < 3 && isAnimatingRef.current) return;
    const video = videoRef.current;
    const duration = video?.duration && isFinite(video.duration) ? video.duration : 10.0;
    const maxTimestamp = Math.max(0, duration - 0.04);
    const isAtEnd = videoFinishedRef.current || (video && video.currentTime >= maxTimestamp - 0.08);

    if (curr < 3) {
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 350);
      goToStep(curr + 1);
    } else {
      // 4th scroll / Step 3 interaction:
      // If the video has NOT finished playing to 100% yet:
      // Must ensure the video completes and the house is fully built BEFORE going to home screen!
      if (!isAtEnd || isAnimatingRef.current) {
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 450);

        if (playRafRef.current) {
          cancelAnimationFrame(playRafRef.current);
          playRafRef.current = null;
        }
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }
        if (video) {
          video.pause();
          try {
            video.currentTime = maxTimestamp;
          } catch (e) {}
        }
        lastDisplayedPctRef.current = 100;
        setDisplayedPct(100);
        setProgress(1.0);
        setIsCompleted(true);
        setHasCompletedBuild(true);
        hasCompletedRef.current = true;
        videoFinishedRef.current = true;
        isAnimatingRef.current = false;
        // The house is now 100% built! Stay on the completed hero so the user sees the completed house
        return;
      }

      // Video IS verified 100% completed and house is fully built!
      // Smoothly enter the rest of the website (#overview)
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 600);

      const overviewEl = document.getElementById("overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        const vh = window.innerHeight;
        window.scrollTo({ top: 4 * vh, behavior: "smooth" });
      }
    }
  }, [goToStep]);

  // Step back to previous milestone (only active during initial construction stages before completion)
  const prevStep = useCallback(() => {
    // Lock reverse once build is completed (Step 3) - user requested "wag sya ma scroll up pabalik sa video scroll"
    if (currentStepRef.current >= 3 || hasCompletedRef.current) {
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

      // CASE 1: Build is completed (Step 3 reached or site completed)
      if (hasCompletedRef.current || currentStepRef.current >= 3) {
        if (e.deltaY > 25) {
          // Scrolling DOWN
          // If resting on the completed hero (at or near 3 * vh), advance smoothly into #overview
          if (scrollY <= 3.1 * vh) {
            e.preventDefault();
            nextStep();
          }
          // If already scrolling through overview or further down, DO NOT preventDefault!
          // Let native smooth scrolling handle everything naturally!
          return;
        } else if (e.deltaY < -25) {
          // Scrolling UP
          // If at the top of the completed hero (scrollY <= 3 * vh + 10):
          // User requested: "wag sya ma scroll up pabalik sa video scroll ganun"
          // Prevent scrolling up into unbuilt stages (0..300vh) and do NOT rewind the video!
          if (scrollY <= 3 * vh + 10) {
            e.preventDefault();
            if (scrollY < 3 * vh) {
              window.scrollTo({ top: 3 * vh, behavior: "instant" });
            }
            return;
          }
          // If anywhere in #overview or further down (scrollY > 3 * vh + 10):
          // User requested: "fix nga ung bug nya na parang rekta agad sa taas ganun??"
          // DO NOT preventDefault! DO NOT window.scrollTo!
          // Allow 100% natural, smooth, unhijacked browser scrolling upward!
          return;
        }
        return;
      }

      // CASE 2: During initial build sequence (Steps 0..2)
      if (e.deltaY > 25) {
        e.preventDefault();
        nextStep();
      } else if (e.deltaY < -25) {
        e.preventDefault();
        if (currentStepRef.current > 0) {
          prevStep();
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

      // Inside hero build sequence, prevent runaway native scroll only before completion
      if (!hasCompletedRef.current && currentStepRef.current < 3 && scrollY <= 3.05 * vh) {
        const target = e.target;
        if (target && target.closest && (target.closest("button") || target.closest("a") || target.closest("input"))) {
          return;
        }
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY;
        const deltaY = touchStartYRef.current - endY;

        // Minimum swipe threshold of 28px
        if (Math.abs(deltaY) > 28) {
          if (deltaY > 0) {
            // Swiped UP = advance to next stage / scroll down
            if (!hasCompletedRef.current && currentStepRef.current < 3) {
              nextStep();
            } else if (scrollY <= 3.1 * vh) {
              nextStep();
            }
          } else {
            // Swiped DOWN = scroll up / back to previous stage
            if (!hasCompletedRef.current && currentStepRef.current < 3) {
              prevStep();
            }
            // Once completed: let natural touch scrolling happen, no snapping or rewinding!
          }
        }
      }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (!hasCompletedRef.current && currentStepRef.current < 3) {
        if (["ArrowDown", "PageDown", " "].includes(e.key)) {
          e.preventDefault();
          nextStep();
        } else if (["ArrowUp", "PageUp"].includes(e.key) && currentStepRef.current > 0) {
          e.preventDefault();
          prevStep();
        }
      } else {
        // Build is completed:
        if (["ArrowDown", "PageDown", " "].includes(e.key) && scrollY <= 3.1 * vh) {
          e.preventDefault();
          nextStep();
        } else if (["ArrowUp", "PageUp"].includes(e.key) && scrollY <= 3.05 * vh) {
          e.preventDefault();
          // At top of completed hero: stay at completed modern residence (3 * vh)
        }
        // When scrollY > 3.05 * vh, default smooth arrow/page scroll handles upward movement naturally
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
  }, [containerRef, nextStep, prevStep, goToStep]);

  // Window scroll sync for manual scrollbar navigation
  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // When build is completed: prevent scrolling up above 3 * vh into unbuilt video stages
      if (hasCompletedRef.current || currentStepRef.current >= 3) {
        if (!isProgrammaticScrollRef.current && scrollY < 3 * vh - 8) {
          window.scrollTo({ top: 3 * vh, behavior: "instant" });
        }
        return;
      }

      const heroEnd = 3.6 * vh;
      if (scrollY >= heroEnd) {
        // Scrolled beyond hero into the rest of the site! Lock completion!
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          videoFinishedRef.current = true;
          setHasCompletedBuild(true);
          currentStepRef.current = 3;
          setCurrentStep(3);
          setProgress(1.0);
          setDisplayedPct(100);
          setStageName(STAGE_LABELS[3]);
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

      // During initial build: If user drags scrollbar directly within hero, debounce snap to nearest milestone
      if (!isAnimatingRef.current && !cooldownRef.current && !isProgrammaticScrollRef.current && scrollY <= 3.05 * vh) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (isProgrammaticScrollRef.current || isAnimatingRef.current) return;
          const nearestStep = Math.min(3, Math.max(0, Math.round(scrollY / vh)));
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
  // Video metadata readiness listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => {
      setVideoLoaded(true);
      if (isReturning) {
        const duration = video.duration && isFinite(video.duration) ? video.duration : 10.0;
        video.currentTime = Math.max(0, duration - 0.04);
        video.pause();
      } else if (video.currentTime < 0.005) {
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
      if (isReturning) {
        const duration = video.duration && isFinite(video.duration) ? video.duration : 10.0;
        video.currentTime = Math.max(0, duration - 0.04);
        video.pause();
      } else if (video.currentTime < 0.005) {
        video.currentTime = 0.01;
      }
    }, 500);

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      clearTimeout(timer);
    };
  }, [isPortrait, isReturning]);

  const handleVideoLoadedMetadata = useCallback(() => {
    setVideoLoaded(true);
    const video = videoRef.current;
    if (video) {
      video.pause();
      if (isReturning) {
        const duration = video.duration && isFinite(video.duration) ? video.duration : 10.0;
        video.currentTime = Math.max(0, duration - 0.04);
      } else if (video.currentTime < 0.005) {
        video.currentTime = 0.01;
      }
    }
  }, [isReturning]);

  // When returning to home page from other routes, immediately position at Step 3 final frame
  useEffect(() => {
    if (isReturning && typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      const vh = window.innerHeight;
      window.scrollTo({ top: 3 * vh, behavior: "instant" });
      const video = videoRef.current;
      if (video) {
        const duration = video.duration && isFinite(video.duration) ? video.duration : 10.0;
        video.currentTime = Math.max(0, duration - 0.04);
        video.pause();
      }
      setReturnToCompletedHome(false);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }
  }, [isReturning]);

  // Replay build functionality
  const replayBuild = useCallback(() => {
    setReturnToCompletedHome(false);
    hasCompletedRef.current = false;
    setHasCompletedBuild(false);
    setIsCompleted(false);
    videoFinishedRef.current = false;
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
