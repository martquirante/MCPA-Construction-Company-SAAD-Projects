"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Archive,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Share2,
  Clock,
  Award,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";
import FinishedProjectDossierCard from "@/modules/shared/FinishedProjectDossierCard";
import WrappedStoryExperience from "@/modules/wrapped/WrappedStoryExperience";
import AdminEmptyState from "./AdminEmptyState";

export default function FinishedProjectsTab({
  showToast = () => {},
  onOpenShowcase = () => {},
  onShowcaseChanged = () => {},
}) {
  const [dossiers, setDossiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showcaseFilter, setShowcaseFilter] = useState("all"); // "all" | "draft" | "live" | "unsynced"
  const [resyncingId, setResyncingId] = useState(null);
  const [activeWrappedPayload, setActiveWrappedPayload] = useState(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    async function runFetch() {
      try {
        const res = await authFetch("/api/finished-projects");
        const data = await res.json();
        if (!isCancelled && data.success && Array.isArray(data.projects)) {
          setDossiers(data.projects);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Could not load finished projects dossiers:", err);
          showToast("Failed to load finished projects.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    runFetch();
    return () => {
      isCancelled = true;
    };
  }, [showToast, refreshIndex]);

  const fetchDossiers = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  // Handle re-syncing >=90% photos to showcase
  const handleResyncShowcase = async (clientProjectId) => {
    setResyncingId(clientProjectId);
    showToast("Syncing ≥90% completion photos to Projects Showcase...");
    try {
      const res = await authFetch(`/api/admin/finished-projects/${clientProjectId}/sync-showcase`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Showcase updated (${data.imageCount} completion photos synced).`);
        await fetchDossiers();
        onShowcaseChanged();
      } else {
        showToast(data.message || "Showcase sync failed.");
      }
    } catch (err) {
      console.warn("Resync error:", err);
      showToast("Failed to sync to Showcase.");
    } finally {
      setResyncingId(null);
    }
  };

  // Launch wrapped preview modal
  const handleLaunchWrapped = async (dossier) => {
    try {
      showToast("Loading 12-Chapter Wrapped Monograph...");
      const res = await authFetch(`/api/projects/${dossier.clientProjectId}/wrapped`);
      const data = await res.json();
      if (data.success && data.wrapped?.wrapped_payload) {
        setActiveWrappedPayload({
          ...data.wrapped.wrapped_payload,
          shareToken: data.wrapped.share_token,
        });
      } else {
        showToast("Wrapped payload not found. Generating now...");
        const regenRes = await authFetch(`/api/projects/${dossier.clientProjectId}/wrapped/regenerate`, {
          method: "POST",
        });
        const regenData = await regenRes.json();
        if (regenData.success && regenData.wrapped?.wrapped_payload) {
          setActiveWrappedPayload({
            ...regenData.wrapped.wrapped_payload,
            shareToken: regenData.wrapped.share_token,
          });
        }
      }
    } catch (err) {
      console.warn("Error loading wrapped:", err);
      showToast("Could not load Wrapped story.");
    }
  };

  // Telemetry Calculations
  const metrics = useMemo(() => {
    const total = dossiers.length;
    const synced = dossiers.filter((d) => d.showcase).length;
    const live = dossiers.filter((d) => d.showcase?.isWebVisible).length;
    const drafts = synced - live;
    const totalPhotos = dossiers.reduce((s, d) => s + (d.finalPhotos?.length || 0), 0);
    const avgDays = total > 0
      ? Math.round(dossiers.reduce((s, d) => s + (d.stats?.totalDays || 0), 0) / total)
      : 0;

    return { total, synced, live, drafts, totalPhotos, avgDays };
  }, [dossiers]);

  // Filtering
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.title?.toLowerCase().includes(q) ||
        d.projectCode?.toLowerCase().includes(q) ||
        d.clientName?.toLowerCase().includes(q) ||
        d.cityProvince?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (showcaseFilter === "draft") return d.showcase && !d.showcase.isWebVisible;
      if (showcaseFilter === "live") return d.showcase && d.showcase.isWebVisible;
      if (showcaseFilter === "unsynced") return !d.showcase;
      return true;
    });
  }, [dossiers, searchQuery, showcaseFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Telemetry Strip */}
      <div className="p-6 sm:p-8 rounded-[6px] border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#0e1117] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neutral-400">
                Monograph & Showcase Registry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">
              Finished Projects & Wrapped Hub
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans max-w-2xl leading-relaxed">
              Permanent architectural archive of all completed builds. Review complete end-to-end project history, preview client 12-chapter Wrapped monographs, and sync ≥90% completion photography directly to the Projects Showcase.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDossiers}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-[5px] border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white font-mono text-xs inline-flex items-center gap-1.5 self-start md:self-auto cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Archive</span>
          </button>
        </div>

        {/* 4 Architectural Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Finished Projects
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
              100% turnkey handed over
            </span>
          </div>

          <div className="p-4 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Showcase Sync State
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
              {metrics.synced} <span className="text-xs font-normal text-neutral-400">({metrics.drafts} drafts)</span>
            </span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block mt-1">
              {metrics.live} live on public website
            </span>
          </div>

          <div className="p-4 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Avg. Build Duration
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
              {metrics.avgDays} <span className="text-xs font-normal text-neutral-400">Days</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-1">
              Inquiry to key turnover
            </span>
          </div>

          <div className="p-4 rounded-[5px] border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              ≥90% Photos Archived
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
              {metrics.totalPhotos} <span className="text-xs font-normal text-neutral-400">Photos</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
              Curated for showcase & wrapped
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-[6px] border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#0e1117] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, client, or code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[4px] border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <span className="text-neutral-400 text-[11px] mr-1">Showcase:</span>
          {[
            { id: "all", label: "All" },
            { id: "draft", label: "Drafts Only" },
            { id: "live", label: "Live Only" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setShowcaseFilter(pill.id)}
              className={`px-2.5 py-1 rounded-[4px] border transition-colors cursor-pointer ${
                showcaseFilter === pill.id
                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                  : "border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Finished Projects Dossier List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-neutral-400 animate-pulse border border-neutral-200 dark:border-white/10 rounded-[6px]">
            LOADING FINISHED PROJECTS ARCHIVE...
          </div>
        ) : filteredDossiers.length === 0 ? (
          searchQuery || showcaseFilter !== "all" ? (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/msoeawqm.json"
              size={88}
              colors="primary:#f59e0b,secondary:#64748b"
              fallback={Building2}
              badgeText="No Filter Matches"
              title="No Matching Finished Projects"
              description={
                searchQuery
                  ? `No finished projects match "${searchQuery}". Try clearing your search query or switching filters.`
                  : `No finished projects found under the "${showcaseFilter}" filter.`
              }
              actionButton={
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowcaseFilter("all");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer shadow-xs"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <AdminEmptyState
              iconSrc="https://cdn.lordicon.com/gmzxduhd.json"
              size={104}
              colors="primary:#f59e0b,secondary:#64748b"
              fallback={Building2}
              badgeText="Stage 4 · Turnkey Archive"
              title="No Finished Projects Found"
              description="When projects complete their scheduled turnover or reach 100% accomplishment in Stage 3, they will automatically appear here as finished architectural dossiers."
              actionButton={
                <button
                  type="button"
                  onClick={fetchDossiers}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-[4px] border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh Archive</span>
                </button>
              }
            />
          )
        ) : (
          filteredDossiers.map((dossier) => (
            <FinishedProjectDossierCard
              key={dossier.clientProjectId}
              dossier={dossier}
              audience="admin"
              onLaunchWrapped={() => handleLaunchWrapped(dossier)}
              onOpenShowcase={onOpenShowcase}
              onResyncShowcase={() => handleResyncShowcase(dossier.clientProjectId)}
              isResyncing={resyncingId === dossier.clientProjectId}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* Wrapped Full-Screen Preview Modal */}
      {activeWrappedPayload && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in">
          <WrappedStoryExperience
            payload={activeWrappedPayload}
            initialTheme="dark"
            onClose={() => setActiveWrappedPayload(null)}
            mode="modal"
            shareToken={activeWrappedPayload.shareToken}
          />
        </div>
      )}
    </div>
  );
}
