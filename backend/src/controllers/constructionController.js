const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");

class ConstructionController {
  // 1. SITE PROJECTS
  async getProject(req, res) {
    try {
      const requestedCode = req.params.code || req.query.code;
      const clientEmail = req.query.email;
      let projRes;

      if (requestedCode) {
        projRes = await db.query(
          `SELECT 
            sp.*,
            COALESCE(u.avatar_url, NULL) AS avatar_url,
            COALESCE(u.full_name, sp.client_name) AS client_name,
            COALESCE(u.email, sp.client_email) AS client_email,
            COALESCE(cp.project_title, sp.name) AS project_title,
            cp.stage_id
           FROM site_projects sp
           LEFT JOIN client_projects cp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
           LEFT JOIN users u ON sp.user_id = u.user_id OR cp.user_id = u.user_id OR LOWER(u.email) = LOWER(sp.client_email)
           WHERE sp.project_code = $1`,
          [requestedCode]
        );
      } else if (clientEmail) {
        projRes = await db.query(
          `SELECT 
            sp.*,
            COALESCE(u.avatar_url, NULL) AS avatar_url,
            COALESCE(u.full_name, sp.client_name) AS client_name,
            COALESCE(u.email, sp.client_email) AS client_email,
            COALESCE(cp.project_title, sp.name) AS project_title,
            cp.stage_id
           FROM site_projects sp
           LEFT JOIN client_projects cp ON sp.client_project_id = cp.client_project_id OR sp.project_code = cp.site_project_code
           LEFT JOIN users u ON sp.user_id = u.user_id OR cp.user_id = u.user_id OR LOWER(u.email) = LOWER(sp.client_email)
           WHERE LOWER(sp.client_email) = LOWER($1)
           ORDER BY CASE WHEN cp.stage_id = 'ACTIVE_BUILD' THEN 1 WHEN cp.stage_id = 'COMPLETED' THEN 2 ELSE 3 END, sp.project_id DESC
           LIMIT 1`,
          [clientEmail]
        );
      } else {
        projRes = await db.query(
          `SELECT 
            sp.*,
            COALESCE(u.avatar_url, NULL) AS avatar_url,
            COALESCE(u.full_name, sp.client_name) AS client_name,
            COALESCE(u.email, sp.client_email) AS client_email,
            COALESCE(cp.project_title, sp.name) AS project_title,
            cp.stage_id
           FROM site_projects sp
           LEFT JOIN client_projects cp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
           LEFT JOIN users u ON sp.user_id = u.user_id OR cp.user_id = u.user_id OR LOWER(u.email) = LOWER(sp.client_email)
           ORDER BY sp.project_id DESC LIMIT 1`
        );
      }

      if (!projRes.rows || projRes.rows.length === 0) {
        return res.json({
          success: true,
          project: null,
          milestones: [],
          photos: [],
          billing: [],
          delays: [],
          warranty: [],
          expenses: [],
        });
      }

      const activeProject = projRes.rows[0];
      const code = activeProject.project_code;

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
        project: activeProject,
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

  // 3. ADD PHOTO LOG / MULTI-MEDIA PROGRESS UPDATE
  async addPhotoLog(req, res) {
    try {
      const { projectCode, title, caption, inspector, imageUrl, logDate, is360, mediaType, mediaItems } = req.body;
      if (!projectCode || !title) {
        return res.status(400).json({ message: "projectCode and title are required." });
      }

      const resolvedLogDate = logDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const resolvedInspector = inspector || "Field Engineer";
      const resolvedCaption = caption || "";

      // Support multi-media array if supplied
      if (Array.isArray(mediaItems) && mediaItems.length > 0) {
        const insertedLogs = [];
        for (const item of mediaItems) {
          const itemUrl = typeof item === "string" ? item : item.url || item.imageUrl;
          if (!itemUrl) continue;
          const itemMediaType = item.mediaType || (itemUrl.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i) ? "video" : "image");
          const itemIs360 = Boolean(item.is360);

          const r = await db.query(
            `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360, media_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [projectCode, title, resolvedCaption, resolvedInspector, itemUrl, resolvedLogDate, itemIs360, itemMediaType]
          );
          if (r.rows[0]) insertedLogs.push(r.rows[0]);
        }
        return res.status(201).json({ success: true, logs: insertedLogs, log: insertedLogs[0], message: `${insertedLogs.length} media logs registered.` });
      }

      // Single item fallback
      if (!imageUrl) {
        return res.status(400).json({ message: "imageUrl or mediaItems is required." });
      }

      const resolvedMediaType = mediaType || (imageUrl.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i) ? "video" : "image");

      const result = await db.query(
        `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360, media_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          projectCode,
          title,
          resolvedCaption,
          resolvedInspector,
          imageUrl,
          resolvedLogDate,
          Boolean(is360),
          resolvedMediaType,
        ]
      );

      return res.status(201).json({ success: true, log: result.rows[0], logs: [result.rows[0]], message: "Photo log registered." });
    } catch (err) {
      console.error("[ConstructionController.addPhotoLog] Error:", err);
      return res.status(500).json({ message: "Failed to add photo log: " + err.message });
    }
  }

  // DELETE PHOTO / VIDEO LOG
  async deletePhotoLog(req, res) {
    try {
      const { logId } = req.params;
      await db.query("DELETE FROM site_photo_logs WHERE log_id = $1", [parseInt(logId, 10)]);
      return res.json({ success: true, message: "Photo log deleted." });
    } catch (err) {
      console.error("[ConstructionController.deletePhotoLog] Error:", err);
      return res.status(500).json({ message: "Failed to delete photo log: " + err.message });
    }
  }

  // 4. VERIFY BILLING PAYMENT & ISSUE DIGITAL OR
  async verifyPayment(req, res) {
    try {
      const { billId } = req.params;
      const { proofUrl } = req.body || {};

      // 1. Check if billing entry exists
      const checkResult = await db.query(
        "SELECT * FROM billing_ledger WHERE bill_id = $1",
        [parseInt(billId, 10)]
      );

      if (!checkResult.rows || checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Billing entry not found." });
      }

      const existingBill = checkResult.rows[0];
      const finalProofUrl = (proofUrl || existingBill.proof_url || "").trim();

      // Business rule: Proof of payment must exist before payment can be verified and OR issued
      if (!finalProofUrl) {
        return res.status(400).json({
          success: false,
          message: "Cannot verify payment: Proof of payment (deposit slip / transaction receipt) must be uploaded before issuing an Official Receipt (OR).",
        });
      }

      const orNumber = `OR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const paidDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const result = await db.query(
        `UPDATE billing_ledger
         SET status = 'Paid',
             or_number = COALESCE(or_number, $1),
             proof_url = $2,
             paid_date = $3
         WHERE bill_id = $4 RETURNING *`,
        [orNumber, finalProofUrl, paidDate, parseInt(billId, 10)]
      );

      return res.json({
        success: true,
        entry: result.rows[0],
        message: `Payment verified. Digital Official Receipt ${result.rows[0].or_number} generated.`,
      });
    } catch (err) {
      console.error("[ConstructionController.verifyPayment] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to verify payment: " + err.message });
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

  // 9. GET ALL STAGE 3 CLIENT PROJECTS FOR ADMIN COMBOBOX
  async getStage3Projects(req, res) {
    try {
      const result = await db.query(
        `SELECT 
          cp.client_project_id,
          cp.project_code,
          cp.project_title,
          cp.project_type,
          COALESCE(cp.target_location, sp.location) AS target_location,
          cp.stage_id,
          cp.created_at,
          u.user_id,
          COALESCE(u.full_name, sp.client_name, 'Client') AS client_name,
          COALESCE(u.email, sp.client_email, 'No email') AS client_email,
          u.avatar_url,
          sp.project_id AS site_project_id,
          COALESCE(sp.progress_pct, 0) AS progress_pct,
          COALESCE(sp.current_phase, 'Mobilization & Earthworks') AS current_phase,
          sp.lead_engineer,
          sp.virtual_tour_url,
          sp.contract_date,
          sp.original_turnover,
          sp.revised_turnover
        FROM public.client_projects cp
        LEFT JOIN public.users u ON cp.user_id = u.user_id
        LEFT JOIN public.site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id OR sp.project_code = cp.site_project_code
        WHERE cp.stage_id = 'ACTIVE_BUILD' AND (cp.is_archived IS FALSE OR cp.is_archived IS NULL)
        ORDER BY cp.client_project_id DESC`
      );

      return res.json({
        success: true,
        projects: result.rows || [],
      });
    } catch (err) {
      console.error("[ConstructionController.getStage3Projects] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch Stage 3 projects: " + err.message });
    }
  }

  // 10. CREATE NEW MILESTONE (M1, M2, M3...)
  async createMilestone(req, res) {
    try {
      const { projectCode, phaseCode, phaseName, notes, targetDate, weight } = req.body;
      if (!projectCode || !phaseCode || !phaseName) {
        return res.status(400).json({ success: false, message: "projectCode, phaseCode, and phaseName are required." });
      }

      const result = await db.query(
        `INSERT INTO site_milestones (project_code, phase_code, phase_name, notes, target_date, weight, completion_pct, status)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 'Upcoming')
         RETURNING *`,
        [projectCode, phaseCode, phaseName, notes || "", targetDate || null, parseInt(weight || 20, 10)]
      );

      return res.status(201).json({ success: true, milestone: result.rows[0], message: "Milestone created successfully." });
    } catch (err) {
      console.error("[ConstructionController.createMilestone] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to create milestone: " + err.message });
    }
  }

  // 11. DELETE MILESTONE
  async deleteMilestone(req, res) {
    try {
      const { milestoneId } = req.params;
      const getMs = await db.query("SELECT project_code FROM site_milestones WHERE milestone_id = $1", [parseInt(milestoneId, 10)]);
      if (!getMs.rows || getMs.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Milestone not found." });
      }
      const projectCode = getMs.rows[0].project_code;

      await db.query("DELETE FROM site_milestones WHERE milestone_id = $1", [parseInt(milestoneId, 10)]);

      // Recalculate overall progress
      const allMs = await db.query("SELECT completion_pct, weight FROM site_milestones WHERE project_code = $1", [projectCode]);
      let totalWeight = 0;
      let weightedSum = 0;
      for (const m of (allMs.rows || [])) {
        const w = m.weight || 20;
        totalWeight += w;
        weightedSum += (m.completion_pct || 0) * (w / 100);
      }
      const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
      await db.query("UPDATE site_projects SET progress_pct = $1 WHERE project_code = $2", [overall, projectCode]);

      return res.json({ success: true, message: "Milestone deleted." });
    } catch (err) {
      console.error("[ConstructionController.deleteMilestone] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to delete milestone: " + err.message });
    }
  }

  // 12. UPDATE 3D VIRTUAL TOUR / WALKTHROUGH VIDEO
  async updateVirtualTour(req, res) {
    try {
      const { projectCode, virtualTourUrl } = req.body;
      if (!projectCode) {
        return res.status(400).json({ success: false, message: "projectCode is required." });
      }
      const result = await db.query(
        "UPDATE site_projects SET virtual_tour_url = $1 WHERE project_code = $2 RETURNING *",
        [virtualTourUrl || null, projectCode]
      );
      return res.json({ success: true, project: result.rows ? result.rows[0] : null, message: "3D virtual walkthrough tour updated." });
    } catch (err) {
      console.error("[ConstructionController.updateVirtualTour] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to update virtual tour: " + err.message });
    }
  }

  // 13. CREATE BILLING TRANCHE
  async createBillingTranche(req, res) {
    try {
      const { projectCode, milestoneTitle, amountDue, dueDate } = req.body;
      if (!projectCode || !milestoneTitle || !amountDue) {
        return res.status(400).json({ success: false, message: "projectCode, milestoneTitle, and amountDue are required." });
      }
      const result = await db.query(
        `INSERT INTO billing_ledger (project_code, milestone_title, amount_due, due_date, status)
         VALUES ($1, $2, $3, $4, 'Pending')
         RETURNING *`,
        [projectCode, milestoneTitle, parseFloat(amountDue), dueDate || null]
      );
      return res.status(201).json({ success: true, billing: result.rows[0], message: "Billing tranche created." });
    } catch (err) {
      console.error("[ConstructionController.createBillingTranche] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to create billing tranche: " + err.message });
    }
  }

  // 14. GET EXPENSES FOR PROJECT
  async getProjectExpenses(req, res) {
    try {
      const { code } = req.params;
      const result = await db.query(
        "SELECT * FROM expenses_ocr WHERE project_code = $1 ORDER BY expense_id DESC",
        [code]
      );
      return res.json({ success: true, expenses: result.rows || [] });
    } catch (err) {
      console.error("[ConstructionController.getProjectExpenses] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch expenses: " + err.message });
    }
  }
}

module.exports = new ConstructionController();
