"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import {
  BuildingIcon,
  HardHatIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
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
      telemetry: "Official Certificate of Occupancy · Joint Walkthrough · 5-Year Structural Warranty",
      checklist: [
        "Complete tile works, paint, lighting, windows and bathroom fixtures",
        "Detailed room-by-room quality walkthrough with the homeowner",
        "Assistance in securing the official Certificate of Occupancy",
        "Ceremonial house key turnover, complete house plans & 5-year warranty",
      ],
      output: "Official Certificate of Occupancy, House Keys & 5-Year Structural Warranty",
    },
  ];

  const pillars = [
    {
      icon: <ListChecksIcon className="w-6 h-6 text-amber-500" />,
      title: "Milestone-Based Payments",
      desc: "You only pay for construction stages that are inspected, approved, and verified with photos.",
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-amber-500" />,
      title: "Direct In-House Materials",
      desc: "Zero compromised materials. All steel bars and concrete aggregates come directly from our own verified logistics fleet.",
    },
    {
      icon: <SmartphoneIcon className="w-6 h-6 text-amber-500" />,
      title: "Regular Photo Updates",
      desc: "Clear photo updates sent directly to your phone and online portal, so you always know the exact status of your home.",
    },
    {
      icon: <HardHatIcon className="w-6 h-6 text-amber-500" />,
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
            <Link href="/" className="hover:text-amber-500 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Process</span>
          </nav>
        </div>

        {/* Page Hero Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              <span>Clear Step-by-Step Progress · Regular Updates</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
              Our 4-Stage <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Construction Process
              </span>
            </h1>
            <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
              We remove worries from building your home through clear step-by-step updates, weekly photo logs sent to your phone, and guaranteed quality materials. Here is how your dream home is built.
            </p>
          </div>
        </div>

        {/* The 4 Detailed Chronological Stages */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {stages.map((stg) => (
            <div
              key={stg.step}
              className="relative rounded-3xl p-8 sm:p-10 lg:p-12 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 shadow-lg hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Stage Indicator Col */}
                <div className="lg:col-span-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl sm:text-5xl font-extrabold text-amber-500 dark:text-amber-400 tabular-nums">
                        {stg.step}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
                        {stg.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                      {stg.title}
                    </h2>

                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-2 mb-4">
                      {stg.subtitle}
                    </p>

                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                      {stg.desc}
                    </p>
                  </div>

                  {/* Stage Highlights Badge */}
                  <div className="mt-6 p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <span className="text-amber-500 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Stage Highlights
                    </span>
                    {stg.telemetry}
                  </div>
                </div>

                {/* Checklist & Deliverables Col */}
                <div className="lg:col-span-8 bg-neutral-50 dark:bg-neutral-950/60 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>Step Verification Checklist</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {stg.checklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
                          <CheckIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">
                        What You Receive After This Step:
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {stg.output}
                      </span>
                    </div>

                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors shrink-0"
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
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              The MCPA Standard
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white">
              Why Our Process Builds Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pil, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 hover:border-amber-500/50 transition-all duration-300 shadow-sm"
              >
                <div className="p-3 w-fit rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 mb-4">
                  {pil.icon}
                </div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white mb-2">
                  {pil.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {pil.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Consultation CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-24">
          <div className="rounded-3xl p-8 sm:p-12 bg-white dark:bg-neutral-900/90 text-neutral-950 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />

            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Step 01 Starts Here
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to Begin Your Site Visit & Consultation?
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-neutral-600 dark:text-neutral-400 text-sm sm:text-base font-light">
              Talk directly with our licensed builders. We&apos;ll visit your property, answer your questions, and guide you through each step of building your home.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
              >
                <span>Book Free Consultation</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <span>View Full Services</span>
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
