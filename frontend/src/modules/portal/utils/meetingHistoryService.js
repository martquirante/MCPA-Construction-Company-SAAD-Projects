/**
 * Meeting History & Consultation Archival Service
 * Supports:
 * - Aggregation of ALL meetings: Instant Online, Scheduled Google Meet, and In-Person (F2F)
 * - Exact duration calculation and formatting (e.g. "1h 30m", "23 mins", "18m 24s")
 * - Client star ratings (1 to 5 stars) and deliberation feedback notes
 * - Dual persistence: Immediate local cache (localStorage) + Full cloud storage in PostgreSQL (Neon / Supabase)
 * - Real-time cross-device synchronization via Cloud API, BroadcastChannel & window events
 */

export const STORAGE_KEY_CONSULTATION_HISTORY = "mcpa_consultation_history";

/**
 * Format elapsed seconds into clean human-readable duration strings
 * e.g. 5400 -> "1h 30m", 1380 -> "23 mins", 84 -> "1m 24s", 45 -> "45s"
 */
export function formatMeetingDuration(seconds) {
  const sec = Math.max(0, parseInt(seconds, 10) || 0);
  if (sec === 0) return "< 1 min";
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins >= 5) {
    return `${mins} mins`;
  }
  if (mins > 0) {
    return remSec > 0 ? `${mins}m ${remSec}s` : `${mins} mins`;
  }
  return `${remSec}s`;
}

/**
 * Standard consultation history default (clean initial state, zero dummy sessions)
 */
export const DEFAULT_CONSULTATION_HISTORY = [];

const LEGACY_DUMMY_IDS = new Set([
  "hist-round-1-f2f",
  "hist-instant-setback-01",
  "hist-round-2-sched-mep",
]);

/**
 * Identify any seeded, mock, or synthetic dummy consultation sessions
 */
export function isDummyConsultationSession(item) {
  if (!item) return true;
  const id = String(item.id || item.sessionId || "").toLowerCase();
  const title = String(item.roundTitle || item.projectTitle || "").toLowerCase();
  const note = String(item.clientNote || item.notes || item.minutes || "").toLowerCase();
  const venue = String(item.venue || "").toLowerCase();

  // Genuine dynamically created sessions with real numeric timestamp IDs are preserved
  if (/^hist-\d{12,14}-[a-z0-9]+$/i.test(id)) {
    return false;
  }

  // Legacy or synthetic dummy IDs
  if (
    LEGACY_DUMMY_IDS.has(item.id) ||
    id === "hist-round-1-f2f" ||
    id === "hist-instant-setback-01" ||
    id === "hist-round-2-sched-mep" ||
    id.startsWith("hist-extra-") ||
    id.startsWith("hist-active-") ||
    id.includes("dummy")
  ) {
    return true;
  }

  // Known dummy titles from seed data
  if (
    title.includes("initial architectural scoping") ||
    title.includes("property setback & boundary") ||
    title.includes("engineering blueprint & mep") ||
    title.includes("architectural scoping") ||
    title.includes("property setback")
  ) {
    return true;
  }

  // Known dummy deliberation / feedback notes
  if (
    note.includes("very thorough") ||
    note.includes("immediate response from engineering") ||
    note.includes("immediate response...") ||
    note.includes("clear presentation of electrical") ||
    note.includes("clear presentation...") ||
    note.includes("rainwater harvesting") ||
    note.includes("perimeter boundary")
  ) {
    return true;
  }

  // Known dummy venues from early development mocks
  if (
    venue.includes("lounge 2b") ||
    venue.includes("meet.google.com/fvv-rdoo-wfn")
  ) {
    return true;
  }

  return false;
}

/**
 * Retrieve consultation history from localStorage with fallback defaults (Strictly isolated by clientEmail)
 */
