"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
import DashboardTab from "@/modules/admin/components/DashboardTab";
import InquiryPipelineTab from "@/modules/admin/components/InquiryPipelineTab";
import ProjectsTab from "@/modules/admin/components/ProjectsTab";
import AdminSettingsModal from "@/modules/admin/components/AdminSettingsModal";
import { getThemePreference, setThemePreference } from "@/modules/shared/SystemThemeSync";
import {
  LockIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  CheckIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  KeyRoundIcon,
  MenuIcon,
  ClipboardListIcon,
  BellIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  SettingsIcon,
} from "@/modules/shared/Icons";
import { INITIAL_PROJECTS, deduplicateProjects } from "@/modules/shared/projectsHelper";

const DEFAULT_ADMIN_PIN = "mcpa2026";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentThemeMode, setCurrentThemeMode] = useState("dark");
  const [themePref, setThemePref] = useState("system");
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "briefs"
  const [currentUser, setCurrentUser] = useState(null);

  // Data states
  const [customProjects, setCustomProjects] = useState([]);
  const [allProjects, setAllProjects] = useState(INITIAL_PROJECTS);
  const [clientBriefs, setClientBriefs] = useState([]);
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
          month: p.month,
          status: p.status || "completed",
          category: p.category,
          description: p.description,
          images: p.images || [],
          isAdminAdded: Boolean(p.is_admin_added),
          isWebVisible: p.is_web_visible !== false,
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
        const savedAuth =
          localStorage.getItem("mcpa_admin_authenticated") ||
          sessionStorage.getItem("mcpa_admin_authenticated");
        const savedUser =
          localStorage.getItem("mcpa_admin_user") ||
          sessionStorage.getItem("mcpa_admin_user");

        if (savedAuth === "true") {
          setIsAuthenticated(true);
          if (savedUser) {
            try {
              setCurrentUser(JSON.parse(savedUser));
            } catch (e) {}
          }
        }
        setIsAuthChecking(false);

        const savedCollapsed = localStorage.getItem("mcpa_admin_sidebar_collapsed");
        if (savedCollapsed !== null) {
          setIsSidebarCollapsed(savedCollapsed === "true");
        }
        loadProjectsAndBriefs();
        fetchHealthStatus();

        // Theme initialization
        const pref = getThemePreference();
        setThemePref(pref);
        setCurrentThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
      };

      initAdmin();

      const handleThemeChange = (e) => {
        if (e?.detail) {
          setThemePref(e.detail.mode || "system");
          setCurrentThemeMode(e.detail.isDark ? "dark" : "light");
        }
      };
      window.addEventListener("mcpa-theme-change", handleThemeChange);

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
            timeZone: "Asia/Manila",
          }) + " (PHT)"
        );
      };
      updateClock();
      const timer = setInterval(updateClock, 10000);
      return () => {
        clearInterval(timer);
        window.removeEventListener("mcpa-theme-change", handleThemeChange);
      };
    }
  }, []);

  const handleToggleTheme = () => {
    const next = currentThemeMode === "dark" ? "light" : "dark";
    setThemePreference(next);
    setCurrentThemeMode(next);
    setThemePref(next);
  };

  const handleAdminReload = () => {
    setActiveTab("dashboard");
    loadProjectsAndBriefs();
    fetchHealthStatus();
    showToast("Admin Console Refreshed");
  };

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
        
        const loggedUser = data.user || {
          name: emailInput.trim() ? emailInput.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "MCPA Administrator",
          email: emailInput.trim() || "admin@mcpa.com",
          role: "SUPER ADMIN",
        };

        setCurrentUser(loggedUser);
        localStorage.setItem("mcpa_admin_authenticated", "true");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        localStorage.setItem("mcpa_admin_user", JSON.stringify(loggedUser));
        sessionStorage.setItem("mcpa_admin_user", JSON.stringify(loggedUser));

        if (data.token) {
          localStorage.setItem("mcpa_admin_token", data.token);
          sessionStorage.setItem("mcpa_admin_token", data.token);
        }

        if (data.activeDbProvider) setActiveDbProvider(data.activeDbProvider);
        loadProjectsAndBriefs();
        return;
      }

      // Offline / PIN fallback check if server returns error or is unreachable
      if (passwordInput.trim() === DEFAULT_ADMIN_PIN) {
        const fallbackUser = {
          name: emailInput.trim() ? emailInput.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "MCPA Administrator",
          email: emailInput.trim() || "admin@mcpa.com",
          role: "SUPER ADMIN",
        };

        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        setCurrentUser(fallbackUser);
        localStorage.setItem("mcpa_admin_authenticated", "true");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        localStorage.setItem("mcpa_admin_user", JSON.stringify(fallbackUser));
        sessionStorage.setItem("mcpa_admin_user", JSON.stringify(fallbackUser));
        loadProjectsAndBriefs();
        return;
      }

      setAuthError(data.message || "Invalid administrative credentials. Please verify your email and password.");
      setIsLoggingIn(false);
    } catch (err) {
      // Network failure / offline check
      if (passwordInput.trim() === DEFAULT_ADMIN_PIN) {
        const fallbackUser = {
          name: emailInput.trim() ? emailInput.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "MCPA Administrator",
          email: emailInput.trim() || "admin@mcpa.com",
          role: "SUPER ADMIN",
        };

        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        setCurrentUser(fallbackUser);
        localStorage.setItem("mcpa_admin_authenticated", "true");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        localStorage.setItem("mcpa_admin_user", JSON.stringify(fallbackUser));
        sessionStorage.setItem("mcpa_admin_user", JSON.stringify(fallbackUser));
        loadProjectsAndBriefs();
      } else {
        setAuthError("Could not reach backend authentication server. Ensure the backend process is active.");
        setIsLoggingIn(false);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("mcpa_admin_authenticated");
    sessionStorage.removeItem("mcpa_admin_authenticated");
    localStorage.removeItem("mcpa_admin_token");
    sessionStorage.removeItem("mcpa_admin_token");
    localStorage.removeItem("mcpa_admin_user");
    sessionStorage.removeItem("mcpa_admin_user");
    setPasswordInput("");
    setCurrentUser(null);
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleAddProject = async (newProject) => {
    let finalProj = newProject;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (data?.success && data?.project) {
        finalProj = {
          ...newProject,
          id: data.project.project_id || data.project.id || newProject.id,
          status: data.project.status || newProject.status,
          month: data.project.month || newProject.month,
        };
      }
    } catch (e) {
      console.warn("Could not sync project to backend:", e);
    }

    const updatedCustom = [finalProj, ...customProjects.filter((p) => p.id !== newProject.id && p.id !== finalProj.id)];
    setCustomProjects(updatedCustom);
    const updatedAll = [finalProj, ...allProjects.filter((p) => p.id !== newProject.id && p.id !== finalProj.id)];
    setAllProjects(updatedAll);
    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Successfully published "${finalProj.name}"!`);
    } catch (err) {
      console.warn("Error saving project locally:", err);
    }
  };

  const handleUpdateProject = async (projectId, updatedProject) => {
    const updatedCustom = customProjects.map((p) => (p.id === projectId ? updatedProject : p));
    setCustomProjects(updatedCustom);
    const updatedAll = allProjects.map((p) => (p.id === projectId ? updatedProject : p));
    setAllProjects(updatedAll);
    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Successfully updated "${updatedProject.name}"!`);
    } catch (err) {
      console.warn("Error saving project locally:", err);
    }

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
    } catch (e) {
      console.warn("Could not update project in backend:", e);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
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

  // While validating saved session from localStorage, display neutral spinner to prevent flashing login form
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Restoring Admin Console...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. SECURITY PIN GATE (For unauthenticated users)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
        {/* Top-Right Settings Button */}
        <div className="absolute top-5 right-5 z-20">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 shadow-xs transition-colors cursor-pointer"
            title="Console Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Construction Architectural Texture: Concrete Hollow Blocks (CHB) matching client site */}
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-repeat opacity-30 dark:opacity-[0.16] mix-blend-multiply dark:mix-blend-luminosity"
          style={{
            backgroundImage: "url('/assets/textures/chb_hollowblocks.jpg')",
            backgroundSize: "440px 440px",
          }}
        />

        {/* Ambient Subtle Lighting Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl backdrop-blur-xl transition-colors">
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
            {/* Email */}
            <div>
              <label
                htmlFor="adminEmail"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="adminEmail"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@mcpa.com"
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono text-sm transition-colors"
                />
                <MailIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="adminPassword"
                  className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
                >
                  Password
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

        {/* Console Settings & Theme Modal */}
        <AdminSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onOpenResetPin={() => setIsResetModalOpen(true)}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "projects", label: "Projects", icon: FolderKanbanIcon },
    { id: "briefs", label: "Inquiries", icon: ClipboardListIcon, badge: clientBriefs.length || undefined },
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
              {/* Real System Logo (Compact Emblem/Icon) - Reloads Admin */}
              <div className="relative flex flex-col items-center group py-1">
                <button
                  type="button"
                  onClick={handleAdminReload}
                  title="Reload Admin Console"
                  className="relative z-10 w-11 h-11 rounded-xl bg-white dark:bg-[#181a24] border border-neutral-200/90 dark:border-white/10 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/10 dark:shadow-black/50 hover:border-amber-500 dark:hover:border-amber-500 transition-all animate-floating-emblem overflow-hidden cursor-pointer"
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
                </button>
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
              {/* Real System Logo (Full Brand Banner) - Reloads Admin */}
              <button
                type="button"
                onClick={handleAdminReload}
                title="Reload Admin Console"
                className="flex items-center gap-2.5 min-w-0 group bg-transparent border-0 p-0 cursor-pointer text-left"
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
              </button>
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
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-6 flex items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Open Sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentTime && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                <span>{currentTime}</span>
              </div>
            )}

            {/* Console Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/[0.04] hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/5 transition-all cursor-pointer"
              title="Open Admin Settings"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <BellIcon className="w-5 h-5" />
              {clientBriefs.filter((b) => !b.status || b.status === "Pending Review").length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#09090b]" />
              )}
            </button>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-amber-500/50"
            >
              <span className="hidden sm:inline">View Public Site</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-screen-2xl w-full mx-auto">

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <DashboardTab
            clientBriefs={clientBriefs}
            allProjects={allProjects}
            onNavigateTab={setActiveTab}
          />
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
        {/* TAB: PROJECTS MANAGEMENT                                            */}
        {/* ================================================================= */}
        {activeTab === "projects" && (
          <ProjectsTab
            customProjects={customProjects}
            allProjects={allProjects}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            showToast={showToast}
          />
        )}

      </main>
      </div>

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenResetPin={() => setIsResetModalOpen(true)}
      />
    </div>
  );
}
