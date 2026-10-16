"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  PhoneCall,
  PhoneOff,
  Clock,
  Video,
  Bell,
  ShieldCheck,
  User,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  registerCallServiceWorker,
  requestCallNotificationPermission,
  hasCallNotificationPermission,
  playIncomingCallRingtone,
  stopIncomingCallRingtone,
  showDeviceCallNotification,
} from "@/modules/admin/utils/deviceCallNotification";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";

export default function AdminIncomingCallManager({
  currentUser,
  onAnswerCall = () => {},
  showToast = () => {},
}) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const socketRef = useRef(null);
  const incomingCallRef = useRef(null);
  const handleAnswerRef = useRef(null);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // 1. Initialize Service Worker & check Notification permission
  useEffect(() => {
    registerCallServiceWorker();
    setHasNotifPermission(hasCallNotificationPermission());
  }, []);

  // 2. Connect to Socket.IO signaling hub for real-time instant call alerts
  useEffect(() => {
    const serverUrl = getSignalingServerUrl();
    console.log(`[INCOMING CALL MGR] Connecting to signaling server at: ${serverUrl}`);
    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[INCOMING CALL MGR] Connected to signaling server:", socket.id);
      socket.emit("get-active-instant-call");
    });

    // Client started an instant call
    socket.on("instant-call-incoming", (payload) => {
      if (!payload || payload.answered) return;
      if (payload.initiatedBy === "admin") return;

      const startedAt = payload.startedAt || Date.now();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      if (elapsed >= 180) return; // Expired

      // Check if dismissed in this session (only ignore if call started BEFORE or AT dismissal time)
      try {
        const dismissed = sessionStorage.getItem("mcpa_dismissed_instant_call");
        const dismissedAt = Number(sessionStorage.getItem("mcpa_dismissed_instant_call_at") || 0);
        if (dismissed && (dismissed === payload.roomCode || dismissed === "all") && startedAt <= dismissedAt) {
          return;
        }
      } catch (e) {}

      console.log("[INCOMING CALL MGR] Incoming instant call received:", payload);
      setIncomingCall(payload);
      setSecondsRemaining(Math.max(0, 180 - elapsed));

      // Play universfield-ringtone-030-437513.mp3 ringtone in loop & vibrate device
      playIncomingCallRingtone();

      // Show native OS/device browser notification
      showDeviceCallNotification(payload, () => {
        handleAnswerRef.current?.(payload);
      });

      showToast(`📞 Incoming Instant Consultation from ${payload.clientName || "Client"}!`);
    });

    // Call was answered
    socket.on("instant-call-answered", ({ roomCode }) => {
      setIncomingCall((current) => {
        if (current && current.roomCode === roomCode) {
          stopIncomingCallRingtone();
          return null;
        }
        return current;
      });
    });

    // Call ended or cancelled by client
    socket.on("instant-call-ended", ({ roomCode }) => {
      setIncomingCall((current) => {
        if (current && current.roomCode === roomCode) {
          stopIncomingCallRingtone();
          showToast("Instant call was cancelled by client.");
          return null;
        }
        return current;
      });
    });

    // Listen to local window events for multi-tab sync
    const handleLocalAlert = (e) => {
      if (e.detail && e.detail.active && !e.detail.answered) {
        setIncomingCall(e.detail);
        playIncomingCallRingtone();
        showDeviceCallNotification(e.detail, () => handleAnswerRef.current?.(e.detail));
      }
    };

    const handleLocalEnd = () => {
      stopIncomingCallRingtone();
      setIncomingCall(null);
    };

    window.addEventListener("mcpa-instant-call-alert", handleLocalAlert);
    window.addEventListener("mcpa-instant-call-ended", handleLocalEnd);
    window.addEventListener("mcpa-instant-call-answered", handleLocalEnd);

    // Message from Service Worker (when user clicks native notification on device)
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "ANSWER_INSTANT_CALL") {
        if (incomingCallRef.current) {
          handleAnswerRef.current?.(incomingCallRef.current);
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      stopIncomingCallRingtone();
      window.removeEventListener("mcpa-instant-call-alert", handleLocalAlert);
      window.removeEventListener("mcpa-instant-call-ended", handleLocalEnd);
      window.removeEventListener("mcpa-instant-call-answered", handleLocalEnd);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      socket.disconnect();
    };
  }, []);

  // 3. Countdown timer for auto-ending unanswered calls (3 minutes)
  useEffect(() => {
    if (!incomingCall) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopIncomingCallRingtone();
          setIncomingCall(null);
          showToast("Instant consultation request timed out.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingCall]);

  // Answer call
  const handleAnswer = (call = incomingCallRef.current || incomingCall) => {
    if (!call) return;
    stopIncomingCallRingtone();

    const answeredPayload = {
      ...call,
      answered: true,
      adminJoined: true,
      answeredBy: currentUser?.name || "Engr. Raymart Quirante",
    };

    // Notify backend & all sockets
    if (socketRef.current?.connected) {
      socketRef.current.emit("instant-call-answered", {
        roomCode: call.roomCode,
        answeredBy: answeredPayload.answeredBy,
      });
    }

    try {
      localStorage.setItem("mcpa_instant_call_active", JSON.stringify(answeredPayload));
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-answered", { detail: answeredPayload }));
    } catch (e) {}

    setIncomingCall(null);
    onAnswerCall(call);
    showToast(`Joining Instant Consultation with ${call.clientName || "Client"}...`);
  };
  handleAnswerRef.current = handleAnswer;

  // Decline call
  const handleDecline = () => {
    if (!incomingCall) return;
    stopIncomingCallRingtone();

    const roomCode = incomingCall.roomCode;
    try {
      sessionStorage.setItem("mcpa_dismissed_instant_call", roomCode);
      sessionStorage.setItem("mcpa_dismissed_instant_call_at", String(Date.now()));
    } catch (e) {}

    if (socketRef.current?.connected) {
      socketRef.current.emit("instant-call-ended", { roomCode });
    }

    setIncomingCall(null);
    showToast("Instant consultation alert dismissed.");
  };

  // Request browser notification permission
  const handleEnableNotifications = async () => {
    // Prime HTML5 Audio for browser autoplay policy with user interaction
    try {
      const audio = new Audio("/sounds/universfield-ringtone-030-437513.mp3");
      audio.volume = 0;
      await audio.play().then(() => audio.pause()).catch(() => {});
    } catch (e) {}

    const res = await requestCallNotificationPermission();
    if (res === "granted") {
      setHasNotifPermission(true);
      showToast("Device notifications & incoming call ringtones enabled!");
    } else {
      showToast("Notification permission was denied in your browser settings.");
    }
  };

  return (
    <>
      {/* Sleek Persistent Notification Permission Bar if not yet granted */}
      {!hasNotifPermission && (
        <div className="fixed top-3 right-3 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 dark:bg-white/10 hover:bg-neutral-800 text-white backdrop-blur-md border border-amber-500/30 text-xs font-mono shadow-xl transition-all hover:scale-105 cursor-pointer group"
            title="Enable device notifications so incoming calls ring even when browser is closed or in another tab"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <Bell className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-semibold text-amber-300">Allow Call Ringtone &amp; Notifs</span>
          </button>
        </div>
      )}

      {/* FULL-STAGE INCOMING CALL ALERT DISPATCH MODAL (HIGH PRIORITY) */}
      {incomingCall && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 sm:p-8 shadow-[0_24px_70px_rgba(245,158,11,0.25)] text-white overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Light Rail */}
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-amber-500 via-emerald-400 to-amber-500" />

            {/* Pulsing Acoustic Glow Ring */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Header: Sonar Ping & Timer */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Incoming Instant Consultation
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Caller Info */}
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              {/* Animated Avatar / Customer Profile Photo */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-amber-500 via-amber-400 to-emerald-500 p-1 shadow-2xl flex items-center justify-center animate-bounce">
                  <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-3xl font-bold font-mono text-amber-400 overflow-hidden ring-2 ring-white/10">
                    {incomingCall.clientAvatar ? (
                      <img
                        src={incomingCall.clientAvatar}
                        alt={incomingCall.clientName || "Customer"}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span>{(incomingCall.clientName || "C").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-emerald-500 text-neutral-950 shadow-lg ring-2 ring-neutral-900">
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 font-bold mb-1">
                  <span>Customer Calling</span>
                </div>
                <h3 className="text-2xl font-black font-mono text-white tracking-tight">
                  {incomingCall.clientName || "Valued Client"}
                </h3>
                {(incomingCall.clientEmail || incomingCall.clientPhone) && (
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">
                    {incomingCall.clientEmail} {incomingCall.clientPhone ? `· ${incomingCall.clientPhone}` : ""}
                  </p>
                )}
                <p className="text-xs font-sans text-neutral-300 mt-1">
                  Project: <strong className="text-white font-semibold">{incomingCall.projectTitle || "Architectural Project Consultation"}</strong>
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Code: <span className="text-white font-bold">{incomingCall.projectCode || "MCPA-2026"}</span></span>
                  <span className="text-white/20">|</span>
                  <span>Room: {incomingCall.roomCode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 pt-1">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Ringtone active &amp; ringing</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDecline}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(incomingCall)}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-mono font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Answer Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