export function getConsultationHistory(clientEmail) {
  if (typeof window === "undefined") return [];
  const normalizedEmail = (clientEmail || "").trim().toLowerCase();
  const scopedKey = normalizedEmail
    ? `${STORAGE_KEY_CONSULTATION_HISTORY}_${normalizedEmail}`
    : STORAGE_KEY_CONSULTATION_HISTORY;

  try {
    let raw = localStorage.getItem(scopedKey);
    // If scoped key is empty but global legacy key exists, extract only sessions matching this client
    if (!raw && normalizedEmail) {
      const globalRaw = localStorage.getItem(STORAGE_KEY_CONSULTATION_HISTORY);
      if (globalRaw) {
        try {
          const globalParsed = JSON.parse(globalRaw);
          if (Array.isArray(globalParsed)) {
            const clientOnly = globalParsed.filter((item) => {
              if (!item || isDummyConsultationSession(item)) return false;
              const em = (item.clientEmail || "").trim().toLowerCase();
              return em === normalizedEmail;
            });
            if (clientOnly.length > 0) {
              localStorage.setItem(scopedKey, JSON.stringify(clientOnly));
              raw = JSON.stringify(clientOnly);
            }
          }
        } catch (_) {}
      }
    }

    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    // Cleanse out dummy sessions and strictly enforce email isolation if clientEmail is present
    const cleaned = parsed.filter((item) => {
      if (!item || isDummyConsultationSession(item)) return false;
      if (normalizedEmail) {
        const itemEmail = (item.clientEmail || "").trim().toLowerCase();
        if (itemEmail && itemEmail !== normalizedEmail) return false;
      }
      return true;
    });

    if (cleaned.length !== parsed.length) {
      localStorage.setItem(scopedKey, JSON.stringify(cleaned));
      try {
        window.dispatchEvent(new CustomEvent("mcpa-meeting-history-updated", { detail: cleaned }));
      } catch (err) {}
    }
    return cleaned;
  } catch (e) {
    console.warn("[MCPA] Failed to load consultation history from localStorage:", e);
    return [];
  }
}

/**
 * Save updated list to localStorage (isolated by client) and broadcast event across local tabs
 */
export function saveConsultationHistory(items, clientEmail) {
  if (typeof window === "undefined") return;
  const normalizedEmail = (clientEmail || "").trim().toLowerCase();
  const scopedKey = normalizedEmail
    ? `${STORAGE_KEY_CONSULTATION_HISTORY}_${normalizedEmail}`
    : STORAGE_KEY_CONSULTATION_HISTORY;

  try {
    const safeItems = Array.isArray(items)
      ? items.filter((item) => {
          if (!item || isDummyConsultationSession(item)) return false;
          if (normalizedEmail) {
            const itemEmail = (item.clientEmail || "").trim().toLowerCase();
            if (itemEmail && itemEmail !== normalizedEmail) return false;
          }
          return true;
        })
      : [];

    localStorage.setItem(scopedKey, JSON.stringify(safeItems));
    window.dispatchEvent(new CustomEvent("mcpa-meeting-history-updated", { detail: safeItems, clientEmail: normalizedEmail }));
    window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: safeItems, clientEmail: normalizedEmail }));
  } catch (e) {
    console.warn("[MCPA] Failed to save consultation history:", e);
  }
}

/**
 * Fetch consultation history from Cloud Database (Neon / Supabase) with strict client isolation
 * Merges with local storage and notifies components
 */
export async function fetchConsultationHistoryFromCloud(clientEmail, { roomCode, projectCode } = {}) {
  if (typeof window === "undefined") return [];
  const normalizedEmail = (clientEmail || "").trim().toLowerCase();

  try {
    const params = new URLSearchParams();
    if (normalizedEmail) params.set("clientEmail", normalizedEmail);
    if (roomCode) params.set("roomCode", roomCode.trim());
    if (projectCode) params.set("projectCode", projectCode.trim());
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("mcpa_client_token") || localStorage.getItem("mcpa_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/meetings/history${queryString}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return getConsultationHistory(normalizedEmail);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.history)) {
      const cloudItems = data.history.filter((item) => {
        if (!item || isDummyConsultationSession(item)) return false;
        if (normalizedEmail) {
          const itemEmail = (item.clientEmail || "").trim().toLowerCase();
          const itemRoom = (item.roomCode || "").trim().toLowerCase();
          const itemProject = (item.projectCode || "").trim().toLowerCase();
          if (itemEmail && itemEmail === normalizedEmail) return true;
          if (roomCode && itemRoom && itemRoom === roomCode.trim().toLowerCase()) return true;
          if (projectCode && itemProject && itemProject === projectCode.trim().toLowerCase()) return true;
          // If neither matched and item has an email, it's not ours
          if (itemEmail && itemEmail !== normalizedEmail) return false;
        }
        return true;
      });

      // Merge with existing local items for this client only
      const localItems = getConsultationHistory(normalizedEmail);
      const sessionMap = new Map();

      // Cloud items take precedence
      cloudItems.forEach((item) => {
        const key = item.id || item.sessionId;
        if (key) sessionMap.set(key, item);
      });

      // Keep any local item not yet in cloud
      localItems.forEach((item) => {
        const key = item.id || item.sessionId;
        if (key && !sessionMap.has(key)) {
          sessionMap.set(key, item);
        }
      });

      const merged = Array.from(sessionMap.values());
      saveConsultationHistory(merged, normalizedEmail);
      return merged;
    }
  } catch (err) {
    console.warn("[MCPA] Cloud meeting history fetch fallback:", err.message);
  }
  return getConsultationHistory(normalizedEmail);
}

