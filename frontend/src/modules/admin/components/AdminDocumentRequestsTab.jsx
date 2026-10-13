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

export default function AdminDocumentRequestsTab({
  clientBriefs = [],
  currentUser = null,
  showToast = () => {},
}) {
  // State for Document Requests & MCPA Transmittals
  const [requests, setRequests] = useState([]);
  const [transmittals, setTransmittals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "uploaded" | "verified" | "transmittals"

  // Modal 1: Request Document from Client
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [targetClientBriefId, setTargetClientBriefId] = useState("");
  const [selectedDocTemplate, setSelectedDocTemplate] = useState("tct");
  const [customDocTitle, setCustomDocTitle] = useState("");
  const [customDocCategory, setCustomDocCategory] = useState("Lot & Ownership");
  const [requestNote, setRequestNote] = useState("");
  const [requestUrgency, setRequestUrgency] = useState("Urgent");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef(null);

  // Modal 2: Direct Upload from MCPA
  const [isDirectUploadFormOpen, setIsDirectUploadFormOpen] = useState(false);
  const [directUploadClientBriefId, setDirectUploadClientBriefId] = useState("");
  const [selectedTransmittalTemplate, setSelectedTransmittalTemplate] = useState("quotation_index");
  const [customTransmittalTitle, setCustomTransmittalTitle] = useState("");
  const [customTransmittalCategory, setCustomTransmittalCategory] = useState("Financial & Estimation");
  const [transmittalNote, setTransmittalNote] = useState("");
  const [isTransmittalComboboxOpen, setIsTransmittalComboboxOpen] = useState(false);
  const transmittalComboboxRef = useRef(null);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load data on mount & listen to cross-tab updates
  useEffect(() => {
    const initialReqs = loadDocumentRequests();
    const initialTxs = loadAdminTransmittals();
    setRequests(initialReqs);
    setTransmittals(initialTxs);

    const handleRequestsUpdate = (e) => {
      if (e.detail?.requests) setRequests(e.detail.requests);
      if (e.detail?.transmittals) setTransmittals(e.detail.transmittals);
    };

    const handleStorageChange = (e) => {
      if (e.key === "mcpa_document_requests") {
        setRequests(loadDocumentRequests());
      }
      if (e.key === "mcpa_admin_transmittals") {
        setTransmittals(loadAdminTransmittals());
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

  // Clients list from briefs with fallback
  const clientOptions = useMemo(() => {
    if (Array.isArray(clientBriefs) && clientBriefs.length > 0) {
      return clientBriefs.map((b) => ({
        id: b.id || b.submissionId || b.trackingId,
        name: b.clientName || b.fullName || "Valued Client",
        email: b.clientEmail || b.email || "",
        code: b.trackingId || b.projectCode || "MCPA-CPB-748294",
        projectType: b.projectType || "Residential Design & Build",
        avatar: resolveClientAvatar(b),
      }));
    }
    return [
      {
        id: "raymart-01",
        name: "Raymart Quirante",
        email: "rayquirante@gmail.com",
        code: "MCPA-CPB-748294",
        projectType: "Residential Design & Build",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c",
      },
    ];
  }, [clientBriefs]);

  // Default target client
  useEffect(() => {
    if (clientOptions.length > 0 && !targetClientBriefId) {
      setTargetClientBriefId(clientOptions[0].id);
      setDirectUploadClientBriefId(clientOptions[0].id);
    }
  }, [clientOptions, targetClientBriefId]);

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
  const handleCreateRequest = (e) => {
    e.preventDefault();
    const targetClient = clientOptions.find((c) => c.id === targetClientBriefId) || clientOptions[0];

    const selectedTemplate = STANDARD_REQUEST_DOCUMENTS.find((d) => d.id === selectedDocTemplate);
    const finalTitle =
      selectedDocTemplate === "others"
        ? customDocTitle.trim() || "Custom Required Document"
        : selectedTemplate?.title || "Required Document";

    const newRequest = {
      id: `req-${Date.now()}`,
      title: finalTitle,
      category: customDocCategory || selectedTemplate?.category || "General",
      clientName: targetClient?.name || "Client",
      clientEmail: targetClient?.email || "",
      projectCode: targetClient?.code || "MCPA-CPB-748294",
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

    setIsRequestModalOpen(false);
    showToast(`Dokumento hiniling kay ${targetClient.name}: "${finalTitle}"`);
  };

  // Open Direct Upload Form (Step 1 -> leads to Step 2 Upload Animation Modal)
  const handleProceedToDirectUpload = (e) => {
    e.preventDefault();
    const targetClient = clientOptions.find((c) => c.id === directUploadClientBriefId) || clientOptions[0];
    const selectedTemplate = STANDARD_MCPA_TRANSMITTALS.find((d) => d.id === selectedTransmittalTemplate);
    const finalTitle =
      selectedTransmittalTemplate === "others_mcpa"
        ? customTransmittalTitle.trim() || "Official MCPA Document"
        : selectedTemplate?.title || "Official MCPA Transmittal";

    setPendingUploadPayload({
      title: finalTitle,
      category: customTransmittalCategory || selectedTemplate?.category || "MCPA Transmittal",
      client: targetClient,
      note: transmittalNote.trim() || selectedTemplate?.defaultNote || "Official document from MCPA.",
    });

    setIsDirectUploadFormOpen(false);
    setIsUploadAnimationModalOpen(true);
  };

  // Complete Direct Upload after 0-100% progress animation
  const handleDirectUploadSuccess = (uploadedFile) => {
    if (!pendingUploadPayload) return;

    const newTransmittal = {
      id: `tx-${Date.now()}`,
      title: pendingUploadPayload.title,
      category: pendingUploadPayload.category,
      clientName: pendingUploadPayload.client?.name || "Client",
      clientEmail: pendingUploadPayload.client?.email || "",
      projectCode: pendingUploadPayload.client?.code || "MCPA-CPB-748294",
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

    showToast(`Dokumento matagumpay na naipadala kay ${newTransmittal.clientName}!`);
  };

  // Mark Request as Verified / Approved
  const handleVerifyRequest = (requestId) => {
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
    showToast("Dokumento beripikado at aprubado na ng MCPA!");
  };

  // Delete Request
  const handleDeleteRequest = (requestId) => {
    if (!confirm("Sigurado ka bang nais mong tanggalin ang kahilingang ito?")) return;
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    saveDocumentRequests(updated);
    showToast("Natanggal na ang kahilingan ng dokumento.");
  };

  // Delete Transmittal
  const handleDeleteTransmittal = (txId) => {
    if (!confirm("Sigurado ka bang nais mong alisin ang opisyal na MCPA dokumentong ito?")) return;
    const updated = transmittals.filter((t) => t.id !== txId);
    setTransmittals(updated);
    saveAdminTransmittals(updated);
    showToast("Naalis na ang MCPA transmittal record.");
  };

  const selectedTemplateObj = STANDARD_REQUEST_DOCUMENTS.find((d) => d.id === selectedDocTemplate);
  const selectedTransmittalTemplateObj = STANDARD_MCPA_TRANSMITTALS.find((d) => d.id === selectedTransmittalTemplate);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & METRICS */}
      <div className="p-6 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              Document Vault & Requests Hub
            </span>
            <span className="text-xs font-mono text-neutral-400">Phase 2 Consultation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
            Client Document Requests & MCPA Transmittals
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans mt-1 max-w-3xl">
            Humiling ng mga opisyal na titulo at clearances mula sa mga kliyente gamit ang smart
            combobox, at direktang mag-upload ng mga preliminary blueprints at quotation transmittals
            mula sa MCPA na may 0% to 100% animated transfer.
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Request a Document</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDirectUploadFormOpen(true)}
            className="px-4 py-2.5 rounded-[4px] bg-white dark:bg-[#181a24] hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Direct Upload from MCPA</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Nasa customer ang aksyon</div>
        </div>

        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-emerald-500 font-bold flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            Uploaded (Review Ready)
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {uploadedCount}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Na-upload na ng kliyente</div>
        </div>

        <div className="p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-blue-500 font-bold flex items-center gap-1">
            <Building className="w-3 h-3" />
            MCPA Issued Transmittals
          </div>
          <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {transmittals.length}
          </div>
          <div className="text-[10px] text-neutral-500 font-sans mt-1">Ipinadala ng MCPA sa portal</div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-white/5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
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
            Uploaded by Client ({uploadedCount})
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

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document, client, code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[4px] bg-white dark:bg-[#101218] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. CONTENT LIST: REQUESTS OR MCPA TRANSMITTALS */}
      {activeFilter === "transmittals" ? (
        /* MCPA TRANSMITTALS TABLE */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
              Official MCPA Issued Transmittals to Clients ({filteredTransmittals.length})
            </h3>
          </div>

          {filteredTransmittals.length === 0 ? (
            <div className="p-12 text-center rounded-[8px] bg-white dark:bg-[#101218] border border-dashed border-neutral-300 dark:border-white/10 space-y-3">
              <Building className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                Walang MCPA Transmittals Na Naipadala Pa
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-md mx-auto">
                Gamitin ang &quot;Direct Upload from MCPA&quot; na button sa itaas upang magpadala ng quotation o
                arkitektural na plano sa portal ng kliyente.
              </p>
            </div>
          ) : (
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
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-bold text-neutral-900 dark:text-white">{tx.clientName}</span>
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
        /* CLIENT DOCUMENT REQUESTS CARDS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
              Active Client Document Requests ({filteredRequests.length})
            </h3>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-[8px] bg-white dark:bg-[#101218] border border-dashed border-neutral-300 dark:border-white/10 space-y-3">
              <FileText className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                Walang Katugmang Document Requests
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-md mx-auto">
                Pindutin ang &quot;Request a Document&quot; upang magpadala ng bagong request sa kliyente para sa
                Titulo, Tax Declaration, o Barangay Clearance.
              </p>
            </div>
          ) : (
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            {req.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider ${
                              req.urgency?.toLowerCase().includes("urgent")
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            {req.urgency}
                          </span>
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
                            Tagubilin:{" "}
                          </span>
                          {req.note}
                        </p>
                      )}
                    </div>

                    {/* Middle: Target Client Profile */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                          {req.clientName?.charAt(0) || "C"}
                        </div>
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
                              title="Tingnan ang file"
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
                              <span>Mark Verified & Approved</span>
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
                  Lilitaw ang kahilingang ito sa portal ng kliyente upang ma-upload nila.
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
              {/* Select Target Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Target Client / Project Inquiry
                </label>
                <select
                  value={targetClientBriefId}
                  onChange={(e) => setTargetClientBriefId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.code} ({c.projectType})
                    </option>
                  ))}
                </select>
              </div>

              {/* DOCUMENT SUGGESTION COMBOBOX */}
              <div className="space-y-1.5 relative" ref={comboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Document to Request (Suggestion Combobox)</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    piliin o isulat sa iba pa
                  </span>
                </label>

                {/* Combobox Trigger */}
                <button
                  type="button"
                  onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                  className="w-full px-3 py-2.5 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="font-bold truncate">
                    {selectedTemplateObj?.title || "Pumili ng Dokumento"}
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
                      Mga Karaniwang Kinakailangang Dokumento
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
                    I-type ang Pangalan ng Custom Document
                  </label>
                  <input
                    type="text"
                    required
                    value={customDocTitle}
                    onChange={(e) => setCustomDocTitle(e.target.value)}
                    placeholder="Hal. Water District Certificate / Meralco Load Approval"
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
                    placeholder="Hal. Lot & Ownership"
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
                    <option value="Urgent">Urgent (Kagyat na Kailangan)</option>
                    <option value="Required for Phase 2">Required for Phase 2</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* Instructions / Notes for Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Tagubilin o Dahilan (Para sa Kliyente)
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Ipaliwanag kung bakit kinakailangan ang dokumentong ito at kung aling bahagi ang kailangang malinaw..."
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
                  Kanselahin
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
                  Mag-upload ng opisyal na plano, quotation, o kontrata mula sa MCPA patungo sa portal
                  ng kliyente.
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
              {/* Select Target Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Target Client Portal
                </label>
                <select
                  value={directUploadClientBriefId}
                  onChange={(e) => setDirectUploadClientBriefId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.code} ({c.projectType})
                    </option>
                  ))}
                </select>
              </div>

              {/* MCPA TRANSMITTAL SUGGESTION COMBOBOX */}
              <div className="space-y-1.5 relative" ref={transmittalComboboxRef}>
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Document Type / Title (MCPA Suggestions)</span>
                  <span className="text-[10px] text-amber-500 lowercase font-normal">
                    piliin o isulat sa iba pa
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsTransmittalComboboxOpen(!isTransmittalComboboxOpen)}
                  className="w-full px-3 py-2.5 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between text-left cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="font-bold truncate">
                    {selectedTransmittalTemplateObj?.title || "Pumili ng MCPA Transmittal"}
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
                      Mga Karaniwang Ipinapadalang Dokumento ng MCPA
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
                    I-type ang Pangalan ng Custom Transmittal
                  </label>
                  <input
                    type="text"
                    required
                    value={customTransmittalTitle}
                    onChange={(e) => setCustomTransmittalTitle(e.target.value)}
                    placeholder="Hal. Soil Investigation & Topographic Lot Map"
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
                  placeholder="Hal. Architectural Drawings"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-100 dark:bg-[#181a24] border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Remarks / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Transmittal Note o Pabatid
                </label>
                <textarea
                  rows={3}
                  value={transmittalNote}
                  onChange={(e) => setTransmittalNote(e.target.value)}
                  placeholder="Hal. Opisyal na quotation at preliminary blueprint na inihanda para sa inyong pagsusuri..."
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
                  Kanselahin
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <span>Pumili ng File at I-upload</span>
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
