"use client";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalMilestoneStepper({
  milestones = [],
  overallPct = 0,
  currentPhase = "",
  onViewAll,
}) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  if (!milestones || milestones.length === 0) {
    return (
      <PortalEmptyState
        type="milestones"
        badge="Structural Schedule"
        title="No Milestones Scheduled"
        description="Gantt-tracked milestones will stream here once site mobilization begins."
      />
    );
  }

  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Construction Milestones</span>
            <span className="text-xs font-mono font-normal text-amber-600 dark:text-amber-400">
              ({overallPct}% Overall)
            </span>
          </h3>
          <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
            Active Phase: {currentPhase || "Roofing & MEP rough-in"}
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Milestones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stepper Timeline Bar */}
      <div className="relative pt-2 pb-1 overflow-x-auto no-scrollbar">
        <div className="min-w-[480px] sm:min-w-0">
          {/* Track line behind nodes */}
          <div className="relative flex items-center justify-between">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-neutral-100 dark:bg-white/10 rounded-full z-0" />

            {/* Connecting filled track line up to active stage */}
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full z-0 transition-all duration-700"
              style={{
                width: `calc(${Math.min(100, Math.max(8, overallPct))}% - 32px)`,
              }}
            />

            {/* Stage Nodes */}
            {milestones.map((ms, idx) => {
              const isCompleted = ms.status === "Completed" || ms.completion_pct === 100;
              const isInProgress = ms.status === "In Progress" || (ms.completion_pct > 0 && ms.completion_pct < 100);
              const isSelected = selectedMilestone?.milestone_id === ms.milestone_id;

              return (
                <div
                  key={ms.milestone_id || idx}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                  onClick={() => setSelectedMilestone(isSelected ? null : ms)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Node Circle */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isCompleted
                        ? "bg-amber-500 text-neutral-950 font-bold border-2 border-amber-400 ring-4 ring-amber-500/20"
                        : isInProgress
                        ? "bg-neutral-900 text-amber-400 border-2 border-amber-400 ring-4 ring-amber-500/25 animate-pulse"
                        : "bg-white dark:bg-[#181b24] text-neutral-400 border-2 border-neutral-300 dark:border-white/15 group-hover:border-neutral-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isInProgress ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    )}
                  </div>

                  {/* Stage Label (Clean text, no bulky background) */}
                  <div className="mt-2 text-center max-w-[90px]">
                    <span
                      className={`block text-[11px] font-mono font-semibold truncate ${
                        isCompleted
                          ? "text-neutral-900 dark:text-white"
                          : isInProgress
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {ms.phase_name}
                    </span>
                    <span className="block text-[9.5px] font-mono text-neutral-400 dark:text-neutral-500">
                      {isCompleted
                        ? "Completed"
                        : isInProgress
                        ? `${ms.completion_pct}% Active`
                        : ms.target_date || "Upcoming"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Milestone Inspection Details Drawer */}
      {selectedMilestone && (
        <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                {selectedMilestone.phase_code || "PHASE"}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {selectedMilestone.phase_name}
              </h4>
            </div>

            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {selectedMilestone.status} ({selectedMilestone.completion_pct}%)
            </span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {selectedMilestone.notes || "Civil works progressing according to master construction schedule."}
          </p>

          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-white/5">
            <span>Target Completion: {selectedMilestone.target_date || "TBD"}</span>
            <span>Weight Contribution: {selectedMilestone.weight || 20}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
