require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const db = require("./services/dbFailoverEngine");
const storage = require("./services/storageService");
const authController = require("./controllers/authController");
const projectsController = require("./controllers/projectsController");
const briefsController = require("./controllers/briefsController");
const constructionController = require("./controllers/constructionController");
const legalPdfController = require("./controllers/legalPdfController");
const stageController = require("./controllers/stageController");
const subStageController = require("./controllers/subStageController");
const meetingHistoryController = require("./controllers/meetingHistoryController");
const quotationController = require("./controllers/quotationController");
const weatherController = require("./controllers/weatherController");
const { requireStage, STAGE_ORDER } = require("./middleware/stageGate");
const initializeDatabase = require("./scripts/initDb");
const { translateDictionary } = require("./services/translationService");
const phLocationService = require("./services/phLocationService");

const { rateLimit } = require("express-rate-limit");
const { requireAuth, requireRole, optionalAuth } = require("./middleware/auth");
const http = require("http");
const realtimeService = require("./services/realtimeService");
const webrtcSignalingService = require("./services/webrtcSignalingService");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize native WebSocket server on the HTTP server instance (/ws/accounts)
realtimeService.initWebSocket(server);

// Initialize Socket.IO WebRTC signaling engine for video calls
webrtcSignalingService.init(server);

// Trust reverse proxies (Azure App Service / Vercel Edge / Cloudflare)
app.set("trust proxy", 1);

// Rate limiters for security against brute-force and email flooding
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests from this network. Please try again after 15 minutes.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification code requests. Please wait 15 minutes before requesting another code.",
  },
});

// Setup Multer for memory buffering (Unlimited file size for large 3D walkthrough videos & high-res CAD sets)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100MB for text/form fields; no fileSize limit for videos/blueprints
  },
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
// STATIC ASSETS & ICONS API ENDPOINTS
// -----------------------------------------------------------------------------
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/api/icons", express.static(path.join(__dirname, "assets/icons")));
const uploadsRoot = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsRoot)) {
  try {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  } catch (e) {}
}
app.use("/uploads", express.static(uploadsRoot));

// -----------------------------------------------------------------------------
// ROOT STATUS ROUTE
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    status: "ONLINE",
    message: "MCPA Enterprise Backend API is running successfully.",
    cloud: "Azure App Service (Japan East - Always On)",
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
// WEBRTC ICE SERVERS (CLOUDFLARE CALLS + METERED TURN CONFIGURATION)
// -----------------------------------------------------------------------------
let cloudflareTurnCache = {
  expiresAt: 0,
  servers: [],
};

let dynamicTurnCache = {
  expiresAt: 0,
  servers: [],
};

