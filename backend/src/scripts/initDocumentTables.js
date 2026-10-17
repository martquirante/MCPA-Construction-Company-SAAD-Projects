require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function main() {
  console.log("[Migration] Initializing Document Requests & Transmittals tables...");

  const sql = `
    CREATE TABLE IF NOT EXISTS public.project_document_requests (
      request_id SERIAL PRIMARY KEY,
      client_project_id INT REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      urgency VARCHAR(50) DEFAULT 'Urgent',
      instructions TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      file_url TEXT,
      file_name VARCHAR(255),
      file_size_bytes BIGINT,
      uploaded_at TIMESTAMPTZ,
      requested_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.project_transmittals (
      transmittal_id SERIAL PRIMARY KEY,
      client_project_id INT REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_url TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size_bytes BIGINT,
      mime_type VARCHAR(100),
      remarks TEXT,
      transmitted_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_doc_reqs_project ON public.project_document_requests(client_project_id);
    CREATE INDEX IF NOT EXISTS idx_transmittals_project ON public.project_transmittals(client_project_id);
  `;

  await db.query(sql);
  console.log("[Migration] Tables created successfully in Supabase & Neon!");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration Error]", err);
  process.exit(1);
});
