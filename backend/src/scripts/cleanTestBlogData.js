const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function cleanBlog() {
  console.log("Cleaning test blog data from all databases...");

  const pools = [
    { name: "Supabase Pool", pool: db.supabasePool },
    { name: "Neon Pool", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${name} not available`);
      continue;
    }
    try {
      console.log(`\nPurging blog test data on ${name}...`);
      const delInteractions = await pool.query("DELETE FROM blog_post_interactions;").catch(() => ({ rowCount: 0 }));
      const delHashtags = await pool.query("DELETE FROM blog_post_hashtags;").catch(() => ({ rowCount: 0 }));
      const delMedia = await pool.query("DELETE FROM blog_post_media;").catch(() => ({ rowCount: 0 }));
      const delPosts = await pool.query("DELETE FROM blog_posts;").catch(() => ({ rowCount: 0 }));
      console.log(`  - Deleted ${delInteractions.rowCount || 0} blog_post_interactions`);
      console.log(`  - Deleted ${delHashtags.rowCount || 0} blog_post_hashtags`);
      console.log(`  - Deleted ${delMedia.rowCount || 0} blog_post_media`);
      console.log(`  - Deleted ${delPosts.rowCount || 0} blog_posts`);

      const count = await pool.query("SELECT COUNT(*) AS total FROM blog_posts;");
      console.log(`  => Remaining posts on ${name}: ${count.rows[0].total}`);
    } catch (e) {
      console.error(`Error on ${name}:`, e.message);
    }
  }
}

cleanBlog().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
