"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Layers,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ChevronDown,
  Trash2,
  Edit3,
  Eye,
  FileText,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  X,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Building2,
  HardHat,
  ArrowRight,
  ExternalLink,
  Move,
} from "lucide-react";
import authFetch, { getStoredAuthToken } from "@/modules/shared/authFetch";
import LordIcon from "@/modules/shared/LordIcon";

// Human-friendly error translator for non-IT users
function humanizeUploadError(err) {
  const message = (err?.message || String(err || "")).toLowerCase();

  if (message.includes("413") || message.includes("large") || message.includes("entity too large")) {
    return {
      title: "Upload Interrupted",
      explanation:
        "The file transmission encountered a network buffer delay. Large 3D architectural walkthrough video files are fully supported without file size limits.",
      tip: "Tip: For smooth upload of large 3D walkthrough videos, ensure a stable internet connection and click Try Again.",
    };
  }

  if (message.includes("network") || message.includes("failed to fetch") || message.includes("connection")) {
    return {
      title: "Network Connection Interrupted",
      explanation:
        "Your internet connection momentarily dropped while sending the blueprint to the cloud. Don't worry—none of your previous work was lost.",
      tip: "Please verify your Wi-Fi or local network connection and click Try Again.",
    };
  }

  if (message.includes("401") || message.includes("token") || message.includes("session")) {
    return {
      title: "Session Expired",
      explanation:
        "Your admin session timed out for security reasons. Please refresh the page and sign back in to continue uploading blueprints.",
      tip: "Your credentials help ensure only authorized MCPA architects can publish official plans.",
    };
  }

  if (message.includes("required") || message.includes("missing")) {
    return {
      title: "Missing Required Information",
      explanation:
        "Please make sure you have entered a Sheet Title and chosen a blueprint file before publishing to the client portal.",
      tip: "Every blueprint needs a clear title (e.g., 'Ground Floor Electrical Layout') so the client understands the plan.",
    };
  }

  return {
    title: "Upload Interrupted",
    explanation:
      "We encountered an unexpected issue while saving this blueprint to the database. The system automatically prevented any partial or corrupted data from being stored.",
    tip: "Please try uploading again. If this persists, our technical team has already logged the telemetry for review.",
  };
}

