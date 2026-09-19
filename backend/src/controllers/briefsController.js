const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const bcrypt = require("bcryptjs");

class BriefsController {
  async getAll(req, res) {
    try {
      const result = await db.query("SELECT * FROM client_briefs ORDER BY brief_id DESC");
      return res.json({ success: true, briefs: result.rows || [] });
    } catch (err) {
      console.error("[BriefsController.getAll] Error:", err);
      return res.status(500).json({ message: "Failed to fetch client briefs: " + err.message });
    }
  }

  async submit(req, res) {
    try {
      const {
        submissionId,
        clientName,
        clientEmail,
        clientPhone,
        projectType,
        preferredStyle,
        budgetRange,
        lotStatus,
        lotArea,
        targetDate,
        location,
        financingOption,
        uploadedFiles,
        locationType,
        meetingMode,
        meetingDate,
        meetingTime,
        mapCoordinates,
      } = req.body;

      if (!clientName || !clientEmail) {
        return res.status(400).json({ message: "Client name and email are required." });
      }

      const id = submissionId || `MCPA-CPB-${Math.floor(100000 + Math.random() * 900000)}`;

      const result = await db.query(
        `INSERT INTO client_briefs (
          submission_id, client_name, client_email, client_phone,
          project_type, preferred_style, budget_range, lot_status,
          lot_area, target_date, location, financing_option,
          uploaded_files, status, location_type, meeting_mode,
          meeting_date, meeting_time, map_coordinates
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          id,
          clientName,
          clientEmail,
          clientPhone || "",
          projectType || "Residential Design & Build",
          preferredStyle || "",
          budgetRange || "Flexible",
          lotStatus || "Already Owned / Titled",
          lotArea || "",
          targetDate || "Within 3 Months",
          location || "Bulacan",
          financingOption || "Milestone Progress Billing",
          uploadedFiles || [],
          locationType || "Local",
          meetingMode || "Online Meeting (Google Meet)",
          meetingDate || "",
          meetingTime || "",
          mapCoordinates || "",
        ]
      );

      return res.status(201).json({
        success: true,
        brief: result.rows[0],
        message: "Consultation brief registered successfully with status: Pending Review.",
      });
    } catch (err) {
      console.error("[BriefsController.submit] Error:", err);
      return res.status(500).json({ message: "Failed to submit brief: " + err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        meetingDate,
        meetingTime,
        meetingLink,
        meetingNotes,
        quotationAmount,
        quotationNotes,
        clientPortalCode,
      } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const result = await db.query(
        `UPDATE client_briefs SET 
          status = $1,
          meeting_date = COALESCE($2, meeting_date),
          meeting_time = COALESCE($3, meeting_time),
          meeting_link = COALESCE($4, meeting_link),
          meeting_notes = COALESCE($5, meeting_notes),
          quotation_amount = COALESCE($6, quotation_amount),
          quotation_notes = COALESCE($7, quotation_notes),
          client_portal_code = COALESCE($8, client_portal_code)
        WHERE brief_id = $9 RETURNING *`,
        [
          status,
          meetingDate || null,
          meetingTime || null,
          meetingLink || null,
          meetingNotes || null,
          quotationAmount || null,
          quotationNotes || null,
          clientPortalCode || null,
          parseInt(id, 10),
        ]
      );

      return res.json({
        success: true,
        brief: result.rows[0],
        message: `Brief updated to '${status}'.`,
      });
    } catch (err) {
      console.error("[BriefsController.updateStatus] Error:", err);
      return res.status(500).json({ message: "Failed to update brief status: " + err.message });
    }
  }

  async provisionAccess(req, res) {
    try {
      const { id } = req.params;
      const briefRes = await db.query("SELECT * FROM client_briefs WHERE brief_id = $1", [parseInt(id, 10)]);
      if (!briefRes.rows || briefRes.rows.length === 0) {
        return res.status(404).json({ message: "Brief not found." });
      }
      const brief = briefRes.rows[0];
      const portalCode = `MCPA-${brief.client_name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Update brief with code
      await db.query("UPDATE client_briefs SET client_portal_code = $1, status = 'Approved / Accepted' WHERE brief_id = $2", [portalCode, parseInt(id, 10)]);

      // Create client account in users table if not existing
      const existingUser = await db.query("SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)", [brief.client_email]);
      if (!existingUser.rows || existingUser.rows.length === 0) {
        const tempPass = portalCode.toLowerCase();
        const hashed = await bcrypt.hash(tempPass, 10);
        await db.query(
          "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'client')",
          [brief.client_email, hashed, brief.client_name]
        );
      }

      return res.json({
        success: true,
        portalCode,
        clientEmail: brief.client_email,
        message: "Client Portal access credentials generated successfully.",
      });
    } catch (err) {
      console.error("[BriefsController.provisionAccess] Error:", err);
      return res.status(500).json({ message: "Failed to provision access: " + err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await db.query("DELETE FROM client_briefs WHERE brief_id = $1", [parseInt(id, 10)]);
      return res.json({ success: true, message: "Client brief removed." });
    } catch (err) {
      console.error("[BriefsController.delete] Error:", err);
      return res.status(500).json({ message: "Failed to delete brief: " + err.message });
    }
  }
}

module.exports = new BriefsController();
