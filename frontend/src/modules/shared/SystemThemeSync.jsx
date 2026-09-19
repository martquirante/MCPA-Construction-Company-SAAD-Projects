"use client";

import { useEffect } from "react";

export default function SystemThemeSync() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Clean up any legacy manual localStorage preference so system theme is always authoritative
    try {
      localStorage.removeItem("mcpa-theme");
    } catch (e) {}

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(
        new CustomEvent("mcpa-theme-change", { detail: { isDark } })
      );
    };

    // Initial sync
    syncTheme(mediaQuery.matches);

    // Live listener for OS / browser theme changes
    const handleChange = (e) => syncTheme(e.matches);

    try {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return null;
}
