"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Film,
  Camera,
  Maximize2,
  X,
  UploadCloud,
  ChevronRight,
  HardHat,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import Stage3CustomerSelector from "./Stage3CustomerSelector";

export default function SiteProgressTab({
  project = null,
  projects = [],
  milestones = [],
  photos = [],
  onSelectProject,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateVirtualTour,
  onAddPhoto,
  showToast,
}) {
  // Modal states
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [activeUpdateMilestone, setActiveUpdateMilestone] = useState(null);
  const [is3DVideoModalOpen, setIs3DVideoModalOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);

  // Add Milestone Form state
  const [newPhaseCode, setNewPhaseCode] = useState("");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newWeight, setNewWeight] = useState("20");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Update Milestone Form state
  const [updatePct, setUpdatePct] = useState(0);
  const [updateStatus, setUpdateStatus] = useState("In Progress");
  const [updateNotes, setUpdateNotes] = useState("");
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // 3D Video Walkthrough Form state
  const [videoUrl, setVideoUrl] = useState(project?.virtual_tour_url || "");
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [boqTrades, setBoqTrades] = useState([]);

  useEffect(() => {
    if (!project?.project_code && !project?.client_project_id) return;
    const projId = project.client_project_id || project.project_code;
    let isMounted = true;
    fetch(`/api/projects/${encodeURIComponent(projId)}/quotation`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.quotation?.items_breakdown && Array.isArray(data.quotation.items_breakdown)) {
          setBoqTrades(data.quotation.items_breakdown);
        }
      })
      .catch((err) => console.warn("[SiteProgressTab] Could not load project BOQ quotation:", err));

    return () => {
      isMounted = false;
    };
  }, [project?.project_code, project?.client_project_id]);

  useEffect(() => {
    setVideoUrl(project?.virtual_tour_url || "");
  }, [project?.virtual_tour_url]);

  // Post Photo/Video Log Form state
  const [logType, setLogType] = useState("Daily Log");
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoInspector, setPhotoInspector] = useState(project?.lead_engineer || "Engr. Reyes");
  const [photoUrl, setPhotoUrl] = useState("");
  const [is360, setIs360] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [useManualPhotoUrl, setUseManualPhotoUrl] = useState(false);
  const photoFileInputRef = useRef(null);

  const resetPhotoForm = () => {
    setIsAddPhotoOpen(false);
    setPhotoTitle("");
    setPhotoCaption("");
    setPhotoUrl("");
    setPhotoPreview("");
    setPhotoUploadError("");
    setUseManualPhotoUrl(false);
    setIsUploadingPhoto(false);
    if (photoFileInputRef.current) photoFileInputRef.current.value = "";
  };

  const handlePhotoFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    setPhotoUploadError("");
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?category=portfolio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Upload failed");
      }
      setPhotoUrl(data.url);
      if (showToast) showToast("Photo uploaded to Azure Blob Storage & mirrored to Supabase + Neon!");
    } catch (err) {
      console.error("Photo upload error:", err);
      setPhotoUploadError(err.message || "Upload failed. Please verify connection.");
      if (showToast) showToast("Upload error: " + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handlers
  const handleOpenUpdateModal = (ms) => {
    setActiveUpdateMilestone(ms);
    setUpdatePct(ms.completion_pct || 0);
    setUpdateStatus(ms.status || "In Progress");
    setUpdateNotes(ms.notes || "");
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!activeUpdateMilestone) return;

    setIsSubmittingUpdate(true);
    try {
      const pctNum = Math.min(100, Math.max(0, parseInt(updatePct, 10) || 0));
      const resolvedStatus = pctNum === 100 ? "Completed" : pctNum > 0 ? "In Progress" : "Upcoming";

      await onUpdateMilestone(activeUpdateMilestone.milestone_id, {
        completionPct: pctNum,
        status: resolvedStatus,
        notes: updateNotes,
      });

      if (showToast) showToast(`Milestone updated to ${pctNum}% (${resolvedStatus})`);
      setActiveUpdateMilestone(null);
    } catch (err) {
      if (showToast) showToast("Error updating milestone: " + err.message);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newPhaseCode || !newPhaseName || !project) return;

    setIsSavingMilestone(true);
    try {
      if (onAddMilestone) {
        await onAddMilestone({
          projectCode: project.project_code,
          phaseCode: newPhaseCode,
          phaseName: newPhaseName,
          weight: parseInt(newWeight, 10) || 20,
          targetDate: newTargetDate,
          notes: newNotes,
        });
      } else {
        // Direct API call
        const res = await fetch("/api/construction/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            phaseCode: newPhaseCode,
            phaseName: newPhaseName,
            weight: parseInt(newWeight, 10) || 20,
            targetDate: newTargetDate,
            notes: newNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create milestone");
      }

      if (showToast) showToast(`Milestone ${newPhaseCode} added successfully!`);
      setIsAddMilestoneOpen(false);
      setNewPhaseCode("");
      setNewPhaseName("");
      setNewNotes("");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleImportMilestonesFromBOQ = async () => {
    if (!project || boqTrades.length === 0) return;
    if (!confirm(`Import all ${boqTrades.length} trade categories from the project's BOQ as site milestone phases?`)) return;

    setIsSavingMilestone(true);
    try {
      const evenWeight = Math.max(1, Math.floor(100 / boqTrades.length));
      for (let i = 0; i < boqTrades.length; i++) {
        const trade = boqTrades[i];
        const phaseCode = `M${milestones.length + i + 1}`;
        const itemsNotes = (trade.items || []).map((it) => it.item).filter(Boolean).slice(0, 4).join(", ");
        const phaseWeight = i === boqTrades.length - 1 ? (100 - evenWeight * (boqTrades.length - 1)) : evenWeight;

        if (onAddMilestone) {
          await onAddMilestone({
            projectCode: project.project_code,
            phaseCode,
            phaseName: trade.category,
            weight: phaseWeight,
            targetDate: "",
            notes: itemsNotes,
          });
        } else {
          await fetch("/api/construction/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectCode: project.project_code,
              phaseCode,
              phaseName: trade.category,
              weight: phaseWeight,
              targetDate: "",
              notes: itemsNotes,
            }),
          });
        }
      }
      if (showToast) showToast(`Successfully imported ${boqTrades.length} milestone phases from project BOQ!`);
    } catch (err) {
      if (showToast) showToast("Error importing from BOQ: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleDeleteMilestoneClick = async (milestoneId, phaseCode) => {
    if (!confirm(`Are you sure you want to delete milestone ${phaseCode}?`)) return;
    try {
      if (onDeleteMilestone) {
        await onDeleteMilestone(milestoneId);
      } else {
        const res = await fetch(`/api/construction/milestones/${milestoneId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (showToast) showToast(`Milestone ${phaseCode} deleted.`);
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!project) return;

    setIsSavingVideo(true);
    try {
      if (onUpdateVirtualTour) {
        await onUpdateVirtualTour(videoUrl);
      } else {
        const res = await fetch("/api/construction/virtual-tour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            virtualTourUrl: videoUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update tour");
      }
      if (showToast) showToast("3D Architectural walk-around video updated!");
      setIs3DVideoModalOpen(false);
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleSavePhotoLog = async (e) => {
    e.preventDefault();
    if (!photoTitle || !photoUrl || !project) return;

    setIsSavingPhoto(true);
    try {
      const fullTitle = `[${logType}] ${photoTitle}`;
      if (onAddPhoto) {
        await onAddPhoto({
          projectCode: project.project_code,
          title: fullTitle,
          caption: photoCaption,
          inspector: photoInspector,
          imageUrl: photoUrl,
          is360,
        });
      } else {
        const res = await fetch("/api/construction/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            title: fullTitle,
            caption: photoCaption,
            inspector: photoInspector,
            imageUrl: photoUrl,
            is360,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add photo");
      }
      if (showToast) showToast(`${logType} update published to client portal!`);
      resetPhotoForm();
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STAGE 3 CUSTOMER COMBOBOX */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Stage3CustomerSelector
          selectedProject={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />

        {project && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            <button
              type="button"
              onClick={() => {
                setVideoUrl(project.virtual_tour_url || "");
                setIs3DVideoModalOpen(true);
              }}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-amber-500" />
              <span>3D Walkthrough Video</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddPhotoOpen(true)}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Post Progress Update</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextNum = milestones.length + 1;
                setNewPhaseCode(`M${nextNum}`);
                setIsAddMilestoneOpen(true);
              }}
              className="px-3.5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CONDITIONAL VIEW: EMPTY STATE VS ACTIVE PROJECT MANAGEMENT */}
      {!project ? (
        <div className="p-12 text-center rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <HardHat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            No Stage 3 Client Project Selected
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Please use the customer selector above to choose an active construction client. You can configure milestone phases (M1-Mn), update progress %, and upload 3D walkthrough videos.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Details Banner */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-neutral-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                    {project.project_code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold">
                    Stage 3 • Active Build
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  {project.name || project.project_title}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.location || project.target_location}</span>
                  <span>•</span>
                  <span>Owner: {project.client_name}</span>
                </p>
              </div>

              {/* Overall Accomplishment Gauge */}
              <div className="lg:text-right min-w-[260px] space-y-1.5">
                <div className="flex items-baseline justify-between lg:justify-end gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 font-mono">
                    Overall % Accomplishment
                  </span>
                  <span className="text-3xl font-extrabold text-amber-500 font-mono">
                    {project.progress_pct || 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress_pct || 0}%` }}
                  />
                </div>
                <p className="text-[10.5px] text-neutral-400 font-mono">
                  Supervising Engineer: {project.lead_engineer || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Timetable Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Mobilization Date</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {project.contract_date || "Pending Mobilization"}
                </span>
              </div>
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Original Turnover</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {project.original_turnover || "Pending Schedule"}
                </span>
              </div>
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Revised Turnover (Critical Path)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {project.revised_turnover || project.original_turnover || "Pending Schedule"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. MILESTONE PHASES LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono">
                  Milestone Phases (M1–Mn) &amp; Accomplishment Controls
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Click &quot;Update Progress&quot; on any milestone to record verified accomplishments with notes. The overall project percentage updates automatically.
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                {milestones.length} {milestones.length === 1 ? "Milestone" : "Milestones"}
              </span>
            </div>

            {milestones.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-dashed border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-400 space-y-3">
                <p>No milestone phases created for {project.project_code} yet.</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhaseCode("M1");
                      setIsAddMilestoneOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Milestone 1</span>
                  </button>

                  {boqTrades.length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingMilestone}
                      onClick={handleImportMilestonesFromBOQ}
                      className="px-3 py-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 border border-neutral-200 dark:border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Import {boqTrades.length} Phases from Project BOQ</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((ms, idx) => {
                  const isDone = ms.completion_pct === 100 || ms.status === "Completed";
                  const isInProgress = ms.completion_pct > 0 && ms.completion_pct < 100;
                  return (
                    <div
                      key={ms.milestone_id || idx}
                      className="p-4 sm:p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold uppercase border border-amber-500/20">
                            {ms.phase_code}
                          </span>
                          <span
                            className={`text-[10.5px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                              isDone
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : isInProgress
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-neutral-100 dark:bg-white/5 text-neutral-500 border-neutral-200 dark:border-white/10"
                            }`}
                          >
                            {ms.status || "Upcoming"}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            Weight: {ms.weight || 20}%
                          </span>
                          {ms.target_date && (
                            <span className="text-[11px] font-mono text-neutral-400">
                              • Target: {ms.target_date}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {ms.phase_name}
                        </h4>
                        {ms.notes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 font-light">
                            {ms.notes}
                          </p>
                        )}
                      </div>

                      {/* Percentage & Actions */}
                      <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-white/5">
                        <div className="text-right min-w-[70px]">
                          <span className="text-xl font-bold font-mono text-amber-500">
                            {ms.completion_pct || 0}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(ms)}
                          className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update Progress</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMilestoneClick(ms.milestone_id, ms.phase_code)}
                          className="p-1.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD MILESTONE (M1, M2, M3...) */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add Milestone Phase ({newPhaseCode || "Mn"})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMilestoneOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3.5 text-xs font-mono">
              {boqTrades.length > 0 && (
                <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick-fill from Project BOQ Trades:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {boqTrades.map((trade, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setNewPhaseName(trade.category);
                          if (!newPhaseCode) setNewPhaseCode(`M${milestones.length + 1}`);
                          if (trade.items?.length > 0) {
                            setNewNotes(trade.items.map((it) => it.item).filter(Boolean).slice(0, 4).join(", "));
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#12151e] hover:bg-amber-500 hover:text-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        + {trade.category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Phase Code *</label>
                  <input
                    type="text"
                    required
                    value={newPhaseCode}
                    onChange={(e) => setNewPhaseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. M1, M2"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Weight (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="e.g. Foundation & Substructure"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Scope / Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Footing tie beams, rebar layout, column starter bars"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMilestone}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer"
                >
                  {isSavingMilestone ? "Saving..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE MILESTONE PROGRESS (%) */}
      {activeUpdateMilestone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">
                  {activeUpdateMilestone.phase_code}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Update Progress: {activeUpdateMilestone.phase_name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveUpdateMilestone(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-500 mb-1">
                  Completion Percentage (0–100%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={updatePct}
                    onChange={(e) => setUpdatePct(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold text-base focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-lg font-bold text-amber-500">%</span>
                </div>

                {/* Quick Increment Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUpdatePct(val)}
                      className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                      {val}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUpdatePct((prev) => Math.min(100, Number(prev || 0) + 10))}
                    className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]"
                  >
                    +10%
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Work Log &amp; Inspection Notes</label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Enter concrete pouring records, rebar tie inspection details..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveUpdateMilestone(null)}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingUpdate ? "Calculating..." : "Apply & Recalculate Overall %"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 3D WALKTHROUGH VIDEO UPLOAD / URL */}
      {is3DVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-500" />
                <span>3D Architectural Walk-Around Video</span>
              </h4>
              <button
                type="button"
                onClick={() => setIs3DVideoModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-500 mb-1">
                  Walkthrough Video URL (MP4, Cloud Storage, or Embed URL) *
                </label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://.../house-3d-walkaround.mp4"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Video will stream in high definition on the client portal with full-screen capability.
                </p>
              </div>

              {videoUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase">Live Preview:</span>
                  <div className="aspect-video rounded-[8px] overflow-hidden bg-black border border-neutral-200 dark:border-white/10">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIs3DVideoModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSavingVideo ? "Publishing..." : "Publish Walkthrough"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: POST DAILY / WEEKLY PROGRESS UPDATE */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Post Site Progress &amp; Gallery Update</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhotoLog} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Update Frequency *</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Daily Log">Daily Progress Log</option>
                    <option value="Weekly Recap">Weekly Milestone Recap</option>
                    <option value="Inspection Proof">QC Inspection Proof</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Inspector Sign-off</label>
                  <input
                    type="text"
                    value={photoInspector}
                    onChange={(e) => setPhotoInspector(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Log Title *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Ground Floor Slab Concreting Complete"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-neutral-500 font-mono text-[11px] font-bold uppercase">
                    Site Progress Photo File *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseManualPhotoUrl(!useManualPhotoUrl)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {useManualPhotoUrl ? (
                      <>
                        <UploadCloud className="w-3 h-3" />
                        <span>Switch to File Upload</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3 h-3" />
                        <span>Or Paste Direct URL</span>
                      </>
                    )}
                  </button>
                </div>

                {useManualPhotoUrl ? (
                  <input
                    type="url"
                    required
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://.../site-inspection.jpg"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                ) : (
                  <div>
                    <input
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />

                    {photoUrl || photoPreview ? (
                      <div className="relative rounded-[8px] overflow-hidden border border-amber-500/30 bg-neutral-900 p-2 space-y-2">
                        <div className="relative w-full h-44 rounded-[6px] overflow-hidden bg-neutral-950 flex items-center justify-center">
                          <img
                            src={photoPreview || photoUrl}
                            alt="Site Preview"
                            className="w-full h-full object-cover"
                          />
                          {isUploadingPhoto && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-3 text-center">
                              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                              <span className="text-xs font-mono font-bold">Uploading to Azure Blob Storage...</span>
                              <span className="text-[10px] font-mono text-neutral-300">Mirroring to Supabase &amp; Neon S3 Standby</span>
                            </div>
                          )}
                        </div>

                        {!isUploadingPhoto && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Azure Blob (Primary) • Supabase • Neon Mirror</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoUrl("");
                                setPhotoPreview("");
                                if (photoFileInputRef.current) photoFileInputRef.current.value = "";
                              }}
                              className="text-[11px] font-mono text-rose-500 hover:underline cursor-pointer self-end sm:self-auto"
                            >
                              Change File
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handlePhotoFileSelect(file);
                        }}
                        onClick={() => photoFileInputRef.current?.click()}
                        className="w-full p-6 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            Click to upload or drag &amp; drop site photo
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            PNG, JPG, WebP
                          </p>
                        </div>
                      </div>
                    )}

                    {photoUploadError && (
                      <p className="text-[11px] font-mono text-rose-500 mt-1.5">{photoUploadError}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Engineer Notes / Field Summary</label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Describe on-site accomplishments, cement curing status, or rebar count..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={resetPhotoForm}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhoto || isUploadingPhoto || !photoUrl || !photoTitle}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {isSavingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <span>Publish to Client</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
