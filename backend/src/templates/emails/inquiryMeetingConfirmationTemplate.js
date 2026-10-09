/**
 * MCPA Construction & Supply - Consultation Schedule Approved Email Template
 * Dispatched to client when administrator approves and schedules the consultation.
 * Responsive across Mobile, Tablet, and Desktop PC.
 */
function getInquiryMeetingConfirmationTemplate(brief = {}) {
  const clientName = brief.client_name || brief.clientName || "Valued Client";
  const submissionId = brief.submission_id || brief.submissionId || "MCPA-CPB-000000";
  const meetingDate = brief.meeting_date || brief.meetingDate || "To be coordinated";
  const meetingTime = brief.meeting_time || brief.meetingTime || "09:00 AM - 10:30 AM PHT";
  const meetingNotes = brief.meeting_notes || brief.meetingNotes || "";
  const meetingLink = brief.meeting_link || brief.meetingLink || "";

  const isF2F = (brief.meeting_mode || brief.meetingMode || "").toLowerCase().includes("in-person");
  const venueType = brief.venue_type || brief.venueType;
  const venueDetails = brief.venue_details || brief.venueDetails;

  let modeTitle = "Online Video Consultation";
  let venueTitle = "Video Conference Room";
  let venueAddress = "Meeting link will be active 10 minutes prior to session.";
  let mapsUrl = "";

  if (isF2F) {
    modeTitle = "In-Person Consultation (Face-to-Face)";
    if (venueType === "MCPA Head Office" || venueType === "office") {
      venueTitle = "MCPA Construction Head Office";
      venueAddress = "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines";
      mapsUrl = "https://maps.app.goo.gl/hPB6X66NdhViSvCp7";
    } else if (venueDetails) {
      venueTitle = venueDetails.split(" — ")[0] || venueDetails;
      venueAddress = venueDetails;
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueDetails)}`;
    } else {
      venueTitle = "Confirmed Meeting Location";
      venueAddress = venueType || "Designated venue";
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`;
    }
  }

  const websiteUrl = process.env.FRONTEND_URL || "https://mcpa-construction.vercel.app";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consultation Scheduled — ${submissionId}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ebeae6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    @media only screen and (max-width: 620px) {
      .document-card {
        width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
        padding: 24px 18px !important;
      }
      .footer-table td {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        padding: 6px 0 !important;
      }
      .footer-divider {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #ebeae6;">
  <center style="width: 100%; background-color: #ebeae6; padding: 12px 0;">
    <div class="document-card" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #dedcd5; box-shadow: 0 8px 30px rgba(0,0,0,0.06); padding: 40px 42px; text-align: left;">
      
      <!-- Top Header Row -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td valign="top" style="text-align: left;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #111827; line-height: 1;">
              MCPA
            </div>
            <div style="font-family: monospace; font-size: 8.5px; font-weight: bold; letter-spacing: 0.22em; color: #4b5563; text-transform: uppercase; margin-top: 4px;">
              CONSTRUCTION AND SUPPLY
            </div>
            <div style="width: 72px; height: 2px; background: #059669; margin-top: 6px;"></div>
          </td>
          <td valign="top" align="right" style="text-align: right;">
            <span style="display: inline-block; padding: 6px 14px; font-family: monospace; font-size: 11px; font-weight: bold; color: #ffffff; background: #059669; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase;">
              CONFIRMED SPOT
            </span>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <h1 style="margin: 0 0 16px 0; font-size: 23px; font-weight: 800; color: #111827; letter-spacing: -0.02em; line-height: 1.2;">
        Consultation Meeting Confirmed
      </h1>

      <p style="margin: 0 0 12px 0; font-size: 14px; color: #1f2937; line-height: 1.6; font-weight: 600;">
        Hello, ${clientName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 13.5px; color: #374151; line-height: 1.65;">
        Our Lead Architect and Engineering team have reviewed your project dossier (Ref: <strong>${submissionId}</strong>) and confirmed your consultation schedule.
      </p>

      <!-- Confirmed Schedule Card -->
      <div style="border: 1px solid #d1fae5; border-radius: 8px; background: #f0fdf4; padding: 20px 22px; margin-bottom: 24px;">
        <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #dcfce7;">
          CONFIRMED CONSULTATION DETAILS
        </div>
        <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 13px; color: #1f2937;">
          <tr>
            <td width="36%" valign="top" style="color: #047857; font-size: 12px; padding: 4px 0;">Consultation Date</td>
            <td width="4%" valign="top" style="color: #047857; padding: 4px 0;">:</td>
            <td width="60%" valign="top" style="font-weight: 700; color: #111827; padding: 4px 0;">${meetingDate}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #047857; font-size: 12px; padding: 4px 0;">Time Window</td>
            <td valign="top" style="color: #047857; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 700; color: #111827; padding: 4px 0;">${meetingTime}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #047857; font-size: 12px; padding: 4px 0;">Meeting Format</td>
            <td valign="top" style="color: #047857; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${modeTitle}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #047857; font-size: 12px; padding: 4px 0;">Venue / Location</td>
            <td valign="top" style="color: #047857; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">
              ${venueTitle}<br>
              <span style="font-size: 11px; color: #4b5563; font-weight: normal;">${venueAddress}</span>
            </td>
          </tr>
          ${
            meetingNotes
              ? `
          <tr>
            <td valign="top" style="color: #047857; font-size: 12px; padding: 4px 0;">Architect Notes</td>
            <td valign="top" style="color: #047857; padding: 4px 0;">:</td>
            <td valign="top" style="font-size: 12px; color: #374151; padding: 4px 0;">${meetingNotes}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Action Button: Open Maps or Join Video Meeting -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center">
            ${
              isF2F && mapsUrl
                ? `
              <a href="${mapsUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-family: monospace; font-size: 11.5px; font-weight: bold; text-decoration: none; padding: 13px 30px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                OPEN VENUE IN GOOGLE MAPS →
              </a>
            `
                : meetingLink
                ? `
              <a href="${meetingLink}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-family: monospace; font-size: 11.5px; font-weight: bold; text-decoration: none; padding: 13px 30px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                JOIN VIDEO CONSULTATION →
              </a>
            `
                : `
              <a href="${websiteUrl}/portal" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-family: monospace; font-size: 11.5px; font-weight: bold; text-decoration: none; padding: 13px 30px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                VIEW DETAILS IN CLIENT PORTAL →
              </a>
            `
            }
          </td>
        </tr>
      </table>

      <!-- Note -->
      <p style="margin: 0 0 28px 0; font-size: 12px; color: #57534e; line-height: 1.6; text-align: left;">
        Need to reschedule or have site questions? Please reply directly to this email or contact our consultation line.
      </p>

      <div style="height: 1px; background: #e7e5e0; margin-bottom: 20px;"></div>

      <!-- Footer Table -->
      <table class="footer-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 11px; color: #44403c; line-height: 1.6;">
        <tr>
          <td valign="top" style="text-align: left;">
            <strong style="color: #111827;">MCPA Construction & Supply</strong><br>
            <span style="color: #78716c;">Tabang, Plaridel, Bulacan</span>
          </td>
          <td class="footer-divider" width="1" style="background: #e7e5e0; margin: 0 16px;"></td>
          <td valign="top" style="text-align: left; padding-left: 18px;">
            <div style="margin-bottom: 2px;">
              📞 <span style="color: #78716c;">Hotline:</span> <strong style="color: #111827;">+63 949 775 8239</strong>
            </div>
            <div>
              ✉️ <span style="color: #78716c;">Email:</span> <a href="mailto:mcpa.construction@gmail.com" style="color: #111827; text-decoration: none; font-weight: 600;">mcpa.construction@gmail.com</a>
            </div>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>
  `.trim();
}

module.exports = {
  getInquiryMeetingConfirmationTemplate,
};
