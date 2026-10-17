const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Ensure standard fonts for serverless / lambda / container compatibility
try {
  require("pdfkit/standard-fonts/Helvetica");
  require("pdfkit/standard-fonts/HelveticaBold");
  require("pdfkit/standard-fonts/HelveticaOblique");
  require("pdfkit/standard-fonts/HelveticaBoldOblique");
  require("pdfkit/standard-fonts/Courier");
  require("pdfkit/standard-fonts/CourierBold");
} catch (_) {}

/**
 * Format currency in Philippine Peso (Monochrome clean format)
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "PHP " + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format duration months to human-readable year & month (e.g. 14 -> "1 Year & 2 Months", 18 -> "1 Year & 6 Months", 12 -> "1 Year")
 */
function formatDurationHuman(months) {
  const num = Number(months);
  if (!num || isNaN(num) || num <= 0) return "";
  if (num < 12) {
    return `${num} ${num === 1 ? "Month" : "Months"}`;
  }
  const years = Math.floor(num / 12);
  const remainingMonths = num % 12;
  const yearStr = `${years} ${years === 1 ? "Year" : "Years"}`;
  if (remainingMonths === 0) {
    return yearStr;
  }
  const monthStr = `${remainingMonths} ${remainingMonths === 1 ? "Month" : "Months"}`;
  return `${yearStr} & ${monthStr}`;
}

/**
 * MCPA Construction and Supply - Official Construction Quotation & BOQ PDF Generator
 * Pure server-side vector PDF generation using PDFKit.
 * Strict A4, High-Contrast Black & White Microsoft Word / Engineering Document Layout.
 * Logo and company address positioned on the top-right corner.
 */
