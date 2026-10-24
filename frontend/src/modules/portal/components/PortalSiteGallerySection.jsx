"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  CheckCircle2,
  Maximize2,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
} from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

function GalleryGroupCard({ group, onOpenLightbox }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const items = group.items || [];
  const safeIdx = Math.min(Math.max(0, activeIdx), Math.max(0, items.length - 1));
  const currentItem = items[safeIdx] || items[0] || {};

  const isVideo =
    currentItem.media_type === "video" ||
    Boolean(currentItem.image_url?.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i));

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      onClick={() => onOpenLightbox(currentItem, items, safeIdx, group)}
      className="group relative rounded-[16px] overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-white/10 aspect-4/3 cursor-pointer shadow-sm hover:shadow-md transition-all select-none"
    >
      {isVideo ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            key={currentItem.image_url}
            src={currentItem.image_url}
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            preload="metadata"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <Image
          key={currentItem.image_url}
          src={currentItem.image_url}
          alt={group.title || "Site Photo"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* QC Tag Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        <span className="text-[10px] font-mono font-bold text-amber-400 drop-shadow-md flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Passed QC</span>
        </span>
        {items.length > 1 && (
          <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[9.5px] font-mono font-bold border border-white/15">
            {safeIdx + 1} / {items.length}
          </span>
        )}
      </div>

      {/* Carousel Prev/Next Chevrons */}
      {items.length > 1 && (
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between pointer-events-none opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={handlePrev}
            title="Previous photo"
            aria-label="Previous photo"
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            title="Next photo"
            aria-label="Next photo"
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center pointer-events-auto transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Zoom Icon Hover */}
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Maximize2 className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Photo Info Overlay */}
      <div className="absolute bottom-3 left-3 right-3 text-white space-y-0.5 z-10 pointer-events-none">
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1 mb-1.5 pointer-events-auto">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/10">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  aria-label={`Photo ${i + 1}`}
                  className={`transition-all cursor-pointer rounded-full ${
                    i === safeIdx
                      ? "w-3 h-1 bg-amber-400"
                      : "w-1 h-1 bg-white/50 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <span className="text-[10px] font-mono text-neutral-300 block">
          {group.log_date || "Today"}
        </span>
        <h4 className="text-xs sm:text-sm font-bold truncate">
          {group.title}
        </h4>
        {group.caption && (
          <p className="text-[10.5px] text-neutral-300 line-clamp-1">
            {group.caption}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PortalSiteGallerySection({
  photos = [],
  projectCode = "PRJ-ACTIVE",
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const filterTabs = [
    { id: "all", label: "All Updates" },
    { id: "weekly", label: "Weekly Recaps" },
    { id: "daily", label: "Daily Logs" },
    { id: "inspections", label: "Inspection Proof" },
  ];

  const displayedPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    if (activeFilter === "all") return photos;
    if (activeFilter === "weekly") {
      return photos.filter(
        (p) =>
          (p.title || "").toLowerCase().includes("week") ||
          (p.caption || "").toLowerCase().includes("week")
      );
    }
    if (activeFilter === "daily") {
      return photos.filter(
        (p) =>
          (p.title || "").toLowerCase().includes("day") ||
          (p.title || "").toLowerCase().includes("daily")
      );
    }
    if (activeFilter === "inspections") {
      return photos.filter(
        (p) =>
          (p.category || "").toLowerCase().includes("inspect") ||
          (p.title || "").toLowerCase().includes("inspect") ||
          (p.caption || "").toLowerCase().includes("inspect") ||
          (p.title || "").toLowerCase().includes("proof") ||
          (p.title || "").toLowerCase().includes("qc") ||
          (p.tags || "").toLowerCase().includes("inspect")
      );
    }
    return photos;
  }, [photos, activeFilter]);

  // Group multiple photos from the same update post
  const groupedGalleryItems = useMemo(() => {
    if (!Array.isArray(displayedPhotos) || displayedPhotos.length === 0) return [];

    const map = new Map();
    const orderedKeys = [];

    displayedPhotos.forEach((p, idx) => {
      const titleKey = (p.title || "").trim();
      const captionKey = (p.caption || "").trim();
      const inspectorKey = (p.inspector || "").trim();
      const dateKey = (p.log_date || "").trim();

      const hasMeta = Boolean(titleKey || captionKey || inspectorKey || dateKey);
      const groupKey = hasMeta
        ? `${titleKey}___${captionKey}___${inspectorKey}___${dateKey}`
        : `item_${p.log_id || idx}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          title: p.title || "Site Progress",
          caption: p.caption || "",
          inspector: p.inspector || "MCPA Site QC Team",
          log_date: p.log_date || "",
          items: [],
          allLogIds: [],
        });
        orderedKeys.push(groupKey);
      }

      const group = map.get(groupKey);
      group.items.push(p);
      if (p.log_id) {
        group.allLogIds.push(p.log_id);
      }
    });

    return orderedKeys.map((key) => map.get(key));
  }, [displayedPhotos]);

  const handleOpenLightbox = (item, items, index, group) => {
    const list = Array.isArray(items) && items.length > 0 ? items : [item];
    const safeIdx = Math.min(Math.max(0, index ?? 0), list.length - 1);
    setLightboxPhoto({
      ...item,
      items: list,
      currentIndex: safeIdx,
      groupTitle: group?.title || item.title,
      groupCaption: group?.caption || item.caption,
      groupInspector: group?.inspector || item.inspector,
      groupDate: group?.log_date || item.log_date,
    });
  };

  const modalItems = useMemo(() => {
    if (!lightboxPhoto) return [];
    if (Array.isArray(lightboxPhoto.items) && lightboxPhoto.items.length > 0) {
      return lightboxPhoto.items;
    }
    return [lightboxPhoto];
  }, [lightboxPhoto]);

  const currentModalIndex = Math.min(
    Math.max(0, lightboxPhoto?.currentIndex ?? 0),
    Math.max(0, modalItems.length - 1)
  );
  const currentModalItem = modalItems[currentModalIndex] || lightboxPhoto;

  const handleModalPrev = useCallback(() => {
    if (!lightboxPhoto || modalItems.length <= 1) return;
    const nextIdx = (currentModalIndex - 1 + modalItems.length) % modalItems.length;
    setLightboxPhoto((prev) => ({
      ...prev,
      ...modalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [lightboxPhoto, modalItems, currentModalIndex]);

  const handleModalNext = useCallback(() => {
    if (!lightboxPhoto || modalItems.length <= 1) return;
    const nextIdx = (currentModalIndex + 1) % modalItems.length;
    setLightboxPhoto((prev) => ({
      ...prev,
      ...modalItems[nextIdx],
      currentIndex: nextIdx,
    }));
  }, [lightboxPhoto, modalItems, currentModalIndex]);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxPhoto(null);
      if (e.key === "ArrowLeft") handleModalPrev();
      if (e.key === "ArrowRight") handleModalNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxPhoto, handleModalPrev, handleModalNext]);

  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-4">
          <Camera className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Site Progress &amp; Gallery
          </h3>
        </div>

        <PortalEmptyState
          type="gallery"
          title="No Progress Logs Posted Yet"
          description="Daily site logs, drone updates, and weekly recaps posted by the site engineer will stream here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Site Progress &amp; Gallery
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Live Construction Progress Logs ({groupedGalleryItems.length} {groupedGalleryItems.length === 1 ? "Update" : "Updates"})
            {photos.length > groupedGalleryItems.length && ` • ${photos.length} Total Photos`}
          </h3>
        </div>

        {/* Filter Tab Chips */}
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
        {groupedGalleryItems.map((group) => (
          <GalleryGroupCard
            key={group.groupKey}
            group={group}
            onOpenLightbox={handleOpenLightbox}
          />
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[20px] overflow-hidden bg-neutral-950 border border-white/10 shadow-2xl"
          >
            {/* Modal Top Bar */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 text-white bg-black/50">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{lightboxPhoto.groupTitle || lightboxPhoto.title}</h4>
                  {modalItems.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
                      {currentModalIndex + 1} / {modalItems.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {lightboxPhoto.groupDate || lightboxPhoto.log_date} | Inspector:{" "}
                  {lightboxPhoto.groupInspector || lightboxPhoto.inspector || "MCPA Site QC Team"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentModalItem?.image_url && (
                  <a
                    href={currentModalItem.image_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
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

            {/* Main Image / Video Player with Controls */}
            <div className="relative flex-1 min-h-[350px] sm:min-h-[500px] bg-black flex items-center justify-center overflow-hidden">
              {currentModalItem?.media_type === "video" ||
              Boolean(currentModalItem?.image_url?.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i)) ? (
                <video
                  key={currentModalItem?.image_url}
                  src={currentModalItem?.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <Image
                  key={currentModalItem?.image_url}
                  src={currentModalItem?.image_url}
                  alt={currentModalItem?.title || "Fullscreen Photo"}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                  unoptimized
                />
              )}

              {/* Prev / Next Chevrons */}
              {modalItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleModalPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Previous Photo (Left Arrow)"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleModalNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95 z-30"
                    title="Next Photo (Right Arrow)"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs border border-white/15 pointer-events-auto shadow-md">
                      {modalItems.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setLightboxPhoto((prev) => ({
                              ...prev,
                              ...modalItems[i],
                              currentIndex: i,
                            }));
                          }}
                          aria-label={`Photo ${i + 1}`}
                          className={`transition-all cursor-pointer rounded-full ${
                            i === currentModalIndex
                              ? "w-4 h-1.5 bg-amber-400"
                              : "w-1.5 h-1.5 bg-white/40 hover:bg-white/90"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Caption Footer */}
            {(lightboxPhoto.groupCaption || lightboxPhoto.caption) && (
              <div className="p-4 bg-neutral-950/80 border-t border-white/10 text-neutral-300 text-xs">
                <p>{lightboxPhoto.groupCaption || lightboxPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
