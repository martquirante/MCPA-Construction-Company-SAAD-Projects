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
      className={`relative overflow-hidden text-center rounded-[6px] border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/[0.02] flex flex-col items-center justify-center ${
        compact ? "p-6 sm:p-8" : "p-10 sm:p-14"
      } ${className}`}
    >
      {/* Animated Lordicon */}
      <div className="relative mb-4">
        <LordIcon
            src={iconSrc}
            size={size}
            trigger="loop"
            colors={colors}
          />
      </div>

      {/* Badge */}
      {badgeText && (
        <span className="inline-block mb-1 text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
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

