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
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Zap,
  MapPin,
  Calendar,
} from "lucide-react";

function getForecastSeverity(rainPercent, isAdverse) {
  if (rainPercent >= 80) {
    return {
      card: "bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-950 dark:text-rose-200 hover:border-rose-300 dark:hover:border-rose-400/50",
      label: "text-rose-600 dark:text-rose-300",
    };
  }

  if (rainPercent >= 60 || isAdverse) {
    return {
      card: "bg-orange-50/80 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-950 dark:text-orange-200 hover:border-orange-300 dark:hover:border-orange-400/50",
      label: "text-orange-600 dark:text-orange-300",
    };
  }

  if (rainPercent >= 40) {
    return {
      card: "bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-950 dark:text-amber-200 hover:border-amber-300 dark:hover:border-amber-400/50",
      label: "text-amber-600 dark:text-amber-300",
    };
  }

  if (rainPercent >= 25) {
    return {
      card: "bg-sky-50/70 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-950 dark:text-sky-200 hover:border-sky-300 dark:hover:border-sky-400/50",
      label: "text-sky-600 dark:text-sky-300",
    };
  }

  return {
    card: "bg-white/80 dark:bg-white/5 border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.08]",
    label: "text-neutral-600 dark:text-neutral-300",
  };
}

/**
 * Mobile-grade Atmospheric Weather & 7-Day Engineering Outlook Card
 * Dynamically adapts between Light Theme (luminous daytime skies & frosted white glass)
 * and Dark Theme (cinematic moody dusk/storm skies & deep obsidian glass).
 */
