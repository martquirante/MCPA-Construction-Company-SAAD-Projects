require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../services/dbFailoverEngine");

async function initializeDatabase() {
  console.log("\n=======================================================");
  console.log("  🏗️ MCPA CONSTRUCTION & SUPPLY — DATABASE INITIALIZER ");
  console.log("=======================================================");
  console.log(`Active Provider: ${db.getActiveProviderName()}`);

  try {
    // 1. Create USERS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) DEFAULT 'MCPA Administrator',
        role VARCHAR(50) DEFAULT 'admin',
        failed_login_attempts INT DEFAULT 0,
        lockout_enabled BOOLEAN DEFAULT FALSE,
        lockout_end TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'users' verified/created.");

    // 2. Create OTP_CODES table
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        otp_id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'otp_codes' verified/created.");

    // 3. Create PROJECTS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        category VARCHAR(100),
        year VARCHAR(50),
        description TEXT,
        images TEXT[],
        is_admin_added BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'projects' verified/created.");

    // 4. Create CLIENT_BRIEFS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS client_briefs (
        brief_id SERIAL PRIMARY KEY,
        submission_id VARCHAR(50),
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50),
        project_type VARCHAR(100),
        preferred_style VARCHAR(255),
        budget_range VARCHAR(100),
        lot_status VARCHAR(100),
        lot_area VARCHAR(50),
        target_date VARCHAR(100),
        location VARCHAR(255),
        financing_option VARCHAR(100),
        uploaded_files TEXT[],
        status VARCHAR(50) DEFAULT 'Pending Consultation Review',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'client_briefs' verified/created.");

    const defaultAdmins = [
      { email: "admin@mcpa.com", pass: "mcpa2026", name: "MCPA Lead Administrator" },
      { email: "dbprojectmartquirante@gmail.com", pass: "mcpa2026", name: "Mart Quirante (MCPA Admin)" },
      { email: "rayquirante@gmail.com", pass: "mcpa2026", name: "Ray Quirante (MCPA Admin)" },
    ];

    for (const adm of defaultAdmins) {
      const checkAdmin = await db.query("SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1)", [adm.email]);
      if (!checkAdmin.rows || checkAdmin.rows.length === 0) {
        const hashed = await bcrypt.hash(adm.pass, 10);
        await db.query(
          "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin')",
          [adm.email, hashed, adm.name]
        );
        console.log(`\x1b[32m✅ Seeded Administrator: ${adm.email} (Password: ${adm.pass})\x1b[0m`);
      } else {
        console.log(`ℹ️ Administrator (${adm.email}) is already initialized.`);
      }
    }

    console.log("\n🚀 Database initialization completed successfully!\n");
    return true;
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
    return false;
  }
}

if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = initializeDatabase;
