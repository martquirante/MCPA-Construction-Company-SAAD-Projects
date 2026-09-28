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
      F2F
    </span>
  );
}

export default function InquiryPipelineTab({
  clientBriefs = [],
  onUpdateStatus,
  onProvisionAccess,
  onDeleteBrief,
  showToast,
}) {
  const [filterStage, setFilterStage] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedBrief, setSelectedBrief] = useState(null);

  // Drawer editable state
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("09:00 AM - 10:30 AM");
  const [meetingMode, setMeetingMode] = useState("Online / Google Meet");
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
    setMeetingLink(brief.meetingLink || "https://meet.google.com/mcp-buil-tab");
    setMeetingDate(brief.meetingDate || "");
    setMeetingTime(brief.meetingTime || "09:00 AM - 10:30 AM");
    setMeetingMode(brief.meetingMode || "Online / Google Meet");
    setMeetingNotes(brief.meetingNotes || "");
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
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
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
              className="p-4 rounded-2xl bg-white dark:bg-[#12141a] border border-neutral-200/90 dark:border-white/[0.07] hover:border-neutral-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-none"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${color}`}>{value}</span>
              </div>
              <div className="mt-2.5 h-1 w-full rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: clientBriefs.length > 0 ? `${Math.min(100, (value / clientBriefs.length) * 100)}%` : "0%" }} />
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
              className="w-full pl-9 pr-4 py-2.5 h-[42px] rounded-xl text-xs bg-white dark:bg-[#12141a] border border-neutral-200/90 dark:border-white/[0.08] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
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
        {filteredBriefs.length === 0 ? (
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs transition-colors cursor-pointer"
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
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/[0.07] bg-white dark:bg-[#12141a] overflow-hidden shadow-xs">
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
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[9px] font-mono font-bold">
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
                          <p className="font-medium text-neutral-900 dark:text-white">{brief.projectType || "Residential"}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">{brief.location || "—"}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <MeetingTypeBadge mode={brief.meetingMode} />
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
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${stageConfig.color}`}>
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openDrawer(brief); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-neutral-950 transition-all text-[10px] font-mono uppercase cursor-pointer"
                            >
                              Review
                              <ChevronRightIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteBrief(brief.id); }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
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
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Client Info */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
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

              {/* Project Details */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Project Scope
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Lot Area", value: selectedBrief.lotArea || "—" },
                    { label: "Meeting Mode", value: selectedBrief.meetingMode || "Online" },
                    { label: "Budget Range", value: selectedBrief.budgetRange || "—" },
                    { label: "Financing", value: selectedBrief.financing || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2.5 rounded-xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                      <p className="text-[9px] font-mono uppercase text-neutral-500">{label}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {selectedBrief.message && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
                    <p className="text-[9px] font-mono uppercase text-neutral-500 mb-1">Client Message</p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedBrief.message}</p>
                  </div>
                )}
              </div>

              {/* Meeting Setup Form */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Meeting Setup
                </h4>

                {/* Meeting Mode */}
                <div className="grid grid-cols-2 gap-2">
                  {["Online / Google Meet", "Face-to-Face"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setMeetingMode(mode)}
                      className={`p-3 rounded-xl border text-[10px] font-mono text-left transition-all cursor-pointer ${
                        meetingMode === mode
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {mode === "Online / Google Meet" ? (
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
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">Time Slot</label>
                    <input
                      type="text"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      placeholder="09:00 AM - 10:30 AM"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1.5">
                    Meeting Link (Google Meet / Zoom / Other)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      onClick={handleCopyLink}
                      title="Copy link"
                      className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shrink-0"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                    {meetingLink && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all shrink-0"
                        title="Test link"
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-white/5 space-y-3 shrink-0 bg-neutral-50/80 dark:bg-white/[0.02]">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase font-mono tracking-wide transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <CheckIcon className="w-4 h-4" />
                {isApproving ? "Approving..." : "Approve & Send Email to Client"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStatus(selectedBrief.id, "Needs Information", {})}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-mono uppercase transition-all cursor-pointer"
                >
                  Reschedule
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-mono uppercase transition-all cursor-pointer"
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
