"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smile,
  Hand,
  MoreVertical,
  PhoneOff,
  MessageSquare,
  Users,
  Info,
  Shield,
  X,
  Send,
  Copy,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  AlertCircle,
  Zap,
  PhoneCall,
  SwitchCamera,
  Globe,
  Volume2,
  Star,
  CheckCircle2,
} from "lucide-react";
import { io } from "socket.io-client";
import { WebRTCPeerManager } from "@/modules/portal/utils/webrtcPeerManager";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";
import { playOutgoingRingbackTone } from "@/modules/portal/utils/outgoingRingbackTone";
import {
  formatMeetingDuration,
  recordConcludedMeeting,
} from "@/modules/portal/utils/meetingHistoryService";

// High-grade WebRTC and hardware DSP constraints for deep noise isolation and echo suppression
const OPTIMAL_AUDIO_CONSTRAINTS = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  // Specialized Chromium & Mobile WebKit DSP parameters
  googEchoCancellation: { ideal: true },
  googAutoGainControl: { ideal: true },
  googNoiseSuppression: { ideal: true },
  googHighpassFilter: { ideal: true },       // Strips low-frequency motor/traffic rumble & desk knocks
  googTypingNoiseDetection: { ideal: true },  // Damps sharp keyboard clicks and mechanical taps
  googAudioMirroring: { ideal: false },
};

const FALLBACK_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Creates an in-browser Web Audio DSP filter chain that passes microphone audio through:
 * 1. 85Hz High-Pass Filter (eliminates AC hum, passing cars, desk thumps, breath plosives)
 * 2. 7500Hz Low-Pass Filter (eliminates high frequency coil hiss and screeching)
 * 3. 2800Hz Peaking Filter (+2.5dB clarity boost for human speech frequencies)
 * 4. Ultra-fast 3ms Dynamics Compressor / Limiter (clamps sudden loud burst noises like dog barks, car horns, or dropped objects)
 * 
 * Runs entirely on the browser's native audio rendering thread with near 0% CPU footprint.
 * @param {MediaStreamTrack} rawMicTrack 
 * @returns {{ track: MediaStreamTrack, cleanup: () => void, audioCtx: AudioContext | null }}
 */
function createNoiseFilteredAudioTrack(rawMicTrack) {
  if (!rawMicTrack || typeof window === "undefined") {
    return { track: rawMicTrack, cleanup: () => {}, audioCtx: null };
  }

  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) {
      return { track: rawMicTrack, cleanup: () => {}, audioCtx: null };
    }

    const audioCtx = new AudioCtxClass({ latencyHint: "interactive" });
    const source = audioCtx.createMediaStreamSource(new MediaStream([rawMicTrack]));

    // 1. High-Pass Filter: Cuts out frequencies under 85Hz (engine rumbles, AC vibrations, mic bump pops)
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 85;
    highpass.Q.value = 0.707;

    // 2. Low-Pass Filter: Cuts out frequencies above 7500Hz (extreme electrical hiss, piercing whine)
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 7500;
    lowpass.Q.value = 0.707;

    // 3. Peaking Speech Presence EQ: +2.5dB at 2800Hz to make voice intelligible and clear
    const speechPresence = audioCtx.createBiquadFilter();
    speechPresence.type = "peaking";
    speechPresence.frequency.value = 2800;
    speechPresence.gain.value = 2.5;
    speechPresence.Q.value = 1.2;

    // 4. Dynamics Compressor / Fast Limiter:
    // Clamps sudden loud peaks (dog barking, horns, door slamming) before they blast the listener
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -24; // dB
    limiter.knee.value = 20;       // dB
    limiter.ratio.value = 12;      // High compression on bursts
    limiter.attack.value = 0.003;  // 3 milliseconds instant attack clamp
    limiter.release.value = 0.20;  // 200 milliseconds release

    // Connect node chain: source -> highpass -> lowpass -> speechPresence -> limiter -> destination
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(speechPresence);
    speechPresence.connect(limiter);

    const destination = audioCtx.createMediaStreamDestination();
    limiter.connect(destination);

    const filteredTrack = destination.stream.getAudioTracks()[0];
    if (filteredTrack) {
      filteredTrack.enabled = rawMicTrack.enabled;
    }

    const cleanup = () => {
      try {
        if (filteredTrack) filteredTrack.stop();
        audioCtx.close();
      } catch (e) {}
    };

    console.log("[WEBRTC] Active 3-layer noise reduction & speech limiter chain initialized.");
    return { track: filteredTrack || rawMicTrack, cleanup, audioCtx };
  } catch (err) {
    console.warn("[WEBRTC] Web Audio noise suppression setup failed, using raw track:", err);
    return { track: rawMicTrack, cleanup: () => {}, audioCtx: null };
  }
}

