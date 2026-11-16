const path = require("path");
const db = require("../services/dbFailoverEngine");
const storage = require("../services/storageService");
const realtimeService = require("../services/realtimeService");
const companyKnowledgeService = require("../services/companyKnowledgeService");

const DEFAULT_THEME = {
  primaryColor: "#f59e0b",
  secondaryColor: "#5b6770",
  accentColor: "#d97706",
  surfaceLight: "#f8f7f5",
  surfaceDark: "#080a0e",
  textLight: "#121212",
  textDark: "#f3f3f3",
  cardLight: "#ffffff",
  cardDark: "#11141c",
  borderLight: "#e5e7eb",
  borderDark: "#1f2937",
  headingFont: "Plus Jakarta Sans",
  bodyFont: "Plus Jakarta Sans",
  baseFontSize: "16px",
  headingWeight: "700",
  lineHeight: "1.6",
  borderRadius: "8px",
  defaultThemeMode: "system",
  defaultBlogLayout: "feed",
  navStyle: "glass",
  footerStyle: "architectural-dark",
  presetName: "MCPA Signature Amber",
};

function slugify(text) {
  return String(text || "post")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 180);
}

function extractHashtagsFromText(text) {
  if (!text) return [];
  const regex = /#([a-zA-Z0-9_]{2,50})/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches));
}

