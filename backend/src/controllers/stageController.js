/**
 * MCPA CONSTRUCTION & SUPPLY — STAGE & ANTI-SPAM CONTROLLER
 * Exposes API endpoints for Progressive Disclosure Hydration, Project Inquiries, and Administrative Overrides
 */

const stageEngineService = require("../services/stageEngineService");
const db = require("../services/dbFailoverEngine");

class StageController {
  /**
   * POST /api/projects/inquire
   * Anti-Spam Gatekeeper: Creates an inquiry and advances user to 'CONSULTATION' stage.
   * If user already has an active project and is not multi-project approved, returns 409 Conflict.
   */
  async inquire(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Authentication required to initiate a project inquiry.",
        });
      }

      const {
        projectTitle,
        projectType = "Residential",
        targetLocation,
        briefId,
        metadata = {},
      } = req.body || {};

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
      const enrichedMetadata = {
        ...metadata,
        ip: clientIp,
        userAgent: req.headers["user-agent"] || null,
        submittedAt: new Date().toISOString(),
      };

      const newProject = await stageEngineService.createInquiryProject({
        userId,
        projectTitle,
        projectType,
        targetLocation,
        briefId: briefId ? parseInt(briefId, 10) : null,
        metadata: enrichedMetadata,
      });

      return res.status(201).json({
        success: true,
        message: "Project inquiry successfully registered. Progressive disclosure advanced to Consultation phase.",
        project: newProject,
        stage_id: newProject.stage_id,
        project_code: newProject.project_code,
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === "ACTIVE_PROJECT_LIMIT_EXCEEDED") {
        return res.status(409).json({
          success: false,
          error: "ACTIVE_PROJECT_LIMIT_EXCEEDED",
          message: err.message,
          activeProject: err.activeProject,
          is_multi_project_approved: false,
          resolutionAction: "CONTACT_ADMIN_FOR_MULTI_PROJECT_APPROVAL",
        });
      }

      console.error("[StageController.inquire] Error creating project inquiry:", err);
      return res.status(500).json({
        success: false,
        error: "INQUIRY_CREATION_FAILED",
        message: "Internal server error occurred while processing project inquiry.",
      });
    }
  }

  /**
   * GET /api/users/me/dashboard-state
   * Hydration Endpoint: Dictates which UI tabs and features are unlocked on the Client Portal.
   */
  async getDashboardState(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Authentication required to fetch client dashboard state.",
        });
      }

      const state = await stageEngineService.getDashboardState(userId);
      return res.status(200).json(state);
    } catch (err) {
      if (err.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: "USER_NOT_FOUND",
          message: err.message,
        });
      }

      console.error("[StageController.getDashboardState] Error retrieving dashboard state:", err);
      return res.status(500).json({
        success: false,
        error: "DASHBOARD_STATE_ERROR",
        message: "Failed to assemble client dashboard state.",
      });
    }
  }

  /**
   * POST /api/admin/projects/:id/advance-stage
   * Administrative Route: Elevates a project to the next progressive disclosure stage.
   */
  async advanceStage(req, res) {
    try {
      const adminUserId = req.user?.userId || req.user?.user_id;
      const rawId = req.params.id;
      const parsedId = parseInt(rawId, 10);
      const { targetStage, briefId, reason = "Administrative advancement", metadata = {} } = req.body || {};

      if (!targetStage) {
        return res.status(400).json({
          success: false,
          error: "MISSING_TARGET_STAGE",
          message: "Field 'targetStage' is required (e.g. 'CONSULTATION', 'PRE_CONSTRUCTION', 'ACTIVE_BUILD', 'COMPLETED').",
        });
      }

      const updatedProject = await stageEngineService.advanceProjectStage({
        projectId: isNaN(parsedId) ? null : parsedId,
        briefId: briefId || rawId,
        targetStage,
        adminUserId,
        reason,
        metadata,
      });

      return res.status(200).json({
        success: true,
        message: `Project successfully advanced to stage: ${targetStage}`,
        project: updatedProject,
      });
    } catch (err) {
      console.error("[StageController.advanceStage] Error advancing stage:", err);
      return res.status(err.statusCode || 500).json({
        success: false,
        error: "STAGE_ADVANCEMENT_ERROR",
        message: err.message || "Failed to update project stage.",
      });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/multi-project-approval
   * Administrative Route: Approves or revokes a client's ability to have multiple concurrent projects.
   */
  async toggleMultiProjectApproval(req, res) {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      const { approved = true, notes } = req.body || {};

      const result = await db.query(
        `UPDATE public.users 
         SET is_multi_project_approved = $1,
             multi_project_requested_at = CASE WHEN $1 = true THEN NULL ELSE multi_project_requested_at END
         WHERE user_id = $2 
         RETURNING user_id, email, full_name, is_multi_project_approved, multi_project_requested_at;`,
        [Boolean(approved), targetUserId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Target user not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: `User multi-project approval set to: ${Boolean(approved)}`,
        user: result.rows[0],
      });
    } catch (err) {
      console.error("[StageController.toggleMultiProjectApproval] Error updating approval:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update multi-project approval.",
      });
    }
  }
}

module.exports = new StageController();
