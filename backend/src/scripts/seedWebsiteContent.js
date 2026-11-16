const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function seedComprehensiveWebsiteContent() {
  const mockFilePath = path.join(__dirname, "../../data/local_mock_db.json");
  let fullContent = [];
  if (fs.existsSync(mockFilePath)) {
    const data = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
    fullContent = data.website_content || [];
  }
  console.log(`Found ${fullContent.length} entries to sync.`);
  const pools = [
    { name: "Supabase", pool: db.supabasePool },
    { name: "Neon", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) continue;
    for (const item of fullContent) {
      await pool.query(
        `INSERT INTO website_content (page_key, section_key, content_key, content_type, content_value)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (page_key, section_key, content_key)
         DO UPDATE SET content_value = EXCLUDED.content_value`,
        [item.page_key, item.section_key, item.content_key, item.content_type, item.content_value]
      );
    }
    console.log(`✓ Seeded ${fullContent.length} website content keys on ${name}`);
  }
  process.exit(0);
}

seedComprehensiveWebsiteContent().catch((err) => {
  console.error(err);
  process.exit(1);
});
