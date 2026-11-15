const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function check() {
  console.log("Checking Supabase & Neon users...");
  try {
    const res = await db.query(`SELECT user_id, email, full_name, role, account_status, invite_token, avatar_url FROM users ORDER BY user_id ASC`);
    console.log("Users in db query:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error querying users:", err);
  }

  if (db.supabasePool) {
    try {
      const sRes = await db.supabasePool.query(`SELECT user_id, email, full_name, role, account_status, invite_token, avatar_url FROM users ORDER BY user_id ASC`);
      console.log("Users in Supabase pool explicitly:");
      console.table(sRes.rows);
    } catch (e) {
      console.error("Supabase explicit error:", e.message);
    }
  }

  if (db.neonPool) {
    try {
      const nRes = await db.neonPool.query(`SELECT user_id, email, full_name, role, account_status, invite_token, avatar_url FROM users ORDER BY user_id ASC`);
      console.log("Users in Neon pool explicitly:");
      console.table(nRes.rows);
    } catch (e) {
      console.error("Neon explicit error:", e.message);
    }
  }
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
