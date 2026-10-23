"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import {
  PhoneCall,
  PhoneOff,
  Clock,
  Video,
  ShieldCheck,
  User,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  playIncomingCallRingtone,
  stopIncomingCallRingtone,
  showDeviceCallNotification,
  registerCallServiceWorker,
  hasCallNotificationPermission,
} from "@/modules/admin/utils/deviceCallNotification";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";

/**
 * Robust target client matching helper
 * Evaluates whether an incoming instant call from Admin targets the active client portal session.
 */
function isCallTargetedToClient(payload, { currentUser, inquiries, primaryInquiry, activeProject }) {
  if (!payload) return false;

  const targetEmail = (payload.targetClientEmail || "").toLowerCase().trim();
  const targetName = (payload.targetClientName || payload.clientName || "").toLowerCase().trim();
  const targetId = String(payload.targetClientId || "").toLowerCase().trim();
  const targetProjectCode = String(payload.projectCode || "").toLowerCase().trim();
  const targetRoomCode = String(payload.roomCode || "").toLowerCase().trim();

  // 1. If payload has no client-specific filters, treat as broadcast to all client portals
  if (!targetEmail && !targetId && !targetProjectCode && !targetName) {
    return true;
  }

  // 2. Gather all known client emails
  const clientEmails = new Set();
  if (currentUser?.email) clientEmails.add(currentUser.email.toLowerCase().trim());
  if (primaryInquiry?.client_email) clientEmails.add(primaryInquiry.client_email.toLowerCase().trim());
  if (primaryInquiry?.clientEmail) clientEmails.add(primaryInquiry.clientEmail.toLowerCase().trim());
  if (primaryInquiry?.email) clientEmails.add(primaryInquiry.email.toLowerCase().trim());

  if (Array.isArray(inquiries)) {
    inquiries.forEach((inq) => {
      if (inq?.client_email) clientEmails.add(inq.client_email.toLowerCase().trim());
      if (inq?.clientEmail) clientEmails.add(inq.clientEmail.toLowerCase().trim());
      if (inq?.email) clientEmails.add(inq.email.toLowerCase().trim());
    });
  }

  // Check email match (exact or username prefix e.g. martquirante in martquirante@gmail.com vs martquirante04@gmail.com)
  if (targetEmail) {
    for (const email of clientEmails) {
      if (email === targetEmail) return true;
      const emailUser = email.split("@")[0].replace(/[^a-z0-9]/g, "");
      const targetUser = targetEmail.split("@")[0].replace(/[^a-z0-9]/g, "");
      if (emailUser && targetUser && (emailUser.includes(targetUser) || targetUser.includes(emailUser))) {
        return true;
      }
    }
  }

  // 3. Gather all known submission / inquiry / project identifiers
  const clientIdentifiers = new Set();
  if (currentUser?.id) clientIdentifiers.add(String(currentUser.id).toLowerCase());
  if (currentUser?.user_id) clientIdentifiers.add(String(currentUser.user_id).toLowerCase());
  if (primaryInquiry?.id) clientIdentifiers.add(String(primaryInquiry.id).toLowerCase());
  if (primaryInquiry?.submission_id) clientIdentifiers.add(String(primaryInquiry.submission_id).toLowerCase());
  if (primaryInquiry?.submissionId) clientIdentifiers.add(String(primaryInquiry.submissionId).toLowerCase());
  if (primaryInquiry?.tracking_id) clientIdentifiers.add(String(primaryInquiry.tracking_id).toLowerCase());
  if (primaryInquiry?.trackingId) clientIdentifiers.add(String(primaryInquiry.trackingId).toLowerCase());
  if (primaryInquiry?.project_code) clientIdentifiers.add(String(primaryInquiry.project_code).toLowerCase());
  if (primaryInquiry?.projectCode) clientIdentifiers.add(String(primaryInquiry.projectCode).toLowerCase());

  if (activeProject?.project_code) clientIdentifiers.add(String(activeProject.project_code).toLowerCase());
  if (activeProject?.id) clientIdentifiers.add(String(activeProject.id).toLowerCase());

  if (Array.isArray(inquiries)) {
    inquiries.forEach((inq) => {
      if (inq?.id) clientIdentifiers.add(String(inq.id).toLowerCase());
      if (inq?.submission_id) clientIdentifiers.add(String(inq.submission_id).toLowerCase());
      if (inq?.submissionId) clientIdentifiers.add(String(inq.submissionId).toLowerCase());
      if (inq?.tracking_id) clientIdentifiers.add(String(inq.tracking_id).toLowerCase());
      if (inq?.trackingId) clientIdentifiers.add(String(inq.trackingId).toLowerCase());
      if (inq?.project_code) clientIdentifiers.add(String(inq.project_code).toLowerCase());
      if (inq?.projectCode) clientIdentifiers.add(String(inq.projectCode).toLowerCase());
    });
  }

  // Compare Target ID
  if (targetId && targetId !== "undefined" && targetId !== "null") {
    for (const id of clientIdentifiers) {
      if (id === targetId || id.includes(targetId) || targetId.includes(id)) {
        return true;
      }
    }
  }

  // Compare Project Code
  if (targetProjectCode && targetProjectCode !== "mcpa-client" && targetProjectCode !== "undefined") {
    for (const id of clientIdentifiers) {
      if (id === targetProjectCode || id.includes(targetProjectCode) || targetProjectCode.includes(id)) {
        return true;
      }
    }
  }

  // Compare Room Code
  if (targetRoomCode) {
    const cleanRoom = targetRoomCode.replace(/[^a-z0-9]/g, "");
    for (const id of clientIdentifiers) {
      const cleanId = id.replace(/[^a-z0-9]/g, "");
      if (cleanId && cleanId.length >= 3 && cleanRoom.includes(cleanId)) {
        return true;
      }
    }
  }

  // 4. Gather all client names
  const clientNames = new Set();
  if (currentUser?.name) clientNames.add(currentUser.name.toLowerCase().trim());
  if (currentUser?.fullName) clientNames.add(currentUser.fullName.toLowerCase().trim());
  if (currentUser?.full_name) clientNames.add(currentUser.full_name.toLowerCase().trim());
  if (primaryInquiry?.client_name) clientNames.add(primaryInquiry.client_name.toLowerCase().trim());
  if (primaryInquiry?.clientName) clientNames.add(primaryInquiry.clientName.toLowerCase().trim());

  if (Array.isArray(inquiries)) {
    inquiries.forEach((inq) => {
      if (inq?.client_name) clientNames.add(inq.client_name.toLowerCase().trim());
      if (inq?.clientName) clientNames.add(inq.clientName.toLowerCase().trim());
    });
  }

  if (targetName && targetName !== "valued client" && targetName !== "prospective client") {
    for (const name of clientNames) {
      if (name === targetName || name.includes(targetName) || targetName.includes(name)) {
        return true;
      }
      const targetFirst = targetName.split(" ")[0];
      const nameFirst = name.split(" ")[0];
      if (targetFirst && nameFirst && targetFirst === nameFirst && targetFirst.length > 2) {
        return true;
      }
    }
  }

  // 5. Localhost / LAN Developer Testing Fallback:
  // When testing on local dev machine or phone on same Wi-Fi, accept call if on client portal
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
    if (isLocal) {
      return true;
    }
  }

  return false;
}

