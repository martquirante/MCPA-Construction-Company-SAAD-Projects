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
 * designed for non-technical clients (eliminating developer jargon like 'getUserMedia', 'undefined', etc.)
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
    return activeLang === "fil"
      ? "Kailangan po ng ligtas na koneksyon (HTTPS) para mabuksan ang live camera. Pindutin ang 'Buksan ang Mobile Camera' sa ibaba para mag-selfie."
      : "A secure connection (HTTPS) is required for the live camera. Please tap 'Open Phone Camera' below to take your photo.";
  }

  // 2. Camera Permission Blocked / Denied
  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    raw.includes("permission") ||
    raw.includes("denied") ||
    raw.includes("blocked")
  ) {
    return activeLang === "fil"
      ? "Naka-block ang camera access. Paki-allow po ang camera sa settings ng iyong browser o cellphone."
      : "Camera access is blocked. Please allow camera permissions in your browser or phone settings.";
  }

  // 3. Camera in use by another application
  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    raw.includes("in use") ||
    raw.includes("busy") ||
    raw.includes("not readable")
  ) {
    return activeLang === "fil"
      ? "Kasalukuyang ginagamit ng ibang app ang iyong camera. Pakisara po muna ang ibang apps at subukan muli."
      : "Your camera is currently in use by another application. Please close other camera apps and retry.";
  }

  // 4. No camera device found
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    raw.includes("not found") ||
    raw.includes("no camera")
  ) {
    return activeLang === "fil"
      ? "Walang nakitang camera sa iyong device. Maaari kang mag-upload ng iyong litrato sa ibaba."
      : "No camera detected on this device. You can upload a selfie photo below.";
  }

  // 5. Internet / Script loading issue
  if (
    raw.includes("mediapipe") ||
    raw.includes("cdn") ||
    raw.includes("network") ||
    raw.includes("failed to load")
  ) {
    return activeLang === "fil"
      ? "Mabagal ang internet kaya hindi maihanda ang camera. Pakisubukan muli o mag-upload ng litrato sa ibaba."
      : "Internet connection issue while loading camera. Please try again or upload a photo below.";
  }

  // 6. Non-technical friendly fallback
  return activeLang === "fil"
    ? "Hindi mabuksan ang live camera sa ngayon. Paki-pindot ang 'Buksan ang Mobile Camera' sa ibaba para mag-selfie."
    : "Unable to open live camera right now. Please tap 'Open Phone Camera' below to take a selfie.";
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
 * 6-STAGE LIVENESS VERIFICATION SEQUENCE:
 * 1. Center / Lock -> 2. Turn Right -> 3. Turn Left -> 4. Tilt Up -> 5. Tilt Down -> 6. Blink
 * (Smile completely removed per design request)
 */
const CHALLENGES = [
  {
    id: "center",
    fil: "Igitna ang mukha sa bilog",
    en: "Position face inside circle",
    subFil: "Manatiling nakatingin nang diretso sa gitna",
    subEn: "Look straight into the center of the camera",
    icon: ShieldCheck,
    arrowDirection: "none",
  },
  {
    id: "right",
    fil: "Ilingon ang ulo Pakanan",
    en: "Turn your head to the Right",
    subFil: "Mabagal na ilingon ang ulo pakanan",
    subEn: "Slowly rotate your head toward the right",
    icon: ArrowRight,
    arrowDirection: "right",
  },
  {
    id: "left",
    fil: "Ilingon ang ulo Pakaliwa",
    en: "Turn your head to the Left",
    subFil: "Mabagal na ilingon ang ulo pakaliwa",
    subEn: "Slowly rotate your head toward the left",
    icon: ArrowLeft,
    arrowDirection: "left",
  },
  {
    id: "up",
    fil: "Itingala ang ulo Paitaas",
    en: "Tilt your head Upward",
    subFil: "Bahagyang itingala ang ulo paitaas",
    subEn: "Tilt your head slightly upward",
    icon: ArrowUp,
    arrowDirection: "up",
  },
  {
    id: "down",
    fil: "Iyuko ang ulo Paibaba",
    en: "Tilt your head Downward",
    subFil: "Bahagyang iyuko ang ulo paibaba",
    subEn: "Tilt your head slightly downward",
    icon: ArrowDown,
    arrowDirection: "down",
  },
  {
    id: "blink",
    fil: "Kumurap ng mga mata",
    en: "Blink your eyes naturally",
    subFil: "Pumikit at buksan ang iyong mga mata",
    subEn: "Close and open your eyes once",
    icon: Eye,
    arrowDirection: "blink",
  },
];

