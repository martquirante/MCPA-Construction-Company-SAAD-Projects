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
import {
  FileSignature,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

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
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  // Network connectivity status
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);

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

  // Network online/offline event listeners
  const checkLiveConnection = async () => {
    setIsCheckingConnection(true);
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("http://localhost:5000/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - start;
      if (res.ok) {
        setIsOnline(true);
        setPingLatency(latency);
      } else {
        setIsOnline(false);
        setPingLatency(null);
      }
    } catch (_) {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setIsOnline(true);
        setPingLatency(Date.now() - start);
      } else {
        setIsOnline(false);
        setPingLatency(null);
      }
    } finally {
      setIsCheckingConnection(false);
      setLastCheckedTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOffline = () => {
      setIsOnline(false);
      setPingLatency(null);
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkLiveConnection();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
        setNetworkDropdownOpen(false);
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
        className={`relative z-50 w-full bg-white dark:bg-black text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-sans select-none transition-all duration-700 ease-out shadow-xs ${
          show
            ? "max-h-10 opacity-100 translate-y-0 pointer-events-auto overflow-visible"
            : "max-h-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 sm:h-9 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Dynamic Announcement Guarantee */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate w-full">
              <span 
                className="text-neutral-800 dark:text-neutral-200 font-medium tracking-wide truncate transition-opacity duration-300 text-[10.5px] sm:text-[11px]"
                title={currentMessage}
              >
                {currentMessage}
              </span>
            </div>
          </div>

          {/* Right: Actions, Links & Combobox Dropdowns */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 text-neutral-600 dark:text-neutral-400">
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

            {/* 0. LIVE NETWORK STATUS BUTTON & POPOVER */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNetworkDropdownOpen(!networkDropdownOpen);
                  setLangDropdownOpen(false);
                  setThemeDropdownOpen(false);
                  if (!networkDropdownOpen && isOnline && pingLatency === null) {
                    checkLiveConnection();
                  }
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer font-medium text-[10.5px] sm:text-[11px] ${
                  isOnline
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25"
                    : "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border border-red-500/35 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                }`}
                aria-label="Network Status Indicator"
                title={isOnline ? t("connectedCloud") : t("disconnectedCloud")}
              >
                {isOnline ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline font-semibold tracking-wide">
                      {t("online")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <WifiOff className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="font-bold tracking-wide">
                      {t("offline")}
                    </span>
                  </>
                )}
              </button>

              {networkDropdownOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3.5 z-[100] text-xs animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                      {isOnline ? (
                        <Wifi className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <span>{t("networkStatus")}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        isOnline
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isOnline ? t("online") : t("offline")}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
                    {isOnline ? t("connectionHealthy") : t("connectionLost")}
                  </p>

                  {isOnline && pingLatency !== null && (
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700/60 mb-3">
                      <span>Server Latency:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {pingLatency} ms
                      </span>
                    </div>
                  )}

                  {lastCheckedTime && (
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
                      Last verified: {lastCheckedTime}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={checkLiveConnection}
                    disabled={isCheckingConnection}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? "animate-spin" : ""}`} />
                    <span>{isCheckingConnection ? t("checkingConnection") : t("testConnection")}</span>
                  </button>
                </div>
              )}
            </div>

            <span className="w-px h-3 bg-neutral-300 dark:bg-neutral-800" />

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
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                aria-label="Select Theme Mode"
              >
                {activeThemeMode === "dark" ? (
                  <MoonIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <SunIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="font-semibold text-[11px] tracking-wide">
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

            {/* Content: Footer Brand Bio */}
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

              {/* Official Legal & Compliance Documentation */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                    {t("legalShortcutsTitle")}
                  </p>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                    Art. 1723 · RA 10173
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Terms & 15-Year Warranty */}
                  <Link
                    href="/legal/terms"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 transition-all hover:scale-[1.02] shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                          <FileSignature className="w-3.5 h-3.5" />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-white block leading-tight">
                        {t("termsShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-tight mt-1">
                      {t("termsShortcutDesc")}
                    </span>
                  </Link>

                  {/* Privacy Policy */}
                  <Link
                    href="/legal/privacy"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 transition-all hover:scale-[1.02] shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-white block leading-tight">
                        {t("privacyShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-tight mt-1">
                      {t("privacyShortcutDesc")}
                    </span>
                  </Link>

                  {/* Safety Code */}
                  <Link
                    href="/legal/safety"
                    onClick={() => setAboutModalOpen(false)}
                    className="group flex flex-col justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 transition-all hover:scale-[1.02] shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                          <HardHat className="w-3.5 h-3.5" />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-white block leading-tight">
                        {t("safetyShortcutTitle")}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-tight mt-1">
                      {t("safetyShortcutDesc")}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800">
                <Link
                  href="/legal/terms"
                  onClick={() => setAboutModalOpen(false)}
                  className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 underline underline-offset-4 transition-colors font-medium"
                >
                  {t("viewAllLegalDocs")}
                </Link>
                <div className="flex items-center gap-2">
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

              {/* Legal Documentation & Policies Shortcuts */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                    {t("legalShortcutsTitle")}
                  </span>
                  <Link
                    href="/legal/terms"
                    onClick={() => setHelpModalOpen(false)}
                    className="text-[10px] text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  >
                    CIAP 102 · Art. 1723
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/legal/terms"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 text-center transition-all group cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {language === "fil" ? "Kasunduan" : "Terms"}
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      15-Yr Warranty
                    </span>
                  </Link>

                  <Link
                    href="/legal/privacy"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 text-center transition-all group cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      Privacy
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      RA 10173
                    </span>
                  </Link>

                  <Link
                    href="/legal/safety"
                    onClick={() => setHelpModalOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-amber-500/5 text-center transition-all group cursor-pointer"
                  >
                    <HardHat className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {language === "fil" ? "Kaligtasan" : "Safety"}
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                      DOLE OSH
                    </span>
                  </Link>
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
