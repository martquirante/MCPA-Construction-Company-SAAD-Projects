"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, MapPinIcon, CalendarIcon, TrashIcon } from "../../shared/Icons";

export default function ProjectCard({ project, onInquire, onDelete }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = project.images && project.images.length > 0
    ? project.images
    : ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"];

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800/80 hover:border-amber-500/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 flex flex-col h-full backdrop-blur-sm">
      {/* Media container */}
      <div className="relative w-full h-64 sm:h-72 overflow-hidden bg-neutral-900">
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: idx === activeImageIdx ? 1 : 0 }}
          >
            {/* If it's a data URL or external URL, Next.js Image with unoptimized handles it cleanly */}
            <Image
              src={imgSrc}
              alt={`${project.name} - View ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
          </div>
        ))}

        {/* Ambient Dark Gradient on bottom of image for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Category & Admin Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          {project.category && (
            <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-black/65 text-white border border-white/15 backdrop-blur-md">
              {project.category}
            </span>
          )}
          {project.isAdminAdded && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/90 text-neutral-950 shadow-sm">
              Admin Upload
            </span>
          )}
        </div>

        {/* Admin Delete Action (if uploaded by admin) */}
        {project.isAdminAdded && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remove "${project.name}" from portfolio?`)) {
                onDelete(project.id);
              }
            }}
            title="Delete this project"
            className="absolute top-4 right-4 p-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md transition-colors opacity-80 hover:opacity-100 shadow-md"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Image Pagination Dots (if multi-photo) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx(idx);
                }}
                aria-label={`Show photo ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeImageIdx
                    ? "w-4 h-1.5 bg-amber-400"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Location and Year */}
          <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5 text-amber-500/80" />
              <span>{project.location}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span className="tabular-nums">{project.year}</span>
            </span>
          </div>

          {/* Project Title */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {project.name}
          </h3>

          {project.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 font-normal leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Action Link: Inquire for this Style */}
        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <button
            onClick={() => onInquire?.(project)}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 group/link"
          >
            <span>Inquire for this Style</span>
            <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
          </button>

          <span className="text-[11px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500">
            MCPA #{String(project.id).slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}
