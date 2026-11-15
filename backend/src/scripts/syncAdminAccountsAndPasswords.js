const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const db = require("../services/dbFailoverEngine");

const KEEP_EMAILS = [
  "dbprojectmartquirante@gmail.com",
  "mcpa.construction@gmail.com",
  "contact@mcpaconstruction.com",
];

async function syncAccounts() {
  console.log("Synchronizing admin accounts across Supabase and Neon...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("MCPAcons@2026", salt);

  const pools = [
    { name: "Supabase Pool", pool: db.supabasePool },
    { name: "Neon Pool", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${name} not available`);
      continue;
    }
    console.log(`\nProcessing ${name}...`);

    // 1. Remove non-whitelisted staff / extra admin accounts if any exist
    try {
      const delRes = await pool.query(`
        DELETE FROM users 
        WHERE LOWER(email) NOT IN (${KEEP_EMAILS.map(e => `'${e.toLowerCase()}'`).join(",")})
          AND role IN ('admin', 'architect', 'engineer', 'super_admin');
      `);
      console.log(`  - Removed ${delRes.rowCount || 0} non-whitelisted admin/staff users.`);
    } catch (e) {
      console.error(`  - Error removing extra accounts on ${name}:`, e.message);
    }

    // 2. Upsert or ensure each of the 3 accounts exists, active, role=admin, full_name='MCPA Construction and Supply', avatar_url=null
    for (const email of KEEP_EMAILS) {
      try {
        const userCheck = await pool.query(`SELECT user_id, email, password_hash FROM users WHERE LOWER(email) = $1`, [email.toLowerCase()]);
        if (userCheck.rows.length === 0) {
          // Insert new active admin
          await pool.query(`
            INSERT INTO users (
              email, 
              password_hash, 
              full_name, 
              role, 
              account_status, 
              avatar_url, 
              auth_provider, 
              created_at
            ) VALUES (
              $1, 
              $2, 
              'MCPA Construction and Supply', 
              'admin', 
              'active', 
              NULL, 
              'email', 
              NOW()
            );
          `, [email.toLowerCase(), passwordHash]);
          console.log(`  - Created active admin ${email}`);
        } else {
          // Update existing admin
          // For mcpa.construction and contact, update password to MCPAcons@2026
          // For dbprojectmartquirante, keep existing password or update name/status/avatar
          if (email !== "dbprojectmartquirante@gmail.com") {
            await pool.query(`
              UPDATE users 
              SET full_name = 'MCPA Construction and Supply',
                  role = 'admin',
                  account_status = 'active',
                  invite_token = NULL,
                  invite_expires_at = NULL,
                  avatar_url = NULL,
                  password_hash = $2
              WHERE LOWER(email) = $1;
            `, [email.toLowerCase(), passwordHash]);
          } else {
            await pool.query(`
              UPDATE users 
              SET full_name = 'MCPA Construction and Supply',
                  role = 'admin',
                  account_status = 'active',
                  invite_token = NULL,
                  invite_expires_at = NULL,
                  avatar_url = NULL
              WHERE LOWER(email) = $1;
            `, [email.toLowerCase()]);
          }
          console.log(`  - Updated active admin ${email}`);
        }
      } catch (e) {
        console.error(`  - Error processing ${email} on ${name}:`, e.message);
      }
    }

    // 3. Verify
    const res = await pool.query(`SELECT user_id, email, full_name, role, account_status, avatar_url FROM users ORDER BY user_id ASC;`);
    console.log(`  => Current users on ${name}:`);
    console.table(res.rows);
  }
}

syncAccounts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
