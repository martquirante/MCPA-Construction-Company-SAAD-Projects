-- =============================================================================
-- MCPA CONSTRUCTION AND SUPPLY — PRODUCTION CLEAN DDL SCHEMA
-- Target Engines: Neon Serverless PostgreSQL / Supabase PostgreSQL
-- Purpose: Pure DDL Table Entities, Indexes, Foreign Keys & Constraints
-- Note: Contains ZERO seed/mock data. Safe for clean production initialization.
-- =============================================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. MODULE: AUTHENTICATION & ACCESS CONTROL
-- =============================================================================

-- 1.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) DEFAULT 'MCPA Administrator',
  role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin', 'client'
  failed_login_attempts INT DEFAULT 0,
  lockout_enabled BOOLEAN DEFAULT FALSE,
  lockout_end TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 1.2 OTP_CODES TABLE
CREATE TABLE IF NOT EXISTS public.otp_codes (
  otp_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_code ON public.otp_codes(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_codes(expires_at);

-- =============================================================================
-- 2. MODULE: PUBLIC PORTFOLIO & CLIENT INQUIRIES
-- =============================================================================

-- 2.1 PROJECTS TABLE (Public Architectural & Structural Portfolio)
CREATE TABLE IF NOT EXISTS public.projects (
  project_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Residential',
  year VARCHAR(50),
  month VARCHAR(50) DEFAULT 'January',
  status VARCHAR(50) DEFAULT 'completed',
  description TEXT,
  images TEXT[] DEFAULT '{}',
  is_admin_added BOOLEAN DEFAULT TRUE,
  is_web_visible BOOLEAN DEFAULT TRUE,
  featured_on_home BOOLEAN DEFAULT FALSE,
  lot_area VARCHAR(100),
  floor_area VARCHAR(100),
  bedrooms VARCHAR(50),
  bathrooms VARCHAR(50),
  features TEXT[] DEFAULT '{}',
  architectural_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(is_web_visible, featured_on_home);

-- 2.2 CLIENT_BRIEFS TABLE (5-Phase Consultation Pipeline & Booking)
CREATE TABLE IF NOT EXISTS public.client_briefs (
  brief_id SERIAL PRIMARY KEY,
  submission_id VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  project_type VARCHAR(100),
  preferred_style VARCHAR(255),
  budget_range VARCHAR(100),
  lot_status VARCHAR(100),
  lot_area VARCHAR(100),
  target_date VARCHAR(100),
  location VARCHAR(255),
  financing_option VARCHAR(100),
  uploaded_files TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'Pending Review',
  location_type VARCHAR(50) DEFAULT 'Local',
  meeting_mode VARCHAR(100) DEFAULT 'Online Meeting (Google Meet)',
  meeting_date VARCHAR(100),
  meeting_time VARCHAR(100),
  meeting_link TEXT,
  meeting_notes TEXT,
  quotation_amount NUMERIC(14, 2),
  quotation_notes TEXT,
  client_portal_code VARCHAR(50),
  map_coordinates VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.client_briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_email ON public.client_briefs(client_email);
CREATE INDEX IF NOT EXISTS idx_briefs_submission_id ON public.client_briefs(submission_id);

-- =============================================================================
-- 3. MODULE: CONSTRUCTION TRACKING & CLIENT BUILD PORTAL
-- =============================================================================

-- 3.1 SITE_PROJECTS TABLE (Active Construction Execution)
CREATE TABLE IF NOT EXISTS public.site_projects (
  project_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  contract_date VARCHAR(100),
  original_turnover VARCHAR(100),
  revised_turnover VARCHAR(100),
  progress_pct INT DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  current_phase VARCHAR(255),
  lead_engineer VARCHAR(255),
  virtual_tour_url TEXT,
  status VARCHAR(50) DEFAULT 'Active Site Execution',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_projects_code ON public.site_projects(project_code);
CREATE INDEX IF NOT EXISTS idx_site_projects_client_email ON public.site_projects(client_email);

-- 3.2 SITE_MILESTONES TABLE (Gantt Milestones & Weightings)
CREATE TABLE IF NOT EXISTS public.site_milestones (
  milestone_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  phase_code VARCHAR(50) NOT NULL,
  phase_name VARCHAR(255) NOT NULL,
  completion_pct INT DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  status VARCHAR(50) DEFAULT 'Upcoming',
  target_date VARCHAR(100),
  notes TEXT,
  weight INT DEFAULT 20
);

CREATE INDEX IF NOT EXISTS idx_milestones_proj_code ON public.site_milestones(project_code);

-- 3.3 SITE_PHOTO_LOGS TABLE (Visual Proof of Life & 360 Sweeps)
CREATE TABLE IF NOT EXISTS public.site_photo_logs (
  log_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  title VARCHAR(255) NOT NULL,
  caption TEXT,
  inspector VARCHAR(255),
  image_url TEXT NOT NULL,
  log_date VARCHAR(100),
  is_360 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_logs_proj_code ON public.site_photo_logs(project_code);

-- 3.4 BILLING_LEDGER TABLE (Progressive Milestone Invoicing & Digital ORs)
CREATE TABLE IF NOT EXISTS public.billing_ledger (
  bill_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  milestone_title VARCHAR(255) NOT NULL,
  amount_due NUMERIC(14, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Overdue'
  proof_url TEXT,
  or_number VARCHAR(100),
  due_date VARCHAR(100),
  paid_date VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_proj_code ON public.billing_ledger(project_code);

-- 3.5 DELAY_EVENTS TABLE (Algorithmic Critical Path Tracking)
CREATE TABLE IF NOT EXISTS public.delay_events (
  event_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'Weather / Typhoon', 'Permitting Delay', 'Material Logistics'
  days_delayed INT NOT NULL CHECK (days_delayed >= 0),
  reason TEXT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delay_proj_code ON public.delay_events(project_code);

-- 3.6 WARRANTY_TICKETS TABLE (Post-Turnover 15-Year Structural Warranty)
CREATE TABLE IF NOT EXISTS public.warranty_tickets (
  ticket_id VARCHAR(50) PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Structural', 'Waterproofing', 'Electrical', 'Plumbing'
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved'
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_warranty_proj_code ON public.warranty_tickets(project_code);

-- 3.7 EXPENSES_OCR TABLE (AI Receipt Scanner Audit Trail)
CREATE TABLE IF NOT EXISTS public.expenses_ocr (
  expense_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES public.site_projects(project_code) ON DELETE CASCADE ON UPDATE CASCADE,
  vendor_name VARCHAR(255),
  receipt_image_url TEXT,
  extracted_total NUMERIC(14, 2) NOT NULL,
  raw_ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_proj_code ON public.expenses_ocr(project_code);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES (SUPABASE COMPATIBLE)
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_photo_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses_ocr ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Service role and API access policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow service_role users') THEN
    CREATE POLICY "Allow service_role users" ON public.users FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'otp_codes' AND policyname = 'Allow service_role otp_codes') THEN
    CREATE POLICY "Allow service_role otp_codes" ON public.otp_codes FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow all projects') THEN
    CREATE POLICY "Allow all projects" ON public.projects FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_briefs' AND policyname = 'Allow all client_briefs') THEN
    CREATE POLICY "Allow all client_briefs" ON public.client_briefs FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_projects' AND policyname = 'Allow all site_projects') THEN
    CREATE POLICY "Allow all site_projects" ON public.site_projects FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_milestones' AND policyname = 'Allow all site_milestones') THEN
    CREATE POLICY "Allow all site_milestones" ON public.site_milestones FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_photo_logs' AND policyname = 'Allow all site_photo_logs') THEN
    CREATE POLICY "Allow all site_photo_logs" ON public.site_photo_logs FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_ledger' AND policyname = 'Allow all billing_ledger') THEN
    CREATE POLICY "Allow all billing_ledger" ON public.billing_ledger FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delay_events' AND policyname = 'Allow all delay_events') THEN
    CREATE POLICY "Allow all delay_events" ON public.delay_events FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_tickets' AND policyname = 'Allow all warranty_tickets') THEN
    CREATE POLICY "Allow all warranty_tickets" ON public.warranty_tickets FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses_ocr' AND policyname = 'Allow all expenses_ocr') THEN
    CREATE POLICY "Allow all expenses_ocr" ON public.expenses_ocr FOR ALL USING (true);
  END IF;
END $$;
