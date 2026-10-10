"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Trophy,
  Share2,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HardHat,
  Copy,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  FileText,
  Compass,
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";
import { authFetch } from "@/modules/shared/authFetch";

export default function PortalPhase5Wrapped({
  activeProject,
  currentUser,
  showToast,
  onStartInquiry,
}) {
  const projectId = activeProject?.client_project_id;
  const [wrapped, setWrapped] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  // Load Wrapped data from DB
  useEffect(() => {
    if (!projectId) return;
    async function fetchWrapped() {
      try {
        const res = await authFetch(`/api/projects/${projectId}/wrapped`);
        const data = await res.json();
        if (data.success && data.wrapped) {
          setWrapped(data.wrapped);
        }
      } catch (e) {
        console.warn("Failed to load project wrapped:", e);
      }
    }
    fetchWrapped();
  }, [projectId]);

  const storyCards = wrapped?.story_cards || [
    {
      headline: "From Raw Earth to Turnkey Masterpiece",
      subtext: `Your ${activeProject?.project_title || "Residential Build"} was brought to reality with absolute architectural integrity.`,
      metric: "100%",
      metricLabel: "Turnkey Completed",
    },
    {
      headline: "185 Days of Meticulous Engineering",
      subtext: "Through all weather and site inspections, our master craftsmen delivered on schedule.",
      metric: `${wrapped?.total_days_duration || 185} Days`,
      metricLabel: "Total Build Duration",
    },
    {
      headline: "Built with Precision & Strength",
      subtext: `Consuming over ${wrapped?.total_concrete_bags || 850} bags of high-strength cement and ${wrapped?.total_steel_kg || 4200} kg of reinforced steel bars.`,
      metric: `${wrapped?.total_workers_employed || 24} Workers`,
      metricLabel: "Skilled Craftsmen Deployed",
    },
  ];

  const shareToken = wrapped?.share_token || "mcpa-wrapped-2026";
  const publicShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/wrapped/${shareToken}`
    : `/wrapped/${shareToken}`;

  const copyShareLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicShareUrl);
      showToast("Public Wrapped recap link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. CELEBRATION HEADER BANNER */}
      <div className="relative overflow-hidden rounded-[8px] border border-amber-500/40 bg-linear-to-b from-amber-500/20 via-neutral-900 to-neutral-950 p-6 sm:p-10 shadow-2xl text-white">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Project Turnover Complete · Phase 5 Celebration</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-mono uppercase tracking-tight">
              Congratulations! Your Home is Complete.
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
              Every foundation footing, structural column, and bespoke finish of <span className="font-bold text-amber-400">{activeProject?.project_title}</span> has passed 100% quality commissioning. Your digital warranty certificates and Project Wrapped are ready.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
              <button
                type="button"
                onClick={copyShareLink}
                className="px-5 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                Share Project Wrapped
              </button>

              <button
                type="button"
                onClick={onStartInquiry}
                className="px-5 py-2.5 rounded-[4px] bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Start Another Project
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-[8px] bg-white/5 border border-white/10 shrink-0 text-center">
            <LordIcon
              src="https://cdn.lordicon.com/lupuorrc.json"
              size={96}
              trigger="loop"
              colors="primary:#f59e0b,secondary:#e2e8f0"
            />
            <span className="text-[11px] font-mono text-amber-400 mt-2 uppercase tracking-widest font-bold">
              100% Commissioned
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Turnkey Warranty Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPOTIFY-WRAPPED STYLE INTERACTIVE STORY RECAP CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              MCPA Project Wrapped Experience
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              A stylized breakdown of your building journey, crafted for personal milestone records and public sharing.
            </p>
          </div>
          <button
            type="button"
            onClick={copyShareLink}
            className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1.5 self-start sm:self-auto font-bold"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Public Link
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storyCards.map((card, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-[8px] border border-amber-500/20 bg-linear-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 text-white shadow-lg flex flex-col justify-between space-y-6 overflow-hidden group hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  MILESTONE STORY 0{idx + 1}
                </span>
                <h3 className="text-base font-bold font-mono uppercase text-white leading-snug">
                  {card.headline}
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  {card.subtext}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
                  {card.metric}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">
                  {card.metricLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. BEFORE & AFTER INTERACTIVE PHOTO SLIDER */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
        <div>
          <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" />
            Site Evolution: Before & After Split Slider
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            Slide horizontally to witness the transformation from initial lot groundbreaking to completed architectural turnover.
          </p>
        </div>

        {/* Slider Canvas */}
        <div className="relative w-full h-80 sm:h-[420px] rounded-[6px] overflow-hidden select-none bg-neutral-950">
          {/* AFTER PHOTO (Background full) */}
          <img
            src={wrapped?.after_photo_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
            alt="Completed Project After"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* BEFORE PHOTO (Clipped by slider percentage) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={wrapped?.before_photo_url || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=1200&q=80"}
              alt="Raw Ground Lot Before"
              className="absolute inset-y-0 left-0 max-w-none h-full object-cover"
              style={{ width: "100%", minWidth: "800px" }}
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-[3px] bg-neutral-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase border border-white/20">
              Groundbreaking 2026 (Before)
            </div>
          </div>

          <div className="absolute top-4 right-4 px-3 py-1 rounded-[3px] bg-neutral-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 uppercase border border-amber-500/40">
            Turnkey Completed (After)
          </div>

          {/* Draggable Slider Bar */}
          <div
            className="absolute inset-y-0 w-1 bg-amber-500 shadow-2xl pointer-events-none z-20 flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center justify-center shadow-xl border-2 border-neutral-950">
              ↔
            </div>
          </div>

          {/* Native Slider input over the canvas */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
        </div>
      </div>

      {/* 4. DIGITAL HANDOVER VAULT (WARRANTY & AS-BUILT MANUALS) */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
        <div>
          <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Digital Handover Vault (Permanent Warranty & As-Built Plans)
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            Download your formal warranty certificates and building maintenance manuals for lifetime coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-bold">15-Year Structural</span>
              <h4 className="font-bold text-neutral-900 dark:text-white mt-0.5">
                Structural Integrity Warranty Certificate
              </h4>
              <p className="text-[11px] font-sans text-neutral-500 mt-1">
                Covers concrete core, reinforced columns, and foundational footings.
              </p>
            </div>
            <a
              href="/api/legal/pdf/handover-warranty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Certificate (PDF)
            </a>
          </div>

          <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-amber-500 uppercase font-bold">5-Year Waterproofing</span>
              <h4 className="font-bold text-neutral-900 dark:text-white mt-0.5">
                Roof Deck & Bathroom Seal Guarantee
              </h4>
              <p className="text-[11px] font-sans text-neutral-500 mt-1">
                Polyurethane membrane guarantee with annual complimentary inspection.
              </p>
            </div>
            <a
              href="/api/legal/pdf/handover-waterproofing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Certificate (PDF)
            </a>
          </div>

          <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-sky-500 uppercase font-bold">Homeowner Manual</span>
              <h4 className="font-bold text-neutral-900 dark:text-white mt-0.5">
                Complete As-Built MEP & Finishes Guide
              </h4>
              <p className="text-[11px] font-sans text-neutral-500 mt-1">
                Concealed electrical lines, plumbing valve maps, and paint codes.
              </p>
            </div>
            <a
              href="/api/legal/pdf/handover-maintenance-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Manual (PDF)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
