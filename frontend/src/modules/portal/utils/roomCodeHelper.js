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
 * Normalizes any string to the standardized lowercase format
 */
export function formatRoomCode(raw) {
  if (!raw) return generateRoomCode();
  let clean = String(raw).trim().toLowerCase();
  
  // If it's a full URL, extract the path segment
  if (clean.includes("/meet/")) {
    const parts = clean.split("/meet/");
    clean = parts[parts.length - 1].split("?")[0].split("#")[0];
  } else if (clean.includes("meet.google.com/")) {
    const parts = clean.split("meet.google.com/");
    clean = `mcpa-${parts[parts.length - 1].split("?")[0].split("#")[0]}`;
  }

  // Strip unwanted characters except alphanumeric and hyphens
  clean = clean.replace(/[^a-z0-9-]/g, "");

  // If missing "mcpa-" prefix, add it
  if (!clean.startsWith("mcpa-")) {
    clean = `mcpa-${clean}`;
  }

  return clean;
}

/**
 * Validates if a code adheres to the MCPA room code specification
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toLowerCase();
  // mcpa-xxxx-xxxx or mcpa-xxxxxxxxx
  return /^mcpa-[a-z0-9]{3,8}(-[a-z0-9]{3,8})?$/.test(clean);
}

/**
 * Extracts a room code from a brief object, meeting link, or raw string
 */
export function extractRoomCode(briefOrLink) {
  if (!briefOrLink) return generateRoomCode();

  if (typeof briefOrLink === "object") {
    if (briefOrLink.meeting_room_code) return formatRoomCode(briefOrLink.meeting_room_code);
    if (briefOrLink.meetingRoomCode) return formatRoomCode(briefOrLink.meetingRoomCode);
    if (briefOrLink.meeting_link) return extractRoomCode(briefOrLink.meeting_link);
    if (briefOrLink.meetingLink) return extractRoomCode(briefOrLink.meetingLink);
    if (briefOrLink.room_code) return formatRoomCode(briefOrLink.room_code);
    if (briefOrLink.roomCode) return formatRoomCode(briefOrLink.roomCode);
    if (briefOrLink.submission_id) {
      // Deterministic fallback derived from submission ID
      const num = String(briefOrLink.submission_id).replace(/\D/g, "").slice(-4) || "2026";
      return `mcpa-inq-${num}`;
    }
  }

  return formatRoomCode(String(briefOrLink));
}

/**
 * Builds the canonical public shareable meeting URL
 */
export function buildMeetingUrl(roomCode, origin = "") {
  const code = formatRoomCode(roomCode);
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://mcpa-construction.vercel.app");
  return `${base}/meet/${code}`;
}
