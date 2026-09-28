// Navigation state: tracks if user navigated back to Home from another page
let returnToCompletedHome = false;

/**
 * Checks if the current page load is an actual browser refresh/reload of the home page ("/").
 */
export function isHomePageReload() {
  if (typeof window === "undefined") return false;
  try {
    const navEntries = window.performance?.getEntriesByType?.("navigation");
    const nav = navEntries?.[0];
    const isReloadType =
      nav?.type === "reload" || window.performance?.navigation?.type === 1;

    if (!isReloadType) return false;

    // Check if the document that was reloaded is actually the home page ("/")
    // nav.name is the document URL that the browser fetched from the server when reloading
    if (nav?.name) {
      try {
        const navUrl = new URL(nav.name);
        // If the reloaded URL was a subpage like /projects or /services, this is NOT a reload of "/"
        if (navUrl.pathname !== "/") {
          return false;
        }
      } catch (e) {}
    }

    // If user has a flag indicating they came from a subpage via SPA navigation, it's not a direct reload of "/"
    const fromSubpage = sessionStorage.getItem("mcpa_from_subpage");
    if (fromSubpage === "true") {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Determines whether the user should skip the video and go directly to the completed residence screen (Step 3).
 * Rules:
 * 1. Kakabukas lang ng site (Initial visit) -> returns false (video + loading screen).
 * 2. Reload while on Home ("/") -> returns false (video + loading screen).
 * 3. Navigating to Home from any other page (/projects, /services, etc.) -> returns true (direct to completed residence, NO video).
 */
export function getReturnToCompletedHome() {
  if (typeof window !== "undefined") {
    try {
      // Rule 2: If the home page itself was directly reloaded, always start at Step 0 with video
      if (isHomePageReload()) {
        sessionStorage.removeItem("mcpa_from_subpage");
        sessionStorage.removeItem("mcpa_home_completed");
        returnToCompletedHome = false;
        return false;
      }

      // Rule 3: Check if returning from any other subpage or explicit navigation
      const fromSubpage = sessionStorage.getItem("mcpa_from_subpage");
      const storedCompleted = sessionStorage.getItem("mcpa_home_completed");

      if (fromSubpage === "true" || storedCompleted === "true" || returnToCompletedHome) {
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
        sessionStorage.setItem("mcpa_from_subpage", "true");
      } else {
        sessionStorage.removeItem("mcpa_home_completed");
        sessionStorage.removeItem("mcpa_from_subpage");
      }
    } catch (e) {}
  }
}

export function consumeReturnToCompletedHome() {
  returnToCompletedHome = false;
  if (typeof window !== "undefined") {
    try {
      // Clear the subpage flag so that an immediate F5 / browser reload while on "/" will show the video
      sessionStorage.removeItem("mcpa_from_subpage");
      sessionStorage.removeItem("mcpa_home_completed");
    } catch (e) {}
  }
}

