// Navigation state: tracks if user explicitly clicked a 'Home' link to skip back to completed hero
let returnToCompletedHome = false;

export function getReturnToCompletedHome() {
  if (typeof window !== "undefined") {
    try {
      // 1. If page was reloaded/refreshed, always show scrollable videos from the start (Step 0)
      const navEntries = performance.getEntriesByType?.("navigation");
      const isReload =
        navEntries?.[0]?.type === "reload" ||
        window.performance?.navigation?.type === 1;

      if (isReload) {
        sessionStorage.removeItem("mcpa_home_completed");
        returnToCompletedHome = false;
        return false;
      }

      // 2. Check if user clicked a 'Home' link
      const stored = sessionStorage.getItem("mcpa_home_completed");
      if (stored === "true" || returnToCompletedHome) {
        return true;
      }
    } catch (e) {}
  }
  return returnToCompletedHome;
}

export function setReturnToCompletedHome(val = true) {
  returnToCompletedHome = Boolean(val);
  if (typeof window !== "undefined") {
    try {
      if (val) {
        sessionStorage.setItem("mcpa_home_completed", "true");
      } else {
        sessionStorage.removeItem("mcpa_home_completed");
      }
    } catch (e) {}
  }
}

export function consumeReturnToCompletedHome() {
  returnToCompletedHome = false;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("mcpa_home_completed");
    } catch (e) {}
  }
}

