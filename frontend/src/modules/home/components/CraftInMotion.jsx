"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "../../shared/Icons";
import { useLanguage } from "../../shared/LanguageContext";

const CRAFT_VIDEOS = [
  {
    id: "bungalow-timelapse",
    title: "Modern Tropical Bungalow",
    phase: "Ground-Up Construction Timelapse",
    src: "/videos/craft-motion/timelapse-tropical-bungalow.mp4",
  },
  {
    id: "luxury-2storey-timelapse",
    title: "2-Storey Luxury Residence",
    phase: "Structural Elevation Timelapse",
    src: "/videos/craft-motion/timelapse-2storey-luxury.mp4",
  },
  {
    id: "wide-estate-timelapse",
    title: "Single-Storey Modern Estate",
    phase: "Foundation & Framing Timelapse",
    src: "/videos/craft-motion/timelapse-wide-estate.mp4",
  },
  {
    id: "flickertech-timelapse",
    title: "Flickertech Commercial Facility",
    phase: "Industrial Steel Canopy Build",
    src: "/videos/craft-motion/timelapse-flickertech-commercial.mp4",
  },
  {
    id: "tropical-interior",
    title: "Tropical Open-Concept Living",
    phase: "Interior Architectural Walkthrough",
    src: "/videos/craft-motion/interior-tropical-living.mp4",
  },
  {
    id: "courtyard-interior",
    title: "Courtyard Villa & Grand Suite",
    phase: "Interior Architectural Montage",
    src: "/videos/craft-motion/interior-courtyard-villa.mp4",
  },
];

export default function CraftInMotion() {
  const { language, t } = useLanguage();
  const isFil = language === "fil";
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef([]);
  const sectionRef = useRef(null);

  // Lazy-mount videos only when section enters viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "100px 0px 100px 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Pause all videos when section leaves viewport to save CPU/GPU
  useEffect(() => {
    if (!isInView) {
      videoRefs.current.forEach((vid) => {
        if (vid && !vid.paused) {
          vid.pause();
        }
      });
    }
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;

    // 1. Play the current video
    const currentVid = videoRefs.current[activeIndex];
    if (currentVid) {
      currentVid.currentTime = 0;
      currentVid.play().catch(() => {});
    }

    // 2. Pre-start the next video 1.5s ahead so it is already playing and rendering frames
    const nextIdx = (activeIndex + 1) % CRAFT_VIDEOS.length;
    const preloadTimer = setTimeout(() => {
      const nextVid = videoRefs.current[nextIdx];
      if (nextVid) {
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
      }
    }, 4500); // starts playing at 4.5s

    // 3. Initiate the seamless 1.5s cross-dissolve at 5.5s
    const transitionTimer = setTimeout(() => {
      setPrevIndex(activeIndex);
      setActiveIndex(nextIdx);
    }, 5500);

    // 4. Pause idle videos (not active, not next, not fading out) to save GPU/CPU
    videoRefs.current.forEach((vid, idx) => {
      if (vid && idx !== activeIndex && idx !== nextIdx && idx !== prevIndex) {
        vid.pause();
      }
    });

    return () => {
      clearTimeout(preloadTimer);
      clearTimeout(transitionTimer);
    };
  }, [activeIndex, prevIndex, isInView]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden w-full h-[60vh] min-h-[460px] max-h-[650px] border-y border-neutral-200 dark:border-neutral-800 bg-neutral-950"
    >
      {/* Multi-Layer Video Dissolve Engine — only mounts current, previous, and incoming videos to keep GPU decoders minimal */}
      {isInView && CRAFT_VIDEOS.map((video, idx) => {
        const isActive = idx === activeIndex;
        const isPrev = idx === prevIndex;
        const isNext = idx === (activeIndex + 1) % CRAFT_VIDEOS.length;
        // Keep at most 2-3 videos in DOM at any time instead of all 6
        if (!isActive && !isPrev && !isNext) return null;

        return (
          <video
            key={video.id}
            ref={(el) => (videoRefs.current[idx] = el)}
            src={video.src}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-[1500ms] ease-in-out md:contrast-[1.06] md:saturate-[1.12] md:brightness-[1.03] ${
              isActive
                ? "opacity-100 z-[2]"
                : isPrev
                ? "opacity-0 z-[1]"
                : "opacity-0 z-0"
            }`}
          />
        );
      })}

      {/* Poster fallback shown while videos haven't loaded yet */}
      {!isInView && (
        <div className="absolute inset-0 bg-neutral-950" />
      )}

      {/* Cinematic Precision Gradient Overlay - Protects left text while letting the 4K video shine on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/45 to-neutral-950/15 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-transparent to-neutral-950/60 pointer-events-none z-10" />

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-3xl text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
            <span className="block">
              {isFil ? "Itinayo ng mga Kamay." : "Built by hands."}
            </span>
            <span className="block mt-1 sm:mt-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              {isFil ? "Pinasakdal ng Proseso." : "Perfected by process."}
            </span>
          </h2>

          <p className="mt-4 text-neutral-300 text-sm sm:text-base md:text-lg leading-relaxed font-light max-w-xl">
            {isFil
              ? "Bawat proyekto ay pinamamahalaan ng mga lisensyadong eksperto sa mismong gawaan at may tapat na lingguhang ulat."
              : "Every project is managed with dedicated on-site principals and transparent weekly reporting."}
          </p>

          <div className="mt-7 sm:mt-8">
            <Link
              href="/process"
              className="inline-flex items-center gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] group"
            >
              <span>{isFil ? "Tuklasin ang Proseso" : "Explore The Process"}</span>
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
