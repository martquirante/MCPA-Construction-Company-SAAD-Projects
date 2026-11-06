/**
 * SEED SCRIPT FOR SYSTEM SCREEN DOCUMENTATION
 * Injects high-fidelity mock data into Supabase (and Neon standby)
 * for capturing complete, populated screenshots across all public, client portal, and admin views.
 *
 * All records are tagged with prefix 'DOC-SEED-' for 100% clean, safe deletion.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");
const crypto = require("crypto");

const SEED_TAG = "DOC-SEED-";
const DEMO_CLIENT_EMAIL = "client.documentation@mcpaconstruction.com";
const DEMO_PROJECT_CODE = "DOC-PRJ-2026-01";
const DEMO_SUBMISSION_ID = "DOC-SUB-8801";

async function runSeed() {
  console.log("===============================================================");
  console.log("  BUILDYSNC DOCUMENTATION DATA SEEDING (SUPABASE + NEON)       ");
  console.log("===============================================================\n");

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  for (const { name: dbName, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${dbName} is not active.`);
      continue;
    }
    console.log(`>>> Seeding into ${dbName}...`);

    try {
      // 1. Ensure Documentation Demo Client User exists
      const userCheck = await pool.query(
        "SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1)",
        [DEMO_CLIENT_EMAIL]
      );

      let clientId = null;
      if (userCheck.rows.length === 0) {
        const userInsert = await pool.query(
          `INSERT INTO users (
            email, password_hash, full_name, first_name, last_name, role,
            auth_provider, avatar_url, kyc_photo_url, kyc_verified_at,
            phone_number, location_address, client_type, has_viber_whatsapp,
            is_multi_project_approved, created_at
          ) VALUES (
            $1,
            '$2b$10$hvL5dC48ZMV5z9OuH2v40uVnJ0WrYwTKXGQTUVsReSYY3aB1hYH0W',
            'Engr. Raymart Quirante', 'Raymart', 'Quirante', 'client',
            'local',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            NOW(),
            '+63 917 890 1234', 'Plaridel, Bulacan, Philippines', 'Local', TRUE,
            TRUE, NOW()
          ) RETURNING user_id;`,
          [DEMO_CLIENT_EMAIL]
        );
        clientId = userInsert.rows[0].user_id;
        console.log(`  [+] Created Client User: ${DEMO_CLIENT_EMAIL} (ID: ${clientId})`);
      } else {
        clientId = userCheck.rows[0].user_id;
        console.log(`  [*] Found existing Client User (ID: ${clientId})`);
      }

      // 2. Clean previous doc seed records if any
      await pool.query("DELETE FROM delay_events WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM site_photo_logs WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM site_milestones WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM billing_ledger WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM expenses_ocr WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM client_projects WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM site_projects WHERE project_code = $1", [DEMO_PROJECT_CODE]).catch(() => {});
      await pool.query("DELETE FROM client_briefs WHERE submission_id LIKE $1", [`${SEED_TAG}%`]).catch(() => {});
      await pool.query("DELETE FROM meeting_history_logs WHERE session_id LIKE $1", [`${SEED_TAG}%`]).catch(() => {});

      // 3. Seed Inquiries (Client Briefs) with rich Philippine locations & coordinates
      const briefData = [
        {
          submission_id: `${SEED_TAG}BRIEF-01`,
          client_name: "Arch. Maria Clara Santos",
          client_email: "maria.santos@architects.ph",
          client_phone: "+63 918 234 5678",
          project_type: "Residential Design & Build",
          preferred_style: "Modern Minimalist Two-Storey Villa",
          budget_range: "₱5,000,000 - ₱7,000,000",
          lot_status: "Titled & Clean",
          lot_area: "280 sqm",
          target_date: "Q1 2027",
          location: "Plaridel, Bulacan",
          status: "Pending Review",
          meeting_mode: "In-Browser Video Consultation",
          meeting_date: "2026-11-14",
          meeting_time: "10:30 AM",
          map_coordinates: "14.8872, 120.8572",
          details: { province: "Bulacan", city: "Plaridel", barangay: "Banga 1st", subdivision: "Aura Prime Estates" },
        },
        {
          submission_id: `${SEED_TAG}BRIEF-02`,
          client_name: "Dr. Arthur Pendelton",
          client_email: "arthur.pendelton@medicare.ph",
          client_phone: "+63 920 345 6789",
          project_type: "Commercial & Office Space",
          preferred_style: "Industrial Contemporary Glass Facade",
          budget_range: "₱8,000,000 - ₱12,000,000",
          lot_status: "Titled & Ready",
          lot_area: "450 sqm",
          target_date: "Q2 2027",
          location: "City of San Jose Del Monte, Bulacan",
          status: "Consultation Scheduled",
          meeting_mode: "Face-to-Face Meeting (Office)",
          meeting_date: "2026-11-15",
          meeting_time: "02:00 PM",
          map_coordinates: "14.8135, 121.0453",
          details: { province: "Bulacan", city: "City of San Jose Del Monte", barangay: "Tungkong Mangga", subdivision: "Metro Heights Commercial Park" },
        },
        {
          submission_id: `${SEED_TAG}BRIEF-03`,
          client_name: "Atty. Bea Alonzo-Valdez",
          client_email: "bea.valdez@lawgroup.ph",
          client_phone: "+63 917 456 7890",
          project_type: "Residential Renovation & Expansion",
          preferred_style: "Scandinavian Tropical with Courtyard",
          budget_range: "₱3,500,000 - ₱5,000,000",
          lot_status: "Existing Structure for Demolition",
          lot_area: "200 sqm",
          target_date: "Q1 2027",
          location: "Malolos, Bulacan",
          status: "Quotation Sent",
          meeting_mode: "In-Browser Video Consultation",
          meeting_date: "2026-11-10",
          meeting_time: "04:00 PM",
          map_coordinates: "14.8527, 120.8160",
          quotation_amount: 4850000.00,
          details: { province: "Bulacan", city: "Malolos", barangay: "Dakila", subdivision: "Grand Malolos Villas" },
        },
        {
          submission_id: `${SEED_TAG}BRIEF-04`,
          client_name: "Engr. Justin Raven Calangi",
          client_email: "justin.calangi@mcpatest.ph",
          client_phone: "+63 919 678 1234",
          project_type: "Residential Design & Build",
          preferred_style: "Japandi Clean Line Architectural Home",
          budget_range: "₱6,000,000 - ₱8,500,000",
          lot_status: "Titled & Sloped Lot",
          lot_area: "320 sqm",
          target_date: "Q3 2027",
          location: "Santa Maria, Bulacan",
          status: "Contract Approved",
          meeting_mode: "In-Browser Video Consultation",
          meeting_date: "2026-11-08",
          meeting_time: "01:30 PM",
          map_coordinates: "14.8197, 120.9610",
          quotation_amount: 6720000.00,
          details: { province: "Bulacan", city: "Santa Maria", barangay: "Poblacion", subdivision: "Santa Maria Executive Greens" },
        }
      ];

      for (const b of briefData) {
        await pool.query(
          `INSERT INTO client_briefs (
            submission_id, client_name, client_email, client_phone,
            project_type, preferred_style, budget_range, lot_status,
            lot_area, target_date, location, financing_option,
            status, meeting_mode, meeting_date, meeting_time,
            quotation_amount, map_coordinates, site_address_details,
            created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Bank Financing',
            $12, $13, $14, $15, $16, $17, $18, NOW()
          );`,
          [
            b.submission_id, b.client_name, b.client_email, b.client_phone,
            b.project_type, b.preferred_style, b.budget_range, b.lot_status,
            b.lot_area, b.target_date, b.location,
            b.status, b.meeting_mode, b.meeting_date, b.meeting_time,
            b.quotation_amount || null, b.map_coordinates, JSON.stringify(b.details)
          ]
        );
      }
      console.log(`  [+] Seeded ${briefData.length} client inquiry briefs with coordinates.`);

      // 4. Seed Active Site Project (Stage 3: Active Construction)
      const virtualTours = JSON.stringify([
        {
          title: "Exterior 3D Drone & Structural Sweep",
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
        },
        {
          title: "Interior Spatial Walkthrough (Matterport)",
          url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
        }
      ]);

      await pool.query(
        `INSERT INTO site_projects (
          project_code, name, client_name, client_email, location,
          contract_date, original_turnover, revised_turnover, progress_pct,
          current_phase, lead_engineer, virtual_tour_url, virtual_tour_urls,
          status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, NOW()
        );`,
        [
          DEMO_PROJECT_CODE,
          "The Glass Pavilion Residence (Plaridel Executive)",
          "Engr. Raymart Quirante",
          DEMO_CLIENT_EMAIL,
          "Plaridel, Bulacan",
          "June 15, 2026",
          "April 30, 2027",
          "May 15, 2027",
          65,
          "Phase 4: Second Floor Suspended Slab Curing & Column Erection",
          "Engr. Raymart Quirante",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
          virtualTours,
          "Active Site Execution"
        ]
      );
      console.log(`  [+] Seeded Active Site Project: ${DEMO_PROJECT_CODE} (65% Progress)`);

      // 5. Seed Client Project bridge record for client portal
      await pool.query(
        `INSERT INTO client_projects (
          project_code, user_id, stage_id, project_title, project_type,
          target_location, site_project_code, is_archived, created_at, updated_at
        ) VALUES (
          $1, $2, 'ACTIVE_BUILD', $3, $4, $5, $6, FALSE, NOW(), NOW()
        );`,
        [
          DEMO_PROJECT_CODE,
          clientId,
          "The Glass Pavilion Residence (Plaridel Executive)",
          "Residential Design & Build",
          "Plaridel, Bulacan",
          DEMO_PROJECT_CODE
        ]
      );
      console.log(`  [+] Linked client_project bridge to client portal at stage ACTIVE_BUILD`);

      // 6. Seed Site Milestones
      const milestones = [
        { phase: "PHASE-01", name: "Site Clearing, Soil Testing & Staking Layout", pct: 100, status: "Completed", date: "July 5, 2026", weight: 10 },
        { phase: "PHASE-02", name: "Substructure Excavation, Footing Rebar & Tie Beams", pct: 100, status: "Completed", date: "August 20, 2026", weight: 20 },
        { phase: "PHASE-03", name: "Ground Floor Slab Pouring & Vibratory Compaction", pct: 100, status: "Completed", date: "September 25, 2026", weight: 20 },
        { phase: "PHASE-04", name: "Second Floor Slab Formwork & Rebar Curing", pct: 65, status: "In Progress", date: "November 28, 2026", weight: 20 },
        { phase: "PHASE-05", name: "CHB Masonry Wall Partitioning & MEPF Rough-ins", pct: 15, status: "Upcoming", date: "January 15, 2027", weight: 15 },
        { phase: "PHASE-06", name: "Roof Trusses, Insulation & Architectural Finishes", pct: 0, status: "Upcoming", date: "March 30, 2027", weight: 15 }
      ];

      for (const m of milestones) {
        await pool.query(
          `INSERT INTO site_milestones (
            project_code, phase_code, phase_name, completion_pct, status, target_date, weight
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [DEMO_PROJECT_CODE, m.phase, m.name, m.pct, m.status, m.date, m.weight]
        );
      }
      console.log(`  [+] Seeded ${milestones.length} construction milestones.`);

      // 7. Seed Photo Logs with authentic architectural & construction site imagery
      const photoLogs = [
        {
          title: "Second Floor Structural Beam & Rebar Tie Inspection",
          caption: "QA verification of Grade 60 high-tensile rebars spacing and column lap splices according to Structural Sheet S-04.",
          inspector: "Engr. Justin Raven Calangi",
          image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80",
          date: "November 04, 2026",
          is_360: false
        },
        {
          title: "Suspended Slab Concrete Slump Test & Moisture Verification",
          caption: "On-site slump cone test recorded at 100mm, confirming optimal 3,500 PSI mix workability prior to transit pump discharge.",
          inspector: "Edgar L. Guimayen",
          image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
          date: "November 02, 2026",
          is_360: false
        },
        {
          title: "360° Spherical Panoramic Site Sweep: Grid Lines A to E",
          caption: "Weekly spatial telemetry capture allowing the client and remote consultants to inspect perimeter scaffolding and staging areas.",
          inspector: "Engr. Raymart Quirante",
          image_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
          date: "October 29, 2026",
          is_360: true
        },
        {
          title: "Ground Floor Electrical & Sanitary Conduit Sleeves Layout",
          caption: "Pre-pour installation of Schedule 40 UPVC conduit runs for power distribution and sanitary waste stacks verified against MEPF plans.",
          inspector: "Amos Joel Cabreros",
          image_url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80",
          date: "October 24, 2026",
          is_360: false
        },
        {
          title: "Perimeter Footing & Tie Beam Concrete Curing Flood Test",
          caption: "7-day continuous hydration curing of reinforced concrete foundation footings achieving 88% design compressive strength.",
          inspector: "Engr. Justin Raven Calangi",
          image_url: "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80",
          date: "October 15, 2026",
          is_360: false
        }
      ];

      for (const p of photoLogs) {
        await pool.query(
          `INSERT INTO site_photo_logs (
            project_code, title, caption, inspector, image_url, log_date, is_360, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
          [DEMO_PROJECT_CODE, p.title, p.caption, p.inspector, p.image_url, p.date, p.is_360]
        );
      }
      console.log(`  [+] Seeded ${photoLogs.length} verified site photo logs.`);

      // 8. Seed Billing Ledger entries
      const billings = [
        {
          title: "Mobilization & Downpayment (15% Contract Value)",
          amount: 975000.00,
          status: "Paid",
          or_number: "MCPA-OR-2026-0412",
          due_date: "June 20, 2026",
          paid_date: "June 18, 2026",
          proof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Milestone Billing 1: Foundation & Substructure Completion",
          amount: 1300000.00,
          status: "Paid",
          or_number: "MCPA-OR-2026-0589",
          due_date: "August 25, 2026",
          paid_date: "August 24, 2026",
          proof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Milestone Billing 2: Ground Floor Slab & Column Erection",
          amount: 1300000.00,
          status: "Paid",
          or_number: "MCPA-OR-2026-0730",
          due_date: "October 05, 2026",
          paid_date: "October 03, 2026",
          proof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Milestone Billing 3: Second Floor Slab & Structural Framework",
          amount: 1105000.00,
          status: "Pending Verification",
          or_number: "UNPAID",
          due_date: "November 20, 2026",
          paid_date: null,
          proof: null
        }
      ];

      for (const b of billings) {
        await pool.query(
          `INSERT INTO billing_ledger (
            project_code, milestone_title, amount_due, status, or_number, due_date, paid_date, proof_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
          [DEMO_PROJECT_CODE, b.title, b.amount, b.status, b.or_number, b.due_date, b.paid_date, b.proof]
        );
      }
      console.log(`  [+] Seeded ${billings.length} billing ledger invoices.`);

      // 9. Seed Jobsite Delay Events
      const delays = [
        {
          category: "Weather / Typhoon",
          days: 4,
          reason: "Severe tropical monsoon storm (Habagat) bringing sustained heavy rainfall across Bulacan; earthworks and concrete transit paused to prevent hydrostatic blowout."
        },
        {
          category: "LGU Structural Inspection",
          days: 3,
          reason: "Plaridel Municipal Engineering Office structural engineer joint on-site inspection for second-floor formwork and rebar clearance certification."
        }
      ];

      for (const d of delays) {
        await pool.query(
          `INSERT INTO delay_events (project_code, category, days_delayed, reason, logged_at)
           VALUES ($1, $2, $3, $4, NOW());`,
          [DEMO_PROJECT_CODE, d.category, d.days, d.reason]
        );
      }
      console.log(`  [+] Seeded ${delays.length} critical path delay events.`);

      // 10. Seed AI OCR Expenses
      const ocrData = [
        {
          vendor: "Bulacan Ready-Mix Concrete Corporation",
          amount: 168500.00,
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          text: "BULACAN READY-MIX CONCRETE CORP\nPlaridel Batching Plant, Bulacan\nDELIVERY RECEIPT: DR-98412\nITEM: Class A 3500 PSI Portland Type 1 (18 cu.m)\nTOTAL AMOUNT: PHP 168,500.00\nSTATUS: DELIVERED & POURED"
        },
        {
          vendor: "SteelAsia Manufacturing Inc. - Meycauayan",
          amount: 245000.00,
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          text: "STEELASIA MANUFACTURING CORP\nMeycauayan Rolling Mill\nINVOICE: SA-2026-7719\nITEM: Grade 60 Deformed Rebars 16mm & 20mm (120 pcs)\nTOTAL AMOUNT: PHP 245,000.00\nSTATUS: ACCEPTED ON SITE"
        },
        {
          vendor: "Wilcon Depot - Baliuag Branch",
          amount: 62450.00,
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          text: "WILCON DEPOT (BALIUAG)\nDoña Remedios Trinidad Hwy, Baliuag, Bulacan\nRECEIPT: OR-881290\nITEM: Emerald Polyethylene Damp-Proofing Membrane & Tie Wires\nTOTAL AMOUNT: PHP 62,450.00\nPAID VIA CASH"
        }
      ];

      for (const o of ocrData) {
        await pool.query(
          `INSERT INTO expenses_ocr (project_code, vendor_name, receipt_image_url, extracted_total, raw_ocr_text, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW());`,
          [DEMO_PROJECT_CODE, o.vendor, o.image, o.amount, o.text]
        );
      }
      console.log(`  [+] Seeded ${ocrData.length} expense scanner OCR records.`);

      // 11. Seed Meeting History Logs
      const meetings = [
        {
          session_id: `${SEED_TAG}SESS-01`,
          room_code: "MCPA-CONF-8821",
          round_title: "Preliminary Architectural Schematic & Spatial Review",
          meeting_date: "2026-10-18",
          display_date: "October 18, 2026 at 2:00 PM",
          meeting_time: "14:00",
          duration: "45 mins",
          duration_seconds: 2700,
          mode: "Instant Online Video Room",
          venue: "MCPA WebRTC Secure Room",
          lead_consultant: "Engr. Raymart Quirante",
          client_name: "Engr. Raymart Quirante",
          client_email: DEMO_CLIENT_EMAIL,
          project_code: DEMO_PROJECT_CODE,
          project_title: "The Glass Pavilion Residence (Plaridel Executive)",
          status: "Concluded",
          rating: 5,
          minutes: "Client confirmed preferences for high-ceiling clerestory glass in the living room and double-glazed casement windows facing southwest to optimize cross-ventilation.",
          action_items: JSON.stringify([
            { task: "Update Electrical Schematic to accommodate 10kW Solar PV Array", status: "Done" },
            { task: "Prepare revised quotation breakdown with Grade 60 steel certification", status: "Done" }
          ])
        }
      ];

      for (const m of meetings) {
        await pool.query(
          `INSERT INTO meeting_history_logs (
            session_id, room_code, round_title, meeting_date, display_date, meeting_time,
            duration, duration_seconds, mode, venue, lead_consultant, client_name, client_email,
            project_code, project_title, status, rating, minutes, action_items, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, NOW()
          );`,
          [
            m.session_id, m.room_code, m.round_title, m.meeting_date, m.display_date, m.meeting_time,
            m.duration, m.duration_seconds, m.mode, m.venue, m.lead_consultant, m.client_name, m.client_email,
            m.project_code, m.project_title, m.status, m.rating, m.minutes, m.action_items
          ]
        );
      }
      console.log(`  [+] Seeded ${meetings.length} consultation meeting history logs.`);

    } catch (err) {
      console.error(`  [!] Error seeding into ${dbName}:`, err.message);
    }
  }

  console.log("\n[SUCCESS] Seeding complete! Database is now fully populated for all screenshots.");
}

runSeed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[FATAL] Seeding failed:", e);
    process.exit(1);
  });

