"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smile,
  Hand,
  PhoneOff,
  MessageSquare,
  Users,
  Info,
  Shield,
  X,
  Send,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Clock,
  SwitchCamera,
  Globe,
  Star,
  CheckCircle2,
  Share2,
  Settings,
  Volume2,
  Smartphone,
  Headphones,
} from "lucide-react";
import { io } from "socket.io-client";
import { WebRTCPeerManager } from "@/modules/portal/utils/webrtcPeerManager";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";
import { playOutgoingRingbackTone } from "@/modules/portal/utils/outgoingRingbackTone";
import { ScreenAudioMixer } from "@/modules/portal/utils/screenAudioMixer";
import MeetingDeviceSettingsModal from "./MeetingDeviceSettingsModal";
import {
  formatMeetingDuration,
  recordConcludedMeeting,
} from "@/modules/portal/utils/meetingHistoryService";
import {
  buildMeetingUrl,
  formatRoomCode,
  markRoomConcluded,
  clearRoomConcluded,
} from "@/modules/portal/utils/roomCodeHelper";

// Studio-grade WebRTC DSP constraints for noise isolation and echo cancellation
const OPTIMAL_AUDIO_CONSTRAINTS = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  googEchoCancellation: { ideal: true },
  googAutoGainControl: { ideal: true },
  googNoiseSuppression: { ideal: true },
  googHighpassFilter: { ideal: true },
  googTypingNoiseDetection: { ideal: true },
};

const FALLBACK_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Audio playback element for an individual remote peer.
 * Uses Web Audio API (AudioContext) with GainNode and DynamicsCompressorNode
 * to guarantee:
 * 1. Routing to Android/mobile Loudspeaker (STREAM_MUSIC) rather than whisper-quiet Earpiece (STREAM_VOICE_CALL).
 * 2. 2.8x volume boost for Loudspeaker mode so phone volume is loud and room-filling.
 * 3. Studio-grade dynamics compression to prevent any clipping, crackle, or distortion.
 * 4. Responds dynamically to Speaker vs Earpiece vs Headset mode switches.
 * 5. Fallback to native HTML5 audio element if Web Audio API is unavailable.
 */
function RemotePeerAudio({ stream, streamVersion = 0, sinkId = null, audioOutputMode = "speaker" }) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);
  const isWebAudioActiveRef = useRef(false);

  // Helper to calculate target gain based on output mode
  const getTargetGain = (mode) => {
    if (mode === "earpiece") return 0.35; // Gentle volume for holding directly against ear
    if (mode === "headset") return 1.0;   // 1:1 true volume for earphones/headphones
    return 2.8;                          // Boosted 2.8x amplification for crystal-clear loud phone speaker
  };

  // Setup Web Audio pipeline for the incoming stream
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!stream) return;

    // Attach stream to <audio> element as primary anchor for browser media engine
    if (audioEl && audioEl.srcObject !== stream) {
      audioEl.srcObject = stream;
    }

    // Try setting up Web Audio API routing & amplification
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        // Clean up previous context if any
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          try {
            audioCtxRef.current.close();
          } catch (e) {}
        }

        const audioCtx = new AudioContextClass({ latencyHint: "interactive" });
        audioCtxRef.current = audioCtx;

        if (sinkId && typeof audioCtx.setSinkId === "function") {
          audioCtx.setSinkId(sinkId).catch(() => {});
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const source = audioCtx.createMediaStreamSource(stream);
          sourceNodeRef.current = source;

          // Studio-grade compressor to prevent clipping when volume is boosted
          const compressor = audioCtx.createDynamicsCompressor();
          compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
          compressor.knee.setValueAtTime(30, audioCtx.currentTime);
          compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
          compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
          compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
          compressorRef.current = compressor;

          // Gain node for loudspeaker amplification
          const gainNode = audioCtx.createGain();
          const initialGain = getTargetGain(audioOutputMode);
          gainNode.gain.setValueAtTime(initialGain, audioCtx.currentTime);
          gainNodeRef.current = gainNode;

          // Connect pipeline: Stream -> Compressor -> Gain -> Output Destination (Loudspeaker)
          source.connect(compressor);
          compressor.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          isWebAudioActiveRef.current = true;

          // Mute the underlying <audio> element so audio doesn't double/echo
          if (audioEl) {
            audioEl.muted = true;
          }
        }
      }
    } catch (err) {
      console.warn("[WEBRTC AUDIO] Web Audio API setup notice, falling back to HTML5 audio:", err);
      isWebAudioActiveRef.current = false;
      if (audioEl) {
        audioEl.muted = false;
        audioEl.volume = audioOutputMode === "earpiece" ? 0.3 : 1.0;
      }
    }

    // Attempt to start <audio> element playback (keeps WebRTC pipeline active)
    if (audioEl) {
      if (sinkId && typeof audioEl.setSinkId === "function") {
        audioEl.setSinkId(sinkId).catch(() => {});
      }
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    // Resume AudioContext if suspended by mobile autoplay policy
    const resumeAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (audioEl && audioEl.paused && audioEl.srcObject) {
        audioEl.play().catch(() => {});
      }
    };

    resumeAudio();

    // Event listeners to revive audio on mobile touch / click / visibility change
    window.addEventListener("click", resumeAudio);
    window.addEventListener("touchstart", resumeAudio);
    window.addEventListener("touchend", resumeAudio);

    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
      window.removeEventListener("touchend", resumeAudio);

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
      isWebAudioActiveRef.current = false;
    };
  }, [stream, streamVersion, sinkId]);

  // Dynamically respond to audioOutputMode switching (Speaker vs Earpiece vs Headset)
  useEffect(() => {
    const targetGain = getTargetGain(audioOutputMode);

    if (gainNodeRef.current && audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try {
        gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
      } catch (e) {}
    }

    const audioEl = audioRef.current;
    if (audioEl && !isWebAudioActiveRef.current) {
      audioEl.volume = audioOutputMode === "earpiece" ? 0.28 : 1.0;
    }
  }, [audioOutputMode]);

  // Keep alive on visibility changes and network stalls
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const resumeAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (audioEl.srcObject && audioEl.paused) {
        audioEl.play().catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resumeAudio();
      }
    };

    audioEl.addEventListener("stalled", resumeAudio);
    audioEl.addEventListener("pause", resumeAudio);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      audioEl.removeEventListener("stalled", resumeAudio);
      audioEl.removeEventListener("pause", resumeAudio);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <audio ref={audioRef} autoPlay playsInline />;
}

/**
 * Human-crafted Participant Video Card
 * STRICT ANTI-AI DESIGN RULES:
 * - NO oval or rectangle background box behind text inside video tiles
 * - NO arbitrary or decorative dots
 * - Clean crisp typography with subtle drop-shadow directly over video
 */
