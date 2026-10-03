const { BlobServiceClient } = require("@azure/storage-blob");
const { createClient } = require("@supabase/supabase-js");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class StorageService {
  constructor() {
    this.azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
    this.azurePortfolioContainer = process.env.AZURE_CONTAINER_PORTFOLIO || "mcpa-portfolio";
    this.azureBriefsContainer = process.env.AZURE_CONTAINER_BRIEFS || "mcpa-briefs";

    // Supabase Storage
    this.supabaseUrl = process.env.SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
    this.supabasePortfolioBucket = process.env.SUPABASE_BUCKET_PORTFOLIO || "portfolio";
    this.supabaseBriefsBucket = process.env.SUPABASE_BUCKET_BRIEFS || "briefs";

    this.supabaseClient = null;
    if (this.supabaseUrl && this.supabaseKey && !this.supabaseUrl.includes("YOUR_")) {
      try {
        this.supabaseClient = createClient(this.supabaseUrl, this.supabaseKey);
      } catch (e) {
        console.warn("[StorageService] Supabase client init error:", e.message);
      }
    }

    // Neon S3-Compatible Object Storage
    this.s3Endpoint = process.env.AWS_ENDPOINT_URL_S3 || "";
    this.s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
    this.s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
    this.s3Region = process.env.AWS_REGION || "ap-southeast-1";

    this.s3Client = null;
    if (this.s3Endpoint && this.s3AccessKeyId && this.s3SecretAccessKey) {
      try {
        this.s3Client = new S3Client({
          endpoint: this.s3Endpoint,
          region: this.s3Region,
          credentials: {
            accessKeyId: this.s3AccessKeyId,
            secretAccessKey: this.s3SecretAccessKey,
          },
          forcePathStyle: true,
        });
      } catch (e) {
        console.warn("[StorageService] S3 client init error:", e.message);
      }
    }
  }

  /**
   * Uploads a file with concurrent Multi-Cloud Active Mirroring:
   * Tier 1 (Azure Blob) + Tier 2 (Supabase Storage) + Tier 3 (Neon S3)
   * Guaranteed 1:1 filename across all 3 providers for zero duplication.
   * @param {Buffer} buffer File buffer
   * @param {string} originalName Original filename
   * @param {string} mimeType File MIME type
   * @param {'portfolio'|'briefs'} category Target category
   * @returns {Promise<string>} Public URL of the uploaded file
   */
  async uploadFile(buffer, originalName, mimeType = "image/jpeg", category = "portfolio") {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const uniqueFileName = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;

    let azureUrl = "";
    let supabaseUrl = "";
    let s3Url = "";

    const uploadTasks = [];

    // ═════════════════════════════════════════════════════════════════
    // TIER 1: AZURE BLOB STORAGE (PRIMARY)
    // ═════════════════════════════════════════════════════════════════
    if (this.azureConnStr && !this.azureConnStr.includes("YOUR_") && !this.azureConnStr.includes("UseDevelopmentStorage=true")) {
      uploadTasks.push(
        (async () => {
          const containerName = category === "briefs" ? this.azureBriefsContainer : this.azurePortfolioContainer;
          const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureConnStr);
          const containerClient = blobServiceClient.getContainerClient(containerName);
          await containerClient.createIfNotExists();
          const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
          await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType },
          });
          azureUrl = blockBlobClient.url;
          return { provider: "Azure Blob Storage", url: azureUrl };
        })()
      );
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 2: SUPABASE STORAGE (HOT STANDBY MIRROR)
    // ═════════════════════════════════════════════════════════════════
    if (this.supabaseClient) {
      uploadTasks.push(
        (async () => {
          const bucketName = category === "briefs" ? this.supabaseBriefsBucket : this.supabasePortfolioBucket;
          const { error } = await this.supabaseClient.storage
            .from(bucketName)
            .upload(uniqueFileName, buffer, {
              contentType: mimeType,
              upsert: true,
            });
          if (error) throw error;
          const { data: publicUrlData } = this.supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(uniqueFileName);
          supabaseUrl = publicUrlData.publicUrl;
          return { provider: "Supabase Storage", url: supabaseUrl };
        })()
      );
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 3: NEON S3 OBJECT STORAGE (STANDBY MIRROR)
    // ═════════════════════════════════════════════════════════════════
    if (this.s3Client) {
      uploadTasks.push(
        (async () => {
          const bucketName = category === "briefs" ? "mcpa-briefs" : "mcpa-portfolio";
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: uniqueFileName,
              Body: buffer,
              ContentType: mimeType,
            })
          );
          s3Url = `${this.s3Endpoint}/${bucketName}/${uniqueFileName}`;
          return { provider: "Neon S3 Storage", url: s3Url };
        })()
      );
    }

    const uploadResults = await Promise.allSettled(uploadTasks);
    const successfulClouds = uploadResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.provider);

    console.log(
      `\x1b[32m[StorageService] Multi-Cloud Mirrored for ${uniqueFileName}: [${successfulClouds.join(", ")}]\x1b[0m`
    );

    // Primary URL selection with failover priority: Azure -> Supabase -> Neon S3
    if (azureUrl) return azureUrl;
    if (supabaseUrl) return supabaseUrl;
    if (s3Url) return s3Url;

    // ═════════════════════════════════════════════════════════════════
    // TIER 4: LOCAL RESILIENT STORAGE (DEVELOPMENT FALLBACK)
    // ═════════════════════════════════════════════════════════════════
    const isVercel = Boolean(process.env.VERCEL);
    const uploadsDir = isVercel
      ? path.join("/tmp", "uploads", category)
      : path.join(__dirname, "../../public/uploads", category);

    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (e) {}
    }

    const localFilePath = path.join(uploadsDir, uniqueFileName);
    try {
      fs.writeFileSync(localFilePath, buffer);
    } catch (e) {
      console.warn("[StorageService] Local storage write warning:", e.message);
    }

    if (isVercel && buffer.length < 4 * 1024 * 1024) {
      const mime = uniqueFileName.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }

    const port = process.env.PORT || 5000;
    const localUrl = `http://localhost:${port}/uploads/${category}/${uniqueFileName}`;
    console.log(`\x1b[36m[StorageService] Stored locally (Dev Fallback): ${localUrl}\x1b[0m`);
    return localUrl;
  }

  /**
   * Deletes a file across ALL cloud storage tiers simultaneously (Azure Blob, Supabase, Neon S3, Local).
   * Extracts the unique filename and purges it from all backups to ensure zero orphaned duplicates.
   * Safely ignores external URLs (Unsplash, etc.) and inline data URIs.
   * @param {string} fileUrl Public URL of the file to delete
   * @param {'portfolio'|'briefs'} category Target category
   * @returns {Promise<{ success: boolean, purgedFrom: string[] }>}
   */
  async deleteFile(fileUrl, category = "portfolio") {
    if (!fileUrl || typeof fileUrl !== "string") {
      return { success: false, purgedFrom: [] };
    }

    const trimmedUrl = fileUrl.trim();

    // 1. Safety check: Ignore inline base64 data URLs
    if (trimmedUrl.startsWith("data:")) {
      return { success: true, purgedFrom: ["data-uri-skipped"] };
    }

    // 2. Safety check: Ignore external third-party CDN / stock image URLs
    const isExternalUnsplash = trimmedUrl.includes("unsplash.com");
    const isExternalCloudinary = trimmedUrl.includes("cloudinary.com");
    const isExternalWiki = trimmedUrl.includes("wikimedia.org") || trimmedUrl.includes("wikipedia.org");
    if (isExternalUnsplash || isExternalCloudinary || isExternalWiki) {
      return { success: true, purgedFrom: ["external-skipped"] };
    }

    // Extract deterministic unique filename
    let fileName = "";
    try {
      const urlObj = new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `http://localhost${trimmedUrl}`);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      fileName = decodeURIComponent(parts[parts.length - 1].split("?")[0]);
    } catch (e) {
      const parts = trimmedUrl.split("/");
      fileName = decodeURIComponent(parts[parts.length - 1].split("?")[0]);
    }

    if (!fileName) {
      return { success: false, purgedFrom: [] };
    }

    const deleteTasks = [];
    const purgedFrom = [];

    // ═════════════════════════════════════════════════════════════════
    // 1. AZURE BLOB STORAGE DELETION
    // ═════════════════════════════════════════════════════════════════
    if (this.azureConnStr && !this.azureConnStr.includes("YOUR_")) {
      deleteTasks.push(
        (async () => {
          const containerName = category === "briefs" ? this.azureBriefsContainer : this.azurePortfolioContainer;
          const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureConnStr);
          const containerClient = blobServiceClient.getContainerClient(containerName);
          const blockBlobClient = containerClient.getBlockBlobClient(fileName);
          const res = await blockBlobClient.deleteIfExists();
          if (res.succeeded) {
            purgedFrom.push("Azure Blob");
            console.log(`\x1b[32m[StorageService] Azure Blob Purged: ${fileName}\x1b[0m`);
          }
        })()
      );
    }

    // ═════════════════════════════════════════════════════════════════
    // 2. SUPABASE STORAGE DELETION
    // ═════════════════════════════════════════════════════════════════
    if (this.supabaseClient) {
      deleteTasks.push(
        (async () => {
          const bucketName = category === "briefs" ? this.supabaseBriefsBucket : this.supabasePortfolioBucket;
          const { error } = await this.supabaseClient.storage.from(bucketName).remove([fileName]);
          if (!error) {
            purgedFrom.push("Supabase Storage");
            console.log(`\x1b[32m[StorageService] Supabase Purged: ${fileName}\x1b[0m`);
          }
        })()
      );
    }

    // ═════════════════════════════════════════════════════════════════
    // 3. NEON S3 STORAGE DELETION
    // ═════════════════════════════════════════════════════════════════
    if (this.s3Client) {
      deleteTasks.push(
        (async () => {
          const bucketName = category === "briefs" ? "mcpa-briefs" : "mcpa-portfolio";
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName }));
          purgedFrom.push("Neon S3");
          console.log(`\x1b[32m[StorageService] Neon S3 Purged: ${fileName}\x1b[0m`);
        })()
      );
    }

    // ═════════════════════════════════════════════════════════════════
    // 4. LOCAL STORAGE DELETION
    // ═════════════════════════════════════════════════════════════════
    const localPath = path.join(__dirname, "../../public/uploads", category, fileName);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
        purgedFrom.push("Local Disk");
        console.log(`\x1b[32m[StorageService] Local File Purged: ${localPath}\x1b[0m`);
      } catch (e) {}
    }

    await Promise.allSettled(deleteTasks);
    return { success: true, purgedFrom };
  }

  /**
   * Deletes multiple files safely across all clouds simultaneously
   * @param {string[]} fileUrls Array of URLs to delete
   * @param {'portfolio'|'briefs'} category Target category
   */
  async deleteFiles(fileUrls, category = "portfolio") {
    if (!Array.isArray(fileUrls) || fileUrls.length === 0) return [];
    const validUrls = fileUrls.filter((u) => typeof u === "string" && u.trim().length > 0);
    const deletePromises = validUrls.map((url) => this.deleteFile(url, category));
    return await Promise.allSettled(deletePromises);
  }
  /**
   * Bi-Directional Self-Healing Reconciliation Sync:
   * Detects any disparity across Azure Blob, Supabase Storage, and Neon S3.
   * If Azure was down during an upload, files in Supabase or Neon S3 are automatically
   * detected, fetched, and uploaded into Azure Blob when Azure is healthy again.
   * Ensures 100% parity across all cloud storages without any duplicate files.
   * @returns {Promise<{ scanned: number, restoredToAzure: number, restoredToSupabase: number, restoredToNeon: number, details: Array }>}
   */
  async reconcileCloudMirrors() {
    const db = require("./dbFailoverEngine");
    const results = {
      scanned: 0,
      restoredToAzure: 0,
      restoredToSupabase: 0,
      restoredToNeon: 0,
      details: [],
    };

    try {
      // 1. Fetch all active photos in PostgreSQL (projects and briefs)
      const projectsRes = await db.query("SELECT project_id, name, images FROM projects");
      const briefsRes = await db.query("SELECT brief_id, uploaded_files FROM client_briefs");

      const activeFileMap = new Map(); // fileName -> { category, primaryUrl, sourceProject }

      projectsRes.rows.forEach((p) => {
        let imgs = p.images;
        if (typeof imgs === "string") {
          try { imgs = JSON.parse(imgs); } catch (e) { imgs = [imgs]; }
        }
        if (Array.isArray(imgs)) {
          imgs.forEach((u) => {
            if (typeof u === "string" && u.trim().length > 0) {
              const parts = u.split("/");
              const fileName = decodeURIComponent(parts[parts.length - 1].split("?")[0]);
              if (fileName && !activeFileMap.has(fileName)) {
                activeFileMap.set(fileName, { category: "portfolio", url: u, refId: p.project_id, table: "projects" });
              }
            }
          });
        }
      });

      briefsRes.rows.forEach((b) => {
        let atts = b.uploaded_files;
        if (typeof atts === "string") {
          try { atts = JSON.parse(atts); } catch (e) { atts = [atts]; }
        }
        if (Array.isArray(atts)) {
          atts.forEach((u) => {
            if (typeof u === "string" && u.trim().length > 0) {
              const parts = u.split("/");
              const fileName = decodeURIComponent(parts[parts.length - 1].split("?")[0]);
              if (fileName && !activeFileMap.has(fileName)) {
                activeFileMap.set(fileName, { category: "briefs", url: u, refId: b.brief_id, table: "client_briefs" });
              }
            }
          });
        }
      });

      results.scanned = activeFileMap.size;

      for (const [fileName, meta] of activeFileMap.entries()) {
        const { category } = meta;
        const azureContainer = category === "briefs" ? this.azureBriefsContainer : this.azurePortfolioContainer;
        const supaBucket = category === "briefs" ? this.supabaseBriefsBucket : this.supabasePortfolioBucket;
        const s3Bucket = category === "briefs" ? "mcpa-briefs" : "mcpa-portfolio";

        let inAzure = false;
        let inSupabase = false;
        let inNeon = false;

        // Check Azure
        if (this.azureConnStr) {
          try {
            const blobClient = BlobServiceClient.fromConnectionString(this.azureConnStr)
              .getContainerClient(azureContainer)
              .getBlockBlobClient(fileName);
            inAzure = await blobClient.exists();
          } catch (e) {}
        }

        // Check Supabase
        if (this.supabaseClient) {
          try {
            const { data } = await this.supabaseClient.storage.from(supaBucket).list("", { search: fileName });
            inSupabase = Boolean(data && data.some((f) => f.name === fileName));
          } catch (e) {}
        }

        // Check Neon S3
        if (this.s3Client) {
          try {
            await this.s3Client.send(new HeadObjectCommand({ Bucket: s3Bucket, Key: fileName }));
            inNeon = true;
          } catch (e) {}
        }

        let fileBuffer = null;
        let mimeType = fileName.endsWith(".png") ? "image/png" : (fileName.endsWith(".webp") ? "image/webp" : "image/jpeg");

        // Helper to retrieve buffer from whichever cloud has it
        const getBuffer = async () => {
          if (fileBuffer) return fileBuffer;
          if (inAzure) {
            try {
              const blobClient = BlobServiceClient.fromConnectionString(this.azureConnStr)
                .getContainerClient(azureContainer)
                .getBlockBlobClient(fileName);
              fileBuffer = await blobClient.downloadToBuffer();
              return fileBuffer;
            } catch (e) {}
          }
          if (inSupabase) {
            try {
              const { data } = await this.supabaseClient.storage.from(supaBucket).download(fileName);
              fileBuffer = Buffer.from(await data.arrayBuffer());
              return fileBuffer;
            } catch (e) {}
          }
          if (inNeon) {
            try {
              const res = await this.s3Client.send(new GetObjectCommand({ Bucket: s3Bucket, Key: fileName }));
              fileBuffer = Buffer.from(await res.Body.transformToByteArray());
              return fileBuffer;
            } catch (e) {}
          }
          return null;
        };

        // Self-heal: If Azure was down earlier and missed this file, restore to Azure now!
        if (!inAzure && (inSupabase || inNeon)) {
          const buf = await getBuffer();
          if (buf) {
            const blobClient = BlobServiceClient.fromConnectionString(this.azureConnStr)
              .getContainerClient(azureContainer)
              .getBlockBlobClient(fileName);
            await blobClient.uploadData(buf, { blobHTTPHeaders: { blobContentType: mimeType } });
            results.restoredToAzure++;
            results.details.push(`Restored ${fileName} to Azure from backup mirror.`);
            console.log(`\x1b[32m[StorageService] Self-Healing Restored to Azure: ${fileName}\x1b[0m`);
          }
        }

        // Self-heal: If Supabase missed this file, mirror from Azure/Neon
        if (!inSupabase && (inAzure || inNeon)) {
          const buf = await getBuffer();
          if (buf) {
            await this.supabaseClient.storage.from(supaBucket).upload(fileName, buf, { contentType: mimeType, upsert: true });
            results.restoredToSupabase++;
            results.details.push(`Restored ${fileName} to Supabase.`);
            console.log(`\x1b[32m[StorageService] Self-Healing Restored to Supabase: ${fileName}\x1b[0m`);
          }
        }

        // Self-heal: If Neon S3 missed this file, mirror from Azure/Supabase
        if (!inNeon && (inAzure || inSupabase)) {
          const buf = await getBuffer();
          if (buf) {
            await this.s3Client.send(new PutObjectCommand({ Bucket: s3Bucket, Key: fileName, Body: buf, ContentType: mimeType }));
            results.restoredToNeon++;
            results.details.push(`Restored ${fileName} to Neon S3.`);
            console.log(`\x1b[32m[StorageService] Self-Healing Restored to Neon S3: ${fileName}\x1b[0m`);
          }
        }
      }

      console.log(`\x1b[36m[StorageService] Reconciliation Complete: ${results.scanned} files inspected. Restored [Azure: ${results.restoredToAzure}, Supabase: ${results.restoredToSupabase}, Neon: ${results.restoredToNeon}]\x1b[0m`);
      return results;
    } catch (err) {
      console.error("[StorageService] Reconciliation error:", err);
      return { ...results, error: err.message };
    }
  }
}

module.exports = new StorageService();
