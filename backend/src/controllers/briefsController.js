const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const bcrypt = require("bcryptjs");
const emailService = require("../services/emailService");
const { generateRoomCode, formatRoomCode, extractRoomCode, buildMeetingUrl } = require("../utils/roomCodeHelper");

class BriefsController {
  async getAll(req, res) {
    try {
      let briefs = [];
      try {
        const result = await db.query(`
          SELECT 
            cb.*,
            cp.client_project_id,
            cp.stage_id AS current_project_stage,
            cp.project_code,
            cp.groundbreaking_date,
            cp.revision_requests_count
          FROM public.client_briefs cb
          LEFT JOIN (
            SELECT DISTINCT ON (brief_id) *
            FROM public.client_projects
            WHERE brief_id IS NOT NULL
            ORDER BY brief_id, client_project_id DESC
          ) cp ON cb.brief_id = cp.brief_id
          ORDER BY cb.brief_id DESC;
        `);
        briefs = result.rows || [];
      } catch (joinErr) {
        console.warn("[BriefsController.getAll] client_projects join notice, falling back:", joinErr.message);
        const fallbackRes = await db.query("SELECT * FROM client_briefs ORDER BY brief_id DESC;");
        briefs = fallbackRes.rows || [];
      }

      try {
        const usersRes = await db.query("SELECT user_id, email, avatar_url, auth_provider, email_verified FROM users");
        const users = usersRes.rows || [];
        const userMap = new Map();
        users.forEach((u) => {
          if (u.email) userMap.set(u.email.toLowerCase().trim(), u);
          if (u.user_id) userMap.set(String(u.user_id), u);
        });

        briefs = briefs.map((b) => {
          const user =
            (b.user_id && userMap.get(String(b.user_id))) ||
            (b.client_email && userMap.get(b.client_email.toLowerCase().trim()));
          const isGoogle =
            user?.auth_provider === "google" ||
            b.auth_provider === "google" ||
            b.client_email?.toLowerCase().endsWith("@gmail.com");

          const emailLower = (b.client_email || "").toLowerCase().trim();
          let resolvedAvatar = b.avatar_url || user?.avatar_url || null;
          if (!resolvedAvatar && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com" || emailLower === "martquirante@gmail.com" || emailLower === "dbprojectmartquirante@gmail.com")) {
            resolvedAvatar = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
          }

          const isOnline = (b.meeting_mode || "").toLowerCase().includes("online");
          const resolvedRoomCode = b.meeting_room_code || extractRoomCode(b);
          const resolvedMeetingLink = isOnline && resolvedRoomCode
            ? buildMeetingUrl(resolvedRoomCode)
            : (b.meeting_link || (resolvedRoomCode ? buildMeetingUrl(resolvedRoomCode) : ""));

          // Auto-persist deterministic meeting_room_code if not yet stored in database
          if (!b.meeting_room_code && resolvedRoomCode) {
            db.query("UPDATE client_briefs SET meeting_room_code = $1 WHERE brief_id = $2", [resolvedRoomCode, b.brief_id]).catch(() => {});
          }

          return {
            ...b,
            avatar_url: resolvedAvatar,
            avatarUrl: resolvedAvatar,
            auth_provider: b.auth_provider || user?.auth_provider || (isGoogle ? "google" : "local"),
            authProvider: b.auth_provider || user?.auth_provider || (isGoogle ? "google" : "local"),
            email_verified: user?.email_verified ?? b.email_verified ?? isGoogle,
            meeting_room_code: resolvedRoomCode,
            meetingRoomCode: resolvedRoomCode,
            meeting_link: resolvedMeetingLink,
            meetingLink: resolvedMeetingLink,
          };
        });
      } catch (userJoinErr) {
        console.warn("[BriefsController.getAll] User join notice:", userJoinErr.message);
        briefs = briefs.map((b) => {
          const emailLower = (b.client_email || "").toLowerCase().trim();
          let resolvedAvatar = b.avatar_url || null;
          if (!resolvedAvatar && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com" || emailLower === "martquirante@gmail.com")) {
            resolvedAvatar = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
          }
          const isOnline = (b.meeting_mode || "").toLowerCase().includes("online");
          const resolvedRoomCode = b.meeting_room_code || extractRoomCode(b);
          const resolvedMeetingLink = isOnline && resolvedRoomCode
            ? buildMeetingUrl(resolvedRoomCode)
            : (b.meeting_link || (resolvedRoomCode ? buildMeetingUrl(resolvedRoomCode) : ""));

          if (!b.meeting_room_code && resolvedRoomCode) {
            db.query("UPDATE client_briefs SET meeting_room_code = $1 WHERE brief_id = $2", [resolvedRoomCode, b.brief_id]).catch(() => {});
          }

          return {
            ...b,
            avatar_url: resolvedAvatar,
            avatarUrl: resolvedAvatar,
            auth_provider: b.auth_provider || (emailLower.endsWith("@gmail.com") ? "google" : "local"),
            authProvider: b.auth_provider || (emailLower.endsWith("@gmail.com") ? "google" : "local"),
            meeting_room_code: resolvedRoomCode,
            meetingRoomCode: resolvedRoomCode,
            meeting_link: resolvedMeetingLink,
            meetingLink: resolvedMeetingLink,
          };
        });
      }

      return res.json({ success: true, briefs });
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
        userId,
        wantsMeeting,
        venueType,
        venueDetails,
        storeys,
        siteAddressDetails,
        spatialWishlist,
        message,
      } = req.body;

      if (!clientName || !clientEmail) {
        return res.status(400).json({ message: "Client name and email are required." });
      }

      const id =
        submissionId ||
        req.body.id ||
        `MCPA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const normalizedEmail = clientEmail.trim().toLowerCase();
      const parsedUserId = userId ? parseInt(userId, 10) : (req.user?.user_id || req.user?.userId || null);

      // 1. Single Active Inquiry Policy: Max 1 active inquiry per client account ID unless is_multi_project_approved
      const userRes = await db.query(
        "SELECT user_id, is_multi_project_approved FROM users WHERE (user_id = $1 AND $1 > 0) OR LOWER(email) = LOWER($2) LIMIT 1",
        [parsedUserId || 0, normalizedEmail]
      );
      const isMultiApproved = Boolean(userRes.rows?.[0]?.is_multi_project_approved);
      const matchedUserId = userRes.rows?.[0]?.user_id || parsedUserId || 0;

      if (!isMultiApproved) {
        // Check active brief by user_id OR client_email (excluding completed/handed over projects or briefs already converted to projects)
        const activeCheck = await db.query(
          `SELECT cb.brief_id, cb.submission_id, cb.project_type, cb.status, cb.location, cb.created_at 
           FROM client_briefs cb
           LEFT JOIN client_projects cp ON cp.brief_id = cb.brief_id
           LEFT JOIN site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
           WHERE ((cb.user_id = $1 AND $1 > 0) OR LOWER(cb.client_email) = LOWER($2)) 
             AND (cb.status NOT ILIKE '%reject%' AND cb.status NOT ILIKE '%decline%' AND cb.status NOT ILIKE '%discontinue%' AND cb.status NOT ILIKE '%withdrawn%' AND cb.status NOT ILIKE '%complet%')
             AND NOT (
               (cp.stage_id = 'COMPLETED' OR cp.is_archived = TRUE)
               OR (sp.status ILIKE '%complete%' OR sp.status ILIKE '%handover%' OR COALESCE(sp.progress_pct, 0) >= 100)
             )
             AND cp.client_project_id IS NULL
           ORDER BY cb.brief_id DESC 
           LIMIT 1`,
          [matchedUserId, normalizedEmail]
        );
        if (activeCheck.rows && activeCheck.rows.length > 0) {
          const existing = activeCheck.rows[0];
          return res.status(409).json({
            success: false,
            error: "ACTIVE_INQUIRY_EXISTS",
            hasActiveInquiry: true,
            activeInquiry: {
              briefId: existing.brief_id,
              submissionId: existing.submission_id,
              projectType: existing.project_type,
              status: existing.status,
              location: existing.location,
              createdAt: existing.created_at,
              isProject: false,
            },
            message: "You currently have an active architectural inquiry on record. MCPA maintains a strict 1-project policy per client to ensure dedicated engineering oversight.",
          });
        }

        // Check active project by user_id OR brief_id (completed or 100% finished builds do not block re-booking)
        const projectCheck = await db.query(
          `SELECT cp.client_project_id, cp.project_code, cp.project_title, cp.project_type, cp.target_location, cp.stage_id, cp.created_at 
           FROM client_projects cp
           LEFT JOIN site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
           WHERE ((cp.user_id = $1 AND $1 > 0) OR cp.brief_id IN (SELECT brief_id FROM client_briefs WHERE LOWER(client_email) = LOWER($2)))
             AND cp.is_archived = FALSE 
             AND cp.stage_id != 'COMPLETED'
             AND (sp.progress_pct IS NULL OR sp.progress_pct < 100)
             AND (sp.status IS NULL OR (sp.status NOT ILIKE '%complete%' AND sp.status NOT ILIKE '%handover%'))
           ORDER BY cp.client_project_id DESC LIMIT 1`,
          [matchedUserId, normalizedEmail]
        );
        if (projectCheck.rows && projectCheck.rows.length > 0) {
          const existingProj = projectCheck.rows[0];
          return res.status(409).json({
            success: false,
            error: "ACTIVE_PROJECT_EXISTS",
            hasActiveInquiry: true,
            activeInquiry: {
              submissionId: existingProj.project_code,
              projectType: existingProj.project_title || existingProj.project_type,
              status: `Stage: ${existingProj.stage_id}`,
              location: existingProj.target_location,
              createdAt: existingProj.created_at,
              isProject: true,
            },
            message: "You have an ongoing construction project in progress. Multi-booking requires senior administrative clearance.",
          });
        }
      }

      // 2. Cooldown check: 5 minutes between submissions for same email
      const cooldownCheck = await db.query(
        "SELECT created_at FROM client_briefs WHERE LOWER(client_email) = LOWER($1) ORDER BY brief_id DESC LIMIT 1",
        [normalizedEmail]
      );
      if (cooldownCheck.rows && cooldownCheck.rows.length > 0) {
        const lastCreated = new Date(cooldownCheck.rows[0].created_at);
        const diffMinutes = (Date.now() - lastCreated.getTime()) / (1000 * 60);
        if (diffMinutes < 5) {
          const waitMins = Math.ceil(5 - diffMinutes);
          return res.status(429).json({
            message: `Submission cooldown active. Please wait ${waitMins} minute(s) before submitting another inquiry.`,
          });
        }
      }

      const effectiveMeetingMode = meetingMode || (venueType ? `In-Person (${venueType})` : "Online Meeting");
      const isOnline = effectiveMeetingMode.toLowerCase().includes("online");
      const assignedRoomCode = formatRoomCode(req.body.meetingRoomCode || id);
      const assignedMeetingLink = isOnline
        ? (req.body.meetingLink || buildMeetingUrl(assignedRoomCode))
        : (venueDetails || buildMeetingUrl(assignedRoomCode));

      let result;
      try {
        result = await db.query(
          `INSERT INTO client_briefs (
            submission_id, client_name, client_email, client_phone,
            project_type, preferred_style, budget_range, lot_status,
            lot_area, target_date, location, financing_option,
            uploaded_files, status, location_type, meeting_mode,
            meeting_date, meeting_time, map_coordinates,
            user_id, wants_meeting, venue_type, venue_details, availability_status,
            storeys, site_address_details, spatial_wishlist, message,
            meeting_link, meeting_room_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18, $19, $20, $21, $22, 'Pending Availability Confirmation', $23, $24, $25, $26, $27, $28)
          RETURNING *`,
          [
            id,
            clientName.trim(),
            normalizedEmail,
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
            effectiveMeetingMode,
            meetingDate || "",
            meetingTime || "",
            mapCoordinates || "",
            userId ? parseInt(userId, 10) : null,
            Boolean(wantsMeeting),
            venueType || null,
            venueDetails || null,
            storeys || null,
            siteAddressDetails ? JSON.stringify(siteAddressDetails) : null,
            spatialWishlist ? JSON.stringify(spatialWishlist) : null,
            message || null,
            assignedMeetingLink,
            assignedRoomCode,
          ]
        );
      } catch (insertErr) {
        // Fallback for instances where extended columns are not yet active
        result = await db.query(
          `INSERT INTO client_briefs (
            submission_id, client_name, client_email, client_phone,
            project_type, preferred_style, budget_range, lot_status,
            lot_area, target_date, location, financing_option,
            uploaded_files, status, location_type, meeting_mode,
            meeting_date, meeting_time, map_coordinates,
            user_id, wants_meeting, venue_type, venue_details, availability_status,
            meeting_link, meeting_room_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18, $19, $20, $21, $22, 'Pending Availability Confirmation', $23, $24)
          RETURNING *`,
          [
            id,
            clientName.trim(),
            normalizedEmail,
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
            effectiveMeetingMode,
            meetingDate || "",
            meetingTime || "",
            mapCoordinates || "",
            userId ? parseInt(userId, 10) : null,
            Boolean(wantsMeeting),
            venueType || null,
            venueDetails || null,
            assignedMeetingLink,
            assignedRoomCode,
          ]
        );
      }

      const savedBrief = result.rows[0];
      if (storeys && !savedBrief.storeys) savedBrief.storeys = storeys;
      if (spatialWishlist && !savedBrief.spatial_wishlist) savedBrief.spatial_wishlist = spatialWishlist;
      if (siteAddressDetails && !savedBrief.site_address_details) savedBrief.site_address_details = siteAddressDetails;
      if (message && !savedBrief.message) savedBrief.message = message;

      // Dual email notification (awaited for Vercel Serverless lifecycle stability)
      try {
        await Promise.allSettled([
          emailService.sendInquiryClientReceipt(normalizedEmail, savedBrief),
          emailService.sendInquiryAdminAlert(savedBrief),
        ]);
      } catch (err) {
        console.warn("[BriefsController] Error dispatching inquiry emails:", err.message);
      }

      // Broadcast in real-time to Admin dashboard
      try {
        const realtimeService = require("../services/realtimeService");
        realtimeService.broadcastBriefSubmitted(savedBrief);
      } catch (rtErr) {
        console.warn("[BriefsController] Realtime broadcast warning:", rtErr.message);
      }

      // Auto-bridge to client_projects table at 'PRE_INQUIRY' stage (Stage 1B pending Admin review) if user account exists
      try {
        let targetUserId = userId ? parseInt(userId, 10) : null;
        if (!targetUserId) {
          const userLookup = await db.query(
            "SELECT user_id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
            [normalizedEmail]
          );
          if (userLookup.rows && userLookup.rows.length > 0) {
            targetUserId = userLookup.rows[0].user_id;
          }
        }

        if (targetUserId) {
          const stageEngineService = require("../services/stageEngineService");
          const existingProj = await db.query(
            "SELECT client_project_id FROM public.client_projects WHERE brief_id = $1 LIMIT 1;",
            [savedBrief.brief_id]
          );
          if (!existingProj.rows || existingProj.rows.length === 0) {
            const projectTitle = `${projectType || "Residential"} Project (${clientName.trim()})`;
            await stageEngineService.createInquiryProject({
              userId: targetUserId,
              projectTitle,
              projectType: projectType || "Residential Design & Build",
              targetLocation: location || null,
              briefId: savedBrief.brief_id,
              initialStage: "PRE_INQUIRY",
            });
          }
        }
      } catch (bridgeErr) {
        console.warn("[BriefsController.submit] client_projects bridge notice:", bridgeErr.message);
      }

      return res.status(201).json({
        success: true,
        brief: savedBrief,
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
        meetingMode,
        venueType,
        venueDetails,
        quotationAmount,
        quotationNotes,
        clientPortalCode,
      } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      const isRejectAction = Boolean(req.body.isRejected) || status.toLowerCase().includes("reject");
      const isRescheduleAction = Boolean(req.body.isRescheduled) || Boolean(req.body.rescheduleReason) || status.toLowerCase().includes("reschedule");
      const isApproveAction = Boolean(req.body.isApproved) || status === "Approved / Accepted" || status === "Meeting Scheduled";
      const isUnderReviewAction = status === "Under Review";

      const calculatedAvailability = req.body.availabilityStatus || req.body.availability_status || (
        isApproveAction ? "Confirmed" :
        isRescheduleAction ? "Rescheduled" :
        isRejectAction ? "Declined" : null
      );

      const incomingMode = meetingMode || "";
      const isOnline = incomingMode.toLowerCase().includes("online");
      const incomingRoomCode = req.body.meetingRoomCode || req.body.meeting_room_code || (meetingLink && !isPhysicalAddress(meetingLink) ? extractRoomCode(meetingLink) : null);
      const assignedRoomCode = formatRoomCode(incomingRoomCode || cleanId);
      const assignedMeetingLink = isOnline
        ? (meetingLink && !isPhysicalAddress(meetingLink) ? meetingLink : buildMeetingUrl(assignedRoomCode))
        : (venueDetails || meetingLink || null);

      const result = await db.query(
        `UPDATE client_briefs SET 
          status = $1,
          meeting_date = COALESCE($2, meeting_date),
          meeting_time = COALESCE($3, meeting_time),
          meeting_link = COALESCE($4, meeting_link),
          meeting_notes = COALESCE($5, meeting_notes),
          meeting_mode = COALESCE($6, meeting_mode),
          venue_type = COALESCE($7, venue_type),
          venue_details = COALESCE($8, venue_details),
          quotation_amount = COALESCE($9, quotation_amount),
          quotation_notes = COALESCE($10, quotation_notes),
          client_portal_code = COALESCE($11, client_portal_code),
          availability_status = COALESCE($12, availability_status),
          meeting_room_code = COALESCE($15, meeting_room_code)
        WHERE (brief_id = $13 OR submission_id = $14) RETURNING *`,
        [
          status,
          meetingDate || null,
          meetingTime || null,
          assignedMeetingLink,
          meetingNotes || null,
          meetingMode || null,
          venueType || null,
          venueDetails || null,
          quotationAmount || null,
          quotationNotes || null,
          clientPortalCode || null,
          calculatedAvailability,
          numericId,
          cleanId,
          assignedRoomCode,
        ]
      );

      const updatedBrief = result.rows[0];
      if (!updatedBrief) {
        return res.status(404).json({ success: false, message: "Consultation brief not found." });
      }

      if (updatedBrief) {
        updatedBrief.meeting_room_code = updatedBrief.meeting_room_code || assignedRoomCode;
        updatedBrief.meetingRoomCode = updatedBrief.meeting_room_code;
        updatedBrief.meeting_link = updatedBrief.meeting_link || assignedMeetingLink;
        updatedBrief.meetingLink = updatedBrief.meeting_link;
      }

      // Dispatch appropriate email notification based on inquiry lifecycle event
      if (updatedBrief?.client_email) {
        try {
          const clientEmail = updatedBrief.client_email;

          if (Boolean(req.body.updatedByClient)) {
            // Notify Admin team of client schedule adjustment safely via emailService (guarantees isolation from official company email)
            await emailService.sendInquiryClientScheduleAdjustmentAlert(updatedBrief, req.body);
          } else if (isRejectAction) {
            await emailService.sendInquiryRejected(clientEmail, updatedBrief, {
              rejectionReason: req.body.rejectionReason,
              rejectionNotes: req.body.rejectionNotes,
            });
          } else if (isRescheduleAction) {
            await emailService.sendInquiryRescheduled(clientEmail, updatedBrief, {
              meetingDate: req.body.meetingDate || updatedBrief.meeting_date,
              meetingTime: req.body.meetingTime || updatedBrief.meeting_time,
              meetingMode: req.body.meetingMode || updatedBrief.meeting_mode,
              meetingLink: req.body.meetingLink || updatedBrief.meeting_link,
              previousMeetingDate: req.body.previousMeetingDate,
              previousMeetingTime: req.body.previousMeetingTime,
              rescheduleReason: req.body.rescheduleReason,
              rescheduleNotes: req.body.rescheduleNotes,
            });
          } else if (isApproveAction) {
            await emailService.sendInquiryMeetingConfirmation(clientEmail, updatedBrief);
          } else if (isUnderReviewAction) {
            await emailService.sendInquiryClientReceipt(clientEmail, updatedBrief);
          } else {
            await emailService.sendInquiryStatusUpdate(clientEmail, updatedBrief, {
              status,
              notes: req.body.meetingNotes,
            });
          }
        } catch (emailErr) {
          console.warn("[BriefsController] Lifecycle email notification warning:", emailErr.message);
        }
      }

      // If brief is being declined or rejected, revert client_projects to PRE_INQUIRY (Phase 1)
      if (isRejectAction && updatedBrief) {
        try {
          const clientEmail = (updatedBrief.client_email || "").trim().toLowerCase();
          const adminUserId = req.user?.userId || req.user?.user_id || 1;

          await db.query(
            `UPDATE public.client_projects 
             SET stage_id = 'PRE_INQUIRY', 
                 is_archived = TRUE, 
                 updated_at = NOW() 
             WHERE brief_id = $1 
                OR (user_id = $2 AND $2 > 0)
                OR ($3 != '' AND user_id IN (SELECT user_id FROM public.users WHERE LOWER(email) = $3));`,
            [updatedBrief.brief_id, updatedBrief.user_id || -1, clientEmail]
          );

          await db.query(
            `UPDATE public.site_projects 
             SET is_active_build = FALSE, status = 'DISCONTINUED' 
             WHERE ($1 != '' AND client_email ILIKE $1) 
                OR project_code IN (
                  SELECT project_code FROM public.client_projects 
                  WHERE brief_id = $2 OR (user_id = $3 AND $3 > 0)
                );`,
            [clientEmail, updatedBrief.brief_id, updatedBrief.user_id || -1]
          ).catch(() => {});
        } catch (revertErr) {
          console.warn("[updateStatus] Revert client_projects notice:", revertErr.message);
        }
      }

      // Auto-advance project from Stage 1 (PRE_INQUIRY) to Stage 2 (CONSULTATION) when approved by Admin
      if (isApproveAction && !Boolean(req.body.updatedByClient) && updatedBrief) {
        try {
          const stageEngineService = require("../services/stageEngineService");
          const projCheck = await db.query(
            "SELECT client_project_id, stage_id FROM public.client_projects WHERE brief_id = $1 LIMIT 1;",
            [updatedBrief.brief_id]
          );
          const currentStage = projCheck.rows?.[0]?.stage_id;
          if (!currentStage || currentStage === "PRE_INQUIRY") {
            const advancedProj = await stageEngineService.advanceProjectStage({
              briefId: updatedBrief.brief_id,
              targetStage: "CONSULTATION",
              adminUserId: req.user?.userId || req.user?.user_id || null,
              reason: `Inquiry approved (${status}) — elevated to Stage 2 Consultation & Planning`,
            });
            if (advancedProj) {
              updatedBrief.current_project_stage = "CONSULTATION";
              updatedBrief.current_stage_status = "CONSULTATION";
              updatedBrief.client_project_id = advancedProj.client_project_id;
            }
          }
        } catch (stageErr) {
          console.warn("[BriefsController.updateStatus] Stage 2 auto-advance notice:", stageErr.message);
        }
      }

      // Broadcast update in real-time
      try {
        const realtimeService = require("../services/realtimeService");
        if (realtimeService?.broadcastBriefUpdated) {
          realtimeService.broadcastBriefUpdated(updatedBrief);
        }
        if (isRejectAction && realtimeService?.broadcastStageChange) {
          realtimeService.broadcastStageChange({
            briefId: updatedBrief.brief_id,
            clientEmail: updatedBrief.client_email,
            targetStage: "PRE_INQUIRY",
            stage_id: "PRE_INQUIRY",
          });
        } else if (isApproveAction && !Boolean(req.body.updatedByClient) && realtimeService?.broadcastStageChange) {
          realtimeService.broadcastStageChange({
            briefId: updatedBrief.brief_id,
            clientEmail: updatedBrief.client_email,
            targetStage: "CONSULTATION",
            stage_id: "CONSULTATION",
          });
        }
      } catch (rtErr) {}

      return res.json({
        success: true,
        brief: updatedBrief,
        message: `Brief updated to '${status}'.`,
      });
    } catch (err) {
      console.error("[BriefsController.updateStatus] Error:", err);
      return res.status(500).json({ message: "Failed to update brief status: " + err.message });
    }
  }

  async reject(req, res) {
    try {
      req.body.status = "Rejected / Declined";
      req.body.isRejected = true;
      return await this.updateStatus(req, res);
    } catch (err) {
      console.error("[BriefsController.reject] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to reject brief: " + err.message });
    }
  }

  async archive(req, res) {
    try {
      req.body.status = "Archived";
      req.body.isArchived = true;
      return await this.updateStatus(req, res);
    } catch (err) {
      console.error("[BriefsController.archive] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to archive brief: " + err.message });
    }
  }

  async provisionAccess(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      const briefRes = await db.query(
        "SELECT * FROM client_briefs WHERE brief_id = $1 OR submission_id = $2",
        [numericId, cleanId]
      );
      if (!briefRes.rows || briefRes.rows.length === 0) {
        return res.status(404).json({ message: "Brief not found." });
      }
      const brief = briefRes.rows[0];
      const portalCode = `MCPA-${brief.client_name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Update brief with code
      await db.query("UPDATE client_briefs SET client_portal_code = $1, status = 'Approved / Accepted' WHERE brief_id = $2", [portalCode, brief.brief_id]);

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
      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      // 1. Fetch brief attachments to clean up from Azure mcpa-briefs container
      const existing = await db.query(
        "SELECT brief_id, uploaded_files FROM client_briefs WHERE brief_id = $1 OR submission_id = $2",
        [numericId, cleanId]
      );
      if (!existing.rows || existing.rows.length === 0) {
        return res.status(404).json({ message: "Brief not found." });
      }
      const targetBriefId = existing.rows[0].brief_id;
      let attachedFiles = [];
      if (existing.rows[0].uploaded_files) {
        let files = existing.rows[0].uploaded_files;
        if (typeof files === "string") {
          try { files = JSON.parse(files); } catch (e) { files = [files]; }
        }
        if (Array.isArray(files)) {
          attachedFiles = files.filter(f => typeof f === "string" && f.trim().length > 0);
        }
      }

      // 2. Delete brief from database
      await db.query("DELETE FROM client_briefs WHERE brief_id = $1", [targetBriefId]);

      // 3. Purge files from cloud storage (briefs category)
      if (attachedFiles.length > 0) {
        (async () => {
          for (const fileUrl of attachedFiles) {
            try {
              await storage.deleteFile(fileUrl, "briefs");
            } catch (err) {
              console.warn(`[BriefsController.delete] Storage cleanup error for ${fileUrl}:`, err.message);
            }
          }
        })().catch(e => console.warn("[BriefsController.delete] Async cleanup error:", e.message));
      }

      return res.json({ success: true, message: "Client brief and associated cloud files removed." });
    } catch (err) {
      console.error("[BriefsController.delete] Error:", err);
      return res.status(500).json({ message: "Failed to delete brief: " + err.message });
    }
  }

