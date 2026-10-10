"use client";
import Image from "next/image";
import {
  MapPin,
  Building,
  Maximize2,
  Layers,
  Compass,
  Check,
  Clock,
} from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalProjectSpecsCard({
  project = null,
  overallPct = 0,
  onOpenVirtualTour,
}) {
  if (!project) {
    return (
      <PortalEmptyState
        type="construction"
        badge="Site Specifications"
        title="No Project Specs Assigned"
        description="Architectural floor plans and 360° virtual tours will appear here."
      />
    );
  }

  const projectName = project.name || "Assigned Site Project";
  const projectCode = project.project_code || "PRJ-ACTIVE";
  const location = project.location || "Taguig City, Metro Manila";
  const virtualTourUrl = project.virtual_tour_url || "";
  const previewImg = project.cover_image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200";

  const checklistItems = [
    { title: "Roof Installation", status: "Completed", isDone: true },
    { title: "Electrical Rough-in", status: "Completed", isDone: true },
    { title: "Plumbing Rough-in", status: "In Progress", isInProgress: true },
    { title: "HVAC Installation", status: "Upcoming", isDone: false },
  ];

  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
      {/* Top Header (Clean typography, no bulky background) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Active Site Project
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              • {projectCode}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-1">
            {projectName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            In Progress — {overallPct}%
          </span>
        </div>
      </div>

      {/* Hero Render Preview & Specs Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Architectural Villa Photo Card */}
        <div className="relative aspect-video rounded-[16px] overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-white/10 group shadow-md">
          <Image
            src={previewImg}
            alt={projectName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Interactive 360 Tour Tag */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white text-xs font-mono font-bold drop-shadow-sm truncate">
              {projectName}
            </span>

            {virtualTourUrl && (
              <a
                href={virtualTourUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] font-mono font-bold transition-colors cursor-pointer"
                title="Launch 360 Virtual Tour"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>360° View</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick Specs Grid (Strict rule: No background boxes on non-buttons, clean icon + text!) */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Lot Area */}
            <div className="flex items-start gap-2.5">
              <Maximize2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Lot Area
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-white">
                  {project.lot_area ? `${project.lot_area} sqm` : "450 sqm"}
                </span>
              </div>
            </div>

            {/* Floor Area */}
            <div className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Floor Area
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-white">
                  {project.floor_area ? `${project.floor_area} sqm` : "320 sqm"}
                </span>
              </div>
            </div>

            {/* Structure Type */}
            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Building Type
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-white truncate block">
                  {project.building_type || "2-Storey Single"}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Location
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-white truncate block">
                  {location}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Checklist Sub-list (Clean text, no bulky background) */}
          <div className="pt-3 border-t border-neutral-100 dark:border-white/5 space-y-2">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider block font-semibold">
              Current Phase Checklist
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {item.isDone ? (
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : item.isInProgress ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
                  )}
                  <span className={`text-[11px] font-mono ${item.isDone ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400"}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
