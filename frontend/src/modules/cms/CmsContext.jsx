"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const DEFAULT_CMS_THEME = {
  primaryColor: "#f59e0b",
  secondaryColor: "#5b6770",
  accentColor: "#d97706",
  surfaceLight: "#f8f7f5",
  surfaceDark: "#080a0e",
  textLight: "#121212",
  textDark: "#f3f3f3",
  cardLight: "#ffffff",
  cardDark: "#11141c",
  borderLight: "#e5e7eb",
  borderDark: "#1f2937",
  headingFont: "Plus Jakarta Sans",
  bodyFont: "Plus Jakarta Sans",
  baseFontSize: "16px",
  headingWeight: "700",
  lineHeight: "1.6",
  borderRadius: "8px",
  defaultThemeMode: "system",
  defaultBlogLayout: "feed",
  navStyle: "glass",
  footerStyle: "architectural-dark",
  presetName: "MCPA Signature Amber",
};

export const CURATED_WEB_FONTS = [
  { name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", googleUrl: null },
  { name: "Inter", family: "'Inter', sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" },
  { name: "Outfit", family: "'Outfit', sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" },
  { name: "Roboto", family: "'Roboto', sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" },
  { name: "Playfair Display", family: "'Playfair Display', serif", googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&display=swap" },
];

export function applyThemeTokensToDom(theme) {
  if (typeof document === "undefined" || !theme) return;
  const root = document.documentElement;
  const merged = { ...DEFAULT_CMS_THEME, ...theme };

  root.style.setProperty("--brand-yellow", merged.primaryColor);
  root.style.setProperty("--brand-accent", merged.accentColor || merged.primaryColor);
  root.style.setProperty("--brand-slate", merged.secondaryColor);
  root.style.setProperty("--color-brand-yellow", merged.primaryColor);
  root.style.setProperty("--color-amber-500", merged.primaryColor);
  root.style.setProperty("--color-amber-600", merged.accentColor || merged.primaryColor);
  root.style.setProperty("--cms-surface-light", merged.surfaceLight);
  root.style.setProperty("--cms-surface-dark", merged.surfaceDark);
  root.style.setProperty("--cms-text-light", merged.textLight);
  root.style.setProperty("--cms-text-dark", merged.textDark);
  root.style.setProperty("--cms-radius", merged.borderRadius || "8px");

  // Inject Google Fonts if selected font is not the default Plus Jakarta Sans
  const fontsToLoad = [merged.headingFont, merged.bodyFont].filter(Boolean);
  fontsToLoad.forEach((fName) => {
    const fontMeta = CURATED_WEB_FONTS.find((f) => f.name === fName);
    if (fontMeta && fontMeta.googleUrl) {
      const linkId = `cms-font-${fName.toLowerCase().replace(/\s+/g, "-")}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = fontMeta.googleUrl;
        document.head.appendChild(link);
      }
    }
  });

  const headingFontMeta = CURATED_WEB_FONTS.find((f) => f.name === merged.headingFont);
  const bodyFontMeta = CURATED_WEB_FONTS.find((f) => f.name === merged.bodyFont);
  if (headingFontMeta) {
    root.style.setProperty("--font-display", headingFontMeta.family);
  }
  if (bodyFontMeta) {
    root.style.setProperty("--font-sans", bodyFontMeta.family);
    document.body.style.fontFamily = bodyFontMeta.family;
  }
}

const CmsContext = createContext({
  contentMap: {},
  flatKeyMap: {},
  theme: DEFAULT_CMS_THEME,
  loading: false,
  getContent: (pageKey, sectionKey, contentKey, fallback = "") => fallback,
  getFlatContent: (contentKey, fallback = undefined) => fallback,
  refreshCms: async () => {},
  previewTheme: () => {},
});

export function CmsProvider({ children }) {
  const [contentMap, setContentMap] = useState({});
  const [theme, setTheme] = useState(DEFAULT_CMS_THEME);
  const [loading, setLoading] = useState(true);

  const fetchCmsData = useCallback(async () => {
    try {
      const [contentRes, themeRes] = await Promise.all([
        fetch(`${API_BASE}/api/cms/content`, { cache: "no-store" }).catch(() => null),
        fetch(`${API_BASE}/api/cms/theme`, { cache: "no-store" }).catch(() => null),
      ]);

      if (contentRes && contentRes.ok) {
        const cData = await contentRes.json();
        if (cData.success && cData.content) {
          setContentMap(cData.content);
          try {
            localStorage.setItem("mcpa-cms-content-cache", JSON.stringify(cData.content));
          } catch (_) {}
        }
      }

      if (themeRes && themeRes.ok) {
        const tData = await themeRes.json();
        if (tData.success && tData.theme) {
          const mergedTheme = { ...DEFAULT_CMS_THEME, ...tData.theme };
          setTheme(mergedTheme);
          applyThemeTokensToDom(mergedTheme);
          try {
            localStorage.setItem("mcpa-cms-theme-cache", JSON.stringify(mergedTheme));
          } catch (_) {}
        }
      }
    } catch (err) {
      // Quietly fallback to cached or default values
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hydrate from localStorage cache immediately before network completes
    try {
      const cachedContent = localStorage.getItem("mcpa-cms-content-cache");
      if (cachedContent) {
        setContentMap(JSON.parse(cachedContent));
      }
      const cachedTheme = localStorage.getItem("mcpa-cms-theme-cache");
      if (cachedTheme) {
        const parsedTheme = { ...DEFAULT_CMS_THEME, ...JSON.parse(cachedTheme) };
        setTheme(parsedTheme);
        applyThemeTokensToDom(parsedTheme);
      }
    } catch (_) {}

    fetchCmsData();

    // Listen for instant cross-tab / admin dashboard updates
    const handleSync = () => {
      fetchCmsData();
    };
    window.addEventListener("mcpa-cms-sync", handleSync);

    let bc = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("mcpa-cms-channel");
        bc.onmessage = () => {
          fetchCmsData();
        };
      } catch (_) {}
    }

    return () => {
      window.removeEventListener("mcpa-cms-sync", handleSync);
      if (bc) bc.close();
    };
  }, [fetchCmsData]);

  // Flat dictionary of all content_key -> content_value for direct lookup in LanguageContext t(key)
  const flatKeyMap = useMemo(() => {
    const flat = {};
    for (const pKey of Object.keys(contentMap || {})) {
      const sections = contentMap[pKey] || {};
      for (const sKey of Object.keys(sections)) {
        const keys = sections[sKey] || {};
        for (const cKey of Object.keys(keys)) {
          if (keys[cKey] !== undefined && keys[cKey] !== null && keys[cKey] !== "") {
            flat[cKey] = keys[cKey];
          }
        }
      }
    }
    // Also build dynamic announcements array if edited
    if (flat.announcement_1 || flat.announcement_2 || flat.announcement_3 || flat.announcement_4) {
      flat.announcements = [
        flat.announcement_1,
        flat.announcement_2,
        flat.announcement_3,
        flat.announcement_4,
      ].filter(Boolean);
    }
    return flat;
  }, [contentMap]);

  const getContent = useCallback(
    (pageKey, sectionKey, contentKey, fallback = "") => {
      const val = contentMap?.[pageKey]?.[sectionKey]?.[contentKey];
      if (val !== undefined && val !== null && val !== "") {
        return val;
      }
      return fallback;
    },
    [contentMap]
  );

  const getFlatContent = useCallback(
    (contentKey, fallback = undefined) => {
      if (flatKeyMap[contentKey] !== undefined) {
        return flatKeyMap[contentKey];
      }
      return fallback;
    },
    [flatKeyMap]
  );

  const previewTheme = useCallback((draftTheme) => {
    const merged = { ...DEFAULT_CMS_THEME, ...draftTheme };
    setTheme(merged);
    applyThemeTokensToDom(merged);
  }, []);

  const value = useMemo(
    () => ({
      contentMap,
      flatKeyMap,
      theme,
      loading,
      getContent,
      getFlatContent,
      refreshCms: fetchCmsData,
      previewTheme,
    }),
    [contentMap, flatKeyMap, theme, loading, getContent, getFlatContent, fetchCmsData, previewTheme]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  return useContext(CmsContext);
}

export function notifyCmsUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mcpa-cms-sync"));
  if ("BroadcastChannel" in window) {
    try {
      const bc = new BroadcastChannel("mcpa-cms-channel");
      bc.postMessage({ type: "CMS_UPDATED", timestamp: Date.now() });
      bc.close();
    } catch (_) {}
  }
}
