/**
 * MCPA Construction & Supply - Central Authentication Configuration
 * Provides resilient, secure JWT key resolution with fallback warning.
 */
const crypto = require("crypto");

let resolvedJwtSecret = process.env.JWT_SECRET;

if (!resolvedJwtSecret) {
  console.warn(
    "\x1b[33m[SECURITY WARNING] process.env.JWT_SECRET is not set in environment variables! Using fallback secret. Please configure JWT_SECRET in Azure App Service Configuration.\x1b[0m"
  );
  // Default secure fallback if env var is missing in dev or Azure
  resolvedJwtSecret = "mcpa_enterprise_secret_jwt_key_2026_super_secure_vault";
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

module.exports = {
  JWT_SECRET: resolvedJwtSecret,
  JWT_EXPIRES_IN,
};
