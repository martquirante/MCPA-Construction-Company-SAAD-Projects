"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authFetch } from "@/modules/shared/authFetch";
import AnalyticsWorldMap from "./AnalyticsWorldMap";
import {
  Activity,
  Users,
  Eye,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Cpu,
  Compass,
  Share2,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Layers,
  BarChart3,
  PieChart,
  Radio,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const DATE_RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "this_month", label: "This Month" },
  { id: "prev_month", label: "Previous Month" },
  { id: "this_year", label: "This Year" },
  { id: "custom", label: "Custom Range" },
];

const SUB_SECTIONS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "live", label: "Live Visitors", icon: Radio },
  { id: "geographic", label: "Geographic Analytics", icon: Globe },
  { id: "devices", label: "Devices & OS", icon: Monitor },
  { id: "sources", label: "Traffic Sources", icon: Share2 },
  { id: "content", label: "Pages & Content", icon: FileText },
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "reports", label: "Reports & Privacy", icon: Download },
];

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (mins < 60) return `${mins}m ${rem}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatRelativeTime(iso) {
  if (!iso) return "Just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

/**
 * Interactive SVG Area / Line Chart for Traffic Over Time
 */
function TrafficAreaChart({ data = [], metric = "pageviews" }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-500 border border-dashed border-neutral-200 dark:border-white/10 rounded-2xl">
        No traffic points recorded in this date window yet.
      </div>
    );
  }

  const width = 760;
  const height = 230;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(
    5,
    ...data.map((d) => Math.max(Number(d.pageviews) || 0, Number(d.unique_visitors) || 0, Number(d.sessions) || 0))
  );

  const getX = (i) =>
    data.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (data.length - 1)) * plotW;
  const getY = (val) => padTop + plotH - (Math.min(maxVal, Number(val) || 0) / maxVal) * plotH;

  const pvPoints = data.map((d, i) => `${getX(i)},${getY(d.pageviews)}`);
  const uvPoints = data.map((d, i) => `${getX(i)},${getY(d.unique_visitors)}`);

  const areaPath =
    data.length > 1
      ? `M ${getX(0)},${padTop + plotH} L ${pvPoints.join(" L ")} L ${getX(data.length - 1)},${
          padTop + plotH
        } Z`
      : "";

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-60 sm:h-64 overflow-visible select-none"
      >
        <defs>
          <linearGradient id="mcpaAmberGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = padTop + plotH * (1 - t);
          const labelVal = Math.round(maxVal * t);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="currentColor"
                className="text-neutral-200 dark:text-white/10"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-neutral-400 text-[10px] font-mono"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Pageviews Shaded Area */}
        {areaPath && <path d={areaPath} fill="url(#mcpaAmberGrad)" />}

        {/* Pageviews Line */}
        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            points={pvPoints.join(" ")}
          />
        )}

        {/* Unique Visitors Line */}
        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 2"
            points={uvPoints.join(" ")}
          />
        )}

        {/* Interactive Data Nodes */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cyPv = getY(d.pageviews);
          const cyUv = getY(d.unique_visitors);
          const showLabel =
            data.length <= 10 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 7) === 0;

          return (
            <g
              key={d.date || i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={cx - plotW / Math.max(2, data.length * 2)}
                y={padTop}
                width={plotW / Math.max(1, data.length)}
                height={plotH}
                fill="transparent"
              />
              <circle cx={cx} cy={cyPv} r={hoverIdx === i ? 5 : 3.5} fill="#f59e0b" />
              <circle cx={cx} cy={cyUv} r={hoverIdx === i ? 4.5 : 3} fill="#10b981" />
              {showLabel && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-neutral-500 text-[10px] font-mono"
                >
                  {d.label || d.date}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoverIdx !== null && data[hoverIdx] && (
        <div className="absolute top-2 right-4 px-3.5 py-2 rounded-xl bg-neutral-950/95 text-white border border-white/15 shadow-xl text-xs flex items-center gap-4 pointer-events-none">
          <span className="font-mono font-bold text-amber-400">
            {data[hoverIdx].label || data[hoverIdx].date}
          </span>
          <span>
            Pageviews: <strong>{data[hoverIdx].pageviews}</strong>
          </span>
          <span>
            Unique Visitors: <strong className="text-emerald-400">{data[hoverIdx].unique_visitors}</strong>
          </span>
          <span>
            Sessions: <strong>{data[hoverIdx].sessions}</strong>
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 text-xs text-neutral-500 mt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span>Total Page Views</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Unique Visitors</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Horizontal Distribution Bar List
 */
function DistributionBarList({ items = [], labelKey = "name", valueKey = "sessions", emptyText = "No data yet" }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-xs text-neutral-500 py-4">{emptyText}</p>;
  }
  const total = Math.max(1, items.reduce((acc, it) => acc + (Number(it[valueKey]) || 0), 0));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.min(100, Number(((val / total) * 100).toFixed(1)));
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                {item[labelKey] || "Unknown"}
              </span>
              <span className="font-mono text-neutral-500 shrink-0 ml-2">
                {val.toLocaleString()} ({pct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsTab({ showToast }) {
  const [activeSubSection, setActiveSubSection] = useState("overview");
  const [range, setRange] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Geographic Drilldown Filters
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  // Analytics State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [liveData, setLiveData] = useState({
    onlineCount: 0,
    onlineVisitors: [],
    activePages: [],
    recentlyEndedSessions: [],
  });
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Privacy & Retention Settings State
  const [privacySettings, setPrivacySettings] = useState({
    retentionDays: 180,
    heartbeatIntervalSeconds: 20,
    sessionTimeoutSeconds: 65,
    anonymizeIp: true,
    consentBannerEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const notify = useCallback(
    (msg, type = "success") => {
      if (showToast) showToast(msg, type);
    },
    [showToast]
  );

  // Fetch Dashboard Analytics
  const fetchDashboard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({ range });
        if (range === "custom") {
          if (customStartDate) params.set("startDate", customStartDate);
          if (customEndDate) params.set("endDate", customEndDate);
        }
        if (selectedCountry !== "all") params.set("country", selectedCountry);
        if (selectedRegion !== "all") params.set("region", selectedRegion);
        if (selectedProvince !== "all") params.set("province", selectedProvince);
        if (selectedCity !== "all") params.set("city", selectedCity);

        const [dashRes, liveRes, settingsRes] = await Promise.all([
          authFetch(`/api/admin/analytics/dashboard?${params.toString()}`).catch(() => null),
          authFetch("/api/admin/analytics/live").catch(() => null),
          authFetch("/api/admin/analytics/settings").catch(() => null),
        ]);

        if (dashRes && dashRes.ok) {
          const d = await dashRes.json();
          if (d.success) setDashboardData(d);
        }
        if (liveRes && liveRes.ok) {
          const l = await liveRes.json();
          if (l.success) setLiveData(l);
        }
        if (settingsRes && settingsRes.ok) {
          const s = await settingsRes.json();
          if (s.success && s.settings) setPrivacySettings((prev) => ({ ...prev, ...s.settings }));
        }
      } catch (err) {
        console.warn("[AdminAnalyticsTab] Fetch warning:", err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [range, customStartDate, customEndDate, selectedCountry, selectedRegion, selectedProvince, selectedCity]
  );

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Connect to Real-Time SSE Stream + Periodic Live Refresh
  useEffect(() => {
    let es = null;
    try {
      es = new EventSource("/api/admin/realtime-stream");
      es.onopen = () => setRealtimeConnected(true);
      es.addEventListener("ANALYTICS_LIVE_UPDATE", (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setLastRealtimeEvent(parsed);
          fetchDashboard(true);
        } catch (_) {}
      });
      es.onerror = () => setRealtimeConnected(false);
    } catch (_) {}

    const pollTimer = setInterval(() => {
      fetchDashboard(true);
    }, 15000);

    return () => {
      if (es) es.close();
      clearInterval(pollTimer);
    };
  }, [fetchDashboard]);

  // Export CSV Handler
  const handleExportCsv = async (reportType) => {
    try {
      const params = new URLSearchParams({ type: reportType, range, format: "csv" });
      if (range === "custom") {
        if (customStartDate) params.set("startDate", customStartDate);
        if (customEndDate) params.set("endDate", customEndDate);
      }
      const res = await authFetch(`/api/admin/analytics/export?${params.toString()}`);
      if (!res.ok) {
        notify("Could not export report.", "error");
        return;
      }
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcpa-analytics-${reportType}-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded ${reportType.toUpperCase()} CSV report!`, "success");
    } catch (_) {
      notify("Failed to download CSV report.", "error");
    }
  };

  // Export Executive PDF Report using jsPDF
  const handleExportPdfReport = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const k = dashboardData?.kpis || {};

      doc.setFontSize(16);
      doc.text("MCPA Construction & Supply — Website Analytics Report", 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("en-PH")} | Range: ${range.toUpperCase()}`, 14, 25);

      doc.setFontSize(12);
      doc.text("1. Executive Traffic & Engagement KPIs", 14, 36);
      doc.setFontSize(10);
      const kpiLines = [
        `Currently Online Visitors: ${k.currentlyOnline?.current ?? 0}`,
        `Total Visitors Today: ${k.visitorsToday?.current ?? 0}`,
        `Total Visitors This Week: ${k.visitorsThisWeek?.current ?? 0}`,
        `Total Visitors This Month: ${k.visitorsThisMonth?.current ?? 0}`,
        `Unique Visitors (${range}): ${k.uniqueVisitors?.current ?? 0} (${k.uniqueVisitors?.changePct ?? 0}%)`,
        `Returning Visitors (${range}): ${k.returningVisitors?.current ?? 0}`,
        `Total Page Views (${range}): ${k.totalPageviews?.current ?? 0} (${k.totalPageviews?.changePct ?? 0}%)`,
        `Average Session Duration: ${formatDuration(k.avgSessionDuration?.current ?? 0)}`,
        `Average Pages Per Session: ${k.avgPagesPerSession?.current ?? 0}`,
        `Bounce Rate: ${k.bounceRate?.current ?? 0}%`,
      ];
      kpiLines.forEach((line, idx) => {
        doc.text(`• ${line}`, 18, 44 + idx * 6);
      });

      let y = 112;
      doc.setFontSize(12);
      doc.text("2. Top Geographic Countries", 14, y);
      doc.setFontSize(10);
      (dashboardData?.charts?.countries || []).slice(0, 6).forEach((c, idx) => {
        doc.text(
          `${idx + 1}. ${c.country} (${c.country_code}) — ${c.visitors} Visitors, ${c.sessions} Sessions, ${c.pageviews} Pageviews`,
          18,
          y + 8 + idx * 6
        );
      });

      y = 160;
      doc.setFontSize(12);
      doc.text("3. Most Visited Website Pages", 14, y);
      doc.setFontSize(10);
      (dashboardData?.contentPerformance?.topPages || []).slice(0, 8).forEach((p, idx) => {
        doc.text(
          `${idx + 1}. ${p.page_path} — ${p.views} Views (${p.unique_visitors} Unique, Avg ${p.avg_time_seconds}s)`,
          18,
          y + 8 + idx * 6
        );
      });

      doc.save(`mcpa-executive-analytics-${range}.pdf`);
      notify("Generated & downloaded Executive PDF Analytics Report!", "success");
    } catch (err) {
      notify("Could not generate PDF report.", "error");
    }
  };

  const handleSavePrivacySettings = async (purgeNow = false) => {
    setSavingSettings(true);
    try {
      const res = await authFetch("/api/admin/analytics/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: privacySettings, purgeExpiredNow: purgeNow }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify(data.message || "Privacy settings updated!", "success");
        if (purgeNow) fetchDashboard(true);
      }
    } catch (_) {
      notify("Failed to update privacy settings.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const kpis = dashboardData?.kpis || {};
  const charts = dashboardData?.charts || {};
  const contentPerf = dashboardData?.contentPerformance || {};

  // Build the 10 required KPI cards
  const kpiCards = [
    {
      title: "Currently Online Visitors",
      value: liveData.onlineCount ?? kpis.currentlyOnline?.current ?? 0,
      prev: null,
      changePct: null,
      isLive: true,
      icon: Radio,
      sub: "Active within last 65s heartbeat",
    },
    {
      title: "Total Visitors Today",
      value: kpis.visitorsToday?.current ?? 0,
      prev: kpis.visitorsToday?.previous ?? 0,
      changePct: kpis.visitorsToday?.changePct ?? 0,
      icon: Users,
      sub: "vs. Yesterday",
    },
    {
      title: "Total Visitors This Week",
      value: kpis.visitorsThisWeek?.current ?? 0,
      prev: kpis.visitorsThisWeek?.previous ?? 0,
      changePct: kpis.visitorsThisWeek?.changePct ?? 0,
      icon: Users,
      sub: "vs. Previous Week",
    },
    {
      title: "Total Visitors This Month",
      value: kpis.visitorsThisMonth?.current ?? 0,
      prev: kpis.visitorsThisMonth?.previous ?? 0,
      changePct: kpis.visitorsThisMonth?.changePct ?? 0,
      icon: Users,
      sub: "vs. Previous Month",
    },
    {
      title: "Total Page Views",
      value: (kpis.totalPageviews?.current ?? 0).toLocaleString(),
      prev: kpis.totalPageviews?.previous ?? 0,
      changePct: kpis.totalPageviews?.changePct ?? 0,
      icon: Eye,
      sub: "Selected period",
    },
    {
      title: "Unique Visitors",
      value: (kpis.uniqueVisitors?.current ?? 0).toLocaleString(),
      prev: kpis.uniqueVisitors?.previous ?? 0,
      changePct: kpis.uniqueVisitors?.changePct ?? 0,
      icon: ShieldCheck,
      sub: "Distinct anonymous IDs",
    },
    {
      title: "Returning Visitors",
      value: (kpis.returningVisitors?.current ?? 0).toLocaleString(),
      prev: kpis.returningVisitors?.previous ?? 0,
      changePct: kpis.returningVisitors?.changePct ?? 0,
      icon: RefreshCw,
      sub: `${kpis.returningPercentage ?? 0}% of total visitors`,
    },
    {
      title: "Avg. Session Duration",
      value: formatDuration(kpis.avgSessionDuration?.current ?? 0),
      prev: formatDuration(kpis.avgSessionDuration?.previous ?? 0),
      changePct: kpis.avgSessionDuration?.changePct ?? 0,
      icon: Clock,
      sub: "Active engagement time",
    },
    {
      title: "Avg. Pages / Session",
      value: kpis.avgPagesPerSession?.current ?? 1,
      prev: kpis.avgPagesPerSession?.previous ?? 1,
      changePct: kpis.avgPagesPerSession?.changePct ?? 0,
      icon: Layers,
      sub: "Navigation depth",
    },
    {
      title: "Bounce Rate",
      value: `${kpis.bounceRate?.current ?? 0}%`,
      prev: `${kpis.bounceRate?.previous ?? 0}%`,
      changePct: kpis.bounceRate?.changePct ?? 0,
      invertTrend: true,
      icon: Activity,
      sub: `${kpis.engagementRate ?? 0}% Engaged Sessions`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. TOP HEADER, REAL-TIME PULSE & SUB-SECTION NAVIGATION
         ===================================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-[#10131a] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{liveData.onlineCount ?? 0} Online Right Now</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-bold">
              {realtimeConnected ? "Realtime Stream Connected" : "Live Sync Active"}
            </span>
            {lastRealtimeEvent && (
              <span className="text-[11px] text-neutral-500 font-mono truncate max-w-xs">
                Last activity: {lastRealtimeEvent.pagePath} ({lastRealtimeEvent.country || "PH"})
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white mt-1">
            Analytics &amp; Real-Time Visitor Intelligence
          </h2>
        </div>

        {/* 8 Sub-Section Tabs with Horizontal Scroll */}
        <div className="w-full lg:w-auto overflow-x-auto pb-1.5 pt-0.5 flex items-center gap-2 max-w-full scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-neutral-100 dark:scrollbar-track-white/5">
          {SUB_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeSubSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSubSection(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? "bg-amber-500 text-neutral-950 shadow-xs"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          2. GLOBAL DATE RANGE & GEOGRAPHIC FILTER BAR
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#10131a] p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-white/10">
        {/* Date Range Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                range === opt.id
                  ? "bg-amber-500 text-neutral-950"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Pickers + Geographic Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {range === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs outline-none"
              />
              <span className="text-xs text-neutral-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs outline-none"
              />
            </div>
          )}

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedRegion("all");
              setSelectedProvince("all");
              setSelectedCity("all");
            }}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
          >
            <option value="all">All Countries</option>
            {(charts.countries || []).map((c) => (
              <option key={c.country_code} value={c.country_code}>
                {c.country} ({c.visitors})
              </option>
            ))}
          </select>

          {/* Province Filter */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
          >
            <option value="all">All Provinces / States</option>
            {(charts.provinces || []).map((p, idx) => (
              <option key={`${p.province}-${idx}`} value={p.province}>
                {p.province} ({p.visitors})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => fetchDashboard(false)}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. 10 ENTERPRISE KPI SUMMARY CARDS (Always Visible on Overview)
         ===================================================================== */}
      {activeSubSection === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {kpiCards.map((card, idx) => {
              const Icon = card.icon;
              const pct = Number(card.changePct) || 0;
              const isPositive = card.invertTrend ? pct <= 0 : pct >= 0;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 p-4 flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                      {card.title}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-extrabold text-neutral-950 dark:text-white">
                      {card.value}
                    </span>
                    {card.isLive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold uppercase">
                        LIVE
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                          pct === 0
                            ? "text-neutral-400"
                            : isPositive
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {pct > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : pct < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{pct > 0 ? `+${pct}%` : `${pct}%`}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>{card.sub}</span>
                    {card.prev !== null && card.prev !== undefined && (
                      <span className="font-mono text-[10px]">Prev: {card.prev}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Traffic Over Time Chart */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Visitors &amp; Page Views Over Time
                </h3>
                <p className="text-xs text-neutral-500">
                  Daily unique visitors and total pageviews across the selected date window
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCsv("traffic")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
            <TrafficAreaChart data={charts.timeSeries || []} />
          </div>

          {/* 3-Column Quick Breakdown: Devices, Operating Systems, Top Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">Device Categories</h4>
                <Monitor className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList items={charts.devices || []} labelKey="name" valueKey="sessions" />
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">Operating Systems</h4>
                <Cpu className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList
                items={charts.operatingSystems || []}
                labelKey="name"
                valueKey="sessions"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">Top Countries</h4>
                <Globe className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList
                items={charts.countries || []}
                labelKey="country"
                valueKey="visitors"
              />
            </div>
          </div>

          {/* Interactive World Map Preview on Overview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Global Visitor Distribution Map
                </h3>
                <p className="text-xs text-neutral-500">
                  Click any country bubble to filter dashboard statistics by country and inspect regional subdivisions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubSection("geographic")}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Open Full Geographic Analytics &rarr;
              </button>
            </div>
            <AnalyticsWorldMap
              countries={charts.countries || []}
              cities={charts.cities || []}
              selectedCountry={selectedCountry}
              onSelectCountry={(code) => setSelectedCountry(code)}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 2: REAL-TIME LIVE VISITOR MONITORING
         ===================================================================== */}
      {activeSubSection === "live" && (
        <div className="space-y-6">
          {/* Live Status Banner + Active Pages Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 p-6 rounded-2xl bg-neutral-950 text-white border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE HEARTBEAT STREAM</span>
                </div>
                <div className="mt-5 text-5xl font-extrabold text-amber-400 font-mono">
                  {liveData.onlineCount ?? 0}
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  Currently Online Visitors
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Visitors sending active 20-second heartbeats. Sessions automatically expire after 65 seconds of inactivity.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 text-[11px] font-mono text-neutral-400">
                Transport: SSE (/api/admin/realtime-stream) + WebSocket
              </div>
            </div>

            <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-500">
                Pages Currently Being Browsed Right Now
              </h3>
              {(liveData.activePages || []).length === 0 ? (
                <p className="text-xs text-neutral-500 py-6">
                  No active page heartbeats in the last 65 seconds. Open any public MCPA page in a new tab to see it appear live!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {liveData.activePages.map((ap, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs"
                    >
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {ap.page_path}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                        {ap.active_visitors} active visitor{ap.active_visitors > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Live Visitors Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Currently Online Visitor Sessions ({liveData.onlineVisitors?.length || 0})
                </h3>
                <p className="text-xs text-neutral-500">
                  Real-time anonymous session telemetry including current page, device, OS, browser, and approximate geography
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-[11px] font-mono uppercase text-neutral-500">
                    <th className="py-3 px-3">Status / Visitor ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Current Page</th>
                    <th className="py-3 px-3">Landing / Referrer</th>
                    <th className="py-3 px-3">Device &amp; Model</th>
                    <th className="py-3 px-3">OS &amp; Browser</th>
                    <th className="py-3 px-3">Location (Approx.)</th>
                    <th className="py-3 px-3">Duration / Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                  {(liveData.onlineVisitors || []).map((v) => (
                    <tr key={v.session_id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white">
                              {String(v.visitor_id).substring(0, 14)}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              Session: {String(v.session_id).substring(0, 12)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            v.is_returning
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          }`}
                        >
                          {v.is_returning ? "Returning" : "New"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {v.current_page}
                        {v.previous_page && (
                          <div className="text-[10px] text-neutral-400 font-normal">
                            from {v.previous_page}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono">{v.landing_page}</div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                          {v.referrer || v.traffic_source || "Direct"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">
                          {v.device_type} &bull; {v.device_brand || "Unknown"}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Model: {v.device_model || "Unknown"} ({v.screen_resolution || "Unknown"})
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">
                          {v.operating_system}{" "}
                          {v.os_version && v.os_version !== "Unknown" ? v.os_version : ""}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {v.browser}{" "}
                          {v.browser_version && v.browser_version !== "Unknown"
                            ? `v${v.browser_version}`
                            : ""}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">
                          {v.city}, {v.province}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {v.region}, {v.country} ({v.country_code})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold">{formatDuration(v.duration_seconds)}</div>
                        <div className="text-[10px] text-neutral-400">
                          {v.pageviews_count} pageview(s) &bull; {formatRelativeTime(v.last_activity_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently Ended / Historical Sessions */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
              Recently Ended &amp; Past Visitor Sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-[11px] font-mono uppercase text-neutral-500">
                    <th className="py-2.5 px-3">Visitor / Session</th>
                    <th className="py-2.5 px-3">Last Page</th>
                    <th className="py-2.5 px-3">Device / OS / Browser</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Views / Duration</th>
                    <th className="py-2.5 px-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                  {(liveData.recentlyEndedSessions || dashboardData?.live?.recentSessions || []).map(
                    (s) => (
                      <tr key={s.session_id}>
                        <td className="py-2.5 px-3 font-mono">
                          {String(s.visitor_id).substring(0, 14)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{s.current_page}</td>
                        <td className="py-2.5 px-3">
                          {s.device_type} ({s.device_brand}) &bull; {s.operating_system} &bull;{" "}
                          {s.browser}
                        </td>
                        <td className="py-2.5 px-3">
                          {s.city}, {s.province}, {s.country_code}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {s.pageviews_count} views ({formatDuration(s.duration_seconds)})
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {formatRelativeTime(s.ended_at || s.last_activity_at)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 3: GLOBAL GEOGRAPHIC ANALYTICS
         ===================================================================== */}
      {activeSubSection === "geographic" && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Interactive Global Geographic Map
                </h3>
                <p className="text-xs text-neutral-500">
                  IP-based approximate geolocation across continents, countries, regions, provinces/states, and cities
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCsv("geographic")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-extrabold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Geographic CSV</span>
              </button>
            </div>

            <AnalyticsWorldMap
              countries={charts.countries || []}
              cities={charts.cities || []}
              selectedCountry={selectedCountry}
              onSelectCountry={(code) => setSelectedCountry(code)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Countries */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">Visitors by Country</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                      <th className="py-2">Country</th>
                      <th className="py-2">Continent</th>
                      <th className="py-2">Visitors</th>
                      <th className="py-2">Sessions</th>
                      <th className="py-2">Pageviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                    {(charts.countries || []).map((c, idx) => (
                      <tr
                        key={idx}
                        onClick={() =>
                          setSelectedCountry(
                            selectedCountry === c.country_code ? "all" : c.country_code
                          )
                        }
                        className="hover:bg-amber-500/10 cursor-pointer"
                      >
                        <td className="py-2.5 font-bold">
                          {c.country} ({c.country_code})
                        </td>
                        <td className="py-2.5 text-neutral-500">{c.continent}</td>
                        <td className="py-2.5 font-mono font-bold">{c.visitors}</td>
                        <td className="py-2.5 font-mono">{c.sessions}</td>
                        <td className="py-2.5 font-mono">{c.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Regions & Provinces/States */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">Top Provinces, States &amp; Regions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                      <th className="py-2">Province / State</th>
                      <th className="py-2">Region</th>
                      <th className="py-2">Country</th>
                      <th className="py-2">Visitors</th>
                      <th className="py-2">Pageviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                    {(charts.provinces || []).map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold">{p.province}</td>
                        <td className="py-2.5 text-neutral-500">{p.region}</td>
                        <td className="py-2.5">{p.country_code}</td>
                        <td className="py-2.5 font-mono font-bold">{p.visitors}</td>
                        <td className="py-2.5 font-mono">{p.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">Visitors by Continent</h4>
              <DistributionBarList
                items={charts.continents || []}
                labelKey="continent"
                valueKey="visitors"
              />
            </div>

            <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">Top Cities &amp; Municipalities</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                      <th className="py-2">City / Municipality</th>
                      <th className="py-2">Province / State</th>
                      <th className="py-2">Region</th>
                      <th className="py-2">Country</th>
                      <th className="py-2">Visitors</th>
                      <th className="py-2">Pageviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                    {(charts.cities || []).map((ct, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold">{ct.city}</td>
                        <td className="py-2.5">{ct.province}</td>
                        <td className="py-2.5 text-neutral-500">{ct.region}</td>
                        <td className="py-2.5">{ct.country}</td>
                        <td className="py-2.5 font-mono font-bold">{ct.visitors}</td>
                        <td className="py-2.5 font-mono">{ct.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 4: DEVICES, OPERATING SYSTEMS & BROWSERS
         ===================================================================== */}
      {activeSubSection === "devices" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Classification */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">
                  Device Classification (Desktop / Mobile / Tablet / Laptop)
                </h4>
                <Smartphone className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList items={charts.devices || []} labelKey="name" valueKey="sessions" />
            </div>

            {/* Operating Systems */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">Operating System Distribution</h4>
                <Cpu className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList
                items={charts.operatingSystems || []}
                labelKey="name"
                valueKey="sessions"
              />
            </div>

            {/* Browsers */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">Browser Distribution</h4>
                <Compass className="w-4 h-4 text-amber-500" />
              </div>
              <DistributionBarList items={charts.browsers || []} labelKey="name" valueKey="sessions" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Device Brands & Models Table */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm">
                    Device Brand, Manufacturer &amp; Model Telemetry
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Collected via User-Agent &amp; Client Hints. Displays &quot;Unknown&quot; when browser privacy shields exact sub-models.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv("devices")}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 text-xs font-bold text-amber-500 cursor-pointer"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                      <th className="py-2">Device Type</th>
                      <th className="py-2">Brand / Manufacturer</th>
                      <th className="py-2">Detected Model</th>
                      <th className="py-2">Visitors</th>
                      <th className="py-2">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                    {(charts.deviceModels || []).map((dm, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold">{dm.device_type}</td>
                        <td className="py-2.5">{dm.brand}</td>
                        <td className="py-2.5 font-mono text-neutral-500">{dm.model}</td>
                        <td className="py-2.5 font-mono">{dm.visitors}</td>
                        <td className="py-2.5 font-mono font-bold">{dm.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OS Versions & Screen Resolutions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
                <h4 className="font-extrabold text-sm">OS Family &amp; Version Breakdown</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(charts.osVersions || []).map((osv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-200/50 dark:border-white/5"
                    >
                      <span className="font-bold">
                        {osv.name}{" "}
                        <span className="font-mono text-neutral-400">({osv.version})</span>
                      </span>
                      <span className="font-mono font-bold">{osv.sessions} sessions</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
                <h4 className="font-extrabold text-sm">Screen Resolutions</h4>
                <DistributionBarList
                  items={charts.screenResolutions || []}
                  labelKey="resolution"
                  valueKey="sessions"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 5: TRAFFIC ACQUISITION SOURCES
         ===================================================================== */}
      {activeSubSection === "sources" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm">
              Traffic Acquisition Channels (Organic, Direct, Social, Referral, Paid)
            </h4>
            <DistributionBarList
              items={charts.trafficSources || []}
              labelKey="source"
              valueKey="sessions"
            />
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm">Top Referrer Domains &amp; Campaigns</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                    <th className="py-2">Referrer Domain</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2">Campaign (UTM)</th>
                    <th className="py-2">Visitors</th>
                    <th className="py-2">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                  {(charts.referrers || []).map((ref, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-mono font-bold">{ref.referrer_domain}</td>
                      <td className="py-2.5">{ref.traffic_source}</td>
                      <td className="py-2.5 text-neutral-400">{ref.utm_campaign || "—"}</td>
                      <td className="py-2.5 font-mono">{ref.visitors}</td>
                      <td className="py-2.5 font-mono font-bold">{ref.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 6: PAGES & CONTENT PERFORMANCE
         ===================================================================== */}
      {activeSubSection === "content" && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Most Visited Website Pages &amp; Engagement Depth
                </h3>
                <p className="text-xs text-neutral-500">
                  Pageviews, unique visitors, average time on page, and average scroll depth across all website routes
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCsv("content")}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-extrabold cursor-pointer"
              >
                Export Content CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase text-neutral-500">
                    <th className="py-2.5">Page Path</th>
                    <th className="py-2.5">Section</th>
                    <th className="py-2.5">Total Views</th>
                    <th className="py-2.5">Unique Visitors</th>
                    <th className="py-2.5">Avg. Time on Page</th>
                    <th className="py-2.5">Avg. Scroll Depth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                  {(contentPerf.topPages || []).map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {p.page_path}
                      </td>
                      <td className="py-2.5 uppercase text-[10px] font-bold text-neutral-500">
                        {p.page_category}
                      </td>
                      <td className="py-2.5 font-mono font-extrabold">{p.views}</td>
                      <td className="py-2.5 font-mono">{p.unique_visitors}</td>
                      <td className="py-2.5 font-mono">{formatDuration(p.avg_time_seconds)}</td>
                      <td className="py-2.5 font-mono">{p.avg_scroll_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Viewed Blog Posts */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">Most Viewed Blog &amp; Project Updates</h4>
              <div className="space-y-2.5">
                {(contentPerf.topBlogPosts || []).map((post) => (
                  <div
                    key={post.post_id}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{post.title}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">/blog/{post.slug}</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="font-extrabold text-amber-500">{post.view_count} views</div>
                      <div className="text-[10px] text-neutral-400">{post.likes_count} reactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Projects & Engagement Events */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm">
                Portfolio Projects &amp; Interactive Engagement Events
              </h4>
              <div className="space-y-2.5">
                {(contentPerf.events || []).length > 0
                  ? contentPerf.events.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold">{ev.event_name}</span>
                          <span className="ml-2 text-neutral-400">({ev.label})</span>
                        </div>
                        <span className="font-mono font-bold text-amber-500">
                          {ev.count} interactions
                        </span>
                      </div>
                    ))
                  : (contentPerf.topProjects || []).map((proj) => (
                      <div
                        key={proj.project_id}
                        className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold">{proj.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            {proj.category} &bull; {proj.location}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold">
                          Active Showcase
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 7: ENGAGEMENT ANALYTICS
         ===================================================================== */}
      {activeSubSection === "engagement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm">New vs. Returning Visitors</h4>
            <div className="text-3xl font-extrabold text-neutral-950 dark:text-white">
              {kpis.newPercentage ?? 0}% New / {kpis.returningPercentage ?? 0}% Returning
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-sky-500"
                style={{ width: `${kpis.newPercentage || 50}%` }}
                title="New Visitors"
              />
              <div
                className="h-full bg-amber-500"
                style={{ width: `${kpis.returningPercentage || 50}%` }}
                title="Returning Visitors"
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>New Visitors: {kpis.newVisitors ?? 0}</span>
              <span>Returning Visitors: {kpis.returningVisitors?.current ?? 0}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm">Engaged Sessions vs. Bounce Rate</h4>
            <div className="text-3xl font-extrabold text-emerald-500">
              {kpis.engagementRate ?? 0}% Engaged
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${kpis.engagementRate || 50}%` }}
              />
              <div
                className="h-full bg-red-500/70"
                style={{ width: `${kpis.bounceRate?.current || 50}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Engaged Sessions: {kpis.engagedSessions ?? 0}</span>
              <span>Bounce Rate: {kpis.bounceRate?.current ?? 0}%</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm">Session Depth &amp; Duration</h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5">
                <div className="text-[10px] font-mono uppercase text-neutral-400">
                  Avg Duration
                </div>
                <div className="text-xl font-extrabold text-amber-500 mt-1">
                  {formatDuration(kpis.avgSessionDuration?.current ?? 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5">
                <div className="text-[10px] font-mono uppercase text-neutral-400">
                  Pages / Session
                </div>
                <div className="text-xl font-extrabold text-amber-500 mt-1">
                  {kpis.avgPagesPerSession?.current ?? 1}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-SECTION 8: REPORTS, EXPORTS & PRIVACY GOVERNANCE
         ===================================================================== */}
      {activeSubSection === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Report Generators & CSV / PDF Exports */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Generate &amp; Export Analytics Reports
                </h3>
                <p className="text-xs text-neutral-500">
                  Download aggregated datasets in CSV format or generate an Executive PDF / Printable summary
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdfReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  id: "traffic",
                  title: "Traffic & Session Report",
                  desc: "Daily unique visitors, new vs returning visitors, sessions, pageviews, and average session duration.",
                },
                {
                  id: "geographic",
                  title: "Worldwide Geographic Report",
                  desc: "Continent, country, region, province/state, city, and timezone breakdown.",
                },
                {
                  id: "devices",
                  title: "Device & Hardware Report",
                  desc: "Desktop, Mobile, Tablet, Laptop classification, device brand, manufacturer, model, and screen resolution.",
                },
                {
                  id: "os",
                  title: "Operating System Report",
                  desc: "Windows, macOS, Android, iOS, Linux, ChromeOS distribution and OS version statistics.",
                },
                {
                  id: "browsers",
                  title: "Browser Distribution Report",
                  desc: "Chrome, Safari, Edge, Firefox, Opera, Samsung Internet, Brave family and version share.",
                },
                {
                  id: "content",
                  title: "Content & Page Performance Report",
                  desc: "Most visited website pages, unique viewers, average time on page, and scroll depth.",
                },
              ].map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 flex flex-col justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                      {rep.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1">{rep.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCsv(rep.id)}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white dark:bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-200 dark:border-white/10 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV ({range})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Privacy & Data Retention Controls */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                Privacy, Consent &amp; Data Retention
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Configured for strict compliance with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong> and <strong>GDPR</strong>. Raw IP addresses are immediately truncated in memory before storage, and no passwords, form contents, or invasive fingerprints are ever collected.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Analytics Data Retention Period (Days)
                </label>
                <select
                  value={privacySettings.retentionDays}
                  onChange={(e) =>
                    setPrivacySettings((p) => ({
                      ...p,
                      retentionDays: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days (Recommended)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold cursor-pointer">
                <span>Anonymize &amp; Truncate Visitor IP (/24 Masking)</span>
                <input
                  type="checkbox"
                  checked={privacySettings.anonymizeIp !== false}
                  onChange={(e) =>
                    setPrivacySettings((p) => ({ ...p, anonymizeIp: e.target.checked }))
                  }
                  className="accent-amber-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold cursor-pointer">
                <span>Display Public Privacy &amp; Consent Notice</span>
                <input
                  type="checkbox"
                  checked={privacySettings.consentBannerEnabled !== false}
                  onChange={(e) =>
                    setPrivacySettings((p) => ({
                      ...p,
                      consentBannerEnabled: e.target.checked,
                    }))
                  }
                  className="accent-amber-500 w-4 h-4"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSavePrivacySettings(false)}
                  disabled={savingSettings}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs cursor-pointer"
                >
                  Save Policy
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrivacySettings(true)}
                  disabled={savingSettings}
                  className="py-2.5 px-3 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-500 font-bold text-xs cursor-pointer"
                >
                  Purge Expired Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
