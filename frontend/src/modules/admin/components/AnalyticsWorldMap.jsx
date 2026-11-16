"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Globe,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Flame,
  Sliders,
  Check,
} from "lucide-react";

/**
 * Lightweight, Ultra-Fast HTML5 Canvas Heatmap Engine (simpleheat derivative)
 * Generates continuous Gaussian thermal heat clouds that blend together
 * (Blue -> Green -> Yellow -> Orange -> Red -> White Hot Core).
 */
function createHeatmapEngine(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let _width = canvas.width;
  let _height = canvas.height;
  let _max = 1;
  let _data = [];
  let _circle = null;
  let _r = 28;
  let _blur = 18;
  let _opacity = 0.8;

  // Thermal Gradient Palette matching NOAA / Maptive style
  const defaultGradient = {
    0.15: "#3b82f6", // Blue / Violet (Light)
    0.35: "#10b981", // Green (Medium Light)
    0.55: "#eab308", // Yellow (Medium)
    0.75: "#f97316", // Orange (Medium Dense)
    0.92: "#ef4444", // Red / Coral (Dense)
    1.00: "#ffffff", // White-hot core (Peak)
  };

  function colorPalette(grad = defaultGradient) {
    if (typeof document === "undefined") return new Uint8ClampedArray(1024);
    const paletteCanvas = document.createElement("canvas");
    paletteCanvas.width = 1;
    paletteCanvas.height = 256;
    const pctx = paletteCanvas.getContext("2d");
    const gradient = pctx.createLinearGradient(0, 0, 0, 256);
    for (const [stop, color] of Object.entries(grad)) {
      gradient.addColorStop(Number(stop), color);
    }
    pctx.fillStyle = gradient;
    pctx.fillRect(0, 0, 1, 256);
    return pctx.getImageData(0, 0, 1, 256).data;
  }

  function createBrush(r, blur) {
    if (typeof document === "undefined") return null;
    const circle = document.createElement("canvas");
    const cctx = circle.getContext("2d");
    const r2 = r + blur;
    circle.width = circle.height = r2 * 2;
    cctx.shadowOffsetX = cctx.shadowOffsetY = r2 * 2;
    cctx.shadowBlur = blur;
    cctx.shadowColor = "black";
    cctx.beginPath();
    cctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
    cctx.closePath();
    cctx.fill();
    return circle;
  }

  let _grad = colorPalette();
  _circle = createBrush(_r, _blur);

  return {
    data(data) {
      _data = data;
      return this;
    },
    max(max) {
      _max = Math.max(1, max);
      return this;
    },
    radius(r, blur = 18) {
      _r = r;
      _blur = blur;
      _circle = createBrush(r, blur);
      return this;
    },
    opacity(op) {
      _opacity = op;
      return this;
    },
    resize(w, h) {
      _width = canvas.width = w;
      _height = canvas.height = h;
      return this;
    },
    clear() {
      if (ctx && _width && _height) {
        ctx.clearRect(0, 0, _width, _height);
      }
      return this;
    },
    draw(minOpacity = 0.05) {
      if (!ctx || !_width || !_height || !_data.length) {
        if (ctx && _width && _height) ctx.clearRect(0, 0, _width, _height);
        return this;
      }
      ctx.clearRect(0, 0, _width, _height);

      if (!_circle) _circle = createBrush(_r, _blur);
      const r2 = _r + _blur;

      // Pass 1: Draw radial Gaussian shadow circles with intensity alpha
      for (let i = 0; i < _data.length; i++) {
        const [x, y, val] = _data[i];
        if (x < -r2 || y < -r2 || x > _width + r2 || y > _height + r2) continue;
        const alpha = Math.min(Math.max(val / _max, minOpacity), 1);
        ctx.globalAlpha = alpha;
        ctx.drawImage(_circle, x - r2, y - r2);
      }

      // Pass 2: Colorize pixels based on alpha against thermal palette
      const image = ctx.getImageData(0, 0, _width, _height);
      const imgData = image.data;
      const len = imgData.length;

      for (let i = 0; i < len; i += 4) {
        const alpha = imgData[i + 3];
        if (alpha > 0) {
          const offset = alpha * 4;
          imgData[i] = _grad[offset];         // R
          imgData[i + 1] = _grad[offset + 1]; // G
          imgData[i + 2] = _grad[offset + 2]; // B
          imgData[i + 3] = Math.min(255, Math.round(alpha * _opacity)); // A
        }
      }

      ctx.putImageData(image, 0, 0);
      return this;
    },
  };
}

