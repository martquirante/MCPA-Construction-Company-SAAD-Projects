require("dotenv").config();
const { Pool } = require("pg");

async function compareSchemas() {
  const supaConn = process.env.SUPABASE_CONNECTION_STRING;
  const neonConn = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;

  const supaPool = new Pool({ connectionString: supaConn, ssl: { rejectUnauthorized: false } });
  const neonPool = new Pool({ connectionString: neonConn, ssl: { rejectUnauthorized: false } });

  try {
    const supaCols = await supaPool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
    );
    const neonCols = await neonPool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
    );

    const supaSet = new Map(supaCols.rows.map(r => [r.column_name, r.data_type]));
    const neonSet = new Map(neonCols.rows.map(r => [r.column_name, r.data_type]));

    console.log("=== MISSING IN NEON (Present in Supabase) ===");
    for (const [col, type] of supaSet.entries()) {
      if (!neonSet.has(col)) {
        console.log(` - ${col} (${type})`);
      }
    }

    console.log("\n=== MISSING IN SUPABASE (Present in Neon) ===");
    for (const [col, type] of neonSet.entries()) {
      if (!supaSet.has(col)) {
        console.log(` - ${col} (${type})`);
      }
    }
  } catch (err) {
    console.error("Comparison error:", err);
  } finally {
    await supaPool.end();
    await neonPool.end();
  }
}

compareSchemas();
