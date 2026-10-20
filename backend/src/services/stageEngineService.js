/**
 * MCPA CONSTRUCTION & SUPPLY — PROGRESSIVE DISCLOSURE & ANTI-SPAM SERVICE
 * Purpose: Business Logic Engine for Project Lifecycle Stages, Anti-Spam Controls, and State Hydration
 */

const crypto = require("crypto");
const db = require("./dbFailoverEngine");
const { STAGE_ORDER, STAGE_NAMES } = require("../middleware/stageGate");

class StageEngineService {
  /**
   * Generates a tamper-resistant, human-readable Project Code (e.g., "MCPA-2026-B8F72A")
   */
  generateProjectCode() {
    const year = new Date().getFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `MCPA-${year}-${entropy}`;
  }

  /**
   * Evaluates if a user is eligible to start a new construction project.
   * Anti-Spam Rule: 1 active project per user unless `is_multi_project_approved === true`.
   * 
   * @param {number} userId 
   * @returns {Promise<{ allowed: boolean, user: Object, activeProject: Object|null, reason?: string }>}
   */
  async checkAntiSpamEligibility(userId) {
    // 1. Fetch user profile & multi-project permission flag
    const userRes = await db.query(
      `SELECT user_id, email, full_name, role, is_multi_project_approved, kyc_verified_at 
       FROM public.users 
       WHERE user_id = $1 
       LIMIT 1;`,
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return { allowed: false, user: null, activeProject: null, reason: "USER_NOT_FOUND" };
    }

    const user = userRes.rows[0];

    // 2. Query for any existing active project (not archived and not completed)
    const activeRes = await db.query(
      `SELECT client_project_id, project_code, stage_id, project_title, project_type, target_location, created_at
       FROM public.client_projects
       WHERE user_id = $1 AND is_archived = FALSE AND stage_id != 'COMPLETED'
       ORDER BY client_project_id DESC
       LIMIT 1;`,
      [userId]
    );

    const activeProject = activeRes.rows && activeRes.rows.length > 0 ? activeRes.rows[0] : null;

    // 3. Evaluate Anti-Spam Gate: If active project exists, require explicit admin approval
    if (activeProject && !user.is_multi_project_approved) {
      return {
        allowed: false,
        user,
        activeProject,
        reason: "ACTIVE_PROJECT_LIMIT_EXCEEDED",
      };
    }

    return {
      allowed: true,
      user,
      activeProject,
    };
  }

  /**
   * Project Creation / Anti-Spam Gatekeeper:
   * Initiates a new project at the 'CONSULTATION' stage.
   * 
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} params.projectTitle
   * @param {string} [params.projectType='Residential']
   * @param {string} [params.targetLocation]
   * @param {number} [params.briefId]
   * @param {Object} [params.metadata={}]
   */
  async createInquiryProject({ userId, projectTitle, projectType = "Residential", targetLocation = null, briefId = null, initialStage = "PRE_INQUIRY", metadata = {}, bypassAntiSpam = false }) {
    // 0. If briefId already has an existing project, return it to avoid duplicates
    if (briefId) {
      const existingByBrief = await db.query(
        "SELECT * FROM public.client_projects WHERE brief_id = $1 AND is_archived = FALSE LIMIT 1;",
        [briefId]
      );
      if (existingByBrief.rows && existingByBrief.rows.length > 0) {
        return existingByBrief.rows[0];
      }
    }

    // 1. Run Anti-Spam Gatekeeper check (bypass if explicitly authorized, e.g. administrative advancement)
    let eligibility = null;
    if (!bypassAntiSpam) {
      eligibility = await this.checkAntiSpamEligibility(userId);
      if (!eligibility.allowed) {
        const err = new Error(
          "Policy Restriction: You have an existing active construction project. To initiate another project, your account must receive multi-project approval from MCPA Administration."
        );
        err.code = "ACTIVE_PROJECT_LIMIT_EXCEEDED";
        err.statusCode = 409;
        err.activeProject = eligibility.activeProject;
        throw err;
      }
    }

    // 2. Generate unique code
    let projectCode = this.generateProjectCode();
    let collisionCheck = await db.query(
      "SELECT 1 FROM public.client_projects WHERE project_code = $1 LIMIT 1;",
      [projectCode]
    );
    while (collisionCheck.rows && collisionCheck.rows.length > 0) {
      projectCode = this.generateProjectCode();
      collisionCheck = await db.query(
        "SELECT 1 FROM public.client_projects WHERE project_code = $1 LIMIT 1;",
        [projectCode]
      );
    }

    const title = projectTitle || `${projectType} Residence (${eligibility?.user?.full_name || "Client"})`;
    const targetInitialStage = STAGE_ORDER[initialStage] ? initialStage : "PRE_INQUIRY";

    // 3. Insert new row into client_projects at targetInitialStage
    const insertRes = await db.query(
      `INSERT INTO public.client_projects (
        project_code,
        user_id,
        stage_id,
        project_title,
        project_type,
        target_location,
        brief_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;`,
      [projectCode, userId, targetInitialStage, title, projectType, targetLocation, briefId]
    );

    const newProject = insertRes.rows[0];

    // 4. Record initial stage transition in audit trail
    await db.query(
      `INSERT INTO public.stage_transitions (
        client_project_id,
        from_stage,
        to_stage,
        transitioned_by,
        reason,
        metadata,
        created_at
      ) VALUES ($1, 'PRE_INQUIRY', $2, $3, $4, $5, NOW());`,
      [
        newProject.client_project_id,
        targetInitialStage,
        userId,
        targetInitialStage === "PRE_INQUIRY"
          ? "Client inquiry submitted — awaiting initial engineering review (Stage 1B)"
          : "Client inquiry initiated and elevated to Consultation stage",
        JSON.stringify({ ...metadata, clientIp: metadata.ip || null }),
      ]
    );

    // 5. If linked to an existing client_briefs record, update the bridge reference
    if (briefId) {
      await db.query(
        `UPDATE public.client_briefs 
         SET client_project_id = $1, current_stage_status = $2 
         WHERE brief_id = $3;`,
        [newProject.client_project_id, targetInitialStage, briefId]
      );
    }

    return newProject;
  }

