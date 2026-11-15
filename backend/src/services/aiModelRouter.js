/**
 * MCPA Construction and Supply — Multi-Provider Free-Tier AI Model Router
 * 
 * Features:
 * - Unified interface across Gemini, Groq, OpenRouter, and Cloudflare Workers AI
 * - Priority-ordered fallback: Gemini -> Groq -> OpenRouter -> Cloudflare
 * - Automatic circuit breaker & cooldown on 429 / rate limits / timeouts
 * - Strict free-tier enforcement (never invokes paid models)
 * - Detailed usage and latency telemetry
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Provider cooldown tracking (timestamp in ms until which provider is paused)
const providerCooldowns = {
  gemini: 0,
  groq: 0,
  openrouter: 0,
  cloudflare: 0,
};

// Provider performance & usage stats
const routerStats = {
  totalRequests: 0,
  providerSuccesses: { gemini: 0, groq: 0, openrouter: 0, cloudflare: 0 },
  providerFailures: { gemini: 0, groq: 0, openrouter: 0, cloudflare: 0 },
  lastUsedProvider: null,
  recentLatencies: [],
};

const COOLDOWN_DURATION_MS = 60000; // 60 seconds cooldown on 429 / hard errors
const REQUEST_TIMEOUT_MS = 8500; // 8.5s timeout per provider before triggering fallback

/**
 * Executes a fetch with an explicit timeout signal
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Provider 1: Google Gemini API (gemini-2.5-flash)
 */
