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

export async function authFetch(url, options = {}) {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export default authFetch;
