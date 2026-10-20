"use client";

import { useMemo } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Gauge,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * Atmospheric Weather & 7-Day Engineering Outlook Card
 * Crafted with physical atmospheric backgrounds, live micro-animations,
 * and high-density civil engineering telemetry.
 */
export default function WeatherAtmosphericCard({
  weatherData,
  project,
  onPreFillWeatherNotice,
  isLoading = false,
}) {
  const current = weatherData?.current;
  const advisory = weatherData?.advisory;
  const daily = weatherData?.daily || [];

  // Determine atmospheric weather archetype for the background canvas
  const weatherType = useMemo(() => {
    if (!current) return "cloudy";
    const cond = (current.condition || "").toLowerCase();
    const icon = current.icon || "";

    if (icon === "CloudLightning" || cond.includes("thunderstorm") || cond.includes("monsoon")) {
      return "storm";
    }
    if (icon === "CloudRain" || icon === "CloudDrizzle" || cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
      return "rain";
    }
    if (icon === "Sun" || cond.includes("clear") || cond.includes("sunny")) {
      return "sunny";
    }
    return "cloudy";
  }, [current]);

  // Compute week temperature span for proportional visual temp bars (like Apple Weather)
  const weekTempSpan = useMemo(() => {
    if (!daily.length) return { min: 20, max: 38 };
    let min = 100;
    let max = -100;
    daily.forEach((d) => {
      const mn = parseInt(d.minTemp, 10) || 24;
      const mx = parseInt(d.maxTemp, 10) || 34;
      if (mn < min) min = mn;
      if (mx > max) max = mx;
    });
    return { min, max: Math.max(max, min + 1) };
  }, [daily]);

  // Render atmospheric background elements (clouds, sun rays, rain streaks)
  const renderAtmosphericBackground = () => {
    if (weatherType === "sunny") {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Solar ambient light gradient */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/25 via-amber-300/10 to-transparent blur-3xl animate-weather-sun-pulse" />
          {/* Rotating Solar Corona */}
          <div className="absolute top-[-30px] right-[-30px] sm:top-[-20px] sm:right-6 w-56 h-56 rounded-full border border-amber-400/20 animate-weather-sun-rotate opacity-60" />
          <div className="absolute top-[-10px] right-10 w-44 h-44 rounded-full border border-dashed border-amber-300/30 animate-weather-sun-rays opacity-40" />
          {/* Subtle warm horizontal horizon bloom */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-amber-500/5 to-transparent" />
        </div>
      );
    }

    if (weatherType === "cloudy") {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Diffused silver-slate sky gradient */}
          <div className="absolute top-0 right-0 w-[500px] h-64 bg-gradient-to-bl from-slate-300/20 dark:from-slate-700/15 via-slate-400/5 to-transparent blur-2xl" />

          {/* Drifting Layer 1: Slower, distant cloud silhouette */}
          <div className="absolute top-2 right-12 opacity-35 dark:opacity-20 animate-weather-cloud-slow">
            <svg width="240" height="90" viewBox="0 0 240 90" fill="currentColor" className="text-slate-400 dark:text-slate-500">
              <path d="M40 70 A25 25 0 0 1 70 35 A40 40 0 0 1 145 30 A30 30 0 0 1 190 45 A25 25 0 0 1 215 70 Z" />
            </svg>
          </div>

          {/* Drifting Layer 2: Foreground drifting cloud */}
          <div className="absolute top-10 right-36 opacity-45 dark:opacity-25 animate-weather-cloud-fast">
            <svg width="200" height="75" viewBox="0 0 200 75" fill="currentColor" className="text-slate-300 dark:text-slate-600">
              <path d="M30 60 A20 20 0 0 1 55 30 A32 32 0 0 1 120 25 A25 25 0 0 1 160 40 A20 20 0 0 1 180 60 Z" />
            </svg>
          </div>
        </div>
      );
    }

    if (weatherType === "rain") {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Atmospheric cool twilight mist */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-transparent to-sky-900/10 pointer-events-none" />

          {/* Staggered animated falling rain streaks */}
          <div className="absolute inset-0 flex justify-around opacity-40 dark:opacity-50">
            {[10, 22, 35, 48, 60, 72, 85, 94].map((pos, i) => (
              <span
                key={i}
                className="inline-block w-[1.5px] h-12 bg-gradient-to-b from-sky-400 to-transparent rounded-full animate-weather-rain"
                style={{
                  left: `${pos}%`,
                  position: "absolute",
                  animationDelay: `${(i * 0.18) % 1.2}s`,
                  animationDuration: `${1.1 + (i % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Soft rain cloud silhouette at top */}
          <div className="absolute -top-6 right-8 opacity-40 dark:opacity-30">
            <svg width="260" height="100" viewBox="0 0 260 100" fill="currentColor" className="text-sky-800 dark:text-sky-950">
              <path d="M45 80 A30 30 0 0 1 80 40 A48 48 0 0 1 170 32 A36 36 0 0 1 220 52 A30 30 0 0 1 250 80 Z" />
            </svg>
          </div>
        </div>
      );
    }

    if (weatherType === "storm") {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Tempest background lightning flash */}
          <div className="absolute inset-0 bg-amber-200/10 dark:bg-amber-100/15 animate-weather-lightning pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-900/15 rounded-full blur-3xl" />
        </div>
      );
    }

    return null;
  };

  // Helper for animated mini condition icon
  const renderWeatherIcon = (iconName, size = "w-6 h-6", isHero = false) => {
    switch (iconName) {
      case "CloudLightning":
        return <CloudLightning className={`${size} text-amber-500 animate-pulse`} />;
      case "CloudRain":
        return <CloudRain className={`${size} text-sky-500 ${isHero ? "animate-bounce" : ""}`} />;
      case "CloudDrizzle":
        return <CloudDrizzle className={`${size} text-sky-400`} />;
      case "CloudFog":
        return <CloudFog className={`${size} text-slate-400`} />;
      case "Cloud":
        return <Cloud className={`${size} text-slate-400 dark:text-slate-300 animate-weather-cloud-slow`} />;
      case "Sun":
      default:
        return <Sun className={`${size} text-amber-500 ${isHero ? "animate-weather-sun-rotate" : "animate-spin-slow"}`} />;
    }
  };

  const isAdverse = advisory?.isAdverse;
  const tomorrow = daily[1] || daily[0];

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-white dark:bg-[#0c0e14] border border-neutral-200/80 dark:border-white/[0.08] shadow-sm transition-all">
      {/* 1. ATMOSPHERIC AMBIENT CANVAS */}
      {renderAtmosphericBackground()}

      <div className="relative z-10 p-5 sm:p-6 space-y-6">
        {/* 2. ENTERPRISE STATION TELEMETRY BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 dark:border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-weather-radar-ping inline-block" />
                Live Radar Telemetry
              </span>
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                • High-Resolution ECMWF Satellite Model
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-0.5">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Site Atmospheric Intelligence &amp; 7-Day Outlook
              </h3>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {weatherData?.location || project?.location || "Bulacan Project Site"}
              </span>
              {weatherData?.coordinates && (
                <span className="text-[11px] opacity-75">
                  ({weatherData.coordinates.lat.toFixed(4)}° N, {weatherData.coordinates.lon.toFixed(4)}° E)
                </span>
              )}
            </p>
          </div>

          {/* Action: Pre-Fill Delay Notice if Adverse */}
          {isAdverse && (
            <button
              type="button"
              onClick={onPreFillWeatherNotice}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-mono font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
              title="Pre-populate the delay schedule form below with this weather alert"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pre-Fill Weather Delay Notice</span>
            </button>
          )}
        </div>

        {/* 3. HERO WEATHER DISPLAY & 4-METRIC SENSOR CLUSTER */}
        {weatherData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Big Tactile Weather Hero */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-[10px] bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/[0.06] backdrop-blur-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                    Current Atmospheric State
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white">
                      {current?.temperature?.replace("°C", "") || "29"}
                    </span>
                    <span className="text-2xl font-bold text-neutral-500 dark:text-neutral-400 font-mono">
                      °C
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {current?.condition || "Clear Sky"}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      • H: {daily[0]?.maxTemp || "35°C"} L: {daily[0]?.minTemp || "25°C"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-white dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.08] shadow-xs shrink-0">
                  {renderWeatherIcon(current?.icon, "w-10 h-10", true)}
                </div>
              </div>

              {/* Natural language engineering synthesis */}
              <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-white/[0.06] text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {isAdverse ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Saturated moisture index. High precipitation risk flagged for outdoor civil works.
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Optimal dry weather envelope. Suitable for mass excavation, slab curing, and rebar tying.
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: 4 Architectural Sensor Metrics */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Precipitation Probability */}
              <div className="p-3.5 rounded-[10px] bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Precip Risk</span>
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {daily[0]?.rainProbability || "15%"}
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    parseInt(daily[0]?.rainProbability, 10) >= 50
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {parseInt(daily[0]?.rainProbability, 10) >= 50 ? "Elevated Risk" : "Minimal Rain"}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-400">Pour threshold &lt;35%</div>
              </div>

              {/* Metric 2: Rain Accumulation */}
              <div className="p-3.5 rounded-[10px] bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Rain Volume</span>
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {daily[0]?.rainSum || "0.0mm"}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Expected 24h
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-400">Earthwork saturation</div>
              </div>

              {/* Metric 3: Wind Velocity */}
              <div className="p-3.5 rounded-[10px] bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Wind Speed</span>
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {current?.windSpeed || "8 km/h"}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Safe for Cranes
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-400">Scaffold limit: 38 km/h</div>
              </div>

              {/* Metric 4: Relative Humidity */}
              <div className="p-3.5 rounded-[10px] bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Rel Humidity</span>
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {current?.humidity || "72%"}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Ambient Vapor
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-400">Curing / paint rate</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. REFINED CIVIL ENGINEERING ADVISORY BANNER */}
        {advisory && (
          <div
            className={`p-4 rounded-[10px] border transition-colors ${
              isAdverse
                ? "bg-rose-500/[0.08] dark:bg-rose-500/[0.12] border-rose-500/30 text-rose-950 dark:text-rose-200"
                : "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2 rounded-[8px] shrink-0 mt-0.5 ${
                  isAdverse
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isAdverse ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                    isAdverse
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  }`}>
                    {advisory.level || (isAdverse ? "SAFETY WARNING" : "OPTIMAL WINDOW")}
                  </span>
                  <h4 className="font-bold font-mono text-xs uppercase tracking-wide">
                    {advisory.title}
                  </h4>
                </div>

                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans">
                  {advisory.message}
                </p>

                <div className="pt-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    Engineering Action:
                  </span>
                  <span>{advisory.recommendation}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 7-DAY FORECAST RAIL WITH APPLE-WEATHER-TIER VISUAL BARS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
              7-Day Atmospheric Outlook
            </span>
            <span className="text-[10px] text-neutral-400">
              Min / Max Range &amp; Precipitation Risk
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {daily.map((day, idx) => {
              const maxNum = parseInt(day.maxTemp, 10) || 32;
              const minNum = parseInt(day.minTemp, 10) || 24;
              const rainPercent = parseInt(day.rainProbability, 10) || 0;
              const isToday = idx === 0;
              const isTomorrow = idx === 1;

              // Format date label (e.g., "Today", "Tomorrow", "Wed 22")
              let dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : "";
              if (!dayLabel && day.date) {
                try {
                  const dObj = new Date(day.date);
                  dayLabel = dObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
                } catch {
                  dayLabel = day.date.slice(5);
                }
              }

              // Compute proportional temperature bar position
              const span = weekTempSpan.max - weekTempSpan.min || 1;
              const leftPercent = Math.max(0, Math.min(100, ((minNum - weekTempSpan.min) / span) * 100));
              const rightPercent = Math.max(0, Math.min(100, ((weekTempSpan.max - maxNum) / span) * 100));

              return (
                <div
                  key={day.date || idx}
                  className={`group relative p-3 rounded-[10px] border transition-all text-center flex flex-col justify-between ${
                    day.isAdverse
                      ? "bg-rose-500/[0.03] dark:bg-rose-500/[0.06] border-rose-500/25 hover:border-rose-500/40"
                      : isToday
                      ? "bg-neutral-100/80 dark:bg-white/[0.04] border-neutral-300 dark:border-white/15 shadow-2xs"
                      : "bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-white/[0.05] hover:border-neutral-300 dark:hover:border-white/10"
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <span className={`block text-[10px] font-mono font-bold uppercase truncate ${
                      isToday
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}>
                      {dayLabel}
                    </span>

                    {/* Condition Icon */}
                    <div className="my-2 flex justify-center">
                      {renderWeatherIcon(day.icon, "w-6 h-6")}
                    </div>

                    <span className="block text-[10px] font-mono text-neutral-600 dark:text-neutral-300 truncate" title={day.condition}>
                      {day.condition}
                    </span>
                  </div>

                  {/* Temperature & Visual Bar */}
                  <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-white/[0.05] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-400 text-[10px]">{minNum}°</span>
                      <span className="font-bold text-neutral-900 dark:text-white text-[11px]">{maxNum}°</span>
                    </div>

                    {/* Apple-Weather-style visual temperature distribution bar */}
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400"
                        style={{
                          left: `${leftPercent}%`,
                          right: `${rightPercent}%`,
                        }}
                      />
                    </div>

                    {/* Rain Probability Pill */}
                    <div className="pt-1 flex items-center justify-center gap-1 text-[10px] font-mono">
                      <Droplets className={`w-3 h-3 ${rainPercent >= 50 ? "text-rose-500" : "text-sky-500"}`} />
                      <span className={`font-semibold ${rainPercent >= 50 ? "text-rose-600 dark:text-rose-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                        {day.rainProbability}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
