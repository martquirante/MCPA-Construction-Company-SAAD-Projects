const { Pool } = require('pg');

async function syncProjects() {
  const supabasePool = new Pool({
    connectionString: 'postgres://postgres.dzqqyqothtttccplvvnb:%2ASAADmpcpa2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
  });
  const neonPool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_Dj7KywF1Hafk@ep-ancient-lab-b3dmiuuh-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    const sRes = await supabasePool.query('SELECT * FROM projects ORDER BY project_id ASC');
    console.log('Supabase projects found:', sRes.rows.length);

    for (const row of sRes.rows) {
      const exists = await neonPool.query('SELECT project_id FROM projects WHERE name = $1', [row.name]);
      if (exists.rows.length === 0) {
        console.log('Inserting into Neon:', row.name);
        await neonPool.query(
          `INSERT INTO projects (name, location, category, year, description, images, is_admin_added, is_web_visible, status, month, lot_area, floor_area, bedrooms, bathrooms, features, architectural_details, featured_on_home)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            row.name,
            row.location,
            row.category,
            row.year,
            row.description,
            Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
            row.is_admin_added,
            row.is_web_visible,
            row.status,
            row.month,
            row.lot_area,
            row.floor_area,
            row.bedrooms,
            row.bathrooms,
            Array.isArray(row.features) ? row.features : (typeof row.features === 'string' ? JSON.parse(row.features) : []),
            row.architectural_details,
            row.featured_on_home
          ]
        );
        console.log('Successfully inserted into Neon:', row.name);
      } else {
        console.log('Already exists in Neon:', row.name);
      }
    }

    const nCheck = await neonPool.query('SELECT project_id, name FROM projects ORDER BY project_id ASC');
    console.log('\n--- VERIFIED NEON PROJECTS NOW (COUNT:', nCheck.rows.length, ') ---');
    console.table(nCheck.rows);
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await supabasePool.end();
    await neonPool.end();
  }
}

syncProjects();
