"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building,
  CreditCard,
  Menu,
  Image as GalleryIcon,
  MessageSquare,
  User,
} from "lucide-react";

/**
 * AnimatedTabIcon
 * Renders tab-specific animated micro-icons that trigger only when switching tabs.
 * Does not replace the icon with a checkmark - animates the actual tab icon itself.
 */
function AnimatedTabIcon({ tabId, isActive, isJustSwitched, className = "" }) {
  // 1. Dashboard Tab Micro-Animation
  if (tabId === "overview") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-pop" : ""
        }`}
      >
        <LayoutDashboard
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "rotate-6 scale-110" : ""
          }`}
        />
        {/* Optical radiant halo burst only on tab switch */}
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // 2. Construction / Projects Tab Micro-Animation
  if (tabId === "construction") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-lift origin-bottom" : ""
        }`}
      >
        <Building
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "scale-110 -translate-y-0.5" : ""
          }`}
        />
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // 3. Billing Tab Micro-Animation
  if (tabId === "billing") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-tilt" : ""
        }`}
      >
        <CreditCard
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "scale-110 -rotate-12" : ""
          }`}
        />
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // 4. Gallery Tab Micro-Animation (when extended active)
  if (tabId === "gallery") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-snap" : ""
        }`}
      >
        <GalleryIcon
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "scale-110 rotate-12" : ""
          }`}
        />
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // 5. Inquiries Tab Micro-Animation (when extended active)
  if (tabId === "inquiries") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-pop" : ""
        }`}
      >
        <MessageSquare
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "scale-110" : ""
          }`}
        />
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // 6. Profile Tab Micro-Animation (when extended active)
  if (tabId === "profile") {
    return (
      <div
        className={`relative flex items-center justify-center ${
          isJustSwitched ? "animate-tab-lift origin-bottom" : ""
        }`}
      >
        <User
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
            isJustSwitched ? "scale-110" : ""
          }`}
        />
        {isJustSwitched && (
          <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // Default / More Menu (Hamburger)
  return (
    <div
      className={`relative flex items-center justify-center ${
        isJustSwitched ? "animate-tab-spin" : ""
      }`}
    >
      <Menu
        className={`w-4 h-4 shrink-0 transition-all duration-300 ${className} ${
          isJustSwitched ? "scale-110 rotate-90" : ""
        }`}
      />
      {isJustSwitched && (
        <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-tab-ping pointer-events-none" />
      )}
    </div>
  );
}

/**
 * PortalMobileBottomNav
 * Executive Glassmorphic Mobile & Tablet Bottom Navigation Bar (80% opacity glass UI).
 * Features 3 primary navigation buttons + 1 Hamburger "More" button.
 * Inactive tabs display only icons; active tabs expand with a magnifying glass lens
 * and reveal their text label alongside a tab-specific micro-animation that runs ONLY on tab change.
 */
export default function PortalMobileBottomNav({
  activeTab = "overview",
  onTabChange,
  onOpenMenu,
  unreadCount = 0,
}) {
  const [animatingTab, setAnimatingTab] = useState(null);

  // 3 Primary Navigation Tabs
  const primaryTabs = [
    { id: "overview", label: "Dashboard" },
    { id: "construction", label: "Projects" },
    { id: "billing", label: "Billing" },
  ];

  // Secondary tab config when accessed through the sidebar drawer
  const secondaryTabsConfig = {
    gallery: { label: "Gallery", id: "gallery" },
    inquiries: { label: "Inquiries", id: "inquiries" },
    profile: { label: "Profile", id: "profile" },
  };

  const isExtendedActive = !primaryTabs.some((t) => t.id === activeTab);
  const currentSecondary = secondaryTabsConfig[activeTab];
  const extendedLabel = currentSecondary?.label || "More";
  const extendedTabId = currentSecondary?.id || "menu";

  // Trigger animation ONLY when activeTab changes
  useEffect(() => {
    setAnimatingTab(activeTab);
    const timer = setTimeout(() => {
      setAnimatingTab(null);
    }, 850);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleSelectTab = (tabId) => {
    if (onTabChange) onTabChange(tabId);
  };

  return (
    <>
      {/* Keyframe styles for one-shot micro-animations */}
      <style jsx global>{`
        @keyframes tabPopSpring {
          0% { transform: scale(0.65) rotate(-10deg); }
          50% { transform: scale(1.28) rotate(6deg); }
          75% { transform: scale(0.92) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes tabLiftSpring {
          0% { transform: scaleY(0.6) translateY(3px); }
          50% { transform: scaleY(1.25) translateY(-2px); }
          75% { transform: scaleY(0.95) translateY(0); }
          100% { transform: scaleY(1) translateY(0); }
        }
        @keyframes tabTiltSpring {
          0% { transform: rotate(-24deg) scale(0.7); }
          50% { transform: rotate(12deg) scale(1.25); }
          75% { transform: rotate(-4deg) scale(0.95); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes tabSnapSpring {
          0% { transform: scale(0.6) rotate(-25deg); }
          50% { transform: scale(1.3) rotate(15deg); }
          75% { transform: scale(0.95) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes tabSpinSpring {
          0% { transform: rotate(-90deg) scale(0.7); }
          60% { transform: rotate(15deg) scale(1.2); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes tabPingBurst {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .animate-tab-pop {
          animation: tabPopSpring 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-tab-lift {
          animation: tabLiftSpring 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-tab-tilt {
          animation: tabTiltSpring 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-tab-snap {
          animation: tabSnapSpring 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-tab-spin {
          animation: tabSpinSpring 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-tab-ping {
          animation: tabPingBurst 0.6s ease-out forwards;
        }
      `}</style>

      <div className="fixed bottom-4 left-3 right-3 z-40 lg:hidden flex justify-center pointer-events-none select-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto w-full max-w-sm sm:max-w-md rounded-full bg-white/80 dark:bg-[#101218]/80 backdrop-blur-2xl border border-neutral-300/80 dark:border-white/15 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] flex items-center justify-between gap-1 transition-all duration-300"
        >
          {/* 3 Primary Navigation Buttons */}
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isJustSwitched = animatingTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                  isActive
                    ? "flex-1 py-2 px-3.5 rounded-full overflow-hidden bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/50 dark:border-amber-400/60 shadow-[0_4px_18px_rgba(245,158,11,0.28),inset_0_1px_2px_rgba(255,255,255,0.5)] scale-105"
                    : "p-2.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                title={tab.label}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Convex Optical Lens Specular Reflection (Magnifying Glass effect) */}
                {isActive && (
                  <>
                    <div className="absolute inset-x-2.5 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/55 via-white/10 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-3 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
                  </>
                )}

                <div className="relative flex items-center gap-2">
                  <AnimatedTabIcon
                    tabId={tab.id}
                    isActive={isActive}
                    isJustSwitched={isJustSwitched}
                    className={
                      isActive
                        ? "text-amber-600 dark:text-amber-400 stroke-[2.5]"
                        : "stroke-[1.8]"
                    }
                  />

                  {/* Text Label: ONLY shown when selected */}
                  {isActive && (
                    <span className="text-xs font-mono font-bold tracking-tight text-amber-700 dark:text-amber-300 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                      {tab.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* 4th Button: Hamburger Menu / More Icon (or active extended tab) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMenu) onOpenMenu();
            }}
            className={`relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
              isExtendedActive
                ? "flex-1 py-2 px-3.5 rounded-full overflow-hidden bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/50 dark:border-amber-400/60 shadow-[0_4px_18px_rgba(245,158,11,0.28),inset_0_1px_2px_rgba(255,255,255,0.5)] scale-105"
                : "p-2.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            title="Open Full Menu & More Tabs"
            aria-label="Open Sidebar Menu"
          >
            {/* Convex Optical Lens Specular Reflection (when extended tab is open) */}
            {isExtendedActive && (
              <>
                <div className="absolute inset-x-2.5 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/55 via-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-x-3 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
              </>
            )}

            <div className="relative flex items-center gap-2">
              <AnimatedTabIcon
                tabId={extendedTabId}
                isActive={isExtendedActive}
                isJustSwitched={animatingTab === activeTab && isExtendedActive}
                className={
                  isExtendedActive
                    ? "text-amber-600 dark:text-amber-400 stroke-[2.5]"
                    : "stroke-[1.8]"
                }
              />

              {/* Unread dot notification */}
              {unreadCount > 0 && !isExtendedActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#101218] animate-pulse" />
              )}

              {/* Text Label: Shows name of extended tab (e.g. Gallery, Profile) if active */}
              {isExtendedActive && (
                <span className="text-xs font-mono font-bold tracking-tight text-amber-700 dark:text-amber-300 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                  {extendedLabel}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>
    </>
  );
}

