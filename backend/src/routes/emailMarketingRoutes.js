/**
 * MCPA Construction & Supply — Email Marketing & Campaign Management Routes
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");

const emailController = require("../controllers/emailMarketingController");
const authController = require("../controllers/authController");

// Setup Multer for media uploads (Support photos & videos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per video or high-res image
    files: 20, // Support multi-photo and multi-video uploads
  },
});

// ==========================================
// 1. PUBLIC ROUTES (Footer, Opt-out & Tracking)
// ==========================================
router.post("/subscribe", emailController.subscribeNewsletter);
router.post("/unsubscribe", emailController.unsubscribeNewsletter);

// Tracking endpoints (No auth required)
router.get("/track/open/:campaignId/:email", emailController.trackOpen);
router.get("/track/click/:campaignId/:email", emailController.trackClick);

// ==========================================
// 2. PROTECTED ADMIN ROUTES
// ==========================================
const adminAuth = authController.verifyAdminRole ? authController.verifyAdminRole : (req, res, next) => next();

// Overview
router.get("/overview", adminAuth, emailController.getOverviewMetrics);

// Subscribers
router.get("/subscribers", adminAuth, emailController.getSubscribers);
router.post("/subscribers", adminAuth, emailController.addSubscriber);

// Audience Preview
router.get("/audience-preview", adminAuth, emailController.getAudiencePreview);

// Templates
router.get("/templates", adminAuth, emailController.getTemplates);
router.post("/templates", adminAuth, emailController.createTemplate);
router.put("/templates/:id", adminAuth, emailController.updateTemplate);
router.delete("/templates/:id", adminAuth, emailController.deleteTemplate);

// Campaigns
router.get("/campaigns", adminAuth, emailController.getCampaigns);
router.get("/campaigns/:id", adminAuth, emailController.getCampaignById);
router.post("/campaigns", adminAuth, emailController.createCampaign);
router.put("/campaigns/:id", adminAuth, emailController.updateCampaign);
router.delete("/campaigns/:id", adminAuth, emailController.deleteCampaign);

// Actions
router.post("/campaigns/:id/send-test", adminAuth, emailController.sendTestEmail);
router.post("/campaigns/:id/send-now", adminAuth, emailController.sendCampaignNow);

// Media Upload (Photos & Videos Multi-file upload)
router.post("/upload-media", adminAuth, upload.array("files", 20), emailController.uploadCampaignMedia);

// AI Copy Assistant
router.post("/ai-assist", adminAuth, emailController.aiAssist);

module.exports = router;
