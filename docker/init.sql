-- =============================================================================
-- MCPA CONSTRUCTION & SUPPLY — POSTGRESQL INITIAL DATABASE SCHEMA & SEED
-- =============================================================================

-- 1. USERS TABLE (Enterprise Admin Credentials & Account Lockout Tracking)
CREATE TABLE IF NOT EXISTS users (
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

-- 2. OTP_CODES TABLE (6-digit Segmented Reset Verification with Expiry)
CREATE TABLE IF NOT EXISTS otp_codes (
    otp_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROJECTS TABLE (Portfolio, Categories, Specs, and Blob/Storage Images)
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    category VARCHAR(100),
    year VARCHAR(50),
    description TEXT,
    images TEXT[],
    is_admin_added BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLIENT_BRIEFS TABLE (Consultation Briefs, Specs, Budgets & Uploaded Blueprints)
CREATE TABLE IF NOT EXISTS client_briefs (
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
    status VARCHAR(50) DEFAULT 'Pending Consultation Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED INITIAL ADMINISTRATORS (Default Password: mcpa2026)
INSERT INTO users (email, password_hash, full_name, role)
VALUES 
    ('admin@mcpa.com', '$2b$10$MBXP8N0352dGhqQpNywgeuCXEV80lWR0t6AFP2ode4oU91hupRpWW', 'MCPA Lead Administrator', 'admin'),
    ('dbprojectmartquirante@gmail.com', '$2b$10$MBXP8N0352dGhqQpNywgeuCXEV80lWR0t6AFP2ode4oU91hupRpWW', 'Mart Quirante (MCPA Admin)', 'admin'),
    ('rayquirante@gmail.com', '$2b$10$MBXP8N0352dGhqQpNywgeuCXEV80lWR0t6AFP2ode4oU91hupRpWW', 'Ray Quirante (MCPA Admin)', 'admin')
ON CONFLICT (email) DO NOTHING;
