"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import ArchitecturalClipboardInquiry from "@/modules/book/components/ArchitecturalClipboardInquiry";
import BookingAuthModal from "@/modules/book/components/BookingAuthModal";
import SingleInquiryPolicyModal from "@/modules/shared/SingleInquiryPolicyModal";
import { verifyClientActiveInquiry } from "@/modules/shared/inquiryPolicyHelper";
import { useLanguage } from "@/modules/shared/LanguageContext";
import { getStoredClientUser, isClientAuthenticated } from "@/modules/shared/bookingAuthHelper";
import {
  FolderKanban,
  ShieldAlert,
  ArrowRight,
  Compass,
  Phone,
  Copy,
  Check,
  Building2,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const isFil = language === "fil";

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active Inquiry Policy Check States
  const [isCheckingPolicy, setIsCheckingPolicy] = useState(false);
  const [hasActiveInquiry, setHasActiveInquiry] = useState(false);
  const [activeInquiryData, setActiveInquiryData] = useState(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Extract selected style or project preference from URL parameters
  const selectedStyle = useMemo(() => {
    return searchParams?.get("style") || searchParams?.get("interest") || "";
  }, [searchParams]);

  // Construct current target URL with query params to preserve user intent
  const currentUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `/book?${qs}` : "/book";
  }, [searchParams]);

  // Check client authentication on mount & listen for multi-tab/event changes
  useEffect(() => {
    const checkAuth = () => {
      const user = getStoredClientUser();
      setCurrentUser(user);
      setIsLoadingAuth(false);
    };

    checkAuth();

    // Event listener for cross-tab or in-page storage updates
    const handleStorageChange = (e) => {
      if (e.key === "mcpa_client_user" || e.key === "mcpa_client_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Pre-flight check: If client is authenticated, verify single active inquiry policy
  useEffect(() => {
    if (!currentUser?.email) return;

    let isMounted = true;
    setIsCheckingPolicy(true);

    verifyClientActiveInquiry(currentUser.email)
      .then((res) => {
        if (!isMounted) return;
        if (res?.hasActiveInquiry && res?.activeInquiry) {
          setHasActiveInquiry(true);
          setActiveInquiryData(res.activeInquiry);
          // Automatically open bespoke policy modal on initial detection
          setIsPolicyModalOpen(true);
        } else {
          setHasActiveInquiry(false);
          setActiveInquiryData(null);
        }
      })
      .catch((err) => {
        console.warn("Active inquiry policy verification failed:", err);
      })
      .finally(() => {
        if (isMounted) setIsCheckingPolicy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleCopyPhone = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-500 relative chb-texture">
      {/* Top Sticky Navigation: Minimal brand bar (Logo & Account Icon only) */}
      <ClientNavbar isCompleted={true} minimal={true} />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden">
        {isLoadingAuth || isCheckingPolicy ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              {isCheckingPolicy
                ? isFil
                  ? "Sinusuri ang patakaran ng aktibong inquiry..."
                  : "Auditing active consultation quota..."
                : isFil
                ? "Sinusuri ang sesyon ng kliyente..."
                : "Verifying client session..."}
            </p>
          </div>
        ) : currentUser ? (
          hasActiveInquiry ? (
            /* BLOCKED STATE: Bespoke Architectural Locked Dossier View */
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto">
              <div className="relative rounded-[22px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden">
                {/* Architectural top golden precision accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />

                <div className="p-6 sm:p-10 space-y-7">
                  {/* Protocol Badge & Header */}
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>MCPA Technical Protocol · 1 Active Inquiry Limit</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                      Active Architectural Consultation on Record
                    </h1>

                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl">
                      Hello, <strong className="text-neutral-900 dark:text-white font-semibold">{currentUser.fullName || currentUser.full_name || currentUser.email}</strong>. 
                      To preserve our rigorous engineering standards and dedicated structural oversight, MCPA enforces a strict{" "}
                      <strong className="text-neutral-900 dark:text-white font-semibold">single active project consultation policy per client</strong>.
                    </p>
                  </div>

                  {/* ACTIVE BRIEF DOSSIER CARD */}
                  <div className="rounded-[16px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <FolderKanban className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                            Active Reference Code
                          </span>
                          <span className="font-mono text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                            {activeInquiryData?.submissionId || activeInquiryData?.submission_id || "MCPA-ACTIVE"}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{activeInquiryData?.status || "Under Technical Review"}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                          Project Scope
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate block">
                          {activeInquiryData?.projectType || "Residential Design & Build"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                          Site Location
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate block">
                          {activeInquiryData?.location || "Bulacan / Metro Manila"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                          Account Email
                        </span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate block">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RATIONALE NOTE */}
                  <div className="p-4 rounded-[14px] bg-amber-500/[0.07] border border-amber-500/25 flex items-start gap-3.5">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        Why is multi-booking restricted?
                      </h3>
                      <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                        Each architectural project is assigned a dedicated resident civil engineer and licensed PRC architect. We commit full engineering time, soil-bearing evaluations, and bespoke 3D blueprints to one project at a time to ensure our 15-year structural warranty is never compromised.
                      </p>
                    </div>
                  </div>

                  {/* DIRECT CONTACT DESK */}
                  <div className="p-4 sm:p-5 rounded-[14px] bg-neutral-100 dark:bg-[#151922] border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                        Need to update plans or request clearance for multiple titled lots?
                      </div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        Engr. Aris Reyes <span className="font-normal text-xs text-neutral-500">· Senior Project Management</span>
                      </div>
                      <div className="font-mono text-xs text-amber-600 dark:text-amber-400">
                        +63 949 775 8239 (Calls &amp; Viber)
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href="tel:+639497758239"
                        className="px-4 py-2 rounded-[8px] bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono text-xs font-bold uppercase hover:opacity-90 transition-opacity inline-flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Direct Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone("+63 949 775 8239")}
                        className="px-3.5 py-2 rounded-[8px] border border-neutral-300 dark:border-white/15 hover:bg-neutral-200/60 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPhone ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTONS */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 dark:border-white/10">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        href="/"
                        className="w-full sm:w-auto px-5 py-3 rounded-[8px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 transition-colors text-center cursor-pointer"
                      >
                        Back to Website
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsPolicyModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-3 rounded-[8px] border border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-xs font-mono font-bold uppercase transition-colors text-center cursor-pointer"
                      >
                        View Full Policy
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/portal?tab=inquiries")}
                      className="w-full sm:w-auto px-6 py-3 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/25 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Open Dossier in Client Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED USER WITH ZERO ACTIVE INQUIRY: Directly display the Architectural Clipboard Form */
            <ArchitecturalClipboardInquiry
              selectedStyle={selectedStyle}
              currentUser={currentUser}
            />
          )
        ) : (
          /* UNAUTHENTICATED USER: Show background placeholder and prominent Auth Gate Modal */
          <BookingAuthModal isOpen={true} redirectUrl={currentUrl} selectedStyle={selectedStyle} />
        )}
      </main>

      {/* SINGLE INQUIRY BESPOKE ARCHITECTURAL POLICY MODAL */}
      <SingleInquiryPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        activeInquiry={activeInquiryData}
        currentUser={currentUser}
        onOpenPortal={() => {
          setIsPolicyModalOpen(false);
          router.push("/portal?tab=inquiries");
        }}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] flex items-center justify-center text-amber-500 font-mono text-xs">
          Loading Booking Engine...
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
