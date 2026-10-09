const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");
const emailService = require("../services/emailService");

async function runQa() {
  console.log("=== MCPA INQUIRY END-TO-END QA TEST ===");
  try {
    const testSubmissionId = "MCPA-QA-" + Math.floor(100000 + Math.random() * 900000);
    console.log("[QA 1/5] Inserting inquiry into PostgreSQL:", testSubmissionId);

    const insertRes = await db.query(
      `INSERT INTO client_briefs (
        submission_id, client_name, client_email, client_phone,
        project_type, preferred_style, budget_range, lot_status,
        lot_area, target_date, location, financing_option,
        uploaded_files, status, location_type, meeting_mode,
        meeting_date, meeting_time, map_coordinates,
        user_id, wants_meeting, venue_type, venue_details, availability_status,
        storeys, site_address_details, spatial_wishlist, message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review', $14, $15, $16, $17, $18, $19, $20, $21, $22, 'Pending Availability Confirmation', $23, $24, $25, $26)
      RETURNING *`,
      [
        testSubmissionId,
        "Engr. Juan Dela Cruz",
        "qa-tester@mcpa.com",
        "+63 912 345 6789",
        "Residential Design & Build",
        "Modern Contemporary",
        "Flexible / As per design",
        "Already Owned / Titled",
        "240 sqm",
        "Within 3 Months",
        "Plaridel, Bulacan",
        "Milestone Progress Billing",
        [],
        "Local",
        "In-Person (Coffee Shop)",
        "2026-10-15",
        "Morning Slot (09:00 AM)",
        "14.8872, 120.8572",
        null,
        true,
        "Coffee Shop",
        "Starbucks — WalterMart Plaridel",
        "2-Storey",
        JSON.stringify({ address: "Km 42 Cagayan Valley Rd", city: "Plaridel", province: "Bulacan" }),
        JSON.stringify({ bedrooms: "4", bathrooms: "3", carGarage: "2 Cars", featureTags: ["balcony", "high_ceiling"] }),
        "Please bring sample finishes and materials catalogue to the consultation."
      ]
    );

    const saved = insertRes.rows[0];
    console.log("✓ Success: Brief created in DB with ID:", saved.brief_id);
    console.log("  - Submission ID:", saved.submission_id);
    console.log("  - Meeting Mode:", saved.meeting_mode);
    console.log("  - Venue Type:", saved.venue_type);
    console.log("  - Venue Details:", saved.venue_details);
    console.log("  - Storeys:", saved.storeys);

    console.log("\n[QA 2/5] Testing Inquiry Receipt Document Email generation...");
    await emailService.sendInquiryClientReceipt("qa-tester@mcpa.com", saved);
    console.log("✓ Success: Document-style Inquiry Receipt Email rendered and processed.");

    console.log("\n[QA 3/5] Simulating Admin Pipeline Query (GET /api/briefs)...");
    const fetchRes = await db.query(
      "SELECT * FROM client_briefs WHERE submission_id = $1",
      [testSubmissionId]
    );
    if (!fetchRes.rows.length) {
      throw new Error("Brief could not be fetched by submission_id!");
    }
    const retrieved = fetchRes.rows[0];
    console.log("✓ Success: Retrieved brief from DB successfully:");
    console.log("  - Retrieved client:", retrieved.client_name);
    console.log("  - Retrieved venue:", retrieved.venue_details);

    console.log("\n[QA 4/5] Simulating Admin Approval (PATCH /api/briefs/:id)...");
    const updateRes = await db.query(
      `UPDATE client_briefs SET
        status = 'Under Review',
        meeting_date = '2026-10-15',
        meeting_time = '09:00 AM - 10:30 AM',
        meeting_link = 'Starbucks — WalterMart Plaridel, Plaridel, Bulacan',
        meeting_notes = 'Assigned Architect: Arch. Roberto Santos. Physical dossier prepared.'
      WHERE brief_id = $1
      RETURNING *`,
      [saved.brief_id]
    );
    const updated = updateRes.rows[0];
    console.log("✓ Success: Status updated to:", updated.status);
    console.log("  - Confirmed Venue/Link:", updated.meeting_link);

    console.log("\n[QA 5/5] Testing Consultation Confirmation Email dispatch...");
    await emailService.sendInquiryMeetingConfirmation("qa-tester@mcpa.com", updated);
    console.log("✓ Success: Meeting Confirmation Email rendered and processed.");

    // Clean up
    console.log("\n[Cleanup] Removing temporary QA brief...");
    await db.query("DELETE FROM client_briefs WHERE brief_id = $1", [saved.brief_id]);
    console.log("✓ Cleaned up test record.");

    console.log("\n==========================================");
    console.log("🎉 ALL QA TESTS PASSED PERFECTLY (100% OK)");
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ QA Test Failed:", err);
    process.exit(1);
  }
}

runQa();
