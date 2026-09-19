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
  SparkleBadgeIcon,
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
      badge: "Phase 1: Due Diligence",
      icon: <CompassIcon className="w-5 h-5 text-amber-500" />,
      title: "Discovery, Lot Profiling & Site Verification",
      subtitle: "Soil bearing analysis, geodetic boundaries & initial brief",
      desc: "Before a single nail is hammered, our licensed engineers evaluate your titled property across Bulacan, Metro Manila, or Central Luzon to eliminate all structural and legal surprises.",
      telemetry: "TCT Land Title Verification · qa = 150-200 kPa Soil Bearing Scan",
      checklist: [
        "TCT (Transfer Certificate of Title) verification with Registry of Deeds",
        "Geotechnical soil bearing capacity test for footing sizing",
        "Topographical drone survey and solar orientation analysis",
        "Client lifestyle brief & preliminary budget architectural pegging",
      ],
      output: "Pre-Construction Dossier & Preliminary Cost Estimate",
    },
    {
      step: "02",
      badge: "Phase 2: Architectural CAD & BIM",
      icon: <FileSignatureIcon className="w-5 h-5 text-amber-500" />,
      title: "Signed & Sealed Blueprints & Permitting",
      subtitle: "Full engineering calculations ready for municipal approval",
      desc: "Our licensed architects and structural engineers generate complete CAD blueprints and 3D photorealistic BIM models compliant with the National Building Code of the Philippines.",
      telemetry: "PRC Licensed Master Set · Seismic Zone 4 Compliance · LGU Clearances",
      checklist: [
        "Architectural floor plans, exterior elevations & interior schedules",
        "Seismic Zone 4 structural calculations & foundation framing computations",
        "Electrical layout, auxiliary circuits, sanitary & plumbing diagrams",
        "End-to-end LGU Building Permit submission & engineering follow-through",
      ],
      output: "Approved Municipal Building Permits & 100% Sealed Blueprints",
    },
    {
      step: "03",
      badge: "Phase 3: Heavy Structural Execution",
      icon: <HardHatIcon className="w-5 h-5 text-amber-500" />,
      title: "Precision Construction & Supply Integration",
      subtitle: "In-house material logistics and weekly milestone photo logs",
      desc: "We build right and we build strong. Utilizing our direct in-house supply of PNS-certified Grade 60 steel rebars and ready-mix concrete, every milestone is verified with photographic logs.",
      telemetry: "Grade 60 PNS Steel Rebar · 3000 PSI Pour · Weekly Photo Reports",
      checklist: [
        "Engineered footing excavation, rebar tying & gravel bedding",
        "Supervised structural pouring with concrete slump and cylinder testing",
        "Reinforced concrete columns, shear walls & slab curing monitoring",
        "Weekly photo updates uploaded directly to your Client Portal & Viber",
      ],
      output: "Weather-tight, structurally sound building shell ready for finishes",
    },
    {
      step: "04",
      badge: "Phase 4: Finishing & Handover",
      icon: <KeyIcon className="w-5 h-5 text-amber-500" />,
      title: "Punchlisting, Occupancy & Ceremonial Turnover",
      subtitle: "Comprehensive quality audit and official key turnover",
      desc: "The milestone you've dreamed of. We conduct a rigorous 100-point joint engineering punchlist audit, secure municipal occupancy permits, and hand over your keys.",
      telemetry: "LGU Certificate of Occupancy · 100-Point Audit · 5-Yr Structural Warranty",
      checklist: [
        "Complete architectural finishes, tile laying, fixtures & glazing",
        "100-point quality punchlist walkthrough with the homeowner",
        "LGU Municipal Certificate of Occupancy clearance processing",
        "Ceremonial key handover, As-Built blueprints package & warranty certificates",
      ],
      output: "Official Certificate of Occupancy, Key Set & 5-Year Structural Warranty",
    },
  ];

  const pillars = [
    {
      icon: <ListChecksIcon className="w-6 h-6 text-amber-500" />,
      title: "Milestone-Gated Releases",
      desc: "No subsequent construction phase begins without a verified engineering inspection sign-off and photographic confirmation.",
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-amber-500" />,
      title: "Direct In-House Supply",
      desc: "Zero counterfeit materials. All rebars are Grade 60 PNS-certified and aggregates are delivered directly from our own logistics fleet.",
    },
    {
      icon: <SmartphoneIcon className="w-6 h-6 text-amber-500" />,
      title: "100% Digital Visibility",
      desc: "Real-time updates directly to your phone via Viber and our Client Portal, so you stay informed whether you're at work or overseas.",
    },
    {
      icon: <HardHatIcon className="w-6 h-6 text-amber-500" />,
      title: "Licensed On-Site Oversight",
      desc: "Every major structural milestone is supervised in-person by PRC licensed Civil Engineers and Master Builders.",
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
              <span>Transparent Milestone Tracking · Zero Guesswork</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
              Our 4-Stage <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Construction Process
              </span>
            </h1>
            <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
              We eliminate construction anxiety through structured engineering milestones, real-time photographic logs, and guaranteed material transparency. Here is how your vision transforms into an enduring reality.
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

                  {/* Telemetry Badge */}
                  <div className="mt-6 p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <span className="text-amber-500 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Engineering Telemetry
                    </span>
                    {stg.telemetry}
                  </div>
                </div>

                {/* Checklist & Deliverables Col */}
                <div className="lg:col-span-8 bg-neutral-50 dark:bg-neutral-950/60 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>Milestone Verification Checklist</span>
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
                        Phase Output & Client Deliverable:
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {stg.output}
                      </span>
                    </div>

                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors shrink-0"
                    >
                      <span>Inquire This Phase</span>
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
              Why Our Process Never Cuts Corners
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
          <div className="rounded-3xl p-8 sm:p-12 bg-neutral-900 dark:bg-neutral-900/90 text-white border border-neutral-800 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />

            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Step 01 Starts Here
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to Begin Your Discovery & Site Inspection?
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-neutral-400 text-sm sm:text-base font-light">
              Connect directly with MCPA's licensed engineers. We'll examine your titled property, provide structural recommendations, and chart your clear path to construction.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
              >
                <span>Book Pre-Consultation</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-neutral-700 hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
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
