"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPinIcon,
  ExternalLinkIcon,
  CheckIcon,
  CloseIcon,
} from "@/modules/shared/Icons";
import { useLanguage } from "@/modules/shared/LanguageContext";

// Popular town coordinates for auto-pan and quick-selection
const TOWN_COORDINATES = {
  // Bulacan
  plaridel: { lat: 14.8871, lng: 120.8572, label: "Plaridel, Bulacan" },
  malolos: { lat: 14.8527, lng: 120.816, label: "Malolos, Bulacan" },
  guiguinto: { lat: 14.8311, lng: 120.8797, label: "Guiguinto, Bulacan" },
  balagtas: { lat: 14.8167, lng: 120.9167, label: "Balagtas, Bulacan" },
  bocaue: { lat: 14.8, lng: 120.9333, label: "Bocaue, Bulacan" },
  marilao: { lat: 14.7583, lng: 120.95, label: "Marilao, Bulacan" },
  meycauayan: { lat: 14.7333, lng: 120.9667, label: "Meycauayan, Bulacan" },
  "san jose del monte": { lat: 14.8139, lng: 121.0453, label: "San Jose Del Monte, Bulacan" },
  sjdm: { lat: 14.8139, lng: 121.0453, label: "SJDM, Bulacan" },
  baliuag: { lat: 14.95, lng: 120.9, label: "Baliuag, Bulacan" },
  calumpit: { lat: 14.9167, lng: 120.7667, label: "Calumpit, Bulacan" },
  pulilan: { lat: 14.9, lng: 120.85, label: "Pulilan, Bulacan" },
  sta_maria: { lat: 14.8167, lng: 120.9667, label: "Santa Maria, Bulacan" },
  // Pampanga
  "san fernando": { lat: 15.0286, lng: 120.6897, label: "San Fernando, Pampanga" },
  angeles: { lat: 15.145, lng: 120.5887, label: "Angeles City, Pampanga" },
  mabalacat: { lat: 15.22, lng: 120.57, label: "Mabalacat, Pampanga" },
  mexico: { lat: 15.0667, lng: 120.7167, label: "Mexico, Pampanga" },
  guagua: { lat: 14.9667, lng: 120.6333, label: "Guagua, Pampanga" },
  // Metro Manila / NCR
  "quezon city": { lat: 14.676, lng: 121.0437, label: "Quezon City, NCR" },
  manila: { lat: 14.5995, lng: 120.9842, label: "Manila City, NCR" },
  caloocan: { lat: 14.65, lng: 120.9833, label: "Caloocan, NCR" },
  valenzuela: { lat: 14.7, lng: 120.9833, label: "Valenzuela, NCR" },
  pasig: { lat: 14.5764, lng: 121.0851, label: "Pasig City, NCR" },
  taguig: { lat: 14.5176, lng: 121.0509, label: "Taguig City, NCR" },
};

const QUICK_PRESETS = [
  { label: "Plaridel HQ", coord: "14.8871, 120.8572", desc: "Plaridel, Bulacan" },
  { label: "Malolos Center", coord: "14.8527, 120.8160", desc: "Malolos, Bulacan" },
  { label: "Guiguinto", coord: "14.8311, 120.8797", desc: "Guiguinto, Bulacan" },
  { label: "SJDM", coord: "14.8139, 121.0453", desc: "San Jose Del Monte, Bulacan" },
  { label: "Pampanga (SF)", coord: "15.0286, 120.6897", desc: "San Fernando, Pampanga" },
  { label: "QC / Metro Manila", coord: "14.6760, 121.0437", desc: "Quezon City, NCR" },
];

