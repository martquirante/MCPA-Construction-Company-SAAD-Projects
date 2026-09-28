"use client";

import { useState, useEffect } from "react";
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
} from "../../shared/Icons";

export default function ProjectDetailsModal({ project, isOpen, onClose, onInquire }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [project]);

  const images = Array.isArray(project?.images) && project.images.length > 0
    ? project.images
    : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // 3-second Auto-Switching Carousel with pause on hover
  useEffect(() => {
    if (!isOpen || images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActivePhotoIdx((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen, images.length, isHovered]);

  // Lock body scroll and trigger global navbar hide when modal is active
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("modal-open");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
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
  }, [isOpen, onClose, images.length]);

  if (!mounted || !isOpen || !project) return null;

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
            <h2 className="text-lg sm:text-2xl font-extrabold text-neutral-950 dark:text-white truncate tracking-tight">
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
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-lg group select-none"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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

              {/* Prev / Next Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 z-20 shadow-lg"
                    aria-label="Previous photo"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 z-20 shadow-lg"
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
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activePhotoIdx
                        ? "border-amber-500 ring-2 ring-amber-500/30 scale-102"
                        : "border-transparent opacity-60 hover:opacity-100"
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
            )}
          </div>

          {/* 2. Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                Lot Area
              </span>
              <p className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {project.lotArea || "Custom Lot"}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                Floor Area
              </span>
              <p className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {project.floorArea || "Turnkey Space"}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                Rooms & Bath
              </span>
              <p className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {project.bedrooms ? `${project.bedrooms} · ${project.bathrooms || "Baths"}` : "Multi-Zone Layout"}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                Site Location
              </span>
              <p className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5 truncate" title={project.location}>
                {project.location || "Central Luzon"}
              </p>
            </div>
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
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <MapPinIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>{project.location}</span>
            <span>•</span>
            <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>Completed {project.month ? `${project.month} ` : ""}{project.year}</span>
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
    </div>,
    document.body
  );
}
