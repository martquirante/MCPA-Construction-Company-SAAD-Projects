"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/modules/shared/ThemeToggle";
import AdminUploadModal from "@/modules/admin/components/AdminUploadModal";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
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
} from "@/modules/shared/Icons";

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Meridian Modern Residence",
    location: "Plaridel, Bulacan",
    year: "2024",
    category: "Residential",
    description: "Two-storey contemporary home with cantilevered balcony, reinforced concrete framing, perimeter fence, and complete turnkey architectural finishing.",
    images: [
      "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format",
    ],
  },
  {
    id: 2,
    name: "Tabang Commercial Complex",
    location: "Tabang, Plaridel",
    year: "2024",
    category: "Commercial",
    description: "Commercial facility and supply yard featuring high-spec structural steel trusses, modern storefront facades, and heavy-duty logistics access.",
    images: [
      "https://images.unsplash.com/photo-1706164971302-e30c0640cc3b?w=800&h=1200&fit=crop&auto=format",
    ],
  },
  {
    id: 3,
    name: "Grand Royale Executive Villa",
    location: "Malolos, Bulacan",
    year: "2023",
    category: "Luxury Villa",
    description: "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 5-year structural warranty.",
    images: [
      "https://images.unsplash.com/photo-1762811054947-605b20298615?w=800&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 4,
    name: "North Industrial Logistics Hub",
    location: "Guiguinto, Bulacan",
    year: "2024",
    category: "Commercial",
    description: "Large-span logistics warehouse and administration annex featuring seismic foundation ties and high-load industrial flooring.",
    images: [
      "https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=1400&h=700&fit=crop&auto=format",
    ],
  },
  {
    id: 5,
    name: "Pampanga Zen Sanctuary",
    location: "Pulilan, Bulacan",
    year: "2024",
    category: "Modern Zen",
    description: "Minimalist Japanese-inspired residence featuring natural timber accents, central dry gravel courtyard, and passive natural cross-ventilation.",
    images: [
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format",
    ],
  },
];

