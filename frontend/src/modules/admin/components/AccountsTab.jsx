"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { authFetch } from "@/modules/shared/authFetch";
import { UserPlusIcon, RadioIcon, SparklesIcon } from "lucide-react";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ExternalLinkIcon,
  SearchIcon,
  CloseIcon,
  CheckIcon,
  ShieldCheckIcon,
  GlobeIcon,
  RefreshCwIcon,
  ClipboardListIcon,
  PlaneIcon,
  LayoutGridIcon,
  ListIcon,
  BadgeCheckIcon,
  FingerprintIcon,
  IdCardIcon,
  UsersIcon,
  HashIcon,
  CalendarDaysIcon,
  MessageSquareIcon,
  CameraIcon,
  BuildingIcon,
  UserIcon,
  LockIcon,
  CopyIcon,
  Maximize2Icon,
  GoogleIcon,
  FacebookIcon,
} from "@/modules/shared/Icons";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function getAvatarGradient(name = "") {
  const palettes = [
    ["#d97706", "#b45309"], // architectural amber/brass
    ["#2563eb", "#1d4ed8"], // slate blue
    ["#059669", "#047857"], // forest emerald
    ["#7c3aed", "#6d28d9"], // royal indigo
    ["#475569", "#334155"], // graphite
    ["#ea580c", "#c2410c"], // terracotta
    ["#0891b2", "#0e7490"], // deep teal
    ["#4f46e5", "#4338ca"], // stone blue
  ];
  const idx = (name || "Client").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palettes.length;
  return palettes[idx];
}

function getInitials(name = "") {
  if (!name) return "CL";
  const clean = name.replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })} at ${d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } catch {
    return "—";
  }
}

function computeAge(birthDateStr) {
  if (!birthDateStr) return null;
  const b = new Date(birthDateStr);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

// ─── Data Row Component for Structured Dossier ────────────────────────────────
function DataField({ label, value, sub, badge, icon, highlight = false, href, target = "_blank" }) {
  const displayVal = value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : "—";
  const isMuted = displayVal === "—";

  return (
    <div className={`data-field ${highlight ? "highlight" : ""}`}>
      <div className="data-field-header">
        {icon && <span className="data-field-icon">{icon}</span>}
        <span className="data-field-label">{label}</span>
      </div>
      <div className="data-field-body">
        {href && !isMuted ? (
          <a
            href={href}
            target={target}
            rel="noopener noreferrer"
            className="data-field-value hover:text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{displayVal}</span>
            <ExternalLinkIcon className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        ) : (
          <span className={`data-field-value ${isMuted ? "muted" : ""}`}>
            {displayVal}
          </span>
        )}
        {badge && <div className="data-field-badge">{badge}</div>}
      </div>
      {sub && <span className="data-field-sub">{sub}</span>}
    </div>
  );
}

// ─── SVG Helper Icons for Photo Lightbox & Documents ─────────────────────────
function FileTextIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ZoomInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function RotateIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

function Minimize2Icon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

// ─── Full-Screen Responsive Photo Lightbox Component ───────────────────────────
function PhotoLightbox({
  kycPhotoUrl,
  avatarUrl,
  clientName,
  kycVerifiedAt,
  authProvider = "local",
  initialTab = "kyc",
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // "kyc" | "pfp"
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef(null);

  const rawUrl = activeTab === "kyc" ? kycPhotoUrl : avatarUrl;
  // Automatically upscale Google user avatars so they are crystal-clear at 1200px in fullscreen
  const currentUrl =
    activeTab === "pfp" && rawUrl && rawUrl.includes("googleusercontent.com")
      ? rawUrl.replace(/=s\d+(-c)?$/, "=s1200-c")
      : rawUrl;
  const hasCurrentPhoto = Boolean(currentUrl && currentUrl.trim().length > 5);
  const hasKyc = Boolean(kycPhotoUrl && kycPhotoUrl.trim().length > 5);
  const hasPfp = Boolean(avatarUrl && avatarUrl.trim().length > 5);

  // Reset zoom & pan when switching tabs
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImgLoaded(false);
    setImgError(false);
  }, [activeTab]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setActiveTab((prev) => (prev === "kyc" ? "pfp" : "kyc"));
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      } else if (e.key === "0") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      } else if (e.key.toLowerCase() === "r") {
        setRotation((r) => (r + 90) % 360);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen photo inspector"
    >
      <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
        {/* ── Top Header Toolbar ────────────────────────────────────────── */}
        <div className="lightbox-header">
          {/* Left Title & Client Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              {activeTab === "kyc" ? (
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <UserIcon className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  MCPA Identity Inspector
                </span>
                <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">•</span>
                <span className="text-[10px] font-mono text-neutral-400 truncate hidden sm:inline">
                  {clientName}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {activeTab === "kyc"
                  ? "Biometric KYC Verification Capture"
                  : "Client Profile Picture (PFP)"}
              </h3>
            </div>
          </div>

          {/* Center: Interactive Tabs */}
          <div className="lightbox-tabs-group">
            <button
              type="button"
              onClick={() => setActiveTab("kyc")}
              className={`lightbox-tab-btn ${activeTab === "kyc" ? "active" : ""}`}
              title="View Official Biometric KYC Face Verification Selfie"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Biometric KYC</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pfp")}
              className={`lightbox-tab-btn ${activeTab === "pfp" ? "active" : ""}`}
              title="View Account Profile Photo (PFP)"
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Profile (PFP)</span>
            </button>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="lightbox-zoom-bar hidden md:flex items-center">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.5 || !hasCurrentPhoto}
                className="lightbox-ctrl-btn"
                title="Zoom Out (-)"
              >
                <ZoomOutIcon className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-neutral-300 px-2 select-none min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3 || !hasCurrentPhoto}
                className="lightbox-ctrl-btn"
                title="Zoom In (+)"
              >
                <ZoomInIcon className="w-3.5 h-3.5" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="px-1.5 py-0.5 text-[9px] font-mono text-amber-400 hover:text-amber-300 ml-1"
                  title="Reset Zoom (0)"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              disabled={!hasCurrentPhoto}
              className="lightbox-ctrl-btn hidden sm:inline-flex"
              title="Rotate 90° (R)"
            >
              <RotateIcon className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="lightbox-ctrl-btn"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize2Icon className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Maximize2Icon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Open Raw in New Tab */}
            {hasCurrentPhoto && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lightbox-ctrl-btn hidden sm:inline-flex"
                title="Open full resolution image in new browser tab"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="lightbox-close-btn"
              aria-label="Close Photo Lightbox"
              title="Close Viewer (Esc)"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Center Stage Viewport ────────────────────────────────────── */}
        <div
          className="lightbox-body"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          {hasCurrentPhoto ? (
            <div className="lightbox-stage-container">
              {/* Loading spinner */}
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <span className="text-xs font-mono">Loading full-resolution image...</span>
                </div>
              )}

              {/* Error fallback */}
              {imgError && (
                <div className="max-w-md p-6 rounded-lg bg-neutral-900/90 border border-red-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                    <CloseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Image Preview Blocked</h4>
                    <p className="text-xs text-neutral-400 mt-1 font-mono">
                      The image host blocked direct iframe rendering. You can view the raw photo directly in a new tab.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-amber-500 text-black font-mono font-bold text-xs hover:bg-amber-400 inline-flex items-center gap-1.5"
                    >
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                      <span>Open Raw Image</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setImgError(false);
                        setImgLoaded(false);
                      }}
                      className="px-3 py-1.5 rounded bg-white/10 text-white font-mono text-xs hover:bg-white/20 inline-flex items-center gap-1.5"
                    >
                      <RefreshCwIcon className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={`${activeTab === "kyc" ? "Biometric KYC capture" : "Profile picture"} of ${clientName}`}
                className="lightbox-image"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onLoad={() => {
                  setImgLoaded(true);
                  setImgError(false);
                }}
                onError={() => {
                  setImgLoaded(false);
                  setImgError(true);
                }}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  display: imgError ? "none" : "block",
                }}
              />
            </div>
          ) : (
            /* Empty State for Selected Tab */
            <div className="lightbox-empty-card">
              <div className="w-14 h-14 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mb-3">
                {activeTab === "kyc" ? (
                  <ShieldCheckIcon className="w-7 h-7 text-amber-500/70" />
                ) : (
                  <UserIcon className="w-7 h-7 text-amber-500/70" />
                )}
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {activeTab === "kyc"
                  ? "No Biometric KYC Facial Scan on File"
                  : "No Custom Profile Picture (PFP)"}
              </h4>
              <p className="text-xs text-neutral-400 font-mono max-w-sm mb-4">
                {activeTab === "kyc"
                  ? "This user signed in directly via Social OAuth or registered prior to mandatory biometric live capture. Biometric face verification is captured during Step 3 of registration."
                  : "The client has not uploaded a custom profile picture. The portal automatically renders an initials monogram."}
              </p>
              {activeTab === "kyc" && hasPfp && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pfp")}
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Switch to Account Profile Picture (PFP)</span>
                </button>
              )}
              {activeTab === "pfp" && hasKyc && (
                <button
                  type="button"
                  onClick={() => setActiveTab("kyc")}
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>Switch to Biometric KYC Photo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Footer Status Bar ─────────────────────────────────── */}
        <div className="lightbox-footer">
          {/* Status info */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {activeTab === "kyc" ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">
                  {hasKyc
                    ? `Official Biometric KYC Identity Capture • Verified ${kycVerifiedAt ? formatDate(kycVerifiedAt) : "Live"}`
                    : "Biometric KYC Record • Pending Live Capture"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">
                  {hasPfp
                    ? `Client Profile Picture • Provider: ${authProvider.toUpperCase()}`
                    : "Account Monogram Avatar • Free Will Profile"}
                </span>
              </div>
            )}
            <span className="text-neutral-500 hidden md:inline">|</span>
            <span className="text-neutral-400 text-[10px] hidden md:inline">
              Republic Act 10173 Encrypted &amp; Protected
            </span>
          </div>

          {/* Mobile Zoom Controls & Close */}
          <div className="flex items-center gap-2">
            {/* Quick Mobile Zoom Toggles */}
            <div className="flex md:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.5 || !hasCurrentPhoto}
                className="p-1 rounded bg-white/10 text-neutral-300 text-xs"
                title="Zoom Out"
              >
                <ZoomOutIcon className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3 || !hasCurrentPhoto}
                className="p-1 rounded bg-white/10 text-neutral-300 text-xs"
                title="Zoom In"
              >
                <ZoomInIcon className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-mono font-medium transition-colors"
            >
              Close Viewer (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formal Black & White Microsoft Word / Resume Style Document ──────────────
function ClientWordDocument({ account, clientBriefs, photoDataUrl, logoDataUrl }) {
  const isOfw = (account.client_type || "").toLowerCase() === "ofw";
  const age = computeAge(account.birth_date);
  const uid = `MCPA-CRD-2026-${String(account.user_id || 1).padStart(4, "0")}`;
  const currentDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const briefs = useMemo(() => {
    return (clientBriefs || []).filter(
      (b) =>
        (b.clientEmail || b.client_email || "").toLowerCase() ===
        (account.email || "").toLowerCase()
    );
  }, [clientBriefs, account.email]);

  const photoUrl = photoDataUrl || account.kyc_photo_url || account.avatar_url;
  const logoUrl = logoDataUrl || "/assets/mcpa-logo.svg";

  return (
    <div className="word-doc-container">
      {/* ── Official Corporate Letterhead ─────────────────────────────── */}
      <div className="word-doc-header">
        <div className="word-doc-header-left">
          <div className="word-doc-logo-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="MCPA Construction & Supply Logo"
              className="word-doc-logo-img"
              crossOrigin="anonymous"
            />
          </div>
          <div className="word-doc-company-details">
            <h1 className="word-doc-company-name">MCPA CONSTRUCTION AND SUPPLY</h1>
            <p className="word-doc-company-tagline">
              Design &amp; Build Contractor • General Building &amp; Engineering Services
            </p>
            <p className="word-doc-company-sub">
              Provincial Highway, Bulacan &amp; Metro Manila, Philippines • Contact: (044) 794-4822 / 0917-888-9999
            </p>
            <p className="word-doc-company-sub">
              System: SAAD Project Development &amp; Client Records System (mcpa-construction.vercel.app)
            </p>
          </div>
        </div>

        {/* Document Control Metadata Box */}
        <div className="word-doc-control-box">
          <table className="word-doc-control-table">
            <tbody>
              <tr>
                <td className="control-label">FORM REF</td>
                <td className="control-val">MCPA-CRD-01</td>
              </tr>
              <tr>
                <td className="control-label">RECORD NO</td>
                <td className="control-val">{uid}</td>
              </tr>
              <tr>
                <td className="control-label">DATE ISSUED</td>
                <td className="control-val">{currentDate}</td>
              </tr>
              <tr>
                <td className="control-label">CLASSIFICATION</td>
                <td className="control-val">{isOfw ? "OFW CLIENT" : "LOCAL RESIDENT"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Double Horizontal Rule */}
      <div className="word-doc-double-divider" />

      {/* ── Formal Document Title ─────────────────────────────────────── */}
      <div className="word-doc-title-block">
        <h2 className="word-doc-main-title">CLIENT PROFILE &amp; REGISTRATION RECORD</h2>
        <p className="word-doc-subtitle">
          (Official Customer Bio-Data, Architectural Preferences &amp; Identity Verification Attestation)
        </p>
      </div>

      {/* ── Client Bio-Data & 2x2 Photo (Classic Resume Style) ────────── */}
      <div className="word-doc-bio-section">
        <div className="word-doc-bio-info">
          <h3 className="word-doc-client-fullname">
            {account.full_name ? account.full_name.toUpperCase() : "CLIENT ACCOUNT"}
          </h3>
          <p className="word-doc-client-occupation">
            {account.occupation || "Registered Homeowner / Project Proponent"}
          </p>

          <table className="word-doc-mini-table">
            <tbody>
              <tr>
                <td className="mini-lbl">Email Address:</td>
                <td className="mini-val">{account.email || "—"}</td>
              </tr>
              <tr>
                <td className="mini-lbl">Primary Mobile:</td>
                <td className="mini-val">
                  {account.phone_number || "Not recorded"}
                  {account.has_viber_whatsapp ? " [Viber / WhatsApp Connected]" : ""}
                </td>
              </tr>
              <tr>
                <td className="mini-lbl">Residential Address:</td>
                <td className="mini-val">{account.location_address || "—"}</td>
              </tr>
              <tr>
                <td className="mini-lbl">Territorial Category:</td>
                <td className="mini-val">
                  {isOfw ? "Overseas Filipino Worker (OFW Client)" : "Philippine Domestic Resident"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2x2 ID Photo Box (Clean, Proportional, Formal Resume Style) */}
        <div className="word-doc-photo-box">
          <div className="word-doc-photo-frame">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`Photo of ${account.full_name || "Client"}`}
                className="word-doc-photo-img"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="word-doc-photo-placeholder">
                <span>[ 2x2 ID PHOTO ]</span>
              </div>
            )}
          </div>
          <span className="word-doc-photo-caption">
            {account.kyc_photo_url ? "Biometric KYC Record" : "Attached ID Photo"}
          </span>
        </div>
      </div>

      {/* ── Section I: Personal & Demographic Particulars ──────────────── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">I. PERSONAL &amp; DEMOGRAPHIC INFORMATION</h4>
        <table className="word-doc-table">
          <tbody>
            <tr>
              <th>Full Legal Name</th>
              <td>{account.full_name || "—"}</td>
              <th>Civil Status</th>
              <td>{account.civil_status || "Not declared"}</td>
            </tr>
            <tr>
              <th>Date of Birth</th>
              <td>
                {account.birth_date ? formatDate(account.birth_date) : "—"}
                {age !== null ? ` (${age} years old)` : ""}
              </td>
              <th>Spouse Name</th>
              <td>
                {(account.civil_status || "").toLowerCase() === "married" || account.spouse_name
                  ? account.spouse_name || "Not specified"
                  : "N/A (Single / Unmarried)"}
              </td>
            </tr>
            <tr>
              <th>Emergency Contact</th>
              <td>{account.emergency_contact || "None recorded"}</td>
              <th>Preferred Call Time</th>
              <td>{account.preferred_contact_time || "Anytime (PH Daytime)"}</td>
            </tr>
            <tr>
              <th>System Account UID</th>
              <td>{uid}</td>
              <th>Registration Date</th>
              <td>{formatDateTime(account.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section II: Occupational Background ────────────────────────── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">II. OCCUPATIONAL BACKGROUND</h4>
        <table className="word-doc-table">
          <tbody>
            <tr>
              <th>Occupation / Profession</th>
              <td>{account.occupation || "Not declared"}</td>
              <th>Client Category</th>
              <td>{isOfw ? "Overseas Filipino Worker (OFW)" : "Local Resident (Philippines)"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section III: Residential Location & Territorial Assignment ─── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">III. RESIDENTIAL LOCATION &amp; TERRITORIAL ASSIGNMENT</h4>
        <table className="word-doc-table">
          <tbody>
            <tr>
              <th>Registered Residence</th>
              <td colSpan={3}>
                {account.location_address || (isOfw ? (account.ofw_country || "Overseas") : "Not specified")}
              </td>
            </tr>
            {isOfw && (
              <>
                <tr>
                  <th>OFW Host Country</th>
                  <td>{account.ofw_country || "Overseas"}</td>
                  <th>Designated PH Representative</th>
                  <td>
                    {account.ph_rep_name || "Not assigned"}
                    {account.ph_rep_relationship ? ` (${account.ph_rep_relationship})` : ""}
                  </td>
                </tr>
                <tr>
                  <th>Representative Contact</th>
                  <td colSpan={3}>{account.ph_rep_phone || "Not provided"}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Section IV: Architectural Project & Lot Specifications ─────── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">IV. ARCHITECTURAL PROJECT &amp; LOT SPECIFICATIONS</h4>
        <table className="word-doc-table">
          <tbody>
            <tr>
              <th>Target Project Archetype</th>
              <td>{account.target_project_type || "Not specified"}</td>
              <th>Lot Ownership Status</th>
              <td>{account.lot_ownership_status || "Not specified"}</td>
            </tr>
            <tr>
              <th>Lot &amp; Subdivision Details</th>
              <td>{account.subdivision_lot_details || "Not specified"}</td>
              <th>Target Build Location</th>
              <td>{account.target_build_location || account.location_address || "Not specified"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section V: Consultation Inquiries & Project Briefs ─────────── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">
          V. CONSULTATION INQUIRIES &amp; PROJECT BRIEFS ({briefs.length})
        </h4>
        {briefs.length === 0 ? (
          <p className="word-doc-empty-note">
            No active project inquiry briefs submitted to date. Homeowner account registered in system records.
          </p>
        ) : (
          <table className="word-doc-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Brief #</th>
                <th style={{ width: "24%" }}>Project Type</th>
                <th style={{ width: "26%" }}>Site Location</th>
                <th style={{ width: "20%" }}>Budget Bracket</th>
                <th style={{ width: "18%" }}>Filing Status</th>
              </tr>
            </thead>
            <tbody>
              {briefs.map((b, idx) => (
                <tr key={b.id || b.brief_id || idx}>
                  <td>#{b.brief_id || b.id || idx + 1}</td>
                  <td>{b.projectType || b.project_type || "Residential Construction"}</td>
                  <td>{b.location || "—"}</td>
                  <td>{b.budgetRange || b.budget_range || "—"}</td>
                  <td>{b.status || "Open / In Review"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section VI: System Verification & Data Privacy Compliance ─── */}
      <div className="word-doc-section">
        <h4 className="word-doc-sec-heading">VI. SYSTEM VERIFICATION &amp; DATA PRIVACY ATTESTATION</h4>
        <table className="word-doc-table">
          <tbody>
            <tr>
              <th>Authentication Method</th>
              <td>{account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL CREDENTIALS"}</td>
              <th>Biometric KYC Status</th>
              <td>{account.kyc_photo_url ? "Verified Live Selfie (MediaPipe Face Mesh)" : "Verified Registration"}</td>
            </tr>
            <tr>
              <th>Data Privacy Compliance</th>
              <td colSpan={3}>
                All personal and architectural data recorded herein is processed in strict compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and MCPA corporate security protocols. User passwords remain cryptographically hashed via salted Bcrypt.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section VII: Official Signatures & Attestation Block ───────── */}
      <div className="word-doc-sign-block word-break-avoid">
        <div className="word-doc-sign-col">
          <p className="word-doc-sign-label">Prepared &amp; Verified by:</p>
          <div className="word-doc-sign-space" />
          <div className="word-doc-sign-line" />
          <p className="word-doc-signer-name">ENGR. RAYMART QUIRANTE</p>
          <p className="word-doc-signer-title">Lead Project Engineer / System Administrator</p>
          <p className="word-doc-signer-sub">MCPA Construction and Supply</p>
          <p className="word-doc-sign-date">Date: {currentDate}</p>
        </div>

        <div className="word-doc-sign-col">
          <p className="word-doc-sign-label">Client Identity Acknowledgment:</p>
          <div className="word-doc-sign-space" />
          <div className="word-doc-sign-line" />
          <p className="word-doc-signer-name">
            {account.full_name ? account.full_name.toUpperCase() : "REGISTERED CLIENT"}
          </p>
          <p className="word-doc-signer-title">Client Signature / Account Holder</p>
          <p className="word-doc-signer-sub">Official Registration Record</p>
          <p className="word-doc-sign-date">Date: {currentDate}</p>
        </div>
      </div>

      {/* ── Document Footer ───────────────────────────────────────────── */}
      <div className="word-doc-footer">
        <p>
          MCPA CONSTRUCTION AND SUPPLY • OFFICIAL CLIENT RECORD • SAAD ARCHITECTURAL SYSTEM • CONFIDENTIAL
        </p>
      </div>
    </div>
  );
}

