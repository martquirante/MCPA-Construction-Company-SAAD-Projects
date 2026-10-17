"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  CalendarCheck,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  PhoneOff,
  Send,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileUp,
  ExternalLink,
  MessageSquare,
  Shield,
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
  List,
  LayoutGrid,
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";
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

export default function PortalPhase2Consultation({
  activeProject,
  currentUser,
  showToast,
  onRefreshState,
  onSelectTab,
  inquiries = [],
  mode = "overview",
}) {
  const projectId = activeProject?.client_project_id;

  // 1. WebRTC & Video Consultation states
  const [meetingRoom, setMeetingRoom] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef(null);

  // 2. Chat states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatScrollRef = useRef(null);

  // 3. Document Requests & MCPA Transmittals states
  const [documents, setDocuments] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [adminTransmittals, setAdminTransmittals] = useState([]);
  const [activeUploadRequest, setActiveUploadRequest] = useState(null);
  const [isExtraUploadModalOpen, setIsExtraUploadModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTypeSelected, setDocTypeSelected] = useState("LAND_TITLE");
  const [docViewMode, setDocViewMode] = useState("table"); // "table" | "grid"

  // Sync Document Requests & Transmittals with Admin & LocalStorage
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
    const trackingId = (inquiries?.[0]?.trackingId || inquiries?.[0]?.id || "").trim();
    const matched = documentRequests.filter(
      (r) =>
        !email ||
        !r.clientEmail ||
        r.clientEmail.toLowerCase() === email ||
        (trackingId && r.projectCode === trackingId)
    );
    return matched.length > 0 ? matched : documentRequests;
  }, [documentRequests, currentUser, inquiries]);

  const clientTransmittals = useMemo(() => {
    const email = (currentUser?.email || "").toLowerCase().trim();
    const trackingId = (inquiries?.[0]?.trackingId || inquiries?.[0]?.id || "").trim();
    const matched = adminTransmittals.filter(
      (t) =>
        !email ||
        !t.clientEmail ||
        t.clientEmail.toLowerCase() === email ||
        (trackingId && t.projectCode === trackingId)
    );
    return matched.length > 0 ? matched : adminTransmittals;
  }, [adminTransmittals, currentUser, inquiries]);

  const pendingRequestsCount = useMemo(
    () => clientRequests.filter((r) => r.status === "pending").length,
    [clientRequests]
  );

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
    showToast(`Successfully uploaded "${activeUploadRequest.title}"!`);
  };

  const handleExtraUploadSuccess = async (uploadedFile) => {
    if (projectId) {
      try {
        const res = await authFetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stageId: "CONSULTATION",
            docType: "ADDITIONAL_LOT_DOCUMENT",
            fileName: uploadedFile.fileName,
            fileUrl: uploadedFile.fileUrl,
            fileSizeBytes: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType,
            notes: "Additional client lot upload",
          }),
        });
        const data = await res.json();
        if (data.success && data.document) {
          setDocuments((prev) => [data.document, ...prev]);
        }
      } catch (err) {
        console.warn("Backend extra document save:", err);
      }
    }
    setIsExtraUploadModalOpen(false);
    showToast(`Successfully uploaded "${uploadedFile.fileName}"!`);
  };

  // 4. Quotation Request state
  const [quotationRequested, setQuotationRequested] = useState(false);

  // 5. Client Withdrawal / Discontinue state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("Budget / Financial Alignment Mismatch");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Fetch meeting room & messages & documents from DB
  const loadConsultationData = async () => {
    if (!projectId) return;

    // Fetch Meeting Room
    try {
      const meetRes = await authFetch(`/api/projects/${projectId}/meeting`);
      const meetData = await meetRes.json();
      if (meetData.success && meetData.meeting) {
        setMeetingRoom(meetData.meeting);
      }
    } catch (e) {
      console.warn("Failed to fetch meeting room:", e);
    }

    // Fetch Chat Messages
    try {
      const msgRes = await authFetch(`/api/projects/${projectId}/messages`);
      const msgData = await msgRes.json();
      if (msgData.success && Array.isArray(msgData.messages)) {
        setMessages(msgData.messages);
      }
    } catch (e) {
      console.warn("Failed to fetch chat messages:", e);
    }

    // Fetch Documents
    try {
      const docsRes = await authFetch(`/api/projects/${projectId}/documents`);
      const docsData = await docsRes.json();
      if (docsData.success && Array.isArray(docsData.documents)) {
        setDocuments(docsData.documents);
      }
    } catch (e) {
      console.warn("Failed to fetch documents:", e);
    }
  };

  useEffect(() => {
    loadConsultationData();
    // Poll chat messages every 6 seconds
    const interval = setInterval(loadConsultationData, 6000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // WebRTC Local Media Stream toggles
  const startCall = async () => {
    setIsInCall(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Camera/Mic access not granted or unavailable, operating in virtual presentation mode:", err);
    }
    showToast("Connected to MCPA Consultation Room.");
  };

  const endCall = () => {
    if (localVideoRef.current?.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }
    setIsInCall(false);
    showToast("Meeting disconnected.");
  };

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    } else {
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    } else {
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Send Live Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMsg) return;

    const text = chatInput.trim();
    setChatInput("");
    setIsSendingMsg(true);

    try {
      const res = await authFetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: text }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      showToast("Message could not be sent.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Upload Document to Vault
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast("Document must be under 25MB.");
      return;
    }

    setIsUploadingDoc(true);
    showToast(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload to storage
      const uploadRes = await fetch("/api/upload?category=documents", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.message || "Upload failed");
      }

      // Record in project_documents table
      const docRes = await authFetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: "CONSULTATION",
          docType: docTypeSelected,
          fileName: file.name,
          fileUrl: uploadData.url,
          fileSizeBytes: file.size,
          mimeType: file.type,
        }),
      });

      const docData = await docRes.json();
      if (docData.success && docData.document) {
        setDocuments((prev) => [docData.document, ...prev]);
        showToast("Document uploaded to vault for engineering review!");
      }
    } catch (err) {
      console.error("Document upload error:", err);
      showToast("Failed to upload document: " + err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleConfirmWithdraw = async (e) => {
    e.preventDefault();
    setIsSubmittingWithdraw(true);

    try {
      const payload = {
        outcome: "DISCONTINUED_REJECTED",
        status: "Withdrawn by Client",
        isRejected: true,
        rejectionReason: withdrawReason,
        rejectionNotes: withdrawNotes,
        updatedAt: new Date().toISOString(),
        updatedBy: "client",
        clientEmail: currentUser?.email || activeProject?.client_email || "martquirante@gmail.com",
      };

      // 1. Shared localStorage update
      localStorage.setItem("mcpa_shared_meeting_schedule", JSON.stringify(payload));

      // 2. Client briefs & dashboard state update in localStorage
      try {
        const storedBriefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
        const updatedBriefs = storedBriefs.map((b) => {
          const isMatch =
            (b.clientEmail && currentUser?.email && b.clientEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
            b.id === projectId ||
            b.trackingId === activeProject?.project_code;
          if (isMatch) {
            return {
              ...b,
              status: "Rejected / Declined",
              is_rejected: true,
              rejection_reason: withdrawReason,
              rejection_notes: withdrawNotes,
            };
          }
          return b;
        });
        localStorage.setItem("mcpa_client_briefs", JSON.stringify(updatedBriefs));

        // Set dashboard state to Phase 1 PRE_INQUIRY
        localStorage.setItem(
          "mcpa_client_dashboard_state",
          JSON.stringify({
            success: true,
            hasActiveProject: false,
            hasRejectedInquiry: true,
            stage_id: "PRE_INQUIRY",
            stageLevel: 1,
            stageName: "Pre-Inquiry",
            rejectedBrief: {
              status: "Withdrawn by Client",
              rejectionReason: withdrawReason,
              rejectionNotes: withdrawNotes,
              projectType: activeProject?.project_title || "Residential Construction",
            },
          })
        );
      } catch (e) {}

      // 3. Dispatch live event
      window.dispatchEvent(new CustomEvent("mcpa-meeting-updated", { detail: payload }));

      // 4. Backend sync call
      const targetId = activeProject?.brief_id || activeProject?.brief_submission_id || projectId || "1";
      await fetch(`/api/portal/consultation/${encodeURIComponent(targetId)}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: withdrawReason,
          notes: withdrawNotes,
        }),
      }).catch(() => {});

      showToast("Consultation withdrawn. Your project stage has been reset to Phase 1.");
      setIsWithdrawModalOpen(false);

      if (onRefreshState) {
        onRefreshState();
      }
    } catch (err) {
      showToast("Withdraw notice: " + err.message);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const primaryInquiry = inquiries?.[0];
  const resolvedModeStr = (
    primaryInquiry?.venue_type || primaryInquiry?.venueType
      ? `In-Person (${primaryInquiry.venue_type || primaryInquiry.venueType})`
      : primaryInquiry?.meeting_mode ||
        primaryInquiry?.meetingMode ||
        activeProject?.meeting_mode ||
        activeProject?.meetingMode ||
        "Online Meeting"
  ).toLowerCase();
  const isF2FConsultation =
    resolvedModeStr.includes("in-person") ||
    resolvedModeStr.includes("face-to-face") ||
    resolvedModeStr.includes("f2f") ||
    (!resolvedModeStr.includes("online") && !resolvedModeStr.includes("video") && !resolvedModeStr.includes("google"));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. STAGE PROGRESS & LIVE STATUS TIMELINE (SHOWN ONLY IN OVERVIEW MODE) */}
      {mode === "overview" && (
        <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-amber-500/20 bg-white dark:bg-linear-to-b dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 text-neutral-900 dark:text-white shadow-sm dark:shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-white/10">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                {activeProject?.project_title || "Residential Build Inquiry"}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                Project Code: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{activeProject?.project_code}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-3.5 py-2 rounded-[4px] font-mono text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-2"
                title="Cancel or discontinue this consultation"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Withdraw Consultation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuotationRequested(true);
                  showToast("Quotation request submitted to MCPA Estimations Team!");
                }}
                disabled={quotationRequested}
                className={`px-4 py-2 rounded-[4px] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  quotationRequested
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {quotationRequested ? "Quotation Requested" : "Request Formal Quotation"}
              </button>
            </div>
          </div>

          {/* Linear Stepper Timeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Inquiry Submitted", status: "Completed", date: "Verified" },
              { title: "Document & Lot Review", status: documents.length > 0 ? "Under Review" : "Action Needed", date: "TCT / Valid IDs" },
              {
                title: isF2FConsultation ? "In-Person Consultation" : "Video Consultation",
                status: isF2FConsultation ? "F2F Slot" : isInCall ? "In Session" : "Room Ready",
                date: isF2FConsultation
                  ? primaryInquiry?.meeting_date || primaryInquiry?.meetingDate || "In-Person Visit"
                  : meetingRoom?.room_code || "Scheduled",
              },
              { title: "Formal Quotation", status: quotationRequested ? "In Preparation" : "Pending Meeting", date: "Cost Index" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[6px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-1 font-mono transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500">{item.status}</span>
                </div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">{item.title}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans">{item.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. STAGE 2 EXECUTIVE DASHBOARD SUMMARY CARDS (SHOWN ONLY IN OVERVIEW MODE) */}
      {mode === "overview" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-bold">
              Stage 2 Consultation Executive Summary &amp; Tab Shortcuts
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-semibold">
              Phase 2 of 5
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Meeting Hub Tab Summary */}
            <div
              onClick={() => onSelectTab && onSelectTab("meeting")}
              className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="text-amber-500">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  {isF2FConsultation ? (
                    <>
                      <Building className="w-3 h-3" />
                      <span>Face-to-Face (F2F)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Instant &amp; Scheduled</span>
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase text-neutral-500">Appointments</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                  {isF2FConsultation ? "In-Person Schedule & Venue" : "Meeting Schedule & Instant Video"}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {isF2FConsultation
                    ? "View your face-to-face consultation schedule, physical venue directions, and required documents to bring."
                    : "Request an on-demand instant consultation, join virtual Google Meet sessions, or coordinate face-to-face visits."}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>Open Consultation Hub</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Request Documents Summary */}
            <div
              onClick={() => onSelectTab && onSelectTab("documents")}
              className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="text-purple-500">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-purple-500 dark:text-purple-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {pendingRequestsCount > 0
                    ? `${pendingRequestsCount} Action Needed`
                    : `${clientRequests.length} Requests Checked`}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase text-neutral-500">Request Documents</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                  Admin Document Requests
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  Review required title deeds, clearances, and tax declarations requested by MCPA, or inspect official architectural blueprints transmitted to you.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>Open Request Documents</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Inquiries Brief Summary */}
            <div
              onClick={() => onSelectTab && onSelectTab("inquiries")}
              className="group p-5 rounded-[18px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="text-amber-500">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <span className="text-amber-500 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Brief Verified
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase text-neutral-500">Inquiry Brief</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                  {primaryInquiry ? (primaryInquiry.project_type || "Residential Build") : "Active Project Scope"}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {primaryInquiry
                    ? `Style: ${primaryInquiry.preferred_style || "Contemporary"} · Budget: ${primaryInquiry.budget_range || "Flexible"}`
                    : "Review submitted architectural specs, lot dimensions, and floor plans."}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>View Full Inquiry Brief</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MEETING HUB & APPOINTMENT SCHEDULE (SHOWN IN MEETING MODE) */}
      {mode === "meeting" && (
        <PortalMeetingHub
          activeProject={activeProject}
          currentUser={currentUser}
          meetingRoom={meetingRoom}
          inquiries={inquiries}
          showToast={showToast}
        />
      )}

      {/* 3. REQUEST DOCUMENTS & MCPA TRANSMITTALS (SHOWN IN OVERVIEW & DOCUMENTS MODES) */}
      {(mode === "overview" || mode === "documents") && (
        <div className="p-5 sm:p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Document Requests &amp; MCPA Transmittals
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 leading-relaxed">
                Upload official title deeds and certificates requested by the MCPA engineering team, or download blueprints and quotations issued to you.
              </p>
            </div>

            {/* Actions: View Mode Switcher & Upload Button */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start sm:self-auto shrink-0">
              {/* Grid / Table Toggle */}
              <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-lg p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDocViewMode("table")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    docViewMode === "table"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    docViewMode === "grid"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsExtraUploadModalOpen(true)}
                className="px-3.5 py-2 rounded-[4px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Upload Additional Document</span>
              </button>
            </div>
          </div>

          {/* SUB-SECTION 1: REQUIRED DOCUMENTS FROM MCPA ADMIN */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white tracking-wider">
                  Required Documents from MCPA Admin ({clientRequests.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {pendingRequestsCount > 0 ? `${pendingRequestsCount} Action Needed` : "All Documents Uploaded"}
              </span>
            </div>

            {clientRequests.length === 0 ? (
              <div className="p-8 text-center rounded-[6px] border border-dashed border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-400 space-y-2">
                <FileCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-neutral-800 dark:text-neutral-200">No Pending Document Requests</p>
                <p className="text-[11px] text-neutral-500 max-w-md mx-auto font-sans">
                  There are currently no outstanding document requests for your project. If our engineering team requires permits, deeds, or clearances, they will be listed here.
                </p>
              </div>
            ) : docViewMode === "table" ? (
              /* CLIENT REQUESTS TABLE VIEW */
              <div className="overflow-x-auto rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Document &amp; Purpose</th>
                      <th className="py-3 px-4 font-bold">Urgency</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Attached File</th>
                      <th className="py-3 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-sans">
                    {clientRequests.map((req) => {
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
                                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Instructions: </span>
                                  {req.note}
                                </p>
                              )}
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
                              className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                                isVerified
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : isUploaded
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                              }`}
                            >
                              {isVerified ? "Verified" : isUploaded ? "Under Review" : "Action Needed"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 min-w-[180px]">
                            {req.file ? (
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-mono font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">
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
                                <span>Pending upload</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {req.file ? (
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={req.file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-[4px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-900 dark:text-white font-mono text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                  title="View File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setActiveUploadRequest(req)}
                                  className="px-2.5 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Re-upload
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveUploadRequest(req)}
                                className="px-3 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CLIENT REQUESTS GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isUploaded = req.status === "uploaded";
                  const isVerified = req.status === "verified";

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
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

                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                              isVerified
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : isUploaded
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            {isVerified ? "Verified" : isUploaded ? "Under Review" : "Action Needed"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                          {req.title}
                        </h4>

                        {req.note && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans line-clamp-3">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              Instructions:{" "}
                            </span>
                            {req.note}
                          </p>
                        )}
                      </div>

                      {/* Action or Uploaded File Details */}
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        {req.file ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-bold text-neutral-900 dark:text-white truncate">
                                  {req.file.fileName}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 shrink-0">
                                {formatFileSize(req.file.fileSize)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={req.file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-1.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-900 dark:text-white font-mono text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setActiveUploadRequest(req)}
                                className="px-3 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Re-upload
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveUploadRequest(req)}
                            className="w-full px-4 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Document</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUB-SECTION 2: OFFICIAL TRANSMITTALS ISSUED BY MCPA */}
          <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white tracking-wider">
                  Official Documents Issued by MCPA ({clientTransmittals.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Direct MCPA Transmittals</span>
            </div>

            {clientTransmittals.length === 0 ? (
              <div className="p-8 text-center rounded-[6px] border border-dashed border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-400 space-y-2">
                <Building className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="font-bold text-neutral-800 dark:text-neutral-200">No Transmittals Issued Yet</p>
                <p className="text-[11px] text-neutral-500 max-w-md mx-auto font-sans">
                  MCPA has not issued any transmittals yet for your project. Preliminary blueprints, quotations, and official project documents will be listed here.
                </p>
              </div>
            ) : docViewMode === "table" ? (
              /* MCPA TRANSMITTALS TABLE VIEW */
              <div className="overflow-x-auto rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Document &amp; Category</th>
                      <th className="py-3 px-4 font-bold">Attachment</th>
                      <th className="py-3 px-4 font-bold">Issued Date</th>
                      <th className="py-3 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-sans">
                    {clientTransmittals.map((tx) => (
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
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-mono font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">
                                {tx.fileName}
                              </p>
                              <p className="text-[10px] font-mono text-neutral-400">
                                {formatFileSize(tx.fileSize)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 min-w-[140px] text-neutral-600 dark:text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDocDate(tx.issuedAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <a
                            href={tx.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-[4px] bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* MCPA TRANSMITTALS GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientTransmittals.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-5 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          {tx.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {formatDocDate(tx.issuedAt)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {tx.title}
                      </h4>

                      {tx.note && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans line-clamp-2">
                          {tx.note}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
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
                        className="px-4 py-2 rounded-[4px] bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUB-SECTION 3: OPTIONAL VAULT DEPOSIT RECORDS */}
          {documents.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
                  Additional Deposited Vault Files ({documents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.doc_id}
                    className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                            {doc.file_name}
                          </p>
                          <span className="text-[10px] font-mono text-neutral-400 uppercase">
                            {doc.doc_type}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-bold uppercase text-emerald-500 bg-emerald-500/10">
                        Deposited
                      </span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>{doc.file_size_bytes ? formatFileSize(doc.file_size_bytes) : "Verified"}</span>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-500 hover:underline flex items-center gap-1 font-bold"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 0% TO 100% ANIMATED UPLOAD MODAL FOR REQUESTED DOCUMENTS */}
      {activeUploadRequest && (
        <DocumentUploadModal
          isOpen={Boolean(activeUploadRequest)}
          onClose={() => setActiveUploadRequest(null)}
          uploadType="client"
          targetRequest={activeUploadRequest}
          clientName={currentUser?.fullName || currentUser?.name || "Client"}
          projectCode={activeUploadRequest.projectCode || "MCPA-CPB-748294"}
          onUploadSuccess={handleRequestUploadSuccess}
        />
      )}

      {/* 0% TO 100% ANIMATED UPLOAD MODAL FOR EXTRA VAULT FILES */}
      {isExtraUploadModalOpen && (
        <DocumentUploadModal
          isOpen={isExtraUploadModalOpen}
          onClose={() => setIsExtraUploadModalOpen(false)}
          uploadType="client"
          targetRequest={{
            title: "Additional Lot / Project Document",
            category: "General Lot Deposit",
            note: "Additional document for engineering records.",
          }}
          clientName={currentUser?.fullName || currentUser?.name || "Client"}
          projectCode={inquiries?.[0]?.trackingId || "MCPA-CPB-748294"}
          onUploadSuccess={handleExtraUploadSuccess}
        />
      )}

      {/* CLIENT WITHDRAW / DISCONTINUE CONSULTATION MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-[12px] bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-neutral-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Withdraw / Discontinue Consultation</span>
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  Project: <strong className="text-neutral-800 dark:text-neutral-200">{activeProject?.project_title || "Residential Inquiry"}</strong> ({activeProject?.project_code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              <div className="p-3.5 rounded-[8px] bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">
                  Notice Regarding Consultation Withdrawal
                </span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
                  Withdrawing will close your current consultation and return your portal to <strong>Phase 1 (Pre-Inquiry)</strong>. If your circumstances change or you wish to resume later, you can submit a new inquiry anytime.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Primary Reason for Withdrawal *
                </label>
                <select
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Budget / Financial Alignment Mismatch">Budget / Financial Alignment Mismatch</option>
                  <option value="Decided Not to Proceed / Umayaw">Decided Not to Proceed at this Time</option>
                  <option value="Disagreement on Scope & Specifications">Scope &amp; Specifications Did Not Align</option>
                  <option value="Project Deferred / Indefinitely Postponed">Project Postponed to a Future Date</option>
                  <option value="Hired Another Contractor">Chosen Another Contractor / Firm</option>
                  <option value="Personal / Family Decision">Personal / Family Circumstances</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                  Optional Notes or Feedback for MCPA Engineering
                </label>
                <textarea
                  rows={3}
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  placeholder="Share any comments or reasons for our team's continuous improvement..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 dark:bg-[#14161f]/95 backdrop-blur-sm -mx-5 -mb-5 px-5 py-3 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Keep Consultation Active
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="px-5 py-2 rounded-[4px] bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmittingWithdraw ? "Processing..." : "Confirm & Revert to Phase 1"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
