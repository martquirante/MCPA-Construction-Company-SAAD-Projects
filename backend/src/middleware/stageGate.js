/**
 * MCPA CONSTRUCTION & SUPPLY — PROGRESSIVE DISCLOSURE STAGE GATEWAY
 * Target: Node.js / Express Middleware
 * Purpose: Enforce strict 5-Stage Progressive Disclosure Lifecycle and Role-Based Guardrails
 */

const db = require("../services/dbFailoverEngine");

/**
 * Stage hierarchy level weights (Strictly Ordered 1 to 5)
 */
const STAGE_ORDER = Object.freeze({
  PRE_INQUIRY: 1,
  CONSULTATION: 2,
  PRE_CONSTRUCTION: 3,
  ACTIVE_BUILD: 4,
  COMPLETED: 5,
});

/**
 * User-facing canonical stage titles
 */
const STAGE_NAMES = Object.freeze({
  PRE_INQUIRY: "Pre-Inquiry & Spatial Discovery",
  CONSULTATION: "Consultation & Architectural Brief",
  PRE_CONSTRUCTION: "Pre-Construction & LGU Permitting",
  ACTIVE_BUILD: "Active Site Execution & Milestones",
  COMPLETED: "Turnover & 15-Year Structural Warranty",
});

/**
 * Middleware Factory: requireStage(minRequiredStage)
 * 
 * Verifies that the authenticated client's active project meets or exceeds the required lifecycle stage.
 * If the current stage is lower, halts execution with a 403 Forbidden payload detailing the lock reason.
 * 
 * @param {('PRE_INQUIRY'|'CONSULTATION'|'PRE_CONSTRUCTION'|'ACTIVE_BUILD'|'COMPLETED')} minRequiredStage
 * @returns {Function} Express middleware function
 */
function requireStage(minRequiredStage) {
  const requiredLevel = STAGE_ORDER[minRequiredStage];
  if (!requiredLevel) {
    throw new Error(`[requireStage] Invalid stage_id specified: "${minRequiredStage}". Must be one of: ${Object.keys(STAGE_ORDER).join(", ")}`);
  }

  return async (req, res, next) => {
    try {
      // 1. Guard against unauthenticated requests
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Authentication required to access stage-protected resources. Please provide a valid Bearer token.",
        });
      }

      const userRole = (req.user.role || "").toLowerCase();
      // 2. Admin & Super Admin Bypass
      if (userRole === "admin" || userRole === "super_admin") {
        return next();
      }

      const userId = req.user.userId || req.user.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "INVALID_USER_CONTEXT",
          message: "User session token lacks a valid identifier.",
        });
      }

      // 3. Resolve target project (explicit project ID in params/query or user's active project)
      const explicitProjectId = req.params.projectId || req.params.clientProjectId || req.query.projectId;

      let projectQuery;
      let projectParams;

      if (explicitProjectId) {
        projectQuery = `
          SELECT cp.*, u.is_multi_project_approved, u.email as user_email
          FROM public.client_projects cp
          JOIN public.users u ON u.user_id = cp.user_id
          WHERE cp.client_project_id = $1 AND cp.user_id = $2 AND cp.is_archived = FALSE
          LIMIT 1;
        `;
        projectParams = [explicitProjectId, userId];
      } else {
        projectQuery = `
          SELECT cp.*, u.is_multi_project_approved, u.email as user_email
          FROM public.client_projects cp
          JOIN public.users u ON u.user_id = cp.user_id
          WHERE cp.user_id = $1 AND cp.is_archived = FALSE
          ORDER BY cp.client_project_id DESC
          LIMIT 1;
        `;
        projectParams = [userId];
      }

      const result = await db.query(projectQuery, projectParams);
      const activeProject = result.rows && result.rows.length > 0 ? result.rows[0] : null;

      // 4. Handle state where client has no project record yet
      if (!activeProject) {
        // If the required threshold is PRE_INQUIRY, allow access as default stage
        if (requiredLevel === STAGE_ORDER.PRE_INQUIRY) {
          req.clientProject = null;
          req.currentStage = "PRE_INQUIRY";
          req.currentStageLevel = 1;
          return next();
        }

        return res.status(403).json({
          success: false,
          error: "NO_ACTIVE_PROJECT",
          message: `Access Forbidden: You do not currently have an active construction project. You must initiate a consultation inquiry before accessing ${STAGE_NAMES[minRequiredStage] || minRequiredStage}.`,
          requiredStage: minRequiredStage,
          requiredStageName: STAGE_NAMES[minRequiredStage] || minRequiredStage,
          currentStage: "PRE_INQUIRY",
          currentStageLevel: 1,
        });
      }

      // 5. Compare lifecycle stages
      const currentStage = activeProject.stage_id || "PRE_INQUIRY";
      const currentLevel = STAGE_ORDER[currentStage] || 1;

      if (currentLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: "STAGE_ACCESS_LOCKED",
          message: `Access Forbidden: This feature is locked until your project reaches the '${STAGE_NAMES[minRequiredStage] || minRequiredStage}' stage. Your current status is '${STAGE_NAMES[currentStage] || currentStage}'.`,
          requiredStage: minRequiredStage,
          requiredStageLevel: requiredLevel,
          requiredStageName: STAGE_NAMES[minRequiredStage] || minRequiredStage,
          currentStage: currentStage,
          currentStageLevel: currentLevel,
          currentStageName: STAGE_NAMES[currentStage] || currentStage,
          projectCode: activeProject.project_code,
          projectId: activeProject.client_project_id,
        });
      }

      // 6. Stage requirement satisfied: Attach project metadata to req for downstream controllers
      req.clientProject = activeProject;
      req.currentStage = currentStage;
      req.currentStageLevel = currentLevel;

      return next();
    } catch (err) {
      console.error("[requireStage] Internal error evaluating progressive disclosure:", err);
      return res.status(500).json({
        success: false,
        error: "STAGE_VERIFICATION_FAILURE",
        message: "An unexpected error occurred while verifying project stage authorization.",
      });
    }
  };
}

module.exports = {
  requireStage,
  STAGE_ORDER,
  STAGE_NAMES,
};
