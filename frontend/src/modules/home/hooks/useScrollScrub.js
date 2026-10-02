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
  const [currentStep, setCurrentStep] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayedPct, setDisplayedPct] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCompletedBuild, setHasCompletedBuild] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stageName, setStageName] = useState(STAGE_LABELS[0]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [isLowEnd, setIsLowEnd] = useState(false);

  // Dedicated refs for each of the 3 split MP4 files
  const video1Ref = useRef(null); // Part 1: Step 0 -> 1 (0% to 33%)
  const video2Ref = useRef(null); // Part 2: Step 1 -> 2 (33% to 66%)
  const video3Ref = useRef(null); // Part 3: Step 2 -> 3 (66% to 100%)

  const currentStepRef = useRef(0);
  const activePartIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const cooldownRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const videoFinishedRef = useRef(false);

  const targetStepRef = useRef(0);
  const playRafRef = useRef(null);
  const watchdogRef = useRef(null);
  const stallTimerRef = useRef(null);
  const lastSeekTimeRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isLowEndRef = useRef(false);
  const lastDisplayedPctRef = useRef(0);

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
        const portrait =
          window.innerHeight > window.innerWidth ||
          (window.matchMedia && window.matchMedia("(orientation: portrait)").matches);
        setIsPortrait((prev) => (prev !== portrait ? portrait : prev));
      }
    };

    requestAnimationFrame(checkOrientation);
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    let mql = null;
    if (typeof window !== "undefined" && window.matchMedia) {
      mql = window.matchMedia("(orientation: portrait)");
      if (mql?.addEventListener) {
        mql.addEventListener("change", checkOrientation);
      }
    }

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      if (mql?.removeEventListener) {
        mql.removeEventListener("change", checkOrientation);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, []);

  // Detect low-end hardware (<= 4 cores, <= 4GB RAM, or mobile)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = window.navigator;
      const cores = nav?.hardwareConcurrency || 4;
      const memory = nav?.deviceMemory || 4;
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(nav?.userAgent || "");
      const lowEnd = cores <= 4 || memory <= 4 || isMobile;
      isLowEndRef.current = lowEnd;
      setIsLowEnd(lowEnd);
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
  const scrubBackward = useCallback((video, startTime, targetTime, startProg, targetProg, startPct, targetPct, onDone, customDurationMs) => {
    if (!video) {
      if (onDone) onDone();
      return;
    }

    const startMs = performance.now();
    const durationMs = customDurationMs || 420;

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
  const goToStep = useCallback(function advanceStep(targetStep, immediate = false) {
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

    // At the start of any step transition, the build is not yet completed.
    // Completed state is ONLY unlocked when Part 3 finishes playing to the end in finishAnimation()
    // or if immediate is true (handled in the immediate block below).
    setIsCompleted(false);
    setHasCompletedBuild(false);
    hasCompletedRef.current = false;
    videoFinishedRef.current = false;

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

      // Reset start time if video had already reached end or was scrubbed forward
      if (activeVideo.currentTime > 0.05 && activeVideo.currentTime >= (activeVideo.duration || 3.3) - 0.1) {
        try {
          activeVideo.currentTime = 0.01;
        } catch (e) {}
      }

      const duration = activeVideo.duration && isFinite(activeVideo.duration) && activeVideo.duration > 0
        ? activeVideo.duration
        : 3.32;
      const targetTime = Math.max(0.01, duration - 0.02);
      // Play at crisp cinematic 1.25x speed (~2.5s per part, ~7.5s full build sequence)
      const playbackSpeed = 1.25;
      activeVideo.playbackRate = playbackSpeed;

      const handleBufferStall = () => {
        if (!stallTimerRef.current) {
          stallTimerRef.current = setTimeout(finishAnimation, 3500);
        }
      };
      const handlePlaying = () => {
        if (stallTimerRef.current) {
          clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
      };

      const finishAnimation = () => {
        if (stallTimerRef.current) {
          clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }
        if (playRafRef.current) {
          cancelAnimationFrame(playRafRef.current);
          playRafRef.current = null;
        }
        if (activeVideo) {
          activeVideo.removeEventListener("waiting", handleBufferStall);
          activeVideo.removeEventListener("stalled", handleBufferStall);
          activeVideo.removeEventListener("playing", handlePlaying);
          activeVideo.removeEventListener("error", handleBufferStall);
          activeVideo.pause();
          try {
            activeVideo.currentTime = targetTime;
          } catch (e) {}
        }
        lastDisplayedPctRef.current = endPct;
        setDisplayedPct(endPct);
        setProgress(endProg);

        if (clampedStep === 3) {
          setIsCompleted(true);
          setHasCompletedBuild(true);
          hasCompletedRef.current = true;
          videoFinishedRef.current = true;
          setReturnToCompletedHome(true);

          // Release video decoders for Parts 1 & 2 after build is complete.
          // The completed-house image takes over visually — no need to hold 3 video
          // decoders in GPU memory (~100-150 MB). Part 3 stays to show the final frame.
          setTimeout(() => {
            const v1 = video1Ref.current;
            const v2 = video2Ref.current;
            if (v1) { v1.pause(); v1.removeAttribute("src"); v1.load(); }
            if (v2) { v2.pause(); v2.removeAttribute("src"); v2.load(); }
          }, 1500);

          // Lock scroll for 600ms after build completion to absorb residual momentum
          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
          }, 600);

          isAnimatingRef.current = false;
        } else {
          // Finished this chunk! Rest cleanly at this milestone and wait for the user's next scroll.
          // Pre-switch activePartIndex to next part so its initial frame is seamlessly ready with 0ms buffering.
          setActivePartIndex(clampedStep);
          isAnimatingRef.current = false;
          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
          }, 350);
        }
      };

      activeVideo.addEventListener("waiting", handleBufferStall);
      activeVideo.addEventListener("stalled", handleBufferStall);
      activeVideo.addEventListener("playing", handlePlaying);
      activeVideo.addEventListener("error", finishAnimation, { once: true });

      const playPromise = activeVideo.play();
      const travelDistance = Math.max(0.1, targetTime - (activeVideo.currentTime || 0));
      const watchdogMs = Math.ceil((travelDistance / playbackSpeed) * 1000) + 1500;
      watchdogRef.current = setTimeout(finishAnimation, watchdogMs);

      // Preload next part video and reset time to 0.01s so it begins instantly
      if (clampedStep === 1 && video2Ref.current) {
        try {
          video2Ref.current.currentTime = 0.01;
          video2Ref.current.load();
        } catch (_) {}
      } else if (clampedStep === 2 && video3Ref.current) {
        try {
          video3Ref.current.currentTime = 0.01;
          video3Ref.current.load();
        } catch (_) {}
      }

      const monitorStateUpdateInterval = isLowEndRef.current ? 100 : 60;
      let lastStateUpdateTime = 0;

      const monitorForward = () => {
        const nowTime = activeVideo.currentTime;
        const normTime = Math.min(1, Math.max(0, nowTime / duration));
        const currentProg = startProg + normTime * (endProg - startProg);
        const currentPct = Math.min(endPct, Math.round(startPct + normTime * (endPct - startPct)));

        // Throttle React state updates — only update every N ms to reduce re-renders
        const nowMs = performance.now();
        if (nowMs - lastStateUpdateTime >= monitorStateUpdateInterval) {
          lastStateUpdateTime = nowMs;
          if (currentPct !== lastDisplayedPctRef.current) {
            lastDisplayedPctRef.current = currentPct;
            setDisplayedPct(currentPct);
            setProgress(currentProg);
          }
        }

        if (nowTime >= targetTime - 0.02 || activeVideo.ended) {
          finishAnimation();
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
            // Autoplay blocked fallback or low power mode: smooth scrub forward
            scrubBackward(
              activeVideo,
              activeVideo.currentTime || 0.01,
              targetTime,
              startProg,
              endProg,
              startPct,
              endPct,
              () => {
                finishAnimation();
              },
              2000
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

  // Instant skip / fast-forward to 100% completed residence
  const skipBuild = useCallback(() => {
    if (hasCompletedRef.current) return;

    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }

    [video1Ref, video2Ref, video3Ref].forEach((ref) => {
      if (ref?.current) {
        try {
          ref.current.pause();
        } catch (_) {}
      }
    });

    const v3 = video3Ref.current;
    if (v3) {
      try {
        const dur = v3.duration && isFinite(v3.duration) ? v3.duration : 3.31;
        v3.currentTime = Math.max(0.01, dur - 0.04);
      } catch (_) {}
    }

    setActivePartIndex(2);
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
    videoFinishedRef.current = true;
    setReturnToCompletedHome(true);
    isAnimatingRef.current = false;

    if (typeof window !== "undefined") {
      isProgrammaticScrollRef.current = true;
      const vh = window.innerHeight;
      window.scrollTo({ top: 3 * vh, behavior: "instant" });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }

    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 500);
  }, []);

  // Advance build by 1 chunk, or 4th scroll navigates to homepage #overview
  const nextStep = useCallback(() => {
    // If video is currently animating or cooldown is active, ignore incoming scroll
    if (isAnimatingRef.current || cooldownRef.current) {
      return;
    }

    const curr = currentStepRef.current;

    // Advance 1 chunk per scroll:
    // Step 0 -> Step 1 (Chunk 1: 0% to 33%)
    // Step 1 -> Step 2 (Chunk 2: 33% to 66%)
    // Step 2 -> Step 3 (Chunk 3: 66% to 100%)
    if (curr < 3) {
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 400);
      goToStep(curr + 1);
    } else {
      // Step 3 (Completed Residence): 4th scroll transitions to homepage #overview!
      if (!hasCompletedRef.current) {
        return;
      }

      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 800);

      const overviewEl = document.getElementById("overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        const vh = window.innerHeight;
        window.scrollTo({ top: 4 * vh, behavior: "smooth" });
      }
    }
  }, [goToStep]);

  // Step back to previous milestone (locked: build progress is strictly forward-only until 100% completion)
  const prevStep = useCallback(() => {
    return;
  }, []);

  // Interactive gestures: Desktop Wheel, Mobile Touch Swipe, and Keyboard
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Desktop Mouse Wheel handler
    const handleWheel = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const isInHero = scrollY <= 3.15 * vh;

      // When the user is within the Hero section (Steps 0, 1, 2, or 3):
      if (isInHero) {
        // Prevent default on ALL wheel events within the hero so native page scroll CANNOT leak
        e.preventDefault();

        // CASE 1: Build is completed (Step 3 reached AND house is 100% completed)
        if (hasCompletedRef.current && currentStepRef.current >= 3) {
          if (e.deltaY > 0) {
            // Scrolling DOWN towards homepage #overview (4th scroll)
            if (!cooldownRef.current && !isAnimatingRef.current) {
              if (Math.abs(e.deltaY) > 15) {
                nextStep();
              }
            }
          } else {
            // Scrolling UP: Locked! Prevent scroll up into unbuilt stages
            if (scrollY < 3 * vh) {
              window.scrollTo({ top: 3 * vh, behavior: "instant" });
            }
          }
          return;
        }

        // CASE 2: During initial build sequence (Steps 0..2 or Step 3 still playing)
        // Upward scroll is completely locked so progress is strictly forward-only
        if (e.deltaY > 0) {
          // Scrolling DOWN: Advance 1 chunk if not currently animating and not in cooldown
          if (!isAnimatingRef.current && !cooldownRef.current) {
            if (Math.abs(e.deltaY) > 15) {
              nextStep();
            }
          }
        } else {
          // Locked: Upward scroll prevented, progress must finish forward
        }
        return;
      }

      // CASE 3: User is in the Homepage (#overview or below, scrollY > 3.15 * vh)
      // If user scrolls UP from homepage back to the top of the hero:
      if (e.deltaY < 0 && scrollY <= 3.25 * vh) {
        // Stop cleanly at 3 * vh (the completed residence screen)
        e.preventDefault();
        window.scrollTo({ top: 3 * vh, behavior: "smooth" });
        return;
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
      const isInHero = scrollY <= 3.15 * vh;

      // Inside hero section before 4th scroll transitions to overview, prevent runaway native scroll
      if (isInHero) {
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
      const isInHero = scrollY <= 3.15 * vh;

      if (e.changedTouches.length === 1 && isInHero) {
        const endY = e.changedTouches[0].clientY;
        const deltaY = touchStartYRef.current - endY;

        // Minimum swipe threshold of 28px
        if (Math.abs(deltaY) > 28) {
          if (deltaY > 0) {
            // Swiped UP = advance to next chunk
            if (!isAnimatingRef.current && !cooldownRef.current) {
              nextStep();
            }
          } else {
            // Swiped DOWN (attempting scroll up) - locked during build sequence
          }
        }
      }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const isInHero = scrollY <= 3.15 * vh;

      if (isInHero) {
        if (!hasCompletedRef.current) {
          if (["ArrowDown", "PageDown", " "].includes(e.key)) {
            e.preventDefault();
            if (!isAnimatingRef.current && !cooldownRef.current) {
              nextStep();
            }
          } else if (["ArrowUp", "PageUp"].includes(e.key)) {
            e.preventDefault();
          }
        } else {
          // Build is completed:
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
  }, [containerRef, nextStep, prevStep, goToStep, skipBuild]);

  // Window scroll sync for manual scrollbar navigation
  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      if (isAnimatingRef.current || isProgrammaticScrollRef.current) return;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // When build is completed: prevent scrolling up above 3 * vh into unbuilt video stages
      if (hasCompletedRef.current) {
        if (!isProgrammaticScrollRef.current && scrollY < 3 * vh - 8) {
          window.scrollTo({ top: 3 * vh, behavior: "instant" });
        }
        return;
      }

      // During initial build: If scroll position drifted past 3.05 * vh before build is completed, pin back to current step
      if (!hasCompletedRef.current && scrollY > 3.05 * vh) {
        window.scrollTo({ top: currentStepRef.current * vh, behavior: "instant" });
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
    if (hasCompletedRef.current) {
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
  }, []);

  // Initial video setup on mount
  useEffect(() => {
    const v1 = video1Ref.current;
    const v3 = video3Ref.current;

    const handleReady = () => {
      setVideoLoaded(true);
      if (hasCompletedRef.current) {
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
  }, [isPortrait]);

  // When returning to home page from other routes, immediately position at Step 3 final frame
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
        videoFinishedRef.current = true;
        targetStepRef.current = 3;
        lastDisplayedPctRef.current = 100;

        isProgrammaticScrollRef.current = true;
        const vh = window.innerHeight;
        window.scrollTo({ top: 3 * vh, behavior: "instant" });
        const v3 = video3Ref.current;
        if (v3) {
          const duration = v3.duration && isFinite(v3.duration) ? v3.duration : 3.31;
          v3.currentTime = Math.max(0.01, duration - 0.04);
          v3.pause();
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 300);
      });
    }
  }, []);

  // Listen for navigation event to jump directly to completed residence screen
  useEffect(() => {
    const handleGotoCompleted = () => {
      goToStep(3, true);
      setReturnToCompletedHome(true);
      if (typeof window !== "undefined") {
        const vh = window.innerHeight;
        window.scrollTo({ top: 3 * vh, behavior: "smooth" });
      }
    };

    window.addEventListener("mcpa:goto-completed", handleGotoCompleted);
    return () => {
      window.removeEventListener("mcpa:goto-completed", handleGotoCompleted);
    };
  }, [goToStep]);

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
    skipBuild,
    replayBuild,
    isLowEnd,
  };
}
