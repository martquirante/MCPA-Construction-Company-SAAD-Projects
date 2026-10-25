/**
 * Synchronize all chatbot_categories and chatbot_faqs from Supabase (Primary)
 * to Neon (Standby) so both databases are in 100% parity.
 */
require("../../../backend/node_modules/dotenv").config({ path: "./backend/.env" });
const db = require("../services/dbFailoverEngine");

async function syncToNeon() {
  console.log("Synchronizing chatbot data between Supabase and Neon...");

  if (!db.supabasePool || !db.neonPool) {
    console.log("Both pools must be active to sync.");
    process.exit(0);
  }

  try {
    // 1. Sync Categories by slug
    const sCats = await db.supabasePool.query("SELECT * FROM public.chatbot_categories ORDER BY category_id ASC;");
    for (const c of sCats.rows) {
      await db.neonPool.query(
        `INSERT INTO public.chatbot_categories (category_id, slug, name_en, name_tl, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE
         SET name_en = EXCLUDED.name_en,
             name_tl = EXCLUDED.name_tl,
             description = EXCLUDED.description,
             sort_order = EXCLUDED.sort_order,
             is_active = EXCLUDED.is_active;`,
        [c.category_id, c.slug, c.name_en, c.name_tl, c.description, c.sort_order, c.is_active]
      );
    }
    console.log(`✓ Synchronized ${sCats.rows.length} categories to Neon.`);

    // Map Neon category slugs to category_ids
    const nCats = await db.neonPool.query("SELECT category_id, slug FROM public.chatbot_categories;");
    const nCatMap = new Map();
    nCats.rows.forEach((r) => nCatMap.set(r.slug, r.category_id));

    // Map Supabase category_ids to slugs
    const sCatSlugMap = new Map();
    sCats.rows.forEach((r) => sCatSlugMap.set(r.category_id, r.slug));

    // 2. Sync all FAQs from Supabase to Neon
    const sFaqs = await db.supabasePool.query("SELECT * FROM public.chatbot_faqs ORDER BY faq_id ASC;");
    let neonFaqSynced = 0;

    for (const f of sFaqs.rows) {
      const slug = sCatSlugMap.get(f.category_id);
      const neonCatId = slug ? nCatMap.get(slug) : null;

      const nExisting = await db.neonPool.query(
        "SELECT faq_id FROM public.chatbot_faqs WHERE LOWER(TRIM(question_en)) = LOWER(TRIM($1));",
        [f.question_en]
      );

      if (nExisting?.rows?.length > 0) {
        await db.neonPool.query(
          `UPDATE public.chatbot_faqs
           SET category_id = $2,
               question_tl = $3,
               alt_questions = $4::jsonb,
               keywords = $5,
               answer_en = $6,
               answer_tl = $7,
               is_active = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE faq_id = $1;`,
          [
            nExisting.rows[0].faq_id,
            neonCatId,
            f.question_tl,
            JSON.stringify(f.alt_questions || []),
            f.keywords || [],
            f.answer_en,
            f.answer_tl,
            f.is_active,
          ]
        );
      } else {
        await db.neonPool.query(
          `INSERT INTO public.chatbot_faqs
           (category_id, question_en, question_tl, alt_questions, keywords, answer_en, answer_tl, is_active)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8);`,
          [
            neonCatId,
            f.question_en,
            f.question_tl,
            JSON.stringify(f.alt_questions || []),
            f.keywords || [],
            f.answer_en,
            f.answer_tl,
            f.is_active,
          ]
        );
      }
      neonFaqSynced++;
    }

    console.log(`✓ Synchronized ${neonFaqSynced} FAQs to Neon.`);

    // 3. Final count checks
    const sCount = await db.supabasePool.query("SELECT count(*) FROM public.chatbot_faqs WHERE is_active = TRUE;");
    const nCount = await db.neonPool.query("SELECT count(*) FROM public.chatbot_faqs WHERE is_active = TRUE;");
    console.log(`Supabase Active FAQs: ${sCount.rows[0].count}`);
    console.log(`Neon Active FAQs:     ${nCount.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error("Sync error:", err);
    process.exit(1);
  }
}

syncToNeon();
