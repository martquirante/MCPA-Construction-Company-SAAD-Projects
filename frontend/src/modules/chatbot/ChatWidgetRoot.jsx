"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "../shared/LanguageContext";
import { CHATBOT_TRANSLATIONS } from "./chatbotTranslations";
import { AnimatedChatDotsIcon } from "../shared/Icons";

// Lazy-load the chat panel for zero initial page-load performance overhead
const ChatWidgetPanel = dynamic(() => import("./ChatWidgetPanel"), {
  ssr: false,
});

const STORAGE_KEY = "mcpa_chatbot_session_v1";

export default function ChatWidgetRoot() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = CHATBOT_TRANSLATIONS[language] || CHATBOT_TRANSLATIONS.en;

  const isHome = pathname === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasModalOpen, setHasModalOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(!isHome);

  // 1. Detect active session on mount and from storage events (hydration-safe)
  useEffect(() => {
    const checkActiveSession = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const hasSession = Boolean(parsed?.conversationId && parsed?.sessionToken);
          setHasActiveSession(hasSession);
          setUnreadCount(hasSession ? (parsed?.unreadCount || 1) : 0);
        } else {
          setHasActiveSession(false);
          setUnreadCount(0);
        }
      } catch (_) {}
    };

    checkActiveSession();
    window.addEventListener("storage", checkActiveSession);
    return () => window.removeEventListener("storage", checkActiveSession);
  }, []);

  // 2. Prevent overlapping when full-screen modals are active on page
  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setHasModalOpen(document.body.classList.contains("modal-open"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 3. Hide floating launcher while on the scrollable video hero on the home page
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

  // 4. Hide on administrative or video consultation views
  const isHiddenRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/meet") ||
    pathname?.startsWith("/wrapped") ||
    pathname === "/portal";

  if (isHiddenRoute || hasModalOpen) {
    return null;
  }

  // Detect whether client is on portal view where floating bottom nav is active on mobile (< lg)
  const isPortal = pathname?.startsWith("/portal");
  const showLauncher = !isHome || scrolledPastHero;

  return (
    <aside
      aria-label="Customer Support Widget"
      data-no-translate="true"
      className="print:hidden select-none"
    >
      {/* -------------------------------------------------------------------
          OPEN CHAT PANEL
      -------------------------------------------------------------------- */}
      {isOpen && !isMinimized && (
        <div
          className={`fixed z-[70] transition-all duration-300 ease-out 
            inset-x-0 bottom-0 h-[100dvh] sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[620px] sm:max-h-[calc(100vh-2rem)]
            sm:rounded-[8px] sm:border sm:border-neutral-200 sm:dark:border-white/10
            sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] bg-white dark:bg-[#0c0e12] overflow-hidden`}
        >
          <ChatWidgetPanel
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsMinimized(true)}
            isMinimized={isMinimized}
          />
        </div>
      )}

      {/* -------------------------------------------------------------------
          MINIMIZED BAR / FLOATING LAUNCHER ("Chat With Us")
      -------------------------------------------------------------------- */}
      {(!isOpen || isMinimized) && (
        <div
          className={`fixed z-[60] flex items-center transition-all duration-500 ease-out right-4 sm:right-5 ${
            isPortal
              ? "bottom-[5.25rem] lg:bottom-5"
              : "bottom-5"
          } ${
            showLauncher
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-6 pointer-events-none"
          }`}
        >
          <button
            type="button"
            tabIndex={showLauncher ? 0 : -1}
            aria-hidden={!showLauncher}
            onClick={() => {
              if (!showLauncher) return;
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label={t.launcherTooltip}
            className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-[6px] 
              bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-95 text-neutral-950 font-bold 
              text-xs uppercase tracking-wider font-mono border border-amber-600/40 
              shadow-[0_8px_24px_rgba(245,158,11,0.35)] dark:shadow-[0_8px_24px_rgba(245,158,11,0.2)] 
              transition-all duration-200 cursor-pointer select-none`}
          >
            {/* Animated Message Dots Icon (Directly on amber button, zero background box) */}
            <span className="relative flex items-center justify-center shrink-0 text-neutral-950 group-hover:scale-110 transition-transform duration-200">
              <AnimatedChatDotsIcon className="w-5 h-5 text-neutral-950" />
              {hasActiveSession && (
                <span
                  aria-label="Active conversation"
                  className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black font-mono leading-none flex items-center justify-center border-2 border-amber-500 shadow-xs tabular-nums select-none pointer-events-none"
                >
                  {unreadCount > 9 ? "9+" : unreadCount || 1}
                </span>
              )}
            </span>

            {/* Closed State Text: "Chat With Us" */}
            <span className="font-bold whitespace-nowrap">
              {t.launcherLabel}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
