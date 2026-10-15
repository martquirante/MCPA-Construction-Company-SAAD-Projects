/**
 * Standardized Room Code Helper for MCPA Backend
 */

const ADJECTIVES_OR_NOUNS = [
  "arch", "bld", "plan", "site", "view", "deck", "beam", "stud",
  "grid", "post", "join", "form", "core", "tier", "span", "plot"
];

function generateRoomCode() {
  const prefix = ADJECTIVES_OR_NOUNS[Math.floor(Math.random() * ADJECTIVES_OR_NOUNS.length)];
  const numPart = Math.floor(1000 + Math.random() * 9000);
  return `mcpa-${prefix}-${numPart}`;
}

function formatRoomCode(raw) {
  if (!raw) return generateRoomCode();
  let clean = String(raw).trim().toLowerCase();
  
  if (clean.includes("/meet/")) {
    const parts = clean.split("/meet/");
    clean = parts[parts.length - 1].split("?")[0].split("#")[0];
  } else if (clean.includes("meet.google.com/")) {
    const parts = clean.split("meet.google.com/");
    clean = `mcpa-${parts[parts.length - 1].split("?")[0].split("#")[0]}`;
  }

  clean = clean.replace(/[^a-z0-9-]/g, "");
  if (!clean.startsWith("mcpa-")) {
    clean = `mcpa-${clean}`;
  }
  return clean;
}

function extractRoomCode(briefOrLink) {
  if (!briefOrLink) return generateRoomCode();

  if (typeof briefOrLink === "object") {
    if (briefOrLink.meeting_room_code) return formatRoomCode(briefOrLink.meeting_room_code);
    if (briefOrLink.meetingRoomCode) return formatRoomCode(briefOrLink.meetingRoomCode);
    if (briefOrLink.meeting_link) return extractRoomCode(briefOrLink.meeting_link);
    if (briefOrLink.meetingLink) return extractRoomCode(briefOrLink.meetingLink);
    if (briefOrLink.room_code) return formatRoomCode(briefOrLink.room_code);
    if (briefOrLink.roomCode) return formatRoomCode(briefOrLink.roomCode);
    if (briefOrLink.submission_id) {
      const num = String(briefOrLink.submission_id).replace(/\D/g, "").slice(-4) || "2026";
      return `mcpa-inq-${num}`;
    }
  }

  return formatRoomCode(String(briefOrLink));
}

function buildMeetingUrl(roomCode) {
  const code = formatRoomCode(roomCode);
  return `https://mcpa-construction.vercel.app/meet/${code}`;
}

module.exports = {
  generateRoomCode,
  formatRoomCode,
  extractRoomCode,
  buildMeetingUrl,
};
