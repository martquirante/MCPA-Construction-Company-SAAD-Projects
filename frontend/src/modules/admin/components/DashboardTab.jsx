"use client";

import { useMemo } from "react";
import {
  ClipboardListIcon,
  CalendarIcon,
  BuildingIcon,
  CheckCircle2Icon,
  VideoIcon,
  MapPinIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ActivityIcon,
  BellIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  ExternalLinkIcon,
  ClockIcon,
} from "@/modules/shared/Icons";
import { HardHat, Building2, Sparkles } from "lucide-react";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";
import MetricCard3D from "@/modules/admin/components/MetricCard3D";
import { AdminAvatarPfp } from "@/modules/admin/components/SiteProgressTab";
import { DashboardOverviewSkeleton } from "@/modules/shared/Skeleton";
import { isMeetingPast } from "@/modules/shared/meetingHelper";

const PROJECT_CATEGORY_STYLES = {
  "Residential": "text-amber-700 dark:text-amber-400",
  "Commercial": "text-sky-700 dark:text-sky-400",
  "Commercial & Mixed-Use": "text-sky-700 dark:text-sky-400",
  "Industrial": "text-purple-700 dark:text-purple-400",
  "Renovation": "text-emerald-700 dark:text-emerald-400",
  "Modern Zen": "text-stone-700 dark:text-stone-300",
  "School": "text-indigo-700 dark:text-indigo-400",
};

function MeetingTypeBadge({ mode }) {
  const isOnline =
    mode?.toLowerCase().includes("online") ||
    mode?.toLowerCase().includes("virtual") ||
    mode?.toLowerCase().includes("meet") ||
    mode?.toLowerCase().includes("zoom");

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400 text-[11px] font-semibold whitespace-nowrap">
        <VideoIcon className="w-3 h-3 shrink-0" />
        Online Video Call
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px] font-semibold whitespace-nowrap">
      <MapPinIcon className="w-3 h-3 shrink-0" />
      Face-to-Face Visit
    </span>
  );
}

function cleanProjectTitle(rawTitle, clientName) {
  if (!rawTitle) return "Commercial & Mixed-Use Build";
  let title = String(rawTitle).trim();
  if (clientName) {
    const trimmed = clientName.trim();
    const re = new RegExp(`\\s*\\(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)$`, "i");
    title = title.replace(re, "").trim();
  }
  return title || rawTitle;
}

function formatMeetingSchedule(dateStr, timeStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return {
      month: "TBD",
      day: "--",
      weekday: "",
      fullDate: "Date To Be Determined",
      time: timeStr || "Flexible Schedule",
      isPast: false,
    };
  }

  const isPast = isMeetingPast(dateStr, timeStr);

  try {
    let year, monthIdx, dayNum;
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      monthIdx = parseInt(isoMatch[2], 10) - 1;
      dayNum = parseInt(isoMatch[3], 10);
    } else {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        year = parsed.getFullYear();
        monthIdx = parsed.getMonth();
        dayNum = parsed.getDate();
      }
    }

    if (year && monthIdx !== undefined && dayNum) {
      const d = new Date(year, monthIdx, dayNum);
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const month = monthNames[monthIdx] || "OCT";
      const day = String(dayNum);
      const weekday = dayNames[d.getDay()] || "";
      const fullDate = `${weekday ? weekday + ", " : ""}${month} ${day}, ${year}`;

      let cleanTime = timeStr || "Schedule Confirmed";
      cleanTime = cleanTime.replace(/\s+/g, " ").trim();

      return {
        month,
        day,
        weekday,
        fullDate,
        time: cleanTime,
        isPast,
      };
    }
  } catch (_) {}

  return {
    month: "CAL",
    day: "•",
    weekday: "",
    fullDate: dateStr,
    time: timeStr || "Schedule Confirmed",
    isPast,
  };
}

