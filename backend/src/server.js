require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const db = require("./services/dbFailoverEngine");
const storage = require("./services/storageService");
const authController = require("./controllers/authController");
const projectsController = require("./controllers/projectsController");
const briefsController = require("./controllers/briefsController");
const constructionController = require("./controllers/constructionController");
const legalPdfController = require("./controllers/legalPdfController");
const initializeDatabase = require("./scripts/initDb");
const { translateDictionary } = require("./services/translationService");
const phLocationService = require("./services/phLocationService");

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer for memory buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit per file
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// -----------------------------------------------------------------------------
// ROOT STATUS ROUTE
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    status: "ONLINE",
    message: "MCPA Enterprise Backend API is running successfully.",
    endpoints: {
      health: "/api/health",
      projects: "/api/projects",
      briefs: "/api/briefs",
      legalPdf: "/api/legal/pdf/:docType",
    },
  });
});

// -----------------------------------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  let probeOk = true;
  try {
    await db.query("SELECT 1;");
  } catch (err) {
    probeOk = false;
  }

  res.json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    service: "MCPA Construction & Supply Backend API",
    database: {
      activeProvider: db.getActiveProviderName(),
      isFailoverActive: db.isFailoverActive,
      failoverReason: db.lastFailoverReason || null,
      targetSupabaseHost: db.supabaseConnStr ? db.supabaseConnStr.split("@")[1]?.split("/")[0] : null,
      probeOk,
    },
    storage: {
      primary: "Azure Blob Storage",
      backup: "Supabase Storage",
      standby: "Neon S3 Object Storage",
    },
    email: {
      primary: "Gmail SMTP",
      backup: "Resend API",
    },
  });
});

// -----------------------------------------------------------------------------
// TRANSLATION ROUTE
// -----------------------------------------------------------------------------
app.post("/api/translations", async (req, res) => {
  try {
    const { source, target } = req.body;
    if (!source || typeof source !== "object") {
      return res.status(400).json({ message: "A source translation dictionary is required." });
    }
    if (target !== "tl") {
      return res.status(400).json({ message: "Only Filipino (tl) translation is supported." });
    }

    const result = await translateDictionary(source, target);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[Translations] Error:", err);
    return res.status(502).json({ message: "Translation provider unavailable." });
  }
});

// -----------------------------------------------------------------------------
// AUTH ROUTES
// -----------------------------------------------------------------------------
app.post("/api/auth/login", (req, res) => authController.login(req, res));
app.post("/api/auth/face-login", (req, res) => authController.faceLogin(req, res));
app.post("/api/auth/client/register", (req, res) => authController.clientRegister(req, res));
app.post("/api/auth/social-login", (req, res) => authController.socialLogin(req, res));
app.post("/api/auth/google", (req, res) => {
  req.body.provider = "google";
  return authController.socialLogin(req, res);
});
app.post("/api/auth/facebook", (req, res) => {
  req.body.provider = "facebook";
  return authController.socialLogin(req, res);
});
app.get("/api/admin/accounts", (req, res) => authController.getAccounts(req, res));
app.get("/api/client/inquiries", (req, res) => authController.getClientInquiries(req, res));
app.post("/api/auth/send-reset-otp", (req, res) => authController.sendResetOtp(req, res));
app.post("/api/auth/verify-reset-otp", (req, res) => authController.verifyResetOtp(req, res));
app.post("/api/auth/reset-password-with-otp", (req, res) => authController.resetPasswordWithOtp(req, res));
app.get("/api/auth/me", (req, res) => authController.me(req, res));
app.get("/api/admin/profile", (req, res) => authController.getAdminProfile(req, res));
app.put("/api/admin/profile", (req, res) => authController.updateAdminProfile(req, res));

// -----------------------------------------------------------------------------
// PROJECTS ROUTES (PORTFOLIO SHOWCASE)
// -----------------------------------------------------------------------------
app.get("/api/projects", (req, res) => projectsController.getAll(req, res));
app.post("/api/projects", upload.single("image"), (req, res) => projectsController.create(req, res));
app.put("/api/projects/:id", upload.single("image"), (req, res) => projectsController.update(req, res));
app.patch("/api/projects/:id/featured", (req, res) => projectsController.toggleFeatured(req, res));
app.delete("/api/projects/:id", (req, res) => projectsController.delete(req, res));

// -----------------------------------------------------------------------------
// CLIENT BRIEFS / CONSULTATIONS ROUTES (SAAD FLOWCHART PHASES 1-4)
// -----------------------------------------------------------------------------
app.get("/api/briefs", (req, res) => briefsController.getAll(req, res));
app.post("/api/briefs", (req, res) => briefsController.submit(req, res));
app.patch("/api/briefs/:id", (req, res) => briefsController.updateStatus(req, res));
app.post("/api/briefs/:id/provision", (req, res) => briefsController.provisionAccess(req, res));
app.delete("/api/briefs/:id", (req, res) => briefsController.delete(req, res));

