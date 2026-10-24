"use client";

import React from "react";
import LottieIcon from "@/modules/shared/LottieIcon";
import { CalendarCheck, CreditCard, Construction, FolderOpen, MessageSquare } from "lucide-react";
import {
  BillingEmptyIllustration,
  MilestonesEmptyIllustration,
  ConstructionEmptyIllustration,
  GalleryEmptyIllustration,
  InquiriesEmptyIllustration,
} from "./PortalEmptyIllustrations";

const BESPOKE_ILLUSTRATIONS = {
  billing: BillingEmptyIllustration,
  milestones: MilestonesEmptyIllustration,
  construction: ConstructionEmptyIllustration,
  gallery: GalleryEmptyIllustration,
  messages: InquiriesEmptyIllustration,
  inquiries: InquiriesEmptyIllustration,
};

const FALLBACK_ICON_MAP = {
  construction: Construction,
  milestones: CalendarCheck,
  gallery: FolderOpen,
  billing: CreditCard,
  messages: MessageSquare,
};

const LABEL_MAP = {
  construction: "Construction activity",
  milestones: "Construction milestones",
  gallery: "Project gallery",
  billing: "Billing and escrow",
  messages: "Project messages",
};

/**
 * PortalEmptyState
 * Powered by bespoke animated architectural & construction illustrations,
 * with complete theme support and clean micro-typography.
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
  const FallbackIcon = FALLBACK_ICON_MAP[type] || Construction;
  const animationLabel = LABEL_MAP[type] || "Project information";
  const BespokeComponent = BESPOKE_ILLUSTRATIONS[type] || ConstructionEmptyIllustration;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-dashed border-neutral-300 dark:border-white/10 bg-white dark:bg-[#101218] p-6 sm:p-10 text-center transition-all duration-300 ${className}`}
    >
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md mx-auto">
        {/* Animated Construction & Engineering Illustration (Prominent & Relevant) */}
        <div className="mb-2">
          <div role="img" aria-label={`${animationLabel} empty state`}>
            {src || animationData ? (
              <LottieIcon
                src={src || animationData}
                className={iconClassName}
                fallback={<FallbackIcon className="w-16 h-16 text-amber-500" aria-hidden="true" />}
              />
            ) : (
              <BespokeComponent className={iconClassName} />
            )}
          </div>
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

        {/* Action Buttons */}
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
