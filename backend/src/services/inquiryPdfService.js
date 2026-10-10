const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Ensure standard fonts for serverless compatibility
try {
  require("pdfkit/standard-fonts/Helvetica");
  require("pdfkit/standard-fonts/HelveticaBold");
  require("pdfkit/standard-fonts/HelveticaOblique");
  require("pdfkit/standard-fonts/HelveticaBoldOblique");
  require("pdfkit/standard-fonts/Courier");
  require("pdfkit/standard-fonts/CourierBold");
} catch (_) {}

/**
 * MCPA Construction and Supply - Client Inquiry Information PDF Generator
 * Pure server-side vector PDF generation using PDFKit.
 * Crisp, executive single-page architectural sheet with zero trailing blank pages.
 */
function generateInquiryPdf(brief = {}) {
  return new Promise((resolve, reject) => {
    try {
      const submissionId = brief.submission_id || brief.submissionId || "MCPA-CPB-000000";
      const clientName = brief.client_name || brief.clientName || "Valued Client";
      const clientEmail = brief.client_email || brief.clientEmail || "—";
      const clientPhone = brief.client_phone || brief.clientPhone || "—";
      const status = brief.status || "Pending Review";
      let rawProjectType = brief.project_type || brief.projectType || "Residential";
      if (typeof rawProjectType === "string" && rawProjectType.toLowerCase().includes("residential")) {
        rawProjectType = "Residential";
      }
      const projectType = rawProjectType;
      const preferredStyle = brief.preferred_style || brief.preferredStyle || "Modern Contemporary";
      const storeys = brief.storeys || "2-Storey (Standard)";
      const targetDate = brief.target_date || brief.targetDate || "Within 3 Months";
      const budgetRange = brief.budget_range || brief.budgetRange || "Flexible Architectural Plan";
      const financingOption = brief.financing_option || brief.financingOption || "Milestone Progress Billing";
      const location = brief.location || "Bulacan, Philippines";
      const lotStatus = brief.lot_status || brief.lotStatus || "Already Owned / Titled";
      const lotArea = brief.lot_area || brief.lotArea || "Not specified";
      const mapCoordinates = brief.map_coordinates || brief.mapCoordinates || "";
      const meetingMode = brief.meeting_mode || brief.meetingMode || "Online Video Call";
      const meetingDate = brief.meeting_date || brief.meetingDate || "Pending Scheduling";
      const meetingTime = brief.meeting_time || brief.meetingTime || "To be confirmed";
      const venueDetails = brief.venue_details || brief.venueDetails || "";
      const meetingLink = brief.meeting_link || brief.meetingLink || "";
      const message = brief.message || "";
      const authProvider = brief.auth_provider || brief.authProvider || (clientEmail.toLowerCase().endsWith("@gmail.com") ? "google" : "local");
      const isGoogle = authProvider === "google";

      // Parse spatial wishlist if JSON string or object
      let spatial = null;
      const rawSpatial = brief.spatial_wishlist || brief.spatialWishlist;
      if (rawSpatial) {
        if (typeof rawSpatial === "object") {
          spatial = rawSpatial;
        } else {
          try { spatial = JSON.parse(rawSpatial); } catch (_) {}
        }
      }

      const filename = `MCPA-Inquiry-Information-${submissionId}.pdf`;

      // Page geometry: A4 (595.28 x 841.89 points)
      // bottom: 0 margin prevents PDFKit LineWrapper from triggering automatic blank page breaks
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 32, bottom: 0, left: 40, right: 40 },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `MCPA Client Inquiry Information — ${submissionId}`,
          Author: "MCPA Construction & Supply",
          Subject: "Client Inquiry Information Sheet",
          Keywords: "MCPA, Architecture, Engineering, Bulacan, Client Inquiry Information",
          Creator: "MCPA Automated Engineering Document System",
        },
      });

      doc.page.margins.bottom = 0;

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve({ buffer: Buffer.concat(chunks), filename }));
      doc.on("error", reject);

      const PW = 595.28;
      const PH = 841.89;
      const ML = 40;
      const MR = 40;
      const CW = PW - ML - MR; // 515.28 pt content width

      // Colors
      const C_PRIMARY = "#0f172a"; // Deep Slate
      const C_AMBER = "#b45309";   // Refined Amber text
      const C_MUTED = "#64748b";   // Slate 500
      const C_BORDER = "#cbd5e1";  // Slate 300
      const C_BG_LIGHT = "#f8fafc";
      const C_WHITE = "#ffffff";

      // 1. TOP HEADER & LETTERHEAD
      // Check for local logo image
      const logoPath = path.resolve(__dirname, "../../public/assets/mcpa-logo.png");
      const hasLogo = fs.existsSync(logoPath);

      if (hasLogo) {
        try {
          // mcpa-logo.png is 2000x667 (~3:1 aspect ratio). At width 95pt, rendered height is ~31.7pt.
          // Placed at y = 28, bottom reaches ~59.7pt, giving clear breathing room above the address line.
          doc.image(logoPath, ML, 28, { width: 95 });
        } catch (_) {
          doc.font("Helvetica-Bold").fontSize(16).fillColor(C_PRIMARY).text("MCPA CONSTRUCTION & SUPPLY", ML, 30, { lineBreak: false });
        }
      } else {
        doc.font("Helvetica-Bold").fontSize(16).fillColor(C_PRIMARY).text("MCPA CONSTRUCTION & SUPPLY", ML, 30, { lineBreak: false });
      }

      // Address and contact under logo with comfortable margin to prevent any text/logo overlap
      const headerTextY = hasLogo ? 68 : 56;
      doc.font("Helvetica").fontSize(7).fillColor(C_MUTED)
        .text("2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines • contact@mcpaconstruction.com", ML, headerTextY, { lineBreak: false });

      // Top-right status indicator (Text only, background pill completely removed per user request)
      const rightX = PW - MR - 160;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C_AMBER)
        .text(status.toUpperCase(), rightX, 28, { width: 160, align: "right", lineBreak: false });

      doc.font("Courier-Bold").fontSize(8).fillColor(C_PRIMARY)
        .text(`REF: ${submissionId}`, rightX, 41, { width: 160, align: "right", lineBreak: false });
      doc.font("Helvetica").fontSize(7).fillColor(C_MUTED)
        .text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, rightX, 53, { width: 160, align: "right", lineBreak: false });

      // Accent underline across entire page width
      doc.save()
        .strokeColor(C_PRIMARY).lineWidth(1.2)
        .moveTo(ML, 82).lineTo(PW - MR, 82)
        .stroke().restore();

      // 2. DOCUMENT TITLE (Clean Typography, Background box completely removed per user request)
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C_PRIMARY)
        .text("CLIENT INQUIRY INFORMATION", ML, 94, { width: CW, align: "center", characterSpacing: 1.2, lineBreak: false });

      let currY = 118;

      // Helper for Section Headers
      const drawSectionHeader = (title, num) => {
        doc.save();
        doc.roundedRect(ML, currY, CW, 15, 2).fill(C_BG_LIGHT);
        doc.restore();
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C_PRIMARY)
          .text(`${num}. ${title.toUpperCase()}`, ML + 8, currY + 4, { characterSpacing: 0.5, lineBreak: false });
        currY += 19;
      };

      // Helper for 2-column info cards
      const drawInfoRow = (label1, val1, label2, val2, height = 21) => {
        const colW = (CW - 10) / 2;
        const col1X = ML;
        const col2X = ML + colW + 10;

        doc.save();
        doc.rect(col1X, currY, colW, height).fillAndStroke(C_WHITE, C_BORDER);
        doc.rect(col2X, currY, colW, height).fillAndStroke(C_WHITE, C_BORDER);
        doc.restore();

        // Col 1
        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED)
          .text(label1.toUpperCase(), col1X + 8, currY + 3.5, { width: colW - 16, lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C_PRIMARY)
          .text(val1 || "—", col1X + 8, currY + 11.5, { width: colW - 16, ellipsis: true, lineBreak: false });

        // Col 2
        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED)
          .text(label2.toUpperCase(), col2X + 8, currY + 3.5, { width: colW - 16, lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C_PRIMARY)
          .text(val2 || "—", col2X + 8, currY + 11.5, { width: colW - 16, ellipsis: true, lineBreak: false });

        currY += height + 3.5;
      };

      // Helper for Full-width Row
      const drawFullRow = (label, val, height = 21) => {
        doc.save();
        doc.rect(ML, currY, CW, height).fillAndStroke(C_WHITE, C_BORDER);
        doc.restore();

        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED)
          .text(label.toUpperCase(), ML + 8, currY + 3.5, { width: CW - 16, lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C_PRIMARY)
          .text(val || "—", ML + 8, currY + 11.5, { width: CW - 16, ellipsis: true, lineBreak: false });

        currY += height + 3.5;
      };

      // -----------------------------------------------------------------------
      // SECTION I: CLIENT PROFILE SUMMARY
      // -----------------------------------------------------------------------
      drawSectionHeader("Client Profile Summary", "I");
      const authOrigin = isGoogle ? "Google Account (Verified Authenticated)" : "Direct Client Portal";
      drawInfoRow("Client Full Name", clientName, "Account Verification Origin", authOrigin);
      drawInfoRow("Contact Phone Number", clientPhone, "Registered Email Address", clientEmail);

      currY += 3;

      // -----------------------------------------------------------------------
      // SECTION II: ARCHITECTURAL CLASSIFICATION & SCOPE
      // -----------------------------------------------------------------------
      drawSectionHeader("Architectural Classification & Scope", "II");
      drawInfoRow("Project Classification", projectType, "Building Height / Storeys", storeys);
      drawInfoRow("Architectural Style Peg", preferredStyle, "Target Construction Timeline", targetDate);
      drawInfoRow("Estimated Budget Tier", budgetRange, "Financing Method", financingOption);

      currY += 3;

      // -----------------------------------------------------------------------
      // SECTION III: PROPOSED SITE & GEOGRAPHICAL PARAMETERS
      // -----------------------------------------------------------------------
      drawSectionHeader("Proposed Construction Site Parameters", "III");
      drawFullRow("Complete Construction Lot Address", location);
      drawInfoRow("Lot Legal Title Status", lotStatus, "Lot Area Specification", lotArea);
      if (mapCoordinates) {
        drawFullRow("Captured GPS Satellite Coordinates", mapCoordinates);
      }

      currY += 3;

      // -----------------------------------------------------------------------
      // SECTION IV: SPATIAL PROGRAMMING & ARCHITECTURE WISHLIST
      // -----------------------------------------------------------------------
      drawSectionHeader("Spatial Programming & Architectural Wishlist", "IV");
      const brVal = spatial?.bedrooms ? `${spatial.bedrooms} Bedrooms` : "3 Bedrooms";
      const bathVal = spatial?.bathrooms ? `${spatial.bathrooms} Bathrooms` : "2 Bathrooms";
      const carVal = spatial?.carGarage ? `${spatial.carGarage}` : "2 Car Slots";
      const col3W = (CW - 16) / 3;

      // 3-column spatial card
      doc.save();
      doc.rect(ML, currY, col3W, 25).fillAndStroke(C_WHITE, C_BORDER);
      doc.rect(ML + col3W + 8, currY, col3W, 25).fillAndStroke(C_WHITE, C_BORDER);
      doc.rect(ML + (col3W * 2) + 16, currY, col3W, 25).fillAndStroke(C_WHITE, C_BORDER);
      doc.restore();

      doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED).text("BEDROOMS", ML + 8, currY + 3.5, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_AMBER).text(brVal, ML + 8, currY + 12.5, { lineBreak: false });

      doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED).text("BATHROOMS", ML + col3W + 16, currY + 3.5, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_AMBER).text(bathVal, ML + col3W + 16, currY + 12.5, { lineBreak: false });

      doc.font("Courier-Bold").fontSize(6.5).fillColor(C_MUTED).text("CAR GARAGE", ML + (col3W * 2) + 24, currY + 3.5, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_AMBER).text(carVal, ML + (col3W * 2) + 24, currY + 12.5, { lineBreak: false });

      currY += 28.5;

      if (spatial?.featureTags && Array.isArray(spatial.featureTags) && spatial.featureTags.length > 0) {
        const featureStr = spatial.featureTags.map((t) => t.replace(/[_-]/g, " ")).join(" • ");
        drawFullRow("Selected Architectural Features", featureStr);
      }

      currY += 3;

      // -----------------------------------------------------------------------
      // SECTION V: CONSULTATION & MEETING SPECIFICATIONS
      // -----------------------------------------------------------------------
      drawSectionHeader("Consultation & Meeting Specifications", "V");
      const schedDisplay = `${meetingDate} (${meetingTime})`;
      drawInfoRow("Consultation Mode", meetingMode, "Confirmed Schedule Slot", schedDisplay);
      if (venueDetails || meetingLink) {
        drawFullRow("Venue Address / Virtual Meeting Link", venueDetails || meetingLink);
      }

      // -----------------------------------------------------------------------
      // SECTION VI: CLIENT SPECIAL REMARKS (IF PROVIDED)
      // -----------------------------------------------------------------------
      if (message) {
        currY += 3;
        drawSectionHeader("Client Special Remarks & Architectural Notes", "VI");
        doc.save();
        doc.rect(ML, currY, CW, 24).fillAndStroke(C_WHITE, C_BORDER);
        doc.restore();
        doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(C_PRIMARY)
          .text(`"${message}"`, ML + 8, currY + 5.5, { width: CW - 16, ellipsis: true, lineBreak: false });
        currY += 27.5;
      }

      // -----------------------------------------------------------------------
      // FOOTER SIGN-OFF & OFFICIAL STAMP (Fixed at bottom of Page 1)
      // -----------------------------------------------------------------------
      const footerY = PH - 34;
      doc.save()
        .strokeColor(C_BORDER).lineWidth(0.5)
        .moveTo(ML, footerY - 6).lineTo(PW - MR, footerY - 6)
        .stroke().restore();

      doc.font("Courier").fontSize(6.5).fillColor(C_MUTED)
        .text("CERTIFIED OFFICIAL PROJECT BRIEF • MCPA ENGINEERING BOARD", ML, footerY, { lineBreak: false });
      doc.font("Courier").fontSize(6.5).fillColor(C_MUTED)
        .text(`SYSTEM REF: ${submissionId} • BULACAN HQ`, ML, footerY + 8.5, { lineBreak: false });

      doc.font("Courier").fontSize(6.5).fillColor(C_MUTED)
        .text(`GENERATED: ${new Date().toISOString()}`, PW - MR - 180, footerY, { width: 180, align: "right", lineBreak: false });
      doc.font("Courier").fontSize(6.5).fillColor(C_MUTED)
        .text("PAGE 1 OF 1", PW - MR - 180, footerY + 8.5, { width: 180, align: "right", lineBreak: false });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInquiryPdf };
