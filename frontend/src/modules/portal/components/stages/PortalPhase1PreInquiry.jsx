"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
  FolderKanban,
  User,
  Sparkles,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Home,
  BadgePercent,
  FileSignature,
  Warehouse,
  Truck,
  Hammer,
  HardHat,
  ListChecks,
  Key,
} from "lucide-react";
import ProjectCard from "@/modules/home/components/ProjectCard";
import ProjectDetailsModal from "@/modules/home/components/ProjectDetailsModal";
import { deduplicateProjects } from "@/modules/shared/projectsHelper";

export default function PortalPhase1PreInquiry({
  currentUser,
  dashboardState,
  onStartInquiry,
  onRequestMultiProject,
  isMultiProjectBlocked = false,
  onSelectTab,
  inquiries = [],
  mode = "overview",
}) {
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const rejectedInfo = useMemo(() => {
    if (dashboardState?.hasRejectedInquiry && dashboardState?.rejectedBrief) {
      return dashboardState.rejectedBrief;
    }
    const rejectedInq = (inquiries || []).find((inq) => {
      const s = (inq.status || "").toLowerCase();
      return inq.is_rejected || s.includes("reject") || s.includes("decline") || s.includes("discontinue") || s.includes("withdrawn");
    });
    if (rejectedInq) {
      return {
        projectType: rejectedInq.project_type || rejectedInq.projectType || "Residential Construction",
        rejectionReason: rejectedInq.rejection_reason || rejectedInq.rejectionReason || "Consultation concluded without proceeding",
        rejectionNotes: rejectedInq.rejection_notes || rejectedInq.rejectionNotes || null,
        status: rejectedInq.status,
      };
    }
    return null;
  }, [dashboardState, inquiries]);

  // Fetch real portfolio from DB (No dummy data!)
  useEffect(() => {
    let isMounted = true;
    async function fetchProjects() {
      setIsLoadingPortfolio(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.projects)) {
          const formatted = data.projects
            .filter((p) => p.is_web_visible !== false)
            .map((p) => ({
              id: p.project_id || p.id,
              name: p.name,
              location: p.location,
              year: p.year,
              month: p.month,
              category: p.category,
              status: p.status || "completed",
              description: p.description,
              images:
                Array.isArray(p.images) && p.images.length > 0
                  ? p.images
                  : ["/assets/images/hero-bg.jpg"],
              isAdminAdded: Boolean(p.is_admin_added),
              isWebVisible: p.is_web_visible !== false,
              featuredOnHome: Boolean(p.featured_on_home),
              lotArea: p.lot_area,
              floorArea: p.floor_area,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              features: p.features || [],
              architecturalDetails: p.architectural_details,
            }));
          setPortfolioProjects(deduplicateProjects(formatted));
        }
      } catch (err) {
        console.error("Failed to load portfolio showcase:", err);
      } finally {
        if (isMounted) setIsLoadingPortfolio(false);
      }
    }
    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const latestInquiry = inquiries?.[0];

  const baseCategories = ["All", "Residential", "Commercial", "Luxury Villa", "Modern Zen"];
  const categories = Array.from(
    new Set([
      ...baseCategories,
      ...portfolioProjects.map((p) => p.category).filter(Boolean),
    ])
  );

  const displayProjects = (() => {
    if (activeCategory === "All") return portfolioProjects;
    return portfolioProjects.filter(
      (p) =>
        p.category?.toLowerCase() === activeCategory.toLowerCase() ||
        (activeCategory === "Residential" && p.category?.toLowerCase().includes("residential"))
    );
  })();

  // ---------------------------------------------------------------------------
  // MCPA SERVICES DATA (Exact match to /services UI/UX)
  // ---------------------------------------------------------------------------
  const servicesList = [
    {
      id: "residential",
      badge: "Complete Turnkey Build",
      icon: <Home className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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
      icon: <BadgePercent className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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
      icon: <FileSignature className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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
      icon: <Warehouse className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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
      icon: <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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
      icon: <Hammer className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />,
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

  // ---------------------------------------------------------------------------
  // MCPA PROCESS DATA (Exact match to /process UI/UX)
  // ---------------------------------------------------------------------------
  const processStages = [
    {
      step: "01",
      badge: "Phase 1: Initial Planning & Site Visit",
      icon: <Compass className="w-5 h-5 text-amber-500" />,
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
      icon: <FileSignature className="w-5 h-5 text-amber-500" />,
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
      icon: <HardHat className="w-5 h-5 text-amber-500" />,
      title: "Solid Construction & Quality Materials",
      subtitle: "Built with tested concrete, steel, and regular photo updates",
      desc: "We build your home strong from the ground up. Using our dedicated supply of certified high-grade steel and strong concrete, every stage is documented with photo updates.",
      telemetry: "Dedicated Fleet Logistics · In-House Steel & Concrete Supply",
      checklist: [
        "Deep foundation excavation and reinforced concrete footing pouring",
        "Certified structural steel tying and column framing",
        "Reinforced slab pouring with slump-tested concrete",
        "Regular photo logs showing weekly construction progress",
      ],
      output: "Finished Solid House Shell & Engineering Inspection Sign-off",
    },
    {
      step: "04",
      badge: "Phase 4: Finishing & Interior Detailing",
      icon: <Building className="w-5 h-5 text-amber-500" />,
      title: "Premium Finishing & Interior Detailing",
      subtitle: "Clean masonry, smooth plastering & quality fixtures",
      desc: "We bring your house to life with clean masonry, premium tile work, secure windows, and durable roofing. Every detail is installed carefully by skilled craftsmen.",
      telemetry: "Quality Handover Checks · Electrical & Plumbing Pressure Testing",
      checklist: [
        "Clean plastering and weather-proof exterior painting",
        "Premium floor and wall tile installation in bathrooms and living areas",
        "Heavy-duty long-span roofing with heat insulation and gutters",
        "Pressure testing for water pipes and circuit safety checks for electricals",
      ],
      output: "Complete Interior & Exterior Finishes Ready for Client Inspection",
    },
    {
      step: "05",
      badge: "Phase 5: Turnover & Long-term Protection",
      icon: <Key className="w-5 h-5 text-amber-500" />,
      title: "Final Inspection, Handover & 15-Year Warranty",
      subtitle: "Official key handover with complete certificate protection",
      desc: "Before you move in, our project engineers conduct a thorough 120-point walkthrough to inspect every switch, faucet, and door. We officially hand over your new house keys backed by our 15-Year Structural Warranty.",
      telemetry: "120-Point Inspection Walkthrough · 15-Year Structural Warranty Certificate",
      checklist: [
        "Full client walkthrough with zero-punchlist check",
        "Official occupancy permit clearance documentation",
        "Formal turnover ceremony and house keys handover",
        "Official 15-Year Structural Warranty Certificate issued",
      ],
      output: "Official House Keys & Complete Structural Warranty Certificate",
    },
  ];

  // ---------------------------------------------------------------------------
  // VIEW: DEDICATED SERVICES TAB (When portalTab === "services")
  // ---------------------------------------------------------------------------
  if (mode === "services") {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1 select-none">
              <span>MCPA Services · Design &amp; Build Excellence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
              Services That Endure For Eras
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              MCPA Construction and Supply integrates licensed architectural design, structural engineering, and our own dedicated materials fleet. We eliminate third-party hardware markups and ensure guaranteed structural resilience from foundation to key handover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab("overview")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onStartInquiry}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Start Inquiry</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-200 dark:bg-white/[0.08] rounded-[8px] overflow-hidden border border-neutral-200 dark:border-white/[0.08]">
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              Earthquake &amp; Typhoon <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">Ready</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
              Structural Resilience
            </p>
          </div>
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              Direct <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">Supply</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
              In-House Steel Fleet
            </p>
          </div>
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              100<span className="text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">%</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
              PRC Signed &amp; Sealed
            </p>
          </div>
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1117] flex flex-col justify-between">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              BNPL <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">Program</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono uppercase tracking-[0.12em]">
              Titled Lot Financing
            </p>
          </div>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((svc) => (
            <div
              key={svc.id}
              className="group relative rounded-[10px] p-6 sm:p-7 bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-[border-color,box-shadow] duration-200 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <div>
                {/* Clean Icon (Pure SVG, No Box) & Technical Badge */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="text-amber-600 dark:text-amber-400 shrink-0">
                    {svc.icon}
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-[9.5px] font-mono uppercase tracking-[0.14em] font-semibold text-neutral-600 dark:text-neutral-300">
                    {svc.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150">
                  {svc.title}
                </h2>
                <p className="text-xs font-mono font-medium text-amber-700 dark:text-amber-400/90 mt-1 mb-3">
                  {svc.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal mb-5">
                  {svc.description}
                </p>

                {/* Inclusions */}
                <div className="border-t border-neutral-100 dark:border-white/[0.06] pt-4 mb-5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 block mb-2.5">
                    Scope &amp; Engineering Deliverables:
                  </span>
                  <ul className="space-y-2">
                    {svc.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onStartInquiry}
                className="w-full mt-2 py-2.5 px-4 rounded-[6px] bg-neutral-100 dark:bg-white/[0.04] hover:bg-amber-500 hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
              >
                <span>{svc.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: DEDICATED PROCESS TAB (When portalTab === "process")
  // ---------------------------------------------------------------------------
  if (mode === "process") {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1 select-none">
              <span>Construction Process · Turnkey Roadmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
              How MCPA Builds Your Sanctuary
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              From initial boundary verification and structural design to concrete framing, interior craftsmanship, and official 15-year warranty handover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab("overview")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onStartInquiry}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Start Inquiry</span>
            </button>
          </div>
        </div>

        {/* 5 Stages Process Cards */}
        <div className="space-y-6">
          {processStages.map((stage) => (
            <div
              key={stage.step}
              className="rounded-[10px] p-6 sm:p-8 bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 transition-colors shadow-sm space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono text-amber-500">
                    {stage.step}
                  </span>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 font-bold">
                      {stage.badge}
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {stage.title}
                    </h2>
                  </div>
                </div>
                <div className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                  {stage.telemetry}
                </div>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                {stage.desc}
              </p>

              {/* Checklist & Output Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-8 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold block">
                    Execution Milestones &amp; Checks:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stage.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-1 font-mono flex flex-col justify-center">
                  <span className="text-[9.5px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                    Official Milestone Output:
                  </span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {stage.output}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="p-8 sm:p-10 rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 text-center space-y-4 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Ready to start Phase 1 for your titled property?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
            Submit your initial lot coordinates and target architectural parameters to begin with site inspection and preliminary floor planning.
          </p>
          <button
            type="button"
            onClick={onStartInquiry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Start Project Inquiry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: DEDICATED PORTFOLIO TAB (When portalTab === "portfolio")
  // ---------------------------------------------------------------------------
  if (mode === "portfolio") {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1 select-none">
              <span>Architectural Catalog · Master Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
              Built to Perfection
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
              Authentic completed projects delivered across the Philippines. Click any project to inspect photo galleries, floor plans, and architectural specifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab("overview")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onStartInquiry}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Start Inquiry</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-[6px] text-xs font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-neutral-950 shadow-sm"
                    : "bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-amber-500/40"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Project Cards Grid (Exact Home & Projects Page Architecture) */}
        {isLoadingPortfolio ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-h-[460px] rounded-[10px] bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="p-16 text-center rounded-[10px] border border-dashed border-neutral-300 dark:border-neutral-800 text-xs font-mono text-neutral-400">
            No projects found matching the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {displayProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenDetails={(p) => setSelectedProjectForModal(p)}
                onInquire={(p) => onStartInquiry && onStartInquiry(p)}
              />
            ))}
          </div>
        )}

        {/* Architectural Details Modal */}
        {selectedProjectForModal && (
          <ProjectDetailsModal
            project={selectedProjectForModal}
            isOpen={Boolean(selectedProjectForModal)}
            onClose={() => setSelectedProjectForModal(null)}
            onInquire={(proj) => {
              setSelectedProjectForModal(null);
              if (onStartInquiry) onStartInquiry(proj);
            }}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: STAGE 1 EXECUTIVE DASHBOARD (When portalTab === "overview")
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 0. DISCONTINUED / REJECTED CONSULTATION NOTICE BANNER */}
      {rejectedInfo && (
        <div className="p-5 sm:p-6 rounded-[16px] bg-rose-500/[0.08] dark:bg-rose-500/[0.12] border border-rose-500/30 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <span>Previous Consultation Concluded</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono">
                    Phase 1 (Pre-Inquiry) Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed">
                  Your previous consultation for <strong>{rejectedInfo.projectType || "Residential Construction"}</strong> was closed.
                  {rejectedInfo.rejectionReason && (
                    <span className="block text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Reason: <strong className="text-neutral-900 dark:text-white">{rejectedInfo.rejectionReason}</strong>
                      {rejectedInfo.rejectionNotes ? ` — ${rejectedInfo.rejectionNotes}` : ""}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                  You are always welcome to start a new project consultation whenever your timeline or requirements are ready.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartInquiry}
              className="px-5 py-2.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Submit New Inquiry</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO ONBOARDING SECTION */}
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-10 shadow-xs dark:shadow-none space-y-6 transition-colors">
        {/* Subtle decorative architectural glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MCPA Official Vector Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/assets/mcpa-logo.svg"
            alt="MCPA Architectural Design & Construction"
            width={180}
            height={46}
            unoptimized
            className="block dark:hidden object-contain h-9 sm:h-10 w-auto"
            priority
          />
          <Image
            src="/assets/logo-white.svg"
            alt="MCPA Architectural Design & Construction"
            width={180}
            height={46}
            unoptimized
            className="hidden dark:block object-contain h-9 sm:h-10 w-auto"
            priority
          />
        </div>

        {/* Heading & Welcome Copy */}
        <div className="relative z-10 max-w-3xl space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono uppercase leading-tight">
            Ready to Build Your Architectural Vision?
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl">
            Welcome, <span className="font-bold text-amber-600 dark:text-amber-400">{currentUser?.fullName || currentUser?.full_name || "Valued Client"}</span>. 
            Your client portal tracks your construction project from concept blueprints down to actual turnkey handover. To initiate your project timeline, submit your verified architectural inquiry below.
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-2 flex flex-wrap items-center gap-4">
          {isMultiProjectBlocked ? (
            <button
              type="button"
              onClick={onRequestMultiProject}
              className="px-6 py-3.5 rounded-[6px] bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Request Multi-Project Approval
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartInquiry}
              className="px-6 py-3.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Start Your Project Inquiry
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. STAGE 1 EXECUTIVE DASHBOARD SUMMARY CARDS (NO BACKGROUND ON ICONS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold">
            Stage 1 Portal Summary &amp; Navigation Quick Actions
          </span>
          <span className="text-[10px] font-mono text-amber-500 font-semibold">
            Phase 1 of 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Summary Card 1: Inquiries Pipeline */}
          <div
            onClick={() => onSelectTab && onSelectTab("inquiries")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              {/* Clean Icon Without Colored Box Background */}
              <div className="text-amber-500">
                <FolderKanban className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                inquiries.length > 0 ? "text-emerald-500" : "text-neutral-400 dark:text-neutral-500"
              }`}>
                {inquiries.length > 0 ? `${inquiries.length} Brief Active` : "Awaiting Brief"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Inquiries Pipeline</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {latestInquiry
                  ? (latestInquiry.project_type || "Residential Build")
                  : "Start Your First Submission"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {latestInquiry
                  ? `Status: ${latestInquiry.status || "Pending Review"} · Ref: ${latestInquiry.submission_id || "Active"}`
                  : "Submit your architectural parameters, lot coordinates, and target budget."}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Inquiries Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Summary Card 2: Portfolio Showcase */}
          <div
            onClick={() => onSelectTab && onSelectTab("portfolio")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              {/* Clean Icon Without Colored Box Background */}
              <div className="text-purple-500">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-purple-500 dark:text-purple-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {portfolioProjects.length} Showcase Works
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Design Portfolio</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Architectural Catalog
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Browse authentic built houses across Contemporary, Modern Tropical, and Minimalist styles.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Explore Design Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Summary Card 3: Account & Client Profile */}
          <div
            onClick={() => onSelectTab && onSelectTab("profile")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              {/* Clean Icon Without Colored Box Background */}
              <div className="text-sky-500">
                <User className="w-6 h-6" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                Verified Client
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Client Profile</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {currentUser?.fullName || currentUser?.full_name || "Valued Client"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {currentUser?.email || "Account Secured"} · Identity verified and ready for construction scoping.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Client Profile</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SHOWCASE GALLERY (USING EXACT HOME & PROJECT PAGE PROJECTCARD ARCHITECTURE) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold font-mono text-neutral-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              Completed MCPA Showcase Works
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Authentic completed projects delivered across the Philippines. Fetched live from our master portfolio.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            {portfolioProjects.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab("portfolio")}
                className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Catalog ({portfolioProjects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoadingPortfolio ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-h-[460px] rounded-[10px] bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : portfolioProjects.length === 0 ? (
          <div className="p-12 text-center rounded-[8px] border border-dashed border-neutral-300 dark:border-neutral-800 text-xs font-mono text-neutral-400">
            No portfolio projects published yet in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {portfolioProjects.slice(0, 6).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenDetails={(p) => setSelectedProjectForModal(p)}
                onInquire={(p) => onStartInquiry && onStartInquiry(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. COMPANY SHOWCASE QUICK JUMP STRIP (EXPLORE SERVICES & PROCESS) */}
      <div className="rounded-[16px] p-6 bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <span>Explore Company Capabilities</span>
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Discover Our Comprehensive Services &amp; 5-Step Construction Process
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Learn more about our in-house materials fleet, BNPL titled lot financing, and milestone engineering checklists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("services")}
            className="px-4 py-2 rounded-[6px] border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 bg-neutral-50 dark:bg-white/[0.03] text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Hammer className="w-3.5 h-3.5 text-amber-500" />
            <span>View Services</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("process")}
            className="px-4 py-2 rounded-[6px] border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 bg-neutral-50 dark:bg-white/[0.03] text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ListChecks className="w-3.5 h-3.5 text-amber-500" />
            <span>View Process</span>
          </button>
        </div>
      </div>

      {/* Architectural Details Modal */}
      {selectedProjectForModal && (
        <ProjectDetailsModal
          project={selectedProjectForModal}
          isOpen={Boolean(selectedProjectForModal)}
          onClose={() => setSelectedProjectForModal(null)}
          onInquire={(proj) => {
            setSelectedProjectForModal(null);
            if (onStartInquiry) onStartInquiry(proj);
          }}
        />
      )}
    </div>
  );
}
