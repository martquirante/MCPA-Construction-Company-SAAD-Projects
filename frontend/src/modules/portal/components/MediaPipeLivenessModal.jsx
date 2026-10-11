"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Ban,
  RotateCcw,
} from "lucide-react";

/**
 * Web Audio API Sound Effects (Zero external audio file dependencies)
 */
function playStepChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) { }
}

function playErrorBuzzer() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(160, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) { }
}

function playSuccessFanfare() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major Chord Arpeggio)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
    });
  } catch (e) { }
}

/**
 * Transforms any camera, permission, or network error into plain, friendly language
 */
export function getHumanFriendlyCameraMessage(err, activeLang = "en") {
  if (!err) return "";
  const raw = (typeof err === "string" ? err : err.message || err.name || "").toLowerCase();
  const name = err.name || "";
  const isHttp = typeof window !== "undefined" && !window.isSecureContext;

  // 1. Insecure HTTP LAN / Missing getUserMedia
  if (
    isHttp ||
    raw.includes("getusermedia") ||
    raw.includes("https") ||
    raw.includes("undefined") ||
    raw.includes("insecure")
  ) {
    return "A secure connection (HTTPS) is required for the live biometric camera.";
  }

  // 2. Camera Permission Blocked / Denied
  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    raw.includes("permission") ||
    raw.includes("denied") ||
    raw.includes("blocked")
  ) {
    return "Camera access is blocked. Please allow camera permissions in your browser or device settings.";
  }

  // 3. Camera in use by another application
  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    raw.includes("in use") ||
    raw.includes("busy") ||
    raw.includes("not readable")
  ) {
    return "Your camera is currently in use by another application. Please close other camera apps and retry.";
  }

  // 4. No camera device found
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    raw.includes("not found") ||
    raw.includes("no camera")
  ) {
    return "No camera detected on this device. Please connect a webcam or open this on a camera-enabled device.";
  }

  // 5. Internet / Script loading issue
  if (
    raw.includes("mediapipe") ||
    raw.includes("cdn") ||
    raw.includes("network") ||
    raw.includes("failed to load")
  ) {
    return "Network error loading biometric neural engine. Please check your connection and retry.";
  }

  return "Unable to open live camera right now. Please check camera permissions and retry.";
}

/**
 * Dynamic Script Loader for MediaPipe CDN
 */
let mediaPipeLoadPromise = null;
function loadMediaPipeScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window not available"));
  if (window.FaceMesh) return Promise.resolve(window.FaceMesh);
  if (mediaPipeLoadPromise) return mediaPipeLoadPromise;

  mediaPipeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      if (window.FaceMesh) {
        resolve(window.FaceMesh);
      } else {
        reject(new Error("MediaPipe FaceMesh script loaded but window.FaceMesh is undefined"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load MediaPipe FaceMesh script from CDN"));
    document.head.appendChild(script);
  });

  return mediaPipeLoadPromise;
}

/**
 * 6-STAGE LIVENESS VERIFICATION SEQUENCE
 */
const CHALLENGES = [
  {
    id: "center",
    fil: "Position face inside circle",
    en: "Position face inside circle",
    subFil: "Look straight into the center of the camera",
    subEn: "Look straight into the center of the camera",
    icon: Camera,
    arrowDirection: "none",
  },
  {
    id: "right",
    fil: "Turn your head to the Right",
    en: "Turn your head to the Right",
    subFil: "Slowly rotate your head toward the right",
    subEn: "Slowly rotate your head toward the right",
    icon: ArrowRight,
    arrowDirection: "right",
  },
  {
    id: "left",
    fil: "Turn your head to the Left",
    en: "Turn your head to the Left",
    subFil: "Slowly rotate your head toward the left",
    subEn: "Slowly rotate your head toward the left",
    icon: ArrowLeft,
    arrowDirection: "left",
  },
  {
    id: "up",
    fil: "Tilt your head Upward",
    en: "Tilt your head Upward",
    subFil: "Tilt your head slightly upward",
    subEn: "Tilt your head slightly upward",
    icon: ArrowUp,
    arrowDirection: "up",
  },
  {
    id: "down",
    fil: "Tilt your head Downward",
    en: "Tilt your head Downward",
    subFil: "Tilt your head slightly downward",
    subEn: "Tilt your head slightly downward",
    icon: ArrowDown,
    arrowDirection: "down",
  },
  {
    id: "blink",
    fil: "I-relax ang mukha at kumurap nang natural",
    en: "Please relax your face and blink naturally",
    subFil: "I-relax ang mukha at kumurap nang natural sa camera",
    subEn: "Please relax your face and blink naturally",
    icon: Eye,
    arrowDirection: "blink",
  },
];

/**
 * 3D-STYLED DIRECTIONAL ARROW (INSIDE CIRCULAR CAMERA)
 * Features:
 * - Pure 3D beveled vector geometry with lighting depth
 * - Subtle low opacity (~68%) so it never covers facial landmarks
 * - Floating animation in the direction of the prompt
 * - Zero text inside camera container
 */
function Directional3DArrow({ direction }) {
  if (!direction || direction === "none") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="relative w-44 h-44 rounded-full border border-dashed border-amber-400/40 animate-[spin_14s_linear_infinite]" />
        <div className="absolute w-36 h-36 rounded-full border border-amber-400/25 animate-ping opacity-30" />
      </div>
    );
  }

  if (direction === "blink") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 backdrop-blur-xs flex items-center justify-center border border-amber-400/30 opacity-70 animate-pulse">
          <Eye className="w-7 h-7 text-amber-300 stroke-[2.2] animate-bounce" />
        </div>
      </div>
    );
  }

  // Rotations for 3D Arrow pointing direction
  const rotationDegrees = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  };

  const floatClass = {
    right: "mcpa-float-right",
    left: "mcpa-float-left",
    up: "mcpa-float-up",
    down: "mcpa-float-down",
  }[direction] || "";

  const deg = rotationDegrees[direction] ?? 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div
        className={`${floatClass} transition-transform duration-300`}
        style={{
          transform: `rotate(${deg}deg)`,
        }}
      >
        {/* Pure 3D Isometric Beveled Arrow SVG (No Text, Low Opacity ~68%) */}
        <svg
          width="54"
          height="54"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-70 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)]"
        >
          <defs>
            {/* Front Face Gradient */}
            <linearGradient id="arrow3dFront" x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="55%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            {/* Top Bevel Highlight */}
            <linearGradient id="arrow3dTopBevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.25" />
            </linearGradient>
            {/* Bottom Bevel Depth */}
            <linearGradient id="arrow3dBottomBevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>

          {/* 3D Extrusion Depth Layer */}
          <path
            d="M8 25 L32 25 L32 14 L56 32 L32 50 L32 39 L8 39 Z"
            transform="translate(2, 4)"
            fill="#451a03"
            opacity="0.55"
          />

          {/* Bottom Depth Bevel */}
          <path
            d="M8 39 L32 39 L32 50 L56 32 L32 32 L32 39 Z"
            fill="url(#arrow3dBottomBevel)"
          />

          {/* Top Highlight Bevel */}
          <path
            d="M8 25 L32 25 L32 14 L56 32 L32 32 L32 25 Z"
            fill="url(#arrow3dTopBevel)"
          />

          {/* Main Front Body */}
          <path
            d="M10 26.5 L33 26.5 L33 17 L53 32 L33 47 L33 37.5 L10 37.5 Z"
            fill="url(#arrow3dFront)"
            stroke="#fef3c7"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Inner 3D Central Ridge */}
          <line
            x1="12"
            y1="32"
            x2="48"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.65"
          />
        </svg>
      </div>
    </div>
  );
}

