"use client";

import Button from "../../shared/Button";
import { useLanguage } from "../../shared/LanguageContext";

export default function HeroContentOverlay({ isCompleted }) {
  const { t } = useLanguage();

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center transition-all duration-700 ease-out select-none ${
        isCompleted
          ? "opacity-100 transform translate-y-0 pointer-events-auto"
          : "opacity-0 transform translate-y-6 pointer-events-none"
      }`}
    >
      {/* Cinematic contrast gradient layer: luminous & bright in light theme, deep & moody in dark theme */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-black/15 to-transparent dark:from-black/85 dark:via-black/40 dark:to-transparent transition-colors duration-500" />

      <div className="relative z-10 max-w-3xl lg:max-w-4xl mx-auto flex flex-col items-center">
        {/* Client Core Heading Copy */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.2] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] select-none">
          {t("heroHeading")}
        </h2>

        {/* Client Subtitle Copy */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-neutral-100 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          {t("heroSubPre")}
          <span className="font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {t("heroSubBold")}
          </span>
          {t("heroSubPost")}
        </p>

        {/* Single Centered Call-to-Action Button */}
        <div className="mt-8">
          <Button
            href="/book"
            size="lg"
            variant="primary"
            className="px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-xl shadow-amber-500/25 bg-amber-500 hover:bg-amber-400 text-neutral-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {t("bookAppointment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
