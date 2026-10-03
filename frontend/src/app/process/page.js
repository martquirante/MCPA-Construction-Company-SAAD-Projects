"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import {
  BuildingIcon,
  HardHatIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ListChecksIcon,
  TruckIcon,
  SmartphoneIcon,
  CompassIcon,
  FileSignatureIcon,
  KeyIcon,
} from "@/modules/shared/Icons";

export default function ProcessPage() {
  const stages = [
    {
      step: "01",
      badge: "Phase 1: Initial Planning & Site Visit",
      icon: <CompassIcon className="w-5 h-5 text-amber-500" />,
      title: "Discovery, Lot Check & Site Inspection",
      subtitle: "Soil evaluation, boundary check & design planning",
      desc: "Before any construction begins, our licensed engineers and builders visit your titled property across Bulacan, Metro Manila, or Central Luzon to verify the land title and test the ground condition.",
      telemetry: "Land Title Verification · Ground Soil Strength Check",
      checklist: [
        "Land title verification with official property records",
        "Ground and soil inspection to ensure a strong foundation",
        "Lot boundary check and orientation survey",
        "Personal consultation on your dream house style and budget",
      ],
      output: "Site Inspection Report & Estimated Project Cost Breakdown",
    },
    {
      step: "02",
      badge: "Phase 2: Architectural Blueprints & Permits",
      icon: <FileSignatureIcon className="w-5 h-5 text-amber-500" />,
      title: "Signed & Sealed Blueprints & City Permits",
      subtitle: "Complete blueprints ready for municipal approval",
      desc: "Our licensed architects and civil engineers draft your complete house plans, detailed 3D color designs, and handle municipal building permit submissions.",
      telemetry: "Licensed Architects & Engineers · Earthquake-Resistant Design · Building Permits",
      checklist: [
        "Complete architectural floor plans, exterior looks & room layouts",
        "Earthquake-resistant structural calculations for columns and foundation",
        "Complete electrical wiring plans and plumbing layouts",
        "Full assistance in submitting and securing City Building Permits",
      ],
      output: "Approved City Building Permits & Official Sealed Blueprints",
    },
    {
      step: "03",
      badge: "Phase 3: Structural Building & Framing",
      icon: <HardHatIcon className="w-5 h-5 text-amber-500" />,
      title: "Solid Construction & Quality Materials",
      subtitle: "Built with tested concrete, steel, and regular photo updates",
      desc: "We build your home strong from the ground up. Using our dedicated supply of certified high-grade steel and strong concrete, every stage is documented with photo updates.",
      telemetry: "Certified Steel Bars · Strong 3000 PSI Concrete · Weekly Photo Reports",
      checklist: [
        "Foundation excavation, solid footing and steel rebar tying",
        "Supervised concrete pouring with strength testing",
        "Reinforced concrete posts, beams, and floor slabs",
        "Weekly photo updates sent directly to your phone and online portal",
      ],
      output: "Weather-tight, solid house structure ready for finishing",
    },
    {
      step: "04",
      badge: "Phase 4: Final Inspection & House Turnover",
      icon: <KeyIcon className="w-5 h-5 text-amber-500" />,
      title: "Final Quality Inspection & Key Turnover",
      subtitle: "Room-by-room walkthrough and official key handover",
      desc: "The milestone you've waited for. We conduct a thorough room-by-room walkthrough with you, finalize the Certificate of Occupancy, and hand you the keys to your new home.",
      telemetry: "Official Certificate of Occupancy · Joint Walkthrough · 15-Year Structural Warranty",
      checklist: [
        "Complete tile works, paint, lighting, windows and bathroom fixtures",
        "Detailed room-by-room quality walkthrough with the homeowner",
        "Assistance in securing the official Certificate of Occupancy",
        "Ceremonial house key turnover, complete house plans & 15-year warranty",
      ],
      output: "Official Certificate of Occupancy, House Keys & 15-Year Structural Warranty",
    },
  ];

  const pillars = [
    {
      icon: <ListChecksIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Milestone-Based Payments",
      desc: "You only pay for construction stages that are inspected, approved, and verified with photos.",
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Direct In-House Materials",
      desc: "Zero compromised materials. All steel bars and concrete aggregates come directly from our own verified logistics fleet.",
    },
    {
      icon: <SmartphoneIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Regular Photo Updates",
      desc: "Clear photo updates sent directly to your phone and online portal, so you always know the exact status of your home.",
    },
    {
      icon: <HardHatIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Licensed On-Site Supervision",
      desc: "Every major construction stage is supervised in person by licensed Civil Engineers and Master Builders.",
    },
  ];

  return (
    <div className="chb-texture min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-500">
      {/* Top Sticky Navigation */}
      <ClientNavbar isCompleted={true} />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 md:pt-32 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Link
              href="/"
              onClick={() => setReturnToCompletedHome(true)}
              className="hover:text-amber-500 transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Process</span>
          </nav>
        </div>

        {/* Page Hero Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4 select-none">
              <span>Clear Step-by-Step Progress · Regular Updates</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white leading-[1.08]">
              Our 4-Stage <br />
              <span className="text-amber-600 dark:text-amber-400">
                Construction Process
              </span>
            </h1>
            <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
              We remove worries from building your home through clear step-by-step updates, weekly photo logs sent to your phone, and guaranteed quality materials. Here is how your dream home is built.
            </p>
          </div>
        </div>

        {/* The 4 Detailed Chronological Stages */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {stages.map((stg) => (
            <div
              key={stg.step}
              className="relative rounded-[6px] p-7 sm:p-10 lg:p-12 bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-[border-color,box-shadow] duration-150 group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Stage Indicator Col */}
                <div className="lg:col-span-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl sm:text-5xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {stg.step}
                      </span>
                      <span className="px-2.5 py-1 rounded-[4px] bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold uppercase tracking-[0.12em]">
                        {stg.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150">
                      {stg.title}
                    </h2>

                    <p className="text-xs font-mono font-medium text-amber-700 dark:text-amber-400/90 uppercase tracking-wider mt-2 mb-4">
                      {stg.subtitle}
                    </p>

                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                      {stg.desc}
                    </p>
                  </div>

                  {/* Stage Highlights Badge — Architectural specification block */}
                  <div className="mt-6 p-3.5 rounded-[4px] border-l-2 border-l-amber-500 border-y border-r border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.02] font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <span className="text-amber-700 dark:text-amber-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Stage Telemetry Highlights
                    </span>
                    {stg.telemetry}
                  </div>
                </div>

                {/* Checklist & Deliverables Col */}
                <div className="lg:col-span-8 bg-neutral-50/70 dark:bg-white/[0.02] rounded-[6px] p-6 sm:p-8 border border-neutral-200 dark:border-white/[0.08] flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-[0.14em] text-neutral-900 dark:text-white mb-4 select-none">
                      Step Verification Schedule
                    </h3>

                    {/* Unified Architectural Schedule Container */}
                    <div className="rounded-[4px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2">
                        {stg.checklist.map((item, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2.5 p-3 border-b border-neutral-150 dark:border-white/[0.05] ${
                              i % 2 === 0 ? "sm:border-r border-neutral-150 dark:border-white/[0.05]" : ""
                            } ${i >= stg.checklist.length - 2 ? "sm:border-b-0" : ""} hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors`}
                          >
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 shrink-0 select-none">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs text-neutral-700 dark:text-neutral-300 leading-snug">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] font-mono uppercase tracking-wider">
                        Stage Output Handover:
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">
                        {stg.output}
                      </span>
                    </div>

                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors shrink-0"
                    >
                      <span>Inquire About This Step</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Assurance Pillars */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-3 select-none">
              <span>The MCPA Standard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white">
              Why Our Process Builds Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pil, idx) => (
              <div
                key={idx}
                className="p-6 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-[border-color,box-shadow] duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
              >
                {/* Pure Icon — No Box Behind It */}
                <div className="text-amber-600 dark:text-amber-400 mb-4 shrink-0">
                  {pil.icon}
                </div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white mb-2">
                  {pil.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  {pil.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Consultation CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-24">
          <div className="architectural-cta-card rounded-[6px] p-8 sm:p-12 bg-white dark:bg-[#10121a] border border-neutral-200/90 dark:border-white/[0.12] text-center relative overflow-hidden transition-all duration-300">
            {/* Top Amber Reference Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

            <div className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-4 select-none">
              <span>Step 01 Starts Here</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight max-w-2xl mx-auto text-neutral-950 dark:text-white leading-tight">
              Ready to Begin Your Site Visit &amp; Consultation?
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-neutral-600 dark:text-neutral-300 text-sm sm:text-base font-normal leading-relaxed">
              We schedule an on-site evaluation of your titled property, review your architectural preferences, and provide a clear, realistic cost estimate.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-[0.08em] transition-colors shadow-[0_2px_8px_rgba(245,158,11,0.25)] cursor-pointer"
              >
                <span>Schedule a Free Site Inspection</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-[4px] border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white text-xs font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
              >
                <span>Review Services &amp; Packages</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