  async downloadPdf(req, res) {
    try {
      let brief = null;

      // 1. If payload passed in body (e.g. POST /api/briefs/pdf)
      if (req.body && (req.body.submissionId || req.body.submission_id || req.body.clientName)) {
        brief = req.body;
      }

      // 2. Otherwise query database by ID or submission_id
      if (!brief && req.params && req.params.id) {
        const id = req.params.id;
        const numId = isNaN(parseInt(id, 10)) ? -1 : parseInt(id, 10);
        const result = await db.query(
          "SELECT * FROM client_briefs WHERE brief_id = $1 OR submission_id = $2 LIMIT 1",
          [numId, id]
        );
        if (result.rows && result.rows.length > 0) {
          brief = result.rows[0];
        }
      }

      if (!brief) {
        return res.status(404).json({ message: "Inquiry brief not found." });
      }

      // Join user avatar & auth provider if client is registered
      try {
        const email = brief.client_email || brief.clientEmail;
        if (email) {
          const uRes = await db.query(
            "SELECT avatar_url, auth_provider FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
            [email.trim()]
          );
          if (uRes.rows && uRes.rows[0]) {
            brief.avatar_url = brief.avatar_url || uRes.rows[0].avatar_url;
            brief.auth_provider = brief.auth_provider || uRes.rows[0].auth_provider;
          }
        }
      } catch (_) {}

      const { generateInquiryPdf } = require("../services/inquiryPdfService");
      const { buffer, filename } = await generateInquiryPdf(brief);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      return res.send(buffer);
    } catch (err) {
      console.error("[BriefsController.downloadPdf] Error:", err);
    }
  }

