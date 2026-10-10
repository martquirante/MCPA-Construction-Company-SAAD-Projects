/**
 * Utility functions for Consultation Meeting date/time evaluation.
 */

/**
 * Checks if a given meeting date and time is in the past.
 * Handles ISO dates (YYYY-MM-DD), formatted dates, and time slot ranges (e.g. "04:00 PM - 05:30 PM PHT").
 *
 * @param {string} dateStr - e.g. "2026-10-10" or "Oct 10, 2026"
 * @param {string} timeStr - e.g. "04:00 PM - 05:30 PM PHT"
 * @returns {boolean} true if meeting end time is earlier than current time
 */
export function isMeetingPast(dateStr, timeStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const lowerDate = dateStr.toLowerCase().trim();
  if (
    lowerDate.includes("earliest") ||
    lowerDate.includes("pending") ||
    lowerDate.includes("tbd") ||
    lowerDate.includes("none")
  ) {
    return false;
  }

  try {
    let year, month, day;
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
    } else {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return false;
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth();
      day = parsedDate.getDate();
    }

    let hour = 23;
    let minute = 59;

    if (timeStr && typeof timeStr === "string") {
      // Find all times like "04:00 PM", "5:30pm", "17:00"
      const times = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/gi);
      if (times && times.length > 0) {
        // Prefer the end time of the slot range (last matched time)
        const targetTime = times[times.length - 1];
        const m = targetTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (m) {
          let h = parseInt(m[1], 10);
          const min = parseInt(m[2], 10);
          const ampm = m[3] ? m[3].toUpperCase() : null;
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          hour = h;
          minute = min;
        }
      }
    }

    const meetingEndTimestamp = new Date(year, month, day, hour, minute, 0).getTime();
    return Date.now() > meetingEndTimestamp;
  } catch (_) {
    return false;
  }
}