/**
 * Dynamic Heatmap Color Scale for Tooltips & Discrete Nodes:
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

/**
 * Interactive Global Geographic Visitor Map
 * Uses Leaflet with 100% Free, No-API-Key-Required Dark & Satellite Tile Layers
 * (Esri Dark Gray Canvas & OpenStreetMap) with Dynamic Continuous Heatmap Layer
 * (Gaussian Heat Blobs) + Proportional Drill-down Pins and Fullscreen Expansion.
 */
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
  const heatmapEngineRef = useRef(null);
  const heatmapCanvasRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState("dark"); // "dark" | "satellite" | "streets"
  const [isHeatmapActive, setIsHeatmapActive] = useState(true);
  const [heatmapRadius, setHeatmapRadius] = useState(32); // 20 | 32 | 48
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.85); // 0.6 | 0.85 | 1.0
  const [showSettings, setShowSettings] = useState(false);

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

        // Attach Continuous Heatmap Canvas into Leaflet container
        const container = map.getContainer();
        let canvas = container.querySelector(".mcpa-heatmap-canvas");
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.className = "mcpa-heatmap-canvas";
          canvas.style.position = "absolute";
          canvas.style.top = "0";
          canvas.style.left = "0";
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.pointerEvents = "none";
          canvas.style.zIndex = "350";
          container.appendChild(canvas);
        }
        heatmapCanvasRef.current = canvas;
        heatmapEngineRef.current = createHeatmapEngine(canvas);

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

  // 3. Redraw Thermal Heatmap Canvas with Continuous Gaussian Blending
  const redrawHeatmap = useCallback(() => {
    if (!mapReady || !mapInstanceRef.current || !heatmapEngineRef.current || !heatmapCanvasRef.current) return;
    const map = mapInstanceRef.current;
    const canvas = heatmapCanvasRef.current;
    const engine = heatmapEngineRef.current;
    const container = map.getContainer();

    if (!isHeatmapActive) {
      engine.clear();
      return;
    }

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w && h) {
      engine.resize(w, h);
    }

    const heatPoints = [];
    const maxCountryVisitors = Math.max(1, ...countries.map((c) => Number(c.visitors) || 1));
    const maxCityVisitors = Math.max(1, ...cities.map((ct) => Number(ct.visitors) || 1));
    const globalMax = Math.max(maxCountryVisitors, maxCityVisitors);

    // Add country heat centroids
    countries.forEach((c) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const pt = map.latLngToContainerPoint([lat, lng]);
      heatPoints.push([Math.round(pt.x), Math.round(pt.y), Number(c.visitors || 1)]);
    });

    // Add city granular local heat nodes
    cities.forEach((cityItem) => {
      const lat = parseFloat(cityItem.latitude);
      const lng = parseFloat(cityItem.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const pt = map.latLngToContainerPoint([lat, lng]);
      heatPoints.push([Math.round(pt.x), Math.round(pt.y), Number(cityItem.visitors || 1) * 1.2]);
    });

    engine
      .max(globalMax)
      .radius(heatmapRadius, Math.round(heatmapRadius * 0.6))
      .opacity(heatmapOpacity)
      .data(heatPoints)
      .draw(0.04);
  }, [mapReady, isHeatmapActive, heatmapRadius, heatmapOpacity, countries, cities]);

  // Sync heatmap drawing with Leaflet pan/zoom/resize events
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.on("move zoom viewreset resize", redrawHeatmap);
    redrawHeatmap();

    return () => {
      map.off("move zoom viewreset resize", redrawHeatmap);
    };
  }, [mapReady, redrawHeatmap]);

  // 4. Handle Fullscreen Expansion and Resize
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
      redrawHeatmap();
    }, 60);
    const timer2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      redrawHeatmap();
    }, 220);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.body.style.overflow = "";
    };
  }, [isFullscreen, redrawHeatmap]);

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

  // 5. Update Interactive Markers & Tooltips for click-to-filter drill-down
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;
    const { L, layerGroup } = markersLayerRef.current;
    const map = mapInstanceRef.current;

    layerGroup.clearLayers();

    const maxVisitors = Math.max(1, ...countries.map((c) => Number(c.visitors) || 1));

    // Plot Country-level Interactive Hotspot Markers
    countries.forEach((c) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected =
        selectedCountry !== "all" &&
        (c.country_code === selectedCountry || c.country === selectedCountry);

      const heat = getHeatmapColor(c.visitors, maxVisitors);
      const radius = Math.max(8, Math.min(26, 8 + Math.sqrt(Number(c.visitors || 1) / maxVisitors) * 18));

      // 1. Soft glowing boundary ring
      const halo = L.circleMarker([lat, lng], {
        radius: radius * 1.45,
        fillColor: isSelected ? "#38bdf8" : heat.fill,
        color: isSelected ? "#38bdf8" : heat.fill,
        weight: 0,
        opacity: 0,
        fillOpacity: isSelected ? 0.35 : 0.18,
        interactive: false,
      });
      halo.addTo(layerGroup);

      // 2. Main clickable circle marker
      const circle = L.circleMarker([lat, lng], {
        radius,
        fillColor: isSelected ? "#0284c7" : heat.fill,
        color: isSelected ? "#ffffff" : heat.border,
        weight: isSelected ? 2.5 : 1.2,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.9 : 0.45,
      });

      // 3. White Center Hotspot Pip
      const centerPip = L.circleMarker([lat, lng], {
        radius: Math.max(2.5, Math.min(4.5, radius * 0.22)),
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
          <div style="font-size: 10px; color: #555;">Pageviews: ${c.pageviews} (Click to filter dashboard)</div>
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

    // Plot City-level nodes with matching Heatmap Palette
    const maxCityVisitors = Math.max(1, ...cities.map((ct) => Number(ct.visitors) || 1));
    cities.slice(0, 35).forEach((cityItem) => {
      const lat = parseFloat(cityItem.latitude);
      const lng = parseFloat(cityItem.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const cityHeat = getHeatmapColor(cityItem.visitors, maxCityVisitors);

      const dot = L.circleMarker([lat, lng], {
        radius: 3.5,
        fillColor: cityHeat.fill,
        color: "#ffffff",
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.85,
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
          <span className="truncate max-w-[240px] sm:max-w-md">
            {selectedCountry === "all"
              ? "Worldwide Geographic Visitor Heatmap"
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

        {/* Action Controls: Heatmap Toggle, Style, Zoom, Reset, and Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
          {/* Heatmap Layer Toggle */}
          <button
            type="button"
            onClick={() => setIsHeatmapActive((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              isHeatmapActive
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-neutral-950 shadow-xs"
                : "text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle Continuous Thermal Heatmap Layer"
          >
            <Flame className={`w-3.5 h-3.5 ${isHeatmapActive ? "text-neutral-950" : "text-amber-500"}`} />
            <span>Heatmap</span>
          </button>

          {/* Heatmap Tuning Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors ${
                showSettings ? "bg-white/20 text-amber-400" : ""
              }`}
              title="Heatmap Display Settings"
              aria-label="Heatmap Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Settings Popover */}
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-neutral-950/95 backdrop-blur-lg border border-white/15 shadow-2xl z-[500] space-y-3 text-neutral-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider">
                    Heat Settings
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-[10px] text-neutral-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>

                {/* Heat Radius Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 block">Radius Size</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "Fine", val: 20 },
                      { label: "Standard", val: 32 },
                      { label: "Wide", val: 48 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setHeatmapRadius(opt.val)}
                        className={`py-1 px-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          heatmapRadius === opt.val
                            ? "bg-amber-500 text-neutral-950"
                            : "bg-white/5 hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heat Opacity Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 block">Thermal Opacity</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "60%", val: 0.6 },
                      { label: "85%", val: 0.85 },
                      { label: "100%", val: 1.0 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setHeatmapOpacity(opt.val)}
                        className={`py-1 px-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          heatmapOpacity === opt.val
                            ? "bg-amber-500 text-neutral-950"
                            : "bg-white/5 hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Basemap Style Switcher (No API Key Required) */}
          <div className="flex items-center gap-0.5 ml-1 mr-1 px-1 border-x border-white/15">
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

      {/* Leaflet Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full bg-[#0b0e14] transition-all relative ${
          isFullscreen ? "flex-1 h-full min-h-0" : "h-[360px] sm:h-[480px]"
        }`}
      />

      {/* Legend & Privacy Bar */}
      <div className="px-4 py-2.5 bg-neutral-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-neutral-400 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Thermal Heatmap Scale:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.7)] inline-block" />
              <span>Light (Blue)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)] inline-block" />
              <span>Medium (Green)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.7)] inline-block" />
              <span>Medium Dense (Yellow)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.7)] inline-block" />
              <span>Dense (Orange)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.7)] inline-block" />
              <span>Hotspot (Red/White Core)</span>
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
