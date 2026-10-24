"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  Calendar,
  Clock,
  CalendarCheck,
  FileText,
  CreditCard,
  Sparkles,
  CheckCheck,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  Video,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

/**
 * Safely parses any timestamp into a valid millisecond number.
 * Handles ISO strings, numeric timestamps, and PostgreSQL timestamps ("YYYY-MM-DD HH:MM:SS.ms+TZ").
 */
function parseSafeTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp instanceof Date && !isNaN(timestamp.getTime())) return timestamp.getTime();
  if (typeof timestamp === "number" && !isNaN(timestamp)) return timestamp;
  if (typeof timestamp === "string") {
    let cleaned = timestamp.trim();
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(cleaned)) {
      cleaned = cleaned.replace(" ", "T").replace(/\+(\d{2})$/, "+$1:00");
    }
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.getTime();
    const fallback = new Date(timestamp);
    if (!isNaN(fallback.getTime())) return fallback.getTime();
  }
  return null;
}

/**
 * Formats relative time friendly for humans (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
function formatRelativeTime(timestamp) {
  const time = parseSafeTimestamp(timestamp);
  if (!time) return "Active";
  const now = Date.now();
  const diffMs = now - time;
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(time).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNotificationDate(timestamp) {
  const time = parseSafeTimestamp(timestamp);
  if (!time) return "Active Notification";

  return new Date(time).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Extracts initials for client fallback avatar
 */
function getClientInitials(name) {
  if (!name) return "CL";
  const cleaned = name.replace(/^(engr\.|engineer|architect|arch\.|mr\.|ms\.|mrs\.|dr\.)\s*/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0] || "C").slice(0, 2).toUpperCase();
}

/**
 * Resilient Client Avatar Component
 * Ensures Google profile photos load without referrer blocking,
 * and falls back gracefully to high-contrast initials if network/PFP fails.
 */
