"use client";
import Image from "next/image";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalLiveTimeline({
  photoLogs = [],
  onSelectPhoto,
  onViewAll,
}) {
  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
            Live Site Activity &amp; QA Timeline
          </h3>
        </div>

        {onViewAll && photoLogs.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {photoLogs.length === 0 ? (
          <PortalEmptyState
            type="gallery"
            badge="Site Activity Log"
            title="No Activity Logs Streamed Yet"
            description="Inspection stamps, structural concrete slump results, and rebar QA logs will stream here as site activities occur."
            className="p-6 sm:p-8"
          />
        ) : (
          photoLogs.map((log, idx) => (
            <div
              key={log.log_id || idx}
              onClick={() => onSelectPhoto && onSelectPhoto(log)}
              className="p-3.5 sm:p-4 rounded-[14px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 hover:border-amber-500/30 transition-all flex items-start gap-3.5 cursor-pointer group"
            >
              {/* Photo Thumbnail */}
              {log.image_url && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] overflow-hidden bg-neutral-900 shrink-0 border border-black/10">
                  <Image
                    src={log.image_url}
                    alt={log.title || "Site Photo"}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Log Details (Rule: If not a button, no background box - clean text and icon only!) */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {log.log_date || "Today"}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Passed QC</span>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {log.title}
                </h4>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {log.caption || "Inspection signed off by site structural team."}
                </p>

                <div className="text-[10px] font-mono text-neutral-400 pt-0.5">
                  Inspector: {log.inspector || "Engr. Aris Reyes"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
