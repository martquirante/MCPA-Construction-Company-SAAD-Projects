const { BlobServiceClient } = require("@azure/storage-blob");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class StorageService {
  constructor() {
    this.azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
    this.azurePortfolioContainer = process.env.AZURE_CONTAINER_PORTFOLIO || "mcpa-portfolio";
    this.azureBriefsContainer = process.env.AZURE_CONTAINER_BRIEFS || "mcpa-briefs";

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
  }

  /**
   * Uploads a file with Tier 1 (Azure Blob) -> Tier 2 (Supabase Storage) -> Dev Fallback
   * @param {Buffer} buffer File buffer
   * @param {string} originalName Original filename
   * @param {string} mimeType File MIME type
   * @param {'portfolio'|'briefs'} category Target category
   * @returns {Promise<string>} Public URL of the uploaded file
   */
  async uploadFile(buffer, originalName, mimeType = "image/jpeg", category = "portfolio") {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const uniqueFileName = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;

    // ═════════════════════════════════════════════════════════════════
    // TIER 1: AZURE BLOB STORAGE (PRIMARY)
    // ═════════════════════════════════════════════════════════════════
    if (this.azureConnStr && !this.azureConnStr.includes("YOUR_")) {
      try {
        const containerName = category === "briefs" ? this.azureBriefsContainer : this.azurePortfolioContainer;
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureConnStr);
        const containerClient = blobServiceClient.getBlobContainerClient(containerName);

        // Ensure container exists
        await containerClient.createIfNotExists({ access: "blob" });

        const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
        await blockBlobClient.uploadData(buffer, {
          blobHTTPHeaders: { blobContentType: mimeType },
        });

        console.log(`\x1b[32m[StorageService] Azure Blob Upload Success: ${blockBlobClient.url}\x1b[0m`);
        return blockBlobClient.url;
      } catch (azureErr) {
        console.warn(
          `\x1b[33m[StorageService] Azure Blob upload failed: ${azureErr.message}. Cascading to Supabase backup...\x1b[0m`
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 2: SUPABASE STORAGE (HOT STANDBY)
    // ═════════════════════════════════════════════════════════════════
    if (this.supabaseClient) {
      try {
        const bucketName = category === "briefs" ? this.supabaseBriefsBucket : this.supabasePortfolioBucket;
        const { data, error } = await this.supabaseClient.storage
          .from(bucketName)
          .upload(uniqueFileName, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = this.supabaseClient.storage
          .from(bucketName)
          .getPublicUrl(uniqueFileName);

        console.log(`\x1b[32m[StorageService] Supabase Storage Upload Success: ${publicUrlData.publicUrl}\x1b[0m`);
        return publicUrlData.publicUrl;
      } catch (supaErr) {
        console.warn(
          `\x1b[33m[StorageService] Supabase upload failed: ${supaErr.message}. Falling back to local storage...\x1b[0m`
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 3: LOCAL RESILIENT STORAGE (DEVELOPMENT FALLBACK)
    // ═════════════════════════════════════════════════════════════════
    const uploadsDir = path.join(__dirname, "../../public/uploads", category);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(localFilePath, buffer);

    const port = process.env.PORT || 5000;
    const localUrl = `http://localhost:${port}/uploads/${category}/${uniqueFileName}`;
    console.log(`\x1b[36m[StorageService] Stored locally (Dev Fallback): ${localUrl}\x1b[0m`);
    return localUrl;
  }
}

module.exports = new StorageService();
