/**
 * MCPA Construction & Supply - Inquiry Declined / Rejected Email Template
 * Professional, respectful, and transparent architectural project notice.
 * Fully responsive across Mobile, Tablet, and Desktop PC email clients.
 * Native Dark Mode and Light Mode support with system-adaptive color styling.
 */
function getInquiryRejectedTemplate(brief = {}, rejectMeta = {}) {
  const clientName = brief.client_name || brief.clientName || "Valued Client";
  const submissionId = brief.submission_id || brief.submissionId || "MCPA-CPB-000000";
  const projectType = brief.project_type || brief.projectType || "Residential Design & Build";
  const location = brief.location || "Bulacan";
  const reason = rejectMeta.rejectionReason || "Regional Service Boundary / Capacity Limit";
  const notes = rejectMeta.rejectionNotes || "";
  const websiteUrl = process.env.FRONTEND_URL || "https://mcpa-construction.vercel.app";
  const logoUrl = `${websiteUrl}/assets/email/email_logo_adaptive_v2.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Project Consultation Notice — Ref: ${submissionId}</title>
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
      .divider-line { border-top-color: #1e293b !important; }
      .badge-container { background: transparent !important; background-color: transparent !important; border: none !important; color: #f87171 !important; }
      .footer-text { color: #64748b !important; }
      .footer-link { color: #60a5fa !important; }
    }

    [data-ogsc] .email-bg-table, [data-ogsc] .email-wrapper-cell { background-color: #0b0f17 !important; }
    [data-ogsc] .email-card, [data-ogsc] .card-body-cell { background-color: #111827 !important; border-color: #1f293d !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-body { color: #cbd5e1 !important; }
    [data-ogsc] .info-card { background-color: #0a0e17 !important; border-color: #1e293b !important; }
    [data-ogsc] .info-value { color: #e2e8f0 !important; }
    [data-ogsc] .badge-container { background: transparent !important; background-color: transparent !important; border: none !important; color: #f87171 !important; }
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
                    <div class="badge-container" style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #dc2626; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; padding: 2px 0; background: transparent; border: none;">
                      Declined
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Thin Accent Divider -->
              <div style="height: 2px; width: 48px; background-color: #ef4444; margin-bottom: 22px;"></div>

              <!-- Main Title -->
              <h1 class="text-title h1-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                Consultation Request Status Update
              </h1>

              <!-- Greeting & Core Message -->
              <p class="text-body" style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Dear <strong>${clientName}</strong>,
              </p>
              <p class="text-body" style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #475569;">
                Thank you for reaching out to <strong>MCPA Construction &amp; Supply</strong> and submitting your project brief. Following a thorough architectural and engineering evaluation of your consultation appointment request (Reference <span style="font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #b91c1c;">${submissionId}</span>), we regret to inform you that our team is unable to approve and schedule this consultation appointment at this time.
              </p>

              <!-- Reason Breakdown Card -->
              <div class="info-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">
                  Review Determination Details
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" style="padding-bottom: 10px;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Project Scope</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">${projectType} &bull; ${location}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" style="padding-bottom: 8px;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Determination Reason</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #b91c1c; margin-top: 2px;">${reason}</strong>
                    </td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td valign="top" style="padding-top: 8px; border-top: 1px solid #e2e8f0;">
                      <span class="info-label" style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">Architectural Assessment Note</span>
                      <p style="margin: 4px 0 0 0; font-size: 12px; font-style: italic; color: #475569;">"${notes}"</p>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <!-- Respectful Closing -->
              <p class="text-body" style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                We sincerely appreciate your interest in collaborating with MCPA Construction. Our current project commitments and regional focus dictate our active capacity. Should your timeline, location, or scope evolve in the future, we would be pleased to evaluate a subsequent inquiry.
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

module.exports = { getInquiryRejectedTemplate };
