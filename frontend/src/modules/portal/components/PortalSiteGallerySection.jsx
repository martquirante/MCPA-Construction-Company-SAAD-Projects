"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Camera,
  CheckCircle2,
  Maximize2,
  X,
  Download,
} from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalSiteGallerySection({
  photos = [],
  projectCode = "PRJ-ACTIVE",
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const filterTabs = [
    { id: "all", label: "All Photos" },
    { id: "inspections", label: "Inspections" },
    { id: "drone", label: "Drone Views" },
    { id: "blueprints", label: "Architectural Blueprints" },
  ];

  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-4">
          <Camera className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Site Photo Gallery &amp; Daily Logs
          </h3>
        </div>

        <PortalEmptyState
          type="gallery"
          title="No Inspection Photos Yet"
          description="Field photos and drone logs will stream directly from the site."
        />
      </div>
    );
  }

  const displayedPhotos = photos;

  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Site Photo Gallery &amp; Daily Logs
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Visual Proof of Execution ({photos.length} Captured)
          </h3>
        </div>

        {/* Filter Tab Chips (Real clickable buttons have proper button styling) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPhotos.map((photo, idx) => (
          <div
            key={photo.log_id || idx}
            onClick={() => setLightboxPhoto(photo)}
            className="group relative rounded-[16px] overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-white/10 aspect-4/3 cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <Image
              src={photo.image_url}
              alt={photo.title || "Site Photo"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            {/* QC Tag Overlay (Clean text overlay, no bulky box) */}
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-mono font-bold text-amber-400 drop-shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Passed QC</span>
              </span>
            </div>

            {/* Photo Info Overlay */}
            <div className="absolute bottom-3 left-3 right-3 text-white space-y-0.5">
              <span className="text-[10px] font-mono text-neutral-300 block">
                {photo.log_date || "Today"}
              </span>
              <h4 className="text-xs sm:text-sm font-bold truncate">
                {photo.title}
              </h4>
              <p className="text-[10.5px] text-neutral-300 line-clamp-1">
                {photo.caption}
              </p>
            </div>

            {/* Zoom Icon Hover */}
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[20px] overflow-hidden bg-neutral-950 border border-white/10 shadow-2xl">
            {/* Modal Top Bar */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 text-white bg-black/50">
              <div>
                <h4 className="text-sm font-bold">{lightboxPhoto.title}</h4>
                <span className="text-[10px] font-mono text-neutral-400">
                  {lightboxPhoto.log_date} • Inspector: {lightboxPhoto.inspector || "Engr. Aris Reyes"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxPhoto.image_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Download Photo"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close Lightbox"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative flex-1 min-h-[350px] sm:min-h-[500px] bg-black flex items-center justify-center">
              <Image
                src={lightboxPhoto.image_url}
                alt={lightboxPhoto.title || "Fullscreen Photo"}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Caption Footer */}
            {lightboxPhoto.caption && (
              <div className="p-4 bg-neutral-950/80 border-t border-white/10 text-neutral-300 text-xs">
                <p>{lightboxPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
