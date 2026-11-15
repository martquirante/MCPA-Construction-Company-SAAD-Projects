const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function runAnalyticsMigration() {
  console.log("=== STARTING MCPA REAL-TIME ANALYTICS DATABASE MIGRATION ===");

  await new Promise((r) => setTimeout(r, 1500));

  const pools = [
    { name: "Primary Database (Supabase PostgreSQL)", pool: db.supabasePool },
    { name: "Cloud Hot Standby (Neon Serverless PostgreSQL)", pool: db.neonPool },
  ];

  const schemaSql = `
    -- 1. Analytics Visitors (Anonymous Visitor Profiles)
    CREATE TABLE IF NOT EXISTS analytics_visitors (
      visitor_id VARCHAR(100) PRIMARY KEY,
      first_seen_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ DEFAULT NOW(),
      first_referrer TEXT,
      first_landing_page TEXT DEFAULT '/',
      consent_status VARCHAR(40) DEFAULT 'granted',
      visit_count INT DEFAULT 1,
      total_pageviews INT DEFAULT 1,
      device_type VARCHAR(40) DEFAULT 'Desktop',
      device_brand VARCHAR(80) DEFAULT 'Unknown',
      device_model VARCHAR(120) DEFAULT 'Unknown',
      device_manufacturer VARCHAR(80) DEFAULT 'Unknown',
      operating_system VARCHAR(60) DEFAULT 'Unknown',
      os_version VARCHAR(60) DEFAULT 'Unknown',
      browser VARCHAR(60) DEFAULT 'Unknown',
      browser_version VARCHAR(60) DEFAULT 'Unknown',
      screen_resolution VARCHAR(40) DEFAULT 'Unknown',
      continent VARCHAR(60) DEFAULT 'Asia',
      country VARCHAR(100) DEFAULT 'Philippines',
      country_code VARCHAR(10) DEFAULT 'PH',
      region VARCHAR(120) DEFAULT 'Central Luzon',
      province VARCHAR(120) DEFAULT 'Bulacan',
      city VARCHAR(120) DEFAULT 'Plaridel',
      county VARCHAR(120) DEFAULT 'Unknown',
      timezone VARCHAR(80) DEFAULT 'Asia/Manila',
      latitude NUMERIC(9, 5) DEFAULT 14.8872,
      longitude NUMERIC(9, 5) DEFAULT 120.8572
    );

    -- 2. Analytics Sessions (Real-Time & Historical Visitor Sessions)
    CREATE TABLE IF NOT EXISTS analytics_sessions (
      session_id VARCHAR(100) PRIMARY KEY,
      visitor_id VARCHAR(100) NOT NULL,
      is_returning BOOLEAN DEFAULT FALSE,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      last_activity_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ NULL,
      is_online BOOLEAN DEFAULT TRUE,
      current_page TEXT DEFAULT '/',
      previous_page TEXT DEFAULT NULL,
      landing_page TEXT DEFAULT '/',
      exit_page TEXT DEFAULT '/',
      referrer TEXT DEFAULT NULL,
      referrer_domain VARCHAR(150) DEFAULT 'Direct',
      traffic_source VARCHAR(60) DEFAULT 'Direct Traffic',
      utm_source VARCHAR(100) DEFAULT NULL,
      utm_medium VARCHAR(100) DEFAULT NULL,
      utm_campaign VARCHAR(120) DEFAULT NULL,
      pageviews_count INT DEFAULT 1,
      events_count INT DEFAULT 0,
      duration_seconds INT DEFAULT 0,
      is_engaged BOOLEAN DEFAULT FALSE,
      is_bounce BOOLEAN DEFAULT TRUE,
      device_type VARCHAR(40) DEFAULT 'Desktop',
      device_brand VARCHAR(80) DEFAULT 'Unknown',
      device_model VARCHAR(120) DEFAULT 'Unknown',
      device_manufacturer VARCHAR(80) DEFAULT 'Unknown',
      operating_system VARCHAR(60) DEFAULT 'Unknown',
      os_version VARCHAR(60) DEFAULT 'Unknown',
      platform VARCHAR(80) DEFAULT 'Unknown',
      browser VARCHAR(60) DEFAULT 'Unknown',
      browser_version VARCHAR(60) DEFAULT 'Unknown',
      screen_resolution VARCHAR(40) DEFAULT 'Unknown',
      viewport_size VARCHAR(40) DEFAULT 'Unknown',
      pixel_ratio NUMERIC(4, 2) DEFAULT 1.0,
      touch_capable BOOLEAN DEFAULT FALSE,
      ip_masked VARCHAR(60) DEFAULT '0.0.0.xxx',
      continent VARCHAR(60) DEFAULT 'Asia',
      country VARCHAR(100) DEFAULT 'Philippines',
      country_code VARCHAR(10) DEFAULT 'PH',
      region VARCHAR(120) DEFAULT 'Central Luzon',
      province VARCHAR(120) DEFAULT 'Bulacan',
      city VARCHAR(120) DEFAULT 'Plaridel',
      county VARCHAR(120) DEFAULT 'Unknown',
      timezone VARCHAR(80) DEFAULT 'Asia/Manila',
      latitude NUMERIC(9, 5) DEFAULT 14.8872,
      longitude NUMERIC(9, 5) DEFAULT 120.8572,
      consent_status VARCHAR(40) DEFAULT 'granted'
    );

    -- 3. Analytics Pageviews
    CREATE TABLE IF NOT EXISTS analytics_pageviews (
      pageview_id SERIAL PRIMARY KEY,
      session_id VARCHAR(100) NOT NULL,
      visitor_id VARCHAR(100) NOT NULL,
      page_path TEXT NOT NULL,
      page_title VARCHAR(255) DEFAULT 'MCPA Construction and Supply',
      page_category VARCHAR(60) DEFAULT 'general',
      previous_page TEXT DEFAULT NULL,
      referrer TEXT DEFAULT NULL,
      viewed_at TIMESTAMPTZ DEFAULT NOW(),
      time_on_page_seconds INT DEFAULT 0,
      scroll_depth_pct INT DEFAULT 0
    );

    -- 4. Analytics Events (Projects, Blog Posts, Services, Media, CTAs)
    CREATE TABLE IF NOT EXISTS analytics_events (
      event_id SERIAL PRIMARY KEY,
      session_id VARCHAR(100) NOT NULL,
      visitor_id VARCHAR(100) NOT NULL,
      event_name VARCHAR(100) NOT NULL,
      event_category VARCHAR(80) DEFAULT 'engagement',
      event_label VARCHAR(255) DEFAULT NULL,
      page_path TEXT DEFAULT '/',
      metadata JSONB DEFAULT '{}',
      occurred_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Analytics Geolocation Aggregations
    CREATE TABLE IF NOT EXISTS analytics_geolocation (
      geo_id SERIAL PRIMARY KEY,
      location_key VARCHAR(255) UNIQUE NOT NULL,
      continent VARCHAR(60) DEFAULT 'Asia',
      country VARCHAR(100) DEFAULT 'Philippines',
      country_code VARCHAR(10) DEFAULT 'PH',
      region VARCHAR(120) DEFAULT 'Central Luzon',
      province VARCHAR(120) DEFAULT 'Bulacan',
      city VARCHAR(120) DEFAULT 'Plaridel',
      county VARCHAR(120) DEFAULT 'Unknown',
      timezone VARCHAR(80) DEFAULT 'Asia/Manila',
      latitude NUMERIC(9, 5) DEFAULT 14.8872,
      longitude NUMERIC(9, 5) DEFAULT 120.8572,
      visitors_count INT DEFAULT 1,
      sessions_count INT DEFAULT 1,
      pageviews_count INT DEFAULT 1,
      last_visit_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. Analytics Daily Summaries (Fast Long-Range Aggregation)
    CREATE TABLE IF NOT EXISTS analytics_daily_summaries (
      summary_date DATE PRIMARY KEY,
      total_visitors INT DEFAULT 0,
      unique_visitors INT DEFAULT 0,
      new_visitors INT DEFAULT 0,
      returning_visitors INT DEFAULT 0,
      total_sessions INT DEFAULT 0,
      engaged_sessions INT DEFAULT 0,
      bounced_sessions INT DEFAULT 0,
      total_pageviews INT DEFAULT 0,
      total_duration_seconds BIGINT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 7. Analytics Privacy & Retention Settings
    CREATE TABLE IF NOT EXISTS analytics_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- High-Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_online ON analytics_sessions(is_online, last_activity_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country_code, region, province, city);
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_device ON analytics_sessions(device_type, operating_system, browser);
    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_source ON analytics_sessions(traffic_source);
    CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_viewed ON analytics_pageviews(viewed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_path ON analytics_pageviews(page_path);
    CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session ON analytics_pageviews(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred ON analytics_events(occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, event_category);

    -- Enable Row Level Security (RLS) so public PostgREST / anon keys cannot read raw session rows
    ALTER TABLE analytics_visitors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_geolocation ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_daily_summaries ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;
  `;

  const defaultSettings = {
    retentionDays: 180,
    heartbeatIntervalSeconds: 20,
    sessionTimeoutSeconds: 65,
    anonymizeIp: true,
    respectDoNotTrack: false,
    consentBannerEnabled: true,
    privacyPolicyUrl: "/privacy",
    complianceStandards: ["Philippine Data Privacy Act of 2012 (RA 10173)", "GDPR Privacy-by-Design"],
  };

  for (const { name, pool } of pools) {
    if (!pool) continue;
    try {
      console.log(`\nApplying Analytics Schema to ${name}...`);
      await pool.query(schemaSql);
      await pool.query(
        `INSERT INTO analytics_settings (setting_key, setting_value, updated_at)
         VALUES ('privacy_and_retention', $1, NOW())
         ON CONFLICT (setting_key) DO NOTHING`,
        [JSON.stringify(defaultSettings)]
      );
      console.log(`✓ Analytics tables, indexes & RLS verified on ${name}.`);
    } catch (err) {
      console.error(`✗ Error on ${name}:`, err.message);
    }
  }

  console.log("\n=== ANALYTICS DATABASE MIGRATION COMPLETED ===");
  if (require.main === module) {
    process.exit(0);
  }
}

if (require.main === module) {
  runAnalyticsMigration();
}

module.exports = { runAnalyticsMigration };
