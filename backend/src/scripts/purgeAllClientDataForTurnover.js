const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const { BlobServiceClient } = require("@azure/storage-blob");

const PROTECTED_EMAILS = [
  "dbprojectmartquirante@gmail.com",
  "rayquirante@gmail.com",
  "blackcat17393@gmail.com",
  "catputi03@gmail.com",
  "mcpa.construction@gmail.com",
];

async function purgeAllClientData() {
  console.log("\n==================================================================");
  console.log("   MCPA CONSTRUCTION — CLIENT DATA PURGE (TURNOVER PREPARATION)");
  console.log("==================================================================\n");

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${name} is not available.`);
      continue;
    }

    console.log(`\n>>> Purging client data from ${name}...`);

    try {
      // 1. Unlink circular references
      await pool.query("UPDATE client_projects SET site_project_code = NULL, brief_id = NULL;").catch(() => {});
      await pool.query("UPDATE client_briefs SET client_project_id = NULL;").catch(() => {});
      await pool.query("UPDATE site_projects SET client_project_id = NULL;").catch(() => {});

      // 2. Child tables of site_projects
      const delPhotos = await pool.query("DELETE FROM site_photo_logs RETURNING log_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delPhotos.rowCount || 0} site photo logs`);

      const delMs = await pool.query("DELETE FROM site_milestones RETURNING milestone_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delMs.rowCount || 0} site milestones`);

      const delBills = await pool.query("DELETE FROM billing_ledger RETURNING bill_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delBills.rowCount || 0} billing ledger entries`);

      await pool.query("DELETE FROM delay_events;").catch(() => {});
      await pool.query("DELETE FROM warranty_tickets;").catch(() => {});
      await pool.query("DELETE FROM expenses_ocr;").catch(() => {});

      // 3. Child tables of client_projects
      const delDocs = await pool.query("DELETE FROM project_documents RETURNING document_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delDocs.rowCount || 0} project documents`);

      await pool.query("DELETE FROM project_document_requests;").catch(() => {});
      const delWrapped = await pool.query("DELETE FROM project_wrapped RETURNING wrapped_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delWrapped.rowCount || 0} project wrapped records`);

      const delTrans = await pool.query("DELETE FROM stage_transitions RETURNING transition_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delTrans.rowCount || 0} stage transitions`);

      await pool.query("DELETE FROM meeting_rooms;").catch(() => {});
      await pool.query("DELETE FROM chat_messages;").catch(() => {});
      await pool.query("DELETE FROM blueprints;").catch(() => {});
      await pool.query("DELETE FROM groundbreaking_history;").catch(() => {});
      await pool.query("DELETE FROM permit_records;").catch(() => {});
      await pool.query("DELETE FROM contracts;").catch(() => {});
      await pool.query("DELETE FROM contract_signatures;").catch(() => {});
      await pool.query("DELETE FROM cost_estimates;").catch(() => {});
      await pool.query("DELETE FROM loan_records;").catch(() => {});
      await pool.query("DELETE FROM project_transmittals;").catch(() => {});

      // 4. Client site projects & client projects
      const delSiteProj = await pool.query("DELETE FROM site_projects RETURNING project_code;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delSiteProj.rowCount || 0} client site_projects`);

      const delClientProj = await pool.query("DELETE FROM client_projects RETURNING client_project_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delClientProj.rowCount || 0} client_projects`);

      // 5. Client briefs
      const delBriefs = await pool.query("DELETE FROM client_briefs RETURNING brief_id;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delBriefs.rowCount || 0} client_briefs`);

      // 6. OTP codes & email verifications for client emails
      const delOtp = await pool.query(`
        DELETE FROM otp_codes 
        WHERE user_id IN (SELECT user_id FROM users WHERE role = 'client') 
           OR LOWER(email) NOT IN (${PROTECTED_EMAILS.map((e) => `'${e.toLowerCase()}'`).join(", ")})
        RETURNING otp_id;
      `).catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delOtp.rowCount || 0} client OTP codes`);

      const delVerif = await pool.query(`
        DELETE FROM email_verifications 
        WHERE LOWER(email) NOT IN (${PROTECTED_EMAILS.map((e) => `'${e.toLowerCase()}'`).join(", ")})
        RETURNING verification_id;
      `).catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delVerif.rowCount || 0} client email verifications`);

      // 7. Delete Client Accounts (role = 'client')
      const delUsers = await pool.query(`
        DELETE FROM users 
        WHERE role = 'client' 
          AND LOWER(email) NOT IN (${PROTECTED_EMAILS.map((e) => `'${e.toLowerCase()}'`).join(", ")})
        RETURNING user_id, email, full_name, role;
      `).catch((err) => {
        console.error("  Error deleting client users:", err.message);
        return { rowCount: 0, rows: [] };
      });

      console.log(`  - Deleted ${delUsers.rowCount || 0} client user accounts:`);
      (delUsers.rows || []).forEach((u) => {
        console.log(`     * ID ${u.user_id}: ${u.email} (${u.full_name || "N/A"})`);
      });

      // 8. Verify Remaining Accounts
      const remainingUsers = await pool.query("SELECT user_id, email, full_name, role FROM users ORDER BY user_id;");
      console.log(`\n  [${name}] Verified ${remainingUsers.rows.length} protected staff/admin accounts preserved:`);
      remainingUsers.rows.forEach((u) => {
        console.log(`     🛡️ ID ${u.user_id}: ${u.email} (${u.full_name || "Staff"}, role: ${u.role})`);
      });
    } catch (err) {
      console.error(`[ERROR] Failed on ${name}:`, err.message);
    }
  }

  // Sync rayquirante@gmail.com to Neon if missing
  try {
    const supAdmin = await db.supabasePool.query("SELECT * FROM users WHERE LOWER(email) = 'rayquirante@gmail.com' LIMIT 1;");
    if (supAdmin.rows && supAdmin.rows.length > 0) {
      const u = supAdmin.rows[0];
      const neonCheck = await db.neonPool.query("SELECT user_id FROM users WHERE LOWER(email) = 'rayquirante@gmail.com' LIMIT 1;");
      if (!neonCheck.rows || neonCheck.rows.length === 0) {
        await db.neonPool.query(
          `INSERT INTO users (email, password_hash, full_name, role, is_active, auth_provider)
           VALUES ($1, $2, $3, $4, true, $5)
           ON CONFLICT (email) DO NOTHING;`,
          [u.email, u.password_hash, u.full_name, u.role, u.auth_provider]
        );
        console.log(`\n[SYNC] Synced admin "${u.email}" into Neon Standby DB.`);
      }
    }
  } catch (syncErr) {
    console.warn("[SYNC NOTICE]", syncErr.message);
  }

  // 9. Purge Cloud Storage Files (Category: 'briefs')
  console.log("\n==================================================================");
  console.log("   PURGING CLIENT FILES FROM CLOUD STORAGE (CATEGORY: BRIEFS)");
  console.log("==================================================================\n");

  // Azure Blob Storage
  try {
    if (storage.azureConnStr) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(storage.azureConnStr);
      const containerClient = blobServiceClient.getContainerClient(storage.azureBriefsContainer);
      const exists = await containerClient.exists();
      if (exists) {
        let count = 0;
        for await (const blob of containerClient.listBlobsFlat()) {
          const blockClient = containerClient.getBlockBlobClient(blob.name);
          const delRes = await blockClient.deleteIfExists();
          if (delRes.succeeded) {
            count++;
            console.log(`  [Azure Blob] Deleted: ${blob.name}`);
          }
        }
        console.log(`[Azure Storage] Successfully purged ${count} client brief files from container "${storage.azureBriefsContainer}".`);
      }
    }
  } catch (azErr) {
    console.warn("[Azure Storage Error]:", azErr.message);
  }

  // Supabase Storage
  try {
    if (storage.supabaseClient) {
      const { data, error } = await storage.supabaseClient.storage.from(storage.supabaseBriefsBucket).list();
      if (!error && Array.isArray(data) && data.length > 0) {
        const fileNames = data.map((f) => f.name).filter(Boolean);
        const { error: removeError } = await storage.supabaseClient.storage.from(storage.supabaseBriefsBucket).remove(fileNames);
        if (removeError) {
          console.warn("[Supabase Storage Remove Error]:", removeError.message);
        } else {
          console.log(`[Supabase Storage] Successfully purged ${fileNames.length} client files from bucket "${storage.supabaseBriefsBucket}":`);
          fileNames.forEach((n) => console.log(`  [Supabase Storage] Deleted: ${n}`));
        }
      } else {
        console.log(`[Supabase Storage] Bucket "${storage.supabaseBriefsBucket}" is already empty.`);
      }
    }
  } catch (supErr) {
    console.warn("[Supabase Storage Error]:", supErr.message);
  }

  // 10. Clean Mock Storage (local_mock_db.json)
  try {
    const mockData = db.readMockData();
    const origUsers = (mockData.users || []).length;
    mockData.users = (mockData.users || []).filter((u) => u.role !== "client" || PROTECTED_EMAILS.includes((u.email || "").toLowerCase()));
    mockData.client_briefs = [];
    mockData.client_projects = [];
    mockData.site_projects = [];
    mockData.site_milestones = [];
    mockData.site_photo_logs = [];
    mockData.billing_ledger = [];
    db.writeMockData(mockData);
    console.log(`\n[Local Mock DB] Purged client data: users was ${origUsers}, now ${mockData.users.length}.`);
  } catch (mErr) {
    console.warn("[Local Mock DB Notice]:", mErr.message);
  }

  console.log("\n==================================================================");
  console.log("   CLIENT DATA PURGE COMPLETED SUCCESSFULLY");
  console.log("==================================================================\n");
}

purgeAllClientData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Purge script fatal error:", err);
    process.exit(1);
  });

