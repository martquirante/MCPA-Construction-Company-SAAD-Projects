"use client";

import { useState, useEffect } from "react";
import SafeImage from "../../shared/SafeImage";
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

/**
 * ProjectCard
 *
 * Editorial card design — image-forward with a disciplined metadata row.
 * Replaced floating pill badges with architectural inline metadata.
 * Status indicators use a rule + label pattern, not colored pill badges.
 * Hover: subtle border activation + shadow lift. No scale, no 3D tilt.
 */
export default function ProjectCard({ project, onInquire, onDelete, onOpenDetails }) {
  const { t } = useLanguage();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    project.images && project.images.length > 0
      ? project.images
      : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // Auto-advance photo preview only when card is hovered (stops background timers across 20+ cards)
  useEffect(() => {
    if (images.length <= 1 || !isHovered) return;

    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const charLimit = 85;
  const isLongText = Boolean(project.description && project.description.length > charLimit);

  // Derive status label and indicator color
  const STATUS_MAP = {
    in_progress: { label: "In Progress", color: "bg-amber-500" },
    planning: { label: "Planning", color: "bg-sky-500" },
    completed: { label: "Completed", color: "bg-emerald-500" },
  };
  const statusInfo = project.status ? STATUS_MAP[project.status] : null;

  return (
    <div
      onClick={() => onOpenDetails?.(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={
        "group relative overflow-hidden flex flex-col justify-between " +
        "min-h-[460px] sm:min-h-[490px] " +
        "rounded-[10px] " +
        "bg-white dark:bg-neutral-950 " +
        "border border-neutral-200 dark:border-neutral-800 " +
        "hover:border-amber-500/50 dark:hover:border-amber-500/40 " +
        "shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] " +
        "transition-[border-color,box-shadow] duration-200 " +
        "select-none cursor-pointer"
      }
    >
      {/* ── Image Carousel ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-600 ease-out"
            style={{ opacity: idx === activeImageIdx ? 1 : 0 }}
          >
            <SafeImage
              src={imgSrc}
              alt={`${project.name} — view ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-center"
              unoptimized
            />
          </div>
        ))}

        {/* Top vignette for legibility */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

        {/* Bottom content gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/92 via-white/28 via-55% to-transparent dark:from-neutral-950 dark:via-neutral-950/72 dark:via-50% dark:to-neutral-950/10 pointer-events-none" />

        {/* Carousel prev/next — only visible on hover, accessible */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              title="Previous photo"
              aria-label="Previous photo"
              className="w-7 h-7 rounded-[4px] bg-black/55 hover:bg-black/80 text-white border border-white/15 flex items-center justify-center pointer-events-auto transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev + 1) % images.length);
              }}
              title="Next photo"
              aria-label="Next photo"
              className="w-7 h-7 rounded-[4px] bg-black/55 hover:bg-black/80 text-white border border-white/15 flex items-center justify-center pointer-events-auto transition-colors cursor-pointer"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Top Row: Status indicator + Admin delete ────────────────────── */}
      <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between pointer-events-auto">
        {/* Status — architectural tag: colored rule + all-caps label */}
        {statusInfo && (
          <div className="flex items-center gap-2">
            <span className={`w-1 h-3.5 rounded-[1px] ${statusInfo.color} shrink-0`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              {statusInfo.label}
            </span>
          </div>
        )}

        {/* Category — quiet label, no pill */}
        {project.category && !statusInfo && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            {project.category}
          </span>
        )}

        {/* Admin delete */}
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
            className="ml-auto p-1.5 rounded-[4px] bg-red-600/85 hover:bg-red-600 text-white transition-colors cursor-pointer"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Bottom Body: Metadata row + Name + Description + CTA ─────────── */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col pointer-events-auto">

        {/* Category — shown alongside status when both exist */}
        {project.category && statusInfo && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 mb-2">
            {project.category}
          </p>
        )}

        {/* Metadata row: location · date */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-2.5">
          {project.location && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPinIcon className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{project.location}</span>
            </span>
          )}
          {project.location && (project.year || project.month) && (
            <span className="text-neutral-300 dark:text-neutral-600 shrink-0">·</span>
          )}
          {(project.year || project.month) && (
            <span className="flex items-center gap-1 shrink-0 tabular-nums">
              <CalendarIcon className="w-3 h-3 text-neutral-400 shrink-0" />
              {project.month ? `${project.month} ` : ""}
              {project.year}
            </span>
          )}
        </div>

        {/* Project Name */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150 leading-tight">
          {project.name}
        </h3>

        {/* Description with read-more */}
        {project.description && (
          <div className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed">
            {isLongText && !isExpanded ? (
              <p>
                <span>{project.description.slice(0, charLimit).trim()}…</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="ml-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold text-xs underline underline-offset-2 cursor-pointer"
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
                    className="ml-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-xs underline underline-offset-2 cursor-pointer"
                  >
                    {t("readLess")}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {/* Footer: CTA + photo count indicator */}
        <div className="mt-4 pt-3.5 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2">
          {/* Inquire CTA — text-link tier */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInquire?.(project);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.06em] uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer shrink-0 group/cta"
          >
            <span className="whitespace-nowrap">{t("inquireStyle")}</span>
            <ArrowRightIcon className="w-3 h-3 transition-transform duration-150 group-hover/cta:translate-x-0.5" />
          </button>

          {/* Photo count / navigation */}
          {images.length > 1 && (
            images.length <= 6 ? (
              /* Dash indicators — up to 6 images */
              <div
                className="flex items-center gap-1 shrink-0"
                title={`${images.length} photos`}
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(idx);
                    }}
                    aria-label={`Show photo ${idx + 1}`}
                    className="cursor-pointer py-1 px-0.5 border-0 bg-transparent flex items-center focus:outline-none"
                  >
                    <div
                      className={`h-0.5 rounded-full transition-all duration-200 ${
                        idx === activeImageIdx
                          ? "w-3 sm:w-4 bg-amber-500 dark:bg-amber-400"
                          : "w-1.5 sm:w-2 bg-neutral-400/50 dark:bg-white/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : (
              /* Counter pill — 7+ images */
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-black/50 dark:bg-white/8 border border-white/15 text-white shrink-0 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous photo"
                  className="p-0.5 text-white/60 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-2.5 h-2.5" />
                </button>

                <div className="flex items-center gap-1 px-0.5">
                  <CameraIcon className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold tabular-nums text-white">
                    {activeImageIdx + 1}
                    <span className="text-white/55 font-normal"> / {images.length}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev + 1) % images.length);
                  }}
                  aria-label="Next photo"
                  className="p-0.5 text-white/60 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-2.5 h-2.5" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
