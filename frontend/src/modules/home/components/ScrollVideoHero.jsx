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
          onClick={() => {
            if (!isCompleted) {
              nextStep();
            }
          }}
          className={`relative w-full h-full bg-neutral-950 ${!isCompleted ? "cursor-pointer" : ""}`}
        >
          {/* Part 1 (0% to 33%): Ground Zero & Site Layout -> Excavation & Structural Foundation */}
          <video
            ref={video1Ref}
            src={videoParts[0]}
            poster="/assets/hero-residence.jpg"
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={handleVideoLoadedMetadata}
            onLoadedData={handleVideoLoadedMetadata}
            onCanPlay={handleVideoLoadedMetadata}
            className="absolute inset-0 w-full h-full object-cover z-10 [contain:paint] transform-gpu"
          />

          {/* Part 2 (33% to 66%): Excavation -> Framing & Architectural Enclosure */}
          <video
            ref={video2Ref}
            src={videoParts[1]}
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className={`absolute inset-0 w-full h-full object-cover z-20 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex >= 1 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Part 3 (66% to 100%): Framing -> Modern Residence 100% Completed */}
          <video
            ref={video3Ref}
            src={videoParts[2]}
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className={`absolute inset-0 w-full h-full object-cover z-30 [contain:paint] transform-gpu transition-opacity duration-300 ${
              activePartIndex >= 2 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* High-Resolution Completed House Photos (Bright Daytime in Light Theme, Twilight/Night in Dark Theme) */}
          <div
            className={`absolute inset-0 z-35 transition-opacity duration-700 pointer-events-none ${
              isCompleted ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Desktop Screens */}
            <div className="absolute inset-0 hidden sm:block">
              {/* Light Theme: Sunny Daytime Architectural Residence */}
              <Image
                src="/assets/hero-residence-day.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center dark:hidden"
              />
              {/* Dark Theme: Twilight / Night Luxury Residence */}
              <Image
                src="/assets/hero-residence.jpg"
                alt="MCPA Luxury Residence"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center hidden dark:block"
              />
            </div>

            {/* Mobile Screens */}
            <div className="absolute inset-0 block sm:hidden">
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

          {/* Cinematic lighting gradient overlays: luminous & airy in light theme, rich & moody in dark theme */}
          <div className="absolute inset-0 z-38 pointer-events-none bg-gradient-to-t from-black/35 via-transparent to-transparent dark:from-neutral-950/80 dark:via-black/25 dark:to-transparent transition-colors duration-500" />
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