// ─── Comprehensive Client Dossier Modal ────────────────────────────────────────
function ClientDossierModal({ account, clientBriefs, onClose }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const colors = getAvatarGradient(account.full_name);
  const initials = getInitials(account.full_name);
  const isOfw = (account.client_type || "").toLowerCase() === "ofw";
  const age = computeAge(account.birth_date);
  const uid = `#UID-${String(account.user_id || 1).padStart(4, "0")}`;

  // Filter inquiries for this account
  const briefs = useMemo(() => {
    return (clientBriefs || []).filter(
      (b) =>
        (b.clientEmail || b.client_email || "").toLowerCase() ===
        (account.email || "").toLowerCase()
    );
  }, [clientBriefs, account.email]);

  // Escape key handler
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const printDocRef = useRef(null);
  const [docPhotoDataUrl, setDocPhotoDataUrl] = useState(null);
  const [docLogoDataUrl, setDocLogoDataUrl] = useState(null);

  // Pre-rasterize logo and client KYC photo to base64 Data URLs for offline/CORS-safe PDF rendering
  useEffect(() => {
    let isMounted = true;

    // Rasterize logo
    const loadLogo = () => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 340;
            canvas.height = 108;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, 340, 108);
            if (isMounted) setDocLogoDataUrl(canvas.toDataURL("image/png"));
          } catch (e) {
            console.warn("Could not rasterize logo:", e);
          }
        };
        img.src = "/assets/mcpa-logo.svg";
      } catch (err) {
        console.warn("Logo load error:", err);
      }
    };

    // Rasterize client photo
    const loadPhoto = () => {
      const rawUrl = account?.kyc_photo_url || account?.avatar_url;
      if (!rawUrl) return;
      if (rawUrl.startsWith("data:")) {
        if (isMounted) setDocPhotoDataUrl(rawUrl);
        return;
      }
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 300;
            canvas.height = img.naturalHeight || 360;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            if (isMounted) setDocPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.95));
          } catch (e) {
            console.warn("Could not rasterize photo to dataURL:", e);
            if (isMounted) setDocPhotoDataUrl(rawUrl);
          }
        };
        img.onerror = () => {
          if (isMounted) setDocPhotoDataUrl(rawUrl);
        };
        img.src = rawUrl;
      } catch (err) {
        if (isMounted) setDocPhotoDataUrl(rawUrl);
      }
    };

    loadLogo();
    loadPhoto();

    return () => {
      isMounted = false;
    };
  }, [account?.kyc_photo_url, account?.avatar_url]);

  // Download official certified PDF client dossier matching the official print document layout
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const element = printDocRef.current;
      if (!element) throw new Error("Print document ref not found");

      // Small pause to allow images and layout to settle
      await new Promise((r) => setTimeout(r, 120));

      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x retina resolution for razor-sharp typography and borders
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const safeName = (account.full_name || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

      if (pdfHeight <= pageHeight) {
        // Fits perfectly on single A4 page
        doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      } else {
        // Multi-page slicing if extensive brief tables
        let heightLeft = pdfHeight;
        let position = 0;
        doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
        heightLeft -= pageHeight;

        while (heightLeft > 4) {
          position -= pageHeight;
          doc.addPage();
          doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
          heightLeft -= pageHeight;
        }
      }

      // Save official dossier PDF
      doc.save(`MCPA_Client_Dossier_${safeName}.pdf`);
    } catch (err) {
      console.error("Failed to generate client dossier PDF:", err);
      // Clean fallback: open browser print dialog so user can Save as PDF
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  // Download official Microsoft Word (.doc) client dossier
  const handleDownloadWord = () => {
    const safeName = (account.full_name || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");
    const docUid = `MCPA-CRD-2026-${String(account.user_id || 1).padStart(4, "0")}`;
    const currentDate = new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>MCPA Client Dossier - ${account.full_name || "Client"}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: letter portrait;
      margin: 0.8in 0.8in 0.8in 0.8in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111827;
      background-color: #ffffff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
      border-bottom: 2pt solid #0f172a;
      padding-bottom: 8pt;
    }
    .header-table td {
      border: none;
      vertical-align: middle;
      padding: 0;
    }
    .company-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      letter-spacing: 0.5pt;
      margin: 0;
    }
    .company-sub {
      font-size: 9pt;
      color: #475569;
      margin: 2pt 0;
    }
    .control-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1.5pt solid #0f172a;
      background: #f8fafc;
    }
    .control-table td {
      border: none;
      padding: 3pt 5pt;
    }
    .control-lbl {
      font-weight: bold;
      color: #475569;
    }
    .control-val {
      font-weight: bold;
      color: #0f172a;
      text-align: right;
    }
    .doc-title {
      text-align: center;
      margin: 14pt 0 6pt 0;
    }
    .doc-title h2 {
      font-size: 13.5pt;
      font-weight: bold;
      color: #0f172a;
      letter-spacing: 0.5pt;
      margin: 0;
      text-transform: uppercase;
    }
    .doc-title p {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
      margin: 2pt 0;
    }
    .sec-heading {
      font-size: 10.5pt;
      font-weight: bold;
      color: #0f172a;
      background-color: #f1f5f9;
      border-left: 4pt solid #d97706;
      padding: 4pt 8pt;
      margin: 14pt 0 6pt 0;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
      font-size: 9.5pt;
    }
    .data-table th, .data-table td {
      border: 1pt solid #cbd5e1;
      padding: 5pt 7pt;
      vertical-align: top;
    }
    .data-table th {
      background-color: #f8fafc;
      font-weight: bold;
      color: #334155;
      width: 25%;
      text-align: left;
    }
    .data-table td {
      color: #0f172a;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24pt;
      page-break-inside: avoid;
    }
    .sign-table td {
      border: none;
      vertical-align: top;
      width: 50%;
      padding: 8pt;
    }
    .sign-line {
      border-bottom: 1.5pt solid #0f172a;
      width: 80%;
      margin: 32pt 0 6pt 0;
    }
    .sign-name {
      font-weight: bold;
      font-size: 10pt;
      margin: 0;
    }
    .sign-title {
      font-size: 8.5pt;
      color: #475569;
      margin: 1pt 0;
    }
  </style>
