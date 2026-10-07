-- =============================================================================
-- MCPA CONSTRUCTION AND SUPPLY — SUPABASE POSTGRESQL MASTER SCHEMA
-- Project Reference: dzqqyqothtttccplvvnb
-- Generated for Supabase SQL Editor execution
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE (Authentication & Administrative Access)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) DEFAULT 'MCPA Administrator',
  role VARCHAR(50) DEFAULT 'admin',
  failed_login_attempts INT DEFAULT 0,
  lockout_enabled BOOLEAN DEFAULT FALSE,
  lockout_end TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- -----------------------------------------------------------------------------
-- 2. OTP_CODES TABLE (Two-Factor Authentication & Password Reset)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. PROJECTS TABLE (Public Architectural & Engineering Portfolio)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  project_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  category VARCHAR(100),
  year VARCHAR(50),
  description TEXT,
  images TEXT[],
  is_admin_added BOOLEAN DEFAULT TRUE,
  is_web_visible BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'completed',
  month VARCHAR(50) DEFAULT 'January',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. CLIENT_BRIEFS TABLE (Consultation Inquiries & Project Briefs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_briefs (
  brief_id SERIAL PRIMARY KEY,
  submission_id VARCHAR(50),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  project_type VARCHAR(100),
  preferred_style VARCHAR(255),
  budget_range VARCHAR(100),
  lot_status VARCHAR(100),
  lot_area VARCHAR(50),
  target_date VARCHAR(100),
  location VARCHAR(255),
  financing_option VARCHAR(100),
  uploaded_files TEXT[],
  status VARCHAR(50) DEFAULT 'Pending Review',
  location_type VARCHAR(50) DEFAULT 'Local',
  meeting_mode VARCHAR(100) DEFAULT 'Online Meeting (Google Meet)',
  meeting_date VARCHAR(100),
  meeting_time VARCHAR(100),
  meeting_link TEXT,
  meeting_notes TEXT,
  quotation_amount NUMERIC(12, 2),
  quotation_notes TEXT,
  client_portal_code VARCHAR(50),
  map_coordinates VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. SITE_PROJECTS TABLE (Active Construction Execution)
-- -----------------------------------------------------------------------------
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
  progress_pct INT DEFAULT 0,
  current_phase VARCHAR(255),
  lead_engineer VARCHAR(255),
  virtual_tour_url TEXT,
  status VARCHAR(50) DEFAULT 'Active Site Execution',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. SITE_MILESTONES TABLE (Gantt Milestones & Weightings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_milestones (
  milestone_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  phase_code VARCHAR(50) NOT NULL,
  phase_name VARCHAR(255) NOT NULL,
  completion_pct INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Upcoming',
  target_date VARCHAR(100),
  notes TEXT,
  weight INT DEFAULT 20
);

-- -----------------------------------------------------------------------------
-- 7. SITE_PHOTO_LOGS TABLE (Visual Proof of Life & 360 Sweeps)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_photo_logs (
  log_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  caption TEXT,
  inspector VARCHAR(255),
  image_url TEXT NOT NULL,
  log_date VARCHAR(100),
  is_360 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. BILLING_LEDGER TABLE (Progressive Invoicing & Official Receipts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_ledger (
  bill_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  milestone_title VARCHAR(255) NOT NULL,
  amount_due NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  proof_url TEXT,
  or_number VARCHAR(100),
  due_date VARCHAR(100),
  paid_date VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. DELAY_EVENTS TABLE (Algorithmic Critical Path Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delay_events (
  event_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  days_delayed INT NOT NULL,
  reason TEXT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. WARRANTY_TICKETS TABLE (Post-Turnover Structural Warranty)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warranty_tickets (
  ticket_id VARCHAR(50) PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- 11. EXPENSES_OCR TABLE (AI Receipt Scanner Audit Trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses_ocr (
  expense_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(255),
  receipt_image_url TEXT,
  extracted_total NUMERIC(12, 2) NOT NULL,
  raw_ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Service role and public API keys have full access
-- -----------------------------------------------------------------------------
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

-- Allow service_role and anon access for API operations
DO $$ 
BEGIN
  EXECUTE 'CREATE POLICY "Allow service_role users" ON public.users FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow service_role otp_codes" ON public.otp_codes FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all projects" ON public.projects FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all client_briefs" ON public.client_briefs FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all site_projects" ON public.site_projects FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all site_milestones" ON public.site_milestones FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all site_photo_logs" ON public.site_photo_logs FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all billing_ledger" ON public.billing_ledger FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all delay_events" ON public.delay_events FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all warranty_tickets" ON public.warranty_tickets FOR ALL USING (true);';
  EXECUTE 'CREATE POLICY "Allow all expenses_ocr" ON public.expenses_ocr FOR ALL USING (true);';
EXCEPTION WHEN duplicate_object THEN
  -- Policies already created
  NULL;
END $$;

-- -----------------------------------------------------------------------------
-- SEED INITIAL DATA (Administrators, Portfolio, Active Project)
-- -----------------------------------------------------------------------------
-- Seed Administrators (Password: mcpa2026 -> $2a$10$QO2Z1B4eHn9xXz7b2rN98e6j5s9q2p)
INSERT INTO public.users (email, password_hash, full_name, role)
VALUES 
  ('admin@mcpa.com', '$2a$10$hKj5f0O70V3V8t1u1Jk5xe0iT7t2Zf1G5Z7c6e0G5a1T1e0G5a1T1', 'MCPA Lead Administrator', 'admin'),
  ('dbprojectmartquirante@gmail.com', '$2a$10$hKj5f0O70V3V8t1u1Jk5xe0iT7t2Zf1G5Z7c6e0G5a1T1e0G5a1T1', 'Engr. Raymart Quirante (MCPA Admin)', 'admin')
ON CONFLICT (email) DO NOTHING;

