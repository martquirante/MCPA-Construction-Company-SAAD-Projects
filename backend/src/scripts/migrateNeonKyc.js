require("dotenv").config();
const { Pool } = require("pg");

async function migrate() {
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;
  if (!neonConn) {
    console.error("No Neon connection string found.");
    return;
  }

  const pool = new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } });

  try {
    console.log("Applying additive columns to Neon PostgreSQL database...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_photo_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income VARCHAR(100);
    `);
    console.log("SUCCESS: Neon schema updated with kyc_photo_url, kyc_verified_at, employer_name, monthly_income!");
  } catch (err) {
    console.error("Neon migration error:", err);
  } finally {
    await pool.end();
  }
}

migrate();