export default function GoogleMeetRoom({
  roomCode = "fvv-rdoo-wfn",
  currentUser,
  activeProject,
  onLeave,
  onAutoEndTimeout,
  isInstantMeeting = false,
  isAdmin = false,
  showToast = () => {},
}) {
  const userRole = (currentUser?.role || "").toUpperCase();
  const isUserAdmin = isAdmin || userRole.includes("ADMIN") || userRole.includes("ENGINEER");

  const displayName =
    currentUser?.name || currentUser?.fullName || activeProject?.client_name || "Raymart Quirante";
  const userAvatar = currentUser?.avatar_url || currentUser?.avatarUrl;

  // Call Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"

  // WebRTC & Socket.IO Signaling State
  const socketRef = useRef(null);
  const peerManagerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remotePeerRef = useRef(null);
  const userInfoRef = useRef({ displayName, userRole, isUserAdmin, userAvatar, currentUser, showToast });

  useEffect(() => {
    userInfoRef.current = { displayName, userRole, isUserAdmin, userAvatar, currentUser, showToast };
  });

  const [remoteStream, setRemoteStream] = useState(null);
  const [remotePeer, setRemotePeer] = useState(null);
  const [remoteMediaState, setRemoteMediaState] = useState({
    isMicOn: true,
    isVideoOn: true,
    isScreenSharing: false,
  });
  const [p2pConnectionState, setP2pConnectionState] = useState("idle"); // 'idle' | 'connecting' | 'connected' | 'disconnected'
  const [isRemoteHandRaised, setIsRemoteHandRaised] = useState(false);
  const [peerLeftInfo, setPeerLeftInfo] = useState(null); // { name, time } when remote participant leaves

  // Instant Meeting 3-Minute Timeout & Admin Sync State
  const [instantTimer, setInstantTimer] = useState(180); // 3 minutes = 180 seconds
  const [isCallAnswered, setIsCallAnswered] = useState(isUserAdmin);

  // Meeting Call Duration & Pre-Leave Rating State
  const callStartTimeRef = useRef(Date.now());
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [isLeaveRatingModalOpen, setIsLeaveRatingModalOpen] = useState(false);
  const [leaveRating, setLeaveRating] = useState(5);
  const [leaveHoverRating, setLeaveHoverRating] = useState(0);
  const [leaveNote, setLeaveNote] = useState("");
  const hasRecordedSessionRef = useRef(false);

  useEffect(() => {
    callStartTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDurationSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remotePeerName =
    remotePeer?.name ||
    (isUserAdmin
      ? (activeProject?.client_name || "Client Participant")
      : "Engr. Raymart Quirante");

  const remotePeerAvatar =
    remotePeer?.avatarUrl ||
    remotePeer?.avatar_url ||
    (!isUserAdmin
      ? (typeof window !== "undefined" &&
          (localStorage.getItem("mcpa_admin_avatar") ||
            JSON.parse(localStorage.getItem("mcpa_admin_user") || "null")?.avatarUrl ||
            JSON.parse(localStorage.getItem("mcpa_admin_user") || "null")?.avatar_url)) ||
        "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
      : null);

  const hasRemotePeer = Boolean(remotePeer || (remoteStream && isCallAnswered));

  // AUTOMATIC FULLSCREEN BY DEFAULT & FLOATING PIP MODE
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFloatingPiP, setIsFloatingPiP] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll only when full-screen and NOT floating
  useEffect(() => {
    if (isFullscreen && !isFloatingPiP && mounted && typeof document !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullscreen, isFloatingPiP, mounted]);

  const isLeavingRef = useRef(false);
  const ringbackToneRef = useRef(null);

  // AUTO PICTURE-IN-PICTURE & FLOATING MINI-WINDOW ON TAB SWITCH / DEVICE ACTIVITY
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isLeavingRef.current) return;
      if (document.hidden) {
        setIsFloatingPiP(true);
        try {
          const activeVideo = isScreenSharing ? screenVideoRef.current : localVideoRef.current;
          if (
            activeVideo &&
            document.pictureInPictureEnabled &&
            !document.pictureInPictureElement &&
            typeof activeVideo.requestPictureInPicture === "function"
          ) {
            await activeVideo.requestPictureInPicture();
          }
        } catch (e) {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isScreenSharing]);

  // When returning from native PiP back to tab
  useEffect(() => {
    const activeVideo = isScreenSharing ? screenVideoRef.current : localVideoRef.current;
    if (!activeVideo) return;
    const handleLeavePiP = () => {};
    activeVideo.addEventListener("leavepictureinpicture", handleLeavePiP);
    return () => {
      activeVideo.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, [isScreenSharing]);

  // Theme Sync State - read active document state immediately
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      if (typeof document !== "undefined") {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };
    checkTheme();
    window.addEventListener("mcpa-theme-change", checkTheme);
    return () => window.removeEventListener("mcpa-theme-change", checkTheme);
  }, []);

  const performActualLeave = (rating = null, note = "") => {
    if (!hasRecordedSessionRef.current) {
      hasRecordedSessionRef.current = true;
      try {
        const clientName = activeProject?.client_name || (!isUserAdmin ? (currentUser?.name || "Raymart Quirante") : "Client Participant");
        const projectTitle = activeProject?.project_title || (isInstantMeeting ? "Instant Online Consultation" : "Online Video Engineering Review");
        const projectCode = activeProject?.project_code || "MCPA-2026-MQ04B";
        const finalDurationSec = Math.max(callDurationSeconds, 1);
        const formattedDur = formatMeetingDuration(finalDurationSec);

        recordConcludedMeeting({
          roundTitle: isInstantMeeting
            ? "Instant Online Consultation"
            : (activeProject?.project_title ? `${activeProject.project_title} Consultation` : "Online Video Engineering Review"),
          mode: isInstantMeeting ? "Instant Online Meeting" : "Scheduled Online Video",
          durationSeconds: finalDurationSec,
          rating: typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : 5,
          clientNote: note || (isInstantMeeting ? "Instant video consultation concluded with engineering team." : "Scheduled video consultation concluded."),
          minutes: note || `Live video deliberation held via ${isInstantMeeting ? "Instant Room" : "Google Meet"}. Duration: ${formattedDur}.`,
          venue: isInstantMeeting ? "MCPA Instant WebRTC Room" : `Google Meet · ${roomCode}`,
          leadConsultant: "Engr. Raymart Quirante",
          leadRole: "Lead Project Engineer & Consultant",
          clientName,
          clientEmail: activeProject?.client_email || "martquirante@gmail.com",
          projectCode,
          projectTitle,
        });
      } catch (e) {
        console.warn("[MCPA] Failed to record concluded meeting:", e);
      }
    }

    isLeavingRef.current = true;
    if (ringbackToneRef.current) {
      ringbackToneRef.current.stop();
      ringbackToneRef.current = null;
    }
    try {
      if (typeof document !== "undefined" && document.pictureInPictureElement && document.exitPictureInPicture) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    // Fully purge instant call state across localStorage, sessionStorage, and window events
    try {
      localStorage.removeItem("mcpa_instant_call_active");
      sessionStorage.setItem("mcpa_dismissed_instant_call", roomCode || "all");
      sessionStorage.setItem("mcpa_call_recently_left", String(Date.now()));
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-ended", { detail: { roomCode } }));
    } catch (e) {}

    if (socketRef.current) {
      try {
        socketRef.current.emit("instant-call-ended", { roomCode });
        socketRef.current.emit("leave-room", { roomCode });
        setTimeout(() => {
          socketRef.current?.disconnect();
        }, 500);
      } catch (e) {}
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.close();
    }

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    if (screenVideoRef.current?.srcObject) {
      screenVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    onLeave && onLeave();
  };

  const handleLeaveCall = () => {
    // When leaving an active consultation, prompt for rating and deliberation note before leaving
    if (!hasRecordedSessionRef.current) {
      setIsLeaveRatingModalOpen(true);
      return;
    }
    performActualLeave(null, "");
  };

  // WebRTC Peer Connection & Socket.IO Signaling Lifecycle (Persistently Mounted)
  useEffect(() => {
    if (!mounted || !roomCode) return;

    const serverUrl = getSignalingServerUrl();
    console.log(`[WEBRTC] Connecting to signaling server at: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      timeout: 15000,
    });
    socketRef.current = socket;

    const peerManager = new WebRTCPeerManager({
      socket,
      roomCode,
      currentUser: {
        id: userInfoRef.current.currentUser?.id,
        name: userInfoRef.current.displayName,
        role: userInfoRef.current.userRole || (userInfoRef.current.isUserAdmin ? "ADMIN" : "CLIENT"),
        avatarUrl: userInfoRef.current.userAvatar,
      },
      onRemoteStream: (stream) => {
        console.log("[WEBRTC] Remote media stream received:", stream.id, stream.getTracks().map((t) => `${t.kind}:${t.enabled}`));
        setRemoteStream(stream);
        setIsCallAnswered(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
          if (remoteAudioRef.current.srcObject !== stream) {
            remoteAudioRef.current.srcObject = stream;
          }
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
      },
      onConnectionStateChange: (state) => {
        setP2pConnectionState(state);
        if (state === "connected") {
          setIsCallAnswered(true);
          userInfoRef.current.showToast?.("Live P2P encrypted media stream connected!");
        }
      },
      onPeerLeft: () => {
        const departedName = remotePeerRef.current?.name || remotePeerName || "Participant";
        setRemoteStream(null);
        setRemotePeer(null);
        remotePeerRef.current = null;
        setIsRemoteHandRaised(false);
        setPeerLeftInfo({
          name: departedName,
          time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        });
        playLeaveChime();
        userInfoRef.current.showToast?.(`⚠️ ${departedName} left the consultation.`);
      },
    });
    peerManagerRef.current = peerManager;

    // Immediately pre-init peer connection if local stream is already available
    if (localStreamRef.current) {
      peerManager.initPeerConnection(localStreamRef.current);
    }

    const joinRoomPayload = () => {
      const u = userInfoRef.current;
      return {
        roomCode,
        user: {
          id: u.currentUser?.id,
          name: u.displayName,
          role: u.userRole || (u.isUserAdmin ? "ADMIN" : "CLIENT"),
          avatarUrl: u.userAvatar,
        },
        role: u.isUserAdmin ? "admin" : "client",
      };
    };

    socket.on("connect", () => {
      console.log(`[WEBRTC] Connected to signaling server with socket ID: ${socket.id}`);
      socket.emit("join-room", joinRoomPayload());
    });

    if (socket.connected) {
      socket.emit("join-room", joinRoomPayload());
    }

    // Newcomer receives existing participants
    socket.on("room-joined", ({ participants }) => {
      if (participants && participants.length > 0) {
        const peer = participants[0];
        console.log("[WEBRTC] Existing peer found in room:", peer);
        remotePeerRef.current = peer;
        setRemotePeer(peer);
        setPeerLeftInfo(null);
        setIsCallAnswered(true);
        if (ringbackToneRef.current) {
          ringbackToneRef.current.stop();
          ringbackToneRef.current = null;
        }
        // New participant sends offer to existing peer
        peerManager.createAndSendOffer(peer.socketId);
      }
    });

    // Existing participant receives newcomer
    socket.on("user-joined", ({ socketId, user }) => {
      console.log("[WEBRTC] New participant joined room:", user?.name, socketId);
      const peer = { ...user, socketId };
      remotePeerRef.current = peer;
      setRemotePeer(peer);
      setPeerLeftInfo(null);
      setIsCallAnswered(true);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      userInfoRef.current.showToast?.(`${user?.name || "Participant"} joined the consultation!`);
      // If no offer received within 2.5s, initiate offer as fallback
      setTimeout(() => {
        if (
          peerManagerRef.current &&
          !peerManagerRef.current.peerConnection?.remoteDescription &&
          !peerManagerRef.current.isInitiator
        ) {
          console.log("[WEBRTC] Fallback offer trigger for peer:", socketId);
          peerManagerRef.current.createAndSendOffer(socketId);
        }
      }, 2500);
    });

    socket.on("webrtc-offer", async ({ fromSocketId, sdpOffer, sender }) => {
      console.log("[WEBRTC] Received SDP offer from:", fromSocketId);
      const peer = { ...sender, socketId: fromSocketId };
      remotePeerRef.current = peer;
      setRemotePeer(peer);
      setPeerLeftInfo(null);
      setIsCallAnswered(true);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      await peerManager.handleOfferAndSendAnswer(sdpOffer, fromSocketId);
    });

    socket.on("webrtc-answer", async ({ sdpAnswer }) => {
      console.log("[WEBRTC] Received SDP answer");
      await peerManager.handleAnswer(sdpAnswer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      await peerManager.handleIceCandidate(candidate);
    });

    socket.on("peer-state-updated", ({ isMicOn: mOn, isVideoOn: vOn, isScreenSharing: sOn }) => {
      setRemoteMediaState({ isMicOn: mOn, isVideoOn: vOn, isScreenSharing: sOn });
    });

    socket.on("chat-message-received", (msg) => {
      const u = userInfoRef.current;
      const isMyMessage = Boolean(
        (msg.senderSocketId && socket.id && msg.senderSocketId === socket.id) ||
        (msg.senderId && u.currentUser?.id && String(msg.senderId) === String(u.currentUser.id)) ||
        (msg.sender && u.displayName && msg.sender.toLowerCase().trim() === u.displayName.toLowerCase().trim())
      );

      const enhancedMsg = {
        ...msg,
        isMe: isMyMessage,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === enhancedMsg.id)) {
          return prev.map((m) => (m.id === enhancedMsg.id ? { ...m, isMe: isMyMessage } : m));
        }
        return [...prev, enhancedMsg];
      });
      if (!isMyMessage) {
        setUnreadCount((c) => c + 1);
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("reaction-received", ({ id, emoji }) => {
      setFloatingReactions((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2800);
    });

    socket.on("peer-hand-raised", ({ isHandRaised: raised, from }) => {
      setIsRemoteHandRaised(Boolean(raised));
      if (raised) {
        userInfoRef.current.showToast?.(`✋ ${from || "Participant"} raised hand`);
      }
    });

    socket.on("peer-left", ({ user }) => {
      const departedName = user?.name || remotePeerRef.current?.name || remotePeerName || "Participant";
      console.log("[WEBRTC] Peer left:", departedName);
      setRemoteStream(null);
      setRemotePeer(null);
      remotePeerRef.current = null;
      setIsRemoteHandRaised(false);
      setPeerLeftInfo({
        name: departedName,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      });
      playLeaveChime();
      userInfoRef.current.showToast?.(`⚠️ ${departedName} left the consultation.`);
    });

    return () => {
      try {
        socket.emit("leave-room", { roomCode });
      } catch (e) {}
      peerManager.close();
      socket.disconnect();
    };
  }, [mounted, roomCode]);

  // Instant Meeting Admin Presence & 3-Minute Auto-End Timer with Ringback Tone ("trot-trot")
  useEffect(() => {
    if (!isInstantMeeting) return;

    // 1. If user is Admin joining the call, mark answered immediately
    if (isUserAdmin) {
      setIsCallAnswered(true);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      try {
        const stored = localStorage.getItem("mcpa_instant_call_active");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.answered = true;
          parsed.adminJoined = true;
          parsed.answeredBy = currentUser?.name || "Engr. Raymart Quirante";
          localStorage.setItem("mcpa_instant_call_active", JSON.stringify(parsed));
        }
        window.dispatchEvent(
          new CustomEvent("mcpa-instant-call-answered", {
            detail: { answeredBy: currentUser?.name || "Engr. Raymart Quirante" },
          })
        );
      } catch (e) {}
      return;
    }

    // 2. Client waiting for an Admin to answer: start the "trot-trot" ringback tone!
    if (!isCallAnswered) {
      if (!ringbackToneRef.current) {
        ringbackToneRef.current = playOutgoingRingbackTone();
      }
    } else {
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      return;
    }

    // Check if call was already answered in localStorage
    const checkAnswered = () => {
      try {
        const stored = localStorage.getItem("mcpa_instant_call_active");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.answered || parsed.adminJoined) {
            setIsCallAnswered(true);
            if (ringbackToneRef.current) {
              ringbackToneRef.current.stop();
              ringbackToneRef.current = null;
            }
            showToast(`${parsed.answeredBy || "MCPA Engineering"} has connected to the consultation!`);
          }
        }
      } catch (e) {}
    };

    checkAnswered();

    const handleAnsweredEvent = (e) => {
      setIsCallAnswered(true);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      showToast(`${e.detail?.answeredBy || "Engr. Raymart Quirante"} has answered your call!`);
    };

    window.addEventListener("mcpa-instant-call-answered", handleAnsweredEvent);
    window.addEventListener("storage", checkAnswered);

    // 3-Minute (180s) Auto-End Countdown Timer
    const timerInterval = setInterval(() => {
      setInstantTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          // 3 minutes elapsed with no admin answering -> Auto End!
          if (ringbackToneRef.current) {
            ringbackToneRef.current.stop();
            ringbackToneRef.current = null;
          }
          handleLeaveCall();
          if (onAutoEndTimeout) {
            onAutoEndTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      window.removeEventListener("mcpa-instant-call-answered", handleAnsweredEvent);
      window.removeEventListener("storage", checkAnswered);
    };
  }, [isInstantMeeting, isUserAdmin, isCallAnswered, onAutoEndTimeout, showToast]);

  // Side Drawers
  const [activeSidePanel, setActiveSidePanel] = useState(null); // null | 'chat' | 'people' | 'info'
  const [unreadCount, setUnreadCount] = useState(0);

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Engr. Raymart Quirante",
      role: "Lead Project Engineer (Host)",
      time: "Just now",
      text: "Welcome to your MCPA Architectural & Engineering consultation! Feel free to ask questions or share your screen.",
      isHost: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);

  // Video Media Streams
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenAudioMixerRef = useRef(null);
  const rawMicTrackRef = useRef(null);
  const audioFilterCleanupRef = useRef(null);

  // Live Dual-Timezone Clock (Automatic Philippine Standard Time + Client Local Time Abroad)
  const [timeState, setTimeState] = useState({
    phTime: "",
    localTime: "",
    isAbroad: false,
    tzLabel: "Local",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // 1. Philippine Standard Time (PHT, UTC+8)
      const phStr = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // 2. Local Device Time
      const localStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // 3. Detect if user/client is abroad
      let tzName = "";
      try {
        tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch (e) {}

      const isManila =
        tzName.toLowerCase().includes("manila") ||
        (now.getTimezoneOffset() === -480 && !tzName.includes("/"));
      const isAbroad = !isManila && Boolean(tzName);

      // Extract friendly label (e.g. JST, Tokyo, EST, Dubai)
      let label = "Local";
      try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now);
        const tzPart = parts.find((p) => p.type === "timeZoneName")?.value;
        if (tzPart && !tzPart.startsWith("GMT") && !tzPart.startsWith("UTC")) {
          label = tzPart;
        } else if (tzName.includes("/")) {
          label = tzName.split("/")[1].replace(/_/g, " ");
        } else {
          label = tzPart || "Local";
        }
      } catch (e) {
        label = "Local";
      }

      setTimeState({
        phTime: phStr,
        localTime: localStr,
        isAbroad,
        tzLabel: label,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Camera & Mic with robust hardware fallback
  useEffect(() => {
    let active = true;
    async function startMedia() {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          const isHttp = typeof window !== "undefined" && !window.isSecureContext;
          throw new Error(
            isHttp
              ? "A secure connection (HTTPS or localhost) is required to access the camera and microphone."
              : "Camera and microphone access is not supported in this browser."
          );
        }

        let rawStream = null;
        try {
          // Attempt Video + Audio with optimal studio-grade noise suppression constraints
          try {
            rawStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: OPTIMAL_AUDIO_CONSTRAINTS,
            });
          } catch (optimalErr) {
            console.warn("[WEBRTC] Optimal audio constraints failed, retrying standard:", optimalErr);
            rawStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: FALLBACK_AUDIO_CONSTRAINTS,
            });
          }
        } catch (videoError) {
          console.warn("[WEBRTC] Video camera capture failed or unavailable, trying audio-only:", videoError);
          try {
            // Fallback to Audio-Only
            try {
              rawStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: OPTIMAL_AUDIO_CONSTRAINTS,
              });
            } catch (optAudioErr) {
              rawStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: FALLBACK_AUDIO_CONSTRAINTS,
              });
            }
            setIsVideoOn(false);
          } catch (audioError) {
            console.error("[WEBRTC] Microphone capture failed as well:", audioError);
            setIsVideoOn(false);
            setIsMicOn(false);
          }
        }

        if (!active) {
          if (rawStream) {
            rawStream.getTracks().forEach((track) => track.stop());
          }
          return;
        }

        if (rawStream) {
          const rawAudioTrack = rawStream.getAudioTracks()[0];
          const rawVideoTrack = rawStream.getVideoTracks()[0];

          rawMicTrackRef.current = rawAudioTrack || null;

          // Directly use rawAudioTrack!
          // Browser getUserMedia with OPTIMAL_AUDIO_CONSTRAINTS already provides native
          // hardware-accelerated Acoustic Echo Cancellation (AEC), Noise Suppression (NS), and Auto Gain Control (AGC).
          // Routing through Web Audio AudioContext caused browser suspension and complete audio dropouts.
          const outgoingAudioTrack = rawAudioTrack;

          // Combined stream containing camera video track + raw microphone audio track
          const processedStream = new MediaStream([rawVideoTrack, outgoingAudioTrack].filter(Boolean));
          localStreamRef.current = processedStream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = processedStream;
          }
          if (peerManagerRef.current) {
            peerManagerRef.current.attachLocalTracks(processedStream);
            const targetPeerId = remotePeerRef.current?.socketId;
            if (targetPeerId) {
              if (
                !peerManagerRef.current.isInitiator &&
                !peerManagerRef.current.peerConnection?.remoteDescription
              ) {
                console.log("[WEBRTC] Media ready with native audio, sending offer to remote peer:", targetPeerId);
                peerManagerRef.current.createAndSendOffer(targetPeerId);
              } else if (
                peerManagerRef.current.peerConnection?.signalingState === "stable"
              ) {
                console.log("[WEBRTC] Media ready post-handshake, renegotiating offer for peer:", targetPeerId);
                peerManagerRef.current.createAndSendOffer(targetPeerId);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not access camera/mic, falling back to avatar mode:", err?.message || err);
        setIsVideoOn(false);
      }
    }
    startMedia();

    return () => {
      active = false;
      if (audioFilterCleanupRef.current) {
        audioFilterCleanupRef.current();
        audioFilterCleanupRef.current = null;
      }
      if (rawMicTrackRef.current) {
        rawMicTrackRef.current.stop();
        rawMicTrackRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Callback ref for reliable local video stream binding across layout switches
  const setLocalVideoRef = useCallback((element) => {
    localVideoRef.current = element;
    if (element && localStreamRef.current) {
      if (element.srcObject !== localStreamRef.current) {
        element.srcObject = localStreamRef.current;
      }
      element.play().catch(() => {});
    }
  }, []);

  // Callback ref for reliable remote video stream binding across layout switches
  const setRemoteVideoRef = useCallback((element) => {
    remoteVideoRef.current = element;
    if (element && remoteStream) {
      if (element.srcObject !== remoteStream) {
        element.srcObject = remoteStream;
      }
      element.play().catch((err) => {
        console.warn("[WEBRTC] Video unmuted play deferred, muting video element so video displays while audio plays via audio element:", err);
        element.muted = true;
        element.play().catch(() => {});
      });
    }
  }, [remoteStream]);

  // Callback ref for reliable screen share video stream binding
  const setScreenVideoRef = useCallback((element) => {
    screenVideoRef.current = element;
    if (element && screenStreamRef.current) {
      if (element.srcObject !== screenStreamRef.current) {
        element.srcObject = screenStreamRef.current;
      }
      element.play().catch(() => {});
    }
  }, []);

  // Gentle audio chime when participant leaves
  const playLeaveChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(440, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(330, now + 0.2);
      gain2.gain.setValueAtTime(0.08, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.55);
    } catch (e) {}
  };

  // Ensure remote audio and video play reliably
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, remoteMediaState.isVideoOn, remoteMediaState.isScreenSharing, isCallAnswered]);

  // Audio gesture unblocker (Chrome/Safari autoplay policy)
  useEffect(() => {
    const unblockAudio = () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        if (remoteStream) {
          if (remoteAudioRef.current.srcObject !== remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current.paused) {
            remoteAudioRef.current.play().catch(() => {});
          }
        }
      }
    };
    window.addEventListener("click", unblockAudio, { passive: true });
    window.addEventListener("touchstart", unblockAudio, { passive: true });
    window.addEventListener("keydown", unblockAudio, { passive: true });
    return () => {
      window.removeEventListener("click", unblockAudio);
      window.removeEventListener("touchstart", unblockAudio);
      window.removeEventListener("keydown", unblockAudio);
    };
  }, [remoteStream]);

  // Toggle Video Track
  const toggleVideo = () => {
    let nextVideoState = !isVideoOn;
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        nextVideoState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextVideoState;
      }
    }
    setIsVideoOn(nextVideoState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode,
        isMicOn,
        isVideoOn: nextVideoState,
        isScreenSharing,
      });
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    let nextMicState = !isMicOn;
    if (rawMicTrackRef.current) {
      rawMicTrackRef.current.enabled = nextMicState;
    }
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = nextMicState;
      }
    }
    // Update live presenter mic gain in screen audio mixer if sharing screen
    if (screenAudioMixerRef.current?.micGain) {
      screenAudioMixerRef.current.micGain.gain.value = nextMicState ? 1.0 : 0.0;
    }
    setIsMicOn(nextMicState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode,
        isMicOn: nextMicState,
        isVideoOn,
        isScreenSharing,
      });
    }
  };

  // Flip Camera between Front & Rear on Mobile
  const flipCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      showToast("Camera switching is unavailable in this environment.");
      return;
    }
    const nextFacing = facingMode === "user" ? "environment" : "user";
    try {
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextFacing } },
          audio: false,
        });
      } catch (errExact) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
          audio: false,
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (localStreamRef.current && newVideoTrack) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        if (peerManagerRef.current) {
          await peerManagerRef.current.replaceVideoTrack(newVideoTrack);
        }
      }
      setFacingMode(nextFacing);
      showToast(`Switched to ${nextFacing === "user" ? "front" : "rear"} camera`);
    } catch (err) {
      console.warn("Could not switch camera:", err);
      showToast("Unable to switch camera device.");
    }
  };

  // Screen Sharing with WebRTC track replacement & Audio Mixing (Host & Client, Desktop & Mobile)
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (screenAudioMixerRef.current) {
        screenAudioMixerRef.current.cleanUp();
        screenAudioMixerRef.current = null;
      }
      // Revert outgoing audio to local microphone
      if (peerManagerRef.current && localStreamRef.current) {
        const micTrack = localStreamRef.current.getAudioTracks()[0];
        if (micTrack) {
          await peerManagerRef.current.replaceAudioTrack(micTrack);
        }
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (camTrack && isVideoOn) {
          await peerManagerRef.current.replaceVideoTrack(camTrack);
        }
      }
      setIsScreenSharing(false);
      showToast("Screen presentation ended.");

      if (socketRef.current?.connected) {
        socketRef.current.emit("peer-state-change", {
          roomCode,
          isMicOn,
          isVideoOn,
          isScreenSharing: false,
        });
      }
    } else {
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        showToast("Screen sharing is not supported by this browser on your device.");
        return;
      }
      try {
        let screenStream = null;
        try {
          // Attempt capture with tab/system audio
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always",
              displaySurface: "browser",
            },
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
        } catch (audioReqErr) {
          console.warn("[WEBRTC] Screen share with audio declined or unsupported, falling back to video-only:", audioReqErr);
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always",
            },
            audio: false,
          });
        }

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          screenVideoRef.current.play().catch(() => {});
        }

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (peerManagerRef.current && screenVideoTrack) {
          await peerManagerRef.current.replaceVideoTrack(screenVideoTrack);
        }

        // Handle and Mix Screen Video Audio (e.g. YouTube, presentation video, or system sounds)
        const screenAudioTracks = screenStream.getAudioTracks();
        const hasScreenAudio = screenAudioTracks.length > 0;

        if (hasScreenAudio && typeof window !== "undefined") {
          try {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
              const audioCtx = new AudioCtxClass();
              const destination = audioCtx.createMediaStreamDestination();

              // 1. Connect Presentation / Video Audio
              const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTracks[0]]));
              const screenGain = audioCtx.createGain();
              screenGain.gain.value = 1.0;
              screenSource.connect(screenGain);
              screenGain.connect(destination);

              // 2. Connect Presenter Microphone (Allows talking while video is playing)
              const micTrack = localStreamRef.current?.getAudioTracks()[0];
              let micGain = null;
              if (micTrack) {
                const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
                micGain = audioCtx.createGain();
                micGain.gain.value = isMicOn ? 1.0 : 0.0;
                micSource.connect(micGain);
                micGain.connect(destination);
              }

              const mixedAudioTrack = destination.stream.getAudioTracks()[0];
              screenAudioMixerRef.current = {
                audioCtx,
                mixedAudioTrack,
                micGain,
                cleanUp: () => {
                  try {
                    mixedAudioTrack.stop();
                    audioCtx.close();
                  } catch (e) {}
                },
              };

              if (peerManagerRef.current && mixedAudioTrack) {
                await peerManagerRef.current.replaceAudioTrack(mixedAudioTrack);
                console.log("[WEBRTC] Outgoing audio upgraded to mixed mic + presentation audio.");
              }
            }
          } catch (mixErr) {
            console.warn("[WEBRTC] Audio mixing fallback to direct screen audio track:", mixErr);
            if (peerManagerRef.current) {
              await peerManagerRef.current.replaceAudioTrack(screenAudioTracks[0]);
            }
          }
        }

        showToast(
          hasScreenAudio
            ? "Presenting screen with video audio enabled!"
            : "You are now presenting your screen."
        );

        if (socketRef.current?.connected) {
          socketRef.current.emit("peer-state-change", {
            roomCode,
            isMicOn,
            isVideoOn,
            isScreenSharing: true,
          });
        }

        screenVideoTrack.onended = async () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
          if (screenAudioMixerRef.current) {
            screenAudioMixerRef.current.cleanUp();
            screenAudioMixerRef.current = null;
          }
          if (peerManagerRef.current && localStreamRef.current) {
            const micTrack = localStreamRef.current.getAudioTracks()[0];
            if (micTrack) {
              await peerManagerRef.current.replaceAudioTrack(micTrack);
            }
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (camTrack && isVideoOn) {
              await peerManagerRef.current.replaceVideoTrack(camTrack);
            }
          }
          setIsScreenSharing(false);
          showToast("Screen presentation ended.");

          if (socketRef.current?.connected) {
            socketRef.current.emit("peer-state-change", {
              roomCode,
              isMicOn,
              isVideoOn,
              isScreenSharing: false,
            });
          }
        };
      } catch (err) {
        if (err?.name !== "NotAllowedError") {
          console.warn("Screen share error:", err);
          showToast("Unable to start screen share: " + (err?.message || "Permission denied"));
        }
      }
    }
  };

  // Send Reaction
  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
    setIsReactionsOpen(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit("send-reaction", { roomCode, emoji });
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (socketRef.current?.connected) {
      socketRef.current.emit("toggle-hand-raise", { roomCode, isHandRaised: nextHand });
    }
  };

  // In-Call Chat Send via Socket.IO
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const phTimeStr = now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const localTimeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const newMsg = {
      id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 7),
      sender: displayName,
      senderSocketId: socketRef.current?.id,
      senderId: currentUser?.id || null,
      role: isUserAdmin ? "Lead Engineer (Host)" : "Client / Owner",
      time: timeState.isAbroad ? `${localTimeStr} (${phTimeStr} PH)` : localTimeStr,
      phTime: phTimeStr,
      localTime: localTimeStr,
      createdAt: now.toISOString(),
      text: chatInput.trim(),
      isHost: isUserAdmin,
      isMe: true,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit("send-chat-message", { roomCode, message: newMsg });
    } else {
      setMessages((prev) => [...prev, newMsg]);
    }

    setChatInput("");
    if (activeSidePanel !== "chat") {
      setUnreadCount((c) => c + 1);
    }

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Copy Meeting Link
  const [hasCopied, setHasCopied] = useState(false);
  const handleCopyLink = () => {
    const meetUrl = `${window.location.origin}/portal?tab=meeting&room=${roomCode}`;
    navigator.clipboard?.writeText(meetUrl);
    setHasCopied(true);
    showToast("Meeting code copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2500);
  };  const roomContent = (
    <div
      className={`dark transition-all duration-300 flex flex-col justify-between select-none shadow-2xl ${
        isFloatingPiP
          ? "fixed bottom-5 right-5 z-[999999] w-[340px] sm:w-[390px] h-[285px] sm:h-[295px] rounded-2xl bg-[#121316] border border-white/20 overflow-hidden ring-1 ring-black/50"
          : isFullscreen
          ? "fixed inset-0 z-[99999] w-full h-[100dvh] max-w-none max-h-none rounded-none border-0 overflow-hidden bg-neutral-950 text-white"
          : "relative w-full h-[88vh] min-h-[600px] max-h-[960px] rounded-[16px] border border-neutral-800 overflow-hidden bg-neutral-950 text-white"
      } text-white`}
    >
      {/* Offscreen active audio element for receiving remote P2P audio track without browser suspension */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        className="fixed -top-96 -left-96 w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* 1. TOP STATUS BAR (COMPACT IN FLOATING MODE, MINIMALIST & TRANSPARENT IN FULLSCREEN) */}
      {isFloatingPiP ? (
        <div className="h-10 px-3 flex items-center justify-between z-20 shrink-0 bg-neutral-950/80 backdrop-blur-md border-b border-white/10 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-tight">MCPA Meet</span>
            <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[100px]">
              {roomCode}
            </span>
            {isInstantMeeting && !isCallAnswered && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold">
                {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFloatingPiP(false)}
            className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="h-12 sm:h-14 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent sm:bg-neutral-950/80 sm:backdrop-blur-md transition-colors text-white">
          {/* Left: Dual Time (PH Time + Local Time if Abroad) & Room Code */}
          <div className="flex items-center gap-2 sm:gap-3">
            {timeState.isAbroad ? (
              <div
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-sans"
                title={`Philippine Standard Time: ${timeState.phTime} | Your Local Time: ${timeState.localTime} (${timeState.tzLabel})`}
              >
                {/* Philippine Standard Time */}
                <span className="flex items-center gap-1 text-amber-300 font-semibold whitespace-nowrap">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                    PH
                  </span>
                  <span>{timeState.phTime}</span>
                </span>

                <span className="text-white/30 font-light">·</span>

                {/* Local Device Time Abroad */}
                <span className="flex items-center gap-1 text-sky-200/90 font-medium whitespace-nowrap">
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{timeState.localTime}</span>
                  <span className="text-[10px] font-mono text-white/50">
                    ({timeState.tzLabel})
                  </span>
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-sans font-medium text-white/90">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                  PH
                </span>
                <span>{timeState.phTime || "5:56 PM"}</span>
              </span>
            )}
            <span className="text-white/30 font-light">·</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-mono font-medium text-white/80 hover:text-amber-400 transition-colors cursor-pointer group"
              title="Click to copy meeting code"
            >
              <span className="truncate max-w-[120px] sm:max-w-none">{roomCode}</span>
              {hasCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-white/50 group-hover:text-amber-400 transition-colors shrink-0" />
              )}
            </button>
            {activeProject?.project_title && (
              <span className="hidden md:inline-block text-xs font-mono text-white/50 whitespace-nowrap">
                · {activeProject.project_title}
              </span>
            )}
          </div>

          {/* Right: Actions (Flip Camera on Mobile, Instant Timer, User Avatar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Flip Camera Button on Mobile Header */}
            {isVideoOn && (
              <button
                type="button"
                onClick={flipCamera}
                className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer flex sm:hidden"
                title="Flip camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Instant Meeting Standby Timer Badge */}
            {isInstantMeeting && !isCallAnswered && (
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>{Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}</span>
              </div>
            )}

            {/* Participant Left Badge */}
            {peerLeftInfo && !hasRemotePeer && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{peerLeftInfo.name} Left</span>
              </div>
            )}

            {/* User Avatar (Toggles Participants drawer) */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "people" ? null : "people")}
              className="flex items-center gap-2 text-white/90 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="View participants"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-[10px] text-amber-300">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-white/90 truncate max-w-[120px]">
                {displayName.split(" ")[0]}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN STAGE CANVAS (PARTICIPANT TILES & SHARED SCREEN) */}
      <div className={`relative flex-1 flex min-h-0 ${isFloatingPiP ? "p-0" : "p-0 sm:px-6 sm:pb-2 sm:gap-4"} overflow-hidden bg-neutral-950`}>
        {/* Main Video Viewport */}
        <div className={`relative flex-1 ${isFloatingPiP ? "rounded-none" : "rounded-none sm:rounded-[16px]"} bg-neutral-950 flex items-center justify-center overflow-hidden`}>
          {/* INSTANT MEETING TOP STATUS BADGE (SLEEK & REFINED) */}
          {isInstantMeeting && !isCallAnswered && !isUserAdmin && !isFloatingPiP && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span className="text-amber-400 font-medium">Connecting with MCPA Engineer...</span>
              <span className="text-white/40 font-light">·</span>
              <span className="text-amber-300 font-bold">
                {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {/* PARTICIPANT LEFT OVERLAY NOTIFICATION */}
          {peerLeftInfo && !hasRemotePeer && (
            <div className={`absolute inset-0 z-30 flex items-center justify-center ${isFloatingPiP ? "p-2.5" : "p-4 sm:p-6"} bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200`}>
              <div className={`${isFloatingPiP ? "w-full max-w-[310px] p-3 space-y-2" : "max-w-sm w-full p-6 rounded-2xl space-y-4"} rounded-2xl bg-[#17181d] border border-white/10 shadow-2xl text-center`}>
                <div className={`${isFloatingPiP ? "w-8 h-8" : "w-13 h-13"} rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center`}>
                  <PhoneOff className={isFloatingPiP ? "w-4 h-4" : "w-6 h-6"} />
                </div>
                <div className="space-y-0.5">
                  <h3 className={`${isFloatingPiP ? "text-xs font-bold leading-tight" : "text-base font-bold"} text-white`}>
                    {peerLeftInfo.name} left the meeting
                  </h3>
                  <p className="text-[10px] font-mono text-white/50">
                    Disconnected at {peerLeftInfo.time}
                  </p>
                  <p className={`${isFloatingPiP ? "text-[11px] line-clamp-1" : "text-xs"} text-neutral-300 font-sans pt-0.5 leading-relaxed`}>
                    {isFloatingPiP
                      ? "You are currently alone in this room."
                      : "You are currently the only person in this consultation room. You may wait for them to reconnect or leave the meeting."}
                  </p>
                </div>
                <div className={`flex items-center justify-center gap-2 ${isFloatingPiP ? "pt-0.5" : "pt-2"}`}>
                  <button
                    type="button"
                    onClick={() => setPeerLeftInfo(null)}
                    className={`flex-1 ${isFloatingPiP ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs"} rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium transition-all cursor-pointer`}
                  >
                    Wait in Room
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveCall}
                    className={`flex-1 ${isFloatingPiP ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs"} rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40`}
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Leave Call</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE MEDIA RENDERING */}
          {hasRemotePeer ? (
            /* DUAL CALL MODE: REMOTE PARTICIPANT ON MAIN STAGE */
            remoteMediaState.isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={setRemoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>{remotePeerName} is presenting their screen</span>
                </div>
              </div>
            ) : isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={setScreenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>You are presenting your screen</span>
                </div>
              </div>
            ) : (remoteStream && remoteMediaState.isVideoOn !== false && remoteStream.getVideoTracks().length > 0) ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={setRemoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            ) : (
              /* REMOTE AVATAR FALLBACK */
              <div className="relative w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-[#14151a] to-[#0d0e12] transition-colors p-4">
                <div className={`relative flex items-center justify-center ${remoteMediaState.isMicOn !== false ? "animate-pulse" : ""}`}>
                  <div className="absolute w-36 h-36 rounded-full bg-amber-500/10 blur-xl" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-xl flex items-center justify-center ring-4 ring-white/5 transition-all">
                    {remotePeerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={remotePeerAvatar} alt={remotePeerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold font-mono text-amber-400">
                        {remotePeerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm sm:text-base font-bold text-white/90">{remotePeerName}</p>
                  <p className="text-xs font-mono text-amber-400/90">
                    {remoteMediaState.isVideoOn === false ? "Camera turned off (Audio active)" : "Connected via encrypted P2P audio & video"}
                  </p>
                </div>
              </div>
            )
          ) : (
            /* SINGLE PARTICIPANT MODE / STANDBY */
            isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={setScreenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>You are presenting your screen</span>
                </div>
              </div>
            ) : isVideoOn && localStreamRef.current?.getVideoTracks()?.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={setLocalVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain bg-black ${facingMode === "user" ? "-scale-x-100" : ""}`}
                />
              </div>
            ) : (
              /* AVATAR CALLING / STANDBY STAGE */
              <div className="relative w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-[#14151a] to-[#0d0e12] transition-colors p-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-40 h-40 rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-2xl flex items-center justify-center ring-4 ring-white/10 transition-all">
                    {isInstantMeeting && !isCallAnswered && !isUserAdmin ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={remotePeerAvatar || "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"}
                        alt="Engr. Raymart Quirante"
                        className="w-full h-full object-cover"
                      />
                    ) : userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold font-mono text-amber-400">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {isInstantMeeting && !isCallAnswered && (
                  <div className="text-center space-y-2 max-w-xs mx-auto animate-in fade-in duration-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                      <span>Ringing Engineer...</span>
                    </div>
                    <p className="text-sm font-semibold text-white/95">
                      Calling Engr. Raymart Quirante
                    </p>
                    <p className="text-xs font-mono text-amber-400/80">
                      Auto-ends in {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")} if unanswered
                    </p>
                    <div className="flex items-center justify-center gap-1.5 pt-0.5 text-emerald-400 text-[11px] font-mono">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Ringtone &quot;trot-trot&quot; active</span>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Bottom Left: Participant Name Tag (CLEAN TEXT, NO CLUNKY BOX BG) */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 font-sans font-medium text-white/90 drop-shadow-md flex items-center gap-1.5 text-xs">
            <span className="font-semibold">{hasRemotePeer ? remotePeerName : displayName}</span>
            {hasRemotePeer ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                {isUserAdmin ? "Client" : "Consultant"}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-white/50">(You)</span>
            )}
            {(hasRemotePeer ? isRemoteHandRaised : isHandRaised) && (
              <span className="text-[11px] animate-bounce">✋ Hand Raised</span>
            )}
          </div>

          {/* Top Right: Tile Audio Indicator (ONLY SHOW WHEN MUTED) */}
          {!(hasRemotePeer ? remoteMediaState.isMicOn !== false : isMicOn) && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 rounded-full bg-rose-600/90 text-white shadow-md">
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}

          {/* Floating Picture-in-Picture Tile (ONLY IN-CALL FOR LOCAL SELF-VIEW) */}
          {!isFloatingPiP && hasRemotePeer && (
            <div className="absolute bottom-20 sm:bottom-4 right-3 sm:right-4 z-20 w-28 h-40 sm:w-56 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-neutral-900 transition-all">
              <div className="relative w-full h-full flex items-center justify-center">
                {isVideoOn && localStreamRef.current?.getVideoTracks()?.length > 0 ? (
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-300">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Self name overlay */}
                <div className="absolute bottom-1.5 left-2 text-[10px] font-mono text-white/90 drop-shadow-md flex items-center gap-1">
                  <span>You</span>
                  {!isMicOn && <span className="text-rose-400">🔇</span>}
                  {isHandRaised && <span>✋</span>}
                </div>
              </div>
            </div>
          )}

          {/* Floating Reactions Emojis */}
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-20 text-3xl pointer-events-none animate-in fade-in slide-out-to-top duration-1000 z-30"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* 3. SLIDING RIGHT SIDE PANEL (CHAT, PEOPLE, INFO - RESPONSIVE MODAL ON MOBILE) */}
        {activeSidePanel && !isFloatingPiP && (
          <aside className="fixed inset-0 sm:relative sm:inset-auto z-40 w-full sm:w-88 h-full sm:rounded-[16px] bg-[#14151a] border-0 sm:border sm:border-white/10 flex flex-col shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom sm:slide-in-from-right-4 duration-200">
            {/* Panel Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#14151a]">
              <h3 className="text-sm font-sans font-bold text-white capitalize flex items-center gap-2">
                {activeSidePanel === "chat" && (
                  <>
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>In-Call Messages</span>
                  </>
                )}
                {activeSidePanel === "people" && (
                  <>
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>People ({hasRemotePeer ? "2" : "1"})</span>
                  </>
                )}
                {activeSidePanel === "info" && (
                  <>
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Meeting Details</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSidePanel(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHAT PANEL */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#14151a]">
                <div className="p-3 bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-neutral-400 font-sans text-center flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Messages can be seen only by people in this call.</span>
                  </div>
                  {timeState.isAbroad && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono text-[10px] border border-sky-500/20">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>PH Time: {timeState.phTime} · Local: {timeState.localTime} ({timeState.tzLabel})</span>
                    </div>
                  )}
                </div>

                {/* Messages Feed */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 text-xs"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2">
                      <MessageSquare className="w-8 h-8 opacity-30 text-amber-400" />
                      <p className="text-xs text-neutral-400 font-medium">No messages yet.</p>
                      <p className="text-[11px] text-neutral-500">Send a note to everyone in this consultation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = Boolean(
                        msg.isMe ||
                        (msg.senderSocketId && socketRef.current?.id && msg.senderSocketId === socketRef.current.id) ||
                        (msg.senderId && currentUser?.id && String(msg.senderId) === String(currentUser.id)) ||
                        (msg.sender && displayName && msg.sender.toLowerCase().trim() === displayName.toLowerCase().trim())
                      );

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col space-y-1 ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-mono ${
                              isMe ? "justify-end text-amber-400/90" : "justify-start text-neutral-400"
                            }`}
                          >
                            <span className="font-bold">{isMe ? "You" : msg.sender}</span>
                            <span className="text-white/30">·</span>
                            <span className="text-white/40">
                              {msg.time || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "")}
                            </span>
                          </div>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] font-sans text-xs break-words leading-relaxed shadow-sm ${
                              isMe
                                ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-xs shadow-amber-500/10"
                                : "bg-[#1f2129] text-neutral-100 rounded-tl-xs border border-white/10"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/[0.08] flex items-center gap-2 bg-[#101115]"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.08] border border-white/10 focus:border-amber-500/70 focus:bg-white/[0.09] text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-30 disabled:hover:bg-amber-500 disabled:cursor-not-allowed shrink-0"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* PEOPLE PANEL */}
            {activeSidePanel === "people" && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#14151a]">
                <div className="text-[11px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                  In Call ({hasRemotePeer ? "2" : "1"})
                </div>

                <div className="space-y-2.5">
                  {/* Local User */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs border border-white/10">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{displayName}</span>
                          <span className="text-[10px] text-amber-400 font-mono">(You)</span>
                          {isHandRaised && <span>✋</span>}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {isUserAdmin ? "Lead Engineer (Host)" : "Client / Property Owner"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isMicOn ? (
                        <Mic className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Remote User (If connected) */}
                  {hasRemotePeer ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                          {remotePeerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{remotePeerName}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[9px] uppercase font-bold border border-amber-500/30">
                              {isUserAdmin ? "Client" : "Consultant"}
                            </span>
                            {isRemoteHandRaised && <span>✋</span>}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {isUserAdmin ? "Client Participant" : "Lead Project Engineer"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {remoteMediaState.isMicOn !== false ? (
                          <Mic className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <MicOff className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-xs font-sans text-neutral-400">
                        Waiting for other participant to connect...
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500 mt-1">
                        Room: {roomCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INFO PANEL */}
            {activeSidePanel === "info" && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#14151a]">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                    Joining Information
                  </h4>
                  <p className="text-xs text-neutral-300 font-sans">
                    Room Code: <span className="font-mono font-bold text-white">{roomCode}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Direct access for client engineering consultation.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Automatic End-to-End Encryption (256-bit TLS)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-mono font-bold text-white transition-all cursor-pointer border border-white/10 active:scale-98"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? "Copied" : "Copy Joining Link"}</span>
                </button>

                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
                    Project Parameters
                  </span>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1.5">
                    <div className="text-neutral-500 text-[10px] font-mono">PROJECT TITLE</div>
                    <div className="font-bold text-white">{activeProject?.project_title || "Residential Build Inquiry"}</div>
                    <div className="text-neutral-500 text-[10px] font-mono mt-1">PROJECT CODE</div>
                    <div className="font-mono text-amber-400 font-bold">{activeProject?.project_code || "MCPA-CONSULTATION"}</div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 4. BOTTOM FLOATING DOCK (COMPACT IN FLOATING MODE, FULL IN NORMAL MODE) */}
      {isFloatingPiP ? (
        <div className="h-12 px-3 flex items-center justify-between z-20 shrink-0 bg-neutral-950/90 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isMicOn ? "bg-white/15 hover:bg-white/25 text-white" : "bg-red-500 text-white"
              }`}
              title={isMicOn ? "Mute mic" : "Unmute mic"}
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isVideoOn ? "bg-white/15 hover:bg-white/25 text-white" : "bg-red-500 text-white"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFloatingPiP(false)}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Expand to Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expand</span>
            </button>
            <button
              type="button"
              onClick={handleLeaveCall}
              className="px-2.5 py-1 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white text-[11px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Leave call"
            >
              <PhoneOff className="w-3 h-3" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-auto min-h-[64px] sm:h-20 px-2 sm:px-6 pt-2 pb-[max(1rem,env(safe-area-inset-bottom,16px))] flex items-center justify-center sm:justify-between z-30 shrink-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30 sm:bg-neutral-950/95 sm:backdrop-blur-md transition-colors text-white">
          {/* MOBILE CONTROLS BAR (sm:hidden) - Ergonomic 7-Button Dock: Mic, Cam, Screen, Smile, Hand, Chat, Leave */}
          <div className="flex sm:hidden items-center justify-between w-full max-w-md mx-auto px-1 py-1">
            {/* 1. Microphone */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicOn
                  ? "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 active:scale-90"
              }`}
              title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* 2. Camera */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoOn
                  ? "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 active:scale-90"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* 3. Screen Share */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? "bg-amber-500 text-neutral-950 font-bold ring-2 ring-amber-400 active:scale-90"
                  : "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
              }`}
              title={isScreenSharing ? "Stop presenting" : "Share screen"}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* 4. Reactions with Centered Emoji Popup */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReactionsOpen(!isReactionsOpen)}
                className={`w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isReactionsOpen
                    ? "text-amber-400 bg-white/20 active:scale-90"
                    : "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
                }`}
                title="Send a reaction"
              >
                <Smile className="w-5 h-5" />
              </button>

              {isReactionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsReactionsOpen(false)}
                  />
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-full bg-neutral-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => triggerReaction(emoji)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-xl transition-transform hover:scale-125 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 5. Raise Hand */}
            <button
              type="button"
              onClick={toggleHandRaise}
              className={`w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isHandRaised
                  ? "text-amber-400 bg-amber-500/25 ring-1 ring-amber-400/50 scale-105 active:scale-90"
                  : "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
              }`}
              title={isHandRaised ? "Lower hand" : "Raise hand"}
            >
              <Hand className="w-5 h-5" />
            </button>

            {/* 6. Chat with Unread Badge */}
            <button
              type="button"
              onClick={() => {
                setActiveSidePanel(activeSidePanel === "chat" ? null : "chat");
                setUnreadCount(0);
              }}
              className={`relative w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeSidePanel === "chat"
                  ? "text-amber-400 bg-amber-500/20 ring-1 ring-amber-400/50 active:scale-90"
                  : "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-90"
              }`}
              title="In-call messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-neutral-900" />
              )}
            </button>

            {/* 7. Leave Call (Red Hang Up) */}
            <button
              type="button"
              onClick={handleLeaveCall}
              className="w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 text-white shadow-lg shadow-rose-950/50 flex items-center justify-center transition-all cursor-pointer"
              title="Leave call"
            >
              <PhoneOff className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* DESKTOP CONTROLS BAR (hidden sm:flex) - Spacious 3-Section Google Meet Dock */}
          <div className="hidden sm:flex items-center justify-between w-full">
            {/* Left: Meeting Details Shortcut */}
            <div className="flex items-center gap-3 text-xs font-mono text-white/50 min-w-[200px]">
              <span className="text-white font-bold">{roomCode}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Copy meeting code"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {activeProject?.project_title && (
                <span className="hidden lg:inline text-white/40 truncate max-w-[180px]">
                  · {activeProject.project_title}
                </span>
              )}
            </div>

            {/* Center: Primary Call Controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Microphone */}
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isMicOn
                    ? "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 ring-1 ring-white/20 active:scale-90"
                }`}
                title={isMicOn ? "Turn off microphone (Ctrl + d)" : "Turn on microphone (Ctrl + d)"}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Camera */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isVideoOn
                    ? "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 ring-1 ring-white/20 active:scale-90"
                }`}
                title={isVideoOn ? "Turn off camera (Ctrl + e)" : "Turn on camera (Ctrl + e)"}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isScreenSharing
                    ? "bg-amber-500 text-neutral-950 font-bold ring-2 ring-amber-400"
                    : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                }`}
                title={isScreenSharing ? "Stop presenting" : "Present now (Share screen)"}
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Reactions */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsReactionsOpen(!isReactionsOpen)}
                  className={`p-3 rounded-full transition-all cursor-pointer ${
                    isReactionsOpen
                      ? "text-amber-400 bg-white/10"
                      : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                  }`}
                  title="Send a reaction"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {isReactionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsReactionsOpen(false)}
                    />
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 rounded-full bg-neutral-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                      {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => triggerReaction(emoji)}
                          className="p-2 rounded-full hover:bg-white/10 text-xl transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Raise Hand */}
              <button
                type="button"
                onClick={toggleHandRaise}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isHandRaised
                    ? "text-amber-400 bg-amber-500/20 scale-110 ring-1 ring-amber-400/40"
                    : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                }`}
                title={isHandRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className="w-5 h-5" />
              </button>

              {/* Float / Picture-in-Picture */}
              <button
                type="button"
                onClick={() => setIsFloatingPiP(true)}
                className="p-3 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Float mini window (Picture-in-picture)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleLeaveCall}
                className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all cursor-pointer shadow-lg shadow-rose-950/40 flex items-center gap-2"
                title="Leave call"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs font-bold font-sans uppercase tracking-wider">Leave</span>
              </button>
            </div>

            {/* Right: Drawer Toggles */}
            <div className="flex items-center justify-end gap-2 min-w-[200px]">
              {/* Chat Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidePanel(activeSidePanel === "chat" ? null : "chat");
                  setUnreadCount(0);
                }}
                className={`relative p-3 rounded-full transition-colors cursor-pointer ${
                  activeSidePanel === "chat"
                    ? "text-amber-400 bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="Chat with everyone"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              {/* People Button */}
              <button
                type="button"
                onClick={() => setActiveSidePanel(activeSidePanel === "people" ? null : "people")}
                className={`p-3 rounded-full transition-colors cursor-pointer ${
                  activeSidePanel === "people"
                    ? "text-amber-400 bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="People"
              >
                <Users className="w-5 h-5" />
              </button>

              {/* Info Details Button */}
              <button
                type="button"
                onClick={() => setActiveSidePanel(activeSidePanel === "info" ? null : "info")}
                className={`p-3 rounded-full transition-colors cursor-pointer ${
                  activeSidePanel === "info"
                    ? "text-amber-400 bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="Meeting details"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRE-LEAVE MEETING RATING & DELIBERATION FEEDBACK MODAL */}
      {isLeaveRatingModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#12141c] border border-amber-500/30 text-white shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-tight text-white">
                    Rate Consultation Session
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Before leaving, share your rating and notes with MCPA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveRatingModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Return to call"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges: Meeting Type & Duration */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isInstantMeeting
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                }`}
              >
                {isInstantMeeting ? "Instant Online Meeting" : "Scheduled Online Video"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Duration: {formatMeetingDuration(callDurationSeconds)}</span>
              </span>
            </div>

            {/* 5-Star Interactive Rating Selector */}
            <div className="space-y-2 text-center py-1">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = leaveHoverRating || leaveRating;
                  const isFilled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setLeaveHoverRating(star)}
                      onMouseLeave={() => setLeaveHoverRating(0)}
                      onClick={() => setLeaveRating(star)}
                      className="p-1.5 transition-transform hover:scale-120 active:scale-95 cursor-pointer focus:outline-none"
                      title={`${star} Star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-mono font-semibold text-amber-400">
                {leaveRating === 5 && "5.0 · Outstanding Engineering Consultation ⭐⭐⭐⭐⭐"}
                {leaveRating === 4 && "4.0 · Very Good Consultation ⭐⭐⭐⭐"}
                {leaveRating === 3 && "3.0 · Satisfactory Discussion ⭐⭐⭐"}
                {leaveRating === 2 && "2.0 · Fair / Minor Inconveniences ⭐⭐"}
                {leaveRating === 1 && "1.0 · Needs Follow-Up & Improvement ⭐"}
              </p>
            </div>

            {/* Note / Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                Meeting Notes or Feedback (Optional):
              </label>
              <textarea
                rows={3}
                value={leaveNote}
                onChange={(e) => setLeaveNote(e.target.value)}
                placeholder="Note key agreements, architectural ideas, or consultant feedback..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsLeaveRatingModalOpen(false);
                  performActualLeave(leaveRating, leaveNote);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Rating &amp; Leave Call</span>
              </button>

              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono text-neutral-400">
                <button
                  type="button"
                  onClick={() => {
                    setIsLeaveRatingModalOpen(false);
                    performActualLeave(null, "");
                  }}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  Skip Rating &amp; Leave
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaveRatingModalOpen(false)}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1"
                >
                  Cancel (Stay in Call)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(roomContent, document.body);
}
