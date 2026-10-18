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
  GoogleIcon,
} from "@/modules/shared/Icons";
import { HardHat } from "lucide-react";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";
import MetricCard3D from "@/modules/admin/components/MetricCard3D";
import { DashboardOverviewSkeleton } from "@/modules/shared/Skeleton";
import { isMeetingPast } from "@/modules/shared/meetingHelper";

const PROJECT_STAGE_COLORS = {
  "Residential": "bg-amber-500/10 text-amber-300/90 border-amber-500/20",
  "Commercial": "bg-white/[0.05] text-neutral-300 border-white/10",
  "Industrial": "bg-neutral-800/80 text-neutral-300 border-neutral-700/60",
  "Renovation": "bg-stone-500/15 text-stone-300 border-stone-500/25",
  "Modern Zen": "bg-white/[0.05] text-neutral-300 border-white/10",
};

function MeetingTypeBadge({ mode }) {
  const isOnline =
    mode?.toLowerCase().includes("online") ||
    mode?.toLowerCase().includes("virtual") ||
    mode?.toLowerCase().includes("meet") ||
    mode?.toLowerCase().includes("zoom");

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
        <VideoIcon className="w-3 h-3" />
        Online Call
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
      <MapPinIcon className="w-3 h-3" />
      Face-to-Face
    </span>
  );
}

