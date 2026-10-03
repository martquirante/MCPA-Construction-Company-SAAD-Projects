"use client";

import { CameraIcon } from "./Icons";

/**
 * Low-level composable skeleton box with blur-shimmer wave
 */
export function SkeletonBase({ className = "", style = {}, children }) {
  return (
    <div
      style={style}
      className={`skeleton-shimmer rounded-[4px] select-none ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * High-fidelity Skeleton Card matching ProjectsTab.jsx card geometry
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/[0.08] rounded-[6px] overflow-hidden shadow-xs flex flex-col pointer-events-none select-none">
      {/* 1. Cover Image Block */}
      <div className="h-44 w-full skeleton-shimmer relative overflow-hidden flex items-center justify-center bg-neutral-200/50 dark:bg-neutral-800/50">
        {/* Floating Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <div className="h-5 w-28 rounded-[4px] bg-neutral-300/70 dark:bg-white/10" />
          <div className="h-4 w-20 rounded-[4px] bg-neutral-300/50 dark:bg-white/5" />
        </div>

        {/* Floating Top Right Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <div className="h-5 w-20 rounded-[4px] bg-neutral-300/70 dark:bg-white/10" />
          <div className="h-5 w-16 rounded-[4px] bg-neutral-300/70 dark:bg-white/10" />
        </div>

        {/* Center camera placeholder glyph */}
        <div className="w-10 h-10 rounded-full bg-neutral-300/40 dark:bg-white/5 flex items-center justify-center">
          <CameraIcon className="w-5 h-5 text-neutral-400/40 dark:text-white/20" />
        </div>
      </div>

      {/* 2. Card Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Project Title */}
          <div className="h-5 w-3/4 rounded-[4px] skeleton-shimmer mb-2.5 bg-neutral-200/80 dark:bg-white/10" />

          {/* Area Specs Pill */}
          <div className="h-3.5 w-1/3 rounded-[4px] skeleton-shimmer mb-3.5 bg-neutral-200/60 dark:bg-white/[0.07]" />

          {/* Description Snippet (2 lines) */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
            <div className="h-3 w-4/5 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
          </div>
        </div>

        {/* 3. Card Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
          <div className="h-3 w-28 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-12 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
            <div className="h-6 w-6 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of 6 Project Card Skeletons with Header and Filter Placeholders
 */
export function ProjectsGridSkeleton({ count = 6 }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Filter and Search Bar Skeletons */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <div className="h-7 w-12 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
          <div className="h-7 w-24 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
          <div className="h-7 w-24 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
        </div>

        {/* Search Bar Input */}
        <div className="h-9 w-full sm:w-64 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <ProjectCardSkeleton key={`proj-skel-${idx}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Inquiry Pipeline Table Skeleton matching InquiryPipelineTab.jsx
 */
export function InquiryTableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none pointer-events-none">
      {/* 1. Stage Filter Buttons Bar */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {[80, 110, 105, 125, 100, 115, 130].map((w, i) => (
          <div
            key={`stage-skel-${i}`}
            style={{ width: `${w}px` }}
            className="h-7 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/[0.08]"
          />
        ))}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 h-10 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
        <div className="w-full sm:w-48 h-10 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
      </div>

      {/* 3. Table Skeleton Container */}
      <div className="bg-white dark:bg-[#10121a] border border-neutral-200 dark:border-white/[0.08] rounded-[6px] overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="border-b border-neutral-200 dark:border-white/[0.08] px-4 py-3 bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="h-4 w-32 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
          <div className="h-4 w-24 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-neutral-100 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={`inq-row-skel-${idx}`}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left: Avatar + Client Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-[4px] skeleton-shimmer bg-neutral-300/70 dark:bg-white/10 shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="h-4 w-40 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
                  <div className="h-3 w-56 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
                </div>
              </div>

              {/* Middle: Stage & Category Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-5 w-24 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
                <div className="h-5 w-20 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
              </div>

              {/* Right: Date & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-3 w-20 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
                <div className="h-7 w-20 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Overview Skeleton matching DashboardTab.jsx
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 select-none pointer-events-none">
      {/* Title */}
      <div>
        <div className="h-6 w-48 rounded-[4px] skeleton-shimmer mb-1 bg-neutral-200/80 dark:bg-white/10" />
        <div className="h-3 w-72 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
      </div>

      {/* 4 Perspective Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`metric-skel-${idx}`}
            className="p-5 rounded-[6px] bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
              <div className="w-7 h-7 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
            </div>
            <div>
              <div className="h-7 w-16 rounded-[4px] skeleton-shimmer mb-1.5 bg-neutral-300/80 dark:bg-white/20" />
              <div className="h-2.5 w-28 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Split: Meetings & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Scheduled Meetings */}
        <div className="bg-white dark:bg-[#10121a] border border-neutral-200 dark:border-white/[0.08] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <div className="h-4 w-36 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
            <div className="h-4 w-12 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`meet-skel-${i}`} className="p-3 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
                  <div className="h-2.5 w-40 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
                </div>
                <div className="h-6 w-20 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white dark:bg-[#10121a] border border-neutral-200 dark:border-white/[0.08] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <div className="h-4 w-32 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
            <div className="h-4 w-16 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`act-skel-${i}`} className="p-3 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[4px] skeleton-shimmer bg-neutral-300/70 dark:bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
                    <div className="h-2.5 w-36 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
                  </div>
                </div>
                <div className="h-4 w-16 rounded-[4px] skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Public Client Showcase Portfolio Skeleton for PortfolioSection.jsx
 */
export function PortfolioGridSkeleton({ count = 3 }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 select-none pointer-events-none">
      {/* Category Pills Bar */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
        {[50, 90, 95, 100].map((w, i) => (
          <div
            key={`pub-cat-skel-${i}`}
            style={{ width: `${w}px` }}
            className="h-8 rounded-[4px] skeleton-shimmer bg-neutral-200/70 dark:bg-white/10"
          />
        ))}
      </div>

      {/* Showcase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`pub-card-skel-${idx}`}
            className="rounded-[6px] overflow-hidden bg-white dark:bg-[#12141a] border border-neutral-200/80 dark:border-white/[0.08] shadow-sm flex flex-col"
          >
            {/* Aspect Ratio Image Shimmer */}
            <div className="aspect-[16/10] w-full skeleton-shimmer bg-neutral-200/60 dark:bg-white/[0.06] relative" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-4/5 rounded-[4px] skeleton-shimmer bg-neutral-200/80 dark:bg-white/10" />
              <div className="h-3 w-1/3 rounded-[4px] skeleton-shimmer bg-neutral-200/50 dark:bg-white/[0.05]" />
              <div className="h-3 w-full rounded-[4px] skeleton-shimmer bg-neutral-200/40 dark:bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