</head>
<body>
  <!-- Header / Letterhead -->
  <table class="header-table">
    <tr>
      <td style="width: 65%;">
        <div class="company-title">MCPA CONSTRUCTION AND SUPPLY</div>
        <div class="company-sub">Design &amp; Build Contractor • General Building &amp; Engineering Services</div>
        <div class="company-sub">Provincial Highway, Bulacan &amp; Metro Manila, Philippines • Contact: (044) 794-4822 / 0917-888-9999</div>
        <div class="company-sub" style="font-size: 8pt; color: #64748b;">System: SAAD Project Development &amp; Client Records System</div>
      </td>
      <td style="width: 35%; text-align: right;">
        <table class="control-table">
          <tr><td class="control-lbl">FORM REF:</td><td class="control-val">MCPA-CRD-01</td></tr>
          <tr><td class="control-lbl">RECORD NO:</td><td class="control-val">${docUid}</td></tr>
          <tr><td class="control-lbl">DATE ISSUED:</td><td class="control-val">${currentDate}</td></tr>
          <tr><td class="control-lbl">CLASSIFICATION:</td><td class="control-val">${isOfw ? "OFW CLIENT" : "LOCAL RESIDENT"}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <div class="doc-title">
    <h2>Client Profile &amp; Registration Record</h2>
    <p>(Official Customer Bio-Data, Architectural Preferences &amp; Identity Verification Attestation)</p>
  </div>

  <div class="sec-heading">I. Personal &amp; Demographic Information</div>
  <table class="data-table">
    <tr>
      <th>Full Legal Name</th>
      <td style="font-weight: bold; font-size: 10.5pt;">${account.full_name || "—"}</td>
      <th>Civil Status</th>
      <td>${account.civil_status || "Not declared"}</td>
    </tr>
    <tr>
      <th>Date of Birth</th>
      <td>${account.birth_date ? formatDate(account.birth_date) : "—"} ${age !== null ? `(${age} years old)` : ""}</td>
      <th>Spouse / Co-Borrower</th>
      <td>${account.spouse_name || "N/A (Single / Unmarried)"}</td>
    </tr>
    <tr>
      <th>Emergency Contact</th>
      <td>${account.emergency_contact || "None recorded"}</td>
      <th>Preferred Call Time</th>
      <td>${account.preferred_contact_time || "Anytime (PH Daytime)"}</td>
    </tr>
    <tr>
      <th>System Account UID</th>
      <td>${docUid}</td>
      <th>Registration Date</th>
      <td>${formatDateTime(account.created_at)}</td>
    </tr>
  </table>

  <div class="sec-heading">II. Occupational Background</div>
  <table class="data-table">
    <tr>
      <th>Occupation / Profession</th>
      <td>${account.occupation || "Not declared"}</td>
      <th>Client Category</th>
      <td>${isOfw ? "Overseas Filipino Worker (OFW)" : "Local Resident (Philippines)"}</td>
    </tr>
  </table>

  <div class="sec-heading">III. Contact Channels &amp; Residential Location</div>
  <table class="data-table">
    <tr>
      <th>Email Address</th>
      <td>${account.email || "—"}</td>
      <th>Primary Phone</th>
      <td>${account.phone_number || "—"}${account.has_viber_whatsapp ? " [Viber/WhatsApp Active]" : ""}</td>
    </tr>
    <tr>
      <th>Registered Residence</th>
      <td colspan="3">${account.location_address || "—"}</td>
    </tr>
    ${isOfw ? `
    <tr>
      <th>OFW Host Country</th>
      <td>${account.ofw_country || "Overseas"}</td>
      <th>PH Representative</th>
      <td>${account.ph_rep_name || "—"} (${account.ph_rep_relationship || "Representative"}) • Phone: ${account.ph_rep_phone || "—"}</td>
    </tr>` : ""}
  </table>

  <div class="sec-heading">IV. Architectural Project &amp; Lot Specifications</div>
  <table class="data-table">
    <tr>
      <th>Target Project Archetype</th>
      <td>${account.target_project_type || "Not specified"}</td>
      <th>Lot Ownership Status</th>
      <td>${account.lot_ownership_status || "Not specified"}</td>
    </tr>
    <tr>
      <th>Lot Specifications</th>
      <td>${account.subdivision_lot_details || "Not specified"}</td>
      <th>Target Build Location</th>
      <td>${account.target_build_location || account.location_address || "Not specified"}</td>
    </tr>
  </table>

  <div class="sec-heading">V. Active Consultation Inquiries &amp; Project Briefs (${briefs.length})</div>
  ${briefs.length === 0 ? `
  <p style="font-size: 9pt; color: #64748b; font-style: italic; padding: 4pt 0;">No active project inquiry briefs submitted to date. Homeowner account registered in system records.</p>
  ` : `
  <table class="data-table">
    <tr style="background: #f1f5f9;">
      <th style="width: 15%;">Brief Ref</th>
      <th style="width: 30%;">Project Type</th>
      <th style="width: 25%;">Site Location</th>
      <th style="width: 18%;">Budget Bracket</th>
      <th style="width: 12%;">Status</th>
    </tr>
    ${briefs.map((b, idx) => `
    <tr>
      <td>#${b.brief_id || b.id || idx + 1}</td>
      <td>${b.projectType || b.project_type || "Residential Construction"}</td>
      <td>${b.location || "—"}</td>
      <td>${b.budgetRange || b.budget_range || "—"}</td>
      <td>${b.status || "Open / In Review"}</td>
    </tr>`).join("")}
  </table>
  `}

  <div class="sec-heading">VI. System Verification &amp; Data Privacy Attestation</div>
  <table class="data-table">
    <tr>
      <th>Authentication Method</th>
      <td>${account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL CREDENTIALS"}</td>
      <th>Biometric KYC Status</th>
      <td>${account.kyc_photo_url ? "Verified Live Biometric Facial Scan (MediaPipe)" : "Verified Registration"}</td>
    </tr>
    <tr>
      <th>Data Privacy Compliance</th>
      <td colspan="3">All personal and architectural data recorded herein is processed in strict compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and MCPA corporate security protocols.</td>
    </tr>
  </table>

  <!-- Official Signatures Block -->
  <table class="sign-table">
    <tr>
      <td>
        <p style="font-size: 8.5pt; color: #475569; margin: 0;">Prepared &amp; Verified by:</p>
        <div class="sign-line"></div>
        <p class="sign-name">ENGR. RAYMART QUIRANTE</p>
        <p class="sign-title">Lead Project Engineer / System Administrator</p>
        <p class="sign-title">MCPA Construction and Supply</p>
      </td>
      <td>
        <p style="font-size: 8.5pt; color: #475569; margin: 0;">Client Attestation / Acknowledged by:</p>
        <div class="sign-line"></div>
        <p class="sign-name">${(account.full_name || "CLIENT / HOMEOWNER").toUpperCase()}</p>
        <p class="sign-title">Registered Homeowner / Project Proponent</p>
        <p class="sign-title">${isOfw ? "Overseas Filipino Worker Client" : "Philippine Resident Client"}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob(["\ufeff" + wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MCPA_Client_Dossier_${safeName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy beautifully formatted profile summary to clipboard (Rich HTML + clean Markdown plain text)
  const handleCopyProfile = async () => {
    // ── 1. Plain Text / Markdown Format (ZERO ====, proper section spacing & bold formatting) ──
    const sections = [];

    // Header Banner (clean, professional, no ===)
    sections.push([
      `MCPA CONSTRUCTION AND SUPPLY`,
      `Client Identity Dossier • Record Ref: ${uid}`,
    ].join("\n"));

    // I. Client Identification
    sections.push([
      `CLIENT IDENTIFICATION`,
      `• **Full Name:** **${account.full_name || "—"}**`,
      `• Client ID: ${uid}`,
      `• Category: ${isOfw ? "Overseas Filipino Worker (OFW Client)" : "Local Resident (Philippines)"}`,
    ].join("\n"));

    // II. Personal & Demographics (Name, Age, Birthdate bolded/clean)
    const personal = [
      `PERSONAL & DEMOGRAPHIC DETAILS`,
      age !== null ? `• **Age:** **${age} years old**` : null,
      account.birth_date ? `• Date of Birth: ${formatDate(account.birth_date)}` : null,
      account.civil_status ? `• Civil Status: ${account.civil_status}` : null,
      account.spouse_name ? `• **Spouse / Co-Borrower:** **${account.spouse_name}**` : null,
      account.emergency_contact ? `• Emergency Contact: ${account.emergency_contact}` : null,
      account.preferred_contact_time ? `• Preferred Call Time: ${account.preferred_contact_time}` : null,
    ].filter(Boolean);
    if (personal.length > 1) sections.push(personal.join("\n"));

    // III. Contact & Location
    const contact = [
      `CONTACT & LOCATION DETAILS`,
      `• Primary Mobile: ${account.phone_number || "—"}${account.has_viber_whatsapp ? " (Viber/WhatsApp Active)" : ""}`,
      `• Email Address: ${account.email || "—"}`,
      `• Residential Address: ${account.location_address || "—"}`,
      isOfw && account.ofw_country ? `• OFW Host Country: ${account.ofw_country}` : null,
      isOfw && account.ph_rep_name ? `• **PH Representative:** **${account.ph_rep_name}** (${account.ph_rep_relationship || "Representative"}) • Phone: ${account.ph_rep_phone || "—"}` : null,
    ].filter(Boolean);
    sections.push(contact.join("\n"));

    // IV. Occupational Background
    const employment = [
      `OCCUPATIONAL BACKGROUND`,
      account.occupation ? `• Occupation: ${account.occupation}` : null,
    ].filter(Boolean);
    if (employment.length > 1) sections.push(employment.join("\n"));

    // V. Project & Lot Specifications
    const project = [
      `PROJECT & LOT SPECIFICATIONS`,
      account.target_project_type ? `• Target Project: ${account.target_project_type}` : null,
      account.lot_ownership_status ? `• Lot Ownership: ${account.lot_ownership_status}` : null,
      account.subdivision_lot_details ? `• Lot Specifications: ${account.subdivision_lot_details}` : null,
      account.target_build_location ? `• Target Build Location: ${account.target_build_location}` : null,
    ].filter(Boolean);
    if (project.length > 1) sections.push(project.join("\n"));

    // VI. System & Compliance Record
    sections.push([
      `SYSTEM & COMPLIANCE RECORD`,
      `• Biometric KYC: ${account.kyc_photo_url ? "Verified Live Biometric Facial Scan (MediaPipe)" : "Verified Registration"}`,
      `• Authentication Method: ${account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}`,
      `• Registration Timestamp: ${formatDateTime(account.created_at)}`,
      `• Active Consultation Briefs: ${briefs.length}`,
    ].join("\n"));

    const plainText = sections.join("\n\n");

    // ── 2. Rich Text HTML Format (styled bold typography, clean spacing, amber accent) ──
    const richTextHtml = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <div style="border-bottom: 2px solid #d97706; padding-bottom: 6px; margin-bottom: 14px;">
    <h3 style="margin: 0; font-size: 16px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">MCPA Construction and Supply</h3>
    <p style="margin: 2px 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">Official Client Identity Dossier • Record Ref: <strong>${uid}</strong></p>
  </div>

  <div style="margin-bottom: 12px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Client Identification</h4>
    <p style="margin: 2px 0;"><strong>Full Legal Name:</strong> <strong style="font-size: 13.5px; color: #0f172a;">${account.full_name || "—"}</strong></p>
    <p style="margin: 2px 0;"><strong>Client ID:</strong> ${uid}</p>
    <p style="margin: 2px 0;"><strong>Territorial Category:</strong> ${isOfw ? "Overseas Filipino Worker (OFW Client)" : "Local Resident (Philippines)"}</p>
  </div>

  <div style="margin-bottom: 12px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Personal &amp; Demographic Details</h4>
    ${age !== null ? `<p style="margin: 2px 0;"><strong>Age:</strong> <strong style="color: #0f172a;">${age} years old</strong></p>` : ""}
    ${account.birth_date ? `<p style="margin: 2px 0;"><strong>Date of Birth:</strong> ${formatDate(account.birth_date)}</p>` : ""}
    ${account.civil_status ? `<p style="margin: 2px 0;"><strong>Civil Status:</strong> ${account.civil_status}</p>` : ""}
    ${account.spouse_name ? `<p style="margin: 2px 0;"><strong>Spouse / Co-Borrower:</strong> <strong>${account.spouse_name}</strong></p>` : ""}
    ${account.emergency_contact ? `<p style="margin: 2px 0;"><strong>Emergency Contact:</strong> ${account.emergency_contact}</p>` : ""}
    ${account.preferred_contact_time ? `<p style="margin: 2px 0;"><strong>Preferred Call Time:</strong> ${account.preferred_contact_time}</p>` : ""}
  </div>

  <div style="margin-bottom: 12px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Contact &amp; Location Details</h4>
    <p style="margin: 2px 0;"><strong>Primary Mobile:</strong> ${account.phone_number || "—"}${account.has_viber_whatsapp ? " [Viber/WhatsApp Active]" : ""}</p>
    <p style="margin: 2px 0;"><strong>Email Address:</strong> ${account.email || "—"}</p>
    <p style="margin: 2px 0;"><strong>Residential Address:</strong> ${account.location_address || "—"}</p>
    ${isOfw && account.ofw_country ? `<p style="margin: 2px 0;"><strong>OFW Host Country:</strong> ${account.ofw_country}</p>` : ""}
    ${isOfw && account.ph_rep_name ? `<p style="margin: 2px 0;"><strong>PH Representative:</strong> <strong>${account.ph_rep_name}</strong> (${account.ph_rep_relationship || "Representative"}) • Phone: ${account.ph_rep_phone || "—"}</p>` : ""}
  </div>

  ${account.occupation ? `
  <div style="margin-bottom: 12px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Occupational Background</h4>
    <p style="margin: 2px 0;"><strong>Occupation / Profession:</strong> ${account.occupation}</p>
  </div>` : ""}

  ${(account.target_project_type || account.lot_ownership_status || account.subdivision_lot_details || account.target_build_location) ? `
  <div style="margin-bottom: 12px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Project &amp; Lot Specifications</h4>
    ${account.target_project_type ? `<p style="margin: 2px 0;"><strong>Target Project:</strong> ${account.target_project_type}</p>` : ""}
    ${account.lot_ownership_status ? `<p style="margin: 2px 0;"><strong>Lot Ownership:</strong> ${account.lot_ownership_status}</p>` : ""}
    ${account.subdivision_lot_details ? `<p style="margin: 2px 0;"><strong>Lot Specifications:</strong> ${account.subdivision_lot_details}</p>` : ""}
    ${account.target_build_location ? `<p style="margin: 2px 0;"><strong>Target Build Location:</strong> ${account.target_build_location}</p>` : ""}
  </div>` : ""}

  <div style="margin-bottom: 10px;">
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">System &amp; Compliance Record</h4>
    <p style="margin: 2px 0;"><strong>Biometric KYC Status:</strong> ${account.kyc_photo_url ? "Verified Live Biometric Facial Scan (MediaPipe)" : "Verified Registration"}</p>
    <p style="margin: 2px 0;"><strong>Authentication:</strong> ${account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}</p>
    <p style="margin: 2px 0;"><strong>Registration Timestamp:</strong> ${formatDateTime(account.created_at)}</p>
    <p style="margin: 2px 0;"><strong>Active Consultation Briefs:</strong> ${briefs.length}</p>
  </div>
</div>`;

    // ── 3. Write to Clipboard with Dual MIME-type Support ──
    try {
      if (typeof window !== "undefined" && navigator.clipboard?.write && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: "text/plain" });
        const htmlBlob = new Blob([richTextHtml], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": textBlob,
            "text/html": htmlBlob,
          }),
        ]);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
        return;
      }
    } catch (err) {
      console.warn("ClipboardItem rich text write failed, falling back to writeText:", err);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(plainText).then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      });
    }
  };

  const hasKycPhoto = Boolean(account.kyc_photo_url && account.kyc_photo_url.trim().length > 5);
  const hasAvatarPhoto = Boolean(account.avatar_url && account.avatar_url.trim().length > 5);
  const [lightboxTab, setLightboxTab] = useState("kyc"); // "kyc" | "pfp"

  return (
    <>
      <style>{DOSSIER_STYLES}</style>

      {/* Lightbox for full-res face photo and PFP */}
      {lightboxOpen && (
        <PhotoLightbox
          kycPhotoUrl={account.kyc_photo_url}
          avatarUrl={account.avatar_url}
          clientName={account.full_name || account.email}
          kycVerifiedAt={account.kyc_verified_at || account.created_at}
          authProvider={account.auth_provider || "local"}
          initialTab={lightboxTab}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* ── Off-screen Dedicated Container for PDF Canvas Capture ── */}
      <div
        ref={printDocRef}
        className="dossier-print-capture-container"
        aria-hidden="true"
      >
        <ClientWordDocument
          account={account}
          clientBriefs={clientBriefs}
          photoDataUrl={docPhotoDataUrl}
          logoDataUrl={docLogoDataUrl}
        />
      </div>

      {/* ── Native Browser Print Sheet (Active during window.print) ── */}
      <div className="dossier-print-sheet" aria-hidden="true">
        <ClientWordDocument
          account={account}
          clientBriefs={clientBriefs}
          photoDataUrl={docPhotoDataUrl}
          logoDataUrl={docLogoDataUrl}
        />
      </div>

      <div
        className="dossier-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dossier-modal-title"
      >
        <div className="dossier-modal">
          {/* ── Modal Header Bar ────────────────────────────────────────── */}
          <div className="dossier-header">
            <div className="dossier-header-title-group">
              <div className="dossier-brand-pill">
                <span className="dossier-brand-logo">MCPA</span>
                <span className="dossier-brand-sep">|</span>
                <span className="dossier-brand-label">Client Identity Dossier</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h2 id="dossier-modal-title" className="dossier-client-name">
                  {account.full_name || "Client Account"}
                </h2>
                <span className="dossier-uid-badge">{uid}</span>
                <span className={`dossier-segment-pill ${isOfw ? "ofw" : "local"}`}>
                  {isOfw ? <PlaneIcon className="w-3 h-3" /> : <MapPinIcon className="w-3 h-3" />}
                  <span>{isOfw ? "OFW Client" : "Local Resident"}</span>
                </span>
                {(account.auth_provider || "").toLowerCase() === "google" && (
                  <span className="client-card-pill google-pill" title="Verified Google Account">
                    <GoogleIcon className="w-3 h-3 shrink-0" />
                    <span>Google</span>
                  </span>
                )}
                {(account.auth_provider || "").toLowerCase() === "facebook" && (
                  <span className="client-card-pill facebook-pill" title="Verified Facebook Account">
                    <FacebookIcon className="w-3 h-3 shrink-0" />
                    <span>Facebook</span>
                  </span>
                )}
              </div>
              <p className="dossier-client-sub flex items-center gap-1.5 flex-wrap">
                <span>Account registered on {formatDateTime(account.created_at)}</span>
                <span className="text-neutral-400">&bull;</span>
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200">
                  <span>via</span>
                  {(account.auth_provider || "").toLowerCase() === "google" && (
                    <GoogleIcon className="w-3 h-3 shrink-0" />
                  )}
                  {(account.auth_provider || "").toLowerCase() === "facebook" && (
                    <FacebookIcon className="w-3 h-3 shrink-0" />
                  )}
                  <span>{account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}</span>
                </span>
              </p>
            </div>

            {/* Header Action Tools */}
            <div className="dossier-header-actions">
              {/* Download official PDF client dossier */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="dossier-action-btn pdf-download-btn print-only-hide"
                title="Download official certified PDF client dossier"
              >
                <FileTextIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>



              <button
                type="button"
                onClick={handleCopyProfile}
                className="dossier-action-btn"
                title="Copy entire client profile summary to clipboard"
              >
                {copiedNotification ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="dossier-close-btn"
                aria-label="Close Dossier"
                title="Close (Esc)"
              >
                <CloseIcon className="w-4 h-4" />
                <span className="text-[10px] font-mono text-neutral-400 ml-1">ESC</span>
              </button>
            </div>
          </div>

          {/* ── Modal Scrollable Body: Interactive System Cards ── */}
          <div className="dossier-body">
              {/* ═════════════════════════════════════════════════════════════ */}
              {/* LEFT SIDEBAR: BIOMETRIC IDENTITY & CONTACT CHANNELS           */}
              {/* ═════════════════════════════════════════════════════════════ */}
              <div className="dossier-sidebar">
              {/* Responsive Dual Photos Grid (KYC Verification vs Profile Picture) */}
              <div className="dossier-photos-grid">
                {/* 1. Official Biometric KYC Face Verification Card */}
                <div className="kyc-photo-card">
                  <div className="kyc-card-header">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>1. Biometric KYC Record</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Live Selfie
                    </span>
                  </div>

                  <div className="kyc-photo-wrapper">
                    {hasKycPhoto ? (
                      <div
                        className="kyc-photo-container group cursor-pointer"
                        onClick={() => {
                          setLightboxTab("kyc");
                          setLightboxOpen(true);
                        }}
                        title="Click to view full-resolution biometric capture"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={account.kyc_photo_url}
                          alt={`Official biometric KYC capture of ${account.full_name}`}
                          className="kyc-photo-img"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <div className="kyc-photo-overlay">
                          <Maximize2Icon className="w-5 h-5 text-white" />
                          <span className="text-[10px] font-mono font-bold text-white mt-1">
                            Inspect KYC Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="kyc-placeholder-container group cursor-pointer"
                        onClick={() => {
                          setLightboxTab("kyc");
                          setLightboxOpen(true);
                        }}
                        title="No biometric scan on file. Click for details."
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1 border border-amber-500/20">
                          <FingerprintIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-200 text-center">
                          Pending KYC Selfie
                        </span>
                        <span className="text-[9.5px] font-mono text-neutral-400 text-center leading-tight">
                          Captured at Step 3
                        </span>
                      </div>
                    )}

                    {/* Security Verification Tag */}
                    <div className={`kyc-status-bar ${hasKycPhoto ? "verified" : "oauth"}`}>
                      <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {hasKycPhoto
                          ? "Biometric KYC Verified"
                          : "Pending Biometric Scan"}
                      </span>
                    </div>
                  </div>

                  <div className="kyc-photo-caption">
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400 mb-0.5">
                      <span>KYC Verification:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {hasKycPhoto ? "MediaPipe Passed" : "Pending Capture"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400">
                      <span>Identity Status:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" /> Live Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Client Profile Picture (PFP / Free Will Avatar) */}
                <div className="kyc-photo-card pfp-card">
                  <div className="kyc-card-header">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>2. Profile Picture (PFP)</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                      Free Will
                    </span>
                  </div>

                  <div className="kyc-photo-wrapper">
                    {hasAvatarPhoto ? (
                      <div
                        className="kyc-photo-container group cursor-pointer"
                        onClick={() => {
                          setLightboxTab("pfp");
                          setLightboxOpen(true);
                        }}
                        title="Click to view full-resolution profile picture"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={account.avatar_url}
                          alt={`Profile picture of ${account.full_name}`}
                          className="kyc-photo-img"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <div className="kyc-photo-overlay">
                          <Maximize2Icon className="w-5 h-5 text-white" />
                          <span className="text-[10px] font-mono font-bold text-white mt-1">
                            Inspect PFP
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="kyc-monogram-container"
                        style={{
                          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                        }}
                      >
                        <span className="kyc-monogram-text">{initials}</span>
                      </div>
                    )}

                    {/* PFP Source Tag */}
                    <div className={`kyc-status-bar ${hasAvatarPhoto ? "pfp" : "neutral"}`}>
                      {hasAvatarPhoto && (account.auth_provider || "").toLowerCase() === "google" ? (
                        <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                      ) : hasAvatarPhoto && (account.auth_provider || "").toLowerCase() === "facebook" ? (
                        <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {hasAvatarPhoto
                          ? (account.auth_provider || "").toLowerCase() === "google"
                            ? "Google Account Photo"
                            : (account.auth_provider || "").toLowerCase() === "facebook"
                            ? "Facebook Account Photo"
                            : "Uploaded Profile PFP"
                          : "Initials Monogram Avatar"}
                      </span>
                    </div>
                  </div>

                  <div className="kyc-photo-caption">
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400 mb-0.5">
                      <span>PFP Mode:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {hasAvatarPhoto ? "Custom User Photo" : "System Initials"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400">
                      <span>Auth Sync:</span>
                      <span className="font-mono inline-flex items-center gap-1.5 font-bold">
                        {(account.auth_provider || "").toLowerCase() === "google" && (
                          <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {(account.auth_provider || "").toLowerCase() === "facebook" && (
                          <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className={
                          (account.auth_provider || "").toLowerCase() === "google"
                            ? "text-blue-600 dark:text-blue-400"
                            : (account.auth_provider || "").toLowerCase() === "facebook"
                            ? "text-[#1877F2]"
                            : "text-neutral-700 dark:text-neutral-300"
                        }>
                          {account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Communications Box */}
              <div className="sidebar-section-card">
                <h4 className="sidebar-card-title">
                  <PhoneIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Direct Communication</span>
                </h4>

                <div className="space-y-3 text-xs">
                  {/* Primary Phone */}
                  <div className="sidebar-meta-row">
                    <span className="sidebar-meta-label">Primary Mobile:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {account.phone_number ? (
                        <a
                          href={`tel:${account.phone_number.replace(/\s+/g, "")}`}
                          title="Click to dial mobile number"
                          className="font-mono font-bold text-neutral-900 dark:text-white hover:text-amber-500 hover:underline cursor-pointer transition-colors"
                        >
                          {account.phone_number}
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-neutral-400 italic">No mobile number recorded</span>
                      )}
                      {account.has_viber_whatsapp && account.phone_number && (
                        <a
                          href={`https://wa.me/${account.phone_number.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp chat with client"
                          className="sidebar-viber-pill hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                        >
                          Viber / WA ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Primary Email */}
                  <div className="sidebar-meta-row">
                    <span className="sidebar-meta-label">Email Address:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(account.email || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click to compose email directly in Gmail"
                        className="font-mono text-amber-600 dark:text-amber-400 hover:underline break-all select-all text-xs font-semibold flex items-center gap-1 group/gmail cursor-pointer"
                      >
                        <span>{account.email}</span>
                        <ExternalLinkIcon className="w-3 h-3 shrink-0 opacity-70 group-hover/gmail:opacity-100" />
                      </a>
                    </div>
                  </div>

                  {/* Social Profile & Identity */}
                  <div className="sidebar-meta-row">
                    <span className="sidebar-meta-label">Connected Accounts:</span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {(account.auth_provider || "").toLowerCase() === "google" && (
                        <a
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(account.email || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Verified Google Account — Click to message on Gmail"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 hover:border-blue-400 transition-all cursor-pointer"
                        >
                          <GoogleIcon className="w-3 h-3 shrink-0" />
                          <span>Google Sync</span>
                        </a>
                      )}
                      <a
                        href={account.facebook_url || `https://www.facebook.com/search/top?q=${encodeURIComponent(account.full_name || account.email || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={account.facebook_url ? "View verified Facebook Profile" : "Search client profile on Facebook"}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-500/10 text-[#1877F2] dark:text-blue-400 hover:bg-[#1877F2] hover:text-white border border-blue-500/20 transition-all cursor-pointer"
                      >
                        <FacebookIcon className="w-3 h-3 shrink-0" />
                        <span>{account.facebook_url ? "Facebook" : "Find on FB ↗"}</span>
                      </a>
                    </div>
                  </div>

                  {/* Preferred Time Window */}
                  <div className="sidebar-meta-row">
                    <span className="sidebar-meta-label">Preferred Calling Window:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {account.preferred_contact_time || "Anytime (PH Daytime)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Cryptographic Protection Statement */}
              <div className="sidebar-section-card security-card">
                <h4 className="sidebar-card-title text-neutral-700 dark:text-neutral-300">
                  <LockIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Security &amp; Privacy Audit</span>
                </h4>
                <div className="space-y-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span>Password:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Bcrypt Encrypted
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exposure:</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Never Accessible
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Privacy Act:</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      RA 10173 Compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT COLUMN: COMPREHENSIVE REGISTRATION DETAILS       */}
            {/* ═════════════════════════════════════════════════════════════ */}
            <div className="dossier-main">
              {/* ── Section 1: Personal & Demographic Identity ──────────── */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <UserIcon className="w-4 h-4 text-amber-500" />
                  <h3>Personal &amp; Demographic Profile</h3>
                  <span className="dossier-step-tag">Step 1 &amp; 2 Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <DataField
                    label="Full Legal Name"
                    value={account.full_name}
                    sub="Registered identity"
                    highlight
                  />
                  <DataField
                    label="Date of Birth & Age"
                    value={account.birth_date ? formatDate(account.birth_date) : "—"}
                    badge={
                      age !== null ? (
                        <span className="age-pill">{age} Years Old</span>
                      ) : null
                    }
                  />
                  <DataField
                    label="Civil Status"
                    value={account.civil_status || "Not declared"}
                  />
                  <DataField
                    label="Spouse Name"
                    value={
                      (account.civil_status || "").toLowerCase() === "married" || account.spouse_name
                        ? account.spouse_name || "Not specified"
                        : "N/A (Single / Unmarried)"
                    }
                  />
                  <DataField
                    label="Emergency Contact"
                    value={account.emergency_contact || "None declared"}
                    sub="Secondary contact person"
                  />
                  <DataField
                    label="Client Classification"
                    value={isOfw ? "Overseas Filipino Worker (OFW)" : "Local Resident (Philippines)"}
                    badge={
                      <span className={`segment-indicator ${isOfw ? "ofw" : "local"}`}>
                        {isOfw ? "International" : "Domestic"}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* ── Section 2: Employment & Profession Profile ────────── */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <BuildingIcon className="w-4 h-4 text-amber-500" />
                  <h3>Employment &amp; Profession Profile</h3>
                  <span className="dossier-step-tag">Step 2 Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <DataField
                    label="Occupation / Profession"
                    value={account.occupation || "Not declared"}
                    highlight
                  />
                </div>
              </div>

              {/* ── Section 3: Registered Residential Address & OFW Details */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <MapPinIcon className="w-4 h-4 text-amber-500" />
                  <h3>Residential Address &amp; Territorial Assignment</h3>
                  <span className="dossier-step-tag">
                    {isOfw ? "OFW Overseas & Rep" : "Philippine Residence"}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <DataField
                    label="Registered Full Residence Address"
                    value={account.location_address || (isOfw ? (account.ofw_country || "Overseas") : "Not specified")}
                    sub="Complete residential location recorded at registration (Click to open in Google Maps)"
                    highlight
                    href={account.location_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(account.location_address)}` : undefined}
                  />

                  {/* OFW Dedicated Rep & Host Country Panel */}
                  {isOfw && (
                    <div className="ofw-callout-card">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-900 dark:text-blue-300 font-mono uppercase tracking-wider">
                        <PlaneIcon className="w-4 h-4 text-blue-500" />
                        <span>Overseas Employment &amp; Philippine Representative</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-0.5">
                            Host Country / Workplace:
                          </span>
                          {account.ofw_country ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(account.ofw_country)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-neutral-900 dark:text-white hover:text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              title="Search country on Google Maps"
                            >
                              <span>{account.ofw_country}</span>
                              <ExternalLinkIcon className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          ) : (
                            <span className="font-bold text-neutral-900 dark:text-white">
                              Overseas
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-0.5">
                            Designated PH Representative:
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {account.ph_rep_name || "Not assigned"}
                          </span>
                          {account.ph_rep_relationship && (
                            <span className="text-[11px] text-neutral-500 block">
                              ({account.ph_rep_relationship})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-0.5">
                            Representative Contact Phone:
                          </span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-white">
                            {account.ph_rep_phone || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 4: Lot & Architectural Build Specifications ──── */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <IdCardIcon className="w-4 h-4 text-amber-500" />
                  <h3>Target Lot &amp; Architectural Project Profile</h3>
                  <span className="dossier-step-tag">Step 4 Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <DataField
                    label="Intended Architectural Project Type"
                    value={account.target_project_type || "Not specified"}
                    sub="Selected structural design archetype"
                    highlight
                  />
                  <DataField
                    label="Lot Ownership Status"
                    value={account.lot_ownership_status || "Not specified"}
                    sub="Title / land deed qualification"
                  />
                  <DataField
                    label="Subdivision & Lot Specifications"
                    value={account.subdivision_lot_details || "Not specified"}
                    sub="Block, Lot & Phase breakdown"
                  />
                  <DataField
                    label="Target Construction Municipality"
                    value={account.target_build_location || account.location_address || "Not specified"}
                    sub="Intended building site (Philippines)"
                  />
                </div>
              </div>

              {/* ── Section 5: Consultation Inquiries & Project Briefs ───── */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <ClipboardListIcon className="w-4 h-4 text-amber-500" />
                  <h3>Consultation Inquiries &amp; Project Briefs</h3>
                  <span className="dossier-counter-pill">
                    {briefs.length} {briefs.length === 1 ? "Brief" : "Briefs"}
                  </span>
                </div>

                {briefs.length === 0 ? (
                  <div className="briefs-empty-strip">
                    <ClipboardListIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="flex-1 text-xs">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        No formal consultation inquiry briefs filed yet.
                      </span>
                      <span className="text-neutral-500 block text-[11px] font-mono mt-0.5">
                        Inquiry briefs submitted through the Client Portal will automatically attach to this customer record.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {briefs.map((b, i) => (
                      <div key={b.id || b.brief_id || i} className="brief-card">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <HashIcon className="w-3.5 h-3.5 text-amber-500" />
                            {b.projectType || b.project_type || "Residential Construction"}
                          </span>
                          <span
                            className={`brief-status-tag ${
                              (b.status || "").toLowerCase().includes("approved")
                                ? "approved"
                                : (b.status || "").toLowerCase().includes("pending")
                                ? "pending"
                                : "default"
                            }`}
                          >
                            {b.status || "Open / In Review"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                          {b.location && (
                            <div>
                              <span className="text-neutral-400 text-[10px] block">Location:</span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {b.location}
                              </span>
                            </div>
                          )}
                          {(b.budgetRange || b.budget_range) && (
                            <div>
                              <span className="text-neutral-400 text-[10px] block">Budget Range:</span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {b.budgetRange || b.budget_range}
                              </span>
                            </div>
                          )}
                          {b.venue_type && (
                            <div>
                              <span className="text-neutral-400 text-[10px] block">Meeting Preference:</span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {b.venue_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Modal Footer Bar ────────────────────────────────────────── */}
          <div className="dossier-footer">
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                MCPA Client Identity Verification Record • All customer information is securely stored under Republic Act 10173.
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="dossier-footer-close-btn"
            >
              Close Dossier
            </button>
          </div>
        </div>

        {/* ── Formal Black & White Word Document Exclusively for Print ─── */}
        <div className="dossier-print-sheet">
          <ClientWordDocument account={account} clientBriefs={clientBriefs} />
        </div>
      </div>
    </>
  );
}

// ─── Main Grid Card Component ─────────────────────────────────────────────────
function AccountCard({ acc, onClick, isNewFlash = false }) {
  const colors = getAvatarGradient(acc.full_name);
  const isOfw = (acc.client_type || "").toLowerCase() === "ofw";
  const inquiries = parseInt(acc.total_inquiries || "0", 10);
  const initials = getInitials(acc.full_name);
  const hasPhoto = Boolean(acc.avatar_url && acc.avatar_url.trim().length > 5);

  return (
    <div
      onClick={() => onClick(acc)}
      className={`client-directory-card group ${isNewFlash ? "card-live-flash" : ""}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(acc);
        }
      }}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar (Photo or Monogram) */}
          <div className="client-avatar-frame">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={acc.avatar_url}
                alt={acc.full_name || acc.email}
                className="client-avatar-img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            ) : (
              <div
                className="client-avatar-monogram"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                }}
              >
                {initials}
              </div>
            )}
            {acc.kyc_photo_url ? (
              <span className="client-avatar-verified-dot" title="Official Biometric Face KYC Verified">
                <CheckIcon className="w-2 h-2 text-white stroke-[3]" />
              </span>
            ) : hasPhoto ? (
              <span className="client-avatar-verified-dot" title="Identity Verified">
                <CheckIcon className="w-2 h-2 text-white stroke-[3]" />
              </span>
            ) : null}
          </div>

          {/* Name & Email */}
          <div className="min-w-0">
            <h3 className="client-card-name group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {acc.full_name || "Client"}
            </h3>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(acc.email || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Click to compose email directly in Gmail"
              className="client-card-email hover:text-amber-500 hover:underline transition-colors inline-flex items-center gap-1 group/mail cursor-pointer"
            >
              <span className="truncate">{acc.email}</span>
              <ExternalLinkIcon className="w-2.5 h-2.5 opacity-0 group-hover/mail:opacity-100 transition-opacity shrink-0 text-amber-500" />
            </a>
          </div>
        </div>

        {/* Classification Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isNewFlash && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-neutral-950 font-bold text-[9px] uppercase font-mono animate-bounce tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950"></span>
              <span>LIVE NEW</span>
            </span>
          )}
          <span className={`client-card-pill ${isOfw ? "ofw" : "local"}`}>
            {isOfw ? <PlaneIcon className="w-2.5 h-2.5" /> : <MapPinIcon className="w-2.5 h-2.5" />}
            <span>{isOfw ? "OFW" : "Local"}</span>
          </span>
          {(acc.auth_provider || "").toLowerCase() === "google" && (
            <span className="client-card-pill google-pill" title="Verified Google Account">
              <GoogleIcon className="w-2.5 h-2.5 shrink-0" />
              <span>Google</span>
            </span>
          )}
          {(acc.auth_provider || "").toLowerCase() === "facebook" && (
            <span className="client-card-pill facebook-pill" title="Verified Facebook Account">
              <FacebookIcon className="w-2.5 h-2.5 shrink-0" />
              <span>Facebook</span>
            </span>
          )}
          {acc.auth_provider && !["google", "facebook", "local"].includes(acc.auth_provider.toLowerCase()) && (
            <span className="client-card-pill oauth">
              <BadgeCheckIcon className="w-2.5 h-2.5" />
              <span>{acc.auth_provider}</span>
            </span>
          )}
        </div>
      </div>

      <div className="client-card-divider" />

      {/* Meta Specifications */}
      <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        {/* Occupation */}
        <div className="client-meta-line">
          <BuildingIcon className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          <span className="truncate">
            {acc.occupation || "Not declared"}
          </span>
        </div>

        {/* Location */}
        <div className="client-meta-line">
          <MapPinIcon className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          {acc.location_address ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.location_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open address in Google Maps"
              className="truncate hover:text-amber-500 hover:underline cursor-pointer transition-colors"
            >
              {acc.location_address}
            </a>
          ) : (
            <span className="truncate">
              {isOfw ? (acc.ofw_country || "Overseas") : "No address specified"}
            </span>
          )}
        </div>

        {/* Phone */}
        <div className="client-meta-line">
          <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          {acc.phone_number ? (
            <a
              href={`tel:${acc.phone_number.replace(/\s+/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              title="Click to call mobile number"
              className="font-mono text-[11px] truncate hover:text-amber-500 hover:underline cursor-pointer transition-colors"
            >
              {acc.phone_number}
            </a>
          ) : (
            <span className="font-mono text-[11px] truncate">
              No contact recorded
            </span>
          )}
          {acc.has_viber_whatsapp && acc.phone_number && (
            <a
              href={`https://wa.me/${acc.phone_number.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open in WhatsApp / Viber"
              className="mini-viber-pill hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
            >
              Viber/WA
            </a>
          )}
        </div>
      </div>

      {/* Card Footer Action Bar */}
      <div className="client-card-footer">
        <span className="client-inquiries-counter">
          <ClipboardListIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>{inquiries > 0 ? `${inquiries} Inquiry Brief${inquiries > 1 ? "s" : ""}` : "0 Briefs"}</span>
        </span>
        <span className="client-cta-link">
          <span>View Dossier</span>
          <ExternalLinkIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}

// ─── KPI Metric Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, active, onClick, borderClass, valueClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kpi-summary-box ${active ? "active " + borderClass : ""}`}
    >
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${valueClass}`}>{value}</span>
      <span className="kpi-sub">{sub}</span>
    </button>
  );
}

// ─── Main Export: AccountsTab ──────────────────────────────────────────────────
export default function AccountsTab({ clientBriefs = [] }) {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newAccountFlashId, setNewAccountFlashId] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  const fetchAccounts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      const res = await authFetch("/api/admin/accounts");
      const data = await res.json();
      if (res.status === 401) {
        setFetchError("Admin session expired or token missing. Please sign in again.");
        return;
      }
      if (res.ok && data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      } else {
        setFetchError(data.message || "Could not retrieve accounts from database.");
      }
    } catch (e) {
      console.warn("Could not load accounts from server:", e);
      setFetchError("Unable to connect to the backend server. Please verify backend is running on port 5000.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Real-time Dual Transport Connection (Native WebSocket + Server-Sent Events SSE + Silent Polling)
  useEffect(() => {
    let ws = null;
    let eventSource = null;
    let pollInterval = null;
    let isMounted = true;

    const handleRealtimePayload = (payload) => {
      if (!payload || !isMounted) return;
      const { type, data } = payload;

      if (type === "ACCOUNT_REGISTERED") {
        const newAcc = data?.account;
        if (newAcc) {
          setAccounts((prev) => {
            const exists = prev.some(
              (a) =>
                String(a.user_id) === String(newAcc.user_id) ||
                (a.email && a.email.toLowerCase() === (newAcc.email || "").toLowerCase())
            );
            if (exists) {
              return prev.map((a) =>
                String(a.user_id) === String(newAcc.user_id) ||
                (a.email && a.email.toLowerCase() === (newAcc.email || "").toLowerCase())
                  ? { ...a, ...newAcc }
                  : a
              );
            }
            return [{ ...newAcc, total_inquiries: 0 }, ...prev];
          });

          // Flash highlight the newly entered card
          setNewAccountFlashId(newAcc.user_id);
          setTimeout(() => {
            if (isMounted) setNewAccountFlashId(null);
          }, 8000);

          // Toast alert banner
          setLiveToast({
            title: "New Client Registered",
            name: newAcc.full_name || newAcc.email,
            subtitle: `${newAcc.client_type || "Local"} • ${newAcc.location_address || "Registered Just Now"}`,
          });
          setTimeout(() => {
            if (isMounted) setLiveToast(null);
          }, 6000);
        }
      } else if (type === "ACCOUNT_UPDATED") {
        const updatedAcc = data?.account;
        if (updatedAcc) {
          setAccounts((prev) =>
            prev.map((a) =>
              String(a.user_id) === String(updatedAcc.user_id) ||
              (a.email && a.email.toLowerCase() === (updatedAcc.email || "").toLowerCase())
                ? { ...a, ...updatedAcc }
                : a
            )
          );
        }
      } else if (type === "ACCOUNT_DELETED") {
        const targetEmail = (data?.email || "").toLowerCase();
        const targetId = data?.userId;
        setAccounts((prev) =>
          prev.filter(
            (a) =>
              String(a.user_id) !== String(targetId) &&
              (a.email || "").toLowerCase() !== targetEmail
          )
        );
      } else if (type === "BRIEF_SUBMITTED") {
        fetchAccounts(true);
      }
    };

    // 1. WebSocket Channel
    try {
      const isHttps = window.location.protocol === "https:";
      const wsProto = isHttps ? "wss:" : "ws:";
      const host =
        window.location.port === "3000"
          ? `${window.location.hostname}:5000`
          : window.location.host;
      ws = new WebSocket(`${wsProto}//${host}/ws/accounts`);

      ws.onopen = () => {};

      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleRealtimePayload(parsed);
        } catch (err) {}
      };

      ws.onclose = () => {
        // Will fallback to SSE
      };

      ws.onerror = () => {
        // Will fallback to SSE
      };
    } catch (e) {}

    // 2. Server-Sent Events (SSE) Channel
    try {
      eventSource = new EventSource("/api/admin/realtime-stream");

      eventSource.onopen = () => {};

      eventSource.addEventListener("ACCOUNT_REGISTERED", (e) => {
        try {
          handleRealtimePayload(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.addEventListener("ACCOUNT_UPDATED", (e) => {
        try {
          handleRealtimePayload(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.addEventListener("ACCOUNT_DELETED", (e) => {
        try {
          handleRealtimePayload(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.addEventListener("BRIEF_SUBMITTED", (e) => {
        try {
          handleRealtimePayload(JSON.parse(e.data));
        } catch (err) {}
      });
    } catch (e) {}

    // 3. Ambient Silent Background Sync (Every 5s for zero drift)
    pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAccounts(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (ws) {
        try {
          ws.close();
        } catch (e) {}
      }
      if (eventSource) {
        try {
          eventSource.close();
        } catch (e) {}
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        (acc.full_name || "").toLowerCase().includes(q) ||
        (acc.email || "").toLowerCase().includes(q) ||
        (acc.phone_number || "").toLowerCase().includes(q) ||
        (acc.occupation || "").toLowerCase().includes(q) ||
        (acc.target_project_type || "").toLowerCase().includes(q) ||
        (acc.location_address || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterType === "local") return (acc.client_type || "").toLowerCase() === "local";
    if (filterType === "ofw") return (acc.client_type || "").toLowerCase() === "ofw";
    if (filterType === "inquiries") return parseInt(acc.total_inquiries || "0", 10) > 0;
    return true;
  });

  const totalCount = accounts.length;
  const localCount = accounts.filter((a) => (a.client_type || "").toLowerCase() === "local").length;
  const ofwCount = accounts.filter((a) => (a.client_type || "").toLowerCase() === "ofw").length;
  const withInquiriesCount = accounts.filter((a) => parseInt(a.total_inquiries || "0", 10) > 0).length;

  return (
    <>
      <style>{PAGE_STYLES}</style>

      <div className="space-y-6">
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 font-bold mb-1">
              <IdCardIcon className="w-3 h-3" />
              <span>Client Registry</span>
              <span className="opacity-40">•</span>
              <span>Accounts Directory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Client Accounts Directory
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              Verified customer identities, biometric KYC records, contact channels &amp; project specifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Grid / Table toggle */}
            <div className="view-toggle-group">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                title="Card Grid View"
              >
                <LayoutGridIcon className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                title="Table List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchAccounts(false)}
              className="px-3.5 py-2 rounded-[4px] border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-transparent"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Authentication / Connection Notice ────────────────────────── */}
        {fetchError && (
          <div className="p-3.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-neutral-950 px-2 py-0.5 rounded font-mono">
                Session Notice
              </span>
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("mcpa_admin_authenticated");
                sessionStorage.removeItem("mcpa_admin_authenticated");
                localStorage.removeItem("mcpa_admin_token");
                sessionStorage.removeItem("mcpa_admin_token");
                localStorage.removeItem("mcpa_admin_user");
                sessionStorage.removeItem("mcpa_admin_user");
                window.location.reload();
              }}
              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all text-center cursor-pointer text-xs shrink-0"
            >
              Log In Again
            </button>
          </div>
        )}

        {/* ── KPI Cards (clickable filters) ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Total Clients"
            value={totalCount}
            sub="Registered Users"
            valueClass="text-neutral-900 dark:text-white"
            borderClass="border-amber-500"
            onClick={() => setFilterType("all")}
            active={filterType === "all"}
          />
          <KpiCard
            label="Local Residents"
            value={localCount}
            sub="Bulacan &amp; NCR"
            valueClass="text-amber-600 dark:text-amber-400"
            borderClass="border-amber-500"
            onClick={() => setFilterType("local")}
            active={filterType === "local"}
          />
          <KpiCard
            label="OFW Clients"
            value={ofwCount}
            sub="Overseas Workers"
            valueClass="text-blue-600 dark:text-blue-400"
            borderClass="border-blue-500"
            onClick={() => setFilterType("ofw")}
            active={filterType === "ofw"}
          />
          <KpiCard
            label="With Inquiries"
            value={withInquiriesCount}
            sub="Active Briefs"
            valueClass="text-emerald-600 dark:text-emerald-400"
            borderClass="border-emerald-500"
            onClick={() => setFilterType("inquiries")}
            active={filterType === "inquiries"}
          />
        </div>

        {/* ── Search & Filter bar ───────────────────────────────────────── */}
        <div className="p-3.5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email, phone, occupation, or location…"
              className="w-full pl-9 pr-4 py-2 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
            <SearchIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: "all", label: "All Accounts" },
              { id: "local", label: "Local Clients" },
              { id: "ofw", label: "OFW Clients" },
              { id: "inquiries", label: "Has Inquiries" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-[4px] text-[11px] font-mono transition-all cursor-pointer ${
                  filterType === f.id
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                    : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content View ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="accounts-state-box">
            <div className="accounts-spinner" />
            <p>Loading verified client directory…</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          searchQuery.trim() || filterType !== "all" ? (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/msoeawqm.json"
              badgeText="Filter Active"
              title="No Matching Clients Found"
              description={`No client accounts match "${searchQuery || filterType}". Try adjusting your keywords or clearing the active filters.`}
              actionButton={
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs transition-colors cursor-pointer"
                >
                  Clear Filters &amp; Search
                </button>
              }
            />
          ) : (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/dxjqoygy.json"
              badgeText="Client Directory Standby"
              title="No Client Accounts Yet"
              description="Customer registrations and homeowner profiles submitted through the website will automatically appear here."
            />
          )
        ) : viewMode === "grid" ? (
          /* Cards Grid View */
          <div className="accounts-grid">
            {filteredAccounts.map((acc) => (
              <AccountCard
                key={acc.user_id}
                acc={acc}
                onClick={setSelectedAccount}
                isNewFlash={String(acc.user_id) === String(newAccountFlashId)}
              />
            ))}
          </div>
        ) : (
          /* Structured Table View */
          <div className="rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="py-3 px-4">Client Identity &amp; KYC</th>
                    <th className="py-3 px-4">Profession / Company</th>
                    <th className="py-3 px-4">Contact &amp; Telephony</th>
                    <th className="py-3 px-4">Location / Territory</th>
                    <th className="py-3 px-4">Project Target</th>
                    <th className="py-3 px-4">Briefs</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/5 text-neutral-700 dark:text-neutral-300">
                  {filteredAccounts.map((acc) => {
                    const isOfw = (acc.client_type || "").toLowerCase() === "ofw";
                    const inquiries = parseInt(acc.total_inquiries || "0", 10);
                    const colors = getAvatarGradient(acc.full_name);
                    const initials = getInitials(acc.full_name);
                    const hasPhoto = Boolean(acc.avatar_url && acc.avatar_url.trim().length > 5);

                    const isCardFlash = String(acc.user_id) === String(newAccountFlashId);

                    return (
                      <tr
                        key={acc.user_id}
                        className={`hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                          isCardFlash ? "row-live-flash" : ""
                        }`}
                        onClick={() => setSelectedAccount(acc)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              {hasPhoto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={acc.avatar_url}
                                  alt={acc.full_name}
                                  className="w-8 h-8 rounded-[4px] object-cover border border-neutral-300 dark:border-neutral-700"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-[4px] font-bold text-[11px] flex items-center justify-center text-white"
                                  style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                                >
                                  {initials}
                                </div>
                              )}
                              {acc.kyc_photo_url ? (
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-neutral-900 flex items-center justify-center" title="Biometric KYC Verified">
                                  <CheckIcon className="w-2 h-2 text-white stroke-[3]" />
                                </span>
                              ) : hasPhoto ? (
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white dark:border-neutral-900 flex items-center justify-center" title="Identity Active">
                                  <CheckIcon className="w-2 h-2 text-white stroke-[3]" />
                                </span>
                              ) : null}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {isCardFlash && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-neutral-950 font-bold text-[9px] uppercase font-mono animate-bounce tracking-wider shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-950"></span>
                                    <span>LIVE NEW</span>
                                  </span>
                                )}
                                <span className="font-bold text-neutral-900 dark:text-white block font-sans text-[13px]">
                                  {acc.full_name || "Client"}
                                </span>
                                {(acc.auth_provider || "").toLowerCase() === "google" && (
                                  <span title="Verified Google Account"><GoogleIcon className="w-3 h-3 shrink-0" /></span>
                                )}
                                {(acc.auth_provider || "").toLowerCase() === "facebook" && (
                                  <span title="Verified Facebook Account"><FacebookIcon className="w-3 h-3 shrink-0" /></span>
                                )}
                              </div>
                              <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(acc.email || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Compose email directly in Gmail"
                                className="text-[11px] text-neutral-500 hover:text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{acc.email}</span>
                                <ExternalLinkIcon className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="block text-neutral-900 dark:text-white font-medium truncate max-w-[150px]">
                            {acc.occupation || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {acc.phone_number ? (
                              <a
                                href={`tel:${acc.phone_number.replace(/\s+/g, "")}`}
                                onClick={(e) => e.stopPropagation()}
                                title="Click to call mobile"
                                className="text-neutral-900 dark:text-white hover:text-amber-500 hover:underline cursor-pointer"
                              >
                                {acc.phone_number}
                              </a>
                            ) : (
                              <span>—</span>
                            )}
                            {acc.has_viber_whatsapp && acc.phone_number && (
                              <a
                                href={`https://wa.me/${acc.phone_number.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open WhatsApp chat"
                                className="sidebar-viber-pill hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                              >
                                Viber/WA
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {isOfw ? (
                              <PlaneIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            {acc.location_address ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.location_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open address in Google Maps"
                                className="truncate max-w-[160px] text-neutral-800 dark:text-neutral-200 hover:text-amber-500 hover:underline cursor-pointer"
                              >
                                {acc.location_address}
                              </a>
                            ) : (
                              <span className="truncate max-w-[160px] text-neutral-800 dark:text-neutral-200">
                                {isOfw ? (acc.ofw_country || "Overseas") : "—"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="truncate max-w-[140px] block text-neutral-700 dark:text-neutral-300">
                            {acc.target_project_type || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold ${
                              inquiries > 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "text-neutral-400"
                            }`}
                          >
                            {inquiries} Brief{inquiries !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {formatDate(acc.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccount(acc);
                            }}
                            className="px-2.5 py-1 rounded-[3px] bg-neutral-100 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 font-bold text-[10px] uppercase transition-colors cursor-pointer"
                          >
                            View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Client Dossier Modal Overlay ─────────────────────────────── */}
      {selectedAccount && (
        <ClientDossierModal
          account={selectedAccount}
          clientBriefs={clientBriefs}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {/* ── Floating Real-time Toast Notification (Live Registrations) ─── */}
      {liveToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 pr-4 rounded-xl bg-neutral-950/95 dark:bg-[#10131c]/95 text-white border border-amber-500/50 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 max-w-sm pointer-events-auto"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <UserPlusIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-bold text-amber-400 font-mono text-[10px] uppercase tracking-wider">
                {liveToast.title}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            </div>
            <div className="font-bold text-neutral-100 text-xs truncate font-sans">
              {liveToast.name}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono truncate">
              {liveToast.subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            className="text-neutral-400 hover:text-white p-1 rounded-md text-xs cursor-pointer ml-1"
            title="Dismiss notification"
          >
            ✕
          </button>
        </aside>
      )}
    </>
  );
}

// ─── Scoped Clean CSS Styles (Architectural, Human-Designed) ───────────────────
const PAGE_STYLES = `
.view-toggle-group {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px;
}
.dark .view-toggle-group {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}
.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.15s ease;
}
.dark .view-toggle-btn {
  color: #9ca3af;
}
.view-toggle-btn.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.dark .view-toggle-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.kpi-summary-box {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all 0.18s ease;
}
.dark .kpi-summary-box {
  background: #101218;
  border-color: rgba(255, 255, 255, 0.06);
}
.kpi-summary-box:hover {
  border-color: #d97706;
}
.kpi-summary-box.active {
  border-width: 2px;
  border-color: #d97706;
  background: rgba(217, 119, 6, 0.04);
}
.dark .kpi-summary-box.active {
  background: rgba(217, 119, 6, 0.08);
}
.kpi-label {
  font-size: 10px;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  font-weight: 600;
}
.dark .kpi-label {
  color: #9ca3af;
}
.kpi-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  font-feature-settings: "tnum";
}
.kpi-sub {
  font-size: 10px;
  font-family: monospace;
  color: #9ca3af;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.client-directory-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.dark .client-directory-card {
  background: #101218;
  border-color: rgba(255, 255, 255, 0.06);
}
.client-directory-card:hover {
  transform: translateY(-2px);
  border-color: #d97706;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}
.dark .client-directory-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.client-directory-card.card-live-flash {
  border-color: #f59e0b !important;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3), 0 8px 24px rgba(245, 158, 11, 0.2) !important;
  animation: liveCardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1), livePulseGlow 2.5s infinite ease-in-out;
}

@keyframes liveCardEntrance {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes livePulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3), 0 8px 24px rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.5), 0 12px 32px rgba(245, 158, 11, 0.3);
  }
}

tr.row-live-flash {
  background-color: rgba(245, 158, 11, 0.14) !important;
  animation: liveRowEntrance 0.6s ease-out;
}

@keyframes liveRowEntrance {
  0% {
    opacity: 0;
    background-color: rgba(245, 158, 11, 0.35);
  }
  100% {
    opacity: 1;
    background-color: rgba(245, 158, 11, 0.14);
  }
}

.client-avatar-frame {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.client-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}
.dark .client-avatar-img {
  border-color: rgba(255, 255, 255, 0.12);
}
.client-avatar-monogram {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
}
.client-avatar-verified-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark .client-avatar-verified-dot {
  border-color: #101218;
}

.client-card-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .client-card-name {
  color: #ffffff;
}
.client-card-email {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .client-card-email {
  color: #9ca3af;
}

.client-card-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 9px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
}
.client-card-pill.local {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.25);
}
.dark .client-card-pill.local {
  background: rgba(217, 119, 6, 0.15);
  color: #fbbf24;
  border-color: rgba(217, 119, 6, 0.3);
}
.client-card-pill.ofw {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.25);
}
.dark .client-card-pill.ofw {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
  border-color: rgba(37, 99, 235, 0.3);
}
.client-card-pill.oauth {
  background: rgba(0, 0, 0, 0.05);
  color: #4b5563;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.dark .client-card-pill.oauth {
  background: rgba(255, 255, 255, 0.06);
  color: #d1d5db;
  border-color: rgba(255, 255, 255, 0.1);
}
.client-card-pill.google-pill {
  background: #ffffff;
  color: #1f2937;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.dark .client-card-pill.google-pill {
  background: rgba(255, 255, 255, 0.08);
  color: #f3f4f6;
  border-color: rgba(255, 255, 255, 0.18);
}
.client-card-pill.facebook-pill {
  background: rgba(24, 119, 242, 0.1);
  color: #1877f2;
  border: 1px solid rgba(24, 119, 242, 0.25);
}
.dark .client-card-pill.facebook-pill {
  background: rgba(24, 119, 242, 0.18);
  color: #60a5fa;
  border-color: rgba(24, 119, 242, 0.35);
}

.client-card-divider {
  height: 1px;
  background: #f3f4f6;
}
.dark .client-card-divider {
  background: rgba(255, 255, 255, 0.05);
}

.client-meta-line {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.mini-viber-pill {
  font-size: 8px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  background: #7c3aed;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: auto;
}

.client-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  margin-top: auto;
  border-top: 1px dashed #e5e7eb;
}
.dark .client-card-footer {
  border-color: rgba(255, 255, 255, 0.06);
}
.client-inquiries-counter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #4b5563;
}
.dark .client-inquiries-counter {
  color: #9ca3af;
}
.client-cta-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  color: #d97706;
  text-transform: uppercase;
}
.dark .client-cta-link {
  color: #f59e0b;
}

.accounts-state-box {
  padding: 48px 16px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
}
.dark .accounts-state-box {
  background: #101218;
  border-color: rgba(255, 255, 255, 0.06);
  color: #9ca3af;
}
.accounts-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(217, 119, 6, 0.2);
  border-top-color: #d97706;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

const DOSSIER_STYLES = `
.dossier-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 12, 18, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dossier-modal {
  width: 100%;
  max-width: 1060px;
  max-height: 92vh;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dark .dossier-modal {
  background: #0e1118;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
}

.dossier-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: #fafafa;
  flex-shrink: 0;
}
.dark .dossier-header {
  background: #11141e;
  border-color: rgba(255, 255, 255, 0.08);
}
.dossier-header-title-group {
  min-width: 0;
}
.dossier-brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: #b45309;
}
.dark .dossier-brand-pill {
  color: #fbbf24;
}
.dossier-brand-logo {
  background: #d97706;
  color: #111827;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 900;
}
.dossier-brand-sep {
  opacity: 0.35;
}
.dossier-client-name {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
}
.dark .dossier-client-name {
  color: #ffffff;
}
.dossier-uid-badge {
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  color: #4b5563;
}
.dark .dossier-uid-badge {
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
}
.dossier-segment-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px;
  text-transform: uppercase;
}
.dossier-segment-pill.local {
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.25);
}
.dark .dossier-segment-pill.local {
  background: rgba(217, 119, 6, 0.2);
  color: #fbbf24;
  border-color: rgba(217, 119, 6, 0.35);
}
.dossier-segment-pill.ofw {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.25);
}
.dark .dossier-segment-pill.ofw {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
  border-color: rgba(37, 99, 235, 0.35);
}
.dossier-client-sub {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
  margin-top: 3px;
}
.dark .dossier-client-sub {
  color: #9ca3af;
}

.dossier-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dossier-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dark .dossier-action-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  color: #d1d5db;
}
.dossier-action-btn:hover {
  border-color: #d97706;
  color: #d97706;
}
.dossier-action-btn.word-download-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}
.dark .dossier-action-btn.word-download-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}
.dossier-action-btn.pdf-download-btn:hover {
  border-color: #e11d48;
  color: #e11d48;
}
.dark .dossier-action-btn.pdf-download-btn:hover {
  border-color: #fb7185;
  color: #fb7185;
}
.dossier-close-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dark .dossier-close-btn {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  color: #9ca3af;
}
.dossier-close-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

/* Dossier Body Layout */
.dossier-body {
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  flex: 1;
}
@media (max-width: 820px) {
  .dossier-body {
    grid-template-columns: 1fr;
  }
}

/* Sidebar */
.dossier-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dossier-photos-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (max-width: 640px) {
  .dossier-photos-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
.kyc-photo-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dark .kyc-photo-card {
  background: #11141f;
  border-color: rgba(255, 255, 255, 0.08);
}
.kyc-photo-card.pfp-card {
  border-left: 3px solid #3b82f6;
}
.dark .kyc-photo-card.pfp-card {
  border-left: 3px solid #60a5fa;
}
.kyc-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.kyc-photo-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kyc-photo-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d1d5db;
  background: #000000;
}
.dark .kyc-photo-container {
  border-color: rgba(255, 255, 255, 0.15);
}
.kyc-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}
.kyc-photo-container:hover .kyc-photo-img {
  transform: scale(1.03);
}
.kyc-photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.kyc-photo-container:hover .kyc-photo-overlay {
  opacity: 1;
}

.kyc-placeholder-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  border: 1.5px dashed rgba(217, 119, 6, 0.4);
  background: rgba(217, 119, 6, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dark .kyc-placeholder-container {
  background: rgba(217, 119, 6, 0.05);
  border-color: rgba(217, 119, 6, 0.35);
}
.kyc-placeholder-container:hover {
  border-color: #d97706;
  background: rgba(217, 119, 6, 0.08);
}

.kyc-monogram-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}
.kyc-monogram-text {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.kyc-status-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  line-height: 1.2;
}
.kyc-status-bar.verified {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.dark .kyc-status-bar.verified {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.35);
}
.kyc-status-bar.oauth {
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.3);
}
.dark .kyc-status-bar.oauth {
  background: rgba(217, 119, 6, 0.18);
  color: #fbbf24;
  border-color: rgba(217, 119, 6, 0.35);
}
.kyc-status-bar.pfp {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.25);
}
.dark .kyc-status-bar.pfp {
  background: rgba(37, 99, 235, 0.18);
  color: #60a5fa;
  border-color: rgba(37, 99, 235, 0.35);
}
.kyc-status-bar.neutral {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.dark .kyc-status-bar.neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border-color: rgba(255, 255, 255, 0.08);
}

.kyc-photo-caption {
  border-top: 1px dashed #e5e7eb;
  padding-top: 6px;
}
.dark .kyc-photo-caption {
  border-color: rgba(255, 255, 255, 0.08);
}

.sidebar-section-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
}
.dark .sidebar-section-card {
  background: #11141f;
  border-color: rgba(255, 255, 255, 0.06);
}
.sidebar-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  color: #374151;
  margin-bottom: 10px;
}
.dark .sidebar-card-title {
  color: #e5e7eb;
}
.sidebar-meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-meta-label {
  font-size: 10px;
  font-family: monospace;
  color: #6b7280;
  text-transform: uppercase;
}
.dark .sidebar-meta-label {
  color: #9ca3af;
}
.sidebar-viber-pill {
  font-size: 8px;
  font-family: monospace;
  font-weight: 700;
  background: #7c3aed;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}
.security-card {
  border-left: 3px solid #10b981;
}

/* Main Dossier Content */
.dossier-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dossier-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dark .dossier-panel {
  background: #11141e;
  border-color: rgba(255, 255, 255, 0.06);
}
.dossier-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}
.dark .dossier-panel-header {
  border-color: rgba(255, 255, 255, 0.05);
}
.dossier-panel-header h3 {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}
.dark .dossier-panel-header h3 {
  color: #f3f4f6;
}
.dossier-step-tag {
  font-size: 9px;
  font-family: monospace;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  margin-left: auto;
}
.dossier-counter-pill {
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 3px;
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.25);
  margin-left: auto;
}
.dark .dossier-counter-pill {
  background: rgba(217, 119, 6, 0.15);
  color: #fbbf24;
}

/* Data Field */
.data-field {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 9px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dark .data-field {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.04);
}
.data-field.highlight {
  border-color: rgba(217, 119, 6, 0.3);
  background: rgba(217, 119, 6, 0.02);
}
.dark .data-field.highlight {
  border-color: rgba(217, 119, 6, 0.35);
  background: rgba(217, 119, 6, 0.04);
}
.data-field-header {
  display: flex;
  align-items: center;
  gap: 5px;
}
.data-field-icon {
  color: #9ca3af;
}
.data-field-label {
  font-size: 9.5px;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 600;
}
.dark .data-field-label {
  color: #9ca3af;
}
.data-field-body {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.data-field-value {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}
.dark .data-field-value {
  color: #f3f4f6;
}
.data-field-value.muted {
  color: #9ca3af;
  font-weight: 400;
}
.data-field-sub {
  font-size: 10px;
  font-family: monospace;
  color: #9ca3af;
  margin-top: 1px;
}
.age-pill {
  font-size: 9px;
  font-family: monospace;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 2px;
  background: #f3f4f6;
  color: #4b5563;
}
.dark .age-pill {
  background: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}
.segment-indicator {
  font-size: 8.5px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 2px;
}
.segment-indicator.local {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}
.dark .segment-indicator.local {
  color: #fbbf24;
}
.segment-indicator.ofw {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}
.dark .segment-indicator.ofw {
  color: #60a5fa;
}

/* OFW Callout */
.ofw-callout-card {
  background: rgba(37, 99, 235, 0.04);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 6px;
  padding: 12px 14px;
}
.dark .ofw-callout-card {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.25);
}

/* Inquiries Section */
.briefs-empty-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.dark .briefs-empty-strip {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.06);
}
.brief-card {
  padding: 12px 14px;
  border-radius: 6px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.dark .brief-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.06);
}
.brief-status-tag {
  font-size: 9.5px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
}
.brief-status-tag.approved {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.dark .brief-status-tag.approved {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
}
.brief-status-tag.pending {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.3);
}
.dark .brief-status-tag.pending {
  background: rgba(217, 119, 6, 0.18);
  color: #fbbf24;
}
.brief-status-tag.default {
  background: rgba(0, 0, 0, 0.05);
  color: #4b5563;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.dark .brief-status-tag.default {
  background: rgba(255, 255, 255, 0.06);
  color: #d1d5db;
}

/* Dossier Footer */
.dossier-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fafafa;
  flex-shrink: 0;
}
.dark .dossier-footer {
  background: #11141e;
  border-color: rgba(255, 255, 255, 0.08);
}
.dossier-footer-close-btn {
  padding: 7px 18px;
  border-radius: 4px;
  background: #111827;
  color: #ffffff;
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  transition: background 0.15s ease;
}
.dark .dossier-footer-close-btn {
  background: #d97706;
  color: #0e1118;
}
.dossier-footer-close-btn:hover {
  background: #d97706;
}
.dark .dossier-footer-close-btn:hover {
  background: #f59e0b;
}

/* Lightbox: Full-Screen Responsive Architecture */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(5, 7, 12, 0.95);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}
.lightbox-dialog {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}
.lightbox-header {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(14, 17, 24, 0.94);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.lightbox-tabs-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.lightbox-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}
.lightbox-tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}
.lightbox-tab-btn.active {
  color: #ffffff;
  background: #d97706;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.35);
}
.lightbox-zoom-bar {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 2px 4px;
}
.lightbox-ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}
.lightbox-ctrl-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
.lightbox-ctrl-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.lightbox-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  cursor: pointer;
  transition: all 0.15s ease;
}
.lightbox-close-btn:hover {
  background: #ef4444;
  color: #ffffff;
}
.lightbox-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 16px;
  background: radial-gradient(circle at center, #111420 0%, #05070a 100%);
  user-select: none;
}
.lightbox-stage-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.lightbox-image {
  max-height: calc(100dvh - 130px);
  max-width: 94vw;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
  user-select: none;
  pointer-events: auto;
}
.lightbox-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 24px;
  border-radius: 12px;
  background: rgba(17, 20, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 440px;
  margin: auto;
}
.lightbox-footer {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(14, 17, 24, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
@media (max-width: 640px) {
  /* Dossier Modal Mobile Architecture */
  .dossier-overlay {
    padding: 0;
  }
  .dossier-modal {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }
  .dossier-header {
    padding: 12px 14px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .dossier-header-actions {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .dossier-action-btn {
    flex: 1;
    justify-content: center;
    padding: 6px 8px;
    font-size: 10.5px;
  }
  .dossier-close-btn {
    padding: 6px 10px;
  }
  .dossier-body {
    padding: 12px;
    gap: 12px;
  }
  .dossier-photos-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .kyc-photo-card {
    padding: 8px;
    gap: 6px;
  }
  .kyc-card-header span {
    font-size: 10px;
  }
  .kyc-status-bar {
    padding: 4px 6px;
    font-size: 9px;
  }
  .dossier-footer {
    padding: 10px 14px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    text-align: center;
  }

  /* Fullscreen Lightbox Mobile Architecture */
  .lightbox-header {
    padding: 8px 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .lightbox-header > div:first-child {
    max-width: calc(100% - 90px);
  }
  .lightbox-tabs-group {
    order: 3;
    width: 100%;
    margin-top: 4px;
    display: flex;
  }
  .lightbox-tab-btn {
    flex: 1;
    justify-content: center;
    padding: 6px 4px;
    font-size: 10.5px;
  }
  .lightbox-body {
    padding: 8px;
  }
  .lightbox-image {
    max-height: calc(100dvh - 130px);
    max-width: 98vw;
  }
  .lightbox-footer {
    padding: 8px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    text-align: center;
  }
}

/* ── Segmented Mode Toggle (Interactive Cards vs Word Document) ── */
.dossier-mode-pills {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px;
  gap: 2px;
}
.dark .dossier-mode-pills {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}
.dossier-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.15s ease;
}
.dark .dossier-mode-btn {
  color: #9ca3af;
}
.dossier-mode-btn.active {
  background: #ffffff;
  color: #111827;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.dark .dossier-mode-btn.active {
  background: #1f2432;
  color: #ffffff;
}

/* ── Screen Document Viewport ── */
.dossier-doc-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #e5e9f0;
  display: flex;
  justify-content: center;
}
.dark .dossier-doc-viewport {
  background: #090b10;
}

/* ── Formal Microsoft Word / Resume Style Document Container ── */
.word-doc-container {
  width: 100%;
  max-width: 820px;
  background: #ffffff;
  color: #111827;
  padding: 38px 46px;
  border: 1px solid #d1d5db;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  font-family: "Calibri", "Segoe UI", Arial, sans-serif;
  line-height: 1.35;
  box-sizing: border-box;
}

.word-doc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.word-doc-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}
.word-doc-logo-box {
  width: 90px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.word-doc-logo-img {
  width: 85px;
  height: auto;
  object-fit: contain;
}
.word-doc-company-details {
  flex: 1;
}
.word-doc-company-name {
  font-size: 14pt;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin: 0 0 2px 0;
  color: #000000;
  line-height: 1.15;
}
.word-doc-company-tagline {
  font-size: 8.5pt;
  font-weight: 600;
  color: #222222;
  margin: 0 0 2px 0;
  letter-spacing: 0.01em;
}
.word-doc-company-sub {
  font-size: 8pt;
  color: #444444;
  margin: 0;
  line-height: 1.25;
}

.word-doc-control-box {
  flex-shrink: 0;
  border: 1.5px solid #000000;
  padding: 3px 6px;
  background: #fbfbfb;
}
.word-doc-control-table {
  border-collapse: collapse;
  font-size: 7.5pt;
  font-family: "Calibri", Arial, sans-serif;
}
.word-doc-control-table td {
  padding: 1.5px 4px;
  border: none;
}
.word-doc-control-table .control-label {
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
}
.word-doc-control-table .control-val {
  font-weight: 600;
  color: #111111;
  font-family: monospace;
}

.word-doc-double-divider {
  border-top: 1px solid #000000;
  border-bottom: 2px solid #000000;
  height: 3px;
  margin: 10px 0 12px 0;
}

.word-doc-title-block {
  text-align: center;
  margin: 0 0 14px 0;
}
.word-doc-main-title {
  font-size: 12.5pt;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 2px 0;
  color: #000000;
}
.word-doc-subtitle {
  font-size: 8pt;
  font-style: italic;
  color: #555555;
  margin: 0;
}

.word-doc-bio-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #cccccc;
}
.word-doc-bio-info {
  flex: 1;
}
.word-doc-client-fullname {
  font-size: 15pt;
  font-weight: 800;
  color: #000000;
  margin: 0 0 2px 0;
  letter-spacing: 0.01em;
  line-height: 1.1;
}
.word-doc-client-occupation {
  font-size: 9.5pt;
  font-weight: 600;
  color: #333333;
  margin: 0 0 6px 0;
}
.word-doc-mini-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 8.5pt;
}
.word-doc-mini-table td {
  padding: 1.5px 0;
  border: none;
  vertical-align: top;
}
.word-doc-mini-table .mini-lbl {
  width: 135px;
  font-weight: 700;
  color: #222222;
}
.word-doc-mini-table .mini-val {
  color: #000000;
  font-weight: 500;
}

.word-doc-photo-box {
  width: 110px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.word-doc-photo-frame {
  width: 105px;
  height: 125px;
  border: 1.5px solid #000000;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 1px;
}
.word-doc-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.word-doc-photo-placeholder {
  font-size: 7.5pt;
  font-weight: 700;
  color: #666666;
  text-align: center;
  padding: 6px;
}
.word-doc-photo-caption {
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  color: #444444;
  letter-spacing: 0.04em;
  text-align: center;
}

.word-doc-section {
  margin-bottom: 9px;
}
.word-doc-sec-heading {
  font-size: 9.5pt;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #000000;
  border-bottom: 1.5px solid #000000;
  padding-bottom: 2px;
  margin: 0 0 4px 0;
}
.word-doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 0 0 5px 0;
}
.word-doc-table th,
.word-doc-table td {
  border: 1px solid #333333;
  padding: 3.5px 6px;
  vertical-align: top;
  line-height: 1.3;
}
.word-doc-table th {
  background: #f2f2f2;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 8pt;
  color: #000000;
  width: 24%;
}
.word-doc-table td {
  color: #111111;
  background: #ffffff;
}
.word-doc-empty-note {
  font-size: 8pt;
  color: #555555;
  font-style: italic;
  margin: 2px 0 5px 0;
}

.word-doc-sign-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  margin-top: 14px;
  padding-top: 8px;
}
.word-doc-sign-col {
  flex: 1;
}
.word-doc-sign-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #222222;
  margin: 0;
}
.word-doc-sign-space {
  height: 36px;
}
.word-doc-sign-line {
  border-bottom: 1.5px solid #000000;
  width: 100%;
  margin-bottom: 3px;
}
.word-doc-signer-name {
  font-size: 9pt;
  font-weight: 800;
  text-transform: uppercase;
  color: #000000;
  margin: 0;
  line-height: 1.2;
}
.word-doc-signer-title {
  font-size: 8pt;
  color: #333333;
  margin: 0;
  line-height: 1.2;
}
.word-doc-signer-sub {
  font-size: 7.5pt;
  color: #666666;
  margin: 0;
}
.word-doc-sign-date {
  font-size: 7.5pt;
  font-weight: 600;
  color: #444444;
  margin: 3px 0 0 0;
}

.word-doc-footer {
  border-top: 1px solid #000000;
  margin-top: 12px;
  padding-top: 5px;
  text-align: center;
}
.word-doc-footer p {
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #555555;
  margin: 0;
}

.dossier-print-sheet {
  display: none;
}

.dossier-print-capture-container {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 794px;
  background: #ffffff;
  color: #111827;
  z-index: -9999;
  pointer-events: none;
  opacity: 1;
}

.dossier-print-capture-container .word-doc-container {
  box-shadow: none !important;
  border: none !important;
  padding: 30px 42px !important;
  margin: 0 !important;
  width: 794px !important;
  max-width: 794px !important;
  background: #ffffff !important;
  color: #111827 !important;
}

@media print {
  .dossier-print-capture-container {
    display: none !important;
  }
  @page {
    size: A4 portrait;
    margin: 8mm 12mm 8mm 12mm;
  }
  body * {
    visibility: hidden !important;
  }
  .dossier-print-sheet,
  .dossier-print-sheet * {
    visibility: visible !important;
  }
  .dossier-overlay {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    display: block !important;
  }
  .dossier-modal {
    display: none !important;
  }
  .dossier-print-sheet {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
  .word-doc-container {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    color: #000000 !important;
    background: #ffffff !important;
  }
  .word-doc-photo-img {
    max-height: 125px !important;
    max-width: 105px !important;
    width: 105px !important;
    height: 125px !important;
    object-fit: cover !important;
  }
  .word-break-avoid {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .word-doc-table th {
    background: #f2f2f2 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;
