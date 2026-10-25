/**
 * MCPA Construction & Supply — Deterministic Search & Ranking Engine
 * 
 * STRICT ARCHITECTURAL RULE:
 * ZERO external AI models, ZERO external LLM inference, ZERO third-party AI APIs.
 * 
 * Operates purely on deterministic tokenization, bilingual canonical concept mapping,
 * weighted multi-signal scoring, bounded typo tolerance, and strict guardrails.
 */

const STOP_WORDS_EN = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "for", "from", "by", "with", "about", "into",
  "do", "does", "did", "can", "could", "would", "should", "will", "shall",
  "i", "me", "my", "we", "us", "our", "you", "your", "he", "she", "it",
  "they", "them", "their", "please", "kindly", "tell", "give", "know",
  "what", "where", "when", "why", "who", "which", "how",
]);

const STOP_WORDS_TL = new Set([
  "po", "opo", "ba", "nga", "naman", "lang", "lamang", "yung", "ung", "ang",
  "mga", "sa", "ng", "ng mga", "na", "pa", "ko", "mo", "ninyo", "nyo",
  "kayo", "kami", "tayo", "sila", "nila", "ito", "iyon", "doon", "dito",
  "dyan", "para", "kay", "kina", "at", "o", "kasi", "eh", "daw", "raw",
  "pala", "baga", "ba naman",
]);

// Canonical concept expansion: maps synonyms/variants to unified concept tokens
const CONCEPT_SYNONYMS = {
  // Services
  services: ["service", "services", "serbisyo", "gawa", "iniaalok", "offer", "offers", "offering", "scope", "work", "trabaho"],
  residential: ["house", "houses", "home", "homes", "residential", "bahay", "pabahay", "tirahan", "residence"],
  bnpl: [
    "bnpl", "build now pay later", "hulugan", "installment", "financing", "loan", "pagibig",
    "pag-ibig", "utang", "pautang", "downpayment", "down payment", "progress billing",
  ],
  titled_lot: ["title", "titled", "titulo", "tct", "cct", "lote", "lot", "lupa", "land", "property", "clean title"],
  blueprints: [
    "blueprint", "blueprints", "plano", "plans", "plan", "drawing", "floorplan", "floor plan",
    "architect", "architects", "arkitekto", "engineer", "engineers", "pirma", "sealed", "signed",
    "signed and sealed", "prc",
  ],
  permits: ["permit", "permits", "building permit", "lgu", "munisipyo", "city hall", "approval", "bplo", "clearance"],
  commercial: ["commercial", "warehouse", "warehouses", "bodega", "rental", "industrial", "steel framing", "paupahan", "building"],
  supply: [
    "supply", "supplies", "materials", "materyales", "hardware", "semento", "cement", "bakal", "rebar",
    "rebars", "aggregates", "gravel", "sand", "graba", "buhangin", "truck", "trucks", "dump truck",
  ],
  process: ["process", "proseso", "stages", "stage", "steps", "step", "phase", "phases", "hakbang", "timeline", "workflow"],
  quotation: [
    "quotation", "quote", "inquire", "inquiry", "estimate", "consultation", "booking", "book", "appointment",
    "presyo", "halaga", "magkano", "gastos", "magagastos", "bayad", "cost", "price", "pricing",
  ],
  warranty: ["warranty", "garantiya", "15 years", "15-year", "15 taon", "guarantee", "resilience", "matibay", "tibay", "civil code"],
  renovation: ["renovation", "renovations", "renobasyon", "extension", "second floor", "palapag", "dagdag", "repair", "remodel"],
  location: [
    "location", "office", "address", "saan", "lugar", "opisina", "plaridel", "bulacan", "tabang",
    "ncr", "metro manila", "pampanga", "central luzon", "coverage", "area", "areas",
  ],
  hours: ["hours", "oras", "schedule", "open", "bukas", "sarado", "closed", "time", "operating"],
  contact: ["contact", "phone", "email", "number", "viber", "messenger", "tawag", "kontak", "reach"],
};

// Words that indicate an exact price quotation request that requires custom engineering evaluation
const UNANSWERABLE_PRICE_PATTERNS = [
  /magkano.*(dalawang\s+palapag|2\s*storey|two\s*storey|isang\s+palapag|1\s*storey|bahay|square\s*meter|sqm|building)/i,
  /how\s+much.*(two[- ]storey|2[- ]storey|one[- ]storey|single[- ]storey|house|sqm|square\s*meter|building|per\s*sqm)/i,
  /(exact|fixed)\s+(price|cost)\s+(per\s+)?(sqm|square\s*meter)/i,
  /(eksakto|fixed)\s+(na\s+)?(presyo|halaga|gastos)/i,
  /guarantee\s+completion\s+within\s+(two|2)\s+months/i,
  /tapos\s+ba\s+sa\s+loob\s+ng\s+(dalawang|2)\s+buwan/i,
];