function ParticipantVideoCard({
  participant,
  isLocal = false,
  facingMode = "user",
  isMiniStrip = false,
}) {
  const videoRef = useRef(null);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);

  const videoTracks = participant.stream ? participant.stream.getVideoTracks() : [];
  const streamTrackSignature = videoTracks
    .map((t) => `${t.id}:${t.enabled ? 1 : 0}:${t.muted ? 1 : 0}:${t.readyState}`)
    .join("|");

  useEffect(() => {
    const videoEl = videoRef.current;
    const stream = participant.stream;
    if (!videoEl) return;

    // Direct native properties to comply with iOS Safari and Android autoplay policies
    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.setAttribute("playsinline", "true");
    videoEl.setAttribute("webkit-playsinline", "true");

    const attemptPlay = () => {
      if (!videoEl || !videoEl.srcObject) return;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Retry playback in 250ms for mobile devices
          setTimeout(() => {
            if (videoEl && videoEl.srcObject && videoEl.paused) {
              videoEl.play().catch(() => {});
            }
          }, 250);
        });
      }
    };

    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      attemptPlay();
    } else {
      videoEl.srcObject = null;
      setIsStreamPlaying(false);
    }

    const checkTrackState = () => {
      const vTracks = stream ? stream.getVideoTracks() : [];
      const hasLiveTrack = vTracks.some((t) => t.enabled && t.readyState === "live");
      if (!hasLiveTrack) {
        setIsStreamPlaying(false);
      } else {
        // True stream readiness: video element has decoded dimensions or loaded data
        const isReady = videoEl.readyState >= 2 || videoEl.videoWidth > 0;
        if (isReady) {
          setIsStreamPlaying(true);
        } else {
          attemptPlay();
        }
      }
    };

    const handleLoadedMetadata = () => {
      attemptPlay();
      checkTrackState();
    };

    const handlePlaying = () => {
      checkTrackState();
    };

    const handleWaitingOrPause = () => {
      checkTrackState();
      // If paused unexpectedly while tracks are live, revive playback
      if (videoEl && videoEl.srcObject && videoEl.paused) {
        const vTracks = stream ? stream.getVideoTracks() : [];
        if (vTracks.some((t) => t.enabled && t.readyState === "live")) {
          attemptPlay();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        attemptPlay();
        checkTrackState();
      }
    };

    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoEl.addEventListener("loadeddata", handleLoadedMetadata);
    videoEl.addEventListener("canplay", handleLoadedMetadata);
    videoEl.addEventListener("resize", handlePlaying);
    videoEl.addEventListener("timeupdate", handlePlaying);
    videoEl.addEventListener("playing", handlePlaying);
    videoEl.addEventListener("pause", handleWaitingOrPause);
    videoEl.addEventListener("waiting", handleWaitingOrPause);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const trackListeners = [];
    if (stream) {
      const handleStreamTrackEvent = () => {
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
        }
        attemptPlay();
        checkTrackState();
      };

      stream.addEventListener("addtrack", handleStreamTrackEvent);
      stream.addEventListener("removetrack", handleStreamTrackEvent);

      stream.getVideoTracks().forEach((track) => {
        const onUnmute = () => {
          attemptPlay();
          checkTrackState();
        };
        const onMute = () => {
          checkTrackState();
        };
        const onEnded = () => {
          checkTrackState();
        };
        track.addEventListener("unmute", onUnmute);
        track.addEventListener("mute", onMute);
        track.addEventListener("ended", onEnded);
        trackListeners.push({ track, onUnmute, onMute, onEnded });
      });

      checkTrackState();

      return () => {
        videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoEl.removeEventListener("loadeddata", handleLoadedMetadata);
        videoEl.removeEventListener("canplay", handleLoadedMetadata);
        videoEl.removeEventListener("resize", handlePlaying);
        videoEl.removeEventListener("timeupdate", handlePlaying);
        videoEl.removeEventListener("playing", handlePlaying);
        videoEl.removeEventListener("pause", handleWaitingOrPause);
        videoEl.removeEventListener("waiting", handleWaitingOrPause);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        stream.removeEventListener("addtrack", handleStreamTrackEvent);
        stream.removeEventListener("removetrack", handleStreamTrackEvent);
        trackListeners.forEach(({ track, onUnmute, onMute, onEnded }) => {
          track.removeEventListener("unmute", onUnmute);
          track.removeEventListener("mute", onMute);
          track.removeEventListener("ended", onEnded);
        });
      };
    }

    return () => {
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoEl.removeEventListener("loadeddata", handleLoadedMetadata);
      videoEl.removeEventListener("canplay", handleLoadedMetadata);
      videoEl.removeEventListener("resize", handlePlaying);
      videoEl.removeEventListener("timeupdate", handlePlaying);
      videoEl.removeEventListener("playing", handlePlaying);
      videoEl.removeEventListener("pause", handleWaitingOrPause);
      videoEl.removeEventListener("waiting", handleWaitingOrPause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [participant.stream, participant.streamVersion, participant.isVideoOn, streamTrackSignature]);

  const hasLiveVideoTrack =
    participant.isVideoOn !== false &&
    Boolean(
      participant.stream &&
      participant.stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live")
    );

  const showVideo = hasLiveVideoTrack && isStreamPlaying;

  const initial = (participant.name || "P").charAt(0).toUpperCase();

  const isMcpa = participant.affiliation === "mcpa";
  const roleLabel = participant.role || (isMcpa ? "Lead Project Engineer" : "Client");
  const affiliationLabel = isMcpa ? "MCPA Team" : "Client";

  return (
    <div className="relative w-full h-full bg-[#111217] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center select-none shadow-md group">
      {/* Video Stream Element (ALWAYS MOUNTED IN DOM to prevent WebRTC unmount/race condition) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          showVideo ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"
        } ${isLocal && facingMode === "user" ? "-scale-x-100" : ""}`}
      />

      {/* Sleek Avatar Fallback when camera is disabled or waiting for initial frames */}
      {!showVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181920] to-[#0f1015]">
          <div
            className={`rounded-full flex items-center justify-center font-bold font-mono text-amber-300 border border-amber-500/30 bg-amber-500/10 ${
              isMiniStrip ? "w-10 h-10 text-sm" : "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
            }`}
          >
            {participant.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
        </div>
      )}

      {/* Top-Right Indicator: Audio Mute (NO CLUNKY PILL, JUST CLEAN RED ICON) */}
      {!participant.isMicOn && (
        <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-rose-600/90 text-white shadow-md">
          <MicOff className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Hand Raised Emoji */}
      {participant.isHandRaised && (
        <div className="absolute top-2.5 left-2.5 z-10 text-base sm:text-lg animate-bounce drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          ✋
        </div>
      )}

      {/* Bottom-Left: Participant Name & Role
          STRICT ANTI-AI: NO OVAL / RECTANGLE BACKGROUND BOX, NO DECORATIVE DOTS.
          Clean drop-shadow directly over video. */}
      <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-3.5 z-10 pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-left">
        <div className="text-white text-xs sm:text-sm font-semibold tracking-tight leading-snug truncate max-w-[200px] sm:max-w-[280px]">
          {participant.name}{" "}
          {isLocal && <span className="text-white/60 text-[11px] font-normal font-mono">(You)</span>}
        </div>
        {!isMiniStrip && (
          <div className="text-white/75 text-[10px] sm:text-[11px] font-normal tracking-wide truncate max-w-[200px] sm:max-w-[280px]">
            {roleLabel} · {affiliationLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleMeetRoom({
  roomCode = "mcpa-2026-meet",
  currentUser,
  userProfile,
  activeProject,
  onLeave,
  onAutoEndTimeout,
  isInstantMeeting = false,
  isAdmin = false,
  preloadedMediaStream = null,
  initialMicOn = true,
  initialVideoOn = true,
  initialCameraId = "",
  initialMicId = "",
  initialAudioOutputId = "",
  initialAudioOutputMode = "speaker",
  showToast = () => {},
}) {
  const canonicalRoomCode = useMemo(() => formatRoomCode(roomCode), [roomCode]);

  // Audio & Video Device Settings State
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    if (initialCameraId) return initialCameraId;
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_camera_id") || "";
    }
    return "";
  });
  const [selectedMicId, setSelectedMicId] = useState(() => {
    if (initialMicId) return initialMicId;
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_mic_id") || "";
    }
    return "";
  });
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(() => {
    if (initialAudioOutputId) return initialAudioOutputId;
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_speaker_id") || "";
    }
    return "";
  });
  const [audioOutputMode, setAudioOutputMode] = useState(() => {
    if (initialAudioOutputMode) return initialAudioOutputMode;
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_audio_output_mode") || "speaker";
    }
    return "speaker";
  });

  // Resolve user identity & affiliation
  const effectiveUser = userProfile || currentUser || {};
  const displayName =
    effectiveUser?.name ||
    effectiveUser?.fullName ||
    activeProject?.client_name ||
    (isAdmin ? "Engr. Raymart Quirante" : "Participant");

  const affiliation =
    effectiveUser?.affiliation ||
    (isAdmin ||
    (effectiveUser?.role || "").toUpperCase().includes("ADMIN") ||
    (effectiveUser?.role || "").toUpperCase().includes("ENGINEER")
      ? "mcpa"
      : "client");

  const userRole =
    effectiveUser?.role ||
    (affiliation === "mcpa" ? "Lead Project Engineer" : "Primary Client");

  const userAvatar = effectiveUser?.avatarUrl || effectiveUser?.avatar_url;

  // Local Media State
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isVideoOn, setIsVideoOn] = useState(initialVideoOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [localStream, setLocalStream] = useState(preloadedMediaStream || null);
  const [localStreamVersion, setLocalStreamVersion] = useState(0);
  const [screenStream, setScreenStream] = useState(null);
  const [localSocketId, setLocalSocketId] = useState("local");

  // Multi-Peer Mesh State
  const socketRef = useRef(null);
  const peerManagerRef = useRef(null);
  const localStreamRef = useRef(preloadedMediaStream || null);
  const screenStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const hasRemoteEverJoinedRef = useRef(false);
  const screenAudioMixerRef = useRef(null);

  const [peers, setPeers] = useState([]); // [{ socketId, stream, user, connectionState }]
  const [peerMediaStates, setPeerMediaStates] = useState({}); // socketId -> { isMicOn, isVideoOn, isScreenSharing, isHandRaised }
  const [p2pConnectionState, setP2pConnectionState] = useState("idle");
  const [isCallAnswered, setIsCallAnswered] = useState(isAdmin && !isInstantMeeting);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Stable client session ID (persists across carrier / Wi-Fi to cellular switches)
  const clientSessionIdRef = useRef(
    typeof window !== "undefined"
      ? window.sessionStorage?.getItem("mcpa_meet_session_id") ||
        `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      : "sess_initial"
  );

  useEffect(() => {
    if (typeof window !== "undefined" && clientSessionIdRef.current) {
      try {
        window.sessionStorage?.setItem("mcpa_meet_session_id", clientSessionIdRef.current);
      } catch (e) {}
    }
  }, []);

  // Time & Meeting Duration
  const callStartTimeRef = useRef(Date.now());
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [instantTimer, setInstantTimer] = useState(180); // 3-minute timeout for instant call
  const ringbackToneRef = useRef(null);
  const hasRecordedSessionRef = useRef(false);

  // Layout & Drawers
  const [isFloatingPiP, setIsFloatingPiP] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState(null); // 'chat' | 'people' | 'info' | null
  const activeSidePanelRef = useRef(null);
  useEffect(() => {
    activeSidePanelRef.current = activeSidePanel;
  }, [activeSidePanel]);

  const localMediaStateRef = useRef({
    isMicOn: initialMicOn,
    isVideoOn: initialVideoOn,
    isScreenSharing: false,
    isHandRaised: false,
  });
  useEffect(() => {
    localMediaStateRef.current = {
      isMicOn,
      isVideoOn,
      isScreenSharing,
      isHandRaised,
    };
  }, [isMicOn, isVideoOn, isScreenSharing, isHandRaised]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);

  // Rating Modal on Exit
  const [isLeaveRatingModalOpen, setIsLeaveRatingModalOpen] = useState(false);
  const [leaveRating, setLeaveRating] = useState(5);
  const [leaveHoverRating, setLeaveHoverRating] = useState(0);
  const [leaveNote, setLeaveNote] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable references for callbacks to prevent signaling socket teardown loops
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  const onAutoEndTimeoutRef = useRef(onAutoEndTimeout);
  useEffect(() => {
    onAutoEndTimeoutRef.current = onAutoEndTimeout;
  }, [onAutoEndTimeout]);

  const playLeaveChimeRef = useRef(null);

  const currentUserPayloadRef = useRef(null);
  useEffect(() => {
    currentUserPayloadRef.current = {
      id: effectiveUser?.id || currentUserPayloadRef.current?.id || `user-${Date.now()}`,
      name: displayName,
      role: userRole,
      affiliation,
      avatarUrl: userAvatar,
    };
    if (peerManagerRef.current) {
      peerManagerRef.current.currentUser = currentUserPayloadRef.current;
    }
  }, [displayName, userRole, affiliation, userAvatar, effectiveUser?.id]);

  // Duration Timer
  useEffect(() => {
    callStartTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setCallDurationSeconds(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timezone information (PH + Overseas)
  const [timeState, setTimeState] = useState({ phTime: "", localTime: "", isAbroad: false, tzLabel: "" });
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const phString = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const localString = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isAbroad = tz !== "Asia/Manila";
      setTimeState({ phTime: phString, localTime: localString, isAbroad, tzLabel: tz });
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Gentle audio chime when participant leaves
  const playLeaveChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }, []);

  // Handle Share / Copy Meeting Link
  const handleShareOrCopyLink = async () => {
    const url = buildMeetingUrl(canonicalRoomCode);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "MCPA Consultation Meeting",
          text: `Join our MCPA Consultation meeting: ${canonicalRoomCode}`,
          url,
        });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setHasCopiedLink(true);
      showToast("Meeting link copied to clipboard!");
      setTimeout(() => setHasCopiedLink(false), 2500);
    } catch (e) {
      showToast(`Meeting link: ${url}`);
    }
  };

  // Safe Exit Call Procedure
  const performActualLeave = (rating = null, note = "", options = {}) => {
    const shouldSkipRecord =
      Boolean(options?.skipRecord) ||
      (isInstantMeeting && !hasRemoteEverJoinedRef.current);

    if (!hasRecordedSessionRef.current) {
      hasRecordedSessionRef.current = true;
      if (!shouldSkipRecord) {
        try {
          const finalDurationSec = Math.max(callDurationSeconds, 1);
          const resolvedClientName =
            activeProject?.client_name ||
            activeProject?.clientName ||
            (!isAdmin ? displayName : "Valued Client");

          recordConcludedMeeting({
            roundTitle: isInstantMeeting ? "Instant Online Consultation" : "Online Video Engineering Review",
            mode: isInstantMeeting ? "Instant Online Meeting" : "Scheduled Online Video",
            durationSeconds: finalDurationSec,
            rating: typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : 5,
            clientNote: note || "Consultation session concluded.",
            minutes: `Live deliberation held via MCPA WebRTC Room: ${canonicalRoomCode}. Duration: ${formatMeetingDuration(finalDurationSec)}.`,
            venue: `MCPA Meeting Room · ${canonicalRoomCode}`,
            leadConsultant: "Engr. Raymart Quirante",
            leadRole: "Lead Project Engineer & Consultant",
            clientName: resolvedClientName,
            clientEmail:
              activeProject?.client_email ||
              activeProject?.clientEmail ||
              (!isAdmin ? effectiveUser?.email : "martquirante@gmail.com") ||
              "",
            projectCode: activeProject?.project_code || "MCPA-CONSULTATION",
            projectTitle: activeProject?.project_title || "Residential Consultation",
            roomCode: canonicalRoomCode,
          });
        } catch (e) {}
      }
    }

    if (ringbackToneRef.current) {
      ringbackToneRef.current.stop();
      ringbackToneRef.current = null;
    }

    if (socketRef.current) {
      try {
        if (isInstantMeeting) {
          socketRef.current.emit("instant-call-ended", { roomCode: canonicalRoomCode });
        }
        socketRef.current.emit("leave-room", { roomCode: canonicalRoomCode });
        setTimeout(() => socketRef.current?.disconnect(), 400);
      } catch (e) {}
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenAudioMixerRef.current) {
      screenAudioMixerRef.current.stop();
      screenAudioMixerRef.current = null;
    }

    if (!options?.skipExpiryMark) {
      markRoomConcluded(canonicalRoomCode);
    }

    if (onLeaveRef.current) {
      onLeaveRef.current();
    }
  };

  const handleLeaveCall = () => {
    // Only show the client 5-star rating modal for non-admin clients when a session actually took place
    if (
      !hasRecordedSessionRef.current &&
      !isAdmin &&
      (!isInstantMeeting || hasRemoteEverJoinedRef.current)
    ) {
      setIsLeaveRatingModalOpen(true);
      return;
    }
    performActualLeave(null, "", {
      skipRecord: isInstantMeeting && !hasRemoteEverJoinedRef.current,
    });
  };

  const isMediaMountedRef = useRef(false);

  // INITIALIZE MEDIA: Use preloaded stream if passed from lobby, or acquire new
  useEffect(() => {
    let active = true;
    isMediaMountedRef.current = true;

    async function syncStreamWithPeers(stream) {
      if (!stream) return;
      const hasLiveVideo = stream.getVideoTracks().some((t) => t.readyState === "live");
      const hasLiveAudio = stream.getAudioTracks().some((t) => t.readyState === "live");

      const targetMic = hasLiveAudio ? localMediaStateRef.current.isMicOn : false;
      const targetVideo = hasLiveVideo ? localMediaStateRef.current.isVideoOn : false;

      stream.getAudioTracks().forEach((t) => {
        t.enabled = targetMic;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = targetVideo;
      });

      if (!hasLiveVideo && localMediaStateRef.current.isVideoOn) {
        localMediaStateRef.current.isVideoOn = false;
        setIsVideoOn(false);
      }
      if (!hasLiveAudio && localMediaStateRef.current.isMicOn) {
        localMediaStateRef.current.isMicOn = false;
        setIsMicOn(false);
      }

      setLocalStream(stream);
      setLocalStreamVersion((v) => v + 1);

      if (peerManagerRef.current) {
        await peerManagerRef.current.attachLocalTracks(stream);
      }

      if (socketRef.current?.connected) {
        socketRef.current.emit("peer-state-change", {
          roomCode: canonicalRoomCode,
          isMicOn: targetMic,
          isVideoOn: targetVideo,
          isScreenSharing: localMediaStateRef.current.isScreenSharing,
        });
      }
    }

    async function setupLocalMedia() {
      // 1. Reuse preloaded stream if it still has live tracks
      if (
        preloadedMediaStream &&
        preloadedMediaStream.getTracks().some((t) => t.readyState === "live")
      ) {
        console.log("[WEBRTC] Adopting preloaded media stream from pre-join lobby.");
        localStreamRef.current = preloadedMediaStream;
        await syncStreamWithPeers(preloadedMediaStream);
        return;
      }

      // 2. Reuse existing localStreamRef if already live (e.g. across React StrictMode remount)
      if (
        localStreamRef.current &&
        localStreamRef.current.getTracks().some((t) => t.readyState === "live")
      ) {
        await syncStreamWithPeers(localStreamRef.current);
        return;
      }

      try {
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: OPTIMAL_AUDIO_CONSTRAINTS,
          });
        } catch (optimalErr) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: FALLBACK_AUDIO_CONSTRAINTS,
            });
          } catch (stdErr) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
            } catch (basicErr) {
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: false,
                });
              } catch (videoOnlyErr) {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: false,
                  audio: FALLBACK_AUDIO_CONSTRAINTS,
                });
              }
            }
          }
        }

        if (!active || !isMediaMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        await syncStreamWithPeers(stream);
      } catch (err) {
        console.warn("[WEBRTC] Could not access camera/mic, falling back to avatar:", err);
        localMediaStateRef.current.isVideoOn = false;
        setIsVideoOn(false);
        if (socketRef.current?.connected) {
          socketRef.current.emit("peer-state-change", {
            roomCode: canonicalRoomCode,
            isMicOn: localMediaStateRef.current.isMicOn,
            isVideoOn: false,
            isScreenSharing: localMediaStateRef.current.isScreenSharing,
          });
        }
      }
    }

    setupLocalMedia();

    return () => {
      active = false;
      isMediaMountedRef.current = false;
      // Defer track stop so React StrictMode's immediate unmount+remount cycle
      // does not kill live camera/microphone tracks.
      setTimeout(() => {
        if (!isMediaMountedRef.current && localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
      }, 150);
    };
  }, [preloadedMediaStream, canonicalRoomCode]);

  // INITIALIZE WEBRTC & SOCKET.IO SIGNALING
  useEffect(() => {
    if (!mounted || !canonicalRoomCode) return;

    const serverUrl = getSignalingServerUrl();
    console.log(`[WEBRTC MESH] Connecting to signaling server: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      timeout: 15000,
    });
    socketRef.current = socket;

    const currentUserPayload = currentUserPayloadRef.current || {
      id: effectiveUser?.id || `user-${Date.now()}`,
      name: displayName,
      role: userRole,
      affiliation,
      avatarUrl: userAvatar,
    };

    const peerManager = new WebRTCPeerManager({
      socket,
      roomCode: canonicalRoomCode,
      currentUser: currentUserPayload,
      localStream: localStreamRef.current,
      onPeersChange: (updatedPeers) => {
        console.log("[WEBRTC MESH] Active peers changed. Count:", updatedPeers.length);
        setPeers(updatedPeers);
        if (updatedPeers.length > 0) {
          hasRemoteEverJoinedRef.current = true;
          setIsCallAnswered(true);
          if (ringbackToneRef.current) {
            ringbackToneRef.current.stop();
            ringbackToneRef.current = null;
          }
        }
      },
      onConnectionStateChange: (state, socketId) => {
        setP2pConnectionState(state);
        if (state === "connected") {
          hasRemoteEverJoinedRef.current = true;
          setIsCallAnswered(true);
        } else if (state === "failed") {
          console.warn(`[WEBRTC MESH] P2P state failed with ${socketId}. Watchdog will attempt recovery.`);
        }
      },
      onPeerLeft: (socketId, user) => {
        const name = user?.name || "A participant";
        showToastRef.current?.(`${name} left the meeting.`);
        if (playLeaveChimeRef.current) {
          playLeaveChimeRef.current();
        }
      },
    });
    peerManagerRef.current = peerManager;

    if (localStreamRef.current) {
      peerManager.attachLocalTracks(localStreamRef.current);
    }

    const joinRoom = () => {
      const baseUser = currentUserPayloadRef.current || currentUserPayload;
      socket.emit("join-room", {
        roomCode: canonicalRoomCode,
        user: {
          ...baseUser,
          clientSessionId: clientSessionIdRef.current,
          mediaState: localMediaStateRef.current,
        },
        role: affiliation === "mcpa" ? "admin" : "client",
      });
    };

    let hasConnectedOnce = false;

    socket.on("connect", () => {
      console.log(`[WEBRTC MESH] Connected with socket ID: ${socket.id} (Reconnection: ${hasConnectedOnce})`);
      setLocalSocketId(socket.id || "local");
      if (hasConnectedOnce && peerManagerRef.current) {
        // Automatic recovery on socket reconnection after signal blackout
        peerManagerRef.current.reconnectAllPeers().catch(() => {});
      }
      hasConnectedOnce = true;
      joinRoom();
    });

    if (socket.connected) {
      setLocalSocketId(socket.id || "local");
      hasConnectedOnce = true;
      joinRoom();
    }

    // Room capacity full handler (Max 8 participants)
    socket.on("room-full", ({ message }) => {
      showToastRef.current?.(
        message || "This consultation room has reached its maximum capacity (8/8 participants)."
      );
      performActualLeave(null, "", { skipRecord: true, skipExpiryMark: true });
    });

    // Room expired handler (5 minutes after call ended)
    socket.on("room-expired", ({ message, endedAt }) => {
      if (endedAt) {
        markRoomConcluded(canonicalRoomCode, endedAt);
      }
      showToastRef.current?.(
        message || "⏰ This consultation room has expired (5 minutes after the call ended)."
      );
      performActualLeave(null, "", { skipRecord: true, skipExpiryMark: true });
    });

    // Existing participants in room
    socket.on("room-joined", ({ participants }) => {
      clearRoomConcluded(canonicalRoomCode);
      if (participants && participants.length > 0) {
        console.log("[WEBRTC MESH] Existing peers in room:", participants);
        hasRemoteEverJoinedRef.current = true;
        setIsCallAnswered(true);
        if (ringbackToneRef.current) {
          ringbackToneRef.current.stop();
          ringbackToneRef.current = null;
        }
        setPeerMediaStates((prev) => {
          const next = { ...prev };
          participants.forEach((p) => {
            const pState = p.mediaState || p.user?.mediaState;
            if (p.socketId && pState) {
              next[p.socketId] = {
                ...next[p.socketId],
                isMicOn: pState.isMicOn !== false,
                isVideoOn: pState.isVideoOn !== false,
                isScreenSharing: Boolean(pState.isScreenSharing),
                isHandRaised: Boolean(pState.isHandRaised),
              };
            }
          });
          return next;
        });
        participants.forEach((p) => {
          peerManager.createAndSendOffer(p.socketId, p.user || p);
        });
        // Broadcast our initial media state to existing participants
        socket.emit("peer-state-change", {
          roomCode: canonicalRoomCode,
          isMicOn: localMediaStateRef.current.isMicOn,
          isVideoOn: localMediaStateRef.current.isVideoOn,
          isScreenSharing: localMediaStateRef.current.isScreenSharing,
        });
      }
    });

    // New participant joins
    socket.on("user-joined", ({ socketId, user }) => {
      console.log("[WEBRTC MESH] User joined:", user?.name, socketId);
      hasRemoteEverJoinedRef.current = true;
      setIsCallAnswered(true);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
      showToastRef.current?.(`${user?.name || "Participant"} joined the call.`);
      if (socketId) {
        if (user?.mediaState) {
          setPeerMediaStates((prev) => ({
            ...prev,
            [socketId]: {
              ...prev[socketId],
              isMicOn: user.mediaState.isMicOn !== false,
              isVideoOn: user.mediaState.isVideoOn !== false,
              isScreenSharing: Boolean(user.mediaState.isScreenSharing),
              isHandRaised: Boolean(user.mediaState.isHandRaised),
            },
          }));
        }
        peerManager.getOrCreatePeer(socketId, user);
        // Broadcast our current media state so the new participant sees our exact mic/camera/screen/hand status
        socket.emit("peer-state-change", {
          roomCode: canonicalRoomCode,
          isMicOn: localMediaStateRef.current.isMicOn,
          isVideoOn: localMediaStateRef.current.isVideoOn,
          isScreenSharing: localMediaStateRef.current.isScreenSharing,
        });
        if (localMediaStateRef.current.isHandRaised) {
          socket.emit("toggle-hand-raise", {
            roomCode: canonicalRoomCode,
            isHandRaised: true,
          });
        }
      }
    });

    socket.on("webrtc-offer", async ({ fromSocketId, sdpOffer, sender, isIceRestart }) => {
      await peerManager.handleOfferAndSendAnswer(sdpOffer, fromSocketId, sender, isIceRestart);
    });

    socket.on("webrtc-answer", async ({ fromSocketId, sdpAnswer, sender }) => {
      await peerManager.handleAnswer(sdpAnswer, fromSocketId, sender);
    });

    socket.on("ice-candidate", async ({ fromSocketId, candidate }) => {
      await peerManager.handleIceCandidate(candidate, fromSocketId);
    });

    socket.on("request-ice-restart", async ({ fromSocketId }) => {
      await peerManager.handleRequestIceRestart(fromSocketId);
    });

    // Remote peer media state changes (mute, video toggle, screen share)
    socket.on("peer-state-updated", ({ socketId, isMicOn: mOn, isVideoOn: vOn, isScreenSharing: sOn }) => {
      setPeerMediaStates((prev) => ({
        ...prev,
        [socketId]: {
          ...prev[socketId],
          isMicOn: mOn,
          isVideoOn: vOn,
          isScreenSharing: sOn,
        },
      }));
    });

    // Hand raised events
    socket.on("peer-hand-raised", ({ socketId, isHandRaised: raised, from }) => {
      setPeerMediaStates((prev) => ({
        ...prev,
        [socketId]: {
          ...prev[socketId],
          isHandRaised: raised,
        },
      }));
      if (raised) {
        showToastRef.current?.(`✋ ${from || "Participant"} raised hand`);
      }
    });

    // Chat messages
    socket.on("chat-message-received", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderSocketId !== socket.id && activeSidePanelRef.current !== "chat") {
        setUnreadCount((c) => c + 1);
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    // Emoji reactions
    socket.on("reaction-received", ({ id, emoji }) => {
      setFloatingReactions((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2800);
    });

    socket.on("peer-left", ({ socketId, user }) => {
      peerManager.removePeer(socketId);
      setPeerMediaStates((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      const name = user?.name || "A participant";
      showToastRef.current?.(`${name} left the room.`);
      if (playLeaveChimeRef.current) {
        playLeaveChimeRef.current();
      }
    });

    // Server-enforced Single Presenter Rule: screen share rejected if another presenter is already active
    socket.on("screen-share-rejected", ({ presenterName, message }) => {
      console.warn("[WEBRTC] Screen share conflict rejected by server:", message);
      if (screenAudioMixerRef.current) {
        screenAudioMixerRef.current.stop();
        screenAudioMixerRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      showToastRef.current?.(
        message ||
          `⚠️ Cannot share screen while another participant is presenting. ${presenterName || "Another participant"} is currently sharing their screen.`
      );
    });

    return () => {
      try {
        socket.emit("leave-room", { roomCode: canonicalRoomCode });
      } catch (e) {}
      peerManager.close();
      socket.disconnect();
    };
  }, [mounted, canonicalRoomCode]);

  // Connect playLeaveChimeRef
  useEffect(() => {
    playLeaveChimeRef.current = playLeaveChime;
  }, [playLeaveChime]);

  // Instant meeting 3-minute timeout & ringback tone
  useEffect(() => {
    if (!isInstantMeeting) return;

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

    const timer = setInterval(() => {
      setInstantTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (ringbackToneRef.current) {
            ringbackToneRef.current.stop();
            ringbackToneRef.current = null;
          }
          performActualLeave(null, "", { skipRecord: true });
          if (onAutoEndTimeoutRef.current) onAutoEndTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (ringbackToneRef.current) {
        ringbackToneRef.current.stop();
        ringbackToneRef.current = null;
      }
    };
  }, [isInstantMeeting, isAdmin, isCallAnswered]);

  // Handle network shifts (Wi-Fi <-> Mobile Data, brief dropouts, online event)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let recoveryDebounceTimer = null;
    const triggerNetworkRecovery = () => {
      if (recoveryDebounceTimer) clearTimeout(recoveryDebounceTimer);
      recoveryDebounceTimer = setTimeout(() => {
        console.log("[WEBRTC] Network transition detected (online/carrier switch). Reviving connection...");
        showToastRef.current?.("📶 Network connection restored. Resuming video & audio...");

        if (socketRef.current) {
          if (!socketRef.current.connected) {
            socketRef.current.connect();
          } else {
            // Re-announce presence with active session ID
            socketRef.current.emit("join-room", {
              roomCode: canonicalRoomCode,
              user: {
                ...(currentUserPayloadRef.current || currentUserPayload),
                clientSessionId: clientSessionIdRef.current,
                mediaState: localMediaStateRef.current,
              },
              role: affiliation === "mcpa" ? "admin" : "client",
              isReconnection: true,
            });
          }
        }

        if (peerManagerRef.current) {
          peerManagerRef.current.reconnectAllPeers().catch(() => {});
        }
      }, 500);
    };

    const handleOffline = () => {
      showToastRef.current?.("⚠️ Network lost. Reconnecting once internet is back...");
    };

    window.addEventListener("online", triggerNetworkRecovery);
    window.addEventListener("offline", handleOffline);

    // Modern mobile carrier switch detection (WiFi <-> LTE/5G)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", triggerNetworkRecovery);
    }

    return () => {
      if (recoveryDebounceTimer) clearTimeout(recoveryDebounceTimer);
      window.removeEventListener("online", triggerNetworkRecovery);
      window.removeEventListener("offline", handleOffline);
      if (conn && typeof conn.removeEventListener === "function") {
        conn.removeEventListener("change", triggerNetworkRecovery);
      }
    };
  }, [canonicalRoomCode, affiliation, currentUserPayload]);

  // Toggle Microphone
  const toggleAudio = async () => {
    const nextState = !isMicOn;
    const liveAudioTracks = localStreamRef.current
      ? localStreamRef.current.getAudioTracks().filter((t) => t.readyState === "live")
      : [];

    if (nextState && liveAudioTracks.length === 0 && navigator?.mediaDevices?.getUserMedia) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: FALLBACK_AUDIO_CONSTRAINTS,
          video: false,
        });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack) {
          newAudioTrack.enabled = true;
          const existingVideoTracks = localStreamRef.current
            ? localStreamRef.current.getVideoTracks().filter((t) => t.readyState === "live")
            : [];
          const updatedStream = new MediaStream([...existingVideoTracks, newAudioTrack]);
          localStreamRef.current = updatedStream;
          setLocalStream(updatedStream);
          setLocalStreamVersion((v) => v + 1);
          if (peerManagerRef.current) {
            peerManagerRef.current.localStream = updatedStream;
            await peerManagerRef.current.replaceAudioTrack(newAudioTrack);
          }
        }
      } catch (err) {
        showToast("Unable to access microphone. Please check browser permissions.");
        return;
      }
    } else if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }

    if (screenAudioMixerRef.current?.micGain) {
      screenAudioMixerRef.current.micGain.gain.setValueAtTime(
        nextState ? 1.0 : 0.0,
        screenAudioMixerRef.current.audioCtx?.currentTime || 0
      );
    }
    setIsMicOn(nextState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode: canonicalRoomCode,
        isMicOn: nextState,
        isVideoOn,
        isScreenSharing,
      });
    }
  };

  // Toggle Camera
  const toggleVideo = async () => {
    const nextState = !isVideoOn;
    const liveVideoTracks = localStreamRef.current
      ? localStreamRef.current.getVideoTracks().filter((t) => t.readyState === "live")
      : [];

    if (nextState && liveVideoTracks.length === 0 && navigator?.mediaDevices?.getUserMedia) {
      try {
        let camStream = null;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (errConstraint) {
          camStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        const newVideoTrack = camStream.getVideoTracks()[0];
        if (newVideoTrack) {
          newVideoTrack.enabled = true;
          const existingAudioTracks = localStreamRef.current
            ? localStreamRef.current.getAudioTracks().filter((t) => t.readyState === "live")
            : [];
          const updatedStream = new MediaStream([...existingAudioTracks, newVideoTrack]);
          localStreamRef.current = updatedStream;
          setLocalStream(updatedStream);
          setLocalStreamVersion((v) => v + 1);
          if (peerManagerRef.current) {
            peerManagerRef.current.localStream = updatedStream;
            if (!isScreenSharing) {
              await peerManagerRef.current.replaceVideoTrack(newVideoTrack);
            }
          }
        }
      } catch (err) {
        showToast("Unable to access camera. Check browser permissions or if another app is using it.");
        return;
      }
    } else if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextState;
      });
      if (nextState && peerManagerRef.current && !isScreenSharing && liveVideoTracks[0]) {
        peerManagerRef.current.replaceVideoTrack(liveVideoTracks[0]).catch(() => {});
      }
    }

    setIsVideoOn(nextState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode: canonicalRoomCode,
        isMicOn,
        isVideoOn: nextState,
        isScreenSharing,
      });
    }
  };

  // Flip Camera between Front & Rear on Mobile
  const flipCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) return;
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
        newVideoTrack.enabled = isVideoOn;
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        const updatedLocalStream = new MediaStream(localStreamRef.current.getTracks());
        localStreamRef.current = updatedLocalStream;
        setLocalStream(updatedLocalStream);
        setLocalStreamVersion((v) => v + 1);
        if (peerManagerRef.current && !isScreenSharing) {
          await peerManagerRef.current.replaceVideoTrack(newVideoTrack);
        }
      }
      setFacingMode(nextFacing);
      showToast(`Switched to ${nextFacing === "user" ? "front" : "rear"} camera`);
    } catch (err) {
      showToast("Unable to switch camera.");
    }
  };

  // Device Selection & Audio Output Mode Handlers
  const handleSelectCamera = async (deviceId) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem("mcpa_selected_camera_id", deviceId);
    } catch (e) {}

    if (!navigator?.mediaDevices?.getUserMedia) return;
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && localStreamRef.current) {
        newVideoTrack.enabled = isVideoOn;
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        const updated = new MediaStream(localStreamRef.current.getTracks());
        localStreamRef.current = updated;
        setLocalStream(updated);
        setLocalStreamVersion((v) => v + 1);

        if (peerManagerRef.current && !isScreenSharing) {
          await peerManagerRef.current.replaceVideoTrack(newVideoTrack);
        }
      }
      showToast("Camera switched successfully");
    } catch (err) {
      console.warn("Camera switch error:", err);
      showToast("Failed to switch camera");
    }
  };

  const handleSelectMic = async (deviceId) => {
    setSelectedMicId(deviceId);
    try {
      localStorage.setItem("mcpa_selected_mic_id", deviceId);
    } catch (e) {}

    if (!navigator?.mediaDevices?.getUserMedia) return;
    try {
      const constraints = {
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          ...OPTIMAL_AUDIO_CONSTRAINTS,
        },
        video: false,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack && localStreamRef.current) {
        newAudioTrack.enabled = isMicOn;
        const oldTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newAudioTrack);
        const updated = new MediaStream(localStreamRef.current.getTracks());
        localStreamRef.current = updated;
        setLocalStream(updated);
        setLocalStreamVersion((v) => v + 1);

        if (peerManagerRef.current) {
          await peerManagerRef.current.replaceAudioTrack(newAudioTrack);
        }
      }
      showToast("Microphone switched successfully");
    } catch (err) {
      console.warn("Microphone switch error:", err);
      showToast("Failed to switch microphone");
    }
  };

  const handleSelectAudioOutput = (deviceId) => {
    setSelectedAudioOutputId(deviceId);
    try {
      localStorage.setItem("mcpa_selected_speaker_id", deviceId);
    } catch (e) {}
    showToast("Speaker output updated");
  };

  const handleSelectAudioOutputMode = (mode) => {
    setAudioOutputMode(mode);
    try {
      localStorage.setItem("mcpa_audio_output_mode", mode);
    } catch (e) {}
    if (mode === "earpiece") {
      showToast("👂 Earpiece mode (Mahinang tunog sa tenga)");
    } else if (mode === "headset") {
      showToast("🎧 Headset mode");
    } else {
      showToast("🔊 Loudspeaker mode");
    }
  };

  const cycleAudioOutputMode = () => {
    const nextMode =
      audioOutputMode === "speaker"
        ? "earpiece"
        : audioOutputMode === "earpiece"
        ? "headset"
        : "speaker";
    handleSelectAudioOutputMode(nextMode);
  };

  // Toggle Screen Sharing with Mobile Support & Informative Device Guidance
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenAudioMixerRef.current) {
        screenAudioMixerRef.current.stop();
        screenAudioMixerRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      if (peerManagerRef.current) {
        const camTrack = localStreamRef.current?.getVideoTracks()?.[0] || null;
        if (camTrack) {
          camTrack.enabled = isVideoOn;
        }
        await peerManagerRef.current.replaceVideoTrack(camTrack);

        const micTrack = localStreamRef.current?.getAudioTracks()?.[0] || null;
        if (micTrack) {
          micTrack.enabled = isMicOn;
          await peerManagerRef.current.replaceAudioTrack(micTrack);
        }
      }
      setIsScreenSharing(false);
      showToast("Screen presentation ended.");
      if (socketRef.current?.connected) {
        socketRef.current.emit("peer-state-change", {
          roomCode: canonicalRoomCode,
          isMicOn,
          isVideoOn,
          isScreenSharing: false,
        });
      }
    } else {
      // Rule 1: Single Presenter Rule (Only ONE participant can share screen at a time in the room)
      const remotePresenter = peers.find((p) => peerMediaStates[p.socketId]?.isScreenSharing);
      if (remotePresenter) {
        const presenterName = remotePresenter.user?.name || "Another participant";
        showToast(`⚠️ Cannot share screen while another participant is presenting. ${presenterName} is currently sharing their screen.`);
        return;
      }

      // Rule 2: Mobile Devices (Screen sharing is disabled on mobile devices to prevent OS restrictions and notification leaks)
      const isMobile =
        typeof navigator !== "undefined" &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
          (typeof window !== "undefined" && window.innerWidth < 640));

      if (isMobile) {
        showToast("Screen sharing is available on Desktop/Laptop computers only. On mobile, please use Flip Camera 🔄 to present drawings or documents.");
        return;
      }

      // Rule 3: Browser getDisplayMedia API check
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        showToast("Screen sharing is not supported by this browser. Please use Chrome, Edge, or Firefox on a Laptop/Desktop.");
        return;
      }

      try {
        let nextScreenStream = null;
        // Studio-grade display media audio configuration for high clarity
        const displayMediaOptions = {
          video: {
            cursor: "always",
            displaySurface: "browser",
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2,
            sampleRate: 48000,
          },
          systemAudio: "include",
          selfBrowserSurface: "exclude",
          surfaceSwitching: "include",
        };

        try {
          nextScreenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        } catch (stdErr) {
          try {
            nextScreenStream = await navigator.mediaDevices.getDisplayMedia({
              video: { cursor: "always" },
              audio: true,
            });
          } catch (audioErr) {
            nextScreenStream = await navigator.mediaDevices.getDisplayMedia({
              video: { cursor: "always" },
              audio: false,
            });
          }
        }

        if (!nextScreenStream) {
          showToast("Could not start screen sharing.");
          return;
        }

        screenStreamRef.current = nextScreenStream;
        setScreenStream(nextScreenStream);
        setIsScreenSharing(true);

        const screenTrack = nextScreenStream.getVideoTracks()[0];
        if (peerManagerRef.current && screenTrack) {
          await peerManagerRef.current.replaceVideoTrack(screenTrack);
        }

        // Mix captured tab/system audio with user microphone
        const screenAudioTracks = nextScreenStream.getAudioTracks();
        if (screenAudioTracks.length > 0) {
          console.log("[WEBRTC] Screen audio detected, mixing with microphone...");
          const screenAudioTrack = screenAudioTracks[0];
          const micTrack = localStreamRef.current?.getAudioTracks()?.[0] || null;

          const mixer = new ScreenAudioMixer(micTrack, screenAudioTrack);
          const mixedTrack = mixer.start();
          screenAudioMixerRef.current = mixer;

          // If local mic is currently muted, mute micGain in mixer
          if (!isMicOn && mixer.micGain && mixer.audioCtx) {
            mixer.micGain.gain.setValueAtTime(0.0, mixer.audioCtx.currentTime);
          }

          if (peerManagerRef.current && mixedTrack) {
            await peerManagerRef.current.replaceAudioTrack(mixedTrack);
          }

          screenAudioTrack.onended = async () => {
            console.log("[WEBRTC] Screen audio track ended.");
            if (screenAudioMixerRef.current) {
              screenAudioMixerRef.current.stop();
              screenAudioMixerRef.current = null;
            }
            if (peerManagerRef.current && localStreamRef.current) {
              const originalMicTrack = localStreamRef.current.getAudioTracks()[0];
              if (originalMicTrack) {
                await peerManagerRef.current.replaceAudioTrack(originalMicTrack);
              }
            }
          };
        }

        screenTrack.onended = () => {
          handleToggleScreenShare();
        };

        if (socketRef.current?.connected) {
          socketRef.current.emit("peer-state-change", {
            roomCode: canonicalRoomCode,
            isMicOn,
            isVideoOn,
            isScreenSharing: true,
          });
        }
        showToast(
          screenAudioTracks.length > 0
            ? "Presenting screen with audio enabled 🔊"
            : "You are now presenting your screen."
        );
      } catch (err) {
        console.warn("[WEBRTC] Screen share error on mobile/desktop:", err);
        if (err.name === "NotAllowedError") {
          showToast("Screen share cancelled or permission not granted.");
        } else {
          showToast("Screen sharing failed on this device. Please use a laptop or desktop computer.");
        }
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("toggle-hand-raise", {
        roomCode: canonicalRoomCode,
        isHandRaised: nextState,
      });
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
      socketRef.current.emit("send-reaction", {
        roomCode: canonicalRoomCode,
        emoji,
      });
    }
  };

  // Send Chat Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    const msg = {
      id: Date.now().toString(),
      sender: displayName,
      senderSocketId: socketRef.current.id,
      text: chatInput.trim(),
      role: userRole,
      affiliation,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    socketRef.current.emit("send-chat-message", {
      roomCode: canonicalRoomCode,
      message: msg,
    });
    setChatInput("");
  };

  // Collect all participants list (Local + Remote)
  const allParticipants = useMemo(() => {
    const list = [
      {
        id: "local",
        socketId: localSocketId,
        name: displayName,
        role: userRole,
        affiliation,
        stream: localStream,
        streamVersion: localStreamVersion,
        isLocal: true,
        isVideoOn,
        isMicOn,
        isHandRaised,
        avatarUrl: userAvatar,
      },
    ];

    peers.forEach((peer) => {
      const state = peerMediaStates[peer.socketId] || {};
      list.push({
        id: peer.socketId,
        socketId: peer.socketId,
        name: peer.user?.name || "Participant",
        role: peer.user?.role || (peer.user?.affiliation === "mcpa" ? "MCPA Team" : "Client"),
        affiliation: peer.user?.affiliation || "client",
        stream: peer.stream,
        streamVersion: peer.streamVersion || 0,
        isLocal: false,
        isVideoOn: state.isVideoOn !== false,
        isMicOn: state.isMicOn !== false,
        isHandRaised: Boolean(state.isHandRaised),
        avatarUrl: peer.user?.avatarUrl,
      });
    });

    return list;
  }, [localSocketId, displayName, userRole, affiliation, localStream, localStreamVersion, isVideoOn, isMicOn, isHandRaised, userAvatar, peers, peerMediaStates]);

  // Check if someone is actively sharing their screen
  const activeScreenShare = useMemo(() => {
    if (isScreenSharing && screenStream) {
      return {
        isLocal: true,
        presenterName: displayName,
        stream: screenStream,
        streamVersion: 0,
      };
    }
    const remotePresenter = peers.find((p) => peerMediaStates[p.socketId]?.isScreenSharing);
    if (remotePresenter) {
      return {
        isLocal: false,
        presenterName: remotePresenter.user?.name || "Participant",
        stream: remotePresenter.stream,
        streamVersion: remotePresenter.streamVersion || 0,
      };
    }
    return null;
  }, [isScreenSharing, screenStream, displayName, peers, peerMediaStates]);

  const isAnotherPresenterActive = Boolean(activeScreenShare && !activeScreenShare.isLocal);

  // Connect screen share video element
  useEffect(() => {
    if (screenVideoRef.current && activeScreenShare?.stream) {
      if (screenVideoRef.current.srcObject !== activeScreenShare.stream) {
        screenVideoRef.current.srcObject = activeScreenShare.stream;
      }
      screenVideoRef.current.play().catch(() => {});
    }
  }, [activeScreenShare]);

  const participantCount = allParticipants.length;

  if (!mounted || typeof document === "undefined") return null;

  const roomContent = (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col bg-[#0b0c10] text-white select-none ${
        isFloatingPiP ? "w-80 h-48 bottom-4 right-4 top-auto left-auto rounded-2xl shadow-2xl border border-white/20 overflow-hidden" : ""
      }`}
    >
      {/* Remote Audio Track Elements (Guarantees zero audio dropouts for all peers) */}
      {peers.map((peer) => (
        <RemotePeerAudio
          key={peer.socketId}
          stream={peer.stream}
          streamVersion={peer.streamVersion || 0}
          sinkId={selectedAudioOutputId}
          audioOutputMode={audioOutputMode}
        />
      ))}

      {/* Floating PiP Restore Button */}
      {isFloatingPiP && (
        <button
          type="button"
          onClick={() => setIsFloatingPiP(false)}
          className="absolute top-2.5 right-2.5 z-50 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/15 transition-colors cursor-pointer"
          title="Expand to full screen"
        >
          <Maximize2 className="w-4 h-4 text-amber-400" />
        </button>
      )}

      {/* 1. TOP HEADER (CLEAN, ZERO ARBITRARY DOTS, MOBILE-FIRST) */}
      {!isFloatingPiP && (
        <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-white/[0.06] bg-[#0e0f14]/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-400">
              MCPA Meet
            </h2>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={handleShareOrCopyLink}
              className="flex items-center gap-1.5 text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer group"
              title="Click to copy or share link"
            >
              <span>{canonicalRoomCode}</span>
              {hasCopiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400 transition-colors" />
              )}
            </button>
            {timeState.isAbroad && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-white/40">
                <Globe className="w-3 h-3" />
                <span>PH {timeState.phTime}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Flip camera on mobile */}
            {isVideoOn && (
              <button
                type="button"
                onClick={flipCamera}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex sm:hidden"
                title="Switch camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Quick Audio Output Toggle (Speaker / Earpiece / Headset) */}
            <button
              type="button"
              onClick={cycleAudioOutputMode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                audioOutputMode === "earpiece"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : audioOutputMode === "headset"
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                  : "bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border-white/10"
              }`}
              title={`Audio output mode: ${
                audioOutputMode === "earpiece"
                  ? "Phone Earpiece (Tenga / Mahina)"
                  : audioOutputMode === "headset"
                  ? "Headset"
                  : "Loudspeaker (Malakas)"
              }. Click to switch.`}
            >
              {audioOutputMode === "earpiece" ? (
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              ) : audioOutputMode === "headset" ? (
                <Headphones className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white/70" />
              )}
              <span className="hidden sm:inline capitalize">
                {audioOutputMode === "earpiece"
                  ? "Earpiece"
                  : audioOutputMode === "headset"
                  ? "Headset"
                  : "Speaker"}
              </span>
            </button>

            {/* Audio & Video Device Settings Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsDeviceSettingsOpen(true)}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Camera, Microphone & Speaker Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Instant call standby timer */}
            {isInstantMeeting && !isCallAnswered && (
              <div className="text-xs font-mono text-amber-400 font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Calling... {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}
              </div>
            )}

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShareOrCopyLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-mono font-semibold text-white transition-all cursor-pointer border border-white/10"
              title="Share meeting invitation"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{hasCopiedLink ? "Copied" : "Share"}</span>
            </button>

            {/* Mobile Info drawer button */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "info" ? null : "info")}
              className="flex sm:hidden items-center justify-center p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Meeting info"
            >
              <Info className="w-4 h-4 text-amber-400" />
            </button>

            {/* Participants counter button */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "people" ? null : "people")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Participants list"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>{participantCount}</span>
            </button>

            {/* Minimize to Picture-in-Picture (PiP) */}
            <button
              type="button"
              onClick={() => {
                setActiveSidePanel(null);
                setIsFloatingPiP(true);
              }}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Minimize to floating corner window"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* 2. MAIN STAGE / VIDEO GRID CANVAS */}
      <main className="relative flex-1 flex min-h-0 overflow-hidden p-2 sm:p-4 gap-3 bg-[#0a0a0d]">
        {/* VIDEO DISPLAY AREA */}
        <div className="relative flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {/* A. SCREEN SHARE ACTIVE VIEW */}
          {activeScreenShare ? (
            <div className="relative w-full h-full flex flex-col md:flex-row gap-3 overflow-hidden">
              {/* Main Presentation Stage (~85% canvas) */}
              <div className="relative flex-1 min-h-0 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain bg-black"
                />
                {/* Presenting Label: Clean drop-shadow, NO box background, NO dot */}
                <div className="absolute top-3 left-4 z-10 pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  <span className="text-white text-xs sm:text-sm font-semibold tracking-tight">
                    {activeScreenShare.presenterName} is presenting
                  </span>
                </div>
              </div>

              {/* Side Video Cards ("Gigilid" vertical strip on desktop, horizontal bottom strip on mobile) */}
              <div className="w-full md:w-64 lg:w-72 h-28 md:h-full flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto pb-1 md:pb-0">
                {allParticipants.map((p) => (
                  <div key={p.id} className="w-40 md:w-full h-full md:h-36 shrink-0">
                    <ParticipantVideoCard
                      participant={p}
                      isLocal={p.isLocal}
                      facingMode={facingMode}
                      isMiniStrip={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* B. ADAPTIVE VIDEO GRID (WHEN NO SCREEN SHARE ACTIVE) */
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              {participantCount === 1 ? (
                /* [ 1 Participant: Solo View with Waiting Status ] */
                <div className="relative w-full h-full max-w-4xl max-h-[85vh] mx-auto">
                  <ParticipantVideoCard
                    participant={allParticipants[0]}
                    isLocal={true}
                    facingMode={facingMode}
                  />
                  {/* Subtle waiting prompt */}
                  <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                    <div className="text-center space-y-3 max-w-sm pointer-events-auto">
                      <p className="text-white/90 text-sm font-semibold tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        Waiting for others to join...
                      </p>
                      <button
                        type="button"
                        onClick={handleShareOrCopyLink}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 text-xs font-semibold font-mono tracking-wide transition-all shadow-lg cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{hasCopiedLink ? "Link Copied!" : "Share Meeting Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : participantCount === 2 ? (
                /* [ 2 Participants: 50% / 50% Split ]
                   Desktop: Side-by-side (2 cols, 1 row). Mobile: Stacked vertically (1 col, 2 rows). */
                <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 w-full h-full gap-2 sm:gap-3">
                  {allParticipants.map((p) => (
                    <div key={p.id} className="w-full h-full min-h-0 min-w-0">
                      <ParticipantVideoCard
                        participant={p}
                        isLocal={p.isLocal}
                        facingMode={facingMode}
                      />
                    </div>
                  ))}
                </div>
              ) : participantCount === 3 ? (
                /* [ 3 Participants: 2 top, 1 bottom ] */
                <div className="flex flex-col w-full h-full gap-2 sm:gap-3">
                  <div className="grid grid-cols-2 h-1/2 gap-2 sm:gap-3 min-h-0">
                    <ParticipantVideoCard participant={allParticipants[0]} isLocal={allParticipants[0].isLocal} facingMode={facingMode} />
                    <ParticipantVideoCard participant={allParticipants[1]} isLocal={allParticipants[1].isLocal} facingMode={facingMode} />
                  </div>
                  <div className="w-full h-1/2 max-w-2xl mx-auto min-h-0">
                    <ParticipantVideoCard participant={allParticipants[2]} isLocal={allParticipants[2].isLocal} facingMode={facingMode} />
                  </div>
                </div>
              ) : participantCount === 4 ? (
                /* [ 4 Participants: 2x2 Quad Grid ] */
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2 sm:gap-3">
                  {allParticipants.map((p) => (
                    <div key={p.id} className="w-full h-full min-h-0 min-w-0">
                      <ParticipantVideoCard
                        participant={p}
                        isLocal={p.isLocal}
                        facingMode={facingMode}
                      />
                    </div>
                  ))}
                </div>
              ) : participantCount <= 6 ? (
                /* [ 5 - 6 Participants: Auto-scaled responsive 3x2 on desktop, 2x3 on mobile ] */
                <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2 w-full h-full gap-2 sm:gap-3">
                  {allParticipants.map((p) => (
                    <div key={p.id} className="w-full h-full min-h-0 min-w-0">
                      <ParticipantVideoCard
                        participant={p}
                        isLocal={p.isLocal}
                        facingMode={facingMode}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* [ 7 - 8 Participants: 4x2 on desktop, 2x4 on mobile ] */
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-4 md:grid-rows-2 w-full h-full gap-1.5 sm:gap-2">
                  {allParticipants.map((p) => (
                    <div key={p.id} className="w-full h-full min-h-0 min-w-0">
                      <ParticipantVideoCard
                        participant={p}
                        isLocal={p.isLocal}
                        facingMode={facingMode}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Floating Emoji Reactions */}
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-16 text-3xl sm:text-4xl pointer-events-none animate-in fade-in slide-out-to-top duration-1000 z-30"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* 3. SLIDING RIGHT SIDE PANEL (CHAT, PEOPLE, INFO) */}
        {activeSidePanel && !isFloatingPiP && (
          <aside className="fixed inset-0 sm:relative sm:inset-auto z-40 w-full sm:w-80 md:w-88 h-full bg-[#13141a] sm:rounded-2xl border-0 sm:border sm:border-white/10 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeSidePanel === "chat" && (
                  <>
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>In-Call Messages</span>
                  </>
                )}
                {activeSidePanel === "people" && (
                  <>
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>People ({participantCount})</span>
                  </>
                )}
                {activeSidePanel === "info" && (
                  <>
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Meeting Info</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSidePanel(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DRAWER: CHAT */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#13141a]">
                <div className="p-3 bg-white/[0.02] border-b border-white/[0.05] text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Messages visible only to people in this call.</span>
                </div>

                <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2">
                      <MessageSquare className="w-8 h-8 opacity-30 text-amber-400" />
                      <p className="text-xs text-neutral-400">No messages yet.</p>
                      <p className="text-[11px] text-neutral-500">Send notes to everyone in this consultation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderSocketId === socketRef.current?.id || msg.sender === displayName;
                      return (
                        <div key={msg.id} className={`flex flex-col space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                            <span className="font-bold">{isMe ? "You" : msg.sender}</span>
                            <span>·</span>
                            <span>{msg.time}</span>
                          </div>
                          <div
                            className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs break-words leading-relaxed ${
                              isMe ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-xs" : "bg-[#20212a] text-neutral-100 rounded-tl-xs border border-white/10"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.08] flex items-center gap-2 bg-[#0e0f14]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* DRAWER: PEOPLE */}
            {activeSidePanel === "people" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 bg-[#13141a]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Participants ({participantCount})
                </div>
                <div className="space-y-2">
                  {allParticipants.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-xs font-mono">
                          {(p.name || "P").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {p.name} {p.isLocal && <span className="text-white/50 text-[10px] font-normal">(You)</span>}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {p.role} · {p.affiliation === "mcpa" ? "MCPA Team" : "Client"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        {p.isHandRaised && <span className="text-xs">✋</span>}
                        {p.isMicOn ? <Mic className="w-3.5 h-3.5 text-neutral-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAWER: INFO */}
            {activeSidePanel === "info" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 bg-[#13141a]">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Room Code</div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 font-mono font-bold text-sm text-amber-400">
                    {canonicalRoomCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleShareOrCopyLink}
                    className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-mono font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedLink ? "Copied" : "Copy Joining Link"}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/[0.08] space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Consultation Session</div>
                  <p className="text-xs text-neutral-300">
                    Encrypted direct peer-to-peer audio, video, and screen sharing provided by MCPA WebRTC Mesh.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* 4. BOTTOM CONTROLS DOCK (MOBILE FIRST, ERGONOMIC TOUCH TARGETS) */}
      <footer className="h-auto min-h-[64px] sm:h-20 px-3 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] flex items-center justify-center sm:justify-between z-30 shrink-0 bg-[#0e0f14]/95 backdrop-blur-md border-t border-white/[0.06]">
        {/* MOBILE CONTROLS BAR (sm:hidden) */}
        <div className="flex sm:hidden items-center justify-between w-full max-w-sm mx-auto px-1">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicOn ? "bg-white/10 text-white active:scale-90" : "bg-rose-600 text-white shadow-md active:scale-90"
            }`}
            title={isMicOn ? "Mute" : "Unmute"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoOn ? "bg-white/10 text-white active:scale-90" : "bg-rose-600 text-white shadow-md active:scale-90"
            }`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Flip Camera (Dedicated mobile control for blueprints & rear camera view) */}
          <button
            type="button"
            onClick={() => {
              if (!isVideoOn) {
                showToast("Turn on your camera first to switch between front and rear cameras.");
                return;
              }
              flipCamera();
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoOn
                ? "bg-white/10 hover:bg-white/20 text-white active:scale-90"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
            title={isVideoOn ? "Flip camera (front / rear)" : "Turn on camera to flip"}
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          {/* Reactions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReactionsOpen(!isReactionsOpen)}
              className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="React"
            >
              <Smile className="w-5 h-5" />
            </button>
            {isReactionsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsReactionsOpen(false)} />
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 p-2 rounded-full bg-[#181922] border border-white/15 backdrop-blur-md shadow-2xl flex items-center gap-1 z-40">
                  {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-xl cursor-pointer"
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
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isHandRaised ? "bg-amber-500 text-neutral-950 font-bold" : "bg-white/10 text-white active:scale-90"
            }`}
            title="Raise hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={() => {
              setActiveSidePanel(activeSidePanel === "chat" ? null : "chat");
              setUnreadCount(0);
            }}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeSidePanel === "chat" ? "bg-amber-500 text-neutral-950" : "bg-white/10 text-white active:scale-90"
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Leave Call */}
          <button
            type="button"
            onClick={handleLeaveCall}
            className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* DESKTOP CONTROLS BAR (hidden sm:flex) */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left: Room Code & Duration */}
          <div className="flex items-center gap-3 text-xs font-mono text-white/50 min-w-[200px]">
            <span className="text-white font-bold">{canonicalRoomCode}</span>
            <span>·</span>
            <div className="flex items-center gap-1.5 text-white/70">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatMeetingDuration(callDurationSeconds)}</span>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isMicOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-rose-600 text-white shadow-md"
              }`}
              title={isMicOn ? "Turn off mic" : "Turn on mic"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isVideoOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-rose-600 text-white shadow-md"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Audio & Video Device Settings */}
            <button
              type="button"
              onClick={() => setIsDeviceSettingsOpen(true)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
              title="Audio & Video Settings (Camera, Mic, Speaker)"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAnotherPresenterActive) {
                  const presenterName = activeScreenShare?.presenterName || "Another participant";
                  showToast(`⚠️ Cannot share screen while another participant is presenting. ${presenterName} is currently sharing their screen.`);
                  return;
                }
                handleToggleScreenShare();
              }}
              className={`p-3 rounded-full transition-all relative ${
                isScreenSharing
                  ? "bg-amber-500 text-neutral-950 font-bold cursor-pointer hover:bg-amber-400 ring-2 ring-amber-400/50"
                  : isAnotherPresenterActive
                  ? "bg-white/5 text-amber-500/70 hover:bg-white/10 cursor-not-allowed border border-amber-500/30"
                  : "bg-white/10 hover:bg-white/15 text-white cursor-pointer active:scale-90"
              }`}
              title={
                isScreenSharing
                  ? "Stop presenting"
                  : isAnotherPresenterActive
                  ? `${activeScreenShare?.presenterName || "Another participant"} is presenting (Only 1 presenter allowed)`
                  : "Present screen"
              }
            >
              <Monitor className="w-5 h-5" />
              {isAnotherPresenterActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReactionsOpen(!isReactionsOpen)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
                title="Send reaction"
              >
                <Smile className="w-5 h-5" />
              </button>
              {isReactionsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsReactionsOpen(false)} />
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 rounded-full bg-[#181922] border border-white/15 backdrop-blur-md shadow-2xl flex items-center gap-1.5 z-40">
                    {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => triggerReaction(emoji)}
                        className="p-2 rounded-full hover:bg-white/10 text-xl cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={toggleHandRaise}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isHandRaised ? "bg-amber-500 text-neutral-950 font-bold" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
              title="Raise hand"
            >
              <Hand className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleLeaveCall}
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2"
              title="Leave call"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>

          {/* Right: Drawer Toggles */}
          <div className="flex items-center justify-end gap-2 min-w-[200px]">
            <button
              type="button"
              onClick={() => {
                setActiveSidePanel(activeSidePanel === "chat" ? null : "chat");
                setUnreadCount(0);
              }}
              className={`relative p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "chat" ? "bg-amber-500 text-neutral-950" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "people" ? null : "people")}
              className={`p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "people" ? "bg-amber-500 text-neutral-950" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
              title="People"
            >
              <Users className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "info" ? null : "info")}
              className={`p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "info" ? "bg-amber-500 text-neutral-950" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
              title="Meeting Details"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      {/* RATING & CONCLUSION FEEDBACK MODAL ON LEAVE */}
      {isLeaveRatingModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#14151e] border border-amber-500/30 text-white shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-white">
                  Consultation Completed
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Duration: {formatMeetingDuration(callDurationSeconds)} · How was the session?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveRatingModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5-Star Rating */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = leaveHoverRating || leaveRating;
                const isFilled = star <= active;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setLeaveHoverRating(star)}
                    onMouseLeave={() => setLeaveHoverRating(0)}
                    onClick={() => setLeaveRating(star)}
                    className="p-1.5 transition-transform hover:scale-120 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled ? "text-amber-400 fill-amber-400" : "text-neutral-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <textarea
              rows={3}
              value={leaveNote}
              onChange={(e) => setLeaveNote(e.target.value)}
              placeholder="Add key notes or feedback for this consultation (optional)..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
            />

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsLeaveRatingModalOpen(false);
                  performActualLeave(leaveRating, leaveNote);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Submit &amp; Exit Call
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLeaveRatingModalOpen(false);
                  performActualLeave(null, "");
                }}
                className="w-full text-center text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                Skip Rating &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Device Settings Modal (Camera, Mic, Audio Output & Phone Modes) */}
      <MeetingDeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
        activeVideoDeviceId={selectedCameraId}
        activeAudioDeviceId={selectedMicId}
        activeAudioOutputId={selectedAudioOutputId}
        audioOutputMode={audioOutputMode}
        onSelectVideoDevice={handleSelectCamera}
        onSelectAudioDevice={handleSelectMic}
        onSelectAudioOutput={handleSelectAudioOutput}
        onSelectAudioOutputMode={handleSelectAudioOutputMode}
        previewStream={localStream}
      />
    </div>
  );

  return createPortal(roomContent, document.body);
}
