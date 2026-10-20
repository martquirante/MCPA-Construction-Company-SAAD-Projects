"use client";
import { useState, useEffect, useMemo } from "react";
import { Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, CloudFog, AlertTriangle, CheckCircle2, Droplets, Wind, Gauge } from "lucide-react";

export default function PortalOnSiteWeatherCard({
  location = "Bulacan Site Location",
  initialTemp,
  initialCondition,
}) {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/weather/forecast?location=${encodeURIComponent(location || "Bulacan")}`);
        if (!res.ok) throw new Error("Failed to fetch weather");
        const data = await res.json();
        if (isMounted && data.success) {
          setWeatherData(data);
        }
      } catch (err) {
        console.warn("[PortalOnSiteWeatherCard] Live weather fallback:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [location]);

  const current = weatherData?.current;
  const advisory = weatherData?.advisory;

  const temp = current?.temperature || initialTemp || "29°C";
  const condition = current?.condition || initialCondition || "Clear Sky";
  const humidity = current?.humidity || "73%";
  const windSpeed = current?.windSpeed || "5.5 km/h";

  const isAdverse = advisory?.isAdverse;
  const advisoryText = advisory?.title
    ? (isAdverse ? "Adverse Weather Alert" : "Optimal for Concrete Curing")
    : "Live Engineering Weather Feed";

  const weatherType = useMemo(() => {
    const cond = (condition || "").toLowerCase();
    const icon = current?.icon || "";
    if (icon === "CloudLightning" || cond.includes("thunderstorm") || cond.includes("monsoon")) return "storm";
    if (icon === "CloudRain" || icon === "CloudDrizzle" || cond.includes("rain") || cond.includes("drizzle")) return "rain";
    if (icon === "Sun" || cond.includes("clear") || cond.includes("sunny")) return "sunny";
    return "cloudy";
  }, [condition, current]);

  const renderWeatherIcon = () => {
    const iconName = current?.icon || "";
    if (iconName === "CloudLightning") return <CloudLightning className="w-10 h-10 text-amber-500 animate-pulse" />;
    if (iconName === "CloudRain") return <CloudRain className="w-10 h-10 text-sky-500 animate-bounce" />;
    if (iconName === "CloudDrizzle") return <CloudDrizzle className="w-10 h-10 text-sky-400" />;
    if (iconName === "Cloud") return <Cloud className="w-10 h-10 text-slate-400 animate-weather-cloud-slow" />;
    return <Sun className="w-10 h-10 text-amber-500 animate-weather-sun-rotate" />;
  };

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-white dark:bg-[#0c0e14] border border-neutral-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all">
      {/* Atmospheric Ambient Sky Canvas */}
      {weatherType === "sunny" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-300/5 to-transparent blur-2xl animate-weather-sun-pulse" />
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full border border-amber-400/20 animate-weather-sun-rotate opacity-50" />
        </div>
      )}

      {weatherType === "cloudy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -top-2 right-4 opacity-30 dark:opacity-20 animate-weather-cloud-slow">
            <svg width="180" height="70" viewBox="0 0 240 90" fill="currentColor" className="text-slate-400">
              <path d="M40 70 A25 25 0 0 1 70 35 A40 40 0 0 1 145 30 A30 30 0 0 1 190 45 A25 25 0 0 1 215 70 Z" />
            </svg>
          </div>
        </div>
      )}

      {weatherType === "rain" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
          {[15, 40, 65, 85].map((pos, i) => (
            <span
              key={i}
              className="inline-block w-[1.5px] h-10 bg-gradient-to-b from-sky-400 to-transparent rounded-full animate-weather-rain"
              style={{
                left: `${pos}%`,
                position: "absolute",
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-weather-radar-ping inline-block" />
          <span>Live Site Radar</span>
        </span>
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[190px]">
          {weatherData?.location || location}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-4 my-3">
        <div className="relative shrink-0">
          {renderWeatherIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white">
              {temp}
            </span>
            <span className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate">
              {condition}
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-medium flex items-center gap-1.5 ${
            isAdverse ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-700 dark:text-emerald-400"
          }`}>
            {isAdverse ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{advisoryText}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-amber-500" />
          Humidity: {humidity}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-teal-500" />
          Wind: {windSpeed}
        </span>
      </div>
    </div>
  );
}

