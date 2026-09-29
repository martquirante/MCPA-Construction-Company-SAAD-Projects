"use client";

import { useEffect } from "react";
import { useServerInsertedHTML } from "next/navigation";

// Filter out React 19 false-positive script warning during client-side hydration/development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

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
  useServerInsertedHTML(() => (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var p=localStorage.getItem('mcpa-theme');var d=p==='dark'||(!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
      }}
    />
  ));

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
