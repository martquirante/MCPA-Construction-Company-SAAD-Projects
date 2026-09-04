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
        {/* Special Program Banner: WE HAVE BUILD NOW, PAY LATER PROGRAM */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <SparkleBadgeIcon className="w-4 h-4 text-amber-400" />
          <span>WE HAVE BUILD NOW, PAY LATER PROGRAM</span>
        </div>

        {/* Client Core Heading Copy */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl select-none">
          Looking to turn your ideas into reality?
        </h2>

        {/* Client Subtitle Copy */}
        <p className="mt-3 text-sm sm:text-base md:text-lg text-neutral-200 font-light leading-relaxed max-w-xl mx-auto drop-shadow-md">
          Collaborate with us at{" "}
          <span className="font-semibold text-amber-400">
            MCPA Construction and Supply
          </span>{" "}
          and let&apos;s build your dream home!
        </p>

        {/* Single Centered Call-to-Action Button */}
        <div className="mt-7">
          <Button
            href="/book"
            size="lg"
            variant="primary"
            className="px-9 py-4 text-sm sm:text-base font-bold shadow-[0_4px_30px_rgba(245,158,11,0.5)] hover:shadow-[0_6px_40px_rgba(245,158,11,0.75)]"
          >
            Book an Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
