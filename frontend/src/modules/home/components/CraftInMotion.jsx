"use client";

import Link from "next/link";
import { ArrowRightIcon } from "../../shared/Icons";

export default function CraftInMotion() {
  return (
    <section className="relative overflow-hidden w-full h-[60vh] min-h-[420px] max-h-[650px] border-y border-neutral-200 dark:border-neutral-800">
      {/* Ambient Looping Video Background */}
      <video
        src="/videos/landscape-build.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Cinematic Dark Gradient Tint Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-neutral-950/85 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-[0.25em] uppercase mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Our Craft in Motion</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
            Built by hands.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              Perfected by process.
            </span>
          </h2>

          <p className="mt-4 text-neutral-300 text-base md:text-lg leading-relaxed font-light max-w-lg">
            Every project is managed with dedicated on-site principals and transparent weekly reporting.
          </p>

          <div className="mt-8">
            <Link
              href="#process"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] group"
            >
              <span>Explore The Process</span>
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
