"use client";

import { useState } from "react";
import {
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  TrashIcon,
  ExternalLinkIcon,
  VideoIcon,
  PhoneIcon,
  CloseIcon,
  CopyIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  XCircleIcon,
  CheckCircle2Icon,
  SearchIcon,
} from "@/modules/shared/Icons";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";
import StageCombobox from "@/modules/admin/components/StageCombobox";
import { InquiryTableSkeleton } from "@/modules/shared/Skeleton";
import { EstablishmentLogo } from "@/modules/book/components/VenueSearchModal";

const STAGES = [
  {
    id: "ALL",
    label: "All Stages",
    iconSrc: "https://cdn.lordicon.com/gqdnbnwt.json",
    colors: "primary:#f59e0b,secondary:#64748b",
    dot: "bg-amber-500",
  },
  {
    id: "Pending Review",
    label: "Pending Review",
    iconSrc: "https://cdn.lordicon.com/kbtmbyzy.json",
    colors: "primary:#f59e0b,secondary:#d97706",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
  },
  {
    id: "Under Review",
    label: "Under Review",
    iconSrc: "https://cdn.lordicon.com/msoeawqm.json",
    colors: "primary:#0284c7,secondary:#38bdf8",
    color: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    dot: "bg-sky-500",
  },
  {
    id: "Needs Information",
    label: "Needs Information",
    iconSrc: "https://cdn.lordicon.com/puvaffet.json",
    colors: "primary:#ea580c,secondary:#f97316",
    color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
  },
  {
    id: "For Quotation",
    label: "For Quotation",
    iconSrc: "https://cdn.lordicon.com/qhviklyi.json",
    colors: "primary:#9333ea,secondary:#c084fc",
    color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    dot: "bg-purple-500",
  },
  {
    id: "Quotation Sent",
    label: "Quotation Sent",
    iconSrc: "https://cdn.lordicon.com/rhvddzym.json",
    colors: "primary:#4f46e5,secondary:#818cf8",
    color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  {
    id: "Approved / Accepted",
    label: "Approved / Accepted",
    iconSrc: "https://cdn.lordicon.com/oqdmuxru.json",
    colors: "primary:#10b981,secondary:#059669",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  {
    id: "Rejected / Declined",
    label: "Rejected / Declined",
    iconSrc: "https://cdn.lordicon.com/nqtddedc.json",
    colors: "primary:#ef4444,secondary:#dc2626",
    color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dot: "bg-rose-500",
  },
];

function MeetingTypeBadge({ brief, mode }) {
  const effectiveMode = mode || brief?.meetingMode || brief?.meeting_mode || "";
  const isOnline =
    effectiveMode?.toLowerCase().includes("online") ||
    effectiveMode?.toLowerCase().includes("virtual") ||
    effectiveMode?.toLowerCase().includes("meet") ||
    effectiveMode?.toLowerCase().includes("zoom");

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
        <VideoIcon className="w-3 h-3 shrink-0" />
        Online Video Call
      </span>
    );
  }

  const venueType = brief?.venueType || brief?.venue_type || "";
  const venueDetails = brief?.venueDetails || brief?.venue_details || "";

  if (venueType === "Office" || venueType === "MCPA Office") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
        <span>🏢</span>
        MCPA Office
      </span>
    );
  }

  if (venueType === "Project Site") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
        <MapPinIcon className="w-3 h-3 shrink-0" />
        Project Site
      </span>
    );
  }

  if (venueDetails) {
    const brandCandidate = venueDetails.split("—")[0].trim().split("-")[0].trim();
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap max-w-[210px] truncate"
        title={venueDetails}
      >
        <span className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/20">
          <EstablishmentLogo name={brandCandidate} brand={brandCandidate} className="w-3.5 h-3.5" iconClassName="w-2 h-2" />
        </span>
        <span className="truncate">{brandCandidate}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase whitespace-nowrap">
      <MapPinIcon className="w-3 h-3 shrink-0" />
      In-Person
    </span>
  );
}

