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
  Calculator,
  Calendar,
  Clock,
  Video,
  MapPin,
  Share2,
  Copy,
  ChevronRight,
  PhoneCall,
} from "lucide-react";
import ProjectCard from "@/modules/home/components/ProjectCard";
import ProjectDetailsModal from "@/modules/home/components/ProjectDetailsModal";
import { deduplicateProjects } from "@/modules/shared/projectsHelper";
import { extractRoomCode, buildMeetingUrl } from "@/modules/portal/utils/roomCodeHelper";
import GoogleMeetRoom from "../GoogleMeetRoom";

/**
 * Interactive Dream Home Cost & Feasibility Calculator Widget
 */
function DreamHomeCostCalculator({ onApplyEstimate }) {
  const [lotArea, setLotArea] = useState(120);
  const [storeys, setStoreys] = useState(2);
  const [finishGrade, setFinishGrade] = useState("elegant"); // "standard" | "elegant" | "luxury"
  const [location, setLocation] = useState("Bulacan");

  // Approximate floor area based on standard 65-75% lot coverage ratio
  const estimatedFloorArea = useMemo(() => {
    if (storeys === 1) return Math.round(lotArea * 0.7);
    if (storeys === 2) return Math.round(lotArea * 1.15);
    return Math.round(lotArea * 1.6);
  }, [lotArea, storeys]);

  // Rate per sqm
  const ratePerSqm = useMemo(() => {
    if (finishGrade === "standard") return 25000;
    if (finishGrade === "elegant") return 32000;
    return 42000;
  }, [finishGrade]);

  const estimatedTotalCost = useMemo(() => {
    return estimatedFloorArea * ratePerSqm;
  }, [estimatedFloorArea, ratePerSqm]);

  const estimatedDurationMonths = useMemo(() => {
    if (storeys === 1) return "5 - 6 Months";
    if (storeys === 2) return "6 - 8 Months";
    return "8 - 10 Months";
  }, [storeys]);

  // Pag-IBIG 20-year loan estimate (approx ~₱7,300 per ₱1M borrowed at 6.25% fixed)
  const estimatedMonthlyAmortization = useMemo(() => {
    const loanableAmount = estimatedTotalCost * 0.8; // 80% loanable
    return Math.round((loanableAmount / 1000000) * 7300);
  }, [estimatedTotalCost]);

  const formatPHP = (val) =>
    "₱" + Number(val).toLocaleString("en-PH", { maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-[#12141c] to-neutral-950 text-white border border-amber-500/30 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Calculator className="w-4 h-4" />
            <span>Interactive Feasibility Tool</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
            Dream Home Cost &amp; Amortization Calculator
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Estimate preliminary structural budget, floor area, and Pag-IBIG financing for your titled property.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-semibold shrink-0">
          2026 Turnkey Scopes
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (8 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Lot Area Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300 uppercase font-semibold">Titled Lot Area:</span>
              <span className="text-amber-400 font-bold text-sm">{lotArea} sq.m.</span>
            </div>
            <input
              type="range"
              min="60"
              max="400"
              step="10"
              value={lotArea}
              onChange={(e) => setLotArea(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>60 sq.m.</span>
              <span>200 sq.m.</span>
              <span>400 sq.m.</span>
            </div>
          </div>

          {/* 2. Storeys Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
              Number of Storeys:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 1, label: "1-Storey Bungalow" },
                { count: 2, label: "2-Storey Modern" },
                { count: 3, label: "3-Storey Executive" },
              ].map((s) => (
                <button
                  key={s.count}
                  type="button"
                  onClick={() => setStoreys(s.count)}
                  className={`p-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-center border ${
                    storeys === s.count
                      ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md"
                      : "bg-white/[0.04] text-neutral-300 border-white/10 hover:border-amber-500/40"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Finishing Quality */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
              Finishing Grade:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "standard", name: "Standard Turnkey", price: "₱25k/sqm", desc: "Solid concrete, steel roof, ceramic tiles" },
                { id: "elegant", name: "Elegant / Modern", price: "₱32k/sqm", desc: "Porcelain tiles, cove lighting, modular kitchen" },
                { id: "luxury", name: "High-End Luxury", price: "₱42k/sqm", desc: "High ceiling, quartz counters, smart provisions" },
              ].map((g) => (
                <div
                  key={g.id}
                  onClick={() => setFinishGrade(g.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    finishGrade === g.id
                      ? "bg-amber-500/15 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50"
                      : "bg-white/[0.03] border-white/10 text-neutral-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold text-white">{g.name}</div>
                  <div className="text-amber-400 font-mono text-[11px] font-bold mt-0.5">{g.price}</div>
                  <div className="text-[10px] text-neutral-400 mt-1 line-clamp-2">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Output Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-950/80 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Calculated Feasibility Metrics
            </span>

            <div>
              <div className="text-xs font-mono text-neutral-400">ESTIMATED TOTAL BUDGET:</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
                {formatPHP(estimatedTotalCost)}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Approx. {estimatedFloorArea} sq.m. Total Usable Floor Area
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono text-xs">
              <div>
                <span className="text-neutral-500 text-[10px] block">BUILD DURATION:</span>
                <span className="font-bold text-white">{estimatedDurationMonths}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">EST. PAG-IBIG / MO:</span>
                <span className="font-bold text-emerald-400">{formatPHP(estimatedMonthlyAmortization)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-sans leading-relaxed">
              💡 Zero hidden costs: Includes structural engineering blueprints, building permit processing, and 15-Year Structural Warranty.
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onApplyEstimate({
                lotArea,
                storeys,
                finishGrade,
                estimatedFloorArea,
                estimatedTotalCost,
              })
            }
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
          >
            <Compass className="w-4 h-4" />
            <span>Lock Estimate &amp; Start Inquiry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // WebRTC in-portal call state
  const [activeCallRoomCode, setActiveCallRoomCode] = useState(null);
  const [hasCopiedRoomLink, setHasCopiedRoomLink] = useState(false);

  // Identify rejected brief if any
  const rejectedInfo = useMemo(() => {
    if (dashboardState?.hasRejectedInquiry && dashboardState?.rejectedBrief) {
      return dashboardState.rejectedBrief;
    }
    const rejectedInq = (inquiries || []).find((inq) => {
      const s = (inq.status || "").toLowerCase();
      return (
        inq.is_rejected ||
        s.includes("reject") ||
        s.includes("decline") ||
        s.includes("discontinue") ||
        s.includes("withdrawn")
      );
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

  // Identify active non-rejected inquiry (State 1B)
  const activeInquiry = useMemo(() => {
    return (inquiries || []).find((inq) => {
      const s = (inq.status || "").toLowerCase();
      const isRejected =
        inq.is_rejected ||
        s.includes("reject") ||
        s.includes("decline") ||
        s.includes("discontinue") ||
        s.includes("withdrawn");
      return !isRejected;
    });
  }, [inquiries]);

  const activeRoomCode = useMemo(() => {
    if (!activeInquiry) return null;
    return extractRoomCode(activeInquiry);
  }, [activeInquiry]);

  // Fetch real portfolio from DB
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

  const handleCopyMeetingLink = (code) => {
    const url = buildMeetingUrl(code);
    navigator.clipboard?.writeText(url);
    setHasCopiedRoomLink(true);
    setTimeout(() => setHasCopiedRoomLink(false), 2500);
  };

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
  // VIEW A: DEDICATED PORTFOLIO SHOWCASE TAB (When mode === "portfolio")
  // ---------------------------------------------------------------------------
  if (mode === "portfolio") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Building className="w-4 h-4" />
              <span>Stage 1 Showcase · Master Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono uppercase text-neutral-900 dark:text-white">
              Completed MCPA Architectural Works
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
              Explore our verified residential, commercial, and custom villa builds across Bulacan and Central Luzon. Click any project to inspect specifications or use it as a baseline for your inquiry.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartInquiry}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Start Project Inquiry</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeCategory === cat
                  ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-sm"
                  : "bg-white dark:bg-[#101218] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:border-amber-500/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoadingPortfolio ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-h-[460px] rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 text-xs font-mono text-neutral-400">
            No portfolio projects found under category &ldquo;{activeCategory}&rdquo;.
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
  // VIEW B: DEDICATED SERVICES CAPABILITIES TAB (When mode === "services")
  // ---------------------------------------------------------------------------
  if (mode === "services") {
    const servicesList = [
      {
        icon: Compass,
        title: "Architectural Design & 3D Visualization",
        badge: "Stage 1–2",
        desc: "Complete signed and sealed architectural, structural, electrical, and sanitary engineering blueprints tailored to your lot orientation and lifestyle.",
      },
      {
        icon: FileSignature,
        title: "LGU Building Permit & OBO Processing",
        badge: "Stage 2",
        desc: "End-to-end handling of Barangay Clearance, Locational Clearance, Fire Safety Evaluation (FSEC), and Municipal Building Permits.",
      },
      {
        icon: BadgePercent,
        title: "Pag-IBIG HDMF & Bank Construction Financing",
        badge: "Flexible Terms",
        desc: "Accredited financing assistance and Buy-Now-Pay-Later (BNPL) milestone tranche billing for titled lot owners and OFW families.",
      },
      {
        icon: Warehouse,
        title: "In-House Hardware & Direct Fleet Supply",
        badge: "Zero Markup Delay",
        desc: "Direct materials dispatch from MCPA Construction & Supply depots using our own heavy trucks, mixers, and steel fabrication yard.",
      },
      {
        icon: HardHat,
        title: "Turnkey Residential & Commercial Build",
        badge: "Stage 3 Execution",
        desc: "Full civil and structural execution with real-time photo logs, milestone inspections, weather-adjusted schedules, and transparent ledger billing.",
      },
      {
        icon: ShieldCheck,
        title: "15-Year Structural Warranty & Handover",
        badge: "Stage 4 Protection",
        desc: "Certified turnkey turnover backed by a 15-Year Structural Integrity Warranty and dedicated post-construction maintenance support.",
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Hammer className="w-4 h-4" />
              <span>Stage 1 Discovery · Engineering Capabilities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono uppercase text-neutral-900 dark:text-white">
              Turnkey Design-Build &amp; Supply Services
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
              Everything required to transform your titled lot into a finished residence—engineered, supplied, and built under one accountable roof.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartInquiry}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Book Consultation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicesList.map((srv, idx) => {
            const IconComp = srv.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-3 flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                      {srv.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW C: DEDICATED 4-STAGE CONSTRUCTION PROCESS TAB (When mode === "process")
  // ---------------------------------------------------------------------------
  if (mode === "process") {
    const fourStages = [
      {
        stage: "Stage 1",
        code: "PRE_INQUIRY",
        title: "Discovery & Pre-Inquiry",
        desc: "Explore completed works, compute your preliminary budget via the Feasibility Calculator, and submit your Architectural Brief for initial engineering evaluation.",
        deliverables: ["Feasibility & Budget Estimate", "Site & Lot Verification", "Initial Consultation Booking"],
      },
      {
        stage: "Stage 2",
        code: "CONSULTATION",
        title: "Consultation & Pre-Construction Planning",
        desc: "Meet with Lead Engineer Raymart Quirante via WebRTC video or in-person, review interactive 2D/3D blueprints with coordinate pin feedback, approve itemized BOQ quotations, process LGU permits, and sign your digital construction contract.",
        deliverables: ["Interactive Blueprints & Pin Revisions", "Approved Itemized BOQ Quotation", "Municipal Permits & E-Contract Signing", "Groundbreaking Ceremony Kickoff"],
      },
      {
        stage: "Stage 3",
        code: "ACTIVE_BUILD",
        title: "Active Site Execution",
        desc: "Track physical construction from Mobilization & Foundation (M1–M2) through Structural Framing, Masonry, MEPF, and Finishes (M3–M6) with real-time photo inspections, weather-synced delay logs, and verified milestone billing.",
        deliverables: ["M1–M6 Weighted Milestone Stepper", "Timestamped Site Inspection Gallery", "Transparent Milestone Billing Ledger"],
      },
      {
        stage: "Stage 4",
        code: "COMPLETED",
        title: "Handover, Wrapped & 15-Year Warranty",
        desc: "Celebrate 100% turnkey completion with your interactive MCPA Project Wrapped recap, Before/After transformation slider, Certificate of Completion, and activated 15-Year Structural Warranty vault.",
        deliverables: ["Interactive Project Wrapped Recap", "Before & After Site Transformation", "15-Year Structural Warranty Certificate"],
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <ListChecks className="w-4 h-4" />
              <span>4-Stage Progressive Disclosure Lifecycle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono uppercase text-neutral-900 dark:text-white">
              How Your MCPA Build Journey Works
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
              Our Client Portal follows a strict 4-Stage progressive disclosure roadmap—unlocking specialized engineering tools at every milestone of your project.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartInquiry}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Begin Stage 1 Inquiry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fourStages.map((st, idx) => (
            <div
              key={st.code}
              className="p-6 rounded-2xl bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase">
                  {st.stage}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">0{idx + 1} / 04</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-mono text-neutral-900 dark:text-white uppercase">
                  {st.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  {st.desc}
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-100 dark:border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                  Unlocked Portal Modules:
                </div>
                {st.deliverables.map((del, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: STAGE 1 EXECUTIVE DASHBOARD (When portalTab === "overview")
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* 0. DISCONTINUED / REJECTED CONSULTATION NOTICE BANNER */}
      {rejectedInfo && (
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-500/[0.08] dark:bg-rose-500/[0.12] border border-rose-500/30 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <span>Previous Consultation Concluded</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono">
                    Stage 1 (Pre-Inquiry) Active
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
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  You are welcome to submit a fresh inquiry with revised parameters or timelines whenever you are ready.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartInquiry}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Submit New Inquiry</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 1B: CLIENT HAS AN ACTIVE INQUIRY PENDING INITIAL CONSULTATION
          (Client stays in Stage 1 until elevated to Stage 2 by Admin)
          ========================================================================= */}
      {activeInquiry ? (
        <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-amber-500/30 overflow-hidden shadow-lg space-y-6 p-6 sm:p-8">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                <FolderKanban className="w-4 h-4" />
                <span>Stage 1 Active · Inquiry Under Initial Review</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-neutral-900 dark:text-white">
                {activeInquiry.project_type || activeInquiry.projectType || "Custom Residential Build"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Reference Code:{" "}
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {activeInquiry.trackingId || activeInquiry.submissionId || activeInquiry.submission_id || activeInquiry.projectCode || "MCPA-INQ-ACTIVE"}
                </span>{" "}
                · Submitted by {currentUser?.fullName || currentUser?.name || "Client"}
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold uppercase shrink-0">
              {activeInquiry.status || "Pending Initial Review"}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Step 1</div>
              <div className="font-bold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Brief Submitted</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200">
              <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Step 2 (Active)</div>
              <div className="font-bold flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Engineering Evaluation</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-neutral-500">
              <div className="text-[10px] uppercase font-bold">Step 3</div>
              <div className="font-bold mt-0.5">Initial Consultation</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-neutral-500">
              <div className="text-[10px] uppercase font-bold">Step 4</div>
              <div className="font-bold mt-0.5">Stage 2 Architectural Unlock</div>
            </div>
          </div>

          {/* Grid: Inquiry Parameters & Consultation Meeting Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Scope & Lot Details (6 cols) */}
            <div className="lg:col-span-6 space-y-4 p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Submitted Brief Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">TARGET LOCATION:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {activeInquiry.target_location || activeInquiry.targetLocation || activeInquiry.lotAddress || "Bulacan, Central Luzon"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">TARGET BUDGET RANGE:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {activeInquiry.budget_range || activeInquiry.budgetRange || "₱3,500,000 - ₱5,000,000"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">LOT STATUS:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {activeInquiry.lot_status || "Titled Property (Clean TCT)"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">DESIRED TIMELINE:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {activeInquiry.target_start || "Ready within 1 - 2 months"}
                  </span>
                </div>
              </div>

              {activeInquiry.notes && (
                <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">CLIENT NOTES &amp; PREFERENCES:</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic">
                    &ldquo;{activeInquiry.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: WebRTC Initial Consultation Meeting Hub (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-neutral-900 text-white border border-amber-500/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    <span>Initial Video Consultation Hub</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                    Encrypted WebRTC
                  </span>
                </div>

                <div>
                  <div className="text-xs font-mono text-neutral-400">MEETING ROOM CODE:</div>
                  <div className="text-lg font-mono font-bold text-amber-400 flex items-center gap-2 mt-0.5">
                    <span>{activeRoomCode || "mcpa-arch-2026"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMeetingLink(activeRoomCode || "mcpa-arch-2026")}
                      className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                      title="Copy meeting link"
                    >
                      {hasCopiedRoomLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Schedule: <strong>{activeInquiry.meeting_date || activeInquiry.meetingDate || "Pending Scheduling"}</strong> (
                      {activeInquiry.meeting_time || activeInquiry.meetingTime || "10:00 AM PHT"})
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Meet directly with Lead Engineer Raymart Quirante to discuss lot boundaries, preliminary design, and budget range.
                  </p>
                </div>
              </div>

              {/* Action: Join Video Call */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCallRoomCode(activeRoomCode || "mcpa-arch-2026")}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
                >
                  <Video className="w-4 h-4" />
                  <span>Enter Video Consultation Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Strict 1 Active Inquiry Lock Notice */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-sans">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>1-Active-Inquiry Policy:</strong> You have an active inquiry. Once initial consultation is concluded and preliminary scope is mutually agreed, our engineering team will advance your project to <strong>Stage 2: Consultation &amp; Planning (Blueprints &amp; BOQ)</strong>.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            STATE 1A: FRESH ACCOUNT (NO ACTIVE INQUIRY YET)
            (Features Hero, Feasibility Calculator, and Start Inquiry Wizard)
            ========================================================================= */
        <div className="space-y-8">
          {/* 1. HERO ONBOARDING SECTION */}
          <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-10 shadow-xs dark:shadow-none space-y-6 transition-colors">
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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

            <div className="relative z-10 max-w-3xl space-y-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono uppercase leading-tight">
                Ready to Build Your Architectural Vision?
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl">
                Welcome, <span className="font-bold text-amber-600 dark:text-amber-400">{currentUser?.fullName || currentUser?.full_name || "Valued Client"}</span>. 
                Your client portal tracks your construction project from concept blueprints down to actual turnkey handover. To initiate your project timeline, submit your verified architectural inquiry below.
              </p>
            </div>

            <div className="relative z-10 pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStartInquiry}
                className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Start Your Project Inquiry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. INTERACTIVE DREAM HOME COST & FEASIBILITY CALCULATOR */}
          <DreamHomeCostCalculator
            onApplyEstimate={(params) => {
              if (onStartInquiry) onStartInquiry(params);
            }}
          />
        </div>
      )}

      {/* 3. SHOWCASE GALLERY (FETCHED LIVE FROM DB) */}
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
              <div key={i} className="min-h-[460px] rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : portfolioProjects.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 text-xs font-mono text-neutral-400">
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

      {/* 4. COMPANY SHOWCASE QUICK JUMP STRIP */}
      <div className="rounded-2xl p-6 bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <span>Explore Company Capabilities</span>
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Discover Our Comprehensive Services &amp; 4-Stage Construction Process
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Learn more about our in-house materials fleet, BNPL titled lot financing, and milestone engineering checklists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("services")}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 bg-neutral-50 dark:bg-white/[0.03] text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Hammer className="w-3.5 h-3.5 text-amber-500" />
            <span>View Services</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("process")}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 bg-neutral-50 dark:bg-white/[0.03] text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ListChecks className="w-3.5 h-3.5 text-amber-500" />
            <span>View Process</span>
          </button>
        </div>
      </div>

      {/* Details Modal */}
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

      {/* Embedded WebRTC Meeting Portal (Phase 1 Consultation Meeting) */}
      {activeCallRoomCode && (
        <GoogleMeetRoom
          roomCode={activeCallRoomCode}
          currentUser={currentUser}
          activeProject={{
            project_title: activeInquiry?.project_type || "Initial Consultation",
            client_name: currentUser?.fullName || currentUser?.name || "Client",
          }}
          onLeave={() => setActiveCallRoomCode(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
}
