"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
import DashboardTab from "@/modules/admin/components/DashboardTab";
import InquiryPipelineTab from "@/modules/admin/components/InquiryPipelineTab";
import ProjectsTab from "@/modules/admin/components/ProjectsTab";
import AccountsTab from "@/modules/admin/components/AccountsTab";
import AdminMeetingsTab from "@/modules/admin/components/AdminMeetingsTab";
import AdminDocumentRequestsTab from "@/modules/admin/components/AdminDocumentRequestsTab";
import AdminBlueprintsTab from "@/modules/admin/components/AdminBlueprintsTab";
import AdminBudgetQuotationTab from "@/modules/admin/components/AdminBudgetQuotationTab";
import AdminGroundbreakingTab from "@/modules/admin/components/AdminGroundbreakingTab";
import SiteProgressTab from "@/modules/admin/components/SiteProgressTab";
import DelayManagementTab from "@/modules/admin/components/DelayManagementTab";
import BillingLedgerTab from "@/modules/admin/components/BillingLedgerTab";
import FinishedProjectsTab from "@/modules/admin/components/FinishedProjectsTab";
import AdminChatbotTab from "@/modules/admin/components/AdminChatbotTab";
import AdminIncomingCallManager from "@/modules/admin/components/AdminIncomingCallManager";
import AdminSettingsModal from "@/modules/admin/components/AdminSettingsModal";
import AdminNotificationCenter from "@/modules/admin/components/AdminNotificationCenter";
import Snackbar from "@/modules/shared/Snackbar";
import { useAuthoritativeClock } from "@/modules/admin/hooks/useAuthoritativeClock";
import { getThemePreference, setThemePreference } from "@/modules/shared/SystemThemeSync";
import {
  CalendarCheck as CalendarIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  HardHat as HardHatIcon,
  Clock as ClockIcon,
  CreditCard as CreditCardIcon,
  Sparkles as SparklesIcon,
  Archive as ArchiveIcon,
  MessageSquare as MessageSquareIcon,
} from "lucide-react";
import { loadDocumentRequests } from "@/modules/portal/utils/documentRequestsHelper";
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

export function resolveAdminAvatar(user) {
  if (!user) return null;
  const direct = user.avatar_url || user.avatarUrl;
  if (
    direct &&
    typeof direct === "string" &&
    direct.trim() &&
    direct !== "null" &&
    direct !== "undefined"
  ) {
    return direct.trim();
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mcpa_admin_avatar");
      if (stored && stored.trim() && stored !== "null" && stored !== "undefined") {
        return stored.trim();
      }
    } catch {}
  }

  const email = (user.email || "").toLowerCase().trim();
  const name = (user.fullName || user.name || "").toLowerCase().trim();
  if (
    email.includes("quirante") ||
    email === "dbprojectmartquirante@gmail.com" ||
    email === "martquirante@gmail.com" ||
    email === "martquirante04@gmail.com" ||
    name.includes("raymart") ||
    name.includes("quirante")
  ) {
    return "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
  }

  return null;
}

export const TAB_ROLE_PERMISSIONS = {
  dashboard: ["admin", "super_admin", "architect", "engineer"],
  blueprints: ["admin", "super_admin", "architect", "engineer"],
  meetings: ["admin", "super_admin", "architect", "engineer"],
  documents: ["admin", "super_admin", "architect", "engineer"],
  quotations: ["admin", "super_admin", "architect"],
  projects: ["admin", "super_admin", "architect"],
  "site-progress": ["admin", "super_admin", "engineer"],
  delays: ["admin", "super_admin", "engineer"],
  groundbreaking: ["admin", "super_admin", "engineer"],
  "finished-projects": ["admin", "super_admin", "architect", "engineer"],
  briefs: ["admin", "super_admin"],
  billing: ["admin", "super_admin"],
  accounts: ["admin", "super_admin"],
  chatbot: ["admin", "super_admin"],
};

export function getRoleBadgeMeta(role) {
  const r = (role || "").toLowerCase().trim();
  if (r === "architect") {
    return {
      title: "PROJECT ARCHITECT",
      badgeClass: "text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/30",
      consoleTitle: "Architectural Planning & Design",
      defaultTab: "blueprints",
      baseTabs: ["dashboard", "blueprints", "meetings", "documents"],
    };
  }
  if (r === "engineer") {
    return {
      title: "SITE ENGINEER",
      badgeClass: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
      consoleTitle: "Site Engineering & Execution",
      defaultTab: "site-progress",
      baseTabs: ["dashboard", "site-progress", "meetings", "blueprints"],
    };
  }
  return {
    title: "ADMINISTRATOR",
    badgeClass: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    consoleTitle: "Executive Administration",
    defaultTab: "dashboard",
    baseTabs: ["dashboard", "briefs", "meetings", "documents"],
  };
}

