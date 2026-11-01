const db = require("../services/dbFailoverEngine");

// Ensure calendar_events table exists
let tableChecked = false;
async function ensureCalendarTable() {
  if (tableChecked) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.calendar_events (
        event_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'operations',
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50),
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        priority VARCHAR(20) DEFAULT 'standard',
        location VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tableChecked = true;
  } catch (err) {
    console.warn("[CALENDAR] Table check warning:", err.message);
  }
}

/**
 * Calculates Philippine national holidays and Bulacan provincial holidays
 */
function getPhilippineHolidaysForYear(year) {
  const y = parseInt(year, 10) || new Date().getFullYear();

  // Helper for formatting YYYY-MM-DD
  const fmt = (m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return [
    // Regular National Holidays
    {
      id: `ph-ny-${y}`,
      title: "New Year's Day",
      date: fmt(1, 1),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Closed · Worker Holiday Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-kagitingan-${y}`,
      title: "Araw ng Kagitingan (Day of Valor)",
      date: fmt(4, 9),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Operations Paused · Double Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-labor-${y}`,
      title: "Labor Day",
      date: fmt(5, 1),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Standstill · Labor Holiday Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-independence-${y}`,
      title: "Philippine Independence Day",
      date: fmt(6, 12),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-heroes-${y}`,
      title: "National Heroes Day",
      date: fmt(8, 31), // Last Monday of August approximation / standard
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-bonifacio-${y}`,
      title: "Bonifacio Day",
      date: fmt(11, 30),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-xmas-${y}`,
      title: "Christmas Day",
      date: fmt(12, 25),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Closed · Holiday Pay",
      isHoliday: true,
      priority: "high",
    },
    {
      id: `ph-rizal-${y}`,
      title: "Rizal Day",
      date: fmt(12, 30),
      category: "holiday",
      type: "Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      isHoliday: true,
      priority: "standard",
    },

    // Special Non-Working Days
    {
      id: `ph-ninoy-${y}`,
      title: "Ninoy Aquino Day",
      date: fmt(8, 21),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Site Work · 130% Rate",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-saints-${y}`,
      title: "All Saints' Day (Undas)",
      date: fmt(11, 1),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Site Closed · Undas Observance",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-souls-${y}`,
      title: "All Souls' Day",
      date: fmt(11, 2),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Operations · 130% Rate",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-conception-${y}`,
      title: "Feast of the Immaculate Conception",
      date: fmt(12, 8),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Operations · 130% Rate",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-xmas-eve-${y}`,
      title: "Christmas Eve",
      date: fmt(12, 24),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Half-Day Site Operations",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-nye-${y}`,
      title: "New Year's Eve",
      date: fmt(12, 31),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Half-Day Site Operations",
      isHoliday: true,
      priority: "standard",
    },

    // Bulacan Provincial Festivities (MCPA Head Office & Central Luzon Hub)
    {
      id: `ph-bulacan-day-${y}`,
      title: "Araw ng Lalawigan ng Bulacan",
      date: fmt(8, 15),
      category: "holiday",
      type: "Bulacan Local Special Holiday",
      siteStatus: "Local Government Holiday · Provincial Standstill",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-singkaban-${y}`,
      title: "Singkaban Festival (Bulacan Culture Week)",
      date: fmt(9, 8),
      category: "holiday",
      type: "Bulacan Cultural Observance",
      siteStatus: "Normal Site Work · Heavy Provincial Traffic Advisory",
      isHoliday: true,
      priority: "standard",
    },
  ];
}

class CalendarController {
  async getEvents(req, res) {
    try {
      await ensureCalendarTable();
      const result = await db.query(
        "SELECT * FROM calendar_events ORDER BY start_date ASC, start_time ASC"
      );
      return res.json({
        success: true,
        events: result.rows || [],
      });
    } catch (err) {
      console.error("[CALENDAR] getEvents error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async createEvent(req, res) {
    try {
      await ensureCalendarTable();
      const {
        title,
        category = "operations",
        startDate,
        endDate,
        startTime,
        endTime,
        priority = "standard",
        location = "",
        notes = "",
      } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({
          success: false,
          error: "Title and startDate are required fields.",
        });
      }

      const createdBy = req.user?.fullName || req.user?.email || "Admin";

      const insertRes = await db.query(
        `INSERT INTO calendar_events (
          title, category, start_date, end_date, start_time, end_time,
          priority, location, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          title.trim(),
          category,
          startDate,
          endDate || startDate,
          startTime || "",
          endTime || "",
          priority,
          location.trim(),
          notes.trim(),
          createdBy,
        ]
      );

      return res.status(201).json({
        success: true,
        event: insertRes.rows[0],
      });
    } catch (err) {
      console.error("[CALENDAR] createEvent error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateEvent(req, res) {
    try {
      await ensureCalendarTable();
      const { id } = req.params;
      const {
        title,
        category,
        startDate,
        endDate,
        startTime,
        endTime,
        priority,
        location,
        notes,
      } = req.body;

      const updateRes = await db.query(
        `UPDATE calendar_events SET
          title = COALESCE($1, title),
          category = COALESCE($2, category),
          start_date = COALESCE($3, start_date),
          end_date = COALESCE($4, end_date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          priority = COALESCE($7, priority),
          location = COALESCE($8, location),
          notes = COALESCE($9, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $10
        RETURNING *`,
        [
          title,
          category,
          startDate,
          endDate,
          startTime,
          endTime,
          priority,
          location,
          notes,
          parseInt(id, 10),
        ]
      );

      if (updateRes.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }

      return res.json({
        success: true,
        event: updateRes.rows[0],
      });
    } catch (err) {
      console.error("[CALENDAR] updateEvent error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      await ensureCalendarTable();
      const { id } = req.params;
      await db.query("DELETE FROM calendar_events WHERE event_id = $1", [
        parseInt(id, 10),
      ]);
      return res.json({ success: true, message: "Event removed successfully" });
    } catch (err) {
      console.error("[CALENDAR] deleteEvent error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getBirthdays(req, res) {
    try {
      const usersRes = await db.query(`
        SELECT user_id, full_name, email, role, birth_date, avatar_url, phone_number
        FROM users
        WHERE birth_date IS NOT NULL AND birth_date != ''
      `);

      const birthdays = (usersRes.rows || []).map((u) => ({
        id: `bday-${u.user_id}`,
        userId: u.user_id,
        name: u.full_name || "Staff Member",
        role: u.role || "Staff",
        email: u.email || "",
        phone: u.phone_number || "",
        avatarUrl: u.avatar_url || "",
        birthDate: u.birth_date,
      }));

      return res.json({
        success: true,
        birthdays,
      });
    } catch (err) {
      console.error("[CALENDAR] getBirthdays error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  getPhilippineHolidays(req, res) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const holidays = getPhilippineHolidaysForYear(year);
      return res.json({
        success: true,
        year: parseInt(year, 10),
        holidays,
      });
    } catch (err) {
      console.error("[CALENDAR] getPhilippineHolidays error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new CalendarController();

