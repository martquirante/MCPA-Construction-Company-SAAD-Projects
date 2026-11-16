"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getSignalingServerUrl } from "../portal/utils/signalingUrl";
import { useLanguage } from "../shared/LanguageContext";
import { CHATBOT_TRANSLATIONS } from "./chatbotTranslations";
import {
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  ExternalLinkIcon,
  CheckIcon,
  MessengerIcon,
} from "../shared/Icons";
import { RotateCcw, Send, AlertCircle, RefreshCw, Video, UserCheck, MessageSquare, CheckCircle } from "lucide-react";
import {
  syncConversationToFirebase,
  saveMessageToFirebase,
  recoverUserConversationFromFirebase,
  subscribeToFirebaseMessages,
} from "./firebaseChatSync";

const STORAGE_KEY = "mcpa_chatbot_session_v1";

/**
 * Resolves whether the current visitor has an authenticated client account
 * and tracks their active project stage (Stage 1, Stage 2, or Stage 3).
 */
function getClientAndStage() {
  if (typeof window === "undefined") {
    return { clientUser: null, dashState: null, stageId: null, isStage2: false, isStage3: false, isStage2or3: false, stageName: "" };
  }
  try {
    const clientUser = JSON.parse(localStorage.getItem("mcpa_client_user") || "null");
    const dashState = JSON.parse(localStorage.getItem("mcpa_client_dashboard_state") || "null");
    const briefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");

    let stageId = dashState?.stage_id || dashState?.activeProject?.stage_id;
    if (!stageId && briefs.length > 0) {
      stageId = briefs[0]?.stage_id || briefs[0]?.stage || briefs[0]?.current_stage;
    }

    const isStage2 =
      stageId === "CONSULTATION" ||
      stageId === "PRE_CONSTRUCTION" ||
      String(stageId).toLowerCase().includes("stage 2");

    const isStage3 =
      stageId === "ACTIVE_BUILD" ||
      String(stageId).toLowerCase().includes("stage 3");

    const isStage2or3 = isStage2 || isStage3;

    const stageName = isStage3
      ? "Stage 3 · Active Build"
      : isStage2
      ? "Stage 2 · Consultation & Planning"
      : stageId === "PRE_INQUIRY"
      ? "Stage 1 · Pre-Inquiry"
      : "";

    return {
      clientUser,
      dashState,
      stageId,
      isStage2,
      isStage3,
      isStage2or3,
      stageName,
    };
  } catch (e) {
    return { clientUser: null, dashState: null, stageId: null, isStage2: false, isStage3: false, isStage2or3: false, stageName: "" };
  }
}

/**
 * Ensures clean paragraph breaks and list item spacing for bot responses,
 * transforming dense inline lists like '(1)..., (2)...' into readable structured lists.
 */
function formatBotResponse(rawText) {
  if (!rawText || typeof rawText !== "string") return rawText;
  if (rawText.includes("\n")) return rawText;

  let formatted = rawText;
  formatted = formatted.replace(
    /([.!?])\s+(Our services include|Kabilang sa aming mga serbisyo|It covers|Kasama rito|MCPA follows|Ipinapatupad ng MCPA|Through your personal portal|Sa iyong personal portal|Operating Hours|Oras ng Operasyon|Direct Contact|Direktang Kontak)/gi,
    "$1\n\n$2"
  );
  formatted = formatted.replace(/:\s*\(1\)\s*/g, ":\n\n1. ");
  formatted = formatted.replace(/(?:;\s*|,\s*(?:and\s+)?)\((\d+)\)\s*/gi, "\n$1. ");

  return formatted;
}

/**
 * Formats message timestamp to readable 12-hour format (e.g. "11:42 AM")
 */
function formatMessageTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

/**
 * Renders structured Markdown with safe bolding, bulleted lists, numbered steps, and links
 */
