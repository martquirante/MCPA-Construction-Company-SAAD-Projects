"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function PortalPhase1PreInquiry({
  currentUser,
  onStartInquiry,
  onRequestMultiProject,
  isMultiProjectBlocked = false,
}) {
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Fetch real portfolio from DB (No dummy data!)
  useEffect(() => {
    let isMounted = true;
    async function fetchProjects() {
      setIsLoadingPortfolio(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.projects)) {
          // Filter projects that are visible on web
          setPortfolioProjects(data.projects.filter((p) => p.is_web_visible !== false));
        }
      } catch (err) {
        console.error("Failed to load portfolio showcase:", err);
      } finally {
        if (isMounted) setIsLoadingPortfolio(false);
      }
    }
    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. HERO ONBOARDING SECTION (CLEAN, ADAPTIVE LIGHT & DARK THEME) */}
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-6 sm:p-10 shadow-xs dark:shadow-none space-y-6 transition-colors">
        {/* Subtle decorative architectural glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MCPA Official Vector Logo (Adapts to light & dark theme) */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/assets/mcpa-logo.svg"
            alt="MCPA Architectural Design & Construction"
            width={180}
            height={46}
            unoptimized
            className="block dark:hidden object-contain h-9 sm:h-10 w-auto"
            priority
          />
          <Image
            src="/assets/logo-white.svg"
            alt="MCPA Architectural Design & Construction"
            width={180}
            height={46}
            unoptimized
            className="hidden dark:block object-contain h-9 sm:h-10 w-auto"
            priority
          />
        </div>


        {/* Heading & Welcome Copy */}
        <div className="relative z-10 max-w-3xl space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono uppercase leading-tight">
            Ready to Build Your Architectural Vision?
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl">
            Welcome, <span className="font-bold text-amber-600 dark:text-amber-400">{currentUser?.fullName || currentUser?.full_name || "Valued Client"}</span>. 
            Your client portal tracks your construction project from concept blueprints down to actual turnkey handover. To initiate your project timeline, submit your verified architectural inquiry below.
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-2 flex flex-wrap items-center gap-4">
          {isMultiProjectBlocked ? (
            <button
              type="button"
              onClick={onRequestMultiProject}
              className="px-6 py-3.5 rounded-[6px] bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Request Multi-Project Approval
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartInquiry}
              className="px-6 py-3.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Start Your Project Inquiry
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. SHOWCASE GALLERY (FROM REAL DB TABLE `projects`) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold font-mono text-neutral-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              Completed MCPA Showcase Works
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Authentic completed projects delivered across the Philippines. Fetched live from our master portfolio.
            </p>
          </div>
        </div>

        {isLoadingPortfolio ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[8px] bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : portfolioProjects.length === 0 ? (
          <div className="p-12 text-center rounded-[8px] border border-dashed border-neutral-300 dark:border-neutral-800 text-xs font-mono text-neutral-400">
            No portfolio projects published yet in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioProjects.slice(0, 6).map((proj) => {
              const primaryImg =
                Array.isArray(proj.images) && proj.images.length > 0
                  ? proj.images[0]
                  : "/assets/images/hero-bg.jpg";

              return (
                <div
                  key={proj.project_id}
                  className="group rounded-[8px] overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-amber-500/50 hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-neutral-950">
                    <img
                      src={primaryImg}
                      alt={proj.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[3px] bg-neutral-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30 uppercase">
                      {proj.category || "Residential"}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase tracking-tight line-clamp-1">
                        {proj.name}
                      </h3>
                      {proj.location && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{proj.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      <span>Floor: {proj.floor_area || "N/A"}</span>
                      <span className="text-amber-500 font-bold uppercase">
                        {proj.status || "Completed"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
