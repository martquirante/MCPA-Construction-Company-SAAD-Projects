"use client";

import Image from "next/image";
import Button from "../../shared/Button";
import { SparkleBadgeIcon, ChevronDownIcon } from "../../shared/Icons";

export default function HomeHero() {
  const scrollToExplore = () => {
    const el = document.getElementById("overview");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section
      id="top"
      className="relative w-full h-[100dvh] min-h-[640px] max-h-[1080px] bg-neutral-950 overflow-hidden select-none flex items-center justify-center"
    >
      {/* 1. Background Responsive House Images */}
      <div className="absolute inset-0 z-0">
        {/* Landscape for Desktop */}
        <Image
          src="/assets/hero-residence.jpg"
          alt="MCPA Luxury Residence"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center hidden sm:block"
        />
        {/* Portrait for Mobile */}
        <Image
          src="/assets/hero-residence-mobile.jpg"
          alt="MCPA Luxury Residence"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center block sm:hidden"
        />

        {/* Cinematic contrast gradient overlay for crisp typography */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950 via-black/45 to-black/60" />
      </div>

      {/* 2. Hero Content Overlay */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center flex flex-col items-center">
        {/* Special Program Cue - Clean Text-Only Typography (No circular icon/pill) */}
        <p className="text-neutral-300 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-4 select-none drop-shadow-md">
          Build Now, Pay Later Program Available
        </p>

        {/* Client Core Heading Copy */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-2xl select-none">
          Looking to turn your ideas into reality?
        </h1>

        {/* Client Subtitle Copy */}
        <p className="mt-5 text-sm sm:text-base md:text-lg text-neutral-200 font-normal leading-relaxed max-w-xl mx-auto drop-shadow-md">
          Collaborate with us at{" "}
          <span className="font-semibold text-white">
            MCPA Construction and Supply
          </span>{" "}
          and let&apos;s build your enduring legacy.
        </p>

        {/* Single Centered Call-to-Action Button */}
        <div className="mt-8">
          <Button
            href="/book"
            size="lg"
            variant="primary"
            className="px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-xl shadow-black/30 hover:scale-105 transition-all"
          >
            Book an Appointment
          </Button>
        </div>
      </div>

      {/* 3. Bottom Scroll to Explore Indicator */}
      <button
        onClick={scrollToExplore}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-neutral-300 hover:text-white transition-colors cursor-pointer group select-none"
        aria-label="Scroll to explore website content"
      >
        <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-300 group-hover:text-white transition-colors">
          Scroll to Explore
        </span>
        <ChevronDownIcon className="w-4 h-4 text-neutral-400 group-hover:text-white animate-bounce" />
      </button>
    </section>
  );
}
