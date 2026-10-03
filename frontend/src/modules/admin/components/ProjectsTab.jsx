"use client";

import { useState } from "react";
import ProjectEditorModal from "./ProjectEditorModal";
import AdminEmptyState from "./AdminEmptyState";
import SafeImage from "../../shared/SafeImage";
import { ProjectCardSkeleton } from "../../shared/Skeleton";
import {
  PlusIcon,
  TrashIcon,
  FolderKanbanIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertTriangleIcon,
  CloseIcon,
  CameraIcon,
  RulerIcon,
  SearchIcon,
} from "../../shared/Icons";
import { verifyAdminPassword } from "../utils/adminAuth";

export default function ProjectsTab({
  customProjects,
  allProjects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onToggleFeatured,
  showToast,
  isLoading = false,
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
        setDeletePasswordError("Incorrect admin password. Please enter a valid admin credential.");
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

  const handleSaveProject = async (projectData) => {
    if (editingProject) {
      const res = await onUpdateProject(editingProject.id, projectData);
      if (res && res.success === false) return res;
      setIsEditorOpen(false);
      return { success: true };
    } else {
      const newProject = {
        ...projectData,
        id: `PROJ-${Date.now()}`,
        isAdminAdded: true,
      };
      const res = await onAddProject(newProject);
      if (res && res.success === false) return res;
      setIsEditorOpen(false);
      return { success: true };
    }
  };

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const rawProjects = (allProjects && allProjects.length > 0) ? allProjects : customProjects;

  const categories = ["All", ...Array.from(new Set(rawProjects.map((p) => p.category).filter(Boolean)))];

  const queryTokens = searchQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const getProjectSearchableText = (p) => {
    const featuresStr = Array.isArray(p.features)
      ? p.features.filter(Boolean).join(" ")
      : (typeof p.features === "string" ? p.features : "");

    return [
      p.name || "",
      p.title || "",
      p.location || "",
      p.category || "",
      p.description || "",
      p.status || "",
      p.status === "in_progress" ? "in progress ongoing" : "",
      p.status === "planning" ? "planning phase" : "",
      p.status === "completed" ? "completed" : "",
      p.year?.toString() || "",
      p.month || "",
      p.lotArea || p.lot_area || "",
      p.floorArea || p.floor_area || "",
      p.bedrooms || "",
      p.bathrooms || "",
      p.architecturalDetails || p.architectural_details || "",
      featuresStr,
      p.id?.toString() || "",
      p.featuredOnHome || p.featured_on_home ? "featured home" : "",
    ]
      .join(" ")
      .toLowerCase();
  };

  const filteredProjects = rawProjects.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    if (queryTokens.length === 0) return matchesCategory;

    const text = getProjectSearchableText(p);
    const matchesSearch = queryTokens.every((token) => text.includes(token));
    return matchesCategory && matchesSearch;
  });

  // Calculate if search matches other categories when current category produces 0 results
  const otherCategoryMatches =
    queryTokens.length > 0 && selectedCategory !== "All"
      ? rawProjects.filter((p) => {
          const text = getProjectSearchableText(p);
          return queryTokens.every((token) => text.includes(token));
        })
      : [];

  const handleToggleVisibility = (project, e) => {
    e?.stopPropagation();
    const updated = {
      ...project,
      isWebVisible: project.isWebVisible === false ? true : false,
    };
    onUpdateProject(project.id, updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <FolderKanbanIcon className="w-6 h-6 text-amber-500" />
              Projects Management ({isLoading ? "..." : `${filteredProjects.length}${filteredProjects.length !== rawProjects.length ? ` of ${rawProjects.length}` : ""}`})
            </h2>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Pick up to 6 projects to showcase on the Home Page. The /projects page displays your complete portfolio.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-[4px] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[260px]">
          <SearchIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            placeholder="Search projects..."
            className="w-full pl-8.5 pr-8 py-1.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              aria-label="Clear search"
              title="Clear search (Esc)"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <ProjectCardSkeleton key={`proj-skel-${idx}`} />
          ))
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full">
            {searchQuery || selectedCategory !== "All" ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/msoeawqm.json"
                badgeText="No Filter Matches"
                title="No Matching Projects"
                description={
                  otherCategoryMatches.length > 0
                    ? `No projects found in "${selectedCategory}" matching "${searchQuery}". Found ${otherCategoryMatches.length} matching project${otherCategoryMatches.length === 1 ? "" : "s"} in other categories.`
                    : `No projects found matching "${searchQuery || selectedCategory}". Try clearing your search query or selecting a different category filter.`
                }
                actionButton={
                  otherCategoryMatches.length > 0 ? (
                    <button
                      onClick={() => setSelectedCategory("All")}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold rounded-[4px] transition-colors cursor-pointer shadow-sm"
                    >
                      Show All Categories ({otherCategoryMatches.length})
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                      className="px-4 py-2 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold rounded-[4px] transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )
                }
              />
            ) : (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/wzwygmng.json"
                badgeText="Portfolio Standby"
                title="No Projects in Portfolio"
                description='No projects in the database yet. Click "Add Project" to create your first portfolio entry.'
                actionButton={
                  <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-[4px] transition-colors shadow-sm cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add First Project
                  </button>
                }
              />
            )}
          </div>
        ) : (
          filteredProjects.map((project, idx) => {
            const projectKey = project?.id ? `proj-${project.id}-${idx}` : `proj-idx-${idx}`;
            return (
              <div
                key={projectKey}
                className="group bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/[0.08] rounded-[6px] overflow-hidden shadow-xs hover:border-amber-500/40 transition-colors flex flex-col animate-in fade-in duration-300"
              >
              <div
                className="h-44 w-full bg-neutral-200 dark:bg-neutral-800 cursor-pointer relative overflow-hidden"
                onClick={() => handleOpenEdit(project)}
              >
                {project.images?.[0] ? (
                  <SafeImage
                    src={project.images[0]}
                    alt={project.name || "Project Cover"}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <CameraIcon className="w-6 h-6 opacity-40" />
                  </div>
                )}
                <div className="relative z-10 p-3 flex justify-between items-start pointer-events-none *:pointer-events-auto">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility(project, e)}
                      title="Click to toggle website visibility"
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border cursor-pointer transition-colors ${
                        project.isWebVisible !== false
                          ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-100 border-rose-500/30"
                      }`}
                    >
                      {project.isWebVisible !== false ? "LIVE ON CLIENT WEB" : "HIDDEN"}
                    </button>
                    {project.isWebVisible !== false && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleFeatured) {
                            onToggleFeatured(project.id);
                          }
                        }}
                        title={project.featuredOnHome ? "Featured on Home Page (Click to unfeature)" : "Feature on Home Page (Max 6)"}
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border cursor-pointer transition-colors flex items-center gap-1 ${
                          project.featuredOnHome
                            ? "bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-sm"
                            : "bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/80"
                        }`}
                      >
                        <span>{project.featuredOnHome ? "★" : "☆"}</span>
                        <span>{project.featuredOnHome ? "ON HOME (MAX 6)" : "ADD TO HOME"}</span>
                      </button>
                    )}
                    {project.status && project.status !== "completed" && (
                      <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/90 text-neutral-950 backdrop-blur-md shadow-sm w-fit">
                        {project.status === "in_progress" ? "In Progress" : "Planning Phase"}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    {project.category && (
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-[4px]">
                        {project.category}
                      </span>
                    )}
                    {project.images && project.images.length > 1 && (
                      <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-md text-[9px] font-mono text-white/90 rounded-[4px] border border-white/10 inline-flex items-center gap-1">
                        <CameraIcon className="w-3 h-3 text-white/80" />
                        <span>{project.images.length} photos</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 
                    className="font-bold text-neutral-900 dark:text-white line-clamp-1 cursor-pointer hover:text-amber-500 transition-colors"
                    onClick={() => handleOpenEdit(project)}
                  >
                    {project.name}
                  </h3>
                </div>

                {/* Architectural Specs Preview Tag */}
                {(project.lotArea || project.floorArea || project.bedrooms) && (
                  <div className="flex items-center gap-2 mb-2 text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                    <span className="inline-flex items-center gap-1">
                      <RulerIcon className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{project.lotArea ? `Lot: ${project.lotArea}` : ""}{project.floorArea ? ` · Floor: ${project.floorArea}` : ""}</span>
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2 flex-1">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100 dark:border-white/5">
                  <div className="text-[10px] font-mono text-neutral-400">
                    {project.location} • {project.month ? `${project.month} ` : ""}{project.year}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(project)}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-[4px] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteProject(project)}
                      className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[4px] transition-colors cursor-pointer"
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
          <div className="w-full max-w-md bg-white dark:bg-[#141824] rounded-[8px] border border-neutral-200 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <TrashIcon className="w-6 h-6 text-rose-500 shrink-0" />
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
              <div className="relative w-full h-32 rounded-[4px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800">
                <SafeImage
                  src={projectToDelete.images[0]}
                  alt={projectToDelete.name}
                  fill
                  sizes="400px"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{projectToDelete.name}&quot;</strong>? It will no longer be visible on your website portfolio and all of its information will be removed.
            </p>

            {/* Admin Password Authorization Input */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <LockIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Password *</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
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
                  placeholder="Enter admin password"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border text-xs text-neutral-900 dark:text-white placeholder-neutral-400 transition-colors focus:outline-none ${
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
                className="px-4 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={isVerifyingPassword}
                className="px-5 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
