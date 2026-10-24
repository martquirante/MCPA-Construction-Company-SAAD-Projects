"use client";

import LordIcon from "@/modules/shared/LordIcon";
import LottieIcon from "@/modules/shared/LottieIcon";

export default function AdminEmptyState({
  iconSrc = "https://cdn.lordicon.com/msoeawqm.json",
  lottieSrc = null,
  animationData = null,
  fallback: FallbackIcon = null,
  badgeText = "No Records Found",
  title = "No inquiries found",
  description = "Try adjusting your search query or switching stage filters to find what you are looking for.",
  actionButton = null,
  size = 80,
  className = "",
  colors = "primary:#d97706,secondary:#0284c7",
  compact = false,
  variant = "dashed", // "dashed" | "card"
}) {
  const hasLottie = Boolean(lottieSrc || animationData);

  const containerBase =
    variant === "card"
      ? "rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs"
      : "rounded-[6px] border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/[0.02]";

  return (
    <div
      className={`relative overflow-hidden text-center flex flex-col items-center justify-center ${containerBase} ${
        compact ? "p-6 sm:p-8" : "p-10 sm:p-14"
      } ${className}`}
    >
      {/* Animated Icon (Lordicon CDN API or Lottie) with Ambient Glow */}
      <div className="relative mb-4 flex items-center justify-center">
        {/* Soft Ambient Aura / Glow behind the enlarged icon */}
        <div
          className="absolute rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-2xl -z-10 pointer-events-none animate-pulse"
          style={{
            width: `${Math.max(size, 80) * 1.25}px`,
            height: `${Math.max(size, 80) * 1.25}px`,
          }}
        />
        {hasLottie ? (
          <LottieIcon
            src={lottieSrc || animationData}
            className={compact ? "w-16 h-16" : "w-20 h-20 sm:w-24 sm:h-24"}
            fallback={
              FallbackIcon ? (
                <FallbackIcon className="w-8 h-8 text-neutral-400 dark:text-neutral-500 animate-pulse" />
              ) : null
            }
          />
        ) : (
          <LordIcon
            src={iconSrc}
            size={size}
            trigger="loop"
            colors={colors}
            fallback={FallbackIcon}
          />
        )}
      </div>

      {/* Badge */}
      {badgeText && (
        <span className="inline-block mb-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
          {badgeText}
        </span>
      )}

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight font-mono uppercase">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
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
