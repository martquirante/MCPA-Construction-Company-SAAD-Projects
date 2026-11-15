const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function checkTables() {
  const pool = db.supabasePool;
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Current tables in Supabase (count: " + res.rows.length + "):");
  console.log(res.rows.map(r => r.table_name).join(", "));
  process.exit(0);
}

checkTables().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
