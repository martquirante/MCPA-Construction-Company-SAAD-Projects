"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import {
  FormattedPostText,
  PostMediaGallery,
  MediaLightboxModal,
  LinkPreviewCard,
} from "./PublicBlogExperience";
import { SocialCrossPostBadges } from "./SocialCrossPostBadges";
import SharePostModal from "./SharePostModal";
import {
  ChevronRight,
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  Share2,
  Check,
  CheckCircle2,
  Hash,
  Sparkles,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function PublicPostDetail({ slug }) {
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState({ open: false, media: [], initialIndex: 0 });

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    fetch(`${API_BASE}/api/blog/posts/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && data.post) {
          setPost(data.post);
          setRelatedPosts(data.relatedPosts || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleLike = async () => {
    if (!post || liked) return;
    setLiked(true);
    setPost((prev) => ({ ...prev, likes_count: (prev.likes_count || 0) + 1 }));
    try {
      await fetch(`${API_BASE}/api/blog/posts/${post.post_id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      });
    } catch (_) {}
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100">
      <ClientNavbar isCompleted={true} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-amber-500 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-amber-500 transition-colors">
            Updates &amp; Blog
          </Link>
          {post?.category_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/category/${post.category_slug}`}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                {post.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-xs">
            {post?.title || "Post Details"}
          </span>
        </nav>

        {loading ? (
          <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-8 space-y-5 animate-pulse">
            <div className="h-8 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-96 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          </div>
        ) : !post ? (
          <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-12 text-center">
            <h1 className="text-2xl font-bold">Post Not Found</h1>
            <p className="text-sm text-neutral-500 mt-2">
              This construction update or article may have been moved or archived.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Updates &amp; Blog</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <article className="rounded-3xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden p-6 sm:p-10 space-y-6">
              {/* Author & Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-neutral-900 border-2 border-amber-500/60 p-1 flex items-center justify-center shrink-0 shadow-sm">
                    <img
                      src="/icon.png"
                      alt="MCPA Construction and Supply"
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/mcpa-logo.svg";
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-neutral-950 dark:text-white">
                        MCPA Construction and Supply
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>Official Company Update</span>
                      <span>·</span>
                      <span>
                        {new Date(post.published_at || post.created_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.category_name && (
                    <Link
                      href={`/category/${post.category_slug}`}
                      className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold"
                    >
                      {post.category_name}
                    </Link>
                  )}
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Posts</span>
                  </Link>
                </div>
              </div>

              {/* Headline */}
              {post.title && (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 dark:text-white leading-tight">
                  {post.title}
                </h1>
              )}

              {/* Full Caption & Rich Text Body */}
              <FormattedPostText
                text={post.caption}
                htmlContent={post.content}
                expanded={true}
                onHashtagClick={(tag) => router.push(`/hashtag/${tag}`)}
              />

              {/* Link Preview */}
              {post.link_preview && <LinkPreviewCard preview={post.link_preview} />}

              {/* Complete Media Gallery */}
              {post.media && post.media.length > 0 && (
                <div className="pt-2">
                  <PostMediaGallery
                    media={post.media}
                    onOpenLightbox={(media, initialIndex) =>
                      setLightboxState({ open: true, media, initialIndex })
                    }
                  />
                </div>
              )}

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="pt-4 flex items-center flex-wrap gap-2">
                  {post.hashtags.map((h) => (
                    <Link
                      key={h.hashtag_id || h.tag}
                      href={`/hashtag/${h.tag}`}
                      className="px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-neutral-950 text-xs font-bold transition-colors"
                    >
                      {h.display_tag || `#${h.tag}`}
                    </Link>
                  ))}
                </div>
              )}

              {/* Official Social Media Cross-Posts */}
              {(post.social_links?.length > 0 || post.metadata?.social_links?.length > 0) && (
                <div className="pt-4">
                  <SocialCrossPostBadges links={post.social_links || post.metadata?.social_links} />
                </div>
              )}

              {/* Social Share & Engagement Footer */}
              <div className="pt-6 border-t border-neutral-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      liked
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
                        : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:border-rose-500/40"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current text-rose-500" : ""}`} />
                    <span>{post.likes_count || 0} Likes</span>
                  </button>

                  <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                    <Eye className="w-4 h-4" />
                    <span>{post.view_count || 0} Views</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Post</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-extrabold text-neutral-950 dark:text-white">
                  Related Construction Updates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.post_id}
                      href={`/blog/${rp.slug}`}
                      className="group rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 overflow-hidden p-4 space-y-2 hover:border-amber-500/50 transition-all"
                    >
                      {rp.featured_image && (
                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-neutral-900">
                          <img
                            src={rp.featured_image}
                            alt={rp.title || "Related update"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        {rp.category_name || "Project Update"}
                      </div>
                      <h4 className="font-bold text-sm text-neutral-950 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                        {rp.title || rp.caption?.substring(0, 65)}
                      </h4>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <MediaLightboxModal
        lightboxState={lightboxState}
        onClose={() => setLightboxState({ open: false, media: [], initialIndex: 0 })}
      />

      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
      />

      <Footer />
    </div>
  );
}
