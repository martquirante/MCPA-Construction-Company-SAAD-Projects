const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");

class ConstructionController {
  // 1. SITE PROJECTS
  async getProject(req, res) {
    try {
      const code = req.params.code || "MCPA-PLR-2024";
      const projRes = await db.query("SELECT * FROM site_projects WHERE project_code = $1", [code]);
      if (!projRes.rows || projRes.rows.length === 0) {
        return res.status(404).json({ message: "Project not found." });
      }

      const milestonesRes = await db.query(
        "SELECT * FROM site_milestones WHERE project_code = $1 ORDER BY phase_code ASC",
        [code]
      );
      const photosRes = await db.query(
        "SELECT * FROM site_photo_logs WHERE project_code = $1 ORDER BY log_id DESC",
        [code]
      );
      const billingRes = await db.query(
        "SELECT * FROM billing_ledger WHERE project_code = $1 ORDER BY bill_id ASC",
        [code]
      );
      const delaysRes = await db.query(
        "SELECT * FROM delay_events WHERE project_code = $1 ORDER BY event_id DESC",
        [code]
      );
      const warrantyRes = await db.query(
        "SELECT * FROM warranty_tickets WHERE project_code = $1 ORDER BY reported_at DESC",
        [code]
      );
      const expensesRes = await db.query(
        "SELECT * FROM expenses_ocr WHERE project_code = $1 ORDER BY expense_id DESC",
        [code]
      );

      return res.json({
        success: true,
        project: projRes.rows[0],
        milestones: milestonesRes.rows || [],
        photos: photosRes.rows || [],
        billing: billingRes.rows || [],
        delays: delaysRes.rows || [],
        warranty: warrantyRes.rows || [],
        expenses: expensesRes.rows || [],
      });
    } catch (err) {
      console.error("[ConstructionController.getProject] Error:", err);
      return res.status(500).json({ message: "Failed to fetch project details: " + err.message });
    }
  }

  // 2. UPDATE MILESTONE PROGRESS
  async updateMilestone(req, res) {
    try {
      const { milestoneId } = req.params;
      const { completionPct, status, notes } = req.body;

      const result = await db.query(
        `UPDATE site_milestones 
         SET completion_pct = COALESCE($1, completion_pct),
             status = COALESCE($2, status),
             notes = COALESCE($3, notes)
         WHERE milestone_id = $4 RETURNING *`,
        [completionPct !== undefined ? completionPct : null, status || null, notes || null, parseInt(milestoneId, 10)]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Milestone not found." });
      }

      const updatedMs = result.rows[0];
      const projectCode = updatedMs.project_code;

      // Recalculate overall % accomplishment from all milestones
      const allMs = await db.query("SELECT completion_pct, weight FROM site_milestones WHERE project_code = $1", [projectCode]);
      if (allMs.rows && allMs.rows.length > 0) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const m of allMs.rows) {
          const w = m.weight || 20;
          totalWeight += w;
          weightedSum += (m.completion_pct || 0) * (w / 100);
        }
        const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
        await db.query("UPDATE site_projects SET progress_pct = $1 WHERE project_code = $2", [overall, projectCode]);
      }

