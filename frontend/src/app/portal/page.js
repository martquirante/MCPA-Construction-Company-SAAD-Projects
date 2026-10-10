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
  getThemePreference,
  setThemePreference,
} from "@/modules/shared/SystemThemeSync";
import {
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  Check,
  Calendar,
  MapPin,
  ExternalLink,
  LogOut,
  FolderKanban,
  Building,
  Video,
  User,
  Plane,
  Phone,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Plus,
  CreditCard,
  Camera,
  Layers,
  Bell,
  Sparkles,
  Copy,
  CheckCircle2,
  FileText,
  Download,
} from "lucide-react";
import PortalHeroFinancialCard from "@/modules/portal/components/PortalHeroFinancialCard";
import PortalOverallProgressCard from "@/modules/portal/components/PortalOverallProgressCard";
import PortalOnSiteWeatherCard from "@/modules/portal/components/PortalOnSiteWeatherCard";
import PortalMilestoneStepper from "@/modules/portal/components/PortalMilestoneStepper";
import PortalProjectSpecsCard from "@/modules/portal/components/PortalProjectSpecsCard";
import PortalLiveTimeline from "@/modules/portal/components/PortalLiveTimeline";
import PortalSiteGallerySection from "@/modules/portal/components/PortalSiteGallerySection";
import PortalBillingLedgerSection from "@/modules/portal/components/PortalBillingLedgerSection";
import PortalMobileBottomNav from "@/modules/portal/components/PortalMobileBottomNav";
import PortalEmptyState from "@/modules/portal/components/PortalEmptyState";
import { authFetch } from "@/modules/shared/authFetch";
import { getBookingIntent, clearBookingIntent } from "@/modules/shared/bookingAuthHelper";
import { isMeetingPast } from "@/modules/shared/meetingHelper";

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

  // Active view tab: "overview" | "inquiries" | "construction" | "gallery" | "billing" | "messages" | "profile"
  const [portalTab, setPortalTab] = useState("overview");
  const [inquiries, setInquiries] = useState([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // Construction project (from live database)
  const [siteProject, setSiteProject] = useState(null);
  const [siteMilestones, setSiteMilestones] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);

  // Sidebar & Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Theme preference state
  const [themeMode, setThemeMode] = useState("system");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Authoritative server clock for Manila time
  const { dateStr, timeStr, timezoneCode, hasClockSkew, skewText } = useAuthoritativeClock("Asia/Manila");

  // Modal & Toast states
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isUploadingPfp, setIsUploadingPfp] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.avatar_url, currentUser?.avatarUrl]);

  const [copiedId, setCopiedId] = useState(false);
  const handleCopyId = (id) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showToast("Client ID copied to clipboard!");
    }
  };

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} yrs old` : null;
  };

  const isGoogleAccount = Boolean(
    currentUser?.authProvider === "google" ||
    currentUser?.auth_provider === "google" ||
    currentUser?.email?.toLowerCase().endsWith("@gmail.com") ||
    currentUser?.avatarUrl?.includes("googleusercontent.com") ||
    currentUser?.avatar_url?.includes("googleusercontent.com")
  );

  // If user previously had messages active, gracefully fall back to overview
  useEffect(() => {
    if (portalTab === "messages") {
      setPortalTab("overview");
    }
  }, [portalTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Sync theme on mount and listen to changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const pref = getThemePreference();
        setThemeMode(pref);
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      });

      const handleThemeChange = (e) => {
        setThemeMode(e.detail.mode || "system");
        setIsDarkMode(e.detail.isDark);
      };

      window.addEventListener("mcpa-theme-change", handleThemeChange);
      return () => window.removeEventListener("mcpa-theme-change", handleThemeChange);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = isDarkMode ? "light" : "dark";
    setThemePreference(nextMode);
    setThemeMode(nextMode);
    setIsDarkMode(!isDarkMode);
    showToast(`Switched to ${nextMode === "dark" ? "Dark" : "Light"} Mode`);
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

      queueMicrotask(() => {
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

            if (tabParam && ["overview", "inquiries", "construction", "gallery", "billing", "profile"].includes(tabParam)) {
              setPortalTab(tabParam);
            }
          } catch (e) {
            console.warn("User parse error:", e);
          }
        }
        setIsLoadingAuth(false);
      });
    }
  }, [redirectParam, tabParam, router]);

  // 2. Fetch inquiries and construction data strictly for the logged-in client
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

    // Fetch construction site execution status strictly for this client email
    try {
      const siteRes = await fetch(`/api/construction/project?email=${encodeURIComponent(userEmail)}`).then((r) => r.json());
      if (siteRes.success && siteRes.project) {
        setSiteProject(siteRes.project);
        setSiteMilestones(siteRes.milestones || []);
        setSitePhotos(siteRes.photos || []);
        setBillingLedger(siteRes.billing || []);
      } else {
        setSiteProject(null);
        setSiteMilestones([]);
        setSitePhotos([]);
        setBillingLedger([]);
      }
    } catch (e) {
      setSiteProject(null);
      setSiteMilestones([]);
      setSitePhotos([]);
      setBillingLedger([]);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email;
      queueMicrotask(() => {
        fetchClientData(email);
      });
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

  // Active Pending Inquiries count
  const activeInquiriesCount = inquiries.filter(
    (b) =>
      (b.status || "Pending Review") === "Pending Review" ||
      (b.status || "").includes("Meeting") ||
      (b.status || "").includes("Review")
  ).length;

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
  // AUTHENTICATED CLIENT CONSOLE (Faithfully Matching Inspo Layout & Architecture)
  // =========================================================================
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "construction",
      label: "Projects",
      icon: Building,
      badge: siteProject ? `${siteProject.progress_pct}%` : undefined,
    },
    {
      id: "gallery",
      label: "Site Gallery",
      icon: Camera,
      badge: sitePhotos.length > 0 ? sitePhotos.length : undefined,
    },
    {
      id: "billing",
      label: "Billing & Escrow",
      icon: CreditCard,
      badge: billingLedger.length > 0 ? billingLedger.length : undefined,
    },
    {
      id: "inquiries",
      label: "Inquiries",
      icon: FolderKanban,
      badge: inquiries.length > 0 ? inquiries.length : undefined,
    },
  ];

  const currentTabInfo =
    navItems.find((n) => n.id === portalTab) ||
    (portalTab === "profile" ? { id: "profile", label: "Profile", icon: User } : navItems[0]);
  const clientName = currentUser?.fullName || "Valued Client";
  const isGoogleUser = Boolean(
    currentUser?.provider === "google" ||
    currentUser?.authProvider === "google" ||
    currentUser?.auth_provider === "google" ||
    (currentUser?.avatarUrl && currentUser.avatarUrl.includes("googleusercontent.com")) ||
    (currentUser?.avatar_url && currentUser.avatar_url.includes("googleusercontent.com")) ||
    (currentUser?.email && currentUser.email.toLowerCase().endsWith("@gmail.com"))
  );

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-[12px] bg-amber-500 text-neutral-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
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
                className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-3.5 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
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

      {/* Left Sidebar Navigation (Matching Desktop & Tablet Inspos, Light & Dark Adaptive) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-[280px] sm:w-72 max-w-[85vw] bg-white dark:bg-[#121212] text-neutral-900 dark:text-white border-r border-neutral-200 dark:border-white/5 flex flex-col justify-between z-50 transition-all duration-200 shrink-0 shadow-xl lg:shadow-none ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Section */}
        <div className="border-b border-neutral-200 dark:border-white/5 p-4">
          {/* Mobile Brand View */}
          <div className="flex lg:hidden items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="relative w-36 h-9 shrink-0">
                <Image
                  src="/assets/logo-white.svg"
                  alt="MCPA Construction"
                  fill
                  priority
                  unoptimized
                  className="object-contain object-left dark:brightness-100 brightness-0"
                  sizes="144px"
                />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-[6px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Brand View */}
          <div className="hidden lg:flex items-center justify-between w-full">
            {isSidebarCollapsed ? (
              <div className="w-full flex flex-col items-center gap-2.5 py-1">
                <Link
                  href="/"
                  title="MCPA Homepage"
                  className="relative z-10 w-10 h-10 rounded-[8px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 p-1 flex items-center justify-center shrink-0 hover:border-amber-500 transition-colors"
                >
                  <Image
                    src="/assets/logo-white.svg"
                    alt="MCPA Logo"
                    fill
                    priority
                    unoptimized
                    className="object-contain p-1.5 dark:brightness-100 brightness-0"
                    sizes="40px"
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-[6px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Expand Navigation"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-3">
                <div className="flex items-center justify-between w-full">
                  <Link href="/" className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-36 h-9 shrink-0">
                      <Image
                        src="/assets/logo-white.svg"
                        alt="MCPA Construction"
                        fill
                        priority
                        unoptimized
                        className="object-contain object-left dark:brightness-100 brightness-0"
                        sizes="144px"
                      />
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={toggleSidebarCollapse}
                    className="p-1.5 rounded-[6px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Collapse Navigation"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Account Bar (Below Logo, Before Nav Bar) */}
        <div className={`p-3 border-b border-neutral-200 dark:border-white/5 ${isSidebarCollapsed ? "lg:p-2" : "lg:p-3"}`}>
          <div
            onClick={() => {
              setPortalTab("profile");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center p-1" : "p-2 gap-2.5"
            } rounded-[10px] bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:bg-neutral-200/50 dark:hover:bg-white/[0.06] transition-all cursor-pointer group`}
            role="button"
            tabIndex={0}
            title="Manage Profile"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-bold text-xs flex items-center justify-center font-mono overflow-hidden">
                {(currentUser?.avatar_url || currentUser?.avatarUrl) && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar_url || currentUser.avatarUrl}
                    alt={clientName || "Profile Avatar"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  (clientName || "CL").substring(0, 2).toUpperCase()
                )}
              </div>
              {/* Google Account micro badge */}
              {isGoogleUser && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#181a24] flex items-center justify-center p-0.5 shadow-xs border border-neutral-200 dark:border-white/10 pointer-events-none select-none"
                  title="Google Account"
                >
                  <svg className="w-full h-full shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                  {clientName}
                </p>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block truncate">
                  Client / Owner
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu (Clean items, adapting seamlessly to light & dark theme) */}
        <nav
          className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 ${
            isSidebarCollapsed ? "lg:p-2" : "lg:p-3"
          }`}
        >
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer relative ${
                    isSidebarCollapsed
                      ? "lg:h-10 lg:justify-center lg:px-0"
                      : "justify-between"
                  } ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
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
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-neutral-950 stroke-[2.5]"
                            : "text-neutral-500 dark:text-neutral-400 group-hover:text-amber-500"
                        }`}
                      />
                      {/* Collapsed Mode Overlay Badge: Nakapatong sa top-right ng icon, pantay ang icon centering */}
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

                  {/* Expanded Mode & Mobile Drawer Badge (Normal inline right alignment) */}
                  {item.badge !== undefined && (
                    <span
                      className={`${
                        isSidebarCollapsed ? "block lg:hidden" : "block"
                      } px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold shrink-0 ${
                        isActive
                          ? "bg-neutral-950 text-white"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isSidebarCollapsed && (
                  <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-[6px] bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-mono shadow-xl border border-neutral-700 dark:border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 items-center gap-2">
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
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar (Matching Desktop Monitor 1 Inspo) */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#080a0e]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-6 flex items-center justify-between gap-3 transition-colors select-none">
          {/* Left: Mobile hamburger & Active project selector pill */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-[8px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active Project Breadcrumb (Only rendered when a project is mobilized) */}
            {siteProject && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px]">
                  {siteProject.name}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  ({siteProject.project_code})
                </span>
              </div>
            )}
          </div>

          {/* Right Utilities: Clock, Theme, Bell */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-time Authoritative Server-Synced Clock */}
            {timeStr && (
              <div
                className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 select-none py-1"
                title={
                  hasClockSkew
                    ? `System Time Verified (PHT). Device clock differs by ${skewText}, auto-corrected via server.`
                    : "Philippine Standard Time (PHT) · Real-time Server Synced"
                }
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="tabular-nums text-neutral-600 dark:text-neutral-300">
                  <span className="hidden sm:inline">{dateStr} · </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {timeStr}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500 ml-1 text-[11px]">
                    {timezoneCode}
                  </span>
                </span>
              </div>
            )}

            {/* Hairline divider */}
            <div className="h-4 w-px bg-neutral-200 dark:bg-white/10 hidden sm:block" />

            {/* Notification Bell (Swapped: Now positioned before Theme Toggle) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => showToast("All system inspection telemetries are up to date.")}
                className="p-1.5 rounded-none hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 border border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>

            {/* Dark & Light Theme Architectural Toggle Switch (Strictly Non-Curved / Sharp Geometric Box) */}
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={toggleTheme}
              className="relative inline-flex items-center h-7 w-14 rounded-none bg-neutral-200 dark:bg-[#141722] border border-neutral-300 dark:border-white/15 p-0.5 transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-amber-500"
              title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Dark and Light Mode"
            >
              {/* Stationary Background Track Icons */}
              <div className="w-full flex items-center justify-between px-1.5 pointer-events-none">
                <Sun className={`w-3 h-3 transition-opacity duration-200 ${!isDarkMode ? "opacity-0" : "text-neutral-400 opacity-60"}`} />
                <Moon className={`w-3 h-3 transition-opacity duration-200 ${isDarkMode ? "opacity-0" : "text-neutral-500 opacity-60"}`} />
              </div>

              {/* Sliding Angular / Non-Curved Thumb */}
              <div
                className={`absolute top-0.5 bottom-0.5 w-6 rounded-none flex items-center justify-center transition-transform duration-200 ease-out shadow-xs ${
                  isDarkMode
                    ? "translate-x-7 bg-amber-500 text-neutral-950 border border-amber-400"
                    : "translate-x-0 bg-white text-amber-600 border border-neutral-300"
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE DASHBOARD OVERVIEW (Matching Desktop Monitor 1)           */}
          {/* ========================================================================= */}
          {portalTab === "overview" && (
            <div className="space-y-6">
              {siteProject ? (
                <>
                  {/* Top Row: 3 Key Header Cards (From Desktop Inspo) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Project Investment Balance */}
                    <PortalHeroFinancialCard
                      billingLedger={billingLedger}
                      contractValue={siteProject.contract_value || null}
                      onViewBilling={() => setPortalTab("billing")}
                      onScheduleSite={() => setIsInquiryModalOpen(true)}
                    />

                    {/* Card 2: Overall Progress (Radial circular ring) */}
                    <PortalOverallProgressCard
                      progressPct={siteProject.progress_pct || 0}
                      nextMilestone={siteProject.current_phase || "Roofing & MEP Handover"}
                      targetDate="Dec 2026"
                    />

                    {/* Card 3: On-Site Weather */}
                    <PortalOnSiteWeatherCard
                      temperature="31°C"
                      condition="Sunny"
                      subtext="Optimal conditions for concrete curing"
                      location={`${siteProject.location || "Taguig Site"}`}
                    />
                  </div>

                  {/* Second Row: 8 cols left, 4 cols right (From Desktop Inspo) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    {/* Left Column (8 cols): Milestones + Live Timeline */}
                    <div className="lg:col-span-8 space-y-6">
                      <PortalMilestoneStepper
                        milestones={siteMilestones}
                        overallPct={siteProject.progress_pct || 0}
                        currentPhase={siteProject.current_phase}
                        onViewAll={() => setPortalTab("construction")}
                      />

                      <PortalLiveTimeline
                        photoLogs={sitePhotos}
                        onSelectPhoto={() => setPortalTab("gallery")}
                        onViewAll={() => setPortalTab("gallery")}
                      />
                    </div>

                    {/* Right Column (4 cols): Project Specs + Site Supervisor */}
                    <div className="lg:col-span-4 space-y-6">
                      <PortalProjectSpecsCard
                        project={siteProject}
                        overallPct={siteProject.progress_pct || 0}
                        onOpenVirtualTour={() => {
                          if (siteProject.virtual_tour_url) {
                            window.open(siteProject.virtual_tour_url, "_blank");
                          }
                        }}
                      />

                      <PortalSiteSupervisorCard
                        leadEngineer={siteProject.lead_engineer || "Engr. Aris Reyes"}
                        phoneNumber="+63 949 775 8239"
                        email="aris.reyes@mcpaprojects.ph"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Authentic Standby & Consultation State when no site project is mobilized yet */
                <div className="space-y-6">
                  {/* Primary Animated Empty State with LottieFiles */}
                  <PortalEmptyState
                    type="construction"
                    badge="Ready for Mobilization"
                    title="No Construction Site Mobilized Yet"
                    description="Gantt milestones, daily photos, and progress billing will stream here once site mobilization begins."
                    secondaryAction={
                      <button
                        type="button"
                        onClick={() => setPortalTab("inquiries")}
                        className="px-4 py-2.5 rounded-[10px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
                      >
                        <FolderKanban className="w-4 h-4" />
                        <span>My Inquiries ({inquiries.length})</span>
                      </button>
                    }
                  />

                  {/* 3-Step Mobilization Roadmap Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 sm:p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-1.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                          01
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">Step One</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Consultation &amp; Lot Survey
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Submit brief with lot coordinates for architectural and soil review.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-1.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                          02
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">Step Two</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Blueprint &amp; Cost Estimation
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Structural engineering, bill of quantities (BOQ), and city permits.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-1.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                          03
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">Step Three</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Live Site Telemetry
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        On-site execution with 4K inspections and progress billing releases.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PROJECTS & SITE PROGRESS (Matching Mobile & Tablet Screen 2)         */}
          {/* ========================================================================= */}
          {portalTab === "construction" && (
            <div className="space-y-6">
              {siteProject ? (
                <>
                  <PortalMilestoneStepper
                    milestones={siteMilestones}
                    overallPct={siteProject.progress_pct || 0}
                    currentPhase={siteProject.current_phase}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    <div className="lg:col-span-7">
                      <PortalProjectSpecsCard
                        project={siteProject}
                        overallPct={siteProject.progress_pct || 0}
                        onOpenVirtualTour={() => {
                          if (siteProject.virtual_tour_url) {
                            window.open(siteProject.virtual_tour_url, "_blank");
                          }
                        }}
                      />
                    </div>
                    <div className="lg:col-span-5">
                      <PortalSiteSupervisorCard
                        leadEngineer={siteProject.lead_engineer || "Engr. Aris Reyes"}
                        phoneNumber="+63 949 775 8239"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <PortalEmptyState
                  type="milestones"
                  badge="Gantt Roadmap"
                  title="No Milestones Scheduled"
                  description="Milestone checklists and inspection sign-offs will stream here once site works begin."
                  actionButton={
                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(true)}
                      className="px-5 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Start Construction Consultation</span>
                    </button>
                  }
                />
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SITE PHOTO GALLERY & DAILY LOGS (Matching Screen 3 Inspo)           */}
          {/* ========================================================================= */}
          {portalTab === "gallery" && (
            <div className="space-y-6">
              <PortalSiteGallerySection
                photos={sitePhotos}
                projectCode={siteProject?.project_code || "PRJ-ACTIVE"}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PROGRESS BILLING & ESCROW (Matching Screen 4 Inspo)                 */}
          {/* ========================================================================= */}
          {portalTab === "billing" && (
            <div className="space-y-6">
              <PortalBillingLedgerSection
                billing={billingLedger}
                projectCode={siteProject?.project_code || "PRJ-ACTIVE"}
                onProofUploaded={() => {
                  if (currentUser?.email) {
                    fetchClientData(currentUser.email);
                  }
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CONSULTATION INQUIRIES                                              */}
          {/* ========================================================================= */}
          {portalTab === "inquiries" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#101218] p-4 rounded-[16px] border border-neutral-200 dark:border-white/5 transition-colors">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Consultation Briefs Pipeline ({inquiries.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Track your architectural project parameters, lot coordinates, and schedule determinations.
                </p>
              </div>

              {isLoadingInquiries ? (
                <div className="p-12 text-center text-xs font-mono text-neutral-400">
                  Loading your consultation briefs...
                </div>
              ) : inquiries.length === 0 ? (
                <PortalEmptyState
                  type="messages"
                  badge="Inquiry Pipeline"
                  title="No Active Consultation Inquiries"
                  description="Submit your architectural brief to start your design consultation with MCPA engineers."
                  actionButton={
                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(true)}
                      className="px-6 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Start First Project Inquiry</span>
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {inquiries.map((brief, idx) => {
                    const id = brief.submission_id || brief.submissionId || `MCPA-CPB-${brief.brief_id || idx}`;
                    const status = brief.status || "Pending Review";
                    const mapCoord = brief.map_coordinates || brief.mapCoordinates;

                    return (
                      <div
                        key={id}
                        className="rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-7 shadow-xs space-y-5 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/5 pb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Ref: {id}
                              </span>
                              {brief.client_portal_code && (
                                <span className="text-[10px] font-mono font-bold text-neutral-400">
                                  • CODE: {brief.client_portal_code}
                                </span>
                              )}
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                              {(() => {
                                const pt = brief.project_type || brief.projectType || "Residential Design & Build";
                                return pt.toLowerCase().includes("residential") ? "Residential" : pt;
                              })()}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              Style: {brief.preferred_style || "Contemporary Modern"} • Budget:{" "}
                              {brief.budget_range || "Flexible"}
                            </p>
                          </div>

                          {/* Status: Clean text-only without pill backgrounds or borders */}
                          <div className="flex items-center">
                            <span
                              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                                status.toLowerCase().includes("scheduled") || status.toLowerCase().includes("approved")
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : status.toLowerCase().includes("reject") || status.toLowerCase().includes("decline")
                                  ? "text-red-600 dark:text-red-400"
                                  : status.toLowerCase().includes("review")
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* Meeting Itinerary & Pinned Lot Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="p-4 rounded-[12px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Consultation Itinerary
                            </span>
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                Mode: {brief.venue_type ? `In-Person (${brief.venue_type})` : brief.meeting_mode || "Online Meeting"}
                              </p>
                              <p className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 flex-wrap">
                                <span>Slot: {brief.meeting_date || "Earliest Available"} ({brief.meeting_time || "02:00 PM PHT"})</span>
                                {isMeetingPast(brief.meeting_date || brief.meetingDate, brief.meeting_time || brief.meetingTime) && (
                                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-medium">
                                    • Concluded
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-[12px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/5 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              Property Geolocation
                            </span>
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                Location: {brief.location || "Philippines"}
                              </p>
                              <p className="text-neutral-600 dark:text-neutral-400">
                                Lot Area: {brief.lot_area || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Meeting Link Room Card (Only active when scheduled, not rejected, and not past) */}
                        {Boolean(
                          (brief.meeting_link || brief.meetingLink) &&
                          !status.toLowerCase().includes("reject") &&
                          !status.toLowerCase().includes("decline") &&
                          !isMeetingPast(brief.meeting_date || brief.meetingDate, brief.meeting_time || brief.meetingTime)
                        ) && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[12px] bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                  Consultation Meeting Access
                                </p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                                  {(brief.meeting_link || brief.meetingLink).startsWith("http")
                                    ? "Official Video Call Room Prepared"
                                    : (brief.meeting_link || brief.meetingLink)}
                                </p>
                              </div>
                            </div>
                            {(brief.meeting_link || brief.meetingLink).startsWith("http") && (
                              <a
                                href={brief.meeting_link || brief.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                              >
                                <span>Join Consultation Call</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Consultation Itinerary Instructions & Notes */}
                        {(brief.meeting_notes || brief.meetingNotes) && (
                          <div className="p-3.5 rounded-[12px] bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                              Architect Notes & Instructions
                            </span>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                              {brief.meeting_notes || brief.meetingNotes}
                            </p>
                          </div>
                        )}

                        {/* Dossier PDF Download Action */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-neutral-200/60 dark:border-white/5">
                          <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                            Registered with MCPA Engineering & Design Office
                          </p>
                          <a
                            href={`/api/briefs/${encodeURIComponent(brief.brief_id || id)}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-2xs"
                            title="Download Official Architectural Brief Dossier PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            <span>Download Dossier PDF</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: CLIENT EXECUTIVE PROFILE & ARCHITECTURAL DOSSIER                   */}
          {/* ========================================================================= */}
          {portalTab === "profile" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
              {/* 1. Executive Identity Hero Banner */}
              <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 shadow-sm transition-colors">
                <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none -mr-20 -mt-20 blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Avatar & Identity Details */}
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    {/* User Avatar with Hover Change Badge */}
                    <div className="relative group shrink-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-neutral-900 shadow-md">
                        {(currentUser?.avatarUrl || currentUser?.avatar_url) && !avatarError ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentUser.avatarUrl || currentUser.avatar_url}
                            alt={currentUser.fullName || "Profile Avatar"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-500 font-bold font-mono text-2xl sm:text-3xl">
                            {(currentUser?.fullName || clientName || "CL").substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <label
                          className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-xs"
                          title="Change Profile Picture (PFP)"
                        >
                          <Camera className="w-4 h-4 text-amber-400 mb-1" />
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center px-1">
                            {isUploadingPfp ? "Saving..." : "Change PFP"}
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
                      {isGoogleUser ? (
                        <span
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#181a24] flex items-center justify-center border-2 border-white dark:border-[#101218] shadow-md p-1 pointer-events-none select-none"
                          title="Verified Google Account"
                        >
                          <svg className="w-full h-full shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </span>
                      ) : (
                        <span
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-[#101218] shadow-xs"
                          title="Verified Client Profile"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Metadata Header */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Demographic Badge (No background - clean text & icon) */}
                        {currentUser?.clientType === "OFW" || currentUser?.client_type === "OFW" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                            <Plane className="w-3.5 h-3.5 shrink-0" />
                            <span>Overseas Worker (OFW)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>Local Resident (PH)</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                        {currentUser?.fullName || clientName}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                          {currentUser?.occupation || "Verified Property Owner / Client"}
                        </span>
                        <span>•</span>
                        <span>
                          Member Since {currentUser?.createdAt || currentUser?.created_at
                            ? new Date(currentUser.createdAt || currentUser.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                            : "2026"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Clean Sign Out Button */}
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      className="px-4 py-2 rounded-[10px] border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 font-mono font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      title="Sign Out of Portal"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Structured Bento Grid for All Enrollment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* CARD 1: Personal & Demographic Profile */}
                <div className="rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-xs transition-colors">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/icons/user.png" alt="User" className="w-4.5 h-4.5 object-contain shrink-0" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Personal &amp; Demographic Profile
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Step 1 &amp; 2 Onboarding</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Full Legal Name</span>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {currentUser?.fullName || clientName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Date of Birth &amp; Age</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.birthDate || currentUser?.birth_date ? (
                          <>
                            {currentUser.birthDate || currentUser.birth_date}
                            {calculateAge(currentUser.birthDate || currentUser.birth_date) && (
                              <span className="text-amber-500 ml-1.5 font-bold">
                                ({calculateAge(currentUser.birthDate || currentUser.birth_date)})
                              </span>
                            )}
                          </>
                        ) : (
                          "Recorded on File"
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Civil Status</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.civilStatus || currentUser?.civil_status || "Single"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Spouse Name</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.spouseName || currentUser?.spouse_name || "— (Not Applicable)"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Occupation / Profession</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.occupation || "Property Owner / Executive"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Employer / Company</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.employerName || currentUser?.employer_name || "Private Enterprise"}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-1 pt-1 border-t border-neutral-100 dark:border-white/5">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Monthly Income Classification</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.monthlyIncome || currentUser?.monthly_income || "Confidential (Enrolled in Project Financing)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Verified Contact & Communication Channels */}
                <div className="rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-xs transition-colors">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/icons/phone.png" alt="Phone" className="w-4.5 h-4.5 object-contain shrink-0" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Contact &amp; Telemetry Channels
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Live Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Official Email Address</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isGoogleAccount && (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        )}
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {currentUser?.email}
                        </p>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {isGoogleAccount ? "(Google Verified Account)" : "(Primary Inquiries)"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Mobile Contact Number</span>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {currentUser?.phoneNumber || currentUser?.phone_number || "—"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Messaging App Compatibility</span>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{currentUser?.hasViberWhatsapp || currentUser?.has_viber_whatsapp ? "Viber / WhatsApp Connected" : "Standard Roaming SMS"}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Preferred Consultation Window</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.preferredContactTime || currentUser?.preferred_contact_time || "Anytime (PH Daytime 08:00 - 17:00 PHT)"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Emergency Contact</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.emergencyContact || currentUser?.emergency_contact || currentUser?.phRepPhone || "Liaison On File"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Permanent Residential Address */}
                <div className="rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-xs transition-colors">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/icons/location.png" alt="Location" className="w-4.5 h-4.5 object-contain shrink-0" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Permanent Residential Address
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Civil Registry Record</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Registered Full Address</span>
                    <p className="font-semibold text-neutral-900 dark:text-white leading-relaxed text-xs">
                      {currentUser?.locationAddress || currentUser?.location_address || "Bulacan / NCR, Philippines"}
                    </p>
                  </div>

                  <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                    <span>Jurisdiction: Republic of the Philippines</span>
                    <span className="text-emerald-500 font-semibold">Titled Property Owner Jurisdiction</span>
                  </div>
                </div>

                {/* CARD 4: Architectural Project Specifications (from Step 4) */}
                <div className="rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-xs transition-colors">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/icons/projects.png" alt="Projects" className="w-4.5 h-4.5 object-contain shrink-0" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Architectural Build &amp; Lot Baseline
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">Step 4 Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Target Architectural Project</span>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {currentUser?.targetProjectType || currentUser?.target_project_type || "Custom Residential Architectural Build"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Lot Title &amp; Ownership Status</span>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400 font-bold">
                        {currentUser?.lotOwnershipStatus || currentUser?.lot_ownership_status || "Titled Lot (Clean Title)"}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Target Build Location</span>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {currentUser?.targetBuildLocation || currentUser?.target_build_location || currentUser?.locationAddress || currentUser?.location_address || "Central Luzon / NCR, Philippines"}
                      </p>
                    </div>

                    {(currentUser?.subdivisionLotDetails || currentUser?.subdivision_lot_details) && (
                      <div className="sm:col-span-2 space-y-1 pt-1 border-t border-neutral-100 dark:border-white/5">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Subdivision / Block &amp; Lot Details</span>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {currentUser.subdivisionLotDetails || currentUser.subdivision_lot_details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Overseas Worker & Local Representative Card (Shown for OFW or when Rep on record) */}
              {(currentUser?.clientType === "OFW" || currentUser?.client_type === "OFW" || currentUser?.phRepName || currentUser?.ph_rep_name) && (
                <div className="rounded-[18px] bg-gradient-to-r from-amber-500/[0.04] via-amber-500/[0.02] to-transparent border border-amber-500/20 p-5 sm:p-6 space-y-4 shadow-xs transition-colors">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/icons/location.png" alt="Station" className="w-4.5 h-4.5 object-contain shrink-0" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Overseas Filipino Worker (OFW) Station &amp; Local Representative
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">On-Site Inspection Proxy</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Current Host Country</span>
                      <p className="font-bold text-neutral-900 dark:text-white">
                        {currentUser?.ofwCountry || currentUser?.ofw_country || "Overseas Station"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Authorized Local Representative</span>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {currentUser?.phRepName || currentUser?.ph_rep_name || "—"}
                        {(currentUser?.phRepRelationship || currentUser?.ph_rep_relationship) && (
                          <span className="text-neutral-500 text-[10px] block font-normal">
                            ({currentUser.phRepRelationship || currentUser.ph_rep_relationship})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Representative Contact Number</span>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {currentUser?.phRepPhone || currentUser?.ph_rep_phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Security, Biometric Isolation & Compliance Assurance Footer */}
              <div className="rounded-[18px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-mono">
                    <p className="font-bold text-neutral-900 dark:text-white">
                      Republic Act 10173 · Data Privacy Act of 2012 Certified
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Biometric KYC scan selfies are isolated in encrypted compliance vaults and kept strictly separate from your account profile avatar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="px-2.5 py-1 rounded-[6px] bg-transparent text-[10px] font-mono text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-300/60 dark:border-white/10 flex items-center gap-1.5">
                    {isGoogleAccount && (
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Auth: {isGoogleAccount ? "Google OAuth 2.0" : currentUser?.authProvider || currentUser?.auth_provider || "Secure Session"}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Glassmorphic Bottom Navigation for Mobile & Tablet (< 1024px) */}
      <PortalMobileBottomNav
        activeTab={portalTab}
        onTabChange={(tab) => {
          setPortalTab(tab);
        }}
        onOpenMenu={() => setIsMobileSidebarOpen(true)}
        unreadCount={activeInquiriesCount || 0}
      />

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
