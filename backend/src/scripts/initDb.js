require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../services/dbFailoverEngine");

let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;
  if (db.isMockActive) {
    console.log("[initDb] Mock storage engine active, skipping PostgreSQL schema migration.");
    isInitialized = true;
    return;
  }

  // On Vercel serverless, skip full DDL rerun if schema is already initialized
  if (process.env.VERCEL) {
    try {
      const check = await db.query("SELECT 1 FROM users LIMIT 1;");
      if (check && check.rows) {
        console.log("[initDb] Schema already verified on Supabase. Skipping redundant migrations on serverless cold start.");
        isInitialized = true;
        return;
      }
    } catch (e) {
      // If error, continue with initialization
    }
  }
  console.log("\n=======================================================");
  console.log("  MCPA CONSTRUCTION & SUPPLY - DATABASE INITIALIZER    ");
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

    // Add profile columns to users table
    const userCols = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS has_viber_whatsapp BOOLEAN DEFAULT FALSE;",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'Local';",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_name VARCHAR(150);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(150);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_contact_time VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS lot_ownership_status VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subdivision_lot_details VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS target_build_location VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS target_project_type VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS ofw_country VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS ph_rep_name VARCHAR(150);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS ph_rep_relationship VARCHAR(100);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS ph_rep_phone VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url TEXT;",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url TEXT;",
    ];
    for (const q of userCols) {
      try { await db.query(q); } catch (e) {}
    }
    console.log("[OK] Table 'users' verified/created with client profile columns.");

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
    console.log("[OK] Table 'otp_codes' verified/created.");

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
        is_web_visible BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'completed',
        month VARCHAR(50) DEFAULT 'January',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Add columns if not exists (migrations)
    try {
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_web_visible BOOLEAN DEFAULT TRUE;");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS month VARCHAR(50) DEFAULT 'January';");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS lot_area VARCHAR(50);");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_area VARCHAR(50);");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS bedrooms VARCHAR(50);");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS bathrooms VARCHAR(50);");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS features TEXT[];");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS architectural_details TEXT;");
      await db.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured_on_home BOOLEAN DEFAULT FALSE;");
      // Ensure all seeded and custom projects are manageable by admin
      await db.query("UPDATE projects SET is_admin_added = TRUE WHERE is_admin_added IS NULL OR is_admin_added = FALSE;");
    } catch (e) {}

    console.log("[OK] Table 'projects' verified/created with architectural specifications.");

    // 4. Create CLIENT_BRIEFS table (Extended with SAAD Flowchart fields)
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
        status VARCHAR(50) DEFAULT 'Pending Review',
        location_type VARCHAR(50) DEFAULT 'Local',
        meeting_mode VARCHAR(100) DEFAULT 'Online Meeting (Google Meet)',
        meeting_date VARCHAR(100),
        meeting_time VARCHAR(100),
        meeting_link TEXT,
        meeting_notes TEXT,
        quotation_amount NUMERIC(12, 2),
        quotation_notes TEXT,
        client_portal_code VARCHAR(50),
        map_coordinates VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add any missing columns to client_briefs if table already existed
    const briefCols = [
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS location_type VARCHAR(50) DEFAULT 'Local';",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS meeting_mode VARCHAR(100) DEFAULT 'Online Meeting (Google Meet)';",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS meeting_date VARCHAR(100);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(100);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS meeting_link TEXT;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS meeting_notes TEXT;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS quotation_amount NUMERIC(12, 2);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS quotation_notes TEXT;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS client_portal_code VARCHAR(50);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS map_coordinates VARCHAR(100);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS user_id INT;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS wants_meeting BOOLEAN DEFAULT FALSE;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS venue_type VARCHAR(100);",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS venue_details TEXT;",
      "ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS availability_status VARCHAR(100) DEFAULT 'Pending Availability Confirmation';",
    ];
    for (const q of briefCols) {
      try { await db.query(q); } catch (e) {}
    }
    console.log("[OK] Table 'client_briefs' verified/updated with SAAD Flowchart stages and meeting venues.");

    // 5. Create SITE_PROJECTS table (Active Execution)
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_projects (
        project_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        contract_date VARCHAR(100),
        original_turnover VARCHAR(100),
        revised_turnover VARCHAR(100),
        progress_pct INT DEFAULT 0,
        current_phase VARCHAR(255),
        lead_engineer VARCHAR(255),
        virtual_tour_url TEXT,
        status VARCHAR(50) DEFAULT 'Active Site Execution',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'site_projects' verified/created.");

    // 6. Create SITE_MILESTONES table
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_milestones (
        milestone_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        phase_code VARCHAR(50) NOT NULL,
        phase_name VARCHAR(255) NOT NULL,
        completion_pct INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Upcoming',
        target_date VARCHAR(100),
        notes TEXT,
        weight INT DEFAULT 20
      );
    `);
    console.log("[OK] Table 'site_milestones' verified/created.");

    // 7. Create SITE_PHOTO_LOGS table (Visual Proof of Life)
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_photo_logs (
        log_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        caption TEXT,
        inspector VARCHAR(255),
        image_url TEXT NOT NULL,
        log_date VARCHAR(100),
        is_360 BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'site_photo_logs' verified/created.");

    // 8. Create BILLING_LEDGER table
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_ledger (
        bill_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        milestone_title VARCHAR(255) NOT NULL,
        amount_due NUMERIC(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        proof_url TEXT,
        or_number VARCHAR(100),
        due_date VARCHAR(100),
        paid_date VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'billing_ledger' verified/created.");

    // 9. Create DELAY_EVENTS table (Algorithmic Critical Path)
    await db.query(`
      CREATE TABLE IF NOT EXISTS delay_events (
        event_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        days_delayed INT NOT NULL,
        reason TEXT NOT NULL,
        logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'delay_events' verified/created.");

    // 10. Create WARRANTY_TICKETS table (Post-Turnover Maintenance)
    await db.query(`
      CREATE TABLE IF NOT EXISTS warranty_tickets (
        ticket_id VARCHAR(50) PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log("[OK] Table 'warranty_tickets' verified/created.");

    // 11. Create EXPENSES_OCR table (AI Receipt Scanner)
    await db.query(`
      CREATE TABLE IF NOT EXISTS expenses_ocr (
        expense_id SERIAL PRIMARY KEY,
        project_code VARCHAR(50) NOT NULL,
        vendor_name VARCHAR(255),
        receipt_image_url TEXT,
        extracted_total NUMERIC(12, 2) NOT NULL,
        raw_ocr_text TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'expenses_ocr' verified/created.");

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
        console.log(`\x1b[32m[OK] Seeded Administrator: ${adm.email} (Password: ${adm.pass})\x1b[0m`);
      } else {
        console.log(`[INFO] Administrator (${adm.email}) is already initialized.`);
      }
    }

    // Ensure system_metadata table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_metadata (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("\n[SUCCESS] Database initialization completed successfully!\n");
    isInitialized = true;
    return true;
  } catch (err) {
    console.error("[ERROR] Database initialization error:", err.message);
    return false;
  }
}

if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = initializeDatabase;
