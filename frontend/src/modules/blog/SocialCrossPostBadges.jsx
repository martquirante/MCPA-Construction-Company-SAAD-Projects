"use client";

import { useState } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  XTwitterIcon,
  LinkedInIcon,
  ThreadsIcon,
  PinterestIcon,
} from "@/modules/shared/Icons";
import { ExternalLink, Globe, Plus, Trash2, Link2, Sparkles } from "lucide-react";

/**
 * Auto-detects social media platform from any URL
 */
export function detectSocialPlatform(url) {
  if (!url || typeof url !== "string") {
    return { platform: "web", name: "External Link", defaultLabel: "View Link" };
  }
  const clean = url.trim().toLowerCase();

  if (/facebook\.com|fb\.watch|fb\.me/i.test(clean)) {
    return { platform: "facebook", name: "Facebook", defaultLabel: "View on Facebook" };
  }
  if (/instagram\.com|instagr\.am/i.test(clean)) {
    return { platform: "instagram", name: "Instagram", defaultLabel: "View on Instagram" };
  }
  if (/tiktok\.com/i.test(clean)) {
    return { platform: "tiktok", name: "TikTok", defaultLabel: "Watch on TikTok" };
  }
  if (/youtube\.com|youtu\.be/i.test(clean)) {
    return { platform: "youtube", name: "YouTube", defaultLabel: "Watch on YouTube" };
  }
  if (/twitter\.com|x\.com/i.test(clean)) {
    return { platform: "twitter", name: "X (Twitter)", defaultLabel: "View on X" };
  }
  if (/linkedin\.com/i.test(clean)) {
    return { platform: "linkedin", name: "LinkedIn", defaultLabel: "View on LinkedIn" };
  }
  if (/threads\.net/i.test(clean)) {
    return { platform: "threads", name: "Threads", defaultLabel: "View on Threads" };
  }
  if (/pinterest\.com/i.test(clean)) {
    return { platform: "pinterest", name: "Pinterest", defaultLabel: "View on Pinterest" };
  }

  return { platform: "web", name: "Website", defaultLabel: "Open Link" };
}

/**
 * Returns rendering config (real logo icon, theme colors, default labels)
 */
export function getSocialPlatformConfig(platformOrUrl) {
  const resolved =
    typeof platformOrUrl === "string" && platformOrUrl.startsWith("http")
      ? detectSocialPlatform(platformOrUrl).platform
      : platformOrUrl?.toLowerCase() || "web";

  switch (resolved) {
    case "facebook":
      return {
        id: "facebook",
        name: "Facebook",
        icon: FacebookIcon,
        badgeBg: "bg-[#0866FF]/10 hover:bg-[#0866FF]/20 dark:bg-[#0866FF]/15 dark:hover:bg-[#0866FF]/25",
        borderColor: "border-[#0866FF]/30 hover:border-[#0866FF]",
        textColor: "text-[#0866FF] dark:text-[#458eff]",
        accentGlow: "hover:shadow-[0_0_12px_rgba(8,102,255,0.35)]",
      };
    case "instagram":
      return {
        id: "instagram",
        name: "Instagram",
        icon: InstagramIcon,
        badgeBg: "bg-pink-500/10 hover:bg-pink-500/20 dark:bg-pink-500/15 dark:hover:bg-pink-500/25",
        borderColor: "border-pink-500/30 hover:border-pink-500",
        textColor: "text-pink-600 dark:text-pink-400",
        accentGlow: "hover:shadow-[0_0_12px_rgba(236,72,153,0.35)]",
      };
    case "tiktok":
      return {
        id: "tiktok",
        name: "TikTok",
        icon: TikTokIcon,
        badgeBg: "bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20",
        borderColor: "border-neutral-800/40 dark:border-white/20 hover:border-cyan-400",
        textColor: "text-neutral-900 dark:text-white",
        accentGlow: "hover:shadow-[0_0_12px_rgba(37,244,238,0.35)]",
      };
    case "youtube":
      return {
        id: "youtube",
        name: "YouTube",
        icon: YouTubeIcon,
        badgeBg: "bg-red-600/10 hover:bg-red-600/20 dark:bg-red-600/15 dark:hover:bg-red-600/25",
        borderColor: "border-red-600/30 hover:border-red-600",
        textColor: "text-red-600 dark:text-red-400",
        accentGlow: "hover:shadow-[0_0_12px_rgba(255,0,0,0.35)]",
      };
    case "twitter":
    case "x":
      return {
        id: "twitter",
        name: "X (Twitter)",
        icon: XTwitterIcon,
        badgeBg: "bg-neutral-900/10 hover:bg-neutral-900/20 dark:bg-white/10 dark:hover:bg-white/20",
        borderColor: "border-neutral-900/30 dark:border-white/20 hover:border-neutral-900 dark:hover:border-white",
        textColor: "text-neutral-900 dark:text-white",
        accentGlow: "hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]",
      };
    case "linkedin":
      return {
        id: "linkedin",
        name: "LinkedIn",
        icon: LinkedInIcon,
        badgeBg: "bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 dark:bg-[#0A66C2]/15 dark:hover:bg-[#0A66C2]/25",
        borderColor: "border-[#0A66C2]/30 hover:border-[#0A66C2]",
        textColor: "text-[#0A66C2] dark:text-[#388de0]",
        accentGlow: "hover:shadow-[0_0_12px_rgba(10,102,194,0.35)]",
      };
    case "threads":
      return {
        id: "threads",
        name: "Threads",
        icon: ThreadsIcon,
        badgeBg: "bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20",
        borderColor: "border-neutral-800/40 dark:border-white/20",
        textColor: "text-neutral-900 dark:text-white",
        accentGlow: "hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]",
      };
    case "pinterest":
      return {
        id: "pinterest",
        name: "Pinterest",
        icon: PinterestIcon,
        badgeBg: "bg-[#E60023]/10 hover:bg-[#E60023]/20 dark:bg-[#E60023]/15 dark:hover:bg-[#E60023]/25",
        borderColor: "border-[#E60023]/30 hover:border-[#E60023]",
        textColor: "text-[#E60023] dark:text-[#ff3b56]",
        accentGlow: "hover:shadow-[0_0_12px_rgba(230,0,35,0.35)]",
      };
    default:
      return {
        id: "web",
        name: "Website",
        icon: Globe,
        badgeBg: "bg-amber-500/10 hover:bg-amber-500/20",
        borderColor: "border-amber-500/30 hover:border-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
        accentGlow: "hover:shadow-[0_0_12px_rgba(245,158,11,0.35)]",
      };
  }
}

