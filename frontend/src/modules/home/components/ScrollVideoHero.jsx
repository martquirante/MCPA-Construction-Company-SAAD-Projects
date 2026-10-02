"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useScrollScrub } from "../hooks/useScrollScrub";
import HeroContentOverlay from "./HeroContentOverlay";
import BuildProgressBadge from "./BuildProgressBadge";

export default function ScrollVideoHero({ onCompletionChange }) {
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

  // Force media reload when orientation changes between portrait and landscape
  useEffect(() => {
    [video1Ref, video2Ref, video3Ref].forEach((ref) => {
      if (ref?.current) {
        try {
          ref.current.load();
        } catch (_) {}
      }
    });
  }, [isPortrait, video1Ref, video2Ref, video3Ref]);

  // Responsive video selection: high-definition portrait on mobile, cinematic landscape on desktop
  // 3 distinct sequential MP4 files for glitch-free loading on Vercel and mobile devices
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

  // High-Resolution WebP posters corresponding to the exact starting frames of each construction phase
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
      {/* Sticky Viewport Frame (Stays pinned during the 3-scroll build journey, 4th scroll enters homepage) */}
      <div className="sticky top-0 w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden select-none [contain:layout_paint]">
        {/* 1. Interactive Video Canvas / Player Stack */}
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
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
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
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className={`video-ultra-hd absolute inset-0 w-full h-full object-cover z-30 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex >= 2 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* High-Resolution Completed House Photos (Bright Daytime in Light Theme, Twilight/Night in Dark Theme) */}
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
              {/* Light Theme: Sunny Daytime Architectural Residence */}
              <Image
                src="/assets/hero-residence-day-wide-v2.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_35%] dark:hidden"
              />
              {/* Dark Theme: Twilight / Night Luxury Residence */}
              <Image
                src="/assets/hero-residence-wide-v2.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_35%] hidden dark:block"
              />
            </div>

            {/* Mobile / Portrait Screens */}
            <div
              suppressHydrationWarning
              className={`absolute inset-0 ${isPortrait ? "block" : "block sm:hidden"}`}
            >
              {/* Light Theme: Sunny Daytime Architectural Residence */}
              <Image
                src="/assets/hero-residence-day-mobile.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center dark:hidden"
              />
              {/* Dark Theme: Twilight / Night Luxury Residence */}
              <Image
                src="/assets/hero-residence-mobile.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center hidden dark:block"
              />
            </div>
          </div>

          {/* CPL (Circular Polarizer) & ND Cine Optical Filter Stack */}
          {/* Layer 1: Atmospheric CPL Sky Deepening & Haze Cut */}
          <div className="absolute inset-0 z-36 pointer-events-none bg-gradient-to-b from-sky-950/25 via-transparent to-amber-950/20 mix-blend-multiply" />

          {/* Layer 2: Sony S-Cinetone / DJI Golden Hour Optical Warmth */}
          <div className="absolute inset-0 z-37 pointer-events-none bg-gradient-to-tr from-amber-600/[0.08] via-transparent to-sky-500/[0.05] mix-blend-overlay" />

          {/* Layer 3: Cinema ND Lens Peripheral Vignette (Natural optical corner falloff) */}
          <div className="absolute inset-0 z-38 pointer-events-none [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        {/* 3. Hero Content Overlay (Always at z-50 in front of videos and images, reveals when completed) */}
        <HeroContentOverlay key={isCompleted ? "completed" : "building"} isCompleted={isCompleted} />

        {/* 4. Minimalist Progress & Scroll Indicator with exact milestones (0%, 33%, 66%, 100%) */}
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
