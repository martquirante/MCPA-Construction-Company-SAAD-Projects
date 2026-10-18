const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const emailService = require("../services/emailService");

async function main() {
  const targetEmail = "rayquirante@gmail.com";
  console.log(`\n============================================================`);
  console.log(`  MCPA CONSULTATION CONFIRMATION TEST EMAIL`);
  console.log(`  Target:    ${targetEmail}`);
  console.log(`  Engine:    ${emailService.primaryProvider} SMTP`);
  console.log(`============================================================\n`);

  const mockBrief = {
    submission_id: "MCPA-CPB-892144",
    client_name: "Raymart Quirante",
    client_email: targetEmail,
    project_type: "Residential Custom Design & Build",
    meeting_date: "2026-10-22",
    meeting_time: "02:00 PM - 03:30 PM PHT",
    meeting_mode: "Online Video Call",
    meeting_notes: "Discussion on architectural blueprints, site requirements, and spatial layout planning.",
  };

  try {
    console.log("➡️ Dispatching consultation confirmation email...");
    const result = await emailService.sendInquiryMeetingConfirmation(targetEmail, mockBrief);
    console.log("\n✅ Dispatch result:", result);
    console.log("🎉 Consultation email sent to " + targetEmail + " successfully!\n");
  } catch (err) {
    console.error("❌ Error dispatching email:", err);
    process.exit(1);
  }
}

main();