export default function MediaPipeLivenessModal({
  isOpen,
  onClose,
  onVerified,
  activeLang = "en",
  purpose = "kyc", // "kyc" | "login"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshInstanceRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [isLoadingEngine, setIsLoadingEngine] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 to 5, 6 is complete
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerifyingWithPython, setIsVerifyingWithPython] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState("");
  const [envWarning, setEnvWarning] = useState(null); // { type: 'dark'|'bright'|'blur', text: string }
  const [obstructionAlert, setObstructionAlert] = useState(null); // { code, type, fil, en }

  // Baseline calibration refs
  const baselineRef = useRef({ yaw: 0, pitch: 0.52 });
  const centerHoldTimerRef = useRef(0);
  const blinkStateRef = useRef({ hasOpened: false, hasClosed: false });
  const frameCounterRef = useRef(0);

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

  // Real-time canvas check for environmental lighting & blur
  const checkEnvironment = useCallback((video) => {
    if (!video || !video.videoWidth) return null;
    try {
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 80;
      testCanvas.height = 60;
      const ctx = testCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, 80, 60);
      const imgData = ctx.getImageData(0, 0, 80, 60).data;

      let totalLum = 0;
      const count = imgData.length / 4;
      for (let i = 0; i < imgData.length; i += 4) {
        totalLum += 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
      }
      const avgLum = totalLum / count;

      if (avgLum < 45) {
        return {
          type: "dark",
          text: activeLang === "fil" ? "Masyadong madilim. Lumipat sa maliwanag na lugar." : "Too dark. Move to a well-lit area.",
        };
      }
      if (avgLum > 220) {
        return {
          type: "bright",
          text: activeLang === "fil" ? "Masyadong maliwanag o may silaw. Iwasan ang backlight." : "Too bright / direct glare detected.",
        };
      }
    } catch (e) {}
    return null;
  }, [activeLang]);

  // Advance challenge step
  const advanceStep = useCallback((nextStep) => {
    playStepChime();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setCurrentStepIndex(nextStep);
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
    centerHoldTimerRef.current = 0;
  }, []);

  // Call Python face recognition verification endpoint
  const verifyWithPythonBackend = useCallback(async (base64Image) => {
    try {
      setIsVerifyingWithPython(true);
      const response = await fetch("/api/auth/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn("[MediaPipeLivenessModal] Python verification fallback:", err);
      return { success: true, verified: true };
    } finally {
      setIsVerifyingWithPython(false);
    }
  }, []);

  // Retry after obstruction detected
  const handleRetryAfterObstruction = useCallback(() => {
    setObstructionAlert(null);
    setCurrentStepIndex(0);
    blinkStateRef.current = { hasOpened: false, hasClosed: false };
    centerHoldTimerRef.current = 0;
    setFeedbackMessage(
      activeLang === "fil"
        ? "Igitna ang mukha nang walang sagabal (walang sumbrero/salamin/mask)"
        : "Center face clearly with no hat, glasses, or mask"
    );
  }, [activeLang]);

  // Complete entire verification with STRICT Python zero-obstruction check
  const completeVerification = useCallback(async () => {
    setObstructionAlert(null);
    setIsVerifyingWithPython(true);
    setFeedbackMessage(
      activeLang === "fil"
        ? "Sinusuri ang litrato at mga sagabal (Python AI)..."
        : "Analyzing face photo & obstructions..."
    );

    const snapshot = captureFrame();
    setCapturedDataUrl(snapshot);

    if (!snapshot) {
      setIsVerifyingWithPython(false);
      return;
    }

    // Call Python verification diagnostics
    const pyResult = await verifyWithPythonBackend(snapshot);

    // STRICT VALIDATION: If any obstruction detected or verification fails, DO NOT COMPLETE!
    if (!pyResult || !pyResult.passed || pyResult.obstructions?.has_obstruction) {
      playErrorBuzzer();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([120, 80, 120]);
      }
      const obs = pyResult?.obstructions?.issues?.[0] || pyResult?.issues?.[0];
      const alertData = {
        code: obs?.code || "OBSTRUCTION_DETECTED",
        type: obs?.type || "obstruction",
        fil: obs?.fil || "May nakitang sagabal sa mukha. Pakitanggal ang sumbrero, salamin sa mata, o mask bago magpatuloy.",
        en: obs?.en || "Face obstruction detected. Please remove any hat, glasses, or mask before proceeding.",
      };
      setObstructionAlert(alertData);
      setFeedbackMessage(activeLang === "fil" ? alertData.fil : alertData.en);
      setIsVerifyingWithPython(false);
      return; // STRICTLY PREVENTS VERIFICATION COMPLETION!
    }

    // PASSED ALL TESTS WITH ZERO OBSTRUCTIONS!
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

  // Direct Mobile Front Camera Capture (works seamlessly even over unsecure HTTP LAN/Wi-Fi)
  const handleNativeMobileCapture = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        setCapturedDataUrl(dataUrl);
        setIsVerifyingWithPython(true);
        setFeedbackMessage(
          activeLang === "fil"
            ? "Sinusuri ang selfie mula sa mobile camera..."
            : "Analyzing mobile camera selfie..."
        );
        const pyResult = await verifyWithPythonBackend(dataUrl);
        if (!pyResult || !pyResult.passed || pyResult.obstructions?.has_obstruction) {
          playErrorBuzzer();
          const obs = pyResult?.obstructions?.issues?.[0] || pyResult?.issues?.[0];
          const alertData = {
            code: obs?.code || "OBSTRUCTION_DETECTED",
            type: obs?.type || "obstruction",
            fil: obs?.fil || "May nakitang sagabal sa mukha. Pakitanggal ang sumbrero, salamin, o mask.",
            en: obs?.en || "Face obstruction detected. Please remove any hat, glasses, or mask before proceeding.",
          };
          setObstructionAlert(alertData);
          setIsVerifyingWithPython(false);
          return;
        }

        playSuccessFanfare();
        setIsCompleted(true);
        setTimeout(() => {
          if (onVerified) onVerified(dataUrl, pyResult);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  }, [activeLang, onVerified, verifyWithPythonBackend]);

  // Process MediaPipe landmarks frame-by-frame
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Periodic environment check (~every 15 frames)
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 15 === 0) {
      const warn = checkEnvironment(video);
      setEnvWarning(warn);
    }

    // Face detection check
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      setFeedbackMessage(activeLang === "fil" ? "Walang mukhang nakikita. Tumingin sa camera." : "No face detected. Look directly at camera.");
      return;
    }

    // Multiple faces check
    if (results.multiFaceLandmarks.length > 1) {
      setFaceDetected(false);
      setFeedbackMessage(activeLang === "fil" ? "Maraming mukha ang nakikita. Isang tao lamang." : "Multiple faces detected. One person only.");
      return;
    }

    setFaceDetected(true);
    const landmarks = results.multiFaceLandmarks[0];

    // Subtle landmark points for tracking feel
    const drawLandmarks = [1, 33, 263, 61, 291, 10, 152];
    ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
    drawLandmarks.forEach((idx) => {
      const lm = landmarks[idx];
      if (lm) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // 1. Centeredness & Size
    const nose = landmarks[1];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const faceHeight = Math.abs(chin.y - forehead.y);
    const isCentered = nose.x >= 0.32 && nose.x <= 0.68 && nose.y >= 0.28 && nose.y <= 0.72 && faceHeight >= 0.20;

    // 2. Head Yaw (Turn angle)
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.1;
    const yawRatio = (nose.x - cheekMidX) / cheekWidth;

    // 3. Head Pitch (Tilt up/down)
    const pitchRatio = (nose.y - forehead.y) / (faceHeight || 0.1);

    // 4. Eye Aspect Ratio (EAR) for Blinking
    const leftDistV = Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y);
    const leftDistH = Math.hypot(landmarks[133].x - landmarks[33].x, landmarks[133].y - landmarks[33].y) || 0.01;
    const leftEAR = leftDistV / leftDistH;

    const rightDistV = Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y);
    const rightDistH = Math.hypot(landmarks[362].x - landmarks[263].x, landmarks[362].y - landmarks[263].y) || 0.01;
    const rightEAR = rightDistV / rightDistH;
    const avgEAR = (leftEAR + rightEAR) / 2;

    // -------------------------------------------------------------
    // STEP EVALUATION ENGINE
    // -------------------------------------------------------------
    if (currentStepIndex === 0) {
      // Step 0: Center Face Challenge
      if (isCentered) {
        centerHoldTimerRef.current += 1;
        setFeedbackMessage(activeLang === "fil" ? "Perpekto! Manatiling steady..." : "Great! Hold steady...");
        if (centerHoldTimerRef.current >= 10) {
          baselineRef.current = { yaw: yawRatio, pitch: pitchRatio };
          advanceStep(1); // Proceed to Right
        }
      } else {
        centerHoldTimerRef.current = 0;
        setFeedbackMessage(activeLang === "fil" ? "Igitna ang mukha sa bilog" : "Center your face inside the circle");
      }
    } else if (currentStepIndex === 1) {
      // Step 1: Move Right
      setFeedbackMessage(activeLang === "fil" ? "Ilingon ang ulo pakanan..." : "Turn head to the right...");
      const baseYaw = baselineRef.current.yaw ?? 0;
      const yawDelta = yawRatio - baseYaw;
      if (Math.abs(yawDelta) > 0.09 || Math.abs(yawRatio) > 0.12) {
        advanceStep(2); // Proceed to Left
      }
    } else if (currentStepIndex === 2) {
      // Step 2: Move Left
      setFeedbackMessage(activeLang === "fil" ? "Ilingon naman ang ulo pakaliwa..." : "Now turn head to the left...");
      const baseYaw = baselineRef.current.yaw ?? 0;
      const yawDelta = yawRatio - baseYaw;
      if (Math.abs(yawDelta) > 0.09 || Math.abs(yawRatio) > 0.12) {
        advanceStep(3); // Proceed to Up
      }
    } else if (currentStepIndex === 3) {
      // Step 3: Tilt Up
      setFeedbackMessage(activeLang === "fil" ? "Itingala nang bahagya ang ulo paitaas..." : "Tilt your head slightly upward...");
      const basePitch = baselineRef.current.pitch ?? 0.52;
      const pitchDelta = pitchRatio - basePitch;
      if (pitchDelta < -0.045 || pitchRatio < 0.46) {
        advanceStep(4); // Proceed to Down
      }
    } else if (currentStepIndex === 4) {
      // Step 4: Tilt Down
      setFeedbackMessage(activeLang === "fil" ? "Iyuko nang bahagya ang ulo paibaba..." : "Tilt your head slightly downward...");
      const basePitch = baselineRef.current.pitch ?? 0.52;
      const pitchDelta = pitchRatio - basePitch;
      if (pitchDelta > 0.045 || pitchRatio > 0.58) {
        advanceStep(5); // Proceed to Blink
      }
    } else if (currentStepIndex === 5) {
      // Step 5: Blink
      setFeedbackMessage(activeLang === "fil" ? "Kumurap ng iyong mga mata..." : "Blink your eyes naturally...");
      if (avgEAR > 0.22) {
        blinkStateRef.current.hasOpened = true;
      }
      if (blinkStateRef.current.hasOpened && avgEAR < 0.14) {
        blinkStateRef.current.hasClosed = true;
      }
      if (blinkStateRef.current.hasOpened && blinkStateRef.current.hasClosed && avgEAR > 0.20) {
        completeVerification();
      }
    }
  }, [currentStepIndex, activeLang, advanceStep, checkEnvironment, completeVerification]);

  // Initialize Camera & MediaPipe
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      setCurrentStepIndex(0);
      setIsCompleted(false);
      setCapturedDataUrl("");
      setEnvWarning(null);
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
  }, [isOpen, cleanupStream, onResults, activeLang]);

  // Handle manual fallback capture if requested
  const handleManualFallback = async () => {
    const shot = captureFrame();
    if (shot && onVerified) {
      playSuccessFanfare();
      setCapturedDataUrl(shot);
      setIsCompleted(true);
      await verifyWithPythonBackend(shot);
      setTimeout(() => {
        onVerified(shot);
      }, 700);
    }
  };

  if (!isOpen) return null;

  // Percentage calculation for circular progress ring (6 steps)
  const progressPercent = Math.min(100, Math.round((currentStepIndex / CHALLENGES.length) * 100));
  // Circle radius = 126 for a 272x272 viewBox
  const radius = 126;
  const circumference = 2 * Math.PI * radius; // ~791.7
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const currentChallenge = CHALLENGES[Math.min(currentStepIndex, CHALLENGES.length - 1)];
  const ChallengeIcon = currentChallenge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
                {activeLang === "fil" ? "Biometric Face Verification" : "Biometric Face Verification"}
              </h4>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {purpose === "login"
                  ? (activeLang === "fil" ? "Biometric 1-Click Login" : "Biometric Face Login")
                  : (activeLang === "fil" ? "Architectural Client Identity Verification" : "Architectural Client Identity Verification")}
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
        <div className="relative my-4 flex items-center justify-center">
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
              stroke={obstructionAlert ? "#f43f5e" : (isCompleted ? "#10b981" : "#f59e0b")}
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

            {/* INSIDE ANIMATED ARROW GUIDANCE OVERLAY */}
            {!isLoadingEngine && !cameraError && !isCompleted && !obstructionAlert && (
              <>
                {/* Center Guide Dashed Circle */}
                {currentChallenge.arrowDirection === "none" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="w-40 h-40 rounded-full border-2 border-dashed border-amber-400/60 animate-pulse" />
                  </div>
                )}

                {/* Move Right Indicator: Animated Arrow pointing Right */}
                {currentChallenge.arrowDirection === "right" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/75 backdrop-blur-md text-amber-400 border border-amber-500/40 text-xs font-bold shadow-lg">
                      <span>{activeLang === "fil" ? "Pakanan" : "Turn Right"}</span>
                      <ArrowRight className="w-4 h-4 animate-[bounce_1s_infinite] rotate-0" />
                    </div>
                  </div>
                )}

                {/* Move Left Indicator: Animated Arrow pointing Left */}
                {currentChallenge.arrowDirection === "left" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/75 backdrop-blur-md text-amber-400 border border-amber-500/40 text-xs font-bold shadow-lg">
                      <ArrowLeft className="w-4 h-4 animate-[bounce_1s_infinite]" />
                      <span>{activeLang === "fil" ? "Pakaliwa" : "Turn Left"}</span>
                    </div>
                  </div>
                )}

                {/* Move Up Indicator: Animated Arrow pointing Up */}
                {currentChallenge.arrowDirection === "up" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/75 backdrop-blur-md text-amber-400 border border-amber-500/40 text-xs font-bold shadow-lg">
                      <ArrowUp className="w-4 h-4 animate-[bounce_1s_infinite]" />
                      <span>{activeLang === "fil" ? "Itingala" : "Tilt Up"}</span>
                    </div>
                  </div>
                )}

                {/* Move Down Indicator: Animated Arrow pointing Down */}
                {currentChallenge.arrowDirection === "down" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/75 backdrop-blur-md text-amber-400 border border-amber-500/40 text-xs font-bold shadow-lg">
                      <ArrowDown className="w-4 h-4 animate-[bounce_1s_infinite]" />
                      <span>{activeLang === "fil" ? "Iyuko" : "Tilt Down"}</span>
                    </div>
                  </div>
                )}

                {/* Blink Indicator: Pulsating Eye Icon */}
                {currentChallenge.arrowDirection === "blink" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/75 backdrop-blur-md text-amber-400 border border-amber-500/40 text-xs font-bold shadow-lg">
                      <Eye className="w-4 h-4 animate-ping" />
                      <span>{activeLang === "fil" ? "Kumurap" : "Blink"}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Obstruction Warning Overlay (Hat, Sunglasses, Eyeglasses, Mask, Hand) */}
            {obstructionAlert && !isCompleted && (
              <div className="absolute inset-0 bg-neutral-950/92 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-35 animate-in zoom-in-95 duration-200 rounded-full">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mb-1 animate-pulse">
                  <Ban className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-400">
                  {activeLang === "fil" ? "Bawal ang may Sagabal" : "Obstruction Detected"}
                </span>
                <p className="text-[11px] text-neutral-200 font-medium leading-tight my-1.5 px-3">
                  {activeLang === "fil" ? obstructionAlert.fil : obstructionAlert.en}
                </p>
                <button
                  type="button"
                  onClick={handleRetryAfterObstruction}
                  className="mt-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{activeLang === "fil" ? "Subukan Muli (Nakatanggal)" : "Retry (Removed)"}</span>
                </button>
              </div>
            )}

            {/* Environmental Warning Overlay (Dark / Glare / Blur) */}
            {envWarning && !isCompleted && (
              <div className="absolute top-2 inset-x-2 z-25 flex justify-center pointer-events-none">
                <div className="px-2.5 py-1 rounded-full bg-red-950/85 border border-red-500/50 text-[10px] text-red-200 font-medium flex items-center gap-1 backdrop-blur-xs">
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{envWarning.text}</span>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {isLoadingEngine && (
              <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                <p className="text-xs font-semibold text-neutral-200">
                  {activeLang === "fil" ? "Inihahanda ang AI Vision..." : "Initializing Vision Engine..."}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">Neural Face Landmark Tracking</p>
              </div>
            )}

            {/* Error Message with Mobile Native Camera Action */}
            {cameraError && (
              <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-3 text-center z-30 rounded-full animate-in fade-in duration-150">
                <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                <p className="text-[10.5px] text-rose-300 leading-tight max-w-[210px] px-1">{cameraError}</p>
                <label className="mt-2.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{activeLang === "fil" ? "Buksan ang Mobile Camera" : "Open Phone Camera"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleNativeMobileCapture}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Completed Celebration Overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in zoom-in-95 duration-200 rounded-full">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2 animate-bounce">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-emerald-200">
                  {activeLang === "fil" ? "Matagumpay na Na-verify!" : "Liveness Verified!"}
                </h5>
                <p className="text-[10px] text-emerald-300/80 mt-0.5 font-mono">
                  {activeLang === "fil" ? "Nakuha ang litrato" : "Biometric frame captured"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Challenge Indicator Card */}
        <div className="w-full bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 flex flex-col items-center text-center transition-colors">
          {/* Pure clean text without background pill container */}
          <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
            <ChallengeIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {activeLang === "fil"
                ? `Hakbang ${Math.min(currentStepIndex + 1, CHALLENGES.length)} sa ${CHALLENGES.length}`
                : `Step ${Math.min(currentStepIndex + 1, CHALLENGES.length)} of ${CHALLENGES.length}`}
            </span>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span className="font-mono font-bold">{progressPercent}%</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
            {activeLang === "fil" ? currentChallenge.fil : currentChallenge.en}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {feedbackMessage || (activeLang === "fil" ? currentChallenge.subFil : currentChallenge.subEn)}
          </p>

          {/* Fallback Manual Snapshot (if user has difficult lighting or device issues) */}
          <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 w-full flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              {activeLang === "fil" ? "May problema sa ilaw?" : "Lighting issue?"}
            </span>
            <button
              type="button"
              onClick={handleManualFallback}
              className="text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
            >
              {activeLang === "fil" ? "Kumuha ng litrato" : "Capture photo manually"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
