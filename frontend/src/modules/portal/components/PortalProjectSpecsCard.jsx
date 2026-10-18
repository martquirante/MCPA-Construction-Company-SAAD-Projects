"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import {
  MapPin,
  Building,
  Maximize2,
  Minimize2,
  Layers,
  CheckCircle2,
  Clock,
  Play,
  Film,
  HardHat,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalProjectSpecsCard({
  project = null,
  milestones = [],
  overallPct = 0,
}) {
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [selectedZone, setSelectedZone] = useState("all");
  const videoRef = useRef(null);

  if (!project) {
    return (
      <PortalEmptyState
        type="construction"
        badge="Site Specifications"
        title="No Project Specs Assigned"
        description="Architectural floor plans and 3D walkthrough videos will appear here once engineering releases the model."
      />
    );
  }

  const projectName = project.name || project.project_title || "Assigned Site Project";
  const projectCode = project.project_code || project.site_project_code || "PRJ-ACTIVE";
  const location = project.location || project.target_location || "Site Location";
  const virtualTourUrl = project.virtual_tour_url || "";
  const currentPhase = project.current_phase || "Site Mobilization & Earthworks";

  const resolvedMilestones = (milestones && milestones.length > 0)
    ? milestones
    : (project.milestones && project.milestones.length > 0)
    ? project.milestones
    : [];

  // Active milestone / house part being actively built
  const activeMilestone = resolvedMilestones.find((m) => m.completion_pct > 0 && m.completion_pct < 100)
    || resolvedMilestones.find((m) => m.status === "In Progress")
    || resolvedMilestones[0]
    || { phase_name: currentPhase, completion_pct: overallPct, notes: "On-site structural execution in progress." };

  const houseZones = [
    { id: "all", label: "Full House Tour" },
    { id: "living", label: "Ground Living & Dining" },
    { id: "bedrooms", label: "2nd Floor Bedrooms" },
    { id: "roofing", label: "Roof Truss & Exterior" },
  ];

  const handleToggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
      setIsFullscreenVideo(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreenVideo(false);
    }
  };

  const isVideoUrl = virtualTourUrl && (
    virtualTourUrl.endsWith(".mp4") ||
    virtualTourUrl.endsWith(".webm") ||
    virtualTourUrl.includes("video") ||
    virtualTourUrl.includes("blob.core.windows.net") ||
    virtualTourUrl.includes("supabase.co/storage")
  );

  return (
    <div className="rounded-[16px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Active Site Construction Specs
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              • {projectCode}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            {projectName}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 font-mono">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>{location}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block">Total Accomplishment</span>
            <span className="text-2xl font-bold font-mono text-amber-500">{overallPct}%</span>
          </div>
        </div>
      </div>

      {/* Part of the House Being Built Highlight Banner */}
      <div className="p-4 sm:p-5 rounded-[12px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5" />
            <span>Currently Under Construction by MCPA</span>
          </span>
          <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
            {activeMilestone.phase_name || currentPhase}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light max-w-xl">
            {activeMilestone.notes || "Supervising engineers and on-site crew are executing foundation, framing, and reinforcement works."}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-400 uppercase block">Part Progress</span>
            <span className="text-base font-mono font-bold text-amber-500">
              {activeMilestone.completion_pct || 0}%
            </span>
          </div>
          <div className="w-24 sm:w-32 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${activeMilestone.completion_pct || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Walk-Around Video & Virtual Tour Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white tracking-wider">
              3D Architectural Walk-Around &amp; Virtual Tour
            </h4>
          </div>

          {virtualTourUrl && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white text-[11px] font-mono font-semibold transition-colors cursor-pointer"
              title="Full-Screen Walkthrough"
            >
              {isFullscreenVideo ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreenVideo ? "Exit Fullscreen" : "Full Screen"}</span>
            </button>
          )}
        </div>

        {/* Video Player or Responsive Container */}
        {virtualTourUrl ? (
          <div className="relative aspect-video rounded-[12px] overflow-hidden bg-black border border-neutral-200 dark:border-white/10 shadow-md group">
            {isVideoUrl ? (
              <video
                ref={videoRef}
                src={virtualTourUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
                poster="/logo.png"
              />
            ) : (
              <iframe
                ref={videoRef}
                src={virtualTourUrl}
                title="3D Virtual Walkthrough"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-[12px] bg-neutral-100 dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Film className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-mono font-bold uppercase text-neutral-800 dark:text-neutral-200">
              3D Architectural Walk-Around Pending
            </h5>
            <p className="text-[11px] text-neutral-500 max-w-sm font-light">
              Engineering is finalizing the BIM 3D walk-around video. Once uploaded by the site supervisor, you can tour your house in full screen right here.
            </p>
          </div>
        )}
      </div>

      {/* House Architectural Specifications & Milestone Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100 dark:border-white/5">
        {/* Specifications */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block">
            Approved Building Specifications
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase">Lot Area</span>
              <span className="font-bold text-neutral-900 dark:text-white text-sm">
                {project.lot_area ? `${project.lot_area} sqm` : "N/A"}
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase">Floor Area</span>
              <span className="font-bold text-neutral-900 dark:text-white text-sm">
                {project.floor_area ? `${project.floor_area} sqm` : "N/A"}
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase">Structure Type</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block">
                {project.building_type || project.project_type || "Reinforced Concrete"}
              </span>
            </div>
            <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase">Target Turnover</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block">
                {project.revised_turnover || project.original_turnover || "TBD Upon Mobilization"}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Phases List */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block">
            Construction Milestone Breakdown
          </span>

          {resolvedMilestones.length === 0 ? (
            <p className="text-xs font-mono text-neutral-400 italic">
              Milestone tranches will appear once the site supervisor schedules M1-M5.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {resolvedMilestones.map((m, idx) => {
                const isDone = m.completion_pct === 100 || m.status === "Completed";
                const isInProgress = m.completion_pct > 0 && m.completion_pct < 100;
                return (
                  <div
                    key={m.milestone_id || idx}
                    className="p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold text-[10px]">
                        {m.phase_code || `M${idx + 1}`}
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-white truncate">
                        {m.phase_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-xs text-amber-500">
                        {m.completion_pct || 0}%
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isInProgress ? (
                        <Clock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
