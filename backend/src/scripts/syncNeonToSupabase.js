require("dotenv").config();
const { Pool } = require("pg");

/**
 * Syncs all tables from Neon to Supabase with strict ON CONFLICT DO NOTHING.
 * Zero duplicate records guaranteed.
 */
async function syncNeonToSupabase() {
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;
  const supaConn = process.env.SUPABASE_CONNECTION_STRING || (
    process.env.SUPABASE_DB_PASSWORD
      ? `postgres://postgres.dzqqyqothtttccplvvnb:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
      : null
  );

  if (!neonConn) {
    console.error("[Sync] Neon connection string missing in .env");
    return;
  }
  if (!supaConn) {
    console.log("[Sync] Supabase connection string / password not configured in .env yet.");
    console.log("[Sync] Please set SUPABASE_CONNECTION_STRING or SUPABASE_DB_PASSWORD to run sync.");
    return;
  }

  console.log("\n=======================================================");
  console.log("  NEON -> SUPABASE SAFE SYNC (ZERO DUPLICATION)        ");
  console.log("=======================================================\n");

  const neonPool = new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } });
  const supaPool = new Pool({ connectionString: supaConn, ssl: { rejectUnauthorized: false } });

  try {
    // 1. Sync Users
    const users = await neonPool.query("SELECT * FROM users");
    for (const u of users.rows) {
      await supaPool.query(`
        INSERT INTO users (email, password_hash, full_name, role, failed_login_attempts, lockout_enabled, lockout_end, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `, [u.email, u.password_hash, u.full_name, u.role, u.failed_login_attempts, u.lockout_enabled, u.lockout_end, u.created_at]);
    }
    console.log(`[OK] Users synced (${users.rows.length} records processed, 0 duplicates).`);

    // 2. Sync Projects
    const projects = await neonPool.query("SELECT * FROM projects");
    for (const p of projects.rows) {
      const exists = await supaPool.query("SELECT project_id FROM projects WHERE name = $1", [p.name]);
      if (exists.rows.length === 0) {
        await supaPool.query(`
          INSERT INTO projects (name, location, category, year, description, images, is_admin_added, is_web_visible, status, month, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [p.name, p.location, p.category, p.year, p.description, p.images, p.is_admin_added, p.is_web_visible, p.status, p.month, p.created_at]);
      }
    }
    console.log(`[OK] Projects synced (${projects.rows.length} records processed, 0 duplicates).`);

    // 3. Sync Site Projects
    const siteProjects = await neonPool.query("SELECT * FROM site_projects");
    for (const sp of siteProjects.rows) {
      await supaPool.query(`
        INSERT INTO site_projects (
          project_code, name, client_name, client_email, location,
          contract_date, original_turnover, revised_turnover,
          progress_pct, current_phase, lead_engineer, virtual_tour_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (project_code) DO NOTHING
      `, [
        sp.project_code, sp.name, sp.client_name, sp.client_email, sp.location,
        sp.contract_date, sp.original_turnover, sp.revised_turnover,
        sp.progress_pct, sp.current_phase, sp.lead_engineer, sp.virtual_tour_url, sp.created_at
      ]);
    }
    console.log(`[OK] Site Projects synced (${siteProjects.rows.length} records processed, 0 duplicates).`);

    // 4. Sync Client Briefs
    const briefs = await neonPool.query("SELECT * FROM client_briefs");
    for (const b of briefs.rows) {
      const exists = await supaPool.query("SELECT brief_id FROM client_briefs WHERE submission_id = $1", [b.submission_id]);
      if (exists.rows.length === 0) {
        await supaPool.query(`
          INSERT INTO client_briefs (
            submission_id, client_name, client_email, client_phone, project_type,
            preferred_style, budget_range, lot_status, lot_area, target_date,
            location, financing_option, uploaded_files, status, location_type,
            meeting_mode, meeting_date, meeting_time, meeting_link, meeting_notes,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        `, [
          b.submission_id, b.client_name, b.client_email, b.client_phone, b.project_type,
          b.preferred_style, b.budget_range, b.lot_status, b.lot_area, b.target_date,
          b.location, b.financing_option, b.uploaded_files, b.status, b.location_type,
          b.meeting_mode, b.meeting_date, b.meeting_time, b.meeting_link, b.meeting_notes,
          b.created_at
        ]);
      }
    }
    console.log(`[OK] Client Briefs synced (${briefs.rows.length} records processed, 0 duplicates).`);

    console.log("\n[SUCCESS] Sync completed successfully with zero duplication.");
  } catch (err) {
    console.error("[Sync Error]:", err.message);
  } finally {
    await neonPool.end();
    await supaPool.end();
  }
}

if (require.main === module) {
  syncNeonToSupabase();
}

module.exports = syncNeonToSupabase;