async function callGemini(messages, systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Format messages into Gemini contents array
  const contents = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }

  const payload = {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.3,
      topP: 0.85,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const error = new Error(`Gemini API HTTP ${res.status}: ${errBody}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error("Gemini returned an empty candidate text");
  return reply;
}

/**
 * Provider 2: Groq Cloud API (qwen/qwen3.8-27b or llama-3.1-8b-instant)
 */
async function callGroq(messages, systemInstruction) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing in environment");

  const groqMessages = [];
  if (systemInstruction) {
    groqMessages.push({ role: "system", content: systemInstruction });
  }
  for (const m of messages) {
    groqMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
  }

  const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 750,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const error = new Error(`Groq API HTTP ${res.status}: ${errBody}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Groq returned an empty response");
  return reply;
}

/**
 * Provider 3: OpenRouter API (free tier model)
 */
async function callOpenRouter(messages, systemInstruction) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing in environment");

  const orMessages = [];
  if (systemInstruction) {
    orMessages.push({ role: "system", content: systemInstruction });
  }
  for (const m of messages) {
    orMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
  }

  const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://www.mcpaconstruction.com",
      "X-Title": "MCPA Construction Assistant",
    },
    body: JSON.stringify({
      model: "liquid/lfm-3-1.7b:free",
      messages: orMessages,
      temperature: 0.3,
      max_tokens: 750,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const error = new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const choiceMsg = data.choices?.[0]?.message;
  const reply = (choiceMsg?.content || choiceMsg?.reasoning || "").trim();
  if (!reply) throw new Error("OpenRouter returned empty choices");
  return reply;
}

/**
 * Provider 4: Cloudflare Workers AI (@cf/meta/llama-3-8b-instruct)
 */
async function callCloudflare(messages, systemInstruction) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) throw new Error("Cloudflare account credentials missing");

  const cfMessages = [];
  if (systemInstruction) {
    cfMessages.push({ role: "system", content: systemInstruction });
  }
  for (const m of messages) {
    cfMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: cfMessages,
      max_tokens: 750,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const error = new Error(`Cloudflare AI HTTP ${res.status}: ${errBody}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const reply = data.result?.response?.trim();
  if (!reply) throw new Error("Cloudflare AI returned empty response");
  return reply;
}

class AiModelRouter {
  constructor() {
    this.providers = [
      { id: "gemini", name: "Google Gemini (gemini-2.5-flash)", handler: callGemini },
      { id: "groq", name: "Groq Cloud (qwen/qwen3.8-27b)", handler: callGroq },
      { id: "openrouter", name: "OpenRouter (liquid-lfm-free)", handler: callOpenRouter },
      { id: "cloudflare", name: "Cloudflare Workers AI (llama-3.1-8b)", handler: callCloudflare },
    ];
  }

  /**
   * Dispatches chat generation request through multi-provider fallback sequence
   * 
   * @param {Array<{role: string, content: string}>} messages 
   * @param {string} systemInstruction 
   * @param {Object} options 
   * @returns {Promise<{text: string, provider: string, latencyMs: number, fallbackUsed: boolean}>}
   */
  async generateChatResponse(messages, systemInstruction, options = {}) {
    routerStats.totalRequests++;
    const now = Date.now();
    const forceProvider = options.forceProvider; // for testing individual providers

    const candidateProviders = forceProvider
      ? this.providers.filter((p) => p.id === forceProvider)
      : this.providers;

    let lastError = null;
    let fallbackCount = 0;

    for (const provider of candidateProviders) {
      // Check cooldown
      if (!forceProvider && providerCooldowns[provider.id] > now) {
        console.warn(`[AiModelRouter] Skipping ${provider.id}: cooling down until ${new Date(providerCooldowns[provider.id]).toLocaleTimeString()}`);
        continue;
      }

      const startTime = Date.now();
      try {
        console.log(`[AiModelRouter] Attempting generation with provider: ${provider.name}...`);
        const replyText = await provider.handler(messages, systemInstruction);
        const latencyMs = Date.now() - startTime;

        routerStats.providerSuccesses[provider.id]++;
        routerStats.lastUsedProvider = provider.id;
        routerStats.recentLatencies.push({ provider: provider.id, latencyMs, timestamp: new Date().toISOString() });
        if (routerStats.recentLatencies.length > 50) routerStats.recentLatencies.shift();

        return {
          text: replyText,
          provider: provider.id,
          providerName: provider.name,
          latencyMs,
          fallbackUsed: fallbackCount > 0,
        };
      } catch (err) {
        fallbackCount++;
        routerStats.providerFailures[provider.id]++;
        lastError = err;
        console.warn(`[AiModelRouter] Provider ${provider.id} failed: ${err.message}. Engaging fallback...`);

        // If rate limited or server unavailable, put provider in cooldown
        if (err.status === 429 || err.status === 503 || (err.message && err.message.includes("quota"))) {
          providerCooldowns[provider.id] = Date.now() + COOLDOWN_DURATION_MS;
          console.warn(`[AiModelRouter] Cooldown set for ${provider.id} for 60 seconds.`);
        }
      }
    }

    throw new Error(`All available free-tier AI providers exhausted. Last error: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Returns current provider health, usage stats, and cooldowns for the Admin Dashboard
   */
  getProvidersStatus() {
    const now = Date.now();
    return this.providers.map((p) => {
      const isConfigured = Boolean(
        p.id === "gemini" ? process.env.GEMINI_API_KEY :
        p.id === "groq" ? process.env.GROQ_API_KEY :
        p.id === "openrouter" ? process.env.OPENROUTER_API_KEY :
        (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
      );

      const inCooldown = providerCooldowns[p.id] > now;
      const cooldownRemainingSec = inCooldown ? Math.round((providerCooldowns[p.id] - now) / 1000) : 0;

      return {
        id: p.id,
        name: p.name,
        isConfigured,
        isAvailable: isConfigured && !inCooldown,
        inCooldown,
        cooldownRemainingSec,
        successCount: routerStats.providerSuccesses[p.id] || 0,
        failureCount: routerStats.providerFailures[p.id] || 0,
      };
    });
  }

  /**
   * Resets cooldown for a specific provider (admin trigger)
   */
  resetCooldown(providerId) {
    if (providerId === "all") {
      Object.keys(providerCooldowns).forEach((k) => (providerCooldowns[k] = 0));
    } else if (providerCooldowns[providerId] !== undefined) {
      providerCooldowns[providerId] = 0;
    }
  }

  /**
   * Returns internal router telemetry and latency measurements
   */
  getAnalytics() {
    return {
      totalRequests: routerStats.totalRequests,
      providerSuccesses: routerStats.providerSuccesses,
      providerFailures: routerStats.providerFailures,
      lastUsedProvider: routerStats.lastUsedProvider,
      recentLatencies: routerStats.recentLatencies,
    };
  }
}

module.exports = new AiModelRouter();
