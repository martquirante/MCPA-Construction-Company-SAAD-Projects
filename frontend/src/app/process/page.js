"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import { useCms } from "@/modules/cms/CmsContext";
import { useLanguage } from "@/modules/shared/LanguageContext";
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

const DEFAULT_STAGES = [
  {
    step: "01",
    badge: "Stage 1: Custom Design & Blueprints Purchase",
    icon: <FileSignatureIcon className="w-5 h-5 text-amber-500" />,
    title: "Architectural Design & Signed/Sealed Blueprints",
    subtitle: "Complete custom blueprints prepared & sealed by licensed architects and civil engineers",
    desc: "Start by purchasing your complete custom design package. Our licensed architectural and civil engineering team drafts your personalized 3D designs, structural calculations, and complete blueprints required for building permits and financing approvals.",
    telemetry: "Signed & Sealed Plans · Complete 3D Visualizations · City Permit Ready",
    checklist: [
      "Initial lot boundary check, orientation survey, and soil strength evaluation",
      "Personalized architectural consultation on your custom floor plan and vision",
      "Earthquake-resistant structural calculations and signed PRC engineer seals",
      "Complete electrical, plumbing, sanitary, and architectural working drawings",
    ],
    output: "Complete Signed & Sealed Architectural & Engineering Blueprints Package",
  },
  {
    step: "02",
    badge: "Stage 2: Build Now, Pay Later (BNPL) Financing",
    icon: <CompassIcon className="w-5 h-5 text-amber-500" />,
    title: "BNPL & Bank/Pag-IBIG Loan Application",
    subtitle: "Flexible installment financing assistance with your clean title and blueprints",
    desc: "With your finalized blueprints and titled lot in hand, you can apply for our Build Now, Pay Later financing or Bank / Pag-IBIG loan assistance. We provide the certified Bill of Materials (BOM) and structural cost estimate needed for rapid financial approval.",
    telemetry: "Zero Downpayment Options · Clean Titled Lots · Fast Approval Assistance",
    checklist: [
      "Land title verification with official property and registry records",
      "Detailed Bill of Materials (BOM) and itemized construction cost schedule",
      "Dedicated endorsement and paperwork assistance for Bank or Pag-IBIG loans",
      "Clear milestone-based flexible installment progress payment contract",
    ],
    output: "Approved Construction Financing & Milestone Progress Schedule",
  },
  {
    step: "03",
    badge: "Stage 3: Construction Push-Through & Foundation",
    icon: <HardHatIcon className="w-5 h-5 text-amber-500" />,
    title: "Full Construction Execution & Certified Materials",
    subtitle: "Turnkey building with direct in-house supply, tested concrete, and regular photo updates",
    desc: "Once financing is secured, we push through with on-site construction. From excavation and foundation pouring to post and beam erection, every single phase is built using tested materials and documented with live progress updates.",
    telemetry: "Direct Rebars & 3000+ PSI Concrete · Supervised Structural Pouring · Weekly Photo Logs",
    checklist: [
      "Groundbreaking ceremony, excavation, solid footing, and steel rebar tying",
      "Supervised ready-mix concrete pouring with cylinder strength tests",
      "Reinforced concrete posts, beams, floor slabs, and exterior wall installation",
      "Weekly high-resolution photo and video logs sent directly to your phone and client portal",
    ],
    output: "Weather-Tight, Earthquake-Tested Solid Home Structure",
  },
  {
    step: "04",
    badge: "Stage 4: Final Quality Inspection & Key Turnover",
    icon: <KeyIcon className="w-5 h-5 text-amber-500" />,
    title: "Room-by-Room Walkthrough & Key Handover",
    subtitle: "Certificate of Occupancy, ceremonial key turnover, and 15-Year Structural Warranty",
    desc: "The milestone you've waited for. We conduct a detailed room-by-room walkthrough with you, finalize the Certificate of Occupancy, and hand you the ceremonial keys along with our 15-year structural warranty.",
    telemetry: "Joint Homeowner Walkthrough · Certificate of Occupancy · 15-Year Structural Warranty",
    checklist: [
      "Complete tile works, paint, lighting, windows, cabinetry, and bathroom fixtures",
      "Detailed room-by-room quality walkthrough with the homeowner",
      "Full assistance in securing the official Certificate of Occupancy from the city",
      "Ceremonial house key turnover, complete as-built plans & 15-year warranty certificate",
    ],
    output: "Official Certificate of Occupancy, House Keys & 15-Year Structural Warranty",
  },
];

