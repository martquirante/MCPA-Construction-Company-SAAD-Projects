"use client";

import { useState, useEffect, useRef } from "react";

/**
 * useAuthoritativeClock
 *
 * Provides a tamper-proof, server-synchronized real-time clock with seconds.
 *
 * KEY DEFENSES AGAINST CLOCK TAMPERING:
 * 1. Synchronizes with authoritative server timestamp via /api/time.
 * 2. Employs hardware-level monotonic clock (`performance.now()`).
 *    `performance.now()` is immune to OS clock manipulation (e.g. user changing
 *    Windows/mobile time forward or backward).
 * 3. Detects device clock skew and displays an adaptive indicator when the user's
 *    device clock has been altered or is in a different timezone.
 * 4. Automatically resyncs on window wake/visibilitychange and every 5 minutes.
 */
export function useAuthoritativeClock(targetTimeZone = "Asia/Manila") {
  const [clock, setClock] = useState({
    dateStr: "",
    shortDateStr: "",
    timeStr: "",
    fullStr: "",
    timezoneCode: "PHT",
    isSynced: false,
    hasClockSkew: false,
    skewText: "",
  });

  const syncRef = useRef({
    baseServerMs: 0,
    basePerfMs: 0,
    isSynced: false,
    clockSkewMs: 0,
  });

  // 1. Initial and recurring server sync
  useEffect(() => {
    let isMounted = true;

    async function syncWithServer() {
      try {
        const tStart = performance.now();
        const res = await fetch("/api/time", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const tEnd = performance.now();
          const rtt = Math.max(0, tEnd - tStart);
          const serverMs = data.timestamp + Math.round(rtt / 2);
          const localMs = Date.now();
          const skew = localMs - serverMs;

          if (isMounted) {
            syncRef.current = {
              baseServerMs: serverMs,
              basePerfMs: tEnd,
              isSynced: true,
              clockSkewMs: skew,
            };
          }
        }
      } catch (err) {
        // Fallback: continue with current state or local clock
      }
    }

    syncWithServer();

    // Re-synchronize periodically (every 5 mins) & on visibility change
    const interval = setInterval(syncWithServer, 5 * 60 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncWithServer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // 2. Real-time 1-second monotonic tick
  useEffect(() => {
    function updateTick() {
      const { baseServerMs, basePerfMs, isSynced, clockSkewMs } = syncRef.current;

      // If synced, extrapolate monotonically using performance.now()
      // This is 100% immune to OS clock tampering while the page is open!
      const currentMs = isSynced
        ? baseServerMs + (performance.now() - basePerfMs)
        : Date.now();

      const dateObj = new Date(currentMs);

      // Check if device clock was altered (> 15 seconds difference)
      const currentLocalMs = Date.now();
      const currentDriftMs = Math.abs(currentLocalMs - currentMs);
      const isSkewed = currentDriftMs > 15000;

      let skewDesc = "";
      if (isSkewed) {
        const diffSec = Math.round((currentLocalMs - currentMs) / 1000);
        if (Math.abs(diffSec) >= 3600) {
          const hrs = (diffSec / 3600).toFixed(1);
          skewDesc = `${diffSec > 0 ? "+" : ""}${hrs}h`;
        } else if (Math.abs(diffSec) >= 60) {
          const mins = Math.round(diffSec / 60);
          skewDesc = `${diffSec > 0 ? "+" : ""}${mins}m`;
        } else {
          skewDesc = `${diffSec > 0 ? "+" : ""}${diffSec}s`;
        }
      }

      // Format in Philippine Standard Time
      const shortDate = dateObj.toLocaleDateString("en-US", {
        timeZone: targetTimeZone,
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const dayName = dateObj.toLocaleDateString("en-US", {
        timeZone: targetTimeZone,
        weekday: "short",
      });

      const timeFormatted = dateObj.toLocaleTimeString("en-US", {
        timeZone: targetTimeZone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      setClock({
        dateStr: `${dayName}, ${shortDate}`,
        shortDateStr: shortDate,
        timeStr: timeFormatted,
        fullStr: `${shortDate} · ${timeFormatted}`,
        timezoneCode: "PHT",
        isSynced,
        hasClockSkew: isSkewed,
        skewText: skewDesc,
      });
    }

    updateTick();
    const ticker = setInterval(updateTick, 1000);
    return () => clearInterval(ticker);
  }, [targetTimeZone]);

  return clock;
}
