"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MenuIcon,
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
} from "./Icons";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import UtilityBar from "./UtilityBar";
import { getThemePreference, setThemePreference } from "./SystemThemeSync";
import { useLanguage } from "./LanguageContext";
import { setReturnToCompletedHome } from "@/modules/home/homeState";

export default function ClientNavbar({ isCompleted = false } = {}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(!isHome);
  const [announcementState, setAnnouncementState] = useState({ route: pathname, dismissed: false });
  const announcementDismissed = announcementState.route === pathname && announcementState.dismissed;
  const [isModalActive, setIsModalActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);

  const checkMobileConnection = async () => {
    setIsCheckingConnection(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/health", { method: "GET", cache: "no-store" });
      const lat = Date.now() - start;
      if (res.ok) {
        setIsOnline(true);
        setPingLatency(lat);
      } else {
        setIsOnline(false);
        setPingLatency(null);
      }
    } catch (_) {
      setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
      setPingLatency(null);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof navigator !== "undefined") setIsOnline(navigator.onLine);
    const handleOff = () => {
      setIsOnline(false);
      setPingLatency(null);
    };
    const handleOn = () => {
      setIsOnline(true);
      checkMobileConnection();
    };
    window.addEventListener("offline", handleOff);
    window.addEventListener("online", handleOn);
    return () => {
      window.removeEventListener("offline", handleOff);
      window.removeEventListener("online", handleOn);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkModal = () => {
      setIsModalActive(document.body.classList.contains("modal-open"));
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHome) {
      setScrolledPastHero(true);
      return;
    }
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        const overviewEl = document.getElementById("overview");
        if (overviewEl) {
          const rect = overviewEl.getBoundingClientRect();
          setScrolledPastHero(rect.top <= 120);
        } else {
          const heroThreshold = 3.5 * window.innerHeight;
          setScrolledPastHero(window.scrollY >= heroThreshold);
        }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isHome]);

  // Show UtilityBar ONLY on the homepage hero section when build is completed and not scrolled past hero
  const showUtilityBar = isHome && isCompleted && !scrolledPastHero && !announcementDismissed;

  const navLinks = [
    { label: t("navHome"), href: "/", active: pathname === "/" },
    { label: t("navProjects"), href: "/projects", active: pathname === "/projects" },
    { label: t("navServices"), href: "/services", active: pathname === "/services" },
    { label: t("navProcess"), href: "/process", active: pathname === "/process" },
  ];

  const handleNavClick = (e, href) => {
    if (href === "/") {
      setReturnToCompletedHome(true);
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("mcpa:goto-completed"));
        const vh = window.innerHeight;
        window.scrollTo({ top: 3 * vh, behavior: "smooth" });
        window.history.replaceState(null, "", "/");
        return;
      }
    } else if (href.startsWith("/#") || href.startsWith("#")) {
      const targetId = href.replace("/#", "").replace("#", "");
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  };

  // Headings appear when the build reaches completion, scrolled past hero, or on subpages.
  // During video scrolling on home, only the logo is shown ("if sa scroll ng mga video dapat is logo lang nakalagay dyan")
  const showHeadings = !isHome || isCompleted || scrolledPastHero;

  // "Book an Appointment" CTA button: prominently visible when completed or scrolled past hero so it is never hidden or obscured
  const showHeaderBooking = (!isHome || isCompleted || scrolledPastHero) && pathname !== "/book";

  // Client Portal link/icon is visible when completed, scrolled past hero, or on subpages
  const showClientPortal = !isHome || isCompleted || scrolledPastHero;

  return (
    <>
      <div
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 select-none print:hidden ${
          isModalActive
            ? "opacity-0 -translate-y-full pointer-events-none invisible"
            : "opacity-100 translate-y-0"
        }`}
      >
        {/* Top Utility Announcement Bar (ShopRave Inspired) */}
        <div className="relative z-50">
          <UtilityBar
            show={showUtilityBar}
            scrolledPastHero={scrolledPastHero}
          />
        </div>

        {/* Main Header / Navigation Bar: Clear Glass UI without background blur (Sharp & 100% unblurred background) */}
        <header
          className={`relative z-10 w-full transition-all duration-700 ease-out ${
            scrolledPastHero
              ? "bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl backdrop-saturate-150 border-b border-neutral-200/50 dark:border-white/10 py-3 shadow-md text-neutral-900 dark:text-white"
              : isHome && !isCompleted
              ? "bg-transparent py-4 text-white"
              : "bg-white/50 dark:bg-black/25 backdrop-blur-none border-b border-neutral-900/10 dark:border-white/10 py-3.5 text-neutral-900 dark:text-white shadow-xs"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">
          {/* 1. BRAND LOGO - Column 1 (Left-aligned) */}
          <div className="flex items-center justify-start">
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className="flex items-center gap-3 group focus:outline-none select-none"
              aria-label="MCPA Construction and Supply Home"
            >
              <div className="relative w-36 sm:w-44 md:w-52 h-10">
                <Image
                  src="/assets/logo-white.svg"
                  alt="MCPA Construction and Supply"
                  fill
                  priority
                  unoptimized
                  className={`object-contain object-left ${
                    isHome && !isCompleted ? "block drop-shadow-md" : "hidden dark:block"
                  }`}
                  sizes="(max-width: 768px) 180px, 220px"
                />
                <Image
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA Construction and Supply"
                  fill
                  priority
                  unoptimized
                  className={`object-contain object-left ${
                    isHome && !isCompleted ? "hidden" : "block dark:hidden"
                  }`}
                  sizes="(max-width: 768px) 180px, 220px"
                />
              </div>
            </Link>
          </div>

          {/* 2. CENTER NAVIGATION LINKS - Column 2 (Perfect horizontal & vertical center) */}
          <nav
            aria-label="Primary Navigation"
            className={`hidden md:flex items-center justify-center gap-4 lg:gap-8 transition-all duration-700 ease-out ${
              showHeadings
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative py-1.5 px-0.5 text-xs lg:text-sm font-semibold tracking-wide transition-colors duration-200 select-none flex flex-col items-center justify-center ${
                  scrolledPastHero
                    ? link.active
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-neutral-700 hover:text-amber-600 dark:text-neutral-300 dark:hover:text-amber-400"
                    : link.active
                    ? "text-amber-500 dark:text-amber-400 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                    : "text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 font-medium drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                }`}
              >
                <span>{link.label}</span>
                {link.active && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 dark:bg-amber-400" />
                )}
              </Link>
            ))}
          </nav>

          {/* 3. RIGHT UTILITY ACTIONS - Column 3 (Right-aligned) */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3">
            {/* Book an Appointment CTA button: Prominently visible and crisp */}
            {showHeaderBooking && (
              <Link
                href="/book"
                className="hidden sm:inline-flex px-4 lg:px-5 py-2 sm:py-2.5 rounded-[6px] font-sans text-xs font-bold tracking-[0.06em] uppercase transition-[background-color,box-shadow] duration-150 select-none whitespace-nowrap bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.28)] hover:shadow-[0_4px_14px_rgba(245,158,11,0.36)] active:bg-amber-600 active:shadow-none"
              >
                {t("bookAppointment")}
              </Link>
            )}

            {/* Automatic Offline Indicator Pill (kusa lumalabas kapag nawalan ng net) */}
            {!isOnline && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-red-500/12 border border-red-500/35 text-red-600 dark:text-red-400 text-xs font-semibold select-none"
                title={language === "fil" ? "Walang koneksyon sa internet" : "No internet connection"}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono uppercase tracking-wider text-[11px]">
                  {language === "fil" ? "Offline" : "Offline"}
                </span>
              </div>
            )}

            {/* Client Portal Link Button: Unblurred clear glass circle */}
            {showClientPortal && (
              <Link
                href="/portal"
                aria-label="Client Account Portal"
                title="Client Portal & Project Tracker"
                className={`p-2.5 rounded-[6px] transition-[color,background-color,border-color] duration-150 focus:outline-none flex items-center justify-center border select-none ${
                  scrolledPastHero
                    ? "border-neutral-200 dark:border-white/10 text-neutral-700 hover:text-amber-600 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:text-amber-400 dark:hover:bg-white/8"
                    : "border-neutral-900/15 bg-white/45 hover:bg-white/65 text-neutral-900 dark:border-white/20 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/12"
                }`}
              >
                <UserIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile Menu Hamburger Toggle (reveals when headings are enabled) */}
            {showHeadings && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                  scrolledPastHero
                    ? "text-neutral-800 hover:text-amber-600 hover:bg-neutral-100 dark:text-white dark:hover:text-amber-400 dark:hover:bg-white/10"
                    : "text-neutral-800 hover:text-amber-600 hover:bg-white/40 dark:text-white dark:hover:text-amber-400 dark:hover:bg-white/10"
                }`}
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      </div>

      {/* 3. MOBILE DRAWER MENU */}
      <div
        className={`fixed inset-x-0 top-0 z-45 pt-28 pb-8 px-6 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-200 dark:border-white/10 shadow-2xl md:hidden transition-all duration-500 ease-in-out ${
          mobileMenuOpen
            ? "opacity-100 transform translate-y-0 pointer-events-auto"
            : "opacity-0 transform -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col space-y-4 text-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => {
                handleNavClick(e, link.href);
                setMobileMenuOpen(false);
              }}
              className={`text-lg font-medium tracking-wide py-2 transition-colors ${
                link.active
                  ? "text-amber-600 dark:text-amber-400 font-bold"
                  : "text-neutral-800 hover:text-amber-600 dark:text-neutral-300 dark:hover:text-amber-400"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Direct Booking CTA */}
          <div className="pt-2">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-3 text-center text-xs font-semibold uppercase tracking-widest rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-neutral-950 font-bold shadow-[0_4px_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all font-sans"
            >
              {t("bookAppointment")}
            </Link>
          </div>

          {/* Mobile Client Portal Link */}
          <div className="pt-1">
            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2.5 w-full py-3 text-center text-xs font-semibold uppercase tracking-widest rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-800 dark:text-white transition-all font-sans"
            >
              <UserIcon className="w-4 h-4 text-neutral-800 dark:text-white" />
              <span>{t("clientPortal")}</span>
            </Link>
          </div>

          {/* Mobile Theme Toggle */}
          <div className="pt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {t("appearanceLabel")}
            </span>
            <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setThemePreference("light")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-neutral-800 dark:text-neutral-300 hover:text-amber-500"
              >
                <SunIcon className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setThemePreference("dark")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-neutral-800 dark:text-neutral-300 hover:text-amber-500"
              >
                <MoonIcon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Mobile Language Toggle */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {language === "fil" ? "Wika" : "Language"}
            </span>
            <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  language === "en"
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                    : "text-neutral-800 dark:text-neutral-300 hover:text-amber-500"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fil")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  language === "fil"
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                    : "text-neutral-800 dark:text-neutral-300 hover:text-amber-500"
                }`}
              >
                Filipino
              </button>
            </div>
          </div>

          {/* Mobile Network Status Row */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {language === "fil" ? "Koneksyon" : "Network Status"}
              </span>
              {isOnline && pingLatency !== null && (
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  {pingLatency}ms latency
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={checkMobileConnection}
              disabled={isCheckingConnection}
              title={language === "fil" ? "Pindutin para i-check ang koneksyon" : "Tap to test connection"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                isOnline
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : "text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-semibold"
              }`}
            >
              {isCheckingConnection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isOnline ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span>{isOnline ? "Online" : "Offline"}</span>
            </button>
          </div>

          {/* Mobile Social Links */}
          <div className="pt-3 flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/MCPA.ConstructionandSupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook: MCPA Construction and Supply"
              className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/mcpa.constructionandsupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram: @mcpa.constructionandsupply"
              className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@mcpa.construction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok: @mcpa.construction"
              className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              <TikTokIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
