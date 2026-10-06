/**
 * MCPA Construction & Supply - Client Welcome Email Template
 * 
 * - Mobile User-Friendly UI: Spacious, fluid, zero-cramping layout (Hindi siksik sa mobile)
 * - Fluid Hybrid Columns: Stacks to 100% full-width cards on mobile, 3 columns on PC/Tablet
 * - High-resolution inline PNG icons (100% compatible with Gmail Android/iOS, Apple Mail, Outlook)
 * - Dual Light & Dark Theme adaptive design
 * - Prominent "INQUIRE NOW →" CTA directing straight to /book
 * - Official Website Tabs: Selected Projects (/projects), Design & Build Services (/services), 4-Step Process (/process)
 * - Authentic Plaridel, Bulacan headquarters, contact channels & social logos (FB, IG, TikTok)
 */
function getWelcomeEmailTemplate({
  clientName = "Valued Client",
  toEmail = "",
  websiteUrl = "https://mcpa-construction.vercel.app",
  currentYear = new Date().getFullYear(),
  companyPhone = "+63 949 775 8239",
  companyPhoneDisplay = "(0949) 775 8239",
  companyEmail = "mcpa.construction@gmail.com",
  companyAddress = "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines",
  companyMapsUrl = "https://maps.app.goo.gl/hPB6X66NdhViSvCp7",
  companyFacebook = "https://www.facebook.com/MCPA.ConstructionandSupply/",
  companyInstagram = "https://www.instagram.com/mcpa.constructionandsupply/",
  companyTikTok = "https://www.tiktok.com/@mcpa.construction",
  // Image Sources (CID for SMTP, data URI for Resend)
  logoDarkSrc = "cid:mcpalogodark",
  logoWhiteSrc = "cid:mcpalogowhite",
  logoSrc = "cid:mcpalogodark",
  heroImgSrc = "cid:mcpahero",
  projectsImgSrc = "cid:mcpacardprojects",
  servicesImgSrc = "cid:mcpacardservices",
  processImgSrc = "cid:mcpacardprocess",
  userIconSrc = "cid:mcpaiconuser",
  projectsIconSrc = "cid:mcpaiconprojects",
  servicesIconSrc = "cid:mcpaiconservices",
  processIconSrc = "cid:mcpaiconprocess",
  phoneIconSrc = "cid:mcpaiconphone",
  mailIconSrc = "cid:mcpaiconmail",
  locationIconSrc = "cid:mcpaiconlocation",
  fbIconSrc = "cid:mcpaiconfb",
  igIconSrc = "cid:mcpaiconig",
  tiktokIconSrc = "cid:mcpaicontiktok",
}) {
  const inquireUrl = `${websiteUrl}/book`;
  const projectsUrl = `${websiteUrl}/projects`;
  const servicesUrl = `${websiteUrl}/services`;
  const processUrl = `${websiteUrl}/process`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Welcome to MCPA Construction &amp; Supply</title>
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; }

    /* Light Theme (Default & Active in Light Mode) */
    .body-bg { background-color: #f1f5f9 !important; }
    .main-canvas { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
    .hero-card { background-color: #f8fafc !important; border-color: #e2e8f0 !important; }
    .hero-title { color: #0f172a !important; }
    .hero-desc { color: #475569 !important; }
    .acct-card { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
    .feature-card { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
    .text-title { color: #0f172a !important; }
    .text-body { color: #334155 !important; }
    .text-muted { color: #64748b !important; }
    .welcome-headline { color: #0f172a !important; }
    .logo-img { display: block !important; margin: 0 auto !important; }
    .logo-light { display: block !important; margin: 0 auto !important; }
    .logo-dark { display: none !important; }

    /* Dark Theme (Automatic for clients with dark theme preference) */
    @media (prefers-color-scheme: dark) {
      body, .body-bg { background-color: #080a0e !important; }
      .main-canvas { background-color: #0d1017 !important; border-color: rgba(255,255,255,0.08) !important; }
      .hero-card { background-color: #111520 !important; border-color: rgba(255,255,255,0.08) !important; }
      .hero-title { color: #ffffff !important; }
      .hero-desc { color: #94a3b8 !important; }
      .acct-card { background-color: #131722 !important; border-color: rgba(255,255,255,0.08) !important; }
      .feature-card { background-color: #131722 !important; border-color: rgba(255,255,255,0.08) !important; }
      .text-title { color: #f8fafc !important; }
      .text-body { color: #cbd5e1 !important; }
      .text-muted { color: #94a3b8 !important; }
      .border-line { border-color: rgba(255,255,255,0.08) !important; }
      .welcome-headline { color: #ffffff !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; margin: 0 auto !important; }
    }

    /* Outlook Web dark mode support */
    [data-ogsc] .body-bg { background-color: #080a0e !important; }
    [data-ogsc] .main-canvas { background-color: #0d1017 !important; }
    [data-ogsc] .hero-card { background-color: #111520 !important; }
    [data-ogsc] .hero-title { color: #ffffff !important; }
    [data-ogsc] .hero-desc { color: #94a3b8 !important; }
    [data-ogsc] .feature-card { background-color: #131722 !important; }
    [data-ogsc] .text-title { color: #f8fafc !important; }
    [data-ogsc] .text-muted { color: #94a3b8 !important; }
    [data-ogsc] .welcome-headline { color: #ffffff !important; }
    [data-ogsc] .logo-light { display: none !important; }
    [data-ogsc] .logo-dark { display: block !important; margin: 0 auto !important; }

    /* Mobile Responsive Optimizations (Spacious, Comfortable, Un-squeezed) */
    @media only screen and (max-width: 680px) {
      .responsive-table { width: 100% !important; min-width: 100% !important; }
      .canvas-padding { padding: 24px 14px !important; }
      
      /* Make 3 cards stack 100% wide so they NEVER squeeze */
      .card-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 0 20px 0 !important;
        box-sizing: border-box !important;
      }
      .card-img {
        height: 180px !important;
        width: 100% !important;
      }
      
      /* Hero Stacking on Mobile */
      .hero-stack {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .hero-text-cell {
        padding: 26px 20px 16px 20px !important;
        text-align: left !important;
      }
      .hero-img-cell {
        padding: 0 20px 22px 20px !important;
      }
      .hero-img-mobile {
        height: 190px !important;
        width: 100% !important;
      }

      /* Account Confirmation Mobile */
      .acct-stack-col {
        display: block !important;
        width: 100% !important;
        margin-bottom: 12px !important;
      }

      /* Inquire Now Mobile Button */
      .btn-container {
        width: 100% !important;
      }
      .btn-link {
        display: block !important;
        width: 100% !important;
        padding: 16px 20px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }

      /* Footer Mobile */
      .footer-stack {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        margin-bottom: 20px !important;
      }
      .footer-social-wrap {
        text-align: left !important;
        margin-top: 14px !important;
      }
    }
  </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Outermost Table: Centering canvas across PC, Tablet, and Mobile -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" class="body-bg" style="background-color: #f1f5f9; table-layout: fixed; width: 100% !important; min-width: 100%; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 24px 8px;">

        <!-- Main Email Container (Spacious 820px Architectural Canvas fitting PC browser comfortably) -->
        <table width="820" border="0" cellspacing="0" cellpadding="0" class="responsive-table main-canvas" style="max-width: 820px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 38px 36px;" class="canvas-padding">

              <!-- 1. TOP HEADER: MCPA BRAND LOGO & SUBTITLE DASH -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${websiteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <!-- Light Mode Logo: Black logo displayed on light background -->
                      <img src="${logoDarkSrc || logoSrc}" alt="MCPA Construction &amp; Supply" width="185" class="logo-img logo-light" style="width: 185px; max-width: 185px; height: auto; display: block; margin: 0 auto; border: 0;" />
                      <!-- Dark Mode Logo: White logo displayed on dark background (hidden in light mode) -->
                      <!--[if !mso]><!-->
                      <img src="${logoWhiteSrc}" alt="MCPA Construction &amp; Supply" width="185" class="logo-img logo-dark" style="width: 185px; max-width: 185px; height: auto; display: none; margin: 0 auto; border: 0; mso-hide: all;" />
                      <!--<![endif]-->
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <div class="welcome-headline" style="font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.2;">
                      Welcome to <span style="color: #f59e0b;">MCPA Construction and Supply</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 2. HERO SPLIT CARD: Luxury Architectural Render & Vision Copy -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="hero-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <tr>
                  <!-- Left Text Column -->
                  <td width="53%" valign="middle" class="hero-stack hero-text-cell" style="padding: 38px 28px 38px 34px;">
                    <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: #d97706; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; margin-bottom: 12px;">
                      CLIENT ONBOARDING
                    </div>
                    <h1 class="hero-title text-title" style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; line-height: 1.25; color: #0f172a; letter-spacing: -0.025em;">
                      Your Vision.<br /><span style="color: #f59e0b;">Our Foundation.</span>
                    </h1>
                    <p class="hero-desc text-body" style="margin: 0; font-size: 13.5px; line-height: 1.65; color: #475569;">
                      We're excited to partner with you. Your official MCPA client dossier is now active and ready for consultation booking, architectural reviews, and live construction oversight.
                    </p>
                  </td>

                  <!-- Right Image Column (Luxury Modern Architectural Render) -->
                  <td width="47%" valign="middle" class="hero-stack hero-img-cell" style="padding: 18px 20px 18px 0;">
                    <img src="${heroImgSrc}" alt="MCPA Modern Architectural Development" width="340" class="hero-img-mobile" style="width: 100%; max-width: 340px; height: 210px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />
                  </td>
                </tr>
              </table>

              <!-- 3. ACCOUNT CONFIRMATION CARD (Spacious & Clean, Client Name | Verified Email | Status) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="acct-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px 26px; margin-bottom: 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;" class="border-line">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="24" valign="middle">
                          <img src="${userIconSrc}" alt="User" width="18" height="18" style="width: 18px; height: 18px; display: block;" />
                        </td>
                        <td style="padding-left: 10px; font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #f59e0b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;">
                          ACCOUNT CONFIRMATION
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 18px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Client Name -->
                        <td width="45%" valign="top" class="acct-stack-col" style="padding-right: 16px;">
                          <div class="text-muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-family: ui-monospace, monospace; margin-bottom: 6px;">Client Name</div>
                          <div class="text-title" style="font-size: 15px; font-weight: 700; color: #0f172a;">${clientName}</div>
                        </td>

                        <!-- Registered Email -->
                        <td width="55%" valign="top" class="acct-stack-col">
                          <div class="text-muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-family: ui-monospace, monospace; margin-bottom: 6px;">Registered Email</div>
                          <div style="font-size: 14px; font-weight: 700; color: #0284c7; font-family: ui-monospace, monospace; word-break: break-all;">${toEmail}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 4. THREE FLUID HYBRID CARDS (Stack to 100% on Mobile, 3 Columns on PC) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="font-size: 0; padding: 0;">

                    <!-- CARD 1: Selected Projects -->
                    <div class="card-column" style="display: inline-block; width: 100%; max-width: 236px; vertical-align: top; text-align: left; margin: 0 6px 16px 6px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="feature-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
                        <tr>
                          <td>
                            <a href="${projectsUrl}" target="_blank" style="display: block;">
                              <img src="${projectsImgSrc}" alt="MCPA Selected Projects" width="236" class="card-img" style="width: 100%; height: 140px; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0;" />
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 18px 20px 22px 20px;">
                            <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                              <tr>
                                <td width="22" valign="middle">
                                  <img src="${projectsIconSrc}" alt="Projects" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
                                </td>
                                <td style="padding-left: 8px; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #f59e0b; font-family: ui-monospace, monospace;">
                                  PORTFOLIO
                                </td>
                              </tr>
                            </table>
                            <div class="text-title" style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                              Selected Projects
                            </div>
                            <div class="text-muted" style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin-bottom: 16px;">
                              Master-planned custom residences, commercial hubs, and modern multi-unit townhouses.
                            </div>
                            <div>
                              <a href="${projectsUrl}" target="_blank" style="color: #f59e0b; font-size: 11.5px; font-weight: 700; text-decoration: none; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.5px;">
                                EXPLORE PROJECTS &rarr;
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CARD 2: Design & Build Services -->
                    <div class="card-column" style="display: inline-block; width: 100%; max-width: 236px; vertical-align: top; text-align: left; margin: 0 6px 16px 6px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="feature-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
                        <tr>
                          <td>
                            <a href="${servicesUrl}" target="_blank" style="display: block;">
                              <img src="${servicesImgSrc}" alt="MCPA Design &amp; Build Services" width="236" class="card-img" style="width: 100%; height: 140px; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0;" />
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 18px 20px 22px 20px;">
                            <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                              <tr>
                                <td width="22" valign="middle">
                                  <img src="${servicesIconSrc}" alt="Services" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
                                </td>
                                <td style="padding-left: 8px; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #f59e0b; font-family: ui-monospace, monospace;">
                                  EXPERTISE
                                </td>
                              </tr>
                            </table>
                            <div class="text-title" style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                              Design &amp; Build
                            </div>
                            <div class="text-muted" style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin-bottom: 16px;">
                              Architectural plans, structural engineering, signed &amp; sealed blueprints, and turnkey construction.
                            </div>
                            <div>
                              <a href="${servicesUrl}" target="_blank" style="color: #f59e0b; font-size: 11.5px; font-weight: 700; text-decoration: none; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.5px;">
                                VIEW SERVICES &rarr;
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CARD 3: Our 4-Step Process -->
                    <div class="card-column" style="display: inline-block; width: 100%; max-width: 236px; vertical-align: top; text-align: left; margin: 0 6px 16px 6px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="feature-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
                        <tr>
                          <td>
                            <a href="${processUrl}" target="_blank" style="display: block;">
                              <img src="${processImgSrc}" alt="MCPA 4-Step Construction Process" width="236" class="card-img" style="width: 100%; height: 140px; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0;" />
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 18px 20px 22px 20px;">
                            <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                              <tr>
                                <td width="22" valign="middle">
                                  <img src="${processIconSrc}" alt="Process" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
                                </td>
                                <td style="padding-left: 8px; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #f59e0b; font-family: ui-monospace, monospace;">
                                  WORKFLOW
                                </td>
                              </tr>
                            </table>
                            <div class="text-title" style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                              Our 4-Step Process
                            </div>
                            <div class="text-muted" style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin-bottom: 16px;">
                              From consultation and 3D modeling to municipal permits, milestones, and final turnover.
                            </div>
                            <div>
                              <a href="${processUrl}" target="_blank" style="color: #f59e0b; font-size: 11.5px; font-weight: 700; text-decoration: none; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.5px;">
                                OUR PROCESS &rarr;
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- 5. PRIMARY CTA BUTTON: INQUIRE NOW (Spacious, prominent, links directly to /book) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 10px 0 34px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0" class="btn-container">
                      <tr>
                        <td align="center" style="border-radius: 8px; background: #f59e0b; background-image: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 18px rgba(245, 158, 11, 0.35);">
                          <a href="${inquireUrl}" target="_blank" class="btn-link" style="display: inline-block; padding: 16px 48px; font-size: 13px; font-weight: 800; color: #080a0e; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;">
                            INQUIRE NOW &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 6. SITE OFFICE FOOTER (Clean hairline divider, spacious contact info & social logos) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e2e8f0;" class="border-line">
                <tr><td colspan="2" style="height: 28px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                <tr>
                  <!-- Left: Company Overview -->
                  <td width="48%" valign="top" class="footer-stack" style="padding-right: 16px;">
                    <div class="text-title" style="font-size: 12.5px; font-weight: 800; letter-spacing: 1.5px; color: #0f172a; margin-bottom: 8px;">
                      MCPA CONSTRUCTION AND SUPPLY
                    </div>
                    <div class="text-muted" style="font-size: 12px; line-height: 1.65; color: #64748b; margin-bottom: 10px;">
                      Full-service Design and Build Contractor &bull; Plaridel, Bulacan<br />
                      Residential &bull; Commercial Warehouses &bull; Signed &amp; Sealed Plans
                    </div>
                    <div style="font-size: 11.5px; line-height: 1.6;">
                      <a href="${companyMapsUrl}" target="_blank" class="text-muted" style="color: #64748b; text-decoration: none;">
                        <img src="${locationIconSrc}" alt="Location" width="13" height="13" style="vertical-align: middle; margin-right: 5px; display: inline-block;" />
                        ${companyAddress}
                      </a>
                    </div>
                  </td>

                  <!-- Right: Contact Channels & Socials -->
                  <td width="52%" valign="top" align="right" class="footer-stack" style="padding-left: 8px;">
                    <div style="font-size: 12px; line-height: 2;" class="text-muted">
                      <div>
                        <img src="${phoneIconSrc}" alt="Phone" width="13" height="13" style="vertical-align: middle; margin-right: 5px; display: inline-block;" />
                        Direct Phone / Viber: <a href="tel:${companyPhone}" style="color: #f59e0b; text-decoration: none; font-weight: 700; font-family: monospace;">${companyPhoneDisplay}</a>
                      </div>
                      <div>
                        <img src="${mailIconSrc}" alt="Email" width="13" height="13" style="vertical-align: middle; margin-right: 5px; display: inline-block;" />
                        Official Email: <a href="mailto:${companyEmail}" style="color: #0284c7; text-decoration: none; font-family: monospace;">${companyEmail}</a>
                      </div>
                      <div style="margin-top: 2px;">
                        Office Hours: Mon &ndash; Sat &bull; 8:00 AM &ndash; 5:00 PM PST
                      </div>

                      <!-- Social Logos (Facebook, Instagram, TikTok) with ample spacing -->
                      <div style="margin-top: 12px;" class="footer-social-wrap">
                        <table border="0" cellspacing="0" cellpadding="0" align="right" style="display: inline-table;">
                          <tr>
                            <td style="padding: 0 6px;">
                              <a href="${companyFacebook}" target="_blank" title="Facebook">
                                <img src="${fbIconSrc}" alt="Facebook" width="24" height="24" style="width: 24px; height: 24px; display: block;" />
                              </a>
                            </td>
                            <td style="padding: 0 6px;">
                              <a href="${companyInstagram}" target="_blank" title="Instagram">
                                <img src="${igIconSrc}" alt="Instagram" width="24" height="24" style="width: 24px; height: 24px; display: block;" />
                              </a>
                            </td>
                            <td style="padding: 0 6px;">
                              <a href="${companyTikTok}" target="_blank" title="TikTok">
                                <img src="${tiktokIconSrc}" alt="TikTok" width="24" height="24" style="width: 24px; height: 24px; display: block;" />
                              </a>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Bottom Tagline & Copyright -->
                <tr>
                  <td colspan="2" style="height: 20px; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td colspan="2" align="center" style="padding: 18px 0 8px 0; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; font-family: ui-monospace, monospace;" class="border-line">
                    BUILDING BETTER TOMORROWS &bull; &copy; ${currentYear} MCPA CONSTRUCTION AND SUPPLY. ALL RIGHTS RESERVED.
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
  <!-- mcpa-dispatch-token: ${Date.now().toString(36)} -->
</body>
</html>`;
}

module.exports = { getWelcomeEmailTemplate };
