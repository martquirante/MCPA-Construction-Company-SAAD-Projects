"use client";

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
} from "@/modules/shared/Icons";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";
import MetricCard3D from "@/modules/admin/components/MetricCard3D";

const PROJECT_STAGE_COLORS = {
  "Residential": "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  "Commercial": "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Industrial": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Renovation": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

function MeetingTypeBadge({ mode }) {
  const isOnline =
    mode?.toLowerCase().includes("online") ||
    mode?.toLowerCase().includes("virtual") ||
    mode?.toLowerCase().includes("meet") ||
    mode?.toLowerCase().includes("zoom");

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
        <VideoIcon className="w-3 h-3" />
        Google Meet
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
      <MapPinIcon className="w-3 h-3" />
      Face-to-Face
    </span>
  );
}

export default function DashboardTab({ clientBriefs = [], allProjects = [], onNavigateTab }) {
  const pendingCount = clientBriefs.filter(
    (b) => !b.status || b.status === "Pending Review"
  ).length;
  const scheduledCount = clientBriefs.filter((b) => b.meetingDate).length;
  const approvedCount = clientBriefs.filter((b) => b.status === "Approved / Accepted").length;
  const needsActionCount = clientBriefs.filter(
    (b) => b.status === "Needs Information" || b.status === "Under Review"
  ).length;
  const upcomingMeetings = clientBriefs.filter((b) => b.meetingDate && b.meetingLink).slice(0, 4);
  const recentActivity = [...clientBriefs]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5);
  const featuredProjects = allProjects.slice(0, 3);
  const mockProgress = [68, 34, 92];
  const mockStages = [
    "Structural Framing & 2nd Floor Slab",
    "Foundation & Ground Floor Columns",
    "Final Finishing & Punchlisting",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
          MCPA Construction Admin Console — Live Operations Summary
        </p>
      </div>

      {/* 3D Interactive Perspective Metric Cards (Drive&Go Design Architecture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard3D
          label="New Inquiries"
          value={pendingCount}
          sub="Awaiting review"
          accentColor="#F59E0B"
          glowColor="rgba(245, 158, 11, 0.28)"
          icon={ClipboardListIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
        <MetricCard3D
          label="Scheduled Meetings"
          value={scheduledCount}
          sub="With meeting link"
          accentColor="#0284C7"
          glowColor="rgba(14, 165, 233, 0.28)"
          icon={CalendarIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
        <MetricCard3D
          label="Active Projects"
          value={allProjects.length}
          sub="Live on portfolio"
          accentColor="#10B981"
          glowColor="rgba(16, 185, 129, 0.28)"
          icon={BuildingIcon}
          onClick={() => onNavigateTab?.("projects")}
        />
        <MetricCard3D
          label="Action Required"
          value={needsActionCount}
          sub="Needs response"
          accentColor="#F43F5E"
          glowColor="rgba(244, 63, 94, 0.28)"
          icon={BellIcon}
          onClick={() => onNavigateTab?.("briefs")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">Active Portfolio Projects</h3>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">{allProjects.length} total</span>
          </div>

          {featuredProjects.length === 0 ? (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/wzwygmng.json"
              badgeText="Portfolio Standby"
              title="No Active Projects"
              description="Active structural and architectural construction builds will be showcased here."
              compact
              size={64}
            />
          ) : (
            <div className="space-y-3">
              {featuredProjects.map((project, idx) => {
                const progress = mockProgress[idx] ?? 50;
                const stage = mockStages[idx] ?? "In Progress";
                const categoryColor = PROJECT_STAGE_COLORS[project.category] || "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700";
                return (
                  <div key={project?.id ? `feat-${project.id}-${idx}` : `feat-idx-${idx}`} className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-neutral-200 dark:border-[#1E293B] shadow-sm dark:shadow-none space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">{project.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPinIcon className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">{project.location}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono uppercase shrink-0 ${categoryColor}`}>{project.category}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-500 dark:text-neutral-400 uppercase">{stage}</span>
                        <span className={`font-bold ${progress >= 80 ? "text-emerald-600 dark:text-emerald-400" : progress >= 50 ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"}`}>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${progress >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : progress >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-sky-500 to-sky-400"}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">Recent Inquiries</h3>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">{clientBriefs.length} total</span>
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
              <div className="rounded-2xl border border-neutral-200 dark:border-[#1E293B] bg-white dark:bg-[#131B2E] overflow-hidden divide-y divide-neutral-100 dark:divide-white/5">
                {recentActivity.map((brief, idx) => {
                  const status = brief.status || "Pending Review";
                  const isPending = status === "Pending Review";
                  const isApproved = status === "Approved / Accepted";
                  const briefKey = brief?.id ? `${brief.id}-${idx}` : `brief-act-${idx}`;
                  return (
                    <div key={briefKey} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                        {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{brief.clientName}</p>
                        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">{brief.projectType || "Consultation Request"} — {brief.location || "Location TBD"}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${isApproved ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : isPending ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400" : "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400"}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">Scheduled Consultations</h3>
            {upcomingMeetings.length === 0 ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/abfverha.json"
                badgeText="Calendar Clear"
                title="No Meetings Scheduled"
                description="Approve inquiries in the Inquiries tab to schedule meeting dates and attach Google Meet links."
                compact
                size={64}
              />
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((brief, idx) => (
                  <div key={brief?.id ? `${brief.id}-${idx}` : `brief-meet-${idx}`} className="p-4 rounded-2xl bg-white dark:bg-[#131B2E] border border-neutral-200 dark:border-[#1E293B] shadow-sm dark:shadow-none space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{brief.clientName}</p>
                        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{brief.projectType || "Consultation"}</p>
                      </div>
                      <MeetingTypeBadge mode={brief.meetingMode} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 dark:text-neutral-300">
                      <CalendarIcon className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{brief.meetingDate}{brief.meetingTime && ` — ${brief.meetingTime}`}</span>
                    </div>
                    {brief.meetingLink && (
                      <a href={brief.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase font-mono transition-colors">
                        <VideoIcon className="w-3 h-3" />
                        Join Meeting
                        <ArrowRightIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 dark:border-amber-500/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono tracking-wider">Inquiry Summary</h3>
              <TrendingUpIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-2">
              {[
                { label: "Total Inquiries", value: clientBriefs.length, color: "text-neutral-900 dark:text-white" },
                { label: "Pending Review", value: pendingCount, color: "text-amber-700 dark:text-amber-400" },
                { label: "Meetings Set", value: scheduledCount, color: "text-sky-700 dark:text-sky-400" },
                { label: "Approved", value: approvedCount, color: "text-emerald-700 dark:text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-neutral-200 dark:border-[#1E293B] shadow-sm dark:shadow-none space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider">
              MCPA Headquarters
            </h3>
            <div className="space-y-1">
              {/* Location -> Google Maps */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=MCPA+Construction+and+Supply+Tabang+Plaridel+Bulacan"
                target="_blank"
                rel="noopener noreferrer"
                title="View MCPA Headquarters on Google Maps"
                className="flex items-center justify-between p-2 -mx-2 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">Tabang, Plaridel, Bulacan</span>
                </div>
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1 text-neutral-400 group-hover:text-amber-500" />
              </a>

              {/* Phone -> Call */}
              <a
                href="tel:09497758239"
                title="Call MCPA Headquarters ((0949) 775 8239)"
                className="flex items-center justify-between p-2 -mx-2 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PhoneIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">(0949) 775 8239</span>
                </div>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold shrink-0">
                  Call
                </span>
              </a>

              {/* Email -> Mailto */}
              <a
                href="mailto:mcpa.construction@gmail.com?subject=Inquiry%20-%20MCPA%20Construction"
                title="Email mcpa.construction@gmail.com"
                className="flex items-center justify-between p-2 -mx-2 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MailIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline underline-offset-2">mcpa.construction@gmail.com</span>
                </div>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold shrink-0">
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
