"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import UtilityBar from "@/modules/shared/UtilityBar";
import { useLanguage } from "@/modules/shared/LanguageContext";
import PortalAuthCard from "@/modules/portal/components/PortalAuthCard";
import PortalAuthShowcase from "@/modules/portal/components/PortalAuthShowcase";
import PortalInquiryModal from "@/modules/portal/components/PortalInquiryModal";
import {
  ShieldCheckIcon,
  CheckIcon,
  CalendarIcon,
  MapPinIcon,
  ExternalLinkIcon,
  ClockIcon,
  LogOutIcon,
  HomeIcon,
  FolderKanbanIcon,
  BuildingIcon,
  VideoIcon,
  FileTextIcon,
  UserIcon,
  PlaneIcon,
  PhoneIcon,
} from "@/modules/shared/Icons";

export default function ClientPortalPage() {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active view tab
  const [portalTab, setPortalTab] = useState("inquiries"); // "inquiries" | "construction" | "profile"
  const [inquiries, setInquiries] = useState([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // Construction project (if active)
  const [siteProject, setSiteProject] = useState(null);
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);

  // Modal state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // 1. Check existing client session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("mcpa_client_user");
      const savedToken = localStorage.getItem("mcpa_client_token");

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setAuthToken(savedToken);
        } catch (e) {
          console.warn("User parse error:", e);
        }
      }
      setIsLoadingAuth(false);
    }
  }, []);

  // 2. Fetch inquiries when user is logged in
  const fetchClientData = async (userEmail) => {
    if (!userEmail) return;
    setIsLoadingInquiries(true);

    try {
      const res = await fetch(`/api/client/inquiries?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.briefs) && data.briefs.length > 0) {
        setInquiries(data.briefs);
      } else {
        // Fallback to local storage briefs matching email
        const storedBriefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
        const matched = storedBriefs.filter(
          (b) => (b.clientEmail || b.client_email || "").toLowerCase() === userEmail.toLowerCase()
        );
        setInquiries(matched);
      }
    } catch (e) {
      const storedBriefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
      const matched = storedBriefs.filter(
        (b) => (b.clientEmail || b.client_email || "").toLowerCase() === userEmail.toLowerCase()
      );
      setInquiries(matched);
    } finally {
      setIsLoadingInquiries(false);
    }

    // Also fetch construction site execution status
    try {
      const siteRes = await fetch("/api/construction/project").then((r) => r.json());
      if (siteRes.success && siteRes.project) {
        setSiteProject(siteRes.project);
        setSiteMilestones(siteRes.milestones || []);
        setSitePhotos(siteRes.photos || []);
        setBillingLedger(siteRes.billing || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchClientData(currentUser.email);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem("mcpa_client_user", JSON.stringify(user));
      if (token) localStorage.setItem("mcpa_client_token", token);
    }
    showToast(`Welcome to your Client Portal, ${user.fullName || "Valued Client"}!`);
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to sign out of the Client Portal?")) return;
    setCurrentUser(null);
    setAuthToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mcpa_client_user");
      localStorage.removeItem("mcpa_client_token");
    }
    showToast("Signed out successfully.");
  };

  const handleNewInquirySuccess = (newBrief) => {
    setInquiries((prev) => [newBrief, ...prev]);
    showToast(`Inquiry ${newBrief.submission_id} submitted! Confirmation email dispatched.`);
    if (currentUser?.email) fetchClientData(currentUser.email);
  };

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-white flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING MCPA CLIENT PORTAL...</span>
        </div>
      </div>
    );
  }

  // Active Pending Inquiries count (for quota limit)
  const activeInquiriesCount = inquiries.filter(
    (b) => (b.status || "Pending Review") === "Pending Review" || (b.status || "") === "Meeting Scheduled"
  ).length;

  // UNAUTHENTICATED STATE: Clean, Focused 2-Column Split-Screen Auth Page With Top Utility Bar
  if (!currentUser) {
    return (
      <div className="min-h-screen min-[920px]:h-screen min-[920px]:overflow-hidden mcpa-dot-grid bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans transition-colors duration-500 scroll-smooth">
        {/* Top Utility Bar with Language Switcher, Announcements, Theme & Help Center */}
        <UtilityBar show={true} />

        <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 min-[920px]:px-8 min-[920px]:py-1.5 max-w-7xl mx-auto w-full min-h-0">
          {/* Header Bar with Back Link */}
          <header className="w-full flex items-center justify-start py-0.5 shrink-0 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform font-bold">←</span>
              <span>{language === "fil" ? "Bumalik sa MCPA Website" : "Back to MCPA Website"}</span>
            </Link>
          </header>

          {/* Split Screen Container: Showcase + Auth Card */}
          {/* On desktop/laptop (>= 920px): side-by-side fit to screen! */}
          {/* On mobile (< 920px): Login Card is fitted to the mobile screen (100dvh), and the showcase is scrolled into view below it! */}
          <main className="w-full flex-1 flex flex-col min-[920px]:flex-row items-center justify-between min-[920px]:gap-8 py-1 min-h-0 my-auto">
            {/* Left Column (Desktop) / Bottom Section (Mobile): Dynamic Floating Showcase */}
            <div
              id="portal-showcase"
              className="w-full min-[920px]:w-1/2 flex flex-col items-center min-[920px]:items-start justify-center order-2 min-[920px]:order-1 pt-12 pb-8 min-[920px]:py-0 border-t border-neutral-200/50 dark:border-white/5 min-[920px]:border-t-0"
            >
              <PortalAuthShowcase />

              {/* Back to top login link on mobile */}
              <div className="min-[920px]:hidden mt-6 text-center">
                <a
                  href="#portal-auth"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <span>{language === "fil" ? "Bumalik sa Log in" : "Back to Log in"}</span>
                  <span className="font-bold">↑</span>
                </a>
              </div>
            </div>

            {/* Right Column (Desktop) / Top Screen (Mobile): Auth Card Fitted to Viewport */}
            <div
              id="portal-auth"
              className="w-full min-[920px]:w-1/2 flex flex-col justify-center items-center order-1 min-[920px]:order-2 min-h-[calc(100vh-4.5rem)] min-h-[calc(100dvh-4.5rem)] min-[920px]:min-h-0 py-1 min-[920px]:py-0"
            >
              <PortalAuthCard onLoginSuccess={handleLoginSuccess} />

              {/* Mobile Scroll Indicator: guides user that showcase is below the fold */}
              <div className="min-[920px]:hidden mt-2.5 text-center">
                <a
                  href="#portal-showcase"
                  className="group inline-flex items-center gap-1 text-[11.5px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <span>{language === "fil" ? "I-scroll upang makita ang mga tampok" : "Scroll to view showcase & features"}</span>
                  <span className="group-hover:translate-y-0.5 transition-transform text-amber-500 font-bold">↓</span>
                </a>
              </div>
            </div>
          </main>

          {/* Minimal Footer (Compact) */}
          <footer className="w-full py-1.5 border-t border-neutral-200/60 dark:border-white/5 text-[10px] font-mono text-neutral-400 flex items-center justify-center gap-1 shrink-0 z-10 text-center">
            <span>© {new Date().getFullYear()} MCPA Construction & Supply. {language === "fil" ? "Lahat ng karapatan ay nakalaan." : "All rights reserved."}</span>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-500">
      {/* Top Navbar */}
      <ClientNavbar isCompleted={true} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-[4px] bg-emerald-500 text-neutral-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* AUTHENTICATED STATE: Complete Client Dashboard */}
        <div className="space-y-8">
            {/* Executive Client Header: Architectural Black Card with CLIENT ACCOUNT PORTAL Title */}
            <div className="rounded-[8px] bg-neutral-950 dark:bg-[#0a0c10] border border-neutral-800 dark:border-white/10 p-6 sm:p-8 shadow-xl flex flex-col gap-6 text-white relative overflow-hidden">
              {/* Top Banner Tag / Title: CLIENT ACCOUNT PORTAL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-amber-400 uppercase">
                    CLIENT ACCOUNT PORTAL
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  MCPA Architectural &amp; Construction Engineering Management
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Initials Avatar */}
                  <div className="w-14 h-14 rounded-[6px] bg-amber-500 text-neutral-950 font-extrabold text-lg flex items-center justify-center shrink-0 font-mono shadow-sm">
                    {currentUser.fullName
                      ? currentUser.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "GC"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {currentUser.fullName || "Valued Client"}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-[4px] bg-amber-500/20 text-amber-300 border border-amber-500/35 text-xs font-semibold flex items-center gap-1">
                        {currentUser.clientType === "OFW" ? (
                          <>
                            <PlaneIcon className="w-3.5 h-3.5" />
                            <span>OFW Client</span>
                          </>
                        ) : (
                          <span>Local Resident</span>
                        )}
                      </span>
                      {currentUser.hasViberWhatsapp && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px] font-mono font-semibold">
                          Viber / WhatsApp Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-neutral-400 flex flex-wrap items-center gap-3">
                      <span className="text-neutral-300">{currentUser.email}</span>
                      {currentUser.phoneNumber && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span>{currentUser.phoneNumber}</span>
                        </>
                      )}
                      {currentUser.locationAddress && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span>{currentUser.locationAddress}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons & Quota */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-[4px] bg-white/[0.06] border border-white/10 text-xs font-mono">
                    <span className="text-neutral-400 block text-[9.5px] uppercase">Active Inquiries Quota</span>
                    <span className="font-bold text-amber-400">
                      {activeInquiriesCount} of 3 Active
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="px-5 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2 cursor-pointer font-mono"
                  >
                    <span>+ Submit New Inquiry</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign out of Client Portal"
                    className="p-2.5 rounded-[4px] border border-white/15 text-neutral-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-white/10 gap-2 sm:gap-6 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPortalTab("inquiries")}
                className={`py-3 px-1 border-b-2 font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
                  portalTab === "inquiries"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <FolderKanbanIcon className="w-4 h-4" />
                <span>My Inquiries &amp; Consultations ({inquiries.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPortalTab("construction")}
                className={`py-3 px-1 border-b-2 font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
                  portalTab === "construction"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <BuildingIcon className="w-4 h-4" />
                <span>Active Site Progress</span>
              </button>

              <button
                type="button"
                onClick={() => setPortalTab("profile")}
                className={`py-3 px-1 border-b-2 font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
                  portalTab === "profile"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Client Profile &amp; Settings</span>
              </button>
            </div>

            {/* TAB 1: INQUIRIES & CONSULTATIONS */}
            {portalTab === "inquiries" && (
              <div className="space-y-4">
                {isLoadingInquiries ? (
                  <div className="p-12 text-center text-xs font-mono text-neutral-400">
                    Loading your consultation briefs...
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                      <FolderKanbanIcon className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        No Active Inquiries Found
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1">
                        You have not submitted any architectural project briefs yet. Click the button below to start your dream design and build consultation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(true)}
                      className="px-6 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <span>Start First Project Inquiry</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {inquiries.map((brief, idx) => {
                      const id = brief.submission_id || brief.submissionId || `MCPA-CPB-${brief.brief_id || idx}`;
                      const status = brief.status || "Pending Review";
                      const mapCoord = brief.map_coordinates || brief.mapCoordinates;
                      const hasF2F = brief.venue_type || (brief.meeting_mode && brief.meeting_mode.includes("In-Person"));

                      return (
                        <div
                          key={id}
                          className="rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-5"
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10 pb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                  Ref: {id}
                                </span>
                                {brief.client_portal_code && (
                                  <span className="px-2 py-0.5 rounded-[3px] bg-neutral-100 dark:bg-white/10 text-[9.5px] font-mono font-bold">
                                    CODE: {brief.client_portal_code}
                                  </span>
                                )}
                              </div>
                              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                                {brief.project_type || brief.projectType || "Residential Design & Build"}
                              </h2>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                                Style: {brief.preferred_style || brief.preferredStyle || "Contemporary Modern"} • Budget: {brief.budget_range || brief.budgetRange || "Flexible"}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                              <span
                                className={`px-3 py-1 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                  status.includes("Approved")
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                    : status.includes("Meeting")
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                    : "bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-white/10"
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                {status}
                              </span>
                            </div>
                          </div>

                          {/* 5-Phase Workflow Stepper */}
                          <div>
                            <span className="block text-[10px] font-mono uppercase text-neutral-400 mb-2">
                              SAAD Flowchart Workflow Stage:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-mono">
                              {[
                                { step: "1. Lodged", isDone: true, isActive: status === "Pending Review" },
                                { step: "2. Arch Review", isDone: status !== "Pending Review", isActive: status === "Pending Review" },
                                { step: "3. Consultation", isDone: status.includes("Meeting") || status.includes("Approved"), isActive: status.includes("Meeting") },
                                { step: "4. Cost Estimate", isDone: Boolean(brief.quotation_amount || status.includes("Approved")), isActive: Boolean(brief.quotation_amount) },
                                { step: "5. Site Mobilization", isDone: status.includes("Approved"), isActive: status.includes("Approved") },
                              ].map((st, sidx) => (
                                <div
                                  key={sidx}
                                  className={`p-2 rounded-[4px] border ${
                                    st.isActive
                                      ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                                      : st.isDone
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                                      : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-400"
                                  }`}
                                >
                                  {st.step}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Meeting Itinerary & Pinned Lot Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {/* Consultation Box */}
                            <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10 space-y-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                Consultation Itinerary
                              </span>
                              <div className="text-xs space-y-1">
                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  Mode: {brief.venue_type ? `In-Person (${brief.venue_type})` : (brief.meeting_mode || "Online Meeting")}
                                </p>
                                {brief.venue_details && (
                                  <p className="text-neutral-600 dark:text-neutral-400">
                                    <strong>Venue:</strong> {brief.venue_details}
                                  </p>
                                )}
                                <p className="text-neutral-600 dark:text-neutral-400">
                                  <strong>Slot:</strong> {brief.meeting_date || "Earliest Slot"} ({brief.meeting_time || "02:00 PM PHT"})
                                </p>
                                <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                                  Status: {brief.availability_status || "Pending Availability Confirmation"}
                                </p>
                                {brief.meeting_link && (
                                  <a
                                    href={brief.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono pt-1"
                                  >
                                    <VideoIcon className="w-3.5 h-3.5" />
                                    <span>Join Google Meet Session →</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Property & Coordinates Box */}
                            <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10 space-y-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-amber-500" />
                                Property Geolocation
                              </span>
                              <div className="text-xs space-y-1">
                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  Location: {brief.location || "Bulacan"}
                                </p>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                  Lot Area: {brief.lot_area || "N/A"} • Status: {brief.lot_status || "Titled"}
                                </p>
                                {mapCoord && (
                                  <div className="pt-1 flex items-center justify-between">
                                    <span className="text-[11px] font-mono text-neutral-500">
                                      GPS: {mapCoord}
                                    </span>
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${mapCoord}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline"
                                    >
                                      <span>View on Map</span>
                                      <ExternalLinkIcon className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ACTIVE CONSTRUCTION PROGRESS */}
            {portalTab === "construction" && (
              <div className="space-y-6">
                {!siteProject ? (
                  <div className="rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-12 text-center space-y-3">
                    <BuildingIcon className="w-10 h-10 text-neutral-400 mx-auto" />
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      No Construction Site Active Yet
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                      Once your consultation is finalized and contract documents are executed, live Gantt milestones, 360° inspection logs, and billing statements will stream here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Live Progress Card */}
                    <div className="rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-6 sm:p-7 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">
                            Active Project: {siteProject.project_code}
                          </span>
                          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {siteProject.name}
                          </h2>
                          <p className="text-xs text-neutral-500 font-mono">
                            Lead Engineer: {siteProject.lead_engineer || "Engr. Quirante"} • Location: {siteProject.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-extrabold font-mono text-amber-500">
                            {siteProject.progress_pct || 0}%
                          </span>
                          <span className="block text-[10px] font-mono text-neutral-400 uppercase">
                            Overall Turnover Completion
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 rounded-[3px] bg-neutral-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${siteProject.progress_pct || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-6">
                      <h3 className="text-sm font-mono uppercase font-bold text-neutral-900 dark:text-white mb-4">
                        Phase Execution Milestones
                      </h3>
                      <div className="space-y-3">
                        {siteMilestones.map((m) => (
                          <div
                            key={m.milestone_id}
                            className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                                {m.phase_name}
                              </div>
                              <div className="text-[11px] text-neutral-400">
                                Target Date: {m.target_date || "Scheduled"} • Weight: {m.weight}%
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold ${
                                m.status === "Completed"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : m.status === "In Progress"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-neutral-500/10 text-neutral-400"
                              }`}
                            >
                              {m.status} ({m.completion_pct}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CLIENT PROFILE & SETTINGS */}
            {/* TAB 3: CLIENT PROFILE & SETTINGS */}
            {portalTab === "profile" && (
              <div className="max-w-3xl rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    {/* Biometric KYC Avatar Portrait */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-neutral-900 shrink-0 shadow-md">
                      {currentUser.avatarUrl || currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatarUrl || currentUser.avatar_url}
                          alt={currentUser.fullName || "Client Selfie"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-500/20 text-amber-500 font-bold font-mono text-xl">
                          {(currentUser.fullName || "CL").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-[#0f121a]">
                        <CheckIcon className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {currentUser.fullName || "Client Account"}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10.5px] font-semibold font-mono">
                          <ShieldCheckIcon className="w-3 h-3" />
                          <span>Biometric KYC Verified</span>
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          ID: #{String(currentUser.userId || currentUser.user_id || "CL").padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-neutral-400">
                    Auth: <strong className="text-neutral-700 dark:text-neutral-200 uppercase">{currentUser.authProvider || "Local / Password"}</strong>
                  </span>
                </div>

                <div className="space-y-6 text-xs">
                  {/* 1. Personal & Contact Profile */}
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>1. Personal &amp; Demographic Profile</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10">
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Full Legal Name</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{currentUser.fullName || currentUser.full_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Email Address</span>
                        <span className="font-mono text-neutral-900 dark:text-white font-medium">{currentUser.email}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Mobile Number</span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-mono text-neutral-900 dark:text-white font-medium">{currentUser.phoneNumber || currentUser.phone_number || "—"}</span>
                          {(currentUser.hasViberWhatsapp || currentUser.has_viber_whatsapp) && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9.5px] font-bold">
                              Viber / WA
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Date of Birth &amp; Age</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {currentUser.birthDate || currentUser.birth_date
                            ? `${currentUser.birthDate || currentUser.birth_date}${(() => {
                                const b = currentUser.birthDate || currentUser.birth_date;
                                const d = new Date(b);
                                if (isNaN(d.getTime())) return "";
                                const now = new Date();
                                let age = now.getFullYear() - d.getFullYear();
                                const m = now.getMonth() - d.getMonth();
                                if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
                                return age >= 0 && age < 120 ? ` (${age} yrs old)` : "";
                              })()}`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Civil Status</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{currentUser.civilStatus || currentUser.civil_status || "Single"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Spouse Name</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {currentUser.spouseName || currentUser.spouse_name || "N/A (Single / Unmarried)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Emergency Contact Person</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {currentUser.emergencyContact || currentUser.emergency_contact || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Preferred Calling Window</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {currentUser.preferredContactTime || currentUser.preferred_contact_time || "Anytime (PH Daytime)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Client Demographic</span>
                        <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                          {currentUser.clientType === "OFW" || currentUser.client_type === "OFW" ? (
                            <>
                              <PlaneIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>Overseas Filipino Worker (OFW)</span>
                            </>
                          ) : (
                            <>
                              <MapPinIcon className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Local Resident (PH)</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Residential Address</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{currentUser.locationAddress || currentUser.location_address || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Employment & Financial Demographics */}
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                      <BuildingIcon className="w-3.5 h-3.5" />
                      <span>2. Employment &amp; Financial Demographics</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10">
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Occupation / Profession</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{currentUser.occupation || "Not declared"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Employer / Business Firm</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{currentUser.employerName || currentUser.employer_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Monthly Income Bracket</span>
                        <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">{currentUser.monthlyIncome || currentUser.monthly_income || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Architectural Project & Lot Specifications */}
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                      <HomeIcon className="w-3.5 h-3.5" />
                      <span>3. Architectural Project &amp; Lot Specifications</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10">
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Target Project</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {currentUser.targetProjectType || currentUser.target_project_type || "Custom Residential"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Lot Ownership Status</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {currentUser.lotOwnershipStatus || currentUser.lot_ownership_status || "Titled Lot (Clean Title)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-mono uppercase">Target Build Location</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {currentUser.targetBuildLocation || currentUser.target_build_location || currentUser.locationAddress || currentUser.location_address || "—"}
                        </span>
                      </div>
                      {(currentUser.subdivisionLotDetails || currentUser.subdivision_lot_details) && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <span className="text-neutral-400 block text-[10px] font-mono uppercase">Subdivision / Block &amp; Lot Specifications</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {currentUser.subdivisionLotDetails || currentUser.subdivision_lot_details}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. OFW Representative (if applicable) */}
                  {(currentUser.clientType === "OFW" || currentUser.client_type === "OFW") && (
                    <div>
                      <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                        <PlaneIcon className="w-3.5 h-3.5" />
                        <span>4. Overseas Worker &amp; Local Representative</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10">
                        <div>
                          <span className="text-neutral-400 block text-[10px] font-mono uppercase">Host Country</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {currentUser.ofwCountry || currentUser.ofw_country || "Overseas"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] font-mono uppercase">PH Representative</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {currentUser.phRepName || currentUser.ph_rep_name || "—"}
                            {(currentUser.phRepRelationship || currentUser.ph_rep_relationship) && (
                              <span className="text-neutral-500 text-[10px] block">
                                ({currentUser.phRepRelationship || currentUser.ph_rep_relationship})
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] font-mono uppercase">Representative Contact</span>
                          <span className="font-mono text-neutral-800 dark:text-neutral-200">
                            {currentUser.phRepPhone || currentUser.ph_rep_phone || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>RA 10173 Data Privacy Protection Secured</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-[4px] border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Sign Out of Portal
                  </button>
                </div>
              </div>
            )}
          </div>
      </main>

      {/* NEW INQUIRY MODAL */}
      <PortalInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        currentUser={currentUser}
        onSuccess={handleNewInquirySuccess}
      />
    </div>
  );
}
