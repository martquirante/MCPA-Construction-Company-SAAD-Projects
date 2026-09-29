"use client";

import { useState, useEffect, useRef } from "react";
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

export default function ProjectDetailsModal({ project, isOpen, onClose, onInquire }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRef = useRef(null);
  const fullscreenThumbRef = useRef(null);

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActivePhotoIdx(0);
    setIsFullscreen(false);
  }, [project]);

  const images = Array.isArray(project?.images) && project.images.length > 0
    ? project.images
    : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // Auto-scroll active thumbnail into view smoothly
  useEffect(() => {
    if (thumbnailRef.current) {
      const activeEl = thumbnailRef.current.children[activePhotoIdx];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
    if (fullscreenThumbRef.current) {
      const activeEl = fullscreenThumbRef.current.children[activePhotoIdx];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activePhotoIdx]);

  // 3-second Auto-Switching Carousel with pause on hover & fullscreen
  useEffect(() => {
    if (!isOpen || images.length <= 1 || isHovered || isFullscreen) return;

    const timer = setInterval(() => {
      setActivePhotoIdx((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen, images.length, isHovered, isFullscreen]);

  // Lock body scroll and handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("modal-open");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose?.();
        }
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        setActivePhotoIdx((prev) => (prev + 1) % images.length);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, images.length, isFullscreen]);

  if (!mounted || !isOpen || !project) return null;

  // Touch gesture handlers for mobile swiping
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;
    if (isLeftSwipe && images.length > 1) {
      setActivePhotoIdx((prev) => (prev + 1) % images.length);
    } else if (isRightSwipe && images.length > 1) {
      setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleInquireClick = () => {
    onClose?.();
    if (onInquire) {
      onInquire(project);
    } else {
      router.push(`/book?style=${encodeURIComponent(project.name)}`);
    }
  };

  // Default features if not custom specified in DB
  const defaultFeatures = [
    "Turnkey Structural Framing & Reinforced Footings",
    "Complete Signed & Sealed PRC Blueprints & Municipal Permits",
    "PPR Hot & Cold Waterlines & Heavy-Duty PVC Drainage",
    "Pre-wired Smart Breakers & High-Grade Copper Conduits",
    "All-Weather Anti-Corrosion Exterior Wall Coatings",
    "Standard 15-Year MCPA Structural Warranty Guarantee",
  ];

  const displayFeatures = Array.isArray(project.features) && project.features.length > 0
    ? project.features
    : defaultFeatures;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />

        {/* Modal Dialog Card */}
        <div className="relative w-full max-w-4xl bg-white dark:bg-[#111318] border border-neutral-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 px-5 sm:px-7 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {project.category || "General Construction"}
                </span>
                {project.status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    project.status === "in_progress"
                      ? "bg-amber-500 text-neutral-950"
                      : project.status === "planning"
                      ? "bg-sky-500 text-neutral-950"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {project.status === "in_progress"
                      ? "In Progress"
                      : project.status === "planning"
                      ? "Planning Phase"
                      : "Completed Project"}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-neutral-950 dark:text-white break-words leading-snug tracking-tight">
                {project.name}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close details"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-7 custom-scrollbar">
            {/* 1. Multi-Photo Gallery Showcase */}
            <div className="space-y-3">
              <div
                className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-lg group select-none cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setIsFullscreen(true)}
                title="Click to view full screen"
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      idx === activePhotoIdx
                        ? "opacity-100 scale-100 z-10"
                        : "opacity-0 scale-105 z-0 pointer-events-none"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${project.name} view ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      sizes="(max-width: 1024px) 100vw, 896px"
                      className="object-cover object-center"
                      unoptimized
                    />
                  </div>
                ))}

                {/* Fullscreen Expand Button - Top Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreen(true);
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-transform active:scale-95 z-20 cursor-pointer"
                  aria-label="View Fullscreen"
                  title="View Fullscreen"
                >
                  <Maximize2Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Fullscreen</span>
                </button>

                {/* Prev / Next Carousel Controls (ALWAYS visible on mobile, reveal on hover on desktop) */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
                      }}
                      className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 active:scale-90 z-20 shadow-lg border border-white/15"
                      aria-label="Previous photo"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev + 1) % images.length);
                      }}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 active:scale-90 z-20 shadow-lg border border-white/15"
                      aria-label="Next photo"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Photo Counter Pill */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-mono font-medium border border-white/10 z-20 flex items-center justify-center">
                    <span>{activePhotoIdx + 1} / {images.length}</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="relative group/strip">
                  <div
                    ref={thumbnailRef}
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth"
                  >
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`relative w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          idx === activePhotoIdx
                            ? "border-amber-500 ring-2 ring-amber-500/40 scale-102 shadow-md shadow-amber-500/20"
                            : "border-transparent opacity-60 hover:opacity-100 hover:scale-102"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          {/* 2. Key Specs Grid with Auto-adjusting Typography */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Lot Area",
                value: project.lotArea || "Custom Lot",
              },
              {
                label: "Floor Area",
                value: project.floorArea || "Turnkey Space",
              },
              {
                label: "Rooms & Bath",
                value: project.bedrooms
                  ? `${project.bedrooms} · ${project.bathrooms || "Baths"}`
                  : "Multi-Zone Layout",
              },
              {
                label: "Site Location",
                value: project.location || "Central Luzon",
              },
            ].map((spec, i) => {
              const strVal = String(spec.value || "");
              const len = strVal.length;
              // Auto-adjust font size, line-height and layout based on content length
              const fontSizeClass =
                len > 24
                  ? "text-[11px] sm:text-xs md:text-[13px] leading-snug"
                  : len > 15
                  ? "text-xs sm:text-sm leading-snug"
                  : "text-sm sm:text-base leading-tight";

              return (
                <div
                  key={i}
                  className="p-3 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5 hover:border-amber-500/25 transition-all flex flex-col justify-between min-h-[76px] sm:min-h-[86px]"
                >
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 select-none">
                    {spec.label}
                  </span>
                  <p
                    className={`font-extrabold text-neutral-900 dark:text-white mt-1 break-words ${fontSizeClass}`}
                    title={spec.value}
                  >
                    {spec.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 3. Engineering & Structural Standards Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25">
            <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-amber-500 shrink-0" />
              <span>MCPA Structural Engineering Standard</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
              Constructed strictly according to the National Structural Code of the Philippines (NSCP) with Grade 60 high-tensile rebars, 3,000+ PSI ready-mix structural concrete, earthquake-tested shear walling, and complete PRC-licensed architectural & civil sign-offs.
            </p>
          </div>

          {/* 4. Project Narrative */}
          {project.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Project Overview & Design Vision
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
                {project.description}
              </p>
            </div>
          )}

          {/* 5. Architectural Features & Scope Delivered */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Scope of Works & Architectural Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {displayFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Call to Action */}
        <div className="px-5 sm:px-7 py-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50/80 dark:bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 break-words">
              <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{project.location}</span>
            </span>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Completed {project.month ? `${project.month} ` : ""}{project.year}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleInquireClick}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            >
              <span>Inquire For This Style</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen Lightbox Overlay */}
    {isFullscreen && (
      <div
        className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-in fade-in duration-200"
        onClick={() => setIsFullscreen(false)}
      >
        {/* Top Fullscreen Header */}
        <div
          className="px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <h3 className="text-white text-sm sm:text-base font-bold truncate">
              {project.name}
            </h3>
            <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              {project.category || "General Construction"}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-mono border border-white/10">
              <span>{activePhotoIdx + 1} / {images.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
              aria-label="Exit fullscreen"
              title="Exit fullscreen (Esc)"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fullscreen Image Stage */}
        <div
          className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* The Fullscreen Image */}
          <div className="relative w-full h-full max-h-[82vh] flex items-center justify-center">
            <Image
              src={images[activePhotoIdx]}
              alt={`${project.name} photo ${activePhotoIdx + 1}`}
              fill
              sizes="100vw"
              priority
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Left / Right Fullscreen Navigation Buttons - ALWAYS visible on mobile & desktop */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/20 shadow-2xl transition-all z-40 hover:scale-105"
                aria-label="Previous photo"
              >
                <ChevronLeftIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/20 shadow-2xl transition-all z-40 hover:scale-105"
                aria-label="Next photo"
              >
                <ChevronRightIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </>
          )}
        </div>

        {/* Fullscreen Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div
            className="w-full bg-black/85 backdrop-blur-xl border-t border-white/10 px-3 sm:px-6 py-3 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-5xl mx-auto flex items-center gap-2">
              {/* Previous scroll button */}
              <button
                type="button"
                onClick={() => {
                  if (fullscreenThumbRef.current) {
                    fullscreenThumbRef.current.scrollBy({ left: -260, behavior: "smooth" });
                  }
                }}
                className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all shrink-0 cursor-pointer"
                title="Scroll thumbnails left"
                aria-label="Scroll thumbnails left"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <div
                ref={fullscreenThumbRef}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 flex-1"
              >
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-16 sm:w-20 aspect-[16/10] rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activePhotoIdx
                        ? "border-amber-500 ring-2 ring-amber-500/50 scale-105 shadow-lg shadow-amber-500/30"
                        : "border-transparent opacity-50 hover:opacity-90 hover:scale-102"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>

              {/* Next scroll button */}
              <button
                type="button"
                onClick={() => {
                  if (fullscreenThumbRef.current) {
                    fullscreenThumbRef.current.scrollBy({ left: 260, behavior: "smooth" });
                  }
                }}
                className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all shrink-0 cursor-pointer"
                title="Scroll thumbnails right"
                aria-label="Scroll thumbnails right"
              >
                <ChevronRightIcon className="w-4 h-4" />
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
