"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  Users,
  Compass,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  Settings,
  Volume2,
  Smartphone,
  Headphones,
} from "lucide-react";
import MeetingDeviceSettingsModal from "./MeetingDeviceSettingsModal";
import {
  formatRoomCode,
  getRoomExpiryState,
  markRoomConcluded,
  clearRoomConcluded,
} from "../utils/roomCodeHelper";
import { getSignalingServerUrl } from "../utils/signalingUrl";
import { io } from "socket.io-client";

const MCPA_ROLES = [
  "Senior Architect",
  "Junior Architect",
  "Lead Project Engineer",
  "Site Engineer",
  "Foreman (Porma)",
  "Project Manager",
  "Estimator / Quantity Surveyor",
  "Admin & Technical Support",
  "Other",
];

const CLIENT_RELATIONSHIPS = [
  "Primary Client / Property Owner",
  "Spouse / Co-Owner",
  "Family Member",
  "Business Partner / Co-Investor",
  "Authorized Representative",
  "Other",
];

export default function MeetPreJoinLobby({
  roomCode,
  initialUser = null,
  onJoin = () => {},
}) {
  const normalizedCode = formatRoomCode(roomCode);

  // Form State
  const [displayName, setDisplayName] = useState(() => {
    if (initialUser?.name) return initialUser.name;
    if (initialUser?.fullName) return initialUser.fullName;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mcpa_meet_guest_name");
      if (stored) return stored;
    }
    return "";
  });

  const [affiliation, setAffiliation] = useState(() => {
    const role = (initialUser?.role || "").toUpperCase();
    if (role.includes("ADMIN") || role.includes("ENGINEER") || role.includes("ARCHITECT")) {
      return "mcpa";
    }
    return "client";
  });

  const [selectedRole, setSelectedRole] = useState(() => {
    const role = (initialUser?.role || "").toUpperCase();
    if (role.includes("ENGINEER")) return "Lead Project Engineer";
    if (role.includes("ARCHITECT")) return "Senior Architect";
    if (role.includes("ADMIN")) return "Admin & Technical Support";
    return "Primary Client / Property Owner";
  });

  const [customRoleText, setCustomRoleText] = useState("");
  const [formError, setFormError] = useState("");

  // Media preview state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Device selection & output routing state
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_camera_id") || "";
    }
    return "";
  });
  const [selectedMicId, setSelectedMicId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_mic_id") || "";
    }
    return "";
  });
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_selected_speaker_id") || "";
    }
    return "";
  });
  const [audioOutputMode, setAudioOutputMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcpa_audio_output_mode") || "speaker";
    }
    return "speaker";
  });

  const videoPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasJoinedRef = useRef(false);

  // Room capacity & expiration state
  const [roomCount, setRoomCount] = useState(0);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isRoomExpired, setIsRoomExpired] = useState(false);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(null);
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(true);

  const streamRef = useRef(null);
  const isLobbyMountedRef = useRef(false);

  // Initialize camera preview
  useEffect(() => {
    let isCancelled = false;
    isLobbyMountedRef.current = true;

    async function startMedia() {
      try {
        let stream =
          streamRef.current &&
          streamRef.current.getTracks().some((t) => t.readyState === "live")
            ? streamRef.current
            : null;

        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              },
            });
          } catch (primaryErr) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
              });
            } catch (basicErr) {
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: true,
                });
              } catch (videoOnlyErr) {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: false,
                });
              }
            }
          }
        }

        if (isCancelled || !isLobbyMountedRef.current) {
          if (!hasJoinedRef.current && !isLobbyMountedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
          }
          return;
        }

        const hasLiveVideo = stream.getVideoTracks().some((t) => t.readyState === "live");
        streamRef.current = stream;
        setMediaStream(stream);
        setMediaPermissionDenied(!hasLiveVideo);
        if (!hasLiveVideo) {
          setIsVideoOn(false);
        }

        if (videoPreviewRef.current && hasLiveVideo) {
          videoPreviewRef.current.muted = true;
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }

        // Web Audio Analyser for live mic sensitivity meter
        if (stream.getAudioTracks().length > 0) {
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              audioContextRef.current = ctx;
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 64;
              analyserRef.current = analyser;

              const source = ctx.createMediaStreamSource(stream);
              source.connect(analyser);

              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              const updateMeter = () => {
                if (isCancelled) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / bufferLength;
                setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
                animationFrameRef.current = requestAnimationFrame(updateMeter);
              };
              updateMeter();
            }
          } catch (e) {
            console.warn("[LOBBY] Web Audio meter error:", e);
          }
        }
      } catch (err) {
        console.warn("[LOBBY] Media device access notice:", err);
        setMediaPermissionDenied(true);
        setIsVideoOn(false);
      }
    }

    startMedia();

    return () => {
      isCancelled = true;
      isLobbyMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      // Defer stopping tracks so React StrictMode remount does not kill the camera preview
      setTimeout(() => {
        if (!isLobbyMountedRef.current && !hasJoinedRef.current && streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      }, 150);
    };
  }, []);

  // Update track enabled state on toggle
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = isMicOn;
      });
    }
  }, [isMicOn, mediaStream]);

  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOn;
      });
    }
  }, [isVideoOn, mediaStream]);

  // Query Room Capacity & 5-Minute Post-Call Expiry
  useEffect(() => {
    let socket = null;

    const syncExpiryState = (serverStatus = null) => {
      const expiry = getRoomExpiryState(normalizedCode, serverStatus);
      setIsRoomExpired(Boolean(expiry.isExpired));
      if (expiry.endedAt && !expiry.isExpired) {
        setExpirySecondsLeft(Math.max(0, Math.ceil(expiry.remainingMs / 1000)));
      } else {
        setExpirySecondsLeft(null);
      }
    };

    syncExpiryState();
    const expiryTick = setInterval(() => {
      syncExpiryState();
    }, 1000);

    try {
      const serverUrl = getSignalingServerUrl();
      socket = io(serverUrl, {
        transports: ["polling", "websocket"],
        timeout: 8000,
      });

      socket.emit("check-room-capacity", { roomCode: normalizedCode });

      socket.on("room-capacity-status", (status) => {
        if (status) {
          const count = status.currentCount || 0;
          setRoomCount(count);
          setIsRoomFull(Boolean(status.isFull || count >= 8));
          if (count > 0) {
            clearRoomConcluded(normalizedCode);
          } else if (status.endedAt) {
            markRoomConcluded(normalizedCode, status.endedAt);
          }
          syncExpiryState(status);
        }
        setIsCheckingCapacity(false);
      });

      setTimeout(() => setIsCheckingCapacity(false), 3000);
    } catch (e) {
      setIsCheckingCapacity(false);
    }

    return () => {
      clearInterval(expiryTick);
      if (socket) socket.disconnect();
    };
  }, [normalizedCode]);

  const handleToggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const handleToggleVideo = () => {
    setIsVideoOn((prev) => !prev);
  };

  const handleSelectCamera = async (deviceId) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem("mcpa_selected_camera_id", deviceId);
    } catch (e) {}

    if (!navigator?.mediaDevices?.getUserMedia) return;
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && streamRef.current) {
        newVideoTrack.enabled = isVideoOn;
        const oldTrack = streamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          streamRef.current.removeTrack(oldTrack);
        }
        streamRef.current.addTrack(newVideoTrack);
        const updated = new MediaStream(streamRef.current.getTracks());
        streamRef.current = updated;
        setMediaStream(updated);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = updated;
          videoPreviewRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[LOBBY] Camera switch error:", err);
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
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack && streamRef.current) {
        newAudioTrack.enabled = isMicOn;
        const oldTrack = streamRef.current.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          streamRef.current.removeTrack(oldTrack);
        }
        streamRef.current.addTrack(newAudioTrack);
        const updated = new MediaStream(streamRef.current.getTracks());
        streamRef.current = updated;
        setMediaStream(updated);

        // Reconnect audio meter
        if (audioContextRef.current && analyserRef.current) {
          try {
            const source = audioContextRef.current.createMediaStreamSource(updated);
            source.connect(analyserRef.current);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("[LOBBY] Mic switch error:", err);
    }
  };

  const handleSelectAudioOutput = (deviceId) => {
    setSelectedAudioOutputId(deviceId);
    try {
      localStorage.setItem("mcpa_selected_speaker_id", deviceId);
    } catch (e) {}
  };

  const handleSelectAudioOutputMode = (mode) => {
    setAudioOutputMode(mode);
    try {
      localStorage.setItem("mcpa_audio_output_mode", mode);
    } catch (e) {}
  };

  const handleAffiliationChange = (type) => {
    setAffiliation(type);
    if (type === "mcpa") {
      setSelectedRole("Junior Architect");
    } else {
      setSelectedRole("Primary Client / Property Owner");
    }
    setCustomRoleText("");
    setFormError("");
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (isRoomFull) {
      setFormError("This consultation room is currently at maximum capacity (8/8 participants).");
      return;
    }
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setFormError("Please enter your name before joining.");
      return;
    }

    clearRoomConcluded(normalizedCode);
    setIsRoomExpired(false);

    const finalRole = selectedRole === "Other"
      ? (customRoleText.trim() || (affiliation === "mcpa" ? "MCPA Team Member" : "Guest"))
      : selectedRole;

    try {
      localStorage.setItem("mcpa_meet_guest_name", trimmedName);
    } catch (e) {}

    hasJoinedRef.current = true;

    // Pass resolved participant data
    onJoin({
      name: trimmedName,
      affiliation, // "mcpa" | "client"
      role: finalRole,
      isMicOn,
      isVideoOn,
      preloadedStream: mediaStream,
      selectedCameraId,
      selectedMicId,
      selectedAudioOutputId,
      audioOutputMode,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-neutral-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-black">
      {/* Editorial Header */}
      <header className="border-b border-white/[0.08] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-sm tracking-tight shadow-sm">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
                MCPA Construction & Supply
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Encrypted Video Consultation
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-neutral-300">DTLS 256-bit P2P</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-amber-400">
            <span className="text-[11px]">{normalizedCode}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* LEFT: Live Video / Camera Monitor (Mobile-First Top, Desktop Left) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 border border-white/[0.08] shadow-2xl flex items-center justify-center">
              
              {/* Actual Video Element */}
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                  isVideoOn && !mediaPermissionDenied ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Camera Off Avatar Fallback */}
              {(!isVideoOn || mediaPermissionDenied) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f1218]">
                  <div className="w-20 h-20 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-2xl font-bold text-neutral-300 font-mono">
                    {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : "M"}
                  </div>
                  <p className="text-xs text-neutral-400 font-mono">
                    {mediaPermissionDenied ? "Camera access disabled in browser" : "Camera is turned off"}
                  </p>
                </div>
              )}

              {/* Top Status Overlay: Technical Info */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300 pointer-events-none">
                <span className="drop-shadow-md">
                  {roomCount > 0 ? `${roomCount} active in room` : "Waiting room active"}
                </span>
                <span className="drop-shadow-md text-amber-400">
                  {isVideoOn ? "HD 720p" : "Audio Only"}
                </span>
              </div>

              {/* Bottom Video Controls Overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isMicOn
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
                  }`}
                  aria-label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                  title={isMicOn ? "Turn off mic" : "Turn on mic"}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isVideoOn
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
                  }`}
                  aria-label={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                  title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                {/* Audio Output Settings */}
                <button
                  type="button"
                  onClick={() => setIsDeviceSettingsOpen(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all border bg-white/10 hover:bg-white/20 text-white border-transparent cursor-pointer"
                  title="Audio Output & Speaker Settings"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Audio & Video Device Settings */}
                <button
                  type="button"
                  onClick={() => setIsDeviceSettingsOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Audio & Video Settings (Select camera, mic, speaker)"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Sensitivity Meter Bar */}
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-400">
              <span className="shrink-0 text-[11px]">Mic Input:</span>
              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: isMicOn ? `${audioLevel}%` : "0%" }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 shrink-0">
                {isMicOn ? (audioLevel > 5 ? "Audio Active" : "Quiet") : "Muted"}
              </span>
            </div>
          </div>

          {/* RIGHT: Participant Identity & Affiliation Form */}
          <div className="lg:col-span-5 bg-[#0f1218] border border-white/[0.08] rounded-lg p-5 sm:p-7 shadow-xl">
            <div className="mb-5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Enter Consultation Room
              </h1>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Declare your affiliation and project role so everyone in the room knows who is participating.
              </p>
            </div>

            {/* Room Expiration / Grace Window Guard Notice */}
            {isRoomExpired && (
              <div className="mb-5 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                ⏰ <strong>Room Expired:</strong> This consultation room expired 5 minutes after the call ended. Please request or generate a new meeting room link.
              </div>
            )}

            {!isRoomExpired && expirySecondsLeft !== null && roomCount === 0 && (
              <div className="mb-5 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-center justify-between gap-2">
                <span>⏳ <strong>Call Ended:</strong> Room expires in</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.floor(expirySecondsLeft / 60)}:{String(expirySecondsLeft % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {/* Room Capacity Guard Notice */}
            {!isRoomExpired && isRoomFull && (
              <div className="mb-5 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                ⚠️ <strong>Room Capacity Reached:</strong> The room currently has {roomCount} participants. You may enter if replacing a participant or please wait for a slot.
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              
              {/* Name Field */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Your Full Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setFormError("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Affiliation Selector: MCPA Team vs Client Side */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Who are you joining with? <span className="text-amber-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAffiliationChange("mcpa")}
                    className={`py-2 px-3 rounded text-left transition-all border ${
                      affiliation === "mcpa"
                        ? "bg-amber-500/10 border-amber-500 text-white"
                        : "bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-xs font-bold">MCPA Team</div>
                    <div className="text-[10px] text-neutral-400">Architect / Engineer / Site</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAffiliationChange("client")}
                    className={`py-2 px-3 rounded text-left transition-all border ${
                      affiliation === "client"
                        ? "bg-emerald-500/10 border-emerald-500 text-white"
                        : "bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-xs font-bold">Client Side</div>
                    <div className="text-[10px] text-neutral-400">Owner / Family / Partner</div>
                  </button>
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  {affiliation === "mcpa" ? "MCPA Role" : "Relationship to Client / Project"} <span className="text-amber-500">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setFormError("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {(affiliation === "mcpa" ? MCPA_ROLES : CLIENT_RELATIONSHIPS).map((r) => (
                    <option key={r} value={r} className="bg-neutral-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specify field if Other */}
              {selectedRole === "Other" && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Specify Your Role / Relationship <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your role or relationship"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}

              {/* Form Validation Error */}
              {formError && (
                <p className="text-xs text-rose-400 font-mono">
                  {formError}
                </p>
              )}

              {/* Join Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!displayName.trim() || isRoomFull}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                    displayName.trim() && !isRoomFull
                      ? "bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-[0.98]"
                      : "bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 cursor-not-allowed opacity-80"
                  }`}
                >
                  <span>
                    {isRoomFull
                      ? "Room Full (8/8)"
                      : isRoomExpired
                        ? "Start New Consultation Session"
                        : "Join Consultation"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!displayName.trim() && !isRoomFull && (
                  <p className="mt-2 text-[11px] text-amber-400/90 font-mono text-center flex items-center justify-center gap-1.5 animate-pulse">
                    <span>✍️</span> Enter your full name above to enable Join
                  </p>
                )}
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Room: {normalizedCode} · Secure Peer-to-Peer
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-white/[0.08] px-4 sm:px-8 py-3 text-center text-[11px] text-neutral-500 font-mono">
        MCPA Construction and Supply · Plaridel, Bulacan · Zero-Cost Encrypted WebRTC Architecture
      </footer>

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
        previewStream={mediaStream}
      />
    </div>
  );
}
