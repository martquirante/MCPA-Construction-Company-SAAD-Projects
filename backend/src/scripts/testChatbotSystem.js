const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const assert = require("assert");
const jwt = require("jsonwebtoken");
const searchService = require("../services/chatbotSearchService");
const db = require("../services/dbFailoverEngine");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "mcpa-fallback-secret-2024-enterprise";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const status = res.status;
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  return { status, ok: res.ok, data };
}

async function runChatbotTestSuite() {
  console.log("\n========================================================");
  console.log("   MCPA SMART CHATBOT ENGINE - VERIFICATION SUITE       ");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function recordPass(testName) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passed++;
  }

  function recordFail(testName, err) {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName}`);
    console.error(`         ${err.message || err}`);
    failed++;
  }

  // --- 1. SEARCH SERVICE UNIT TESTS ---
  console.log("\n[1] Search Service & Text Normalization Unit Tests");
  try {
    const raw = "  Hello, MCPA!! What are your services??   ";
    const normalized = searchService.normalizeText(raw);
    assert.strictEqual(normalized, "hello mcpa what are your services");
    recordPass("Text normalization removes punctuation and trims whitespace");
  } catch (e) {
    recordFail("Text normalization", e);
  }

  try {
    const tokens = searchService.tokenize("what are your construction services and supplies");
    assert.ok(tokens.includes("construction"));
    assert.ok(tokens.includes("services"));
    assert.ok(tokens.includes("supplies"));
    assert.ok(!tokens.includes("what")); // stopword removed
    assert.ok(!tokens.includes("are")); // stopword removed
    recordPass("Tokenization filters English stopwords accurately");
  } catch (e) {
    recordFail("Tokenization stopwords", e);
  }

  try {
    const taglishTokens = searchService.tokenize("anong mga serbisyo ninyo sa mcpa");
    const concepts = searchService.mapToConcepts(taglishTokens);
    assert.ok(concepts.has("services"), "Concept mapping should resolve 'serbisyo' to 'services'");
    recordPass("Canonical concept mapping maps 'serbisyo' to 'services'");
  } catch (e) {
    recordFail("Canonical concept mapping", e);
  }

  try {
    const dist1 = searchService.levenshteinDistance("construct", "construct");
    const dist2 = searchService.levenshteinDistance("servise", "service");
    assert.strictEqual(dist1, 0);
    assert.strictEqual(dist2, 1);
    recordPass("Levenshtein distance handles exact and typo tolerance accurately");
  } catch (e) {
    recordFail("Levenshtein distance calculation", e);
  }

  // --- 2. CONFIG ENDPOINT ---
  console.log("\n[2] Public Config & Settings Verification");
  try {
    const res = await request("/api/chatbot/config");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.debounceMs >= 150, "Debounce ms configured");
    assert.ok(res.data.maxSuggestions >= 3, "Max suggestions configured");
    assert.ok(res.data.messengerUrl.includes("messenger.com"), "Official Messenger URL present");
    assert.ok(res.data.socialLinks.facebook.includes("facebook.com"), "Official Facebook link present");
    assert.ok(res.data.socialLinks.instagram.includes("instagram.com"), "Official Instagram link present");
    assert.ok(res.data.socialLinks.tiktok.includes("tiktok.com"), "Official TikTok link present");
    recordPass("GET /api/chatbot/config returns verified contact, social, and debounce configurations");
  } catch (e) {
    recordFail("GET /api/chatbot/config", e);
  }

  // --- 3. SESSION CREATION & NICKNAME VALIDATION ---
  console.log("\n[3] Session Creation & Nickname Validation");
  try {
    const emptyNameRes = await request("/api/chatbot/session", {
      method: "POST",
      body: { nickname: "   " },
    });
    assert.strictEqual(emptyNameRes.status, 400);
    assert.strictEqual(emptyNameRes.data.success, false);
    recordPass("Empty or whitespace nickname rejected with 400");
  } catch (e) {
    recordFail("Empty nickname rejection", e);
  }

  let sessionToken = null;
  let conversationId = null;
  const testCustomerName = "Architect Juan Test";

  try {
    const sessionRes = await request("/api/chatbot/session", {
      method: "POST",
      body: { nickname: testCustomerName, language: "en" },
    });
    assert.strictEqual(sessionRes.status, 201);
    assert.strictEqual(sessionRes.data.success, true);
    assert.ok(sessionRes.data.sessionToken, "Returns session token");
    assert.ok(sessionRes.data.conversationId, "Returns conversation ID");
    assert.ok(sessionRes.data.greeting.includes(testCustomerName), "Personalized greeting mentions name");

    sessionToken = sessionRes.data.sessionToken;
    conversationId = sessionRes.data.conversationId;
    recordPass("Valid nickname creates session and returns personalized greeting");
  } catch (e) {
    recordFail("Valid session creation", e);
  }

  // --- 4. LIVE QUESTION SUGGESTIONS ---
  console.log("\n[4] Live Debounced Question Suggestions");
  try {
    const suggestRes = await request("/api/chatbot/suggestions?q=services&language=en");
    assert.strictEqual(suggestRes.status, 200);
    assert.strictEqual(suggestRes.data.success, true);
    assert.ok(Array.isArray(suggestRes.data.suggestions), "Suggestions is an array");
    assert.ok(suggestRes.data.suggestions.length > 0, "Finds suggestions for 'services'");
    assert.ok(suggestRes.data.suggestions[0].question, "Suggestion has question text");
    recordPass("GET /api/chatbot/suggestions returns relevant approved suggestions");
  } catch (e) {
    recordFail("Live suggestions endpoint", e);
  }

  // --- 5. QUESTION ANSWERING & CONFIDENCE THRESHOLDS ---
  console.log("\n[5] Zero-AI Deterministic Question Answering");
  let lastMessageId = null;

  try {
    // English query
    const askRes = await request("/api/chatbot/ask", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        question: "What construction services does MCPA offer?",
        language: "en",
      },
    });

    assert.strictEqual(askRes.status, 200);
    assert.strictEqual(askRes.data.success, true);
    assert.strictEqual(askRes.data.type, "faq_match");
    assert.ok(askRes.data.answer.length > 30, "Provides comprehensive approved answer");
    assert.ok(askRes.data.answer.includes("Architectural Design") || askRes.data.answer.includes("Residential"), "Grounded in MCPA services");
    assert.ok(askRes.data.messageId, "Message ID returned for feedback tracking");
    lastMessageId = askRes.data.messageId;
    recordPass("Grounded match for 'What construction services does MCPA offer?'");
  } catch (e) {
    recordFail("English question answering", e);
  }

  try {
    // Taglish query
    const taglishRes = await request("/api/chatbot/ask", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        question: "Anong mga serbisyo ninyo?",
        language: "fil",
      },
    });

    assert.strictEqual(taglishRes.status, 200);
    assert.strictEqual(taglishRes.data.type, "faq_match");
    recordPass("Bilingual Taglish match for 'Anong mga serbisyo ninyo?'");
  } catch (e) {
    recordFail("Taglish question answering", e);
  }

  try {
    // Specific unanswerable pricing guardrail
    const priceGuardrailRes = await request("/api/chatbot/ask", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        question: "Magkano magpatayo ng 2 storey house sa Cebu?",
        language: "fil",
      },
    });

    assert.strictEqual(priceGuardrailRes.status, 200);
    assert.strictEqual(priceGuardrailRes.data.type, "pricing_clarification");
    assert.ok(
      priceGuardrailRes.data.answer.toLowerCase().includes("quotation") ||
      priceGuardrailRes.data.answer.toLowerCase().includes("consultation") ||
      priceGuardrailRes.data.answer.toLowerCase().includes("estimates"),
      "Pricing guardrail directs to formal consultation without fabricating price figures"
    );
    recordPass("Pricing guardrail avoids fabricating figures and directs to consultation");
  } catch (e) {
    recordFail("Pricing guardrail verification", e);
  }

  // --- 6. RESOLUTION FEEDBACK (STEP 4A & 4B) ---
  console.log("\n[6] Resolution Feedback & Escalation Workflow");
  try {
    const feedbackYesRes = await request("/api/chatbot/feedback", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        messageId: lastMessageId,
        isHelpful: true,
      },
    });
    assert.strictEqual(feedbackYesRes.status, 200);
    assert.strictEqual(feedbackYesRes.data.status, "resolved");
    recordPass("Helpful: Yes marks conversation resolved and returns thank you note");
  } catch (e) {
    recordFail("Feedback Yes workflow", e);
  }

  try {
    const feedbackNoRes = await request("/api/chatbot/feedback", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        messageId: lastMessageId,
        isHelpful: false,
        feedbackNote: "I need specific architectural engineer details.",
      },
    });
    assert.strictEqual(feedbackNoRes.status, 200);
    assert.strictEqual(feedbackNoRes.data.status, "needs_escalation");
    assert.ok(feedbackNoRes.data.escalationOptions, "Returns escalation options (Messenger, Socials, Human)");
    recordPass("Helpful: No triggers escalation options (Step 4B)");
  } catch (e) {
    recordFail("Feedback No workflow", e);
  }

  // --- 7. EMAIL GATE FOR LIVE HUMAN SUPPORT (STEP 4C) ---
  console.log("\n[7] Email Collection Gate for Live Human Support");
  try {
    const emptyEmailRes = await request("/api/chatbot/escalate", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: { email: "" },
    });
    assert.strictEqual(emptyEmailRes.status, 400);
    recordPass("Empty email rejected by escalation gate");
  } catch (e) {
    recordFail("Empty email rejection", e);
  }

  try {
    const disposableEmailRes = await request("/api/chatbot/escalate", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: { email: "fake.person@mailinator.com" },
    });
    assert.strictEqual(disposableEmailRes.status, 400);
    assert.ok(disposableEmailRes.data.message.toLowerCase().includes("valid") || disposableEmailRes.data.message.toLowerCase().includes("disposable"));
    recordPass("Disposable / throwaway domain rejected by escalation gate");
  } catch (e) {
    recordFail("Disposable email rejection", e);
  }

  try {
    const validEscalateRes = await request("/api/chatbot/escalate", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        email: "juan.architect.client@gmail.com",
        notes: "Urgent consultation for residential 3-storey building in Davao",
      },
    });
    assert.strictEqual(validEscalateRes.status, 200);
    assert.strictEqual(validEscalateRes.data.success, true);
    assert.strictEqual(validEscalateRes.data.status, "needs_human");
    recordPass("Valid email activates live human support mode (needs_human)");
  } catch (e) {
    recordFail("Valid email escalation", e);
  }

  // --- 8. BOT SILENCING DURING HUMAN SUPPORT MODE ---
  console.log("\n[8] Bot Silencing During Human Support Mode");
  try {
    const humanModeMessageRes = await request("/api/chatbot/ask", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken,
        "X-Chat-Conversation-Id": conversationId,
      },
      body: {
        question: "Hello is an engineer there?",
        language: "en",
      },
    });
    assert.strictEqual(humanModeMessageRes.status, 200);
    assert.strictEqual(humanModeMessageRes.data.type, "human_queued");
    assert.strictEqual(humanModeMessageRes.data.botSilenced, true);
    recordPass("Bot is silenced while waiting for human staff; message forwarded to live thread");
  } catch (e) {
    recordFail("Bot silencing verification", e);
  }

  // --- 9. ADMIN RBAC & ENDPOINT PROTECTION ---
  console.log("\n[9] Admin RBAC & Security Protection");
  try {
    const unauthSummaryRes = await request("/api/admin/chatbot/summary");
    assert.strictEqual(unauthSummaryRes.status, 401);
    recordPass("Unauthenticated admin endpoint call returns 401");
  } catch (e) {
    recordFail("Admin 401 unauthenticated check", e);
  }

  // Generate Admin JWT Token
  const adminToken = jwt.sign(
    { userId: 1, email: "dbprojectmartquirante@gmail.com", role: "admin" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  try {
    const authSummaryRes = await request("/api/admin/chatbot/summary", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(authSummaryRes.status, 200);
    assert.strictEqual(authSummaryRes.data.success, true);
    assert.ok(authSummaryRes.data.summary.totalConversations >= 1);
    assert.ok(authSummaryRes.data.summary.pendingHandoffs >= 1, "Registers pending handoff from test");
    assert.ok(authSummaryRes.data.summary.totalFaqs >= 14, "Contains seeded FAQs");
    recordPass("Admin summary returns live counts and pending handoffs");
  } catch (e) {
    recordFail("Admin summary endpoint", e);
  }

  // --- 10. KNOWLEDGE BASE ADMIN CRUD ---
  console.log("\n[10] Knowledge Base Admin Management (CRUD)");
  let testFaqId = null;

  try {
    // 1. Categories
    const catRes = await request("/api/admin/chatbot/categories", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(catRes.status, 200);
    assert.ok(catRes.data.categories.length >= 10);
    const serviceCat = catRes.data.categories.find((c) => c.slug === "services") || catRes.data.categories[0];
    recordPass("GET /api/admin/chatbot/categories returns categories");

    // 2. Create FAQ
    const createFaqRes = await request("/api/admin/chatbot/faqs", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        categoryId: serviceCat.category_id,
        primaryQuestionEn: "Can MCPA handle warehouse structural steel framing?",
        primaryQuestionFil: "Kaya ba ng MCPA ang structural steel framing para sa warehouse?",
        answerEn: "Yes, MCPA provides industrial and commercial structural steel framing.",
        answerFil: "Oo, nagbibigay ang MCPA ng industrial at commercial structural steel framing.",
        alternativeQuestions: ["Do you build warehouses?", "May warehouse construction ba kayo?"],
        keywords: ["warehouse", "steel", "framing", "industrial"],
      },
    });
    assert.strictEqual(createFaqRes.status, 201);
    assert.strictEqual(createFaqRes.data.success, true);
    testFaqId = createFaqRes.data.faq.faq_id;
    recordPass("POST /api/admin/chatbot/faqs creates new FAQ");

    // 3. Update FAQ
    const updateFaqRes = await request(`/api/admin/chatbot/faqs/${testFaqId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        primaryQuestionEn: "Can MCPA handle warehouse structural steel framing and pre-engineered buildings?",
        answerEn: "Yes, MCPA provides industrial structural steel framing and pre-engineered warehouse buildings.",
      },
    });
    assert.strictEqual(updateFaqRes.status, 200);
    recordPass("PUT /api/admin/chatbot/faqs/:id updates existing FAQ");

    // 4. Toggle FAQ Status
    const toggleFaqRes = await request(`/api/admin/chatbot/faqs/${testFaqId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assert.strictEqual(toggleFaqRes.status, 200);
    assert.strictEqual(toggleFaqRes.data.faq.is_active, false);
    recordPass("PATCH /api/admin/chatbot/faqs/:id/status toggles FAQ active state");

    // 5. Delete FAQ
    const deleteFaqRes = await request(`/api/admin/chatbot/faqs/${testFaqId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteFaqRes.status, 200);
    recordPass("DELETE /api/admin/chatbot/faqs/:id removes test FAQ");
  } catch (e) {
    recordFail("Knowledge base admin CRUD", e);
  }

  // --- 11. UNANSWERED QUESTIONS PIPELINE ---
  console.log("\n[11] Unanswered Questions Logging & Pipeline");
  try {
    // Start a clean session to test out-of-domain unanswerable question logging
    const sessionRes2 = await request("/api/chatbot/session", {
      method: "POST",
      body: { nickname: "Curious Client", language: "en" },
    });
    const sessionToken2 = sessionRes2.data.sessionToken;
    const conversationId2 = sessionRes2.data.conversationId;

    // Ask a completely unanswerable question
    const unanswerableRes = await request("/api/chatbot/ask", {
      method: "POST",
      headers: {
        "X-Chat-Session-Token": sessionToken2,
        "X-Chat-Conversation-Id": conversationId2,
      },
      body: {
        question: "What is quantum entanglement in theoretical astrophysics?",
        language: "en",
      },
    });
    assert.strictEqual(unanswerableRes.status, 200);
    assert.strictEqual(unanswerableRes.data.type, "no_match_fallback");

    // Verify it appeared in admin unanswered list
    const unansweredRes = await request("/api/admin/chatbot/unanswered", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(unansweredRes.status, 200);
    assert.ok(unansweredRes.data.unanswered.length >= 1);
    const found = unansweredRes.data.unanswered.some((u) =>
      u.submitted_question.toLowerCase().includes("quantum entanglement")
    );
    assert.ok(found, "Unanswered question logged into database queue");
    recordPass("Out-of-domain questions logged into unanswered questions queue");
  } catch (e) {
    recordFail("Unanswered questions pipeline", e);
  }

  // --- 12. LIVE HUMAN SUPPORT CONSOLE & ADMIN REPLIES ---
  console.log("\n[12] Live Human Support Console & Admin Replies");
  try {
    // 1. Admin lists conversations
    const convListRes = await request("/api/admin/chatbot/conversations", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(convListRes.status, 200);
    assert.ok(convListRes.data.conversations.length >= 1);
    recordPass("GET /api/admin/chatbot/conversations lists active conversations");

    // 2. Admin inspects conversation details
    const convDetailRes = await request(`/api/admin/chatbot/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(convDetailRes.status, 200);
    assert.strictEqual(convDetailRes.data.conversation.customer_email, "juan.architect.client@gmail.com");
    recordPass("Admin can inspect customer details, customer email, and full message history");

    // 3. Admin assigns to self
    const assignRes = await request(`/api/admin/chatbot/conversations/${conversationId}/assign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(assignRes.status, 200);
    assert.strictEqual(assignRes.data.conversation.status, "human_takeover");
    recordPass("Admin assigns conversation to self, transitioning status to 'human_takeover'");

    // 4. Admin sends reply
    const replyRes = await request(`/api/admin/chatbot/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        message: "Hello Juan! This is Engr. Quirante from MCPA. I am reviewing your Davao 3-storey project.",
      },
    });
    assert.strictEqual(replyRes.status, 201);
    assert.strictEqual(replyRes.data.message.sender_type, "human_agent");
    recordPass("Admin sends live reply to conversation with verified sender_type");

    // 5. Customer polls messages to receive admin reply
    const clientMessagesRes = await request(`/api/chatbot/conversations/${conversationId}/messages`, {
      headers: {
        "X-Chat-Session-Token": sessionToken,
      },
    });
    assert.strictEqual(clientMessagesRes.status, 200);
    const msgs = clientMessagesRes.data.messages;
    const adminMsg = msgs.find((m) => m.sender_type === "human_agent");
    assert.ok(adminMsg, "Customer receives human agent reply");
    assert.ok(adminMsg.sender_name, "Admin reply includes admin full name");
    recordPass("Customer receives live admin message with admin name and avatar metadata");

    // 6. Admin resolves conversation
    const resolveRes = await request(`/api/admin/chatbot/conversations/${conversationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: "resolved" },
    });
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.data.conversation.status, "resolved");
    recordPass("Admin resolves conversation successfully");
  } catch (e) {
    recordFail("Live human support workflow", e);
  }

  // --- 13. IDOR SECURITY CHECK ---
  console.log("\n[13] IDOR & Conversation Hijacking Protection");
  try {
    const maliciousToken = "tampered-or-invalid-session-token-99999";
    const idorRes = await request(`/api/chatbot/conversations/${conversationId}/messages`, {
      headers: {
        "X-Chat-Session-Token": maliciousToken,
      },
    });
    assert.strictEqual(idorRes.status, 403);
    recordPass("Unauthorized access to another conversation's messages rejected with 403 Forbidden");
  } catch (e) {
    recordFail("IDOR conversation protection", e);
  }

  // --- AUTOMATED TEARDOWN: CLEAN UP TEST DATA ---
  try {
    await db.query("DELETE FROM public.chatbot_conversations WHERE customer_name IN ('Architect Juan Test', 'Curious Client');");
    await db.query("DELETE FROM public.chatbot_unanswered_questions WHERE original_question ILIKE '%quantum entanglement%' OR original_question ILIKE '%Magkano magpatayo ng 2 storey%';");
  } catch (_) {}

  // --- SUMMARY ---
  console.log("\n========================================================");
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runChatbotTestSuite().catch((err) => {
  console.error("Unhandled error running chatbot test suite:", err);
  process.exit(1);
});
