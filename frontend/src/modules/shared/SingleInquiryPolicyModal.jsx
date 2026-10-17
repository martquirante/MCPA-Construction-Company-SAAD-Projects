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

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 9.38 5.53 6.34 6.34 0 0 0 3.3-5.53V8.87a8.28 8.28 0 0 0 4.84 1.56V6.99c-.38-.01-.74-.11-1.07-.3z" />
    </svg>
  );
}

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
      <div className="relative w-full max-w-[560px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-neutral-800 rounded-[16px] shadow-2xl shadow-black/30 dark:shadow-black/70 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Subtle decorative top hairline highlight */}
        <div className="h-1 bg-amber-500" />

        {/* Header Bar */}
        <div className="px-5 sm:px-7 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              MCPA Architectural Protocol
            </p>
            <h2
              id="single-inquiry-modal-title"
              className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight leading-snug"
            >
              Active Project Inquiry on Record
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
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

          {/* ACTIVE INQUIRY SPECIFICATIONS (Clean architectural grid, no oval backgrounds, no dots) */}
          <div className="py-3.5 border-y border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Reference Code
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                {refCode}
              </span>
            </div>

            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Current Stage
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {status}
              </span>
            </div>

            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Project Type
              </span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate block">
                {projectType}
              </span>
            </div>

            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Target Location
              </span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate block">
                {location}
              </span>
            </div>

            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Lodged Date
              </span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {formattedDate}
              </span>
            </div>

            <div>
              <span className="block text-[10.5px] font-medium uppercase tracking-wider text-neutral-400">
                Client Account
              </span>
              <span className="text-neutral-700 dark:text-neutral-300 truncate block">
                {currentUser?.fullName || currentUser?.full_name || currentUser?.email || "Valued Client"}
              </span>
            </div>
          </div>

          {/* RATIONALE NOTE (Editorial left accent, no yellow box background, no dots) */}
          <div className="border-l-2 border-amber-500 pl-3.5 py-1 space-y-1">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
              Why does MCPA hold a single active inquiry policy?
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
              Every architectural plan, 3D render, and structural estimate is personally drafted by our resident civil engineers and PRC-licensed architects. We focus entirely on your ongoing brief so you receive our full technical dedication and 15-year structural guarantee.
            </p>
          </div>

          {/* OFFICIAL CONTACT CHANNELS (Official Viber/mobile & social media) */}
          <div className="space-y-3 pt-1">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Official Consultation &amp; Support Channels
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                Need to modify details, add titled lots, or request clearance? Reach our official channels:
              </p>
            </div>

            {/* Direct Calls & Viber Row */}
            <div className="flex items-center justify-between py-2.5 border-y border-neutral-200 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-neutral-400 block">
                  Direct Mobile &amp; Viber
                </span>
                <a
                  href="tel:+639497758239"
                  className="text-sm font-semibold text-neutral-900 dark:text-white font-mono hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  +63 949 775 8239
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href="tel:+639497758239"
                  className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy("+63 949 775 8239", "phone")}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPhone ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Social Media Links (Pure icons without background boxes) */}
            <div>
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-neutral-400 block mb-1.5">
                Official Social Media
              </span>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                <a
                  href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/mcpa.constructionandsupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@mcpa.construction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="px-5 sm:px-7 py-3.5 bg-neutral-50 dark:bg-[#0c0e14] border-t border-neutral-100 dark:border-neutral-800 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-center"
          >
            Back to Website
          </button>

          <button
            type="button"
            onClick={handleGoToPortal}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open Active Inquiry in Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
