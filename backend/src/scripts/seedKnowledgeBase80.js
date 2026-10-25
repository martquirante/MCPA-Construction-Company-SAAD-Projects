/**
 * MCPA Construction and Supply
 * Seed & Upsert Script: 80 Customer Support Frequently Asked Questions
 * 
 * Inserts or updates all 80 FAQs across 9 official categories into both
 * Supabase (Primary) and Neon (Hot Standby) PostgreSQL databases via dbFailoverEngine.
 */
require("../../../backend/node_modules/dotenv").config({ path: "./backend/.env" });
const db = require("../services/dbFailoverEngine");
const { OFFICIAL_CATEGORIES, FAQS_80 } = require("../services/knowledgeBase80Data");

async function seedDatabase() {
  console.log("==========================================================");
  console.log("MCPA Chatbot — 80 Knowledge Base FAQs Database Seeding");
  console.log("==========================================================");

  try {
    // 1. Ensure categories exist
    console.log("\n[Step 1/3] Ensuring all 9 categories exist in database...");
    const categoryMap = new Map();

    for (const cat of OFFICIAL_CATEGORIES) {
      const res = await db.query(
        `INSERT INTO public.chatbot_categories (slug, name_en, name_tl, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (slug) DO UPDATE 
         SET name_en = EXCLUDED.name_en,
             name_tl = EXCLUDED.name_tl,
             description = EXCLUDED.description,
             sort_order = EXCLUDED.sort_order,
             is_active = TRUE,
             updated_at = CURRENT_TIMESTAMP
         RETURNING category_id, slug;`,
        [cat.slug, cat.name_en, cat.name_tl, cat.description, cat.sort_order]
      );
      if (res?.rows?.[0]) {
        categoryMap.set(res.rows[0].slug, res.rows[0].category_id);
      }
    }

    // Also load any pre-existing categories for mapping
    const allCats = await db.query("SELECT category_id, slug FROM public.chatbot_categories;");
    allCats?.rows?.forEach((c) => categoryMap.set(c.slug, c.category_id));
    console.log(`✓ Loaded and verified ${categoryMap.size} categories.`);

    // 2. Insert or update all 80 FAQs
    console.log(`\n[Step 2/3] Upserting all ${FAQS_80.length} FAQs into public.chatbot_faqs...`);
    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of FAQS_80) {
      const catId = categoryMap.get(item.category_slug) || null;

      // Check if an FAQ with this primary question already exists
      const existing = await db.query(
        `SELECT faq_id FROM public.chatbot_faqs WHERE LOWER(TRIM(question_en)) = LOWER(TRIM($1));`,
        [item.question_en]
      );

      if (existing?.rows?.length > 0) {
        const existingFaqId = existing.rows[0].faq_id;
        await db.query(
          `UPDATE public.chatbot_faqs
           SET category_id = $2,
               question_tl = $3,
               alt_questions = $4::jsonb,
               keywords = $5,
               answer_en = $6,
               answer_tl = $7,
               is_active = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE faq_id = $1;`,
          [
            existingFaqId,
            catId,
            item.question_tl,
            JSON.stringify(item.alt_questions),
            item.keywords,
            item.answer_en,
            item.answer_tl,
          ]
        );
        updatedCount++;
      } else {
        await db.query(
          `INSERT INTO public.chatbot_faqs
           (category_id, question_en, question_tl, alt_questions, keywords, answer_en, answer_tl, is_active)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, TRUE);`,
          [
            catId,
            item.question_en,
            item.question_tl,
            JSON.stringify(item.alt_questions),
            item.keywords,
            item.answer_en,
            item.answer_tl,
          ]
        );
        insertedCount++;
      }
    }

    console.log(`✓ Successfully processed all FAQs: ${insertedCount} inserted, ${updatedCount} updated.`);

    // 3. Verification check
    console.log("\n[Step 3/3] Verifying database counts...");
    const verifyRes = await db.query("SELECT COUNT(*) AS total_faqs FROM public.chatbot_faqs WHERE is_active = TRUE;");
    const totalActive = verifyRes?.rows?.[0]?.total_faqs;
    console.log(`✓ Total Active FAQs in Database: ${totalActive}`);

    console.log("\n==========================================================");
    console.log(" Seeding completed successfully!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

seedDatabase();
