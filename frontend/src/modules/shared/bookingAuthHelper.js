/**
 * MCPA Construction & Supply - Booking & Consultation Intent Helper
 * Manages client authentication state detection and inquiry/booking intent persistence.
 */

const INTENT_STORAGE_KEY = "mcpa_booking_intent";
const USER_STORAGE_KEY = "mcpa_client_user";
const TOKEN_STORAGE_KEY = "mcpa_client_token";

/**
 * Checks if a client user is currently authenticated in localStorage.
 * @returns {boolean}
 */
export function isClientAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return Boolean(user && JSON.parse(user));
  } catch {
    return false;
  }
}

/**
 * Retrieves the currently logged-in client user object if available.
 * @returns {object|null}
 */
export function getStoredClientUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Saves the user's booking/inquiry intent before directing to login or signup.
 * @param {string} targetUrl - The target path and search params (e.g. "/book?style=Modern+Zen")
 * @param {object} [metadata] - Optional additional parameters (e.g. style name, selected date)
 */
export function saveBookingIntent(targetUrl = "/book", metadata = {}) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      origin: "booking_inquiry",
      targetUrl,
      metadata,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("mcpa:booking-intent-updated", { detail: payload }));
  } catch (err) {
    console.warn("Could not save booking intent to sessionStorage:", err);
  }
}

/**
 * Retrieves the stored booking/inquiry intent.
 * @returns {{ targetUrl: string, metadata: object, origin: string }|null}
 */
export function getBookingIntent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Ignore intent if older than 2 hours to avoid stale redirection
    if (parsed.timestamp && Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000) {
      clearBookingIntent();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears the stored booking intent once fulfilled.
 */
export function clearBookingIntent() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(INTENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("mcpa:booking-intent-cleared"));
  } catch (err) {
    console.warn("Could not clear booking intent:", err);
  }
}
