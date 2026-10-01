"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon, FilterIcon } from "@/modules/shared/Icons";
import LordIcon from "@/modules/shared/LordIcon";

export default function StageCombobox({
  stages = [],
  selectedStage = "ALL",
  onSelectStage,
  stageCounts = {},
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

  const currentStage = stages.find((st) => st.id === selectedStage) || stages[0] || {
    id: "ALL",
    label: "All Stages",
    iconSrc: "https://cdn.lordicon.com/gqdnbnwt.json",
    colors: "primary:#f59e0b,secondary:#64748b",
  };
  const currentCount = selectedStage === "ALL" ? totalCount : (stageCounts[selectedStage] ?? 0);

  const filteredStages = stages.filter((st) =>
    st.label.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="relative shrink-0 select-none" ref={dropdownRef}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setFilterQuery("");
        }}
        className={`group flex items-center justify-between gap-3 px-3.5 py-2 h-[40px] rounded-[4px] text-xs font-mono border transition-colors cursor-pointer shadow-xs ${
          isOpen
            ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-neutral-950 dark:text-white ring-1 ring-amber-500/20"
            : selectedStage !== "ALL"
            ? "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 text-neutral-900 dark:text-neutral-100 hover:border-amber-500"
            : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-neutral-950 dark:hover:text-white"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Lordicon for Current Stage */}
          {currentStage.iconSrc ? (
              <LordIcon
                src={currentStage.iconSrc}
                size={18}
                trigger="hover"
                colors={currentStage.colors || "primary:#f59e0b,secondary:#64748b"}
              />
            ) : (
              <FilterIcon className="w-4 h-4 text-amber-500 shrink-0" />
            )}
          

          {/* Selected Stage Pill & Status */}
          <div className="flex items-center gap-1.5 truncate text-left">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-wider hidden sm:inline">
              Stage:
            </span>
            <span
              className={`font-bold tracking-tight uppercase truncate ${
                selectedStage !== "ALL"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-800 dark:text-neutral-200"
              }`}
            >
              {currentStage.label}
            </span>
          </div>
        </div>

        {/* Right Badge count & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold transition-colors ${
              selectedStage !== "ALL"
                ? "bg-amber-500 text-neutral-950 shadow-xs"
                : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {currentCount}
          </span>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-amber-500" : "group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xl z-50 overflow-hidden">
          {/* Dropdown Header with Animated Lordicon & Quick Search */}
          <div className="p-3.5 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <LordIcon
                    src="https://cdn.lordicon.com/msoeawqm.json"
                    size={16}
                    trigger="hover"
                    colors="primary:#d97706,secondary:#0284c7"
                  />
                
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Filter Workflow Stage
                </span>
              </div>
              {selectedStage !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectStage("ALL");
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors"
                >
                  Reset to All
                </button>
              )}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Find stage (e.g. review, quotation, approved)..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-[4px] text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Stages */}
          <div className="p-2 max-h-72 overflow-y-auto space-y-1">
            {filteredStages.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-neutral-400 flex flex-col items-center gap-2">
                <LordIcon
                  src="https://cdn.lordicon.com/msoeawqm.json"
                  size={32}
                  trigger="loop"
                  colors="primary:#94a3b8,secondary:#cbd5e1"
                />
                <span>No matching workflow stage</span>
              </div>
            ) : (
              filteredStages.map((st) => {
                const isSelected = selectedStage === st.id;
                const count = st.id === "ALL" ? totalCount : (stageCounts[st.id] ?? 0);

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onSelectStage(st.id);
                      setIsOpen(false);
                    }}
                    className={`w-full group flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                        : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Pure Icon for Each Stage - No background box */}
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {st.iconSrc ? (
                          <LordIcon
                            src={st.iconSrc}
                            size={18}
                            trigger="hover"
                            colors={
                              isSelected
                                ? "primary:#0a0a0a,secondary:#171717"
                                : st.colors || "primary:#f59e0b,secondary:#64748b"
                            }
                          />
                        ) : (
                          <FilterIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                      </div>

                      {/* Stage Name */}
                      <div className="truncate">
                        <span className="text-xs font-mono uppercase truncate block">
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Count pill + Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold transition-colors ${
                          isSelected
                            ? "bg-neutral-950 text-white"
                            : count > 0
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            : "bg-neutral-100 dark:bg-white/5 text-neutral-400"
                        }`}
                      >
                        {count}
                      </span>
                      {isSelected ? (
                        <CheckIcon className="w-4 h-4 text-neutral-950 stroke-[3]" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count summary */}
          <div className="px-3.5 py-2.5 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/60 dark:bg-white/[0.02] flex items-center justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
            <span>Workflow Stages: {stages.length}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {totalCount} Total Inquiries
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