export default function DashboardTab({
  clientBriefs = [],
  allProjects = [],
  stage3Projects = [],
  onSelectProject,
  onNavigateTab,
  isLoading = false,
}) {
  if (
    isLoading &&
    (!clientBriefs || clientBriefs.length === 0) &&
    (!allProjects || allProjects.length === 0) &&
    (!stage3Projects || stage3Projects.length === 0)
  ) {
    return <DashboardOverviewSkeleton />;
  }

  const getInitials = (name = "") => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isRejectedBrief = (b) => {
    const s = (b.status || "").toLowerCase();
    return s.includes("reject") || s.includes("decline");
  };

  const pendingCount = clientBriefs.filter(
    (b) => !b.status || b.status === "Pending Review"
  ).length;
  const scheduledCount = clientBriefs.filter(
    (b) => b.meetingDate && !isRejectedBrief(b) && !isMeetingPast(b.meetingDate, b.meetingTime)
  ).length;
  const approvedCount = clientBriefs.filter(
    (b) => b.status === "Approved / Accepted"
  ).length;
  const needsActionCount = clientBriefs.filter(
    (b) => b.status === "Needs Information" || b.status === "Under Review"
  ).length;

  const upcomingMeetings = clientBriefs
    .filter((b) => b.meetingDate && !isRejectedBrief(b) && !isMeetingPast(b.meetingDate, b.meetingTime))
    .sort((a, b) => {
      const aPast = isMeetingPast(a.meetingDate, a.meetingTime);
      const bPast = isMeetingPast(b.meetingDate, b.meetingTime);
      if (aPast !== bPast) return aPast ? 1 : -1;
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    })
    .slice(0, 4);

  const recentActivity = [...clientBriefs]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5);

  const inProgressProjects = useMemo(() => {
    const list = [];
    const seenCodes = new Set();

    // 1. Live Stage 3 Construction Site Execution Projects (Primary Live Builds)
    (stage3Projects || []).forEach((sp) => {
      const code = sp.project_code || sp.client_project_id;
      if (code) seenCodes.add(code);
      list.push({
        id: sp.site_project_id || sp.client_project_id || sp.project_code,
        name: sp.project_title || sp.name || `${sp.client_name}'s Build`,
        client_name: sp.client_name || "Client",
        client_email: sp.client_email,
        project_code: sp.project_code,
        avatar_url: sp.avatar_url,
        location: sp.target_location || sp.location || "Central Luzon",
        category: sp.project_type || "Commercial & Mixed-Use",
        stage: sp.current_phase || "Site Mobilization & Earthworks",
        progress: typeof sp.progress_pct === "number" ? sp.progress_pct : 0,
        lead_engineer: sp.lead_engineer || "Engr. Raymart Quirante",
        isStage3Build: true,
        milestones: Array.isArray(sp.milestones) ? sp.milestones : [],
        rawProject: sp,
      });
    });

    // 2. Custom or showcase projects marked as in progress
    (allProjects || []).forEach((p) => {
      const code = p.project_code || p.id;
      if (code && seenCodes.has(code)) return;
      const status = (p.status || "").toLowerCase();
      const stage = (p.stage || "").toLowerCase();
      const progress = typeof p.progress === "number" ? p.progress : 0;
      if (
        status === "completed" ||
        stage.includes("complete") ||
        stage.includes("turned over") ||
        progress >= 100
      ) {
        return;
      }
      if (
        status === "in_progress" ||
        stage.includes("construction") ||
        stage.includes("ongoing") ||
        (progress > 0 && progress < 100)
      ) {
        list.push({
          id: p.id,
          name: p.name,
          client_name: p.client_name || "MCPA Client",
          client_email: p.client_email,
          project_code: p.project_code || `PRJ-${p.id}`,
          avatar_url: p.avatar_url,
          location: p.location || "Central Luzon",
          category: p.category || "Residential",
          stage: p.stage || "Under Construction",
          progress: progress,
          lead_engineer: p.lead_engineer || "Engr. Raymart Quirante",
          isStage3Build: false,
          milestones: [],
          rawProject: p,
        });
      }
    });

    return list;
  }, [stage3Projects, allProjects]);

  const featuredProjects = inProgressProjects.slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-sans">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            MCPA Construction Admin Console — Client Intake, Consultations &amp; Site Execution
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab?.("briefs")}
            className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-semibold cursor-pointer"
          >
            Inquiries
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.("meetings")}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 text-xs font-semibold cursor-pointer"
          >
            Meetings
          </button>
        </div>
      </div>

      {/* Metric KPI Cards (Executive Top Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard3D
          label="New Inquiries"
          value={pendingCount}
          sub={pendingCount === 0 ? "Inbox fully reviewed" : `${pendingCount} awaiting engineer review`}
          accentColor="#F59E0B"
          tone="amber"
          badgeText={pendingCount > 0 ? `${pendingCount} Pending` : "Caught Up"}
          icon={ClipboardListIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
        <MetricCard3D
          label="Scheduled Meetings"
          value={scheduledCount}
          sub={scheduledCount === 0 ? "No active consultations" : `${scheduledCount} consultation session${scheduledCount === 1 ? "" : "s"} booked`}
          accentColor="#38BDF8"
          tone="sky"
          badgeText={scheduledCount > 0 ? "Calendar Active" : "Clear"}
          icon={CalendarIcon}
          onClick={() => onNavigateTab?.("meetings")}
        />
        <MetricCard3D
          label="In-Progress Projects"
          value={inProgressProjects.length}
          sub={`${inProgressProjects.length} active construction build${inProgressProjects.length === 1 ? "" : "s"}`}
          accentColor="#10B981"
          tone="emerald"
          showBadge={false}
          icon={BuildingIcon}
          onClick={() => onNavigateTab?.("site-progress")}
        />
        <MetricCard3D
          label="Action Required"
          value={needsActionCount}
          sub={needsActionCount === 0 ? "No pending blockers" : `${needsActionCount} brief${needsActionCount === 1 ? "" : "s"} need client info`}
          accentColor="#FB7185"
          tone={needsActionCount > 0 ? "rose" : "emerald"}
          badgeText={needsActionCount > 0 ? "Attention Needed" : "All Clear"}
          icon={BellIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
      </div>

      {/* Main 2-Column Architectural Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8">
        {/* Left Primary Column: In-Progress Projects & Recent Intake Feed (3 cols) */}
        <div className="xl:col-span-3 space-y-6 sm:space-y-8">
          {/* Active In-Progress Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight font-sans">
                  Active In-Progress Projects
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Live Stage 3 Site Execution &amp; Engineering Milestone Progress
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums font-semibold">
                  {inProgressProjects.length} active build{inProgressProjects.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("site-progress")}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-500 inline-flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>Site Logs</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            {featuredProjects.length === 0 ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/wzwygmng.json"
                badgeText="Portfolio Standby"
                title="No In-Progress Projects"
                description="Active in-progress construction projects will be showcased here."
                compact
                size={64}
              />
            ) : (
              <div className="space-y-4">
                {featuredProjects.map((project, idx) => {
                  const progress = project.progress;
                  const stage = project.stage;
                  const progressMilestones =
                    project.milestones.length > 0
                      ? project.milestones
                      : [
                          { phase_name: "Mobilization", completion_pct: 0 },
                          { phase_name: "Structural", completion_pct: 0 },
                          { phase_name: "Architectural & MEP", completion_pct: 0 },
                          { phase_name: "Turnover", completion_pct: 0 },
                        ];
                  const categoryColor =
                    PROJECT_CATEGORY_STYLES[project.category] ||
                    "text-amber-700 dark:text-amber-400";

                  return (
                    <div
                      key={project?.id ? `feat-${project.id}-${idx}` : `feat-idx-${idx}`}
                      onClick={() => {
                        if (project.isStage3Build && onSelectProject && project.rawProject) {
                          onSelectProject(project.rawProject);
                          onNavigateTab?.("site-progress");
                        }
                      }}
                      className={`p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4 ${
                        project.isStage3Build ? "cursor-pointer group" : ""
                      }`}
                    >
                      {/* Top Meta Row: Category Badge & Project Code (Always separate line on mobile) */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span>{project.category}</span>
                          </span>
                        </div>

                        {project.project_code && (
                          <span className="text-neutral-600 dark:text-neutral-300 font-mono text-[11px] font-semibold shrink-0">
                            {project.project_code}
                          </span>
                        )}
                      </div>

                      {/* Project Title (Full width, zero overlap) */}
                      <div>
                        <h3 className="font-bold text-base sm:text-lg leading-snug text-neutral-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-sans">
                          {cleanProjectTitle(project.name, project.client_name)}
                        </h3>
                      </div>

                      {/* Client Identity & Location Cardlet (Dedicated row, full width) */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/[0.05]">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-amber-500/50 overflow-hidden flex items-center justify-center shadow-xs">
                            {project.avatar_url ? (
                              <img
                                src={project.avatar_url}
                                alt={project.client_name || "Client"}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 font-sans">
                                {getInitials(project.client_name)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans truncate">
                              {project.client_name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-sans shrink-0">
                              • Project Owner
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                            <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">{project.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Construction Phasing Tracker */}
                      <div className="p-3.5 rounded-xl bg-neutral-50/60 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/[0.05] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                              <HardHat className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight font-sans truncate">
                                {stage}
                              </p>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans">
                                Current Active Phase
                              </span>
                            </div>
                          </div>
                          <span className="text-amber-700 dark:text-amber-400 text-xs font-extrabold tabular-nums shrink-0 font-sans">
                            {progress}% Complete
                          </span>
                        </div>

                        {/* Site Progress milestone segments */}
                        <div className="space-y-2">
                          <div
                            className="grid gap-1.5 h-2"
                            style={{ gridTemplateColumns: `repeat(${progressMilestones.length}, minmax(0, 1fr))` }}
                          >
                            {progressMilestones.map((milestone, milestoneIndex) => {
                              const completion = Math.max(0, Math.min(100, Number(milestone.completion_pct) || 0));
                              const name = milestone.phase_name || `Phase ${milestoneIndex + 1}`;
                              return (
                                <div
                                  key={milestone.milestone_id || milestone.phase_code || `${name}-${milestoneIndex}`}
                                  className="relative h-full rounded-full overflow-hidden bg-neutral-200/80 dark:bg-white/10"
                                  title={`${name} (${completion}% complete)`}
                                >
                                  <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                    style={{ width: `${completion}%` }}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Phase Labels: Responsive 2-col on mobile, 4-col on tablet/desktop */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {progressMilestones.map((milestone, milestoneIndex) => {
                              const completion = Math.max(0, Math.min(100, Number(milestone.completion_pct) || 0));
                              const isCurrent = completion > 0 && completion < 100;
                              const isDone = completion >= 100;
                              return (
                                <div
                                  key={milestone.milestone_id || milestone.phase_code || `${milestone.phase_name}-${milestoneIndex}`}
                                  className={`flex items-center gap-1.5 truncate ${
                                    isCurrent
                                      ? "text-amber-700 dark:text-amber-400 font-bold"
                                      : isDone
                                      ? "text-neutral-800 dark:text-neutral-200 font-semibold"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isDone
                                        ? "bg-emerald-500"
                                        : isCurrent
                                        ? "bg-amber-500 animate-pulse"
                                        : "bg-neutral-300 dark:bg-neutral-700"
                                    }`}
                                  />
                                  <span className="truncate">
                                    {milestoneIndex + 1}. {milestone.phase_name || `Phase ${milestoneIndex + 1}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Lead Engineer & Inspect CTA */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-neutral-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <AdminAvatarPfp
                            user={{ name: project.lead_engineer || "Engr. Raymart Quirante" }}
                            name={project.lead_engineer || "Engr. Raymart Quirante"}
                            size="w-6 h-6"
                            text="text-[9px]"
                          />
                          <span className="text-xs">
                            Lead Engineer: <strong className="font-semibold text-neutral-900 dark:text-white">{project.lead_engineer || "Engr. Raymart Quirante"}</strong>
                          </span>
                        </div>

                        {project.isStage3Build && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectProject && project.rawProject) {
                                onSelectProject(project.rawProject);
                              }
                              onNavigateTab?.("site-progress");
                            }}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-bold text-xs cursor-pointer shadow-xs transition-all"
                          >
                            <span>Inspect Site Logs</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Inquiries & Client Intake Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight font-sans">
                  Recent Inquiries
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Client Intake Feed &amp; Consultation Requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums font-semibold">
                  {clientBriefs.length} total
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("briefs")}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 inline-flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>View Pipeline</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/rhvddzym.json"
                badgeText="Inbox Standby"
                title="No Inquiries Streamed Yet"
                description="Client bookings and consultation inquiries will appear here automatically."
                compact
                size={64}
              />
            ) : (
              <div className="rounded-xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#11141c] overflow-hidden divide-y divide-neutral-100 dark:divide-white/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                {recentActivity.map((brief, idx) => {
                  const clientAvatar = resolveClientAvatar(brief);
                  const displayProjectType = (brief.projectType || "").includes("Residential Villa")
                    ? "Residential"
                    : brief.projectType || "Consultation Request";

                  const status = brief.status || "Pending Review";
                  const isPending = status === "Pending Review";
                  const isApproved =
                    status === "Approved / Accepted" || status === "Meeting Scheduled";
                  const isRejected =
                    Boolean(brief.isRejected) ||
                    status.toLowerCase().includes("reject") ||
                    status.toLowerCase().includes("decline");
                  const briefKey = brief?.id ? `${brief.id}-${idx}` : `brief-act-${idx}`;

                  return (
                    <div
                      key={briefKey}
                      onClick={() => onNavigateTab?.("briefs")}
                      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <div className="relative shrink-0">
                        {clientAvatar ? (
                          <img
                            src={clientAvatar}
                            alt={brief.clientName || "Client"}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(
                                ".client-avatar-fallback"
                              );
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: clientAvatar ? "none" : "flex" }}
                          className="client-avatar-fallback w-9 h-9 rounded-full bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-semibold text-xs items-center justify-center uppercase font-sans"
                        >
                          {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {brief.clientName}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {displayProjectType}
                          </span>
                          {brief.location && ` — ${brief.location}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isRejected
                              ? "text-rose-700 dark:text-rose-400"
                              : isApproved
                              ? "text-emerald-700 dark:text-emerald-400"
                              : isPending
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-sky-700 dark:text-sky-400"
                          }`}
                        >
                          {isPending ? "Pending Review" : status}
                        </span>
                        <ArrowRightIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Secondary Column: Consultations, Funnel Summary & HQ (2 cols) */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {/* Scheduled Consultations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight font-sans">
                  Scheduled Consultations
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Upcoming Client Design Meetings
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab("meetings")}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-500 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Meetings</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              )}
            </div>

            {upcomingMeetings.length === 0 ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/abfverha.json"
                badgeText="Calendar Clear"
                title="No Meetings Scheduled"
                description="Approve inquiries in the Inquiries tab to schedule meeting dates and online video consultations."
                compact
                size={64}
              />
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((brief, idx) => {
                  const clientAvatar = resolveClientAvatar(brief);
                  const displayProjectType = (brief.projectType || "").includes("Residential Villa")
                    ? "Residential"
                    : brief.projectType || "Consultation";
                  const sched = formatMeetingSchedule(brief.meetingDate, brief.meetingTime);
                  const briefKey = brief?.id ? `${brief.id}-${idx}` : `brief-meet-${idx}`;

                  return (
                    <div
                      key={briefKey}
                      onClick={() => onNavigateTab && onNavigateTab("meetings")}
                      className="p-4 rounded-xl bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer group space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Calendar Date Block + Client Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Calendar date tile */}
                          <div
                            className="w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 bg-amber-500 border border-amber-500 text-neutral-950"
                          >
                            <span className="text-[9px] font-bold tracking-wider uppercase leading-none">
                              {sched.month}
                            </span>
                            <span className="text-sm font-extrabold leading-none mt-0.5 tabular-nums">
                              {sched.day}
                            </span>
                          </div>

                          {/* Client Profile, Name & Project Type */}
                          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-neutral-100 dark:bg-white/[0.06] border border-amber-500/40 flex items-center justify-center">
                            {clientAvatar ? (
                              <img
                                src={clientAvatar}
                                alt={brief.clientName || "Client"}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(
                                    ".meeting-avatar-fallback"
                                  );
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span
                              className="meeting-avatar-fallback absolute inset-0 items-center justify-center text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase"
                              style={{ display: clientAvatar ? "none" : "flex" }}
                            >
                              {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {brief.clientName}
                              </p>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {displayProjectType}
                            </p>
                          </div>
                        </div>

                        {/* Meeting Mode Badge */}
                        <MeetingTypeBadge mode={brief.meetingMode} />
                      </div>

                      {/* Footer: Date & Time + Status */}
                      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-neutral-100 dark:border-white/[0.04] text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <ClockIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate text-[11px]">
                            {sched.fullDate} • {sched.time}
                          </span>
                        </div>
                        {sched.isPast ? (
                          <span className="text-[10px] font-semibold text-neutral-500 shrink-0">
                            Concluded
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inquiry Funnel Breakdown Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <TrendingUpIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Inquiry Conversion Funnel
                  </h3>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Client Intake to Onboarding
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-neutral-900 dark:text-white">
                {clientBriefs.length} Total
              </span>
            </div>

            {/* Visual Proportional Funnel Bar */}
            {clientBriefs.length > 0 && (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden flex">
                  <div
                    style={{ width: `${(pendingCount / clientBriefs.length) * 100}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`Pending: ${pendingCount}`}
                  />
                  <div
                    style={{ width: `${(scheduledCount / clientBriefs.length) * 100}%` }}
                    className="bg-sky-500 transition-all duration-500"
                    title={`Scheduled: ${scheduledCount}`}
                  />
                  <div
                    style={{ width: `${(approvedCount / clientBriefs.length) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Approved: ${approvedCount}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending ({pendingCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Meetings ({scheduledCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved ({approvedCount})
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-white/[0.04]">
              {[
                {
                  label: "Pending Review",
                  value: pendingCount,
                  color: "text-amber-600 dark:text-amber-400",
                  dot: "bg-amber-500",
                },
                {
                  label: "Consultations Scheduled",
                  value: scheduledCount,
                  color: "text-sky-600 dark:text-sky-400",
                  dot: "bg-sky-500",
                },
                {
                  label: "Approved for Design",
                  value: approvedCount,
                  color: "text-emerald-600 dark:text-emerald-400",
                  dot: "bg-emerald-500",
                },
                {
                  label: "Action / Follow-up Needed",
                  value: needsActionCount,
                  color: "text-rose-600 dark:text-rose-400",
                  dot: "bg-rose-500",
                },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
                  </div>
                  <span className={`font-bold tabular-nums ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MCPA Headquarters & Operations Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <BuildingIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  MCPA Headquarters &amp; Operations
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Bulacan Central Command Office
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {/* Location -> Google Maps */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=MCPA+Construction+and+Supply+Tabang+Plaridel+Bulacan"
                target="_blank"
                rel="noopener noreferrer"
                title="View MCPA Headquarters on Google Maps"
                className="flex items-center justify-between p-2.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">Tabang, Plaridel, Bulacan</span>
                </div>
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 ml-1 text-neutral-400 group-hover:text-amber-500" />
              </a>

              {/* Phone -> Call */}
              <a
                href="tel:09497758239"
                title="Call MCPA Headquarters ((0949) 775 8239)"
                className="flex items-center justify-between p-2.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PhoneIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">(0949) 775 8239</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider shrink-0">
                  Call Office
                </span>
              </a>

              {/* Email -> Mailto */}
              <a
                href="mailto:mcpa.construction@gmail.com?subject=Inquiry%20-%20MCPA%20Construction"
                title="Email mcpa.construction@gmail.com"
                className="flex items-center justify-between p-2.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MailIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">mcpa.construction@gmail.com</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider shrink-0">
                  Email
                </span>
              </a>

              {/* Hours */}
              <div className="flex items-center gap-2.5 p-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                <ClockIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Mon – Sat: 8:00 AM – 5:00 PM PHT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
