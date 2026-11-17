/**
 * MCPA Construction & Supply — Background Email Campaign Scheduler
 * 
 * Periodically polls for campaigns marked 'SCHEDULED' whose scheduled_at timestamp has passed.
 * Also handles recurring schedules (DAILY, WEEKLY, MONTHLY) by updating next run dates.
 */

const db = require("./dbFailoverEngine");
const emailService = require("./emailService");
const { compileCampaignHtml, compileCampaignPlainText } = require("./emailTemplateRenderer");

let isRunning = false;

async function checkAndDispatchScheduledCampaigns() {
  if (isRunning) return;
  isRunning = true;

  try {
    const pending = await db.query(`
      SELECT * FROM public.email_campaigns
      WHERE status = 'SCHEDULED' 
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 3;
    `);

    if (!pending?.rows?.length) {
      isRunning = false;
      return;
    }

    for (const campaign of pending.rows) {
      console.log(`[CampaignScheduler] Auto-triggering scheduled campaign #${campaign.campaign_id}: "${campaign.title}"`);

      // Mark as SENDING
      await db.query(
        "UPDATE public.email_campaigns SET status = 'SENDING', updated_at = NOW() WHERE campaign_id = $1;",
        [campaign.campaign_id]
      );

      // Resolve audience (multi-source robust resolution)
      let query = `
        SELECT DISTINCT ON (LOWER(email)) email, name, unsubscribe_token
        FROM (
          SELECT s.email, COALESCE(s.name, 'Valued Subscriber') AS name, s.unsubscribe_token
          FROM public.email_subscribers s
          WHERE s.status = 'SUBSCRIBED' AND s.marketing_consent = TRUE
          UNION ALL
          SELECT u.email, COALESCE(u.full_name, 'Valued Client') AS name, MD5(LOWER(u.email)) AS unsubscribe_token
          FROM public.users u
          WHERE u.email IS NOT NULL AND u.email != ''
          UNION ALL
          SELECT b.client_email AS email, COALESCE(b.client_name, 'Valued Client') AS name, MD5(LOWER(b.client_email)) AS unsubscribe_token
          FROM public.client_briefs b
          WHERE b.client_email IS NOT NULL AND b.client_email != ''
        ) combined
        WHERE email NOT IN (SELECT email FROM public.email_suppression_list)
        ORDER BY LOWER(email);
      `;
      if (campaign.target_audience === "REGISTERED_CUSTOMERS") {
        query = `
          SELECT DISTINCT ON (LOWER(email)) email, name, unsubscribe_token
          FROM (
            SELECT u.email, COALESCE(u.full_name, 'Valued Client') AS name, COALESCE(s.unsubscribe_token, MD5(LOWER(u.email))) AS unsubscribe_token
            FROM public.users u
            LEFT JOIN public.email_subscribers s ON LOWER(u.email) = LOWER(s.email)
            WHERE (s.status IS NULL OR s.status = 'SUBSCRIBED')
              AND u.email IS NOT NULL AND u.email != ''
          ) combined
          WHERE email NOT IN (SELECT email FROM public.email_suppression_list)
          ORDER BY LOWER(email);
        `;
      } else if (campaign.target_audience === "PREVIOUS_INQUIRIES") {
        query = `
          SELECT DISTINCT ON (LOWER(email)) email, name, unsubscribe_token
          FROM (
            SELECT b.client_email AS email, COALESCE(b.client_name, 'Valued Client') AS name, COALESCE(s.unsubscribe_token, MD5(LOWER(b.client_email))) AS unsubscribe_token
            FROM public.client_briefs b
            LEFT JOIN public.email_subscribers s ON LOWER(b.client_email) = LOWER(s.email)
            WHERE (s.status IS NULL OR s.status = 'SUBSCRIBED')
              AND b.client_email IS NOT NULL AND b.client_email != ''
          ) combined
          WHERE email NOT IN (SELECT email FROM public.email_suppression_list)
          ORDER BY LOWER(email);
        `;
      }

      const recRes = await db.query(query);
      const recipients = recRes?.rows || [];

      let sentCount = 0;
      let failedCount = 0;

      for (const rec of recipients) {
        const token = rec.unsubscribe_token || "mcpa-unsub-token";
        const unsubUrl = `https://mcpaconstruction.com/unsubscribe?token=${token}`;
        const trackingPixel = `<img src="https://mcpaconstruction.com/api/campaigns/track/open/${campaign.campaign_id}/${encodeURIComponent(rec.email)}" width="1" height="1" style="display:none;" alt="" />`;

        const html = (campaign.html_content || compileCampaignHtml(campaign))
          .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
          .replace(/\{\{tracking_pixel\}\}/g, trackingPixel)
          .replace(/\{\{name\}\}/g, rec.name);

        const plainText = (campaign.plain_text || compileCampaignPlainText(campaign))
          .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl)
          .replace(/\{\{name\}\}/g, rec.name);

        try {
          const ok = await emailService.sendEmailWithFallback(rec.email, campaign.subject, html, {
            plainText,
            replyTo: campaign.reply_to || "contact@mcpaconstruction.com",
          });
          if (ok) {
            sentCount++;
            await db.query(
              "INSERT INTO public.email_campaign_logs (campaign_id, recipient_email, status, created_at) VALUES ($1, $2, 'DELIVERED', NOW());",
              [campaign.campaign_id, rec.email]
            );
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
        }

        await new Promise((r) => setTimeout(r, 120));
      }

      // Check if recurring
      if (campaign.is_recurring && campaign.recurring_pattern) {
        let nextDate = new Date();
        if (campaign.recurring_pattern === "DAILY") {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (campaign.recurring_pattern === "WEEKLY") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (campaign.recurring_pattern === "MONTHLY") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await db.query(
          `UPDATE public.email_campaigns
           SET status = 'SCHEDULED',
               scheduled_at = $1,
               sent_count = sent_count + $2,
               delivered_count = delivered_count + $2,
               failed_count = failed_count + $3,
               sent_at = NOW(),
               updated_at = NOW()
           WHERE campaign_id = $4;`,
          [nextDate, sentCount, failedCount, campaign.campaign_id]
        );
        console.log(`[CampaignScheduler] Campaign #${campaign.campaign_id} rescheduled for ${nextDate.toISOString()}`);
      } else {
        await db.query(
          `UPDATE public.email_campaigns
           SET status = 'SENT',
               sent_count = $1,
               delivered_count = $1,
               failed_count = $2,
               sent_at = NOW(),
               updated_at = NOW()
           WHERE campaign_id = $3;`,
          [sentCount, failedCount, campaign.campaign_id]
        );
      }
    }
  } catch (error) {
    console.error("[CampaignScheduler] Error in scheduler cycle:", error.message);
  } finally {
    isRunning = false;
  }
}

function startCampaignScheduler(intervalMs = 60000) {
  console.log("[CampaignScheduler] Initialized background campaign scheduler (60s tick).");
  // Run first check after 10 seconds
  setTimeout(checkAndDispatchScheduledCampaigns, 10000);
  // Recurring interval
  return setInterval(checkAndDispatchScheduledCampaigns, intervalMs);
}

module.exports = {
  startCampaignScheduler,
  checkAndDispatchScheduledCampaigns,
};
