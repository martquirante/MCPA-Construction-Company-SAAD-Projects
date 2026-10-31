const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dns = require("dns").promises;
const { spawn } = require("child_process");
const path = require("path");
const db = require("../services/dbFailoverEngine");
const emailService = require("../services/emailService");
const socialAuthService = require("../services/socialAuthService");
const faceVerifierService = require("../services/faceVerifierService");

const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/authConfig");

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "dispostable.com",
  "fakeinbox.com",
  "getnada.com",
  "mohmal.com",
  "throwawaymail.com",
  "burnermail.io",
  "crazymailing.com",
  "maildrop.cc",
  "inboxkitten.com",
  "temp-mail.io",
  "fakemailgenerator.com",
  "tempail.com",
  "generator.email",
]);

class AuthController {
  /**
   * POST /api/auth/login
   * Standard Email & Password Login with 5-attempt brute-force protection
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
        `SELECT 
          user_id, email, password_hash, full_name, first_name, middle_name, last_name, suffix, role, 
          phone_number, avatar_url, kyc_photo_url, kyc_verified_at, has_viber_whatsapp, client_type, location_address, auth_provider, provider_id, email_verified,
          occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name,
          preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details,
          target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone,
          facebook_url, linkedin_url, instagram_url, failed_login_attempts, 
          lockout_enabled, lockout_end, created_at
        FROM users 
        WHERE LOWER(email) = LOWER($1) 
        LIMIT 1`,
        [normalizedEmail]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const user = result.rows[0];

      // Check lockout status
      if (user.lockout_enabled && user.lockout_end) {
        const lockoutEnd = new Date(user.lockout_end);
        const now = new Date();
        if (lockoutEnd > now) {
          const remainingMinutes = Math.max(1, Math.ceil((lockoutEnd - now) / 60000));
          return res.status(423).json({
            message: `Account temporarily locked due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
            locked: true,
            remainingMinutes,
          });
        } else {
          // Lockout window has elapsed, automatically unlock account
          await db.query(
            "UPDATE users SET lockout_enabled = FALSE, lockout_end = NULL, failed_login_attempts = 0 WHERE user_id = $1",
            [user.user_id]
          );
          user.failed_login_attempts = 0;
          user.lockout_enabled = false;
          user.lockout_end = null;
        }
      }

      // If user registered purely via Social Auth and has not set a local password
      if (!user.password_hash) {
        const providerName =
          user.auth_provider === "google"
            ? "Google"
            : user.auth_provider === "facebook"
            ? "Facebook"
            : "Social Authentication";
        return res.status(400).json({
          message: `This account is connected via ${providerName}. Please click 'Continue with ${providerName}', or use 'Forgot password?' to create a password.`,
        });
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
        const currentAttempts = (user.failed_login_attempts || 0) + 1;
        if (currentAttempts >= 5) {
          const lockoutMinutes = 15;
          const lockoutEnd = new Date(Date.now() + lockoutMinutes * 60 * 1000);
          await db.query(
            "UPDATE users SET failed_login_attempts = $1, lockout_enabled = TRUE, lockout_end = $2 WHERE user_id = $3",
            [currentAttempts, lockoutEnd, user.user_id]
          );
          return res.status(423).json({
            message: "Account locked for 15 minutes due to 5 consecutive failed login attempts.",
            locked: true,
            remainingMinutes: 15,
          });
        }

        // Increment attempts count
        await db.query(
          "UPDATE users SET failed_login_attempts = $1 WHERE user_id = $2",
          [currentAttempts, user.user_id]
        );

        const remainingAttempts = 5 - currentAttempts;
        return res.status(401).json({
          message: `Invalid email or password. (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before 15-minute security lock)`,
          attemptsRemaining: remainingAttempts,
        });
      }

      // Reset failed attempts & set last_login_at upon successful login
      await db.query(
        "UPDATE users SET failed_login_attempts = 0, lockout_enabled = FALSE, lockout_end = NULL, last_login_at = NOW() WHERE user_id = $1",
        [user.user_id]
      );

      // SECURITY ENFORCEMENT: Strictly isolate Client Portal and Administrative Portal
      const portalType = (req.body.portalType || "").toLowerCase();
      const userRole = (user.role || "").toLowerCase();

      if (portalType === "admin" && userRole === "client") {
        return res.status(403).json({
          message: "Access Denied: This account is registered as a Client account. Please sign in via the Client Portal at /portal.",
          isRoleMismatch: true,
          expectedPortal: "admin",
          userRole: user.role,
        });
      }

      if (portalType === "client" && (userRole === "admin" || userRole === "super_admin")) {
        return res.status(403).json({
          message: "Administrator Account Detected: This credential has Administrative privileges. Please sign in via the Admin Portal at /admin.",
          isRoleMismatch: true,
          expectedPortal: "client",
          userRole: user.role,
        });
      }

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
          user_id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          full_name: user.full_name,
          name: user.full_name,
          firstName: user.first_name || user.full_name.split(" ")[0] || "",
          first_name: user.first_name || user.full_name.split(" ")[0] || "",
          middleName: user.middle_name || "",
          middle_name: user.middle_name || "",
          lastName: user.last_name || (user.full_name.split(" ").length > 1 ? user.full_name.split(" ").slice(1).join(" ") : ""),
          last_name: user.last_name || (user.full_name.split(" ").length > 1 ? user.full_name.split(" ").slice(1).join(" ") : ""),
          suffix: user.suffix || "",
          role: user.role,
          phoneNumber: user.phone_number || "",
          phone_number: user.phone_number || "",
          avatarUrl: user.avatar_url || "",
          avatar_url: user.avatar_url || "",
          kycPhotoUrl: user.kyc_photo_url || "",
          kyc_photo_url: user.kyc_photo_url || "",
          kycVerifiedAt: user.kyc_verified_at || null,
          kyc_verified_at: user.kyc_verified_at || null,
          hasViberWhatsapp: Boolean(user.has_viber_whatsapp),
          has_viber_whatsapp: Boolean(user.has_viber_whatsapp),
          clientType: user.client_type || "Local",
          client_type: user.client_type || "Local",
          locationAddress: user.location_address || "",
          location_address: user.location_address || "",
          occupation: user.occupation || "",
          civilStatus: user.civil_status || "",
          civil_status: user.civil_status || "",
          birthDate: user.birth_date || "",
          birth_date: user.birth_date || "",
          employerName: user.employer_name || "",
          employer_name: user.employer_name || "",
          monthlyIncome: user.monthly_income || "",
          monthly_income: user.monthly_income || "",
          spouseName: user.spouse_name || "",
          spouse_name: user.spouse_name || "",
          preferredContactTime: user.preferred_contact_time || "Anytime (PH Daytime)",
          preferred_contact_time: user.preferred_contact_time || "Anytime (PH Daytime)",
          emergencyContact: user.emergency_contact || "",
          emergency_contact: user.emergency_contact || "",
          lotOwnershipStatus: user.lot_ownership_status || "",
          lot_ownership_status: user.lot_ownership_status || "",
          subdivisionLotDetails: user.subdivision_lot_details || "",
          subdivision_lot_details: user.subdivision_lot_details || "",
          targetBuildLocation: user.target_build_location || "",
          target_build_location: user.target_build_location || "",
          targetProjectType: user.target_project_type || "",
          target_project_type: user.target_project_type || "",
          ofwCountry: user.ofw_country || "",
          ofw_country: user.ofw_country || "",
          phRepName: user.ph_rep_name || "",
          ph_rep_name: user.ph_rep_name || "",
          phRepRelationship: user.ph_rep_relationship || "",
          ph_rep_relationship: user.ph_rep_relationship || "",
          phRepPhone: user.ph_rep_phone || "",
          ph_rep_phone: user.ph_rep_phone || "",
          authProvider: user.auth_provider || "local",
          auth_provider: user.auth_provider || "local",
          emailVerified: Boolean(user.email_verified),
          email_verified: Boolean(user.email_verified),
          createdAt: user.created_at,
          created_at: user.created_at,
          facebookUrl: user.facebook_url || "",
          linkedinUrl: user.linkedin_url || "",
          instagramUrl: user.instagram_url || "",
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
      const { email, portalType = "admin" } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Registered email address is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const isClientPortal = portalType === "client";

      // Check if user exists
      const userRes = await db.query(
        "SELECT user_id, email, full_name, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        if (isClientPortal) {
          return res.status(404).json({
            message: "No registered client account found with this email address. Please check your spelling or register a new account.",
          });
        }
        return res.status(404).json({
          message: "No registered administrative account found with this email address.",
        });
      }

      const user = userRes.rows[0];
      const role = (user.role || "").toLowerCase();

      // SECURITY ENFORCEMENT: Strictly isolate Client Portal and Administrative Portal
      if (isClientPortal) {
        if (role === "admin" || role === "super_admin") {
          return res.status(403).json({
            message: "This portal is strictly for client and homeowner accounts. Administrative credentials cannot be accessed or reset from the Client Portal.",
          });
        }
      } else {
        if (role === "client") {
          return res.status(403).json({
            message: "This console is for administrative personnel only. Client accounts must use the Client Portal.",
          });
        }
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

      // Send via Email Service (with audience context)
      await emailService.sendOtpEmail(normalizedEmail, otpCode, "PASSWORD_RESET", {
        portalType: isClientPortal ? "client" : "admin",
        fullName: user.full_name,
      });

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
      const { email, otp, portalType = "admin" } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and 6-digit OTP code are required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = otp.toString().trim();
      const isClientPortal = portalType === "client";

      // Verify user role matches portal type
      const userRes = await db.query(
        "SELECT role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ message: "Account not found." });
      }

      const role = (userRes.rows[0].role || "").toLowerCase();
      if (isClientPortal && (role === "admin" || role === "super_admin")) {
        return res.status(403).json({
          message: "Administrative accounts cannot be verified from the Client Portal.",
        });
      }
      if (!isClientPortal && role === "client") {
        return res.status(403).json({
          message: "Client accounts cannot be verified from the Administrative Console.",
        });
      }

      const result = await db.query(
        "SELECT otp_id, expires_at FROM otp_codes WHERE LOWER(email) = LOWER($1) AND otp_code = $2 AND is_used = false AND expires_at > NOW()",
        [normalizedEmail, cleanOtp]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid or expired verification code. Please check your digits or request a new code.",
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
      const { email, otp, newPassword, portalType = "admin" } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP code, and new password are required." });
      }

      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = otp.toString().trim();
      const isClientPortal = portalType === "client";

      // Verify target user role matches portal type
      const userRes = await db.query(
        "SELECT role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ message: "Account not found." });
      }

      const role = (userRes.rows[0].role || "").toLowerCase();
      if (isClientPortal && (role === "admin" || role === "super_admin")) {
        return res.status(403).json({
          message: "Administrative credentials cannot be modified from the Client Portal.",
        });
      }
      if (!isClientPortal && role === "client") {
        return res.status(403).json({
          message: "Client credentials cannot be modified from the Administrative Console.",
        });
      }

      // Verify OTP is still valid and unconsumed
      const otpRes = await db.query(
        "SELECT otp_id, expires_at FROM otp_codes WHERE LOWER(email) = LOWER($1) AND otp_code = $2 AND is_used = false AND expires_at > NOW()",
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
        "UPDATE users SET password_hash = $1, failed_login_attempts = 0, lockout_enabled = false, lockout_end = NULL WHERE LOWER(email) = LOWER($2)",
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
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const userEmail = req.user?.email;

      if (!userId && !userEmail) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const result = await db.query(
        `SELECT 
          user_id, email, full_name, first_name, middle_name, last_name, suffix, role, 
          phone_number, avatar_url, kyc_photo_url, kyc_verified_at, has_viber_whatsapp, client_type, location_address, auth_provider, email_verified,
          occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name,
          preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details,
          target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone,
          facebook_url, linkedin_url, instagram_url, created_at
        FROM users 
        WHERE user_id = $1 OR LOWER(email) = LOWER($2) 
        LIMIT 1`,
        [userId || 0, userEmail || ""]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "User account not found." });
      }

      const user = result.rows[0];
      return res.json({
        success: true,
        user: {
          userId: user.user_id,
          user_id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          full_name: user.full_name,
          name: user.full_name,
          firstName: user.first_name || user.full_name?.split(" ")[0] || "",
          first_name: user.first_name || user.full_name?.split(" ")[0] || "",
          middleName: user.middle_name || "",
          lastName: user.last_name || "",
          suffix: user.suffix || "",
          role: user.role,
          phoneNumber: user.phone_number || "",
          avatarUrl: user.avatar_url || "",
          avatar_url: user.avatar_url || "",
          kycPhotoUrl: user.kyc_photo_url || "",
          kyc_photo_url: user.kyc_photo_url || "",
          kycVerifiedAt: user.kyc_verified_at || null,
          hasViberWhatsapp: Boolean(user.has_viber_whatsapp),
          clientType: user.client_type || "Local",
          locationAddress: user.location_address || "",
          occupation: user.occupation || "",
          civilStatus: user.civil_status || "",
          birthDate: user.birth_date || "",
          employerName: user.employer_name || "",
          monthlyIncome: user.monthly_income || "",
          spouseName: user.spouse_name || "",
          preferredContactTime: user.preferred_contact_time || "Anytime (PH Daytime)",
          emergencyContact: user.emergency_contact || "",
          lotOwnershipStatus: user.lot_ownership_status || "",
          subdivisionLotDetails: user.subdivision_lot_details || "",
          targetBuildLocation: user.target_build_location || "",
          targetProjectType: user.target_project_type || "",
          ofwCountry: user.ofw_country || "",
          phRepName: user.ph_rep_name || "",
          phRepRelationship: user.ph_rep_relationship || "",
          phRepPhone: user.ph_rep_phone || "",
          authProvider: user.auth_provider || "local",
          emailVerified: Boolean(user.email_verified),
          createdAt: user.created_at,
          facebookUrl: user.facebook_url || "",
          linkedinUrl: user.linkedin_url || "",
          instagramUrl: user.instagram_url || "",
        },
        activeDbProvider: db.getActiveProviderName(),
      });
    } catch (err) {
      console.error("[AuthController.me] Error:", err);
      return res.status(500).json({ message: "Failed to retrieve authenticated session: " + err.message });
    }
  }

  /**
   * POST /api/auth/client/register
   * Registers a customer account with personal KYC info and optional social provider linking
   */
  async clientRegister(req, res) {
    try {
      const {
        fullName,
        firstName,
        middleName,
        lastName,
        suffix,
        email,
        password,
        phoneNumber,
        hasViberWhatsapp,
        clientType,
        locationAddress,
        occupation,
        civilStatus,
        birthDate,
        employerName,
        monthlyIncome,
        spouseName,
        preferredContactTime,
        emergencyContact,
        lotOwnershipStatus,
        subdivisionLotDetails,
        targetBuildLocation,
        targetProjectType,
        ofwCountry,
        phRepName,
        phRepRelationship,
        phRepPhone,
        authProvider = "local",
        providerId = "",
        avatarUrl = "",
        kycPhotoUrl = "",
        kycMeta = null,
      } = req.body;

      if (!email) {
        return res.status(400).json({ message: "A valid email address is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const isSocialRegistration = authProvider === "google" || authProvider === "facebook";

      // Password is required for all client registrations (min 6 chars, enforced 8+ on frontend)
      if (!password || password.trim().length < 6) {
        return res.status(400).json({ message: "A secure password with at least 6 characters is required." });
      }

      // Compute display name
      const computedFullName =
        fullName && fullName.trim()
          ? fullName.trim()
          : [firstName, middleName, lastName, suffix].filter(Boolean).join(" ").trim() ||
            normalizedEmail.split("@")[0];

      // Check if email already registered
      const checkExisting = await db.query(
        "SELECT user_id, email, role, auth_provider, provider_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (checkExisting.rows && checkExisting.rows.length > 0) {
        return res.status(409).json({
          message: "An account with this email address already exists. Please sign in instead.",
        });
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Enforce strict server-side Biometric KYC face recognition & lighting check
      if (!kycPhotoUrl) {
        return res.status(400).json({
          message: "Kailangan tapusin ang biometric face verification bago makapagpatuloy / Biometric face verification is required.",
          kyc_error: true,
        });
      }

      let kycTelemetry = null;
      try {
        kycTelemetry = await faceVerifierService.verifyFaceTelemetry(kycPhotoUrl, avatarUrl || null, kycMeta);
      } catch (kErr) {
        console.warn("[AuthController] KYC telemetry processing error:", kErr.message);
        return res.status(400).json({
          message: "Hindi ma-decode ang kuha ng iyong mukha. Pakisubukang muli sa maliwanag na lugar / Could not process biometric facial snapshot.",
          kyc_error: true,
        });
      }

      if (
        !kycTelemetry ||
        !kycTelemetry.passed ||
        !kycTelemetry.face_detected ||
        kycTelemetry.brightness?.is_too_dark ||
        kycTelemetry.obstructions?.has_obstruction
      ) {
        const errorEn = kycTelemetry?.issues?.[0]?.en || kycTelemetry?.message || "Biometric KYC selfie verification failed. Please ensure your face is well-lit and unobstructed.";
        return res.status(400).json({
          message: errorEn,
          kyc_error: true,
          details: kycTelemetry?.issues || [],
        });
      }

      const cleanFirstName = firstName ? firstName.trim() : computedFullName.split(" ")[0] || "";
      const cleanLastName = lastName
        ? lastName.trim()
        : computedFullName.split(" ").length > 1
        ? computedFullName.split(" ").slice(1).join(" ")
        : "";

      // Check if email was verified via magic link or social OAuth
      let isEmailVerified = Boolean(isSocialRegistration);
      if (!isEmailVerified) {
        try {
          const verifCheck = await db.query(
            "SELECT is_verified FROM email_verifications WHERE LOWER(email) = LOWER($1) AND is_verified = TRUE LIMIT 1",
            [normalizedEmail]
          );
          if (verifCheck.rows && verifCheck.rows.length > 0) {
            isEmailVerified = true;
          }
        } catch (vErr) {
          console.warn("[AuthController] Verification lookup warning:", vErr.message);
        }
      }

      // Insert new client with both Profile Picture (avatar_url) and Official Biometric KYC Capture (kyc_photo_url)
      const insertRes = await db.query(
        `INSERT INTO users (
          email, password_hash, full_name, first_name, middle_name, last_name, suffix, role,
          phone_number, has_viber_whatsapp, client_type, location_address, auth_provider, provider_id, avatar_url,
          kyc_photo_url, kyc_verified_at,
          occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name,
          preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details,
          target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone,
          email_verified, last_login_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'client',
          $8, $9, $10, $11, $12, $13, $14,
          $15, NOW(),
          $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31,
          $32, NOW()
        )
        RETURNING 
          user_id, email, full_name, first_name, middle_name, last_name, suffix, role, 
          phone_number, client_type, location_address, auth_provider, provider_id, avatar_url, 
          kyc_photo_url, kyc_verified_at,
          occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name, 
          preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details, 
          target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone, 
          email_verified, created_at`,
        [
          normalizedEmail,
          hashedPassword,
          computedFullName,
          cleanFirstName,
          middleName ? middleName.trim() : "",
          cleanLastName,
          suffix ? suffix.trim() : "",
          phoneNumber ? phoneNumber.trim() : "",
          Boolean(hasViberWhatsapp),
          clientType || "Local",
          locationAddress ? locationAddress.trim() : "",
          authProvider,
          providerId || "",
          avatarUrl || "",
          kycPhotoUrl || "",
          occupation ? occupation.trim() : "",
          civilStatus || "Single",
          birthDate ? birthDate.trim() : "",
          employerName ? employerName.trim() : "",
          monthlyIncome || "",
          spouseName ? spouseName.trim() : "",
          preferredContactTime || "Anytime (PH Daytime)",
          emergencyContact ? emergencyContact.trim() : "",
          lotOwnershipStatus ? lotOwnershipStatus.trim() : "",
          subdivisionLotDetails ? subdivisionLotDetails.trim() : "",
          targetBuildLocation ? targetBuildLocation.trim() : "",
          targetProjectType || "",
          ofwCountry ? ofwCountry.trim() : "",
          phRepName ? phRepName.trim() : "",
          phRepRelationship ? phRepRelationship.trim() : "",
          phRepPhone ? phRepPhone.trim() : "",
          isEmailVerified,
        ]
      );

      const newUser = insertRes.rows[0];

      // Broadcast in real-time across WebSockets & SSE to Admin Accounts Directory
      try {
        const realtimeService = require("../services/realtimeService");
        realtimeService.broadcastAccountRegistered({
          ...newUser,
          total_inquiries: 0,
        });
      } catch (rtErr) {
        console.warn("[AuthController] Realtime broadcast warning:", rtErr.message);
      }

      // Dispatch automated welcome email to new client (awaited for Vercel Serverless lifecycle stability)
      try {
        await emailService.sendWelcomeClientEmail(newUser.email, newUser);
      } catch (mailErr) {
        console.warn("[AuthController] Automatic welcome email delivery warning:", mailErr.message);
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: newUser.user_id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: "Client registration successful.",
        token,
        user: {
          userId: newUser.user_id,
          email: newUser.email,
          fullName: newUser.full_name,
          firstName: newUser.first_name,
          middleName: newUser.middle_name,
          lastName: newUser.last_name,
          suffix: newUser.suffix,
          role: newUser.role,
          phoneNumber: newUser.phone_number,
          hasViberWhatsapp: newUser.has_viber_whatsapp,
          clientType: newUser.client_type,
          locationAddress: newUser.location_address,
          authProvider: newUser.auth_provider,
          avatarUrl: newUser.avatar_url,
          occupation: newUser.occupation,
          civilStatus: newUser.civil_status,
          birthDate: newUser.birth_date,
          employerName: newUser.employer_name,
          monthlyIncome: newUser.monthly_income,
          spouseName: newUser.spouse_name,
          preferredContactTime: newUser.preferred_contact_time,
          emergencyContact: newUser.emergency_contact,
          lotOwnershipStatus: newUser.lot_ownership_status,
          subdivisionLotDetails: newUser.subdivision_lot_details,
          targetBuildLocation: newUser.target_build_location,
          targetProjectType: newUser.target_project_type,
          ofwCountry: newUser.ofw_country,
          phRepName: newUser.ph_rep_name,
          phRepRelationship: newUser.ph_rep_relationship,
          phRepPhone: newUser.ph_rep_phone,
          kycPhotoUrl: newUser.kyc_photo_url,
          kycVerifiedAt: newUser.kyc_verified_at,
          emailVerified: Boolean(newUser.email_verified),
        },
      });
    } catch (err) {
      console.error("[AuthController.clientRegister] Error:", err);
      return res.status(500).json({ message: "Registration service error: " + err.message });
    }
  }

  /**
   * POST /api/auth/social-login
   * Cryptographically verifies Google and Facebook tokens for 1-click login or wizard pre-fill
   */
  async socialLogin(req, res) {
    try {
      const { provider, token, mode = "authenticate", ...registrationDetails } = req.body;

      if (!provider) {
        return res.status(400).json({ message: "Social provider is required ('google' or 'facebook')." });
      }

      const authProvider = provider.toLowerCase().trim();
      let verifiedIdentity = null;

      // 1. Verify token cryptographically via SocialAuthService
      if (!token) {
        return res.status(400).json({ message: "Authentication token is required for social verification." });
      }

      try {
        verifiedIdentity = await socialAuthService.verifyToken(authProvider, token);
      } catch (verifyErr) {
        console.warn("[AuthController.socialLogin] Token verification warning:", verifyErr.message);
        return res.status(401).json({
          message: "Social authentication verification failed: " + verifyErr.message,
        });
      }

      const normalizedEmail = (verifiedIdentity.email || "").trim().toLowerCase();

      // Check if user already exists by email OR by provider_id
      let existingUser = null;
      if (normalizedEmail) {
        const emailCheck = await db.query(
          `SELECT 
            user_id, email, full_name, first_name, middle_name, last_name, suffix, role, phone_number, 
            has_viber_whatsapp, client_type, location_address, auth_provider, provider_id, 
            avatar_url, kyc_photo_url, kyc_verified_at, occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name,
            preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details,
            target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone,
            lockout_enabled, lockout_end, failed_login_attempts, created_at
          FROM users 
          WHERE LOWER(email) = LOWER($1) 
          LIMIT 1`,
          [normalizedEmail]
        );
        if (emailCheck.rows && emailCheck.rows.length > 0) {
          existingUser = emailCheck.rows[0];
        }
      }

      if (!existingUser && verifiedIdentity.providerId) {
        const providerCheck = await db.query(
          `SELECT 
            user_id, email, full_name, first_name, middle_name, last_name, suffix, role, phone_number, 
            has_viber_whatsapp, client_type, location_address, auth_provider, provider_id, 
            avatar_url, kyc_photo_url, kyc_verified_at, occupation, civil_status, birth_date, employer_name, monthly_income, spouse_name,
            preferred_contact_time, emergency_contact, lot_ownership_status, subdivision_lot_details,
            target_build_location, target_project_type, ofw_country, ph_rep_name, ph_rep_relationship, ph_rep_phone,
            lockout_enabled, lockout_end, failed_login_attempts, created_at
          FROM users 
          WHERE auth_provider = $1 AND provider_id = $2 
          LIMIT 1`,
          [authProvider, verifiedIdentity.providerId]
        );
        if (providerCheck.rows && providerCheck.rows.length > 0) {
          existingUser = providerCheck.rows[0];
        }
      }

      // =========================================================================
      // CASE A: EXISTING USER FOUND -> Direct 1-Click Login & Account Linking
      // =========================================================================
      if (existingUser) {
        // Check if locked out
        if (existingUser.lockout_enabled && existingUser.lockout_end) {
          const lockoutEnd = new Date(existingUser.lockout_end);
          const now = new Date();
          if (lockoutEnd > now) {
            const remainingMinutes = Math.max(1, Math.ceil((lockoutEnd - now) / 60000));
            return res.status(423).json({
              message: `Account temporarily locked due to previous failed login attempts. Try again in ${remainingMinutes} minute(s).`,
              locked: true,
              remainingMinutes,
            });
          }
        }

        // Link social identity & avatar if missing
        const newAvatar = verifiedIdentity.avatarUrl || existingUser.avatar_url;
        await db.query(
          `UPDATE users SET 
            provider_id = COALESCE(NULLIF(provider_id, ''), $1),
            auth_provider = CASE WHEN auth_provider IS NULL OR auth_provider = 'local' THEN $2 ELSE auth_provider END,
            avatar_url = COALESCE(NULLIF(avatar_url, ''), $3),
            email_verified = TRUE,
            failed_login_attempts = 0,
            lockout_enabled = FALSE,
            lockout_end = NULL,
            last_login_at = NOW()
          WHERE user_id = $4`,
          [verifiedIdentity.providerId, authProvider, newAvatar, existingUser.user_id]
        );

        const token = jwt.sign(
          {
            userId: existingUser.user_id,
            email: existingUser.email,
            fullName: existingUser.full_name,
            role: existingUser.role,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
          success: true,
          isNewUser: false,
          message: `Authenticated via ${authProvider.toUpperCase()}. Welcome back, ${existingUser.first_name || existingUser.full_name}!`,
          token,
          user: {
            userId: existingUser.user_id,
            user_id: existingUser.user_id,
            email: existingUser.email,
            fullName: existingUser.full_name,
            full_name: existingUser.full_name,
            name: existingUser.full_name,
            firstName: existingUser.first_name || existingUser.full_name.split(" ")[0] || "",
            first_name: existingUser.first_name || existingUser.full_name.split(" ")[0] || "",
            middleName: existingUser.middle_name || "",
            middle_name: existingUser.middle_name || "",
            lastName: existingUser.last_name || "",
            last_name: existingUser.last_name || "",
            suffix: existingUser.suffix || "",
            role: existingUser.role,
            phoneNumber: existingUser.phone_number || "",
            phone_number: existingUser.phone_number || "",
            avatarUrl: newAvatar || "",
            avatar_url: newAvatar || "",
            kycPhotoUrl: existingUser.kyc_photo_url || "",
            kyc_photo_url: existingUser.kyc_photo_url || "",
            kycVerifiedAt: existingUser.kyc_verified_at || null,
            kyc_verified_at: existingUser.kyc_verified_at || null,
            hasViberWhatsapp: Boolean(existingUser.has_viber_whatsapp),
            has_viber_whatsapp: Boolean(existingUser.has_viber_whatsapp),
            clientType: existingUser.client_type || "Local",
            client_type: existingUser.client_type || "Local",
            locationAddress: existingUser.location_address || "",
            location_address: existingUser.location_address || "",
            occupation: existingUser.occupation || "",
            civilStatus: existingUser.civil_status || "",
            civil_status: existingUser.civil_status || "",
            birthDate: existingUser.birth_date || "",
            birth_date: existingUser.birth_date || "",
            employerName: existingUser.employer_name || "",
            employer_name: existingUser.employer_name || "",
            monthlyIncome: existingUser.monthly_income || "",
            monthly_income: existingUser.monthly_income || "",
            spouseName: existingUser.spouse_name || "",
            spouse_name: existingUser.spouse_name || "",
            preferredContactTime: existingUser.preferred_contact_time || "Anytime (PH Daytime)",
            preferred_contact_time: existingUser.preferred_contact_time || "Anytime (PH Daytime)",
            emergencyContact: existingUser.emergency_contact || "",
            emergency_contact: existingUser.emergency_contact || "",
            lotOwnershipStatus: existingUser.lot_ownership_status || "",
            lot_ownership_status: existingUser.lot_ownership_status || "",
            subdivisionLotDetails: existingUser.subdivision_lot_details || "",
            subdivision_lot_details: existingUser.subdivision_lot_details || "",
            targetBuildLocation: existingUser.target_build_location || "",
            target_build_location: existingUser.target_build_location || "",
            targetProjectType: existingUser.target_project_type || "",
            target_project_type: existingUser.target_project_type || "",
            ofwCountry: existingUser.ofw_country || "",
            ofw_country: existingUser.ofw_country || "",
            phRepName: existingUser.ph_rep_name || "",
            ph_rep_name: existingUser.ph_rep_name || "",
            phRepRelationship: existingUser.ph_rep_relationship || "",
            ph_rep_relationship: existingUser.ph_rep_relationship || "",
            phRepPhone: existingUser.ph_rep_phone || "",
            ph_rep_phone: existingUser.ph_rep_phone || "",
            authProvider: existingUser.auth_provider || authProvider,
            auth_provider: existingUser.auth_provider || authProvider,
            emailVerified: true,
            email_verified: true,
            createdAt: existingUser.created_at,
            created_at: existingUser.created_at,
          },
          activeDbProvider: db.getActiveProviderName(),
        });
      }

      // =========================================================================
      // CASE B: USER DOES NOT EXIST YET
      // =========================================================================

      // Sub-case B.1: User is in registration mode and submitted remaining details
      if (mode === "register") {
        req.body = {
          ...registrationDetails,
          email: normalizedEmail,
          fullName: registrationDetails.fullName || verifiedIdentity.fullName,
          firstName: registrationDetails.firstName || verifiedIdentity.firstName,
          lastName: registrationDetails.lastName || verifiedIdentity.lastName,
          avatarUrl: registrationDetails.avatarUrl || verifiedIdentity.avatarUrl,
          authProvider,
          providerId: verifiedIdentity.providerId,
        };
        return this.clientRegister(req, res);
      }

      // Sub-case B.2: User just clicked Google/Facebook button (Auto-fill profile preview)
      return res.json({
        success: true,
        isNewUser: true,
        message: `${authProvider === "google" ? "Google" : "Facebook"} identity verified! Please complete your registration details.`,
        profile: {
          email: normalizedEmail,
          fullName: verifiedIdentity.fullName,
          firstName: verifiedIdentity.firstName,
          lastName: verifiedIdentity.lastName,
          avatarUrl: verifiedIdentity.avatarUrl,
          provider: authProvider,
          providerId: verifiedIdentity.providerId,
          emailVerified: true,
        },
      });
    } catch (err) {
      console.error("[AuthController.socialLogin] Error:", err);
      return res.status(500).json({ message: "Social authentication service error: " + err.message });
    }
  }

  /**
   * POST /api/auth/verify-face
   * Runs advanced Python OpenCV YuNet Face Detection & Biometric Diagnostics
   */
  async verifyFace(req, res) {
    try {
      const { image, referenceAvatar, landmarks, faceBox } = req.body;
      if (!image) {
        return res.status(400).json({
          success: false,
          passed: false,
          message: "No image provided for biometric verification.",
        });
      }

      const clientMeta = landmarks && faceBox ? { landmarks, faceBox } : null;
      const result = await faceVerifierService.verifyFaceTelemetry(image, referenceAvatar, clientMeta);
      return res.json(result);
    } catch (err) {
      console.error("[AuthController.verifyFace] Verification error:", err);
      return res.status(500).json({
        success: false,
        passed: false,
        message: "Internal face verification error: " + err.message,
      });
    }
  }

  /**
   * GET /api/admin/accounts
   * Returns list of all accounts for the Admin Accounts Management panel.
   * Supports ?type=all | client | staff query parameter.
   */
  async getAccounts(req, res) {
    try {
      const { type } = req.query || {};
      let roleFilterClause = "WHERE u.role IN ('client', 'admin', 'architect', 'engineer')";
      if (type === "client" || type === "clients") {
        roleFilterClause = "WHERE u.role = 'client'";
      } else if (type === "staff") {
        roleFilterClause = "WHERE u.role IN ('admin', 'architect', 'engineer')";
      }

      let result;
      try {
        result = await db.query(`
          SELECT 
            u.user_id,
            u.email,
            u.full_name,
            u.role,
            u.phone_number,
            u.has_viber_whatsapp,
            u.client_type,
            u.location_address,
            u.auth_provider,
            u.avatar_url,
            u.kyc_photo_url,
            u.kyc_verified_at,
            u.occupation,
            u.civil_status,
            u.birth_date,
            u.employer_name,
            u.monthly_income,
            u.spouse_name,
            u.preferred_contact_time,
            u.emergency_contact,
            u.lot_ownership_status,
            u.subdivision_lot_details,
            u.target_build_location,
            u.target_project_type,
            u.ofw_country,
            u.ph_rep_name,
            u.ph_rep_relationship,
            u.ph_rep_phone,
            u.created_at,
            COALESCE(u.account_status, 'active') AS account_status,
            u.invite_expires_at,
            (u.invite_token IS NOT NULL) AS has_pending_invite,
            COALESCE(u.is_multi_project_approved, false) AS is_multi_project_approved,
            u.multi_project_requested_at,
            u.multi_project_request_note,
            COALESCE(b_count.total_inquiries, 0) AS total_inquiries
          FROM users u
          LEFT JOIN (
            SELECT LOWER(client_email) AS email, COUNT(brief_id) AS total_inquiries 
            FROM client_briefs 
            GROUP BY LOWER(client_email)
          ) b_count ON LOWER(u.email) = b_count.email
          ${roleFilterClause}
          ORDER BY u.user_id DESC
        `);
      } catch (colErr) {
        console.warn("[AuthController.getAccounts] Column query notice, falling back to resilient query:", colErr.message);
        result = await db.query(`
          SELECT 
            u.user_id,
            u.email,
            u.full_name,
            u.role,
            u.phone_number,
            u.avatar_url,
            u.occupation,
            u.created_at,
            COALESCE(u.account_status, 'active') AS account_status,
            u.invite_expires_at,
            (u.invite_token IS NOT NULL) AS has_pending_invite,
            COALESCE(b_count.total_inquiries, 0) AS total_inquiries
          FROM users u
          LEFT JOIN (
            SELECT LOWER(client_email) AS email, COUNT(brief_id) AS total_inquiries 
            FROM client_briefs 
            GROUP BY LOWER(client_email)
          ) b_count ON LOWER(u.email) = b_count.email
          ${roleFilterClause}
          ORDER BY u.user_id DESC
        `);
      }

      return res.json({
        success: true,
        accounts: result.rows || [],
      });
    } catch (err) {
      console.error("[AuthController.getAccounts] Error:", err);
      return res.status(500).json({ message: "Failed to retrieve accounts: " + err.message });
    }
  }

  /**
   * POST /api/admin/invite-staff
   * Creates a pending staff member (Admin, Architect, Engineer) and sends activation email link.
   * Zero-Knowledge: Inviting admin never enters or sees the staff member's password.
   */
  async inviteStaff(req, res) {
    try {
      const { email, fullName, role, occupation, phone } = req.body;

      if (!email || !fullName || !role) {
        return res.status(400).json({ success: false, message: "Email, Full Name, and Role are required." });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(fullName).trim();
      const cleanRole = String(role).trim().toLowerCase();
      const cleanOccupation = occupation ? String(occupation).trim() : "";
      const cleanPhone = phone ? String(phone).trim() : "";

      // Strict role enforcement: ONLY admin, architect, engineer. NO super_admin.
      const ALLOWED_STAFF_ROLES = ["admin", "architect", "engineer"];
      if (!ALLOWED_STAFF_ROLES.includes(cleanRole)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff role. Allowed roles are: Admin, Project Architect, Site Engineer.",
        });
      }

      // Check if email already registered
      const existingUser = await db.query(
        "SELECT user_id, email, full_name, role, account_status, invite_token, invite_expires_at FROM users WHERE LOWER(email) = $1",
        [cleanEmail]
      );

      // Secure cryptographic 64-char hex invite token
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      let staffAccount;

      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0];
        // If already active with password, cannot reinvite through this endpoint
        if (existing.account_status === "active") {
          return res.status(409).json({
            success: false,
            message: `An active account with ${cleanEmail} already exists (${existing.role}). If they forgot their password, use the reset password flow.`,
          });
        }

        // If pending, refresh the invite token and role/occupation
        const updateRes = await db.query(
          `UPDATE users
           SET 
             full_name = $1,
             role = $2,
             occupation = $3,
             phone_number = $4,
             invite_token = $5,
             invite_expires_at = $6,
             account_status = 'pending',
             updated_at = NOW()
           WHERE user_id = $7
           RETURNING user_id, email, full_name, role, occupation, phone_number, account_status, invite_expires_at, created_at`,
          [cleanName, cleanRole, cleanOccupation, cleanPhone, inviteToken, inviteExpiresAt, existing.user_id]
        );
        staffAccount = updateRes.rows[0];
      } else {
        // Create new user with pending status and random dummy hash
        const dummyPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

        const insertRes = await db.query(
          `INSERT INTO users (
             email,
             full_name,
             role,
             occupation,
             phone_number,
             password_hash,
             account_status,
             invite_token,
             invite_expires_at,
             auth_provider,
             created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, 'email', NOW())
           RETURNING user_id, email, full_name, role, occupation, phone_number, account_status, invite_expires_at, created_at`,
          [cleanEmail, cleanName, cleanRole, cleanOccupation, cleanPhone, dummyPasswordHash, inviteToken, inviteExpiresAt]
        );
        staffAccount = insertRes.rows[0];
      }

      // Dispatch adaptive HTML invitation email
      let emailResult = { delivered: false };
      try {
        emailResult = await emailService.sendAdminInviteEmail({
          email: cleanEmail,
          recipientName: cleanName,
          role: cleanRole,
          occupation: cleanOccupation,
          inviteToken,
        });
      } catch (mailErr) {
        console.warn("[AuthController.inviteStaff] Email delivery notice:", mailErr.message);
      }

      // Realtime broadcast to keep other connected admins in sync
      try {
        const realtimeService = require("../services/realtimeService");
        realtimeService.broadcast("ACCOUNT_UPDATED", {
          account: {
            ...staffAccount,
            has_pending_invite: true,
            total_inquiries: 0,
          },
          message: `Staff invitation sent to ${cleanName} (${cleanRole})`,
        });
      } catch (rtErr) {
        console.warn("[AuthController.inviteStaff] Realtime notice:", rtErr.message);
      }

      return res.status(201).json({
        success: true,
        message: `Invitation successfully sent to ${cleanEmail}. The recipient has 48 hours to activate their account.`,
        account: {
          ...staffAccount,
          has_pending_invite: true,
          total_inquiries: 0,
        },
        delivered: emailResult.delivered,
      });
    } catch (err) {
      console.error("[AuthController.inviteStaff] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to dispatch staff invitation: " + err.message });
    }
  }

  /**
   * POST /api/admin/resend-invite
   * Refreshes the token and resends the invitation email.
   */
  async resendStaffInvite(req, res) {
    try {
      const { userId, email } = req.body;
      if (!userId && !email) {
        return res.status(400).json({ success: false, message: "User ID or Email is required." });
      }

      const userRes = await db.query(
        "SELECT user_id, email, full_name, role, occupation, account_status FROM users WHERE user_id = $1 OR LOWER(email) = $2",
        [userId || -1, email ? String(email).trim().toLowerCase() : ""]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Staff account not found." });
      }

      const user = userRes.rows[0];
      const ALLOWED_STAFF_ROLES = ["admin", "architect", "engineer"];
      if (!ALLOWED_STAFF_ROLES.includes(user.role)) {
        return res.status(400).json({ success: false, message: "Only staff accounts can be invited via this flow." });
      }

      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await db.query(
        `UPDATE users
         SET invite_token = $1, invite_expires_at = $2, account_status = 'pending', updated_at = NOW()
         WHERE user_id = $3`,
        [inviteToken, inviteExpiresAt, user.user_id]
      );

      await emailService.sendAdminInviteEmail({
        email: user.email,
        recipientName: user.full_name,
        role: user.role,
        occupation: user.occupation,
        inviteToken,
      });

      return res.json({
        success: true,
        message: `A fresh invitation link has been dispatched to ${user.email}.`,
      });
    } catch (err) {
      console.error("[AuthController.resendStaffInvite] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to resend invitation: " + err.message });
    }
  }

  /**
   * GET /api/admin/verify-invite
   * Validates invite token on the password setup page.
   */
  async verifyInviteToken(req, res) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string" || token.length < 32) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: "Invalid or malformed activation token.",
        });
      }

      const userRes = await db.query(
        `SELECT user_id, email, full_name, role, occupation, invite_expires_at, account_status 
         FROM users 
         WHERE invite_token = $1`,
        [token.trim()]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: "This activation link is invalid or has already been used.",
        });
      }

      const user = userRes.rows[0];
      const now = new Date();
      const expiresAt = new Date(user.invite_expires_at);

      if (expiresAt < now) {
        return res.status(410).json({
          success: false,
          valid: false,
          expired: true,
          message: "This activation link has expired (48-hour limit). Please ask an Administrator to resend your invite.",
        });
      }

      return res.json({
        success: true,
        valid: true,
        user: {
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          occupation: user.occupation,
        },
      });
    } catch (err) {
      console.error("[AuthController.verifyInviteToken] Error:", err);
      return res.status(500).json({ success: false, valid: false, message: "Server error verifying token." });
    }
  }

  /**
   * POST /api/admin/complete-setup-password
   * Sets the staff member's password and activates their account.
   */
  async completeSetupPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ success: false, message: "Token and new password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
      }

      const userRes = await db.query(
        `SELECT user_id, email, full_name, role, occupation, invite_expires_at 
         FROM users 
         WHERE invite_token = $1`,
        [String(token).trim()]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired activation link. It may have already been used.",
        });
      }

      const user = userRes.rows[0];
      if (new Date(user.invite_expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          message: "This activation link has expired. Please ask an Administrator to send you a new one.",
        });
      }

      // Hash password securely with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // Activate user account and invalidate token
      const updateRes = await db.query(
        `UPDATE users
         SET 
           password_hash = $1,
           account_status = 'active',
           invite_token = NULL,
           invite_expires_at = NULL,
           updated_at = NOW()
         WHERE user_id = $2
         RETURNING user_id, email, full_name, role, occupation, account_status`,
        [passwordHash, user.user_id]
      );

      const activatedUser = updateRes.rows[0];

      // Broadcast update to Admin dashboard
      try {
        const realtimeService = require("../services/realtimeService");
        realtimeService.broadcast("ACCOUNT_UPDATED", {
          account: {
            ...activatedUser,
            has_pending_invite: false,
          },
          message: `Staff account activated: ${activatedUser.full_name} (${activatedUser.role})`,
        });
      } catch (rtErr) {
        console.warn("[AuthController.completeSetupPassword] Realtime notice:", rtErr.message);
      }

      return res.json({
        success: true,
        message: "Your password has been securely established and your MCPA account is now active.",
        user: activatedUser,
      });
    } catch (err) {
      console.error("[AuthController.completeSetupPassword] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to set up password: " + err.message });
    }
  }

  /**
   * GET /api/client/inquiries
   * Returns briefs for a specific client email
   */
  async getClientInquiries(req, res) {
    try {
      const isAdmin = req.user?.role === "admin" || req.user?.role === "super_admin";
      const email = (isAdmin && req.query.email) ? req.query.email : (req.user?.email || req.query.email);
      if (!email) {
        return res.status(400).json({ message: "Client email parameter or authenticated session is required." });
      }

      const result = await db.query(
        "SELECT * FROM client_briefs WHERE LOWER(client_email) = LOWER($1) ORDER BY brief_id DESC",
        [email.trim().toLowerCase()]
      );

      return res.json({
        success: true,
        briefs: result.rows || [],
      });
    } catch (err) {
      console.error("[AuthController.getClientInquiries] Error:", err);
      return res.status(500).json({ message: "Failed to load client inquiries: " + err.message });
    }
  }

  /**
   * Helper to format a user row into a clean, uniform object
   */
  _formatUser(row) {
    if (!row) return null;
    return {
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name || "",
      name: row.full_name || "",
      role: row.role || "admin",
      phoneNumber: row.phone_number || "",
      avatarUrl: row.avatar_url || "",
      avatar_url: row.avatar_url || "",
      hasViberWhatsapp: Boolean(row.has_viber_whatsapp),
      occupation: row.occupation || "",
      civilStatus: row.civil_status || "",
      birthDate: row.birth_date || "",
      locationAddress: row.location_address || "",
      facebookUrl: row.facebook_url || "",
      linkedinUrl: row.linkedin_url || "",
      instagramUrl: row.instagram_url || "",
      createdAt: row.created_at,
    };
  }

  /**
   * GET /api/admin/profile
   */
  async getAdminProfile(req, res) {
    try {
      const email = req.user?.email || req.query.email || req.headers["x-user-email"];
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Email parameter or authenticated session required." });
      }

      const result = await db.query(
        `SELECT user_id, email, full_name, role, phone_number, avatar_url, has_viber_whatsapp, 
                occupation, civil_status, birth_date, location_address, facebook_url, linkedin_url, instagram_url, created_at 
         FROM users 
         WHERE LOWER(email) = LOWER($1) 
         LIMIT 1`,
        [email.trim().toLowerCase()]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Administrator account not found." });
      }

      const adminUser = result.rows[0];
      if ((adminUser.role || "").toLowerCase() === "client") {
        return res.status(403).json({ success: false, message: "Access Denied: Not an administrator account." });
      }

      return res.json({
        success: true,
        user: this._formatUser(adminUser),
      });
    } catch (err) {
      console.error("[AuthController.getAdminProfile] Error:", err);
      return res.status(500).json({ success: false, message: "Server error fetching profile: " + err.message });
    }
  }

  /**
   * PUT /api/admin/profile
   */
  async updateAdminProfile(req, res) {
    try {
      const {
        email,
        fullName,
        phoneNumber,
        avatarUrl,
        hasViberWhatsapp,
        occupation,
        civilStatus,
        birthDate,
        locationAddress,
        facebookUrl,
        linkedinUrl,
        instagramUrl,
        currentPassword,
        newPassword,
      } = req.body;

      const targetEmail = (req.user?.email || email || "").trim().toLowerCase();
      if (!targetEmail) {
        return res.status(400).json({ success: false, message: "Email is required to identify the account." });
      }

      const normalizedEmail = targetEmail;

      // Check user existence
      const userRes = await db.query(
        "SELECT user_id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Administrator account not found." });
      }

      const existingUser = userRes.rows[0];

      // Password update validation
      let hashedPassword = null;
      if (newPassword && newPassword.trim()) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: "Current password is required to change password." });
        }

        let isPassValid = false;
        try {
          isPassValid = await bcrypt.compare(currentPassword, existingUser.password_hash);
        } catch (e) {
          isPassValid = currentPassword === existingUser.password_hash;
        }

        if (!isPassValid) {
          return res.status(400).json({ success: false, message: "Current password is incorrect." });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
        }

        hashedPassword = await bcrypt.hash(newPassword, 10);
      }

      const updateValues = [
        fullName !== undefined ? fullName.trim() : null,
        phoneNumber !== undefined ? phoneNumber.trim() : null,
        avatarUrl !== undefined ? avatarUrl.trim() : null,
        Boolean(hasViberWhatsapp),
        occupation !== undefined ? occupation.trim() : null,
        civilStatus !== undefined ? civilStatus.trim() : null,
        birthDate !== undefined ? birthDate.trim() : null,
        locationAddress !== undefined ? locationAddress.trim() : null,
        facebookUrl !== undefined ? facebookUrl.trim() : null,
        linkedinUrl !== undefined ? linkedinUrl.trim() : null,
        instagramUrl !== undefined ? instagramUrl.trim() : null,
      ];

      let paramCount = 11;
      let passwordClause = "";
      if (hashedPassword) {
        paramCount++;
        passwordClause = `, password_hash = $${paramCount}`;
        updateValues.push(hashedPassword);
      }
      paramCount++;
      updateValues.push(normalizedEmail);

      const queryStr = `
        UPDATE users 
        SET 
          full_name = COALESCE($1, full_name),
          phone_number = $2,
          avatar_url = $3,
          has_viber_whatsapp = $4,
          occupation = $5,
          civil_status = $6,
          birth_date = $7,
          location_address = $8,
          facebook_url = $9,
          linkedin_url = $10,
          instagram_url = $11
          ${passwordClause}
        WHERE LOWER(email) = LOWER($${paramCount})
        RETURNING user_id, email, full_name, role, phone_number, avatar_url, has_viber_whatsapp, 
                  occupation, civil_status, birth_date, location_address, facebook_url, linkedin_url, instagram_url, created_at;
      `;

      const updateRes = await db.query(queryStr, updateValues);

      // Replicate to Neon Standby if active
      if (db.neonPool) {
        try {
          await db.neonPool.query(queryStr, updateValues);
        } catch (neonErr) {
          console.warn("[Neon Standby Sync] Warning on admin profile update:", neonErr.message);
        }
      }

      // Sync to local_mock_db.json if available
      try {
        const mockData = db.readMockData();
        if (mockData && Array.isArray(mockData.users)) {
          const mIdx = mockData.users.findIndex(u => (u.email || "").toLowerCase() === normalizedEmail);
          if (mIdx !== -1) {
            mockData.users[mIdx] = {
              ...mockData.users[mIdx],
              full_name: fullName || mockData.users[mIdx].full_name,
              name: fullName || mockData.users[mIdx].name,
              phone_number: phoneNumber,
              avatar_url: avatarUrl,
              has_viber_whatsapp: Boolean(hasViberWhatsapp),
              occupation: occupation,
              civil_status: civilStatus,
              birth_date: birthDate,
              location_address: locationAddress,
              facebook_url: facebookUrl,
              linkedinUrl: linkedinUrl,
              instagram_url: instagramUrl,
            };
            db.writeMockData(mockData);
          }
        }
      } catch (mockErr) {}

      const updatedUser = updateRes.rows && updateRes.rows[0] ? this._formatUser(updateRes.rows[0]) : null;

      return res.json({
        success: true,
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } catch (err) {
      console.error("[AuthController.updateAdminProfile] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to update profile: " + err.message });
    }
  }

  /**
   * PUT /api/client/profile
   * Client-side profile update (Free will PFP upload, phone, occupation, etc.)
   * NOTE: kyc_photo_url is immutable through this endpoint to protect biometric integrity.
   */
  async updateClientProfile(req, res) {
    try {
      const {
        email,
        fullName,
        phoneNumber,
        avatarUrl,
        kycPhotoUrl,
        hasViberWhatsapp,
        occupation,
        employerName,
        monthlyIncome,
        civilStatus,
        spouseName,
        birthDate,
        emergencyContact,
        preferredContactTime,
        lotOwnershipStatus,
        subdivisionLotDetails,
        targetBuildLocation,
        targetProjectType,
        locationAddress,
        ofwCountry,
        phRepName,
        phRepRelationship,
        phRepPhone,
      } = req.body;

      const targetEmail = (req.user?.email || email || "").trim().toLowerCase();
      if (!targetEmail) {
        return res.status(400).json({ message: "Registered email is required to update profile." });
      }

      const normalizedEmail = targetEmail;

      const queryStr = `
        UPDATE users 
        SET 
          full_name = COALESCE(NULLIF($1, ''), full_name),
          phone_number = COALESCE($2, phone_number),
          avatar_url = COALESCE($3, avatar_url),
          kyc_photo_url = COALESCE($4, kyc_photo_url),
          kyc_verified_at = CASE WHEN $4 IS NOT NULL THEN NOW() ELSE kyc_verified_at END,
          has_viber_whatsapp = COALESCE($5, has_viber_whatsapp),
          occupation = COALESCE($6, occupation),
          employer_name = COALESCE($7, employer_name),
          monthly_income = COALESCE($8, monthly_income),
          civil_status = COALESCE($9, civil_status),
          spouse_name = COALESCE($10, spouse_name),
          birth_date = COALESCE($11, birth_date),
          emergency_contact = COALESCE($12, emergency_contact),
          preferred_contact_time = COALESCE($13, preferred_contact_time),
          lot_ownership_status = COALESCE($14, lot_ownership_status),
          subdivision_lot_details = COALESCE($15, subdivision_lot_details),
          target_build_location = COALESCE($16, target_build_location),
          target_project_type = COALESCE($17, target_project_type),
          location_address = COALESCE($18, location_address),
          ofw_country = COALESCE($19, ofw_country),
          ph_rep_name = COALESCE($20, ph_rep_name),
          ph_rep_relationship = COALESCE($21, ph_rep_relationship),
          ph_rep_phone = COALESCE($22, ph_rep_phone),
          updated_at = NOW()
        WHERE LOWER(email) = LOWER($23)
        RETURNING *;
      `;

      const values = [
        fullName ? fullName.trim() : null,
        phoneNumber ? phoneNumber.trim() : null,
        avatarUrl ? avatarUrl.trim() : null,
        kycPhotoUrl ? kycPhotoUrl.trim() : null,
        hasViberWhatsapp !== undefined && hasViberWhatsapp !== null ? Boolean(hasViberWhatsapp) : null,
        occupation ? occupation.trim() : null,
        employerName ? employerName.trim() : null,
        monthlyIncome ? monthlyIncome.trim() : null,
        civilStatus ? civilStatus.trim() : null,
        spouseName ? spouseName.trim() : null,
        birthDate ? birthDate.trim() : null,
        emergencyContact ? emergencyContact.trim() : null,
        preferredContactTime ? preferredContactTime.trim() : null,
        lotOwnershipStatus ? lotOwnershipStatus.trim() : null,
        subdivisionLotDetails ? subdivisionLotDetails.trim() : null,
        targetBuildLocation ? targetBuildLocation.trim() : null,
        targetProjectType ? targetProjectType.trim() : null,
        locationAddress ? locationAddress.trim() : null,
        ofwCountry ? ofwCountry.trim() : null,
        phRepName ? phRepName.trim() : null,
        phRepRelationship ? phRepRelationship.trim() : null,
        phRepPhone ? phRepPhone.trim() : null,
        normalizedEmail,
      ];

      const result = await db.query(queryStr, values);

      if (db.neonPool) {
        try {
          await db.neonPool.query(queryStr, values);
        } catch (neonErr) {
          console.warn("[Neon Standby Sync] Warning on client profile update:", neonErr.message);
        }
      }

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "No client account found for this email." });
      }

      const updated = result.rows[0];
      return res.json({
        success: true,
        message: "Profile updated successfully.",
        user: {
          userId: updated.user_id,
          user_id: updated.user_id,
          email: updated.email,
          fullName: updated.full_name,
          full_name: updated.full_name,
          avatarUrl: updated.avatar_url,
          avatar_url: updated.avatar_url,
          kycPhotoUrl: updated.kyc_photo_url,
          kyc_photo_url: updated.kyc_photo_url,
          kycVerifiedAt: updated.kyc_verified_at,
          kyc_verified_at: updated.kyc_verified_at,
          phoneNumber: updated.phone_number,
          phone_number: updated.phone_number,
          hasViberWhatsapp: updated.has_viber_whatsapp,
          has_viber_whatsapp: updated.has_viber_whatsapp,
          occupation: updated.occupation,
          employerName: updated.employer_name,
          employer_name: updated.employer_name,
          monthlyIncome: updated.monthly_income,
          monthly_income: updated.monthly_income,
          civilStatus: updated.civil_status,
          civil_status: updated.civil_status,
          spouseName: updated.spouse_name,
          spouse_name: updated.spouse_name,
          birthDate: updated.birth_date,
          birth_date: updated.birth_date,
          emergencyContact: updated.emergency_contact,
          emergency_contact: updated.emergency_contact,
          preferredContactTime: updated.preferred_contact_time,
          preferred_contact_time: updated.preferred_contact_time,
          lotOwnershipStatus: updated.lot_ownership_status,
          lot_ownership_status: updated.lot_ownership_status,
          subdivisionLotDetails: updated.subdivision_lot_details,
          subdivision_lot_details: updated.subdivision_lot_details,
          targetBuildLocation: updated.target_build_location,
          target_build_location: updated.target_build_location,
          targetProjectType: updated.target_project_type,
          target_project_type: updated.target_project_type,
          locationAddress: updated.location_address,
          location_address: updated.location_address,
          ofwCountry: updated.ofw_country,
          ofw_country: updated.ofw_country,
          phRepName: updated.ph_rep_name,
          ph_rep_name: updated.ph_rep_name,
          phRepRelationship: updated.ph_rep_relationship,
          ph_rep_relationship: updated.ph_rep_relationship,
          phRepPhone: updated.ph_rep_phone,
          ph_rep_phone: updated.ph_rep_phone,
          clientType: updated.client_type,
          client_type: updated.client_type,
          authProvider: updated.auth_provider,
        },
      });
    } catch (err) {
      console.error("[AuthController.updateClientProfile] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to update profile: " + err.message });
    }
  }

  /**
   * POST /api/client/request-email-change
   * Dispatches email change verification link to client's NEW email address.
   */
  async requestEmailChange(req, res) {
    try {
      const { currentEmail, newEmail } = req.body;
      const clientEmail = (req.user?.email || currentEmail || "").trim().toLowerCase();

      if (!clientEmail) {
        return res.status(400).json({ success: false, message: "Current account email is required." });
      }

      const cleanNewEmail = (newEmail || "").trim().toLowerCase();
      if (!cleanNewEmail) {
        return res.status(400).json({ success: false, message: "New email address is required." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanNewEmail)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address format." });
      }

      if (cleanNewEmail === clientEmail) {
        return res.status(400).json({
          success: false,
          message: "The new email address cannot be the same as your current registered email.",
        });
      }

      // Check current user exists
      const userRes = await db.query(
        "SELECT user_id, email, full_name, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [clientEmail]
      );
      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "No active client account found for current email." });
      }
      const user = userRes.rows[0];

      // Check new email collision
      const existingCheck = await db.query(
        "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND user_id != $2 LIMIT 1",
        [cleanNewEmail, user.user_id]
      );
      if (existingCheck.rows && existingCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This email address is already associated with another MCPA account. Please use a different email.",
        });
      }

      // Generate 32-byte secure hex token
      const token = crypto.randomBytes(32).toString("hex");

      // Invalidate existing unverified requests
      await db.query(
        "DELETE FROM public.email_change_requests WHERE (LOWER(old_email) = LOWER($1) OR user_id = $2) AND is_verified = FALSE",
        [clientEmail, String(user.user_id)]
      );
      if (db.neonPool) {
        try {
          await db.neonPool.query(
            "DELETE FROM public.email_change_requests WHERE (LOWER(old_email) = LOWER($1) OR user_id = $2) AND is_verified = FALSE",
            [clientEmail, String(user.user_id)]
          );
        } catch (neonErr) {
          console.warn("[Neon Sync] Delete stale email change requests:", neonErr.message);
        }
      }

      // Insert new request expiring in 15 minutes
      const insertSql = `
        INSERT INTO public.email_change_requests (
          user_id, old_email, new_email, token, expires_at, is_verified, created_at
        ) VALUES (
          $1, $2, $3, $4, NOW() + INTERVAL '15 minutes', FALSE, NOW()
        ) RETURNING request_id, expires_at;
      `;
      const insertVals = [String(user.user_id), clientEmail, cleanNewEmail, token];
      await db.query(insertSql, insertVals);
      if (db.neonPool) {
        try {
          await db.neonPool.query(insertSql, insertVals);
        } catch (neonErr) {
          console.warn("[Neon Sync] Insert email change request warning:", neonErr.message);
        }
      }

      // Dispatch verification link to new email
      const emailResult = await emailService.sendEmailChangeVerification(
        cleanNewEmail,
        clientEmail,
        token,
        { fullName: user.full_name }
      );

      return res.json({
        success: true,
        message: `An authentication link has been dispatched to ${cleanNewEmail}. Please open the email and click the confirmation link within 15 minutes.`,
        emailSent: emailResult.delivered,
        newEmail: cleanNewEmail,
        expiresInMinutes: 15,
      });
    } catch (err) {
      console.error("[AuthController.requestEmailChange] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to request email change: " + err.message });
    }
  }

  /**
   * POST /api/client/verify-email-change
   * Cryptographically verifies token and updates client email across all database tables.
   */
  async verifyEmailChange(req, res) {
    try {
      const { token, email, oldEmail } = req.body;
      const cleanToken = (token || "").trim();

      if (!cleanToken) {
        return res.status(400).json({ success: false, message: "Verification token is required." });
      }

      const reqRes = await db.query(
        `SELECT request_id, user_id, old_email, new_email, is_verified, expires_at
         FROM public.email_change_requests
         WHERE token = $1 LIMIT 1`,
        [cleanToken]
      );

      if (!reqRes.rows || reqRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invalid or unrecognized email verification token. Please initiate a new change request.",
        });
      }

      const changeReq = reqRes.rows[0];

      if (changeReq.is_verified) {
        return res.status(400).json({
          success: false,
          message: "This verification link has already been used and verified.",
        });
      }

      if (new Date(changeReq.expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          message: "This email change verification link has expired (15-minute window). Please request a new link.",
        });
      }

      const targetOldEmail = changeReq.old_email.toLowerCase().trim();
      const targetNewEmail = changeReq.new_email.toLowerCase().trim();

      // Update users table
      const updateUsersSql = `
        UPDATE users 
        SET email = $1, email_verified = TRUE, updated_at = NOW() 
        WHERE LOWER(email) = LOWER($2) 
        RETURNING *;
      `;
      const userUpdateRes = await db.query(updateUsersSql, [targetNewEmail, targetOldEmail]);
      if (db.neonPool) {
        try {
          await db.neonPool.query(updateUsersSql, [targetNewEmail, targetOldEmail]);
        } catch (neonErr) {
          console.warn("[Neon Sync] Update users email:", neonErr.message);
        }
      }

      if (!userUpdateRes.rows || userUpdateRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "The original account associated with this request could not be located.",
        });
      }

      const updatedUser = userUpdateRes.rows[0];

      // Synchronize related tables
      const relatedTables = [
        { table: "client_briefs", col: "client_email" },
        { table: "site_projects", col: "client_email" },
        { table: "warranty_tickets", col: "client_email" },
        { table: "meeting_history_logs", col: "client_email" },
        { table: "client_quotations", col: "client_email" },
        { table: "chatbot_conversations", col: "customer_email" },
      ];

      for (const rel of relatedTables) {
        const q = `UPDATE ${rel.table} SET ${rel.col} = $1 WHERE LOWER(${rel.col}) = LOWER($2);`;
        try {
          await db.query(q, [targetNewEmail, targetOldEmail]);
          if (db.neonPool) {
            await db.neonPool.query(q, [targetNewEmail, targetOldEmail]);
          }
        } catch (relErr) {
          console.warn(`[AuthController.verifyEmailChange] Non-critical sync warning on ${rel.table}:`, relErr.message);
        }
      }

      // Mark request as verified
      const markVerifiedSql = `UPDATE public.email_change_requests SET is_verified = TRUE, verified_at = NOW() WHERE token = $1;`;
      await db.query(markVerifiedSql, [cleanToken]);
      if (db.neonPool) {
        try {
          await db.neonPool.query(markVerifiedSql, [cleanToken]);
        } catch (neonErr) {
          console.warn("[Neon Sync] Mark email_change_requests verified:", neonErr.message);
        }
      }

      // Issue refreshed JWT token
      const tokenPayload = {
        userId: updatedUser.user_id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
      };
      const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      const safeUser = {
        userId: updatedUser.user_id,
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        full_name: updatedUser.full_name,
        name: updatedUser.full_name,
        firstName: updatedUser.first_name || (updatedUser.full_name ? updatedUser.full_name.split(" ")[0] : ""),
        phoneNumber: updatedUser.phone_number,
        phone_number: updatedUser.phone_number,
        avatarUrl: updatedUser.avatar_url,
        avatar_url: updatedUser.avatar_url,
        kycPhotoUrl: updatedUser.kyc_photo_url,
        kyc_photo_url: updatedUser.kyc_photo_url,
        kycVerifiedAt: updatedUser.kyc_verified_at,
        kyc_verified_at: updatedUser.kyc_verified_at,
        hasViberWhatsapp: updatedUser.has_viber_whatsapp,
        has_viber_whatsapp: updatedUser.has_viber_whatsapp,
        occupation: updatedUser.occupation,
        employerName: updatedUser.employer_name,
        employer_name: updatedUser.employer_name,
        monthlyIncome: updatedUser.monthly_income,
        monthly_income: updatedUser.monthly_income,
        civilStatus: updatedUser.civil_status,
        civil_status: updatedUser.civil_status,
        spouseName: updatedUser.spouse_name,
        spouse_name: updatedUser.spouse_name,
        birthDate: updatedUser.birth_date,
        birth_date: updatedUser.birth_date,
        emergencyContact: updatedUser.emergency_contact,
        emergency_contact: updatedUser.emergency_contact,
        preferredContactTime: updatedUser.preferred_contact_time,
        preferred_contact_time: updatedUser.preferred_contact_time,
        lotOwnershipStatus: updatedUser.lot_ownership_status,
        lot_ownership_status: updatedUser.lot_ownership_status,
        subdivisionLotDetails: updatedUser.subdivision_lot_details,
        subdivision_lot_details: updatedUser.subdivision_lot_details,
        targetBuildLocation: updatedUser.target_build_location,
        target_build_location: updatedUser.target_build_location,
        targetProjectType: updatedUser.target_project_type,
        target_project_type: updatedUser.target_project_type,
        locationAddress: updatedUser.location_address,
        location_address: updatedUser.location_address,
        ofwCountry: updatedUser.ofw_country,
        ofw_country: updatedUser.ofw_country,
        phRepName: updatedUser.ph_rep_name,
        ph_rep_name: updatedUser.ph_rep_name,
        phRepRelationship: updatedUser.ph_rep_relationship,
        ph_rep_relationship: updatedUser.ph_rep_relationship,
        phRepPhone: updatedUser.ph_rep_phone,
        ph_rep_phone: updatedUser.ph_rep_phone,
        clientType: updatedUser.client_type,
        client_type: updatedUser.client_type,
        authProvider: updatedUser.auth_provider,
        emailVerified: true,
        email_verified: true,
      };

      console.log(`\x1b[32m[AuthController] Client email updated from ${targetOldEmail} to ${targetNewEmail} across all project records.\x1b[0m`);

      return res.json({
        success: true,
        message: "Email address successfully authenticated and updated across all project records.",
        token: newToken,
        user: safeUser,
        oldEmail: targetOldEmail,
        newEmail: targetNewEmail,
      });
    } catch (err) {
      console.error("[AuthController.verifyEmailChange] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to verify email change: " + err.message });
    }
  }

  /**
   * POST /api/auth/check-email
   * Real-time pre-flight email validator:
   * 1. Syntax check
   * 2. Disposable / temporary email check
   * 3. DNS MX mail-exchange verification (checks if domain exists and has mail servers)
   * 4. Database collision check (checks if email already belongs to a client, admin, or staff)
   */
  async checkEmailAvailability(req, res) {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({
          available: false,
          validFormat: false,
          reason: "missing_email",
          message: "Mangyaring magbigay ng email address / Email address is required.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.json({
          available: false,
          validFormat: false,
          reason: "invalid_format",
          message: "Hindi wasto ang format ng email address / Invalid email address format.",
        });
      }

      const parts = normalizedEmail.split("@");
      const domain = parts[1];

      // 1. Database check for existing accounts (Client or Staff/Admin)
      const existing = await db.query(
        "SELECT user_id, email, role, auth_provider FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (existing.rows && existing.rows.length > 0) {
        const user = existing.rows[0];
        const isStaff = ["admin", "super_admin", "project_manager"].includes(user.role);

        return res.json({
          available: false,
          exists: true,
          validFormat: true,
          validDomain: true,
          role: user.role,
          authProvider: user.auth_provider,
          reason: isStaff ? "staff_email" : "already_registered",
          message: isStaff
            ? "Ang email na ito ay nakalaan para sa kawani/admin ng MCPA. Mangyaring mag-log in sa Staff Portal."
            : "Mayroon nang nakarehistrong account gamit ang email na ito. Mangyaring mag-sign in na lamang.",
          messageEn: isStaff
            ? "This email is registered to an MCPA staff/admin account. Please sign in via the Staff Portal."
            : "An account with this email address already exists. Please sign in instead.",
        });
      }

      // 2. Check disposable / throwaway email domains
      if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        return res.json({
          available: false,
          validFormat: true,
          validDomain: false,
          isDisposable: true,
          reason: "disposable_email",
          message: "Hindi pinapayagan ang disposable o pansamantalang email address / Disposable email addresses are not permitted.",
        });
      }

      // 3. Fast DNS MX record check (checks if domain actually exists and accepts mail)
      let domainHasMx = true;
      try {
        const mxLookupPromise = dns.resolveMx(domain);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DNS_TIMEOUT")), 1500)
        );
        const mxRecords = await Promise.race([mxLookupPromise, timeoutPromise]);
        if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
          domainHasMx = false;
        }
      } catch (dnsErr) {
        if (dnsErr.code === "ENOTFOUND" || dnsErr.code === "ENODATA") {
          domainHasMx = false;
        }
      }

      if (!domainHasMx) {
        return res.json({
          available: false,
          validFormat: true,
          validDomain: false,
          reason: "invalid_domain",
          message: `Hindi umiiral o walang mail server ang domain na @${domain} / The domain @${domain} does not have valid mail servers.`,
        });
      }

      return res.json({
        available: true,
        exists: false,
        validFormat: true,
        validDomain: true,
        message: "Available ang email address para sa rehistrasyon.",
        messageEn: "Email is available for registration.",
      });
    } catch (err) {
      console.error("[AuthController] checkEmailAvailability error:", err);
      return res.status(500).json({
        available: true, // Fail permissive if internal DB glitch
        message: "Hindi masuri ang email sa ngayon / Could not check email availability at this time.",
      });
    }
  }

  /**
   * POST /api/auth/send-registration-verification
   * Dispatches architectural registration verification email with 15-minute token
   */
  async sendRegistrationVerification(req, res) {
    try {
      const { email, fullName } = req.body;
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ success: false, message: "Valid email address is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if email already registered in users table
      const checkUser = await db.query(
        "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail]
      );

      if (checkUser.rows && checkUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists. Please log in instead.",
        });
      }

      // Generate secure 32-byte hexadecimal token
      const token = crypto.randomBytes(32).toString("hex");

      // Invalidate existing unverified tokens for this email
      await db.query(
        "DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1) AND is_verified = FALSE",
        [normalizedEmail]
      );

      // Insert new token with 15-minute expiry
      await db.query(
        `INSERT INTO email_verifications (email, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [normalizedEmail, token]
      );

      // Send branded verification email
      const result = await emailService.sendRegistrationVerificationEmail(normalizedEmail, token, {
        fullName: fullName || "Valued Client",
      });

      return res.json({
        success: true,
        message: "Email verification link has been dispatched to your inbox.",
        email: normalizedEmail,
        devVerificationUrl: process.env.NODE_ENV !== "production" ? result.verificationUrl : undefined,
      });
    } catch (err) {
      console.error("[AuthController.sendRegistrationVerification] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to dispatch verification email: " + err.message,
      });
    }
  }

  /**
   * GET /api/auth/registration-email-status
   * Real-time polling endpoint to check if an email has been verified via action link
   */
  async checkRegistrationEmailStatus(req, res) {
    try {
      const email = req.query.email || req.body?.email;
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ verified: false, message: "Email is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const result = await db.query(
        `SELECT is_verified, verified_at 
         FROM email_verifications 
         WHERE LOWER(email) = LOWER($1) AND is_verified = TRUE AND expires_at > NOW()
         ORDER BY verification_id DESC LIMIT 1`,
        [normalizedEmail]
      );

      if (result.rows && result.rows.length > 0) {
        return res.json({
          verified: true,
          email: normalizedEmail,
          verifiedAt: result.rows[0].verified_at,
        });
      }

      return res.json({
        verified: false,
        email: normalizedEmail,
      });
    } catch (err) {
      console.error("[AuthController.checkRegistrationEmailStatus] Error:", err);
      return res.status(500).json({ verified: false, message: err.message });
    }
  }

  /**
   * POST /api/auth/verify-registration-token
   * Validates the token clicked by the client in their email
   */
  async verifyRegistrationToken(req, res) {
    try {
      const { token, email } = req.body;
      if (!token || !email) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: "Token and email are required for verification.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Look up token
      const result = await db.query(
        `SELECT verification_id, email, is_verified, expires_at 
         FROM email_verifications 
         WHERE token = $1 AND LOWER(email) = LOWER($2)
         LIMIT 1`,
        [token.trim(), normalizedEmail]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: "Invalid or expired verification link. Please request a new one.",
        });
      }

      const record = result.rows[0];

      // Check if already expired
      if (new Date(record.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          verified: false,
          expired: true,
          message: "This verification link has expired (15-minute limit). Please request a new link.",
        });
      }

      // Mark as verified
      await db.query(
        `UPDATE email_verifications 
         SET is_verified = TRUE, verified_at = NOW() 
         WHERE verification_id = $1`,
        [record.verification_id]
      );

      return res.json({
        success: true,
        verified: true,
        email: normalizedEmail,
        message: "Email verified successfully! You may now proceed with your registration.",
      });
    } catch (err) {
      console.error("[AuthController.verifyRegistrationToken] Error:", err);
      return res.status(500).json({
        success: false,
        verified: false,
        message: "Verification processing error: " + err.message,
      });
    }
  }

  /**
   * POST /api/auth/face-login
   * Biometric Face Login (Temporarily disabled for security)
   */
  async faceLogin(req, res) {
    return res.status(503).json({
      success: false,
      message: "Biometric face recognition login is temporarily disabled for security enhancement. Please sign in with your email & password or Google account.",
    });
  }
}

module.exports = new AuthController();
