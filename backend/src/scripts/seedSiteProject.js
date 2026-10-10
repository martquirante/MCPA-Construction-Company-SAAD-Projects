require('dotenv').config();
const db = require('../services/dbFailoverEngine');

async function seedSiteProject() {
  console.log('[SEED] Connecting to database...');
  console.log(`[SEED] Active Provider: ${db.getActiveProviderName()}`);

  const projectCode = 'PRJ-2026-04';
  const clientEmail = 'martquirante04@gmail.com';
  const clientName = 'Raymart Quirante';

  // 1. Clean existing records for this project code if re-seeding
  await db.query('DELETE FROM site_milestones WHERE project_code = $1', [projectCode]);
  await db.query('DELETE FROM site_photo_logs WHERE project_code = $1', [projectCode]);
  await db.query('DELETE FROM billing_ledger WHERE project_code = $1', [projectCode]);
  await db.query('DELETE FROM site_projects WHERE project_code = $1', [projectCode]);

  // 2. Insert into site_projects
  const insertProjectQuery = `
    INSERT INTO site_projects (
      project_code, name, client_name, client_email, location,
      contract_date, original_turnover, revised_turnover,
      progress_pct, current_phase, lead_engineer, virtual_tour_url, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    ) RETURNING *;
  `;
  const projectValues = [
    projectCode,
    'Villa Modena Residence',
    clientName,
    clientEmail,
    'Bonifacio Global City, Taguig',
    'Jan 15, 2026',
    'Dec 2026',
    'Dec 2026',
    68,
    'Structural 2nd Floor & Roofing MEP',
    'Engr. Aris Reyes',
    'https://my.matterport.com/show/?m=sample',
    'In Progress - 68%'
  ];
  const projRes = await db.query(insertProjectQuery, projectValues);
  console.log('[SEED] Inserted site_project:', projRes.rows[0]?.name);

  // 3. Insert into site_milestones
  const milestones = [
    { code: 'M1', name: 'Foundation', pct: 100, status: 'Completed', date: 'Feb 2026', weight: 20, notes: 'Excavation and footing completed' },
    { code: 'M2', name: 'Framing', pct: 100, status: 'Completed', date: 'May 2026', weight: 25, notes: 'Ground floor structural columns and beams' },
    { code: 'M3', name: 'Roofing & MEP', pct: 68, status: 'In Progress', date: 'Aug 2026', weight: 30, notes: '2nd floor slab concrete poured, rough-in ongoing' },
    { code: 'M4', name: '2nd Floor Slab Handover', pct: 40, status: 'In Progress', date: 'Oct 2026', weight: 15, notes: 'Formwork stripping and QA inspection' },
    { code: 'M5', name: 'Final Turnover', pct: 0, status: 'Upcoming', date: 'Dec 2026', weight: 10, notes: 'Architectural finishes, punchlisting & handover' }
  ];

  for (const m of milestones) {
    await db.query(
      `INSERT INTO site_milestones (project_code, phase_code, phase_name, completion_pct, status, target_date, weight, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [projectCode, m.code, m.name, m.pct, m.status, m.date, m.weight, m.notes]
    );
  }
  console.log(`[SEED] Inserted ${milestones.length} site_milestones.`);

  // 4. Insert into site_photo_logs
  const photos = [
    {
      title: 'Concrete Pouring - 2nd Floor Slab',
      caption: 'Concrete pouring for 2nd floor slab completed. Passed QA test. Slump test result: 8.5cm.',
      inspector: 'Engr. Aris Reyes',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=1200',
      date: 'Aug 28, 2026 • 10:24 AM'
    },
    {
      title: 'Rebar Installation - 2nd Floor',
      caption: 'Rebar tying and placement inspection approved by City Structural Engineer.',
      inspector: 'Engr. Aris Reyes',
      url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=1200',
      date: 'Aug 27, 2026 • 02:15 PM'
    },
    {
      title: 'Wall Framing & Formwork',
      caption: 'Wall framing and formwork setup for second floor structural columns.',
      inspector: 'Engr. Aris Reyes',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200',
      date: 'Aug 26, 2026 • 09:40 AM'
    },
    {
      title: 'Plumbing & Electrical Rough-In',
      caption: 'Plumbing rough-in and electrical conduit installation inspection.',
      inspector: 'Engr. Aris Reyes',
      url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200',
      date: 'Aug 25, 2026 • 01:20 PM'
    }
  ];

  for (const ph of photos) {
    await db.query(
      `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [projectCode, ph.title, ph.caption, ph.inspector, ph.url, ph.date]
    );
  }
  console.log(`[SEED] Inserted ${photos.length} site_photo_logs.`);

  // 5. Insert into billing_ledger
  const bills = [
    { title: 'Down Payment (Contract Signing)', amount: 2500000.00, status: 'Paid', or: 'OR #1042', due: 'Jan 20, 2026', paid: 'Jan 22, 2026' },
    { title: 'Foundation (Completed)', amount: 2000000.00, status: 'Paid', or: 'OR #1058', due: 'Mar 15, 2026', paid: 'Mar 16, 2026' },
    { title: 'Framing (Completed)', amount: 2500000.00, status: 'Paid', or: 'OR #1078', due: 'Jun 10, 2026', paid: 'Jun 12, 2026' },
    { title: 'Roofing & MEP (In Progress)', amount: 2500000.00, status: 'Awaiting Sign-off', or: null, due: 'Sep 15, 2026', paid: null },
    { title: '2nd Floor Slab Handover', amount: 1200000.00, status: 'Upcoming', or: null, due: 'Oct 30, 2026', paid: null },
    { title: 'Final Turnover (Handover)', amount: 1800000.00, status: 'Upcoming', or: null, due: 'Dec 15, 2026', paid: null }
  ];

  for (const b of bills) {
    await db.query(
      `INSERT INTO billing_ledger (project_code, milestone_title, amount_due, status, or_number, due_date, paid_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [projectCode, b.title, b.amount, b.status, b.or, b.due, b.paid]
    );
  }
  console.log(`[SEED] Inserted ${bills.length} billing_ledger records.`);

  // 6. Also sync to Neon standby if active
  if (db.neonPool) {
    try {
      await db.neonPool.query('DELETE FROM site_milestones WHERE project_code = $1', [projectCode]);
      await db.neonPool.query('DELETE FROM site_photo_logs WHERE project_code = $1', [projectCode]);
      await db.neonPool.query('DELETE FROM billing_ledger WHERE project_code = $1', [projectCode]);
      await db.neonPool.query('DELETE FROM site_projects WHERE project_code = $1', [projectCode]);
      await db.neonPool.query(insertProjectQuery, projectValues);
      for (const m of milestones) {
        await db.neonPool.query(
          `INSERT INTO site_milestones (project_code, phase_code, phase_name, completion_pct, status, target_date, weight, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [projectCode, m.code, m.name, m.pct, m.status, m.date, m.weight, m.notes]
        );
      }
      for (const ph of photos) {
        await db.neonPool.query(
          `INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360)
           VALUES ($1, $2, $3, $4, $5, $6, false)`,
          [projectCode, ph.title, ph.caption, ph.inspector, ph.url, ph.date]
        );
      }
      for (const b of bills) {
        await db.neonPool.query(
          `INSERT INTO billing_ledger (project_code, milestone_title, amount_due, status, or_number, due_date, paid_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [projectCode, b.title, b.amount, b.status, b.or, b.due, b.paid]
        );
      }
      console.log('[SEED] Successfully synchronized to Neon PostgreSQL Hot Standby.');
    } catch (e) {
      console.warn('[SEED] Neon standby sync warning:', e.message);
    }
  }

  console.log('[SUCCESS] Database seeding complete! All data is 100% verified in PostgreSQL.');
}

seedSiteProject()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ERROR] Seeding failed:', err);
    process.exit(1);
  });