      return res.json({ success: true, milestone: updatedMs, message: "Milestone updated." });
    } catch (err) {
      console.error("[ConstructionController.updateMilestone] Error:", err);
      return res.status(500).json({ message: "Failed to update milestone: " + err.message });
    }
  }

  // 3. ADD PHOTO LOG / 360 TOUR
  async addPhotoLog(req, res) {
    try {
      const { projectCode, title, caption, inspector, imageUrl, logDate, is360 } = req.body;
      if (!projectCode || !title || !imageUrl) {
        return res.status(400).json({ message: "projectCode, title, and imageUrl are required." });
      }

      const result = await db.query(
        `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          projectCode,
          title,
          caption || "",
          inspector || "Field Engineer",
          imageUrl,
          logDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          Boolean(is360),
        ]
      );

      return res.status(201).json({ success: true, log: result.rows[0], message: "Photo log registered." });
    } catch (err) {
      console.error("[ConstructionController.addPhotoLog] Error:", err);
      return res.status(500).json({ message: "Failed to add photo log: " + err.message });
    }
  }

  // 4. VERIFY BILLING PAYMENT & ISSUE DIGITAL OR
  async verifyPayment(req, res) {
    try {
      const { billId } = req.params;
      const { proofUrl } = req.body;

      const orNumber = `OR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const paidDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const result = await db.query(
        `UPDATE billing_ledger
         SET status = 'Paid',
             or_number = COALESCE(or_number, $1),
             proof_url = COALESCE($2, proof_url),
             paid_date = $3
         WHERE bill_id = $4 RETURNING *`,
        [orNumber, proofUrl || null, paidDate, parseInt(billId, 10)]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Billing entry not found." });
      }

      return res.json({
        success: true,
        entry: result.rows[0],
        message: `Payment verified. Digital Official Receipt ${result.rows[0].or_number} generated.`,
      });
    } catch (err) {
      console.error("[ConstructionController.verifyPayment] Error:", err);
      return res.status(500).json({ message: "Failed to verify payment: " + err.message });
    }
  }

  // 5. CLIENT UPLOAD PROOF OF PAYMENT
  async uploadPaymentProof(req, res) {
    try {
      const { billId } = req.params;
      const { proofUrl } = req.body;
      if (!proofUrl) {
        return res.status(400).json({ message: "Proof URL is required." });
      }

      const result = await db.query(
        "UPDATE billing_ledger SET proof_url = $1, status = 'Under Review' WHERE bill_id = $2 RETURNING *",
        [proofUrl, parseInt(billId, 10)]
      );

      return res.json({
        success: true,
        entry: result.rows[0],
        message: "Payment proof uploaded. Awaiting admin verification.",
      });
    } catch (err) {
      console.error("[ConstructionController.uploadPaymentProof] Error:", err);
      return res.status(500).json({ message: "Failed to upload proof: " + err.message });
    }
  }

  // 6. LOG DELAY EVENT (Critical Path Recalculation)
  async logDelay(req, res) {
    try {
      const { projectCode, category, daysDelayed, reason } = req.body;
      if (!projectCode || !category || !daysDelayed || !reason) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const result = await db.query(
        `INSERT INTO delay_events (project_code, category, days_delayed, reason)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [projectCode, category, parseInt(daysDelayed, 10), reason]
      );

      // Shift target turnover date on project
      const proj = await db.query("SELECT original_turnover, revised_turnover FROM site_projects WHERE project_code = $1", [projectCode]);
      if (proj.rows && proj.rows.length > 0) {
        const currentTarget = new Date(proj.rows[0].revised_turnover || proj.rows[0].original_turnover || Date.now());
        currentTarget.setDate(currentTarget.getDate() + parseInt(daysDelayed, 10));
        const newRevised = currentTarget.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        await db.query("UPDATE site_projects SET revised_turnover = $1 WHERE project_code = $2", [newRevised, projectCode]);
      }

      return res.status(201).json({
        success: true,
        delay: result.rows[0],
        message: `Delay logged (+${daysDelayed} days). Target turnover recalculated.`,
      });
    } catch (err) {
      console.error("[ConstructionController.logDelay] Error:", err);
      return res.status(500).json({ message: "Failed to log delay: " + err.message });
    }
  }

  // 7. WARRANTY TICKETS
  async submitWarrantyTicket(req, res) {
    try {
      const { projectCode, clientEmail, category, description, photoUrl } = req.body;
      if (!projectCode || !category || !description) {
        return res.status(400).json({ message: "Project code, category, and description are required." });
      }

      const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
      const result = await db.query(
        `INSERT INTO warranty_tickets (ticket_id, project_code, client_email, category, description, photo_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Open') RETURNING *`,
        [ticketId, projectCode, clientEmail || "client@mcpa.com", category, description, photoUrl || null]
      );

      return res.status(201).json({
        success: true,
        ticket: result.rows[0],
        message: `Warranty ticket ${ticketId} created. Technical repair team assigned.`,
      });
    } catch (err) {
      console.error("[ConstructionController.submitWarrantyTicket] Error:", err);
      return res.status(500).json({ message: "Failed to submit warranty ticket: " + err.message });
    }
  }

  async updateWarrantyStatus(req, res) {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const resolvedAt = status === "Resolved" ? new Date() : null;

      const result = await db.query(
        `UPDATE warranty_tickets 
         SET status = $1, resolved_at = COALESCE($2, resolved_at)
         WHERE ticket_id = $3 RETURNING *`,
        [status, resolvedAt, ticketId]
      );

      return res.json({ success: true, ticket: result.rows[0], message: `Ticket status updated to ${status}.` });
    } catch (err) {
      console.error("[ConstructionController.updateWarrantyStatus] Error:", err);
      return res.status(500).json({ message: "Failed to update warranty status: " + err.message });
    }
  }

  // 8. OCR EXPENSES LOGGING
  async logOcrExpense(req, res) {
    try {
      const { projectCode, vendorName, receiptImageUrl, extractedTotal, rawOcrText } = req.body;
      if (!projectCode || !extractedTotal) {
        return res.status(400).json({ message: "Project code and extracted total are required." });
      }

      const result = await db.query(
        `INSERT INTO expenses_ocr (project_code, vendor_name, receipt_image_url, extracted_total, raw_ocr_text)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [projectCode, vendorName || "Hardware Supply", receiptImageUrl || null, parseFloat(extractedTotal), rawOcrText || ""]
      );

      return res.status(201).json({
        success: true,
        expense: result.rows[0],
        message: "Expense logged successfully via OCR scanner.",
      });
    } catch (err) {
      console.error("[ConstructionController.logOcrExpense] Error:", err);
      return res.status(500).json({ message: "Failed to log OCR expense: " + err.message });
    }
  }
}

module.exports = new ConstructionController();
