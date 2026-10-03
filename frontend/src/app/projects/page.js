"use client";

import { useEffect } from "react";
import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import PortfolioSection from "@/modules/home/components/PortfolioSection";
import Footer from "@/modules/shared/Footer";
import { ArrowRightIcon } from "@/modules/shared/Icons";
import { setReturnToCompletedHome } from "@/modules/home/homeState";

export default function ProjectsPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div className="chb-texture min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-500">
      {/* Top Sticky Navigation */}
      <ClientNavbar isCompleted={true} />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 md:pt-32 pb-16">
        {/* Page Header / Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-6">
            <Link
              href="/"
              onClick={() => setReturnToCompletedHome(true)}
              className="hover:text-amber-500 transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Projects</span>
          </nav>
        </div>

        {/* Portfolio Showcase Grid */}
        <PortfolioSection />

        {/* Consultation Call To Action Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="architectural-cta-card relative overflow-hidden rounded-[6px] bg-white dark:bg-[#10121a] border border-neutral-200/90 dark:border-white/[0.12] p-8 sm:p-12 text-center transition-all duration-300">
            {/* Top Amber Reference Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

            <div className="inline-flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-4 select-none">
              <span>Turnkey Design &amp; Build</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white leading-tight">
              Ready to construct your modern sanctuary?
            </h3>
            <p className="mt-3 text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed font-normal">
              Schedule a pre-consultation session to review lot feasibility, custom architectural floor plans, and flexible financing timelines.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-[0.08em] transition-colors shadow-[0_2px_8px_rgba(245,158,11,0.25)] cursor-pointer"
              >
                <span>Schedule a Consultation</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-[4px] border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white text-xs font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
              >
                <span>Explore Services</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

