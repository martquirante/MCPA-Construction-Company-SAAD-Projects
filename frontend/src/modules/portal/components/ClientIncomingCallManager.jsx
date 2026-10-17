"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const socketRef = useRef(null);

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

  return (
    <aside
      role="dialog"
      aria-labelledby="client-incoming-call-title"
      aria-modal="true"
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999999] flex items-end sm:items-center justify-center p-4 sm:p-0 pointer-events-none"
    >
      <div className="w-full sm:w-[420px] rounded-2xl bg-[#0d0f15]/95 border border-amber-500/50 text-white shadow-2xl backdrop-blur-xl p-5 sm:p-6 pointer-events-auto animate-in slide-in-from-bottom-6 duration-300 ring-2 ring-amber-500/30">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Glowing Avatar with Animated Ripple */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/30 animate-pulse">
                <div className="w-full h-full rounded-[10px] bg-[#12141c] flex items-center justify-center font-bold font-mono text-amber-400 text-base">
                  M
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                  MCPA Live Call
                </span>
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  {formattedTime}
                </span>
              </div>
              <h2
                id="client-incoming-call-title"
                className="text-sm font-bold text-white tracking-tight mt-1"
              >
                {incomingCall.adminName || "Engr. Raymart Quirante"}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {incomingCall.adminRole || "Lead Project Engineer & Consultant"}
              </p>
            </div>
          </div>
        </div>

        {/* Project Card Context */}
        <div className="mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Consultation Scope
          </div>
          <div className="text-xs font-semibold text-neutral-200 truncate">
            {incomingCall.projectTitle || "Architectural Review & Progress Discussion"}
          </div>
          <div className="text-[10px] font-mono text-amber-400/90 flex items-center justify-between">
            <span>Project Code: {incomingCall.projectCode || "MCPA-CONSULTATION"}</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Calling Now
            </span>
          </div>
        </div>

        {/* Audio Tap-to-Unmute Banner */}
        <div
          onClick={() => playIncomingCallRingtone()}
          className="mb-4 py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-mono flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
          title="Click to ensure ringtone audio is playing"
        >
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Ringtone ringing... Tap here to unmute sound</span>
          </span>
          <span className="text-[10px] font-bold uppercase underline">Test</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDecline}
            className="py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={handleAnswer}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            <Video className="w-4 h-4 fill-current/20" />
            <span>Join Call</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