// -----------------------------------------------------------------------------
// CONSTRUCTION SITE EXECUTION ROUTES (SAAD FLOWCHART PHASE 5)
// -----------------------------------------------------------------------------
app.get("/api/construction/project", (req, res) => constructionController.getProject(req, res));
app.get("/api/construction/projects/:code", (req, res) => constructionController.getProject(req, res));
app.patch("/api/construction/milestones/:milestoneId", (req, res) => constructionController.updateMilestone(req, res));
app.post("/api/construction/photos", (req, res) => constructionController.addPhotoLog(req, res));
app.patch("/api/construction/billing/:billId/verify", (req, res) => constructionController.verifyPayment(req, res));
app.patch("/api/construction/billing/:billId/proof", (req, res) => constructionController.uploadPaymentProof(req, res));
app.post("/api/construction/billing/:billId/proof", (req, res) => constructionController.uploadPaymentProof(req, res));
app.post("/api/construction/delays", (req, res) => constructionController.logDelay(req, res));
app.post("/api/construction/warranty", (req, res) => constructionController.submitWarrantyTicket(req, res));
app.patch("/api/construction/warranty/:ticketId", (req, res) => constructionController.updateWarrantyStatus(req, res));
app.post("/api/construction/expenses/ocr", (req, res) => constructionController.logOcrExpense(req, res));

// -----------------------------------------------------------------------------
// CORPORATE LEGAL PDF GENERATION & DIRECT DOWNLOAD ROUTE
// -----------------------------------------------------------------------------
app.get("/api/legal/pdf/:docType", (req, res) => legalPdfController.downloadLegalPdf(req, res));

// -----------------------------------------------------------------------------
// STANDALONE UPLOAD ROUTE (Direct Azure / Supabase file upload)
// -----------------------------------------------------------------------------
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }
    const category = req.query.category || "portfolio";
    const publicUrl = await storage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      category
    );
    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("[Upload API] Error:", err);
    return res.status(500).json({ message: "Upload failed: " + err.message });
  }
});

// MULTI-PHOTO UPLOAD ROUTE (Up to 10 photos, 10MB max each)
app.post("/api/upload-multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided." });
    }
    const category = req.query.category || "portfolio";
    const uploadPromises = req.files.map((file) =>
      storage.uploadFile(file.buffer, file.originalname, file.mimetype, category)
    );
    const urls = await Promise.all(uploadPromises);
    return res.json({ success: true, urls });
  } catch (err) {
    console.error("[Multi-Upload API] Error:", err);
    return res.status(500).json({ message: "Multiple upload failed: " + err.message });
  }
});

// CLOUD STORAGE ORPHAN CLEANUP ENDPOINT
app.post("/api/storage/cleanup-orphans", async (req, res) => {
  try {
    const { cleanOrphanedBlobs } = require("./scripts/cleanOrphanedBlobs");
    const isExecute = req.query.dryRun === "false" || req.body?.dryRun === false;
    process.argv = isExecute ? ["node", "cleanOrphanedBlobs.js", "--execute"] : ["node", "cleanOrphanedBlobs.js", "--dry-run"];
    const stats = await cleanOrphanedBlobs();
    return res.json({ success: true, stats });
  } catch (err) {
    console.error("[Storage Cleanup API] Error:", err);
    return res.status(500).json({ success: false, message: "Storage cleanup failed: " + err.message });
  }
});

// CLOUD STORAGE BI-DIRECTIONAL RECONCILIATION & SELF-HEALING ENDPOINT
app.post("/api/storage/reconcile", async (req, res) => {
  try {
    const report = await storage.reconcileCloudMirrors();
    return res.json({ success: true, report });
  } catch (err) {
    console.error("[Storage Reconcile API] Error:", err);
    return res.status(500).json({ success: false, message: "Storage reconciliation failed: " + err.message });
  }
});

// -----------------------------------------------------------------------------
// PHILIPPINES LOCATION AUTOCOMPLETE API (Strictly PH live API, zero stored data)
// -----------------------------------------------------------------------------
app.get("/api/locations/ph", async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query || query.length < 2) {
    return res.json({ success: true, locations: [] });
  }

  try {
    const locations = await phLocationService.searchLocations(query);
    return res.json({ success: true, locations });
  } catch (err) {
    console.error("[Locations API] Search error:", err.message);
    return res.status(500).json({ success: false, message: "Location search failed." });
  }
});

// -----------------------------------------------------------------------------
// AUTHORITATIVE SERVER TIME API (PHT / UTC+8 Anti-Tamper Clock Synchronization)
// -----------------------------------------------------------------------------
app.get("/api/time", (req, res) => {
  const now = new Date();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  return res.json({
    success: true,
    serverTimeUtc: now.toISOString(),
    timestamp: now.getTime(),
    timezone: "Asia/Manila",
    offsetMinutes: 480,
  });
});

// Startup & Database Sync
if (!process.env.VERCEL) {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`\n\x1b[32m[SERVER] MCPA Enterprise Backend listening on http://localhost:${PORT}\x1b[0m`);
      console.log(`[DATABASE] Active DB Provider: \x1b[33m${db.getActiveProviderName()}\x1b[0m`);
      console.log(`[STORAGE] Cloud Storage: \x1b[36mAzure Blob (Tier 1 Primary) -> Supabase Storage (Tier 2 Backup) -> Neon S3 (Tier 3 Standby)\x1b[0m\n`);

      // Non-blocking self-healing reconciliation check
      setTimeout(() => {
        storage.reconcileCloudMirrors().catch((err) => {
          console.warn("[SERVER] Startup storage reconciliation warning:", err.message);
        });
      }, 5000);
    });
  });
}

module.exports = app;

