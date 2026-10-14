/**
 * MCPA Construction & Supply - Authenticated Fetch Utility
 * Automatically injects the active Bearer JWT token from admin or client storage.
 */
export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const isPortal = typeof window.location !== "undefined" && window.location.pathname.startsWith("/portal");
  if (isPortal) {
    return (
      localStorage.getItem("mcpa_client_token") ||
      localStorage.getItem("mcpa_admin_token") ||
      sessionStorage.getItem("mcpa_admin_token") ||
      null
    );
  }
  return (
    localStorage.getItem("mcpa_admin_token") ||
    sessionStorage.getItem("mcpa_admin_token") ||
    localStorage.getItem("mcpa_client_token") ||
    null
  );
}

export function getStoredClientEmail() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mcpa_client_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.email || null;
  } catch (e) {
    return null;
  }
}

export async function authFetch(url, options = {}) {
  const token = getStoredAuthToken();
  const clientEmail = getStoredClientEmail();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (clientEmail && !headers.has("x-client-email")) {
    headers.set("x-client-email", clientEmail);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export default authFetch;
