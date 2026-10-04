require("dotenv").config();
const db = require("../services/dbFailoverEngine");

async function cleanAllDummyAccounts() {
  console.log("Removing all dummy and seeded client accounts across databases...");

  const targetEmails = [
    "client.google@mcpa.ph",
    "client.facebook@mcpa.ph",
    "testclient.real@gmail.com"
  ];

  // 1. Delete from Primary DB (Supabase) and Standby (Neon) via query engine
  try {
    for (const email of targetEmails) {
      await db.query("DELETE FROM client_briefs WHERE LOWER(client_email) = LOWER($1)", [email]);
      const res = await db.query("DELETE FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      console.log(`[DB] Deleted ${email} from active database (${db.getActiveProviderName()})`);
    }

    // Also explicitly run against Neon Hot Standby pool if available
    if (db.neonPool) {
      for (const email of targetEmails) {
        await db.neonPool.query("DELETE FROM client_briefs WHERE LOWER(client_email) = LOWER($1)", [email]);
        await db.neonPool.query("DELETE FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        console.log(`[NEON] Deleted ${email} from Neon Standby Pool`);
      }
    }
  } catch (err) {
    console.warn("[WARN] DB deletion error:", err.message);
  }

  // 2. Clean from local_mock_db.json
  try {
    const mockData = db.readMockData();
    const originalCount = (mockData.users || []).length;
    mockData.users = (mockData.users || []).filter(
      (u) => !targetEmails.includes((u.email || "").toLowerCase()) && (u.role === "admin" || (u.full_name && !u.email.endsWith("@mcpa.ph")))
    );
    mockData.client_briefs = (mockData.client_briefs || []).filter(
      (b) => !targetEmails.includes((b.client_email || b.clientEmail || "").toLowerCase())
    );
    db.writeMockData(mockData);
    console.log(`[MOCK STORAGE] Cleaned users: was ${originalCount}, now ${mockData.users.length}`);
  } catch (err) {
    console.warn("[WARN] Mock storage clean error:", err.message);
  }

  console.log("All dummy accounts successfully purged from system!");
  process.exit(0);
}

cleanAllDummyAccounts().catch((err) => {
  console.error("Clean script fatal error:", err);
  process.exit(1);
});
