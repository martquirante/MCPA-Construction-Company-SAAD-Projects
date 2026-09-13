"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  CheckIcon,
  BuildingIcon,
  ShieldCheckIcon,
  HardHatIcon,
  SparkleBadgeIcon,
  MapPinIcon,
} from "../../shared/Icons";

const STAGES = [
  {
    step: "01",
    tag: "STAGE 01",
    phaseBadge: "Phase 1: Pre-Construction & Profiling",
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
    phaseBadge: "Phase 2: Architectural & Engineering CAD",
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
    phaseBadge: "Phase 3: Structural Execution & Erection",
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
    phaseBadge: "Phase 4: Final Handover & Occupancy",
    title: "Turnover",
    shortTitle: "Turnover",
    desc: "Formal site inspection, comprehensive punchlist resolution, LGU Certificate of Occupancy clearance, and ceremonial key handover.",
    icon: ShieldCheckIcon,
    telemetry: {
      location: "Official Project Turnover & Client Acceptance",
      bearing: "Certificate of Occupancy Granted",
      status: "Ceremonial Key Handover & As-Built Package",
    },
    checklist: [
      "Final Engineering Punchlist",
      "LGU Occupancy Clearance",
      "Ceremonial Key Handover",
      "Complete As-Built Documentation",
    ],
  },
];

