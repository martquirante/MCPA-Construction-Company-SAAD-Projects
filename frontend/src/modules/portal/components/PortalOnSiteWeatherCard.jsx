"use client";
import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, AlertTriangle, CheckCircle2 } from "lucide-react";

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
  const condition = current?.condition || initialCondition || "Partly Cloudy";
  const humidity = current?.humidity || "75%";
  const windSpeed = current?.windSpeed || "12 km/h";

  const isAdverse = advisory?.isAdverse;
  const advisoryText = advisory?.title
    ? (isAdverse ? "Adverse Weather Alert" : "Optimal for Concrete Curing")
    : "Live Engineering Weather Feed";

  const renderWeatherIcon = () => {
    const iconName = current?.icon || "";
    if (iconName === "CloudLightning") return <CloudLightning className="w-10 h-10 text-amber-500" />;
    if (iconName === "CloudRain") return <CloudRain className="w-10 h-10 text-sky-500" />;
    if (iconName === "CloudDrizzle") return <CloudDrizzle className="w-10 h-10 text-sky-400" />;
    if (iconName === "Cloud") return <Cloud className="w-10 h-10 text-neutral-400" />;
    return <Sun className="w-10 h-10 text-amber-500 animate-spin-slow" />;
  };

  return (
    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold flex items-center gap-1.5">
          <span>On-Site Weather</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Open-Meteo Telemetry" />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[180px]">
          {weatherData?.location || location}
        </span>
      </div>

      <div className="flex items-center gap-4 my-2">
        <div className="relative shrink-0">
          {renderWeatherIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-extrabold text-neutral-900 dark:text-white">
              {temp}
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 truncate">
              {condition}
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-medium flex items-center gap-1 ${
            isAdverse ? "text-rose-600 dark:text-rose-400 font-bold" : "text-neutral-500 dark:text-neutral-400"
          }`}>
            {isAdverse ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            <span className="truncate">{advisoryText}</span>
          </p>
        </div>
      </div>

      <div className="text-[10.5px] font-mono text-neutral-400 pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
        <span>Humidity: {humidity}</span>
        <span>Wind: {windSpeed}</span>
      </div>
    </div>
  );
}
