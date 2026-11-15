"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import { useCms } from "@/modules/cms/CmsContext";
import { SocialCrossPostBadges } from "./SocialCrossPostBadges";
import {
  Search,
  LayoutGrid,
  List,
  Newspaper,
  BookOpen,
  Calendar,
  Eye,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  Hash,
  Folder,
  Check,
  Copy,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function formatPublishDate(dateStr) {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats plain caption text to highlight clickable #Hashtags and URLs,
 * or renders rich HTML safely when HTML tags are present.
 */
export function FormattedPostText({ text, htmlContent, onHashtagClick, expanded = false, onToggleExpand }) {
  const raw = text || "";
  const isLong = raw.length > 280 && !expanded;
  const displayCaption = isLong ? `${raw.substring(0, 280)}...` : raw;

  // Tokenize URLs and #Hashtags in plain text
  const renderInteractiveCaption = (str) => {
    const parts = str.split(/(https?:\/\/[^\s<]+|#[a-zA-Z0-9_]{2,50})/g);
    return parts.map((part, idx) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium break-all inline-flex items-center gap-0.5"
          >
            {part}
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </a>
        );
      }
      if (/^#[a-zA-Z0-9_]{2,50}$/.test(part)) {
        const cleanTag = part.replace(/^#/, "").toLowerCase();
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onHashtagClick) onHashtagClick(cleanTag);
            }}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold hover:underline cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-2.5 text-sm sm:text-[15px] text-neutral-800 dark:text-neutral-200 leading-relaxed">
      {raw && (
        <p className="whitespace-pre-line break-words">
          {renderInteractiveCaption(displayCaption)}
          {isLong && onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="ml-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Read More
            </button>
          )}
        </p>
      )}
      {expanded && htmlContent && htmlContent.trim() && htmlContent !== raw && (
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none pt-2 border-t border-neutral-200/70 dark:border-white/10 prose-headings:font-bold prose-a:text-amber-500 prose-blockquote:border-amber-500"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
}

/**
 * Embedded Responsive Video Player (Muted by default, Play/Pause, Volume, Fullscreen)
 */
export function PostVideoPlayer({ url, thumbnail, caption }) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-white/10 group">
      <video
        src={url}
        poster={thumbnail || "/assets/hero-residence-day-wide-v2.jpg"}
        controls
        muted={isMuted}
        playsInline
        preload="metadata"
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        className="w-full max-h-[540px] object-contain bg-black mx-auto"
      >
        Your browser does not support HTML5 video.
      </video>
      {caption && (
        <div className="px-3.5 py-2 bg-neutral-900/90 text-neutral-300 text-xs flex items-center justify-between border-t border-white/10">
          <span className="truncate">{caption}</span>
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold shrink-0 ml-2">
            HD Video
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Multi-Image & Video Social Gallery (Supports Grid Collage + Carousel mode + Click-to-Expand Lightbox)
 */
export function PostMediaGallery({ media = [], onOpenLightbox }) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [viewMode, setViewMode] = useState("collage"); // "collage" | "all" | "carousel"

  if (!Array.isArray(media) || media.length === 0) return null;

  const total = media.length;
  const imgCount = media.filter((m) => m.media_type !== "video").length;
  const vidCount = media.filter((m) => m.media_type === "video").length;

  // Single Media Item
  if (total === 1) {
    const item = media[0];
    if (item.media_type === "video") {
      return <PostVideoPlayer url={item.url} thumbnail={item.thumbnail_url} caption={item.caption} />;
    }
    return (
      <div
        onClick={() => onOpenLightbox && onOpenLightbox(media, 0)}
        className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 cursor-zoom-in group"
      >
        <img
          src={item.url}
          alt={item.alt_text || item.caption || "MCPA Post Image"}
          loading="lazy"
          className="w-full max-h-[560px] object-cover transition-transform duration-500 group-hover:scale-[1.015]"
        />
        {item.caption && (
          <div className="px-3.5 py-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-xs text-neutral-700 dark:text-neutral-300 border-t border-neutral-200/60 dark:border-white/10">
            {item.caption}
          </div>
        )}
      </div>
    );
  }

  const visibleItems = viewMode === "all" ? media : media.slice(0, 4);

  return (
    <div className="space-y-2">
      {/* Toggle between Collage Grid, Full Grid, and Instagram-Style Carousel */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-0.5">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {total} Media ({imgCount} Photo{imgCount !== 1 ? "s" : ""}
            {vidCount > 0 ? ` • ${vidCount} Video${vidCount !== 1 ? "s" : ""}` : ""})
          </span>
        </span>
        <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-0.5 rounded-lg border border-neutral-200 dark:border-white/10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("collage");
            }}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              viewMode === "collage"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Preview
          </button>
          {total > 4 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("all");
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === "all"
                  ? "bg-amber-500 text-neutral-950"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              All ({total})
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("carousel");
            }}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              viewMode === "carousel"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Carousel
          </button>
        </div>
      </div>

      {viewMode === "carousel" ? (
        <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-white/10">
          <div className="relative aspect-[16/10] w-full flex items-center justify-center bg-black">
            {media[carouselIndex]?.media_type === "video" ? (
              <PostVideoPlayer
                url={media[carouselIndex].url}
                thumbnail={media[carouselIndex].thumbnail_url}
                caption={media[carouselIndex].caption}
              />
            ) : (
              <img
                src={media[carouselIndex]?.url}
                alt={media[carouselIndex]?.alt_text || "Gallery slide"}
                onClick={() => onOpenLightbox && onOpenLightbox(media, carouselIndex)}
                className="w-full h-full object-contain cursor-zoom-in"
              />
            )}

            {/* Counter Pill */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-mono backdrop-blur-md">
              {carouselIndex + 1} / {total}
            </div>

            {/* Prev / Next Controls */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCarouselIndex((prev) => (prev - 1 + total) % total);
              }}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-amber-500 text-white hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCarouselIndex((prev) => (prev + 1) % total);
              }}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-amber-500 text-white hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 py-2.5 bg-neutral-900 overflow-x-auto px-4">
            {media.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  idx === carouselIndex ? "w-6 bg-amber-500" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Responsive Collage or Full Grid */
        <div
          className={`grid gap-2 rounded-xl overflow-hidden ${
            total === 2
              ? "grid-cols-2"
              : total === 3
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          }`}
        >
          {visibleItems.map((item, idx) => {
            const extraCount = total - 4;
            const isLastVisible = viewMode === "collage" && idx === 3 && extraCount > 0;

            return (
              <div
                key={item.media_id || idx}
                onClick={() => onOpenLightbox && onOpenLightbox(media, idx)}
                className={`relative group overflow-hidden rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-900 cursor-pointer ${
                  total === 2 ? "aspect-[4/3]" : "aspect-square"
                }`}
              >
                {item.media_type === "video" ? (
                  <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center">
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/45 transition-colors">
                      <div className="w-11 h-11 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt_text || item.caption || `Gallery item ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {isLastVisible && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">+{extraCount}</span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold mt-0.5">
                      View All {total}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Full-Screen Lightbox Modal for Multi-Image & Video Inspection
 */
export function MediaLightboxModal({ lightboxState, onClose }) {
  const { open, media = [], initialIndex = 0 } = lightboxState || {};
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [prevInit, setPrevInit] = useState(initialIndex);

  if (initialIndex !== prevInit) {
    setPrevInit(initialIndex);
    setCurrentIndex(initialIndex || 0);
  }

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentIndex((i) => (i + 1) % media.length);
      if (e.key === "ArrowLeft") setCurrentIndex((i) => (i - 1 + media.length) % media.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, media.length, onClose]);

  if (!open || !media.length) return null;

  const currentItem = media[currentIndex] || media[0];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-white max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-white/10 text-amber-400 font-mono text-xs font-semibold">
            {currentIndex + 1} / {media.length}
          </span>
          {currentItem.caption && (
            <span className="text-xs sm:text-sm text-neutral-300 truncate max-w-md sm:max-w-xl">
              {currentItem.caption}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-amber-500 text-white hover:text-neutral-950 transition-colors cursor-pointer"
          aria-label="Close Lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center my-4 max-w-6xl w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {media.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => (i - 1 + media.length) % media.length)}
            className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-amber-500 text-white hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="w-full flex-1 max-h-[82vh] flex items-center justify-center px-2 sm:px-10">
          {currentItem.media_type === "video" ? (
            <div className="w-full max-w-5xl h-[60vh] sm:h-[75vh] flex items-center justify-center bg-black/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
              <video
                src={currentItem.url}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            </div>
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.alt_text || currentItem.caption || "Expanded view"}
              className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          )}
        </div>

        {media.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => (i + 1) % media.length)}
            className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-amber-500 text-white hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {media.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 overflow-x-auto py-2 max-w-4xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {media.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? "border-amber-500 scale-105"
                  : "border-transparent opacity-50 hover:opacity-85"
              }`}
            >
              {m.media_type === "video" ? (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-amber-400">
                  <Film className="w-5 h-5" />
                </div>
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Link Preview Card (Facebook / LinkedIn style rich URL card)
 */
export function LinkPreviewCard({ preview }) {
  if (!preview || !preview.url) return null;
  const parsedPreview = typeof preview === "string" ? (() => { try { return JSON.parse(preview); } catch (_) { return null; } })() : preview;
  if (!parsedPreview || !parsedPreview.url) return null;

  return (
    <a
      href={parsedPreview.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] hover:border-amber-500/50 transition-all group"
    >
      <div className="flex flex-col sm:flex-row">
        {parsedPreview.image && (
          <div className="sm:w-44 h-36 sm:h-auto shrink-0 overflow-hidden bg-neutral-900">
            <img
              src={parsedPreview.image}
              alt={parsedPreview.title || "Link preview"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-3.5 flex flex-col justify-center min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {parsedPreview.siteName || "External Link"}
          </span>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white mt-1 line-clamp-1 group-hover:text-amber-500 transition-colors">
            {parsedPreview.title || parsedPreview.url}
          </h4>
          {parsedPreview.description && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
              {parsedPreview.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

/**
 * Main Public Blog & Updates Experience Component
 */
export default function PublicBlogExperience({
  initialCategory = "all",
  initialHashtag = "",
  initialLayout = "feed",
}) {
  const router = useRouter();
  const { theme } = useCms();

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [layout, setLayout] = useState(initialLayout || theme?.defaultBlogLayout || "feed"); // "feed" | "grid" | "table" | "article"
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [selectedHashtag, setSelectedHashtag] = useState(initialHashtag || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPostIds, setExpandedPostIds] = useState({});
  const [likedPostIds, setLikedPostIds] = useState({});
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [lightboxState, setLightboxState] = useState({ open: false, media: [], initialIndex: 0 });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const q = new URLSearchParams();
        if (selectedCategory && selectedCategory !== "all") q.set("category", selectedCategory);
        if (selectedHashtag) q.set("hashtag", selectedHashtag);
        if (searchQuery.trim()) q.set("search", searchQuery.trim());
        q.set("limit", "50");

        const [postsRes, catsRes, tagsRes] = await Promise.all([
          fetch(`${API_BASE}/api/blog/posts?${q.toString()}`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/blog/categories`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/blog/hashtags`, { cache: "no-store" }),
        ]);

        if (!active) return;

        if (postsRes.ok) {
          const pData = await postsRes.json();
          if (active) {
            setPosts(pData.posts || []);
            if (pData.defaultLayout && typeof window !== "undefined" && !localStorage.getItem("mcpa-user-layout-override")) {
              setLayout(pData.defaultLayout);
            }
          }
        }
        if (catsRes.ok && active) {
          const cData = await catsRes.json();
          setCategories(cData.categories || []);
        }
        if (tagsRes.ok && active) {
          const tData = await tagsRes.json();
          setHashtags(tData.hashtags || []);
        }
      } catch (err) {
        console.warn("[PublicBlogExperience] Fetch error:", err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    const handleSync = () => {
      if (active) loadData();
    };
    window.addEventListener("mcpa-cms-sync", handleSync);
    return () => {
      active = false;
      window.removeEventListener("mcpa-cms-sync", handleSync);
    };
  }, [selectedCategory, selectedHashtag, searchQuery]);

  const handleLike = async (postId) => {
    if (likedPostIds[postId]) return;
    setLikedPostIds((prev) => ({ ...prev, [postId]: true }));
    setPosts((prev) =>
      prev.map((p) => (p.post_id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p))
    );
    try {
      await fetch(`${API_BASE}/api/blog/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      });
    } catch (_) {}
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/blog/${post.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || "MCPA Construction Update",
          text: post.caption?.substring(0, 140),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedSlug(post.slug);
        setTimeout(() => setCopiedSlug(null), 2500);
      }
      await fetch(`${API_BASE}/api/blog/posts/${post.post_id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "share" }),
      });
    } catch (_) {}
  };

  const openLightbox = (media, initialIndex = 0) => {
    setLightboxState({ open: true, media, initialIndex });
  };

  const handleSelectLayout = (newLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem("mcpa-user-layout-override", newLayout);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <ClientNavbar isCompleted={true} />

      {/* HERO BANNER */}
      <section className="relative pt-28 pb-10 sm:pt-32 sm:pb-12 border-b border-neutral-200 dark:border-white/10 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                Project Updates &amp; Insights
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
                Follow live structural milestones, site engineering inspections, turnkey handovers, and official corporate announcements from MCPA Construction and Supply.
              </p>
            </div>
          </div>

          {/* Search, Category Filter & Trending Hashtags Bar */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedHashtag("");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === "all" && !selectedHashtag
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:border-amber-500/40"
                }`}
              >
                All Updates
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setSelectedHashtag("");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.slug
                      ? "bg-amber-500 text-neutral-950 shadow-xs"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:border-amber-500/40"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.post_count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                      {cat.post_count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, projects, tags..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs sm:text-sm focus:border-amber-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Hashtag Filter pill (only if a hashtag inside post content was clicked) */}
          {selectedHashtag && (
            <div className="mt-4 flex items-center gap-2 py-1">
              <span className="text-xs text-neutral-500 font-mono">Filtered by tag:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs">
                #{selectedHashtag}
                <button
                  type="button"
                  onClick={() => setSelectedHashtag("")}
                  className="hover:opacity-75 cursor-pointer ml-1 text-sm font-bold leading-none"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-2.5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 max-w-xl mx-auto shadow-xs">
            <Newspaper className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {searchQuery || selectedCategory !== "all" || selectedHashtag
                ? "No matching updates found"
                : "No Published Updates Yet"}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "all" || selectedHashtag
                ? "Try clearing your active search or hashtag filter to view all published MCPA construction updates."
                : "Official company announcements, site progress milestones, and project updates will appear here once published by MCPA Construction and Supply."}
            </p>
            {(searchQuery || selectedCategory !== "all" || selectedHashtag) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedHashtag("");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ===============================================================
                LAYOUT C: SOCIAL FEED VIEW (Facebook / Instagram Inspired)
               =============================================================== */}
            {layout === "feed" && (
              <div className="max-w-3xl mx-auto space-y-6">
                {posts.map((post) => {
                  const isExpanded = !!expandedPostIds[post.post_id];
                  return (
                    <article
                      key={post.post_id}
                      className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-all"
                    >
                      {/* Post Author Header */}
                      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-neutral-950 dark:bg-amber-500 text-amber-400 dark:text-neutral-950 font-extrabold text-sm flex items-center justify-center shrink-0 border-2 border-amber-500/40 shadow-xs">
                            MCPA
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="font-bold text-sm sm:text-base text-neutral-950 dark:text-white hover:text-amber-500 transition-colors"
                              >
                                MCPA Construction and Supply
                              </Link>
                              <CheckCircle2 className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" title="Verified Official MCPA Account" />
                              {post.category_name && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                                  {post.category_name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              <span>Official Company Update</span>
                              <span>·</span>
                              <time dateTime={post.published_at}>{formatPublishDate(post.published_at)}</time>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                        >
                          Details →
                        </Link>
                      </div>

                      {/* Post Headline & Formatted Caption */}
                      <div className="px-4 sm:px-5 pb-3.5 space-y-2">
                        {post.title && (
                          <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-base sm:text-lg font-extrabold text-neutral-950 dark:text-white hover:text-amber-500 transition-colors leading-snug">
                              {post.title}
                            </h2>
                          </Link>
                        )}
                        <FormattedPostText
                          text={post.caption}
                          htmlContent={post.content}
                          expanded={isExpanded}
                          onToggleExpand={() =>
                            setExpandedPostIds((prev) => ({ ...prev, [post.post_id]: !prev[post.post_id] }))
                          }
                          onHashtagClick={(tag) => setSelectedHashtag(tag)}
                        />
                      </div>

                      {/* Link Preview if attached */}
                      {post.link_preview && (
                        <div className="px-4 sm:px-5 pb-3.5">
                          <LinkPreviewCard preview={post.link_preview} />
                        </div>
                      )}

                      {/* Attached Multi-Image / Video Gallery */}
                      {post.media && post.media.length > 0 && (
                        <div className="px-4 sm:px-5 pb-4">
                          <PostMediaGallery media={post.media} onOpenLightbox={openLightbox} />
                        </div>
                      )}

                      {/* Hashtag Pills */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="px-4 sm:px-5 pb-3 flex items-center flex-wrap gap-1.5">
                          {post.hashtags.map((h) => (
                            <button
                              key={h.hashtag_id || h.tag}
                              type="button"
                              onClick={() => setSelectedHashtag(h.tag)}
                              className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-medium transition-colors cursor-pointer"
                            >
                              {h.display_tag || `#${h.tag}`}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Social Cross-Post Badges */}
                      {(post.social_links?.length > 0 || post.metadata?.social_links?.length > 0) && (
                        <div className="px-4 sm:px-5 pb-3">
                          <SocialCrossPostBadges links={post.social_links || post.metadata?.social_links} />
                        </div>
                      )}

                      {/* Social Action Bar */}
                      <div className="px-4 sm:px-5 py-3 bg-neutral-50/70 dark:bg-white/[0.02] border-t border-neutral-200/70 dark:border-white/10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleLike(post.post_id)}
                            className={`inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                              likedPostIds[post.post_id]
                                ? "text-rose-500"
                                : "hover:text-rose-500"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${likedPostIds[post.post_id] ? "fill-current" : ""}`} />
                            <span>{post.likes_count || 0} Likes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShare(post)}
                            className="inline-flex items-center gap-1.5 font-semibold hover:text-amber-500 transition-colors cursor-pointer"
                          >
                            {copiedSlug === post.slug ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-500">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </>
                            )}
                          </button>

                          <span className="inline-flex items-center gap-1 text-neutral-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{post.view_count || 0}</span>
                          </span>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1 font-bold text-neutral-900 dark:text-white hover:text-amber-500 transition-colors"
                        >
                          <span>Read Full Article</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ===============================================================
                LAYOUT A: GRID VIEW (Instagram / Pinterest Inspired)
               =============================================================== */}
            {layout === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {posts.map((post) => {
                  const primaryMedia = post.media?.[0];
                  const coverUrl =
                    post.featured_image ||
                    primaryMedia?.url ||
                    "/assets/hero-residence-day-wide-v2.jpg";
                  const isVideo = primaryMedia?.media_type === "video";
                  const mediaCount = post.media?.length || 0;

                  return (
                    <div
                      key={post.post_id}
                      className="group rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-500/40 transition-all flex flex-col"
                    >
                      {/* Square / 4:3 Media Preview */}
                      <div
                        onClick={() =>
                          mediaCount > 0
                            ? openLightbox(post.media, 0)
                            : router.push(`/blog/${post.slug}`)
                        }
                        className="relative aspect-square w-full bg-neutral-900 overflow-hidden cursor-pointer"
                      >
                        {isVideo ? (
                          <video
                            src={primaryMedia.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img
                            src={coverUrl}
                            alt={post.title || "MCPA Post"}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          {post.category_name ? (
                            <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                              {post.category_name}
                            </span>
                          ) : <span />}
                          {mediaCount > 1 && (
                            <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-amber-400" />
                              {mediaCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                            <span>{formatPublishDate(post.published_at)}</span>
                            <span>{post.likes_count || 0} ♥</span>
                          </div>
                          {post.title && (
                            <Link href={`/blog/${post.slug}`}>
                              <h3 className="font-bold text-sm text-neutral-950 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                            </Link>
                          )}
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
                            {post.caption}
                          </p>
                        </div>

                        {/* Social Cross-Posts in Grid */}
                        {(post.social_links?.length > 0 || post.metadata?.social_links?.length > 0) && (
                          <div className="pt-1">
                            <SocialCrossPostBadges
                              links={post.social_links || post.metadata?.social_links}
                              compact={true}
                              showHeader={false}
                            />
                          </div>
                        )}

                        <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {post.hashtags?.slice(0, 2).map((h) => (
                              <button
                                key={h.hashtag_id || h.tag}
                                type="button"
                                onClick={() => setSelectedHashtag(h.tag)}
                                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline truncate cursor-pointer"
                              >
                                {h.display_tag}
                              </button>
                            ))}
                          </div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-bold text-neutral-900 dark:text-white hover:text-amber-500 shrink-0"
                          >
                            Open →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===============================================================
                LAYOUT B: TABLE VIEW (Structured Construction Progress Ledger)
               =============================================================== */}
            {layout === "table" && (
              <div className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Project / Update Title</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Media</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/70 dark:divide-white/10 text-xs sm:text-sm">
                      {posts.map((post) => (
                        <tr
                          key={post.post_id}
                          className="hover:bg-amber-500/[0.04] transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-neutral-500">
                            {formatPublishDate(post.published_at)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-950 dark:text-white max-w-xs">
                            <Link href={`/blog/${post.slug}`} className="hover:text-amber-500 transition-colors line-clamp-2">
                              {post.title || post.caption?.substring(0, 60)}
                            </Link>
                            <div className="text-[11px] font-normal text-neutral-500 mt-0.5">
                              By MCPA Construction and Supply
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                              {post.category_name || "General Update"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 max-w-md">
                            <p className="line-clamp-2 text-xs">{post.caption}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Verified Live
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {post.media && post.media.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => openLightbox(post.media, 0)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 text-xs font-medium cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                                <span>{post.media.length} File(s)</span>
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-400">Text Only</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===============================================================
                LAYOUT D: ARTICLE VIEW (Editorial Magazine Presentation)
               =============================================================== */}
            {layout === "article" && (
              <div className="max-w-4xl mx-auto space-y-10">
                {posts.map((post) => {
                  const coverImage =
                    post.featured_image ||
                    post.media?.find((m) => m.media_type === "image")?.url ||
                    "/assets/hero-residence-day-wide-v2.jpg";

                  return (
                    <article
                      key={post.post_id}
                      className="rounded-3xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12"
                    >
                      <div className="md:col-span-5 relative min-h-[240px] bg-neutral-900 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={post.title || "Article Cover"}
                          className="w-full h-full object-cover"
                        />
                        {post.category_name && (
                          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold uppercase tracking-wider">
                            {post.category_name}
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                            <span>{formatPublishDate(post.published_at)}</span>
                            <span>·</span>
                            <span>MCPA Construction and Supply</span>
                          </div>

                          <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white hover:text-amber-500 transition-colors">
                              {post.title || post.caption?.substring(0, 80)}
                            </h2>
                          </Link>

                          <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                            {post.caption}
                          </p>

                          {/* Social Cross-Posts in Article Card */}
                          {(post.social_links?.length > 0 || post.metadata?.social_links?.length > 0) && (
                            <div className="pt-2">
                              <SocialCrossPostBadges links={post.social_links || post.metadata?.social_links} />
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-neutral-200/70 dark:border-white/10 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {post.hashtags?.slice(0, 3).map((h) => (
                              <button
                                key={h.hashtag_id || h.tag}
                                type="button"
                                onClick={() => setSelectedHashtag(h.tag)}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                              >
                                {h.display_tag}
                              </button>
                            ))}
                          </div>

                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 font-bold text-xs hover:opacity-90 transition-opacity shrink-0"
                          >
                            <span>Read Full Article</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* FULL-SCREEN LIGHTBOX */}
      <MediaLightboxModal
        lightboxState={lightboxState}
        onClose={() => setLightboxState({ open: false, media: [], initialIndex: 0 })}
      />

      <Footer />
    </div>
  );
}
