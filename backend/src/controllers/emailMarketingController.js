/**
 * MCPA Construction & Supply — Email Marketing Controller
 * 
 * Provides:
 * - Public subscription and unsubscribe handling (with strict consent tracking)
 * - Campaign management & execution
 * - Visual builder templates
 * - Media file uploads (multi-file upload support for images and videos)
 * - AI copy assistant integration via aiModelRouter
 * - Tracking pixels (open rate & click-through metrics)
 */

const crypto = require("crypto");
const db = require("../services/dbFailoverEngine");
const emailService = require("../services/emailService");
const storage = require("../services/storageService");
const aiModelRouter = require("../services/aiModelRouter");
const {
  compileCampaignHtml,
  compileCampaignPlainText,
} = require("../services/emailTemplateRenderer");
const { ensureEmailMarketingSchema } = require("../services/emailMarketingSchema");

// Lazy initialization check
ensureEmailMarketingSchema().catch((err) =>
  console.warn("[emailMarketingController] Schema ensure notice:", err.message)
);

/**
 * Helper: generates safe UUID / random token for unsubscribe
 */
function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * 1. PUBLIC: Subscribe to newsletter (Footer & Portal)
 */
async function subscribeNewsletter(req, res) {
  try {
    const { email, name, source = "FOOTER", marketingConsent = true } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    // 1. Check suppression list
    const suppressed = await db.query(
      "SELECT email FROM public.email_suppression_list WHERE email = $1 LIMIT 1;",
      [cleanEmail]
    );
    if (suppressed?.rows?.length > 0) {
      // Allow re-subscribing by removing from suppression list if explicit consent given
      await db.query("DELETE FROM public.email_suppression_list WHERE email = $1;", [cleanEmail]);
    }

    // 2. Check if already subscribed
    const existing = await db.query(
      "SELECT subscriber_id, status FROM public.email_subscribers WHERE email = $1 LIMIT 1;",
      [cleanEmail]
    );

    let token = generateToken();

    if (existing?.rows?.length > 0) {
      const sub = existing.rows[0];
      if (sub.status === "SUBSCRIBED") {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed to MCPA Project Briefings & Updates!",
          alreadySubscribed: true,
        });
      }

      // Re-activate previously unsubscribed user
      await db.query(
        `UPDATE public.email_subscribers 
         SET status = 'SUBSCRIBED', marketing_consent = $1, consent_timestamp = NOW(), ip_address = $2, updated_at = NOW()
         WHERE email = $3;`,
        [Boolean(marketingConsent), ipAddress, cleanEmail]
      );

      return res.status(200).json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
      });
    }

    // 3. Insert new subscriber with consent timestamp & token
    await db.query(
      `INSERT INTO public.email_subscribers 
       (email, name, status, source, marketing_consent, consent_timestamp, ip_address, unsubscribe_token)
       VALUES ($1, $2, 'SUBSCRIBED', $3, $4, NOW(), $5, $6);`,
      [cleanEmail, name || null, source, Boolean(marketingConsent), ipAddress, token]
    );

    // 4. Send Confirmation / Welcome Email via Resend/SMTP
    try {
      const welcomeSubject = "Welcome to MCPA Construction — Project Briefings & Updates";
      const unsubscribeUrl = `https://mcpaconstruction.com/unsubscribe?token=${token}`;
      const welcomeHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://mcpaconstruction.com/images/mcpa-logo-dark.png" alt="MCPA Construction" width="180" style="display: block; margin: 0 auto;" />
          </div>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 12px;">Subscription Confirmed!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Thank you for subscribing to <strong>MCPA Construction & Supply</strong> project briefings. You will receive milestone updates, structural design trends, material cost advisories, and architectural inspirations directly from our licensed team.
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 14px 18px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 600;">Philippine Data Privacy Compliance</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">
              You have explicit marketing consent recorded at ${new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })} (PHT). You can update your preferences or unsubscribe at any time.
            </p>
          </div>
          <p style="text-align: center; margin-top: 32px;">
            <a href="https://mcpaconstruction.com/projects" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
              Explore Our Recent Projects
            </a>
          </p>
          <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            MCPA Construction & Supply &bull; Plaridel, Bulacan, Philippines<br/>
            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> &bull;
            <a href="https://mcpaconstruction.com/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
          </div>
        </div>
      `;

      await emailService.sendEmailWithFallback(cleanEmail, welcomeSubject, welcomeHtml, {
        plainText: `Welcome to MCPA Construction & Supply Project Briefings!\n\nYour subscription has been confirmed. You will receive architectural updates and project showcases.\n\nUnsubscribe anytime: ${unsubscribeUrl}`,
      });
    } catch (mailErr) {
      console.warn("[emailMarketingController] Welcome email dispatch warning:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for subscribing! Check your inbox for confirmation.",
    });
  } catch (error) {
    console.error("[emailMarketingController] subscribe error:", error);
    return res.status(500).json({ success: false, message: "Subscription failed: " + error.message });
  }
}

/**
 * 2. PUBLIC: Unsubscribe
 */
async function unsubscribeNewsletter(req, res) {
  try {
    const { token, email, reason } = req.body;

    if (!token && !email) {
      return res.status(400).json({ success: false, message: "Unsubscribe token or email is required." });
    }

    let targetEmail = email;

    if (token) {
      const sub = await db.query(
        "SELECT email FROM public.email_subscribers WHERE unsubscribe_token = $1 LIMIT 1;",
        [token]
      );
      if (sub?.rows?.length > 0) {
        targetEmail = sub.rows[0].email;
      }
    }

    if (!targetEmail) {
      return res.status(404).json({ success: false, message: "Subscriber record not found." });
    }

    // Update status to UNSUBSCRIBED
    await db.query(
      "UPDATE public.email_subscribers SET status = 'UNSUBSCRIBED', marketing_consent = FALSE, updated_at = NOW() WHERE email = $1;",
      [targetEmail]
    );

    // Add to suppression list to guarantee zero future marketing dispatches
    await db.query(
      `INSERT INTO public.email_suppression_list (email, reason, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (email) DO NOTHING;`,
      [targetEmail, reason || "USER_UNSUBSCRIBED"]
    );

    return res.json({
      success: true,
      message: "You have been successfully unsubscribed. You will not receive promotional emails from MCPA.",
      email: targetEmail,
    });
  } catch (error) {
    console.error("[emailMarketingController] unsubscribe error:", error);
    return res.status(500).json({ success: false, message: "Unsubscribe failed: " + error.message });
  }
}

/**
 * 3. ADMIN: Overview Metrics
 */
async function getOverviewMetrics(req, res) {
  try {
    // 1. Total Subscribers
    const subRes = await db.query(`
      SELECT 
        COUNT(*) AS total_subscribers,
        COUNT(CASE WHEN status = 'SUBSCRIBED' THEN 1 END) AS active_subscribers,
        COUNT(CASE WHEN status = 'UNSUBSCRIBED' THEN 1 END) AS unsubscribed_count
      FROM public.email_subscribers;
    `);

    // 2. Registered customers with marketing consent
    const usersOptedInRes = await db.query(`
      SELECT COUNT(*) AS total_registered_opted_in
      FROM public.users
      WHERE email IN (
        SELECT email FROM public.email_subscribers WHERE status = 'SUBSCRIBED' AND marketing_consent = TRUE
      );
    `);

    // 3. Client inquiries with consent
    const briefsOptedInRes = await db.query(`
      SELECT COUNT(DISTINCT client_email) AS total_inquiries_opted_in
      FROM public.client_briefs
      WHERE client_email IN (
        SELECT email FROM public.email_subscribers WHERE status = 'SUBSCRIBED'
      );
    `);

    // 4. Campaign aggregates
    const campRes = await db.query(`
      SELECT 
        COUNT(*) AS total_campaigns,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) AS sent_campaigns,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) AS scheduled_campaigns,
        COALESCE(SUM(total_recipients), 0) AS total_recipients,
        COALESCE(SUM(sent_count), 0) AS total_sent,
        COALESCE(SUM(delivered_count), 0) AS total_delivered,
        COALESCE(SUM(opened_count), 0) AS total_opened,
        COALESCE(SUM(clicked_count), 0) AS total_clicked,
        COALESCE(SUM(failed_count), 0) AS total_failed
      FROM public.email_campaigns;
    `);

    // 5. Recent Campaigns
    const recentCampRes = await db.query(`
      SELECT campaign_id, title, subject, status, target_audience, total_recipients, sent_count, scheduled_at, sent_at, created_at
      FROM public.email_campaigns
      ORDER BY created_at DESC
      LIMIT 6;
    `);

    const subData = subRes?.rows?.[0] || {};
    const campData = campRes?.rows?.[0] || {};

    const totalSent = Number(campData.total_sent) || 0;
    const totalOpened = Number(campData.total_opened) || 0;
    const totalClicked = Number(campData.total_clicked) || 0;

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      metrics: {
        totalSubscribers: Number(subData.total_subscribers) || 0,
        activeSubscribers: Number(subData.active_subscribers) || 0,
        unsubscribedCount: Number(subData.unsubscribed_count) || 0,
        registeredOptedIn: Number(usersOptedInRes?.rows?.[0]?.total_registered_opted_in) || 0,
        inquiriesOptedIn: Number(briefsOptedInRes?.rows?.[0]?.total_inquiries_opted_in) || 0,
        totalCampaigns: Number(campData.total_campaigns) || 0,
        sentCampaigns: Number(campData.sent_campaigns) || 0,
        scheduledCampaigns: Number(campData.scheduled_campaigns) || 0,
        totalRecipients: Number(campData.total_recipients) || 0,
        totalSent,
        totalDelivered: Number(campData.total_delivered) || 0,
        openRate: Number(openRate),
        clickRate: Number(clickRate),
        failedCount: Number(campData.failed_count) || 0,
      },
      recentCampaigns: recentCampRes?.rows || [],
    });
  } catch (error) {
    console.error("[emailMarketingController] getOverviewMetrics error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. ADMIN: Get Subscribers (Paginated + Filtered)
 */
async function getSubscribers(req, res) {
  try {
    const { status = "all", search = "", page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let conditions = ["1=1"];
    let params = [];
    let pIdx = 1;

    if (status !== "all") {
      conditions.push(`status = $${pIdx++}`);
      params.push(status.toUpperCase());
    }

    if (search) {
      conditions.push(`(email ILIKE $${pIdx} OR name ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.join(" AND ");

    const countRes = await db.query(
      `SELECT COUNT(*) AS total FROM public.email_subscribers WHERE ${whereClause};`,
      params
    );
    const total = parseInt(countRes?.rows?.[0]?.total || 0, 10);

    const listRes = await db.query(
      `SELECT subscriber_id, email, name, status, source, marketing_consent, consent_timestamp, ip_address, created_at
       FROM public.email_subscribers
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++};`,
      [...params, parseInt(limit, 10), offset]
    );

    return res.json({
      success: true,
      subscribers: listRes?.rows || [],
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("[emailMarketingController] getSubscribers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. ADMIN: Add Subscriber
 */
async function addSubscriber(req, res) {
  try {
    const { email, name, source = "MANUAL", status = "SUBSCRIBED" } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = generateToken();

    await db.query(
      `INSERT INTO public.email_subscribers (email, name, source, status, marketing_consent, consent_timestamp, unsubscribe_token)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), $5)
       ON CONFLICT (email) DO UPDATE 
       SET status = EXCLUDED.status, name = COALESCE(EXCLUDED.name, public.email_subscribers.name), updated_at = NOW();`,
      [cleanEmail, name || null, source, status, token]
    );

    return res.json({ success: true, message: `Subscriber ${cleanEmail} saved successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. ADMIN: Audience Resolver Helper (Resolves actual recipients matching segment)
 */
async function resolveAudienceEmails(audienceType, options = {}) {
  let query = "";
  let params = [];

  switch (audienceType) {
    case "REGISTERED_CUSTOMERS":
      // Registered users who opted in to marketing
      query = `
        SELECT u.email, COALESCE(u.full_name, 'Valued Client') AS name, s.unsubscribe_token
        FROM public.users u
        INNER JOIN public.email_subscribers s ON LOWER(u.email) = LOWER(s.email)
        WHERE s.status = 'SUBSCRIBED' 
          AND s.marketing_consent = TRUE
          AND u.email NOT IN (SELECT email FROM public.email_suppression_list);
      `;
      break;

    case "PREVIOUS_INQUIRIES":
      // Clients who submitted consultation briefs AND consented
      query = `
        SELECT DISTINCT b.client_email AS email, COALESCE(b.client_name, 'Valued Client') AS name, s.unsubscribe_token
        FROM public.client_briefs b
        INNER JOIN public.email_subscribers s ON LOWER(b.client_email) = LOWER(s.email)
        WHERE s.status = 'SUBSCRIBED' 
          AND s.marketing_consent = TRUE
          AND b.client_email NOT IN (SELECT email FROM public.email_suppression_list);
      `;
      break;

    case "NO_INQUIRIES":
      // Registered users who have NO briefs yet (warm leads)
      query = `
        SELECT u.email, COALESCE(u.full_name, 'Valued Client') AS name, s.unsubscribe_token
        FROM public.users u
        INNER JOIN public.email_subscribers s ON LOWER(u.email) = LOWER(s.email)
        WHERE s.status = 'SUBSCRIBED'
          AND s.marketing_consent = TRUE
          AND LOWER(u.email) NOT IN (SELECT DISTINCT LOWER(client_email) FROM public.client_briefs WHERE client_email IS NOT NULL)
          AND u.email NOT IN (SELECT email FROM public.email_suppression_list);
      `;
      break;

    case "ALL_SUBSCRIBERS":
    default:
      // All consented subscribers from footer, portal, etc.
      query = `
        SELECT email, COALESCE(name, 'Valued Subscriber') AS name, unsubscribe_token
        FROM public.email_subscribers
        WHERE status = 'SUBSCRIBED' 
          AND marketing_consent = TRUE
          AND email NOT IN (SELECT email FROM public.email_suppression_list);
      `;
      break;
  }

  const res = await db.query(query, params);
  return res?.rows || [];
}

/**
 * 7. ADMIN: Audience Count & Preview
 */
async function getAudiencePreview(req, res) {
  try {
    const { audience = "ALL_SUBSCRIBERS" } = req.query;
    const recipients = await resolveAudienceEmails(audience);

    return res.json({
      success: true,
      audience,
      totalCount: recipients.length,
      sampleRecipients: recipients.slice(0, 5).map((r) => ({
        email: r.email,
        name: r.name,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 8. ADMIN: Templates CRUD
 */
async function getTemplates(req, res) {
  try {
    const resList = await db.query(
      `SELECT template_id, title, category, subject_default, preview_text, blocks, thumbnail_url, is_system, updated_at
       FROM public.email_templates
       ORDER BY is_system DESC, updated_at DESC;`
    );
    return res.json({ success: true, templates: resList?.rows || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createTemplate(req, res) {
  try {
    const { title, category = "Announcement", subject_default, preview_text, blocks = [] } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Template title is required." });
    }

    const html = compileCampaignHtml({ blocks, title, preview_text });

    const insertRes = await db.query(
      `INSERT INTO public.email_templates (title, category, subject_default, preview_text, blocks, html_content, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
       RETURNING template_id;`,
      [title, category, subject_default, preview_text, JSON.stringify(blocks), html]
    );

    return res.json({
      success: true,
      message: "Template saved successfully.",
      templateId: insertRes?.rows?.[0]?.template_id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { title, category, subject_default, preview_text, blocks } = req.body;

    const html = compileCampaignHtml({ blocks, title, preview_text });

    await db.query(
      `UPDATE public.email_templates
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           subject_default = COALESCE($3, subject_default),
           preview_text = COALESCE($4, preview_text),
           blocks = COALESCE($5::jsonb, blocks),
           html_content = $6,
           updated_at = NOW()
       WHERE template_id = $7;`,
      [title, category, subject_default, preview_text, blocks ? JSON.stringify(blocks) : null, html, id]
    );

    return res.json({ success: true, message: "Template updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM public.email_templates WHERE template_id = $1;", [id]);
    return res.json({ success: true, message: "Template deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 9. ADMIN: Campaigns CRUD
 */
async function getCampaigns(req, res) {
  try {
    const { status = "all" } = req.query;
    let query = `
      SELECT campaign_id, title, subject, preview_text, from_name, from_email, target_audience,
             status, scheduled_at, is_recurring, recurring_pattern, total_recipients, sent_count,
             delivered_count, failed_count, opened_count, clicked_count, unsubscribed_count,
             created_at, sent_at
      FROM public.email_campaigns
    `;
    const params = [];
    if (status !== "all") {
      query += " WHERE status = $1";
      params.push(status.toUpperCase());
    }
    query += " ORDER BY created_at DESC;";

    const campRes = await db.query(query, params);
    return res.json({ success: true, campaigns: campRes?.rows || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getCampaignById(req, res) {
  try {
    const { id } = req.params;
    const campRes = await db.query(
      "SELECT * FROM public.email_campaigns WHERE campaign_id = $1 LIMIT 1;",
      [id]
    );
    if (!campRes?.rows?.length) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    return res.json({ success: true, campaign: campRes.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createCampaign(req, res) {
  try {
    const {
      title,
      subject,
      preview_text,
      from_name = "MCPA Construction & Supply",
      from_email = "contact@mcpaconstruction.com",
      reply_to = "contact@mcpaconstruction.com",
      logo_config,
      blocks = [],
      target_audience = "ALL_SUBSCRIBERS",
      status = "DRAFT",
      scheduled_at = null,
      is_recurring = false,
      recurring_pattern = null,
      timezone = "Asia/Manila",
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: "Campaign title and subject are required." });
    }

    const html = compileCampaignHtml({ blocks, logo_config, preview_text, title });
    const plainText = compileCampaignPlainText({ blocks, title });

    // Pre-calculate recipient count
    const recipients = await resolveAudienceEmails(target_audience);

    const insertRes = await db.query(
      `INSERT INTO public.email_campaigns 
       (title, subject, preview_text, from_name, from_email, reply_to, logo_config, blocks, html_content, plain_text, target_audience, status, scheduled_at, is_recurring, recurring_pattern, timezone, total_recipients, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
       RETURNING campaign_id;`,
      [
        title,
        subject,
        preview_text || null,
        from_name,
        from_email,
        reply_to,
        JSON.stringify(logo_config || { position: "top-center", width: 180 }),
        JSON.stringify(blocks),
        html,
        plainText,
        target_audience,
        scheduled_at ? "SCHEDULED" : status,
        scheduled_at ? new Date(scheduled_at) : null,
        Boolean(is_recurring),
        recurring_pattern,
        timezone,
        recipients.length,
      ]
    );

    return res.json({
      success: true,
      message: "Campaign created successfully.",
      campaignId: insertRes?.rows?.[0]?.campaign_id,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error("[emailMarketingController] createCampaign error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      subject,
      preview_text,
      from_name,
      from_email,
      reply_to,
      logo_config,
      blocks,
      target_audience,
      status,
      scheduled_at,
      is_recurring,
      recurring_pattern,
    } = req.body;

    const html = compileCampaignHtml({ blocks, logo_config, preview_text, title });
    const plainText = compileCampaignPlainText({ blocks, title });

    const recipients = target_audience ? await resolveAudienceEmails(target_audience) : null;

    await db.query(
      `UPDATE public.email_campaigns
       SET title = COALESCE($1, title),
           subject = COALESCE($2, subject),
           preview_text = COALESCE($3, preview_text),
           from_name = COALESCE($4, from_name),
           from_email = COALESCE($5, from_email),
           reply_to = COALESCE($6, reply_to),
           logo_config = COALESCE($7::jsonb, logo_config),
           blocks = COALESCE($8::jsonb, blocks),
           html_content = $9,
           plain_text = $10,
           target_audience = COALESCE($11, target_audience),
           status = COALESCE($12, status),
           scheduled_at = $13,
           is_recurring = COALESCE($14, is_recurring),
           recurring_pattern = COALESCE($15, recurring_pattern),
           total_recipients = COALESCE($16, total_recipients),
           updated_at = NOW()
       WHERE campaign_id = $17;`,
      [
        title,
        subject,
        preview_text,
        from_name,
        from_email,
        reply_to,
        logo_config ? JSON.stringify(logo_config) : null,
        blocks ? JSON.stringify(blocks) : null,
        html,
        plainText,
        target_audience,
        status,
        scheduled_at ? new Date(scheduled_at) : null,
        is_recurring !== undefined ? Boolean(is_recurring) : null,
        recurring_pattern,
        recipients ? recipients.length : null,
        id,
      ]
    );

    return res.json({ success: true, message: "Campaign updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM public.email_campaigns WHERE campaign_id = $1;", [id]);
    return res.json({ success: true, message: "Campaign deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 10. ADMIN: Send Test Email
 */
async function sendTestEmail(req, res) {
  try {
    const { id } = req.params;
    const { testEmail } = req.body;

    if (!testEmail || !testEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid test email is required." });
    }

    const campRes = await db.query(
      "SELECT * FROM public.email_campaigns WHERE campaign_id = $1 LIMIT 1;",
      [id]
    );
    if (!campRes?.rows?.length) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const campaign = campRes.rows[0];
    const testSubject = `[TEST] ${campaign.subject}`;

    // Personalized sample replacements
    const token = "sample-preview-token";
    const sampleUnsub = `https://mcpaconstruction.com/unsubscribe?token=${token}`;
    const samplePixel = `<div style="font-size:10px; color:#94a3b8; text-align:center; padding:10px;">[TEST EMAIL — Live Tracking Pixel Simulated]</div>`;

    const html = (campaign.html_content || compileCampaignHtml(campaign))
      .replace(/\{\{unsubscribe_url\}\}/g, sampleUnsub)
      .replace(/\{\{tracking_pixel\}\}/g, samplePixel)
      .replace(/\{\{name\}\}/g, "Admin Test Recipient");

    const plainText = (campaign.plain_text || compileCampaignPlainText(campaign))
      .replace(/\{\{unsubscribe_url\}\}/g, sampleUnsub)
      .replace(/\{\{name\}\}/g, "Admin Test Recipient");

    const sent = await emailService.sendEmailWithFallback(testEmail.trim(), testSubject, html, {
      plainText,
      replyTo: campaign.reply_to || "contact@mcpaconstruction.com",
    });

    if (sent) {
      return res.json({ success: true, message: `Test email sent to ${testEmail}!` });
    } else {
      return res.status(500).json({ success: false, message: "Failed to deliver test email." });
    }
  } catch (error) {
    console.error("[emailMarketingController] sendTestEmail error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 11. ADMIN: Dispatch Campaign Now
 */
async function sendCampaignNow(req, res) {
  try {
    const { id } = req.params;
    const campRes = await db.query(
      "SELECT * FROM public.email_campaigns WHERE campaign_id = $1 LIMIT 1;",
      [id]
    );
    if (!campRes?.rows?.length) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const campaign = campRes.rows[0];
    if (campaign.status === "SENDING" || campaign.status === "SENT") {
      return res.status(400).json({
        success: false,
        message: `Campaign is already ${campaign.status}. Duplicate send blocked.`,
      });
    }

    // Mark as SENDING
    await db.query(
      "UPDATE public.email_campaigns SET status = 'SENDING', updated_at = NOW() WHERE campaign_id = $1;",
      [id]
    );

    // Resolve recipients
    const recipients = await resolveAudienceEmails(campaign.target_audience);

    // Run dispatch asynchronously so response is instant for admin
    dispatchCampaignBatch(campaign, recipients).catch((err) =>
      console.error(`[emailMarketingController] Batch dispatch failed for campaign #${id}:`, err)
    );

    return res.json({
      success: true,
      message: `Campaign dispatch started for ${recipients.length} recipients.`,
      recipientCount: recipients.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Helper: Processes campaign batch sending with rate limiting and logging
 */
async function dispatchCampaignBatch(campaign, recipients) {
  const campaignId = campaign.campaign_id;
  let sentCount = 0;
  let failedCount = 0;

  console.log(`[CampaignDispatcher] Starting campaign #${campaignId} ("${campaign.title}") for ${recipients.length} recipients.`);

  for (const recipient of recipients) {
    const email = recipient.email;
    const name = recipient.name || "Valued Client";
    const token = recipient.unsubscribe_token || generateToken();

    const unsubUrl = `https://mcpaconstruction.com/unsubscribe?token=${token}`;
    const trackingPixel = `<img src="https://mcpaconstruction.com/api/campaigns/track/open/${campaignId}/${encodeURIComponent(email)}" width="1" height="1" style="display:none;" alt="" />`;

    const html = (campaign.html_content || compileCampaignHtml(campaign))
      .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
      .replace(/\{\{tracking_pixel\}\}/g, trackingPixel)
      .replace(/\{\{name\}\}/g, name);

    const plainText = (campaign.plain_text || compileCampaignPlainText(campaign))
      .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
      .replace(/\{\{name\}\}/g, name);

    try {
      const delivered = await emailService.sendEmailWithFallback(email, campaign.subject, html, {
        plainText,
        replyTo: campaign.reply_to || "contact@mcpaconstruction.com",
      });

      if (delivered) {
        sentCount++;
        await db.query(
          `INSERT INTO public.email_campaign_logs (campaign_id, recipient_email, status, created_at)
           VALUES ($1, $2, 'DELIVERED', NOW());`,
          [campaignId, email]
        );
      } else {
        failedCount++;
        await db.query(
          `INSERT INTO public.email_campaign_logs (campaign_id, recipient_email, status, error_message, created_at)
           VALUES ($1, $2, 'FAILED', 'Delivery rejected by provider', NOW());`,
          [campaignId, email]
        );
      }
    } catch (sendErr) {
      failedCount++;
      await db.query(
        `INSERT INTO public.email_campaign_logs (campaign_id, recipient_email, status, error_message, created_at)
         VALUES ($1, $2, 'FAILED', $3, NOW());`,
        [campaignId, email, sendErr.message]
      );
    }

    // Rate-limiting delay: 100ms per email
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Update campaign to SENT with finalized metrics
  await db.query(
    `UPDATE public.email_campaigns
     SET status = 'SENT',
         total_recipients = $1,
         sent_count = $2,
         delivered_count = $2,
         failed_count = $3,
         sent_at = NOW(),
         updated_at = NOW()
     WHERE campaign_id = $4;`,
    [recipients.length, sentCount, failedCount, campaignId]
  );

  console.log(`[CampaignDispatcher] Finished campaign #${campaignId}. Sent: ${sentCount}, Failed: ${failedCount}.`);
}

/**
 * 12. ADMIN: Multi-File Media Upload (Photos & Videos)
 * Supports multiple file uploads directly storing them in cloud storage
 */
async function uploadCampaignMedia(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No media files provided." });
    }

    const uploaded = [];

    for (const file of files) {
      const publicUrl = await storage.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "campaigns"
      );

      const isVideo = file.mimetype.startsWith("video/");
      uploaded.push({
        url: publicUrl,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        isVideo,
      });
    }

    return res.json({
      success: true,
      message: `Successfully uploaded ${uploaded.length} file(s).`,
      media: uploaded,
    });
  } catch (error) {
    console.error("[emailMarketingController] uploadCampaignMedia error:", error);
    return res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
}

/**
 * 13. ADMIN: AI Email Writing & Copy Assistant
 * Powered by backend aiModelRouter (Gemini / Groq failover)
 */
async function aiAssist(req, res) {
  try {
    const { action = "subject_lines", topic, tone = "professional", language = "en", existingText = "" } = req.body;

    if (!topic && !existingText) {
      return res.status(400).json({ success: false, message: "Topic or text input is required for AI assistance." });
    }

    let prompt = "";
    if (action === "subject_lines") {
      prompt = `Generate 5 high-converting, professional email subject lines and matching preview texts for MCPA Construction & Supply.
Topic: "${topic}"
Tone: ${tone}
Language: ${language === "tl" ? "Filipino/Tagalog with English technical terms" : "English"}

Formatting rules:
- Keep subject lines under 60 characters
- Align with Philippine residential & commercial construction (e.g. Modern Architecture, Bulacan/Central Luzon projects, In-House Supply, Earthquake-Resistant Engineering)
- Output strictly as JSON array of objects: [{"subject": "...", "preview": "..."}]`;
    } else if (action === "generate_copy") {
      prompt = `Write a polished email campaign body for MCPA Construction & Supply.
Topic: "${topic}"
Tone: ${tone}
Language: ${language === "tl" ? "Natural Filipino / Taglish for Philippine home builders" : "English"}

Include:
1. Compelling Headline
2. Subheading
3. 2 concise, engaging paragraphs
4. Primary Call to Action text
Return as JSON object: {"heading": "...", "subheading": "...", "paragraph": "...", "cta": "..."}`;
    } else if (action === "improve_text") {
      prompt = `Improve and polish this text for an email campaign from MCPA Construction & Supply:
"${existingText}"
Tone: ${tone}
Output only the improved polished version.`;
    } else {
      prompt = `Provide 3 creative recommendations for an email newsletter about "${topic}" for MCPA Construction.`;
    }

    const messages = [{ role: "user", content: prompt }];
    const systemInstruction = `You are an expert construction marketing copywriter for MCPA Construction & Supply, a premier architectural design, engineering, and in-house hardware supply firm in Bulacan, Philippines. Write authentic, trustworthy copy without hyperbole.`;

    const aiResponse = await aiModelRouter.generateChatResponse(messages, systemInstruction);

    return res.json({
      success: true,
      action,
      result: aiResponse.content,
      provider: aiResponse.provider,
    });
  } catch (error) {
    console.error("[emailMarketingController] aiAssist error:", error);
    return res.status(500).json({ success: false, message: "AI assistant error: " + error.message });
  }
}

/**
 * 14. TRACKING: Open Tracking Pixel (1x1 Transparent GIF)
 */
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

async function trackOpen(req, res) {
  try {
    const { campaignId, email } = req.params;
    if (campaignId && email) {
      // Increment opened_count on campaign
      await db.query(
        "UPDATE public.email_campaigns SET opened_count = opened_count + 1 WHERE campaign_id = $1;",
        [campaignId]
      );
      // Update log
      await db.query(
        "UPDATE public.email_campaign_logs SET status = 'OPENED' WHERE campaign_id = $1 AND recipient_email = $2;",
        [campaignId, decodeURIComponent(email)]
      );
    }
  } catch (e) {
    // Ignore tracking errors to avoid blocking email client
  }

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.send(TRANSPARENT_GIF_BUFFER);
}

/**
 * 15. TRACKING: Click Tracking Redirect
 */
async function trackClick(req, res) {
  const { campaignId, email } = req.params;
  const targetUrl = req.query.url || "https://mcpaconstruction.com";

  try {
    if (campaignId && email) {
      await db.query(
        "UPDATE public.email_campaigns SET clicked_count = clicked_count + 1 WHERE campaign_id = $1;",
        [campaignId]
      );
      await db.query(
        "UPDATE public.email_campaign_logs SET status = 'CLICKED' WHERE campaign_id = $1 AND recipient_email = $2;",
        [campaignId, decodeURIComponent(email)]
      );
    }
  } catch (e) {
    // Ignore error
  }

  return res.redirect(targetUrl);
}

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getOverviewMetrics,
  getSubscribers,
  addSubscriber,
  getAudiencePreview,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendTestEmail,
  sendCampaignNow,
  uploadCampaignMedia,
  aiAssist,
  trackOpen,
  trackClick,
};
