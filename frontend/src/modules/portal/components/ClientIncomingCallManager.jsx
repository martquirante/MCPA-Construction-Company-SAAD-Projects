"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  PhoneCall,
  PhoneOff,
  Clock,
  Video,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import {
  playIncomingCallRingtone,
  stopIncomingCallRingtone,
  showDeviceCallNotification,
  registerCallServiceWorker,
  hasCallNotificationPermission,
} from "@/modules/admin/utils/deviceCallNotification";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";

export default function ClientIncomingCallManager({
  currentUser,
  primaryInquiry,
  activeProject,
  onAnswerCall = () => {},
  showToast = () => {},
}) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const socketRef = useRef(null);
  const handleAnswerRef = useRef(null);

  handleAnswerRef.current = onAnswerCall;

  // Initialize Service Worker for push notifications if supported
  useEffect(() => {
    registerCallServiceWorker();
  }, []);

  // Connect to WebRTC signaling server & listen for incoming calls from Admin
  useEffect(() => {
    const serverUrl = getSignalingServerUrl();
    console.log(`[CLIENT CALL MGR] Connecting to signaling server at: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[CLIENT CALL MGR] Connected to signaling server with socket ID:", socket.id);
      socket.emit("get-active-instant-call");
    });

    socket.on("instant-call-incoming", (payload) => {
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

      // Verify if this call is targeted to this client
      const currentEmail = (currentUser?.email || "").toLowerCase().trim();
      const currentName = (currentUser?.name || currentUser?.fullName || "").toLowerCase().trim();
      const targetEmail = (payload.targetClientEmail || "").toLowerCase().trim();
      const targetName = (payload.targetClientName || payload.clientName || "").toLowerCase().trim();
      const targetId = String(payload.targetClientId || "").toLowerCase().trim();

      const currentSubId = String(
        primaryInquiry?.submission_id ||
        primaryInquiry?.id ||
        activeProject?.project_code ||
        ""
      ).toLowerCase().trim();

      let isMatch = false;

      if (targetEmail && currentEmail && targetEmail === currentEmail) {
        isMatch = true;
      } else if (targetId && currentSubId && (targetId === currentSubId || currentSubId.includes(targetId))) {
        isMatch = true;
      } else if (targetName && currentName && (targetName === currentName || currentName.includes(targetName))) {
        isMatch = true;
      } else if (!targetEmail && !targetId && currentEmail) {
        // Broadcast admin call with no specific email filter
        isMatch = true;
      }

      if (!isMatch) {
        console.log("[CLIENT CALL MGR] Call ignored (not targeted to this client):", payload);
        return;
      }

      console.log("[CLIENT CALL MGR] Incoming call from Admin matched current client:", payload);
      setIncomingCall(payload);
      setSecondsRemaining(Math.max(0, 180 - elapsed));

      // Play audio ringtone & trigger mobile vibration
      playIncomingCallRingtone();

      // Show device OS notification if permitted
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

      showToast(`📞 Incoming Consultation from ${payload.adminName || "MCPA Engineering"}!`);
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
        if (current && current.roomCode === roomCode) {
          stopIncomingCallRingtone();
          showToast("Consultation call ended by MCPA Engineering.");
          return null;
        }
        return current;
      });
    });

    // Local window event listener for multi-tab sync
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

    window.addEventListener("mcpa-instant-call-ended", handleLocalEnd);
    window.addEventListener("mcpa-instant-call-answered", handleLocalEnd);

    return () => {
      window.removeEventListener("mcpa-instant-call-ended", handleLocalEnd);
      window.removeEventListener("mcpa-instant-call-answered", handleLocalEnd);
      stopIncomingCallRingtone();
      if (socket) socket.disconnect();
    };
  }, [currentUser, primaryInquiry, activeProject, showToast]);

  // 180-second countdown timer
  useEffect(() => {
    if (!incomingCall) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopIncomingCallRingtone();
          setIncomingCall(null);
          showToast("Consultation call timed out.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingCall, showToast]);

  const handleAnswer = () => {
    if (!incomingCall) return;
    const callToAnswer = { ...incomingCall };

    stopIncomingCallRingtone();
    setIncomingCall(null);

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

    // Execute callback to launch GoogleMeetRoom
    onAnswerCall(callToAnswer);
  };

  const handleDecline = () => {
    if (!incomingCall) return;
    const roomCode = incomingCall.roomCode;

    stopIncomingCallRingtone();

    try {
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
    showToast("Consultation call declined.");
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
      <div className="w-full sm:w-[420px] rounded-2xl bg-[#0d0f15]/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-xl p-5 sm:p-6 pointer-events-auto animate-in slide-in-from-bottom-6 duration-300 ring-1 ring-amber-500/20">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Glowing Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20">
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
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  MCPA Live Call
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
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
                {incomingCall.adminRole || "Lead Project Engineer"}
              </p>
            </div>
          </div>
        </div>

        {/* Project Card Context */}
        <div className="mb-5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Consultation Scope
          </div>
          <div className="text-xs font-semibold text-neutral-200 truncate">
            {incomingCall.projectTitle || "Architectural Review & Progress Discussion"}
          </div>
          <div className="text-[10px] font-mono text-amber-400/90">
            Project Code: {incomingCall.projectCode || "MCPA-CONSULTATION"}
          </div>
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
