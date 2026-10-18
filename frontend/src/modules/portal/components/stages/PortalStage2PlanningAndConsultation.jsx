"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Calendar,
  CalendarCheck,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileUp,
  ExternalLink,
  MessageSquare,
  Layers,
  Sparkles,
  FolderKanban,
  ArrowRight,
  X,
  XCircle,
  Zap,
  FileCheck,
  Building,
  Check,
  Plus,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  MapPin,
  Compass,
  CreditCard,
  PenTool,
  RotateCcw,
  Download,
  User,
  Shield,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Upload,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";
import PortalMeetingHub from "../PortalMeetingHub";
import DocumentUploadModal from "@/modules/shared/DocumentUploadModal";
import LordIcon from "@/modules/shared/LordIcon";
import {
  STANDARD_REQUEST_DOCUMENTS,
  loadDocumentRequests,
  saveDocumentRequests,
  loadAdminTransmittals,
  formatFileSize,
  formatDocDate,
} from "@/modules/portal/utils/documentRequestsHelper";
import { extractRoomCode, buildMeetingUrl } from "@/modules/portal/utils/roomCodeHelper";

/**
 * Stage 2: Consultation & Pre-Construction Planning
 * 
 * Unified experience merging Consultation, Blueprints with Pin-Drop Feedback,
 * Itemized BOQ Quotation, Municipal Permits, E-Contract, and Ground Breaking Scheduler.
 */
