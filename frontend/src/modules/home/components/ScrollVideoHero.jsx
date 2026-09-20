"use client";

import { useRef, useEffect } from "react";
import { useScrollScrub } from "../hooks/useScrollScrub";
import { useBlobVideo } from "../hooks/useBlobVideo";
import HeroContentOverlay from "./HeroContentOverlay";
import BuildProgressBadge from "./BuildProgressBadge";

export default function ScrollVideoHero({ onCompletionChange }) {
  const containerRef = useRef(null);

  const {
    videoRef,
    currentStep,
    progress,
    displayedPct,
    isCompleted,
    isPortrait,
    stageName,
    videoLoaded,
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
  const rawVideoSrc = isPortrait
    ? "/videos/portrait-build.mp4"
    : "/videos/landscape-build.mp4";

  // In-memory Blob URL masking: prevents direct static file URL exposure in DevTools / DOM
  const videoSrc = useBlobVideo(rawVideoSrc);

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative w-full h-[400vh] bg-neutral-950 overscroll-y-contain"
    >
      {/* Sticky Viewport Frame (Stays pinned during the 3-scroll build journey, 4th scroll enters homepage) */}
      <div className="sticky top-0 w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden select-none [contain:layout_paint]">
        {/* 1. Interactive Video Canvas / Player */}
        <div
          onClick={() => {
            if (!isCompleted) {
              nextStep();
            }
          }}
          className={`relative w-full h-full bg-neutral-950 ${!isCompleted ? "cursor-pointer" : ""}`}
        >
          <video
            ref={videoRef}
            src={rawVideoSrc}
            poster="/videos/test_frame.webp"
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={handleVideoLoadedMetadata}
            onLoadedData={handleVideoLoadedMetadata}
            onCanPlay={handleVideoLoadedMetadata}
            className="w-full h-full object-cover transition-opacity duration-700 [contain:paint] transform-gpu"
          />

          {/* Cinematic lighting gradient overlays */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950/85 via-black/20 to-neutral-950/40" />
        </div>

        {/* 3. Hero Content Overlay (Reveals only when 100% completed) */}
        <HeroContentOverlay key={isCompleted ? "completed" : "building"} isCompleted={isCompleted} />

        {/* 4. Minimalist Progress & Scroll Indicator with exact milestones (0, 20, 40, 60, 80, 100) */}
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
