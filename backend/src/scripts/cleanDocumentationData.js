/**
 * CLEANUP SCRIPT FOR SYSTEM SCREEN DOCUMENTATION SEED DATA
 * Safely removes all mock records tagged with 'DOC-SEED-', 'DOC-PRJ-2026-01',
 * and the documentation demo client account without affecting any real data.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

const SEED_TAG = "DOC-SEED-";
const DEMO_CLIENT_EMAIL = "client.documentation@mcpaconstruction.com";
const DEMO_PROJECT_CODE = "DOC-PRJ-2026-01";

async function runCleanup() {
  console.log("===============================================================");
  console.log("  BUILDYSNC DOCUMENTATION DATA PURGE & CLEANUP                 ");
  console.log("===============================================================\n");

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  for (const { name: dbName, pool } of pools) {
    if (!pool) continue;
    console.log(`>>> Cleaning from ${dbName}...`);

    try {
      // 1. Unlink references
      await pool.query("UPDATE client_projects SET site_project_code = NULL WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      
      // 2. Child tables of site_projects
      const delPhotos = await pool.query("DELETE FROM site_photo_logs WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delPhotos.rowCount || 0} photo logs`);

      const delMs = await pool.query("DELETE FROM site_milestones WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delMs.rowCount || 0} milestones`);

      const delBills = await pool.query("DELETE FROM billing_ledger WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delBills.rowCount || 0} billing records`);

      const delDelays = await pool.query("DELETE FROM delay_events WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delDelays.rowCount || 0} delay events`);

      const delOcr = await pool.query("DELETE FROM expenses_ocr WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delOcr.rowCount || 0} OCR expenses`);

      // 3. Client project and site project
      const delClientProj = await pool.query("DELETE FROM client_projects WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delClientProj.rowCount || 0} client_projects`);

      const delSiteProj = await pool.query("DELETE FROM site_projects WHERE project_code = $1", [DEMO_PROJECT_CODE]);
      console.log(`  - Deleted ${delSiteProj.rowCount || 0} site_projects`);

      // 4. Client briefs & meetings
      const delBriefs = await pool.query("DELETE FROM client_briefs WHERE submission_id LIKE $1", [`${SEED_TAG}%`]);
      console.log(`  - Deleted ${delBriefs.rowCount || 0} client briefs`);

      const delMeetings = await pool.query("DELETE FROM meeting_history_logs WHERE session_id LIKE $1", [`${SEED_TAG}%`]);
      console.log(`  - Deleted ${delMeetings.rowCount || 0} meeting logs`);

      // 5. Documentation Demo User
      const delUser = await pool.query("DELETE FROM users WHERE LOWER(email) = LOWER($1)", [DEMO_CLIENT_EMAIL]);
      console.log(`  - Deleted documentation demo user: ${DEMO_CLIENT_EMAIL} (${delUser.rowCount || 0} rows)`);

    } catch (e) {
      console.error(`  [!] Error cleaning ${dbName}:`, e.message);
    }
  }

  console.log("\n[SUCCESS] Cleanup complete! All documentation seed data safely purged.");
}

runCleanup()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[FATAL] Cleanup failed:", e);
    process.exit(1);
  });