function MarkdownMessage({ content }) {
  if (!content) return null;

  const paragraphs = String(content).split(/\n{2,}/);

  return (
    <div className="space-y-2 select-text text-[13px] leading-relaxed">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n");
        const isBulletList = lines.length > 0 && lines.every((l) => /^[*\-•]\s+/.test(l.trim()));
        const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-1.5 pl-1 list-none">
              {lines.map((l, lIdx) => {
                const itemText = l.replace(/^[*\-•]\s+/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5 select-none shrink-0">•</span>
                    <span>{renderInlineMarkdown(itemText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 my-1.5 pl-1 list-none">
              {lines.map((l, lIdx) => {
                const match = l.match(/^(\d+)\.\s+(.*)/);
                const num = match ? match[1] : lIdx + 1;
                const itemText = match ? match[2] : l;
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[11px] mt-0.5 select-none shrink-0">
                      {num}.
                    </span>
                    <span>{renderInlineMarkdown(itemText)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={pIdx} className="whitespace-pre-line">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text) {
  if (!text) return "";
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  const parts = String(text).split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-neutral-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 rounded bg-neutral-200/70 dark:bg-white/10 font-mono text-[11px] text-amber-700 dark:text-amber-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            target={match[2].startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
          >
            {match[1]}
          </a>
        );
      }
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Official MCPA Brand Logo Avatar
 * Renders the authentic MCPA Construction & Supply emblem inside a circular badge with subtle amber border
 */
function AnimatedBotAvatar({ className = "", size = "md" }) {
  const sizeClasses =
    size === "sm"
      ? "w-5 h-5 p-0.5"
      : size === "lg"
      ? "w-8 h-8 p-1"
      : "w-7 h-7 p-1";

  return (
    <div
      className={`relative shrink-0 select-none flex items-center justify-center ${className}`}
      title="MCPA Assistant"
    >
      <div
        className={`${sizeClasses} rounded-full ring-1 ring-amber-500/40 bg-neutral-900 border border-white/10 flex items-center justify-center shadow-xs overflow-hidden relative`}
      >
        <Image
          src="/assets/logo-white.svg"
          alt="MCPA Logo"
          fill
          unoptimized
          priority
          className="object-contain p-0.5"
          sizes="32px"
        />
      </div>
    </div>
  );
}

const SystemBotAvatar = AnimatedBotAvatar;

/**
 * Human Admin Avatar with verified photo and fallback initials badge
 */
function AdminAvatar({ name, avatarUrl }) {
  const initials = (name || "Admin")
    .replace(/^engr\.?\s+/i, "")
    .replace(/^arch\.?\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AD";

  if (avatarUrl) {
    return (
      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-500/60 shadow-xs shrink-0 select-none">
        <Image
          src={avatarUrl}
          alt={name || "Admin"}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 border border-amber-400 font-bold text-[10px] font-mono flex items-center justify-center shadow-xs shrink-0 select-none">
      {initials}
    </div>
  );
}

/**
 * Typewriter Effect Component for streaming bot responses ("parang nagsusulat")
 */
function TypewriterMessage({ text, onComplete, onCharTyped }) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    let current = 0;
    const fullText = textRef.current || "";
    if (!fullText) {
      onComplete?.();
      return;
    }

    // Dynamic typing speed: fast fluid pace (~150 chars/sec)
    const step = fullText.length > 350 ? 3 : fullText.length > 150 ? 2 : 1;
    const interval = setInterval(() => {
      current += step;
      if (current >= fullText.length) {
        setDisplayedCount(fullText.length);
        clearInterval(interval);
        onComplete?.();
        onCharTyped?.();
      } else {
        setDisplayedCount(current);
        onCharTyped?.();
      }
    }, 14);

    return () => clearInterval(interval);
  }, [onComplete, onCharTyped]);

  const isTyping = displayedCount < text.length;
  const visible = text.slice(0, displayedCount);

  return (
    <div className="whitespace-pre-line select-text leading-relaxed">
      {visible}
      {isTyping && (
        <span
          className="inline-block w-1.5 h-3.5 bg-amber-500 ml-1 rounded-[1px] animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function ChatWidgetPanel({ onClose }) {
  const { language } = useLanguage();
  const t = CHATBOT_TRANSLATIONS[language] || CHATBOT_TRANSLATIONS.en;

  // Session state
  const [session, setSession] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Authenticated client & Stage 2 / 3 tracking
  const [clientInfo, setClientInfo] = useState(() => getClientAndStage());

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("BOT_ACTIVE"); // BOT_ACTIVE | AWAITING_HUMAN | HUMAN_ASSIGNED | HUMAN_ACTIVE | RESOLVED | CLOSED
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [animatingMessageId, setAnimatingMessageId] = useState(null);

  // Live suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const debounceTimerRef = useRef(null);

  // Email Gate state for human escalation
  const [isEmailGateActive, setIsEmailGateActive] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Configuration from backend
  const [config, setConfig] = useState(null);

  // DOM refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsBoxRef = useRef(null);
  const pollingTimerRef = useRef(null);

  // Sync client profile and project stage changes in real-time
  useEffect(() => {
    const handleSync = () => {
      setClientInfo(getClientAndStage());
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("mcpa-project-stage-updated", handleSync);
    window.addEventListener("mcpa-briefs-updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("mcpa-project-stage-updated", handleSync);
      window.removeEventListener("mcpa-briefs-updated", handleSync);
    };
  }, []);

  // 1. Load initial config and existing session on mount
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function init() {
      try {
        // Fetch public config in background (non-blocking)
        fetch("/api/chatbot/config", { signal: abortController.signal })
          .then((r) => (r.ok ? r.json() : null))
          .then((confData) => {
            if (isMounted && confData?.success) {
              setConfig(confData);
            }
          })
          .catch(() => {});

        // Check local storage for existing session
        const stored = localStorage.getItem(STORAGE_KEY);
        const { clientUser } = getClientAndStage();

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.conversationId && parsed?.sessionToken) {
              // Verify session by fetching latest messages with a strict 3-second timeout
              const sessionAbort = new AbortController();
              const timeoutId = setTimeout(() => sessionAbort.abort(), 3000);

              try {
                const msgRes = await fetch(
                  `/api/chatbot/conversations/${parsed.conversationId}/messages`,
                  {
                    headers: {
                      "X-Chat-Session-Token": parsed.sessionToken,
                    },
                    signal: sessionAbort.signal,
                  }
                );
                clearTimeout(timeoutId);

                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  if (isMounted && msgData.success) {
                    setSession(parsed);
                    setStatus(msgData.status || "BOT_ACTIVE");
                    setAssignedAdmin(msgData.assignedAdmin || null);
                    setMessages(msgData.messages || []);
                    setIsInitializing(false);
                    // Sync to Firebase in background
                    syncConversationToFirebase(parsed.conversationId, parsed);
                    if (Array.isArray(msgData.messages)) {
                      msgData.messages.forEach((m) => saveMessageToFirebase(parsed.conversationId, m));
                    }
                    return;
                  }
                }
              } catch (sessionErr) {
                clearTimeout(timeoutId);
              }
            }
          } catch (e) {}
        }

        // AUTO-LOGIN RECOGNITION & CROSS-DEVICE FIREBASE RECOVERY:
        // If user is logged in (has account), check Firebase for cross-device conversation recovery!
        if (clientUser && (clientUser.fullName || clientUser.name)) {
          const clientName = (clientUser.fullName || clientUser.name).trim();
          const clientEmail = (clientUser.email || "").trim().toLowerCase();

          // 1. Cross-Device Firebase Recovery check
          if (clientEmail) {
            try {
              const recovered = await recoverUserConversationFromFirebase(clientEmail);
              if (recovered?.conversationId && Array.isArray(recovered.messages) && recovered.messages.length > 0) {
                const recoveredSession = {
                  conversationId: recovered.conversationId,
                  sessionToken: recovered.conversation?.sessionToken || `fb_sync_${Date.now()}`,
                  customerName: recovered.conversation?.customerName || clientName,
                  customerEmail: clientEmail,
                  status: recovered.conversation?.status || "BOT_ACTIVE",
                };
                if (isMounted) {
                  setSession(recoveredSession);
                  setStatus(recoveredSession.status);
                  setMessages(recovered.messages);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveredSession));
                  setIsInitializing(false);
                  return;
                }
              }
            } catch (fbErr) {
              console.warn("[ChatWidget] Firebase recovery check note:", fbErr.message);
            }
          }

          try {
            const autoRes = await fetch("/api/chatbot/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerName: clientName,
                customerEmail: clientEmail,
                language: language === "fil" ? "fil" : "en",
              }),
            });

            if (autoRes.ok) {
              const autoData = await autoRes.json();
              if (isMounted && autoData.success) {
                const autoSession = {
                  conversationId: autoData.conversationId,
                  sessionToken: autoData.sessionToken,
                  customerName: autoData.customerName,
                  customerEmail: clientEmail,
                  status: autoData.status,
                };
                setSession(autoSession);
                setStatus(autoData.status || "BOT_ACTIVE");
                setAssignedAdmin(autoData.assignedAdmin || null);
                setMessages(autoData.messages || []);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(autoSession));
                // Sync to Firebase
                syncConversationToFirebase(autoSession.conversationId, autoSession);
                if (Array.isArray(autoData.messages)) {
                  autoData.messages.forEach((m) => saveMessageToFirebase(autoSession.conversationId, m));
                }
                setIsInitializing(false);
                return;
              }
            }
          } catch (autoErr) {
            console.warn("[ChatWidget] Auto-session recognition error:", autoErr);
          }
        }
      } catch (err) {
        console.warn("[ChatWidget] Init error:", err);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      abortController.abort();
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [language]);

  // 2. Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isSending, isSuggestionsOpen, isEmailGateActive, scrollToBottom]);

  // 3. Polling for live support messages and status synchronization
  useEffect(() => {
    if (!session?.conversationId || !session?.sessionToken) return;
    const isLive = ["AWAITING_HUMAN", "HUMAN_ASSIGNED", "HUMAN_ACTIVE"].includes(status);
    const pollInterval = isLive ? 3500 : 6000;

    const poll = async () => {
      // Don't poll if document is hidden to save mobile battery
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const lastMsg = messages[messages.length - 1];
        const afterId = lastMsg?.message_id || 0;
        const res = await fetch(
          `/api/chatbot/conversations/${session.conversationId}/messages?afterId=${afterId}`,
          {
            headers: {
              "X-Chat-Session-Token": session.sessionToken,
            },
          }
        );

        if (res.status === 401 || res.status === 403 || res.status === 404) {
          // Session expired or revoked; clear stale state
          localStorage.removeItem(STORAGE_KEY);
          setSession(null);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.status && data.status !== status) {
              setStatus(data.status);
            }
            if (data.assignedAdmin) {
              setAssignedAdmin(data.assignedAdmin);
            }
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.message_id));
                const newItems = data.messages.filter((m) => !existingIds.has(m.message_id));
                return newItems.length > 0 ? [...prev, ...newItems] : prev;
              });
            }
          }
        }
      } catch (e) {}
    };

    pollingTimerRef.current = setInterval(poll, pollInterval);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [session, status, messages]);

  // 3B. Real-time Message Synchronization via Firebase Firestore onSnapshot
  useEffect(() => {
    if (!session?.conversationId) return;

    const unsubscribe = subscribeToFirebaseMessages(
      session.conversationId,
      (firebaseMsgs) => {
        if (!Array.isArray(firebaseMsgs) || firebaseMsgs.length === 0) return;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => String(m.message_id || m.id)));
          const incomingNew = [];

          firebaseMsgs.forEach((fm) => {
            const id = String(fm.message_id || fm.messageId || fm.id);
            if (!existingIds.has(id)) {
              incomingNew.push({
                message_id: id,
                sender_type: fm.sender_type || fm.senderType || "bot",
                sender_id: fm.sender_id || fm.senderId,
                message_text: fm.message_text || fm.messageText || "",
                created_at: fm.created_at || new Date().toISOString(),
                metadata: fm.metadata || null,
              });
            }
          });

          if (incomingNew.length === 0) return prev;
          return [...prev, ...incomingNew].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [session?.conversationId]);

  // 4. Handle Step 1 — Name Submission (Supports manual or programmatic override)
  const handleStartSession = async (e, overrideData = null) => {
    e?.preventDefault();
    const clean = (overrideData?.customerName || nameInput).trim();
    const cleanEmail = (overrideData?.customerEmail || "").trim().toLowerCase();

    if (!clean || clean.length < 1 || clean.length > 50) {
      setNameError(t.nameValidation);
      return;
    }
    if (/[\x00-\x1F\x7F<>]/.test(clean)) {
      setNameError(t.nameValidation);
      return;
    }

    setNameError("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: clean,
          customerEmail: cleanEmail || undefined,
          language: language === "fil" ? "fil" : "en",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setNameError(errData.message || "Failed to start conversation. Please try again.");
        setIsSending(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        const newSession = {
          conversationId: data.conversationId,
          sessionToken: data.sessionToken,
          customerName: data.customerName,
          customerEmail: cleanEmail || data.customerEmail,
          status: data.status,
        };
        setSession(newSession);
        setStatus(data.status);
        if (data.assignedAdmin) {
          setAssignedAdmin(data.assignedAdmin);
        }
        setMessages(data.messages || []);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        // Sync to Firebase
        syncConversationToFirebase(newSession.conversationId, newSession);
        if (Array.isArray(data.messages)) {
          data.messages.forEach((m) => saveMessageToFirebase(newSession.conversationId, m));
        }
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      setNameError("Connection error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // 4B. Handle Instant Video Call (Connected to Instant Meeting for Stage 2 & 3 Clients)
  const handleStartInstantVideoCall = () => {
    const { clientUser, dashState } = getClientAndStage();
    const roomCodeBase =
      dashState?.roomCode ||
      dashState?.activeProject?.roomCode ||
      (clientUser?.id ? `mcpa-instant-${String(clientUser.id).slice(-6)}` : `mcpa-instant-${Date.now().toString(36).slice(-6)}`);

    const cleanRoomCode = roomCodeBase.startsWith("mcpa-") ? roomCodeBase : `mcpa-${roomCodeBase}`;

    const clientAvatar =
      clientUser?.avatar_url ||
      clientUser?.avatarUrl ||
      dashState?.activeProject?.client_avatar ||
      "";

    const instantCallPayload = {
      active: true,
      roomCode: cleanRoomCode,
      clientName: clientUser?.fullName || clientUser?.name || session?.customerName || "Valued Client",
      clientEmail: clientUser?.email || session?.customerEmail || "",
      clientAvatar,
      clientPhone: clientUser?.phone || clientUser?.phoneNumber || "",
      projectCode: dashState?.activeProject?.project_code || "MCPA-CLIENT",
      projectTitle: dashState?.activeProject?.project_title || "Instant Video Consultation",
      startedAt: Date.now(),
      answered: false,
      adminJoined: false,
    };

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([150, 100, 150]);
      }
      localStorage.setItem("mcpa_instant_call_active", JSON.stringify(instantCallPayload));
      window.dispatchEvent(new CustomEvent("mcpa-instant-call-alert", { detail: instantCallPayload }));

      const socket = io(getSignalingServerUrl(), { transports: ["polling", "websocket"], reconnectionAttempts: 5 });
      socket.on("connect", () => {
        socket.emit("instant-call-start", instantCallPayload);
      });
      socket.emit("instant-call-start", instantCallPayload);
      setTimeout(() => socket.disconnect(), 5000);
    } catch (e) {
      console.warn("[ChatWidget] Instant call signaling error:", e);
    }

    setMessages((prev) => [
      ...prev,
      {
        message_id: `call_${Date.now()}`,
        sender_type: "SYSTEM",
        message_text:
          language === "fil"
            ? `🎥 Sinimulan ang Instant Video Call (Room: ${cleanRoomCode}). Nag-riring na ito sa MCPA Engineering Team.`
            : `🎥 Instant Video Call initiated (Room: ${cleanRoomCode}). Alerting MCPA Engineering Team.`,
        created_at: new Date().toISOString(),
      },
    ]);

    window.open(`/meet/${cleanRoomCode}`, "_blank");
  };

  // 4C. Handle Direct to Admin (Stage 2 & 3 Bypass FAQ Bot)
  const handleDirectToAdmin = async () => {
    if (!session?.conversationId) return;
    const { clientUser } = getClientAndStage();
    const verifiedEmail = (clientUser?.email || session?.customerEmail || "").trim();

    if (!verifiedEmail) {
      setIsEmailGateActive(true);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/chatbot/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Session-Token": session.sessionToken,
        },
        body: JSON.stringify({
          conversationId: session.conversationId,
          customerEmail: verifiedEmail,
          language: language === "fil" ? "fil" : "en",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("AWAITING_HUMAN");
        setIsEmailGateActive(false);
        if (data.botMessage) {
          setMessages((prev) => [...prev, data.botMessage]);
        }
        syncConversationToFirebase(session.conversationId, {
          status: "AWAITING_HUMAN",
          customerEmail: verifiedEmail,
        });
        if (data.botMessage) {
          saveMessageToFirebase(session.conversationId, data.botMessage);
        }
      }
    } catch (err) {
      console.warn("[ChatWidget] Direct to admin error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Handle Live Suggestions Debounce (Step 2)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuestionInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/chatbot/suggestions?q=${encodeURIComponent(val.trim())}&lang=${language === "fil" ? "fil" : "en"}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setIsSuggestionsOpen(true);
            setActiveSuggestionIndex(-1);
          } else {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
          }
        }
      } catch (err) {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    }, config?.debounceMs || 250);
  };

  // 6. Handle Submitting Question (Step 3)
  const submitQuestion = useCallback(
    async (questionText) => {
      const text = (questionText || questionInput).trim();
      if (!text || isSending || !session) return;

      setIsSuggestionsOpen(false);
      setSuggestions([]);
      setQuestionInput("");
      setIsSending(true);

      // If conversation was marked resolved, resume active conversation
      if (status === "RESOLVED") {
        setStatus("BOT_ACTIVE");
      }

      const now = Date.now();
      // Optimistic customer bubble
      const tempCustomerMsg = {
        message_id: `temp_${now}`,
        sender_type: "CUSTOMER",
        message_text: text,
        created_at: new Date(now).toISOString(),
      };
      setMessages((prev) => [...prev, tempCustomerMsg]);

      try {
        const res = await fetch("/api/chatbot/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Chat-Session-Token": session.sessionToken,
          },
          body: JSON.stringify({
            conversationId: session.conversationId,
            question: text,
            language: language === "fil" ? "fil" : "en",
          }),
        });

        if (!res.ok) {
          throw new Error("Server error");
        }

        const data = await res.json();
        if (data.success) {
          if (data.humanHandoffActive) {
            // Live admin mode
            setMessages((prev) =>
              prev.map((m) => (m.message_id === tempCustomerMsg.message_id ? data.customerMessage : m))
            );
            if (data.customerMessage) {
              saveMessageToFirebase(session.conversationId, data.customerMessage);
            }
          } else {
            // Replace temp customer message with confirmed and append bot message with typewriter effect
            const botMsg = data.botMessage;
            if (botMsg?.message_id) {
              setAnimatingMessageId(botMsg.message_id);
            }
            setMessages((prev) => [
              ...prev.filter((m) => m.message_id !== tempCustomerMsg.message_id),
              data.customerMessage,
              botMsg,
            ]);
            if (data.customerMessage) {
              saveMessageToFirebase(session.conversationId, data.customerMessage);
            }
            if (botMsg) {
              saveMessageToFirebase(session.conversationId, botMsg);
            }
          }
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            message_id: `err_${Date.now()}`,
            sender_type: "BOT",
            message_text:
              language === "fil"
                ? "Paumanhin, nagkaroon ng pansamantalang problema sa koneksyon. Pakisubukan muli."
                : "Sorry, there was a temporary connection issue. Please try submitting your question again.",
            metadata: { isError: true },
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsSending(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [questionInput, isSending, session, language, status]
  );

  // 7. Handle Suggestion Keyboard Navigation
  const handleKeyDown = (e) => {
    if (isSuggestionsOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Enter" && activeSuggestionIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        submitQuestion(selected.question);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsSuggestionsOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  // 8. Handle Answer Feedback (Step 4A Yes / Step 4B No)
  const handleFeedback = async (messageId, faqId, isHelpful) => {
    if (!session) return;
    try {
      const res = await fetch("/api/chatbot/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Session-Token": session.sessionToken,
        },
        body: JSON.stringify({
          conversationId: session.conversationId,
          messageId,
          faqId,
          isHelpful,
          language: language === "fil" ? "fil" : "en",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.botMessage) {
          if (data.status === "RESOLVED") {
            setStatus("RESOLVED");
          }
          setMessages((prev) => [...prev, data.botMessage]);
        }
      }
    } catch (e) {}
  };

  // 9. Handle Human Support Request (Email Gate submission)
  const handleEmailGateSubmit = async (e) => {
    e?.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEmailError(t.emailInvalid);
      return;
    }

    setEmailError("");
    setIsSubmittingEmail(true);

    try {
      const res = await fetch("/api/chatbot/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Session-Token": session.sessionToken,
        },
        body: JSON.stringify({
          conversationId: session.conversationId,
          customerEmail: cleanEmail,
          language: language === "fil" ? "fil" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEmailError(data.message || t.emailInvalid);
        setIsSubmittingEmail(false);
        return;
      }

      setStatus("AWAITING_HUMAN");
      setIsEmailGateActive(false);
      setEmailInput("");
      if (data.botMessage) {
        setMessages((prev) => [...prev, data.botMessage]);
      }
      syncConversationToFirebase(session.conversationId, {
        status: "AWAITING_HUMAN",
        customerEmail: cleanEmail,
      });
      if (data.botMessage) {
        saveMessageToFirebase(session.conversationId, data.botMessage);
      }
    } catch (err) {
      setEmailError("Failed to connect. Please check your network and try again.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // 10. Start a New Conversation (Step 4A Reset)
  const handleStartNewConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setMessages([]);
    setNameInput("");
    setQuestionInput("");
    setStatus("BOT_ACTIVE");
    setAssignedAdmin(null);
    setIsEmailGateActive(false);
  };

  const isLiveSupportMode = ["AWAITING_HUMAN", "HUMAN_ASSIGNED", "HUMAN_ACTIVE"].includes(status);
  const isResolvedMode = status === "RESOLVED";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="MCPA Construction Customer Support"
      className="relative flex flex-col h-full w-full bg-white dark:bg-[#0c0e12] text-neutral-900 dark:text-neutral-100 select-text overflow-hidden font-sans border-0 shadow-none sm:rounded-[12px]"
    >
      {/* Top-Right Fading Dot Grid (Dense & Small, fading towards bottom-left) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden dark:block"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.28) 1.1px, transparent 1.1px)",
          backgroundSize: "13px 13px",
          maskImage: "radial-gradient(ellipse 95% 85% at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.12) 65%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 95% 85% at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.12) 65%, transparent 85%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden block dark:hidden"
        style={{
          backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.16) 1.1px, transparent 1.1px)",
          backgroundSize: "13px 13px",
          maskImage: "radial-gradient(ellipse 95% 85% at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.12) 65%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 95% 85% at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.12) 65%, transparent 85%)",
        }}
      />

      {/* -------------------------------------------------------------------
          HEADER BAR: Avatar + MCPA Support + Subtitle + RotateCcw & Close
      -------------------------------------------------------------------- */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-[#0c0e12]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Header Avatar: Official MCPA Brand Logo */}
          <div className="relative shrink-0 flex items-center justify-center">
            <AnimatedBotAvatar size="lg" />
            {/* Small active green online beacon */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0e12]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs uppercase tracking-wider truncate text-neutral-900 dark:text-white font-sans">
                {t.headerTitle || "MCPA Support"}
              </span>
              {clientInfo?.isStage2or3 && (
                <span className="px-1.5 py-0.2 rounded-[3px] bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 shrink-0">
                  {clientInfo.isStage3 ? t.stage3Badge : t.stage2Badge}
                </span>
              )}
            </div>

            {/* Sub-status Indicator */}
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate font-normal">
              {isLiveSupportMode
                ? assignedAdmin
                  ? `${t.statusHumanAssigned} (${assignedAdmin.fullName})`
                  : t.statusAwaitingHuman
                : isResolvedMode
                ? t.statusResolved
                : clientInfo?.clientUser?.fullName
                ? `${(t.welcomeBack || "Welcome back, {name}!").replace("{name}", clientInfo.clientUser.fullName.split(" ")[0])}`
                : (t.headerSubtitle || "Design & Build · In-House Supply")}
            </p>
          </div>
        </div>

        {/* Action Controls: Instant Video Call (Stage 2 & 3), Direct Admin Chat (Stage 2 & 3), Restart, Close */}
        <div className="flex items-center gap-1 shrink-0">
          {clientInfo?.isStage2or3 && (
            <>
              {/* Instant Video Call Button (Connected to Instant Meeting) */}
              <button
                type="button"
                onClick={handleStartInstantVideoCall}
                title={t.instantVideoCallTooltip}
                aria-label={t.instantVideoCall}
                className="group relative flex items-center gap-1 px-2 py-1 rounded-[4px] bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-neutral-950 border border-amber-500/35 hover:border-amber-500 transition-all cursor-pointer shadow-xs"
              >
                <Video className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 group-hover:text-neutral-950 animate-pulse group-hover:animate-none" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
                  Call
                </span>
              </button>

              {/* Direct to Admin Shortcut (Bypasses Bot) */}
              {!isLiveSupportMode && (
                <button
                  type="button"
                  onClick={handleDirectToAdmin}
                  title={t.directToAdminTooltip}
                  aria-label={t.directToAdmin}
                  className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-neutral-200/70 dark:bg-white/[0.06] hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 border border-neutral-300/80 dark:border-white/10 transition-all cursor-pointer text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
            </>
          )}

          {/* Reset / Restart Conversation Button */}
          <button
            type="button"
            onClick={handleStartNewConversation}
            title="Restart conversation"
            aria-label="Restart conversation"
            className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close Chat Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 rounded-[4px] text-neutral-400 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          CONVERSATION VIEWPORT: Scrollable messages container
      -------------------------------------------------------------------- */}
      <div
        className={`relative z-10 flex-1 overflow-y-auto overscroll-contain p-4 text-xs ${
          !session ? "flex flex-col justify-start" : "space-y-3.5"
        }`}
      >
        {/* Loading Spinner during initial session check */}
        {isInitializing && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-neutral-400">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span className="text-[11px] font-mono">{t.connectingBadge}</span>
          </div>
        )}

        {/* STEP 1: INITIAL GREETING & NAME COLLECTION GATE (3 Bot Bubbles + Name Card) */}
        {!isInitializing && !session && (
          <div className="w-full flex flex-col space-y-2.5 py-2 animate-fadeIn">
            {/* Sender identity: MCPA Bot avatar + label */}
            <div className="flex items-center gap-1.5 px-0.5 select-none mb-0.5">
              <AnimatedBotAvatar size="sm" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                MCPA ASSISTANT
              </span>
            </div>

            {/* Bubble 1 */}
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-[#151921] border border-neutral-200/80 dark:border-white/5 text-[12.5px] leading-relaxed text-neutral-800 dark:text-neutral-100 shadow-xs max-w-[95%]">
              {language === "fil"
                ? "Kumusta! 👋 Maligayang pagdating sa MCPA Construction and Supply."
                : "Hello! 👋 Welcome to MCPA Construction and Supply."}
            </div>

            {/* Bubble 2 */}
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-[#151921] border border-neutral-200/80 dark:border-white/5 text-[12.5px] leading-relaxed text-neutral-800 dark:text-neutral-100 shadow-xs max-w-[95%]">
              {language === "fil"
                ? "Ako ang inyong MCPA AI Project Assistant. Narito ako upang sagutin ang inyong mga katanungan tungkol sa aming design-and-build services, construction packages, proseso ng quotation at konsultasyon, at mga building permit."
                : "I'm your MCPA AI Project Assistant. I can help answer your questions about our design-and-build services, construction packages, quotation process, and building permits."}
            </div>

            {/* Bubble 3 */}
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-[#151921] border border-neutral-200/80 dark:border-white/5 text-[12.5px] leading-relaxed text-neutral-800 dark:text-neutral-100 shadow-xs max-w-[95%]">
              {language === "fil"
                ? "Bago tayo magsimula, ano ang nais mong itawag ko sa iyo?"
                : "Before we get started, what would you like me to call you?"}
            </div>

            {/* Display Name Input Card */}
            <div className="w-full mt-2 p-3.5 rounded-xl bg-white dark:bg-[#0f131a] border border-neutral-200 dark:border-white/10 shadow-sm space-y-2.5">
              <label className="block text-[10.5px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t.namePromptSubtitle || "YOUR PREFERRED DISPLAY NAME"}
              </label>

              <form onSubmit={handleStartSession} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={50}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  placeholder={t.namePlaceholder || "Enter your name..."}
                  autoFocus
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-black/60 border border-neutral-300 dark:border-neutral-700/80 focus:border-amber-500 dark:focus:border-neutral-400 focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors font-sans"
                />

                <button
                  type="submit"
                  disabled={isSending || !nameInput.trim()}
                  className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-[#f4efe6] hover:bg-neutral-800 dark:hover:bg-white active:scale-95 text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>{isSending ? "..." : t.continue}</span>
                </button>
              </form>

              {nameError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 to 4: CONVERSATION MESSAGES */}
        {!isInitializing && session && (
          <>
            {/* Stage 2 & Stage 3 Project Status & Instant Connection Card */}
            {clientInfo?.isStage2or3 && !isLiveSupportMode && (
              <div className="p-2.5 rounded-[6px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 mb-2 flex items-center justify-between gap-2 animate-fadeIn select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 block truncate">
                      {clientInfo.stageName}
                    </span>
                    <span className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                      {language === "fil" ? "Konektado sa Engineering Team" : "Connected with Engineering Team"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartInstantVideoCall}
                    title={t.instantVideoCallTooltip}
                    className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono text-[9.5px] font-bold uppercase transition-colors shadow-2xs cursor-pointer"
                  >
                    <Video className="w-3 h-3" />
                    <span>Video Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectToAdmin}
                    title={t.directToAdminTooltip}
                    className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-neutral-200/80 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 font-mono text-[9.5px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isCustomer = msg.sender_type === "CUSTOMER";
              const isBot = msg.sender_type === "BOT";
              const isHumanAdmin = msg.sender_type === "ADMIN" || msg.sender_type === "human_agent" || msg.sender_type === "STAFF";
              const isSystem = msg.sender_type === "SYSTEM";

              if (isSystem) {
                return (
                  <div key={msg.message_id ? `sys_${msg.message_id}` : `sys_idx_${idx}`} className="text-center my-2 select-none">
                    <span className="inline-block px-3 py-1 rounded-[4px] bg-neutral-200/60 dark:bg-white/[0.04] text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border border-neutral-200/80 dark:border-white/5 shadow-2xs">
                      {msg.message_text}
                    </span>
                  </div>
                );
              }

              const adminName = msg.sender_name || assignedAdmin?.fullName || (isHumanAdmin ? "MCPA Support Admin" : null);
              const adminAvatar = msg.sender_avatar || assignedAdmin?.avatarUrl || null;
              const isCurrentlyTypewriting = isBot && msg.message_id === animatingMessageId;
              const timeFormatted = formatMessageTime(msg.created_at);

              return (
                <div
                  key={msg.message_id ? `msg_${msg.message_id}` : `msg_idx_${idx}`}
                  className={`flex gap-2.5 ${isCustomer ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  {/* Bot / Admin Avatar */}
                  {!isCustomer && (
                    <div className="shrink-0 mt-0.5">
                      {isHumanAdmin ? (
                        <AdminAvatar name={adminName} avatarUrl={adminAvatar} />
                      ) : (
                        <SystemBotAvatar />
                      )}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] space-y-1.5`}>
                    {/* Admin Display Name & Staff Badge */}
                    {isHumanAdmin && (
                      <div className="flex items-center gap-1.5 select-none">
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          {adminName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-[3px] bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          Staff
                        </span>
                      </div>
                    )}

                    {/* Bubble Content: Customer is warm Amber #F59E0B with dark charcoal text #171717! */}
                    <div
                      className={`p-3.5 leading-relaxed shadow-xs transition-all ${
                        isCustomer
                          ? "bg-[#F59E0B] text-[#171717] font-medium rounded-[14px] rounded-tr-[3px] border border-amber-600/30 text-right"
                          : isHumanAdmin
                          ? "bg-amber-500/5 dark:bg-[#181d28] text-neutral-900 dark:text-neutral-100 rounded-[14px] rounded-tl-[3px] border border-amber-500/35"
                          : "bg-white dark:bg-[#121620] text-neutral-800 dark:text-neutral-200 rounded-[14px] rounded-tl-[3px] border border-neutral-200/80 dark:border-white/10"
                      }`}
                    >
                      {isCurrentlyTypewriting ? (
                        <TypewriterMessage
                          text={formatBotResponse(msg.message_text)}
                          onComplete={() => setAnimatingMessageId(null)}
                          onCharTyped={() => scrollToBottom(false)}
                        />
                      ) : isCustomer ? (
                        <p className="whitespace-pre-line select-text">
                          {msg.message_text}
                        </p>
                      ) : (
                        <MarkdownMessage content={formatBotResponse(msg.message_text)} />
                      )}

                      {/* Source Citations from Company Knowledge Base */}
                      {msg.metadata?.sources && Array.isArray(msg.metadata.sources) && msg.metadata.sources.length > 0 && (
                        <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 mt-2.5 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                            Sources:
                          </span>
                          {msg.metadata.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.sourceUrl || "#"}
                              target={src.sourceUrl?.startsWith("http") ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-mono transition-colors"
                            >
                              <span>📄 {src.source || src.title}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Message Footer: Timestamp, AI Provider Tag & Copy Button */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-neutral-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          {timeFormatted && (
                            <span
                              className={`text-[9px] font-mono select-none ${
                                isCustomer
                                  ? "text-neutral-900/60 font-medium"
                                  : "text-neutral-400 dark:text-neutral-500"
                              }`}
                            >
                              {timeFormatted}
                            </span>
                          )}
                        </div>

                        {!isCustomer && (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(msg.message_text);
                              } catch (_) {}
                            }}
                            title="Copy response"
                            className="text-[9px] font-mono text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer select-none px-1 py-0.5 rounded"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clarifying Options Buttons (if engine returned ambiguous matches) */}
                    {msg.metadata?.clarifyingOptions && Array.isArray(msg.metadata.clarifyingOptions) && (
                      <div className="space-y-1.5 pt-1">
                        {msg.metadata.clarifyingOptions.map((opt, oIdx) => (
                          <button
                            key={`clarify_${opt.faqId || oIdx}_${oIdx}`}
                            type="button"
                            onClick={() => submitQuestion(opt.question)}
                            className="w-full text-left p-2 rounded-[4px] bg-white dark:bg-[#121620] hover:bg-amber-50 dark:hover:bg-white/[0.04] border border-neutral-200 dark:border-white/10 hover:border-amber-500 text-xs text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          >
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold mr-1.5">
                              {oIdx + 1}.
                            </span>
                            <span>{opt.question}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* STEP 3 FEEDBACK PROMPT: "Did this answer your question?" */}
                    {msg.metadata?.requiresFeedback && !isResolvedMode && (
                      <div className="p-2.5 rounded-[4px] bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
                        <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                          {t.didThisHelp}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.message_id, msg.matched_faq_id, true)}
                            className="flex-1 py-1 px-2 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            {t.yesHelpful}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.message_id, msg.matched_faq_id, false)}
                            className="flex-1 py-1 px-2 rounded-[3px] bg-neutral-200 hover:bg-neutral-300 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            {t.noNeedMore}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4B & 4C ESCALATION MENU: Messenger, Socials, Continue Chatting */}
                    {msg.metadata?.showEscalation && !isLiveSupportMode && (
                      <div className="p-3 rounded-[6px] bg-white dark:bg-[#121620] border border-amber-500/30 space-y-2.5 shadow-xs">
                        <p className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          Connect with MCPA:
                        </p>

                        {/* Option 1 — Continue Chatting (Activates Email Gate) */}
                        <button
                          type="button"
                          onClick={() => setIsEmailGateActive(true)}
                          className="w-full py-2 px-3 rounded-[4px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-semibold tracking-wider transition-colors border border-neutral-200 dark:border-white/10 cursor-pointer flex flex-col items-center justify-center leading-tight gap-0.5"
                        >
                          <span className="font-bold tracking-wider">{t.continueChatting}</span>
                          <span className="text-[10.5px] font-mono normal-case font-normal text-neutral-500 dark:text-neutral-400">
                            {t.talkWithRealPersonParentheses || "(talk with real person)"}
                          </span>
                        </button>

                        {/* Option 2 — Chat in Messenger (Talk with a Real Person) */}
                        <a
                          href={config?.messengerUrl || "https://www.messenger.com/t/101780969082788"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between p-2 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors shadow-xs cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MessengerIcon className="w-4 h-4 shrink-0 drop-shadow-xs group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-start leading-tight">
                              <span className="font-bold tracking-wider font-mono text-xs">
                                {t.chatInMessenger || "Chat in Messenger"}
                              </span>
                              <span className="text-[10.5px] font-mono normal-case font-normal text-neutral-950/85">
                                {t.talkWithRealPersonParentheses || "(talk with real person)"}
                              </span>
                            </div>
                          </div>
                          <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 ml-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                        </a>

                        {/* Option 3 — Social Media Contacts Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-150 dark:border-white/5">
                          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                            Official Socials:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={config?.socialLinks?.facebook || "https://www.facebook.com/MCPA.ConstructionandSupply/"}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="MCPA Facebook"
                              className="p-1 rounded-[3px] text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                            >
                              <FacebookIcon className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={config?.socialLinks?.instagram || "https://www.instagram.com/mcpa.constructionandsupply/"}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="MCPA Instagram"
                              className="p-1 rounded-[3px] text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={config?.socialLinks?.tiktok || "https://www.tiktok.com/@mcpa.construction"}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="MCPA TikTok"
                              className="p-1 rounded-[3px] text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                            >
                              <TikTokIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* MANDATORY EMAIL PROMPT CARD (Triggered when customer clicks "Continue Chatting") */}
            {isEmailGateActive && (
              <div className="p-3.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold font-mono text-xs uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t.emailGateTitle}</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-normal">
                  {t.emailGateSubtitle}
                </p>

                <form onSubmit={handleEmailGateSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder={t.emailPlaceholder}
                    autoFocus
                    className="w-full px-3 py-1.5 text-xs rounded-[4px] bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/15 focus:border-amber-500 focus:outline-none transition-colors text-neutral-900 dark:text-white"
                  />

                  {emailError && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                      {emailError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailGateActive(false)}
                      className="px-2.5 py-1.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEmail || !emailInput.trim()}
                      className="flex-1 py-1.5 px-3 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSubmittingEmail ? "Connecting..." : t.emailSubmit}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4A RESOLVED STATE: Resolution Notice & Follow-up Prompt */}
            {isResolvedMode && (
              <div className="p-3 my-2 rounded-[6px] bg-emerald-500/10 border border-emerald-500/25 text-center space-y-2 animate-fadeIn select-none">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t.resolvedBadge || "Inquiry Resolved"}</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {t.resolvedFollowUpPrompt || "You can continue typing below anytime if you have more questions."}
                </p>
                <button
                  type="button"
                  onClick={handleStartNewConversation}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>{t.clearAndRestart || "Start a new conversation thread"}</span>
                </button>
              </div>
            )}

            {/* Active Typing / Response Waiting Indicator ("...") */}
            {isSending && (
              <div className="flex gap-2.5 items-center animate-fadeIn py-1">
                <SystemBotAvatar />
                <div className="flex gap-1.5 items-center px-4 py-3 rounded-[14px] rounded-tl-[3px] bg-white dark:bg-[#121620] border border-neutral-200/80 dark:border-white/10 shadow-xs">
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "0ms", animationDuration: "0.9s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "180ms", animationDuration: "0.9s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "360ms", animationDuration: "0.9s" }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* -------------------------------------------------------------------
          MESSAGE COMPOSER & SUGGESTION POPUP DOCK
      -------------------------------------------------------------------- */}
      {session && (
        <div className="relative p-3 border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0c0e12] shrink-0">
          {/* STEP 2: LIVE QUESTION SUGGESTIONS POPUP (Appears ONLY while typing) */}
          {isSuggestionsOpen && suggestions.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              role="listbox"
              aria-label="Suggested Questions"
              className="absolute bottom-full left-3 right-3 mb-1.5 p-1.5 rounded-[6px] bg-white dark:bg-[#121620] border border-neutral-200 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.18)] max-h-48 overflow-y-auto space-y-1 z-30 animate-fadeIn"
            >
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 select-none">
                {t.suggestionsLabel}
              </div>
              {suggestions.map((sug, sIdx) => {
                const isActive = sIdx === activeSuggestionIndex;
                const sugKey = `sug_${sug.faqId || 'faq'}_${sIdx}_${sug.question}`;
                return (
                  <button
                    key={sugKey}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(e) => {
                      // Prevent input blur before click registers
                      e.preventDefault();
                      submitQuestion(sug.question);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs transition-colors cursor-pointer leading-snug ${
                      isActive
                        ? "bg-amber-500 text-neutral-950 font-bold"
                        : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {sug.question}
                  </button>
                );
              })}
            </div>
          )}

          {/* Form Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={questionInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 && questionInput.trim().length >= 2) {
                  setIsSuggestionsOpen(true);
                }
              }}
              placeholder={isLiveSupportMode ? "Type message to MCPA admin..." : t.inputPlaceholder}
              disabled={isSending}
              className="flex-1 px-3 py-2 text-xs rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none transition-colors text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />

            <button
              type="submit"
              disabled={isSending || !questionInput.trim()}
              aria-label={t.send}
              className="p-2 rounded-[4px] bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
