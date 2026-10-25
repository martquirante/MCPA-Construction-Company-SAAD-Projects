/**
 * MCPA Construction and Supply — Smart Chatbot & Live Support Controller
 * 
 * Features:
 * - Deterministic Search & FAQ Answering (Zero external AI APIs)
 * - Session token authentication via constant-time SHA-256 verification
 * - Mandatory Customer Email validation before live admin handoff
 * - Real-time synchronization via realtimeService (WebSockets + SSE)
 * - RBAC protection for Knowledge Base, Unanswered Questions, and Live Inbox
 */

const crypto = require("crypto");
const db = require("../services/dbFailoverEngine");
const searchEngine = require("../services/chatbotSearchService");
const realtimeService = require("../services/realtimeService");
const { ensureChatbotSchema } = require("../services/chatbotSchema");
const { DEFAULT_SETTINGS } = require("../services/chatbotSeedData");

// Disposable email domains list to protect administrators against spam bots
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com",
  "guerrillamail.com", "yopmail.com", "trashmail.com", "sharklasers.com",
  "dispostable.com", "fakeinbox.com", "getnada.com", "mohmal.com",
  "throwawaymail.com", "burnermail.io", "crazymailing.com", "maildrop.cc",
  "inboxkitten.com", "temp-mail.io", "fakemailgenerator.com",
]);

// In-memory cache for active FAQs and settings (auto-invalidated on admin edits)
let faqsCache = null;
let faqsCacheExpiresAt = 0;
let settingsCache = null;
let settingsCacheExpiresAt = 0;

function invalidateCache() {
  faqsCache = null;
  faqsCacheExpiresAt = 0;
  settingsCache = null;
  settingsCacheExpiresAt = 0;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function timingSafeMatch(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hashA, "hex"), Buffer.from(hashB, "hex"));
}

class ChatbotController {
  constructor() {
    // Ensure schema is verified on controller mount
    ensureChatbotSchema().catch((err) => console.warn("[chatbotController] Schema check notice:", err.message));
  }

  /**
   * Helper to load cached or fresh settings
   */
  async getSettings() {
    const now = Date.now();
    if (settingsCache && settingsCacheExpiresAt > now) {
      return settingsCache;
    }

    try {
      const res = await db.query("SELECT setting_key, setting_value FROM public.chatbot_settings;");
      const map = {};
      res?.rows?.forEach((r) => {
        map[r.setting_key] = r.setting_value;
      });

      const merged = {
        min_match_threshold: map.general?.min_match_threshold ?? DEFAULT_SETTINGS.min_match_threshold,
        ambiguity_delta: map.general?.ambiguity_delta ?? DEFAULT_SETTINGS.ambiguity_delta,
        max_suggestions: map.general?.max_suggestions ?? DEFAULT_SETTINGS.max_suggestions,
        debounce_ms: map.general?.debounce_ms ?? DEFAULT_SETTINGS.debounce_ms,
        messenger_url: map.general?.messenger_url ?? DEFAULT_SETTINGS.messenger_url,
        social_links: map.general?.social_links ?? DEFAULT_SETTINGS.social_links,
        messages: map.messages ?? DEFAULT_SETTINGS.messages,
      };

      settingsCache = merged;
      settingsCacheExpiresAt = now + 60000; // cache for 1 minute
      return merged;
    } catch (err) {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Helper to load cached or fresh active FAQs
   */
  async getActiveFaqs() {
    const now = Date.now();
    if (faqsCache && faqsCacheExpiresAt > now) {
      return faqsCache;
    }

    try {
      const res = await db.query(`
        SELECT f.faq_id, f.category_id, f.question_en, f.question_tl, f.alt_questions,
               f.keywords, f.answer_en, f.answer_tl, f.is_active, c.slug as category_slug
        FROM public.chatbot_faqs f
        LEFT JOIN public.chatbot_categories c ON f.category_id = c.category_id
        WHERE f.is_active = TRUE
        ORDER BY f.faq_id ASC;
      `);
      faqsCache = res?.rows || [];
      faqsCacheExpiresAt = now + 60000;
      return faqsCache;
    } catch (err) {
      return [];
    }
  }

  /**
   * Helper to authenticate customer session token
   */
  async verifySession(conversationId, sessionToken) {
    if (!conversationId || !sessionToken) return null;
    try {
      const res = await db.query(
        `SELECT conversation_id, session_token_hash, customer_name, customer_email,
                language_pref, status, assigned_admin_id
         FROM public.chatbot_conversations
         WHERE conversation_id = $1;`,
        [conversationId]
      );
      const conv = res?.rows?.[0];
      if (!conv) return null;

      const incomingHash = hashToken(sessionToken);
      if (!timingSafeMatch(incomingHash, conv.session_token_hash)) {
        return null;
      }
      return conv;
    } catch (err) {
      return null;
    }
  }

  // ===========================================================================
  // PUBLIC CUSTOMER ENDPOINTS
  // ===========================================================================

  /**
   * GET /api/chatbot/config
   * Public non-sensitive configuration
   */
  async getConfig(req, res) {
    try {
      const settings = await this.getSettings();
      return res.json({
        success: true,
        debounceMs: settings.debounce_ms,
        maxSuggestions: settings.max_suggestions,
        messengerUrl: settings.messenger_url,
        socialLinks: settings.social_links,
        messages: settings.messages,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load chatbot configuration." });
    }
  }

  /**
   * POST /api/chatbot/session
   * Starts a new session or resumes existing one, enforcing nickname validation
   */
  async createSession(req, res) {
    try {
      const { customerName, nickname, customerEmail, email, language = "en", existingSessionToken } = req.body;
      const cleanEmail = (customerEmail || email || "").trim().toLowerCase() || null;

      // 1. Validate Customer Name / Nickname
      const cleanName = (customerName || nickname || "").trim();
      if (!cleanName || cleanName.length < 1 || cleanName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid nickname or name (1 to 50 characters).",
        });
      }

      // Reject control characters and HTML tags
      if (/[\x00-\x1F\x7F<>]/.test(cleanName)) {
        return res.status(400).json({
          success: false,
          message: "Nickname contains invalid characters.",
        });
      }

      const settings = await this.getSettings();
      const lang = language === "fil" ? "fil" : "en";
      const langMessages = settings.messages[lang] || settings.messages.en;

      // 2. If client email is provided (logged-in user with account), check for existing conversation to resume
      if (cleanEmail) {
        try {
          const existingConv = await db.query(
            `SELECT conversation_id, customer_name, customer_email, language_pref, status, assigned_admin_id
             FROM public.chatbot_conversations
             WHERE LOWER(customer_email) = $1
             ORDER BY last_message_at DESC LIMIT 1;`,
            [cleanEmail]
          );

          if (existingConv?.rows?.length > 0) {
            const row = existingConv.rows[0];
            const rawSessionToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = hashToken(rawSessionToken);

            await db.query(
              `UPDATE public.chatbot_conversations
               SET session_token_hash = $2, customer_name = $3, updated_at = CURRENT_TIMESTAMP
               WHERE conversation_id = $1;`,
              [row.conversation_id, tokenHash, cleanName]
            );

            const msgsRes = await db.query(
              `SELECT message_id, sender_type, message_text, metadata, created_at
               FROM public.chatbot_messages
               WHERE conversation_id = $1
               ORDER BY message_id ASC;`,
              [row.conversation_id]
            );

            let assignedAdmin = null;
            if (row.assigned_admin_id) {
              const adminRes = await db.query(
                `SELECT full_name, avatar_url FROM public.users WHERE user_id = $1;`,
                [row.assigned_admin_id]
              );
              if (adminRes?.rows?.[0]) {
                assignedAdmin = {
                  fullName: adminRes.rows[0].full_name,
                  avatarUrl: adminRes.rows[0].avatar_url,
                };
              }
            }

            return res.status(200).json({
              success: true,
              resumed: true,
              conversationId: row.conversation_id,
              sessionToken: rawSessionToken,
              customerName: cleanName,
              customerEmail: cleanEmail,
              status: row.status,
              assignedAdmin,
              language: row.language_pref || lang,
              messages: msgsRes?.rows || [],
            });
          }
        } catch (resumeErr) {
          console.warn("[chatbotController] Error checking existing conversation:", resumeErr);
        }
      }

      // Generate secure 32-byte session token
      const rawSessionToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawSessionToken);
      const conversationId = `conv_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

      const welcomeTemplate = langMessages.personalized_welcome || "Nice to meet you, {name}! How can I help you today?";
      const welcomeText = welcomeTemplate.replace("{name}", cleanName);

      // Create conversation row
      await db.query(
        `INSERT INTO public.chatbot_conversations 
         (conversation_id, session_token_hash, customer_name, customer_email, language_pref, status, last_message_preview, last_message_at)
         VALUES ($1, $2, $3, $4, $5, 'BOT_ACTIVE', $6, CURRENT_TIMESTAMP);`,
        [conversationId, tokenHash, cleanName, cleanEmail, lang, welcomeText]
      );

      // Insert initial welcome message
      const msgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, is_read, created_at)
         VALUES ($1, 'BOT', $2, TRUE, CURRENT_TIMESTAMP)
         RETURNING message_id, sender_type, message_text, metadata, created_at;`,
        [conversationId, welcomeText]
      );

      return res.status(201).json({
        success: true,
        conversationId,
        sessionToken: rawSessionToken,
        customerName: cleanName,
        customerEmail: cleanEmail,
        greeting: welcomeText,
        status: "BOT_ACTIVE",
        language: lang,
        messages: msgRes.rows || [],
      });
    } catch (err) {
      console.error("[chatbotController] createSession error:", err);
      return res.status(500).json({ success: false, message: "Unable to start chat session. Please try again." });
    }
  }

