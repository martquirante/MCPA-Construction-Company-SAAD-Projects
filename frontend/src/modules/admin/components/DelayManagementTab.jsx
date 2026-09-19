"use client";

import { useState } from "react";
import {
  CalendarIcon,
  CheckIcon,
  SparkleBadgeIcon,
  ShieldCheckIcon,
} from "@/modules/shared/Icons";

export default function DelayManagementTab({
  project,
  delays = [],
  onLogDelay,
  showToast,
}) {
  const [category, setCategory] = useState("Weather / Monsoon Rain");
  const [daysDelayed, setDaysDelayed] = useState("7");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !daysDelayed) return;

    setIsSubmitting(true);
    await onLogDelay({
      projectCode: project?.project_code || "MCPA-PLR-2024",
      category,
      daysDelayed: parseInt(daysDelayed, 10),
      reason,
    });

    setIsSubmitting(false);
    setReason("");
    showToast(`Logged delay of ${daysDelayed} days. Critical path revised!`);
  };

  return (
    <div className="space-y-6">
      {/* Schedule & Critical Path Shift Ribbon */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-white/5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
              Algorithmic Critical Path Engine
            </span>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
              Target Turnover &amp; Schedule Shift Tracking
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Construction tasks follow Finish-to-Start dependencies. When delays occur, the system shifts downstream dates and generates data-driven justifications for the client.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono">
              <span className="text-[10px] text-neutral-400 block uppercase">Original Target</span>
              <span className="font-bold text-neutral-900 dark:text-white">{project?.original_turnover || "Nov 15, 2024"}</span>
            </div>
            <span className="text-neutral-400 font-bold">&rarr;</span>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-700 dark:text-rose-400">
              <span className="text-[10px] text-rose-500 dark:text-rose-400 block uppercase">Revised Target</span>
              <span className="font-bold">{project?.revised_turnover || "Nov 28, 2024"}</span>
            </div>
          </div>
        </div>

        {/* Log Delay Event Form */}
        <form onSubmit={handleSubmit} className="pt-2 space-y-4 text-xs font-mono">
          <h4 className="text-xs font-bold uppercase text-neutral-900 dark:text-white">
            Log New Delay Event
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Delay Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="Weather / Monsoon Rain">Weather / Monsoon Rain</option>
                <option value="Material Supply Logistics">Material Supply Logistics</option>
                <option value="Client Scope Modification">Client Scope Modification</option>
                <option value="LGU Permitting Inspection">LGU Permitting Inspection</option>
                <option value="Site Geotechnical Condition">Site Geotechnical Condition</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Days Adjusted (+Days) *</label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={daysDelayed}
                onChange={(e) => setDaysDelayed(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Supervising Engineer</label>
              <input
                type="text"
                disabled
                value={project?.lead_engineer || "Engr. Raymart Quirante, CE"}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">
              Documented Justification &amp; Impact Analysis *
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Typhoon rain flooded approach road in Plaridel; concrete ready-mix trucks halted for curing safety."
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono uppercase transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              {isSubmitting ? "Recalculating..." : "Apply Critical Path Schedule Shift"}
            </button>
          </div>
        </form>
      </div>

      {/* Delay Audit History Log */}
      <div className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-100 dark:border-white/5">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
            Documented Schedule Shift Audit Trail ({delays.length})
          </h3>
          <p className="text-xs text-neutral-500 font-light">
            Every schedule adjustment is permanently logged for client transparency and dispute prevention.
          </p>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-white/5">
          {delays.map((d) => (
            <div key={d.event_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                    {d.category}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {new Date(d.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-xs text-neutral-800 dark:text-neutral-200 font-light max-w-2xl leading-relaxed">
                  {d.reason}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-mono font-bold text-xs">
                  +{d.days_delayed} Days Shift
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
