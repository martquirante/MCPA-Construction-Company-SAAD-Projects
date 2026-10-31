require('dotenv').config({ path: __dirname + '/../../.env' });
const db = require('../services/dbFailoverEngine');

const ddl = `
CREATE TABLE IF NOT EXISTS public.email_change_requests (
  request_id SERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  old_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_change_token ON public.email_change_requests(token);
CREATE INDEX IF NOT EXISTS idx_email_change_old_email ON public.email_change_requests(old_email);
`;

async function run() {
  await db.query(ddl);
  console.log('Successfully created email_change_requests table on Supabase');
  if (db.neonPool) {
    await db.neonPool.query(ddl);
    console.log('Successfully created email_change_requests table on Neon');
  }
  process.exit(0);
}

run().catch(e => {
  console.error('Migration error:', e.message);
  process.exit(1);
});

