const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const bcrypt = require("bcryptjs");
const emailService = require("../services/emailService");

class BriefsController {
  async getAll(req, res) {
    try {
      const result = await db.query("SELECT * FROM client_briefs ORDER BY brief_id DESC");
      return res.json({ success: true, briefs: result.rows || [] });
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
            meetingMode || (venueType ? `In-Person (${venueType})` : "Online Meeting (Google Meet)"),
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
            meetingMode || (venueType ? `In-Person (${venueType})` : "Online Meeting (Google Meet)"),
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
        quotationAmount,
        quotationNotes,
        clientPortalCode,
      } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const result = await db.query(
        `UPDATE client_briefs SET 
          status = $1,
          meeting_date = COALESCE($2, meeting_date),
          meeting_time = COALESCE($3, meeting_time),
          meeting_link = COALESCE($4, meeting_link),
          meeting_notes = COALESCE($5, meeting_notes),
          quotation_amount = COALESCE($6, quotation_amount),
          quotation_notes = COALESCE($7, quotation_notes),
          client_portal_code = COALESCE($8, client_portal_code)
        WHERE brief_id = $9 RETURNING *`,
        [
          status,
          meetingDate || null,
          meetingTime || null,
          meetingLink || null,
          meetingNotes || null,
          quotationAmount || null,
          quotationNotes || null,
          clientPortalCode || null,
          parseInt(id, 10),
        ]
      );

      return res.json({
        success: true,
        brief: result.rows[0],
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
      const briefRes = await db.query("SELECT * FROM client_briefs WHERE brief_id = $1", [parseInt(id, 10)]);
      if (!briefRes.rows || briefRes.rows.length === 0) {
        return res.status(404).json({ message: "Brief not found." });
      }
      const brief = briefRes.rows[0];
      const portalCode = `MCPA-${brief.client_name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Update brief with code
      await db.query("UPDATE client_briefs SET client_portal_code = $1, status = 'Approved / Accepted' WHERE brief_id = $2", [portalCode, parseInt(id, 10)]);

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
      const briefId = parseInt(id, 10);

      // 1. Fetch brief attachments to clean up from Azure mcpa-briefs container
      const existing = await db.query("SELECT uploaded_files FROM client_briefs WHERE brief_id = $1", [briefId]);
      let attachedFiles = [];
      if (existing.rows.length > 0 && existing.rows[0].uploaded_files) {
        let files = existing.rows[0].uploaded_files;
        if (typeof files === "string") {
          try { files = JSON.parse(files); } catch (e) { files = [files]; }
        }
        if (Array.isArray(files)) {
          attachedFiles = files.filter(f => typeof f === "string" && f.trim().length > 0);
        }
      }

      // 2. Delete brief from database
      await db.query("DELETE FROM client_briefs WHERE brief_id = $1", [briefId]);

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
}

module.exports = new BriefsController();
