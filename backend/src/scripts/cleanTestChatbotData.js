require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function cleanTestData() {
  console.log("=================================================");
  console.log("   MCPA CHATBOT — PURGING AUTOMATED TEST DATA    ");
  console.log("=================================================");

  // 1. Delete automated test unanswered questions
  const delUnanswered = await db.query(
    "DELETE FROM public.chatbot_unanswered_questions WHERE original_question ILIKE '%quantum entanglement%' RETURNING unanswered_id;"
  );
  console.log(`[OK] Deleted test unanswered questions: ${delUnanswered.rowCount}`);

  // 2. Delete automated test conversations (messages & feedback cascade automatically)
  const delConvs = await db.query(
    "DELETE FROM public.chatbot_conversations WHERE customer_name IN ('Architect Juan Test', 'Curious Client') RETURNING conversation_id;"
  );
  console.log(`[OK] Deleted test conversations: ${delConvs.rowCount}`);

  // 3. Inspect remaining
  const remainingConvs = await db.query(
    "SELECT conversation_id, customer_name, customer_email, status, created_at FROM public.chatbot_conversations ORDER BY created_at DESC;"
  );
  console.log(`\nRemaining Conversations (${remainingConvs.rowCount}):`);
  console.table(remainingConvs.rows);

  const remainingUnanswered = await db.query(
    "SELECT unanswered_id, original_question, resolution_status, created_at FROM public.chatbot_unanswered_questions ORDER BY created_at DESC;"
  );
  console.log(`\nRemaining Unanswered Questions (${remainingUnanswered.rowCount}):`);
  console.table(remainingUnanswered.rows);

  console.log("\n[SUCCESS] Test data purge completed cleanly.");
  process.exit(0);
}

cleanTestData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
