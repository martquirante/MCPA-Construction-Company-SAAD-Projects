"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

/**
 * Interactive Global Geographic Visitor Map
 * Uses Leaflet with OpenStreetMap/CartoDB tiles + Country/City proportional circle markers
 * and click-to-drilldown country selection.
 */
export default function AnalyticsWorldMap({
  countries = [],
  cities = [],
  selectedCountry = "all",
  onSelectCountry,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

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
          maxZoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          maxZoom: 18,
        }).addTo(map);

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

  // Update markers whenever countries/cities/selectedCountry changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;
    const { L, layerGroup } = markersLayerRef.current;
    const map = mapInstanceRef.current;

    layerGroup.clearLayers();

    const maxVisitors = Math.max(1, ...countries.map((c) => Number(c.visitors) || 1));

    // Plot Country-level aggregated bubbles
    countries.forEach((c) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected =
        selectedCountry !== "all" &&
        (c.country_code === selectedCountry || c.country === selectedCountry);

      const radius = Math.max(9, Math.min(28, 9 + (Number(c.visitors || 1) / maxVisitors) * 19));

      const circle = L.circleMarker([lat, lng], {
        radius,
        fillColor: isSelected ? "#10b981" : "#f59e0b",
        color: isSelected ? "#ffffff" : "#fbbf24",
        weight: isSelected ? 3 : 1.5,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.85 : 0.55,
      });

      circle.bindTooltip(
        `<div style="font-family: sans-serif; padding: 4px 6px;">
          <div style="font-weight: 800; font-size: 12px; color: #f59e0b;">${c.country} (${c.country_code})</div>
          <div style="font-size: 11px; color: #111;">Visitors: <strong>${c.visitors}</strong> &bull; Sessions: <strong>${c.sessions}</strong></div>
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

    // Plot City-level markers when a country is selected or for top cities
    cities.slice(0, 25).forEach((cityItem) => {
      const lat = parseFloat(cityItem.latitude);
      const lng = parseFloat(cityItem.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const dot = L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: "#38bdf8",
        color: "#0284c7",
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      dot.bindTooltip(
        `<div style="font-family: sans-serif; padding: 3px 5px;">
          <div style="font-weight: 700; font-size: 11px;">${cityItem.city}, ${cityItem.province}</div>
          <div style="font-size: 10px; color: #444;">${cityItem.country} &bull; ${cityItem.visitors} visitor(s)</div>
        </div>`,
        { direction: "top" }
      );

      dot.addTo(layerGroup);
    });
  }, [mapReady, countries, cities, selectedCountry, onSelectCountry]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#0b0e14]">
      {/* Map Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>
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
              className="ml-1 px-2 py-0.5 rounded bg-amber-500 text-neutral-950 text-[10px] font-extrabold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.flyTo([14.8872, 120.8572], 6, { duration: 0.8 })}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-white/10 cursor-pointer"
            title="Focus Philippines (Bulacan & Central Luzon)"
          >
            PH Focus
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.flyTo([18.0, 110.0], 2, { duration: 0.8 })}
            className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer"
            title="Reset World View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-[360px] sm:h-[420px] bg-[#0b0e14]" />

      {/* Legend Bar */}
      <div className="px-4 py-2.5 bg-neutral-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Country Activity Bubble (Click to drill down)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>City / Municipality Cluster</span>
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-500">
          Privacy Notice: IP geolocation is approximate at city/province level; raw IPs are truncated.
        </span>
      </div>
    </div>
  );
}
