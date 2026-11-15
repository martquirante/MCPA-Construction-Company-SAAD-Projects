"use client";

import { useState, useEffect, useRef } from "react";
import { authFetch } from "@/modules/shared/authFetch";
import {
  MessageSquare,
  Send,
  Clock,
  ShieldCheck,
  User,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";

export default function ClientConsultationNotesCard({ projectId, currentUser, showToast }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchNotes = async () => {
    if (!projectId) return;
    try {
      const res = await authFetch(`/api/projects/${projectId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn("[ClientNotes] Fetch error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!projectId) return;
      try {
        const res = await authFetch(`/api/projects/${projectId}/messages`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.warn("[ClientNotes] Fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 6000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [projectId]);

  const handleSendNote = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending || !projectId) return;

    const noteText = inputText.trim();
    setIsSending(true);

    try {
      const res = await authFetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        body: JSON.stringify({ messageText: noteText }),
      });

      if (res.ok) {
        setInputText("");
        await fetchNotes();
        showToast?.("Note posted! Our engineering team will review during office hours.", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast?.(errData.message || "Failed to send note.", "error");
      }
    } catch (err) {
      showToast?.("Connection error while posting note.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-[16px] bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
              Project Consultation Notes &amp; Asynchronous Messaging
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Direct communication channel with Engr. Pau and the MCPA Engineering Team.
          </p>
        </div>

        {/* Office Hours Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-700 dark:text-amber-400 shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Office Hours: Mon–Sat 8:00 AM – 5:00 PM</span>
        </div>
      </div>

      {/* Asynchronous Help Notice for Night Availability */}
      <div className="p-3.5 mx-4 sm:mx-5 mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong>Available mostly at night?</strong> Leave any design requests, floorplan notes, or questions here 24/7. Our engineers review and reply to every message during daytime business hours (8:00 AM – 5:00 PM).
        </p>
      </div>

      {/* Thread Content */}
      <div className="p-4 sm:p-5 space-y-4 max-h-[380px] overflow-y-auto">
        {isLoading && messages.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading consultation notes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              No notes exchanged yet. Feel free to leave a note or question for the engineering team!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isClient = m.sender_role === "client" || m.sender_user_id === currentUser?.userId || m.sender_user_id === currentUser?.user_id;
            const timeStr = m.created_at ? new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div
                key={m.message_id || idx}
                className={`flex flex-col ${isClient ? "items-end" : "items-start"} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 px-1">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isClient ? "You (Client)" : m.sender_name || "MCPA Engineering"}
                  </span>
                  {!isClient && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold uppercase text-[9px]">
                      Staff
                    </span>
                  )}
                  <span>· {timeStr}</span>
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isClient
                      ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-[4px]"
                      : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-white/10 rounded-tl-[4px]"
                  }`}
                >
                  <p className="whitespace-pre-line select-text">{m.message_text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Form */}
      <form onSubmit={handleSendNote} className="p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex items-end gap-2.5">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Leave a note, architectural request, or inquiry for Engr. Pau & MCPA team..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendNote();
            }
          }}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 h-[42px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSending ? "Posting..." : "Post Note"}</span>
        </button>
      </form>
    </div>
  );
}
