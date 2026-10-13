"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  CalendarCheck,
  Video,
  Building,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  X,
  Copy,
  User,
  FolderKanban,
  FileText,
  Shield,
  Sparkles,
  Users,
  Check,
  Award,
  Layers,
  ArrowRight,
  Building2,
  Coffee,
  LayoutGrid,
  List,
  XCircle,
  Zap,
  Archive,
  RotateCcw,
} from "lucide-react";
import GoogleMeetRoom from "@/modules/portal/components/GoogleMeetRoom";
import { getMeetingLifecycleState } from "@/modules/portal/utils/meetingTiming";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";
import { GoogleIcon } from "@/modules/shared/Icons";
import VenueCombobox from "@/modules/book/components/VenueCombobox";
import MeetingFilterCombobox from "@/modules/admin/components/MeetingFilterCombobox";

function ClientAvatarWithFallback({ item, clientBriefs }) {
  const matchingBrief = useMemo(() => {
    if (!Array.isArray(clientBriefs)) return null;
    return clientBriefs.find((b) =>
      (b.clientEmail && item.clientEmail && b.clientEmail.toLowerCase() === item.clientEmail.toLowerCase()) ||
      (b.id && (b.id === item.id || b.id === item.briefId)) ||
      (b.trackingId && (b.trackingId === item.projectCode || b.trackingId === item.id))
    );
  }, [clientBriefs, item]);

  const clientAvatar = resolveClientAvatar(matchingBrief || item);
  const isGoogle =
    item.authProvider === "google" ||
    matchingBrief?.authProvider === "google" ||
    matchingBrief?.auth_provider === "google" ||
    item.clientEmail?.toLowerCase().endsWith("@gmail.com") ||
    (clientAvatar && clientAvatar.includes("googleusercontent"));

  return (
    <div className="relative shrink-0">
      {clientAvatar ? (
        <img
          src={clientAvatar}
          alt={item.clientName || "Client"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-xs"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.parentElement?.querySelector(".meeting-avatar-fallback");
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <div
        style={{ display: clientAvatar ? "none" : "flex" }}
        className="meeting-avatar-fallback w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-white/[0.08] dark:to-white/[0.02] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-bold items-center justify-center font-mono text-sm shrink-0 shadow-xs uppercase"
      >
        {item.clientName?.charAt(0) || "?"}
      </div>

      {isGoogle && (
        <span
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs"
          title="Google Account Verified"
        >
          <GoogleIcon className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
}

export default function AdminMeetingsTab({
  clientBriefs = [],
  currentUser,
  showToast = () => {},
}) {
  const stableAdminUser = useMemo(
    () => currentUser || { name: "Engr. Raymart Quirante", role: "SUPER ADMIN" },
    [currentUser?.id, currentUser?.name, currentUser?.role]
  );

  // View State: 'list' vs 'in_call'
  const [activeCallRoom, setActiveCallRoom] = useState(null); // null | { roomCode, clientName, projectTitle }

  // Display Mode: 'table' vs 'grid'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'today' | 'upcoming' | 'online' | 'f2f' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");

  // Live timer tick every 10 seconds for real-time status and ongoing meeting detection
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Live Instant Meeting Incoming Call Alert State & Dismiss Tracking
  const [incomingInstantCall, setIncomingInstantCall] = useState(null);
  const [instantCallSecondsLeft, setInstantCallSecondsLeft] = useState(180);

  // Dynamic live countdown tick
  useEffect(() => {
    if (!incomingInstantCall) return;
    const updateCountdown = () => {
      const startedAt = incomingInstantCall.startedAt || Date.now();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setInstantCallSecondsLeft(remaining);
      if (remaining <= 0) {
        setIncomingInstantCall(null);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [incomingInstantCall]);

  useEffect(() => {
    const checkInstantCall = () => {
      try {
        const recentlyLeft = sessionStorage.getItem("mcpa_call_recently_left");
        if (recentlyLeft && Date.now() - Number(recentlyLeft) < 60000) {
          setIncomingInstantCall(null);
          return;
        }

        const stored = localStorage.getItem("mcpa_instant_call_active");
        let dismissed = null;
        try {
          dismissed = sessionStorage.getItem("mcpa_dismissed_instant_call");
        } catch (e) {}

        if (stored) {
          const parsed = JSON.parse(stored);
          const isExpired = parsed.startedAt && Date.now() - parsed.startedAt > 180000;
          if (dismissed && (dismissed === parsed.roomCode || dismissed === "all")) {
            setIncomingInstantCall(null);
            return;
          }
          if (parsed && parsed.active && parsed.answered && parsed.adminJoined && !isExpired) {
            setActiveCallRoom({
              roomCode: parsed.roomCode,
              clientName: parsed.clientName,
              projectTitle: parsed.projectTitle || "Instant Video Consultation",
              projectCode: parsed.projectCode || "MCPA-INSTANT",
            });
            setIncomingInstantCall(null);
            return;
          }
          if (parsed && parsed.active && !parsed.answered && !isExpired) {
            setIncomingInstantCall(parsed);
            return;
          }
        }
        setIncomingInstantCall(null);
      } catch (e) {}
    };

    checkInstantCall();

    const handleInstantAlert = (e) => {
      if (e.detail && e.detail.active) {
        const recentlyLeft = sessionStorage.getItem("mcpa_call_recently_left");
        if (recentlyLeft && Date.now() - Number(recentlyLeft) < 60000) {
          return;
        }

        let dismissed = null;
        try {
          dismissed = sessionStorage.getItem("mcpa_dismissed_instant_call");
        } catch (e) {}
        if (dismissed && (dismissed === e.detail.roomCode || dismissed === "all")) {
          return;
        }

        if (e.detail.answered && e.detail.adminJoined) {
          setActiveCallRoom({
            roomCode: e.detail.roomCode,
            clientName: e.detail.clientName,
            projectTitle: e.detail.projectTitle || "Instant Video Consultation",
            projectCode: e.detail.projectCode || "MCPA-INSTANT",
          });
          setIncomingInstantCall(null);
          return;
        }
        setIncomingInstantCall(e.detail);
        showToast(`🔔 Incoming Instant Video Consultation from ${e.detail.clientName || "Client"}!`);
      }
    };

    const handleInstantEnd = (e) => {
      setActiveCallRoom(null);
      setIncomingInstantCall(null);
      try {
        localStorage.removeItem("mcpa_instant_call_active");
        sessionStorage.setItem("mcpa_dismissed_instant_call", e?.detail?.roomCode || "all");
        sessionStorage.setItem("mcpa_call_recently_left", String(Date.now()));
      } catch (e) {}
    };

    window.addEventListener("mcpa-instant-call-alert", handleInstantAlert);
    window.addEventListener("mcpa-instant-call-ended", handleInstantEnd);
    window.addEventListener("storage", checkInstantCall);

    return () => {
      window.removeEventListener("mcpa-instant-call-alert", handleInstantAlert);
      window.removeEventListener("mcpa-instant-call-ended", handleInstantEnd);
      window.removeEventListener("storage", checkInstantCall);
    };
  }, [showToast]);

  // Reschedule Modal State
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("10:00 AM - 11:30 AM PHT");
  const [newMode, setNewMode] = useState("Online Video Call");
  const [newVenueType, setNewVenueType] = useState("office"); // "office" | "site" | "cafe"
  const [newCafeName, setNewCafeName] = useState("Starbucks — WalterMart Plaridel");
  const [newVenue, setNewVenue] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("Architectural Schedule Alignment");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Meeting Outcome & Next Steps Modal State
  const [outcomeMeeting, setOutcomeMeeting] = useState(null);
  const [outcomeType, setOutcomeType] = useState("NEXT_MEETING"); // 'NEXT_MEETING' | 'AGREED_ADVANCE' | 'REVISION_DELIBERATION' | 'DISCONTINUED_REJECTED'
  const [outcomeMinutes, setOutcomeMinutes] = useState("");
  const [discontinueReason, setDiscontinueReason] = useState("Budget / Financial Alignment Mismatch");
  const [nextRoundDate, setNextRoundDate] = useState("2026-10-22");
  const [nextRoundSlot, setNextRoundSlot] = useState("02:00 PM - 03:30 PM PHT");
  const [nextRoundMode, setNextRoundMode] = useState("Online Video Call");
  const [nextRoundAgenda, setNextRoundAgenda] = useState("2nd Blueprint & BOQ Estimate Review");
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false);
  const [isSendingReminderId, setIsSendingReminderId] = useState(null);

  // Synchronize meeting updates from Client Portal in real-time
  useEffect(() => {
    const handleMeetingSync = (e) => {
      const syncData = e.detail || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("mcpa_shared_meeting_schedule") || "null"));
      if (syncData && syncData.updatedBy === "client") {
        setMeetingsList((prev) =>
          prev.map((m) =>
            m.id === "meet-1" || m.clientEmail === "martquirante@gmail.com" || (syncData.clientEmail && m.clientEmail === syncData.clientEmail)
              ? {
                  ...m,
                  mode: syncData.mode || m.mode,
                  date: syncData.date || m.date,
                  displayDate: syncData.date || m.displayDate,
                  time: syncData.time || m.time,
                  status: syncData.outcome === "DISCONTINUED_REJECTED" ? "Withdrawn by Client" : (syncData.status || "Client Rescheduled"),
                  notes: syncData.agenda ? `[Client Adjustment]: ${syncData.agenda}` : (syncData.reason ? `[Client Withdrawn]: ${syncData.reason}` : m.notes),
                }
              : m
          )
        );
      }
    };

    window.addEventListener("mcpa-meeting-updated", handleMeetingSync);
    window.addEventListener("storage", handleMeetingSync);
    return () => {
      window.removeEventListener("mcpa-meeting-updated", handleMeetingSync);
      window.removeEventListener("storage", handleMeetingSync);
    };
  }, []);

  // Synthesize rich meetings list from client briefs & active project records
  const initialMeetings = useMemo(() => {
    // Default base consultations for Raymart and other inquiries
    const baseList = [
      {
        id: "meet-1",
        clientName: "Raymart Quirante",
        clientEmail: "martquirante@gmail.com",
        clientPhone: "+63 917 839 2011",
        projectCode: "MCPA-2026-MQ04B",
        projectTitle: "Modern Tropical Residence (Raymart Quirante)",
        roomCode: "mcpa-meet-7ecea339",
        mode: "Online Video Call",
        date: "2026-10-15",
        displayDate: "Thu, Oct 15, 2026",
        time: "10:00 AM - 11:30 AM PHT",
        status: "Room Ready",
        leadConsultant: "Engr. Raymart Quirante",
        venue: "MCPA Secure Video Room",
        notes: "Lot boundary review, TCT documentation check, and initial structural steel requirements.",
        isToday: true,
      },
    ];

    // Merge any clientBriefs that have meeting data
    if (Array.isArray(clientBriefs) && clientBriefs.length > 0) {
      clientBriefs.forEach((b, idx) => {
        const clientEmail = (b.clientEmail || b.client_email || "").toLowerCase();
        if (clientEmail === "martquirante@gmail.com" || clientEmail === "martquirante04@gmail.com") {
          if (b.meetingDate || b.meeting_date) {
            baseList[0].date = b.meetingDate || b.meeting_date;
            baseList[0].displayDate = b.meetingDate || b.meeting_date;
            if (b.meetingTime || b.meeting_time) baseList[0].time = b.meetingTime || b.meeting_time;
            if (b.meetingMode || b.meeting_mode) baseList[0].mode = b.meetingMode || b.meeting_mode;
            if (b.projectType || b.project_type) baseList[0].projectTitle = b.projectType || b.project_type;
            const cleanCode = b.trackingId || b.submissionId || b.submission_id || b.projectCode || (b.id && isNaN(Number(b.id)) ? b.id : "MCPA-2026-MQ04B");
            baseList[0].projectCode = cleanCode;
          }
          return;
        }
        if (b.meetingDate || b.meeting_date) {
          const briefCode = b.trackingId || b.submissionId || b.submission_id || b.projectCode || (b.id && isNaN(Number(b.id)) ? b.id : `INQ-2026-0${idx + 1}`);
          baseList.push({
            id: `brief-meet-${b.id || idx}`,
            clientName: b.clientName || b.client_name || "Prospective Client",
            clientEmail: b.clientEmail || b.client_email || "client@example.com",
            clientPhone: b.clientPhone || b.client_phone || "+63 917 000 0000",
            projectCode: briefCode,
            projectTitle: b.projectType || "Residential Construction Inquiry",
            roomCode: b.meetingRoomCode || `mcpa-meet-${Math.random().toString(36).substring(2, 10)}`,
            mode: b.meetingMode || b.meeting_mode || "Online Video Call",
            date: b.meetingDate || b.meeting_date,
            displayDate: b.meetingDate || b.meeting_date,
            time: b.meetingTime || b.meeting_time || "09:00 AM - 10:30 AM PHT",
            status: "Scheduled",
            leadConsultant: "Engr. Raymart Quirante",
            venue: (b.meetingMode || "").includes("In-Person")
              ? "MCPA Plaridel Central Office"
              : "MCPA Secure Video Room",
            notes: b.meetingNotes || b.meeting_notes || "Initial consultation brief.",
            isToday: false,
          });
        }
      });
    }

    return baseList;
  }, [clientBriefs]);

  const [meetingsList, setMeetingsList] = useState(initialMeetings);

  useEffect(() => {
    setMeetingsList(initialMeetings);
  }, [initialMeetings]);

  // Archived Meetings Tracking (Persisted in localStorage)
  const [archivedMeetingIds, setArchivedMeetingIds] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("mcpa_archived_meeting_ids") || "[]");
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [unarchivedMeetingIds, setUnarchivedMeetingIds] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("mcpa_unarchived_meeting_ids") || "[]");
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const isMeetingArchived = (m) => {
    if (!m) return false;
    // Explicit unarchived override by admin
    if (unarchivedMeetingIds.includes(m.id) || unarchivedMeetingIds.includes(m.projectCode)) return false;
    // Explicit archived by admin
    if (archivedMeetingIds.includes(m.id) || archivedMeetingIds.includes(m.projectCode)) return true;
    const s = (m.status || "").toLowerCase();
    if (
      s.includes("complete") ||
      s.includes("aligned") ||
      s.includes("closed") ||
      s.includes("archived") ||
      s.includes("discontinued") ||
      s.includes("concluded") ||
      s.includes("withdrawn")
    ) {
      return true;
    }
    // Time-based conclusion: if meeting scheduled time has passed, treat as past/concluded
    try {
      const lifecycle = getMeetingLifecycleState(m, currentTime);
      if (lifecycle?.isPast) return true;
    } catch (e) {}

    return false;
  };

  // Metrics (Accurate active count, auto-deducting finished/archived meetings)
  const metrics = useMemo(() => {
    const activeList = meetingsList.filter((m) => !isMeetingArchived(m));
    const archivedList = meetingsList.filter((m) => isMeetingArchived(m));
    return {
      allTotal: meetingsList.length,
      total: activeList.length,
      archived: archivedList.length,
      today: activeList.filter((m) => m.isToday).length,
      online: activeList.filter((m) => m.mode.toLowerCase().includes("online")).length,
      f2f: activeList.filter((m) => !m.mode.toLowerCase().includes("online")).length,
      confirmed: activeList.filter((m) => m.status === "Confirmed" || m.status === "Room Ready").length,
      upcoming: activeList.filter((m) => m.status !== "Completed").length,
    };
  }, [meetingsList, archivedMeetingIds, unarchivedMeetingIds, currentTime]);

  // Synchronize active meetings count with Navbar Badge in real-time
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mcpa-meetings-count-sync", { detail: { count: metrics.total } })
    );
  }, [metrics.total]);

  // Filtered List
  const filteredMeetings = useMemo(() => {
    return meetingsList.filter((m) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (m.clientName || "").toLowerCase().includes(q) ||
          (m.clientEmail || "").toLowerCase().includes(q) ||
          (m.projectCode || "").toLowerCase().includes(q) ||
          (m.roomCode || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      const isArchived = isMeetingArchived(m);

      // "all_records": show ALL meetings without hiding anything
      if (activeFilter === "all_records") return true;

      // Archive / History tab filter
      if (activeFilter === "archive" || activeFilter === "history") return isArchived;

      // All other views hide archived meetings automatically!
      if (isArchived) return false;

      // Tab filter
      if (activeFilter === "today") return m.isToday;
      if (activeFilter === "online") return (m.mode || "").toLowerCase().includes("online");
      if (activeFilter === "f2f") return !(m.mode || "").toLowerCase().includes("online");
      if (activeFilter === "completed") return m.status === "Completed";
      if (activeFilter === "upcoming") return m.status !== "Completed";

      return true;
    });
  }, [meetingsList, searchQuery, activeFilter, archivedMeetingIds, unarchivedMeetingIds, currentTime]);

  // Manual Archive / Restore toggle handler
  const handleToggleArchive = (meeting) => {
    const isCurrentlyArchived = isMeetingArchived(meeting);
    let nextArchived;
    let nextUnarchived;
    if (isCurrentlyArchived) {
      nextArchived = archivedMeetingIds.filter((id) => id !== meeting.id && id !== meeting.projectCode);
      nextUnarchived = Array.from(new Set([...unarchivedMeetingIds, meeting.id, meeting.projectCode]));
      setMeetingsList((prev) =>
        prev.map((m) =>
          m.id === meeting.id
            ? { ...m, status: "Scheduled", isArchived: false }
            : m
        )
      );
      showToast(`Meeting with ${meeting.clientName} restored to active list.`);
    } else {
      nextArchived = Array.from(new Set([...archivedMeetingIds, meeting.id, meeting.projectCode]));
      nextUnarchived = unarchivedMeetingIds.filter((id) => id !== meeting.id && id !== meeting.projectCode);
      setMeetingsList((prev) =>
        prev.map((m) =>
          m.id === meeting.id
            ? { ...m, status: "Archived / Concluded", isArchived: true }
            : m
        )
      );
      showToast(`Meeting with ${meeting.clientName} automatically moved to Meeting History / Archive.`);
    }
    setArchivedMeetingIds(nextArchived);
    setUnarchivedMeetingIds(nextUnarchived);
    try {
      localStorage.setItem("mcpa_archived_meeting_ids", JSON.stringify(nextArchived));
      localStorage.setItem("mcpa_unarchived_meeting_ids", JSON.stringify(nextUnarchived));
      window.dispatchEvent(
        new CustomEvent("mcpa-meeting-updated", {
          detail: { id: meeting.id, isArchived: !isCurrentlyArchived },
        })
      );
    } catch (e) {}
  };

  // Reschedule & Meeting Setup handler
  const handleOpenReschedule = (meeting) => {
    setRescheduleMeeting(meeting);
    setNewDate(meeting.date || "2026-10-19");
    setNewSlot(meeting.time || "10:00 AM - 11:30 AM PHT");
    const isOnline = (meeting.mode || "").toLowerCase().includes("online");
    setNewMode(isOnline ? "Online Video Call" : "In-Person Consultation");

    const vLower = (meeting.venue || "").toLowerCase();
    if (vLower.includes("starbucks") || vLower.includes("coffee") || vLower.includes("cafe")) {
      setNewVenueType("cafe");
      setNewCafeName(meeting.venue);
    } else if (vLower.includes("site") || vLower.includes("ocular") || vLower.includes("lot")) {
      setNewVenueType("site");
    } else {
      setNewVenueType("office");
    }

    setNewVenue(meeting.venue || (isOnline ? "MCPA Secure Video Room" : "MCPA Plaridel Central Office · Lounge 2B"));
    setRescheduleReason("Architectural Schedule Alignment");
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleMeeting) return;
    setIsSubmittingReschedule(true);

    try {
      const isOnline = newMode.toLowerCase().includes("online");
      let venueFinal = "MCPA Secure Video Room";
      if (!isOnline) {
        if (newVenueType === "office") {
          venueFinal = "MCPA Construction & Supply Head Office, 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan";
        } else if (newVenueType === "site") {
          venueFinal = rescheduleMeeting.projectLocation
            ? `Proposed Project Site (${rescheduleMeeting.projectLocation})`
            : "Proposed Project Site (On-Site Ocular)";
        } else if (newVenueType === "cafe") {
          venueFinal = newCafeName.trim() || "Starbucks / Coffee Shop Venue";
        } else {
          venueFinal = newVenue || "MCPA Construction & Supply Head Office, 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan";
        }
      }

      const updatedItem = {
        ...rescheduleMeeting,
        mode: isOnline ? "Online Video Call" : "In-Person Consultation",
        venue: venueFinal,
        date: newDate,
        displayDate: newDate,
        time: newSlot,
        status: "Rescheduled",
        notes: `[Rescheduled by Admin]: ${rescheduleReason} — ${rescheduleMeeting.notes}`,
      };

      setMeetingsList((prev) =>
        prev.map((m) => (m.id === rescheduleMeeting.id ? updatedItem : m))
      );

      // Save to shared localStorage and dispatch event for live client portal sync
      const payload = {
        mode: newMode,
        date: newDate,
        time: newSlot,
        venue: venueFinal,
        status: "Confirmed",
        agenda: `[Admin Rescheduled]: ${rescheduleReason}`,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      };
      localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: payload }));

      // Dispatch backend update to trigger automated email
      const targetBriefId = rescheduleMeeting.briefId || rescheduleMeeting.projectCode || "1";
      try {
        await fetch(`/api/briefs/${encodeURIComponent(targetBriefId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Meeting Scheduled",
            meetingDate: newDate,
            meetingTime: newSlot,
            meetingMode: newMode,
            meetingLink: isOnline ? (rescheduleMeeting.roomCode ? `https://meet.google.com/${rescheduleMeeting.roomCode}` : "https://meet.google.com/mcp-buil-tab") : venueFinal,
            isRescheduled: true,
            rescheduleReason,
            clientEmail: rescheduleMeeting.clientEmail,
          }),
        });
      } catch (err) {}

      showToast(`Meeting setup updated for ${rescheduleMeeting.clientName}! Automated notification email dispatched.`);
      setRescheduleMeeting(null);
    } catch (err) {
      showToast("Update failed: " + err.message);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleSendReminder = async (meeting) => {
    setIsSendingReminderId(meeting.id);
    try {
      const targetId = meeting.briefId || meeting.projectCode || "1";
      const isF2F = !meeting.mode.toLowerCase().includes("online");
      const res = await fetch(`/api/meetings/${encodeURIComponent(targetId)}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundTitle: meeting.notes || "Project Consultation & Discussion",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Attendance reminder email dispatched to ${meeting.clientEmail} (${isF2F ? "12h F2F" : "6h Online"}).`);
      } else {
        showToast(data.message || "Failed to dispatch reminder email.");
      }
    } catch (err) {
      showToast("Reminder dispatch notice: " + err.message);
    } finally {
      setIsSendingReminderId(null);
    }
  };

  const handleOpenOutcome = (meeting) => {
    setOutcomeMeeting(meeting);
    setOutcomeType("NEXT_MEETING");
    setOutcomeMinutes("");
    setDiscontinueReason("Budget / Financial Alignment Mismatch");
    setNextRoundDate("2026-10-22");
    setNextRoundSlot("02:00 PM - 03:30 PM PHT");
    setNextRoundMode(meeting.mode || "Online Video Call");
    setNextRoundAgenda("Follow-Up Project Consultation & Review");
  };

  const handleConfirmOutcome = async (e) => {
    e.preventDefault();
    if (!outcomeMeeting) return;
    setIsSubmittingOutcome(true);

    try {
      const targetId = outcomeMeeting.briefId || outcomeMeeting.projectCode || "1";
      const currentRound = outcomeMeeting.round || 1;
      const nextRound = currentRound + 1;

      const payload = {
        outcome: outcomeType,
        nextMeetingDate: nextRoundDate,
        nextMeetingTime: nextRoundSlot,
        nextMeetingMode: nextRoundMode,
        nextMeetingAgenda: nextRoundAgenda,
        meetingMinutes: outcomeMinutes,
        round: outcomeType === "NEXT_MEETING" ? nextRound : currentRound,
        roundTitle: outcomeType === "NEXT_MEETING" ? `Round ${nextRound} · ${nextRoundAgenda}` : outcomeMeeting.projectTitle,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
        clientEmail: outcomeMeeting.clientEmail,
      };

      if (outcomeType === "AGREED_ADVANCE") {
        payload.status = "Aligned — Advance to Stage 3";
        payload.outcome = "AGREED_ADVANCE";
      } else if (outcomeType === "NEXT_MEETING") {
        payload.status = "Confirmed";
        payload.date = nextRoundDate;
        payload.time = nextRoundSlot;
        payload.mode = nextRoundMode;
        payload.attendanceConfirmed = false;
      } else if (outcomeType === "DISCONTINUED_REJECTED") {
        payload.status = "Discontinued / Rejected";
        payload.outcome = "DISCONTINUED_REJECTED";
        payload.isRejected = true;
        payload.rejectionReason = discontinueReason;
        payload.rejectionNotes = outcomeMinutes;
      }

      // Sync to shared localStorage for immediate client portal reflection
      localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(payload));

      if (outcomeType === "DISCONTINUED_REJECTED") {
        try {
          const storedBriefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
          const updatedBriefs = storedBriefs.map((b) => {
            const isMatch =
              (b.clientEmail && outcomeMeeting.clientEmail && b.clientEmail.toLowerCase() === outcomeMeeting.clientEmail.toLowerCase()) ||
              b.id === outcomeMeeting.id ||
              b.id === outcomeMeeting.briefId ||
              b.trackingId === outcomeMeeting.projectCode;
            if (isMatch) {
              return {
                ...b,
                status: "Rejected / Declined",
                is_rejected: true,
                rejection_reason: discontinueReason,
                rejection_notes: outcomeMinutes,
              };
            }
            return b;
          });
          localStorage.setItem("mcpa_client_briefs", JSON.stringify(updatedBriefs));

          // Set client dashboard state to PRE_INQUIRY / Phase 1
          localStorage.setItem("mcpa_client_dashboard_state", JSON.stringify({
            success: true,
            hasActiveProject: false,
            hasRejectedInquiry: true,
            stage_id: "PRE_INQUIRY",
            stageLevel: 1,
            stageName: "Pre-Inquiry",
            rejectedBrief: {
              status: "Rejected / Declined",
              rejectionReason: discontinueReason,
              rejectionNotes: outcomeMinutes,
              projectType: outcomeMeeting.projectTitle,
            },
          }));
        } catch (e) {}

        // Backend sync
        await fetch(`/api/client/inquiries/${encodeURIComponent(targetId)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Rejected / Declined",
            rejectionReason: discontinueReason,
            rejectionNotes: outcomeMinutes,
          }),
        }).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: payload }));

      // Call backend API for meeting outcome
      await fetch(`/api/meetings/${encodeURIComponent(targetId)}/record-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // Update local meetings list
      setMeetingsList((prev) =>
        prev.map((m) =>
          m.id === outcomeMeeting.id
            ? {
                ...m,
                status:
                  outcomeType === "AGREED_ADVANCE"
                    ? "Completed / Aligned"
                    : outcomeType === "DISCONTINUED_REJECTED"
                    ? "Discontinued / Closed"
                    : "Follow-Up Scheduled",
                date: outcomeType === "NEXT_MEETING" ? nextRoundDate : m.date,
                time: outcomeType === "NEXT_MEETING" ? nextRoundSlot : m.time,
                mode: outcomeType === "NEXT_MEETING" ? nextRoundMode : m.mode,
                round: outcomeType === "NEXT_MEETING" ? nextRound : m.round,
                notes: outcomeMinutes
                  ? `[${outcomeType === "DISCONTINUED_REJECTED" ? "Discontinued Reason" : "Minutes"}]: ${outcomeType === "DISCONTINUED_REJECTED" ? discontinueReason + " — " : ""}${outcomeMinutes}`
                  : m.notes,
              }
            : m
        )
      );

      if (outcomeType === "AGREED_ADVANCE" || outcomeType === "DISCONTINUED_REJECTED") {
        const nextArchived = Array.from(new Set([...archivedMeetingIds, outcomeMeeting.id, outcomeMeeting.projectCode]));
        setArchivedMeetingIds(nextArchived);
        try {
          localStorage.setItem("mcpa_archived_meeting_ids", JSON.stringify(nextArchived));
        } catch (e) {}
      }

      if (outcomeType === "AGREED_ADVANCE") {
        showToast("Mutual agreement recorded! Consultation automatically moved to Archive (Stage 3).");
      } else if (outcomeType === "NEXT_MEETING") {
        showToast(`Round ${nextRound} Consultation scheduled for ${nextRoundDate} (${nextRoundSlot})! Client notified.`);
      } else if (outcomeType === "DISCONTINUED_REJECTED") {
        showToast("Consultation closed and automatically moved to Archive.");
      } else {
        showToast("Deliberation minutes recorded successfully.");
      }

      setOutcomeMeeting(null);
    } catch (err) {
      showToast("Outcome recording error: " + err.message);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  const handleJoinCallAsHost = (item) => {
    try {
      if (typeof document !== "undefined" && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
    setActiveCallRoom({
      roomCode: item.roomCode,
      clientName: item.clientName,
      projectTitle: item.projectTitle,
      projectCode: item.projectCode,
    });
  };

  const handleAnswerInstantCall = (call) => {
    try {
      if (typeof document !== "undefined" && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    const updated = {
      ...call,
      answered: true,
      adminJoined: true,
      answeredBy: currentUser?.name || "Engr. Raymart Quirante",
    };
    try {
      localStorage.setItem("mcpa_instant_call_active", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-answered", { detail: updated }));
    } catch (e) {}

    setActiveCallRoom({
      roomCode: call.roomCode,
      clientName: call.clientName,
      projectTitle: call.projectTitle || "Instant Video Consultation",
      projectCode: call.projectCode || "MCPA-INSTANT",
    });
    setIncomingInstantCall(null);
    showToast(`Joining Instant Consultation with ${call.clientName || "Client"}...`);
  };

  const handleDismissInstantCall = () => {
    if (incomingInstantCall?.roomCode) {
      try {
        sessionStorage.setItem("mcpa_dismissed_instant_call", incomingInstantCall.roomCode);
      } catch (e) {}
    }
    setIncomingInstantCall(null);
    showToast("Instant call alert dismissed.");
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* 0. INCOMING INSTANT CONSULTATION CALL ALERT BANNER — BESPOKE ARCHITECTURAL DISPATCH HUD */}
      {incomingInstantCall && !incomingInstantCall.answered && (
        <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0d0f14]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-white/[0.08] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7),0_0_35px_rgba(245,158,11,0.07)] p-4 sm:p-5 transition-all animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Top Precision Light Rail */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />
          
          {/* Subtle Ambient Aura */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Bar: Sonar Pulse + Stage + Live Countdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-emerald-600 dark:text-emerald-400">
                Live Consultation Dispatch
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                Phase 2 Architectural Alignment
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold">
                <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "8s" }} />
                <span>
                  Auto-ends in {Math.floor(instantCallSecondsLeft / 60)}:{(instantCallSecondsLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismissInstantCall}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss call alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body: Client Monogram, Project Dossier & Tactile Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3.5">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Client Monogram / Profile Photo Avatar Box */}
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 font-black font-mono text-sm flex items-center justify-center shadow-md shadow-amber-500/20 ring-2 ring-white dark:ring-neutral-800 shrink-0 overflow-hidden">
                {incomingInstantCall.clientAvatar ? (
                  <img
                    src={incomingInstantCall.clientAvatar}
                    alt={incomingInstantCall.clientName || "Client"}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>
                    {(incomingInstantCall.clientName || "C")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-neutral-950 shadow ring-2 ring-white dark:ring-[#0d0f14]">
                  <Video className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Client Info & Meeting Code */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white tracking-tight">
                    {incomingInstantCall.clientName || "Valued Client"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                    Client Waiting In Room
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                  <span>Project:</span>{" "}
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-200">
                    {incomingInstantCall.projectTitle || "Residential Consultation"}
                  </strong>{" "}
                  ·{" "}
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {incomingInstantCall.projectCode || "MCPA-2026-MQ04B"}
                  </span>
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">Room:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(incomingInstantCall.roomCode);
                      showToast("Room code copied to clipboard!");
                    }}
                    className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-[11px] font-mono text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    title="Click to copy room code"
                  >
                    <span>{incomingInstantCall.roomCode}</span>
                    <Copy className="w-3 h-3 text-neutral-400 group-hover:text-amber-500 transition-colors" />
                  </button>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans hidden sm:inline">
                    (Direct Online Call)
                  </span>
                </div>
              </div>
            </div>

            {/* Tactile Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => handleAnswerInstantCall(incomingInstantCall)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Video className="w-4 h-4 fill-current/20" />
                <span>Answer &amp; Join Room</span>
              </button>
              <button
                type="button"
                onClick={handleDismissInstantCall}
                className="px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP STATS BAR - BENTO METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none space-y-1 hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span>Total Consultations</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {metrics.total}
          </div>
          <div className="text-[11px] text-neutral-400 font-sans flex items-center justify-between">
            <span>Active Pipeline</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{metrics.archived} in History</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none space-y-1 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span>Today&apos;s Schedule</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {metrics.today}
          </div>
          <div className="text-[11px] text-neutral-400 font-sans">Immediate sessions required</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none space-y-1 hover:border-sky-500/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span>Online Calls</span>
            <Video className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {metrics.online}
          </div>
          <div className="text-[11px] text-neutral-400 font-sans">Video Conference Rooms</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none space-y-1 hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span>Face-to-Face</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {metrics.f2f}
          </div>
          <div className="text-[11px] text-neutral-400 font-sans">Office &amp; Site Consultations</div>
        </div>
      </div>

      {/* 2. FILTER TABS & SEARCH BAR - POLISHED SEGMENTED CONTROL */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Combobox Filter Selector */}
        <MeetingFilterCombobox
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          metrics={metrics}
          totalCount={metrics.total}
        />

        {/* Search Input & View Toggle Group */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, code, or room..."
              className="w-full pl-8.5 pr-8 py-1.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grid / Table toggle - matching Accounts tab */}
          <div className="inline-flex items-center bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MEETINGS LIST / MASTER DATA GRID */}
      {filteredMeetings.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] text-neutral-400 space-y-2">
          <CalendarCheck className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700 stroke-[1.5]" />
          <p className="text-xs font-mono">
            {activeFilter === "archive" || activeFilter === "history"
              ? "No archived or concluded meetings found in history."
              : activeFilter === "all_records"
              ? "No meeting records found in database."
              : "No meeting schedules found matching criteria."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW: Responsive Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredMeetings.map((item) => {
            const isOnline = item.mode.toLowerCase().includes("online");
            const lifecycle = getMeetingLifecycleState(item, currentTime);
            return (
              <div
                key={item.id}
                className="rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] hover:border-amber-500/40 hover:shadow-md transition-all duration-150 p-4.5 flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Client & Status Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClientAvatarWithFallback item={item} clientBriefs={clientBriefs} />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate tracking-tight">
                          {item.clientName}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                          {item.clientEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {item.projectCode}
                      </span>
                      {isMeetingArchived(item) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-semibold uppercase inline-flex items-center gap-1">
                          <Archive className="w-2.5 h-2.5" />
                          <span>History</span>
                        </span>
                      )}
                      {lifecycle.isOngoing && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono font-bold uppercase animate-pulse inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                          <span>Live</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Title */}
                  <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium line-clamp-1">
                    {item.projectTitle}
                  </div>

                  {/* Schedule Details Box */}
                  <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/[0.04] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{item.displayDate}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{item.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/50 dark:border-white/[0.04]">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isOnline
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isOnline ? <Video className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        <span>{isOnline ? "Online Call" : "In-Person"}</span>
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[170px]" title={item.venue}>
                        {item.venue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isOnline && (lifecycle.isRoomUnlocked || lifecycle.isOngoing) ? (
                      <button
                        type="button"
                        onClick={() => handleJoinCallAsHost(item)}
                        className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Call</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenOutcome(item)}
                        className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-neutral-200 dark:border-white/10 cursor-pointer flex-1"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Outcome</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(item)}
                      className="h-8 px-2.5 rounded-lg bg-white hover:bg-neutral-50 dark:bg-transparent dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-neutral-200 dark:border-white/10 cursor-pointer"
                      title="Reschedule / Change Setup"
                    >
                      <RefreshCw className="w-3 h-3 text-neutral-400" />
                      <span className="hidden xs:inline">Setup</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 border cursor-pointer ${
                        isMeetingArchived(item)
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-white/10"
                      }`}
                      title={isMeetingArchived(item) ? "Restore meeting to active" : "Move to Archive / Concluded"}
                    >
                      {isMeetingArchived(item) ? (
                        <>
                          <RotateCcw className="w-3 h-3 text-amber-500" />
                          <span className="hidden xs:inline">Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3 h-3 text-neutral-400" />
                          <span className="hidden xs:inline">Archive</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(item)}
                      disabled={isSendingReminderId === item.id}
                      className="h-8 w-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                      title="Send pre-meeting attendance reminder email"
                    >
                      {isSendingReminderId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`mailto:${item.clientEmail}`}
                      className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Send direct email to ${item.clientEmail}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW: 12-Column Precision Master Rows */
        <div className="space-y-2.5">
          {/* Desktop Table Column Alignment Header */}
          <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-2 text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold border-b border-neutral-200/70 dark:border-white/[0.06]">
            <div className="col-span-3">Client &amp; Project</div>
            <div className="col-span-2">Consultation Schedule</div>
            <div className="col-span-3">Format &amp; Venue</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          {filteredMeetings.map((item) => {
            const isOnline = item.mode.toLowerCase().includes("online");
            const lifecycle = getMeetingLifecycleState(item, currentTime);
            return (
              <div
                key={item.id}
                className="rounded-xl bg-white dark:bg-[#11131a] border border-neutral-200/80 dark:border-white/[0.06] hover:border-amber-500/40 hover:shadow-md transition-all duration-150 p-4 sm:p-4.5"
              >
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
                  {/* Col 1 (xl:col-span-3): Client & Project Brief */}
                  <div className="xl:col-span-3 flex items-center gap-3.5 min-w-0">
                    <ClientAvatarWithFallback item={item} clientBriefs={clientBriefs} />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate tracking-tight">
                          {item.clientName}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          {item.projectCode}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {item.projectTitle}
                      </p>
                    </div>
                  </div>

                  {/* Col 2 (xl:col-span-2): Schedule & Time */}
                  <div className="xl:col-span-2 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{item.time}</span>
                    </div>
                  </div>

                  {/* Col 3 (xl:col-span-3): Format, Venue & Live Indicator */}
                  <div className="xl:col-span-3 space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isOnline
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isOnline ? <Video className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        <span>{isOnline ? "Online Call" : "In-Person"}</span>
                      </span>

                      {lifecycle.isOngoing && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono font-bold uppercase animate-pulse inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                          <span>Live</span>
                        </span>
                      )}

                      {isMeetingArchived(item) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-semibold uppercase inline-flex items-center gap-1">
                          <Archive className="w-2.5 h-2.5" />
                          <span>History</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[210px]">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="leading-snug break-words line-clamp-2" title={item.venue}>
                        {item.venue}
                      </span>
                    </div>
                  </div>

                  {/* Col 4 (xl:col-span-4): Unified Precision Action Toolbar */}
                  <div className="xl:col-span-4 flex items-center justify-start xl:justify-end gap-1.5 border-t xl:border-t-0 pt-3 xl:pt-0 border-neutral-100 dark:border-white/5">
                    {/* Live Join Button (when unlocked or ongoing) */}
                    {isOnline && (lifecycle.isRoomUnlocked || lifecycle.isOngoing) && (
                      <button
                        type="button"
                        onClick={() => handleJoinCallAsHost(item)}
                        className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        title="Join consultation call as Lead Engineer / Host"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Call</span>
                      </button>
                    )}

                    {/* Record Outcome Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenOutcome(item)}
                      className="h-8 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-neutral-200 dark:border-white/10 cursor-pointer shrink-0"
                      title="Record meeting outcome or schedule follow-up"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Outcome</span>
                    </button>

                    {/* Reschedule Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(item)}
                      className="h-8 px-2.5 rounded-lg bg-white hover:bg-neutral-50 dark:bg-transparent dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-neutral-200 dark:border-white/10 cursor-pointer shrink-0"
                      title="Reschedule date, time, or venue"
                    >
                      <RefreshCw className="w-3 h-3 text-neutral-400" />
                      <span className="hidden sm:inline">Setup</span>
                    </button>

                    {/* Archive / Restore Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                        isMeetingArchived(item)
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-white/10"
                      }`}
                      title={isMeetingArchived(item) ? "Restore meeting to active" : "Move to Archive / Concluded"}
                    >
                      {isMeetingArchived(item) ? (
                        <>
                          <RotateCcw className="w-3 h-3 text-amber-500" />
                          <span className="hidden sm:inline">Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3 h-3 text-neutral-400" />
                          <span className="hidden sm:inline">Archive</span>
                        </>
                      )}
                    </button>

                    {/* Send Reminder Action Icon */}
                    <button
                      type="button"
                      onClick={() => handleSendReminder(item)}
                      disabled={isSendingReminderId === item.id}
                      className="h-8 w-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      title="Send pre-meeting attendance reminder email"
                    >
                      {isSendingReminderId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Direct Client Contact Email */}
                    <a
                      href={`mailto:${item.clientEmail}`}
                      className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title={`Send direct email to ${item.clientEmail}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. ADMIN RESCHEDULE & CHANGE MEETING SETUP MODAL */}
      {rescheduleMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-neutral-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-amber-500" />
                  <span>Reschedule &amp; Change Meeting Setup</span>
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  Client: <strong className="text-neutral-800 dark:text-neutral-200">{rescheduleMeeting.clientName}</strong> ({rescheduleMeeting.projectCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleMeeting(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {/* Meeting Mode Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Meeting Format / Mode *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewMode("Online Video Call")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      newMode.toLowerCase().includes("online")
                        ? "border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${newMode.toLowerCase().includes("online") ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/5"}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Online Video Call</div>
                      <div className="text-[10px] text-neutral-500 font-sans">MCPA Video Room</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode("In-Person Consultation")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      !newMode.toLowerCase().includes("online")
                        ? "border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${!newMode.toLowerCase().includes("online") ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/5"}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">In-Person Consultation</div>
                      <div className="text-[10px] text-neutral-500 font-sans">Office, Site, or Coffee Shop</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* In-Person Venue Selection (If In-Person is selected) */}
              {!newMode.toLowerCase().includes("online") && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      <span>Select In-Person Meeting Venue *</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                      {newVenueType === "office" ? "Office HQ" : newVenueType === "site" ? "Proposed Project Site" : "Coffee Shop / Venue"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Office */}
                    <button
                      type="button"
                      onClick={() => setNewVenueType("office")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        newVenueType === "office"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${newVenueType === "office" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
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
                      onClick={() => setNewVenueType("site")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        newVenueType === "site"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${newVenueType === "site" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
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
                      onClick={() => setNewVenueType("cafe")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        newVenueType === "cafe"
                          ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white font-bold shadow-xs"
                          : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${newVenueType === "cafe" ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-white/10 text-neutral-500"}`}>
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
                  {newVenueType === "office" && (
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
                  {newVenueType === "site" && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                            Proposed Construction Lot Address:
                          </span>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{rescheduleMeeting.projectLocation || "Proposed Project Site (On-Site Ocular)"}</span>
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-1 italic">
                            * Our architectural and engineering team will meet you directly at your property for preliminary ocular and terrain inspection.
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rescheduleMeeting.projectLocation || "Bulacan")}`}
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
                  {newVenueType === "cafe" && (
                    <div className="pt-1">
                      <VenueCombobox
                        value={newCafeName}
                        onChange={(venue) => setNewCafeName(venue)}
                        onClear={() => setNewCafeName("")}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                    Slot *
                  </label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="09:00 AM - 10:30 AM PHT">09:00 AM - 10:30 AM</option>
                    <option value="10:00 AM - 11:30 AM PHT">10:00 AM - 11:30 AM</option>
                    <option value="02:00 PM - 03:30 PM PHT">02:00 PM - 03:30 PM</option>
                    <option value="04:00 PM - 05:30 PM PHT">04:00 PM - 05:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Reason for Rescheduling
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-sans focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 dark:bg-[#14161f]/95 backdrop-blur-sm -mx-5 -mb-5 px-5 py-3 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleMeeting(null)}
                  className="px-4 py-2 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="px-5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmittingReschedule ? "Saving..." : "Save & Dispatch Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MEETING OUTCOME & NEXT STEPS MODAL (MULTI-ROUND ENGAGEMENT) */}
      {outcomeMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-[12px] bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-neutral-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Consultation Outcome &amp; Next Steps</span>
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  Client: <strong className="text-neutral-800 dark:text-neutral-200">{outcomeMeeting.clientName}</strong> ({outcomeMeeting.projectCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOutcomeMeeting(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOutcome} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {/* Outcome Choice Radio Cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Consultation Decision &amp; Direction *
                </label>

                {/* Option 1: Schedule Next Meeting (Multiple rounds) */}
                <div
                  onClick={() => setOutcomeType("NEXT_MEETING")}
                  className={`p-3.5 rounded-[8px] border transition-all cursor-pointer space-y-1 ${
                    outcomeType === "NEXT_MEETING"
                      ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15"
                      : "border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        outcomeType === "NEXT_MEETING" ? "border-amber-500 bg-amber-500" : "border-neutral-400"
                      }`} />
                      <span>Schedule Follow-Up Consultation Meeting</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                      Iterative Alignment
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans pl-5 leading-relaxed">
                    Further technical evaluation, 3D design revisions, or BOQ estimate refinements are needed before signing.
                  </p>
                </div>

                {/* Option 2: Mutual Agreement Reached (Advance to Pre-Construction) */}
                <div
                  onClick={() => setOutcomeType("AGREED_ADVANCE")}
                  className={`p-3.5 rounded-[8px] border transition-all cursor-pointer space-y-1 ${
                    outcomeType === "AGREED_ADVANCE"
                      ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15"
                      : "border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        outcomeType === "AGREED_ADVANCE" ? "border-emerald-500 bg-emerald-500" : "border-neutral-400"
                      }`} />
                      <span>Mutual Agreement Reached · Advance to Stage 3</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Stage Gate Unlocked
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans pl-5 leading-relaxed">
                    Client and MCPA are in agreement with the preliminary scope and budget. Elevate to Stage 3 Pre-Construction Planning (Blueprints, Soil Survey, Contract).
                  </p>
                </div>

                {/* Option 3: Under Deliberation */}
                <div
                  onClick={() => setOutcomeType("REVISION_DELIBERATION")}
                  className={`p-3.5 rounded-[8px] border transition-all cursor-pointer space-y-1 ${
                    outcomeType === "REVISION_DELIBERATION"
                      ? "border-sky-500 bg-sky-500/10 dark:bg-sky-500/15"
                      : "border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        outcomeType === "REVISION_DELIBERATION" ? "border-sky-500 bg-sky-500" : "border-neutral-400"
                      }`} />
                      <span>Under Client Deliberation / Revisions in Progress</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase">
                      Pending Decision
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans pl-5 leading-relaxed">
                    Client requested revisions or is discussing internally with family/partners. Save meeting minutes and maintain active consultation.
                  </p>
                </div>

                {/* Option 4: Discontinued / Did Not Proceed (Hindi Nagkasundo / Umayaw) */}
                <div
                  onClick={() => setOutcomeType("DISCONTINUED_REJECTED")}
                  className={`p-3.5 rounded-[8px] border transition-all cursor-pointer space-y-1 ${
                    outcomeType === "DISCONTINUED_REJECTED"
                      ? "border-rose-500 bg-rose-500/10 dark:bg-rose-500/15"
                      : "border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        outcomeType === "DISCONTINUED_REJECTED" ? "border-rose-500 bg-rose-500" : "border-neutral-400"
                      }`} />
                      <span>Discontinued / Did Not Proceed (Hindi Nagkasundo / Umayaw)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">
                      Revert to Phase 1
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans pl-5 leading-relaxed">
                    Client and MCPA did not reach an agreement, or the client opted not to proceed. Consultation is closed and stage resets to Phase 1 (Rejected).
                  </p>
                </div>
              </div>

              {/* Dynamic Inputs for Next Meeting Round */}
              {outcomeType === "NEXT_MEETING" && (
                <div className="p-3.5 rounded-[8px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3 animate-in fade-in">
                  <div className="text-[11px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Follow-Up Consultation Setup</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Date *</label>
                      <input
                        type="date"
                        value={nextRoundDate}
                        onChange={(e) => setNextRoundDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Slot *</label>
                      <select
                        value={nextRoundSlot}
                        onChange={(e) => setNextRoundSlot(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                      >
                        <option value="09:00 AM - 10:30 AM PHT">09:00 AM - 10:30 AM</option>
                        <option value="10:00 AM - 11:30 AM PHT">10:00 AM - 11:30 AM</option>
                        <option value="02:00 PM - 03:30 PM PHT">02:00 PM - 03:30 PM</option>
                        <option value="04:00 PM - 05:30 PM PHT">04:00 PM - 05:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Meeting Format *</label>
                    <select
                      value={nextRoundMode}
                      onChange={(e) => setNextRoundMode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                    >
                      <option value="Online Video Call">Online Video Call (MCPA Video Room)</option>
                      <option value="Face-to-Face Office Visit">Face-to-Face Office Visit (MCPA Plaridel Lounge)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500">Consultation Agenda &amp; Objectives</label>
                    <input
                      type="text"
                      value={nextRoundAgenda}
                      onChange={(e) => setNextRoundAgenda(e.target.value)}
                      placeholder="e.g. Blueprint Review &amp; BOQ Revision Discussion"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Inputs for Discontinued / Rejected */}
              {outcomeType === "DISCONTINUED_REJECTED" && (
                <div className="p-3.5 rounded-[8px] bg-rose-500/10 border border-rose-500/20 space-y-2.5 animate-in fade-in">
                  <div className="text-[11px] font-mono font-bold uppercase text-rose-500 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Discontinue Reason &amp; Archive Settings</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400">Primary Reason *</label>
                    <select
                      value={discontinueReason}
                      onChange={(e) => setDiscontinueReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Budget / Financial Alignment Mismatch">Budget / Financial Alignment Mismatch</option>
                      <option value="Client Decided Not to Proceed / Backed Out">Client Decided Not to Proceed / Umayaw</option>
                      <option value="Disagreement on Scope & Specifications">Disagreement on Scope &amp; Specifications</option>
                      <option value="Project Deferred / Indefinitely Postponed">Project Deferred / Indefinitely Postponed</option>
                      <option value="Hired Another Contractor">Hired Another Contractor</option>
                      <option value="Out of Service Area / Feasibility Issue">Out of Service Area / Feasibility Issue</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400/90 font-sans leading-relaxed">
                    Client project phase will be reset to <strong>Phase 1 (Pre-Inquiry / Rejected)</strong>. The client will see a respectful note in their portal and can submit another inquiry whenever ready.
                  </p>
                </div>
              )}

              {/* Consultation Minutes / Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  {outcomeType === "DISCONTINUED_REJECTED" ? "Discontinue Notes / Client Feedback" : "Consultation Minutes & Engineering Notes"}
                </label>
                <textarea
                  rows={3}
                  value={outcomeMinutes}
                  onChange={(e) => setOutcomeMinutes(e.target.value)}
                  placeholder={
                    outcomeType === "DISCONTINUED_REJECTED"
                      ? "Record remarks on why client did not proceed or summary of discussions..."
                      : "Record summary of discussions, client preferences, agreements, or items to revise..."
                  }
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 dark:bg-[#14161f]/95 backdrop-blur-sm -mx-5 -mb-5 px-5 py-3 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOutcomeMeeting(null)}
                  className="px-4 py-2 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOutcome}
                  className={`px-5 py-2 rounded-[4px] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    outcomeType === "DISCONTINUED_REJECTED"
                      ? "bg-rose-500 hover:bg-rose-400 text-white"
                      : "bg-amber-500 hover:bg-amber-400 text-neutral-950"
                  }`}
                >
                  {isSubmittingOutcome
                    ? "Saving Decision..."
                    : outcomeType === "DISCONTINUED_REJECTED"
                    ? "Confirm & Revert to Phase 1"
                    : "Confirm Decision & Sync"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE HOST VIDEO CALL (FULLSCREEN PORTAL OR FLOATING MINI WINDOW) */}
      {activeCallRoom && (
        <GoogleMeetRoom
          roomCode={activeCallRoom.roomCode}
          currentUser={stableAdminUser}
          activeProject={{
            project_title: activeCallRoom.projectTitle,
            project_code: activeCallRoom.projectCode,
            client_name: activeCallRoom.clientName,
          }}
          isAdmin={true}
          onLeave={() => {
            const currentRoom = activeCallRoom?.roomCode;
            setActiveCallRoom(null);
            setIncomingInstantCall(null);
            try {
              localStorage.removeItem("mcpa_instant_call_active");
              sessionStorage.setItem("mcpa_dismissed_instant_call", currentRoom || "all");
              sessionStorage.setItem("mcpa_call_recently_left", String(Date.now()));
              window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode: currentRoom } }));
            } catch (e) {}
            showToast("Left video consultation room.");
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

