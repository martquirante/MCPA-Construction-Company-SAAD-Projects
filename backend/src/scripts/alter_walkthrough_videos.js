require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../services/dbFailoverEngine');

(async () => {
  try {
    console.log("Checking columns in site_projects...");
    const res = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'site_projects'"
    );
    console.log("Existing columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log("\nAdding virtual_tour_urls column to site_projects if not exists...");
    await db.query(`
      ALTER TABLE site_projects 
      ADD COLUMN IF NOT EXISTS virtual_tour_urls JSONB DEFAULT '[]'::jsonb;
    `);

    // Migrate existing virtual_tour_url into virtual_tour_urls if virtual_tour_urls is empty
    await db.query(`
      UPDATE site_projects
      SET virtual_tour_urls = jsonb_build_array(
        jsonb_build_object(
          'url', virtual_tour_url,
          'title', 'Full 3D Architectural Walk-Around Tour'
        )
      )
      WHERE virtual_tour_url IS NOT NULL 
        AND virtual_tour_url != '' 
        AND (virtual_tour_urls IS NULL OR virtual_tour_urls = '[]'::jsonb);
    `);

    console.log("Successfully migrated and verified virtual_tour_urls column!");

    const verify = await db.query(
      "SELECT project_code, virtual_tour_url, virtual_tour_urls FROM site_projects LIMIT 5"
    );
    console.log("Sample records:", JSON.stringify(verify.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
})();