export default function InquiryPipelineTab({
  clientBriefs = [],
  onUpdateStatus,
  onProvisionAccess,
  onDeleteBrief,
  showToast,
  isLoading = false,
}) {
  const [filterStage, setFilterStage] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedBrief, setSelectedBrief] = useState(null);

  // Drawer editable state
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("09:00 AM - 10:30 AM");
  const [meetingMode, setMeetingMode] = useState("Online Video Call");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredBriefs = clientBriefs.filter((b) => {
    const matchStage =
      filterStage === "ALL" ||
      (b.status || "Pending Review").toLowerCase() === filterStage.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.clientName?.toLowerCase().includes(q) ||
      b.clientEmail?.toLowerCase().includes(q) ||
      b.projectType?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q) ||
      (b.submissionId || b.id || "").toLowerCase().includes(q);
    return matchStage && matchSearch;
  });

  const openDrawer = (brief) => {
    setSelectedBrief(brief);
    const isOnline = (brief.meetingMode || brief.meeting_mode || "").toLowerCase().includes("online");
    const defaultF2FVenue =
      brief.venueDetails ||
      brief.venue_details ||
      (brief.venueType === "Office"
        ? "MCPA Head Office, Tabang, Plaridel, Bulacan"
        : brief.location || "MCPA Head Office");

    setMeetingLink(
      brief.meetingLink ||
      brief.meeting_link ||
      (isOnline ? "https://meet.google.com/mcp-buil-tab" : defaultF2FVenue)
    );
    setMeetingDate(brief.meetingDate || brief.meeting_date || "");
    setMeetingTime(brief.meetingTime || brief.meeting_time || "09:00 AM - 10:30 AM");
    setMeetingMode(isOnline ? "Online Video Call" : "Face-to-Face");
    setMeetingNotes(brief.meetingNotes || brief.meeting_notes || "");
  };

  const closeDrawer = () => setSelectedBrief(null);

  const handleApprove = async () => {
    if (!selectedBrief) return;
    setIsApproving(true);
    await onUpdateStatus(selectedBrief.id, "Under Review", {
      meetingDate,
      meetingTime,
      meetingLink,
      meetingMode,
      meetingNotes,
      venueType: selectedBrief.venueType || selectedBrief.venue_type,
      venueDetails: selectedBrief.venueDetails || selectedBrief.venue_details,
    });
    setIsApproving(false);
    showToast(`Meeting confirmed for ${selectedBrief.clientName}! Approval email sent.`);
    closeDrawer();
  };

  const handleReject = async () => {
    if (!selectedBrief) return;
    if (!window.confirm(`Reject inquiry from ${selectedBrief.clientName}?`)) return;
    setIsRejecting(true);
    await onUpdateStatus(selectedBrief.id, "Rejected / Declined", {});
    setIsRejecting(false);
    showToast(`Inquiry from ${selectedBrief.clientName} rejected.`);
    closeDrawer();
  };

  const handleCopyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      showToast("Meeting link copied to clipboard.");
    }
  };

  const pendingCount = clientBriefs.filter((b) => !b.status || b.status === "Pending Review").length;
  const scheduledCount = clientBriefs.filter((b) => b.meetingDate).length;
  const approvedCount = clientBriefs.filter((b) => b.status === "Approved / Accepted").length;
  const rejectedCount = clientBriefs.filter((b) => b.status === "Rejected / Declined").length;

  const stageCounts = STAGES.reduce((acc, st) => {
    if (st.id === "ALL") {
      acc[st.id] = clientBriefs.length;
    } else if (st.id === "Pending Review") {
      acc[st.id] = clientBriefs.filter((b) => !b.status || b.status === "Pending Review").length;
    } else {
      acc[st.id] = clientBriefs.filter((b) => b.status === st.id).length;
    }
    return acc;
  }, {});

  return (
    <div className="flex gap-0 relative min-h-0">
      {/* Main content - shrinks when drawer is open */}
      <div className={`flex-1 min-w-0 space-y-5 transition-all duration-300 ${selectedBrief ? "lg:mr-[520px]" : ""}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
              Inquiries
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              Track and manage all client inquiries through the 5-phase workflow
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-neutral-500">Total Leads:</span>
            <span className="px-2.5 py-1 rounded-[4px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
              {clientBriefs.length}
            </span>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Pending Review", value: pendingCount, color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
            { label: "Meetings Scheduled", value: scheduledCount, color: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500" },
            { label: "Approved", value: approvedCount, color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
            { label: "Rejected", value: rejectedCount, color: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
          ].map(({ label, value, color, bar }) => (
            <div
              key={label}
              className="p-4 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.14] transition-colors shadow-xs"
            >
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">{label}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-mono font-bold tabular-nums tracking-tight ${color}`}>{value}</span>
              </div>
              <div className="mt-2.5 h-1 w-full rounded-[2px] bg-neutral-100 dark:bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-[2px] ${bar} transition-all duration-500`} style={{ width: clientBriefs.length > 0 ? `${Math.min(100, (value / clientBriefs.length) * 100)}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search client name, email, project type, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-[40px] rounded-[4px] text-xs font-mono bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
            />
          </div>
          <StageCombobox
            stages={STAGES}
            selectedStage={filterStage}
            onSelectStage={setFilterStage}
            stageCounts={stageCounts}
            totalCount={clientBriefs.length}
          />
        </div>

        {/* Table */}
        {isLoading && (!clientBriefs || clientBriefs.length === 0) ? (
          <InquiryTableSkeleton rows={5} />
        ) : filteredBriefs.length === 0 ? (
          (search.trim() || filterStage !== "ALL") ? (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/msoeawqm.json"
              badgeText="Search / Filter Active"
              title="No Matching Inquiries Found"
              description={`No inquiries match "${search || filterStage}". Try modifying your keywords or clearing the active stage filters.`}
              actionButton={
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterStage("ALL");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs transition-colors cursor-pointer"
                >
                  Clear Filters & Search
                </button>
              }
            />
          ) : (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/rhvddzym.json"
              badgeText="Live Pipeline Standby"
              title="No Inquiries Received Yet"
              description="Customer consultation requests and project briefs submitted through the client booking portal will automatically stream directly into this pipeline in real-time."
            />
          )
        ) : (
          <div className="rounded-[6px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] overflow-hidden shadow-xs animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 dark:bg-white/[0.03] border-b border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Inquiry ID</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Project / Service</th>
                    <th className="py-3.5 px-4">Meeting Type</th>
                    <th className="py-3.5 px-4">Schedule</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5 text-neutral-800 dark:text-neutral-200">
                  {filteredBriefs.map((brief, idx) => {
                    const currentStatus = brief.status || "Pending Review";
                    const stageConfig = STAGES.find((s) => s.id.toLowerCase() === currentStatus.toLowerCase()) || STAGES[1];
                    const isSelected = selectedBrief?.id === brief.id;
                    const rowKey = brief?.id ? `brief-${brief.id}-${idx}` : `brief-row-${idx}`;
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => openDrawer(brief)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-amber-500/5 dark:bg-amber-500/10 border-l-2 border-l-amber-500"
                            : "hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                            {brief.submissionId || brief.id}
                          </span>
                          {brief.locationType === "OFW" && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-[4px] bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[9px] font-mono font-bold">
                              OFW
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 uppercase">
                              {brief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-neutral-900 dark:text-white truncate">{brief.clientName}</p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">{brief.clientPhone || brief.clientEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-neutral-900 dark:text-white">{brief.projectType || "Residential"}</span>
                            {brief.storeys && (
                              <span className="px-1.5 py-0.5 rounded-[3px] bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-700 dark:text-amber-400">
                                {brief.storeys}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[220px]">{brief.location || "—"}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <MeetingTypeBadge brief={brief} mode={brief.meetingMode} />
                        </td>
                        <td className="py-3.5 px-4">
                          {brief.meetingDate ? (
                            <div>
                              <p className="font-mono text-neutral-900 dark:text-white">{brief.meetingDate}</p>
                              {brief.meetingTime && <p className="text-[10px] text-neutral-500 font-mono">{brief.meetingTime}</p>}
                            </div>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-600 font-mono italic">Not scheduled</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-mono font-bold border ${stageConfig.color}`}>
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openDrawer(brief); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-neutral-950 transition-colors text-[10px] font-mono uppercase cursor-pointer"
                            >
                              Review
                              <ChevronRightIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteBrief(brief.id); }}
                              className="p-1.5 rounded-[4px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove inquiry"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over Right Drawer */}
      {selectedBrief && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={closeDrawer}
          />

          <div className="fixed right-0 top-0 h-screen w-full max-w-[520px] z-50 flex flex-col bg-white dark:bg-[#12141a] border-l border-neutral-200/90 dark:border-white/[0.08] shadow-2xl transition-transform duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/5 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Consultation Review
                </h3>
                <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {selectedBrief.submissionId || selectedBrief.id} — Submitted inquiry details
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-[4px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Client Info */}
              <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Client Information
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                    {selectedBrief.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white text-sm">{selectedBrief.clientName}</p>
                    <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">
                      {selectedBrief.locationType === "OFW" ? "OFW Priority" : "Local Homeowner"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <PhoneIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedBrief.clientPhone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <MailIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedBrief.clientEmail || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedBrief.location || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <UserIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedBrief.projectType || "Residential"}</span>
                  </div>
                </div>
              </div>

              {/* Architectural Specifications */}
              {(() => {
                const parseSafe = (val) => {
                  if (!val) return null;
                  if (typeof val === "object") return val;
                  try { return JSON.parse(val); } catch { return null; }
                };

                const spatial = parseSafe(selectedBrief.spatialWishlist || selectedBrief.spatial_wishlist);
                const coords = selectedBrief.mapCoordinates || selectedBrief.map_coordinates || "";
                const storeysVal = selectedBrief.storeys || "";
                const styleVal = selectedBrief.preferredStyle || selectedBrief.preferred_style || "";
                const lotStatusVal = selectedBrief.lotStatus || selectedBrief.lot_status || "";
                const lotAreaVal = selectedBrief.lotArea || selectedBrief.lot_area || "";
                const timelineVal = selectedBrief.targetDate || selectedBrief.target_date || "";
                const financingVal = selectedBrief.financingOption || selectedBrief.financing_option || selectedBrief.financing || "";

                return (
                  <>
                    {/* Architectural Classification & Scope */}
                    <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Architectural Classification & Scope
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Project Type</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {selectedBrief.projectType || "Residential"}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Style Peg</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {styleVal || "Modern Contemporary"}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Building Height</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {storeysVal || "2-Storey"}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Target Timeline</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {timelineVal || "Within 3 Months"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Proposed Construction Site & Satellite Pin */}
                    <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Proposed Construction Site
                      </h4>
                      <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 space-y-1">
                        <p className="text-[9px] font-mono uppercase text-neutral-500">Lot Location Address</p>
                        <p className="text-xs font-medium text-neutral-900 dark:text-white leading-relaxed">
                          {selectedBrief.location || "Plaridel, Bulacan"}
                        </p>
                        {(() => {
                          const addr = parseSafe(selectedBrief.siteAddressDetails || selectedBrief.site_address_details);
                          if (!addr) return null;
                          const details = [
                            addr.province && `Prov: ${addr.province}`,
                            addr.city && `City: ${addr.city}`,
                            addr.barangay && `Brgy: ${addr.barangay}`,
                            addr.subdivision && `Subd: ${addr.subdivision}`,
                            addr.street && `Street: ${addr.street}`,
                            (addr.blkLot || addr.houseNo) && `Lot/Unit: ${[addr.blkLot && `Blk ${addr.blkLot}`, addr.houseNo && `Unit ${addr.houseNo}`].filter(Boolean).join(", ")}`,
                          ].filter(Boolean);
                          if (details.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1 pt-1.5 border-t border-neutral-100 dark:border-white/5">
                              {details.map((d, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded-[3px] bg-neutral-100 dark:bg-white/5 text-[9px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/5">
                                  {d}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Lot Status</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {lotStatusVal || "Already Owned / Titled"}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Lot Area</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {lotAreaVal || "—"}
                          </p>
                        </div>
                      </div>
                      {coords && (
                        <div className="p-2.5 rounded-[4px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold">Satellite Coordinates</p>
                            <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate mt-0.5">{coords}</p>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            <span>Google Satellite</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Spatial Wishlist & Requirements */}
                    {spatial && (
                      <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Spatial Wishlist & Programming
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 text-center">
                            <p className="text-[9px] font-mono uppercase text-neutral-500">Bedrooms</p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {spatial.bedrooms || "3"} BR
                            </p>
                          </div>
                          <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 text-center">
                            <p className="text-[9px] font-mono uppercase text-neutral-500">Bathrooms</p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {spatial.bathrooms || "2"} Bath
                            </p>
                          </div>
                          <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 text-center">
                            <p className="text-[9px] font-mono uppercase text-neutral-500">Car Garage</p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {spatial.carGarage || "2 Cars"}
                            </p>
                          </div>
                        </div>
                        {Array.isArray(spatial.featureTags) && spatial.featureTags.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[9px] font-mono uppercase text-neutral-500">Selected Architectural Features</p>
                            <div className="flex flex-wrap gap-1.5">
                              {spatial.featureTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-[4px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono capitalize"
                                >
                                  {tag.replace(/[_-]/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Financials & Consultation Type */}
                    <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Financial & Client Notes
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Budget Range</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {selectedBrief.budgetRange || "Flexible"}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500">Financing Mode</p>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                            {financingVal || "Progress Billing"}
                          </p>
                        </div>
                      </div>
                      {selectedBrief.message && (
                        <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                          <p className="text-[9px] font-mono uppercase text-neutral-500 mb-1">Client Special Remarks</p>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {selectedBrief.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Client Consultation Preference */}
              {(() => {
                const isOnline = (selectedBrief.meetingMode || selectedBrief.meeting_mode || "").toLowerCase().includes("online");
                const venueType = selectedBrief.venueType || selectedBrief.venue_type;
                const venueDetails = selectedBrief.venueDetails || selectedBrief.venue_details;
                const brandName = venueDetails ? venueDetails.split("—")[0].trim().split("-")[0].trim() : "";
                const prefDate = selectedBrief.meetingDate || selectedBrief.meeting_date;
                const prefTime = selectedBrief.meetingTime || selectedBrief.meeting_time;

                return (
                  <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Client Consultation Preference
                      </h4>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase ${
                        isOnline
                          ? "bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-400"
                          : "bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400"
                      }`}>
                        {isOnline ? "Online Video Call" : "In-Person Consultation"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                        <p className="text-[9px] font-mono uppercase text-neutral-500">Requested Date</p>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                          {prefDate || "Not specified"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-[4px] bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                        <p className="text-[9px] font-mono uppercase text-neutral-500">Requested Time</p>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
                          {prefTime || "Any Available"}
                        </p>
                      </div>
                    </div>

                    {!isOnline && (
                      <div className="p-3 rounded-[4px] bg-amber-500/10 border border-amber-500/20 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold">
                            Preferred Meeting Venue
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                            {venueType || "Face-to-Face"}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 pt-1">
                          {brandName ? (
                            <div className="w-8 h-8 rounded-[6px] overflow-hidden bg-white shadow-xs shrink-0 flex items-center justify-center p-1 border border-neutral-200 dark:border-white/10">
                              <EstablishmentLogo name={brandName} brand={brandName} className="w-6 h-6" iconClassName="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-[6px] bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 flex items-center justify-center text-sm">
                              {venueType === "Office" ? "🏢" : "📍"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white leading-snug">
                              {venueDetails || (venueType === "Office" ? "MCPA Head Office, Tabang, Plaridel, Bulacan" : "Project Site / Physical Venue")}
                            </p>
                            {venueDetails && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueDetails)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline"
                              >
                                <MapPinIcon className="w-3 h-3" />
                                View Venue on Google Maps
                                <ExternalLinkIcon className="w-2.5 h-2.5 ml-0.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isOnline && (
                      <div className="p-2.5 rounded-[4px] bg-sky-500/10 border border-sky-500/20 flex items-center gap-2">
                        <VideoIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        <p className="text-[11px] font-mono text-sky-800 dark:text-sky-300">
                          Client requested a virtual video consultation. Video call link will be included in the confirmation email.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Meeting Setup Form */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Meeting Setup (Admin Confirmation)
                </h4>

                {/* Meeting Mode */}
                <div className="grid grid-cols-2 gap-2">
                  {["Online Video Call", "Face-to-Face"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setMeetingMode(mode);
                        if (mode === "Face-to-Face" && selectedBrief) {
                          setMeetingLink(selectedBrief.venueDetails || selectedBrief.venue_details || "MCPA Head Office, Tabang, Plaridel, Bulacan");
                        } else if (mode === "Online Video Call" && selectedBrief) {
                          setMeetingLink(selectedBrief.meetingLink || selectedBrief.meeting_link || "https://meet.google.com/mcp-buil-tab");
                        }
                      }}
                      className={`p-3 rounded-[4px] border text-[10px] font-mono text-left transition-colors cursor-pointer ${
                        meetingMode === mode
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {mode === "Online Video Call" ? (
                          <VideoIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{mode}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">Confirmed Date</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">Confirmed Time Slot</label>
                    <input
                      type="text"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      placeholder="09:00 AM - 10:30 AM"
                      className="w-full px-3 py-2 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Meeting Link / Venue Address */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">
                    {meetingMode === "Online Video Call"
                      ? "Video Meeting Link (Google Meet / Zoom)"
                      : "Meeting Venue / Physical Location Details"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={meetingMode === "Online Video Call" ? "url" : "text"}
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder={
                        meetingMode === "Online Video Call"
                          ? "https://meet.google.com/..."
                          : "Starbucks, Robinsons Malolos / MCPA Head Office..."
                      }
                      className="flex-1 px-3 py-2 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      onClick={handleCopyLink}
                      title="Copy link or venue"
                      className="px-3 py-2 rounded-[4px] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                    {meetingLink && (
                      <a
                        href={
                          meetingLink.startsWith("http://") || meetingLink.startsWith("https://")
                            ? meetingLink
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLink)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-[4px] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shrink-0"
                        title={meetingLink.startsWith("http") ? "Open meeting link" : "Open in Google Maps"}
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">Admin Notes</label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Add any notes or instructions for this consultation..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-white/5 space-y-3 shrink-0 bg-neutral-50/80 dark:bg-white/[0.02]">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase font-mono tracking-wide transition-colors cursor-pointer shadow-sm"
              >
                <CheckIcon className="w-4 h-4" />
                {isApproving ? "Approving..." : "Approve & Send Email to Client"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStatus(selectedBrief.id, "Needs Information", {})}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-mono uppercase transition-colors cursor-pointer"
                >
                  Reschedule
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-mono uppercase transition-colors cursor-pointer"
                >
                  <XCircleIcon className="w-3.5 h-3.5" />
                  {isRejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
