/**
 * MCPA Construction & Supply - OTP & Password Reset Email Template
 * Responsive, dark/light adaptive OTP email UI with Supabase CDN hosted assets (Zero CID file attachments)
 * Pure typographic layout: No background boxes, rectangles, or ovals around the OTP code or security notice.
 */
function getOtpVerificationTemplate({
  otpCode = "",
  portalType = "client",
  subject = "MCPA Verification Code",
}) {
  const isClient = portalType === "client";

  const portalEyebrow = isClient
    ? "CLIENT PORTAL &bull; ACCOUNT VERIFICATION"
    : "ADMINISTRATIVE CONSOLE &bull; ACCESS VERIFICATION";

  const introText = isClient
    ? "A request was received to verify your <strong>MCPA Client Portal</strong> account. Enter the authorization code below to complete verification and reset your password."
    : "A request was received to access your MCPA Administrative Portal account. Enter the authorization code below to complete verification.";

  const securityNotice = isClient
    ? "This code is for your personal use only. Do not share it with anyone, including MCPA project engineers or staff. If you did not initiate this request, your account password will remain unchanged and you can safely disregard this email."
    : "This code is for your personal use only. Do not share it with anyone, including MCPA staff. If you did not request this code, please ignore this email and contact our support team immediately.";

  const cleanOtp = (otpCode || "").toString().trim();

  // Supabase High-Availability Public CDN Assets (Zero attachments, instant delivery)
  const logoLightUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png";
  const logoDarkUrl = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_white_v1.png";

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

    .logo-light { display: block !important; }
    .logo-dark { display: none !important; }

    /* Responsive adjustments for Mobile */
    @media only screen and (max-width: 540px) {
      .email-wrapper-cell { padding: 14px 8px !important; }
      .card-body-cell { padding: 24px 18px !important; }
      .logo-img { max-width: 140px !important; }
      .h1-title { font-size: 22px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 7px !important; padding-left: 7px !important; }
      .body-text { font-size: 13.5px !important; line-height: 1.55 !important; }
    }

    /* Dark Mode Adaptive CSS for modern mail clients */
    @media (prefers-color-scheme: dark) {
      body, .email-bg-table, .email-wrapper-cell { background-color: #080c14 !important; }
      .email-card, .card-body-cell { background-color: #0e1420 !important; border-color: #1e293b !important; }
      .text-title { color: #f8fafc !important; }
      .text-sub { color: #94a3b8 !important; }
      .text-meta { color: #64748b !important; }
      .otp-code { color: #ffffff !important; }
      .security-title { color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; }
      .security-text { color: #94a3b8 !important; }
      .divider-line { border-top-color: #1e293b !important; }
      .text-footer { color: #475569 !important; }
      .portal-badge { background-color: transparent !important; color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; border: none !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; margin: 0 auto !important; }
    }

    /* Outlook Web dark mode support */
    [data-ogsc] .email-bg-table, [data-ogsc] .email-wrapper-cell { background-color: #080c14 !important; }
    [data-ogsc] .email-card, [data-ogsc] .card-body-cell { background-color: #0e1420 !important; border-color: #1e293b !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-sub { color: #94a3b8 !important; }
    [data-ogsc] .otp-code { color: #ffffff !important; }
    [data-ogsc] .security-title { color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; }
    [data-ogsc] .security-text { color: #94a3b8 !important; }
    [data-ogsc] .portal-badge { background-color: transparent !important; color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; }
    [data-ogsc] .logo-light { display: none !important; }
    [data-ogsc] .logo-dark { display: block !important; }
  </style>
</head>
<body bgcolor="#f1f5f9" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Full-Width Centering Outer Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" class="email-bg-table" style="table-layout: fixed; width: 100% !important; min-width: 100%; background-color: #f1f5f9; margin: 0; padding: 0;">
    <tr>
      <td align="center" valign="top" bgcolor="#f1f5f9" class="email-wrapper-cell" style="padding: 36px 12px; background-color: #f1f5f9;">

        <!-- Center Card -->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 520px; width: 100%; margin-left: auto !important; margin-right: auto !important; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden;" bgcolor="#ffffff">
          <tr>
            <td align="left" class="card-body-cell" style="padding: 36px 30px; background-color: #ffffff;" bgcolor="#ffffff">

              <!-- Header: MCPA Logo (Centered) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <img src="${logoLightUrl}" alt="MCPA Construction & Supply" width="160" class="logo-img logo-light" style="max-width: 160px; width: 100%; height: auto; display: block; margin: 0 auto;" />
                    <img src="${logoDarkUrl}" alt="MCPA Construction & Supply" width="160" class="logo-img logo-dark" style="max-width: 160px; width: 100%; height: auto; display: none; margin: 0 auto;" />
                  </td>
                </tr>
              </table>

              <!-- Portal Eyebrow Tag (Pure Typography, No Pill/Oval Background) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <span class="portal-badge" style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: ${isClient ? "#b45309" : "#475569"}; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      ${portalEyebrow}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 class="h1-title text-title" style="margin: 0 0 14px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; line-height: 1.2; text-align: center;">
                Verification Code
              </h1>

              <!-- Intro Paragraph -->
              <p class="body-text text-sub" style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">
                ${introText}
              </p>

              <!-- Verification Code (Pure Typographic Text, NO Background Box, NO Rectangle, NO Oval) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin: 20px auto 10px auto;">
                <tr>
                  <td align="center" style="text-align: center; padding: 6px 0; background-color: transparent;">
                    <span class="otp-code text-title" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #0f172a; line-height: 1.1; text-align: center; white-space: nowrap !important; word-break: keep-all !important; display: inline-block; padding-left: 12px;">
                      ${cleanOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Micro Caption -->
              <div align="center" class="text-meta" style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Valid for 120 seconds. Never share this code.
              </div>

              <!-- Security Notice (Pure Text, NO Container Box / Rectangle) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-top: 10px;">
                <tr>
                  <td align="center" style="text-align: center; padding: 0; background-color: transparent;">
                    <div class="security-title" style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: ${isClient ? "#b45309" : "#64748b"}; text-transform: uppercase; margin-bottom: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      SECURITY NOTICE
                    </div>
                    <div class="security-text" style="font-size: 12.5px; color: #64748b; line-height: 1.6; max-width: 440px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${securityNotice}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Hairline Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 20px;">
                <tr>
                  <td class="divider-line" style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Minimalist Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" class="text-footer" style="font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 0.08em; line-height: 1.6; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    MCPA CONSTRUCTION AND SUPPLY &middot; PLARIDEL, BULACAN, PHILIPPINES<br />
                    OFFICIAL EMAIL: CONTACT@MCPACONSTRUCTION.COM
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

module.exports = { getOtpVerificationTemplate };
