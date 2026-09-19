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
const initializeDatabase = require("./scripts/initDb");

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer for memory buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder statically for dev fallback
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// -----------------------------------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    service: "MCPA Construction & Supply Backend API",
    database: {
      activeProvider: db.getActiveProviderName(),
      isFailoverActive: db.isFailoverActive,
    },
    storage: {
      primary: "Azure Blob Storage",
      backup: "Supabase Storage",
    },
  });
});

// -----------------------------------------------------------------------------
// AUTH ROUTES
// -----------------------------------------------------------------------------
app.post("/api/auth/login", (req, res) => authController.login(req, res));
app.post("/api/auth/send-reset-otp", (req, res) => authController.sendResetOtp(req, res));
app.post("/api/auth/verify-reset-otp", (req, res) => authController.verifyResetOtp(req, res));
app.post("/api/auth/reset-password-with-otp", (req, res) => authController.resetPasswordWithOtp(req, res));
app.get("/api/auth/me", (req, res) => authController.me(req, res));

// -----------------------------------------------------------------------------
// PROJECTS ROUTES (PORTFOLIO SHOWCASE)
// -----------------------------------------------------------------------------
app.get("/api/projects", (req, res) => projectsController.getAll(req, res));
app.post("/api/projects", upload.single("image"), (req, res) => projectsController.create(req, res));
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

// Startup & Database Sync
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n\x1b[32m[SERVER] MCPA Enterprise Backend listening on http://localhost:${PORT}\x1b[0m`);
    console.log(`[DATABASE] Active DB Provider: \x1b[33m${db.getActiveProviderName()}\x1b[0m`);
    console.log(`[STORAGE] Cloud Storage: \x1b[36mAzure Blob (Tier 1) -> Supabase Storage (Tier 2)\x1b[0m\n`);
  });
});