  /**
   * State Fetcher for Frontend Hydration:
   * Returns complete lifecycle metadata, active project context, and fine-grained UI permission locks.
   * 
   * @param {number} userId 
   * @returns {Promise<Object>} Hydration payload for Client Portal
   */
  async getDashboardState(userId) {
    // 1. Fetch user profile flags
    const userRes = await db.query(
      `SELECT user_id, email, full_name, role, is_multi_project_approved, 
              kyc_verified_at, kyc_photo_url, avatar_url, phone_number, client_type
       FROM public.users 
       WHERE user_id = $1 
       LIMIT 1;`,
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      const notFoundErr = new Error("User record not found.");
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    const user = userRes.rows[0];

    // 2. Fetch active project with joined brief & site execution telemetry
    const projectRes = await db.query(
      `SELECT 
        cp.*,
        cb.submission_id as brief_submission_id,
        cb.status as brief_status,
        cb.meeting_date,
        cb.meeting_time,
        cb.meeting_link,
        sp.progress_pct as site_progress_pct,
        sp.current_phase as site_current_phase,
        sp.lead_engineer,
        sp.virtual_tour_url,
        sp.virtual_tour_urls
       FROM public.client_projects cp
       LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
       LEFT JOIN public.site_projects sp ON cp.site_project_code = sp.project_code
       WHERE cp.user_id = $1 AND cp.is_archived = FALSE
       ORDER BY cp.client_project_id DESC
       LIMIT 1;`,
      [userId]
    );

    const initialActiveProject = projectRes.rows && projectRes.rows.length > 0 ? projectRes.rows[0] : null;
    let resolvedProject = initialActiveProject;

    // Check if current project is discontinued or rejected
    if (
      resolvedProject &&
      (Boolean(resolvedProject.is_archived) ||
        resolvedProject.status === "DISCONTINUED" ||
        resolvedProject.status === "REJECTED" ||
        (resolvedProject.brief_status || "").toLowerCase().includes("reject") ||
        (resolvedProject.brief_status || "").toLowerCase().includes("discontinue") ||
        (resolvedProject.brief_status || "").toLowerCase().includes("decline") ||
        (resolvedProject.brief_status || "").toLowerCase().includes("withdrawn"))
    ) {
      return {
        success: true,
        hasActiveProject: false,
        hasRejectedInquiry: true,
        rejectedBrief: {
          briefId: resolvedProject.brief_id,
          submissionId: resolvedProject.brief_submission_id,
          status: resolvedProject.brief_status || "Discontinued / Rejected",
          rejectionReason: resolvedProject.rejection_reason || "Consultation Concluded / Discontinued",
          rejectionNotes: resolvedProject.rejection_notes || null,
          projectType: resolvedProject.project_title || "Residential Build Inquiry",
          location: resolvedProject.target_location,
        },
        activeProject: null,
        stage_id: "PRE_INQUIRY",
        stageLevel: STAGE_ORDER.PRE_INQUIRY,
        stageName: STAGE_NAMES.PRE_INQUIRY,
        is_multi_project_approved: Boolean(user.is_multi_project_approved),
        isKycVerified: Boolean(user.kyc_verified_at),
        userProfile: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url,
          clientType: user.client_type,
        },
        stagePermissions: {
          canAccessPreInquiry: true,
          canAccessConsultation: false,
          canAccessPreConstruction: false,
          canAccessActiveBuild: false,
          canAccessCompleted: false,
        },
        unlockedStages: ["PRE_INQUIRY"],
        summaryCounters: {
          documentsCount: 0,
          unreadMessagesCount: 0,
          blueprintsCount: 0,
          pendingInvoicesCount: 0,
          activeMeeting: null,
        },
      };
    }

    // 2.1 Auto-bridge: If no active client_projects row exists, check for an active client_briefs record
    if (!resolvedProject) {
      const briefRes = await db.query(
        `SELECT * FROM public.client_briefs 
         WHERE (user_id = $1 OR LOWER(client_email) = LOWER($2))
         ORDER BY brief_id DESC 
         LIMIT 1;`,
        [userId, user.email || ""]
      );

      if (briefRes.rows && briefRes.rows.length > 0) {
        const latestBrief = briefRes.rows[0];
        const isBriefRejected = 
          Boolean(latestBrief.is_rejected) || 
          (latestBrief.status || "").toLowerCase().includes("reject") ||
          (latestBrief.status || "").toLowerCase().includes("discontinue") ||
          (latestBrief.status || "").toLowerCase().includes("decline") ||
          (latestBrief.status || "").toLowerCase().includes("withdrawn");

        if (isBriefRejected) {
          return {
            success: true,
            hasActiveProject: false,
            hasRejectedInquiry: true,
            rejectedBrief: {
              briefId: latestBrief.brief_id,
              submissionId: latestBrief.submission_id,
              status: latestBrief.status,
              rejectionReason: latestBrief.rejection_reason || "Location Outside Service Coverage",
              rejectionNotes: latestBrief.rejection_notes || null,
              projectType: latestBrief.project_type,
              location: latestBrief.location,
            },
            activeProject: null,
            stage_id: "PRE_INQUIRY",
            stageLevel: STAGE_ORDER.PRE_INQUIRY,
            stageName: STAGE_NAMES.PRE_INQUIRY,
            is_multi_project_approved: Boolean(user.is_multi_project_approved),
            isKycVerified: Boolean(user.kyc_verified_at),
            userProfile: {
              userId: user.user_id,
              email: user.email,
              fullName: user.full_name,
              role: user.role,
              avatarUrl: user.avatar_url,
              clientType: user.client_type,
            },
            stagePermissions: {
              canAccessPreInquiry: true,
              canAccessConsultation: false,
              canAccessPreConstruction: false,
              canAccessActiveBuild: false,
              canAccessCompleted: false,
            },
            unlockedStages: ["PRE_INQUIRY"],
            summaryCounters: {
              documentsCount: 0,
              unreadMessagesCount: 0,
              blueprintsCount: 0,
              pendingInvoicesCount: 0,
              activeMeeting: null,
            },
          };
        } else {
          try {
            const briefStatusLower = (latestBrief.status || "Pending Review").toLowerCase();
            const isBriefApproved =
              briefStatusLower.includes("approve") ||
              briefStatusLower.includes("accept") ||
              briefStatusLower.includes("scheduled") ||
              briefStatusLower.includes("quotation") ||
              briefStatusLower.includes("contract");
            const targetBridgeStage = isBriefApproved ? "CONSULTATION" : "PRE_INQUIRY";

            const projectTitle = `${latestBrief.project_type || "Residential"} Project (${user.full_name || latestBrief.client_name || "Client"})`;
            resolvedProject = await this.createInquiryProject({
              userId,
              projectTitle,
              projectType: latestBrief.project_type || "Residential Design & Build",
              targetLocation: latestBrief.location || null,
              briefId: latestBrief.brief_id,
              initialStage: targetBridgeStage,
            });
            resolvedProject.brief_submission_id = latestBrief.submission_id;
            resolvedProject.brief_status = latestBrief.status;
            resolvedProject.meeting_date = latestBrief.meeting_date;
            resolvedProject.meeting_time = latestBrief.meeting_time;
            resolvedProject.meeting_link = latestBrief.meeting_link;
          } catch (createErr) {
            console.warn("[stageEngineService] Auto-bridge client_project notice:", createErr.message);
          }
        }
      }
    }

    // 2.2 If resolvedProject is at PRE_INQUIRY but Admin already approved/scheduled the linked brief, elevate to CONSULTATION
    if (resolvedProject && resolvedProject.stage_id === "PRE_INQUIRY") {
      const briefStatusLower = (resolvedProject.brief_status || "").toLowerCase();
      const isBriefApproved =
        briefStatusLower.includes("approve") ||
        briefStatusLower.includes("accept") ||
        briefStatusLower.includes("scheduled") ||
        briefStatusLower.includes("quotation") ||
        briefStatusLower.includes("contract");
      if (isBriefApproved) {
        try {
          await this.advanceProjectStage({
            projectId: resolvedProject.client_project_id,
            targetStage: "CONSULTATION",
            reason: "Automated progression: Linked inquiry approved by administration",
          });
          resolvedProject.stage_id = "CONSULTATION";
        } catch (elevErr) {
          console.warn("[getDashboardState] Stage 2 auto-elevation notice:", elevErr.message);
        }
      }
    }

    // 3. Fallback for clients without any project yet (Pre-Inquiry stage)
    if (!resolvedProject) {
      return {
        success: true,
        hasActiveProject: false,
        activeProject: null,
        stage_id: "PRE_INQUIRY",
        stageLevel: STAGE_ORDER.PRE_INQUIRY,
        stageName: STAGE_NAMES.PRE_INQUIRY,
        is_multi_project_approved: Boolean(user.is_multi_project_approved),
        isKycVerified: Boolean(user.kyc_verified_at),
        userProfile: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url,
          clientType: user.client_type,
        },
        stagePermissions: {
          canAccessPreInquiry: true,
          canAccessConsultation: false,
          canAccessPreConstruction: false,
          canAccessActiveBuild: false,
          canAccessCompleted: false,
        },
        unlockedStages: ["PRE_INQUIRY"],
        summaryCounters: {
          documentsCount: 0,
          unreadMessagesCount: 0,
          blueprintsCount: 0,
          pendingInvoicesCount: 0,
          activeMeeting: null,
        },
      };
    }

    // 3.1 Groundbreaking Ceremony Kickoff: Auto-advance to ACTIVE_BUILD if ceremony completed or date/time has passed
    if (
      resolvedProject &&
      (resolvedProject.stage_id === "CONSULTATION" || resolvedProject.stage_id === "PRE_CONSTRUCTION")
    ) {
      const isPastGroundbreaking = Boolean(
        resolvedProject.groundbreaking_date &&
        new Date(resolvedProject.groundbreaking_date).getTime() <= Date.now()
      );
      const isCompletedGroundbreaking = Boolean(
        resolvedProject.groundbreaking_status === "COMPLETED" || isPastGroundbreaking
      );

      if (isCompletedGroundbreaking) {
        try {
          if (resolvedProject.groundbreaking_status !== "COMPLETED") {
            await db.query(
              "UPDATE public.client_projects SET groundbreaking_status = 'COMPLETED', updated_at = NOW() WHERE client_project_id = $1;",
              [resolvedProject.client_project_id]
            );
            resolvedProject.groundbreaking_status = "COMPLETED";
          }
          await this.advanceProjectStage({
            projectId: resolvedProject.client_project_id,
            targetStage: "ACTIVE_BUILD",
            reason: isPastGroundbreaking
              ? "Automated progression: Scheduled groundbreaking ceremony date/time concluded — physical site construction commenced"
              : "Automated progression: Groundbreaking ceremony marked completed",
          });

          // Refresh resolvedProject with newly provisioned site execution telemetry
          const refreshedProjectRes = await db.query(
            `SELECT 
              cp.*,
              cb.submission_id as brief_submission_id,
              cb.status as brief_status,
              sp.progress_pct as site_progress_pct,
              sp.current_phase as site_current_phase,
              sp.lead_engineer,
              sp.virtual_tour_url,
              sp.virtual_tour_urls
             FROM public.client_projects cp
             LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
             LEFT JOIN public.site_projects sp ON cp.site_project_code = sp.project_code
             WHERE cp.client_project_id = $1
             LIMIT 1;`,
            [resolvedProject.client_project_id]
          );
          if (refreshedProjectRes.rows && refreshedProjectRes.rows.length > 0) {
            resolvedProject = refreshedProjectRes.rows[0];
          }
        } catch (autoErr) {
          console.warn("[getDashboardState] Groundbreaking auto-advance notice:", autoErr.message);
        }
      }
    }

    const activeProject = resolvedProject;

    // 4. Calculate Progressive Disclosure permission unlocks
    const currentStage = activeProject.stage_id || "PRE_INQUIRY";
    const currentLevel = STAGE_ORDER[currentStage] || 1;

    const stagePermissions = {
      canAccessPreInquiry: true,
      canAccessConsultation: currentLevel >= STAGE_ORDER.CONSULTATION,
      canAccessPreConstruction: currentLevel >= STAGE_ORDER.PRE_CONSTRUCTION,
      canAccessActiveBuild: currentLevel >= STAGE_ORDER.ACTIVE_BUILD,
      canAccessCompleted: currentLevel >= STAGE_ORDER.COMPLETED,
    };

    const unlockedStages = Object.keys(STAGE_ORDER).filter(
      (stageKey) => STAGE_ORDER[stageKey] <= currentLevel
    );

    // 5. Gather contextual summary telemetry for portal badges & notifications
    const projectId = activeProject.client_project_id;
    const projectCode = activeProject.site_project_code || activeProject.project_code;

    const [docsCountRes, unreadChatRes, meetingRes, blueprintsRes, pendingBillsRes] = await Promise.all([
      db.query(
        `SELECT COUNT(*) FROM public.project_documents 
         WHERE client_project_id = $1 
            OR client_project_id IN (
              SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = $2
            );`,
        [projectId, userId]
      ),
      db.query(
        `SELECT COUNT(*) FROM public.chat_messages 
         WHERE (
           client_project_id = $1 
           OR client_project_id IN (
             SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = $2
           )
         ) AND sender_user_id != $2 AND is_read = FALSE;`,
        [projectId, userId]
      ),
      db.query(
        `SELECT room_code, scheduled_start, scheduled_end, meeting_status, recording_url 
         FROM public.meeting_rooms 
         WHERE (
           client_project_id = $1 
           OR client_project_id IN (
             SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = $2
           )
         ) AND meeting_status IN ('SCHEDULED', 'IN_PROGRESS') 
         ORDER BY scheduled_start ASC 
         LIMIT 1;`,
        [projectId, userId]
      ),
      db.query(
        `SELECT COUNT(DISTINCT blueprint_id) FROM public.blueprints 
         WHERE client_project_id = $1 
            OR client_project_id IN (
              SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = $2
            );`,
        [projectId, userId]
      ),
      db.query(
        "SELECT COUNT(*) FROM public.billing_ledger WHERE project_code = $1 AND status = 'Pending';",
        [projectCode]
      ),
    ]);

