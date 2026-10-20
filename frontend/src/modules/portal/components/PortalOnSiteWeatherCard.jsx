"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Wind,
  Gauge,
  MapPin,
} from "lucide-react";

export default function PortalOnSiteWeatherCard({
  location = "Bulacan Site Location",
  initialTemp,
  initialCondition,
}) {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      if (typeof document !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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

  const temp = current?.temperature?.replace("°C", "") || initialTemp?.replace("°C", "") || "28";
  const condition = current?.condition || initialCondition || "Clear Sky";
  const humidity = current?.humidity || "73%";
  const windSpeed = current?.windSpeed || "5.5 km/h";

  const isAdverse = advisory?.isAdverse;
  const advisoryText = advisory?.title
    ? isAdverse
      ? "Adverse Weather Alert"
      : "Optimal for Site Concrete Works"
    : "Live Engineering Weather Feed";

  const { weatherType, bgImage, isHeavyRain, isLightRain, isWindy } = useMemo(() => {
    const cond = (condition || "").toLowerCase();
    const icon = current?.icon || "";
    const isStormy = icon === "CloudLightning" || cond.includes("thunderstorm") || cond.includes("monsoon");
    const isHeavy = cond.includes("heavy") || cond.includes("shower");
    const isLight = !isHeavy && (icon === "CloudRain" || icon === "CloudDrizzle" || cond.includes("rain") || cond.includes("drizzle"));
    const isWindy = parseFloat(windSpeed) >= 10 || cond.includes("wind");

    let weatherType = "cloudy";
    let bgImage = isDark ? "/assets/weather/cloudy.jpg" : "/assets/weather/cloudy-day.jpg";

    if (isStormy || isHeavy) {
      weatherType = "storm";
      bgImage = isDark ? "/assets/weather/rain.jpg" : "/assets/weather/rain-day.jpg";
    } else if (isLight) {
      weatherType = "rain";
      bgImage = isDark ? "/assets/weather/rain.jpg" : "/assets/weather/rain-day.jpg";
    } else if (icon === "Sun" || cond.includes("clear") || cond.includes("sunny")) {
      weatherType = "sunny";
      bgImage = "/assets/weather/sunny.jpg";
    }

    return { weatherType, bgImage, isHeavyRain: isHeavy, isLightRain: isLight, isWindy };
  }, [condition, current, windSpeed, isDark]);

  const renderWeatherIcon = () => {
    const iconName = current?.icon || "";
    if (iconName === "CloudLightning") return <CloudLightning className="w-10 h-10 text-amber-500 dark:text-amber-400 animate-pulse" />;
    if (iconName === "CloudRain") return <CloudRain className="w-10 h-10 text-sky-600 dark:text-sky-400 animate-bounce" />;
    if (iconName === "CloudDrizzle") return <CloudDrizzle className="w-10 h-10 text-sky-500 dark:text-sky-300" />;
    if (iconName === "Cloud") return <Cloud className="w-10 h-10 text-slate-500 dark:text-slate-200 animate-weather-cloud-slow" />;
    return <Sun className="w-10 h-10 text-amber-500 dark:text-amber-400 animate-weather-sun-rotate" />;
  };

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-300 select-none">
      {/* Sky Image Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={bgImage}
          alt="Atmospheric Sky"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover object-center animate-weather-sky-drift scale-105 opacity-90 dark:opacity-100 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-white/20 dark:from-black/85 dark:via-black/45 dark:to-black/30 pointer-events-none transition-colors duration-300" />

        {/* Clouds overlay */}
        {weatherType === "cloudy" && (
          <div className="absolute top-0 right-[-10%] w-[120%] opacity-30 dark:opacity-35 animate-weather-cloud-fast">
            <svg width="300" height="90" viewBox="0 0 240 90" fill="currentColor" className="text-slate-400 dark:text-slate-300">
              <path d="M40 70 A25 25 0 0 1 70 35 A40 40 0 0 1 145 30 A30 30 0 0 1 190 45 A25 25 0 0 1 215 70 Z" />
            </svg>
          </div>
        )}

        {/* Rain droplets */}
        {(isHeavyRain || isLightRain) && (
          <div className="absolute inset-0 flex justify-around opacity-60">
            {[15, 38, 62, 85].map((pos, i) => (
              <span
                key={i}
                className="inline-block w-[1.5px] h-10 bg-gradient-to-b from-sky-400 to-transparent dark:from-sky-300 dark:to-transparent rounded-full animate-weather-rain"
                style={{
                  left: `${pos}%`,
                  position: "absolute",
                  animationDelay: `${i * 0.28}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Sun corona */}
        {weatherType === "sunny" && (
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/25 blur-2xl animate-weather-sun-pulse" />
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-600 dark:text-neutral-300 font-bold flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Live Site Atmosphere</span>
        </span>
        <span className="text-[10.5px] font-mono text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[190px]">
          {weatherData?.location || location}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-4 my-3">
        <div className="relative shrink-0">
          {renderWeatherIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-neutral-900 dark:text-white font-display">
              {temp}
            </span>
            <span className="text-2xl font-extralight text-neutral-500 dark:text-white/80 font-mono">
              °
            </span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-200 truncate pl-2">
              {condition}
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-medium flex items-center gap-1.5 ${
            isAdverse ? "text-rose-700 dark:text-rose-300 font-bold" : "text-emerald-700 dark:text-emerald-300"
          }`}>
            {isAdverse ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{advisoryText}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 text-[10.5px] font-mono text-neutral-600 dark:text-neutral-300 pt-2.5 border-t border-neutral-200/70 dark:border-white/10 flex items-center justify-between backdrop-blur-xs">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-amber-500 dark:text-amber-400" />
          Humidity: {humidity}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-teal-600 dark:text-teal-300" />
          Wind: {windSpeed}
        </span>
      </div>
    </div>
  );
}
