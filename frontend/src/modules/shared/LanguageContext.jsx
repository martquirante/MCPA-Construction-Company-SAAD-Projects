"use client";

import { createContext, useContext, useState, useEffect } from "react";

const translationCache = new Map();
const visibleTextCache = new Map();
const FREE_TRANSLATION_URL = "https://api.mymemory.translated.net/get";

function flattenTranslationSource(source) {
  return Object.entries(source).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((text, index) => ({ key: `${key}.${index}`, text }));
    }
    return typeof value === "string" ? [{ key, text: value }] : [];
  });
}

function unflattenTranslationResult(entries) {
  return entries.reduce((result, { key, text }) => {
    const [rootKey, index] = key.split(".");
    if (index !== undefined) {
      if (!Array.isArray(result[rootKey])) result[rootKey] = [];
      result[rootKey][Number(index)] = text;
    } else {
      result[rootKey] = text;
    }
    return result;
  }, {});
}

async function requestFreeTranslations(source) {
  const entries = flattenTranslationSource(source);
  const separator = "\n---MCPA_TRANSLATION_BREAK---\n";
  const batches = [];
  let batch = [];
  let batchLength = 0;

  entries.forEach((entry) => {
    if (batch.length && batchLength + entry.text.length + separator.length > 450) {
      batches.push(batch);
      batch = [];
      batchLength = 0;
    }
    batch.push(entry);
    batchLength += entry.text.length + separator.length;
  });
  if (batch.length) batches.push(batch);

  const translated = [];
  const requestSingle = async (entry) => {
    const response = await fetch(
      `${FREE_TRANSLATION_URL}?q=${encodeURIComponent(entry.text)}&langpair=en|tl`
    );
    if (!response.ok) throw new Error("Free translation provider unavailable.");
    const payload = await response.json();
    const text = payload?.responseData?.translatedText;
    if (!text || payload?.responseStatus !== 200) throw new Error("Free translation failed.");
    return { key: entry.key, text };
  };

  for (const currentBatch of batches) {
    try {
      const query = currentBatch.map(({ text }) => text).join(separator);
      const response = await fetch(
        `${FREE_TRANSLATION_URL}?q=${encodeURIComponent(query)}&langpair=en|tl`
      );
      if (!response.ok) throw new Error("Free translation provider unavailable.");
      const payload = await response.json();
      const text = payload?.responseData?.translatedText;
      if (!text || payload?.responseStatus !== 200) throw new Error("Free translation failed.");
      const parts = text.split(/\s*---MCPA_TRANSLATION_BREAK---\s*/);
      if (parts.length !== currentBatch.length) {
        throw new Error("Free translation batch changed.");
      }
      currentBatch.forEach(({ key }, index) => translated.push({ key, text: parts[index].trim() }));
    } catch (e) {
      for (const entry of currentBatch) {
        try {
          translated.push(await requestSingle(entry));
        } catch (singleError) {
          translated.push({ key: entry.key, text: entry.text });
        }
      }
    }
  }

  return { success: true, translations: unflattenTranslationResult(translated), provider: "mymemory-free" };
}

async function requestTranslations(source) {
  try {
    const response = await fetch("/api/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, target: "tl" }),
    });
    if (response.ok) return response.json();
  } catch (e) {
    // Use the public free provider when the local backend is not running.
  }
  return requestFreeTranslations(source);
}

const shouldTranslateText = (node) => {
  const parent = node.parentElement;
  const text = node.nodeValue?.trim() || "";
  if (!parent || !text || text.length > 500) return false;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(parent.tagName)) return false;
  if (parent.closest("[data-no-translate], [aria-hidden=\"true\"]")) return false;
  if (/^(https?:\/\/|www\.|[\w.-]+@[\w.-]+\.[A-Za-z]{2,})/.test(text)) return false;
  if (/^[\d\W_]+$/.test(text)) return false;
  return true;
};

