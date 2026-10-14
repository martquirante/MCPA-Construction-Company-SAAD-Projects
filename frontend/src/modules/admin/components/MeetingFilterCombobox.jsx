"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Search,
  X,
  CalendarCheck,
  Clock,
  Video,
  Calendar,
  Filter,
  Archive,
  Building2,
} from "lucide-react";

export default function MeetingFilterCombobox({
  activeFilter = "all",
  onSelectFilter,
  metrics = {},
  totalCount = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const filterOptions = [
    {
      id: "all",
      label: "All Active Meetings",
      shortLabel: "All",
      count: metrics.total ?? totalCount,
      icon: CalendarCheck,
      color: "text-amber-500",
    },
    {
      id: "today",
      label: "Today's Consultations",
      shortLabel: "Today",
      count: metrics.today ?? 0,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      id: "online",
      label: "Online Video Calls",
      shortLabel: "Online",
      count: metrics.online ?? 0,
      icon: Video,
      color: "text-sky-500",
    },
    {
      id: "f2f",
      label: "Face-to-Face Consultations",
      shortLabel: "Face-to-Face",
      count: metrics.f2f ?? 0,
      icon: Building2,
      color: "text-purple-500 dark:text-purple-400",
    },
    {
      id: "upcoming",
      label: "Upcoming Schedules",
      shortLabel: "Upcoming",
      count: metrics.upcoming ?? null,
      icon: Calendar,
      color: "text-emerald-500",
    },
    {
      id: "archive",
      label: "Meeting History / Archive",
      shortLabel: "History",
      count: metrics.archived ?? 0,
      icon: Archive,
      color: "text-neutral-500 dark:text-neutral-400",
    },
    {
      id: "all_records",
      label: "All Meetings (Full History)",
      shortLabel: "All Meetings",
      count: metrics.allTotal ?? ((metrics.total || 0) + (metrics.archived || 0)),
      icon: CalendarCheck,
      color: "text-amber-500",
    },
  ];

  const currentOption = filterOptions.find((opt) => opt.id === activeFilter) || filterOptions[0];
  const currentCount = currentOption.count;

  const filteredOptions = filterOptions.filter((opt) =>
    opt.label.toLowerCase().includes(filterQuery.toLowerCase().trim()) ||
    opt.shortLabel.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  const CurrentIcon = currentOption.icon || Filter;

  return (
    <div className="relative shrink-0 select-none" ref={dropdownRef}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setFilterQuery("");
        }}
        className={`group flex items-center justify-between gap-3 px-3.5 py-2 h-[40px] rounded-lg text-xs font-mono border transition-all cursor-pointer shadow-xs ${
          isOpen
            ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-neutral-950 dark:text-white ring-1 ring-amber-500/20"
            : activeFilter !== "all"
            ? "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 text-neutral-900 dark:text-neutral-100 hover:border-amber-500"
            : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-neutral-950 dark:hover:text-white"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CurrentIcon
            className={`w-4 h-4 shrink-0 ${
              activeFilter !== "all"
                ? currentOption.color || "text-amber-500"
                : "text-amber-500"
            }`}
          />

          <div className="flex items-center gap-1.5 truncate text-left">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-wider hidden sm:inline">
              Filter:
            </span>
            <span
              className={`font-bold tracking-tight uppercase truncate ${
                activeFilter !== "all"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-800 dark:text-neutral-200"
              }`}
            >
              {currentOption.shortLabel}
            </span>
          </div>
        </div>

        {/* Right Badge count & Chevron (No bg, plain text number only) */}
        <div className="flex items-center gap-2 shrink-0">
          {currentCount !== null && (
            <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
              {currentCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-amber-500" : "group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Dropdown Header */}
          <div className="p-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                Filter Meetings
              </span>
              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectFilter("all");
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors"
                >
                  Reset to All
                </button>
              )}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Find filter option..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Filter Options */}
          <div className="p-1.5 max-h-64 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-neutral-400">
                No matching filter option
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = activeFilter === opt.id;
                const OptIcon = opt.icon || CalendarCheck;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectFilter(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full group flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                        : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <OptIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isSelected
                              ? "text-neutral-950"
                              : opt.color || "text-neutral-400"
                          }`}
                        />
                      </div>

                      <span className="text-xs font-mono uppercase truncate block">
                        {opt.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {opt.count !== null && (
                        <span
                          className={`text-xs font-mono font-bold transition-colors ${
                            isSelected
                              ? "text-neutral-950"
                              : opt.count > 0
                              ? "text-neutral-600 dark:text-neutral-300"
                              : "text-neutral-400 dark:text-neutral-500"
                          }`}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
                      ) : (
                        <span className="w-3.5 h-3.5" />
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
