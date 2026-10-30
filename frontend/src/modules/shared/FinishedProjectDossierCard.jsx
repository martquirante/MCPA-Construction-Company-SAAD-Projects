"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  CreditCard,
  Building2,
  Share2,
  RefreshCw,
  Eye,
  Award,
  Maximize2,
  Compass,
} from "lucide-react";

export default function FinishedProjectDossierCard({
  dossier,
  audience = "client", // "client" | "admin"
  onLaunchWrapped = () => {},
  onOpenShowcase = null,
  onResyncShowcase = null,
  isResyncing = false,
  showToast = () => {},
}) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  if (!dossier) return null;

  const isAdmin = audience === "admin";
  const {
    title,
    projectCode,
    type,
    clientName,
    cityProvince,
    storeys,
    lotArea,
    floorArea,
    leadEngineer,
    inquiryDate,
    turnoverDate,
    stats = {},
    phases = [],
    timeline = [],
    heroPhoto,
    finalPhotos = [],
    contractAmount,
    settledAmount,
    showcase,
    wrapped,
  } = dossier;

  const totalDays = stats.totalDays || 0;
  const buildDays = stats.buildDays || 0;

  const shareToken = wrapped?.shareToken;
  const publicUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/wrapped/${shareToken}`
    : `/wrapped/${shareToken}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && shareToken) {
      navigator.clipboard.writeText(publicUrl);
      showToast("Public Wrapped Monograph link copied to clipboard!");
    }
  };

  const formatShortDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative rounded-[6px] border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#0e1117] overflow-hidden transition-all duration-200 shadow-xs">
      {/* Precision Registration Marks */}
      <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
        ┌
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
        ┐
      </div>
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
        └
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
        ┘
      </div>

      {/* Main Dossier Content */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-white/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-[4px] bg-transparent text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
                COMPLETED RESIDENCE
              </span>
              <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                {projectCode || "MCPA-BUILD"}
              </span>
              {isAdmin && clientName && (
                <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                  · Client: <strong className="text-neutral-900 dark:text-white">{clientName}</strong>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">
              {title}
            </h2>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{type}</span>
              {cityProvince && <span>• {cityProvince}</span>}
              {storeys && <span>• {storeys}</span>}
              {lotArea && <span>• Lot: {lotArea}</span>}
              {floorArea && <span>• Floor: {floorArea} sqm</span>}
            </p>
          </div>

          {/* Top Action Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Launch 12-Chapter Wrapped Monograph */}
            <button
              type="button"
              onClick={onLaunchWrapped}
              className="px-3.5 py-2 rounded-[5px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Launch 12-Chapter Interactive Architectural Wrapped"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch 12-Chapter Wrapped</span>
            </button>

            {/* Share Public Wrapped Link */}
            {shareToken && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-[5px] border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white font-mono text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy public monograph link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Plate + Architectural Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Hero Completed Residence Photo Plate */}
          <div className="lg:col-span-5 relative rounded-[5px] overflow-hidden border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 aspect-[4/3] group min-h-[240px]">
            {heroPhoto ? (
              <>
                <Image
                  src={heroPhoto}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/20">
                    TURNKEY COMPLETED
                  </span>
                  <span>{formatShortDate(turnoverDate)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoModal(heroPhoto)}
                  className="absolute top-3 right-3 p-1.5 rounded bg-black/60 text-white/90 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/20"
                  title="Enlarge Photo"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 font-mono text-xs p-4 text-center">
                <Building2 className="w-8 h-8 mb-2 opacity-50" />
                <span>COMPLETION PHOTO ARCHIVED</span>
              </div>
            )}
          </div>

          {/* Key Metrics Columns */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Total Duration */}
              <div className="p-3.5 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-neutral-900/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Inquiry to Handover
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-neutral-900 dark:text-white">
                  {totalDays} <span className="text-xs font-normal text-neutral-500">Days</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                  {formatShortDate(inquiryDate)} → {formatShortDate(turnoverDate)}
                </span>
              </div>

              {/* Verified Progress Logs */}
              <div className="p-3.5 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-neutral-900/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Site Quality Logs
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-neutral-900 dark:text-white">
                  {stats.imagesLogged || 0} <span className="text-xs font-normal text-neutral-500">Photos</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                  {stats.milestonesCompleted || 0} milestones conquered
                </span>
              </div>

              {/* Consultations & Dialogue */}
              <div className="p-3.5 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-neutral-900/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Consultation Dialogue
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-neutral-900 dark:text-white">
                  {stats.consultations || 0} <span className="text-xs font-normal text-neutral-500">Sessions</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                  {stats.blueprintSheets || 0} drawing sheets issued
                </span>
              </div>
            </div>

            {/* Admin Showcase Sync Control Bar */}
            {isAdmin && (
              <div className="p-3.5 rounded-[5px] border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Showcase Sync Status:
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold uppercase text-[10px]">
                      {showcase?.isWebVisible ? "Live on Website" : "Draft in Showcase (Hidden)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans">
                    {showcase?.imageCount || 0} completion photos (≥90% progress) synced to Showcase.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onResyncShowcase && (
                    <button
                      type="button"
                      onClick={onResyncShowcase}
                      disabled={isResyncing}
                      className="px-2.5 py-1.5 rounded border border-neutral-300 dark:border-white/20 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Re-sync latest >=90% photos from site logs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResyncing ? "animate-spin" : ""}`} />
                      <span>{isResyncing ? "Syncing..." : "Re-Sync"}</span>
                    </button>
                  )}

                  {onOpenShowcase && (
                    <button
                      type="button"
                      onClick={onOpenShowcase}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Open and edit in Projects Showcase tab"
                    >
                      <span>Open Showcase</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Client Handover Documentation Strip */}
            {!isAdmin && (
              <div className="p-3 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Turnover complete & all milestones 100% accomplished.</span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                  Turnkey Handed Over
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Curated >=90% Completion Photos Strip */}
        {finalPhotos.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[10px]">
                Near-Completion & Turnover Photography (≥90% Progress)
              </span>
              <span className="text-[10px] text-neutral-400">
                {finalPhotos.length} curated shot{finalPhotos.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {finalPhotos.slice(0, 6).map((ph, idx) => (
                <div
                  key={ph.id || idx}
                  onClick={() => setSelectedPhotoModal(ph.url)}
                  className="relative aspect-square rounded-[4px] overflow-hidden border border-neutral-200 dark:border-white/10 group cursor-pointer bg-neutral-100 dark:bg-neutral-900"
                >
                  <Image
                    src={ph.url}
                    alt={ph.title || `Photo ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 33vw, 120px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {ph.pct && (
                    <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                      {ph.pct}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Project History (From Day-1 Inquiry to Final Handover) */}
        <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded((p) => !p)}
            className="w-full py-2 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold">
                {isHistoryExpanded ? "Hide Full Project Journey" : "View Complete Day-1 Inquiry to Handover History"}
              </span>
              <span className="text-[10px] text-neutral-400 lowercase font-normal">
                ({timeline.length} recorded events)
              </span>
            </div>
            {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isHistoryExpanded && (
            <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-300 dark:before:bg-neutral-800">
                {timeline.map((ev, idx) => {
                  const evDate = formatShortDate(ev.at);
                  const isHandover = ev.kind === "handover";
                  const isInquiry = ev.kind === "inquiry";
                  return (
                    <div key={idx} className="relative group text-xs">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border ${
                          isHandover
                            ? "bg-amber-500 border-amber-400 ring-2 ring-amber-500/20"
                            : isInquiry
                            ? "bg-emerald-500 border-emerald-400"
                            : "bg-neutral-400 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-700"
                        }`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">
                          {ev.title}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                          {evDate}
                        </span>
                      </div>

                      {ev.detail && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          {ev.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Photo Modal */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedPhotoModal}
              alt="Enlarged photo"
              fill
              className="object-contain"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
