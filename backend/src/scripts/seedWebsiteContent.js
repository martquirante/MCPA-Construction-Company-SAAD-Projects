const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../services/dbFailoverEngine");

async function seedComprehensiveWebsiteContent() {
  const fullContent = [
    // HOME - HERO
    { page_key: "home", section_key: "hero", content_key: "heroBadge", content_type: "text", content_value: "Build Now, Pay Later Program Available" },
    { page_key: "home", section_key: "hero", content_key: "heroHeading", content_type: "text", content_value: "Looking to turn your ideas into reality?" },
    { page_key: "home", section_key: "hero", content_key: "heroSubPre", content_type: "text", content_value: "Collaborate with us at " },
    { page_key: "home", section_key: "hero", content_key: "heroSubBold", content_type: "text", content_value: "MCPA Construction and Supply" },
    { page_key: "home", section_key: "hero", content_key: "heroSubPost", content_type: "text", content_value: " and let's build your enduring legacy." },
    { page_key: "home", section_key: "hero", content_key: "bookAppointment", content_type: "text", content_value: "Inquire Now!" },
    { page_key: "home", section_key: "hero", content_key: "heroImage", content_type: "image", content_value: "/assets/hero-residence-day-wide-v2.jpg" },

    // HOME - OVERVIEW & PILLARS
    { page_key: "home", section_key: "overview", content_key: "overviewEyebrow", content_type: "text", content_value: "Quality Construction · Direct Materials" },
    { page_key: "home", section_key: "overview", content_key: "overviewHeading", content_type: "text", content_value: "Why Homeowners Build With MCPA" },
    { page_key: "home", section_key: "overview", content_key: "overviewDescription", content_type: "text", content_value: "No guesswork and no hidden fees. We provide clear communication, regular photo updates, and guaranteed quality materials so you always know how your home is being built." },
    { page_key: "home", section_key: "overview", content_key: "pillarStrengthTitle", content_type: "text", content_value: "Built For Lasting Strength" },
    { page_key: "home", section_key: "overview", content_key: "pillarStrengthDescription", content_type: "text", content_value: "Reinforced concrete, certified steel framing, and solid engineering built to keep your family safe against typhoons and earthquakes." },
    { page_key: "home", section_key: "overview", content_key: "pillarUpdatesTitle", content_type: "text", content_value: "Clear Photo & Progress Updates" },
    { page_key: "home", section_key: "overview", content_key: "pillarUpdatesDescription", content_type: "text", content_value: "Regular photo updates and status reports sent directly to your phone and online portal from foundation up to key turnover." },
    { page_key: "home", section_key: "overview", content_key: "pillarPaymentTitle", content_type: "text", content_value: "Build Now, Pay Later Program" },
    { page_key: "home", section_key: "overview", content_key: "pillarPaymentDescription", content_type: "text", content_value: "Flexible payment options and clear stage-by-stage billing, so you only pay as each verified phase of your home is completed." },

    // HOME - STATS
    { page_key: "home", section_key: "stats", content_key: "stat1_value", content_type: "text", content_value: "100%" },
    { page_key: "home", section_key: "stats", content_key: "stat1_label", content_type: "text", content_value: "Structural Integrity Passed" },
    { page_key: "home", section_key: "stats", content_key: "stat2_value", content_type: "text", content_value: "15-Yr" },
    { page_key: "home", section_key: "stats", content_key: "stat2_label", content_type: "text", content_value: "Structural Warranty Guarantee" },
    { page_key: "home", section_key: "stats", content_key: "stat3_value", content_type: "text", content_value: "49821" },
    { page_key: "home", section_key: "stats", content_key: "stat3_label", content_type: "text", content_value: "Official PCAB License" },
    { page_key: "home", section_key: "stats", content_key: "stat4_value", content_type: "text", content_value: "24/7" },
    { page_key: "home", section_key: "stats", content_key: "stat4_label", content_type: "text", content_value: "Client Portal Tracking" },

    // SERVICES
    { page_key: "services", section_key: "highlights", content_key: "whatWeDo", content_type: "text", content_value: "What We Do" },
    { page_key: "services", section_key: "highlights", content_key: "servicesThat", content_type: "text", content_value: "Services That" },
    { page_key: "services", section_key: "highlights", content_key: "defineEras", content_type: "text", content_value: "Define Eras" },
    { page_key: "services", section_key: "highlights", content_key: "servicesSubtitle", content_type: "text", content_value: "We build on time and built to last. We work closely with you from initial idea to completed build, creating a home your family can enjoy for generations." },
    { page_key: "services", section_key: "highlights", content_key: "serviceTurnkeyTag", content_type: "text", content_value: "Turnkey Design & Build" },
    { page_key: "services", section_key: "highlights", content_key: "serviceTurnkeyTitle", content_type: "text", content_value: "Custom Residential" },
    { page_key: "services", section_key: "highlights", content_key: "serviceTurnkeyDesc", content_type: "text", content_value: "Custom homes designed for your family's daily living. From modern bungalow homes to two-storey family residences with a 15-year structural warranty." },
    { page_key: "services", section_key: "highlights", content_key: "serviceBnplTag", content_type: "text", content_value: "Titled Lot Financing" },
    { page_key: "services", section_key: "highlights", content_key: "serviceBnplTitle", content_type: "text", content_value: "Build Now, Pay Later" },
    { page_key: "services", section_key: "highlights", content_key: "serviceBnplDesc", content_type: "text", content_value: "Special program for titled lot owners across Bulacan and Central Luzon. Build your dream home with flexible payment stages and Pag-IBIG or bank loan assistance." },
    { page_key: "services", section_key: "highlights", content_key: "servicePlansTag", content_type: "text", content_value: "Architectural & Engineering" },
    { page_key: "services", section_key: "highlights", content_key: "servicePlansTitle", content_type: "text", content_value: "Signed & Sealed Plans" },
    { page_key: "services", section_key: "highlights", content_key: "servicePlansDesc", content_type: "text", content_value: "Complete architectural blueprints and structural calculations prepared by licensed professionals, with full assistance in getting city building permits." },
    { page_key: "services", section_key: "highlights", content_key: "serviceSupplyTag", content_type: "text", content_value: "Warehouses & In-House Logistics" },
    { page_key: "services", section_key: "highlights", content_key: "serviceSupplyTitle", content_type: "text", content_value: "Commercial & Project Supply" },
    { page_key: "services", section_key: "highlights", content_key: "serviceSupplyDesc", content_type: "text", content_value: "Commercial buildings, steel warehouses, home renovations, and dedicated in-house materials delivered right to your job site." },

    // PROJECTS
    { page_key: "projects", section_key: "header", content_key: "projectsEyebrow", content_type: "text", content_value: "Architectural Portfolio · Bulacan & Central Luzon" },
    { page_key: "projects", section_key: "header", content_key: "projectsHeading", content_type: "text", content_value: "Selected Works & Completed Builds" },
    { page_key: "projects", section_key: "header", content_key: "projectsDescription", content_type: "text", content_value: "Explore our portfolio of custom residential homes, commercial facilities, and architectural designs engineered for lasting strength." },

    // PROCESS
    { page_key: "process", section_key: "steps", content_key: "processEyebrow", content_type: "text", content_value: "4-Stage Turnkey Methodology" },
    { page_key: "process", section_key: "steps", content_key: "processHeading", content_type: "text", content_value: "How We Build Your Vision" },
    { page_key: "process", section_key: "steps", content_key: "processDescription", content_type: "text", content_value: "A disciplined, transparent 4-stage construction workflow from initial site consultation and architectural blueprints to key turnover." },
    { page_key: "process", section_key: "steps", content_key: "step1_title", content_type: "text", content_value: "Stage 1: Site Consultation & Project Brief" },
    { page_key: "process", section_key: "steps", content_key: "step1_desc", content_type: "text", content_value: "We inspect your lot, discuss your family's spatial needs, target budget, and financing pathway." },
    { page_key: "process", section_key: "steps", content_key: "step2_title", content_type: "text", content_value: "Stage 2: Signed & Sealed Blueprints & Permits" },
    { page_key: "process", section_key: "steps", content_key: "step2_desc", content_type: "text", content_value: "Our architects and civil engineers prepare complete 2D/3D plans, structural analysis, BOM, and process municipal building permits." },
    { page_key: "process", section_key: "steps", content_key: "step3_title", content_type: "text", content_value: "Stage 3: Groundbreaking & Active Construction" },
    { page_key: "process", section_key: "steps", content_key: "step3_desc", content_type: "text", content_value: "Full-scale construction with milestone progress billing, daily site logs, material testing, and real-time client portal updates." },
    { page_key: "process", section_key: "steps", content_key: "step4_title", content_type: "text", content_value: "Stage 4: Final Inspection, Key Turnover & 15-Yr Warranty" },
    { page_key: "process", section_key: "steps", content_key: "step4_desc", content_type: "text", content_value: "Comprehensive punch-list verification, occupancy certificate handover, and activation of your 15-year structural warranty." },

    // ABOUT
    { page_key: "about", section_key: "company", content_key: "aboutTitle", content_type: "text", content_value: "About MCPA Construction" },
    { page_key: "about", section_key: "company", content_key: "aboutSub", content_type: "text", content_value: "Design & Build Contractor · Plaridel, Bulacan" },
    { page_key: "about", section_key: "company", content_key: "aboutBio", content_type: "text", content_value: "Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. We specialize in custom residential homes, modern commercial facilities, warehouse structures, signed and sealed engineering plans, and in-house construction supplies across Bulacan, Metro Manila, and Central Luzon." },
    { page_key: "about", section_key: "company", content_key: "mission", content_type: "text", content_value: "To deliver structurally superior, architecturally refined homes and commercial buildings with 100% billing transparency and direct material supply." },
    { page_key: "about", section_key: "company", content_key: "vision", content_type: "text", content_value: "To be Central Luzon and Metro Manila's most trusted technology-driven design and build construction company." },
    { page_key: "about", section_key: "company", content_key: "warrantyTitle", content_type: "text", content_value: "15-Year Structural Warranty" },
    { page_key: "about", section_key: "company", content_key: "warrantyDesc", content_type: "text", content_value: "Every residential and commercial project constructed by MCPA includes our comprehensive 15-year structural warranty (Civil Code Art. 1723), engineered with certified steel bars and reinforced concrete." },

    // CONTACT
    { page_key: "contact", section_key: "info", content_key: "address", content_type: "text", content_value: "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines" },
    { page_key: "contact", section_key: "info", content_key: "hotline", content_type: "text", content_value: "(0949) 775 8239" },
    { page_key: "contact", section_key: "info", content_key: "email", content_type: "text", content_value: "contact@mcpaconstruction.com" },
    { page_key: "contact", section_key: "info", content_key: "alt_email", content_type: "text", content_value: "mcpa.construction@gmail.com" },
    { page_key: "contact", section_key: "info", content_key: "office_hours", content_type: "text", content_value: "Monday – Saturday: 8:00 AM – 5:00 PM PST" },
    { page_key: "contact", section_key: "info", content_key: "facebook_url", content_type: "text", content_value: "https://www.facebook.com/MCPA.ConstructionandSupply/" },
    { page_key: "contact", section_key: "info", content_key: "instagram_url", content_type: "text", content_value: "https://www.instagram.com/mcpa.constructionandsupply/" },
    { page_key: "contact", section_key: "info", content_key: "tiktok_url", content_type: "text", content_value: "https://www.tiktok.com/@mcpa.construction" },

    // FOOTER
    { page_key: "footer", section_key: "general", content_key: "tagline", content_type: "text", content_value: "Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. We specialize in custom residential homes, modern commercial facilities, warehouse structures, signed and sealed engineering plans, and in-house construction supplies across Bulacan, Metro Manila, and Central Luzon." },
    { page_key: "footer", section_key: "general", content_key: "copyright", content_type: "text", content_value: "© 2026 MCPA Construction and Supply. All rights reserved." },

    // GLOBAL NAVIGATION & ANNOUNCEMENTS
    { page_key: "global", section_key: "navigation", content_key: "navHome", content_type: "text", content_value: "Home" },
    { page_key: "global", section_key: "navigation", content_key: "navProjects", content_type: "text", content_value: "Projects" },
    { page_key: "global", section_key: "navigation", content_key: "navServices", content_type: "text", content_value: "Services" },
    { page_key: "global", section_key: "navigation", content_key: "navProcess", content_type: "text", content_value: "Process" },
    { page_key: "global", section_key: "navigation", content_key: "navBlog", content_type: "text", content_value: "Updates & Blog" },
    { page_key: "global", section_key: "navigation", content_key: "clientPortal", content_type: "text", content_value: "Client Portal" },
    { page_key: "global", section_key: "announcements", content_key: "announcement_1", content_type: "text", content_value: "Looking to turn your ideas into reality?" },
    { page_key: "global", section_key: "announcements", content_key: "announcement_2", content_type: "text", content_value: "Collaborate with us at MCPA Construction and Supply and let's build your dream home" },
    { page_key: "global", section_key: "announcements", content_key: "announcement_3", content_type: "text", content_value: "We Have Build Now, Pay Later Program Available" },
    { page_key: "global", section_key: "announcements", content_key: "announcement_4", content_type: "text", content_value: "Message Us Now — Inquire for Your Project" },
  ];

  const pools = [
    { name: "Supabase", pool: db.supabasePool },
    { name: "Neon", pool: db.neonPool },
  ];

  for (const { name, pool } of pools) {
    if (!pool) continue;
    for (const item of fullContent) {
      await pool.query(
        `INSERT INTO website_content (page_key, section_key, content_key, content_type, content_value)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (page_key, section_key, content_key)
         DO UPDATE SET content_value = EXCLUDED.content_value`,
        [item.page_key, item.section_key, item.content_key, item.content_type, item.content_value]
      );
    }
    console.log(`✓ Seeded ${fullContent.length} website content keys on ${name}`);
  }
  process.exit(0);
}

seedComprehensiveWebsiteContent().catch((err) => {
  console.error(err);
  process.exit(1);
});
