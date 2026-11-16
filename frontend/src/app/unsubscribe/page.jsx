"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, ArrowLeft, MailX } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          email: !token ? emailInput.trim() : undefined,
          reason: "Direct Unsubscribe Page Request",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "You have been successfully removed from MCPA marketing emails.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to process unsubscribe request.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3">
            <MailX className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Email Preferences & Unsubscribe</h1>
          <p className="text-xs text-neutral-400 mt-1">MCPA Construction & Supply Marketing Dispatch</p>
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed text-center">
              {token
                ? "Are you sure you want to stop receiving project milestone updates, cost forecasts, and architectural briefings?"
                : "Enter your email address below to unsubscribe from all future promotional communications."}
            </p>

            {!token && (
              <input
                type="email"
                placeholder="Enter your email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            )}

            <button
              onClick={handleUnsubscribe}
              disabled={loading || (!token && !emailInput)}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Unsubscribe from Marketing Emails"
              )}
            </button>

            <p className="text-[11px] text-neutral-500 text-center leading-normal">
              Notice: You will still receive transactional emails regarding active building contracts, client portal passwords, or scheduled site meetings.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Unsubscribed Successfully</h2>
            <p className="text-sm text-neutral-300 leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to MCPA Construction Home
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Something Went Wrong</h2>
            <p className="text-sm text-red-400">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
