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

function isPhysicalAddress(str) {
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

function formatRoomCode(raw) {
  if (!raw) return generateRoomCode();
  if (isPhysicalAddress(raw)) return generateRoomCode();
  let clean = String(raw).trim().toLowerCase();
  
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

  clean = clean.replace(/[^a-z0-9-]/g, "");
  if (!clean.startsWith("mcpa-")) {
    clean = `mcpa-${clean}`;
  }

  if (clean.length > 28) {
    clean = clean.slice(0, 24);
  }

  return clean;
}

function isValidRoomCode(code) {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toLowerCase();
  return /^mcpa-[a-z0-9-]+$/.test(clean) && clean.length >= 7 && clean.length <= 32;
}

function extractRoomCode(briefOrLink) {
  if (!briefOrLink) return generateRoomCode();

  if (typeof briefOrLink === "object") {
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

    const rawId =
      briefOrLink.submission_id ||
      briefOrLink.submissionId ||
      briefOrLink.trackingId ||
      briefOrLink.tracking_id ||
      briefOrLink.projectCode ||
      briefOrLink.project_code ||
      briefOrLink.brief_id ||
      briefOrLink.inquiry_id ||
      briefOrLink.id;

    if (rawId) {
      const cleanSub = String(rawId).toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (cleanSub.startsWith("mcpa-")) return cleanSub;
      return `mcpa-${cleanSub}`;
    }

    return generateRoomCode();
  }

  const str = String(briefOrLink).trim();
  if (str === "[object Object]" || !str || isPhysicalAddress(str)) {
    return generateRoomCode();
  }

  return formatRoomCode(str);
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
  isValidRoomCode,
  isPhysicalAddress,
};
