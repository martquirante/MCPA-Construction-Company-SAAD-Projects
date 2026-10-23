/**
 * Standardized Room Code Helper for MCPA Construction & Supply
 * 
 * Enforces the canonical room code format: `mcpa-xxxx-xxxx`
 * (e.g., `mcpa-arch-2026`, `mcpa-k9dp-8192`, `mcpa-bld4-7721`)
 */

const ADJECTIVES_OR_NOUNS = [
  "arch", "bld", "plan", "site", "view", "deck", "beam", "stud",
  "grid", "post", "join", "form", "core", "tier", "span", "plot"
];

/**
 * Generates a memorable, unique canonical room code in `mcpa-xxxx-xxxx` format
 * Example: `mcpa-arch-8192` or `mcpa-k9d2-4418`
 */
export function generateRoomCode() {
  const prefix = ADJECTIVES_OR_NOUNS[Math.floor(Math.random() * ADJECTIVES_OR_NOUNS.length)];
  const numPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `mcpa-${prefix}-${numPart}`;
}

/**
 * Checks if a string is a physical street address or venue description
 */
export function isPhysicalAddress(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim().toLowerCase();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.includes("/meet/") ||
    s.includes("meet.google.com") ||
    s.includes("meet.jit.si") ||
    s.includes("zoom.us")
  ) {
    return false;
  }
  if (s.includes(",") || (s.match(/\s/g) || []).length >= 2 || s.length > 25) {
    if (
      s.includes("rd") ||
      s.includes("road") ||
      s.includes("st") ||
      s.includes("street") ||
      s.includes("ave") ||
      s.includes("avenue") ||
      s.includes("hwy") ||
      s.includes("highway") ||
      s.includes("blvd") ||
      s.includes("bulacan") ||
      s.includes("plaridel") ||
      s.includes("manila") ||
      s.includes("brgy") ||
      s.includes("barangay") ||
      s.includes("city") ||
      s.includes("bldg") ||
      s.includes("office") ||
      s.includes("valley") ||
      s.includes("cagayan") ||
      s.includes("tabang") ||
      s.includes("lot") ||
      s.includes("blk") ||
      s.includes("phase")
    ) {
      return true;
    }
    if ((s.match(/\s/g) || []).length >= 3) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes any string to the standardized lowercase format
 */
export function formatRoomCode(raw) {
  if (!raw) return "mcpa-arch-2026";
  if (isPhysicalAddress(raw)) return "mcpa-arch-2026";
  let clean = String(raw).trim().toLowerCase();
  
  // If it's a full URL, extract the path segment
  if (clean.includes("/meet/")) {
    const parts = clean.split("/meet/");
    clean = parts[parts.length - 1].split("?")[0].split("#")[0];
  } else if (clean.includes("meet.google.com/")) {
    const parts = clean.split("meet.google.com/");
    clean = `mcpa-${parts[parts.length - 1].split("?")[0].split("#")[0]}`;
  } else if (clean.includes("meet.jit.si/")) {
    const parts = clean.split("meet.jit.si/");
    clean = `mcpa-${parts[parts.length - 1].split("?")[0].split("#")[0]}`;
  }

  // Strip unwanted characters except alphanumeric and hyphens
  clean = clean.replace(/[^a-z0-9-]/g, "");

  // If missing "mcpa-" prefix, add it
  if (!clean.startsWith("mcpa-")) {
    clean = `mcpa-${clean}`;
  }

  if (clean === "mcpa-" || clean.length < 6) {
    clean = "mcpa-arch-2026";
  }

  if (clean.length > 28) {
    clean = clean.slice(0, 24);
  }

  return clean;
}

/**
 * Validates if a code adheres to the MCPA room code specification
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toLowerCase();
  return /^mcpa-[a-z0-9-]+$/.test(clean) && clean.length >= 7 && clean.length <= 32;
}

/**
 * Extracts a room code from a brief object, meeting link, or raw string
 */
export function extractRoomCode(briefOrLink) {
  if (!briefOrLink) return "mcpa-arch-2026";

  if (typeof briefOrLink === "object") {
    // 1. Authoritative: Derive from Submission ID / Project Code / Tracking ID (100% deterministic per project/inquiry)
    const rawId =
      briefOrLink.submission_id ||
      briefOrLink.submissionId ||
      briefOrLink.project_code ||
      briefOrLink.projectCode ||
      briefOrLink.tracking_id ||
      briefOrLink.trackingId ||
      briefOrLink.brief_id ||
      briefOrLink.inquiry_id;

    if (rawId) {
      const cleanSub = String(rawId).toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (cleanSub.startsWith("mcpa-")) return cleanSub;
      return `mcpa-${cleanSub}`;
    }

    // 2. Explicit clean room code
    if (briefOrLink.meeting_room_code && !isPhysicalAddress(briefOrLink.meeting_room_code)) {
      return formatRoomCode(briefOrLink.meeting_room_code);
    }
    if (briefOrLink.meetingRoomCode && !isPhysicalAddress(briefOrLink.meetingRoomCode)) {
      return formatRoomCode(briefOrLink.meetingRoomCode);
    }
    if (briefOrLink.room_code && !isPhysicalAddress(briefOrLink.room_code)) {
      return formatRoomCode(briefOrLink.room_code);
    }
    if (briefOrLink.roomCode && !isPhysicalAddress(briefOrLink.roomCode)) {
      return formatRoomCode(briefOrLink.roomCode);
    }

    // 3. Real meeting URL (only if actual URL and not physical address)
    const link = briefOrLink.meeting_link || briefOrLink.meetingLink;
    if (link && typeof link === "string" && !isPhysicalAddress(link)) {
      const isRealUrl =
        link.startsWith("http://") ||
        link.startsWith("https://") ||
        link.includes("/meet/") ||
        link.includes("meet.google.com") ||
        link.includes("meet.jit.si") ||
        link.includes("zoom.us");
      if (isRealUrl) {
        return extractRoomCode(link);
      }
    }

    // 4. Fallback to generic id property
    if (briefOrLink.id) {
      const cleanId = String(briefOrLink.id).toLowerCase().replace(/[^a-z0-9-]/g, "");
      return cleanId.startsWith("mcpa-") ? cleanId : `mcpa-${cleanId}`;
    }

    return "mcpa-arch-2026";
  }

  const str = String(briefOrLink).trim();
  if (str === "[object Object]" || !str || isPhysicalAddress(str)) {
    return "mcpa-arch-2026";
  }

  return formatRoomCode(str);
}

/**
 * Builds the canonical public shareable meeting URL
 */
export function buildMeetingUrl(roomCode, origin = "") {
  const code = formatRoomCode(roomCode);
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://mcpa-construction.vercel.app");
  return `${base}/meet/${code}`;
}

export const ROOM_EXPIRY_GRACE_MS = 5 * 60 * 1000; // 5 minutes after call ends
const CONCLUDED_ROOMS_STORAGE_KEY = "mcpa_concluded_rooms";

/**
 * Records the timestamp when a room's call ended so it expires 5 minutes later
 */
export function markRoomConcluded(roomCode, endedAt = Date.now()) {
  if (typeof window === "undefined" || !roomCode) return;
  try {
    const code = formatRoomCode(roomCode);
    const raw = localStorage.getItem(CONCLUDED_ROOMS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[code] = endedAt;
    localStorage.setItem(CONCLUDED_ROOMS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
}

/**
 * Clears the concluded timestamp if a room is rejoined within the 5-minute window or restarted
 */
export function clearRoomConcluded(roomCode) {
  if (typeof window === "undefined" || !roomCode) return;
  try {
    const code = formatRoomCode(roomCode);
    const raw = localStorage.getItem(CONCLUDED_ROOMS_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    if (map && code in map) {
      delete map[code];
      localStorage.setItem(CONCLUDED_ROOMS_STORAGE_KEY, JSON.stringify(map));
    }
  } catch (e) {}
}

/**
 * Evaluates whether a room has expired (5 minutes after call ended)
 */
export function getRoomExpiryState(roomCode, serverStatus = null) {
  const code = formatRoomCode(roomCode);
  const now = Date.now();

  // 1. Check authoritative server status if provided
  if (serverStatus && (serverStatus.endedAt || serverStatus.isExpired)) {
    const endedAt = Number(serverStatus.endedAt) || now - ROOM_EXPIRY_GRACE_MS;
    const expiresAt = Number(serverStatus.expiresAt) || endedAt + ROOM_EXPIRY_GRACE_MS;
    const remainingMs = Math.max(0, expiresAt - now);
    return {
      hasEnded: true,
      isExpired: Boolean(serverStatus.isExpired || now >= expiresAt),
      endedAt,
      expiresAt,
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  // If server says there are active participants currently in the room, it is not expired
  if (serverStatus && Number(serverStatus.currentCount) > 0) {
    return {
      hasEnded: false,
      isExpired: false,
      endedAt: null,
      expiresAt: null,
      remainingMs: null,
      remainingSeconds: null,
    };
  }

  // 2. Check local concluded rooms registry
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CONCLUDED_ROOMS_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const endedAt = Number(map?.[code] || 0);
      if (endedAt > 0) {
        const expiresAt = endedAt + ROOM_EXPIRY_GRACE_MS;
        const remainingMs = Math.max(0, expiresAt - now);
        return {
          hasEnded: true,
          isExpired: now >= expiresAt,
          endedAt,
          expiresAt,
          remainingMs,
          remainingSeconds: Math.ceil(remainingMs / 1000),
        };
      }
    } catch (e) {}
  }

  return {
    hasEnded: false,
    isExpired: false,
    endedAt: null,
    expiresAt: null,
    remainingMs: null,
    remainingSeconds: null,
  };
}

