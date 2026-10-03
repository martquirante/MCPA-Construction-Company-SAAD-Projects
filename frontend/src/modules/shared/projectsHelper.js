/**
 * Centralized Projects Helper and Real-time Synchronization Utility
 * Guarantees zero hardcoded project lists; all projects originate purely from PostgreSQL.
 */

// Zero hardcoded dummy projects - Purely database-driven
export const INITIAL_PROJECTS = [];

/**
 * Normalizes a title for deduplication comparison (ignores "The", "MCPA", casing, punctuation).
 */
export function normalizeProjectName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/^(the|mcpa)\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Ensures a list of projects has strictly distinct keys and normalized entries.
 */
export function deduplicateProjects(primaryProjects = []) {
  if (!Array.isArray(primaryProjects)) return [];

  const seenIds = new Set();
  const seenNames = new Set();
  const result = [];

  primaryProjects.forEach((project) => {
    if (!project || typeof project !== "object") return;

    const rawId = project.id ?? project.project_id;
    const strId = rawId !== undefined && rawId !== null ? String(rawId) : null;
    const normName = normalizeProjectName(project.name);

    if (strId && seenIds.has(strId)) return;
    if (normName && seenNames.has(normName)) return;

    if (strId) seenIds.add(strId);
    if (normName) seenNames.add(normName);

    result.push({
      ...project,
      id: rawId ?? `proj-${result.length + 1}`,
      images: Array.isArray(project.images) ? project.images : [],
      month: project.month || "January",
      status: project.status || "completed",
      isAdminAdded: Boolean(project.isAdminAdded ?? project.is_admin_added),
      lotArea: project.lotArea || project.lot_area || "",
      floorArea: project.floorArea || project.floor_area || "",
      bedrooms: project.bedrooms || "",
      bathrooms: project.bathrooms || "",
      features: Array.isArray(project.features) ? project.features : [],
      architecturalDetails: project.architecturalDetails || project.architectural_details || "",
    });
  });

  return result;
}

/**
 * Broadcasts a real-time event across all open tabs, windows, and components
 * whenever an admin adds, edits, or deletes a project in the database.
 */
export function broadcastProjectsChange() {
  if (typeof window === "undefined") return;

  try {
    // 1. Cross-tab instant broadcast via BroadcastChannel
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("mcpa_projects_realtime_sync");
      channel.postMessage({ type: "PROJECTS_UPDATED", timestamp: Date.now() });
      channel.close();
    }

    // 2. Same-window instant event dispatch
    window.dispatchEvent(new CustomEvent("mcpa-projects-updated"));

    // 3. Fallback cross-tab storage trigger
    localStorage.setItem("mcpa_projects_last_sync", String(Date.now()));
  } catch (e) {
    console.warn("Could not broadcast project update:", e);
  }
}

/**
 * Subscribes a component (like the Portfolio section or Admin tab)
 * to real-time project updates across browser tabs and windows.
 */
export function subscribeProjectsChange(callback) {
  if (typeof window === "undefined" || typeof callback !== "function") {
    return () => {};
  }

  let debounceTimer = null;
  const debouncedCallback = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      callback();
    }, 500);
  };

  let channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("mcpa_projects_realtime_sync");
      channel.onmessage = (event) => {
        if (event?.data?.type === "PROJECTS_UPDATED") {
          debouncedCallback();
        }
      };
    }
  } catch (e) {}

  const handleCustom = () => debouncedCallback();
  const handleStorage = (e) => {
    if (e.key === "mcpa_projects_last_sync" || e.key === "mcpa_portfolio_projects") {
      debouncedCallback();
    }
  };
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      debouncedCallback();
    }
  };

  window.addEventListener("mcpa-projects-updated", handleCustom);
  window.addEventListener("storage", handleStorage);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (channel) {
      channel.close();
    }
    window.removeEventListener("mcpa-projects-updated", handleCustom);
    window.removeEventListener("storage", handleStorage);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}
