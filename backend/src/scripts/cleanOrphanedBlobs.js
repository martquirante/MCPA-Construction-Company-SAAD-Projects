const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { BlobServiceClient } = require("@azure/storage-blob");
const db = require("../services/dbFailoverEngine");

/**
 * MCPA Construction - Cloud Storage Orphan Purge Utility
 * Scans Azure Blob Storage (and cloud containers) to purge files
 * that are no longer associated with any project or brief in the database.
 * 
 * Usage:
 *   node backend/src/scripts/cleanOrphanedBlobs.js --dry-run
 *   node backend/src/scripts/cleanOrphanedBlobs.js --execute
 */
async function cleanOrphanedBlobs() {
  const isExecute = process.argv.includes("--execute");
  console.log(`\n======================================================`);
  console.log(`  MCPA CLOUD STORAGE ORPHAN CLEANUP UTILITY`);
  console.log(`  Mode: ${isExecute ? "EXECUTE (Permanent Deletion)" : "DRY RUN (Preview Only)"}`);
  console.log(`======================================================\n`);

  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr || connStr.includes("YOUR_")) {
    console.error("[ERROR] Valid AZURE_STORAGE_CONNECTION_STRING is missing in .env.");
    process.exit(1);
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const portfolioContainer = process.env.AZURE_CONTAINER_PORTFOLIO || "mcpa-portfolio";
  const briefsContainer = process.env.AZURE_CONTAINER_BRIEFS || "mcpa-briefs";

  // 1. Gather all active project images from Database
  console.log("[1/4] Querying active projects in PostgreSQL...");
  const projRes = await db.query("SELECT project_id, name, images FROM projects");
  const activeImageNames = new Set();
  
  projRes.rows.forEach((p) => {
    let imgs = p.images;
    if (typeof imgs === "string") {
      try { imgs = JSON.parse(imgs); } catch (e) { imgs = [imgs]; }
    }
    if (Array.isArray(imgs)) {
      imgs.forEach((u) => {
        if (typeof u === "string" && u.trim().length > 0) {
          const parts = u.split("/");
          const fileName = parts[parts.length - 1].split("?")[0];
          if (fileName) activeImageNames.add(decodeURIComponent(fileName));
        }
      });
    }
  });

  console.log(`   Found ${activeImageNames.size} active photos currently displayed on projects.`);

  // 2. Gather all active brief files from Database
  console.log("[2/4] Querying active client briefs in PostgreSQL...");
  const briefRes = await db.query("SELECT brief_id, uploaded_files FROM client_briefs");
  const activeBriefNames = new Set();

  briefRes.rows.forEach((b) => {
    let files = b.uploaded_files;
    if (typeof files === "string") {
      try { files = JSON.parse(files); } catch (e) { files = [files]; }
    }
    if (Array.isArray(files)) {
      files.forEach((u) => {
        if (typeof u === "string" && u.trim().length > 0) {
          const parts = u.split("/");
          const fileName = parts[parts.length - 1].split("?")[0];
          if (fileName) activeBriefNames.add(decodeURIComponent(fileName));
        }
      });
    }
  });

  console.log(`   Found ${activeBriefNames.size} active attachments in client briefs.`);

  // 3. Scan and Clean Container Function
  async function processContainer(containerName, activeSet) {
    console.log(`\n[3/4] Scanning Azure Container: "${containerName}"...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const exists = await containerClient.exists();
    if (!exists) {
      console.log(`   Container "${containerName}" does not exist. Skipping.`);
      return { total: 0, active: 0, orphaned: 0, deleted: 0, bytesReclaimed: 0 };
    }

    const allBlobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      allBlobs.push(blob);
    }

    const activeBlobs = [];
    const orphanedBlobs = [];
    let orphanedBytes = 0;

    allBlobs.forEach((blob) => {
      const decodedName = decodeURIComponent(blob.name);
      if (activeSet.has(decodedName) || activeSet.has(blob.name)) {
        activeBlobs.push(blob);
      } else {
        orphanedBlobs.push(blob);
        orphanedBytes += (blob.properties.contentLength || 0);
      }
    });

    console.log(`   - Total blobs in container: ${allBlobs.length}`);
    console.log(`   - Active blobs (preserved): ${activeBlobs.length}`);
    console.log(`   - Orphaned blobs (unreferenced): ${orphanedBlobs.length} (~${(orphanedBytes / (1024 * 1024)).toFixed(2)} MB)`);

    let deletedCount = 0;
    if (isExecute && orphanedBlobs.length > 0) {
      console.log(`\n   Purging ${orphanedBlobs.length} orphaned blobs from Azure "${containerName}"...`);
      for (const blob of orphanedBlobs) {
        try {
          const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
          const res = await blockBlobClient.deleteIfExists();
          if (res.succeeded) {
            deletedCount++;
          }
        } catch (delErr) {
          console.warn(`   [WARNING] Failed to delete blob "${blob.name}":`, delErr.message);
        }
      }
      console.log(`   [SUCCESS] Purged ${deletedCount} of ${orphanedBlobs.length} blobs.`);
    }

    return {
      total: allBlobs.length,
      active: activeBlobs.length,
      orphaned: orphanedBlobs.length,
      deleted: deletedCount,
      bytesReclaimed: orphanedBytes,
    };
  }

  const portfolioStats = await processContainer(portfolioContainer, activeImageNames);
  const briefsStats = await processContainer(briefsContainer, activeBriefNames);

  console.log(`\n======================================================`);
  console.log(`  CLEANUP SUMMARY REPORT`);
  console.log(`======================================================`);
  console.log(`  Total Blobs Scanned:    ${portfolioStats.total + briefsStats.total}`);
  console.log(`  Active Preserved:       ${portfolioStats.active + briefsStats.active}`);
  console.log(`  Orphaned Identified:    ${portfolioStats.orphaned + briefsStats.orphaned}`);
  if (isExecute) {
    console.log(`  Orphaned Blobs Purged:  ${portfolioStats.deleted + briefsStats.deleted}`);
    console.log(`  Storage Reclaimed:      ${((portfolioStats.bytesReclaimed + briefsStats.bytesReclaimed) / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Status:                 ALL UNREFERENCED BLOBS PERMANENTLY REMOVED`);
  } else {
    console.log(`  Storage Recoverable:    ${((portfolioStats.bytesReclaimed + briefsStats.bytesReclaimed) / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Status:                 Dry run finished. Run with --execute to perform deletion.`);
  }
  console.log(`======================================================\n`);

  return {
    total: portfolioStats.total + briefsStats.total,
    active: portfolioStats.active + briefsStats.active,
    orphaned: portfolioStats.orphaned + briefsStats.orphaned,
    purged: portfolioStats.deleted + briefsStats.deleted,
    reclaimedMB: ((portfolioStats.bytesReclaimed + briefsStats.bytesReclaimed) / (1024 * 1024)).toFixed(2),
  };
}

if (require.main === module) {
  cleanOrphanedBlobs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[FATAL ERROR] Cleanup script failed:", err);
      process.exit(1);
    });
}

module.exports = { cleanOrphanedBlobs };
