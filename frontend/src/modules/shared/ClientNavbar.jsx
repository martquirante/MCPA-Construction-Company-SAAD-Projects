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
import UtilityBar from "./UtilityBar";
import { getThemePreference, setThemePreference } from "./SystemThemeSync";
import { useLanguage } from "./LanguageContext";
import { setReturnToCompletedHome } from "@/modules/home/homeState";

export default function ClientNavbar({ isCompleted = false } = {}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(!isHome);
  const [announcementState, setAnnouncementState] = useState({ route: pathname, dismissed: false });
  const announcementDismissed = announcementState.route === pathname && announcementState.dismissed;

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

  useEffect(() => {
    if (!isCompleted) return undefined;

    let hideAnnouncement;
    const listenerTimer = window.setTimeout(() => {
      let lastScrollY = window.scrollY;
      hideAnnouncement = () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        if (Math.abs(scrollDelta) < 28) return;

        if (scrollDelta > 0) {
          setAnnouncementState({ route: pathname, dismissed: true });
        } else {
          setAnnouncementState({ route: pathname, dismissed: false });
        }
        lastScrollY = currentScrollY;
      };
      window.addEventListener("scroll", hideAnnouncement, { passive: true });
    }, 700);

    return () => {
      window.clearTimeout(listenerTimer);
      if (hideAnnouncement) window.removeEventListener("scroll", hideAnnouncement);
    };
  }, [isCompleted, pathname]);

  const navLinks = [
    { label: t("navHome"), href: "/", active: pathname === "/" },
    { label: t("navProjects"), href: "/projects", active: pathname === "/projects" },
    { label: t("navServices"), href: "/services", active: pathname === "/services" },
    { label: t("navProcess"), href: "/process", active: pathname === "/process" },
  ];

  const handleNavClick = (e, href) => {
    if (href === "/") {
      if (typeof window !== "undefined") {
        if (window.location.pathname === "/") {
          e.preventDefault();
          const vh = window.innerHeight;
          window.scrollTo({ top: 3 * vh, behavior: "smooth" });
          window.history.replaceState(null, "", "/");
        } else {
          setReturnToCompletedHome(true);
        }
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

  // Headings appear when the build reaches completion (Step 3 / "if nadito dyan sya"), scrolled past hero, or on subpages
  const showHeadings = !isHome || isCompleted || scrolledPastHero;

  // "Book an Appointment" in the navbar heading is removed when on the completed hero screen
  // (because the hero overlay already prominently presents the center "Book an Appointment" CTA)
  const showHeaderBooking = (!isHome || !isCompleted || scrolledPastHero) && pathname !== "/book";

  // Client Portal link/icon is returned when on completed hero screen ("pagdating rito"), when scrolled past hero, or on subpages
  const showClientPortal = !isHome || isCompleted || scrolledPastHero;

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 transition-all duration-700 select-none">
        {/* Top Utility Announcement Bar (ShopRave Inspired) */}
        <UtilityBar
          show={isHome && isCompleted && !announcementDismissed}
          scrolledPastHero={scrolledPastHero}
        />

        {/* Main Header / Navigation Bar */}
        <header
          className={`w-full transition-all duration-700 ease-out ${
            scrolledPastHero
              ? "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/40 dark:border-white/10 py-3 shadow-xs text-neutral-900 dark:text-white"
              : "bg-transparent py-4"
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
              <div className="relative w-36 sm:w-44 md:w-52 h-10 transition-transform duration-300 group-hover:scale-105">
                {scrolledPastHero ? (
                  <>
                    <Image
                      src="/assets/mcpa-logo.png"
                      alt="MCPA Construction and Supply"
                      fill
                      priority
                      className="object-contain object-left block dark:hidden"
                      sizes="(max-width: 768px) 180px, 220px"
                    />
                    <Image
                      src="/assets/logo-white.png"
                      alt="MCPA Construction and Supply"
                      fill
                      priority
                      className="object-contain object-left hidden dark:block"
                      sizes="(max-width: 768px) 180px, 220px"
                    />
                  </>
                ) : (
                  <Image
                    src="/assets/logo-white.png"
                    alt="MCPA Construction and Supply"
                    fill
                    priority
                    className="object-contain object-left"
                    sizes="(max-width: 768px) 180px, 220px"
                  />
                )}
              </div>
            </Link>
          </div>

          {/* 2. CENTER NAVIGATION LINKS - Column 2 (Perfect horizontal & vertical center) */}
          <nav
            aria-label="Primary Navigation"
            className={`hidden md:flex items-center justify-center gap-8 transition-all duration-700 ease-out ${
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
                className={`relative py-1.5 px-0.5 text-sm font-medium tracking-wide transition-colors duration-200 select-none flex flex-col items-center justify-center ${
                  scrolledPastHero
                    ? link.active
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-neutral-600 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400"
                    : link.active
                    ? "text-amber-400 font-semibold drop-shadow-sm"
                    : "text-neutral-300 hover:text-white drop-shadow-sm"
                }`}
              >
                <span>{link.label}</span>
                {link.active && (
                  <span className={`absolute bottom-0 inset-x-0 h-0.5 rounded-full ${
                    scrolledPastHero ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" : "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                  }`} />
                )}
              </Link>
            ))}
          </nav>

          {/* 3. RIGHT UTILITY ACTIONS - Column 3 (Right-aligned) */}
          <div className="flex items-center justify-end gap-3">
            {/* Book an Appointment CTA button: Hidden on completed hero screen to eliminate duplicate with center CTA; hidden on small mobile screens to prevent collisions */}
            {showHeaderBooking && (
              <Link
                href="/book"
                className={`hidden sm:inline-flex px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 select-none whitespace-nowrap ${
                  scrolledPastHero
                    ? "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-neutral-950 font-bold shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                } hover:scale-105 active:scale-95`}
              >
                {t("bookAppointment")}
              </Link>
            )}

            {/* Client Portal Link Button: Restored to heading */}
            {showClientPortal && (
              <Link
                href="/portal"
                aria-label="Client Account Portal"
                title="Client Portal & Project Tracker"
                className={`p-2.5 rounded-full transition-all duration-200 focus:outline-none flex items-center justify-center border select-none ${
                  scrolledPastHero
                    ? "border-neutral-200/80 dark:border-white/10 text-neutral-800 hover:text-amber-600 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:text-amber-400 dark:hover:bg-white/10 shadow-xs"
                    : "border-white/20 bg-black/30 backdrop-blur-sm text-white hover:text-amber-400 hover:bg-black/50 hover:border-white/40"
                }`}
              >
                <UserIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                scrolledPastHero
                  ? "text-neutral-800 hover:text-amber-600 hover:bg-neutral-100 dark:text-white dark:hover:text-amber-400 dark:hover:bg-white/10"
                  : "text-white hover:text-amber-400 hover:bg-white/10"
              }`}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
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

          {/* Mobile Social Links */}
          <div className="pt-3 flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/MCPA.ConstructionandSupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook: MCPA Construction and Supply"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-blue-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <FacebookIcon className="w-4 h-4 rounded-full" />
            </a>
            <a
              href="https://www.instagram.com/mcpa.constructionandsupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram: @mcpa.constructionandsupply"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-pink-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <InstagramIcon className="w-4 h-4 rounded-md" />
            </a>
            <a
              href="https://www.tiktok.com/@mcpa.construction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok: @mcpa.construction"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-cyan-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <TikTokIcon className="w-4 h-4 rounded-full" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
