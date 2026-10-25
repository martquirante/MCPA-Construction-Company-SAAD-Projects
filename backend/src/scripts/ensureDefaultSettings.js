require("../../../backend/node_modules/dotenv").config({ path: "./backend/.env" });
const db = require("../services/dbFailoverEngine");

async function ensureDefaults() {
  const defaultGeneral = {
    min_match_threshold: 0.42,
    ambiguity_delta: 0.06,
    max_suggestions: 5,
    debounce_ms: 250,
    messenger_url: "https://www.messenger.com/t/101780969082788",
    social_links: {
      facebook: "https://www.facebook.com/MCPA.ConstructionandSupply/",
      instagram: "https://www.instagram.com/mcpa.constructionandsupply/",
      tiktok: "https://www.tiktok.com/@mcpa.construction",
    },
  };

  await db.query(
    `INSERT INTO public.chatbot_settings (setting_key, setting_value, updated_at)
     VALUES ('general', $1::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (setting_key) DO UPDATE
     SET setting_value = EXCLUDED.setting_value,
         updated_at = CURRENT_TIMESTAMP;`,
    [JSON.stringify(defaultGeneral)]
  );

  const s = await db.query("SELECT * FROM public.chatbot_settings WHERE setting_key = 'general';");
  console.log("Current DB general settings:", s.rows[0]);
  process.exit(0);
}

ensureDefaults().catch((e) => {
  console.error(e);
  process.exit(1);
});
