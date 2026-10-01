"use client";

import Link from "next/link";

/**
 * MCPA Architectural Button System
 *
 * Three intentional tiers — each with a clear purpose:
 *
 *   primary   — High-priority CTA. Amber fill. One per view section max.
 *   secondary — Supporting action. Border + transparent. Peers with primary.
 *   ghost     — Low-emphasis action. No border, no fill. Text with underline reveal.
 *
 * Sizes: sm | md | lg
 * Supports: href (renders as <Link>) or onClick (renders as <button>)
 */

const SIZE = {
  sm: "px-4 py-2 text-xs font-semibold tracking-[0.06em]",
  md: "px-5 py-2.5 text-sm font-semibold tracking-[0.04em]",
  lg: "px-7 py-3.5 text-sm font-bold tracking-[0.05em]",
};

const VARIANT = {
  /**
   * Primary — Solid amber fill, near-black label.
   * Hover: slight lift via shadow, no scale theatrics.
   */
  primary:
    "bg-amber-500 text-neutral-950 " +
    "hover:bg-amber-400 " +
    "shadow-[0_2px_8px_rgba(245,158,11,0.28)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.38)] " +
    "active:bg-amber-600 active:shadow-none",

  /**
   * Secondary — Border only, text inherits context color.
   * Works on both light and dark backgrounds.
   */
  secondary:
    "bg-transparent text-current " +
    "border border-current/30 hover:border-current/60 hover:bg-current/5 " +
    "active:bg-current/10",

  /**
   * Ghost — No border, no fill. Underline reveals on hover.
   * Use for tertiary actions, "Learn more", navigation links.
   */
  ghost:
    "bg-transparent text-current " +
    "underline-offset-4 hover:underline " +
    "active:opacity-60",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-[6px] " +
  "uppercase select-none cursor-pointer font-sans " +
  "transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 " +
  "disabled:opacity-40 disabled:pointer-events-none";

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
  ...props
}) {
  const combined = [BASE, SIZE[size] ?? SIZE.md, VARIANT[variant] ?? VARIANT.primary, className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={combined} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combined}
      {...props}
    >
      {children}
    </button>
  );
}