export default function ClientIncomingCallManager({
  currentUser,
  inquiries = [],
  primaryInquiry,
  activeProject,
  onAnswerCall = () => {},
  showToast = () => {},
}) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [avatarError, setAvatarError] = useState(false);
  const socketRef = useRef(null);

  // Reset avatar error when a new incoming call arrives
  useEffect(() => {
    setAvatarError(false);
  }, [incomingCall?.roomCode]);

  // Resolve Admin / Consultant Avatar (Profile Picture)
  const adminAvatarUrl = useMemo(() => {
    if (!incomingCall) return null;
    const direct =
      incomingCall.adminAvatar ||
      incomingCall.callerAvatar ||
      incomingCall.avatar ||
      incomingCall.photoURL ||
      incomingCall.photoUrl ||
      incomingCall.picture;
    if (direct && typeof direct === "string" && direct.trim() && direct !== "null" && direct !== "undefined") {
      return direct.trim();
    }

    if (typeof window !== "undefined") {
      try {
        const customAvatar = localStorage.getItem("mcpa_admin_avatar");
        if (customAvatar && customAvatar.trim() && customAvatar !== "null") {
          return customAvatar.trim();
        }

        const storedAdmin = localStorage.getItem("mcpa_admin_user");
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          const av = parsed.avatarUrl || parsed.avatar_url || parsed.photoURL || parsed.picture;
          if (av && typeof av === "string" && av.trim()) return av.trim();
        }
      } catch (e) {}
    }

    // Official Engr. Raymart Quirante Google profile photo fallback
    return "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
  }, [incomingCall]);

  // Compute initials for avatar fallback (e.g. "RQ" for Engr. Raymart Quirante)
  const adminInitials = useMemo(() => {
    const raw = incomingCall?.adminName || incomingCall?.callerName || "Engr. Raymart Quirante";
    const cleaned = raw.replace(/^(engr\.|engineer|architect|arch\.|mr\.|ms\.|dr\.)\s*/i, "").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0] || "RQ").slice(0, 2).toUpperCase();
  }, [incomingCall]);

  // Keep latest references for non-reactive access inside event listeners
  const currentUserRef = useRef(currentUser);
  const inquiriesRef = useRef(inquiries);
  const primaryInquiryRef = useRef(primaryInquiry);
  const activeProjectRef = useRef(activeProject);
  const showToastRef = useRef(showToast);
  const handleAnswerRef = useRef(onAnswerCall);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    inquiriesRef.current = inquiries;
  }, [inquiries]);
  useEffect(() => {
    primaryInquiryRef.current = primaryInquiry;
  }, [primaryInquiry]);
  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);
  useEffect(() => {
    handleAnswerRef.current = onAnswerCall;
  }, [onAnswerCall]);

  // Initialize Service Worker for push notifications if supported
  useEffect(() => {
    registerCallServiceWorker();
  }, []);

  // Process and activate an incoming instant call
  const triggerIncomingCall = useCallback((payload) => {
    if (!payload || payload.answered) return;

    // Only respond to calls initiated by Admin
    if (payload.initiatedBy !== "admin") return;

    const startedAt = payload.startedAt || Date.now();
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed >= 180) return; // Expired

    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem("mcpa_client_dismissed_call");
      const dismissedAt = Number(sessionStorage.getItem("mcpa_client_dismissed_call_at") || 0);
      if (dismissed && (dismissed === payload.roomCode || dismissed === "all") && startedAt <= dismissedAt) {
        return;
      }
    } catch (e) {}

    // Verify if targeted to this client
    const isMatch = isCallTargetedToClient(payload, {
      currentUser: currentUserRef.current,
      inquiries: inquiriesRef.current,
      primaryInquiry: primaryInquiryRef.current,
      activeProject: activeProjectRef.current,
    });

    if (!isMatch) {
      console.log("[CLIENT CALL MGR] Call filtered out (not targeted to this client session):", payload);
      return;
    }

    console.log("[CLIENT CALL MGR] Incoming call from Admin accepted for client:", payload);
    setIncomingCall(payload);
    setSecondsRemaining(Math.max(0, 180 - elapsed));

    // Play audio ringtone & trigger vibration
    playIncomingCallRingtone();

    // Show native device OS notification
    showDeviceCallNotification(
      {
        ...payload,
        clientName: payload.callerName || payload.adminName || "Engr. Raymart Quirante",
        projectTitle: payload.projectTitle || "Instant Project Consultation",
      },
      () => {
        handleAnswerRef.current?.(payload);
      }
    );

    showToastRef.current?.(`📞 Incoming Consultation from ${payload.adminName || "MCPA Engineering"}!`);
  }, []);

  // Check active instant call from localStorage (for multi-tab same-browser sync)
  const checkLocalStorageCall = useCallback(() => {
    try {
      const stored = localStorage.getItem("mcpa_instant_call_active");
      if (stored) {
        const parsed = JSON.parse(stored);
        triggerIncomingCall(parsed);
      }
    } catch (e) {}
  }, [triggerIncomingCall]);

  // Connect to WebRTC signaling server ONCE on mount
  useEffect(() => {
    const serverUrl = getSignalingServerUrl();
    console.log(`[CLIENT CALL MGR] Connecting to signaling server at: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 15,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[CLIENT CALL MGR] Connected to signaling server with socket ID:", socket.id);
      socket.emit("get-active-instant-call");
    });

    socket.on("instant-call-incoming", (payload) => {
      triggerIncomingCall(payload);
    });

    socket.on("instant-call-answered", ({ roomCode }) => {
      setIncomingCall((current) => {
        if (current && current.roomCode === roomCode) {
          stopIncomingCallRingtone();
          return null;
        }
        return current;
      });
    });

    socket.on("instant-call-ended", ({ roomCode }) => {
      setIncomingCall((current) => {
        if (current && (current.roomCode === roomCode || !roomCode)) {
          stopIncomingCallRingtone();
          showToastRef.current?.("Consultation call ended by MCPA Engineering.");
          return null;
        }
        return current;
      });
    });

    // Cross-tab window event listener
    const handleLocalAlert = (e) => {
      if (e.detail) {
        triggerIncomingCall(e.detail);
      }
    };

    const handleLocalEnd = (e) => {
      const roomCode = e.detail?.roomCode;
      setIncomingCall((current) => {
        if (current && (!roomCode || current.roomCode === roomCode)) {
          stopIncomingCallRingtone();
          return null;
        }
        return current;
      });
    };

    const handleStorageChange = (e) => {
      if (e.key === "mcpa_instant_call_active") {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            triggerIncomingCall(parsed);
          } catch (err) {}
        } else {
          stopIncomingCallRingtone();
          setIncomingCall(null);
        }
      }
    };

    window.addEventListener("mcpa-instant-call-alert", handleLocalAlert);
    window.addEventListener("mcpa-instant-call-ended", handleLocalEnd);
    window.addEventListener("mcpa-instant-call-answered", handleLocalEnd);
    window.addEventListener("storage", handleStorageChange);

    // Initial check in case call was already initiated
    checkLocalStorageCall();

    // Periodic check every 4s to catch any active call
    const pollInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("get-active-instant-call");
      }
      checkLocalStorageCall();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("mcpa-instant-call-alert", handleLocalAlert);
      window.removeEventListener("mcpa-instant-call-ended", handleLocalEnd);
      window.removeEventListener("mcpa-instant-call-answered", handleLocalEnd);
      window.removeEventListener("storage", handleStorageChange);
      stopIncomingCallRingtone();
      if (socket) socket.disconnect();
    };
  }, [triggerIncomingCall, checkLocalStorageCall]);

  // 180-second countdown timer
  useEffect(() => {
    if (!incomingCall) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopIncomingCallRingtone();
          setIncomingCall(null);
          showToastRef.current?.("Consultation call timed out.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingCall]);

  const handleAnswer = () => {
    if (!incomingCall) return;
    const callToAnswer = { ...incomingCall };

    stopIncomingCallRingtone();
    setIncomingCall(null);

    try {
      localStorage.removeItem("mcpa_instant_call_active");
    } catch (e) {}

    // Notify signaling server
    if (socketRef.current) {
      socketRef.current.emit("instant-call-answered", {
        roomCode: callToAnswer.roomCode,
        answeredBy: currentUser?.name || currentUser?.fullName || "Client",
      });
    }

    // Trigger local events
    window.dispatchEvent(
      new CustomEvent("mcpa-instant-call-answered", {
        detail: { ...callToAnswer, answered: true },
      })
    );

    // Launch GoogleMeetRoom
    handleAnswerRef.current?.(callToAnswer);
  };

  const handleDecline = () => {
    if (!incomingCall) return;
    const roomCode = incomingCall.roomCode;

    stopIncomingCallRingtone();

    try {
      localStorage.removeItem("mcpa_instant_call_active");
      sessionStorage.setItem("mcpa_client_dismissed_call", roomCode);
      sessionStorage.setItem("mcpa_client_dismissed_call_at", String(Date.now()));
    } catch (e) {}

    if (socketRef.current) {
      socketRef.current.emit("instant-call-ended", { roomCode, reason: "declined" });
    }

    window.dispatchEvent(
      new CustomEvent("mcpa-instant-call-ended", {
        detail: { roomCode, reason: "declined" },
      })
    );

    setIncomingCall(null);
    showToastRef.current?.("Consultation call declined.");
  };

  if (!incomingCall) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const adminName = incomingCall.adminName || incomingCall.callerName || "Engr. Raymart Quirante";
  const adminRole = incomingCall.adminRole || incomingCall.callerRole || "Lead Project Engineer & Consultant";
  const projectScope = incomingCall.projectTitle || "Architectural Review & Progress Consultation";
  const projectCode = incomingCall.projectCode || "MCPA-CLIENT";

  return (
    <aside
      role="dialog"
      aria-labelledby="client-incoming-call-title"
      aria-modal="true"
      className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999999] pointer-events-none flex justify-center sm:block"
    >
      <div className="w-full sm:w-[410px] pointer-events-auto overflow-hidden rounded-2xl bg-white/95 dark:bg-[#111317]/95 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-800 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),0_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.7),0_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-5">
        
        <div className="p-4 sm:p-5">
          {/* Header Row: Live Status & Countdown */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-emerald-700 dark:text-emerald-400">
                MCPA Live Call
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Incoming Consultation
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 text-xs font-mono tabular-nums font-semibold">
              <Clock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Caller Identity Block */}
          <div className="flex items-center gap-3.5">
            {/* Admin PFP / Avatar with Verified Live Badge */}
            <div className="relative shrink-0">
              <div className="w-[52px] h-[52px] rounded-full overflow-hidden ring-2 ring-neutral-200/90 dark:ring-neutral-700/80 shadow-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {adminAvatarUrl && !avatarError ? (
                  <img
                    src={adminAvatarUrl}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold text-base tracking-wider">
                    {adminInitials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-white dark:ring-[#111317]">
                <Video className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2
                  id="client-incoming-call-title"
                  className="text-sm font-bold text-neutral-900 dark:text-white truncate tracking-tight"
                >
                  {adminName}
                </h2>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" title="Verified MCPA Consultant" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-medium">
                {adminRole}
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                MCPA Engineering &amp; Project Advisory
              </p>
            </div>
          </div>

          {/* Consultation Scope & Project Card */}
          <div className="mt-3.5 mb-3 p-3 rounded-xl bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Consultation Scope</span>
              <span className="font-mono text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 px-2 py-0.5 rounded">
                Code: {projectCode}
              </span>
            </div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {projectScope}
            </div>
          </div>

          {/* Audio Tap-to-Check Banner */}
          <div
            onClick={() => playIncomingCallRingtone()}
            role="button"
            tabIndex={0}
            className="mb-4 py-2 px-3 rounded-xl bg-neutral-100/70 hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/50 text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between cursor-pointer transition-colors group select-none"
            title="Click to check or unmute ringtone"
          >
            <span className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Ringtone ringing... Tap to verify audio</span>
            </span>
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white underline-offset-2 group-hover:underline">
              Check sound
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDecline}
              className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 dark:bg-neutral-800 dark:hover:bg-rose-950/30 dark:text-neutral-300 dark:hover:text-rose-400 border border-neutral-200/80 hover:border-rose-200 dark:border-neutral-700 dark:hover:border-rose-900/40 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>

            <button
              type="button"
              onClick={handleAnswer}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/25 active:scale-[0.98]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Call</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
