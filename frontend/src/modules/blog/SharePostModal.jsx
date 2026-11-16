"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Mail,
  Send,
  MessageCircle,
} from "lucide-react";
import {
  FacebookIcon,
  MessengerIcon,
  XTwitterIcon,
  LinkedInIcon,
} from "@/modules/shared/Icons";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Custom SVG Icons for WhatsApp, Telegram, Viber
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.919z" />
    </svg>
  );
}

function ViberIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.8 2.5C13.5.8 7.3 1.8 3.5 5.2 1.3 7.2.2 9.9.1 12.8c-.1 3.5 1.6 6.8 4.6 8.5v2.8c0 .4.4.7.8.6l3.3-1.5c1.1.2 2.1.3 3.2.3 5.3 0 10.3-3.2 11.7-8.1 1.6-5.4-1.2-11.2-4.9-12.9zm-2.4 12.3c-.3.8-1.5 1.5-2.2 1.5-.5 0-1.1-.2-1.7-.5-2.4-1.2-4.1-3-5.2-5.4-.3-.6-.5-1.2-.5-1.7 0-.7.7-1.9 1.5-2.2.3-.1.6 0 .8.3l1.2 2c.2.3.1.6 0 .8l-.5.7c-.1.2-.1.4 0 .6.6 1.2 1.5 2.1 2.7 2.7.2.1.4.1.6 0l.7-.5c.2-.1.5-.2.8 0l2 1.2c.3.2.4.5.3.8z" />
    </svg>
  );
}

export default function SharePostModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Keyboard accessibility (ESC to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://mcpaconstruction.com";
  const shareUrl = `${origin}/blog/${post.slug || ""}`;
  const shareTitle = post.title || "MCPA Construction and Supply Update";
  const shareExcerpt = post.caption ? post.caption.replace(/<[^>]+>/g, "").slice(0, 160) : "Check out this update from MCPA Construction & Supply!";

  const recordShareMetric = async () => {
    if (!post?.post_id) return;
    try {
      await fetch(`${API_BASE}/api/blog/posts/${post.post_id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "share" }),
      });
    } catch (_) {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      recordShareMetric();
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareExcerpt,
        url: shareUrl,
      });
      recordShareMetric();
      onClose();
    } catch (_) {}
  };

  const shareChannels = [
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white border-[#1877F2]/30",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Messenger",
      icon: MessengerIcon,
      color: "bg-[#0084FF]/10 text-[#0084FF] hover:bg-[#0084FF] hover:text-white border-[#0084FF]/30",
      url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=1398929332394441&redirect_uri=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-[#25D366]/30",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`,
    },
    {
      name: "X (Twitter)",
      icon: XTwitterIcon,
      color: "bg-neutral-900/10 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-neutral-950 dark:hover:bg-white dark:hover:text-neutral-950 border-neutral-300 dark:border-white/20",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      color: "bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white border-[#0A66C2]/30",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: TelegramIcon,
      color: "bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9] hover:text-white border-[#229ED9]/30",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: "Viber",
      icon: ViberIcon,
      color: "bg-[#7360F2]/10 text-[#7360F2] hover:bg-[#7360F2] hover:text-white border-[#7360F2]/30",
      url: `viber://forward?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-neutral-950 border-amber-500/30",
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareExcerpt}\n\nRead more at:\n${shareUrl}`)}`,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Share2 className="w-4 h-4" />
              </span>
              <h2 id="share-modal-title" className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
                Share Construction Update
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 pl-8">
              {shareTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Quick Preview Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-amber-500/40 p-1 flex items-center justify-center shrink-0">
            <img
              src="/icon.png"
              alt="MCPA Logo"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/mcpa-logo.svg";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-neutral-950 dark:text-white truncate">
              {shareTitle}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              MCPA Construction and Supply · Official Update
            </div>
          </div>
        </div>

        {/* Share Destination Buttons Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Share to Platform
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {shareChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    recordShareMetric();
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 text-center group cursor-pointer ${channel.color}`}
                  title={`Share on ${channel.name}`}
                >
                  <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-semibold mt-1.5 truncate max-w-full">
                    {channel.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Device Native Share (If supported) */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-500" />
            <span>More Apps / Share Sheet...</span>
          </button>
        )}

        {/* Quick Permalink Copy Bar */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-200/80 dark:border-white/10">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Or Copy Direct Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate select-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm shadow-amber-500/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