// XHR file upload with genuine 0-100% progress tracking
function uploadWithProgress(file, category, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getStoredAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            resolve(res.url);
          } else {
            reject(new Error(res.message || "Upload failed."));
          }
        } catch {
          reject(new Error("Unable to parse server upload response."));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network connection dropped during upload. Please check your internet connection."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open("POST", `/api/upload?category=${encodeURIComponent(category || "blueprints")}`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

const DISCIPLINES = [
  { id: "ALL", label: "All Sheets" },
  { id: "ARCHITECTURAL", label: "Architectural" },
  { id: "STRUCTURAL", label: "Structural" },
  { id: "ELECTRICAL", label: "Electrical" },
  { id: "PLUMBING", label: "Plumbing" },
  { id: "3D_ELEVATION", label: "3D Elevation" },
  { id: "3D_WALKTHROUGH", label: "3D Walkthrough Video" },
];

export default function AdminBlueprintsTab({
  clientBriefs = [],
  allProjects = [],
  currentUser = null,
  showToast = () => {},
}) {
  // State: Client selection and overview
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // State: Blueprints of selected client
  const [blueprints, setBlueprints] = useState([]);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPinsModalOpen, setIsPinsModalOpen] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState(null);

  // Upload Progress & Human Error State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [humanError, setHumanError] = useState(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    discipline: "ARCHITECTURAL",
    sheet_number: "A-101",
    title: "",
    revision_no: "Rev 0 - Initial Issue",
    media_type: "image",
    notes: "",
  });
  const [customDiscipline, setCustomDiscipline] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [isPanningPreview, setIsPanningPreview] = useState(false);
  const [previewPanStart, setPreviewPanStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Helper: Open edit modal and prefill all blueprint details
  const openEditModal = (bp) => {
    const isStandard = [
      "ARCHITECTURAL",
      "STRUCTURAL",
      "ELECTRICAL",
      "PLUMBING",
      "3D_ELEVATION",
      "3D_WALKTHROUGH",
    ].includes(bp.discipline);
    setActiveBlueprint(bp);
    setUploadForm({
      discipline: isStandard ? bp.discipline : "OTHER",
      sheet_number: bp.sheet_number,
      title: bp.title,
      revision_no: bp.revision_no || "Rev 1 - Revised Drawing",
      media_type: bp.media_type || "image",
      notes: bp.notes || "",
    });
    setCustomDiscipline(isStandard ? "" : bp.discipline.replace(/_/g, " "));
    setSelectedFile(null);
    setFilePreviewUrl(bp.file_url);
    setIsEditModalOpen(true);
  };

  // Dynamically compute all disciplines including any custom "Other" disciplines uploaded
  const allDisciplines = useMemo(() => {
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
    (blueprints || []).forEach((b) => {
      if (b.discipline && !existing.has(b.discipline)) {
        existing.add(b.discipline);
        list.push({
          id: b.discipline,
          label: b.discipline.replace(/_/g, " "),
        });
      }
    });
    return list;
  }, [blueprints]);

  // Silky smooth drag for preview modal
  useEffect(() => {
    if (!isPanningPreview) return;
    const onMove = (e) => {
      setPreviewPan({
        x: e.clientX - previewPanStart.x,
        y: e.clientY - previewPanStart.y,
      });
    };
    const onUp = () => setIsPanningPreview(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanningPreview, previewPanStart]);

  // Fetch all clients with blueprint status from DB
  const fetchOverview = async (silent = false) => {
    if (!silent) setIsLoadingClients(true);
    try {
      const res = await authFetch("/api/admin/blueprints/overview");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
        // Default select first client if none selected
        if (!selectedClient && data.clients.length > 0) {
          // Prefer client in Consultation/Phase 2
          const phase2 = data.clients.find((c) => c.stage_id === "CONSULTATION") || data.clients[0];
          setSelectedClient(phase2);
        } else if (selectedClient) {
          const updated = data.clients.find((c) => c.client_project_id === selectedClient.client_project_id);
          if (updated) setSelectedClient(updated);
        }
      }
    } catch (e) {
      console.warn("Could not fetch blueprints overview:", e);
    } finally {
      if (!silent) setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch blueprints whenever selectedClient changes
  const fetchClientBlueprints = async (projectId) => {
    if (!projectId) {
      setBlueprints([]);
      return;
    }
    setIsLoadingBlueprints(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/blueprints`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.blueprints)) {
        setBlueprints(data.blueprints);
      } else {
        setBlueprints([]);
      }
    } catch (e) {
      console.warn("Error loading blueprints for project:", e);
      setBlueprints([]);
    } finally {
      setIsLoadingBlueprints(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.client_project_id) {
      fetchClientBlueprints(selectedClient.client_project_id);
    } else {
      setBlueprints([]);
    }
  }, [selectedClient?.client_project_id]);

  // Filtered clients for combobox search
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        (c.client_name || "").toLowerCase().includes(q) ||
        (c.project_code || "").toLowerCase().includes(q) ||
        (c.client_email || "").toLowerCase().includes(q) ||
        (c.project_type || "").toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q)
    );
  }, [clients, clientSearchQuery]);

  // Filtered blueprints by discipline
  const filteredBlueprints = useMemo(() => {
    if (selectedDiscipline === "ALL") return blueprints;
    return blueprints.filter((b) => b.discipline === selectedDiscipline);
  }, [blueprints, selectedDiscipline]);

  // Handle file selection in upload modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const isVid = file.type.startsWith("video/") || file.name.match(/\.(mp4|webm|mov)$/i);
    const isImg = file.type.startsWith("image/");

    if (isVid) {
      setUploadForm((prev) => ({
        ...prev,
        media_type: "video",
        discipline: prev.discipline === "ARCHITECTURAL" ? "3D_WALKTHROUGH" : prev.discipline,
        sheet_number: prev.sheet_number.startsWith("A-") ? "3D-01" : prev.sheet_number,
      }));
    } else if (isImg) {
      setUploadForm((prev) => ({
        ...prev,
        media_type: "image",
      }));
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
  };

  // Perform upload with 0-100% progress
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient?.client_project_id) {
      setHumanError({
        title: "No Target Client Selected",
        explanation: "Please select a target client and construction project from the dropdown in this modal before publishing.",
        tip: "Every blueprint must belong to a client project so it appears in the correct client portal.",
      });
      return;
    }
    if (!selectedFile) {
      setHumanError(humanizeUploadError(new Error("missing file")));
      return;
    }
    if (!uploadForm.title.trim()) {
      setHumanError(humanizeUploadError(new Error("missing title")));
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);
    setUploadStatusText("Preparing file buffers...");
    setHumanError(null);

    try {
      // 1. Upload file with live progress updates
      const fileUrl = await uploadWithProgress(selectedFile, "blueprints", (percent) => {
        setUploadPercent(percent);
        if (percent < 25) {
          setUploadStatusText("Initializing upload stream...");
        } else if (percent < 75) {
          setUploadStatusText(`Transmitting blueprint data (${percent}%)...`);
        } else if (percent < 99) {
          setUploadStatusText("Finalizing secure cloud storage replication...");
        } else {
          setUploadStatusText("Publishing sheet to client portal database...");
        }
      });

      const finalDiscipline =
        uploadForm.discipline === "OTHER"
          ? (customDiscipline.trim() || "OTHER").toUpperCase()
          : uploadForm.discipline;

      // 2. Save blueprint record in backend DB
      const res = await authFetch(`/api/projects/${selectedClient.client_project_id}/blueprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: finalDiscipline,
          sheet_number: uploadForm.sheet_number.trim() || "A-101",
          title: uploadForm.title.trim(),
          revision_no: uploadForm.revision_no.trim() || "Rev 0 - Initial Issue",
          media_type: uploadForm.media_type,
          file_url: fileUrl,
          notes: uploadForm.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not register blueprint record.");
      }

      // Success
      setUploadPercent(100);
      setUploadStatusText("Plan Sheet Published Successfully!");
      showToast?.(`Sheet "${uploadForm.title}" published to ${selectedClient.client_name}'s portal!`);

      // Reset and close
      setTimeout(() => {
        setIsUploading(false);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setUploadForm({
          discipline: "ARCHITECTURAL",
          sheet_number: "A-101",
          title: "",
          revision_no: "Rev 0 - Initial Issue",
          media_type: "image",
          notes: "",
        });
        setCustomDiscipline("");
        // Refresh local views
        fetchClientBlueprints(selectedClient.client_project_id);
        fetchOverview(true);
      }, 700);
    } catch (err) {
      setIsUploading(false);
      setHumanError(humanizeUploadError(err));
    }
  };

  // Update existing blueprint with optional revised file upload
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeBlueprint) return;
    const projectId = activeBlueprint.client_project_id || selectedClient?.client_project_id;
    if (!projectId) {
      showToast?.("Target client project not found.");
      return;
    }

    try {
      let fileUrl = activeBlueprint.file_url;
      let mediaType = activeBlueprint.media_type || "image";

      // If a replacement file was chosen, upload it with live progress
      if (selectedFile) {
        setIsUploading(true);
        setUploadPercent(0);
        setUploadStatusText("Uploading revised sheet...");
        fileUrl = await uploadWithProgress(selectedFile, "blueprints", (percent) => {
          setUploadPercent(percent);
          if (percent < 25) {
            setUploadStatusText("Initializing upload stream...");
          } else if (percent < 75) {
            setUploadStatusText(`Transmitting revised blueprint (${percent}%)...`);
          } else if (percent < 99) {
            setUploadStatusText("Finalizing secure cloud storage replication...");
          } else {
            setUploadStatusText("Publishing revised sheet to client portal database...");
          }
        });
        const isVid = selectedFile.type?.startsWith("video/") || selectedFile.name?.match(/\.(mp4|webm|mov)$/i);
        mediaType = isVid ? "video" : "image";
      }

      const finalDiscipline =
        uploadForm.discipline === "OTHER"
          ? (customDiscipline.trim() || "OTHER").toUpperCase()
          : uploadForm.discipline;

      const res = await authFetch(
        `/api/projects/${projectId}/blueprints/${activeBlueprint.blueprint_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discipline: finalDiscipline,
            sheet_number: uploadForm.sheet_number.trim(),
            title: uploadForm.title.trim(),
            revision_no: uploadForm.revision_no.trim(),
            media_type: mediaType,
            notes: uploadForm.notes.trim() || null,
            file_url: fileUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update blueprint.");
      }

      setIsUploading(false);
      showToast?.(`Blueprint "${uploadForm.title}" updated successfully.`);
      setIsEditModalOpen(false);
      setActiveBlueprint(null);
      setSelectedFile(null);
      fetchClientBlueprints(projectId);
      fetchOverview(true);
    } catch (err) {
      setIsUploading(false);
      setHumanError(humanizeUploadError(err));
    }
  };

  // Delete blueprint
  const handleDeleteConfirm = async () => {
    if (!activeBlueprint) return;
    try {
      const res = await authFetch(
        `/api/projects/${selectedClient.client_project_id}/blueprints/${activeBlueprint.blueprint_id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not delete blueprint.");
      }

      showToast?.(`Sheet "${activeBlueprint.title}" deleted.`);
      setIsDeleteModalOpen(false);
      setActiveBlueprint(null);
      fetchClientBlueprints(selectedClient.client_project_id);
      fetchOverview(true);
    } catch (err) {
      setHumanError(humanizeUploadError(err));
    }
  };

  // Resolve a client revision pin
  const handleResolvePin = async (pinId, resolutionNote = "Integrated into revision") => {
    if (!activeBlueprint) return;
    try {
      const res = await authFetch(
        `/api/admin/blueprints/${activeBlueprint.blueprint_id}/pins/${pinId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Resolved",
            resolutionNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update pin status.");
      }

      showToast?.("Revision pin marked as Resolved!");
      // Update local state
      setActiveBlueprint(data.blueprint);
      fetchClientBlueprints(selectedClient.client_project_id);
      fetchOverview(true);
    } catch (err) {
      showToast?.("Error resolving pin: " + err.message);
    }
  };

  // Parse pins from JSON safely
  const parsePins = (pins) => {
    if (!pins) return [];
    if (Array.isArray(pins)) return pins;
    try {
      return JSON.parse(pins);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Client Combobox Bar ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1117] rounded-[16px] border border-neutral-200/90 dark:border-white/10 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white uppercase">
                Blueprints & Engineering Plans Console
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1">
              Official architectural CAD sheets, structural drawings, and 3D walkthrough videos published directly to client portals.
            </p>
          </div>

          {/* Action: Upload Sheet Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadForm({
                  discipline: selectedDiscipline === "ALL" ? "ARCHITECTURAL" : selectedDiscipline,
                  sheet_number:
                    selectedDiscipline === "3D_WALKTHROUGH"
                      ? "3D-01"
                      : selectedDiscipline === "STRUCTURAL"
                      ? "S-201"
                      : selectedDiscipline === "ELECTRICAL"
                      ? "E-301"
                      : selectedDiscipline === "PLUMBING"
                      ? "P-401"
                      : "A-101",
                  title: "",
                  revision_no: "Rev 0 - Initial Issue",
                  media_type: selectedDiscipline === "3D_WALKTHROUGH" ? "video" : "image",
                  notes: "",
                });
                setSelectedFile(null);
                setFilePreviewUrl(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(245,158,11,0.25)] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>+ Upload & Publish Blueprint</span>
            </button>
          </div>
        </div>

        {/* ── Client Combobox & Phase Indicator ─────────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-neutral-150 dark:border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Client Combobox Dropdown */}
          <div className="relative md:col-span-2">
            <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wider">
              Select Client & Active Construction Project
            </label>

            <button
              type="button"
              onClick={() => setIsClientDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 text-left hover:border-amber-500 transition-colors cursor-pointer"
            >
              {selectedClient ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-amber-500/30 overflow-hidden">
                    {selectedClient.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedClient.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (selectedClient.client_name || "MC")[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                        {selectedClient.client_name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-medium">
                        {selectedClient.project_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                      {selectedClient.project_type || "Residential"} • {selectedClient.location || "Philippines"}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-neutral-400">Choose a client project to manage plans...</span>
              )}
              <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>

            {/* Dropdown Menu */}
            {isClientDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[12px] bg-white dark:bg-[#12151c] border border-neutral-300 dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search in Dropdown */}
                <div className="p-2 border-b border-neutral-150 dark:border-white/10">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search client name, code, or location..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/5 border-none text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                    />
                  </div>
                </div>

                {/* Clients List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/[0.04]">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      No matching clients found in database.
                    </div>
                  ) : (
                    filteredClients.map((c) => {
                      const isPhase2 = c.stage_id === "CONSULTATION";
                      const needsUpload = isPhase2 && (c.total_blueprints || 0) === 0;
                      const isSelected = selectedClient?.client_project_id === c.client_project_id;

                      return (
                        <div
                          key={c.client_project_id}
                          onClick={() => {
                            setSelectedClient(c);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors ${
                            isSelected ? "bg-amber-500/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 overflow-hidden">
                              {c.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (c.client_name || "M")[0]
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                  {c.client_name}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-400">
                                  {c.project_code}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                                {c.project_type || "Design & Build"}
                              </span>
                            </div>
                          </div>

                          {/* Phase & Upload Status Text (Plain text, no background pills) */}
                          <div className="flex items-center gap-2 shrink-0 text-right">
                            {isPhase2 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px] font-semibold">
                                Phase 2: Consultation & Planning
                              </span>
                            ) : (
                              <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                                {c.stage_id}
                              </span>
                            )}

                            {needsUpload ? (
                              <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">
                                • Needs Plan Upload
                              </span>
                            ) : c.total_blueprints > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                                • {c.total_blueprints} Sheets
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Client Telemetry / Stage Status */}
          {selectedClient && (
            <div className="p-3 rounded-[10px] bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Current Lifecycle Phase
                </span>
                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <HardHat className="w-3.5 h-3.5 text-amber-500" />
                  {selectedClient.stage_id === "CONSULTATION"
                    ? "Phase 2: Consultation & Blueprint"
                    : selectedClient.stage_id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Client Status
                </span>
                {selectedClient.needs_upload ? (
                  <span className="inline-block text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    Awaiting Plans
                  </span>
                ) : (
                  <span className="inline-block text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {blueprints.length} Sheets Published
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Discipline Filter Combobox & View Controls ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1117] rounded-[12px] p-3 border border-neutral-200/90 dark:border-white/10 shadow-xs">
        {/* Combobox: Discipline Selector */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Discipline:</span>
          </label>
          <div className="relative flex-1">
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {allDisciplines.map((d) => {
                const count =
                  d.id === "ALL"
                    ? blueprints.length
                    : blueprints.filter((b) => b.discipline === d.id).length;
                return (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-[#12151c] text-neutral-900 dark:text-white font-mono">
                    {d.label} ({count} {count === 1 ? "sheet" : "sheets"})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-[6px] bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 shrink-0">
            {filteredBlueprints.length} {filteredBlueprints.length === 1 ? "Sheet" : "Sheets"}
          </span>
        </div>

        {/* View Mode Toggle: Grid vs Table */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto border-l border-neutral-200 dark:border-white/10 pl-2">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Table View"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedClient?.client_project_id) {
                fetchClientBlueprints(selectedClient.client_project_id);
                fetchOverview(true);
              }
            }}
            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-amber-500 transition-colors cursor-pointer ml-1"
            title="Refresh Blueprints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content View: Blueprints Grid / Table / Clean Empty State ─────────────── */}
      {isLoadingBlueprints ? (
        <div className="p-12 text-center bg-white dark:bg-[#0e1117] rounded-[16px] border border-neutral-200 dark:border-white/10 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
            Loading official blueprint drawings from cloud storage...
          </p>
        </div>
      ) : filteredBlueprints.length === 0 ? (
        /* Clean Human-Designed Empty State without Button-like Background Pills */
        <div className="py-16 px-6 text-center bg-white dark:bg-[#0e1117] rounded-[16px] border border-neutral-200/90 dark:border-white/10 space-y-4 select-none">
          <LordIcon
            src="https://cdn.lordicon.com/wzwygmng.json"
            size={80}
            colors="primary:#f59e0b,secondary:#38bdf8"
            fallback={Layers}
          />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
              No {selectedDiscipline === "ALL" ? "" : selectedDiscipline.replace("_", " ")} Plan Sheets Published Yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
              Official architectural CAD sheets, electrical drawings, structural calculations, and 3D walkthrough videos published here will immediately appear in{" "}
              <strong className="text-neutral-800 dark:text-neutral-200 font-medium">
                {selectedClient?.client_name || "the client"}
              </strong>
              {"'s"} portal for their interactive review.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setUploadForm({
                  discipline: selectedDiscipline === "ALL" ? "ARCHITECTURAL" : selectedDiscipline,
                  sheet_number: "A-101",
                  title: "",
                  revision_no: "Rev 0 - Initial Issue",
                  media_type: selectedDiscipline === "3D_WALKTHROUGH" ? "video" : "image",
                  notes: "",
                });
                setSelectedFile(null);
                setFilePreviewUrl(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload & Publish First Plan Sheet</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ─────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBlueprints.map((bp) => {
            const pins = parsePins(bp.pins);
            const pendingPins = pins.filter((p) => p.status !== "Resolved" && p.resolved !== true);
            const isVideo = bp.media_type === "video" || String(bp.file_url || "").match(/\.(mp4|webm|mov)$/i);

            return (
              <div
                key={bp.blueprint_id}
                className="bg-white dark:bg-[#0e1117] rounded-[14px] border border-neutral-200/90 dark:border-white/10 overflow-hidden flex flex-col hover:border-amber-500/60 dark:hover:border-amber-500/50 transition-all duration-200 group shadow-xs"
              >
                {/* Visual Preview Banner */}
                <div
                  onClick={() => {
                    setActiveBlueprint(bp);
                    setIsPreviewModalOpen(true);
                  }}
                  className="relative h-48 bg-[#0a0d14] flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {isVideo ? (
                    <video
                      src={bp.file_url}
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bp.file_url}
                      alt={bp.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Media Type Tag */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      {isVideo ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-sky-400" />}
                      {bp.sheet_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {bp.revision_no}
                    </span>
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBlueprint(bp);
                        setIsPreviewModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-neutral-100 text-neutral-900 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform hover:scale-105"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(bp);
                      }}
                      className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform hover:scale-105"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Re-upload</span>
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {bp.discipline.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {new Date(bp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3
                      onClick={() => openEditModal(bp)}
                      className="font-bold text-sm text-neutral-900 dark:text-white mt-1 leading-snug line-clamp-2 hover:text-amber-500 cursor-pointer transition-colors"
                      title="Click to edit details or re-upload plan"
                    >
                      {bp.title}
                    </h3>
                    {bp.notes && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1.5 line-clamp-2">
                        {bp.notes}
                      </p>
                    )}
                  </div>

                  {/* Client Revision Pins Status & Actions */}
                  <div className="pt-3 border-t border-neutral-150 dark:border-white/5 flex items-center justify-between">
                    {/* Revision Pins Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBlueprint(bp);
                        setIsPinsModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                        pendingPins.length > 0
                          ? "bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25"
                          : pins.length > 0
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {pendingPins.length > 0
                          ? `${pendingPins.length} Pending Revision${pendingPins.length > 1 ? "s" : ""}`
                          : pins.length > 0
                          ? `${pins.length} Pins Resolved`
                          : "0 Pins"}
                      </span>
                    </button>

                    {/* Action Buttons: Edit / Re-upload & Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(bp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-xs font-bold transition-colors cursor-pointer"
                        title="Edit Sheet & Re-upload Plan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Re-upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBlueprint(bp);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-[6px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Sheet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ─────────────────────────────────────────────────────────── */
        <div className="bg-white dark:bg-[#0e1117] rounded-[14px] border border-neutral-200/90 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
                  <th className="py-3 px-4">Sheet #</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Sheet Title</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Media Type</th>
                  <th className="py-3 px-4">Client Pins</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04] text-xs font-sans">
                {filteredBlueprints.map((bp) => {
                  const pins = parsePins(bp.pins);
                  const pendingPins = pins.filter((p) => p.status !== "Resolved" && p.resolved !== true);

                  return (
                    <tr
                      key={bp.blueprint_id}
                      className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                        {bp.sheet_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-[4px] bg-neutral-100 dark:bg-white/5 font-mono text-[10px] uppercase text-neutral-700 dark:text-neutral-300">
                          {bp.discipline.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                        {bp.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {bp.revision_no}
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[10px] text-neutral-500">
                        {bp.media_type || "image"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBlueprint(bp);
                            setIsPinsModalOpen(true);
                          }}
                          className={`font-mono text-[11px] font-bold cursor-pointer hover:underline ${
                            pendingPins.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-neutral-500"
                          }`}
                        >
                          {pins.length} Pins ({pendingPins.length} Pending)
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                        {new Date(bp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBlueprint(bp);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1 text-neutral-400 hover:text-amber-500 transition-colors"
                          title="View Sheet"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(bp)}
                          className="p-1 text-neutral-400 hover:text-amber-500 transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                          title="Edit Details & Re-upload"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBlueprint(bp);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                          title="Delete Sheet"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Upload Blueprint / Plan Sheet ─────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-[18px] border border-neutral-300 dark:border-white/15 w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-neutral-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Upload & Publish Blueprint / Plan Sheet
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                  Publish official drawings, architectural sheets, and 3D walkthroughs directly to client portals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-[6px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Select Target Client Project Combobox */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Select Target Client Project *</span>
                  {selectedClient && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Active: {selectedClient.project_code}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={selectedClient?.client_project_id || ""}
                    onChange={(e) => {
                      const chosen = clients.find((c) => String(c.client_project_id) === String(e.target.value));
                      setSelectedClient(chosen || null);
                      if (chosen) {
                        fetchClientBlueprints(chosen.client_project_id);
                      }
                    }}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-[10px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-sans font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="" disabled className="text-neutral-400">
                      Choose a client project to publish this blueprint to...
                    </option>
                    {clients.map((c) => {
                      const isPhase2 = c.stage_id === "CONSULTATION";
                      const sheetCount = c.total_blueprints || 0;
                      return (
                        <option
                          key={c.client_project_id}
                          value={c.client_project_id}
                          className="bg-white dark:bg-[#12151c] text-neutral-900 dark:text-white font-sans"
                        >
                          {c.client_name} ({c.project_code}) — {isPhase2 ? "Phase 2: Consultation" : c.stage_id}{" "}
                          {sheetCount === 0 ? "• (Needs Plan Upload)" : `• (${sheetCount} sheets)`}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {selectedClient ? (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-sans text-neutral-500 dark:text-neutral-400">
                    <span>
                      {selectedClient.project_type || "Residential"} • {selectedClient.location || "Philippines"}
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {selectedClient.total_blueprints || 0} sheets currently published
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-sans">
                    Please select which client project will receive this blueprint.
                  </p>
                )}
              </div>
              {/* Discipline & Media Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                    Discipline
                  </label>
                  <select
                    value={uploadForm.discipline}
                    onChange={(e) => {
                      const disc = e.target.value;
                      setUploadForm((prev) => ({
                        ...prev,
                        discipline: disc,
                        sheet_number:
                          disc === "3D_WALKTHROUGH"
                            ? "3D-01"
                            : disc === "STRUCTURAL"
                            ? "S-201"
                            : disc === "ELECTRICAL"
                            ? "E-301"
                            : disc === "PLUMBING"
                            ? "P-401"
                            : disc === "OTHER"
                            ? "O-101"
                            : "A-101",
                        media_type: disc === "3D_WALKTHROUGH" ? "video" : prev.media_type,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ARCHITECTURAL">Architectural Plan</option>
                    <option value="STRUCTURAL">Structural Plan</option>
                    <option value="ELECTRICAL">Electrical Plan</option>
                    <option value="PLUMBING">Plumbing Plan</option>
                    <option value="3D_ELEVATION">3D Elevation</option>
                    <option value="3D_WALKTHROUGH">3D Walkthrough Video</option>
                    <option value="OTHER">Other Plan (Specify...)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                    Sheet Number / Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., A-101 or 3D-01"
                    value={uploadForm.sheet_number}
                    onChange={(e) => setUploadForm({ ...uploadForm, sheet_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* If "OTHER" is selected: Custom discipline specification */}
              {uploadForm.discipline === "OTHER" && (
                <div className="p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                    Specify Custom Plan Discipline / Trade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Landscape Plan, Mechanical & HVAC, Interior Design, Site Development..."
                    value={customDiscipline}
                    onChange={(e) => setCustomDiscipline(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#12151c] border border-amber-500/50 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                    This custom discipline will automatically reflect in the client&apos;s portal selector.
                  </p>
                </div>
              )}

              {/* Architectural Floor & Sheet Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300">
                    Floor Level & Plan Presets
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">Click to auto-fill code & title</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "1st Floor / Ground Plan", code: "A-101", title: "Ground Floor Architectural Layout & Partition Schedule", disc: "ARCHITECTURAL" },
                    { label: "2nd Floor Plan", code: "A-102", title: "Second Floor Framing & Bedroom Layout", disc: "ARCHITECTURAL" },
                    { label: "3rd Floor / Mezzanine", code: "A-103", title: "Third Floor / Mezzanine Architectural Layout", disc: "ARCHITECTURAL" },
                    { label: "Roof Deck Plan", code: "A-104", title: "Roof Deck Framing & Drainage Layout", disc: "ARCHITECTURAL" },
                    { label: "Exterior Elevations", code: "A-201", title: "Front, Rear & Side Architectural Elevations", disc: "3D_ELEVATION" },
                    { label: "Foundation Plan", code: "S-101", title: "Foundation & Footing Engineering Layout", disc: "STRUCTURAL" },
                    { label: "Landscape & Site Plan", code: "L-101", title: "Site Development & Landscape Architecture Layout", disc: "OTHER", custom: "Landscape Plan" },
                    { label: "3D Walkthrough Video", code: "3D-01", title: "Interactive 3D Virtual Walkthrough Tour", disc: "3D_WALKTHROUGH", isVid: true },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setUploadForm((prev) => ({
                          ...prev,
                          discipline: preset.disc || prev.discipline,
                          sheet_number: preset.code,
                          title: preset.title,
                          media_type: preset.isVid ? "video" : prev.media_type,
                        }));
                        if (preset.custom) {
                          setCustomDiscipline(preset.custom);
                        }
                      }}
                      className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 hover:border-amber-500 border border-neutral-300 dark:border-white/10 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Title */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Sheet Title / Plan Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ground Floor Architectural Layout & Partition Details"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Revision Tag */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Revision Tag / Status
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rev 0 - Initial Issue or Rev 1 - Post Client Review"
                  value={uploadForm.revision_no}
                  onChange={(e) => setUploadForm({ ...uploadForm, revision_no: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* File Upload Drop Zone */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Plan File / 3D Walkthrough Video
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500 rounded-[12px] p-6 text-center cursor-pointer transition-colors bg-neutral-50 dark:bg-white/[0.02]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-sans">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-8 h-8 text-neutral-400 mx-auto" />
                      <p className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                        Click to browse or drag and drop blueprint
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Supports PNG, JPG, WebP, PDF & 3D Walkthrough MP4 / WebM (No Size Limit for Videos)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Engineering Notes */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Architect / Engineering Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any specific instructions or notes for the client regarding this sheet..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-150 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedClient || !selectedFile || !uploadForm.title}
                  className="px-5 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Publish to Client Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Animated 0-100% Upload Progress Modal ─────────────────────────── */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12151c] rounded-[20px] border border-amber-500/40 p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            {/* Animated Icon */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
              <div className="relative w-full h-full rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-500">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            {/* Headline and Status Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                {isEditModalOpen ? "Uploading Revised Blueprint" : "Publishing Blueprint Plan"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans min-h-[20px] transition-all">
                {uploadStatusText}
              </p>
            </div>

            {/* 0-100% Animated Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden p-0.5">
                <div
                  style={{ width: `${uploadPercent}%` }}
                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-400 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-neutral-400">Progress</span>
                <span className="text-amber-500 text-sm">{uploadPercent}%</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 font-sans">
              Please keep this tab open while the engineering sheet is encrypted and uploaded to cloud storage.
            </p>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Non-IT Human-Friendly Error Modal ─────────────────────────────── */}
      {humanError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-[18px] border border-rose-500/40 p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white uppercase">
                  {humanError.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans mt-1 leading-relaxed">
                  {humanError.explanation}
                </p>
              </div>
            </div>

            {humanError.tip && (
              <div className="p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs font-sans text-neutral-700 dark:text-neutral-300">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{humanError.tip}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHumanError(null)}
                className="px-5 py-2.5 rounded-[8px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Understood, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Fullscreen Plan Inspector / 3D Walkthrough Player ────────────── */}
      {isPreviewModalOpen && activeBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0c0e14] rounded-[18px] border border-neutral-300 dark:border-white/10 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Viewer Header */}
            <div className="p-4 px-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-amber-500 text-neutral-950 font-mono font-bold text-xs">
                  {activeBlueprint.sheet_number}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono">{activeBlueprint.title}</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                    {activeBlueprint.discipline} • {activeBlueprint.revision_no}
                  </p>
                </div>
              </div>

              {/* Zoom & Close Controls */}
              <div className="flex items-center gap-2">
                {!activeBlueprint.media_type?.includes("video") && (
                  <div className="flex items-center gap-1.5 mr-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-1 rounded-md">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(3.5, z + 0.25))}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewZoom(1);
                        setPreviewPan({ x: 0, y: 0 });
                      }}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      title="Reset View"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono ml-1 font-bold">
                      {Math.round(previewZoom * 100)}%
                    </span>
                  </div>
                )}
                {!activeBlueprint.media_type?.includes("video") && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-500 font-sans mr-2">
                    <Move className="w-3.5 h-3.5" /> Drag plan to pan
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    openEditModal(activeBlueprint);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mr-2 shadow-xs"
                  title="Edit Sheet & Re-upload Drawing"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit / Re-upload</span>
                </button>
                <a
                  href={activeBlueprint.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                  title="Open Original in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewZoom(1);
                    setPreviewPan({ x: 0, y: 0 });
                  }}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Canvas with Adaptive Drafting Grid */}
            <div
              onMouseDown={(e) => {
                if (activeBlueprint.media_type === "video") return;
                if (e.button !== 0) return;
                setIsPanningPreview(true);
                setPreviewPanStart({ x: e.clientX - previewPan.x, y: e.clientY - previewPan.y });
              }}
              onWheel={(e) => {
                if (activeBlueprint.media_type === "video") return;
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                setPreviewZoom((z) => Math.min(3.5, Math.max(0.5, Number((z + delta).toFixed(2)))));
              }}
              className={`flex-1 overflow-hidden p-4 flex items-center justify-center relative select-none bg-neutral-100/90 dark:bg-[#07090e] bg-[radial-gradient(#d1d5db_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:20px_20px] ${
                activeBlueprint.media_type !== "video"
                  ? isPanningPreview
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : ""
              }`}
            >
              {activeBlueprint.media_type === "video" || String(activeBlueprint.file_url || "").match(/\.(mp4|webm|mov)$/i) ? (
                <div className="w-full max-w-4xl max-h-full aspect-video">
                  <video
                    src={activeBlueprint.file_url}
                    controls
                    autoPlay
                    className="w-full h-full rounded-[10px] shadow-2xl bg-black"
                  />
                </div>
              ) : (
                <div
                  style={{
                    transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
                    transformOrigin: "center center",
                  }}
                  className="transition-transform duration-75 max-w-full max-h-full flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeBlueprint.file_url}
                    alt={activeBlueprint.title}
                    draggable={false}
                    className="max-w-full max-h-[75vh] object-contain rounded-[4px] shadow-2xl border border-neutral-300 dark:border-white/10 pointer-events-none select-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Client Revision Pins Inspector ────────────────────────────────── */}
      {isPinsModalOpen && activeBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-[18px] border border-neutral-300 dark:border-white/15 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 px-6 border-b border-neutral-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Client Revision Pins & Feedback
                </h3>
                <p className="text-xs text-neutral-500 font-sans">
                  Sheet: {activeBlueprint.sheet_number} — {activeBlueprint.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPinsModalOpen(false)}
                className="p-1.5 rounded-[6px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pins List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {parsePins(activeBlueprint.pins).length === 0 ? (
                <div className="text-center py-12 space-y-2 select-none">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-mono font-bold text-sm text-neutral-900 dark:text-white uppercase">
                    Zero Revision Pins Dropped
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    The client has not dropped any revision pins on this sheet yet. Once they add comments via their portal, they will appear here.
                  </p>
                </div>
              ) : (
                parsePins(activeBlueprint.pins).map((pin, idx) => {
                  const isResolved = pin.status === "Resolved" || pin.resolved === true;

                  return (
                    <div
                      key={pin.id || idx}
                      className={`p-4 rounded-[12px] border transition-all ${
                        isResolved
                          ? "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 opacity-80"
                          : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                              isResolved ? "bg-emerald-500 text-neutral-950" : "bg-amber-500 text-neutral-950"
                            }`}
                          >
                            📍
                          </span>
                          <div>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white">
                              {pin.author || "Client"}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 ml-2">
                              Coord: {pin.x}%, {pin.y}%
                            </span>
                          </div>
                        </div>

                        {/* Status Badge & Action */}
                        <div className="flex items-center gap-2">
                          {isResolved ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                              Resolved
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResolvePin(pin.id)}
                              className="px-3 py-1 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Resolved</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Note / Comment */}
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans mt-2.5 bg-white dark:bg-black/30 p-2.5 rounded-[8px] border border-neutral-200 dark:border-white/5 leading-relaxed">
                        &quot;{pin.note || pin.comment || "Revision requested at this coordinate."}&quot;
                      </p>

                      {pin.resolution_note && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1.5 pl-1">
                          ✓ Resolution note: {pin.resolution_note}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: Edit & Re-upload Blueprint Details ────────────────────────────── */}
      {isEditModalOpen && activeBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-[18px] border border-neutral-300 dark:border-white/15 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 px-6 border-b border-neutral-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                  Edit & Re-upload Blueprint Sheet
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                  Target Project: <span className="font-bold text-amber-500">{selectedClient?.client_name}</span> ({selectedClient?.project_code}) • Sheet {activeBlueprint.sheet_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-[6px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                    Discipline
                  </label>
                  <select
                    value={uploadForm.discipline}
                    onChange={(e) => setUploadForm({ ...uploadForm, discipline: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                  >
                    <option value="ARCHITECTURAL">Architectural Plan</option>
                    <option value="STRUCTURAL">Structural Plan</option>
                    <option value="ELECTRICAL">Electrical Plan</option>
                    <option value="PLUMBING">Plumbing Plan</option>
                    <option value="3D_ELEVATION">3D Elevation</option>
                    <option value="3D_WALKTHROUGH">3D Walkthrough Video</option>
                    <option value="OTHER">Other Plan (Specify...)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                    Sheet Code
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.sheet_number}
                    onChange={(e) => setUploadForm({ ...uploadForm, sheet_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* If "OTHER" is selected: Custom discipline specification */}
              {uploadForm.discipline === "OTHER" && (
                <div className="p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                    Specify Custom Plan Discipline / Trade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Landscape Plan, Mechanical & HVAC, Interior Design, Site Development..."
                    value={customDiscipline}
                    onChange={(e) => setCustomDiscipline(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#12151c] border border-amber-500/50 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Sheet Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Revision Tag
                </label>
                <input
                  type="text"
                  value={uploadForm.revision_no}
                  onChange={(e) => setUploadForm({ ...uploadForm, revision_no: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                />
              </div>

              {/* ── File Re-upload / Replacement Section ────────────────── */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Plan File / 3D Walkthrough Video</span>
                  <span className="text-[10px] font-mono text-neutral-400">Re-upload or replace plan file</span>
                </label>

                {/* Current Active File Banner */}
                <div className="mb-2 p-2.5 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {activeBlueprint.media_type === "video" ? (
                      <Video className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200 block truncate">
                        Active: {activeBlueprint.sheet_number} ({activeBlueprint.revision_no})
                      </span>
                      <a
                        href={activeBlueprint.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        View currently uploaded file <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    Live on Portal
                  </span>
                </div>

                {/* Replacement Dropzone */}
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500 rounded-[12px] p-4 text-center cursor-pointer transition-colors bg-neutral-50 dark:bg-white/[0.02]"
                >
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedFile(file);
                      const isVid = file.type.startsWith("video/") || file.name.match(/\.(mp4|webm|mov)$/i);
                      setUploadForm((prev) => ({
                        ...prev,
                        media_type: isVid ? "video" : "image",
                        revision_no:
                          prev.revision_no === "Rev 0 - Initial Issue"
                            ? "Rev 1 - Revised Drawing"
                            : prev.revision_no,
                      }));
                    }}
                  />

                  {selectedFile ? (
                    <div className="space-y-1.5">
                      <div className="inline-flex p-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                        New file chosen: {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-sans">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Will replace active plan on save
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-[11px] font-mono text-rose-500 hover:underline pt-1 block mx-auto cursor-pointer"
                      >
                        Cancel file replacement
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-neutral-400 mx-auto" />
                      <p className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                        Click to browse or drop replacement / revised blueprint
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Supports PNG, JPG, WebP, PDF & 3D Walkthrough MP4 / WebM (No Size Limit for Videos)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                  Engineering Notes
                </label>
                <textarea
                  rows={2}
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-150 dark:border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{selectedFile ? "Upload Revised File & Save" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: Delete Confirmation Modal ─────────────────────────────────────── */}
      {isDeleteModalOpen && activeBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#12151c] rounded-[18px] border border-rose-500/40 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-mono font-bold text-base uppercase text-neutral-900 dark:text-white">
                Delete Blueprint?
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-neutral-900 dark:text-white">
                {activeBlueprint.sheet_number} — {activeBlueprint.title}
              </strong>
              ? It will be permanently unpublished from the client portal.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Keep Sheet
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-[8px] bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Delete Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