export default function LotMapPicker({
  coordinates = "14.8871, 120.8572",
  onCoordinatesChange,
  locationAddress = "",
  city = "",
  province = "",
}) {
  const { language } = useLanguage();
  const isFil = language === "fil";

  const [activeCoord, setActiveCoord] = useState(coordinates || "14.8871, 120.8572");
  const [mapMode, setMapMode] = useState("satellite"); // "satellite" | "roadmap"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);

  // Parse current latitude and longitude
  const [lat, lng] = useMemo(() => {
    const parts = (activeCoord || "14.8871, 120.8572").split(",").map((s) => parseFloat(s.trim()));
    const validLat = !isNaN(parts[0]) ? parts[0] : 14.8871;
    const validLng = !isNaN(parts[1]) ? parts[1] : 120.8572;
    return [validLat, validLng];
  }, [activeCoord]);

  // Auto-pan map when selected city changes
  useEffect(() => {
    if (!city) return;
    const key = city.toLowerCase().replace(/city|city of|municipality of/g, "").trim();
    for (const [k, v] of Object.entries(TOWN_COORDINATES)) {
      if (key.includes(k) || k.includes(key)) {
        const newCoord = `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}`;
        setActiveCoord(newCoord);
        if (onCoordinatesChange) onCoordinatesChange(newCoord);
        break;
      }
    }
  }, [city, onCoordinatesChange]);

  const handleSelectPreset = (preset) => {
    setActiveCoord(preset.coord);
    if (onCoordinatesChange) onCoordinatesChange(preset.coord);
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Responsive click coordinate offset relative to center reticle
    const deltaFactor = isFullscreen ? 0.008 : 0.005;
    const xRatio = (x / rect.width - 0.5) * deltaFactor;
    const yRatio = (y / rect.height - 0.5) * -deltaFactor;

    const newLat = (lat + yRatio).toFixed(4);
    const newLng = (lng + xRatio).toFixed(4);
    const newCoord = `${newLat}, ${newLng}`;

    setActiveCoord(newCoord);
    if (onCoordinatesChange) onCoordinatesChange(newCoord);
  };

  // Construct iframe embed URL based on mode
  const delta = isFullscreen ? 0.003 : 0.005;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;

  // Use OSM embed with clean layer and marker
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  // Google Maps external link (with Satellite mode active: t=k)
  const googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},${zoomLevel}z/data=!3m1!1e3?api=1`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  const renderMapCanvas = (fullscreen = false) => (
    <div
      className={`relative rounded-xl overflow-hidden border border-neutral-300 dark:border-white/10 bg-neutral-950 shadow-inner group transition-all select-none ${
        fullscreen ? "w-full h-full" : "h-64 sm:h-72 w-full"
      }`}
    >
      {/* Underlying Map Tiles */}
      {mapMode === "satellite" ? (
        <div className="relative w-full h-full overflow-hidden bg-neutral-900">
          {/* ESRI High-Resolution Aerial Satellite Imagery */}
          <iframe
            title="Satellite Map View"
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=jsapi`}
            className="hidden"
          />
          {/* High-def ESRI World Imagery Tile Frame with overlay */}
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-300"
            style={{
              backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lng - delta * 1.5},${lat - delta * 1.5},${lng + delta * 1.5},${lat + delta * 1.5}&bboxSR=4326&imageSR=4326&size=1024,768&f=image')`,
            }}
          />
          {/* Technical drafting grid watermark */}
          <div className="absolute inset-0 bg-black/15 pointer-events-none mcpa-blueprint-grid" />
        </div>
      ) : (
        <iframe
          title="Interactive Lot Roadmap"
          src={mapEmbedUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
        />
      )}

      {/* Click-to-Pin Overlay layer */}
      <div
        onClick={handleMapClick}
        title={isFil ? "I-click saanman upang ilipat ang pin ng lote" : "Click anywhere to reposition your lot pin"}
        className="absolute inset-0 cursor-crosshair z-10 pointer-events-auto"
      >
        {/* Centered Visual Reticle / Pin Marker */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/25 border-2 border-amber-500 flex items-center justify-center animate-ping absolute -top-2" />
            <div className="relative z-10 p-2 rounded-full bg-amber-500 text-neutral-950 shadow-xl border-2 border-white dark:border-neutral-900">
              <MapPinIcon className="w-5 h-5" />
            </div>
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-neutral-950/90 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold tracking-wider whitespace-nowrap shadow-xl">
              📍 {isFil ? "PINPOINTED LOT" : "PINPOINTED LOT"}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        {/* Mode Switcher */}
        <div className="flex rounded-lg overflow-hidden border border-white/20 bg-neutral-950/85 backdrop-blur-md shadow-lg p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
              mapMode === "satellite"
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
          >
            {isFil ? "Satelayt" : "Satellite"}
          </button>
          <button
            type="button"
            onClick={() => setMapMode("roadmap")}
            className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
              mapMode === "roadmap"
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
          >
            {isFil ? "Roadmap" : "Road Map"}
          </button>
        </div>

        {/* Fullscreen Button */}
        {!fullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg border border-white/20 bg-neutral-950/85 backdrop-blur-md text-white hover:bg-white/20 transition-colors shadow-lg cursor-pointer"
            title={isFil ? "Palakihin ang mapa sa Fullscreen" : "Expand map to Fullscreen"}
          >
            <span className="font-mono text-xs font-bold px-1">⛶ {isFil ? "Fullscreen" : "Full Screen"}</span>
          </button>
        )}
      </div>

      {/* Floating Telemetry HUD (Bottom) */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-neutral-950/90 backdrop-blur-md border border-white/15 text-[10px] font-mono text-neutral-300 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white font-bold tracking-wider">
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </span>
          <span className="hidden sm:inline text-neutral-500">•</span>
          <span className="hidden sm:inline text-neutral-400">
            {isFil ? "Eksaktong Lokasyon ng Lote" : "Target Construction Lot Coordinates"}
          </span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1"
          >
            <span>Google Maps</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
          <a
            href={streetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-[10px] text-neutral-400 hover:text-white underline items-center gap-1"
          >
            <span>Street View</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header Label and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <MapPinIcon className="w-4 h-4 text-amber-500" />
            <span>{isFil ? "Interactive Satellite Lot Pin & Geolocation" : "Interactive Satellite Lot Pin & Geolocation"}</span>
          </label>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-light mt-0.5">
            {isFil
              ? "I-click saanman o i-drag ang pin sa mismong lote kung saan itatayo ang proyekto."
              : "Click anywhere on the map to pinpoint the exact boundaries of your construction site."}
          </p>
        </div>
      </div>

      {/* Town Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-neutral-400 mr-1 uppercase">Quick Pin:</span>
        {QUICK_PRESETS.map((preset) => {
          const isSelected = activeCoord.includes(preset.coord);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 rounded-[5px] text-[10px] font-mono border transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs scale-102"
                  : "bg-neutral-100 dark:bg-white/[0.05] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/50"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Embedded Map Canvas */}
      {renderMapCanvas(false)}

      {/* FULLSCREEN MAP MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 animate-in fade-in duration-200">
          {/* Fullscreen Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-900 border-b border-white/10 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <MapPinIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  {isFil ? "Fullscreen Architectural Lot Pin" : "Fullscreen Architectural Lot Pin"}
                </h3>
                <p className="text-[11px] font-mono text-neutral-400">
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E • {mapMode === "satellite" ? "High-Res Aerial Imagery" : "Street Roadmap"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isFil ? "I-lock ang Pin & Bumalik" : "Lock In Lot Pin & Close"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas Body */}
          <div className="flex-1 relative w-full h-full min-h-0">
            {renderMapCanvas(true)}
          </div>
        </div>
      )}
    </div>
  );
}
