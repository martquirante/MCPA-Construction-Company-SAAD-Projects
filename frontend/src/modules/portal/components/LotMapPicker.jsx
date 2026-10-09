"use client";

import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  Crosshair,
  Maximize2,
  Minimize2,
  Info,
  Check,
  X,
  Compass,
  Layers,
  Navigation,
} from "lucide-react";
import { useLanguage } from "@/modules/shared/LanguageContext";

// Hook to safely check if client has mounted (React 19 / Next.js safe)
const emptySubscribe = () => () => {};
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

// Comprehensive Local Coordinates Dictionary for Instant Pinpointing in PH / Central Luzon / NCR
const TOWN_COORDINATES = {
  // Bulacan Municipalities & Cities
  plaridel: { lat: 14.8871, lng: 120.8572 },
  malolos: { lat: 14.8527, lng: 120.8160 },
  guiguinto: { lat: 14.8311, lng: 120.8797 },
  balagtas: { lat: 14.8167, lng: 120.9167 },
  bocaue: { lat: 14.8000, lng: 120.9333 },
  marilao: { lat: 14.7583, lng: 120.9500 },
  meycauayan: { lat: 14.7333, lng: 120.9667 },
  "san jose del monte": { lat: 14.8139, lng: 121.0453 },
  sjdm: { lat: 14.8139, lng: 121.0453 },
  baliuag: { lat: 14.9500, lng: 120.9000 },
  calumpit: { lat: 14.9167, lng: 120.7667 },
  pulilan: { lat: 14.9000, lng: 120.8500 },
  "santa maria": { lat: 14.8167, lng: 120.9667 },
  "sta maria": { lat: 14.8167, lng: 120.9667 },
  angat: { lat: 14.9300, lng: 121.0333 },
  bustos: { lat: 14.9556, lng: 120.9250 },
  bulakan: { lat: 14.7936, lng: 120.8789 },
  hagonoy: { lat: 14.8333, lng: 120.7333 },
  norzagaray: { lat: 14.9056, lng: 121.0423 },
  obando: { lat: 14.7167, lng: 120.9333 },
  pandi: { lat: 14.8667, lng: 120.9500 },
  paombong: { lat: 14.8333, lng: 120.7833 },
  "san ildefonso": { lat: 15.0833, lng: 120.9500 },
  "san miguel": { lat: 15.1500, lng: 120.9667 },
  "san rafael": { lat: 15.0167, lng: 120.9667 },
  "dona remedios trinidad": { lat: 15.0000, lng: 121.1333 },
  drt: { lat: 15.0000, lng: 121.1333 },

  // Pampanga Municipalities & Cities
  "san fernando": { lat: 15.0286, lng: 120.6897 },
  angeles: { lat: 15.1450, lng: 120.5887 },
  mabalacat: { lat: 15.2200, lng: 120.5700 },
  guagua: { lat: 14.9667, lng: 120.6333 },
  lubao: { lat: 14.9333, lng: 120.6000 },
  mexico: { lat: 15.0667, lng: 120.7167 },
  arayat: { lat: 15.1500, lng: 120.7667 },
  bacolor: { lat: 14.9833, lng: 120.6500 },
  candaba: { lat: 15.0833, lng: 120.8333 },
  floridablanca: { lat: 14.9333, lng: 120.5333 },
  macabebe: { lat: 14.9000, lng: 120.7167 },
  magalang: { lat: 15.2167, lng: 120.6667 },
  masantol: { lat: 14.8833, lng: 120.7167 },
  porac: { lat: 15.0667, lng: 120.5333 },
  "san luis": { lat: 15.0333, lng: 120.7833 },
  "san simon": { lat: 14.9833, lng: 120.7833 },
  "santa ana": { lat: 15.1000, lng: 120.7667 },
  "santa rita": { lat: 15.0000, lng: 120.6167 },
  "santo tomas": { lat: 15.0000, lng: 120.7167 },
  sasmuan: { lat: 14.9333, lng: 120.6167 },

  // Metro Manila / NCR
  "quezon city": { lat: 14.6760, lng: 121.0437 },
  manila: { lat: 14.5995, lng: 120.9842 },
  caloocan: { lat: 14.6500, lng: 120.9833 },
  valenzuela: { lat: 14.7000, lng: 120.9833 },
  malabon: { lat: 14.6625, lng: 120.9569 },
  navotas: { lat: 14.6667, lng: 120.9500 },
  pasig: { lat: 14.5764, lng: 121.0851 },
  taguig: { lat: 14.5176, lng: 121.0509 },
  makati: { lat: 14.5547, lng: 121.0244 },
  pasay: { lat: 14.5378, lng: 120.9997 },
  paranaque: { lat: 14.4793, lng: 121.0198 },
  "las pinas": { lat: 14.4445, lng: 120.9939 },
  muntinlupa: { lat: 14.4081, lng: 121.0415 },
  marikina: { lat: 14.6507, lng: 121.1029 },
  mandaluyong: { lat: 14.5794, lng: 121.0359 },
  "san juan": { lat: 14.6019, lng: 121.0355 },
  pateros: { lat: 14.5454, lng: 121.0687 },

  // Provinces
  bulacan: { lat: 14.8871, lng: 120.8572 },
  pampanga: { lat: 15.0286, lng: 120.6897 },
  "metro manila": { lat: 14.6091, lng: 120.9899 },
  ncr: { lat: 14.6091, lng: 120.9899 },
  rizal: { lat: 14.5869, lng: 121.1719 },
  cavite: { lat: 14.2829, lng: 120.9167 },
  laguna: { lat: 14.2691, lng: 121.4113 },
  batangas: { lat: 13.7565, lng: 121.0583 },
  "nueva ecija": { lat: 15.4828, lng: 120.9708 },
  tarlac: { lat: 15.4802, lng: 120.5979 },
  bataan: { lat: 14.6819, lng: 120.5360 },
};

