const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const db = require("../services/dbFailoverEngine");

async function updateAdminIdentity() {
  console.log("Updating admin accounts to 'MCPA Construction and Supply'...");

  // Update on primary and standby
  await db.query(`
    UPDATE users 
    SET full_name = 'MCPA Construction and Supply', 
        avatar_url = NULL 
    WHERE role IN ('admin', 'super_admin');
  `);

  // Also update blog posts author names
  await db.query(`
    UPDATE blog_posts 
    SET author_name = 'MCPA Construction and Supply',
        author_role = 'MCPA Construction & Supply'
    WHERE 1=1;
  `);

  const users = await db.query("SELECT user_id, email, full_name, role, avatar_url FROM users ORDER BY user_id ASC;");
  console.log("Updated Users:", users.rows);

  const posts = await db.query("SELECT post_id, title, author_name, author_role FROM blog_posts LIMIT 5;");
  console.log("Updated Blog Posts:", posts.rows);

  console.log("Admin identity update completed!");
  process.exit(0);
}

updateAdminIdentity().catch((err) => {
  console.error("Error updating admin identity:", err);
  process.exit(1);
});
