const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Ensure standard PDFKit fallback fonts
try {
  require("pdfkit/standard-fonts/Helvetica");
  require("pdfkit/standard-fonts/HelveticaBold");
  require("pdfkit/standard-fonts/HelveticaOblique");
  require("pdfkit/standard-fonts/HelveticaBoldOblique");
  require("pdfkit/standard-fonts/Courier");
  require("pdfkit/standard-fonts/CourierBold");
  require("pdfkit/standard-fonts/TimesRoman");
  require("pdfkit/standard-fonts/TimesBold");
  require("pdfkit/standard-fonts/TimesItalic");
} catch (_) {}

/**
 * Format currency in Philippine Peso
 */
function formatPHP(amount) {
  const num = Number(amount) || 0;
  return "PHP " + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Helper to safely extract image Buffer from base64 data URL
 */
function parseSignatureBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (match && match[2]) {
    try {
      return Buffer.from(match[2], "base64");
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * MCPA Construction and Supply - Construction Master Contract Agreement PDF Generator
 * Pure server-side vector PDF generation using PDFKit.
 * Format: A4 portrait, matching the client portal's Word-style contract preview.
 * Typography and spacing intentionally mirror the UI document so the downloaded
 * artifact preserves the same hierarchy, tables, and signature presentation.
 */
function generateContractPdf(contractData = {}, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const contract = contractData || {};
      const projectMeta = contract.project_meta || {};

      const projectRefCode =
        contract.project_code ||
        projectMeta.project_code ||
        contract.contract_number ||
        options.projectCode ||
        "MCPA-2026-001";

      const contractDateStr = contract.created_at
        ? new Date(contract.created_at).toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" })
        : new Date().toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" });

      const clientLegalName =
        contract.client_signer_name ||
        projectMeta.client_name ||
        options.clientName ||
        "Raymart Quirante";

      const clientAddress =
        projectMeta.location ||
        options.clientAddress ||
        "Brgy. Muzon West, City of San Jose Del Monte, Bulacan";

      const clientPhone =
        projectMeta.client_phone ||
        options.clientPhone ||
        "+63 938 876 3473";

      const clientEmail =
        projectMeta.client_email ||
        contract.client_signer_email ||
        options.clientEmail ||
        "martquirante04@gmail.com";

      const projectTitle =
        contract.title ||
        projectMeta.project_title ||
        projectMeta.project_type ||
        options.projectTitle ||
        "Commercial & Mixed-Use Project (Raymart Quirante)";

      const siteLocation =
        projectMeta.location ||
        options.siteLocation ||
        clientAddress;

      const lotArea = projectMeta.lot_area || options.lotArea || 100000;
      const floorArea = projectMeta.floor_area || options.floorArea || 220;
      const lotFloorArea = `${lotArea} sq. m. Lot / ${floorArea} sq. m. Floor`;

      const blueprintRef =
        options.blueprintRef ||
        "Ground Floor Architectural Layout & Partition Schedule (v1.0)";

      const boqRef =
        options.boqRef ||
        "BOQ-MCPA-2026-FINAL";

      const lockedPrice =
        Number(options.totalBOQAmount) > 0
          ? Number(options.totalBOQAmount)
          : Number(contract.total_contract_amount) || Number(contract.contract_sum) || 3500000;

      // Extract Signatures
      const signatures = Array.isArray(contract.signatures) ? contract.signatures : [];
      const clientSigs = signatures
        .filter((s) => (s.signer_role || "").toUpperCase() === "CLIENT")
        .sort((a, b) => (b.signature_id || 0) - (a.signature_id || 0) || new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
      const clientSig =
        clientSigs[0] ||
        (contract.client_signature_image_url
          ? {
              signature_image_url: contract.client_signature_image_url,
              signer_name: contract.client_signer_name,
              signed_at: contract.client_signed_at,
              hash_sha256: contract.sha256_hash,
            }
          : null);

      const contractorSigs = signatures
        .filter((s) => ["CONTRACTOR", "ADMIN"].includes((s.signer_role || "").toUpperCase()))
        .sort((a, b) => (b.signature_id || 0) - (a.signature_id || 0) || new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
      const contractorSig =
        contractorSigs[0] ||
        (contract.contractor_signature_image_url
          ? {
              signature_image_url: contract.contractor_signature_image_url,
              signer_name: contract.contractor_signer_name,
              signed_at: contract.contractor_signed_at,
              hash_sha256: contract.sha256_hash,
            }
          : null);

      const filename = `MCPA-Contract-${projectRefCode.replace(/[^A-Za-z0-9]/g, "-")}.pdf`;

      // Page geometry: A4 portrait (matching the portal document preview)
      const PW = 595.28;
      const PH = 841.89;
      const ML = 36;
      const MR = 36;
      const MT = 28;
      const MB = 28;
      const CW = PW - ML - MR; // 504 pt content width

      const doc = new PDFDocument({
        size: [PW, PH],
        margins: { top: MT, bottom: MB, left: ML, right: MR },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `Construction Contract Agreement — ${projectRefCode}`,
          Author: "M.C.P.A. Design & Construction",
          Subject: "Master Turnkey Design-and-Build Legal Accord",
          Keywords: "MCPA, Construction, Contract, Agreement, Turnkey, Bulacan, Philippines",
          Creator: "MCPA Legal Contract Automation Engine",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve({ buffer: Buffer.concat(chunks), filename }));
      doc.on("error", reject);

      // Register Arial Fonts (Windows native fonts with Helvetica fallback)
      const hasArial = fs.existsSync("C:/Windows/Fonts/arial.ttf") && fs.existsSync("C:/Windows/Fonts/arialbd.ttf");
      if (hasArial) {
        doc.registerFont("Arial", "C:/Windows/Fonts/arial.ttf");
        doc.registerFont("Arial-Bold", "C:/Windows/Fonts/arialbd.ttf");
        if (fs.existsSync("C:/Windows/Fonts/ariali.ttf")) doc.registerFont("Arial-Italic", "C:/Windows/Fonts/ariali.ttf");
        if (fs.existsSync("C:/Windows/Fonts/arialbi.ttf")) doc.registerFont("Arial-BoldItalic", "C:/Windows/Fonts/arialbi.ttf");
      }

      const F_REG = hasArial ? "Arial" : "Helvetica";
      const F_BOLD = hasArial ? "Arial-Bold" : "Helvetica-Bold";
      const F_ITALIC = (hasArial && fs.existsSync("C:/Windows/Fonts/ariali.ttf")) ? "Arial-Italic" : "Helvetica-Oblique";
      const F_MONO = "Courier";
      const F_MONO_BOLD = "Courier-Bold";

      // Palette mirrors the neutral UI document surfaces and borders.
      const C_BLACK = "#171717";
      const C_CHARCOAL = "#262626";
      const C_GRAY = "#404040";
      const C_MUTED = "#737373";
      const C_BORDER = "#d4d4d4";
      const C_BORDER_DARK = "#a3a3a3";
      const C_SURFACE = "#f5f5f5";

      // Common typography options for the compact UI document preview.
      const PARA_OPTS = {
        width: CW,
        align: "justify",
        lineGap: 1.5,
      };

      // =============================================================
      // ========================== PAGE 1 ===========================
      // =============================================================
      let currY = MT;

      // -------------------------------------------------------------
      // 1. TOP LETTERHEAD: LOGO, COMPANY DETAILS & REF CODE
      // -------------------------------------------------------------
      let logoPath = path.resolve(__dirname, "../../public/assets/mcpa-logo-white-bg.png");
      if (!fs.existsSync(logoPath)) {
        logoPath = path.resolve(__dirname, "../../public/assets/mcpa-logo.png");
      }
      const hasLogo = fs.existsSync(logoPath);

      let headerTextX = ML;
      const logoW = 58;
      const logoH = 42;

      if (hasLogo) {
        try {
          doc.image(logoPath, ML, currY, { width: logoW, height: logoH, fit: [logoW, logoH] });
          headerTextX = ML + logoW + 12;
        } catch (_) {
          headerTextX = ML;
        }
      }

      // Company Masthead Text
      doc.font(F_BOLD).fontSize(11).fillColor(C_BLACK)
        .text("M.C.P.A. DESIGN & CONSTRUCTION", headerTextX, currY + 1, { width: 300, align: "left", lineBreak: false });

      doc.font(F_REG).fontSize(7.5).fillColor(C_GRAY)
        .text("General Engineering, Architectural Design & Build", headerTextX, currY + 16, { width: 300, align: "left", lineBreak: false });

      doc.font(F_REG).fontSize(7).fillColor(C_MUTED)
        .text("2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines", headerTextX, currY + 28, { width: 300, align: "left", lineBreak: false });

      doc.font(F_REG).fontSize(7).fillColor(C_MUTED)
        .text("Contact: (+63) 949 775 8239 | Email: contact@mcpaconstruction.com | PCAB Lic. No.: 49821", headerTextX, currY + 39, { width: 330, align: "left", lineBreak: false });

      // Top Right Reference Meta
      const rightMetaW = 150;
      const rightMetaX = PW - MR - rightMetaW;
      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
        .text(`Ref Code: ${projectRefCode}`, rightMetaX, currY + 12, { width: rightMetaW, align: "right", lineBreak: false });
      doc.font(F_REG).fontSize(7.5).fillColor(C_MUTED)
        .text(`Date: ${contractDateStr}`, rightMetaX, currY + 26, { width: rightMetaW, align: "right", lineBreak: false });

      currY += 52;

      // Solid dividing rule
      doc.save().strokeColor(C_BLACK).lineWidth(1.5).moveTo(ML, currY).lineTo(PW - MR, currY).stroke().restore();
      currY += 12;

      // -------------------------------------------------------------
      // 2. DOCUMENT TITLE
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(12).fillColor(C_BLACK)
        .text("CONSTRUCTION CONTRACT AGREEMENT", ML, currY, { width: CW, align: "center", underline: true });
      currY += 17;

      doc.font(F_ITALIC).fontSize(8).fillColor(C_MUTED)
        .text("Master Turnkey Design-and-Build Legal Accord", ML, currY, { width: CW, align: "center" });
      currY += 15;

      // -------------------------------------------------------------
      // 3. PARTIES INVOLVED
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("PARTIES INVOLVED", ML, currY);
      currY += 11;

      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL);

      const contractorP = "CONTRACTOR: M.C.P.A. Design & Construction (MCPA Builders), with office address at 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines, represented by its authorized managing officer.";
      doc.text(contractorP, ML, currY, PARA_OPTS);
      currY = doc.y + 6;

      const clientP = `CLIENT / OWNER: ${clientLegalName}, residing at ${clientAddress}, Contact No.: ${clientPhone}, Email: ${clientEmail}.`;
      doc.text(clientP, ML, currY, PARA_OPTS);
      currY = doc.y + 6;

      doc.font(F_ITALIC).fontSize(8.5).fillColor(C_GRAY)
        .text("The parties agree to the following terms and mutual covenants for the construction project described below:", ML, currY, { width: CW, align: "justify", lineGap: 2.5 });
      currY = doc.y + 11;

      // -------------------------------------------------------------
      // 4. ARTICLE 1. PROJECT OVERVIEW & SCOPE OF WORK
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("ARTICLE 1. PROJECT OVERVIEW & SCOPE OF WORK", ML, currY);
      currY += 10;

      // Bulleted Project Details (11pt Arial, clean line flow)
      const bullets = [
        { label: "•  Project Title: ", val: projectTitle },
        { label: "•  Project Site Location: ", val: siteLocation },
        { label: "•  Lot Area / Floor Area: ", val: lotFloorArea },
        { label: "•  Approved Blueprint Version: ", val: blueprintRef },
        { label: "•  Approved Bill of Quantities (BOQ) Ref: ", val: boqRef },
      ];

      bullets.forEach((b) => {
        doc.font(F_BOLD).fontSize(7).fillColor(C_BLACK)
          .text(b.label, ML + 8, currY, { continued: true });
        doc.font(F_REG).fontSize(8.5).fillColor(C_CHARCOAL)
          .text(b.val, { lineBreak: true });
        currY = doc.y + 2.5;
      });

      currY += 3;
      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text(
          "The Contractor shall perform the work described in the approved plans, specifications, and BOQ identified above. Any exclusion, variation, or additional work must be documented in a written change order approved by both parties, including any price and schedule adjustment. The approved plans, specifications, BOQ, and signed change orders form part of this Agreement.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 11;

      // -------------------------------------------------------------
      // 5. ARTICLE 2. TOTAL CONTRACT PRICE & SELECTED PAYMENT METHOD
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("ARTICLE 2. TOTAL CONTRACT PRICE & SELECTED PAYMENT METHOD", ML, currY);
      currY += 10;

      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("Total Locked BOQ Contract Price: ", ML, currY, { continued: true });
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text(`${formatPHP(lockedPrice)} `, { continued: true });
      doc.font(F_REG).fontSize(8.5).fillColor(C_CHARCOAL)
        .text("(inclusive of materials, direct labor, and standard engineering supervision as itemized in the approved BOQ).");
      currY = doc.y + 6;

      // Selected Payment Mode Box (Clean outline, NO background fill)
      const modeBoxH = 24;
      doc.save()
        .rect(ML, currY, CW, modeBoxH)
        .fillColor(C_SURFACE)
        .fill()
        .rect(ML, currY, CW, modeBoxH)
        .strokeColor(C_BORDER)
        .lineWidth(0.75)
        .stroke()
        .restore();

      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
        .text("Selected Payment Mode: ", ML + 10, currY + 6.5, { continued: true });
      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
        .text("[X] Cash / Milestone Progress Billing        ", { continued: true });
      doc.font(F_REG).fontSize(7.5).fillColor(C_MUTED)
        .text("[ ] Bank Housing Loan Financing        [ ] Staged Escrow");

      currY += modeBoxH + 6;

      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text(
          "The contract price is based on the approved BOQ. No price change shall apply unless recorded in a written change order signed by both parties. For bank financing or escrow, documentary requirements, release conditions, and fees shall be confirmed separately in writing.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 11;

      // -------------------------------------------------------------
      // 6. ARTICLE 3. PROGRESS BILLING SCHEDULE (Fits cleanly on Page 1)
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("ARTICLE 3. PROGRESS BILLING SCHEDULE", ML, currY);
      currY += 10;

      const scheduleRows = [
        { tranche: "1 — 20%", milestone: "Mobilization / Downpayment", pct: 0.20 },
        { tranche: "2 — 25%", milestone: "Foundation & Structural Works", pct: 0.25 },
        { tranche: "3 — 25%", milestone: "Roof Framing & Masonry Enclosure", pct: 0.25 },
        { tranche: "4 — 25%", milestone: "Architectural & MEPFS Finishes", pct: 0.25 },
        { tranche: "5 — 5%",  milestone: "Final Inspection, Turnover & Retention", pct: 0.05 },
      ];

      const colW1 = 78;
      const colW2 = 286;
      const colW3 = CW - colW1 - colW2; // 140 pt

      // Table Header (same neutral surface as the UI preview)
      const tblHeaderH = 19;
      doc.save()
        .rect(ML, currY, CW, tblHeaderH)
        .fillColor(C_SURFACE)
        .fill()
        .rect(ML, currY, CW, tblHeaderH)
        .strokeColor(C_BORDER_DARK)
        .lineWidth(0.9)
        .stroke()
        .restore();

      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK);
      doc.text("Tranche", ML + 8, currY + 4.5, { width: colW1 - 10 });
      doc.text("Milestone Stage", ML + colW1 + 8, currY + 4.5, { width: colW2 - 10 });
      doc.text("Amount (PHP)", ML + colW1 + colW2, currY + 4.5, { width: colW3 - 10, align: "right" });

      currY += tblHeaderH;

      // Table Rows (Clean lines, NO background)
      const rowH = 17;
      scheduleRows.forEach((r) => {
        doc.save().rect(ML, currY, CW, rowH).strokeColor(C_BORDER).lineWidth(0.5).stroke().restore();

        doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
          .text(r.tranche, ML + 8, currY + 3.5, { width: colW1 - 10 });
        doc.font(F_REG).fontSize(8).fillColor(C_CHARCOAL)
          .text(r.milestone, ML + colW1 + 8, currY + 3.5, { width: colW2 - 10 });
        doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
          .text(formatPHP(lockedPrice * r.pct), ML + colW1 + colW2, currY + 3.5, { width: colW3 - 10, align: "right" });

        currY += rowH;
      });

      // Total Row (same neutral emphasis as the UI preview)
      const totalRowH = 19;
      doc.save()
        .rect(ML, currY, CW, totalRowH)
        .fillColor(C_SURFACE)
        .fill()
        .rect(ML, currY, CW, totalRowH)
        .strokeColor(C_BLACK)
        .lineWidth(1.2)
        .stroke()
        .restore();
      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
        .text("TOTAL — 100%", ML + 8, currY + 4.5, { width: colW1 - 10 });
      doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
        .text("Total Contract Price", ML + colW1 + 8, currY + 4.5, { width: colW2 - 10 });
      doc.font(F_BOLD).fontSize(8.5).fillColor(C_BLACK)
        .text(formatPHP(lockedPrice), ML + colW1 + colW2, currY + 4, { width: colW3 - 10, align: "right" });

      currY += totalRowH + 6;

      doc.font(F_REG).fontSize(8.5).fillColor(C_CHARCOAL)
        .text(
          "Each progress payment becomes due upon completion of the corresponding milestone and submission of a billing statement, subject to reasonable verification by the Client/Owner. The final 5% is payable at final turnover, subject to completion of agreed punch-list items and delivery of turnover documents.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 14;

      // -------------------------------------------------------------
      // 7. ARTICLE 4. TARGET TIMELINE & FORCE MAJEURE
      // Keep this section on page 1 so the page does not end with a
      // large unused gap after the progress billing table.
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("ARTICLE 4. TARGET TIMELINE & FORCE MAJEURE", ML, currY);
      currY += 12;

      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("Estimated Construction Period: ", ML, currY, { continued: true });
      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text("180 calendar days  |  ", { continued: true });
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("Target Turnover: ", { continued: true });
      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text("180 Calendar Days from Mobilization.");
      currY = doc.y + 7;

      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text(
          "The period begins on agreed commencement trigger (site handover, permit readiness, and receipt of initial payment). The completion date shall be reasonably adjusted for documented delays beyond the Contractor's reasonable control, including severe weather, natural disasters, government restrictions, utility delays, labor or material supply disruptions, and other force majeure events. The Contractor shall notify the Client within a reasonable time and take reasonable steps to mitigate delay.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 14;

      // =============================================================
      // ========================== PAGE 2 ===========================
      // =============================================================
      doc.addPage({
        size: [PW, PH],
        margins: { top: MT, bottom: MB, left: ML, right: MR },
      });

      currY = MT;

      // Running Header on Page 2
      doc.font(F_REG).fontSize(7).fillColor(C_MUTED)
        .text("M.C.P.A. DESIGN & CONSTRUCTION  •  CONSTRUCTION CONTRACT AGREEMENT", ML, currY, { width: 340, lineBreak: false });
      doc.font(F_BOLD).fontSize(7).fillColor(C_BLACK)
        .text(`Ref: ${projectRefCode}`, PW - MR - 140, currY, { width: 140, align: "right", lineBreak: false });

      currY += 13;
      doc.save().strokeColor(C_BORDER).lineWidth(0.75).moveTo(ML, currY).lineTo(PW - MR, currY).stroke().restore();
      currY += 16;

      // -------------------------------------------------------------
      // 8. ARTICLE 5. STRUCTURAL & WORKMANSHIP WARRANTY
      // -------------------------------------------------------------
      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("ARTICLE 5. STRUCTURAL & WORKMANSHIP WARRANTY", ML, currY);
      currY += 12;

      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text(
          "1. Structural Warranty: Structural liability shall be governed by applicable Philippine law, including Article 1723 of the Civil Code of the Philippines, which addresses liability for building collapse due to defects in plans or specifications, defects in construction, or use of defective materials within the statutory period of fifteen (15) years.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 7;

      doc.font(F_REG).fontSize(9).fillColor(C_CHARCOAL)
        .text(
          "2. Workmanship Warranty: The Contractor provides a one (1) year workmanship warranty from turnover for defects attributable to workmanship, subject to written notice and reasonable access for inspection and repair.",
          ML,
          currY,
          PARA_OPTS
        );
      currY = doc.y + 14;

      // -------------------------------------------------------------
      // 9. MUTUAL SIGNATURE EXECUTION BLOCK (matches the neutral UI cards)
      // -------------------------------------------------------------
      doc.save().strokeColor(C_BLACK).lineWidth(1.2).moveTo(ML, currY).lineTo(PW - MR, currY).stroke().restore();
      currY += 8;

      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("MUTUAL SIGNATURE EXECUTION BLOCK", ML, currY);
      currY += 12;

      const sigBoxW = (CW - 16) / 2; // 244 pt
      const sigBoxH = 92;
      const box1X = ML;
      const box2X = ML + sigBoxW + 16;

      // --- CLIENT SIGNATURE BOX ---
      doc.save()
        .rect(box1X, currY, sigBoxW, sigBoxH)
        .fillColor("#fafafa")
        .fill()
        .rect(box1X, currY, sigBoxW, sigBoxH)
        .strokeColor(C_BORDER)
        .lineWidth(0.8)
        .stroke()
        .restore();

      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("CLIENT / OWNER", box1X + 10, currY + 8);

      const clientSigAreaY = currY + 20;
      const clientSigAreaH = 36;

      let clientSigDrawn = false;
      if (clientSig?.signature_image_url) {
        const sigBuf = parseSignatureBuffer(clientSig.signature_image_url);
        if (sigBuf) {
          try {
            doc.image(sigBuf, box1X + 10, clientSigAreaY, {
              fit: [sigBoxW - 20, clientSigAreaH],
              align: "left",
              valign: "center",
            });
            clientSigDrawn = true;
          } catch (_) {
            clientSigDrawn = false;
          }
        }
      }

      if (!clientSigDrawn) {
        if (clientSig) {
          doc.font("Times-Italic").fontSize(15).fillColor(C_BLACK)
            .text(clientSig.signer_name || clientLegalName, box1X + 10, clientSigAreaY + 10, {
              width: sigBoxW - 20,
              lineBreak: false,
              ellipsis: true,
            });
        } else {
          doc.font(F_ITALIC).fontSize(9).fillColor(C_MUTED)
            .text("[Awaiting Client Digital Signature]", box1X + 10, clientSigAreaY + 12, {
              width: sigBoxW - 20,
              align: "center",
            });
        }
      }

      // Underline / Divider
      doc.save().strokeColor(C_BORDER).lineWidth(0.5).moveTo(box1X + 10, clientSigAreaY + clientSigAreaH).lineTo(box1X + sigBoxW - 10, clientSigAreaY + clientSigAreaH).stroke().restore();

      const clientMetaY = clientSigAreaY + clientSigAreaH + 4;
      doc.font(F_BOLD).fontSize(10.5).fillColor(C_BLACK)
        .text(clientSig?.signer_name || clientLegalName, box1X + 10, clientMetaY, { width: sigBoxW - 20, lineBreak: false, ellipsis: true });
      doc.font(F_REG).fontSize(8.5).fillColor(C_MUTED)
        .text("Owner & Principal Client", box1X + 10, clientMetaY + 12);

      const clientDateStr = clientSig?.signed_at
        ? `Date Signed: ${new Date(clientSig.signed_at).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}`
        : "Date: Pending Execution";
      doc.font(F_REG).fontSize(8).fillColor(C_MUTED)
        .text(clientDateStr, box1X + 10, clientMetaY + 22);

      // --- CONTRACTOR SIGNATURE BOX ---
      doc.save()
        .rect(box2X, currY, sigBoxW, sigBoxH)
        .fillColor("#fafafa")
        .fill()
        .rect(box2X, currY, sigBoxW, sigBoxH)
        .strokeColor(C_BORDER)
        .lineWidth(0.8)
        .stroke()
        .restore();

      doc.font(F_BOLD).fontSize(9).fillColor(C_BLACK)
        .text("CONTRACTOR REPRESENTATIVE", box2X + 10, currY + 8);

      const contractorSigAreaY = currY + 20;
      const contractorSigAreaH = 36;

      let contractorSigDrawn = false;
      if (contractorSig?.signature_image_url) {
        const cSigBuf = parseSignatureBuffer(contractorSig.signature_image_url);
        if (cSigBuf) {
          try {
            doc.image(cSigBuf, box2X + 10, contractorSigAreaY, {
              fit: [sigBoxW - 20, contractorSigAreaH],
              align: "left",
              valign: "center",
            });
            contractorSigDrawn = true;
          } catch (_) {
            contractorSigDrawn = false;
          }
        }
      }

      if (!contractorSigDrawn) {
        if (contractorSig) {
          doc.font("Times-Italic").fontSize(15).fillColor(C_BLACK)
            .text(contractorSig.signer_name || "Engr. Raymart Quirante", box2X + 10, contractorSigAreaY + 10, {
              width: sigBoxW - 20,
              lineBreak: false,
              ellipsis: true,
            });
        } else {
          doc.font(F_ITALIC).fontSize(9).fillColor(C_MUTED)
            .text("[Pending Contractor Countersignature]", box2X + 10, contractorSigAreaY + 12, {
              width: sigBoxW - 20,
              align: "center",
            });
        }
      }

      // Underline / Divider
      doc.save().strokeColor(C_BORDER).lineWidth(0.5).moveTo(box2X + 10, contractorSigAreaY + contractorSigAreaH).lineTo(box2X + sigBoxW - 10, contractorSigAreaY + contractorSigAreaH).stroke().restore();

      const contractorMetaY = contractorSigAreaY + contractorSigAreaH + 4;
      doc.font(F_BOLD).fontSize(10.5).fillColor(C_BLACK)
        .text(contractorSig?.signer_name || "Engr. Raymart Quirante", box2X + 10, contractorMetaY, { width: sigBoxW - 20, lineBreak: false, ellipsis: true });
      doc.font(F_REG).fontSize(8.5).fillColor(C_MUTED)
        .text("Authorized Managing Officer • M.C.P.A. Design & Construction", box2X + 10, contractorMetaY + 12);

      const contractorDateStr = contractorSig?.signed_at
        ? `Date Signed: ${new Date(contractorSig.signed_at).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}`
        : "Date: Pending Countersignature";
      doc.font(F_REG).fontSize(8).fillColor(C_MUTED)
        .text(contractorDateStr, box2X + 10, contractorMetaY + 22);

      currY += sigBoxH + 10;

      // -------------------------------------------------------------
      // 10. CRYPTOGRAPHIC TAMPER-EVIDENT SEAL (Text only, NO background!)
      // -------------------------------------------------------------
      const sealHash = contract.sha256_hash || clientSig?.hash_sha256 || contractorSig?.hash_sha256;
      if (sealHash) {
        doc.font(F_BOLD).fontSize(8).fillColor(C_BLACK)
          .text("TAMPER-EVIDENT SHA-256 DIGITAL SEAL: ", ML, currY, { continued: true });
        doc.font(F_MONO).fontSize(7.5).fillColor(C_GRAY)
          .text(sealHash, { lineBreak: false });
        currY += 14;
      }

      // =============================================================
      // 11. DYNAMIC MULTI-PAGE RUNNING FOOTER STAMP
      // =============================================================
      const range = doc.bufferedPageRange();
      const footerY = PH - 24;

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const originalBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Divider rule above footer
        doc.save()
          .strokeColor(C_BORDER).lineWidth(0.6)
          .moveTo(ML, footerY - 5).lineTo(PW - MR, footerY - 5)
          .stroke()
          .restore();

        doc.font(F_REG).fontSize(8).fillColor(C_MUTED)
          .text(
            `MCPA Construction and Supply  •  2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan  •  Master Agreement Ref: ${projectRefCode}`,
            ML,
            footerY,
            { width: 380, lineBreak: false }
          );

        doc.font(F_BOLD).fontSize(8.5).fillColor(C_BLACK)
          .text(`Page ${i + 1} of ${range.count}`, PW - MR - 100, footerY, { width: 100, align: "right", lineBreak: false });

        doc.page.margins.bottom = originalBottom;
      }

      doc.end();
    } catch (err) {
      console.error("[contractPdfService] Error generating PDF:", err);
      reject(err);
    }
  });
}

module.exports = { generateContractPdf };
