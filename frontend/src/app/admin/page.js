"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
import DashboardTab from "@/modules/admin/components/DashboardTab";
import InquiryPipelineTab from "@/modules/admin/components/InquiryPipelineTab";
import ProjectsTab from "@/modules/admin/components/ProjectsTab";
import AccountsTab from "@/modules/admin/components/AccountsTab";
import AdminSettingsModal from "@/modules/admin/components/AdminSettingsModal";
import { useAuthoritativeClock } from "@/modules/admin/hooks/useAuthoritativeClock";
import { getThemePreference, setThemePreference } from "@/modules/shared/SystemThemeSync";
import {
  LockIcon,
  ShieldCheckIcon,
  UserIcon,
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
  CloseIcon,
} from "@/modules/shared/Icons";
import { INITIAL_PROJECTS, deduplicateProjects, broadcastProjectsChange, subscribeProjectsChange } from "@/modules/shared/projectsHelper";
import { authFetch } from "@/modules/shared/authFetch";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [customProjects, setCustomProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [clientBriefs, setClientBriefs] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Construction & System states
  const [siteProject, setSiteProject] = useState(null);
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);
  const [delayEvents, setDelayEvents] = useState([]);
  const [warrantyTickets, setWarrantyTickets] = useState([]);
  const [siteExpenses, setSiteExpenses] = useState([]);
  const [activeDbProvider, setActiveDbProvider] = useState("cloud");

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
  const {
    dateStr,
    shortDateStr,
    timeStr,
    timezoneCode,
    isSynced,
    hasClockSkew,
    skewText,
  } = useAuthoritativeClock("Asia/Manila");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

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
          const unified = deduplicateProjects(parsed);
          setCustomProjects(unified);
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
          const enriched = parsed.map((b) => {
            const email = (b.clientEmail || b.client_email || "").toLowerCase().trim();
            const avatar =
              b.avatarUrl ||
              b.avatar_url ||
              (email === "rayquirante@gmail.com" || email === "martquirante04@gmail.com"
                ? "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
                : null);
            return {
              ...b,
              avatarUrl: avatar,
              avatar_url: avatar,
              authProvider: b.authProvider || b.auth_provider || (email.endsWith("@gmail.com") ? "google" : "local"),
            };
          });
          setClientBriefs(enriched);
        }
      }
    } catch (e) {
      console.warn("Could not load stored briefs:", e);
    }
  };

  const initialLoadDoneRef = useRef(false);

  const loadProjectsAndBriefs = async (isInitial = false) => {
    // Only show skeleton loader on genuine initial mount if no data is stored/present yet
    if (isInitial && !initialLoadDoneRef.current) {
      const hasStoredProjects = typeof window !== "undefined" && localStorage.getItem("mcpa_portfolio_projects");
      const hasStoredBriefs = typeof window !== "undefined" && localStorage.getItem("mcpa_client_briefs");
      if (!hasStoredProjects && !hasStoredBriefs && allProjects.length === 0 && clientBriefs.length === 0) {
        setIsLoadingData(true);
      }
    }

    // Try to load from Backend API first
    try {
      const [projRes, briefsRes, siteRes] = await Promise.allSettled([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/briefs").then((r) => r.json()),
        fetch("/api/construction/project").then((r) => r.json()),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.success && Array.isArray(projRes.value.projects)) {
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
          featuredOnHome: Boolean(p.featured_on_home),
          lotArea: p.lot_area,
          floorArea: p.floor_area,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          features: p.features || [],
          architecturalDetails: p.architectural_details,
        }));
        setCustomProjects(dbProjects);
        setAllProjects(dbProjects);
        if (typeof window !== "undefined") {
          const serialized = JSON.stringify(dbProjects);
          if (localStorage.getItem("mcpa_portfolio_projects") !== serialized) {
            localStorage.setItem("mcpa_portfolio_projects", serialized);
          }
        }
      } else {
        fallbackLoadStoredProjects();
      }

      if (briefsRes.status === "fulfilled" && briefsRes.value?.success) {
        const dbBriefs = (briefsRes.value.briefs || []).map((b) => {
          const email = (b.client_email || b.clientEmail || "").toLowerCase().trim();
          const avatar =
            b.avatar_url ||
            b.avatarUrl ||
            (email === "rayquirante@gmail.com" || email === "martquirante04@gmail.com"
              ? "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
              : null);
          return {
            id: b.brief_id || b.id,
            submissionId: b.submission_id || b.submissionId,
            clientName: b.client_name || b.clientName,
            clientEmail: b.client_email || b.clientEmail,
            clientPhone: b.client_phone || b.clientPhone,
            avatarUrl: avatar,
            avatar_url: avatar,
            authProvider: b.auth_provider || b.authProvider || (email.endsWith("@gmail.com") ? "google" : null),
            projectType: b.project_type || b.projectType,
          preferredStyle: b.preferred_style || b.preferredStyle,
          budgetRange: b.budget_range || b.budgetRange,
          lotStatus: b.lot_status || b.lotStatus,
          lotArea: b.lot_area || b.lotArea,
          targetDate: b.target_date || b.targetDate,
          location: b.location,
          mapCoordinates: b.map_coordinates || b.mapCoordinates,
          locationType: b.location_type || b.locationType || "Local",
          meetingMode: b.meeting_mode || b.meetingMode || "Online Video Call",
          venueType: b.venue_type || b.venueType || null,
          venueDetails: b.venue_details || b.venueDetails || null,
          storeys: b.storeys || null,
          siteAddressDetails: b.site_address_details || b.siteAddressDetails || null,
          spatialWishlist: b.spatial_wishlist || b.spatialWishlist || null,
          message: b.message || null,
          meetingDate: b.meeting_date || b.meetingDate || "",
          meetingTime: b.meeting_time || b.meetingTime || "",
          meetingLink: b.meeting_link || b.meetingLink || "",
          meetingNotes: b.meeting_notes || b.meetingNotes || "",
          quotationAmount: b.quotation_amount || b.quotationAmount,
          quotationNotes: b.quotation_notes || b.quotationNotes,
          clientPortalCode: b.client_portal_code || b.clientPortalCode,
          financingOption: b.financing_option || b.financingOption,
          uploadedFiles: b.uploaded_files || b.uploadedFiles || [],
          status: b.status || "Pending Review",
          createdAt: b.created_at || b.createdAt,
        };
      });
      setClientBriefs(dbBriefs);
        if (typeof window !== "undefined") {
          const serializedBriefs = JSON.stringify(dbBriefs);
          if (localStorage.getItem("mcpa_client_briefs") !== serializedBriefs) {
            localStorage.setItem("mcpa_client_briefs", serializedBriefs);
          }
        }
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
    } finally {
      initialLoadDoneRef.current = true;
      setIsLoadingData(false);
    }
  };

  // Check existing session, health status & live clock
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initAdmin = async () => {
        try {
          const savedAuth =
            localStorage.getItem("mcpa_admin_authenticated") ||
            sessionStorage.getItem("mcpa_admin_authenticated");
          const savedUser =
            localStorage.getItem("mcpa_admin_user") ||
            sessionStorage.getItem("mcpa_admin_user");

          if (savedAuth === "true") {
            const savedToken =
              localStorage.getItem("mcpa_admin_token") ||
              sessionStorage.getItem("mcpa_admin_token");

            // If session was saved previously without a JWT token, require fresh sign in
            if (!savedToken) {
              localStorage.removeItem("mcpa_admin_authenticated");
              sessionStorage.removeItem("mcpa_admin_authenticated");
              setIsAuthenticated(false);
              setCurrentUser(null);
            } else if (savedUser) {
              try {
                const parsed = JSON.parse(savedUser);
                if ((parsed?.role || "").toLowerCase() === "client") {
                  // Purge non-admin user from admin session
                  localStorage.removeItem("mcpa_admin_authenticated");
                  sessionStorage.removeItem("mcpa_admin_authenticated");
                  localStorage.removeItem("mcpa_admin_user");
                  sessionStorage.removeItem("mcpa_admin_user");
                  localStorage.removeItem("mcpa_admin_token");
                  sessionStorage.removeItem("mcpa_admin_token");
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                } else {
                  setIsAuthenticated(true);
                  setCurrentUser(parsed);
                  // Background refresh full profile from server
                  if (parsed.email) {
                    authFetch(`/api/admin/profile`)
                      .then((r) => {
                        if (r.status === 401) {
                          // Token expired on server; clear stale session
                          localStorage.removeItem("mcpa_admin_authenticated");
                          sessionStorage.removeItem("mcpa_admin_authenticated");
                          localStorage.removeItem("mcpa_admin_token");
                          sessionStorage.removeItem("mcpa_admin_token");
                          setIsAuthenticated(false);
                          setCurrentUser(null);
                          return null;
                        }
                        return r.json();
                      })
                      .then((d) => {
                        if (d?.success && d?.user) {
                          const refreshed = {
                            ...d.user,
                            name: d.user.fullName || d.user.name || parsed.name || "MCPA Administrator",
                          };
                          setCurrentUser(refreshed);
                          localStorage.setItem("mcpa_admin_user", JSON.stringify(refreshed));
                          sessionStorage.setItem("mcpa_admin_user", JSON.stringify(refreshed));
                        }
                      })
                      .catch(() => {});
                  }
                }
              } catch (e) {}
            } else {
              setIsAuthenticated(true);
            }
          }
        } catch (e) {
          console.warn("Auth initialization error:", e);
        }

        try {
          const savedCollapsed = localStorage.getItem("mcpa_admin_sidebar_collapsed");
          if (savedCollapsed !== null) {
            setIsSidebarCollapsed(savedCollapsed === "true");
          }
        } catch (e) {}

        // Instant local hydration from cache so UI is populated immediately
        fallbackLoadStoredProjects();
        fallbackLoadStoredBriefs();

        // Initial fetch with isInitial=true (skeleton only if cache was empty)
        loadProjectsAndBriefs(true);
        fetchHealthStatus();

        // Real-time synchronization subscription across tabs (completely silent)
        const unsubscribeProjects = subscribeProjectsChange(() => {
          loadProjectsAndBriefs(false);
        });

        // Theme initialization
        try {
          const pref = getThemePreference();
          setThemePref(pref);
          setCurrentThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
        } catch (e) {}

        return () => {
          if (unsubscribeProjects) unsubscribeProjects();
        };
      };

      const cleanupPromise = initAdmin();

      const handleThemeChange = (e) => {
        if (e?.detail) {
          setThemePref(e.detail.mode || "system");
          setCurrentThemeMode(e.detail.isDark ? "dark" : "light");
        }
      };
      window.addEventListener("mcpa-theme-change", handleThemeChange);

      // Background silent auto-sync every 15 seconds (never shows skeleton)
      const syncInterval = setInterval(() => {
        loadProjectsAndBriefs(false);
      }, 15000);
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener("mcpa-theme-change", handleThemeChange);
        if (cleanupPromise && typeof cleanupPromise.then === "function") {
          cleanupPromise.then((clean) => typeof clean === "function" && clean());
        }
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
    loadProjectsAndBriefs(false);
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
          portalType: "admin",
        }),
      });

      const data = await res.json();

      if (res.status === 403 || data.isRoleMismatch || (data.user && (data.user.role || "").toLowerCase() === "client")) {
        setAuthError(data.message || "Access Denied: Ang account na ito ay para sa Client lamang. Mangyaring mag-log in sa Client Portal (/portal).");
        setIsLoggingIn(false);
        return;
      }

      if (res.ok && data.success) {
        if (data.user && (data.user.role || "").toLowerCase() !== "admin" && (data.user.role || "").toLowerCase() !== "super_admin") {
          setAuthError("Access Denied: Administrative privileges required. Client accounts must log in via /portal.");
          setIsLoggingIn(false);
          return;
        }

        setIsAuthenticated(true);
        setIsLoggingIn(false);
        setPasswordInput("");
        
        const loggedUser = data.user
          ? {
              ...data.user,
              name: data.user.fullName || data.user.name || "MCPA Administrator",
            }
          : {
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

      setAuthError(data.message || "Invalid administrative credentials. Please verify your email and password.");
      setIsLoggingIn(false);
    } catch (err) {
      setAuthError("Could not reach backend authentication server. Ensure the backend process is active.");
      setIsLoggingIn(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    if (!updatedUser) return;
    const formatted = {
      ...updatedUser,
      name: updatedUser.fullName || updatedUser.name || "MCPA Administrator",
    };
    setCurrentUser(formatted);
    try {
      localStorage.setItem("mcpa_admin_user", JSON.stringify(formatted));
      sessionStorage.setItem("mcpa_admin_user", JSON.stringify(formatted));
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsAuthenticated(false);
    localStorage.removeItem("mcpa_admin_authenticated");
    sessionStorage.removeItem("mcpa_admin_authenticated");
    localStorage.removeItem("mcpa_admin_token");
    sessionStorage.removeItem("mcpa_admin_token");
    localStorage.removeItem("mcpa_admin_user");
    sessionStorage.removeItem("mcpa_admin_user");
    setPasswordInput("");
    setCurrentUser(null);
    setIsMobileSidebarOpen(false);
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
        body: JSON.stringify({
          ...newProject,
          featured_on_home: Boolean(newProject.featuredOnHome),
          lot_area: newProject.lotArea,
          floor_area: newProject.floorArea,
          bedrooms: newProject.bedrooms,
          bathrooms: newProject.bathrooms,
          features: newProject.features,
          architectural_details: newProject.architecturalDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.project) {
        throw new Error(data?.message || `Failed to save project (HTTP ${res.status})`);
      }

      const p = data.project;
      finalProj = {
        ...newProject,
        id: p.project_id || p.id,
        status: p.status || newProject.status,
        month: p.month || newProject.month,
        featuredOnHome: Boolean(p.featured_on_home),
        lotArea: p.lot_area,
        floorArea: p.floor_area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        features: p.features || [],
        architecturalDetails: p.architectural_details,
      };

      const updatedCustom = [finalProj, ...customProjects.filter((p) => String(p.id) !== String(newProject.id) && String(p.id) !== String(finalProj.id))];
      setCustomProjects(updatedCustom);
      const updatedAll = [finalProj, ...allProjects.filter((p) => String(p.id) !== String(newProject.id) && String(p.id) !== String(finalProj.id))];
      setAllProjects(updatedAll);
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Successfully published "${finalProj.name}"!`);
      broadcastProjectsChange();
      return { success: true, project: finalProj };
    } catch (e) {
      console.error("Could not sync project to backend:", e);
      showToast(`Save Error: ${e.message}`);
      return { success: false, error: e.message };
    }
  };

  const handleUpdateProject = async (projectId, updatedProject) => {
    try {
      // 1. Resolve true numeric database ID if current ID is a client temporary string
      let targetId = projectId;
      if (typeof targetId === "string" && (targetId.startsWith("PROJ-") || isNaN(parseInt(targetId, 10)))) {
        const matched = allProjects.find(
          (p) => p.name && updatedProject.name && p.name.trim().toLowerCase() === updatedProject.name.trim().toLowerCase() && !String(p.id).startsWith("PROJ-")
        );
        if (matched && matched.id && !isNaN(parseInt(matched.id, 10))) {
          targetId = matched.id;
        }
      }

      let res = await fetch(`/api/projects/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedProject,
          featured_on_home: Boolean(updatedProject.featuredOnHome),
          lot_area: updatedProject.lotArea,
          floor_area: updatedProject.floorArea,
          bedrooms: updatedProject.bedrooms,
          bathrooms: updatedProject.bathrooms,
          features: updatedProject.features,
          architectural_details: updatedProject.architecturalDetails,
        }),
      });

      // If PUT fails because project was not found in DB yet (e.g. was cached locally), fall back to POST create
      if (res.status === 404 || (res.status >= 400 && String(targetId).startsWith("PROJ-"))) {
        return await handleAddProject(updatedProject);
      }

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned error (${res.status})`);
      }

      const updatedCustom = customProjects.map((p) => (String(p.id) === String(projectId) || String(p.id) === String(targetId) ? { ...p, ...updatedProject } : p));
      setCustomProjects(updatedCustom);
      const updatedAll = allProjects.map((p) => (String(p.id) === String(projectId) || String(p.id) === String(targetId) ? { ...p, ...updatedProject } : p));
      setAllProjects(updatedAll);
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Successfully updated "${updatedProject.name}"!`);
      broadcastProjectsChange();
      return { success: true };
    } catch (e) {
      console.error("Could not update project in backend:", e);
      showToast(`Update Error: ${e.message}`);
      return { success: false, error: e.message };
    }
  };

  const handleToggleFeaturedProject = async (projectId) => {
    const target = allProjects.find((p) => String(p.id) === String(projectId));
    if (!target) return;

    const currentStatus = Boolean(target.featuredOnHome);
    const newStatus = !currentStatus;

    if (newStatus) {
      const featuredCount = allProjects.filter((p) => p.featuredOnHome && p.isWebVisible !== false).length;
      if (featuredCount >= 6) {
        showToast("Maximum 6 projects can be featured on the Home Page. Please unfeature another project first.");
        return;
      }
    }

    const updatedCustom = customProjects.map((p) => (String(p.id) === String(projectId) ? { ...p, featuredOnHome: newStatus } : p));
    setCustomProjects(updatedCustom);
    const updatedAll = allProjects.map((p) => (String(p.id) === String(projectId) ? { ...p, featuredOnHome: newStatus } : p));
    setAllProjects(updatedAll);

    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(newStatus ? `"${target.name}" is now featured on the Home Page!` : `"${target.name}" removed from Home Page.`);
      broadcastProjectsChange();
    } catch (e) {}

    try {
      const res = await fetch(`/api/projects/${projectId}/featured`, { method: "PATCH" });
      const data = await res.json();
      if (!data.success && data.message) {
        showToast(data.message);
      }
      broadcastProjectsChange();
    } catch (e) {
      console.warn("Could not sync featured status with backend:", e);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    const updatedCustom = customProjects.filter((p) => String(p.id) !== String(projectId));
    setCustomProjects(updatedCustom);
    const updatedAll = allProjects.filter((p) => String(p.id) !== String(projectId));
    setAllProjects(updatedAll);

    try {
      localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(updatedAll));
      showToast(`Removed "${projectName}" from portfolio.`);
      broadcastProjectsChange();
    } catch (err) {
      console.warn("Error updating project list:", err);
    }

    // Sync deletion with Backend
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      broadcastProjectsChange();
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
        const siteEndpoint = siteProject?.project_code
          ? `/api/construction/projects/${siteProject.project_code}`
          : "/api/construction/project";
        const siteRes = await fetch(siteEndpoint).then((r) => r.json());
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
        const siteEndpoint = siteProject?.project_code
          ? `/api/construction/projects/${siteProject.project_code}`
          : "/api/construction/project";
        const siteRes = await fetch(siteEndpoint).then((r) => r.json());
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
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
        {/* Top-Right Settings Button */}
        <div className="absolute top-5 right-5 z-20">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-[4px] text-neutral-900 dark:text-white hover:opacity-75 transition-opacity cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-neutral-900 dark:text-white" />
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

        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.18)] transition-colors">
          {/* Brand Logo & Lock Badge */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-44 h-10 mb-6">
              {/* Light Mode Logo */}
              <Image
                src="/assets/mcpa-logo.svg"
                alt="MCPA Construction and Supply"
                fill
                priority
                unoptimized
                className="object-contain block dark:hidden"
                sizes="176px"
              />
              {/* Dark Mode Logo */}
              <Image
                src="/assets/logo-white.svg"
                alt="MCPA Construction and Supply"
                fill
                priority
                unoptimized
                className="object-contain hidden dark:block"
                sizes="176px"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] text-[9.5px] font-mono uppercase tracking-[0.14em] font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
              <LockIcon className="w-3 h-3 text-amber-500" />
              <span>Restricted Terminal</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Administrative Console
            </h1>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 font-normal max-w-xs leading-relaxed">
              Authorized access only. Strictly reserved for MCPA management, engineering, and architectural staff.
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-5 p-3 rounded-[4px] border-l-2 border-l-rose-500 border-y border-r border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs text-center font-mono">
              {authError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="adminEmail"
                className="block text-[10px] font-mono uppercase tracking-[0.12em] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Staff Email
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
                  className="w-full pl-9 pr-4 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono text-xs transition-colors"
                />
                <MailIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="adminPassword"
                  className="block text-[10px] font-mono uppercase tracking-[0.12em] font-bold text-neutral-600 dark:text-neutral-400"
                >
                  Access Key
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Reset Key?
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
                  className="w-full pl-9 pr-10 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono text-xs tracking-wider transition-colors"
                />
                <KeyRoundIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-amber-500 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-[0.08em] transition-colors shadow-[0_2px_8px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-3"
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
          <div className="mt-6 pt-5 border-t border-neutral-150 dark:border-white/[0.06] text-center">
            <Link
              href="/"
              onClick={() => setReturnToCompletedHome(true)}
              className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-mono cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
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
          currentUser={currentUser}
          onUserUpdate={handleUserUpdate}
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
    { id: "accounts", label: "Accounts", icon: UserIcon },
  ];

  const currentTabInfo = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-[4px] bg-emerald-500 text-neutral-950 border border-emerald-400 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
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

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-[280px] sm:w-72 max-w-[85vw] bg-white dark:bg-[#101218] border-r border-neutral-200 dark:border-white/5 flex flex-col justify-between z-50 transition-all duration-200 shrink-0 shadow-xl lg:shadow-none ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Section */}
        <div className="border-b border-neutral-200 dark:border-white/5 p-4">
          {/* Mobile View */}
          <div className="flex lg:hidden items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAdminReload}
              title="Reload Admin Console"
              className="flex items-center gap-2.5 min-w-0 bg-transparent border-0 p-0 cursor-pointer text-left"
            >
              <div className="relative w-36 h-9 shrink-0">
                <Image
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA Construction and Supply"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left block dark:hidden"
                  sizes="144px"
                />
                <Image
                  src="/assets/logo-white.svg"
                  alt="MCPA Construction and Supply"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left hidden dark:block"
                  sizes="144px"
                />
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-[4px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Sidebar"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:flex items-center justify-between w-full">
            {isSidebarCollapsed ? (
              <div className="w-full flex flex-col items-center gap-2.5 py-1">
                <button
                  type="button"
                  onClick={handleAdminReload}
                  title="Reload Admin Console"
                  className="relative z-10 w-10 h-10 rounded-[4px] bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 p-1 flex items-center justify-center shrink-0 hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer"
                >
                  <Image
                    src="/assets/mcpa-logo.svg"
                    alt="MCPA System Logo"
                    fill
                    priority
                    unoptimized
                    className="object-contain p-1.5 block dark:hidden"
                    sizes="40px"
                  />
                  <Image
                    src="/assets/logo-white.svg"
                    alt="MCPA System Logo"
                    fill
                    priority
                    unoptimized
                    className="object-contain p-1.5 hidden dark:block"
                    sizes="40px"
                  />
                </button>
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Expand Navigation"
                  aria-label="Expand Sidebar"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-3">
                <button
                  type="button"
                  onClick={handleAdminReload}
                  title="Reload Admin Console"
                  className="flex items-center gap-2.5 min-w-0 bg-transparent border-0 p-0 cursor-pointer text-left"
                >
                  <div className="relative w-36 h-9 shrink-0">
                    <Image
                      src="/assets/mcpa-logo.svg"
                      alt="MCPA Construction and Supply"
                      fill
                      priority
                      unoptimized
                      className="object-contain object-left block dark:hidden"
                      sizes="144px"
                    />
                    <Image
                      src="/assets/logo-white.svg"
                      alt="MCPA Construction and Supply"
                      fill
                      priority
                      unoptimized
                      className="object-contain object-left hidden dark:block"
                      sizes="144px"
                    />
                  </div>
                </button>
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Collapse Navigation"
                  aria-label="Collapse Sidebar"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav
          className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2.5 ${
            isSidebarCollapsed ? "lg:p-2" : "lg:p-2.5"
          }`}
        >
          <div className="px-2 pb-1.5 pt-1 text-[9.5px] font-mono uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 font-bold block lg:hidden">
            Main Menu
          </div>

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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] text-xs font-mono tracking-wider transition-colors cursor-pointer relative ${
                    isSidebarCollapsed
                      ? "lg:h-10 lg:justify-center lg:px-0"
                      : "justify-between"
                  } ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div
                    className={`flex items-center min-w-0 gap-3 ${
                      isSidebarCollapsed ? "lg:justify-center lg:gap-0" : ""
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-neutral-950"
                          : "text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500"
                      }`}
                    />
                    <span
                      className={`truncate ${
                        isSidebarCollapsed ? "block lg:hidden" : "block"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <>
                      {/* Mobile Badge */}
                      <span
                        className={`lg:hidden px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold shrink-0 ${
                          isActive
                            ? "bg-neutral-950 text-white dark:bg-neutral-950 dark:text-white"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {item.badge}
                      </span>

                      {/* Desktop Badge */}
                      <span
                        className={`hidden ${
                          isSidebarCollapsed
                            ? "lg:flex absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-[3px] bg-amber-500 text-neutral-950 font-bold text-[9px] items-center justify-center font-mono"
                            : "lg:inline-block px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold shrink-0 " +
                              (isActive
                                ? "bg-neutral-950 text-white dark:bg-neutral-950 dark:text-white"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400")
                        }`}
                      >
                        {item.badge}
                      </span>
                    </>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isSidebarCollapsed && (
                  <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-[4px] bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-mono shadow-xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1 py-0.2 rounded-[2px] bg-amber-500 text-neutral-950 font-bold text-[9px]">
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
        <div className="border-t border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
          {/* Mobile Profile View */}
          <div className="lg:hidden p-4 pb-8 space-y-3">
            <div
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-3 p-1.5 -m-1.5 rounded-[4px] hover:bg-neutral-200/50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
              role="button"
              tabIndex={0}
              title="Open Account Settings & Profile"
            >
              <div className="w-9 h-9 rounded-[4px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0 font-mono overflow-hidden group-hover:border-amber-500 transition-colors shadow-xs">
                {currentUser?.avatar_url || currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar_url || currentUser.avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (currentUser?.fullName || currentUser?.name || "Raymart Quirante")
                    .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
                    .trim()
                    .split(/\s+/)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "RQ"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {currentUser?.fullName || currentUser?.name || "Raymart Quirante"}
                </p>
                <div className="flex items-center">
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                    {currentUser?.role || "SUPER ADMIN"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-amber-500" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Desktop Profile View */}
          <div
            className={`hidden lg:block ${
              isSidebarCollapsed ? "p-3 flex flex-col items-center gap-2.5" : "p-3.5 space-y-3"
            }`}
          >
            {isSidebarCollapsed ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="relative group cursor-pointer focus:outline-none"
                  title={`${currentUser?.fullName || currentUser?.name || "Raymart Quirante"} (${currentUser?.role || "ADMIN"})`}
                >
                  <div className="w-8 h-8 rounded-[4px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0 font-mono overflow-hidden group-hover:border-amber-500 transition-colors shadow-xs">
                    {currentUser?.avatar_url || currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar_url || currentUser.avatarUrl}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentUser?.fullName || currentUser?.name || "Raymart Quirante")
                        .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
                        .trim()
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "RQ"
                    )}
                  </div>

                  {/* Tooltip */}
                  <div className="hidden lg:block absolute left-full bottom-0 ml-2 px-2.5 py-1 rounded-[4px] bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-mono shadow-xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <p className="font-bold">{currentUser?.fullName || currentUser?.name || "Raymart Quirante"}</p>
                    <p className="text-[10px] text-neutral-400 uppercase">{currentUser?.role || "ADMIN"}</p>
                    <p className="text-[9px] text-amber-400 mt-0.5 font-medium">Click to edit Profile & PFP</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Admin Settings & Profile"
                  aria-label="Settings"
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] text-neutral-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-neutral-200/60 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLogout}
                  title="Log Out"
                  aria-label="Log Out"
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <div
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center gap-3 p-1.5 -m-1.5 rounded-[4px] hover:bg-neutral-200/50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                  role="button"
                  tabIndex={0}
                  title="Click to edit Account Settings & Profile"
                >
                  <div className="w-8 h-8 rounded-[4px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0 font-mono overflow-hidden group-hover:border-amber-500 transition-colors shadow-xs">
                    {currentUser?.avatar_url || currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar_url || currentUser.avatarUrl}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentUser?.fullName || currentUser?.name || "Raymart Quirante")
                        .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
                        .trim()
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "RQ"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {currentUser?.fullName || currentUser?.name || "Raymart Quirante"}
                    </p>
                    <div className="flex items-center">
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                        {currentUser?.role || "SUPER ADMIN"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-200/60 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <LogOutIcon className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 transition-colors select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-[4px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Open Sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Mobile Branding & Active Tab Indicator */}
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="relative w-20 h-6 shrink-0">
                <Image
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left block dark:hidden"
                  sizes="80px"
                />
                <Image
                  src="/assets/logo-white.svg"
                  alt="MCPA"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left hidden dark:block"
                  sizes="80px"
                />
              </div>
              <span className="text-neutral-300 dark:text-neutral-700 select-none text-xs">/</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                {currentTabInfo.label}
              </span>
            </div>

            {/* Desktop Collapse/Expand Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-[4px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-time Authoritative Server-Synced Clock (Pure Text Typography) */}
            {timeStr && (
              <div
                className="flex items-center text-xs font-mono text-neutral-500 dark:text-neutral-400 select-none py-1"
                title={
                  hasClockSkew
                    ? `System Time Verified (PHT). Device clock differs by ${skewText}, auto-corrected via server.`
                    : "Philippine Standard Time (PHT) · Real-time Server Synced"
                }
              >
                <span className="tabular-nums text-neutral-600 dark:text-neutral-300">
                  <span className="hidden md:inline">{dateStr} · </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {timeStr}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500 ml-1 text-[11px]">
                    {timezoneCode}
                  </span>
                </span>
              </div>
            )}

            {/* Subtle hairline separator */}
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

            {/* Notification Bell */}
            <button
              onClick={() => {
                setActiveTab("briefs");
                setIsMobileSidebarOpen(false);
              }}
              title="View Inquiries"
              className="relative p-1.5 rounded-[4px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <BellIcon className="w-4 h-4" />
            </button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setReturnToCompletedHome(true)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors p-1.5 rounded-[4px] hover:bg-neutral-100 dark:hover:bg-white/5"
              title="View Public Site"
            >
              <span className="hidden sm:inline">View Site</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 max-w-screen-2xl w-full mx-auto pb-24 lg:pb-6">

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <DashboardTab
            clientBriefs={clientBriefs}
            allProjects={allProjects}
            onNavigateTab={setActiveTab}
            isLoading={isLoadingData}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: INQUIRIES PIPELINE & FLOWCHART LIFECYCLE                     */}
        {/* ================================================================= */}
        {activeTab === "briefs" && (
          <InquiryPipelineTab
            clientBriefs={clientBriefs}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateBriefStatus}
            onProvisionAccess={handleProvisionAccess}
            onDeleteBrief={handleDeleteBrief}
            showToast={showToast}
            isLoading={isLoadingData}
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
            onToggleFeatured={handleToggleFeaturedProject}
            showToast={showToast}
            isLoading={isLoadingData}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: ACCOUNTS MANAGEMENT                                          */}
        {/* ================================================================= */}
        {activeTab === "accounts" && (
          <AccountsTab
            clientBriefs={clientBriefs}
          />
        )}

      </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb-Friendly Mobile App Navigation) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0e1017]/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl transition-all select-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileSidebarOpen(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-[4px] transition-all cursor-pointer relative ${
                isActive
                  ? "text-amber-500 font-bold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-105" : ""}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-[3px] bg-amber-500 text-neutral-950 font-bold text-[8px] flex items-center justify-center ring-2 ring-white dark:ring-[#0e1017]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono tracking-tight mt-1 truncate ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 4th Tab: Full Menu Drawer Trigger */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-[4px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-tight mt-1">Menu</span>
        </button>
      </nav>

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={handleUserUpdate}
        onOpenResetPin={() => setIsResetModalOpen(true)}
      />

      {/* 4-Step Forgot Password / Reset Password Modal for Authenticated Admin */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        initialEmail={currentUser?.email || emailInput}
        onSuccessReturn={(verifiedEmail) => {
          setIsResetModalOpen(false);
          showToast("Password updated successfully!");
        }}
      />

      {/* Log Out Confirmation Dialog */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsLogoutConfirmOpen(false)}
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] rounded-[8px] shadow-2xl p-6 sm:p-7 text-center z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-3">
              <LogOutIcon className="w-8 h-8 text-rose-500" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Confirm Log Out
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Are you sure you want to end your active session? You will need your administrator credentials to sign back in.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-[4px] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
