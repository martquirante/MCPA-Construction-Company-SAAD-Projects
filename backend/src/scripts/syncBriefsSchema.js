const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

async function check() {
  const neonConn = (process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL)
    .replace(/([?&])sslmode=[^&]+(&|$)/, (m, p1, p2) => p1 === '?' && p2 ? '?' : '')
    .replace(/([?&])channel_binding=[^&]+(&|$)/, (m, p1, p2) => p1 === '?' && p2 ? '?' : '')
    .replace(/\?$/, '');

  const supaPool = new Pool({ connectionString: process.env.SUPABASE_CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  const neonPool = new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } });

  const supaCols = (await supaPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'client_briefs'")).rows.map(r => r.column_name);
  const neonCols = (await neonPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'client_briefs'")).rows.map(r => r.column_name);

  console.log('Supabase columns count:', supaCols.length);
  console.log('Neon columns count:', neonCols.length);

  const missingInNeon = supaCols.filter(c => !neonCols.includes(c));
  console.log('Columns in Supabase but MISSING in Neon:', missingInNeon);

  if (missingInNeon.length > 0) {
    console.log('Synchronizing missing columns to Neon...');
    for (const col of missingInNeon) {
      const colDef = (await supaPool.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'client_briefs' AND column_name = $1", [col])).rows[0];
      const typeStr = colDef.data_type === 'USER-DEFINED' ? colDef.udt_name : (colDef.data_type === 'ARRAY' ? 'text[]' : colDef.data_type);
      console.log(`Adding ${col} (${typeStr}) to Neon...`);
      await neonPool.query(`ALTER TABLE client_briefs ADD COLUMN IF NOT EXISTS ${col} ${typeStr}`);
    }
    console.log('Neon schema synchronized successfully!');
  }

  await supaPool.end();
  await neonPool.end();
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
