export const DEFAULT_ADMIN_PIN = "mcpa2026";

/**
 * Validates entered password or PIN against:
 * 1. Default admin PIN ("mcpa2026")
 * 2. Locally stored admin PIN override (localStorage / sessionStorage "mcpa_admin_pin")
 * 3. Backend auth endpoint (/api/auth/login) using the current logged-in user email
 *
 * @param {string} password - The entered password or PIN
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function verifyAdminPassword(password) {
  const trimmed = typeof password === "string" ? password.trim() : "";
  if (!trimmed) return false;

  // 1. Immediate match with DEFAULT_ADMIN_PIN
  if (trimmed === DEFAULT_ADMIN_PIN) {
    return true;
  }

  // 2. Check local PIN overrides
  if (typeof window !== "undefined") {
    try {
      const localPin =
        localStorage.getItem("mcpa_admin_pin") ||
        sessionStorage.getItem("mcpa_admin_pin");
      if (localPin && trimmed === localPin.trim()) {
        return true;
      }
    } catch (e) {
      // storage access denied or disabled
    }
  }

  // 3. Check against backend API using the active admin user's email
  try {
    let email = "admin@mcpa.com";
    if (typeof window !== "undefined") {
      const rawUser =
        localStorage.getItem("mcpa_admin_user") ||
        sessionStorage.getItem("mcpa_admin_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.email) {
          email = parsed.email;
        }
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
    // Backend offline or unreachable
  }

  return false;
}
