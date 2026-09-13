const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

class DbFailoverEngine {
  constructor() {
    this.azureConnStr = process.env.AZURE_POSTGRES_CONNECTION_STRING || "";
    this.supabaseConnStr = process.env.SUPABASE_CONNECTION_STRING || "";
    this.localConnStr = process.env.LOCAL_DB_CONNECTION || "";

    this.isFailoverActive = false;
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
      const isSsl = connectionString.includes("sslmode=require") || !connectionString.includes("localhost");
      return new Pool({
        connectionString,
        ssl: isSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 10,
      });
    } catch (e) {
      console.warn("[DbFailoverEngine] Pool creation error:", e.message);
      return null;
    }
  }

  initPools() {
    if (this.azureConnStr) {
      this.azurePool = this.createPool(this.azureConnStr);
    }
    if (this.supabaseConnStr) {
      this.supabasePool = this.createPool(this.supabaseConnStr);
    }
    if (this.localConnStr) {
      this.localPool = this.createPool(this.localConnStr);
    }

    if (!this.azurePool && !this.supabasePool && !this.localPool) {
      this.isMockActive = true;
      console.log("[DbFailoverEngine] No live PostgreSQL connection strings provided. Operating in Local Resilient Mock Storage mode.");
    }
  }

  getActiveProviderName() {
    if (this.isMockActive) return "Local Resilient Storage (Dev Mode)";
    if (this.isFailoverActive) return "Supabase Backup (Hot Standby)";
    if (this.azurePool) return "Azure Primary (Flexible Server)";
    if (this.supabasePool) return "Supabase Backup";
    if (this.localPool) return "Local PostgreSQL";
    return "Local Resilient Storage (Dev Mode)";
  }

  async triggerFailover(reason) {
    if (this.isFailoverActive) return;
    this.isFailoverActive = true;
    console.warn(`\x1b[33m🚨 [DbFailoverEngine] AUTOMATIC DUAL-CLOUD FAILOVER ACTIVATED: ${reason}. Switched active database to Supabase Backup.\x1b[0m`);
  }

  async triggerFailback() {
    if (!this.isFailoverActive) return;
    this.isFailoverActive = false;
    console.log(`\x1b[32m🟢 [DbFailoverEngine] AUTOMATIC DUAL-CLOUD FAILBACK RESTORED: Azure Primary Database is verified healthy. Switched active database back to Azure Primary.\x1b[0m`);
  }

  /**
   * Main query execution method with automatic failover
   */
  async query(text, params = []) {
    // 1. If Mock Storage is active, delegate to mock handler
    if (this.isMockActive) {
      return this.executeMockQuery(text, params);
    }

    // 2. Try Azure Primary if healthy and configured
    if (!this.isFailoverActive && this.azurePool) {
      try {
        const res = await this.azurePool.query(text, params);
        return res;
      } catch (err) {
        if (this.isConnectionError(err)) {
          await this.triggerFailover(err.message);
        } else {
          throw err;
        }
      }
    }

    // 3. Try Supabase Standby if failover is active or Azure not configured
    if (this.supabasePool) {
      try {
        const res = await this.supabasePool.query(text, params);
        return res;
      } catch (err) {
        console.error("[DbFailoverEngine] Supabase query failed:", err.message);
        if (this.localPool) {
          try {
            return await this.localPool.query(text, params);
          } catch (localErr) {
            console.error("[DbFailoverEngine] Local DB also failed:", localErr.message);
          }
        }
        // Fallback to mock storage rather than crashing during development
        console.warn("[DbFailoverEngine] Falling back to Local Resilient Mock Storage.");
        this.isMockActive = true;
        return this.executeMockQuery(text, params);
      }
    }

    // 4. Try Local PostgreSQL pool if configured
    if (this.localPool) {
      try {
        return await this.localPool.query(text, params);
      } catch (err) {
        console.warn("[DbFailoverEngine] Local pool unreachable. Falling back to Mock Storage.");
        this.isMockActive = true;
        return this.executeMockQuery(text, params);
      }
    }

    // 5. Final fallback to mock
    this.isMockActive = true;
    return this.executeMockQuery(text, params);
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
    if (!this.azurePool) return;

    setInterval(async () => {
      if (!this.isFailoverActive) return;

      try {
        await this.azurePool.query("SELECT 1");
        this.consecutiveAzureSuccesses++;
        if (this.consecutiveAzureSuccesses >= 2) {
          this.consecutiveAzureSuccesses = 0;
          await this.triggerFailback();
        }
      } catch (e) {
        this.consecutiveAzureSuccesses = 0;
      }
    }, 30000);
  }

  // =========================================================================
  // LOCAL RESILIENT MOCK ENGINE (Ensures zero-crash development)
  // Stores users, otps, projects, briefs in a local JSON storage file
  // =========================================================================
  getMockStorageFile() {
    const dataDir = path.join(__dirname, "../../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, "local_mock_db.json");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          users: [],
          otp_codes: [],
          projects: [],
          client_briefs: [],
        }, null, 2)
      );
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

    // 1. Select user by email
    if (cleanSql.includes("FROM USERS") && cleanSql.includes("EMAIL")) {
      const email = params[0]?.toLowerCase();
      const user = data.users.find((u) => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [] };
    }

    // 2. Insert user
    if (cleanSql.startsWith("INSERT INTO USERS")) {
      const newUser = {
        user_id: data.users.length + 1,
        email: params[0],
        password_hash: params[1],
        full_name: params[2] || "MCPA Administrator",
        role: params[3] || "admin",
        failed_login_attempts: 0,
        lockout_enabled: false,
        lockout_end: null,
        created_at: new Date().toISOString(),
      };
      data.users.push(newUser);
      this.writeMockData(data);
      return { rows: [newUser] };
    }

    // 3. Update user (password or lockout)
    if (cleanSql.startsWith("UPDATE USERS")) {
      const email = params[params.length - 1]?.toLowerCase();
      const user = data.users.find((u) => u.email.toLowerCase() === email);
      if (user) {
        if (cleanSql.includes("PASSWORD_HASH")) {
          user.password_hash = params[0];
          user.failed_login_attempts = 0;
          user.lockout_enabled = false;
          user.lockout_end = null;
        } else if (cleanSql.includes("FAILED_LOGIN_ATTEMPTS = FAILED_LOGIN_ATTEMPTS + 1")) {
          user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
          if (user.failed_login_attempts >= 5) {
            user.lockout_enabled = true;
            user.lockout_end = new Date(Date.now() + 15 * 60000).toISOString();
          }
        } else if (cleanSql.includes("FAILED_LOGIN_ATTEMPTS = 0")) {
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
        created_at: new Date().toISOString(),
      };
      data.projects.push(newP);
      this.writeMockData(data);
      return { rows: [newP] };
    }
    if (cleanSql.startsWith("DELETE FROM PROJECTS")) {
      const id = params[0];
      data.projects = data.projects.filter((p) => p.project_id !== id);
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
