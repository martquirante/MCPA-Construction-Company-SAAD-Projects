const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

async function runAiCredentialsVerification() {
  console.log("===================================================================");
  console.log(" MCPA AI PROVIDER CREDENTIALS LIVE VERIFICATION");
  console.log("===================================================================\n");

  const results = {};

  // 1. Google Gemini API
  console.log("[1/4] Testing Google Gemini API...");
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined in .env");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond in 3 words: MCPA Construction Active" }] }],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      console.log("  -> SUCCESS (HTTP 200)");
      console.log(`  -> Model: gemini-2.5-flash | Output: "${reply}"`);
      results.gemini = { status: "ACTIVE", http: 200, note: reply };
    } else {
      console.log("  -> FAILED (HTTP " + res.status + "):", data.error?.message);
      results.gemini = { status: "ERROR", http: res.status, error: data.error?.message };
    }
  } catch (err) {
    console.log("  -> FAILED:", err.message);
    results.gemini = { status: "ERROR", error: err.message };
  }

  // 2. Groq Cloud API
  console.log("\n[2/4] Testing Groq Cloud API...");
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("GROQ_API_KEY is not defined in .env");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: "Reply with: MCPA Groq Online" }],
        max_tokens: 20,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const reply = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("  -> SUCCESS (HTTP 200)");
      console.log(`  -> Model: qwen/qwen3.8-27b | Output: "${reply}"`);
      results.groq = { status: "ACTIVE", http: 200, note: reply };
    } else {
      console.log("  -> FAILED (HTTP " + res.status + "):", data.error?.message);
      results.groq = { status: "ERROR", http: res.status, error: data.error?.message };
    }
  } catch (err) {
    console.log("  -> FAILED:", err.message);
    results.groq = { status: "ERROR", error: err.message };
  }

  // 3. OpenRouter API
  console.log("\n[3/4] Testing OpenRouter API...");
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) throw new Error("OPENROUTER_API_KEY is not defined in .env");

    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.data) {
      console.log("  -> SUCCESS (HTTP 200)");
      console.log(`  -> Key Label: ${data.data.label} | Daily Remaining: ${data.data.free_model_daily_requests?.remaining ?? "N/A"}`);
      results.openrouter = {
        status: "ACTIVE",
        http: 200,
        remainingFreeRequests: data.data.free_model_daily_requests?.remaining,
      };
    } else {
      console.log("  -> FAILED (HTTP " + res.status + "):", data);
      results.openrouter = { status: "ERROR", http: res.status, error: data };
    }
  } catch (err) {
    console.log("  -> FAILED:", err.message);
    results.openrouter = { status: "ERROR", error: err.message };
  }

  // 4. Cloudflare Workers AI & Account Token
  console.log("\n[4/4] Testing Cloudflare (Account ID + API Token)...");
  try {
    const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!cfAccount || !cfToken) throw new Error("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN missing in .env");

    // A. Verify Token Validity
    const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${cfToken}` },
    });
    const verifyData = await verifyRes.json();

    // B. Test Live Workers AI Inference
    const aiRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "Say hello to MCPA in 3 words" }),
    });
    const aiData = await aiRes.json();

    if (verifyData.success && (aiData.success || aiRes.ok)) {
      console.log("  -> SUCCESS (HTTP 200)");
      console.log(`  -> Token Status: ${verifyData.result?.status} | Workers AI Engine Active`);
      results.cloudflare = {
        status: "ACTIVE",
        http: 200,
        tokenValid: verifyData.success,
        workersAi: aiData.success,
      };
    } else {
      console.log("  -> FAILED: ", verifyData, aiData);
      results.cloudflare = { status: "ERROR", verify: verifyData, ai: aiData };
    }
  } catch (err) {
    console.log("  -> FAILED:", err.message);
    results.cloudflare = { status: "ERROR", error: err.message };
  }

  console.log("\n===================================================================");
  console.log(" SUMMARY RESULT:");
  console.log(JSON.stringify(results, null, 2));
  console.log("===================================================================\n");
}

runAiCredentialsVerification();
