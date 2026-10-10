"use client";

export default function PortalOverallProgressCard({
  progressPct = 0,
  nextMilestone = "Roofing & MEP Handover",
  targetDate = "Dec 2026",
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.min(100, Math.max(0, Number(progressPct) || 0));
  const strokeDashoffset = circumference - (safePct / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold">
          Overall Progress
        </span>
        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
          {safePct}% Completed
        </span>
      </div>

      <div className="flex items-center gap-5 my-2">
        {/* Radial Circular Progress Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-neutral-100 dark:text-white/10"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-amber-500 transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-mono font-extrabold text-neutral-900 dark:text-white">
              {safePct}%
            </span>
          </div>
        </div>

        {/* Next Milestone Detail (Clean text, no bulky background) */}
        <div className="min-w-0 space-y-1">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Next Milestone
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
            {nextMilestone}
          </h4>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 block">
            Target: {targetDate}
          </span>
        </div>
      </div>

      <div className="text-[10.5px] font-mono text-neutral-400 pt-1 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
        <span>Gantt Tracking</span>
        <span>Active Site Phase</span>
      </div>
    </div>
  );
}
