const db = require("../services/dbFailoverEngine");
const { generateQuotationPdf } = require("../services/quotationPdfService");

class QuotationController {
  /**
   * GET /api/projects/:id/quotation
   * Fetch official quotation for a given project ID or project code
   */
  async getQuotationByProject(req, res) {
    try {
      const rawParam = req.params.id;
      const isNumeric = !isNaN(Number(rawParam));

      // 1. Fetch Client Project and associated Brief
      let projectRes;
      if (isNumeric) {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message,
                  cb.preferred_style, cb.target_date,
                  COALESCE(u.avatar_url, u.kyc_photo_url) AS avatar_url,
                  u.auth_provider
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           LEFT JOIN users u ON cp.user_id = u.user_id
           WHERE cp.client_project_id = $1`,
          [Number(rawParam)]
        );
      } else {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message,
                  cb.preferred_style, cb.target_date,
                  COALESCE(u.avatar_url, u.kyc_photo_url) AS avatar_url,
                  u.auth_provider
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           LEFT JOIN users u ON cp.user_id = u.user_id
           WHERE cp.project_code = $1`,
          [rawParam]
        );
      }

      const project = projectRes.rows?.[0] || null;
      if (project) {
        const emailLower = (project.client_email || "").toLowerCase().trim();
        if (!project.avatar_url && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com" || emailLower === "martquirante@gmail.com" || emailLower === "dbprojectmartquirante@gmail.com")) {
          project.avatar_url = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
        }
        project.avatarUrl = project.avatar_url;
      }
      const clientProjectId = project?.client_project_id || (isNumeric ? Number(rawParam) : null);
      const projectCode = project?.project_code || rawParam;

      // 2. Fetch Latest Quotation for this Project (Zero dummy data, returns null if none exists yet)
      let quoRes;
      if (clientProjectId) {
        quoRes = await db.query(
          `SELECT * FROM client_quotations 
           WHERE client_project_id = $1 OR project_code = $2 
           ORDER BY quotation_id DESC LIMIT 1`,
          [clientProjectId, projectCode]
        );
      } else {
        quoRes = await db.query(
          `SELECT * FROM client_quotations 
           WHERE project_code = $1 
           ORDER BY quotation_id DESC LIMIT 1`,
          [projectCode]
        );
      }

      const quotation = quoRes.rows?.[0] || null;

      return res.status(200).json({
        success: true,
        project,
        quotation,
      });
    } catch (err) {
      console.error("[QuotationController.getQuotationByProject] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/quotation/request
   * Client requests an official quotation from MCPA Estimators
   */
  async requestQuotation(req, res) {
    try {
      const rawParam = req.params.id;
      const isNumeric = !isNaN(Number(rawParam));
      const { preferredTimelineMonths = 6, financingChoice = null, customNotes = "" } = req.body || {};

      // 1. Fetch Project & Brief
      let projectRes;
      if (isNumeric) {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           WHERE cp.client_project_id = $1`,
          [Number(rawParam)]
        );
      } else {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           WHERE cp.project_code = $1`,
          [rawParam]
        );
      }

      const project = projectRes.rows?.[0];
      if (!project) {
        return res.status(404).json({ success: false, message: "Client project not found." });
      }

      const clientProjectId = project.client_project_id;
      const briefId = project.brief_id || null;
      const projectCode = project.project_code;
      const clientName = project.client_name || req.user?.fullName || "Valued Client";
      const clientEmail = project.client_email || req.user?.email || "";
      const clientPhone = project.client_phone || "";
      const projectType = project.project_type || project.brief_project_type || "Residential";
      const location = project.target_location || project.brief_location || "Bulacan, Philippines";
      const financingType = financingChoice || project.financing_option || "Milestone Progress Billing";

      // Parse numerical client target budget from inquiry budget range (e.g. "₱3M - ₱5M" -> 3500000)
      let parsedBudget = null;
      if (project.budget_range) {
        const nums = project.budget_range.replace(/,/g, "").match(/\d+(\.\d+)?/g);
        if (nums && nums.length > 0) {
          const val = parseFloat(nums[0]);
          if (project.budget_range.toLowerCase().includes("m")) {
            parsedBudget = val < 100 ? val * 1000000 : val;
          } else if (project.budget_range.toLowerCase().includes("k")) {
            parsedBudget = val * 1000;
          } else {
            parsedBudget = val;
          }
        }
      }

      // Check if quotation record already exists
      const existingQuo = await db.query(
        `SELECT quotation_id, status FROM client_quotations WHERE client_project_id = $1 ORDER BY quotation_id DESC LIMIT 1`,
        [clientProjectId]
      );

      let quotation;
      if (existingQuo.rows && existingQuo.rows.length > 0) {
        const qId = existingQuo.rows[0].quotation_id;
        const updateRes = await db.query(
          `UPDATE client_quotations
           SET status = 'REQUESTED',
               duration_months = COALESCE($1, duration_months),
               financing_type = COALESCE($2, financing_type),
               client_notes = COALESCE($3, client_notes),
               client_target_budget = COALESCE($4, client_target_budget),
               requested_at = NOW(),
               updated_at = NOW()
           WHERE quotation_id = $5
           RETURNING *`,
          [Number(preferredTimelineMonths) || 6, financingType, customNotes || null, parsedBudget, qId]
        );
        quotation = updateRes.rows[0];
      } else {
        const insertRes = await db.query(
          `INSERT INTO client_quotations (
             client_project_id, brief_id, project_code, client_name, client_email, client_phone,
             project_type, location, duration_months, financing_type, status,
             client_target_budget, client_notes, requested_at, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'REQUESTED', $11, $12, NOW(), NOW(), NOW())
           RETURNING *`,
          [
            clientProjectId,
            briefId,
            projectCode,
            clientName,
            clientEmail,
            clientPhone,
            projectType,
            location,
            Number(preferredTimelineMonths) || 6,
            financingType,
            parsedBudget,
            customNotes || null,
          ]
        );
        quotation = insertRes.rows[0];
      }

      return res.status(200).json({
        success: true,
        message: "Official Quotation request submitted to MCPA Estimating Office.",
        quotation,
      });
    } catch (err) {
      console.error("[QuotationController.requestQuotation] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/quotations/overview
   * Admin overview of all projects, active quotation requests, and quotations
   */
  async getAdminQuotationsOverview(req, res) {
    try {
      // Fetch all projects along with quotation metadata
      const projectsRes = await db.query(
        `SELECT 
           cp.client_project_id,
           cp.project_code,
           cp.project_title,
           cp.stage_id,
           cp.created_at,
           cb.brief_id,
           COALESCE(cb.client_name, u.full_name, 'Valued Client') AS client_name,
           COALESCE(cb.client_email, u.email) AS client_email,
           cb.client_phone,
           cb.project_type,
           cb.budget_range,
           cb.financing_option,
           cb.location,
           cb.target_date,
           COALESCE(u.avatar_url, u.kyc_photo_url) AS avatar_url,
           u.auth_provider,
           cq.quotation_id,
           cq.status AS quotation_status,
           cq.total_amount AS quotation_total,
           cq.variance_pct,
           cq.duration_months,
           cq.financing_type AS quotation_financing,
           cq.requested_at,
           cq.published_at,
           cq.items_breakdown,
           cq.materials_cost,
           cq.labor_cost,
           cq.architect_fee,
           cq.engineer_fee,
           cq.contractor_profit_pct,
           cq.contractor_profit_amount
         FROM client_projects cp
         LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
         LEFT JOIN users u ON cp.user_id = u.user_id
         LEFT JOIN LATERAL (
           SELECT * FROM client_quotations 
           WHERE client_project_id = cp.client_project_id 
           ORDER BY quotation_id DESC LIMIT 1
         ) cq ON TRUE
         ORDER BY 
           CASE WHEN cq.status = 'REQUESTED' THEN 0 WHEN cp.stage_id = 'CONSULTATION' THEN 1 ELSE 2 END,
           cp.client_project_id DESC`
      );

      const clients = (projectsRes.rows || []).map((c) => {
        const emailLower = (c.client_email || "").toLowerCase().trim();
        let resolvedAvatar = c.avatar_url || null;
        if (!resolvedAvatar && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com" || emailLower === "martquirante@gmail.com" || emailLower === "dbprojectmartquirante@gmail.com")) {
          resolvedAvatar = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
        }
        return {
          ...c,
          avatar_url: resolvedAvatar,
          avatarUrl: resolvedAvatar,
        };
      });
      const pendingRequestsCount = clients.filter((c) => c.quotation_status === "REQUESTED").length;

      return res.status(200).json({
        success: true,
        clients,
        pendingRequestsCount,
      });
    } catch (err) {
      console.error("[QuotationController.getAdminQuotationsOverview] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/quotations
   * Create, update, or publish official quotation from Admin Console
   */
  async saveAdminQuotation(req, res) {
    try {
      const {
        quotationId = null,
        clientProjectId,
        projectCode,
        briefId = null,
        clientName,
        clientEmail,
        clientPhone,
        projectType,
        location,
        floorAreaSqm,
        durationMonths = 6,
        financingType = "Milestone Progress Billing",
        status = "PUBLISHED", // "DRAFT" | "PUBLISHED"
        clientTargetBudget = 0,
        materialsCost = 0,
        laborCost = 0,
        laborRateBasis = "Standard Labor Allocation",
        architectFee = 0,
        engineerFee = 0,
        contractorProfitPct = 12.00,
        contractorProfitAmount = 0,
        totalAmount = 0,
        varianceAmount = 0,
        variancePct = 0,
        itemsBreakdown = [],
        paymentMilestones = [],
        adminNotes = "",
      } = req.body || {};

      if (!clientProjectId && !projectCode) {
        return res.status(400).json({ success: false, message: "Missing target clientProjectId or projectCode." });
      }

      // Compute total turn-key if not directly supplied
      const computedMat = Number(materialsCost) || 0;
      const computedLab = Number(laborCost) || 0;
      const computedProf = (Number(architectFee) || 0) + (Number(engineerFee) || 0);
      const computedProfit = Number(contractorProfitAmount) || ((computedMat + computedLab + computedProf) * (Number(contractorProfitPct) / 100));
      const computedTotal = Number(totalAmount) || (computedMat + computedLab + computedProf + computedProfit);

      const numTargetBudget = Number(clientTargetBudget) || 0;
      const computedVarAmt = numTargetBudget > 0 ? computedTotal - numTargetBudget : 0;
      const computedVarPct = numTargetBudget > 0 ? ((computedTotal - numTargetBudget) / numTargetBudget) * 100 : 0;

      let savedQuo;

      const publishTimestamp = status === "PUBLISHED" ? new Date() : null;

      if (quotationId) {
        // Update existing record
        const updateRes = await db.query(
          `UPDATE client_quotations
           SET client_name = COALESCE($1, client_name),
               client_email = COALESCE($2, client_email),
               client_phone = COALESCE($3, client_phone),
               project_type = COALESCE($4, project_type),
               location = COALESCE($5, location),
               floor_area_sqm = $6,
               duration_months = $7,
               financing_type = $8,
               status = $9,
               client_target_budget = $10,
               materials_cost = $11,
               labor_cost = $12,
               labor_rate_basis = $13,
               architect_fee = $14,
               engineer_fee = $15,
               contractor_profit_pct = $16,
               contractor_profit_amount = $17,
               total_amount = $18,
               variance_amount = $19,
               variance_pct = $20,
               items_breakdown = $21,
               payment_milestones = $22,
               admin_notes = $23,
               published_at = COALESCE($24, published_at),
               updated_at = NOW()
           WHERE quotation_id = $25
           RETURNING *`,
          [
            clientName,
            clientEmail,
            clientPhone,
            projectType,
            location,
            Number(floorAreaSqm) || null,
            Number(durationMonths) || 6,
            financingType,
            status,
            numTargetBudget,
            computedMat,
            computedLab,
            laborRateBasis,
            Number(architectFee) || 0,
            Number(engineerFee) || 0,
            Number(contractorProfitPct) || 12.00,
            computedProfit,
            computedTotal,
            computedVarAmt,
            computedVarPct,
            JSON.stringify(itemsBreakdown),
            JSON.stringify(paymentMilestones),
            adminNotes,
            publishTimestamp,
            quotationId,
          ]
        );
        savedQuo = updateRes.rows[0];
      } else {
        // Insert new quotation record
        const insertRes = await db.query(
          `INSERT INTO client_quotations (
             client_project_id, brief_id, project_code, client_name, client_email, client_phone,
             project_type, location, floor_area_sqm, duration_months, financing_type,
             status, client_target_budget, materials_cost, labor_cost, labor_rate_basis,
             architect_fee, engineer_fee, contractor_profit_pct, contractor_profit_amount,
             total_amount, variance_amount, variance_pct, items_breakdown, payment_milestones,
             admin_notes, published_at, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
             $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW()
           ) RETURNING *`,
          [
            clientProjectId,
            briefId,
            projectCode,
            clientName || "Valued Client",
            clientEmail || "",
            clientPhone || "",
            projectType || "Residential",
            location || "Bulacan, Philippines",
            Number(floorAreaSqm) || null,
            Number(durationMonths) || 6,
            financingType,
            status,
            numTargetBudget,
            computedMat,
            computedLab,
            laborRateBasis,
            Number(architectFee) || 0,
            Number(engineerFee) || 0,
            Number(contractorProfitPct) || 12.00,
            computedProfit,
            computedTotal,
            computedVarAmt,
            computedVarPct,
            JSON.stringify(itemsBreakdown),
            JSON.stringify(paymentMilestones),
            adminNotes,
            publishTimestamp,
          ]
        );
        savedQuo = insertRes.rows[0];
      }

      return res.status(200).json({
        success: true,
        message: status === "PUBLISHED" ? "Official Quotation published to client portal!" : "Quotation draft saved.",
        quotation: savedQuo,
      });
    } catch (err) {
      console.error("[QuotationController.saveAdminQuotation] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/quotation/pdf
   * Generate & Stream pure A4 Black & White Word-Style formal Quotation PDF
   */
  async downloadQuotationPdf(req, res) {
    try {
      const rawParam = req.params.id;
      const isNumeric = !isNaN(Number(rawParam));

      // 1. Fetch Project & Brief
      let projectRes;
      if (isNumeric) {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           WHERE cp.client_project_id = $1`,
          [Number(rawParam)]
        );
      } else {
        projectRes = await db.query(
          `SELECT cp.*, cb.client_name, cb.client_email, cb.client_phone, cb.budget_range, cb.financing_option,
                  cb.project_type AS brief_project_type, cb.location AS brief_location, cb.lot_area, cb.message
           FROM client_projects cp
           LEFT JOIN client_briefs cb ON cp.brief_id = cb.brief_id
           WHERE cp.project_code = $1`,
          [rawParam]
        );
      }

      const project = projectRes.rows?.[0] || {};
      const clientProjectId = project?.client_project_id || (isNumeric ? Number(rawParam) : null);
      const projectCode = project?.project_code || rawParam;

      // 2. Fetch Quotation
      let quoRes;
      if (clientProjectId) {
        quoRes = await db.query(
          `SELECT * FROM client_quotations 
           WHERE client_project_id = $1 OR project_code = $2 
           ORDER BY quotation_id DESC LIMIT 1`,
          [clientProjectId, projectCode]
        );
      } else {
        quoRes = await db.query(
          `SELECT * FROM client_quotations 
           WHERE project_code = $1 
           ORDER BY quotation_id DESC LIMIT 1`,
          [projectCode]
        );
      }

      const quotation = quoRes.rows?.[0];

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "No official quotation generated yet for this project. Please generate or request quotation first.",
        });
      }

      const { buffer, filename } = await generateQuotationPdf(quotation, project, project);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      return res.end(buffer);
    } catch (err) {
      console.error("[QuotationController.downloadQuotationPdf] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new QuotationController();
