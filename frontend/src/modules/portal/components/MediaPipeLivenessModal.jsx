"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CheckCircle2, RefreshCw, X, AlertCircle, Smile, Eye, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

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
    script.onerror = (err) => reject(new Error("Failed to load MediaPipe FaceMesh script from CDN"));
    document.head.appendChild(script);
  });

  return mediaPipeLoadPromise;
}

/**
 * LIVENESS CHALLENGE DEFINITIONS (GCASH FINTECH STYLE)
 */
const CHALLENGES = [
  {
    id: "center",
    fil: "Igitna ang iyong mukha sa oval",
    en: "Position your face inside the oval",
    subFil: "Manatiling nakatingin nang diretso sa camera",
    subEn: "Look straight into the camera lens",
    icon: ShieldCheck,
  },
  {
    id: "turn",
    fil: "Ilingon nang bahagya ang ulo (Pakanan o Pakaliwa)",
    en: "Turn your head slightly (Left or Right)",
    subFil: "Mabagal na igalaw ang ulo",
    subEn: "Slowly rotate your head to either side",
    icon: ArrowRight,
  },
  {
    id: "blink",
    fil: "Kumurap nang minsan o dalawang beses",
    en: "Blink your eyes naturally",
    subFil: "Ipihit at buksan ang iyong mga mata",
    subEn: "Close and open your eyes once",
    icon: Eye,
  },
  {
    id: "smile",
    fil: "Ngumiti nang maliwanag sa camera",
    en: "Give a natural smile at the camera",
    subFil: "Ipakita ang iyong masayang mukha",
    subEn: "Smile to complete the biometric check",
    icon: Smile,
  },
];

