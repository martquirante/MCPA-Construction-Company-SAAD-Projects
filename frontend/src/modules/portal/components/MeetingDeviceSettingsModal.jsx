"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Mic,
  Volume2,
  Headphones,
  Smartphone,
  Settings,
  Check,
  X,
  RefreshCw,
  Play,
  RotateCw,
} from "lucide-react";

/**
 * Plays a pleasant test chime to verify the audio output path
 */
export function playSpeakerTestSound(sinkId = null, volume = 1.0) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // In modern browsers supporting setSinkId on AudioContext
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

    gain.gain.setValueAtTime(volume * 0.25, now);
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
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [isEnumerating, setIsEnumerating] = useState(false);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  const modalVideoPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Enumerate all media devices
  const refreshDevices = async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    setIsEnumerating(true);
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      
      const vInputs = allDevices.filter((d) => d.kind === "videoinput");
      const aInputs = allDevices.filter((d) => d.kind === "audioinput");
      const aOutputs = allDevices.filter((d) => d.kind === "audiooutput");

      setVideoDevices(vInputs);
      setAudioInputDevices(aInputs);
      setAudioOutputDevices(aOutputs);
    } catch (err) {
      console.warn("[DEVICE SETTINGS] Enumeration error:", err);
    } finally {
      setIsEnumerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDevices();

      // Listen for hardware plug/unplug events (e.g. bluetooth headset connected)
      if (navigator?.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
        return () => {
          navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
        };
      }
    }
  }, [isOpen]);

  // Connect preview stream to mini video element
  useEffect(() => {
    if (isOpen && modalVideoPreviewRef.current && previewStream) {
      const videoEl = modalVideoPreviewRef.current;
      videoEl.muted = true;
      videoEl.srcObject = previewStream;
      videoEl.play().catch(() => {});
    }
  }, [isOpen, previewStream]);

  // Mic level meter using Web Audio API on previewStream
  useEffect(() => {
    if (!isOpen || !previewStream) {
      setMicAudioLevel(0);
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
      console.warn("[DEVICE SETTINGS] Mic meter error:", e);
    }

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, previewStream]);

  const handleTestSpeaker = () => {
    setIsPlayingTestSound(true);
    const testVol = audioOutputMode === "earpiece" ? 0.3 : 1.0;
    playSpeakerTestSound(activeAudioOutputId, testVol);
    setTimeout(() => setIsPlayingTestSound(false), 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[#12141c] border border-amber-500/30 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-white">
                Audio &amp; Video Device Settings
              </h2>
              <p className="text-[11px] text-neutral-400">
                Pumili ng camera, microphone, at speaker output
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-neutral-300">
          
          {/* 1. CAMERA SELECTION */}
          <div className="space-y-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 text-[11px]">
                <Camera className="w-3.5 h-3.5" />
                <span>Camera (Video Source)</span>
              </label>
              <button
                type="button"
                onClick={refreshDevices}
                className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Scan connected devices"
              >
                <RefreshCw className={`w-3 h-3 ${isEnumerating ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <select
              value={activeVideoDeviceId || ""}
              onChange={(e) => onSelectVideoDevice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#181a24] border border-white/10 text-white font-mono text-xs focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
            >
              {videoDevices.length === 0 ? (
                <option value="">Default / Built-in Camera</option>
              ) : (
                videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))
              )}
            </select>

            {/* Live Camera Preview Tile */}
            {previewStream && previewStream.getVideoTracks().some((t) => t.readyState === "live") && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60 border border-white/10 mt-2">
                <video
                  ref={modalVideoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white/80">
                  Live Preview
                </span>
              </div>
            )}
          </div>

          {/* 2. MICROPHONE SELECTION */}
          <div className="space-y-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <label className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 text-[11px]">
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone (Audio Input)</span>
            </label>

            <select
              value={activeAudioDeviceId || ""}
              onChange={(e) => onSelectAudioDevice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#181a24] border border-white/10 text-white font-mono text-xs focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
            >
              {audioInputDevices.length === 0 ? (
                <option value="">Default / Built-in Microphone</option>
              ) : (
                audioInputDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Microphone ${idx + 1}`}
                  </option>
                ))
              )}
            </select>

            {/* Live Mic Sensitivity Meter Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Input Volume Meter:</span>
                <span className={micAudioLevel > 15 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                  {micAudioLevel > 5 ? "Receiving Audio" : "Silent"}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden border border-white/5 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.max(4, micAudioLevel)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. AUDIO OUTPUT & PHONE SPEAKER / EARPIECE SELECTION */}
          <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 text-[11px]">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Output &amp; Speaker Routing</span>
              </label>

              <button
                type="button"
                onClick={handleTestSpeaker}
                disabled={isPlayingTestSound}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-amber-300" />
                <span>{isPlayingTestSound ? "Testing..." : "Test Chime"}</span>
              </button>
            </div>

            {/* Physical Audio Output Device Dropdown (if browser exposes it) */}
            {audioOutputDevices.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                  Select Output Device:
                </span>
                <select
                  value={activeAudioOutputId || ""}
                  onChange={(e) => onSelectAudioOutput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#181a24] border border-white/10 text-white font-mono text-xs focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">Default System Speaker</option>
                  {audioOutputDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Speaker ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile / Handset Audio Modes (Speaker vs Earpiece vs Headset) */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase block font-semibold">
                Speaker / Phone Audio Mode:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* Mode 1: Loudspeaker */}
                <button
                  type="button"
                  onClick={() => onSelectAudioOutputMode("speaker")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    audioOutputMode === "speaker"
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500/30"
                      : "bg-[#181a24] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-mono leading-tight">Loudspeaker</span>
                  <span className="text-[9px] text-neutral-400">Malakas (Hands-free)</span>
                </button>

                {/* Mode 2: Phone Earpiece (Ear receiver) */}
                <button
                  type="button"
                  onClick={() => onSelectAudioOutputMode("earpiece")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    audioOutputMode === "earpiece"
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500/30"
                      : "bg-[#181a24] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] font-mono leading-tight">Phone Earpiece</span>
                  <span className="text-[9px] text-neutral-400">Dinig sa tenga lang</span>
                </button>

                {/* Mode 3: Headset / Headphones */}
                <button
                  type="button"
                  onClick={() => onSelectAudioOutputMode("headset")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    audioOutputMode === "headset"
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500/30"
                      : "bg-[#181a24] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-mono leading-tight">Headset / BT</span>
                  <span className="text-[9px] text-neutral-400">Earphones / Airpods</span>
                </button>
              </div>

              {audioOutputMode === "earpiece" && (
                <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300 flex items-start gap-2 leading-relaxed">
                  <Smartphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Earpiece Mode Active:</strong> Ang tunog ay pinahina upang ligtas idikit ang telepono sa iyong tenga tulad ng karaniwang tawag sa telepono.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] font-mono text-neutral-500">
            Naka-save ang napiling devices sa browser
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
