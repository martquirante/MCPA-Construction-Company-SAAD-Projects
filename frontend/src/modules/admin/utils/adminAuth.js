/**
 * MCPA Construction & Supply - Admin Credential Verification Utility
 * Validates admin action authorization directly against the backend auth service.
 */

/**
 * Validates entered password against the backend auth endpoint (/api/auth/login)
 * using the current logged-in admin user email.
 *
 * @param {string} password - The entered admin password
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function verifyAdminPassword(password) {
  const trimmed = typeof password === "string" ? password.trim() : "";
  if (!trimmed) return false;

  try {
    let email = "admin@mcpa.com";
    if (typeof window !== "undefined") {
      const rawUser =
        localStorage.getItem("mcpa_admin_user") ||
        sessionStorage.getItem("mcpa_admin_user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed?.email) {
            email = parsed.email;
          }
        } catch (e) {}
      }
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: trimmed, portalType: "admin" }),
    });
    const data = await res.json();
    if (res.ok && data?.success && (data.user?.role || "").toLowerCase() !== "client") {
      return true;
    }
  } catch (err) {
    // Network or server error
  }

  return false;
}

export default verifyAdminPassword;
