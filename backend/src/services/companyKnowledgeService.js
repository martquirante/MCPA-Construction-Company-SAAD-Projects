/**
 * MCPA Construction and Supply — Centralized Company Knowledge Retrieval Service
 * 
 * Strict Security Guardrails:
 * - Only indexes and searches public company data (CMS content, public projects, public blog posts, static company profile).
 * - STRICT TABLE ALLOWLIST: website_content, projects, blog_posts, blog_categories, blog_hashtags, media_library.
 * - Under NO CIRCUMSTANCES accesses private tables (users, otp_codes, client_briefs, billing_ledger, etc.).
 * - Generates grounded, cited snippets for retrieval-augmented generation (RAG).
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("./dbFailoverEngine");

// Strict database table allowlist for public knowledge retrieval
const ALLOWED_PUBLIC_TABLES = new Set([
  "website_content",
  "projects",
  "blog_posts",
  "blog_categories",
  "blog_hashtags",
  "blog_post_media",
  "media_library",
]);

// Stop words to prevent false positive matches on common filler words
const KNOWLEDGE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "what", "where", "when",
  "why", "who", "which", "how", "can", "could", "would", "should", "will", "shall",
  "are", "is", "was", "were", "been", "have", "has", "had", "does", "did", "you",
  "your", "our", "they", "them", "their", "please", "tell", "give", "know", "about",
  "mga", "ang", "para", "kung", "saan", "kailan", "paano", "ano", "sino", "bakit",
  "may", "meron", "ba", "po", "opo", "ko", "mo", "namin", "ninyo", "nyo", "lang",
]);

// Official static company facts
const OFFICIAL_COMPANY_PROFILE = {
  name: "MCPA Construction and Supply",
  tagline: "Quality Construction · Direct Materials · Engineered to Last",
  headquarters: "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan 3004, Philippines",
  phone: "+63-949-775-8239",
  email: "mcpa.construction@gmail.com",
  serviceAreas: ["Plaridel", "Malolos", "Bulacan", "Metro Manila", "Central Luzon"],
  businessHours: "Monday to Saturday, 8:00 AM to 5:00 PM (Closed on Sundays)",
  leadership: "Licensed Civil Engineers, Master Architects, and Construction Project Managers",
  specialties: [
    "Custom Residential Design & Build (2-Storey & 3-Storey Villas and Modern Residences)",
    "Build Now Pay Later (BNPL) Financing Assistance for Titled Lot Owners",
    "Complete Signed & Sealed Architectural and Structural Blueprints",
    "Commercial Warehouses and Industrial Buildings",
    "Turnkey Construction Supply & Direct Aggregates Distribution",
    "Building Permit Processing and Bank/Pag-IBIG Housing Loan Approvals",
  ],
  socialMedia: {
    facebook: {
      platform: "Facebook",
      handle: "@MCPA.ConstructionandSupply",
      url: "https://www.facebook.com/MCPA.ConstructionandSupply/",
      followers: "18,000+ followers",
      description: "Official Facebook page posting weekly video progress logs, topping-off ceremonies, and live project albums.",
    },
    instagram: {
      platform: "Instagram",
      handle: "@mcpa.constructionandsupply",
      url: "https://www.instagram.com/mcpa.constructionandsupply/",
      description: "High-resolution architectural photography, 3D renderings, and interior design showcases.",
    },
    tiktok: {
      platform: "TikTok",
      handle: "@mcpa.construction",
      url: "https://www.tiktok.com/@mcpa.construction",
      description: "Short-form video logs, structural cylinder compression tests, and on-site engineering tips.",
    },
  },
  constructionProcess: [
    { stage: 1, name: "Consultation & Lot Verification", desc: "Site ocular, soil bearing capacity evaluation, lot title verification, and architectural design brief." },
    { stage: 2, name: "Blueprints & Engineering Specifications", desc: "Complete architectural, structural, sanitary, and electrical drawings signed & sealed by licensed practitioners." },
    { stage: 3, name: "Budgeting & Loan Coordination", desc: "Transparent Bill of Materials (BOM) with milestone-based progressive billing and Pag-IBIG/bank loan coordination." },
    { stage: 4, name: "Groundbreaking & Permits", desc: "Local building permit acquisition, barangay clearances, and ceremonial site groundbreaking." },
    { stage: 5, name: "Monolithic Site Construction & Turnover", desc: "Monolithic concrete pouring, continuous cylinder testing, regular photo progress, and formal 15-year structural warranty handover." },
  ],
};

// In-memory knowledge cache
let knowledgeIndexCache = null;
let indexCacheExpiresAt = 0;

class CompanyKnowledgeService {
  constructor() {
    this.refreshIntervalMs = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Rebuilds or refreshes the searchable knowledge base from public database sources
   */
  async buildKnowledgeIndex(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && knowledgeIndexCache && indexCacheExpiresAt > now) {
      return knowledgeIndexCache;
    }

    const documents = [];

    // 1. Static Company Profile Documents
    documents.push({
      id: "company-profile-general",
      category: "about",
      title: "MCPA Construction and Supply — Official Company Overview & Contact",
      source: "About MCPA",
      sourceUrl: "/#about",
      content: `${OFFICIAL_COMPANY_PROFILE.name} is a premier design-and-build general contractor located at ${OFFICIAL_COMPANY_PROFILE.headquarters}. Contact Phone: ${OFFICIAL_COMPANY_PROFILE.phone}, Email: ${OFFICIAL_COMPANY_PROFILE.email}. Business Hours: ${OFFICIAL_COMPANY_PROFILE.businessHours}. Serving ${OFFICIAL_COMPANY_PROFILE.serviceAreas.join(", ")}. Tagline: ${OFFICIAL_COMPANY_PROFILE.tagline}.`,
      tags: ["mcpa", "contact", "address", "phone", "email", "office", "location", "plaridel", "bulacan", "hours"],
    });

    documents.push({
      id: "company-services-list",
      category: "services",
      title: "Official Construction Services & Specialties",
      source: "MCPA Services",
      sourceUrl: "/services",
      content: `MCPA Construction and Supply offers full-service architectural and engineering solutions: ${OFFICIAL_COMPANY_PROFILE.specialties.join("; ")}. Includes Pag-IBIG and commercial bank loan processing assistance.`,
      tags: ["services", "build", "design", "bnpl", "build now pay later", "warehouse", "permits", "blueprints", "loan"],
    });

    documents.push({
      id: "company-process-stages",
      category: "process",
      title: "5-Stage Turnkey Design & Build Construction Process",
      source: "Our Process",
      sourceUrl: "/process",
      content: OFFICIAL_COMPANY_PROFILE.constructionProcess
        .map((p) => `Stage ${p.stage}: ${p.name} — ${p.desc}`)
        .join("\n"),
      tags: ["process", "stages", "roadmap", "steps", "foundation", "turnover", "permits", "timeline", "blueprints"],
    });

    // 2. Official Social Media Channels Documents
    for (const [key, social] of Object.entries(OFFICIAL_COMPANY_PROFILE.socialMedia)) {
      documents.push({
        id: `social-${key}`,
        category: "social",
        title: `Official MCPA ${social.platform} Channel (${social.handle})`,
        source: `Official ${social.platform}`,
        sourceUrl: social.url,
        content: `MCPA Construction and Supply official ${social.platform} presence (${social.handle}): ${social.description} Public URL: ${social.url}. ${social.followers ? social.followers : ""}`,
        tags: ["social", "facebook", "instagram", "tiktok", "videos", "reels", "photos", key],
      });
    }

    // 3. Database: Live Dynamic Website Content (CMS)
    try {
      const cmsRes = await db.query(`
        SELECT page_key, section_key, content_key, content_value 
        FROM public.website_content
        ORDER BY page_key, section_key;
      `);
      if (cmsRes?.rows && cmsRes.rows.length > 0) {
        // Group by page and section
        const sectionMap = {};
        for (const row of cmsRes.rows) {
          const key = `${row.page_key}-${row.section_key}`;
          if (!sectionMap[key]) {
            sectionMap[key] = {
              page: row.page_key,
              section: row.section_key,
              snippets: [],
            };
          }
          sectionMap[key].snippets.push(`${row.content_key.replace(/_/g, " ")}: ${row.content_value}`);
        }

        for (const [key, val] of Object.entries(sectionMap)) {
          const urlMap = {
            home: "/",
            services: "/services",
            process: "/process",
            about: "/#about",
            contact: "/book",
          };
          documents.push({
            id: `cms-${key}`,
            category: "website_content",
            title: `Website Content — ${val.page.toUpperCase()} (${val.section})`,
            source: `MCPA ${val.page.charAt(0).toUpperCase() + val.page.slice(1)} Page`,
            sourceUrl: urlMap[val.page] || "/",
            content: val.snippets.join(" | "),
            tags: [val.page, val.section, "website", "content", "cms"],
          });
        }
      }
    } catch (cmsErr) {
      console.warn("[CompanyKnowledgeService] CMS index notice:", cmsErr.message);
    }

    // 4. Database: Public Published Projects
    try {
      const projRes = await db.query(`
        SELECT project_id, name, location, description, category, status, floor_area, bedrooms, architectural_details
        FROM public.projects
        WHERE is_web_visible IS NOT FALSE
        ORDER BY project_id ASC;
      `);
      if (projRes?.rows && projRes.rows.length > 0) {
        for (const p of projRes.rows) {
          const projName = p.name || `Project #${p.project_id}`;
          documents.push({
            id: `project-${p.project_id}`,
            category: "projects",
            title: `Completed Project: ${projName} (${p.location || "Bulacan"})`,
            source: "Project Portfolio",
            sourceUrl: "/projects",
            content: `Project Name: ${projName}. Location: ${p.location || "Bulacan"}. Category: ${p.category || "Residential"}. Status: ${p.status || "Completed"}. Floor Area: ${p.floor_area || "N/A"}. Bedrooms: ${p.bedrooms || "N/A"}. Details: ${p.description || p.architectural_details || "Turnkey custom structural build with certified materials and signed blueprints by MCPA."}`,
            tags: ["project", "portfolio", "showcase", "house", "works", projName.toLowerCase(), (p.location || "").toLowerCase()],
          });
        }
      }
    } catch (projErr) {
      console.warn("[CompanyKnowledgeService] Projects index notice:", projErr.message);
    }

    // 5. Database: Public Published Blog Posts & Site Progress Logs
    try {
      const blogRes = await db.query(`
        SELECT p.post_id, p.title, p.slug, p.caption, p.content, p.author_name, p.published_at,
               c.name as category_name
        FROM public.blog_posts p
        LEFT JOIN public.blog_categories c ON p.category_id = c.category_id
        WHERE p.status = 'published'
        ORDER BY p.published_at DESC LIMIT 25;
      `);
      if (blogRes?.rows && blogRes.rows.length > 0) {
        for (const b of blogRes.rows) {
          // Strip HTML tags for clean retrieval
          const cleanBody = (b.content || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
          documents.push({
            id: `blog-${b.post_id}`,
            category: "blog",
            title: `Official Update: ${b.title}`,
            source: `MCPA Blog / Updates`,
            sourceUrl: `/blog/${b.slug}`,
            content: `Title: ${b.title}. Category: ${b.category_name || "Company Update"}. Summary: ${b.caption || ""}. Full Announcement: ${cleanBody.slice(0, 500)}`,
            tags: ["blog", "updates", "announcement", "site progress", b.slug],
          });
        }
      }
    } catch (blogErr) {
      console.warn("[CompanyKnowledgeService] Blog index notice:", blogErr.message);
    }

    knowledgeIndexCache = documents;
    indexCacheExpiresAt = now + this.refreshIntervalMs;
    console.log(`[CompanyKnowledgeService] Indexed ${documents.length} public company knowledge documents.`);
    return documents;
  }

  /**
   * Searches the indexed public company knowledge for relevant documents
   * 
   * @param {string} query User question or inquiry
   * @param {Object} context Context from previous conversation turns
   * @returns {Promise<Array<{title: string, content: string, source: string, sourceUrl: string, score: number}>>}
   */
  async searchKnowledge(query = "", context = {}) {
    if (!query || typeof query !== "string") return [];

    const documents = await this.buildKnowledgeIndex();
    const cleanQuery = query.toLowerCase().trim();

    // Tokenize query words (excluding common stop words)
    const queryTokens = cleanQuery
      .replace(/[^\w\s\u00C0-\u017F]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !KNOWLEDGE_STOP_WORDS.has(t));

    // Also include context keywords from previous turns if user asked follow-up
    const contextKeywords = (context.recentTopics || []).map((t) => t.toLowerCase());

    const scored = [];

    for (const doc of documents) {
      let score = 0;
      const docText = `${doc.title} ${doc.content} ${(doc.tags || []).join(" ")}`.toLowerCase();

      // 1. Exact phrase match
      if (docText.includes(cleanQuery)) {
        score += 15;
      }

      // 2. Individual token matches
      for (const token of queryTokens) {
        if (docText.includes(token)) {
          score += 3;
        }
        // Higher weight if token matches document title or tags
        if (doc.title.toLowerCase().includes(token)) {
          score += 5;
        }
        if ((doc.tags || []).some((tag) => tag.includes(token))) {
          score += 4;
        }
      }

      // 3. Conversation Context relevance
      for (const ctxToken of contextKeywords) {
        if (docText.includes(ctxToken)) {
          score += 2;
        }
      }

      if (score > 4) {
        scored.push({
          title: doc.title,
          content: doc.content,
          source: doc.source,
          sourceUrl: doc.sourceUrl,
          score,
        });
      }
    }

    // Sort descending by relevance score
    scored.sort((a, b) => b.score - a.score);

    // Return top 4 most relevant documents
    return scored.slice(0, 4);
  }

  /**
   * Alias for searchKnowledge with flexible context format
   */
  async searchRelevantKnowledge(query = "", context = {}) {
    const ctx = Array.isArray(context) ? { recentTopics: context } : context;
    return this.searchKnowledge(query, ctx);
  }

  /**
   * Forces knowledge base re-index upon CMS changes or Admin trigger
   */
  invalidateCache() {
    knowledgeIndexCache = null;
    indexCacheExpiresAt = 0;
  }

  /**
   * Security Verification: Asserts that a table name is in the public allowlist
   */
  isTablePubliclyAllowed(tableName) {
    return ALLOWED_PUBLIC_TABLES.has(String(tableName).toLowerCase().trim());
  }
}

module.exports = new CompanyKnowledgeService();
