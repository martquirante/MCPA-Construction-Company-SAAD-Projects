require("dotenv").config();
const db = require("../services/dbFailoverEngine");

async function cleanStage3And4DummyData() {
  console.log("[CLEANUP] Starting cleanup of Stage 3 & Stage 4 dummy/seeded data...");

  const pools = [
    { name: "Supabase Primary Database", pool: db.supabasePool },
    { name: "Neon Standby Database", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[CLEANUP] Skipping ${name} (not active).`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`[CLEANUP] Processing ${name}...`);
    console.log(`========================================`);

    try {
      // 1. Remove dummy project PRJ-2026-04 completely
      const delBill = await pool.query("DELETE FROM billing_ledger WHERE project_code = 'PRJ-2026-04' RETURNING bill_id;");
      console.log(`- Deleted ${delBill.rowCount || 0} dummy billing_ledger rows for PRJ-2026-04`);

      const delPhotos = await pool.query("DELETE FROM site_photo_logs WHERE project_code = 'PRJ-2026-04' RETURNING log_id;");
      console.log(`- Deleted ${delPhotos.rowCount || 0} dummy site_photo_logs rows for PRJ-2026-04`);

      const delMilestones = await pool.query("DELETE FROM site_milestones WHERE project_code = 'PRJ-2026-04' RETURNING milestone_id;");
      console.log(`- Deleted ${delMilestones.rowCount || 0} dummy site_milestones rows for PRJ-2026-04`);

      const delProj = await pool.query("DELETE FROM site_projects WHERE project_code = 'PRJ-2026-04' RETURNING project_code;");
      console.log(`- Deleted ${delProj.rowCount || 0} dummy site_projects rows for PRJ-2026-04`);

      // 2. Reset any seeded progress, fake lead engineer, and fake turnovers on active site projects
      const updateProj = await pool.query(`
        UPDATE site_projects
        SET progress_pct = 0,
            current_phase = 'Site Mobilization & Preparation',
            lead_engineer = NULL,
            original_turnover = NULL,
            revised_turnover = NULL,
            status = 'Active Site Execution'
        WHERE progress_pct > 0 OR lead_engineer = 'Engr. Raymart Quirante, CE' OR lead_engineer = 'Engr. Aris Reyes'
        RETURNING project_code, name, progress_pct, current_phase;
      `);
      console.log(`- Reset ${updateProj.rowCount || 0} site_projects to 0% progress and unassigned lead engineer:`);
      updateProj.rows.forEach(r => console.log(`   * ${r.project_code}: ${r.name} -> ${r.progress_pct}% (${r.current_phase})`));

      // 3. Reset all milestones for active projects to 0% and Upcoming
      const updateMs = await pool.query(`
        UPDATE site_milestones
        SET completion_pct = 0,
            status = 'Upcoming'
        WHERE completion_pct > 0 OR status != 'Upcoming'
        RETURNING milestone_id, project_code, phase_code, phase_name, completion_pct, status;
      `);
      console.log(`- Reset ${updateMs.rowCount || 0} site_milestones to 0% and 'Upcoming' status.`);

      // 4. Clean any seeded dummy project_wrapped records with hardcoded stats
      try {
        const delWrapped = await pool.query(`
          DELETE FROM project_wrapped
          WHERE total_days_duration = 185 OR total_concrete_bags = 850 OR total_steel_kg = 4200
          RETURNING wrapped_id;
        `);
        console.log(`- Deleted ${delWrapped.rowCount || 0} dummy project_wrapped records.`);
      } catch (wErr) {
        console.log(`- project_wrapped check: ${wErr.message}`);
      }

      // 5. Clean any seeded loan records if present
      try {
        const delLoans = await pool.query(`
          DELETE FROM loan_records
          WHERE approved_loan_amount = 4000000 OR financing_institution ILIKE '%BDO%'
          RETURNING loan_id;
        `);
        console.log(`- Deleted ${delLoans.rowCount || 0} dummy loan_records.`);
      } catch (lErr) {
        console.log(`- loan_records check: ${lErr.message}`);
      }

      console.log(`[CLEANUP] Completed cleanup for ${name}.`);
    } catch (err) {
      console.error(`[CLEANUP ERROR] Failed on ${name}:`, err.message);
    }
  }

  console.log("\n[CLEANUP COMPLETE] All seeded dummy data for Stage 3 & 4 has been cleared from databases.");
}

cleanStage3And4DummyData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
