"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CloseIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  Maximize2Icon,
} from "../../shared/Icons";

const emptySubscribe = () => () => {};

/**
 * ProjectDetailsModal — Architectural edition
 *
 * Layout: two-panel on desktop (gallery left, spec sheet right).
 * Stacks to single column on mobile.
 *
 * Design principles applied:
 *   — No colored pill badges. Status/category rendered as editorial metadata row.
 *   — No gradient buttons. No hover:scale or active:scale.
 *   — Rounded corners: 8px modal shell, 6px interactive elements.
 *   — Transitions: 150ms targeted properties only.
 *   — Fullscreen lightbox: purely dark, edge-to-edge image, minimal chrome.
 *   — Icons: pulled directly from shared Icons.jsx (Lucide-derived).
 *   — Full light/dark theme parity.
 */
export default function ProjectDetailsModal({ project, isOpen, onClose, onInquire }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState("gallery");
  const [prevProject, setPrevProject] = useState(project);

  if (project !== prevProject) {
    setPrevProject(project);
    setActivePhotoIdx(0);
    setIsFullscreen(false);
    setMobileTab("gallery");
  }

  const thumbnailRef = useRef(null);
  const fullscreenThumbRef = useRef(null);
  const galleryRef = useRef(null);
  const specsRef = useRef(null);
  const bodyScrollRef = useRef(null);

  const scrollToGallery = () => {
    setMobileTab("gallery");
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToSpecs = () => {
    setMobileTab("specs");
    if (specsRef.current) {
      specsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBodyScroll = (e) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    const scrollTop = e.currentTarget.scrollTop;
    if (specsRef.current && scrollTop >= specsRef.current.offsetTop - 120) {
      setMobileTab("specs");
    } else {
      setMobileTab("gallery");
    }
  };

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const images =
    Array.isArray(project?.images) && project.images.length > 0
      ? project.images
      : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    [thumbnailRef, fullscreenThumbRef].forEach((ref) => {
      if (ref.current) {
        const el = ref.current.children[activePhotoIdx];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    });
  }, [activePhotoIdx]);

  // Auto-advance carousel (paused on hover / fullscreen)
  useEffect(() => {
    if (!isOpen || images.length <= 1 || isHovered || isFullscreen) return;
    const timer = setInterval(() => {
      setActivePhotoIdx((p) => (p + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isOpen, images.length, isHovered, isFullscreen]);

  // Scroll lock + keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("modal-open");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose?.();
      }
      if (e.key === "ArrowRight" && images.length > 1)
        setActivePhotoIdx((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 1)
        setActivePhotoIdx((p) => (p - 1 + images.length) % images.length);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, images.length, isFullscreen]);

  if (!mounted || !isOpen || !project) return null;

  // Touch swipe
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const d = touchStart - touchEnd;
    if (d > 45 && images.length > 1) setActivePhotoIdx((p) => (p + 1) % images.length);
    else if (d < -45 && images.length > 1) setActivePhotoIdx((p) => (p - 1 + images.length) % images.length);
  };

  const handleInquire = () => {
    onClose?.();
    if (onInquire) onInquire(project);
    else router.push(`/book?style=${encodeURIComponent(project.name)}`);
  };

  const defaultFeatures = [
    "Turnkey Structural Framing & Reinforced Footings",
    "Complete Signed & Sealed PRC Blueprints & Municipal Permits",
    "PPR Hot & Cold Waterlines & Heavy-Duty PVC Drainage",
    "Pre-wired Smart Breakers & High-Grade Copper Conduits",
    "All-Weather Anti-Corrosion Exterior Wall Coatings",
    "Standard 15-Year MCPA Structural Warranty Guarantee",
  ];
  const displayFeatures =
    Array.isArray(project.features) && project.features.length > 0
      ? project.features
      : defaultFeatures;

  // Status display map
  const STATUS = {
    in_progress: { label: "In Progress", dot: "bg-amber-400" },
    planning:    { label: "Planning Phase", dot: "bg-sky-400" },
    completed:   { label: "Completed", dot: "bg-emerald-400" },
  };
  const statusInfo = project.status ? STATUS[project.status] : STATUS.completed;

  const dateLabel = (() => {
    if (project.status === "in_progress") return "Ongoing";
    if (project.status === "planning")    return "Planned";
    const parts = [project.month, project.year].filter(Boolean);
    return parts.length ? parts.join(" ") : "—";
  })();

  const navBtn =
    "flex items-center justify-center w-8 h-8 rounded-[4px] " +
    "bg-black/55 hover:bg-black/80 text-white border border-white/15 " +
    "transition-colors duration-150 cursor-pointer shrink-0 select-none";

  return createPortal(
    <>
      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">

        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={project.name}
          className={
            "relative w-full max-w-5xl z-10 flex flex-col " +
            "bg-white dark:bg-[#0f1117] " +
            "border border-neutral-200 dark:border-white/[0.08] " +
            "rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] " +
            "overflow-hidden h-[94vh] sm:h-auto max-h-[94vh] sm:max-h-[90vh]"
          }
        >

          {/* ── STICKY HEADER ──────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 px-4 sm:px-7 py-3 sm:py-4 border-b border-neutral-200 dark:border-white/[0.07] flex items-center justify-between gap-3 bg-white/97 dark:bg-[#0f1117]/97 backdrop-blur-md shrink-0">
            <div className="min-w-0 flex-1">
              {/* Metadata row — editorial, not pill badges */}
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-1.5 flex-wrap">
                {project.category && (
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                    {project.category}
                  </span>
                )}
                {project.category && (
                  <span className="w-px h-3 bg-neutral-300 dark:bg-neutral-700 shrink-0" />
                )}
                {/* Status: label, no colored pill */}
                <div className="flex items-center">
                  <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-neutral-950 dark:text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-none">
                {project.name}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <CloseIcon className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* ── MOBILE TAB SWITCHER (Only on < lg) ────────────────────── */}
          <div className="lg:hidden flex items-center p-1.5 border-b border-neutral-200 dark:border-white/[0.07] bg-neutral-100/90 dark:bg-[#131620] gap-1.5 shrink-0 select-none">
            <button
              type="button"
              onClick={scrollToGallery}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[4px] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                mobileTab === "gallery"
                  ? "bg-white dark:bg-[#1a1e29] text-amber-600 dark:text-amber-400 font-bold shadow-xs border border-neutral-200/80 dark:border-white/10"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span>Gallery ({images.length})</span>
            </button>

            <button
              type="button"
              onClick={scrollToSpecs}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[4px] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                mobileTab === "specs"
                  ? "bg-white dark:bg-[#1a1e29] text-amber-600 dark:text-amber-400 font-bold shadow-xs border border-neutral-200/80 dark:border-white/10"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span>Specs &amp; Scope</span>
            </button>
          </div>

          {/* ── MAIN BODY (two-panel on lg, continuous scroll on mobile) ──── */}
          <div
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
            className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden flex-1 min-h-0 custom-scrollbar scroll-smooth"
          >

            {/* LEFT / TOP ON MOBILE: Gallery panel ───────────────────── */}
            <div
              ref={galleryRef}
              className="w-full lg:w-[55%] lg:min-w-0 flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-white/[0.07] shrink-0 lg:shrink lg:flex-1 lg:overflow-hidden"
            >
              {/* Main image */}
              <div
                className="relative aspect-[16/10] sm:aspect-[16/10] lg:flex-1 lg:aspect-auto bg-neutral-950 cursor-pointer group select-none overflow-hidden shrink-0"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => setIsFullscreen(true)}
                title="Click to view fullscreen"
              >
                {/* Images */}
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ opacity: idx === activePhotoIdx ? 1 : 0, zIndex: idx === activePhotoIdx ? 1 : 0 }}
                  >
                    <Image
                      src={src}
                      alt={`${project.name} — view ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover object-center"
                      unoptimized
                    />
                  </div>
                ))}

                {/* Expand / fullscreen button — minimal icon control, strictly contained */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                  className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
                  aria-label="View fullscreen gallery"
                  title="Expand gallery (Space)"
                >
                  <Maximize2Icon className="w-3.5 h-3.5" />
                </button>

                {/* Prev / Next */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((p) => (p - 1 + images.length) % images.length); }}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${navBtn} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}
                      aria-label="Previous"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((p) => (p + 1) % images.length); }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${navBtn} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}
                      aria-label="Next"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Counter — technical architectural format */}
                {images.length > 1 && (
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 px-2 py-0.5 rounded-[3px] bg-black/70 backdrop-blur-xs text-white/90 text-[9.5px] sm:text-[10px] font-mono tracking-wider border border-white/10 select-none">
                    {String(activePhotoIdx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div
                  ref={thumbnailRef}
                  onWheel={(e) => { if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY; }}
                  className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 overflow-x-auto no-scrollbar scroll-smooth border-t border-neutral-200 dark:border-white/[0.07] bg-neutral-50 dark:bg-white/[0.02] shrink-0"
                >
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      aria-label={`Photo ${idx + 1}`}
                      className={`relative w-13 sm:w-16 aspect-[16/10] rounded-[3px] sm:rounded-[4px] overflow-hidden shrink-0 border transition-[border-color,opacity] duration-150 cursor-pointer ${
                        idx === activePhotoIdx
                          ? "border-amber-500 opacity-100"
                          : "border-neutral-300 dark:border-white/10 opacity-50 hover:opacity-85 hover:border-amber-500/50"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="64px" className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT / BELOW ON MOBILE: Spec sheet panel ─────────────── */}
            <div
              ref={specsRef}
              className="w-full lg:w-[45%] overflow-y-visible lg:overflow-y-auto custom-scrollbar flex-1 min-h-0"
            >
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                {/* Key specs — data table layout */}
                <div className="grid grid-cols-2 gap-px bg-neutral-200 dark:bg-white/[0.07] rounded-[6px] overflow-hidden border border-neutral-200 dark:border-white/[0.07]">
                  {[
                    { label: "Lot Area",     value: project.lotArea    || "Custom Lot"       },
                    { label: "Floor Area",   value: project.floorArea  || "Turnkey Space"    },
                    { label: "Rooms",
                      value: project.bedrooms
                        ? `${project.bedrooms} BR · ${project.bathrooms || "—"} Bath`
                        : "Multi-Zone"                                                        },
                    { label: "Location",    value: project.location   || "Central Luzon"    },
                  ].map((spec, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 p-2.5 sm:p-3.5 bg-white dark:bg-[#0f1117]"
                    >
                      <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 select-none">
                        {spec.label}
                      </span>
                      <p className="text-[11.5px] sm:text-sm font-bold text-neutral-900 dark:text-white leading-snug break-words">
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Engineering standard — architectural technical specification */}
                <div className="rounded-[4px] border border-neutral-200 dark:border-white/[0.08] bg-neutral-50/80 dark:bg-white/[0.02] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-neutral-900 dark:text-neutral-100">
                      MCPA Structural Standard
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                    Constructed per the <span className="font-semibold text-neutral-900 dark:text-neutral-100">National Structural Code of the Philippines (NSCP)</span> with Grade 60 high-tensile rebars, 3,000+ PSI ready-mix concrete, earthquake-tested shear walling, and PRC-licensed architectural &amp; civil engineering sign-offs.
                  </p>
                </div>

                {/* Project narrative */}
                {project.description && (
                  <div>
                    <p className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-1.5 sm:mb-2 select-none">
                      Project Overview & Design Vision
                    </p>
                    <p className="text-[11.5px] sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Scope of works — Architectural Technical Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                    <p className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 select-none">
                      Scope of Works &amp; Specifications
                    </p>
                    <span className="text-[8.5px] sm:text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Technical Schedule
                    </span>
                  </div>

                  <div className="rounded-[4px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                      {displayFeatures.map((feat, idx) => {
                        const isOddCount = displayFeatures.length % 2 !== 0;
                        const isLast = idx === displayFeatures.length - 1;
                        const spansTwo = isOddCount && isLast;

                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 border-b border-neutral-150 dark:border-white/[0.05] ${
                              spansTwo
                                ? "sm:col-span-2 border-b-0"
                                : idx % 2 === 0
                                ? "sm:border-r border-neutral-150 dark:border-white/[0.05]"
                                : ""
                            } hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors duration-100`}
                          >
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 shrink-0 select-none">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[11px] sm:text-[11.5px] text-neutral-700 dark:text-neutral-300 leading-snug">
                              {feat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── STICKY FOOTER ──────────────────────────────────────────── */}
          <div className="sticky bottom-0 z-20 px-4 sm:px-7 py-2.5 sm:py-3.5 border-t border-neutral-200 dark:border-white/[0.07] bg-white/97 dark:bg-[#0f1117]/97 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            {/* Location + date */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 text-[10.5px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5 truncate">
                <MapPinIcon className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">{project.location}</span>
              </span>
              {(project.year || project.month) && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600 shrink-0">·</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <CalendarIcon className="w-3 h-3 shrink-0" />
                    {dateLabel}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Secondary — close */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-[4px] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-semibold text-xs uppercase tracking-[0.06em] hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer shrink-0"
              >
                Close
              </button>

              {/* Primary — inquire */}
              <button
                type="button"
                onClick={handleInquire}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-[0.06em] transition-[background-color] duration-150 cursor-pointer shadow-xs whitespace-nowrap min-w-0"
              >
                <span className="truncate">Inquire For This Style</span>
                <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN LIGHTBOX ────────────────────────────────────────── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100000] bg-black flex flex-col select-none"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Lightbox top bar */}
          <div
            className="flex items-center justify-between px-5 sm:px-8 py-3 border-b border-white/[0.08] bg-black/60 backdrop-blur-md shrink-0 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-white text-sm font-semibold truncate">
                {project.name}
              </span>
              {project.category && (
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                  {project.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {activePhotoIdx + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-8 h-8 rounded-[6px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                aria-label="Exit fullscreen (Esc)"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main fullscreen image */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={images[activePhotoIdx]}
                alt={`${project.name} — photo ${activePhotoIdx + 1}`}
                fill
                priority
                sizes="100vw"
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Lightbox prev / next */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((p) => (p - 1 + images.length) % images.length); }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer border border-white/15 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((p) => (p + 1) % images.length); }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer border border-white/15 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>

          {/* Fullscreen thumbnail strip */}
          {images.length > 1 && (
            <div
              className="border-t border-white/[0.08] bg-black/70 backdrop-blur-xl px-4 sm:px-6 py-3 shrink-0 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-5xl mx-auto flex items-center gap-2">
                {/* Scroll left */}
                <button
                  type="button"
                  onClick={() => fullscreenThumbRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                  className="hidden sm:flex p-1.5 rounded-[4px] bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Scroll left"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>

                <div
                  ref={fullscreenThumbRef}
                  onWheel={(e) => { if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY; }}
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex-1"
                >
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      aria-label={`Photo ${idx + 1}`}
                      className={`relative w-14 sm:w-18 aspect-[16/10] rounded-[3px] overflow-hidden shrink-0 border transition-[border-color,opacity] duration-150 cursor-pointer ${
                        idx === activePhotoIdx
                          ? "border-amber-500 opacity-100"
                          : "border-white/10 opacity-40 hover:opacity-75 hover:border-white/30"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="72px" className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>

                {/* Scroll right */}
                <button
                  type="button"
                  onClick={() => fullscreenThumbRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                  className="hidden sm:flex p-1.5 rounded-[4px] bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Scroll right"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>,
    document.body
  );
}