function AdminAvatar({ user, sizeClasses = "w-8 h-8", textClasses = "text-xs" }) {
  const resolvedUrl = useMemo(() => resolveAdminAvatar(user), [user]);
  const [currentSrc, setCurrentSrc] = useState(resolvedUrl);
  const [hasFailed, setHasFailed] = useState(false);
  const [prevResolvedUrl, setPrevResolvedUrl] = useState(resolvedUrl);

  if (resolvedUrl !== prevResolvedUrl) {
    setPrevResolvedUrl(resolvedUrl);
    setCurrentSrc(resolvedUrl);
    setHasFailed(false);
  }

  const initials = useMemo(() => {
    const rawName = user?.fullName || user?.name || "Raymart Quirante";
    return (
      rawName
        .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "RQ"
    );
  }, [user?.fullName, user?.name]);

  const handleError = () => {
    const googleFallback =
      "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
    if (currentSrc && currentSrc !== googleFallback) {
      const email = (user?.email || "").toLowerCase().trim();
      const name = (user?.fullName || user?.name || "").toLowerCase().trim();
      if (
        email.includes("quirante") ||
        email === "dbprojectmartquirante@gmail.com" ||
        name.includes("raymart") ||
        name.includes("quirante")
      ) {
        setCurrentSrc(googleFallback);
        return;
      }
    }
    setHasFailed(true);
  };

  return (
    <div
      className={`${sizeClasses} rounded-[4px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold ${textClasses} flex items-center justify-center shrink-0 font-mono overflow-hidden group-hover:border-amber-500 transition-colors shadow-xs`}
    >
      {currentSrc && !hasFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt={user?.fullName || user?.name || "Admin Avatar"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={handleError}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

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
  const [liveMeetingsCount, setLiveMeetingsCount] = useState(null);
  const [readInquiryIds, setReadInquiryIds] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mcpa_read_inquiry_ids");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Construction & System states
  const [siteProject, setSiteProject] = useState(null);
  const siteProjectRef = useRef(null);
  siteProjectRef.current = siteProject;
  const [stage3Projects, setStage3Projects] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mcpa_stage3_projects");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);
  const [delayEvents, setDelayEvents] = useState([]);
  const [siteExpenses, setSiteExpenses] = useState([]);
  const [activeDbProvider, setActiveDbProvider] = useState("cloud");

  // Document requests badge counter & list
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [documentRequestsList, setDocumentRequestsList] = useState([]);
  useEffect(() => {
    const checkRequests = () => {
      try {
        const reqs = loadDocumentRequests();
        setDocumentRequestsList(reqs);
        const pendingOrUploaded = reqs.filter((r) => r.status === "uploaded" || r.status === "pending").length;
        setPendingDocsCount(pendingOrUploaded);
      } catch (e) {}
    };
    checkRequests();
    window.addEventListener("mcpa-document-requests-updated", checkRequests);
    window.addEventListener("storage", checkRequests);
    return () => {
      window.removeEventListener("mcpa-document-requests-updated", checkRequests);
      window.removeEventListener("storage", checkRequests);
    };
  }, []);

  // Budget & Quotation pending requests badge counter
  const [pendingQuotationsCount, setPendingQuotationsCount] = useState(0);
  useEffect(() => {
    const fetchPendingQuotations = async () => {
      try {
        const res = await authFetch("/api/admin/quotations/overview");
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.pendingRequestsCount === "number") {
            setPendingQuotationsCount(data.pendingRequestsCount);
          }
        }
      } catch (e) {}
    };
    fetchPendingQuotations();
    window.addEventListener("mcpa-quotations-updated", fetchPendingQuotations);
    return () => window.removeEventListener("mcpa-quotations-updated", fetchPendingQuotations);
  }, []);

  // Contracts pending countersignature badge counter
  const [pendingContractsCount, setPendingContractsCount] = useState(0);
  useEffect(() => {
    const fetchPendingContracts = async () => {
      try {
        const res = await authFetch("/api/admin/groundbreaking/overview");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.projects)) {
            const count = data.projects.filter(
              (p) => p.has_client_contract_signature && !p.has_contractor_contract_signature
            ).length;
            setPendingContractsCount(count);
          }
        }
      } catch (e) {}
    };
    fetchPendingContracts();
    window.addEventListener("mcpa-contract-updated", fetchPendingContracts);
    return () => window.removeEventListener("mcpa-contract-updated", fetchPendingContracts);
  }, []);

  // Chatbot Live Support & Unanswered questions badge counter
  const [chatbotBadgeCount, setChatbotBadgeCount] = useState(0);
  useEffect(() => {
    const fetchChatbotSummary = async () => {
      try {
        const res = await authFetch("/api/admin/chatbot/summary");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setChatbotBadgeCount((data.awaitingHumanCount || 0) + (data.openUnansweredCount || 0));
          }
        }
      } catch (e) {}
    };
    fetchChatbotSummary();
    const interval = setInterval(fetchChatbotSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  // Notification Center flyout & read state tracking (Declared unconditionally at top of AdminPage)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mcpa_admin_read_notification_ids");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const markNotificationAsRead = useCallback((notifId) => {
    if (!notifId) return;
    setReadNotificationIds((prev) => {
      if (prev.includes(notifId)) return prev;
      const next = [...prev, notifId];
      try {
        localStorage.setItem("mcpa_admin_read_notification_ids", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Aggregated real-time admin notifications across all MCPA construction stages
  const adminNotifications = useMemo(() => {
    const notifs = [];

    // Helper to resolve client avatar across clientBriefs and known client directories
    const resolveClientAvatarForNotif = (clientName, clientEmail, projectCode) => {
      const nameClean = (clientName || "").toLowerCase().trim();
      const emailClean = (clientEmail || "").toLowerCase().trim();
      const codeClean = (projectCode || "").trim();

      // Look in clientBriefs
      const matchingBrief = (clientBriefs || []).find((b) => {
        const bName = (b.clientName || b.client_name || "").toLowerCase().trim();
        const bEmail = (b.clientEmail || b.client_email || "").toLowerCase().trim();
        const bCode = (b.trackingId || b.submissionId || b.projectCode || "").trim();
        return (emailClean && bEmail === emailClean) ||
               (nameClean && bName === nameClean) ||
               (codeClean && bCode === codeClean);
      });

      if (matchingBrief) {
        const av = matchingBrief.avatarUrl || matchingBrief.avatar_url;
        if (av && typeof av === "string" && av.trim() && av !== "null" && av !== "undefined") {
          return av.trim();
        }
      }

      // Special known profiles (Engr. Raymart Quirante / Mart Quirante)
      if (
        nameClean.includes("raymart") ||
        nameClean.includes("quirante") ||
        emailClean.includes("rayquirante") ||
        emailClean.includes("martquirante")
      ) {
        return "https://lh3.googleusercontent.com/a/ACg8ocJSgjDxI6dd7r0yDQrkxJS9ussu_06e7avpCYzWzPxcaJkkFRMr=s96-c";
      }

      return null;
    };

    // 1. Rescheduled Meetings & Adjustments
    (clientBriefs || []).forEach((b) => {
      const isRescheduled = Boolean(
        b.isRescheduled ||
        b.updatedByClient ||
        b.rescheduleReason ||
        (b.status === "Meeting Scheduled" && b.isRescheduled)
      );
      if (isRescheduled) {
        const notifId = `reschedule-${b.id || b.submissionId || b.trackingId}`;
        const resolvedAvatar = b.avatarUrl || b.avatar_url || resolveClientAvatarForNotif(b.clientName || b.client_name, b.clientEmail || b.client_email, b.trackingId || b.submissionId);
        notifs.push({
          id: notifId,
          category: "reschedule",
          title: "Client Reschedule Request",
          description: `${b.clientName || b.client_name || "Client"} requested to adjust consultation schedule to ${b.meetingDate || b.meeting_date || "New Date"} at ${b.meetingTime || b.meeting_time || "New Time"} (${b.rescheduleReason || "Client Adjustment"}).`,
          clientName: b.clientName || b.client_name || "Valued Client",
          clientAvatar: resolvedAvatar,
          projectCode: b.trackingId || b.submissionId || b.projectCode,
          timestamp: b.updated_at || b.rescheduled_at || b.created_at || null,
          targetTab: "meetings",
          isRead: readNotificationIds.includes(notifId),
        });
      }
    });

    // 2. New Inquiries Received (Unread / Pending Review)
    (clientBriefs || []).forEach((b) => {
      const notifId = `inquiry-${b.id || b.submissionId || b.trackingId}`;
      const isRead =
        readInquiryIds.includes(b.id) ||
        readInquiryIds.includes(b.submissionId) ||
        readInquiryIds.includes(b.trackingId) ||
        b.is_read === true ||
        b.isRead === true ||
        readNotificationIds.includes(notifId);
      
      const s = (b.status || "").toLowerCase();
      const isTerminated = s.includes("reject") || s.includes("decline") || s.includes("closed") || s.includes("archive");

      if (!isTerminated) {
        const resolvedAvatar = b.avatarUrl || b.avatar_url || resolveClientAvatarForNotif(b.clientName || b.client_name, b.clientEmail || b.client_email, b.trackingId || b.submissionId);
        notifs.push({
          id: notifId,
          category: "inquiry",
          title: "New Project Inquiry",
          description: `${b.clientName || b.client_name || "Client"} submitted inquiry for ${b.projectType || b.project_type || "Construction Project"} in ${b.location || "Mindanao"} (Budget: ${b.budgetRange || b.budget_range || "Flexible"}).`,
          clientName: b.clientName || b.client_name || "Valued Client",
          clientAvatar: resolvedAvatar,
          projectCode: b.trackingId || b.submissionId || b.projectCode,
          timestamp: b.created_at || b.createdAt || b.submitted_at || b.submittedAt || null,
          targetTab: "briefs",
          isRead,
        });
      }
    });

    // 3. Document Uploads from Clients
    (documentRequestsList || []).forEach((r) => {
      if (r.status === "uploaded" || r.status === "pending") {
        const notifId = `doc-${r.id || r.requestId}`;
        const resolvedAvatar = r.clientAvatar || r.client_avatar || resolveClientAvatarForNotif(r.clientName, r.clientEmail, r.projectCode);
        const resolvedDocTime =
          r.uploadedAt ||
          r.uploaded_at ||
          r.file?.uploadedAt ||
          r.requestedAt ||
          r.requested_at ||
          r.issuedAt ||
          r.issued_at ||
          r.updatedAt ||
          r.updated_at ||
          r.createdAt ||
          r.created_at ||
          r.date ||
          null;
        notifs.push({
          id: notifId,
          category: "document",
          title: "Document Uploaded by Client",
          description: `${r.clientName || "Client"} uploaded ${r.title || "Required Document"} for engineering setback and boundary verification.`,
          clientName: r.clientName || "Valued Client",
          clientAvatar: resolvedAvatar,
          projectCode: r.projectCode || "MCPA-CLIENT",
          timestamp: resolvedDocTime,
          targetTab: "documents",
          isRead: readNotificationIds.includes(notifId),
        });
      }
    });

    // 4. Milestone Billing Proof-of-Payments
    (billingLedger || []).forEach((bill) => {
      if (bill.status === "Pending") {
        const notifId = `bill-${bill.id || bill.invoice_no}`;
        const resolvedAvatar = resolveClientAvatarForNotif(bill.client_name, bill.client_email, bill.project_code);
        notifs.push({
          id: notifId,
          category: "billing",
          title: "Milestone Payment Uploaded",
          description: `Proof of payment submitted for milestone ${bill.milestone_name || bill.invoice_no || "Billing"} (Amount: ₱${Number(bill.amount || 0).toLocaleString()}). Pending admin verification.`,
          clientName: bill.client_name || "Property Owner",
          clientAvatar: resolvedAvatar,
          projectCode: bill.project_code || "MCPA-BUILD",
          timestamp: bill.updated_at || bill.updatedAt || bill.proof_uploaded_at || bill.created_at || bill.createdAt || bill.due_date || null,
          targetTab: "billing",
          isRead: readNotificationIds.includes(notifId),
        });
      }
    });

    // 5. Signed Contracts Awaiting Countersignature
    if (pendingContractsCount > 0) {
      const notifId = "contract-pending-countersign";
      notifs.push({
        id: notifId,
        category: "contract",
        title: "Client Signed Construction Contract",
        description: `${pendingContractsCount} project contract(s) digitally executed by client — awaiting contractor countersignature & groundbreaking scheduling.`,
        clientName: "Contracts Queue",
        clientAvatar: null,
        projectCode: "MCPA-CONTRACTS",
        timestamp: Date.now(),
        targetTab: "groundbreaking",
        isRead: readNotificationIds.includes(notifId),
      });
    }

    // 6. Pending Quotation Requests
    if (pendingQuotationsCount > 0) {
      const notifId = "quotation-pending-req";
      notifs.push({
        id: notifId,
        category: "quotation",
        title: "Quotation / Cost Estimate Requested",
        description: `${pendingQuotationsCount} quotation request(s) awaiting BOQ calculation and publishing to client portal.`,
        clientName: "Estimating Queue",
        clientAvatar: null,
        projectCode: "MCPA-ESTIMATING",
        timestamp: Date.now(),
        targetTab: "quotations",
        isRead: readNotificationIds.includes(notifId),
      });
    }

    // 7. Active Site Delay Events
    (delayEvents || []).forEach((d) => {
      const notifId = `delay-${d.id || d.event_id || Math.random()}`;
      notifs.push({
        id: notifId,
        category: "delay",
        title: "Site Delay Event Logged",
        description: `${d.reason || d.title || "Weather / site progress disruption"} recorded. Adjustments required on timeline.`,
        clientName: "Site Engineer",
        clientAvatar: null,
        projectCode: d.project_code || "MCPA-SITE",
        timestamp: d.logged_at || d.loggedAt || d.created_at || d.createdAt || d.date || null,
        targetTab: "delays",
        isRead: readNotificationIds.includes(notifId),
      });
    });

    // Sort: Unread first, then newest timestamp
    return notifs.sort((a, b) => {
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      const timeA = typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() : Number(a.timestamp);
      const timeB = typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() : Number(b.timestamp);
      return (timeB || 0) - (timeA || 0);
    });
  }, [
    clientBriefs,
    documentRequestsList,
    billingLedger,
    delayEvents,
    pendingContractsCount,
    pendingQuotationsCount,
    readNotificationIds,
    readInquiryIds,
  ]);

  // Role-filtered notifications based on authenticated staff role
  const filteredAdminNotifications = useMemo(() => {
    const role = (currentUser?.role || "admin").toLowerCase().trim();
    if (role === "admin" || role === "super_admin") return adminNotifications;
    return adminNotifications.filter((n) => {
      const allowed = TAB_ROLE_PERMISSIONS[n.targetTab] || ["admin", "super_admin"];
      return allowed.includes(role);
    });
  }, [adminNotifications, currentUser]);

  const unreadNotificationCount = useMemo(() => {
    return filteredAdminNotifications.filter((n) => !n.isRead).length;
  }, [filteredAdminNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = filteredAdminNotifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem("mcpa_admin_read_notification_ids", JSON.stringify(allIds));
    } catch (e) {}
  }, [filteredAdminNotifications]);

  const handleSelectNotification = useCallback((notif) => {
    if (notif.id) {
      markNotificationAsRead(notif.id);
    }
    setIsNotificationCenterOpen(false);
    setIsMobileSidebarOpen(false);
    if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
  }, [markNotificationAsRead]);

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
  const [toast, setToast] = useState(null);
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
              (email === "rayquirante@gmail.com" || email === "martquirante04@gmail.com" || email === "martquirante@gmail.com"
                ? "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
                : null);
            return {
              ...b,
              avatarUrl: avatar,
              avatar_url: avatar,
              authProvider: b.authProvider || b.auth_provider || "local",
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
      const currentSelectedCode = siteProjectRef.current?.project_code;
      const [projRes, briefsRes, stage3Res, currentSiteRes] = await Promise.allSettled([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/briefs").then((r) => r.json()),
        fetch("/api/construction/stage3-projects").then((r) => r.json()),
        currentSelectedCode
          ? fetch(`/api/construction/projects/${encodeURIComponent(currentSelectedCode)}`).then((r) => r.json())
          : Promise.resolve(null),
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
            (email === "rayquirante@gmail.com" || email === "martquirante04@gmail.com" || email === "martquirante@gmail.com"
              ? "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
              : null);
          return {
            id: b.brief_id || b.id,
            submissionId: b.submission_id || b.submissionId,
            brief_id: b.brief_id || b.id,
            submission_id: b.submission_id || b.submissionId,
            client_project_id: b.client_project_id || null,
            current_project_stage: b.current_project_stage || b.current_stage_status || b.stage_id || "PRE_INQUIRY",
            current_stage_status: b.current_stage_status || b.current_project_stage || b.stage_id || "PRE_INQUIRY",
            project_code: b.project_code || null,
            is_rejected: Boolean(b.is_rejected || (b.status || "").toLowerCase().includes("reject")),
            is_archived: Boolean(b.is_archived || (b.status || "").toLowerCase().includes("archive")),
            rejection_reason: b.rejection_reason || null,
            rejection_notes: b.rejection_notes || null,
            clientName: b.client_name || b.clientName,
            clientEmail: b.client_email || b.clientEmail,
            clientPhone: b.client_phone || b.clientPhone,
            avatarUrl: avatar,
            avatar_url: avatar,
            authProvider: b.auth_provider || b.authProvider || null,
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

      if (stage3Res?.status === "fulfilled" && stage3Res.value?.success && Array.isArray(stage3Res.value.projects)) {
        setStage3Projects(stage3Res.value.projects);
        try {
          localStorage.setItem("mcpa_stage3_projects", JSON.stringify(stage3Res.value.projects));
        } catch (e) {}
      }

      if (currentSiteRes?.status === "fulfilled" && currentSiteRes.value?.success && currentSiteRes.value?.project) {
        const fresh = currentSiteRes.value;
        setSiteProject((prev) => {
          if (!prev?.project_code || prev.project_code !== fresh.project.project_code) return prev;
          return {
            ...prev,
            ...fresh.project,
            avatar_url: fresh.project.avatar_url || prev.avatar_url || null,
          };
        });
        setSiteMilestones(fresh.milestones || []);
        setSitePhotos(fresh.photos || []);
        setBillingLedger(fresh.billing || []);
        setDelayEvents(fresh.delays || []);
        setSiteExpenses(fresh.expenses || []);
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
                          if (refreshed.avatar_url || refreshed.avatarUrl) {
                            localStorage.setItem("mcpa_admin_avatar", refreshed.avatar_url || refreshed.avatarUrl);
                          }
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

      const handleStageSync = () => {
        loadProjectsAndBriefs(false);
      };
      window.addEventListener("mcpa-project-stage-updated", handleStageSync);
      window.addEventListener("mcpa-briefs-updated", handleStageSync);
      window.addEventListener("mcpa-meeting-updated", handleStageSync);

      // Background silent auto-sync every 15 seconds (never shows skeleton)
      const syncInterval = setInterval(() => {
        loadProjectsAndBriefs(false);
      }, 15000);
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener("mcpa-theme-change", handleThemeChange);
        window.removeEventListener("mcpa-project-stage-updated", handleStageSync);
        window.removeEventListener("mcpa-briefs-updated", handleStageSync);
        window.removeEventListener("mcpa-meeting-updated", handleStageSync);
        if (cleanupPromise && typeof cleanupPromise.then === "function") {
          cleanupPromise.then((clean) => typeof clean === "function" && clean());
        }
      };
    }
  }, []);

  // Real-time synchronization for navbar badges (meetings and unread inquiries)
  useEffect(() => {
    const handleMeetingsSync = (e) => {
      if (e?.detail?.count !== undefined) {
        setLiveMeetingsCount(e.detail.count);
      }
    };
    const handleInquiriesReadSync = () => {
      try {
        const stored = localStorage.getItem("mcpa_read_inquiry_ids");
        if (stored) {
          setReadInquiryIds(JSON.parse(stored));
        }
      } catch (e) {}
    };

    window.addEventListener("mcpa-meetings-count-sync", handleMeetingsSync);
    window.addEventListener("mcpa-inquiries-read-sync", handleInquiriesReadSync);
    window.addEventListener("storage", handleInquiriesReadSync);

    return () => {
      window.removeEventListener("mcpa-meetings-count-sync", handleMeetingsSync);
      window.removeEventListener("mcpa-inquiries-read-sync", handleInquiriesReadSync);
      window.removeEventListener("storage", handleInquiriesReadSync);
    };
  }, []);

  // Active Tab Role Guard: ensure user is never stranded on an unauthorized tab (unconditional top-level hook)
  useEffect(() => {
    if (!currentUser) return;
    const role = (currentUser.role || "admin").toLowerCase().trim();
    const allowedForRole = Object.entries(TAB_ROLE_PERMISSIONS)
      .filter(([_, roles]) => roles.includes(role) || (roles.includes("admin") && (role === "admin" || role === "super_admin")))
      .map(([tabId]) => tabId);

    if (allowedForRole.length > 0 && !allowedForRole.includes(activeTab)) {
      const fallback = role === "architect" ? "blueprints" : role === "engineer" ? "site-progress" : "dashboard";
      setActiveTab(allowedForRole.includes(fallback) ? fallback : allowedForRole[0]);
    }
  }, [currentUser, activeTab]);

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
        const allowedRoles = ["admin", "super_admin", "architect", "engineer"];
        const userRole = (data.user?.role || "").toLowerCase();
        if (data.user && !allowedRoles.includes(userRole)) {
          setAuthError("Access Denied: Staff privileges required. Client accounts must log in via /portal.");
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
              role: "ADMIN",
            };

        setCurrentUser(loggedUser);
        localStorage.setItem("mcpa_admin_authenticated", "true");
        sessionStorage.setItem("mcpa_admin_authenticated", "true");
        localStorage.setItem("mcpa_admin_user", JSON.stringify(loggedUser));
        sessionStorage.setItem("mcpa_admin_user", JSON.stringify(loggedUser));
        if (loggedUser.avatar_url || loggedUser.avatarUrl) {
          localStorage.setItem("mcpa_admin_avatar", loggedUser.avatar_url || loggedUser.avatarUrl);
        }

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
      if (formatted.avatar_url || formatted.avatarUrl) {
        localStorage.setItem("mcpa_admin_avatar", formatted.avatar_url || formatted.avatarUrl);
      } else {
        localStorage.removeItem("mcpa_admin_avatar");
      }
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

  const showToast = useCallback((msg, explicitType = null) => {
    if (!msg) return;
    const messageStr = typeof msg === "string" ? msg : (msg?.message || String(msg));
    setToast({
      id: Date.now() + Math.random(),
      message: messageStr,
      type: explicitType || (typeof msg === "object" ? msg?.type : null),
      title: typeof msg === "object" ? msg?.title : undefined,
      duration: typeof msg === "object" && msg?.duration ? msg.duration : 4000,
    });
  }, []);

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
    const targetRef = String(briefId || "").trim();
    const isTarget = (b) =>
      b.id === briefId ||
      b.submissionId === briefId ||
      String(b.id || "").trim() === targetRef ||
      String(b.submissionId || "").trim() === targetRef;

    const updated = clientBriefs.map((b) =>
      isTarget(b) ? { ...b, status: newStatus, ...extraData } : b
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
      const res = await fetch(`/api/briefs/${encodeURIComponent(briefId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
      const data = await res.json();
      if (data?.success && data?.brief) {
        const synced = clientBriefs.map((b) =>
          isTarget(b)
            ? {
                ...b,
                ...extraData,
                status: data.brief.status || newStatus,
                isRejected: extraData.isRejected ?? (newStatus.toLowerCase().includes("reject") ? true : b.isRejected),
                isArchived: extraData.isArchived ?? (newStatus.toLowerCase().includes("archive") ? true : b.isArchived),
                rejectionReason: extraData.rejectionReason || data.brief.rejection_reason || b.rejectionReason,
                rejectionNotes: extraData.rejectionNotes || data.brief.rejection_notes || b.rejectionNotes,
                meetingDate: data.brief.meeting_date || b.meetingDate,
                meetingTime: data.brief.meeting_time || b.meetingTime,
                meetingLink: data.brief.meeting_link || b.meetingLink,
                meetingMode: data.brief.meeting_mode || b.meetingMode,
                meetingNotes: data.brief.meeting_notes || b.meetingNotes,
                venueType: data.brief.venue_type || b.venueType,
                venueDetails: data.brief.venue_details || b.venueDetails,
                quotationAmount: data.brief.quotation_amount || b.quotationAmount,
                quotationNotes: data.brief.quotation_notes || b.quotationNotes,
                current_project_stage: data.brief.current_project_stage || data.brief.current_stage_status || extraData.current_project_stage || b.current_project_stage,
                current_stage_status: data.brief.current_stage_status || data.brief.current_project_stage || extraData.current_stage_status || b.current_stage_status,
                client_project_id: data.brief.client_project_id || extraData.client_project_id || b.client_project_id,
              }
            : b
        );
        setClientBriefs(synced);
        try {
          localStorage.setItem("mcpa_client_briefs", JSON.stringify(synced));
        } catch (e) {}
        return data.brief;
      }
      return { status: newStatus, ...extraData };
    } catch (e) {
      console.warn("Could not update brief in backend:", e);
      return { status: newStatus, ...extraData };
    }
  };

  const handleProvisionAccess = async (briefId) => {
    try {
      const targetRef = String(briefId || "").trim();
      const isTarget = (b) =>
        b.id === briefId ||
        b.submissionId === briefId ||
        String(b.id || "").trim() === targetRef ||
        String(b.submissionId || "").trim() === targetRef;

      const res = await fetch(`/api/briefs/${encodeURIComponent(briefId)}/provision`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const updated = clientBriefs.map((b) =>
          isTarget(b) ? { ...b, clientPortalCode: data.portalCode, status: "Approved / Accepted" } : b
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
    const targetRef = String(briefId || "").trim();
    const isTarget = (b) =>
      b.id === briefId ||
      b.submissionId === briefId ||
      String(b.id || "").trim() === targetRef ||
      String(b.submissionId || "").trim() === targetRef;

    const updated = clientBriefs.filter((b) => !isTarget(b));
    setClientBriefs(updated);
    try {
      localStorage.setItem("mcpa_client_briefs", JSON.stringify(updated));
      showToast("Client consultation brief removed.");
    } catch (err) {
      console.warn("Error saving briefs:", err);
    }

    // Sync deletion with Backend
    try {
      await fetch(`/api/briefs/${encodeURIComponent(briefId)}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Could not delete brief from backend:", e);
    }
  };

  // Construction Handlers
  const handleSelectSiteProject = async (selectedProj) => {
    if (!selectedProj) {
      setSiteProject(null);
      setSiteMilestones([]);
      setSitePhotos([]);
      setBillingLedger([]);
      setDelayEvents([]);
      setSiteExpenses([]);
      return;
    }

    setSiteProject(selectedProj);
    const code = selectedProj.project_code || selectedProj.projectCode || selectedProj.clientPortalCode;
    if (code) {
      try {
        const res = await fetch(`/api/construction/projects/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.success && data.project) {
          setSiteProject((prev) => ({
            ...selectedProj,
            ...(prev || {}),
            ...data.project,
            avatar_url: data.project.avatar_url || selectedProj.avatar_url || prev?.avatar_url || null,
            client_name: data.project.client_name || selectedProj.client_name || prev?.client_name,
            client_email: data.project.client_email || selectedProj.client_email || prev?.client_email,
            project_title: data.project.project_title || selectedProj.project_title || prev?.project_title,
          }));
          setSiteMilestones(data.milestones || []);
          setSitePhotos(data.photos || []);
          setBillingLedger(data.billing || []);
          setDelayEvents(data.delays || []);
          setSiteExpenses(data.expenses || []);
        }
      } catch (err) {
        console.warn("Could not fetch full site project details:", err);
      }
    }
  };

  const handleAddMilestone = async (milestoneData) => {
    try {
      const res = await authFetch("/api/construction/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneData),
      });
      const data = await res.json();
      if (data.success) {
        const code = milestoneData.projectCode || siteProject?.project_code;
        if (code) {
          const siteRes = await authFetch(`/api/construction/projects/${encodeURIComponent(code)}`).then((r) => r.json());
          if (siteRes.success && siteRes.project) {
            setSiteProject(siteRes.project);
            setSiteMilestones(siteRes.milestones || []);
          }
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      console.warn("Could not add milestone:", e);
      return { success: false, message: e.message };
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      const res = await authFetch(`/api/construction/milestones/${encodeURIComponent(milestoneId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (siteProject?.project_code) {
          const siteRes = await authFetch(`/api/construction/projects/${encodeURIComponent(siteProject.project_code)}`).then((r) => r.json());
          if (siteRes.success && siteRes.project) {
            setSiteProject(siteRes.project);
            setSiteMilestones(siteRes.milestones || []);
          }
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      console.warn("Could not delete milestone:", e);
      return { success: false, message: e.message };
    }
  };

  const handleUpdateVirtualTour = async (tourData) => {
    try {
      if (!siteProject?.project_code) return { success: false, message: "No project selected." };
      const payload =
        typeof tourData === "string"
          ? { projectCode: siteProject.project_code, virtualTourUrl: tourData }
          : { projectCode: siteProject.project_code, ...tourData };

      const res = await authFetch("/api/construction/virtual-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSiteProject((prev) => {
          if (!prev) return prev;
          const updatedSingle = data.project?.virtual_tour_url || (typeof tourData === "string" ? tourData : tourData.virtualTourUrl);
          const updatedArray = data.project?.virtual_tour_urls || (typeof tourData === "object" ? tourData.virtualTourUrls : prev.virtual_tour_urls);
          return {
            ...prev,
            virtual_tour_url: updatedSingle,
            virtual_tour_urls: updatedArray,
          };
        });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      console.warn("Could not update virtual tour:", e);
      return { success: false, message: e.message };
    }
  };

  const handleCreateBillingTranche = async (trancheData) => {
    try {
      const res = await authFetch("/api/construction/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trancheData),
      });
      const data = await res.json();
      if (data.success && data.billing) {
        setBillingLedger((prev) => [...prev, data.billing]);
        return { success: true, billing: data.billing };
      }
      return { success: false, message: data.message };
    } catch (e) {
      console.warn("Could not create billing tranche:", e);
      return { success: false, message: e.message };
    }
  };

  const handleUpdateMilestone = async (milestoneId, data) => {
    try {
      const res = await authFetch(`/api/construction/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        const siteEndpoint = siteProject?.project_code
          ? `/api/construction/projects/${siteProject.project_code}`
          : "/api/construction/project";
        const siteRes = await authFetch(siteEndpoint).then((r) => r.json());
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
      const res = await authFetch("/api/construction/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoData),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          setSitePhotos((prev) => [...data.logs, ...prev]);
        } else if (data.log) {
          setSitePhotos((prev) => [data.log, ...prev]);
        }
      }
    } catch (e) {
      console.warn("Could not add photo to backend:", e);
    }
  };

  const handleDeletePhoto = async (logId) => {
    try {
      const idsToDelete = Array.isArray(logId)
        ? logId.map((id) => Number(id)).filter((n) => !isNaN(n))
        : String(logId || "")
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((n) => !isNaN(n));

      const param = idsToDelete.join(",");
      const res = await authFetch(`/api/construction/photos/${param}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSitePhotos((prev) => prev.filter((p) => !idsToDelete.includes(Number(p.log_id))));
        showToast?.(
          idsToDelete.length > 1
            ? `${idsToDelete.length} site media records deleted.`
            : "Site update record deleted."
        );
      }
    } catch (e) {
      console.warn("Could not delete photo from backend:", e);
    }
  };

  const handleVerifyPayment = async (billId) => {
    try {
      const res = await authFetch(`/api/construction/billing/${billId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to verify payment");
      }
      if (data.success && data.entry) {
        const updated = billingLedger.map((b) => (b.bill_id === billId ? data.entry : b));
        setBillingLedger(updated);
      }
      return data;
    } catch (e) {
      console.warn("Could not verify payment on backend:", e);
      throw e;
    }
  };

  const handleUploadBillingProof = async (billId, proofUrl) => {
    try {
      const res = await authFetch(`/api/construction/billing/${billId}/proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to attach proof of payment");
      }
      if (data.success && data.entry) {
        const updated = billingLedger.map((b) => (b.bill_id === billId ? data.entry : b));
        setBillingLedger(updated);
      }
      return data;
    } catch (e) {
      console.warn("Could not upload billing proof:", e);
      throw e;
    }
  };

  const handleLogDelay = async (delayData) => {
    try {
      const res = await authFetch("/api/construction/delays", {
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
        const siteRes = await authFetch(siteEndpoint).then((r) => r.json());
        if (siteRes.success) {
          setSiteProject(siteRes.project);
        }
      }
    } catch (e) {
      console.warn("Could not log delay on backend:", e);
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
                  placeholder="Enter staff email address"
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
  // Archived meetings set from localStorage to accurately auto-deduct concluded sessions
  const archivedMeetingsSet = typeof window !== "undefined"
    ? (() => {
        try {
          return new Set(JSON.parse(localStorage.getItem("mcpa_archived_meeting_ids") || "[]"));
        } catch (e) {
          return new Set();
        }
      })()
    : new Set();

  const activeBriefMeetings = clientBriefs.filter((b) => {
    const hasDate = Boolean(b.meetingDate || b.meeting_date);
    if (!hasDate) return false;
    const s = (b.status || "").toLowerCase();
    const isTerminated =
      s.includes("reject") ||
      s.includes("decline") ||
      s.includes("complete") ||
      s.includes("aligned") ||
      s.includes("closed") ||
      s.includes("archived") ||
      s.includes("discontinued");
    if (isTerminated) return false;
    const code = b.trackingId || b.submissionId || b.projectCode || b.id;
    if (archivedMeetingsSet.has(code) || archivedMeetingsSet.has(b.id)) return false;
    return true;
  });

  const hasRaymartInBriefs = activeBriefMeetings.some((b) => {
    const name = (b.clientName || b.client_name || "").toLowerCase();
    const email = (b.clientEmail || b.client_email || "").toLowerCase();
    return name.includes("raymart") || email.includes("quirante");
  });

  const raymartBaseCount = (!hasRaymartInBriefs && !archivedMeetingsSet.has("meet-1")) ? 1 : 0;
  const computedMeetingsFallback = activeBriefMeetings.length + raymartBaseCount;
  const meetingsCount = liveMeetingsCount !== null ? liveMeetingsCount : computedMeetingsFallback;

  // Unread Inquiries calculation (deducting reviewed/read/archived inquiries)
  const unreadInquiriesCount = clientBriefs.filter((b) => {
    const id = b.id || b.submissionId || b.trackingId;
    const isRead =
      readInquiryIds.includes(id) ||
      readInquiryIds.includes(b.submissionId) ||
      readInquiryIds.includes(b.trackingId) ||
      b.is_read === true ||
      b.isRead === true;
    const s = (b.status || "").toLowerCase();
    const isClosedOrArchived =
      s.includes("reject") ||
      s.includes("decline") ||
      s.includes("closed") ||
      s.includes("archived");
    return !isRead && !isClosedOrArchived;
  }).length;

  const pendingBillsCount = (billingLedger || []).filter((b) => b.status === "Pending").length;
  const finishedProjectsCount = (clientBriefs || []).filter((b) => (b.current_stage_status || b.currentStageStatus || b.stage_id) === "COMPLETED").length;


  const navSections = [
    {
      title: "Overview & Website",
      stageBadge: null,
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        {
          id: "meetings",
          label: "Meetings",
          icon: CalendarIcon,
          badge: meetingsCount > 0 ? meetingsCount : undefined,
        },
        { id: "projects", label: "Projects Showcase", icon: FolderKanbanIcon },
        { id: "accounts", label: "Accounts & Roles", icon: UserIcon },
        {
          id: "chatbot",
          label: "Chatbot Knowledge Base",
          icon: MessageSquareIcon,
          badge: chatbotBadgeCount > 0 ? chatbotBadgeCount : undefined,
        },
      ],
    },
    {
      title: "Stage 1: Pre-Inquiry",
      stageBadge: "Stage 1",
      items: [
        {
          id: "briefs",
          label: "Inquiries",
          icon: ClipboardListIcon,
          badge: unreadInquiriesCount > 0 ? unreadInquiriesCount : undefined,
        },
      ],
    },
    {
      title: "Stage 2: Consultation & Planning",
      stageBadge: "Stage 2",
      items: [
        { id: "blueprints", label: "Blueprints & Plans", icon: LayersIcon },
        {
          id: "quotations",
          label: "Budget & Quotation",
          icon: CreditCardIcon,
          badge: pendingQuotationsCount > 0 ? pendingQuotationsCount : undefined,
        },
        {
          id: "documents",
          label: "Documents & Permits",
          icon: FileTextIcon,
          badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
        },
        {
          id: "groundbreaking",
          label: "Contracts & Groundbreaking",
          icon: SparklesIcon,
          badge: pendingContractsCount > 0 ? `${pendingContractsCount} Sign` : undefined,
        },
      ],
    },
    {
      title: "Stage 3: Active Site Execution",
      stageBadge: "Stage 3",
      items: [
        {
          id: "site-progress",
          label: "Site Progress & Logs",
          icon: HardHatIcon,
          badge: siteProject?.progress_pct ? `${siteProject.progress_pct}%` : undefined,
        },
        {
          id: "billing",
          label: "Milestone Billing",
          icon: CreditCardIcon,
          badge: pendingBillsCount > 0 ? pendingBillsCount : undefined,
        },
        {
          id: "delays",
          label: "Delay Management",
          icon: ClockIcon,
          badge: delayEvents.length > 0 ? delayEvents.length : undefined,
        },
      ],
    },
    {
      title: "Stage 4: Finished Project & Wrapped",
      stageBadge: "Stage 4",
      items: [
        {
          id: "finished-projects",
          label: "Finished Projects",
          icon: ArchiveIcon,
          badge: finishedProjectsCount > 0 ? finishedProjectsCount : undefined,
        },
      ],
    },
  ];

  // RBAC: Dynamically filter sidebar sections and tabs based on authenticated staff role
  const userRole = (currentUser?.role || "admin").toLowerCase().trim();
  const roleMeta = getRoleBadgeMeta(userRole);

  const visibleNavSections = navSections
    .map((section) => {
      const allowedItems = section.items.filter((item) => {
        const perms = TAB_ROLE_PERMISSIONS[item.id] || ["admin", "super_admin"];
        return (
          perms.includes(userRole) ||
          (perms.includes("admin") && (userRole === "admin" || userRole === "super_admin"))
        );
      });
      return {
        ...section,
        items: allowedItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const navItems = visibleNavSections.flatMap((s) => s.items);

  const currentTabInfo = navItems.find((n) => n.id === activeTab) || navItems[0] || { id: "dashboard", label: "Dashboard" };
  const mobileTabLabel = {
    "site-progress": "SITE",
    briefs: "INQUIRIES",
    meetings: "MEETINGS",
    dashboard: "DASHBOARD",
    projects: "PROJECTS",
    accounts: "ACCOUNTS",
    blueprints: "PLANS",
    quotations: "QUOTATIONS",
    documents: "DOCUMENTS",
    delays: "DELAYS",
    groundbreaking: "GROUND BREAKING",
    billing: "BILLING",
    chatbot: "CHATBOT",
    "finished-projects": "FINISHED",
  }[currentTabInfo.id] || currentTabInfo.label;

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex font-sans transition-colors duration-300">
      {/* World-Class Bottom-Right Architectural Snackbar */}
      <Snackbar
        toast={toast}
        onClose={() => setToast(null)}
      />

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
          className={`flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2 sm:p-2.5 ${
            isSidebarCollapsed ? "lg:p-2 space-y-2" : "lg:p-2.5"
          }`}
        >
          {visibleNavSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {/* Section Header with Centered Straight-Line Divider */}
              {/* Desktop Collapsed View: compact 24px hairline divider */}
              {isSidebarCollapsed && sIdx > 0 && (
                <div className="hidden lg:block my-2 border-t border-neutral-200 dark:border-white/5 w-6 mx-auto" />
              )}

              {/* Full Section Header with Label: Always visible on Mobile Drawer, and on Desktop when Expanded */}
              <div
                className={`relative items-center pt-3 pb-1.5 px-2 select-none ${
                  isSidebarCollapsed ? "flex lg:hidden" : "flex"
                }`}
              >
                <div className="flex-grow border-t border-neutral-200 dark:border-white/10" />
                <span className="flex-shrink mx-2 text-[8px] sm:text-[8.5px] font-mono font-bold tracking-[0.14em] uppercase text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                  {section.title}
                </span>
                <div className="flex-grow border-t border-neutral-200 dark:border-white/10" />
              </div>

              {/* Items in Section */}
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={`${section.title}-${item.id}-${iIdx}`} className="relative group flex justify-center">
                    <button
                      id={`tab-btn-${section.stageBadge || "sec"}-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      title={item.label}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[4px] text-xs font-mono tracking-wider transition-colors cursor-pointer relative ${
                        isSidebarCollapsed
                          ? "lg:h-10 lg:justify-center lg:px-0"
                          : "justify-between"
                      } ${
                        isActive
                          ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className={`flex items-center min-w-0 gap-3 ${
                          isSidebarCollapsed ? "lg:justify-center lg:gap-0" : ""
                        }`}
                      >
                        <div className="relative flex items-center justify-center shrink-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? "text-neutral-950"
                                : "text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500"
                            }`}
                          />
                          {/* Collapsed Mode Overlay Badge */}
                          {isSidebarCollapsed && item.badge !== undefined && (
                            <span
                              className={`hidden lg:flex absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-mono font-bold items-center justify-center shadow-sm leading-none pointer-events-none select-none ${
                                isActive
                                  ? "bg-neutral-950 text-amber-400 border border-neutral-900"
                                  : "bg-amber-500 text-neutral-950 border border-white dark:border-[#101218]"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <span
                          className={`truncate ${
                            isSidebarCollapsed ? "block lg:hidden" : "block"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {item.badge !== undefined && (
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

                          {/* Desktop Expanded Mode Badge */}
                          <span
                            className={`hidden ${
                              isSidebarCollapsed
                                ? "hidden"
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
                        {section.stageBadge && (
                          <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-white/10 text-neutral-300">
                            {section.stageBadge}
                          </span>
                        )}
                        {item.badge !== undefined && (
                          <span className="px-1 py-0.2 rounded-[2px] bg-amber-500 text-neutral-950 font-bold text-[9px]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
              <AdminAvatar user={currentUser} sizeClasses="w-9 h-9" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {currentUser?.fullName || currentUser?.name || "Raymart Quirante"}
                </p>
                <div className="flex items-center mt-0.5">
                  <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-[3px] border uppercase font-bold tracking-wider ${roleMeta.badgeClass}`}>
                    {roleMeta.title}
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
                  <AdminAvatar user={currentUser} sizeClasses="w-8 h-8" />

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
                  <AdminAvatar user={currentUser} sizeClasses="w-8 h-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {currentUser?.fullName || currentUser?.name || "Raymart Quirante"}
                    </p>
                    <div className="flex items-center mt-0.5">
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-[3px] border uppercase font-bold tracking-wider ${roleMeta.badgeClass}`}>
                        {roleMeta.title}
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
              <span
                className="max-w-[105px] sm:max-w-none text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 whitespace-nowrap truncate"
                title={currentTabInfo.label}
              >
                {mobileTabLabel}
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

            {/* Desktop Console Workspace & Tab Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 select-none">
              <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                {roleMeta.consoleTitle}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700 text-xs">/</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {currentTabInfo.label}
              </span>
            </div>
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

            {/* Notification Bell Container with Flyout & Mobile Bottom Sheet */}
            <div className="relative">
              <button
                id="admin-notification-bell-btn"
                type="button"
                onClick={() => setIsNotificationCenterOpen((prev) => !prev)}
                title="Notifications & Activity Center"
                className={`relative p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                  isNotificationCenterOpen
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-95"
                }`}
                aria-expanded={isNotificationCenterOpen}
                aria-haspopup="true"
                aria-label="Toggle notifications menu"
              >
                <BellIcon className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#101218]">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              <AdminNotificationCenter
                isOpen={isNotificationCenterOpen}
                onClose={() => setIsNotificationCenterOpen(false)}
                notifications={filteredAdminNotifications}
                onSelectNotification={handleSelectNotification}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onMarkAsRead={markNotificationAsRead}
              />
            </div>

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
            stage3Projects={stage3Projects}
            onSelectProject={handleSelectSiteProject}
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
        {/* TAB: BLUEPRINTS & ENGINEERING PLANS                               */}
        {/* ================================================================= */}
        {activeTab === "blueprints" && (
          <AdminBlueprintsTab
            clientBriefs={clientBriefs}
            allProjects={allProjects}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: MEETINGS & CLIENT APPOINTMENTS                               */}
        {/* ================================================================= */}
        {activeTab === "meetings" && (
          <AdminMeetingsTab
            clientBriefs={clientBriefs}
            currentUser={currentUser}
            showToast={showToast}
            onRefresh={() => loadProjectsAndBriefs(false)}
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

        {/* ================================================================= */}
        {/* TAB: CHATBOT KNOWLEDGE BASE & LIVE SUPPORT                        */}
        {/* ================================================================= */}
        {activeTab === "chatbot" && (
          <AdminChatbotTab
            currentUser={currentUser}
            onShowToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: CLIENT DOCUMENTS & MCPA TRANSMITTALS                        */}
        {/* ================================================================= */}
        {activeTab === "documents" && (
          <AdminDocumentRequestsTab
            clientBriefs={clientBriefs}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: BUDGET & QUOTATION (BOQ & COST RECONCILIATION)               */}
        {/* ================================================================= */}
        {activeTab === "quotations" && (
          <AdminBudgetQuotationTab
            clientBriefs={clientBriefs}
            allProjects={allProjects}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: GROUNDBREAKING CEREMONIES (STAGE 2 / PHASE 2 KICKOFF)        */}
        {/* ================================================================= */}
        {activeTab === "groundbreaking" && (
          <AdminGroundbreakingTab
            currentUser={currentUser}
            allProjects={allProjects}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: SITE PROGRESS & INSPECTION LOGS (STAGE 3: ACTIVE BUILD)      */}
        {/* ================================================================= */}
        {activeTab === "site-progress" && (
          <SiteProgressTab
            currentUser={currentUser}
            project={siteProject}
            projects={stage3Projects}
            milestones={siteMilestones}
            photos={sitePhotos}
            onSelectProject={handleSelectSiteProject}
            onUpdateMilestone={handleUpdateMilestone}
            onAddMilestone={handleAddMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onUpdateVirtualTour={handleUpdateVirtualTour}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: DELAY MANAGEMENT & CRITICAL PATH (STAGE 3 & 4)               */}
        {/* ================================================================= */}
        {activeTab === "delays" && (
          <DelayManagementTab
            project={siteProject}
            projects={stage3Projects}
            delays={delayEvents}
            onSelectProject={handleSelectSiteProject}
            onLogDelay={handleLogDelay}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: BILLING & FINANCIAL LEDGER (STAGE 4: TRANCHES & OCR)         */}
        {/* ================================================================= */}
        {activeTab === "billing" && (
          <BillingLedgerTab
            project={siteProject}
            projects={stage3Projects}
            billing={billingLedger}
            expenses={siteExpenses}
            onSelectProject={handleSelectSiteProject}
            onVerifyPayment={handleVerifyPayment}
            onUploadProof={handleUploadBillingProof}
            onCreateBillingTranche={handleCreateBillingTranche}
            showToast={showToast}
          />
        )}

        {/* ================================================================= */}
        {/* TAB: FINISHED PROJECTS (STAGE 4: FINISHED PROJECT & WRAPPED)        */}
        {/* ================================================================= */}
        {activeTab === "finished-projects" && (
          <FinishedProjectsTab
            showToast={showToast}
            onOpenShowcase={() => {
              loadProjectsAndBriefs(false);
              setActiveTab("projects");
            }}
            onShowcaseChanged={() => loadProjectsAndBriefs(false)}
          />
        )}

      </main>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (Centered Compact Capsule Matching Client Portal) */}
      <div className="fixed bottom-4 inset-x-0 z-40 lg:hidden flex justify-center pointer-events-none select-none px-3">
        <nav
          aria-label="Mobile Bottom Navigation"
          className="pointer-events-auto w-auto max-w-[92vw] rounded-full bg-white/90 dark:bg-[#101218]/90 backdrop-blur-2xl border border-neutral-300/80 dark:border-white/15 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300"
        >
          {(() => {
            // Dynamic Quick Tabs tailored to staff role
            const mobileBaseTabs = roleMeta.baseTabs;
            let mobileTabIds = [...mobileBaseTabs];
            if (!mobileBaseTabs.includes(activeTab) && navItems.some((n) => n.id === activeTab)) {
              mobileTabIds = [mobileBaseTabs[0], activeTab, ...mobileBaseTabs.slice(2)];
            }
            const mobileNavList = mobileTabIds
              .map((id) => navItems.find((n) => n.id === id))
              .filter(Boolean);

            return (
              <>
                {mobileNavList.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 shrink-0 ${
                        isActive
                          ? "px-3 py-1.5 rounded-full overflow-hidden bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/50 dark:border-amber-400/60 shadow-[0_4px_18px_rgba(245,158,11,0.28),inset_0_1px_2px_rgba(255,255,255,0.5)]"
                          : "w-9 h-9 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      {/* Convex Optical Lens Specular Reflection */}
                      {isActive && (
                        <>
                          <div className="absolute inset-x-2 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/55 via-white/10 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-2 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
                        </>
                      )}

                      <div className="relative flex items-center gap-1.5">
                        <Icon className={isActive ? "w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" : "w-4.5 h-4.5 stroke-[1.8]"} />
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[8px] flex items-center justify-center ring-2 ring-white dark:ring-[#0e1017]">
                            {item.badge}
                          </span>
                        )}
                        {/* Text Label: ONLY shown when selected */}
                        {isActive && (
                          <span className="text-xs font-mono font-bold tracking-tight text-amber-700 dark:text-amber-300 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* 4th Slot: More / Full Menu Drawer */}
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                  className={`relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 shrink-0 ${
                    isMobileSidebarOpen
                      ? "px-3 py-1.5 rounded-full overflow-hidden bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/50 dark:border-amber-400/60 shadow-[0_4px_18px_rgba(245,158,11,0.28),inset_0_1px_2px_rgba(255,255,255,0.5)]"
                      : "w-9 h-9 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  title="All Navigation Tabs & System Menu"
                  aria-label="More Menu"
                >
                  {isMobileSidebarOpen && (
                    <>
                      <div className="absolute inset-x-2 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/55 via-white/10 to-transparent pointer-events-none" />
                      <div className="absolute inset-x-2 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
                    </>
                  )}

                  <div className="relative flex items-center gap-1.5">
                    <MenuIcon className={isMobileSidebarOpen ? "w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" : "w-4.5 h-4.5 stroke-[1.8]"} />
                    {/* Amber notification badge dot on Menu */}
                    {!isMobileSidebarOpen && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#101218]" />
                    )}
                    {isMobileSidebarOpen && (
                      <span className="text-xs font-mono font-bold tracking-tight text-amber-700 dark:text-amber-300 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                        More
                      </span>
                    )}
                  </div>
                </button>
              </>
            );
          })()}
        </nav>
      </div>

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

      {/* Global Incoming Call Dispatch Manager with Audio Ringtone & Device Push Notifications */}
      <AdminIncomingCallManager
        currentUser={currentUser}
        onAnswerCall={(call) => {
          setActiveTab("meetings");
          try {
            localStorage.setItem("mcpa_instant_call_active", JSON.stringify({
              ...call,
              answered: true,
              adminJoined: true,
              answeredBy: currentUser?.name || "Engr. Raymart Quirante",
            }));
            window.dispatchEvent(new CustomEvent("mcpa-instant-call-alert", {
              detail: {
                ...call,
                answered: true,
                adminJoined: true,
                answeredBy: currentUser?.name || "Engr. Raymart Quirante",
              }
            }));
          } catch (e) {}
        }}
        showToast={showToast}
      />
    </div>
  );
}
