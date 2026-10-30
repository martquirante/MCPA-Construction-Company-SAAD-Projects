"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sparkles,
  Share2,
  Calendar,
  Layers,
  HardHat,
  Copy,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  FileText,
  Compass,
  Camera,
  CreditCard,
  FolderKanban,
  ArrowRight,
  User,
  CheckCircle2,
  Download,
  Clock,
  Award,
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";
import { authFetch } from "@/modules/shared/authFetch";
import FinishedProjectDossierCard from "@/modules/shared/FinishedProjectDossierCard";
import WrappedStoryExperience from "@/modules/wrapped/WrappedStoryExperience";
import { setThemePreference } from "@/modules/shared/SystemThemeSync";

export default function PortalStage4FinishedProject({
  activeProject,
  currentUser,
  showToast = () => {},
  onStartInquiry = () => {},
  onSelectTab = () => {},
  inquiries = [],
  billingLedger = [],
  sitePhotos = [],
  mode = "overview",
}) {
  const projectId = activeProject?.client_project_id;
  const [dossier, setDossier] = useState(null);
  const [wrapped, setWrapped] = useState(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);
  const [isLoadingDossier, setIsLoadingDossier] = useState(true);
  const [portalTheme, setPortalTheme] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const handleThemeChange = (event) => {
      setPortalTheme(event.detail?.isDark ? "dark" : "light");
    };
    window.addEventListener("mcpa-theme-change", handleThemeChange);
    return () => window.removeEventListener("mcpa-theme-change", handleThemeChange);
  }, []);

  const handleWrappedThemeChange = (nextTheme) => {
    setThemePreference(nextTheme);
  };

  // Load Dossier & Wrapped Data
  useEffect(() => {
    if (!projectId) return;
    let isCancelled = false;

    async function fetchData() {
      try {
        const [dossierRes, wrappedRes] = await Promise.all([
          authFetch("/api/finished-projects"),
          authFetch(`/api/projects/${projectId}/wrapped`),
        ]);
        const dossierData = await dossierRes.json();
        const wrappedData = await wrappedRes.json();

        if (isCancelled) return;

        if (dossierData.success && Array.isArray(dossierData.projects)) {
          const found = dossierData.projects.find((p) => p.clientProjectId === projectId);
          if (found) setDossier(found);
        }

        if (wrappedData.success && wrappedData.wrapped) {
          setWrapped(wrappedData.wrapped);

          // Auto-launch Onboarding if first time entering Stage 4
          const hasCompletedOnboarding = Boolean(wrappedData.wrapped.onboarding_completed_at);
          const storageKey = `mcpa_wrapped_onboarded_${projectId}`;
          let localSeen = false;
          try {
            localSeen = localStorage.getItem(storageKey) === "true";
          } catch {}

          if (!hasCompletedOnboarding && !localSeen && mode === "overview") {
            setIsOnboardingActive(true);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("[PortalPhase5Wrapped] Error loading data:", err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDossier(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [projectId, mode]);

  // Handle Onboarding Completion
  const handleCompleteOnboarding = async () => {
    setIsOnboardingActive(false);
    if (!projectId) return;
    try {
      localStorage.setItem(`mcpa_wrapped_onboarded_${projectId}`, "true");
      await authFetch(`/api/projects/${projectId}/wrapped/onboarding-seen`, {
        method: "PATCH",
      });
      showToast("Welcome to your Finished Project Monograph!");
    } catch (e) {
      console.warn("Could not stamp onboarding seen:", e);
    }
  };

  const shareToken = wrapped?.share_token || dossier?.wrapped?.shareToken;
  const publicShareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/wrapped/${shareToken}`
    : `/wrapped/${shareToken || ""}`;

  const copyShareLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && shareToken) {
      navigator.clipboard.writeText(publicShareUrl);
      showToast("Public Wrapped recap link copied to clipboard!");
    }
  };

  // Dedicated Wrapped tab mode
  if (mode === "wrapped") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[6px] border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#101218]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-transparent text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                12-Chapter Retrospective
              </span>
              <span className="font-mono text-xs text-neutral-400">
                • {activeProject?.project_code || "MCPA-BUILD"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-neutral-900 dark:text-white mt-1">
              Project Wrapped Monograph
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-0.5">
              Interactive data-driven story from Day-1 inquiry intake to final turnover. Download 9:16 slides for Instagram Story or share your recap link.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {shareToken && (
              <button
                type="button"
                onClick={copyShareLink}
                className="px-3.5 py-2 rounded-[4px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Share Link</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab("overview")}
              className="px-3.5 py-2 rounded-[4px] bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Back to Finished Project</span>
            </button>
          </div>
        </div>

        {wrapped?.wrapped_payload ? (
          <div className="w-full min-h-[750px] sm:min-h-[820px] rounded-[8px] overflow-hidden border border-neutral-200 dark:border-white/10 shadow-xl bg-black relative flex items-center justify-center p-2 sm:p-4">
            <WrappedStoryExperience
              payload={wrapped.wrapped_payload}
              initialTheme={portalTheme}
              controlledTheme={portalTheme}
              onThemeChange={handleWrappedThemeChange}
              mode="embedded"
              shareToken={shareToken}
            />
          </div>
        ) : isLoadingDossier ? (
          <div className="p-16 text-center rounded-[6px] border border-neutral-200 dark:border-white/10 font-mono text-xs text-neutral-400 animate-pulse">
            COMPILING 12-CHAPTER WRAPPED MONOGRAPH...
          </div>
        ) : (
          <div className="p-16 text-center rounded-[6px] border border-neutral-200 dark:border-white/10 font-mono text-xs text-neutral-400">
            No Wrapped monograph records generated for this project yet.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. CELEBRATION HEADER BANNER */}
      <div className="relative overflow-hidden rounded-[8px] border border-amber-500/30 bg-white dark:bg-[#0e1117] p-6 sm:p-10 shadow-xs dark:shadow-2xl text-neutral-900 dark:text-white transition-colors">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Precision Registration Marks */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
          ┌
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none pointer-events-none">
          ┐
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-2 py-0.5 rounded bg-transparent text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                100% Commissioned & Handed Over
              </span>
              <span className="font-mono text-xs text-neutral-400">
                • {activeProject?.project_code || "MCPA-BUILD"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
              Your Residence is Complete.
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
              Every foundation footing, structural column, and bespoke finish of <span className="font-bold text-amber-600 dark:text-amber-400">{activeProject?.project_title || "Your Residence"}</span> has passed final turnover commissioning. Your 12-Chapter Project Wrapped and complete Day-1 Inquiry to Handover records are ready.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => setIsWrappedModalOpen(true)}
                className="px-5 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Replay 12-Chapter Wrapped</span>
              </button>

              {shareToken && (
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="px-4 py-2.5 rounded-[4px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Wrapped Link</span>
                </button>
              )}

              <button
                type="button"
                onClick={onStartInquiry}
                className="px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Start New Build</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-[6px] bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 shrink-0 text-center transition-colors">
            <LordIcon
              src="https://cdn.lordicon.com/lupuorrc.json"
              size={96}
              trigger="loop"
              colors="primary:#f59e0b,secondary:#64748b"
            />
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-2 uppercase tracking-widest font-bold">
              Key Handover Complete
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
              Monograph Archived
            </span>
          </div>
        </div>
      </div>

      {/* 2. FINISHED PROJECT ARCHITECTURAL DOSSIER CARD WITH COMPLETE DAY-1 HISTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 font-bold">
            Architectural Dossier &amp; End-to-End Build Journey
          </span>
          <span className="text-[10px] font-mono text-amber-500 font-semibold">
            Stage 4 of 4 · Finished Project
          </span>
        </div>

        {dossier ? (
          <FinishedProjectDossierCard
            dossier={dossier}
            audience="client"
            onLaunchWrapped={() => setIsWrappedModalOpen(true)}
            showToast={showToast}
          />
        ) : isLoadingDossier ? (
          <div className="p-12 text-center rounded-[6px] border border-neutral-200 dark:border-white/10 font-mono text-xs text-neutral-400 animate-pulse">
            LOADING PROJECT DOSSIER & HISTORY...
          </div>
        ) : null}
      </div>

      {/* 3. STAGE 4 EXECUTIVE SUMMARY TILES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 font-bold">
            Stage 4 Completed Portals &amp; Records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Project Photo Vault */}
          <div
            onClick={() => onSelectTab && onSelectTab("gallery")}
            className="group p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="text-sky-500">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sky-600 dark:text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                {sitePhotos.length} Master Photos
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Project Archive</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Photo Vault &amp; Drone Clips
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Curated visual inspection records from ground excavation to final turnover commissioning.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Open Photo Vault</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Billing & Official Receipts */}
          <div
            onClick={() => onSelectTab && onSelectTab("billing")}
            className="group p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="text-emerald-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                100% Settled
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Billing Statement</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Zero Balance Confirmed
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Official receipts and milestone clearance certs logged in project ledger.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Billing Records</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Inquiries / New Build */}
          <div
            onClick={() => onStartInquiry ? onStartInquiry() : (onSelectTab && onSelectTab("inquiries"))}
            className="group p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="text-amber-500">
                <FolderKanban className="w-6 h-6" />
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                Start New Build
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Future Build</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                New Project / Extension
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Planning a secondary home, pavilion expansion, or commercial structure?
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Start New Inquiry</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Homeowner Profile */}
          <div
            onClick={() => onSelectTab && onSelectTab("profile")}
            className="group p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="text-purple-500">
                <User className="w-6 h-6" />
              </div>
              <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                Homeowner
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase text-neutral-500">Client Profile</div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {currentUser?.fullName || currentUser?.full_name || "Valued Client"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {currentUser?.email || "Account Active"} · Profile and communication settings.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>View Profile</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. AS-BUILT MANUALS & HANDOVER CLEARANCE VAULT */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0e1117] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Digital Handover Vault (As-Built Plans &amp; Maintenance Manual)
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            Download your formal as-built architectural plans, MEP conduit diagrams, and building maintenance manuals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-amber-500 uppercase font-bold">Turnkey Handover</span>
              <h4 className="font-bold text-neutral-900 dark:text-white mt-0.5">
                Official Certificate of Acceptance &amp; Turnover
              </h4>
              <p className="text-[11px] font-sans text-neutral-500 mt-1">
                Formal turnover instrument executed upon key handover and commissioning sign-off.
              </p>
            </div>
            <a
              href="/api/legal/pdf/handover-warranty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Turnover Instrument (PDF)</span>
            </a>
          </div>

          <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-sky-500 uppercase font-bold">Homeowner Manual</span>
              <h4 className="font-bold text-neutral-900 dark:text-white mt-0.5">
                Complete As-Built MEP &amp; Finishes Guide
              </h4>
              <p className="text-[11px] font-sans text-neutral-500 mt-1">
                Concealed electrical lines, plumbing valve maps, and paint material specifications.
              </p>
            </div>
            <a
              href="/api/legal/pdf/handover-maintenance-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Maintenance Guide (PDF)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Auto-Onboarding Full-Screen Experience (Spotify Wrapped Style) */}
      {isOnboardingActive && wrapped?.wrapped_payload && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in">
          <WrappedStoryExperience
            payload={wrapped.wrapped_payload}
            initialTheme={portalTheme}
            controlledTheme={portalTheme}
            onThemeChange={handleWrappedThemeChange}
            onClose={handleCompleteOnboarding}
            mode="onboarding"
            onCompleteOnboarding={handleCompleteOnboarding}
            shareToken={shareToken}
          />
        </div>
      )}

      {/* Replay Wrapped Full-Screen Modal */}
      {isWrappedModalOpen && wrapped?.wrapped_payload && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in">
          <WrappedStoryExperience
            payload={wrapped.wrapped_payload}
            initialTheme={portalTheme}
            controlledTheme={portalTheme}
            onThemeChange={handleWrappedThemeChange}
            onClose={() => setIsWrappedModalOpen(false)}
            mode="modal"
            shareToken={shareToken}
          />
        </div>
      )}
    </div>
  );
}
