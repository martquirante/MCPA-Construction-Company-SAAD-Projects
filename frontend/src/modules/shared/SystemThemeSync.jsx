"use client";

import { useEffect } from "react";

export function getThemePreference() {
  if (typeof window === "undefined") return "system";
  try {
    return localStorage.getItem("mcpa-theme") || "system";
  } catch (e) {
    return "system";
  }
}

export function setThemePreference(mode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mcpa-theme", mode);
  } catch (e) {}

  const mediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const isDark =
    mode === "dark"
      ? true
      : mode === "light"
      ? false
      : mediaQuery
      ? mediaQuery.matches
      : false;

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  window.dispatchEvent(
    new CustomEvent("mcpa-theme-change", { detail: { mode, isDark } })
  );
}

export default function SystemThemeSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const currentPref = getThemePreference();

    const applyCurrentTheme = (pref) => {
      const isDark =
        pref === "dark"
          ? true
          : pref === "light"
          ? false
          : mediaQuery
          ? mediaQuery.matches
          : false;

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      window.dispatchEvent(
        new CustomEvent("mcpa-theme-change", { detail: { mode: pref, isDark } })
      );
    };

    applyCurrentTheme(currentPref);

    const handleMediaChange = (e) => {
      const pref = getThemePreference();
      if (pref === "system") {
        applyCurrentTheme("system");
      }
    };

    if (mediaQuery) {
      try {
        mediaQuery.addEventListener("change", handleMediaChange);
      } catch (e) {
        mediaQuery.addListener(handleMediaChange);
      }
    }

    return () => {
      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } catch (e) {
          mediaQuery.removeListener(handleMediaChange);
        }
      }
    };
  }, []);

  return null;
}
