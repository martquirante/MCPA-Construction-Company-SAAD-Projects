const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function runCmsMigration() {
  console.log("=== STARTING MCPA BLOG & DYNAMIC CMS DATABASE MIGRATION ===");

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  const migrationSql = `
    -- 1. Blog Categories
    CREATE TABLE IF NOT EXISTS blog_categories (
      category_id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      icon VARCHAR(50) DEFAULT 'FolderIcon',
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Blog Hashtags
    CREATE TABLE IF NOT EXISTS blog_hashtags (
      hashtag_id SERIAL PRIMARY KEY,
      tag VARCHAR(100) NOT NULL UNIQUE,
      display_tag VARCHAR(100) NOT NULL,
      usage_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Media Library
    CREATE TABLE IF NOT EXISTS media_library (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      file_name VARCHAR(255),
      file_url TEXT NOT NULL UNIQUE,
      thumbnail_url TEXT,
      file_type VARCHAR(50) DEFAULT 'image/jpeg',
      category VARCHAR(50) DEFAULT 'blog',
      file_size BIGINT DEFAULT 0,
      dimensions VARCHAR(50),
      uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      usage_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Blog Posts
    CREATE TABLE IF NOT EXISTS blog_posts (
      post_id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      slug VARCHAR(280) NOT NULL UNIQUE,
      caption TEXT NOT NULL,
      content TEXT,
      post_type VARCHAR(50) DEFAULT 'update',
      author_id INT REFERENCES users(user_id) ON DELETE SET NULL,
      author_name VARCHAR(150) DEFAULT 'MCPA Directorate',
      author_role VARCHAR(100) DEFAULT 'Executive Directorate',
      author_avatar TEXT,
      category_id INT REFERENCES blog_categories(category_id) ON DELETE SET NULL,
      featured_image TEXT,
      status VARCHAR(30) DEFAULT 'published',
      published_at TIMESTAMPTZ DEFAULT NOW(),
      scheduled_for TIMESTAMPTZ,
      view_count INT DEFAULT 0,
      likes_count INT DEFAULT 0,
      shares_count INT DEFAULT 0,
      layout_preference VARCHAR(30) DEFAULT 'feed',
      link_preview JSONB DEFAULT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Blog Post Media (Multi-image & video attachment)
    CREATE TABLE IF NOT EXISTS blog_post_media (
      media_id SERIAL PRIMARY KEY,
      post_id INT REFERENCES blog_posts(post_id) ON DELETE CASCADE,
      media_type VARCHAR(20) NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      caption TEXT,
      alt_text TEXT,
      aspect_ratio VARCHAR(20) DEFAULT '16/9',
      display_order INT DEFAULT 0,
      file_size BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. Blog Post Hashtag Pivot
    CREATE TABLE IF NOT EXISTS blog_post_hashtags (
      post_id INT REFERENCES blog_posts(post_id) ON DELETE CASCADE,
      hashtag_id INT REFERENCES blog_hashtags(hashtag_id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, hashtag_id)
    );

    -- 7. Website-Wide Dynamic Content Store
    CREATE TABLE IF NOT EXISTS website_content (
      content_id SERIAL PRIMARY KEY,
      page_key VARCHAR(50) NOT NULL,
      section_key VARCHAR(50) NOT NULL,
      content_key VARCHAR(100) NOT NULL,
      content_value TEXT NOT NULL,
      content_type VARCHAR(30) DEFAULT 'text',
      last_modified_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_page_section_content UNIQUE (page_key, section_key, content_key)
    );

    -- 8. Website Theme & Appearance Settings
    CREATE TABLE IF NOT EXISTS theme_settings (
      setting_id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value JSONB NOT NULL,
      updated_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 9. Admin Activity Logs
    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      log_id SERIAL PRIMARY KEY,
      admin_id INT REFERENCES users(user_id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(100),
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create Indexes for High Performance
    CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_blog_post_media_post_order ON blog_post_media(post_id, display_order ASC);
    CREATE INDEX IF NOT EXISTS idx_website_content_page_section ON website_content(page_key, section_key);
    CREATE INDEX IF NOT EXISTS idx_blog_hashtags_tag ON blog_hashtags(tag);

    -- Drop cross-pool FK constraints where sequence drift could block async dual-write replication
    ALTER TABLE media_library DROP CONSTRAINT IF EXISTS media_library_uploaded_by_fkey;
    ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
    ALTER TABLE blog_post_media DROP CONSTRAINT IF EXISTS blog_post_media_post_id_fkey;
    ALTER TABLE blog_post_hashtags DROP CONSTRAINT IF EXISTS blog_post_hashtags_post_id_fkey;
    ALTER TABLE blog_post_hashtags DROP CONSTRAINT IF EXISTS blog_post_hashtags_hashtag_id_fkey;
    ALTER TABLE website_content DROP CONSTRAINT IF EXISTS website_content_last_modified_by_fkey;
    ALTER TABLE theme_settings DROP CONSTRAINT IF EXISTS theme_settings_updated_by_fkey;
    ALTER TABLE admin_activity_logs DROP CONSTRAINT IF EXISTS admin_activity_logs_admin_id_fkey;
  `;

  for (const { name, pool } of pools) {
    if (!pool) {
      console.log(`[SKIP] ${name} is null.`);
      continue;
    }
    try {
      console.log(`\nApplying CMS migration to ${name}...`);
      await pool.query(migrationSql);
      console.log(`✓ Migration tables & indexes successfully established on ${name}.`);
    } catch (err) {
      console.error(`✗ Error migrating ${name}:`, err.message);
    }
  }

  console.log("\n=== SEEDING INITIAL CATEGORIES, HASHTAGS, THEME & CONTENT ===");

  const seedCategories = [
    { name: "Project Updates", slug: "project-updates", description: "Real-time construction progress and on-site logs.", icon: "HammerIcon", display_order: 1 },
    { name: "Announcements", slug: "announcements", description: "Official corporate memos, notices, and press releases.", icon: "MegaphoneIcon", display_order: 2 },
    { name: "Completed Works", slug: "completed-works", description: "Turned over residential and commercial projects.", icon: "CheckCircleIcon", display_order: 3 },
    { name: "Behind the Scenes", slug: "behind-the-scenes", description: "Engineering craft, materials testing, and site life.", icon: "CameraIcon", display_order: 4 },
    { name: "Design & Architectural Insights", slug: "architectural-insights", description: "Design tips, structural concepts, and plan reviews.", icon: "CompassIcon", display_order: 5 },
    { name: "Build Now Pay Later", slug: "build-now-pay-later", description: "Financing programs and Pag-IBIG loan guidance.", icon: "CreditCardIcon", display_order: 6 }
  ];

  const seedHashtags = [
    { tag: "mcpaconstruction", display_tag: "#MCPAConstruction" },
    { tag: "constructionprogress", display_tag: "#ConstructionProgress" },
    { tag: "modernhouse", display_tag: "#ModernHouse" },
    { tag: "projectupdates", display_tag: "#ProjectUpdates" },
    { tag: "designandbuild", display_tag: "#DesignAndBuild" },
    { tag: "builttolast", display_tag: "#BuiltToLast" },
    { tag: "bulacancontractor", display_tag: "#BulacanContractor" },
    { tag: "architecturaldesign", display_tag: "#ArchitecturalDesign" },
    { tag: "buildnowpaylater", display_tag: "#BuildNowPayLater" }
  ];

  const defaultTheme = {
    primaryColor: "#f59e0b",
    secondaryColor: "#5b6770",
    accentColor: "#d97706",
    surfaceLight: "#f8f7f5",
    surfaceDark: "#080a0e",
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Plus Jakarta Sans",
    borderRadius: "8px",
    presetName: "MCPA Signature Amber"
  };

  const defaultContent = [
    // Home Page Hero
    { page_key: "home", section_key: "hero", content_key: "badge", content_type: "text", content_value: "Bulacan's Premier Design & Build Contractor" },
    { page_key: "home", section_key: "hero", content_key: "heading_line1", content_type: "text", content_value: "Built with Integrity." },
    { page_key: "home", section_key: "hero", content_key: "heading_line2", content_type: "text", content_value: "Engineered to Last." },
    { page_key: "home", section_key: "hero", content_key: "description", content_type: "text", content_value: "Full-service general engineering contractor specializing in custom architectural residences, Build Now Pay Later financing, commercial structures, and certified signed & sealed engineering plans." },
    { page_key: "home", section_key: "hero", content_key: "cta_primary_label", content_type: "text", content_value: "Start Your Project Brief" },
    { page_key: "home", section_key: "hero", content_key: "cta_primary_link", content_type: "text", content_value: "/book" },
    { page_key: "home", section_key: "hero", content_key: "cta_secondary_label", content_type: "text", content_value: "Explore Projects Showcase" },
    { page_key: "home", section_key: "hero", content_key: "cta_secondary_link", content_type: "text", content_value: "/projects" },

    // Home Page Stats
    { page_key: "home", section_key: "stats", content_key: "stat1_value", content_type: "text", content_value: "100%" },
    { page_key: "home", section_key: "stats", content_key: "stat1_label", content_type: "text", content_value: "Structural Integrity Passed" },
    { page_key: "home", section_key: "stats", content_key: "stat2_value", content_type: "text", content_value: "₱0" },
    { page_key: "home", section_key: "stats", content_key: "stat2_label", content_type: "text", content_value: "Hidden Charges Guarantee" },
    { page_key: "home", section_key: "stats", content_key: "stat3_value", content_type: "text", content_value: "49821" },
    { page_key: "home", section_key: "stats", content_key: "stat3_label", content_type: "text", content_value: "Official PCAB License" },
    { page_key: "home", section_key: "stats", content_key: "stat4_value", content_type: "text", content_value: "15+ Yrs" },
    { page_key: "home", section_key: "stats", content_key: "stat4_label", content_type: "text", content_value: "Combined Engineering Leadership" },

    // Contact Information
    { page_key: "contact", section_key: "info", content_key: "address", content_type: "text", content_value: "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan 3004, Philippines" },
    { page_key: "contact", section_key: "info", content_key: "hotline", content_type: "text", content_value: "(+63) 949 775 8239" },
    { page_key: "contact", section_key: "info", content_key: "email", content_type: "text", content_value: "contact@mcpaconstruction.com" },
    { page_key: "contact", section_key: "info", content_key: "alt_email", content_type: "text", content_value: "mcpa.construction@gmail.com" },
    { page_key: "contact", section_key: "info", content_key: "office_hours", content_type: "text", content_value: "Monday – Saturday: 8:00 AM – 5:00 PM" },
    { page_key: "contact", section_key: "info", content_key: "facebook_url", content_type: "text", content_value: "https://www.facebook.com/MCPA.ConstructionandSupply/" },
    { page_key: "contact", section_key: "info", content_key: "instagram_url", content_type: "text", content_value: "https://www.instagram.com/mcpa.constructionandsupply/" },
    { page_key: "contact", section_key: "info", content_key: "tiktok_url", content_type: "text", content_value: "https://www.tiktok.com/@mcpa.construction" },

    // Global / Footer
    { page_key: "footer", section_key: "general", content_key: "tagline", content_type: "text", content_value: "Design and build engineering contractor headquartered in Plaridel, Bulacan. Providing transparent project delivery, certified engineering plans, and turnkey construction." },
    { page_key: "footer", section_key: "general", content_key: "copyright", content_type: "text", content_value: "© 2026 MCPA Construction and Supply. All rights reserved." }
  ];

  for (const { name, pool } of pools) {
    if (!pool) continue;
    try {
      // Seed Categories
      for (const cat of seedCategories) {
        await pool.query(`
          INSERT INTO blog_categories (name, slug, description, icon, display_order)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug) DO UPDATE SET 
            name = EXCLUDED.name, 
            description = EXCLUDED.description, 
            icon = EXCLUDED.icon;
        `, [cat.name, cat.slug, cat.description, cat.icon, cat.display_order]);
      }

      // Seed Hashtags
      for (const tag of seedHashtags) {
        await pool.query(`
          INSERT INTO blog_hashtags (tag, display_tag, usage_count)
          VALUES ($1, $2, 5)
          ON CONFLICT (tag) DO NOTHING;
        `, [tag.tag, tag.display_tag]);
      }

      // Seed Theme
      await pool.query(`
        INSERT INTO theme_settings (setting_key, setting_value)
        VALUES ('active_theme', $1)
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
      `, [JSON.stringify(defaultTheme)]);

      // Seed Website Content
      for (const c of defaultContent) {
        await pool.query(`
          INSERT INTO website_content (page_key, section_key, content_key, content_type, content_value)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (page_key, section_key, content_key) 
          DO UPDATE SET content_value = EXCLUDED.content_value;
        `, [c.page_key, c.section_key, c.content_key, c.content_type, c.content_value]);
      }

      console.log(`✓ Seeded categories, hashtags, theme, and website content on ${name}.`);
    } catch (err) {
      console.error(`✗ Error seeding ${name}:`, err.message);
    }
  }

  console.log("\n=== DATABASE MIGRATION COMPLETED (NO DUMMY POSTS) ===");
  if (require.main === module) {
    process.exit(0);
  }
}

if (require.main === module) {
  runCmsMigration();
}

module.exports = { runCmsMigration };

runCmsMigration().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
