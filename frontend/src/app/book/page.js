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

    const clientUid = currentUser.userId || currentUser.id || currentUser.user_id || null;
    verifyClientActiveInquiry(currentUser.email, clientUid)
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
              <div className="relative rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden">
                {/* Architectural top golden precision accent */}
                <div className="h-1 bg-amber-500" />

                <div className="p-6 sm:p-10 space-y-8">
                  {/* Protocol Header (No pill badge, no pulsing dot) */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      MCPA Architectural Protocol
                    </p>

                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Active Architectural Consultation on Record
                    </h1>

                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl pt-1">
                      Hello, <strong className="text-neutral-900 dark:text-white font-semibold">{currentUser.fullName || currentUser.full_name || currentUser.email}</strong>. 
                      To preserve our engineering standards and dedicated structural oversight, MCPA maintains a strict single active project consultation policy per client.
                    </p>
                  </div>

                  {/* ACTIVE BRIEF SPECIFICATIONS (Clean architectural grid, no pill badges, no dots, no box backgrounds on text) */}
                  <div className="py-5 border-y border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Reference Code
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-neutral-900 dark:text-white font-mono">
                        {activeInquiryData?.submissionId || activeInquiryData?.submission_id || "MCPA-ACTIVE"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Current Stage
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {activeInquiryData?.status || "Consultation Under Review"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Project Scope
                      </span>
                      <span className="mt-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {activeInquiryData?.projectType || "Residential Design & Build"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Site Location
                      </span>
                      <span className="mt-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {activeInquiryData?.location || "Bulacan / Metro Manila"}
                      </span>
                    </div>
                  </div>

                  {/* EDITORIAL RATIONALE (Left hairline accent, transparent background, no yellow box, no dots) */}
                  <div className="border-l-2 border-amber-500 pl-4 py-1 space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Why is multi-booking restricted?
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                      Each architectural project is assigned a dedicated resident civil engineer and licensed PRC architect. We commit full engineering time, soil-bearing evaluations, and bespoke 3D blueprints to one project at a time to ensure our 15-year structural warranty is never compromised.
                    </p>
                  </div>

                  {/* OFFICIAL CONTACT CHANNELS (Official Viber/mobile & social media) */}
                  <div className="space-y-4 pt-1">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Official Consultation &amp; Support Channels
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                        Need to update plans, add titled lots, or request multi-project clearance? Reach our official channels:
                      </p>
                    </div>

                    {/* Direct Viber & Phone Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 border-y border-neutral-200 dark:border-neutral-800">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block">
                          Direct Mobile &amp; Viber
                        </span>
                        <a
                          href="tel:+639497758239"
                          className="text-base font-semibold text-neutral-900 dark:text-white font-mono hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          +63 949 775 8239
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href="tel:+639497758239"
                          className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Direct Call</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone("+63 949 775 8239")}
                          className="px-3.5 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPhone ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Official Social Media Links (Pure icons without background boxes) */}
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block mb-2.5">
                        Official Social Media
                      </span>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                        <a
                          href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <FacebookIcon className="w-4 h-4" />
                          <span>Facebook</span>
                        </a>
                        <a
                          href="https://www.instagram.com/mcpa.constructionandsupply/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                        >
                          <InstagramIcon className="w-4 h-4" />
                          <span>Instagram</span>
                        </a>
                        <a
                          href="https://www.tiktok.com/@mcpa.construction"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                          <TikTokIcon className="w-4 h-4" />
                          <span>TikTok</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTONS */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Link
                        href="/"
                        className="w-full sm:w-auto px-4 py-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors text-center cursor-pointer"
                      >
                        Back to Website
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsPolicyModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline transition-colors text-center cursor-pointer"
                      >
                        View Full Policy
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/portal?tab=inquiries")}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Open Dossier in Client Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