export default function WeatherAtmosphericCard({
  weatherData,
  project,
  onPreFillWeatherNotice,
  isPreFilled = false,
  isLoading = false,
}) {
  const current = weatherData?.current;
  const advisory = weatherData?.advisory;
  const daily = weatherData?.daily || [];

  // Reactive Dark Mode Detection
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

  // Determine atmospheric weather archetype and background asset based on theme
  const { weatherType, bgImage, isHeavyRain, isLightRain, isWindy, isStormy } = useMemo(() => {
    if (!current) {
      return {
        weatherType: "cloudy",
        bgImage: isDark ? "/assets/weather/cloudy.jpg" : "/assets/weather/cloudy-day.jpg",
        isHeavyRain: false,
        isLightRain: false,
        isWindy: false,
        isStormy: false,
      };
    }

    const cond = (current.condition || "").toLowerCase();
    const icon = current.icon || "";
    const rainProb = parseInt(daily[0]?.rainProbability, 10) || 0;
    const rainSum = parseFloat(daily[0]?.rainSum) || 0;
    const windSpeedNum = parseFloat(current.windSpeed) || 0;

    const isStormy =
      icon === "CloudLightning" ||
      cond.includes("thunderstorm") ||
      cond.includes("monsoon") ||
      cond.includes("lightning");

    const isHeavy =
      cond.includes("heavy") ||
      rainProb >= 60 ||
      rainSum >= 3.0;

    const isLight =
      !isHeavy &&
      (icon === "CloudRain" ||
        icon === "CloudDrizzle" ||
        cond.includes("rain") ||
        cond.includes("drizzle") ||
        cond.includes("shower") ||
        rainProb >= 25);

    const isWindy = windSpeedNum >= 10 || cond.includes("wind") || cond.includes("gust");

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
    } else {
      weatherType = "cloudy";
      bgImage = isDark ? "/assets/weather/cloudy.jpg" : "/assets/weather/cloudy-day.jpg";
    }

    return {
      weatherType,
      bgImage,
      isHeavyRain: isHeavy,
      isLightRain: isLight,
      isWindy,
      isStormy,
    };
  }, [current, daily, isDark]);

  // Compute week temperature span for proportional visual temp bars
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

  // Micro-animated weather icon helper
  const renderWeatherIcon = (iconName, size = "w-6 h-6", isHero = false) => {
    switch (iconName) {
      case "CloudLightning":
        return <CloudLightning className={`${size} text-amber-500 dark:text-amber-400 animate-pulse`} />;
      case "CloudRain":
        return <CloudRain className={`${size} text-sky-600 dark:text-sky-400 ${isHero ? "animate-bounce" : ""}`} />;
      case "CloudDrizzle":
        return <CloudDrizzle className={`${size} text-sky-500 dark:text-sky-300`} />;
      case "CloudFog":
        return <CloudFog className={`${size} text-slate-500 dark:text-slate-300`} />;
      case "Cloud":
        return <Cloud className={`${size} text-slate-500 dark:text-slate-200 animate-weather-cloud-slow`} />;
      case "Sun":
      default:
        return (
          <Sun
            className={`${size} text-amber-500 dark:text-amber-400 ${
              isHero ? "animate-weather-sun-rotate" : "animate-spin-slow"
            }`}
          />
        );
    }
  };

  const isAdverse = advisory?.isAdverse;
  const currentTempNum = current?.temperature?.replace("°C", "") || "28";

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-md dark:shadow-xl border border-neutral-200/80 dark:border-white/10 transition-colors duration-300 select-none">
      {/* 1. PHOTOREALISTIC SKY IMAGE BACKDROP (ANIMATED CINEMAGRAPH / LIVE WEATHER GIF EFFECT) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Continuous Seamless Infinite Moving Sky Panorama (Real Cloud Photography) */}
        <div
          className={`absolute top-0 left-0 w-[200%] h-full flex ${
            isHeavyRain || isStormy
              ? "animate-weather-infinite-drift-fast"
              : "animate-weather-infinite-drift"
          }`}
        >
          <div className="relative w-1/2 h-full shrink-0">
            <Image
              src={bgImage}
              alt="Atmospheric Sky Primary"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center"
            />
          </div>
          <div className="relative w-1/2 h-full shrink-0">
            <Image
              src={bgImage}
              alt="Atmospheric Sky Seamless Mirror"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center scale-x-[-1]"
            />
          </div>
        </div>

        {/* Secondary Billowing Cloud Parallax Layer (Real Photo Overlap for Volumetric 3D Depth) */}
        {(weatherType === "cloudy" || weatherType === "storm" || weatherType === "rain") && (
          <div className="absolute -inset-[15%] w-[130%] h-[130%] animate-weather-cloud-billow mix-blend-screen dark:mix-blend-screen opacity-35 dark:opacity-45 pointer-events-none">
            <Image
              src={bgImage}
              alt="Atmospheric Cloud Volumetric Parallax"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top filter blur-[0.5px] scale-x-[-1]"
            />
          </div>
        )}

        {/* Adaptive Ambient Vignette Overlay: Light vs Dark Theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-white/20 dark:from-black/85 dark:via-black/45 dark:to-black/30 pointer-events-none transition-colors duration-300" />

        {/* 2. DYNAMIC WEATHER EFFECTS (SUN, RAIN, WIND, LIGHTNING) */}

        {/* Sunny: Breathing Solar Flare, Rotating Rays & Corona */}
        {weatherType === "sunny" && (
          <div className="absolute inset-0 pointer-events-none animate-weather-sunlight-sweep opacity-85">
            <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/30 via-orange-300/10 to-transparent blur-3xl animate-weather-sun-pulse" />
            <div className="absolute top-2 right-12 w-64 h-64 rounded-full border border-amber-400/30 dark:border-amber-300/30 animate-weather-sun-rotate opacity-75" />
            <div className="absolute top-6 right-16 w-56 h-56 rounded-full border border-dashed border-amber-400/40 dark:border-amber-200/40 animate-weather-sun-rays opacity-50" />
          </div>
        )}


        {/* Rain: Dynamic Droplet Density based on Rain Intensity */}
        {(isHeavyRain || isLightRain) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Heavy Rain / Downpour: Dense fast streaks */}
            {isHeavyRain ? (
              <div className="absolute inset-0 flex justify-around opacity-75">
                {[4, 11, 18, 26, 33, 41, 48, 55, 62, 69, 76, 83, 90, 97].map((pos, i) => (
                  <span
                    key={`heavy-${i}`}
                    className="inline-block w-[1.5px] h-14 bg-gradient-to-b from-sky-400 via-sky-500 to-transparent dark:from-sky-200 dark:via-sky-400 dark:to-transparent rounded-full animate-weather-rain-heavy"
                    style={{
                      left: `${pos}%`,
                      position: "absolute",
                      animationDelay: `${(i * 0.12) % 0.8}s`,
                      animationDuration: `${0.65 + (i % 3) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Light Drizzle: Slower gentle raindrops */
              <div className="absolute inset-0 flex justify-around opacity-60">
                {[8, 22, 38, 52, 68, 82, 94].map((pos, i) => (
                  <span
                    key={`light-${i}`}
                    className="inline-block w-[1px] h-10 bg-gradient-to-b from-sky-400 to-transparent dark:from-sky-300 dark:to-transparent rounded-full animate-weather-rain"
                    style={{
                      left: `${pos}%`,
                      position: "absolute",
                      animationDelay: `${(i * 0.22) % 1.2}s`,
                      animationDuration: `${1.1 + (i % 2) * 0.3}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wind: Animated Wind Stream Wisps */}
        {isWindy && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[20, 45, 75].map((top, idx) => (
              <div
                key={`wind-${idx}`}
                className="absolute h-[1px] w-48 bg-gradient-to-r from-transparent via-neutral-500/30 dark:via-white/35 to-transparent rounded-full animate-weather-wind-stream"
                style={{
                  top: `${top}%`,
                  left: "-20%",
                  animationDelay: `${idx * 0.8}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Storm: Lightning Flash Ambient Illumination */}
        {isStormy && (
          <div className="absolute inset-0 bg-white/30 animate-weather-lightning pointer-events-none" />
        )}
      </div>

      {/* 3. HERO CONTENT CONTAINER (Adaptive Light / Dark Mode) */}
      <div className="relative z-10 p-6 sm:p-8 space-y-6">
        {/* Top Header: Location, Project, and Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
                {weatherData?.location || project?.location || "San Jose Del Monte, Bulacan"}
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-300/80 pl-6">
              {project?.title ? `${project.title} • ` : ""}
              {weatherData?.coordinates
                ? `${weatherData.coordinates.lat.toFixed(4)}° N, ${weatherData.coordinates.lon.toFixed(4)}° E`
                : "Active Engineering Site Grid"}
            </p>
          </div>

          {/* Action: Pre-Fill Weather Delay Notice if Adverse */}
          {isAdverse && (
            <button
              type="button"
              onClick={onPreFillWeatherNotice}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] font-mono font-bold text-xs shadow-md backdrop-blur-md border transition-all cursor-pointer shrink-0 active:scale-[0.98] ${
                isPreFilled
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-700 text-white border-rose-500/30"
              }`}
              title="Pre-populate the delay schedule form below with this weather alert"
            >
              {isPreFilled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100 animate-bounce" />
                  <span>✓ Notice Pre-Filled to Form!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Pre-Fill Weather Delay Notice</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hero Temperature Cluster (Adaptive Typography) */}
        <div className="py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-7xl sm:text-8xl font-light tracking-tighter text-neutral-900 dark:text-white font-display">
              {currentTempNum}
            </span>
            <span className="text-4xl sm:text-5xl font-extralight text-neutral-500 dark:text-white/80 font-mono">
              °
            </span>
          </div>

          <div className="flex items-center gap-3 text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-1 flex-wrap">
            <span>{current?.condition || "Partly Cloudy"}</span>
            <span className="text-neutral-400 dark:text-white/60">•</span>
            <span className="font-mono text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
              {daily[0]?.maxTemp || "35°"} / {daily[0]?.minTemp || "25°"}
            </span>
            {isWindy && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-teal-700 dark:text-teal-300">
                <Wind className="w-3 h-3" />
                {current?.windSpeed || "11 km/h"}
              </span>
            )}
            {isHeavyRain && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-700 dark:text-rose-300 font-bold">
                <Droplets className="w-3 h-3" />
                Heavy Precipitation
              </span>
            )}
          </div>
        </div>

        {/* 4. FROSTED GLASS ENGINEERING ADVISORY (Light vs Dark Mode) */}
        {advisory && (
          <div
            className={`p-4 rounded-[14px] backdrop-blur-md border transition-all ${
              isAdverse
                ? "bg-rose-100/20 dark:bg-rose-950/15 border-rose-300/70 dark:border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-xs"
                : "bg-emerald-100/20 dark:bg-emerald-950/15 border-emerald-300/70 dark:border-emerald-500/35 text-emerald-950 dark:text-emerald-100 shadow-xs"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-[8px] shrink-0 mt-0.5 ${
                  isAdverse
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {isAdverse ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isAdverse
                        ? "text-rose-800 dark:text-rose-300"
                        : "text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    {advisory.level || (isAdverse ? "SAFETY WARNING" : "OPTIMAL WINDOW")}
                  </span>
                  <h4 className="font-bold font-mono tracking-wide">{advisory.title}</h4>
                </div>
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed font-sans">{advisory.message}</p>
                <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 pt-0.5">
                  <span className="font-bold text-neutral-900 dark:text-white">Engineering Action: </span>
                  {advisory.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. FROSTED GLASS 7-DAY FORECAST CONTAINER (Adaptive Light / Dark Glass) */}
        <div className="p-5 rounded-[16px] bg-white/75 dark:bg-black/45 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 space-y-4 shadow-sm dark:shadow-2xl transition-colors">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-600 dark:text-neutral-300 pb-2 border-b border-neutral-200/70 dark:border-white/10">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              7-Day Atmospheric Forecast
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Min / Max Temperature &amp; Rain Risk
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {daily.map((day, idx) => {
              const maxNum = parseInt(day.maxTemp, 10) || 32;
              const minNum = parseInt(day.minTemp, 10) || 24;
              const rainPercent = parseInt(day.rainProbability, 10) || 0;
              const severity = getForecastSeverity(rainPercent, day.isAdverse);
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
                  className={`p-3 rounded-[12px] border transition-all text-center flex flex-col justify-between ${
                    isToday && rainPercent < 40
                      ? `${severity.card} shadow-xs`
                      : severity.card
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <span
                      className={`block text-[11px] font-mono font-bold uppercase truncate ${
                        severity.label
                      }`}
                    >
                      {dayLabel}
                    </span>

                    {/* Condition Icon */}
                    <div className="my-2.5 flex justify-center">
                      {renderWeatherIcon(day.icon, "w-6 h-6")}
                    </div>

                    <span className="block text-[10.5px] font-mono text-neutral-700 dark:text-neutral-200 truncate" title={day.condition}>
                      {day.condition}
                    </span>
                  </div>

                  {/* Temperature Slider & Rain Probability */}
                  <div className="mt-3 pt-2 border-t border-neutral-200/70 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                      <span>{minNum}°</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{maxNum}°</span>
                    </div>

                    {/* Proportional visual range bar */}
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/20 rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400"
                        style={{
                          left: `${leftPercent}%`,
                          right: `${rightPercent}%`,
                        }}
                      />
                    </div>

                    {/* Rain Probability Pill */}
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
                      <Droplets
                        className={`w-3 h-3 ${severity.label}`}
                      />
                      <span
                        className={`font-semibold ${severity.label}`}
                      >
                        {day.rainProbability}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. METEOROLOGICAL TELEMETRY STRIP (Adaptive Light / Dark Glass) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-[12px] bg-white/80 dark:bg-black/40 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Wind Velocity</span>
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">{current?.windSpeed || "5.5 km/h"}</span>
            </div>
            <Wind className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          </div>

          <div className="p-3 rounded-[12px] bg-white/80 dark:bg-black/40 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Precip Risk</span>
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">{daily[0]?.rainProbability || "65%"}</span>
            </div>
            <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          </div>

          <div className="p-3 rounded-[12px] bg-white/80 dark:bg-black/40 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Expected Rain</span>
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">{daily[0]?.rainSum || "0.8 mm"}</span>
            </div>
            <CloudRain className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0" />
          </div>

          <div className="p-3 rounded-[12px] bg-white/80 dark:bg-black/40 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Humidity</span>
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">{current?.humidity || "73%"}</span>
            </div>
            <Gauge className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
