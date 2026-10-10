"use client";

import { useState } from "react";
import { ShieldAlert, Send, CheckCircle2, Lock, X } from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

export default function MultiProjectRequestModal({
  isOpen,
  onClose,
  currentUser,
  activeProject,
  showToast,
  onSuccess,
}) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await authFetch("/api/users/me/request-multi-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        showToast("Multi-project approval request submitted to MCPA Administration!");
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error("Multi-project request error:", err);
      showToast("Could not submit request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg p-6 rounded-[8px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white">
                Active Project Concurrency Policy
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                Anti-Spam & Dedicated Oversight Control
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-mono text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-3 font-mono">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-neutral-900 dark:text-white uppercase">
              Request Sent to Administration
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-sm mx-auto">
              Our Senior Managing Director will review your multi-project capability and toggle your account permissions. You will receive an email once approved.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-[4px] bg-amber-500 text-neutral-950 text-xs font-bold uppercase cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-xs font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-2">
              <p>
                By policy, MCPA clients are restricted to <strong className="text-amber-500 font-mono">1 Active Project</strong> at a time to ensure our resident architects and master builders maintain undivided on-site focus.
              </p>
              {activeProject && (
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 border-t border-amber-500/20 pt-2">
                  Active Project: <span className="font-bold text-amber-500">{activeProject.project_title}</span> ({activeProject.project_code}) · Stage: {activeProject.stage_id}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">
                Multi-Project Intent / Target Build Details:
              </label>
              <textarea
                rows={3}
                placeholder="E.g., We are expanding with a secondary commercial warehouse / branch in Pampanga..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[4px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[4px] border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !note.trim()}
                className="px-5 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Unlock Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
