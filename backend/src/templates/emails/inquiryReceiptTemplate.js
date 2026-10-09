/**
 * MCPA Construction & Supply - Consultation Inquiry Confirmation Email Template
 * Precision-crafted to match the official architectural document sheet.
 * Fully responsive across Mobile, Tablet, and Desktop PC email clients.
 */
function getInquiryReceiptTemplate(brief = {}) {
  const clientName = brief.client_name || brief.clientName || "Valued Client";
  const submissionId = brief.submission_id || brief.submissionId || "MCPA-CPB-467599";
  const projectType = brief.project_type || brief.projectType || "Commercial / Industrial";
  const preferredStyle = brief.preferred_style || brief.preferredStyle || "Modern Contemporary";
  const storeys = brief.storeys || "2-Storey";
  const location = brief.location || "Plaridel, Bulacan";
  const budgetRange = brief.budget_range || brief.budgetRange || "Flexible / As per design";
  
  // Resolve consultation venue & mode
  const isF2F = (brief.meeting_mode || brief.meetingMode || "").toLowerCase().includes("in-person");
  const venueType = brief.venue_type || brief.venueType;
  const venueDetails = brief.venue_details || brief.venueDetails;
  
  let consultationDisplay = "Online Video Call";
  if (isF2F) {
    if (venueType === "MCPA Head Office" || venueType === "office") {
      consultationDisplay = "In-Person • MCPA Head Office (Tabang, Plaridel, Bulacan)";
    } else if (venueDetails) {
      consultationDisplay = `In-Person • ${venueDetails}`;
    } else {
      consultationDisplay = `In-Person • ${venueType || "Designated Meeting Venue"}`;
    }
  }

  const meetingDate = brief.meeting_date || brief.meetingDate || "2026-10-10";
  const meetingTime = brief.meeting_time || brief.meetingTime || "Morning Slot (09:00 AM)";

  const websiteUrl = process.env.FRONTEND_URL || "https://mcpa-construction.vercel.app";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Sheet Received — ${submissionId}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
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
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
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
      .timeline-step-label {
        font-size: 10px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #ebeae6;">
  <center style="width: 100%; background-color: #ebeae6; padding: 12px 0;">
    <!-- Document Container (A4 Architectural Document Aesthetic) -->
    <div class="document-card" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #dedcd5; box-shadow: 0 8px 30px rgba(0,0,0,0.06); padding: 40px 42px; text-align: left;">
      
      <!-- Top Header Row -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <!-- MCPA Branding with Accent Underline -->
          <td valign="top" style="text-align: left;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #111827; line-height: 1;">
              MCPA
            </div>
            <div style="font-family: monospace; font-size: 8.5px; font-weight: bold; letter-spacing: 0.22em; color: #4b5563; text-transform: uppercase; margin-top: 4px;">
              CONSTRUCTION AND SUPPLY
            </div>
            <div style="width: 72px; height: 2px; background: #c27803; margin-top: 6px;"></div>
          </td>
          <!-- Reference Pill Badge -->
          <td valign="top" align="right" style="text-align: right;">
            <span style="display: inline-block; padding: 6px 14px; font-family: monospace; font-size: 11px; font-weight: bold; color: #ffffff; background: #c27803; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase;">
              ${submissionId}
            </span>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <h1 style="margin: 0 0 16px 0; font-size: 23px; font-weight: 800; color: #111827; letter-spacing: -0.02em; line-height: 1.2;">
        Inquiry Sheet Received
      </h1>

      <!-- Salutation & Body Text -->
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #1f2937; line-height: 1.6; font-weight: 600;">
        Magandang araw, ${clientName},
      </p>
      <p style="margin: 0 0 28px 0; font-size: 13.5px; color: #374151; line-height: 1.65;">
        Natanggap na namin ang iyong project inquiry dossier. Kasalukuyan na itong sinusuri ng aming Engineering and Architectural Team para maihanda ang pinakamagandang solusyon at initial assessment para sa iyong itatayong proyekto.
      </p>

      <!-- 3-Phase Step Timeline Progress Tracker -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
        <tr>
          <!-- Step 1: Inquiry Received (Completed) -->
          <td align="center" valign="top" style="width: 33.3%;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #c27803; color: #ffffff; font-weight: bold; line-height: 28px; text-align: center; margin: 0 auto 6px auto; font-size: 14px;">
              ✓
            </div>
            <div class="timeline-step-label" style="font-size: 11.5px; font-weight: 700; color: #111827; line-height: 1.2;">
              Inquiry Received
            </div>
            <div style="font-family: monospace; font-size: 9px; color: #78716c; text-transform: uppercase; margin-top: 3px; font-weight: bold;">
              COMPLETED
            </div>
          </td>

          <!-- Step 2: Architectural Review (In Progress) -->
          <td align="center" valign="top" style="width: 33.3%;">
            <div style="width: 26px; height: 26px; border-radius: 50%; border: 2px solid #c27803; color: #c27803; font-weight: bold; line-height: 26px; text-align: center; margin: 0 auto 6px auto; font-size: 12px; background: #ffffff;">
              2
            </div>
            <div class="timeline-step-label" style="font-size: 11.5px; font-weight: 700; color: #111827; line-height: 1.2;">
              Architectural Review
            </div>
            <div style="font-family: monospace; font-size: 9px; color: #c27803; text-transform: uppercase; margin-top: 3px; font-weight: bold;">
              IN PROGRESS
            </div>
          </td>

          <!-- Step 3: Consultation Call (Next Step) -->
          <td align="center" valign="top" style="width: 33.3%;">
            <div style="width: 26px; height: 26px; border-radius: 50%; border: 2px solid #d6d3d1; color: #a8a29e; font-weight: bold; line-height: 26px; text-align: center; margin: 0 auto 6px auto; font-size: 12px; background: #ffffff;">
              3
            </div>
            <div class="timeline-step-label" style="font-size: 11.5px; font-weight: 700; color: #78716c; line-height: 1.2;">
              Consultation Call
            </div>
            <div style="font-family: monospace; font-size: 9px; color: #a8a29e; text-transform: uppercase; margin-top: 3px; font-weight: bold;">
              NEXT STEP
            </div>
          </td>
        </tr>
      </table>

      <!-- Submitted Project Specifications Card -->
      <div style="border: 1px solid #e7e5e0; border-radius: 8px; background: #faf9f6; padding: 20px 22px; margin-bottom: 26px;">
        <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #44403c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eae7df;">
          SUBMITTED PROJECT SPECIFICATIONS
        </div>
        <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 12.5px; color: #1f2937;">
          <tr>
            <td width="36%" valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Project Scope</td>
            <td width="4%" valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td width="60%" valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${projectType} (${storeys})</td>
          </tr>
          <tr>
            <td valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Aesthetic Peg</td>
            <td valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${preferredStyle}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Target Site</td>
            <td valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${location}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Budget Range</td>
            <td valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${budgetRange}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Consultation Venue</td>
            <td valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 700; color: #111827; padding: 4px 0;">${consultationDisplay}</td>
          </tr>
          <tr>
            <td valign="top" style="color: #57534e; font-size: 12px; padding: 4px 0;">Target Schedule</td>
            <td valign="top" style="color: #78716c; padding: 4px 0;">:</td>
            <td valign="top" style="font-weight: 600; color: #111827; padding: 4px 0;">${meetingDate} • ${meetingTime}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center">
            <a href="${websiteUrl}/portal" target="_blank" style="display: inline-block; background-color: #c27803; color: #ffffff; font-family: monospace; font-size: 11.5px; font-weight: bold; text-decoration: none; padding: 13px 30px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em; box-shadow: 0 2px 6px rgba(194, 120, 3, 0.25);">
              VIEW STATUS IN CLIENT PORTAL →
            </a>
          </td>
        </tr>
      </table>

      <!-- Note -->
      <p style="margin: 0 0 28px 0; font-size: 12px; color: #57534e; line-height: 1.6; text-align: left;">
        May tanong o nais i-update? Maaari kang direktang mag-reply sa email na ito o tumawag sa aming opisina.
      </p>

      <!-- Bottom Horizontal Divider -->
      <div style="height: 1px; background: #e7e5e0; margin-bottom: 20px;"></div>

      <!-- Footer Table (Company info & Contact Hotline) -->
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
  getInquiryReceiptTemplate,
};
