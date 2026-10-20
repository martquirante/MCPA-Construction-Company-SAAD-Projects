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
    let bgImage = "/assets/weather/cloudy.jpg";

    if (isStormy || isHeavy) {
      weatherType = "storm";
      bgImage = "/assets/weather/rain.jpg";
    } else if (isLight) {
      weatherType = "rain";
      bgImage = "/assets/weather/rain.jpg";
    } else if (icon === "Sun" || cond.includes("clear") || cond.includes("sunny")) {
      weatherType = "sunny";
      bgImage = "/assets/weather/sunny.jpg";
    }

    return { weatherType, bgImage, isHeavyRain: isHeavy, isLightRain: isLight, isWindy };
  }, [condition, current, windSpeed]);

  const renderWeatherIcon = () => {
    const iconName = current?.icon || "";
    if (iconName === "CloudLightning") return <CloudLightning className="w-10 h-10 text-amber-400 animate-pulse" />;
    if (iconName === "CloudRain") return <CloudRain className="w-10 h-10 text-sky-400 animate-bounce" />;
    if (iconName === "CloudDrizzle") return <CloudDrizzle className="w-10 h-10 text-sky-300" />;
    if (iconName === "Cloud") return <Cloud className="w-10 h-10 text-slate-200 animate-weather-cloud-slow" />;
    return <Sun className="w-10 h-10 text-amber-400 animate-weather-sun-rotate" />;
  };

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-neutral-950 text-white border border-white/10 p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all select-none">
      {/* Sky Image Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={bgImage}
          alt="Atmospheric Sky"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover object-center animate-weather-sky-drift scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 pointer-events-none" />

        {/* Clouds overlay */}
        {weatherType === "cloudy" && (
          <div className="absolute top-0 right-[-10%] w-[120%] opacity-35 animate-weather-cloud-fast">
            <svg width="300" height="90" viewBox="0 0 240 90" fill="currentColor" className="text-slate-300">
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
                className="inline-block w-[1.5px] h-10 bg-gradient-to-b from-sky-300 to-transparent rounded-full animate-weather-rain"
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
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-300 font-bold flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Site Atmosphere</span>
        </span>
        <span className="text-[10.5px] font-mono text-neutral-300 font-medium truncate max-w-[190px]">
          {weatherData?.location || location}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-4 my-3">
        <div className="relative shrink-0">
          {renderWeatherIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-white font-display">
              {temp}
            </span>
            <span className="text-2xl font-extralight text-white/80 font-mono">
              °
            </span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-200 truncate pl-2">
              {condition}
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-medium flex items-center gap-1.5 ${
            isAdverse ? "text-rose-300 font-bold" : "text-emerald-300"
          }`}>
            {isAdverse ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{advisoryText}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 text-[10.5px] font-mono text-neutral-300 pt-2.5 border-t border-white/10 flex items-center justify-between backdrop-blur-xs">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-amber-400" />
          Humidity: {humidity}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-teal-300" />
          Wind: {windSpeed}
        </span>
      </div>
    </div>
  );
}