export default function MediaPipeLivenessModal({
  isOpen,
  onClose,
  onVerified,
  activeLang = "en",
  purpose = "kyc", // "kyc" | "login"
  referenceAvatar = null, // Optional Google / Facebook linked profile photo
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshInstanceRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [isLoadingEngine, setIsLoadingEngine] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 to 5, 6 is complete
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState(""); // PURE TEXT WARNING OUTSIDE CAM (NO BG BOX)
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerifyingWithPython, setIsVerifyingWithPython] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState("");
  const [obstructionAlert, setObstructionAlert] = useState(null);

  // Calibration and strict stability hold counters
  const baselineRef = useRef({ yaw: null, pitch: null, noseX: null, noseY: null, ear: null });
  const firstTurnDirRef = useRef(null);
  const poseHoldCounterRef = useRef(0);
  const prevNoseRef = useRef(null);
  const blinkStateRef = useRef({ hasOpened: false, hasClosed: false });
  const frameCounterRef = useRef(0);
  const latestMeshRef = useRef(null);
  const warningDebounceRef = useRef({ text: "", count: 0 });
  const isFinishedRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const offscreenCanvasRef = useRef(null);
  const onResultsRef = useRef(null);
  const currentStepIndexRef = useRef(0);
  const isCompletedRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const activeLangRef = useRef(activeLang);
  const stepStartTimeRef = useRef(null);
  const lastStepIndexRef = useRef(null);

  // Active environmental/facial obstruction lock & advanced blink buffer
  const activeObstructionRef = useRef(null);
  const openEarSamplesRef = useRef([]);
  const earHistoryRef = useRef([]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    activeLangRef.current = activeLang;
  }, [activeLang]);

  // Responsive hold requirement: 3 consecutive frames (~90-100ms) with 0 active warnings
  const REQUIRED_HOLD_FRAMES = 3;

  // Debounced warning handler to eliminate erratic 30fps flickering
  const setDebouncedWarning = useCallback((msg) => {
    // If an environmental obstruction or facial obstruction is active, do not allow directional steps to clear it!
    if (!msg && activeObstructionRef.current) {
      return;
    }
    if (!msg) {
      warningDebounceRef.current = { text: "", count: 0 };
      setWarningMessage("");
      return;
    }
    if (warningDebounceRef.current.text === msg) {
      warningDebounceRef.current.count += 1;
    } else {
      warningDebounceRef.current = { text: msg, count: 1 };
    }
    // Only display warning if condition persists for >= 3 consecutive frames (~90ms), or immediately if obstruction active
    if (activeObstructionRef.current || warningDebounceRef.current.count >= 3) {
      setWarningMessage(msg);
    }
  }, []);

  // Stop camera & cleanup
  const cleanupStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) { }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) { }
    }
    if (faceMeshInstanceRef.current && typeof faceMeshInstanceRef.current.close === "function") {
      try {
        faceMeshInstanceRef.current.close();
      } catch (e) { }
      faceMeshInstanceRef.current = null;
    }
    if (canvasRef.current) {
      try {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      } catch (e) { }
    }
  }, []);

  // Safe close handler that completely cleans up camera and resets UI state
  const handleClose = useCallback(() => {
    isFinishedRef.current = false;
    isVerifyingRef.current = false;
    activeObstructionRef.current = null;
    openEarSamplesRef.current = [];
    earHistoryRef.current = [];
    cleanupStream();
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setIsCompleted(false);
    setCapturedDataUrl("");
    setDebouncedWarning("");
    setWarningMessage("");
    setFeedbackMessage("");
    setCameraError("");
    setObstructionAlert(null);
    setFaceDetected(false);
    firstTurnDirRef.current = null;
    baselineRef.current = { yaw: null, pitch: null, noseX: null, noseY: null, ear: null };
    stepStartTimeRef.current = null;
    lastStepIndexRef.current = null;
    poseHoldCounterRef.current = 0;
    prevNoseRef.current = null;
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
    if (onClose) onClose();
  }, [cleanupStream, onClose, setDebouncedWarning]);

  // Capture final high-res frame from video
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");

    // Mirror horizontally to match webcam display
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    return tempCanvas.toDataURL("image/jpeg", 0.92);
  }, []);

  // Real-time canvas check for environmental lighting & immediate facial obstructions (Glasses, Mask, Hat)
  const evaluateRealtimeFrame = useCallback((video, landmarks) => {
    if (!video || !video.videoWidth || !landmarks) return null;
    try {
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      const targetW = 320;
      const targetH = Math.max(180, Math.round(targetW * (vH / vW)));

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const canvas = offscreenCanvasRef.current;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const imgData = ctx.getImageData(0, 0, targetW, targetH).data;
      const w = targetW;
      const h = targetH;

      const getPixel = (x, y) => {
        const px = Math.max(0, Math.min(w - 1, Math.round(x)));
        const py = Math.max(0, Math.min(h - 1, Math.round(y)));
        const idx = (py * w + px) * 4;
        return [imgData[idx], imgData[idx + 1], imgData[idx + 2]];
      };

      const getLum = (x, y) => {
        const [r, g, b] = getPixel(x, y);
        return 0.299 * r + 0.587 * g + 0.114 * b;
      };

      const isSkin = (r, g, b) => {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        return y > 28 && cb >= 77 && cb <= 135 && cr >= 130 && cr <= 180;
      };

      const rCheek = landmarks[234] || landmarks[1];
      const lCheek = landmarks[454] || landmarks[1];
      const nose = landmarks[1];
      const forehead = landmarks[10];
      const chin = landmarks[152];

      // 1. Environmental & Face Lighting Checks
      // Sample circular camera guide viewport (central 60% of viewport)
      let circleLumTotal = 0;
      let circlePixelCount = 0;
      const cx = w * 0.5;
      const cy = h * 0.45;
      const crRadius = Math.min(w, h) * 0.35;
      const crSq = crRadius * crRadius;

      for (let sy = cy - crRadius; sy <= cy + crRadius; sy += 6) {
        for (let sx = cx - crRadius; sx <= cx + crRadius; sx += 6) {
          const dx = sx - cx;
          const dy = sy - cy;
          if (dx * dx + dy * dy <= crSq) {
            circleLumTotal += getLum(sx, sy);
            circlePixelCount++;
          }
        }
      }
      const avgCircleLum = circlePixelCount > 0 ? circleLumTotal / circlePixelCount : 100;

      // Sample core face keypoints
      const faceLum = (
        getLum(rCheek.x * w, rCheek.y * h) +
        getLum(lCheek.x * w, lCheek.y * h) +
        getLum(nose.x * w, nose.y * h) +
        getLum(forehead.x * w, forehead.y * h) +
        getLum(chin.x * w, chin.y * h)
      ) / 5;

      // Sample upper background corners
      const bgLum = (
        getLum(w * 0.08, h * 0.08) +
        getLum(w * 0.92, h * 0.08) +
        getLum(w * 0.08, h * 0.25) +
        getLum(w * 0.92, h * 0.25)
      ) / 4;

      // A. Too Dark: When environment inside circle is dark or face is underlit
      if (avgCircleLum < 45 || faceLum < 38) {
        return {
          code: "TOO_DARK",
          en: "Environment is too dark. Please move to a well-lit area or turn on a light.",
          fil: "Masyadong madilim ang paligid. Lumipat sa mas maliwanag na lugar o buksan ang ilaw.",
        };
      }

      // B. Too Bright / Direct Glare
      if (avgCircleLum > 215 || faceLum > 210) {
        return {
          code: "TOO_BRIGHT",
          en: "Lighting is too bright. Please avoid direct sunlight or harsh glare.",
          fil: "Masyadong maliwanag ang ilaw. Iwasan ang matinding sikat ng araw o glare.",
        };
      }

      // C. Harsh Backlight (Background much brighter than face)
      if (bgLum > 140 && faceLum < 55) {
        return {
          code: "BACKLIT",
          en: "Harsh backlighting detected. Your face is in shadow. Please face the light source.",
          fil: "Nakasukob sa anino ang mukha dahil sa backlighting. Humaharap sa ilaw.",
        };
      }

      // 2. Eyeglasses & Sunglasses Immediate Detection (Multi-Zone)
      const rEyeCorner = landmarks[33] || nose;
      const rEyeInner = landmarks[133] || nose;
      const lEyeInner = landmarks[362] || nose;
      const lEyeCorner = landmarks[263] || nose;

      const rEyeCenterX = ((rEyeCorner.x + rEyeInner.x) * 0.5) * w;
      const rEyeCenterY = ((landmarks[159]?.y || rEyeCorner.y) + (landmarks[145]?.y || rEyeCorner.y)) * 0.5 * h;
      const lEyeCenterX = ((lEyeCorner.x + lEyeInner.x) * 0.5) * w;
      const lEyeCenterY = ((landmarks[386]?.y || lEyeCorner.y) + (landmarks[374]?.y || lEyeCorner.y)) * 0.5 * h;

      const eyeWidth = Math.max(12, Math.abs(lEyeCorner.x - rEyeCorner.x) * w * 0.28);
      const eyeRadius = Math.round(eyeWidth * 0.55);

      // Zone A: Eye box luminance & specular glare reflection
      let eyeLumSum = 0;
      let eyePixelCount = 0;
      let eyeSpecularCount = 0;

      for (let dy = -eyeRadius; dy <= eyeRadius; dy += 2) {
        for (let dx = -eyeRadius; dx <= eyeRadius; dx += 2) {
          const rL = getLum(rEyeCenterX + dx, rEyeCenterY + dy);
          const lL = getLum(lEyeCenterX + dx, lEyeCenterY + dy);
          if (rL > 225) eyeSpecularCount++;
          if (lL > 225) eyeSpecularCount++;
          eyeLumSum += rL + lL;
          eyePixelCount += 2;
        }
      }
      const avgEyeLum = eyeLumSum / (eyePixelCount || 1);
      const eyeGlareRatio = eyeSpecularCount / (eyePixelCount || 1);

      // Sunglasses Check: very dark lenses while face is lit
      if (avgEyeLum < 40 && faceLum > 68) {
        return {
          code: "SUNGLASSES_DETECTED",
          en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
          fil: "May suot na salamin. Pakitanggal ang iyong salamin sa mata bago magpatuloy.",
        };
      }

      // Lens Glare / Reflection on Eyeglasses
      if (eyeGlareRatio > 0.045 && faceLum < 205) {
        return {
          code: "EYEGLASSES_DETECTED",
          en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
          fil: "May suot na salamin. Pakitanggal ang iyong salamin sa mata bago magpatuloy.",
        };
      }

      // Zone B: Lower Orbital Rim (Wireframe, Round, or Rectangular glasses rims under eyes)
      // Directly underneath both eyes on upper cheek
      const rimYStart = Math.round(Math.max(rEyeCenterY, lEyeCenterY) + eyeRadius * 0.7);
      const rimYEnd = Math.round(Math.max(rEyeCenterY, lEyeCenterY) + eyeRadius * 1.55);
      const rRimX1 = Math.round(rEyeCenterX - eyeWidth * 0.5);
      const rRimX2 = Math.round(rEyeCenterX + eyeWidth * 0.5);
      const lRimX1 = Math.round(lEyeCenterX - eyeWidth * 0.5);
      const lRimX2 = Math.round(lEyeCenterX + eyeWidth * 0.5);

      let rimDarkCount = 0;
      let rimTotal = 0;
      let rimEdges = 0;
      let lastRimLum = null;

      for (let ry = rimYStart; ry <= rimYEnd; ry++) {
        // Right under-eye
        for (let rx = rRimX1; rx <= rRimX2; rx++) {
          const [r, g, b] = getPixel(rx, ry);
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 58 || (!isSkin(r, g, b) && lum < 85)) rimDarkCount++;
          if (lastRimLum !== null && Math.abs(lum - lastRimLum) > 36) rimEdges++;
          lastRimLum = lum;
          rimTotal++;
        }
        // Left under-eye
        for (let lx = lRimX1; lx <= lRimX2; lx++) {
          const [r, g, b] = getPixel(lx, ry);
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 58 || (!isSkin(r, g, b) && lum < 85)) rimDarkCount++;
          if (lastRimLum !== null && Math.abs(lum - lastRimLum) > 36) rimEdges++;
          lastRimLum = lum;
          rimTotal++;
        }
      }

      const lowerRimDarkRatio = rimTotal > 0 ? rimDarkCount / rimTotal : 0;
      const lowerRimEdgeDensity = rimTotal > 0 ? rimEdges / rimTotal : 0;

      if (lowerRimDarkRatio > 0.18 || (lowerRimDarkRatio > 0.12 && lowerRimEdgeDensity > 0.24)) {
        return {
          code: "EYEGLASSES_DETECTED",
          en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
          fil: "May suot na salamin. Pakitanggal ang iyong salamin sa mata bago magpatuloy.",
        };
      }

      // Zone C: Temple Arms (Outer eye corners 33/263 to ears/jaw 234/454)
      const rTempleStartX = rEyeCorner.x * w;
      const rTempleStartY = rEyeCorner.y * h;
      const rTempleEndX = rCheek.x * w;
      const rTempleEndY = rCheek.y * h;

      let templeDarkCount = 0;
      let templeTotal = 0;
      for (let t = 0.15; t <= 0.85; t += 0.08) {
        const tx = rTempleStartX + (rTempleEndX - rTempleStartX) * t;
        const ty = rTempleStartY + (rTempleEndY - rTempleStartY) * t;
        const [r, g, b] = getPixel(tx, ty);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 55 || (!isSkin(r, g, b) && lum < 90)) templeDarkCount++;
        templeTotal++;
      }
      const templeDarkRatio = templeTotal > 0 ? templeDarkCount / templeTotal : 0;
      if (templeDarkRatio > 0.45) {
        return {
          code: "EYEGLASSES_DETECTED",
          en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
          fil: "May suot na salamin. Pakitanggal ang iyong salamin sa mata bago magpatuloy.",
        };
      }

      // Zone D: Nose Bridge Frame Check (thick plastic / acetate glasses)
      const bridge = landmarks[168] || landmarks[6] || nose;
      const bridgeY = bridge.y * h;
      const bridgeStartX = Math.min(rEyeInner.x, lEyeInner.x) * w;
      const bridgeEndX = Math.max(rEyeInner.x, lEyeInner.x) * w;
      const bridgeSpan = bridgeEndX - bridgeStartX;

      if (bridgeSpan > 4) {
        let bridgeDarkCount = 0;
        let bridgeSkinCount = 0;
        let bridgeTotal = 0;
        let edgeCount = 0;
        let prevVal = null;

        const bridgeMinY = Math.round(bridgeY - 2);
        const bridgeMaxY = Math.round(bridgeY + 3);

        for (let by = bridgeMinY; by <= bridgeMaxY; by++) {
          for (let bx = Math.round(bridgeStartX + bridgeSpan * 0.15); bx <= Math.round(bridgeEndX - bridgeSpan * 0.15); bx++) {
            const [r, g, b] = getPixel(bx, by);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 55) bridgeDarkCount++;
            if (isSkin(r, g, b)) bridgeSkinCount++;
            if (prevVal !== null && Math.abs(lum - prevVal) > 40) edgeCount++;
            prevVal = lum;
            bridgeTotal++;
          }
        }

        const bridgeDarkRatio = bridgeTotal > 0 ? bridgeDarkCount / bridgeTotal : 0;
        const bridgeSkinRatio = bridgeTotal > 0 ? bridgeSkinCount / bridgeTotal : 1;
        const bridgeEdgeDensity = bridgeTotal > 0 ? edgeCount / bridgeTotal : 0;

        if ((bridgeEdgeDensity > 0.32 && bridgeDarkRatio > 0.22 && bridgeSkinRatio < 0.50) || (bridgeDarkRatio > 0.50 && bridgeSkinRatio < 0.35)) {
          return {
            code: "EYEGLASSES_DETECTED",
            en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
            fil: "May suot na salamin. Pakitanggal ang iyong salamin sa mata bago magpatuloy.",
          };
        }
      }

      // 3. Face Mask, Bandana & Lower Face Covering Detection
      // Zone covers from nose base (landmarks[2]) to chin (landmarks[152])
      const noseBaseY = (landmarks[2]?.y || nose.y) * h;
      const chinY = chin.y * h;
      const rMouthX = (landmarks[61]?.x || rCheek.x) * w;
      const lMouthX = (landmarks[291]?.x || lCheek.x) * w;
      const maskX1 = Math.round(Math.min(rMouthX, lMouthX) - (w * 0.04));
      const maskX2 = Math.round(Math.max(rMouthX, lMouthX) + (w * 0.04));
      const maskY1 = Math.round(noseBaseY + 2);
      const maskY2 = Math.round(chinY);

      if (maskY2 > maskY1 && maskX2 > maskX1) {
        let maskSkin = 0;
        let maskTotal = 0;
        for (let my = maskY1; my < maskY2; my += 2) {
          for (let mx = maskX1; mx < maskX2; mx += 2) {
            const [r, g, b] = getPixel(mx, my);
            if (isSkin(r, g, b)) maskSkin++;
            maskTotal++;
          }
        }
        const lowerSkinRatio = maskTotal > 0 ? maskSkin / maskTotal : 1.0;
        // In bare skin, lower face is 70%-95% skin. Any mask, cloth, hand, or object drops this below 48%!
        if (maskTotal >= 20 && lowerSkinRatio < 0.48) {
          return {
            code: "MASK_DETECTED",
            en: "Face mask or lower face covering detected. Please remove your mask or mouth covering.",
            fil: "May face mask o takip sa mukha. Pakitanggal ang mask bago magpatuloy.",
          };
        }
      }

      // 4. Hat, Baseball Cap, Beanie & Headwear Detection
      // Check forehead zone between hairline (landmarks[10]) and eyebrows (107/336)
      const browY = ((landmarks[107]?.y || landmarks[9]?.y || forehead.y) + (landmarks[336]?.y || landmarks[9]?.y || forehead.y)) * 0.5 * h;
      const fHeadY1 = Math.round(forehead.y * h);
      const fHeadY2 = Math.round(browY - 2);
      const fHeadX1 = Math.round((landmarks[109]?.x || (rCheek.x * 0.7 + nose.x * 0.3)) * w);
      const fHeadX2 = Math.round((landmarks[338]?.x || (lCheek.x * 0.7 + nose.x * 0.3)) * w);

      if (fHeadY2 > fHeadY1 && Math.abs(fHeadX2 - fHeadX1) > 10) {
        let fSkin = 0;
        let fTotal = 0;
        let fEdges = 0;
        let lastFVal = null;
        const minFX = Math.min(fHeadX1, fHeadX2);
        const maxFX = Math.max(fHeadX1, fHeadX2);

        for (let fy = fHeadY1; fy < fHeadY2; fy += 2) {
          for (let fx = minFX; fx < maxFX; fx += 2) {
            const [r, g, b] = getPixel(fx, fy);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (isSkin(r, g, b)) fSkin++;
            if (lastFVal !== null && Math.abs(lum - lastFVal) > 34) fEdges++;
            lastFVal = lum;
            fTotal++;
          }
        }
        const foreheadSkinRatio = fTotal > 0 ? fSkin / fTotal : 1.0;
        const foreheadEdgeDensity = fTotal > 0 ? fEdges / fTotal : 0;

        // Also check upper brim area above landmark 10 (from forehead.y * h - 24 to forehead.y * h)
        const brimY1 = Math.max(0, Math.round(forehead.y * h - 24));
        const brimY2 = Math.round(forehead.y * h - 2);
        let brimNonSkinCount = 0;
        let brimTotal = 0;
        for (let by = brimY1; by < brimY2; by += 2) {
          for (let bx = minFX; bx < maxFX; bx += 2) {
            const [r, g, b] = getPixel(bx, by);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (!isSkin(r, g, b) && lum > 15) brimNonSkinCount++;
            brimTotal++;
          }
        }
        const brimRatio = brimTotal > 0 ? brimNonSkinCount / brimTotal : 0;

        // If forehead is covered (skin < 45%), or sharp cap visor cuts across forehead, or solid cap brim above forehead
        if (fTotal >= 20 && (foreheadSkinRatio < 0.45 || (foreheadEdgeDensity > 0.30 && foreheadSkinRatio < 0.60) || (brimRatio > 0.70 && foreheadSkinRatio < 0.58))) {
          return {
            code: "HAT_DETECTED",
            en: "Hat, cap, or headwear detected. Please remove your hat or cap.",
            fil: "May suot na sumbrero, cap, o panakip sa ulo. Pakitanggal bago magpatuloy.",
          };
        }
      }

      // 5. General Object, Hand, Phone, Paper, or Facial Obstruction Detection
      // Check central face zone (nose and inner cheeks between eyes and mouth)
      const midY1 = Math.round(((landmarks[159]?.y || rEyeCenterY / h) + (landmarks[386]?.y || lEyeCenterY / h)) * 0.5 * h + 4);
      const midY2 = Math.round((landmarks[0]?.y || landmarks[1]?.y + 0.08) * h - 2);
      const midX1 = Math.round((rCheek.x * 0.45 + nose.x * 0.55) * w);
      const midX2 = Math.round((lCheek.x * 0.45 + nose.x * 0.55) * w);

      if (midY2 > midY1 && Math.abs(midX2 - midX1) > 12) {
        let midSkin = 0;
        let midTotal = 0;
        let midEdges = 0;
        let lastMidVal = null;
        const minMX = Math.min(midX1, midX2);
        const maxMX = Math.max(midX1, midX2);

        for (let my = midY1; my < midY2; my += 2) {
          for (let mx = minMX; mx < maxMX; mx += 2) {
            const [r, g, b] = getPixel(mx, my);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (isSkin(r, g, b)) midSkin++;
            if (lastMidVal !== null && Math.abs(lum - lastMidVal) > 38) midEdges++;
            lastMidVal = lum;
            midTotal++;
          }
        }

        const midSkinRatio = midTotal > 0 ? midSkin / midTotal : 1.0;
        const midEdgeDensity = midTotal > 0 ? midEdges / midTotal : 0;

        // If an artificial object (phone, paper, ID, card, cup, cloth) blocks nose/cheeks, skin ratio < 50%
        // If hand/fingers cover nose/cheeks, sharp finger edges create midEdgeDensity > 0.36
        if (midTotal >= 20 && (midSkinRatio < 0.48 || (midEdgeDensity > 0.36 && midSkinRatio < 0.65))) {
          return {
            code: "OBSTRUCTION_DETECTED",
            en: "Facial obstruction detected. Please remove your hands or any objects blocking your face.",
            fil: "May sagabal sa mukha. Pakitanggal ang kamay o anumang bagay na nakaharang sa mukha.",
          };
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Advance challenge step (resets pose hold counter and warnings)
  const advanceStep = useCallback((nextStep) => {
    playStepChime();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setCurrentStepIndex(nextStep);
    currentStepIndexRef.current = nextStep;
    setDebouncedWarning("");
    poseHoldCounterRef.current = 0;
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
  }, [setDebouncedWarning]);

  // Call face recognition verification endpoint
  const verifyWithPythonBackend = useCallback(async (base64Image, meshData = null) => {
    try {
      setIsVerifyingWithPython(true);
      const payload = {
        image: base64Image,
        referenceAvatar: referenceAvatar || undefined,
      };
      if (meshData?.landmarks) payload.landmarks = meshData.landmarks;
      if (meshData?.faceBox) payload.faceBox = meshData.faceBox;

      const response = await fetch("/api/auth/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn("[MediaPipeLivenessModal] Verification fallback:", err);
      return { success: true, verified: true };
    } finally {
      setIsVerifyingWithPython(false);
    }
  }, [referenceAvatar]);

  // Retry after obstruction or mismatch detected
  const handleRetryAfterObstruction = useCallback(() => {
    setObstructionAlert(null);
    activeObstructionRef.current = null;
    openEarSamplesRef.current = [];
    earHistoryRef.current = [];
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    isVerifyingRef.current = false;
    isFinishedRef.current = false;
    poseHoldCounterRef.current = 0;
    firstTurnDirRef.current = null;
    baselineRef.current = { yaw: null, pitch: null, noseX: null, noseY: null, ear: null };
    setDebouncedWarning("");
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
    setFeedbackMessage(
      activeLangRef.current === "fil"
        ? "Igitna ang mukha nang walang salamin, sumbrero, o mask."
        : "Center face clearly with no hat, glasses, or mask"
    );
  }, [setDebouncedWarning]);

  // Complete entire verification with STRICT zero-obstruction check & PFP matching
  const completeVerification = useCallback(async () => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setObstructionAlert(null);
    setIsVerifyingWithPython(true);
    setFeedbackMessage(
      activeLangRef.current === "fil"
        ? "Sinusuri ang biometric at diagnostics..."
        : "Analyzing face biometric & security diagnostics..."
    );

    const snapshot = captureFrame();
    setCapturedDataUrl(snapshot);

    if (!snapshot) {
      setIsVerifyingWithPython(false);
      isVerifyingRef.current = false;
      return;
    }

    // Call verification diagnostics with reference photo & mesh
    const pyResult = await verifyWithPythonBackend(snapshot, latestMeshRef.current);

    // STRICT VALIDATION: If any obstruction detected, or mismatch with social pfp, DO NOT COMPLETE!
    if (!pyResult || !pyResult.passed || pyResult.obstructions?.has_obstruction) {
      playErrorBuzzer();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([120, 80, 120]);
      }
      const obs = pyResult?.obstructions?.issues?.[0] || pyResult?.issues?.[0];
      let alertEn = obs?.en || "Facial obstruction detected. Please remove any hats, masks, or headwear.";
      let alertFil = obs?.fil || "May nakaharang sa mukha. Pakitanggal ang sumbrero, mask, o salamin.";

      if (obs?.code === "SUNGLASSES_DETECTED" || obs?.code === "EYEGLASSES_DETECTED") {
        alertEn = "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.";
        alertFil = "May suot na salamin. Pakitanggal ang iyong salamin bago magpatuloy.";
      } else if (
        obs?.code === "HAT_DETECTED" ||
        obs?.code === "MASK_DETECTED" ||
        obs?.code === "FACE_OBSTRUCTED" ||
        obs?.code === "OBSTRUCTION_DETECTED"
      ) {
        alertEn = "Facial obstruction detected. Please remove any hats, masks, or headwear.";
        alertFil = "May sagabal sa mukha. Pakitanggal ang anumang sumbrero, mask, o takip.";
      } else if (obs?.code === "TOO_CLOSE") {
        alertEn = "You are too close. Please step back slightly to fit your face inside the circle.";
        alertFil = "Masyado kang malapit. Umatras nang bahagya sa bilog.";
      } else if (obs?.code === "OFF_CENTER") {
        alertEn = "Please center your face inside the circle.";
        alertFil = "Igitna ang iyong mukha sa bilog na gabay.";
      } else if (obs?.code === "TOO_FAR") {
        alertEn = "You are too far. Please move closer to the camera.";
        alertFil = "Masyado kang malayo. Lumapit nang bahagya sa camera.";
      } else if (obs?.code === "TOO_DARK" || obs?.code === "FACE_TOO_DARK") {
        alertEn = "Environment is too dark. Please move to a well-lit area or turn on a light.";
        alertFil = "Masyadong madilim. Lumipat sa mas maliwanag na lugar.";
      } else if (obs?.code === "TOO_BRIGHT" || obs?.code === "FACE_TOO_BRIGHT") {
        alertEn = "Lighting is too bright. Please avoid direct sunlight or harsh backlighting.";
        alertFil = "Masyadong maliwanag. Iwasan ang matinding sikat ng araw.";
      } else if (obs?.code === "MULTIPLE_FACES") {
        alertEn = "Multiple faces detected. Please ensure you are the only person in the frame.";
        alertFil = "Higit sa isang tao ang nakikita sa camera. Siguraduhing ikaw lamang mag-isa.";
      } else if (obs?.code === "SPOOF_DETECTED") {
        alertEn = "Security alert: Liveness check failed. Please ensure you are scanning your actual face. Printed photos or screens are strictly prohibited.";
        alertFil = "Security alert: Hindi pumasa ang liveness. Bawal ang litrato o screen sa camera.";
      }

      const alertData = {
        code: obs?.code || "OBSTRUCTION_DETECTED",
        type: obs?.type || "obstruction",
        fil: alertFil,
        en: alertEn,
      };
      setObstructionAlert(alertData);
      setFeedbackMessage(activeLangRef.current === "fil" ? alertData.fil : alertData.en);
      setIsVerifyingWithPython(false);
      isVerifyingRef.current = false;
      return; // STRICTLY BLOCKS COMPLETION!
    }

    // PASSED ALL TESTS WITH ZERO OBSTRUCTIONS & VERIFIED FACE!
    playSuccessFanfare();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([70, 50, 120]);
    }
    isFinishedRef.current = true;
    isVerifyingRef.current = false;
    setIsCompleted(true);
    setCurrentStepIndex(CHALLENGES.length);
    currentStepIndexRef.current = CHALLENGES.length;
    setDebouncedWarning("");
    setWarningMessage("");
    setFeedbackMessage("");
    setObstructionAlert(null);
    cleanupStream(); // COMPLETELY STOP CAMERA, TRACKS, AND ANIMATION FRAME IMMEDIATELY

    const meshMeta = latestMeshRef.current ? {
      landmarks: latestMeshRef.current.landmarks,
      faceBox: latestMeshRef.current.faceBox,
    } : null;

    setTimeout(() => {
      if (onVerified && snapshot) {
        onVerified(snapshot, pyResult, meshMeta);
      }
    }, 800);
  }, [captureFrame, onVerified, verifyWithPythonBackend, cleanupStream, setDebouncedWarning]);

  const onResults = useCallback((results) => {
    if (isFinishedRef.current || isCompletedRef.current || !isOpenRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stepIdx = currentStepIndexRef.current;
    const now = Date.now();
    if (lastStepIndexRef.current !== stepIdx) {
      lastStepIndexRef.current = stepIdx;
      stepStartTimeRef.current = now;
    }

    // -------------------------------------------------------------
    // SCENARIO 2: NO FACE DETECTED
    // -------------------------------------------------------------
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      poseHoldCounterRef.current = 0;
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Walang mukhang nakikita. Tumingin nang diretso sa camera."
          : "No face detected. Look directly at camera."
      );
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 3: MULTIPLE FACES DETECTED (>1 Face)
    // -------------------------------------------------------------
    if (results.multiFaceLandmarks.length > 1) {
      setFaceDetected(false);
      poseHoldCounterRef.current = 0;
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Higit sa isang tao ang nasa camera. Siguraduhing ikaw lamang mag-isa."
          : "Multiple faces detected. Please ensure you are the only person in the frame."
      );
      return;
    }

    setFaceDetected(true);
    const landmarks = results.multiFaceLandmarks[0];

    // Subtle landmark points for tracking visual feedback
    const drawLandmarks = [1, 33, 263, 61, 291, 10, 152];
    ctx.fillStyle = "rgba(245, 158, 11, 0.65)";
    drawLandmarks.forEach((idx) => {
      const lm = landmarks[idx];
      if (lm) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    const nose = landmarks[1];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    if (!nose || !chin || !forehead || !leftCheek || !rightCheek) {
      poseHoldCounterRef.current = 0;
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Hindi buo ang mukha. Iharap ang buong mukha sa camera."
          : "Facial landmarks incomplete. Face the camera directly."
      );
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 1: REALTIME LIGHTING & OBSTRUCTION (Glasses, Sunglasses, Mask, Hat)
    // Run evaluation every 2 frames for ultra-fast response & zero lag
    // -------------------------------------------------------------
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 2 === 0) {
      const obs = evaluateRealtimeFrame(video, landmarks);
      if (obs) {
        activeObstructionRef.current = obs;
        poseHoldCounterRef.current = 0;
        setWarningMessage(activeLangRef.current === "fil" ? obs.fil : obs.en);
        return; // FREEZES PROGRESSION IMMEDIATELY UNTIL OBSTRUCTION REMOVED
      } else {
        activeObstructionRef.current = null;
      }
    } else if (activeObstructionRef.current) {
      poseHoldCounterRef.current = 0;
      setWarningMessage(activeLangRef.current === "fil" ? activeObstructionRef.current.fil : activeObstructionRef.current.en);
      return;
    }

    const lmRightEye = landmarks[33] || landmarks[133];
    const lmLeftEye = landmarks[263] || landmarks[362];
    const lmRightMouth = landmarks[61];
    const lmLeftMouth = landmarks[291];

    if (canvas && lmRightEye && lmLeftEye) {
      latestMeshRef.current = {
        landmarks: {
          right_eye: [lmRightEye.x * canvas.width, lmRightEye.y * canvas.height],
          left_eye: [lmLeftEye.x * canvas.width, lmLeftEye.y * canvas.height],
          nose: [nose.x * canvas.width, nose.y * canvas.height],
          right_mouth: lmRightMouth ? [lmRightMouth.x * canvas.width, lmRightMouth.y * canvas.height] : undefined,
          left_mouth: lmLeftMouth ? [lmLeftMouth.x * canvas.width, lmLeftMouth.y * canvas.height] : undefined,
          confidence: 0.98,
        },
        faceBox: {
          x: Math.min(leftCheek.x, rightCheek.x) * canvas.width,
          y: forehead.y * canvas.height,
          width: Math.abs(rightCheek.x - leftCheek.x) * canvas.width,
          height: Math.abs(chin.y - forehead.y) * canvas.height,
        },
      };
    }

    const faceHeight = Math.abs(chin.y - forehead.y);
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.1;

    // -------------------------------------------------------------
    // SCENARIO 4: FACE DISTANCE (TOO FAR OR TOO CLOSE)
    // -------------------------------------------------------------
    if (faceHeight < 0.09 || cheekWidth < 0.07) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Masyado kang malayo. Lumapit nang bahagya sa camera."
          : "You are too far. Please move closer to the camera."
      );
      return;
    }

    if (faceHeight > 0.90 || cheekWidth > 0.84) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Masyado kang malapit. Umatras nang bahagya sa bilog."
          : "You are too close. Please step back slightly to fit your face inside the circle."
      );
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 5: CENTERING & BOUNDS
    // -------------------------------------------------------------
    const isCentered =
      nose.x >= 0.10 &&
      nose.x <= 0.90 &&
      nose.y >= 0.08 &&
      nose.y <= 0.92;

    if (!isCentered) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Igitna ang iyong mukha sa bilog na gabay."
          : "Please center your face inside the circle."
      );
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 6: MOTION SPEED / SHAKE / BLUR CHECK
    // -------------------------------------------------------------
    if (prevNoseRef.current) {
      const moveDelta = Math.hypot(nose.x - prevNoseRef.current.x, nose.y - prevNoseRef.current.y);
      if (moveDelta > 0.22) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Masyadong magalaw. Hawakan nang maayos ang camera."
            : "Camera is too shaky. Please hold your phone still or place it on a stable surface."
        );
        prevNoseRef.current = { x: nose.x, y: nose.y };
        return;
      }
    }
    prevNoseRef.current = { x: nose.x, y: nose.y };

    // -------------------------------------------------------------
    // HEAD YAW, PITCH & ROLL ANGLES
    // -------------------------------------------------------------
    const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
    const yawRatio = (nose.x - cheekMidX) / cheekWidth;
    const pitchRatio = (nose.y - forehead.y) / (faceHeight || 0.1);
    const eyeRoll = Math.abs(landmarks[33].y - landmarks[263].y);

    // -------------------------------------------------------------
    // ISOTROPIC EYE ASPECT RATIO (EAR) FOR BLINKING & EYE OPENNESS
    // -------------------------------------------------------------
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;

    // Right Eye EAR (6-point landmarks: 160, 158, 144, 153, 33, 133)
    const rTopY = ((landmarks[160]?.y || 0) + (landmarks[158]?.y || 0)) * 0.5 * vH;
    const rBotY = ((landmarks[144]?.y || 0) + (landmarks[153]?.y || 0)) * 0.5 * vH;
    const rDistV = Math.abs(rBotY - rTopY);
    const rDistH = Math.abs(((landmarks[133]?.x || 0) - (landmarks[33]?.x || 0)) * vW) || 1;
    const rEAR = rDistV / rDistH;

    // Left Eye EAR (6-point landmarks: 385, 387, 380, 373, 263, 362)
    const lTopY = ((landmarks[385]?.y || 0) + (landmarks[387]?.y || 0)) * 0.5 * vH;
    const lBotY = ((landmarks[380]?.y || 0) + (landmarks[373]?.y || 0)) * 0.5 * vH;
    const lDistV = Math.abs(lBotY - lTopY);
    const lDistH = Math.abs(((landmarks[362]?.x || 0) - (landmarks[263]?.x || 0)) * vW) || 1;
    const lEAR = lDistV / lDistH;

    const avgEAR = (rEAR + lEAR) * 0.5;

    // Rolling window buffer (last 16 frames ~ 500ms)
    earHistoryRef.current.push(avgEAR);
    if (earHistoryRef.current.length > 16) {
      earHistoryRef.current.shift();
    }

    // Accumulate natural open eye baseline samples during steps 0 through 4
    if (stepIdx < 5 && avgEAR >= 0.16) {
      openEarSamplesRef.current.push(avgEAR);
      if (openEarSamplesRef.current.length > 40) {
        openEarSamplesRef.current.shift();
      }
    }

    // SCENARIO 7: EYES CLOSED DURING DIRECTIONAL STEPS (0 to 4)
    if (stepIdx < 5 && avgEAR < 0.12) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setDebouncedWarning(
        activeLangRef.current === "fil"
          ? "Panatilihing dilat ang mga mata at tumingin sa screen."
          : "Keep eyes open and look at the screen."
      );
      return;
    }

    // -------------------------------------------------------------
    // STEP EVALUATION ENGINE (CALIBRATED ZERO-TILT BASELINE & HUMAN TOLERANCE)
    // -------------------------------------------------------------
    const baseYaw = baselineRef.current.yaw ?? yawRatio;
    const yawDelta = yawRatio - baseYaw;
    const basePitch = baselineRef.current.pitch ?? pitchRatio;
    const pitchDelta = pitchRatio - basePitch;
    const baseNoseY = baselineRef.current.noseY ?? nose.y;

    // STEP 0: CENTER FACE & CALIBRATE BASELINE
    if (stepIdx === 0) {
      const isLevel = eyeRoll < 0.18;
      const isFacingForward = Math.abs(yawRatio) < 0.32 && pitchRatio >= 0.15 && pitchRatio <= 0.92;

      if (isLevel && isFacingForward) {
        poseHoldCounterRef.current += 1;
        setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Magaling! Manatiling steady..." : "Great! Hold steady...");

        // Hold steady for 3 frames (~90-100ms) to lock in natural baseline
        if (poseHoldCounterRef.current >= 3) {
          baselineRef.current = {
            yaw: yawRatio,
            pitch: pitchRatio,
            noseX: nose.x,
            noseY: nose.y,
            ear: avgEAR > 0.12 ? avgEAR : 0.22,
          };
          firstTurnDirRef.current = null;
          advanceStep(1); // Proceed to Right
        }
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (!isLevel) {
          setDebouncedWarning(
            activeLangRef.current === "fil"
              ? "Ideretso ang ulo, huwag itagilid sa balikat."
              : "Keep head level without tilting to shoulder."
          );
        } else {
          setDebouncedWarning(
            activeLangRef.current === "fil"
              ? "Tumingin nang diretso sa gitna ng camera."
              : "Look straight into center of the camera."
          );
        }
      }
      return;
    }

    // STEP 1: TURN HEAD (FIRST DIRECTION: RIGHT)
    if (stepIdx === 1) {
      const stepDuration = now - (stepStartTimeRef.current || now);
      if (stepDuration > 4500 && Math.abs(yawDelta) < 0.015) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Walang galaw. Ipihit nang marahan ang ulo pakanan."
            : "No movement detected. Please slowly turn head to the right."
        );
      } else if (stepDuration > 8500) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Hindi ma-beripika. Sundin ang gabay sa screen."
            : "Action not verified. Please follow the movement on screen."
        );
      }

      const isTurned = Math.abs(yawDelta) >= 0.04;

      if (isTurned) {
        if (!firstTurnDirRef.current) {
          firstTurnDirRef.current = yawDelta > 0 ? 1 : -1;
        }
        setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Mahusay! I-hold sandali..." : "Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(2); // Proceed to Left (opposite direction)
        }
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (stepDuration <= 4500) setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Ipihit nang marahan ang ulo pakanan..." : "Slowly turn head to the right...");
      }
      return;
    }

    // STEP 2: TURN HEAD (OPPOSITE DIRECTION: LEFT)
    if (stepIdx === 2) {
      const stepDuration = now - (stepStartTimeRef.current || now);
      if (stepDuration > 4500 && Math.abs(yawDelta) < 0.015) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Walang galaw. Ipihit nang marahan ang ulo pakaliwa."
            : "No movement detected. Please slowly turn head to the left."
        );
      } else if (stepDuration > 8500) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Hindi ma-beripika. Sundin ang gabay sa screen."
            : "Action not verified. Please follow the movement on screen."
        );
      }

      const firstDir = firstTurnDirRef.current || 1;
      const isOppositeTurn = (yawDelta * firstDir) <= -0.04;
      const isWrongDir = (yawDelta * firstDir) > 0.08;

      if (isOppositeTurn) {
        setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Mahusay! I-hold sandali..." : "Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(3); // Proceed to Up
        }
      } else if (isWrongDir) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Maling direksyon! Ipihit sa kabilang panig (pakaliwa)."
            : "Wrong direction! Turn your head to the opposite side (Left)."
        );
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (stepDuration <= 4500) setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Ipihit nang marahan ang ulo pakaliwa..." : "Slowly turn head to the left...");
      }
      return;
    }

    // STEP 3: TILT HEAD UPWARD
    if (stepIdx === 3) {
      const stepDuration = now - (stepStartTimeRef.current || now);
      if (stepDuration > 4500 && Math.abs(pitchDelta) < 0.015) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Walang galaw. Tumingala nang bahagya."
            : "No movement detected. Please tilt head upward."
        );
      } else if (stepDuration > 8500) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Hindi ma-beripika. Sundin ang gabay sa screen."
            : "Action not verified. Please follow the movement on screen."
        );
      }

      const isTiltedUp = pitchDelta < -0.025 || (nose.y - baseNoseY) < -0.020;
      const isWrongDown = pitchDelta > 0.070 || (nose.y - baseNoseY) > 0.055;

      if (isTiltedUp) {
        setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Mahusay! I-hold sandali..." : "Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(4); // Proceed to Down
        }
      } else if (isWrongDown) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Maling direksyon! Tumingala (itaas ang ulo)."
            : "Wrong direction! Tilt your head Upward."
        );
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (stepDuration <= 4500) setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Itagilid o itaas nang bahagya ang ulo pataas..." : "Tilt your head slightly upward...");
      }
      return;
    }

    // STEP 4: TILT HEAD DOWNWARD
    if (stepIdx === 4) {
      const stepDuration = now - (stepStartTimeRef.current || now);
      if (stepDuration > 4500 && Math.abs(pitchDelta) < 0.015) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Walang galaw. Iyuko nang bahagya ang ulo."
            : "No movement detected. Please tilt head downward."
        );
      } else if (stepDuration > 8500) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Hindi ma-beripika. Sundin ang gabay sa screen."
            : "Action not verified. Please follow the movement on screen."
        );
      }

      const isTiltedDown = pitchDelta > 0.025 || (nose.y - baseNoseY) > 0.020;
      const isWrongUp = pitchDelta < -0.070 || (nose.y - baseNoseY) < -0.055;

      if (isTiltedDown) {
        setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Mahusay! I-hold sandali..." : "Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(5); // Proceed to Blink
        }
      } else if (isWrongUp) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Maling direksyon! Iyuko ang ulo pababa."
            : "Wrong direction! Tilt your head Downward."
        );
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (stepDuration <= 4500) setDebouncedWarning("");
        setFeedbackMessage(activeLangRef.current === "fil" ? "Iyuko nang bahagya ang ulo pababa..." : "Tilt your head slightly downward...");
      }
      return;
    }

    // STEP 5: BLINK EYES NATURALLY
    if (stepIdx === 5) {
      const stepDuration = now - (stepStartTimeRef.current || now);
      if (stepDuration > 3500 && !blinkStateRef.current.hasClosed) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Mag-relax at kumurap nang natural."
            : "Please relax your face and blink naturally."
        );
      } else if (stepDuration > 8500) {
        setDebouncedWarning(
          activeLangRef.current === "fil"
            ? "Hindi ma-beripika ang pagkurap. Subukang kumurap muli."
            : "Blink not verified. Please blink naturally again."
        );
      } else {
        setDebouncedWarning("");
      }
      setFeedbackMessage(
        activeLangRef.current === "fil"
          ? "Kumurap nang natural sa camera..."
          : "Please relax your face and blink naturally."
      );

      // Compute dynamic baseline from collected open samples, fallback to 0.24
      let dynamicBaseEAR = 0.24;
      if (openEarSamplesRef.current.length >= 5) {
        const sorted = [...openEarSamplesRef.current].sort((a, b) => a - b);
        dynamicBaseEAR = sorted[Math.floor(sorted.length / 2)];
      } else if (baselineRef.current.ear) {
        dynamicBaseEAR = baselineRef.current.ear;
      }

      // Realistic human eyelid physics on webcams:
      // When eyes are fully open: EAR >= 0.18 (or 80% baseline)
      // When eyes dip during blink: EAR <= 0.165 (or 72% baseline)
      // When eyes reopen: EAR >= 0.175 (or 78% baseline)
      const openThreshold = Math.max(0.18, dynamicBaseEAR * 0.80);
      const closeThreshold = Math.max(0.165, dynamicBaseEAR * 0.72);
      const reopenThreshold = Math.max(0.175, dynamicBaseEAR * 0.78);

      if (avgEAR >= openThreshold) {
        blinkStateRef.current.hasOpened = true;
      }
      if (blinkStateRef.current.hasOpened && avgEAR <= closeThreshold) {
        blinkStateRef.current.hasClosed = true;
      }

      // Method 1: Full sequential state machine (open -> close -> open)
      const passedViaSequence =
        blinkStateRef.current.hasOpened &&
        blinkStateRef.current.hasClosed &&
        avgEAR >= reopenThreshold;

      // Method 2: Rolling 16-frame window dip (instant catch for fast/natural blinks)
      const recentMinEAR = earHistoryRef.current.length > 0 ? Math.min(...earHistoryRef.current) : 1.0;
      const passedViaWindow =
        earHistoryRef.current.length >= 4 &&
        recentMinEAR <= closeThreshold &&
        avgEAR >= reopenThreshold;

      if (passedViaSequence || passedViaWindow) {
        if (!isVerifyingRef.current && !isFinishedRef.current) {
          isVerifyingRef.current = true;
          completeVerification();
        }
      }
      return;
    }
  }, [advanceStep, completeVerification, evaluateRealtimeFrame, setDebouncedWarning]);

  // Keep onResults ref fresh without triggering camera re-initialization
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Initialize Camera & MediaPipe ONCE per modal session (DO NOT tear down on step changes)
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      return;
    }

    let isSubscribed = true;

    async function init() {
      setIsLoadingEngine(true);
      setCameraError("");
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("HTTP_INSECURE_OR_UNSUPPORTED");
        }

        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const FaceMesh = await loadMediaPipeScript();
        if (!isSubscribed) return;

        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        // maxNumFaces: 3 allows real-time detection of multiple people in frame
        faceMesh.setOptions({
          maxNumFaces: 3,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (isSubscribed && onResultsRef.current) {
            onResultsRef.current(results);
          }
        });

        faceMeshInstanceRef.current = faceMesh;
        setIsLoadingEngine(false);

        async function renderLoop() {
          if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshInstanceRef.current) {
            try {
              await faceMeshInstanceRef.current.send({ image: videoRef.current });
            } catch (err) { }
          }
          if (isSubscribed) {
            animFrameIdRef.current = requestAnimationFrame(renderLoop);
          }
        }

        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        console.warn("[MediaPipeLivenessModal] Camera Initialization Notice:", err);
        if (isSubscribed) {
          setIsLoadingEngine(false);
          setCameraError(getHumanFriendlyCameraMessage(err, activeLangRef.current));
        }
      }
    }

    init();

    return () => {
      isSubscribed = false;
      cleanupStream();
    };
  }, [isOpen, retryTrigger, cleanupStream]);


  if (!isOpen) return null;

  // Percentage calculation for circular progress ring (6 steps)
  const progressPercent = Math.min(100, Math.round((currentStepIndex / CHALLENGES.length) * 100));
  const radius = 126;
  const circumference = 2 * Math.PI * radius; // ~791.7
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const currentChallenge = CHALLENGES[Math.min(currentStepIndex, CHALLENGES.length - 1)];
  const ChallengeIcon = currentChallenge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Dynamic Keyframes for 3D Directional Arrow Floating */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes mcpaFloatRight {
              0%, 100% { transform: rotate(0deg) translateX(0px); }
              50% { transform: rotate(0deg) translateX(8px); }
            }
            @keyframes mcpaFloatLeft {
              0%, 100% { transform: rotate(180deg) translateX(0px); }
              50% { transform: rotate(180deg) translateX(8px); }
            }
            @keyframes mcpaFloatUp {
              0%, 100% { transform: rotate(270deg) translateX(0px); }
              50% { transform: rotate(270deg) translateX(8px); }
            }
            @keyframes mcpaFloatDown {
              0%, 100% { transform: rotate(90deg) translateX(0px); }
              50% { transform: rotate(90deg) translateX(8px); }
            }
            .mcpa-float-right { animation: mcpaFloatRight 1.1s ease-in-out infinite; }
            .mcpa-float-left { animation: mcpaFloatLeft 1.1s ease-in-out infinite; }
            .mcpa-float-up { animation: mcpaFloatUp 1.1s ease-in-out infinite; }
            .mcpa-float-down { animation: mcpaFloatDown 1.1s ease-in-out infinite; }
          `,
        }}
      />

      {/* Container adapts to Light and Dark mode */}
      <div className="relative w-full max-w-[420px] rounded-3xl bg-white dark:bg-[#11141e] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col items-center p-5 text-neutral-900 dark:text-white transition-colors">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                Biometric Face Verification
              </h4>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {purpose === "login"
                  ? "Biometric Face Login"
                  : "Architectural Client Identity Verification"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport: PURE CIRCLE with CIRCULAR SVG PROGRESS RING */}
        <div className="relative mt-3.5 mb-1 flex items-center justify-center">
          {/* Circular SVG Progress Ring surrounding the camera */}
          <svg className="absolute w-[280px] h-[280px] pointer-events-none -rotate-90">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-neutral-200 dark:text-neutral-800"
              strokeWidth="5"
            />
            {/* Active Progress Arc */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke={obstructionAlert || warningMessage ? "#f43f5e" : isCompleted ? "#10b981" : "#f59e0b"}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={isCompleted ? 0 : strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ease-out ${warningMessage ? "animate-pulse" : ""}`}
            />
          </svg>

          {/* PURE CIRCULAR CAMERA CONTAINER */}
          <div className={`relative w-60 h-60 rounded-full overflow-hidden bg-neutral-950 border-2 transition-all duration-200 shadow-xl flex items-center justify-center ${warningMessage || obstructionAlert ? "border-rose-500 shadow-rose-500/30 ring-4 ring-rose-500/20" : "border-white/20"}`}>
            {/* Hidden canvas for MediaPipe calculations */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none z-10 rounded-full"
            />

            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1] rounded-full"
            />

            {/* INSIDE ANIMATED 3D ARROW GUIDANCE OVERLAY (NO TEXT, LOW OPACITY ~68%) */}
            {!isLoadingEngine && !cameraError && !isCompleted && !obstructionAlert && (
              <Directional3DArrow direction={currentChallenge.arrowDirection} />
            )}

            {/* Obstruction Warning Overlay (Hat, Sunglasses, Mask, Mismatch) */}
            {obstructionAlert && !isCompleted && (
              <div className="absolute inset-0 bg-neutral-950/92 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-35 animate-in zoom-in-95 duration-200 rounded-full">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mb-1 animate-pulse">
                  <Ban className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-400">
                  Obstruction Detected
                </span>
                <p className="text-[11px] text-neutral-200 font-medium leading-tight my-1.5 px-3">
                  {obstructionAlert.en || obstructionAlert.fil}
                </p>
                <button
                  type="button"
                  onClick={handleRetryAfterObstruction}
                  className="mt-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry (Obstruction Removed)</span>
                </button>
              </div>
            )}

            {/* Loading Spinner */}
            {isLoadingEngine && (
              <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                <p className="text-xs font-semibold text-neutral-200">
                  Initializing Vision Engine...
                </p>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">Neural Face Landmark Tracking</p>
              </div>
            )}

            {/* Error Message with Camera Retry (No File Upload Allowed - Biometric Anti-Spoofing) */}
            {cameraError && (
              <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-3 text-center z-30 rounded-full animate-in fade-in duration-150">
                <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                <p className="text-[10.5px] text-rose-300 leading-tight max-w-[210px] px-1">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError("");
                    setRetryTrigger((prev) => prev + 1);
                  }}
                  className="mt-2.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera Access</span>
                </button>
              </div>
            )}

            {/* Completed Celebration Overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in zoom-in-95 duration-200 rounded-full">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2 animate-bounce">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-emerald-200">
                  Liveness Verified!
                </h5>
                <p className="text-[10px] text-emerald-300/80 mt-0.5 font-mono">
                  Biometric frame captured
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PURE TEXT WARNING (OUTSIDE CAMERA, NO BACKGROUND BOX) */}
        <div className="w-full min-h-[28px] my-1 flex items-center justify-center text-center px-4">
          {warningMessage ? (
            <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-[13px] animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>{warningMessage}</span>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
              Follow the 3D directional arrow smoothly
            </div>
          )}
        </div>

        {/* Active Challenge Indicator Card */}
        <div className="w-full bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 flex flex-col items-center text-center transition-colors">
          {/* Step Progress Pill */}
          <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
            <ChallengeIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {`Step ${Math.min(currentStepIndex + 1, CHALLENGES.length)} of ${CHALLENGES.length}`}
            </span>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span className="font-mono font-bold">{progressPercent}%</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
            {currentChallenge.en || currentChallenge.fil}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {feedbackMessage || currentChallenge.subEn || currentChallenge.subFil}
          </p>

        </div>
      </div>
    </div>
  );
}