export default function DashboardTab({
  clientBriefs = [],
  allProjects = [],
  stage3Projects = [],
  onSelectProject,
  onNavigateTab,
  isLoading = false,
}) {
  if (isLoading && (!clientBriefs || clientBriefs.length === 0) && (!allProjects || allProjects.length === 0) && (!stage3Projects || stage3Projects.length === 0)) {
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
  const approvedCount = clientBriefs.filter((b) => b.status === "Approved / Accepted").length;
  const needsActionCount = clientBriefs.filter(
    (b) => b.status === "Needs Information" || b.status === "Under Review"
  ).length;
  const upcomingMeetings = clientBriefs
    .filter((b) => b.meetingDate && !isRejectedBrief(b))
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
        lead_engineer: sp.lead_engineer || "Engr. Reyes",
        isStage3Build: true,
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
      if (status === "completed" || stage.includes("complete") || stage.includes("turned over") || progress >= 100) {
        return;
      }
      if (status === "in_progress" || stage.includes("construction") || stage.includes("ongoing") || (progress > 0 && progress < 100)) {
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
          lead_engineer: p.lead_engineer || "Engr. Reyes",
          isStage3Build: false,
          rawProject: p,
        });
      }
    });

    return list;
  }, [stage3Projects, allProjects]);

  const featuredProjects = inProgressProjects.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
          MCPA Construction Admin Console — Live Operations &amp; Site Progress Summary
        </p>
      </div>

      {/* 3D Interactive Perspective Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard3D
          label="New Inquiries"
          value={pendingCount}
          sub="Awaiting review"
          accentColor="#F59E0B"
          glowColor="rgba(245, 158, 11, 0.2)"
          icon={ClipboardListIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
        <MetricCard3D
          label="Scheduled Meetings"
          value={scheduledCount}
          sub="With meeting link"
          accentColor="#38BDF8"
          glowColor="rgba(56, 189, 248, 0.2)"
          icon={CalendarIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
        <MetricCard3D
          label="In-Progress Projects"
          value={inProgressProjects.length}
          sub={`${inProgressProjects.length} active on site`}
          accentColor="#10B981"
          glowColor="rgba(16, 185, 129, 0.2)"
          icon={BuildingIcon}
          onClick={() => onNavigateTab?.("site-progress")}
        />
        <MetricCard3D
          label="Action Required"
          value={needsActionCount}
          sub="Needs response"
          accentColor="#FB7185"
          glowColor="rgba(251, 113, 133, 0.2)"
          icon={BellIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">Active In-Progress Projects</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">Live Stage 3 Site Execution &amp; Engineering Progress</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums font-mono">{inProgressProjects.length} in progress</span>
              <button
                type="button"
                onClick={() => onNavigateTab?.("site-progress")}
                className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
            <div className="space-y-3">
              {featuredProjects.map((project, idx) => {
                const progress = project.progress;
                const stage = project.stage;
                const categoryColor = PROJECT_STAGE_COLORS[project.category] || "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
                return (
                  <div
                    key={project?.id ? `feat-${project.id}-${idx}` : `feat-idx-${idx}`}
                    onClick={() => {
                      if (project.isStage3Build && onSelectProject && project.rawProject) {
                        onSelectProject(project.rawProject);
                        onNavigateTab?.("site-progress");
                      }
                    }}
                    className={`p-4 sm:p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all shadow-xs space-y-3.5 ${
                      project.isStage3Build ? "cursor-pointer group" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className="relative w-10 h-10 rounded-full bg-neutral-900 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                          {project.avatar_url ? (
                            <img
                              src={project.avatar_url}
                              alt={project.client_name || "Client"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span className="font-mono text-xs font-bold text-amber-400">
                              {getInitials(project.client_name)}
                            </span>
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-neutral-900 dark:text-white tracking-tight truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {project.name}
                            </p>
                            {project.project_code && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20 shrink-0">
                                {project.project_code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">{project.client_name}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1 truncate">
                              <MapPinIcon className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{project.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-[4px] font-mono border text-[10px] uppercase font-bold tracking-wider shrink-0 ${categoryColor}`}>
                        {project.category}
                      </span>
                    </div>

                    {/* Progress Bar & Phase */}
                    <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-medium font-mono text-[11px]">
                          <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{stage}</span>
                        </div>
                        <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums font-mono text-xs">
                          {progress}% Completed
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-700 shadow-xs"
                          style={{ width: `${Math.max(2, progress)}%` }}
                        />
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-neutral-400">
                      <span>Lead Engineer: <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{project.lead_engineer || "Engr. Reyes"}</strong></span>
                      {project.isStage3Build && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          <span>Inspect Site Logs</span>
                          <ArrowRightIcon className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">Recent Inquiries</h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{clientBriefs.length} total</span>
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
              <div className="rounded-[6px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] overflow-hidden divide-y divide-neutral-100 dark:divide-white/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                {recentActivity.map((brief, idx) => {
                  const clientAvatar = resolveClientAvatar(brief);
                  const isGoogle =
                    brief.authProvider === "google" ||
                    brief.auth_provider === "google" ||
                    brief.clientEmail?.toLowerCase().endsWith("@gmail.com") ||
                    (clientAvatar && clientAvatar.includes("googleusercontent"));
                  const displayProjectType = (brief.projectType || "").includes("Residential Villa")
                    ? "Residential"
                    : brief.projectType || "Consultation Request";

                  const status = brief.status || "Pending Review";
                  const isPending = status === "Pending Review";
                  const isApproved = status === "Approved / Accepted" || status === "Meeting Scheduled";
                  const isRejected =
                    Boolean(brief.isRejected) ||
                    status.toLowerCase().includes("reject") ||
                    status.toLowerCase().includes("decline");
                  const briefKey = brief?.id ? `${brief.id}-${idx}` : `brief-act-${idx}`;

                  return (
                    <div key={briefKey} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="relative shrink-0">
                        {clientAvatar ? (
                          <img
                            src={clientAvatar}
                            alt={brief.clientName || "Client"}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(".client-avatar-fallback");
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: clientAvatar ? "none" : "flex" }}
                          className="client-avatar-fallback w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-semibold text-xs items-center justify-center uppercase font-mono"
                        >
                          {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                        </div>
                        {isGoogle && (
                          <span
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs"
                            title="Google Account Verified"
                          >
                            <GoogleIcon className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{brief.clientName}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{displayProjectType} — {brief.location || "Location TBD"}</p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-mono font-bold uppercase ${
                        isRejected
                          ? "text-rose-600 dark:text-rose-400"
                          : isApproved
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isPending
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-sky-600 dark:text-sky-400"
                      }`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">Scheduled Consultations</h3>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab("meetings")}
                  className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Meetings Hub</span>
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
                  const isGoogle =
                    brief.authProvider === "google" ||
                    brief.auth_provider === "google" ||
                    brief.clientEmail?.toLowerCase().endsWith("@gmail.com") ||
                    (clientAvatar && clientAvatar.includes("googleusercontent"));
                  const displayProjectType = (brief.projectType || "").includes("Residential Villa")
                    ? "Residential"
                    : brief.projectType || "Consultation";

                  return (
                    <div
                      key={brief?.id ? `${brief.id}-${idx}` : `brief-meet-${idx}`}
                      onClick={() => onNavigateTab && onNavigateTab("meetings")}
                      className="p-4 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-amber-500/40 shadow-xs space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            {clientAvatar ? (
                              <img
                                src={clientAvatar}
                                alt={brief.clientName || "Client"}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shadow-xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".client-avatar-fallback");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: clientAvatar ? "none" : "flex" }}
                              className="client-avatar-fallback w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-semibold text-xs items-center justify-center uppercase font-mono"
                            >
                              {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                            </div>
                            {isGoogle && (
                              <span
                                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs"
                                title="Google Account Verified"
                              >
                                <GoogleIcon className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">{brief.clientName}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{displayProjectType}</p>
                          </div>
                        </div>
                        <MeetingTypeBadge mode={brief.meetingMode} />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-neutral-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <CalendarIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{brief.meetingDate}{brief.meetingTime && ` — ${brief.meetingTime}`}</span>
                        </div>
                        {isMeetingPast(brief.meetingDate, brief.meetingTime) ? (
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                            Concluded
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
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

          <div className="p-5 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Inquiry Summary</h3>
              <TrendingUpIcon className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Total Inquiries", value: clientBriefs.length, color: "text-neutral-900 dark:text-white" },
                { label: "Pending Review", value: pendingCount, color: "text-amber-600 dark:text-amber-400" },
                { label: "Meetings Set", value: scheduledCount, color: "text-sky-600 dark:text-sky-400" },
                { label: "Approved", value: approvedCount, color: "text-emerald-600 dark:text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
                  <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              MCPA Headquarters
            </h3>
            <div className="space-y-1">
              {/* Location -> Google Maps */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=MCPA+Construction+and+Supply+Tabang+Plaridel+Bulacan"
                target="_blank"
                rel="noopener noreferrer"
                title="View MCPA Headquarters on Google Maps"
                className="flex items-center justify-between p-2.5 -mx-2.5 rounded-[4px] text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
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
                className="flex items-center justify-between p-2.5 -mx-2.5 rounded-[4px] text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PhoneIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">(0949) 775 8239</span>
                </div>
                <span className="text-[10px] font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider shrink-0">
                  Call
                </span>
              </a>

              {/* Email -> Mailto */}
              <a
                href="mailto:mcpa.construction@gmail.com?subject=Inquiry%20-%20MCPA%20Construction"
                title="Email mcpa.construction@gmail.com"
                className="flex items-center justify-between p-2.5 -mx-2.5 rounded-[4px] text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MailIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">mcpa.construction@gmail.com</span>
                </div>
                <span className="text-[10px] font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider shrink-0">
                  Email
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
