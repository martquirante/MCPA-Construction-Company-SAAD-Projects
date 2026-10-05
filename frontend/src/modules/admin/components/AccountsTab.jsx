"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  PrinterIcon,
  Maximize2Icon,
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
function DataField({ label, value, sub, badge, icon, highlight = false }) {
  const displayVal = value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : "—";
  const isMuted = displayVal === "—";

  return (
    <div className={`data-field ${highlight ? "highlight" : ""}`}>
      <div className="data-field-header">
        {icon && <span className="data-field-icon">{icon}</span>}
        <span className="data-field-label">{label}</span>
      </div>
      <div className="data-field-body">
        <span className={`data-field-value ${isMuted ? "muted" : ""}`}>
          {displayVal}
        </span>
        {badge && <div className="data-field-badge">{badge}</div>}
      </div>
      {sub && <span className="data-field-sub">{sub}</span>}
    </div>
  );
}

// ─── SVG Helper Icons for Photo Lightbox ─────────────────────────────────────
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

// ─── Comprehensive Client Dossier Modal ────────────────────────────────────────
function ClientDossierModal({ account, clientBriefs, onClose }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

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

  // Copy full profile summary to clipboard
  const handleCopyProfile = () => {
    const lines = [
      `=== MCPA ARCHITECTURAL CLIENT DOSSIER ===`,
      `Client ID: ${uid}`,
      `Full Name: ${account.full_name || "—"}`,
      `Email: ${account.email || "—"}`,
      `Phone: ${account.phone_number || "—"}${account.has_viber_whatsapp ? " (Viber/WhatsApp Active)" : ""}`,
      `Client Type: ${isOfw ? "Overseas Filipino Worker (OFW)" : "Local Resident (Philippines)"}`,
      account.occupation ? `Occupation: ${account.occupation}` : null,
      account.employer_name ? `Employer/Company: ${account.employer_name}` : null,
      account.monthly_income ? `Income Bracket: ${account.monthly_income}` : null,
      account.civil_status ? `Civil Status: ${account.civil_status}` : null,
      account.spouse_name ? `Spouse: ${account.spouse_name}` : null,
      account.birth_date ? `Birth Date: ${account.birth_date}${age ? ` (${age} years old)` : ""}` : null,
      `Residential Address: ${account.location_address || "—"}`,
      isOfw && account.ofw_country ? `OFW Host Country: ${account.ofw_country}` : null,
      isOfw && account.ph_rep_name ? `PH Representative: ${account.ph_rep_name} (${account.ph_rep_relationship || "Representative"}) - Phone: ${account.ph_rep_phone || "—"}` : null,
      account.target_project_type ? `Target Project: ${account.target_project_type}` : null,
      account.lot_ownership_status ? `Lot Ownership: ${account.lot_ownership_status}` : null,
      account.subdivision_lot_details ? `Lot Specifications: ${account.subdivision_lot_details}` : null,
      account.target_build_location ? `Build Location: ${account.target_build_location}` : null,
      `Registered: ${formatDateTime(account.created_at)}`,
      `Total Briefs: ${briefs.length}`,
    ].filter(Boolean).join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines).then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      });
    }
  };

  const handlePrint = () => {
    window.print();
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
              </div>
              <p className="dossier-client-sub">
                Account registered on {formatDateTime(account.created_at)} via {account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}
              </p>
            </div>

            {/* Header Action Tools */}
            <div className="dossier-header-actions">
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
                onClick={handlePrint}
                className="dossier-action-btn print-only-hide"
                title="Print official client profile dossier"
              >
                <PrinterIcon className="w-3.5 h-3.5" />
                <span>Print</span>
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

          {/* ── Modal Scrollable Body ───────────────────────────────────── */}
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
                      <UserIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {hasAvatarPhoto
                          ? account.auth_provider === "google"
                            ? "Google Account Photo"
                            : account.auth_provider === "facebook"
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
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {account.auth_provider ? account.auth_provider.toUpperCase() : "LOCAL"}
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
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {account.phone_number || "No mobile number recorded"}
                      </span>
                      {account.has_viber_whatsapp && (
                        <span className="sidebar-viber-pill">Viber / WA</span>
                      )}
                    </div>
                  </div>

                  {/* Primary Email */}
                  <div className="sidebar-meta-row">
                    <span className="sidebar-meta-label">Email Address:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200 break-all select-all">
                      {account.email}
                    </span>
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

              {/* ── Section 2: Employment, Profession & Financial Profile ── */}
              <div className="dossier-panel">
                <div className="dossier-panel-header">
                  <BuildingIcon className="w-4 h-4 text-amber-500" />
                  <h3>Employment &amp; Financial Demographics</h3>
                  <span className="dossier-step-tag">Step 2 Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <DataField
                    label="Occupation / Profession"
                    value={account.occupation || "Not declared"}
                    highlight
                  />
                  <DataField
                    label="Employer / Business Firm"
                    value={account.employer_name || "Not specified"}
                  />
                  <DataField
                    label="Stated Monthly Income"
                    value={account.monthly_income || "Not declared"}
                    sub="Declared financial bracket"
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
                    sub="Complete residential location recorded at registration"
                    highlight
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
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {account.ofw_country || "Overseas"}
                          </span>
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
      </div>
    </>
  );
}

