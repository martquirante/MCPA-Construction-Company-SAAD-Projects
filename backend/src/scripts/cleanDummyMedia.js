const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function cleanDummyMedia() {
  console.log("Checking and cleaning dummy media references...");
  const pools = [
    { name: "Supabase Pool", pool: db.supabasePool },
    { name: "Neon Pool", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) continue;
    try {
      const del = await pool.query(`DELETE FROM media_library WHERE file_url LIKE '%bbb%' OR file_url LIKE '%w3schools%';`);
      console.log(`[${name}] Removed ${del.rowCount || 0} dummy sample media records.`);
    } catch (e) {
      console.warn(`[${name}] media_library notice:`, e.message);
    }
  }
}

cleanDummyMedia().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
