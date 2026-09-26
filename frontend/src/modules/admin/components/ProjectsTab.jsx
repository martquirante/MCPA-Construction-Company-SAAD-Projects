"use client";

import { useState } from "react";
import ProjectEditorModal from "./ProjectEditorModal";
import {
  PlusIcon,
  TrashIcon,
  FolderKanbanIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertTriangleIcon,
} from "../../shared/Icons";
import { verifyAdminPassword } from "../utils/adminAuth";

export default function ProjectsTab({
  customProjects,
  allProjects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  showToast,
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Deletion Authorization Password State
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleOpenDeleteProject = (project) => {
    setProjectToDelete(project);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
    setIsVerifyingPassword(false);
  };

  const handleCloseDeleteProject = () => {
    setProjectToDelete(null);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
    setIsVerifyingPassword(false);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError("Please enter the admin password or PIN to authorize deletion.");
      return;
    }

    setIsVerifyingPassword(true);
    setDeletePasswordError("");

    try {
      const isValid = await verifyAdminPassword(deletePassword);
      if (!isValid) {
        setDeletePasswordError("Incorrect admin password. Please enter the valid admin credential (e.g. mcpa2026).");
        setIsVerifyingPassword(false);
        return;
      }

      onDeleteProject(projectToDelete.id, projectToDelete.name);
      handleCloseDeleteProject();
    } catch (err) {
      setDeletePasswordError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setIsEditorOpen(true);
  };

  const handleSaveProject = (projectData) => {
    if (editingProject) {
      onUpdateProject(editingProject.id, projectData);
    } else {
      const newProject = {
        ...projectData,
        id: `PROJ-${Date.now()}`, // Temporary ID, will be replaced by DB ID later
        isAdminAdded: true,
      };
      onAddProject(newProject);
    }
    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <FolderKanbanIcon className="w-6 h-6 text-amber-500" />
            Projects Management
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your client-facing portfolio showcase.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md shadow-amber-500/20"
        >
          <PlusIcon className="w-4 h-4" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customProjects.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white/50 dark:bg-neutral-900/50">
            <FolderKanbanIcon className="w-12 h-12 text-neutral-400 mb-3" />
            <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">No Custom Projects</h3>
            <p className="text-sm text-neutral-500 max-w-sm text-center mt-2">
              You haven't added any custom portfolio projects yet. Click "Add Project" to get started.
            </p>
          </div>
        ) : (
          customProjects.map((project, idx) => {
            const projectKey = project?.id ? `proj-${project.id}-${idx}` : `proj-idx-${idx}`;
            return (
              <div
                key={projectKey}
                className="group bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all flex flex-col"
              >
              <div
                className="h-40 w-full bg-neutral-200 dark:bg-neutral-800 bg-cover bg-center cursor-pointer"
                style={{ backgroundImage: `url(${project.images?.[0] || '/assets/placeholder-project.jpg'})` }}
                onClick={() => handleOpenEdit(project)}
              >
                <div className="p-3 flex justify-between items-start">
                  <div className="flex flex-col gap-1.5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border ${
                      project.isWebVisible !== false
                        ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-100 border-rose-500/30"
                    }`}>
                      {project.isWebVisible !== false ? "● LIVE ON CLIENT WEB" : "○ HIDDEN"}
                    </span>
                    {project.status && project.status !== "completed" && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500/90 text-neutral-950 backdrop-blur-md shadow-sm w-fit">
                        {project.status === "in_progress" ? "In Progress" : "Planning Phase"}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    {project.category && (
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">
                        {project.category}
                      </span>
                    )}
                    {project.images && project.images.length > 1 && (
                      <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-md text-[9px] text-white/90 rounded border border-white/10">
                        📷 {project.images.length} photos
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 
                    className="font-bold text-neutral-900 dark:text-white line-clamp-1 cursor-pointer group-hover:text-amber-500 transition-colors"
                    onClick={() => handleOpenEdit(project)}
                  >
                    {project.name}
                  </h3>
                </div>
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2 flex-1">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div className="text-[10px] font-mono text-neutral-400">
                    {project.location} • {project.month ? `${project.month} ` : ""}{project.year}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteProject(project)}
                      className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>
      
      {isEditorOpen && (
        <ProjectEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveProject}
          initialData={editingProject}
        />
      )}

      {/* Custom Confirmation Modal: Delete Project */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141824] rounded-3xl border border-neutral-200 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrashIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  Delete This Project?
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Confirmation to remove project from portfolio showcase
                </p>
              </div>
            </div>

            {/* Thumbnail Preview if available */}
            {projectToDelete.images?.[0] && (
              <div className="w-full h-32 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={projectToDelete.images[0]}
                  alt={projectToDelete.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>? It will no longer be visible on your website portfolio and all of its information will be removed.
            </p>

            {/* Admin Password Authorization Input */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <LockIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Password / PIN *</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Required for delete
                </span>
              </div>

              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (deletePasswordError) setDeletePasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmDeleteProject();
                    }
                  }}
                  placeholder="Enter admin password (e.g. mcpa2026)"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border text-xs text-neutral-900 dark:text-white placeholder-neutral-400 transition-colors focus:outline-none ${
                    deletePasswordError
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showDeletePassword ? "Hide password" : "Show password"}
                >
                  {showDeletePassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {deletePasswordError && (
                <div className="flex items-start gap-1.5 text-[11px] text-rose-500 font-medium animate-in fade-in duration-150">
                  <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{deletePasswordError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={handleCloseDeleteProject}
                disabled={isVerifyingPassword}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={isVerifyingPassword}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isVerifyingPassword ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <TrashIcon className="w-3.5 h-3.5" />
                )}
                <span>{isVerifyingPassword ? "Verifying..." : "Yes, Delete Project"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
