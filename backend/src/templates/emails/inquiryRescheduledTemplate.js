/**
 * MCPA Construction & Supply - Consultation Rescheduled Email Template
 * Dispatched to client when an inquiry consultation schedule is adjusted.
 * Fully responsive across Mobile, Tablet, and Desktop PC email clients.
 * Native Dark Mode and Light Mode support with system-adaptive color styling.
 */
function getInquiryRescheduledTemplate(brief = {}, rescheduleMeta = {}) {
  const clientName = brief.client_name || brief.clientName || "Valued Client";
  const submissionId = brief.submission_id || brief.submissionId || "MCPA-CPB-000000";
  const newMeetingDate = rescheduleMeta.meetingDate || brief.meeting_date || brief.meetingDate || "Pending";
  const newMeetingTime = rescheduleMeta.meetingTime || brief.meeting_time || brief.meetingTime || "Pending Slot";
  const previousMeetingDate = rescheduleMeta.previousMeetingDate || "Previous Date";
  const previousMeetingTime = rescheduleMeta.previousMeetingTime || "Previous Slot";
  const reason = rescheduleMeta.rescheduleReason || "Architectural Schedule Alignment";
  const notes = rescheduleMeta.rescheduleNotes || "";
  const meetingMode = rescheduleMeta.meetingMode || brief.meeting_mode || brief.meetingMode || "Online Video Call";
  const meetingLink = rescheduleMeta.meetingLink || brief.meeting_link || brief.meetingLink || "https://meet.google.com/mcp-buil-tab";
  const websiteUrl = process.env.FRONTEND_URL || "https://mcpa-construction.vercel.app";
  const portalUrl = `${websiteUrl}/portal`;
  const logoUrl = `${websiteUrl}/assets/email/email_logo_adaptive_v2.png`;

  const isF2F = (meetingMode || "").toLowerCase().includes("in-person");
  const venueType = brief.venue_type || brief.venueType;
  const venueDetails = brief.venue_details || brief.venueDetails;

  let venueDisplay = isF2F
    ? (venueDetails || venueType || "MCPA Head Office, Tabang, Plaridel, Bulacan")
    : "Virtual Google Meet Room";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Consultation Rescheduled — Ref: ${submissionId}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    @media only screen and (max-width: 560px) {
      .email-wrapper-cell { padding: 12px 6px !important; }
      .card-body-cell { padding: 22px 16px !important; }
      .header-logo { max-width: 125px !important; }
      .h1-title { font-size: 19px !important; line-height: 1.3 !important; }
      .schedule-col { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 10px !important; }
      .btn-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .email-bg-table, .email-wrapper-cell { background-color: #0b0f17 !important; }
      .email-card, .card-body-cell { background-color: #111827 !important; border-color: #1f293d !important; }
      .text-title { color: #f8fafc !important; }
      .text-sub { color: #94a3b8 !important; }
      .text-body { color: #cbd5e1 !important; }
      .info-card { background-color: #0a0e17 !important; border-color: #1e293b !important; }
      .info-label { color: #64748b !important; }
      .info-value { color: #e2e8f0 !important; }
      .highlight-value { color: #38bdf8 !important; }
      .strike-text { color: #64748b !important; }
      .divider-line { border-top-color: #1e293b !important; }
      .badge-container { background: transparent !important; background-color: transparent !important; border: none !important; color: #38bdf8 !important; }
      .footer-text { color: #64748b !important; }
      .footer-link { color: #60a5fa !important; }
    }

    [data-ogsc] .email-bg-table, [data-ogsc] .email-wrapper-cell { background-color: #0b0f17 !important; }
    [data-ogsc] .email-card, [data-ogsc] .card-body-cell { background-color: #111827 !important; border-color: #1f293d !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-body { color: #cbd5e1 !important; }
    [data-ogsc] .info-card { background-color: #0a0e17 !important; border-color: #1e293b !important; }
    [data-ogsc] .info-value { color: #e2e8f0 !important; }
    [data-ogsc] .badge-container { background: transparent !important; background-color: transparent !important; border: none !important; color: #38bdf8 !important; }
    [data-ogsc] .footer-link { color: #60a5fa !important; }
  </style>
</head>
<body bgcolor="#f1f5f9" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" class="email-bg-table" style="table-layout: fixed; width: 100% !important; min-width: 100%; background-color: #f1f5f9; margin: 0; padding: 0;">
    <tr>
      <td align="center" valign="top" bgcolor="#f1f5f9" class="email-wrapper-cell" style="padding: 32px 12px; background-color: #f1f5f9;">

        <!-- Center Card -->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden;" bgcolor="#ffffff">
          <tr>
            <td align="left" class="card-body-cell" style="padding: 32px 28px; background-color: #ffffff;" bgcolor="#ffffff">

              <!-- Header: MCPA Logo & Status Indicator -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoUrl}" alt="MCPA Construction & Supply" width="140" class="header-logo" style="display: block; max-width: 140px; height: auto;" />
                  </td>
                  <td align="right" valign="middle">
                    <div class="badge-container" style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; padding: 2px 0; background: transparent; border: none;">
                      Rescheduled
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Thin Accent Divider -->
              <div style="height: 2px; width: 48px; background-color: #0284c7; margin-bottom: 22px;"></div>

              <!-- Main Title -->
              <h1 class="text-title h1-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                Consultation Schedule Updated
              </h1>

              <!-- Greeting & Core Message -->
              <p class="text-body" style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Dear <strong>${clientName}</strong>,
              </p>
              <p class="text-body" style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #475569;">
                Please be advised that your consultation appointment for Project Brief <span style="font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #0284c7;">${submissionId}</span> has been updated to a new confirmed schedule.
              </p>

              <!-- Comparison Card -->
              <div class="info-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">
                  Schedule Comparison
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="schedule-col" width="50%" valign="top" style="padding-bottom: 12px; padding-right: 8px;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Previous Slot</span>
                      <strong class="strike-text" style="display: block; font-size: 13px; color: #94a3b8; text-decoration: line-through; margin-top: 2px;">
                        ${previousMeetingDate} ${previousMeetingTime ? `(${previousMeetingTime})` : ""}
                      </strong>
                    </td>
                    <td class="schedule-col" width="50%" valign="top" style="padding-bottom: 12px;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #0284c7; font-weight: 700; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">New Confirmed Slot</span>
                      <strong class="highlight-value" style="display: block; font-size: 14px; color: #0284c7; margin-top: 2px;">
                        ${newMeetingDate} (${newMeetingTime})
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top" style="padding-bottom: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Format &amp; Venue</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">
                        ${meetingMode} &bull; ${venueDisplay}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Reason for Rescheduling</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">
                        ${reason}
                      </strong>
                      ${notes ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-style: italic; color: #475569;">"${notes}"</p>` : ""}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Interactive Actions -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="left">
                    <a href="${portalUrl}" class="btn-cta" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 8px; letter-spacing: 0.02em; text-transform: uppercase; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);">
                      Review Updated Schedule in Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice on Conflict -->
              <p class="text-body" style="margin: 0 0 20px 0; font-size: 12.5px; line-height: 1.6; color: #64748b;">
                If this updated schedule does not align with your availability, you may reply directly to this email or reach our office hotline to coordinate a preferred time.
              </p>

              <!-- Divider -->
              <div class="divider-line" style="height: 1px; width: 100%; border-top: 1px solid #e2e8f0; margin-bottom: 20px;"></div>

              <!-- Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <div class="footer-text" style="font-size: 11px; line-height: 1.5; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <strong>MCPA Construction &amp; Supply</strong><br />
                      2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines<br />
                      Hotline: <a href="tel:+639497758239" class="footer-link" style="color: #2563eb; text-decoration: underline;">+63 949 775 8239</a> &bull; <a href="mailto:contact@mcpaconstruction.com" class="footer-link" style="color: #2563eb; text-decoration: underline;">contact@mcpaconstruction.com</a>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { getInquiryRescheduledTemplate };
