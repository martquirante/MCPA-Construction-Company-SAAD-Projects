"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  CheckIcon,
  BuildingIcon,
  ShieldCheckIcon,
  HardHatIcon,
  SparkleBadgeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MapPinIcon,
} from "../../shared/Icons";

const STAGES = [
  {
    step: "01",
    tag: "STAGE 01",
    title: "Discovery & Site Inspection",
    shortTitle: "Discovery",
    desc: "Detailed client consultation, lot title verification, soil evaluation, and initial architectural brief across Bulacan, NCR, or Central Luzon.",
    icon: MapPinIcon,
    telemetry: {
      location: "Plaridel, Bulacan [14.8872° N, 120.8572° E]",
      bearing: "qa = 150-200 kPa (Titled Lot Verified)",
      status: "TCT Land Verification & Geodetic Boundary Scan",
    },
    checklist: [
      "TCT Lot Title Verification",
      "Soil Bearing Capacity Test",
      "Topographical Drone Scan",
      "Architectural Design Pegs",
    ],
  },
  {
    step: "02",
    tag: "STAGE 02",
    title: "Signed & Sealed Plans",
    shortTitle: "Sealed Plans",
    desc: "Complete architectural blueprints, 3D photorealistic renderings, and engineering calculations with LGU building permit assistance.",
    icon: BuildingIcon,
    telemetry: {
      location: "PRC Licensed Architect & Structural Engineer",
      bearing: "LGU Bulacan Building & Sanitary Clearances",
      status: "3D BIM Photorealistic Framing Calculations",
    },
    checklist: [
      "Architectural Elevation Plans",
      "Seismic Zone 4 Calculations",
      "LGU Permit Documentation",
      "3D Photorealistic Renders",
    ],
  },
  {
    step: "03",
    tag: "STAGE 03",
    title: "Precision Construction",
    shortTitle: "Construction",
    desc: "In-house project management using premium construction supply materials with regular milestone photographic progress updates.",
    icon: HardHatIcon,
    telemetry: {
      location: "Grade 60 High-Tensile Steel Rebars",
      bearing: "3000 PSI Ready-Mix Structural Pouring",
      status: "Weekly Viber Photo Reports & Portal Sync",
    },
    checklist: [
      "Engineered Footing Pour",
      "Reinforced Column Framing",
      "Zero-Compromise Supply",
      "Weekly Progress Dashboard",
    ],
  },
  {
    step: "04",
    tag: "STAGE 04",
    title: "Turnover & 5-Yr Warranty",
    shortTitle: "Turnover & Warranty",
    desc: "Formal site inspection, occupancy clearance, ceremonial key turnover, and backed by a 5-year comprehensive structural warranty.",
    icon: ShieldCheckIcon,
    telemetry: {
      location: "5-Year Structural Integrity Warranty",
      bearing: "Certificate of Occupancy Granted",
      status: "Ceremonial Key Handover & As-Built Package",
    },
    checklist: [
      "Final Engineering Punchlist",
      "LGU Occupancy Clearance",
      "Ceremonial Key Handover",
      "5-Year Structural Warranty",
    ],
  },
];

