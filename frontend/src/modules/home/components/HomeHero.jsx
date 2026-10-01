"use client";

import Image from "next/image";
import Button from "../../shared/Button";
import { ArrowDownIcon } from "../../shared/Icons";
import { useLanguage } from "../../shared/LanguageContext";

export default function HomeHero() {
  const { t } = useLanguage();

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
      {/* 1. Background Responsive House Images (Bright Daytime in Light Theme, Twilight in Dark Theme) */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Screens */}
        <div className="absolute inset-0 hidden sm:block">
          {/* Light Theme: Sunny Daytime Architectural Residence */}
          <Image
            src="/assets/hero-residence-day-wide-v2.jpg"
            alt="MCPA Luxury Modern Residence"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] dark:hidden"
          />
          {/* Dark Theme: Twilight / Night Luxury Residence */}
          <Image
            src="/assets/hero-residence-wide-v2.jpg"
            alt="MCPA Luxury Modern Residence"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] hidden dark:block"
          />
        </div>

        {/* Mobile Screens */}
        <div className="absolute inset-0 block sm:hidden">
          {/* Light Theme: Sunny Daytime Architectural Residence */}
          <Image
            src="/assets/hero-residence-day-mobile.jpg"
            alt="MCPA Luxury Modern Residence"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center dark:hidden"
          />
          {/* Dark Theme: Twilight / Night Luxury Residence */}
          <Image
            src="/assets/hero-residence-mobile.jpg"
            alt="MCPA Luxury Modern Residence"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center hidden dark:block"
          />
        </div>

        {/* Cinematic contrast gradient overlay: subtle in light mode, deep in dark mode */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-black/10 to-black/25 dark:from-black/75 dark:via-black/35 dark:to-black/50 transition-colors duration-500" />
      </div>

      {/* 2. Hero Content Overlay */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center flex flex-col items-center">
        {/* Client Core Heading Copy */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.2] drop-shadow-md select-none">
          {t("heroHeading")}
        </h1>

        {/* Client Subtitle Copy */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-neutral-200 font-normal leading-relaxed max-w-2xl mx-auto drop-shadow-md">
          {t("heroSubPre")}
          <span className="font-semibold text-white">
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
          >
            {t("bookAppointment")}
          </Button>
        </div>
      </div>

      {/* 3. Bottom Scroll to Explore Indicator */}
      <div className="absolute bottom-8 sm:bottom-6 inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none pb-[env(safe-area-inset-bottom,0px)]">
        <button
          onClick={scrollToExplore}
          aria-label="Scroll to explore website content"
          className="pointer-events-auto inline-flex flex-col items-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] select-none text-center">
            {t("scrollExplore")}
          </span>
          <ArrowDownIcon className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]" />
        </button>
      </div>
    </section>
  );
}