// Single generic words that must NEVER match an FAQ alone
const GENERIC_SINGLE_TOKENS = new Set([
  "mcpa", "construction", "supply", "build", "bahay", "house", "project",
  "help", "tulong", "tanong", "question", "hello", "hi", "hey", "good morning",
  "good afternoon", "good evening", "kumusta", "kamusta", "info", "information",
]);

class ChatbotSearchService {
  /**
   * Cleans raw text into lowercased whitespace-normalized string without punctuation
   * @param {string} text
   * @returns {string}
   */
  normalizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text.trim().toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * Tokenizes text and filters English and Tagalog stopwords
   * @param {string} text
   * @returns {string[]}
   */
  tokenize(text) {
    return this.parseQuery(text).tokens;
  }

  /**
   * Maps tokens to canonical domain concepts
   * @param {string[]|string} tokens
   * @returns {Set<string>}
   */
  mapToConcepts(tokens) {
    const list = Array.isArray(tokens) ? tokens : [tokens];
    const concepts = new Set();
    for (const t of list) {
      const lower = String(t).toLowerCase();
      for (const [conceptKey, synList] of Object.entries(CONCEPT_SYNONYMS)) {
        if (synList.includes(lower)) {
          concepts.add(conceptKey);
        }
      }
    }
    return concepts;
  }

  /**
   * Computes Levenshtein distance between two strings
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Normalizes raw user input into clean tokens, detected language, and canonical concepts
   * @param {string} text 
   * @returns {{ raw: string, normalized: string, tokens: string[], canonicalConcepts: Set<string>, detectedLang: 'en'|'fil' }}
   */
  parseQuery(text) {
    if (!text || typeof text !== "string") {
      return { raw: "", normalized: "", tokens: [], canonicalConcepts: new Set(), detectedLang: "en" };
    }

    const raw = text.trim();
    const clean = this.normalizeText(raw);

    // 2. Tokenize
    const rawTokens = clean.split(" ").filter((t) => t.length > 0);

    // 3. Simple language detection heuristic based on Tagalog function words
    let filCount = 0;
    let enCount = 0;
    for (const t of rawTokens) {
      if (STOP_WORDS_TL.has(t) || ["ano", "anong", "paano", "saan", "kailan", "magkano", "bakit", "sino", "may", "wala"].includes(t)) {
        filCount++;
      } else if (STOP_WORDS_EN.has(t) || ["what", "how", "where", "when", "why", "who", "does", "have"].includes(t)) {
        enCount++;
      }
    }
    const detectedLang = filCount >= enCount && filCount > 0 ? "fil" : "en";

    // 4. Filter stop words while retaining meaningful interrogatives and domain terms
    const filteredTokens = rawTokens.filter((t) => {
      if (STOP_WORDS_EN.has(t) || STOP_WORDS_TL.has(t)) return false;
      return t.length >= 2;
    });

    // 5. Expand to canonical concepts
    const canonicalConcepts = this.mapToConcepts(rawTokens);

    return {
      raw,
      normalized: clean,
      tokens: filteredTokens,
      canonicalConcepts,
      detectedLang,
    };
  }

  /**
   * Bounded Damerau-Levenshtein typo distance for words >= 5 chars
   */
  isFuzzyMatch(tokenA, tokenB) {
    if (tokenA === tokenB) return true;
    if (tokenA.length < 5 || tokenB.length < 5) return false;
    if (Math.abs(tokenA.length - tokenB.length) > 2) return false;

    // Fast check: common prefixes
    if (tokenA.slice(0, 3) !== tokenB.slice(0, 3)) return false;

    // Levenshtein matrix
    const a = tokenA;
    const b = tokenB;
    const matrix = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const dist = matrix[b.length][a.length];
    const maxAllowed = Math.min(tokenA.length, tokenB.length) >= 8 ? 2 : 1;
    return dist <= maxAllowed;
  }

