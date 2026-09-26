"use client";

import { useEffect } from "react";
import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import PortfolioSection from "@/modules/home/components/PortfolioSection";
import Footer from "@/modules/shared/Footer";
import { ArrowRightIcon } from "@/modules/shared/Icons";

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
            <Link href="/" className="hover:text-amber-500 transition-colors">
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
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#121622] border border-neutral-200 dark:border-white/10 p-8 sm:p-12 text-center text-neutral-900 dark:text-white shadow-xl shadow-neutral-200/50 dark:shadow-2xl transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.03] to-transparent dark:from-amber-500/15 dark:via-amber-500/5 pointer-events-none" />
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-4">
              Turnkey Design & Build
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
              Ready to construct your modern sanctuary?
            </h3>
            <p className="mt-3 text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed">
              Schedule a pre-consultation session to review lot feasibility, custom architectural floor plans, and flexible financing timelines.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer"
              >
                <span>Schedule a Consultation</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-neutral-300 dark:border-white/15 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
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
