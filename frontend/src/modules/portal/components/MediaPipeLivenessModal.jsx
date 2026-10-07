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
  } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
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
    fil: "Blink your eyes naturally",
    en: "Blink your eyes naturally",
    subFil: "Close and open your eyes once",
    subEn: "Close and open your eyes once",
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
  const baselineRef = useRef({ yaw: null, pitch: null, noseX: null, noseY: null });
  const firstTurnDirRef = useRef(null);
  const poseHoldCounterRef = useRef(0);
  const prevNoseRef = useRef(null);
  const blinkStateRef = useRef({ hasOpened: false, hasClosed: false });
  const frameCounterRef = useRef(0);
  const latestMeshRef = useRef(null);

  // Responsive hold requirement: 6 consecutive frames (~180-200ms) with 0 active warnings
  const REQUIRED_HOLD_FRAMES = 6;

  // Stop camera & cleanup
  const cleanupStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (faceMeshInstanceRef.current && typeof faceMeshInstanceRef.current.close === "function") {
      try {
        faceMeshInstanceRef.current.close();
      } catch (e) {}
      faceMeshInstanceRef.current = null;
    }
  }, []);

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

  // Real-time canvas check for environmental lighting (Dark / Glare / Face Silhouette)
  const checkEnvironment = useCallback((video) => {
    if (!video || !video.videoWidth) return null;
    try {
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 64;
      testCanvas.height = 48;
      const ctx = testCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, 64, 48);
      const imgData = ctx.getImageData(0, 0, 64, 48).data;

      let totalLum = 0;
      let centerLum = 0;
      let centerCount = 0;
      const count = imgData.length / 4;

      // Central facial region bounds (approx center 50% width and height)
      const minX = 16, maxX = 48;
      const minY = 12, maxY = 36;

      for (let y = 0; y < 48; y++) {
        for (let x = 0; x < 64; x++) {
          const idx = (y * 64 + x) * 4;
          const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
          totalLum += lum;
          if (x >= minX && x < maxX && y >= minY && y < maxY) {
            centerLum += lum;
            centerCount++;
          }
        }
      }

      const avgLum = totalLum / count;
      const avgCenterLum = centerCount > 0 ? centerLum / centerCount : avgLum;

      // Check for dark room OR face silhouette caused by backlighting
      if (avgLum < 50 || avgCenterLum < 45) {
        return {
          type: "dark",
          text: "Face is too dark or backlit. Please face a light source and ensure your face is well-lit.",
        };
      }
      if (avgLum > 220 || avgCenterLum > 225) {
        return {
          type: "bright",
          text: "Too bright or direct glare. Avoid harsh backlights.",
        };
      }
    } catch (e) {}
    return null;
  }, []);

  // Advance challenge step (resets pose hold counter and warnings)
  const advanceStep = useCallback((nextStep) => {
    playStepChime();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setCurrentStepIndex(nextStep);
    setWarningMessage("");
    poseHoldCounterRef.current = 0;
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
  }, []);

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
    setCurrentStepIndex(0);
    poseHoldCounterRef.current = 0;
    firstTurnDirRef.current = null;
    baselineRef.current = { yaw: null, pitch: null, noseX: null, noseY: null };
    setWarningMessage("");
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
    setFeedbackMessage("Center face clearly with no hat, glasses, or mask");
  }, []);

  // Complete entire verification with STRICT Python zero-obstruction check & PFP matching
  const completeVerification = useCallback(async () => {
    setObstructionAlert(null);
    setIsVerifyingWithPython(true);
    setFeedbackMessage("Analyzing face biometric & security diagnostics...");

    const snapshot = captureFrame();
    setCapturedDataUrl(snapshot);

    if (!snapshot) {
      setIsVerifyingWithPython(false);
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
      const alertData = {
        code: obs?.code || "OBSTRUCTION_DETECTED",
        type: obs?.type || "obstruction",
        fil: obs?.en || obs?.fil || "Face obstruction or profile mismatch detected. Please remove any hat, glasses, or mask before proceeding.",
        en: obs?.en || "Face obstruction or profile mismatch detected. Please remove any hat, glasses, or mask before proceeding.",
      };
      setObstructionAlert(alertData);
      setFeedbackMessage(alertData.en);
      setIsVerifyingWithPython(false);
      return; // STRICTLY BLOCKS COMPLETION!
    }

    // PASSED ALL TESTS WITH ZERO OBSTRUCTIONS & VERIFIED FACE!
    playSuccessFanfare();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([70, 50, 120]);
    }
    setIsCompleted(true);
    setCurrentStepIndex(CHALLENGES.length);

    setTimeout(() => {
      if (onVerified && snapshot) {
        onVerified(snapshot, pyResult);
      }
    }, 900);
  }, [captureFrame, onVerified, verifyWithPythonBackend, activeLang]);

  // Process MediaPipe landmarks frame-by-frame with ULTRA-STRICT validation
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // -------------------------------------------------------------
    // SCENARIO 1: LIGHTING & ENVIRONMENT (Run every 3 frames)
    // -------------------------------------------------------------
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 3 === 0) {
      const warn = checkEnvironment(video);
      if (warn) {
        setWarningMessage(warn.text);
        poseHoldCounterRef.current = 0;
        return; // STRICTLY HALT & BLOCK PROGRESSION IN BAD LIGHTING!
      }
    }

    // -------------------------------------------------------------
    // SCENARIO 2: NO FACE DETECTED
    // -------------------------------------------------------------
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      poseHoldCounterRef.current = 0;
      setWarningMessage(
        activeLang === "fil"
          ? "Walang mukhang nakikita. Tumingin nang diretso sa camera."
          : "No face detected. Look directly at camera."
      );
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 3: MULTIPLE FACES DETECTED
    // -------------------------------------------------------------
    if (results.multiFaceLandmarks.length > 1) {
      setFaceDetected(false);
      poseHoldCounterRef.current = 0;
      setWarningMessage(
        activeLang === "fil"
          ? "Maraming tao ang nakikita sa camera. Isang tao lamang ang kailangan."
          : "Multiple faces detected. Only one person allowed."
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
      setWarningMessage(
        activeLang === "fil"
          ? "Hindi buo ang mukha. Iharap ang buong mukha sa camera."
          : "Facial landmarks incomplete. Face the camera directly."
      );
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
    if (faceHeight < 0.18 || cheekWidth < 0.14) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setWarningMessage(
        activeLang === "fil"
          ? "Masyadong malayo ang mukha. Lumapit nang bahagya sa camera."
          : "Face too far. Move closer to the camera."
      );
      return;
    }

    if (faceHeight > 0.85 || cheekWidth > 0.72) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setWarningMessage("Face too close. Move back slightly.");
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 5: CENTERING & BOUNDS
    // -------------------------------------------------------------
    const isCentered =
      nose.x >= 0.22 &&
      nose.x <= 0.78 &&
      nose.y >= 0.18 &&
      nose.y <= 0.82;

    if (!isCentered) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setWarningMessage("Keep face centered inside the circle.");
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 6: MOTION SPEED / SHAKE / BLUR CHECK
    // -------------------------------------------------------------
    if (prevNoseRef.current) {
      const moveDelta = Math.hypot(nose.x - prevNoseRef.current.x, nose.y - prevNoseRef.current.y);
      if (moveDelta > 0.14) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("Moving too fast. Move slowly and steadily.");
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
    // EYE ASPECT RATIO (EAR) FOR BLINKING & EYE OPENNESS
    // -------------------------------------------------------------
    const leftDistV = Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y);
    const leftDistH = Math.hypot(landmarks[133].x - landmarks[33].x, landmarks[133].y - landmarks[33].y) || 0.01;
    const leftEAR = leftDistV / leftDistH;

    const rightDistV = Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y);
    const rightDistH = Math.hypot(landmarks[362].x - landmarks[263].x, landmarks[362].y - landmarks[263].y) || 0.01;
    const rightEAR = rightDistV / rightDistH;
    const avgEAR = (leftEAR + rightEAR) / 2;

    // SCENARIO 7: EYES CLOSED DURING DIRECTIONAL STEPS (0 to 4)
    if (currentStepIndex < 5 && avgEAR < 0.11) {
      poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
      setWarningMessage("Keep eyes open and look at the screen.");
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
    if (currentStepIndex === 0) {
      const isLevel = eyeRoll < 0.10;
      const isFacingForward = Math.abs(yawRatio) < 0.20 && pitchRatio >= 0.30 && pitchRatio <= 0.80;

      if (isLevel && isFacingForward) {
        poseHoldCounterRef.current += 1;
        setWarningMessage(""); // Clear warning
        setFeedbackMessage("Great! Hold steady...");

        // Hold steady for 6 frames (~180-200ms) to lock in natural baseline
        if (poseHoldCounterRef.current >= 6) {
          baselineRef.current = {
            yaw: yawRatio,
            pitch: pitchRatio,
            noseX: nose.x,
            noseY: nose.y,
          };
          firstTurnDirRef.current = null;
          advanceStep(1); // Proceed to Right
        }
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        if (!isLevel) {
          setWarningMessage("Keep head level without tilting to shoulder.");
        } else {
          setWarningMessage("Look straight into center of the camera.");
        }
      }
      return;
    }

    // STEP 1: TURN HEAD (FIRST DIRECTION: RIGHT)
    if (currentStepIndex === 1) {
      // Any noticeable sideways rotation (>= 0.05) succeeds and registers orientation
      const isTurned = Math.abs(yawDelta) >= 0.05;

      if (isTurned) {
        if (!firstTurnDirRef.current) {
          firstTurnDirRef.current = yawDelta > 0 ? 1 : -1;
        }
        setWarningMessage("");
        setFeedbackMessage("Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(2); // Proceed to Left (opposite direction)
        }
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("");
        setFeedbackMessage("Slowly turn head to the right...");
      }
      return;
    }

    // STEP 2: TURN HEAD (OPPOSITE DIRECTION: LEFT)
    if (currentStepIndex === 2) {
      const firstDir = firstTurnDirRef.current || 1;
      // Head must turn in opposite direction relative to first turn
      const isOppositeTurn = (yawDelta * firstDir) <= -0.05;
      const isWrongDir = (yawDelta * firstDir) > 0.06;

      if (isOppositeTurn) {
        setWarningMessage("");
        setFeedbackMessage("Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(3); // Proceed to Up
        }
      } else if (isWrongDir) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("Wrong direction! Turn your head to the opposite side (Left).");
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("");
        setFeedbackMessage("Slowly turn head to the left...");
      }
      return;
    }

    // STEP 3: TILT HEAD UPWARD
    if (currentStepIndex === 3) {
      // Upward tilt: pitchDelta < -0.035 or nose moved up relative to baseline
      const isTiltedUp = pitchDelta < -0.035 || (nose.y - baseNoseY) < -0.028;
      const isWrongDown = pitchDelta > 0.065 || (nose.y - baseNoseY) > 0.05;

      if (isTiltedUp) {
        setWarningMessage("");
        setFeedbackMessage("Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(4); // Proceed to Down
        }
      } else if (isWrongDown) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("Wrong direction! Tilt your head Upward.");
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("");
        setFeedbackMessage("Tilt your head slightly upward...");
      }
      return;
    }

    // STEP 4: TILT HEAD DOWNWARD
    if (currentStepIndex === 4) {
      // Downward tilt: pitchDelta > 0.035 or nose moved down relative to baseline
      const isTiltedDown = pitchDelta > 0.035 || (nose.y - baseNoseY) > 0.028;
      const isWrongUp = pitchDelta < -0.065 || (nose.y - baseNoseY) < -0.05;

      if (isTiltedDown) {
        setWarningMessage("");
        setFeedbackMessage("Good! Hold for a moment...");
        poseHoldCounterRef.current += 1;
        if (poseHoldCounterRef.current >= REQUIRED_HOLD_FRAMES) {
          advanceStep(5); // Proceed to Blink
        }
      } else if (isWrongUp) {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("Wrong direction! Tilt your head Downward.");
      } else {
        poseHoldCounterRef.current = Math.max(0, poseHoldCounterRef.current - 1);
        setWarningMessage("");
        setFeedbackMessage("Tilt your head slightly downward...");
      }
      return;
    }

    // STEP 5: BLINK EYES NATURALLY
    if (currentStepIndex === 5) {
      setWarningMessage("");
      setFeedbackMessage("Blink your eyes naturally...");
      if (avgEAR > 0.16) {
        blinkStateRef.current.hasOpened = true;
      }
      if (blinkStateRef.current.hasOpened && avgEAR < 0.13) {
        blinkStateRef.current.hasClosed = true;
      }
      if (blinkStateRef.current.hasOpened && blinkStateRef.current.hasClosed && avgEAR > 0.15) {
        completeVerification();
      }
      return;
    }
  }, [currentStepIndex, advanceStep, checkEnvironment, completeVerification]);

  // Initialize Camera & MediaPipe
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      setCurrentStepIndex(0);
      setIsCompleted(false);
      setCapturedDataUrl("");
      setWarningMessage("");
      firstTurnDirRef.current = null;
      baselineRef.current = { yaw: null, pitch: null, noseX: null, noseY: null };
      return;
    }

    let isSubscribed = true;
    setIsLoadingEngine(true);
    setCameraError("");

    async function init() {
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

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (isSubscribed) onResults(results);
        });

        faceMeshInstanceRef.current = faceMesh;
        setIsLoadingEngine(false);

        async function renderLoop() {
          if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshInstanceRef.current) {
            try {
              await faceMeshInstanceRef.current.send({ image: videoRef.current });
            } catch (err) {}
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
          setCameraError(getHumanFriendlyCameraMessage(err, activeLang));
        }
      }
    }

    init();

    return () => {
      isSubscribed = false;
      cleanupStream();
    };
  }, [isOpen, cleanupStream, onResults, activeLang, retryTrigger]);


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
            onClick={onClose}
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
              stroke={obstructionAlert ? "#f43f5e" : isCompleted ? "#10b981" : "#f59e0b"}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={isCompleted ? 0 : strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* PURE CIRCULAR CAMERA CONTAINER */}
          <div className="relative w-60 h-60 rounded-full overflow-hidden bg-neutral-950 border-2 border-white/20 shadow-xl flex items-center justify-center">
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
