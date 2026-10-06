/**
 * MCPA Construction & Supply - JWT Authentication & RBAC Middleware
 */
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/authConfig");

/**
 * Validates incoming Bearer JWT token from Authorization header
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid Bearer token.",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid authorization token. Please sign in again.",
    });
  }
}

/**
 * Optional authentication - sets req.user if valid token provided, but does not block if missing
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignore invalid token on optional paths
    }
  }
  return next();
}

/**
 * Role-Based Access Control (RBAC) guard
 * @param  {...string} allowedRoles e.g. 'admin', 'super_admin'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const currentRole = (req.user.role || "").toLowerCase();
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === currentRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Insufficient permissions for this administrative operation.",
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
};
