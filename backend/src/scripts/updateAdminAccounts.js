const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");
const bcrypt = require("bcryptjs");
const fs = require("fs");

async function syncAdminAccounts() {
  console.log("=== SYNCHRONIZING MCPA ADMIN ACCOUNTS ===");

  const passwordPlain = "MCPAcons@2026";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const allowedEmails = [
    "dbprojectmartquirante@gmail.com",
    "mcpa.construction@gmail.com",
    "contact@mcpaconstruction.com",
  ];

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${name} is not available.`);
      continue;
    }

    console.log(`\n>>> Processing ${name}...`);

    try {
      // 1. Ensure mcpa.construction@gmail.com is active admin
      const checkMcpa = await pool.query(
        "SELECT user_id, email, full_name FROM users WHERE LOWER(email) = LOWER($1)",
        ["mcpa.construction@gmail.com"]
      );

      if (checkMcpa.rows.length > 0) {
        await pool.query(
          `UPDATE users 
           SET 
             role = 'admin',
             account_status = 'active',
             password_hash = $1,
             invite_token = NULL,
             invite_expires_at = NULL,
             email_verified = TRUE,
             failed_login_attempts = 0,
             lockout_enabled = FALSE,
             lockout_end = NULL,
             updated_at = NOW()
           WHERE LOWER(email) = LOWER($2)`,
          [passwordHash, "mcpa.construction@gmail.com"]
        );
        console.log(`  ✓ Updated mcpa.construction@gmail.com to active admin with password.`);
      } else {
        await pool.query(
          `INSERT INTO users (
             email, password_hash, full_name, role, occupation, account_status,
             email_verified, failed_login_attempts, lockout_enabled, lockout_end,
             invite_token, invite_expires_at, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
           )`,
          [
            "mcpa.construction@gmail.com",
            passwordHash,
            "MCPA Engr. Pau",
            "admin",
            "Administrator",
            "active",
            true,
            0,
            false,
            null,
            null,
            null,
          ]
        );
        console.log(`  ✓ Created mcpa.construction@gmail.com as active admin.`);
      }

      // 2. Ensure contact@mcpaconstruction.com is active admin
      const checkContact = await pool.query(
        "SELECT user_id, email, full_name FROM users WHERE LOWER(email) = LOWER($1)",
        ["contact@mcpaconstruction.com"]
      );

      if (checkContact.rows.length > 0) {
        await pool.query(
          `UPDATE users 
           SET 
             role = 'admin',
             account_status = 'active',
             password_hash = $1,
             invite_token = NULL,
             invite_expires_at = NULL,
             email_verified = TRUE,
             failed_login_attempts = 0,
             lockout_enabled = FALSE,
             lockout_end = NULL,
             updated_at = NOW()
           WHERE LOWER(email) = LOWER($2)`,
          [passwordHash, "contact@mcpaconstruction.com"]
        );
        console.log(`  ✓ Updated contact@mcpaconstruction.com to active admin with password.`);
      } else {
        await pool.query(
          `INSERT INTO users (
             email, password_hash, full_name, role, occupation, account_status,
             email_verified, failed_login_attempts, lockout_enabled, lockout_end,
             invite_token, invite_expires_at, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
           )`,
          [
            "contact@mcpaconstruction.com",
            passwordHash,
            "MCPA Construction",
            "admin",
            "Administrator",
            "active",
            true,
            0,
            false,
            null,
            null,
            null,
          ]
        );
        console.log(`  ✓ Created contact@mcpaconstruction.com as active admin.`);
      }

      // 3. Clean OTPs and email verifications for removed emails
      await pool.query(
        `DELETE FROM otp_codes 
         WHERE LOWER(email) NOT IN ($1, $2, $3)`,
        allowedEmails.map(e => e.toLowerCase())
      );
      await pool.query(
        `DELETE FROM email_verifications 
         WHERE LOWER(email) NOT IN ($1, $2, $3)`,
        allowedEmails.map(e => e.toLowerCase())
      );

      // 4. Remove all other accounts from users table
      const delRes = await pool.query(
        `DELETE FROM users 
         WHERE LOWER(email) NOT IN ($1, $2, $3)
         RETURNING user_id, email, full_name, role`,
        allowedEmails.map(e => e.toLowerCase())
      );
      console.log(`  ✓ Removed ${delRes.rowCount} other accounts from ${name}:`);
      delRes.rows.forEach(u => console.log(`    - ID ${u.user_id}: ${u.email} (${u.full_name}, ${u.role})`));

      // 5. Query and display remaining accounts
      const remaining = await pool.query(
        "SELECT user_id, email, full_name, role, occupation, account_status, (invite_token IS NOT NULL) as has_invite FROM users ORDER BY user_id ASC"
      );
      console.log(`\n  [${name}] Current active accounts (${remaining.rows.length}):`);
      remaining.rows.forEach(u => {
        console.log(`    ⭐ ID ${u.user_id}: ${u.email} | Name: ${u.full_name} | Role: ${u.role} | Status: ${u.account_status} | InvitePending: ${u.has_invite}`);
      });
    } catch (err) {
      console.error(`[ERROR] Processing ${name}:`, err.message);
    }
  }

  // 6. Update local mock JSON file
  try {
    const mockFilePath = path.join(__dirname, "../../data/local_mock_db.json");
    let mockData = { users: [] };
    if (fs.existsSync(mockFilePath)) {
      mockData = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
    }

    // Filter to keep allowed, or update
    const existingMart = (mockData.users || []).find(
      u => (u.email || "").toLowerCase() === "dbprojectmartquirante@gmail.com"
    );

    mockData.users = [
      existingMart || {
        user_id: 1,
        email: "dbprojectmartquirante@gmail.com",
        full_name: "Engr. Raymart Quirante",
        role: "admin",
        occupation: "Software Engineer",
        account_status: "active",
        created_at: new Date().toISOString()
      },
      {
        user_id: 42,
        email: "mcpa.construction@gmail.com",
        password_hash: passwordHash,
        full_name: "MCPA Engr. Pau",
        role: "admin",
        occupation: "Administrator",
        account_status: "active",
        created_at: new Date().toISOString()
      },
      {
        user_id: 43,
        email: "contact@mcpaconstruction.com",
        password_hash: passwordHash,
        full_name: "MCPA Construction",
        role: "admin",
        occupation: "Administrator",
        account_status: "active",
        created_at: new Date().toISOString()
      }
    ];

    fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
    console.log(`\n✓ local_mock_db.json synced with active admin accounts.`);
  } catch (mErr) {
    console.warn("Mock update note:", mErr.message);
  }

  console.log("\n=== ALL TASKS COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

syncAdminAccounts().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
