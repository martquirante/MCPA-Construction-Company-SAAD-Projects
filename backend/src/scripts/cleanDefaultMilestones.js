require("dotenv").config();
const db = require("../services/dbFailoverEngine");

async function cleanDefaultMilestones() {
  console.log("[CLEANUP] Purging 0% default milestones from database...");

  const pools = [
    { name: "Supabase Primary Database", pool: db.supabasePool },
    { name: "Neon Standby Database", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[CLEANUP] Skipping ${name} (not active).`);
      continue;
    }

    try {
      const del = await pool.query(
        "DELETE FROM site_milestones WHERE completion_pct = 0 RETURNING milestone_id, project_code, phase_code, phase_name;"
      );
      console.log(`[CLEANUP] Deleted ${del.rowCount || 0} 0% default milestones from ${name}:`);
      (del.rows || []).forEach((r) => {
        console.log(`  - ${r.project_code} [${r.phase_code}]: ${r.phase_name}`);
      });

      await pool.query("UPDATE site_projects SET progress_pct = 0;");
      console.log(`[CLEANUP] Reset site_projects progress_pct to 0 on ${name}.`);
    } catch (e) {
      console.error(`[CLEANUP] Error on ${name}:`, e.message);
    }
  }

  console.log("[CLEANUP] Done.");
}

cleanDefaultMilestones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[CLEANUP] Fatal error:", err);
    process.exit(1);
  });
