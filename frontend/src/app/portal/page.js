"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import UtilityBar from "@/modules/shared/UtilityBar";
import { useLanguage } from "@/modules/shared/LanguageContext";
import PortalAuthCard from "@/modules/portal/components/PortalAuthCard";
import PortalAuthShowcase from "@/modules/portal/components/PortalAuthShowcase";
import PortalInquiryModal from "@/modules/portal/components/PortalInquiryModal";
import { useAuthoritativeClock } from "@/modules/admin/hooks/useAuthoritativeClock";
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
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  ClipboardListIcon,
  SettingsIcon,
  PlusIcon,
} from "@/modules/shared/Icons";
import { authFetch } from "@/modules/shared/authFetch";
import { getBookingIntent, clearBookingIntent } from "@/modules/shared/bookingAuthHelper";

function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const initialAuthMode = searchParams?.get("mode") === "signup" ? "signup" : "login";
  const redirectParam = searchParams?.get("redirect");
  const tabParam = searchParams?.get("tab");

  // Active view tab: "overview" | "inquiries" | "construction" | "profile"
  const [portalTab, setPortalTab] = useState("overview");
  const [inquiries, setInquiries] = useState([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // Construction project (if active)
  const [siteProject, setSiteProject] = useState(null);
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);

  // Sidebar states (matching Admin architecture)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Authoritative server clock for Manila time
  const { dateStr, timeStr, timezoneCode } = useAuthoritativeClock("Asia/Manila");

  // Modal state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isUploadingPfp, setIsUploadingPfp] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("mcpa_client_sidebar_collapsed", String(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const handlePfpUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be under 10MB.");
      return;
    }

    setIsUploadingPfp(true);
    showToast("Uploading profile picture...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload?category=avatars", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload photo");
      }

      const newAvatarUrl = uploadData.url;

      // Update backend profile
      await authFetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          avatarUrl: newAvatarUrl,
        }),
      });

      const updatedUser = {
        ...currentUser,
        avatarUrl: newAvatarUrl,
        avatar_url: newAvatarUrl,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("mcpa_client_user", JSON.stringify(updatedUser));
      showToast("Profile picture updated successfully!");
    } catch (err) {
      console.error("Avatar update error:", err);
      showToast("Could not update profile picture: " + err.message);
    } finally {
      setIsUploadingPfp(false);
    }
  };

  // 1. Check existing client session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("mcpa_client_user");
      const savedToken = localStorage.getItem("mcpa_client_token");
      const savedCollapsed = localStorage.getItem("mcpa_client_sidebar_collapsed");
      if (savedCollapsed !== null) {
        setIsSidebarCollapsed(savedCollapsed === "true");
      }

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setAuthToken(savedToken);

          if (redirectParam) {
            clearBookingIntent();
            router.push(redirectParam);
            return;
          }

          if (tabParam && ["overview", "inquiries", "construction", "profile"].includes(tabParam)) {
            setPortalTab(tabParam);
          }
        } catch (e) {
          console.warn("User parse error:", e);
        }
      }
      setIsLoadingAuth(false);
    }
  }, [redirectParam, tabParam, router]);

  // 2. Fetch inquiries when user is logged in
  const fetchClientData = async (userEmail) => {
    if (!userEmail) return;
    setIsLoadingInquiries(true);

    try {
      const res = await authFetch(`/api/client/inquiries?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.briefs) && data.briefs.length > 0) {
        setInquiries(data.briefs);
      } else {
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

      const storedIntent = getBookingIntent();
      const targetUrl = redirectParam || storedIntent?.targetUrl;

      if (targetUrl) {
        clearBookingIntent();
        showToast(
          language === "fil"
            ? `Maligayang pagdating, ${user.fullName || "Kliyente"}! Ibinabalik ka sa booking form...`
            : `Welcome, ${user.fullName || "Valued Client"}! Returning you to your booking form...`
        );
        router.push(targetUrl);
        return;
      }
    }
    showToast(`Welcome to your Client Portal, ${user.fullName || "Valued Client"}!`);
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
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
    (b) =>
      (b.status || "Pending Review") === "Pending Review" ||
      (b.status || "").includes("Meeting") ||
      (b.status || "").includes("Review")
  ).length;

  const scheduledMeetingBrief = inquiries.find(
    (b) =>
      (b.status || "").includes("Meeting") ||
      Boolean(b.meeting_date || b.meetingDate || b.meeting_link)
  );

  // UNAUTHENTICATED STATE: Clean, Focused 2-Column Split-Screen Auth Page With Top Utility Bar
  if (!currentUser) {
    return (
      <div className="min-h-screen min-[920px]:h-screen min-[920px]:overflow-hidden mcpa-dot-grid bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans transition-colors duration-500 scroll-smooth">
        <UtilityBar show={true} />

        <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 min-[920px]:px-8 min-[920px]:py-1.5 max-w-7xl mx-auto w-full min-h-0">
          <header className="w-full flex items-center justify-start py-0.5 shrink-0 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform font-bold">←</span>
              <span>{language === "fil" ? "Bumalik sa MCPA Website" : "Back to MCPA Website"}</span>
            </Link>
          </header>

          <main className="w-full flex-1 flex flex-col min-[920px]:flex-row items-center justify-between min-[920px]:gap-8 py-1 min-h-0 my-auto">
            <div
              id="portal-showcase"
              className="w-full min-[920px]:w-1/2 flex flex-col items-center min-[920px]:items-start justify-center order-2 min-[920px]:order-1 pt-12 pb-8 min-[920px]:py-0 border-t border-neutral-200/50 dark:border-white/5 min-[920px]:border-t-0"
            >
              <PortalAuthShowcase />

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

            <div
              id="portal-auth"
              className="w-full min-[920px]:w-1/2 flex flex-col justify-center items-center order-1 min-[920px]:order-2 min-h-[calc(100vh-4.5rem)] min-h-[calc(100dvh-4.5rem)] min-[920px]:min-h-0 py-1 min-[920px]:py-0 min-[920px]:mb-1"
            >
              <PortalAuthCard onLoginSuccess={handleLoginSuccess} initialMode={initialAuthMode} />
            </div>
          </main>

          <footer className="w-full py-2 border-t border-neutral-200/60 dark:border-white/5 text-[10px] font-mono text-neutral-400 flex items-center justify-center gap-1 shrink-0 z-10 text-center">
            <span>
              © {new Date().getFullYear()} MCPA Construction &amp; Supply.{" "}
              {language === "fil" ? "Lahat ng karapatan ay nakalaan." : "All rights reserved."}
            </span>
          </footer>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED CLIENT CONSOLE (Admin Layout Structure + Human Tailored UX)
  // =========================================================================
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboardIcon },
    {
      id: "inquiries",
      label: "Inquiries",
      icon: FolderKanbanIcon,
      badge: inquiries.length > 0 ? inquiries.length : undefined,
    },
    {
      id: "construction",
      label: "Site Progress",
      icon: BuildingIcon,
      badge: siteProject ? "Active" : undefined,
    },
    { id: "profile", label: "Profile & Settings", icon: UserIcon },
  ];

  const currentTabInfo = navItems.find((n) => n.id === portalTab) || navItems[0];
  const primaryBrief = inquiries[0] || null;

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-[4px] bg-emerald-500 text-neutral-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <LogOutIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Sign Out of Client Portal?
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  You will need to log in again to track your consultation and site milestones.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-3 py-1.5 rounded-[4px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-3.5 py-1.5 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Left Sidebar Navigation (Admin Architecture) */}
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
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="relative w-36 h-9 shrink-0">
                <Image
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA Construction"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left block dark:hidden"
                  sizes="144px"
                />
                <Image
                  src="/assets/logo-white.svg"
                  alt="MCPA Construction"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left hidden dark:block"
                  sizes="144px"
                />
              </div>
            </Link>
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
                <Link
                  href="/"
                  title="MCPA Homepage"
                  className="relative z-10 w-10 h-10 rounded-[4px] bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 p-1 flex items-center justify-center shrink-0 hover:border-amber-500 transition-colors"
                >
                  <Image
                    src="/assets/mcpa-logo.svg"
                    alt="MCPA Logo"
                    fill
                    priority
                    unoptimized
                    className="object-contain p-1.5 block dark:hidden"
                    sizes="40px"
                  />
                  <Image
                    src="/assets/logo-white.svg"
                    alt="MCPA Logo"
                    fill
                    priority
                    unoptimized
                    className="object-contain p-1.5 hidden dark:block"
                    sizes="40px"
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Expand Navigation"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-3">
                <Link href="/" className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-36 h-9 shrink-0">
                    <Image
                      src="/assets/mcpa-logo.svg"
                      alt="MCPA Construction"
                      fill
                      priority
                      unoptimized
                      className="object-contain object-left block dark:hidden"
                      sizes="144px"
                    />
                    <Image
                      src="/assets/logo-white.svg"
                      alt="MCPA Construction"
                      fill
                      priority
                      unoptimized
                      className="object-contain object-left hidden dark:block"
                      sizes="144px"
                    />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Collapse Navigation"
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
            Client Portal Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = portalTab === item.id;
            return (
              <div key={item.id} className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setPortalTab(item.id);
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

                  {item.badge !== undefined && (
                    <>
                      <span
                        className={`lg:hidden px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold shrink-0 ${
                          isActive
                            ? "bg-neutral-950 text-white"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                      <span
                        className={`hidden ${
                          isSidebarCollapsed
                            ? "lg:flex absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-[3px] bg-amber-500 text-neutral-950 font-bold text-[9px] items-center justify-center font-mono"
                            : "lg:inline-block px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold shrink-0 " +
                              (isActive
                                ? "bg-neutral-950 text-white"
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
        </nav>

        {/* Bottom User Profile Section (Matching Admin Bottom Bar) */}
        <div className="border-t border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
          {/* Mobile Profile View */}
          <div className="lg:hidden p-4 pb-8 space-y-3">
            <div
              onClick={() => {
                setPortalTab("profile");
                setIsMobileSidebarOpen(false);
              }}
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
                  (currentUser?.fullName || "Client")
                    .split(/\s+/)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "CL"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {currentUser?.fullName || "Valued Client"}
                </p>
                <div className="flex items-center">
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                    {currentUser?.clientType === "OFW" ? "OFW Client" : "Client Portal"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPortalTab("profile");
                  setIsMobileSidebarOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-amber-500" />
                <span>Settings</span>
              </button>
              <button
                type="button"
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
                  onClick={() => setPortalTab("profile")}
                  className="relative group cursor-pointer focus:outline-none"
                  title={`${currentUser?.fullName || "Client"} (Client Portal)`}
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
                      (currentUser?.fullName || "Client")
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "CL"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPortalTab("profile")}
                  title="Profile & Settings"
                  className="p-2 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-[4px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOutIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div
                  onClick={() => setPortalTab("profile")}
                  className="flex items-center gap-3 p-1.5 -m-1.5 rounded-[4px] hover:bg-neutral-200/50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                  role="button"
                  tabIndex={0}
                  title="Click to manage profile & settings"
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
                      (currentUser?.fullName || "Client")
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "CL"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {currentUser?.fullName || "Valued Client"}
                    </p>
                    <div className="flex items-center">
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                        {currentUser?.clientType === "OFW" ? "OFW Client" : "Client Portal"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPortalTab("profile")}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-200/60 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
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

      {/* Right Content Area (Admin Matching Header & Workspace) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 transition-colors select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              type="button"
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
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </button>

            {/* Desktop Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span>MCPA</span>
              <span>/</span>
              <span className="text-neutral-500">Client Console</span>
              <span>/</span>
              <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                {currentTabInfo.label}
              </span>
            </div>
          </div>

          {/* Right Header Utilities: Authoritative Clock, View Site, New Inquiry */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Live Authoritative PHT Clock */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-white/10 pr-3 sm:pr-4">
              <ClockIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {dateStr} • {timeStr} {timezoneCode}
              </span>
            </div>

            {/* View Public Website */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Return to Public Website"
            >
              <span>View Site</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>

            {/* Submit New Inquiry CTA Button */}
            <button
              type="button"
              onClick={() => setIsInquiryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">New Inquiry</span>
            </button>
          </div>
        </header>

        {/* Main Console Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-white/5 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {portalTab === "overview" && "Dashboard Overview"}
                {portalTab === "inquiries" && "My Consultation Inquiries"}
                {portalTab === "construction" && "Active Site Progress"}
                {portalTab === "profile" && "Client Profile & Settings"}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                MCPA Construction Client Console — Live Architectural Operations &amp; Consultations
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[4px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{activeInquiriesCount} Active / Quota 3</span>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE DASHBOARD OVERVIEW                                        */}
          {/* ========================================================================= */}
          {portalTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Metric KPI Cards (Admin Layout Ergonomics) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Active Inquiries */}
                <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono uppercase tracking-wider">
                    <span>Active Inquiries</span>
                    <FolderKanbanIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {inquiries.length}
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {activeInquiriesCount} awaiting review
                    </p>
                  </div>
                </div>

                {/* 2. Scheduled Consultations */}
                <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono uppercase tracking-wider">
                    <span>Consultation Slot</span>
                    <CalendarIcon className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {scheduledMeetingBrief ? "1 Active" : "0 Pending"}
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                      {scheduledMeetingBrief?.meeting_date
                        ? `${scheduledMeetingBrief.meeting_date}`
                        : "Awaiting architect confirmation"}
                    </p>
                  </div>
                </div>

                {/* 3. Site Execution Progress */}
                <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono uppercase tracking-wider">
                    <span>Site Turnover</span>
                    <BuildingIcon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {siteProject ? `${siteProject.progress_pct}%` : "0%"}
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {siteProject ? siteProject.name : "Pre-construction & planning"}
                    </p>
                  </div>
                </div>

                {/* 4. Submission Quota */}
                <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono uppercase tracking-wider">
                    <span>Quota Allowance</span>
                    <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                      {activeInquiriesCount} / 3
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {3 - activeInquiriesCount} submission slots free
                    </p>
                  </div>
                </div>
              </div>

              {/* Two-Column Workspace Layout (Left: Primary Inquiry / SAAD Stepper; Right: Meeting & Office) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Primary Project & Workflow Stages */}
                <div className="lg:col-span-2 space-y-6">
                  {primaryBrief ? (
                    <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 shadow-xs space-y-5">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/5 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              REF: {primaryBrief.submission_id || primaryBrief.submissionId || "MCPA-CPB-000000"}
                            </span>
                            {primaryBrief.client_portal_code && (
                              <span className="px-2 py-0.5 rounded-[3px] bg-neutral-100 dark:bg-white/10 text-[9.5px] font-mono font-bold">
                                CODE: {primaryBrief.client_portal_code}
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {primaryBrief.project_type || primaryBrief.projectType || "Residential Villa / Two-Storey"}
                          </h2>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                            Style: {primaryBrief.preferred_style || "Minimalist Japanese Zen"} • Budget:{" "}
                            {primaryBrief.budget_range || "Custom"}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span
                            className={`px-3 py-1 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              (primaryBrief.status || "").includes("Approved")
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                : (primaryBrief.status || "").includes("Meeting")
                                ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            {primaryBrief.status || "Pending Review"}
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
                            {
                              step: "1. Lodged",
                              isDone: true,
                              isActive: (primaryBrief.status || "Pending Review") === "Pending Review",
                            },
                            {
                              step: "2. Arch Review",
                              isDone: (primaryBrief.status || "") !== "Pending Review",
                              isActive: (primaryBrief.status || "") === "Pending Review",
                            },
                            {
                              step: "3. Consultation",
                              isDone:
                                (primaryBrief.status || "").includes("Meeting") ||
                                (primaryBrief.status || "").includes("Approved"),
                              isActive: (primaryBrief.status || "").includes("Meeting"),
                            },
                            {
                              step: "4. Cost Estimate",
                              isDone: Boolean(
                                primaryBrief.quotation_amount ||
                                  (primaryBrief.status || "").includes("Approved")
                              ),
                              isActive: Boolean(primaryBrief.quotation_amount),
                            },
                            {
                              step: "5. Site Mobilization",
                              isDone: (primaryBrief.status || "").includes("Approved"),
                              isActive: (primaryBrief.status || "").includes("Approved"),
                            },
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

                      {/* Consultation Itinerary & Geolocation Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* Consultation Itinerary */}
                        <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            Consultation Itinerary
                          </span>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                              Mode: {primaryBrief.meeting_mode || "Online Video Call"}
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              Slot: {primaryBrief.meeting_date || "Earliest Slot"} (
                              {primaryBrief.meeting_time || "02:00 PM - 03:30 PM PHT"})
                            </p>
                            <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                              Status: {primaryBrief.availability_status || "Pending Availability Confirmation"}
                            </p>
                          </div>
                        </div>

                        {/* Property Geolocation */}
                        <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-amber-500" />
                            Property Geolocation
                          </span>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                              {primaryBrief.location || "San Jose Del Monte, Bulacan"}
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              Lot Area: {primaryBrief.lot_area || "N/A"} • Status:{" "}
                              {primaryBrief.lot_status || "Titled"}
                            </p>
                            {primaryBrief.map_coordinates && (
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-neutral-500">
                                  GPS: {primaryBrief.map_coordinates}
                                </span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${primaryBrief.map_coordinates}`}
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
                  ) : (
                    /* Empty Standby Card */
                    <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
                        <FolderKanbanIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-mono font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        No In-Progress Projects Yet
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Submit an architectural consultation brief to begin engineering evaluation and schedule your design meeting.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsInquiryModalOpen(true)}
                        className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Start First Project Brief</span>
                      </button>
                    </div>
                  )}

                  {/* Recent Inquiries List Table (Admin Flavor) */}
                  {inquiries.length > 0 && (
                    <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                          Recent Inquiries ({inquiries.length} total)
                        </h3>
                        <button
                          type="button"
                          onClick={() => setPortalTab("inquiries")}
                          className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          View All Inquiries →
                        </button>
                      </div>

                      <div className="divide-y divide-neutral-100 dark:divide-white/5">
                        {inquiries.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-[4px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-neutral-900 dark:text-white truncate">
                                  {item.project_type || "Custom Build"}
                                </p>
                                <p className="text-[11px] text-neutral-500 font-mono truncate">
                                  {item.submission_id || "MCPA-CPB"} • {item.location || "Bulacan"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase shrink-0 ${
                                (item.status || "").includes("Approved")
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : (item.status || "").includes("Meeting")
                                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {item.status || "Pending Review"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 1 Column: Scheduled Consultations & MCPA Headquarters (Admin Style) */}
                <div className="space-y-6">
                  {/* Scheduled Consultations Card */}
                  <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Scheduled Consultations
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-sky-500/15 text-sky-700 dark:text-sky-400 text-[10px] font-mono font-bold">
                        GOOGLE MEET
                      </span>
                    </div>

                    {scheduledMeetingBrief ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">
                            {currentUser.fullName || "Valued Client"}
                          </p>
                          <p className="text-xs text-neutral-500 font-mono">
                            {scheduledMeetingBrief.project_type || "Residential Project Consultation"}
                          </p>
                        </div>

                        <div className="p-3 rounded-[4px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 text-xs font-mono space-y-1">
                          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {scheduledMeetingBrief.meeting_date || "2026-10-15"} •{" "}
                              {scheduledMeetingBrief.meeting_time || "02:00 PM - 03:30 PM PHT"}
                            </span>
                          </div>
                        </div>

                        {scheduledMeetingBrief.meeting_link ? (
                          <a
                            href={scheduledMeetingBrief.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors"
                          >
                            <VideoIcon className="w-4 h-4" />
                            <span>JOIN GOOGLE MEET ROOM →</span>
                          </a>
                        ) : (
                          <div className="w-full py-2.5 px-4 rounded-[4px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 font-mono text-xs text-center border border-neutral-200 dark:border-white/10">
                            Session Confirmed • Meeting Link Active on Call Day
                          </div>
                        )}

                        {scheduledMeetingBrief.meeting_notes && (
                          <div className="pt-1">
                            <span className="block text-[10px] font-mono uppercase text-neutral-400">
                              Architectural Meeting Note:
                            </span>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 italic mt-0.5">
                              &ldquo;{scheduledMeetingBrief.meeting_notes}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-dashed border-neutral-200 dark:border-white/10">
                        <ClockIcon className="w-6 h-6 text-neutral-400 mx-auto" />
                        <p className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          No Consultations Booked
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Submit your architectural brief to select a virtual or in-person consultation slot.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Inquiry Status Summary (Admin Style) */}
                  <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Inquiry Summary
                    </h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Total Inquiries Submitted</span>
                        <strong className="text-neutral-900 dark:text-white">{inquiries.length}</strong>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Pending Architectural Review</span>
                        <strong className="text-amber-600 dark:text-amber-400">
                          {inquiries.filter((b) => (b.status || "").includes("Pending")).length}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Meetings Set</span>
                        <strong className="text-sky-600 dark:text-sky-400">
                          {inquiries.filter((b) => (b.status || "").includes("Meeting")).length}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Approved &amp; Mobilized</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {inquiries.filter((b) => (b.status || "").includes("Approved")).length}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* MCPA Headquarters / Support Desk (Admin Style) */}
                  <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      MCPA Headquarters
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-400">
                        <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-mono">
                        <PhoneIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Hotline: +63 949 775 8239</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 dark:border-white/5">
                        <a
                          href="mailto:contact@mcpaconstruction.com"
                          className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>contact@mcpaconstruction.com</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INQUIRIES & DETAILED CONSULTATIONS                                   */}
          {/* ========================================================================= */}
          {portalTab === "inquiries" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101218] p-4 rounded-[6px] border border-neutral-200 dark:border-white/5">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Consultation Briefs Pipeline ({inquiries.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Track your architectural project parameters, lot coordinates, and schedule determinations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Submit New Inquiry</span>
                </button>
              </div>

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

                    return (
                      <div
                        key={id}
                        className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-7 shadow-xs space-y-5"
                      >
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/5 pb-4">
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
                              Style: {brief.preferred_style || "Contemporary Modern"} • Budget:{" "}
                              {brief.budget_range || "Flexible"}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span
                              className={`px-3 py-1 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                status.includes("Approved")
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                  : status.includes("Meeting")
                                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
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
                              {
                                step: "3. Consultation",
                                isDone: status.includes("Meeting") || status.includes("Approved"),
                                isActive: status.includes("Meeting"),
                              },
                              {
                                step: "4. Cost Estimate",
                                isDone: Boolean(brief.quotation_amount || status.includes("Approved")),
                                isActive: Boolean(brief.quotation_amount),
                              },
                              {
                                step: "5. Site Mobilization",
                                isDone: status.includes("Approved"),
                                isActive: status.includes("Approved"),
                              },
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
                          <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Consultation Itinerary
                            </span>
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                Mode: {brief.venue_type ? `In-Person (${brief.venue_type})` : brief.meeting_mode || "Online Meeting"}
                              </p>
                              {brief.venue_details && (
                                <p className="text-neutral-600 dark:text-neutral-400">
                                  <strong>Venue:</strong> {brief.venue_details}
                                </p>
                              )}
                              <p className="text-neutral-600 dark:text-neutral-400">
                                <strong>Slot:</strong> {brief.meeting_date || "Earliest Slot"} (
                                {brief.meeting_time || "02:00 PM PHT"})
                              </p>
                              <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                                Status: {brief.availability_status || "Pending Availability Confirmation"}
                              </p>
                              {brief.meeting_link && (
                                <a
                                  href={brief.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-mono pt-1"
                                >
                                  <VideoIcon className="w-3.5 h-3.5" />
                                  <span>Join Google Meet Session →</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Property & Coordinates Box */}
                          <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
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

          {/* ========================================================================= */}
          {/* TAB 3: ACTIVE SITE PROGRESS                                               */}
          {/* ========================================================================= */}
          {portalTab === "construction" && (
            <div className="space-y-6">
              {!siteProject ? (
                <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-12 text-center space-y-3">
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
                  <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-7 space-y-4">
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
                  <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6">
                    <h3 className="text-sm font-mono uppercase font-bold text-neutral-900 dark:text-white mb-4">
                      Phase Execution Milestones
                    </h3>
                    <div className="space-y-3">
                      {siteMilestones.map((m) => (
                        <div
                          key={m.milestone_id}
                          className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 flex items-center justify-between"
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

          {/* ========================================================================= */}
          {/* TAB 4: CLIENT PROFILE & SETTINGS                                          */}
          {/* ========================================================================= */}
          {portalTab === "profile" && (
            <div className="max-w-4xl rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3.5">
                  {/* Client Profile Avatar with Free-Will Upload Overlay */}
                  <div className="relative group shrink-0">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/80 bg-neutral-900 shadow-md">
                      {currentUser.avatarUrl || currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatarUrl || currentUser.avatar_url}
                          alt={currentUser.fullName || "Profile Avatar"}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-500/20 text-amber-500 font-bold font-mono text-xl">
                          {(currentUser.fullName || "CL").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <label
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity"
                        title="Change Profile Picture (Free Will)"
                      >
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                          {isUploadingPfp ? "Saving..." : "Change"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePfpUpload}
                          disabled={isUploadingPfp}
                        />
                      </label>
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center border-2 border-white dark:border-[#101218]"
                      title="Profile Picture"
                    >
                      <UserIcon className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {currentUser.fullName || "Client Account"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {currentUser.kycPhotoUrl || currentUser.kyc_photo_url ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10.5px] font-semibold font-mono">
                          <ShieldCheckIcon className="w-3 h-3" />
                          <span>Biometric KYC Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10.5px] font-semibold font-mono">
                          <ShieldCheckIcon className="w-3 h-3" />
                          <span>Account Verified</span>
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-neutral-400">
                        ID: #{String(currentUser.userId || currentUser.user_id || "CL").padStart(4, "0")}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono text-neutral-400">
                  Auth:{" "}
                  <strong className="text-neutral-700 dark:text-neutral-200 uppercase">
                    {currentUser.authProvider || "Local / Password"}
                  </strong>
                </span>
              </div>

              <div className="space-y-6 text-xs">
                {/* Dedicated Dual Photos Display: KYC vs PFP */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-3">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Identity Verification &amp; Profile Media</span>
                    </span>
                    <span className="text-[9.5px] text-neutral-400 font-normal">
                      KYC Biometrics ≠ Account Avatar (PFP)
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card A: Official Biometric KYC Face Verification Selfie */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f121a] border border-emerald-500/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          <span>Official Biometric KYC Photo</span>
                        </span>
                        {currentUser.kycPhotoUrl || currentUser.kyc_photo_url ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Immutable Record
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Live Camera Only
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border border-emerald-500/40 bg-neutral-900 shrink-0">
                          {currentUser.kycPhotoUrl || currentUser.kyc_photo_url ? (
                            <img
                              src={currentUser.kycPhotoUrl || currentUser.kyc_photo_url}
                              alt="Biometric KYC Face Verification"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-500/10 text-emerald-500">
                              <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 text-[11px] font-mono space-y-1">
                          <p className="text-neutral-800 dark:text-neutral-200 font-semibold leading-tight">
                            {currentUser.kycPhotoUrl || currentUser.kyc_photo_url
                              ? "Biometric Live Scan Capture"
                              : "Pending Live Biometric Selfie"}
                          </p>
                          <p className="text-[10px] text-neutral-400 leading-snug">
                            {currentUser.kycPhotoUrl || currentUser.kyc_photo_url
                              ? "Official compliance facial scan. Secured under RA 10173."
                              : "Naka-lock sa live camera biometric scan lamang."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card B: Profile Picture (PFP / Free Will Avatar) */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f121a] border border-amber-500/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Account Profile Picture (PFP)</span>
                        </span>
                        <label className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer transition-colors inline-flex items-center gap-1">
                          <span>{isUploadingPfp ? "Uploading..." : "Upload New PFP"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePfpUpload}
                            disabled={isUploadingPfp}
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border border-amber-500/40 bg-neutral-900 shrink-0">
                          {currentUser.avatarUrl || currentUser.avatar_url ? (
                            <img
                              src={currentUser.avatarUrl || currentUser.avatar_url}
                              alt="User Profile Picture"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-500/20 text-amber-500 font-bold font-mono text-base">
                              {(currentUser.fullName || "CL").substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 text-[11px] font-mono space-y-1">
                          <p className="text-neutral-800 dark:text-neutral-200 font-semibold leading-tight">
                            {currentUser.avatarUrl || currentUser.avatar_url
                              ? "Personalized Profile Avatar"
                              : "Initials Monogram Avatar"}
                          </p>
                          <p className="text-[10px] text-neutral-400 leading-snug">
                            You have the free will to update or replace your PFP anytime without changing your verified KYC file.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Personal & Contact Profile */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>1. Personal &amp; Demographic Profile</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5">
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Full Legal Name</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {currentUser.fullName || currentUser.full_name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Email Address</span>
                      <span className="font-mono text-neutral-900 dark:text-white font-medium">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Mobile Number</span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="font-mono text-neutral-900 dark:text-white font-medium">
                          {currentUser.phoneNumber || currentUser.phone_number || "—"}
                        </span>
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
                        {currentUser.birthDate || currentUser.birth_date || "—"}
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
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Civil Status</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {currentUser.civilStatus || currentUser.civil_status || "Single"}
                      </span>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Residential Address</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {currentUser.locationAddress || currentUser.location_address || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Architectural Project & Lot Specifications */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                    <HomeIcon className="w-3.5 h-3.5" />
                    <span>2. Architectural Project &amp; Lot Specifications</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5">
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
                        {currentUser.targetBuildLocation || currentUser.target_build_location || currentUser.locationAddress || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. OFW Representative (if applicable) */}
                {(currentUser.clientType === "OFW" || currentUser.client_type === "OFW") && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-2.5 flex items-center gap-1.5">
                      <PlaneIcon className="w-3.5 h-3.5" />
                      <span>3. Overseas Worker &amp; Local Representative</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5">
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

              <div className="pt-4 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between">
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
        </main>
      </div>

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

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-white flex items-center justify-center font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>INITIALIZING MCPA CLIENT PORTAL...</span>
          </div>
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}
