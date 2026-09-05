"use client";

import { useRef } from "react";
import { useScrollScrub } from "../hooks/useScrollScrub";
import { useBlobVideo } from "../hooks/useBlobVideo";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import HeroContentOverlay from "./HeroContentOverlay";
import BuildProgressBadge from "./BuildProgressBadge";

export default function ScrollVideoHero() {
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
      className="relative w-full h-[700vh] bg-neutral-950 overscroll-y-contain"
    >
      {/* Sticky Viewport Frame (Stays pinned during the 6-scroll build journey, 7th scroll finishes) */}
      <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden select-none [contain:layout_paint]">
        {/* 1. Client Navbar (Always shows logo; links reveal upon 100% completion) */}
        <ClientNavbar isCompleted={isCompleted} />

        {/* 2. Interactive Video Canvas / Player */}
        <div
          onClick={() => {
            if (currentStep < 6) {
              nextStep();
            }
          }}
          className={`relative w-full h-full bg-neutral-950 ${currentStep < 6 ? "cursor-pointer" : ""}`}
        >
          <video
            ref={videoRef}
            src={videoSrc || undefined}
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

          {/* Minimalist buffering badge - fades away once ready */}
          {!videoLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/70 backdrop-blur-[2px] text-neutral-400 transition-opacity duration-500 z-10 pointer-events-none">
              <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs uppercase tracking-widest font-mono text-neutral-300">
                Loading Construction Engine...
              </p>
            </div>
          )}

          {/* Cinematic lighting gradient overlays */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950/85 via-black/20 to-neutral-950/40" />
        </div>

        {/* 3. Hero Content Overlay (Reveals only when 100% completed) */}
        <HeroContentOverlay isCompleted={isCompleted} />

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
