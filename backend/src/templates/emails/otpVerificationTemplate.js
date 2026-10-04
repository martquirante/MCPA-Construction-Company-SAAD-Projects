/**
 * MCPA Construction & Supply - OTP & Password Reset Email Template
 * 100% exact copy of the responsive, dark/light adaptive OTP email UI
 */
function getOtpVerificationTemplate({
  otpCode = "",
  portalType = "client",
  hasDarkLogo = false,
  hasWhiteLogo = false,
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

    /* Responsive adjustments for Mobile */
    @media only screen and (max-width: 540px) {
      .email-wrapper-cell { padding: 16px 8px !important; }
      .card-body-cell { padding: 26px 18px !important; }
      .logo-img { max-width: 140px !important; }
      .h1-title { font-size: 23px !important; }
      .otp-code { font-size: 24px !important; letter-spacing: 6px !important; padding-left: 6px !important; }
      .otp-box { padding: 14px 10px !important; }
      .body-text { font-size: 13.5px !important; line-height: 1.55 !important; }
      .security-box { padding: 12px 14px !important; }
    }

    /* Dark Mode Adaptive CSS for modern mail clients (Apple Mail, iOS, Outlook Mac) */
    @media (prefers-color-scheme: dark) {
      body, .email-bg-table, .email-wrapper-cell { background-color: #080c14 !important; }
      .email-card, .card-body-cell { background-color: #0e1420 !important; border-color: #1e293b !important; }
      .text-title { color: #f8fafc !important; }
      .text-sub { color: #94a3b8 !important; }
      .text-meta { color: #64748b !important; }
      .otp-box { background-color: #090e17 !important; border-color: #1e293b !important; }
      .otp-code { color: #ffffff !important; }
      .security-box { background-color: #0d1524 !important; border-color: #1e293b !important; border-left-color: ${isClient ? "#f59e0b" : "#38bdf8"} !important; }
      .security-title { color: #94a3b8 !important; }
      .security-text { color: #94a3b8 !important; }
      .divider-line { border-top-color: #1e293b !important; }
      .text-footer { color: #475569 !important; }
      .portal-badge { background-color: ${isClient ? "rgba(245, 158, 11, 0.15)" : "#1e293b"} !important; color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; border-color: ${isClient ? "rgba(245, 158, 11, 0.3)" : "#334155"} !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; margin: 0 auto !important; }
    }

    /* Outlook Web dark mode support */
    [data-ogsc] .email-bg-table, [data-ogsc] .email-wrapper-cell { background-color: #080c14 !important; }
    [data-ogsc] .email-card, [data-ogsc] .card-body-cell { background-color: #0e1420 !important; border-color: #1e293b !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-sub { color: #94a3b8 !important; }
    [data-ogsc] .otp-box { background-color: #090e17 !important; border-color: #1e293b !important; }
    [data-ogsc] .otp-code { color: #ffffff !important; }
    [data-ogsc] .security-box { background-color: #0d1524 !important; border-left-color: ${isClient ? "#f59e0b" : "#38bdf8"} !important; }
    [data-ogsc] .portal-badge { background-color: ${isClient ? "rgba(245, 158, 11, 0.15)" : "#1e293b"} !important; color: ${isClient ? "#fbbf24" : "#94a3b8"} !important; }
  </style>
</head>
<body bgcolor="#f1f5f9" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Full-Width Centering Outer Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" class="email-bg-table" style="table-layout: fixed; width: 100% !important; min-width: 100%; background-color: #f1f5f9; margin: 0; padding: 0;">
    <tr>
      <td align="center" valign="top" bgcolor="#f1f5f9" class="email-wrapper-cell" style="padding: 40px 16px; background-color: #f1f5f9;">

        <!-- Center Card (Strictly centered on Web, PC, and Mobile) -->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 520px; width: 100%; margin-left: auto !important; margin-right: auto !important; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden;" bgcolor="#ffffff">
          <tr>
            <td align="left" class="card-body-cell" style="padding: 38px 34px; background-color: #ffffff;" bgcolor="#ffffff">

              <!-- Header: MCPA Logo (Centered) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    ${
                      hasDarkLogo
                        ? `<img src="cid:mcpalogodark" alt="MCPA Construction and Supply" width="170" class="logo-img logo-light" style="max-width: 170px; width: 100%; height: auto; display: block; margin: 0 auto;" />`
                        : `<h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #0f172a; text-align: center;">MCPA</h2>`
                    }
                    ${
                      hasWhiteLogo
                        ? `<img src="cid:mcpalogowhite" alt="MCPA Construction and Supply" width="170" class="logo-img logo-dark" style="max-width: 170px; width: 100%; height: auto; display: none; margin: 0 auto;" />`
                        : ""
                    }
                  </td>
                </tr>
              </table>

              <!-- Portal Eyebrow Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <span class="portal-badge" style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: ${isClient ? "#b45309" : "#475569"}; background-color: ${isClient ? "#fef3c7" : "#f1f5f9"}; border: 1px solid ${isClient ? "#fde68a" : "#e2e8f0"}; border-radius: 4px; padding: 4px 10px; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      ${portalEyebrow}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 class="h1-title text-title" style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; line-height: 1.2; text-align: center;">
                Verification Code
              </h1>

              <!-- Intro Paragraph -->
              <p class="body-text text-sub" style="margin: 0 0 22px 0; font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">
                ${introText}
              </p>

              <!-- Verification Code Box (Unbreakable single line on all mobile screens) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin: 20px auto 22px auto;">
                <tr>
                  <td align="center" class="otp-box" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 12px; text-align: center;">
                    <span class="otp-code" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #0f172a; line-height: 1.2; text-align: center; white-space: nowrap !important; word-break: keep-all !important; display: inline-block; padding-left: 8px;">
                      ${cleanOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Micro Caption -->
              <div align="center" class="text-meta" style="font-size: 11.5px; color: #64748b; margin-top: -10px; margin-bottom: 24px; text-align: center;">
                Valid for 120 seconds. Never share this code.
              </div>

              <!-- Security Notice Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="security-box" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid ${isClient ? "#f59e0b" : "#475569"}; border-radius: 6px; padding: 14px 16px;">
                    <div class="security-title" style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: ${isClient ? "#b45309" : "#475569"}; text-transform: uppercase; margin-bottom: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      SECURITY NOTICE
                    </div>
                    <div class="security-text" style="font-size: 12px; color: #475569; line-height: 1.55;">
                      ${securityNotice}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Hairline Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; margin-bottom: 20px;">
                <tr>
                  <td class="divider-line" style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Minimalist Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" class="text-footer" style="font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 0.08em; line-height: 1.6; text-transform: uppercase;">
                    MCPA CONSTRUCTION AND SUPPLY &middot; PLARIDEL, BULACAN, PHILIPPINES<br />
                    LICENSED ARCHITECTURAL &amp; ENGINEERING SERVICES
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
