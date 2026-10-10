-- =============================================================================
-- MCPA CONSTRUCTION AND SUPPLY — COMPLETE STAGE LIFECYCLE MIGRATION SCHEMA
-- Target Platforms: Supabase SQL Editor & Neon Serverless PostgreSQL Console
-- Purpose: Complete 5-Stage Progressive Disclosure Database Architecture
-- Version: 2026.1 (Production Ready - Safe & Idempotent)
-- =============================================================================

-- Enable standard UUID and Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: ADDITIVE MODIFICATIONS TO EXISTING CORE TABLES
-- =============================================================================

-- 1.1 USERS TABLE: Anti-spam project control & Biometric KYC extensions
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_multi_project_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_id_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS kyc_verified_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kyc_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_users_multi_proj ON public.users(is_multi_project_approved);
CREATE INDEX IF NOT EXISTS idx_users_kyc_verified ON public.users(kyc_verified_at);

-- 1.2 CLIENT_BRIEFS TABLE: Add Stage & Client Project bridge references
ALTER TABLE public.client_briefs 
  ADD COLUMN IF NOT EXISTS client_project_id INT,
  ADD COLUMN IF NOT EXISTS current_stage_status VARCHAR(50) DEFAULT 'CONSULTATION';

CREATE INDEX IF NOT EXISTS idx_briefs_client_proj_id ON public.client_briefs(client_project_id);

-- 1.3 SITE_PROJECTS TABLE: Link to unified client project lifecycle
ALTER TABLE public.site_projects 
  ADD COLUMN IF NOT EXISTS client_project_id INT,
  ADD COLUMN IF NOT EXISTS is_active_build BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_site_projects_client_proj_id ON public.site_projects(client_project_id);

-- 1.4 BILLING_LEDGER TABLE: Downpayment tracking & stage bridge
ALTER TABLE public.billing_ledger 
  ADD COLUMN IF NOT EXISTS client_project_id INT,
  ADD COLUMN IF NOT EXISTS downpayment_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_billing_client_proj_id ON public.billing_ledger(client_project_id);


-- =============================================================================
-- SECTION 2: NEW STAGE LIFECYCLE MANAGEMENT TABLES
-- =============================================================================

