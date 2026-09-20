"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, MapPinIcon, CalendarIcon, TrashIcon } from "../../shared/Icons";
import { useLanguage } from "../../shared/LanguageContext";

export default function ProjectCard({ project, onInquire, onDelete }) {
  const { t } = useLanguage();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const images =
    project.images && project.images.length > 0
      ? project.images
      : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  // Threshold for long descriptions to show "more"
  const charLimit = 85;
  const isLongText = Boolean(project.description && project.description.length > charLimit);

  return (
    <div className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-500 shadow-md hover:shadow-2xl hover:shadow-neutral-300/60 dark:hover:shadow-amber-500/10 hover:-translate-y-1.5 flex flex-col justify-between min-h-[450px] sm:min-h-[480px] bg-white dark:bg-neutral-950 backdrop-blur-sm select-none">
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

        {/* 2. Top vignette for badges readability on bright images */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent dark:from-black/40 pointer-events-none" />

        {/* 3. Cinematic Gradient Overlay (Bright white bottom in Light mode, Dark bottom gradient in Dark mode) */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 via-55% to-transparent dark:from-neutral-950 dark:via-neutral-950/70 dark:via-45% dark:to-neutral-950/20 pointer-events-none transition-opacity duration-500 group-hover:from-white/90 group-hover:via-white/30 dark:group-hover:from-neutral-950/98 dark:group-hover:via-neutral-950/80" />
      </div>

      {/* 4. Top Card Header Overlay: Category Badge, Multi-Photo Dots & Admin Actions */}
      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between pointer-events-auto">
        {/* Category Badge */}
        {project.category && (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-white/90 dark:bg-black/60 text-neutral-900 dark:text-white border border-neutral-200/80 dark:border-white/20 backdrop-blur-md shadow-xs">
            {project.category}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Multi-Photo Pagination Dots */}
          {images.length > 1 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-black/55 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 shadow-xs">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx(idx);
                  }}
                  aria-label={`Show photo ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === activeImageIdx
                      ? "w-4 h-1.5 bg-amber-500 dark:bg-amber-400"
                      : "w-1.5 h-1.5 bg-neutral-300 hover:bg-neutral-500 dark:bg-white/40 dark:hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}

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

      {/* 5. Bottom Card Body Overlay: Location, Name, Description (with "more"), and CTA */}
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
            <span className="tabular-nums">{project.year}</span>
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

        {/* Action Button CTA */}
        <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-white/15 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onInquire?.(project)}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 group/link transition-colors cursor-pointer"
          >
            <span>{t("inquireStyle")}</span>
            <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
