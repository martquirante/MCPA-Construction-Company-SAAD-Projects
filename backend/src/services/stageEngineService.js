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
  async createInquiryProject({ userId, projectTitle, projectType = "Residential", targetLocation = null, briefId = null, metadata = {} }) {
    // 1. Run Anti-Spam Gatekeeper check
    const eligibility = await this.checkAntiSpamEligibility(userId);
    if (!eligibility.allowed) {
      const err = new Error(
        "Policy Restriction: You have an existing active construction project. To initiate another project, your account must receive multi-project approval from MCPA Administration."
      );
      err.code = "ACTIVE_PROJECT_LIMIT_EXCEEDED";
      err.statusCode = 409;
      err.activeProject = eligibility.activeProject;
      throw err;
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

    const title = projectTitle || `${projectType} Residence (${eligibility.user.full_name || "Client"})`;

    // 3. Insert new row into client_projects at CONSULTATION stage
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
      ) VALUES ($1, $2, 'CONSULTATION', $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;`,
      [projectCode, userId, title, projectType, targetLocation, briefId]
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
      ) VALUES ($1, 'PRE_INQUIRY', 'CONSULTATION', $2, $3, $4, NOW());`,
      [
        newProject.client_project_id,
        userId,
        "Client inquiry initiated and elevated to Consultation stage",
        JSON.stringify({ ...metadata, clientIp: metadata.ip || null }),
      ]
    );

    // 5. If linked to an existing client_briefs record, update the bridge reference
    if (briefId) {
      await db.query(
        `UPDATE public.client_briefs 
         SET client_project_id = $1, current_stage_status = 'CONSULTATION' 
         WHERE brief_id = $2;`,
        [newProject.client_project_id, briefId]
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
        sp.virtual_tour_url
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
          (latestBrief.status || "").toLowerCase().includes("reject");

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
            const projectTitle = `${latestBrief.project_type || "Residential"} Project (${user.full_name || latestBrief.client_name || "Client"})`;
            resolvedProject = await this.createInquiryProject({
              userId,
              projectTitle,
              projectType: latestBrief.project_type || "Residential Design & Build",
              targetLocation: latestBrief.location || null,
              briefId: latestBrief.brief_id,
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
      db.query("SELECT COUNT(*) FROM public.project_documents WHERE client_project_id = $1;", [projectId]),
      db.query(
        "SELECT COUNT(*) FROM public.chat_messages WHERE client_project_id = $1 AND sender_user_id != $2 AND is_read = FALSE;",
        [projectId, userId]
      ),
      db.query(
        `SELECT room_code, scheduled_start, scheduled_end, meeting_status, recording_url 
         FROM public.meeting_rooms 
         WHERE client_project_id = $1 AND meeting_status IN ('SCHEDULED', 'IN_PROGRESS') 
         ORDER BY scheduled_start ASC 
         LIMIT 1;`,
        [projectId]
      ),
      db.query("SELECT COUNT(*) FROM public.blueprints WHERE client_project_id = $1;", [projectId]),
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
      WHERE pd.client_project_id = $1
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
    const res = await db.query(
      `UPDATE public.project_documents 
       SET verification_status = $1, verified_by = $2, verified_at = NOW(), notes = COALESCE($3, notes)
       WHERE doc_id = $4
       RETURNING *;`,
      [status, adminUserId, notes, docId]
    );
    return res.rows[0];
  }

  /**
   * CONSULTATION: Get or Create WebRTC Meeting Room
   */
  async getOrCreateMeetingRoom({ projectId, hostUserId = null, guestUserId = null, scheduledStart = null }) {
    // Check if room exists
    const existing = await db.query(
      `SELECT * FROM public.meeting_rooms 
       WHERE client_project_id = $1 AND meeting_status IN ('SCHEDULED', 'IN_PROGRESS')
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
       WHERE cm.client_project_id = $1
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
    let query = `SELECT * FROM public.blueprints WHERE client_project_id = $1`;
    const params = [projectId];

    if (discipline) {
      query += ` AND discipline = $2`;
      params.push(discipline);
    }

    query += ` ORDER BY blueprint_id ASC;`;
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
   * PERMITS & REVISIONS TRACKER
   */
  async getProjectPermits(projectId) {
    const res = await db.query(
      `SELECT * FROM public.permit_records WHERE client_project_id = $1 ORDER BY permit_id ASC;`,
      [projectId]
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
   * GROUNDBREAKING CEREMONY SCHEDULER
   */
  async scheduleGroundbreaking({ projectId, groundbreakingDate, adminUserId = null }) {
    const res = await db.query(
      `UPDATE public.client_projects 
       SET groundbreaking_date = $1, updated_at = NOW()
       WHERE client_project_id = $2
       RETURNING *;`,
      [groundbreakingDate, projectId]
    );

    await db.query(
      `INSERT INTO public.stage_transitions (
        client_project_id,
        from_stage,
        to_stage,
        transitioned_by,
        reason,
        metadata,
        created_at
      ) VALUES ($1, 'PRE_CONSTRUCTION', 'PRE_CONSTRUCTION', $2, 'Groundbreaking ceremony scheduled', $3, NOW());`,
      [projectId, adminUserId, JSON.stringify({ groundbreakingDate })]
    );

    return res.rows[0];
  }

  /**
   * CONTRACT & E-SIGNATURES
   */
  async getProjectContract(projectId) {
    const contractRes = await db.query(
      `SELECT * FROM public.contracts WHERE client_project_id = $1 ORDER BY contract_id DESC LIMIT 1;`,
      [projectId]
    );

    if (!contractRes.rows || contractRes.rows.length === 0) {
      return null;
    }

    const contract = contractRes.rows[0];
    const sigsRes = await db.query(
      `SELECT * FROM public.contract_signatures WHERE contract_id = $1 ORDER BY signed_at ASC;`,
      [contract.contract_id]
    );

    return {
      ...contract,
      signatures: sigsRes.rows || [],
    };
  }

  async signProjectContract({ contractId, userId, signerRole, signerName, signerEmail, signatureImageUrl, ipAddress = null, userAgent = null }) {
    const hashData = `${contractId}-${userId}-${signerEmail}-${new Date().toISOString()}`;
    const hashSha256 = crypto.createHash("sha256").update(hashData).digest("hex");

    const sigRes = await db.query(
      `INSERT INTO public.contract_signatures (
        contract_id, user_id, signer_role, signer_name, signer_email, signature_type, signature_image_url, ip_address, user_agent, signed_at, hash_sha256
      ) VALUES ($1, $2, $3, $4, $5, 'DRAWN', $6, $7, $8, NOW(), $9)
      RETURNING *;`,
      [contractId, userId, signerRole, signerName, signerEmail, signatureImageUrl, ipAddress, userAgent, hashSha256]
    );

    // Update contract status
    await db.query(
      `UPDATE public.contracts 
       SET status = 'FULLY_EXECUTED', updated_at = NOW()
       WHERE contract_id = $1;`,
      [contractId]
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

    if (res.rows && res.rows.length > 0) {
      return res.rows[0];
    }

    // Auto-generate initial wrapped draft from project telemetry if not yet present
    const projRes = await db.query(
      `SELECT cp.*, sp.contract_date, sp.original_turnover, sp.revised_turnover
       FROM public.client_projects cp
       LEFT JOIN public.site_projects sp ON cp.site_project_code = sp.project_code
       WHERE cp.client_project_id = $1 LIMIT 1;`,
      [projectId]
    );

    if (!projRes.rows || projRes.rows.length === 0) return null;

    const project = projRes.rows[0];
    const projectCode = project.site_project_code || project.project_code;

    // Gather stats
    const [photosCountRes, milestonesCountRes] = await Promise.all([
      db.query("SELECT COUNT(*) FROM public.site_photo_logs WHERE project_code = $1;", [projectCode]),
      db.query("SELECT COUNT(*) FROM public.site_milestones WHERE project_code = $1 AND completion_pct = 100;", [projectCode]),
    ]);

    const totalPhotos = parseInt(photosCountRes.rows[0]?.count || 0, 10);
    const completedMilestones = parseInt(milestonesCountRes.rows[0]?.count || 0, 10);
    const shareToken = `mcpa-wrapped-${crypto.randomBytes(6).toString("hex")}`;

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
        metric: "185 Days",
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
        client_project_id, total_days_duration, total_workers_employed, total_concrete_bags, total_steel_kg, total_photos_logged, story_cards, share_token, is_public_shared, created_at
      ) VALUES ($1, 185, 24, 850, 4200, $2, $3, $4, TRUE, NOW())
      RETURNING *;`,
      [projectId, totalPhotos, JSON.stringify(defaultStoryCards), shareToken]
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
    if (projectId) {
      const currentRes = await db.query(
        "SELECT * FROM public.client_projects WHERE client_project_id = $1 LIMIT 1;",
        [projectId]
      );
      if (currentRes.rows && currentRes.rows.length > 0) {
        project = currentRes.rows[0];
      }
    }

    if (!project && (briefId || projectId)) {
      const bIdentifier = briefId || projectId;
      const resByBrief = await db.query(
        "SELECT * FROM public.client_projects WHERE brief_id = $1 LIMIT 1;",
        [bIdentifier]
      );
      if (resByBrief.rows && resByBrief.rows.length > 0) {
        project = resByBrief.rows[0];
      } else {
        const briefRes = await db.query(
          "SELECT * FROM public.client_briefs WHERE brief_id = $1 OR submission_id = $2 LIMIT 1;",
          [isNaN(Number(bIdentifier)) ? -1 : Number(bIdentifier), String(bIdentifier)]
        );
        if (briefRes.rows && briefRes.rows.length > 0) {
          const b = briefRes.rows[0];
          let uid = b.user_id;
          if (!uid) {
            const uRes = await db.query(
              "SELECT user_id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
              [b.client_email]
            );
            if (uRes.rows && uRes.rows.length > 0) uid = uRes.rows[0].user_id;
          }
          if (uid) {
            project = await this.createInquiryProject({
              userId: uid,
              projectTitle: `${b.project_type || "Residential"} Project (${b.client_name || "Client"})`,
              projectType: b.project_type || "Residential",
              targetLocation: b.location || null,
              briefId: b.brief_id,
            });
          }
        }
      }
    }

    if (!project) {
      const err = new Error("Target project not found.");
      err.statusCode = 404;
      throw err;
    }

    const resolvedProjectId = project.client_project_id;
    const fromStage = project.stage_id;

    // Update project stage
    const updateRes = await db.query(
      `UPDATE public.client_projects 
       SET stage_id = $1, updated_at = NOW() 
       WHERE client_project_id = $2 
       RETURNING *;`,
      [targetStage, resolvedProjectId]
    );

    // Record transition audit
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

    return updateRes.rows[0];
  }
}

module.exports = new StageEngineService();

