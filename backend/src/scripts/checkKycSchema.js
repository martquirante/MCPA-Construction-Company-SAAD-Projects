require("dotenv").config();
const { Pool } = require("pg");

async function check() {
  const supaConn = process.env.SUPABASE_CONNECTION_STRING;
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;

  console.log("=== CHECKING SUPABASE PRIMARY DATABASE ===");
  if (supaConn) {
    const pool = new Pool({ connectionString: supaConn, ssl: { rejectUnauthorized: false } });
    try {
      const res = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND (column_name LIKE '%kyc%' OR column_name IN ('employer_name', 'monthly_income')) ORDER BY column_name"
      );
      console.log("Supabase columns found:", res.rows);
    } catch (e) {
      console.error("Supabase error:", e.message);
    }
    await pool.end();
  }

  console.log("\n=== CHECKING NEON STANDBY DATABASE ===");
  if (neonConn) {
    const pool = new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } });
    try {
      const res = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND (column_name LIKE '%kyc%' OR column_name IN ('employer_name', 'monthly_income')) ORDER BY column_name"
      );
      console.log("Neon columns found:", res.rows);
    } catch (e) {
      console.error("Neon error:", e.message);
    }
    await pool.end();
  }
}

check();
