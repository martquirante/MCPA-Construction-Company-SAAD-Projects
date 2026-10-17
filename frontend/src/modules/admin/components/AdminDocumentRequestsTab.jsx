"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Trash2,
  Shield,
  Building,
  User,
  ArrowRight,
  Eye,
  Check,
  Send,
  X,
  FileCheck,
  Building2,
  FolderKanban,
  Sparkles,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  STANDARD_REQUEST_DOCUMENTS,
  STANDARD_MCPA_TRANSMITTALS,
  loadDocumentRequests,
  saveDocumentRequests,
  loadAdminTransmittals,
  saveAdminTransmittals,
  formatFileSize,
  formatDocDate,
} from "@/modules/portal/utils/documentRequestsHelper";
import DocumentUploadModal from "@/modules/shared/DocumentUploadModal";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";
import AdminEmptyState from "@/modules/admin/components/AdminEmptyState";
import { authFetch } from "@/modules/shared/authFetch";

function ClientAvatarBadge({ client, sizeClasses = "w-7 h-7", textClasses = "text-[10px]" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc = client?.avatar || client?.avatar_url || client?.clientAvatar;

  useEffect(() => {
    setImgFailed(false);
  }, [avatarSrc]);

  const initials = useMemo(() => {
    const rawName = client?.name || client?.clientName || "Client";
    return (
      rawName
        .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "CL"
    );
  }, [client?.name, client?.clientName]);

  return (
    <div
      className={`${sizeClasses} rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold ${textClasses} flex items-center justify-center shrink-0 font-mono overflow-hidden shadow-xs`}
    >
      {avatarSrc && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt={client?.name || client?.clientName || "Client"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default function AdminDocumentRequestsTab({
  clientBriefs = [],
  currentUser = null,
  showToast = () => {},
}) {
  // State for Document Requests & MCPA Transmittals
  const [requests, setRequests] = useState([]);
  const [transmittals, setTransmittals] = useState([]);
  const [dbClients, setDbClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "uploaded" | "verified" | "transmittals"
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"

  // Modal 1: Request Document from Client
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [targetClientBriefId, setTargetClientBriefId] = useState(""); // Blank initially, no auto-select
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedDocTemplate, setSelectedDocTemplate] = useState("tct");
  const [customDocTitle, setCustomDocTitle] = useState("");
  const [customDocCategory, setCustomDocCategory] = useState("Lot & Ownership");
  const [requestNote, setRequestNote] = useState("");
  const [requestUrgency, setRequestUrgency] = useState("Urgent");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef(null);
  const [isClientComboboxOpen, setIsClientComboboxOpen] = useState(false);
  const clientComboboxRef = useRef(null);

  // Modal 2: Direct Upload from MCPA
  const [isDirectUploadFormOpen, setIsDirectUploadFormOpen] = useState(false);
  const [directUploadClientBriefId, setDirectUploadClientBriefId] = useState(""); // Blank initially, no auto-select
  const [directClientSearchQuery, setDirectClientSearchQuery] = useState("");
  const [selectedTransmittalTemplate, setSelectedTransmittalTemplate] = useState("quotation_index");
  const [customTransmittalTitle, setCustomTransmittalTitle] = useState("");
  const [customTransmittalCategory, setCustomTransmittalCategory] = useState("Financial & Estimation");
  const [transmittalNote, setTransmittalNote] = useState("");
  const [isTransmittalComboboxOpen, setIsTransmittalComboboxOpen] = useState(false);
  const transmittalComboboxRef = useRef(null);
  const [isDirectClientComboboxOpen, setIsDirectClientComboboxOpen] = useState(false);
  const directClientComboboxRef = useRef(null);

  // Active Upload Animation Modal (for Admin direct upload)
  const [isUploadAnimationModalOpen, setIsUploadAnimationModalOpen] = useState(false);
  const [pendingUploadPayload, setPendingUploadPayload] = useState(null);

  // Close comboboxes when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setIsComboboxOpen(false);
      }
      if (transmittalComboboxRef.current && !transmittalComboboxRef.current.contains(e.target)) {
        setIsTransmittalComboboxOpen(false);
      }
      if (clientComboboxRef.current && !clientComboboxRef.current.contains(e.target)) {
        setIsClientComboboxOpen(false);
      }
      if (directClientComboboxRef.current && !directClientComboboxRef.current.contains(e.target)) {
        setIsDirectClientComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch full overview from backend
  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("/api/admin/documents/overview");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.clients)) {
          setDbClients(data.clients);
        }
        if (Array.isArray(data?.requests)) {
          const formatted = data.requests.map((r) => ({
            id: r.request_id || r.id,
            requestId: r.request_id,
            projectId: r.client_project_id,
            title: r.title,
            category: r.category,
            urgency: r.urgency,
            note: r.instructions || r.note,
            status: r.status,
            clientName: r.client_name,
            clientEmail: r.client_email,
            clientAvatar: r.client_avatar,
            projectCode: r.project_code,
            projectType: r.project_type,
            requestedBy: r.requester_name || "Admin",
            requestedAt: r.created_at,
            file: r.file_url ? {
              fileName: r.file_name,
              fileSize: r.file_size_bytes,
              fileUrl: r.file_url,
              uploadedAt: r.uploaded_at,
            } : null,
          }));
          setRequests(formatted);
          saveDocumentRequests(formatted);
        }
        if (Array.isArray(data?.transmittals)) {
          const formattedTxs = data.transmittals.map((t) => ({
            id: t.transmittal_id || t.id,
            transmittalId: t.transmittal_id,
            projectId: t.client_project_id,
            title: t.title,
            category: t.category,
            fileName: t.file_name,
            fileSize: t.file_size_bytes,
            fileUrl: t.file_url,
            mimeType: t.mime_type,
            note: t.remarks,
            issuedBy: t.transmitter_name || "MCPA Engineering",
            issuedAt: t.created_at,
            clientName: t.client_name,
            clientEmail: t.client_email,
            clientAvatar: t.client_avatar,
            projectCode: t.project_code,
            projectType: t.project_type,
          }));
          setTransmittals(formattedTxs);
          saveAdminTransmittals(formattedTxs);
        }
      }
    } catch (err) {
      console.warn("fetchOverview fallback to local storage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount & listen to cross-tab updates
  useEffect(() => {
    const initialReqs = loadDocumentRequests();
    const initialTxs = loadAdminTransmittals();
    if (initialReqs?.length > 0) setRequests(initialReqs);
    if (initialTxs?.length > 0) setTransmittals(initialTxs);

    fetchOverview();

    const handleRequestsUpdate = () => {
      fetchOverview();
    };

    const handleStorageChange = (e) => {
      if (e.key === "mcpa_document_requests" || e.key === "mcpa_admin_transmittals") {
        fetchOverview();
      }
    };

    window.addEventListener("mcpa-document-requests-updated", handleRequestsUpdate);
    window.addEventListener("mcpa-admin-transmittals-updated", handleRequestsUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("mcpa-document-requests-updated", handleRequestsUpdate);
      window.removeEventListener("mcpa-admin-transmittals-updated", handleRequestsUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Update default note when template changes
  useEffect(() => {
    const found = STANDARD_REQUEST_DOCUMENTS.find((d) => d.id === selectedDocTemplate);
    if (found) {
      setCustomDocCategory(found.category);
      setRequestUrgency(found.urgency);
      setRequestNote(found.defaultNote);
      if (found.id !== "others") {
        setCustomDocTitle("");
      }
    }
  }, [selectedDocTemplate]);

  useEffect(() => {
    const found = STANDARD_MCPA_TRANSMITTALS.find((d) => d.id === selectedTransmittalTemplate);
    if (found) {
      setCustomTransmittalCategory(found.category);
      setTransmittalNote(found.defaultNote);
      if (found.id !== "others_mcpa") {
        setCustomTransmittalTitle("");
      }
    }
  }, [selectedTransmittalTemplate]);

  // Unified client options prioritized by real database projects
  const clientOptions = useMemo(() => {
    if (Array.isArray(dbClients) && dbClients.length > 0) {
      return dbClients.map((c) => ({
        id: String(c.client_project_id || c.project_id || c.id),
        projectId: c.client_project_id || c.project_id,
        userId: c.user_id,
        name: c.client_name || c.full_name || "Valued Client",
        email: c.client_email || c.email || "",
        code: c.project_code || "MCPA-PRJ-2026",
        projectType: c.project_type || "Residential Design & Build",
        avatar: c.avatar_url || resolveClientAvatar(c),
        location: c.location || "",
      }));
    }
    if (Array.isArray(clientBriefs) && clientBriefs.length > 0) {
      return clientBriefs.map((b) => ({
        id: String(b.client_project_id || b.id || b.submissionId || b.trackingId),
        projectId: b.client_project_id || b.id,
        userId: b.user_id,
        name: b.clientName || b.fullName || "Valued Client",
        email: b.clientEmail || b.email || "",
        code: b.project_code || b.projectCode || b.submissionId || b.trackingId || "MCPA-PRJ-2026",
        projectType: b.projectType || "Residential Design & Build",
        avatar: resolveClientAvatar(b),
        location: b.targetLocation || b.location || "",
      }));
    }
    return [];
  }, [dbClients, clientBriefs]);

  // Selected clients (defaults to null if not yet picked by user)
  const selectedTargetClient = useMemo(() => {
    if (!targetClientBriefId) return null;
    return clientOptions.find((c) => String(c.id) === String(targetClientBriefId)) || null;
  }, [clientOptions, targetClientBriefId]);

  const selectedDirectTargetClient = useMemo(() => {
    if (!directUploadClientBriefId) return null;
    return clientOptions.find((c) => String(c.id) === String(directUploadClientBriefId)) || null;
  }, [clientOptions, directUploadClientBriefId]);

  // Filtered client options for combobox searches
  const filteredClientOptions = useMemo(() => {
    if (!clientSearchQuery.trim()) return clientOptions;
    const q = clientSearchQuery.toLowerCase().trim();
    return clientOptions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.projectType.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }, [clientOptions, clientSearchQuery]);

  const filteredDirectClientOptions = useMemo(() => {
    if (!directClientSearchQuery.trim()) return clientOptions;
    const q = directClientSearchQuery.toLowerCase().trim();
    return clientOptions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.projectType.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }, [clientOptions, directClientSearchQuery]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    if (activeFilter === "pending") {
      list = list.filter((r) => r.status === "pending");
    } else if (activeFilter === "uploaded") {
      list = list.filter((r) => r.status === "uploaded");
    } else if (activeFilter === "verified") {
      list = list.filter((r) => r.status === "verified");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.clientName?.toLowerCase().includes(q) ||
          r.projectCode?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [requests, activeFilter, searchQuery]);

  // Filtered MCPA Transmittals
  const filteredTransmittals = useMemo(() => {
    let list = [...transmittals];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.clientName?.toLowerCase().includes(q) ||
          t.projectCode?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transmittals, searchQuery]);

  // Metrics counts
  const pendingCount = useMemo(() => requests.filter((r) => r.status === "pending").length, [requests]);
  const uploadedCount = useMemo(() => requests.filter((r) => r.status === "uploaded").length, [requests]);
  const verifiedCount = useMemo(() => requests.filter((r) => r.status === "verified").length, [requests]);

  // Handle Create Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedTargetClient) {
      showToast?.("Please select a target client portal first.", "error");
      return;
    }

    const selectedTemplate = STANDARD_REQUEST_DOCUMENTS.find((d) => d.id === selectedDocTemplate);
    const finalTitle =
      selectedDocTemplate === "others"
        ? customDocTitle.trim() || "Custom Required Document"
        : selectedTemplate?.title || "Required Document";

    const projectId = selectedTargetClient.projectId || selectedTargetClient.id;

    try {
      const res = await authFetch("/api/admin/documents/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: finalTitle,
          category: customDocCategory || selectedTemplate?.category || "General",
          urgency: requestUrgency,
          instructions: requestNote.trim() || selectedTemplate?.defaultNote || "Required by MCPA administration.",
        }),
      });

      const data = await res.json().catch(() => ({}));
      const serverReq = data?.request;

      const newRequest = {
        id: serverReq?.request_id || `req-${Date.now()}`,
        requestId: serverReq?.request_id,
        projectId,
        title: finalTitle,
        category: customDocCategory || selectedTemplate?.category || "General",
        clientName: selectedTargetClient.name,
        clientEmail: selectedTargetClient.email,
        clientAvatar: selectedTargetClient.avatar,
        projectCode: selectedTargetClient.code,
        projectType: selectedTargetClient.projectType,
        urgency: requestUrgency,
        note: requestNote.trim() || selectedTemplate?.defaultNote || "Required by MCPA administration.",
        requestedBy: currentUser?.fullName || currentUser?.name || "Engr. Raymart Quirante (Admin)",
        requestedAt: new Date().toISOString(),
        status: "pending",
        file: null,
      };

      const updated = [newRequest, ...requests];
      setRequests(updated);
      saveDocumentRequests(updated);

      // Trigger cross-tab sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mcpa-document-requests-updated", { detail: { requests: updated } }));
      }

      setIsRequestModalOpen(false);
      setTargetClientBriefId("");
      showToast?.(`Document requested from ${selectedTargetClient.name}: "${finalTitle}"`);
      fetchOverview();
    } catch (err) {
      console.error("Create request error:", err);
      showToast?.(err.message || "Failed to create document request", "error");
    }
  };

  // Open Direct Upload Form (Step 1 -> leads to Step 2 Upload Animation Modal)
  const handleProceedToDirectUpload = (e) => {
    e.preventDefault();
    if (!selectedDirectTargetClient) {
      showToast?.("Please select a target client portal first.", "error");
      return;
    }

    const selectedTemplate = STANDARD_MCPA_TRANSMITTALS.find((d) => d.id === selectedTransmittalTemplate);
    const finalTitle =
      selectedTransmittalTemplate === "others_mcpa"
        ? customTransmittalTitle.trim() || "Official MCPA Document"
        : selectedTemplate?.title || "Official MCPA Transmittal";

    setPendingUploadPayload({
      title: finalTitle,
      category: customTransmittalCategory || selectedTemplate?.category || "MCPA Transmittal",
      client: selectedDirectTargetClient,
      note: transmittalNote.trim() || selectedTemplate?.defaultNote || "Official document from MCPA.",
    });

    setIsDirectUploadFormOpen(false);
    setIsUploadAnimationModalOpen(true);
  };

  // Complete Direct Upload after 0-100% progress animation
  const handleDirectUploadSuccess = async (uploadedFile) => {
    if (!pendingUploadPayload) return;

    const targetClient = pendingUploadPayload.client;
    const projectId = targetClient.projectId || targetClient.id;

    try {
      const res = await authFetch("/api/admin/documents/transmittals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: pendingUploadPayload.title,
          category: pendingUploadPayload.category,
          fileUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName,
          fileSizeBytes: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
          remarks: pendingUploadPayload.note,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const serverTx = data?.transmittal;

      const newTransmittal = {
        id: serverTx?.transmittal_id || `tx-${Date.now()}`,
        transmittalId: serverTx?.transmittal_id,
        projectId,
        title: pendingUploadPayload.title,
        category: pendingUploadPayload.category,
        clientName: targetClient.name,
        clientEmail: targetClient.email,
        clientAvatar: targetClient.avatar,
        projectCode: targetClient.code,
        projectType: targetClient.projectType,
        note: pendingUploadPayload.note,
        issuedBy: currentUser?.fullName || currentUser?.name || "MCPA Central Engineering Desk",
        issuedAt: new Date().toISOString(),
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
      };

      const updated = [newTransmittal, ...transmittals];
      setTransmittals(updated);
      saveAdminTransmittals(updated);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mcpa-admin-transmittals-updated", { detail: { transmittals: updated } }));
      }

      setIsUploadAnimationModalOpen(false);
      setPendingUploadPayload(null);
      setDirectUploadClientBriefId("");
      showToast?.(`Document successfully transmitted to ${targetClient.name}!`);
      fetchOverview();
    } catch (err) {
      console.error("Direct upload error:", err);
      showToast?.(err.message || "Failed to save transmittal", "error");
    }
  };

  // Mark Request as Verified / Approved
  const handleVerifyRequest = async (requestId) => {
    const req = requests.find((r) => r.id === requestId);
    const updated = requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: "verified",
          verified: true,
          verifiedAt: new Date().toISOString(),
          verifiedBy: currentUser?.fullName || currentUser?.name || "Engr. Raymart Quirante",
        };
      }
      return r;
    });
    setRequests(updated);
    saveDocumentRequests(updated);

    if (req?.file?.fileUrl || req?.requestId) {
      try {
        await authFetch(`/api/admin/documents/${req?.requestId || requestId}/verify`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Verified" }),
        });
      } catch (err) {
        console.warn("Backend verify sync:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mcpa-document-requests-updated", { detail: { requests: updated } }));
    }

    showToast?.("Document verified and approved by MCPA!");
    fetchOverview();
  };

  // Delete Request
  const handleDeleteRequest = async (requestId) => {
    if (!confirm("Are you sure you want to delete this document request?")) return;
    const req = requests.find((r) => r.id === requestId);
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    saveDocumentRequests(updated);

    const backendId = req?.requestId || (typeof requestId === "number" ? requestId : null);
    if (backendId) {
      try {
        await authFetch(`/api/admin/documents/requests/${backendId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Backend delete request:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mcpa-document-requests-updated", { detail: { requests: updated } }));
    }
    showToast?.("Document request has been removed.");
  };

  // Delete Transmittal
  const handleDeleteTransmittal = async (txId) => {
    if (!confirm("Are you sure you want to remove this official MCPA transmittal record?")) return;
    const tx = transmittals.find((t) => t.id === txId);
    const updated = transmittals.filter((t) => t.id !== txId);
    setTransmittals(updated);
    saveAdminTransmittals(updated);

    const backendId = tx?.transmittalId || (typeof txId === "number" ? txId : null);
    if (backendId) {
      try {
        await authFetch(`/api/admin/documents/transmittals/${backendId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Backend delete transmittal:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mcpa-admin-transmittals-updated", { detail: { transmittals: updated } }));
    }
    showToast?.("MCPA transmittal record has been removed.");
  };

  const selectedTemplateObj = STANDARD_REQUEST_DOCUMENTS.find((d) => d.id === selectedDocTemplate);
  const selectedTransmittalTemplateObj = STANDARD_MCPA_TRANSMITTALS.find((d) => d.id === selectedTransmittalTemplate);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & METRICS */}
      <div className="p-5 sm:p-6 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Document Vault &amp; Requests Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
            Client Document Requests
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans mt-1 max-w-3xl leading-relaxed">
            Request official land titles, clearances, and tax declarations from clients, or transmit blueprints, quotations, and signed contracts directly to client portals.
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Request Document</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDirectUploadFormOpen(true)}
            className="px-4 py-2.5 rounded-[4px] bg-white dark:bg-[#181a24] hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Upload Transmittal</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Total Client Requests</div>
          <div className="text-2xl font-mono font-bold text-neutral-900 dark:text-white mt-1 tabular-nums">
            {requests.length}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Across all consultation leads</div>
        </div>

        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-amber-500 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Awaiting Client Upload
          </div>
          <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Action needed from client</div>
        </div>

        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-emerald-500 font-bold flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            Ready for Review
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {uploadedCount}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Uploaded by client</div>
        </div>

        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-blue-500 font-bold flex items-center gap-1">
            <Building className="w-3 h-3" />
            MCPA Transmittals
          </div>
          <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {transmittals.length}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Issued to client portal</div>
        </div>
      </div>

      {/* 3. FILTER TABS, SEARCH, AND VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-white/5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeFilter === "all"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            All Requests ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("pending")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeFilter === "pending"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            Awaiting Upload ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("uploaded")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeFilter === "uploaded"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            Ready for Review ({uploadedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("transmittals")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeFilter === "transmittals"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            MCPA Issued ({transmittals.length})
          </button>
        </div>

        {/* Right Section: Search & View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document, client, or code..."
              className="w-full pl-9 pr-3 py-1.5 rounded-[4px] bg-white dark:bg-[#101218] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Grid / Table Toggle */}
          <div className="inline-flex items-center bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#1c1f2b] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENT LIST: REQUESTS OR MCPA TRANSMITTALS */}
      {activeFilter === "transmittals" ? (
        /* MCPA TRANSMITTALS SECTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
              Official MCPA Issued Transmittals ({filteredTransmittals.length})
            </h3>
          </div>

          {filteredTransmittals.length === 0 ? (
            searchQuery.trim() ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/msoeawqm.json"
                fallback={Search}
                badgeText="Transmittal Search"
                title="No Matching Transmittals"
                description={`No transmitted documents found matching "${searchQuery}". Try searching by client name, project code, or document title.`}
                actionButton={
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                }
              />
            ) : (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/smwmetfi.json"
                fallback={Upload}
                badgeText="Transmittal Vault Standby"
                title="No MCPA Transmittals Issued Yet"
                description="Transmit blueprints, architectural quotations, or signed construction agreements directly to the client's portal."
                colors="primary:#d97706,secondary:#0284c7"
                size={84}
                actionButton={
                  <button
                    type="button"
                    onClick={() => setIsDirectUploadFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Transmittal</span>
                  </button>
                }
              />
            )
          ) : viewMode === "table" ? (
            /* MCPA TRANSMITTALS TABLE VIEW */
            <div className="overflow-x-auto rounded-[8px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Document &amp; Category</th>
                    <th className="py-3 px-4 font-bold">Client / Project</th>
                    <th className="py-3 px-4 font-bold">Attachment</th>
                    <th className="py-3 px-4 font-bold">Issued By &amp; Date</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5 font-sans">
                  {filteredTransmittals.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            {tx.category}
                          </span>
                          <p className="font-bold text-neutral-900 dark:text-white leading-tight">
                            {tx.title}
                          </p>
                          {tx.note && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                              {tx.note}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ClientAvatarBadge client={{ name: tx.clientName, avatar: tx.clientAvatar }} sizeClasses="w-7 h-7" />
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-neutral-900 dark:text-white truncate">
                              {tx.clientName}
                            </p>
                            <p className="text-[11px] font-mono text-neutral-400 truncate">
                              {tx.projectCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-neutral-900 dark:text-white truncate max-w-[180px]">
                              {tx.fileName}
                            </p>
                            <p className="text-[10px] font-mono text-neutral-400">
                              {formatFileSize(tx.fileSize)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px] text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                        <p>{formatDocDate(tx.issuedAt)}</p>
                        <p className="text-[10px] text-neutral-400 font-sans truncate max-w-[160px]">
                          {tx.issuedBy}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={tx.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-[4px] bg-neutral-100 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold transition-colors inline-flex items-center gap-1"
                            title="View File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransmittal(tx.id)}
                            className="p-1.5 rounded-[4px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Transmittal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* MCPA TRANSMITTALS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTransmittals.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          {tx.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">{tx.projectCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransmittal(tx.id)}
                        className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove transmittal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{tx.title}</h4>
                    {tx.note && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans line-clamp-2">
                        {tx.note}
                      </p>
                    )}
                  </div>

                  {/* Target Client & File Details */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <ClientAvatarBadge client={{ name: tx.clientName, avatar: tx.clientAvatar }} sizeClasses="w-6 h-6" />
                        <span className="font-bold text-neutral-900 dark:text-white truncate">{tx.clientName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {formatDocDate(tx.issuedAt)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[6px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                            {tx.fileName}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400">
                            {formatFileSize(tx.fileSize)}
                          </p>
                        </div>
                      </div>

                      <a
                        href={tx.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CLIENT DOCUMENT REQUESTS SECTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
              Active Client Document Requests ({filteredRequests.length})
            </h3>
          </div>

          {filteredRequests.length === 0 ? (
            searchQuery.trim() || activeFilter !== "all" ? (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/msoeawqm.json"
                fallback={Search}
                badgeText="Filter / Search Active"
                title="No Matching Document Requests"
                description={`No document requests match your current filters${searchQuery ? ` ("${searchQuery}")` : ""}. Try selecting "All Requests" or clearing your search.`}
                actionButton={
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="px-4 py-2 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Clear Filter &amp; Search
                  </button>
                }
              />
            ) : (
              <AdminEmptyState
                iconSrc="https://cdn.lordicon.com/nocovwne.json"
                fallback={FileText}
                badgeText="Document Vault Standby"
                title="No Document Requests Found"
                description="Click &quot;Request Document&quot; above to request required land titles, tax declarations, or barangay construction clearances from the client."
                colors="primary:#d97706,secondary:#0284c7"
                size={84}
                actionButton={
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Request First Document</span>
                  </button>
                }
              />
            )
          ) : viewMode === "table" ? (
            /* CLIENT DOCUMENT REQUESTS TABLE VIEW */
            <div className="overflow-x-auto rounded-[8px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Document &amp; Category</th>
                    <th className="py-3 px-4 font-bold">Client / Project</th>
                    <th className="py-3 px-4 font-bold">Urgency</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Attachment</th>
                    <th className="py-3 px-4 font-bold">Requested Date</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5 font-sans">
                  {filteredRequests.map((req) => {
                    const isPending = req.status === "pending";
                    const isUploaded = req.status === "uploaded";
                    const isVerified = req.status === "verified";

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              {req.category}
                            </span>
                            <p className="font-bold text-neutral-900 dark:text-white leading-tight">
                              {req.title}
                            </p>
                            {req.note && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Note: </span>
                                {req.note}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ClientAvatarBadge client={{ name: req.clientName, avatar: req.clientAvatar }} sizeClasses="w-7 h-7" />
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-bold text-neutral-900 dark:text-white truncate">
                                {req.clientName}
                              </p>
                              <p className="text-[11px] font-mono text-neutral-400 truncate">
                                {req.projectCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider ${
                              req.urgency?.toLowerCase().includes("urgent")
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              isVerified
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : isUploaded
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                                : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </>
                            ) : isUploaded ? (
                              <>
                                <FileCheck className="w-3 h-3" />
                                <span>Uploaded</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 min-w-[200px]">
                          {req.file ? (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-mono font-bold text-neutral-900 dark:text-white truncate max-w-[160px]">
                                  {req.file.fileName}
                                </p>
                                <p className="text-[10px] font-mono text-neutral-400">
                                  {formatFileSize(req.file.fileSize)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Awaiting client</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 min-w-[140px] text-neutral-600 dark:text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDocDate(req.requestedAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.file && (
                              <a
                                href={req.file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-[4px] bg-neutral-100 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 transition-colors inline-flex items-center"
                                title="View Document"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {req.file && !isVerified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyRequest(req.id)}
                                className="px-2.5 py-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Approve & Verify"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1.5 rounded-[4px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CLIENT DOCUMENT REQUESTS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((req) => {
                const isPending = req.status === "pending";
                const isUploaded = req.status === "uploaded";
                const isVerified = req.status === "verified";

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    {/* Header: Category & Status */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span className="text-amber-600 dark:text-amber-400">
                            {req.category}
                          </span>
                          {req.urgency && (
                            <>
                              <span className="text-neutral-400 dark:text-neutral-600">•</span>
                              <span
                                className={
                                  req.urgency?.toLowerCase().includes("urgent")
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-neutral-500 dark:text-neutral-400"
                                }
                              >
                                {req.urgency}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
                            isVerified
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : isUploaded
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </>
                          ) : isUploaded ? (
                            <>
                              <FileCheck className="w-3 h-3" />
                              <span>Uploaded</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                        {req.title}
                      </h4>

                      {req.note && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans line-clamp-2">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            Instructions:{" "}
                          </span>
                          {req.note}
                        </p>
                      )}
                    </div>

                    {/* Middle: Target Client Profile */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <ClientAvatarBadge client={{ name: req.clientName, avatar: req.clientAvatar }} sizeClasses="w-7 h-7" />
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-white truncate">
                            {req.clientName}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 truncate">
                            {req.projectCode}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {formatDocDate(req.requestedAt)}
                      </span>
                    </div>

                    {/* Bottom: Client Uploaded File Details or Action */}
                    <div className="pt-2">
                      {req.file ? (
                        <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                                  {req.file.fileName}
                                </p>
                                <p className="text-[10px] font-mono text-neutral-400">
                                  {formatFileSize(req.file.fileSize)} · {formatDocDate(req.file.uploadedAt)}
                                </p>
                              </div>
                            </div>

                            <a
                              href={req.file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 transition-colors"
                              title="View file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Verify / Approve Action Button for Admin */}
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerifyRequest(req.id)}
                              className="w-full mt-1 px-3 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Verified &amp; Approved</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-[6px] bg-amber-500/[0.05] border border-dashed border-amber-500/20 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting client upload in portal
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                            title="Cancel request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REQUEST A DOCUMENT FROM CLIENT (WITH COMBOBOX SUGGESTIONS)       */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[12px] bg-white dark:bg-[#11131a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-200 dark:border-white/10 shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Request Document from Client</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  This request will appear in the client portal for prompt review and upload.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateRequest} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* TARGET CLIENT COMBOBOX (Custom UI with Client Avatar & Project Code) */}
              <div className="space-y-1.5 relative" ref={clientComboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Target Client Portal</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    recipient
                  </span>
                </label>

                {/* Combobox Trigger */}
                <button
                  type="button"
                  onClick={() => setIsClientComboboxOpen(!isClientComboboxOpen)}
                  className={`w-full px-3 py-2.5 rounded-[8px] bg-neutral-100 dark:bg-[#181a24] border text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all shadow-xs ${
                    isClientComboboxOpen
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : selectedTargetClient
                      ? "border-neutral-300 dark:border-white/10 hover:border-amber-500"
                      : "border-dashed border-neutral-300 dark:border-white/20 hover:border-amber-500"
                  }`}
                >
                  {selectedTargetClient ? (
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <ClientAvatarBadge client={selectedTargetClient} sizeClasses="w-8 h-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-sans text-xs text-neutral-900 dark:text-white truncate">
                            {selectedTargetClient.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                            {selectedTargetClient.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                          {selectedTargetClient.projectType}
                          {selectedTargetClient.location ? ` · ${selectedTargetClient.location}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500 py-0.5">
                      <div className="w-7 h-7 rounded-full border border-dashed border-neutral-300 dark:border-white/20 flex items-center justify-center bg-neutral-200/40 dark:bg-white/[0.03]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-xs font-medium">Select target client portal...</span>
                    </div>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${
                      isClientComboboxOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Options */}
                {isClientComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-40 rounded-[10px] bg-white dark:bg-[#151722] border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-72 flex flex-col divide-y divide-neutral-100 dark:divide-white/5 animate-in fade-in duration-150">
                    <div className="p-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-100 dark:border-white/5 space-y-2 shrink-0">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400 font-bold px-0.5">
                        <span>Select Target Client</span>
                        <span className="text-amber-500 font-semibold">{filteredClientOptions.length} Available</span>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search by client name, code, or type..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 rounded-[6px] bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {clientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setClientSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
                      {filteredClientOptions.length === 0 ? (
                        <div className="p-6 text-center text-xs font-mono text-neutral-400">
                          No clients match &quot;{clientSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredClientOptions.map((c) => {
                          const isSelected = String(c.id) === String(targetClientBriefId);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setTargetClientBriefId(c.id);
                                setIsClientComboboxOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-3 hover:bg-amber-500/10 transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500/15 text-neutral-900 dark:text-white"
                                  : "text-neutral-800 dark:text-neutral-200"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <ClientAvatarBadge client={c} sizeClasses="w-8 h-8" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-neutral-900 dark:text-white truncate font-sans">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                      {c.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans truncate">
                                    {c.projectType}
                                    {c.location ? ` · ${c.location}` : ""}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* DOCUMENT SUGGESTION COMBOBOX */}
              <div className="space-y-1.5 relative" ref={comboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Document to Request</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    select or choose custom
                  </span>
                </label>

                {/* Combobox Trigger */}
                <button
                  type="button"
                  onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                  className="w-full px-3 py-2.5 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="font-bold truncate">
                    {selectedTemplateObj?.title || "Select a Document"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      isComboboxOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Combobox Dropdown Options */}
                {isComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-[8px] bg-white dark:bg-[#151722] border border-neutral-300 dark:border-white/15 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-neutral-100 dark:border-white/5 text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      Standard Construction &amp; Legal Documents
                    </div>
                    {STANDARD_REQUEST_DOCUMENTS.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDocTemplate(doc.id);
                          setIsComboboxOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs font-mono flex items-center justify-between hover:bg-amber-500/10 transition-colors cursor-pointer ${
                          selectedDocTemplate === doc.id
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold"
                            : "text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold">{doc.title}</p>
                          <p className="text-[10px] text-neutral-400 font-sans truncate">
                            {doc.category} · {doc.urgency}
                          </p>
                        </div>
                        {selectedDocTemplate === doc.id && (
                          <Check className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CUSTOM DOCUMENT TITLE (If "Others" is selected) */}
              {selectedDocTemplate === "others" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                    Custom Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={customDocTitle}
                    onChange={(e) => setCustomDocTitle(e.target.value)}
                    placeholder="e.g., Water District Clearance / HOA Development Permit"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Category & Urgency Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={customDocCategory}
                    onChange={(e) => setCustomDocCategory(e.target.value)}
                    placeholder="e.g., Lot & Ownership"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                    Urgency Level
                  </label>
                  <select
                    value={requestUrgency}
                    onChange={(e) => setRequestUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Urgent">Urgent (Immediate Requirement)</option>
                    <option value="Required for Phase 2">Required for Phase 2</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* Instructions / Notes for Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Instructions &amp; Requirements for Client
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Explain why this document is required or specify which pages are needed..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-mono text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIRECT UPLOAD FROM MCPA (STEP 1: SELECT DOCUMENT & DETAILS)     */}
      {/* ========================================================================= */}
      {isDirectUploadFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[12px] bg-white dark:bg-[#11131a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-200 dark:border-white/10 shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>Direct Upload from MCPA</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                  Upload official plans, quotations, or contracts directly to the client&apos;s portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectUploadFormOpen(false)}
                className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProceedToDirectUpload} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* TARGET CLIENT COMBOBOX (Custom UI with Client Avatar & Project Code) */}
              <div className="space-y-1.5 relative" ref={directClientComboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Target Client Portal</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    recipient
                  </span>
                </label>

                {/* Combobox Trigger */}
                <button
                  type="button"
                  onClick={() => setIsDirectClientComboboxOpen(!isDirectClientComboboxOpen)}
                  className={`w-full px-3 py-2.5 rounded-[8px] bg-neutral-100 dark:bg-[#181a24] border text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all shadow-xs ${
                    isDirectClientComboboxOpen
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : selectedDirectTargetClient
                      ? "border-neutral-300 dark:border-white/10 hover:border-amber-500"
                      : "border-dashed border-neutral-300 dark:border-white/20 hover:border-amber-500"
                  }`}
                >
                  {selectedDirectTargetClient ? (
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <ClientAvatarBadge client={selectedDirectTargetClient} sizeClasses="w-8 h-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-sans text-xs text-neutral-900 dark:text-white truncate">
                            {selectedDirectTargetClient.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                            {selectedDirectTargetClient.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                          {selectedDirectTargetClient.projectType}
                          {selectedDirectTargetClient.location ? ` · ${selectedDirectTargetClient.location}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500 py-0.5">
                      <div className="w-7 h-7 rounded-full border border-dashed border-neutral-300 dark:border-white/20 flex items-center justify-center bg-neutral-200/40 dark:bg-white/[0.03]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-xs font-medium">Select target client portal...</span>
                    </div>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${
                      isDirectClientComboboxOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Options */}
                {isDirectClientComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-40 rounded-[10px] bg-white dark:bg-[#151722] border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-72 flex flex-col divide-y divide-neutral-100 dark:divide-white/5 animate-in fade-in duration-150">
                    <div className="p-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-100 dark:border-white/5 space-y-2 shrink-0">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400 font-bold px-0.5">
                        <span>Select Target Client</span>
                        <span className="text-amber-500 font-semibold">{filteredDirectClientOptions.length} Available</span>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search by client name, code, or type..."
                          value={directClientSearchQuery}
                          onChange={(e) => setDirectClientSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 rounded-[6px] bg-white dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {directClientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDirectClientSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
                      {filteredDirectClientOptions.length === 0 ? (
                        <div className="p-6 text-center text-xs font-mono text-neutral-400">
                          No clients match &quot;{directClientSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredDirectClientOptions.map((c) => {
                          const isSelected = String(c.id) === String(directUploadClientBriefId);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setDirectUploadClientBriefId(c.id);
                                setIsDirectClientComboboxOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-3 hover:bg-amber-500/10 transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500/15 text-neutral-900 dark:text-white"
                                  : "text-neutral-800 dark:text-neutral-200"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <ClientAvatarBadge client={c} sizeClasses="w-8 h-8" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-neutral-900 dark:text-white truncate font-sans">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                      {c.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans truncate">
                                    {c.projectType}
                                    {c.location ? ` · ${c.location}` : ""}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MCPA TRANSMITTAL SUGGESTION COMBOBOX */}
              <div className="space-y-1.5 relative" ref={transmittalComboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Document Type / Title</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    standard or custom
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsTransmittalComboboxOpen(!isTransmittalComboboxOpen)}
                  className="w-full px-3 py-2.5 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="font-bold truncate">
                    {selectedTransmittalTemplateObj?.title || "Select MCPA Transmittal"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      isTransmittalComboboxOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isTransmittalComboboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-[8px] bg-white dark:bg-[#151722] border border-neutral-300 dark:border-white/15 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-neutral-100 dark:border-white/5 text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      Standard MCPA Transmittal Packages
                    </div>
                    {STANDARD_MCPA_TRANSMITTALS.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedTransmittalTemplate(doc.id);
                          setIsTransmittalComboboxOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs font-mono flex items-center justify-between hover:bg-amber-500/10 transition-colors cursor-pointer ${
                          selectedTransmittalTemplate === doc.id
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold"
                            : "text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold">{doc.title}</p>
                          <p className="text-[10px] text-neutral-400 font-sans truncate">
                            {doc.category}
                          </p>
                        </div>
                        {selectedTransmittalTemplate === doc.id && (
                          <Check className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CUSTOM TITLE (If "Others" selected) */}
              {selectedTransmittalTemplate === "others_mcpa" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                    Custom Transmittal Title
                  </label>
                  <input
                    type="text"
                    required
                    value={customTransmittalTitle}
                    onChange={(e) => setCustomTransmittalTitle(e.target.value)}
                    placeholder="e.g., Geotechnical Report & Topographic Map"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={customTransmittalCategory}
                  onChange={(e) => setCustomTransmittalCategory(e.target.value)}
                  placeholder="e.g., Architectural Drawings"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Remarks / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Transmittal Remarks
                </label>
                <textarea
                  rows={3}
                  value={transmittalNote}
                  onChange={(e) => setTransmittalNote(e.target.value)}
                  placeholder="e.g., Official preliminary schematics and bill of quantities prepared for your review..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDirectUploadFormOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-mono text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <span>Select File &amp; Proceed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: 0% TO 100% ANIMATED FILE UPLOAD MODAL (FOR DIRECT MCPA UPLOAD)   */}
      {/* ========================================================================= */}
      {isUploadAnimationModalOpen && pendingUploadPayload && (
        <DocumentUploadModal
          isOpen={isUploadAnimationModalOpen}
          onClose={() => {
            setIsUploadAnimationModalOpen(false);
            setPendingUploadPayload(null);
          }}
          uploadType="admin"
          clientName={pendingUploadPayload.client?.name}
          projectCode={pendingUploadPayload.client?.code}
          targetRequest={{
            title: pendingUploadPayload.title,
            category: pendingUploadPayload.category,
            note: pendingUploadPayload.note,
          }}
          onUploadSuccess={handleDirectUploadSuccess}
        />
      )}
    </div>
  );
}
