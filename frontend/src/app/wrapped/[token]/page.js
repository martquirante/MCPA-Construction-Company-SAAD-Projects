"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  Calendar,
  Layers,
  Building2,
  Share2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";

export default function PublicWrappedPage() {
  const params = useParams();
  const token = params?.token;
  const [wrapped, setWrapped] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  useEffect(() => {
    if (!token) return;
    async function fetchPublicWrapped() {
      try {
        const res = await fetch(`/api/wrapped/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.success && data.wrapped) {
          setWrapped(data.wrapped);
        } else {
          setError(data.message || "Project recap not found or private.");
        }
      } catch (e) {
        setError("Failed to connect to MCPA Public Registry.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicWrapped();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-mono">
        <LordIcon
          src="https://cdn.lordicon.com/lupuorrc.json"
          size={80}
          trigger="loop"
          colors="primary:#f59e0b,secondary:#e2e8f0"
        />
        <div className="text-sm font-bold uppercase mt-4 text-amber-400 animate-pulse">
          Loading MCPA Architectural Wrapped...
        </div>
      </div>
    );
  }

  if (error || !wrapped) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-mono text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
          ✕
        </div>
        <h1 className="text-xl font-bold uppercase">{error || "Wrapped Story Not Found"}</h1>
        <p className="text-xs text-neutral-400 font-sans max-w-sm">
          This recap link may have expired or is set to private by the project owner.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-[4px] bg-amber-500 text-neutral-950 font-bold uppercase text-xs"
        >
          Return to MCPA Home
        </Link>
      </div>
    );
  }

  const storyCards = wrapped.story_cards || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Top Corporate Nav */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-amber-500 flex items-center justify-center text-neutral-950 font-mono font-extrabold text-sm">
            M
          </div>
          <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
            MCPA Construction & Supply
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Client Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Hero Card */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Official Commissioned Project Recap · 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono uppercase tracking-tight text-white">
            {wrapped.project_title}
          </h1>

          <p className="text-sm text-neutral-400">
            Engineered & Built by MCPA Construction & Supply · Location:{" "}
            <span className="text-white font-bold">{wrapped.target_location || "Philippines"}</span>
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storyCards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[8px] border border-white/10 bg-linear-to-b from-white/[0.04] to-transparent flex flex-col justify-between space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  CHAPTER 0{idx + 1}
                </span>
                <h3 className="text-base font-bold font-mono uppercase text-white">
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

        {/* Before and After Interactive Split Canvas */}
        <div className="p-6 rounded-[8px] border border-white/10 bg-neutral-900/40 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold font-mono uppercase text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              Before & After Site Transformation
            </h2>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              Drag Slider ↔
            </span>
          </div>

          <div className="relative w-full h-80 sm:h-[420px] rounded-[6px] overflow-hidden select-none bg-neutral-950">
            {/* AFTER PHOTO */}
            <img
              src={wrapped.after_photo_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
              alt="Completed Project After"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* BEFORE PHOTO (Clipped) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={wrapped.before_photo_url || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=1200&q=80"}
                alt="Raw Ground Lot Before"
                className="absolute inset-y-0 left-0 max-w-none h-full object-cover"
                style={{ width: "100%", minWidth: "800px" }}
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-[3px] bg-neutral-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase border border-white/20">
                Groundbreaking (Before)
              </div>
            </div>

            <div className="absolute top-4 right-4 px-3 py-1 rounded-[3px] bg-neutral-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 uppercase border border-amber-500/40">
              Turnkey Finished (After)
            </div>

            {/* Draggable Divider */}
            <div
              className="absolute inset-y-0 w-1 bg-amber-500 shadow-2xl pointer-events-none z-20 flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center justify-center shadow-xl border-2 border-neutral-950">
                ↔
              </div>
            </div>

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

        {/* Call to action for viewers */}
        <div className="p-8 rounded-[8px] border border-amber-500/30 bg-linear-to-b from-amber-500/10 to-transparent text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
            Inspired to Build Your Own Home?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto font-sans">
            Start your project consultation with MCPA Construction & Supply. Access real-time estimates and guaranteed turn-key delivery.
          </p>
          <div className="pt-2">
            <Link
              href="/portal?mode=signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-transform hover:scale-105 shadow-xl"
            >
              <Building2 className="w-4 h-4" />
              <span>Inquire Your Custom Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
