"use client";

import { useState } from "react";
import {
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  SparkleBadgeIcon,
  TrashIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  BadgePercentIcon,
  KeyRoundIcon,
} from "@/modules/shared/Icons";

const STAGES = [
  { id: "ALL", label: "All Stages" },
  { id: "Pending Review", label: "Pending Review", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { id: "Under Review", label: "Under Review", color: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  { id: "Needs Information", label: "Needs Information", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { id: "For Quotation", label: "For Quotation", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { id: "Quotation Sent", label: "Quotation Sent", color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
  { id: "Approved / Accepted", label: "Approved / Accepted", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold" },
  { id: "Rejected / Declined", label: "Rejected / Declined", color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 line-through" },
];

export default function InquiryPipelineTab({
  clientBriefs = [],
  onUpdateStatus,
  onProvisionAccess,
  onDeleteBrief,
  showToast,
}) {
  const [filterStage, setFilterStage] = useState("ALL");
  const [meetingModalBrief, setMeetingModalBrief] = useState(null);
  const [quotationModalBrief, setQuotationModalBrief] = useState(null);

  // Form states for Meeting modal
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/mcp-buil-tab");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("09:00 AM - 10:30 AM");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Form states for Quotation modal
  const [quotationAmount, setQuotationAmount] = useState("3850000");
  const [quotationNotes, setQuotationNotes] = useState("Two-Storey Contemporary Design & Build package including structural framing, grade 60 rebars, 3000 PSI concrete, architectural finishing, plumbing, and electrical.");

  const filteredBriefs = clientBriefs.filter((b) => {
    if (filterStage === "ALL") return true;
    const currentStatus = b.status || "Pending Review";
    return currentStatus.toLowerCase() === filterStage.toLowerCase();
  });

  const handleConfirmMeeting = async () => {
    if (!meetingModalBrief) return;
    await onUpdateStatus(meetingModalBrief.id, "Under Review", {
      meetingDate,
      meetingTime,
      meetingLink,
      meetingNotes,
    });
    setMeetingModalBrief(null);
    showToast(`1st Consultation meeting scheduled for ${meetingModalBrief.clientName}!`);
  };

  const handleConfirmQuotation = async () => {
    if (!quotationModalBrief) return;
    await onUpdateStatus(quotationModalBrief.id, "Quotation Sent", {
      quotationAmount: parseFloat(quotationAmount),
      quotationNotes,
    });
    setQuotationModalBrief(null);
    showToast(`Official quotation of ₱${Number(quotationAmount).toLocaleString()} dispatched to ${quotationModalBrief.clientName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Flowchart Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Flowchart Phases 1 to 4: Onboarding & Meeting Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
            Client Consultation & Stage Pipeline
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light">
            Transition client inquiries across the official SAAD lifecycle: from initial submission, 1st consultation meeting scheduling, quotation generation, to client account provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">Total Leads:</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
            {clientBriefs.length}
          </span>
        </div>
      </div>

      {/* Stage Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => setFilterStage(st.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
              filterStage === st.id
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredBriefs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-900/40">
          <UserIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            No inquiries under &quot;{filterStage}&quot;
          </h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
            Try switching filter chips or submit a new inquiry via the client booking portal at <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">/book</code>.
          </p>
        </div>
      ) : (
        /* Briefs Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBriefs.map((brief) => {
            const currentStatus = brief.status || "Pending Review";
            const stageConfig = STAGES.find((s) => s.id.toLowerCase() === currentStatus.toLowerCase()) || STAGES[1];

            return (
              <div
                key={brief.id}
                className="p-6 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Reference ID & Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                          {brief.submissionId || brief.id}
                        </span>
                        {brief.locationType === "OFW" ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold">
                            OFW Priority
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono">
                            Local Homeowner
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                        {brief.clientName}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${stageConfig.color}`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  {/* Specifications & Meeting Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Project Type</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.projectType || "Residential"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Lot Area & Status</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.lotArea || "Titled"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Meeting Mode</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.meetingMode ? brief.meetingMode.split(" ")[0] : "Online"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Site Location</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.location || "Bulacan"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Phone / Viber</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.clientPhone || "—"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Email Address</span>
                      <span className="text-neutral-900 dark:text-white font-semibold truncate block">
                        {brief.clientEmail}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Slot or Link details if set */}
                  {brief.meetingLink && (
                    <div className="p-3 rounded-xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-900 dark:text-sky-200 flex items-center justify-between gap-2 mb-2">
                      <div className="truncate">
                        <span className="font-bold">Scheduled Meeting: </span>
                        <span>{brief.meetingDate} ({brief.meetingTime})</span>
                      </div>
                      <a
                        href={brief.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase shrink-0 transition-colors"
                      >
                        Open Link
                      </a>
                    </div>
                  )}

                  {/* Quotation amount if set */}
                  {brief.quotationAmount && (
                    <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-900 dark:text-purple-200 flex items-center justify-between mb-2">
                      <span>Official Quotation & BOQ:</span>
                      <span className="font-bold text-sm text-purple-600 dark:text-purple-400">₱{Number(brief.quotationAmount).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Client Portal Code if provisioned */}
                  {brief.clientPortalCode && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono flex items-center justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300">Client Portal Access Code:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{brief.clientPortalCode}</span>
                    </div>
                  )}
                </div>

                {/* Flowchart Action Bar */}
                <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Schedule 1st Meeting Button */}
                    <button
                      onClick={() => {
                        setMeetingModalBrief(brief);
                        setMeetingDate(brief.meetingDate || "");
                        setMeetingTime(brief.meetingTime || "09:00 AM - 10:30 AM");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 text-[11px] font-mono font-semibold uppercase transition-colors cursor-pointer"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Schedule Meeting</span>
                    </button>

                    {/* Quotation & BOQ Button */}
                    <button
                      onClick={() => setQuotationModalBrief(brief)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] font-mono font-semibold uppercase transition-colors cursor-pointer"
                    >
                      <BadgePercentIcon className="w-3.5 h-3.5" />
                      <span>Prepare Quotation & BOQ</span>
                    </button>

                    {/* Needs Info button */}
                    <button
                      onClick={() => onUpdateStatus(brief.id, "Needs Information")}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 border border-orange-500/30 text-[11px] font-mono uppercase transition-colors cursor-pointer"
                      title="Request missing documents / lot plans from client"
                    >
                      Needs Info
                    </button>

                    {/* Provision Client Portal Code Button */}
                    <button
                      onClick={() => onProvisionAccess(brief.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold uppercase transition-all shadow-md shadow-emerald-500/20 text-[11px] font-mono cursor-pointer"
                      title="Generate Client Portal Account Credentials"
                    >
                      <KeyRoundIcon className="w-3.5 h-3.5" />
                      <span>Provision Access</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Reject Button */}
                    <button
                      onClick={() => onUpdateStatus(brief.id, "Rejected / Declined")}
                      className="px-2 py-1 rounded text-[11px] font-mono text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Decline
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteBrief(brief.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Inquiry"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SCHEDULE 1ST CONSULTATION MEETING */}
      {meetingModalBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                  Phase 2: Meeting Dispatcher
                </span>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                  Confirm 1st Consultation Meeting
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
                  Dispatching meeting details to <strong>{meetingModalBrief.clientName}</strong> ({meetingModalBrief.clientEmail}).
                </p>
              </div>
              <button
                onClick={() => setMeetingModalBrief(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">
                  Google Meet / Zoom Meeting Link (For Online / OFW)
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Confirmed Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Engineering Notes / Agenda</label>
                <textarea
                  rows={3}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Review client floor plan sketches, discuss soil bearing qa test, and clarify budget constraints..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMeetingModalBrief(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-mono uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMeeting}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono uppercase cursor-pointer transition-colors shadow-md shadow-sky-600/20"
              >
                Confirm & Mark &quot;Under Review&quot;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREPARE OFFICIAL QUOTATION & BOQ */}
      {quotationModalBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
                  Phase 3: Estimator BOQ Dispatcher
                </span>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                  Prepare Official Quotation
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
                  For <strong>{quotationModalBrief.clientName}</strong> ({quotationModalBrief.projectType}).
                </p>
              </div>
              <button
                onClick={() => setQuotationModalBrief(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Total Contract Cost (PHP)</label>
                <input
                  type="number"
                  value={quotationAmount}
                  onChange={(e) => setQuotationAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-base font-bold font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">
                  Bill of Quantities (BOQ) & Scope Specification
                </label>
                <textarea
                  rows={4}
                  value={quotationNotes}
                  onChange={(e) => setQuotationNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setQuotationModalBrief(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-mono uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmQuotation}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono uppercase cursor-pointer transition-colors shadow-md shadow-purple-600/20"
              >
                Dispatch & Mark &quot;Quotation Sent&quot;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
