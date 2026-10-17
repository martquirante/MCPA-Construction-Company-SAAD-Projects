const db = require("../services/dbFailoverEngine");
const webrtcSignalingService = require("../services/webrtcSignalingService");
const realtimeService = require("../services/realtimeService");

/**
 * Format elapsed seconds into clean human-readable duration strings
 */
function formatDuration(seconds) {
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
 * Maps PostgreSQL database row to client session object
 */
function mapRowToSession(row) {
  if (!row) return null;
  let parsedActions = [];
  if (row.action_items) {
    if (Array.isArray(row.action_items)) {
      parsedActions = row.action_items;
    } else if (typeof row.action_items === "string") {
      try {
        parsedActions = JSON.parse(row.action_items);
      } catch (_) {
        parsedActions = [row.action_items];
      }
    }
  }

  return {
    id: row.session_id,
    sessionId: row.session_id,
    historyId: row.history_id,
    roomCode: row.room_code,
    roundTitle: row.round_title,
    date: row.meeting_date,
    displayDate: row.display_date,
    time: row.meeting_time,
    duration: row.duration || "0s",
    durationSeconds: parseInt(row.duration_seconds, 10) || 0,
    mode: row.mode || "Instant Online Meeting",
    venue: row.venue || "MCPA Online Room",
    leadConsultant: row.lead_consultant || "Engr. Raymart Quirante",
    leadRole: row.lead_role || "Lead Project Engineer & Consultant",
    clientName: row.client_name || "Valued Client",
    clientEmail: row.client_email || "",
    projectCode: row.project_code || "MCPA-CONSULTATION",
    projectTitle: row.project_title || "Residential Consultation",
    status: row.status || "Concluded",
    rating: typeof row.rating === "number" ? row.rating : 5,
    clientNote: row.client_note || "",
    minutes: row.minutes || "",
    actionItems: parsedActions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class MeetingHistoryController {
  /**
   * GET /api/meetings/history
   * Retrieves concluded consultation sessions ordered by newest first.
   */
  async getAll(req, res) {
    try {
      const { clientEmail, limit = 100 } = req.query;

      let queryText = "SELECT * FROM meeting_history_logs";
      const queryParams = [];

      if (clientEmail && clientEmail.trim()) {
        queryParams.push(clientEmail.trim().toLowerCase());
        queryText += ` WHERE LOWER(client_email) = $${queryParams.length}`;
      }

      queryText += " ORDER BY created_at DESC, history_id DESC";

      const maxLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
      queryParams.push(maxLimit);
      queryText += ` LIMIT $${queryParams.length}`;

      const result = await db.query(queryText, queryParams);
      const history = (result.rows || []).map(mapRowToSession);

      return res.json({
        success: true,
        count: history.length,
        history,
      });
    } catch (err) {
      console.error("[MeetingHistoryController.getAll] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve meeting history logs: " + err.message,
        history: [],
      });
    }
  }

  /**
   * POST /api/meetings/history
   * Record or upsert a concluded meeting log into PostgreSQL (Supabase / Neon).
   */
  async recordConcluded(req, res) {
    try {
      const body = req.body || {};
      const sessionId =
        body.sessionId ||
        body.id ||
        `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const mode = body.mode || "Instant Online Meeting";
      const isInstant = mode.toLowerCase().includes("instant");

      const roundTitle =
        body.roundTitle ||
        (isInstant ? "Instant Online Consultation" : "Online Video Engineering Review");

      const now = new Date();
      const meetingDate = body.meetingDate || body.date || now.toISOString().split("T")[0];

      const displayDate =
        body.displayDate ||
        now.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Manila",
        });

      const meetingTime =
        body.meetingTime ||
        body.time ||
        `${now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila",
        })} PHT`;

      const durationSeconds = Math.max(0, parseInt(body.durationSeconds, 10) || 0);
      const duration = body.duration || formatDuration(durationSeconds);

      const rating =
        typeof body.rating === "number" ? Math.max(1, Math.min(5, body.rating)) : 5;

      const clientNote =
        (body.clientNote || "").trim() ||
        (isInstant
          ? "Instant consultation concluded with engineering team."
          : "Consultation session concluded.");

      const minutes =
        (body.minutes || "").trim() ||
        `Deliberation session concluded. Duration: ${duration}. Feedback: "${clientNote}"`;

      const actionItems = Array.isArray(body.actionItems)
        ? body.actionItems
        : ["Consultation concluded and deliberation archived"];

      const queryText = `
        INSERT INTO meeting_history_logs (
          session_id, room_code, round_title, meeting_date, display_date, meeting_time,
          duration, duration_seconds, mode, venue, lead_consultant, lead_role,
          client_name, client_email, project_code, project_title, status, rating,
          client_note, minutes, action_items, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        )
        ON CONFLICT (session_id) DO UPDATE SET
          room_code = COALESCE(EXCLUDED.room_code, meeting_history_logs.room_code),
          round_title = EXCLUDED.round_title,
          duration = EXCLUDED.duration,
          duration_seconds = EXCLUDED.duration_seconds,
          rating = EXCLUDED.rating,
          client_note = EXCLUDED.client_note,
          minutes = EXCLUDED.minutes,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        sessionId,
        body.roomCode || null,
        roundTitle,
        meetingDate,
        displayDate,
        meetingTime,
        duration,
        durationSeconds,
        mode,
        body.venue || "MCPA Online Room",
        body.leadConsultant || "Engr. Raymart Quirante",
        body.leadRole || "Lead Project Engineer & Consultant",
        body.clientName || "Valued Client",
        body.clientEmail || "",
        body.projectCode || "MCPA-CONSULTATION",
        body.projectTitle || "Residential Consultation",
        body.status || "Concluded",
        rating,
        clientNote,
        minutes,
        JSON.stringify(actionItems),
      ];

      const result = await db.query(queryText, values);
      const savedSession = mapRowToSession(result.rows[0]);

      // Broadcast real-time event to all connected websockets / tabs
      try {
        if (webrtcSignalingService?.io) {
          webrtcSignalingService.io.emit("mcpa-meeting-history-updated", savedSession);
        }
      } catch (_) {}

      try {
        if (realtimeService?.broadcast) {
          realtimeService.broadcast({
            type: "MEETING_HISTORY_LOGGED",
            session: savedSession,
          });
        }
      } catch (_) {}

      return res.status(201).json({
        success: true,
        message: "Concluded meeting logged to database successfully.",
        session: savedSession,
      });
    } catch (err) {
      console.error("[MeetingHistoryController.recordConcluded] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to record concluded meeting: " + err.message,
      });
    }
  }

  /**
   * PATCH /api/meetings/history/:sessionId
   * Update client star rating and deliberation feedback note
   */
  async updateRatingAndNote(req, res) {
    try {
      const { sessionId } = req.params;
      const { rating, clientNote, minutes } = req.body || {};

      if (!sessionId) {
        return res.status(400).json({ success: false, message: "Session ID is required." });
      }

      const parsedRating =
        typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : null;

      const queryText = `
        UPDATE meeting_history_logs
        SET rating = COALESCE($1, rating),
            client_note = COALESCE($2, client_note),
            minutes = COALESCE($3, minutes),
            updated_at = NOW()
        WHERE session_id = $4 OR history_id = (CASE WHEN $4 ~ '^[0-9]+$' THEN $4::int ELSE -1 END)
        RETURNING *;
      `;

      const result = await db.query(queryText, [
        parsedRating,
        clientNote !== undefined ? clientNote.trim() : null,
        minutes !== undefined ? minutes.trim() : null,
        sessionId,
      ]);

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Meeting session "${sessionId}" not found.`,
        });
      }

      const updatedSession = mapRowToSession(result.rows[0]);

      // Broadcast update
      try {
        if (webrtcSignalingService?.io) {
          webrtcSignalingService.io.emit("mcpa-meeting-history-updated", updatedSession);
        }
      } catch (_) {}

      return res.json({
        success: true,
        message: "Meeting rating and feedback notes updated in cloud database.",
        session: updatedSession,
      });
    } catch (err) {
      console.error("[MeetingHistoryController.updateRatingAndNote] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update meeting rating: " + err.message,
      });
    }
  }

  /**
   * DELETE /api/meetings/history/:sessionId
   * Admin-only deletion or purge of a meeting history log
   */
  async delete(req, res) {
    try {
      const { sessionId } = req.params;
      const result = await db.query(
        "DELETE FROM meeting_history_logs WHERE session_id = $1 OR history_id = (CASE WHEN $1 ~ '^[0-9]+$' THEN $1::int ELSE -1 END) RETURNING *;",
        [sessionId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Meeting log not found." });
      }

      return res.json({
        success: true,
        message: "Meeting history log removed from database.",
      });
    } catch (err) {
      console.error("[MeetingHistoryController.delete] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new MeetingHistoryController();
