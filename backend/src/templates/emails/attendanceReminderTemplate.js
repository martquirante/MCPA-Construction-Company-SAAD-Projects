/**
 * MCPA Construction & Supply - Pre-Meeting Attendance Confirmation Template
 * Sent 12 Hours before Face-to-Face meetings or 6 Hours before Online meetings.
 * Fully responsive across Mobile, Tablet, and Desktop PC email clients.
 * Native Dark Mode and Light Mode support with system-adaptive color styling.
 * Professional architectural design aligned with all MCPA system email templates.
 */
function getMeetingAttendanceReminderTemplate(meeting = {}) {
  const clientName = meeting.clientName || meeting.client_name || "Valued Client";
  const projectCode = meeting.projectCode || meeting.project_code || "MCPA-2026-MQ04B";
  const meetingDate = meeting.date || meeting.meeting_date || "Upcoming Date";
  const meetingTime = meeting.time || meeting.meeting_time || "10:00 AM - 11:30 AM PHT";
  const meetingMode = meeting.mode || meeting.meeting_mode || "Online Video Call";
  const leadConsultant = meeting.leadConsultant || "Engr. Raymart Quirante";
  const isF2F = !meetingMode.toLowerCase().includes("online");
  const venue = meeting.venue || "MCPA Head Office, 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan";
  const roundText = meeting.roundTitle || "Technical & Architectural Consultation";

  const websiteUrl = process.env.FRONTEND_URL || "https://mcpa.ph";
  const confirmUrl = `${websiteUrl}/portal?tab=meeting&confirm_attendance=true`;

  // Supabase High-Availability Public CDN Assets
  const logoLightUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png";
  const logoDarkUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png";

  const hoursLeadText = isF2F ? "12 Hours" : "6 Hours";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Attendance Confirmation Required — ${projectCode}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    .logo-light { display: block !important; }
    .logo-dark { display: none !important; }

    @media only screen and (max-width: 560px) {
      .email-wrapper-cell { padding: 14px 8px !important; }
      .card-body-cell { padding: 24px 18px !important; }
      .header-logo { max-width: 125px !important; }
      .h1-title { font-size: 20px !important; line-height: 1.3 !important; }
      .param-col { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 8px !important; }
      .btn-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .email-bg-table, .email-wrapper-cell { background-color: #0b0f17 !important; }
      .email-card, .card-body-cell { background-color: #111827 !important; border-color: #1f293d !important; }
      .text-title { color: #f8fafc !important; }
      .text-body { color: #cbd5e1 !important; }
      .info-card { background-color: #0a0e17 !important; border-color: #1e293b !important; }
      .info-label { color: #64748b !important; }
      .info-value { color: #e2e8f0 !important; }
      .highlight-value { color: #fbbf24 !important; }
      .divider-line { border-top-color: #1e293b !important; }
      .badge-container { color: #fbbf24 !important; }
      .footer-text { color: #64748b !important; }
      .footer-link { color: #60a5fa !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; }
    }

    [data-ogsc] .email-bg-table, [data-ogsc] .email-wrapper-cell { background-color: #0b0f17 !important; }
    [data-ogsc] .email-card, [data-ogsc] .card-body-cell { background-color: #111827 !important; border-color: #1f293d !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-body { color: #cbd5e1 !important; }
    [data-ogsc] .info-card { background-color: #0a0e17 !important; border-color: #1e293b !important; }
    [data-ogsc] .info-value { color: #e2e8f0 !important; }
    [data-ogsc] .badge-container { color: #fbbf24 !important; }
    [data-ogsc] .footer-link { color: #60a5fa !important; }
    [data-ogsc] .logo-light { display: none !important; }
    [data-ogsc] .logo-dark { display: block !important; }
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
                    <img src="${logoLightUrl}" alt="MCPA Construction & Supply" width="140" class="header-logo logo-light" style="display: block; max-width: 140px; height: auto;" />
                    <img src="${logoDarkUrl}" alt="MCPA Construction & Supply" width="140" class="header-logo logo-dark" style="display: none; max-width: 140px; height: auto;" />
                  </td>
                  <td align="right" valign="middle">
                    <div class="badge-container" style="display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #d97706; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; padding: 2px 0; background: transparent; border: none;">
                      ${hoursLeadText} Notice
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Thin Accent Divider -->
              <div style="height: 2px; width: 48px; background-color: #f59e0b; margin-bottom: 22px;"></div>

              <!-- Main Title -->
              <h1 class="text-title h1-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                Please Confirm Your Attendance
              </h1>

              <!-- Greeting & Core Message -->
              <p class="text-body" style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Dear <strong>${clientName}</strong>,
              </p>
              <p class="text-body" style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #475569;">
                Your upcoming consultation for Project <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #d97706;">${projectCode}</span> is scheduled in ${hoursLeadText.toLowerCase()}. To ensure our lead consultant and engineering resources are fully prepared for your session, please confirm your attendance below.
              </p>

              <!-- Confirmed Schedule Card -->
              <div class="info-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">
                  Consultation Appointment Details
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="param-col" width="50%" valign="top" style="padding-bottom: 12px; padding-right: 8px;">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Confirmed Date</span>
                      <strong class="highlight-value" style="display: block; font-size: 14px; color: #d97706; margin-top: 2px;">${meetingDate}</strong>
                    </td>
                    <td class="param-col" width="50%" valign="top" style="padding-bottom: 12px;">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Time Slot</span>
                      <strong class="info-value" style="display: block; font-size: 14px; color: #0f172a; margin-top: 2px;">${meetingTime}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top" style="padding-bottom: 10px;">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Session Focus</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">${roundText}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top" style="padding-bottom: 10px;">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Meeting Format</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">
                        ${isF2F ? "Face-to-Face Physical Meeting" : "Virtual Video Consultation"}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top" style="padding-bottom: 10px;">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${isF2F ? "Venue Location" : "Video Room Access"}</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">
                        ${isF2F ? venue : "Google Meet Video Room (Unlocks 15 minutes before schedule)"}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" valign="top">
                      <span class="info-label" style="display: block; font-size: 10.5px; color: #64748b; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Lead Consultant</span>
                      <strong class="info-value" style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">
                        ${leadConsultant} (Lead Project Engineer)
                      </strong>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Interactive CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <a href="${confirmUrl}" class="btn-cta" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                      Confirm My Attendance &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Session Preparation & Guidelines -->
              <div style="margin-bottom: 24px;">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px;">
                  Session Guidelines:
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.7; color: #475569;" class="text-body">
                  <li>${isF2F ? "Please arrive at our Plaridel engineering lounge 10 minutes prior to schedule. Reserved client parking is provided." : "For online calls, your secure Google Meet room will automatically activate exactly 15 minutes before the session starts."}</li>
                  <li>If you need to reschedule or adjust your time, please access the Client Portal at least 3 hours before your scheduled session.</li>
                </ul>
              </div>

              <!-- Divider -->
              <div class="divider-line" style="height: 1px; width: 100%; border-top: 1px solid #e2e8f0; margin-bottom: 20px;"></div>

              <!-- Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <div class="footer-text" style="font-size: 11px; line-height: 1.5; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <strong>MCPA Construction &amp; Supply</strong><br />
                      2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines<br />
                      Hotline: <a href="tel:+639497758239" class="footer-link" style="color: #2563eb; text-decoration: underline;">(0949) 775 8239</a> &bull; <a href="mailto:mcpa.construction@gmail.com" class="footer-link" style="color: #2563eb; text-decoration: underline;">mcpa.construction@gmail.com</a>
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

module.exports = { getMeetingAttendanceReminderTemplate };
