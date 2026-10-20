"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Sun,
  CloudLightning,
  Wind,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import Stage3CustomerSelector from "./Stage3CustomerSelector";
import WeatherAtmosphericCard from "./WeatherAtmosphericCard";

export default function DelayManagementTab({
  project = null,
  projects = [],
  delays = [],
  onSelectProject,
  onLogDelay,
  showToast,
}) {
  const [category, setCategory] = useState("Weather / Monsoon Rain");
  const [daysDelayed, setDaysDelayed] = useState("1");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weather Telemetry
  const [weatherData, setWeatherData] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    if (!project?.project_code) {
      setWeatherData(null);
      return;
    }

    let isMounted = true;
    async function loadWeather() {
      try {
        if (!weatherData) setIsLoadingWeather(true);
        const loc = project.location || project.target_location || "Bulacan";
        const res = await fetch(`/api/weather/forecast?location=${encodeURIComponent(loc)}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setWeatherData(data);
        }
      } catch (err) {
        console.warn("[DelayManagementTab] Weather load error:", err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [project?.project_code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !daysDelayed || !project) return;

    setIsSubmitting(true);
    try {
      if (onLogDelay) {
        await onLogDelay({
          projectCode: project.project_code,
          category,
          daysDelayed: parseInt(daysDelayed, 10),
          reason,
        });
      } else {
        const res = await fetch("/api/construction/delays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            category,
            daysDelayed: parseInt(daysDelayed, 10),
            reason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to log delay");
      }

      if (showToast) showToast(`Logged delay of +${daysDelayed} days. Critical path revised & client notified!`);
      setReason("");
      setDaysDelayed("1");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreFillWeatherNotice = () => {
    if (!weatherData) return;
    const tomorrow = weatherData.daily?.[1] || weatherData.daily?.[0];
    setCategory("Weather / Monsoon Rain");
    setDaysDelayed("1");
    setReason(
      `Official Weather Advisory: Site inspection and outdoor concrete pouring operations paused due to forecasted ${tomorrow?.condition || "heavy rain"} (Rain Probability: ${tomorrow?.rainProbability || "60%"}). Critical path milestone shifted by 1 day for structural safety.`
    );
    if (showToast) showToast("Weather notice pre-filled. Review and click 'Publish Delay Advisory'.");
  };

  const advisory = weatherData?.advisory;
  const isAdverse = advisory?.isAdverse;

  return (
    <div className="space-y-6">
      {/* 1. STAGE 3 CUSTOMER SELECTOR */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs">
        <Stage3CustomerSelector
          selectedProject={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />
      </div>

      {!project ? (
        <div className="p-12 text-center rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-2">
          <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            No Stage 3 Client Project Selected
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto font-mono">
            Select a project above to inspect real-time weather telemetry, evaluate safety advisories, and manage critical path milestone schedule adjustments.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 2. REAL-TIME WEATHER INTELLIGENCE CARD (OPEN-METEO FREE API) */}
          <WeatherAtmosphericCard
            weatherData={weatherData}
            project={project}
            onPreFillWeatherNotice={handlePreFillWeatherNotice}
            isLoading={isLoadingWeather}
          />

          {/* 3. CRITICAL PATH & TARGET TURNOVER CALCULATION */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-white/5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
                  Algorithmic Critical Path Engine
                </span>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  Target Turnover &amp; Schedule Adjustment
                </h3>
                <p className="text-xs text-neutral-500 font-light font-mono">
                  Construction phases follow finish-to-start dependencies. Logging verified weather or logistics delays shifts downstream dates and notifies the client.
                </p>
              </div>

              {/* Turnover Comparison Ribbon */}
              <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block uppercase">Original Target</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {project.original_turnover || "Pending Mobilization"}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
                <div className="p-3 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                  <span className="text-[10px] text-amber-500 uppercase block font-bold">Revised Target</span>
                  <span className="font-bold">
                    {project.revised_turnover || project.original_turnover || "Pending Schedule"}
                  </span>
                </div>
              </div>
            </div>

            {/* Log Delay Event Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <h4 className="text-xs font-bold uppercase text-neutral-900 dark:text-white font-mono">
                Log Schedule Delay Event &amp; Dispatch Client Advisory
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Delay Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Weather / Monsoon Rain">Severe Weather / Monsoon Rain / Typhoon</option>
                    <option value="Material Supply Logistics">Material Supply Logistics</option>
                    <option value="LGU Permitting Inspection">LGU Permitting / Municipal Inspection</option>
                    <option value="Client Scope Modification">Client Architectural Scope Modification</option>
                    <option value="Site Geotechnical Condition">Site Geotechnical / Soil Condition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Adjusted Duration (+Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={daysDelayed}
                    onChange={(e) => setDaysDelayed(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Technical Reason &amp; Client Notification *</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide technical justification (e.g. Typhoon alert issued by PAGASA; concrete curing delayed by heavy monsoon rain)..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !reason}
                  className="px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Recalculating..." : "Publish Delay & Shift Turnover Date"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. DELAY AUDIT TRAIL */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase text-neutral-900 dark:text-white font-mono tracking-wider">
              Recorded Delay History ({delays.length} Events)
            </h4>

            {delays.length === 0 ? (
              <p className="text-xs font-mono text-neutral-400 italic">
                Zero schedule delays logged for {project.project_code}. Critical path build schedule remains on track.
              </p>
            ) : (
              <div className="space-y-2">
                {delays.map((del, idx) => (
                  <div
                    key={del.event_id || idx}
                    className="p-3.5 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold uppercase text-[10px]">
                          {del.category}
                        </span>
                        <span className="text-neutral-400 text-[11px]">
                          {del.logged_at ? new Date(del.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300 font-sans text-xs">
                        {del.reason}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs">
                        +{del.days_delayed} {del.days_delayed === 1 ? "Day" : "Days"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