function installAutomaticPageTranslation() {
  if (typeof document === "undefined" || !document.body) return () => {};

  let cancelled = false;
  let translationTimer;
  let isTranslating = false;
  let scanQueued = false;
  const translatedNodes = new WeakSet();
  const localFilipinoText = new Set(Object.values(translations.fil).flat());

  const translateNodes = async (nodes) => {
    if (isTranslating) {
      scanQueued = true;
      return;
    }
    const candidates = nodes.filter(
      (node) =>
        !translatedNodes.has(node) &&
        shouldTranslateText(node) &&
        !localFilipinoText.has(node.nodeValue.trim())
    );
    if (!candidates.length || cancelled) return;

    isTranslating = true;

    const source = {};
    const uncached = [];
    candidates.forEach((node, index) => {
      const text = node.nodeValue.trim();
      const cacheKey = `fil:${text}`;
      if (visibleTextCache.has(cacheKey)) return;
      const key = `text.${index}`;
      source[key] = text;
      uncached.push({ node, text, key, cacheKey });
    });

    try {
      if (uncached.length) {
        const payload = await requestTranslations(source);
        uncached.forEach(({ text, key, cacheKey }) => {
          const translated = payload?.translations?.text?.[key.split(".")[1]];
          if (translated) visibleTextCache.set(cacheKey, translated);
          else visibleTextCache.set(cacheKey, text);
        });
      }

      if (cancelled) return;
      candidates.forEach((node) => {
        const original = node.nodeValue;
        const trimmed = original.trim();
        const translated = visibleTextCache.get(`fil:${trimmed}`);
        if (!translated || translated === trimmed) return;
        const leading = original.match(/^\s*/)?.[0] || "";
        const trailing = original.match(/\s*$/)?.[0] || "";
        translatedNodes.add(node);
        node.nodeValue = `${leading}${translated}${trailing}`;
      });
    } catch (e) {
      // Keep untranslated text when the free provider is temporarily unavailable.
    } finally {
      isTranslating = false;
      if (scanQueued && !cancelled) {
        scanQueued = false;
        window.setTimeout(scan, 80);
      }
    }
  };

  const scan = () => {
    const nodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    translateNodes(nodes);
  };

  const observer = new MutationObserver(() => {
    clearTimeout(translationTimer);
    translationTimer = window.setTimeout(scan, 80);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  scan();

  return () => {
    cancelled = true;
    clearTimeout(translationTimer);
    observer.disconnect();
  };
}

export const translations = {
  en: {
    // Utility Bar
    announcements: [
      "Looking to turn your ideas into reality?",
      "Collaborate with us at MCPA Construction and Supply and let's build your dream home",
      "We Have Build Now, Pay Later Program Available",
      "Message Us Now — Inquire for Your Project",
    ],
    aboutUs: "About Us",
    helpCenter: "Help Center",
    theme: "Theme",
    appearance: "Select Appearance",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    systemAuto: "System Auto",

    // Navbar
    navHome: "Home",
    navProjects: "Projects",
    navServices: "Services",
    navProcess: "Process",
    bookAppointment: "Book an Appointment",
    clientPortal: "Client Portal",

    // Hero Section
    heroBadge: "Build Now, Pay Later Program Available",
    heroHeading: "Looking to turn your ideas into reality?",
    heroSubPre: "Collaborate with us at ",
    heroSubBold: "MCPA Construction and Supply",
    heroSubPost: " and let's build your enduring legacy.",
    scrollExplore: "Scroll to Explore",

    // Project Cards
    inquireStyle: "Inquire for this Style",
    readMore: "more",
    readLess: "less",

    // Modals
    aboutTitle: "About MCPA Construction",
    aboutSub: "Design & Build Contractor · Plaridel, Bulacan",
    aboutBio: "Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. We specialize in custom residential homes, modern commercial facilities, warehouse structures, signed and sealed engineering plans, and in-house construction supplies across Bulacan, Metro Manila, and Central Luzon.",
    officialSocialChannels: "Official Social Channels",
    warrantyTitle: "5-Year Structural Warranty",
    warrantyDesc: "Every residential and commercial project constructed by MCPA includes our comprehensive 5-year structural warranty, engineered with certified steel bars and reinforced concrete.",
    bnplTitle: "Build Now, Pay Later Program",
    bnplDesc: "Exclusive milestone-based financing for titled property owners across Bulacan, Metro Manila, and Central Luzon. Progress billing ensures you only pay as each verified phase is completed.",
    signedPlansTitle: "Signed & Sealed Blueprints",
    signedPlansDesc: "All architectural, structural, electrical, and sanitary plans are certified and sealed by licensed Filipino Architects, Civil Engineers, and Master Plumbers for seamless municipal permit approval.",
    viewAllServices: "View All Services",

    helpTitle: "MCPA Help Center & Support",
    headquarters: "Headquarters",
    headquartersDesc: "Plaridel, Bulacan, Philippines",
    emailInquiries: "Email Inquiries",
    phoneSupport: "Phone / Viber Support",
    bookFreeConsultation: "Book Free Site Consultation",

    // Appearance Drawer
    appearanceLabel: "Appearance",

    // Home Overview
    overviewEyebrow: "Quality Construction · Direct Materials",
    overviewHeading: "Why Homeowners Build With MCPA",
    overviewDescription: "No guesswork and no hidden fees. We provide clear communication, regular photo updates, and guaranteed quality materials so you always know how your home is being built.",
    pillarStrengthTitle: "Built For Lasting Strength",
    pillarStrengthDescription: "Reinforced concrete, certified steel framing, and solid engineering built to keep your family safe against typhoons and earthquakes.",
    pillarUpdatesTitle: "Clear Photo & Progress Updates",
    pillarUpdatesDescription: "Regular photo updates and status reports sent directly to your phone and online portal from foundation up to key turnover.",
    pillarPaymentTitle: "Build Now, Pay Later Program",
    pillarPaymentDescription: "Flexible payment options and clear stage-by-stage billing, so you only pay as each verified phase of your home is completed.",
  },
  fil: {
    // Utility Bar
    announcements: [
      "Nais mo bang gawing totoo ang iyong mga ideya?",
      "Makipagtulungan sa MCPA Construction and Supply at buuin natin ang iyong pangarap na tahanan",
      "Mayroon Kaming Programang Build Now, Pay Later",
      "Mag-message sa Amin Ngayon — Mag-inquire para sa Iyong Proyekto",
    ],
    aboutUs: "Tungkol sa Amin",
    helpCenter: "Tulong at Suporta",
    theme: "Tema",
    appearance: "Pumili ng Tema",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    systemAuto: "System Auto",

    // Navbar
    navHome: "Home",
    navProjects: "Mga Proyekto",
    navServices: "Mga Serbisyo",
    navProcess: "Proseso",
    bookAppointment: "Mag-book ng Appointment",
    clientPortal: "Client Portal",

    // Hero Section
    heroBadge: "May Programang Build Now, Pay Later",
    heroHeading: "Nais mo bang gawing totoo ang iyong mga plano?",
    heroSubPre: "Makipagtulungan sa ",
    heroSubBold: "MCPA Construction and Supply",
    heroSubPost: " at buuin natin ang iyong matatag na tahanan.",
    scrollExplore: "Mag-scroll upang Tuklasin",

    // Project Cards
    inquireStyle: "Mag-inquire sa Estilong Ito",
    readMore: "higit pa",
    readLess: "itiklop",

    // Modals
    aboutTitle: "Tungkol sa MCPA Construction",
    aboutSub: "Kontratista sa Disenyo at Pagtatayo · Plaridel, Bulacan",
    aboutBio: "Nais mo bang gawing totoo ang iyong mga ideya? Ang MCPA Construction and Supply ay isang full-service design and build contractor na nakabase sa Plaridel, Bulacan. Dalubhasa kami sa mga pasadyang tahanan, modernong pasilidad na komersyal, bodega, signed and sealed na mga planong pang-inhinyeriya, at direktang suplay ng materyales sa konstruksyon sa buong Bulacan, Metro Manila, at Gitnang Luzon.",
    officialSocialChannels: "Opisyal na Social Media Channels",
    warrantyTitle: "5-Taong Structural Warranty",
    warrantyDesc: "Bawat proyektong residensyal at komersyal ng MCPA ay may 5-taong structural warranty, gamit ang sertipikadong bakal at pinatibay na kongkreto.",
    bnplTitle: "Programang Build Now, Pay Later",
    bnplDesc: "Eksklusibong tulong pinansyal para sa mga may tituladong lote sa Bulacan, Metro Manila, at Gitnang Luzon. Magbabayad lamang habang natatapos ang bawat yugto ng bahay.",
    signedPlansTitle: "Pirma at Tatak ng mga Propesyonal",
    signedPlansDesc: "Lahat ng plano ay aprubado at may tatak ng mga lisensyadong Arkitekto, Civil Engineer, at Master Plumber para sa madaling pagkuha ng building permit.",
    viewAllServices: "Tingnan Lahat ng Serbisyo",

    helpTitle: "MCPA Sentro ng Tulong at Suporta",
    headquarters: "Pangunahing Tanggapan",
    headquartersDesc: "Plaridel, Bulacan, Pilipinas",
    emailInquiries: "Mga Katanungan sa Email",
    phoneSupport: "Telepono / Viber Support",
    bookFreeConsultation: "Mag-iskedyul ng Libreng Konsultasyon",

    // Appearance Drawer
    appearanceLabel: "Tema",

    // Home Overview
    overviewEyebrow: "De-kalidad na Konstruksyon · Direktang Materyales",
    overviewHeading: "Bakit Nagpapagawa ng Bahay sa MCPA ang mga May-ari",
    overviewDescription: "Walang hulaan at walang nakatagong bayarin. Nagbibigay kami ng malinaw na komunikasyon, regular na update sa larawan, at garantisadong de-kalidad na materyales para alam mo lagi ang progreso ng iyong bahay.",
    pillarStrengthTitle: "Matibay na Itinatayo para sa Pangmatagalan",
    pillarStrengthDescription: "Pinatibay na kongkreto, sertipikadong bakal, at maaasahang inhinyeriya para mapanatiling ligtas ang iyong pamilya laban sa bagyo at lindol.",
    pillarUpdatesTitle: "Malinaw na Update sa Larawan at Progreso",
    pillarUpdatesDescription: "Regular na update sa larawan at status report sa iyong telepono at online portal mula pundasyon hanggang turnover ng susi.",
    pillarPaymentTitle: "Build Now, Pay Later Program",
    pillarPaymentDescription: "Flexible na bayaran at malinaw na billing bawat yugto, kaya magbabayad ka lamang kapag nakumpleto ang bawat beripikadong phase ng iyong bahay.",
  },
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [remoteCatalog, setRemoteCatalog] = useState({ language: null, translations: null });

  useEffect(() => {
    let languageTimer;
    try {
      const saved = localStorage.getItem("mcpa-lang");
      if (saved === "fil" || saved === "en") {
        languageTimer = window.setTimeout(() => setLanguageState(saved), 0);
      }
    } catch (e) {}

    return () => {
      if (languageTimer) window.clearTimeout(languageTimer);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (language === "en") return undefined;

    const cachedTranslations = translationCache.get(language);
    if (cachedTranslations) return undefined;

    requestTranslations(translations.en)
      .then((payload) => {
        if (!isActive || !payload?.translations) return;
        translationCache.set(language, payload.translations);
        setRemoteCatalog({ language, translations: payload.translations });
      })
      .catch(() => {
        // Keep the curated local dictionary when the translation API is unavailable.
      });

    return () => {
      isActive = false;
    };
  }, [language]);

  useEffect(() => {
    if (language !== "fil") return undefined;
    return installAutomaticPageTranslation();
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("mcpa-lang", lang);
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mcpa-language-change", { detail: { language: lang } })
      );
      if (lang === "en" && language === "fil") {
        window.location.reload();
      }
    }
  };

  const t = (key) => {
    const fallback = translations[language] || translations.en;
    const cached = translationCache.get(language);
    const remote = remoteCatalog.language === language ? remoteCatalog.translations : null;
    const langDict = language === "en" ? translations.en : { ...fallback, ...(cached || remote || {}) };
    return langDict[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
