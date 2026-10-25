require("dotenv").config();
const { Pool } = require("pg");
const storage = require("../services/storageService");

async function purgeClientQuirante04(dryRun = true) {
  const targetEmail = "martquirante04@gmail.com";
  const alternativeEmail = "marquirante04@gmail.com";
  const targetEmails = [targetEmail, alternativeEmail];

  console.log(`\n===============================================================`);
  console.log(`  MCPA PURGE CLIENT ACCOUNT & MEDIA UTILITY`);
  console.log(`  Target: ${targetEmail} (and alias: ${alternativeEmail})`);
  console.log(`  Mode:   ${dryRun ? "DRY-RUN (Preview Only)" : "EXECUTE (Permanent Deletion)"}`);
  console.log(`===============================================================\n`);

  const supaConn =
    process.env.SUPABASE_CONNECTION_STRING ||
    (process.env.SUPABASE_DB_PASSWORD
      ? `postgres://postgres.dzqqyqothtttccplvvnb:${encodeURIComponent(
          process.env.SUPABASE_DB_PASSWORD
        )}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
      : null);
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;

  const databases = [
    { name: "Primary Database (Supabase)", conn: supaConn },
    { name: "Cloud Hot Standby (Neon)", conn: neonConn },
  ];

  const mediaUrlsToPurge = new Set();

  for (const { name: dbName, conn } of databases) {
    if (!conn) {
      console.log(`[SKIP] No connection string found for ${dbName}`);
      continue;
    }

    console.log(`\n>>> Processing ${dbName}...`);
    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

    try {
      // 1. Fetch user ids
      const userRes = await pool.query(
        "SELECT user_id, email, full_name, role FROM users WHERE LOWER(email) = ANY($1::text[])",
        [targetEmails]
      );
      const userIds = userRes.rows.map((u) => u.user_id);
      console.log(`[${dbName}] Found users:`, userRes.rows);

      // 2. Fetch client projects
      const cpRes = await pool.query(
        "SELECT client_project_id, project_code, brief_id FROM client_projects WHERE (user_id IS NOT NULL AND user_id = ANY($1::int[]))",
        [userIds.length ? userIds : [-1]]
      );
      const cpIds = cpRes.rows.map((r) => r.client_project_id);
      const projCodes = cpRes.rows.map((r) => r.project_code).filter(Boolean);

      // 3. Fetch site projects
      let spIds = [];
      try {
        const spRes = await pool.query(
          "SELECT project_id, project_code FROM site_projects WHERE (client_project_id IS NOT NULL AND client_project_id = ANY($1::int[])) OR LOWER(client_email) = ANY($2::text[])",
          [cpIds.length ? cpIds : [-1], targetEmails]
        );
        spIds = spRes.rows.map((r) => r.project_id);
        spRes.rows.forEach((r) => {
          if (r.project_code && !projCodes.includes(r.project_code)) {
            projCodes.push(r.project_code);
          }
        });
      } catch (e) {}

      // 4. Fetch briefs
      const briefsRes = await pool.query(
        "SELECT brief_id, submission_id, uploaded_files FROM client_briefs WHERE (user_id IS NOT NULL AND user_id = ANY($1::int[])) OR LOWER(client_email) = ANY($2::text[])",
        [userIds.length ? userIds : [-1], targetEmails]
      );
      const briefIds = briefsRes.rows.map((r) => r.brief_id);
      const submissionIds = briefsRes.rows.map((r) => r.submission_id).filter(Boolean);

      // Collect media from briefs
      briefsRes.rows.forEach((b) => {
        let files = b.uploaded_files;
        if (typeof files === "string") {
          try { files = JSON.parse(files); } catch (e) { files = [files]; }
        }
        if (Array.isArray(files)) {
          files.forEach((f) => {
            const url = typeof f === "string" ? f : f?.url;
            if (url) mediaUrlsToPurge.add(url);
          });
        }
      });

      // 5. Collect media from site_photo_logs
      try {
        const photoRes = await pool.query(
          "SELECT image_url FROM site_photo_logs WHERE project_code = ANY($1::text[])",
          [projCodes.length ? projCodes : ["NONE"]]
        );
        photoRes.rows.forEach((r) => {
          if (r.image_url) mediaUrlsToPurge.add(r.image_url);
        });
        console.log(`[${dbName}] Found ${photoRes.rows.length} site photo logs.`);
      } catch (e) {}

      // 6. Collect media from project_documents
      try {
        const docRes = await pool.query(
          "SELECT file_url FROM project_documents WHERE (client_project_id IS NOT NULL AND client_project_id = ANY($1::int[])) OR (uploaded_by IS NOT NULL AND uploaded_by = ANY($2::int[]))",
          [cpIds.length ? cpIds : [-1], userIds.length ? userIds : [-1]]
        );
        docRes.rows.forEach((r) => {
          if (r.file_url) mediaUrlsToPurge.add(r.file_url);
        });
        console.log(`[${dbName}] Found ${docRes.rows.length} project documents.`);
      } catch (e) {}

      // 7. Collect media from blueprints
      try {
        const bpRes = await pool.query(
          "SELECT file_url, thumbnail_url FROM blueprints WHERE client_project_id = ANY($1::int[])",
          [cpIds.length ? cpIds : [-1]]
        );
        bpRes.rows.forEach((r) => {
          if (r.file_url) mediaUrlsToPurge.add(r.file_url);
          if (r.thumbnail_url) mediaUrlsToPurge.add(r.thumbnail_url);
        });
        console.log(`[${dbName}] Found ${bpRes.rows.length} blueprints.`);
      } catch (e) {}

      // 8. Collect media from permit_records
      try {
        const permitRes = await pool.query(
          "SELECT official_receipt_url, permit_document_url FROM permit_records WHERE client_project_id = ANY($1::int[])",
          [cpIds.length ? cpIds : [-1]]
        );
        permitRes.rows.forEach((r) => {
          if (r.official_receipt_url) mediaUrlsToPurge.add(r.official_receipt_url);
          if (r.permit_document_url) mediaUrlsToPurge.add(r.permit_document_url);
        });
        console.log(`[${dbName}] Found ${permitRes.rows.length} permit records.`);
      } catch (e) {}

      // 9. Collect media from meeting_rooms
      try {
        const mrRes = await pool.query(
          "SELECT recording_url FROM meeting_rooms WHERE (client_project_id IS NOT NULL AND client_project_id = ANY($1::int[])) OR (guest_user_id IS NOT NULL AND guest_user_id = ANY($2::int[]))",
          [cpIds.length ? cpIds : [-1], userIds.length ? userIds : [-1]]
        );
        mrRes.rows.forEach((r) => {
          if (r.recording_url) mediaUrlsToPurge.add(r.recording_url);
        });
        console.log(`[${dbName}] Found ${mrRes.rows.length} meeting rooms.`);
      } catch (e) {}

      console.log(`[${dbName}] Summary to delete:`, {
        userIds,
        briefIds,
        cpIds,
        spIds,
        projCodes,
        submissionIds,
      });

      if (!dryRun) {
        // BREAK CIRCULAR FOREIGN KEY CONSTRAINTS FIRST
        if (cpIds.length > 0) {
          await pool.query("UPDATE client_projects SET brief_id = NULL WHERE client_project_id = ANY($1::int[])", [cpIds]);
        }
        if (briefIds.length > 0) {
          await pool.query("UPDATE client_briefs SET client_project_id = NULL, user_id = NULL WHERE brief_id = ANY($1::int[])", [briefIds]);
        }

        // 1. contract_signatures & contracts
        try {
          if (cpIds.length > 0) {
            await pool.query(
              "DELETE FROM contract_signatures WHERE contract_id IN (SELECT contract_id FROM contracts WHERE client_project_id = ANY($1::int[]))",
              [cpIds]
            );
            await pool.query("DELETE FROM contracts WHERE client_project_id = ANY($1::int[])", [cpIds]);
            console.log(`[${dbName}] Deleted contracts & signatures.`);
          }
        } catch (e) {
          console.warn(`[${dbName}] contracts delete error:`, e.message);
        }

        // 2. blueprints
        try {
          if (cpIds.length > 0) {
            await pool.query("DELETE FROM blueprints WHERE client_project_id = ANY($1::int[])", [cpIds]);
            console.log(`[${dbName}] Deleted blueprints.`);
          }
        } catch (e) {}

        // 3. client_quotations
        try {
          if (cpIds.length > 0 || briefIds.length > 0 || projCodes.length > 0) {
            await pool.query(
              "DELETE FROM client_quotations WHERE client_project_id = ANY($1::int[]) OR brief_id = ANY($2::int[]) OR project_code = ANY($3::text[])",
              [cpIds.length ? cpIds : [-1], briefIds.length ? briefIds : [-1], projCodes.length ? projCodes : ["NONE"]]
            );
            console.log(`[${dbName}] Deleted client_quotations.`);
          }
        } catch (e) {}

        // 4. permit_records
        try {
          if (cpIds.length > 0) {
            await pool.query("DELETE FROM permit_records WHERE client_project_id = ANY($1::int[])", [cpIds]);
            console.log(`[${dbName}] Deleted permit_records.`);
          }
        } catch (e) {}

        // 5. project_documents & requests
        try {
          if (cpIds.length > 0) {
            await pool.query("DELETE FROM project_document_requests WHERE client_project_id = ANY($1::int[])", [cpIds]);
            await pool.query("DELETE FROM project_documents WHERE client_project_id = ANY($1::int[])", [cpIds]);
            console.log(`[${dbName}] Deleted project_documents & requests.`);
          }
        } catch (e) {}

        // 6. meeting_history_logs & meeting_rooms
        try {
          const matchCodes = [...projCodes, ...submissionIds];
          await pool.query(
            "DELETE FROM meeting_history_logs WHERE LOWER(client_email) = ANY($1::text[]) OR project_code = ANY($2::text[])",
            [targetEmails, matchCodes.length ? matchCodes : ["NONE"]]
          );
          if (cpIds.length > 0 || userIds.length > 0) {
            await pool.query(
              "DELETE FROM meeting_rooms WHERE client_project_id = ANY($1::int[]) OR guest_user_id = ANY($2::int[])",
              [cpIds.length ? cpIds : [-1], userIds.length ? userIds : [-1]]
            );
          }
          console.log(`[${dbName}] Deleted meeting_rooms and meeting_history_logs.`);
        } catch (e) {}

        // 7. chat_messages
        try {
          if (cpIds.length > 0 || userIds.length > 0) {
            await pool.query(
              "DELETE FROM chat_messages WHERE client_project_id = ANY($1::int[]) OR sender_user_id = ANY($2::int[])",
              [cpIds.length ? cpIds : [-1], userIds.length ? userIds : [-1]]
            );
            console.log(`[${dbName}] Deleted chat_messages.`);
          }
        } catch (e) {}

        // 8. stage_transitions
        try {
          if (cpIds.length > 0) {
            await pool.query("DELETE FROM stage_transitions WHERE client_project_id = ANY($1::int[])", [cpIds]);
            console.log(`[${dbName}] Deleted stage_transitions.`);
          }
        } catch (e) {}

        // 9. site construction tables: site_milestones, site_photo_logs, billing_ledger, delay_events, expenses_ocr, groundbreaking_history
        if (projCodes.length > 0) {
          for (const tbl of [
            "site_photo_logs",
            "site_milestones",
            "billing_ledger",
            "delay_events",
            "expenses_ocr",
            "groundbreaking_history",
          ]) {
            try {
              const res = await pool.query(`DELETE FROM ${tbl} WHERE project_code = ANY($1::text[])`, [projCodes]);
              console.log(`[${dbName}] Purged ${res.rowCount || 0} rows from ${tbl}.`);
            } catch (e) {}
          }
        }

        // 10. site_projects
        try {
          if (cpIds.length > 0 || projCodes.length > 0 || targetEmails.length > 0) {
            const res = await pool.query(
              "DELETE FROM site_projects WHERE client_project_id = ANY($1::int[]) OR project_code = ANY($2::text[]) OR LOWER(client_email) = ANY($3::text[])",
              [cpIds.length ? cpIds : [-1], projCodes.length ? projCodes : ["NONE"], targetEmails]
            );
            console.log(`[${dbName}] Deleted ${res.rowCount || 0} rows from site_projects.`);
          }
        } catch (e) {}

        // 11. client_projects
        try {
          if (cpIds.length > 0 || userIds.length > 0 || projCodes.length > 0) {
            const res = await pool.query(
              "DELETE FROM client_projects WHERE client_project_id = ANY($1::int[]) OR user_id = ANY($2::int[]) OR project_code = ANY($3::text[])",
              [cpIds.length ? cpIds : [-1], userIds.length ? userIds : [-1], projCodes.length ? projCodes : ["NONE"]]
            );
            console.log(`[${dbName}] Deleted ${res.rowCount || 0} rows from client_projects.`);
          }
        } catch (e) {}

        // 12. client_briefs
        try {
          if (briefIds.length > 0 || targetEmails.length > 0 || userIds.length > 0) {
            const res = await pool.query(
              "DELETE FROM client_briefs WHERE brief_id = ANY($1::int[]) OR LOWER(client_email) = ANY($2::text[]) OR user_id = ANY($3::int[])",
              [briefIds.length ? briefIds : [-1], targetEmails, userIds.length ? userIds : [-1]]
            );
            console.log(`[${dbName}] Deleted ${res.rowCount || 0} rows from client_briefs.`);
          }
        } catch (e) {}

        // 13. client_kyc, otp_codes, email_verifications
        try {
          if (userIds.length > 0) {
            await pool.query("DELETE FROM client_kyc WHERE user_id = ANY($1::int[])", [userIds]);
          }
        } catch (e) {}
        try {
          await pool.query("DELETE FROM otp_codes WHERE LOWER(email) = ANY($1::text[])", [targetEmails]);
          await pool.query("DELETE FROM email_verifications WHERE LOWER(email) = ANY($1::text[])", [targetEmails]);
        } catch (e) {}

        // 14. users
        try {
          if (userIds.length > 0 || targetEmails.length > 0) {
            const res = await pool.query(
              "DELETE FROM users WHERE user_id = ANY($1::int[]) OR LOWER(email) = ANY($2::text[])",
              [userIds.length ? userIds : [-1], targetEmails]
            );
            console.log(`[${dbName}] Deleted ${res.rowCount || 0} rows from users.`);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error(`[${dbName}] Processing error:`, err);
    } finally {
      await pool.end();
    }
  }

  // 15. PURGE MEDIA FILES FROM AZURE, SUPABASE, S3, LOCAL
  console.log(`\n===============================================================`);
  console.log(`  MEDIA ASSETS TO PURGE (${mediaUrlsToPurge.size} files found):`);
  console.log(`===============================================================`);
  const mediaList = Array.from(mediaUrlsToPurge);
  mediaList.forEach((url, idx) => console.log(`  [${idx + 1}] ${url}`));

  if (!dryRun) {
    console.log(`\nPurging media files across storage tiers...`);
    for (const url of mediaList) {
      try {
        const cat = url.includes("mcpa-briefs") || url.includes("/briefs/") ? "briefs" : "portfolio";
        const result = await storage.deleteFile(url, cat);
        console.log(`  [PURGED] ${url} -> from: ${result.purgedFrom.join(", ") || "none/not-found"}`);
      } catch (err) {
        console.warn(`  [FAILED] Could not delete ${url}:`, err.message);
      }
    }
  }

  // 16. Clean from local_mock_db.json if present
  try {
    const dbEngine = require("../services/dbFailoverEngine");
    const mockData = dbEngine.readMockData();
    let changed = false;
    if (mockData.users) {
      const orig = mockData.users.length;
      mockData.users = mockData.users.filter((u) => !targetEmails.includes((u.email || "").toLowerCase()));
      if (mockData.users.length !== orig) changed = true;
    }
    if (mockData.client_briefs) {
      const orig = mockData.client_briefs.length;
      mockData.client_briefs = mockData.client_briefs.filter(
        (b) => !targetEmails.includes((b.client_email || b.clientEmail || "").toLowerCase())
      );
      if (mockData.client_briefs.length !== orig) changed = true;
    }
    if (changed && !dryRun) {
      dbEngine.writeMockData(mockData);
      console.log("[MOCK STORAGE] Cleaned references in local_mock_db.json.");
    }
  } catch (e) {}

  console.log(`\n===============================================================`);
  console.log(`  PURGE FINISHED (${dryRun ? "DRY-RUN ONLY - NO CHANGES MADE" : "EXECUTE COMPLETE"})`);
  console.log(`===============================================================\n`);
}

const isExecute = process.argv.includes("--execute");
purgeClientQuirante04(!isExecute)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Purge script failure:", e);
    process.exit(1);
  });
