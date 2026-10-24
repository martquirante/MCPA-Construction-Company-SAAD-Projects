"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  ShieldCheck,
  Share2,
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";
import WrappedStoryExperience from "@/modules/wrapped/WrappedStoryExperience";

export default function PublicWrappedPage() {
  const params = useParams();
  const token = params?.token;
  const [wrapped, setWrapped] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageTheme, setPageTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    if (!token) return;
    async function fetchPublicWrapped() {
      try {
        const res = await fetch(`/api/wrapped/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.success && data.wrapped) {
          setWrapped(data.wrapped);
        } else {
          setError(data.message || "This project recap is not available or is set to private.");
        }
      } catch (e) {
        console.error("Fetch wrapped error:", e);
        setError("Failed to connect to MCPA Architectural Registry.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicWrapped();
  }, [token]);

  const togglePageTheme = () => {
    const nextTheme = pageTheme === "dark" ? "light" : "dark";
    setPageTheme(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const isDark = pageTheme === "dark";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center p-6 text-white font-mono">
        <LordIcon
          src="https://cdn.lordicon.com/lupuorrc.json"
          size={84}
          trigger="loop"
          colors="primary:#f59e0b,secondary:#e2e8f0"
        />
        <div className="text-xs font-bold uppercase mt-4 tracking-widest text-amber-400 animate-pulse">
          Opening MCPA Architectural Monograph...
        </div>
      </div>
    );
  }

  if (error || !wrapped) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center p-6 text-white font-mono text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold uppercase tracking-tight">Monograph Not Available</h1>
          <p className="text-xs text-neutral-400 font-sans max-w-sm">
            {error || "This recap link may have expired or is set to private by the project owner."}
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase text-xs tracking-wider transition-colors"
        >
          Return to MCPA Showcase
        </Link>
      </div>
    );
  }

  const payload = wrapped.wrapped_payload || {
    projectTitle: wrapped.project_title || "Residential Build",
    projectCode: wrapped.project_code || "MCPA-REC",
    location: wrapped.target_location || "Philippines",
    archetype: {
      name: "The Visionary Estate",
      tagline: "Precision Engineered Handover",
      accent: "#f59e0b",
      description: "An exemplar of turnkey execution with bespoke finishes.",
    },
    chapters: [],
    photos: { early: [], middle: [], turnover: [] },
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${
        isDark ? "bg-[#080a0e] text-white" : "bg-[#f8f7f5] text-neutral-900"
      }`}
    >
      {/* Top Precision Header Bar */}
      <header
        className={`w-full border-b sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between transition-colors ${
          isDark
            ? "border-white/10 bg-[#080a0e]/90"
            : "border-neutral-200 bg-white/90"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[4px] bg-amber-500 text-neutral-950 font-mono font-extrabold text-sm flex items-center justify-center transition-transform group-hover:scale-105">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-wider uppercase">
                MCPA Architectural
              </span>
              <span className="text-[9px] font-mono text-neutral-500 uppercase">
                Project Monograph · Public Recap
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={togglePageTheme}
            className={`p-2 rounded-[4px] border transition-colors cursor-pointer ${
              isDark
                ? "border-white/15 bg-white/5 text-neutral-300 hover:text-white"
                : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:text-black"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Theme`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-800" />}
          </button>

          <Link
            href="/portal?mode=signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Build with MCPA</span>
          </Link>
        </div>
      </header>

      {/* Main 12-Chapter Wrapped Story Experience */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 w-full max-w-5xl mx-auto">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <WrappedStoryExperience
            payload={payload}
            initialTheme={pageTheme}
            mode="public"
            shareToken={token}
          />
        </div>
      </main>

      {/* Public Footer CTA */}
      <footer
        className={`w-full border-t py-8 px-4 sm:px-8 mt-auto text-center transition-colors ${
          isDark
            ? "border-white/10 bg-[#06080b] text-neutral-400"
            : "border-neutral-200 bg-neutral-50 text-neutral-600"
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Engineered by MCPA Construction & Supply</span>
          </div>

          <p className="text-xs font-sans leading-relaxed">
            Every home in the MCPA Architectural Monograph undergoes end-to-end milestone supervision, cloud photo logging, and Article 1723 structural engineering standards.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/portal?mode=signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Start Your Project Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 pt-4">
            MCPA ARCHITECTURAL SYSTEM · PHILIPPINES · EST. 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
