"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import {
  HomeIcon,
  BadgePercentIcon,
  FileSignatureIcon,
  WarehouseIcon,
  TruckIcon,
  HammerIcon,
  ArrowRightIcon,
} from "@/modules/shared/Icons";

export default function ServicesPage() {
  const services = [
    {
      id: "residential",
      badge: "Complete Turnkey Build",
      icon: <HomeIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Custom Residential Design & Build",
      subtitle: "Custom family homes built to last for generations",
      description:
        "From initial floor plans to final key handover, we handle your entire build. Whether you envision a modern single-storey home or a multi-storey family residence, every home is built strong to withstand heavy typhoons and earthquakes.",
      inclusions: [
        "3D realistic color views & floor plan designs",
        "Solid concrete foundation & certified heavy-duty steel bars",
        "High-grade plumbing, electrical wiring & sanitary installations",
        "Full house handover with a 15-Year Structural Warranty",
      ],
      ctaText: "Inquire Residential Build",
    },
    {
      id: "bnpl",
      badge: "Flexible Payment Options",
      icon: <BadgePercentIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Build Now, Pay Later Program",
      subtitle: "Financing built around your titled property",
      description:
        "An exclusive program for lot owners across Bulacan, Metro Manila, and Central Luzon. Start building your home without waiting for full cash upfront, backed by flexible step-by-step payments and loan guidance.",
      inclusions: [
        "Step-by-step progress billing with zero surprise costs",
        "Pag-IBIG Housing Loan end-to-end processing & documentation",
        "Major commercial bank loan packaging assistance",
        "Transparent milestone billing so you only pay as each stage is done",
      ],
      ctaText: "Apply for BNPL",
    },
    {
      id: "signed-sealed",
      badge: "Licensed Architects & Engineers",
      icon: <FileSignatureIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Signed & Sealed Plans & Permits",
      subtitle: "Full engineering blueprints ready for municipal approval",
      description:
        "Complete, fully certified architectural and engineering plans signed and sealed by licensed Architects, Civil Engineers, Master Plumbers, and Electrical Engineers, backed by full assistance in securing city building permits.",
      inclusions: [
        "Architectural blueprints, site plans & room layouts",
        "Earthquake-tested structural plan & soil condition analysis",
        "Electrical wiring layout, load computations & plumbing diagrams",
        "Bulacan & NCR LGU Building Permit submission assistance",
      ],
      ctaText: "Order Blueprint Package",
    },
    {
      id: "commercial",
      badge: "Commercial & Warehouses",
      icon: <WarehouseIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Commercial Buildings & Warehouses",
      subtitle: "Spacious steel buildings and commercial rental spaces",
      description:
        "We construct durable commercial spaces, logistics buildings, retail units, and storage warehouses built with strong structural steel framing for wide open floor space and heavy daily use.",
      inclusions: [
        "Heavy-duty structural steel framing and wide columns",
        "Reinforced heavy-duty concrete slab pouring for vehicle traffic",
        "Integrated fire protection, industrial ventilation & loading bays",
        "Clear project milestone scheduling with on-site safety standards",
      ],
      ctaText: "Inquire Commercial Space",
    },
    {
      id: "supply",
      badge: "In-House Materials & Supply",
      icon: <TruckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "In-House Project Materials & Supply",
      subtitle: "Materials dedicated exclusively to our own construction builds",
      description:
        "Zero retail markups and zero site delays. MCPA is not an open retail hardware store — our direct materials supply and logistics fleet are dedicated exclusively to our own construction and design-and-build projects. We test, prepare, and transport certified steel rebars, structural concrete, and aggregates directly to your build site.",
      inclusions: [
        "Certified heavy-duty steel rebars tested for strength",
        "Tested ready-mix structural concrete for strong foundations",
        "Quality-screened clean washed sand, crushed gravel, and base aggregates",
        "Dedicated fleet of dump trucks ensuring zero project delivery delays",
      ],
      ctaText: "Inquire Design & Build",
    },
    {
      id: "renovation",
      badge: "Home Renovations & Upgrades",
      icon: <HammerIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
      title: "Renovations & Home Extensions",
      subtitle: "Refresh, expand, and strengthen existing homes",
      description:
        "Complete residential extensions, modern exterior upgrades, vertical second-floor additions, and commercial tenant fit-outs with careful structural checks before any work begins.",
      inclusions: [
        "Thorough structural check of existing posts and foundations",
        "Second-floor vertical expansions & roof deck conversions",
        "Modern architectural cladding, glass railings & lighting updates",
        "Complete plumbing and electrical re-piping & rewiring",
      ],
      ctaText: "Plan Renovation",
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
            <span className="text-amber-600 dark:text-amber-400 font-bold">Services</span>
          </nav>
        </div>

        {/* Page Hero Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4 select-none">
              <span>Design &amp; Build Excellence · Dedicated In-House Supply</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white leading-[1.08]">
              Services That <br />
              <span className="text-amber-600 dark:text-amber-400">
                Endure For Eras
              </span>
            </h1>
            <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
              MCPA Construction and Supply integrates licensed architectural design, structural engineering, and our own dedicated materials fleet. We eliminate third-party hardware markups and ensure guaranteed structural resilience from foundation to key handover.
            </p>
          </div>

          {/* Quick Metrics Strip — Architectural Data Table */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-200 dark:bg-white/[0.08] rounded-[6px] overflow-hidden border border-neutral-200 dark:border-white/[0.08]">
            <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                <span>Earthquake &amp; Typhoon</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm sm:text-base">Ready</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
                Structural Resilience Standard
              </p>
            </div>
            <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                <span>Direct</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-base sm:text-lg">Supply</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
                In-House Cement &amp; Steel
              </p>
            </div>
            <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
              <div className="flex flex-wrap items-baseline gap-x-0.5 text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                <span>100</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-base sm:text-lg">%</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
                PRC Signed &amp; Sealed
              </p>
            </div>
            <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                <span>BNPL</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-base sm:text-lg">Program</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
                Titled Lot Financing
              </p>
            </div>
          </div>
        </div>

        {/* Comprehensive Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="group relative rounded-[6px] p-7 sm:p-8 bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-[border-color,box-shadow] duration-150 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
              >
                <div>
                  {/* Icon (Pure SVG, No Box) & Technical Badge */}
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="text-amber-600 dark:text-amber-400 shrink-0">
                      {svc.icon}
                    </div>
                    <span className="px-2 py-0.5 rounded-[4px] bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-[9.5px] font-mono uppercase tracking-[0.14em] font-semibold text-neutral-600 dark:text-neutral-300">
                      {svc.badge}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150">
                    {svc.title}
                  </h2>
                  <p className="text-xs font-mono font-medium text-amber-700 dark:text-amber-400/90 mt-1.5 mb-4">
                    {svc.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal mb-6">
                    {svc.description}
                  </p>

                  {/* Feature Inclusions / Deliverables Schedule */}
                  <div className="pt-4 border-t border-neutral-150 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 select-none">
                        Key Deliverables
                      </p>
                      <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        Standard Scope
                      </span>
                    </div>
                    <div className="space-y-2">
                      {svc.inclusions.map((inc, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                          <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 shrink-0 select-none">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="leading-snug">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="mt-8 pt-5 border-t border-neutral-150 dark:border-white/[0.06]">
                  <Link
                    href={`/book?service=${encodeURIComponent(svc.id)}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-[4px] bg-neutral-900 dark:bg-neutral-800 hover:bg-amber-500 dark:hover:bg-amber-500 text-white hover:text-neutral-950 font-bold text-xs uppercase tracking-[0.08em] transition-colors duration-150 cursor-pointer"
                  >
                    <span>{svc.ctaText}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The MCPA Advantage Architectural Block */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="architectural-cta-card rounded-[6px] p-8 sm:p-12 bg-white dark:bg-[#10121a] border border-neutral-200/90 dark:border-white/[0.12] relative overflow-hidden transition-all duration-300">
            {/* Architectural left reference datum */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

            <div className="max-w-3xl relative z-10 pl-2 sm:pl-3">
              <div className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-4 select-none">
                <span>The MCPA Advantage</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white leading-tight">
                No Contractor Markups. No Compromised Blueprints.
              </h3>
              <p className="mt-4 text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed font-normal">
                Traditional contractors purchase materials from third-party hardware stores at retail prices, passing high markup costs and delivery delays onto the client. Because MCPA operates its own dedicated in-house supply and logistics fleet exclusively for our construction projects, your build receives certified, batch-tested materials directly on-site — guaranteeing authentic structural quality with zero middleman markups.
              </p>

              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-[0.08em] transition-colors shadow-[0_2px_8px_rgba(245,158,11,0.25)] cursor-pointer"
                >
                  <span>Book a Consultation</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-[4px] border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white text-xs font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
                >
                  <span>Explore Completed Projects</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