export default function ProcessSection() {
  const containerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const isTransitioningRef = useRef(false);

  // Calculate scroll position through the sticky container
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollable = rect.height - windowHeight;

    if (totalScrollable <= 0) return;

    const scrolled = -rect.top;
    const rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    setProgress(rawProgress);

    if (!isTransitioningRef.current) {
      const stageIdx = Math.min(3, Math.max(0, Math.floor(rawProgress * 4)));
      setActiveStage(stageIdx);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  // Smooth jump to a specific stage by scrolling the window
  const goToStage = useCallback((stageIdx) => {
    if (!containerRef.current) return;
    isTransitioningRef.current = true;
    setActiveStage(stageIdx);

    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const containerTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;

    // Center of that stage's scroll slice
    const targetScroll = containerTop + ((stageIdx + 0.5) / 4) * totalScrollable;

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 550);
  }, []);

  // Wheel listener inside pinned container to advance stage-by-stage
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelCooldown = false;

    const onWheel = (e) => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const isPinned = rect.top <= 10 && rect.bottom >= windowHeight - 10;
      if (!isPinned || wheelCooldown) return;

      if (e.deltaY > 35) {
        if (activeStage < 3) {
          e.preventDefault();
          wheelCooldown = true;
          goToStage(activeStage + 1);
          setTimeout(() => { wheelCooldown = false; }, 480);
        }
      } else if (e.deltaY < -35) {
        if (activeStage > 0) {
          e.preventDefault();
          wheelCooldown = true;
          goToStage(activeStage - 1);
          setTimeout(() => { wheelCooldown = false; }, 480);
        }
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, [activeStage, goToStage]);

  // Node centers in 4-column layout: 12.5%, 37.5%, 62.5%, 87.5%
  // Line starts from 12.5% and grows up to 87.5% (or 100%)
  const laserPercent = [12.5, 37.5, 62.5, 100][activeStage];

  const currentStageData = STAGES[activeStage];

  return (
    <section
      id="process"
      ref={containerRef}
      className="relative w-full h-[300vh] md:h-[340vh] bg-transparent text-neutral-900 dark:text-neutral-100"
    >
      {/* Sticky Viewport Frame */}
      <div className="sticky top-0 w-full h-screen max-h-screen flex flex-col justify-center py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden select-none">
        
        {/* =================================================================== */}
        {/* 1. TOP HEADER & TELEMETRY HUD STRIP                                 */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-neutral-200 dark:border-neutral-900">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-mono tracking-widest uppercase mb-2">
              <SparkleBadgeIcon className="w-3.5 h-3.5" />
              <span>Execution Framework · Stage by Stage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
              The{" "}
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                MCPA
              </span>{" "}
              Process
            </h2>
          </div>

          {/* Active Stage HUD Counter & Direct Quick Jump Pills */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Milestone:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-xs font-mono font-bold shadow-[0_0_12px_rgba(254,226,2,0.5)]">
                Stage 0{activeStage + 1} / 04
              </span>
            </div>

            {/* Quick jump stage buttons */}
            <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10">
              {STAGES.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => goToStage(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
                    activeStage === idx
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-300/60 dark:hover:bg-white/10"
                  }`}
                  aria-label={`Jump to Stage ${s.step}: ${s.shortTitle}`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. DEDICATED ARCHITECTURAL STEPPER BAR (NO LINE-OVER-TEXT ARTIFACT) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 sm:mb-5 lg:mb-6">
          {STAGES.map((item, idx) => {
            const isCurrent = activeStage === idx;
            const isPast = activeStage > idx;
            const isFuture = activeStage < idx;

            return (
              <div key={item.step} className="relative flex flex-col">
                {/* Connecting Rail Line between circles strictly (Desktop only) */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-[18px] left-[42px] right-[-24px] h-[3px] bg-neutral-200 dark:bg-neutral-800 z-0 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(254,226,2,0.9)] transition-all duration-700 ease-out"
                      style={{
                        width: activeStage > idx ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => goToStage(idx)}
                  className="relative z-10 flex flex-col items-start text-left group cursor-pointer focus:outline-none select-none"
                  aria-label={`Jump to Stage ${item.step}: ${item.title}`}
                >
                  {/* Node Circle with Solid / Dashed Background */}
                  <div className="relative flex items-center justify-center shrink-0 mb-2.5">
                    {isCurrent && (
                      <div className="absolute -inset-1.5 rounded-full bg-amber-500/25 animate-ping pointer-events-none" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all duration-300 border-2 ${
                        isCurrent
                          ? "bg-amber-400 border-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(254,226,2,0.85)] scale-110 ring-4 ring-amber-400/30"
                          : isPast
                          ? "bg-amber-500 border-amber-500 text-neutral-950 shadow-xs"
                          : "bg-neutral-100/80 dark:bg-neutral-900/40 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 group-hover:border-amber-500 group-hover:text-amber-500"
                      }`}
                    >
                      {isPast ? (
                        <CheckIcon className="w-4 h-4 stroke-[3] text-neutral-950" />
                      ) : (
                        <span>{item.step}</span>
                      )}
                    </div>
                  </div>

                  {/* Stage Label (Cleanly positioned BELOW the circle - zero line overlap) */}
                  <div className="flex flex-col">
                    <span
                      className={`text-[11px] font-mono font-bold tracking-widest uppercase transition-colors ${
                        isCurrent
                          ? "text-amber-700 dark:text-amber-400 font-black"
                          : isPast
                          ? "text-neutral-900 dark:text-neutral-200 font-bold"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      STAGE {item.step}
                    </span>
                    <span
                      className={`text-xs font-bold truncate transition-colors ${
                        isCurrent
                          ? "text-neutral-950 dark:text-white"
                          : isPast
                          ? "text-neutral-700 dark:text-neutral-400"
                          : "text-neutral-400 dark:text-neutral-600"
                      }`}
                    >
                      {item.shortTitle}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* 3. THE 4 STAGE CARDS: SEQUENTIAL REVEAL & ARCHITECTURAL MORPH        */}
        {/* =================================================================== */}

        {/* DESKTOP & TABLET VIEW: 4 Interactive Columns */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 relative z-10">
          {STAGES.map((item, idx) => {
            const isCurrent = activeStage === idx;
            const isPast = activeStage > idx;
            const isFuture = activeStage < idx;

            // FUTURE STAGE: Architectural Blueprint Placeholder Slot (Queued)
            if (isFuture) {
              return (
                <div
                  key={item.step}
                  onClick={() => goToStage(idx)}
                  className="relative flex flex-col justify-between p-4 sm:p-5 lg:p-6 rounded-2xl border-2 border-dashed border-neutral-300/80 dark:border-neutral-800 bg-neutral-100/30 dark:bg-white/[0.02] backdrop-blur-[2px] cursor-pointer group hover:border-amber-400/50 hover:bg-neutral-100/60 dark:hover:bg-white/[0.04] transition-all duration-500 min-h-[290px] sm:min-h-[315px]"
                  role="button"
                  tabIndex={0}
                  aria-label={`Initialize Stage ${item.step}: ${item.title}`}
                >
                  <div>
                    {/* Queued Phase Status Pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-neutral-200/70 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-semibold border border-neutral-300/60 dark:border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse" />
                        <span>Stage {item.step} · Queued</span>
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-600 font-semibold">
                        0{idx + 1}/04
                      </span>
                    </div>

                    {/* Faint Blueprint Header */}
                    <h3 className="text-xl font-bold tracking-tight leading-snug text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-neutral-400/70 dark:text-neutral-600/70 leading-relaxed italic">
                      Awaiting milestone... Scroll or tap to deploy this construction phase.
                    </p>
                  </div>

                  {/* Blueprint Placeholder Footer Action */}
                  <div className="mt-5 pt-3 border-t border-dashed border-neutral-200 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                    <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 font-semibold transition-colors">
                      Click to Initialize
                    </span>
                    <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              );
            }

            // ACTIVE OR COMPLETED STAGE: Fully Revealed & Morphed Physical Card
            return (
              <div
                key={item.step}
                onClick={() => goToStage(idx)}
                className={`group relative flex flex-col justify-between p-4 sm:p-5 lg:p-6 rounded-2xl border cursor-pointer min-h-[290px] sm:min-h-[315px] transition-all duration-500 ${
                  isCurrent
                    ? "animate-stage-morph bg-white dark:bg-neutral-900 border-2 border-amber-500 dark:border-amber-400 shadow-[0_18px_50px_rgba(245,158,11,0.22)] -translate-y-2 ring-4 ring-amber-500/15 z-20"
                    : "bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400/50 dark:hover:border-neutral-700 shadow-sm translate-y-0 z-10"
                }`}
              >
                <div>
                  {/* Phase Status Pill */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                        isCurrent
                          ? "bg-amber-400 text-neutral-950 font-black shadow-xs"
                          : "bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-bold border border-neutral-200/60 dark:border-white/5"
                      }`}
                    >
                      {isCurrent ? "Active Phase" : "Completed"}
                    </span>

                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-semibold">
                      0{idx + 1}/04
                    </span>
                  </div>

                  {/* Title: 100% High-Contrast in Both Modes */}
                  <h3
                    className={`text-xl font-black tracking-tight leading-snug transition-colors ${
                      isCurrent
                        ? "text-neutral-950 dark:text-amber-400"
                        : "text-neutral-950 dark:text-white"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Description Narrative */}
                  <p className="mt-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Technical Checklist with Staggered Cascading Reveal */}
                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2.5">
                  {item.checklist.map((check, cIdx) => (
                    <div
                      key={cIdx}
                      className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                        isCurrent
                          ? "text-neutral-950 dark:text-neutral-100 font-medium"
                          : "text-neutral-700 dark:text-neutral-400 font-normal"
                      }`}
                      style={{
                        animation: isCurrent
                          ? `staggerItemSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`
                          : undefined,
                        animationDelay: isCurrent
                          ? `${(cIdx + 1) * 80}ms`
                          : undefined,
                      }}
                    >
                      <CheckIcon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isCurrent
                            ? "text-amber-600 dark:text-amber-400 stroke-[2.5]"
                            : "text-amber-600 dark:text-neutral-400 stroke-[2]"
                        }`}
                      />
                      <span className="truncate">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE VIEW: Focused Single Hero Stage Card */}
        <div className="flex md:hidden flex-col gap-4 relative z-10">
          <div
            key={currentStageData.step}
            className="animate-stage-morph bg-white dark:bg-neutral-900 border-2 border-amber-500 dark:border-amber-400 p-6 rounded-2xl shadow-[0_16px_45px_rgba(245,158,11,0.22)] ring-4 ring-amber-500/15"
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-amber-400 text-neutral-950 font-black shadow-xs">
                Active Phase · Stage 0{activeStage + 1}
              </span>
              <span className="text-xs font-mono text-neutral-500 font-semibold">
                0{activeStage + 1} / 04
              </span>
            </div>

            <h3 className="text-xl font-black tracking-tight text-neutral-950 dark:text-amber-400 leading-snug">
              {currentStageData.title}
            </h3>

            <p className="mt-2.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
              {currentStageData.desc}
            </p>

            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2.5">
              {currentStageData.checklist.map((check, cIdx) => (
                <div
                  key={cIdx}
                  className="flex items-center gap-2 text-xs font-mono text-neutral-950 dark:text-neutral-100 font-medium"
                  style={{
                    animation: `staggerItemSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: `${(cIdx + 1) * 80}ms`,
                  }}
                >
                  <CheckIcon className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                  <span className="truncate">{check}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM ARCHITECTURAL CAD HUD & STEPPER CONTROLS                  */}
        {/* =================================================================== */}
        <div className="mt-4 sm:mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          
          {/* Active Telemetry Readout */}
          <div
            key={activeStage}
            className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 truncate max-w-lg transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 font-bold uppercase shrink-0">
              STAGE 0{activeStage + 1} TELEMETRY:
            </span>
            <span className="truncate text-neutral-900 dark:text-neutral-200 font-medium">
              {currentStageData.telemetry.status}
            </span>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToStage(Math.max(0, activeStage - 1))}
              disabled={activeStage === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-xs"
              aria-label="Previous Construction Stage"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Prev Stage</span>
            </button>

            {/* Scroll/Tap to Advance Pill */}
            <button
              onClick={() => {
                if (activeStage < 3) {
                  goToStage(activeStage + 1);
                } else {
                  const contact = document.getElementById("contact");
                  if (contact) contact.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer text-xs"
              aria-label={
                activeStage < 3
                  ? "Advance to Next Stage"
                  : "All Stages Complete. Scroll to Next Section."
              }
            >
              <span>
                {activeStage < 3 ? "Scroll or Tap to Advance" : "Explore Next Section"}
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}


