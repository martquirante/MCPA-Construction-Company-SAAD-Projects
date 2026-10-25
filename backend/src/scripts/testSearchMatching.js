require("../../../backend/node_modules/dotenv").config({ path: "./backend/.env" });
const db = require("../services/dbFailoverEngine");
const searchService = require("../services/chatbotSearchService");

async function testMatching() {
  const res = await db.query(`
    SELECT f.*, c.slug as category_slug
    FROM public.chatbot_faqs f
    LEFT JOIN public.chatbot_categories c ON f.category_id = c.category_id
    WHERE f.is_active = TRUE;
  `);

  console.log(`Active FAQs retrieved from DB: ${res.rows.length}`);

  const testQueries = [
    "What is MCPA Construction and Supply?",
    "Paano ako makikipag-ugnayan sa inyo?",
    "How much does it cost to build a house?",
    "Magkano per sqm ang pagpapatayo ng bahay?",
    "What is a Change Order?",
    "Is MCPA licensed and insured?",
    "Can I pay in installments?",
    "Gaano katagal magtayo ng bahay?",
    "Where is MCPA located?",
    "Can I choose my own construction materials?",
    "Do you offer design-and-build services?",
    "What happens during project turnover?",
  ];

  for (const q of testQueries) {
    const match = searchService.matchQuestion(q, res.rows);
    if (match.matched) {
      console.log(`✓ Q: "${q}"\n   -> [FAQ ID ${match.faqId}] ${match.question}\n   -> Answer: ${match.answer.slice(0, 100)}...\n`);
    } else if (match.ambiguous) {
      console.log(`? Q: "${q}" -> AMBIGUOUS (Options: ${match.clarifyingOptions?.map(o => o.question).join(" | ")})\n`);
    } else {
      console.log(`✗ Q: "${q}" -> NOT MATCHED (Score: ${match.topScore || 0}, Reason: ${match.reason})\n`);
    }
  }

  process.exit(0);
}

testMatching().catch((e) => {
  console.error(e);
  process.exit(1);
});
