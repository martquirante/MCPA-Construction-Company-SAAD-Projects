"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CalendarCheck,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Building,
  Building2,
  Coffee,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  X,
  Send,
  Lock,
  Layers,
  Zap,
} from "lucide-react";
import GoogleMeetRoom from "./GoogleMeetRoom";
import { getMeetingLifecycleState } from "@/modules/portal/utils/meetingTiming";
import VenueCombobox from "@/modules/book/components/VenueCombobox";
import { io } from "socket.io-client";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";

export default function PortalMeetingHub({
  activeProject,
  currentUser,
  meetingRoom,
  inquiries = [],
  showToast = () => {},
}) {
  // Mode: 'schedule' (hub) vs 'in_call' (google meet)
  const [viewState, setViewState] = useState("schedule"); // 'schedule' | 'in_call'

  // Instant Meeting States
  const [isInstantNoticeModalOpen, setIsInstantNoticeModalOpen] = useState(false);
  const [isInstantMode, setIsInstantMode] = useState(false);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);

  // Reschedule / Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedMeetingMode, setSelectedMeetingMode] = useState("Online Meeting"); // "Online Meeting" | "In-Person Meeting"
  const [inPersonVenueType, setInPersonVenueType] = useState("office"); // "office" | "site" | "cafe"
  const [cafeVenueName, setCafeVenueName] = useState("Starbucks — WalterMart Plaridel");
  const [preferredDate, setPreferredDate] = useState("2026-10-15");
  const [preferredSlot, setPreferredSlot] = useState("10:00 AM - 11:30 AM PHT");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Copied State
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false);

  // Live timer tick every 10 seconds to dynamically check room unlocking (15m) and ongoing state
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const primaryInquiry = inquiries?.[0];
  const roomCode = meetingRoom?.room_code || "mcpa-meet-7ecea339";

  // Active / Upcoming Meeting info derived from project / inquiry / defaults
  const [activeMeetingInfo, setActiveMeetingInfo] = useState({
    mode: primaryInquiry?.meeting_mode || primaryInquiry?.meetingMode || "Online Meeting",
    date: primaryInquiry?.meeting_date || primaryInquiry?.meetingDate || "2026-10-22",
    time: primaryInquiry?.meeting_time || primaryInquiry?.meetingTime || "02:00 PM - 03:30 PM PHT",
    status: primaryInquiry?.availability_status || "Scheduled",
    leadConsultant: "Engr. Raymart Quirante",
    leadRole: "Lead Project Engineer & Consultant",
    officeAddress: "MCPA Tabang Central Office, MacArthur Highway, Plaridel, Bulacan",
    agenda: primaryInquiry?.meeting_notes || "Discussion regarding your project requirements, house design preferences, and estimated construction budget.",
    round: 1,
    roundTitle: "Project Consultation & Discussion",
    attendanceConfirmed: Boolean(
      primaryInquiry?.availability_status === "Attendance Confirmed" ||
      primaryInquiry?.availabilityStatus === "Attendance Confirmed"
    ),
    history: [],
  });

  // Calculate authoritative lifecycle state (12h/6h check, 15m room unlock, ongoing state)
  const lifecycle = getMeetingLifecycleState(activeMeetingInfo, currentTime);

  // Check URL query param ?confirm_attendance=true
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("confirm_attendance") === "true") {
        handleConfirmAttendance();
      }
    }
  }, []);

  // Synchronize meeting updates from Admin in real-time
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mcpa_shared_meeting_schedule");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date) {
          setActiveMeetingInfo((prev) => ({
            ...prev,
            mode: parsed.mode || prev.mode,
            date: parsed.date || prev.date,
            time: parsed.time || prev.time,
            status: parsed.status || prev.status,
            agenda: parsed.agenda || prev.agenda,
            round: parsed.round || prev.round,
            roundTitle: parsed.roundTitle || prev.roundTitle,
            attendanceConfirmed: parsed.attendanceConfirmed !== undefined ? parsed.attendanceConfirmed : prev.attendanceConfirmed,
            history: parsed.history || prev.history,
            outcome: parsed.outcome || prev.outcome,
          }));
        }
      }
    } catch (e) {}

    const handleSync = (e) => {
      const data = e.detail;
      if (data) {
        setActiveMeetingInfo((prev) => ({
          ...prev,
          mode: data.mode || prev.mode,
          date: data.date || prev.date,
          time: data.time || prev.time,
          status: data.status || prev.status,
          agenda: data.agenda || prev.agenda,
          round: data.round || prev.round,
          roundTitle: data.roundTitle || prev.roundTitle,
          attendanceConfirmed: data.attendanceConfirmed !== undefined ? data.attendanceConfirmed : prev.attendanceConfirmed,
          history: data.history || prev.history,
          outcome: data.outcome || prev.outcome,
        }));
        if (data.updatedBy === "admin") {
          showToast("Your consultation schedule was updated by the MCPA Engineering team.");
        }
      }
    };

    window.addEventListener("mcpa-meeting-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("mcpa-meeting-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [showToast]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopiedCode(true);
    showToast("Meeting code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmAttendance = async () => {
    setIsConfirmingAttendance(true);
    try {
      const targetId = primaryInquiry?.submission_id || primaryInquiry?.id || activeProject?.project_code || "1";
      const payload = {
        ...activeMeetingInfo,
        attendanceConfirmed: true,
        attendanceConfirmedAt: new Date().toISOString(),
        status: "Attendance Confirmed",
        updatedAt: new Date().toISOString(),
        updatedBy: "client",
      };

      setActiveMeetingInfo((prev) => ({
        ...prev,
        attendanceConfirmed: true,
        attendanceConfirmedAt: new Date().toISOString(),
        status: "Attendance Confirmed",
      }));

      try {
        localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: payload }));
      } catch (e) {}

      await fetch(`/api/meetings/${encodeURIComponent(targetId)}/confirm-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceConfirmed: true, confirmedBy: "client" }),
      }).catch(() => {});

      showToast("Attendance confirmed! Looking forward to meeting you.");
    } catch (err) {
      showToast("Failed to confirm attendance: " + err.message);
    } finally {
      setIsConfirmingAttendance(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBooking(true);

    try {
      const isOnline = selectedMeetingMode.toLowerCase().includes("online");
      let calculatedVenue = "Google Meet Secure Room";
      let calculatedMode = isOnline ? "Online Video Call" : "In-Person Consultation";

      if (!isOnline) {
        if (inPersonVenueType === "office") {
          calculatedVenue = "MCPA Construction & Supply Head Office, 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan";
        } else if (inPersonVenueType === "site") {
          calculatedVenue = activeProject?.location
            ? `Proposed Project Site (${activeProject.location})`
            : "Proposed Project Site (On-Site Ocular)";
        } else if (inPersonVenueType === "cafe") {
          calculatedVenue = cafeVenueName.trim() || "Starbucks / Coffee Shop Venue";
        }
      }

      const updatedInfo = {
        mode: calculatedMode,
        venue: calculatedVenue,
        date: preferredDate,
        time: preferredSlot,
        status: "Rescheduled",
        agenda: meetingNotes || activeMeetingInfo.agenda,
      };

      setActiveMeetingInfo((prev) => ({
        ...prev,
        ...updatedInfo,
      }));

      // Broadcast and persist shared schedule for admin side immediate real-time sync
      const payload = {
        ...updatedInfo,
        updatedAt: new Date().toISOString(),
        updatedBy: "client",
      };
      try {
        localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: payload }));
      } catch (e) {}

      // Call backend API to notify admin & persist update to database
      const targetId = primaryInquiry?.submission_id || primaryInquiry?.id || activeProject?.project_code || "1";
      try {
        await fetch(`/api/briefs/${encodeURIComponent(targetId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Meeting Scheduled",
            meetingMode: calculatedMode,
            meetingDate: preferredDate,
            meetingTime: preferredSlot,
            meetingLink: isOnline ? (meetingRoom?.room_code ? `https://meet.google.com/${meetingRoom.room_code}` : "https://meet.google.com/mcpa-meet-7ecea339") : calculatedVenue,
            meetingNotes: meetingNotes,
            isRescheduled: true,
            rescheduleReason: "Client Adjustment Request",
            updatedByClient: true,
          }),
        });
      } catch (apiErr) {
        // Safe offline fallback
      }

      setIsBookingModalOpen(false);
      showToast(`Meeting setup updated: ${calculatedMode} (${calculatedVenue}) on ${preferredDate} (${preferredSlot}) — Admin notified!`);
    } catch (err) {
      showToast("Failed to update schedule: " + err.message);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleJoinCall = () => {
    setIsInstantMode(false);
    setViewState("in_call");
  };

  const handleStartInstantMeeting = () => {
    setIsInstantNoticeModalOpen(false);
    setIsInstantMode(true);

    const instantRoomCode = `mcpa-instant-${roomCode || "meet"}`;
    const clientAvatar =
      currentUser?.avatar_url ||
      currentUser?.avatarUrl ||
      currentUser?.photoURL ||
      activeProject?.client_avatar ||
      activeProject?.avatar_url ||
      "";

    const clientPhone =
      currentUser?.phone ||
      currentUser?.phoneNumber ||
      activeProject?.client_phone ||
      "";

    const instantCallPayload = {
      active: true,
      roomCode: instantRoomCode,
      clientName: currentUser?.name || currentUser?.fullName || activeProject?.client_name || "Valued Client",
      clientEmail: currentUser?.email || activeProject?.client_email || "",
      clientAvatar,
      clientPhone,
      projectCode: activeProject?.project_code || "MCPA-2026-MQ04B",
      projectTitle: activeProject?.project_title || "Residential Consultation",
      startedAt: Date.now(),
      answered: false,
      adminJoined: false,
    };

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([150, 100, 150]);
      }
      localStorage.setItem("mcpa_instant_call_active", JSON.stringify(instantCallPayload));
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-alert", { detail: instantCallPayload }));
      const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"], reconnectionAttempts: 5 });
      socket.on("connect", () => {
        socket.emit("instant-call-start", instantCallPayload);
      });
      socket.emit("instant-call-start", instantCallPayload);
      setTimeout(() => socket.disconnect(), 5000);
    } catch (e) {}

    setViewState("in_call");
    showToast("Connecting to Instant Consultation Room...");
  };

  const isOnlineMode = activeMeetingInfo.mode.toLowerCase().includes("online");

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* 1. TOP HEADER: MEETING HUB TITLE & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Consultation &amp; Meeting Schedule</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
            Client Appointments Hub
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage your face-to-face appointments and online video engineering sessions for{" "}
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
              {activeProject?.project_code || "MCPA-2026-MQ04B"}
            </span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="px-4 py-2 rounded-[4px] bg-white dark:bg-[#15171e] hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-white/10 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reschedule / Change Setup</span>
          </button>

          {isOnlineMode && (
            <button
              type="button"
              onClick={() => setIsInstantNoticeModalOpen(true)}
              className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 text-neutral-950 fill-neutral-950" />
              <span>Instant Online Meeting</span>
            </button>
          )}

          {isOnlineMode ? (
            (lifecycle.isRoomUnlocked || lifecycle.isOngoing) && (
              <button
                type="button"
                onClick={handleJoinCall}
                className="px-5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-transform hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>Join Online Meeting</span>
              </button>
            )
          ) : (
            <a
              href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-[4px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>View Venue &amp; Directions</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. ATTENDANCE CONFIRMATION BANNER (12h for F2F, 6h for Online) */}
      {lifecycle.needsConfirmation && !activeMeetingInfo.attendanceConfirmed && (
        <div className="p-4 sm:p-5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                  Pre-Meeting Attendance Confirmation Required
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {lifecycle.isF2F ? "12h Window" : "6h Window"}
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans mt-1 leading-relaxed">
                {lifecycle.isF2F
                  ? "Your face-to-face consultation is scheduled within 12 hours. Please confirm your physical attendance so our lead engineer and conference lounge remain exclusively reserved for you."
                  : "Your online video consultation is scheduled within 6 hours. Please confirm your attendance so our engineering team can finalize your architectural presentation and 3D preview."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmAttendance}
            disabled={isConfirmingAttendance}
            className="px-5 py-2.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-transform hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            {isConfirmingAttendance ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirm My Attendance</span>
          </button>
        </div>
      )}

      {/* 3. FEATURED APPOINTMENT CARD (HERO CARD - CLEAN SCHEDULE INFO) */}
      <div className="relative overflow-hidden rounded-[12px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-xl transition-all">
        <div className="p-6 space-y-6">
          {/* Header Row: Mode Pill, Dynamic Status Pill, Scheduled Time */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isOnlineMode
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {isOnlineMode ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                <span>{activeMeetingInfo.mode}</span>
              </span>

              {/* LIVE ONGOING INDICATOR */}
              {lifecycle.isOngoing ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
                  <span>ONGOING MEETING SESSION</span>
                </span>
              ) : lifecycle.isRoomUnlocked ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ROOM READY (LIVE)</span>
                </span>
              ) : activeMeetingInfo.attendanceConfirmed ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>ATTENDANCE CONFIRMED</span>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  {lifecycle.statusLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {activeMeetingInfo.date} · {activeMeetingInfo.time}
              </span>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 cols: Meeting Spec & Venue / Room */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400 font-bold">
                  CONSULTATION
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  {(activeMeetingInfo.roundTitle || activeMeetingInfo.agendaTitle || "Project Consultation")
                    .replace(/^1st\s+/i, "")
                    .replace(/Technical & Architectural Alignment/i, "Project Consultation")
                    .replace(/Round\s+\d+\s*·\s*/i, "")}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans mt-1 leading-relaxed">
                  {activeMeetingInfo.agenda && !activeMeetingInfo.agenda.includes("Soil Survey")
                    ? activeMeetingInfo.agenda
                    : "Discussion regarding your project requirements, house design preferences, and estimated construction budget."}
                </p>
              </div>

              {/* CONDITIONAL FORMAT: ONLINE VS FACE-TO-FACE */}
              {isOnlineMode ? (
                /* Online Meeting Details: ONLY visible when room is unlocked (<15m prior or ongoing) */
                (lifecycle.isRoomUnlocked || lifecycle.isOngoing) ? (
                  <div className="p-4 rounded-[8px] bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        <span>Google Meet Secure Room Code</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {roomCode}
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                        ● Room Live &amp; Ready to Enter
                      </span>
                    </div>
                  </div>
                ) : null
              ) : (
                /* Face-to-Face Meeting Details */
                <div className="p-4 rounded-[8px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>Physical Meeting Venue &amp; Facility</span>
                    </span>
                    <a
                      href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs font-sans space-y-1">
                      <p className="font-bold text-neutral-900 dark:text-white">
                        {activeMeetingInfo.officeAddress}
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                        Engineering Conference Hall (Room 2B) · Free client parking area at central front entrance.
                      </p>
                    </div>
                  </div>

                  {/* Documents checklist reminder for F2F */}
                  <div className="pt-2 border-t border-emerald-500/15 flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">Suggested to Bring:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10">Lot TCT / Tax Dec Copy</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10">Lot Survey Plan</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10">Room &amp; Floor Wishlist</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 cols: Consultant Card */}
            <div className="lg:col-span-5 p-5 rounded-[10px] bg-neutral-50 dark:bg-[#14161e] border border-neutral-200 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-base shadow-xs">
                  RQ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {activeMeetingInfo.leadConsultant}
                  </h4>
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {activeMeetingInfo.leadRole}
                  </p>
                </div>
              </div>

              {/* Action button: ONLY shows if room is unlocked (<15m prior or ongoing) or prompt for Instant Meeting */}
              {isOnlineMode ? (
                (lifecycle.isRoomUnlocked || lifecycle.isOngoing) ? (
                  <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={handleJoinCall}
                      className="w-full py-2.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <Video className="w-4 h-4" />
                      <span>Enter Video Consultation Room</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2">
                    <div className="p-2.5 rounded-[6px] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Video Room Locked</span>
                      </span>
                      <span className="text-[11px] font-sans">Opens 15 mins before schedule</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2">
                  <div className="p-2.5 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {activeMeetingInfo.attendanceConfirmed
                        ? "Physical attendance confirmed. Please arrive 10 minutes before schedule."
                        : "In-person slot reserved. Please confirm attendance before your visit."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ENGINEERING COORDINATION & HELPDESK (FULL-WIDTH CLEAN MINIMALIST CARD) */}
      <div className="p-5 rounded-[12px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">
              MCPA Engineering Coordination Desk
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed max-w-xl">
            Need pre-meeting inquiries, lot elevation clarifications, or urgent coordination? Reach our central desk directly:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-800 dark:text-neutral-200 shrink-0">
          <a
            href="tel:+639178392011"
            className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/10 border border-neutral-200 dark:border-white/5 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-amber-500" />
            <span>+63 917 839 2011</span>
          </a>
          <a
            href="mailto:consultations@mcpaconstruction.com"
            className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/10 border border-neutral-200 dark:border-white/5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            <span>consultations@mcpaconstruction.com</span>
          </a>
        </div>
      </div>

      {/* 4. MODAL: RESCHEDULE / REQUEST NEW MEETING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white">
                  Reschedule / Change Meeting Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Meeting Mode Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Preferred Meeting Format *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMeetingMode("Online Video Call")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedMeetingMode.toLowerCase().includes("online")
                        ? "border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedMeetingMode.toLowerCase().includes("online") ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/5"}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Online Video Call</div>
                      <div className="text-[10px] text-neutral-500 font-sans">Google Meet Secure Room</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMeetingMode("In-Person Meeting")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      !selectedMeetingMode.toLowerCase().includes("online")
                        ? "border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${!selectedMeetingMode.toLowerCase().includes("online") ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/5"}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">In-Person Meeting</div>
                      <div className="text-[10px] text-neutral-500 font-sans">Office, Site, or Coffee Shop</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* In-Person Venue Selection (If In-Person is selected) */}
              {!selectedMeetingMode.toLowerCase().includes("online") && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      <span>Select In-Person Meeting Venue *</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                      {inPersonVenueType === "office" ? "Office HQ" : inPersonVenueType === "site" ? "Proposed Project Site" : "Coffee Shop / Venue"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Office */}
                    <button
                      type="button"
                      onClick={() => setInPersonVenueType("office")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        inPersonVenueType === "office"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenueType === "office" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">Visit MCPA Office</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Plaridel, Bulacan Head Office
                      </span>
                    </button>

                    {/* 2. On-Site */}
                    <button
                      type="button"
                      onClick={() => setInPersonVenueType("site")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        inPersonVenueType === "site"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenueType === "site" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">Proposed Project Site</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        On-site ocular at lot
                      </span>
                    </button>

                    {/* 3. Coffee Shop */}
                    <button
                      type="button"
                      onClick={() => setInPersonVenueType("cafe")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        inPersonVenueType === "cafe"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenueType === "cafe" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
                          <Coffee className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">Coffee Shop / Venue</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Starbucks, fast food, mall in PH
                      </span>
                    </button>
                  </div>

                  {/* Sub-details: Office HQ */}
                  {inPersonVenueType === "office" && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                            Official Headquarters Address:
                          </span>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5">
                            MCPA Construction &amp; Supply Head Office
                          </p>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono mt-0.5">
                            2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
                          </p>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            (Near Tabang Tollway Exit &amp; WalterMart Plaridel • Private Client Parking Available)
                          </span>
                        </div>
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=MCPA+Construction+and+Supply+Tabang+Plaridel+Bulacan"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Sub-details: Proposed Project Site */}
                  {inPersonVenueType === "site" && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                            Proposed Construction Lot Address:
                          </span>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{activeProject?.location || "Proposed Project Site (On-Site Ocular)"}</span>
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-1 italic">
                            * Our architectural and engineering team will meet you directly at your property for preliminary ocular and terrain inspection.
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeProject?.location || "Bulacan")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Sub-details: Coffee Shop / Venue with Searchable VenueCombobox */}
                  {inPersonVenueType === "cafe" && (
                    <div className="pt-1">
                      <VenueCombobox
                        value={cafeVenueName}
                        onChange={(venue) => setCafeVenueName(venue)}
                        onClear={() => setCafeVenueName("")}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Preferred Time Slot */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Time Slot *
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="09:00 AM - 10:30 AM PHT">09:00 AM - 10:30 AM PHT (Morning Slot)</option>
                  <option value="10:00 AM - 11:30 AM PHT">10:00 AM - 11:30 AM PHT (Standard Slot)</option>
                  <option value="02:00 PM - 03:30 PM PHT">02:00 PM - 03:30 PM PHT (Afternoon Slot)</option>
                  <option value="04:00 PM - 05:30 PM PHT">04:00 PM - 05:30 PM PHT (Late Afternoon)</option>
                </select>
              </div>

              {/* Meeting Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Discussion Agenda or Specific Requests
                </label>
                <textarea
                  rows={3}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="e.g. Please prepare 3D exterior concepts and cost breakdown for 3-bedroom layout."
                  className="w-full px-3.5 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-sans focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="px-5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {isSubmittingBooking ? "Saving..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. INSTANT MEETING ADVISORY / INFO MODAL */}
      {isInstantNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[14px] bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-neutral-900 dark:text-white">
            {/* Header: Clean, No Background Gradient, No Icon Background Box */}
            <div className="p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                    Instant Online Consultation
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                    Direct On-Demand Video Meeting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInstantNoticeModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content / Info Notice: English Only, No Background Boxes on Icons or Texts */}
            <div className="p-6 space-y-4 text-xs font-sans divide-y divide-neutral-100 dark:divide-white/5">
              {/* Notice 1: Admin Availability warning */}
              <div className="pt-0 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900 dark:text-white font-mono text-[11px] uppercase tracking-wide">
                    Architect &amp; Admin Availability:
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                    If all architects and engineers are currently in off-site ocular inspections or with other clients, your instant request may not be answered immediately.
                  </p>
                </div>
              </div>

              {/* Notice 2: 3-Minute Auto-End Timer */}
              <div className="pt-4 flex items-start gap-3">
                <Clock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900 dark:text-white font-mono text-[11px] uppercase tracking-wide">
                    3-Minute Auto-End Waiting Policy:
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                    The waiting room will automatically disconnect after <span className="font-bold font-mono text-sky-600 dark:text-sky-400">3 minutes</span> if no admin responds. This prevents prolonged waiting, allowing you to select a scheduled appointment slot instead.
                  </p>
                </div>
              </div>

              {/* Requirement: Camera & Mic */}
              <div className="pt-4 flex items-start gap-3 text-neutral-500 dark:text-neutral-400">
                <Video className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900 dark:text-white font-mono text-[11px] uppercase tracking-wide">
                    Device Permissions:
                  </p>
                  <p className="leading-relaxed font-sans">
                    Please ensure your browser has granted camera and microphone access before joining the video room.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons: Clean, No Background Container */}
            <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsInstantNoticeModalOpen(false)}
                className="px-4 py-2.5 rounded-[6px] text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel / Keep Schedule
              </button>
              <button
                type="button"
                onClick={handleStartInstantMeeting}
                className="px-5 py-2.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-101 active:scale-99"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Proceed to Instant Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. INSTANT MEETING 3-MINUTE TIMEOUT NOTICE MODAL */}
      {isTimeoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[14px] bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-neutral-900 dark:text-white">
            {/* Header: Clean, No Background Color, No Icon Box */}
            <div className="p-5 border-b border-neutral-200 dark:border-white/10 flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                  No Admin Available (3 Mins)
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                  Instant Consultation Auto-Ended
                </p>
              </div>
            </div>

            {/* Body: English Only, No Background Boxes */}
            <div className="p-6 space-y-4 text-xs font-sans leading-relaxed text-neutral-600 dark:text-neutral-400">
              <p>
                We apologize for the wait. Our architects and engineers are currently engaged in active site inspections or client consultations and could not answer your instant call at this time.
              </p>
              <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-1">
                <p className="font-bold font-mono text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recommended Next Step:</span>
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                  Please pick a scheduled appointment slot so our lead engineer can reserve dedicated time to review your architectural plans and 3D design preview.
                </p>
              </div>
            </div>

            {/* Footer Buttons: Clean, No Background Container */}
            <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTimeoutModalOpen(false)}
                className="px-4 py-2.5 rounded-[6px] text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimeoutModalOpen(false);
                  setIsBookingModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-101 active:scale-99"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Pick Appointment Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ACTIVE GOOGLE MEET CALL (FULLSCREEN PORTAL OR FLOATING MINI-WINDOW) */}
      {viewState === "in_call" && (
        <GoogleMeetRoom
          roomCode={isInstantMode ? `mcpa-instant-${roomCode || "meet"}` : roomCode}
          currentUser={currentUser}
          activeProject={activeProject}
          isInstantMeeting={isInstantMode}
          onLeave={() => {
            const currentRoomCode = isInstantMode ? `mcpa-instant-${roomCode || "meet"}` : roomCode;
            setViewState("schedule");
            setIsInstantMode(false);
            try {
              localStorage.removeItem("mcpa_instant_call_active");
              sessionStorage.setItem("mcpa_dismissed_instant_call", currentRoomCode || "all");
              sessionStorage.setItem("mcpa_call_recently_left", String(Date.now()));
              window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode: currentRoomCode } }));
              const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"] });
              socket.on("connect", () => {
                socket.emit("instant-call-ended", { roomCode: currentRoomCode });
                setTimeout(() => socket.disconnect(), 1000);
              });
            } catch (e) {}
            showToast("You left the consultation meeting.");
          }}
          onAutoEndTimeout={() => {
            const currentRoomCode = isInstantMode ? `mcpa-instant-${roomCode || "meet"}` : roomCode;
            setViewState("schedule");
            setIsInstantMode(false);
            try {
              localStorage.removeItem("mcpa_instant_call_active");
              sessionStorage.setItem("mcpa_dismissed_instant_call", currentRoomCode);
              window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode: currentRoomCode } }));
              const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"] });
              socket.emit("instant-call-ended", { roomCode: currentRoomCode });
              setTimeout(() => socket.disconnect(), 2000);
            } catch (e) {}
            setIsTimeoutModalOpen(true);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
