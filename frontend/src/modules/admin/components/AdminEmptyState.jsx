"use client";

import LordIcon from "@/modules/shared/LordIcon";

export default function AdminEmptyState({
  iconSrc = "https://cdn.lordicon.com/msoeawqm.json",
  badgeText = "No Records Found",
  title = "No inquiries found",
  description = "Try adjusting your search query or switching stage filters to find what you are looking for.",
  actionButton = null,
  size = 80,
  className = "",
  colors = "primary:#d97706,secondary:#0284c7",
  compact = false,
}) {
  return (
    <div
      className={`relative overflow-hidden text-center rounded-3xl border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/[0.02] backdrop-blur-xs flex flex-col items-center justify-center ${
        compact ? "p-6 sm:p-8" : "p-10 sm:p-14"
      } ${className}`}
    >
      {/* Subtle ambient amber backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Animated Lordicon */}
      <div className="relative mb-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/25 flex items-center justify-center shadow-inner group">
          <LordIcon
            src={iconSrc}
            size={size}
            trigger="loop"
            colors={colors}
          />
        </div>
      </div>

      {/* Badge */}
      {badgeText && (
        <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
          {badgeText}
        </span>
      )}

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight font-mono uppercase">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Button / Link */}
      {actionButton && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {actionButton}
        </div>
      )}
    </div>
  );
}
