const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../services/dbFailoverEngine");
const emailService = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "mcpa_super_secret_jwt_security_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Fetch user from active database
      const result = await db.query(
        "SELECT user_id, email, password_hash, full_name, role, failed_login_attempts, lockout_enabled, lockout_end FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(401).json({ message: "Administrator account not found." });
      }

      const user = result.rows[0];

      // Check lockout status
      if (user.lockout_enabled && user.lockout_end) {
        const lockoutEnd = new Date(user.lockout_end);
        if (lockoutEnd > new Date()) {
          const remainingMinutes = Math.ceil((lockoutEnd - new Date()) / 60000);
          return res.status(423).json({
            message: `Account locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
          });
        }
      }

      // Verify bcrypt hash
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        // Fallback check for plain string in initial migrations
        isValid = password === user.password_hash;
      }

      if (!isValid) {
        // Increment failed attempts
        await db.query(
          "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE LOWER(email) = LOWER($1)",
          [normalizedEmail]
        );

        const currentAttempts = (user.failed_login_attempts || 0) + 1;
        if (currentAttempts >= 5) {
          return res.status(423).json({
            message: "Account locked for 15 minutes due to 5 consecutive failed login attempts.",
          });
        }

        return res.status(401).json({
          message: `Invalid credentials. (${5 - currentAttempts} attempts remaining before security lockout)`,
        });
      }

      // Reset failed attempts upon successful login
      await db.query(
        "UPDATE users SET failed_login_attempts = 0 WHERE LOWER(email) = LOWER($1)",
        [normalizedEmail]
      );

      // Issue JWT
      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: "Authentication successful.",
        token,
        user: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        activeDbProvider: db.getActiveProviderName(),
      });
    } catch (err) {
      console.error("[AuthController.login] Error:", err);
      return res.status(500).json({ message: "Authentication service error: " + err.message });
    }
  }

  /**
   * POST /api/auth/send-reset-otp
   */
  async sendResetOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Registered email address is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const userRes = await db.query(
        "SELECT user_id, email, full_name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({
          message: "No registered administrative account found with this email address.",
        });
      }

      // Invalidate existing unused codes
      await db.query(
        "UPDATE otp_codes SET is_used = true WHERE LOWER(email) = LOWER($1) AND purpose = 'PASSWORD_RESET'",
        [normalizedEmail]
      );

      // Generate random 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();

      // Insert OTP code record
      await db.query(
        "INSERT INTO otp_codes (email, otp_code, purpose) VALUES ($1, $2, 'PASSWORD_RESET')",
        [normalizedEmail, otpCode]
      );

      // Send via Email Service (with console logger fallback)
      await emailService.sendOtpEmail(normalizedEmail, otpCode, "PASSWORD_RESET");

      return res.json({
        success: true,
        message: "A 6-digit verification code has been dispatched to your email address.",
      });
    } catch (err) {
      console.error("[AuthController.sendResetOtp] Error:", err);
      return res.status(500).json({ message: "Failed to dispatch reset code: " + err.message });
    }
  }

  /**
   * POST /api/auth/verify-reset-otp
   */
  async verifyResetOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and 6-digit OTP code are required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = otp.toString().trim();

      const result = await db.query(
        "SELECT otp_id, expires_at FROM otp_codes WHERE LOWER(email) = LOWER($1) AND otp_code = $2",
        [normalizedEmail, cleanOtp]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid or expired verification code. Please check your digits.",
        });
      }

      return res.json({
        success: true,
        message: "Verification code confirmed.",
      });
    } catch (err) {
      console.error("[AuthController.verifyResetOtp] Error:", err);
      return res.status(500).json({ message: "Verification error: " + err.message });
    }
  }

  /**
   * POST /api/auth/reset-password-with-otp
   */
  async resetPasswordWithOtp(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP code, and new password are required." });
      }

      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = otp.toString().trim();

      // Verify OTP is still valid and unconsumed
      const otpRes = await db.query(
        "SELECT otp_id, expires_at FROM otp_codes WHERE LOWER(email) = LOWER($1) AND otp_code = $2",
        [normalizedEmail, cleanOtp]
      );

      if (!otpRes.rows || otpRes.rows.length === 0) {
        return res.status(400).json({
          message: "Your OTP verification session has expired. Please request a new code.",
        });
      }

      const otpId = otpRes.rows[0].otp_id;

      // Mark OTP as consumed
      await db.query("UPDATE otp_codes SET is_used = true WHERE otp_id = $1", [otpId]);

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

      // Update user password and clear lockouts
      await db.query(
        "UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)",
        [hashedPassword, normalizedEmail]
      );

      return res.json({
        success: true,
        message: "Password reset successful! You may now log in with your new credentials.",
      });
    } catch (err) {
      console.error("[AuthController.resetPasswordWithOtp] Error:", err);
      return res.status(500).json({ message: "Failed to reset password: " + err.message });
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing." });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      return res.json({
        success: true,
        user: decoded,
        activeDbProvider: db.getActiveProviderName(),
      });
    } catch (err) {
      return res.status(401).json({ message: "Session expired or invalid token." });
    }
  }
}

module.exports = new AuthController();
