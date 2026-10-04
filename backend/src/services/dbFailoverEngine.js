const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

class DbFailoverEngine {
  constructor() {
    this.azureConnStr = process.env.AZURE_POSTGRES_CONNECTION_STRING || "";
    this.localConnStr = process.env.LOCAL_DB_CONNECTION || "";
    
    // Strict environment guard: identify production vs localhost development
    this.isProduction =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.VERCEL) ||
      Boolean(process.env.VERCEL_ENV) ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

    // Docker testing mode is ONLY permitted on local machine development
    this.useLocalDocker = !this.isProduction && process.env.USE_LOCAL_DB === "true";

    // Supabase Credentials
    this.supabaseUrl = process.env.SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
    this.supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD || "";

    // Extract project ref from SUPABASE_URL (e.g., https://dzqqyqothtttccplvvnb.supabase.co -> dzqqyqothtttccplvvnb)
    const projectRef = (this.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1] || "dzqqyqothtttccplvvnb";

    // Supabase Connection Pooler (IPv4 compatible Transaction Mode on port 6543, ideal for Vercel Serverless / AWS)
    let poolerConn = "";
    if (this.supabaseDbPassword) {
      poolerConn = `postgres://postgres.${projectRef}:${encodeURIComponent(this.supabaseDbPassword)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    }

    // Build Supabase PostgreSQL connection string
    let resolvedSupabaseConn = process.env.SUPABASE_CONNECTION_STRING || "";
    // On Vercel serverless production: route to IPv4 Transaction Pooler.
    // In local development: use process.env.SUPABASE_CONNECTION_STRING (direct connection with no pooler limits)
    if (this.isProduction && poolerConn) {
      resolvedSupabaseConn = poolerConn;
    } else if (!resolvedSupabaseConn && poolerConn) {
      resolvedSupabaseConn = poolerConn;
    }
    this.supabaseConnStr = resolvedSupabaseConn;

    // Supabase REST Client
    this.supabaseClient = null;
    if (this.supabaseUrl && this.supabaseKey && !this.supabaseUrl.includes("YOUR_")) {
      try {
        this.supabaseClient = createClient(this.supabaseUrl, this.supabaseKey);
      } catch (e) {
        console.warn("[DbFailoverEngine] Supabase client init warning:", e.message);
      }
    }

    // Neon PostgreSQL Credentials (Hot Standby / High Availability)
    this.neonConnStr = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL || "";
    this.neonPool = null;

    this.isFailoverActive = false;
    this.lastFailoverTimestamp = 0;
    this.lastFailoverReason = null;
    this.isMockActive = false;
    this.consecutiveAzureFailures = 0;
    this.consecutiveAzureSuccesses = 0;

    this.azurePool = null;
    this.supabasePool = null;
    this.localPool = null;

    this.initPools();
    this.startHealthCheck();
  }

  createPool(connectionString) {
    if (!connectionString || connectionString.includes("YOUR_")) return null;
    try {
      const isSsl = connectionString.includes("sslmode") || !connectionString.includes("localhost");
      // Strip sslmode from query string so pg-connection-string doesn't override rejectUnauthorized
      const cleanConnStr = connectionString.replace(/([?&])sslmode=[^&]+(&|$)/, (m, p1, p2) => p1 === "?" && p2 ? "?" : "").replace(/\?$/, "");
      return new Pool({
        connectionString: cleanConnStr,
        ssl: isSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
        max: this.isProduction ? 2 : 5,
      });
    } catch (e) {
      console.warn("[DbFailoverEngine] Pool creation error:", e.message);
      return null;
    }
  }

  initPools() {
    // 1. Primary: Supabase PostgreSQL Cloud Pool
    if (this.supabaseConnStr) {
      this.supabasePool = this.createPool(this.supabaseConnStr);
      if (this.supabasePool) {
        console.log(`\x1b[32m[DbFailoverEngine] Supabase PostgreSQL Cloud Pool active (Primary Database)\x1b[0m`);
      }
    }
    // 2. High-Availability Hot Standby: Neon Serverless PostgreSQL Cloud
    if (this.neonConnStr) {
      this.neonPool = this.createPool(this.neonConnStr);
      if (this.neonPool) {
        console.log(`\x1b[32m[DbFailoverEngine] Neon Serverless PostgreSQL Cloud Pool active (Cloud Hot Standby)\x1b[0m`);
      }
    }
    // 3. Standby: Local PostgreSQL (strictly localhost development/testing - completely disabled in production)
    if (!this.isProduction && this.localConnStr) {
      this.localPool = this.createPool(this.localConnStr);
    }
    // 4. Azure Pool (if configured)
    if (this.azureConnStr) {
      this.azurePool = this.createPool(this.azureConnStr);
    }

    if (!this.supabasePool && !this.neonPool && !this.azurePool && !this.localPool) {
      if (this.supabaseClient) {
        console.log(`\x1b[36m[DbFailoverEngine] Supabase Cloud active (REST API Engine). Direct PostgreSQL pool standby.\x1b[0m`);
      } else {
        this.isMockActive = true;
        console.log("[DbFailoverEngine] No live PostgreSQL connection strings provided. Operating in Local Resilient Mock Storage mode.");
      }
    }
  }

  getActiveProviderName() {
    if (!this.isProduction && this.useLocalDocker && this.localPool) return "Local PostgreSQL (Docker Testing & Local Development)";
    if (!this.isFailoverActive && this.supabasePool) return "Supabase PostgreSQL Cloud (Primary Database)";
    if (this.isFailoverActive && this.neonPool) return "Neon Serverless PostgreSQL (Standby Backup - Failover Active)";
    if (this.neonPool && !this.supabasePool) return "Neon Serverless PostgreSQL (Standby Backup - Ready for Failover)";
    if (this.supabaseClient && !this.isFailoverActive && !this.localPool && !this.azurePool) return "Supabase Cloud (REST Engine / Primary)";
    if (!this.isProduction && this.isFailoverActive && this.localPool) return "Local PostgreSQL (Docker Standby)";
    if (this.azurePool) return "Azure Flexible Server (Standby Tier)";
    if (!this.isProduction && this.localPool) return "Local PostgreSQL (Docker Local)";
    if (this.isProduction) return "Cloud Database Services Unreachable";
    return "Local Resilient Storage (Dev Mode)";
  }

  async triggerFailover(reason) {
    this.lastFailoverReason = reason;
    if (this.isFailoverActive) return;
    this.isFailoverActive = true;
    this.lastFailoverTimestamp = Date.now();
    console.warn(`\x1b[33m[WARN] [DbFailoverEngine] AUTOMATIC CLOUD FAILOVER ACTIVATED: ${reason}. Cascading to Standby Provider.\x1b[0m`);
  }

  async triggerFailback() {
    if (!this.isFailoverActive) return;
    this.isFailoverActive = false;
    this.lastFailoverTimestamp = 0;
    this.lastFailoverReason = null;
    console.log(`\x1b[32m[OK] [DbFailoverEngine] AUTOMATIC FAILBACK RESTORED: Supabase Cloud Primary is verified healthy. Switched active database back to Supabase Cloud.\x1b[0m`);
  }

  /**
   * Main query execution method with automatic failover & self-healing failback
   */
  async query(text, params = []) {
    // -1. Local Docker Testing Mode: (Only allowed on localhost if USE_LOCAL_DB=true is enabled)
    if (!this.isProduction && this.useLocalDocker && this.localPool && !this.isMockActive) {
      try {
        const res = await this.localPool.query(text, params);
        return res;
      } catch (localErr) {
        console.error("[DbFailoverEngine] Local Docker query failed:", localErr.message);
      }
    }

    // 0. Auto-healing Failback Check: If failover was active and 5s have elapsed, test if Supabase is back
    if (this.isFailoverActive && this.supabasePool && Date.now() - (this.lastFailoverTimestamp || 0) > 5000) {
      try {
        await this.supabasePool.query("SELECT 1");
        await this.triggerFailback();
      } catch (probeErr) {
        // Supabase is still recovering, update probe timestamp to prevent query latency
        this.lastFailoverTimestamp = Date.now();
        this.lastFailoverReason = `Failback probe: ${probeErr.message}`;
      }
    }

    // 1. Try Supabase Cloud Primary (Direct PostgreSQL Pool)
    if (!this.isFailoverActive && this.supabasePool) {
      try {
        const res = await this.supabasePool.query(text, params);
        return res;
      } catch (err) {
        if (this.isConnectionError(err)) {
          await this.triggerFailover(err.message);
        } else {
          throw err;
        }
      }
    }

    // 2. Try Neon Serverless PostgreSQL Cloud Pool (High Availability Hot Standby)
    if (this.neonPool) {
      try {
        const res = await this.neonPool.query(text, params);
        return res;
      } catch (neonErr) {
        if (!this.isConnectionError(neonErr)) throw neonErr;
        console.warn("[DbFailoverEngine] Neon pool query warning:", neonErr.message);
      }
    }

    // 3. Try Supabase Cloud REST Client (PostgREST)
    if (this.supabaseClient && !this.isFailoverActive) {
      try {
        const supaRes = await this.executeSupabaseClientQuery(text, params);
        if (supaRes) return supaRes;
      } catch (e) {
        // Fall through to local fallback
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // PRODUCTION ENVIRONMENT GUARD: STRICT ZERO LOCAL FALLBACK IN PRODUCTION
    // ═════════════════════════════════════════════════════════════════════
    if (this.isProduction) {
      throw new Error(
        `[DbFailoverEngine] Cloud Database Outage: Primary (Supabase) and Standby (Neon) failed to respond. Local Docker and Dev Mock fallbacks are strictly prohibited in production.`
      );
    }

    // 4. Try Local Docker PostgreSQL (ONLY on local machine when testing)
    if (this.localPool && !this.isMockActive) {
      try {
        const res = await this.localPool.query(text, params);
        return res;
      } catch (localErr) {
        console.error("[DbFailoverEngine] Local Docker PostgreSQL query failed:", localErr.message);
        console.warn("[DbFailoverEngine] Falling back to Local Resilient Mock Storage.");
        this.isMockActive = true;
      }
    }

    // 5. Try Azure Pool if configured
    if (this.azurePool && !this.isMockActive) {
      try {
        return await this.azurePool.query(text, params);
      } catch (err) {
        console.warn("[DbFailoverEngine] Azure pool unreachable.");
      }
    }

    // 6. Final fallback to resilient mock storage (Development only)
    return this.executeMockQuery(text, params);
  }

  /**
   * Executes queries via Supabase PostgREST REST API when direct PostgreSQL pool is standby
   * Ensures instant compatibility without requiring raw TCP connections.
   */
  async executeSupabaseClientQuery(sql, params) {
    if (!this.supabaseClient) return null;
    const cleanSql = sql.trim().toUpperCase();

    try {
      // 1. SELECT user by email
      if (cleanSql.includes("FROM USERS") && cleanSql.includes("EMAIL")) {
        const email = (params[0] || "").toLowerCase();
        const { data, error } = await this.supabaseClient
          .from("users")
          .select("*")
          .ilike("email", email);
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // 2. INSERT user
      if (cleanSql.startsWith("INSERT INTO USERS")) {
        const { data, error } = await this.supabaseClient
          .from("users")
          .insert({
            email: params[0],
            password_hash: params[1],
            full_name: params[2] || "MCPA Administrator",
            role: params[3] || "admin",
          })
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // 3. UPDATE users
      if (cleanSql.startsWith("UPDATE USERS")) {
        const email = (params[params.length - 1] || "").toLowerCase();
        let updatePayload = {};
        if (cleanSql.includes("PASSWORD_HASH")) {
          updatePayload = {
            password_hash: params[0],
            failed_login_attempts: 0,
            lockout_enabled: false,
            lockout_end: null,
          };
        } else if (cleanSql.includes("FAILED_LOGIN_ATTEMPTS = 0")) {
          updatePayload = {
            failed_login_attempts: 0,
            lockout_enabled: false,
            lockout_end: null,
          };
        }
        if (Object.keys(updatePayload).length > 0) {
          const { data, error } = await this.supabaseClient
            .from("users")
            .update(updatePayload)
            .ilike("email", email)
            .select();
          if (error) throw error;
          return { rows: data || [], rowCount: data ? data.length : 0 };
        }
      }

      // 4. Invalidate unused OTPs
      if (cleanSql.includes("UPDATE OTP_CODES SET IS_USED = TRUE") && cleanSql.includes("PURPOSE = 'PASSWORD_RESET'")) {
        const email = (params[0] || "").toLowerCase();
        const { error } = await this.supabaseClient
          .from("otp_codes")
          .update({ is_used: true })
          .ilike("email", email)
          .eq("purpose", "PASSWORD_RESET");
        if (error) throw error;
        return { rowCount: 1 };
      }

      // 5. INSERT OTP code
      if (cleanSql.startsWith("INSERT INTO OTP_CODES")) {
        const { data, error } = await this.supabaseClient
          .from("otp_codes")
          .insert({
            email: (params[0] || "").toLowerCase(),
            otp_code: params[1],
            purpose: params[2] || "PASSWORD_RESET",
            expires_at: new Date(Date.now() + 120 * 1000).toISOString(),
          })
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // 6. Verify OTP code
      if (cleanSql.includes("FROM OTP_CODES") && cleanSql.includes("OTP_CODE")) {
        const email = (params[0] || "").toLowerCase();
        const code = params[1];
        const { data, error } = await this.supabaseClient
          .from("otp_codes")
          .select("*")
          .ilike("email", email)
          .eq("otp_code", code)
          .eq("is_used", false)
          .gt("expires_at", new Date().toISOString())
          .order("otp_id", { ascending: false })
          .limit(1);
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // 7. Mark OTP as used
      if (cleanSql.includes("UPDATE OTP_CODES SET IS_USED = TRUE WHERE OTP_ID =")) {
        const otpId = params[0];
        const { error } = await this.supabaseClient
          .from("otp_codes")
          .update({ is_used: true })
          .eq("otp_id", otpId);
        if (error) throw error;
        return { rowCount: 1 };
      }

      // 8. Projects queries
      if (cleanSql.includes("FROM PROJECTS") && !cleanSql.startsWith("INSERT") && !cleanSql.startsWith("UPDATE") && !cleanSql.startsWith("DELETE")) {
        if (cleanSql.includes("COUNT(*)")) {
          const { count, error } = await this.supabaseClient
            .from("projects")
            .select("*", { count: "exact", head: true });
          if (error) throw error;
          return { rows: [{ count: count || 0 }] };
        }
        if (cleanSql.includes("WHERE PROJECT_ID =")) {
          const id = params[0];
          const { data, error } = await this.supabaseClient
            .from("projects")
            .select("*")
            .eq("project_id", id);
          if (error) throw error;
          return { rows: data || [], rowCount: data ? data.length : 0 };
        }
        const { data, error } = await this.supabaseClient
          .from("projects")
          .select("*")
          .order("project_id", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("INSERT INTO PROJECTS")) {
        const { data, error } = await this.supabaseClient
          .from("projects")
          .insert({
            name: params[0],
            location: params[1],
            category: params[2],
            year: params[3],
            description: params[4],
            images: params[5] || [],
            is_admin_added: true,
            is_web_visible: params[6] !== false,
            status: params[7] || "completed",
            month: params[8] || "January",
          })
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("UPDATE PROJECTS")) {
        const id = params[params.length - 1];
        const { data, error } = await this.supabaseClient
          .from("projects")
          .update({
            name: params[0],
            location: params[1],
            category: params[2],
            year: params[3],
            description: params[4],
            images: params[5] || [],
            is_web_visible: params[6] !== false,
            status: params[7],
            month: params[8],
          })
          .eq("project_id", id)
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("DELETE FROM PROJECTS")) {
        const id = params[0];
        const { error } = await this.supabaseClient
          .from("projects")
          .delete()
          .eq("project_id", id);
        if (error) throw error;
        return { rowCount: 1 };
      }

      // 9. Client briefs queries
      if (cleanSql.includes("FROM CLIENT_BRIEFS") && !cleanSql.startsWith("INSERT") && !cleanSql.startsWith("UPDATE") && !cleanSql.startsWith("DELETE")) {
        if (cleanSql.includes("WHERE BRIEF_ID =")) {
          const id = params[0];
          const { data, error } = await this.supabaseClient
            .from("client_briefs")
            .select("*")
            .eq("brief_id", id);
          if (error) throw error;
          return { rows: data || [], rowCount: data ? data.length : 0 };
        }
        const { data, error } = await this.supabaseClient
          .from("client_briefs")
          .select("*")
          .order("brief_id", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("INSERT INTO CLIENT_BRIEFS")) {
        const { data, error } = await this.supabaseClient
          .from("client_briefs")
          .insert({
            submission_id: params[0],
            client_name: params[1],
            client_email: params[2],
            client_phone: params[3],
            project_type: params[4],
            preferred_style: params[5],
            budget_range: params[6],
            lot_status: params[7],
            lot_area: params[8],
            target_date: params[9],
            location: params[10],
            financing_option: params[11],
            uploaded_files: params[12] || [],
            status: params[13] || "Pending Review",
          })
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("UPDATE CLIENT_BRIEFS")) {
        const id = params[params.length - 1];
        const { data, error } = await this.supabaseClient
          .from("client_briefs")
          .update({ status: params[0] })
          .eq("brief_id", id)
          .select();
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.startsWith("DELETE FROM CLIENT_BRIEFS")) {
        const id = params[0];
        const { error } = await this.supabaseClient
          .from("client_briefs")
          .delete()
          .eq("brief_id", id);
        if (error) throw error;
        return { rowCount: 1 };
      }

      // 10. Site projects & construction queries
      if (cleanSql.includes("FROM SITE_PROJECTS")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("site_projects")
          .select("*")
          .eq("project_code", code);
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM SITE_MILESTONES")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("site_milestones")
          .select("*")
          .eq("project_code", code)
          .order("milestone_id", { ascending: true });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM SITE_PHOTO_LOGS")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("site_photo_logs")
          .select("*")
          .eq("project_code", code)
          .order("log_id", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM BILLING_LEDGER")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("billing_ledger")
          .select("*")
          .eq("project_code", code)
          .order("bill_id", { ascending: true });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM DELAY_EVENTS")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("delay_events")
          .select("*")
          .eq("project_code", code)
          .order("event_id", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM WARRANTY_TICKETS")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("warranty_tickets")
          .select("*")
          .eq("project_code", code)
          .order("reported_at", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      if (cleanSql.includes("FROM EXPENSES_OCR")) {
        const code = params[0];
        const { data, error } = await this.supabaseClient
          .from("expenses_ocr")
          .select("*")
          .eq("project_code", code)
          .order("expense_id", { ascending: false });
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      return null;
    } catch (e) {
      // Table missing or schema not ready in Supabase schema cache
      return null;
    }
  }

  isConnectionError(err) {
    if (!err) return false;
    const msg = (err.message || "").toLowerCase();
    const code = err.code || "";
    return (
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT" ||
      code === "ENOTFOUND" ||
      code === "57P01" || // admin_shutdown
      code === "57P02" || // crash_shutdown
      code === "57P03" || // cannot_connect_now
      code === "08006" || // connection_failure
      code === "08001" || // unable_to_establish_sqlconnection
      msg.includes("timeout") ||
      msg.includes("connection terminated") ||
      msg.includes("refused")
    );
  }

  startHealthCheck() {
    if (process.env.VERCEL) return; // Disable background polling intervals on serverless
    const primaryPool = this.supabasePool || this.azurePool;
    if (!primaryPool) return;

    setInterval(async () => {
      if (!this.isFailoverActive) return;

      try {
        await primaryPool.query("SELECT 1");
        this.consecutiveAzureSuccesses++;
        if (this.consecutiveAzureSuccesses >= 2) {
          this.consecutiveAzureSuccesses = 0;
          await this.triggerFailback();
        }
      } catch (e) {
        this.consecutiveAzureSuccesses = 0;
      }
    }, 15000);
  }

  // =========================================================================
  // LOCAL RESILIENT MOCK ENGINE (Ensures zero-crash development)
  // Stores users, otps, projects, briefs in a local JSON storage file
  // =========================================================================
  getMockStorageFile() {
    const isVercel = Boolean(process.env.VERCEL);
    const dataDir = isVercel ? "/tmp" : path.join(__dirname, "../../data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {}
    }
    const filePath = path.join(dataDir, "local_mock_db.json");
    if (!fs.existsSync(filePath)) {
      const templatePath = path.join(__dirname, "../../data/local_mock_db.json");
      if (fs.existsSync(templatePath)) {
        try {
          fs.copyFileSync(templatePath, filePath);
          return filePath;
        } catch (e) {
          console.warn("[DbFailoverEngine] Could not copy template mock data:", e.message);
        }
      }
      try {
        fs.writeFileSync(
          filePath,
          JSON.stringify({
            users: [],
            otp_codes: [],
            projects: [],
            client_briefs: [],
          }, null, 2)
        );
      } catch (e) {
        console.warn("[DbFailoverEngine] Could not write mock storage file:", e.message);
      }
    }
    return filePath;
  }

  readMockData() {
    try {
      const file = this.getMockStorageFile();
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
      return { users: [], otp_codes: [], projects: [], client_briefs: [] };
    }
  }

  writeMockData(data) {
    try {
      const file = this.getMockStorageFile();
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn("[DbFailoverEngine] Failed to write mock data:", e.message);
    }
  }

  async executeMockQuery(sql, params) {
    const data = this.readMockData();
    const cleanSql = sql.trim().toUpperCase();

    // 1. Select user by email or all users for admin accounts
    if (cleanSql.includes("FROM USERS")) {
      if (cleanSql.includes("WHERE") && cleanSql.includes("EMAIL") && params.length > 0) {
        const email = params[0]?.toLowerCase();
        const user = data.users.find((u) => u.email.toLowerCase() === email);
        return { rows: user ? [user] : [] };
      }
      // Return all users for accounts directory
      const rows = (data.users || []).map((u) => {
        const briefsCount = (data.client_briefs || []).filter(
          (b) => (b.client_email || "").toLowerCase() === (u.email || "").toLowerCase()
        ).length;
        return {
          ...u,
          total_inquiries: briefsCount,
        };
      });
      return { rows: rows.reverse() };
    }

    // 2. Insert user
    if (cleanSql.startsWith("INSERT INTO USERS")) {
      const isClient = cleanSql.includes("'CLIENT'");
      const newUser = {
        user_id: data.users.length + 1,
        email: params[0],
        password_hash: params[1],
        full_name: params[2] || (isClient ? "Client User" : "MCPA Administrator"),
        first_name: params[3] || "",
        last_name: params[5] || "",
        role: isClient ? "client" : (params[3] || "admin"),
        failed_login_attempts: 0,
        lockout_enabled: false,
        lockout_end: null,
        created_at: new Date().toISOString(),
      };
      data.users.push(newUser);
      this.writeMockData(data);
      return { rows: [newUser] };
    }

    // 3. Update user (password, lockout, failed attempts, or social link)
    if (cleanSql.startsWith("UPDATE USERS")) {
      const lastParam = params[params.length - 1];
      const user = data.users.find((u) => {
        if (typeof lastParam === "number") {
          return u.user_id === lastParam;
        }
        if (typeof lastParam === "string") {
          return (
            u.email?.toLowerCase() === lastParam.toLowerCase() ||
            String(u.user_id) === lastParam
          );
        }
        return false;
      });

      if (user) {
        if (cleanSql.includes("PASSWORD_HASH")) {
          user.password_hash = params[0];
          user.failed_login_attempts = 0;
          user.lockout_enabled = false;
          user.lockout_end = null;
        } else if (cleanSql.includes("LOCKOUT_ENABLED = TRUE")) {
          user.failed_login_attempts = params[0];
          user.lockout_enabled = true;
          user.lockout_end = params[1] instanceof Date ? params[1].toISOString() : String(params[1]);
        } else if (cleanSql.includes("FAILED_LOGIN_ATTEMPTS = $1")) {
          user.failed_login_attempts = params[0];
        } else if (cleanSql.includes("FAILED_LOGIN_ATTEMPTS = 0") || cleanSql.includes("LOCKOUT_ENABLED = FALSE")) {
          user.failed_login_attempts = 0;
          user.lockout_enabled = false;
          user.lockout_end = null;
        }
        this.writeMockData(data);
      }
      return { rows: user ? [user] : [] };
    }

    // 4. Invalidate unused OTPs
    if (cleanSql.includes("UPDATE OTP_CODES SET IS_USED = TRUE") && cleanSql.includes("PURPOSE = 'PASSWORD_RESET'")) {
      const email = params[0]?.toLowerCase();
      data.otp_codes.forEach((o) => {
        if (o.email.toLowerCase() === email && o.purpose === "PASSWORD_RESET") {
          o.is_used = true;
        }
      });
      this.writeMockData(data);
      return { rowCount: 1 };
    }

    // 5. Insert OTP code
    if (cleanSql.startsWith("INSERT INTO OTP_CODES")) {
      const newOtp = {
        otp_id: data.otp_codes.length + 1,
        email: params[0].toLowerCase(),
        otp_code: params[1],
        purpose: params[2] || "PASSWORD_RESET",
        is_used: false,
        expires_at: new Date(Date.now() + 120 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      data.otp_codes.push(newOtp);
      this.writeMockData(data);
      return { rows: [newOtp] };
    }

    // 6. Check OTP code
    if (cleanSql.includes("FROM OTP_CODES") && cleanSql.includes("OTP_CODE")) {
      const email = params[0]?.toLowerCase();
      const code = params[1];
      const found = data.otp_codes
        .filter((o) => o.email.toLowerCase() === email && o.otp_code === code && !o.is_used)
        .sort((a, b) => b.otp_id - a.otp_id)[0];

      if (found && new Date(found.expires_at) > new Date()) {
        return { rows: [found] };
      }
      return { rows: [] };
    }

    // 7. Mark OTP as used
    if (cleanSql.includes("UPDATE OTP_CODES SET IS_USED = TRUE WHERE OTP_ID =")) {
      const otpId = params[0];
      const found = data.otp_codes.find((o) => o.otp_id === otpId);
      if (found) found.is_used = true;
      this.writeMockData(data);
      return { rowCount: 1 };
    }

    // 8. Projects queries
    if (cleanSql.includes("FROM PROJECTS")) {
      return { rows: [...data.projects].reverse() };
    }
    if (cleanSql.startsWith("INSERT INTO PROJECTS")) {
      const newP = {
        project_id: data.projects.length + 1,
        name: params[0],
        location: params[1],
        category: params[2],
        year: params[3],
        description: params[4],
        images: params[5] || [],
        is_admin_added: true,
        is_web_visible: params[6] !== false,
        status: params[7] || "completed",
        month: params[8] || "January",
        created_at: new Date().toISOString(),
      };
      data.projects.push(newP);
      this.writeMockData(data);
      return { rows: [newP] };
    }
    if (cleanSql.startsWith("UPDATE PROJECTS")) {
      // SET name = $1, location = $2, category = $3, year = $4, description = $5, images = $6, is_web_visible = $7, status = $8, month = $9 WHERE project_id = $10
      const id = params[params.length - 1];
      const project = data.projects.find((p) => p.project_id === id);
      if (project) {
        project.name = params[0];
        project.location = params[1];
        project.category = params[2];
        project.year = params[3];
        project.description = params[4];
        project.images = params[5] || [];
        project.is_web_visible = params[6] !== false;
        if (params[7] !== undefined) project.status = params[7];
        if (params[8] !== undefined) project.month = params[8];
        this.writeMockData(data);
        return { rows: [project] };
      }
      return { rows: [] };
    }
    if (cleanSql.startsWith("DELETE FROM PROJECTS")) {
      const id = params[0];
      data.projects = data.projects.filter((p) => String(p.project_id) !== String(id));
      this.writeMockData(data);
      return { rowCount: 1 };
    }
    if (cleanSql.startsWith("DELETE FROM USERS")) {
      const email = params[0]?.toLowerCase();
      if (email) {
        data.users = (data.users || []).filter((u) => u.email.toLowerCase() !== email);
      } else {
        data.users = (data.users || []).filter((u) => u.role === "admin");
      }
      this.writeMockData(data);
      return { rowCount: 1 };
    }
    if (cleanSql.startsWith("DELETE FROM CLIENT_BRIEFS")) {
      const email = params[0]?.toLowerCase();
      if (email) {
        data.client_briefs = (data.client_briefs || []).filter((b) => (b.client_email || b.clientEmail || "").toLowerCase() !== email);
      }
      this.writeMockData(data);
      return { rowCount: 1 };
    }

    // 9. Client briefs queries
    if (cleanSql.includes("FROM CLIENT_BRIEFS")) {
      return { rows: [...data.client_briefs].reverse() };
    }
    if (cleanSql.startsWith("INSERT INTO CLIENT_BRIEFS")) {
      const newB = {
        brief_id: data.client_briefs.length + 1,
        submission_id: params[0],
        client_name: params[1],
        client_email: params[2],
        client_phone: params[3],
        project_type: params[4],
        preferred_style: params[5],
        budget_range: params[6],
        lot_status: params[7],
        lot_area: params[8],
        target_date: params[9],
        location: params[10],
        financing_option: params[11],
        uploaded_files: params[12] || [],
        status: params[13] || "Pending Consultation Review",
        created_at: new Date().toISOString(),
      };
      data.client_briefs.push(newB);
      this.writeMockData(data);
      return { rows: [newB] };
    }
    if (cleanSql.startsWith("UPDATE CLIENT_BRIEFS")) {
      const status = params[0];
      const id = params[1];
      const brief = data.client_briefs.find((b) => b.brief_id === id);
      if (brief) brief.status = status;
      this.writeMockData(data);
      return { rows: brief ? [brief] : [] };
    }
    if (cleanSql.startsWith("DELETE FROM CLIENT_BRIEFS")) {
      const id = params[0];
      data.client_briefs = data.client_briefs.filter((b) => b.brief_id !== id);
      this.writeMockData(data);
      return { rowCount: 1 };
    }

    return { rows: [] };
  }
}

// Export singleton instance
module.exports = new DbFailoverEngine();
