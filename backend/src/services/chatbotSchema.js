/**
 * MCPA Construction & Supply — Chatbot Schema Guard & Seed Service
 * 
 * dbFailoverEngine mirrors DML (INSERT, UPDATE, DELETE) between Supabase and Neon,
 * but DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX) must be applied explicitly to
 * all active connection pools.
 * 
 * Statements are idempotent and memoized so they can be safely called both during
 * server initialization and lazily upon first chatbot API request.
 */
const db = require("./dbFailoverEngine");
const { DEFAULT_CATEGORIES, DEFAULT_FAQS, DEFAULT_SETTINGS } = require("./chatbotSeedData");

const CHATBOT_TABLE_DDL = [
  // 1. Categories
  `CREATE TABLE IF NOT EXISTS public.chatbot_categories (
    category_id SERIAL PRIMARY KEY,
    slug VARCHAR(80) UNIQUE NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    name_tl VARCHAR(120) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 2. FAQs
  `CREATE TABLE IF NOT EXISTS public.chatbot_faqs (
    faq_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.chatbot_categories(category_id) ON DELETE SET NULL,
    question_en TEXT NOT NULL,
    question_tl TEXT,
    alt_questions JSONB DEFAULT '[]'::jsonb,
    keywords TEXT[] DEFAULT '{}',
    answer_en TEXT NOT NULL,
    answer_tl TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    match_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 3. Settings
  `CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_by INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 4. Conversations
  `CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    conversation_id VARCHAR(64) PRIMARY KEY,
    session_token_hash VARCHAR(128) NOT NULL,
    customer_name VARCHAR(80) NOT NULL,
    customer_email VARCHAR(255),
    language_pref VARCHAR(10) DEFAULT 'en',
    status VARCHAR(32) NOT NULL DEFAULT 'BOT_ACTIVE',
    assigned_admin_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    unread_admin_count INTEGER DEFAULT 0,
    unread_customer_count INTEGER DEFAULT 0,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    handoff_requested_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 5. Messages
  `CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES public.chatbot_conversations(conversation_id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    sender_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    matched_faq_id INTEGER REFERENCES public.chatbot_faqs(faq_id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 6. Feedback
  `CREATE TABLE IF NOT EXISTS public.chatbot_feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES public.chatbot_conversations(conversation_id) ON DELETE CASCADE,
    message_id BIGINT REFERENCES public.chatbot_messages(message_id) ON DELETE SET NULL,
    faq_id INTEGER REFERENCES public.chatbot_faqs(faq_id) ON DELETE SET NULL,
    is_helpful BOOLEAN NOT NULL,
    customer_name VARCHAR(80),
    question_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 7. Unanswered Questions
  `CREATE TABLE IF NOT EXISTS public.chatbot_unanswered_questions (
    unanswered_id BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES public.chatbot_conversations(conversation_id) ON DELETE SET NULL,
    customer_name VARCHAR(80),
    customer_email VARCHAR(255),
    original_question TEXT NOT NULL,
    normalized_question TEXT NOT NULL,
    detected_language VARCHAR(10) DEFAULT 'en',
    top_candidate_faq_id INTEGER REFERENCES public.chatbot_faqs(faq_id) ON DELETE SET NULL,
    top_score NUMERIC(5,4) DEFAULT 0,
    answer_found BOOLEAN DEFAULT FALSE,
    customer_feedback VARCHAR(32) DEFAULT 'NONE',
    human_support_requested BOOLEAN DEFAULT FALSE,
    occurrence_count INTEGER DEFAULT 1,
    resolution_status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    linked_faq_id INTEGER REFERENCES public.chatbot_faqs(faq_id) ON DELETE SET NULL,
    reviewed_by INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // Indexes for high performance querying
  `CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_active_cat ON public.chatbot_faqs(is_active, category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_keywords ON public.chatbot_faqs USING GIN(keywords);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_conv_status ON public.chatbot_conversations(status, last_message_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_conv_admin ON public.chatbot_conversations(assigned_admin_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_msg_conv ON public.chatbot_messages(conversation_id, message_id ASC);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_unanswered_status ON public.chatbot_unanswered_questions(resolution_status, updated_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chatbot_unanswered_norm ON public.chatbot_unanswered_questions(normalized_question);`,
];

let ensurePromise = null;

async function applyToPool(pool, label) {
  if (!pool) return;
  for (const sql of CHATBOT_TABLE_DDL) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.warn(`[chatbotSchema] ${label} notice: ${err.message}`);
    }
  }
}

async function seedInitialData() {
  try {
    // 1. Seed categories if table is empty
    const catCheck = await db.query("SELECT COUNT(*) AS count FROM public.chatbot_categories;");
    const catCount = parseInt(catCheck?.rows?.[0]?.count || 0, 10);
    const categoryMap = new Map();

    if (catCount === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        const res = await db.query(
          `INSERT INTO public.chatbot_categories (slug, name_en, name_tl, description, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en
           RETURNING category_id, slug;`,
          [cat.slug, cat.name_en, cat.name_tl, cat.description, cat.sort_order, true]
        );
        if (res?.rows?.[0]) {
          categoryMap.set(res.rows[0].slug, res.rows[0].category_id);
        }
      }
      console.log(`[chatbotSchema] Seeded ${categoryMap.size} initial categories.`);
    } else {
      const existing = await db.query("SELECT category_id, slug FROM public.chatbot_categories;");
      existing?.rows?.forEach((r) => categoryMap.set(r.slug, r.category_id));
    }

    // 2. Seed FAQs if table is empty
    const faqCheck = await db.query("SELECT COUNT(*) AS count FROM public.chatbot_faqs;");
    const faqCount = parseInt(faqCheck?.rows?.[0]?.count || 0, 10);

    if (faqCount === 0) {
      for (const faq of DEFAULT_FAQS) {
        const catId = categoryMap.get(faq.category_slug) || null;
        await db.query(
          `INSERT INTO public.chatbot_faqs 
           (category_id, question_en, question_tl, alt_questions, keywords, answer_en, answer_tl, is_active)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, TRUE);`,
          [
            catId,
            faq.question_en,
            faq.question_tl,
            JSON.stringify(faq.alt_questions || []),
            faq.keywords || [],
            faq.answer_en,
            faq.answer_tl,
          ]
        );
      }
      console.log(`[chatbotSchema] Seeded ${DEFAULT_FAQS.length} initial verified FAQs.`);
    }

    // 3. Seed Default Settings if not present
    const settingsCheck = await db.query("SELECT COUNT(*) AS count FROM public.chatbot_settings;");
    const settingsCount = parseInt(settingsCheck?.rows?.[0]?.count || 0, 10);

    if (settingsCount === 0) {
      const entries = [
        ["general", {
          min_match_threshold: DEFAULT_SETTINGS.min_match_threshold,
          ambiguity_delta: DEFAULT_SETTINGS.ambiguity_delta,
          max_suggestions: DEFAULT_SETTINGS.max_suggestions,
          debounce_ms: DEFAULT_SETTINGS.debounce_ms,
          messenger_url: DEFAULT_SETTINGS.messenger_url,
          social_links: DEFAULT_SETTINGS.social_links,
        }],
        ["messages", DEFAULT_SETTINGS.messages],
      ];

      for (const [key, value] of entries) {
        await db.query(
          `INSERT INTO public.chatbot_settings (setting_key, setting_value, updated_at)
           VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
           ON CONFLICT (setting_key) DO NOTHING;`,
          [key, JSON.stringify(value)]
        );
      }
      console.log("[chatbotSchema] Seeded default chatbot settings.");
    }
  } catch (err) {
    console.warn("[chatbotSchema] Seed warning:", err.message);
  }
}

function ensureChatbotSchema() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    if (db.isMockActive) {
      console.log("[chatbotSchema] Mock active; skipping PostgreSQL DDL.");
      return true;
    }

    // Apply to both pools
    await applyToPool(db.supabasePool, "supabase");
    await applyToPool(db.neonPool, "neon");

    // Single pool fallback if pools are not directly assigned
    if (!db.supabasePool && !db.neonPool) {
      for (const sql of CHATBOT_TABLE_DDL) {
        try {
          await db.query(sql);
        } catch (e) {
          console.warn("[chatbotSchema] single pool notice:", e.message);
        }
      }
    }

    // Seed default rows
    await seedInitialData();

    return true;
  })().catch((err) => {
    console.warn("[chatbotSchema] ensure failed:", err.message);
    ensurePromise = null;
    return false;
  });

  return ensurePromise;
}

module.exports = {
  ensureChatbotSchema,
  CHATBOT_TABLE_DDL,
};
