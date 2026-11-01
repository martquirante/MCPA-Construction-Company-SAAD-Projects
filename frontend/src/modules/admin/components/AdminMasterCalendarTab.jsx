"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Layers,
  Video,
  MapPin,
  HardHat,
  Flame,
  Award,
  CreditCard,
  Gift,
  Sparkles,
  Flag,
  Landmark,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  Users,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";
import { getPhilippineHolidays, getCompanyPayrollDates } from "../utils/phHolidays";
import CalendarEventDetailModal from "./CalendarEventDetailModal";
import CalendarNewEventModal from "./CalendarNewEventModal";

const VIEW_MODES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Helper to compare dates in YYYY-MM-DD
function toIsoDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminMasterCalendarTab({
  clientBriefs = [],
  allProjects = [],
  stage3Projects = [],
  currentUser,
  onNavigateTab,
  onSelectProject,
  showToast,
}) {
  const [viewMode, setViewMode] = useState("month"); // 'day' | 'week' | 'month' | 'year'
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'meeting' | 'site' | 'billing' | 'birthday' | 'holiday'
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);

  // Dynamic remote data
  const [customEvents, setCustomEvents] = useState([]);
  const [userBirthdays, setUserBirthdays] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // 1. Fetch custom company events & birthdays from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [eventsRes, bdaysRes] = await Promise.allSettled([
          authFetch("/api/admin/calendar/events").then((r) => r.json()),
          authFetch("/api/admin/calendar/birthdays").then((r) => r.json()),
        ]);

        if (!isMounted) return;
        if (eventsRes.status === "fulfilled" && eventsRes.value?.success) {
          setCustomEvents(eventsRes.value.events || []);
        }
        if (bdaysRes.status === "fulfilled" && bdaysRes.value?.success) {
          setUserBirthdays(bdaysRes.value.birthdays || []);
        }
      } catch (err) {
        console.warn("[CALENDAR] Fetch error, falling back to local:", err);
      } finally {
        if (isMounted) setIsLoadingEvents(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Today reference (YYYY-MM-DD)
  const todayStr = useMemo(() => toIsoDateString(new Date()), []);

  // 2. Aggregate ALL company schedules into unified event stream
  const allNormalizedEvents = useMemo(() => {
    const list = [];
    const currentYear = selectedDate.getFullYear();

    // A. Client Meetings from clientBriefs
    (clientBriefs || []).forEach((b, idx) => {
      const rawDate = b.meetingDate || b.meeting_date || b.consultationDate;
      if (!rawDate) return;

      let dateStr = "";
      try {
        const match = String(rawDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          dateStr = `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
        } else {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) dateStr = toIsoDateString(d);
        }
      } catch {
        dateStr = "";
      }

      if (!dateStr) return;

      const isOnline =
        (b.meetingMode || "").toLowerCase().includes("online") ||
        (b.meetingMode || "").toLowerCase().includes("video") ||
        (b.meetingMode || "").toLowerCase().includes("meet");

      list.push({
        id: `meet-${b.id || idx}`,
        rawId: b.id,
        title: `Consultation: ${b.clientName || "Client"}`,
        clientName: b.clientName,
        clientEmail: b.clientEmail || b.email,
        clientPhone: b.clientPhone || b.contactNumber,
        meetingMode: b.meetingMode || (isOnline ? "Online Video Call" : "Face-to-Face Visit"),
        projectType: b.projectType,
        estimatedBudget: b.estimatedBudget,
        category: "meeting",
        date: dateStr,
        time: b.meetingTime || "Flexible Schedule",
        priority: isOnline ? "high" : "standard",
        location: isOnline ? "Google Meet (Online Room)" : b.location || "MCPA Corporate Design Hub",
        notes: b.notes || b.inquiryMessage || "Scheduled architectural pre-consultation meeting.",
      });
    });

    // B. Live Site Execution: Milestones, Pourings & Target Turnovers
    (stage3Projects || []).forEach((sp, idx) => {
      const code = sp.project_code || sp.client_project_id || sp.projectCode;
      const title = sp.project_name || sp.title || `Project ${code}`;

      // B1. Target Project Turnover Date
      const turnover = sp.target_completion_date || sp.target_turnover_date || sp.completion_date;
      if (turnover) {
        try {
          const tDate = new Date(turnover);
          if (!isNaN(tDate.getTime())) {
            list.push({
              id: `turnover-${code || idx}`,
              title: `Project Turnover: ${title}`,
              projectCode: code,
              projectTitle: title,
              progressPct: sp.progress_pct || 100,
              category: "site",
              date: toIsoDateString(tDate),
              time: "09:00 AM",
              priority: "critical",
              isCritical: true,
              location: sp.location || "Project Site",
              notes: `Target turnover ceremony & client key handover for ${title}.`,
              rawProject: sp,
            });
          }
        } catch {}
      }

      // B2. Concrete Pouring & Critical Structural Milestones
      if (Array.isArray(sp.milestones)) {
        sp.milestones.forEach((m, mIdx) => {
          if (!m.target_date) return;
          try {
            const mDate = new Date(m.target_date);
            if (!isNaN(mDate.getTime())) {
              const mName = m.phase_name || m.notes || "Structural Phase";
              const isConcrete =
                mName.toLowerCase().includes("pour") ||
                mName.toLowerCase().includes("buhos") ||
                mName.toLowerCase().includes("slab") ||
                mName.toLowerCase().includes("column") ||
                mName.toLowerCase().includes("beam");

              list.push({
                id: `ms-${code}-${m.milestone_id || mIdx}`,
                title: isConcrete ? `Concrete Pouring: ${mName}` : `Site Milestone: ${mName}`,
                projectCode: code,
                projectTitle: title,
                phaseName: mName,
                progressPct: m.completion_pct || 0,
                category: "site",
                date: toIsoDateString(mDate),
                time: "06:00 AM",
                priority: isConcrete ? "critical" : "high",
                isCritical: isConcrete,
                location: sp.location || "Site Construction Ground",
                notes: m.notes || `Execution milestone for ${mName}. Quality control inspection required.`,
                rawProject: sp,
              });
            }
          } catch {}
        });
      }
    });

    // C. Philippine National & Bulacan Local Holidays
    const holidays = getPhilippineHolidays(currentYear);
    holidays.forEach((h) => {
      list.push({
        ...h,
        time: "All-Day Observance",
        location: "National / Bulacan Province",
      });
    });

    // D. Bi-Monthly Payroll Schedules for current & adjacent months
    for (let m = 1; m <= 12; m++) {
      const payrolls = getCompanyPayrollDates(currentYear, m);
      payrolls.forEach((p) => {
        list.push({
          ...p,
          location: "MCPA Finance & Accounting",
        });
      });
    }

    // E. Staff & Client Birthdays
    userBirthdays.forEach((u, idx) => {
      if (!u.birthDate) return;
      try {
        // Extract month and day (MM-DD)
        const parts = u.birthDate.split("-");
        if (parts.length >= 2) {
          const bMonth = String(parts[parts.length - 2]).padStart(2, "0");
          const bDay = String(parts[parts.length - 1]).padStart(2, "0");
          const recurringDate = `${currentYear}-${bMonth}-${bDay}`;

          list.push({
            id: `bday-${u.userId || idx}`,
            title: `Birthday: ${u.name}`,
            celebrantName: u.name,
            role: u.role,
            email: u.email,
            phone: u.phone,
            category: "birthday",
            date: recurringDate,
            time: "All-Day Celebration",
            priority: "standard",
            location: "MCPA Headquarters & Field",
            notes: `Birthday celebration for ${u.name} (${u.role || "Team Member"}).`,
          });
        }
      } catch {}
    });

    // F. Custom Company Events
    customEvents.forEach((ce) => {
      list.push({
        id: `custom-${ce.event_id || ce.id}`,
        title: ce.title,
        category: ce.category || "operations",
        date: ce.start_date || ce.startDate,
        time: ce.start_time || ce.startTime || "All-Day",
        endTime: ce.end_time || ce.endTime,
        priority: ce.priority || "standard",
        location: ce.location || "",
        notes: ce.notes || "",
        isCustom: true,
      });
    });

    // Sort by date then by time
    return list.map((ev) => {
      const isPast = ev.date < todayStr;
      return {
        ...ev,
        isPast,
      };
    });
  }, [clientBriefs, stage3Projects, customEvents, userBirthdays, selectedDate, todayStr]);

  // 3. Filtered Events based on Active Category, Search Query, and Priority
  const filteredEvents = useMemo(() => {
    return allNormalizedEvents.filter((ev) => {
      // Category filter
      if (activeFilter !== "all") {
        if (activeFilter === "critical") {
          if (!ev.isCritical && ev.priority !== "critical") return false;
        } else if (ev.category !== activeFilter) {
          return false;
        }
      }

      // Critical Only Toggle
      if (criticalOnly) {
        if (!ev.isCritical && ev.priority !== "critical") return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const t = (ev.title || "").toLowerCase();
        const c = (ev.clientName || "").toLowerCase();
        const p = (ev.projectCode || "").toLowerCase();
        const l = (ev.location || "").toLowerCase();
        if (!t.includes(q) && !c.includes(q) && !p.includes(q) && !l.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allNormalizedEvents, activeFilter, criticalOnly, searchQuery]);

  // Map of events grouped by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((ev) => {
      if (!map.has(ev.date)) {
        map.set(ev.date, []);
      }
      map.get(ev.date).push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Summary Metrics for Calendar Header
  const metrics = useMemo(() => {
    const todayEvents = allNormalizedEvents.filter((e) => e.date === todayStr);
    const criticalCount = allNormalizedEvents.filter((e) => e.isCritical || e.priority === "critical").length;
    const meetingsCount = allNormalizedEvents.filter((e) => e.category === "meeting").length;
    const siteOpsCount = allNormalizedEvents.filter((e) => e.category === "site").length;

    return {
      todayCount: todayEvents.length,
      criticalCount,
      meetingsCount,
      siteOpsCount,
    };
  }, [allNormalizedEvents, todayStr]);

  // Navigation handlers
  const handlePrev = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() - 1);
      else if (viewMode === "week") d.setDate(d.getDate() - 7);
      else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
      else if (viewMode === "year") d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() + 1);
      else if (viewMode === "week") d.setDate(d.getDate() + 7);
      else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
      else if (viewMode === "year") d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const handleGoToday = () => {
    setSelectedDate(new Date());
  };

  // Save new custom company event
  const handleSaveCustomEvent = async (eventData) => {
    try {
      const res = await authFetch("/api/admin/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setCustomEvents((prev) => [...prev, data.event]);
        showToast?.("Company event successfully scheduled", "success");
      } else {
        // Fallback local persistence if server is unavailable
        const localEv = { ...eventData, event_id: Date.now() };
        setCustomEvents((prev) => [...prev, localEv]);
        showToast?.("Event saved to local calendar", "info");
      }
    } catch {
      const localEv = { ...eventData, event_id: Date.now() };
      setCustomEvents((prev) => [...prev, localEv]);
      showToast?.("Event saved locally", "info");
    }
  };

  // Delete custom company event
  const handleDeleteCustomEvent = async (eventId) => {
    try {
      const cleanId = String(eventId).replace("custom-", "");
      await authFetch(`/api/admin/calendar/events/${cleanId}`, { method: "DELETE" });
      setCustomEvents((prev) => prev.filter((e) => String(e.event_id || e.id) !== cleanId));
      showToast?.("Schedule removed", "info");
    } catch {
      showToast?.("Could not remove event", "error");
    }
  };

  // Helper title for current viewport
  const viewHeaderTitle = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = MONTH_NAMES[selectedDate.getMonth()];
    if (viewMode === "day") {
      return `${m} ${selectedDate.getDate()}, ${y}`;
    }
    if (viewMode === "week") {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${y}`;
    }
    if (viewMode === "year") {
      return `Year ${y}`;
    }
    return `${m} ${y}`;
  }, [selectedDate, viewMode]);

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 font-sans pb-12">
      {/* 1. Executive Calendar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Company Master Calendar
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                Unified Operations, Client Consultations, Concrete Pourings & Corporate Schedules
              </p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Today: {metrics.todayCount} Scheduled
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30">
              <Flame className="w-3.5 h-3.5" />
              {metrics.criticalCount} Critical Pourings
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30">
              <Video className="w-3.5 h-3.5" />
              {metrics.meetingsCount} Client Consultations
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <HardHat className="w-3.5 h-3.5" />
              {metrics.siteOpsCount} Active Site Builds
            </span>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 shadow-xs">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-150 cursor-pointer ${
                  viewMode === mode.id
                    ? "bg-white dark:bg-amber-500 text-neutral-900 dark:text-neutral-950 shadow-xs"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* New Event Button */}
          <button
            type="button"
            onClick={() => setIsNewEventModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Bar: Today, Arrows, Search, and Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#181a24] hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Window"
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Window"
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight font-mono ml-1">
              {viewHeaderTitle}
            </h2>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule or project..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Category Filter Pills (100% SVG Vector Icons, Strict NO EMOJIS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-950"
                : "bg-neutral-100 dark:bg-[#181a24] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Schedules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("meeting")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "meeting"
                ? "bg-amber-500 text-neutral-950 font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Client Meetings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("site")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "site"
                ? "bg-emerald-600 text-white font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Site Milestones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("billing")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "billing"
                ? "bg-purple-600 text-white font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Payroll</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("birthday")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "birthday"
                ? "bg-rose-600 text-white font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Birthdays</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("holiday")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === "holiday"
                ? "bg-indigo-600 text-white font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Holidays</span>
          </button>

          <div className="h-4 border-r border-neutral-300 dark:border-white/10 mx-1 shrink-0" />

          {/* Critical Only Toggle */}
          <button
            type="button"
            onClick={() => setCriticalOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-all cursor-pointer ${
              criticalOnly
                ? "bg-orange-500 text-neutral-950 ring-2 ring-orange-500/40 font-extrabold"
                : "bg-neutral-100 dark:bg-[#181a24] text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-neutral-200 dark:border-white/5"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Only</span>
          </button>
        </div>
      </div>

      {/* 3. CALENDAR VIEWS CONTAINER */}
      <div className="rounded-2xl bg-white dark:bg-[#11141c] border border-neutral-200 dark:border-white/[0.08] shadow-sm overflow-hidden transition-colors">
        {/* VIEW 1: MONTHLY GRID VIEW */}
        {viewMode === "month" && (
          <MonthGridView
            selectedDate={selectedDate}
            todayStr={todayStr}
            eventsByDate={eventsByDate}
            onSelectEvent={(ev) => setActiveDetailEvent(ev)}
            onSelectDay={(dayDate) => {
              setSelectedDate(dayDate);
              setViewMode("day");
            }}
          />
        )}

        {/* VIEW 2: WEEKLY MATRIX VIEW */}
        {viewMode === "week" && (
          <WeekGridView
            selectedDate={selectedDate}
            todayStr={todayStr}
            eventsByDate={eventsByDate}
            onSelectEvent={(ev) => setActiveDetailEvent(ev)}
            onSelectDay={(dayDate) => {
              setSelectedDate(dayDate);
              setViewMode("day");
            }}
          />
        )}

        {/* VIEW 3: DAILY AGENDA & TIMELINE VIEW */}
        {viewMode === "day" && (
          <DayAgendaView
            selectedDate={selectedDate}
            todayStr={todayStr}
            eventsByDate={eventsByDate}
            onSelectEvent={(ev) => setActiveDetailEvent(ev)}
          />
        )}

        {/* VIEW 4: YEARLY MACRO BIRD'S-EYE VIEW */}
        {viewMode === "year" && (
          <YearMacroView
            year={selectedDate.getFullYear()}
            eventsByDate={eventsByDate}
            onSelectMonth={(monthIdx) => {
              setSelectedDate(new Date(selectedDate.getFullYear(), monthIdx, 1));
              setViewMode("month");
            }}
          />
        )}
      </div>

      {/* 4. Modals */}
      <CalendarEventDetailModal
        event={activeDetailEvent}
        isOpen={Boolean(activeDetailEvent)}
        onClose={() => setActiveDetailEvent(null)}
        onNavigateTab={onNavigateTab}
        onSelectProject={onSelectProject}
        onDeleteEvent={handleDeleteCustomEvent}
      />

      <CalendarNewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSave={handleSaveCustomEvent}
      />
    </div>
  );
}

// =========================================================================
// SUB-VIEW 1: MONTH GRID VIEW (Traditional 35-42 Grid with Dimmed Past Days)
// =========================================================================
function MonthGridView({ selectedDate, todayStr, eventsByDate, onSelectEvent, onSelectDay }) {
  const calendarCells = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const d = new Date(year, month - 1, dayNum);
      const iso = toIsoDateString(d);
      cells.push({
        dateObj: d,
        iso,
        dayNum,
        isCurrentMonth: false,
        isPast: iso < todayStr,
        isToday: iso === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const iso = toIsoDateString(dateObj);
      cells.push({
        dateObj,
        iso,
        dayNum: d,
        isCurrentMonth: true,
        isPast: iso < todayStr,
        isToday: iso === todayStr,
      });
    }

    // Next month filler days to complete 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const iso = toIsoDateString(dateObj);
      cells.push({
        dateObj,
        iso,
        dayNum: d,
        isCurrentMonth: false,
        isPast: iso < todayStr,
        isToday: iso === todayStr,
      });
    }

    return cells;
  }, [selectedDate, todayStr]);

  return (
    <div className="w-full">
      {/* Weekday Table Headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#181a24]">
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-2 text-center text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase ${
              idx === 0 || idx === 6
                ? "text-neutral-400 dark:text-neutral-500"
                : "text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-neutral-200 dark:divide-white/[0.06] border-b border-neutral-200 dark:border-white/[0.08]">
        {calendarCells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.iso) || [];
          const maxVisible = 2;
          const overflowCount = Math.max(0, dayEvents.length - maxVisible);

          return (
            <div
              key={cell.iso}
              onClick={() => onSelectDay(cell.dateObj)}
              className={`min-h-[95px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer group ${
                cell.isCurrentMonth
                  ? "bg-white dark:bg-[#11141c]"
                  : "bg-neutral-50/70 dark:bg-white/[0.015]"
              } ${
                cell.isToday
                  ? "ring-2 ring-inset ring-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]"
                  : "hover:bg-neutral-50/90 dark:hover:bg-white/[0.03]"
              } ${cell.isPast ? "opacity-45 hover:opacity-85" : "opacity-100"}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-mono font-bold ${
                    cell.isToday
                      ? "px-1.5 py-0.5 rounded-full bg-amber-500 text-neutral-950"
                      : cell.isCurrentMonth
                      ? "text-neutral-800 dark:text-neutral-200"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {cell.dayNum}
                </span>

                {cell.isToday && (
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    TODAY
                  </span>
                )}
              </div>

              {/* Day Event Pills Stack */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, maxVisible).map((ev) => (
                  <EventPill key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
                ))}

                {overflowCount > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 pl-1">
                    +{overflowCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// SUB-VIEW 2: WEEK GRID VIEW (7-Day Column Matrix with Time Indicators)
// =========================================================================
function WeekGridView({ selectedDate, todayStr, eventsByDate, onSelectEvent, onSelectDay }) {
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const firstDay = curr.getDate() - curr.getDay(); // Sunday
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth(), firstDay + i);
      const iso = toIsoDateString(d);
      days.push({
        dateObj: d,
        iso,
        dayNum: d.getDate(),
        dayName: DAYS_OF_WEEK[i],
        isToday: iso === todayStr,
        isPast: iso < todayStr,
      });
    }
    return days;
  }, [selectedDate, todayStr]);

  return (
    <div className="w-full">
      {/* 7-Day Header */}
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#181a24]">
        {weekDays.map((day) => (
          <div
            key={day.iso}
            onClick={() => onSelectDay(day.dateObj)}
            className={`py-3 px-2 text-center transition-colors cursor-pointer ${
              day.isToday ? "bg-amber-500/10" : ""
            }`}
          >
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400 block">
              {day.dayName}
            </span>
            <span
              className={`inline-block mt-0.5 text-xs sm:text-sm font-mono font-extrabold ${
                day.isToday
                  ? "w-6 h-6 rounded-full bg-amber-500 text-neutral-950 leading-6"
                  : "text-neutral-800 dark:text-neutral-200"
              }`}
            >
              {day.dayNum}
            </span>
          </div>
        ))}
      </div>

      {/* 7-Column Events Container */}
      <div className="grid grid-cols-7 divide-x divide-neutral-200 dark:divide-white/[0.06] min-h-[420px]">
        {weekDays.map((day) => {
          const dayEvents = eventsByDate.get(day.iso) || [];

          return (
            <div
              key={day.iso}
              className={`p-2 space-y-2 transition-all ${
                day.isToday ? "bg-amber-500/[0.02]" : "bg-white dark:bg-[#11141c]"
              } ${day.isPast ? "opacity-45 hover:opacity-85" : "opacity-100"}`}
            >
              {dayEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] font-mono text-neutral-300 dark:text-neutral-700 select-none">
                  No Sched
                </div>
              ) : (
                dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] shadow-xs ${
                      ev.isCritical
                        ? "bg-orange-500/15 border-orange-500/50 ring-1 ring-orange-500/40 text-orange-950 dark:text-orange-200"
                        : ev.category === "meeting"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                        : ev.category === "site"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : ev.category === "billing"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-950 dark:text-purple-200"
                        : ev.category === "birthday"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                        : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {ev.isCritical ? (
                        <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                      ) : ev.category === "meeting" ? (
                        <Video className="w-3 h-3 text-amber-500 shrink-0" />
                      ) : ev.category === "site" ? (
                        <HardHat className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : ev.category === "birthday" ? (
                        <Gift className="w-3 h-3 text-rose-500 shrink-0" />
                      ) : ev.category === "holiday" ? (
                        <Flag className="w-3 h-3 text-indigo-500 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                      )}
                      <span className="text-[9px] font-mono font-bold truncate">
                        {ev.time}
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-tight line-clamp-2">
                      {ev.title}
                    </p>
                    {ev.projectCode && (
                      <span className="text-[9px] font-mono text-neutral-400 uppercase mt-1 block">
                        {ev.projectCode}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// SUB-VIEW 3: DAY AGENDA VIEW (High-Precision Hourly Timeline 08:00 - 19:00)
// =========================================================================
function DayAgendaView({ selectedDate, todayStr, eventsByDate, onSelectEvent }) {
  const currentIso = toIsoDateString(selectedDate);
  const dayEvents = eventsByDate.get(currentIso) || [];
  const isPastDay = currentIso < todayStr;
  const isToday = currentIso === todayStr;

  const hours = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Day Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
            Day Schedule Focus
          </span>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
            {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()} ({DAYS_OF_WEEK[selectedDate.getDay()]})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isToday && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-amber-500 text-neutral-950">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-ping" />
              CURRENT DAY
            </span>
          )}
          {isPastDay && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
              Past Day Record
            </span>
          )}
          <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">
            {dayEvents.length} Events Logged
          </span>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className={`space-y-4 ${isPastDay ? "opacity-50" : "opacity-100"}`}>
        {hours.map((hour) => {
          // Check matching events
          const hourEvents = dayEvents.filter((e) => {
            if (e.time && e.time.toLowerCase().includes(hour.slice(0, 2).toLowerCase())) {
              return true;
            }
            return false;
          });

          return (
            <div key={hour} className="flex items-start gap-4 group">
              <div className="w-20 sm:w-24 text-[11px] font-mono font-bold text-neutral-400 dark:text-neutral-500 shrink-0 text-right pt-2.5">
                {hour}
              </div>

              <div className="flex-1 min-h-[60px] p-3 rounded-xl border border-neutral-200/60 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.015] space-y-2">
                {hourEvents.length > 0 ? (
                  hourEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        ev.isCritical
                          ? "bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/50 shadow-xs"
                          : ev.category === "meeting"
                          ? "bg-amber-500/10 border-amber-500/40"
                          : ev.category === "site"
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : ev.category === "billing"
                          ? "bg-purple-500/10 border-purple-500/40"
                          : "bg-white dark:bg-[#181a24] border-neutral-200 dark:border-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {ev.isCritical && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                              <Flame className="w-3 h-3" />
                              CRITICAL
                            </span>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            {ev.title}
                          </span>
                        </div>
                        {ev.location && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            <span>{ev.location}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] font-mono font-bold text-neutral-500 dark:text-neutral-400">
                          {ev.time}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-semibold">
                          Details
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-300 dark:text-neutral-700 text-xs font-mono select-none pt-1">
                    -- Open Slot --
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Unscheduled / All-Day Events */}
        {dayEvents.filter((e) => !e.time || e.time.toLowerCase().includes("all-day")).length > 0 && (
          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
              All-Day Observances & Celebrations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dayEvents
                .filter((e) => !e.time || e.time.toLowerCase().includes("all-day"))
                .map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#181a24] flex items-center justify-between cursor-pointer hover:border-amber-500"
                  >
                    <div className="flex items-center gap-2.5">
                      {ev.category === "birthday" ? (
                        <Gift className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Flag className="w-4 h-4 text-indigo-500" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          {ev.title}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {ev.notes || ev.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">View</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// SUB-VIEW 4: YEAR MACRO VIEW (12-Month Bird's-Eye View with Density Dots)
// =========================================================================
function YearMacroView({ year, eventsByDate, onSelectMonth }) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Annual Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Annual Target Builds
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1 block">
            24 Residences
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Holidays & Observances
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
            18 Days
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Payroll Settlement Cycles
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 block">
            24 Tranches
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Active Year
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
            {year}
          </span>
        </div>
      </div>

      {/* 12 Mini-Month Calendars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTH_NAMES.map((mName, mIdx) => {
          const totalDays = new Date(year, mIdx + 1, 0).getDate();
          const firstDay = new Date(year, mIdx, 1).getDay();

          // Count events in this month
          let monthEventCount = 0;
          for (let d = 1; d <= totalDays; d++) {
            const iso = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            monthEventCount += (eventsByDate.get(iso) || []).length;
          }

          return (
            <div
              key={mName}
              onClick={() => onSelectMonth(mIdx)}
              className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50/50 dark:bg-white/[0.02] hover:border-amber-500 hover:bg-neutral-100/80 dark:hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-200/60 dark:border-white/5">
                <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {mName}
                </span>
                {monthEventCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {monthEventCount} sched
                  </span>
                )}
              </div>

              {/* Mini 7x5 Days Dot Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((dw) => (
                  <span key={dw} className="text-[8px] font-mono text-neutral-400">
                    {dw[0]}
                  </span>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`pad-${i}`} className="text-[9px] text-transparent">
                    .
                  </span>
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dNum = i + 1;
                  const iso = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
                  const hasEvents = (eventsByDate.get(iso) || []).length > 0;

                  return (
                    <span
                      key={dNum}
                      className={`text-[9px] font-mono leading-4 rounded-xs ${
                        hasEvents
                          ? "bg-amber-500 text-neutral-950 font-bold"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {dNum}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// REUSABLE EVENT PILL COMPONENT (Zero Emojis, Pure SVG Vectors)
// =========================================================================
function EventPill({ event, onSelectEvent }) {
  const isCritical = event.isCritical || event.priority === "critical";

  // Category Icon resolver
  const renderIcon = () => {
    if (isCritical) return <Flame className="w-2.5 h-2.5 text-orange-500 shrink-0" />;
    if (event.category === "meeting") return <Video className="w-2.5 h-2.5 text-amber-500 shrink-0" />;
    if (event.category === "site") return <HardHat className="w-2.5 h-2.5 text-emerald-500 shrink-0" />;
    if (event.category === "billing") return <CreditCard className="w-2.5 h-2.5 text-purple-500 shrink-0" />;
    if (event.category === "birthday") return <Gift className="w-2.5 h-2.5 text-rose-500 shrink-0" />;
    if (event.category === "holiday") return <Flag className="w-2.5 h-2.5 text-indigo-500 shrink-0" />;
    return <Clock className="w-2.5 h-2.5 text-neutral-400 shrink-0" />;
  };

  const getStyleClasses = () => {
    if (isCritical) {
      return "bg-orange-500/15 text-orange-950 dark:text-orange-200 border-orange-500/60 ring-1 ring-orange-500/30 font-bold";
    }
    switch (event.category) {
      case "meeting":
        return "bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-500/30";
      case "site":
        return "bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-emerald-500/30";
      case "billing":
        return "bg-purple-500/15 text-purple-950 dark:text-purple-200 border-purple-500/30";
      case "birthday":
        return "bg-rose-500/15 text-rose-950 dark:text-rose-200 border-rose-500/30";
      case "holiday":
        return "bg-indigo-500/15 text-indigo-950 dark:text-indigo-200 border-indigo-500/30";
      default:
        return "bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10";
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelectEvent(event);
      }}
      className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border text-[9px] sm:text-[10px] leading-tight text-left truncate transition-transform hover:scale-[1.02] cursor-pointer ${getStyleClasses()}`}
    >
      {renderIcon()}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