  /**
   * Generates character n-grams or word bigrams for phrase matching
   */
  getWordBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
  }

  /**
   * Checks whether the user's question triggers specific unanswerable rules
   */
  isSpecificUnanswerable(rawText) {
    for (const pattern of UNANSWERABLE_PRICE_PATTERNS) {
      if (pattern.test(rawText)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Evaluates relevance score between customer query and a single FAQ entry
   * Score ranges from 0.00 to 1.00
   */
  scoreFaq(parsedQuery, faq) {
    const { normalized, tokens, canonicalConcepts } = parsedQuery;

    // Guard: Query is only 1 token and that token is generic (e.g. "mcpa", "bahay", "construction")
    if (tokens.length <= 1) {
      const single = tokens[0] || normalized;
      if (GENERIC_SINGLE_TOKENS.has(single)) {
        return 0.15; // Cap well below threshold
      }
    }

    // Prepare FAQ candidate strings
    const faqCandidates = [
      faq.question_en,
      faq.question_tl,
      ...(Array.isArray(faq.alt_questions) ? faq.alt_questions : []),
    ].filter(Boolean);

    // 1. EXACT OR VERY HIGH CONFIDENCE STRING MATCH
    for (const cand of faqCandidates) {
      const candNorm = cand.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
      if (normalized === candNorm) {
        return 1.0;
      }
      // Substring containment for queries with 3+ words
      if (tokens.length >= 3 && candNorm.includes(normalized)) {
        return 0.95;
      }
      if (candNorm.length >= 8 && normalized.includes(candNorm)) {
        return 0.92;
      }
    }

    // Parse FAQ terms
    const faqAllText = faqCandidates.join(" ");
    const parsedFaq = this.parseQuery(faqAllText);

    // 2. PHRASE / BIGRAM OVERLAP (weight: 0.32)
    let bigramScore = 0;
    const queryBigrams = this.getWordBigrams(tokens);
    const faqBigrams = new Set(this.getWordBigrams(parsedFaq.tokens));

    if (queryBigrams.length > 0 && faqBigrams.size > 0) {
      let matchedBigrams = 0;
      for (const bg of queryBigrams) {
        if (faqBigrams.has(bg)) matchedBigrams++;
      }
      bigramScore = matchedBigrams / queryBigrams.length;
    }

    // 3. DOMAIN TOKEN OVERLAP & FUZZY MATCHING (weight: 0.36)
    let tokenMatches = 0;
    const faqTokenSet = new Set(parsedFaq.tokens);

    for (const qToken of tokens) {
      if (faqTokenSet.has(qToken)) {
        tokenMatches += 1.0;
      } else {
        // Check fuzzy match
        let fuzzyFound = false;
        for (const fToken of faqTokenSet) {
          if (this.isFuzzyMatch(qToken, fToken)) {
            tokenMatches += 0.85;
            fuzzyFound = true;
            break;
          }
        }
      }
    }
    const tokenScore = tokens.length > 0 ? tokenMatches / tokens.length : 0;

    // 4. CANONICAL CONCEPT MATCH (weight: 0.20)
    let conceptScore = 0;
    if (canonicalConcepts.size > 0 && parsedFaq.canonicalConcepts.size > 0) {
      let matchedConcepts = 0;
      for (const concept of canonicalConcepts) {
        if (parsedFaq.canonicalConcepts.has(concept)) {
          matchedConcepts++;
        }
      }
      conceptScore = matchedConcepts / canonicalConcepts.size;
    }

    // 5. KEYWORD TAG MATCH (weight: 0.12)
    let keywordScore = 0;
    const faqKeywords = Array.isArray(faq.keywords) ? faq.keywords.map((k) => k.toLowerCase()) : [];
    if (faqKeywords.length > 0 && tokens.length > 0) {
      let kwHits = 0;
      for (const kw of faqKeywords) {
        if (normalized.includes(kw) || tokens.some((t) => t === kw || this.isFuzzyMatch(t, kw))) {
          kwHits++;
        }
      }
      keywordScore = Math.min(1.0, kwHits / Math.max(1, tokens.length));
    }

    // Composite Weighted Calculation
    // Total weights: 0.32 + 0.36 + 0.20 + 0.12 = 1.00
    const composite =
      bigramScore * 0.32 +
      tokenScore * 0.36 +
      conceptScore * 0.20 +
      keywordScore * 0.12;

    // Boost if multiple signals strongly align
    let finalScore = composite;
    if (conceptScore >= 0.5 && tokenScore >= 0.5) {
      finalScore = Math.min(0.98, finalScore + 0.10);
    }

    return parseFloat(finalScore.toFixed(4));
  }

  /**
   * Main matching function: Compares query against all approved FAQs
   * @param {string} rawQuery
   * @param {Array} faqs
   * @param {object} settings
   * @param {string} [uiLanguage='en']
   */
  matchQuestion(rawQuery, faqs, settings = {}, uiLanguage = "en") {
    const minThreshold = settings.min_match_threshold || 0.42;
    const ambiguityDelta = settings.ambiguity_delta || 0.06;

    const parsedQuery = this.parseQuery(rawQuery);

    // 1. Empty or too short query
    if (!parsedQuery.normalized || parsedQuery.normalized.length < 2) {
      return {
        matched: false,
        reason: "EMPTY_QUERY",
        detectedLang: parsedQuery.detectedLang,
      };
    }

    // 2. Specific Unanswerable Check (Price per sqm / specific floor count promises)
    // If the customer asks for an exact uncalculated price or guarantee not explicitly stored,
    // prevent wild matches and guide cleanly to honest fallback / consultation booking.
    if (this.isSpecificUnanswerable(parsedQuery.raw)) {
      return {
        matched: false,
        reason: "UNANSWERABLE_SPECIFIC_QUOTE",
        detectedLang: parsedQuery.detectedLang,
        showEscalation: true,
      };
    }

    // 3. Filter to active FAQs only
    const activeFaqs = faqs.filter((f) => f.is_active !== false);
    if (activeFaqs.length === 0) {
      return {
        matched: false,
        reason: "NO_ACTIVE_FAQS",
        detectedLang: parsedQuery.detectedLang,
      };
    }

    // 4. Score all FAQs
    const scoredList = [];
    for (const faq of activeFaqs) {
      const score = this.scoreFaq(parsedQuery, faq);
      scoredList.push({
        faq,
        score,
      });
    }

    // Sort by score descending
    scoredList.sort((a, b) => b.score - a.score);

    const topMatch = scoredList[0];
    const secondMatch = scoredList[1];

    // 5. Does top match satisfy the threshold?
    if (!topMatch || topMatch.score < minThreshold) {
      return {
        matched: false,
        topScore: topMatch ? topMatch.score : 0,
        topCandidateFaqId: topMatch?.faq?.faq_id || null,
        detectedLang: parsedQuery.detectedLang,
      };
    }

    // 6. Ambiguity Check: Are top 2 matches very close in score across different FAQs?
    if (
      secondMatch &&
      secondMatch.score >= minThreshold &&
      topMatch.score - secondMatch.score <= ambiguityDelta &&
      topMatch.faq.faq_id !== secondMatch.faq.faq_id
    ) {
      const langKey = parsedQuery.detectedLang === "fil" || uiLanguage === "fil" ? "question_tl" : "question_en";
      const clarifyingOptions = scoredList
        .slice(0, 3)
        .filter((item) => item.score >= minThreshold)
        .map((item) => ({
          faqId: item.faq.faq_id,
          question: item.faq[langKey] || item.faq.question_en,
        }));

      return {
        matched: false,
        ambiguous: true,
        clarifyingOptions,
        detectedLang: parsedQuery.detectedLang,
      };
    }

    // 7. Clean winner found: determine answer language
    const winningFaq = topMatch.faq;
    const useFilipino =
      (parsedQuery.detectedLang === "fil" || uiLanguage === "fil") && Boolean(winningFaq.answer_tl);

    const approvedAnswer = useFilipino ? winningFaq.answer_tl : winningFaq.answer_en;
    const questionText = useFilipino ? (winningFaq.question_tl || winningFaq.question_en) : winningFaq.question_en;

    return {
      matched: true,
      faqId: winningFaq.faq_id,
      score: topMatch.score,
      question: questionText,
      answer: approvedAnswer,
      detectedLang: parsedQuery.detectedLang,
      usedLanguage: useFilipino ? "fil" : "en",
    };
  }

  /**
   * Generates live suggestions as user types (debounced on frontend)
   */
  getSuggestions(query, faqs, limit = 5, uiLanguage = "en") {
    if (!query || query.trim().length < 2) return [];

    const parsed = this.parseQuery(query);
    const activeFaqs = faqs.filter((f) => f.is_active !== false);
    const candidates = [];
    const seenQuestions = new Set();

    for (const faq of activeFaqs) {
      const langQuestion =
        uiLanguage === "fil" && faq.question_tl ? faq.question_tl : faq.question_en;

      // Primary question match
      const primaryScore = this.scoreFaq(parsed, {
        ...faq,
        alt_questions: [],
      });

      if (primaryScore >= 0.25 && !seenQuestions.has(langQuestion)) {
        seenQuestions.add(langQuestion);
        candidates.push({
          faqId: faq.faq_id,
          question: langQuestion,
          score: primaryScore,
        });
      }

      // Alternative questions match
      const alts = Array.isArray(faq.alt_questions) ? faq.alt_questions : [];
      for (const alt of alts) {
        if (!seenQuestions.has(alt)) {
          const altNorm = alt.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
          if (
            altNorm.includes(parsed.normalized) ||
            parsed.tokens.every((t) => altNorm.includes(t))
          ) {
            seenQuestions.add(alt);
            candidates.push({
              faqId: faq.faq_id,
              question: alt,
              score: 0.75,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit).map((c) => ({
      faqId: c.faqId,
      question: c.question,
    }));
  }
}

module.exports = new ChatbotSearchService();