app.get("/api/webrtc/ice-servers", async (req, res) => {
  const cfTurnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID || "";
  const cfTurnApiToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN || "";
  const now = Date.now();

  // 1. Primary Enterprise WebRTC: Cloudflare Calls Realtime Edge TURN (1,000 GB/month, MNL/CEB Edge)
  if (cfTurnKeyId && cfTurnApiToken) {
    if (cloudflareTurnCache.expiresAt > now && cloudflareTurnCache.servers.length > 0) {
      return res.json({
        success: true,
        iceServers: cloudflareTurnCache.servers,
        source: "cloudflare-calls-cached",
      });
    }

    try {
      const cfRes = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${cfTurnKeyId}/credentials/generate-ice-servers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfTurnApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 86400 }),
        }
      );

      if (cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData && Array.isArray(cfData.iceServers) && cfData.iceServers.length > 0) {
          const combinedCfServers = [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            ...cfData.iceServers,
          ];
          cloudflareTurnCache = {
            expiresAt: now + 12 * 60 * 60 * 1000, // Cache for 12 hours
            servers: combinedCfServers,
          };
          return res.json({
            success: true,
            iceServers: combinedCfServers,
            source: "cloudflare-calls",
          });
        }
      } else {
        const errText = await cfRes.text();
        console.warn("[WEBRTC] Cloudflare Calls credential generation returned non-200:", cfRes.status, errText);
      }
    } catch (cfErr) {
      console.warn("[WEBRTC] Cloudflare Calls error, failing over to secondary relay:", cfErr?.message || cfErr);
    }
  }

  const meteredApiKey = process.env.METERED_API_KEY || "";
  const meteredAppName = process.env.METERED_APP_NAME || "";

  // 2. Secondary WebRTC: Dynamic ephemeral TURN credentials via Metered REST API
  if (meteredApiKey && meteredAppName) {
    if (dynamicTurnCache.expiresAt > now && dynamicTurnCache.servers.length > 0) {
      return res.json({
        success: true,
        iceServers: dynamicTurnCache.servers,
        source: "metered-api-cached",
      });
    }

    try {
      const response = await fetch(
        `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`
      );
      if (response.ok) {
        const meteredServers = await response.json();
        if (Array.isArray(meteredServers) && meteredServers.length > 0) {
          const combinedServers = [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" },
            ...meteredServers,
          ];
          dynamicTurnCache = {
            expiresAt: now + 60 * 60 * 1000, // Cache for 1 hour
            servers: combinedServers,
          };
          return res.json({
            success: true,
            iceServers: combinedServers,
            source: "metered-api",
          });
        }
      }
    } catch (err) {
      console.warn("[WEBRTC] Failed to fetch dynamic Metered credentials:", err?.message || err);
    }
  }

  // 3. Tertiary: Static username/password credentials configuration
  const turnUsername =
    process.env.METERED_TURN_USERNAME ||
    process.env.NEXT_PUBLIC_METERED_TURN_USERNAME ||
    "";
  const turnPassword =
    process.env.METERED_TURN_PASSWORD ||
    process.env.NEXT_PUBLIC_METERED_TURN_PASSWORD ||
    "";

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
  ];

  if (turnUsername && turnPassword) {
    iceServers.push(
      // Standard Free-tier & Enterprise Metered relay hosts
      {
        urls: "turn:standard.relay.metered.ca:80",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:standard.relay.metered.ca:443",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      }
    );
  }

  return res.json({
    success: true,
    iceServers,
    source: "static-config",
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
app.post("/api/auth/login", authLimiter, (req, res) => authController.login(req, res));
app.post("/api/auth/face-login", (req, res) => authController.faceLogin(req, res));
app.post("/api/auth/client/register", authLimiter, (req, res) => authController.clientRegister(req, res));
app.post("/api/auth/check-email", (req, res) => authController.checkEmailAvailability(req, res));
app.post("/api/auth/send-registration-verification", authLimiter, (req, res) => authController.sendRegistrationVerification(req, res));
app.get("/api/auth/registration-email-status", (req, res) => authController.checkRegistrationEmailStatus(req, res));
app.post("/api/auth/verify-registration-token", (req, res) => authController.verifyRegistrationToken(req, res));
app.post("/api/auth/social-login", authLimiter, (req, res) => authController.socialLogin(req, res));
app.post("/api/auth/google", authLimiter, (req, res) => {
  req.body.provider = "google";
  return authController.socialLogin(req, res);
});
app.post("/api/auth/facebook", authLimiter, (req, res) => {
  req.body.provider = "facebook";
  return authController.socialLogin(req, res);
});
app.post("/api/auth/verify-face", (req, res) => authController.verifyFace(req, res));
app.get("/api/admin/accounts", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => authController.getAccounts(req, res));
app.post("/api/admin/invite-staff", requireAuth, requireRole("admin", "super_admin"), (req, res) => authController.inviteStaff(req, res));
app.post("/api/admin/resend-invite", requireAuth, requireRole("admin", "super_admin"), (req, res) => authController.resendStaffInvite(req, res));
app.get("/api/admin/verify-invite", (req, res) => authController.verifyInviteToken(req, res));
app.post("/api/admin/complete-setup-password", authLimiter, (req, res) => authController.completeSetupPassword(req, res));
app.get("/api/client/inquiries", optionalAuth, (req, res) => authController.getClientInquiries(req, res));
app.post("/api/auth/send-reset-otp", otpLimiter, (req, res) => authController.sendResetOtp(req, res));
app.post("/api/auth/verify-reset-otp", otpLimiter, (req, res) => authController.verifyResetOtp(req, res));
app.post("/api/auth/reset-password-with-otp", otpLimiter, (req, res) => authController.resetPasswordWithOtp(req, res));
app.get("/api/auth/me", requireAuth, (req, res) => authController.me(req, res));
app.get("/api/admin/profile", requireAuth, requireRole("admin", "super_admin"), (req, res) => authController.getAdminProfile(req, res));
app.put("/api/admin/profile", requireAuth, requireRole("admin", "super_admin"), (req, res) => authController.updateAdminProfile(req, res));
app.put("/api/client/profile", requireAuth, (req, res) => authController.updateClientProfile(req, res));

// -----------------------------------------------------------------------------
// PROJECTS ROUTES (PORTFOLIO SHOWCASE)
// -----------------------------------------------------------------------------
app.get("/api/projects", (req, res) => projectsController.getAll(req, res));
app.post("/api/projects", upload.single("image"), (req, res) => projectsController.create(req, res));
app.put("/api/projects/:id", upload.single("image"), (req, res) => projectsController.update(req, res));
app.patch("/api/projects/:id/featured", (req, res) => projectsController.toggleFeatured(req, res));
app.delete("/api/projects/:id", (req, res) => projectsController.delete(req, res));

// -----------------------------------------------------------------------------
// PROGRESSIVE DISCLOSURE & STAGE LIFECYCLE ROUTES
// -----------------------------------------------------------------------------
app.post("/api/projects/inquire", optionalAuth, (req, res) => stageController.inquire(req, res));
app.get("/api/users/me/dashboard-state", optionalAuth, (req, res) => stageController.getDashboardState(req, res));
app.get("/api/portal/dashboard-state", optionalAuth, (req, res) => stageController.getDashboardState(req, res));
app.post("/api/admin/projects/:id/advance-stage", requireAuth, requireRole("admin", "super_admin"), (req, res) => stageController.advanceStage(req, res));
app.patch("/api/admin/users/:userId/multi-project-approval", requireAuth, requireRole("admin", "super_admin"), (req, res) => stageController.toggleMultiProjectApproval(req, res));
app.post("/api/users/me/request-multi-project", requireAuth, (req, res) => subStageController.requestMultiProject(req, res));
app.post("/api/projects/:id/reset-rejected", requireAuth, (req, res) => subStageController.resetRejected(req, res));

// Document Vault & Transmittals
app.get("/api/admin/documents/overview", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.getAdminDocumentsOverview(req, res));
app.post("/api/admin/documents/requests", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.createDocumentRequest(req, res));
app.delete("/api/admin/documents/requests/:id", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.deleteDocumentRequest(req, res));
app.post("/api/admin/documents/transmittals", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.createTransmittal(req, res));
app.delete("/api/admin/documents/transmittals/:id", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.deleteTransmittal(req, res));
app.get("/api/projects/:id/document-requests", requireAuth, (req, res) => subStageController.getProjectDocumentRequests(req, res));
app.get("/api/projects/:id/transmittals", requireAuth, (req, res) => subStageController.getProjectTransmittals(req, res));
app.get("/api/projects/:id/documents", requireAuth, (req, res) => subStageController.getDocuments(req, res));
app.post("/api/projects/:id/documents", requireAuth, (req, res) => subStageController.uploadDocument(req, res));
app.patch("/api/admin/documents/:docId/verify", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.verifyDocument(req, res));
app.delete("/api/admin/documents/:docId", requireAuth, requireRole("admin", "super_admin"), (req, res) => subStageController.deleteProjectDocument(req, res));

// Consultation (WebRTC Meetings & Chat)
app.get("/api/projects/:id/meeting", requireAuth, (req, res) => subStageController.getMeetingRoom(req, res));
app.get("/api/projects/:id/messages", requireAuth, (req, res) => subStageController.getMessages(req, res));
app.post("/api/projects/:id/messages", requireAuth, (req, res) => subStageController.sendMessage(req, res));

// Pre-Construction & Planning (Blueprints, Permits, Groundbreaking, Contracts)
app.get("/api/admin/blueprints/overview", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.getAdminBlueprintsOverview(req, res));
app.get("/api/projects/:id/blueprints", requireAuth, (req, res) => subStageController.getBlueprints(req, res));
app.post("/api/projects/:id/blueprints", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => subStageController.createBlueprint(req, res));
app.patch("/api/projects/:id/blueprints/:blueprintId", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => subStageController.updateBlueprint(req, res));
app.delete("/api/projects/:id/blueprints/:blueprintId", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => subStageController.deleteBlueprint(req, res));
app.post("/api/projects/:id/blueprints/:blueprintId/pins", requireAuth, (req, res) => subStageController.saveBlueprintPins(req, res));
app.patch("/api/admin/blueprints/:blueprintId/pins/:pinId", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => subStageController.updateBlueprintPinStatus(req, res));
app.get("/api/projects/:id/permits", requireAuth, (req, res) => subStageController.getPermits(req, res));
app.get("/api/admin/permits/overview", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.getAdminPermitsOverview(req, res));
app.post("/api/admin/permits/apply-template", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.applyPermitsTemplate(req, res));
app.post("/api/admin/permits", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.createPermit(req, res));
app.patch("/api/admin/permits/:permitId", requireAuth, requireRole("admin", "super_admin", "architect", "engineer"), (req, res) => subStageController.updatePermit(req, res));
app.delete("/api/admin/permits/:permitId", requireAuth, requireRole("admin", "super_admin"), (req, res) => subStageController.deletePermit(req, res));
app.get("/api/admin/groundbreaking/overview", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => subStageController.getAdminGroundbreakingOverview(req, res));
app.get("/api/projects/:id/groundbreaking", optionalAuth, (req, res) => subStageController.getGroundbreaking(req, res));
app.post("/api/projects/:id/groundbreaking", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => subStageController.scheduleGroundbreaking(req, res));
app.get("/api/projects/:id/contract", requireAuth, (req, res) => subStageController.getContract(req, res));
app.post("/api/contracts/:id/sign", requireAuth, (req, res) => subStageController.signContract(req, res));

// Budget & Quotation Engine (Phase 2 Consultation & Client Portal)
app.get("/api/projects/:id/quotation", optionalAuth, (req, res) => quotationController.getQuotationByProject(req, res));
app.post("/api/projects/:id/quotation/request", optionalAuth, (req, res) => quotationController.requestQuotation(req, res));
app.get("/api/admin/quotations/overview", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => quotationController.getAdminQuotationsOverview(req, res));
app.post("/api/admin/quotations", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => quotationController.saveAdminQuotation(req, res));
app.put("/api/admin/quotations/:id", requireAuth, requireRole("admin", "super_admin", "architect"), (req, res) => quotationController.saveAdminQuotation(req, res));
app.get("/api/projects/:id/quotation/pdf", (req, res) => quotationController.downloadQuotationPdf(req, res));
app.get("/api/quotations/:id/pdf", (req, res) => quotationController.downloadQuotationPdf(req, res));

// Execution & Transparency (Loans & BNPL)
app.get("/api/projects/:id/loans", requireAuth, (req, res) => subStageController.getLoans(req, res));

// Post-Construction & Handover (Wrapped & Public Recap)
app.get("/api/projects/:id/wrapped", requireAuth, (req, res) => subStageController.getWrapped(req, res));
app.get("/api/wrapped/:shareToken", (req, res) => subStageController.getPublicWrapped(req, res));

// -----------------------------------------------------------------------------
// CLIENT BRIEFS / CONSULTATIONS ROUTES (SAAD FLOWCHART PHASES 1-4)
// -----------------------------------------------------------------------------
app.get("/api/client/active-inquiry-check", optionalAuth, (req, res) => briefsController.checkActiveInquiry(req, res));
app.get("/api/briefs", (req, res) => briefsController.getAll(req, res));
app.get("/api/briefs/:id/pdf", (req, res) => briefsController.downloadPdf(req, res));
app.post("/api/briefs/pdf", (req, res) => briefsController.downloadPdf(req, res));
app.post("/api/briefs", (req, res) => briefsController.submit(req, res));
app.patch("/api/briefs/:id", (req, res) => briefsController.updateStatus(req, res));
app.post("/api/briefs/:id/reject", (req, res) => briefsController.reject(req, res));
app.post("/api/briefs/:id/archive", (req, res) => briefsController.archive(req, res));
app.post("/api/briefs/:id/provision", (req, res) => briefsController.provisionAccess(req, res));
app.delete("/api/briefs/:id", (req, res) => briefsController.delete(req, res));
app.post("/api/meetings/:id/confirm-attendance", (req, res) => briefsController.confirmAttendance(req, res));
app.post("/api/meetings/:id/send-reminder", (req, res) => briefsController.sendMeetingReminder(req, res));
app.post("/api/meetings/:id/record-outcome", optionalAuth, (req, res) => briefsController.recordMeetingOutcome(req, res));
app.post("/api/portal/consultation/:id/withdraw", requireAuth, (req, res) => briefsController.withdrawConsultation(req, res));
app.post("/api/portal/consultation/withdraw", requireAuth, (req, res) => briefsController.withdrawConsultation(req, res));

// -----------------------------------------------------------------------------
// CONCLUDED CONSULTATION SESSIONS & INSTANT MEETING HISTORY (NEON / SUPABASE)
// -----------------------------------------------------------------------------
app.get("/api/meetings/history", (req, res) => meetingHistoryController.getAll(req, res));
app.post("/api/meetings/history", (req, res) => meetingHistoryController.recordConcluded(req, res));
app.patch("/api/meetings/history/:sessionId", (req, res) => meetingHistoryController.updateRatingAndNote(req, res));
app.put("/api/meetings/history/:sessionId/rating", (req, res) => meetingHistoryController.updateRatingAndNote(req, res));
app.delete("/api/meetings/history/:sessionId", requireAuth, requireRole("admin", "super_admin"), (req, res) => meetingHistoryController.delete(req, res));

// -----------------------------------------------------------------------------
// CONSTRUCTION SITE EXECUTION ROUTES (SAAD FLOWCHART PHASE 5)
// -----------------------------------------------------------------------------
app.get("/api/construction/stage3-projects", optionalAuth, (req, res) => constructionController.getStage3Projects(req, res));
app.get("/api/construction/project", optionalAuth, (req, res) => constructionController.getProject(req, res));
app.get("/api/construction/projects/:code", optionalAuth, (req, res) => constructionController.getProject(req, res));
app.post("/api/construction/milestones", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.createMilestone(req, res));
app.patch("/api/construction/milestones/:milestoneId", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.updateMilestone(req, res));
app.delete("/api/construction/milestones/:milestoneId", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.deleteMilestone(req, res));
app.post("/api/construction/virtual-tour", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.updateVirtualTour(req, res));
app.post("/api/construction/photos", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.addPhotoLog(req, res));
app.delete("/api/construction/photos/:logId", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.deletePhotoLog(req, res));
app.post("/api/construction/billing", requireAuth, requireRole("admin", "super_admin"), (req, res) => constructionController.createBillingTranche(req, res));
app.patch("/api/construction/billing/:billId/verify", requireAuth, requireRole("admin", "super_admin"), (req, res) => constructionController.verifyPayment(req, res));
app.patch("/api/construction/billing/:billId/proof", optionalAuth, (req, res) => constructionController.uploadPaymentProof(req, res));
app.post("/api/construction/billing/:billId/proof", optionalAuth, (req, res) => constructionController.uploadPaymentProof(req, res));
app.get("/api/construction/expenses/:code", optionalAuth, (req, res) => constructionController.getProjectExpenses(req, res));
app.post("/api/construction/delays", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.logDelay(req, res));
app.post("/api/construction/warranty", optionalAuth, (req, res) => constructionController.submitWarrantyTicket(req, res));
app.patch("/api/construction/warranty/:ticketId", requireAuth, requireRole("admin", "super_admin", "engineer"), (req, res) => constructionController.updateWarrantyStatus(req, res));
app.post("/api/construction/expenses/ocr", requireAuth, requireRole("admin", "super_admin"), (req, res) => constructionController.logOcrExpense(req, res));

// OCR RECEIPT AUTO-SCAN & PARSING ROUTE
app.post("/api/construction/scan-receipt", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: "File error: " + err.message });
    next();
  });
}, async (req, res) => {
  try {
    const receiptOcrService = require("./services/receiptOcrService");
    let imageSource = null;

    if (req.file && req.file.buffer) {
      imageSource = req.file.buffer;
    } else if (req.body?.imageUrl) {
      imageSource = req.body.imageUrl;
    } else if (req.body?.image) {
      imageSource = req.body.image;
    }

    if (!imageSource) {
      return res.status(400).json({ success: false, message: "No image file or URL provided for OCR scan." });
    }

    const scanResult = await receiptOcrService.scanReceiptImage(imageSource);
    return res.json(scanResult);
  } catch (err) {
    console.error("[OCR Scan Route] Error:", err);
    return res.status(500).json({ success: false, message: "OCR Scan failed: " + err.message });
  }
});