export default function ProcessPage() {
  const { getContent } = useCms();
  const { t } = useLanguage();

  // Dynamically pull CMS fields with instantaneous cross-tab synchronization
  const eyebrow = getContent("process", "steps", "processEyebrow", "Clear Step-by-Step Progress · Regular Updates");
  const mainHeading = getContent("process", "steps", "processHeading", "Our 4-Stage Construction Process");
  const mainDesc = getContent(
    "process",
    "steps",
    "processDescription",
    "We remove worries from building your home through clear step-by-step updates, weekly photo logs sent to your phone, and guaranteed quality materials. Here is how your dream home is built."
  );
  const heroMedia = getContent("process", "steps", "processHeroMedia", "");

  const stages = DEFAULT_STAGES.map((def, idx) => {
    const num = idx + 1;
    const badge = getContent("process", `stage${num}`, `step${num}_badge`, def.badge);
    const title = getContent("process", `stage${num}`, `step${num}_title`, def.title);
    const subtitle = getContent("process", `stage${num}`, `step${num}_subtitle`, def.subtitle);
    const desc = getContent("process", `stage${num}`, `step${num}_desc`, def.desc);
    const telemetry = getContent("process", `stage${num}`, `step${num}_telemetry`, def.telemetry);
    const checklistRaw = getContent("process", `stage${num}`, `step${num}_checklist`, "");
    const checklist = checklistRaw
      ? checklistRaw.split("\n").map((s) => s.replace(/^[*\-•\d.]+\s*/, "").trim()).filter(Boolean)
      : def.checklist;
    const output = getContent("process", `stage${num}`, `step${num}_output`, def.output);
    const media = getContent("process", `stage${num}`, `step${num}_media`, "");

    return {
      ...def,
      badge,
      title,
      subtitle,
      desc,
      telemetry,
      checklist,
      output,
      media,
    };
  });

  const pillars = [
    {
      icon: <ListChecksIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: getContent("process", "pillars", "pillar1_title", "Milestone-Based Payments"),
      desc: getContent("process", "pillars", "pillar1_desc", "You only pay for construction stages that are inspected, approved, and verified with photos."),
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: getContent("process", "pillars", "pillar2_title", "Direct In-House Materials"),
      desc: getContent("process", "pillars", "pillar2_desc", "Zero compromised materials. All steel bars and concrete aggregates come directly from our own verified logistics fleet."),
    },
    {
      icon: <SmartphoneIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: getContent("process", "pillars", "pillar3_title", "Live Portal Photo Logs"),
      desc: getContent("process", "pillars", "pillar3_desc", "Stay updated anywhere in the world with weekly high-resolution photo logs sent directly to your client portal."),
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 max-w-3xl">
              <div className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4 select-none">
                <span>{eyebrow}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white leading-[1.08]">
                {mainHeading.includes("Construction Process") ? (
                  <>
                    {mainHeading.replace("Construction Process", "").trim()} <br />
                    <span className="text-amber-600 dark:text-amber-400">Construction Process</span>
                  </>
                ) : (
                  mainHeading
                )}
              </h1>
              <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
                {mainDesc}
              </p>
            </div>

            {/* Optional Showcase Media Banner if uploaded in CMS */}
            {heroMedia && (
              <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-lg bg-black aspect-video relative">
                {/\.(mp4|webm|mov)$/i.test(heroMedia) ? (
                  <video src={heroMedia} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={heroMedia} alt="MCPA Process" className="w-full h-full object-cover" />
                )}
              </div>
            )}
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
                    {/* Optional Stage Illustration Media */}
                    {stg.media && (
                      <div className="mb-5 rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10 bg-black aspect-video relative">
                        {/\.(mp4|webm|mov)$/i.test(stg.media) ? (
                          <video src={stg.media} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={stg.media} alt={stg.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

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
