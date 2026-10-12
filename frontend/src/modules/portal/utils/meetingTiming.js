/**
 * Meeting Timing & Lifecycle Utilities
 * Authoritative date/time calculation for:
 * - 12h pre-meeting confirmation (Face-to-Face)
 * - 6h pre-meeting confirmation (Online Video)
 * - 15m room unlocking (Online Video)
 * - "ONGOING" status during scheduled session
 * - Post-meeting conclusion detection
 */

/**
 * Parses date string (e.g. "2026-10-22" or "Thursday, Oct 15, 2026")
 * and slot string (e.g. "02:00 PM - 03:30 PM PHT" or "10:00 AM - 11:30 AM PHT")
 * into JavaScript Date instances.
 */
export function parseMeetingWindow(dateStr, timeSlotStr) {
  if (!dateStr) return { start: null, end: null, isValid: false };

  // 1. Normalize Date to YYYY-MM-DD
  let yyyyMmDd = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    yyyyMmDd = dateStr.trim();
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      yyyyMmDd = `${year}-${month}-${day}`;
    } else {
      // Fallback default
      yyyyMmDd = "2026-10-22";
    }
  }

  // 2. Parse time slot (e.g. "02:00 PM - 03:30 PM")
  const defaultSlot = timeSlotStr || "10:00 AM - 11:30 AM PHT";
  const parts = defaultSlot.split("-").map((s) => s.trim());
  const startRaw = parts[0] || "10:00 AM";
  const endRaw = parts[1] || "11:30 AM";

  function parseTimePart(baseDateStr, timeString) {
    const clean = timeString.replace(/PHT|GMT\+8|UTC/gi, "").trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return new Date(`${baseDateStr}T10:00:00+08:00`);

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridian = (match[3] || "").toUpperCase();

    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return new Date(`${baseDateStr}T${hh}:${mm}:00+08:00`);
  }

  const start = parseTimePart(yyyyMmDd, startRaw);
  const end = parseTimePart(yyyyMmDd, endRaw);

  return {
    start,
    end,
    isValid: !isNaN(start.getTime()) && !isNaN(end.getTime()),
  };
}

/**
 * Evaluates the live meeting status and permissions given current time
 */
export function getMeetingLifecycleState(meetingInfo, now = new Date()) {
  const isOnline = Boolean(
    (meetingInfo?.mode || "").toLowerCase().includes("online") ||
    (meetingInfo?.mode || "").toLowerCase().includes("video")
  );
  const isF2F = !isOnline;

  const { start, end, isValid } = parseMeetingWindow(meetingInfo?.date, meetingInfo?.time);

  if (!isValid || !start || !end) {
    return {
      statusLabel: meetingInfo?.status || "Scheduled",
      isOngoing: false,
      isRoomUnlocked: isOnline,
      isPast: false,
      needsConfirmation: false,
      hoursUntilStart: 999,
      minutesUntilStart: 999,
      attendanceConfirmed: Boolean(meetingInfo?.attendanceConfirmed),
    };
  }

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const msUntilStart = startMs - nowMs;
  const minutesUntilStart = Math.round(msUntilStart / (1000 * 60));
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

  const isOngoing = nowMs >= startMs && nowMs <= endMs;
  const isPast = nowMs > endMs;

  // Online Room unlocks 15 minutes before meeting starts until it ends
  const isRoomUnlocked = isOnline && (nowMs >= startMs - 15 * 60 * 1000) && !isPast;

  // Attendance confirmation needed window:
  // F2F: 12 hours before meeting
  // Online: 6 hours before meeting
  const confirmationThresholdHours = isF2F ? 12 : 6;
  const attendanceConfirmed = Boolean(meetingInfo?.attendanceConfirmed);
  const needsConfirmation = !attendanceConfirmed && !isPast && hoursUntilStart <= confirmationThresholdHours && hoursUntilStart >= -1.5;

  let statusLabel = "Scheduled";
  if (isPast) {
    statusLabel = meetingInfo?.outcome ? "Completed" : "Awaiting Meeting Minutes";
  } else if (isOngoing) {
    statusLabel = "Ongoing Meeting";
  } else if (isRoomUnlocked) {
    statusLabel = "Room Ready";
  } else if (attendanceConfirmed) {
    statusLabel = "Attendance Confirmed";
  } else if (needsConfirmation) {
    statusLabel = isF2F ? "Confirm Attendance (12h Pre-Meeting)" : "Confirm Attendance (6h Pre-Meeting)";
  }

  return {
    statusLabel,
    isOngoing,
    isRoomUnlocked,
    isPast,
    needsConfirmation,
    hoursUntilStart,
    minutesUntilStart,
    attendanceConfirmed,
    isF2F,
    isOnline,
    startTime: start,
    endTime: end,
    confirmationThresholdHours,
  };
}