function generateQuotationPdf(quotation = {}, clientProject = {}, clientBrief = {}) {
  return new Promise((resolve, reject) => {
    try {
      const quotationId = quotation.quotation_id || quotation.id || "001";
      const projectCode = quotation.project_code || clientProject.project_code || "MCPA-PRJ-2026";
      const quotationRef = `MCPA-QUO-${projectCode.replace(/[^A-Za-z0-9]/g, "")}-${String(quotationId).padStart(3, "0")}`;
      
      const clientName = quotation.client_name || clientBrief.client_name || clientProject.client_name || "Valued Client";
      const clientEmail = quotation.client_email || clientBrief.client_email || clientProject.client_email || "—";
      const clientPhone = quotation.client_phone || clientBrief.client_phone || "—";
      const projectType = quotation.project_type || clientBrief.project_type || clientProject.project_type || "Residential Design & Build";
      const location = quotation.location || clientBrief.location || clientProject.target_location || "Bulacan, Philippines";
      const floorArea = quotation.floor_area_sqm || clientBrief.lot_area || "Standard";
      const rawDuration = quotation.duration_months != null && quotation.duration_months !== ""
        ? Number(quotation.duration_months)
        : null;
      let durationMonths = rawDuration;
      if (!durationMonths || isNaN(durationMonths) || durationMonths <= 0) {
        const targetStr = clientBrief.target_date || "";
        const m = targetStr.match(/(\d+)\s*(month|buwan|mo)/i);
        if (m) {
          durationMonths = parseInt(m[1], 10);
        } else {
          durationMonths = 6;
        }
      }
      const financingType = quotation.financing_type || clientBrief.financing_option || "Milestone Progress Billing";
      
      const targetBudget = Number(quotation.client_target_budget) || Number(clientBrief.budget_range?.replace(/[^0-9.]/g, "")) || 0;
      const materialsTotal = Number(quotation.materials_cost) || 0;
      const laborTotal = Number(quotation.labor_cost) || 0;
      const laborRateBasis = quotation.labor_rate_basis || `Standard Labor Allocation (${durationMonths} ${durationMonths === 1 ? "Month" : "Months"})`;
      const architectFee = Number(quotation.architect_fee) || 0;
      const engineerFee = Number(quotation.engineer_fee) || 0;
      const profFeesTotal = architectFee + engineerFee;
      
      const contractorProfitPct = Number(quotation.contractor_profit_pct) || 12.00;
      const contractorProfitAmount = Number(quotation.contractor_profit_amount) || 0;
      const totalAmount = Number(quotation.total_amount) || (materialsTotal + laborTotal + profFeesTotal + contractorProfitAmount);
      
      const varianceAmount = Number(quotation.variance_amount) || (targetBudget > 0 ? totalAmount - targetBudget : 0);
      const variancePct = Number(quotation.variance_pct) || (targetBudget > 0 ? ((totalAmount - targetBudget) / targetBudget) * 100 : 0);
      
      const itemsBreakdown = Array.isArray(quotation.items_breakdown) ? quotation.items_breakdown : [];
      const paymentMilestones = Array.isArray(quotation.payment_milestones) && quotation.payment_milestones.length > 0
        ? quotation.payment_milestones
        : [
            { stage: "Mobilization & Downpayment", pct: 15, scope: "Permits, initial material deliveries & temporary facilities" },
            { stage: "Substructure & Foundation", pct: 25, scope: "Excavation, footing concrete buhos, columns, tie beams" },
            { stage: "Enclosure & Roofing Works", pct: 25, scope: "CHB masonry, steel roof trusses, longspan roofing & rough-ins" },
            { stage: "Architectural Finishes", pct: 25, scope: "Tileworks, ceiling, doors, windows, electrical fixtures & paint" },
            { stage: "Final Turnover & Handover", pct: 10, scope: "Final punchlist clearing, warranty certificate & occupancy" },
          ];

      const clientNotes = quotation.client_notes || clientBrief.message || "";
      const adminNotes = quotation.admin_notes || quotation.quotation_notes || "All prices include labor, tools, material logistics, site supervision, and standard 1-year structural warranty.";

      const filename = `${quotationRef}.pdf`;

      // Page geometry: A4 (595.28 x 841.89 points)
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 30, bottom: 25, left: 36, right: 36 },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `MCPA Construction Cost Quotation — ${quotationRef}`,
          Author: "MCPA Construction & Supply",
          Subject: "Official Bill of Quantities & Contract Quotation",
          Keywords: "MCPA, Construction, BOQ, Quotation, Engineering, Bulacan",
          Creator: "MCPA Engineering Estimating System",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve({ buffer: Buffer.concat(chunks), filename }));
      doc.on("error", reject);

      const PW = 595.28;
      const PH = 841.89;
      const ML = 36;
      const MR = 36;
      const CW = PW - ML - MR; // 523.28 pt content width

      // Black & White / Grayscale Palette (True Professional Word Document Aesthetic)
      const C_BLACK = "#000000";
      const C_DARK = "#1a1a1a";
      const C_GRAY = "#555555";
      const C_LIGHT_GRAY = "#888888";
      const C_BORDER = "#000000";
      const C_HEADER_BG = "#f2f2f2";

      let currY = 30;

      // -------------------------------------------------------------
      // 1. TOP HEADER: LOGO & COMPANY INFO ON TOP LEFT, TITLE ON RIGHT
      // -------------------------------------------------------------
      const logoPath = path.resolve(__dirname, "../../public/assets/mcpa-logo.png");
      const hasLogo = fs.existsSync(logoPath);

      // Top Left: Logo & Official Company Address
      let leftY = 30;
      if (hasLogo) {
        try {
          doc.image(logoPath, ML, leftY, { width: 120 });
          leftY += 38;
        } catch (_) {
          doc.font("Helvetica-Bold").fontSize(11).fillColor(C_BLACK)
            .text("MCPA CONSTRUCTION & SUPPLY", ML, leftY, { width: 220, align: "left", lineBreak: false });
          leftY += 15;
        }
      } else {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(C_BLACK)
          .text("MCPA CONSTRUCTION & SUPPLY", ML, leftY, { width: 220, align: "left", lineBreak: false });
        leftY += 15;
      }

      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C_BLACK)
        .text("MCPA CONSTRUCTION AND SUPPLY", ML, leftY, { width: 250, align: "left", lineBreak: false });
      leftY += 10;
      doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
        .text("2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines", ML, leftY, { width: 250, align: "left", lineBreak: false });
      leftY += 9;
      doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
        .text("contact@mcpaconstruction.com  |  +63 949 775 8239", ML, leftY, { width: 250, align: "left", lineBreak: false });
      leftY += 9;
      doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
        .text("PCAB License No. 49821 • Category A (General Building)", ML, leftY, { width: 250, align: "left", lineBreak: false });

      // Top Right: Document Title & Identifiers
      const rightBlockW = 260;
      const rightBlockX = PW - MR - rightBlockW;
      let rightY = 30;

      doc.font("Helvetica-Bold").fontSize(12).fillColor(C_BLACK)
        .text("BILL OF QUANTITIES & COST QUOTATION", rightBlockX, rightY, { width: rightBlockW, align: "right", lineBreak: false });
      rightY += 16;

      doc.font("Courier-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text(`QUOTATION NO: ${quotationRef}`, rightBlockX, rightY, { width: rightBlockW, align: "right", lineBreak: false });
      rightY += 11;

      doc.font("Helvetica").fontSize(7).fillColor(C_GRAY)
        .text(`Date Issued: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}   •   Validity: 30 Calendar Days`, rightBlockX, rightY, { width: rightBlockW, align: "right", lineBreak: false });
      rightY += 10;

      doc.font("Helvetica-Bold").fontSize(7).fillColor(C_DARK)
        .text(`Project Code: ${projectCode}   •   Status: ${quotation.status || "OFFICIAL QUOTATION"}`, rightBlockX, rightY, { width: rightBlockW, align: "right", lineBreak: false });
      rightY += 11;

      // Horizontal Dividing Rule
      currY = Math.max(leftY + 12, rightY + 10);
      doc.save().strokeColor(C_BLACK).lineWidth(1.5).moveTo(ML, currY).lineTo(PW - MR, currY).stroke().restore();
      currY += 8;

      // -------------------------------------------------------------
      // 2. CLIENT & PROJECT PARTICULARS (CLEAN 2-COLUMN WORD TABLE)
      // -------------------------------------------------------------
      const drawCell = (x, y, w, h, label, val, isMono = false) => {
        doc.save().rect(x, y, w, h).strokeColor(C_BLACK).lineWidth(0.5).stroke().restore();
        doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_GRAY)
          .text(label.toUpperCase(), x + 5, y + 3.5, { width: w - 10, lineBreak: false });
        if (isMono) {
          doc.font("Courier-Bold").fontSize(7.5).fillColor(C_BLACK)
            .text(val || "—", x + 5, y + 11.5, { width: w - 10, lineBreak: false, ellipsis: true });
        } else {
          doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C_BLACK)
            .text(val || "—", x + 5, y + 11.5, { width: w - 10, lineBreak: false, ellipsis: true });
        }
      };

      const halfW = CW / 2;
      const rowH = 20;
      const durationText = durationMonths >= 12
        ? `${formatDurationHuman(durationMonths)} (${durationMonths} Mos) Target Completion`
        : `${durationMonths} ${durationMonths === 1 ? "Month" : "Months"} Target Completion`;

      drawCell(ML, currY, halfW, rowH, "Client / Project Owner", clientName);
      drawCell(ML + halfW, currY, halfW, rowH, "Contact Email & Phone", `${clientEmail} / ${clientPhone}`);
      currY += rowH;

      drawCell(ML, currY, halfW, rowH, "Project Type & Scope", projectType);
      drawCell(ML + halfW, currY, halfW, rowH, "Project Site Location", location);
      currY += rowH;

      drawCell(ML, currY, halfW, rowH, "Target Construction Duration", durationText);
      drawCell(ML + halfW, currY, halfW, rowH, "Financing / Payment Mode", financingType);
      currY += rowH + 8;

      // -------------------------------------------------------------
      // 3. ITEMIZED BILL OF QUANTITIES TABLE (TRADES & MATERIALS)
      // -------------------------------------------------------------
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text("I. ITEMIZED TRADE BREAKDOWN & SCOPE OF WORKS (BILL OF QUANTITIES)", ML, currY, { lineBreak: false });
      currY += 11;

      // Table Column Definitions
      const colNo = 26;
      const colUnit = 38;
      const colQty = 42;
      const colRate = 72;
      const colAmount = 82;
      const colDesc = CW - (colNo + colUnit + colQty + colRate + colAmount); // remaining ~263 pt

      const drawTableHeader = (y) => {
        doc.save().rect(ML, y, CW, 13).fillAndStroke(C_HEADER_BG, C_BLACK).restore();
        doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_BLACK);
        doc.text("ITEM", ML + 2, y + 3.5, { width: colNo, align: "center", lineBreak: false });
        doc.text("SCOPE / DESCRIPTION OF WORKS", ML + colNo + 4, y + 3.5, { width: colDesc - 8, lineBreak: false });
        doc.text("UNIT", ML + colNo + colDesc, y + 3.5, { width: colUnit, align: "center", lineBreak: false });
        doc.text("QTY", ML + colNo + colDesc + colUnit, y + 3.5, { width: colQty, align: "right", lineBreak: false });
        doc.text("UNIT RATE", ML + colNo + colDesc + colUnit + colQty, y + 3.5, { width: colRate - 4, align: "right", lineBreak: false });
        doc.text("AMOUNT (PHP)", ML + colNo + colDesc + colUnit + colQty + colRate, y + 3.5, { width: colAmount - 4, align: "right", lineBreak: false });
      };

      drawTableHeader(currY);
      currY += 13;

      const pageBottomLimit = PH - 38;

      const checkNewPage = (neededHeight, isTable = false) => {
        if (currY + neededHeight > pageBottomLimit) {
          doc.addPage();
          currY = 30;
          doc.font("Helvetica-Bold").fontSize(7).fillColor(C_GRAY)
            .text(`MCPA Construction Quotation Ref: ${quotationRef} (Continued)`, ML, currY, { width: CW - 120, lineBreak: false });
          doc.font("Courier").fontSize(6.5).fillColor(C_LIGHT_GRAY)
            .text(`${projectCode}`, ML + CW - 110, currY, { width: 110, align: "right", lineBreak: false });
          currY += 10;
          doc.save().strokeColor(C_BLACK).lineWidth(0.5).moveTo(ML, currY).lineTo(PW - MR, currY).stroke().restore();
          currY += 8;

          if (isTable) {
            drawTableHeader(currY);
            currY += 13;
          }
        }
      };

      const validCategories = itemsBreakdown.filter(
        (c) => Array.isArray(c.items) && c.items.length > 0 && c.items.some((it) => it.item && String(it.item).trim())
      );

      if (validCategories.length === 0) {
        checkNewPage(22, true);
        doc.save().rect(ML, currY, CW, 18).strokeColor(C_BLACK).lineWidth(0.5).stroke().restore();
        doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(C_GRAY)
          .text("Detailed trade-by-trade takeoff items will be published once final architectural CAD drawings are locked.", ML + 8, currY + 5, { width: CW - 16, align: "center", lineBreak: false });
        currY += 18;
      } else {
        let tradeIndex = 1;
        validCategories.forEach((categoryBlock) => {
          const catName = categoryBlock.category || categoryBlock.tradeName || `Trade Scope #${tradeIndex}`;
          const items = Array.isArray(categoryBlock.items) ? categoryBlock.items : [];
          const catSubtotal = items.reduce((s, it) => s + (Number(it.total) || (Number(it.qty) * Number(it.unitCost)) || 0), 0);

          // Category Header Bar: ensure category header + at least 1 item fits (26pt)
          checkNewPage(26, true);
          doc.save().rect(ML, currY, CW, 13).fillAndStroke("#e8e8e8", C_BLACK).restore();
          doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_BLACK)
            .text(`${tradeIndex}.0  ${catName.toUpperCase()}`, ML + 6, currY + 3.5, { width: CW - 120, lineBreak: false, ellipsis: true });
          doc.font("Courier-Bold").fontSize(6.5).fillColor(C_BLACK)
            .text(`Subtotal: ${formatCurrency(catSubtotal)}`, ML + CW - 115, currY + 3.5, { width: 110, align: "right", lineBreak: false });
          currY += 13;

          // Category Items
          items.forEach((itemRow, itemIdx) => {
            checkNewPage(13, true);
            const rowTotal = Number(itemRow.total) || (Number(itemRow.qty) * Number(itemRow.unitCost)) || 0;
            const itemCode = `${tradeIndex}.${itemIdx + 1}`;
            const itemName = itemRow.item || itemRow.description || itemRow.title || "Standard Work Package";
            const itemUnit = itemRow.unit || "lot";
            const itemQty = Number(itemRow.qty) || 1;
            const itemRate = Number(itemRow.unitCost) || (rowTotal / itemQty) || 0;

            doc.save().rect(ML, currY, CW, 13).strokeColor(C_BLACK).lineWidth(0.3).stroke().restore();

            doc.font("Courier").fontSize(6).fillColor(C_GRAY)
              .text(itemCode, ML + 2, currY + 3.5, { width: colNo, align: "center", lineBreak: false });

            doc.font("Helvetica").fontSize(6.5).fillColor(C_BLACK)
              .text(itemName, ML + colNo + 4, currY + 3.5, { width: colDesc - 8, lineBreak: false, ellipsis: true });

            doc.font("Helvetica").fontSize(6).fillColor(C_DARK)
              .text(itemUnit, ML + colNo + colDesc, currY + 3.5, { width: colUnit, align: "center", lineBreak: false });

            doc.font("Courier").fontSize(6).fillColor(C_BLACK)
              .text(itemQty.toLocaleString(), ML + colNo + colDesc + colUnit, currY + 3.5, { width: colQty, align: "right", lineBreak: false });

            doc.font("Courier").fontSize(6).fillColor(C_BLACK)
              .text(itemRate.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), ML + colNo + colDesc + colUnit + colQty, currY + 3.5, { width: colRate - 4, align: "right", lineBreak: false });

            doc.font("Courier-Bold").fontSize(6.5).fillColor(C_BLACK)
              .text(rowTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), ML + colNo + colDesc + colUnit + colQty + colRate, currY + 3.5, { width: colAmount - 4, align: "right", lineBreak: false });

            currY += 13;
          });

          tradeIndex++;
        });
      }

      currY += 8;

      // -------------------------------------------------------------
      // 4. FINANCIAL SUMMARY TABLE (DIRECT + LABOR + PROF FEES + OCM)
      // -------------------------------------------------------------
      checkNewPage(85, false);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text("II. TURNKEY COST ACCOUNTING SUMMARY & CONTRACT VALUATION", ML, currY, { lineBreak: false });
      currY += 11;

      const drawSummaryRow = (label, basis, amount, isTotal = false) => {
        const rowHeight = isTotal ? 15 : 13;
        doc.save();
        if (isTotal) {
          doc.rect(ML, currY, CW, rowHeight).fillAndStroke("#e5e5e5", C_BLACK).lineWidth(1.2);
        } else {
          doc.rect(ML, currY, CW, rowHeight).strokeColor(C_BLACK).lineWidth(0.5).stroke();
        }
        doc.restore();

        const labelFont = isTotal ? "Helvetica-Bold" : "Helvetica";
        const valFont = isTotal ? "Courier-Bold" : "Courier-Bold";
        const fontSize = isTotal ? 7.5 : 6.5;

        doc.font(labelFont).fontSize(fontSize).fillColor(C_BLACK)
          .text(label, ML + 8, currY + (isTotal ? 4 : 3), { width: 250, lineBreak: false });

        doc.font("Helvetica-Oblique").fontSize(6).fillColor(C_GRAY)
          .text(basis || "", ML + 265, currY + (isTotal ? 4.5 : 3.5), { width: 130, lineBreak: false, ellipsis: true });

        doc.font(valFont).fontSize(fontSize).fillColor(C_BLACK)
          .text(formatCurrency(amount), ML + CW - 125, currY + (isTotal ? 4 : 3), { width: 120, align: "right", lineBreak: false });

        currY += rowHeight;
      };

      const laborDurationText = durationMonths >= 12
        ? `${formatDurationHuman(durationMonths)} (${durationMonths} Mos)`
        : `${durationMonths} ${durationMonths === 1 ? "Month" : "Months"}`;
      drawSummaryRow("1. Direct Materials Takeoff Total", "All trade categories sum", materialsTotal);
      drawSummaryRow("2. Direct Construction Labor Allocation", `${laborDurationText} Duration (${laborRateBasis})`, laborTotal);
      drawSummaryRow("3. Professional Architectural & Engineering Fees", "Architectural CAD, Structural Analysis & Supervision", profFeesTotal);
      drawSummaryRow("4. Contractor Overhead, Contingency & Profit (OCM)", `${contractorProfitPct.toFixed(1)}% Contractor Margin`, contractorProfitAmount);
      drawSummaryRow("TOTAL TURNKEY CONSTRUCTION INVESTMENT", "VAT-Inclusive Total Turnkey Package", totalAmount, true);

      currY += 8;

      // -------------------------------------------------------------
      // 5. CLIENT BUDGET ANALYSIS & VARIANCE SECTION
      // -------------------------------------------------------------
      checkNewPage(48, false);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text("III. CLIENT BUDGET COMPLIANCE & FINANCING EVALUATION", ML, currY, { lineBreak: false });
      currY += 11;

      const varBoxW = CW;
      const varBoxH = 32;
      doc.save().rect(ML, currY, varBoxW, varBoxH).strokeColor(C_BLACK).lineWidth(0.8).stroke().restore();

      const thirdW = varBoxW / 3;

      // Cell 1: Target Client Budget
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_GRAY)
        .text("CLIENT STATED TARGET BUDGET", ML + 6, currY + 4.5, { width: thirdW - 12, lineBreak: false });
      doc.font("Courier-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text(targetBudget > 0 ? formatCurrency(targetBudget) : "Flexible / Not Declared", ML + 6, currY + 15, { width: thirdW - 12, lineBreak: false });

      // Cell 2: Turnkey Quotation
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_GRAY)
        .text("MCPA CONTRACT QUOTATION", ML + thirdW + 6, currY + 4.5, { width: thirdW - 12, lineBreak: false });
      doc.font("Courier-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text(formatCurrency(totalAmount), ML + thirdW + 6, currY + 15, { width: thirdW - 12, lineBreak: false });

      // Cell 3: Variance & Evaluation
      const varPrefix = varianceAmount > 0 ? "+" : "";
      const varStatusText = targetBudget === 0
        ? "Quotation Baseline Established"
        : varianceAmount <= 0
        ? `[WITHIN TARGET BUDGET: ${Math.abs(variancePct).toFixed(1)}% SAVINGS]`
        : `[EXCEEDS TARGET BY: +${variancePct.toFixed(1)}%]`;

      doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_GRAY)
        .text("BUDGET VARIANCE & METRIC", ML + (thirdW * 2) + 6, currY + 4.5, { width: thirdW - 12, lineBreak: false });
      doc.font("Courier-Bold").fontSize(8).fillColor(C_BLACK)
        .text(`${varPrefix}${formatCurrency(varianceAmount)}  (${varPrefix}${variancePct.toFixed(1)}%)`, ML + (thirdW * 2) + 6, currY + 13.5, { width: thirdW - 12, lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(6).fillColor(C_BLACK)
        .text(varStatusText, ML + (thirdW * 2) + 6, currY + 23, { width: thirdW - 12, lineBreak: false });

      currY += varBoxH + 8;

      // -------------------------------------------------------------
      // 6. PROGRESSIVE MILESTONE BILLING SCHEDULE TABLE
      // -------------------------------------------------------------
      checkNewPage(42, false);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text("IV. PROGRESSIVE MILESTONE DISBURSEMENT SCHEDULE", ML, currY, { lineBreak: false });
      currY += 11;

      const drawMilestoneHeader = (y) => {
        doc.save().rect(ML, y, CW, 13).fillAndStroke(C_HEADER_BG, C_BLACK).restore();
        doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_BLACK);
        doc.text("MILESTONE STAGE", ML + 6, y + 3.5, { width: 140, lineBreak: false });
        doc.text("PERCENT (%)", ML + 150, y + 3.5, { width: 50, align: "center", lineBreak: false });
        doc.text("STAGE DISBURSEMENT", ML + 205, y + 3.5, { width: 100, align: "right", lineBreak: false });
        doc.text("CONDITIONS PRECEDENT / WORK SCOPE", ML + 315, y + 3.5, { width: CW - 320, lineBreak: false });
      };

      drawMilestoneHeader(currY);
      currY += 13;

      paymentMilestones.forEach((ms, msIdx) => {
        checkNewPage(13, false);
        const msPct = Number(ms.pct) || 0;
        const msAmount = (totalAmount * msPct) / 100;
        doc.save().rect(ML, currY, CW, 13).strokeColor(C_BLACK).lineWidth(0.3).stroke().restore();

        doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C_BLACK)
          .text(`${msIdx + 1}. ${ms.stage || "Project Milestone"}`, ML + 6, currY + 3.5, { width: 140, lineBreak: false, ellipsis: true });

        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_BLACK)
          .text(`${msPct.toFixed(0)}%`, ML + 150, currY + 3.5, { width: 50, align: "center", lineBreak: false });

        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_BLACK)
          .text(formatCurrency(msAmount), ML + 205, currY + 3.5, { width: 100, align: "right", lineBreak: false });

        doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
          .text(ms.scope || "Verified on-site progress accomplishment inspection", ML + 315, currY + 3.5, { width: CW - 320, lineBreak: false, ellipsis: true });

        currY += 13;
      });

      currY += 8;

      // -------------------------------------------------------------
      // 7. CONTRACT TERMS, EXCLUSIONS & SPECIAL PROVISIONS
      // -------------------------------------------------------------
      checkNewPage(48, false);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C_BLACK)
        .text("V. SPECIAL TERMS, INCLUSIONS & REGULATORY PROVISIONS", ML, currY, { lineBreak: false });
      currY += 9;

      const durationTermStr = durationMonths >= 12
        ? `${formatDurationHuman(durationMonths)} (${durationMonths} active construction months)`
        : `${durationMonths} active construction ${durationMonths === 1 ? "month" : "months"}`;
      const termsText = 
        `1. SCOPE OF SERVICES: The pricing in this document reflects standard turnkey engineering and architectural delivery per National Building Code of the Philippines (PD 1096) and NSCP 2015.\n` +
        `2. STABILITY INDEX: Material rates are locked for 30 calendar days from quotation date. Labor duration is scheduled for ${durationTermStr}.\n` +
        `3. PROGRESS VERIFICATION: All milestone billings are supported by on-site photographic inspection logs verified by the Lead Engineer prior to billing issuance.\n` +
        `4. ESTIMATOR NOTES: ${adminNotes}`;

      doc.font("Helvetica").fontSize(6.5).fillColor(C_DARK)
        .text(termsText, ML, currY, { width: CW, lineGap: 2.5 });
      currY += 38;

      // -------------------------------------------------------------
      // 8. SIGNATURE & CONFORME SECTION
      // -------------------------------------------------------------
      checkNewPage(56, false);
      const sigBoxW = (CW - 16) / 2;
      const sigY = currY + 6;

      // Engineer / Contractor Signature Box
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C_GRAY)
        .text("PREPARED AND CERTIFIED BY:", ML, sigY, { lineBreak: false });
      doc.save().strokeColor(C_BLACK).lineWidth(0.8).moveTo(ML, sigY + 30).lineTo(ML + sigBoxW, sigY + 30).stroke().restore();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C_BLACK)
        .text("ENGR. RAYMART QUIRANTE", ML, sigY + 34, { lineBreak: false });
      doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
        .text("Lead Civil Engineer & Construction Project Manager\nPRC License No. 0184920  |  PTR No. 9284102-Plaridel", ML, sigY + 43);

      // Client Conforme Box
      const clientSigX = ML + sigBoxW + 16;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C_GRAY)
        .text("CONFORMED AND ACCEPTED BY:", clientSigX, sigY, { lineBreak: false });
      doc.save().strokeColor(C_BLACK).lineWidth(0.8).moveTo(clientSigX, sigY + 30).lineTo(clientSigX + sigBoxW, sigY + 30).stroke().restore();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C_BLACK)
        .text(clientName.toUpperCase(), clientSigX, sigY + 34, { width: sigBoxW, lineBreak: false, ellipsis: true });
      doc.font("Helvetica").fontSize(6.5).fillColor(C_GRAY)
        .text("Client / Property Owner\nDate Conformed: ___________________________", clientSigX, sigY + 43);

      // -------------------------------------------------------------
      // 9. DYNAMIC MULTI-PAGE NUMBERING FOOTER
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        // Temporarily zero bottom margin so absolute positioning in footer never triggers automatic page overflow
        doc.page.margins.bottom = 0;

        const footerY = PH - 22;

        doc.save().strokeColor(C_BLACK).lineWidth(0.5).moveTo(ML, footerY - 4).lineTo(PW - MR, footerY - 4).stroke().restore();

        doc.font("Courier").fontSize(6).fillColor(C_LIGHT_GRAY)
          .text(`MCPA Quotation Reference: ${quotationRef}   •   Confidential & Proprietary`, ML, footerY, { width: 340, lineBreak: false });

        doc.font("Courier-Bold").fontSize(6.5).fillColor(C_BLACK)
          .text(`Page ${i + 1} of ${totalPages}`, PW - MR - 100, footerY, { width: 100, align: "right", lineBreak: false });
      }

      doc.end();
    } catch (err) {
      console.error("[quotationPdfService] Error generating PDF:", err);
      reject(err);
    }
  });
}

module.exports = {
  generateQuotationPdf,
};
