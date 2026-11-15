"use client";

/**
 * PillarCard
 *
 * Clean architectural pillar — transparent background without card box,
 * watermark numbers, or corner accent lines as requested.
 */
export default function PillarCard({
  idx,
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
      className="group relative select-none h-full flex flex-col p-6 sm:p-7 bg-transparent rounded-2xl transition-all duration-200"
    >
      {/* Icon */}
      <div className="relative mb-5">
        {icon}
      </div>

      {/* Title */}
      <h3 className="relative text-lg sm:text-xl font-bold uppercase tracking-wide text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-150 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="relative text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-normal">
        {description}
      </p>
    </div>
  );
}
