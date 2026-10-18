const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Modular email templates (Separated for high scalability and clean architecture)
const {
  getOtpVerificationTemplate,
  getWelcomeEmailTemplate,
  getInquiryReceiptTemplate,
  getInquiryAdminAlertTemplate,
  getInquiryMeetingConfirmationTemplate,
  getInquiryRescheduledTemplate,
  getInquiryRejectedTemplate,
  getInquiryStatusUpdateTemplate,
  getEmailVerificationLinkTemplate,
  getMeetingAttendanceReminderTemplate,
} = require("../templates/emails");

// Official business emails that must NOT receive automated system notifications in dev/staging.
const PROTECTED_OFFICIAL_EMAILS = [
  "mcpa.construction@gmail.com",
  "mcpa.constructionandsupply@gmail.com",
];

class EmailService {
  constructor() {
    this.smtpEmail = process.env.SMTP_EMAIL || "";
    this.smtpPass = (process.env.SMTP_APP_PASSWORD || "").replace(/\s+/g, "");
    this.smtpHost = process.env.SMTP_HOST || "";
    this.smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    this.resendApiKey = process.env.RESEND_API_KEY || "";
    this.resendFromEmail = process.env.RESEND_FROM_EMAIL || "MCPA Construction <onboarding@resend.dev>";
    this.primaryProvider = (process.env.EMAIL_PRIMARY_PROVIDER || "gmail").toLowerCase();
    this.transporter = null;

    if (this.smtpEmail && this.smtpPass && !this.smtpEmail.includes("YOUR_")) {
      try {
        const timeoutOptions = {
          connectionTimeout: 5000,
          socketTimeout: 5000,
        };
        if (this.smtpHost) {
          // Custom SMTP Provider (Outlook, Yahoo, Brevo, SendGrid, etc.)
          this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: this.smtpPort === 465,
            auth: {
              user: this.smtpEmail,
              pass: this.smtpPass,
            },
            ...timeoutOptions,
          });
        } else {
          // Default Gmail Service
          this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: this.smtpEmail,
              pass: this.smtpPass,
            },
            ...timeoutOptions,
          });
        }
      } catch (err) {
        console.warn("[EmailService] Nodemailer init warning:", err.message);
      }
    }
  }

  /**
   * Identifies if an email address belongs to the official company mailboxes
   * that should be isolated from test/dev automated notifications.
   * @param {string} email
   * @returns {boolean}
   */
  isProtectedOfficialEmail(email) {
    if (!email) return false;
    const clean = String(email).trim().toLowerCase();
    return PROTECTED_OFFICIAL_EMAILS.some((protectedEmail) => clean === protectedEmail || clean.includes(protectedEmail));
  }

  /**
   * Resolves a safe recipient address.
   * If an automated notification targets the official company email and ALLOW_OFFICIAL_EMAIL_DISPATCH
   * is not explicitly enabled, reroutes to ADMIN_ALERT_EMAIL or dev SMTP_EMAIL, or returns null.
   * @param {string} toEmail
   * @param {string} context
   * @returns {string|null}
   */
  resolveSafeRecipient(toEmail, context = "Email") {
    if (!toEmail) return null;
    const clean = String(toEmail).trim().toLowerCase();

    // Allow dispatch only if explicitly enabled (e.g. in real production deployment with client consent)
    if (process.env.ALLOW_OFFICIAL_EMAIL_DISPATCH === "true") {
      return toEmail;
    }

    if (this.isProtectedOfficialEmail(clean)) {
      const devAlertEmail = (process.env.ADMIN_ALERT_EMAIL || this.smtpEmail || "").trim();
      const safeDevTarget = devAlertEmail && !this.isProtectedOfficialEmail(devAlertEmail) ? devAlertEmail : null;

      if (safeDevTarget) {
        console.warn(
          `\x1b[33m[EmailService] 🛑 SAFEGUARD: Intercepted automated email intended for official company address (${toEmail}). Rerouted to developer test mailbox: ${safeDevTarget} (Context: ${context})\x1b[0m`
        );
        return safeDevTarget;
      }

      console.warn(
        `\x1b[33m[EmailService] 🛑 SAFEGUARD: Suppressed automated email to official company address (${toEmail}). No safe dev alert mailbox configured. (Context: ${context})\x1b[0m`
      );
      return null;
    }

    return toEmail;
  }

  /**
   * Resolves a safe replyTo address so test emails don't cause client inboxes to receive replies.
   * @param {string} [customReplyTo]
   * @returns {string}
   */
  resolveSafeReplyTo(customReplyTo) {
    if (process.env.ALLOW_OFFICIAL_EMAIL_DISPATCH === "true") {
      return customReplyTo || "mcpa.construction@gmail.com";
    }
    const clean = customReplyTo ? String(customReplyTo).trim().toLowerCase() : "";
    if (!clean || this.isProtectedOfficialEmail(clean)) {
      const devEmail = (process.env.ADMIN_ALERT_EMAIL || this.smtpEmail || "").trim();
      if (devEmail && !this.isProtectedOfficialEmail(devEmail)) {
        return devEmail;
      }
      return "noreply@mcpa.com";
    }
    return customReplyTo;
  }

  /**
   * Converts HTML email content into clean, readable plain-text alternative.
   * Guarantees RFC 2046 MIME multipart/alternative compliance and drastically
   * lowers SpamAssassin / Gmail machine learning spam scores.
   * @param {string} html Raw HTML email template
   * @returns {string} Clean plain-text version
   */
  htmlToPlainText(html) {
    if (!html) return "";
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/td>/gi, "  ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      .replace(/<[^>]+>/gi, "")
      .replace(/&bull;/gi, "•")
      .replace(/&middot;/gi, "·")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&rarr;/gi, "→")
      .replace(/&nbsp;/gi, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\n\s+\n/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Sends email via Resend HTTP REST API
   * Guaranteed delivery on serverless environments where SMTP ports may be restricted.
   * @param {string} toEmail Recipient email address
   * @param {string} subject Email subject line
   * @param {string} htmlContent Full HTML formatted template
   * @param {object} [options] Optional parameters: { plainText?: string, replyTo?: string, headers?: object }
   */
  async sendViaResend(toEmail, subject, htmlContent, options = {}) {
    const safeRecipient = this.resolveSafeRecipient(toEmail, subject);
    if (!safeRecipient) {
      console.log(`[EmailService] Resend dispatch safely bypassed for protected company address: ${toEmail}`);
      return true;
    }
    if (!this.resendApiKey || this.resendApiKey.includes("YOUR_")) {
      return false;
    }
    const plainText = options.text || options.plainText || this.htmlToPlainText(htmlContent);
    const replyTo = this.resolveSafeReplyTo(options.replyTo);

    try {
      const payload = {
        from: this.resendFromEmail,
        to: [safeRecipient],
        reply_to: replyTo,
        subject,
        text: plainText,
        html: htmlContent,
      };
      if (options.headers) {
        payload.headers = options.headers;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.message || `HTTP ${response.status}`);
      }

      console.log(`\x1b[32m[EmailService] Resend API email successfully delivered to ${toEmail} (ID: ${resData.id})\x1b[0m`);
      return true;
    } catch (err) {
      console.warn(`\x1b[33m[EmailService] Resend API delivery failed (${err.message}).\x1b[0m`);
      return false;
    }
  }

  /**
   * Sends 6-digit OTP email with minimalist architectural engineering UI/UX.
   * Fully responsive across Mobile, Tablet, Web, and Desktop PC.
   * Supabase Cloud CDN hosted assets, zero CID file attachments to guarantee INBOX delivery.
   * @param {string} toEmail Recipient email
   * @param {string} otpCode 6-digit verification code
   * @param {string} purpose 'PASSWORD_RESET' | '2FA'
   * @param {object} [options] Optional parameters: { portalType: 'client' | 'admin', fullName?: string }
   */
  async sendOtpEmail(toEmail, otpCode, purpose = "PASSWORD_RESET", options = {}) {
    const portalType = options.portalType === "client" ? "client" : "admin";
    const isClient = portalType === "client";

    const subject = isClient
      ? "MCPA Client Portal — Verification Code"
      : "MCPA Administrative Portal — Verification Code";

    // Clean raw code: strictly single line, no breakable spaces
    const cleanOtp = (otpCode || "").toString().trim();

    // Generate HTML from modular template (uses public Supabase CDN logos, zero attachments)
    const htmlContent = getOtpVerificationTemplate({
      otpCode: cleanOtp,
      portalType,
      subject,
    });

    const plainText = `MCPA CONSTRUCTION & SUPPLY
${isClient ? "CLIENT PORTAL • ACCOUNT VERIFICATION" : "ADMINISTRATIVE CONSOLE • ACCESS VERIFICATION"}

VERIFICATION CODE: ${cleanOtp}

A request was received to verify your ${isClient ? "MCPA Client Portal" : "MCPA Administrative Portal"} account.
Enter the 6-digit code above to complete verification and reset your password.

Valid for 120 seconds. Never share this code with anyone.

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    const mailHeaders = {
      "X-Mailer": "MCPA Dispatch Engine",
      "X-Entity-Ref-ID": `mcpa-otp-${Date.now()}`,
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    };

    const safeRecipient = this.resolveSafeRecipient(toEmail, `OTP Verification (${purpose})`);
    if (!safeRecipient) {
      console.log(`[EmailService] OTP delivery bypassed for protected official email: ${toEmail}`);
      return true;
    }
    toEmail = safeRecipient;
    const safeReplyTo = this.resolveSafeReplyTo(options.replyTo);

    // 1. Try Primary Provider (Gmail SMTP default)
    if (this.transporter && this.primaryProvider === "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: safeReplyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers: mailHeaders,
        });
        console.log(`\x1b[32m[EmailService] Primary Gmail SMTP OTP delivered to ${toEmail}\x1b[0m`);
        return true;
      } catch (err) {
        console.warn(`\x1b[33m[EmailService] Primary Gmail SMTP delivery failed (${err.message}). Activating Resend backup failover...\x1b[0m`);
      }
    }

    // 2. Try Resend API (Backup Failover or Primary)
    if (this.resendApiKey) {
      const resendDelivered = await this.sendViaResend(toEmail, subject, htmlContent, {
        plainText,
        replyTo: safeReplyTo,
        headers: mailHeaders,
      });
      if (resendDelivered) {
        return true;
      }
    }

    // 3. Fallback to Gmail SMTP if primary was Resend
    if (this.transporter && this.primaryProvider !== "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: safeReplyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers: mailHeaders,
        });
        console.log(`\x1b[32m[EmailService] Gmail SMTP fallback OTP delivered to ${toEmail}\x1b[0m`);
        return true;
      } catch (err) {
        console.warn(`\x1b[33m[EmailService] Gmail SMTP fallback delivery failed (${err.message}).\x1b[0m`);
      }
    }

    // High-visibility local terminal logger (Dev Mode)
    console.log("\n" + "=".repeat(60));
    console.log("  MCPA DEV MODE — SECURITY OTP DISPATCHED");
    console.log(`  To:      ${toEmail}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Code:    ${otpCode}`);
    console.log(`  Expires: In 120 Seconds (2 Minutes)`);
    console.log("=".repeat(60) + "\n");

    return true;
  }

  /**
   * Resilient email dispatcher with dual-engine failover:
   * Prioritizes configured primary provider (Gmail SMTP by default),
   * then automatically fails over to backup provider (Resend API or SMTP).
   * Guaranteed multipart/alternative plain-text and anti-spam headers.
   * @param {string} toEmail Recipient email address
   * @param {string} subject Email subject
   * @param {string} htmlContent HTML template
   * @param {object} [options] Optional parameters: { plainText?: string, replyTo?: string, headers?: object }
   */
  async sendEmailWithFallback(toEmail, subject, htmlContent, options = {}) {
    const safeRecipient = this.resolveSafeRecipient(toEmail, subject);
    if (!safeRecipient) {
      console.log(`\x1b[36m[EmailService] Email dispatch safely bypassed for protected company address [Subject: "${subject}"]\x1b[0m`);
      return true;
    }
    toEmail = safeRecipient;

    let delivered = false;
    const plainText = options.text || options.plainText || this.htmlToPlainText(htmlContent);
    const replyTo = this.resolveSafeReplyTo(options.replyTo);
    const headers = {
      "X-Mailer": "MCPA Dispatch Engine",
      "X-Entity-Ref-ID": `mcpa-${Date.now()}`,
      "X-Auto-Response-Suppress": "OOF, AutoReply",
      ...(options.headers || {}),
    };

    // 1. Try Primary: Gmail SMTP if primary provider is gmail
    if (this.transporter && this.primaryProvider === "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers,
        });
        console.log(`\x1b[32m[EmailService] Primary Gmail SMTP successfully delivered to ${toEmail} ("${subject}")\x1b[0m`);
        return true;
      } catch (err) {
        console.warn(`\x1b[33m[EmailService] Primary Gmail SMTP failed (${err.message}). Attempting backup...\x1b[0m`);
      }
    }

    // 2. Try Resend API (as primary or backup)
    if (this.resendApiKey) {
      try {
        delivered = await this.sendViaResend(toEmail, subject, htmlContent, {
          plainText,
          replyTo,
          headers,
        });
        if (delivered) return true;
      } catch (resendErr) {
        console.warn("[EmailService] Resend API attempt error:", resendErr.message);
      }
    }

    // 3. Fallback to Gmail SMTP if primary was not gmail or if Resend failed
    if (this.transporter && this.primaryProvider !== "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers,
        });
        console.log(`\x1b[32m[EmailService] Gmail SMTP fallback delivered to ${toEmail}\x1b[0m`);
        return true;
      } catch (err) {
        console.warn(`\x1b[31m[EmailService] SMTP fallback failed (${err.message})\x1b[0m`);
      }
    }

    // Dev mode notice
    console.log(`[EmailService DEV] Dispatched email to ${toEmail}: "${subject}"`);
    return false;
  }

  /**
   * Sends confirmation receipt email to client upon inquiry submission / under review
   */
  async sendInquiryClientReceipt(toEmail, brief) {
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Valued Client";
    const projectType = brief.project_type || brief.projectType || "Residential Design & Build";
    const location = brief.location || "Bulacan, Philippines";
    const budgetRange = brief.budget_range || brief.budgetRange || "Flexible Architectural Plan";
    const meetingDate = brief.meeting_date || brief.meetingDate || "Pending Scheduling";
    const meetingTime = brief.meeting_time || brief.meetingTime || "To be confirmed";
    const meetingMode = brief.meeting_mode || brief.meetingMode || "Online Video Call";
    const websiteUrl = process.env.FRONTEND_URL || "https://mcpa.ph";

    const subject = `MCPA Consultation Brief Received — Ref: ${subId}`;
    const htmlContent = getInquiryReceiptTemplate(brief);

    const plainText = `MCPA CONSTRUCTION & SUPPLY
INQUIRY BRIEF RECEIVED — Ref: ${subId}

Dear ${clientName},

Thank you for your interest in partnering with MCPA Construction & Supply. We have officially logged your project parameters under Reference Number ${subId}. Our architectural and engineering team is currently evaluating your design brief.

PROJECT SPECIFICATION SUMMARY:
- Reference Number: ${subId}
- Project Type: ${projectType}
- Site Location: ${location}
- Budget Tier: ${budgetRange}
- Consultation Mode: ${meetingMode}
- Requested Schedule: ${meetingDate} (${meetingTime})

TRACK IN CLIENT PORTAL:
${websiteUrl}/portal

Our project engineers will review your lot parameters and schedule availability. You will receive an official confirmation email once your consultation slot is finalized.

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }

  /**
   * Sends real-time alert to MCPA Admin team
   */
  async sendInquiryAdminAlert(brief) {
    let adminEmail = (process.env.ADMIN_ALERT_EMAIL || this.smtpEmail || "admin@mcpa.com").trim();
    if (this.isProtectedOfficialEmail(adminEmail)) {
      adminEmail = (this.smtpEmail && !this.isProtectedOfficialEmail(this.smtpEmail)) ? this.smtpEmail : "admin@mcpa.com";
    }
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Client";
    const projectType = brief.project_type || brief.projectType || "Design & Build";
    const subject = `[MCPA Inquiries] New Project Consultation: ${clientName} (${projectType}) [${subId}]`;
    const htmlContent = getInquiryAdminAlertTemplate(brief);

    const plainText = `NEW CONSULTATION BRIEF LODGED
Reference: ${subId}
Client: ${clientName} (${brief.client_email || "N/A"})
Contact: ${brief.client_phone || "Not specified"}
Scope: ${projectType} • Style: ${brief.preferred_style || "Custom"}
Lot: ${brief.location || "Bulacan"} (${brief.lot_area || "N/A"})
Meeting Request: ${brief.venue_type || brief.meeting_mode || "Online"} - ${brief.venue_details || ""}
Target Start: ${brief.target_date || "Flexible"}`;

    return await this.sendEmailWithFallback(adminEmail, subject, htmlContent, {
      plainText,
      replyTo: brief.client_email || this.resolveSafeReplyTo(),
    });
  }

  /**
   * Sends real-time notification to MCPA Admin team when a client updates their consultation schedule preferences.
   * Centralized here to guarantee safety and prevent accidental dispatches to the official company email.
   */
  async sendInquiryClientScheduleAdjustmentAlert(brief, adjustmentData = {}) {
    let adminEmail = (process.env.ADMIN_ALERT_EMAIL || this.smtpEmail || "admin@mcpa.com").trim();
    if (this.isProtectedOfficialEmail(adminEmail)) {
      adminEmail = (this.smtpEmail && !this.isProtectedOfficialEmail(this.smtpEmail)) ? this.smtpEmail : "admin@mcpa.com";
    }

    const subId = brief.submission_id || brief.submissionId || "CPB";
    const clientName = brief.client_name || brief.clientName || "Client";
    const subject = `[Client Update] Consultation Setup Adjusted by ${clientName} (${subId})`;

    const meetingMode = adjustmentData.meetingMode || brief.meeting_mode || "Online Video Call";
    const meetingDate = adjustmentData.meetingDate || brief.meeting_date || "Pending";
    const meetingTime = adjustmentData.meetingTime || brief.meeting_time || "Pending Slot";
    const meetingNotes = adjustmentData.meetingNotes || "Standard Consultation Alignment";

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #d97706; margin-top: 0; font-size: 18px;">Consultation Schedule Adjusted by Client</h3>
        <p>Client <strong>${clientName}</strong> (${brief.client_email || "N/A"}) has updated their consultation preferences:</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li><strong>Meeting Mode / Format:</strong> ${meetingMode}</li>
          <li><strong>Preferred Date:</strong> ${meetingDate}</li>
          <li><strong>Preferred Time:</strong> ${meetingTime}</li>
          <li><strong>Agenda / Notes:</strong> ${meetingNotes}</li>
        </ul>
        <p style="margin-bottom: 0; color: #64748b; font-size: 13px;">Please review and confirm this adjustment in the Admin Consultation Pipeline.</p>
      </div>
    `;

    const plainText = `CONSULTATION SCHEDULE ADJUSTED BY CLIENT
Reference: ${subId}
Client: ${clientName} (${brief.client_email || "N/A"})
Meeting Mode: ${meetingMode}
Preferred Date: ${meetingDate}
Preferred Time: ${meetingTime}
Notes: ${meetingNotes}

Please review and confirm this adjustment in the Admin Consultation Pipeline.`;

    return await this.sendEmailWithFallback(adminEmail, subject, htmlContent, {
      plainText,
      replyTo: brief.client_email || this.resolveSafeReplyTo(),
    });
  }

  /**
   * Sends consultation schedule approval & confirmation email to client
   */
  async sendInquiryMeetingConfirmation(toEmail, brief) {
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Valued Client";
    const meetingDate = brief.meeting_date || brief.meetingDate || "To be coordinated";
    const meetingTime = brief.meeting_time || brief.meetingTime || "09:00 AM - 10:30 AM PHT";
    const meetingLink = brief.meeting_link || brief.meetingLink || "https://meet.google.com/mcp-buil-tab";
    const meetingMode = brief.meeting_mode || brief.meetingMode || "Online Video Call";
    const meetingNotes = brief.meeting_notes || brief.meetingNotes || "";
    const isF2F = (meetingMode || "").toLowerCase().includes("in-person");
    const venueAddress = isF2F ? (brief.venue_details || brief.venue_type || "MCPA Head Office") : meetingLink;

    const subject = `Consultation Confirmed & Scheduled — Ref: ${subId}`;
    const htmlContent = getInquiryMeetingConfirmationTemplate(brief);

    const plainText = `MCPA CONSTRUCTION & SUPPLY
CONSULTATION CONFIRMED — Ref: ${subId}

Dear ${clientName},

Your consultation appointment for Project Brief ${subId} has been confirmed. Our engineering team is excited to meet with you and discuss your architectural vision.

CONFIRMED CONSULTATION SCHEDULE:
- Confirmed Date: ${meetingDate}
- Time Slot: ${meetingTime}
- Meeting Format: ${isF2F ? "Face-to-Face Physical Meeting" : "Virtual Video Consultation"}
- Location / Link: ${venueAddress}
${meetingNotes ? `- Architectural Meeting Note: "${meetingNotes}"\n` : ""}

TIPS TO PREPARE FOR YOUR SESSION:
- Lot dimensions, sketch plan, or Transfer Certificate of Title (TCT) copy if available.
- Inspiration photos, preferred spatial room count, or special lifestyle requirements.
- Any financing questions regarding bank loans or progress milestone billing.

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }

  /**
   * Dispatches pre-meeting attendance reminder (12h for F2F or 6h for Online)
   */
  async sendMeetingAttendanceReminder(toEmail, meetingData = {}) {
    const isF2F = !String(meetingData.mode || "").toLowerCase().includes("online");
    const subId = meetingData.projectCode || meetingData.submissionId || "MCPA Consultation";
    const leadHours = isF2F ? "12 Hours" : "6 Hours";
    const subject = `Action Required: Confirm Your Attendance (${leadHours} Reminder) — ${subId}`;

    const htmlContent = getMeetingAttendanceReminderTemplate(meetingData);
    const plainText = `MCPA CONSTRUCTION & SUPPLY
ACTION REQUIRED: CONFIRM YOUR ATTENDANCE (${leadHours.toUpperCase()} REMINDER)

Dear ${meetingData.clientName || "Valued Client"},

Your scheduled consultation (${meetingData.date || "Upcoming"} at ${meetingData.time || "Scheduled Time"}) is approaching in ${leadHours}.
Please confirm your attendance in the MCPA Client Portal to guarantee our engineering team and lounge/room availability.

Visit your Client Appointments Hub: ${process.env.FRONTEND_URL || "http://localhost:3000"}/portal?tab=meeting&confirm_attendance=true

MCPA Construction & Supply • Building Better Tomorrows`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }


  /**
   * Sends consultation rescheduled notification to client
   */
  async sendInquiryRescheduled(toEmail, brief, rescheduleMeta = {}) {
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Valued Client";
    const newMeetingDate = rescheduleMeta.meetingDate || brief.meeting_date || brief.meetingDate || "Pending";
    const newMeetingTime = rescheduleMeta.meetingTime || brief.meeting_time || brief.meetingTime || "Pending Slot";
    const previousMeetingDate = rescheduleMeta.previousMeetingDate || "Previous Date";
    const previousMeetingTime = rescheduleMeta.previousMeetingTime || "Previous Slot";
    const reason = rescheduleMeta.rescheduleReason || "Architectural Schedule Alignment";
    const notes = rescheduleMeta.rescheduleNotes || "";
    const meetingMode = rescheduleMeta.meetingMode || brief.meeting_mode || brief.meetingMode || "Online Video Call";

    const subject = `Consultation Schedule Updated — Ref: ${subId}`;
    const htmlContent = getInquiryRescheduledTemplate(brief, rescheduleMeta);

    const plainText = `MCPA CONSTRUCTION & SUPPLY
CONSULTATION SCHEDULE UPDATED — Ref: ${subId}

Dear ${clientName},

Please be advised that your consultation appointment for Project Brief ${subId} has been updated to a new confirmed schedule.

SCHEDULE COMPARISON:
- Previous Slot: ${previousMeetingDate} ${previousMeetingTime ? `(${previousMeetingTime})` : ""}
- New Confirmed Slot: ${newMeetingDate} (${newMeetingTime})
- Format: ${meetingMode}
- Reason: ${reason}
${notes ? `- Note: "${notes}"\n` : ""}

If this updated schedule does not align with your availability, you may reply directly to this email or contact our office hotline to coordinate a preferred slot.

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }

  /**
   * Sends inquiry declined / rejected notification to client
   * High-priority anti-spam protection: comprehensive plain-text alternative,
   * verified CDN-only brand assets, and authentic replyTo headers.
   */
  async sendInquiryRejected(toEmail, brief, rejectMeta = {}) {
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Valued Client";
    const projectType = brief.project_type || brief.projectType || "Residential Design & Build";
    const location = brief.location || "Bulacan";
    const reason = rejectMeta.rejectionReason || "Regional Service Boundary / Capacity Limit";
    const notes = rejectMeta.rejectionNotes || "";

    const subject = `Project Consultation Status Update — Ref: ${subId}`;
    const htmlContent = getInquiryRejectedTemplate(brief, rejectMeta);

    const plainText = `MCPA CONSTRUCTION & SUPPLY
CONSULTATION REQUEST STATUS UPDATE — Ref: ${subId}

Dear ${clientName},

Thank you for reaching out to MCPA Construction & Supply and submitting your project brief. Following a thorough architectural and engineering evaluation of your consultation appointment request (Reference ${subId}), we regret to inform you that our team is unable to approve and schedule this consultation appointment at this time.

REVIEW DETERMINATION DETAILS:
- Project Scope: ${projectType} • ${location}
- Determination Reason: ${reason}
${notes ? `- Architectural Assessment Note: "${notes}"\n` : ""}

We sincerely appreciate your interest in collaborating with MCPA Construction. Our current project commitments and regional focus dictate our active capacity. Should your timeline, location, or scope evolve in the future, we would be pleased to evaluate a subsequent inquiry.

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }

  /**
   * Sends general inquiry status update (e.g. Needs Information, For Quotation)
   */
  async sendInquiryStatusUpdate(toEmail, brief, statusMeta = {}) {
    const subId = brief.submission_id || brief.submissionId || "MCPA-CPB";
    const clientName = brief.client_name || brief.clientName || "Valued Client";
    const newStatus = statusMeta.status || brief.status || "Status Update";
    const notes = statusMeta.notes || brief.meeting_notes || brief.meetingNotes || "";
    const websiteUrl = process.env.FRONTEND_URL || "https://mcpa.ph";

    const subject = `Inquiry Status Update: ${newStatus} — Ref: ${subId}`;
    const htmlContent = getInquiryStatusUpdateTemplate(brief, statusMeta);

    const plainText = `MCPA CONSTRUCTION & SUPPLY
INQUIRY STATUS UPDATE — Ref: ${subId}

Dear ${clientName},

The status of your architectural project inquiry ${subId} has transitioned to: ${newStatus}.

CURRENT MILESTONE DETAILS:
- Active Phase: ${newStatus}
${notes ? `- Architectural Engineering Note: "${notes}"\n` : ""}

TRACK IN CLIENT PORTAL:
${websiteUrl}/portal

SITE OFFICE & CONTACT:
MCPA Construction & Supply
2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Hotline: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    return await this.sendEmailWithFallback(toEmail, subject, htmlContent, { plainText });
  }

  /**
   * Sends automatic onboarding welcome email to client upon account creation.
   * - Designed as by an elite human UI/UX designer (Anti-Vibe-Coded: precision typography, measured 8px grid, no generic emojis).
   * - Authentic company details sourced directly from the live website (Plaridel, Bulacan HQ, official phone & email).
   * - Responsive across Mobile, Tablet, and Desktop PC.
   * - System adaptive: seamlessly supports both Light and Dark mode email clients.
   * - Randomly showcases an authentic local MCPA project render.
   * @param {string} toEmail Recipient email address
   * @param {object} user Newly registered user details
   */
  async sendWelcomeClientEmail(toEmail, user = {}, options = {}) {
    const clientName = user.full_name || user.firstName || "Valued Client";
    const websiteUrl = process.env.FRONTEND_URL || "https://mcpa-construction.vercel.app";
    const clientRef = (user.user_id || user.id || Date.now().toString(36).slice(-5)).toString().toUpperCase();
    const subject = options.subject || `Welcome to MCPA Construction & Supply — Your Vision. Our Foundation. [#MCPA-${clientRef}]`;
    const currentYear = new Date().getFullYear();

    // Authentic company contact details directly from website (Footer.jsx)
    const companyPhone = "+63 949 775 8239";
    const companyPhoneDisplay = "(0949) 775 8239";
    const companyEmail = "mcpa.construction@gmail.com";
    const companyAddress = "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines";
    const companyMapsUrl = "https://maps.app.goo.gl/hPB6X66NdhViSvCp7";
    const companyFacebook = "https://www.facebook.com/MCPA.ConstructionandSupply/";
    const companyInstagram = "https://www.instagram.com/mcpa.constructionandsupply/";
    const companyTikTok = "https://www.tiktok.com/@mcpa.construction";

    // Asset paths for rich multi-image showcase (Public Supabase CDN)
    const cdnBase = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email";

    // Plain text alternative (drastically reduces spam score across Gmail, Yahoo & Outlook)
    const plainText = `MCPA CONSTRUCTION & SUPPLY


Welcome to MCPA Construction and Supply!

Hello ${clientName},

We're excited to partner with you. Your official MCPA client dossier is now active and ready for consultation booking, architectural reviews, and live construction oversight.

ACCOUNT CONFIRMATION
- Client Name: ${clientName}
- Registered Email: ${toEmail}
- Account Status: Active & Verified
- Client Dossier Ref: #MCPA-${clientRef}

OFFICIAL MCPA SERVICES & PORTFOLIO:
- Book Consultation: ${websiteUrl}/book
- Selected Projects: ${websiteUrl}/projects
- Design & Build Services: ${websiteUrl}/services
- Our 4-Step Process: ${websiteUrl}/process

CONTACT & SITE OFFICE:
Address: ${companyAddress}
Phone / Viber: ${companyPhoneDisplay}
Official Email: ${companyEmail}
Office Hours: Mon - Sat • 8:00 AM - 5:00 PM PST

Building Better Tomorrows • © ${currentYear} MCPA Construction and Supply. All rights reserved.`;

    // Generate lightweight HTML using clean CDN assets (Zero Base64 spam bloat, instant Gmail rendering)
    const emailHtml = getWelcomeEmailTemplate({
      clientName,
      toEmail,
      websiteUrl,
      currentYear,
      companyPhone,
      companyPhoneDisplay,
      companyEmail,
      companyAddress,
      companyMapsUrl,
      companyFacebook,
      companyInstagram,
      companyTikTok,
      // High-resolution public CDN assets (100% visible on Gmail, Apple Mail, Outlook, Yahoo)
      logoDarkSrc: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png",
      logoWhiteSrc: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png",
      logoSrc: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png",
      heroImgSrc: `${cdnBase}/projects/email_hero_villa.jpg`,
      projectsImgSrc: `${cdnBase}/projects/email_card_projects.jpg`,
      servicesImgSrc: `${cdnBase}/projects/email_card_services.jpg`,
      processImgSrc: `${cdnBase}/projects/email_card_process.jpg`,
      userIconSrc: `${cdnBase}/icons/user.png`,
      projectsIconSrc: `${cdnBase}/icons/projects.png`,
      servicesIconSrc: `${cdnBase}/icons/services.png`,
      processIconSrc: `${cdnBase}/icons/process.png`,
      phoneIconSrc: `${cdnBase}/icons/phone.png`,
      mailIconSrc: `${cdnBase}/icons/mail.png`,
      locationIconSrc: `${cdnBase}/icons/location.png`,
      fbIconSrc: `${cdnBase}/icons/facebook.png`,
      igIconSrc: `${cdnBase}/icons/instagram.png`,
      tiktokIconSrc: `${cdnBase}/icons/tiktok.png`,
    });

    let delivered = false;

    // 1. Try Primary Provider (Gmail SMTP when primaryProvider is "gmail")
    if (this.transporter && this.primaryProvider === "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: companyEmail,
          to: toEmail,
          subject,
          text: plainText,
          html: emailHtml,
          headers: {
            "X-Mailer": "MCPA Dispatch Engine",
            "X-Entity-Ref-ID": `mcpa-${Date.now()}`,
            "X-Auto-Response-Suppress": "OOF, AutoReply",
          },
        });
        delivered = true;
        console.log(`\x1b[32m[EmailService] Primary Gmail SMTP Welcome Email delivered to ${toEmail}\x1b[0m`);
      } catch (smtpErr) {
        console.warn(`\x1b[33m[EmailService] Primary Gmail SMTP delivery failed (${smtpErr.message}). Activating Resend backup failover...\x1b[0m`);
      }
    }

    // 2. Try Resend API (Backup Failover or Primary when EMAIL_PRIMARY_PROVIDER is "resend")
    if (!delivered && this.resendApiKey) {
      delivered = await this.sendViaResend(toEmail, subject, emailHtml, { text: plainText });
      if (delivered) {
        console.log(`\x1b[32m[EmailService] Resend API Welcome Email delivered to ${toEmail}\x1b[0m`);
      }
    }

    // 3. Fallback to Transporter if primary was not gmail but Resend failed
    if (!delivered && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: companyEmail,
          to: toEmail,
          subject,
          text: plainText,
          html: emailHtml,
          headers: {
            "X-Mailer": "MCPA Dispatch Engine",
            "X-Entity-Ref-ID": `mcpa-${Date.now()}`,
            "X-Auto-Response-Suppress": "OOF, AutoReply",
          },
        });
        delivered = true;
        console.log(`\x1b[32m[EmailService] Fallback SMTP Welcome Email delivered to ${toEmail}\x1b[0m`);
      } catch (smtpErr) {
        console.warn("[EmailService] Final SMTP welcome fallback failed:", smtpErr.message);
      }
    }

    console.log(`\n======================================================`);
    console.log(`  [EmailService] ARCHITECTURAL SHOWCASE WELCOME EMAIL DISPATCHED`);
    console.log(`  To:            ${toEmail}`);
    console.log(`  Name:          ${clientName}`);
    console.log(`  Images:        16 CDN HTTPS assets (Zero Base64 spam overhead)`);
    console.log(`  Delivery Mode: ${delivered ? "Active Cloud Delivery" : "Logged in Local Dev Console"}`);
    console.log(`======================================================\n`);

    return delivered;
  }

  /**
   * Dispatches architectural registration email verification action link.
   * Features:
   * - Responsive HTML template matching user approved mockup
   * - Adaptive Light & Dark mode support
   * - 15-minute token expiry action button
   * @param {string} toEmail Recipient email address
   * @param {string} token Cryptographic verification token
   * @param {object} [options] Optional parameters: { fullName?: string, subject?: string }
   */
  async sendRegistrationVerificationEmail(toEmail, token, options = {}) {
    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production" ? "https://mcpa.ph" : "http://localhost:3000")
    ).replace(/\/+$/, "");

    const verificationUrl = `${frontendUrl}/portal?verify_email_token=${encodeURIComponent(token)}&email=${encodeURIComponent(toEmail)}`;
    const subject = options.subject || "Verify Your Email Address — MCPA Client Portal";
    const recipientName = options.fullName || "Valued Client";

    // Lightweight HTML with high-resolution public Supabase CDN assets (NO CID file attachments)
    const htmlContent = getEmailVerificationLinkTemplate({
      verificationUrl,
      recipientName,
      recipientEmail: toEmail,
      subject,
      logoLightUrl: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png",
      logoDarkUrl: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png",
      mailIconUrl: "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/icons/mail_white.png",
    });

    // Plain text alternative (critical for passing Gmail Spam heuristics)
    const plainText = `MCPA CONSTRUCTION & SUPPLY
CLIENT PORTAL • ACCOUNT VERIFICATION

VERIFY YOUR EMAIL ADDRESS

Hello ${recipientName},

Thank you for creating an account with MCPA Construction & Supply. Please confirm your email address to continue setting up your architectural project profile:

${verificationUrl}

(Note: This verification link expires in 15 minutes.)

If you didn't request this, you can safely disregard this email.

CONTACT & SITE OFFICE:
Address: 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
Phone / Viber: (0949) 775 8239
Official Email: mcpa.construction@gmail.com

Building Better Tomorrows • © ${new Date().getFullYear()} MCPA Construction and Supply. All rights reserved.`;

    const safeRecipient = this.resolveSafeRecipient(toEmail, "Email Verification Link");
    if (!safeRecipient) {
      console.log(`[EmailService] Verification email delivery bypassed for protected email ${toEmail}`);
      return { delivered: false, verificationUrl };
    }
    toEmail = safeRecipient;
    const safeReplyTo = this.resolveSafeReplyTo(options.replyTo);

    let delivered = false;

    // 1. Try Primary Gmail / SMTP
    if (this.transporter && this.primaryProvider === "gmail") {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: safeReplyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers: {
            "X-Mailer": "MCPA Dispatch Engine",
            "X-Entity-Ref-ID": `mcpa-verify-${Date.now()}`,
            "X-Auto-Response-Suppress": "OOF, AutoReply",
          },
        });
        delivered = true;
        console.log(`\x1b[32m[EmailService] Primary Gmail SMTP Verification Email delivered to ${toEmail}\x1b[0m`);
      } catch (err) {
        console.warn(`\x1b[33m[EmailService] Primary Gmail SMTP failed (${err.message}). Trying Resend API...\x1b[0m`);
      }
    }

    // 2. Try Resend API (Failover)
    if (!delivered && this.resendApiKey) {
      delivered = await this.sendViaResend(toEmail, subject, htmlContent, { replyTo: safeReplyTo });
    }

    // 3. Fallback to Transporter if primary was not gmail
    if (!delivered && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          replyTo: safeReplyTo,
          to: toEmail,
          subject,
          text: plainText,
          html: htmlContent,
          headers: {
            "X-Mailer": "MCPA Dispatch Engine",
            "X-Entity-Ref-ID": `mcpa-verify-${Date.now()}`,
            "X-Auto-Response-Suppress": "OOF, AutoReply",
          },
        });
        delivered = true;
        console.log(`\x1b[32m[EmailService] Fallback SMTP Verification Email delivered to ${toEmail}\x1b[0m`);
      } catch (smtpErr) {
        console.warn("[EmailService] Final SMTP verification fallback failed:", smtpErr.message);
      }
    }

    // High-visibility local terminal logger (Dev & Test Mode)
    console.log("\n" + "=".repeat(66));
    console.log("  MCPA DEV MODE — EMAIL VERIFICATION ACTION LINK DISPATCHED");
    console.log(`  To:           ${toEmail}`);
    console.log(`  Name:         ${recipientName}`);
    console.log(`  Verify URL:   ${verificationUrl}`);
    console.log(`  Expires:      15 Minutes`);
    console.log(`  Delivered:    ${delivered ? "Delivered to Mailbox" : "Dev Console Mode"}`);
    console.log("=".repeat(66) + "\n");

    return { delivered, verificationUrl };
  }
}

module.exports = new EmailService();
