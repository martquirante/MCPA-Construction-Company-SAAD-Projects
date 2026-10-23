/**
 * MCPA Construction & Supply - Admin & Staff Invitation Email Template
 * 
 * Bespoke Architectural Editorial Aesthetic:
 * - Completely emoji-free (100% professional executive presentation)
 * - Pure typographic layout (zero fake button badges or boxed pill containers)
 * - The ONLY button is the primary action CTA
 * - Adaptive Dark & Light mode (prefers-color-scheme: dark and [data-ogsc])
 * - Centered MCPA brand mark from hosted Supabase CDN
 * - Single-sentence 48-hour expiration notice in clean muted text
 * - Fully responsive across mobile, tablet, and desktop email clients
 */
function getAdminInviteLinkTemplate({
  setupUrl = "",
  recipientName = "Colleague",
  recipientEmail = "",
  role = "admin",
  occupation = "",
  subject = "Welcome to MCPA: Set Up Your Account Password",
  logoLightUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png",
  logoDarkUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png",
}) {
  const cleanUrl = setupUrl.trim();
  const cleanEmail = (recipientEmail || "").trim();

  // Role display details (no emojis, purely editorial)
  const roleMeta = {
    admin: {
      title: "Administrator",
      subtitle: occupation || "Executive & Project Management",
    },
    architect: {
      title: "Project Architect",
      subtitle: occupation || "Lead Architectural Design & Planning",
    },
    engineer: {
      title: "Site Engineer",
      subtitle: occupation || "On-Site Construction Quality & Inspections",
    },
  };

  const meta = roleMeta[role.toLowerCase()] || roleMeta.admin;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${subject}</title>
  <style type="text/css">
    /* Base resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Button hover */
    .cta-btn:hover {
      background-color: #d97706 !important;
    }

    /* Native Dark Mode Adaptive Styling */
    @media (prefers-color-scheme: dark) {
      body, .email-canvas { background-color: #0b0f19 !important; }
      .card-table { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.08) !important; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6) !important; }
      .card-body-cell { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.08) !important; }
      .h1-title { color: #ffffff !important; }
      .body-text { color: #cbd5e1 !important; }
      .eyebrow-text { color: #fbbf24 !important; }
      .hairline-divider { border-color: rgba(255, 255, 255, 0.08) !important; }
      .hairline-inner { border-color: rgba(255, 255, 255, 0.05) !important; }
      .sub-muted { color: #94a3b8 !important; }
      .text-strong { color: #f8fafc !important; }
      .text-body { color: #cbd5e1 !important; }
      .expiry-text { color: #94a3b8 !important; }
      .footer-text { color: #64748b !important; }
      .footer-sub { color: #475569 !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; margin: 0 auto !important; }
    }

    /* Outlook / Webmail Dark Mode overrides */
    [data-ogsc] body, [data-ogsc] .email-canvas { background-color: #0b0f19 !important; }
    [data-ogsc] .card-table { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.08) !important; }
    [data-ogsc] .card-body-cell { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.08) !important; }
    [data-ogsc] .h1-title { color: #ffffff !important; }
    [data-ogsc] .body-text { color: #cbd5e1 !important; }
    [data-ogsc] .eyebrow-text { color: #fbbf24 !important; }
    [data-ogsc] .hairline-divider { border-color: rgba(255, 255, 255, 0.08) !important; }
    [data-ogsc] .hairline-inner { border-color: rgba(255, 255, 255, 0.05) !important; }
    [data-ogsc] .sub-muted { color: #94a3b8 !important; }
    [data-ogsc] .text-strong { color: #f8fafc !important; }
    [data-ogsc] .text-body { color: #cbd5e1 !important; }
    [data-ogsc] .expiry-text { color: #94a3b8 !important; }
    [data-ogsc] .footer-text { color: #64748b !important; }
    [data-ogsc] .footer-sub { color: #475569 !important; }
    [data-ogsc] .logo-light { display: none !important; }
    [data-ogsc] .logo-dark { display: block !important; margin: 0 auto !important; }

    /* Mobile Responsive Optimizations */
    @media only screen and (max-width: 580px) {
      .email-wrapper-cell { padding: 16px 10px !important; }
      .card-table { width: 100% !important; max-width: 100% !important; border-radius: 20px !important; }
      .card-body-cell { padding: 32px 20px !important; border-radius: 20px !important; }
      .logo-img { max-width: 145px !important; }
      .h1-title { font-size: 22px !important; line-height: 1.25 !important; }
      .body-text { font-size: 13.5px !important; line-height: 1.55 !important; }
      .cta-table { width: 100% !important; margin-bottom: 20px !important; }
      .cta-td { width: 100% !important; display: block !important; }
      .cta-btn { display: block !important; width: 100% !important; padding: 15px 16px !important; font-size: 14.5px !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body class="email-canvas" style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-canvas" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" class="email-wrapper-cell" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px;" class="card-table" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <tr>
            <td class="card-body-cell" align="center" style="padding: 44px 36px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0;">
              
              <!-- 1. Header: MCPA Logo (Hosted CDN, Adaptive Light/Dark) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <img src="${logoLightUrl}" alt="MCPA Construction & Supply" class="logo-light logo-img" width="160" style="max-width: 160px; width: 100%; height: auto; display: block; margin: 0 auto;" border="0" />
                    <!--[if !mso]><!-->
                    <img src="${logoDarkUrl}" alt="MCPA Construction & Supply" class="logo-dark logo-img" width="160" style="max-width: 160px; width: 100%; height: auto; display: none; margin: 0 auto;" border="0" />
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Hairline Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;" class="hairline-divider"></td>
                </tr>
              </table>

              <!-- 2. Eyebrow Tag (Pure Typography, No Box/Pill) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-top: 24px; padding-bottom: 8px;">
                    <span class="eyebrow-text" style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #d97706; display: inline-block;">
                      STAFF ONBOARDING CLEARANCE
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 3. Headline -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 class="h1-title" style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.3; color: #0f172a; letter-spacing: -0.025em;">
                      Welcome to the Team, ${recipientName}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- 4. Body Description -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <p class="body-text" style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569; max-width: 420px;">
                      You have been granted administrative clearance to the MCPA Construction & Supply Project Console. Please set up your credentials to activate your account.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- 5. Onboarding Clearance Details (Clean Editorial Typography, No Fake Button Badges, No Emojis) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 28px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;" class="hairline-divider">
                <tr>
                  <td style="padding: 12px 0 10px 0; font-size: 11.5px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 34%; text-align: left;" class="sub-muted">
                    Role
                  </td>
                  <td align="right" style="padding: 12px 0 10px 0; font-size: 13.5px; color: #0f172a; font-weight: 700;" class="text-strong">
                    ${meta.title}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #f1f5f9; font-size: 11.5px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left;" class="sub-muted hairline-inner">
                    Designation
                  </td>
                  <td align="right" style="padding: 10px 0; border-top: 1px solid #f1f5f9; font-size: 13px; color: #334155; font-weight: 500;" class="text-body hairline-inner">
                    ${meta.subtitle}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 12px 0; border-top: 1px solid #f1f5f9; font-size: 11.5px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left;" class="sub-muted hairline-inner">
                    Account
                  </td>
                  <td align="right" style="padding: 10px 0 12px 0; border-top: 1px solid #f1f5f9; font-size: 12.5px; font-family: 'SF Mono', Consolas, monospace; color: #0f172a; font-weight: 600;" class="text-strong hairline-inner">
                    ${cleanEmail}
                  </td>
                </tr>
              </table>

              <!-- 6. Primary CTA Button (THE ONLY BUTTON) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="cta-table" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" class="cta-td">
                    <a href="${cleanUrl}" target="_blank" class="cta-btn" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-size: 14.5px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35); text-align: center;">
                      Set Up Your Admin Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 7. Security Expiration Notice (Pure Muted Text, No Box, No Background, No Emojis) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p class="expiry-text" style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                      This activation link is strictly single-use and will expire in 48 hours.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- 9. Footer Notes -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 22px;">
          <tr>
            <td align="center" style="padding: 0 16px;">
              <p class="footer-text" style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.5; color: #64748b;">
                This administrative notification was sent to <strong>${cleanEmail}</strong> by MCPA Construction and Supply.
              </p>
              <p class="footer-sub" style="margin: 0; font-size: 10.5px; line-height: 1.5; color: #94a3b8;">
                If you were not expecting an administrative invitation from MCPA, please disregard this email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  getAdminInviteLinkTemplate,
};
