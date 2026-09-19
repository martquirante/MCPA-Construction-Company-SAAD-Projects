"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  HardHatIcon,
  BuildingIcon,
  UploadCloudIcon,
  SparkleBadgeIcon,
  MapPinIcon,
  PlusIcon,
  RefreshCwIcon,
  CameraIcon,
} from "@/modules/shared/Icons";

export default function SiteProgressTab({
  project,
  milestones = [],
  photos = [],
  onUpdateMilestone,
  onAddPhoto,
  showToast,
}) {
  const [activePhotoModal, setActivePhotoModal] = useState(false);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoInspector, setPhotoInspector] = useState("Engr. Raymart Quirante, CE");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&fit=crop");
  const [is360, setIs360] = useState(false);
  const [active360Viewer, setActive360Viewer] = useState(false);

  const handleSliderChange = async (milestoneId, newPct) => {
    const status = newPct === 100 ? "Completed" : newPct > 0 ? "In Progress" : "Upcoming";
    await onUpdateMilestone(milestoneId, { completionPct: newPct, status });
    showToast(`Updated milestone to ${newPct}% (${status})`);
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!photoTitle || !photoUrl) return;

    await onAddPhoto({
      projectCode: project?.project_code || "MCPA-PLR-2024",
      title: photoTitle,
      caption: photoCaption,
      inspector: photoInspector,
      imageUrl: photoUrl,
      is360,
    });

    setActivePhotoModal(false);
    setPhotoTitle("");
    setPhotoCaption("");
    showToast(is360 ? "360° Virtual Site Tour sweep registered!" : "Inspection photo log uploaded!");
  };

  if (!project) {
    return (
      <div className="p-12 text-center rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 font-mono text-xs">
        Loading live construction site data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-100 dark:border-white/5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold">
                {project.project_code}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{project.status || "Active Site Execution"}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {project.name}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{project.location}</span>
              <span>•</span>
              <span>Owner: {project.client_name}</span>
            </p>
          </div>

          {/* Dynamic Overall Progress Bar */}
          <div className="lg:text-right min-w-[260px]">
            <div className="flex items-baseline justify-between lg:justify-end gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                Dynamic Overall % Accomplishment
              </span>
              <span className="text-3xl font-extrabold text-amber-500 font-mono">
                {project.progress_pct}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${project.progress_pct}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
              Supervising: {project.lead_engineer}
            </p>
          </div>
        </div>

        {/* Construction Dates Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] text-neutral-500 uppercase block">Mobilization Date</span>
            <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">{project.contract_date}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] text-neutral-500 uppercase block">Original Turnover</span>
            <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">{project.original_turnover}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase block">Revised Turnover (Critical Path)</span>
            <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">{project.revised_turnover}</span>
          </div>
        </div>
      </div>

      {/* Milestones Phase-by-Phase Adjuster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
              Milestone Phases &amp; Progress Controls
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Adjust phase accomplishment percentages below. The total progress bar updates automatically for the client.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {milestones.map((ms) => (
            <div
              key={ms.milestone_id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
                    {ms.phase_code}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                      ms.status === "Completed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : ms.status === "In Progress"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {ms.status}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">{ms.target_date}</span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{ms.phase_name}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">{ms.notes}</p>
              </div>

              {/* Slider & Progress Input */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-36 sm:w-44">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={ms.completion_pct || 0}
                    onChange={(e) => handleSliderChange(ms.milestone_id, parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="w-14 text-right">
                  <span className="text-base font-bold font-mono text-amber-500">
                    {ms.completion_pct}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Proof of Life Photo Logs & 360 Tour */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
              Visual Proof of Life &amp; 360° Virtual Site Tour
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Timestamped site inspection photos with engineer sign-offs to eliminate bogus claims.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActive360Viewer(!active360Viewer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
            >
              <RefreshCwIcon className="w-3.5 h-3.5" />
              <span>{active360Viewer ? "Hide 360° Viewer" : "360° Tour Preview"}</span>
            </button>
            <button
              onClick={() => setActivePhotoModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Upload Inspection Photo</span>
            </button>
          </div>
        </div>

        {/* 360 Panorama Interactive Viewer Container */}
        {active360Viewer && (
          <div className="p-5 rounded-3xl bg-neutral-950 border border-purple-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                360° Virtual Site Tour (Draggable Panoramic Sweep)
              </span>
              <span className="text-[11px] font-mono text-purple-300">Click &amp; drag to explore site</span>
            </div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&fit=crop"
                alt="360 Panorama"
                fill
                className="object-cover cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 text-xs font-mono text-white flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Foundation &amp; Structural Grid 14.8871° N, 120.8572° E</span>
              </div>
            </div>
          </div>
        )}

        {/* Photo Logs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div
              key={p.log_id}
              className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-video w-full bg-neutral-800">
                <Image
                  src={p.image_url}
                  alt={p.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono">
                  {p.log_date}
                </span>
                {p.is_360 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white border border-purple-400/40 text-[9px] font-mono font-bold">
                    360° TOUR
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {p.caption}
                  </p>
                </div>
                <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>{p.inspector}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckIcon className="w-3 h-3" /> Signed
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD INSPECTION PHOTO */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                  Phase 5: Field Logging
                </span>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                  Upload Site Inspection Photo
                </h3>
              </div>
              <button
                onClick={() => setActivePhotoModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Photo Title / Inspection Area *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Ground Floor Column Pouring & Curing Inspection"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Field Caption &amp; Notes</label>
                <textarea
                  rows={3}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Verified rebar spacing and slump test pass of 3000 PSI ready-mix..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Image URL / Cloud Storage Link *</label>
                <input
                  type="url"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is360Check"
                  checked={is360}
                  onChange={(e) => setIs360(e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <label htmlFor="is360Check" className="text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  This photo is a 360° Panoramic Video Sweep for Virtual Site Tour
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActivePhotoModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-mono uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs font-mono uppercase cursor-pointer shadow-md shadow-amber-500/20 transition-all"
                >
                  Publish to Client Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