  async confirmAttendance(req, res) {
    try {
      const { id } = req.params;
      const { confirmedBy = "client" } = req.body || {};
      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      const result = await db.query(
        `UPDATE client_briefs 
         SET availability_status = 'Attendance Confirmed'
         WHERE (brief_id = $1 OR submission_id = $2)
         RETURNING *;`,
        [numericId, cleanId]
      );

      const updated = result.rows && result.rows[0];
      if (!updated) {
        return res.status(404).json({ success: false, message: "Brief not found." });
      }

      // Broadcast update
      try {
        const realtimeService = require("../services/realtimeService");
        if (realtimeService?.broadcastBriefUpdated) {
          realtimeService.broadcastBriefUpdated({
            ...updated,
            attendanceConfirmed: true,
            confirmedBy,
          });
        }
      } catch (e) {}

      return res.json({
        success: true,
        brief: updated,
        message: "Attendance successfully confirmed.",
      });
    } catch (err) {
      console.error("[BriefsController.confirmAttendance] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendMeetingReminder(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      const result = await db.query(
        "SELECT * FROM client_briefs WHERE brief_id = $1 OR submission_id = $2",
        [numericId, cleanId]
      );

      const brief = result.rows && result.rows[0];
      if (!brief || !brief.client_email) {
        return res.status(404).json({ success: false, message: "Client email not found for this brief." });
      }

      const isF2F = !String(brief.meeting_mode || "").toLowerCase().includes("online");
      const meetingData = {
        clientName: brief.client_name,
        clientEmail: brief.client_email,
        projectCode: brief.submission_id || "MCPA-CPB",
        date: brief.meeting_date || "Scheduled Date",
        time: brief.meeting_time || "10:00 AM - 11:30 AM PHT",
        mode: brief.meeting_mode || (isF2F ? "Face-to-Face Office Visit" : "Online Video Call"),
        agenda: brief.meeting_notes || "1st Technical & Architectural Alignment",
        venue: brief.venue_details || "MCPA Tabang Central Office, MacArthur Highway, Plaridel, Bulacan",
        roundTitle: req.body?.roundTitle || "1st Technical & Architectural Alignment",
      };

      await emailService.sendMeetingAttendanceReminder(brief.client_email, meetingData);

      return res.json({
        success: true,
        message: `Attendance reminder email dispatched to ${brief.client_email}`,
      });
    } catch (err) {
      console.error("[BriefsController.sendMeetingReminder] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async recordMeetingOutcome(req, res) {
    try {
      const { id } = req.params;
      const {
        outcome, // "NEXT_MEETING" | "AGREED_ADVANCE" | "REVISION_DELIBERATION" | "DISCONTINUED_REJECTED"
        nextMeetingDate,
        nextMeetingTime,
        nextMeetingMode,
        nextMeetingAgenda,
        meetingMinutes,
        quotationAmount,
        clientEmail: payloadClientEmail,
        rejectionReason,
        rejectionNotes,
      } = req.body || {};

      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;
      const lookupEmail = (payloadClientEmail || cleanId || "").trim().toLowerCase();

      // Find brief flexibly across numeric ID, submission code, or email
      const briefRes = await db.query(
        `SELECT * FROM client_briefs 
         WHERE brief_id = $1 
            OR submission_id = $2 
            OR ($3 != '' AND LOWER(client_email) = $3)
         ORDER BY brief_id DESC LIMIT 1`,
        [numericId, cleanId, lookupEmail]
      );
      const brief = briefRes.rows && briefRes.rows[0];
      if (!brief) {
        return res.status(404).json({ success: false, message: "Brief not found." });
      }

      let newStatus = brief.status;
      let updatedBrief = brief;
      const effectiveEmail = (brief.client_email || lookupEmail || "").trim().toLowerCase();
      const adminUserId = req.user?.userId || req.user?.user_id || 1;

      if (outcome === "DISCONTINUED_REJECTED") {
        newStatus = "Rejected / Declined";
        const reason = rejectionReason || req.body.reason || "Client and MCPA did not reach an agreement";
        const notes = meetingMinutes || rejectionNotes || "Consultation concluded without proceeding.";
        const updateRes = await db.query(
          `UPDATE client_briefs 
           SET status = $1,
               is_rejected = TRUE,
               rejection_reason = $2,
               rejection_notes = $3,
               availability_status = 'Discontinued / Closed'
           WHERE brief_id = $4 RETURNING *;`,
          [newStatus, reason, notes, brief.brief_id]
        );
        updatedBrief = updateRes.rows[0];

        // 1. Reset client_projects to PRE_INQUIRY (Phase 1)
        try {
          const projUpdateRes = await db.query(
            `UPDATE public.client_projects 
             SET stage_id = 'PRE_INQUIRY', 
                 is_archived = TRUE, 
                 updated_at = NOW() 
             WHERE brief_id = $1 
                OR (user_id = $2 AND $2 > 0)
                OR ($3 != '' AND user_id IN (SELECT user_id FROM public.users WHERE LOWER(email) = $3))
             RETURNING client_project_id, project_code, stage_id;`,
            [brief.brief_id, brief.user_id || -1, effectiveEmail]
          );

          // 2. Audit transition to PRE_INQUIRY
          if (projUpdateRes.rows && projUpdateRes.rows.length > 0) {
            for (const p of projUpdateRes.rows) {
              await db.query(
                `INSERT INTO public.stage_transitions (
                  client_project_id, from_stage, to_stage, transitioned_by, reason, metadata, created_at
                ) VALUES ($1, 'CONSULTATION', 'PRE_INQUIRY', $2, $3, $4, NOW());`,
                [
                  p.client_project_id,
                  adminUserId,
                  `Consultation concluded with no agreement: ${reason}`,
                  JSON.stringify({ notes, outcome }),
                ]
              ).catch(() => {});
            }
          }

          // 3. Deactivate any site_projects entry so Stage 3 does not show it
          await db.query(
            `UPDATE public.site_projects 
             SET is_active_build = FALSE, status = 'DISCONTINUED' 
             WHERE ($1 != '' AND client_email ILIKE $1) 
                OR project_code IN (
                  SELECT project_code FROM public.client_projects 
                  WHERE brief_id = $2 OR (user_id = $3 AND $3 > 0)
                );`,
            [effectiveEmail, brief.brief_id, brief.user_id || -1]
          ).catch(() => {});
        } catch (projErr) {
          console.warn("[recordMeetingOutcome] client_projects revert notice:", projErr.message);
        }

        // 4. Log to meeting_history_logs for Concluded Consultations tab
        try {
          const sessionId = `sess-${Date.now()}`;
          const displayDate = brief.meeting_date || new Date().toISOString().split("T")[0];
          await db.query(
            `INSERT INTO meeting_history_logs (
              session_id, room_code, round_title, meeting_date, display_date, meeting_time,
              duration, duration_seconds, mode, venue, lead_consultant, lead_role,
              client_name, client_email, project_code, project_title, status, minutes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
            ON CONFLICT (session_id) DO NOTHING;`,
            [
              sessionId,
              brief.meeting_room_code || "mcpa-meet-concluded",
              "Consultation Review · Discontinued",
              brief.meeting_date || displayDate,
              displayDate,
              brief.meeting_time || "10:00 AM - 11:30 AM PHT",
              "Concluded",
              0,
              brief.meeting_mode || "Online Video Call",
              brief.venue_details || "MCPA Secure Video Room",
              "Engr. Raymart Quirante",
              "Lead Architectural Engineer",
              brief.client_name || "Client",
              effectiveEmail,
              brief.submission_id || "MCPA-CPB",
              brief.project_type || "Architectural Project",
              "Discontinued / Closed",
              `[Discontinued Reason]: ${reason} — ${notes}`,
            ]
          ).catch((e) => console.warn("[recordMeetingOutcome] history log notice:", e.message));
        } catch (histErr) {}

      } else if (outcome === "AGREED_ADVANCE") {
        newStatus = "Aligned — Advance to Pre-Construction";
        const updateRes = await db.query(
          `UPDATE client_briefs 
           SET status = $1,
               meeting_notes = COALESCE($2, meeting_notes),
               quotation_amount = COALESCE($3, quotation_amount),
               availability_status = 'Session Completed'
           WHERE brief_id = $4 RETURNING *;`,
          [newStatus, meetingMinutes || "Agreed on project scope and preliminary design.", quotationAmount || null, brief.brief_id]
        );
        updatedBrief = updateRes.rows[0];

        // Advance project to Pre-Construction Planning (Stage 3)
        try {
          const stageEngineService = require("../services/stageEngineService");
          await stageEngineService.advanceProjectStage({
            briefId: brief.brief_id,
            targetStage: req.body?.targetStage || "PRE_CONSTRUCTION",
            adminUserId,
            reason: "Consultation alignment achieved. Both parties agreed on scope and preliminary budget.",
            metadata: { meetingMinutes, quotationAmount },
          });
        } catch (stageErr) {
          console.warn("[recordMeetingOutcome] advanceProjectStage warning:", stageErr.message);
        }

        // Log to meeting_history_logs for Concluded Consultations tab
        try {
          const sessionId = `sess-${Date.now()}`;
          const displayDate = brief.meeting_date || new Date().toISOString().split("T")[0];
          await db.query(
            `INSERT INTO meeting_history_logs (
              session_id, room_code, round_title, meeting_date, display_date, meeting_time,
              duration, duration_seconds, mode, venue, lead_consultant, lead_role,
              client_name, client_email, project_code, project_title, status, minutes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
            ON CONFLICT (session_id) DO NOTHING;`,
            [
              sessionId,
              brief.meeting_room_code || "mcpa-meet-concluded",
              "Consultation Review · Agreement Reached",
              brief.meeting_date || displayDate,
              displayDate,
              brief.meeting_time || "10:00 AM - 11:30 AM PHT",
              "Concluded",
              0,
              brief.meeting_mode || "Online Video Call",
              brief.venue_details || "MCPA Secure Video Room",
              "Engr. Raymart Quirante",
              "Lead Architectural Engineer",
              brief.client_name || "Client",
              effectiveEmail,
              brief.submission_id || "MCPA-CPB",
              brief.project_type || "Architectural Project",
              "Completed / Aligned",
              meetingMinutes || "Agreed on scope and preliminary budget.",
            ]
          ).catch((e) => console.warn("[recordMeetingOutcome] history log notice:", e.message));
        } catch (histErr) {}

      } else if (outcome === "NEXT_MEETING") {
        newStatus = "Meeting Scheduled (Follow-Up Round)";
        const updateRes = await db.query(
          `UPDATE client_briefs 
           SET status = $1,
               meeting_date = COALESCE($2, meeting_date),
               meeting_time = COALESCE($3, meeting_time),
               meeting_mode = COALESCE($4, meeting_mode),
               meeting_notes = COALESCE($5, meeting_notes),
               availability_status = 'Pending Confirmation'
           WHERE brief_id = $6 RETURNING *;`,
          [
            newStatus,
            nextMeetingDate || brief.meeting_date,
            nextMeetingTime || brief.meeting_time,
            nextMeetingMode || brief.meeting_mode,
            nextMeetingAgenda || meetingMinutes || "Follow-up Technical Consultation",
            brief.brief_id,
          ]
        );
        updatedBrief = updateRes.rows[0];
      } else {
        newStatus = "Under Deliberation / Revisions";
        const updateRes = await db.query(
          `UPDATE client_briefs 
           SET status = $1,
               meeting_notes = COALESCE($2, meeting_notes)
           WHERE brief_id = $3 RETURNING *;`,
          [newStatus, meetingMinutes || "Revisions requested by client.", brief.brief_id]
        );
        updatedBrief = updateRes.rows[0];
      }

      // Broadcast update
      try {
        const realtimeService = require("../services/realtimeService");
        if (realtimeService?.broadcastBriefUpdated) {
          realtimeService.broadcastBriefUpdated(updatedBrief);
        }
        if (realtimeService?.broadcastStageChange) {
          realtimeService.broadcastStageChange({
            briefId: brief.brief_id,
            clientEmail: effectiveEmail,
            targetStage: outcome === "DISCONTINUED_REJECTED" ? "PRE_INQUIRY" : (outcome === "AGREED_ADVANCE" ? "PRE_CONSTRUCTION" : "CONSULTATION"),
            stage_id: outcome === "DISCONTINUED_REJECTED" ? "PRE_INQUIRY" : (outcome === "AGREED_ADVANCE" ? "PRE_CONSTRUCTION" : "CONSULTATION"),
          });
        }
      } catch (e) {}

      return res.json({
        success: true,
        brief: updatedBrief,
        outcome,
        message: `Meeting outcome recorded: ${outcome}`,
      });
    } catch (err) {
      console.error("[BriefsController.recordMeetingOutcome] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async withdrawConsultation(req, res) {
    try {
      const { id } = req.params;
      const { reason = "Client withdrew from consultation", notes = "" } = req.body || {};
      const userEmail = req.user?.email;
      const userId = req.user?.userId || req.user?.user_id;

      const cleanId = String(id || "").trim();
      const isNumeric = /^\d+$/.test(cleanId);
      const numericId = isNumeric ? parseInt(cleanId, 10) : -1;

      // Find matching brief
      const briefRes = await db.query(
        `SELECT * FROM client_briefs 
         WHERE (brief_id = $1 OR submission_id = $2 OR LOWER(client_email) = LOWER($3))
         ORDER BY brief_id DESC LIMIT 1;`,
        [numericId, cleanId, userEmail || ""]
      );

      const brief = briefRes.rows && briefRes.rows[0];
      if (!brief) {
        return res.status(404).json({ success: false, message: "Consultation brief not found." });
      }

      const updateRes = await db.query(
        `UPDATE client_briefs 
         SET status = 'Rejected / Declined',
             is_rejected = TRUE,
             rejection_reason = $1,
             rejection_notes = $2,
             availability_status = 'Withdrawn by Client'
         WHERE brief_id = $3 RETURNING *;`,
        [reason, notes || "Client opted not to proceed.", brief.brief_id]
      );

      // Archive client project so stage reverts to PRE_INQUIRY
      try {
        await db.query(
          `UPDATE public.client_projects 
           SET is_archived = TRUE, status = 'DISCONTINUED', updated_at = NOW() 
           WHERE brief_id = $1 OR user_id = $2;`,
          [brief.brief_id, userId || brief.user_id || -1]
        );
      } catch (e) {}

      const updated = updateRes.rows[0];

      try {
        const realtimeService = require("../services/realtimeService");
        if (realtimeService?.broadcastBriefUpdated) {
          realtimeService.broadcastBriefUpdated({
            ...updated,
            outcome: "DISCONTINUED_REJECTED",
            withdrawnBy: "client",
          });
        }
      } catch (e) {}

      return res.json({
        success: true,
        brief: updated,
        message: "Consultation successfully withdrawn. Reverted to Pre-Inquiry stage.",
      });
    } catch (err) {
      console.error("[BriefsController.withdrawConsultation] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/client/active-inquiry-check
   * Pre-flight Gatekeeper: Checks if an email has an active inquiry or active project.
   */
  async checkActiveInquiry(req, res) {
    try {
      const email = req.query.email || req.user?.email || req.headers["x-client-email"];
      const rawUserId = req.query.userId || req.query.user_id || req.user?.user_id || req.user?.userId;
      const parsedUserId = rawUserId ? parseInt(rawUserId, 10) : null;

      if ((!email || !email.trim()) && !parsedUserId) {
        return res.json({ hasActiveInquiry: false });
      }

      const normalizedEmail = (email || "").trim().toLowerCase();
      const userRes = await db.query(
        "SELECT user_id, is_multi_project_approved FROM users WHERE (user_id = $1 AND $1 > 0) OR LOWER(email) = LOWER($2) LIMIT 1",
        [parsedUserId || 0, normalizedEmail]
      );
      const isMultiApproved = Boolean(userRes.rows?.[0]?.is_multi_project_approved);
      const matchedUserId = userRes.rows?.[0]?.user_id || parsedUserId || 0;

      if (isMultiApproved) {
        return res.json({ hasActiveInquiry: false, isMultiApproved: true });
      }

      // 1. Check active project by user_id OR brief_id (completed or 100% finished builds do not block re-booking)
      const projectRes = await db.query(
        `SELECT cp.client_project_id, cp.project_code, cp.project_title, cp.project_type, cp.target_location, cp.stage_id, cp.created_at 
         FROM client_projects cp
         LEFT JOIN site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
         WHERE ((cp.user_id = $1 AND $1 > 0) OR cp.brief_id IN (SELECT brief_id FROM client_briefs WHERE LOWER(client_email) = LOWER($2)))
           AND cp.is_archived = FALSE 
           AND cp.stage_id != 'COMPLETED'
           AND (sp.progress_pct IS NULL OR sp.progress_pct < 100)
           AND (sp.status IS NULL OR (sp.status NOT ILIKE '%complete%' AND sp.status NOT ILIKE '%handover%'))
         ORDER BY cp.client_project_id DESC LIMIT 1`,
        [matchedUserId, normalizedEmail]
      );

      if (projectRes.rows && projectRes.rows.length > 0) {
        const p = projectRes.rows[0];
        return res.json({
          hasActiveInquiry: true,
          activeInquiry: {
            submissionId: p.project_code,
            projectType: p.project_title || p.project_type,
            status: `Stage: ${p.stage_id}`,
            location: p.target_location,
            createdAt: p.created_at,
            isProject: true,
            stageId: p.stage_id,
          },
        });
      }

      // 2. Check active brief by user_id OR client_email (excluding completed/handed over projects or briefs already converted to projects)
      const briefRes = await db.query(
        `SELECT cb.brief_id, cb.submission_id, cb.project_type, cb.status, cb.location, cb.created_at 
         FROM client_briefs cb
         LEFT JOIN client_projects cp ON cp.brief_id = cb.brief_id
         LEFT JOIN site_projects sp ON sp.project_code = cp.project_code OR sp.client_project_id = cp.client_project_id
         WHERE ((cb.user_id = $1 AND $1 > 0) OR LOWER(cb.client_email) = LOWER($2)) 
           AND (cb.status NOT ILIKE '%reject%' AND cb.status NOT ILIKE '%decline%' AND cb.status NOT ILIKE '%discontinue%' AND cb.status NOT ILIKE '%withdrawn%' AND cb.status NOT ILIKE '%complet%')
           AND NOT (
             (cp.stage_id = 'COMPLETED' OR cp.is_archived = TRUE)
             OR (sp.status ILIKE '%complete%' OR sp.status ILIKE '%handover%' OR COALESCE(sp.progress_pct, 0) >= 100)
           )
           AND cp.client_project_id IS NULL
         ORDER BY cb.brief_id DESC 
         LIMIT 1`,
        [matchedUserId, normalizedEmail]
      );

      if (briefRes.rows && briefRes.rows.length > 0) {
        const b = briefRes.rows[0];
        return res.json({
          hasActiveInquiry: true,
          activeInquiry: {
            briefId: b.brief_id,
            submissionId: b.submission_id,
            projectType: b.project_type,
            status: b.status,
            location: b.location,
            createdAt: b.created_at,
            isProject: false,
          },
        });
      }

      return res.json({ hasActiveInquiry: false });
    } catch (err) {
      console.error("[BriefsController.checkActiveInquiry] Error:", err);
      return res.json({ hasActiveInquiry: false });
    }
  }
}

module.exports = new BriefsController();
