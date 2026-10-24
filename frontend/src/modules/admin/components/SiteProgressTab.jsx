"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Film,
  Camera,
  Maximize2,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  UserCheck,
  User,
  AlertCircle,
  CheckCircle,
  Play,
  Eye,
  EyeOff,
  FileVideo,
  FileText,
  Lock,
  Calendar,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Award,
  ArrowRight,
  RefreshCw,
  Key,
  AlertTriangle,
  Truck,
  Layers,
  Hammer,
  Boxes,
  Droplets,
  CloudRain,
  Zap,
  Paintbrush,
  Home,
  Compass,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Stage3CustomerSelector from "./Stage3CustomerSelector";
import AdminEmptyState from "./AdminEmptyState";
import { authFetch } from "@/modules/shared/authFetch";
import { verifyAdminPassword } from "../utils/adminAuth";

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses any date string, including PostgreSQL timestamp with timezone ("2026-10-18 05:59:00.758555+00").
 */
export function parseAnyDate(str) {
  if (!str) return null;
  if (str instanceof Date && !isNaN(str)) return str;
  if (typeof str !== "string") return new Date(str);
  let cleaned = str.trim();
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(cleaned)) {
    cleaned = cleaned.replace(" ", "T").replace(/\+(\d{2})$/, "+$1:00");
  }
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date(str) : d;
}

/**
 * Formats a date string into an executive human-readable format (e.g. "Oct 18, 2026").
 */
export function formatHumanDate(dateStr, includeWeekday = false) {
  if (!dateStr) return "";
  const d = parseAnyDate(dateStr);
  if (!d || isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeWeekday ? { weekday: "short" } : {}),
  });
}

/**
 * Calculates countdown / days-until badge info for a scheduled turnover date.
 */
export function getTurnoverCountdown(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: "Due for Handover", isTodayOrPast: true, badgeClass: "text-rose-600 dark:text-rose-400" };
  }
  if (diffDays === 0) {
    return { label: "Scheduled for Today", isTodayOrPast: true, badgeClass: "text-emerald-600 dark:text-emerald-400" };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", isTodayOrPast: false, badgeClass: "text-amber-600 dark:text-amber-400" };
  }
  return { label: `In ${diffDays} days`, isTodayOrPast: false, badgeClass: "text-blue-600 dark:text-blue-400" };
}

export function resolveAdminAvatar(user) {
  if (!user) return null;
  const direct = user.avatar_url || user.avatarUrl;
  if (
    direct &&
    typeof direct === "string" &&
    direct.trim() &&
    direct !== "null" &&
    direct !== "undefined"
  ) {
    return direct.trim();
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mcpa_admin_avatar");
      if (stored && stored.trim() && stored !== "null" && stored !== "undefined") {
        return stored.trim();
      }
    } catch {}
  }

  const email = (user.email || "").toLowerCase().trim();
  const name = (user.full_name || user.fullName || user.name || "").toLowerCase().trim();
  if (
    email.includes("quirante") ||
    email === "dbprojectmartquirante@gmail.com" ||
    email === "martquirante@gmail.com" ||
    email === "martquirante04@gmail.com" ||
    name.includes("raymart") ||
    name.includes("quirante")
  ) {
    return "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
  }

  return null;
}

/**
 * Civil Engineering & Residential House Construction Sequence
 * Standard chronological execution sequence, typical weight estimates, and BOQ category matching.
 */
export const CIVIL_CONSTRUCTION_STAGES = [
  {
    step: 1,
    phaseTitle: "Mobilization & Site Preparation",
    shortBadge: "Stage 01 • Mobilization",
    defaultWeight: 8,
    icon: Truck,
    description: "Temporary facilities, site clearing, staking/batter boards, power/water setup & building permits",
    matcher: /mobiliz|general\s*req|site\s*prep|temporary|permit|staking/i,
  },
  {
    step: 2,
    phaseTitle: "Earthworks & Substructure",
    shortBadge: "Stage 02 • Substructure",
    defaultWeight: 18,
    icon: Hammer,
    description: "Excavation, column footings, tie-beams, gravel bedding, vapor barrier & structural rebar layout",
    matcher: /earthwork|substructure|excavat|footing|foundation|tie\s*beam|gravel/i,
  },
  {
    step: 3,
    phaseTitle: "Superstructure & Structural Concrete",
    shortBadge: "Stage 03 • Superstructure",
    defaultWeight: 20,
    icon: Layers,
    description: "Reinforced concrete columns, suspended beams, second floor slab casting & structural curing",
    matcher: /superstructure|structural\s*concrete|column|beam|slab|framing|concrete\s*work/i,
  },
  {
    step: 4,
    phaseTitle: "Masonry & CHB Wall Enclosure",
    shortBadge: "Stage 04 • Masonry",
    defaultWeight: 10,
    icon: Boxes,
    description: "Concrete Hollow Block (CHB) laying, vertical dowels, lintel beams, exterior walls & partitions",
    matcher: /masonry|chb|hollow\s*block|block\s*work|wall/i,
  },
  {
    step: 5,
    phaseTitle: "Structural Steel & Metal Roofing",
    shortBadge: "Stage 05 • Roofing & Envelope",
    defaultWeight: 12,
    icon: Home,
    description: "Steel roof trusses, c-purlins, insulation, long-span rib roofing, gutters & flashing (Building Weathertight)",
    matcher: /steel|roof|truss|purlin|gutter|flashing|metal\s*roof/i,
  },
  {
    step: 6,
    phaseTitle: "Plumbing, Sanitary & Drainage Rough-in",
    shortBadge: "Stage 06 • MEP Rough-in",
    defaultWeight: 7,
    icon: Droplets,
    description: "Underground drainage lines, septic vault connections, water supply pipes & vent stacks (Before plastering)",
    matcher: /plumb|sanitary|drain|waterline|sewer|pipe/i,
  },
  {
    step: 7,
    phaseTitle: "Electrical & Lighting Rough-in",
    shortBadge: "Stage 07 • MEP Rough-in",
    defaultWeight: 8,
    icon: Zap,
    description: "Concealed uPVC conduits, utility boxes, panelboard enclosure & electrical circuit homerun rough-in",
    matcher: /electr|lighting|auxiliary|conduit|wiring|panelboard/i,
  },
  {
    step: 8,
    phaseTitle: "Doors, Windows & Glazing (Lock-up)",
    shortBadge: "Stage 08 • Lock-up",
    defaultWeight: 5,
    icon: Maximize2,
    description: "Powder-coated aluminum/uPVC frames, tempered glass windows, exterior door jambs & security hardware",
    matcher: /door|window|glaz|glass|fenestration|jamb/i,
  },
  {
    step: 9,
    phaseTitle: "Architectural Finishes & Tiling",
    shortBadge: "Stage 09 • Finishes",
    defaultWeight: 15,
    icon: Paintbrush,
    description: "Cement plastering, skim coat, floor & bathroom tiles, ceiling board installation, primer & topcoat paint",
    matcher: /finish|architectural|tile|paint|ceil|plaster|tiling/i,
  },
  {
    step: 10,
    phaseTitle: "Fixtures, Testing, Turnover & Punchlist",
    shortBadge: "Stage 10 • Handover",
    defaultWeight: 5,
    icon: CheckCircle2,
    description: "Plumbing trim, light fixtures, switches, testing & commissioning, deep cleaning & final client handover",
    matcher: /fixture|turnover|punch|inspect|commission|testing|handover|other|special/i,
  },
];

/**
 * Standard reasons for progress deduction / rollback in site accomplishment.
 */
export const DEDUCTION_REASON_OPTIONS = [
  { label: "Quality Defect / Rework Required", tag: "Defective workmanship or materials require removal and rework.", icon: AlertTriangle },
  { label: "QA Inspection Failed / Rejected", tag: "The work failed a site inspection or material test.", icon: ShieldCheck },
  { label: "Weather Damage / Site Stoppage", tag: "Weather conditions damaged the work or stopped site activity.", icon: CloudRain },
  { label: "Scope Revision / Change Order", tag: "The approved scope or design was revised.", icon: Layers },
  { label: "Clerical Correction", tag: "A previous accomplishment entry was recorded incorrectly.", icon: Edit3 },
  { label: "Substandard Materials Rejection", tag: "Materials did not meet the approved technical specification.", icon: AlertCircle },
  { label: "Punchlist Rectification", tag: "Defects must be corrected before the work can proceed.", icon: CheckCircle2 },
  { label: "Other", tag: "Use this option when the reason is not covered above.", icon: FileText },
];

