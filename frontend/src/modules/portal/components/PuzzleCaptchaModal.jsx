"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CheckIcon, RefreshCwIcon, ShieldCheckIcon, CloseIcon, ChevronRightIcon } from "@/modules/shared/Icons";

/**
 * Interactive Jigsaw Puzzle Slider CAPTCHA
 * Professional human verification component for architectural client onboarding.
 */
export default function PuzzleCaptchaModal({ isOpen, onClose, onSuccess, lang = "en" }) {
  const [sliderVal, setSliderVal] = useState(0);
  const [targetX, setTargetX] = useState(180);
  const [targetY, setTargetY] = useState(50);
  const [status, setStatus] = useState("idle"); // "idle" | "dragging" | "success" | "error"
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const bgCanvasRef = useRef(null);
  const pieceCanvasRef = useRef(null);
  const sliderTrackRef = useRef(null);
  const imageRef = useRef(null);
  const lastImageIdRef = useRef("");

  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 160;
  const PIECE_SIZE = 44;
  const TOLERANCE = 5; // Pixels tolerance for match

  // Initialize and randomize puzzle coordinates
  const initPuzzle = useCallback(() => {
    const randomX = Math.floor(Math.random() * (260 - 130 + 1)) + 130;
    const randomY = Math.floor(Math.random() * (95 - 25 + 1)) + 25;
    setTargetX(randomX);
    setTargetY(randomY);
    setSliderVal(0);
    setStatus("idle");
  }, []);

  // Helper to draw jigsaw puzzle contour
  const drawJigsawPath = (ctx, x, y, size) => {
    const r = size * 0.18; // Radius of jigsaw knobs
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Top edge with upward knob
    ctx.lineTo(x + size / 2 - r, y);
    ctx.arc(x + size / 2, y - r, r, 0, Math.PI, true);
    ctx.lineTo(x + size, y);

    // Right edge with outward knob
    ctx.lineTo(x + size, y + size / 2 - r);
    ctx.arc(x + size + r, y + size / 2, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(x + size, y + size);

    // Bottom edge with inward notch
    ctx.lineTo(x + size / 2 + r, y + size);
    ctx.arc(x + size / 2, y + size - r, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    ctx.lineTo(x, y + size);

    // Left edge with inward notch
    ctx.lineTo(x, y + size / 2 + r);
    ctx.arc(x - r, y + size / 2, r, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(x, y);

    ctx.closePath();
  };

  // Render canvas elements
  const renderCanvas = useCallback(() => {
    if (!imageRef.current || !bgCanvasRef.current || !pieceCanvasRef.current) return;

    const bgCanvas = bgCanvasRef.current;
    const pieceCanvas = pieceCanvasRef.current;
    const bgCtx = bgCanvas.getContext("2d");
    const pieceCtx = pieceCanvas.getContext("2d");
    const img = imageRef.current;

    // Clear canvases
    bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pieceCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw base architectural background
    bgCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw target slot silhouette
    bgCtx.save();
    drawJigsawPath(bgCtx, targetX, targetY, PIECE_SIZE);
    bgCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
    bgCtx.fill();
    bgCtx.lineWidth = 2;
    bgCtx.strokeStyle = "rgba(245, 158, 11, 0.9)";
    bgCtx.stroke();
    bgCtx.restore();

    // 3. Draw draggable jigsaw puzzle piece
    pieceCtx.save();
    drawJigsawPath(pieceCtx, sliderVal, targetY, PIECE_SIZE);
    pieceCtx.clip();

    pieceCtx.drawImage(
      img,
      targetX,
      targetY,
      PIECE_SIZE + 16,
      PIECE_SIZE + 16,
      sliderVal,
      targetY,
      PIECE_SIZE + 16,
      PIECE_SIZE + 16
    );

    pieceCtx.lineWidth = 2;
    pieceCtx.strokeStyle = "#ffffff";
    pieceCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
    pieceCtx.shadowBlur = 6;
    pieceCtx.stroke();
    pieceCtx.restore();
  }, [targetX, targetY, sliderVal]);

  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load a brand new random construction image from the API
  const loadRandomConstructionImage = useCallback(() => {
    setImageLoaded(false);
    setImageLoading(true);
    setImageError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    const cacheBuster = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const excludeParam = lastImageIdRef.current ? `&exclude=${encodeURIComponent(lastImageIdRef.current)}` : "";
    img.src = `/api/captcha/construction-image?r=${cacheBuster}${excludeParam}`;

    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setImageLoading(false);
      initPuzzle();
    };

    img.onerror = () => {
      // Graceful fallback to local project image
      const fallbackImg = new Image();
      fallbackImg.src = "/assets/modern_villa_thumb.jpg";
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setImageLoaded(true);
        setImageLoading(false);
        initPuzzle();
      };
      fallbackImg.onerror = () => {
        setImageLoading(false);
        setImageError(true);
      };
    };
  }, [initPuzzle]);

  useEffect(() => {
    if (!isOpen) return;
    loadRandomConstructionImage();
  }, [isOpen, loadRandomConstructionImage]);

  useEffect(() => {
    if (imageLoaded) {
      renderCanvas();
    }
  }, [imageLoaded, renderCanvas]);

  const handleStartDrag = (clientX) => {
    if (status === "success") return;
    setIsDragging(true);
    setDragStartX(clientX - sliderVal);
    setStatus("dragging");
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (clientX) => {
      const maxDrag = CANVAS_WIDTH - PIECE_SIZE;
      const newPos = Math.max(0, Math.min(clientX - dragStartX, maxDrag));
      setSliderVal(newPos);
    };

    const handleGlobalEnd = () => {
      setIsDragging(false);
      const diff = Math.abs(sliderVal - targetX);
      if (diff <= TOLERANCE) {
        setStatus("success");
        setSliderVal(targetX);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 700);
      } else {
        setStatus("error");
        setTimeout(() => {
          initPuzzle();
        }, 650);
      }
    };

    const onMouseMove = (e) => handleGlobalMove(e.clientX);
    const onMouseUp = () => handleGlobalEnd();
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleGlobalMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => handleGlobalEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, dragStartX, sliderVal, targetX, onSuccess, initPuzzle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-[360px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 overflow-hidden transition-transform duration-200 ${
          status === "error" ? "animate-shake border-red-500/60" : ""
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheckIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                {lang === "fil" ? "Beripikasyon sa Seguridad" : "Security Verification"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {lang === "fil" ? "I-slide ang piraso papunta sa puzzle slot" : "Slide the piece into the puzzle slot"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadRandomConstructionImage}
              title={lang === "fil" ? "Bagong larawan ng konstruksyon at i-reset" : "New construction photo & reset"}
              className="w-7 h-7 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${imageLoading ? "animate-spin text-amber-500" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="w-7 h-7 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Puzzle Visual Canvas Container */}
        <div className="relative w-[320px] h-[160px] mx-auto rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-neutral-950 select-none shadow-sm">
          <canvas
            ref={bgCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 block w-full h-full pointer-events-none"
          />

          <canvas
            ref={pieceCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 block w-full h-full pointer-events-none z-10"
          />

          {/* Loading Image Overlay */}
          {imageLoading && (
            <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-100">
              <RefreshCwIcon className="w-5 h-5 text-amber-500 animate-spin mb-1.5" />
              <span className="text-[11px] text-neutral-300 font-medium">
                {lang === "fil" ? "Naglo-load ng larawan..." : "Loading construction photo..."}
              </span>
            </div>
          )}

          {/* Success Overlay Badge */}
          {status === "success" && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md mb-1.5 text-neutral-950">
                <CheckIcon className="w-5 h-5 stroke-[2.8]" />
              </div>
              <span className="text-xs font-semibold tracking-wide">
                {lang === "fil" ? "Tagumpay ang Beripikasyon" : "Verification Success"}
              </span>
              <span className="text-[11px] text-neutral-300">
                {lang === "fil" ? "Pinoproseso ang rehistrasyon..." : "Processing registration..."}
              </span>
            </div>
          )}

          {/* Error Flash Badge */}
          {status === "error" && (
            <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-red-600/90 text-white text-xs text-center font-medium z-20 animate-in fade-in duration-100">
              {lang === "fil" ? "Hindi tumugma ang posisyon. Pakisubukan muli." : "Position did not match. Please try again."}
            </div>
          )}
        </div>

        {/* Instruction Caption */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-3 mb-2 select-none">
          {lang === "fil" ? "I-drag ang slider upang itapat ang piraso ng puzzle." : "Drag the slider to fit the puzzle piece."}
        </p>

        {/* Draggable Slider Track */}
        <div
          ref={sliderTrackRef}
          className={`relative h-11 rounded-xl border transition-colors select-none flex items-center px-1 overflow-hidden ${
            status === "success"
              ? "bg-emerald-500/10 border-emerald-500/40"
              : status === "error"
              ? "bg-red-500/10 border-red-500/30"
              : "bg-neutral-100 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700"
          }`}
        >
          {/* Track Progress Fill */}
          <div
            className={`absolute left-0 top-0 bottom-0 transition-all ${
              status === "success"
                ? "bg-emerald-500/25"
                : "bg-amber-500/20"
            }`}
            style={{ width: `${Math.max(sliderVal + 24, 0)}px` }}
          />

          {/* Centered Guide Text */}
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-medium tracking-wide transition-opacity pointer-events-none ${
              sliderVal > 15 ? "opacity-0" : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {lang === "fil" ? "I-slide upang makumpleto" : "Slide to complete"}
          </span>

          {/* Draggable Slider Thumb */}
          <button
            type="button"
            onMouseDown={(e) => handleStartDrag(e.clientX)}
            onTouchStart={(e) => handleStartDrag(e.touches[0].clientX)}
            style={{ transform: `translateX(${sliderVal}px)` }}
            className={`relative z-10 w-10 h-9 rounded-lg flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing transition-transform touch-none ${
              status === "success"
                ? "bg-emerald-500 text-neutral-950 font-bold"
                : "bg-amber-500 hover:bg-amber-600 text-neutral-950"
            }`}
          >
            {status === "success" ? (
              <CheckIcon className="w-4 h-4 stroke-[3]" />
            ) : (
              <div className="flex items-center -space-x-1.5">
                <ChevronRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <ChevronRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </button>
        </div>

        {/* Clean Footer */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
          <span>MCPA Client Portal</span>
          <span>{lang === "fil" ? "Beripikadong Access" : "Verified Access"}</span>
        </div>
      </div>
    </div>
  );
}
