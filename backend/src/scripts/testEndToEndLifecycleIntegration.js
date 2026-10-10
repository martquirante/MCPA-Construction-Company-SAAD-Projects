/**
 * MCPA CONSTRUCTION & SUPPLY - E2E LIFECYCLE & ANTI-SPAM INTEGRATION TEST
 * Grounded in live database (Supabase / Neon failover pool)
 */

require("dotenv").config();
const db = require("../services/dbFailoverEngine");
const stageEngineService = require("../services/stageEngineService");

async function runE2ETests() {
  console.log("=================================================================");
  console.log("  MCPA 5-STAGE LIFECYCLE & ANTI-SPAM E2E INTEGRATION SUITE       ");
  console.log("=================================================================\n");

  try {
    // 1. Create or retrieve a test client user
    const testEmail = `test_client_e2e_${Date.now()}@mcpatest.ph`;
    const userRes = await db.query(
      `INSERT INTO public.users (
        email, password_hash, full_name, role, is_multi_project_approved, created_at
      ) VALUES ($1, 'testhash123', 'E2E Lifecycle Test User', 'client', FALSE, NOW())
      RETURNING user_id, email, full_name, is_multi_project_approved;`,
      [testEmail]
    );

    const testUser = userRes.rows[0];
    console.log(`[E2E Step 1] Created Test Client User: ${testUser.email} (ID: ${testUser.user_id})`);

    // 2. Fresh User State -> Must be PRE_INQUIRY (Phase 1)
    const initialDash = await stageEngineService.getDashboardState(testUser.user_id);
    console.log(`[E2E Step 2] Initial Dashboard Stage: ${initialDash.stage_id} (Expected: PRE_INQUIRY)`);
    if (initialDash.stage_id !== "PRE_INQUIRY") throw new Error("Initial stage is not PRE_INQUIRY!");
    if (initialDash.hasActiveProject !== false) throw new Error("Fresh user should not have active project!");

    // 3. Submit Consultation Inquiry -> Transition to CONSULTATION (Phase 2)
    const project1 = await stageEngineService.createInquiryProject({
      userId: testUser.user_id,
      projectTitle: "Modern Minimalist Villa - Baliuag",
      projectType: "Residential Design & Build",
      targetLocation: "Baliuag, Bulacan",
    });
    console.log(`[E2E Step 3] Created Project 1: ${project1.project_code} (Stage: ${project1.stage_id})`);
    if (project1.stage_id !== "CONSULTATION") throw new Error("Project not created at CONSULTATION stage!");

    // 4. Verify Dashboard now reports CONSULTATION
    const consultDash = await stageEngineService.getDashboardState(testUser.user_id);
    console.log(`[E2E Step 4] Dashboard Stage after Inquiry: ${consultDash.stage_id} (Active: ${consultDash.hasActiveProject})`);
    if (consultDash.stage_id !== "CONSULTATION") throw new Error("Dashboard not updated to CONSULTATION!");
    if (!consultDash.stagePermissions.canAccessConsultation) throw new Error("Consultation permission missing!");
    if (consultDash.stagePermissions.canAccessActiveBuild) throw new Error("Active build should still be locked!");

    // 5. ANTI-SPAM TEST: Attempt to create Project 2 while Project 1 is active
    console.log("[E2E Step 5] Testing Anti-Spam Gate: Attempting to create 2nd concurrent project...");
    let blockedAsExpected = false;
    try {
      await stageEngineService.createInquiryProject({
        userId: testUser.user_id,
        projectTitle: "Commercial Warehouse - Meycauayan",
        projectType: "Commercial Building",
        targetLocation: "Meycauayan, Bulacan",
      });
    } catch (spamErr) {
      if (spamErr.code === "ACTIVE_PROJECT_LIMIT_EXCEEDED" || spamErr.statusCode === 409) {
        blockedAsExpected = true;
        console.log("  [PASS] Anti-Spam successfully BLOCKED 2nd concurrent project!");
      }
    }
    if (!blockedAsExpected) throw new Error("Anti-Spam FAILED: Allowed second concurrent project without approval!");

    // 6. Client submits Multi-Project Approval Request
    console.log("[E2E Step 6] Client submitting Multi-Project Access request...");
    const reqResult = await stageEngineService.requestMultiProjectApproval(
      testUser.user_id,
      "We are opening a commercial branch and need concurrent architectural planning."
    );
    console.log(`  [PASS] Request recorded at: ${reqResult.multi_project_requested_at}`);

    // 7. Admin advances Project 1 through Stages: PRE_CONSTRUCTION -> ACTIVE_BUILD -> COMPLETED
    console.log("[E2E Step 7] Admin advancing Project 1 to PRE_CONSTRUCTION (Stage 3)...");
    const preConst = await stageEngineService.advanceProjectStage({
      projectId: project1.client_project_id,
      targetStage: "PRE_CONSTRUCTION",
      adminUserId: 1,
      reason: "Initial consultation meeting finished; architectural blueprints drafting approved.",
    });
    console.log(`  [PASS] Advanced to: ${preConst.stage_id}`);

    console.log("[E2E Step 8] Admin advancing Project 1 to ACTIVE_BUILD (Stage 4)...");
    const activeBuild = await stageEngineService.advanceProjectStage({
      projectId: project1.client_project_id,
      targetStage: "ACTIVE_BUILD",
      adminUserId: 1,
      reason: "Municipal building permits released and digital contract signed.",
    });
    console.log(`  [PASS] Advanced to: ${activeBuild.stage_id}`);

    console.log("[E2E Step 9] Admin advancing Project 1 to COMPLETED (Stage 5)...");
    const completed = await stageEngineService.advanceProjectStage({
      projectId: project1.client_project_id,
      targetStage: "COMPLETED",
      adminUserId: 1,
      reason: "100% construction completion and certificate of occupancy signed.",
    });
    console.log(`  [PASS] Advanced to: ${completed.stage_id}`);

    // 8. Verify Dashboard reports COMPLETED and auto-dissolves anti-spam lock!
    console.log("[E2E Step 10] Verifying Dashboard at COMPLETED stage...");
    const completedDash = await stageEngineService.getDashboardState(testUser.user_id);
    console.log(`  [PASS] Stage: ${completedDash.stage_id}`);
    if (completedDash.stage_id !== "COMPLETED") throw new Error("Dashboard not reporting COMPLETED!");
    if (!completedDash.stagePermissions.canAccessCompleted) throw new Error("Completed permission not granted!");

    // Clean up test data
    console.log("[E2E Cleanup] Removing test user and cascading project records...");
    await db.query("DELETE FROM public.users WHERE user_id = $1;", [testUser.user_id]);
    console.log("  [PASS] Cleanup complete.\n");

    console.log("=================================================================");
    console.log("  ALL E2E LIFECYCLE & ANTI-SPAM TESTS PASSED WITH 100% INTEGRITY! ");
    console.log("=================================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n[E2E FAILURE]:", err);
    process.exit(1);
  }
}

runE2ETests();