export default function ProcessSection() {
  const containerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const isTransitioningRef = useRef(false);

  // Smooth jump to a specific stage by scrolling the container
  const goToStage = useCallback((stageIdx) => {
    const targetIdx = Math.max(0, Math.min(3, stageIdx));
    setActiveStage(targetIdx);

    if (containerRef.current) {
      isTransitioningRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      const containerTop = rect.top + scrollTop;
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable > 0) {
        const targetScroll = containerTop + ((targetIdx + 0.5) / 4) * totalScrollable;
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 550);
    }
  }, []);

  // Natural scroll tracking for ALL devices (Mobile, Tablet, Desktop)
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isTransitioningRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollable = rect.height - windowHeight;

    if (totalScrollable <= 0) return;

    const scrolled = -rect.top;

    // If section hasn't reached the top of viewport, stay on stage 1
    if (scrolled < 0) {
      setActiveStage(0);
      return;
    }

    const rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));

    // Calculate stage based on smooth scroll slice:
    // 0.00 - 0.25 -> Stage 0 (Discovery)
    // 0.25 - 0.50 -> Stage 1 (Sealed Plans)
    // 0.50 - 0.75 -> Stage 2 (Construction)
    // 0.75 - 1.00 -> Stage 3 (Turnover)
    const stageIdx = Math.min(3, Math.max(0, Math.floor(rawProgress * 4)));
    setActiveStage((prev) => (prev !== stageIdx ? stageIdx : prev));
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

  // Mobile/Tablet Touch Swipe gesture listener: swipe left -> next stage, swipe right -> prev stage
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e) => {
      if (e.changedTouches.length === 1) {
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const deltaY = touchStartY - e.changedTouches[0].clientY;

        // Horizontal swipe: left to advance stage, right to go back
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
          if (deltaX > 0 && activeStage < 3) {
            goToStage(activeStage + 1);
          } else if (deltaX < 0 && activeStage > 0) {
            goToStage(activeStage - 1);
          }
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeStage, goToStage]);

  const currentStage = STAGES[activeStage];
  const IconComponent = currentStage.icon;

  return (
    <section
      id="process"
      ref={containerRef}
      className="relative w-full h-[320vh] sm:h-[340vh] md:h-[360vh] bg-transparent text-neutral-900 dark:text-neutral-100"
    >
      {/* Sticky Viewport Frame on Mobile, Tablet & Desktop */}
      <div className="sticky top-0 w-full min-h-screen h-[100dvh] flex flex-col justify-between py-3 sm:py-5 md:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none overflow-hidden">
        
        {/* =================================================================== */}
        {/* 1. TOP HEADER & MILESTONE HUD STRIP                                 */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-neutral-200 dark:border-neutral-900 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-1 sm:mb-2">
              <SparkleBadgeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Execution Framework · Stage by Stage</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
              The{" "}
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                MCPA
              </span>{" "}
              Process
            </h2>
          </div>

          {/* Active Stage HUD Counter & Direct Quick Jump Pills (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                Milestone:
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold shadow-xs">
                Stage 0{activeStage + 1} / 04
              </span>
            </div>

            {/* Quick jump stage buttons */}
            <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10">
              {STAGES.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => goToStage(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
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
        {/* 2. DEDICATED ARCHITECTURAL STEPPER BAR (MOBILE & DESKTOP)           */}
        {/* =================================================================== */}

        {/* Mobile Adaptive Stepper: Zero horizontal overflow, expandable active button */}
        <div className="flex md:hidden items-center justify-between gap-1 mb-2.5 p-1 bg-neutral-200/60 dark:bg-white/5 rounded-2xl border border-neutral-300/80 dark:border-white/10 w-full shrink-0">
          {STAGES.map((item, idx) => {
            const isCurrent = activeStage === idx;
            const isPast = activeStage > idx;

            return (
              <button
                key={item.step}
                onClick={() => goToStage(idx)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? "flex-[2] bg-amber-500 text-neutral-950 font-bold shadow-sm scale-[1.01]"
                    : isPast
                    ? "flex-1 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "flex-1 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-white/5"
                }`}
                aria-label={`Jump to Stage ${item.step}: ${item.shortTitle}`}
              >
                {isPast ? (
                  <CheckIcon className="w-3.5 h-3.5 stroke-[3] text-amber-700 dark:text-amber-400" />
                ) : (
                  <span className="font-bold text-[11px]">{item.step}</span>
                )}
                {isCurrent && (
                  <span className="text-[11px] font-bold tracking-tight truncate">
                    {item.shortTitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Architectural Stepper Bar with Connecting Glowing Rail */}
        <div className="hidden md:grid md:grid-cols-4 gap-6 mb-4 sm:mb-5 shrink-0">
          {STAGES.map((item, idx) => {
            const isCurrent = activeStage === idx;
            const isPast = activeStage > idx;

            return (
              <div key={item.step} className="relative flex flex-col">
                {/* Connecting Rail Line between circles strictly */}
                {idx < 3 && (
                  <div className="absolute top-[18px] left-[46px] right-[-28px] h-[3px] bg-neutral-200 dark:bg-neutral-800 z-0 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all duration-500 ease-out"
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
                  <div className="relative flex items-center justify-center shrink-0 mb-2">
                    {isCurrent && (
                      <div className="absolute -inset-1.5 rounded-full bg-amber-500/25 animate-ping pointer-events-none" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                        isCurrent
                          ? "bg-amber-400 border-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110 ring-4 ring-amber-400/30"
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

                  {/* Stage Label */}
                  <div className="flex flex-col">
                    <span
                      className={`text-[11px] font-bold tracking-wider uppercase transition-colors ${
                        isCurrent
                          ? "text-amber-700 dark:text-amber-400"
                          : isPast
                          ? "text-neutral-900 dark:text-neutral-200"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      STAGE {item.step}
                    </span>
                    <span
                      className={`text-xs font-semibold truncate transition-colors ${
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
        {/* 3. FOCUSED ACTIVE STAGE CARD (ONLY ACTIVE STAGE IS VISIBLE)         */}
        {/* =================================================================== */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-auto min-h-0">
          <div
            key={currentStage.step}
            className="animate-stage-morph bg-white dark:bg-neutral-900/95 border-2 border-amber-500/80 dark:border-amber-400/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-9 shadow-[0_20px_60px_rgba(245,158,11,0.18)] ring-4 ring-amber-500/10 backdrop-blur-md transition-all overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
              
              {/* Left Column: Stage Narrative, Phase Badge & Deliverables */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Phase Status Pill */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-400 text-neutral-950 shadow-xs">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-950 animate-pulse" />
                      <span>{currentStage.phaseBadge}</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      Stage 0{activeStage + 1} of 04
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-tight mb-2">
                    {currentStage.title}
                  </h3>

                  {/* Narrative Description */}
                  <p className="text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal mb-4 sm:mb-5">
                    {currentStage.desc}
                  </p>
                </div>

                {/* Scope & Deliverables Checklist */}
                <div className="pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400 mb-2 sm:mb-2.5">
                    Key Deliverables & Protocols:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {currentStage.checklist.map((check, cIdx) => (
                      <div
                        key={`${currentStage.step}-${cIdx}`}
                        className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/70 dark:border-white/5 text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100"
                        style={{
                          animation: `staggerItemSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) both`,
                          animationDelay: `${(cIdx + 1) * 70}ms`,
                        }}
                      >
                        <span className="shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400 stroke-[3]" />
                        </span>
                        <span className="truncate text-xs sm:text-sm">{check}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile/Tablet Compact Telemetry Status Strip (replaces big right dossier on small screens) */}
                <div className="flex lg:hidden items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-200/80 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {currentStage.telemetry.status}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                    0{activeStage + 1}/04
                  </span>
                </div>
              </div>

              {/* Right Column: Engineering Telemetry & CAD Blueprint Dossier (Desktop / Large Screens) */}
              <div className="hidden lg:flex lg:col-span-5 bg-neutral-50 dark:bg-neutral-950/70 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
                        Engineering Dossier
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Protocol Spec · 0{activeStage + 1}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Structured Specification Rows */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">
                      Milestone Scope:
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-snug block">
                      {currentStage.telemetry.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">
                      Technical Standard / Clearance:
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-snug block">
                      {currentStage.telemetry.bearing}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">
                      Territory / Supervision:
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-snug block">
                      {currentStage.telemetry.location}
                    </span>
                  </div>
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    Progress: Stage 0{activeStage + 1} of 04
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((stepIdx) => (
                      <span
                        key={stepIdx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeStage === stepIdx
                            ? "w-6 bg-amber-500"
                            : activeStage > stepIdx
                            ? "w-2.5 bg-amber-500/50"
                            : "w-2.5 bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}


