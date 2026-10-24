/**
 * Stage 4 (Finished Project & Wrapped) schema guard.
 *
 * dbFailoverEngine only mirrors INSERT / UPDATE / DELETE between Supabase and
 * Neon, so DDL has to be applied to every live pool explicitly. All statements
 * are idempotent and memoised, which makes it safe to call from initDb AND lazily
 * from request handlers (Vercel skips the full initDb run on cold start).
 */
const db = require("./dbFailoverEngine");

const STAGE4_DDL = [
  "ALTER TABLE public.site_photo_logs ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';",
  "ALTER TABLE public.site_photo_logs ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT NULL;",
  "ALTER TABLE public.site_photo_logs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'progress';",
  "CREATE INDEX IF NOT EXISTS idx_site_photo_logs_proj_cat ON public.site_photo_logs (project_code, category);",
  "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_client_project_id INTEGER;",
  "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_project_code VARCHAR(50);",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_source_client_project ON public.projects(source_client_project_id) WHERE source_client_project_id IS NOT NULL;",
  "ALTER TABLE public.project_wrapped ADD COLUMN IF NOT EXISTS wrapped_payload JSONB DEFAULT '{}'::jsonb;",
  "ALTER TABLE public.project_wrapped ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;",
];

let ensurePromise = null;

async function applyToPool(pool, label) {
  if (!pool) return;
  for (const sql of STAGE4_DDL) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.warn(`[stage4Schema] ${label} notice (${sql.slice(0, 60)}...): ${err.message}`);
    }
  }
}

function ensureStage4Schema() {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    if (db.isMockActive) return false;
    await applyToPool(db.supabasePool, "supabase");
    await applyToPool(db.neonPool, "neon");
    if (!db.supabasePool && !db.neonPool) {
      // Single-pool deployments (azure / local) fall back to the failover router.
      for (const sql of STAGE4_DDL) {
        await db.query(sql).catch((e) => console.warn("[stage4Schema] notice:", e.message));
      }
    }
    return true;
  })().catch((err) => {
    console.warn("[stage4Schema] ensure failed:", err.message);
    ensurePromise = null;
    return false;
  });
  return ensurePromise;
}

module.exports = { ensureStage4Schema, STAGE4_DDL };
