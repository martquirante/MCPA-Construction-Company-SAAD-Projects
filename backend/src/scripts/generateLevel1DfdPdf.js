const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const outputPath = path.resolve(__dirname, "../../../public/Level_1_DFD_BuildSync_Specification.pdf");

// Ensure public dir exists
const publicDir = path.dirname(outputPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create document
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 36, bottom: 36, left: 36, right: 36 },
  info: {
    Title: "Level 1 Data Flow Diagram (DFD) Specification - BuildSync / MCPA",
    Author: "Raymart Quirante / SAAD Team",
    Subject: "System Analysis and Design - Process Decomposition and Balancing",
    Keywords: "DFD, Level 1 DFD, SAAD, BuildSync, MCPA, Data Flow Diagram"
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const primaryDark = "#0f172a";
const slateBorder = "#cbd5e1";
const amberAccent = "#d97706";
const textMuted = "#475569";
const bgLight = "#f8fafc";

function drawHeader(pageTitle, pageNumber, totalPages = 3) {
  doc.rect(36, 36, 523, 48).lineWidth(1.5).strokeColor(primaryDark).fillColor("#f1f5f9").fillAndStroke();
  
  doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
  doc.text("BUILDSYNC / MCPA ARCHITECTURAL DOSSIER", 46, 45);
  doc.fontSize(8).font("Helvetica").fillColor(textMuted);
  doc.text("SYSTEM ANALYSIS & DESIGN (SAAD) • LEVEL 1 DFD SPECIFICATION", 46, 58);
  doc.text(`REF: SAAD-DFD-LVL1-2026 | PAGE ${pageNumber} OF ${totalPages}`, 46, 68);

  doc.fontSize(9).font("Helvetica-Bold").fillColor(amberAccent);
  doc.text(pageTitle.toUpperCase(), 350, 48, { width: 200, align: "right" });
  doc.moveDown();
}

function drawFooter(pageNumber, totalPages = 3) {
  doc.rect(36, 800, 523, 0.5).strokeColor(slateBorder).stroke();
  doc.fontSize(8).font("Helvetica").fillColor(textMuted);
  doc.text("CONFIDENTIAL & PROPRIETARY — ACADEMIC & ARCHITECTURAL SYSTEM DESIGN REVIEW", 36, 806);
  doc.text(`Page ${pageNumber} of ${totalPages}`, 480, 806, { width: 75, align: "right" });
}

// ================= PAGE 1 =================
drawHeader("1. System Decomposition", 1, 3);

doc.y = 96;

doc.fontSize(16).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("LEVEL 1 DATA FLOW DIAGRAM (DFD) SPECIFICATION");
doc.fontSize(10).font("Helvetica").fillColor(textMuted);
doc.text("System: BuildSync — A Web-Based Construction Tracking and Client Management System");
doc.text("Decomposition Baseline: Context Diagram (Level 0 DFD)");
doc.moveDown(0.8);

// Intro Box
doc.rect(36, doc.y, 523, 44).fillColor(bgLight).strokeColor(slateBorder).lineWidth(1).fillAndStroke();
doc.y += 6;
doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(primaryDark);
doc.text("This specification decomposes central process 0.0 into six (6) discrete, balanced Level 1 processes. All incoming and outgoing data flows from External Entities (Client, Staff, Administrator) are 100% mathematically balanced against the Level 0 Context Diagram.", 46, doc.y, { width: 503 });
doc.y += 24;

// Section 1: External Entities & Data Stores
doc.moveDown(0.6);
doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("1. SYSTEM ENTITIES & PERSISTENT DATA STORES");
doc.rect(36, doc.y + 2, 523, 1).fillColor(primaryDark).fill();
doc.moveDown(0.5);

doc.fontSize(8.5).font("Helvetica");
const entitiesData = [
  { name: "CLIENT", desc: "Prospective/active clients submitting inquiries, lot surveys, viewing quotations & progress." },
  { name: "STAFF", desc: "Architects, engineers & draftsmen handling CAD plans, takeoff BOQ, and site inspections." },
  { name: "ADMINISTRATOR", desc: "Firm executives approving contracts, reviewing inquiries, assigning roles, and monitoring LGU clearance." }
];

entitiesData.forEach(e => {
  doc.font("Helvetica-Bold").fillColor(amberAccent).text(`• [ENTITY] ${e.name}: `, { continued: true });
  doc.font("Helvetica").fillColor(primaryDark).text(e.desc);
});
doc.moveDown(0.4);

const storesData = [
  { id: "D1", name: "User Accounts & Authentication Store", tbl: "public.users, public.otp_codes" },
  { id: "D2", name: "Project Inquiries & Site Feasibility Store", tbl: "public.client_briefs" },
  { id: "D3", name: "Consultation & Meeting Schedules Store", tbl: "public.client_briefs, meeting_history" },
  { id: "D4", name: "Blueprints, BOQ & Quotations Store", tbl: "public.quotations, cloud_blueprints" },
  { id: "D5", name: "Construction Tracking & Compliance Store", tbl: "public.site_projects, site_milestones, photo_logs, delay_events" },
  { id: "D6", name: "Project Showcase & Portfolio Store", tbl: "public.projects" }
];

storesData.forEach(s => {
  doc.font("Helvetica-Bold").fillColor(primaryDark).text(`• [DATA STORE ${s.id}] ${s.name}: `, { continued: true });
  doc.font("Courier").fillColor(textMuted).text(`(${s.tbl})`);
});

// Section 2: Level 1 Processes
doc.moveDown(0.6);
doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("2. DECOMPOSED LEVEL 1 PROCESSES (1.0 TO 3.0)");
doc.rect(36, doc.y + 2, 523, 1).fillColor(primaryDark).fill();
doc.moveDown(0.4);

function renderProcessBox(id, title, desc, inputs, outputs, store) {
  const boxTop = doc.y;
  doc.rect(36, boxTop, 523, 82).fillColor("#ffffff").strokeColor(slateBorder).lineWidth(1).fillAndStroke();
  doc.rect(36, boxTop, 4, 82).fillColor(primaryDark).fill();
  
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor(primaryDark);
  doc.text(`PROCESS ${id}: ${title.toUpperCase()}`, 48, boxTop + 8);
  
  doc.fontSize(7.5).font("Helvetica").fillColor(textMuted);
  doc.text(desc, 48, boxTop + 22, { width: 495 });
  
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(amberAccent);
  doc.text("INCOMING FLOWS: ", 48, boxTop + 40, { continued: true });
  doc.font("Helvetica").fillColor(primaryDark).text(inputs, { width: 495 });
  
  doc.font("Helvetica-Bold").fillColor("#059669");
  doc.text("OUTGOING FLOWS: ", 48, boxTop + 54, { continued: true });
  doc.font("Helvetica").fillColor(primaryDark).text(outputs, { width: 495 });

  doc.font("Courier-Bold").fillColor(textMuted);
  doc.text(`PERSISTENCE: ${store}`, 48, boxTop + 68);

  doc.y = boxTop + 88;
}

renderProcessBox(
  "1.0",
  "User Authentication & Account Management",
  "Handles multi-role credential verification, email OTP validation, face liveness KYC, and account status management.",
  "Client: Reg Details, OTP Code, Login | Staff: Login | Admin: Login, Client Account Data",
  "Client: Reg Status, Verification Status, Auth Status | Staff: Auth Status | Admin: Auth Status, Client Account Info",
  "D1: User Accounts & Authentication Store"
);

renderProcessBox(
  "2.0",
  "Project Inquiry & Site Feasibility Processing",
  "Processes client inquiry submissions, lot GPS coordinates, zoning constraints, budget ranges, and architect reviews.",
  "Client: Inquiry Details, Site Details, Requirements & Budget | Admin: Inquiry Review & Status Update",
  "Client: Inquiry Submission Status, Site Feasibility Report | Admin: Updated Inquiry Pipeline Data",
  "D2: Project Inquiries & Site Feasibility Store"
);

renderProcessBox(
  "3.0",
  "Consultation & Meeting Scheduling",
  "Orchestrates face-to-face and native WebRTC video appointments, calendar coordination, and meeting room codes.",
  "Client: Consultation Booking Details | Admin: Meeting & Consultation Details",
  "Client: Booking Confirmation and Schedule | Admin: Consultation Schedule Confirmation",
  "D3: Consultation & Meeting Schedules Store"
);

drawFooter(1, 3);

// ================= PAGE 2 =================
doc.addPage();
drawHeader("2. Processes & Topology", 2, 3);
doc.y = 96;

doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("DECOMPOSED LEVEL 1 PROCESSES (4.0 TO 6.0)");
doc.rect(36, doc.y + 2, 523, 1).fillColor(primaryDark).fill();
doc.moveDown(0.4);

renderProcessBox(
  "4.0",
  "Design Blueprint, Costing & Quotation Management",
  "Computes material quantities, BOQ drafts, cost estimations, and architectural technical blueprint updates.",
  "Staff: Budget & Quotation Data, Takeoff Data, Blueprint Updates | Admin: Budget & Quotation Data",
  "Client: Preliminary Cost Estimation | Staff: Schematics, Itemized BOQ, Cost Estimates | Admin: Quotation Records",
  "D4: Blueprints, BOQ & Quotations Store"
);

renderProcessBox(
  "5.0",
  "Construction Tracking, Site Progress & Compliance Management",
  "Coordinates site milestones, inspection photo logs, on-site weather monitoring, and LGU permits & clearance approvals.",
  "Staff: Project Data, LGU Clearances, Site Logs | Admin: Permit Data, Site Progress Updates",
  "Staff: Submission Status, LGU Status View, Project Info | Admin: LGU Records, Site Logs & Progress Reports",
  "D5: Construction Tracking & Compliance Store"
);

renderProcessBox(
  "6.0",
  "Project Showcase & Public Catalog Management",
  "Manages public display of completed projects, architectural gallery media, and portfolio achievements.",
  "Admin: Project Showcase Management Data",
  "Admin: Project Showcase Information",
  "D6: Project Showcase & Portfolio Store"
);

doc.moveDown(0.5);
doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("3. LEVEL 1 ARCHITECTURAL DATA FLOW TOPOLOGY (DIAGRAM)");
doc.rect(36, doc.y + 2, 523, 1).fillColor(primaryDark).fill();
doc.moveDown(0.4);

// Topology Schematic Box
const diagTop = doc.y;
doc.rect(36, diagTop, 523, 310).fillColor("#ffffff").strokeColor(slateBorder).lineWidth(1).fillAndStroke();

doc.font("Courier").fontSize(6.8).fillColor(primaryDark);
const asciiArt = [
  "   [ CLIENT ]                               [ PROCESSES (1.0 - 6.0) ]                                [ DATA STORES ]",
  "       │                                                │                                                   │",
  "       ├──( Reg Details, OTP, Login )──────────────────►│ 1.0 USER AUTHENTICATION & KYC ◄──────────────────►│ D1: User Accounts Store",
  "       │◄─( Reg Status, Auth Status )───────────────────┤                                                   │",
  "       │                                                │                                                   │",
  "       ├──( Inquiry, GPS Site Specs, Budget )──────────►│ 2.0 INQUIRY & FEASIBILITY ◄──────────────────────►│ D2: Inquiries & Site Store",
  "       │◄─( Submission Status, Feasibility Report )─────┤                                                   │",
  "       │                                                │                                                   │",
  "       ├──( Consultation Booking Details )─────────────►│ 3.0 CONSULTATION & MEETINGS ◄────────────────────►│ D3: Meeting Schedules Store",
  "       │◄─( Booking Confirmation & Schedule )───────────┤                                                   │",
  "       │                                                │                                                   │",
  "       │◄─( Preliminary Cost Estimation )───────────────┤ 4.0 BLUEPRINT, BOQ & QUOTES ◄────────────────────►│ D4: Blueprints & BOQ Store",
  "       │                                                │                                                   │",
  "   [ STAFF ]                                            │                                                   │",
  "       │                                                │                                                   │",
  "       ├──( Staff Login Credentials )──────────────────►│ 1.0 USER AUTHENTICATION & KYC                     │",
  "       │◄─( Staff Auth Status )─────────────────────────┤                                                   │",
  "       ├──( Budget, Takeoff Data, Blueprint Updates )──►│ 4.0 BLUEPRINT, BOQ & QUOTES                       │",
  "       │◄─( Schematics, Itemized BOQ, Cost Estimates )──┤                                                   │",
  "       ├──( Project Data, LGU Clearances, Site Logs )──►│ 5.0 CONSTRUCTION & COMPLIANCE ◄──────────────────►│ D5: Site Progress Store",
  "       │◄─( Submission Status, LGU Status, Project Info)┤                                                   │",
  "       │                                                │                                                   │",
  "   [ ADMIN ]                                            │                                                   │",
  "       ├──( Admin Login, Client Account Data )─────────►│ 1.0 USER AUTHENTICATION & KYC                     │",
  "       │◄─( Admin Auth Status, Client Account Info )────┤                                                   │",
  "       ├──( Inquiry Review & Status Updates )──────────►│ 2.0 INQUIRY & FEASIBILITY                         │",
  "       │◄─( Updated Inquiry Pipeline Data )─────────────┤                                                   │",
  "       ├──( Meeting & Consultation Details )───────────►│ 3.0 CONSULTATION & MEETINGS                       │",
  "       │◄─( Consultation Schedule Confirmation )────────┤                                                   │",
  "       ├──( Budget & Quotation Data )──────────────────►│ 4.0 BLUEPRINT, BOQ & QUOTES                       │",
  "       │◄─( Budget & Quotation Records )────────────────┤                                                   │",
  "       ├──( Permit Data, Site Progress Updates )───────►│ 5.0 CONSTRUCTION & COMPLIANCE                     │",
  "       │◄─( LGU Compliance Records, Updated Site Logs )─┤                                                   │",
  "       ├──( Project Showcase Management Data )─────────►│ 6.0 PROJECT SHOWCASE ◄───────────────────────────►│ D6: Project Showcase Store",
  "       │◄─( Project Showcase Information )──────────────┴───────────────────────────────────────────────────┘"
];

let artY = diagTop + 8;
asciiArt.forEach(line => {
  doc.text(line, 42, artY);
  artY += 8.6;
});

drawFooter(2, 3);

// ================= PAGE 3 =================
doc.addPage();
drawHeader("3. Balancing Matrix", 3, 3);
doc.y = 96;

doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryDark);
doc.text("4. LEVEL 0 VS LEVEL 1 DATA FLOW BALANCING VERIFICATION MATRIX");
doc.rect(36, doc.y + 2, 523, 1).fillColor(primaryDark).fill();
doc.moveDown(0.4);

