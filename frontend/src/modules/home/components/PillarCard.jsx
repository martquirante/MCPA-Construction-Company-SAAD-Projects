"use client";

/**
 * PillarCard
 *
 * Clean architectural card — flat border activation on hover.
 * Removed: 3D perspective tilt, cursor spotlight glow, hover blur-beam gradient,
 * hover:scale on icon, and group-hover text translate.
 * Retained: architectural watermark number, amber corner accent, scroll-in animation.
 */
export default function PillarCard({
  idx,
  number,
  icon,
  title,
  description,
  isVisible,
}) {
  const transitionDelay = `${idx * 160}ms`;

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? transitionDelay : "0ms"}, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? transitionDelay : "0ms"}`,
      }}
      className={
        "group relative overflow-hidden rounded-[10px] p-8 sm:p-9 border select-none h-full flex flex-col " +
        "bg-white dark:bg-neutral-900/50 " +
        "border-neutral-200 dark:border-neutral-800 " +
        "hover:border-amber-500/50 dark:hover:border-amber-500/30 " +
        "shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] " +
        "transition-[border-color,box-shadow] duration-200"
      }
    >
      {/* Architectural watermark number */}
      <div className="pointer-events-none absolute top-4 right-5 text-6xl font-extrabold font-mono text-neutral-900/[0.04] dark:text-white/[0.04] select-none">
        {number}
      </div>

      {/* Icon */}
      <div className="relative mb-6">
        {icon}
      </div>

      {/* Title */}
      <h3 className="relative text-xl font-bold uppercase tracking-wide text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-150 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="relative text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-light">
        {description}
      </p>

      {/* Bottom corner accent line */}
      <div className="absolute bottom-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-16 h-[1.5px] bg-amber-500/35 rotate-45 transform origin-bottom-right group-hover:bg-amber-400/60 transition-colors duration-200" />
      </div>
    </div>
  );
}
