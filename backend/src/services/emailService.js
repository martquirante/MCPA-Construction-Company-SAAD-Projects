const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

class EmailService {
  constructor() {
    this.smtpEmail = process.env.SMTP_EMAIL || "";
    this.smtpPass = (process.env.SMTP_APP_PASSWORD || "").replace(/\s+/g, "");
    this.smtpHost = process.env.SMTP_HOST || "";
    this.smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    this.transporter = null;

    if (this.smtpEmail && this.smtpPass && !this.smtpEmail.includes("YOUR_")) {
      try {
        if (this.smtpHost) {
          // Custom SMTP Provider (Outlook, Yahoo, Brevo, SendGrid, etc.)
          this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: this.smtpPort === 465,
            auth: {
              user: this.smtpEmail,
              pass: this.smtpPass,
            },
          });
        } else {
          // Default Gmail Service
          this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: this.smtpEmail,
              pass: this.smtpPass,
            },
          });
        }
      } catch (err) {
        console.warn("[EmailService] Nodemailer init warning:", err.message);
      }
    }
  }

  /**
   * Sends 6-digit OTP email with minimalist architectural engineering UI/UX.
   * Fully responsive across Mobile, Tablet, Web, and Desktop PC.
   * Built-in native Dark Mode and Light Mode support with zero emojis.
   * @param {string} toEmail Recipient email
   * @param {string} otpCode 6-digit verification code
   * @param {string} purpose 'PASSWORD_RESET' | '2FA'
   */
  async sendOtpEmail(toEmail, otpCode, purpose = "PASSWORD_RESET") {
    const subject = "MCPA Administrative Portal — Verification Code";

    // Path to official MCPA logos
    // Adaptive logo has a crisp white outline halo so it renders clearly in BOTH Light Mode and forced Gmail Dark Mode
    const logoAdaptivePath = path.resolve(__dirname, "../../public/assets/mcpa-logo-adaptive.png");
    const logoDarkPath = path.resolve(__dirname, "../../public/assets/mcpa-logo.png");
    const logoWhitePath = path.resolve(__dirname, "../../public/assets/mcpa-logo-white.png");

    const activeDarkLogoPath = fs.existsSync(logoAdaptivePath) ? logoAdaptivePath : logoDarkPath;
    const hasDarkLogo = fs.existsSync(activeDarkLogoPath);
    const hasWhiteLogo = fs.existsSync(logoWhitePath);

    // Clean raw code: strictly single line, no breakable spaces
    const cleanOtp = (otpCode || "").toString().trim();

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>MCPA Administrative Portal — Verification Code</title>
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
      .security-box { background-color: #0d1524 !important; border-color: #1e293b !important; border-left-color: #38bdf8 !important; }
      .security-title { color: #94a3b8 !important; }
      .security-text { color: #94a3b8 !important; }
      .divider-line { border-top-color: #1e293b !important; }
      .text-footer { color: #475569 !important; }
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
    [data-ogsc] .security-box { background-color: #0d1524 !important; border-left-color: #38bdf8 !important; }
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
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="margin-bottom: 28px;">
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

              <!-- Headline -->
              <h1 class="h1-title text-title" style="margin: 0 0 16px 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; line-height: 1.2;">
                Verification Code
              </h1>

              <!-- Intro Paragraph -->
              <p class="body-text text-sub" style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                A request was received to access your MCPA Administrative Portal account. Enter the authorization code below to complete verification.
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
                  <td class="security-box" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #475569; border-radius: 6px; padding: 14px 16px;">
                    <div class="security-title" style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #475569; text-transform: uppercase; margin-bottom: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      SECURITY NOTICE
                    </div>
                    <div class="security-text" style="font-size: 12px; color: #475569; line-height: 1.55;">
                      This code is for your personal use only. Do not share it with anyone, including MCPA staff. If you did not request this code, please ignore this email and contact our support team immediately.
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
</html>
    `;

    // Attempt real SMTP if configured
    if (this.transporter) {
      try {
        const attachments = [];
        if (hasDarkLogo) {
          attachments.push({
            filename: "mcpa-logo.png",
            path: activeDarkLogoPath,
            cid: "mcpalogodark",
          });
        }
        if (hasWhiteLogo) {
          attachments.push({
            filename: "mcpa-logo-white.png",
            path: logoWhitePath,
            cid: "mcpalogowhite",
          });
        }

        const mailOptions = {
          from: `"MCPA Construction & Supply" <${this.smtpEmail}>`,
          to: toEmail,
          subject,
          html: htmlContent,
          attachments,
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`\x1b[32m[EmailService] Responsive OTP email delivered to ${toEmail}\x1b[0m`);
        return true;
      } catch (err) {
        console.warn(`\x1b[33m[EmailService] SMTP delivery failed (${err.message}). Logging code locally...\x1b[0m`);
      }
    }

    // High-visibility local terminal logger (Dev Mode)
    console.log("\n" + "=".repeat(60));
    console.log("  MCPA DEV MODE — SECURITY OTP DISPATCHED");
    console.log(`  To:      ${toEmail}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Code:    ${otpCode}`);
    console.log(`  Expires: In 120 Seconds (2 Minutes)`);
    console.log("=".repeat(60) + "\n");

    return true;
  }
}

module.exports = new EmailService();
