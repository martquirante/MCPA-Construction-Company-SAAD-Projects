"use client";

import { useState } from "react";
import { MapPinIcon, ExternalLinkIcon, CheckIcon } from "@/modules/shared/Icons";

const QUICK_PRESETS = [
  { label: "Plaridel HQ", coord: "14.8871, 120.8572", desc: "Plaridel, Bulacan", elev: "14m ASL" },
  { label: "Malolos Center", coord: "14.8527, 120.8160", desc: "Malolos, Bulacan", elev: "12m ASL" },
  { label: "Guiguinto", coord: "14.8311, 120.8797", desc: "Guiguinto, Bulacan", elev: "15m ASL" },
  { label: "San Jose Del Monte", coord: "14.8139, 121.0453", desc: "SJDM, Bulacan", elev: "78m ASL" },
  { label: "Pampanga (SF)", coord: "15.0286, 120.6897", desc: "San Fernando, Pampanga", elev: "22m ASL" },
  { label: "Quezon City / NCR", coord: "14.6760, 121.0437", desc: "Metro Manila", elev: "38m ASL" },
];

export default function LotMapPicker({ coordinates, onCoordinatesChange, locationAddress, onLocationChange }) {
  const [activeCoord, setActiveCoord] = useState(coordinates || "14.8871, 120.8572");
  const [mapType, setMapType] = useState("satellite"); // "satellite" | "streets"
  const [searchQuery, setSearchQuery] = useState(locationAddress || "");
  const [elevation, setElevation] = useState("14m ASL");

  // Parse lat/lng
  const [lat, lng] = activeCoord.split(",").map((s) => parseFloat(s.trim()) || 14.8871);

  const handleSelectPreset = (preset) => {
    setActiveCoord(preset.coord);
    setElevation(preset.elev);
    if (onCoordinatesChange) onCoordinatesChange(preset.coord);
    if (onLocationChange && !locationAddress) onLocationChange(preset.desc);
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Small offset adjustment based on click position relative to center
    const xRatio = (x / rect.width - 0.5) * 0.01;
    const yRatio = (y / rect.height - 0.5) * -0.01;

    const newLat = (lat + yRatio).toFixed(4);
    const newLng = (lng + xRatio).toFixed(4);
    const newCoord = `${newLat}, ${newLng}`;

    setActiveCoord(newCoord);
    if (onCoordinatesChange) onCoordinatesChange(newCoord);
  };

  // OpenStreetMap embed URL with bounding box around coordinates
  const delta = 0.005;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-3">
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-mono uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
          <MapPinIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Interactive Lot Geolocation &amp; Map Pin</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapType(mapType === "satellite" ? "streets" : "satellite")}
            className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Mode: {mapType === "satellite" ? "Satellite/Terrain" : "Road Map"}
          </button>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline"
          >
            <span>Open in Google Maps</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Quick Location Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-neutral-400 mr-1">Quick Pin:</span>
        {QUICK_PRESETS.map((preset) => {
          const isSelected = activeCoord.includes(preset.coord);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 rounded-[4px] text-[10px] font-mono border transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs"
                  : "bg-white dark:bg-[#121620] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-amber-500/50"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Map Container */}
      <div className="relative rounded-[6px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-900 h-64 sm:h-72 shadow-inner group">
        <iframe
          title="Interactive Lot Map"
          src={mapEmbedUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
        />

        {/* Click-to-Pin Overlay layer */}
        <div
          onClick={handleMapClick}
          title="Click anywhere to reposition your lot pin"
          className="absolute inset-0 cursor-crosshair z-10 pointer-events-auto"
        >
          {/* Centered Visual Reticle / Pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center animate-ping absolute -top-1" />
              <div className="relative z-10 p-1.5 rounded-full bg-amber-500 text-neutral-950 shadow-md">
                <MapPinIcon className="w-4 h-4" />
              </div>
              <span className="mt-1 px-2 py-0.5 rounded-[4px] bg-neutral-950/90 text-amber-400 border border-amber-500/40 text-[10px] font-semibold whitespace-nowrap shadow-lg">
                Pinned Lot
              </span>
            </div>
          </div>
        </div>

        {/* Floating Telemetry HUD */}
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 p-2 rounded-[6px] bg-neutral-950/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold">LAT: {lat.toFixed(4)}° N, LNG: {lng.toFixed(4)}° E</span>
          </div>
          <div className="flex items-center gap-3">
            <span>ELEV: {elevation}</span>
            <span className="text-amber-400 font-semibold">PIN LOCKED</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Tip:</span> Click anywhere on the map or select a quick town preset to position the exact pin of your lot.
      </p>
    </div>
  );
}