  /**
   * GET /api/chatbot/suggestions?q=...&lang=...
   * Debounced live search suggestions as customer types
   */
  async getSuggestions(req, res) {
    try {
      const query = (req.query.q || "").trim();
      const lang = req.query.lang === "fil" ? "fil" : "en";

      if (!query || query.length < 2) {
        return res.json({ success: true, suggestions: [] });
      }

      const settings = await this.getSettings();
      const faqs = await this.getActiveFaqs();
      const maxLimit = settings.max_suggestions || 5;

      const suggestions = searchEngine.getSuggestions(query, faqs, maxLimit, lang);
      return res.json({
        success: true,
        suggestions,
      });
    } catch (err) {
      return res.json({ success: true, suggestions: [] });
    }
  }

  /**
   * POST /api/chatbot/ask
   * Submits a customer question, returns approved answer or honest fallback
   */
  async askQuestion(req, res) {
    try {
      const conversationId = req.body.conversationId || req.headers["x-chat-conversation-id"];
      const sessionToken = req.headers["x-chat-session-token"] || req.body.sessionToken;
      const questionText = (req.body.question || "").trim();
      const uiLang = req.body.language === "fil" ? "fil" : "en";

      if (!questionText) {
        return res.status(400).json({ success: false, message: "Question cannot be empty." });
      }

      const conv = await this.verifySession(conversationId, sessionToken);
      if (!conv) {
        return res.status(401).json({ success: false, message: "Unauthorized or expired chat session." });
      }

      // Check if conversation is currently in human support mode
      const isHumanActive = ["AWAITING_HUMAN", "HUMAN_ASSIGNED", "HUMAN_ACTIVE"].includes(conv.status);
      if (isHumanActive) {
        // Human agent has taken over or is awaiting takeover; DO NOT let bot answer!
        const custMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, is_read, created_at)
           VALUES ($1, 'CUSTOMER', $2, FALSE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, metadata, created_at;`,
          [conversationId, questionText]
        );

        await db.query(
          `UPDATE public.chatbot_conversations
           SET unread_admin_count = unread_admin_count + 1,
               last_message_preview = $2,
               last_message_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId, questionText.slice(0, 150)]
        );

        const newMsg = custMsgRes.rows[0];

        // Notify admins in real time
        realtimeService.broadcast("CHATBOT_MESSAGE_NEW", {
          conversationId,
          customerName: conv.customer_name,
          message: newMsg,
        });

        return res.json({
          success: true,
          type: "human_queued",
          botSilenced: true,
          humanHandoffActive: true,
          status: conv.status,
          customerMessage: newMsg,
        });
      }

