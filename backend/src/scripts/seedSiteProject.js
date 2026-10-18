require('dotenv').config();
const db = require('../services/dbFailoverEngine');

async function seedSiteProject() {
  console.log('[SEED] Note: Seed dummy data has been deprecated and disabled per production requirements.');
  console.log('[SEED] Running purge of any residual dummy site data (PRJ-2026-04)...');

  const projectCode = 'PRJ-2026-04';

  const pools = [
    { name: 'Supabase Primary', pool: db.supabasePool },
    { name: 'Neon Standby', pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) continue;
    try {
      await pool.query('DELETE FROM site_milestones WHERE project_code = $1', [projectCode]);
      await pool.query('DELETE FROM site_photo_logs WHERE project_code = $1', [projectCode]);
      await pool.query('DELETE FROM billing_ledger WHERE project_code = $1', [projectCode]);
      await pool.query('DELETE FROM site_projects WHERE project_code = $1', [projectCode]);
      console.log(`[SEED] Purged dummy records from ${name}.`);
    } catch (e) {
      console.warn(`[SEED] Notice on ${name}: ${e.message}`);
    }
  }

  console.log('[SEED] All Stage 3 & Stage 4 data must be created dynamically through stage progression.');
}

seedSiteProject()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ERROR]:', err);
    process.exit(1);
  });