/**
 * Clickable badges displaying the real logos of platforms where this post is cross-posted.
 */
export function SocialCrossPostBadges({
  links = [],
  className = "",
  compact = false,
  showHeader = true,
}) {
  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Also Posted &amp; Featured On:</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {links.map((item, idx) => {
          const url = typeof item === "string" ? item : item.url;
          if (!url) return null;

          const detected = detectSocialPlatform(url);
          const platformKey = item.platform || detected.platform;
          const conf = getSocialPlatformConfig(platformKey);
          const IconComp = conf.icon;
          const label = item.label || item.title || detected.defaultLabel;

          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`group/badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer text-xs font-semibold shadow-2xs ${conf.badgeBg} ${conf.borderColor} ${conf.textColor} ${conf.accentGlow} ${
                compact ? "text-[11px] py-1 px-2.5" : ""
              }`}
              title={`${label} (${conf.name})`}
            >
              <span className="w-4.5 h-4.5 shrink-0 flex items-center justify-center group-hover/badge:scale-115 transition-transform duration-200">
                <IconComp className="w-4 h-4 object-contain" />
              </span>

              <span className="truncate max-w-[200px] font-medium">
                {compact ? conf.name : label}
              </span>

              <ExternalLink className="w-3 h-3 opacity-60 group-hover/badge:opacity-100 group-hover/badge:translate-x-0.5 transition-all shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Admin Input Manager to attach, auto-detect, and customize social media links for any blog post / update.
 */
export function SocialLinksInputManager({ links = [], onChange }) {
  const [inputUrl, setInputUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("auto");
  const [customLabel, setCustomLabel] = useState("");

  const detected = detectSocialPlatform(inputUrl);
  const activePlatform = selectedPlatform === "auto" ? detected.platform : selectedPlatform;
  const activeConf = getSocialPlatformConfig(activePlatform);
  const ActiveIcon = activeConf.icon;

  const handleAdd = (e) => {
    e?.preventDefault();
    if (!inputUrl.trim()) return;

    let targetUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    const det = detectSocialPlatform(targetUrl);
    const plat = selectedPlatform === "auto" ? det.platform : selectedPlatform;

    const newLink = {
      url: targetUrl,
      platform: plat,
      label: customLabel.trim() || det.defaultLabel,
    };

    const next = [...(Array.isArray(links) ? links : []), newLink];
    onChange?.(next);

    setInputUrl("");
    setCustomLabel("");
    setSelectedPlatform("auto");
  };

  const handleRemove = (idx) => {
    const next = (Array.isArray(links) ? links : []).filter((_, i) => i !== idx);
    onChange?.(next);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Cross-Posted Social Media Links ({links.length})</span>
        </label>
        <span className="text-[10px] font-mono text-neutral-400">
          Facebook &bull; IG &bull; TikTok &bull; YouTube &bull; X
        </span>
      </div>

      <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
        Paste the original link if this update/blog was also published to Facebook, Instagram, TikTok, or YouTube. Real clickable brand logos will automatically appear on the website.
      </p>

      {/* Input Row */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* URL Input */}
          <div className="relative flex-1">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste social URL (e.g. https://www.facebook.com/... or https://tiktok.com/...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <ActiveIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Platform Selector */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="auto">Auto-Detect ({detected.name})</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">X (Twitter)</option>
            <option value="linkedin">LinkedIn</option>
            <option value="threads">Threads</option>
            <option value="pinterest">Pinterest</option>
            <option value="web">Website / Other</option>
          </select>
        </div>

        {/* Optional Custom Label & Add Button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={`Optional Button Label (default: "${detected.defaultLabel}")`}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputUrl.trim()}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      {/* List of Attached Links */}
      {Array.isArray(links) && links.length > 0 && (
        <div className="pt-2 border-t border-neutral-200 dark:border-white/10 space-y-2">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">
            Attached Cross-Posts:
          </span>

          <div className="space-y-1.5">
            {links.map((link, idx) => {
              const url = typeof link === "string" ? link : link.url;
              const plat = link.platform || detectSocialPlatform(url).platform;
              const conf = getSocialPlatformConfig(plat);
              const IconComp = conf.icon;
              const label = link.label || conf.name;

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <IconComp className="w-4 h-4 object-contain" />
                    </span>

                    <div className="min-w-0">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span className="truncate">{label}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${conf.badgeBg} ${conf.borderColor} ${conf.textColor}`}>
                          {conf.name}
                        </span>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-neutral-400 hover:text-amber-500 truncate block max-w-md"
                      >
                        {url}
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialCrossPostBadges;
