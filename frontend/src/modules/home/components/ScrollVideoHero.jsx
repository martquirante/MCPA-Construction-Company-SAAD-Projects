"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useScrollScrub } from "../hooks/useScrollScrub";
import { useScrollScrubFrames } from "../hooks/useScrollScrubFrames";
import HeroContentOverlay from "./HeroContentOverlay";
import BuildProgressBadge from "./BuildProgressBadge";

// Reusable Optical Lens Vignette & Atmospheric Grading
function OpticalFilterStack() {
  return (
    <>
      {/* Layer 1: Atmospheric CPL Sky Deepening & Haze Cut */}
      <div className="absolute inset-0 z-36 pointer-events-none bg-gradient-to-b from-sky-950/25 via-transparent to-amber-950/20 mix-blend-multiply" />
      {/* Layer 2: Sony S-Cinetone / DJI Golden Hour Optical Warmth */}
      <div className="absolute inset-0 z-37 pointer-events-none bg-gradient-to-tr from-amber-600/[0.08] via-transparent to-sky-500/[0.05] mix-blend-overlay" />
      {/* Layer 3: Cinema ND Lens Peripheral Vignette */}
      <div className="absolute inset-0 z-38 pointer-events-none [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
    </>
  );
}

// Completed Residence Photo Layer (Light / Dark mode + Responsive)
function CompletedHouseLayer({ isCompleted, isPortrait }) {
  return (
    <div
      suppressHydrationWarning
      className={`absolute inset-0 z-35 transition-opacity duration-700 pointer-events-none ${
        isCompleted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Desktop / Landscape Screens */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 ${isPortrait ? "hidden" : "hidden sm:block"}`}
      >
        <Image
          src="/assets/hero-residence-day-wide-v2.jpg"
          alt="MCPA Luxury Residence"
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-[center_35%] dark:hidden"
        />
        <Image
          src="/assets/hero-residence-wide-v2.jpg"
          alt="MCPA Luxury Residence"
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-[center_35%] hidden dark:block"
        />
      </div>

      {/* Mobile / Portrait Screens */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 ${isPortrait ? "block" : "block sm:hidden"}`}
      >
        <Image
          src="/assets/hero-residence-day-mobile.jpg"
          alt="MCPA Luxury Residence"
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-center dark:hidden"
        />
        <Image
          src="/assets/hero-residence-mobile.jpg"
          alt="MCPA Luxury Residence"
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-center hidden dark:block"
        />
      </div>
    </div>
  );
}

// =========================================================================
// ENGINE 1: Hardware-Accelerated 2D Canvas Frame Sequence Engine
// Optimized for low-end mobile devices, slow data, or low RAM (Zero video decoders)
// =========================================================================
function FrameScrollEngine({ onCompletionChange }) {
  const containerRef = useRef(null);

  const {
    canvasRef,
    progress,
    displayedPct,
    isCompleted,
    isPortrait,
    stageName,
    nextStep,
    replayBuild,
  } = useScrollScrubFrames(containerRef);

  useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(isCompleted);
    }
  }, [isCompleted, onCompletionChange]);

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative w-full h-[400vh] bg-neutral-950 overscroll-y-contain"
    >
      <div className="sticky top-0 w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden select-none [contain:layout_paint]">
        <div
          suppressHydrationWarning
          onClick={() => {
            if (!isCompleted) {
              nextStep();
            }
          }}
          className={`relative w-full h-full bg-neutral-950 ${!isCompleted ? "cursor-pointer" : ""}`}
        >
          {/* Smooth 60fps 2D Canvas — uses WebP frame sequences with minimal GPU/RAM overhead */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
          />

          <CompletedHouseLayer isCompleted={isCompleted} isPortrait={isPortrait} />
          <OpticalFilterStack />
        </div>

        <HeroContentOverlay key={isCompleted ? "completed" : "building"} isCompleted={isCompleted} />

        <BuildProgressBadge
          progress={progress}
          displayedPct={displayedPct}
          stageName={stageName}
          isCompleted={isCompleted}
          onReplay={replayBuild}
          onAdvance={nextStep}
        />
      </div>
    </section>
  );
}

// =========================================================================
// ENGINE 2: Cinematic MP4 Video Scrubbing Engine
// Used on desktop / capable devices with compressed MP4 video streaming
// =========================================================================
function VideoScrollEngine({ onCompletionChange, onFallbackToFrames }) {
  const containerRef = useRef(null);

  const {
    video1Ref,
    video2Ref,
    video3Ref,
    activePartIndex,
    progress,
    displayedPct,
    isCompleted,
    isPortrait,
    stageName,
    handleVideoLoadedMetadata,
    nextStep,
    replayBuild,
  } = useScrollScrub(containerRef);

  useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(isCompleted);
    }
  }, [isCompleted, onCompletionChange]);

  // Force media reload when orientation changes
  useEffect(() => {
    [video1Ref, video2Ref, video3Ref].forEach((ref) => {
      if (ref?.current) {
        try {
          ref.current.load();
        } catch (_) {}
      }
    });
  }, [isPortrait, video1Ref, video2Ref, video3Ref]);

  const videoParts = isPortrait
    ? [
        "/videos/portrait-build-part1.mp4",
        "/videos/portrait-build-part2.mp4",
        "/videos/portrait-build-part3.mp4",
      ]
    : [
        "/videos/landscape-build-part1.mp4",
        "/videos/landscape-build-part2.mp4",
        "/videos/landscape-build-part3.mp4",
      ];

  const posterParts = isPortrait
    ? [
        "/assets/poster-portrait-part1.webp",
        "/assets/poster-portrait-part2.webp",
        "/assets/poster-portrait-part3.webp",
      ]
    : [
        "/assets/poster-landscape-part1.webp",
        "/assets/poster-landscape-part2.webp",
        "/assets/poster-landscape-part3.webp",
      ];

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative w-full h-[400vh] bg-neutral-950 overscroll-y-contain"
    >
      <div className="sticky top-0 w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden select-none [contain:layout_paint]">
        <div
          suppressHydrationWarning
          key={isPortrait ? "portrait-player-stack" : "landscape-player-stack"}
          onClick={() => {
            if (!isCompleted) {
              nextStep();
            }
          }}
          className={`relative w-full h-full bg-neutral-950 ${!isCompleted ? "cursor-pointer" : ""}`}
        >
          {/* Part 1 (0% to 33%): Ground Zero & Site Layout -> Excavation & Structural Foundation */}
          <video
            suppressHydrationWarning
            key={isPortrait ? "portrait-v1" : "landscape-v1"}
            ref={video1Ref}
            src={videoParts[0]}
            poster={posterParts[0]}
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={handleVideoLoadedMetadata}
            onLoadedData={handleVideoLoadedMetadata}
            onCanPlay={handleVideoLoadedMetadata}
            onError={onFallbackToFrames}
            className={`video-ultra-hd absolute inset-0 w-full h-full object-cover z-10 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex > 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          {/* Part 2 (33% to 66%): Excavation -> Framing & Architectural Enclosure */}
          <video
            suppressHydrationWarning
            key={isPortrait ? "portrait-v2" : "landscape-v2"}
            ref={video2Ref}
            src={videoParts[1]}
            poster={posterParts[1]}
            playsInline
            muted
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            onError={onFallbackToFrames}
            className={`video-ultra-hd absolute inset-0 w-full h-full object-cover z-20 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex >= 1 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Part 3 (66% to 100%): Framing -> Modern Residence 100% Completed */}
          <video
            suppressHydrationWarning
            key={isPortrait ? "portrait-v3" : "landscape-v3"}
            ref={video3Ref}
            src={videoParts[2]}
            poster={posterParts[2]}
            playsInline
            muted
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            onError={onFallbackToFrames}
            className={`video-ultra-hd absolute inset-0 w-full h-full object-cover z-30 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex >= 2 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          <CompletedHouseLayer isCompleted={isCompleted} isPortrait={isPortrait} />
          <OpticalFilterStack />
        </div>

        <HeroContentOverlay key={isCompleted ? "completed" : "building"} isCompleted={isCompleted} />

        <BuildProgressBadge
          progress={progress}
          displayedPct={displayedPct}
          stageName={stageName}
          isCompleted={isCompleted}
          onReplay={replayBuild}
          onAdvance={nextStep}
        />
      </div>
    </section>
  );
}

// =========================================================================
// MAIN EXPORT: Adaptive Hero Controller
// Automatically selects Frame Sequence Engine on mobile / low-end / slow networks
// and Video Engine on capable desktop setups, with instant graceful fallback
// =========================================================================
export default function ScrollVideoHero({ onCompletionChange }) {
  const [engineMode, setEngineMode] = useState("video");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = navigator;
      const isSaveData = nav?.connection?.saveData === true;
      const isSlowConn = nav?.connection?.effectiveType === "2g" || nav?.connection?.effectiveType === "3g";
      const cores = nav?.hardwareConcurrency || 8;
      const memory = nav?.deviceMemory || 8;
      // Low-end / network-constrained detection (Data Saver, 2G/3G, or <=4 cores and <=4GB RAM)
      const isConstrainedDevice = isSaveData || isSlowConn || (cores <= 4 && memory <= 4);

      const savedPref = localStorage.getItem("mcpa_engine_pref");
      if (savedPref === "frames") {
        setEngineMode("frames");
      } else if (savedPref === "video") {
        setEngineMode("video");
      } else if (isConstrainedDevice) {
        // High-performance canvas WebP frames on constrained devices
        setEngineMode("frames");
      } else {
        // High-definition 60fps video on capable desktop and mobile phones
        setEngineMode("video");
      }
    }
  }, []);

  if (engineMode === "frames") {
    return <FrameScrollEngine onCompletionChange={onCompletionChange} />;
  }

  return (
    <VideoScrollEngine
      onCompletionChange={onCompletionChange}
      onFallbackToFrames={() => setEngineMode("frames")}
    />
  );
}
