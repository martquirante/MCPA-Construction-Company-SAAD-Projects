require('dotenv').config();
const db = require('../services/dbFailoverEngine');

async function cleanDummy() {
  console.log('[CLEAN] Connecting to active database...');
  console.log(`[CLEAN] Active Provider: ${db.getActiveProviderName()}`);

  const dummyCode = 'MCPA-PLR-2024';
  
  // 1. Clean from Active Provider (Supabase Primary)
  await db.query('DELETE FROM site_milestones WHERE project_code = $1', [dummyCode]);
  await db.query('DELETE FROM site_photo_logs WHERE project_code = $1', [dummyCode]);
  await db.query('DELETE FROM billing_ledger WHERE project_code = $1', [dummyCode]);
  await db.query('DELETE FROM delay_events WHERE project_code = $1', [dummyCode]);
  await db.query('DELETE FROM expenses_ocr WHERE project_code = $1', [dummyCode]);
  await db.query('DELETE FROM site_projects WHERE project_code = $1', [dummyCode]);
  console.log(`[CLEAN] Deleted all records for ${dummyCode} from ${db.getActiveProviderName()}.`);

  // 2. Also clean from Neon Standby if Neon pool exists
  if (db.neonPool) {
    try {
      await db.neonPool.query('DELETE FROM site_milestones WHERE project_code = $1', [dummyCode]);
      await db.neonPool.query('DELETE FROM site_photo_logs WHERE project_code = $1', [dummyCode]);
      await db.neonPool.query('DELETE FROM billing_ledger WHERE project_code = $1', [dummyCode]);
      await db.neonPool.query('DELETE FROM delay_events WHERE project_code = $1', [dummyCode]);
      await db.neonPool.query('DELETE FROM expenses_ocr WHERE project_code = $1', [dummyCode]);
      await db.neonPool.query('DELETE FROM site_projects WHERE project_code = $1', [dummyCode]);
      console.log(`[CLEAN] Deleted all records for ${dummyCode} from Neon Hot Standby.`);
    } catch (e) {
      console.warn('[CLEAN] Could not clean Neon standby:', e.message);
    }
  }

  // 3. Verify clean state
  const projs = await db.query('SELECT project_id, name FROM projects');
  console.log('[VERIFIED] Portfolio projects:', projs.rows);
  const siteProjs = await db.query('SELECT project_id, project_code, name FROM site_projects');
  console.log('[VERIFIED] Site projects:', siteProjs.rows);
  const milestones = await db.query('SELECT count(*) FROM site_milestones');
  console.log('[VERIFIED] Milestones count:', milestones.rows[0].count);
  const photos = await db.query('SELECT count(*) FROM site_photo_logs');
  console.log('[VERIFIED] Photos count:', photos.rows[0].count);
  const bills = await db.query('SELECT count(*) FROM billing_ledger');
  console.log('[VERIFIED] Billing count:', bills.rows[0].count);
  const ocr = await db.query('SELECT count(*) FROM expenses_ocr');
  console.log('[VERIFIED] Expenses OCR count:', ocr.rows[0].count);
}

cleanDummy()
  .then(() => {
    console.log('[SUCCESS] Database cleanup finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[ERROR] Cleanup failed:', err);
    process.exit(1);
  });