async function logAdminActivity(adminId, action, entityType, entityId, details = {}, ipAddress = "") {
  try {
    await db.query(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId || null, action, entityType, String(entityId || ""), JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    console.warn("[CmsController] Activity log warning:", err.message);
  }
}

class CmsController {
  // ===========================================================================
  // 1. BLOG POSTS & SOCIAL FEED API
  // ===========================================================================
  async getPosts(req, res) {
    try {
      const {
        status,
        category,
        hashtag,
        postType,
        search,
        includeAll,
        page = 1,
        limit = 20,
      } = req.query;

      const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);
      const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      // Auto-publish any scheduled posts whose scheduled_for time has passed
      try {
        await db.query(`
          UPDATE blog_posts
          SET status = 'published', published_at = COALESCE(scheduled_for, NOW()), updated_at = NOW()
          WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= NOW()
        `);
      } catch (_) {}

      const conditions = [];
      const params = [];

      const isAdminView =
        includeAll === "true" &&
        req.user &&
        ["admin", "super_admin", "content_manager", "editor", "architect", "engineer"].includes(
          (req.user.role || "").toLowerCase()
        );

      if (!isAdminView) {
        conditions.push(`p.status = 'published'`);
      } else if (status && status !== "all") {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
      }

      if (category && category !== "all") {
        params.push(category);
        conditions.push(`(c.slug = $${params.length} OR CAST(p.category_id AS TEXT) = $${params.length})`);
      }

      if (postType && postType !== "all") {
        params.push(postType);
        conditions.push(`p.post_type = $${params.length}`);
      }

      if (hashtag) {
        const cleanTag = String(hashtag).replace(/^#/, "").toLowerCase();
        params.push(cleanTag);
        conditions.push(`EXISTS (
          SELECT 1 FROM blog_post_hashtags bph
          JOIN blog_hashtags bh ON bh.hashtag_id = bph.hashtag_id
          WHERE bph.post_id = p.post_id AND LOWER(bh.tag) = $${params.length}
        )`);
      }

      if (search && String(search).trim()) {
        params.push(`%${String(search).trim()}%`);
        const idx = params.length;
        conditions.push(`(
          p.title ILIKE $${idx} OR
          p.caption ILIKE $${idx} OR
          p.content ILIKE $${idx} OR
          p.author_name ILIKE $${idx}
        )`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countRes = await db.query(
        `SELECT COUNT(*) AS total
         FROM blog_posts p
         LEFT JOIN blog_categories c ON c.category_id = p.category_id
         ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || "0", 10);

      const queryParams = [...params, safeLimit, offset];
      const postsRes = await db.query(
        `SELECT 
           p.*,
           c.name AS category_name,
           c.slug AS category_slug,
           c.icon AS category_icon
         FROM blog_posts p
         LEFT JOIN blog_categories c ON c.category_id = p.category_id
         ${whereClause}
         ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.post_id DESC
         LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
        queryParams
      );

      const posts = postsRes.rows || [];
      if (posts.length > 0) {
        const postIds = posts.map((p) => p.post_id);

        const mediaRes = await db.query(
          `SELECT * FROM blog_post_media
           WHERE post_id = ANY($1)
           ORDER BY display_order ASC, media_id ASC`,
          [postIds]
        );

        const tagsRes = await db.query(
          `SELECT bph.post_id, bh.hashtag_id, bh.tag, bh.display_tag
           FROM blog_post_hashtags bph
           JOIN blog_hashtags bh ON bh.hashtag_id = bph.hashtag_id
           WHERE bph.post_id = ANY($1)
           ORDER BY bh.usage_count DESC`,
          [postIds]
        );

        const mediaByPost = {};
        for (const m of mediaRes.rows || []) {
          if (!mediaByPost[m.post_id]) mediaByPost[m.post_id] = [];
          mediaByPost[m.post_id].push(m);
        }

        const tagsByPost = {};
        for (const t of tagsRes.rows || []) {
          if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = [];
          tagsByPost[t.post_id].push(t);
        }

        for (const post of posts) {
          post.media = mediaByPost[post.post_id] || [];
          post.hashtags = tagsByPost[post.post_id] || [];
          const meta = typeof post.metadata === "string" ? JSON.parse(post.metadata || "{}") : (post.metadata || {});
          post.social_links = Array.isArray(meta.social_links) ? meta.social_links : (Array.isArray(meta.cross_posts) ? meta.cross_posts : []);
        }
      }

      // Fetch default blog layout from theme_settings
      let defaultLayout = "feed";
      try {
        const themeRes = await db.query(
          `SELECT setting_value FROM theme_settings WHERE setting_key = 'active_theme' LIMIT 1`
        );
        if (themeRes.rows[0]?.setting_value?.defaultBlogLayout) {
          defaultLayout = themeRes.rows[0].setting_value.defaultBlogLayout;
        }
      } catch (_) {}

      return res.json({
        success: true,
        posts,
        total,
        page: parseInt(page, 10) || 1,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
        defaultLayout,
      });
    } catch (err) {
      console.error("[CmsController.getPosts] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to load blog posts.", error: err.message });
    }
  }

  async getPostBySlug(req, res) {
    try {
      const { slug } = req.params;
      const isNumericId = /^\d+$/.test(String(slug));

      const postRes = await db.query(
        `SELECT 
           p.*,
           c.name AS category_name,
           c.slug AS category_slug,
           c.icon AS category_icon
         FROM blog_posts p
         LEFT JOIN blog_categories c ON c.category_id = p.category_id
         WHERE p.slug = $1 ${isNumericId ? "OR p.post_id = $2" : ""}
         LIMIT 1`,
        isNumericId ? [String(slug), parseInt(slug, 10)] : [String(slug)]
      );

      if (!postRes.rows || postRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      const post = postRes.rows[0];

      // Increment view count asynchronously
      db.query(`UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE post_id = $1`, [post.post_id]).catch(() => {});

      const [mediaRes, tagsRes, relatedRes] = await Promise.all([
        db.query(
          `SELECT * FROM blog_post_media WHERE post_id = $1 ORDER BY display_order ASC, media_id ASC`,
          [post.post_id]
        ),
        db.query(
          `SELECT bh.hashtag_id, bh.tag, bh.display_tag
           FROM blog_post_hashtags bph
           JOIN blog_hashtags bh ON bh.hashtag_id = bph.hashtag_id
           WHERE bph.post_id = $1`,
          [post.post_id]
        ),
        db.query(
          `SELECT p.post_id, p.title, p.slug, p.caption, p.featured_image, p.published_at, p.post_type, c.name AS category_name
           FROM blog_posts p
           LEFT JOIN blog_categories c ON c.category_id = p.category_id
           WHERE p.status = 'published' AND p.post_id != $1
           ORDER BY (CASE WHEN p.category_id = $2 THEN 0 ELSE 1 END), p.published_at DESC
           LIMIT 3`,
          [post.post_id, post.category_id || null]
        ),
      ]);

      post.media = mediaRes.rows || [];
      post.hashtags = tagsRes.rows || [];
      const meta = typeof post.metadata === "string" ? JSON.parse(post.metadata || "{}") : (post.metadata || {});
      post.social_links = Array.isArray(meta.social_links) ? meta.social_links : (Array.isArray(meta.cross_posts) ? meta.cross_posts : []);

      return res.json({
        success: true,
        post,
        relatedPosts: relatedRes.rows || [],
      });
    } catch (err) {
      console.error("[CmsController.getPostBySlug] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch post details.", error: err.message });
    }
  }

  async createPost(req, res) {
    try {
      const {
        title,
        caption,
        caption_html,
        content,
        post_type = "update",
        author_name,
        author_role,
        author_avatar,
        category_id,
        featured_image,
        status = "published",
        scheduled_for,
        layout_preference = "feed",
        link_preview = null,
        metadata = {},
        social_links,
        media = [],
        hashtags = [],
      } = req.body;
      const rawContentText = content ? String(content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
      const effectiveCaption =
        caption !== undefined && caption !== null && String(caption).trim() !== ""
          ? String(caption).trim()
          : caption_html
          ? String(caption_html).trim()
          : rawContentText
          ? rawContentText.substring(0, 300)
          : (title ? String(title).trim() : "");

      const rawMeta = typeof metadata === "string" ? JSON.parse(metadata || "{}") : (metadata || {});
      const resolvedSocial = Array.isArray(social_links)
        ? social_links
        : (Array.isArray(rawMeta.social_links) ? rawMeta.social_links : (Array.isArray(rawMeta.cross_posts) ? rawMeta.cross_posts : []));
      const finalMetadata = { ...rawMeta, social_links: resolvedSocial };

      if (!effectiveCaption && !title && (!media || media.length === 0) && !rawContentText) {
        return res.status(400).json({
          success: false,
          message: "Please provide a post caption, title, content body, or attach media.",
        });
      }

      const baseSlug = slugify(title || effectiveCaption?.substring(0, 65) || `mcpa-update-${Date.now()}`);
      let finalSlug = baseSlug;
      const existingSlug = await db.query(`SELECT post_id FROM blog_posts WHERE slug = $1`, [finalSlug]);
      if (existingSlug.rows && existingSlug.rows.length > 0) {
        finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const firstImg = Array.isArray(media) && media.find((m) => (m.media_type || "image") === "image");
      const resolvedFeatured =
        featured_image ||
        firstImg?.url ||
        firstImg?.file_url ||
        null;

      const resolvedAuthorName = author_name || req.user?.fullName || req.user?.name || req.user?.email || "MCPA Directorate";
      const resolvedAuthorRole = author_role || "Administrator";
      const publishedAt = status === "published" ? new Date().toISOString() : null;
      const safeCategoryId = category_id && !isNaN(parseInt(category_id, 10)) ? parseInt(category_id, 10) : null;
      const safeScheduledFor = scheduled_for && String(scheduled_for).trim() ? scheduled_for : null;

      const insertRes = await db.query(
        `INSERT INTO blog_posts (
           title, slug, caption, content, post_type, author_id, author_name, author_role, author_avatar,
           category_id, featured_image, status, published_at, scheduled_for, layout_preference, link_preview, metadata,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14, $15, $16, $17,
           NOW(), NOW()
         ) RETURNING *`,
        [
          title || null,
          finalSlug,
          effectiveCaption || title || "MCPA Project Update",
          content || effectiveCaption || "",
          post_type,
          req.user?.userId || req.user?.id || null,
          resolvedAuthorName,
          resolvedAuthorRole,
          author_avatar || null,
          safeCategoryId,
          resolvedFeatured,
          status,
          publishedAt,
          safeScheduledFor,
          layout_preference,
          link_preview ? JSON.stringify(link_preview) : null,
          JSON.stringify(finalMetadata),
        ]
      );

      const newPost = insertRes.rows[0];
      newPost.social_links = resolvedSocial;

      // Insert attached media in order
      const savedMedia = [];
      if (Array.isArray(media)) {
        for (let i = 0; i < media.length; i++) {
          const item = media[i];
          const itemUrl = item?.url || item?.file_url;
          if (!item || !itemUrl) continue;
          const mType = item.media_type || (/\.(mp4|webm|mov)$/i.test(itemUrl) ? "video" : "image");
          const safeFileSize = item.file_size && !isNaN(parseInt(item.file_size, 10)) ? parseInt(item.file_size, 10) : 0;
          const mRes = await db.query(
            `INSERT INTO blog_post_media (post_id, media_type, url, thumbnail_url, caption, alt_text, aspect_ratio, display_order, file_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
              newPost.post_id,
              mType,
              itemUrl,
              item.thumbnail_url || null,
              item.caption || "",
              item.alt_text || title || "MCPA Construction Media",
              item.aspect_ratio || "16/9",
              i + 1,
              safeFileSize,
            ]
          );
          savedMedia.push(mRes.rows[0]);

          // Ensure media is cataloged in media_library
          await db.query(
            `INSERT INTO media_library (title, file_name, file_url, thumbnail_url, file_type, category, file_size, uploaded_by, usage_count)
             VALUES ($1, $2, $3, $4, $5, 'blog', $6, $7, 1)
             ON CONFLICT (file_url) DO UPDATE SET usage_count = media_library.usage_count + 1`,
            [
              item.caption || title || "Blog Media",
              item.file_name || path.basename(itemUrl),
              itemUrl,
              item.thumbnail_url || null,
              mType === "video" ? "video/mp4" : "image/jpeg",
              safeFileSize,
              req.user?.userId || req.user?.id || null,
            ]
          ).catch(() => {});
        }
      }

      // Process Hashtags (both explicit and auto-extracted from caption)
      const extractedTags = extractHashtagsFromText(effectiveCaption);
      const explicitTags = Array.isArray(hashtags)
        ? hashtags.map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean)
        : [];
      const allRawTags = Array.from(new Set([...explicitTags, ...extractedTags]));
      const savedTags = [];

      for (const rawTag of allRawTags) {
        const cleanLower = rawTag.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!cleanLower) continue;
        const displayTag = `#${rawTag.replace(/^#/, "")}`;

        const tagRes = await db.query(
          `INSERT INTO blog_hashtags (tag, display_tag, usage_count)
           VALUES ($1, $2, 1)
           ON CONFLICT (tag) DO UPDATE SET usage_count = blog_hashtags.usage_count + 1
           RETURNING *`,
          [cleanLower, displayTag]
        );
        const tagObj = tagRes.rows[0];
        if (tagObj) {
          await db.query(
            `INSERT INTO blog_post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newPost.post_id, tagObj.hashtag_id]
          );
          savedTags.push(tagObj);
        }
      }

      newPost.media = savedMedia;
      newPost.hashtags = savedTags;

      await logAdminActivity(
        req.user?.userId,
        "CREATE_BLOG_POST",
        "blog_post",
        newPost.post_id,
        { title: newPost.title, slug: newPost.slug, status: newPost.status, mediaCount: savedMedia.length },
        req.ip
      );

      try {
        realtimeService.broadcast("CMS_POST_CREATED", { post: newPost });
      } catch (_) {}

      try {
        companyKnowledgeService.invalidateCache();
      } catch (_) {}

      return res.status(201).json({
        success: true,
        message: status === "published" ? "Post published to website!" : "Post saved successfully.",
        post: newPost,
      });
    } catch (err) {
      console.error("[CmsController.createPost] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to create post.", error: err.message });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const postId = parseInt(id, 10);

      const existingRes = await db.query(`SELECT * FROM blog_posts WHERE post_id = $1`, [postId]);
      if (!existingRes.rows || existingRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }
      const existing = existingRes.rows[0];

      const {
        title,
        caption,
        caption_html,
        content,
        post_type,
        author_name,
        author_role,
        category_id,
        featured_image,
        status,
        scheduled_for,
        layout_preference,
        link_preview,
        metadata,
        social_links,
        media,
        hashtags,
      } = req.body;
      const effectiveCaption = caption !== undefined ? caption : caption_html;

      const existingMeta = typeof existing.metadata === "string" ? JSON.parse(existing.metadata || "{}") : (existing.metadata || {});
      const inputMeta = metadata !== undefined ? (typeof metadata === "string" ? JSON.parse(metadata || "{}") : (metadata || {})) : existingMeta;
      const resolvedSocial = social_links !== undefined
        ? (Array.isArray(social_links) ? social_links : [])
        : (Array.isArray(inputMeta.social_links) ? inputMeta.social_links : (Array.isArray(existingMeta.social_links) ? existingMeta.social_links : []));
      const finalMetadata = { ...existingMeta, ...inputMeta, social_links: resolvedSocial };

      const updatedStatus = status !== undefined ? status : existing.status;
      const publishedAt =
        updatedStatus === "published" && !existing.published_at
          ? new Date().toISOString()
          : existing.published_at;

      const firstUpdateImg = Array.isArray(media) && media.find((m) => (m.media_type || "image") === "image");
      const resolvedFeatured =
        featured_image !== undefined
          ? featured_image
          : firstUpdateImg
          ? firstUpdateImg.url || firstUpdateImg.file_url || existing.featured_image
          : existing.featured_image;

      const safeCategoryId =
        category_id !== undefined
          ? category_id && !isNaN(parseInt(category_id, 10))
            ? parseInt(category_id, 10)
            : null
          : existing.category_id;
      const safeScheduledFor =
        scheduled_for !== undefined
          ? scheduled_for && String(scheduled_for).trim()
            ? scheduled_for
            : null
          : existing.scheduled_for;

      const updateRes = await db.query(
        `UPDATE blog_posts
         SET
           title = $1,
           caption = $2,
           content = $3,
           post_type = $4,
           author_name = $5,
           author_role = $6,
           category_id = $7,
           featured_image = $8,
           status = $9,
           published_at = $10,
           scheduled_for = $11,
           layout_preference = $12,
           link_preview = $13,
           metadata = $14,
           updated_at = NOW()
         WHERE post_id = $15
         RETURNING *`,
        [
          title !== undefined ? title : existing.title,
          effectiveCaption !== undefined ? effectiveCaption : existing.caption,
          content !== undefined ? content : existing.content,
          post_type !== undefined ? post_type : existing.post_type,
          author_name !== undefined ? author_name : existing.author_name,
          author_role !== undefined ? author_role : existing.author_role,
          safeCategoryId,
          resolvedFeatured,
          updatedStatus,
          publishedAt,
          safeScheduledFor,
          layout_preference !== undefined ? layout_preference : existing.layout_preference,
          link_preview !== undefined ? (link_preview ? JSON.stringify(link_preview) : null) : existing.link_preview,
          JSON.stringify(finalMetadata),
          postId,
        ]
      );

      const updatedPost = updateRes.rows[0];
      updatedPost.social_links = resolvedSocial;

      // If media array provided, replace & reorder
      if (Array.isArray(media)) {
        await db.query(`DELETE FROM blog_post_media WHERE post_id = $1`, [postId]);
        const savedMedia = [];
        for (let i = 0; i < media.length; i++) {
          const item = media[i];
          const itemUrl = item?.url || item?.file_url;
          if (!item || !itemUrl) continue;
          const mType = item.media_type || (/\.(mp4|webm|mov)$/i.test(itemUrl) ? "video" : "image");
          const safeItemFileSize = item.file_size && !isNaN(parseInt(item.file_size, 10)) ? parseInt(item.file_size, 10) : 0;
          const mRes = await db.query(
            `INSERT INTO blog_post_media (post_id, media_type, url, thumbnail_url, caption, alt_text, aspect_ratio, display_order, file_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
              postId,
              mType,
              itemUrl,
              item.thumbnail_url || null,
              item.caption || "",
              item.alt_text || updatedPost.title || "MCPA Construction Media",
              item.aspect_ratio || "16/9",
              i + 1,
              safeItemFileSize,
            ]
          );
          savedMedia.push(mRes.rows[0]);
        }
        updatedPost.media = savedMedia;
      } else {
        const mediaRes = await db.query(
          `SELECT * FROM blog_post_media WHERE post_id = $1 ORDER BY display_order ASC`,
          [postId]
        );
        updatedPost.media = mediaRes.rows || [];
      }

      // If hashtags or caption updated, sync hashtags
      if (Array.isArray(hashtags) || effectiveCaption !== undefined) {
        await db.query(`DELETE FROM blog_post_hashtags WHERE post_id = $1`, [postId]);
        const extractedTags = extractHashtagsFromText(updatedPost.caption);
        const explicitTags = Array.isArray(hashtags)
          ? hashtags.map((t) => (typeof t === "object" ? t.tag || t.display_tag : String(t)).replace(/^#/, "").trim()).filter(Boolean)
          : [];
        const allRawTags = Array.from(new Set([...explicitTags, ...extractedTags]));
        const savedTags = [];

        for (const rawTag of allRawTags) {
          const cleanLower = rawTag.toLowerCase().replace(/[^a-z0-9_]/g, "");
          if (!cleanLower) continue;
          const displayTag = `#${rawTag.replace(/^#/, "")}`;

          const tagRes = await db.query(
            `INSERT INTO blog_hashtags (tag, display_tag, usage_count)
             VALUES ($1, $2, 1)
             ON CONFLICT (tag) DO UPDATE SET usage_count = blog_hashtags.usage_count + 1
             RETURNING *`,
            [cleanLower, displayTag]
          );
          const tagObj = tagRes.rows[0];
          if (tagObj) {
            await db.query(
              `INSERT INTO blog_post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [postId, tagObj.hashtag_id]
            );
            savedTags.push(tagObj);
          }
        }
        updatedPost.hashtags = savedTags;
      }

      await logAdminActivity(
        req.user?.userId,
        "UPDATE_BLOG_POST",
        "blog_post",
        postId,
        { title: updatedPost.title, status: updatedPost.status },
        req.ip
      );

      try {
        realtimeService.broadcast("CMS_POST_UPDATED", { post: updatedPost });
      } catch (_) {}

      try {
        companyKnowledgeService.invalidateCache();
      } catch (_) {}

      return res.json({
        success: true,
        message: "Post updated and synchronized with public website.",
        post: updatedPost,
      });
    } catch (err) {
      console.error("[CmsController.updatePost] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to update post.", error: err.message });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const postId = parseInt(id, 10);
      if (!postId || isNaN(postId)) {
        return res.status(400).json({ success: false, message: "Valid numeric post ID is required." });
      }

      const delRes = await db.query(
        `DELETE FROM blog_posts WHERE post_id = $1 RETURNING post_id, title, slug`,
        [postId]
      );

      if (!delRes.rows || delRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      await logAdminActivity(
        req.user?.userId,
        "DELETE_BLOG_POST",
        "blog_post",
        postId,
        { deletedTitle: delRes.rows[0].title },
        req.ip
      );

      try {
        realtimeService.broadcast("CMS_POST_DELETED", { postId });
      } catch (_) {}

      try {
        companyKnowledgeService.invalidateCache();
      } catch (_) {}

      return res.json({
        success: true,
        message: "Post deleted permanently.",
        deleted: delRes.rows[0],
      });
    } catch (err) {
      console.error("[CmsController.deletePost] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to delete post.", error: err.message });
    }
  }

  async duplicatePost(req, res) {
    try {
      const { id } = req.params;
      const postId = parseInt(id, 10);

      const origRes = await db.query(`SELECT * FROM blog_posts WHERE post_id = $1`, [postId]);
      if (!origRes.rows || origRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Original post not found." });
      }
      const orig = origRes.rows[0];
      const newTitle = orig.title ? `${orig.title} (Copy)` : null;
      const newSlug = `${orig.slug}-copy-${Date.now().toString(36)}`;

      const copyRes = await db.query(
        `INSERT INTO blog_posts (
           title, slug, caption, content, post_type, author_id, author_name, author_role,
           category_id, featured_image, status, layout_preference, link_preview, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12, $13)
         RETURNING *`,
        [
          newTitle,
          newSlug,
          orig.caption,
          orig.content,
          orig.post_type,
          req.user?.userId || orig.author_id,
          orig.author_name,
          orig.author_role,
          orig.category_id,
          orig.featured_image,
          orig.layout_preference,
          orig.link_preview ? JSON.stringify(orig.link_preview) : null,
          orig.metadata ? JSON.stringify(orig.metadata) : "{}",
        ]
      );
      const newPost = copyRes.rows[0];

      // Copy media
      const mediaRes = await db.query(`SELECT * FROM blog_post_media WHERE post_id = $1 ORDER BY display_order ASC`, [postId]);
      const copiedMedia = [];
      for (const m of mediaRes.rows || []) {
        const cm = await db.query(
          `INSERT INTO blog_post_media (post_id, media_type, url, thumbnail_url, caption, alt_text, aspect_ratio, display_order, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [newPost.post_id, m.media_type, m.url, m.thumbnail_url, m.caption, m.alt_text, m.aspect_ratio, m.display_order, m.file_size]
        );
        copiedMedia.push(cm.rows[0]);
      }

      // Copy hashtags
      const tagsRes = await db.query(`SELECT hashtag_id FROM blog_post_hashtags WHERE post_id = $1`, [postId]);
      for (const t of tagsRes.rows || []) {
        await db.query(
          `INSERT INTO blog_post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newPost.post_id, t.hashtag_id]
        );
      }

      newPost.media = copiedMedia;

      await logAdminActivity(req.user?.userId, "DUPLICATE_BLOG_POST", "blog_post", newPost.post_id, { fromPostId: postId }, req.ip);

      return res.status(201).json({
        success: true,
        message: "Post duplicated as a draft.",
        post: newPost,
      });
    } catch (err) {
      console.error("[CmsController.duplicatePost] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to duplicate post.", error: err.message });
    }
  }

  async reactToPost(req, res) {
    try {
      const { id } = req.params;
      const { type = "like" } = req.body;
      const col = type === "share" ? "shares_count" : "likes_count";

      const result = await db.query(
        `UPDATE blog_posts SET ${col} = COALESCE(${col}, 0) + 1 WHERE post_id = $1 RETURNING post_id, likes_count, shares_count`,
        [parseInt(id, 10)]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      return res.json({ success: true, ...result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to record interaction." });
    }
  }

  // ===========================================================================
  // 2. CATEGORIES & HASHTAGS API
  // ===========================================================================
  async getCategories(req, res) {
    try {
      const result = await db.query(`
        SELECT 
          c.*,
          COUNT(p.post_id)::INT AS post_count
        FROM blog_categories c
        LEFT JOIN blog_posts p ON p.category_id = c.category_id AND p.status = 'published'
        GROUP BY c.category_id
        ORDER BY c.display_order ASC, c.name ASC
      `);
      return res.json({ success: true, categories: result.rows || [] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load categories." });
    }
  }

  async createCategory(req, res) {
    try {
      const { name, description, icon = "FolderIcon", display_order = 0 } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: "Category name is required." });
      }
      const slug = slugify(name);
      const result = await db.query(
        `INSERT INTO blog_categories (name, slug, description, icon, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING *`,
        [String(name).trim(), slug, description || "", icon, parseInt(display_order, 10) || 0]
      );
      await logAdminActivity(req.user?.userId, "CREATE_CATEGORY", "blog_category", result.rows[0].category_id, { name }, req.ip);
      return res.status(201).json({ success: true, category: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to create category.", error: err.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, icon, display_order, is_active } = req.body;
      const slug = name ? slugify(name) : undefined;
      const result = await db.query(
        `UPDATE blog_categories
         SET
           name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           icon = COALESCE($4, icon),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active)
         WHERE category_id = $7
         RETURNING *`,
        [name || null, slug || null, description !== undefined ? description : null, icon || null, display_order !== undefined ? parseInt(display_order, 10) : null, is_active !== undefined ? is_active : null, parseInt(id, 10)]
      );
      return res.json({ success: true, category: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update category." });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await db.query(`DELETE FROM blog_categories WHERE category_id = $1`, [parseInt(id, 10)]);
      return res.json({ success: true, message: "Category deleted." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to delete category." });
    }
  }

  async getHashtags(req, res) {
    try {
      const result = await db.query(`
        SELECT 
          bh.*,
          COUNT(bph.post_id)::INT AS active_post_count
        FROM blog_hashtags bh
        LEFT JOIN blog_post_hashtags bph ON bph.hashtag_id = bh.hashtag_id
        GROUP BY bh.hashtag_id
        ORDER BY active_post_count DESC, bh.usage_count DESC, bh.tag ASC
        LIMIT 100
      `);
      return res.json({ success: true, hashtags: result.rows || [] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load hashtags." });
    }
  }

  async createHashtag(req, res) {
    try {
      const { tag } = req.body;
      if (!tag) return res.status(400).json({ success: false, message: "Hashtag is required." });
      const raw = String(tag).replace(/^#/, "").trim();
      const cleanLower = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
      const displayTag = `#${raw}`;
      const result = await db.query(
        `INSERT INTO blog_hashtags (tag, display_tag, usage_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (tag) DO UPDATE SET display_tag = EXCLUDED.display_tag
         RETURNING *`,
        [cleanLower, displayTag]
      );
      return res.status(201).json({ success: true, hashtag: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to create hashtag." });
    }
  }

  async deleteHashtag(req, res) {
    try {
      const { id } = req.params;
      await db.query(`DELETE FROM blog_hashtags WHERE hashtag_id = $1`, [parseInt(id, 10)]);
      return res.json({ success: true, message: "Hashtag removed." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to delete hashtag." });
    }
  }

  // ===========================================================================
  // 3. CENTRALIZED MEDIA LIBRARY API
  // ===========================================================================
  async getMediaLibrary(req, res) {
    try {
      const { type, search, category } = req.query;
      const conditions = [];
      const params = [];

      if (type === "image") {
        conditions.push(`m.file_type LIKE 'image/%'`);
      } else if (type === "video") {
        conditions.push(`m.file_type LIKE 'video/%'`);
      }

      if (category && category !== "all") {
        params.push(category);
        conditions.push(`m.category = $${params.length}`);
      }

      if (search && String(search).trim()) {
        params.push(`%${String(search).trim()}%`);
        conditions.push(`(m.title ILIKE $${params.length} OR m.file_name ILIKE $${params.length})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const mediaRes = await db.query(
        `SELECT 
           m.*,
           (
             SELECT COUNT(*) FROM blog_post_media bpm WHERE bpm.url = m.file_url
           )::INT + (
             SELECT COUNT(*) FROM website_content wc WHERE wc.content_value = m.file_url
           )::INT AS active_references
         FROM media_library m
         ${whereClause}
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 200`,
        params
      );

      return res.json({
        success: true,
        media: mediaRes.rows || [],
      });
    } catch (err) {
      console.error("[CmsController.getMediaLibrary] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch media library." });
    }
  }

  async uploadMediaFiles(req, res) {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      const { title, category = "blog" } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: "No media files provided for upload." });
      }

      const uploadedItems = [];
      for (const file of files) {
        const publicUrl = await storage.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "portfolio"
        );

        const insRes = await db.query(
          `INSERT INTO media_library (title, file_name, file_url, file_type, category, file_size, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (file_url) DO UPDATE SET title = EXCLUDED.title
           RETURNING *`,
          [
            title || file.originalname,
            file.originalname,
            publicUrl,
            file.mimetype || "image/jpeg",
            category,
            file.size || 0,
            req.user?.userId || req.user?.id || null,
          ]
        );
        uploadedItems.push(insRes.rows[0]);
      }

      await logAdminActivity(
        req.user?.userId,
        "UPLOAD_MEDIA",
        "media_library",
        uploadedItems.map((i) => i.id).join(","),
        { count: uploadedItems.length },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: `Uploaded ${uploadedItems.length} file(s) to Media Library.`,
        media: uploadedItems,
      });
    } catch (err) {
      console.error("[CmsController.uploadMediaFiles] Error:", err);
      return res.status(500).json({ success: false, message: "Media upload failed.", error: err.message });
    }
  }

  async deleteMediaItem(req, res) {
    try {
      const { id } = req.params;
      const { force, replacementUrl } = req.query;

      const itemRes = await db.query(`SELECT * FROM media_library WHERE id = $1`, [parseInt(id, 10)]);
      if (!itemRes.rows || itemRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Media item not found." });
      }
      const mediaItem = itemRes.rows[0];

      // Check active references in blog posts and website content
      const postRefs = await db.query(
        `SELECT DISTINCT p.post_id, p.title, p.slug
         FROM blog_post_media bpm
         JOIN blog_posts p ON p.post_id = bpm.post_id
         WHERE bpm.url = $1`,
        [mediaItem.file_url]
      );
      const contentRefs = await db.query(
        `SELECT page_key, section_key, content_key FROM website_content WHERE content_value = $1`,
        [mediaItem.file_url]
      );

      const totalRefs = (postRefs.rows?.length || 0) + (contentRefs.rows?.length || 0);

      if (totalRefs > 0 && force !== "true") {
        return res.status(409).json({
          success: false,
          inUse: true,
          referenceCount: totalRefs,
          usedInPosts: postRefs.rows || [],
          usedInContent: contentRefs.rows || [],
          message: `This media file is currently used in ${totalRefs} published item(s). Provide a replacement or confirm forced removal.`,
        });
      }

      if (replacementUrl) {
        await db.query(`UPDATE blog_post_media SET url = $1 WHERE url = $2`, [replacementUrl, mediaItem.file_url]);
        await db.query(`UPDATE blog_posts SET featured_image = $1 WHERE featured_image = $2`, [replacementUrl, mediaItem.file_url]);
        await db.query(`UPDATE website_content SET content_value = $1 WHERE content_value = $2`, [replacementUrl, mediaItem.file_url]);
      } else if (force === "true") {
        await db.query(`DELETE FROM blog_post_media WHERE url = $1`, [mediaItem.file_url]);
      }

      await db.query(`DELETE FROM media_library WHERE id = $1`, [parseInt(id, 10)]);

      await logAdminActivity(req.user?.userId, "DELETE_MEDIA", "media_library", id, { file_url: mediaItem.file_url }, req.ip);

      return res.json({
        success: true,
        message: "Media file removed from library.",
      });
    } catch (err) {
      console.error("[CmsController.deleteMediaItem] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to delete media item." });
    }
  }

  // ===========================================================================
  // 4. WEBSITE-WIDE DYNAMIC CONTENT MANAGEMENT API
  // ===========================================================================
  async getWebsiteContent(req, res) {
    try {
      const { page } = req.query;
      let query = `SELECT * FROM website_content ORDER BY page_key ASC, section_key ASC, content_key ASC`;
      let params = [];
      if (page) {
        query = `SELECT * FROM website_content WHERE page_key = $1 ORDER BY section_key ASC, content_key ASC`;
        params = [page];
      }

      const result = await db.query(query, params);
      const rows = result.rows || [];

      // Transform into structured nested dictionary for effortless frontend consumption
      const contentMap = {};
      const flatKeyMap = {};
      for (const row of rows) {
        if (!contentMap[row.page_key]) contentMap[row.page_key] = {};
        if (!contentMap[row.page_key][row.section_key]) contentMap[row.page_key][row.section_key] = {};
        contentMap[row.page_key][row.section_key][row.content_key] = row.content_value;
        flatKeyMap[row.content_key] = row.content_value;
      }

      return res.json({
        success: true,
        content: contentMap,
        flatKeyMap,
        items: rows,
      });
    } catch (err) {
      console.error("[CmsController.getWebsiteContent] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to load website content." });
    }
  }

  async updateWebsiteContent(req, res) {
    try {
      const { items, page_key, section_key, content_key, content_value, content_type = "text" } = req.body;

      const batch = Array.isArray(items)
        ? items
        : page_key && section_key && content_key !== undefined
        ? [{ page_key, section_key, content_key, content_value, content_type }]
        : [];

      if (batch.length === 0) {
        return res.status(400).json({ success: false, message: "No content items provided to update." });
      }

      const updatedRows = [];
      for (const entry of batch) {
        if (!entry.page_key || !entry.section_key || !entry.content_key) continue;
        const valStr =
          typeof entry.content_value === "object"
            ? JSON.stringify(entry.content_value)
            : String(entry.content_value ?? "");

        const resRow = await db.query(
          `INSERT INTO website_content (page_key, section_key, content_key, content_value, content_type, last_modified_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (page_key, section_key, content_key)
           DO UPDATE SET
             content_value = EXCLUDED.content_value,
             content_type = COALESCE(EXCLUDED.content_type, website_content.content_type),
             last_modified_by = EXCLUDED.last_modified_by,
             updated_at = NOW()
           RETURNING *`,
          [
            entry.page_key,
            entry.section_key,
            entry.content_key,
            valStr,
            entry.content_type || "text",
            req.user?.userId || null,
          ]
        );
        if (resRow.rows?.[0]) updatedRows.push(resRow.rows[0]);
      }

      await logAdminActivity(
        req.user?.userId,
        "UPDATE_WEBSITE_CONTENT",
        "website_content",
        batch.map((b) => `${b.page_key}.${b.section_key}.${b.content_key}`).slice(0, 5).join(", "),
        { updatedCount: updatedRows.length },
        req.ip
      );

      try {
        realtimeService.broadcast("CMS_CONTENT_UPDATED", { updatedRows });
      } catch (_) {}

      try {
        companyKnowledgeService.invalidateCache();
      } catch (_) {}

      return res.json({
        success: true,
        message: "Website content saved and published live across all pages.",
        updated: updatedRows,
      });
    } catch (err) {
      console.error("[CmsController.updateWebsiteContent] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to save website content.", error: err.message });
    }
  }

  // ===========================================================================
  // 5. WEBSITE THEME & APPEARANCE CUSTOMIZATION API
  // ===========================================================================
  async getThemeSettings(req, res) {
    try {
      const result = await db.query(
        `SELECT setting_value, updated_at FROM theme_settings WHERE setting_key = 'active_theme' LIMIT 1`
      );
      const activeTheme = result.rows?.[0]?.setting_value
        ? { ...DEFAULT_THEME, ...result.rows[0].setting_value }
        : DEFAULT_THEME;

      return res.json({
        success: true,
        theme: activeTheme,
        defaults: DEFAULT_THEME,
        updatedAt: result.rows?.[0]?.updated_at || null,
      });
    } catch (err) {
      return res.json({
        success: true,
        theme: DEFAULT_THEME,
        defaults: DEFAULT_THEME,
      });
    }
  }

  async updateThemeSettings(req, res) {
    try {
      const newTheme = {
        ...DEFAULT_THEME,
        ...(req.body.theme || req.body || {}),
      };

      const result = await db.query(
        `INSERT INTO theme_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ('active_theme', $1, $2, NOW())
         ON CONFLICT (setting_key)
         DO UPDATE SET
           setting_value = EXCLUDED.setting_value,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
         RETURNING *`,
        [JSON.stringify(newTheme), req.user?.userId || null]
      );

      await logAdminActivity(
        req.user?.userId,
        "UPDATE_THEME_SETTINGS",
        "theme_settings",
        "active_theme",
        { presetName: newTheme.presetName, primaryColor: newTheme.primaryColor, defaultBlogLayout: newTheme.defaultBlogLayout },
        req.ip
      );

      try {
        realtimeService.broadcast("CMS_THEME_UPDATED", { theme: newTheme });
      } catch (_) {}

      return res.json({
        success: true,
        message: "Website appearance & theme published globally.",
        theme: result.rows[0]?.setting_value || newTheme,
      });
    } catch (err) {
      console.error("[CmsController.updateThemeSettings] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to save theme settings." });
    }
  }

  async resetThemeSettings(req, res) {
    try {
      await db.query(
        `INSERT INTO theme_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ('active_theme', $1, $2, NOW())
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [JSON.stringify(DEFAULT_THEME), req.user?.userId || null]
      );

      await logAdminActivity(req.user?.userId, "RESET_THEME_SETTINGS", "theme_settings", "active_theme", {}, req.ip);

      try {
        realtimeService.broadcast("CMS_THEME_UPDATED", { theme: DEFAULT_THEME });
      } catch (_) {}

      return res.json({
        success: true,
        message: "Theme reset to official MCPA Signature Amber defaults.",
        theme: DEFAULT_THEME,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to reset theme settings." });
    }
  }

  // ===========================================================================
  // 6. LINK PREVIEW RECOGNITION & OVERVIEW LOGS
  // ===========================================================================
  async parseLinkPreview(req, res) {
    try {
      const { url } = req.body;
      if (!url || !/^https?:\/\//i.test(String(url).trim())) {
        return res.status(400).json({ success: false, message: "Valid URL is required." });
      }

      const targetUrl = String(url).trim();
      const parsed = new URL(targetUrl);
      const hostname = parsed.hostname.replace(/^www\./, "");

      let preview = {
        url: targetUrl,
        siteName: hostname,
        title: targetUrl,
        description: `External resource on ${hostname}`,
        image: "/assets/hero-residence-day-wide-v2.jpg",
      };

      if (hostname.includes("mcpaconstruction.com")) {
        preview = {
          url: targetUrl,
          siteName: "MCPA Construction and Supply",
          title: "MCPA Construction and Supply — Design & Build Contractor Bulacan",
          description: "Full-service architectural design and general engineering construction in Plaridel, Bulacan.",
          image: "/assets/hero-residence-day-wide-v2.jpg",
        };
      } else if (hostname.includes("facebook.com") || hostname.includes("fb.watch")) {
        preview = {
          url: targetUrl,
          siteName: "Facebook",
          title: "MCPA Construction and Supply on Facebook",
          description: "View official project updates, community reels, and site progress photos on Facebook.",
          image: "/assets/hero-residence-day-wide-v2.jpg",
        };
      } else if (hostname.includes("instagram.com")) {
        preview = {
          url: targetUrl,
          siteName: "Instagram",
          title: "MCPA Construction & Supply (@mcpa.constructionandsupply)",
          description: "Architectural showcases, modern house reels, and behind-the-scenes site engineering.",
          image: "/assets/hero-residence-day-wide-v2.jpg",
        };
      } else if (hostname.includes("tiktok.com")) {
        preview = {
          url: targetUrl,
          siteName: "TikTok",
          title: "MCPA Construction (@mcpa.construction) on TikTok",
          description: "Watch short-form construction time-lapses and engineering walkthroughs on TikTok.",
          image: "/assets/hero-residence-day-wide-v2.jpg",
        };
      } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        preview = {
          url: targetUrl,
          siteName: "YouTube",
          title: "Architectural Walkthrough & Construction Progress Video",
          description: "Watch in high definition on YouTube.",
          image: "/assets/hero-residence-day-wide-v2.jpg",
        };
      } else {
        // Attempt lightweight HTML meta tag fetch with 3.5s timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const resp = await fetch(targetUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "MCPAConstructionLinkBot/1.0" },
          });
          clearTimeout(timer);
          if (resp.ok) {
            const html = await resp.text();
            const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
            const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
            const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
            if (ogTitle) preview.title = ogTitle.trim();
            if (ogDesc) preview.description = ogDesc.trim();
            if (ogImg) preview.image = ogImg.trim();
          }
        } catch (_) {}
      }

      return res.json({ success: true, preview });
    } catch (err) {
      return res.status(400).json({ success: false, message: "Could not generate link preview." });
    }
  }

  async getCmsOverview(req, res) {
    try {
      const [postStats, mediaStats, catCount, tagCount, contentCount, logsRes] = await Promise.all([
        db.query(`
          SELECT
            COUNT(*)::INT AS total_posts,
            COUNT(*) FILTER (WHERE status = 'published')::INT AS published_posts,
            COUNT(*) FILTER (WHERE status = 'draft')::INT AS draft_posts,
            COUNT(*) FILTER (WHERE status = 'scheduled')::INT AS scheduled_posts,
            COUNT(*) FILTER (WHERE status = 'archived')::INT AS archived_posts,
            COALESCE(SUM(view_count), 0)::INT AS total_views,
            COALESCE(SUM(likes_count), 0)::INT AS total_likes
          FROM blog_posts
        `),
        db.query(`SELECT COUNT(*)::INT AS total_media, COALESCE(SUM(file_size), 0)::BIGINT AS total_bytes FROM media_library`),
        db.query(`SELECT COUNT(*)::INT AS total_categories FROM blog_categories`),
        db.query(`SELECT COUNT(*)::INT AS total_hashtags FROM blog_hashtags`),
        db.query(`SELECT COUNT(*)::INT AS total_content_keys FROM website_content`),
        db.query(`
          SELECT l.*, u.full_name AS admin_name, u.email AS admin_email
          FROM admin_activity_logs l
          LEFT JOIN users u ON u.user_id = l.admin_id
          ORDER BY l.created_at DESC
          LIMIT 30
        `),
      ]);

      return res.json({
        success: true,
        summary: {
          ...(postStats.rows[0] || {}),
          ...(mediaStats.rows[0] || {}),
          total_categories: catCount.rows[0]?.total_categories || 0,
          total_hashtags: tagCount.rows[0]?.total_hashtags || 0,
          total_content_keys: contentCount.rows[0]?.total_content_keys || 0,
        },
        activityLogs: logsRes.rows || [],
      });
    } catch (err) {
      console.error("[CmsController.getCmsOverview] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to load CMS overview." });
    }
  }
}

module.exports = new CmsController();