/**
 * Add a concluded meeting session (instant or scheduled)
 * Saves to local cache + POSTs to Cloud Database (Neon / Supabase)
 */
export function recordConcludedMeeting({
  roundTitle,
  mode = "Instant Online Meeting",
  durationSeconds = 0,
  rating = 5,
  clientNote = "",
  minutes = "",
  venue = "MCPA Online Room",
  leadConsultant = "Engr. Raymart Quirante",
  leadRole = "Lead Project Engineer & Consultant",
  actionItems = ["Consultation concluded and deliberation archived"],
  clientName = "Raymart Quirante",
  clientEmail = "martquirante@gmail.com",
  projectCode = "MCPA-2026-MQ04B",
  projectTitle = "Modern Tropical Residence",
  roomCode = null,
}) {
  const current = getConsultationHistory(clientEmail);
  const now = new Date();

  const phDateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });

  const phTimeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });

  const formattedDuration = formatMeetingDuration(durationSeconds);
  const sessionId = `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newSession = {
    id: sessionId,
    sessionId,
    roomCode,
    roundTitle:
      roundTitle ||
      (mode.toLowerCase().includes("instant")
        ? "Instant Video Consultation"
        : "Online Engineering Consultation"),
    date: now.toISOString().split("T")[0],
    displayDate: phDateStr,
    time: `${phTimeStr} PHT`,
    duration: formattedDuration,
    durationSeconds,
    mode,
    venue,
    leadConsultant,
    leadRole,
    clientName,
    clientEmail,
    projectCode,
    projectTitle,
    status: "Concluded",
    rating: typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : 5,
    clientNote:
      clientNote.trim() ||
      (mode.toLowerCase().includes("instant")
        ? "Instant consultation concluded with engineering team."
        : "Consultation finished successfully."),
    minutes:
      minutes.trim() ||
      `Deliberation session concluded. Duration: ${formattedDuration}. Client feedback: "${clientNote.trim() || "All specifications aligned."}"`,
    actionItems,
  };

  // 1. Optimistic local cache update for instant UI feedback
  const updated = [newSession, ...current.filter((item) => (item.id || item.sessionId) !== sessionId)];
  saveConsultationHistory(updated, clientEmail);

  // 2. Cloud Database persistence to PostgreSQL (Neon / Supabase)
  if (typeof window !== "undefined") {
    fetch("/api/meetings/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSession),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          // Replace optimistic item with server verified record
          const latest = getConsultationHistory(clientEmail).map((item) =>
            (item.id || item.sessionId) === sessionId ? { ...item, ...data.session } : item
          );
          saveConsultationHistory(latest, clientEmail);
        }
      })
      .catch((err) => {
        console.warn("[MCPA] Failed to sync concluded meeting to cloud database:", err.message);
      });
  }

  return newSession;
}

/**
 * Update rating and note for an existing meeting session
 * Updates local cache + PATCHes to Cloud Database (Neon / Supabase)
 */
export function updateMeetingRatingAndNote(sessionId, rating, clientNote, clientEmail) {
  const normalizedEmail = (clientEmail || "").trim().toLowerCase();
  const current = getConsultationHistory(normalizedEmail);
  const safeRating = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : 5;
  const safeNote = typeof clientNote === "string" ? clientNote.trim() : "";

  const updated = current.map((item) => {
    if ((item.id || item.sessionId) === sessionId) {
      return {
        ...item,
        rating: safeRating,
        clientNote: safeNote,
      };
    }
    return item;
  });

  saveConsultationHistory(updated, normalizedEmail);

  // Sync update to Cloud Database
  if (typeof window !== "undefined") {
    fetch(`/api/meetings/history/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: safeRating, clientNote: safeNote }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          const synced = getConsultationHistory(normalizedEmail).map((item) =>
            (item.id || item.sessionId) === sessionId ? { ...item, ...data.session } : item
          );
          saveConsultationHistory(synced, normalizedEmail);
        }
      })
      .catch((err) => {
        console.warn("[MCPA] Failed to update meeting rating in cloud database:", err.message);
      });
  }

  return updated;
}
