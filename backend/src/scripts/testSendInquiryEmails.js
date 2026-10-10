require("dotenv").config();
const emailService = require("../services/emailService");

async function runTest() {
  const targetEmail = "rayquirante@gmail.com";
  console.log(`\n============================================================`);
  console.log(`  MCPA INQUIRY LIFECYCLE EMAIL TEST RUNNER`);
  console.log(`  Recipient: ${targetEmail}`);
  console.log(`  Engine:    ${emailService.primaryProvider} SMTP (with Resend Failover)`);
  console.log(`============================================================\n`);

  const randomRef = "MCPA-CPB-" + Math.floor(100000 + Math.random() * 900000);
  const mockBrief = {
    submission_id: randomRef,
    client_name: "Raymart Quirante",
    client_email: targetEmail,
    client_phone: "+63 938 876 3473",
    project_type: "Residential",
    preferred_style: "Minimalist Japanese Zen",
    storeys: "2-Storey (Standard)",
    location: "Brgy. San Rafael V, City of San Jose Del Monte, Bulacan",
    budget_range: "Mid-Luxury Architectural Build (₱5.5M - ₱8.5M)",
    meeting_mode: "Online Video Call",
    meeting_date: "2026-10-15",
    meeting_time: "02:00 PM - 03:30 PM PHT",
    meeting_link: "https://meet.google.com/mcp-buil-tab",
    meeting_notes: "Focus on Zen garden integration, open courtyard layout, and energy-efficient cross-ventilation.",
  };

  try {
    // 1. INQUIRY SUBMISSION / UNDER REVIEW
    console.log("➡️ [1/4] Sending: 1. Inquiry Received & Under Review Receipt...");
    const res1 = await emailService.sendInquiryClientReceipt(targetEmail, mockBrief);
    console.log(`✅ [1/4] Result: ${res1 ? "Delivered" : "Queued"}`);

    // Wait 2.5 seconds between dispatches to respect rate limits
    await new Promise((r) => setTimeout(r, 2500));

    // 2. CONSULTATION CONFIRMED & SCHEDULED
    console.log("\n➡️ [2/4] Sending: 2. Consultation Confirmed & Scheduled...");
    const res2 = await emailService.sendInquiryMeetingConfirmation(targetEmail, mockBrief);
    console.log(`✅ [2/4] Result: ${res2 ? "Delivered" : "Queued"}`);

    await new Promise((r) => setTimeout(r, 2500));

    // 3. CONSULTATION RESCHEDULED
    console.log("\n➡️ [3/4] Sending: 3. Consultation Rescheduled Notification...");
    const res3 = await emailService.sendInquiryRescheduled(targetEmail, mockBrief, {
      meetingDate: "2026-10-18",
      meetingTime: "10:00 AM - 11:30 AM PHT",
      previousMeetingDate: "2026-10-15",
      previousMeetingTime: "02:00 PM - 03:30 PM PHT",
      meetingMode: "Online Video Call",
      meetingLink: "https://meet.google.com/mcp-buil-tab",
      rescheduleReason: "Lead Architect On-Site Structural Inspection Conflict",
      rescheduleNotes: "Moved to morning session to provide uninterrupted architectural design consultation.",
    });
    console.log(`✅ [3/4] Result: ${res3 ? "Delivered" : "Queued"}`);

    await new Promise((r) => setTimeout(r, 2500));

    // 4. INQUIRY DECLINED / REJECTED NOTICE
    console.log("\n➡️ [4/4] Sending: 4. Inquiry Status Notice (Declined / Rejected)...");
    const res4 = await emailService.sendInquiryRejected(targetEmail, mockBrief, {
      rejectionReason: "Location Outside Immediate Construction Service Zone",
      rejectionNotes: "Current active project density is focused exclusively on Plaridel, Malolos, and Guiguinto sectors.",
    });
    console.log(`✅ [4/4] Result: ${res4 ? "Delivered" : "Queued"}`);

    console.log("\n🎉 ALL 4 INQUIRY LIFECYCLE TEST EMAILS COMPLETED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("❌ Test dispatch error:", err);
  }
}

runTest();
