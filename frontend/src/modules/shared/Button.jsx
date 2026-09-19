"use client";

import Link from "next/link";

export default function Button({
  children,
  href,
  variant = "primary", // "primary" | "secondary" | "outline"
  size = "md", // "sm" | "md" | "lg"
  className = "",
  onClick,
  ...props
}) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs font-semibold tracking-wider",
    md: "px-6 py-3 text-sm font-semibold tracking-wide",
    lg: "px-8 py-4 text-base font-bold tracking-wide",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-neutral-950 shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_28px_rgba(245,158,11,0.55)] hover:from-amber-400 hover:to-amber-500 active:scale-[0.98]",
    secondary:
      "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 active:scale-[0.98]",
    outline:
      "bg-transparent text-amber-400 border border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-400 active:scale-[0.98]",
  };

  const baseClasses =
    "inline-flex items-center justify-center rounded-xl uppercase transition-all duration-300 select-none cursor-pointer font-sans";

  const combined = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combined} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combined} {...props}>
      {children}
    </button>
  );
}
