"use client";

import { useEffect, useRef, useState } from "react";
import {
  Globe,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";

/**
 * Interactive Global Geographic Visitor Map
 * Uses Leaflet with 100% Free, No-API-Key-Required Dark & Satellite Tile Layers
 * (Esri Dark Gray Canvas & OpenStreetMap) with Dynamic Heatmap Gradient Markers
 * (Green -> Yellow -> Red -> Violet) and full-screen expansion mode.
 */

/**
 * Dynamic Heatmap Color Scale:
 * - Low density / onti: Green (#10b981)
 * - Moderate density: Yellow (#eab308)
 * - High density / marami: Red (#ef4444)
 * - Peak Hotspot / pinakamarami: Violet (#a855f7)
 */
function getHeatmapColor(visitors, maxVisitors = 1) {
  const v = Math.max(1, Number(visitors) || 1);
  const max = Math.max(1, Number(maxVisitors) || 1);
  const ratio = v / max;

  if (ratio >= 0.75 || (v >= 20 && ratio >= 0.5)) {
    return {
      fill: "#a855f7", // Violet (Peak Hotspot)
      glow: "rgba(168, 85, 247, 0.45)",
      border: "#c084fc",
      tier: "Peak Hotspot (Violet)",
    };
  }
  if (ratio >= 0.4 || (v >= 8 && ratio >= 0.3)) {
    return {
      fill: "#ef4444", // Red (High Density)
      glow: "rgba(239, 68, 68, 0.4)",
      border: "#f87171",
      tier: "High Density (Red)",
    };
  }
  if (ratio >= 0.18 || v >= 3) {
    return {
      fill: "#eab308", // Yellow (Moderate)
      glow: "rgba(234, 179, 8, 0.38)",
      border: "#fde047",
      tier: "Moderate (Yellow)",
    };
  }
  return {
    fill: "#10b981", // Green (Light / Low)
    glow: "rgba(16, 185, 129, 0.35)",
    border: "#6ee7b7",
    tier: "Low (Green)",
  };
}
export default function AnalyticsWorldMap({
  countries = [],
  cities = [],
  selectedCountry = "all",
  onSelectCountry,
}) {
  const wrapperRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const tileGroupRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState("dark"); // "dark" | "satellite" | "streets"

  // 1. Initialize Leaflet Map with 100% Free Tiles (NO API KEY REQUIRED)
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
          center: [18.0, 110.0],
          zoom: 2,
          minZoom: 2,
          maxZoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Tile layer group for instant style switching
        const tileGroup = L.layerGroup().addTo(map);
        tileGroupRef.current = tileGroup;

        // Default: Esri World Dark Gray Canvas (Clean, modern dark theme, NO API key required, NO watermark)
        const darkBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const darkRef = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        tileGroup.addLayer(darkBase);
        tileGroup.addLayer(darkRef);

        const layerGroup = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        markersLayerRef.current = { L, layerGroup };
        setMapReady(true);
      } catch (err) {
        console.warn("[AnalyticsWorldMap] Map init notice:", err.message);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch Basemap Style dynamically (All 100% Free, No API Key Required)
  const switchMapStyle = (newStyle) => {
    if (!mapReady || !markersLayerRef.current || !tileGroupRef.current) return;
    const { L } = markersLayerRef.current;
    const tileGroup = tileGroupRef.current;
    tileGroup.clearLayers();

    if (newStyle === "satellite") {
      const sat = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      );
      tileGroup.addLayer(sat);
    } else if (newStyle === "streets") {
      const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      });
      tileGroup.addLayer(osm);
    } else {
      // Default: Esri Dark Gray Canvas
      const darkBase = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16 }
      );
      const darkRef = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16 }
      );
      tileGroup.addLayer(darkBase);
      tileGroup.addLayer(darkRef);
    }
    setMapStyle(newStyle);
  };

  // 3. Handle Fullscreen Expansion and Resize
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const timer1 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 60);
    const timer2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 220);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Escape key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // 4. Update Markers when countries/cities/selectedCountry changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;
    const { L, layerGroup } = markersLayerRef.current;
    const map = mapInstanceRef.current;

    layerGroup.clearLayers();

    const maxVisitors = Math.max(1, ...countries.map((c) => Number(c.visitors) || 1));

    // Plot Country-level Heatmap Circles (Aura + Core + Center Pip)
    countries.forEach((c) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected =
        selectedCountry !== "all" &&
        (c.country_code === selectedCountry || c.country === selectedCountry);

      const heat = getHeatmapColor(c.visitors, maxVisitors);
      const radius = Math.max(10, Math.min(32, 10 + Math.sqrt(Number(c.visitors || 1) / maxVisitors) * 22));

      // 1. Heatmap Ambient Aura (Soft glowing heat bloom)
      const halo = L.circleMarker([lat, lng], {
        radius: radius * 1.55,
        fillColor: isSelected ? "#38bdf8" : heat.fill,
        color: isSelected ? "#38bdf8" : heat.fill,
        weight: 0,
        opacity: 0,
        fillOpacity: isSelected ? 0.3 : 0.22,
        interactive: false,
      });
      halo.addTo(layerGroup);

      // 2. Heatmap Density Core
      const circle = L.circleMarker([lat, lng], {
        radius,
        fillColor: isSelected ? "#0284c7" : heat.fill,
        color: isSelected ? "#ffffff" : heat.border,
        weight: isSelected ? 2.5 : 1.5,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.85 : 0.65,
      });

      // 3. Glowing Center Hotspot Pip
      const centerPip = L.circleMarker([lat, lng], {
        radius: Math.max(3, Math.min(5, radius * 0.22)),
        fillColor: "#ffffff",
        color: heat.border,
        weight: 1,
        opacity: 0.95,
        fillOpacity: 0.95,
        interactive: false,
      });
      centerPip.addTo(layerGroup);

      circle.bindTooltip(
        `<div style="font-family: sans-serif; padding: 4px 6px;">
          <div style="font-weight: 800; font-size: 12px; color: ${heat.fill}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span>${c.country} (${c.country_code})</span>
            <span style="font-size: 9.5px; padding: 1.5px 6px; border-radius: 9999px; background: rgba(0,0,0,0.65); color: ${heat.fill}; border: 1px solid ${heat.border}; font-weight: 700;">${heat.tier}</span>
          </div>
          <div style="font-size: 11px; color: #111; margin-top: 3px;">Visitors: <strong>${c.visitors}</strong> &bull; Sessions: <strong>${c.sessions}</strong></div>
          <div style="font-size: 10px; color: #555;">Pageviews: ${c.pageviews} (Click to filter)</div>
        </div>`,
        { direction: "top", offset: [0, -6] }
      );

      circle.on("click", () => {
        if (onSelectCountry) {
          onSelectCountry(isSelected ? "all" : c.country_code);
        }
        map.flyTo([lat, lng], isSelected ? 2 : 5, { duration: 0.8 });
      });

      circle.addTo(layerGroup);
    });

    // Plot City-level markers using cohesive Heatmap Color
    const maxCityVisitors = Math.max(1, ...cities.map((ct) => Number(ct.visitors) || 1));
    cities.slice(0, 35).forEach((cityItem) => {
      const lat = parseFloat(cityItem.latitude);
      const lng = parseFloat(cityItem.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const cityHeat = getHeatmapColor(cityItem.visitors, maxCityVisitors);

      // Subtle city ambient glow
      const cityHalo = L.circleMarker([lat, lng], {
        radius: 7,
        fillColor: cityHeat.fill,
        color: cityHeat.fill,
        weight: 0,
        fillOpacity: 0.25,
        interactive: false,
      });
      cityHalo.addTo(layerGroup);

      const dot = L.circleMarker([lat, lng], {
        radius: 4,
        fillColor: cityHeat.fill,
        color: "#ffffff",
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.9,
      });

      dot.bindTooltip(
        `<div style="font-family: sans-serif; padding: 3px 5px;">
          <div style="font-weight: 700; font-size: 11px; color: ${cityHeat.fill};">${cityItem.city}, ${cityItem.province}</div>
          <div style="font-size: 10px; color: #444;">${cityItem.country} &bull; ${cityItem.visitors} visitor(s) (${cityHeat.tier})</div>
        </div>`,
        { direction: "top" }
      );

      dot.addTo(layerGroup);
    });
  }, [mapReady, countries, cities, selectedCountry, onSelectCountry]);

  return (
    <div
      ref={wrapperRef}
      className={`relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#0b0e14] transition-all flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen rounded-none border-0 shadow-2xl"
          : ""
      }`}
    >
      {/* Map Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-md">
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate max-w-[260px] sm:max-w-md">
            {selectedCountry === "all"
              ? "Worldwide IP Geolocation Distribution (Approximate)"
              : `Filtered Country: ${selectedCountry}`}
          </span>
          {selectedCountry !== "all" && (
            <button
              type="button"
              onClick={() => {
                if (onSelectCountry) onSelectCountry("all");
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([18.0, 110.0], 2, { duration: 0.7 });
                }
              }}
              className="ml-1 px-2 py-0.5 rounded bg-amber-500 text-neutral-950 text-[10px] font-extrabold cursor-pointer shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Action Controls: Basemap Style, Zoom, Reset, and Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
          {/* Map Basemap Style Switcher (No API Key Required) */}
          <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-white/15">
            <button
              type="button"
              onClick={() => switchMapStyle("dark")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                mapStyle === "dark"
                  ? "bg-amber-500 text-neutral-950 font-extrabold"
                  : "text-neutral-300 hover:bg-white/10"
              }`}
              title="Dark Canvas Basemap"
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => switchMapStyle("satellite")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                mapStyle === "satellite"
                  ? "bg-amber-500 text-neutral-950 font-extrabold"
                  : "text-neutral-300 hover:bg-white/10"
              }`}
              title="Satellite Imagery Basemap"
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => switchMapStyle("streets")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer hidden sm:inline-block ${
                mapStyle === "streets"
                  ? "bg-amber-500 text-neutral-950 font-extrabold"
                  : "text-neutral-300 hover:bg-white/10"
              }`}
              title="OpenStreetMap Streets"
            >
              Street
            </button>
          </div>

          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.flyTo([14.8872, 120.8572], 6, { duration: 0.8 })}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-white/10 cursor-pointer transition-colors"
            title="Focus Philippines (Bulacan & Central Luzon)"
          >
            PH Focus
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.flyTo([18.0, 110.0], 2, { duration: 0.8 })}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors"
            title="Reset World View"
            aria-label="Reset World View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Expansion Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors ml-0.5 border-l border-white/15 pl-1.5"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "View Map in Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "View Map in Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Leaflet Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full bg-[#0b0e14] transition-all ${
          isFullscreen ? "flex-1 h-full min-h-0" : "h-[360px] sm:h-[460px]"
        }`}
      />

      {/* Legend & Privacy Bar */}
      <div className="px-4 py-2.5 bg-neutral-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-neutral-400 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
            Heatmap Intensity:
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)] inline-block" />
              <span>Low (Green)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.7)] inline-block" />
              <span>Moderate (Yellow)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.7)] inline-block" />
              <span>High (Red)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.7)] inline-block" />
              <span>Peak Hotspot (Violet)</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFullscreen && (
            <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">
              Press ESC to exit fullscreen
            </span>
          )}
          <span className="font-mono text-[10px] text-neutral-500">
            Privacy Notice: IP geolocation is approximate at city/province level; raw IPs are truncated.
          </span>
        </div>
      </div>
    </div>
  );
}
