/**
 * MCPA Construction & Supply — Email Marketing & Campaign Management Schema Guard
 * 
 * Creates & verifies the tables for:
 * 1. public.email_subscribers (consent-driven subscribers & footer signups)
 * 2. public.email_templates (rich block-based reusable email designs)
 * 3. public.email_campaigns (campaigns, recurring schedules, and audience definitions)
 * 4. public.email_campaign_logs (delivery and recipient event tracking)
 * 5. public.email_suppression_list (unsubscribed/bounced emails to protect sender reputation)
 * 
 * Works across Supabase and Neon via dbFailoverEngine.
 */

const crypto = require("crypto");
const db = require("./dbFailoverEngine");

const EMAIL_MARKETING_TABLE_DDL = [
  // 1. Email Subscribers
  `CREATE TABLE IF NOT EXISTS public.email_subscribers (
    subscriber_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SUBSCRIBED',
    source VARCHAR(100) DEFAULT 'FOOTER',
    marketing_consent BOOLEAN DEFAULT TRUE,
    consent_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(100),
    unsubscribe_token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 2. Email Templates
  `CREATE TABLE IF NOT EXISTS public.email_templates (
    template_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Announcement',
    subject_default VARCHAR(255),
    preview_text VARCHAR(255),
    blocks JSONB DEFAULT '[]'::jsonb,
    html_content TEXT,
    thumbnail_url TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 3. Email Campaigns
  `CREATE TABLE IF NOT EXISTS public.email_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    preview_text VARCHAR(255),
    from_name VARCHAR(100) DEFAULT 'MCPA Construction & Supply',
    from_email VARCHAR(255) DEFAULT 'contact@mcpaconstruction.com',
    reply_to VARCHAR(255) DEFAULT 'contact@mcpaconstruction.com',
    logo_config JSONB DEFAULT '{"position":"top-center","width":180,"height":"auto","padding":20,"link":"https://mcpaconstruction.com"}'::jsonb,
    blocks JSONB DEFAULT '[]'::jsonb,
    html_content TEXT,
    plain_text TEXT,
    target_audience VARCHAR(100) DEFAULT 'ALL_SUBSCRIBERS',
    status VARCHAR(50) DEFAULT 'DRAFT',
    scheduled_at TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(50),
    recurring_next_run TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ
  );`,

  // 4. Campaign Delivery Logs
  `CREATE TABLE IF NOT EXISTS public.email_campaign_logs (
    log_id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES public.email_campaigns(campaign_id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACCEPTED',
    provider_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // 5. Suppression List
  `CREATE TABLE IF NOT EXISTS public.email_suppression_list (
    suppression_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    reason VARCHAR(100) DEFAULT 'UNSUBSCRIBED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

  // Performance Indexes
  `CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.email_subscribers(email);`,
  `CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.email_subscribers(status);`,
  `CREATE INDEX IF NOT EXISTS idx_subscribers_token ON public.email_subscribers(unsubscribe_token);`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.email_campaigns(status);`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON public.email_campaigns(scheduled_at);`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON public.email_campaign_logs(campaign_id);`,
  `CREATE INDEX IF NOT EXISTS idx_suppression_email ON public.email_suppression_list(email);`,
];

const SEED_TEMPLATES = [
  {
    title: "Company Architectural Milestone Announcement",
    category: "Announcement",
    subject_default: "Milestone Update: New Architectural Horizons with MCPA Construction",
    preview_text: "Discover our latest structural innovations and sustainable developments.",
    blocks: [
      {
        id: "logo-1",
        type: "logo",
        data: {
          src: "/images/mcpa-logo-dark.png",
          alt: "MCPA Construction",
          position: "top-center",
          width: 190,
          link: "https://mcpaconstruction.com"
        }
      },
      {
        id: "head-1",
        type: "heading",
        data: {
          text: "Building the Future: Our 2026 Architectural Milestones",
          level: "h1",
          align: "center",
          color: "#0f172a"
        }
      },
      {
        id: "sub-1",
        type: "subheading",
        data: {
          text: "Premium Residential & Commercial Engineering Across Central Luzon",
          align: "center",
          color: "#d97706"
        }
      },
      {
        id: "img-1",
        type: "image",
        data: {
          src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          alt: "Modern Villa Residence",
          caption: "Custom Scandinavian Residence in Bulacan by MCPA",
          width: "100%",
          align: "center",
          link: "https://mcpaconstruction.com/projects"
        }
      },
      {
        id: "p-1",
        type: "paragraph",
        data: {
          text: "We are thrilled to unveil our completed modern residential projects featuring earthquake-resistant engineering, high-efficiency solar integration, and smart home provisions. Whether you are planning a modern family home or a commercial establishment, our in-house supply and licensed architects are ready to bring your vision to life.",
          align: "left",
          color: "#334155"
        }
      },
      {
        id: "btn-1",
        type: "button",
        data: {
          text: "Schedule a Site Consultation",
          url: "https://mcpaconstruction.com/inquire",
          align: "center",
          bgColor: "#d97706",
          textColor: "#ffffff",
          borderRadius: 8
        }
      },
      {
        id: "footer-1",
        type: "footer",
        data: {
          company: "MCPA Construction & Supply",
          address: "Plaridel, Bulacan, Philippines",
          phone: "+63 917 123 4567",
          website: "https://mcpaconstruction.com"
        }
      }
    ]
  },
  {
    title: "Client Project Progress Briefing",
    category: "Progress",
    subject_default: "Your Build Progress Briefing — Structural Framing & Clearances",
    preview_text: "Weekly on-site inspections, materials arrival, and construction updates.",
    blocks: [
      {
        id: "logo-1",
        type: "logo",
        data: {
          src: "/images/mcpa-logo-dark.png",
          alt: "MCPA Construction",
          position: "top-left",
          width: 170,
          link: "https://mcpaconstruction.com"
        }
      },
      {
        id: "head-1",
        type: "heading",
        data: {
          text: "Project Progress Briefing",
          level: "h2",
          align: "left",
          color: "#0f172a"
        }
      },
      {
        id: "p-1",
        type: "paragraph",
        data: {
          text: "Dear Valued Client,\n\nHere is your official project update for the current construction phase. Our licensed site engineers have concluded the concrete curing tests and foundation structural reinforcement inspections.",
          align: "left",
          color: "#334155"
        }
      },
      {
        id: "gallery-1",
        type: "gallery",
        data: {
          images: [
            {
              src: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=600&q=80",
              caption: "Ground Foundation Curing"
            },
            {
              src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
              caption: "Second Floor Rebar Grid Installation"
            }
          ]
        }
      },
      {
        id: "btn-1",
        type: "button",
        data: {
          text: "View Live Construction Camera",
          url: "https://mcpaconstruction.com/portal",
          align: "center",
          bgColor: "#0f172a",
          textColor: "#ffffff",
          borderRadius: 8
        }
      },
      {
        id: "footer-1",
        type: "footer",
        data: {
          company: "MCPA Construction & Supply",
          address: "Plaridel, Bulacan, Philippines",
          phone: "+63 917 123 4567",
          website: "https://mcpaconstruction.com"
        }
      }
    ]
  },
  {
    title: "Flexible Financing & In-House Supply Promotion",
    category: "Promotion",
    subject_default: "Special Offer: 0% Interest Milestone Plans with In-House Supply",
    preview_text: "Lock in wholesale building material rates before year-end price adjustments.",
    blocks: [
      {
        id: "logo-1",
        type: "logo",
        data: {
          src: "/images/mcpa-logo-dark.png",
          alt: "MCPA Construction",
          position: "top-center",
          width: 180,
          link: "https://mcpaconstruction.com"
        }
      },
      {
        id: "head-1",
        type: "heading",
        data: {
          text: "Lock In Wholesale Material Rates for Your 2026 Dream Home",
          level: "h1",
          align: "center",
          color: "#0f172a"
        }
      },
      {
        id: "p-1",
        type: "paragraph",
        data: {
          text: "With MCPA's direct hardware and concrete supply network, we eliminate middleman markup. Enjoy guaranteed fixed-price contracts and flexible bank/Pag-IBIG financing assistance.",
          align: "center",
          color: "#475569"
        }
      },
      {
        id: "btn-1",
        type: "button",
        data: {
          text: "Calculate Your Estimated Construction Cost",
          url: "https://mcpaconstruction.com/estimator",
          align: "center",
          bgColor: "#d97706",
          textColor: "#ffffff",
          borderRadius: 8
        }
      },
      {
        id: "footer-1",
        type: "footer",
        data: {
          company: "MCPA Construction & Supply",
          address: "Plaridel, Bulacan, Philippines",
          phone: "+63 917 123 4567",
          website: "https://mcpaconstruction.com"
        }
      }
    ]
  }
];

let schemaInitialized = false;

async function applyToPool(pool, poolName) {
  if (!pool) return;
  const client = await pool.connect();
  try {
    for (const ddl of EMAIL_MARKETING_TABLE_DDL) {
      await client.query(ddl);
    }
    console.log(`[emailMarketingSchema] Successfully initialized DDL on ${poolName}.`);
  } catch (err) {
    console.error(`[emailMarketingSchema] Error applying DDL on ${poolName}:`, err.message);
  } finally {
    client.release();
  }
}

async function seedDefaultTemplates() {
  try {
    const existing = await db.query("SELECT COUNT(*) AS count FROM public.email_templates;");
    const count = parseInt(existing?.rows?.[0]?.count || 0, 10);
    if (count === 0) {
      for (const tpl of SEED_TEMPLATES) {
        await db.query(
          `INSERT INTO public.email_templates 
           (title, category, subject_default, preview_text, blocks, is_system, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, CURRENT_TIMESTAMP);`,
          [tpl.title, tpl.category, tpl.subject_default, tpl.preview_text, JSON.stringify(tpl.blocks)]
        );
      }
      console.log(`[emailMarketingSchema] Seeded ${SEED_TEMPLATES.length} pre-built email templates.`);
    }
  } catch (err) {
    console.warn("[emailMarketingSchema] Seed error:", err.message);
  }
}

async function ensureEmailMarketingSchema() {
  if (schemaInitialized) return true;
  try {
    if (db.isMockActive) {
      console.log("[emailMarketingSchema] Mock active; skipping PostgreSQL DDL.");
      schemaInitialized = true;
      return true;
    }

    await applyToPool(db.supabasePool, "supabase");
    await applyToPool(db.neonPool, "neon");
    await seedDefaultTemplates();
    schemaInitialized = true;
    return true;
  } catch (err) {
    console.error("[emailMarketingSchema] Failed to ensure schema:", err);
    return false;
  }
}

module.exports = {
  ensureEmailMarketingSchema,
  SEED_TEMPLATES
};