-- 2.1 CLIENT_PROJECTS: The Unified Bridge & 5-Stage Progressive Disclosure Engine
CREATE TABLE IF NOT EXISTS public.client_projects (
  client_project_id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  stage_id VARCHAR(50) NOT NULL DEFAULT 'PRE_INQUIRY' 
    CHECK (stage_id IN ('PRE_INQUIRY', 'CONSULTATION', 'PRE_CONSTRUCTION', 'ACTIVE_BUILD', 'COMPLETED')),
  project_title VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) DEFAULT 'Residential',
  target_location VARCHAR(255),
  brief_id INT REFERENCES public.client_briefs(brief_id) ON DELETE SET NULL,
  site_project_code VARCHAR(50) REFERENCES public.site_projects(project_code) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_projects_user_id ON public.client_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_stage ON public.client_projects(stage_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_code ON public.client_projects(project_code);
CREATE INDEX IF NOT EXISTS idx_client_projects_brief ON public.client_projects(brief_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_site_code ON public.client_projects(site_project_code);

-- 2.2 STAGE_TRANSITIONS: Immutable Audit Trail of Progressive Disclosures
CREATE TABLE IF NOT EXISTS public.stage_transitions (
  transition_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  transitioned_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transitions_proj_id ON public.stage_transitions(client_project_id);
CREATE INDEX IF NOT EXISTS idx_transitions_to_stage ON public.stage_transitions(to_stage);

-- 2.3 PROJECT_DOCUMENTS: Unified Digital Vault (Land Titles, Permits, Warranty Certificates)
CREATE TABLE IF NOT EXISTS public.project_documents (
  doc_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  stage_id VARCHAR(50) NOT NULL,
  doc_type VARCHAR(100) NOT NULL, 
  -- Common types: 'LAND_TITLE', 'LOT_PLAN', 'TAX_DECLARATION', 'BARANGAY_CLEARANCE',
  -- 'BUILDING_PERMIT', 'BLUEPRINT_ARCH', 'BLUEPRINT_STRUCT', 'CONTRACT', 'WARRANTY_CERT', 'MAINTENANCE_GUIDE'
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  verification_status VARCHAR(50) DEFAULT 'Pending Review', -- 'Pending Review', 'Verified', 'Rejected'
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proj_docs_client_proj ON public.project_documents(client_project_id);
CREATE INDEX IF NOT EXISTS idx_proj_docs_stage_type ON public.project_documents(stage_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_proj_docs_status ON public.project_documents(verification_status);

-- 2.4 MEETING_ROOMS: Stage 2 Virtual Consultation & WebRTC Signaling
CREATE TABLE IF NOT EXISTS public.meeting_rooms (
  meeting_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  room_code VARCHAR(100) UNIQUE NOT NULL,
  host_user_id INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  guest_user_id INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  meeting_status VARCHAR(50) DEFAULT 'SCHEDULED' 
    CHECK (meeting_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  recording_url TEXT,
  transcript_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_rooms_proj ON public.meeting_rooms(client_project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_code ON public.meeting_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_status ON public.meeting_rooms(meeting_status);

-- 2.5 CHAT_MESSAGES: Consultation In-App Direct Messaging
CREATE TABLE IF NOT EXISTS public.chat_messages (
  message_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  sender_user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_proj ON public.chat_messages(client_project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- 2.6 BLUEPRINTS: Interactive 2D Blueprint Viewer with Coordinate Pin Annotations
CREATE TABLE IF NOT EXISTS public.blueprints (
  blueprint_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL 
    CHECK (discipline IN ('ARCHITECTURAL', 'STRUCTURAL', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL')),
  sheet_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  revision_no VARCHAR(20) DEFAULT 'Rev 0',
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width_px INT,
  height_px INT,
  pins JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_proj ON public.blueprints(client_project_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_discipline ON public.blueprints(discipline);

-- 2.7 PERMIT_RECORDS: Stage 3 LGU Permitting Tracker (City Hall / OBO Pipeline)
CREATE TABLE IF NOT EXISTS public.permit_records (
  permit_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  permit_type VARCHAR(100) NOT NULL,
  -- 'BARANGAY_CLEARANCE', 'LOCATIONAL_CLEARANCE', 'BUILDING_PERMIT', 'FSEC_FIRE', 'ECC_ENVIRONMENTAL', 'OCCUPANCY_PERMIT'
  lgu_agency VARCHAR(255) NOT NULL,
  application_no VARCHAR(100),
  status VARCHAR(50) DEFAULT 'NOT_STARTED' 
    CHECK (status IN ('NOT_STARTED', 'IN_PREPARATION', 'SUBMITTED', 'UNDER_EVALUATION', 'APPROVED', 'RELEASED', 'REJECTED')),
  filing_date DATE,
  target_release_date DATE,
  actual_release_date DATE,
  official_receipt_url TEXT,
  permit_document_url TEXT,
  assigned_liaison VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permits_proj ON public.permit_records(client_project_id);
CREATE INDEX IF NOT EXISTS idx_permits_status ON public.permit_records(status);

-- 2.8 CONTRACTS: Stage 3 Construction Contract Agreements
CREATE TABLE IF NOT EXISTS public.contracts (
  contract_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  contract_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  contract_type VARCHAR(100) DEFAULT 'MAIN_CONSTRUCTION',
  total_contract_amount NUMERIC(14, 2) NOT NULL,
  downpayment_pct NUMERIC(5, 2) DEFAULT 15.00,
  retention_pct NUMERIC(5, 2) DEFAULT 10.00,
  contract_pdf_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'SENT_FOR_SIGNATURE', 'PARTIALLY_SIGNED', 'FULLY_EXECUTED', 'TERMINATED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_proj ON public.contracts(client_project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON public.contracts(contract_number);

-- 2.9 CONTRACT_SIGNATURES: Tamper-Evident Digital & Biometric Signatures
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  signature_id SERIAL PRIMARY KEY,
  contract_id INT NOT NULL REFERENCES public.contracts(contract_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  signer_role VARCHAR(50) NOT NULL, -- 'CLIENT', 'CONTRACTOR_LEAD', 'NOTARY_WITNESS'
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signature_type VARCHAR(50) DEFAULT 'DRAWN', -- 'DRAWN', 'TYPED', 'BIOMETRIC_KYC'
  signature_image_url TEXT NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hash_sha256 VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user ON public.contract_signatures(user_id);

-- 2.10 COST_ESTIMATOR_RATES: Philippine Construction Regional & Finish Benchmark Rates
CREATE TABLE IF NOT EXISTS public.cost_estimator_rates (
  rate_id SERIAL PRIMARY KEY,
  finish_level VARCHAR(50) NOT NULL, -- 'ROUGH_BASIC', 'STANDARD_QUALITY', 'SEMI_ELEGANT', 'ELEGANT_LUXURY'
  storeys INT NOT NULL DEFAULT 1,
  cost_per_sqm_min NUMERIC(12, 2) NOT NULL,
  cost_per_sqm_max NUMERIC(12, 2) NOT NULL,
  labor_pct NUMERIC(5, 2) DEFAULT 35.00,
  materials_pct NUMERIC(5, 2) DEFAULT 65.00,
  effective_year INT DEFAULT 2026,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_estimator_rate UNIQUE (finish_level, storeys, effective_year)
);

CREATE INDEX IF NOT EXISTS idx_estimator_rates_lookup ON public.cost_estimator_rates(finish_level, storeys, effective_year);

-- 2.11 COST_ESTIMATES: Client Saved Estimates & Spatial Calculations
CREATE TABLE IF NOT EXISTS public.cost_estimates (
  estimate_id SERIAL PRIMARY KEY,
  client_project_id INT REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  user_id INT REFERENCES public.users(user_id) ON DELETE SET NULL,
  lot_area_sqm NUMERIC(10, 2) NOT NULL,
  floor_area_sqm NUMERIC(10, 2) NOT NULL,
  storeys INT NOT NULL DEFAULT 1,
  finish_level VARCHAR(50) NOT NULL,
  location_category VARCHAR(100) DEFAULT 'NCR_METRO_MANILA',
  estimated_min_total NUMERIC(14, 2) NOT NULL,
  estimated_max_total NUMERIC(14, 2) NOT NULL,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimates_proj ON public.cost_estimates(client_project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user ON public.cost_estimates(user_id);

-- 2.12 LOAN_RECORDS: Bank & Pag-IBIG HDMF Financing Tracking
CREATE TABLE IF NOT EXISTS public.loan_records (
  loan_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  financing_institution VARCHAR(100) NOT NULL, -- 'PAG_IBIG_HDMF', 'BDO', 'BPI', 'METROBANK', 'SECURITY_BANK', 'OTHER'
  loan_account_no VARCHAR(100),
  target_loan_amount NUMERIC(14, 2) NOT NULL,
  approved_loan_amount NUMERIC(14, 2),
  term_years INT DEFAULT 20,
  interest_rate_pct NUMERIC(5, 2),
  monthly_amortization NUMERIC(12, 2),
  status VARCHAR(50) DEFAULT 'APPLICATION_PREPARATION',
  -- 'APPLICATION_PREPARATION', 'DOCUMENTS_SUBMITTED', 'UNDER_CREDIT_EVALUATION', 'NOTICE_OF_APPROVAL_NOA', 'LOAN_TAKEOUT_RELEASED', 'REJECTED'
  notice_of_approval_url TEXT,
  latest_milestone_disbursement NUMERIC(14, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_records_proj ON public.loan_records(client_project_id);
CREATE INDEX IF NOT EXISTS idx_loan_records_status ON public.loan_records(status);

-- 2.13 PROJECT_WRAPPED: Spotify-Wrapped Architecture Digital Turnover Experience
CREATE TABLE IF NOT EXISTS public.project_wrapped (
  wrapped_id SERIAL PRIMARY KEY,
  client_project_id INT NOT NULL REFERENCES public.client_projects(client_project_id) ON DELETE CASCADE,
  total_days_duration INT NOT NULL DEFAULT 0,
  total_workers_employed INT DEFAULT 0,
  total_concrete_bags INT DEFAULT 0,
  total_steel_kg INT DEFAULT 0,
  total_photos_logged INT DEFAULT 0,
  before_photo_url TEXT,
  after_photo_url TEXT,
  story_cards JSONB DEFAULT '[]'::jsonb,
  share_token VARCHAR(100) UNIQUE,
  is_public_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wrapped_proj ON public.project_wrapped(client_project_id);
CREATE INDEX IF NOT EXISTS idx_wrapped_token ON public.project_wrapped(share_token);


-- =============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES (SUPABASE & NEON COMPATIBLE)
-- =============================================================================

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimator_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_wrapped ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_projects' AND policyname = 'Allow service_role client_projects') THEN
    CREATE POLICY "Allow service_role client_projects" ON public.client_projects FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stage_transitions' AND policyname = 'Allow service_role stage_transitions') THEN
    CREATE POLICY "Allow service_role stage_transitions" ON public.stage_transitions FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_documents' AND policyname = 'Allow service_role project_documents') THEN
    CREATE POLICY "Allow service_role project_documents" ON public.project_documents FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_rooms' AND policyname = 'Allow service_role meeting_rooms') THEN
    CREATE POLICY "Allow service_role meeting_rooms" ON public.meeting_rooms FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Allow service_role chat_messages') THEN
    CREATE POLICY "Allow service_role chat_messages" ON public.chat_messages FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprints' AND policyname = 'Allow service_role blueprints') THEN
    CREATE POLICY "Allow service_role blueprints" ON public.blueprints FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permit_records' AND policyname = 'Allow service_role permit_records') THEN
    CREATE POLICY "Allow service_role permit_records" ON public.permit_records FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Allow service_role contracts') THEN
    CREATE POLICY "Allow service_role contracts" ON public.contracts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contract_signatures' AND policyname = 'Allow service_role contract_signatures') THEN
    CREATE POLICY "Allow service_role contract_signatures" ON public.contract_signatures FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cost_estimator_rates' AND policyname = 'Allow service_role cost_estimator_rates') THEN
    CREATE POLICY "Allow service_role cost_estimator_rates" ON public.cost_estimator_rates FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cost_estimates' AND policyname = 'Allow service_role cost_estimates') THEN
    CREATE POLICY "Allow service_role cost_estimates" ON public.cost_estimates FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_records' AND policyname = 'Allow service_role loan_records') THEN
    CREATE POLICY "Allow service_role loan_records" ON public.loan_records FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_wrapped' AND policyname = 'Allow service_role project_wrapped') THEN
    CREATE POLICY "Allow service_role project_wrapped" ON public.project_wrapped FOR ALL USING (true);
  END IF;
END $$;

