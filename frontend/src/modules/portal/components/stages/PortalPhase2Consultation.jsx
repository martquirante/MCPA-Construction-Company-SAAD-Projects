"use client";

import { useState, useEffect, useRef } from "react";
import {
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
} from "lucide-react";
import LordIcon from "@/modules/shared/LordIcon";
import { authFetch } from "@/modules/shared/authFetch";

export default function PortalPhase2Consultation({
  activeProject,
  currentUser,
  showToast,
  onRefreshState,
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

  // 3. Document Vault states
  const [documents, setDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTypeSelected, setDocTypeSelected] = useState("LAND_TITLE");

  // 4. Quotation Request state
  const [quotationRequested, setQuotationRequested] = useState(false);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. STAGE PROGRESS & LIVE STATUS TIMELINE */}
      <div className="p-6 rounded-[8px] border border-amber-500/20 bg-linear-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[3px] bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
              Phase 2 Active · Consultation & Estimation
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight">
              {activeProject?.project_title || "Residential Build Inquiry"}
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Project Code: <span className="font-mono text-amber-400 font-bold">{activeProject?.project_code}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuotationRequested(true);
                showToast("Quotation request submitted to MCPA Estimations Team!");
              }}
              disabled={quotationRequested}
              className={`px-4 py-2 rounded-[4px] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                quotationRequested
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
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
            { step: "1", title: "Inquiry Submitted", status: "Completed", date: "Verified" },
            { step: "2", title: "Document & Lot Review", status: documents.length > 0 ? "Under Review" : "Action Needed", date: "TCT / Valid IDs" },
            { step: "3", title: "Video Consultation", status: isInCall ? "In Session" : "Room Ready", date: meetingRoom?.room_code || "Scheduled" },
            { step: "4", title: "Formal Quotation", status: quotationRequested ? "In Preparation" : "Pending Meeting", date: "Cost Index" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[6px] bg-white/[0.03] border border-white/5 space-y-1 font-mono"
            >
              <div className="flex items-center justify-between text-[11px] text-amber-500 font-bold">
                <span>STEP 0{item.step}</span>
                <span className="text-[10px] text-neutral-400">{item.status}</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{item.title}</div>
              <div className="text-[10px] text-neutral-400 font-sans">{item.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. WEBRTC VIDEO CONFERENCING & LIVE CHAT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: In-App WebRTC Video Conference Room */}
        <div className="lg:col-span-7 flex flex-col rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-amber-500/15 flex items-center justify-center text-amber-500">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight">
                  In-App Consultation Conference
                </h2>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Room Code: {meetingRoom?.room_code || "mcpa-consultation-room"}
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-[3px] text-[10px] font-mono font-bold uppercase tracking-wider ${
              isInCall ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}>
              {isInCall ? "● LIVE MEETING" : "READY TO CONNECT"}
            </span>
          </div>

          {/* Video Screen Canvas */}
          <div className="relative h-80 sm:h-96 w-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
            {isInCall ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <LordIcon
                  src="https://cdn.lordicon.com/msoeawqm.json"
                  size={64}
                  trigger="loop"
                  colors="primary:#f59e0b,secondary:#64748b"
                />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  MCPA Virtual Consultation Portal
                </div>
                <p className="text-xs text-neutral-400 max-w-sm font-sans">
                  Direct peer-to-peer engineering consultation with MCPA Architects & Lead Project Managers.
                </p>
                <button
                  type="button"
                  onClick={startCall}
                  className="px-6 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg transition-transform hover:scale-105"
                >
                  Join Video Consultation
                </button>
              </div>
            )}

            {/* Video Controls Overlay */}
            {isInCall && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 flex items-center gap-3 z-20">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2.5 rounded-full cursor-pointer transition-colors ${
                    isMicMuted ? "bg-rose-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-full cursor-pointer transition-colors ${
                    isVideoMuted ? "bg-rose-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isVideoMuted ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-2.5 rounded-full cursor-pointer transition-colors ${
                    isScreenSharing ? "bg-amber-500 text-neutral-950" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title="Share Screen"
                >
                  <Monitor className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={endCall}
                  className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors"
                  title="Leave Call"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-App Live Chat Beside Meeting */}
        <div className="lg:col-span-5 flex flex-col h-[460px] rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">
                Consultation Thread
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              {messages.length} notes logged
            </span>
          </div>

          {/* Messages Feed */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50 dark:bg-neutral-900/50"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
                <MessageSquare className="w-8 h-8 stroke-[1.5] text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-mono">No consultation notes yet.</p>
                <span className="text-[10px] text-neutral-500 font-sans">
                  Type questions or lot requirements below.
                </span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_user_id === currentUser?.userId || msg.sender_user_id === currentUser?.user_id;
                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-neutral-400">
                      <span className="font-bold text-neutral-600 dark:text-neutral-300">
                        {msg.sender_name || (isMe ? "You" : "MCPA Engineer")}
                      </span>
                      <span>·</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-[6px] text-xs max-w-[85%] font-sans leading-relaxed ${
                        isMe
                          ? "bg-amber-500 text-neutral-950 font-medium"
                          : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 shadow-xs"
                      }`}
                    >
                      {msg.message_text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex gap-2"
          >
            <input
              type="text"
              placeholder="Send message to MCPA team..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-[4px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 font-sans"
            />
            <button
              type="submit"
              disabled={isSendingMsg || !chatInput.trim()}
              className="px-3.5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. DOCUMENT VAULT (TCT, TAX DEC, VALID IDS) */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Document Vault (Lot Titles & Identification)
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Upload lot documents (Transfer Certificate of Title, Tax Declaration, Subdivision Plans) to prepare building permits.
            </p>
          </div>

          {/* Upload Button with Type Selector */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <select
              value={docTypeSelected}
              onChange={(e) => setDocTypeSelected(e.target.value)}
              className="px-3 py-1.5 rounded-[4px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white"
            >
              <option value="LAND_TITLE">Transfer Certificate of Title (TCT)</option>
              <option value="LOT_PLAN">Lot Vicinity & Subdivision Plan</option>
              <option value="TAX_DECLARATION">Tax Declaration Receipt</option>
              <option value="VALID_ID">Government Issued Valid ID</option>
            </select>

            <label className={`px-4 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-colors ${
              isUploadingDoc ? "opacity-50 cursor-not-allowed" : ""
            }`}>
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploadingDoc ? "Uploading..." : "Upload Document"}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={isUploadingDoc}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Uploaded Documents Grid */}
        {documents.length === 0 ? (
          <div className="p-8 text-center rounded-[6px] border border-dashed border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-400 space-y-2">
            <FileUp className="w-8 h-8 text-neutral-400 mx-auto" />
            <p>No documents deposited yet in vault.</p>
            <span className="text-[10px] text-neutral-500 font-sans">
              Accepted files: PDF, High-Res Scanned JPG, PNG (Max 25MB)
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isVerified = doc.verification_status === "Verified";
              const isRejected = doc.verification_status === "Rejected";

              return (
                <div
                  key={doc.doc_id}
                  className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[4px] bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                          {doc.file_name}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">
                          {doc.doc_type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                        isVerified
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : isRejected
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {doc.verification_status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>
                      {doc.file_size_bytes
                        ? (Number(doc.file_size_bytes) / 1024 / 1024).toFixed(2) + " MB"
                        : "Verified"}
                    </span>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      View Vault File
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
