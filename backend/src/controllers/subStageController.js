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
const db = require("../services/dbFailoverEngine");
const { generateContractPdf } = require("../services/contractPdfService");
const finishedProjectService = require("../services/finishedProjectService");

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
      const { stageId = "CONSULTATION", docType, fileName, fileUrl, fileSizeBytes, mimeType, notes, requestId } = req.body || {};

      if (!fileUrl || !fileName || !docType) {
        return res.status(400).json({ success: false, message: "fileUrl, fileName, and docType are required." });
      }

      const doc = await stageEngineService.fulfillDocumentRequest({
        requestId: requestId ? parseInt(requestId, 10) : null,
        projectId,
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
   * DELETE /api/admin/documents/:docId
   */
  async deleteProjectDocument(req, res) {
    try {
      const docId = parseInt(req.params.docId, 10);
      await stageEngineService.deleteProjectDocument(docId);
      return res.status(200).json({ success: true, message: "Document deleted." });
    } catch (err) {
      console.error("[SubStageController.deleteProjectDocument] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/documents/overview
   */
  async getAdminDocumentsOverview(req, res) {
    try {
      const overview = await stageEngineService.getAdminDocumentsOverview();
      return res.status(200).json({ success: true, ...overview });
    } catch (err) {
      console.error("[SubStageController.getAdminDocumentsOverview] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/documents/requests
   */
  async createDocumentRequest(req, res) {
    try {
      const adminUserId = req.user?.userId || req.user?.user_id;
      const { projectId, title, category, urgency, instructions } = req.body || {};
      if (!projectId || !title || !category) {
        return res.status(400).json({ success: false, message: "projectId, title, and category are required." });
      }

      const request = await stageEngineService.createDocumentRequest({
        projectId: parseInt(projectId, 10),
        title,
        category,
        urgency: urgency || "Urgent",
        instructions,
        requestedBy: adminUserId,
      });
      return res.status(201).json({ success: true, request });
    } catch (err) {
      console.error("[SubStageController.createDocumentRequest] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/admin/documents/requests/:id
   */
  async deleteDocumentRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id, 10);
      await stageEngineService.deleteDocumentRequest(requestId);
      return res.status(200).json({ success: true, message: "Request deleted." });
    } catch (err) {
      console.error("[SubStageController.deleteDocumentRequest] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/documents/transmittals
   */
  async createTransmittal(req, res) {
    try {
      const adminUserId = req.user?.userId || req.user?.user_id;
      const { projectId, title, category, fileUrl, fileName, fileSizeBytes, mimeType, remarks } = req.body || {};
      if (!projectId || !title || !fileUrl || !fileName) {
        return res.status(400).json({ success: false, message: "projectId, title, fileUrl, and fileName are required." });
      }

      const transmittal = await stageEngineService.createProjectTransmittal({
        projectId: parseInt(projectId, 10),
        title,
        category: category || "MCPA Transmittal",
        fileUrl,
        fileName,
        fileSizeBytes: fileSizeBytes || 0,
        mimeType: mimeType || "application/pdf",
        remarks,
        transmittedBy: adminUserId,
      });
      return res.status(201).json({ success: true, transmittal });
    } catch (err) {
      console.error("[SubStageController.createTransmittal] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/admin/documents/transmittals/:id
   */
  async deleteTransmittal(req, res) {
    try {
      const transmittalId = parseInt(req.params.id, 10);
      await stageEngineService.deleteProjectTransmittal(transmittalId);
      return res.status(200).json({ success: true, message: "Transmittal deleted." });
    } catch (err) {
      console.error("[SubStageController.deleteTransmittal] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/document-requests (Client Portal)
   */
  async getProjectDocumentRequests(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const requests = await stageEngineService.getProjectDocumentRequests(projectId);
      return res.status(200).json({ success: true, requests });
    } catch (err) {
      console.error("[SubStageController.getProjectDocumentRequests] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/transmittals (Client Portal)
   */
  async getProjectTransmittals(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const transmittals = await stageEngineService.getProjectTransmittals(projectId);
      return res.status(200).json({ success: true, transmittals });
    } catch (err) {
      console.error("[SubStageController.getProjectTransmittals] Error:", err);
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
   * POST /api/projects/:id/blueprints
   */
  async createBlueprint(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const { discipline, sheet_number, title, revision_no, file_url, thumbnail_url, media_type, notes } = req.body || {};
      if (!discipline || !title || !file_url) {
        return res.status(400).json({ success: false, message: "Discipline, sheet title, and file URL are required." });
      }
      const blueprint = await stageEngineService.createBlueprint(projectId, {
        discipline,
        sheet_number,
        title,
        revision_no: revision_no || "Rev 0",
        file_url,
        thumbnail_url: thumbnail_url || null,
        media_type: media_type || "image",
        notes: notes || null,
      });
      return res.status(201).json({ success: true, blueprint });
    } catch (err) {
      console.error("[SubStageController.createBlueprint] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/projects/:id/blueprints/:blueprintId
   */
  async updateBlueprint(req, res) {
    try {
      const blueprintId = parseInt(req.params.blueprintId, 10);
      const updated = await stageEngineService.updateBlueprint(blueprintId, req.body || {});
      return res.status(200).json({ success: true, blueprint: updated });
    } catch (err) {
      console.error("[SubStageController.updateBlueprint] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/projects/:id/blueprints/:blueprintId
   */
  async deleteBlueprint(req, res) {
    try {
      const blueprintId = parseInt(req.params.blueprintId, 10);
      await stageEngineService.deleteBlueprint(blueprintId);
      return res.status(200).json({ success: true, message: "Blueprint deleted successfully." });
    } catch (err) {
      console.error("[SubStageController.deleteBlueprint] Error:", err);
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
   * GET /api/admin/blueprints/overview
   */
  async getAdminBlueprintsOverview(req, res) {
    try {
      const overview = await stageEngineService.getAdminBlueprintsOverview();
      return res.status(200).json({ success: true, clients: overview });
    } catch (err) {
      console.error("[SubStageController.getAdminBlueprintsOverview] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/admin/blueprints/:blueprintId/pins/:pinId
   */
  async updateBlueprintPinStatus(req, res) {
    try {
      const blueprintId = parseInt(req.params.blueprintId, 10);
      const pinId = req.params.pinId;
      const { status = "Resolved", resolutionNote = null } = req.body || {};
      const updated = await stageEngineService.updateBlueprintPinStatus(blueprintId, pinId, status, resolutionNote);
      return res.status(200).json({ success: true, blueprint: updated });
    } catch (err) {
      console.error("[SubStageController.updateBlueprintPinStatus] Error:", err);
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
   * GET /api/admin/permits/overview
   */
  async getAdminPermitsOverview(req, res) {
    try {
      const permits = await stageEngineService.getAdminPermitsOverview();
      return res.status(200).json({ success: true, permits });
    } catch (err) {
      console.error("[SubStageController.getAdminPermitsOverview] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/permits/apply-template
   */
  async applyPermitsTemplate(req, res) {
    try {
      const { projectId, permitTypes } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, message: "Project ID is required" });
      }
      const permits = await stageEngineService.applyPermitsTemplate({
        projectId: parseInt(projectId, 10),
        permitTypes,
      });
      return res.status(200).json({ success: true, permits });
    } catch (err) {
      console.error("[SubStageController.applyPermitsTemplate] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/permits
   */
  async createPermit(req, res) {
    try {
      const {
        projectId,
        permitType,
        lguAgency,
        status,
        filingDate,
        targetReleaseDate,
        actualReleaseDate,
        remarks,
      } = req.body;
      if (!projectId || !permitType) {
        return res.status(400).json({
          success: false,
          message: "Project ID and Permit Type are required",
        });
      }
      const permit = await stageEngineService.createPermitRecord({
        projectId: parseInt(projectId, 10),
        permitType,
        lguAgency,
        status,
        filingDate,
        targetReleaseDate,
        actualReleaseDate,
        remarks,
      });
      return res.status(201).json({ success: true, permit });
    } catch (err) {
      console.error("[SubStageController.createPermit] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/admin/permits/:permitId
   */
  async deletePermit(req, res) {
    try {
      const permitId = parseInt(req.params.permitId, 10);
      const success = await stageEngineService.deletePermitRecord(permitId);
      return res.status(200).json({ success });
    } catch (err) {
      console.error("[SubStageController.deletePermit] Error:", err);
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
   * GET /api/admin/groundbreaking/overview
   */
  async getAdminGroundbreakingOverview(req, res) {
    try {
      const overview = await stageEngineService.getAdminGroundbreakingOverview();
      return res.status(200).json({ success: true, projects: overview });
    } catch (err) {
      console.error("[SubStageController.getAdminGroundbreakingOverview] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/groundbreaking
   */
  async getGroundbreaking(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const ceremony = await stageEngineService.getProjectGroundbreaking(projectId);
      if (!ceremony) {
        return res.status(404).json({ success: false, message: "Project ceremony not found." });
      }
      return res.status(200).json({ success: true, ceremony });
    } catch (err) {
      console.error("[SubStageController.getGroundbreaking] Error:", err);
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
      const {
        groundbreakingDate,
        venue,
        officiant,
        notes,
        status,
        rescheduleReason,
      } = req.body || {};

      if (!groundbreakingDate) {
        return res.status(400).json({ success: false, message: "groundbreakingDate is required." });
      }

      const updated = await stageEngineService.scheduleGroundbreaking({
        projectId,
        groundbreakingDate,
        venue,
        officiant,
        notes,
        status,
        rescheduleReason,
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
      const {
        projectId = null,
        signerRole = "CLIENT",
        signerName,
        signerEmail,
        signatureImageUrl,
        signatureData,
      } = req.body || {};

      const finalSignature = signatureImageUrl || signatureData;
      const finalSignerName =
        signerName ||
        req.user?.fullName ||
        req.user?.full_name ||
        req.user?.name ||
        (signerRole === "CONTRACTOR" ? "Engr. Raymart Quirante" : "Client");
      const finalSignerEmail =
        signerEmail ||
        req.user?.email ||
        (signerRole === "CONTRACTOR" ? "legal@mcpabuilders.com" : "client@mcpa.com");

      if (!finalSignature || !finalSignerName) {
        return res.status(400).json({ success: false, message: "Signature image and signer name are required." });
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
      const userAgent = req.headers["user-agent"] || null;

      const signature = await stageEngineService.signProjectContract({
        contractId,
        projectId,
        userId,
        signerRole,
        signerName: finalSignerName,
        signerEmail: finalSignerEmail,
        signatureImageUrl: finalSignature,
        ipAddress: clientIp,
        userAgent,
      });

      const updatedContract = projectId
        ? await stageEngineService.getProjectContract(parseInt(projectId, 10))
        : null;

      return res.status(201).json({
        success: true,
        message: "Digital contract successfully signed with cryptographic hash verification.",
        signature,
        contract: updatedContract,
      });
    } catch (err) {
      console.error("[SubStageController.signContract] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/projects/:id/contract/pdf
   * GET /api/contracts/:id/pdf
   * Pure server-side vector PDF generation using PDFKit matching legal Word-style layout
   */
  async downloadContractPdf(req, res) {
    try {
      const rawParam = req.params.id;
      const isNumeric = !isNaN(Number(rawParam));
      let projectId = isNumeric ? parseInt(rawParam, 10) : null;

      // 1. Resolve projectId whether param was a contract_id, numeric project_id, or project_code
      if (isNumeric) {
        const directContract = await db.query(
          `SELECT client_project_id FROM public.contracts WHERE contract_id = $1 LIMIT 1`,
          [projectId]
        );
        if (directContract.rows && directContract.rows.length > 0) {
          projectId = directContract.rows[0].client_project_id;
        }
      } else {
        const pRes = await db.query(
          `SELECT client_project_id FROM public.client_projects WHERE project_code = $1 LIMIT 1`,
          [rawParam]
        );
        if (pRes.rows && pRes.rows.length > 0) {
          projectId = pRes.rows[0].client_project_id;
        }
      }

      if (!projectId) {
        return res.status(404).json({ success: false, message: "Project or contract not found." });
      }

      // 2. Fetch enriched contract via stageEngineService
      const contract = await stageEngineService.getProjectContract(projectId);

      if (!contract) {
        return res.status(404).json({ success: false, message: "Contract record not found for this project." });
      }

      // 3. Fetch latest quotation for boqRef & locked amount
      let quotation = null;
      try {
        const quoRes = await db.query(
          `SELECT quotation_code, total_amount FROM public.client_quotations 
           WHERE client_project_id = $1 
           ORDER BY quotation_id DESC LIMIT 1`,
          [projectId]
        );
        if (quoRes.rows && quoRes.rows.length > 0) {
          quotation = quoRes.rows[0];
        }
      } catch (_) {}

      // 4. Fetch latest blueprint for blueprintRef
      let blueprint = null;
      try {
        const bpRes = await db.query(
          `SELECT title, version FROM public.blueprints 
           WHERE client_project_id = $1 
           ORDER BY blueprint_id ASC LIMIT 1`,
          [projectId]
        );
        if (bpRes.rows && bpRes.rows.length > 0) {
          blueprint = bpRes.rows[0];
        }
      } catch (_) {}

      const options = {
        projectCode: contract.project_meta?.project_code || rawParam,
        clientName: contract.project_meta?.client_name,
        clientAddress: contract.project_meta?.location,
        clientPhone: contract.project_meta?.client_phone,
        clientEmail: contract.project_meta?.client_email,
        projectTitle: contract.project_meta?.project_title || contract.project_meta?.project_type,
        siteLocation: contract.project_meta?.location,
        lotArea: contract.project_meta?.lot_area,
        floorArea: contract.project_meta?.floor_area,
        blueprintRef: blueprint ? `${blueprint.title} (v${blueprint.version || "1.0"})` : undefined,
        boqRef: quotation?.quotation_code || "BOQ-MCPA-2026-FINAL",
        totalBOQAmount: quotation?.total_amount || contract.total_contract_amount,
      };

      const { buffer, filename } = await generateContractPdf(contract, options);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      return res.end(buffer);
    } catch (err) {
      console.error("[SubStageController.downloadContractPdf] Error:", err);
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
   * GET /api/projects/:id/wrapped (owner or staff)
   */
  async getWrapped(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      await finishedProjectService.assertProjectAccess(projectId, req.user);
      const wrapped = await stageEngineService.getProjectWrapped(projectId);
      return res.status(200).json({ success: true, wrapped });
    } catch (err) {
      console.error("[SubStageController.getWrapped] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/projects/:id/wrapped/regenerate
   */
  async regenerateWrapped(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      await finishedProjectService.assertProjectAccess(projectId, req.user);
      const wrapped = await stageEngineService.getProjectWrapped(projectId, { forceRefresh: true });
      return res.status(200).json({ success: true, wrapped });
    } catch (err) {
      console.error("[SubStageController.regenerateWrapped] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/projects/:id/wrapped/onboarding-seen
   */
  async markWrappedOnboardingSeen(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      await finishedProjectService.assertProjectAccess(projectId, req.user);
      const wrapped = await finishedProjectService.markOnboardingSeen(projectId);
      return res.status(200).json({ success: true, onboardingCompletedAt: wrapped?.onboarding_completed_at || null });
    } catch (err) {
      console.error("[SubStageController.markWrappedOnboardingSeen] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/projects/:id/wrapped/share-settings
   */
  async updateWrappedShareSettings(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      await finishedProjectService.assertProjectAccess(projectId, req.user);
      const isPublicShared = typeof req.body?.isPublicShared === "boolean" ? req.body.isPublicShared : undefined;
      const wrapped = await finishedProjectService.updateShareSettings(projectId, {
        isPublicShared,
        rotateToken: Boolean(req.body?.rotateToken),
      });
      if (!wrapped) return res.status(400).json({ success: false, message: "Nothing to update." });
      return res.status(200).json({ success: true, shareToken: wrapped.share_token, isPublicShared: Boolean(wrapped.is_public_shared) });
    } catch (err) {
      console.error("[SubStageController.updateWrappedShareSettings] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/wrapped/:shareToken (Public Read-Only, redacted)
   */
  async getPublicWrapped(req, res) {
    try {
      const { shareToken } = req.params;
      const wrapped = await stageEngineService.getPublicWrappedByToken(shareToken);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ success: true, wrapped });
    } catch (err) {
      console.error("[SubStageController.getPublicWrapped] Error:", err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/finished-projects (admin: all completed, client: own)
   */
  async getFinishedProjects(req, res) {
    try {
      const projects = await finishedProjectService.getFinishedProjectsDossier({
        role: req.user?.role,
        userId: req.user?.userId,
        email: req.user?.email,
      });
      return res.status(200).json({ success: true, projects });
    } catch (err) {
      console.error("[SubStageController.getFinishedProjects] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/finished-projects/:id/sync-showcase
   */
  async syncFinishedProjectShowcase(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const result = await finishedProjectService.syncFinishedProjectToShowcase(projectId, { forceResync: true });
      if (!result.synced) return res.status(404).json({ success: false, message: result.reason });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error("[SubStageController.syncFinishedProjectShowcase] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SubStageController();
