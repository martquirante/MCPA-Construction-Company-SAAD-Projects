import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, SearchIcon, CheckIcon, RefreshCwIcon } from "lucide-react";

/**
 * Modern Searchable Combobox for Philippine Geographic Levels
 * 
 * Supports fast client-side filtering, keyboard accessibility,
 * loading animations, disabled states, and red error highlighting.
 */
export default function PhLocationCombobox({
  id,
  label,
  value = "",
  placeholder = "Select...",
  items = [], // Array of { name, code, ... }
  isLoading = false,
  disabled = false,
  hasError = false,
  onSelect, // (item) => void
  onClear,
  required = false,
  emptyMessage = "No locations found",
  searchPlaceholder = "Type to search...",
  className = "",
  icon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filtered items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [items, searchQuery]);

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1 truncate flex items-center justify-between">
          <span className="flex items-center gap-1">
            {icon}
            <span>{label}</span>
          </span>
          {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}

      {/* Combobox Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (!disabled && !isLoading) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full h-10 px-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs sm:text-sm text-left transition-all ${
          disabled
            ? "bg-neutral-100 dark:bg-[#161a23]/40 border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-75"
            : hasError
            ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
            : isOpen
            ? "bg-white dark:bg-[#161a23] border-amber-500 ring-2 ring-amber-500/15 text-neutral-900 dark:text-white"
            : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-amber-500/60"
        }`}
      >
        <span className={`truncate flex-1 ${!value ? "text-neutral-400 dark:text-neutral-500 font-normal" : "font-medium"}`}>
          {isLoading ? (
            <span className="flex items-center gap-2 text-neutral-400 text-xs">
              <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Loading list...</span>
            </span>
          ) : (
            value || placeholder
          )}
        </span>

        <span className="shrink-0 flex items-center text-neutral-400">
          {isLoading ? (
            <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-500" : "text-neutral-400"}`}
            />
          )}
        </span>
      </button>

      {/* Dropdown Popup */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search Header */}
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
            <div className="relative flex items-center">
              <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  } else if (e.key === "Enter" && filteredItems.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredItems[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* List of Options */}
          <div className="max-h-56 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                {emptyMessage}
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = value && item.name.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={item.code || `${item.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold"
                        : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {isSelected && (
                      <CheckIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.5]" />
                    )}
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
