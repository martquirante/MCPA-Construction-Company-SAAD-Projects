"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  MapPin,
  X,
  ChevronDown,
  Check,
  ExternalLink,
  Navigation,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  EstablishmentLogo,
  CURATED_PH_VENUES,
  FILTER_PRESETS,
} from "./VenueSearchModal";

/**
 * Modern High-End Searchable Combobox for Philippine Meeting Venues
 * Features:
 * - Brand / Spot Combobox Selector (All Spots, Starbucks, Robinsons, SM Malls, Jollibee, etc.)
 * - Branch / Venue Combobox with Curated PH Directory & OpenStreetMap Nominatim Live Search
 * - Clean, transparent background styling directly integrated with the inquiry paper sheet
 */
export default function VenueCombobox({
  value = "",
  onChange,
  onClear,
  isFil = false,
  hasError = false,
  errorMessage = "",
  className = "",
  id = "venue-combobox",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const containerRef = useRef(null);
  const brandContainerRef = useRef(null);
  const inputRef = useRef(null);
  const brandSearchInputRef = useRef(null);

  // Close comboboxes when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (brandContainerRef.current && !brandContainerRef.current.contains(e.target)) {
        setIsBrandOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Online search with OpenStreetMap Nominatim restricted to Philippines (debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingOnline(true);
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ph&q=${encodeURIComponent(
          trimmed
        )}&limit=6&addressdetails=1`;
        const res = await fetch(endpoint, {
          headers: {
            "Accept-Language": "en-PH, fil, en",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = (data || []).map((item) => ({
            name: item.name || item.display_name?.split(",")[0] || trimmed,
            category: item.type || "Venue / Landmark",
            brand: item.name || trimmed,
            address: item.display_name,
            city:
              item.address?.city ||
              item.address?.municipality ||
              item.address?.province ||
              "Philippines",
            isOnline: true,
          }));
          setOnlineResults(parsed);
        }
      } catch (err) {
        // Silently fallback to curated
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Current selected brand preset object
  const currentPreset = useMemo(() => {
    return FILTER_PRESETS.find((p) => p.brand === selectedBrand) || FILTER_PRESETS[0];
  }, [selectedBrand]);

  // Filtered brand presets when user types in brand combobox search
  const filteredPresets = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return FILTER_PRESETS;
    return FILTER_PRESETS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [brandSearch]);

  // Count helper for brands
  const getBrandCount = (brandKey) => {
    if (brandKey === "ALL") return CURATED_PH_VENUES.length;
    if (brandKey === "Coffee Shop") {
      return CURATED_PH_VENUES.filter((v) => v.category === "Coffee Shop").length;
    }
    if (brandKey === "Fast Food") {
      return CURATED_PH_VENUES.filter((v) => v.category === "Fast Food").length;
    }
    if (brandKey === "Shopping Mall") {
      return CURATED_PH_VENUES.filter((v) => v.category.includes("Mall") || v.category.includes("Center")).length;
    }
    return CURATED_PH_VENUES.filter((v) => v.brand === brandKey).length;
  };

  // Filter curated PH venues based on query and selected brand combobox
  const filteredCurated = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURATED_PH_VENUES.filter((venue) => {
      if (selectedBrand !== "ALL") {
        if (selectedBrand === "Coffee Shop") {
          if (venue.category !== "Coffee Shop") return false;
        } else if (selectedBrand === "Shopping Mall") {
          if (!venue.category.includes("Mall") && !venue.category.includes("Center")) return false;
        } else {
          if (venue.brand !== selectedBrand) return false;
        }
      }

      if (!q) return true;
      return (
        venue.name.toLowerCase().includes(q) ||
        venue.address.toLowerCase().includes(q) ||
        venue.city.toLowerCase().includes(q) ||
        venue.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, selectedBrand]);

  const handleSelectBrand = (preset) => {
    setSelectedBrand(preset.brand);
    setIsBrandOpen(false);
    setBrandSearch("");
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelect = (venueString) => {
    if (onChange) onChange(venueString);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange("");
    if (onClear) onClear();
    setQuery("");
    if (inputRef.current) inputRef.current.focus();
  };

  const placeholderText = useMemo(() => {
    if (selectedBrand !== "ALL") {
      return isFil
        ? `Pumili ng branch ng ${currentPreset.label}...`
        : `Select ${currentPreset.label} branch...`;
    }
    return isFil
      ? "Ilagay ang venue (hal. Starbucks, Jollibee, Robinsons, SM Mall)"
      : "Enter meeting venue (ex. Starbucks, Jollibee, Robinsons, SM Mall)";
  }, [selectedBrand, currentPreset, isFil]);

  return (
    <div className={`relative space-y-2.5 ${className}`}>
      {/* Combobox Label with Clean Typography "Philippines Only" (No colored background) */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{isFil ? "Napiling Lugar / Coffee Shop *" : "Meeting Venue (Coffee Shop, Fast Food, or Mall) *"}</span>
        </label>
        <span className="text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
          Philippines Only
        </span>
      </div>

      {/* Dual Combobox Controls: Brand/Category Combobox + Branch/Venue Combobox */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* 1. Brand / Spot Selection Combobox */}
        <div className="sm:col-span-5 relative" ref={brandContainerRef}>
          <button
            type="button"
            id={`${id}-brand-select`}
            onClick={() => {
              setIsBrandOpen(!isBrandOpen);
              if (isOpen) setIsOpen(false);
            }}
            className={`w-full min-h-[46px] px-3.5 rounded-xl border bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
              isBrandOpen
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "border-neutral-300 dark:border-white/10 hover:border-amber-500/60"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="shrink-0 flex items-center">
                {currentPreset.brand !== "ALL" &&
                currentPreset.brand !== "Coffee Shop" &&
                currentPreset.brand !== "Fast Food" &&
                currentPreset.brand !== "Shopping Mall" ? (
                  <EstablishmentLogo
                    brand={currentPreset.brand}
                    className="w-5 h-5 !rounded-full shrink-0"
                    iconClassName="w-3 h-3"
                  />
                ) : (
                  <currentPreset.icon className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-mono text-neutral-400 block -mb-0.5 leading-none">
                  {isFil ? "Brand / Kategorya" : "Brand / Spot"}
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate font-mono block">
                  {currentPreset.label}
                </span>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                isBrandOpen ? "rotate-180 text-amber-500" : ""
              }`}
            />
          </button>

          {/* Brand Combobox Floating Dropdown */}
          {isBrandOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[290px]">
              {/* Brand Search input */}
              <div className="p-2 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  ref={brandSearchInputRef}
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder={isFil ? "Hanapin ang brand..." : "Filter brand..."}
                  className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 dark:text-white font-mono placeholder:text-neutral-400"
                />
                {brandSearch && (
                  <button
                    type="button"
                    onClick={() => setBrandSearch("")}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Brands list */}
              <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                {filteredPresets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedBrand === preset.brand;
                  const isSpecific =
                    preset.brand !== "ALL" &&
                    preset.brand !== "Coffee Shop" &&
                    preset.brand !== "Fast Food" &&
                    preset.brand !== "Shopping Mall";
                  const count = getBrandCount(preset.brand);

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectBrand(preset)}
                      className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 border border-amber-500 text-neutral-900 dark:text-white font-bold"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isSpecific ? (
                          <EstablishmentLogo
                            brand={preset.brand}
                            className="w-5 h-5 !rounded-full shrink-0"
                            iconClassName="w-3 h-3"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                            <Icon className="w-3 h-3 text-amber-500" />
                          </div>
                        )}
                        <span className="text-xs truncate font-mono">{preset.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {count > 0 && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {count}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Specific Branch / Venue Combobox */}
        <div className="sm:col-span-7 relative" ref={containerRef}>
          <div
            onClick={() => {
              setIsOpen(true);
              if (isBrandOpen) setIsBrandOpen(false);
              if (inputRef.current) inputRef.current.focus();
            }}
            className={`w-full min-h-[46px] px-3.5 rounded-xl border bg-white dark:bg-neutral-900 flex items-center gap-2.5 transition-all cursor-text ${
              hasError
                ? "border-red-500 ring-2 ring-red-500/20"
                : isOpen
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "border-neutral-300 dark:border-white/10 hover:border-amber-500/60"
            }`}
          >
            {/* Left Icon: Live Logo if selected, otherwise search icon */}
            <div className="shrink-0 flex items-center">
              {value ? (
                <EstablishmentLogo name={value} className="w-5 h-5 !rounded-full" iconClassName="w-3 h-3" />
              ) : (
                <Search className="w-4 h-4 text-neutral-400" />
              )}
            </div>

            {/* Search / Entry Input */}
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-mono text-neutral-400 block -mb-0.5 leading-none">
                {isFil ? "Branch / Landmark" : "Specific Branch / Venue"}
              </span>
              <input
                id={id}
                ref={inputRef}
                type="text"
                value={isOpen ? query : (value || query)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => {
                  setIsOpen(true);
                  if (isBrandOpen) setIsBrandOpen(false);
                }}
                placeholder={value ? value : placeholderText}
                className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 dark:text-white font-mono placeholder:text-neutral-400 truncate"
              />
            </div>

            {/* Right Action Icons: Spinner, Clear Button & Chevron */}
            <div className="flex items-center gap-1 shrink-0">
              {isSearchingOnline && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              )}

              {(value || query) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title={isFil ? "Alisin ang napiling venue" : "Clear venue"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                  if (isBrandOpen) setIsBrandOpen(false);
                }}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-transform"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Branch / Venue Floating Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[300px]">
              {/* Header Status */}
              <div className="px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                <span>
                  {selectedBrand === "ALL"
                    ? `${isFil ? "Lahat ng Spots" : "All Preset Spots"} (${filteredCurated.length})`
                    : `${currentPreset.label} (${filteredCurated.length})`}
                </span>
                {isSearchingOnline && (
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    {isFil ? "Naghahanap online..." : "Searching online..."}
                  </span>
                )}
              </div>

              {/* Results Scroll Area */}
              <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                {/* Option: Use Custom Typed Venue */}
                {query.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="w-full p-2.5 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-colors flex items-center justify-between gap-2.5 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{isFil ? "Gamitin ang sariling lokasyon:" : "Use this exact venue / landmark:"}</span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                        &ldquo;{query.trim()}&rdquo;
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                )}

                {/* Online Nominatim Live Results */}
                {onlineResults.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 px-2 block font-bold">
                      Online Live Matches
                    </span>
                    {onlineResults.map((item, idx) => {
                      const fullString = `${item.name} (${item.address})`;
                      const isSelected = value === fullString;
                      return (
                        <button
                          key={`online-${idx}`}
                          type="button"
                          onClick={() => handleSelect(fullString)}
                          className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/15 border border-amber-500 text-neutral-900 dark:text-white"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <EstablishmentLogo name={item.name} className="w-6 h-6 shrink-0" iconClassName="w-3 h-3" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold block truncate">{item.name}</span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate font-mono">
                                {item.address}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Curated Pre-filtered Branches */}
                {filteredCurated.map((venue, idx) => {
                  const fullString = `${venue.name} — ${venue.address}`;
                  const isSelected =
                    value === fullString ||
                    value === venue.name ||
                    value.startsWith(venue.name);

                  return (
                    <button
                      key={`curated-${idx}`}
                      type="button"
                      onClick={() => handleSelect(fullString)}
                      className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 border border-amber-500/80 font-bold text-neutral-900 dark:text-white"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <EstablishmentLogo
                          name={venue.name}
                          brand={venue.brand}
                          className="w-7 h-7 shrink-0"
                          iconClassName="w-3.5 h-3.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                              {venue.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 font-mono uppercase">
                              {venue.city}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate font-mono mt-0.5">
                            {venue.address}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}

                {/* Empty Results Fallback */}
                {filteredCurated.length === 0 && onlineResults.length === 0 && (
                  <div className="py-6 px-3 text-center text-neutral-400 font-mono text-xs">
                    <MapPin className="w-6 h-6 mx-auto mb-1.5 text-amber-500 opacity-60" />
                    <p>{isFil ? "Walang nahanap na branch sa filter na ito." : "No branches match your current filter."}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {isFil
                        ? "I-type lamang ang nais na lugar at pindutin ang 'Select' sa itaas."
                        : "Type any landmark name and select 'Use this exact venue' above."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Field Error Message */}
      {hasError && errorMessage && (
        <p className="text-[11px] text-red-500 font-mono mt-1">{errorMessage}</p>
      )}

      {/* Selected Venue Visual Card (Clean transparent styling without colored backgrounds) */}
      {value && !isOpen && (
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <EstablishmentLogo
              name={value}
              className="w-9 h-9 shrink-0 !shadow-none"
              iconClassName="w-4 h-4"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {value.split(" (")[0].split(" — ")[0]}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Confirmed Spot</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono mt-0.5">
                {value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-amber-500 text-neutral-800 dark:text-neutral-200 text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{isFil ? "Tingnan sa Maps" : "View on Maps"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-2xs"
            >
              {isFil ? "Palitan" : "Change"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
