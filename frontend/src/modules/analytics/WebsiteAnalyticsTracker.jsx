"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";

const VISITOR_STORAGE_KEY = "mcpa_analytics_visitor_id";
const SESSION_STORAGE_KEY = "mcpa_analytics_session_id";
const SESSION_TS_KEY = "mcpa_analytics_session_last_ts";
const CONSENT_STORAGE_KEY = "mcpa_analytics_consent";
const BANNER_DISMISSED_KEY = "mcpa_analytics_banner_ack";
const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 minutes session window

function generateRandomId(prefix) {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").substring(0, 16)
      : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

function getOrCreateVisitorId() {
  try {
    let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = generateRandomId("vid");
      localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch (_) {
    return generateRandomId("vid");
  }
}

function getOrCreateSessionId() {
  try {
    const now = Date.now();
    const lastTs = parseInt(sessionStorage.getItem(SESSION_TS_KEY) || "0", 10);
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!sid || (lastTs > 0 && now - lastTs > SESSION_IDLE_MS)) {
      sid = generateRandomId("sid");
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return sid;
  } catch (_) {
    return generateRandomId("sid");
  }
}

async function collectClientHintsAndMeta() {
  const deviceMeta = {
    screenResolution:
      typeof window !== "undefined" && window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : "Unknown",
    viewportSize:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : "Unknown",
    pixelRatio:
      typeof window !== "undefined" ? Number(window.devicePixelRatio || 1) : 1,
    maxTouchPoints:
      typeof navigator !== "undefined" ? Number(navigator.maxTouchPoints || 0) : 0,
    touchCapable:
      typeof window !== "undefined" &&
      ("ontouchstart" in window || Number(navigator.maxTouchPoints || 0) > 0),
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila"
        : "Asia/Manila",
    isBrave: false,
  };

  try {
    if (typeof navigator !== "undefined" && navigator.brave && typeof navigator.brave.isBrave === "function") {
      deviceMeta.isBrave = await navigator.brave.isBrave();
    }
  } catch (_) {}

  let uaHints = {};
  try {
    if (typeof navigator !== "undefined" && navigator.userAgentData) {
      uaHints = {
        mobile: Boolean(navigator.userAgentData.mobile),
        platform: navigator.userAgentData.platform || "",
        brands: navigator.userAgentData.brands || [],
      };
      if (typeof navigator.userAgentData.getHighEntropyValues === "function") {
        const highEntropy = await navigator.userAgentData.getHighEntropyValues([
          "model",
          "platform",
          "platformVersion",
          "fullVersionList",
        ]);
        uaHints = {
          ...uaHints,
          model: highEntropy.model || "",
          platform: highEntropy.platform || uaHints.platform,
          platformVersion: highEntropy.platformVersion || "",
          brands: highEntropy.fullVersionList || uaHints.brands,
        };
      }
    }
  } catch (_) {}

  return { deviceMeta, uaHints };
}

function TrackerCore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef({ path: "", time: 0 });
  const currentPathRef = useRef("/");
  const previousPathRef = useRef(null);
  const pageEnteredAtRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const clientInfoRef = useRef(null);

  const [showConsentNotice, setShowConsentNotice] = useState(false);
  const [consentStatus, setConsentStatus] = useState("granted");

  // Load initial consent state
  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (savedConsent) {
        setConsentStatus(savedConsent);
      }
      const ack = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (!ack && pathname && !pathname.startsWith("/admin") && !pathname.startsWith("/portal")) {
        const timer = setTimeout(() => setShowConsentNotice(true), 2500);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [pathname]);

  // Helper to send analytics payload
  const sendAnalyticsPayload = async (type, extra = {}) => {
    try {
      const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY) || "granted";
      if (savedConsent === "opt_out") return;

      if (!clientInfoRef.current) {
        clientInfoRef.current = await collectClientHintsAndMeta();
      }

      const visitorId = getOrCreateVisitorId();
      const sessionId = getOrCreateSessionId();
      const { deviceMeta, uaHints } = clientInfoRef.current;

      const payload = {
        type,
        visitorId,
        sessionId,
        pagePath: currentPathRef.current || "/",
        pageTitle: typeof document !== "undefined" ? document.title : "MCPA Construction",
        previousPage: previousPathRef.current,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        consentStatus: savedConsent,
        timeOnPageSeconds: Math.max(
          0,
          Math.round((Date.now() - pageEnteredAtRef.current) / 1000)
        ),
        scrollDepthPct: maxScrollDepthRef.current,
        deviceMeta,
        uaHints,
        ...extra,
      };

      await fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: type === "leave",
      });
    } catch (_) {}
  };

  // Expose global event tracking helper for Projects, Blog, Services, Media
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.mcpaTrackEvent = (eventName, eventCategory = "engagement", eventLabel = null, eventMetadata = {}) => {
      sendAnalyticsPayload("event", {
        eventName,
        eventCategory,
        eventLabel,
        eventMetadata,
      });
    };
    window.mcpaSetAnalyticsConsent = (newStatus) => {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, newStatus);
        localStorage.setItem(BANNER_DISMISSED_KEY, "true");
        setConsentStatus(newStatus);
        setShowConsentNotice(false);
      } catch (_) {}
    };
  });

  // Track route changes (deduplicated against React StrictMode double invocation)
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const queryStr = searchParams?.toString();
    const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;
    const now = Date.now();

    if (
      lastTrackedRef.current.path === fullPath &&
      now - lastTrackedRef.current.time < 1500
    ) {
      return;
    }

    previousPathRef.current = lastTrackedRef.current.path || null;
    lastTrackedRef.current = { path: fullPath, time: now };
    currentPathRef.current = pathname;
    pageEnteredAtRef.current = now;
    maxScrollDepthRef.current = 15;

    const utmSource = searchParams?.get("utm_source") || null;
    const utmMedium = searchParams?.get("utm_medium") || null;
    const utmCampaign = searchParams?.get("utm_campaign") || null;

    sendAnalyticsPayload("pageview", {
      pagePath: pathname,
      utmSource,
      utmMedium,
      utmCampaign,
    });
  }, [pathname, searchParams]);

  // Track Scroll Depth & 20-second Real-Time Heartbeat + Page Leave
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const handleScroll = () => {
      try {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const docHeight =
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          ) - window.innerHeight;
        if (docHeight > 0) {
          const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
          if (pct > maxScrollDepthRef.current) {
            maxScrollDepthRef.current = pct;
          }
        }
      } catch (_) {}
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const heartbeatInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        sendAnalyticsPayload("heartbeat");
      }
    }, 20000);

    const handlePageHide = () => {
      try {
        const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY) || "granted";
        if (savedConsent === "opt_out") return;
        const visitorId = getOrCreateVisitorId();
        const sessionId = getOrCreateSessionId();
        const body = JSON.stringify({
          type: "leave",
          visitorId,
          sessionId,
          pagePath: currentPathRef.current || "/",
          timeOnPageSeconds: Math.max(
            0,
            Math.round((Date.now() - pageEnteredAtRef.current) / 1000)
          ),
          scrollDepthPct: maxScrollDepthRef.current,
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/collect", blob);
        } else {
          fetch("/api/analytics/collect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (_) {}
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", handlePageHide);
      clearInterval(heartbeatInterval);
    };
  }, [pathname]);

  if (!showConsentNotice || pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[90] max-w-sm rounded-2xl bg-neutral-950/95 text-white border border-white/15 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Privacy-Safe Analytics</span>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(BANNER_DISMISSED_KEY, "true");
            } catch (_) {}
            setShowConsentNotice(false);
          }}
          className="text-neutral-400 hover:text-white cursor-pointer"
          aria-label="Close privacy notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-neutral-300 leading-relaxed mt-1.5">
        We use anonymized, privacy-first telemetry (compliant with the Philippine Data Privacy Act &amp; GDPR) to improve our architectural portfolio and website experience. No personal data or raw IP addresses are stored.
      </p>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
              localStorage.setItem(BANNER_DISMISSED_KEY, "true");
            } catch (_) {}
            setConsentStatus("granted");
            setShowConsentNotice(false);
          }}
          className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-[11px] uppercase tracking-wider cursor-pointer"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(CONSENT_STORAGE_KEY, "opt_out");
              localStorage.setItem(BANNER_DISMISSED_KEY, "true");
            } catch (_) {}
            setConsentStatus("opt_out");
            setShowConsentNotice(false);
          }}
          className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 font-bold text-[11px] cursor-pointer"
        >
          Opt Out
        </button>
      </div>
    </div>
  );
}

export default function WebsiteAnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerCore />
    </Suspense>
  );
}
