"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowRightIcon,
  MapPinIcon,
  CalendarIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CameraIcon,
} from "../../shared/Icons";
import { useLanguage } from "../../shared/LanguageContext";

export default function ProjectCard({ project, onInquire, onDelete, onOpenDetails }) {
  const { t } = useLanguage();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    project.images && project.images.length > 0
      ? project.images
      : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // 3-second Auto-Switching Carousel with pause on hover
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  // Threshold for long descriptions to show "more"
  const charLimit = 85;
  const isLongText = Boolean(project.description && project.description.length > charLimit);

  return (
    <div
      onClick={() => onOpenDetails?.(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-500 shadow-md hover:shadow-2xl hover:shadow-neutral-300/60 dark:hover:shadow-amber-500/10 hover:-translate-y-1.5 flex flex-col justify-between min-h-[450px] sm:min-h-[480px] bg-white dark:bg-neutral-950 backdrop-blur-sm select-none cursor-pointer"
    >
      {/* 1. Full-Card Background Image Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: idx === activeImageIdx ? 1 : 0 }}
          >
            <Image
              src={imgSrc}
              alt={`${project.name} - View ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              unoptimized
            />
          </div>
        ))}

        {/* Top vignette for readability on bright images */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent dark:from-black/50 pointer-events-none" />

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/25 via-55% to-transparent dark:from-neutral-950 dark:via-neutral-950/75 dark:via-45% dark:to-neutral-950/20 pointer-events-none transition-opacity duration-500 group-hover:from-white/95 group-hover:via-white/35 dark:group-hover:from-neutral-950/98 dark:group-hover:via-neutral-950/80" />

        {/* Floating Prev/Next Carousel Arrows on Hover */}
        {images.length > 1 && (
          <div className="absolute inset-x-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              title="Previous photo"
              aria-label="Previous photo"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center pointer-events-auto transition-all shadow-md hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev + 1) % images.length);
              }}
              title="Next photo"
              aria-label="Next photo"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center pointer-events-auto transition-all shadow-md hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Card Header Overlay: Status, Category Badge & Admin Actions */}
      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Badge */}
          {project.status && project.status === "in_progress" && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-ping inline-block" />
              In Progress · Plans
            </span>
          )}
          {project.status && project.status === "planning" && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500 text-neutral-950 shadow-md shadow-sky-500/30">
              Planning & Blueprint
            </span>
          )}

          {/* Category Badge */}
          {project.category && (
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-white/90 dark:bg-black/60 text-neutral-900 dark:text-white border border-neutral-200/80 dark:border-white/20 backdrop-blur-md shadow-xs">
              {project.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Admin Delete Action */}
          {project.isAdminAdded && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove "${project.name}" from portfolio?`)) {
                  onDelete(project.id);
                }
              }}
              title="Delete this project"
              className="p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white backdrop-blur-md transition-colors shadow-md cursor-pointer"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Bottom Card Body Overlay: Location, Name, Description (with "more"), and CTA */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end pointer-events-auto">
        {/* Location & Year */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400/95 mb-1.5">
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{project.location}</span>
          </span>
          <span className="text-neutral-400 dark:text-white/40">·</span>
          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="tabular-nums">
              {project.month ? `${project.month} ` : ""}
              {project.year}
            </span>
          </span>
        </div>

        {/* Project Name */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {project.name}
        </h3>

        {/* Description with inline "more" / "less" toggle */}
        {project.description && (
          <div className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-200/90 font-normal leading-relaxed">
            {isLongText && !isExpanded ? (
              <p>
                <span>{project.description.slice(0, charLimit).trim()}...</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="ml-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold text-xs underline cursor-pointer inline-flex items-center"
                >
                  {t("readMore")}
                </button>
              </p>
            ) : (
              <p>
                <span>{project.description}</span>
                {isLongText && isExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="ml-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-xs underline cursor-pointer inline-flex items-center"
                  >
                    {t("readLess")}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {/* Action Button CTA & Bottom-Right Photo Indicators */}
        <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-white/15 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInquire?.(project);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 group/link transition-colors cursor-pointer shrink-0"
          >
            <span className="whitespace-nowrap">{t("inquireStyle")}</span>
            <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-1 shrink-0" />
          </button>

          {/* Photo Indicators / Carousel Navigation */}
          {images.length > 1 && (
            images.length <= 6 ? (
              /* Up to 6 photos: Sleek pill dashes */
              <div
                className="flex items-center gap-1.5 shrink-0 py-1"
                title={`${images.length} photos available`}
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(idx);
                    }}
                    title={`Photo ${idx + 1} of ${images.length}`}
                    aria-label={`Show photo ${idx + 1}`}
                    className="cursor-pointer py-1 px-0.5 border-0 bg-transparent group/bar focus:outline-none flex items-center"
                  >
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === activeImageIdx
                          ? "w-4 bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                          : "w-2 bg-neutral-400/60 dark:bg-white/35 group-hover/bar:bg-neutral-600 dark:group-hover/bar:bg-white/70"
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : (
              /* More than 6 photos (e.g. 42 photos): Luxury interactive pill counter */
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/50 dark:bg-white/10 hover:bg-neutral-900/70 dark:hover:bg-white/15 backdrop-blur-md border border-neutral-300/30 dark:border-white/15 text-white shadow-xs transition-all shrink-0 select-none"
                onClick={(e) => e.stopPropagation()}
                title={`${images.length} photos in portfolio`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  title="Previous photo"
                  aria-label="Previous photo"
                  className="p-0.5 rounded-full hover:bg-white/20 text-white/70 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  <CameraIcon className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold tracking-tight text-white tabular-nums">
                    {activeImageIdx + 1}
                    <span className="text-white/60 font-normal"> / {images.length}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev + 1) % images.length);
                  }}
                  title="Next photo"
                  aria-label="Next photo"
                  className="p-0.5 rounded-full hover:bg-white/20 text-white/70 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