app.get("/api/weather/forecast", (req, res) => weatherController.getForecast(req, res));

// -----------------------------------------------------------------------------
// CORPORATE LEGAL PDF GENERATION & DIRECT DOWNLOAD ROUTE
// -----------------------------------------------------------------------------
app.get("/api/legal/pdf/:docType", (req, res) => legalPdfController.downloadLegalPdf(req, res));

// -----------------------------------------------------------------------------
// STANDALONE UPLOAD ROUTE (Direct Azure / Supabase file upload)
// -----------------------------------------------------------------------------
app.post("/api/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("[Upload API] Multer upload error:", err);
      return res.status(400).json({ success: false, message: "Upload failed: " + err.message });
    }
    next();
  });
}, async (req, res) => {
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

// -----------------------------------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE) STREAM FOR ADMIN DIRECTORY & CLIENT LOGS
// -----------------------------------------------------------------------------
app.get("/api/admin/realtime-stream", (req, res) => {
  realtimeService.handleSseConnection(req, res);
});

// Startup & Database Sync
if (!process.env.VERCEL) {
  initializeDatabase().then(() => {
    server.listen(PORT, () => {
      console.log(`\n\x1b[32m[SERVER] MCPA Enterprise Backend listening on http://localhost:${PORT}\x1b[0m`);
      console.log(`[DATABASE] Active DB Provider: \x1b[33m${db.getActiveProviderName()}\x1b[0m`);
      console.log(`[STORAGE] Cloud Storage: \x1b[36mAzure Blob (Tier 1 Primary) -> Supabase Storage (Tier 2 Backup) -> Neon S3 (Tier 3 Standby)\x1b[0m`);
      console.log(`[REALTIME] WebSocket hub active on ws://localhost:${PORT}/ws/accounts & SSE on /api/admin/realtime-stream\n`);

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

