"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import {
  ShieldCheckIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  LockIcon,
  CheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  SparkleBadgeIcon,
  UserIcon,
} from "@/modules/shared/Icons";

export default function ClientPortalPage() {
  const [projectCode, setProjectCode] = useState("MCPA-PLR-2024");
  const [activeTab, setActiveTab] = useState("milestones");

  // Sample client demo project for live progress demonstration
  const clientProject = {
    code: "MCPA-PLR-2024",
    name: "The Meridian Modern Residence",
    client: "Engr. & Mrs. Dela Cruz",
    location: "Tabang, Plaridel, Bulacan",
    contractDate: "January 15, 2024",
    targetTurnover: "November 2024",
    leadEngineer: "Engr. Raymart Quirante, CE (PRC Lic. #018492)",
    progressPct: 65,
    currentPhase: "Phase 3: Structural Masonry & Second Level Pouring",
    milestones: [
      {
        phase: "Phase 1",
        title: "Site Profiling, Geodetic Scan & Soil Testing",
        status: "Completed",
        date: "Feb 02, 2024",
        notes: "Soil bearing capacity verified at qa = 180 kPa. Footing depth confirmed at 1.80m.",
      },
      {
        phase: "Phase 2",
        title: "Signed & Sealed Blueprints & LGU Permitting",
        status: "Completed",
        date: "Mar 10, 2024",
        notes: "Plaridel LGU Building Permit granted. Full PRC signed & sealed BIM package released.",
      },
      {
        phase: "Phase 3",
        title: "Structural Columns, Grade 60 Rebar & Slab Pouring",
        status: "In Progress",
        date: "Current Phase",
        notes: "Grade 60 steel rebars tied and inspected. 3000 PSI ready-mix cylinder tests passed.",
      },
      {
        phase: "Phase 4",
        title: "Architectural Finishes, Punchlist & Handover",
        status: "Upcoming",
        date: "Target: Oct - Nov 2024",
        notes: "Glazing, high-end tile laying, sanitary fixtures, and LGU Certificate of Occupancy.",
      },
    ],
    photoLogs: [
      {
        id: 1,
        title: "Second Floor Slab Rebar Inspection & Formwork",
        date: "September 10, 2024",
        inspector: "Site Lead Engineer",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&h=500&fit=crop&auto=format",
        caption: "Verified spacing of 16mm Grade 60 top bars with 25mm concrete cover blocks in place.",
      },
      {
        id: 2,
        title: "Ground Floor Column Pouring & Curing Monitoring",
        date: "August 28, 2024",
        inspector: "Materials Quality Inspector",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=500&fit=crop&auto=format",
        caption: "3000 PSI ready-mix mechanical vibrator consolidation complete; moist curing maintained.",
      },
      {
        id: 3,
        title: "Foundation Footing & Grade Beam Steel Framing",
        date: "July 14, 2024",
        inspector: "Structural Engineer",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop&auto=format",
        caption: "Footing tie beams inspected prior to concrete pour. Zero water pooling verified.",
      },
    ],
    documents: [
      { name: "Approved Architectural Set (A-01 to A-14)", type: "PDF Blueprint", size: "18.4 MB", date: "Mar 2024" },
      { name: "Seismic Zone 4 Structural Calculations Report", type: "Engineering Calc", size: "8.2 MB", date: "Mar 2024" },
      { name: "Plaridel LGU Building Permit Clearance", type: "Municipal Doc", size: "3.1 MB", date: "Mar 2024" },
      { name: "28-Day Concrete Cylinder Compressive Test Results", type: "Lab Certificate", size: "1.5 MB", date: "Aug 2024" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-500">
      {/* Top Sticky Navigation */}
      <ClientNavbar isCompleted={true} />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 md:pt-32 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-amber-500 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Client Portal</span>
          </nav>
        </div>

        {/* Page Hero Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                <span>Live Client Project Tracking · 100% Transparency</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white uppercase">
                Client Project Portal
              </h1>
              <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed font-normal">
                Track your ongoing home or commercial build in real-time. View certified engineering inspection logs, weekly photographic progress, approved blueprints, and verified milestone schedules.
              </p>
            </div>

            {/* Project Code Search / Verification Box */}
            <div className="w-full md:w-auto min-w-[280px] sm:min-w-[340px] bg-white dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Project Reference ID
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LockIcon className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="e.g. MCPA-PLR-2024"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Project Overview Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-semibold">
                    {clientProject.code}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Site Execution</span>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
                  {clientProject.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{clientProject.location}</span>
                  <span>•</span>
                  <span>Owner: {clientProject.client}</span>
                </p>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="lg:text-right min-w-[240px]">
                <div className="flex items-baseline justify-between lg:justify-end gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                    Overall Build Progress
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
                    {clientProject.progressPct}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${clientProject.progressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
                  {clientProject.currentPhase}
                </p>
              </div>
            </div>

            {/* Engineer On Record & Site Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase tracking-wider font-medium">
                  Supervising Engineer
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                  {clientProject.leadEngineer}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase tracking-wider font-medium">
                  Construction Commenced
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                  {clientProject.contractDate}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase tracking-wider font-medium">
                  Estimated Handover
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                  {clientProject.targetTurnover}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("milestones")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeTab === "milestones"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              Milestone Timeline
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeTab === "photos"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              Live Photo Logs ({clientProject.photoLogs.length})
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeTab === "documents"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              Blueprints & Documents ({clientProject.documents.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Milestone Timeline */}
        {activeTab === "milestones" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {clientProject.milestones.map((ms, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        ms.status === "Completed"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                          : ms.status === "In Progress"
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-500"
                          : "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {ms.status === "Completed" ? (
                        <CheckIcon className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <span className="font-mono text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                          {ms.phase}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            ms.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : ms.status === "In Progress"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          {ms.status}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">
                        {ms.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                        {ms.notes}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-mono text-neutral-500 block">
                      {ms.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Photo Logs */}
        {activeTab === "photos" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clientProject.photoLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-3xl overflow-hidden bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-neutral-900">
                    <Image
                      src={log.image}
                      alt={log.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                      {log.date}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white mb-2">
                        {log.title}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {log.caption}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Verified: {log.inspector}</span>
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5" /> Sign-Off
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Blueprints & Documents */}
        {activeTab === "documents" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl p-6 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800">
              {clientProject.documents.map((doc, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {doc.type} • {doc.size} • Issued {doc.date}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Engineer Support Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="rounded-3xl p-6 sm:p-8 bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block">
                  Dedicated Site Contact
                </span>
                <h3 className="text-base sm:text-lg font-bold">
                  Questions about today&apos;s site logs or next concrete pour?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Reach your assigned MCPA Civil Engineer directly on Viber or phone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="viber://chat?number=%2B639497758239"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Viber Group
              </a>
              <a
                href="tel:09497758239"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Call Engineer
              </a>
            </div>
          </div>
        </div>

        {/* Admin Link at the very bottom */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center text-xs text-neutral-500">
          <span>Are you an authorized MCPA project manager or contractor? </span>
          <Link href="/admin" className="text-amber-600 dark:text-amber-400 hover:underline font-semibold ml-1">
            Switch to Admin Management Portal &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
