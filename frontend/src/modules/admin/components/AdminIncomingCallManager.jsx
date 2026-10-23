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
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-neutral-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white/95 dark:bg-[#12141a]/95 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-800 p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
            {/* Header: Status & Timer */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Incoming Instant Consultation
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono text-xs font-semibold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>
                  {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Caller Info */}
            <div className="py-5 flex flex-col items-center text-center space-y-3">
              {/* Customer Profile Photo / Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-3 ring-neutral-200 dark:ring-neutral-700 shadow-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {incomingCall.clientAvatar ? (
                    <img
                      src={incomingCall.clientAvatar}
                      alt={incomingCall.clientName || "Customer"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-neutral-700 dark:text-neutral-200">
                      {(incomingCall.clientName || "C").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-white dark:ring-[#12141a]">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                  <span>Client Calling Portal</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {incomingCall.clientName || "Valued Client"}
                </h3>
                {(incomingCall.clientEmail || incomingCall.clientPhone) && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {incomingCall.clientEmail} {incomingCall.clientPhone ? `· ${incomingCall.clientPhone}` : ""}
                  </p>
                )}
                
                {/* Project Context Box */}
                <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800/80 text-left max-w-sm mx-auto">
                  <div className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">
                    Consultation Project
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {incomingCall.projectTitle || "Architectural Project Consultation"}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-1 mt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                    <span>Code: <strong className="text-neutral-700 dark:text-neutral-200">{incomingCall.projectCode || "MCPA-2026"}</strong></span>
                    <span>Room: {incomingCall.roomCode}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Ringtone ringing on system</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
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
                onClick={() => handleAnswer(incomingCall)}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Answer Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
