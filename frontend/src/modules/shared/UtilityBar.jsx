"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  getThemePreference,
  setThemePreference,
} from "./SystemThemeSync";
import { useLanguage } from "./LanguageContext";
import {
  ChevronDownIcon,
  CloseIcon,
  CheckIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "./Icons";
import {
  FileSignature,
  ShieldCheck,
  HardHat,
  ChevronRight,
} from "lucide-react";

export default function UtilityBar({ show = true, scrolledPastHero = false }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { language, setLanguage, t } = useLanguage();

  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("system");
  const [activeThemeMode, setActiveThemeMode] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setCurrentTheme(getThemePreference());
      if (typeof document !== "undefined") {
        setActiveThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    } catch (_) {}
  }, []);

  // Dropdown states
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Modals
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Prevent body scroll and dismiss modals on ESC key
  useEffect(() => {
    if (aboutModalOpen || helpModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setAboutModalOpen(false);
          setHelpModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [aboutModalOpen, helpModalOpen]);

  // Cycling announcement messages from translations
  const announcementList = t("announcements") || [];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!announcementList.length) return;
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % announcementList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcementList.length]);

  // Sync theme with SystemThemeSync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleThemeChange = (e) => {
      if (e?.detail) {
        setCurrentTheme(e.detail.mode || "system");
        setActiveThemeMode(e.detail.isDark ? "dark" : "light");
      }
    };

    window.addEventListener("mcpa-theme-change", handleThemeChange);
    return () => window.removeEventListener("mcpa-theme-change", handleThemeChange);
  }, []);

  // Close dropdowns on click outside
  const utilityRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (utilityRef.current && !utilityRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (mode) => {
    setThemePreference(mode);
    setCurrentTheme(mode);
    setThemeDropdownOpen(false);
  };

  const handleSelectLanguage = (langKey) => {
    setLanguage(langKey);
    setLangDropdownOpen(false);
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setAboutModalOpen(true);
  };

  const handleHelpClick = (e) => {
    e.preventDefault();
    setHelpModalOpen(true);
  };

  if (isDismissed) return null;

  const currentMessage = announcementList[messageIndex] || announcementList[0] || "";

  // Auto-adjust font size and line height on mobile when the announcement is long
  const isVeryLong = currentMessage.length > 70;
  const isLong = currentMessage.length > 50;
  const mobileTextClass = isVeryLong
    ? "text-[9.5px] xs:text-[10px] sm:text-[11px] leading-[1.25] sm:leading-normal"
    : isLong
    ? "text-[10px] xs:text-[10.5px] sm:text-[11px] leading-snug sm:leading-normal"
    : "text-[10.5px] sm:text-[11px] leading-normal";

  return (
    <>
      {/* 1. TOP UTILITY ANNOUNCEMENT BAR */}
      <div
        ref={utilityRef}
        className={`relative z-50 w-full bg-white dark:bg-black text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-sans select-none transition-all duration-500 ease-out shadow-xs ${
          show
            ? "max-h-32 opacity-100 translate-y-0 pointer-events-auto overflow-visible"
            : "max-h-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[32px] sm:h-9 py-1 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Dynamic Announcement Guarantee - auto-adjusts size & wraps on mobile so full text is readable */}
          <div className="flex items-center min-w-0 flex-1 py-0.5">
            <span 
              className={`text-neutral-800 dark:text-neutral-200 font-medium tracking-tight sm:tracking-wide whitespace-normal sm:whitespace-nowrap break-words transition-all duration-300 ${mobileTextClass}`}
              title={currentMessage}
            >
              {currentMessage}
            </span>
          </div>

          {/* Right: Actions, Links & Combobox Dropdowns */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 text-neutral-600 dark:text-neutral-400 self-center">
            {/* About Us */}
            <button
              onClick={handleAboutClick}
              className="hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer hidden md:inline-block whitespace-nowrap font-medium"
            >
              {t("aboutUs")}
            </button>

            {/* Help Center */}
            <button
              onClick={handleHelpClick}
              className="hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer hidden md:inline-block whitespace-nowrap font-medium"
            >
              {t("helpCenter")}
            </button>

            <span className="hidden md:inline-block w-px h-3 bg-neutral-300 dark:bg-neutral-800" />

            {/* 1. LANGUAGE COMBOBOX (Dropdown floating on top / nakapatong) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setThemeDropdownOpen(false);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                aria-label="Select Language"
              >
                <span className="font-semibold text-[11px] tracking-wide">
                  <span className="sm:hidden">{language === "fil" ? "FIL" : "EN"}</span>
                  <span className="hidden sm:inline">{language === "fil" ? "Filipino" : "English"}</span>
                </span>
                <ChevronDownIcon
                  className={`w-3 h-3 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                    langDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 z-[100] text-xs animate-fadeIn"
                >
                  {[
                    { key: "en", label: "English", sub: "EN" },
                    { key: "fil", label: "Filipino", sub: "FIL" },
                  ].map((langItem) => (
                    <button
                      key={langItem.key}
                      onClick={() => handleSelectLanguage(langItem.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                        language === langItem.key
                          ? "text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10"
                          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{langItem.label}</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                          ({langItem.sub})
                        </span>
                      </span>
                      {language === langItem.key && (
                        <CheckIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator before Theme - hidden on mobile */}
            <span className="hidden sm:inline-block w-px h-3 bg-neutral-300 dark:bg-neutral-800" />

            {/* 2. THEME COMBOBOX - hidden on mobile, full dropdown on desktop */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                aria-label="Select Theme Mode"
              >
                <span suppressHydrationWarning className="font-semibold text-[11px] tracking-wide">
                  {currentTheme === "system"
                    ? `${t("theme")} (Auto)`
                    : currentTheme === "dark"
                    ? t("darkTheme")
                    : t("lightTheme")}
                </span>
                <ChevronDownIcon
                  className={`w-3 h-3 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                    themeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {themeDropdownOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1.5 z-[100] text-xs animate-fadeIn"
                >
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    {t("appearance")}
                  </div>

                  {/* Light Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("light")}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      currentTheme === "light"
                        ? "text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SunIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{t("lightTheme")}</span>
                    </div>
                    {currentTheme === "light" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    )}
                  </button>

                  {/* Dark Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("dark")}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      currentTheme === "dark"
                        ? "text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MoonIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>{t("darkTheme")}</span>
                    </div>
                    {currentTheme === "dark" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    )}
                  </button>

                  {/* System Auto Button */}
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("system")}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                      currentTheme === "system"
                        ? "text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MonitorIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{t("systemAuto")}</span>
                    </div>
                    {currentTheme === "system" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Dismiss X Button */}
            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss announcement bar"
              title="Dismiss banner"
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ABOUT US MODAL (Portaled to document.body for true screen centering) */}
      {mounted && aboutModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setAboutModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            className="relative w-full max-w-lg rounded-[8px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.36)] text-neutral-900 dark:text-neutral-100 flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Company Emblem & Close */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02]">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-amber-600 dark:text-amber-400 font-semibold uppercase block mb-1.5">
                  COMPANY PROFILE · GENERAL CONTRACTOR
                </span>
                <div className="relative w-44 sm:w-52 h-8">
                  <Image
                    src="/assets/mcpa-logo.svg"
                    alt="MCPA Construction and Supply"
                    fill
                    unoptimized
                    className="object-contain object-left block dark:hidden"
                    sizes="220px"
                    priority
                  />
                  <Image
                    src="/assets/logo-white.svg"
                    alt="MCPA Construction and Supply"
                    fill
                    unoptimized
                    className="object-contain object-left hidden dark:block"
                    sizes="220px"
                    priority
                  />
                </div>
              </div>

              <button
                onClick={() => setAboutModalOpen(false)}
                className="p-1.5 rounded-[4px] border border-neutral-200 dark:border-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto luxury-scrollbar text-neutral-600 dark:text-neutral-300">
              {/* Bio Narrative */}
              <div>
                <p className="text-xs sm:text-[13px] leading-relaxed font-light text-neutral-700 dark:text-neutral-300">
                  {t("aboutBio")}
                </p>
              </div>

              {/* Official Social Media Channels */}
              <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold mb-2.5">
                  {t("officialSocialChannels")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-800 dark:text-neutral-200 transition-colors text-xs font-medium cursor-pointer group"
                    aria-label="Facebook: MCPA Construction and Supply"
                  >
                    <FacebookIcon className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
                    <span className="font-mono text-[11px]">Facebook</span>
                  </a>

                  <a
                    href="https://www.instagram.com/mcpa.constructionandsupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-800 dark:text-neutral-200 transition-colors text-xs font-medium cursor-pointer group"
                    aria-label="Instagram: @mcpa.constructionandsupply"
                  >
                    <InstagramIcon className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
                    <span className="font-mono text-[11px]">Instagram</span>
                  </a>

                  <a
                    href="https://www.tiktok.com/@mcpa.construction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-800 dark:text-neutral-200 transition-colors text-xs font-medium cursor-pointer group"
                    aria-label="TikTok: @mcpa.construction"
                  >
                    <TikTokIcon className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
                    <span className="font-mono text-[11px]">TikTok</span>
                  </a>
                </div>
              </div>

              {/* Official Legal & Compliance Documentation */}
              <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
                    {t("legalShortcutsTitle")}
                  </p>
                  <span className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 px-2 py-0.5 rounded-[4px]">
                    Art. 1723 · RA 10173
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Terms & 15-Year Warranty */}
                  <Link
                    href="/legal/terms"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FileSignature className="w-4 h-4 text-amber-500" />
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t("termsShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                      {t("termsShortcutDesc")}
                    </span>
                  </Link>

                  {/* Privacy Policy */}
                  <Link
                    href="/legal/privacy"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t("privacyShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                      {t("privacyShortcutDesc")}
                    </span>
                  </Link>

                  {/* Safety Code */}
                  <Link
                    href="/legal/safety"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <HardHat className="w-4 h-4 text-amber-500" />
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t("safetyShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
                      {t("safetyShortcutDesc")}
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pinned Footer Actions */}
            <div className="p-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3">
              <Link
                href="/legal/terms"
                onClick={() => setAboutModalOpen(false)}
                className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 underline underline-offset-4 transition-colors font-medium"
              >
                {t("viewAllLegalDocs")}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAboutModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] border border-neutral-300 dark:border-white/15 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  {language === "fil" ? "Isara" : "Close"}
                </button>
                <Link
                  href="/services"
                  onClick={() => setAboutModalOpen(false)}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs tracking-wide transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>{t("viewAllServices")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. HELP CENTER MODAL (Portaled to document.body for true screen centering) */}
      {mounted && helpModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setHelpModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            className="relative w-full max-w-lg rounded-[8px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.36)] text-neutral-900 dark:text-neutral-100 flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02]">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-amber-600 dark:text-amber-400 font-semibold uppercase block mb-1">
                  CLIENT DESK · BULACAN HEADQUARTERS
                </span>
                <h3 id="help-modal-title" className="font-display text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                  {t("helpTitle")}
                </h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="p-1.5 rounded-[4px] border border-neutral-200 dark:border-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto luxury-scrollbar text-neutral-600 dark:text-neutral-300">
              {/* Contact Rows */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
                  <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {t("headquarters")}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {t("headquartersDesc")}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-[4px] border border-amber-500/20 shrink-0">
                    Central Luzon HQ
                  </span>
                </div>

                <a
                  href="mailto:mcpaconstruction.ph@gmail.com"
                  className="flex items-start gap-3 p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-colors group cursor-pointer"
                >
                  <MailIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t("emailInquiries")}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      mcpaconstruction.ph@gmail.com
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-500 group-hover:text-amber-500 shrink-0 transition-colors">
                    Send Email ↗
                  </span>
                </a>

                <a
                  href="tel:+639171234567"
                  className="flex items-start gap-3 p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-colors group cursor-pointer"
                >
                  <PhoneIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t("phoneSupport")}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                      +63 917 123 4567 / (044) 795 1234
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-500 group-hover:text-amber-500 shrink-0 transition-colors">
                    Call ↗
                  </span>
                </a>
              </div>

              {/* Legal Documentation & Policies Shortcuts */}
              <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
                    {t("legalShortcutsTitle")}
                  </span>
                  <Link
                    href="/legal/terms"
                    onClick={() => setHelpModalOpen(false)}
                    className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 px-2 py-0.5 rounded-[4px] hover:text-amber-500 hover:border-amber-500/30 transition-colors"
                  >
                    CIAP 102 · Art. 1723
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/legal/terms"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] text-center transition-colors group cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4 text-amber-500 mb-1.5" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {language === "fil" ? "Kasunduan" : "Terms"}
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      15-Yr Warranty
                    </span>
                  </Link>

                  <Link
                    href="/legal/privacy"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] text-center transition-colors group cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500 mb-1.5" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Privacy
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      RA 10173
                    </span>
                  </Link>

                  <Link
                    href="/legal/safety"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.02] text-center transition-colors group cursor-pointer"
                  >
                    <HardHat className="w-4 h-4 text-amber-500 mb-1.5" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {language === "fil" ? "Kaligtasan" : "Safety"}
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      DOLE OSH
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pinned Footer Actions */}
            <div className="p-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-white/15 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors cursor-pointer"
              >
                {language === "fil" ? "Isara" : "Close"}
              </button>

              <Link
                href="/book"
                onClick={() => setHelpModalOpen(false)}
                className="px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs tracking-wide transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{t("bookFreeConsultation")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
