"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Architectural LordIcon Component (Theme-Adaptive)
 * Dynamically shifts palette between Light and Dark mode:
 * - Dark Mode: Primary (Pure White #ffffff), Secondary (Crisp Silver #a1a1aa)
 * - Light Mode: Primary (Deep Obsidian #09090b), Secondary (Graphite Gray #71717a)
 */
export default function LordIcon({
  src,
  trigger = "hover",
  delay = 0,
  colors,
  darkColors = "primary:#f59e0b,secondary:#ffffff",
  lightColors = "primary:#f59e0b,secondary:#121212",
  size = 32,
  className = "",
  style = {},
  fallback = null,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const iconRef = useRef(null);

  useEffect(() => {
    // Initial theme check
    const checkTheme = () => {
      if (typeof document !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkTheme();

    // Listen to theme events
    const handleThemeEvent = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setIsDark(e.detail.isDark);
      } else {
        checkTheme();
      }
    };
    window.addEventListener("mcpa-theme-change", handleThemeEvent);

    // MutationObserver to observe .dark class changes on <html>
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Script injection
    const existingScript = document.querySelector('script[src*="lordicon.js"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.lordicon.com/lordicon.js";
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }

    return () => {
      window.removeEventListener("mcpa-theme-change", handleThemeEvent);
      observer.disconnect();
    };
  }, []);

  // Compute active colors: explicit colors override, otherwise theme-based colors
  const activeColors = colors || (isDark ? darkColors : lightColors);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 transition-colors duration-300 ${className}`}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      {loaded ? (
        <lord-icon
          key={`${src}-${isDark ? "dark" : "light"}`}
          ref={iconRef}
          src={src}
          trigger={trigger}
          delay={delay}
          colors={activeColors}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        fallback || <span className="inline-block w-full h-full opacity-0" />
      )}
    </span>
  );
}
