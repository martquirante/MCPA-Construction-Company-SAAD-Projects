"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminUploadModal from "@/modules/admin/components/AdminUploadModal";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
import InquiryPipelineTab from "@/modules/admin/components/InquiryPipelineTab";
import SiteProgressTab from "@/modules/admin/components/SiteProgressTab";
import BillingLedgerTab from "@/modules/admin/components/BillingLedgerTab";
import DelayManagementTab from "@/modules/admin/components/DelayManagementTab";
import AiReceiptScannerTab from "@/modules/admin/components/AiReceiptScannerTab";
import WarrantyTicketsTab from "@/modules/admin/components/WarrantyTicketsTab";
import {
  LockIcon,
  ShieldCheckIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  GoogleMapsPinIcon,
  CheckIcon,
  UserIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  KeyRoundIcon,
  MenuIcon,
  HardHatIcon,
  ClipboardListIcon,
  CreditCardIcon,
  ClockIcon,
  ScanLineIcon,
  WrenchIcon,
  FolderKanbanIcon,
  Building2Icon,
  BellIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/modules/shared/Icons";
import { INITIAL_PROJECTS, deduplicateProjects } from "@/modules/shared/projectsHelper";

const DEFAULT_ADMIN_PIN = "mcpa2026";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("briefs"); // "briefs" | "construction" | "billing" | "delays" | "ocr" | "warranty" | "portfolio" | "company"
  const [activeDbProvider, setActiveDbProvider] = useState("Local PostgreSQL (Docker Standby)");
  const [currentUser, setCurrentUser] = useState(null);

  // Data states
  const [customProjects, setCustomProjects] = useState([]);
  const [allProjects, setAllProjects] = useState(INITIAL_PROJECTS);
  const [clientBriefs, setClientBriefs] = useState([]);
  const [siteProject, setSiteProject] = useState(null);
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);
  const [delayEvents, setDelayEvents] = useState([]);
  const [warrantyTickets, setWarrantyTickets] = useState([]);
  const [siteExpenses, setSiteExpenses] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("mcpa_admin_sidebar_collapsed", String(next));
        } catch (e) {}
      }
      return next;
    });
  };
  const [currentTime, setCurrentTime] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const fetchHealthStatus = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data?.database?.activeProvider) {
        setActiveDbProvider(data.database.activeProvider);
      }
    } catch (e) {
      // Backend not running or offline
    }
  };

  const fallbackLoadStoredProjects = () => {
    try {
      const savedProjects = localStorage.getItem("mcpa_portfolio_projects");
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const unified = deduplicateProjects(parsed, INITIAL_PROJECTS);
          const adminOnly = unified.filter((p) => p.isAdminAdded);
          setCustomProjects(adminOnly);
          setAllProjects(unified);
          localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(unified));
          return;
        }
      }
      setCustomProjects([]);
      setAllProjects(INITIAL_PROJECTS);
    } catch (e) {
      console.warn("Could not load stored projects:", e);
    }
  };

  const fallbackLoadStoredBriefs = () => {
    try {
      const savedBriefs = localStorage.getItem("mcpa_client_briefs");
      if (savedBriefs) {
        const parsed = JSON.parse(savedBriefs);
        if (Array.isArray(parsed)) {
          setClientBriefs(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load stored briefs:", e);
    }
  };

  const loadProjectsAndBriefs = async () => {
    // Try to load from Backend API first
    try {
      const [projRes, briefsRes, siteRes] = await Promise.allSettled([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/briefs").then((r) => r.json()),
        fetch("/api/construction/projects/MCPA-PLR-2024").then((r) => r.json()),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.success && projRes.value.projects?.length > 0) {
        const dbProjects = projRes.value.projects.map((p) => ({
          id: p.project_id || p.id,
          name: p.name,
          location: p.location,
          year: p.year,
          category: p.category,
          description: p.description,
          images: p.images || [],
          isAdminAdded: Boolean(p.is_admin_added),
        }));
        const unified = deduplicateProjects(dbProjects, INITIAL_PROJECTS);
        setCustomProjects(unified.filter((p) => p.isAdminAdded));
        setAllProjects(unified);
        localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(unified));
      } else {
        fallbackLoadStoredProjects();
      }

      if (briefsRes.status === "fulfilled" && briefsRes.value?.success) {
        const dbBriefs = (briefsRes.value.briefs || []).map((b) => ({
          id: b.brief_id || b.id,
          submissionId: b.submission_id,
          clientName: b.client_name,
          clientEmail: b.client_email,
          clientPhone: b.client_phone,
          projectType: b.project_type,
          preferredStyle: b.preferred_style,
          budgetRange: b.budget_range,
          lotStatus: b.lot_status,
          lotArea: b.lot_area,
          targetDate: b.target_date,
          location: b.location,
          mapCoordinates: b.map_coordinates,
          locationType: b.location_type || "Local",
          meetingMode: b.meeting_mode,
          meetingDate: b.meeting_date,
          meetingTime: b.meeting_time,
          meetingLink: b.meeting_link,
          meetingNotes: b.meeting_notes,
          quotationAmount: b.quotation_amount,
          quotationNotes: b.quotation_notes,
          clientPortalCode: b.client_portal_code,
          financingOption: b.financing_option,
          uploadedFiles: b.uploaded_files || [],
          status: b.status || "Pending Review",
          createdAt: b.created_at,
        }));
        setClientBriefs(dbBriefs);
        localStorage.setItem("mcpa_client_briefs", JSON.stringify(dbBriefs));
      } else {
        fallbackLoadStoredBriefs();
      }

      if (siteRes.status === "fulfilled" && siteRes.value?.success) {
        setSiteProject(siteRes.value.project);
        setSiteMilestones(siteRes.value.milestones || []);
        setSitePhotos(siteRes.value.photos || []);
        setBillingLedger(siteRes.value.billing || []);
        setDelayEvents(siteRes.value.delays || []);
        setWarrantyTickets(siteRes.value.warranty || []);
        setSiteExpenses(siteRes.value.expenses || []);
      }
    } catch (e) {
      fallbackLoadStoredProjects();
      fallbackLoadStoredBriefs();
    }
  };

  // Check existing session, health status & live clock
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initAdmin = async () => {
        const savedAuth = sessionStorage.getItem("mcpa_admin_authenticated");
        const savedUser = sessionStorage.getItem("mcpa_admin_user");
        if (savedAuth === "true") {
          setIsAuthenticated(true);
          if (savedUser) {
            try {
              setCurrentUser(JSON.parse(savedUser));
            } catch (e) {}
          }
        }
        const savedCollapsed = localStorage.getItem("mcpa_admin_sidebar_collapsed");
        if (savedCollapsed !== null) {
          setIsSidebarCollapsed(savedCollapsed === "true");
        }
        loadProjectsAndBriefs();
        fetchHealthStatus();
      };

      initAdmin();

      const updateClock = () => {
        const now = new Date();
        setCurrentTime(
          now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        );
      };
      updateClock();
      const timer = setInterval(updateClock, 10000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        if (data.token) sessionStorage.setItem("mcpa_admin_token", data.token);
        if (data.user) {
          setCurrentUser(data.user);
          sessionStorage.setItem("mcpa_admin_user", JSON.stringify(data.user));
        }
        if (data.activeDbProvider) setActiveDbProvider(data.activeDbProvider);
        loadProjectsAndBriefs();
        return;
      }

      // Offline / PIN fallback check if server returns error or is unreachable
      if (passwordInput.trim() === DEFAULT_ADMIN_PIN) {
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        loadProjectsAndBriefs();
        return;
      }

      setAuthError(data.message || "Invalid administrative credentials. Please verify your email and password.");
      setIsLoggingIn(false);
    } catch (err) {
      // Network failure / offline check
      if (passwordInput.trim() === DEFAULT_ADMIN_PIN) {
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        loadProjectsAndBriefs();
      } else {
        setAuthError("Could not reach backend authentication server. Ensure the backend process is active.");
        setIsLoggingIn(false);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("mcpa_admin_authenticated");
    sessionStorage.removeItem("mcpa_admin_token");
    sessionStorage.removeItem("mcpa_admin_user");
    setPasswordInput("");
    setCurrentUser(null);
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleAddProject = async (newProject) => {
    const updatedCustom = [newProject, ...customProjects.filter((p) => p.id !== newProject.id)];
    setCustomProjects(updatedCustom);
    const updatedAll = [newProject, ...allProjects.filter((p) => p.id !== newProject.id)];
    setAllProjects(updatedAll);
    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Successfully published "${newProject.name}" to public portfolio!`);
    } catch (err) {
      console.warn("Error saving project locally:", err);
    }

    // Also persist to Backend Database & Cloud Storage
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
    } catch (e) {
      console.warn("Could not sync project to backend:", e);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!confirm(`Are you sure you want to delete "${projectName}" from the showcase?`)) return;

    const updatedCustom = customProjects.filter((p) => p.id !== projectId);
    setCustomProjects(updatedCustom);
    const updatedAll = allProjects.filter((p) => p.id !== projectId);
    setAllProjects(updatedAll);

    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Removed "${projectName}" from portfolio.`);
    } catch (err) {
      console.warn("Error updating project list:", err);
    }

    // Sync deletion with Backend
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Could not delete from backend:", e);
    }
  };

  const handleUpdateBriefStatus = async (briefId, newStatus, extraData = {}) => {
    const updated = clientBriefs.map((b) =>
      b.id === briefId ? { ...b, status: newStatus, ...extraData } : b
    );
    setClientBriefs(updated);
    try {
      localStorage.setItem("mcpa_client_briefs", JSON.stringify(updated));
      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      console.warn("Error saving briefs:", err);
    }

    // Sync status update to Backend
    try {
      await fetch(`/api/briefs/${briefId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
    } catch (e) {
      console.warn("Could not update brief in backend:", e);
    }
  };

  const handleProvisionAccess = async (briefId) => {
    try {
      const res = await fetch(`/api/briefs/${briefId}/provision`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const updated = clientBriefs.map((b) =>
          b.id === briefId ? { ...b, clientPortalCode: data.portalCode, status: "Approved / Accepted" } : b
        );
        setClientBriefs(updated);
        localStorage.setItem("mcpa_client_briefs", JSON.stringify(updated));
        showToast(`Access provisioned! Client Code: ${data.portalCode}`);
      } else {
        showToast(data.message || "Failed to provision access.");
      }
    } catch (err) {
      showToast("Provisioning error: could not reach backend.");
    }
  };

  const handleDeleteBrief = async (briefId) => {
    if (!confirm("Are you sure you want to remove this client inquiry?")) return;
    const updated = clientBriefs.filter((b) => b.id !== briefId);
    setClientBriefs(updated);
    try {
      localStorage.setItem("mcpa_client_briefs", JSON.stringify(updated));
      showToast("Client consultation brief removed.");
    } catch (err) {
      console.warn("Error saving briefs:", err);
    }

    // Sync deletion with Backend
    try {
      await fetch(`/api/briefs/${briefId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Could not delete brief from backend:", e);
    }
  };

  // Construction Handlers
  const handleUpdateMilestone = async (milestoneId, data) => {
    try {
      const res = await fetch(`/api/construction/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        // Refresh site project data
        const siteRes = await fetch("/api/construction/projects/MCPA-PLR-2024").then((r) => r.json());
        if (siteRes.success) {
          setSiteProject(siteRes.project);
          setSiteMilestones(siteRes.milestones || []);
        }
      }
    } catch (e) {
      console.warn("Could not sync milestone update:", e);
    }
  };

  const handleAddPhoto = async (photoData) => {
    try {
      const res = await fetch("/api/construction/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoData),
      });
      const data = await res.json();
      if (data.success && data.log) {
        setSitePhotos([data.log, ...sitePhotos]);
      }
    } catch (e) {
      console.warn("Could not add photo to backend:", e);
    }
  };

  const handleVerifyPayment = async (billId) => {
    try {
      const res = await fetch(`/api/construction/billing/${billId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.entry) {
        const updated = billingLedger.map((b) => (b.bill_id === billId ? data.entry : b));
        setBillingLedger(updated);
      }
    } catch (e) {
      console.warn("Could not verify payment on backend:", e);
    }
  };

  const handleLogDelay = async (delayData) => {
    try {
      const res = await fetch("/api/construction/delays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delayData),
      });
      const data = await res.json();
      if (data.success && data.delay) {
        setDelayEvents([data.delay, ...delayEvents]);
        const siteRes = await fetch("/api/construction/projects/MCPA-PLR-2024").then((r) => r.json());
        if (siteRes.success) {
          setSiteProject(siteRes.project);
        }
      }
    } catch (e) {
      console.warn("Could not log delay on backend:", e);
    }
  };

  const handleUpdateWarranty = async (ticketId, status) => {
    try {
      await fetch(`/api/construction/warranty/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.warn("Could not update warranty status on backend:", e);
    }
  };

  // =========================================================================
  // 1. SECURITY PIN GATE (For unauthenticated users)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-white flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
        {/* Ambient Subtle Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-2xl backdrop-blur-xl transition-colors">
          {/* Brand Logo & Lock Badge */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-44 h-10 mb-6">
              {/* Light Mode Logo */}
              <Image
                src="/assets/mcpa-logo.png"
                alt="MCPA Construction and Supply"
                fill
                priority
                className="object-contain block dark:hidden"
                sizes="176px"
              />
              {/* Dark Mode Logo */}
              <Image
                src="/assets/logo-white.png"
                alt="MCPA Construction and Supply"
                fill
                priority
                className="object-contain hidden dark:block"
                sizes="176px"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Administrative Access
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-xs">
              This console is strictly reserved for MCPA management and engineering staff. Client access is restricted.
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-mono">
              {authError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            {/* Registered Email */}
            <div>
              <label
                htmlFor="adminEmail"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Registered Administrator Email
              </label>
              <div className="relative">
                <input
                  id="adminEmail"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="example.com"
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono text-sm transition-colors"
                />
                <MailIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Master Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="adminPassword"
                  className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
                >
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono text-sm tracking-wider transition-colors"
                />
                <KeyRoundIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-amber-500 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Unlock Admin Console</span>
                </>
              )}
            </button>
          </form>


          {/* Back to Client Site */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-mono cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Public Client Website</span>
            </Link>
          </div>
        </div>

        {/* 4-Step Forgot Password Modal */}
        <ResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          initialEmail={emailInput}
          onSuccessReturn={(verifiedEmail) => {
            setEmailInput(verifiedEmail);
            setPasswordInput("");
            setAuthError("");
            showToast("Password reset verified! Please log in with your new password.");
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  const navItems = [
    { id: "briefs", label: "Inquiries Pipeline", icon: ClipboardListIcon, badge: clientBriefs.length },
    { id: "construction", label: "Site Execution & 360°", icon: HardHatIcon },
    { id: "billing", label: "Milestone Billing & OR", icon: CreditCardIcon },
    { id: "delays", label: "Delay Management", icon: ClockIcon },
    { id: "ocr", label: "AI Expense OCR", icon: ScanLineIcon, badge: siteExpenses?.length || undefined },
    { id: "warranty", label: "Warranty Tickets", icon: WrenchIcon, badge: warrantyTickets?.length || undefined },
    { id: "portfolio", label: "Portfolio Showcase", icon: FolderKanbanIcon, badge: allProjects?.length },
    { id: "company", label: "HQ & Credentials", icon: Building2Icon },
  ];

  const currentTabInfo = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-neutral-950 border border-emerald-400 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Left Sidebar Navigation (Drive&Go Design Architecture) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64 bg-white dark:bg-[#12141a] border-r border-neutral-200 dark:border-white/5 flex flex-col justify-between z-50 transition-all duration-300 shrink-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Section: Real System Logo + Collapse/Expand Toggle */}
        <div
          className={`border-b border-neutral-200 dark:border-white/5 transition-all ${
            isSidebarCollapsed
              ? "p-3 flex flex-col items-center gap-2.5"
              : "p-4 flex items-center justify-between gap-3"
          }`}
        >
          {isSidebarCollapsed ? (
            <>
              {/* Real System Logo (Compact Emblem/Icon) - Floating Anti-Gravity Style */}
              <div className="relative flex flex-col items-center group py-1">
                <Link
                  href="/"
                  title="MCPA Construction and Supply"
                  className="relative z-10 w-11 h-11 rounded-xl bg-white dark:bg-[#181a24] border border-neutral-200/90 dark:border-white/10 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/10 dark:shadow-black/50 hover:border-neutral-900 dark:hover:border-white transition-all animate-floating-emblem overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-500/10 via-transparent to-transparent pointer-events-none" />
                  <Image
                    src="/assets/mcpa-logo.png"
                    alt="MCPA System Logo"
                    fill
                    priority
                    className="object-contain p-1.5 block dark:hidden"
                    sizes="44px"
                  />
                  <Image
                    src="/assets/logo-white.png"
                    alt="MCPA System Logo"
                    fill
                    priority
                    className="object-contain p-1.5 hidden dark:block"
                    sizes="44px"
                  />
                </Link>
                {/* Dynamic Floating Shadow Puddle Underneath */}
                <div className="w-7 h-1.5 bg-black/25 dark:bg-white/20 rounded-full blur-[2px] mt-1 transition-all animate-floating-shadow pointer-events-none" />
              </div>
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                title="Expand Navigation (Show Labels)"
                aria-label="Expand Sidebar"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Real System Logo (Full Brand Banner) */}
              <Link
                href="/"
                title="MCPA Construction and Supply"
                className="flex items-center gap-2.5 min-w-0 group"
              >
                <div className="relative w-32 sm:w-36 h-9 transition-transform group-hover:scale-105 shrink-0">
                  <Image
                    src="/assets/mcpa-logo.png"
                    alt="MCPA Construction and Supply"
                    fill
                    priority
                    className="object-contain object-left block dark:hidden"
                    sizes="144px"
                  />
                  <Image
                    src="/assets/logo-white.png"
                    alt="MCPA Construction and Supply"
                    fill
                    priority
                    className="object-contain object-left hidden dark:block"
                    sizes="144px"
                  />
                </div>
              </Link>
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Collapse Navigation (Icons Only)"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Vertical Navigation Menu Links: Panel Icons */}
        <nav
          className={`flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden ${
            isSidebarCollapsed ? "p-2" : "p-3"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group flex justify-center">
                <button
                  id={`tab-btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center rounded-xl text-xs font-mono tracking-wide transition-all cursor-pointer relative ${
                    isSidebarCollapsed
                      ? "h-11 justify-center px-0"
                      : "justify-between px-3.5 py-2.5"
                  } ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div
                    className={`flex items-center min-w-0 ${
                      isSidebarCollapsed ? "justify-center" : "gap-3"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? "text-neutral-950"
                          : "text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500"
                      }`}
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    isSidebarCollapsed ? (
                      <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-neutral-950 font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-[#12141a] shadow-xs">
                        {item.badge}
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          isActive
                            ? "bg-neutral-950 text-white dark:bg-neutral-950 dark:text-white"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isSidebarCollapsed && (
                  <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-mono font-medium shadow-2xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-bold text-[9px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom User Profile Section & Logout */}
        <div
          className={`border-t border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02] ${
            isSidebarCollapsed ? "p-3 flex flex-col items-center gap-3" : "p-4 space-y-3"
          }`}
        >
          {isSidebarCollapsed ? (
            <>
              <div
                className="relative group cursor-pointer"
                title={`${currentUser?.name || "Raymart Quirante"} (${currentUser?.role || "ADMIN"})`}
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                  {currentUser?.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "RQ"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#12141a] animate-pulse" />

                {/* Tooltip */}
                <div className="hidden lg:block absolute left-full bottom-0 ml-3 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-mono shadow-2xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  <p className="font-bold">{currentUser?.name || "Raymart Quirante"}</p>
                  <p className="text-[10px] text-neutral-400 uppercase">{currentUser?.role || "ADMIN"}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-all cursor-pointer group"
              >
                <LogOutIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                  {currentUser?.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "RQ"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {currentUser?.name || "Raymart Quirante"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                      {currentUser?.role || "SUPER ADMIN"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-neutral-200 dark:border-white/10 transition-all cursor-pointer"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Open Sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar (Show Labels)" : "Collapse Sidebar (Icons Only)"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{currentTabInfo.label}</span>
              </h1>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 hidden sm:block">
                MCPA Integrated Construction &amp; SAAD Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Formatted Clock */}
            {currentTime && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                <ClockIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{currentTime}</span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-amber-500/50"
              title="Open the client-facing website in a new tab"
            >
              <span className="hidden sm:inline">View Public Site</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                Total Showcase Projects
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{allProjects.length}</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">Live on Client Site</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                Custom Admin Uploads
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">{customProjects.length}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Managed via Portal</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                Client Inquiries / Leads
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">{clientBriefs.length}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Consultation Briefs</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                Security Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                  Client Access Isolated
                </span>
              </div>
            </div>
          </div>

        {/* ================================================================= */}
        {/* TAB 1: PORTFOLIO MANAGEMENT                                       */}
        {/* ================================================================= */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
                  Portfolio Showcase Editor
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light">
                  Published projects appear automatically on the public client gallery. Custom uploads can be deleted below.
                </p>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <PlusIcon className="w-4 h-4" />
                <span>+ Upload New Project</span>
              </button>
            </div>

            {/* Projects Table / Grid */}
            <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-sm dark:shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Project Preview</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Year</th>
                      <th className="py-3.5 px-4">Origin</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5 text-neutral-800 dark:text-neutral-200">
                    {allProjects.map((project, idx) => (
                      <tr key={project.id ?? `admin-proj-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-950 shrink-0">
                              {project.images?.[0] ? (
                                <Image
                                  src={project.images[0]}
                                  alt={project.name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <BuildingIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-600 m-auto" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">{project.name}</p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-xs font-light">
                                {project.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-neutral-800 dark:text-neutral-300 font-mono text-[10px] uppercase">
                            {project.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-mono">
                          {project.location}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{project.year}</td>
                        <td className="py-3.5 px-4">
                          {project.isAdminAdded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Admin Upload
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase text-neutral-500">
                              Core Catalog
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {project.isAdminAdded ? (
                            <button
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-mono uppercase cursor-pointer"
                              title="Delete this project from the showcase"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600">
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: INQUIRIES PIPELINE & FLOWCHART LIFECYCLE                     */}
        {/* ================================================================= */}
        {activeTab === "briefs" && (
          <InquiryPipelineTab
            clientBriefs={clientBriefs}
            onUpdateStatus={handleUpdateBriefStatus}
            onProvisionAccess={handleProvisionAccess}
            onDeleteBrief={handleDeleteBrief}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: SITE PROGRESS, 360° TOUR & VISUAL PROOF OF LIFE              */}
        {/* ================================================================= */}
        {activeTab === "construction" && (
          <SiteProgressTab
            project={siteProject}
            milestones={siteMilestones}
            photos={sitePhotos}
            onUpdateMilestone={handleUpdateMilestone}
            onAddPhoto={handleAddPhoto}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: BILLING LEDGER, PROOF VERIFICATION & DIGITAL OR             */}
        {/* ================================================================= */}
        {activeTab === "billing" && (
          <BillingLedgerTab
            project={siteProject}
            billing={billingLedger}
            onVerifyPayment={handleVerifyPayment}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: CRITICAL PATH DELAY LOGGER & DYNAMIC TURNOVER RECALCULATOR   */}
        {/* ================================================================= */}
        {activeTab === "delays" && (
          <DelayManagementTab
            project={siteProject}
            delays={delayEvents}
            onLogDelay={handleLogDelay}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: HARDWARE EXPENSE RECEIPT SCANNER (AI OCR)                    */}
        {/* ================================================================= */}
        {activeTab === "ocr" && (
          <AiReceiptScannerTab
            projectCode={siteProject?.project_code || "MCPA-PLR-2024"}
            expenses={siteExpenses}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: POST-CONSTRUCTION WARRANTY & MAINTENANCE TICKETING           */}
        {/* ================================================================= */}
        {activeTab === "warranty" && (
          <WarrantyTicketsTab
            warranty={warrantyTickets}
            onUpdateStatus={handleUpdateWarranty}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 3: HQ & SECURITY INFORMATION                                  */}
        {/* ================================================================= */}
        {activeTab === "company" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
                MCPA Headquarters & Credentials
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light">
                Verified company information synced across all client map pins and contact modules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/5">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">Headquarters Address</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Tabang, Plaridel, Bulacan</span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/5">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">Google Maps Coordinate</span>
                <a
                  href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-amber-600 dark:hover:text-amber-400 font-mono transition-colors"
                >
                  <GoogleMapsPinIcon className="w-3.5 h-3.5" />
                  <span>Open Active Link</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/5">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">Direct Phone Line</span>
                <span className="text-sm font-mono text-neutral-900 dark:text-white">(0949) 775 8239</span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/5">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">Email Address</span>
                <span className="text-sm font-mono text-neutral-900 dark:text-white">mcpa.construction@gmail.com</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">Warranty & Scope</span>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium">Design & Build · In-House Supply · 5-Yr Warranty</span>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Admin Upload Modal Component */}
      <AdminUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
}
