"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../shared/LanguageContext";
import { CHATBOT_TRANSLATIONS } from "./chatbotTranslations";

// Lazy-load the chat panel for zero initial page-load performance overhead
const ChatWidgetPanel = dynamic(() => import("./ChatWidgetPanel"), {
  ssr: false,
});

const STORAGE_KEY = "mcpa_chatbot_session_v1";

export default function ChatWidgetRoot() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = CHATBOT_TRANSLATIONS[language] || CHATBOT_TRANSLATIONS.en;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasModalOpen, setHasModalOpen] = useState(false);

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

  // 3. Hide on administrative or video consultation views
  const isHiddenRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/meet") ||
    pathname?.startsWith("/wrapped");

  if (isHiddenRoute || hasModalOpen) {
    return null;
  }

  // Detect whether client is on portal view where floating bottom nav is active on mobile (< lg)
  const isPortal = pathname?.startsWith("/portal");

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
          className={`fixed z-[60] flex items-center transition-all duration-300 ease-out right-4 sm:right-5 ${
            isPortal
              ? "bottom-[5.25rem] lg:bottom-5"
              : "bottom-5"
          }`}
        >
          <button
            type="button"
            onClick={() => {
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
            {/* MCPA company logo */}
            <span className="relative flex items-center justify-center w-6 h-6 text-neutral-950 shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Image
                src="/assets/mcpa-logo.svg"
                alt=""
                width={28}
                height={10}
                className="w-6 h-auto object-contain"
              />
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

            {/* Subtle Chevron indicator */}
            <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}
    </aside>
  );
}
