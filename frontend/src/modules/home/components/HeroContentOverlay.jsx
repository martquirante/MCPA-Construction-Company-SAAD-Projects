"use client";

import Button from "../../shared/Button";
import { SparkleBadgeIcon } from "../../shared/Icons";

export default function HeroContentOverlay({ isCompleted }) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center transition-all duration-700 ease-out ${
        isCompleted
          ? "opacity-100 transform translate-y-0 pointer-events-auto"
          : "opacity-0 transform translate-y-6 pointer-events-none"
      }`}
    >
      {/* Cinematic contrast gradient layer for crisp typography */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {/* Special Program Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-amber-400 text-xs sm:text-sm font-medium tracking-wide uppercase mb-6">
          <SparkleBadgeIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Build Now, Pay Later Program Available</span>
        </div>

        {/* Client Core Heading Copy */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-lg select-none">
          Looking to turn your ideas into reality?
        </h2>

        {/* Client Subtitle Copy */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl mx-auto drop-shadow-sm">
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
            className="px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35"
          >
            Book an Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