export default function MediaPipeLivenessModal({
  isOpen,
  onClose,
  onVerified,
  activeLang = "fil",
  purpose = "kyc", // "kyc" | "login"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshInstanceRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [isLoadingEngine, setIsLoadingEngine] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0: center, 1: turn, 2: blink, 3: smile, 4: complete
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState("");

  // Tracking state refs to detect deltas over time
  const blinkStateRef = useRef({ hasOpened: false, hasClosed: false, count: 0 });
  const headStateRef = useRef({ initialYaw: null, maxTurn: 0 });
  const centerHoldTimerRef = useRef(0);

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

    // Mirror image horizontally to match webcam display
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    return tempCanvas.toDataURL("image/jpeg", 0.92);
  }, []);

  // Advance challenge step
  const advanceStep = useCallback((nextStep) => {
    playStepChime();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(60);
    }
    setCurrentStepIndex(nextStep);
    blinkStateRef.current = { hasOpened: false, hasClosed: false, count: 0 };
    headStateRef.current = { initialYaw: null, maxTurn: 0 };
    centerHoldTimerRef.current = 0;
  }, []);

  // Process MediaPipe landmarks frame-by-frame
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If no face detected
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      setFeedbackMessage(activeLang === "fil" ? "Walang mukhang nakikita. Tumingin sa camera." : "No face detected. Look directly at camera.");
      return;
    }

    setFaceDetected(true);
    const landmarks = results.multiFaceLandmarks[0];

    // Optional subtle landmark overlay visualization (GCash cyan tracking dots)
    const drawLandmarks = [1, 33, 263, 61, 291, 199, 10, 152];
    ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
    drawLandmarks.forEach((idx) => {
      const lm = landmarks[idx];
      if (lm) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // 1. Calculations: Face Centeredness & Size
    const nose = landmarks[1];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const faceHeight = Math.abs(chin.y - forehead.y);
    const isCentered = nose.x >= 0.32 && nose.x <= 0.68 && nose.y >= 0.30 && nose.y <= 0.70 && faceHeight >= 0.22;

    // 2. Calculations: Head Yaw (Turn angle)
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.1;
    const yawRatio = (nose.x - cheekMidX) / cheekWidth;

    // 3. Calculations: Eye Aspect Ratio (EAR for Blinking)
    const leftDistV = Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y);
    const leftDistH = Math.hypot(landmarks[133].x - landmarks[33].x, landmarks[133].y - landmarks[33].y) || 0.01;
    const leftEAR = leftDistV / leftDistH;

    const rightDistV = Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y);
    const rightDistH = Math.hypot(landmarks[362].x - landmarks[263].x, landmarks[362].y - landmarks[263].y) || 0.01;
    const rightEAR = rightDistV / rightDistH;
    const avgEAR = (leftEAR + rightEAR) / 2;

    // 4. Calculations: Smile Ratio (Mouth Width / Eye Distance)
    const mouthWidth = Math.hypot(landmarks[291].x - landmarks[61].x, landmarks[291].y - landmarks[61].y);
    const eyeDist = Math.hypot(landmarks[263].x - landmarks[33].x, landmarks[263].y - landmarks[33].y) || 0.01;
    const smileRatio = mouthWidth / eyeDist;

    // STEP EVALUATION ENGINE
    if (currentStepIndex === 0) {
      // Step 0: Center Face Challenge
      if (isCentered) {
        centerHoldTimerRef.current += 1;
        setFeedbackMessage(activeLang === "fil" ? "Perpekto! Manatiling steady..." : "Great! Hold steady...");
        if (centerHoldTimerRef.current >= 12) { // ~0.4s hold
          advanceStep(1);
        }
      } else {
        centerHoldTimerRef.current = 0;
        setFeedbackMessage(activeLang === "fil" ? "Igitna ang mukha at lumapit nang bahagya" : "Center your face inside the oval frame");
      }
    } else if (currentStepIndex === 1) {
      // Step 1: Head Turn Challenge
      setFeedbackMessage(activeLang === "fil" ? "Ilingon ang ulo pakanan o pakaliwa" : "Turn your head to the left or right");
      const turnAmount = Math.abs(yawRatio);
      if (turnAmount > 0.11) {
        advanceStep(2);
      }
    } else if (currentStepIndex === 2) {
      // Step 2: Blink Challenge
      setFeedbackMessage(activeLang === "fil" ? "Kumurap ng iyong mga mata" : "Blink your eyes naturally");
      if (avgEAR > 0.22) {
        blinkStateRef.current.hasOpened = true;
      }
      if (blinkStateRef.current.hasOpened && avgEAR < 0.15) {
        blinkStateRef.current.hasClosed = true;
      }
      if (blinkStateRef.current.hasOpened && blinkStateRef.current.hasClosed && avgEAR > 0.20) {
        advanceStep(3);
      }
    } else if (currentStepIndex === 3) {
      // Step 3: Smile Challenge
      setFeedbackMessage(activeLang === "fil" ? "Ngumiti sa camera!" : "Smile at the camera!");
      if (smileRatio > 0.81) {
        // Complete verification!
        playSuccessFanfare();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([80, 60, 140]);
        }
        setIsCompleted(true);
        setCurrentStepIndex(4);
        const snapshot = captureFrame();
        setCapturedDataUrl(snapshot);

        // Auto dispatch success after brief celebration
        setTimeout(() => {
          if (onVerified && snapshot) {
            onVerified(snapshot);
          }
        }, 1100);
      }
    }
  }, [currentStepIndex, activeLang, advanceStep, captureFrame, onVerified]);

  // Initialize Camera & MediaPipe
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      setCurrentStepIndex(0);
      setIsCompleted(false);
      setCapturedDataUrl("");
      return;
    }

    let isSubscribed = true;
    setIsLoadingEngine(true);
    setCameraError("");

    async function init() {
      try {
        // 1. Start Camera
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

        // 2. Load MediaPipe FaceMesh from CDN
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

        // 3. Start processing loop via requestAnimationFrame
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
        console.error("[MediaPipeLivenessModal] Initialization Error:", err);
        if (isSubscribed) {
          setIsLoadingEngine(false);
          setCameraError(
            err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
              ? (activeLang === "fil"
                  ? "Kailangan ng pahintulot sa camera. Pakibuksan ang camera access sa iyong browser settings."
                  : "Camera permission denied. Please allow camera access in your browser settings.")
              : (activeLang === "fil"
                  ? "Hindi mabuksan ang camera o MediaPipe engine: " + err.message
                  : "Unable to start camera or AI vision engine: " + err.message)
          );
        }
      }
    }

    init();

    return () => {
      isSubscribed = false;
      cleanupStream();
    };
  }, [isOpen, cleanupStream, onResults, activeLang]);

  // Handle manual fallback capture if needed
  const handleManualFallback = () => {
    const shot = captureFrame();
    if (shot && onVerified) {
      playSuccessFanfare();
      setCapturedDataUrl(shot);
      setIsCompleted(true);
      setTimeout(() => {
        onVerified(shot);
      }, 700);
    }
  };

  if (!isOpen) return null;

  // Percentage calculation for progress ring
  const progressPercent = Math.min(100, currentStepIndex * 25);
  const circumference = 2 * Math.PI * 138; // Radius of 138 for 300x380 oval progress ring
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const currentChallenge = CHALLENGES[Math.min(currentStepIndex, CHALLENGES.length - 1)];
  const ChallengeIcon = currentChallenge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[430px] rounded-3xl bg-[#0e1118] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center p-5 text-white">
        
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                {activeLang === "fil" ? "Google MediaPipe Liveness" : "Active Face Liveness Verification"}
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono">
                {purpose === "login"
                  ? (activeLang === "fil" ? "Biometric 1-Click Login" : "Biometric Face Login")
                  : (activeLang === "fil" ? "GCash-Standard Identity KYC" : "Fintech Biometric KYC")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport with Circular/Oval Progress Ring */}
        <div className="relative my-4 flex items-center justify-center">
          {/* SVG Progress Ring surrounding the Oval */}
          <svg className="absolute w-[304px] h-[374px] pointer-events-none -rotate-90">
            {/* Background Track */}
            <ellipse
              cx="152"
              cy="187"
              rx="136"
              ry="168"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="5"
            />
            {/* Active Progress Arc */}
            <ellipse
              cx="152"
              cy="187"
              rx="136"
              ry="168"
              fill="none"
              stroke={isCompleted ? "#10b981" : "#f59e0b"}
              strokeWidth="5"
              strokeDasharray="960"
              strokeDashoffset={isCompleted ? "0" : `${960 - (960 * progressPercent) / 100}`}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Oval Cutout Video Viewport */}
          <div className="relative w-[260px] h-[330px] rounded-[130px] overflow-hidden bg-neutral-900 border-2 border-white/20 shadow-2xl flex items-center justify-center">
            {/* Hidden canvas for MediaPipe calculations */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none z-10"
            />

            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Loading Spinner */}
            {isLoadingEngine && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                <p className="text-xs font-semibold text-neutral-200">
                  {activeLang === "fil" ? "Inihahanda ang AI Face Mesh..." : "Initializing MediaPipe Vision..."}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">468 3D Landmarks Engine</p>
              </div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-4 text-center z-20">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <p className="text-xs text-rose-300 leading-snug">{cameraError}</p>
              </div>
            )}

            {/* Completed Celebration Overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h5 className="text-sm font-bold text-emerald-200">
                  {activeLang === "fil" ? "Pagpapatunay Matagumpay!" : "Liveness Verified!"}
                </h5>
                <p className="text-[11px] text-emerald-300/80 mt-0.5 font-mono">
                  {activeLang === "fil" ? "Kuhang litrato ay na-record." : "Biometric frame captured."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Challenge Indicator Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-1.5">
            <ChallengeIcon className="w-3.5 h-3.5" />
            <span>
              {activeLang === "fil" ? `Hakbang ${currentStepIndex + 1} sa 4` : `Step ${currentStepIndex + 1} of 4`}
            </span>
            <span className="opacity-40">•</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {activeLang === "fil" ? currentChallenge.fil : currentChallenge.en}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {feedbackMessage || (activeLang === "fil" ? currentChallenge.subFil : currentChallenge.subEn)}
          </p>

          {/* Fallback Manual Snapshot (if user has difficult lighting or slow device) */}
          <div className="mt-3 pt-2 border-t border-white/10 w-full flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">
              {activeLang === "fil" ? "Mabagal o madilim?" : "Dim light?"}
            </span>
            <button
              type="button"
              onClick={handleManualFallback}
              className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              {activeLang === "fil" ? "Kumuha ng litrato manu-mano" : "Capture photo manually"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