export default function LotMapPicker({
  coordinates = "14.8871, 120.8572",
  onCoordinatesChange,
  locationAddress = "",
  city = "",
  province = "",
  barangay = "",
  subdivision = "",
  street = "",
}) {
  const { language } = useLanguage();
  const isFil = language === "fil";
  const isMounted = useIsMounted();

  const [activeCoord, setActiveCoord] = useState(coordinates || "14.8871, 120.8572");
  const [mapMode, setMapMode] = useState("satellite"); // "street" | "satellite"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(16);

  // Auto-location state and feedback
  const [autoLocationLabel, setAutoLocationLabel] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Parse current latitude and longitude
  const [lat, lng] = useMemo(() => {
    const parts = (activeCoord || "14.8871, 120.8572").split(",").map((s) => parseFloat(s.trim()));
    const validLat = !isNaN(parts[0]) ? parts[0] : 14.8871;
    const validLng = !isNaN(parts[1]) ? parts[1] : 120.8572;
    return [validLat, validLng];
  }, [activeCoord]);

  // Live coordinates state during drag
  const [dragCoords, setDragCoords] = useState(null);
  const displayLat = dragCoords ? dragCoords[0] : lat;
  const displayLng = dragCoords ? dragCoords[1] : lng;

  // DOM Mount Hosts and Leaflet Refs
  const inlineHostRef = useRef(null);
  const fullscreenHostRef = useRef(null);
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const layersRef = useRef({ street: null, satellite: null });
  const geocodeAbortRef = useRef(null);
  const lastTargetRef = useRef("");

  // 1. INITIALIZE PERSISTENT LEAFLET MAP ELEMENT ONCE ON CLIENT MOUNT
  useEffect(() => {
    let isCancelled = false;

    // Create the persistent map canvas DOM node
    const mapDiv = document.createElement("div");
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";
    mapDiv.className = "w-full h-full cursor-grab active:cursor-grabbing";
    mapElementRef.current = mapDiv;

    // Mount initially into the inline host
    if (inlineHostRef.current) {
      inlineHostRef.current.appendChild(mapDiv);
    }

    async function initLeaflet() {
      const L = (await import("leaflet")).default;
      if (isCancelled || !mapElementRef.current) return;

      // Create Leaflet map with smooth dragging and zoom interaction
      const map = L.map(mapDiv, {
        center: [lat, lng],
        zoom: currentZoom || 16,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
      });
      mapInstanceRef.current = map;

      // High-precision Tile Layers (DriveAndGo standard)
      const layerStreet = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        { maxZoom: 22 }
      );

      const layerSatellite = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        { maxZoom: 20 }
      );

      layersRef.current = {
        street: layerStreet,
        satellite: layerSatellite,
      };

      // Set initial base layer
      if (mapMode === "street") {
        layerStreet.addTo(map);
      } else {
        layerSatellite.addTo(map);
      }

      // Clean SVG Teardrop Pin Marker (NO background box on pin, NO background box on text)
      const pinIcon = L.divIcon({
        className: "mcpa-clean-pin",
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);cursor:grab;user-select:none;background:transparent;border:none;">
            <svg width="34" height="42" viewBox="0 0 24 30" fill="none" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.65));">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.627-5.373-12-12-12z" fill="#f59e0b"/>
              <circle cx="12" cy="11" r="4.5" fill="#18181b"/>
            </svg>
            <span style="background:transparent;border:none;margin-top:2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:600;color:#ffffff;text-shadow:0 1px 3px rgba(0,0,0,0.8), 0 0 3px #000;white-space:nowrap;letter-spacing:0.2px;">
              Lot Pin
            </span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on("drag", (e) => {
        const c = e.target.getLatLng();
        setDragCoords([c.lat, c.lng]);
      });

      marker.on("dragend", (e) => {
        const c = e.target.getLatLng();
        const formatted = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
        setActiveCoord(formatted);
        setDragCoords(null);
        setAutoLocationLabel("");
        if (onCoordinatesChange) onCoordinatesChange(formatted);
      });

      // Handle map click anywhere to move pin
      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        const formatted = `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
        setActiveCoord(formatted);
        setDragCoords(null);
        setAutoLocationLabel("");
        if (onCoordinatesChange) onCoordinatesChange(formatted);
      });

      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom());
      });

      // Multi-stage invalidation to guarantee tiles render immediately
      const invalidate = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      invalidate();
      setTimeout(invalidate, 60);
      setTimeout(invalidate, 200);
      setTimeout(invalidate, 500);
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapDiv.parentNode) {
        mapDiv.parentNode.removeChild(mapDiv);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. SEAMLESS DOM TRANSFER BETWEEN INLINE CARD & FULLSCREEN MODAL (Zero reload, zero pin loss)
  useEffect(() => {
    const mapDiv = mapElementRef.current;
    if (!mapDiv) return;

    if (isFullscreen) {
      if (fullscreenHostRef.current && !fullscreenHostRef.current.contains(mapDiv)) {
        fullscreenHostRef.current.appendChild(mapDiv);
      }
      document.body.style.overflow = "hidden";
    } else {
      if (inlineHostRef.current && !inlineHostRef.current.contains(mapDiv)) {
        inlineHostRef.current.appendChild(mapDiv);
      }
      document.body.style.overflow = "";
    }

    // Immediately notify Leaflet of container dimension changes
    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 40);
    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 180);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFullscreen]);

  // 3. KEYBOARD SHORTCUT: ESCAPE TO EXIT FULLSCREEN
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // 4. SMOOTHLY UPDATE PIN POSITION WHEN COORDINATES CHANGE
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const currentMarkerPos = markerRef.current.getLatLng();
    if (
      Math.abs(currentMarkerPos.lat - lat) > 0.00001 ||
      Math.abs(currentMarkerPos.lng - lng) > 0.00001
    ) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  // 5. SYNC BASE LAYERS WHEN MAPMODE CHANGES
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersRef.current;
    if (!map || !layers.street || !layers.satellite) return;

    if (mapMode === "street") {
      if (map.hasLayer(layers.satellite)) map.removeLayer(layers.satellite);
      if (!map.hasLayer(layers.street)) layers.street.addTo(map);
    } else {
      if (map.hasLayer(layers.street)) map.removeLayer(layers.street);
      if (!map.hasLayer(layers.satellite)) layers.satellite.addTo(map);
    }
  }, [mapMode]);

  // 6. SMART AUTO-PINPOINT & SEAMLESS MAP NAVIGATION:
  // Automatically flies the map and smoothly pans to the selected location, dropping the pin right at the site
  useEffect(() => {
    if (!province && !city && !barangay) return;

    const cleanBarangay = (barangay || "").trim();
    const cleanCity = (city || "").replace(/city of|city|municipality of/gi, "").trim();
    const cleanProvince = (province || "").trim();
    const cleanSubdivision = (subdivision || "").trim();
    const cleanStreet = (street || "").trim();

    // Prevent duplicate re-triggering for the exact same address string
    const locationKey = `${cleanProvince}|${cleanCity}|${cleanBarangay}|${cleanSubdivision}|${cleanStreet}`;
    if (lastTargetRef.current === locationKey) return;
    lastTargetRef.current = locationKey;

    const locationName = [cleanStreet, cleanSubdivision, cleanBarangay, city, province]
      .filter(Boolean)
      .join(", ");

    // Cancel any previous in-flight geocoding request
    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    // Helper function: smoothly flies map, sets zoom, positions pin, and syncs coordinates
    const applyLocation = (targetLat, targetLng, targetZoom, label) => {
      const formatted = `${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`;
      setActiveCoord(formatted);
      setCurrentZoom(targetZoom);
      setAutoLocationLabel(label || locationName);
      if (markerRef.current) {
        markerRef.current.setLatLng([targetLat, targetLng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([targetLat, targetLng], targetZoom, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
        mapInstanceRef.current.invalidateSize();
      }
      if (onCoordinatesChange) onCoordinatesChange(formatted);
    };

    // CASE 1: Exact Barangay, Subdivision, or Street is selected -> Perform precise high-zoom geocoding
    if (cleanBarangay || cleanSubdivision || cleanStreet) {
      const timeoutId = setTimeout(async () => {
        setIsLocating(true);
        try {
          // Priority 1: Search exact Barangay + City + Province
          const primaryParts = [cleanStreet, cleanSubdivision, cleanBarangay, cleanCity, cleanProvince, "Philippines"].filter(Boolean);
          const primaryQuery = primaryParts.join(", ");

          let geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              primaryQuery
            )}&countrycodes=ph&limit=1`,
            {
              signal: controller.signal,
              headers: { "Accept-Language": "en" },
            }
          );

          let data = geoRes.ok ? await geoRes.json() : [];

          // Priority 2: Fallback to Barangay + City + Province if street/subdivision wasn't indexed
          if ((!data || data.length === 0) && cleanBarangay) {
            const fallbackParts = [cleanBarangay, cleanCity, cleanProvince, "Philippines"].filter(Boolean);
            const fallbackQuery = fallbackParts.join(", ");
            geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                fallbackQuery
              )}&countrycodes=ph&limit=1`,
              {
                signal: controller.signal,
                headers: { "Accept-Language": "en" },
              }
            );
            data = geoRes.ok ? await geoRes.json() : [];
          }

          if (data && data.length > 0) {
            const gLat = parseFloat(data[0].lat);
            const gLng = parseFloat(data[0].lon);
            if (!isNaN(gLat) && !isNaN(gLng)) {
              // Deep Zoom 17 so user can clearly see lots, streets, and houses
              applyLocation(gLat, gLng, 17, locationName);
              setIsLocating(false);
              return;
            }
          }

          // Fallback to City Center dictionary if Nominatim returns nothing for the barangay
          if (cleanCity) {
            const cityKey = cleanCity.toLowerCase();
            for (const [k, v] of Object.entries(TOWN_COORDINATES)) {
              if (cityKey.includes(k) || k.includes(cityKey)) {
                applyLocation(v.lat, v.lng, 16, locationName);
                break;
              }
            }
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            // Fallback to City Center on network error
            if (cleanCity) {
              const cityKey = cleanCity.toLowerCase();
              for (const [k, v] of Object.entries(TOWN_COORDINATES)) {
                if (cityKey.includes(k) || k.includes(cityKey)) {
                  applyLocation(v.lat, v.lng, 16, locationName);
                  break;
                }
              }
            }
          }
        } finally {
          setIsLocating(false);
        }
      }, 250);

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }

    // CASE 2: Only City/Municipality is selected (no barangay yet) -> Fast Instant Fly (Zoom 15)
    if (cleanCity) {
      const cityKey = cleanCity.toLowerCase();
      let matched = null;
      for (const [k, v] of Object.entries(TOWN_COORDINATES)) {
        if (cityKey.includes(k) || k.includes(cityKey)) {
          matched = v;
          break;
        }
      }

      if (matched) {
        applyLocation(matched.lat, matched.lng, 15, locationName);
        return;
      }

      // Query geocoder if town is not in local dictionary
      const timeoutId = setTimeout(async () => {
        setIsLocating(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              `${cleanCity}, ${cleanProvince}, Philippines`
            )}&countrycodes=ph&limit=1`,
            { signal: controller.signal }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const gLat = parseFloat(data[0].lat);
              const gLng = parseFloat(data[0].lon);
              if (!isNaN(gLat) && !isNaN(gLng)) {
                applyLocation(gLat, gLng, 15, locationName);
              }
            }
          }
        } catch (err) {
          // ignore
        } finally {
          setIsLocating(false);
        }
      }, 250);

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }

    // CASE 3: Only Province is selected (Zoom 12)
    if (cleanProvince) {
      const provKey = cleanProvince.toLowerCase();
      for (const [k, v] of Object.entries(TOWN_COORDINATES)) {
        if (provKey.includes(k) || k.includes(provKey)) {
          applyLocation(v.lat, v.lng, 12, locationName);
          return;
        }
      }
    }
  }, [province, city, barangay, subdivision, street, onCoordinatesChange]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([displayLat, displayLng], 17, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="space-y-2.5">
      {/* Header Label and Subtitle - Clean Editorial Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
        <div>
          <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 tracking-tight">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{isFil ? "Lokasyon ng Lote sa Mapa" : "Site Location Map"}</span>
            {isLocating && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1 ml-2">
                <span>{isFil ? "Naghahanap..." : "Locating..."}</span>
              </span>
            )}
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isFil
              ? "I-drag ang pin o i-click ang mapa upang itugma ang eksaktong lote ng proyekto."
              : "Drag the pin or click on the map to pinpoint your exact lot boundary."}
          </p>
        </div>

        {/* Subtle, unpretentious location label */}
        {autoLocationLabel && (
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 shrink-0">
            <span className="text-neutral-400 dark:text-neutral-500">Pinned to:</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[220px]">
              {autoLocationLabel}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          INLINE MAP CARD (Clean, intentional architectural viewport)
          ========================================================================= */}
      <div className="relative flex flex-col rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs transition-colors">
        {/* Top Control Bar: Streamlined & Balanced */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 z-20 shrink-0">
          {/* Left: Modern Segmented Switcher for Map / Satellite */}
          <div className="inline-flex p-0.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/40 dark:border-neutral-700/60 text-xs">
            <button
              type="button"
              onClick={() => setMapMode("satellite")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mapMode === "satellite"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapMode("street")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mapMode === "street"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Street
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {/* Center Pin Button */}
            <button
              type="button"
              onClick={handleRecenter}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Center map on pin"
            >
              <Crosshair className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Center pin</span>
            </button>

            {/* Clean Vertical Zoom Control (Standard Human Pattern, No z20 debug number) */}
            <div className="hidden sm:flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm font-semibold transition-colors cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-700" />
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm font-semibold transition-colors cursor-pointer"
                title="Zoom Out"
              >
                −
              </button>
            </div>

            {/* Fullscreen Trigger */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open Fullscreen View"
            >
              <Maximize2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>{isFil ? "Palakihin" : "Fullscreen"}</span>
            </button>
          </div>
        </div>

        {/* Inline Map Canvas Mount Point */}
        <div
          ref={inlineHostRef}
          style={{ height: "380px", minHeight: "380px", width: "100%" }}
          className="relative w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden"
        />

        {/* Inline Bottom Bar */}
        <div className="px-3.5 py-2 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 z-20 shrink-0 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              {displayLat.toFixed(5)}° N, {displayLng.toFixed(5)}° E
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-neutral-500 dark:text-neutral-400">
              {mapMode === "satellite" ? "Satellite imagery" : "Street roadmap"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            <Info className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span>{isFil ? "I-drag ang pin o i-click ang mapa" : "Drag pin or click map to move"}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FULLSCREEN ARCHITECTURAL SITE STUDIO (Expansive, clean, professional)
          ========================================================================= */}
      {isMounted && isFullscreen && createPortal(
        <div className="fixed inset-0 z-[100000] w-screen h-screen bg-neutral-900 flex flex-col select-none text-neutral-900 dark:text-white animate-in fade-in duration-150">
          {/* Top Header */}
          <header className="h-16 px-4 sm:px-6 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between z-30 shrink-0">
            {/* Left: Project title and location */}
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                  Project Site Location
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[240px] sm:max-w-md">
                  {locationAddress || (city ? `${barangay ? `${barangay}, ` : ""}${city}, ${province || "Bulacan"}` : "Bulacan, Philippines")}
                </p>
              </div>
            </div>

            {/* Center: Segmented layer switch */}
            <div className="hidden sm:inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setMapMode("satellite")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mapMode === "satellite"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapMode("street")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mapMode === "street"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                Street
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Center pin */}
              <button
                type="button"
                onClick={handleRecenter}
                className="hidden sm:flex px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors items-center gap-1.5 cursor-pointer"
                title="Center on pin"
              >
                <Crosshair className="w-3.5 h-3.5 text-neutral-500" />
                <span>Center pin</span>
              </button>

              {/* Primary Confirm button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isFil ? "I-save ang Lokasyon" : "Confirm Location"}</span>
              </button>

              {/* Close X button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mobile Mode Switcher Bar */}
          <div className="sm:hidden flex items-center px-3 py-1.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
            <div className="w-full inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setMapMode("satellite")}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center ${
                  mapMode === "satellite"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapMode("street")}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center ${
                  mapMode === "street"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Street
              </button>
            </div>
          </div>

          {/* Dedicated Fullscreen Map Canvas */}
          <div className="flex-1 relative w-full h-full min-h-0 bg-neutral-950 overflow-hidden">
            {/* The Host where persistent Leaflet map element is transferred */}
            <div ref={fullscreenHostRef} className="w-full h-full" />

            {/* Floating Action Controls on Canvas (Top-Right) */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              {/* Floating Vertical Zoom Control */}
              <div className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 shadow-md overflow-hidden backdrop-blur-sm">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-8 h-8 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-semibold transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
                <div className="h-[1px] w-full bg-neutral-200 dark:bg-neutral-700" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-8 h-8 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-semibold transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  −
                </button>
              </div>

              {/* Floating Re-center Button */}
              <button
                type="button"
                onClick={handleRecenter}
                className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 shadow-md flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer backdrop-blur-sm"
                title="Center on pin"
              >
                <Crosshair className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>

            {/* Floating Subtle Instruction Banner at bottom-center */}
            <div className="absolute bottom-5 inset-x-0 flex justify-center z-20 pointer-events-none px-4">
              <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-lg flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 pointer-events-auto">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {isFil
                    ? "I-drag ang pin o i-click ang mapa upang itakda ang eksaktong lote."
                    : "Drag the pin or click on the map to place your lot."}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  {displayLat.toFixed(5)}°, {displayLng.toFixed(5)}°
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
