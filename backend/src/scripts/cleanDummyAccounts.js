require("dotenv").config();
const db = require("../services/dbFailoverEngine");

async function cleanAllDummyAccounts() {
  console.log("Removing all dummy and seeded accounts across databases...");

  const targetEmails = [
    "architect@mcpa.ph",
    "engineer@mcpa.ph",
    "test_client_e2e_1791657698694@mcpatest.ph",
    "rayquirante2@gmail.com",
    "admin@mcpa.com",
    "client.google@mcpa.ph",
    "client.facebook@mcpa.ph",
    "testclient.real@gmail.com",
    "test_client_auth_1791095862673@example.com"
  ];

  const pools = [
    { name: "Primary Database (Supabase)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon)", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] Pool ${name} is not initialized.`);
      continue;
    }
    console.log(`\nPurging dummy accounts from ${name}...`);
    try {
      // 1. Delete OTPs
      const delOtp = await pool.query(
        "DELETE FROM otp_codes WHERE LOWER(email) = ANY($1) RETURNING otp_id",
        [targetEmails.map((e) => e.toLowerCase())]
      );
      if (delOtp.rowCount > 0) {
        console.log(`[${name}] Deleted ${delOtp.rowCount} OTP codes.`);
      }

      // 2. Delete email verifications
      try {
        const delVerif = await pool.query(
          "DELETE FROM email_verifications WHERE LOWER(email) = ANY($1) RETURNING verification_id",
          [targetEmails.map((e) => e.toLowerCase())]
        );
        if (delVerif.rowCount > 0) {
          console.log(`[${name}] Deleted ${delVerif.rowCount} email verifications.`);
        }
      } catch (e) {}

      // 3. Delete client briefs if any
      const delBriefs = await pool.query(
        "DELETE FROM client_briefs WHERE LOWER(client_email) = ANY($1) RETURNING brief_id",
        [targetEmails.map((e) => e.toLowerCase())]
      );
      if (delBriefs.rowCount > 0) {
        console.log(`[${name}] Deleted ${delBriefs.rowCount} client briefs.`);
      }

      // 4. Delete from users table by explicit email and test domain patterns
      const delUsers = await pool.query(
        `DELETE FROM users 
         WHERE LOWER(email) = ANY($1) 
            OR LOWER(email) LIKE '%@mcpatest.ph' 
            OR LOWER(email) LIKE '%@mcpa.ph' 
         RETURNING user_id, email, full_name, role`,
        [targetEmails.map((e) => e.toLowerCase())]
      );
      console.log(`[${name}] Deleted ${delUsers.rowCount} user accounts:`);
      delUsers.rows.forEach((u) => {
        console.log(`   - ID ${u.user_id}: ${u.email} (${u.full_name || "N/A"}, role: ${u.role})`);
      });
    } catch (err) {
      console.error(`[${name}] Error purging accounts:`, err.message);
    }
  }

  // 5. Clean from local_mock_db.json
  try {
    const mockData = db.readMockData();
    const originalCount = (mockData.users || []).length;
    mockData.users = (mockData.users || []).filter(
      (u) => !targetEmails.includes((u.email || "").toLowerCase())
    );
    mockData.client_briefs = (mockData.client_briefs || []).filter(
      (b) => !targetEmails.includes((b.client_email || b.clientEmail || "").toLowerCase())
    );
    db.writeMockData(mockData);
    console.log(`\n[MOCK STORAGE] Cleaned users: was ${originalCount}, now ${mockData.users.length}`);
  } catch (err) {
    console.warn("[WARN] Mock storage clean error:", err.message);
  }

  console.log("\nAll specified dummy and seeded accounts successfully purged!");
}

cleanAllDummyAccounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Clean script fatal error:", err);
    process.exit(1);
  });
