require("dotenv").config();
const { Pool } = require("pg");
const { DEFAULT_FAQS } = require("../services/chatbotSeedData");

async function updateFaqSpacing() {
  const supaConn =
    process.env.SUPABASE_CONNECTION_STRING ||
    (process.env.SUPABASE_DB_PASSWORD
      ? `postgresql://postgres.dzqqyqothtttccplvvnb:${encodeURIComponent(
          process.env.SUPABASE_DB_PASSWORD
        )}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
      : null);
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;

  const databases = [
    { name: "Primary Database (Supabase)", conn: supaConn },
    { name: "Cloud Hot Standby (Neon)", conn: neonConn },
  ];

  for (const { name: dbName, conn } of databases) {
    if (!conn) {
      console.log(`[SKIP] No connection string found for ${dbName}`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`>>> Updating FAQ answers in ${dbName}...`);
    console.log(`========================================`);

    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

    try {
      let updatedCount = 0;
      for (const faq of DEFAULT_FAQS) {
        const res = await pool.query(
          `UPDATE public.chatbot_faqs 
           SET answer_en = $1, answer_tl = $2, updated_at = CURRENT_TIMESTAMP
           WHERE question_en = $3
           RETURNING faq_id, question_en;`,
          [faq.answer_en, faq.answer_tl, faq.question_en]
        );

        if (res.rowCount > 0) {
          updatedCount++;
          console.log(`[${dbName}] Updated FAQ #${res.rows[0].faq_id}: "${res.rows[0].question_en}"`);
        }
      }

      console.log(`[${dbName}] Successfully updated ${updatedCount} FAQs with spaced formatting.`);
    } catch (err) {
      console.error(`[${dbName}] Error updating FAQs:`, err.message);
    } finally {
      await pool.end();
    }
  }

  console.log("\nAll database FAQ spacing updates completed successfully.");
}

updateFaqSpacing();
