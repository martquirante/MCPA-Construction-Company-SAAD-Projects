/**
 * MCPA Construction & Supply - Email Change Verification Action Link Template
 * 
 * High-tier architectural aesthetic matching the official MCPA brand guidelines:
 * - Centered MCPA brand mark with delicate hairline divider (hosted Supabase CDN)
 * - Warm construction amber eyebrow: "CLIENT PORTAL • EMAIL CHANGE AUTHENTICATION"
 * - Bold editorial headline: "Confirm Your New Email Address"
 * - High-impact rounded amber CTA button with crisp vector mail icon
 * - Expiration notice (15 minutes) and security disclaimer
 * - Fully responsive across PC, Tablet, and Mobile email clients
 * - Adaptive Dark & Light mode support
 */
function getEmailChangeVerificationTemplate({
  verificationUrl = "",
  recipientName = "Valued Client",
  oldEmail = "",
  newEmail = "",
  subject = "Confirm Your New Email Address — MCPA Client Portal",
  logoLightUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png",
  logoDarkUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png",
  mailIconUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/icons/mail_white.png",
}) {
  const cleanUrl = verificationUrl.trim();
  const cleanOldEmail = (oldEmail || "").trim();
  const cleanNewEmail = (newEmail || "").trim();

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

    /* Button hover animation */
    .cta-btn:hover {
      background-color: #b45309 !important;
    }

    /* Native Dark Mode Adaptive Styling */
    @media (prefers-color-scheme: dark) {
      body, .email-canvas { background-color: #0b0f19 !important; }
      .card-table { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.1) !important; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5) !important; }
      .h1-title { color: #ffffff !important; }
      .body-text { color: #cbd5e1 !important; }
      .hairline-divider { border-color: rgba(255, 255, 255, 0.08) !important; }
      .footer-text { color: #94a3b8 !important; }
      .footer-sub { color: #64748b !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; margin: 0 auto !important; }
      .email-badge { background-color: rgba(255, 255, 255, 0.06) !important; border-color: rgba(255, 255, 255, 0.12) !important; color: #f1f5f9 !important; }
    }

    /* Outlook / Webmail Dark Mode overrides */
    [data-ogsc] body, [data-ogsc] .email-canvas { background-color: #0b0f19 !important; }
    [data-ogsc] .card-table { background-color: #121724 !important; border-color: rgba(255, 255, 255, 0.1) !important; }
    [data-ogsc] .h1-title { color: #ffffff !important; }
    [data-ogsc] .body-text { color: #cbd5e1 !important; }
    [data-ogsc] .hairline-divider { border-color: rgba(255, 255, 255, 0.08) !important; }
    [data-ogsc] .footer-text { color: #94a3b8 !important; }
    [data-ogsc] .footer-sub { color: #64748b !important; }
    [data-ogsc] .logo-light { display: none !important; }
    [data-ogsc] .logo-dark { display: block !important; margin: 0 auto !important; }

    /* Mobile Responsive Optimizations */
    @media only screen and (max-width: 580px) {
      .email-wrapper-cell { padding: 16px 10px !important; }
      .card-table { width: 100% !important; max-width: 100% !important; border-radius: 20px !important; }
      .card-body-cell { padding: 30px 18px !important; border-radius: 20px !important; }
      .logo-img { max-width: 145px !important; }
      .h1-title { font-size: 22px !important; line-height: 1.25 !important; }
      .body-text { font-size: 13.5px !important; line-height: 1.55 !important; margin-bottom: 24px !important; }
      .cta-table { width: 100% !important; margin-bottom: 26px !important; }
      .cta-td { width: 100% !important; display: block !important; }
      .cta-btn { display: block !important; width: 100% !important; padding: 14px 16px !important; font-size: 14px !important; box-sizing: border-box !important; text-align: center !important; }
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
            <td class="card-body-cell" align="center" style="padding: 40px 32px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0;">
              
              <!-- 1. Header: MCPA Logo (Hosted CDN, Adaptive Light/Dark) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <img src="${logoLightUrl}" alt="MCPA Construction & Supply" class="logo-light logo-img" width="160" style="max-width: 160px; width: 100%; height: auto; display: block; margin: 0 auto;" border="0" />
                    <!--[if !mso]><!-->
                    <img src="${logoDarkUrl}" alt="MCPA Construction & Supply" class="logo-dark logo-img" width="160" style="max-width: 160px; width: 100%; height: auto; display: none; margin: 0 auto;" border="0" />
                    <!--<![endif]-->
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div class="hairline-divider" style="border-top: 1px solid #e2e8f0; width: 100%;"></div>
                  </td>
                </tr>
              </table>

              <!-- 2. Eyebrow Tag -->
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.6px; color: #d97706; text-transform: uppercase;">
                CLIENT PORTAL &bull; EMAIL CHANGE AUTHENTICATION
              </p>

              <!-- 3. Headline -->
              <h1 class="h1-title" style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; line-height: 1.25;">
                Confirm Your New Email Address
              </h1>

              <!-- 4. Body Description -->
              <p class="body-text" style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14.5px; line-height: 1.6; color: #475569; max-width: 440px;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p class="body-text" style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14.5px; line-height: 1.6; color: #475569; max-width: 440px;">
                We received a request to update the primary contact email for your <strong>MCPA Client Portal</strong> account from <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: #64748b;">${cleanOldEmail}</span> to:
              </p>

              <!-- Target Email Badge -->
              <div class="email-badge" style="margin: 0 auto 28px auto; padding: 12px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: inline-block; max-width: 100%;">
                <span style="font-family: monospace; font-size: 14.5px; font-weight: 700; color: #0f172a;">${cleanNewEmail}</span>
              </div>

              <!-- 5. Primary CTA Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="cta-table" style="margin: 0 auto 30px auto;">
                <tr>
                  <td align="center" class="cta-td" style="border-radius: 50px; background-color: #d97706;">
                    <a href="${cleanUrl}" target="_blank" class="cta-btn" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14.5px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 50px; background-color: #d97706; border: 1px solid #b45309; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35); text-align: center; mso-padding-alt: 0;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="display: inline-table; vertical-align: middle; margin: 0 auto;">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 9px; line-height: 1;">
                            <img src="${mailIconUrl}" width="16" height="16" alt="" style="display: block; width: 16px; height: 16px; border: 0;" border="0" />
                          </td>
                          <td style="vertical-align: middle; line-height: 1;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14.5px; font-weight: 700; color: #ffffff; letter-spacing: 0.2px; white-space: nowrap;">Confirm New Email Address</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 6. Clean Hairline Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 6px 0 24px 0;">
                <tr>
                  <td class="hairline-divider" style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- 7. Security Expiration Notice & Disclaimer Footer -->
              <p class="footer-text" style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5;">
                This security link expires in <strong>15 minutes</strong>.
              </p>
              <p class="footer-sub" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you did not request this change, please disregard this email or notify MCPA Support immediately to protect your account.
              </p>

            </td>
          </tr>
        </table>

        <!-- Micro Footer Copyright -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 16px;">
          <tr>
            <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} MCPA Construction &amp; Supply. All rights reserved.
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
  getEmailChangeVerificationTemplate,
};
