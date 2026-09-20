"use client";

import { useState, useEffect, useRef } from "react";
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

export default function UtilityBar({ show = true, scrolledPastHero = false }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { language, setLanguage, t } = useLanguage();

  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("system");
  const [activeThemeMode, setActiveThemeMode] = useState("dark"); // actual rendered mode: "dark" or "light"

  // Dropdown states
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Modals
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

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

    const pref = getThemePreference();
    setCurrentTheme(pref);
    setActiveThemeMode(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );

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

  return (
    <>
      {/* 1. TOP UTILITY ANNOUNCEMENT BAR */}
      <div
        ref={utilityRef}
        className={`w-full bg-[#1c1c1e] text-neutral-300 border-b border-white/10 text-[11px] font-sans select-none z-50 transition-all duration-700 ease-out overflow-visible ${
          show
            ? "max-h-10 opacity-100 translate-y-0 pointer-events-auto"
            : "max-h-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 sm:h-9 flex items-center justify-between gap-4">
          {/* Left: Dynamic Announcement Guarantee (No dot, clean typography) */}
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-200 font-medium tracking-wide truncate transition-opacity duration-300">
                {currentMessage}
              </span>
            </div>
          </div>

          {/* Right: Actions, Links & Theme Switcher */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-neutral-400">
            {/* About Us */}
            <button
              onClick={handleAboutClick}
              className="hover:text-white transition-colors cursor-pointer hidden md:inline-block whitespace-nowrap"
            >
              {t("aboutUs")}
            </button>

            {/* Help Center */}
            <button
              onClick={handleHelpClick}
              className="hover:text-white transition-colors cursor-pointer hidden md:inline-block whitespace-nowrap"
            >
              {t("helpCenter")}
            </button>

            <span className="hidden md:inline-block w-px h-3 bg-white/15" />

            {/* Language Dropdown (Fully Functional) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setThemeDropdownOpen(false);
                }}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-1"
                aria-label="Select Language"
              >
                <span className="font-medium text-neutral-200">
                  {language === "fil" ? "Filipino" : "English"}
                </span>
                <ChevronDownIcon className="w-3 h-3 opacity-70" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-2xl py-1 z-50 text-xs backdrop-blur-xl animate-fadeIn">
                  {[
                    { key: "en", label: "English", sub: "English" },
                    { key: "fil", label: "Filipino", sub: "Tagalog" },
                  ].map((langItem) => (
                    <button
                      key={langItem.key}
                      onClick={() => handleSelectLanguage(langItem.key)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                        language === langItem.key
                          ? "text-amber-400 font-semibold bg-white/5"
                          : "text-neutral-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span>
                        {langItem.label}{" "}
                        <span className="text-[10px] text-neutral-500">
                          ({langItem.sub})
                        </span>
                      </span>
                      {language === langItem.key && (
                        <CheckIcon className="w-3 h-3 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="w-px h-3 bg-white/15" />

            {/* 2. THEME DROPDOWN & BUTTONS (With Lucide SVG API Icons, NO EMOJIS) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
                aria-label="Select Theme Mode"
              >
                <span className="font-medium text-neutral-200">{t("theme")}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  {currentTheme === "system"
                    ? activeThemeMode
                    : currentTheme}
                </span>
                <ChevronDownIcon className="w-3 h-3 opacity-70" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-neutral-900/95 border border-neutral-700/90 shadow-2xl py-1.5 z-50 text-xs backdrop-blur-xl animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500 border-b border-white/5 mb-1">
                    {t("appearance")}
                  </div>

                  {/* Light Theme Button (SVG Icon, No Emoji) */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("light")}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      currentTheme === "light"
                        ? "text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SunIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t("lightTheme")}</span>
                    </div>
                    {currentTheme === "light" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>

                  {/* Dark Theme Button (SVG Icon, No Emoji) */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("dark")}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      currentTheme === "dark"
                        ? "text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MoonIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t("darkTheme")}</span>
                    </div>
                    {currentTheme === "dark" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>

                  {/* System Auto Button (SVG Icon, No Emoji) */}
                  <div className="my-1 border-t border-white/10" />
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("system")}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                      currentTheme === "system"
                        ? "text-amber-400 font-bold bg-amber-500/10"
                        : "text-neutral-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MonitorIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{t("systemAuto")}</span>
                    </div>
                    {currentTheme === "system" && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-400" />
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
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ABOUT US MODAL */}
      {aboutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAboutModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-2xl text-neutral-900 dark:text-neutral-100 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Logo and Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-5">
              <div className="relative w-44 sm:w-52 h-10">
                <Image
                  src="/assets/mcpa-logo.png"
                  alt="MCPA Construction and Supply"
                  fill
                  className="object-contain object-left block dark:hidden"
                  sizes="220px"
                  priority
                />
                <Image
                  src="/assets/logo-white.png"
                  alt="MCPA Construction and Supply"
                  fill
                  className="object-contain object-left hidden dark:block"
                  sizes="220px"
                  priority
                />
              </div>
              <button
                onClick={() => setAboutModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Footer Brand Bio (No 5-Year Warranty) */}
            <div className="space-y-5 text-neutral-600 dark:text-neutral-300">
              <p className="text-xs sm:text-sm leading-relaxed font-light">
                {t("aboutBio")}
              </p>

              {/* Official Social Media Channels */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold mb-3">
                  {t("officialSocialChannels")}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-blue-500/60 hover:bg-blue-500/10 text-neutral-800 dark:text-white transition-all duration-300 hover:scale-105 shadow-xs text-xs font-medium cursor-pointer"
                    aria-label="Facebook: MCPA Construction and Supply"
                    title="Facebook: MCPA Construction and Supply"
                  >
                    <FacebookIcon className="w-5 h-5 rounded-full" />
                    <span>Facebook</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/mcpa.constructionandsupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-pink-500/60 hover:bg-pink-500/10 text-neutral-800 dark:text-white transition-all duration-300 hover:scale-105 shadow-xs text-xs font-medium cursor-pointer"
                    aria-label="Instagram: @mcpa.constructionandsupply"
                    title="Instagram: @mcpa.constructionandsupply"
                  >
                    <InstagramIcon className="w-5 h-5 rounded-md" />
                    <span>Instagram</span>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://www.tiktok.com/@mcpa.construction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-neutral-400 hover:bg-white/10 text-neutral-800 dark:text-white transition-all duration-300 hover:scale-105 shadow-xs text-xs font-medium cursor-pointer"
                    aria-label="TikTok: @mcpa.construction"
                    title="TikTok: @mcpa.construction"
                  >
                    <TikTokIcon className="w-5 h-5" />
                    <span>TikTok</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAboutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  {language === "fil" ? "Isara" : "Close"}
                </button>
                <Link
                  href="/services"
                  onClick={() => setAboutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  {t("viewAllServices")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. HELP CENTER MODAL */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-5">
              <h3 className="text-base font-bold">{t("helpTitle")}</h3>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">
                    {t("headquarters")}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs">
                    {t("headquartersDesc")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <MailIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">
                    {t("emailInquiries")}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs">
                    mcpaconstruction.ph@gmail.com
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <PhoneIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">
                    {t("phoneSupport")}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs">
                    +63 917 123 4567 / (044) 795 1234
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/book"
                  onClick={() => setHelpModalOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  {t("bookFreeConsultation")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
