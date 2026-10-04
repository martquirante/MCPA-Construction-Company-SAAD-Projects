require("dotenv").config();
const { Pool } = require("pg");

async function testBackendQueriesOnNeon() {
  const neonConnStr = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;
  const cleanConnStr = neonConnStr
    .replace(/([?&])sslmode=[^&]+(&|$)/, (m, p1, p2) => p1 === "?" && p2 ? "?" : "")
    .replace(/([?&])channel_binding=[^&]+(&|$)/, (m, p1, p2) => p1 === "?" && p2 ? "?" : "")
    .replace(/\?$/, "");

  const pool = new Pool({
    connectionString: cleanConnStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("1. Testing Auth Login Query (authController)...");
    const loginTest = await pool.query(
      `SELECT 
        user_id, email, password_hash, full_name, first_name, last_name, role, 
        phone_number, avatar_url, has_viber_whatsapp, occupation, civil_status, 
        birth_date, location_address, auth_provider, provider_id, email_verified,
        facebook_url, linkedin_url, instagram_url, failed_login_attempts, 
        lockout_enabled, lockout_end 
      FROM users 
      WHERE LOWER(email) = LOWER($1) 
      LIMIT 1`,
      ["admin@mcpa.com"]
    );
    console.log("   -> Login query SUCCESS! Found user:", loginTest.rows[0]?.email);

    console.log("2. Testing Projects Portfolio Query (projectsController)...");
    const projTest = await pool.query("SELECT * FROM projects ORDER BY project_id DESC LIMIT 5");
    console.log("   -> Projects query SUCCESS! Total rows:", projTest.rows.length);

    console.log("3. Testing Client Briefs Query (briefsController)...");
    const briefsTest = await pool.query("SELECT * FROM client_briefs ORDER BY brief_id DESC LIMIT 5");
    console.log("   -> Client briefs query SUCCESS! Total rows:", briefsTest.rows.length);

    console.log("4. Testing Construction Portal Query (constructionController)...");
    const constTest = await pool.query("SELECT * FROM site_projects ORDER BY project_id DESC LIMIT 1");
    console.log("   -> Construction site_projects query SUCCESS!");

    console.log("\nALL BACKEND QUERIES PASSED WITH ZERO ERRORS ON NEON POSTGRESQL! 🚀");
  } catch (err) {
    console.error("Query Error on Neon:", err.message);
  } finally {
    await pool.end();
  }
}

testBackendQueriesOnNeon();