    const documentsCount = parseInt(docsCountRes.rows[0]?.count || 0, 10);
    const unreadMessagesCount = parseInt(unreadChatRes.rows[0]?.count || 0, 10);
    const blueprintsCount = parseInt(blueprintsRes.rows[0]?.count || 0, 10);
    const pendingInvoicesCount = parseInt(pendingBillsRes.rows[0]?.count || 0, 10);
    const activeMeeting = meetingRes.rows && meetingRes.rows.length > 0 ? meetingRes.rows[0] : null;

    return {
      success: true,
      hasActiveProject: true,
      activeProject: {
        client_project_id: activeProject.client_project_id,
        project_code: activeProject.project_code,
        stage_id: activeProject.stage_id,
        project_title: activeProject.project_title,
        project_type: activeProject.project_type,
        target_location: activeProject.target_location,
        site_project_code: activeProject.site_project_code,
        site_progress_pct: activeProject.site_progress_pct || 0,
        site_current_phase: activeProject.site_current_phase || null,
        lead_engineer: activeProject.lead_engineer || null,
        virtual_tour_url: activeProject.virtual_tour_url || null,
        virtual_tour_urls: activeProject.virtual_tour_urls || [],
        created_at: activeProject.created_at,
        updated_at: activeProject.updated_at,
      },
      stage_id: currentStage,
      stageLevel: currentLevel,
      stageName: STAGE_NAMES[currentStage] || currentStage,
      is_multi_project_approved: Boolean(user.is_multi_project_approved),
      isKycVerified: Boolean(user.kyc_verified_at),
      userProfile: {
        userId: user.user_id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        clientType: user.client_type,
      },
      stagePermissions,
      unlockedStages,
      summaryCounters: {
        documentsCount,
        unreadMessagesCount,
        blueprintsCount,
        pendingInvoicesCount,
        activeMeeting,
      },
    };
  }

  /**
   * Client submits request for Multi-Project permission
   */
  async requestMultiProjectApproval(userId, note = "") {
    const res = await db.query(
      `UPDATE public.users 
       SET multi_project_requested_at = NOW(),
           multi_project_request_note = $1
       WHERE user_id = $2
       RETURNING user_id, email, full_name, is_multi_project_approved, multi_project_requested_at, multi_project_request_note;`,
      [note || "Requesting approval to start an additional project.", userId]
    );

    if (!res.rows || res.rows.length === 0) {
      const err = new Error("User record not found.");
      err.statusCode = 404;
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Reset or Archive a Rejected Inquiry to allow user to submit again cleanly
   */
  async resetRejectedInquiry({ projectId, userId }) {
    await db.query(
      `UPDATE public.client_projects 
       SET is_archived = TRUE, updated_at = NOW() 
       WHERE client_project_id = $1 AND user_id = $2;`,
      [projectId, userId]
    );

    await db.query(
      `INSERT INTO public.stage_transitions (
        client_project_id,
        from_stage,
        to_stage,
        transitioned_by,
        reason,
        created_at
      ) VALUES ($1, 'CONSULTATION', 'PRE_INQUIRY', $2, 'Inquiry rejected and archived - user permitted to re-inquire', NOW());`,
      [projectId, userId]
    );

    return { success: true, message: "Previous inquiry archived. Account eligible for new project inquiry." };
  }

  /**
   * DOCUMENT VAULT: List project documents
   */
  async getProjectDocuments(projectId, stageId = null) {
    let query = `
      SELECT pd.*, u.full_name as uploader_name, v.full_name as verifier_name
      FROM public.project_documents pd
      LEFT JOIN public.users u ON pd.uploaded_by = u.user_id
      LEFT JOIN public.users v ON pd.verified_by = v.user_id
      WHERE (
        pd.client_project_id = $1
        OR pd.client_project_id IN (
          SELECT cp.client_project_id 
          FROM public.client_projects cp 
          WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
        )
      )
    `;
    const params = [projectId];

    if (stageId) {
      query += ` AND pd.stage_id = $2`;
      params.push(stageId);
    }

    query += ` ORDER BY pd.created_at DESC;`;
    const res = await db.query(query, params);
    return res.rows || [];
  }

  /**
   * DOCUMENT VAULT: Upload new document
   */
  async uploadProjectDocument({ projectId, stageId, docType, fileName, fileUrl, fileSizeBytes = 0, mimeType = null, uploadedBy = null, notes = null }) {
    const res = await db.query(
      `INSERT INTO public.project_documents (
        client_project_id, stage_id, doc_type, file_name, file_url, file_size_bytes, mime_type, uploaded_by, verification_status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Review', $9, NOW())
      RETURNING *;`,
      [projectId, stageId, docType, fileName, fileUrl, fileSizeBytes, mimeType, uploadedBy, notes]
    );
    return res.rows[0];
  }

  /**
   * DOCUMENT VAULT: Admin Verification
   */
  async verifyProjectDocument({ docId, adminUserId, status, notes = null }) {
    let res = await db.query(
      `UPDATE public.project_documents 
       SET verification_status = $1, verified_by = $2, verified_at = NOW(), notes = COALESCE($3, notes)
       WHERE doc_id = $4
       RETURNING *;`,
      [status, adminUserId, notes, docId]
    );
    let verifiedDoc = res.rows[0];
    if (verifiedDoc && verifiedDoc.file_url) {
      await db.query(
        `UPDATE public.project_document_requests 
         SET status = $1, updated_at = NOW()
         WHERE file_url = $2;`,
        [status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'uploaded', verifiedDoc.file_url]
      ).catch(() => {});
    }

    // If not found by doc_id, check if docId is actually a request_id in project_document_requests
    if (!verifiedDoc) {
      const reqRes = await db.query(
        `UPDATE public.project_document_requests
         SET status = $1, updated_at = NOW()
         WHERE request_id = $2
         RETURNING *;`,
        [status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'uploaded', docId]
      );
      verifiedDoc = reqRes.rows[0];
      if (verifiedDoc && verifiedDoc.file_url) {
        await db.query(
          `UPDATE public.project_documents
           SET verification_status = $1, verified_by = $2, verified_at = NOW()
           WHERE file_url = $3;`,
          [status, adminUserId, verifiedDoc.file_url]
        ).catch(() => {});
      }
    }
    return verifiedDoc;
  }

  async deleteProjectDocument(docId) {
    await db.query(`DELETE FROM public.project_documents WHERE doc_id = $1;`, [docId]);
    return true;
  }

  /**
   * DOCUMENT VAULT: Admin Documents Overview
   */
  async getAdminDocumentsOverview() {
    const clientsRes = await db.query(`
      SELECT 
        cp.client_project_id,
        cp.project_code,
        cp.project_title,
        cp.project_type,
        cp.target_location as location,
        cp.stage_id,
        u.user_id,
        u.full_name as client_name,
        u.email as client_email,
        u.avatar_url,
        (SELECT COUNT(*) FROM public.project_document_requests WHERE client_project_id = cp.client_project_id OR client_project_id IN (SELECT cp2.client_project_id FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id)) as total_requests,
        (SELECT COUNT(*) FROM public.project_transmittals WHERE client_project_id = cp.client_project_id OR client_project_id IN (SELECT cp2.client_project_id FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id)) as total_transmittals,
        (SELECT COUNT(*) FROM public.project_documents WHERE client_project_id = cp.client_project_id OR client_project_id IN (SELECT cp2.client_project_id FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id)) as total_uploaded_docs
      FROM public.client_projects cp
      JOIN public.users u ON cp.user_id = u.user_id
      ORDER BY cp.created_at DESC;
    `);

    const reqsRes = await db.query(`
      SELECT 
        pdr.*,
        cp.project_code,
        cp.project_title,
        cp.project_type,
        u.full_name as client_name,
        u.email as client_email,
        u.avatar_url as client_avatar,
        req_u.full_name as requester_name
      FROM public.project_document_requests pdr
      JOIN public.client_projects cp ON pdr.client_project_id = cp.client_project_id
      JOIN public.users u ON cp.user_id = u.user_id
      LEFT JOIN public.users req_u ON pdr.requested_by = req_u.user_id
      ORDER BY pdr.created_at DESC;
    `);

    const txsRes = await db.query(`
      SELECT 
        pt.*,
        cp.project_code,
        cp.project_title,
        cp.project_type,
        u.full_name as client_name,
        u.email as client_email,
        u.avatar_url as client_avatar,
        tx_u.full_name as transmitter_name
      FROM public.project_transmittals pt
      JOIN public.client_projects cp ON pt.client_project_id = cp.client_project_id
      JOIN public.users u ON cp.user_id = u.user_id
      LEFT JOIN public.users tx_u ON pt.transmitted_by = tx_u.user_id
      ORDER BY pt.created_at DESC;
    `);

    const docsRes = await db.query(`
      SELECT 
        pd.*,
        cp.project_code,
        cp.project_title,
        cp.project_type,
        u.full_name as client_name,
        u.email as client_email,
        u.avatar_url as client_avatar,
        up_u.full_name as uploader_name,
        vf_u.full_name as verifier_name
      FROM public.project_documents pd
      JOIN public.client_projects cp ON pd.client_project_id = cp.client_project_id
      JOIN public.users u ON cp.user_id = u.user_id
      LEFT JOIN public.users up_u ON pd.uploaded_by = up_u.user_id
      LEFT JOIN public.users vf_u ON pd.verified_by = vf_u.user_id
      ORDER BY pd.created_at DESC;
    `);

    return {
      clients: clientsRes.rows || [],
      requests: reqsRes.rows || [],
      transmittals: txsRes.rows || [],
      documents: docsRes.rows || [],
    };
  }

  async createDocumentRequest({ projectId, title, category, urgency = 'Urgent', instructions = null, requestedBy = null }) {
    const res = await db.query(`
      INSERT INTO public.project_document_requests (
        client_project_id, title, category, urgency, instructions, status, requested_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW(), NOW())
      RETURNING *;
    `, [projectId, title, category, urgency, instructions, requestedBy]);
    return res.rows[0];
  }

  async deleteDocumentRequest(requestId) {
    await db.query(`DELETE FROM public.project_document_requests WHERE request_id = $1;`, [requestId]);
    return { success: true };
  }

  async createProjectTransmittal({ projectId, title, category, fileUrl, fileName, fileSizeBytes = 0, mimeType = null, remarks = null, transmittedBy = null }) {
    const res = await db.query(`
      INSERT INTO public.project_transmittals (
        client_project_id, title, category, file_url, file_name, file_size_bytes, mime_type, remarks, transmitted_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `, [projectId, title, category, fileUrl, fileName, fileSizeBytes, mimeType, remarks, transmittedBy]);
    return res.rows[0];
  }

  async deleteProjectTransmittal(transmittalId) {
    await db.query(`DELETE FROM public.project_transmittals WHERE transmittal_id = $1;`, [transmittalId]);
    return { success: true };
  }

  async getProjectDocumentRequests(projectId) {
    const res = await db.query(`
      SELECT * FROM public.project_document_requests
      WHERE client_project_id = $1
         OR client_project_id IN (
           SELECT cp.client_project_id 
           FROM public.client_projects cp 
           WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
         )
      ORDER BY created_at DESC;
    `, [projectId]);
    return res.rows || [];
  }

  async getProjectTransmittals(projectId) {
    const res = await db.query(`
      SELECT * FROM public.project_transmittals
      WHERE client_project_id = $1
         OR client_project_id IN (
           SELECT cp.client_project_id 
           FROM public.client_projects cp 
           WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
         )
      ORDER BY created_at DESC;
    `, [projectId]);
    return res.rows || [];
  }

  async fulfillDocumentRequest({ requestId = null, projectId, fileName, fileUrl, fileSizeBytes = 0, mimeType = null, uploadedBy = null, notes = null, docType = 'REQUIRED_DOCUMENT' }) {
    const docRes = await db.query(`
      INSERT INTO public.project_documents (
        client_project_id, stage_id, doc_type, file_name, file_url, file_size_bytes, mime_type, uploaded_by, verification_status, notes, created_at
      ) VALUES ($1, 'CONSULTATION', $2, $3, $4, $5, $6, $7, 'Pending Review', $8, NOW())
      RETURNING *;
    `, [projectId, docType, fileName, fileUrl, fileSizeBytes, mimeType, uploadedBy, notes]);
    const doc = docRes.rows[0];

    if (requestId) {
      await db.query(`
        UPDATE public.project_document_requests
        SET status = 'uploaded', file_url = $1, file_name = $2, file_size_bytes = $3, uploaded_at = NOW(), updated_at = NOW()
        WHERE request_id = $4;
      `, [fileUrl, fileName, fileSizeBytes, requestId]);
    } else {
      // Auto-match any pending request with the same title or category
      await db.query(`
        UPDATE public.project_document_requests
        SET status = 'uploaded', file_url = $1, file_name = $2, file_size_bytes = $3, uploaded_at = NOW(), updated_at = NOW()
        WHERE client_project_id = $4 AND status = 'pending' AND (title ILIKE $5 OR category ILIKE $5)
        LIMIT 1;
      `, [fileUrl, fileName, fileSizeBytes, projectId, `%${docType}%`]).catch(() => {});
    }
    return doc;
  }


  /**
   * CONSULTATION: Get or Create WebRTC Meeting Room
   */
  async getOrCreateMeetingRoom({ projectId, hostUserId = null, guestUserId = null, scheduledStart = null }) {
    // Check if room exists
    const existing = await db.query(
      `SELECT * FROM public.meeting_rooms 
       WHERE (
         client_project_id = $1 
         OR client_project_id IN (
           SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
         )
       ) AND meeting_status IN ('SCHEDULED', 'IN_PROGRESS')
       ORDER BY scheduled_start DESC LIMIT 1;`,
      [projectId]
    );

    if (existing.rows && existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Generate room code: e.g. "mcpa-room-b7f29a"
    const roomCode = `mcpa-meet-${crypto.randomBytes(4).toString("hex")}`;
    const insertRes = await db.query(
      `INSERT INTO public.meeting_rooms (
        client_project_id, room_code, host_user_id, guest_user_id, scheduled_start, meeting_status, created_at
      ) VALUES ($1, $2, $3, $4, COALESCE($5, NOW() + INTERVAL '1 hour'), 'SCHEDULED', NOW())
      RETURNING *;`,
      [projectId, roomCode, hostUserId, guestUserId, scheduledStart]
    );

    return insertRes.rows[0];
  }

  /**
   * IN-APP LIVE CHAT: Get message history
   */
  async getProjectMessages(projectId, limit = 50) {
    const res = await db.query(
      `SELECT cm.*, u.full_name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar
       FROM public.chat_messages cm
       JOIN public.users u ON cm.sender_user_id = u.user_id
       WHERE (
         cm.client_project_id = $1
         OR cm.client_project_id IN (
           SELECT cp.client_project_id 
           FROM public.client_projects cp 
           WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
         )
       )
       ORDER BY cm.created_at ASC
       LIMIT $2;`,
      [projectId, limit]
    );
    return res.rows || [];
  }

  /**
   * IN-APP LIVE CHAT: Send message
   */
  async sendProjectMessage({ projectId, senderUserId, messageText, attachments = [] }) {
    const res = await db.query(
      `INSERT INTO public.chat_messages (
        client_project_id, sender_user_id, message_text, attachments, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;`,
      [projectId, senderUserId, messageText, JSON.stringify(attachments)]
    );

    // Return with sender user details
    const userRes = await db.query(
      `SELECT full_name as sender_name, role as sender_role, avatar_url as sender_avatar FROM public.users WHERE user_id = $1;`,
      [senderUserId]
    );

    return {
      ...res.rows[0],
      ...(userRes.rows[0] || {}),
    };
  }

  /**
   * BLUEPRINT VIEWER: Get drawings with pins
   */
  async getProjectBlueprints(projectId, discipline = null) {
    let query = `
      SELECT * FROM (
        SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(b.sheet_number), ''), b.blueprint_id::text)) b.*
        FROM public.blueprints b
        WHERE (
          b.client_project_id = $1 
          OR b.client_project_id IN (
            SELECT cp.client_project_id 
            FROM public.client_projects cp 
            WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
          )
        )
        ORDER BY COALESCE(NULLIF(TRIM(b.sheet_number), ''), b.blueprint_id::text), b.client_project_id DESC, b.blueprint_id DESC
      ) sub
      WHERE 1=1
    `;
    const params = [projectId];

    if (discipline && discipline !== "ALL") {
      query += ` AND sub.discipline = $2`;
      params.push(discipline);
    }

    query += ` ORDER BY sub.blueprint_id ASC;`;
    const res = await db.query(query, params);
    return res.rows || [];
  }

  /**
   * BLUEPRINT VIEWER: Save annotation pin
   */
  async saveBlueprintPins(blueprintId, pins = []) {
    const res = await db.query(
      `UPDATE public.blueprints 
       SET pins = $1, updated_at = NOW()
       WHERE blueprint_id = $2
       RETURNING *;`,
      [JSON.stringify(pins), blueprintId]
    );
    return res.rows[0];
  }

  /**
   * BLUEPRINT VIEWER: Create / upload new blueprint or plan sheet
   */
  async createBlueprint(projectId, data) {
    const {
      discipline,
      sheet_number,
      title,
      revision_no = "Rev 0",
      file_url,
      thumbnail_url = null,
      media_type = "image",
      notes = null,
      pins = [],
    } = data;

    const res = await db.query(
      `INSERT INTO public.blueprints (
        client_project_id, discipline, sheet_number, title, revision_no, file_url, thumbnail_url, media_type, notes, pins, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;`,
      [
        projectId,
        discipline,
        sheet_number || "Sheet 1",
        title,
        revision_no,
        file_url,
        thumbnail_url,
        media_type,
        notes,
        JSON.stringify(pins),
      ]
    );
    return res.rows[0];
  }

  /**
   * BLUEPRINT VIEWER: Update plan metadata or revision
   */
  async updateBlueprint(blueprintId, data) {
    const existing = await db.query(`SELECT * FROM public.blueprints WHERE blueprint_id = $1`, [blueprintId]);
    if (!existing.rows.length) throw new Error("Blueprint not found");
    const current = existing.rows[0];

    const discipline = data.discipline !== undefined ? data.discipline : current.discipline;
    const sheet_number = data.sheet_number !== undefined ? data.sheet_number : current.sheet_number;
    const title = data.title !== undefined ? data.title : current.title;
    const revision_no = data.revision_no !== undefined ? data.revision_no : current.revision_no;
    const file_url = data.file_url !== undefined ? data.file_url : current.file_url;
    const thumbnail_url = data.thumbnail_url !== undefined ? data.thumbnail_url : current.thumbnail_url;
    const media_type = data.media_type !== undefined ? data.media_type : current.media_type;
    const notes = data.notes !== undefined ? data.notes : current.notes;
    const pins = data.pins !== undefined ? JSON.stringify(data.pins) : current.pins;

    const res = await db.query(
      `UPDATE public.blueprints
       SET discipline = $1, sheet_number = $2, title = $3, revision_no = $4, file_url = $5, thumbnail_url = $6, media_type = $7, notes = $8, pins = $9, updated_at = NOW()
       WHERE blueprint_id = $10
       RETURNING *;`,
      [discipline, sheet_number, title, revision_no, file_url, thumbnail_url, media_type, notes, pins, blueprintId]
    );
    return res.rows[0];
  }

  /**
   * BLUEPRINT VIEWER: Delete blueprint sheet
   */
  async deleteBlueprint(blueprintId) {
    const res = await db.query(`DELETE FROM public.blueprints WHERE blueprint_id = $1 RETURNING *;`, [blueprintId]);
    if (!res.rows.length) throw new Error("Blueprint not found");
    return res.rows[0];
  }

  /**
   * ADMIN BLUEPRINTS OVERVIEW:
   * Aggregates all client projects with blueprint metrics, stage status,
   * and identifies who is in Phase 2 / needs uploads.
   */
  async getAdminBlueprintsOverview() {
    const query = `
      SELECT 
        cp.client_project_id,
        cp.project_code,
        cp.project_title,
        cp.stage_id,
        cp.created_at,
        cp.groundbreaking_date,
        cp.revision_requests_count,
        cb.brief_id,
        COALESCE(cb.client_name, u.full_name, 'Valued Client') AS client_name,
        COALESCE(cb.client_email, u.email) AS client_email,
        cb.client_phone,
        cb.project_type,
        cb.location,
        u.avatar_url AS avatar_url,
        COALESCE(b_stats.total_blueprints, 0)::INT AS total_blueprints,
        COALESCE(b_stats.total_videos, 0)::INT AS total_videos,
        COALESCE(b_stats.architectural_count, 0)::INT AS architectural_count,
        COALESCE(b_stats.structural_count, 0)::INT AS structural_count,
        COALESCE(b_stats.electrical_count, 0)::INT AS electrical_count,
        COALESCE(b_stats.plumbing_count, 0)::INT AS plumbing_count,
        COALESCE(b_stats.elevation_count, 0)::INT AS elevation_count,
        COALESCE(b_stats.walkthrough_count, 0)::INT AS walkthrough_count
      FROM public.client_projects cp
      LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
      LEFT JOIN public.users u ON cp.user_id = u.user_id
      LEFT JOIN (
        SELECT 
          cp_inner.client_project_id,
          COUNT(DISTINCT b.blueprint_id)::INT AS total_blueprints,
          COUNT(DISTINCT CASE WHEN b.media_type = 'video' THEN b.blueprint_id END)::INT AS total_videos,
          COUNT(DISTINCT CASE WHEN b.discipline = 'ARCHITECTURAL' THEN b.blueprint_id END)::INT AS architectural_count,
          COUNT(DISTINCT CASE WHEN b.discipline = 'STRUCTURAL' THEN b.blueprint_id END)::INT AS structural_count,
          COUNT(DISTINCT CASE WHEN b.discipline = 'ELECTRICAL' THEN b.blueprint_id END)::INT AS electrical_count,
          COUNT(DISTINCT CASE WHEN b.discipline = 'PLUMBING' THEN b.blueprint_id END)::INT AS plumbing_count,
          COUNT(DISTINCT CASE WHEN b.discipline = '3D_ELEVATION' THEN b.blueprint_id END)::INT AS elevation_count,
          COUNT(DISTINCT CASE WHEN b.discipline = '3D_WALKTHROUGH' THEN b.blueprint_id END)::INT AS walkthrough_count
        FROM public.client_projects cp_inner
        LEFT JOIN public.blueprints b ON (
          b.client_project_id = cp_inner.client_project_id 
          OR b.client_project_id IN (
            SELECT cp2.client_project_id FROM public.client_projects cp2 WHERE cp2.user_id = cp_inner.user_id
          )
        )
        GROUP BY cp_inner.client_project_id
      ) b_stats ON cp.client_project_id = b_stats.client_project_id
      ORDER BY 
        CASE WHEN cp.stage_id = 'CONSULTATION' THEN 0 ELSE 1 END,
        cp.client_project_id DESC;
    `;
    const res = await db.query(query);
    return (res.rows || []).map((row) => ({
      ...row,
      is_phase2: row.stage_id === "CONSULTATION",
      needs_upload: (row.stage_id === "CONSULTATION" || row.stage_id === "PRE_CONSTRUCTION") && row.total_blueprints === 0,
    }));
  }

  /**
   * BLUEPRINT VIEWER: Update status of a specific client revision pin
   */
  async updateBlueprintPinStatus(blueprintId, pinId, status = "Resolved", resolutionNote = null) {
    const bpRes = await db.query(`SELECT pins FROM public.blueprints WHERE blueprint_id = $1`, [blueprintId]);
    if (!bpRes.rows.length) throw new Error("Blueprint not found");
    let pins = bpRes.rows[0].pins || [];
    if (typeof pins === "string") {
      try {
        pins = JSON.parse(pins);
      } catch {
        pins = [];
      }
    }
    pins = pins.map((p) => {
      if (p.id === pinId) {
        return {
          ...p,
          status,
          resolved: status === "Resolved",
          resolution_note: resolutionNote,
          resolved_at: status === "Resolved" ? new Date().toISOString() : null,
        };
      }
      return p;
    });

    const updateRes = await db.query(
      `UPDATE public.blueprints SET pins = $1, updated_at = NOW() WHERE blueprint_id = $2 RETURNING *;`,
      [JSON.stringify(pins), blueprintId]
    );
    return updateRes.rows[0];
  }

  /**
   * PERMITS & REVISIONS TRACKER
   */
  async getProjectPermits(projectId) {
    let res = await db.query(
      `SELECT * FROM public.permit_records 
       WHERE client_project_id = $1 
          OR client_project_id IN (
            SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
          )
       ORDER BY permit_id ASC;`,
      [projectId]
    );
    if (!res.rows || res.rows.length === 0) {
      // Seed default standard Philippine LGU permits for the project
      const defaultPermits = [
        { type: "BARANGAY_CLEARANCE", agency: "Barangay Hall (Local Jurisdiction)", status: "SUBMITTED", remarks: "Barangay construction permit application filed" },
        { type: "LOCATIONAL_CLEARANCE", agency: "City/Municipal Planning & Development Office", status: "UNDER_EVALUATION", remarks: "Zoning and land use conformance evaluation" },
        { type: "BUILDING_PERMIT", agency: "Office of the Building Official (OBO)", status: "UNDER_EVALUATION", remarks: "Architectural, Structural, MEPFS clearance review" },
        { type: "FSEC_FIRE", agency: "Bureau of Fire Protection (BFP)", status: "IN_PREPARATION", remarks: "Fire Safety Evaluation Clearance documents compiled" },
        { type: "OCCUPANCY_PERMIT", agency: "City/Municipal Engineering & Inspection", status: "NOT_STARTED", remarks: "Scheduled upon final post-construction punchlist clearance" },
      ];
      for (const p of defaultPermits) {
        try {
          await db.query(
            `INSERT INTO public.permit_records (client_project_id, permit_type, lgu_agency, status, remarks)
             VALUES ($1, $2, $3, $4, $5);`,
            [projectId, p.type, p.agency, p.status, p.remarks]
          );
        } catch (seedErr) {
          console.warn("[getProjectPermits] Seed notice:", seedErr.message);
        }
      }
      res = await db.query(
        `SELECT * FROM public.permit_records WHERE client_project_id = $1 ORDER BY permit_id ASC;`,
        [projectId]
      );
    }
    return res.rows || [];
  }

  async getAdminPermitsOverview() {
    const res = await db.query(
      `SELECT pr.*, cp.project_code, cp.project_title, cp.target_location, cp.status as project_status,
              COALESCE(u.full_name, cb.full_name, 'Valued Client') as client_name,
              COALESCE(u.email, cb.email, '') as client_email
       FROM public.permit_records pr
       JOIN public.client_projects cp ON pr.client_project_id = cp.client_project_id
       LEFT JOIN public.users u ON cp.user_id = u.user_id
       LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
       ORDER BY pr.client_project_id DESC, pr.permit_id ASC;`
    );
    return res.rows || [];
  }

  async updatePermitRecord({ permitId, status, filingDate = null, targetReleaseDate = null, actualReleaseDate = null, officialReceiptUrl = null, permitDocumentUrl = null, remarks = null }) {
    const res = await db.query(
      `UPDATE public.permit_records 
       SET status = COALESCE($1, status),
           filing_date = COALESCE($2, filing_date),
           target_release_date = COALESCE($3, target_release_date),
           actual_release_date = COALESCE($4, actual_release_date),
           official_receipt_url = COALESCE($5, official_receipt_url),
           permit_document_url = COALESCE($6, permit_document_url),
           remarks = COALESCE($7, remarks),
           updated_at = NOW()
       WHERE permit_id = $8
       RETURNING *;`,
      [status, filingDate, targetReleaseDate, actualReleaseDate, officialReceiptUrl, permitDocumentUrl, remarks, permitId]
    );
    return res.rows[0];
  }

  /**
   * GROUNDBREAKING CEREMONY ENGINE (PHASE 2 PRE-CONSTRUCTION KICKOFF)
   */
  async getAdminGroundbreakingOverview() {
    const query = `
      SELECT 
        cp.client_project_id,
        cp.project_code,
        cp.project_title,
        cp.stage_id,
        cp.target_location,
        cp.created_at,
        cp.groundbreaking_date,
        cp.groundbreaking_status,
        cp.groundbreaking_venue,
        cp.groundbreaking_officiant,
        cp.groundbreaking_notes,
        cp.groundbreaking_rescheduled_count,
        cp.groundbreaking_updated_at,
        cb.brief_id,
        COALESCE(cb.client_name, u.full_name, 'Valued Client') AS client_name,
        COALESCE(cb.client_email, u.email) AS client_email,
        cb.client_phone,
        cb.project_type,
        cb.location,
        u.avatar_url AS avatar_url,
        u.auth_provider,
        u.email_verified
      FROM public.client_projects cp
      LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
      LEFT JOIN public.users u ON cp.user_id = u.user_id
      WHERE cp.is_archived = FALSE
      ORDER BY 
        CASE 
          WHEN cp.groundbreaking_date IS NOT NULL AND cp.groundbreaking_date >= NOW() THEN 1
          WHEN cp.groundbreaking_date IS NOT NULL AND cp.groundbreaking_date < NOW() THEN 2
          ELSE 3 
        END,
        cp.groundbreaking_date ASC NULLS LAST,
        cp.client_project_id DESC;
    `;
    const res = await db.query(query);
    const projects = res.rows || [];

    // Fetch history audit trail for all projects
    let historyMap = new Map();
    try {
      const histRes = await db.query(
        `SELECT gh.*, u.full_name as author_name 
         FROM public.groundbreaking_history gh 
         LEFT JOIN public.users u ON gh.created_by = u.user_id 
         ORDER BY gh.created_at DESC;`
      );
      (histRes.rows || []).forEach((h) => {
        const pId = h.client_project_id;
        if (!historyMap.has(pId)) historyMap.set(pId, []);
        historyMap.get(pId).push(h);
      });
    } catch (e) {
      console.warn("[getAdminGroundbreakingOverview] History fetch notice:", e.message);
    }

    // Auto-advance any projects whose groundbreaking date has passed and are still in pre-construction
    for (const p of projects) {
      const isPast = Boolean(p.groundbreaking_date && new Date(p.groundbreaking_date).getTime() <= Date.now());
      if (
        (p.stage_id === "CONSULTATION" || p.stage_id === "PRE_CONSTRUCTION") &&
        (p.groundbreaking_status === "COMPLETED" || isPast)
      ) {
        try {
          if (p.groundbreaking_status !== "COMPLETED") {
            await db.query(
              "UPDATE public.client_projects SET groundbreaking_status = 'COMPLETED', updated_at = NOW() WHERE client_project_id = $1;",
              [p.client_project_id]
            );
            p.groundbreaking_status = "COMPLETED";
          }
          await this.advanceProjectStage({
            projectId: p.client_project_id,
            targetStage: "ACTIVE_BUILD",
            reason: "Automated progression: Groundbreaking ceremony concluded — physical construction active",
          });
          p.stage_id = "ACTIVE_BUILD";
        } catch (autoAdvErr) {
          console.warn("[getAdminGroundbreakingOverview] Auto-advance notice:", autoAdvErr.message);
        }
      }
    }

    return projects.map((p) => ({
      ...p,
      history: historyMap.get(p.client_project_id) || [],
    }));
  }

  async getProjectGroundbreaking(projectId) {
    const pRes = await db.query(
      `SELECT 
        cp.client_project_id,
        cp.project_code,
        cp.project_title,
        cp.stage_id,
        cp.target_location,
        COALESCE(cp.groundbreaking_date, (SELECT cp2.groundbreaking_date FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id AND cp2.groundbreaking_date IS NOT NULL ORDER BY cp2.client_project_id DESC LIMIT 1)) AS groundbreaking_date,
        COALESCE(cp.groundbreaking_status, (SELECT cp2.groundbreaking_status FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id AND cp2.groundbreaking_date IS NOT NULL ORDER BY cp2.client_project_id DESC LIMIT 1), 'PENDING') AS groundbreaking_status,
        COALESCE(cp.groundbreaking_venue, (SELECT cp2.groundbreaking_venue FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id AND cp2.groundbreaking_venue IS NOT NULL ORDER BY cp2.client_project_id DESC LIMIT 1)) AS groundbreaking_venue,
        COALESCE(cp.groundbreaking_officiant, (SELECT cp2.groundbreaking_officiant FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id AND cp2.groundbreaking_officiant IS NOT NULL ORDER BY cp2.client_project_id DESC LIMIT 1)) AS groundbreaking_officiant,
        COALESCE(cp.groundbreaking_notes, (SELECT cp2.groundbreaking_notes FROM public.client_projects cp2 WHERE cp2.user_id = cp.user_id AND cp2.groundbreaking_notes IS NOT NULL ORDER BY cp2.client_project_id DESC LIMIT 1)) AS groundbreaking_notes,
        cp.groundbreaking_rescheduled_count,
        cp.groundbreaking_updated_at,
        cb.location,
        cb.client_name
       FROM public.client_projects cp
       LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
       WHERE cp.client_project_id = $1
       LIMIT 1;`,
      [projectId]
    );

    if (!pRes.rows || pRes.rows.length === 0) return null;
    const project = pRes.rows[0];

    let history = [];
    try {
      const histRes = await db.query(
        `SELECT gh.*, u.full_name as author_name 
         FROM public.groundbreaking_history gh 
         LEFT JOIN public.users u ON gh.created_by = u.user_id 
         WHERE gh.client_project_id = $1 
            OR gh.client_project_id IN (
              SELECT cp.client_project_id FROM public.client_projects cp WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
            )
         ORDER BY gh.created_at DESC;`,
        [projectId]
      );
      history = histRes.rows || [];
    } catch (e) {}

    return { ...project, history };
  }

  async scheduleGroundbreaking({
    projectId,
    groundbreakingDate,
    venue = null,
    officiant = null,
    notes = null,
    status = null,
    rescheduleReason = null,
    adminUserId = null,
  }) {
    // 1. Fetch current project state
    const currentRes = await db.query(
      `SELECT groundbreaking_date, groundbreaking_status, groundbreaking_rescheduled_count, target_location, groundbreaking_venue, groundbreaking_officiant 
       FROM public.client_projects WHERE client_project_id = $1;`,
      [projectId]
    );

    if (!currentRes.rows || currentRes.rows.length === 0) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    const current = currentRes.rows[0];
    const prevDate = current.groundbreaking_date;
    const isReschedule = Boolean(prevDate && groundbreakingDate && new Date(prevDate).getTime() !== new Date(groundbreakingDate).getTime());

    let daysShifted = 0;
    let newRescheduleCount = current.groundbreaking_rescheduled_count || 0;
    let resolvedStatus = status;

    if (isReschedule) {
      newRescheduleCount += 1;
      const prevMs = new Date(prevDate).getTime();
      const newMs = new Date(groundbreakingDate).getTime();
      daysShifted = Math.round((newMs - prevMs) / (1000 * 60 * 60 * 24));
      if (!resolvedStatus) {
        resolvedStatus = "RESCHEDULED";
      }
    } else if (!resolvedStatus) {
      resolvedStatus = current.groundbreaking_status === "COMPLETED" ? "COMPLETED" : "SCHEDULED";
    }

    const resolvedVenue =
      typeof venue === "string"
        ? (venue.trim() || null)
        : current.groundbreaking_venue || null;

    const resolvedOfficiant =
      typeof officiant === "string"
        ? (officiant.trim() || null)
        : current.groundbreaking_officiant || null;

    const resolvedNotes =
      typeof notes === "string"
        ? (notes.trim() || null)
        : current.groundbreaking_notes || null;

    // 2. Update client_projects
    const updateRes = await db.query(
      `UPDATE public.client_projects 
       SET groundbreaking_date = $1,
           groundbreaking_status = $2,
           groundbreaking_venue = $3,
           groundbreaking_officiant = $4,
           groundbreaking_notes = $5,
           groundbreaking_rescheduled_count = $6,
           groundbreaking_updated_at = NOW(),
           updated_at = NOW()
       WHERE client_project_id = $7
       RETURNING *;`,
      [
        groundbreakingDate,
        resolvedStatus,
        resolvedVenue,
        resolvedOfficiant,
        resolvedNotes,
        newRescheduleCount,
        projectId,
      ]
    );

    // 3. Record in groundbreaking_history
    try {
      await db.query(
        `INSERT INTO public.groundbreaking_history (
          client_project_id,
          scheduled_date,
          previous_date,
          status,
          reschedule_reason,
          days_shifted,
          venue,
          officiant,
          notes,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());`,
        [
          projectId,
          groundbreakingDate,
          prevDate || null,
          resolvedStatus,
          rescheduleReason || (isReschedule ? (daysShifted > 0 ? `Delayed by ${daysShifted} days` : `Moved earlier by ${Math.abs(daysShifted)} days`) : "Official kickoff date established"),
          daysShifted,
          resolvedVenue,
          resolvedOfficiant,
          resolvedNotes,
          adminUserId,
        ]
      );
    } catch (histErr) {
      console.warn("[scheduleGroundbreaking] History insert notice:", histErr.message);
    }

    // 4. Record in stage_transitions
    try {
      await db.query(
        `INSERT INTO public.stage_transitions (
          client_project_id,
          from_stage,
          to_stage,
          transitioned_by,
          reason,
          metadata,
          created_at
        ) VALUES ($1, 'PRE_CONSTRUCTION', 'PRE_CONSTRUCTION', $2, $3, $4, NOW());`,
        [
          projectId,
          adminUserId,
          isReschedule ? `Groundbreaking ceremony rescheduled (${daysShifted >= 0 ? `+${daysShifted}d delay` : `${daysShifted}d advanced`})` : "Groundbreaking ceremony officially scheduled",
          JSON.stringify({
            groundbreakingDate,
            previousDate: prevDate,
            daysShifted,
            status: resolvedStatus,
            rescheduleReason,
            venue: resolvedVenue,
            officiant: resolvedOfficiant,
          }),
        ]
      );
    } catch (transErr) {}

    // 5. Automatic Stage 3 (ACTIVE_BUILD) Promotion: If Groundbreaking is COMPLETED or ceremony date/time has passed
    const isPastCeremony = Boolean(groundbreakingDate && new Date(groundbreakingDate).getTime() <= Date.now());
    if (resolvedStatus === "COMPLETED" || isPastCeremony) {
      try {
        const curCheck = await db.query(
          "SELECT stage_id FROM public.client_projects WHERE client_project_id = $1;",
          [projectId]
        );
        const currentStage = curCheck.rows[0]?.stage_id;
        if (currentStage === "CONSULTATION" || currentStage === "PRE_CONSTRUCTION") {
          await this.advanceProjectStage({
            projectId,
            targetStage: "ACTIVE_BUILD",
            adminUserId,
            reason: resolvedStatus === "COMPLETED"
              ? "Groundbreaking ceremony officially concluded — physical site execution commenced"
              : "Scheduled groundbreaking ceremony date/time concluded — physical site execution commenced",
            metadata: {
              groundbreakingDate,
              venue: resolvedVenue,
              officiant: resolvedOfficiant,
            },
          });
        }
      } catch (advErr) {
        console.warn("[scheduleGroundbreaking] Auto-advance to ACTIVE_BUILD warning:", advErr.message);
      }
    }

    const projectData = updateRes.rows[0];
    const fullProject = await this.getProjectGroundbreaking(projectId);
    return fullProject || projectData;
  }

  /**
   * CONTRACT & E-SIGNATURES
   */
  async getProjectContract(projectId) {
    let contractRes = await db.query(
      `SELECT * FROM public.contracts 
       WHERE client_project_id = $1 
          OR client_project_id IN (
            SELECT cp.client_project_id 
            FROM public.client_projects cp 
            WHERE cp.user_id = (SELECT user_id FROM public.client_projects WHERE client_project_id = $1)
          )
       ORDER BY contract_id DESC LIMIT 1;`,
      [projectId]
    );

    if (!contractRes.rows || contractRes.rows.length === 0) {
      // Auto-provision default contract record for this project so e-signing persists cleanly
      try {
        const projRes = await db.query(
          `SELECT cp.*, cq.total_amount 
           FROM public.client_projects cp
           LEFT JOIN public.client_quotations cq ON cq.client_project_id = cp.client_project_id
           WHERE cp.client_project_id = $1
           ORDER BY cq.quotation_id DESC
           LIMIT 1;`,
          [projectId]
        );
        if (projRes.rows && projRes.rows.length > 0) {
          const proj = projRes.rows[0];
          const contractNum = `CTR-${new Date().getFullYear()}-${proj.client_project_id}-${Math.floor(1000 + Math.random() * 9000)}`;
          const totalAmount = Number(proj.total_amount) || 3500000;
          contractRes = await db.query(
            `INSERT INTO public.contracts (
              client_project_id, contract_number, title, contract_type, total_contract_amount, downpayment_pct, retention_pct, contract_pdf_url, status, created_at, updated_at
            ) VALUES ($1, $2, $3, 'MAIN_CONSTRUCTION', $4, 20.00, 10.00, '/assets/docs/mcpa-master-agreement.pdf', 'SENT_FOR_SIGNATURE', NOW(), NOW())
            RETURNING *;`,
            [
              projectId,
              contractNum,
              `${proj.project_title || "Residential Construction"} — Master Turnkey Agreement`,
              totalAmount,
            ]
          );
        }
      } catch (provErr) {
        console.warn("[getProjectContract] Auto-provision contract notice:", provErr.message);
      }
    }

    if (!contractRes.rows || contractRes.rows.length === 0) {
      return null;
    }

    const contract = contractRes.rows[0];
    const sigsRes = await db.query(
      `SELECT * FROM public.contract_signatures WHERE contract_id = $1 ORDER BY signed_at ASC;`,
      [contract.contract_id]
    );

    // Fetch project metadata to enrich contract preview (client name, site address, floor area, etc.)
    let projectMeta = {};
    try {
      const projectRes = await db.query(
        `SELECT cp.client_project_id, cp.project_code, cp.project_title, cp.project_type, 
                COALESCE(cp.target_location, cb.location) AS location, 
                cb.lot_area, cb.storeys, cp.stage_id AS current_stage,
                COALESCE(u.full_name, cb.client_name, 'Client') AS client_name,
                COALESCE(u.email, cb.client_email, 'client@mcpa.com') AS client_email,
                cb.client_phone
         FROM public.client_projects cp
         LEFT JOIN public.users u ON cp.user_id = u.user_id
         LEFT JOIN public.client_briefs cb ON cp.brief_id = cb.brief_id
         WHERE cp.client_project_id = $1
         LIMIT 1;`,
        [contract.client_project_id]
      );
      if (projectRes.rows && projectRes.rows.length > 0) {
        projectMeta = projectRes.rows[0];
      }
    } catch (metaErr) {
      console.warn("[getProjectContract] Could not enrich project metadata:", metaErr.message);
    }

    return {
      ...contract,
      project_meta: projectMeta,
      signatures: sigsRes.rows || [],
    };
  }

  async signProjectContract({ contractId, projectId = null, userId, signerRole, signerName, signerEmail, signatureImageUrl, ipAddress = null, userAgent = null }) {
    let resolvedContractId = parseInt(contractId, 10);

    // If contractId is missing or invalid, resolve/provision via projectId
    if ((isNaN(resolvedContractId) || resolvedContractId <= 0) && projectId) {
      const projContract = await this.getProjectContract(parseInt(projectId, 10));
      if (projContract?.contract_id) {
        resolvedContractId = projContract.contract_id;
      }
    }

    // Verify contract exists; if contractId was actually a projectId, resolve its contract
    if (!isNaN(resolvedContractId) && resolvedContractId > 0) {
      const checkRes = await db.query(
        `SELECT contract_id FROM public.contracts WHERE contract_id = $1 LIMIT 1;`,
        [resolvedContractId]
      );
      if (!checkRes.rows || checkRes.rows.length === 0) {
        const byProj = await this.getProjectContract(resolvedContractId);
        if (byProj?.contract_id) {
          resolvedContractId = byProj.contract_id;
        }
      }
    }

    const normalizedRole = (signerRole || "CLIENT").toUpperCase();
    const hashData = `${resolvedContractId}-${userId || 0}-${normalizedRole}-${signerEmail}-${new Date().toISOString()}`;
    const hashSha256 = crypto.createHash("sha256").update(hashData).digest("hex");

    const sigRes = await db.query(
      `INSERT INTO public.contract_signatures (
        contract_id, user_id, signer_role, signer_name, signer_email, signature_type, signature_image_url, ip_address, user_agent, signed_at, hash_sha256
      ) VALUES ($1, $2, $3, $4, $5, 'DRAWN', $6, $7, $8, NOW(), $9)
      RETURNING *;`,
      [resolvedContractId, userId || null, normalizedRole, signerName, signerEmail, signatureImageUrl, ipAddress, userAgent, hashSha256]
    );

    // Determine mutual execution status: check all signatures for this contract
    const allSigsRes = await db.query(
      `SELECT signer_role FROM public.contract_signatures WHERE contract_id = $1;`,
      [resolvedContractId]
    );
    const existingRoles = (allSigsRes.rows || []).map((r) => (r.signer_role || "").toUpperCase());
    const hasClientSig = existingRoles.includes("CLIENT");
    const hasContractorSig = existingRoles.includes("CONTRACTOR") || existingRoles.includes("ADMIN");

    const updatedStatus = (hasClientSig && hasContractorSig) ? "FULLY_EXECUTED" : "PARTIALLY_EXECUTED";

    // Update contract status
    await db.query(
      `UPDATE public.contracts 
       SET status = $1, updated_at = NOW()
       WHERE contract_id = $2;`,
      [updatedStatus, resolvedContractId]
    );

    return sigRes.rows[0];
  }

  /**
   * FINANCING & BNPL TRACKER
   */
  async getProjectLoans(projectId) {
    const res = await db.query(
      `SELECT * FROM public.loan_records WHERE client_project_id = $1 ORDER BY loan_id ASC;`,
      [projectId]
    );
    return res.rows || [];
  }

  /**
   * POST-CONSTRUCTION: MCPA Project Wrapped & Recap
   */
  async getProjectWrapped(projectId) {
    const res = await db.query(
      `SELECT * FROM public.project_wrapped WHERE client_project_id = $1 LIMIT 1;`,
      [projectId]
    );

    // Fetch project & earliest/latest site photos to ensure real before/after imagery
    const projRes = await db.query(
      `SELECT cp.*, sp.contract_date, sp.original_turnover, sp.revised_turnover
       FROM public.client_projects cp
       LEFT JOIN public.site_projects sp ON cp.site_project_code = sp.project_code
       WHERE cp.client_project_id = $1 LIMIT 1;`,
      [projectId]
    );

    const project = projRes.rows?.[0] || null;
    const projectCode = project ? (project.site_project_code || project.project_code) : null;

    let firstPhotoUrl = null;
    let latestPhotoUrl = null;
    if (projectCode) {
      const [firstPhotoRes, latestPhotoRes] = await Promise.all([
        db.query("SELECT image_url FROM public.site_photo_logs WHERE project_code = $1 ORDER BY created_at ASC, log_id ASC LIMIT 1;", [projectCode]).catch(() => ({ rows: [] })),
        db.query("SELECT image_url FROM public.site_photo_logs WHERE project_code = $1 ORDER BY created_at DESC, log_id DESC LIMIT 1;", [projectCode]).catch(() => ({ rows: [] })),
      ]);
      firstPhotoUrl = firstPhotoRes.rows?.[0]?.image_url || null;
      latestPhotoUrl = latestPhotoRes.rows?.[0]?.image_url || null;
    }

    if (res.rows && res.rows.length > 0) {
      const existingWrapped = res.rows[0];
      if ((!existingWrapped.before_photo_url && firstPhotoUrl) || (!existingWrapped.after_photo_url && latestPhotoUrl)) {
        const updatedBefore = existingWrapped.before_photo_url || firstPhotoUrl;
        const updatedAfter = existingWrapped.after_photo_url || latestPhotoUrl;
        await db.query(
          "UPDATE public.project_wrapped SET before_photo_url = $1, after_photo_url = $2 WHERE wrapped_id = $3;",
          [updatedBefore, updatedAfter, existingWrapped.wrapped_id]
        ).catch(() => {});
        existingWrapped.before_photo_url = updatedBefore;
        existingWrapped.after_photo_url = updatedAfter;
      }
      return existingWrapped;
    }

    if (!project) return null;

    // Gather stats
    const [photosCountRes, milestonesCountRes] = await Promise.all([
      db.query("SELECT COUNT(*) FROM public.site_photo_logs WHERE project_code = $1;", [projectCode]),
      db.query("SELECT COUNT(*) FROM public.site_milestones WHERE project_code = $1 AND completion_pct = 100;", [projectCode]),
    ]);

    const totalPhotos = parseInt(photosCountRes.rows[0]?.count || 0, 10);
    const completedMilestones = parseInt(milestonesCountRes.rows[0]?.count || 0, 10);
    const shareToken = `mcpa-wrapped-${crypto.randomBytes(6).toString("hex")}`;
    const buildDays = Math.max(1, Math.round((Date.now() - new Date(project.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));

    const defaultStoryCards = [
      {
        id: "intro",
        headline: "From Vision to Reality",
        subtext: `Your ${project.project_title} reached 100% completion with MCPA craftsmanship.`,
        metric: "100%",
        metricLabel: "Turnkey Completed",
      },
      {
        id: "duration",
        headline: "Dedication on the Ground",
        subtext: "Every foundation, beam, and finish was meticulously built and inspected.",
        metric: `${buildDays} Days`,
        metricLabel: "Total Build Journey",
      },
      {
        id: "craftsmanship",
        headline: "Precision Engineering",
        subtext: `${totalPhotos} photo inspections logged across ${completedMilestones} completed major milestones.`,
        metric: `${totalPhotos} Photos`,
        metricLabel: "Site Quality Logs",
      },
    ];

    const insertRes = await db.query(
      `INSERT INTO public.project_wrapped (
        client_project_id, total_days_duration, total_workers_employed, total_concrete_bags, total_steel_kg, total_photos_logged, before_photo_url, after_photo_url, story_cards, share_token, is_public_shared, created_at
      ) VALUES ($1, $2, 0, 0, 0, $3, $4, $5, $6, $7, TRUE, NOW())
      RETURNING *;`,
      [projectId, buildDays, totalPhotos, firstPhotoUrl, latestPhotoUrl, JSON.stringify(defaultStoryCards), shareToken]
    );

    return insertRes.rows[0];
  }

  /**
   * Public Wrapped Access by Token (Read-Only)
   */
  async getPublicWrappedByToken(shareToken) {
    const res = await db.query(
      `SELECT pw.*, cp.project_title, cp.project_type, cp.target_location, cp.created_at as project_started_at
       FROM public.project_wrapped pw
       JOIN public.client_projects cp ON pw.client_project_id = cp.client_project_id
       WHERE pw.share_token = $1 AND pw.is_public_shared = TRUE
       LIMIT 1;`,
      [shareToken]
    );

    if (!res.rows || res.rows.length === 0) {
      const err = new Error("Project recap not found or private.");
      err.statusCode = 404;
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Administrative Stage Advancement
   * Advances a project's stage with validation, integrity check, and audit trail.
   */
  async advanceProjectStage({ projectId, briefId, targetStage, adminUserId, reason = "Administrative progression", metadata = {} }) {
    const targetLevel = STAGE_ORDER[targetStage];
    if (!targetLevel) {
      const err = new Error(`Invalid target stage: ${targetStage}`);
      err.statusCode = 400;
      throw err;
    }

    let project = null;
    const parsedProjectId = parseInt(projectId, 10);

    // 1. Resolve by client_project_id if numeric
    if (!isNaN(parsedProjectId) && parsedProjectId > 0) {
      const currentRes = await db.query(
        "SELECT * FROM public.client_projects WHERE client_project_id = $1 LIMIT 1;",
        [parsedProjectId]
      );
      if (currentRes.rows && currentRes.rows.length > 0) {
        project = currentRes.rows[0];
      }
    }

    // 2. Resolve by project_code if string
    if (!project && projectId && typeof projectId === "string" && isNaN(Number(projectId))) {
      const codeRes = await db.query(
        "SELECT * FROM public.client_projects WHERE project_code = $1 LIMIT 1;",
        [projectId.trim()]
      );
      if (codeRes.rows && codeRes.rows.length > 0) {
        project = codeRes.rows[0];
      }
    }

    // 3. Resolve by briefId or fallback identifier
    if (!project && (briefId || projectId)) {
      const bIdentifier = briefId || projectId;
      const numBId = parseInt(bIdentifier, 10);
      const isNum = !isNaN(numBId) && numBId > 0;

      // 3.1 Check if client_projects already has this numeric brief_id
      if (isNum) {
        const resByBrief = await db.query(
          "SELECT * FROM public.client_projects WHERE brief_id = $1 LIMIT 1;",
          [numBId]
        );
        if (resByBrief.rows && resByBrief.rows.length > 0) {
          project = resByBrief.rows[0];
        }
      }

      // 3.2 Query client_briefs safely without SQL type errors
      if (!project) {
        const briefRes = await db.query(
          "SELECT * FROM public.client_briefs WHERE (brief_id = $1 AND $1 > 0) OR submission_id = $2 LIMIT 1;",
          [isNum ? numBId : -1, String(bIdentifier).trim()]
        );

        if (briefRes.rows && briefRes.rows.length > 0) {
          const b = briefRes.rows[0];

          // Check if a client_projects record already exists for this brief
          const projCheck = await db.query(
            "SELECT * FROM public.client_projects WHERE brief_id = $1 LIMIT 1;",
            [b.brief_id]
          );

          if (projCheck.rows && projCheck.rows.length > 0) {
            project = projCheck.rows[0];
          } else {
            // Find existing user or auto-provision client user record
            let uid = b.user_id;
            if (!uid && b.client_email) {
              const uRes = await db.query(
                "SELECT user_id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
                [b.client_email.trim()]
              );
              if (uRes.rows && uRes.rows.length > 0) {
                uid = uRes.rows[0].user_id;
              } else {
                const bcrypt = require("bcryptjs");
                const portalCode = `MCPA-${(b.client_name || "CLI").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
                const tempPass = portalCode.toLowerCase();
                const hashed = await bcrypt.hash(tempPass, 10);
                const newU = await db.query(
                  "INSERT INTO public.users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'client') RETURNING user_id;",
                  [b.client_email.trim(), hashed, b.client_name || "Valued Client"]
                );
                if (newU.rows && newU.rows.length > 0) {
                  uid = newU.rows[0].user_id;
                }
              }

              if (uid && b.brief_id) {
                await db.query("UPDATE public.client_briefs SET user_id = $1 WHERE brief_id = $2;", [uid, b.brief_id]).catch(() => {});
              }
            }

            if (uid) {
              // Administrator is explicitly advancing/authorizing this brief -> grant multi-project permission and bypass anti-spam
              await db.query(
                "UPDATE public.users SET is_multi_project_approved = TRUE WHERE user_id = $1;",
                [uid]
              ).catch(() => {});

              project = await this.createInquiryProject({
                userId: uid,
                projectTitle: `${b.project_type || "Residential"} Project (${b.client_name || "Client"})`,
                projectType: b.project_type || "Residential",
                targetLocation: b.location || null,
                briefId: b.brief_id,
                bypassAntiSpam: true,
              });
            }
          }
        }
      }
    }

    if (!project) {
      const err = new Error("Target project not found. Please ensure the client brief has an associated valid record.");
      err.statusCode = 404;
      throw err;
    }

    const resolvedProjectId = project.client_project_id;
    const fromStage = project.stage_id;

    // 4. Update client_projects stage
    const updateRes = await db.query(
      `UPDATE public.client_projects 
       SET stage_id = $1, updated_at = NOW() 
       WHERE client_project_id = $2 
       RETURNING *;`,
      [targetStage, resolvedProjectId]
    );

    const updatedProject = updateRes.rows[0];

    // 5. Synchronize client_briefs bridge if linked
    const linkedBriefId = project.brief_id;
    if (linkedBriefId) {
      await db.query(
        `UPDATE public.client_briefs 
         SET current_stage_status = $1, client_project_id = $2 
         WHERE brief_id = $3;`,
        [targetStage, resolvedProjectId, linkedBriefId]
      ).catch(() => {});
    }

    // 6. If advancing to Stage 3 (ACTIVE_BUILD), ensure site_projects & milestones are seeded for telemetry
    if (targetStage === "ACTIVE_BUILD") {
      try {
        const pCode = updatedProject.site_project_code || updatedProject.project_code || `PRJ-${resolvedProjectId}`;
        const uRes = await db.query(
          "SELECT email, full_name FROM public.users WHERE user_id = $1 LIMIT 1;",
          [updatedProject.user_id]
        );
        const clientEmail = uRes.rows[0]?.email || "";
        const clientName = uRes.rows[0]?.full_name || "Valued Client";

        const spCheck = await db.query(
          "SELECT project_id FROM public.site_projects WHERE project_code = $1 OR client_project_id = $2 LIMIT 1;",
          [pCode, resolvedProjectId]
        );

        if (!spCheck.rows || spCheck.rows.length === 0) {
          await db.query(
            `INSERT INTO public.site_projects (
              project_code, name, client_name, client_email, location,
              contract_date, original_turnover, revised_turnover,
              progress_pct, current_phase, lead_engineer, status, client_project_id
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NULL, NULL, 0, 'Site Mobilization & Preparation', NULL, 'Active Site Execution', $6)
            ON CONFLICT (project_code) DO NOTHING;`,
            [pCode, updatedProject.project_title || "Residential Construction", clientName, clientEmail, updatedProject.target_location || "Bulacan", resolvedProjectId]
          );

          await db.query(
            "UPDATE public.client_projects SET site_project_code = $1 WHERE client_project_id = $2;",
            [pCode, resolvedProjectId]
          );
        }
      } catch (spErr) {
        console.warn("[stageEngineService] site_projects setup notice:", spErr.message);
      }
    }

    // 7. Record transition audit
    await db.query(
      `INSERT INTO public.stage_transitions (
        client_project_id,
        from_stage,
        to_stage,
        transitioned_by,
        reason,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW());`,
      [resolvedProjectId, fromStage, targetStage, adminUserId, reason, JSON.stringify(metadata)]
    );

    return updatedProject;
  }
}

module.exports = new StageEngineService();

