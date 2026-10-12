require("dotenv").config();
const { Pool } = require("pg");
const crypto = require("crypto");

async function runTransition() {
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;
  const supaConn =
    process.env.SUPABASE_CONNECTION_STRING ||
    (process.env.SUPABASE_DB_PASSWORD
      ? `postgres://postgres.dzqqyqothtttccplvvnb:${encodeURIComponent(
          process.env.SUPABASE_DB_PASSWORD
        )}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
      : null);

  const pools = [
    { name: "Supabase Primary", pool: new Pool({ connectionString: supaConn, ssl: { rejectUnauthorized: false } }) },
    { name: "Neon Standby", pool: new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } }) },
  ];

  const targetAccounts = [
    { email: "martquirante@gmail.com", name: "Raymart Quirante", phone: "+63 917 890 1234", projectCode: "MCPA-2026-MQ01A", subId: "MCPA-CPB-748291" },
    { email: "martquirante04@gmail.com", name: "Raymart Quirante", phone: "+63 917 890 1234", projectCode: "MCPA-2026-MQ04B", subId: "MCPA-CPB-748294" },
  ];

  for (const { name: dbName, pool } of pools) {
    console.log(`\n=======================================================`);
    console.log(`  TRANSITIONING TO PHASE 2 (CONSULTATION) ON [${dbName}]`);
    console.log(`=======================================================`);

    try {
      for (const target of targetAccounts) {
        console.log(`\n--- Processing Account: ${target.email} ---`);

        // 1. Ensure user exists
        let userRes = await pool.query(
          "SELECT user_id, email, full_name, role FROM users WHERE LOWER(email) = LOWER($1)",
          [target.email]
        );

        let userId = null;
        if (userRes.rows.length === 0) {
          console.log(`User ${target.email} does not exist yet. Creating user record...`);
          const insertUser = await pool.query(
            `INSERT INTO users (
              email, password_hash, full_name, first_name, last_name, role,
              auth_provider, avatar_url, kyc_verified_at, is_multi_project_approved, created_at
            ) VALUES (
              $1,
              '$2b$10$hvL5dC48ZMV5z9OuH2v40uVnJ0WrYwTKXGQTUVsReSYY3aB1hYH0W',
              $2, 'Raymart', 'Quirante', 'client',
              'google',
              'https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c',
              NOW(),
              FALSE,
              NOW()
            ) RETURNING user_id;`,
            [target.email, target.name]
          );
          userId = insertUser.rows[0].user_id;
          console.log(`Created user ${target.email} with user_id: ${userId}`);
        } else {
          userId = userRes.rows[0].user_id;
          console.log(`Found existing user ${target.email} with user_id: ${userId}`);
        }

        // 2. Check for existing active client_projects
        const activeProjRes = await pool.query(
          `SELECT client_project_id, project_code, stage_id FROM client_projects 
           WHERE user_id = $1 AND is_archived = FALSE ORDER BY client_project_id DESC LIMIT 1`,
          [userId]
        );

        let projectId = null;
        if (activeProjRes.rows.length > 0) {
          projectId = activeProjRes.rows[0].client_project_id;
          console.log(`User already has active project (ID: ${projectId}, Current Stage: ${activeProjRes.rows[0].stage_id}).`);
          // Elevate to CONSULTATION if not already
          await pool.query(
            `UPDATE client_projects SET stage_id = 'CONSULTATION', updated_at = NOW() WHERE client_project_id = $1`,
            [projectId]
          );
          console.log(`Updated client_project ${projectId} stage_id to 'CONSULTATION'`);
        } else {
          // Check collision on projectCode
          let pCode = target.projectCode;
          const codeCheck = await pool.query("SELECT 1 FROM client_projects WHERE project_code = $1", [pCode]);
          if (codeCheck.rows.length > 0) {
            pCode = `MCPA-2026-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
          }

          const newProj = await pool.query(
            `INSERT INTO client_projects (
              project_code, user_id, stage_id, project_title, project_type,
              target_location, is_archived, created_at, updated_at
            ) VALUES (
              $1, $2, 'CONSULTATION',
              'Modern Tropical Residence (Raymart Quirante)',
              'Residential Design & Build',
              'Plaridel, Bulacan',
              FALSE, NOW(), NOW()
            ) RETURNING client_project_id, project_code;`,
            [pCode, userId]
          );
          projectId = newProj.rows[0].client_project_id;
          console.log(`Created new client_project ${projectId} (${newProj.rows[0].project_code}) at stage 'CONSULTATION'`);
        }

        // 3. Ensure a client_briefs record exists and is linked
        const briefRes = await pool.query(
          `SELECT brief_id, client_project_id, current_stage_status FROM client_briefs 
           WHERE user_id = $1 OR LOWER(client_email) = LOWER($2) ORDER BY brief_id DESC LIMIT 1`,
          [userId, target.email]
        );

        let briefId = null;
        if (briefRes.rows.length > 0) {
          briefId = briefRes.rows[0].brief_id;
          console.log(`Found existing brief ${briefId}. Updating client_project_id and stage_status...`);
          await pool.query(
            `UPDATE client_briefs 
             SET client_project_id = $1, current_stage_status = 'CONSULTATION', status = 'Pending Review', user_id = $2
             WHERE brief_id = $3`,
            [projectId, userId, briefId]
          );
        } else {
          const addressJson = JSON.stringify({
            province: "Bulacan",
            city: "Plaridel",
            barangay: "Tabang",
            subdivision: "Grand Villas",
            street: "",
            houseNo: "",
            blkLot: "",
          });
          const wishlistJson = JSON.stringify({
            bedrooms: "4 Bedrooms",
            bathrooms: "3 Bathrooms",
            carGarage: "2-Car Garage",
            featureTags: ["high_ceiling", "balcony", "dirty_kitchen", "home_office"],
            featureTagsOther: "",
          });

          const newBrief = await pool.query(
            `INSERT INTO client_briefs (
              submission_id, client_name, client_email, client_phone,
              project_type, preferred_style, budget_range, lot_status,
              lot_area, target_date, location, financing_option,
              status, location_type, meeting_mode, meeting_date,
              meeting_time, meeting_link, wants_meeting, meeting_requested,
              availability_status, storeys, site_address_details,
              spatial_wishlist, message, user_id, client_project_id,
              current_stage_status, created_at
            ) VALUES (
              $1, $2, $3, $4,
              'Residential Design & Build', 'Modern Minimalist', '8,000,000 - 12,000,000', 'Titled & Ready (Clean TCT)',
              '350 sqm', 'Within 3-6 Months', 'Plaridel, Bulacan', 'Bank / Pag-IBIG Housing Loan Assistance',
              'Pending Review', 'Local', 'Online Video Call', '2026-10-22',
              '02:00 PM - 03:30 PM PHT', 'https://meet.jit.si/MCPA-Consultation-RaymartQuirante', TRUE, TRUE,
              'Confirmed Consultation Slot', '2-Storey Single Detached', $5,
              $6, 'Storeys: 2-Storey Single Detached • Bedrooms: 4 Bedrooms • Bathrooms: 3 Bathrooms • Garage: 2-Car Garage',
              $7, $8, 'CONSULTATION', NOW()
            ) RETURNING brief_id;`,
            [
              target.subId,
              target.name,
              target.email,
              target.phone,
              addressJson,
              wishlistJson,
              userId,
              projectId,
            ]
          );
          briefId = newBrief.rows[0].brief_id;
          console.log(`Created new client_brief ${briefId} linked to project ${projectId}`);
        }

        // Link brief_id back to client_project
        await pool.query(
          "UPDATE client_projects SET brief_id = $1 WHERE client_project_id = $2",
          [briefId, projectId]
        );

        // 4. Record stage_transition audit trail
        const existingTrans = await pool.query(
          "SELECT 1 FROM stage_transitions WHERE client_project_id = $1 AND to_stage = 'CONSULTATION'",
          [projectId]
        );
        if (existingTrans.rows.length === 0) {
          await pool.query(
            `INSERT INTO stage_transitions (
              client_project_id, from_stage, to_stage, transitioned_by, reason, metadata, created_at
            ) VALUES (
              $1, 'PRE_INQUIRY', 'CONSULTATION', $2,
              'Client spatial discovery completed. Elevated to Phase 2: Consultation & Architectural Brief.',
              $3, NOW()
            )`,
            [
              projectId,
              userId,
              JSON.stringify({ transitionReason: "User transitioned to Phase 2", automated: true }),
            ]
          );
          console.log(`Inserted stage_transition for project ${projectId}: PRE_INQUIRY -> CONSULTATION`);
        }

        // 5. Ensure meeting room exists
        const existingRoom = await pool.query(
          "SELECT meeting_id, room_code FROM meeting_rooms WHERE client_project_id = $1",
          [projectId]
        );
        if (existingRoom.rows.length === 0) {
          const roomCode = `mcpa-meet-${crypto.randomBytes(4).toString("hex")}`;
          await pool.query(
            `INSERT INTO meeting_rooms (
              client_project_id, room_code, guest_user_id, scheduled_start, meeting_status, created_at
            ) VALUES (
              $1, $2, $3, NOW() + INTERVAL '3 days', 'SCHEDULED', NOW()
            )`,
            [projectId, roomCode, userId]
          );
          console.log(`Created consultation meeting room ${roomCode} for project ${projectId}`);
        } else {
          console.log(`Meeting room already exists (${existingRoom.rows[0].room_code})`);
        }
      }
    } catch (e) {
      console.error(`Error on ${dbName}:`, e);
    } finally {
      await pool.end();
    }
  }

  console.log("\n=======================================================");
  console.log("  PHASE 2 TRANSITION COMPLETE ON ALL CLOUD DATABASES   ");
  console.log("=======================================================\n");
}

runTransition();
