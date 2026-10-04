"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, getFlagUrl } from "../data/countries";
import { SearchIcon, ChevronDownIcon, CheckIcon, GlobeIcon } from "@/modules/shared/Icons";

export default function CountryPicker({
  selectedCountryName,
  onSelectCountry,
  label = "Country of Current Residence / Work (OFW)",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find active country object
  const currentCountry = useMemo(() => {
    return (
      COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === (selectedCountryName || "").toLowerCase() ||
          c.name.toLowerCase().includes((selectedCountryName || "").toLowerCase())
      ) || COUNTRIES[0] // Default to UAE
    );
  }, [selectedCountryName]);

  // Filter countries based on user query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q)
    );
  }, [searchQuery]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // focus search input
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (country) => {
    onSelectCountry(country);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-850/80 border border-neutral-300 dark:border-neutral-700/80 hover:border-amber-500/60 flex items-center justify-between text-left transition-all cursor-pointer text-xs sm:text-sm text-neutral-900 dark:text-white"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={getFlagUrl(currentCountry.code)}
            alt=""
            className="w-5 h-3.5 object-cover rounded-xs shrink-0 shadow-xs border border-black/10 dark:border-white/10"
            loading="lazy"
          />
          <span className="truncate font-medium">
            {currentCountry.name}
          </span>
          <span className="text-xs text-neutral-400 shrink-0">
            {currentCountry.dial}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-amber-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Field */}
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/50">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country (e.g. Saudi, Japan, Canada, UAE)..."
                className="w-full pl-8 pr-3 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-52 overflow-y-auto scrollbar-thin py-1 divide-y divide-neutral-100/50 dark:divide-white/5">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === currentCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                        : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getFlagUrl(c.code)}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-xs shrink-0 shadow-xs border border-black/10 dark:border-white/10"
                        loading="lazy"
                      />
                      <span className="truncate">{c.name}</span>
                      {c.popular && (
                        <span className="text-[9px] px-1 rounded-sm bg-neutral-100 dark:bg-white/10 text-neutral-500 shrink-0">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-neutral-400">
                        {c.dial}
                      </span>
                      {isSelected && (
                        <CheckIcon className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