// Table Header
const tTop = doc.y;
doc.rect(36, tTop, 523, 18).fillColor(primaryDark).fill();
doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#ffffff");
doc.text("DATA FLOW LABEL (FROM LEVEL 0 CONTEXT)", 42, tTop + 5);
doc.text("LEVEL 0 BOUNDARY", 250, tTop + 5);
doc.text("LEVEL 1 DECOMPOSED PATH", 370, tTop + 5);
doc.text("STATUS", 495, tTop + 5);

const balancingRows = [
  { flow: "Account Registration Details", l0: "Client -> 0.0", l1: "Client -> P1.0" },
  { flow: "Email Verification Code", l0: "Client -> 0.0", l1: "Client -> P1.0" },
  { flow: "Login Credentials (Client)", l0: "Client -> 0.0", l1: "Client -> P1.0" },
  { flow: "Account Registration Status", l0: "0.0 -> Client", l1: "P1.0 -> Client" },
  { flow: "Verification Status", l0: "0.0 -> Client", l1: "P1.0 -> Client" },
  { flow: "Authentication Status (Client)", l0: "0.0 -> Client", l1: "P1.0 -> Client" },
  { flow: "Project Inquiry Details", l0: "Client -> 0.0", l1: "Client -> P2.0" },
  { flow: "Project Site Details", l0: "Client -> 0.0", l1: "Client -> P2.0" },
  { flow: "Project Requirements and Budget", l0: "Client -> 0.0", l1: "Client -> P2.0" },
  { flow: "Inquiry Submission Status", l0: "0.0 -> Client", l1: "P2.0 -> Client" },
  { flow: "Site Feasibility Report", l0: "0.0 -> Client", l1: "P2.0 -> Client" },
  { flow: "Preliminary Cost Estimation", l0: "0.0 -> Client", l1: "P4.0 -> Client" },
  { flow: "Consultation Booking Details", l0: "Client -> 0.0", l1: "Client -> P3.0" },
  { flow: "Booking Confirmation and Schedule", l0: "0.0 -> Client", l1: "P3.0 -> Client" },
  { flow: "Staff Login Credentials", l0: "Staff -> 0.0", l1: "Staff -> P1.0" },
  { flow: "Staff Authentication Status", l0: "0.0 -> Staff", l1: "P1.0 -> Staff" },
  { flow: "Blueprint and Technical Plan Updates", l0: "Staff -> 0.0", l1: "Staff -> P4.0" },
  { flow: "Material and Quantity Takeoff Data", l0: "Staff -> 0.0", l1: "Staff -> P4.0" },
  { flow: "Budget and Quotation Data (Staff)", l0: "Staff -> 0.0", l1: "Staff -> P4.0" },
  { flow: "Interactive Design Schematics", l0: "0.0 -> Staff", l1: "P4.0 -> Staff" },
  { flow: "Itemized BOQ Draft", l0: "0.0 -> Staff", l1: "P4.0 -> Staff" },
  { flow: "Cost Estimates & Quotation Records", l0: "0.0 -> Staff", l1: "P4.0 -> Staff" },
  { flow: "Project Management Data", l0: "Staff -> 0.0", l1: "Staff -> P5.0" },
  { flow: "LGU Clearance Submissions", l0: "Staff -> 0.0", l1: "Staff -> P5.0" },
  { flow: "Site Photos and Progress Logs", l0: "Staff -> 0.0", l1: "Staff -> P5.0" },
  { flow: "Submission Confirmation and Status", l0: "0.0 -> Staff", l1: "P5.0 -> Staff" },
  { flow: "LGU Compliance Status View", l0: "0.0 -> Staff", l1: "P5.0 -> Staff" },
  { flow: "Project Information and Status", l0: "0.0 -> Staff", l1: "P5.0 -> Staff" },
  { flow: "Administrator Login Credentials", l0: "Admin -> 0.0", l1: "Admin -> P1.0" },
  { flow: "Client Account Management Data", l0: "Admin -> 0.0", l1: "Admin -> P1.0" },
  { flow: "Admin Authentication Status", l0: "0.0 -> Admin", l1: "P1.0 -> Admin" },
  { flow: "Client Account Information", l0: "0.0 -> Admin", l1: "P1.0 -> Admin" },
  { flow: "Inquiry Review and Status Update", l0: "Admin -> 0.0", l1: "Admin -> P2.0" },
  { flow: "Updated Inquiry Pipeline Data", l0: "0.0 -> Admin", l1: "P2.0 -> Admin" },
  { flow: "Meeting and Consultation Details", l0: "Admin -> 0.0", l1: "Admin -> P3.0" },
  { flow: "Consultation Schedule Confirmation", l0: "0.0 -> Admin", l1: "P3.0 -> Admin" },
  { flow: "Budget and Quotation Data (Admin)", l0: "Admin -> 0.0", l1: "Admin -> P4.0" },
  { flow: "Budget and Quotation Records", l0: "0.0 -> Admin", l1: "P4.0 -> Admin" },
  { flow: "Document & Permit Management Data", l0: "Admin -> 0.0", l1: "Admin -> P5.0" },
  { flow: "Project & Site Progress Updates", l0: "Admin -> 0.0", l1: "Admin -> P5.0" },
  { flow: "LGU Compliance Records", l0: "0.0 -> Admin", l1: "P5.0 -> Admin" },
  { flow: "Updated Site Logs & Progress Reports", l0: "0.0 -> Admin", l1: "P5.0 -> Admin" },
  { flow: "Project Showcase Management Data", l0: "Admin -> 0.0", l1: "Admin -> P6.0" },
  { flow: "Project Showcase Information", l0: "0.0 -> Admin", l1: "P6.0 -> Admin" }
];

let curY = tTop + 18;
balancingRows.forEach((row, idx) => {
  const isEven = idx % 2 === 0;
  doc.rect(36, curY, 523, 14).fillColor(isEven ? "#ffffff" : bgLight).fill();
  
  doc.fontSize(7).font("Helvetica").fillColor(primaryDark);
  doc.text(row.flow, 42, curY + 3.5, { width: 200 });
  
  doc.font("Courier").fillColor(textMuted);
  doc.text(row.l0, 250, curY + 3.5);
  doc.text(row.l1, 370, curY + 3.5);

  doc.font("Helvetica-Bold").fillColor("#059669");
  doc.text("BALANCED", 495, curY + 3.5);

  curY += 14;
});

// Final signoff
doc.y = curY + 12;
doc.fontSize(8).font("Helvetica-Oblique").fillColor(textMuted);
doc.text("Audit Verdict: All forty-four (44) data flows are strictly conserved with zero dangling sinks or orphaned sources.", 36, doc.y, { align: "center" });

drawFooter(3, 3);

// Finalize
doc.end();

writeStream.on("finish", () => {
  console.log("PDF generated successfully at:", outputPath);
});
