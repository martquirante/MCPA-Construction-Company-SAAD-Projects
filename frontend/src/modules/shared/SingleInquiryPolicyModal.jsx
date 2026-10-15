"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  FolderKanban,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  X,
  Compass,
  ArrowRight,
  Info,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export default function SingleInquiryPolicyModal({
  isOpen,
  onClose,
  activeInquiry = null,
  currentUser = null,
  onOpenPortal = null,
}) {
  const router = useRouter();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text, type) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "phone") {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    }
  };

  const handleGoToPortal = () => {
    if (onOpenPortal) {
      onOpenPortal();
      return;
    }
    if (onClose) onClose();
    router.push("/portal?tab=inquiries");
  };

  // Format reference information
  const refCode = activeInquiry?.submissionId || activeInquiry?.submission_id || activeInquiry?.project_code || "MCPA-INQ-ACTIVE";
  const projectType = activeInquiry?.projectType || activeInquiry?.project_type || activeInquiry?.project_title || "Residential Design & Build";
  const location = activeInquiry?.location || activeInquiry?.target_location || "Bulacan / Metro Manila";
  const status = activeInquiry?.status || (activeInquiry?.isProject ? "Active Project Execution" : "Under Architectural Review");

  const formattedDate = (() => {
    const raw = activeInquiry?.createdAt || activeInquiry?.created_at;
    if (!raw) return "Recently Submitted";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "Recently Submitted";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Recently Submitted";
    }
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="single-inquiry-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="relative w-full max-w-[560px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 rounded-[20px] shadow-2xl shadow-black/30 dark:shadow-black/70 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Subtle decorative top hairline highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Header Bar */}
        <div className="px-5 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-white/5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Policy Notice · 1 Active Project Limit</span>
            </div>
            <h2
              id="single-inquiry-modal-title"
              className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight pt-1 leading-snug"
            >
              Active Project Inquiry on Record
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 portal-card-scroll">
          <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            To maintain our high engineering quality and dedicated architect-led supervision, MCPA adheres to a strict{" "}
            <strong className="text-neutral-900 dark:text-white font-semibold">one active project consultation per client</strong>. Each build receives undivided technical review before a secondary project is initiated.
          </p>

          {/* ACTIVE INQUIRY DOSSIER CARD */}
          <div className="rounded-[14px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 p-4 sm:p-4.5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-200/70 dark:border-white/5">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                  Ref: {refCode}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[10.5px] font-mono uppercase tracking-wider text-neutral-400">
                  Project Type
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white truncate block">
                  {projectType}
                </span>
              </div>
              <div>
                <span className="block text-[10.5px] font-mono uppercase tracking-wider text-neutral-400">
                  Target Location
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white truncate block">
                  {location}
                </span>
              </div>
              <div>
                <span className="block text-[10.5px] font-mono uppercase tracking-wider text-neutral-400">
                  Lodged Date
                </span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {formattedDate}
                </span>
              </div>
              <div>
                <span className="block text-[10.5px] font-mono uppercase tracking-wider text-neutral-400">
                  Client Account
                </span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate block">
                  {currentUser?.fullName || currentUser?.full_name || currentUser?.email || "Valued Client"}
                </span>
              </div>
            </div>
          </div>

          {/* RATIONALE NOTE (Human, consultative, zero AI fluff) */}
          <div className="p-3.5 rounded-[12px] bg-amber-500/[0.07] border border-amber-500/25 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Why does MCPA hold a single active inquiry policy?
              </h4>
              <p className="text-[11.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                Every architectural plan, 3D render, and structural estimate is personally drafted by our resident civil engineers and PRC-licensed architects. We focus entirely on your ongoing brief so you receive our full technical dedication and 15-year structural guarantee.
              </p>
            </div>
          </div>

          {/* CONTACT MANAGEMENT SECTION */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Need to modify details, add titled lots, or request multi-project clearance?
            </div>
            <div className="p-3 rounded-[12px] bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>Engr. Aris Reyes</span>
                  <span className="text-[10px] font-mono text-neutral-400 font-normal">· Senior Project Management</span>
                </div>
                <div className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  +63 949 775 8239 (Calls &amp; Viber)
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="tel:+639497758239"
                  className="px-3 py-1.5 rounded-[6px] bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono text-[11px] font-bold uppercase hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy("+63 949 775 8239", "phone")}
                  className="px-2.5 py-1.5 rounded-[6px] border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-[11px] font-mono flex items-center gap-1"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPhone ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="px-5 sm:px-7 py-4 bg-neutral-50 dark:bg-[#0c0e14] border-t border-neutral-100 dark:border-white/5 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-[8px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-center"
          >
            Back to Website
          </button>

          <button
            type="button"
            onClick={handleGoToPortal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-amber-500/20 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Open Active Inquiry in Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
