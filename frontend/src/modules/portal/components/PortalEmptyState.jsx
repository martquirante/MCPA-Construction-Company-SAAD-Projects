"use client";
import LottieIcon from "@/modules/shared/LottieIcon";
import constructionAnim from "@/assets/animations/construction.json";
import milestonesAnim from "@/assets/animations/milestones.json";
import galleryAnim from "@/assets/animations/gallery.json";
import billingAnim from "@/assets/animations/billing.json";
import messagesAnim from "@/assets/animations/messages.json";

const ANIM_MAP = {
  construction: constructionAnim,
  milestones: milestonesAnim,
  gallery: galleryAnim,
  billing: billingAnim,
  messages: messagesAnim,
};

/**
 * PortalEmptyState
 * Powered by official LottieFiles animations and clean typography.
 * Rule: If not a button, no background box - clean text and clean icon only.
 */
export default function PortalEmptyState({
  type = "construction",
  src = null,
  animationData = null,
  iconClassName = "w-44 h-44 sm:w-52 sm:h-52",
  badge = "Awaiting Assignment",
  title = "No Active Records",
  description = "Records will stream here once project mobilization begins.",
  actionButton = null,
  secondaryAction = null,
  className = "",
}) {
  const chosenAnim = src || animationData || ANIM_MAP[type] || constructionAnim;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-dashed border-neutral-300 dark:border-white/10 bg-white dark:bg-[#101218] p-6 sm:p-10 text-center transition-all duration-300 ${className}`}
    >
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md mx-auto">
        {/* LottieFiles Animated Icon (Enlarged and Prominent) */}
        <div className="mb-2">
          <LottieIcon
            src={chosenAnim}
            className={iconClassName}
          />
        </div>

        {/* Status Label (Clean text, no bulky background) */}
        {badge && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{badge}</span>
          </div>
        )}

        {/* Section Title */}
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight font-sans">
          {title}
        </h3>

        {/* Context Description */}
        {description && (
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md leading-relaxed">
            {description}
          </p>
        )}

        {/* Action Buttons (Only real buttons have background) */}
        {(actionButton || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
            {actionButton}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
