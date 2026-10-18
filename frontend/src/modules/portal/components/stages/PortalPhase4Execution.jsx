"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  HardHat,
  TrendingUp,
  DollarSign,
  Camera,
  CloudRain,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Maximize2,
  FolderKanban,
  Building,
  ArrowRight,
  User,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

export default function PortalPhase4Execution({
  activeProject,
  currentUser,
  showToast,
  onRefreshState,
  onSelectTab,
  inquiries = [],
  billingLedger = [],
  sitePhotos = [],
  siteProject = null,
  mode = "overview",
}) {
  const projectId = activeProject?.client_project_id;
  const projectCode = activeProject?.site_project_code || activeProject?.project_code;

  // Telemetry states
  const [siteDetails, setSiteDetails] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [photoLogs, setPhotoLogs] = useState([]);
  const [billing, setBilling] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loans, setLoans] = useState([]);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Financial calculations
  const totalBilled = billing.reduce((acc, b) => acc + Number(b.amount_due || 0), 0);
  const totalPaid = billing
    .filter((b) => b.status === "Paid" || b.status === "Verified")
    .reduce((acc, b) => acc + Number(b.amount_due || 0), 0);
  const remainingBalance = Math.max(0, totalBilled - totalPaid);

  const formatPHP = (val) =>
    "₱" + Number(val).toLocaleString("en-PH", { maximumFractionDigits: 0 });

  // Load live construction telemetry
  const loadExecutionTelemetry = async () => {
    if (!projectCode) return;

    try {
      const res = await fetch(`/api/construction/projects/${encodeURIComponent(projectCode)}`);
      const data = await res.json();
      if (data.success) {
        setSiteDetails(data.project);
        setMilestones(data.milestones || []);
        setPhotoLogs(data.photos || []);
        setBilling(data.billing || []);
        setDelays(data.delays || []);
      }
    } catch (e) {
      console.warn("Failed to load construction site execution telemetry:", e);
    }

    // Load Loans/BNPL
    if (projectId) {
      try {
        const loanRes = await authFetch(`/api/projects/${projectId}/loans`);
        const loanData = await loanRes.json();
        if (loanData.success && Array.isArray(loanData.loans)) {
          setLoans(loanData.loans);
        }
      } catch (e) {
        console.warn("Failed to load loan telemetry:", e);
      }
    }
  };

  useEffect(() => {
    loadExecutionTelemetry();
  }, [projectCode, projectId]);

  const progressPct = siteDetails?.progress_pct ?? activeProject?.site_progress_pct ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO EXECUTION & DYNAMIC PROGRESS GAUGE */}
      <div className="p-6 sm:p-8 rounded-[8px] border border-neutral-200 dark:border-amber-500/20 bg-white dark:bg-linear-to-b dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 text-neutral-900 dark:text-white shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
              {activeProject?.project_title || "Residential Site Build"}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1">
              Lead Project Engineer: <span className="font-bold text-neutral-900 dark:text-white">{siteDetails?.lead_engineer || "Unassigned"}</span> · Current Phase: <span className="text-amber-600 dark:text-amber-400 font-bold">{siteDetails?.current_phase || "Site Mobilization & Preparation"}</span>
            </p>
          </div>

          {/* Circular/Linear Progress Badge */}
          <div className="flex items-center gap-4 bg-neutral-50 dark:bg-white/[0.04] p-4 rounded-[8px] border border-neutral-200 dark:border-white/10 shrink-0 transition-colors">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray={`${progressPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-neutral-900 dark:text-white">
                {progressPct}%
              </span>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white uppercase">Overall Build Progress</div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                {siteDetails?.revised_turnover ? `Turnover: ${siteDetails.revised_turnover}` : "Target Schedule Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4 text-xs font-mono">
          {(milestones.length > 0 ? milestones : [
            { milestone_id: 1, phase_name: "Mobilization & Earthworks", completion_pct: 0, status: "Upcoming" },
            { milestone_id: 2, phase_name: "Foundation & Substructure", completion_pct: 0, status: "Upcoming" },
            { milestone_id: 3, phase_name: "Structural Framing", completion_pct: 0, status: "Upcoming" },
            { milestone_id: 4, phase_name: "Enclosure & Masonry", completion_pct: 0, status: "Upcoming" },
            { milestone_id: 5, phase_name: "MEPF Rough-ins", completion_pct: 0, status: "Upcoming" },
            { milestone_id: 6, phase_name: "Architectural Finishes & Turnover", completion_pct: 0, status: "Upcoming" },
          ]).map((m, i) => (
            <div
              key={m.milestone_id || i}
              className={`p-3 rounded-[6px] border flex flex-col justify-between space-y-1.5 transition-colors ${
                m.completion_pct === 100
                  ? "bg-amber-500/10 border-amber-500/30 text-neutral-900 dark:text-white"
                  : m.completion_pct > 0
                  ? "bg-neutral-50 dark:bg-white/[0.05] border-amber-500/50 text-neutral-900 dark:text-white"
                  : "bg-neutral-50/50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-400 dark:text-neutral-500"
              }`}
            >
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold">PHASE 0{i + 1}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{m.completion_pct}%</span>
              </div>
              <div className="text-xs font-bold truncate">{m.phase_name}</div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${m.completion_pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. STAGE 3 EXECUTIVE DASHBOARD SUMMARY CARDS (SUMMARIZES OTHER ACTIVE NAV TABS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold">
            Stage 3 Execution Executive Summary &amp; Tab Shortcuts
          </span>
          <span className="text-[10px] font-mono text-amber-500 font-semibold">
            Phase 3 of 4 · Active Build
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Summary Card 1: Site Execution Specs */}
          <div
            onClick={() => onSelectTab && onSelectTab("construction")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="text-amber-500">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-amber-500 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {progressPct}% Progress
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Site Specs</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {siteDetails?.current_phase || "Site Mobilization & Preparation"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Lead: {siteDetails?.lead_engineer || "Unassigned"} · Target: {siteDetails?.revised_turnover || "Pending Schedule"}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Site Specs</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Summary Card 2: Milestone Billing */}
          <div
            onClick={() => onSelectTab && onSelectTab("billing")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="text-emerald-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {formatPHP(totalPaid)} Settled
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Milestone Billing</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Balance: {formatPHP(remainingBalance)}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Total Billed: {formatPHP(totalBilled)} · Live payment proofs and receipts.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Billing Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Summary Card 3: Site Gallery & Drone */}
          <div
            onClick={() => onSelectTab && onSelectTab("gallery")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="text-sky-500">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sky-500 dark:text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {photoLogs.length || sitePhotos.length} Photos Logged
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Drone &amp; Gallery</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Live Drone Telemetry
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Daily inspection stamps, concrete slump tests, and aerial site captures.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Open Site Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Summary Card 4: Inquiries Record */}
          <div
            onClick={() => onSelectTab && onSelectTab("inquiries")}
            className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="text-purple-500">
                <FolderKanban className="w-6 h-6" />
              </div>
              <span className="text-purple-500 dark:text-purple-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {activeProject?.project_code || "PRJ-ACTIVE"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Inquiry Brief</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {inquiries[0]?.project_type || "Residential Build"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Style: {inquiries[0]?.preferred_style || "Contemporary"} · Original contract parameters.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Inquiry Record</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL TRANSPARENCY & BNPL LOAN TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Financial Transparency Card */}
        <div className="lg:col-span-7 p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight">
                  Financial Transparency Ledger
                </h2>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Full dual-party transparency between Labor & Construction Costs
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 px-2 py-0.5 rounded-[3px] bg-amber-500/10">
              Audited
            </span>
          </div>

          {/* Financial Breakdown Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
            <div className="p-3.5 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Total Contract Billed</span>
              <span className="text-base font-bold text-neutral-900 dark:text-white">
                {formatPHP(totalBilled)}
              </span>
            </div>

            <div className="p-3.5 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] text-emerald-500 uppercase block font-bold">Total Disbursed / Paid</span>
              <span className="text-base font-bold text-emerald-500">
                {formatPHP(totalPaid)}
              </span>
            </div>

            <div className="p-3.5 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] text-amber-500 uppercase block font-bold">Remaining Milestone Balance</span>
              <span className="text-base font-bold text-amber-500">
                {formatPHP(remainingBalance)}
              </span>
            </div>
          </div>

          {/* Billing Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-[10px] uppercase text-neutral-500">
                <tr>
                  <th className="p-2.5">Milestone / Tranche</th>
                  <th className="p-2.5">Amount</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {billing.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-neutral-400 font-mono text-xs">
                      No progress billing invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  billing.map((b) => (
                    <tr key={b.bill_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-2.5 font-bold text-neutral-900 dark:text-white truncate max-w-xs">
                        {b.milestone_title}
                      </td>
                      <td className="p-2.5">{formatPHP(b.amount_due)}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-[3px] text-[9px] font-bold uppercase ${
                          b.status === "Paid" || b.status === "Verified"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-neutral-400 text-[10px]">
                        {b.or_number ? <span className="text-amber-500 font-bold">{b.or_number}</span> : "Pending"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BNPL / Bank Loan Tracker Card */}
        <div className="lg:col-span-5 p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">
                BNPL & Bank Financing Tracker
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Construction Loan
            </span>
          </div>

          {loans.length === 0 ? (
            <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Financing Mode:</span>
                <span className="font-bold text-neutral-900 dark:text-white">Direct Progress Billing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Bank Financing / BNPL:</span>
                <span className="text-neutral-400">None Active</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans pt-1">
                Progress tranches are settled directly via milestone disbursements. To link a bank loan facility, coordinate with MCPA administration.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Financing Partner:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {loans[0]?.financing_institution || "Commercial Bank"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Approved Loan Cap:</span>
                <span className="font-bold text-emerald-500">
                  {loans[0]?.approved_loan_amount ? formatPHP(loans[0].approved_loan_amount) : "₱0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amortization Term:</span>
                <span className="text-neutral-900 dark:text-white">
                  {loans[0]?.term_years ? `${loans[0].term_years} Years` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Disbursement Mode:</span>
                <span className="text-amber-500 font-bold">Progress-Billing Tranches</span>
              </div>
            </div>
          )}

          {/* Weather / Delay Logs section */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 uppercase">
              <CloudRain className="w-4 h-4 text-sky-500" />
              Weather & Force Majeure Logs
            </div>

            {delays.length === 0 ? (
              <div className="p-3 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Zero weather delays logged. Build schedule on original track!</span>
              </div>
            ) : (
              delays.map((d) => (
                <div
                  key={d.event_id}
                  className="p-3 rounded-[4px] bg-sky-500/10 border border-sky-500/20 text-xs font-mono space-y-1"
                >
                  <div className="flex justify-between font-bold text-sky-600 dark:text-sky-400">
                    <span>{d.category || "Typhoon / Rain Delay"}</span>
                    <span>+{d.days_delayed} Days</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans">{d.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. SITE UPDATES CHRONOLOGICAL PHOTO FEED */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-500" />
              On-Site Photo Stream & Inspection Logs
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              High-resolution photo verification logged directly by MCPA Field Inspectors and Quality Engineers.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {photoLogs.length} Verified Site Photos
          </span>
        </div>

        {photoLogs.length === 0 ? (
          <div className="p-12 text-center rounded-[6px] border border-dashed border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-400 space-y-2">
            <Camera className="w-8 h-8 mx-auto text-neutral-400" />
            <p>Awaiting first active site photography logs from the field team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photoLogs.map((p) => (
              <div
                key={p.log_id}
                onClick={() => setActivePhotoModal(p)}
                className="group relative rounded-[6px] overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 aspect-4/3 cursor-pointer shadow-sm hover:shadow-lg transition-all"
              >
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                  <div className="text-xs font-mono font-bold truncate">{p.title}</div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-300 mt-0.5">
                    <span>{p.log_date || "Inspected"}</span>
                    {p.is_360 && <span className="text-amber-400 font-bold">360° VR</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Preview Lightbox Modal */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2 bg-neutral-900 rounded-[8px] border border-neutral-800 overflow-hidden">
            <img
              src={activePhotoModal.image_url}
              alt={activePhotoModal.title}
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-[4px]"
            />
            <div className="p-3 text-white flex justify-between items-center text-xs font-mono">
              <div>
                <div className="font-bold">{activePhotoModal.title}</div>
                <div className="text-neutral-400 text-[10px]">{activePhotoModal.caption || activePhotoModal.inspector}</div>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="px-3 py-1 rounded-[3px] bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