export default function PortalStage2PlanningAndConsultation({
  activeProject,
  currentUser,
  showToast,
  onRefreshState,
  onSelectTab,
  inquiries = [],
  billingLedger = [],
  mode = "overview",
}) {
  // Primary active inquiry for this project (declared first to avoid TDZ ReferenceError)
  const activeInquiry = useMemo(() => {
    if (inquiries.length > 0) return inquiries[0];
    return null;
  }, [inquiries]);

  const projectId = activeProject?.client_project_id || activeProject?.id || activeInquiry?.client_project_id || activeInquiry?.id;
  const projectCode = activeProject?.site_project_code || activeProject?.project_code || activeInquiry?.projectCode || activeInquiry?.submissionId || activeInquiry?.submission_id || "MCPA-PRJ-2026";

  // Sub-tab state: "overview" | "meeting" | "blueprints" | "boq" | "permits" | "contract"
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (mode === "meeting") return "meeting";
    if (mode === "documents") return "permits";
    if (mode === "blueprints") return "blueprints";
    if (mode === "permits") return "permits";
    if (mode === "boq") return "boq";
    if (mode === "contract") return "contract";
    return "overview";
  });

  useEffect(() => {
    if (mode === "meeting") setActiveSubTab("meeting");
    else if (mode === "documents" || mode === "permits") setActiveSubTab("permits");
    else if (mode === "blueprints") setActiveSubTab("blueprints");
    else if (mode === "boq") setActiveSubTab("boq");
    else if (mode === "contract") setActiveSubTab("contract");
  }, [mode]);

  // -------------------------------------------------------------
  // 1. WebRTC & Meeting State
  // -------------------------------------------------------------
  const [meetingRoom, setMeetingRoom] = useState(null);
  const [messages, setMessages] = useState([]);

  // -------------------------------------------------------------
  // 1.1 Quotation & BOQ State
  // -------------------------------------------------------------
  const [quotationData, setQuotationData] = useState(null);
  const [briefData, setBriefData] = useState(null);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [isRequestingQuotation, setIsRequestingQuotation] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationRequestNotes, setQuotationRequestNotes] = useState("");

  const fetchQuotation = async () => {
    if (!projectId) return;
    setIsLoadingQuotation(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/quotation`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuotationData(data.quotation || null);
          if (data.brief) setBriefData(data.brief);
        }
      }
    } catch (e) {
      console.warn("fetchQuotation error:", e);
    } finally {
      setIsLoadingQuotation(false);
    }
  };

  useEffect(() => {
    fetchQuotation();

    const handleSync = () => {
      fetchQuotation();
    };
    window.addEventListener("mcpa-quotations-updated", handleSync);
    return () => {
      window.removeEventListener("mcpa-quotations-updated", handleSync);
    };
  }, [projectId]);

  const handleRequestQuotation = async () => {
    if (!projectId) return;
    setIsRequestingQuotation(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/quotation/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customNotes: quotationRequestNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotationData(data.quotation);
        setIsQuotationModalOpen(false);
        setQuotationRequestNotes("");
        showToast?.("Quotation request submitted to MCPA estimating office.", "success");
        window.dispatchEvent(new CustomEvent("mcpa-quotations-updated"));
      } else {
        showToast?.(data.message || "Failed to submit request.", "error");
      }
    } catch (e) {
      showToast?.("Network connection issue while submitting request.", "error");
    } finally {
      setIsRequestingQuotation(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Document Requests & Permits State
  // -------------------------------------------------------------
  const [documents, setDocuments] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [adminTransmittals, setAdminTransmittals] = useState([]);
  const [activeUploadRequest, setActiveUploadRequest] = useState(null);
  const [isExtraUploadModalOpen, setIsExtraUploadModalOpen] = useState(false);

  // Fetch documents, requests, transmittals, and permits from backend
  const fetchProjectDocuments = async () => {
    if (!projectId) return;
    try {
      const [reqsRes, txsRes, docsRes, permitsRes] = await Promise.allSettled([
        authFetch(`/api/projects/${projectId}/document-requests`),
        authFetch(`/api/projects/${projectId}/transmittals`),
        authFetch(`/api/projects/${projectId}/documents`),
        authFetch(`/api/projects/${projectId}/permits`),
      ]);

      if (reqsRes.status === "fulfilled" && reqsRes.value.ok) {
        const d = await reqsRes.value.json();
        if (Array.isArray(d.requests)) {
          setDocumentRequests(d.requests);
        }
      }

      if (txsRes.status === "fulfilled" && txsRes.value.ok) {
        const d = await txsRes.value.json();
        if (Array.isArray(d.transmittals)) {
          setAdminTransmittals(d.transmittals);
        }
      }

      if (docsRes.status === "fulfilled" && docsRes.value.ok) {
        const d = await docsRes.value.json();
        if (Array.isArray(d.documents)) {
          setDocuments(d.documents);
        }
      }

      if (permitsRes.status === "fulfilled" && permitsRes.value.ok) {
        const d = await permitsRes.value.json();
        if (Array.isArray(d.permits)) {
          setPermits(d.permits);
        }
      }
    } catch (e) {
      console.warn("fetchProjectDocuments error:", e);
    }
  };

  // Sync Document Requests & Transmittals from localStorage/admin & backend
  useEffect(() => {
    const localReqs = loadDocumentRequests();
    const localTxs = loadAdminTransmittals();
    if (localReqs?.length > 0) setDocumentRequests(localReqs);
    if (localTxs?.length > 0) setAdminTransmittals(localTxs);

    fetchProjectDocuments();

    const handleSync = () => {
      fetchProjectDocuments();
    };

    window.addEventListener("mcpa-document-requests-updated", handleSync);
    window.addEventListener("mcpa-admin-transmittals-updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("mcpa-document-requests-updated", handleSync);
      window.removeEventListener("mcpa-admin-transmittals-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [projectId]);

  const clientRequests = useMemo(() => {
    const email = (currentUser?.email || "").toLowerCase().trim();
    const trackingId = (activeInquiry?.trackingId || activeInquiry?.id || projectCode || "").trim();
    
    // First check if any document requests match this project or email
    const matched = documentRequests.filter(
      (r) =>
        (r.client_project_id && projectId && String(r.client_project_id) === String(projectId)) ||
        (email && r.clientEmail && r.clientEmail.toLowerCase() === email) ||
        (trackingId && (r.projectCode === trackingId || r.project_code === trackingId))
    );

    if (matched.length > 0) return matched;

    // Fallback: standard 4 required documents so client can upload right away
    return STANDARD_REQUEST_DOCUMENTS.slice(0, 4).map((doc) => {
      const uploadedDoc = documents.find(
        (d) =>
          d.doc_type?.toLowerCase().includes(doc.id) ||
          d.notes?.toLowerCase().includes(doc.title.toLowerCase())
      );
      return {
        id: `std-${doc.id}`,
        title: doc.title,
        category: doc.category,
        urgency: doc.urgency,
        defaultNote: doc.defaultNote,
        note: doc.defaultNote,
        status: uploadedDoc ? (uploadedDoc.verification_status === "Verified" ? "verified" : "uploaded") : "pending",
        file: uploadedDoc ? {
          fileName: uploadedDoc.file_name,
          fileUrl: uploadedDoc.file_url,
          fileSize: uploadedDoc.file_size_bytes,
        } : null,
      };
    });
  }, [documentRequests, documents, currentUser, activeInquiry, projectCode, projectId]);

  const handleRequestUploadSuccess = async (uploadedFile) => {
    if (!activeUploadRequest) return;

    const reqId = activeUploadRequest.requestId || activeUploadRequest.id || activeUploadRequest.request_id;

    if (projectId) {
      try {
        await authFetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stageId: "CONSULTATION",
            docType: activeUploadRequest.category || "REQUIRED_DOCUMENT",
            fileName: uploadedFile.fileName,
            fileUrl: uploadedFile.fileUrl,
            fileSizeBytes: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType,
            notes: `Uploaded for: ${activeUploadRequest.title}`,
            requestId: typeof reqId === "number" || (!isNaN(Number(reqId)) && !String(reqId).startsWith("std-")) ? Number(reqId) : null,
          }),
        });
      } catch (err) {
        console.warn("Backend document save:", err);
      }
    }

    const updated = documentRequests.map((r) => {
      const match = (r.requestId && r.requestId === reqId) || (r.id === reqId) || (r.title === activeUploadRequest.title);
      if (match) {
        return {
          ...r,
          status: "uploaded",
          file_url: uploadedFile.fileUrl,
          file_name: uploadedFile.fileName,
          file: uploadedFile,
        };
      }
      return r;
    });

    setDocumentRequests(updated);
    saveDocumentRequests(updated);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mcpa-document-requests-updated", { detail: { requests: updated } }));
    }

    setActiveUploadRequest(null);
    showToast?.(`Successfully uploaded "${activeUploadRequest.title}"!`);
    fetchProjectDocuments();
  };

  // -------------------------------------------------------------
  // 4. Interactive Blueprints & Pin-Drop State
  // -------------------------------------------------------------
  const [allBlueprints, setAllBlueprints] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("ALL");
  const [blueprints, setBlueprints] = useState([]);
  const [currentBlueprint, setCurrentBlueprint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pins, setPins] = useState([]);
  const [activePin, setActivePin] = useState(null);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const canvasContainerRef = useRef(null);
  const imgRef = useRef(null);

  const parsePinsSafe = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  // Compute all available disciplines dynamically (including any custom disciplines from Admin)
  const availableDisciplines = useMemo(() => {
    const list = [
      { id: "ALL", label: "All Plan Disciplines" },
      { id: "ARCHITECTURAL", label: "Architectural" },
      { id: "STRUCTURAL", label: "Structural" },
      { id: "ELECTRICAL", label: "Electrical" },
      { id: "PLUMBING", label: "Plumbing" },
      { id: "3D_ELEVATION", label: "3D Elevation" },
      { id: "3D_WALKTHROUGH", label: "3D Walkthrough Video" },
    ];
    const existing = new Set(list.map((d) => d.id));
    (allBlueprints || []).forEach((b) => {
      if (b.discipline && !existing.has(b.discipline)) {
        existing.add(b.discipline);
        list.push({
          id: b.discipline,
          label: b.discipline.replace(/_/g, " "),
        });
      }
    });
    return list;
  }, [allBlueprints]);

  // -------------------------------------------------------------
  // 5. Municipal Permits Tracker State
  // -------------------------------------------------------------
  const [permits, setPermits] = useState([]);

  // -------------------------------------------------------------
  // 6. Contract & E-Signature State
  // -------------------------------------------------------------
  const [contract, setContract] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);
  const sigCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // -------------------------------------------------------------
  // 7. Groundbreaking Ceremony Official State (Admin Authoritative Schedule)
  // -------------------------------------------------------------
  const [groundbreakingDetails, setGroundbreakingDetails] = useState({
    groundbreaking_date: activeProject?.groundbreaking_date || null,
    groundbreaking_status: activeProject?.groundbreaking_status || "PENDING",
    groundbreaking_venue: activeProject?.groundbreaking_venue || activeProject?.target_location || "",
    groundbreaking_officiant: activeProject?.groundbreaking_officiant || "Bulacan Parish Priest & MCPA Site Team",
    groundbreaking_notes: activeProject?.groundbreaking_notes || "",
    groundbreaking_rescheduled_count: activeProject?.groundbreaking_rescheduled_count || 0,
    history: [],
  });

  const fetchGroundbreakingData = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await authFetch(`/api/projects/${projectId}/groundbreaking`);
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.ceremony) {
          setGroundbreakingDetails(d.ceremony);
        }
      }
    } catch (e) {
      console.warn("Groundbreaking fetch error:", e);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGroundbreakingData();
    const handleSync = () => fetchGroundbreakingData();
    window.addEventListener("mcpa-groundbreaking-updated", handleSync);
    return () => window.removeEventListener("mcpa-groundbreaking-updated", handleSync);
  }, [fetchGroundbreakingData]);

  const activeGroundbreakingDate = groundbreakingDetails?.groundbreaking_date || activeProject?.groundbreaking_date || "";

  // Real-time authoritative countdown to Ground Breaking Ceremony
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const hasTriggeredGroundbreakingAutoAdvance = useRef(false);

  useEffect(() => {
    if (!activeGroundbreakingDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const calculateTimeLeft = () => {
      const diff = new Date(activeGroundbreakingDate).getTime() - new Date().getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!hasTriggeredGroundbreakingAutoAdvance.current) {
          hasTriggeredGroundbreakingAutoAdvance.current = true;
          if (typeof onRefreshState === "function") {
            onRefreshState();
          }
        }
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeGroundbreakingDate, onRefreshState]);

  // Load initial backend planning and consultation data
  useEffect(() => {
    if (!projectId) return;

    // Load meeting room
    authFetch(`/api/projects/${projectId}/meeting`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.meeting) setMeetingRoom(d.meeting);
      })
      .catch((e) => console.warn("Meeting fetch error:", e));

    // Load messages
    authFetch(`/api/projects/${projectId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.messages)) setMessages(d.messages);
      })
      .catch((e) => console.warn("Messages fetch error:", e));

    // Load documents
    authFetch(`/api/projects/${projectId}/documents`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.documents)) setDocuments(d.documents);
      })
      .catch((e) => console.warn("Documents fetch error:", e));

    // Load all blueprints for this project
    authFetch(`/api/projects/${projectId}/blueprints`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.blueprints)) {
          setAllBlueprints(d.blueprints);
        } else {
          setAllBlueprints([]);
        }
      })
      .catch((e) => {
        console.warn("Blueprints fetch error:", e);
        setAllBlueprints([]);
      });

    // Load contract
    authFetch(`/api/projects/${projectId}/contract`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.contract) setContract(d.contract);
      })
      .catch((e) => console.warn("Contract fetch error:", e));
  }, [projectId]);

  // Synchronize filtered blueprints when discipline or allBlueprints changes
  useEffect(() => {
    const filtered =
      selectedDiscipline === "ALL"
        ? allBlueprints
        : allBlueprints.filter((b) => b.discipline === selectedDiscipline);

    setBlueprints(filtered);
    if (filtered.length > 0) {
      const stillThere = filtered.find((b) => b.blueprint_id === currentBlueprint?.blueprint_id);
      const chosen = stillThere || filtered[0];
      setCurrentBlueprint(chosen);
      setPins(parsePinsSafe(chosen.pins));
    } else {
      setCurrentBlueprint(null);
      setPins([]);
    }
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [allBlueprints, selectedDiscipline]);

  // Handle Fullscreen state change
  useEffect(() => {
    const handleFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  // Pan & Drag handlers with window-level listeners for silky smooth drag
  const handleMouseDown = (e) => {
    if (isAddingPin) return;
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  useEffect(() => {
    if (!isPanning) return;
    const onWindowMove = (e) => {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };
    const onWindowUp = () => {
      setIsPanning(false);
    };
    window.addEventListener("mousemove", onWindowMove);
    window.addEventListener("mouseup", onWindowUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
    };
  }, [isPanning, panStart]);

  const handleWheel = (e) => {
    if (!currentBlueprint || currentBlueprint.media_type === "video") return;
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel((z) => Math.min(3.5, Math.max(0.5, Number((z + delta).toFixed(2)))));
  };

  const resetCanvasView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      if (canvasContainerRef.current.requestFullscreen) {
        canvasContainerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Blueprint Canvas Pin click handler
  const handleCanvasClick = async (e) => {
    if (!isAddingPin) return;
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      return;
    }
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const note = prompt("Enter architectural revision note or clarification for this coordinate:");
    if (!note || !note.trim()) {
      setIsAddingPin(false);
      return;
    }

    const newPin = {
      id: `pin-${Date.now()}`,
      x,
      y,
      note: note.trim(),
      author: currentUser?.fullName || "Client",
      timestamp: new Date().toISOString(),
      status: "In Review",
    };

    const updatedPins = [...pins, newPin];
    setPins(updatedPins);
    setIsAddingPin(false);
    showToast?.(`Pin dropped at ${x}%, ${y}%! Architect notified.`);

    if (projectId && currentBlueprint?.blueprint_id) {
      try {
        await authFetch(`/api/projects/${projectId}/blueprints/${currentBlueprint.blueprint_id}/pins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pins: updatedPins }),
        });
        // Update allBlueprints locally so pins persist across discipline/sheet changes
        setAllBlueprints((prev) =>
          prev.map((b) =>
            b.blueprint_id === currentBlueprint.blueprint_id
              ? { ...b, pins: updatedPins }
              : b
          )
        );
      } catch (err) {
        console.error("Save pin error:", err);
      }
    }
  };

  // Canvas drawing handlers for signature
  const startDrawing = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSig(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  const handleSubmitSignature = async () => {
    if (!hasDrawnSig) return;
    setIsSigning(true);
    try {
      const canvas = sigCanvasRef.current;
      const signatureImageUrl = canvas ? canvas.toDataURL("image/png") : "data:image/png;base64,SIGNED";
      const targetContractId = contract?.contract_id && !isNaN(Number(contract.contract_id))
        ? contract.contract_id
        : (projectId || 0);

      const res = await authFetch(`/api/contracts/${targetContractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          signerRole: "CLIENT",
          signerName: currentUser?.fullName || currentUser?.full_name || "Client",
          signerEmail: currentUser?.email || activeInquiry?.clientEmail || activeInquiry?.client_email || "client@mcpa.com",
          signatureImageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSignModalOpen(false);
        if (data.contract) {
          setContract(data.contract);
        } else {
          setContract((prev) => ({
            ...(prev || {}),
            contract_id: data.signature?.contract_id || prev?.contract_id || "CTR-2026-EXEC",
            status: "FULLY_EXECUTED",
            signed_date: data.signature?.signed_at || new Date().toISOString(),
            signer_name: currentUser?.fullName || currentUser?.full_name || "Client",
          }));
        }
        showToast?.("Construction Master Agreement executed with SHA-256 digital stamp!");
      } else {
        throw new Error(data.message || "Failed to persist digital signature.");
      }
    } catch (err) {
      showToast?.("Signing error: " + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  // Itemized BOQ Data from Project / Backend
  const boqData = useMemo(() => {
    const raw = (quotationData?.items_breakdown && Array.isArray(quotationData.items_breakdown))
      ? quotationData.items_breakdown
      : (activeProject?.boq_items && Array.isArray(activeProject.boq_items))
      ? activeProject.boq_items
      : [];
    return raw.filter((cat) => Array.isArray(cat.items) && cat.items.length > 0 && cat.items.some((it) => it.item && String(it.item).trim()));
  }, [quotationData, activeProject]);

  const totalBOQAmount = useMemo(() => {
    if (quotationData?.total_amount) {
      return Number(quotationData.total_amount) || 0;
    }
    return boqData.reduce((acc, cat) => {
      const items = cat.items || [];
      return acc + items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    }, 0);
  }, [quotationData, boqData]);

  // Client target budget from inquiry baseline
  const clientTargetBudget = useMemo(() => {
    if (quotationData?.client_target_budget) {
      return Number(quotationData.client_target_budget) || 0;
    }
    const rawBudget = briefData?.budget_range || activeInquiry?.budgetRange || activeInquiry?.budget_range || 0;
    if (typeof rawBudget === "number") return rawBudget;
    if (typeof rawBudget === "string") {
      const match = rawBudget.replace(/,/g, "").match(/\d+(\.\d+)?/g);
      if (match && match.length > 0) {
        const val = parseFloat(match[0]);
        if (rawBudget.toLowerCase().includes("m")) {
          return val < 100 ? val * 1000000 : val;
        } else if (rawBudget.toLowerCase().includes("k")) {
          return val * 1000;
        }
        return val;
      }
    }
    return 0;
  }, [quotationData, briefData, activeInquiry]);

  const budgetVariance = useMemo(() => {
    if (!clientTargetBudget || !totalBOQAmount) {
      return { diff: 0, pct: 0, status: "neutral" };
    }
    const diff = totalBOQAmount - clientTargetBudget;
    const pct = (diff / clientTargetBudget) * 100;
    return {
      diff,
      pct,
      status: diff > 0 ? "over" : diff < 0 ? "under" : "exact",
    };
  }, [clientTargetBudget, totalBOQAmount]);

  const formatPHP = (val) =>
    "₱" + Number(val || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 });

  // Dynamic Stage 2 Stepper Statuses
  const step1ConsultationStatus = useMemo(() => {
    const hasConcludedMeeting =
      meetingHistory.length > 0 ||
      (activeMeetingInfo?.status || "").toLowerCase().includes("conclud") ||
      allBlueprints.length > 0 ||
      quotationData?.status === "APPROVED";
    if (hasConcludedMeeting) return "Completed";
    if (activeMeetingInfo) return "In Progress";
    return "Pending";
  }, [meetingHistory, activeMeetingInfo, allBlueprints, quotationData]);

  const step2BlueprintsStatus = useMemo(() => {
    if (quotationData?.status === "APPROVED" && allBlueprints.length > 0) return "Completed";
    if (allBlueprints.length > 0 || quotationData) return "In Progress";
    return "Upcoming";
  }, [allBlueprints, quotationData]);

  const step3PermitsStatus = useMemo(() => {
    const allPermitsDone =
      permits.length > 0 &&
      permits.every((p) => p.status === "APPROVED" || p.status === "RELEASED");
    const allReqsVerified =
      clientRequests.length > 0 &&
      clientRequests.every((r) => r.status === "verified");
    if (allPermitsDone || (allReqsVerified && contract?.status === "FULLY_EXECUTED")) return "Completed";
    if (
      permits.length > 0 ||
      documents.length > 0 ||
      clientRequests.some((r) => r.status === "uploaded" || r.status === "verified")
    ) {
      return "In Progress";
    }
    return "Upcoming";
  }, [permits, documents, clientRequests, contract]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. STAGE 2 UNIFIED HERO HEADER (SHOWN ONLY ON DASHBOARD)       */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "overview" && (
        <div className="p-6 sm:p-8 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-white/5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-mono uppercase tracking-tight">
                Consultation &amp; Pre-Construction Planning
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl font-sans">
                Collaborate directly with Lead Engineer Raymart Quirante: review architectural blueprints, drop pin-point revisions, track municipal permits, and execute binding construction contracts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectTab ? onSelectTab("meeting") : setActiveSubTab("meeting")}
                className="px-4 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Video className="w-4 h-4 stroke-[2.5]" />
                <span>Consultation</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab ? onSelectTab("blueprints") : setActiveSubTab("blueprints")}
                className="px-4 py-2.5 rounded-[10px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Blueprints Viewer</span>
              </button>
            </div>
          </div>

          {/* 3-Step Milestone Stepper for Stage 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
            <div
              onClick={() => onSelectTab ? onSelectTab("meeting") : setActiveSubTab("meeting")}
              className="p-3.5 rounded-[12px] border text-left cursor-pointer transition-all bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                  Video Consultation &amp; Scoping
                </p>
                {step1ConsultationStatus === "Completed" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : step1ConsultationStatus === "In Progress" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-500 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-500 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                Initial brief review, preliminary estimate, and lot orientation.
              </p>
            </div>

            <div
              onClick={() => onSelectTab ? onSelectTab("blueprints") : setActiveSubTab("blueprints")}
              className="p-3.5 rounded-[12px] border text-left cursor-pointer transition-all bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                  Blueprints &amp; Pin Feedback
                </p>
                {step2BlueprintsStatus === "Completed" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : step2BlueprintsStatus === "In Progress" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-500 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span>Upcoming</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                2D/3D floor plans, pin-drop revisions, and locked itemized BOQ.
              </p>
            </div>

            <div
              onClick={() => onSelectTab ? onSelectTab("documents") : setActiveSubTab("permits")}
              className="p-3.5 rounded-[12px] border text-left cursor-pointer transition-all bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                  Documents &amp; Permits Vault
                </p>
                {step3PermitsStatus === "Completed" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : step3PermitsStatus === "In Progress" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-500 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span>Upcoming</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                LGU clearances, municipal permits, and official transmittals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: EXECUTIVE OVERVIEW                                 */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Active Project & Brief Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Project Dossier &amp; Brief Specifications
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  REF: {activeInquiry?.submission_id || activeInquiry?.id || activeProject?.project_code || "Pending"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Lot Location</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                    {activeInquiry?.location || activeProject?.location || "Not specified"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Floor Area</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5">
                    {activeInquiry?.lot_area ? (String(activeInquiry.lot_area).includes("sq") ? activeInquiry.lot_area : `${activeInquiry.lot_area} sqm`) : "TBD"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Design Style</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                    {activeInquiry?.design_style || activeInquiry?.preferred_style || "TBD"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Target Budget</span>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {activeInquiry?.budget ? formatPHP(activeInquiry.budget) : (activeInquiry?.budget_range || "Pending quotation")}
                  </p>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="pt-2">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Your project is currently in the active architectural deliberation phase. Blueprints are being synchronized with municipal setback regulations. You can review blueprints, submit coordinate revision pins, or request an itemized BOQ quotation below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("blueprints")}
                  className="px-4 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Blueprints ({pins.length} Pins)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("boq")}
                  className="px-4 py-2 rounded-[8px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>View Itemized BOQ</span>
                </button>
              </div>
            </div>

            {/* Ground Breaking Ceremony Official Card */}
            <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-colors space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/5 pb-2.5 mb-3">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Physical Site Kickoff</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                    Bulacan Tradition
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white">
                      Ground Breaking Ceremony
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Site blessing, priest invocation, and ceremonial golden shovel turning.
                    </p>
                  </div>
                  {activeGroundbreakingDate ? (
                    (groundbreakingDetails?.groundbreaking_status === "RESCHEDULED" || (groundbreakingDetails?.groundbreaking_rescheduled_count || 0) > 0) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                        Rescheduled ({groundbreakingDetails?.groundbreaking_rescheduled_count || 1}x)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        Locked In
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-200/60 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      Pending Schedule
                    </span>
                  )}
                </div>
              </div>

              {activeGroundbreakingDate ? (
                <div className="space-y-4">
                  {/* Scheduled Date Display */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                      Official Ceremony Date &amp; Time
                    </span>
                    <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                      {new Date(activeGroundbreakingDate).toLocaleDateString("en-PH", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      •{" "}
                      {new Date(activeGroundbreakingDate).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Reschedule Advisory Note if moved */}
                  {Boolean(groundbreakingDetails?.groundbreaking_notes || (groundbreakingDetails?.groundbreaking_rescheduled_count || 0) > 0) && (
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/10">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 block mb-0.5">
                        Schedule Update Advisory
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                        {groundbreakingDetails?.groundbreaking_notes || "The date was adjusted by MCPA Project Management to align with municipal permit clearance and weather conditions. Site team is fully mobilized."}
                      </p>
                    </div>
                  )}

                  {/* Live Countdown Grid */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1.5 font-bold">
                      Countdown to Site Blessing
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10">
                        <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 block">{countdown.days}</span>
                        <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">Days</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10">
                        <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white block">{countdown.hours}</span>
                        <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">Hours</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10">
                        <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white block">{countdown.minutes}</span>
                        <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">Mins</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10">
                        <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white block">{countdown.seconds}</span>
                        <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Officiant & Venue meta */}
                  <div className="pt-1 text-[11px] font-mono text-neutral-500 space-y-1">
                    <p className="truncate">
                      <span className="text-neutral-400">Venue: </span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {groundbreakingDetails?.groundbreaking_venue || activeProject?.target_location || "To be confirmed by MCPA"}
                      </span>
                    </p>
                    <p className="truncate">
                      <span className="text-neutral-400">Officiant: </span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {groundbreakingDetails?.groundbreaking_officiant || "To be announced by MCPA"}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="my-2 p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      Coordinating Kickoff Schedule
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                    MCPA Project Management is currently scheduling the ceremony date with the Bulacan parish officiant and heavy equipment mobilization team. Your dashboard will automatically update once the date is locked.
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400">
                    Location: {activeProject?.target_location || "Bulacan Project Site"}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>Tradition: Ceremonial Golden Shovel</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">Bulacan Standard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: CONSULTATION & VIDEO MEETING HUB                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "meeting" && (
        <div className="space-y-6">
          <PortalMeetingHub
            activeProject={activeProject}
            currentUser={currentUser}
            meetingRoom={meetingRoom}
            inquiries={inquiries}
            showToast={showToast}
            onRefreshState={onRefreshState}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: INTERACTIVE BLUEPRINTS & PIN-DROP FEEDBACK         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "blueprints" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Interactive Engineering Blueprint Canvas
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Drop pins directly on the floor plans to communicate revisions with zero ambiguity.
                </p>
              </div>

              {/* Discipline Combobox Selector */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Discipline:</span>
                </label>
                <div className="relative min-w-[210px]">
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => {
                      setSelectedDiscipline(e.target.value);
                      setPanOffset({ x: 0, y: 0 });
                      setZoomLevel(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
                  >
                    {availableDisciplines.map((d) => {
                      const count =
                        d.id === "ALL"
                          ? allBlueprints.length
                          : allBlueprints.filter((b) => b.discipline === d.id).length;
                      return (
                        <option
                          key={d.id}
                          value={d.id}
                          className="bg-white dark:bg-[#12151c] text-neutral-900 dark:text-white font-mono"
                        >
                          {d.label} ({count} {count === 1 ? "sheet" : "sheets"})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Sub-Sheet / Floor Plan Selector (When multiple plans exist under current discipline) */}
            {blueprints.length > 0 && (
              <div className="pt-3 border-t border-neutral-150 dark:border-white/[0.08] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider shrink-0 font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Available Plan Sheets ({blueprints.length}):
                </span>
                {blueprints.map((bp, idx) => {
                  const isSelected = currentBlueprint?.blueprint_id === bp.blueprint_id;
                  return (
                    <button
                      key={bp.blueprint_id || idx}
                      type="button"
                      onClick={() => {
                        setCurrentBlueprint(bp);
                        setPins(parsePinsSafe(bp.pins));
                        setZoomLevel(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500 text-neutral-950 shadow-xs"
                          : "bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="font-extrabold">{bp.sheet_number || `Sheet ${idx + 1}`}</span>
                      <span className="opacity-80 font-normal truncate max-w-[200px]">· {bp.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Interactive Canvas (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              {/* Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.25))}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetCanvasView}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Reset Scale & Center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[11px] text-neutral-500 font-bold ml-1">
                    {Math.round(zoomLevel * 100)}% Scale
                  </span>
                  {currentBlueprint && currentBlueprint.media_type !== "video" && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400 font-sans ml-2">
                      <Move className="w-3.5 h-3.5" /> Drag plan to pan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!currentBlueprint}
                    onClick={() => setIsAddingPin((p) => !p)}
                    className={`px-3 py-1.5 rounded-[6px] font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isAddingPin
                        ? "bg-rose-500 text-white animate-pulse"
                        : !currentBlueprint
                        ? "bg-neutral-200 dark:bg-white/10 text-neutral-400 cursor-not-allowed"
                        : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isAddingPin ? "Click Plan to Pin" : "+ Drop Revision Pin"}</span>
                  </button>
                </div>
              </div>

              {/* Blueprint Canvas Box with Adaptive Light & Dark Theme */}
              <div
                ref={canvasContainerRef}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                onClick={currentBlueprint && currentBlueprint.media_type !== "video" ? handleCanvasClick : undefined}
                className={`relative w-full rounded-[16px] overflow-hidden border border-neutral-300 dark:border-white/10 bg-neutral-100/90 dark:bg-[#0a0d14] bg-[radial-gradient(#d1d5db_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:20px_20px] flex items-center justify-center transition-all ${
                  isFullscreen ? "fixed inset-0 z-50 h-screen w-screen rounded-none bg-neutral-100 dark:bg-[#0a0d14] p-4" : "h-[560px]"
                } ${
                  isAddingPin
                    ? "cursor-crosshair ring-2 ring-amber-500"
                    : isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                }`}
                style={isFullscreen ? { backgroundColor: "var(--tw-canvas-bg, inherit)" } : undefined}
              >
                {/* Fullscreen Floating Controls Bar (Top HUD) */}
                {isFullscreen && (
                  <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 pointer-events-none">
                    {/* Left HUD: Sheet title & Sheet Switcher */}
                    <div className="flex items-center gap-2 pointer-events-auto bg-white/95 dark:bg-black/90 backdrop-blur-md px-3.5 py-2 rounded-[12px] border border-neutral-300 dark:border-white/15 shadow-xl">
                      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        {currentBlueprint?.sheet_number || selectedDiscipline.replace("_", " ")}
                      </span>
                      {currentBlueprint?.title && (
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 font-sans max-w-[220px] truncate hidden sm:inline">
                          · {currentBlueprint.title}
                        </span>
                      )}

                      {/* Quick Sheet Switcher Pills in Fullscreen */}
                      {blueprints.length > 1 && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-200 dark:border-white/10">
                          {blueprints.map((bp) => {
                            const isSel = currentBlueprint?.blueprint_id === bp.blueprint_id;
                            return (
                              <button
                                key={bp.blueprint_id}
                                type="button"
                                onClick={() => {
                                  setCurrentBlueprint(bp);
                                  setPins(parsePinsSafe(bp.pins));
                                  setZoomLevel(1);
                                  setPanOffset({ x: 0, y: 0 });
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                  isSel
                                    ? "bg-amber-500 text-neutral-950"
                                    : "bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
                                }`}
                              >
                                {bp.sheet_number}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right HUD: Zoom Controls, Pin Drop, and Exit Fullscreen */}
                    <div className="flex items-center gap-2 pointer-events-auto bg-white/95 dark:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-[12px] border border-neutral-300 dark:border-white/15 shadow-xl">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.25))}
                        className="p-1.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-800 dark:text-white cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="p-1.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-800 dark:text-white cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={resetCanvasView}
                        className="p-1.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-800 dark:text-white cursor-pointer"
                        title="Reset View"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 px-1">
                        {Math.round(zoomLevel * 100)}%
                      </span>

                      {currentBlueprint && currentBlueprint.media_type !== "video" && (
                        <button
                          type="button"
                          onClick={() => setIsAddingPin((p) => !p)}
                          className={`px-3 py-1 rounded-[6px] font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            isAddingPin
                              ? "bg-rose-500 text-white animate-pulse"
                              : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
                          }`}
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>{isAddingPin ? "Click Plan to Pin" : "+ Drop Pin"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded bg-neutral-200 dark:bg-white/20 hover:bg-neutral-300 dark:hover:bg-white/30 text-neutral-800 dark:text-white cursor-pointer ml-1"
                        title="Exit Fullscreen (Esc)"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {currentBlueprint?.file_url || currentBlueprint?.image_url || currentBlueprint?.url ? (
                  currentBlueprint.media_type === "video" || String(currentBlueprint.file_url || "").match(/\.(mp4|webm|mov)$/i) ? (
                    <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-3">
                      <video
                        controls
                        playsInline
                        className="max-w-full max-h-[460px] rounded-lg shadow-2xl bg-black border border-neutral-300 dark:border-white/10"
                        src={currentBlueprint.file_url || currentBlueprint.image_url || currentBlueprint.url}
                      />
                      <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                        {currentBlueprint.title || "3D Walkthrough Video"} · {currentBlueprint.revision_no || "Rev 0"}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                        transformOrigin: "center center",
                      }}
                      className="relative select-none max-w-full max-h-full flex items-center justify-center transition-transform duration-75"
                    >
                      {/* Real Blueprint Plan Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imgRef}
                        src={currentBlueprint.file_url || currentBlueprint.image_url || currentBlueprint.url}
                        alt={currentBlueprint.title || `${selectedDiscipline} Blueprint`}
                        className="max-w-[85vw] max-h-[70vh] object-contain pointer-events-none select-none rounded-[4px] shadow-2xl border border-neutral-300/80 dark:border-white/10"
                        draggable={false}
                      />

                      {/* Render Active Revision Pins glued to the plan */}
                      {pins.map((pin) => (
                        <div
                          key={pin.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePin(pin);
                          }}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-lg transition-transform group-hover:scale-125 ${
                              pin.status === "Resolved"
                                ? "bg-emerald-500 text-neutral-950"
                                : "bg-amber-500 text-neutral-950 animate-bounce"
                            }`}
                          >
                            📍
                          </div>

                          {/* Tooltip on hover */}
                          <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg bg-neutral-900 text-white text-[10px] font-mono shadow-xl border border-white/10 z-20 pointer-events-none">
                            <span className="font-bold text-amber-400 block mb-0.5">{pin.author}</span>
                            <p className="leading-tight text-neutral-300">{pin.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Clean, human-designed empty state with animated LordIcon and pure text adapting to Light/Dark theme */
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
                    <LordIcon
                      src="https://cdn.lordicon.com/wzwygmng.json"
                      size={76}
                      colors="primary:#f59e0b,secondary:#38bdf8"
                      fallback={Layers}
                    />
                    <div className="space-y-1.5 max-w-md">
                      <h3 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-wide">
                        No {selectedDiscipline.replace("_", " ")} Blueprint Uploaded Yet
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                        Official CAD architectural sheets and engineering plans for this section will appear here once published by the MCPA engineering team. Once a plan is uploaded, you can zoom, inspect, and drop coordinate revision pins directly on the sheet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Revision Pins List (1 Col) */}
            <div className="p-4 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Revision Pins ({pins.length})
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Click to focus</span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
                {pins.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs font-mono text-neutral-400 space-y-1.5">
                    <MapPin className="w-5 h-5 text-neutral-300 dark:text-neutral-700 mx-auto mb-1" />
                    <p className="font-bold text-neutral-700 dark:text-neutral-300">No Revision Pins Dropped</p>
                    <p className="text-[11px] text-neutral-400">Click &quot;Add Pin&quot; above to annotate changes on the blueprint canvas.</p>
                  </div>
                ) : (
                  pins.map((pin, idx) => (
                    <div
                      key={pin.id || idx}
                      onClick={() => setActivePin(pin)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        activePin?.id === pin.id
                          ? "bg-amber-500/10 border-amber-500/40"
                          : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          Pin #{idx + 1} ({pin.x}%, {pin.y}%)
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          pin.status === "Resolved"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}>
                          {pin.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-snug line-clamp-2">
                        {pin.note}
                      </p>
                      <span className="text-[9px] font-mono text-neutral-400 block mt-1">
                        By {pin.author}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: BUDGET & OFFICIAL QUOTATION (BOQ)                  */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "boq" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1 text-[11px] font-mono">
                <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Engineering Cost Accounting
                </span>
                <span className="text-neutral-400">
                  •
                </span>
                <span className="text-neutral-400">
                  {projectCode}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <span>Budget &amp; Official Construction Quotation</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
                Itemized trade-by-trade Bill of Quantities (BOQ), verified materials takeoff, and client budget reconciliation formulated by MCPA Quantity Surveyors.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                {quotationData?.status === "PUBLISHED" || quotationData?.status === "ACCEPTED"
                  ? "Turnkey Construction Total"
                  : quotationData?.status === "REQUESTED"
                  ? "Quotation Status"
                  : "Target Budget Baseline"}
              </span>
              <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {quotationData?.status === "PUBLISHED" || quotationData?.status === "ACCEPTED"
                  ? formatPHP(totalBOQAmount)
                  : quotationData?.status === "REQUESTED"
                  ? "In Preparation"
                  : clientTargetBudget > 0
                  ? formatPHP(clientTargetBudget)
                  : "To Be Formulated"}
              </p>
            </div>
          </div>

          {/* Body based on Quotation Status */}
          {isLoadingQuotation ? (
            <div className="p-12 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                Loading official quotation and cost accounting data...
              </p>
            </div>
          ) : !quotationData ? (
            /* EMPTY STATE 1: No quotation requested yet */
            <div className="p-10 sm:p-14 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-6">
              <LordIcon
                src="https://cdn.lordicon.com/qhgmphtg.json"
                size={92}
                trigger="loop"
                colors="primary:#f59e0b,secondary:#38bdf8"
                fallback={CreditCard}
              />
              <div className="max-w-xl mx-auto space-y-2">
                <h3 className="text-base sm:text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  No Official Quotation Formulated Yet
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                  MCPA Quantity Surveyors formulate comprehensive line-item Bill of Quantities (BOQ), materials takeoff, and labor schedules for all architectural designs to ensure 100% price certainty and zero hidden change orders.
                </p>
              </div>

              {/* Inquiry Baseline Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Target Budget</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                    {clientTargetBudget > 0 ? formatPHP(clientTargetBudget) : (activeInquiry?.budgetRange || "Pending Confirmation")}
                  </p>
                </div>
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Financing Scheme</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white truncate">
                    {briefData?.financing_option || activeInquiry?.financing_option || "Bank Financing / Cash"}
                  </p>
                </div>
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Project Scope</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white truncate">
                    {briefData?.project_type || activeInquiry?.projectType || "Residential Construction"}
                  </p>
                </div>
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Location</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white truncate">
                    {briefData?.location || activeInquiry?.location || "Bulacan / Metro Manila"}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(true)}
                  className="px-6 py-3 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Request Official Quotation</span>
                </button>
              </div>
            </div>
          ) : quotationData?.status === "REQUESTED" ? (
            /* EMPTY STATE 2: Quotation has been requested by client, awaiting admin formulation */
            <div className="p-10 sm:p-14 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-6">
              <LordIcon
                src="https://cdn.lordicon.com/wzwygmng.json"
                size={92}
                trigger="loop"
                colors="primary:#f59e0b,secondary:#38bdf8"
                fallback={FileText}
              />
              <div className="max-w-xl mx-auto space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                  Quotation In Preparation
                </span>
                <h3 className="text-base sm:text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Quotation Request Under Engineering Takeoff
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                  Your formal request was submitted on {formatDocDate(quotationData.created_at || quotationData.requested_at || new Date())}. MCPA Quantity Surveyors and registered Civil Engineers are currently performing the structural takeoff, labor crew sizing, and trade line-item formulation based on your blueprints.
                </p>
              </div>

              {quotationData.client_notes && (
                <div className="max-w-lg mx-auto p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 text-left text-xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1 font-bold">
                    Client Notes / Special Requirements:
                  </span>
                  <p className="text-neutral-700 dark:text-neutral-300 font-sans italic">
                    &quot;{quotationData.client_notes}&quot;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Target Budget</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                    {clientTargetBudget > 0 ? formatPHP(clientTargetBudget) : "Pending Review"}
                  </p>
                </div>
                <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Target Duration</span>
                  <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                    {Number(quotationData.duration_months) >= 12
                      ? `${Math.floor(quotationData.duration_months / 12)} ${Math.floor(quotationData.duration_months / 12) === 1 ? "Year" : "Years"}${quotationData.duration_months % 12 > 0 ? ` & ${quotationData.duration_months % 12} ${quotationData.duration_months % 12 === 1 ? "Month" : "Months"}` : ""} Estimated`
                      : `${quotationData.duration_months || 6} ${Number(quotationData.duration_months) === 1 ? "Month" : "Months"} Estimated`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* PUBLISHED OFFICIAL QUOTATION VIEW */
            <div className="space-y-6">
              {/* 1. Executive Summary: 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Turnkey Amount */}
                <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                    <span>Turnkey Investment</span>
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {formatPHP(totalBOQAmount)}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
                    100% Fixed-Price Contract Guarantee
                  </p>
                </div>

                {/* Target Budget Baseline */}
                <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                    <span>Target Budget</span>
                    <Clock className="w-4 h-4 text-sky-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {clientTargetBudget > 0 ? formatPHP(clientTargetBudget) : "Not Specified"}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
                    Original Client Inquiry Baseline
                  </p>
                </div>

                {/* Real-Time Budget Variance (+/- % and ₱) */}
                <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                    <span>Budget Variance</span>
                    {budgetVariance.status === "under" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p
                    className={`text-2xl font-bold font-mono ${
                      budgetVariance.status === "under"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : budgetVariance.status === "over"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {clientTargetBudget > 0
                      ? budgetVariance.status === "under"
                        ? `-${formatPHP(Math.abs(budgetVariance.diff))}`
                        : budgetVariance.status === "over"
                        ? `+${formatPHP(budgetVariance.diff)}`
                        : "₱0"
                      : "Balanced"}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
                    {clientTargetBudget > 0
                      ? budgetVariance.status === "under"
                        ? `-${Math.abs(budgetVariance.pct).toFixed(1)}% Under Target Budget`
                        : budgetVariance.status === "over"
                        ? `+${budgetVariance.pct.toFixed(1)}% Above Target Budget`
                        : "0.0% Exact Budget Match"
                      : "Full Value Engineering Applied"}
                  </p>
                </div>

                {/* Timeline & Financing Scheme */}
                <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                    <span>Duration &amp; Terms</span>
                    <Building className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {quotationData.duration_months || 6} Months
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-sans truncate">
                    {quotationData.financing_type || "Milestone Escrow"}
                  </p>
                </div>
              </div>

              {/* Action Banner with Pure Backend Word-Style A4 PDF Download */}
              <div className="p-4 sm:p-5 rounded-[14px] bg-neutral-900 text-white dark:bg-white/[0.03] border border-neutral-800 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-400">
                    Official A4 Construction Quotation Document
                  </h4>
                  <p className="text-xs text-neutral-300 font-sans mt-0.5">
                    Official monochrome Word-style contract estimate prepared by MCPA licensed civil engineers. Strictly generated server-side.
                  </p>
                </div>

                <a
                  href={`/api/projects/${projectId}/quotation/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official A4 Quotation (PDF)</span>
                </a>
              </div>

              {/* 2. Four-Pillar Cost Breakdown Summary */}
              <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
                <div className="border-b border-neutral-200 dark:border-white/5 pb-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Cost Breakdown Accounting
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Transparent General Contractor Sizing
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">1. Direct Materials</span>
                    <p className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                      {formatPHP(quotationData.materials_cost || 0)}
                    </p>
                    <span className="text-[10px] text-neutral-500 font-sans">Full Structural &amp; Finishes Takeoff</span>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">
                      2. Direct Labor ({quotationData.duration_months || 6} mos)
                    </span>
                    <p className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                      {formatPHP(quotationData.labor_cost || 0)}
                    </p>
                    <span className="text-[10px] text-neutral-500 font-sans">Foreman, Skilled Trades &amp; Helpers</span>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">3. Professional Fees</span>
                    <p className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                      {formatPHP((Number(quotationData.architect_fee) || 0) + (Number(quotationData.engineer_fee) || 0))}
                    </p>
                    <span className="text-[10px] text-neutral-500 font-sans">
                      Archi: {formatPHP(quotationData.architect_fee || 0)} | Engr: {formatPHP(quotationData.engineer_fee || 0)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">
                      4. Contractor Margin ({quotationData.contractor_profit_pct || 12}%)
                    </span>
                    <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatPHP(quotationData.contractor_profit_amount || 0)}
                    </p>
                    <span className="text-[10px] text-neutral-500 font-sans">Supervision, Equipment &amp; Overhead</span>
                  </div>
                </div>
              </div>

              {/* 3. Trade-by-Trade BOQ Itemized Tables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white tracking-wider">
                    Itemized Bill of Quantities (BOQ)
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {boqData.length} Work Packages
                  </span>
                </div>

                <div className="space-y-4">
                  {boqData.map((sec, idx) => {
                    const isOthers = sec.category?.toLowerCase().includes("other") || sec.category?.toLowerCase().includes("special");
                    return (
                      <div
                        key={idx}
                        className={`rounded-[14px] bg-white dark:bg-[#101218] border overflow-hidden ${
                          isOthers
                            ? "border-amber-500/30"
                            : "border-neutral-200 dark:border-white/5"
                        }`}
                      >
                        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                              {sec.category}
                            </span>
                            {isOthers && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                Custom Specified Scopes
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                            {formatPHP((sec.items || []).reduce((s, it) => s + (Number(it.total) || 0), 0))}
                          </span>
                        </div>

                        <div className="divide-y divide-neutral-200 dark:divide-white/5">
                          {(sec.items || []).map((row, rIdx) => (
                            <div
                              key={rIdx}
                              className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex-1 pr-4">
                                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {row.item}
                                </p>
                                {row.notes && (
                                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                                    {row.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-6 font-mono text-neutral-500 shrink-0">
                                <span className="w-20 text-right">
                                  {row.qty} {row.unit || "lot"}
                                </span>
                                <span className="w-28 text-right">
                                  {formatPHP(row.unitCost)}
                                </span>
                                <span className="w-28 text-right font-bold text-neutral-900 dark:text-white">
                                  {formatPHP(row.total)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Progressive Milestone Payment Schedule */}
              {quotationData.payment_milestones && Array.isArray(quotationData.payment_milestones) && quotationData.payment_milestones.length > 0 && (
                <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
                  <div className="border-b border-neutral-200 dark:border-white/5 pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Progressive Milestone Payment Schedule
                    </span>
                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                      Payments are strictly disbursed against independently verified engineering milestones, protecting client capital.
                    </p>
                  </div>

                  <div className="divide-y divide-neutral-200 dark:divide-white/5">
                    {quotationData.payment_milestones.map((ms, idx) => (
                      <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white font-mono uppercase">
                              {ms.milestone} ({ms.percentage}%)
                            </span>
                            <p className="text-[11px] text-neutral-500 font-sans">{ms.trigger}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white text-right">
                          {formatPHP(ms.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Scope Clarifications & Inclusions/Exclusions */}
              {quotationData.admin_notes && (
                <div className="p-5 rounded-[16px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 text-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block tracking-wider">
                    Engineering Inclusions, Exclusions &amp; Warranty Terms:
                  </span>
                  <p className="text-neutral-700 dark:text-neutral-300 font-sans whitespace-pre-line leading-relaxed">
                    {quotationData.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 5: MUNICIPAL PERMITS & DOCUMENT TRANSMITTALS          */}
      {/* ------------------------------------------------------------- */}
      {(activeSubTab === "permits" || activeSubTab === "documents") && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Regulatory &amp; Legal Hub
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  ({projectCode})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Project Documents &amp; Municipal Permits</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
                Upload required land ownership &amp; tax documents for building permit issuance, and track real-time approvals and engineering transmittals issued by MCPA.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {clientRequests.filter((r) => r.status === "verified" || r.status === "uploaded").length}
                </span>
                /{clientRequests.length} Uploaded
              </span>
            </div>
          </div>

          {/* 1. MUNICIPAL PERMITS TRACKER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Municipal Permits &amp; Clearances Pipeline</span>
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                {permits.length} Logged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permits.length === 0 ? (
                <div className="col-span-full p-8 sm:p-10 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-3 relative overflow-hidden group">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <LordIcon
                      src="https://cdn.lordicon.com/surcxhka.json"
                      trigger="hover"
                      colors="primary:#d97706,secondary:#f59e0b"
                      size={46}
                      fallback={Shield}
                    />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      LGU Pipeline Active
                    </span>
                    <h3 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white">
                      No Municipal Permits Logged Yet
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                      Municipal building permits, zoning clearances, and barangay construction transmittals will be posted here as they are processed by the engineering team.
                    </p>
                  </div>
                </div>
              ) : (
                permits.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-3 shadow-xs hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-2.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        {perm.issuing_agency}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        perm.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : perm.status === "IN_PROGRESS"
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 animate-pulse border border-sky-500/30"
                          : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                      }`}>
                        {perm.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                        {perm.name}
                      </h4>
                      <p className="text-xs font-mono text-neutral-500 mt-1">
                        Ref #: {perm.ref_number}
                      </p>
                      {perm.issue_date && (
                        <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Cleared on {new Date(perm.issue_date).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. REQUIRED DOCUMENTS FOR BUILDING PERMIT ISSUANCE */}
          <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3 gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Required Documents for Building Permit Issuance
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-mono uppercase">
                  Ownership Verification &amp; Tax Documents
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Official scanned PDF or high-resolution images required
              </p>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-white/5">
              {clientRequests.map((req) => {
                const isUploaded = req.status === "uploaded";
                const isVerified = req.status === "verified";
                const isPending = !isUploaded && !isVerified;
                const fileAttachment = req.file || (req.file_url ? { fileName: req.file_name, fileUrl: req.file_url } : null);

                return (
                  <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono font-bold uppercase tracking-wider">
                        <span className="text-amber-600 dark:text-amber-400">
                          {req.category || "Required Document"}
                        </span>
                        {req.urgency && req.urgency.toLowerCase().includes("urgent") && (
                          <>
                            <span className="text-neutral-400 dark:text-neutral-600">•</span>
                            <span className="text-rose-600 dark:text-rose-400">
                              {req.urgency}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                        {req.title}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {req.defaultNote || req.note || req.instructions}
                      </p>

                      {fileAttachment && (
                        <div className="pt-1 flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                          <span className="truncate max-w-xs text-neutral-300">
                            📎 {fileAttachment.fileName || "Uploaded Attachment"}
                          </span>
                          {fileAttachment.fileUrl && (
                            <a
                              href={fileAttachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 hover:text-amber-400 underline inline-flex items-center gap-1 font-bold"
                            >
                              <span>View File</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
                          <Check className="w-4 h-4" />
                          <span>Verified &amp; Approved</span>
                        </span>
                      ) : isUploaded ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Review</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveUploadRequest(req)}
                            className="px-3 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Re-upload
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveUploadRequest(req)}
                          className="px-4 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 hover:shadow-amber-500/20"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. OFFICIAL MCPA TRANSMITTALS & ENGINEERING ISSUANCES */}
          <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                    Official Engineering Releases
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    ({adminTransmittals.length} Transmittals)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-mono uppercase">
                  MCPA Official Transmittals &amp; Engineering Packages
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Direct transmittals issued by MCPA Central Engineering
              </p>
            </div>

            {adminTransmittals.length === 0 ? (
              <div className="p-8 text-center rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-dashed border-neutral-200 dark:border-white/10 space-y-2.5">
                <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <LordIcon
                    src="https://cdn.lordicon.com/smwmetfi.json"
                    trigger="hover"
                    colors="primary:#0284c7,secondary:#38bdf8"
                    size={38}
                    fallback={Upload}
                  />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-xs font-mono font-bold uppercase text-neutral-800 dark:text-neutral-200">
                    No MCPA Transmittals Issued Yet
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                    Official blueprint sets, itemized quotation indices, and municipal endorsement letters issued to this portal will appear here with direct download links.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {adminTransmittals.map((tx) => (
                  <div
                    key={tx.id || tx.transmittal_id}
                    className="p-4 rounded-[12px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                          {tx.category || "Transmittal"}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {formatDocDate(tx.created_at || tx.issuedAt)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                        {tx.title}
                      </h4>
                      {tx.remarks || tx.note ? (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans line-clamp-2">
                          {tx.remarks || tx.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                          {tx.file_name || tx.fileName}
                        </span>
                      </div>

                      <a
                        href={tx.file_url || tx.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 6: E-CONTRACT & GROUND BREAKING SCHEDULER              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "contract" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* E-Contract Digital Signing Card */}
            <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Legal Master Agreement
                </span>
                {contract?.status === "FULLY_EXECUTED" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                    Fully Executed
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">
                    Awaiting E-Signature
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Turnkey Construction Master Contract
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Binding contract incorporating the final locked BOQ ({formatPHP(totalBOQAmount)}), 15-year structural warranty, and milestone billing progression terms.
                </p>
              </div>

              {contract?.status === "FULLY_EXECUTED" ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold font-mono uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographic SHA-256 Seal Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Signed by {contract.signer_name || currentUser?.fullName} on {new Date(contract.signed_date || Date.now()).toLocaleDateString("en-PH", { dateStyle: "long" })}.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="w-full py-3 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Review &amp; Sign Master Contract</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DOCUMENT UPLOAD MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      {activeUploadRequest && (
        <DocumentUploadModal
          isOpen={Boolean(activeUploadRequest)}
          onClose={() => setActiveUploadRequest(null)}
          onUploadSuccess={handleRequestUploadSuccess}
          targetRequest={activeUploadRequest}
          clientName={currentUser?.fullName || currentUser?.name || "Client"}
          projectCode={projectCode}
          uploadType="client"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: E-SIGNATURE MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[20px] bg-white dark:bg-[#12141c] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Execute Master Construction Contract
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                  Sign below with your stylus, mouse, or touch finger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-neutral-300 dark:border-white/10 rounded-xl bg-neutral-50 dark:bg-black/40 overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={460}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={clearSignature}
                className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Clear Canvas
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSignature}
                  disabled={!hasDrawnSig || isSigning}
                  className="px-5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSigning ? "Cryptographically Sealing..." : "Confirm & Sign"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REQUEST OFFICIAL QUOTATION MODAL                       */}
      {/* ------------------------------------------------------------- */}
      {isQuotationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[20px] bg-white dark:bg-[#12141c] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                  MCPA Quantity Surveying &amp; Cost Control
                </span>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Request Official Construction Quotation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuotationModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Baseline Parameters Info */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-neutral-400">Project Reference:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{projectCode}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-neutral-400">Target Budget Baseline:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {clientTargetBudget > 0 ? formatPHP(clientTargetBudget) : (activeInquiry?.budgetRange || "Pending Confirmation")}
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-neutral-400">Preferred Financing:</span>
                <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[240px]">
                  {briefData?.financing_option || activeInquiry?.financing_option || "Bank Loan / Milestone Escrow"}
                </span>
              </div>
            </div>

            {/* Custom Notes / Priority Scopes */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Special Scopes, Inclusions or Finish Priorities (Optional)
              </label>
              <textarea
                rows={4}
                value={quotationRequestNotes}
                onChange={(e) => setQuotationRequestNotes(e.target.value)}
                placeholder="Specify any custom requirements such as perimeter fencing, deep well, solar power system, high-end imported tiles, extra ceiling height, or smart home automation..."
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              />
              <p className="text-[10px] font-sans text-neutral-400 leading-relaxed">
                MCPA estimators will cross-reference your architectural blueprints to compile verified material takeoffs and labor crew schedules.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsQuotationModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestQuotation}
                disabled={isRequestingQuotation}
                className="px-5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isRequestingQuotation ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Request...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Submit Quotation Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
