const db = require("../services/dbFailoverEngine");

async function cleanDummyProject() {
  try {
    console.log("Cleaning dummy seeded project PRJ-2026-04 from database...");
    await db.query("DELETE FROM billing_ledger WHERE project_code = $1", ["PRJ-2026-04"]);
    await db.query("DELETE FROM site_photo_logs WHERE project_code = $1", ["PRJ-2026-04"]);
    await db.query("DELETE FROM site_milestones WHERE project_code = $1", ["PRJ-2026-04"]);
    await db.query("DELETE FROM site_projects WHERE project_code = $1", ["PRJ-2026-04"]);
    console.log("Successfully removed all seeded test records for PRJ-2026-04.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

cleanDummyProject();
