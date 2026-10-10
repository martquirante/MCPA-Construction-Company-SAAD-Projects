const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const bcrypt = require("bcryptjs");
const emailService = require("../services/emailService");

class BriefsController {
  async getAll(req, res) {
    try {
      const result = await db.query("SELECT * FROM client_briefs ORDER BY brief_id DESC");
      let briefs = result.rows || [];

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
          if (!resolvedAvatar && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com" || emailLower === "dbprojectmartquirante@gmail.com")) {
            resolvedAvatar = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
          }

          return {
            ...b,
            avatar_url: resolvedAvatar,
            avatarUrl: resolvedAvatar,
            auth_provider: b.auth_provider || user?.auth_provider || (isGoogle ? "google" : "local"),
            authProvider: b.auth_provider || user?.auth_provider || (isGoogle ? "google" : "local"),
            email_verified: user?.email_verified ?? b.email_verified ?? isGoogle,
          };
        });
      } catch (userJoinErr) {
        console.warn("[BriefsController.getAll] User join notice:", userJoinErr.message);
        briefs = briefs.map((b) => {
          const emailLower = (b.client_email || "").toLowerCase().trim();
          let resolvedAvatar = b.avatar_url || null;
          if (!resolvedAvatar && (emailLower === "rayquirante@gmail.com" || emailLower === "martquirante04@gmail.com")) {
            resolvedAvatar = "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
          }
          return {
            ...b,
            avatar_url: resolvedAvatar,
            avatarUrl: resolvedAvatar,
            auth_provider: b.auth_provider || (emailLower.endsWith("@gmail.com") ? "google" : "local"),
            authProvider: b.auth_provider || (emailLower.endsWith("@gmail.com") ? "google" : "local"),
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

      const normalizedEmail = clientEmail.trim().toLowerCase();

      // 1. Anti-Spam Check: Max 3 active/pending inquiries per client
      const activeCheck = await db.query(
        "SELECT COUNT(*) AS active_count FROM client_briefs WHERE LOWER(client_email) = LOWER($1) AND status IN ('Pending Review', 'Meeting Scheduled')",
        [normalizedEmail]
      );
      const activeCount = parseInt(activeCheck.rows?.[0]?.active_count || "0", 10);
      if (activeCount >= 3) {
        return res.status(429).json({
          message: "You have 3 active inquiries currently undergoing architectural review. Please wait for our team's response or manage your existing briefs in the Client Portal.",
        });
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

      const id = submissionId || `MCPA-CPB-${Math.floor(100000 + Math.random() * 900000)}`;

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
            storeys, site_address_details, spatial_wishlist, message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18, $19, $20, $21, $22, 'Pending Availability Confirmation', $23, $24, $25, $26)
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
            meetingMode || (venueType ? `In-Person (${venueType})` : "Online Meeting"),
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
            user_id, wants_meeting, venue_type, venue_details, availability_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18, $19, $20, $21, $22, 'Pending Availability Confirmation')
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
            meetingMode || (venueType ? `In-Person (${venueType})` : "Online Meeting"),
            meetingDate || "",
            meetingTime || "",
            mapCoordinates || "",
            userId ? parseInt(userId, 10) : null,
            Boolean(wantsMeeting),
            venueType || null,
            venueDetails || null,
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
          availability_status = COALESCE($12, availability_status)
        WHERE (brief_id = $13 OR submission_id = $14) RETURNING *`,
        [
          status,
          meetingDate || null,
          meetingTime || null,
          meetingLink || null,
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
        ]
      );

      const updatedBrief = result.rows[0];

      // Dispatch appropriate email notification based on inquiry lifecycle event
      if (updatedBrief?.client_email) {
        try {
          const clientEmail = updatedBrief.client_email;

          if (isRejectAction) {
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

      // Broadcast update in real-time
      try {
        const realtimeService = require("../services/realtimeService");
        if (realtimeService?.broadcastBriefUpdated) {
          realtimeService.broadcastBriefUpdated(updatedBrief);
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
}

module.exports = new BriefsController();
