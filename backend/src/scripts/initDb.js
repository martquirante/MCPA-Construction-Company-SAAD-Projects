require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../services/dbFailoverEngine");

async function initializeDatabase() {
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
    console.log("[OK] Table 'users' verified/created.");

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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Table 'projects' verified/created.");

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
    ];
    for (const q of briefCols) {
      try { await db.query(q); } catch (e) {}
    }
    console.log("[OK] Table 'client_briefs' verified/updated with SAAD Flowchart stages.");

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

    // Seed Demo Active Project (The Meridian Modern Residence: MCPA-PLR-2024)
    try {
      const checkProj = await db.query("SELECT project_code FROM site_projects WHERE project_code = 'MCPA-PLR-2024'");
      if (!checkProj.rows || checkProj.rows.length === 0) {
        await db.query(`
          INSERT INTO site_projects (
            project_code, name, client_name, client_email, location,
            contract_date, original_turnover, revised_turnover,
            progress_pct, current_phase, lead_engineer, virtual_tour_url
          ) VALUES (
            'MCPA-PLR-2024',
            'The Meridian Modern Residence',
            'Engr. & Mrs. Dela Cruz',
            'delacruz.client@gmail.com',
            'Tabang, Plaridel, Bulacan',
            'January 15, 2024',
            'November 15, 2024',
            'November 28, 2024',
            65,
            'Phase 3: Structural Masonry & Second Level Pouring',
            'Engr. Raymart Quirante, CE (PRC Lic. #018492)',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&fit=crop'
          );
        `);

        // Seed Milestones
        const demoMilestones = [
          ['MCPA-PLR-2024', '01-Foundation', 'Site Profiling, Geodetic Scan & Soil Testing', 100, 'Completed', 'Feb 02, 2024', 'Soil bearing capacity qa = 180 kPa verified.', 20],
          ['MCPA-PLR-2024', '02-Framing', 'Signed & Sealed Blueprints & LGU Permitting', 100, 'Completed', 'Mar 10, 2024', 'Plaridel LGU Building Permit granted. Full PRC signed package.', 20],
          ['MCPA-PLR-2024', '03-Roofing', 'Structural Columns, Grade 60 Rebar & Slab Pouring', 65, 'In Progress', 'Aug - Sep 2024', 'Grade 60 steel rebars tied; 3000 PSI ready-mix passed.', 25],
          ['MCPA-PLR-2024', '04-Finishes', 'Architectural Finishes, Plumbing & Glazing', 0, 'Upcoming', 'Target: Oct 2024', 'Italian tiles and custom cabinetry preparation.', 20],
          ['MCPA-PLR-2024', '05-Turnover', 'Ceremonial Key Handover & LGU Occupancy', 0, 'Upcoming', 'Target: Nov 2024', '100-point joint engineering audit and Certificate of Occupancy.', 15]
        ];
        for (const m of demoMilestones) {
          await db.query(`
            INSERT INTO site_milestones (project_code, phase_code, phase_name, completion_pct, status, target_date, notes, weight)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, m);
        }

        // Seed Photo Logs
        const demoPhotos = [
          ['MCPA-PLR-2024', 'Second Floor Slab Rebar Inspection & Formwork', 'Verified spacing of 16mm Grade 60 top bars with 25mm concrete cover blocks in place.', 'Site Lead Engineer', 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&h=500&fit=crop&auto=format', 'Sep 10, 2024', false],
          ['MCPA-PLR-2024', 'Ground Floor Column Pouring & Curing Monitoring', '3000 PSI ready-mix mechanical vibrator consolidation complete; moist curing maintained.', 'Materials Quality Inspector', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=500&fit=crop&auto=format', 'Aug 28, 2024', false],
          ['MCPA-PLR-2024', 'Foundation Footing & Grade Beam Steel Framing', 'Footing tie beams inspected prior to concrete pour. Zero water pooling verified.', 'Structural Engineer', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop&auto=format', 'Jul 14, 2024', false],
          ['MCPA-PLR-2024', '360° Panoramic Lot Sweep — Active Framing Phase', 'Complete 360-degree interactive camera capture of ground slab and column perimeters.', 'Field PM', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&fit=crop', 'Sep 05, 2024', true]
        ];
        for (const p of demoPhotos) {
          await db.query(`
            INSERT INTO site_photo_logs (project_code, title, caption, inspector, image_url, log_date, is_360)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, p);
        }

        // Seed Billing Ledger
        const demoLedger = [
          ['MCPA-PLR-2024', 'Downpayment / Contract Execution & Mobilization', 850000.00, 'Paid', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop', 'OR-2024-00189', 'Jan 20, 2024', 'Jan 18, 2024'],
          ['MCPA-PLR-2024', 'Milestone 1: Substructure & Foundation Pouring', 650000.00, 'Paid', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop', 'OR-2024-00244', 'Mar 15, 2024', 'Mar 14, 2024'],
          ['MCPA-PLR-2024', 'Milestone 2: Second Floor Structural Framing & Slab', 750000.00, 'Pending', null, null, 'Sep 30, 2024', null],
          ['MCPA-PLR-2024', 'Milestone 3: Roofing, Masonry & Rough-ins', 600000.00, 'Pending', null, null, 'Oct 25, 2024', null],
          ['MCPA-PLR-2024', 'Milestone 4: Turnkey Architectural Finishes & Handover', 400000.00, 'Pending', null, null, 'Nov 28, 2024', null]
        ];
        for (const b of demoLedger) {
          await db.query(`
            INSERT INTO billing_ledger (project_code, milestone_title, amount_due, status, proof_url, or_number, due_date, paid_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, b);
        }

        // Seed Delay Event
        await db.query(`
          INSERT INTO delay_events (project_code, category, days_delayed, reason)
          VALUES ('MCPA-PLR-2024', 'Weather / Monsoon Rain', 13, 'Typhoon rain flooded approach road in Plaridel; concrete ready-mix trucks halted for curing safety.');
        `);

        console.log("[OK] Seeded sample live project 'MCPA-PLR-2024' with milestones, photos, and billing ledger.");
      }

      // Seed Portfolio Projects if empty
      const checkProjectsCount = await db.query("SELECT COUNT(*) FROM projects");
      if (parseInt(checkProjectsCount.rows[0].count, 10) === 0) {
        const initialProjects = [
          {
            name: "The Meridian Modern Residence",
            location: "Tabang, Plaridel, Bulacan",
            year: "2024",
            category: "Residential",
            description: "Two-storey contemporary home with cantilevered balcony, reinforced concrete framing, perimeter fence, and complete turnkey architectural finishing.",
            images: ["https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"],
          },
          {
            name: "Tabang Commercial Complex",
            location: "Tabang, Plaridel",
            year: "2024",
            category: "Commercial",
            description: "Commercial facility and supply yard featuring high-spec structural steel trusses, modern storefront facades, and heavy-duty logistics access.",
            images: ["https://images.unsplash.com/photo-1706164971302-e30c0640cc3b?w=800&h=1200&fit=crop&auto=format"],
          },
          {
            name: "Grand Royale Executive Villa",
            location: "Malolos, Bulacan",
            year: "2023",
            category: "Luxury Villa",
            description: "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 5-year structural warranty.",
            images: ["https://images.unsplash.com/photo-1762811054947-605b20298615?w=800&h=600&fit=crop&auto=format"],
          },
          {
            name: "North Industrial Logistics Hub",
            location: "Guiguinto, Bulacan",
            year: "2024",
            category: "Commercial",
            description: "Large-span logistics warehouse and administration annex featuring seismic foundation ties and high-load industrial flooring.",
            images: ["https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=1400&h=700&fit=crop&auto=format"],
          },
          {
            name: "Pampanga Zen Sanctuary",
            location: "Pulilan, Bulacan",
            year: "2024",
            category: "Modern Zen",
            description: "Minimalist Japanese-inspired residence featuring natural timber accents, central dry gravel courtyard, and passive natural cross-ventilation.",
            images: ["https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format"],
          },
        ];

        for (const p of initialProjects) {
          await db.query(
            "INSERT INTO projects (name, location, year, category, description, images, is_admin_added) VALUES ($1, $2, $3, $4, $5, $6, FALSE)",
            [p.name, p.location, p.year, p.category, p.description, p.images]
          );
        }
        console.log("[OK] Seeded real MCPA portfolio projects into 'projects' table.");
      }

      // Seed Initial OCR Expenses if empty
      const checkOcrCount = await db.query("SELECT COUNT(*) FROM expenses_ocr WHERE project_code = 'MCPA-PLR-2024'");
      if (parseInt(checkOcrCount.rows[0].count, 10) === 0) {
        await db.query(`
          INSERT INTO expenses_ocr (project_code, vendor_name, receipt_image_url, extracted_total, raw_ocr_text)
          VALUES 
            ('MCPA-PLR-2024', 'Wilcon Depot Baliuag', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop', 34200.00, 'PNS Grade 60 Rebars 16mm (20 pcs), Tie Wire #16'),
            ('MCPA-PLR-2024', 'CitiHardware Plaridel', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop', 12850.50, 'Portland Cement Type 1 (50 bags), Fine Sand (2 cu.m)');
        `);
        console.log("[OK] Seeded verified hardware receipt records into 'expenses_ocr'.");
      }
    } catch (err) {
      console.warn("[WARN] Demo project seeding notice:", err.message);
    }

    console.log("\n[SUCCESS] Database initialization completed successfully!\n");
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