// ─── Main Grid Card Component ─────────────────────────────────────────────────
function AccountCard({ acc, onClick }) {
  const colors = getAvatarGradient(acc.full_name);
  const isOfw = (acc.client_type || "").toLowerCase() === "ofw";
  const inquiries = parseInt(acc.total_inquiries || "0", 10);
  const initials = getInitials(acc.full_name);
  const hasPhoto = Boolean(acc.avatar_url && acc.avatar_url.trim().length > 5);

  return (
    <div
      onClick={() => onClick(acc)}
      className="client-directory-card group"
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
            <p className="client-card-email">{acc.email}</p>
          </div>
        </div>

        {/* Classification Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`client-card-pill ${isOfw ? "ofw" : "local"}`}>
            {isOfw ? <PlaneIcon className="w-2.5 h-2.5" /> : <MapPinIcon className="w-2.5 h-2.5" />}
            <span>{isOfw ? "OFW" : "Local"}</span>
          </span>
          {acc.auth_provider && acc.auth_provider !== "local" && (
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
          <span className="truncate">
            {acc.location_address || (isOfw ? (acc.ofw_country || "Overseas") : "No address specified")}
          </span>
        </div>

        {/* Phone */}
        <div className="client-meta-line">
          <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          <span className="font-mono text-[11px] truncate">
            {acc.phone_number || "No contact recorded"}
          </span>
          {acc.has_viber_whatsapp && (
            <span className="mini-viber-pill">Viber/WA</span>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.warn("Could not load accounts from server:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
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
              onClick={fetchAccounts}
              className="px-3.5 py-2 rounded-[4px] border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-transparent"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

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
              <AccountCard key={acc.user_id} acc={acc} onClick={setSelectedAccount} />
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

                    return (
                      <tr
                        key={acc.user_id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
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
                              <span className="font-bold text-neutral-900 dark:text-white block font-sans text-[13px]">
                                {acc.full_name || "Client"}
                              </span>
                              <span className="text-[11px] text-neutral-500 block">{acc.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="block text-neutral-900 dark:text-white font-medium truncate max-w-[150px]">
                            {acc.occupation || "—"}
                          </span>
                          <span className="block text-[10px] text-neutral-400 truncate max-w-[150px]">
                            {acc.employer_name || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{acc.phone_number || "—"}</span>
                            {acc.has_viber_whatsapp && <span className="sidebar-viber-pill">Viber/WA</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {isOfw ? (
                              <PlaneIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[160px] text-neutral-800 dark:text-neutral-200">
                              {acc.location_address || (isOfw ? (acc.ofw_country || "Overseas") : "—")}
                            </span>
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

@media print {
  body * {
    visibility: hidden;
  }
  .dossier-overlay, .dossier-overlay * {
    visibility: visible;
  }
  .dossier-overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0;
    background: transparent;
  }
  .dossier-modal {
    box-shadow: none;
    border: none;
    max-height: none;
    width: 100%;
  }
  .print-only-hide, .dossier-close-btn, .dossier-footer-close-btn {
    display: none !important;
  }
}
`;
