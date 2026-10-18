"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  Search,
  Check,
  User,
  X,
} from "lucide-react";

// Module-level persistent cache across renders so it NEVER flickers "Loading..."
let globalStage3ProjectsCache = null;

export default function Stage3CustomerSelector({
  selectedProject = null,
  onSelectProject,
  projects: externalProjects = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState(() => {
    if (Array.isArray(externalProjects) && externalProjects.length > 0) return externalProjects;
    if (globalStage3ProjectsCache && globalStage3ProjectsCache.length > 0) return globalStage3ProjectsCache;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mcpa_stage3_projects");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            globalStage3ProjectsCache = parsed;
            return parsed;
          }
        }
      } catch (e) {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (Array.isArray(externalProjects) && externalProjects.length > 0) return false;
    if (globalStage3ProjectsCache && globalStage3ProjectsCache.length > 0) return false;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mcpa_stage3_projects");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch (e) {}
    }
    return true;
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(externalProjects) && externalProjects.length > 0) {
      setProjects(externalProjects);
      globalStage3ProjectsCache = externalProjects;
      try {
        localStorage.setItem("mcpa_stage3_projects", JSON.stringify(externalProjects));
      } catch (e) {}
      setIsLoading(false);
      return;
    }

    // If already loaded in memory or storage, refresh silently without setting isLoading=true
    let isMounted = true;
    async function fetchStage3Clients() {
      try {
        // Only trigger visible loading if we have zero projects in memory
        if (projects.length === 0 && !globalStage3ProjectsCache) {
          setIsLoading(true);
        }
        const res = await fetch("/api/construction/stage3-projects");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.projects)) {
          globalStage3ProjectsCache = data.projects;
          try {
            localStorage.setItem("mcpa_stage3_projects", JSON.stringify(data.projects));
          } catch (e) {}
          setProjects(data.projects);
        }
      } catch (err) {
        console.warn("[Stage3CustomerSelector] Failed to fetch Stage 3 clients:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStage3Clients();
    return () => {
      isMounted = false;
    };
  }, [externalProjects?.length]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Always resolve full identity and avatar_url from the directory so it NEVER flickers to initials
  const activeSelected = useMemo(() => {
    if (!selectedProject) return null;
    const match = projects.find(
      (p) =>
        (p.project_code && p.project_code === selectedProject.project_code) ||
        (p.client_project_id && p.client_project_id === selectedProject.client_project_id) ||
        (p.client_email && selectedProject.client_email && p.client_email.toLowerCase() === selectedProject.client_email.toLowerCase())
    );

    return {
      ...selectedProject,
      ...(match || {}),
      avatar_url: selectedProject.avatar_url || match?.avatar_url || null,
      client_name: selectedProject.client_name || match?.client_name || "Client",
      client_email: selectedProject.client_email || match?.client_email,
      project_code: selectedProject.project_code || match?.project_code,
      project_title: selectedProject.project_title || selectedProject.name || match?.project_title || "Stage 3 Build",
    };
  }, [selectedProject, projects]);

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = (p.client_name || "").toLowerCase();
    const code = (p.project_code || "").toLowerCase();
    const title = (p.project_title || "").toLowerCase();
    const email = (p.client_email || "").toLowerCase();
    return name.includes(q) || code.includes(q) || title.includes(q) || email.includes(q);
  });

  const getInitials = (name = "") => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative w-full max-w-xl" ref={dropdownRef}>
      <label className="block text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 font-bold mb-1.5">
        Active Stage 3 Project &amp; Client Selector
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 sm:p-3 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-300 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 flex items-center justify-between gap-3 text-left transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        {activeSelected ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar / PFP - Direct non-flashing image rendering */}
            <div className="relative w-9 h-9 rounded-full bg-neutral-900 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center">
              {activeSelected.avatar_url ? (
                <img
                  src={activeSelected.avatar_url}
                  alt={activeSelected.client_name || "Client"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <span className="font-mono text-xs font-bold text-amber-400">
                  {getInitials(activeSelected.client_name)}
                </span>
              )}
            </div>

            {/* Client Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {activeSelected.client_name || "Client Project"}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20">
                  {activeSelected.project_code}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                {activeSelected.project_title || activeSelected.name || "Stage 3 Build"} • {activeSelected.client_email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-neutral-400 text-xs font-mono">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
            <span>Select a Stage 3 client to manage site logs &amp; milestones...</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-neutral-400">
          {activeSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectProject) onSelectProject(null);
              }}
              className="p-1 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-white/10"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[8px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Input Bar */}
          <div className="p-2.5 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, email, or code..."
                className="w-full pl-8 pr-3 py-1.5 rounded-[6px] bg-white dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
          </div>

          {/* Client List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5 p-1">
            {isLoading && projects.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-neutral-400">
                Loading Stage 3 client directory...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-5 text-center text-xs font-mono text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-600 dark:text-neutral-300">No Stage 3 Projects Found</p>
                <p className="text-[11px] text-neutral-500">
                  {searchQuery ? "Try a different search query." : "Clients will appear here once approved for Stage 3 (Active Build)."}
                </p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = activeSelected?.project_code === p.project_code;
                return (
                  <button
                    key={p.client_project_id || p.project_code}
                    type="button"
                    onClick={() => {
                      if (onSelectProject) onSelectProject(p);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full p-2.5 rounded-[6px] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 text-neutral-900 dark:text-white"
                        : "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="relative w-8 h-8 rounded-full bg-neutral-900 border border-amber-500/20 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.client_name || "Client"}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="font-mono text-[11px] font-bold text-amber-400">
                            {getInitials(p.client_name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {p.client_name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-mono text-[10px]">
                            {p.project_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                          {p.project_title || p.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {p.progress_pct || 0}%
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Ribbon */}
          <div className="p-2 border-t border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900/40 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
            <span>Stage 3 (Active Build) Clients</span>
            <span>{filteredProjects.length} Available</span>
          </div>
        </div>
      )}
    </div>
  );
}
