"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Archive,
  History,
  Star,
  LayoutGrid,
  List,
  Search,
  Filter,
  MessageSquare,
} from "lucide-react";
import GoogleMeetRoom from "./GoogleMeetRoom";
import { extractRoomCode, buildMeetingUrl } from "@/modules/portal/utils/roomCodeHelper";
import { getMeetingLifecycleState } from "@/modules/portal/utils/meetingTiming";
import VenueCombobox from "@/modules/book/components/VenueCombobox";
import { io } from "socket.io-client";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";
import {
  getConsultationHistory,
  fetchConsultationHistoryFromCloud,
  updateMeetingRatingAndNote,
  isDummyConsultationSession,
  formatMeetingDuration,
} from "@/modules/portal/utils/meetingHistoryService";

export default function PortalMeetingHub({
  activeProject,
  currentUser,
  meetingRoom,
  inquiries = [],
  showToast = () => {},
  onRefreshState,
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
  const [cafeVenueName, setCafeVenueName] = useState("");
  const [preferredDate, setPreferredDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
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
  const roomCode = useMemo(() => {
    return extractRoomCode(primaryInquiry || activeProject || meetingRoom);
  }, [primaryInquiry, activeProject, meetingRoom]);

  const resolvedInitialMode =
    primaryInquiry?.venue_type || primaryInquiry?.venueType
      ? `In-Person (${primaryInquiry.venue_type || primaryInquiry.venueType})`
      : primaryInquiry?.meeting_mode ||
        primaryInquiry?.meetingMode ||
        activeProject?.meeting_mode ||
        activeProject?.meetingMode ||
        "Online Meeting";

  // Active / Upcoming Meeting info derived from project / inquiry / defaults
  const [activeMeetingInfo, setActiveMeetingInfo] = useState({
    mode: resolvedInitialMode,
    date: primaryInquiry?.meeting_date || primaryInquiry?.meetingDate || "",
    time: primaryInquiry?.meeting_time || primaryInquiry?.meetingTime || "",
    status: primaryInquiry?.availability_status || "Pending Schedule",
    leadConsultant: "Engr. Raymart Quirante",
    leadRole: "Lead Project Engineer & Consultant",
    officeAddress:
      primaryInquiry?.venue_details ||
      primaryInquiry?.venueDetails ||
      "MCPA Tabang Central Office, MacArthur Highway, Plaridel, Bulacan",
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

  // View mode tab: 'all' (All Meetings: active + history) | 'active' | 'history'
  const [hubTab, setHubTab] = useState("all");

  // Resolve Consultant / Admin profile picture (Engr. Raymart Quirante)
  const [consultantAvatar, setConsultantAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const customAvatar = localStorage.getItem("mcpa_admin_avatar");
        if (customAvatar && customAvatar.trim()) return customAvatar.trim();

        const storedAdmin = localStorage.getItem("mcpa_admin_user");
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          const av = parsed.avatarUrl || parsed.avatar_url || parsed.photoURL || parsed.picture;
          if (av && typeof av === "string" && av.trim()) return av.trim();
        }

        const storedBriefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
        if (Array.isArray(storedBriefs)) {
          const rqBrief = storedBriefs.find(
            (b) =>
              (b.clientEmail && b.clientEmail.toLowerCase().includes("martquirante")) ||
              (b.clientName && b.clientName.toLowerCase().includes("quirante"))
          );
          if (rqBrief) {
            const av = rqBrief.avatarUrl || rqBrief.avatar_url;
            if (av && typeof av === "string" && av.trim()) return av.trim();
          }
        }

        const storedClient = localStorage.getItem("mcpa_client_user");
        if (storedClient) {
          const parsedClient = JSON.parse(storedClient);
          const cName = (parsedClient.name || parsedClient.fullName || "").toLowerCase();
          if (cName.includes("raymart") || cName.includes("quirante")) {
            const av = parsedClient.avatarUrl || parsedClient.avatar_url || parsedClient.photoURL || parsedClient.picture;
            if (av && typeof av === "string" && av.trim()) return av.trim();
          }
        }
      } catch (e) {}
    }
    return "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
  });

  useEffect(() => {
    const syncAvatar = () => {
      try {
        const customAvatar = localStorage.getItem("mcpa_admin_avatar");
        if (customAvatar && customAvatar.trim()) {
          setConsultantAvatar(customAvatar.trim());
          return;
        }
        const storedAdmin = localStorage.getItem("mcpa_admin_user");
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          const av = parsed.avatarUrl || parsed.avatar_url || parsed.photoURL || parsed.picture;
          if (av && typeof av === "string" && av.trim()) {
            setConsultantAvatar(av.trim());
            return;
          }
        }
      } catch (e) {}
    };

    window.addEventListener("storage", syncAvatar);
    return () => window.removeEventListener("storage", syncAvatar);
  }, []);

  // History View Mode: 'table' vs 'grid' (Persisted in localStorage)
  const [historyViewMode, setHistoryViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_history_view_mode") || "table";
    }
    return "table";
  });
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all' | 'instant' | 'scheduled' | 'f2f'
  const [historySearch, setHistorySearch] = useState("");

  // Stored meeting history from service & localStorage
  const [consultationHistoryList, setConsultationHistoryList] = useState(() => getConsultationHistory());

  // Purge any legacy dummy consultation records on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mcpa_consultation_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const purged = parsed.filter((item) => !isDummyConsultationSession(item));
          if (purged.length !== parsed.length) {
            localStorage.setItem("mcpa_consultation_history", JSON.stringify(purged));
            setConsultationHistoryList(purged);
          }
        }
      }
      const shared = localStorage.getItem("mcpa_shared_meeting_schedule");
      if (shared) {
        const parsedShared = JSON.parse(shared);
        if (parsedShared && Array.isArray(parsedShared.history)) {
          parsedShared.history = parsedShared.history.filter((item) => !isDummyConsultationSession(item));
          localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(parsedShared));
        }
      }
    } catch (e) {}

    // Pull fresh meeting history from PostgreSQL Cloud Database (Neon / Supabase)
    fetchConsultationHistoryFromCloud()
      .then((items) => {
        if (Array.isArray(items)) {
          setConsultationHistoryList(items);
        }
      })
      .catch(() => {});
  }, []);

  // Listen for meeting history updates across tabs and events
  useEffect(() => {
    const syncHistory = () => {
      setConsultationHistoryList(getConsultationHistory());
    };
    window.addEventListener("mcpa-meeting-history-updated", syncHistory);
    window.addEventListener("storage", syncHistory);
    return () => {
      window.removeEventListener("mcpa-meeting-history-updated", syncHistory);
      window.removeEventListener("storage", syncHistory);
    };
  }, []);

  // Modals for History: Details Modal & Rating Modal
  const [detailsModalSession, setDetailsModalSession] = useState(null);
  const [ratingModalSession, setRatingModalSession] = useState(null);
  const [activeRateStars, setActiveRateStars] = useState(5);
  const [activeRateHover, setActiveRateHover] = useState(0);
  const [activeRateNote, setActiveRateNote] = useState("");

  // Synthesize complete meeting history and past consultations (real concluded meetings only)
  const meetingHistory = useMemo(() => {
    if (!Array.isArray(consultationHistoryList)) return [];
    return consultationHistoryList.filter((item) => !isDummyConsultationSession(item));
  }, [consultationHistoryList]);

  // Filtered and searched history
  const filteredMeetingHistory = useMemo(() => {
    return meetingHistory.filter((item) => {
      const modeLower = (item.mode || "").toLowerCase();
      const isInstant = modeLower.includes("instant");
      const isSched = (modeLower.includes("online") || modeLower.includes("video") || modeLower.includes("google")) && !isInstant;
      const isF2F = !isInstant && !isSched;

      if (historyFilter === "instant" && !isInstant) return false;
      if (historyFilter === "scheduled" && !isSched) return false;
      if (historyFilter === "f2f" && !isF2F) return false;

      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const matchesTitle = (item.roundTitle || "").toLowerCase().includes(query);
        const matchesNote = (item.clientNote || "").toLowerCase().includes(query);
        const matchesMinutes = (item.minutes || "").toLowerCase().includes(query);
        const matchesConsultant = (item.leadConsultant || "").toLowerCase().includes(query);
        const matchesMode = (item.mode || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesNote && !matchesMinutes && !matchesConsultant && !matchesMode) {
          return false;
        }
      }
      return true;
    });
  }, [meetingHistory, historyFilter, historySearch]);

  const historyCounts = useMemo(() => {
    let all = meetingHistory.length;
    let instant = 0;
    let scheduled = 0;
    let f2f = 0;
    meetingHistory.forEach((item) => {
      const m = (item.mode || "").toLowerCase();
      if (m.includes("instant")) instant++;
      else if (m.includes("online") || m.includes("video") || m.includes("google")) scheduled++;
      else f2f++;
    });
    return { all, instant, scheduled, f2f };
  }, [meetingHistory]);

  const handleOpenRatingModal = (session) => {
    setRatingModalSession(session);
    setActiveRateStars(session.rating || 5);
    setActiveRateHover(0);
    setActiveRateNote(session.clientNote || "");
  };

  const handleSaveRating = () => {
    if (!ratingModalSession) return;
    const updated = updateMeetingRatingAndNote(ratingModalSession.id, activeRateStars, activeRateNote);
    setConsultationHistoryList(updated);
    setRatingModalSession(null);
    showToast("Rating & consultation note updated successfully!");
  };

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
        const currentSubId =
          primaryInquiry?.submission_id ||
          primaryInquiry?.submissionId ||
          primaryInquiry?.id ||
          activeProject?.project_code;
        const matchesCurrentInquiry =
          !primaryInquiry ||
          (parsed?.submissionId && String(parsed.submissionId) === String(currentSubId));

        if (parsed && matchesCurrentInquiry && (parsed.date || parsed.mode)) {
          setActiveMeetingInfo((prev) => ({
            ...prev,
            mode: parsed.mode || prev.mode,
            date: parsed.date || prev.date,
            time: parsed.time || prev.time,
            status: parsed.status || prev.status,
            officeAddress: parsed.venue || prev.officeAddress,
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
          officeAddress: data.venue || prev.officeAddress,
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
  }, [showToast, primaryInquiry, activeProject]);

  // Synchronize with primaryInquiry updates (including F2F mode even before exact date is finalized)
  useEffect(() => {
    if (primaryInquiry) {
      const rawVenueType = primaryInquiry.venue_type || primaryInquiry.venueType || "";
      const hasPhysicalVenue = Boolean(
        rawVenueType &&
        !rawVenueType.toLowerCase().includes("online") &&
        !rawVenueType.toLowerCase().includes("video") &&
        !rawVenueType.toLowerCase().includes("google")
      );
      const inquiryMode = hasPhysicalVenue
        ? `In-Person (${rawVenueType})`
        : primaryInquiry.meeting_mode || primaryInquiry.meetingMode;

      setActiveMeetingInfo((prev) => ({
        ...prev,
        mode: inquiryMode || prev.mode,
        date: primaryInquiry.meeting_date || primaryInquiry.meetingDate || prev.date,
        time: primaryInquiry.meeting_time || primaryInquiry.meetingTime || prev.time,
        status: primaryInquiry.availability_status || primaryInquiry.availabilityStatus || prev.status,
        officeAddress:
          primaryInquiry.venue_details ||
          primaryInquiry.venueDetails ||
          prev.officeAddress,
        agenda: primaryInquiry.meeting_notes || prev.agenda,
        attendanceConfirmed: Boolean(
          primaryInquiry.availability_status === "Attendance Confirmed" ||
          primaryInquiry.availabilityStatus === "Attendance Confirmed" ||
          prev.attendanceConfirmed
        ),
      }));
    }
  }, [primaryInquiry]);

  const handleCopyCode = () => {
    const url = buildMeetingUrl(roomCode);
    navigator.clipboard?.writeText(url);
    setCopiedCode(true);
    showToast("Meeting invitation link copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmAttendance = async () => {
    setIsConfirmingAttendance(true);
    try {
      const targetId = primaryInquiry?.submission_id || primaryInquiry?.id || activeProject?.project_code || "1";
      const payload = {
        ...activeMeetingInfo,
        submissionId: targetId,
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
      let resolvedVenueTypeLabel = null;
      let calculatedMode = isOnline ? "Online Video Call" : "In-Person Consultation";

      if (!isOnline) {
        if (inPersonVenueType === "office") {
          resolvedVenueTypeLabel = "MCPA Head Office";
          calculatedVenue = "MCPA Construction & Supply Head Office, 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan";
        } else if (inPersonVenueType === "site") {
          resolvedVenueTypeLabel = "Project Site";
          calculatedVenue = activeProject?.location
            ? `Proposed Project Site (${activeProject.location})`
            : "Proposed Project Site (On-Site Ocular)";
        } else if (inPersonVenueType === "cafe") {
          resolvedVenueTypeLabel = "Coffee Shop / Public Venue";
          calculatedVenue = cafeVenueName.trim() || "Starbucks / Coffee Shop Venue";
        }
        calculatedMode = `In-Person (${resolvedVenueTypeLabel})`;
      }

      const targetId =
        primaryInquiry?.submission_id ||
        primaryInquiry?.submissionId ||
        primaryInquiry?.brief_id ||
        primaryInquiry?.id ||
        activeProject?.brief_id ||
        activeProject?.project_code ||
        "1";

      const updatedInfo = {
        submissionId: targetId,
        mode: calculatedMode,
        venue: calculatedVenue,
        officeAddress: calculatedVenue,
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
      try {
        await fetch(`/api/briefs/${encodeURIComponent(targetId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Meeting Scheduled",
            meetingMode: calculatedMode,
            venueType: isOnline ? "" : resolvedVenueTypeLabel,
            venueDetails: isOnline ? "" : calculatedVenue,
            meetingDate: preferredDate,
            meetingTime: preferredSlot,
            meetingLink: isOnline ? (meetingRoom?.room_code ? `https://meet.google.com/${meetingRoom.room_code}` : "https://meet.google.com/mcpa-meet-7ecea339") : calculatedVenue,
            meetingNotes: meetingNotes,
            isRescheduled: true,
            rescheduleReason: "Client Adjustment Request",
            updatedByClient: true,
          }),
        });
        if (onRefreshState) {
          onRefreshState();
        }
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

    try {
      sessionStorage.removeItem("mcpa_dismissed_instant_call");
      sessionStorage.removeItem("mcpa_dismissed_instant_call_at");
      sessionStorage.removeItem("mcpa_call_recently_left");
    } catch (e) {}

    const instantRoomCode = roomCode;
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
      projectCode: activeProject?.project_code || primaryInquiry?.trackingId || "",
      projectTitle: activeProject?.project_title || primaryInquiry?.projectType || "Residential Consultation",
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

  const handleMeetingLeave = useCallback(() => {
    const wasInstant = isInstantMode;
    const cleanBase = (roomCode || "meet").replace(/^(mcpa-)?(instant-)?/, "");
    const currentRoomCode = wasInstant ? `mcpa-instant-${cleanBase}` : roomCode;
    setViewState("schedule");
    setIsInstantMode(false);
    if (wasInstant) {
      try {
        localStorage.removeItem("mcpa_instant_call_active");
        sessionStorage.removeItem("mcpa_dismissed_instant_call");
        sessionStorage.removeItem("mcpa_dismissed_instant_call_at");
        sessionStorage.removeItem("mcpa_call_recently_left");
        window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode: currentRoomCode } }));
        const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"] });
        socket.on("connect", () => {
          socket.emit("instant-call-ended", { roomCode: currentRoomCode });
          setTimeout(() => socket.disconnect(), 1000);
        });
      } catch (e) {}
    }
    showToast("You left the consultation meeting.");
  }, [roomCode, isInstantMode, showToast]);

  const handleMeetingAutoEndTimeout = useCallback(() => {
    const cleanBase = (roomCode || "meet").replace(/^(mcpa-)?(instant-)?/, "");
    const currentRoomCode = isInstantMode ? `mcpa-instant-${cleanBase}` : roomCode;
    setViewState("schedule");
    setIsInstantMode(false);
    try {
      localStorage.removeItem("mcpa_instant_call_active");
      sessionStorage.removeItem("mcpa_dismissed_instant_call");
      sessionStorage.removeItem("mcpa_dismissed_instant_call_at");
      sessionStorage.removeItem("mcpa_call_recently_left");
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode: currentRoomCode } }));
      const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"] });
      socket.emit("instant-call-ended", { roomCode: currentRoomCode });
      setTimeout(() => socket.disconnect(), 2000);
    } catch (e) {}
    setIsTimeoutModalOpen(true);
  }, [roomCode, isInstantMode]);

  const modeLower = (activeMeetingInfo.mode || "").toLowerCase();
  const isOnlineMode =
    (modeLower.includes("online") || modeLower.includes("video") || modeLower.includes("google")) &&
    !modeLower.includes("in-person") &&
    !modeLower.includes("face-to-face") &&
    !modeLower.includes("f2f");

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* 1. TOP HEADER: MEETING HUB TITLE & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Consultation &amp; Meeting Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-neutral-900 dark:text-white">
            Client Appointment Meeting
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Manage your face-to-face appointments and online video engineering sessions
            {(activeProject?.project_code || primaryInquiry?.trackingId) && (
              <>
                {" "}for{" "}
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {activeProject?.project_code || primaryInquiry?.trackingId}
                </span>
              </>
            )}
            .
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
              className="px-4 py-2 rounded-[4px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>View Venue &amp; Directions</span>
            </a>
          )}
        </div>
      </div>

      {/* 1.1 VIEW FILTER TABS: All Meetings / Active Schedule / Consultation History */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 dark:border-white/10 w-full">
        <button
          type="button"
          onClick={() => setHubTab("all")}
          className={`px-3.5 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            hubTab === "all"
              ? "text-neutral-900 dark:text-white border-amber-500"
              : "text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>All Meetings ({1 + meetingHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setHubTab("active")}
          className={`px-3.5 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            hubTab === "active"
              ? "text-neutral-900 dark:text-white border-amber-500"
              : "text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Active Schedule (1)</span>
        </button>

        <button
          type="button"
          onClick={() => setHubTab("history")}
          className={`px-3.5 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            hubTab === "history"
              ? "text-neutral-900 dark:text-white border-amber-500"
              : "text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-amber-500" />
          <span>Meeting History ({meetingHistory.length})</span>
        </button>
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
      {(hubTab === "all" || hubTab === "active") && (
        !activeMeetingInfo.date ? (
          <div className="p-8 rounded-[12px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 text-center space-y-3">
            <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white">
              {isOnlineMode ? "No Consultation Scheduled Yet" : "Face-to-Face (In-Person) Consultation Pending Schedule"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-md mx-auto">
              {isOnlineMode
                ? "You do not have an active or upcoming consultation appointment scheduled yet. You can launch an instant online alignment meeting with our engineering team whenever needed."
                : `Your preferred consultation mode is ${activeMeetingInfo.mode}. You may set your preferred visit date & venue or view directions to our office below.`}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2.5">
              {isOnlineMode ? (
                <button
                  type="button"
                  onClick={() => setIsInstantNoticeModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Zap className="w-4 h-4" />
                  <span>Launch Instant Online Meeting</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Set Preferred F2F Schedule</span>
                  </button>
                  <a
                    href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View Venue &amp; Directions</span>
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
        <div className="relative overflow-hidden rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-xl transition-all">
        <div className="p-5 sm:p-6 space-y-6">
          {/* Header Row: Mode Pill, Dynamic Status Pill, Scheduled Time */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isOnlineMode
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isOnlineMode ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                <span>{activeMeetingInfo.mode}</span>
              </span>

              {/* LIVE ONGOING INDICATOR */}
              {lifecycle.isOngoing ? (
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
                  <span>ONGOING MEETING SESSION</span>
                </span>
              ) : lifecycle.isRoomUnlocked ? (
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ROOM READY (LIVE)</span>
                </span>
              ) : activeMeetingInfo.attendanceConfirmed ? (
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
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
                <div className="p-4 rounded-[8px] border border-emerald-500/20 space-y-3">
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
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-base shadow-xs shrink-0 group">
                  {consultantAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={consultantAvatar}
                      alt={activeMeetingInfo.leadConsultant || "Lead Consultant"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.parentElement?.querySelector(".consultant-avatar-fallback");
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{ display: consultantAvatar ? "none" : "flex" }}
                    className="consultant-avatar-fallback w-full h-full items-center justify-center font-mono font-bold text-base uppercase"
                  >
                    RQ
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                      {activeMeetingInfo.leadConsultant}
                    </h4>
                    <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase shrink-0">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
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
                  <div className="p-2.5 rounded-[6px] border border-emerald-500/20 text-xs font-sans text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
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
        )
      )}

      {/* 4. MEETING HISTORY & ARCHIVED SESSIONS SECTION */}
      {(hubTab === "all" || hubTab === "history") && (
        <div className="space-y-4 pt-2">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 text-amber-600 dark:text-amber-400">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Consultation History &amp; Archived Sessions</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                    {meetingHistory.length} {meetingHistory.length === 1 ? "Session" : "Sessions"}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Complete archival record of previous face-to-face appointments and online video engineering sessions with recorded deliberation minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Filter & View Mode Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "All Sessions", count: historyCounts.all, icon: <History className="w-3 h-3" /> },
                { key: "instant", label: "Instant Online", count: historyCounts.instant, icon: <Zap className="w-3 h-3 text-cyan-400" /> },
                { key: "scheduled", label: "Scheduled Video", count: historyCounts.scheduled, icon: <Video className="w-3 h-3 text-indigo-400" /> },
                { key: "f2f", label: "In-Person (F2F)", count: historyCounts.f2f, icon: <Building className="w-3 h-3 text-emerald-400" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setHistoryFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyFilter === tab.key
                      ? "bg-amber-400 text-neutral-950 border border-amber-400 shadow-xs"
                      : "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-400 border border-neutral-200/70 dark:border-white/5"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    historyFilter === tab.key
                      ? "bg-black/10 text-neutral-950"
                      : "bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Table/Grid Mode Toggle */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter topic or notes..."
                  className="pl-8.5 pr-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500/40 w-36 sm:w-48 font-mono shadow-xs"
                />
              </div>

              {/* View Switcher: Table vs Grid */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryViewMode("table");
                    try { localStorage.setItem("mcpa_history_view_mode", "table"); } catch (e) {}
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    historyViewMode === "table"
                      ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Table View (Little Info Overview)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryViewMode("grid");
                    try { localStorage.setItem("mcpa_history_view_mode", "grid"); } catch (e) {}
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    historyViewMode === "grid"
                      ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Grid View (Card Information)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* SESSIONS DISPLAY: TABLE VS GRID */}
          {filteredMeetingHistory.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-white dark:bg-[#101218] border border-neutral-200/80 dark:border-white/[0.06] text-neutral-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700 stroke-[1.5]" />
              <p className="text-xs font-mono">
                {meetingHistory.length === 0
                  ? "No consultation sessions recorded yet. Concluded meetings will appear here with call duration, ratings, and deliberation notes."
                  : "No consultation sessions found matching this filter criteria."}
              </p>
            </div>
          ) : historyViewMode === "table" ? (
            /* TABLE VIEW: Clean Compact Architectural Table ("little info lang sya ganun") */
            <div className="rounded-xl border border-neutral-200/90 dark:border-white/10 overflow-hidden bg-white dark:bg-[#101218] shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.02] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Mode / Type</th>
                      <th className="py-3 px-4">Meeting Topic</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Deliberation / Note</th>
                      <th className="py-3 px-4">Consultant</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/5 text-xs font-sans">
                    {filteredMeetingHistory.map((item, index) => {
                      const modeLower = (item.mode || "").toLowerCase();
                      const isInstant = modeLower.includes("instant");
                      const isSched = (modeLower.includes("online") || modeLower.includes("video") || modeLower.includes("google")) && !isInstant;

                      return (
                        <tr
                          key={item.id || index}
                          className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* 1. Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              {item.displayDate}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{item.time}</span>
                            </div>
                          </td>

                          {/* 2. Mode / Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                isInstant
                                    ? "text-cyan-600 dark:text-cyan-400"
                                  : isSched
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {isInstant ? (
                                <Zap className="w-3 h-3" />
                              ) : isSched ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <Building className="w-3 h-3" />
                              )}
                              <span>
                                {isInstant
                                  ? "Instant Online"
                                  : isSched
                                  ? "Scheduled Video"
                                  : "In-Person F2F"}
                              </span>
                            </span>
                          </td>

                          {/* 3. Meeting Topic */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="font-bold text-neutral-900 dark:text-white line-clamp-1">
                              {item.roundTitle}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">{item.venue}</span>
                            </div>
                          </td>

                          {/* 4. Duration (Haba ng meeting) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{item.duration || "< 1 min"}</span>
                            </span>
                          </td>

                          {/* 5. Rating (1-5 stars) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.rating ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= item.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-neutral-300 dark:text-neutral-700"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {item.rating}.0
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRatingModal(item)}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                              >
                                Rate Session
                              </button>
                            )}
                          </td>

                          {/* 6. Note / Feedback */}
                          <td className="py-3.5 px-4 max-w-[220px]">
                            <p
                              className="text-xs text-neutral-600 dark:text-neutral-300 font-sans line-clamp-2 italic"
                              title={item.clientNote || item.minutes}
                            >
                              &ldquo;{item.clientNote || item.minutes}&rdquo;
                            </p>
                          </td>

                          {/* 7. Consultant */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 overflow-hidden text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                {consultantAvatar ? (
                                  <img
                                    src={consultantAvatar}
                                    alt="RQ"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  "RQ"
                                )}
                              </div>
                              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">
                                {item.leadConsultant || "Engr. Raymart Quirante"}
                              </div>
                            </div>
                          </td>

                          {/* 8. Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailsModalSession(item)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                                title="View Consultation Minutes & Details"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRatingModal(item)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                                title="Rate or Edit Notes"
                              >
                                <Star className="w-3.5 h-3.5" />
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
          ) : (
            /* GRID VIEW: Concise Information Cards ("pwede rin mag grid sya ganun like little info lang") */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMeetingHistory.map((item, index) => {
                const modeLower = (item.mode || "").toLowerCase();
                const isInstant = modeLower.includes("instant");
                const isSched = (modeLower.includes("online") || modeLower.includes("video") || modeLower.includes("google")) && !isInstant;

                return (
                  <div
                    key={item.id || index}
                    className="rounded-xl bg-white dark:bg-[#101218] border border-neutral-200/90 dark:border-white/10 hover:border-amber-500/40 transition-all shadow-xs p-4.5 flex flex-col justify-between space-y-3.5"
                  >
                    {/* Card Top: Date & Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {item.displayDate}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{item.duration || "< 1 min"}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isInstant
                              ? "text-cyan-600 dark:text-cyan-400"
                              : isSched
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isInstant ? (
                            <Zap className="w-3 h-3" />
                          ) : isSched ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <Building className="w-3 h-3" />
                          )}
                          <span>
                            {isInstant
                              ? "Instant Online"
                              : isSched
                              ? "Scheduled Video"
                              : "In-Person F2F"}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {item.time}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Deliberation Note Snippet */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {item.roundTitle}
                      </h4>
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">
                            Client Note / Review:
                          </span>
                          {item.rating ? (
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-mono font-bold text-amber-500">
                                {item.rating}.0
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-400">Unrated</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans line-clamp-2 italic">
                          &ldquo;{item.clientNote || item.minutes}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Consultant + Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 overflow-hidden text-amber-600 dark:text-amber-400 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                          {consultantAvatar ? (
                            <img
                              src={consultantAvatar}
                              alt="RQ"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "RQ"
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">
                          {item.leadConsultant || "Engr. Raymart Quirante"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDetailsModalSession(item)}
                          className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                        >
                          Minutes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRatingModal(item)}
                          className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>Rate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
          roomCode={isInstantMode ? `mcpa-instant-${(roomCode || "meet").replace(/^(mcpa-)?(instant-)?/, "")}` : roomCode}
          currentUser={currentUser}
          activeProject={activeProject}
          isInstantMeeting={isInstantMode}
          onLeave={handleMeetingLeave}
          onAutoEndTimeout={handleMeetingAutoEndTimeout}
          showToast={showToast}
        />
      )}

      {/* 8. CONSULTATION MINUTES & DETAILS MODAL */}
      {detailsModalSession && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#12141c] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-2xl p-6 sm:p-7 space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-white/5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                    Concluded Session
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {detailsModalSession.mode}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                  {detailsModalSession.roundTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{detailsModalSession.displayDate} · {detailsModalSession.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Duration: {detailsModalSession.duration || "< 1 min"}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalSession(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Venue & Location */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 text-xs text-neutral-700 dark:text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{detailsModalSession.venue}</span>
            </div>

            {/* Deliberation Minutes */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#151822] border border-neutral-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Consultation Minutes &amp; Deliberation Summary</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                  Verified by MCPA Lead Engineer
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
                {detailsModalSession.minutes}
              </p>
            </div>

            {/* Agreed Next Steps & Action Items */}
            {Array.isArray(detailsModalSession.actionItems) && detailsModalSession.actionItems.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Agreed Next Steps &amp; Action Items
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailsModalSession.actionItems.map((act, actIdx) => (
                    <div
                      key={actIdx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/[0.04] text-[11px] font-sans text-neutral-700 dark:text-neutral-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Rating & Deliberation Review */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                  Client Rating &amp; Deliberation Feedback
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenRatingModal(detailsModalSession);
                    setDetailsModalSession(null);
                  }}
                  className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-500 cursor-pointer"
                >
                  Edit Rating &amp; Notes
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= (detailsModalSession.rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-300 dark:text-neutral-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {detailsModalSession.rating || 5}.0 / 5.0
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans italic">
                &ldquo;{detailsModalSession.clientNote || detailsModalSession.minutes}&rdquo;
              </p>
            </div>

            {/* Consultant Info & Close Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 overflow-hidden text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {consultantAvatar ? (
                    <img src={consultantAvatar} alt="RQ" className="w-full h-full object-cover" />
                  ) : "RQ"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {detailsModalSession.leadConsultant || "Engr. Raymart Quirante"}
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-500">
                    {detailsModalSession.leadRole || "Lead Project Engineer & Consultant"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailsModalSession(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Close Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. RATE SESSION & DELIBERATION NOTE MODAL */}
      {ratingModalSession && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12141c] border border-amber-500/30 text-neutral-900 dark:text-white shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                    Rate Consultation Session
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {ratingModalSession.roundTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingModalSession(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges: Meeting Type & Duration */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {ratingModalSession.mode}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Duration: {ratingModalSession.duration || "< 1 min"}</span>
              </span>
            </div>

            {/* 5-Star Interactive Selector */}
            <div className="space-y-2 text-center py-1">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = activeRateHover || activeRateStars;
                  const isFilled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setActiveRateHover(star)}
                      onMouseLeave={() => setActiveRateHover(0)}
                      onClick={() => setActiveRateStars(star)}
                      className="p-1.5 transition-transform hover:scale-120 active:scale-95 cursor-pointer focus:outline-none"
                      title={`${star} Star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? "text-amber-500 fill-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                            : "text-neutral-300 dark:text-neutral-700 hover:text-neutral-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                {activeRateStars === 5 && "5.0 · Outstanding Engineering Consultation ⭐⭐⭐⭐⭐"}
                {activeRateStars === 4 && "4.0 · Very Good Consultation ⭐⭐⭐⭐"}
                {activeRateStars === 3 && "3.0 · Satisfactory Discussion ⭐⭐⭐"}
                {activeRateStars === 2 && "2.0 · Fair / Minor Inconveniences ⭐⭐"}
                {activeRateStars === 1 && "1.0 · Needs Follow-Up & Improvement ⭐"}
              </p>
            </div>

            {/* Note / Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                Deliberation Note &amp; Feedback:
              </label>
              <textarea
                rows={3}
                value={activeRateNote}
                onChange={(e) => setActiveRateNote(e.target.value)}
                placeholder="Share feedback, architectural decisions, or discussion notes..."
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRatingModalSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRating}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Rating &amp; Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
