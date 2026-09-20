"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PillarCard from "./PillarCard";
import StatsSection from "./StatsSection";
import PortfolioSection from "./PortfolioSection";
import CraftInMotion from "./CraftInMotion";
import ServicesSection from "./ServicesSection";
import ProcessSection from "./ProcessSection";
import Footer from "@/modules/shared/Footer";
import ScrollMorph from "../../shared/ScrollMorph";
import { useLanguage } from "../../shared/LanguageContext";
import {
  BuildingIcon,
  ShieldCheckIcon,
  HardHatIcon,
  ArrowRightIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  MapPinIcon,
  DraftingCompassIcon,
  MilestoneIcon,
  BadgePercentIcon,
} from "../../shared/Icons";

export default function QuickOverview() {
  const { t } = useLanguage();
  const pillarsRef = useRef(null);
  const [pillarsVisible, setPillarsVisible] = useState(false);
  const [inquiredStyle, setInquiredStyle] = useState("");

  // Scroll observer to trigger entrance animations for pillars (once visible, stays visible)
  useEffect(() => {
    const currentPillars = pillarsRef.current;
    if (!currentPillars) return;

    // Immediate check if already near viewport
    const rect = currentPillars.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
      setPillarsVisible(true);
      return;
    }

    const observerOptions = {
      threshold: 0.05,
      rootMargin: "100px 0px 50px 0px",
    };

    const pillarsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPillarsVisible(true);
        pillarsObserver.unobserve(currentPillars);
      }
    }, observerOptions);

    pillarsObserver.observe(currentPillars);

    return () => {
      if (currentPillars) pillarsObserver.unobserve(currentPillars);
    };
  }, []);

  const pillars = [
    {
      number: "01",
      icon: <DraftingCompassIcon className="w-8 h-8 text-amber-500" strokeWidth={2} />,
      title: t("pillarStrengthTitle"),
      description: t("pillarStrengthDescription"),
    },
    {
      number: "02",
      icon: <MilestoneIcon className="w-8 h-8 text-amber-500" strokeWidth={2} />,
      title: t("pillarUpdatesTitle"),
      description: t("pillarUpdatesDescription"),
    },
    {
      number: "03",
      icon: <BadgePercentIcon className="w-8 h-8 text-amber-500" strokeWidth={2} />,
      title: t("pillarPaymentTitle"),
      description: t("pillarPaymentDescription"),
    },
  ];

  return (
    <div id="overview" className="relative z-10 bg-white dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 transition-colors duration-500 overflow-x-clip">
      {/* Construction Architectural Texture: Concrete Hollow Blocks (CHB) & Rough Semento Wall */}
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-repeat opacity-20 dark:opacity-[0.14] mix-blend-multiply dark:mix-blend-luminosity"
        style={{
          backgroundImage: "url('/assets/textures/chb_hollowblocks.jpg')",
          backgroundSize: "440px 440px",
        }}
      />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-3/4 right-10 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. STATS BANNER                                                           */}
      {/* ========================================================================= */}
      <StatsSection />

      {/* ========================================================================= */}
      {/* 2. WHY VISIONARIES BUILD WITH MCPA (ANIMATED 3D PILLARS ON SCROLL)        */}
      {/* ========================================================================= */}
      <section
        ref={pillarsRef}
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-neutral-200 dark:border-neutral-800"
      >
        {/* Header with Morph & Slide-Up Reveal */}
        <div
          style={{
            transform: pillarsVisible ? "translateY(0px)" : "translateY(30px)",
            opacity: pillarsVisible ? 1 : 0,
            transition:
              "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out",
          }}
          className="text-center max-w-3xl mx-auto mb-16 select-none"
        >
          {/* Eyebrow text */}
          <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            {t("overviewEyebrow")}
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
            {t("overviewHeading")}
          </h2>

          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
            {t("overviewDescription")}
          </p>

          {/* Morphing Expanding Accent Divider Line */}
          <div className="mt-8 flex items-center justify-center">
            <div
              style={{
                width: pillarsVisible ? "160px" : "0px",
                transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
              }}
              className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
            />
          </div>
        </div>

        {/* The 3 Morphing 3D Tilt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => (
            <PillarCard
              key={idx}
              idx={idx}
              number={pillar.number}
              icon={pillar.icon}
              title={pillar.title}
              description={pillar.description}
              isVisible={pillarsVisible}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PORTFOLIO · SELECTED WORKS                                             */}
      {/* ========================================================================= */}
      <PortfolioSection
        onSelectProjectForInquiry={(styleName) => setInquiredStyle(styleName)}
      />

      {/* ========================================================================= */}
      {/* 4. OUR CRAFT IN MOTION (LOOPING VIDEO BANNER)                             */}
      {/* ========================================================================= */}
      <CraftInMotion />

      {/* ========================================================================= */}
      {/* 5. SERVICES THAT DEFINE ERAS                                              */}
      {/* ========================================================================= */}
      <ServicesSection />

      {/* ========================================================================= */}
      {/* 6. THE MCPA PROCESS (HOW WE WORK)                                         */}
      {/* ========================================================================= */}
      <ProcessSection />

      {/* ========================================================================= */}
      {/* 7. BEGIN YOUR PROJECT CALLOUT (LINKS TO DEDICATED /book PAGE)             */}
      {/* ========================================================================= */}
      <section
        id="contact"
        className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <ScrollMorph
          variant="portal-expand"
          duration={950}
          className="relative rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center backdrop-blur-md"
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.25em] font-mono text-amber-600 dark:text-amber-400 mb-4">
              Begin Your Project
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight mb-4">
              Let&apos;s Build Something
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Extraordinary
              </span>
            </h2>

            <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed font-light mb-8 max-w-lg mx-auto">
              Whether you have land ready to develop or need guidance from site profiling to turnover, our engineering team is ready to collaborate.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
              >
                <span>Book an Appointment</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Review Portfolio</span>
              </Link>
            </div>

            {/* Official Social Media Channels */}
            <div className="mt-10 pt-8 border-t border-neutral-200/60 dark:border-neutral-800/80 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
              <span className="uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Official Channels:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 hover:border-blue-500/50 transition-all duration-200 text-neutral-800 dark:text-neutral-200 group shadow-xs hover:shadow-md cursor-pointer"
                  title="Facebook: MCPA Construction and Supply"
                >
                  <FacebookIcon className="w-4 h-4 rounded-full shrink-0 group-hover:scale-110 transition-transform shadow-xs" />
                  <span className="font-semibold text-xs">Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/mcpa.constructionandsupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 hover:border-pink-500/50 transition-all duration-200 text-neutral-800 dark:text-neutral-200 group shadow-xs hover:shadow-md cursor-pointer"
                  title="Instagram: @mcpa.constructionandsupply"
                >
                  <InstagramIcon className="w-4 h-4 rounded-md shrink-0 group-hover:scale-110 transition-transform shadow-xs" />
                  <span className="font-semibold text-xs">Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@mcpa.construction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 hover:border-cyan-500/50 transition-all duration-200 text-neutral-800 dark:text-neutral-200 group shadow-xs hover:shadow-md cursor-pointer"
                  title="TikTok: @mcpa.construction"
                >
                  <TikTokIcon className="w-4 h-4 rounded-full shrink-0 group-hover:scale-110 transition-transform shadow-xs" />
                  <span className="font-semibold text-xs">TikTok</span>
                </a>
              </div>
            </div>

            {/* Quick Contact & Site Coordinates */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-2">
              <a
                href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-amber-500 dark:hover:text-amber-400 transition-colors group cursor-pointer"
                title="Open MCPA Headquarters in Google Maps"
              >
                <MapPinIcon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                <span className="group-hover:underline">2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan</span>
              </a>
              <span className="hidden sm:inline text-neutral-700">·</span>
              <a href="tel:+639497758239" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                Viber / Mobile: (0949) 775 8239
              </a>
              <span className="hidden sm:inline text-neutral-700">·</span>
              <a href="mailto:mcpa.construction@gmail.com" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                mcpa.construction@gmail.com
              </a>
            </div>
          </div>
        </ScrollMorph>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}
