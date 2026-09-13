const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");

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
      } = req.body;

      if (!clientName || !clientEmail) {
        return res.status(400).json({ message: "Client name and email are required." });
      }

      const id = submissionId || `MCPA-${Date.now().toString().slice(-6)}`;

      const result = await db.query(
        `INSERT INTO client_briefs (
          submission_id, client_name, client_email, client_phone,
          project_type, preferred_style, budget_range, lot_status,
          lot_area, target_date, location, financing_option,
          uploaded_files, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Consultation Review')
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
        ]
      );

      return res.status(201).json({
        success: true,
        brief: result.rows[0],
        message: "Consultation brief registered successfully.",
      });
    } catch (err) {
      console.error("[BriefsController.submit] Error:", err);
      return res.status(500).json({ message: "Failed to submit brief: " + err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const result = await db.query(
        "UPDATE client_briefs SET status = $1 WHERE brief_id = $2 RETURNING *",
        [status, parseInt(id, 10)]
      );

      return res.json({
        success: true,
        brief: result.rows[0],
        message: "Brief status updated.",
      });
    } catch (err) {
      console.error("[BriefsController.updateStatus] Error:", err);
      return res.status(500).json({ message: "Failed to update brief status: " + err.message });
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