const DEFAULT_ADMIN_EMAIL = "rayquirante@gmail.com";
const DEFAULT_ADMIN_PIN = "mcpa2026";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState(DEFAULT_ADMIN_EMAIL);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio"); // "portfolio" | "briefs" | "company"
  const [activeDbProvider, setActiveDbProvider] = useState("Azure Primary (Flexible Server)");
  const [currentUser, setCurrentUser] = useState(null);

  // Data states
  const [customProjects, setCustomProjects] = useState([]);
  const [allProjects, setAllProjects] = useState(INITIAL_PROJECTS);
  const [clientBriefs, setClientBriefs] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Check existing session & health status
  useEffect(() => {
    if (typeof window !== "undefined") {
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
      loadProjectsAndBriefs();
      fetchHealthStatus();
    }
  }, []);

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

  const loadProjectsAndBriefs = async () => {
    // 1. Try to load from Backend API first
    try {
      const [projRes, briefsRes] = await Promise.allSettled([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/briefs").then((r) => r.json()),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.success) {
        const dbProjects = (projRes.value.projects || []).map((p) => ({
          id: p.project_id || p.id,
          name: p.name,
          location: p.location,
          year: p.year,
          category: p.category,
          description: p.description,
          images: p.images || [],
          isAdminAdded: true,
        }));
        setCustomProjects(dbProjects);
        setAllProjects([...dbProjects, ...INITIAL_PROJECTS]);
        localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(dbProjects));
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
          financingOption: b.financing_option,
          uploadedFiles: b.uploaded_files || [],
          status: b.status,
          createdAt: b.created_at,
        }));
        setClientBriefs(dbBriefs);
        localStorage.setItem("mcpa_client_briefs", JSON.stringify(dbBriefs));
      } else {
        fallbackLoadStoredBriefs();
      }
    } catch (e) {
      fallbackLoadStoredProjects();
      fallbackLoadStoredBriefs();
    }
  };

  const fallbackLoadStoredProjects = () => {
    try {
      const savedProjects = localStorage.getItem("mcpa_portfolio_projects");
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed)) {
          const adminOnly = parsed.filter((p) => p.isAdminAdded);
          setCustomProjects(adminOnly);
          setAllProjects([...adminOnly, ...INITIAL_PROJECTS]);
        }
      }
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
    const updatedCustom = [newProject, ...customProjects];
    setCustomProjects(updatedCustom);
    setAllProjects([newProject, ...allProjects]);
    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedCustom));
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
    setAllProjects([...updatedCustom, ...INITIAL_PROJECTS]);

    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedCustom));
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

  const handleUpdateBriefStatus = async (briefId, newStatus) => {
    const updated = clientBriefs.map((b) =>
      b.id === briefId ? { ...b, status: newStatus } : b
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
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn("Could not update brief in backend:", e);
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

  // =========================================================================
  // 1. SECURITY PIN GATE (For unauthenticated users)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
        {/* Floating ThemeToggle in top right */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle className="text-neutral-700 dark:text-white hover:text-amber-500 dark:hover:text-amber-400" />
        </div>

        {/* Background glow & architectural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-2xl backdrop-blur-xl transition-colors">
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

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-mono tracking-widest uppercase mb-3">
              <LockIcon className="w-3.5 h-3.5" />
              <span>Restricted Admin Portal</span>
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
          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="admin@mcpa.com"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono text-sm transition-colors"
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
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono text-sm tracking-wider transition-colors"
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
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
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

          {/* Cloud Architecture Status Badge */}
          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-white/5 flex flex-col items-center text-center gap-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Primary: Azure PostgreSQL · Backup: Supabase</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              Cloud Storage: Azure Blob Storage (Tier 1)
            </p>
          </div>

          {/* Back to Client Site */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-mono"
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
  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-500">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-amber-500 text-neutral-950 font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-36 sm:w-44 h-9">
              {/* Light Mode Logo */}
              <Image
                src="/assets/mcpa-logo.png"
                alt="MCPA Construction"
                fill
                className="object-contain object-left block dark:hidden"
                sizes="176px"
              />
              {/* Dark Mode Logo */}
              <Image
                src="/assets/logo-white.png"
                alt="MCPA Construction"
                fill
                className="object-contain object-left hidden dark:block"
                sizes="176px"
              />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] tracking-wider uppercase font-bold">
              Admin Console
            </span>
            {/* Active Cloud DB Indicator */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              <span className={`w-1.5 h-1.5 rounded-full ${activeDbProvider.includes("Azure") ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
              <span>{activeDbProvider.includes("Azure") ? "Azure PostgreSQL Primary" : activeDbProvider}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="text-neutral-700 dark:text-white hover:text-amber-500 dark:hover:text-amber-400" />
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-amber-500/30"
              title="Open the client-facing website in a new tab"
            >
              <span>View Public Site</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-rose-500/30 cursor-pointer"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Total Showcase Projects
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{allProjects.length}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">Live on Client Site</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Custom Admin Uploads
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{customProjects.length}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Managed via Portal</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Client Inquiries / Leads
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{clientBriefs.length}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Consultation Briefs</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Security Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                Client Access Isolated
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-white/10 mb-8 overflow-x-auto">
          <button
            id="tab-btn-portfolio"
            onClick={() => setActiveTab("portfolio")}
            className={`pb-4 px-4 text-xs font-mono uppercase tracking-wider transition-all border-b-2 font-bold cursor-pointer whitespace-nowrap ${
              activeTab === "portfolio"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Portfolio Management ({allProjects.length})
          </button>
          <button
            id="tab-btn-briefs"
            onClick={() => setActiveTab("briefs")}
            className={`pb-4 px-4 text-xs font-mono uppercase tracking-wider transition-all border-b-2 font-bold cursor-pointer whitespace-nowrap ${
              activeTab === "briefs"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Client Consultation Briefs ({clientBriefs.length})
          </button>
          <button
            id="tab-btn-company"
            onClick={() => setActiveTab("company")}
            className={`pb-4 px-4 text-xs font-mono uppercase tracking-wider transition-all border-b-2 font-bold cursor-pointer whitespace-nowrap ${
              activeTab === "company"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            HQ & Security Info
          </button>
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
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
                    {allProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
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
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-[10px] uppercase">
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
        {/* TAB 2: CLIENT CONSULTATION BRIEFS & LEADS                         */}
        {/* ================================================================= */}
        {activeTab === "briefs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
                  Client Inquiries & Consultation Leads
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light">
                  Submitted via the Smart Pre-Consultation Booking portal by prospective homeowners and investors.
                </p>
              </div>

              {clientBriefs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all client inquiries from local memory?")) {
                      localStorage.removeItem("mcpa_client_briefs");
                      setClientBriefs([]);
                      showToast("All consultation briefs cleared.");
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-rose-500/40 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-mono uppercase transition-colors cursor-pointer"
                >
                  Clear All Leads
                </button>
              )}
            </div>

            {clientBriefs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-900/40">
                <UserIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  No Client Inquiries Yet
                </h3>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                  When clients submit the Pre-Consultation form at <code className="text-amber-600 dark:text-amber-400 font-bold">/book</code>, their contact and project specifications will appear here.
                </p>
                <Link
                  href="/book"
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Test Booking Form</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientBriefs.map((brief) => (
                  <div
                    key={brief.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest block">
                          {brief.id}
                        </span>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                          {brief.clientName || "Prospective Client"}
                        </h3>
                      </div>

                      <select
                        value={brief.status || "Pending Consultation Review"}
                        onChange={(e) => handleUpdateBriefStatus(brief.id, e.target.value)}
                        className="text-[11px] font-mono rounded-lg px-2.5 py-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/15 text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Pending Consultation Review">Pending Review</option>
                        <option value="Contacted / Scheduled">Contacted / Scheduled</option>
                        <option value="Site Inspection Completed">Site Inspection Done</option>
                        <option value="Proposal Approved">Proposal Approved</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase">Phone</span>
                        <span className="text-neutral-900 dark:text-white font-semibold">{brief.clientPhone || "—"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase">Email</span>
                        <span className="text-neutral-900 dark:text-white font-semibold truncate block">{brief.clientEmail || "—"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase">Style</span>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">{brief.preferredStyle || "Contemporary"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase">Financing</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate block">{brief.financingOption || "Build Now Pay Later"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-600 dark:text-neutral-300 font-light flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-white/5">
                      <span className="text-neutral-500 text-[10px] font-mono">
                        {brief.timestamp ? new Date(brief.timestamp).toLocaleString() : "Recent"}
                      </span>

                      <button
                        onClick={() => handleDeleteBrief(brief.id)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 text-[11px] font-mono uppercase cursor-pointer"
                      >
                        Remove Lead
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-amber-600 dark:hover:text-amber-400 font-mono"
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
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400">Design & Build · In-House Supply · 5-Yr Warranty</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Upload Modal Component */}
      <AdminUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
}
