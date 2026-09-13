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
   * Sends 6-digit OTP email with MCPA luxury engineering branding
   * Fully responsive across Mobile, Tablet, and Desktop.
   * Uses white-background logo and strictly zero emojis.
   * @param {string} toEmail Recipient email
   * @param {string} otpCode 6-digit verification code
   * @param {string} purpose 'PASSWORD_RESET' | '2FA'
   */
  async sendOtpEmail(toEmail, otpCode, purpose = "PASSWORD_RESET") {
    const subject = "MCPA Administrative Security — Password Reset Verification Code";

    // Path to official white-bg MCPA logo
    const logoWhitePath = path.resolve(__dirname, "../../public/assets/mcpa-logo-white-bg.png");
    const logoFallbackPath = path.resolve(__dirname, "../../public/assets/mcpa-logo.png");
    const activeLogoPath = fs.existsSync(logoWhitePath) ? logoWhitePath : logoFallbackPath;
    const hasLogo = fs.existsSync(activeLogoPath);

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>MCPA Administrative Security</title>
  <style type="text/css">
    /* Base resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Responsive Media Queries */
    @media only screen and (max-width: 540px) {
      .email-wrapper {
        padding: 12px 8px !important;
      }
      .email-card {
        padding: 24px 16px !important;
        border-radius: 14px !important;
      }
      .logo-img {
        max-width: 125px !important;
      }
      .h1-title {
        font-size: 20px !important;
        line-height: 1.3 !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 7px !important;
      }
      .otp-box {
        padding: 16px 12px !important;
        margin: 18px 0 !important;
      }
      .body-p {
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
      .security-box {
        padding: 12px 14px !important;
        font-size: 11.5px !important;
      }
    }

    @media only screen and (min-width: 541px) and (max-width: 768px) {
      /* Tablets */
      .email-wrapper {
        padding: 24px 16px !important;
      }
      .email-card {
        padding: 32px 24px !important;
      }
      .otp-code {
        font-size: 34px !important;
        letter-spacing: 10px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Outer Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9;">
    <tr>
      <td align="center" class="email-wrapper" style="padding: 36px 16px;">
        <!-- Card Table -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);" class="email-card">
          <tr>
            <td class="content-cell" style="padding: 36px 32px; background-color: #ffffff;">

              <!-- MCPA Company Logo (White Background) -->
              ${
                hasLogo
                  ? `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                       <tr>
                         <td align="center" style="background-color: #ffffff; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                           <img src="cid:mcpalogowhite" alt="MCPA Construction and Supply" width="140" class="logo-img" style="max-width: 140px; width: 100%; height: auto; display: block; margin: 0 auto; background-color: #ffffff;" />
                         </td>
                       </tr>
                     </table>`
                  : ""
              }

              <!-- Security Badge (Strictly No Emojis) -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ADMINISTRATIVE SECURITY PORTAL
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 class="h1-title" style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; line-height: 1.3;">
                Account Password Recovery
              </h1>

              <!-- Intro Paragraph -->
              <p class="body-p" style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                A request was received to reset the administrative password associated with your MCPA Portal account (<strong style="color: #0f172a;">${toEmail}</strong>).
              </p>

              <!-- Responsive OTP Code Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center" class="otp-box" style="background-color: #fefce8; border: 2px solid #f59e0b; border-radius: 12px; padding: 22px 16px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px;">
                      YOUR 6-DIGIT VERIFICATION CODE
                    </div>
                    <div class="otp-code" style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #92400e; margin: 6px 0; line-height: 1.1;">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #78716c; margin-top: 8px;">
                      Valid for <strong style="color: #44403c;">2 minutes (120 seconds)</strong> only. Do not share this key with anyone.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Verification Instruction -->
              <p class="body-p" style="margin: 0 0 22px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">
                Enter this 6-digit code in the admin recovery window to verify your identity and configure your new password.
              </p>

              <!-- Security Notice Box (Zero Emojis) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="security-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #d97706; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #475569; line-height: 1.5;">
                    <strong style="color: #0f172a;">SECURITY NOTICE:</strong> If you did not initiate this password reset request, your administrative credentials may be under unauthorized attempt. Please notify the MCPA Lead Engineer immediately.
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Responsive Email Footer -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #94a3b8; text-align: center; letter-spacing: 0.05em; line-height: 1.6; text-transform: uppercase;">
              MCPA Construction and Supply &middot; Plaridel, Bulacan, Philippines<br />
              Full-Service Architectural &amp; Engineering Solutions
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
        const mailOptions = {
          from: `"MCPA Security Portal" <${this.smtpEmail}>`,
          to: toEmail,
          subject,
          html: htmlContent,
          attachments: hasLogo
            ? [
                {
                  filename: "mcpa-logo-white-bg.png",
                  path: activeLogoPath,
                  cid: "mcpalogowhite",
                },
              ]
            : [],
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
