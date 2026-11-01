"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  HardHat,
  Flame,
  Award,
  CreditCard,
  Wallet,
  Gift,
  Sparkles,
  Flag,
  Landmark,
  Layers,
  Phone,
  Mail,
  ExternalLink,
  AlertTriangle,
  User,
  Trash2,
  CheckCircle2,
  Building2,
  FileText,
} from "lucide-react";

/**
 * Returns human-readable relative time status
 */
function getRelativeTimeDescription(dateStr) {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
    const target = new Date(y, m - 1, d).getTime();

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Happening Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  } catch {
    return "";
  }
}

export default function CalendarEventDetailModal({
  event,
  isOpen,
  onClose,
  onNavigateTab,
  onSelectProject,
  onDeleteEvent,
}) {
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const isCritical =
    event.priority === "critical" ||
    event.isCritical ||
    (event.title || "").toLowerCase().includes("concrete pour") ||
    (event.title || "").toLowerCase().includes("buhos") ||
    (event.title || "").toLowerCase().includes("turnover");

  const isPast = event.isPast;
  const relativeText = getRelativeTimeDescription(event.date);

  // Category Icon resolver (100% SVG, strictly NO EMOJIS)
  const getCategoryIcon = () => {
    switch (event.category) {
      case "meeting":
        return event.meetingMode?.toLowerCase().includes("online") ? (
          <Video className="w-4 h-4 text-sky-400" />
        ) : (
          <MapPin className="w-4 h-4 text-amber-400" />
        );
      case "site":
        return isCritical ? (
          <Flame className="w-4 h-4 text-orange-400" />
        ) : (
          <HardHat className="w-4 h-4 text-emerald-400" />
        );
      case "billing":
        return event.isPayroll ? (
          <Wallet className="w-4 h-4 text-purple-400" />
        ) : (
          <CreditCard className="w-4 h-4 text-purple-400" />
        );
      case "birthday":
        return event.role?.toLowerCase().includes("client") ? (
          <Sparkles className="w-4 h-4 text-rose-400" />
        ) : (
          <Gift className="w-4 h-4 text-rose-400" />
        );
      case "holiday":
        return event.type?.toLowerCase().includes("bulacan") ? (
          <Landmark className="w-4 h-4 text-indigo-400" />
        ) : (
          <Flag className="w-4 h-4 text-red-400" />
        );
      case "blueprint":
        return <Layers className="w-4 h-4 text-violet-400" />;
      default:
        return <Calendar className="w-4 h-4 text-amber-400" />;
    }
  };

  const categoryLabelMap = {
    meeting: "Client Consultation",
    site: "Site Execution & Milestone",
    billing: "Finance & Billing Due",
    birthday: "Birthday & Celebration",
    holiday: "Official Holiday Observance",
    blueprint: "Architectural & Blueprints",
    operations: "Company Operations",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#11141c] border border-neutral-200 dark:border-white/10 shadow-2xl text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-all duration-200"
      >
        {/* Header Ribbon & Close */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 bg-neutral-50/95 dark:bg-[#181a24]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-200/60 dark:bg-white/10 border border-neutral-300/50 dark:border-white/10 shrink-0">
              {getCategoryIcon()}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400 block leading-tight">
                {categoryLabelMap[event.category] || "Company Schedule"}
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Event Dossier
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {relativeText && (
              <span
                className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  relativeText.includes("Today")
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : isPast
                    ? "bg-neutral-200/60 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10"
                    : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                }`}
              >
                {relativeText}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Event Dossier"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Priority & Status Banner */}
          <div className="flex flex-wrap items-center gap-2">
            {isCritical && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                <AlertTriangle className="w-3.5 h-3.5" />
                CRITICAL SITE PRIORITY
              </span>
            )}
            {event.priority === "high" && !isCritical && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                High Priority
              </span>
            )}
            {isPast ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-200/70 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-white/10">
                Completed / Past Schedule
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Active / Scheduled
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h2
              id="calendar-event-modal-title"
              className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug"
            >
              {event.title}
            </h2>
            {event.projectTitle && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-sans">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>Project: {event.projectTitle}</span>
              </p>
            )}
          </div>

          {/* Core Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/[0.06]">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                  Date Scheduled
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                  {event.formattedDate || event.date}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                  Time / Window
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                  {event.time || event.startTime || "All-Day Schedule"}
                </span>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-2.5 sm:col-span-2 pt-2 border-t border-neutral-200/60 dark:border-white/5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                    Location / Venue
                  </span>
                  <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-sans">
                    {event.location}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 1. Client Meeting Details Block */}
          {event.category === "meeting" && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Client Profile & Meeting Specifications
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-white/10 border border-amber-500/30 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-white uppercase shrink-0">
                  {event.clientName ? event.clientName.slice(0, 2) : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {event.clientName || "Client"}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {event.projectType || "General Construction Consultation"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {event.clientEmail && (
                  <a
                    href={`mailto:${event.clientEmail}`}
                    className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 transition-colors truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{event.clientEmail}</span>
                  </a>
                )}
                {event.clientPhone && (
                  <a
                    href={`tel:${event.clientPhone}`}
                    className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{event.clientPhone}</span>
                  </a>
                )}
              </div>

              {event.estimatedBudget && (
                <div className="text-xs text-neutral-600 dark:text-neutral-300 pt-1">
                  <span className="font-mono text-neutral-400">Estimated Budget: </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {event.estimatedBudget}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. Site Construction & Milestones Block */}
          {event.category === "site" && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                Construction Execution Metrics
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {event.projectCode && (
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Project Code
                    </span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">
                      {event.projectCode}
                    </span>
                  </div>
                )}
                {event.phaseName && (
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Phase
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {event.phaseName}
                    </span>
                  </div>
                )}
                {typeof event.progressPct === "number" && (
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Accomplishment
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {event.progressPct}%
                    </span>
                  </div>
                )}
                {event.engineer && (
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Site Lead
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {event.engineer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Birthday Celebrant Block */}
          {event.category === "birthday" && (
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  Birthday Celebration
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-neutral-900 dark:text-white">
                  {event.celebrantName || event.title}
                </span>{" "}
                ({event.role || "Team Member / Client"})
              </p>
              {event.email && (
                <div className="pt-2">
                  <a
                    href={`mailto:${event.email}?subject=Happy%20Birthday%20from%20MCPA%20Construction!`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Birthday Greeting Email</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 4. Holiday Observance Block */}
          {event.category === "holiday" && (
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {event.type || "Official Proclamation"}
                </span>
              </div>
              {event.siteStatus && (
                <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 text-xs">
                  <span className="font-mono font-bold text-neutral-400 uppercase text-[9px] block">
                    Site Operations Status
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {event.siteStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5. Notes / Description */}
          {event.notes && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notes & Directives
              </span>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                {event.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2.5 px-5 sm:px-6 py-4 bg-neutral-50/95 dark:bg-[#181a24]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            {event.isCustom && onDeleteEvent && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to remove this scheduled company event?")) {
                    onDeleteEvent(event.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Direct Google Meet CTA if meeting is virtual */}
            {event.category === "meeting" && event.meetingMode?.toLowerCase().includes("online") && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.("meetings");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Launch Meeting</span>
              </button>
            )}

            {/* Direct jump to Site Progress */}
            {event.category === "site" && event.projectCode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (event.rawProject) {
                    onSelectProject?.(event.rawProject);
                  }
                  onNavigateTab?.("site-progress");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Inspect in Site Progress</span>
              </button>
            )}

            {/* Direct jump to Meetings Tab */}
            {event.category === "meeting" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.("meetings");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Meetings Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Direct jump to Billing */}
            {event.category === "billing" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.("billing");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Billing Ledger</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
