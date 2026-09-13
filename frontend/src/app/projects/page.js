"use client";

import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import PortfolioSection from "@/modules/home/components/PortfolioSection";
import Footer from "@/modules/shared/Footer";
import { ArrowRightIcon } from "@/modules/shared/Icons";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-500">
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

        {/* Portfolio Showcase Grid & Filter Pills */}
        <PortfolioSection />

        {/* Consultation Call To Action Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 dark:bg-neutral-900/90 border border-neutral-800 p-8 sm:p-12 text-center text-white shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none" />
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              Turnkey Design & Build
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Have an Architectural Vision in Mind?
            </h3>
            <p className="mt-4 max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base font-normal">
              From residential luxury villas to high-span commercial logistics facilities, our licensed engineers and master builders turn blueprints into enduring legacies.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
              >
                <span>Schedule a Consultation</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-neutral-700 hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Explore Services</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Architectural Multi-Column Footer */}
      <Footer />
    </div>
  );
}
