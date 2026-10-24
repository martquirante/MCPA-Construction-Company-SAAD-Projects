"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  X,
  History,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  CalendarDays,
  HardHat,
  LayoutGrid,
  Table as TableIcon,
  Check,
  FileCheck,
  FileText,
  Printer,
  PenTool,
  ExternalLink,
  Shield,
  Download,
} from "lucide-react";
import authFetch from "@/modules/shared/authFetch";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";

function ClientAvatar({ client, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = useMemo(() => {
    return resolveClientAvatar({
      ...client,
      clientName: client?.client_name,
      clientEmail: client?.client_email,
    });
  }, [client]);

  const isGoogle =
    client?.auth_provider === "google";

  const sizeClasses = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  }[size] || "w-9 h-9 text-xs";

  const initials = (client?.client_name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl && !imgError ? (
        <img
          key={avatarUrl || client?.client_project_id || "avatar"}
          src={avatarUrl}
          alt={client?.client_name || "Client"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`${sizeClasses} rounded-full object-cover border border-amber-500/30 shadow-xs`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-white/[0.08] dark:to-white/[0.02] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-bold items-center justify-center font-mono uppercase shadow-xs flex`}
        >
          {initials}
        </div>
      )}
      {isGoogle && (size === "md" || size === "lg") && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs"
          title="Google Account Verified"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
        </span>
      )}
    </div>
  );
}

function StaffAvatar({ staff }) {
  const name = staff?.full_name || staff?.name || "Admin";
  const initials = name.replace(/^Engr\.\s*/i, "").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return staff?.avatar_url ? (
    <img src={staff.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-amber-500/30" />
  ) : (
    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 text-[9px] font-bold inline-flex items-center justify-center">
      {initials || "AD"}
    </span>
  );
}

function processSignatureImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const maxHeight = 500;
        const scale = Math.min(
          1,
          maxWidth / image.naturalWidth,
          maxHeight / image.naturalHeight
        );
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const brightness = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
          if (brightness > 220) {
            pixels.data[i + 3] = 0;
          } else {
            pixels.data[i] = 0;
            pixels.data[i + 1] = 0;
            pixels.data[i + 2] = 0;
            pixels.data[i + 3] = Math.min(255, Math.max(0, (220 - brightness) * 3));
          }
        }
        ctx.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("Could not read signature image."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not load signature image."));
    reader.readAsDataURL(file);
  });
}

async function readJsonResponse(response) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return {
      success: false,
      message: `Request failed with status ${response.status}.`,
    };
  }

  try {
    return JSON.parse(responseText);
  } catch {
    console.error("Expected JSON response but received:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: responseText.slice(0, 500),
    });
    return {
      success: false,
      message:
        response.status >= 500
          ? "The server could not process the signature. Please try again with a smaller, clearer signature image."
          : "The server returned an invalid response. Please try again.",
    };
  }
}

// Live ticking countdown timer component for an individual target date
function LiveCountdownTicker({ targetDate, isCompleted = false, compact = false }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isPast: false,
        });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
        No date scheduled
      </span>
    );
  }

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Ceremony Concluded</span>
      </span>
    );
  }

  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-500">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span>Ceremony Day Reached</span>
      </span>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 font-mono text-xs">
        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold">
          {timeLeft.days}d
        </span>
        <span className="text-neutral-400 font-bold">:</span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold">
          {String(timeLeft.hours).padStart(2, "0")}h
        </span>
        <span className="text-neutral-400 font-bold">:</span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        <span className="text-neutral-400 font-bold">:</span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <div className="px-2 py-1 rounded bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-bold">
        {timeLeft.days}d
      </div>
      <span className="text-neutral-400 font-bold">:</span>
      <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold">
        {String(timeLeft.hours).padStart(2, "0")}h
      </div>
      <span className="text-neutral-400 font-bold">:</span>
      <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold">
        {String(timeLeft.minutes).padStart(2, "0")}m
      </div>
      <span className="text-neutral-400 font-bold">:</span>
      <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold">
        {String(timeLeft.seconds).padStart(2, "0")}s
      </div>
    </div>
  );
}

const COMMON_RESCHEDULE_REASONS = [
  "Typhoon advisory & heavy rainfall causing saturated soil",
  "Municipal LGU building permit evaluation extended",
  "Parish priest & liturgical officiant availability rescheduled",
  "Site excavation, grading & access road completed ahead of schedule",
  "Client family auspicious date preference (Bulacan tradition)",
  "Geotechnical foundation inspection clearance pending",
];

const STATUS_FILTER_OPTIONS = [
  { id: "ALL", label: "All Projects & Ceremonies", icon: CalendarCheck, color: "text-amber-500" },
  { id: "AWAITING_COUNTERSIGN", label: "Contracts Awaiting Sign", icon: FileCheck, color: "text-amber-500" },
  { id: "UPCOMING", label: "Upcoming Kickoffs", icon: Clock, color: "text-emerald-500" },
  { id: "RESCHEDULED", label: "Rescheduled / Delayed", icon: AlertTriangle, color: "text-amber-500" },
  { id: "PENDING", label: "Awaiting Schedule", icon: Calendar, color: "text-neutral-400" },
  { id: "COMPLETED", label: "Completed Kickoffs", icon: CheckCircle2, color: "text-sky-500" },
];

// Custom Combobox Component for Groundbreaking Filter
function GroundbreakingFilterCombobox({
  selectedFilter = "ALL",
  onSelectFilter,
  metrics = {},
  totalCount = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const activeOption =
    STATUS_FILTER_OPTIONS.find((o) => o.id === selectedFilter) || STATUS_FILTER_OPTIONS[0];

  const getCount = (id) => {
    if (id === "ALL") return totalCount;
    if (id === "AWAITING_COUNTERSIGN") return metrics.awaitingCountersign || 0;
    if (id === "UPCOMING") return metrics.scheduled;
    if (id === "RESCHEDULED") return metrics.rescheduled;
    if (id === "PENDING") return metrics.pending;
    if (id === "COMPLETED") return metrics.completed || 0;
    return 0;
  };

  const ActiveIcon = activeOption.icon;

  return (
    <div className="relative shrink-0 select-none" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-between gap-2.5 px-3.5 py-2 h-[38px] rounded-[10px] text-xs font-mono border transition-all cursor-pointer shadow-xs ${
          isOpen
            ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-neutral-950 dark:text-white ring-1 ring-amber-500/20"
            : selectedFilter !== "ALL"
            ? "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 text-neutral-900 dark:text-neutral-100 hover:border-amber-500"
            : "bg-white dark:bg-[#101218] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-neutral-950 dark:hover:text-white"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ActiveIcon className={`w-3.5 h-3.5 ${activeOption.color} shrink-0`} />
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider hidden sm:inline">
            Status:
          </span>
          <span className="font-bold tracking-tight uppercase truncate">
            {activeOption.label}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
            {getCount(selectedFilter)}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-amber-500" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-[12px] bg-white dark:bg-[#12151c] border border-neutral-200 dark:border-white/10 shadow-xl py-1.5 z-40 animate-fade-in text-xs font-mono">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-white/5">
            Filter by Ceremony Status
          </div>
          <div className="p-1 space-y-0.5">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedFilter === opt.id;
              const count = getCount(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectFilter(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                    <span>{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                      {count}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGroundbreakingTab({
  currentUser,
  allProjects = [],
  showToast,
}) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | UPCOMING | RESCHEDULED | PENDING | COMPLETED
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Active modal state
  const [activeModalProject, setActiveModalProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formDate, setFormDate] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formOfficiant, setFormOfficiant] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formStatus, setFormStatus] = useState("SCHEDULED");

  // Contract Modal State (Dual E-Signature & Review)
  const [contractModalProject, setContractModalProject] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [contractorSignerName, setContractorSignerName] = useState(
    currentUser?.fullName || currentUser?.name || "Engr. Raymart Quirante"
  );
  const [contractorTitle, setContractorTitle] = useState(
    "Authorized Managing Officer, M.C.P.A. Design & Construction"
  );
  const [contractorSignatureData, setContractorSignatureData] = useState("");
  const [adminSignMode, setAdminSignMode] = useState("draw"); // "type" | "draw"
  const [isAdminSignModalOpen, setIsAdminSignModalOpen] = useState(false);
  const adminSigCanvasRef = useRef(null);
  const [isAdminDrawing, setIsAdminDrawing] = useState(false);
  const [hasAdminDrawnSig, setHasAdminDrawnSig] = useState(false);
  const [uploadedSignatureData, setUploadedSignatureData] = useState("");
  const [adminAccounts, setAdminAccounts] = useState([]);

  useEffect(() => {
    let active = true;
    authFetch("/api/admin/accounts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.accounts)) return;
        const staff = data.accounts.filter((account) =>
          ["admin", "super_admin", "engineer"].includes(account.role) ||
          (account.full_name || "").toLowerCase().includes("engr")
        );
        setAdminAccounts(staff);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Admin Canvas drawing handlers with resolution scaling
  const getAdminCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 460);
    const scaleY = canvas.height / (rect.height || 180);
    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startAdminDrawing = (e) => {
    const canvas = adminSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getAdminCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsAdminDrawing(true);
    setHasAdminDrawnSig(true);
  };

  const drawAdmin = (e) => {
    if (!isAdminDrawing) return;
    const canvas = adminSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getAdminCanvasCoords(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopAdminDrawing = () => setIsAdminDrawing(false);

  const clearAdminSignature = () => {
    const canvas = adminSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasAdminDrawnSig(false);
    setUploadedSignatureData("");
  };

  const handleSignatureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast?.("Please upload an image file for the signature.", "error");
      return;
    }
    try {
      const processedSignature = await processSignatureImage(file);
      const canvas = adminSigCanvasRef.current;
      if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
      setUploadedSignatureData(processedSignature);
      setHasAdminDrawnSig(true);
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      event.target.value = "";
    }
  };

  // Advance to Stage 3 State
  const [isAdvancingId, setIsAdvancingId] = useState(null);

  // Expanded history drawer per project ID
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Load authoritative groundbreaking projects
  const fetchGroundbreakingOverview = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await authFetch("/api/admin/groundbreaking/overview");
      if (res.ok) {
        const data = await readJsonResponse(res);
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      }
    } catch (e) {
      console.warn("fetchGroundbreakingOverview error:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroundbreakingOverview();
  }, [fetchGroundbreakingOverview]);

  // Open schedule/reschedule modal
  const handleOpenScheduleModal = (proj) => {
    setActiveModalProject(proj);

    // Format ISO string to datetime-local format only if already set in database
    let initialDate = "";
    if (proj.groundbreaking_date) {
      const d = new Date(proj.groundbreaking_date);
      const pad = (n) => String(n).padStart(2, "0");
      initialDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    }

    // Absolutely no pre-filled values by default - user/admin fills them in
    setFormDate(initialDate);
    setFormVenue(proj.groundbreaking_venue || "");
    setFormOfficiant(proj.groundbreaking_officiant || "");
    setFormNotes(proj.groundbreaking_notes || "");
    setFormReason("");
    setFormStatus(
      proj.groundbreaking_status && proj.groundbreaking_status !== "PENDING"
        ? proj.groundbreaking_status
        : "SCHEDULED"
    );
  };

  const handleCloseModal = () => {
    setActiveModalProject(null);
    setIsSaving(false);
  };

  // Quick offset helpers for rescheduling (+3 days, +5 days, +7 days, -3 days)
  const applyDateOffset = (days) => {
    if (!formDate) return;
    const current = new Date(formDate);
    current.setDate(current.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    const updated = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(
      current.getDate()
    )}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
    setFormDate(updated);
  };

  // Calculate day difference dynamically in modal
  const dayShiftCalculated = useMemo(() => {
    if (!activeModalProject?.groundbreaking_date || !formDate) return 0;
    const oldMs = new Date(activeModalProject.groundbreaking_date).getTime();
    const newMs = new Date(formDate).getTime();
    return Math.round((newMs - oldMs) / (1000 * 60 * 60 * 24));
  }, [activeModalProject, formDate]);

  // Submit schedule / reschedule
  const handleSaveSchedule = async (e) => {
    e?.preventDefault();
    if (!activeModalProject || !formDate) {
      showToast?.("Please pick a valid ceremony date and time.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await authFetch(
        `/api/projects/${activeModalProject.client_project_id}/groundbreaking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groundbreakingDate: new Date(formDate).toISOString(),
            venue: formVenue,
            officiant: formOfficiant,
            notes: formNotes,
            status: formStatus,
            rescheduleReason: formReason,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(
          dayShiftCalculated !== 0 && activeModalProject.groundbreaking_date
            ? `Groundbreaking rescheduled successfully (${
                dayShiftCalculated > 0 ? `+${dayShiftCalculated}d delay` : `${dayShiftCalculated}d advanced`
              })`
            : "Groundbreaking ceremony officially locked in and client dashboard updated!",
          "success"
        );
        handleCloseModal();
        fetchGroundbreakingOverview();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mcpa-groundbreaking-updated"));
        }
      } else {
        showToast?.(data.message || "Failed to save schedule.", "error");
      }
    } catch (err) {
      console.error("handleSaveSchedule error:", err);
      showToast?.("Network error while saving groundbreaking date.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Contract Modal (Fetches authoritative contract and dual signatures)
  const handleOpenContractModal = async (proj) => {
    setContractModalProject(proj);
    setIsLoadingContract(true);
    setContractData(null);
    setContractorSignatureData("");
    try {
      const res = await authFetch(`/api/projects/${proj.client_project_id}/contract`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.contract) {
          setContractData(data.contract);
        }
      }
    } catch (e) {
      console.warn("handleOpenContractModal error:", e);
    } finally {
      setIsLoadingContract(false);
    }
  };

  const handleCloseContractModal = () => {
    setContractModalProject(null);
    setContractData(null);
    setIsSigningContract(false);
  };

  // Sign Contract as Contractor (Admin / Authorized Managing Officer)
  const handleSignContractAsAdmin = async (e) => {
    e?.preventDefault?.();
    if (!contractData?.contract_id) {
      showToast?.("No active contract loaded for this project.", "error");
      return;
    }

    let signatureValue = uploadedSignatureData || contractorSignatureData?.trim();
    if (!uploadedSignatureData && adminSigCanvasRef.current && hasAdminDrawnSig) {
      signatureValue = adminSigCanvasRef.current.toDataURL("image/png");
    } else if (!signatureValue && !hasAdminDrawnSig) {
      signatureValue = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><text x="10" y="50" font-family="serif" font-style="italic" font-size="28" font-weight="bold" fill="%230f172a">${encodeURIComponent(contractorSignerName || "Engr. Raymart Quirante")}</text></svg>`;
    }

    setIsSigningContract(true);
    try {
      const res = await authFetch(`/api/contracts/${contractData.contract_id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: contractModalProject?.client_project_id,
          signerRole: "CONTRACTOR",
          signerName: contractorSignerName || "Engr. Raymart Quirante",
          signerEmail: currentUser?.email || "legal@mcpabuilders.com",
          signatureImageUrl: signatureValue,
          signatureData: signatureValue,
        }),
      });
      const data = await readJsonResponse(res);
      if (res.ok && data.success && data.contract) {
        setContractData(data.contract);
        setIsAdminSignModalOpen(false);
        showToast?.(
          data.contract.status === "FULLY_EXECUTED"
            ? "Turnkey Contract is now FULLY EXECUTED with dual verified signatures & SHA-256 seal!"
            : "Turnkey Contract signed as Contractor Representative!",
          "success"
        );
        fetchGroundbreakingOverview();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("mcpa-contract-updated"));
        }
      } else {
        showToast?.(data.message || "Failed to sign contract", "error");
      }
    } catch (err) {
      console.error("handleSignContractAsAdmin error:", err);
      showToast?.(err.message || "Network error signing contract", "error");
    } finally {
      setIsSigningContract(false);
    }
  };

  // Direct Advance to Stage 3 (Active Build) with confirmation
  const handleAdvanceToStage3 = async (proj) => {
    const confirmMsg = `Advance project ${proj.project_code || ""} (${proj.client_name || "Client"}) to Stage 3: Active Build / Site Execution?\n\nThis will initialize physical site mobilization, activate the Live Site Stepper, and unlock the Site Progress Hub on the Client Portal.`;
    if (!window.confirm(confirmMsg)) return;

    setIsAdvancingId(proj.client_project_id);
    try {
      const res = await authFetch(
        `/api/admin/projects/${proj.client_project_id}/advance-stage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetStage: "ACTIVE_BUILD",
            reason: "Groundbreaking ceremony concluded. Mobilizing site resources for Active Build.",
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(
          `Project ${proj.project_code} successfully advanced to Stage 3 (Active Build)!`,
          "success"
        );
        fetchGroundbreakingOverview();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mcpa-project-stage-updated"));
        }
      } else {
        showToast?.(data.message || "Failed to advance stage", "error");
      }
    } catch (err) {
      console.error("handleAdvanceToStage3 error:", err);
      showToast?.(err.message || "Error advancing project to Stage 3", "error");
    } finally {
      setIsAdvancingId(null);
    }
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = (p.client_name || "").toLowerCase().includes(q);
        const matchesCode = (p.project_code || "").toLowerCase().includes(q);
        const matchesTitle = (p.project_title || "").toLowerCase().includes(q);
        const matchesLoc = (p.target_location || p.location || "").toLowerCase().includes(q);
        if (!matchesClient && !matchesCode && !matchesTitle && !matchesLoc) return false;
      }

      // Status filter
      if (statusFilter === "AWAITING_COUNTERSIGN") {
        return Boolean(p.has_client_contract_signature && !p.has_contractor_contract_signature);
      }
      if (statusFilter === "UPCOMING") {
        if (!p.groundbreaking_date) return false;
        const isUpcoming = new Date(p.groundbreaking_date).getTime() > Date.now();
        const isNotDone = p.groundbreaking_status !== "COMPLETED";
        return isUpcoming && isNotDone;
      }
      if (statusFilter === "RESCHEDULED") {
        return (
          p.groundbreaking_status === "RESCHEDULED" ||
          (p.groundbreaking_rescheduled_count && p.groundbreaking_rescheduled_count > 0)
        );
      }
      if (statusFilter === "PENDING") {
        return !p.groundbreaking_date || p.groundbreaking_status === "PENDING";
      }
      if (statusFilter === "COMPLETED") {
        return p.groundbreaking_status === "COMPLETED";
      }

      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  // Aggregate metric counters
  const metrics = useMemo(() => {
    const total = projects.length;
    const awaitingCountersign = projects.filter(
      (p) => p.has_client_contract_signature && !p.has_contractor_contract_signature
    ).length;
    const scheduled = projects.filter(
      (p) => p.groundbreaking_date && p.groundbreaking_status !== "COMPLETED"
    ).length;
    const imminent7Days = projects.filter((p) => {
      if (!p.groundbreaking_date || p.groundbreaking_status === "COMPLETED") return false;
      const diff = new Date(p.groundbreaking_date).getTime() - Date.now();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const rescheduled = projects.filter(
      (p) =>
        p.groundbreaking_status === "RESCHEDULED" || (p.groundbreaking_rescheduled_count || 0) > 0
    ).length;
    const pending = projects.filter(
      (p) => !p.groundbreaking_date || p.groundbreaking_status === "PENDING"
    ).length;
    const completed = projects.filter((p) => p.groundbreaking_status === "COMPLETED").length;

    return { total, awaitingCountersign, scheduled, imminent7Days, rescheduled, pending, completed };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & BREADCRUMB                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1">
            <span>Stage 2: Consultation &amp; Planning</span>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Legal Contracts &amp; Site Kickoff Hub</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>Contracts &amp; Groundbreaking Kickoff</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Review and countersign Master Turnkey Construction Contracts with SHA-256 digital seals, and schedule auspicious site blessings &amp; liturgical groundbreaking ceremonies for Stage 2 projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchGroundbreakingOverview}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 hover:border-amber-500/40 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Schedule</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. METRIC CARDS (HUMAN-DESIGNED HIGH INFORMATION DENSITY)    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter(statusFilter === "AWAITING_COUNTERSIGN" ? "ALL" : "AWAITING_COUNTERSIGN")}
          className={`p-4 rounded-[14px] border shadow-xs cursor-pointer transition-all ${
            metrics.awaitingCountersign > 0
              ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15 ring-1 ring-amber-500/30"
              : "bg-white dark:bg-[#101218] border-neutral-200/80 dark:border-white/10"
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1 font-bold flex items-center justify-between">
            <span>Contracts to Sign</span>
            {metrics.awaitingCountersign > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.awaitingCountersign}
            </span>
            <span className="text-[10px] font-mono text-amber-600/80 font-bold">
              {metrics.awaitingCountersign > 0 ? "Action Required" : "All Signed"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
            Stage 2 Clients
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Total In Pipeline</span>
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 font-bold">
            Locked &amp; Scheduled
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.scheduled}
            </span>
            {metrics.imminent7Days > 0 ? (
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                {metrics.imminent7Days} Imminent (&lt;7d)
              </span>
            ) : (
              <span className="text-[11px] font-mono text-neutral-400">Countdown Active</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1 font-bold">
            Rescheduled / Adjusted
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.rescheduled}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Weather / Permits</span>
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
            Awaiting Kickoff Date
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-neutral-700 dark:text-neutral-300">
              {metrics.pending}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Needs Scheduling</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONTROLS BAR: COMBOBOX + VIEW MODE (TABLE/GRID) + SEARCH  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-100/70 dark:bg-white/[0.03] p-2.5 rounded-[14px] border border-neutral-200/70 dark:border-white/5">
        {/* Left: Status Filter Combobox */}
        <div className="flex items-center gap-2 flex-wrap">
          <GroundbreakingFilterCombobox
            selectedFilter={statusFilter}
            onSelectFilter={(val) => setStatusFilter(val)}
            metrics={metrics}
            totalCount={metrics.total}
          />
        </div>

        {/* Right: Search Input + View Mode Toggle (Table / Grid) */}
        <div className="flex items-center gap-2.5 justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search client, lot, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 h-[38px] rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* View Mode Switcher: Table vs Grid */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#101218] p-1 rounded-[10px] border border-neutral-200 dark:border-white/10 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-amber-500 text-neutral-950 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-amber-500 text-neutral-950 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN CONTENT: TABLE OR GRID VIEW                           */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="p-12 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
            Loading Groundbreaking Ceremonies Database...
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 space-y-3">
          <CalendarDays className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-mono font-bold uppercase text-neutral-800 dark:text-neutral-200">
            No Ceremonies Found Matching Filter
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {searchQuery
              ? `No project matching "${searchQuery}". Try clearing search keywords.`
              : "No projects in this filter. Switch status in the combobox or schedule new dates."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ============================================================ */
        /* OPTION A: TABLE VIEW                                         */
        /* ============================================================ */
        <div className="rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.02] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Client &amp; Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ceremony Date &amp; Time</th>
                  <th className="py-3 px-4">Countdown to Blessing</th>
                  <th className="py-3 px-4">Officiant &amp; Venue</th>
                  <th className="py-3 px-4">Advisory / Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-white/5 text-xs font-mono">
                {filteredProjects.map((p) => {
                  const isScheduled = Boolean(p.groundbreaking_date);
                  const isRescheduled =
                    p.groundbreaking_status === "RESCHEDULED" ||
                    (p.groundbreaking_rescheduled_count && p.groundbreaking_rescheduled_count > 0);
                  const isCompleted = p.groundbreaking_status === "COMPLETED";
                  const historyCount = (p.history || []).length;
                  const isHistoryOpen = expandedHistoryId === p.client_project_id;

                  return (
                    <tr
                      key={p.client_project_id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Client & Project */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ClientAvatar client={p} size="sm" />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-white uppercase truncate block">
                              {p.client_name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                              <span className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                                {p.project_code}
                              </span>
                              <span className="truncate max-w-[150px]">
                                {p.target_location || "Bulacan"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCompleted ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                            Completed
                          </span>
                        ) : isRescheduled ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rescheduled ({p.groundbreaking_rescheduled_count || 1}x)</span>
                          </span>
                        ) : isScheduled ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                            Awaiting Schedule
                          </span>
                        )}
                      </td>

                      {/* Ceremony Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isScheduled ? (
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white block">
                              {new Date(p.groundbreaking_date).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(p.groundbreaking_date).toLocaleTimeString("en-PH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs">Pending</span>
                        )}
                      </td>

                      {/* Countdown to Blessing */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <LiveCountdownTicker
                          targetDate={p.groundbreaking_date}
                          isCompleted={isCompleted}
                          compact={true}
                        />
                      </td>

                      {/* Officiant & Venue */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium block truncate">
                          {p.groundbreaking_officiant || (
                            <span className="text-neutral-400 font-normal italic">Unassigned</span>
                          )}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate block">
                          {p.groundbreaking_venue || p.target_location || (
                            <span className="italic">Not set</span>
                          )}
                        </span>
                      </td>

                      {/* Advisory / Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {p.groundbreaking_notes ? (
                          <span className="text-xs text-amber-700 dark:text-amber-400 truncate block font-sans">
                            {p.groundbreaking_notes}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenContractModal(p)}
                            className={`px-2.5 py-1.5 rounded-[6px] font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 ${
                              p.has_client_contract_signature && !p.has_contractor_contract_signature
                                ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 ring-2 ring-amber-400/40 animate-pulse"
                                : p.has_client_contract_signature && p.has_contractor_contract_signature
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10"
                            }`}
                            title="Review and Countersign Construction Contract"
                          >
                            <FileCheck className="w-3 h-3 text-amber-500" />
                            <span>
                              {p.has_client_contract_signature && !p.has_contractor_contract_signature
                                ? "Client Signed (Sign Now)"
                                : p.has_client_contract_signature && p.has_contractor_contract_signature
                                ? "Executed"
                                : "Contract"}
                            </span>
                          </button>

                          {isScheduled ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(p)}
                              className="px-2.5 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                            >
                              Adjust Date
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(p)}
                              className="px-2.5 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                            >
                              Schedule
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAdvanceToStage3(p)}
                            disabled={isAdvancingId === p.client_project_id}
                            className="px-2.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            title="Mobilize site and advance project to Stage 3 (Active Build)"
                          >
                            <HardHat className="w-3 h-3" />
                            <span>
                              {isAdvancingId === p.client_project_id ? "Advancing..." : "To Stage 3"}
                            </span>
                          </button>

                          {historyCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHistoryId(isHistoryOpen ? null : p.client_project_id)
                              }
                              className="p-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                              title="Audit History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* OPTION B: GRID VIEW (CARDS)                                  */
        /* ============================================================ */
        <div className="space-y-4">
          {filteredProjects.map((p) => {
            const isScheduled = Boolean(p.groundbreaking_date);
            const isRescheduled =
              p.groundbreaking_status === "RESCHEDULED" ||
              (p.groundbreaking_rescheduled_count && p.groundbreaking_rescheduled_count > 0);
            const isCompleted = p.groundbreaking_status === "COMPLETED";
            const historyCount = (p.history || []).length;
            const isHistoryOpen = expandedHistoryId === p.client_project_id;

            return (
              <div
                key={p.client_project_id}
                className="rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-all hover:border-amber-500/30"
              >
                {/* Main Card Header & Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Client & Project Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <ClientAvatar client={p} size="lg" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white uppercase truncate">
                          {p.client_name || "Valued Client"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400">
                          {p.project_code || "PRJ"}
                        </span>
                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                            Completed
                          </span>
                        ) : isRescheduled ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rescheduled ({p.groundbreaking_rescheduled_count || 1}x)</span>
                          </span>
                        ) : isScheduled ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                            Awaiting Schedule
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {p.project_title || "Residential Construction"}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 truncate">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{p.target_location || p.location || "Bulacan"}</span>
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-3">
                        <span>{p.client_email}</span>
                        {p.client_phone && <span>• {p.client_phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Center: Authoritative Ceremony Date & Live Countdown */}
                  <div className="lg:px-6 lg:border-x lg:border-neutral-200/80 dark:lg:border-white/5 space-y-1.5 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                      Target Ceremony &amp; Live Ticker
                    </span>
                    {isScheduled ? (
                      <>
                        <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {new Date(p.groundbreaking_date).toLocaleDateString("en-PH", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            •{" "}
                            {new Date(p.groundbreaking_date).toLocaleTimeString("en-PH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                        <LiveCountdownTicker
                          targetDate={p.groundbreaking_date}
                          isCompleted={isCompleted}
                        />
                      </>
                    ) : (
                      <div className="text-xs font-mono text-neutral-400">
                        Date has not been set yet.
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenContractModal(p)}
                      className={`px-3 py-2 rounded-[8px] font-mono font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        p.has_client_contract_signature && !p.has_contractor_contract_signature
                          ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md ring-2 ring-amber-400/40 animate-pulse"
                          : p.has_client_contract_signature && p.has_contractor_contract_signature
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-white dark:bg-[#12151c] hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                      }`}
                      title="Review Contract and Dual E-Signatures"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>
                        {p.has_client_contract_signature && !p.has_contractor_contract_signature
                          ? "Client Signed (Countersign Now)"
                          : p.has_client_contract_signature && p.has_contractor_contract_signature
                          ? "Contract Executed (View Seal)"
                          : "Review Contract"}
                      </span>
                    </button>

                    {isScheduled ? (
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(p)}
                        className="px-3.5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Adjust Date</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(p)}
                        className="px-3.5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Schedule Date</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAdvanceToStage3(p)}
                      disabled={isAdvancingId === p.client_project_id}
                      className="px-3.5 py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Mobilize site and advance project to Stage 3 (Active Build)"
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      <span>
                        {isAdvancingId === p.client_project_id ? "Advancing..." : "Advance to Stage 3"}
                      </span>
                    </button>

                    {historyCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId(isHistoryOpen ? null : p.client_project_id)
                        }
                        className="p-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                        title="View reschedule history audit trail"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-row: Ceremony Venue, Officiant & Reschedule Explanation */}
                <div className="px-5 py-3 bg-neutral-50/70 dark:bg-white/[0.02] border-t border-neutral-200/60 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-neutral-400 uppercase">Officiant:</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {p.groundbreaking_officiant || (
                          <span className="text-neutral-400 font-normal italic">Unassigned</span>
                        )}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-neutral-400 uppercase">Venue:</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {p.groundbreaking_venue || p.target_location || (
                          <span className="italic">Not set</span>
                        )}
                      </span>
                    </span>
                  </div>

                  {Boolean(p.groundbreaking_notes) && (
                    <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <span className="font-bold uppercase">Note:</span>
                      <span className="truncate max-w-md">{p.groundbreaking_notes}</span>
                    </div>
                  )}
                </div>

                {/* Reschedule Audit History Drawer */}
                {isHistoryOpen && (
                  <div className="p-5 bg-neutral-100/60 dark:bg-white/[0.03] border-t border-neutral-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-amber-500" />
                        <span>Schedule Audit Log &amp; History ({historyCount} Events)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryId(null)}
                        className="text-[10px] font-mono text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      >
                        Collapse
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(p.history || []).map((h, idx) => (
                        <div
                          key={h.history_id || idx}
                          className="p-3 rounded-lg bg-white dark:bg-[#101218] border border-neutral-200/70 dark:border-white/5 text-xs font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <span>
                                {new Date(h.scheduled_date).toLocaleDateString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {h.days_shifted !== 0 && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    h.days_shifted > 0
                                      ? "bg-amber-500/15 text-amber-600"
                                      : "bg-emerald-500/15 text-emerald-600"
                                  }`}
                                >
                                  {h.days_shifted > 0
                                    ? `+${h.days_shifted}d delay`
                                    : `${h.days_shifted}d advanced`}
                                </span>
                              )}
                            </span>
                            <span className="text-neutral-400 text-[10px]">
                              Logged by {h.author_name || "Admin"} •{" "}
                              {new Date(h.created_at).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {h.reschedule_reason && (
                            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] font-sans">
                              Reason: {h.reschedule_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SCHEDULE / RESCHEDULE MODAL (HUMAN CRAFTED, CLEAN)         */}
      {/* ------------------------------------------------------------- */}
      {activeModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-[20px] bg-white dark:bg-[#12151c] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                  Physical Site Kickoff Schedule
                </span>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  {activeModalProject.groundbreaking_date
                    ? "Adjust / Reschedule Ceremony Date"
                    : "Lock In Groundbreaking Ceremony"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4 overflow-y-auto">
              {/* Project Card Context */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block">Client &amp; Lot</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {activeModalProject.client_name} ({activeModalProject.project_code})
                  </span>
                  <span className="text-neutral-500 block text-[11px]">
                    {activeModalProject.target_location || "Bulacan"}
                  </span>
                </div>
                {activeModalProject.groundbreaking_date && (
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase block">Current Date</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {new Date(activeModalProject.groundbreaking_date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold mb-1.5">
                  Official Ceremony Date &amp; Time (Philippine Standard Time)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Quick Offset Buttons (If Rescheduling) */}
              {activeModalProject.groundbreaking_date && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block font-bold">
                    Quick Adjust Offsets:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyDateOffset(3)}
                      className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                    >
                      +3 Days (Rain Delay)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDateOffset(5)}
                      className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                    >
                      +5 Days (Permit Wait)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDateOffset(7)}
                      className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                    >
                      +1 Week (+7 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDateOffset(-3)}
                      className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                    >
                      -3 Days (Advanced Early)
                    </button>
                  </div>
                </div>
              )}

              {/* Day shift indicator badge */}
              {activeModalProject.groundbreaking_date && dayShiftCalculated !== 0 && (
                <div
                  className={`p-3 rounded-lg text-xs font-mono flex items-center justify-between border ${
                    dayShiftCalculated > 0
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {dayShiftCalculated > 0
                        ? `Ceremony delayed / postponed by ${dayShiftCalculated} days`
                        : `Ceremony moved earlier by ${Math.abs(dayShiftCalculated)} days`}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Auto-Synchronized
                  </span>
                </div>
              )}

              {/* Reschedule Reason Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-bold">
                  Reschedule / Scheduling Reason (Visible on Client Dashboard Notice)
                </label>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  {COMMON_RESCHEDULE_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormReason((prev) => (prev === r ? "" : r))}
                      className={`p-2 rounded-lg text-left font-sans transition-colors cursor-pointer border ${
                        formReason === r
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold"
                          : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200/70 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                      }`}
                    >
                      • {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom reason for schedule change..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Officiating Priest & Ceremony Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Officiating Clergy / Celebrant
                  </label>
                  <input
                    type="text"
                    value={formOfficiant}
                    onChange={(e) => setFormOfficiant(e.target.value)}
                    placeholder="Enter officiating priest or clergy (optional)..."
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Ceremony Site / Venue Address
                  </label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="Enter ceremony site / venue address..."
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Site Engineering Preparation Notes &amp; Equipment
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter logistics notes, equipment, or remarks (optional)..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Status:
                </span>
                <div className="flex items-center gap-2">
                  {["SCHEDULED", "RESCHEDULED", "COMPLETED"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                        formStatus === st
                          ? "bg-amber-500 text-neutral-950 border-amber-500 font-extrabold"
                          : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-[10px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Schedule to Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Lock In &amp; Sync to Client Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TURNKEY MASTER CONTRACT AGREEMENT REVIEW & COUNTERSIGNING MODAL (DUAL E-SIGNATURE) */}
      {contractModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl rounded-[20px] bg-white dark:bg-[#12151c] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                      Construction Agreement &amp; Dual Signatures
                    </h3>
                    {contractData?.status === "FULLY_EXECUTED" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Fully Executed
                      </span>
                    ) : contractData?.client_signed_at || contractData?.contractor_signed_at ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase border border-amber-500/30">
                        Partially Executed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono font-bold uppercase">
                        Draft Agreement
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-mono">
                    Project: {contractModalProject.project_code} • Client: {contractModalProject.client_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/projects/${contractModalProject?.client_project_id || contractData?.client_project_id || contractData?.contract_id}/contract/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download or Print Official Vector Contract PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </a>
                <button
                  type="button"
                  onClick={handleCloseContractModal}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isLoadingContract ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                    Loading authoritative contract agreement and digital signatures...
                  </p>
                </div>
              ) : (
                <>
                  {/* Human Word-Style Document Container */}
                  <div className="p-8 sm:p-10 bg-white text-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm font-sans text-xs leading-relaxed space-y-6">
                    {/* Letterhead */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-800">
                      <div className="flex items-center gap-3">
                        <img
                          src="/assets/mcpa-logo-white-bg.png"
                          alt="MCPA Logo"
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div>
                          <h2 className="font-serif text-sm font-bold tracking-wide uppercase text-neutral-900">
                            M.C.P.A. DESIGN &amp; CONSTRUCTION
                          </h2>
                          <p className="text-[10px] text-neutral-600 font-sans">
                            General Building Contractor &amp; Architectural Engineering Consultancy
                          </p>
                          <p className="text-[9px] text-neutral-500 font-mono">
                            Provincial Office: Bulacan, Philippines • contact@mcpadesignbuild.com
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-neutral-500">
                        <div>REF: {contractModalProject.project_code || "MCPA-PRJ"}</div>
                        <div>DATE: {new Date().toLocaleDateString("en-PH")}</div>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center py-2">
                      <h1 className="font-serif text-base font-bold uppercase tracking-wider text-neutral-900">
                        CONSTRUCTION MASTER CONTRACT AGREEMENT
                      </h1>
                      <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-0.5">
                        TURNKEY RESIDENTIAL DESIGN AND CONSTRUCTION
                      </p>
                    </div>

                    {/* Parties Overview */}
                    <div className="space-y-2 border-y border-neutral-200 py-3">
                      <p>
                        <strong>KNOW ALL MEN BY THESE PRESENTS:</strong> This Construction Agreement is entered into by and between:
                      </p>
                      <p className="pl-4">
                        <strong>THE OWNER / FIRST PARTY:</strong>{" "}
                        <span className="font-semibold uppercase">
                          {contractData?.project_meta?.client_name || contractModalProject.client_name || "Valued Client"}
                        </span>
                        , of legal age, Filipino, with contact email at{" "}
                        <span className="font-mono text-neutral-700">
                          {contractData?.project_meta?.client_email || contractModalProject.client_email || "client@email.com"}
                        </span>
                        , herein referred to as the <strong>&quot;OWNER&quot;</strong>;
                      </p>
                      <p className="text-center font-bold text-[10px] uppercase text-neutral-500">- and -</p>
                      <p className="pl-4">
                        <strong>THE CONTRACTOR / SECOND PARTY:</strong>{" "}
                        <span className="font-semibold uppercase">M.C.P.A. DESIGN &amp; CONSTRUCTION</span>, a general construction entity duly organized under Philippine laws, with principal engineering office at 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines, represented herein by its Authorized Managing Officer,{" "}
                        <span className="font-semibold uppercase">
                          {contractData?.contractor_signer_name || "Engr. Raymart Quirante"}
                        </span>
                        , herein referred to as the <strong>&quot;CONTRACTOR&quot;</strong>.
                      </p>
                    </div>

                    {/* Article 1: Scope */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900">
                        ARTICLE 1. SCOPE OF WORK &amp; DELIVERABLES
                      </h4>
                      <p className="text-neutral-700 text-justify">
                        The CONTRACTOR agrees to furnish all architectural designs, engineering blueprints, construction materials, skilled labor, equipment, and technical supervision necessary for the complete construction of the Turnkey Residential Project located at{" "}
                        <strong>{contractData?.project_meta?.location || contractModalProject.target_location || "Bulacan, Philippines"}</strong>{" "}
                        in accordance with the approved architectural and structural plans.
                      </p>
                    </div>

                    {/* Article 2: Contract Price & Progress Billing */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900">
                        ARTICLE 2. CONTRACT SUM &amp; PROGRESS BILLING SCHEDULE
                      </h4>
                      <p className="text-neutral-700">
                        The agreed total contract amount for the complete execution of the turnkey project is{" "}
                        <strong className="text-neutral-900 font-mono">
                          ₱{(Number(contractData?.contract_sum || 2850000)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </strong>
                        , payable under the standard 5-stage progress milestone schedule:
                      </p>

                      <div className="border border-neutral-300 rounded overflow-hidden">
                        <table className="w-full text-[10px] font-mono">
                          <thead className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700">
                            <tr>
                              <th className="p-2 text-left">Tranche Stage</th>
                              <th className="p-2 text-left">Description</th>
                              <th className="p-2 text-center">% Share</th>
                              <th className="p-2 text-right">Amount (PHP)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            <tr>
                              <td className="p-2 font-semibold">Tranche 1</td>
                              <td className="p-2">Mobilization &amp; Site Clearing (DP)</td>
                              <td className="p-2 text-center">15%</td>
                              <td className="p-2 text-right">₱{(Number(contractData?.contract_sum || 2850000) * 0.15).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold">Tranche 2</td>
                              <td className="p-2">Substructure &amp; Foundation Pouring</td>
                              <td className="p-2 text-center">25%</td>
                              <td className="p-2 text-right">₱{(Number(contractData?.contract_sum || 2850000) * 0.25).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold">Tranche 3</td>
                              <td className="p-2">Superstructure, Framing &amp; Masonry</td>
                              <td className="p-2 text-center">25%</td>
                              <td className="p-2 text-right">₱{(Number(contractData?.contract_sum || 2850000) * 0.25).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold">Tranche 4</td>
                              <td className="p-2">Roofing, MEPFS Rough-ins &amp; Plastering</td>
                              <td className="p-2 text-center">25%</td>
                              <td className="p-2 text-right">₱{(Number(contractData?.contract_sum || 2850000) * 0.25).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold">Tranche 5</td>
                              <td className="p-2">Architectural Finishes, Punchlist &amp; Handover</td>
                              <td className="p-2 text-center">10%</td>
                              <td className="p-2 text-right">₱{(Number(contractData?.contract_sum || 2850000) * 0.10).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Article 3 & 4: Timeline & 15-Year Warranty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900">
                          ARTICLE 3. TIMELINE &amp; COMPLETION
                        </h4>
                        <p className="text-neutral-700 text-justify">
                          Construction commences upon groundbreaking ceremony and receipt of Tranche 1, targeted for completion within 180 to 240 calendar days, subject to force majeure adjustments.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900">
                          ARTICLE 4. 15-YEAR WARRANTY (CIVIL CODE 1723)
                        </h4>
                        <p className="text-neutral-700 text-justify">
                          In accordance with Article 1723 of the Civil Code of the Philippines, the CONTRACTOR guarantees structural integrity against collapse or major defects for a period of fifteen (15) years.
                        </p>
                      </div>
                    </div>

                    {/* SHA-256 Stamp if Executed */}
                    {contractData?.sha256_hash && (
                      <div className="p-3 bg-neutral-50 rounded border border-neutral-200 flex items-center justify-between font-mono text-[9px] text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>CRYPTOGRAPHIC TAMPER-EVIDENT CONTRACT SEAL:</span>
                        </div>
                        <span className="truncate max-w-sm font-bold text-neutral-800">{contractData.sha256_hash}</span>
                      </div>
                    )}

                    {/* DUAL SIGNATURE BLOCKS */}
                    {(() => {
                      const clientSigs = (contractData?.signatures || [])
                        .filter((s) => (s.signer_role || "").toUpperCase() === "CLIENT")
                        .sort((a, b) => (b.signature_id || 0) - (a.signature_id || 0) || new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
                      const modalClientSig = clientSigs[0] || (contractData?.client_signature_image_url ? {
                        signature_image_url: contractData.client_signature_image_url,
                        signer_name: contractData.client_signer_name,
                        signed_at: contractData.client_signed_at,
                      } : null);

                      const contractorSigs = (contractData?.signatures || [])
                        .filter((s) => ["CONTRACTOR", "ADMIN"].includes((s.signer_role || "").toUpperCase()))
                        .sort((a, b) => (b.signature_id || 0) - (a.signature_id || 0) || new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
                      const modalContractorSig = contractorSigs[0] || (contractData?.contractor_signature_image_url ? {
                        signature_image_url: contractData.contractor_signature_image_url,
                        signer_name: contractData.contractor_signer_name,
                        signed_at: contractData.contractor_signed_at,
                      } : null);

                      return (
                        <div className="pt-6 border-t border-neutral-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Owner Signature Block */}
                            <div className="border border-neutral-200 rounded p-4 text-center space-y-2 bg-neutral-50/50">
                              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                                FIRST PARTY / OWNER (CLIENT)
                              </span>
                              <div className="min-h-20 flex flex-col items-center justify-center border-b border-neutral-300 pb-2">
                                {modalClientSig ? (
                                  <div className="space-y-1 w-full">
                                    {modalClientSig.signature_image_url && modalClientSig.signature_image_url.length > 50 ? (
                                      <img
                                        src={modalClientSig.signature_image_url}
                                        alt="Client Signature"
                                        className="h-12 max-w-full object-contain mx-auto"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fallback = e.currentTarget.nextElementSibling;
                                          if (fallback) fallback.style.display = "block";
                                        }}
                                      />
                                    ) : null}
                                    <span
                                      className="font-serif italic text-lg text-emerald-800 font-bold block"
                                      style={{
                                        display:
                                          modalClientSig.signature_image_url && modalClientSig.signature_image_url.length > 50
                                            ? "none"
                                            : "block",
                                      }}
                                    >
                                      {modalClientSig.signer_name || contractModalProject.client_name}
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-600 flex items-center justify-center gap-1">
                                      <Check className="w-3 h-3" /> E-Signed {modalClientSig.signed_at ? new Date(modalClientSig.signed_at).toLocaleDateString("en-PH") : "Recorded"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-neutral-400 font-mono text-[10px] italic">
                                    Pending Client E-Signature in Portal
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-xs uppercase text-neutral-900 block">
                                {modalClientSig?.signer_name || contractModalProject.client_name || "Owner"}
                              </span>
                              <span className="text-[10px] text-neutral-500">Owner &amp; Principal Client</span>
                            </div>

                            {/* Contractor Signature Block */}
                            <div className="border border-neutral-200 rounded p-4 text-center space-y-2 bg-neutral-50/50">
                              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                                SECOND PARTY / CONTRACTOR (M.C.P.A.)
                              </span>
                              <div className="min-h-20 flex flex-col items-center justify-center border-b border-neutral-300 pb-2">
                                {modalContractorSig ? (
                                  <div className="space-y-1 w-full">
                                    {modalContractorSig.signature_image_url && modalContractorSig.signature_image_url.length > 50 ? (
                                      <img
                                        src={modalContractorSig.signature_image_url}
                                        alt="Contractor Signature"
                                        className="h-12 max-w-full object-contain mx-auto"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fallback = e.currentTarget.nextElementSibling;
                                          if (fallback) fallback.style.display = "block";
                                        }}
                                      />
                                    ) : null}
                                    <span
                                      className="font-serif italic text-lg text-emerald-800 font-bold block"
                                      style={{
                                        display:
                                          modalContractorSig.signature_image_url && modalContractorSig.signature_image_url.length > 50
                                            ? "none"
                                            : "block",
                                      }}
                                    >
                                      {modalContractorSig.signer_name || "Engr. Raymart Quirante"}
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-600 flex items-center justify-center gap-1">
                                      <Check className="w-3 h-3" /> Countersigned {modalContractorSig.signed_at ? new Date(modalContractorSig.signed_at).toLocaleDateString("en-PH") : "Recorded"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        clearAdminSignature();
                                        setIsAdminSignModalOpen(true);
                                      }}
                                      className="text-[9px] font-mono text-amber-600 hover:text-amber-700 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors pt-1"
                                    >
                                      <PenTool className="w-2.5 h-2.5" />
                                      <span>Re-Sign / Redraw with Canvas</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2 w-full py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        clearAdminSignature();
                                        setIsAdminSignModalOpen(true);
                                      }}
                                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                      <PenTool className="w-3.5 h-3.5" />
                                      <span>Draw &amp; Sign Document Here</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-xs uppercase text-neutral-900 block">
                                {modalContractorSig?.signer_name || contractorSignerName || "Engr. Raymart Quirante"}
                              </span>
                              <span className="text-[10px] text-neutral-500">Authorized Managing Officer</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ADMIN COUNTERSIGNING FORM (IF NOT YET SIGNED BY CONTRACTOR) */}
                  {!contractData?.contractor_signed_at && (
                    <form
                      onSubmit={handleSignContractAsAdmin}
                      className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">
                          Contractor Representative E-Signature Execution
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Countersign this Turnkey Construction Master Agreement as Authorized Managing Officer of M.C.P.A. Design &amp; Construction.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1 font-bold">
                            Managing Officer Name
                          </label>
                          <input
                            type="text"
                            required
                            value={contractorSignerName}
                            onChange={(e) => setContractorSignerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1 font-bold">
                            Signer Title / Designation
                          </label>
                          <input
                            type="text"
                            required
                            value={contractorTitle}
                            onChange={(e) => setContractorTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1 font-bold">
                          Digital Signature Stamp / Handwritten Type
                        </label>
                        <div className="p-3 bg-white dark:bg-[#101218] rounded-[8px] border border-neutral-300 dark:border-white/10 flex items-center justify-between">
                          <span className="font-serif italic text-lg text-neutral-900 dark:text-white font-bold pl-2">
                            {contractorSignerName || "Engr. Raymart Quirante"}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                            Verified Contractor Key
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isSigningContract}
                          className="px-5 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          {isSigningContract ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Hashing &amp; Stamping SHA-256...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Countersign &amp; Execute Agreement</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.02]">
              <span className="text-[11px] font-mono text-neutral-500">
                Republic of the Philippines Civil Code Compliant
              </span>
              <button
                type="button"
                onClick={handleCloseContractModal}
                className="px-4 py-2 rounded-[8px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DIGITAL SIGNATURE MODAL */}
      {isAdminSignModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12141c] border border-neutral-300 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Contractor Official Countersignature
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                  Sign below as Authorized Managing Officer of M.C.P.A.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminSignModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 font-bold mb-1">
                    Signer Name
                  </label>
                  <select
                    value={contractorSignerName}
                    onChange={(e) => {
                      const selected = adminAccounts.find(
                        (account) => (account.full_name || account.name) === e.target.value
                      );
                      setContractorSignerName(e.target.value);
                      if (selected?.designation || selected?.job_title) {
                        setContractorTitle(selected.designation || selected.job_title);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-black/30 text-neutral-900 dark:text-white"
                  >
                    {[...adminAccounts, {
                      full_name: currentUser?.fullName || currentUser?.name || "Engr. Raymart Quirante",
                      avatar_url: currentUser?.avatar_url || currentUser?.avatarUrl,
                    }]
                      .filter((account, index, accounts) =>
                        accounts.findIndex((candidate) => (candidate.full_name || candidate.name) === (account.full_name || account.name)) === index
                      )
                      .map((account) => (
                        <option key={account.user_id || account.full_name} value={account.full_name || account.name}>
                          {account.full_name || account.name}
                        </option>
                      ))}
                  </select>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
                    <StaffAvatar staff={adminAccounts.find((account) => (account.full_name || account.name) === contractorSignerName) || currentUser} />
                    <span>Select an authorized admin or engineer.</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 font-bold mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={contractorTitle}
                    onChange={(e) => setContractorTitle(e.target.value)}
                    placeholder="Enter signer designation or title"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-black/30 text-neutral-900 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">Optional — enter the signer&apos;s role or designation.</p>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] p-2.5 text-[10px] text-neutral-600 dark:text-neutral-400">
                Signature ink is fixed to black. For uploaded signatures, use black ballpen on clean white paper so the background can be removed automatically.
              </div>

              <div className="border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white overflow-hidden shadow-inner relative">
                <canvas
                  ref={adminSigCanvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startAdminDrawing}
                  onMouseMove={drawAdmin}
                  onMouseUp={stopAdminDrawing}
                  onMouseLeave={stopAdminDrawing}
                  onTouchStart={startAdminDrawing}
                  onTouchMove={drawAdmin}
                  onTouchEnd={stopAdminDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {uploadedSignatureData && (
                  <img
                    src={uploadedSignatureData}
                    alt="Uploaded signature preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                )}
                <div className="pointer-events-none absolute bottom-4 left-6 right-6 border-b border-dashed border-neutral-300 flex justify-between items-end pb-1">
                  <span className="text-[10px] font-mono text-neutral-400">× Sign above this line</span>
                  <span className="text-[9px] font-mono text-neutral-400">M.C.P.A. Official Seal</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearAdminSignature}
                className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Clear Canvas
              </button>
              <label className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 cursor-pointer">
                Upload Signature
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureUpload}
                  className="sr-only"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminSignModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignContractAsAdmin}
                  disabled={!hasAdminDrawnSig || isSigningContract}
                  className="px-5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSigningContract ? "Sealing & Executing..." : "Countersign & Execute"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