function NotificationAvatar({ avatarUrl, name, sizeClasses = "w-10 h-10", textClasses = "text-xs" }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const initials = getClientInitials(name);

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700 bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-2xs shrink-0 select-none`}
    >
      {avatarUrl && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name || "Client"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={`${textClasses} font-bold font-mono tracking-tight`}>
          {initials}
        </span>
      )}
    </div>
  );
}

/**
 * Category styling configurations
 */
const CATEGORY_CONFIG = {
  reschedule: {
    label: "Reschedule Request",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  meeting: {
    label: "Meeting",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CalendarCheck,
  },
  inquiry: {
    label: "Inquiry",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: ClipboardList,
  },
  document: {
    label: "Document",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    icon: FileText,
  },
  quotation: {
    label: "Quotation",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: CreditCard,
  },
  contract: {
    label: "Contract",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Sparkles,
  },
  billing: {
    label: "Billing Payment",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CreditCard,
  },
  delay: {
    label: "Site Delay",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: AlertCircle,
  },
  call: {
    label: "Live Consultation",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: Video,
  },
};

export default function AdminNotificationCenter({
  isOpen,
  onClose,
  notifications = [],
  onSelectNotification = () => {},
  onMarkAllAsRead = () => {},
  onMarkAsRead = () => {},
}) {
  const [, setTimeNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setTimeNow(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const [activeCategory, setActiveCategory] = useState("all");
  const panelRef = useRef(null);

  // Close on outside click (Desktop popover)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Only trigger if click wasn't on notification bell button itself
        const bellBtn = document.getElementById("admin-notification-bell-btn");
        if (bellBtn && bellBtn.contains(e.target)) return;
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock body scroll on mobile bottom sheet when open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Category options for the custom Combo Box
  const filterOptions = [
    {
      id: "all",
      label: "All Notifications",
      icon: Bell,
      description: "All client transactions & live alerts",
    },
    {
      id: "meetings",
      label: "Meetings & Consultations",
      icon: CalendarCheck,
      description: "Booked sessions, video calls & reschedules",
    },
    {
      id: "inquiries",
      label: "Project Inquiries",
      icon: ClipboardList,
      description: "Briefs, leads & client proposals",
    },
    {
      id: "documents",
      label: "Client Documents",
      icon: FileText,
      description: "Uploaded setbacks, titles & survey plans",
    },
    {
      id: "financials",
      label: "Finance & Contracts",
      icon: CreditCard,
      description: "Milestone payments, quotes & contracts",
    },
  ];

  // Category notification counts for the combo box badges
  const categoryCounts = useMemo(() => {
    return {
      all: notifications.length,
      meetings: notifications.filter((n) => n.category === "meeting" || n.category === "reschedule" || n.category === "call").length,
      inquiries: notifications.filter((n) => n.category === "inquiry").length,
      documents: notifications.filter((n) => n.category === "document").length,
      financials: notifications.filter((n) => n.category === "quotation" || n.category === "contract" || n.category === "billing").length,
    };
  }, [notifications]);

  // Combo box open state & ref for click outside
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef(null);

  useEffect(() => {
    if (!isComboboxOpen) return;
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setIsComboboxOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsComboboxOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isComboboxOpen]);

  const selectedCategoryObj = filterOptions.find((o) => o.id === activeCategory) || filterOptions[0];
  const SelectedCategoryIcon = selectedCategoryObj.icon;

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return notifications;
    if (activeCategory === "meetings") {
      return notifications.filter((n) => n.category === "meeting" || n.category === "reschedule" || n.category === "call");
    }
    if (activeCategory === "inquiries") {
      return notifications.filter((n) => n.category === "inquiry");
    }
    if (activeCategory === "documents") {
      return notifications.filter((n) => n.category === "document");
    }
    if (activeCategory === "financials") {
      return notifications.filter(
        (n) => n.category === "quotation" || n.category === "contract" || n.category === "billing"
      );
    }
    return notifications;
  }, [notifications, activeCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
      />

      {/* Responsive Container: Bottom Sheet on Mobile, Floating Popover on Tablet & Desktop */}
      <div
        ref={panelRef}
        role="region"
        aria-label="Admin Notifications Center"
        className={`fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:absolute md:right-0 md:top-full md:mt-2.5 z-[10000] w-full md:w-[430px] max-w-full md:max-w-[calc(100vw-32px)] overflow-hidden rounded-t-3xl md:rounded-2xl bg-white/98 dark:bg-[#111317]/98 text-neutral-900 dark:text-neutral-100 border-t md:border border-neutral-200/90 dark:border-neutral-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22),0_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.8),0_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-xl flex flex-col max-h-[85vh] md:max-h-[620px] transition-all animate-in slide-in-from-bottom-6 md:slide-in-from-top-3 duration-200`}
      >


        {/* Mobile Pull / Drag Indicator */}
        <div className="md:hidden pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header Bar */}
        <div className="p-4 sm:p-4.5 pb-3 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold tabular-nums">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer active:scale-95"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                  <span>Mark all read</span>
                </button>
              )}

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors md:hidden cursor-pointer"
                aria-label="Close Notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Combo Box (Elevated, Human-Crafted UX) */}
          <div className="relative mt-3" ref={comboboxRef}>
            <button
              type="button"
              onClick={() => setIsComboboxOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                isComboboxOpen
                  ? "bg-neutral-100 dark:bg-neutral-800/90 border-amber-500/60 text-neutral-900 dark:text-white ring-2 ring-amber-500/15 shadow-sm"
                  : "bg-neutral-100/80 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200"
              }`}
              aria-haspopup="listbox"
              aria-expanded={isComboboxOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <SelectedCategoryIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-neutral-900 dark:text-white truncate">
                  {selectedCategoryObj.label}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] font-bold shrink-0">
                  {categoryCounts[activeCategory] || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-neutral-400 dark:text-neutral-500">
                <span className="text-[11px] font-normal hidden sm:inline">Filter</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isComboboxOpen ? "rotate-180 text-amber-500" : ""
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isComboboxOpen && (
              <div
                role="listbox"
                className="absolute top-full left-0 right-0 mt-1.5 z-50 p-1.5 rounded-xl bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 shadow-[0_16px_38px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
              >
                {filterOptions.map((opt) => {
                  const isSelected = activeCategory === opt.id;
                  const OptIcon = opt.icon;
                  const count = categoryCounts[opt.id] || 0;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setActiveCategory(opt.id);
                        setIsComboboxOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1 rounded-md shrink-0 ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900 dark:text-white">
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] tabular-nums ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium"
                          }`}
                        >
                          {count}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                <BellOff className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white pt-1">
                All caught up
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                No unread alerts or pending transactions in this category. New client requests and schedule updates will appear here in real-time.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const cfg = CATEGORY_CONFIG[notif.category] || CATEGORY_CONFIG.inquiry;
              const IconComponent = cfg.icon;
              const isUnread = !notif.isRead;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onSelectNotification(notif);
                  }}
                  role="button"
                  tabIndex={0}
                  className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer text-left select-none group relative ${
                    isUnread
                      ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.05] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.09]"
                      : "hover:bg-neutral-50/90 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  {/* Left Status Avatar / Stage Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    <NotificationAvatar
                      avatarUrl={notif.clientAvatar}
                      name={notif.clientName}
                      sizeClasses="w-10 h-10"
                      textClasses="text-xs"
                    />
                    {/* Badge Category Icon Overlay */}
                    <span
                      className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border shadow-2xs bg-white dark:bg-[#111317] ${cfg.badgeClass}`}
                    >
                      <IconComponent className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[10px] font-semibold font-mono tracking-tight uppercase ${cfg.badgeClass.replace(/bg-[^\s]+/g, "").replace(/border-[^\s]+/g, "")}`}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums whitespace-nowrap"
                        title={formatNotificationDate(notif.timestamp)}
                      >
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 leading-snug tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {notif.title}
                    </h3>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.description}
                    </p>

                    {/* Metadata Pill & Action Tag */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-neutral-100/80 dark:border-neutral-800/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 truncate">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                          {notif.clientName || "Valued Client"}
                        </span>
                        {notif.projectCode && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-700">•</span>
                            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                              {notif.projectCode}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="shrink-0 flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform text-[11px]">
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Unread Accent Indicator */}
                  {isUnread && (
                    <span
                      aria-label="Unread notification"
                      className="w-2 h-2 rounded-full bg-amber-500 shrink-0 self-center"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Quick Shortcuts */}
        <div className="p-3 bg-neutral-50/90 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
            {notifications.length} total alerts recorded
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectNotification({ targetTab: "briefs" });
            }}
            className="text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Inquiries</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
          </button>
        </div>
      </div>
    </>
  );
}
