/**
 * MCPA CONSTRUCTION & SUPPLY — SUB-STAGE LIFECYCLE CONTROLLER
 * Exposes endpoints for progressive disclosure features:
 * - Multi-Project Requests
 * - Consultation Meetings & Live Chat
 * - Document Vault
 * - Blueprints & Revisions
 * - Permits Tracking & Groundbreaking Scheduling
 * - Contract E-Signatures
 * - Financing & BNPL
 * - Project Wrapped & Public Recaps
 */

const stageEngineService = require("../services/stageEngineService");

class SubStageController {
  /**
   * POST /api/users/me/request-multi-project
   * Allows clients to request admin approval for an additional concurrent project
   */
  async requestMultiProject(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }
      const { note } = req.body || {};
      const updatedUser = await stageEngineService.requestMultiProjectApproval(userId, note);
      return res.status(200).json({
        success: true,
        message: "Multi-project approval request submitted to MCPA Administration.",
        user: updatedUser,
      });
    } catch (err) {
      console.error("[SubStageController.requestMultiProject] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/reset-rejected
   * Allows a user whose inquiry was rejected to archive it and restart cleanly
   */
  async resetRejected(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const projectId = parseInt(req.params.id, 10);
      const result = await stageEngineService.resetRejectedInquiry({ projectId, userId });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[SubStageController.resetRejected] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/documents
   */
  async getDocuments(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const stageId = req.query.stage_id || null;
      const documents = await stageEngineService.getProjectDocuments(projectId, stageId);
      return res.status(200).json({ success: true, documents });
    } catch (err) {
      console.error("[SubStageController.getDocuments] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/documents
   */
  async uploadDocument(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const projectId = parseInt(req.params.id, 10);
      const { stageId = "CONSULTATION", docType, fileName, fileUrl, fileSizeBytes, mimeType, notes } = req.body || {};

      if (!fileUrl || !fileName || !docType) {
        return res.status(400).json({ success: false, message: "fileUrl, fileName, and docType are required." });
      }

      const doc = await stageEngineService.uploadProjectDocument({
        projectId,
        stageId,
        docType,
        fileName,
        fileUrl,
        fileSizeBytes,
        mimeType,
        uploadedBy: userId,
        notes,
      });

      return res.status(201).json({ success: true, document: doc });
    } catch (err) {
      console.error("[SubStageController.uploadDocument] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/admin/documents/:docId/verify
   */
  async verifyDocument(req, res) {
    try {
      const adminUserId = req.user?.userId || req.user?.user_id;
      const docId = parseInt(req.params.docId, 10);
      const { status, notes } = req.body || {};

      if (!["Verified", "Rejected", "Pending Review"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value." });
      }

      const verifiedDoc = await stageEngineService.verifyProjectDocument({
        docId,
        adminUserId,
        status,
        notes,
      });

      return res.status(200).json({ success: true, document: verifiedDoc });
    } catch (err) {
      console.error("[SubStageController.verifyDocument] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/meeting
   */
  async getMeetingRoom(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const projectId = parseInt(req.params.id, 10);
      const meeting = await stageEngineService.getOrCreateMeetingRoom({
        projectId,
        guestUserId: userId,
      });
      return res.status(200).json({ success: true, meeting });
    } catch (err) {
      console.error("[SubStageController.getMeetingRoom] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/messages
   */
  async getMessages(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const limit = parseInt(req.query.limit || 50, 10);
      const messages = await stageEngineService.getProjectMessages(projectId, limit);
      return res.status(200).json({ success: true, messages });
    } catch (err) {
      console.error("[SubStageController.getMessages] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/messages
   */
  async sendMessage(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const projectId = parseInt(req.params.id, 10);
      const { messageText, attachments = [] } = req.body || {};

      if (!messageText || !messageText.trim()) {
        return res.status(400).json({ success: false, message: "Message text cannot be empty." });
      }

      const sentMsg = await stageEngineService.sendProjectMessage({
        projectId,
        senderUserId: userId,
        messageText: messageText.trim(),
        attachments,
      });

      return res.status(201).json({ success: true, message: sentMsg });
    } catch (err) {
      console.error("[SubStageController.sendMessage] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/blueprints
   */
  async getBlueprints(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const discipline = req.query.discipline || null;
      const blueprints = await stageEngineService.getProjectBlueprints(projectId, discipline);
      return res.status(200).json({ success: true, blueprints });
    } catch (err) {
      console.error("[SubStageController.getBlueprints] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/blueprints/:blueprintId/pins
   */
  async saveBlueprintPins(req, res) {
    try {
      const blueprintId = parseInt(req.params.blueprintId, 10);
      const { pins = [] } = req.body || {};
      const updated = await stageEngineService.saveBlueprintPins(blueprintId, pins);
      return res.status(200).json({ success: true, blueprint: updated });
    } catch (err) {
      console.error("[SubStageController.saveBlueprintPins] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/permits
   */
  async getPermits(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const permits = await stageEngineService.getProjectPermits(projectId);
      return res.status(200).json({ success: true, permits });
    } catch (err) {
      console.error("[SubStageController.getPermits] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/admin/permits/:permitId
   */
  async updatePermit(req, res) {
    try {
      const permitId = parseInt(req.params.permitId, 10);
      const updated = await stageEngineService.updatePermitRecord({ permitId, ...req.body });
      return res.status(200).json({ success: true, permit: updated });
    } catch (err) {
      console.error("[SubStageController.updatePermit] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/groundbreaking
   */
  async scheduleGroundbreaking(req, res) {
    try {
      const adminUserId = req.user?.userId || req.user?.user_id;
      const projectId = parseInt(req.params.id, 10);
      const { groundbreakingDate } = req.body || {};

      if (!groundbreakingDate) {
        return res.status(400).json({ success: false, message: "groundbreakingDate is required." });
      }

      const updated = await stageEngineService.scheduleGroundbreaking({
        projectId,
        groundbreakingDate,
        adminUserId,
      });

      return res.status(200).json({ success: true, project: updated });
    } catch (err) {
      console.error("[SubStageController.scheduleGroundbreaking] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/contract
   */
  async getContract(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const contract = await stageEngineService.getProjectContract(projectId);
      return res.status(200).json({ success: true, contract });
    } catch (err) {
      console.error("[SubStageController.getContract] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/contracts/:id/sign
   */
  async signContract(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const contractId = parseInt(req.params.id, 10);
      const { signerRole = "CLIENT", signerName, signerEmail, signatureImageUrl } = req.body || {};

      if (!signatureImageUrl || !signerName || !signerEmail) {
        return res.status(400).json({ success: false, message: "Signature image, name, and email are required." });
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
      const userAgent = req.headers["user-agent"] || null;

      const signature = await stageEngineService.signProjectContract({
        contractId,
        userId,
        signerRole,
        signerName,
        signerEmail,
        signatureImageUrl,
        ipAddress: clientIp,
        userAgent,
      });

      return res.status(201).json({
        success: true,
        message: "Digital contract successfully signed with cryptographic hash verification.",
        signature,
      });
    } catch (err) {
      console.error("[SubStageController.signContract] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/loans
   */
  async getLoans(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const loans = await stageEngineService.getProjectLoans(projectId);
      return res.status(200).json({ success: true, loans });
    } catch (err) {
      console.error("[SubStageController.getLoans] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/wrapped
   */
  async getWrapped(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const wrapped = await stageEngineService.getProjectWrapped(projectId);
      return res.status(200).json({ success: true, wrapped });
    } catch (err) {
      console.error("[SubStageController.getWrapped] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/wrapped/:shareToken (Public Read-Only)
   */
  async getPublicWrapped(req, res) {
    try {
      const { shareToken } = req.params;
      const wrapped = await stageEngineService.getPublicWrappedByToken(shareToken);
      return res.status(200).json({ success: true, wrapped });
    } catch (err) {
      console.error("[SubStageController.getPublicWrapped] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SubStageController();
