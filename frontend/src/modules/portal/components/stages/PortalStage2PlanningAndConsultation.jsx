"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  ShieldCheck,
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
  MapPin,
  Compass,
  CreditCard,
  PenTool,
  RotateCcw,
  Download,
  Send,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";
import PortalMeetingHub from "../PortalMeetingHub";
import DocumentUploadModal from "@/modules/shared/DocumentUploadModal";
import {
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
  const projectId = activeProject?.client_project_id;
  const projectCode = activeProject?.site_project_code || activeProject?.project_code || "MCPA-PRJ-2026";

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

  // Primary active inquiry for this project
  const activeInquiry = useMemo(() => {
    if (inquiries.length > 0) return inquiries[0];
    return null;
  }, [inquiries]);

  // -------------------------------------------------------------
  // 1. WebRTC & Meeting State
  // -------------------------------------------------------------
  const [meetingRoom, setMeetingRoom] = useState(null);
  const [quotationRequested, setQuotationRequested] = useState(false);

  // -------------------------------------------------------------
  // 2. Chat & Communication State
  // -------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatScrollRef = useRef(null);

  // -------------------------------------------------------------
  // 3. Document Requests & Permits State
  // -------------------------------------------------------------
  const [documents, setDocuments] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [adminTransmittals, setAdminTransmittals] = useState([]);
  const [activeUploadRequest, setActiveUploadRequest] = useState(null);
  const [isExtraUploadModalOpen, setIsExtraUploadModalOpen] = useState(false);

  // Sync Document Requests & Transmittals from localStorage/admin
  useEffect(() => {
    setDocumentRequests(loadDocumentRequests());
    setAdminTransmittals(loadAdminTransmittals());

    const handleSync = () => {
      setDocumentRequests(loadDocumentRequests());
      setAdminTransmittals(loadAdminTransmittals());
    };

    window.addEventListener("mcpa-document-requests-updated", handleSync);
    window.addEventListener("mcpa-admin-transmittals-updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("mcpa-document-requests-updated", handleSync);
      window.removeEventListener("mcpa-admin-transmittals-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const clientRequests = useMemo(() => {
    const email = (currentUser?.email || "").toLowerCase().trim();
    const trackingId = (activeInquiry?.trackingId || activeInquiry?.id || "").trim();
    const matched = documentRequests.filter(
      (r) =>
        !email ||
        !r.clientEmail ||
        r.clientEmail.toLowerCase() === email ||
        (trackingId && r.projectCode === trackingId)
    );
    return matched.length > 0 ? matched : documentRequests;
  }, [documentRequests, currentUser, activeInquiry]);

  const handleRequestUploadSuccess = async (uploadedFile) => {
    if (!activeUploadRequest) return;

    const updated = documentRequests.map((r) => {
      if (r.id === activeUploadRequest.id) {
        return {
          ...r,
          status: "uploaded",
          file: uploadedFile,
        };
      }
      return r;
    });

    setDocumentRequests(updated);
    saveDocumentRequests(updated);

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
            notes: `Uploaded for request: ${activeUploadRequest.title}`,
          }),
        });
      } catch (err) {
        console.warn("Backend document save:", err);
      }
    }

    setActiveUploadRequest(null);
    showToast?.(`Successfully uploaded "${activeUploadRequest.title}"!`);
  };

  // -------------------------------------------------------------
  // 4. Interactive Blueprints & Pin-Drop State
  // -------------------------------------------------------------
  const [blueprints, setBlueprints] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("ARCHITECTURAL");
  const [currentBlueprint, setCurrentBlueprint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pins, setPins] = useState([
    {
      id: "pin-1",
      x: 35,
      y: 42,
      note: "Provision for 2.4m glass sliding door to lanai area.",
      author: "Arch. Quirante",
      timestamp: "2026-10-12T14:30:00Z",
      status: "Resolved",
    },
    {
      id: "pin-2",
      x: 68,
      y: 58,
      note: "Confirm electrical outlet placement for double-door refrigerator.",
      author: currentUser?.fullName || "Client",
      timestamp: "2026-10-14T09:15:00Z",
      status: "In Review",
    },
  ]);
  const [activePin, setActivePin] = useState(null);
  const [isAddingPin, setIsAddingPin] = useState(false);

  // -------------------------------------------------------------
  // 5. Municipal Permits Tracker State
  // -------------------------------------------------------------
  const [permits, setPermits] = useState([
    {
      id: "perm-1",
      name: "Barangay Construction Clearance",
      issuing_agency: "Barangay Local Government Unit",
      status: "APPROVED",
      issue_date: "2026-10-08",
      ref_number: "BRGY-CLR-2026-0941",
    },
    {
      id: "perm-2",
      name: "Zoning & Locational Clearance",
      issuing_agency: "City Planning & Development Coordinator (CPDC)",
      status: "APPROVED",
      issue_date: "2026-10-11",
      ref_number: "CPDC-ZN-2026-4412",
    },
    {
      id: "perm-3",
      name: "Fire Safety Evaluation Clearance (FSEC)",
      issuing_agency: "Bureau of Fire Protection (BFP)",
      status: "IN_PROGRESS",
      issue_date: null,
      ref_number: "FSEC-APP-2026-118",
    },
    {
      id: "perm-4",
      name: "City / Municipal Building Permit Approval",
      issuing_agency: "Office of the Building Official (OBO)",
      status: "PENDING_FSEC",
      issue_date: null,
      ref_number: "OBO-BP-PENDING",
    },
  ]);

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
  // 7. Groundbreaking Ceremony Scheduler State
  // -------------------------------------------------------------
  const [groundbreakingDate, setGroundbreakingDate] = useState(
    activeProject?.groundbreaking_date || "2026-11-05T09:00"
  );
  const [isSavingGroundbreaking, setIsSavingGroundbreaking] = useState(false);

  // Real-time countdown to Ground Breaking
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!groundbreakingDate) return;
    const calculateTimeLeft = () => {
      const diff = new Date(groundbreakingDate).getTime() - new Date().getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [groundbreakingDate]);

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

    // Load blueprints
    authFetch(`/api/projects/${projectId}/blueprints?discipline=${selectedDiscipline}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.blueprints) && d.blueprints.length > 0) {
          setBlueprints(d.blueprints);
          setCurrentBlueprint(d.blueprints[0]);
          if (d.blueprints[0].pins?.length) setPins(d.blueprints[0].pins);
        }
      })
      .catch((e) => console.warn("Blueprints fetch error:", e));

    // Load contract
    authFetch(`/api/projects/${projectId}/contract`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.contract) setContract(d.contract);
      })
      .catch((e) => console.warn("Contract fetch error:", e));
  }, [projectId, selectedDiscipline]);

  // Blueprint Canvas Pin click handler
  const handleCanvasClick = async (e) => {
    if (!isAddingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
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
      setTimeout(() => {
        setIsSigning(false);
        setIsSignModalOpen(false);
        setContract({
          contract_id: "CTR-2026-EXEC",
          status: "FULLY_EXECUTED",
          signed_date: new Date().toISOString(),
          signer_name: currentUser?.fullName || "Client",
        });
        showToast?.("Construction Master Agreement executed with SHA-256 digital stamp!");
      }, 1000);
    } catch (err) {
      setIsSigning(false);
      showToast?.("Signing error: " + err.message);
    }
  };

  // Chat send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "CLIENT",
      senderName: currentUser?.fullName || "Client",
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    if (projectId) {
      try {
        await authFetch(`/api/projects/${projectId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMsg.text }),
        });
      } catch (err) {
        console.warn("Message sync error:", err);
      }
    }
  };

  // Accurate Itemized BOQ Data
  const boqData = useMemo(() => {
    return [
      {
        category: "1. General Requirements & Engineering Compliance",
        items: [
          { item: "Mobilization & Demobilization of Equipment", qty: "1 Lot", unitCost: 45000, total: 45000 },
          { item: "Temporary Facilities, Power & Water Tapping", qty: "1 Lot", unitCost: 35000, total: 35000 },
          { item: "Building Permits Processing & Municipal Clearances", qty: "1 Lot", unitCost: 65000, total: 65000 },
          { item: "Occupational Safety & Health Program (DOLE Compliance)", qty: "1 Lot", unitCost: 28000, total: 28000 },
        ],
      },
      {
        category: "2. Earthworks & Substructure Works",
        items: [
          { item: "Site Clearing, Staking & Batterboard Layout", qty: "120 sqm", unitCost: 250, total: 30000 },
          { item: "Structural Excavation for Footings & Tie Beams", qty: "48 cu.m", unitCost: 850, total: 40800 },
          { item: "Gravel Bedding & Soil Poisoning (Termite Barrier)", qty: "12 cu.m", unitCost: 1800, total: 21600 },
          { item: "Reinforced Concrete Foundation (3,000 PSI at 28 Days)", qty: "24 cu.m", unitCost: 6800, total: 163200 },
        ],
      },
      {
        category: "3. Superstructure & Framing (SteelAsia Rebars & Curing)",
        items: [
          { item: "Reinforced Concrete Columns & Suspended Beams", qty: "32 cu.m", unitCost: 7200, total: 230400 },
          { item: "Deformed Steel Bars Grade 40 (SteelAsia Certified)", qty: "4,800 kg", unitCost: 58, total: 278400 },
          { item: "Suspended Slab Concrete Pouring (Second Floor)", qty: "85 sqm", unitCost: 2400, total: 204000 },
        ],
      },
      {
        category: "4. Masonry, Plastering & Roofing System",
        items: [
          { item: "6-inch Exterior Load-bearing CHB with Reinforcements", qty: "220 sqm", unitCost: 950, total: 209000 },
          { item: "4-inch Interior CHB Partitions & Smooth Plaster", qty: "180 sqm", unitCost: 780, total: 140400 },
          { item: "Rib-type 0.50mm Pre-painted Longspan Metal Roofing", qty: "95 sqm", unitCost: 1450, total: 137750 },
          { item: "Double-sided Aluminum Thermal Radiant Barrier", qty: "95 sqm", unitCost: 320, total: 30400 },
        ],
      },
      {
        category: "5. Doors, Windows & Architectural Finishes",
        items: [
          { item: "Custom Solid Mahogany Main Pivot Door with Smart Lock", qty: "1 Set", unitCost: 48000, total: 48000 },
          { item: "Heavy-duty Powder-coated Aluminum Casement Windows", qty: "14 Sets", unitCost: 12500, total: 175000 },
          { item: "60x60 Vitrified Porcelain Tiles (Ground & Second Floor)", qty: "160 sqm", unitCost: 1650, total: 264000 },
          { item: "Premium Boysen Permacoat Paint System (3 Coats)", qty: "650 sqm", unitCost: 380, total: 247000 },
        ],
      },
      {
        category: "6. MEPFS & Solar Ready Rough-Ins",
        items: [
          { item: "PPR Hot & Cold Water Distribution Line Network", qty: "1 Lot", unitCost: 75000, total: 75000 },
          { item: "Sanitary Drainage & 3-Chamber Septic Tank", qty: "1 Lot", unitCost: 68000, total: 68000 },
          { item: "Electrical Panel Board & Circuit Breaker Layout", qty: "1 Lot", unitCost: 95000, total: 95000 },
          { item: "Rooftop Solar Ready Conduit Network & Inverter Prep", qty: "1 Lot", unitCost: 32000, total: 32000 },
        ],
      },
    ];
  }, []);

  const totalBOQAmount = useMemo(() => {
    return boqData.reduce((acc, cat) => {
      return acc + cat.items.reduce((s, it) => s + it.total, 0);
    }, 0);
  }, [boqData]);

  const formatPHP = (val) =>
    "₱" + Number(val).toLocaleString("en-PH", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. STAGE 2 UNIFIED HERO HEADER                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              <Compass className="w-4 h-4" />
              <span>Unified Stage 2 · Progressive Disclosure</span>
            </div>
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
              onClick={() => setActiveSubTab("meeting")}
              className="px-4 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Video className="w-4 h-4 stroke-[2.5]" />
              <span>Consultation Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("blueprints")}
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
            onClick={() => setActiveSubTab("meeting")}
            className={`p-3.5 rounded-[12px] border text-left cursor-pointer transition-all ${
              activeSubTab === "meeting" || activeSubTab === "overview"
                ? "bg-amber-500/10 border-amber-500/40 text-neutral-900 dark:text-white"
                : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Milestone A
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-bold font-mono">1. Video Consultation &amp; Scoping</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
              Initial brief review, preliminary estimate, and lot orientation.
            </p>
          </div>

          <div
            onClick={() => setActiveSubTab("blueprints")}
            className={`p-3.5 rounded-[12px] border text-left cursor-pointer transition-all ${
              activeSubTab === "blueprints" || activeSubTab === "boq"
                ? "bg-amber-500/10 border-amber-500/40 text-neutral-900 dark:text-white"
                : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Milestone B
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-500">In Progress</span>
            </div>
            <p className="text-xs font-bold font-mono">2. Blueprints &amp; Pin Feedback</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
              2D/3D floor plans, pin-drop revisions, and locked itemized BOQ.
            </p>
          </div>

          <div
            onClick={() => setActiveSubTab("contract")}
            className={`p-3.5 rounded-[12px] border text-left cursor-pointer transition-all ${
              activeSubTab === "contract" || activeSubTab === "permits"
                ? "bg-amber-500/10 border-amber-500/40 text-neutral-900 dark:text-white"
                : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Milestone C
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-400">Upcoming</span>
            </div>
            <p className="text-xs font-bold font-mono">3. Permits, Contract &amp; Shovel</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
              LGU permits, cryptographic e-signing, and Ground Breaking clock.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-TAB NAVIGATION BAR                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200 dark:border-white/5 scrollbar-none">
        {[
          { id: "overview", label: "Executive Overview", icon: Compass },
          { id: "meeting", label: "Consultation & Meetings", icon: Video },
          { id: "blueprints", label: "Interactive Blueprints", icon: Layers, badge: pins.length },
          { id: "boq", label: "Itemized BOQ Quotation", icon: CreditCard },
          { id: "permits", label: "Permits & Transmittals", icon: ShieldCheck, badge: clientRequests.filter(r => r.status === "pending").length || undefined },
          { id: "contract", label: "E-Contract & Groundbreaking", icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

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
                  REF: {activeInquiry?.submission_id || activeInquiry?.id || projectCode}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Lot Location</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                    {activeInquiry?.location || activeProject?.location || "Bulacan, Central Luzon"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Floor Area</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5">
                    {activeInquiry?.lot_area || "180 sqm"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Design Style</span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                    {activeInquiry?.preferred_style || "Contemporary Modern"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Target Budget</span>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {activeInquiry?.budget_range || "₱4.5M - ₱6.0M"}
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

            {/* Ground Breaking Countdown Widget */}
            <div className="p-6 rounded-[16px] bg-gradient-to-br from-neutral-900 via-[#141620] to-neutral-950 text-white border border-amber-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ground Breaking Countdown</span>
                </div>
                <h3 className="text-lg font-bold font-mono uppercase text-white">
                  Target Shovel-in-Ground
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Scheduled ceremony at your project site in Bulacan.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 my-5 text-center">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xl font-bold font-mono text-amber-400 block">{countdown.days}</span>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xl font-bold font-mono text-white block">{countdown.hours}</span>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Hours</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xl font-bold font-mono text-white block">{countdown.minutes}</span>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Mins</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xl font-bold font-mono text-white block">{countdown.seconds}</span>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Secs</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab("contract")}
                className="w-full py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Manage Ground Breaking Date</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Architect Chat & Q&A */}
          <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Direct Line: Lead Engineer &amp; Architect Raymart Quirante
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Available Online
              </span>
            </div>

            <div className="h-56 overflow-y-auto space-y-3 p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 text-xs font-mono">
                  <MessageSquare className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mb-1" />
                  <span>No consultation messages yet. Ask any question regarding your blueprints or budget below.</span>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.sender === "CLIENT" || m.senderName === currentUser?.fullName;
                  return (
                    <div key={m.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] rounded-[12px] p-3 text-xs leading-relaxed ${
                        isMe
                          ? "bg-amber-500 text-neutral-950 font-medium"
                          : "bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                      }`}>
                        <span className="text-[9px] font-mono block opacity-75 mb-0.5">
                          {m.senderName || (isMe ? "You" : "Engr. Raymart")}
                        </span>
                        {m.text}
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400 mt-0.5 px-1">
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatScrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message to Lead Engineer Raymart Quirante..."
                className="flex-1 px-4 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-5 py-2.5 rounded-[10px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
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
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: INTERACTIVE BLUEPRINTS & PIN-DROP FEEDBACK         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "blueprints" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
            <div>
              <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                Interactive Engineering Blueprint Canvas
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                Drop pins directly on the floor plans to communicate revisions with zero ambiguity.
              </p>
            </div>

            {/* Discipline Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {["ARCHITECTURAL", "STRUCTURAL", "ELECTRICAL", "PLUMBING", "3D_ELEVATION"].map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-3 py-1.5 rounded-[6px] text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedDiscipline === disc
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {disc.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Interactive Canvas (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              {/* Controls Toolbar */}
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500 ml-1">
                    {Math.round(zoomLevel * 100)}% Scale
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingPin((p) => !p)}
                  className={`px-3 py-1.5 rounded-[6px] font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isAddingPin
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isAddingPin ? "Click Anywhere on Plan to Pin" : "+ Drop Revision Pin"}</span>
                </button>
              </div>

              {/* Blueprint Canvas Box */}
              <div
                onClick={handleCanvasClick}
                className={`relative w-full h-[520px] rounded-[16px] overflow-hidden border border-neutral-300 dark:border-white/10 bg-[#0d1017] flex items-center justify-center transition-all ${
                  isAddingPin ? "cursor-crosshair ring-2 ring-amber-500" : "cursor-default"
                }`}
              >
                {/* SVG Blueprint Plan Simulation if no image uploaded yet */}
                <div
                  className="w-full h-full relative p-6 flex items-center justify-center select-none"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                >
                  <svg
                    viewBox="0 0 800 600"
                    className="w-full h-full stroke-sky-400/60 fill-sky-950/20 stroke-1"
                  >
                    {/* Architectural Grid Lines */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="800" height="600" fill="url(#grid)" />

                    {/* Exterior Foundation Walls */}
                    <rect x="80" y="80" width="640" height="440" stroke="#38bdf8" strokeWidth="3" fill="rgba(14, 165, 233, 0.05)" />
                    {/* Master Bedroom */}
                    <rect x="80" y="80" width="280" height="220" stroke="#38bdf8" strokeWidth="2" fill="none" />
                    <text x="140" y="200" fill="#94a3b8" fontSize="12" fontFamily="monospace">MASTER BEDROOM (18.5 sqm)</text>
                    
                    {/* En-suite Bath */}
                    <rect x="80" y="300" width="140" height="120" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                    <text x="100" y="365" fill="#64748b" fontSize="10" fontFamily="monospace">T&amp;B 1</text>

                    {/* Living & Dining Area */}
                    <rect x="360" y="80" width="360" height="280" stroke="#38bdf8" strokeWidth="2" fill="none" />
                    <text x="440" y="220" fill="#94a3b8" fontSize="14" fontFamily="monospace">HIGH-CEILING LIVING &amp; DINING</text>

                    {/* Kitchen & Pantry */}
                    <rect x="360" y="360" width="220" height="160" stroke="#38bdf8" strokeWidth="2" fill="none" />
                    <text x="400" y="445" fill="#94a3b8" fontSize="11" fontFamily="monospace">MODERN ISLAND KITCHEN</text>

                    {/* Lanai Patio */}
                    <rect x="580" y="360" width="140" height="160" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" fill="rgba(245, 158, 11, 0.04)" />
                    <text x="610" y="445" fill="#f59e0b" fontSize="10" fontFamily="monospace">OUTDOOR LANAI</text>

                    {/* Dimensions & Orientation Compass */}
                    <line x1="80" y1="540" x2="720" y2="540" stroke="#94a3b8" strokeWidth="1" />
                    <text x="380" y="555" fill="#94a3b8" fontSize="10" fontFamily="monospace">16.00 METERS</text>
                  </svg>

                  {/* Render Active Revision Pins */}
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-lg transition-transform group-hover:scale-125 ${
                        pin.status === "Resolved"
                          ? "bg-emerald-500 text-neutral-950"
                          : "bg-amber-500 text-neutral-950 animate-bounce"
                      }`}>
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
                {pins.map((pin, idx) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: ITEMIZED BOQ (BILL OF QUANTITIES) QUOTATION        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "boq" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Standardized Architectural Cost Accounting</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white">
                Detailed Bill of Quantities (BOQ) Breakdown
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                Itemized trade-by-trade breakdown ensuring 100% price certainty and zero hidden change orders.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">Total Turnkey Investment</span>
              <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatPHP(totalBOQAmount)}
              </p>
            </div>
          </div>

          {/* Trade-by-Trade Tables */}
          <div className="space-y-5">
            {boqData.map((sec, idx) => (
              <div
                key={idx}
                className="rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 overflow-hidden"
              >
                <div className="px-5 py-3 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    {sec.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                    {formatPHP(sec.items.reduce((s, it) => s + it.total, 0))}
                  </span>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-white/5">
                  {sec.items.map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{row.item}</p>
                      </div>
                      <div className="flex items-center gap-6 font-mono text-neutral-500">
                        <span className="w-20 text-right">{row.qty}</span>
                        <span className="w-28 text-right">{formatPHP(row.unitCost)} / unit</span>
                        <span className="w-28 text-right font-bold text-neutral-900 dark:text-white">
                          {formatPHP(row.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 5: MUNICIPAL PERMITS & DOCUMENT TRANSMITTALS          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "permits" && (
        <div className="space-y-6">
          <div className="p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
              Municipal Building Permits &amp; Legal Transmittals
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
              MCPA Engineering processes all LGU clearances on your behalf. Track real-time approvals below.
            </p>
          </div>

          {/* Permits Tracker Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.map((perm) => (
              <div
                key={perm.id}
                className="p-5 rounded-[14px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-2.5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {perm.issuing_agency}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    perm.status === "APPROVED"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : perm.status === "IN_PROGRESS"
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 animate-pulse"
                      : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                  }`}>
                    {perm.status.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                    {perm.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 mt-1">
                    Ref #: {perm.ref_number}
                  </p>
                  {perm.issue_date && (
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ✓ Cleared on {new Date(perm.issue_date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Client Document Requests from Admin */}
          <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Required Documents for Building Permit Issuance
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-mono uppercase">
                  Ownership Verification &amp; Tax Documents
                </h3>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-white/5">
              {clientRequests.map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">{req.title}</p>
                    <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">{req.defaultNote || req.note}</p>
                  </div>

                  <div>
                    {req.status === "uploaded" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" />
                        Uploaded &amp; Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveUploadRequest(req)}
                        className="px-3.5 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

            {/* Ground Breaking Ceremony Scheduler Card */}
            <div className="p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Physical Site Kickoff
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  BULACAN TRADITION
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Ground Breaking Ceremony Date
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Select your auspicious date for site blessing, priest invocation, and ceremonial golden shovel turning with MCPA engineers.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Selected Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={groundbreakingDate}
                  onChange={(e) => setGroundbreakingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 block font-bold">
                    Countdown to Shovel-in-Ground
                  </span>
                  <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m remaining
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingGroundbreaking(true);
                    setTimeout(() => {
                      setIsSavingGroundbreaking(false);
                      showToast?.("Ground Breaking Date locked & site team alerted!");
                    }, 800);
                  }}
                  disabled={isSavingGroundbreaking}
                  className="px-3.5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSavingGroundbreaking ? "Locking..." : "Lock In Date"}
                </button>
              </div>
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
          requestDetails={activeUploadRequest}
          currentUser={currentUser}
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
    </div>
  );
}
