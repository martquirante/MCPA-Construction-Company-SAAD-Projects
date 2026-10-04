const { Pool } = require("pg");

async function syncUsers() {
  const supabasePool = new Pool({
    connectionString: "postgres://postgres.dzqqyqothtttccplvvnb:%2ASAADmpcpa2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  });
  const neonPool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_Dj7KywF1Hafk@ep-ancient-lab-b3dmiuuh-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  });

  try {
    const sUsers = await supabasePool.query("SELECT * FROM users ORDER BY user_id ASC");
    console.log("Supabase users count:", sUsers.rows.length);

    // Get column list of Neon users table
    const neonColsRes = await neonPool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    const neonCols = new Set(neonColsRes.rows.map((r) => r.column_name));

    for (const u of sUsers.rows) {
      const email = (u.email || "").trim().toLowerCase();
      const exists = await neonPool.query("SELECT user_id FROM users WHERE email = $1", [email]);

      if (exists.rows.length === 0) {
        console.log("Syncing user to Neon:", email, u.full_name);
        
        // Filter keys only present in Neon table
        const validKeys = Object.keys(u).filter((k) => neonCols.has(k));
        const validVals = validKeys.map((k) => u[k]);
        const placeholders = validKeys.map((_, i) => `$${i + 1}`).join(", ");

        const insertSql = `INSERT INTO users (${validKeys.join(", ")}) VALUES (${placeholders}) ON CONFLICT (email) DO NOTHING`;
        await neonPool.query(insertSql, validVals);
        console.log("Successfully inserted into Neon:", email);
      } else {
        console.log("Already exists in Neon:", email);
      }
    }

    const nUsers = await neonPool.query("SELECT user_id, email, full_name, role, auth_provider FROM users");
    console.log("\n--- VERIFIED NEON USERS NOW (COUNT:", nUsers.rows.length, ") ---");
    console.table(nUsers.rows);
  } catch (e) {
    console.error("Sync error:", e);
  } finally {
    await supabasePool.end();
    await neonPool.end();
  }
}

syncUsers();