      // 1. Insert customer message
      // If conversation was resolved, reopen it to BOT_ACTIVE when customer asks a new question
      if (conv.status === "RESOLVED") {
        await db.query(
          `UPDATE public.chatbot_conversations
           SET status = 'BOT_ACTIVE', resolved_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId]
        );
      }

      const custMsgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, is_read, created_at)
         VALUES ($1, 'CUSTOMER', $2, TRUE, CURRENT_TIMESTAMP)
         RETURNING message_id, sender_type, message_text, metadata, created_at;`,
        [conversationId, questionText]
      );
      const customerMsg = custMsgRes.rows[0];
      const customerMessage = customerMsg;

      // 2. Run deterministic matching engine
      const settings = await this.getSettings();
      const faqs = await this.getActiveFaqs();
      const matchResult = searchEngine.matchQuestion(questionText, faqs, settings, uiLang);

      const langMessages = settings.messages[uiLang] || settings.messages.en;

      let botMessage = null;

      // Handle specific uncalculated pricing guardrails
      if (matchResult.reason === "UNANSWERABLE_SPECIFIC_QUOTE") {
        const pricingText = uiLang === "fil"
          ? "Ang kabuuang gastos sa pagpapatayo ay nakadepende sa floor area, architectural finishes, at structural requirements. Upang makapagbigay ng tumpak na halaga nang walang maling impormasyon, nag-aalok ang MCPA ng pormal na quotation at konsultasyon kasama ang aming mga lisensyadong arkitekto at inhinyero."
          : "Construction costs vary significantly based on lot condition, floor area, architectural finishes, and structural requirements. To provide accurate figures without misleading you, MCPA provides customized project consultations and formal quotations with our licensed architects and engineers.";

        const botMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, metadata, is_read, created_at)
           VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, metadata, created_at;`,
          [
            conversationId,
            pricingText,
            JSON.stringify({
              requiresFeedback: true,
              isPricingClarification: true,
              showEscalation: true,
            }),
          ]
        );
        botMessage = botMsgRes.rows[0];

        await db.query(
          `UPDATE public.chatbot_conversations
           SET last_message_preview = $2,
               last_message_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId, pricingText.slice(0, 150)]
        );

        return res.json({
          success: true,
          matched: true,
          type: "pricing_clarification",
          answer: pricingText,
          messageId: botMessage.message_id,
          customerMessage,
          botMessage,
          requiresFeedback: true,
          showEscalation: true,
        });
      }

      if (matchResult.matched) {
        // High-confidence approved answer found!
        const botMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, matched_faq_id, metadata, is_read, created_at)
           VALUES ($1, 'BOT', $2, $3, $4::jsonb, TRUE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, matched_faq_id, metadata, created_at;`,
          [
            conversationId,
            matchResult.answer,
            matchResult.faqId,
            JSON.stringify({
              requiresFeedback: true,
              faqId: matchResult.faqId,
              matchedQuestion: matchResult.question,
            }),
          ]
        );
        botMessage = botMsgRes.rows[0];

        // Increment FAQ match count
        await db.query("UPDATE public.chatbot_faqs SET match_count = match_count + 1 WHERE faq_id = $1;", [
          matchResult.faqId,
        ]);

        await db.query(
          `UPDATE public.chatbot_conversations
           SET last_message_preview = $2,
               last_message_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId, matchResult.answer.slice(0, 150)]
        );

        return res.json({
          success: true,
          matched: true,
          type: "faq_match",
          answer: matchResult.answer,
          question: matchResult.question,
          messageId: botMessage.message_id,
          customerMessage,
          botMessage,
          requiresFeedback: true,
          faqId: matchResult.faqId,
        });
      }

      if (matchResult.ambiguous) {
        // Multiple candidate questions found within ambiguity delta
        const clarifyText =
          uiLang === "fil"
            ? "Maaari mo bang linawin ang iyong tanong? Piliin ang pinakamalapit sa iyong nais malaman:"
            : "Could you clarify what you mean? Please select the question closest to your inquiry:";

        const botMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, metadata, is_read, created_at)
           VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, metadata, created_at;`,
          [
            conversationId,
            clarifyText,
            JSON.stringify({
              clarifyingOptions: matchResult.clarifyingOptions,
            }),
          ]
        );
        botMessage = botMsgRes.rows[0];

        return res.json({
          success: true,
          matched: false,
          type: "ambiguous",
          ambiguous: true,
          messageId: botMessage.message_id,
          customerMessage,
          botMessage,
          clarifyingOptions: matchResult.clarifyingOptions,
        });
      }

      // 3. Fallback: No reliable answer found (Step 4C)
      const fallbackTemplate =
        langMessages.unknown_fallback ||
        "Sorry, {name}. I couldn't find a reliable answer to that question in our current information. I don't want to give you incorrect details.";
      const fallbackText = fallbackTemplate.replace("{name}", conv.customer_name);

      const botMsgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, metadata, is_read, created_at)
         VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
         RETURNING message_id, sender_type, message_text, metadata, created_at;`,
        [
          conversationId,
          fallbackText,
          JSON.stringify({
            showEscalation: true,
            isFallback: true,
          }),
        ]
      );
      botMessage = botMsgRes.rows[0];

      // Auto-log into chatbot_unanswered_questions
      const parsed = searchEngine.parseQuery(questionText);
      await db.query(
        `INSERT INTO public.chatbot_unanswered_questions
         (conversation_id, customer_name, customer_email, original_question, normalized_question, detected_language, top_candidate_faq_id, top_score, answer_found, resolution_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, 'OPEN')
         ON CONFLICT DO NOTHING;`,
        [
          conversationId,
          conv.customer_name,
          conv.customer_email || null,
          questionText,
          parsed.normalized,
          matchResult.detectedLang || uiLang,
          matchResult.topCandidateFaqId || null,
          matchResult.topScore || 0,
        ]
      );

      await db.query(
        `UPDATE public.chatbot_conversations
         SET last_message_preview = $2,
             last_message_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, fallbackText.slice(0, 150)]
      );

      return res.json({
        success: true,
        matched: false,
        type: "no_match_fallback",
        answer: fallbackText,
        messageId: botMessage.message_id,
        fallback: true,
        showEscalation: true,
        customerMessage,
        botMessage,
      });
    } catch (err) {
      console.error("[chatbotController] askQuestion error:", err);
      return res.status(500).json({ success: false, message: "Error processing question." });
    }
  }

  /**
   * POST /api/chatbot/feedback
   * Records user feedback (Yes, that helps / No, I need more help)
   */
  async submitFeedback(req, res) {
    try {
      const conversationId = req.body.conversationId || req.headers["x-chat-conversation-id"];
      const sessionToken = req.headers["x-chat-session-token"] || req.body.sessionToken;
      const { messageId, faqId, isHelpful, language = "en" } = req.body;

      const conv = await this.verifySession(conversationId, sessionToken);
      if (!conv) {
        return res.status(403).json({ success: false, message: "Unauthorized session." });
      }

      // Record feedback
      await db.query(
        `INSERT INTO public.chatbot_feedback 
         (conversation_id, message_id, faq_id, is_helpful, customer_name)
         VALUES ($1, $2, $3, $4, $5);`,
        [conversationId, messageId || null, faqId || null, Boolean(isHelpful), conv.customer_name]
      );

      const settings = await this.getSettings();
      const lang = language === "fil" ? "fil" : "en";
      const langMessages = settings.messages[lang] || settings.messages.en;

      if (isHelpful) {
        // Step 4A: Positive Feedback -> Mark resolved & close interaction
        if (faqId) {
          await db.query("UPDATE public.chatbot_faqs SET helpful_count = helpful_count + 1 WHERE faq_id = $1;", [faqId]);
        }

        const closingTemplate =
          langMessages.resolved_closing ||
          "Glad I could help, {name}! Thank you for contacting MCPA Construction and Supply.";
        const closingText = closingTemplate.replace("{name}", conv.customer_name);

        const botMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, metadata, is_read, created_at)
           VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, metadata, created_at;`,
          [conversationId, closingText, JSON.stringify({ isResolved: true })]
        );

        await db.query(
          `UPDATE public.chatbot_conversations
           SET status = 'RESOLVED',
               resolved_at = CURRENT_TIMESTAMP,
               last_message_preview = $2,
               last_message_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId, closingText.slice(0, 150)]
        );

        return res.json({
          success: true,
          status: "resolved",
          conversationStatus: "RESOLVED",
          botMessage: botMsgRes.rows[0],
        });
      } else {
        // Step 4B: Negative Feedback -> Increment not_helpful_count and display escalation options
        if (faqId) {
          await db.query("UPDATE public.chatbot_faqs SET not_helpful_count = not_helpful_count + 1 WHERE faq_id = $1;", [faqId]);
        }

        const escalationTemplate =
          langMessages.escalation_intro ||
          "No problem, {name}. Let me help you connect with the MCPA team so you can get the information you need.";
        const escalationText = escalationTemplate.replace("{name}", conv.customer_name);

        const botMsgRes = await db.query(
          `INSERT INTO public.chatbot_messages
           (conversation_id, sender_type, message_text, metadata, is_read, created_at)
           VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
           RETURNING message_id, sender_type, message_text, metadata, created_at;`,
          [conversationId, escalationText, JSON.stringify({ showEscalation: true })]
        );

        await db.query(
          `UPDATE public.chatbot_conversations
           SET last_message_preview = $2,
               last_message_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1;`,
          [conversationId, escalationText.slice(0, 150)]
        );

        return res.json({
          success: true,
          status: "needs_escalation",
          showEscalation: true,
          escalationOptions: {
            messengerUrl: settings.messenger_url,
            socialLinks: settings.social_links,
            canContinueToHuman: true,
          },
          botMessage: botMsgRes.rows[0],
        });
      }
    } catch (err) {
      console.error("[chatbotController] submitFeedback error:", err);
      return res.status(500).json({ success: false, message: "Failed to record feedback." });
    }
  }

  /**
   * POST /api/chatbot/escalate
   * Mandatory Email Gate: Validates customer email before triggering human handoff
   */
  async requestHumanSupport(req, res) {
    try {
      const conversationId = req.body.conversationId || req.headers["x-chat-conversation-id"];
      const customerEmail = req.body.customerEmail || req.body.email;
      const sessionToken = req.headers["x-chat-session-token"] || req.body.sessionToken;
      const { language = "en" } = req.body;

      const conv = await this.verifySession(conversationId, sessionToken);
      if (!conv) {
        return res.status(403).json({ success: false, message: "Unauthorized session." });
      }

      // MANDATORY EMAIL VALIDATION - check body or existing conversation email
      let rawEmail = (customerEmail || "").trim().toLowerCase();
      if (!rawEmail && conv.customer_email) {
        rawEmail = conv.customer_email.trim().toLowerCase();
      }
      if (!rawEmail) {
        return res.status(400).json({
          success: false,
          message: "Please enter your email address so our team can follow up with you.",
        });
      }

      // RFC-compliant email regex
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(rawEmail) || rawEmail.length > 254) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      // Check against disposable domain list
      const domain = rawEmail.split("@")[1];
      if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        return res.status(400).json({
          success: false,
          message: "Temporary or disposable email addresses are not permitted. Please use your active personal or work email.",
        });
      }

      const settings = await this.getSettings();
      const lang = language === "fil" ? "fil" : "en";
      const langMessages = settings.messages[lang] || settings.messages.en;

      const waitingTemplate =
        langMessages.human_waiting ||
        "Thank you, {name}. Your inquiry and email ({email}) have been received. An authorized MCPA administrator has been notified and will respond as soon as they are available.";
      const waitingText = waitingTemplate.replace("{name}", conv.customer_name).replace("{email}", rawEmail);

      // 1. Transition conversation status to AWAITING_HUMAN
      await db.query(
        `UPDATE public.chatbot_conversations
         SET customer_email = $2,
             status = 'AWAITING_HUMAN',
             handoff_requested_at = CURRENT_TIMESTAMP,
             unread_admin_count = unread_admin_count + 1,
             last_message_preview = $3,
             last_message_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, rawEmail, `Live Support Requested by ${conv.customer_name}`]
      );

      // 2. Insert system handoff record
      await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, is_read, created_at)
         VALUES ($1, 'SYSTEM', $2, TRUE, CURRENT_TIMESTAMP);`,
        [conversationId, `Customer requested live human support. Verified email: ${rawEmail}`]
      );

      // 3. Insert customer-facing waiting notice
      const botMsgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, metadata, is_read, created_at)
         VALUES ($1, 'BOT', $2, $3::jsonb, TRUE, CURRENT_TIMESTAMP)
         RETURNING message_id, sender_type, message_text, metadata, created_at;`,
        [conversationId, waitingText, JSON.stringify({ isAwaitingHuman: true })]
      );

      // 4. Update any linked unanswered question record with the provided email and flag
      await db.query(
        `UPDATE public.chatbot_unanswered_questions
         SET customer_email = $2,
             human_support_requested = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, rawEmail]
      );

      // 5. Broadcast real-time alert to online administrators
      realtimeService.broadcast("CHATBOT_HANDOFF_REQUESTED", {
        conversationId,
        customerName: conv.customer_name,
        customerEmail: rawEmail,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        status: "needs_human",
        conversationStatus: "AWAITING_HUMAN",
        customerEmail: rawEmail,
        botMessage: botMsgRes.rows[0],
      });
    } catch (err) {
      console.error("[chatbotController] requestHumanSupport error:", err);
      return res.status(500).json({ success: false, message: "Failed to initiate human support." });
    }
  }

  /**
   * GET /api/chatbot/conversations/:id/messages
   * Authorized fetch of conversation messages for the customer
   */
  async getConversationMessages(req, res) {
    try {
      const conversationId = req.params.id;
      const sessionToken = req.headers["x-chat-session-token"] || req.query.sessionToken;
      const afterId = parseInt(req.query.afterId || 0, 10);

      const conv = await this.verifySession(conversationId, sessionToken);
      if (!conv) {
        return res.status(403).json({ success: false, message: "Unauthorized or expired session." });
      }

      // Reset customer unread count
      await db.query(
        "UPDATE public.chatbot_conversations SET unread_customer_count = 0 WHERE conversation_id = $1;",
        [conversationId]
      );

      // Retrieve assigned administrator public profile if present
      let assignedAdmin = null;
      if (conv.assigned_admin_id) {
        const adminRes = await db.query(
          "SELECT full_name, avatar_url, role FROM public.users WHERE user_id = $1;",
          [conv.assigned_admin_id]
        );
        if (adminRes?.rows?.[0]) {
          assignedAdmin = {
            fullName: adminRes.rows[0].full_name,
            avatarUrl: adminRes.rows[0].avatar_url,
            role: adminRes.rows[0].role,
          };
        }
      }

      // Retrieve messages with sender user details
      const msgRes = await db.query(
        `SELECT m.message_id, m.conversation_id, m.sender_type, m.sender_id, m.message_text,
                m.matched_faq_id, m.metadata, m.is_read, m.created_at,
                u.full_name as sender_name, u.avatar_url as sender_avatar
         FROM public.chatbot_messages m
         LEFT JOIN public.users u ON m.sender_id = u.user_id
         WHERE m.conversation_id = $1 AND m.message_id > $2
         ORDER BY m.message_id ASC;`,
        [conversationId, afterId]
      );

      const messages = (msgRes?.rows || []).map((m) => {
        const isAgent = m.sender_type === "ADMIN" || m.sender_type === "human_agent";
        return {
          ...m,
          sender_type: isAgent ? "human_agent" : m.sender_type,
          sender_name: m.sender_name || (isAgent ? (assignedAdmin?.fullName || "MCPA Administrator") : null),
          sender_avatar: m.sender_avatar || (isAgent ? assignedAdmin?.avatarUrl : null),
        };
      });

      return res.json({
        success: true,
        status: conv.status,
        customerEmail: conv.customer_email,
        assignedAdmin,
        messages,
      });
    } catch (err) {
      console.error("[chatbotController] getConversationMessages error:", err);
      return res.status(500).json({ success: false, message: "Failed to retrieve conversation." });
    }
  }

  /**
   * POST /api/chatbot/conversations/:id/messages
   * Customer sending message during active human support
   */
  async sendCustomerSupportMessage(req, res) {
    try {
      const conversationId = req.params.id;
      const sessionToken = req.headers["x-chat-session-token"] || req.body.sessionToken;
      const messageText = (req.body.message || "").trim();

      if (!messageText) {
        return res.status(400).json({ success: false, message: "Message cannot be empty." });
      }

      const conv = await this.verifySession(conversationId, sessionToken);
      if (!conv) {
        return res.status(401).json({ success: false, message: "Unauthorized session." });
      }

      const msgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, message_text, is_read, created_at)
         VALUES ($1, 'CUSTOMER', $2, FALSE, CURRENT_TIMESTAMP)
         RETURNING message_id, conversation_id, sender_type, message_text, metadata, created_at;`,
        [conversationId, messageText]
      );

      await db.query(
        `UPDATE public.chatbot_conversations
         SET unread_admin_count = unread_admin_count + 1,
             last_message_preview = $2,
             last_message_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, messageText.slice(0, 150)]
      );

      const savedMsg = msgRes.rows[0];

      // Broadcast to admin dashboard
      realtimeService.broadcast("CHATBOT_MESSAGE_NEW", {
        conversationId,
        customerName: conv.customer_name,
        message: savedMsg,
      });

      return res.json({
        success: true,
        message: savedMsg,
      });
    } catch (err) {
      console.error("[chatbotController] sendCustomerSupportMessage error:", err);
      return res.status(500).json({ success: false, message: "Failed to deliver message." });
    }
  }

  // ===========================================================================
  // ADMIN DASHBOARD ENDPOINTS (RBAC PROTECTED)
  // ===========================================================================

  /**
   * GET /api/admin/chatbot/summary
   * Fast badge summary for admin navigation
   */
  async getAdminSummary(req, res) {
    try {
      const counts = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM public.chatbot_conversations) AS total_conversations,
          (SELECT COUNT(*) FROM public.chatbot_conversations WHERE status IN ('AWAITING_HUMAN', 'needs_human')) AS awaiting_human_count,
          (SELECT COALESCE(SUM(unread_admin_count), 0) FROM public.chatbot_conversations) AS unread_support_count,
          (SELECT COUNT(*) FROM public.chatbot_unanswered_questions WHERE resolution_status = 'OPEN') AS open_unanswered_count,
          (SELECT COUNT(*) FROM public.chatbot_faqs WHERE is_active = TRUE) AS active_faqs_count;
      `);

      const row = counts?.rows?.[0] || {};
      const totalConversations = parseInt(row.total_conversations || 0, 10);
      const pendingHandoffs = parseInt(row.awaiting_human_count || 0, 10);
      const unreadSupportCount = parseInt(row.unread_support_count || 0, 10);
      const openUnansweredCount = parseInt(row.open_unanswered_count || 0, 10);
      const activeFaqsCount = parseInt(row.active_faqs_count || 0, 10);

      return res.json({
        success: true,
        summary: {
          totalConversations,
          pendingHandoffs,
          totalFaqs: activeFaqsCount,
          unansweredCount: openUnansweredCount,
          unreadSupportCount,
        },
        totalConversations,
        pendingHandoffs,
        awaitingHumanCount: pendingHandoffs,
        unreadSupportCount,
        openUnansweredCount,
        activeFaqsCount,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load summary." });
    }
  }

  /**
   * GET /api/admin/chatbot/categories
   */
  async getCategories(req, res) {
    try {
      const resData = await db.query(
        "SELECT * FROM public.chatbot_categories ORDER BY sort_order ASC, category_id ASC;"
      );
      return res.json({ success: true, categories: resData?.rows || [] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load categories." });
    }
  }

  /**
   * POST /api/admin/chatbot/categories
   */
  async createCategory(req, res) {
    try {
      const { slug, nameEn, nameTl, description, sortOrder = 0 } = req.body;
      if (!nameEn || !nameTl) {
        return res.status(400).json({ success: false, message: "English and Tagalog names are required." });
      }

      const cleanSlug = (slug || nameEn.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")).trim();

      const resData = await db.query(
        `INSERT INTO public.chatbot_categories (slug, name_en, name_tl, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING *;`,
        [cleanSlug, nameEn.trim(), nameTl.trim(), description || "", parseInt(sortOrder, 10)]
      );

      invalidateCache();
      return res.json({ success: true, category: resData.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || "Failed to create category." });
    }
  }

  /**
   * PUT /api/admin/chatbot/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const categoryId = req.params.id;
      const { nameEn, nameTl, description, sortOrder, isActive } = req.body;

      const resData = await db.query(
        `UPDATE public.chatbot_categories
         SET name_en = COALESCE($2, name_en),
             name_tl = COALESCE($3, name_tl),
             description = COALESCE($4, description),
             sort_order = COALESCE($5, sort_order),
             is_active = COALESCE($6, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE category_id = $1
         RETURNING *;`,
        [categoryId, nameEn, nameTl, description, sortOrder, isActive]
      );

      invalidateCache();
      return res.json({ success: true, category: resData.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update category." });
    }
  }

  /**
   * DELETE /api/admin/chatbot/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;
      await db.query("DELETE FROM public.chatbot_categories WHERE category_id = $1;", [categoryId]);
      invalidateCache();
      return res.json({ success: true, message: "Category deleted." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to delete category." });
    }
  }

  /**
   * GET /api/admin/chatbot/faqs
   * Filterable, searchable FAQ list
   */
  async getFaqs(req, res) {
    try {
      const { search = "", categoryId = "", status = "" } = req.query;

      let whereClauses = ["1=1"];
      const params = [];

      if (categoryId) {
        params.push(categoryId);
        whereClauses.push(`f.category_id = $${params.length}`);
      }

      if (status === "active") {
        whereClauses.push("f.is_active = TRUE");
      } else if (status === "inactive") {
        whereClauses.push("f.is_active = FALSE");
      }

      if (search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        const idx = params.length;
        whereClauses.push(
          `(LOWER(f.question_en) LIKE $${idx} OR LOWER(COALESCE(f.question_tl, '')) LIKE $${idx} OR LOWER(f.answer_en) LIKE $${idx})`
        );
      }

      const sql = `
        SELECT f.*, c.name_en as category_name_en, c.name_tl as category_name_tl
        FROM public.chatbot_faqs f
        LEFT JOIN public.chatbot_categories c ON f.category_id = c.category_id
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY f.faq_id ASC;
      `;

      const resData = await db.query(sql, params);
      return res.json({ success: true, faqs: resData?.rows || [] });
    } catch (err) {
      console.error("[chatbotController] getFaqs error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch FAQs." });
    }
  }

  /**
   * POST /api/admin/chatbot/faqs
   */
  async createFaq(req, res) {
    try {
      const qEn = (req.body.questionEn || req.body.primaryQuestionEn || "").trim();
      const qTl = (req.body.questionTl || req.body.primaryQuestionFil || "").trim() || null;
      const aEn = (req.body.answerEn || "").trim();
      const aTl = (req.body.answerTl || req.body.answerFil || "").trim() || null;
      const altQuestions = req.body.altQuestions || req.body.alternativeQuestions || [];
      const keywords = req.body.keywords || [];
      const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : true;
      const categoryId = req.body.categoryId || null;

      if (!qEn || !aEn) {
        return res.status(400).json({ success: false, message: "Primary English question and answer are required." });
      }

      const userId = req.user?.userId || req.user?.user_id || null;

      const resData = await db.query(
        `INSERT INTO public.chatbot_faqs
         (category_id, question_en, question_tl, alt_questions, keywords, answer_en, answer_tl, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $9)
         RETURNING *;`,
        [
          categoryId,
          qEn,
          qTl,
          JSON.stringify(altQuestions),
          keywords,
          aEn,
          aTl,
          isActive,
          userId,
        ]
      );

      invalidateCache();
      return res.status(201).json({ success: true, faq: resData.rows[0] });
    } catch (err) {
      console.error("[chatbotController] createFaq error:", err);
      return res.status(500).json({ success: false, message: "Failed to create FAQ." });
    }
  }

  /**
   * PUT /api/admin/chatbot/faqs/:id
   */
  async updateFaq(req, res) {
    try {
      const faqId = req.params.id;
      const qEn = req.body.questionEn || req.body.primaryQuestionEn || null;
      const qTl = req.body.questionTl || req.body.primaryQuestionFil || null;
      const aEn = req.body.answerEn || null;
      const aTl = req.body.answerTl || req.body.answerFil || null;
      const altQuestions = req.body.altQuestions || req.body.alternativeQuestions;
      const keywords = req.body.keywords;
      const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : null;
      const categoryId = req.body.categoryId;

      const userId = req.user?.userId || req.user?.user_id || null;

      const resData = await db.query(
        `UPDATE public.chatbot_faqs
         SET category_id = COALESCE($2, category_id),
             question_en = COALESCE($3, question_en),
             question_tl = COALESCE($4, question_tl),
             alt_questions = COALESCE($5::jsonb, alt_questions),
             keywords = COALESCE($6, keywords),
             answer_en = COALESCE($7, answer_en),
             answer_tl = COALESCE($8, answer_tl),
             is_active = COALESCE($9, is_active),
             updated_by = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE faq_id = $1
         RETURNING *;`,
        [
          faqId,
          categoryId,
          qEn,
          qTl,
          altQuestions !== undefined ? JSON.stringify(altQuestions) : null,
          keywords,
          aEn,
          aTl,
          isActive,
          userId,
        ]
      );

      invalidateCache();
      return res.json({ success: true, faq: resData.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update FAQ." });
    }
  }

  /**
   * PATCH /api/admin/chatbot/faqs/:id/status
   * Toggle active/inactive
   */
  async toggleFaqStatus(req, res) {
    try {
      const faqId = req.params.id;
      const { isActive } = req.body;
      const userId = req.user?.userId || req.user?.user_id || null;

      const resData = await db.query(
        `UPDATE public.chatbot_faqs
         SET is_active = $2,
             updated_by = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE faq_id = $1
         RETURNING *;`,
        [faqId, Boolean(isActive), userId]
      );

      invalidateCache();
      return res.json({ success: true, faq: resData.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update FAQ status." });
    }
  }

  /**
   * DELETE /api/admin/chatbot/faqs/:id
   */
  async deleteFaq(req, res) {
    try {
      const faqId = req.params.id;
      await db.query("DELETE FROM public.chatbot_faqs WHERE faq_id = $1;", [faqId]);
      invalidateCache();
      return res.json({ success: true, message: "FAQ deleted successfully." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to delete FAQ." });
    }
  }

  /**
   * GET /api/admin/chatbot/settings
   */
  async getAdminSettings(req, res) {
    try {
      const settings = await this.getSettings();
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load settings." });
    }
  }

  /**
   * PUT /api/admin/chatbot/settings
   */
  async updateAdminSettings(req, res) {
    try {
      const { general, messages } = req.body;
      const userId = req.user?.userId || req.user?.user_id || null;

      if (general) {
        // Enforce optimal matching engine threshold defaults permanently
        const lockedGeneral = {
          ...general,
          min_match_threshold: 0.42,
          ambiguity_delta: 0.06,
          max_suggestions: 5,
          debounce_ms: 250,
        };
        await db.query(
          `INSERT INTO public.chatbot_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES ('general', $1::jsonb, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value,
               updated_by = EXCLUDED.updated_by,
               updated_at = CURRENT_TIMESTAMP;`,
          [JSON.stringify(lockedGeneral), userId]
        );
      }

      if (messages) {
        await db.query(
          `INSERT INTO public.chatbot_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES ('messages', $1::jsonb, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value,
               updated_by = EXCLUDED.updated_by,
               updated_at = CURRENT_TIMESTAMP;`,
          [JSON.stringify(messages), userId]
        );
      }

      invalidateCache();
      const updated = await this.getSettings();
      return res.json({ success: true, settings: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update settings." });
    }
  }

  /**
   * GET /api/admin/chatbot/unanswered
   */
  async getUnansweredQuestions(req, res) {
    try {
      const { status = "" } = req.query;
      let sql = "SELECT *, original_question as submitted_question FROM public.chatbot_unanswered_questions";
      const params = [];

      if (status) {
        params.push(status);
        sql += " WHERE resolution_status = $1";
      }
      sql += " ORDER BY updated_at DESC LIMIT 100;";

      const resData = await db.query(sql, params);
      return res.json({ success: true, unanswered: resData?.rows || [] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load unanswered questions." });
    }
  }

  /**
   * POST /api/admin/chatbot/unanswered/:id/convert
   * Creates a new approved FAQ entry directly from an unanswered question
   */
  async convertUnansweredToFaq(req, res) {
    try {
      const unansweredId = req.params.id;
      const { categoryId, questionEn, questionTl, answerEn, answerTl, keywords = [] } = req.body;
      const userId = req.user?.userId || req.user?.user_id || null;

      // 1. Create the FAQ
      const faqRes = await db.query(
        `INSERT INTO public.chatbot_faqs
         (category_id, question_en, question_tl, alt_questions, keywords, answer_en, answer_tl, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, '[]'::jsonb, $4, $5, $6, TRUE, $7, $7)
         RETURNING *;`,
        [categoryId || null, questionEn, questionTl || null, keywords, answerEn, answerTl || null, userId]
      );
      const newFaq = faqRes.rows[0];

      // 2. Mark unanswered record as CONVERTED_TO_FAQ
      await db.query(
        `UPDATE public.chatbot_unanswered_questions
         SET resolution_status = 'CONVERTED_TO_FAQ',
             linked_faq_id = $2,
             reviewed_by = $3,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE unanswered_id = $1;`,
        [unansweredId, newFaq.faq_id, userId]
      );

      invalidateCache();
      return res.json({ success: true, faq: newFaq });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to convert question to FAQ." });
    }
  }

  /**
   * POST /api/admin/chatbot/unanswered/:id/link
   * Links an unanswered question as an alternative phrasing of an existing FAQ
   */
  async linkUnansweredToFaq(req, res) {
    try {
      const unansweredId = req.params.id;
      const { targetFaqId, phrasing } = req.body;
      const userId = req.user?.userId || req.user?.user_id || null;

      if (!targetFaqId || !phrasing) {
        return res.status(400).json({ success: false, message: "targetFaqId and phrasing are required." });
      }

      // 1. Append phrasing to alt_questions
      const faqRes = await db.query("SELECT alt_questions FROM public.chatbot_faqs WHERE faq_id = $1;", [targetFaqId]);
      const currentAlts = faqRes?.rows?.[0]?.alt_questions || [];
      if (!currentAlts.includes(phrasing)) {
        currentAlts.push(phrasing);
        await db.query(
          `UPDATE public.chatbot_faqs 
           SET alt_questions = $2::jsonb,
               updated_by = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE faq_id = $1;`,
          [targetFaqId, JSON.stringify(currentAlts), userId]
        );
      }

      // 2. Mark unanswered record as LINKED_TO_FAQ
      await db.query(
        `UPDATE public.chatbot_unanswered_questions
         SET resolution_status = 'LINKED_TO_FAQ',
             linked_faq_id = $2,
             reviewed_by = $3,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE unanswered_id = $1;`,
        [unansweredId, targetFaqId, userId]
      );

      invalidateCache();
      return res.json({ success: true, message: "Linked phrasing to FAQ successfully." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to link question." });
    }
  }

  /**
   * PATCH /api/admin/chatbot/unanswered/:id/status
   */
  async updateUnansweredStatus(req, res) {
    try {
      const unansweredId = req.params.id;
      const { status } = req.body;
      const userId = req.user?.userId || req.user?.user_id || null;

      await db.query(
        `UPDATE public.chatbot_unanswered_questions
         SET resolution_status = $2,
             reviewed_by = $3,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE unanswered_id = $1;`,
        [unansweredId, status, userId]
      );

      return res.json({ success: true, message: "Status updated." });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update status." });
    }
  }

  /**
   * GET /api/admin/chatbot/conversations
   * Administrative support inbox
   */
  async getAdminConversations(req, res) {
    try {
      const { status = "", search = "" } = req.query;
      let whereClauses = ["1=1"];
      const params = [];

      if (status) {
        params.push(status);
        whereClauses.push(`c.status = $${params.length}`);
      }

      if (search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        const idx = params.length;
        whereClauses.push(
          `(LOWER(c.customer_name) LIKE $${idx} OR LOWER(COALESCE(c.customer_email, '')) LIKE $${idx} OR LOWER(COALESCE(c.last_message_preview, '')) LIKE $${idx})`
        );
      }

      const sql = `
        SELECT c.*, u.full_name as assigned_admin_name, u.avatar_url as assigned_admin_avatar
        FROM public.chatbot_conversations c
        LEFT JOIN public.users u ON c.assigned_admin_id = u.user_id
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY c.last_message_at DESC
        LIMIT 100;
      `;

      const resData = await db.query(sql, params);
      return res.json({ success: true, conversations: resData?.rows || [] });
    } catch (err) {
      console.error("[chatbotController] getAdminConversations error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch conversations." });
    }
  }

  /**
   * GET /api/admin/chatbot/conversations/:id
   */
  async getAdminConversationDetails(req, res) {
    try {
      const conversationId = req.params.id;

      const convRes = await db.query(
        `SELECT c.*, u.full_name as assigned_admin_name, u.avatar_url as assigned_admin_avatar
         FROM public.chatbot_conversations c
         LEFT JOIN public.users u ON c.assigned_admin_id = u.user_id
         WHERE c.conversation_id = $1;`,
        [conversationId]
      );
      const conversation = convRes?.rows?.[0];
      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found." });
      }

      // Mark unread admin count to 0
      await db.query(
        "UPDATE public.chatbot_conversations SET unread_admin_count = 0 WHERE conversation_id = $1;",
        [conversationId]
      );

      const msgRes = await db.query(
        `SELECT m.*, u.full_name as sender_admin_name, u.avatar_url as sender_admin_avatar
         FROM public.chatbot_messages m
         LEFT JOIN public.users u ON m.sender_id = u.user_id
         WHERE m.conversation_id = $1
         ORDER BY m.message_id ASC;`,
        [conversationId]
      );

      return res.json({
        success: true,
        conversation,
        messages: msgRes?.rows || [],
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch conversation details." });
    }
  }

  /**
   * POST /api/admin/chatbot/conversations/:id/assign
   * Admin claims or reassigns conversation
   */
  async assignAdminConversation(req, res) {
    try {
      const conversationId = req.params.id;
      const rawTargetId = req.body?.adminId || req.user?.userId || req.user?.user_id;

      let admin = null;
      let validAdminId = null;

      const parsedId = parseInt(rawTargetId, 10);
      if (!isNaN(parsedId)) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE user_id = $1;",
          [parsedId]
        );
        if (dbRes.rows?.[0]) {
          admin = dbRes.rows[0];
          validAdminId = admin.user_id;
        }
      }

      if (!admin && req.user?.email) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE email = $1 LIMIT 1;",
          [req.user.email]
        );
        if (dbRes.rows?.[0]) {
          admin = dbRes.rows[0];
          validAdminId = admin.user_id;
        }
      }

      if (!admin) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE role IN ('admin', 'super_admin') ORDER BY user_id ASC LIMIT 1;"
        );
        admin = dbRes?.rows?.[0];
        validAdminId = admin?.user_id || null;
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: "Administrator account not found." });
      }

      await db.query(
        `UPDATE public.chatbot_conversations
         SET assigned_admin_id = $2,
             status = 'HUMAN_ASSIGNED',
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, validAdminId]
      );

      // Insert system notice
      const sysMsg = `${admin.full_name} has joined the conversation to assist you.`;
      const msgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, sender_id, message_text, is_read, created_at)
         VALUES ($1, 'SYSTEM', $2, $3, TRUE, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [conversationId, validAdminId, sysMsg]
      );

      // Broadcast update
      realtimeService.broadcast("CHATBOT_CONVERSATION_UPDATED", {
        conversationId,
        status: "HUMAN_ASSIGNED",
        assignedAdmin: {
          userId: admin.user_id,
          fullName: admin.full_name,
          avatarUrl: admin.avatar_url,
        },
      });

      return res.json({
        success: true,
        status: "human_takeover",
        conversation: {
          conversation_id: conversationId,
          status: "human_takeover",
          raw_status: "HUMAN_ASSIGNED",
          assigned_admin_id: validAdminId,
          assigned_admin_name: admin.full_name,
        },
        assignedAdmin: {
          fullName: admin.full_name,
          avatarUrl: admin.avatar_url,
        },
        systemMessage: msgRes.rows[0],
      });
    } catch (err) {
      console.error("[chatbotController] assignAdminConversation error:", err);
      return res.status(500).json({ success: false, message: "Failed to assign conversation." });
    }
  }

  /**
   * POST /api/admin/chatbot/conversations/:id/reply
   * Admin sends message to customer
   */
  async sendAdminReply(req, res) {
    try {
      const conversationId = req.params.id;
      const body = req.body || {};
      const replyText = (body.message || "").trim();

      if (!replyText) {
        return res.status(400).json({ success: false, message: "Reply cannot be empty." });
      }

      let admin = null;
      let validAdminId = null;

      const rawId = req.user?.userId || req.user?.user_id;
      const parsedId = parseInt(rawId, 10);
      if (!isNaN(parsedId)) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE user_id = $1;",
          [parsedId]
        );
        if (dbRes.rows?.[0]) {
          admin = dbRes.rows[0];
          validAdminId = admin.user_id;
        }
      }

      if (!admin && req.user?.email) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE email = $1 LIMIT 1;",
          [req.user.email]
        );
        if (dbRes.rows?.[0]) {
          admin = dbRes.rows[0];
          validAdminId = admin.user_id;
        }
      }

      if (!admin) {
        const dbRes = await db.query(
          "SELECT user_id, full_name, avatar_url FROM public.users WHERE role IN ('admin', 'super_admin') ORDER BY user_id ASC LIMIT 1;"
        );
        admin = dbRes?.rows?.[0] || { user_id: null, full_name: req.user?.fullName || "MCPA Administrator", avatar_url: null };
        validAdminId = admin?.user_id || null;
      }

      const msgRes = await db.query(
        `INSERT INTO public.chatbot_messages
         (conversation_id, sender_type, sender_id, message_text, is_read, created_at)
         VALUES ($1, 'ADMIN', $2, $3, FALSE, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [conversationId, validAdminId, replyText]
      );

      await db.query(
        `UPDATE public.chatbot_conversations
         SET status = 'HUMAN_ACTIVE',
             assigned_admin_id = COALESCE(assigned_admin_id, $2),
             unread_customer_count = unread_customer_count + 1,
             last_message_preview = $3,
             last_message_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, validAdminId, replyText.slice(0, 150)]
      );

      const savedMsg = msgRes.rows[0];

      // Broadcast update
      realtimeService.broadcast("CHATBOT_MESSAGE_NEW", {
        conversationId,
        message: {
          ...savedMsg,
          sender_type: "human_agent",
          sender_name: admin.full_name,
          sender_avatar: admin.avatar_url,
          sender_admin_name: admin.full_name,
          sender_admin_avatar: admin.avatar_url,
        },
      });

      return res.status(201).json({
        success: true,
        message: {
          ...savedMsg,
          sender_type: "human_agent",
          sender_name: admin.full_name,
          sender_avatar: admin.avatar_url,
        },
      });
    } catch (err) {
      console.error("[chatbotController] sendAdminReply error:", err);
      return res.status(500).json({ success: false, message: "Failed to send reply." });
    }
  }

  /**
   * PATCH /api/admin/chatbot/conversations/:id/status
   */
  async updateConversationStatus(req, res) {
    try {
      const conversationId = req.params.id;
      const body = req.body || {};
      const rawStatus = (body.status || "").trim();
      let status = rawStatus.toUpperCase();
      if (rawStatus.toLowerCase() === "resolved") status = "RESOLVED";
      if (rawStatus.toLowerCase() === "closed") status = "CLOSED";
      if (rawStatus.toLowerCase() === "bot_active") status = "BOT_ACTIVE";

      const validStatuses = ["BOT_ACTIVE", "AWAITING_HUMAN", "HUMAN_ASSIGNED", "HUMAN_ACTIVE", "RESOLVED", "CLOSED"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value." });
      }

      await db.query(
        `UPDATE public.chatbot_conversations
         SET status = $2::varchar,
             resolved_at = CASE WHEN $2::varchar IN ('RESOLVED', 'CLOSED') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1;`,
        [conversationId, status]
      );

      realtimeService.broadcast("CHATBOT_CONVERSATION_UPDATED", {
        conversationId,
        status,
      });

      return res.json({
        success: true,
        status: rawStatus.toLowerCase(),
        conversation: {
          conversation_id: conversationId,
          status: rawStatus.toLowerCase(),
          raw_status: status,
        },
      });
    } catch (err) {
      console.error("[chatbotController] updateConversationStatus error:", err);
      return res.status(500).json({ success: false, message: "Failed to update conversation status." });
    }
  }
}

module.exports = new ChatbotController();
