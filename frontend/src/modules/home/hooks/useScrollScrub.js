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
  const [activePartIndex, setActivePartIndex] = useState(isReturning ? 2 : 0);
  const [progress, setProgress] = useState(isReturning ? 1.0 : 0);
  const [displayedPct, setDisplayedPct] = useState(isReturning ? 100 : 0);
  const [isCompleted, setIsCompleted] = useState(isReturning);
  const [hasCompletedBuild, setHasCompletedBuild] = useState(isReturning);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stageName, setStageName] = useState(isReturning ? STAGE_LABELS[3] : STAGE_LABELS[0]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Dedicated refs for each of the 3 split MP4 files
  const video1Ref = useRef(null); // Part 1: Step 0 -> 1 (0% to 33%)
  const video2Ref = useRef(null); // Part 2: Step 1 -> 2 (33% to 66%)
  const video3Ref = useRef(null); // Part 3: Step 2 -> 3 (66% to 100%)

  const currentStepRef = useRef(isReturning ? 3 : 0);
  const activePartIndexRef = useRef(isReturning ? 2 : 0);
  const isAnimatingRef = useRef(false);
  const cooldownRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasCompletedRef = useRef(isReturning);
  const videoFinishedRef = useRef(isReturning);

  const targetStepRef = useRef(isReturning ? 3 : 0);
  const playRafRef = useRef(null);
  const watchdogRef = useRef(null);
  const lastSeekTimeRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isLowEndRef = useRef(false);
  const lastDisplayedPctRef = useRef(isReturning ? 100 : 0);

  // Keep activePartIndexRef in sync with state
  useEffect(() => {
    activePartIndexRef.current = activePartIndex;
  }, [activePartIndex]);

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

  useEffect(() => {
    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, []);

  // Detect low-end hardware (<= 4 cores, <= 4GB RAM, or mobile)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = window.navigator;
      const cores = nav?.hardwareConcurrency || 4;
      const memory = nav?.deviceMemory || 4;
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(nav?.userAgent || "");
      isLowEndRef.current = cores <= 4 || memory <= 4 || isMobile;
    }
  }, []);

  // Helper to get video element for a given part index (0, 1, 2)
  const getVideoEl = useCallback((partIdx) => {
    if (partIdx === 0) return video1Ref.current;
    if (partIdx === 1) return video2Ref.current;
    if (partIdx === 2) return video3Ref.current;
    return null;
  }, []);

  // Backward interpolation helper for reverse scrolling within a single part
  const scrubBackward = useCallback((video, startTime, targetTime, startProg, targetProg, startPct, targetPct, onDone) => {
    if (!video) {
      if (onDone) onDone();
      return;
    }

    const startMs = performance.now();
    const durationMs = 420;

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    watchdogRef.current = setTimeout(() => {
      if (playRafRef.current) {
        cancelAnimationFrame(playRafRef.current);
        playRafRef.current = null;
      }
      video.pause();
      try {
        video.currentTime = targetTime;
      } catch (e) {}
      lastDisplayedPctRef.current = targetPct;
      setProgress(targetProg);
      setDisplayedPct(targetPct);
      isAnimatingRef.current = false;
      watchdogRef.current = null;
      if (onDone) onDone();
    }, durationMs + 200);

    const animateScrub = (now) => {
      const elapsed = now - startMs;
      const t = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease-out

      const nextTime = Math.max(0.01, startTime + (targetTime - startTime) * ease);

      const seekInterval = isLowEndRef.current ? 100 : 70;
      if (now - lastSeekTimeRef.current > seekInterval || t >= 1) {
        lastSeekTimeRef.current = now;
        try {
          video.currentTime = nextTime;
        } catch (e) {}
      }

      const nextProg = startProg + (targetProg - startProg) * ease;
      const nextPct = Math.round(startPct + (targetPct - startPct) * ease);

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
        video.pause();
        try {
          video.currentTime = targetTime;
        } catch (e) {}
        lastDisplayedPctRef.current = targetPct;
        setProgress(targetProg);
        setDisplayedPct(targetPct);
        isAnimatingRef.current = false;
        playRafRef.current = null;
        if (onDone) onDone();
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
    const prevStep = currentStepRef.current;
    targetStepRef.current = clampedStep;

    const milestoneIndex = Math.min(3, clampedStep);
    const targetProgress = MILESTONES[milestoneIndex];
    const targetPercentage = Math.round(targetProgress * 100);
    const targetLabel = STAGE_LABELS[milestoneIndex];

    currentStepRef.current = clampedStep;
    setCurrentStep(clampedStep);
    setStageName(targetLabel);

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
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }

    // Determine target active part index
    // Part 0 handles step 0 -> 1
    // Part 1 handles step 1 -> 2
    // Part 2 handles step 2 -> 3
    const targetPart = clampedStep <= 1 ? 0 : clampedStep === 2 ? 1 : 2;

    if (immediate) {
      isAnimatingRef.current = false;
      setActivePartIndex(targetPart);
      setProgress(targetProgress);
      setDisplayedPct(targetPercentage);
      lastDisplayedPctRef.current = targetPercentage;

      const v1 = video1Ref.current;
      const v2 = video2Ref.current;
      const v3 = video3Ref.current;

      if (clampedStep === 0) {
        if (v1) { v1.pause(); v1.currentTime = 0.01; }
        if (v2) { v2.pause(); v2.currentTime = 0.0; }
        if (v3) { v3.pause(); v3.currentTime = 0.0; }
      } else if (clampedStep === 1) {
        if (v1) { v1.pause(); v1.currentTime = Math.max(0.01, (v1.duration || 3.33) - 0.04); }
        if (v2) { v2.pause(); v2.currentTime = 0.0; }
        if (v3) { v3.pause(); v3.currentTime = 0.0; }
      } else if (clampedStep === 2) {
        if (v1) { v1.pause(); v1.currentTime = Math.max(0.01, (v1.duration || 3.33) - 0.04); }
        if (v2) { v2.pause(); v2.currentTime = Math.max(0.01, (v2.duration || 3.33) - 0.04); }
        if (v3) { v3.pause(); v3.currentTime = 0.0; }
      } else if (clampedStep === 3) {
        if (v1) { v1.pause(); v1.currentTime = Math.max(0.01, (v1.duration || 3.33) - 0.04); }
        if (v2) { v2.pause(); v2.currentTime = Math.max(0.01, (v2.duration || 3.33) - 0.04); }
        if (v3) { v3.pause(); v3.currentTime = Math.max(0.01, (v3.duration || 3.31) - 0.04); }
        setIsCompleted(true);
        setHasCompletedBuild(true);
        hasCompletedRef.current = true;
        videoFinishedRef.current = true;
      }
      return;
    }

    isAnimatingRef.current = true;

    // Check if moving FORWARD or BACKWARD
    const isForward = clampedStep > prevStep;

    if (isForward) {
      // FORWARD TRANSITION
      let activeVideo = null;
      let startProg = 0;
      let endProg = targetProgress;
      let startPct = lastDisplayedPctRef.current;
      let endPct = targetPercentage;

      if (clampedStep === 1) {
        // Step 0 -> Step 1: Part 1 plays forward to end
        setActivePartIndex(0);
        activeVideo = video1Ref.current;
        startProg = 0.0;
        endProg = 0.33;
      } else if (clampedStep === 2) {
        // Step 1 -> Step 2: Part 2 plays forward to end
        setActivePartIndex(1);
        activeVideo = video2Ref.current;
        startProg = 0.33;
        endProg = 0.66;
      } else if (clampedStep === 3) {
        // Step 2 -> Step 3: Part 3 plays forward to end
        setActivePartIndex(2);
        activeVideo = video3Ref.current;
        startProg = 0.66;
        endProg = 1.0;
      }

      if (!activeVideo) {
        isAnimatingRef.current = false;
        setProgress(targetProgress);
        setDisplayedPct(targetPercentage);
        return;
      }

      const duration = activeVideo.duration && isFinite(activeVideo.duration) ? activeVideo.duration : 3.33;
      const targetTime = Math.max(0.01, duration - 0.04);
      const playbackSpeed = isLowEndRef.current ? 1.25 : 1.45;
      activeVideo.playbackRate = playbackSpeed;

      const playPromise = activeVideo.play();
      const travelDistance = Math.max(0.1, targetTime - (activeVideo.currentTime || 0));
      const watchdogMs = Math.max(3000, Math.ceil((travelDistance / playbackSpeed) * 1000) + 1000);

      watchdogRef.current = setTimeout(() => {
        if (playRafRef.current) {
          cancelAnimationFrame(playRafRef.current);
          playRafRef.current = null;
        }
        if (activeVideo) {
          activeVideo.pause();
          try {
            activeVideo.currentTime = targetTime;
          } catch (e) {}
        }
        lastDisplayedPctRef.current = endPct;
        setDisplayedPct(endPct);
        setProgress(endProg);
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
        const nowTime = activeVideo.currentTime;
        const normTime = Math.min(1, Math.max(0, nowTime / duration));
        const currentProg = startProg + normTime * (endProg - startProg);
        const currentPct = Math.min(endPct, Math.round(startPct + normTime * (endPct - startPct)));

        if (currentPct !== lastDisplayedPctRef.current) {
          lastDisplayedPctRef.current = currentPct;
          setDisplayedPct(currentPct);
          setProgress(currentProg);
        }

        if (nowTime >= targetTime - 0.04 || activeVideo.ended) {
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }
          activeVideo.pause();
          try {
            activeVideo.currentTime = targetTime;
          } catch (e) {}
          lastDisplayedPctRef.current = endPct;
          setDisplayedPct(endPct);
          setProgress(endProg);
          isAnimatingRef.current = false;
          playRafRef.current = null;

          if (clampedStep === 3) {
            setIsCompleted(true);
            setHasCompletedBuild(true);
            hasCompletedRef.current = true;
            videoFinishedRef.current = true;
          }
        } else {
          if (activeVideo.paused && !activeVideo.ended && nowTime < targetTime - 0.05) {
            activeVideo.play().catch(() => {});
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
            // Autoplay blocked fallback: smooth scrub forward
            scrubBackward(
              activeVideo,
              activeVideo.currentTime || 0.01,
              targetTime,
              startProg,
              endProg,
              startPct,
              endPct,
              () => {
                if (clampedStep === 3) {
                  setIsCompleted(true);
                  setHasCompletedBuild(true);
                  hasCompletedRef.current = true;
                  videoFinishedRef.current = true;
                }
              }
            );
          });
      } else {
        playRafRef.current = requestAnimationFrame(monitorForward);
      }
    } else {
      // BACKWARD TRANSITION
      if (clampedStep === 1 && prevStep === 2) {
        // Step 2 -> Step 1: Part 2 scrubs back from end to 0.01
        const v2 = video2Ref.current;
        if (v2) {
          v2.pause();
          const curTime = v2.currentTime || (v2.duration || 3.33) - 0.04;
          scrubBackward(v2, curTime, 0.01, 0.66, 0.33, 66, 33, () => {
            setActivePartIndex(0);
          });
        } else {
          setActivePartIndex(0);
          setProgress(0.33);
          setDisplayedPct(33);
          isAnimatingRef.current = false;
        }
      } else if (clampedStep === 0 && prevStep === 1) {
        // Step 1 -> Step 0: Part 1 scrubs back from end to 0.01
        const v1 = video1Ref.current;
        if (v1) {
          v1.pause();
          const curTime = v1.currentTime || (v1.duration || 3.33) - 0.04;
          scrubBackward(v1, curTime, 0.01, 0.33, 0.0, 33, 0, () => {
            setActivePartIndex(0);
          });
        } else {
          setActivePartIndex(0);
          setProgress(0.0);
          setDisplayedPct(0);
          isAnimatingRef.current = false;
        }
      } else {
        // Fallback backward jump
        setActivePartIndex(targetPart);
        setProgress(targetProgress);
        setDisplayedPct(targetPercentage);
        isAnimatingRef.current = false;
      }
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
    const v3 = video3Ref.current;
    const duration = v3?.duration && isFinite(v3.duration) ? v3.duration : 3.31;
    const maxTimestamp = Math.max(0, duration - 0.04);
    const isAtEnd = videoFinishedRef.current || (v3 && v3.currentTime >= maxTimestamp - 0.08);

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
        if (v3) {
          v3.pause();
          try {
            v3.currentTime = maxTimestamp;
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
          if (scrollY <= 3.1 * vh) {
            e.preventDefault();
            nextStep();
          }
          return;
        } else if (e.deltaY < -25) {
          // Scrolling UP
          // User requested: "wag sya ma scroll up pabalik sa video scroll ganun"
          if (scrollY <= 3 * vh + 10) {
            e.preventDefault();
            if (scrollY < 3 * vh) {
              window.scrollTo({ top: 3 * vh, behavior: "instant" });
            }
            return;
          }
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
          }
        }
      }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const scrollY = window.scrollY;

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
        const vh = window.innerHeight;
        if (["ArrowDown", "PageDown", " "].includes(e.key) && scrollY <= 3.1 * vh) {
          e.preventDefault();
          nextStep();
        } else if (["ArrowUp", "PageUp"].includes(e.key) && scrollY <= 3.05 * vh) {
          e.preventDefault();
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
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          videoFinishedRef.current = true;
          setHasCompletedBuild(true);
          currentStepRef.current = 3;
          setCurrentStep(3);
          setActivePartIndex(2);
          setProgress(1.0);
          setDisplayedPct(100);
          setStageName(STAGE_LABELS[3]);
          setIsCompleted(true);
          const v3 = video3Ref.current;
          if (v3 && v3.duration) {
            v3.pause();
            try {
              v3.currentTime = v3.duration - 0.04;
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

  // Handle video loaded metadata for all 3 videos
  const handleVideoLoadedMetadata = useCallback(() => {
    setVideoLoaded(true);
    if (isReturning) {
      const v3 = video3Ref.current;
      if (v3) {
        const duration = v3.duration && isFinite(v3.duration) ? v3.duration : 3.31;
        v3.currentTime = Math.max(0.01, duration - 0.04);
        v3.pause();
      }
    } else {
      const v1 = video1Ref.current;
      if (v1 && v1.currentTime < 0.005) {
        v1.currentTime = 0.01;
      }
    }
  }, [isReturning]);

  // Initial video setup on mount
  useEffect(() => {
    const v1 = video1Ref.current;
    const v3 = video3Ref.current;

    const handleReady = () => {
      setVideoLoaded(true);
      if (isReturning) {
        if (v3) {
          const duration = v3.duration && isFinite(v3.duration) ? v3.duration : 3.31;
          v3.currentTime = Math.max(0.01, duration - 0.04);
          v3.pause();
        }
      } else if (v1 && v1.currentTime < 0.005) {
        v1.currentTime = 0.01;
      }
    };

    if (v1 && v1.readyState >= 1) {
      handleReady();
    }

    if (v1) {
      v1.addEventListener("loadedmetadata", handleReady);
      v1.addEventListener("canplay", handleReady);
    }

    const timer = setTimeout(handleReady, 500);

    return () => {
      if (v1) {
        v1.removeEventListener("loadedmetadata", handleReady);
        v1.removeEventListener("canplay", handleReady);
      }
      clearTimeout(timer);
    };
  }, [isPortrait, isReturning]);

  // When returning to home page from other routes, immediately position at Step 3 final frame
  useEffect(() => {
    if (isReturning && typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      const vh = window.innerHeight;
      window.scrollTo({ top: 3 * vh, behavior: "instant" });
      const v3 = video3Ref.current;
      if (v3) {
        const duration = v3.duration && isFinite(v3.duration) ? v3.duration : 3.31;
        v3.currentTime = Math.max(0.01, duration - 0.04);
        v3.pause();
      }
      setActivePartIndex(2);
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
    videoRef: video1Ref, // Backward compatibility
    video1Ref,
    video2Ref,
    video3Ref,
    activePartIndex,
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
