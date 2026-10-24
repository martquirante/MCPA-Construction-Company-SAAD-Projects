const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const stageEngineService = require("../services/stageEngineService");
const { ensureStage4Schema } = require("../services/stage4Schema");

/**
 * Checks whether a given target turnover date string has arrived (date <= today).
 */
function isDateReached(dateStr) {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return targetDay <= today;
}

/**
 * Checks whether a given target turnover date string is strictly today (same calendar day).
 */
function isDateToday(dateStr) {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return targetDay.getTime() === today.getTime();
}

/**
 * Formats a date string nicely (e.g. "Oct 24, 2026").
 */
function formatTurnoverDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Returns the count of completion-tagged photo logs for a project.
 */
async function getCompletionMediaCount(projectCode) {
  if (!projectCode) return 0;
  try {
    const result = await db.query(
      "SELECT COUNT(*) AS count FROM site_photo_logs WHERE project_code = $1 AND category = 'completion'",
      [projectCode]
    );
    return parseInt(result.rows[0]?.count || 0, 10);
  } catch (err) {
    console.warn(`[getCompletionMediaCount] Query warning for ${projectCode}:`, err.message);
    return 0;
  }
}

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
            cp.stage_id,
            COALESCE(cp.client_project_id, sp.client_project_id) AS client_project_id,
            cp.groundbreaking_date,
            cp.groundbreaking_status
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
            cp.stage_id,
            COALESCE(cp.client_project_id, sp.client_project_id) AS client_project_id,
            cp.groundbreaking_date,
            cp.groundbreaking_status
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
            cp.stage_id,
            COALESCE(cp.client_project_id, sp.client_project_id) AS client_project_id,
            cp.groundbreaking_date,
            cp.groundbreaking_status
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
          expenses: [],
        });
      }

      const activeProject = projRes.rows[0];
      const code = activeProject.project_code;

      // Automatically advance to Stage 4 (COMPLETED) if scheduled turnover date has arrived, progress is >= 90%, and at least 3 completion photos exist
      if (activeProject.stage_id === "ACTIVE_BUILD" && (activeProject.progress_pct || 0) >= 90) {
        const targetTurnover = activeProject.revised_turnover || activeProject.original_turnover;
        if (targetTurnover && isDateReached(targetTurnover)) {
          const completionCount = await getCompletionMediaCount(code);
          if (completionCount < 3) {
            console.warn(`[getProject] Auto-advance held for ${code}: Only ${completionCount}/3 completion photos uploaded.`);
          } else {
            try {
              await stageEngineService.advanceProjectStage({
                projectId: activeProject.client_project_id || activeProject.project_code,
                targetStage: "COMPLETED",
                reason: `Automated turnover transition: Scheduled date (${targetTurnover}) reached with ${activeProject.progress_pct}% accomplishment and ${completionCount} verified completion photos.`,
              });
              activeProject.stage_id = "COMPLETED";
              activeProject.progress_pct = 100;
              activeProject.status = "Completed & Handover";
            } catch (autoErr) {
              console.warn(`[getProject] Auto-advance notice for ${code}:`, autoErr.message);
            }
          }
        }
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
      const { projectCode, title, caption, inspector, imageUrl, logDate, is360, mediaType, mediaItems, category } = req.body;
      if (!projectCode || !title) {
        return res.status(400).json({ message: "projectCode and title are required." });
      }

      const resolvedLogDate = logDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const resolvedInspector = inspector || "Field Engineer";
      const resolvedCaption = caption || "";
      const resolvedCategory = (category === "completion") ? "completion" : "progress";

      // Stamp the build's current accomplishment on every log so Stage 4 can
      // pick the >= 90% completion photos for the Showcase and Wrapped collages.
      let resolvedProgress = null;
      const explicitProgress = Number(req.body.progressPct);
      if (Number.isFinite(explicitProgress) && req.body.progressPct !== "" && req.body.progressPct !== null) {
        resolvedProgress = Math.max(0, Math.min(100, Math.round(explicitProgress)));
      } else {
        const progRes = await db.query("SELECT progress_pct FROM site_projects WHERE project_code = $1 LIMIT 1", [projectCode]);
        const livePct = progRes.rows?.[0]?.progress_pct;
        resolvedProgress = livePct === null || livePct === undefined ? null : Math.max(0, Math.min(100, Number(livePct)));
      }
      await ensureStage4Schema();

      // Support multi-media array if supplied
      if (Array.isArray(mediaItems) && mediaItems.length > 0) {
        const insertedLogs = [];
        for (const item of mediaItems) {
          const itemUrl = typeof item === "string" ? item : item.url || item.imageUrl;
          if (!itemUrl) continue;
          const itemMediaType = item.mediaType || (itemUrl.match(/\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i) ? "video" : "image");
          const itemIs360 = Boolean(item.is360);
          const itemCategory = item.category || resolvedCategory;

          const r = await db.query(
            `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360, media_type, progress_pct, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [projectCode, title, resolvedCaption, resolvedInspector, itemUrl, resolvedLogDate, itemIs360, itemMediaType, resolvedProgress, itemCategory]
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
        `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360, media_type, progress_pct, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          projectCode,
          title,
          resolvedCaption,
          resolvedInspector,
          imageUrl,
          resolvedLogDate,
          Boolean(is360),
          resolvedMediaType,
          resolvedProgress,
          resolvedCategory,
        ]
      );

      return res.status(201).json({ success: true, log: result.rows[0], logs: [result.rows[0]], message: "Photo log registered." });
    } catch (err) {
      console.error("[ConstructionController.addPhotoLog] Error:", err);
      return res.status(500).json({ message: "Failed to add photo log: " + err.message });
    }
  }

  // DELETE PHOTO / VIDEO LOG (supports single ID or comma-separated batch)
  async deletePhotoLog(req, res) {
    try {
      const { logId } = req.params;
      const ids = String(logId || "")
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((n) => !isNaN(n));

      if (ids.length === 0) {
        return res.status(400).json({ message: "Invalid logId provided." });
      }

      await db.query("DELETE FROM site_photo_logs WHERE log_id = ANY($1::int[])", [ids]);
      return res.json({ success: true, message: `${ids.length} photo log(s) deleted.` });
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
          cp.groundbreaking_date,
          cp.groundbreaking_status,
          u.user_id,
          COALESCE(u.full_name, sp.client_name, 'Client') AS client_name,
          COALESCE(u.email, sp.client_email, 'No email') AS client_email,
          u.avatar_url,
          sp.project_id AS site_project_id,
          COALESCE(sp.progress_pct, 0) AS progress_pct,
          COALESCE(sp.current_phase, 'Mobilization & Earthworks') AS current_phase,
          sp.lead_engineer,
          sp.virtual_tour_url,
          sp.virtual_tour_urls,
          sp.contract_date,
          sp.original_turnover,
          sp.revised_turnover,
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'milestone_id', sm.milestone_id,
                'phase_code', sm.phase_code,
                'phase_name', sm.phase_name,
                'completion_pct', COALESCE(sm.completion_pct, 0),
                'status', sm.status,
                'weight', sm.weight
              )
              ORDER BY sm.phase_code ASC
            )
            FROM public.site_milestones sm
            WHERE sm.project_code = cp.project_code
          ), '[]'::json) AS milestones
        FROM public.client_projects cp
        LEFT JOIN public.users u ON cp.user_id = u.user_id
        LEFT JOIN public.site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id OR sp.project_code = cp.site_project_code
        WHERE cp.stage_id IN ('ACTIVE_BUILD', 'COMPLETED') AND (cp.is_archived IS FALSE OR cp.is_archived IS NULL)
        ORDER BY CASE WHEN cp.stage_id = 'ACTIVE_BUILD' THEN 1 ELSE 2 END, cp.client_project_id DESC`
      );

      // Auto-advance any project where scheduled turnover date has arrived, progress is >= 90%, and at least 3 completion photos exist
      if (result.rows && result.rows.length > 0) {
        for (const row of result.rows) {
          if (row.stage_id === "ACTIVE_BUILD" && (row.progress_pct || 0) >= 90) {
            const tDate = row.revised_turnover || row.original_turnover;
            if (tDate && isDateReached(tDate)) {
              const compCount = await getCompletionMediaCount(row.project_code);
              if (compCount < 3) {
                console.warn(`[getStage3Projects] Auto-advance held for ${row.project_code}: Only ${compCount}/3 completion photos uploaded.`);
                continue;
              }
              try {
                await stageEngineService.advanceProjectStage({
                  projectId: row.client_project_id,
                  targetStage: "COMPLETED",
                  reason: `Automated turnover transition: Scheduled date (${tDate}) reached with ${row.progress_pct}% accomplishment and ${compCount} verified completion photos.`,
                });
                row.stage_id = "COMPLETED";
                row.progress_pct = 100;
              } catch (autoErr) {
                console.warn(`[getStage3Projects] Auto-advance error for ${row.project_code}:`, autoErr.message);
              }
            }
          }
        }
      }

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
      const { projectCode, virtualTourUrl, virtualTourUrls } = req.body;
      if (!projectCode) {
        return res.status(400).json({ success: false, message: "projectCode is required." });
      }

      let resolvedSingleUrl = virtualTourUrl || null;
      let jsonTourUrls = null;

      if (Array.isArray(virtualTourUrls)) {
        jsonTourUrls = JSON.stringify(virtualTourUrls);
        if (!resolvedSingleUrl && virtualTourUrls.length > 0) {
          const first = virtualTourUrls[0];
          resolvedSingleUrl = typeof first === "string" ? first : first.url;
        }
      } else if (virtualTourUrl) {
        resolvedSingleUrl = virtualTourUrl;
        jsonTourUrls = JSON.stringify([{ url: virtualTourUrl, title: "Full 3D Architectural Walk-Around Tour" }]);
      }

      const result = await db.query(
        `UPDATE site_projects 
         SET virtual_tour_url = COALESCE($1, virtual_tour_url),
             virtual_tour_urls = COALESCE($2::jsonb, virtual_tour_urls)
         WHERE project_code = $3 
         RETURNING *`,
        [resolvedSingleUrl, jsonTourUrls, projectCode]
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

  // 15. UPDATE TURNOVER SCHEDULE OR EXECUTE IMMEDIATE TURNOVER (STAGE 4)
  async updateTurnoverSchedule(req, res) {
    try {
      const code = req.params.code || req.body.projectCode;
      const { turnoverDate, notes, venue, action } = req.body || {};
      const adminUserId = req.user?.userId || req.user?.user_id;

      if (!code) {
        return res.status(400).json({ success: false, message: "projectCode is required." });
      }

      // 1. Fetch current project & site details
      const projRes = await db.query(
        `SELECT cp.client_project_id, cp.project_code, cp.stage_id, cp.project_title,
                sp.project_id, COALESCE(sp.progress_pct, 0) AS progress_pct,
                sp.original_turnover, sp.revised_turnover, sp.status
         FROM public.client_projects cp
         LEFT JOIN public.site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
         WHERE cp.project_code = $1 OR cp.client_project_id::text = $1 OR sp.project_code = $1
         LIMIT 1`,
        [code]
      );

      if (!projRes.rows || projRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Project not found." });
      }

      const proj = projRes.rows[0];
      const currentPct = parseInt(proj.progress_pct || 0, 10);

      // Business Rule: Turnover is only unlocked once progress reaches at least 90%
      if (currentPct < 90) {
        return res.status(400).json({
          success: false,
          message: `Turnover cannot be scheduled or executed yet. A minimum of 90% project accomplishment is required (Current: ${currentPct}%).`,
        });
      }

      // Completion Media Gate: At least 3 finished/completion photos must be uploaded
      const completionCount = await getCompletionMediaCount(proj.project_code);
      if (completionCount < 3) {
        return res.status(400).json({
          success: false,
          message: `Turnover gate locked: At least 3 finished project photos must be uploaded under the 'completion' category before turnover can be scheduled or executed (Current: ${completionCount}/3).`,
          completionMediaCount: completionCount,
          completionMediaRequired: 3,
        });
      }

      const isTurnoverNow = action === "turnover_now";

      if (!isTurnoverNow && !turnoverDate) {
        return res.status(400).json({ success: false, message: "Turnover date is required." });
      }

      let selectedDay = null;
      let today = null;
      if (turnoverDate) {
        const targetDateObj = new Date(turnoverDate);
        if (isNaN(targetDateObj.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid turnover date format." });
        }
        const now = new Date();
        today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        selectedDay = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate());

        // Strict validation: Reject past dates when scheduling a date
        if (!isTurnoverNow && selectedDay < today) {
          return res.status(400).json({
            success: false,
            message: "Past dates cannot be selected for turnover. Please select today or a future date.",
          });
        }
      }

      const isScheduledForToday = Boolean(selectedDay && today && selectedDay.getTime() === today.getTime());

      // Path A: Immediate Turn Over or Scheduled Date is strictly Today -> Promote to Stage 4 immediately
      if (isTurnoverNow || isScheduledForToday) {
        const advanced = await stageEngineService.advanceProjectStage({
          projectId: proj.client_project_id,
          targetStage: "COMPLETED",
          adminUserId,
          reason: isTurnoverNow
            ? "100% Construction Accomplishment & Immediate Turnkey Handover to Stage 4"
            : `Scheduled turnover date (${turnoverDate}) reached & formal ceremonial handover`,
          metadata: {
            turnoverDate: turnoverDate || new Date().toISOString().split("T")[0],
            venue: venue || "On-site Build Site",
            notes: notes || "Formal key turnover and project handover.",
          },
        });

        const todayFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const resolvedTurnoverDate = turnoverDate ? formatTurnoverDate(turnoverDate) : todayFormatted;

        await db.query(
          `UPDATE public.site_projects
           SET revised_turnover = COALESCE($1, revised_turnover, $2),
               status = 'Completed & Handover',
               progress_pct = 100
           WHERE project_code = $3 OR client_project_id = $4`,
          [resolvedTurnoverDate, todayFormatted, proj.project_code, proj.client_project_id]
        );

        return res.json({
          success: true,
          isStage4: true,
          project: advanced,
          revised_turnover: resolvedTurnoverDate,
          message: "Project completed. Completion photos were synced to Showcase as a draft and the client's Wrapped is ready.",
        });
      }

      // Path B: Scheduling or Rescheduling for a future date (selectedDay > today)
      const formatted = formatTurnoverDate(turnoverDate);

      await db.query(
        `UPDATE public.site_projects
         SET revised_turnover = $1,
             original_turnover = COALESCE(original_turnover, $1)
         WHERE project_code = $2 OR client_project_id = $3`,
        [formatted, proj.project_code, proj.client_project_id]
      );

      return res.json({
        success: true,
        isStage4: false,
        revised_turnover: formatted,
        message: `Turnover ceremony successfully scheduled for ${formatted}. The project will automatically transition to Stage 4 on this date.`,
      });
    } catch (err) {
      console.error("[ConstructionController.updateTurnoverSchedule] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to update turnover schedule: " + err.message });
    }
  }

  // 16. GET COMPLETION MEDIA DOSSIER (STAGE 4 GATE & SHOWCASE)
  async getCompletionMedia(req, res) {
    try {
      const code = req.params.code || req.query.projectCode;
      if (!code) {
        return res.status(400).json({ success: false, message: "projectCode is required." });
      }

      const result = await db.query(
        "SELECT * FROM site_photo_logs WHERE project_code = $1 AND category = 'completion' ORDER BY log_id DESC",
        [code]
      );

      const count = result.rows ? result.rows.length : 0;
      return res.json({
        success: true,
        projectCode: code,
        count,
        required: 3,
        isEligible: count >= 3,
        media: result.rows || [],
      });
    } catch (err) {
      console.error("[ConstructionController.getCompletionMedia] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch completion media: " + err.message });
    }
  }
}

module.exports = new ConstructionController();