export function AdminAvatarPfp({ user, name, size = "w-6 h-6", text = "text-[10px]" }) {
  const avatarUrl = resolveAdminAvatar(user);
  const [hasFailed, setHasFailed] = useState(false);
  const displayName = name || user?.full_name || user?.fullName || user?.name || "Admin";
  const initials = displayName
    .replace(/^Engr\.\s*/i, "")
    .replace(/^Arch\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  if (avatarUrl && !hasFailed) {
    return (
      <div className={`${size} rounded-full overflow-hidden bg-neutral-900 border border-amber-500/40 shrink-0 shadow-xs flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 font-mono font-bold text-amber-600 dark:text-amber-400 ${text} shadow-xs`}>
      {initials}
    </div>
  );
}

function MediaGroupCard({
  group,
  onOpenPreview,
  onDelete,
  isDeleting,
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const items = group.items || [];
  const safeIdx = Math.min(Math.max(0, activeIdx), Math.max(0, items.length - 1));
  const currentItem = items[safeIdx] || items[0] || {};

  const isVideo =
    currentItem.media_type === "video" ||
    /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i.test(currentItem.image_url || "");

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="group rounded-[10px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] overflow-hidden shadow-xs hover:border-amber-500/50 transition-all flex flex-col">
      {/* Media Thumbnail Container with Showcase Switcher */}
      <div
        onClick={() => onOpenPreview(currentItem, items, safeIdx, group)}
        className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer select-none"
      >
        {isVideo ? (
          <>
            <video
              key={currentItem.image_url}
              src={currentItem.image_url}
              preload="metadata"
              muted
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <>
            <img
              key={currentItem.image_url}
              src={currentItem.image_url}
              alt={group.title || "Site Progress"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          </>
        )}

        {/* Top Badges (Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
          {items.length > 1 ? (
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs border border-white/10">
              <Camera className="w-3 h-3 text-amber-400" />
              <span>
                {safeIdx + 1} / {items.length} {isVideo ? "Video" : "Photos"}
              </span>
            </span>
          ) : isVideo ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/90 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Film className="w-3 h-3" />
              <span>Video</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
              Photo
            </span>
          )}
        </div>

        {/* Delete Button (Right) */}
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.allLogIds, group.title, items.length);
            }}
            className="p-1.5 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
            title={items.length > 1 ? `Delete all ${items.length} items in this update` : "Delete media record"}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Carousel Chevrons (< and >) - visible on hover/touch */}
        {items.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between pointer-events-none opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous photo"
              aria-label="Previous photo"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next photo"
              aria-label="Next photo"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Carousel Indicator Dots & Date */}
        {items.length > 1 ? (
          <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
            {/* Dots */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs pointer-events-auto border border-white/10">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  aria-label={`Photo ${i + 1}`}
                  className={`transition-all cursor-pointer rounded-full ${
                    i === safeIdx
                      ? "w-3.5 h-1.5 bg-amber-400"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>

            {/* Date Tag */}
            {group.log_date && (
              <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-mono text-neutral-300">
                {group.log_date}
              </span>
            )}
          </div>
        ) : (
          group.log_date && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-mono text-neutral-300 z-10">
              {group.log_date}
            </div>
          )
        )}
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1">
          <h4
            onClick={() => onOpenPreview(currentItem, items, safeIdx, group)}
            className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 cursor-pointer hover:text-amber-500 transition-colors"
            title={group.title}
          >
            {group.title}
          </h4>
          {group.caption && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {group.caption}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span className="truncate">By {group.inspector || "Field Engineer"}</span>
          <button
            type="button"
            onClick={() => onOpenPreview(currentItem, items, safeIdx, group)}
            className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
          >
            <Eye className="w-3 h-3" />
            <span>Preview {items.length > 1 ? `(${items.length})` : ""}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteProgressTab({
  currentUser = null,
  project = null,
  projects = [],
  milestones = [],
  photos = [],
  onSelectProject,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateVirtualTour,
  onAddPhoto,
  onDeletePhoto,
  showToast,
}) {
  // Modal states
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [activeUpdateMilestone, setActiveUpdateMilestone] = useState(null);
  const [is3DVideoModalOpen, setIs3DVideoModalOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);

  // Turnover Modal & Scheduling state
  const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);
  const [turnoverInputDate, setTurnoverInputDate] = useState("");
  const [turnoverVenue, setTurnoverVenue] = useState("");
  const [turnoverNotes, setTurnoverNotes] = useState("");
  const [isReschedulingTurnover, setIsReschedulingTurnover] = useState(false);
  const [isConfirmingTurnoverNow, setIsConfirmingTurnoverNow] = useState(false);
  const [isSubmittingTurnover, setIsSubmittingTurnover] = useState(false);
  const [turnoverDateError, setTurnoverDateError] = useState("");

  // Completion media gate state (Stage 4 Handover & Portfolio Showcase)
  const [completionMediaCount, setCompletionMediaCount] = useState(0);
  const [completionMedia, setCompletionMedia] = useState([]);
  const [isLoadingCompletionMedia, setIsLoadingCompletionMedia] = useState(false);
  const [photoCategory, setPhotoCategory] = useState("progress"); // "progress" | "completion"

  // Admin combobox & accounts state
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [isInspectorDropdownOpen, setIsInspectorDropdownOpen] = useState(false);
  const [isCustomInspector, setIsCustomInspector] = useState(false);
  const inspectorDropdownRef = useRef(null);

  // Fetch registered admin / engineer accounts from database
  useEffect(() => {
    let isMounted = true;
    const loadAdmins = async () => {
      try {
        const res = await authFetch("/api/admin/accounts");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.accounts)) {
            const staffList = data.accounts.filter(
              (acc) =>
                acc.role === "admin" ||
                acc.role === "super_admin" ||
                acc.role === "engineer" ||
                (acc.full_name && acc.full_name.toLowerCase().includes("engr"))
            );
            if (isMounted && staffList.length > 0) {
              setAdminAccounts(staffList);
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch admin list:", e);
      }
    };
    loadAdmins();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch completion media logs for the active project
  const fetchCompletionMedia = useCallback(async () => {
    if (!project?.project_code) {
      setCompletionMediaCount(0);
      setCompletionMedia([]);
      return;
    }
    setIsLoadingCompletionMedia(true);
    try {
      const res = await authFetch(`/api/construction/completion-media/${encodeURIComponent(project.project_code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCompletionMediaCount(data.count || 0);
          setCompletionMedia(data.media || []);
        }
      }
    } catch (err) {
      console.warn("[SiteProgressTab] Could not load completion media:", err);
    } finally {
      setIsLoadingCompletionMedia(false);
    }
  }, [project?.project_code]);

  useEffect(() => {
    fetchCompletionMedia();
  }, [fetchCompletionMedia]);

  // Close inspector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inspectorDropdownRef.current && !inspectorDropdownRef.current.contains(e.target)) {
        setIsInspectorDropdownOpen(false);
      }
    };
    if (isInspectorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInspectorDropdownOpen]);

  // Combine currentUser, database accounts, and fallback active admins
  const availableAdmins = useMemo(() => {
    const map = new Map();

    // 1. Current logged-in admin if available
    if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName) {
        map.set(uName.toLowerCase(), {
          user_id: currentUser.user_id || currentUser.id || "current",
          full_name: uName,
          email: currentUser.email || "",
          role: currentUser.role || "admin",
          avatar_url: currentUser.avatar_url || currentUser.avatarUrl,
        });
      }
    }

    // 2. Accounts from DB
    adminAccounts.forEach((acc) => {
      const name = acc.full_name || acc.fullName;
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), acc);
      }
    });

    // 3. Fallback active company admins
    const defaults = [
      {
        user_id: 1,
        full_name: "Engr. Raymart Quirante",
        email: "dbprojectmartquirante@gmail.com",
        role: "admin",
        avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c",
      },
      {
        user_id: 3,
        full_name: "MCPA Lead Administrator",
        email: "admin@mcpa.com",
        role: "admin",
        avatar_url: null,
      },
    ];

    defaults.forEach((def) => {
      if (!map.has(def.full_name.toLowerCase())) {
        map.set(def.full_name.toLowerCase(), def);
      }
    });

    return Array.from(map.values());
  }, [adminAccounts, currentUser]);

  const getInitialInspector = () => {
    if (project?.lead_engineer && project.lead_engineer !== "Engr. Reyes") {
      return project.lead_engineer;
    }
    if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName) return uName;
    }
    return "Engr. Raymart Quirante";
  };

  // Add Milestone Form state
  const [newPhaseCode, setNewPhaseCode] = useState("");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newWeight, setNewWeight] = useState("20");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Update Milestone Form state
  const [updatePct, setUpdatePct] = useState(0);
  const [updateStatus, setUpdateStatus] = useState("In Progress");
  const [updateNotes, setUpdateNotes] = useState("");
  const [deductionCategory, setDeductionCategory] = useState("");
  const [deductionReasonDetails, setDeductionReasonDetails] = useState("");
  const [deductionError, setDeductionError] = useState("");
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // 3D Video Walkthrough Form state (Multiple videos supported, no file size limit)
  const [walkthroughVideos, setWalkthroughVideos] = useState([]);
  const [manualWalkthroughUrl, setManualWalkthroughUrl] = useState("");
  const [manualWalkthroughTitle, setManualWalkthroughTitle] = useState("");
  const [walkthroughUploadError, setWalkthroughUploadError] = useState("");
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const [isSavingWalkthrough, setIsSavingWalkthrough] = useState(false);
  const [isHandingOver, setIsHandingOver] = useState(false);
  const walkthroughFileInputRef = useRef(null);
  const walkthroughXhrsRef = useRef({});
  const [boqTrades, setBoqTrades] = useState([]);

  // Calculate total allocated weight from existing milestones
  const totalAllocatedWeight = useMemo(() => {
    return (milestones || []).reduce((acc, m) => acc + (Number(m.weight) || 0), 0);
  }, [milestones]);

  const remainingTimelineWeight = Math.max(0, 100 - totalAllocatedWeight);

  // Chronologically sequenced trades with civil engineering intelligence
  const sequencedBoqTrades = useMemo(() => {
    const list = Array.isArray(boqTrades) && boqTrades.length > 0 ? boqTrades : [];

    // Enrich each trade with stage information and matching against existing milestones
    const enriched = list.map((trade) => {
      const cat = trade.category || "";
      const stage = CIVIL_CONSTRUCTION_STAGES.find((s) => s.matcher.test(cat)) || {
        step: 99,
        phaseTitle: cat,
        shortBadge: "Special Scope",
        defaultWeight: 5,
        icon: Sparkles,
        description: "Custom project scope item from Bill of Quantities",
        matcher: /./,
      };

      // Check if this trade is already present in existing milestones
      const existingMilestone = (milestones || []).find((m) => {
        const mName = (m.phase_name || "").toLowerCase().trim();
        const tName = cat.toLowerCase().trim();
        if (mName === tName) return true;
        if (stage.matcher.test(mName) && stage.matcher.test(tName)) return true;
        return false;
      });

      const isAdded = Boolean(existingMilestone);
      const items = Array.isArray(trade.items) ? trade.items : [];
      const itemsSummary = items
        .map((it) => it.item || it.name || it.description)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");

      return {
        rawTrade: trade,
        category: cat,
        step: stage.step,
        phaseTitle: stage.phaseTitle,
        shortBadge: stage.shortBadge,
        defaultWeight: stage.defaultWeight,
        description: stage.description,
        Icon: stage.icon,
        isAdded,
        existingMilestone,
        items,
        itemsCount: items.length,
        itemsSummary,
      };
    });

    // Sort chronologically by construction sequence
    return enriched.sort((a, b) => a.step - b.step);
  }, [boqTrades, milestones]);

  // Identify the Next Recommended Trade in the construction sequence
  const nextRecommendedTrade = useMemo(() => {
    return sequencedBoqTrades.find((t) => !t.isAdded) || null;
  }, [sequencedBoqTrades]);

  // Handler to select and quick-fill a trade into the milestone form
  const handleSelectTrade = (trade) => {
    if (!trade) return;
    setNewPhaseName(trade.category);
    if (!newPhaseCode || newPhaseCode.trim() === "") {
      setNewPhaseCode(`M${milestones.length + 1}`);
    }

    // Smart weight calculation:
    if (remainingTimelineWeight > 0) {
      const unaddedCount = sequencedBoqTrades.filter((t) => !t.isAdded).length;
      if (unaddedCount <= 1) {
        // Last unadded stage gets the exact remainder to complete 100%!
        setNewWeight(String(remainingTimelineWeight));
      } else {
        const suggested = Math.min(trade.defaultWeight, remainingTimelineWeight);
        setNewWeight(String(suggested || 10));
      }
    } else {
      setNewWeight(String(trade.defaultWeight || 10));
    }

    if (trade.itemsSummary) {
      setNewNotes(trade.itemsSummary);
    }
  };

  const handleOpenAddMilestone = (preSelectedTrade = null) => {
    const nextCode = `M${milestones.length + 1}`;
    setNewPhaseCode(nextCode);

    const targetTrade = preSelectedTrade || nextRecommendedTrade;

    if (targetTrade) {
      setNewPhaseName(targetTrade.category);
      if (remainingTimelineWeight > 0) {
        const unaddedCount = sequencedBoqTrades.filter((t) => !t.isAdded).length;
        if (unaddedCount <= 1) {
          setNewWeight(String(remainingTimelineWeight));
        } else {
          setNewWeight(String(Math.min(targetTrade.defaultWeight, remainingTimelineWeight) || 10));
        }
      } else {
        setNewWeight(String(targetTrade.defaultWeight || 10));
      }
      if (targetTrade.itemsSummary) {
        setNewNotes(targetTrade.itemsSummary);
      }
    } else {
      setNewPhaseName("");
      setNewWeight(remainingTimelineWeight > 0 ? String(Math.min(15, remainingTimelineWeight)) : "15");
      setNewNotes("");
    }
    setNewTargetDate("");
    setIsAddMilestoneOpen(true);
  };

  // Resolve initial list of walkthrough videos from project
  const resolveInitialWalkthroughs = useCallback((proj) => {
    if (!proj) return [];
    let list = [];
    if (Array.isArray(proj.virtual_tour_urls) && proj.virtual_tour_urls.length > 0) {
      list = proj.virtual_tour_urls;
    } else if (typeof proj.virtual_tour_urls === "string") {
      try {
        const parsed = JSON.parse(proj.virtual_tour_urls);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    if (list.length === 0 && proj.virtual_tour_url) {
      try {
        const parsed = JSON.parse(proj.virtual_tour_url);
        if (Array.isArray(parsed)) list = parsed;
        else list = [{ url: proj.virtual_tour_url, title: "Full 3D Architectural Walk-Around" }];
      } catch {
        list = [{ url: proj.virtual_tour_url, title: "Full 3D Architectural Walk-Around" }];
      }
    }
    return list
      .map((item, idx) => ({
        id: `vt-init-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file: null,
        previewUrl: typeof item === "string" ? item : item.url,
        url: typeof item === "string" ? item : item.url,
        title: typeof item === "object" && item.title ? item.title : `Walkaround Part ${idx + 1}`,
        name: typeof item === "object" && item.name ? item.name : `Video ${idx + 1}`,
        size: typeof item === "object" && item.size ? item.size : 0,
        isUploading: false,
        uploadProgress: 100,
        error: null,
      }))
      .filter((v) => Boolean(v.url));
  }, []);

  // Friendly error formatter for non-technical users
  const formatFriendlyVideoError = (err) => {
    if (!err) return "";
    const msg = typeof err === "string" ? err : err.message || "";
    const lower = msg.toLowerCase();

    if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("offline") || lower.includes("connection")) {
      return "Nawala po ang koneksyon sa internet habang nag-a-upload. Pakisuri po ang inyong Wi-Fi o data connection at subukan muli.";
    }
    if (lower.includes("format") || lower.includes("type") || lower.includes("mimetype") || lower.includes("not a video")) {
      return "Pakipili po ang isang video file (tulad ng MP4, MOV, o WebM). Hindi po suportado ang ibang uri ng file.";
    }
    if (lower.includes("abort") || lower.includes("cancelled")) {
      return "Kinansela po ang pag-upload ng video.";
    }
    return "Hindi po matapos ang pag-upload ng video sa ngayon. Pakisubukang i-upload muli makalipas ang ilang sandali o i-refresh ang inyong browser.";
  };

  const resetVideoModal = () => {
    if (walkthroughXhrsRef.current) {
      Object.values(walkthroughXhrsRef.current).forEach((xhr) => {
        try {
          xhr.abort();
        } catch {}
      });
      walkthroughXhrsRef.current = {};
    }
    setIs3DVideoModalOpen(false);
    setWalkthroughUploadError("");
    setManualWalkthroughUrl("");
    setManualWalkthroughTitle("");
    setShowAddUrlInput(false);
    if (walkthroughFileInputRef.current) walkthroughFileInputRef.current.value = "";
  };

  const uploadWalkthroughItem = (item) => {
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();
    walkthroughXhrsRef.current[item.id] = xhr;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setWalkthroughVideos((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploadProgress: pct } : it))
        );
      }
    });

    xhr.addEventListener("load", () => {
      delete walkthroughXhrsRef.current[item.id];
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.url) {
            setWalkthroughVideos((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, isUploading: false, uploadProgress: 100, url: data.url, error: null }
                  : it
              )
            );
            if (showToast) {
              showToast(`"${item.title || item.name}" uploaded successfully.`);
            }
          } else {
            throw new Error(data.message || "Invalid upload response");
          }
        } catch (e) {
          const friendly = formatFriendlyVideoError(e);
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: friendly } : it))
          );
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          const friendly = formatFriendlyVideoError(data.message || "Upload error");
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: friendly } : it))
          );
        } catch {
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Upload failed" } : it))
          );
        }
      }
    });

    xhr.addEventListener("error", () => {
      delete walkthroughXhrsRef.current[item.id];
      setWalkthroughVideos((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Network error during upload" } : it))
      );
    });

    xhr.addEventListener("abort", () => {
      delete walkthroughXhrsRef.current[item.id];
      setWalkthroughVideos((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Cancelled" } : it))
      );
    });

    xhr.open("POST", "/api/upload?category=portfolio");
    xhr.send(formData);
  };

  const handleWalkthroughFilesSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const newItems = [];

    const defaultLabels = [
      "Full House Walkthrough",
      "Ground Living & Dining",
      "2nd Floor Bedrooms",
      "Facade & Exterior",
      "Roof Deck & Balcony",
      "Kitchen & Utility",
      "Master Suite & Bath",
    ];

    fileList.forEach((file, fileIdx) => {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      if (!isVideo) {
        if (showToast) showToast(`"${file.name}" is not a recognized video file.`);
        return;
      }

      // No size limit on videos! (cloud storage streaming)
      const id = `vt-${Date.now()}-${fileIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const previewUrl = URL.createObjectURL(file);
      const existingCount = walkthroughVideos.length + newItems.length;

      let autoTitle = "";
      if (existingCount < defaultLabels.length) {
        autoTitle = defaultLabels[existingCount];
      } else {
        autoTitle = `Walkaround Zone ${existingCount + 1}`;
      }

      const itemObj = {
        id,
        file,
        previewUrl,
        url: "",
        title: autoTitle,
        name: file.name,
        size: file.size,
        isUploading: true,
        uploadProgress: 0,
        error: null,
      };
      newItems.push(itemObj);
    });

    if (newItems.length === 0) return;
    setWalkthroughUploadError("");
    setWalkthroughVideos((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadWalkthroughItem(item));
  };

  const handleAddManualWalkthroughUrl = () => {
    if (!manualWalkthroughUrl || !manualWalkthroughUrl.trim()) return;
    const url = manualWalkthroughUrl.trim();
    const id = `vt-url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const title = (manualWalkthroughTitle || "").trim() || `Walkaround View ${walkthroughVideos.length + 1}`;

    setWalkthroughVideos((prev) => [
      ...prev,
      {
        id,
        file: null,
        previewUrl: url,
        url,
        title,
        name: url.split("/").pop() || "Direct Video Stream",
        size: 0,
        isUploading: false,
        uploadProgress: 100,
        error: null,
      },
    ]);
    setManualWalkthroughUrl("");
    setManualWalkthroughTitle("");
    setShowAddUrlInput(false);
  };

  const handleRemoveWalkthrough = (id) => {
    if (walkthroughXhrsRef.current[id]) {
      try {
        walkthroughXhrsRef.current[id].abort();
      } catch {}
      delete walkthroughXhrsRef.current[id];
    }
    setWalkthroughVideos((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateWalkthroughTitle = (id, newTitle) => {
    setWalkthroughVideos((prev) =>
      prev.map((it) => (it.id === id ? { ...it, title: newTitle } : it))
    );
  };

  useEffect(() => {
    if (!project?.project_code && !project?.client_project_id) return;
    const projId = project.client_project_id || project.project_code;
    let isMounted = true;
    fetch(`/api/projects/${encodeURIComponent(projId)}/quotation`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.quotation?.items_breakdown && Array.isArray(data.quotation.items_breakdown)) {
          setBoqTrades(data.quotation.items_breakdown);
        }
      })
      .catch((err) => console.warn("[SiteProgressTab] Could not load project BOQ quotation:", err));

    return () => {
      isMounted = false;
    };
  }, [project?.project_code, project?.client_project_id]);

  useEffect(() => {
    setWalkthroughVideos(resolveInitialWalkthroughs(project));
  }, [project?.project_code, project?.virtual_tour_url, project?.virtual_tour_urls, resolveInitialWalkthroughs]);

  // Post Photo/Video Log Form state
  const [logType, setLogType] = useState("Daily Log");
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoInspector, setPhotoInspector] = useState(getInitialInspector);
  const [mediaItems, setMediaItems] = useState([]); // [{ id, file, previewUrl, url, mediaType, name, size, isUploading, uploadProgress, is360, error }]
  const [useManualPhotoUrl, setUseManualPhotoUrl] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [manualMediaType, setManualMediaType] = useState("image");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState(null);
  const [photoDeleteTarget, setPhotoDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isVerifyingDeletePassword, setIsVerifyingDeletePassword] = useState(false);
  const photoFileInputRef = useRef(null);

  // Group photos belonging to the same post into a single card with showcase carousel
  const groupedMediaUpdates = useMemo(() => {
    if (!Array.isArray(photos) || photos.length === 0) return [];

    const map = new Map();
    const orderedKeys = [];

    photos.forEach((p, idx) => {
      const titleKey = (p.title || "").trim();
      const captionKey = (p.caption || "").trim();
      const inspectorKey = (p.inspector || "").trim();
      const dateKey = (p.log_date || "").trim();

      const hasMeta = Boolean(titleKey || captionKey || inspectorKey || dateKey);
      const groupKey = hasMeta
        ? `${titleKey}___${captionKey}___${inspectorKey}___${dateKey}`
        : `item_${p.log_id || idx}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          title: p.title || "Site Progress",
          caption: p.caption || "",
          inspector: p.inspector || "Field Engineer",
          log_date: p.log_date || "",
          items: [],
          allLogIds: [],
        });
        orderedKeys.push(groupKey);
      }

      const group = map.get(groupKey);
      group.items.push(p);
      if (p.log_id) {
        group.allLogIds.push(p.log_id);
      }
    });

    return orderedKeys.map((key) => map.get(key));
  }, [photos]);

  const handleOpenPreview = (item, items, index, group) => {
    const list = Array.isArray(items) && items.length > 0 ? items : [item];
    const safeIdx = Math.min(Math.max(0, index ?? 0), list.length - 1);
    setPreviewModalItem({
      ...item,
      items: list,
      currentIndex: safeIdx,
      groupTitle: group?.title || item.title,
      groupCaption: group?.caption || item.caption,
      groupInspector: group?.inspector || item.inspector,
      groupDate: group?.log_date || item.log_date,
    });
  };

  const modalItems = useMemo(() => {
    if (!previewModalItem) return [];
    if (Array.isArray(previewModalItem.items) && previewModalItem.items.length > 0) {
      return previewModalItem.items;
    }
    return [previewModalItem];
  }, [previewModalItem]);

  const currentModalIndex = Math.min(
    Math.max(0, previewModalItem?.currentIndex ?? 0),
    Math.max(0, modalItems.length - 1)
  );
  const currentModalItem = modalItems[currentModalIndex] || previewModalItem;

  const handleModalPrev = useCallback(() => {
    if (!previewModalItem || modalItems.length <= 1) return;
    const nextIdx = (currentModalIndex - 1 + modalItems.length) % modalItems.length;
    setPreviewModalItem((prev) => ({
      ...prev,
      ...modalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [previewModalItem, modalItems, currentModalIndex]);

  const handleModalNext = useCallback(() => {
    if (!previewModalItem || modalItems.length <= 1) return;
    const nextIdx = (currentModalIndex + 1) % modalItems.length;
    setPreviewModalItem((prev) => ({
      ...prev,
      ...modalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [previewModalItem, modalItems, currentModalIndex]);

  useEffect(() => {
    if (!previewModalItem) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewModalItem(null);
      if (e.key === "ArrowLeft") handleModalPrev();
      if (e.key === "ArrowRight") handleModalNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalItem, handleModalPrev, handleModalNext]);

  // Sync photoInspector when project or currentUser changes
  useEffect(() => {
    if (project?.lead_engineer && project.lead_engineer !== "Engr. Reyes") {
      setPhotoInspector(project.lead_engineer);
    } else if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName && (!photoInspector || photoInspector === "Engr. Reyes")) {
        setPhotoInspector(uName);
      }
    }
  }, [project?.lead_engineer, currentUser]);

  const selectedAdminObj = useMemo(() => {
    return (
      availableAdmins.find(
        (a) => (a.full_name || "").trim().toLowerCase() === (photoInspector || "").trim().toLowerCase()
      ) || null
    );
  }, [availableAdmins, photoInspector]);

  const resetPhotoForm = () => {
    setIsAddPhotoOpen(false);
    setPhotoCategory("progress");
    setPhotoTitle("");
    setPhotoCaption("");
    setMediaItems([]);
    setPhotoUploadError("");
    setUseManualPhotoUrl(false);
    setManualMediaUrl("");
    setIsInspectorDropdownOpen(false);
    setIsCustomInspector(false);
    if (photoFileInputRef.current) photoFileInputRef.current.value = "";
  };

  const uploadMediaItem = (item) => {
    if (!item.file) return;
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setMediaItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploadProgress: pct } : it))
        );
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.url) {
            setMediaItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, url: data.url, isUploading: false, uploadProgress: 100 }
                  : it
              )
            );
          } else {
            throw new Error(data.message || "Upload failed");
          }
        } catch (e) {
          setMediaItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, isUploading: false, error: e.message || "Upload error" }
                : it
            )
          );
        }
      } else {
        setMediaItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, isUploading: false, error: "Upload failed" }
              : it
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      setMediaItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, isUploading: false, error: "Network error during upload" }
            : it
        )
      );
    });

    xhr.open("POST", "/api/upload?category=portfolio");
    xhr.send(formData);
  };

  const handleMediaFilesSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const newItems = [];
    const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB limit strictly for images
    let hasOversizedImage = false;

    for (const file of fileList) {
      const isVid = file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

      if (!isVid && !isImg) {
        if (showToast) showToast(`"${file.name}" is not a supported image or video.`);
        continue;
      }

      // Strict 10MB limit for images ONLY - videos have NO limit
      if (isImg && file.size > MAX_IMG_SIZE) {
        hasOversizedImage = true;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const err = `Larawan "${file.name}" (${sizeMB}MB) ay lumampas sa 10MB limit. Hanggang 10MB lamang po ang mga larawan.`;
        setPhotoUploadError(err);
        if (showToast) showToast(err);
        continue;
      }

      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const localPreview = URL.createObjectURL(file);
      const itemObj = {
        id,
        file,
        previewUrl: localPreview,
        url: "",
        mediaType: isVid ? "video" : "image",
        name: file.name,
        size: file.size,
        isUploading: true,
        uploadProgress: 0,
        is360: false,
        error: null,
      };
      newItems.push(itemObj);
    }

    if (!hasOversizedImage) {
      setPhotoUploadError("");
    }

    if (newItems.length === 0) return;

    setMediaItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadMediaItem(item));
  };

  const handleAddManualUrl = () => {
    if (!manualMediaUrl || !manualMediaUrl.trim()) return;
    const url = manualMediaUrl.trim();
    const isVid = manualMediaType === "video" || /\.(mp4|mov|webm|avi|mkv)$/i.test(url);
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMediaItems((prev) => [
      ...prev,
      {
        id,
        file: null,
        previewUrl: url,
        url,
        mediaType: isVid ? "video" : "image",
        name: url.split("/").pop() || "Direct URL",
        size: 0,
        isUploading: false,
        uploadProgress: 100,
        is360: false,
        error: null,
      },
    ]);
    setManualMediaUrl("");
  };

  const handleRemoveMediaItem = (id) => {
    setMediaItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleToggle360 = (id) => {
    setMediaItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is360: !it.is360 } : it))
    );
  };

  // Handlers
  const handleOpenUpdateModal = (ms) => {
    setActiveUpdateMilestone(ms);
    setUpdatePct(ms.completion_pct || 0);
    setUpdateStatus(ms.status || "In Progress");
    setUpdateNotes(ms.notes || "");
    setDeductionCategory("");
    setDeductionReasonDetails("");
    setDeductionError("");
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!activeUpdateMilestone) return;

    const pctNum = Math.min(100, Math.max(0, parseInt(updatePct, 10) || 0));
    const previousPct = Number(activeUpdateMilestone.completion_pct || 0);
    const isDeduction = pctNum < previousPct;

    if (isDeduction && !deductionCategory && !deductionReasonDetails.trim()) {
      setDeductionError("A reason is required when the completion percentage is reduced.");
      return;
    }
    if (isDeduction && deductionCategory === "Other" && !deductionReasonDetails.trim()) {
      setDeductionError("Please specify the reason when selecting Other.");
      return;
    }

    setDeductionError("");
    setIsSubmittingUpdate(true);
    try {
      const resolvedStatus = pctNum === 100 ? "Completed" : pctNum > 0 ? "In Progress" : "Upcoming";

      let finalNotes = updateNotes || "";
      if (isDeduction) {
        const timestamp = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const reasonText = [deductionCategory, deductionReasonDetails.trim()].filter(Boolean).join(" - ");
        const deductionLog = `[PROGRESS DEDUCTION (${timestamp}): ${previousPct}% to ${pctNum}% (-${previousPct - pctNum}%) | Reason: ${reasonText}]`;
        finalNotes = finalNotes.trim() ? `${finalNotes}\n\n${deductionLog}` : deductionLog;
      }

      await onUpdateMilestone(activeUpdateMilestone.milestone_id, {
        completionPct: pctNum,
        status: resolvedStatus,
        notes: finalNotes,
      });

      if (showToast) {
        if (isDeduction) {
          showToast(`Milestone progress reduced to ${pctNum}% (Deduction: -${previousPct - pctNum}% logged)`);
        } else {
          showToast(`Milestone updated to ${pctNum}% (${resolvedStatus})`);
        }
      }
      setActiveUpdateMilestone(null);
    } catch (err) {
      if (showToast) showToast("Error updating milestone: " + err.message);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newPhaseCode || !newPhaseName || !project) return;

    setIsSavingMilestone(true);
    try {
      if (onAddMilestone) {
        await onAddMilestone({
          projectCode: project.project_code,
          phaseCode: newPhaseCode,
          phaseName: newPhaseName,
          weight: parseInt(newWeight, 10) || 20,
          targetDate: newTargetDate,
          notes: newNotes,
        });
      } else {
        // Direct API call
        const res = await fetch("/api/construction/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            phaseCode: newPhaseCode,
            phaseName: newPhaseName,
            weight: parseInt(newWeight, 10) || 20,
            targetDate: newTargetDate,
            notes: newNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create milestone");
      }

      if (showToast) showToast(`Milestone ${newPhaseCode} added successfully!`);
      setIsAddMilestoneOpen(false);
      setNewPhaseCode("");
      setNewPhaseName("");
      setNewNotes("");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleImportMilestonesFromBOQ = async () => {
    if (!project || sequencedBoqTrades.length === 0) return;
    if (!confirm(`Import all ${sequencedBoqTrades.length} trade categories from the project's BOQ in chronological construction order?`)) return;

    setIsSavingMilestone(true);
    try {
      // Calculate realistic weights normalized to 100
      const totalDefaults = sequencedBoqTrades.reduce((sum, t) => sum + (t.defaultWeight || 10), 0);
      let runningWeight = 0;

      for (let i = 0; i < sequencedBoqTrades.length; i++) {
        const trade = sequencedBoqTrades[i];
        const phaseCode = `M${milestones.length + i + 1}`;
        const itemsNotes = trade.itemsSummary || (trade.items || []).map((it) => it.item).filter(Boolean).slice(0, 4).join(", ");
        
        let phaseWeight;
        if (i === sequencedBoqTrades.length - 1) {
          phaseWeight = Math.max(1, 100 - runningWeight);
        } else {
          phaseWeight = Math.max(1, Math.round(((trade.defaultWeight || 10) / totalDefaults) * 100));
          runningWeight += phaseWeight;
        }

        if (onAddMilestone) {
          await onAddMilestone({
            projectCode: project.project_code,
            phaseCode,
            phaseName: trade.category,
            weight: phaseWeight,
            targetDate: "",
            notes: itemsNotes,
          });
        } else {
          await fetch("/api/construction/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectCode: project.project_code,
              phaseCode,
              phaseName: trade.category,
              weight: phaseWeight,
              targetDate: "",
              notes: itemsNotes,
            }),
          });
        }
      }
      if (showToast) showToast(`Successfully imported ${sequencedBoqTrades.length} milestone phases in chronological construction order!`);
    } catch (err) {
      if (showToast) showToast("Error importing from BOQ: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleDeleteMilestoneClick = async (milestoneId, phaseCode) => {
    if (!confirm(`Are you sure you want to delete milestone ${phaseCode}?`)) return;
    try {
      if (onDeleteMilestone) {
        await onDeleteMilestone(milestoneId);
      } else {
        const res = await fetch(`/api/construction/milestones/${milestoneId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (showToast) showToast(`Milestone ${phaseCode} deleted.`);
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    }
  };

  const handleSaveWalkthroughVideos = async (e) => {
    e.preventDefault();
    if (!project) return;

    const readyItems = walkthroughVideos.filter((v) => v.url && !v.error);
    if (readyItems.length === 0) {
      setWalkthroughUploadError("Pakipili po o mag-upload ng kahit isang walkthrough video bago i-publish.");
      return;
    }

    const stillUploading = walkthroughVideos.some((v) => v.isUploading);
    if (stillUploading) {
      setWalkthroughUploadError("Pakihintay po munang matapos ang pag-upload ng lahat ng video bago i-publish.");
      return;
    }

    setIsSavingWalkthrough(true);
    setWalkthroughUploadError("");
    try {
      const formattedList = readyItems.map((v, idx) => ({
        url: v.url,
        title: (v.title || "").trim() || `Walkaround View ${idx + 1}`,
        name: v.name || "",
        size: v.size || 0,
      }));
      const primaryUrl = formattedList[0].url;

      const payload = {
        projectCode: project.project_code,
        virtualTourUrl: primaryUrl,
        virtualTourUrls: formattedList,
      };

      if (onUpdateVirtualTour) {
        await onUpdateVirtualTour(payload);
      } else {
        const res = await fetch("/api/construction/virtual-tour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update tour");
      }

      if (showToast) {
        showToast(`Published ${formattedList.length} 3D walkthrough video(s) to the client portal.`);
      }
      resetVideoModal();
    } catch (err) {
      const friendly = formatFriendlyVideoError(err);
      setWalkthroughUploadError(friendly);
      if (showToast) showToast(friendly);
    } finally {
      setIsSavingWalkthrough(false);
    }
  };

  const handleSavePhotoLog = async (e) => {
    e.preventDefault();
    if (!photoTitle || !project) return;

    const readyItems = mediaItems.filter((it) => it.url && !it.error);
    if (readyItems.length === 0) {
      setPhotoUploadError("Please attach at least one uploaded photo or video before publishing.");
      return;
    }

    const stillUploading = mediaItems.some((it) => it.isUploading);
    if (stillUploading) {
      setPhotoUploadError("Please wait for all media files to finish uploading before publishing.");
      return;
    }

    setIsSavingPhoto(true);
    setPhotoUploadError("");
    try {
      const fullTitle = `[${logType}] ${photoTitle}`;
      const payload = {
        projectCode: project.project_code,
        title: fullTitle,
        caption: photoCaption,
        inspector: photoInspector,
        imageUrl: readyItems[0].url,
        category: photoCategory,
        mediaItems: readyItems.map((it) => ({
          url: it.url,
          mediaType: it.mediaType,
          is360: !!it.is360,
          category: photoCategory,
        })),
        is360: readyItems.some((it) => it.is360),
      };

      if (onAddPhoto) {
        await onAddPhoto(payload);
      } else {
        const res = await fetch("/api/construction/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add media log");
      }

      await fetchCompletionMedia();

      if (showToast) {
        showToast(`Published ${readyItems.length} media item(s) to the client portal.`);
      }
      resetPhotoForm();
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
      setPhotoUploadError(err.message || "Failed to publish media update.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhotoClick = async (logIds, title, count = 1) => {
    setPhotoDeleteTarget({
      logIds: Array.isArray(logIds) ? logIds : [logIds],
      title: title || "Site Progress Log",
      count,
    });
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
  };

  const closePhotoDeleteModal = () => {
    setPhotoDeleteTarget(null);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
  };

  const handleConfirmPhotoDelete = async () => {
    if (!photoDeleteTarget) return;
    if (!deletePassword.trim()) {
      setDeletePasswordError("Please enter the admin password or PIN to authorize deletion.");
      return;
    }

    setIsVerifyingDeletePassword(true);
    setDeletePasswordError("");
    const idList = photoDeleteTarget.logIds;
    const deleteKey = idList.join(",");

    try {
      const isValid = await verifyAdminPassword(deletePassword);
      if (!isValid) {
        setDeletePasswordError("Incorrect admin password. Please enter a valid admin credential.");
        return;
      }

      setIsDeletingPhotoId(deleteKey);
      if (onDeletePhoto) {
        await onDeletePhoto(deleteKey);
      } else {
        const res = await fetch(`/api/construction/photos/${deleteKey}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (showToast) {
        showToast(
          photoDeleteTarget.count > 1
            ? `All ${photoDeleteTarget.count} media items deleted successfully.`
            : "Media log deleted successfully."
        );
      }
      closePhotoDeleteModal();
      fetchCompletionMedia();
    } catch (err) {
      if (showToast) showToast("Error deleting media: " + err.message);
    } finally {
      setIsDeletingPhotoId(null);
      setIsVerifyingDeletePassword(false);
    }
  };

  const progressPct = Number(project?.progress_pct || 0);
  const isTurnoverEligible = progressPct >= 90;
  const hasCompletionMedia = completionMediaCount >= 3;
  const canTurnOver = isTurnoverEligible && hasCompletionMedia;
  const isStage4 =
    project?.stage_id === "COMPLETED" ||
    (project?.status || "").toLowerCase().includes("handover") ||
    (project?.status || "").toLowerCase().includes("completed");

  const currentTurnoverDate = project?.revised_turnover || project?.original_turnover || null;
  const countdownInfo = useMemo(() => getTurnoverCountdown(currentTurnoverDate), [currentTurnoverDate]);

  // Sync turnover inputs whenever project or modal opens
  useEffect(() => {
    if (project) {
      const existingDate = project.revised_turnover || project.original_turnover || "";
      if (existingDate) {
        const d = new Date(existingDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setTurnoverInputDate(`${y}-${m}-${day}`);
        } else {
          setTurnoverInputDate("");
        }
      } else {
        setTurnoverInputDate("");
      }
      setTurnoverVenue(project.location || project.target_location || "On-Site (Client Residence)");
      setTurnoverNotes("Ceremonial key turnover, joint walkthrough, and handover of the completed residence and as-built plans.");
      setIsReschedulingTurnover(false);
      setIsConfirmingTurnoverNow(false);
      setTurnoverDateError("");
    }
  }, [project?.project_code, project?.revised_turnover, project?.original_turnover, project?.location, isTurnoverModalOpen]);

  const handleApplyPresetDate = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setTurnoverInputDate(`${y}-${m}-${day}`);
    setTurnoverDateError("");
  };

  const handleSaveTurnoverSchedule = async (actionType = "schedule") => {
    if (!project) return;
    setTurnoverDateError("");

    const isTurnoverNow = actionType === "turnover_now";

    if (!isTurnoverNow) {
      if (!turnoverInputDate) {
        setTurnoverDateError("Pakipili po ang petsa para sa turnover ceremony.");
        return;
      }
      // Strict client-side check: past date prevention
      const selected = new Date(turnoverInputDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const chosenDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      if (chosenDay < today) {
        setTurnoverDateError("Hindi maaaring pumili ng nakaraang petsa. Paki-pili ang petsa ngayon o sa hinaharap.");
        return;
      }
    }

    setIsSubmittingTurnover(true);
    try {
      const projectRef = project.client_project_id || project.project_code;
      const res = await authFetch("/api/construction/turnover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectCode: projectRef,
          turnoverDate: isTurnoverNow ? getTodayDateString() : turnoverInputDate,
          venue: turnoverVenue,
          notes: turnoverNotes,
          action: isTurnoverNow ? "turnover_now" : isReschedulingTurnover ? "reschedule" : "schedule",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Nabigong i-save ang turnover schedule.");
      }

      if (showToast) {
        showToast(data.message || "Turnover schedule updated successfully.");
      }

      // If project has transitioned to Stage 4 (immediate or today)
      if (data.isStage4) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mcpa-project-stage-updated", {
              detail: {
                clientProjectId: project.client_project_id,
                projectCode: project.project_code,
                targetStage: "COMPLETED",
              },
            })
          );
        }
      }

      // Refresh project in parent if onSelectProject callback exists
      if (onSelectProject) {
        try {
          const freshRes = await authFetch(`/api/construction/projects/${encodeURIComponent(project.project_code)}`).then((r) => r.json());
          if (freshRes.success && freshRes.project) {
            onSelectProject(freshRes.project);
          }
        } catch {}
      }

      setIsTurnoverModalOpen(false);
      setIsConfirmingTurnoverNow(false);
      setIsReschedulingTurnover(false);
    } catch (err) {
      setTurnoverDateError(err.message || "Nagkaroon ng problema sa pag-update ng turnover.");
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSubmittingTurnover(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STAGE 3 CUSTOMER COMBOBOX */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Stage3CustomerSelector
          selectedProject={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />

        {project && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            {/* Condition: Show Turn Over button ONLY if progress >= 90% or if already in Stage 4 */}
            {isStage4 ? (
              <button
                type="button"
                onClick={() => setIsTurnoverModalOpen(true)}
                className="px-3 py-2 rounded-[4px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Stage 4 Active (Turned Over) — Click to view details"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stage 4: Turned Over</span>
              </button>
            ) : isTurnoverEligible ? (
              canTurnOver ? (
                <button
                  type="button"
                  onClick={() => setIsTurnoverModalOpen(true)}
                  className="px-3.5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 border border-amber-500 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="3+ Completion Photos Verified! Open Turnover & Key Handover Hub"
                >
                  <Key className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Turn Over (Stage 4)</span>
                  <span className="px-1.5 py-0.5 bg-black/20 text-[10px] rounded-[2px] font-mono font-bold">
                    {completionMediaCount}/3 ✓
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const hudEl = document.getElementById("completion-media-gate-hud");
                    if (hudEl) hudEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    if (showToast) showToast(`Gate Locked: ${completionMediaCount}/3 completion photos uploaded. Upload at least 3 finished photos below.`);
                  }}
                  className="px-3 py-2 rounded-[4px] bg-[#121620] hover:bg-[#181d2a] border border-[#222838] hover:border-amber-500/50 text-neutral-300 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  title={`Gate Locked: ${completionMediaCount}/3 completion photos uploaded. Click to view dossier requirement.`}
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Turn Over (Stage 4)</span>
                  <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] rounded-[2px] font-mono font-bold">
                    {completionMediaCount}/3 REQ
                  </span>
                </button>
              )
            ) : null}

            <button
              type="button"
              onClick={() => {
                setWalkthroughVideos(resolveInitialWalkthroughs(project));
                setWalkthroughUploadError("");
                setIs3DVideoModalOpen(true);
              }}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-amber-500" />
              <span>3D Walkthrough Videos</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddPhotoOpen(true)}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Post Progress Update</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextNum = milestones.length + 1;
                setNewPhaseCode(`M${nextNum}`);
                setIsAddMilestoneOpen(true);
              }}
              className="px-3.5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CONDITIONAL VIEW: EMPTY STATE VS ACTIVE PROJECT MANAGEMENT */}
      {!project ? (
        <AdminEmptyState
          variant="card"
          iconSrc="https://cdn.lordicon.com/wzwygmng.json"
          fallback={HardHat}
          size={104}
          colors="primary:#f59e0b,secondary:#38bdf8"
          badgeText="Stage 3 • Active Site Execution"
          title="No Stage 3 Client Project Selected"
          description="Please use the customer selector above to choose an active construction client. You can configure milestone phases (M1-Mn), update progress %, and upload 3D walkthrough videos."
        />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* COMPLETION MEDIA GATE TELEMETRY HUD (ARCHITECTURAL DOSSIER SYSTEM) */}
          {(isTurnoverEligible || isStage4) && (
            <div
              id="completion-media-gate-hud"
              className="relative p-5 rounded-[4px] bg-white dark:bg-[#121620] border border-neutral-200 dark:border-[#222838] shadow-xs space-y-4"
            >
              {/* Corner Drafting Marks (Architectural Aesthetic) */}
              <div className="absolute top-1.5 left-2 font-mono text-[9px] text-neutral-400 dark:text-[#333d52] select-none pointer-events-none">┌</div>
              <div className="absolute top-1.5 right-2 font-mono text-[9px] text-neutral-400 dark:text-[#333d52] select-none pointer-events-none">┐</div>
              <div className="absolute bottom-1.5 left-2 font-mono text-[9px] text-neutral-400 dark:text-[#333d52] select-none pointer-events-none">└</div>
              <div className="absolute bottom-1.5 right-2 font-mono text-[9px] text-neutral-400 dark:text-[#333d52] select-none pointer-events-none">┘</div>

              {/* Title Block Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-[#222838]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-neutral-500 dark:text-[#94a3b8] uppercase font-bold">
                      SHEET REF: MCPA-TURNOVER-GATE-04
                    </span>
                    <span className="text-neutral-300 dark:text-[#333d52]">│</span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                      {project.project_code}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-[#f8fafc] font-mono flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Completion Media Dossier &amp; Stage 4 Gate</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {hasCompletionMedia || isStage4 ? (
                    <span className="px-2.5 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>GATE CLEARED ({completionMediaCount} PHOTOS)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-[4px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                      <span>GATE LOCKED ({completionMediaCount}/3 REQ)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Telemetry Gauge & Description */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 text-xs text-neutral-600 dark:text-[#94a3b8] leading-relaxed">
                  <p>
                    Executive handover to Stage 4 (15-Year Structural Warranty) requires at least three (3) high-fidelity finished project photographs. These verified assets are archived into the client&apos;s official turnover dossier and published to the MCPA Showcase portfolio.
                  </p>
                </div>
                <div className="md:col-span-4 bg-neutral-50 dark:bg-[#0a0c10] border border-neutral-200 dark:border-[#222838] p-3 rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500 dark:text-[#64748b] uppercase font-medium">Dossier Compliance</span>
                    <span className={`font-bold ${hasCompletionMedia ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {Math.min(100, Math.round((completionMediaCount / 3) * 100))}% ({completionMediaCount}/3)
                    </span>
                  </div>
                  {/* Segmented Mechanical Progress Track */}
                  <div className="grid grid-cols-3 gap-1 h-2">
                    {[0, 1, 2].map((slotIdx) => (
                      <div
                        key={slotIdx}
                        className={`h-full rounded-[1px] transition-colors ${
                          slotIdx < completionMediaCount
                            ? "bg-emerald-500"
                            : "bg-neutral-200 dark:bg-[#222838]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 3-Slot Architectural Media Dossier Strip */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-500 dark:text-[#64748b] font-bold">
                    Completion Photography Dossier Slots
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoCategory("completion");
                      setIsAddPhotoOpen(true);
                    }}
                    className="font-mono text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Finished Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIndex) => {
                    const item = completionMedia[slotIndex];
                    if (item) {
                      return (
                        <div
                          key={item.log_id || slotIndex}
                          className="group relative rounded-[4px] bg-white dark:bg-[#0a0c10] border border-neutral-200 dark:border-[#222838] hover:border-amber-500/50 transition-all overflow-hidden flex flex-col justify-between shadow-xs"
                        >
                          <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                            {item.media_type === "video" ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/60">
                                <Film className="w-8 h-8 text-amber-500" />
                              </div>
                            ) : (
                              <img
                                src={item.image_url}
                                alt={item.title || "Completion photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-black/75 border border-white/10 font-mono text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>SLOT 0{slotIndex + 1} ✓</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(item.image_url, item.title, item.media_type)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              title="Inspect Image"
                            >
                              <Maximize2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                          <div className="p-2.5 border-t border-neutral-200 dark:border-[#222838] bg-neutral-50 dark:bg-[#121620] space-y-0.5">
                            <p className="font-mono text-xs font-bold text-neutral-900 dark:text-[#f8fafc] truncate">
                              {item.title || `Finished Detail 0${slotIndex + 1}`}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-[#64748b]">
                              <span>{item.log_date || "Turnover Asset"}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Empty wireframe dropzone slot
                    return (
                      <div
                        key={`pending-${slotIndex}`}
                        onClick={() => {
                          setPhotoCategory("completion");
                          setIsAddPhotoOpen(true);
                        }}
                        className="group relative rounded-[4px] border border-dashed border-amber-500/30 hover:border-amber-500 bg-amber-500/[0.02] hover:bg-amber-500/[0.06] transition-all flex flex-col items-center justify-center p-5 text-center cursor-pointer min-h-[140px]"
                      >
                        <div className="w-9 h-9 rounded-[4px] bg-neutral-100 dark:bg-[#0a0c10] border border-neutral-200 dark:border-[#222838] group-hover:border-amber-500/50 flex items-center justify-center text-amber-500 mb-2 transition-colors">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors">
                          [+] SLOT 0{slotIndex + 1}: PENDING UPLOAD
                        </span>
                        <p className="font-mono text-[10.5px] text-neutral-400 dark:text-[#64748b] mt-1">
                          Click to upload finished photo
                        </p>
                      </div>
                    );
                  })}
                </div>

                {completionMedia.length > 3 && (
                  <p className="font-mono text-[11px] text-neutral-500 dark:text-[#64748b] text-right pt-1">
                    + {completionMedia.length - 3} additional completion photo(s) cataloged in dossier.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Project Details Banner */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-neutral-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
                    {project.project_code}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold">
                    Stage 3 • Active Build
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  {project.name || project.project_title}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.location || project.target_location}</span>
                  <span>•</span>
                  <span>Owner: {project.client_name}</span>
                </p>
              </div>

              {/* Overall Accomplishment Gauge */}
              <div className="lg:text-right min-w-[260px] space-y-1.5">
                <div className="flex items-baseline justify-between lg:justify-end gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 font-mono">
                    Overall % Accomplishment
                  </span>
                  <span className="text-3xl font-extrabold text-amber-500 font-mono">
                    {project.progress_pct || 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress_pct || 0}%` }}
                  />
                </div>
                <p className="text-[10.5px] text-neutral-400 font-mono">
                  Supervising Engineer: {project.lead_engineer || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Timetable Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono">
              {/* Card 1: GROUNDBREAKING & MOBILIZATION */}
              <div className="relative p-4 rounded-[10px] bg-white dark:bg-[#12151d] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>GROUNDBREAKING &amp; MOBILIZATION</span>
                  </span>
                  <span className="text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                    Site Kickoff
                  </span>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    {project.groundbreaking_date
                      ? formatHumanDate(project.groundbreaking_date)
                      : project.contract_date
                      ? formatHumanDate(project.contract_date)
                      : "Pending Schedule"}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-1 leading-snug">
                    Formal groundbreaking ceremony and official start of on-site construction.
                  </p>
                </div>
              </div>

              {/* Card 2: ORIGINAL TURNOVER */}
              <div className="relative p-4 rounded-[10px] bg-white dark:bg-[#12151d] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs hover:border-neutral-400/40 dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>ORIGINAL TURNOVER</span>
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-[9px] font-bold uppercase tracking-wider">
                    Contract Target
                  </span>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    {project.original_turnover
                      ? formatHumanDate(project.original_turnover)
                      : project.revised_turnover
                      ? `${formatHumanDate(project.revised_turnover)} (Target)`
                      : "Pending Schedule"}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-1 leading-snug">
                    Original completion target defined by the approved contract.
                  </p>
                </div>
              </div>

              {/* Card 3: REVISED TURNOVER (CRITICAL PATH) */}
              <div className="relative p-4 rounded-[10px] bg-white dark:bg-[#12151d] border border-amber-500/30 dark:border-amber-500/30 shadow-xs hover:border-amber-500/60 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>REVISED TURNOVER (CRITICAL PATH)</span>
                  </span>
                  {countdownInfo ? (
                    <span className={`text-[9.5px] font-mono font-bold ${countdownInfo.badgeClass}`}>
                      {countdownInfo.label}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                      Handover Target
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                    {project.revised_turnover
                      ? formatHumanDate(project.revised_turnover)
                      : project.original_turnover
                      ? formatHumanDate(project.original_turnover)
                      : "Pending Schedule"}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-1 leading-snug">
                    Active date for the ceremonial key handover and Stage 4 transition.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 4 Turnover & Key Handover Readiness Hub */}
            {isStage4 ? (
              <div className="p-4 rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold uppercase tracking-wider text-[11px]">
                        Nasa Stage 4 Na: Finished Project &amp; Wrapped
                      </p>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase text-[9.5px]">
                        Handed Over
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-sans mt-0.5">
                      Naka-sync na sa Projects Showcase (draft) ang 90%+ na larawan, at naka-unlock na sa client portal ang Finished Project at Project Wrapped.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTurnoverModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Turnover Details</span>
                </button>
              </div>
            ) : isTurnoverEligible ? (
              <div className="p-4 sm:p-5 rounded-[12px] bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 border border-emerald-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                      <span>{progressPct}% Accomplished • Turnover Ready</span>
                    </span>
                    {countdownInfo && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${countdownInfo.badgeClass}`}>
                        {countdownInfo.label}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white font-mono tracking-tight">
                    {currentTurnoverDate
                      ? `Nakatakdang Turnover: ${formatHumanDate(currentTurnoverDate)}`
                      : "Handa na para sa Turn Over sa Stage 4 (Finished Project)"}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans max-w-xl leading-relaxed">
                    {currentTurnoverDate
                      ? "Nakatakda na ang petsa ng ceremonial key handover. Pagsapit ng petsang ito, awtomatiko itong lilipat sa Stage 4. Maaari mo ring baguhin ang petsa o i-turnover na kaagad ngayon."
                      : "Naabot na ng proyekto ang 90% threshold. Maaari ka nang mag-set ng petsa ng turnover ceremony o i-turnover na ngayon upang i-promote sa Stage 4."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReschedulingTurnover(Boolean(currentTurnoverDate));
                      setIsConfirmingTurnoverNow(false);
                      setIsTurnoverModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-[6px] bg-white dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-bold border border-neutral-300 dark:border-white/15 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentTurnoverDate ? "I-reschedule ang Petsa" : "Mag-set ng Petsa"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsReschedulingTurnover(false);
                      setIsConfirmingTurnoverNow(true);
                      setIsTurnoverModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Turn Over Now</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Turnover Readiness Gate: Magbubukas kapag umabot sa <strong className="text-neutral-900 dark:text-white">90%</strong> accomplishment (Kasalukuyan: <strong className="text-amber-500">{progressPct}%</strong> • {Math.max(0, 90 - progressPct)}% remaining).
                  </span>
                </div>
                <div className="w-full sm:w-36 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0">
                  <div
                    className="h-full bg-amber-500/70 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((progressPct / 90) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. MILESTONE PHASES LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono">
                  Milestone Phases (M1–Mn) &amp; Accomplishment Controls
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Click &quot;Update Progress&quot; on any milestone to record verified accomplishments with notes. The overall project percentage updates automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  {milestones.length} {milestones.length === 1 ? "Milestone" : "Milestones"}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenAddMilestone()}
                  className="px-2.5 py-1 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Phase</span>
                </button>
              </div>
            </div>

            {milestones.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-dashed border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-400 space-y-3">
                <p>No milestone phases created for {project.project_code} yet.</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAddMilestone()}
                    className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Milestone 1</span>
                  </button>

                  {sequencedBoqTrades.length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingMilestone}
                      onClick={handleImportMilestonesFromBOQ}
                      className="px-3 py-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 border border-neutral-200 dark:border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Import {sequencedBoqTrades.length} Phases from Project BOQ</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((ms, idx) => {
                  const isDone = ms.completion_pct === 100 || ms.status === "Completed";
                  const isInProgress = ms.completion_pct > 0 && ms.completion_pct < 100;
                  return (
                    <div
                      key={ms.milestone_id || idx}
                      className="p-4 sm:p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold uppercase">
                            {ms.phase_code}
                          </span>
                          <span
                            className={`text-[10.5px] uppercase font-mono font-bold ${
                              isDone
                                ? "text-emerald-700 dark:text-emerald-400"
                                : isInProgress
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-neutral-500"
                            }`}
                          >
                            {ms.status || "Upcoming"}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            Weight: {ms.weight || 20}%
                          </span>
                          {ms.target_date && (
                            <span className="text-[11px] font-mono text-neutral-400">
                              • Target: {ms.target_date}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {ms.phase_name}
                        </h4>
                        {ms.notes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 font-light">
                            {ms.notes}
                          </p>
                        )}
                      </div>

                      {/* Percentage & Actions */}
                      <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-white/5">
                        <div className="text-right min-w-[70px]">
                          <span className="text-xl font-bold font-mono text-amber-500">
                            {ms.completion_pct || 0}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(ms)}
                          className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update Progress</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMilestoneClick(ms.milestone_id, ms.phase_code)}
                          className="p-1.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. SITE PROGRESS & INSPECTION GALLERY (PHOTOS & VIDEOS) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Site Progress &amp; Media Gallery</span>
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Inspection photos and videos published to the client portal. Clients can stream and inspect them directly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  {groupedMediaUpdates.length} {groupedMediaUpdates.length === 1 ? "Update" : "Updates"}
                  {photos.length > groupedMediaUpdates.length && ` (${photos.length} Media Files)`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post Media Update</span>
                </button>
              </div>
            </div>

            {groupedMediaUpdates.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-dashed border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-400 space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    No site photos or videos posted yet for {project.project_code}.
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Upload multiple photos (max 10MB each) or videos (unlimited size) to show live construction progress to the client.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Site Photos &amp; Videos</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMediaUpdates.map((group) => {
                  const isDeleting =
                    isDeletingPhotoId === group.allLogIds.join(",") ||
                    group.allLogIds.some((id) => isDeletingPhotoId === id || isDeletingPhotoId === String(id));
                  return (
                    <MediaGroupCard
                      key={group.groupKey}
                      group={group}
                      onOpenPreview={handleOpenPreview}
                      onDelete={handleDeletePhotoClick}
                      isDeleting={isDeleting}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD MILESTONE (M1, M2, M3...) - CIVIL ENGINEERING TIMELINE BUILDER */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden transition-all">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center text-amber-500 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                      Add Milestone Phase
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {newPhaseCode || `M${milestones.length + 1}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                    Chronological house construction sequence aligned with project BOQ quotation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMilestoneOpen(false)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto px-5 py-4 space-y-5 text-xs font-sans">
              
              {/* SECTION A: CHRONOLOGICAL STAGE SUGGESTION ENGINE */}
              {sequencedBoqTrades.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Civil Construction Sequence ({sequencedBoqTrades.length} Stages)</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {sequencedBoqTrades.filter((t) => t.isAdded).length} of {sequencedBoqTrades.length} Mapped
                    </span>
                  </div>

                  {/* HERO CARD: NEXT RECOMMENDED STAGE */}
                  {nextRecommendedTrade && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border border-amber-500/25 dark:border-amber-400/25 relative overflow-hidden group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-neutral-950 shadow-2xs">
                              Next logical stage
                            </span>
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                              Stage {nextRecommendedTrade.step < 10 ? `0${nextRecommendedTrade.step}` : nextRecommendedTrade.step} • {nextRecommendedTrade.shortBadge}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {nextRecommendedTrade.category}
                          </h5>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-normal line-clamp-1">
                            {nextRecommendedTrade.description}
                          </p>
                          {nextRecommendedTrade.itemsSummary && (
                            <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 line-clamp-1 font-mono">
                              Items: {nextRecommendedTrade.itemsSummary}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {newPhaseName === nextRecommendedTrade.category ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs inline-flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active Selection</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTrade(nextRecommendedTrade)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>Apply Stage {nextRecommendedTrade.step < 10 ? `0${nextRecommendedTrade.step}` : nextRecommendedTrade.step}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHRONOLOGICAL STAGES GRID */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                      All Construction Stages (Ordered Chronologically):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {sequencedBoqTrades.map((trade, tIdx) => {
                        const isSelected = newPhaseName === trade.category;
                        const TradeIcon = trade.Icon || Layers;
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => handleSelectTrade(trade)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 group ${
                              isSelected
                                ? "bg-amber-500/10 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30"
                                : trade.isAdded
                                ? "bg-neutral-50/70 dark:bg-white/[0.02] border-neutral-200/60 dark:border-white/[0.05] hover:border-neutral-300 dark:hover:border-white/10"
                                : "bg-white dark:bg-[#141722] border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/[0.02]"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[9px] font-mono font-bold text-neutral-400 group-hover:text-amber-500 transition-colors">
                                STAGE {trade.step < 10 ? `0${trade.step}` : trade.step}
                              </span>
                              {trade.isAdded ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>{trade.existingMilestone?.phase_code || "In Plan"}</span>
                                </span>
                              ) : trade === nextRecommendedTrade ? (
                                <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  NEXT
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-neutral-400">
                                  ~{trade.defaultWeight}%
                                </span>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <TradeIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                isSelected ? "text-amber-500" : trade.isAdded ? "text-neutral-400" : "text-amber-600 dark:text-amber-400"
                              }`} />
                              <div className="min-w-0">
                                <h6 className={`text-xs font-semibold truncate leading-tight ${
                                  isSelected ? "text-amber-600 dark:text-amber-400" : "text-neutral-900 dark:text-neutral-200"
                                }`}>
                                  {trade.category}
                                </h6>
                                <p className="text-[10px] text-neutral-400 truncate font-light">
                                  {trade.itemsCount > 0 ? `${trade.itemsCount} BOQ items` : trade.shortBadge}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: MILESTONE CONFIGURATION FORM */}
              <form id="add-milestone-form" onSubmit={handleCreateMilestone} className="space-y-4 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono">
                    Phase Parameters
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-neutral-400">Timeline Allocated:</span>
                    <span className={`font-bold ${
                      totalAllocatedWeight + (Number(newWeight) || 0) > 100
                        ? "text-rose-500"
                        : totalAllocatedWeight + (Number(newWeight) || 0) === 100
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}>
                      {totalAllocatedWeight + (Number(newWeight) || 0)}% / 100%
                    </span>
                  </div>
                </div>

                {/* Row 1: Phase Code & Weight Allocation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1">
                      Phase Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPhaseCode}
                      onChange={(e) => setNewPhaseCode(e.target.value.toUpperCase())}
                      placeholder="e.g. M1, M2"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                      Next in sequence: M{milestones.length + 1}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">
                        Weight Percentage (%) <span className="text-rose-500">*</span>
                      </label>
                      {remainingTimelineWeight > 0 && (
                        <button
                          type="button"
                          onClick={() => setNewWeight(String(remainingTimelineWeight))}
                          className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Fill Remaining ({remainingTimelineWeight}%)
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs font-bold">
                        %
                      </span>
                    </div>
                    <span className={`text-[10px] mt-0.5 block font-mono ${
                      totalAllocatedWeight + (Number(newWeight) || 0) > 100
                        ? "text-rose-500 font-semibold"
                        : totalAllocatedWeight + (Number(newWeight) || 0) === 100
                        ? "text-emerald-500 font-semibold"
                        : "text-neutral-400"
                    }`}>
                      {totalAllocatedWeight + (Number(newWeight) || 0) > 100
                        ? `Exceeds 100% total by ${totalAllocatedWeight + (Number(newWeight) || 0) - 100}%`
                        : totalAllocatedWeight + (Number(newWeight) || 0) === 100
                        ? "✓ Perfect 100% total milestone distribution"
                        : `${100 - (totalAllocatedWeight + (Number(newWeight) || 0))}% remaining for later stages`}
                    </span>
                  </div>
                </div>

                {/* Row 2: Milestone Name */}
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1">
                    Milestone Phase Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="e.g. Earthworks & Structural Concrete"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Row 3: Target Completion Date */}
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 flex items-center justify-between">
                    <span>Target Accomplishment Date</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Optional milestone target</span>
                  </label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Row 4: Scope / BOQ Line Items */}
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 flex items-center justify-between">
                    <span>Included Works &amp; Scope Summary</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Auto-filled from BOQ</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Column footings excavation, tie-beam rebar assembly, ready-mix concrete pouring"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div className="text-[11px] font-mono text-neutral-400 hidden sm:block">
                Press Save to add to client portal timeline
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-milestone-form"
                  disabled={isSavingMilestone}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5 active:scale-95"
                >
                  {isSavingMilestone ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Phase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Milestone Phase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE MILESTONE PROGRESS (%) WITH DEDUCTION & REASON AUDIT */}
      {activeUpdateMilestone && (() => {
        const recordedPct = Number(activeUpdateMilestone.completion_pct || 0);
        const currentInputPct = Math.min(100, Math.max(0, parseInt(updatePct, 10) || 0));
        const isDeduction = currentInputPct < recordedPct;
        const isGain = currentInputPct > recordedPct;
        const diffAmount = Math.abs(currentInputPct - recordedPct);

        return (
          <div
            className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-progress-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmittingUpdate) {
                setActiveUpdateMilestone(null);
              }
            }}
          >
            <div
              className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#0f1118] border border-neutral-200/80 dark:border-white/[0.08] shadow-2xl shadow-neutral-950/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-white/[0.06] flex items-start justify-between gap-4 bg-neutral-50/50 dark:bg-white/[0.01] shrink-0">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10">
                      Phase {activeUpdateMilestone.phase_code}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      Recorded Baseline: <strong className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">{recordedPct}%</strong>
                    </span>
                  </div>
                  <h3 id="update-progress-title" className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight truncate">
                    {activeUpdateMilestone.phase_name}
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={isSubmittingUpdate}
                  onClick={() => setActiveUpdateMilestone(null)}
                  aria-label="Close modal"
                  className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                id="update-milestone-form"
                onSubmit={handleSaveUpdate}
                className="overflow-y-auto px-6 py-5 space-y-5 text-sm font-sans"
              >
                {/* HERO PROGRESS CONTROL CARD */}
                <div className="rounded-xl bg-neutral-50/70 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/[0.06] p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="update-pct-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Target Accomplishment
                    </label>

                    {/* Status / Delta Indicator Pill */}
                    {isDeduction ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20 tabular-nums shadow-2xs">
                        <TrendingDown className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Deduction: -{diffAmount}% ({recordedPct}% → {currentInputPct}%)</span>
                      </span>
                    ) : isGain ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 tabular-nums shadow-2xs">
                        <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Progress: +{diffAmount}% ({recordedPct}% → {currentInputPct}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 tabular-nums">
                        <span>No change ({recordedPct}%)</span>
                      </span>
                    )}
                  </div>

                  {/* Dual-Track Visual Progress Indicator */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="h-2 rounded-full bg-neutral-200/80 dark:bg-white/10 relative overflow-hidden">
                      {/* Baseline Marker Tick */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 dark:bg-neutral-500 z-10"
                        style={{ left: `${Math.min(99.5, Math.max(0.5, recordedPct))}%` }}
                        title={`Baseline: ${recordedPct}%`}
                      />
                      {/* Active Fill Bar */}
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                          isDeduction
                            ? "bg-rose-500"
                            : isGain
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${currentInputPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>0%</span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Baseline: {recordedPct}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Stepper Input Row */}
                  <div className="flex items-stretch gap-2.5 pt-1">
                    <button
                      type="button"
                      aria-label="Decrease by 5 percent"
                      onClick={() => setUpdatePct((prev) => Math.max(0, Number(prev || 0) - 5))}
                      className="w-12 h-12 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                    >
                      <Minus className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    <div className="relative flex-1">
                      <input
                        id="update-pct-input"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={updatePct}
                        onChange={(e) => setUpdatePct(e.target.value)}
                        className={`w-full h-12 px-4 text-center rounded-xl bg-white dark:bg-neutral-900/90 border text-3xl font-bold tabular-nums tracking-tight transition-all focus:outline-none focus:ring-2 ${
                          isDeduction
                            ? "text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 focus:ring-rose-500/20 focus:border-rose-500"
                            : isGain
                            ? "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 focus:ring-emerald-500/20 focus:border-emerald-500"
                            : "text-neutral-900 dark:text-white border-neutral-200 dark:border-white/15 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-900 dark:focus:border-white"
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400 pointer-events-none">
                        %
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Increase by 5 percent"
                      onClick={() => setUpdatePct((prev) => Math.min(100, Number(prev || 0) + 5))}
                      className="w-12 h-12 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                    >
                      <Plus className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  </div>

                </div>

                {/* DEDUCTION JUSTIFICATION BLOCK (REQUIRED WHEN REDUCING PERCENTAGE) */}
                {isDeduction && (
                  <div className="rounded-xl p-4.5 bg-rose-500/[0.04] dark:bg-rose-500/[0.06] border border-rose-500/25 dark:border-rose-500/30 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>Deduction Justification Required</span>
                          <span className="text-rose-600 text-xs font-bold">*</span>
                        </h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                          Accomplishment is being rolled back by {diffAmount}% (from {recordedPct}% to {currentInputPct}%). Company quality standards require an official justification for the project audit trail.
                        </p>
                      </div>
                    </div>

                    {/* Category Selection Grid - Pure English, Clean SVG icons, NO EMOJIS */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Select Deficiency or Scope Revision Category <span className="text-rose-600">*</span>
                      </label>
                      <div
                        role="radiogroup"
                        aria-label="Deduction reason category"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        {DEDUCTION_REASON_OPTIONS.map((opt) => {
                          const IconComp = opt.icon;
                          const isActive = deductionCategory === opt.label;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              title={opt.tag}
                              onClick={() => {
                                setDeductionCategory(opt.label);
                                setDeductionError("");
                              }}
                              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                                isActive
                                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs font-semibold ring-1 ring-neutral-900 dark:ring-white"
                                  : "bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20 hover:bg-neutral-50 dark:hover:bg-white/[0.03] font-medium"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                  isActive
                                    ? "bg-white/20 dark:bg-neutral-950/20 text-white dark:text-neutral-950"
                                    : "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                                }`}
                              >
                                {IconComp ? <IconComp className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                              </span>
                              <span className="truncate leading-snug">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detailed Technical Remarks */}
                    <div className="space-y-1.5">
                      <label htmlFor="deduction-details" className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        {deductionCategory === "Other"
                          ? "Specify Reason & Scope Details"
                          : "Technical Explanation & Corrective Action"} <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        id="deduction-details"
                        rows={3}
                        required={deductionCategory === "Other" || !deductionCategory}
                        value={deductionReasonDetails}
                        onChange={(e) => {
                          setDeductionReasonDetails(e.target.value);
                          if (e.target.value.trim()) setDeductionError("");
                        }}
                        placeholder={
                          deductionCategory === "Other"
                            ? "Describe why the accomplishment percentage is being lowered and any agreed adjustments..."
                            : "e.g., Demolition of misaligned masonry wall on Grid 3 required; concrete re-pour scheduled following re-inspection per structural engineer notice #104..."
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-neutral-900/70 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white text-xs font-sans placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 resize-none transition-all leading-relaxed"
                      />
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                        This explanation will be permanently recorded in the project accomplishment audit trail.
                      </p>
                    </div>

                    {deductionError && (
                      <div role="alert" className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-medium">{deductionError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WORK LOG & FIELD INSPECTION NOTES (OPTIONAL) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="update-notes" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Work Log &amp; Inspection Notes
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400 uppercase">Optional</span>
                  </div>
                  <textarea
                    id="update-notes"
                    rows={3}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="e.g., Concrete pour test cylinder samples collected; rebar tie spacing and spacing block verified by project engineer."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-neutral-900/70 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white text-xs font-sans placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 resize-none transition-all leading-relaxed"
                  />
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                    Standard site accomplishments, inspection references, or subcontractor progress notes.
                  </p>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/40 dark:bg-white/[0.01] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isDeduction ? (
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Audit trail entry will be recorded with your credentials</span>
                    </span>
                  ) : (
                    <span>Overall project accomplishment will automatically recalculate</span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingUpdate}
                    onClick={() => setActiveUpdateMilestone(null)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="update-milestone-form"
                    disabled={isSubmittingUpdate}
                    className={`px-4.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-98 ${
                      isDeduction
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                    }`}
                  >
                    {isSubmittingUpdate ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Updates...</span>
                      </>
                    ) : isDeduction ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Confirm Reduction &amp; Recalculate</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Apply Progress &amp; Recalculate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: 3D WALKTHROUGH VIDEO UPLOAD / URL (MULTIPLE VIDEOS) */}
      {is3DVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[14px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 p-4 sm:p-5 shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm sm:text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                    3D Architectural Walk-Around Videos
                  </h4>
                  {walkthroughVideos.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                      {walkthroughVideos.length} Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Mag-upload ng maramihang walkthrough videos (hal. Exterior, Ground Floor, 2nd Floor, Roofing) na may sariling label/title para sa client portal.
                </p>
              </div>
              <button
                type="button"
                onClick={resetVideoModal}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1.5 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveWalkthroughVideos} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
              {/* Hidden file input */}
              <input
                ref={walkthroughFileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/*"
                onChange={(e) => {
                  handleWalkthroughFilesSelect(e.target.files);
                  if (e.target) e.target.value = "";
                }}
                className="hidden"
              />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => walkthroughFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-[6px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Videos (Multiple)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUrlInput(!showAddUrlInput);
                      setWalkthroughUploadError("");
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{showAddUrlInput ? "Hide URL Input" : "Add Direct URL"}</span>
                  </button>
                </div>

                <span className="text-[10px] text-neutral-400 font-mono">
                  No size limit • MP4, WebM, MOV
                </span>
              </div>

              {/* Inline Direct URL Card */}
              {showAddUrlInput && (
                <div className="p-3.5 rounded-[8px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Add Direct Video / Streaming Link
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddUrlInput(false)}
                      className="text-neutral-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={manualWalkthroughUrl}
                      onChange={(e) => setManualWalkthroughUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="px-3 py-2 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={manualWalkthroughTitle}
                      onChange={(e) => setManualWalkthroughTitle(e.target.value)}
                      placeholder="Title (e.g. 2nd Floor Bedrooms)"
                      className="px-3 py-2 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!manualWalkthroughUrl.trim()}
                      onClick={handleAddManualWalkthroughUrl}
                      className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer text-xs"
                    >
                      + Add to Walkthrough List
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State / Dropzone when no videos */}
              {walkthroughVideos.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) handleWalkthroughFilesSelect(e.dataTransfer.files);
                  }}
                  onClick={() => walkthroughFileInputRef.current?.click()}
                  className="w-full p-10 rounded-[10px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Film className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      Click to select or drag &amp; drop 3D Walk-Around Videos
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-1">
                      Puwede mag-upload ng maramihang videos (Exterior, Ground Floor, 2nd Floor, Roofing) • Walang size limit
                    </p>
                  </div>
                </div>
              ) : (
                /* Videos Queue Cards */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>Attached Walkthrough Videos ({walkthroughVideos.length})</span>
                    <span>Client Portal Order</span>
                  </div>

                  <div className="space-y-2.5">
                    {walkthroughVideos.map((vid, idx) => (
                      <div
                        key={vid.id}
                        className="rounded-[10px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0c0e14] p-3 space-y-2.5 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Video Thumbnail / Preview */}
                          <div className="w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-[6px] overflow-hidden bg-black shrink-0 relative flex items-center justify-center border border-black/20">
                            {vid.previewUrl || vid.url ? (
                              <video
                                src={vid.previewUrl || vid.url}
                                controls
                                playsInline
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center text-neutral-500">
                                <Film className="w-6 h-6 animate-pulse" />
                              </div>
                            )}
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[9.5px] font-mono font-bold">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Video Info & Editable Title */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                  Part / Zone Name (Ipapakita sa client tab)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWalkthrough(vid.id)}
                                  className="text-neutral-400 hover:text-rose-500 p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                                  title="Remove this video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <input
                                type="text"
                                value={vid.title}
                                onChange={(e) => handleUpdateWalkthroughTitle(vid.id, e.target.value)}
                                placeholder="hal. Ground Living & Dining"
                                className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                              />

                              <p className="text-[10px] text-neutral-400 truncate font-mono">
                                {vid.name} {vid.size ? `• ${(vid.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                              </p>
                            </div>

                            {/* Status & Progress */}
                            <div>
                              {vid.isUploading ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10.5px]">
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>
                                        {vid.uploadProgress < 100
                                          ? "Uploading to Cloud Storage..."
                                          : "Finalizing stream..."}
                                      </span>
                                    </span>
                                    <span className="font-bold text-neutral-900 dark:text-white">
                                      {vid.uploadProgress}%
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                                      style={{ width: `${vid.uploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : vid.error ? (
                                <div className="text-[10.5px] text-rose-500 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{vid.error}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-500 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                  <span>Video Attached &amp; Streaming Ready</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more videos dashed drop strip */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files) handleWalkthroughFilesSelect(e.dataTransfer.files);
                    }}
                    onClick={() => walkthroughFileInputRef.current?.click()}
                    className="p-3.5 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-center gap-2 cursor-pointer transition-colors text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300"
                  >
                    <Plus className="w-4 h-4 text-amber-500" />
                    <span>+ Add More Walk-Around Videos</span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {walkthroughUploadError && (
                <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Paunawa sa Pag-Upload
                    </p>
                    <p className="text-[11.5px] leading-relaxed font-sans">{walkthroughUploadError}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                <span className="text-[11px] text-neutral-400 font-mono">
                  {walkthroughVideos.filter((v) => v.url && !v.error).length} of {walkthroughVideos.length} video(s) ready to stream
                </span>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetVideoModal}
                    className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSavingWalkthrough ||
                      walkthroughVideos.some((v) => v.isUploading) ||
                      walkthroughVideos.filter((v) => v.url && !v.error).length === 0
                    }
                    className="px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    {isSavingWalkthrough ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {walkthroughVideos.length > 1
                            ? `Publish ${walkthroughVideos.length} Walkthrough Videos`
                            : "Publish Walkthrough"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: POST SITE PROGRESS & GALLERY UPDATE (MULTIPLE PHOTOS & VIDEOS) */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Post Site Progress &amp; Gallery Update</span>
                </h4>
                <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
                  Upload multiple photos (max 10MB) &amp; videos (unlimited size) for the client portal.
                </p>
              </div>
              <button
                type="button"
                onClick={resetPhotoForm}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhotoLog} className="space-y-4 text-xs font-mono">
              {/* UPLOAD CLASSIFICATION DISPATCH STAMPS */}
              <div className="space-y-1.5">
                <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                  Classification Dispatch *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPhotoCategory("progress")}
                    className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer font-mono ${
                      photoCategory === "progress"
                        ? "border-amber-500 bg-amber-500/[0.08] text-neutral-900 dark:text-white ring-1 ring-amber-500/50"
                        : "border-neutral-200 dark:border-[#222838] bg-neutral-50 dark:bg-[#121620] hover:border-neutral-300 dark:hover:border-[#374158] text-neutral-600 dark:text-[#94a3b8]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        [ STAMP: SITE PROGRESS LOG ]
                      </span>
                      {photoCategory === "progress" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      Routine site activity, structural rebars, rough-ins, masonry.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoCategory("completion")}
                    className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer font-mono ${
                      photoCategory === "completion"
                        ? "border-amber-500 bg-amber-500/[0.08] text-neutral-900 dark:text-white ring-1 ring-amber-500/50"
                        : "border-neutral-200 dark:border-[#222838] bg-neutral-50 dark:bg-[#121620] hover:border-neutral-300 dark:hover:border-[#374158] text-neutral-600 dark:text-[#94a3b8]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        [ STAMP: COMPLETION DOSSIER ]
                      </span>
                      {photoCategory === "completion" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      Finished residence, paint, fixtures &amp; keys. Feeds Stage 4 Gate.
                    </p>
                  </button>
                </div>

                {photoCategory === "completion" && (
                  <div className="p-2.5 rounded-[4px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[10.5px] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>This asset will be certified for Stage 4 Turnover compliance and ingested into the public Showcase portfolio.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Update Frequency *</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Daily Log">Daily Progress Log</option>
                    <option value="Weekly Recap">Weekly Milestone Recap</option>
                    <option value="Inspection Proof">QC Inspection Proof</option>
                  </select>
                </div>
                <div className="relative" ref={inspectorDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-500">Inspector Sign-off</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomInspector((prev) => !prev);
                        setIsInspectorDropdownOpen(false);
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isCustomInspector ? "Admin Pick" : "+ Custom"}
                    </button>
                  </div>

                  {isCustomInspector ? (
                    <input
                      type="text"
                      value={photoInspector}
                      onChange={(e) => setPhotoInspector(e.target.value)}
                      placeholder="Enter supervisor or inspector title / name"
                      className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsInspectorDropdownOpen((prev) => !prev)}
                        className="w-full px-2.5 py-1.5 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white hover:border-amber-500/50 focus:outline-none focus:border-amber-500 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AdminAvatarPfp
                            user={selectedAdminObj}
                            name={photoInspector}
                            size="w-6 h-6"
                            text="text-[10px]"
                          />
                          <div className="truncate">
                            <span className="font-semibold text-neutral-900 dark:text-white block truncate text-xs">
                              {photoInspector || "Select Admin"}
                            </span>
                            <span className="text-[9.5px] text-neutral-400 dark:text-neutral-500 block truncate">
                              {selectedAdminObj?.role === "super_admin"
                                ? "Super Admin"
                                : selectedAdminObj?.role === "admin"
                                ? "Admin / Engineer"
                                : "Site QC Lead"}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                            isInspectorDropdownOpen ? "rotate-180 text-amber-500" : ""
                          }`}
                        />
                      </button>

                      {isInspectorDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 max-h-56 overflow-y-auto rounded-[8px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 shadow-xl p-1 z-50 space-y-1">
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 border-b border-neutral-100 dark:border-white/5">
                            Authorize As Admin
                          </div>
                          {availableAdmins.map((admin) => {
                            const isSelected =
                              photoInspector.trim().toLowerCase() === (admin.full_name || "").trim().toLowerCase();
                            return (
                              <button
                                key={admin.user_id || admin.email}
                                type="button"
                                onClick={() => {
                                  setPhotoInspector(admin.full_name);
                                  setIsInspectorDropdownOpen(false);
                                }}
                                className={`w-full px-2 py-1.5 rounded-[5px] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                    : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <AdminAvatarPfp
                                    user={admin}
                                    name={admin.full_name}
                                    size="w-6 h-6"
                                    text="text-[10px]"
                                  />
                                  <div className="truncate">
                                    <span className="block truncate text-xs">{admin.full_name}</span>
                                    <span className="block truncate text-[9.5px] text-neutral-400">
                                      {admin.email || admin.role}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              </button>
                            );
                          })}

                          <div className="border-t border-neutral-100 dark:border-white/5 pt-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomInspector(true);
                                setIsInspectorDropdownOpen(false);
                              }}
                              className="w-full px-2 py-1 text-[10.5px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-[4px] text-left flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Type custom inspector name...</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Log Title *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Ground Floor Slab Concreting Complete"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* MEDIA ATTACHMENTS (PHOTOS & VIDEOS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-500 font-mono text-[11px] font-bold uppercase">
                    Site Progress Media Files *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseManualPhotoUrl(!useManualPhotoUrl)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {useManualPhotoUrl ? (
                      <>
                        <UploadCloud className="w-3 h-3" />
                        <span>Switch to Multi-File Upload</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3 h-3" />
                        <span>Or Add Direct URL</span>
                      </>
                    )}
                  </button>
                </div>

                {useManualPhotoUrl ? (
                  <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={manualMediaType}
                        onChange={(e) => setManualMediaType(e.target.value)}
                        className="px-2.5 py-1.5 rounded-[5px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs cursor-pointer"
                      >
                        <option value="image">Photo (Image)</option>
                        <option value="video">Site Video</option>
                      </select>
                      <input
                        type="url"
                        value={manualMediaUrl}
                        onChange={(e) => setManualMediaUrl(e.target.value)}
                        placeholder="https://.../site-photo.jpg or video.mp4"
                        className="flex-1 px-3 py-1.5 rounded-[5px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualUrl}
                        disabled={!manualMediaUrl.trim()}
                        className="px-3 py-1.5 rounded-[5px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs cursor-pointer shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Paste a direct link to an image or MP4/WebM video, then click &quot;+ Add&quot;.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Hidden multi-file input */}
                    <input
                      ref={photoFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => handleMediaFilesSelect(e.target.files)}
                      className="hidden"
                    />

                    {/* Drag & drop upload area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files?.length > 0) {
                          handleMediaFilesSelect(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => photoFileInputRef.current?.click()}
                      className="w-full p-6 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Click to select or drag &amp; drop multiple photos &amp; videos
                        </p>
                        <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Photos:</span> Max 10MB each (PNG, JPG, WebP) •{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Videos:</span> No size limit (MP4, WebM, MOV)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Error Alert */}
                {photoUploadError && (
                  <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{photoUploadError}</span>
                  </div>
                )}

                {/* Queued Media Items List */}
                {mediaItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>
                        Attached Media ({mediaItems.filter((i) => i.url && !i.error).length}/{mediaItems.length} Ready):
                      </span>
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add More Files</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative rounded-[8px] bg-neutral-900 border border-neutral-200 dark:border-white/10 p-2 overflow-hidden flex flex-col justify-between space-y-2"
                        >
                          <div className="relative aspect-video rounded-[6px] overflow-hidden bg-neutral-950 flex items-center justify-center">
                            {item.mediaType === "video" ? (
                              <video
                                src={item.previewUrl || item.url}
                                preload="metadata"
                                muted
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.previewUrl || item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Type Badge */}
                            <span
                              className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                item.mediaType === "video"
                                  ? "bg-amber-500 text-neutral-950"
                                  : "bg-black/70 text-white"
                              }`}
                            >
                              {item.mediaType === "video" ? "Video" : "Photo"}
                            </span>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaItem(item.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                              title="Remove File"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* Upload Spinner Overlay */}
                            {item.isUploading && (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1.5 text-white p-2 text-center">
                                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                <span className="text-[10px] font-mono font-bold">
                                  Uploading {item.uploadProgress}%
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="truncate text-white max-w-[120px]" title={item.name}>
                                {item.name}
                              </span>
                              {item.size > 0 && (
                                <span className="text-neutral-400 shrink-0">
                                  {(item.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>

                            {/* 360 Toggle for images */}
                            {item.mediaType === "image" && (
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={!!item.is360}
                                  onChange={() => handleToggle360(item.id)}
                                  className="rounded border-neutral-600 text-amber-500 focus:ring-0 cursor-pointer"
                                />
                                <span>360° Panorama Photo</span>
                              </label>
                            )}

                            {/* Status indicator */}
                            {item.url && !item.isUploading && !item.error && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-emerald-400">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Uploaded &amp; Mirrored</span>
                              </span>
                            )}
                            {item.error && (
                              <span className="text-[9.5px] font-mono text-rose-400 truncate block">
                                {item.error}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Engineer Notes / Field Summary</label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Describe on-site accomplishments, cement curing status, or rebar count..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={resetPhotoForm}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSavingPhoto ||
                    mediaItems.some((it) => it.isUploading) ||
                    mediaItems.filter((it) => it.url && !it.error).length === 0 ||
                    !photoTitle
                  }
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {isSavingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : mediaItems.some((it) => it.isUploading) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Files...</span>
                    </>
                  ) : (
                    <span>
                      Publish {mediaItems.filter((it) => it.url && !it.error).length}{" "}
                      {mediaItems.filter((it) => it.url && !it.error).length === 1 ? "Item" : "Items"} to Client
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM MEDIA DELETE + ADMIN PASSWORD AUTHORIZATION */}
      {photoDeleteTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePhotoDeleteModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-media-title"
            className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 id="delete-media-title" className="text-sm font-bold text-neutral-900 dark:text-white">
                  {photoDeleteTarget.count > 1 ? "Delete entire media update?" : "Delete media record?"}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {photoDeleteTarget.count > 1
                    ? `This will permanently remove all ${photoDeleteTarget.count} photos/videos in this update.`
                    : "This will permanently remove this media record from the client portal."}
                </p>
              </div>
            </div>

            <div className="rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Selected update</p>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-1">
                {photoDeleteTarget.title}
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="media-delete-password"
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Admin password required
              </label>
              <div className="relative">
                <input
                  id="media-delete-password"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (deletePasswordError) setDeletePasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmPhotoDelete();
                    }
                  }}
                  placeholder="Enter admin password"
                  autoFocus
                  disabled={isVerifyingDeletePassword}
                  className={`w-full rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border px-3 py-2.5 pr-10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none transition-colors ${
                    deletePasswordError
                      ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((visible) => !visible)}
                  disabled={isVerifyingDeletePassword}
                  aria-label={showDeletePassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 px-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {deletePasswordError && (
                <p className="flex items-start gap-1.5 text-[11px] text-rose-500 font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{deletePasswordError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={closePhotoDeleteModal}
                disabled={isVerifyingDeletePassword}
                className="px-3.5 py-2 rounded-[6px] text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPhotoDelete}
                disabled={isVerifyingDeletePassword}
                className="px-3.5 py-2 rounded-[6px] bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isVerifyingDeletePassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: FULL PREVIEW FOR PHOTOS & VIDEOS */}
      {previewModalItem && (
        <div
          onClick={() => setPreviewModalItem(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-neutral-900 border border-white/10 rounded-[12px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-950/60">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate font-mono">
                    {previewModalItem.groupTitle || previewModalItem.title || "Site Progress Media"}
                  </h4>
                  {modalItems.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold shrink-0">
                      {currentModalIndex + 1} / {modalItems.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Inspector: {previewModalItem.groupInspector || previewModalItem.inspector || "Field Engineer"} • {previewModalItem.groupDate || previewModalItem.log_date || "Live"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Media Player with Carousel Controls */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-2 min-h-[320px] max-h-[68vh] overflow-hidden select-none">
              {currentModalItem?.media_type === "video" ||
              /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i.test(currentModalItem?.image_url || "") ? (
                <video
                  key={currentModalItem?.image_url}
                  src={currentModalItem?.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[65vh] rounded-[6px]"
                />
              ) : (
                <img
                  key={currentModalItem?.image_url}
                  src={currentModalItem?.image_url}
                  alt={currentModalItem?.title || previewModalItem.title}
                  className="max-w-full max-h-[65vh] object-contain rounded-[6px]"
                />
              )}

              {/* Lightbox Prev/Next Chevrons */}
              {modalItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleModalPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Previous Photo (Left Arrow)"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleModalNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Next Photo (Right Arrow)"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs border border-white/15 pointer-events-auto shadow-md">
                      {modalItems.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setPreviewModalItem((prev) => ({
                              ...prev,
                              ...modalItems[i],
                              currentIndex: i,
                            }));
                          }}
                          aria-label={`Photo ${i + 1}`}
                          className={`transition-all cursor-pointer rounded-full ${
                            i === currentModalIndex
                              ? "w-4 h-1.5 bg-amber-400"
                              : "w-1.5 h-1.5 bg-white/40 hover:bg-white/90"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Lightbox Footer Notes */}
            {(previewModalItem.groupCaption || previewModalItem.caption) && (
              <div className="p-3.5 border-t border-white/10 bg-neutral-950/80 text-xs text-neutral-300">
                <span className="font-bold text-amber-500 font-mono text-[11px] block mb-0.5">FIELD NOTES:</span>
                <p className="font-sans leading-relaxed">
                  {previewModalItem.groupCaption || previewModalItem.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TURNOVER & STAGE 4 HANDOVER MANAGEMENT MODAL */}
      {isTurnoverModalOpen && project && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => {
            if (!isSubmittingTurnover) {
              setIsTurnoverModalOpen(false);
              setIsConfirmingTurnoverNow(false);
              setIsReschedulingTurnover(false);
            }
          }}
        >
          <div
            className="w-full max-w-xl rounded-[14px] bg-white dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10 flex items-start justify-between gap-4 bg-neutral-50/70 dark:bg-white/[0.02]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/25 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Stage 4 Handover Lifecycle</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    • {project.project_code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Turnover &amp; Key Handover Hub</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
                  Schedule the ceremonial key turnover date or immediately execute project handover to Stage 4 (Finished Project &amp; Wrapped).
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmittingTurnover}
                onClick={() => {
                  setIsTurnoverModalOpen(false);
                  setIsConfirmingTurnoverNow(false);
                  setIsReschedulingTurnover(false);
                }}
                className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Project Quick Overview Badge */}
              <div className="p-3.5 rounded-[10px] bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block font-medium">Project &amp; Client</span>
                  <p className="font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                    {project.name || project.project_title}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{project.location || project.target_location || "Bulacan"}</span>
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] text-neutral-400 uppercase block font-medium">Accomplishment</span>
                  <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                    <span className="text-base font-extrabold text-amber-500 font-mono">
                      {progressPct}%
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      Eligible (≥90%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Completion Dossier Summary */}
              <div className="p-3.5 rounded-[4px] bg-neutral-100/70 dark:bg-[#121620] border border-neutral-200 dark:border-[#222838] space-y-2.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#64748b] font-bold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Completion Photography Dossier</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] border ${
                    hasCompletionMedia
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }`}>
                    {hasCompletionMedia ? `[✓ VERIFIED ${completionMediaCount}/3 PHOTOS]` : `[🔒 ${completionMediaCount}/3 PHOTOS - GATE LOCKED]`}
                  </span>
                </div>
                {completionMedia.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-0.5">
                    {completionMedia.slice(0, 4).map((m, idx) => (
                      <div key={m.log_id || idx} className="relative aspect-video rounded-[2px] overflow-hidden border border-neutral-200 dark:border-[#222838] bg-neutral-900 group">
                        {m.media_type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/60">
                            <Film className="w-4 h-4 text-amber-500" />
                          </div>
                        ) : (
                          <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[8.5px] text-neutral-300 truncate font-mono">
                          {m.title || `Photo 0${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 font-sans">
                    No completion photos found. At least 3 finished photos must be uploaded under the Completion category before scheduling or executing turnover.
                  </p>
                )}
              </div>

              {/* Turnover Date Error Message */}
              {turnoverDateError && (
                <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-sans leading-relaxed">{turnoverDateError}</p>
                </div>
              )}

              {/* SECTION A: CURRENT SCHEDULED DATE (IF ALREADY SET) */}
              {currentTurnoverDate && !isReschedulingTurnover ? (
                <div className="p-4 rounded-[10px] bg-amber-500/5 dark:bg-amber-500/[0.04] border border-amber-500/25 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Current Scheduled Turnover</span>
                    </span>
                    {countdownInfo && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${countdownInfo.badgeClass}`}>
                        {countdownInfo.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white font-mono tracking-tight">
                        {formatHumanDate(currentTurnoverDate)}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                        On this scheduled date, the project will automatically advance to Stage 4 (Finished Project &amp; Wrapped).
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingTurnover || isStage4}
                      onClick={() => setIsReschedulingTurnover(true)}
                      className="px-3 py-1.5 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-neutral-300 dark:border-white/10 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SECTION B: DATE PICKER FORM (SCHEDULE / RESCHEDULE) */
                <div className="p-4 rounded-[10px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        {isReschedulingTurnover ? "Reschedule Turnover Date" : "Select Turnover Date"}
                      </span>
                    </div>
                    {isReschedulingTurnover && (
                      <button
                        type="button"
                        onClick={() => setIsReschedulingTurnover(false)}
                        className="text-[11px] font-mono text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline cursor-pointer"
                      >
                        Cancel reschedule
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block font-sans">
                      Turnover Ceremony Date <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={turnoverInputDate}
                      onChange={(e) => {
                        setTurnoverInputDate(e.target.value);
                        setTurnoverDateError("");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white font-mono text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                    <p className="text-[10.5px] text-neutral-400 font-mono">
                      Past dates cannot be selected. Earliest selectable date is today ({getTodayDateString()}).
                    </p>
                  </div>

                  {/* Quick Preset Date Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDate(0)}
                        className="px-2.5 py-1 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDate(7)}
                        className="px-2.5 py-1 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                      >
                        +7 Days (1 Wk)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDate(14)}
                        className="px-2.5 py-1 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                      >
                        +14 Days (2 Wks)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDate(30)}
                        className="px-2.5 py-1 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                      >
                        +30 Days (1 Mo)
                      </button>
                    </div>
                  </div>

                  {/* Venue input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block font-sans">
                      Turnover Venue / Location
                    </label>
                    <input
                      type="text"
                      value={turnoverVenue}
                      onChange={(e) => setTurnoverVenue(e.target.value)}
                      placeholder="e.g. On-Site Residence / MCPA Main Office"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white font-mono text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Notes input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block font-sans">
                      Turnover &amp; Handover Notes
                    </label>
                    <textarea
                      rows={2}
                      value={turnoverNotes}
                      onChange={(e) => setTurnoverNotes(e.target.value)}
                      placeholder="e.g. Ceremonial key handover, joint punchlist inspection sign-off, blueprint delivery."
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white font-sans text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {!hasCompletionMedia && (
                    <div className="p-2.5 rounded-[4px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[11px] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Gate Locked: At least 3 finished photos required before saving a turnover date ({completionMediaCount}/3).</span>
                    </div>
                  )}

                  {/* Save Date Button */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingTurnover || !turnoverInputDate || !hasCompletionMedia}
                      onClick={() => handleSaveTurnoverSchedule(isReschedulingTurnover ? "reschedule" : "schedule")}
                      className="w-full sm:w-auto px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed"
                    >
                      {isSubmittingTurnover ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>{isReschedulingTurnover ? "Save Rescheduled Date" : "Save Turnover Date"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION C: TURN OVER NOW (IMMEDIATE HANDOVER) */}
              {!isStage4 && (
                <div className="p-4 rounded-[12px] bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-900 dark:text-white">
                          Turn Over Now (Immediate Handover)
                        </h4>
                        <p className="text-[11.5px] text-neutral-600 dark:text-neutral-400 font-sans mt-0.5 leading-relaxed">
                          Would you like to complete and hand over the project today? This will execute official turnover, set progress to 100%, and activate Stage 4 (Finished Project &amp; Wrapped) in the client portal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!hasCompletionMedia && (
                    <div className="p-2.5 rounded-[4px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[11px] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Gate Locked: Upload at least 3 finished photos in the Completion Media Dossier to execute immediate handover ({completionMediaCount}/3).</span>
                    </div>
                  )}

                  {isConfirmingTurnoverNow ? (
                    /* Step 2: In-Modal Confirmation State */
                    <div className="p-3.5 rounded-[8px] bg-white dark:bg-neutral-950 border border-emerald-500/40 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Confirm Official Handover to Stage 4</span>
                      </div>
                      <ul className="text-[11px] font-sans text-neutral-600 dark:text-neutral-300 space-y-1.5 pl-1">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Project will be marked as 100% Accomplished &amp; Completed.</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Client Portal will advance to Stage 4: Finished Project &amp; Wrapped.</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Photos at 90% or higher sync to Projects Showcase as a hidden draft, and the client&apos;s Wrapped is generated.</span>
                        </li>
                      </ul>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingTurnover}
                          onClick={() => setIsConfirmingTurnoverNow(false)}
                          className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingTurnover || !hasCompletionMedia}
                          onClick={() => handleSaveTurnoverSchedule("turnover_now")}
                          className="px-4 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:cursor-not-allowed"
                        >
                          {isSubmittingTurnover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm &amp; Hand Over Now</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 1: Trigger Button */
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        disabled={!hasCompletionMedia}
                        onClick={() => setIsConfirmingTurnoverNow(true)}
                        className="px-4 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Turn Over Now (Immediate Handover)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Already in Stage 4 Banner */}
              {isStage4 && (
                <div className="p-4 rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Project is Currently in Stage 4
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-0.5 font-sans leading-relaxed">
                      The build is closed out. Review the Finished Projects tab for the full project history, Showcase draft and the client&apos;s Wrapped.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>MCPA Civil Code Art. 1723 Certified</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsTurnoverModalOpen(false);
                  setIsConfirmingTurnoverNow(false);
                  setIsReschedulingTurnover(false);
                }}
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
