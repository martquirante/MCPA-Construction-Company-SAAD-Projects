/**
 * MCPA Construction & Supply — Email Template & HTML Renderer
 * 
 * Compiles visual block JSON trees into email-client-compatible HTML (Outlook, Apple Mail, Gmail)
 * using table-based structures, inline styles, responsive viewport meta tags,
 * and high-contrast styling aligned with MCPA brand colors.
 */

function renderLogoBlock(logoConfig) {
  if (!logoConfig) return "";
  const pos = logoConfig.position || "top-center";
  const align = pos === "top-left" ? "left" : pos === "top-right" ? "right" : "center";
  const width = logoConfig.width || 180;
  const padding = logoConfig.padding || 20;
  const link = logoConfig.link || "https://mcpaconstruction.com";
  let src = logoConfig.src || "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png";
  if (src.includes("https://mcpaconstruction.com/images/mcpa-logo-dark.png") || src === "/images/mcpa-logo-dark.png") {
    src = "https://dzqqyqothtttccplvvnb.supabase.co/storage/v1/object/public/portfolio/email/email_logo_adaptive_v2.png";
  }

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${padding}px;">
      <tr>
        <td align="${align}">
          <a href="${link}" target="_blank" style="text-decoration:none;">
            <img src="${src}" alt="MCPA Construction & Supply" width="${width}" style="display:block; max-width:${width}px; height:auto; border:0; outline:none;" />
          </a>
        </td>
      </tr>
    </table>
  `;
}

function renderBlock(block) {
  const { type, data = {} } = block;

  switch (type) {
    case "logo":
      return renderLogoBlock(data);

    case "heading": {
      const align = data.align || "left";
      const color = data.color || "#0f172a";
      const fontSize = data.level === "h1" ? "28px" : data.level === "h3" ? "20px" : "24px";
      const text = data.text || "";
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
          <tr>
            <td align="${align}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: ${fontSize}; font-weight: 800; color: ${color}; line-height: 1.25; letter-spacing: -0.02em;">
              ${text}
            </td>
          </tr>
        </table>
      `;
    }

    case "subheading": {
      const align = data.align || "left";
      const color = data.color || "#d97706";
      const text = data.text || "";
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
          <tr>
            <td align="${align}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${color}; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em;">
              ${text}
            </td>
          </tr>
        </table>
      `;
    }

    case "paragraph": {
      const align = data.align || "left";
      const color = data.color || "#334155";
      const text = (data.text || "").replace(/\n/g, "<br/>");
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
          <tr>
            <td align="${align}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: ${color}; line-height: 1.6;">
              ${text}
            </td>
          </tr>
        </table>
      `;
    }

    case "image": {
      const src = data.src || "";
      const alt = data.alt || "MCPA Construction Project";
      const caption = data.caption || "";
      const align = data.align || "center";
      const link = data.link || "";

      let imgTag = `<img src="${src}" alt="${alt}" style="display:block; width:100%; max-width:600px; height:auto; border-radius:8px; border:0;" />`;
      if (link) {
        imgTag = `<a href="${link}" target="_blank" style="text-decoration:none;">${imgTag}</a>`;
      }

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
          <tr>
            <td align="${align}">
              ${imgTag}
              ${caption ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; margin-top: 6px; text-align: ${align}; font-style: italic;">${caption}</div>` : ""}
            </td>
          </tr>
        </table>
      `;
    }

    case "gallery": {
      const images = Array.isArray(data.images) ? data.images : [];
      if (!images.length) return "";

      const cols = images.map((img) => `
        <td width="${Math.floor(100 / Math.min(images.length, 3))}%" valign="top" style="padding: 4px;">
          <img src="${img.src}" alt="${img.caption || 'Project Image'}" style="width:100%; height:auto; border-radius:6px; display:block;" />
          ${img.caption ? `<div style="font-size:11px; color:#64748b; font-family:sans-serif; margin-top:4px; text-align:center;">${img.caption}</div>` : ""}
        </td>
      `).join("");

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
          <tr>${cols}</tr>
        </table>
      `;
    }

    case "video": {
      const thumbnail = data.thumbnail || "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80";
      const videoUrl = data.url || "https://mcpaconstruction.com";
      const title = data.title || "Watch Construction Overview";

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${videoUrl}" target="_blank" style="display:inline-block; position:relative; text-decoration:none;">
                <img src="${thumbnail}" alt="${title}" style="display:block; width:100%; max-width:600px; height:auto; border-radius:8px; border:0;" />
                <div style="font-family: sans-serif; font-size:14px; font-weight:700; color:#d97706; margin-top:8px; text-align:center;">
                  ▶ ${title}
                </div>
              </a>
            </td>
          </tr>
        </table>
      `;
    }

    case "button": {
      const align = data.align || "center";
      const text = data.text || "Learn More";
      const url = data.url || "https://mcpaconstruction.com";
      const bgColor = data.bgColor || "#d97706";
      const textColor = data.textColor || "#ffffff";
      const radius = data.borderRadius || 8;

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
          <tr>
            <td align="${align}">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="${bgColor}" style="border-radius: ${radius}px;">
                    <a href="${url}" target="_blank" style="display:inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: ${textColor}; text-decoration: none; border-radius: ${radius}px; letter-spacing: 0.02em;">
                      ${text}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }

    case "divider": {
      const color = data.color || "#e2e8f0";
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 14px; margin-bottom: 20px;">
          <tr>
            <td style="border-top: 1px solid ${color}; line-height: 1px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
      `;
    }

    case "spacer": {
      const height = data.height || 24;
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td height="${height}" style="font-size:${height}px; line-height:${height}px;">&nbsp;</td>
          </tr>
        </table>
      `;
    }

    case "social": {
      const icons = [
        { name: "Facebook", url: data.facebook || "https://facebook.com/mcpaconstruction", icon: "https://cdn-icons-png.flaticon.com/512/733/733547.png" },
        { name: "Instagram", url: data.instagram || "https://instagram.com/mcpaconstruction", icon: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png" },
        { name: "TikTok", url: data.tiktok || "https://tiktok.com/@mcpaconstruction", icon: "https://cdn-icons-png.flaticon.com/512/3046/3046121.png" },
      ];

      const cols = icons.map((ic) => `
        <td style="padding: 0 8px;">
          <a href="${ic.url}" target="_blank" style="text-decoration:none;">
            <img src="${ic.icon}" alt="${ic.name}" width="28" height="28" style="display:block; border:0;" />
          </a>
        </td>
      `).join("");

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin-top: 16px; margin-bottom: 16px;">
          <tr>${cols}</tr>
        </table>
      `;
    }

    case "contact": {
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; padding: 16px;">
          <tr>
            <td style="font-family: sans-serif; font-size: 13px; color: #475569; line-height: 1.6;">
              <strong style="color: #0f172a; font-size: 14px;">${data.name || "MCPA Construction & Supply"}</strong><br/>
              📍 ${data.address || "Plaridel, Bulacan, Philippines"}<br/>
              📞 ${data.phone || "+63 917 123 4567"}<br/>
              ✉️ <a href="mailto:${data.email || 'contact@mcpaconstruction.com'}" style="color: #d97706; text-decoration: none;">${data.email || "contact@mcpaconstruction.com"}</a>
            </td>
          </tr>
        </table>
      `;
    }

    case "footer": {
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <tr>
            <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <strong>${data.company || "MCPA Construction & Supply"}</strong><br/>
              ${data.address || "Bulacan, Philippines"} &bull; Licensed General Contractor & Supplies<br/>
              <span style="display:block; margin-top: 8px;">
                You received this email because you opted into project briefings or registered on our site.<br/>
                <a href="{{unsubscribe_url}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> &bull; 
                <a href="https://mcpaconstruction.com/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
              </span>
            </td>
          </tr>
        </table>
      `;
    }

    case "custom_html": {
      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
          <tr>
            <td>
              ${data.html || ""}
            </td>
          </tr>
        </table>
      `;
    }

    default:
      return "";
  }
}

/**
 * Compiles an entire email campaign into full responsive HTML
 */
function compileCampaignHtml(campaign, options = {}) {
  const {
    blocks = [],
    logo_config = null,
    preview_text = "",
    title = "",
    campaign_id = 0,
  } = campaign;

  const renderedBlocks = blocks.map(renderBlock).join("\n");
  const logoHtml = logo_config ? renderLogoBlock(logo_config) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title || "MCPA Construction Update"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; }
    @media screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 8px !important; }
      .email-content-td { padding: 24px 20px !important; }
      .email-outer-td { padding: 12px 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  ${preview_text ? `
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preview_text}
  </div>` : ""}
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 0;">
    <tr>
      <td align="center" class="email-outer-td" style="padding: 28px 12px; background-color: #f1f5f9;">
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);">
          <tr>
            <td class="email-content-td" style="padding: 36px 32px; background-color: #ffffff;">
              ${logoHtml}
              ${renderedBlocks}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Open Tracking Pixel -->
  {{tracking_pixel}}
</body>
</html>`;
}

/**
 * Extracts plain-text version from blocks
 */
function compileCampaignPlainText(campaign) {
  const { blocks = [], title = "" } = campaign;
  let text = `${title}\n\n`;

  for (const block of blocks) {
    const { type, data = {} } = block;
    if (type === "heading" || type === "subheading") {
      text += `${data.text}\n---\n`;
    } else if (type === "paragraph") {
      text += `${data.text}\n\n`;
    } else if (type === "button") {
      text += `[${data.text}]: ${data.url}\n\n`;
    } else if (type === "contact") {
      text += `Contact MCPA: ${data.phone || ""} | ${data.email || ""}\n\n`;
    }
  }

  text += `\nUnsubscribe: {{unsubscribe_url}}\n`;
  return text;
}

module.exports = {
  compileCampaignHtml,
  compileCampaignPlainText,
  renderBlock,
  renderLogoBlock
};
