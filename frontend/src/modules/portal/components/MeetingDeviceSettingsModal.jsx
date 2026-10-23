"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  Mic,
  Volume2,
  Headphones,
  Smartphone,
  Check,
  X,
  Play,
  Sliders,
  Video,
} from "lucide-react";
import { isExternalHeadset } from "@/modules/portal/utils/audioOutputRouting";

/**
 * Plays a clean, pleasant harmonic 3-tone chime to test the audio output path
 */
export function playSpeakerTestSound(sinkId = null, volume = 1.0) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (sinkId && typeof ctx.setSinkId === "function") {
      ctx.setSinkId(sinkId).catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.24); // G5

    gain.gain.setValueAtTime(volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);
  } catch (err) {
    console.warn("[DEVICE SETTINGS] Audio test chime notice:", err);
  }
}

export default function MeetingDeviceSettingsModal({
  isOpen,
  onClose,
  activeVideoDeviceId = "",
  activeAudioDeviceId = "",
  activeAudioOutputId = "",
  audioOutputMode = "speaker", // "speaker" | "earpiece" | "headset"
  onSelectVideoDevice = () => {},
  onSelectAudioDevice = () => {},
  onSelectAudioOutput = () => {},
  onSelectAudioOutputMode = () => {},
  previewStream = null,
}) {
  const [activeTab, setActiveTab] = useState("audio"); // "audio" | "video"
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  const modalVideoPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Dynamic hardware detection: Identify whether this device is mobile and if a headset/BT is plugged in
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.innerWidth < 768 && "ontouchstart" in window);
  }, []);

  const detectedHeadset = useMemo(() => {
    const allAudio = [...audioInputDevices, ...audioOutputDevices];
    return allAudio.find((dev) => isExternalHeadset(dev)) || null;
  }, [audioInputDevices, audioOutputDevices]);

  // Real-time device enumeration
  const refreshDevices = async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(allDevices.filter((d) => d.kind === "videoinput"));
      setAudioInputDevices(allDevices.filter((d) => d.kind === "audioinput"));
      setAudioOutputDevices(allDevices.filter((d) => d.kind === "audiooutput"));
    } catch (err) {
      console.warn("[DEVICE SETTINGS] Enumeration error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        refreshDevices();
      }, 0);
      if (navigator?.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
        return () => {
          clearTimeout(timer);
          navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
        };
      }
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-correct headset mode if headset is unplugged/disconnected
  useEffect(() => {
    if (!detectedHeadset && audioOutputMode === "headset") {
      onSelectAudioOutputMode("speaker");
    }
  }, [detectedHeadset, audioOutputMode, onSelectAudioOutputMode]);

  // Connect preview stream to live video element
  useEffect(() => {
    if (isOpen && modalVideoPreviewRef.current && previewStream) {
      const videoEl = modalVideoPreviewRef.current;
      videoEl.muted = true;
      videoEl.srcObject = previewStream;
      videoEl.play().catch(() => {});
    }
  }, [isOpen, previewStream, activeTab]);

  // Voice level meter using Web Audio API analyser
  useEffect(() => {
    if (!isOpen || !previewStream || activeTab !== "audio") {
      return;
    }

    const audioTracks = previewStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let isCancelled = false;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;

        const source = ctx.createMediaStreamSource(previewStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (isCancelled) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      }
    } catch (e) {
      console.warn("[DEVICE SETTINGS] Mic meter notice:", e);
    }

    return () => {
      isCancelled = true;
      setMicAudioLevel(0);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, previewStream, activeTab]);

  const handleTestSpeaker = () => {
    setIsPlayingTestSound(true);
    const testVol = audioOutputMode === "earpiece" ? 0.25 : 1.0;
    playSpeakerTestSound(activeAudioOutputId, testVol);
    setTimeout(() => setIsPlayingTestSound(false), 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#202124] border border-[#3c4043] text-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-neutral-400" />
            <h2 className="text-base font-medium text-white tracking-tight">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Google Meet style: Audio / Video) */}
        <div className="px-6 pt-3 flex border-b border-white/[0.08] gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("audio")}
            className={`pb-3 flex items-center gap-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "audio"
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Audio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`pb-3 flex items-center gap-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "video"
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: AUDIO */}
          {activeTab === "audio" && (
            <div className="space-y-6">
              {/* Microphone Section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 block">Microphone</label>
                <div className="relative">
                  <select
                    value={activeAudioDeviceId || ""}
                    onChange={(e) => onSelectAudioDevice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#28292c] hover:bg-[#303236] border border-[#3c4043] focus:border-blue-400 focus:outline-none text-sm text-neutral-100 transition-colors cursor-pointer pr-10 appearance-none"
                  >
                    {audioInputDevices.length === 0 ? (
                      <option value="">Default Microphone</option>
                    ) : (
                      audioInputDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Microphone ${idx + 1}`}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                    ▾
                  </div>
                </div>

                {/* Voice Input Activity Meter */}
                <div className="pt-2 flex items-center gap-3">
                  <Mic className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(4, micAudioLevel)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 w-16 text-right">
                    {micAudioLevel > 10 ? "Speaking" : "Quiet"}
                  </span>
                </div>
              </div>

              {/* Speakers / Output Section */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300 block">Speakers</label>
                  <button
                    type="button"
                    onClick={handleTestSpeaker}
                    disabled={isPlayingTestSound}
                    className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-medium text-neutral-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
                    <span>{isPlayingTestSound ? "Playing..." : "Test sound"}</span>
                  </button>
                </div>

                {/* Output Device selector (Desktop / Browser with setSinkId) */}
                {audioOutputDevices.length > 0 && (
                  <div className="relative">
                    <select
                      value={activeAudioOutputId || ""}
                      onChange={(e) => onSelectAudioOutput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#28292c] hover:bg-[#303236] border border-[#3c4043] focus:border-blue-400 focus:outline-none text-sm text-neutral-100 transition-colors cursor-pointer pr-10 appearance-none"
                    >
                      <option value="">Default System Speaker</option>
                      {audioOutputDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Speaker ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                      ▾
                    </div>
                  </div>
                )}

                {/* Output Routing Status for Mobile or Desktop */}
                {isMobile ? (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] text-neutral-400 block font-medium">Device Audio Route</span>
                    {detectedHeadset ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                        <Headphones className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-left leading-tight flex-1">
                          <div className="text-xs font-semibold text-emerald-300">Connected Headset / Bluetooth</div>
                          <div className="text-[11px] text-neutral-300 mt-0.5 truncate">
                            {detectedHeadset.label || "External Headphones"}
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-1">
                            Audio is automatically routed to your connected headphones or Bluetooth device by Android.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                        <Volume2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-left leading-tight flex-1">
                          <div className="text-xs font-semibold text-blue-300">Loudspeaker Active</div>
                          <div className="text-[11px] text-neutral-300 mt-0.5">
                            Hands-free loudspeaker enabled
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-1">
                            Call audio is playing through the device loudspeaker. Connecting a wired or Bluetooth headset will automatically route audio to it.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  detectedHeadset && (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2.5 text-xs text-neutral-300">
                      <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Headphones detected: <strong>{detectedHeadset.label}</strong>
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO */}
          {activeTab === "video" && (
            <div className="space-y-6">
              {/* Camera Section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 block">Camera</label>
                <div className="relative">
                  <select
                    value={activeVideoDeviceId || ""}
                    onChange={(e) => onSelectVideoDevice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#28292c] hover:bg-[#303236] border border-[#3c4043] focus:border-blue-400 focus:outline-none text-sm text-neutral-100 transition-colors cursor-pointer pr-10 appearance-none"
                  >
                    {videoDevices.length === 0 ? (
                      <option value="">Default Camera</option>
                    ) : (
                      videoDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                    ▾
                  </div>
                </div>
              </div>

              {/* Video Preview Canvas */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-300 block">Preview</span>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#3c4043] flex items-center justify-center">
                  <video
                    ref={modalVideoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!previewStream && (
                    <div className="text-center text-xs text-neutral-400 p-4">
                      Camera preview will appear when camera is turned on
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-neutral-400">Settings save automatically</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white hover:bg-neutral-200 text-neutral-900 font-medium text-xs transition-all cursor-pointer shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
