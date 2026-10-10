"use client";
import { Sun } from "lucide-react";

export default function PortalOnSiteWeatherCard({
  temperature = "31°C",
  condition = "Sunny",
  subtext = "Optimal for Concrete Curing",
  location = "Taguig Site",
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold">
          On-Site Weather
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
          {location}
        </span>
      </div>

      <div className="flex items-center gap-4 my-2">
        <div className="relative">
          <Sun className="w-12 h-12 text-amber-500 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-extrabold text-neutral-900 dark:text-white">
              {temperature}
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {condition}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtext}
          </p>
        </div>
      </div>

      <div className="text-[10.5px] font-mono text-neutral-400 pt-1 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
        <span>Humidity: 65%</span>
        <span>Wind: 11 km/h ENE</span>
      </div>
    </div>
  );
}
