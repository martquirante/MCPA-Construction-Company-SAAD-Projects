"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Play,
  Film,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

async function parseJsonResponse(response) {
  const body = await response.text();
  if (!body.trim()) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    console.warn("Portal Phase 4 returned a non-JSON response:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    return null;
  }
}

function PortalMediaGroupCard({ group, onOpenModal }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const items = group.items || [];
  const safeIdx = Math.min(Math.max(0, activeIdx), Math.max(0, items.length - 1));
  const currentItem = items[safeIdx] || items[0] || {};

  const isVideo =
    currentItem.media_type === "video" ||
    Boolean(currentItem.image_url?.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i));

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      onClick={() => onOpenModal(currentItem, items, safeIdx, group)}
      className="group relative rounded-[10px] overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 aspect-4/3 cursor-pointer shadow-sm hover:shadow-lg transition-all select-none"
    >
      {isVideo ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            key={currentItem.image_url}
            src={currentItem.image_url}
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            preload="metadata"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <img
          key={currentItem.image_url}
          src={currentItem.image_url}
          alt={group.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      )}

      {/* Chevrons for flipping through photos in the card */}
      {items.length > 1 && (
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between pointer-events-none opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={handlePrev}
            title="Previous photo"
            aria-label="Previous photo"
            className="w-6 h-6 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            title="Next photo"
            aria-label="Next photo"
            className="w-6 h-6 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        {items.length > 1 ? (
          <span className="text-[9.5px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Camera className="w-2.5 h-2.5 text-amber-400" />
            <span>
              {safeIdx + 1} / {items.length} {isVideo ? "Video" : "Photos"}
            </span>
          </span>
        ) : isVideo ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/80 text-white uppercase tracking-wider flex items-center gap-1">
            <Film className="w-2.5 h-2.5" />
            <span>Video</span>
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/80 text-neutral-950 uppercase tracking-wider flex items-center gap-1">
            <Camera className="w-2.5 h-2.5" />
            <span>Photo</span>
          </span>
        )}
        {currentItem.is_360 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/80 text-white uppercase tracking-wider">
            360° VR
          </span>
        )}
      </div>

      {/* Bottom overlay with dots and info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1 mb-2 pointer-events-auto">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/10">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  className={`transition-all cursor-pointer rounded-full ${
                    i === safeIdx
                      ? "w-3 h-1 bg-amber-400"
                      : "w-1 h-1 bg-white/50 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="text-xs font-mono font-bold truncate">{group.title}</div>
        {group.caption && (
          <div className="text-[10.5px] text-neutral-300 font-sans line-clamp-1 mt-0.5">
            {group.caption}
          </div>
        )}
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-300 mt-1">
          <span>{group.log_date || "Inspected"}</span>
          <span className="text-neutral-400 truncate max-w-[120px]">
            {group.inspector || "MCPA Field QC"}
          </span>
        </div>
      </div>
    </div>
  );
}

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

  // Telemetry states (hydrated from props or live fetch)
  const [siteDetails, setSiteDetails] = useState(siteProject || null);
  const [milestones, setMilestones] = useState([]);
  const [photoLogs, setPhotoLogs] = useState(sitePhotos || []);
  const [billing, setBilling] = useState(billingLedger || []);
  const [delays, setDelays] = useState([]);
  const [loans, setLoans] = useState([]);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Group multiple photos from the same update post into a single card
  const groupedPhotoLogs = useMemo(() => {
    if (!Array.isArray(photoLogs) || photoLogs.length === 0) return [];

    const map = new Map();
    const orderedKeys = [];

    photoLogs.forEach((p, idx) => {
      const titleKey = (p.title || "").trim();
      const captionKey = (p.caption || "").trim();
      const inspectorKey = (p.inspector || "").trim();
      const dateKey = (p.log_date || "").trim();

      const hasMeta = Boolean(titleKey || captionKey || inspectorKey || dateKey);
      const groupKey = hasMeta
        ? `${titleKey}___${captionKey}___${inspectorKey}___${dateKey}`
        : `item_${p.log_id || idx}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          title: p.title || "Site Progress",
          caption: p.caption || "",
          inspector: p.inspector || "MCPA Field QC",
          log_date: p.log_date || "",
          items: [],
          allLogIds: [],
        });
        orderedKeys.push(groupKey);
      }

      const group = map.get(groupKey);
      group.items.push(p);
      if (p.log_id) {
        group.allLogIds.push(p.log_id);
      }
    });

    return orderedKeys.map((key) => map.get(key));
  }, [photoLogs]);

  const handleOpenPhotoModal = (item, items, index, group) => {
    const list = Array.isArray(items) && items.length > 0 ? items : [item];
    const safeIdx = Math.min(Math.max(0, index ?? 0), list.length - 1);
    setActivePhotoModal({
      ...item,
      items: list,
      currentIndex: safeIdx,
      groupTitle: group?.title || item.title,
      groupCaption: group?.caption || item.caption,
      groupInspector: group?.inspector || item.inspector,
      groupDate: group?.log_date || item.log_date,
    });
  };

  const portalModalItems = useMemo(() => {
    if (!activePhotoModal) return [];
    if (Array.isArray(activePhotoModal.items) && activePhotoModal.items.length > 0) {
      return activePhotoModal.items;
    }
    return [activePhotoModal];
  }, [activePhotoModal]);

  const currentPortalModalIndex = Math.min(
    Math.max(0, activePhotoModal?.currentIndex ?? 0),
    Math.max(0, portalModalItems.length - 1)
  );
  const currentPortalModalItem = portalModalItems[currentPortalModalIndex] || activePhotoModal;

  const handlePortalModalPrev = useCallback(() => {
    if (!activePhotoModal || portalModalItems.length <= 1) return;
    const nextIdx = (currentPortalModalIndex - 1 + portalModalItems.length) % portalModalItems.length;
    setActivePhotoModal((prev) => ({
      ...prev,
      ...portalModalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [activePhotoModal, portalModalItems, currentPortalModalIndex]);

  const handlePortalModalNext = useCallback(() => {
    if (!activePhotoModal || portalModalItems.length <= 1) return;
    const nextIdx = (currentPortalModalIndex + 1) % portalModalItems.length;
    setActivePhotoModal((prev) => ({
      ...prev,
      ...portalModalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [activePhotoModal, portalModalItems, currentPortalModalIndex]);

  useEffect(() => {
    if (!activePhotoModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActivePhotoModal(null);
      if (e.key === "ArrowLeft") handlePortalModalPrev();
      if (e.key === "ArrowRight") handlePortalModalNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoModal, handlePortalModalPrev, handlePortalModalNext]);

  useEffect(() => {
    if (siteProject) setSiteDetails(siteProject);
  }, [siteProject]);

  useEffect(() => {
    if (sitePhotos && sitePhotos.length > 0) setPhotoLogs(sitePhotos);
  }, [sitePhotos]);

  useEffect(() => {
    if (billingLedger && billingLedger.length > 0) setBilling(billingLedger);
  }, [billingLedger]);

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
    const code = projectCode || siteProject?.project_code || activeProject?.project_code;
    if (code) {
      try {
        const res = await fetch(`/api/construction/projects/${encodeURIComponent(code)}`);
        const data = await parseJsonResponse(res);
        if (data?.success) {
          if (data.project) setSiteDetails(data.project);
          if (data.milestones) setMilestones(data.milestones || []);
          if (data.photos && data.photos.length > 0) setPhotoLogs(data.photos);
          if (data.billing && data.billing.length > 0) setBilling(data.billing);
          if (data.delays) setDelays(data.delays || []);
        }
      } catch (e) {
        console.warn("Failed to load construction site execution telemetry:", e);
      }
    }

    // Load Loans/BNPL
    if (projectId) {
      try {
        const loanRes = await authFetch(`/api/projects/${projectId}/loans`);
        const loanData = await parseJsonResponse(loanRes);
        if (loanData?.success && Array.isArray(loanData.loans)) {
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
        {milestones.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4 text-xs font-mono">
            {milestones.map((m, i) => (
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
                  <span className="font-bold">{m.phase_code || `PHASE 0${i + 1}`}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{m.completion_pct || 0}%</span>
                </div>
                <div className="text-xs font-bold truncate">{m.phase_name}</div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.completion_pct || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-4 text-center text-xs font-mono text-neutral-400">
            No milestones scheduled yet. Site milestones will appear once defined by the supervising engineer.
          </div>
        )}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-[3px] text-[9px] font-bold uppercase ${
                            b.status === "Paid" || b.status === "Verified"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}>
                            {b.status}
                          </span>
                          {b.status !== "Paid" && b.status !== "Verified" && (
                            <button
                              type="button"
                              onClick={() => onSelectTab?.("billing")}
                              className="text-[9px] font-mono text-amber-500 underline font-bold hover:text-amber-400 cursor-pointer"
                              title="Submit payment receipt proof"
                            >
                              Submit Proof
                            </button>
                          )}
                        </div>
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
            {groupedPhotoLogs.length} Verified {groupedPhotoLogs.length === 1 ? "Update" : "Updates"}
            {photoLogs.length > groupedPhotoLogs.length && ` (${photoLogs.length} Photos)`}
          </span>
        </div>

        {groupedPhotoLogs.length === 0 ? (
          <div className="p-12 text-center rounded-[6px] border border-dashed border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-400 space-y-2">
            <Camera className="w-8 h-8 mx-auto text-neutral-400" />
            <p>Awaiting first active site photography logs from the field team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedPhotoLogs.map((group) => (
              <PortalMediaGroupCard
                key={group.groupKey}
                group={group}
                onOpenModal={handleOpenPhotoModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo / Video Preview Lightbox Modal */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-white/80 dark:bg-black/90 backdrop-blur-md animate-in fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-[12px] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl space-y-3"
          >
            <div className="relative w-full max-h-[75vh] bg-neutral-100 dark:bg-black rounded-[8px] overflow-hidden flex items-center justify-center">
              {currentPortalModalItem?.media_type === "video" ||
              Boolean(currentPortalModalItem?.image_url?.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i)) ? (
                <video
                  key={currentPortalModalItem?.image_url}
                  src={currentPortalModalItem?.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[72vh] w-full object-contain rounded-[6px]"
                />
              ) : (
                <img
                  key={currentPortalModalItem?.image_url}
                  src={currentPortalModalItem?.image_url}
                  alt={currentPortalModalItem?.title || activePhotoModal.title}
                  className="max-h-[72vh] w-auto mx-auto object-contain rounded-[6px]"
                />
              )}

              {/* Prev / Next Chevrons on modal */}
              {portalModalItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePortalModalPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-700 dark:bg-black/75 dark:hover:bg-black/95 dark:text-white border border-neutral-200 dark:border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Previous Photo (Left Arrow)"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePortalModalNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-700 dark:bg-black/75 dark:hover:bg-black/95 dark:text-white border border-neutral-200 dark:border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Next Photo (Right Arrow)"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-xs border border-neutral-200 dark:border-white/15 pointer-events-auto shadow-md">
                      {portalModalItems.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setActivePhotoModal((prev) => ({
                              ...prev,
                              ...portalModalItems[i],
                              currentIndex: i,
                            }));
                          }}
                          aria-label={`Photo ${i + 1}`}
                          className={`transition-all cursor-pointer rounded-full ${
                            i === currentPortalModalIndex
                              ? "w-4 h-1.5 bg-amber-400"
                              : "w-1.5 h-1.5 bg-neutral-400 hover:bg-neutral-700 dark:bg-white/40 dark:hover:bg-white/90"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-2 text-neutral-800 dark:text-white flex justify-between items-center text-xs font-mono border-t border-neutral-200 dark:border-white/10">
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <span>{activePhotoModal.groupTitle || activePhotoModal.title}</span>
                  {portalModalItems.length > 1 && (
                    <span className="text-amber-700 dark:text-amber-300 font-mono text-[10px]">
                      {currentPortalModalIndex + 1} / {portalModalItems.length}
                    </span>
                  )}
                </div>
                <div className="text-neutral-600 dark:text-neutral-300 text-[11px] font-sans">
                  {activePhotoModal.groupCaption || activePhotoModal.caption || "No additional field notes."}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Inspected by: {activePhotoModal.groupInspector || activePhotoModal.inspector || "MCPA Field QC"} •{" "}
                  {activePhotoModal.groupDate || activePhotoModal.log_date || "Live"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="px-3 py-1.5 rounded-[4px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-mono text-xs cursor-pointer transition-colors"
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
