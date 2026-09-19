"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import {
  HomeIcon,
  BadgePercentIcon,
  FileSignatureIcon,
  WarehouseIcon,
  TruckIcon,
  HammerIcon,
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
} from "@/modules/shared/Icons";

export default function ServicesPage() {
  const services = [
    {
      id: "residential",
      badge: "Turnkey Master Build",
      icon: <HomeIcon className="w-8 h-8 text-amber-500" />,
      title: "Custom Residential Design & Build",
      subtitle: "Bespoke modern residences built for generations",
      description:
        "Full-cycle architectural conceptualization, structural engineering, and master construction. From minimalist modern Zen villas to multi-storey luxury estates, every home is engineered to withstand extreme typhoons and Philippine seismic conditions.",
      inclusions: [
        "Complete 3D photorealistic BIM modeling & interior pegs",
        "Engineered concrete foundation & Grade 60 high-tensile steel",
        "High-grade plumbing, electrical wiring & sanitary installations",
        "Full turnkey handover with 5-Year Structural Warranty",
      ],
      ctaText: "Inquire Residential Build",
    },
    {
      id: "bnpl",
      badge: "Flexible Financing",
      icon: <BadgePercentIcon className="w-8 h-8 text-amber-500" />,
      title: "Build Now, Pay Later Program",
      subtitle: "Financing built around your titled property",
      description:
        "An exclusive program designed for titled lot owners across Bulacan, Metro Manila, and Central Luzon. Start your construction immediately without waiting for full cash reserves, powered by flexible milestone billing and institutional loan assistance.",
      inclusions: [
        "Milestone-based progress billing with zero surprise costs",
        "Pag-IBIG Housing Loan end-to-end processing & documentation",
        "Major commercial bank loan packaging assistance",
        "Transparent digital escrow tracking per construction phase",
      ],
      ctaText: "Apply for BNPL",
    },
    {
      id: "signed-sealed",
      badge: "PRC Professional Compliance",
      icon: <FileSignatureIcon className="w-8 h-8 text-amber-500" />,
      title: "Signed & Sealed Plans & Permits",
      subtitle: "Full engineering blueprints ready for municipal approval",
      description:
        "Complete, fully certified architectural and engineering plans signed and sealed by licensed PRC Architects, Civil Engineers, Master Plumbers, and Electrical Engineers, backed by fast-tracked LGU permit facilitation.",
      inclusions: [
        "Architectural blueprints, site development plans & schedules",
        "Seismic Zone 4 structural design & soil analysis computations",
        "Electrical layout, load computations & auxiliary diagrams",
        "Bulacan & NCR LGU Building Permit submission assistance",
      ],
      ctaText: "Order Blueprint Package",
    },
    {
      id: "commercial",
      badge: "Industrial & Commercial",
      icon: <WarehouseIcon className="w-8 h-8 text-amber-500" />,
      title: "Commercial Buildings & Warehouses",
      subtitle: "High-span steel frameworks and logistics facilities",
      description:
        "Engineering high-efficiency commercial spaces, logistics hubs, retail commercial strips, and industrial warehouses with wide-span structural steel framing engineered for maximum operational floor space and heavy machinery loads.",
      inclusions: [
        "High-span structural steel trusses and wide-flange columns",
        "Reinforced heavy-duty concrete slab pouring for vehicle traffic",
        "Integrated fire protection, industrial ventilation & loading bays",
        "Strict corporate milestone scheduling with safety compliance",
      ],
      ctaText: "Inquire Commercial Space",
    },
    {
      id: "supply",
      badge: "Direct Supply Chain",
      icon: <TruckIcon className="w-8 h-8 text-amber-500" />,
      title: "In-House Wholesale Construction Supply",
      subtitle: "Wholesale aggregates, cement, and rebars on-site",
      description:
        "Cut out middlemen markups. As both contractor and direct materials distributor, MCPA delivers certified cement, PNS-tested Grade 60 steel rebars, and wholesale aggregates directly to project sites throughout Bulacan and neighboring provinces.",
      inclusions: [
        "Certified Grade 60 & Grade 40 high-tensile steel rebars",
        "Premium Portland and Pozzolan cement brands",
        "Washed sand, crushed gravel (G1, 3/4), and subbase aggregates",
        "Dedicated fleet of dump trucks for guaranteed on-time delivery",
      ],
      ctaText: "Request Supply Quotation",
    },
    {
      id: "renovation",
      badge: "Adaptive Transformation",
      icon: <HammerIcon className="w-8 h-8 text-amber-500" />,
      title: "Renovations & Structural Retrofitting",
      subtitle: "Revitalize and fortify existing structures",
      description:
        "Comprehensive residential extensions, modern facade upgrades, vertical second-floor additions, and commercial tenant fit-outs with rigorous structural integrity assessments before any wall is touched.",
      inclusions: [
        "Comprehensive structural load assessment & footing checking",
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
            <Link href="/" className="hover:text-amber-500 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Services</span>
          </nav>
        </div>

        {/* Page Hero Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              <span>Architectural Excellence · Direct Material Supply</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
              Services That <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Endure For Eras
              </span>
            </h1>
            <p className="mt-5 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
              MCPA Construction and Supply integrates licensed architectural engineering with an in-house wholesale supply chain. We eliminate contractor markups and deliver uncompromising structural integrity from foundation to key turnover.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight">
                Earthquake & Typhoon <span className="text-amber-500 font-semibold text-base sm:text-lg">Ready</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">
                Structural Resilience Standard
              </p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                Direct <span className="text-amber-500 font-semibold text-lg">Supply</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">
                In-House Cement & Steel
              </p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                100<span className="text-amber-500 font-semibold text-lg">%</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">
                PRC Signed & Sealed
              </p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                BNPL <span className="text-amber-500 font-semibold text-lg">Program</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">
                Titled Lot Financing
              </p>
            </div>
          </div>
        </div>

        {/* Comprehensive Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="group relative overflow-hidden rounded-3xl p-8 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1.5 backdrop-blur-sm"
              >
                {/* Accent top gradient line on hover */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div>
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 group-hover:scale-110 transition-transform">
                      {svc.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-[10px] uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300">
                      {svc.badge}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                    {svc.title}
                  </h2>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400/90 mt-1 mb-4">
                    {svc.subtitle}
                  </p>

                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal mb-6">
                    {svc.description}
                  </p>

                  {/* Feature Inclusions Checklist */}
                  <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                      Key Deliverables:
                    </p>
                    {svc.inclusions.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <CheckIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80">
                  <Link
                    href="/book"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-amber-500 dark:hover:bg-amber-500 text-white hover:text-neutral-950 font-semibold text-xs uppercase tracking-wider transition-all duration-200 group-hover:shadow-md"
                  >
                    <span>{svc.ctaText}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The MCPA Advantage Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white border border-neutral-800 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl relative z-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Why MCPA Services Stand Out
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                No Contractor Markups. No Compromised Blueprints.
              </h3>
              <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
                Traditional contractors purchase materials from third-party hardware stores at retail prices, passing high markup costs onto the client. Because MCPA operates its own dedicated wholesale supply distribution, you receive certified materials at plant wholesale rates with strict quality control.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
                >
                  <span>Book a Consultation</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-neutral-700 hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
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
