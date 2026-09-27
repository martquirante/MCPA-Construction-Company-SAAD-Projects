const { BlobServiceClient } = require("@azure/storage-blob");
const { createClient } = require("@supabase/supabase-js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
    // TIER 1: AZURE BLOB STORAGE (PRIMARY CLOUD STORAGE FOR MEDIA/FILES)
    // ═════════════════════════════════════════════════════════════════
    if (this.azureConnStr && !this.azureConnStr.includes("YOUR_") && !this.azureConnStr.includes("UseDevelopmentStorage=true")) {
      try {
        const containerName = category === "briefs" ? this.azureBriefsContainer : this.azurePortfolioContainer;
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureConnStr);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Ensure container exists
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
        await blockBlobClient.uploadData(buffer, {
          blobHTTPHeaders: { blobContentType: mimeType },
        });

        console.log(`\x1b[32m[StorageService] Azure Blob Upload Success (Primary): ${blockBlobClient.url}\x1b[0m`);
        return blockBlobClient.url;
      } catch (azureErr) {
        console.warn(
          `\x1b[33m[StorageService] Azure Blob upload failed: ${azureErr.message}. Cascading to Supabase Storage backup...\x1b[0m`
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 2: SUPABASE STORAGE (HOT STANDBY / BACKUP STORAGE)
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

        console.log(`\x1b[32m[StorageService] Supabase Storage Upload Success (Backup): ${publicUrlData.publicUrl}\x1b[0m`);
        return publicUrlData.publicUrl;
      } catch (supaErr) {
        console.warn(
          `\x1b[33m[StorageService] Supabase upload failed: ${supaErr.message}. Cascading to Neon S3 standby...\x1b[0m`
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 3: NEON S3-COMPATIBLE OBJECT STORAGE (STANDBY)
    // ═════════════════════════════════════════════════════════════════
    if (this.s3Client) {
      try {
        const bucketName = category === "briefs" ? "mcpa-briefs" : "mcpa-portfolio";
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueFileName,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        const s3PublicUrl = `${this.s3Endpoint}/${bucketName}/${uniqueFileName}`;
        console.log(`\x1b[32m[StorageService] Neon S3 Storage Upload Success (Standby): ${s3PublicUrl}\x1b[0m`);
        return s3PublicUrl;
      } catch (s3Err) {
        console.warn(
          `\x1b[33m[StorageService] Neon S3 upload failed: ${s3Err.message}. Falling back to local storage...\x1b[0m`
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // TIER 3: LOCAL RESILIENT STORAGE (DEVELOPMENT FALLBACK)
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

    // In serverless, if cloud storage isn't configured, encode small images as base64 data URLs
    if (isVercel && buffer.length < 4 * 1024 * 1024) {
      const mime = uniqueFileName.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }

    const port = process.env.PORT || 5000;
    const localUrl = `http://localhost:${port}/uploads/${category}/${uniqueFileName}`;
    console.log(`\x1b[36m[StorageService] Stored locally (Dev Fallback): ${localUrl}\x1b[0m`);
    return localUrl;
  }
}

module.exports = new StorageService();
