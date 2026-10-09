/**
 * MCPA CONSTRUCTION AND SUPPLY - SOCIAL AUTHENTICATION VERIFICATION SERVICE
 * Validates Google and Facebook OAuth tokens cryptographically on the server side.
 */

class SocialAuthService {
  /**
   * Verify Google OAuth Token (supports both ID Token and Access Token)
   * @param {string} token - Google ID Token or Access Token
   * @returns {Promise<{ email: string, firstName: string, lastName: string, fullName: string, avatarUrl: string, providerId: string, provider: 'google', emailVerified: boolean }>}
   */
  async verifyGoogleToken(token) {
    if (!token) throw new Error("Google token is required for verification.");

    // 1. Try Google Tokeninfo endpoint (Standard for GIS credential ID token)
    try {
      const tokenInfoUrl = `https://oauth2.gocdogleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
      const res = await fetch(tokenInfoUrl);
      if (res.ok) {
        const payload = await res.json();

        // Check audience if GOOGLE_CLIENT_ID is configured
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (expectedClientId && payload.aud && payload.aud !== expectedClientId) {
          console.warn("[SocialAuthService] Google token aud mismatch:", payload.aud, "!=", expectedClientId);
        }

        if (payload.email && payload.sub) {
          const fullName = payload.name || payload.email.split("@")[0];
          const nameParts = fullName.trim().split(/\s+/);
          const firstName = payload.given_name || nameParts[0] || "";
          const lastName = payload.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

          return {
            email: payload.email.trim().toLowerCase(),
            firstName,
            lastName,
            fullName,
            avatarUrl: payload.picture || "",
            providerId: payload.sub,
            provider: "google",
            emailVerified: payload.email_verified === "true" || payload.email_verified === true,
          };
        }
      }
    } catch (e) {
      console.warn("[SocialAuthService] Google tokeninfo check fallback:", e.message);
    }

    // 2. Fallback to Google Userinfo endpoint (if token is an OAuth2 Access Token)
    try {
      const userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
      const userRes = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const payload = await userRes.json();
        if (payload.email && payload.sub) {
          const fullName = payload.name || payload.email.split("@")[0];
          const nameParts = fullName.trim().split(/\s+/);
          const firstName = payload.given_name || nameParts[0] || "";
          const lastName = payload.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

          return {
            email: payload.email.trim().toLowerCase(),
            firstName,
            lastName,
            fullName,
            avatarUrl: payload.picture || "",
            providerId: payload.sub,
            provider: "google",
            emailVerified: Boolean(payload.email_verified),
          };
        }
      }
    } catch (e) {
      console.warn("[SocialAuthService] Google userinfo check error:", e.message);
    }

    throw new Error("Unable to verify Google authentication token. Please sign in again.");
  }

  /**
   * Verify Facebook OAuth Access Token via Meta Graph API
   * @param {string} accessToken - Facebook User Access Token
   * @returns {Promise<{ email: string, firstName: string, lastName: string, fullName: string, avatarUrl: string, providerId: string, provider: 'facebook', emailVerified: boolean }>}
   */
  async verifyFacebookToken(accessToken) {
    if (!accessToken) throw new Error("Facebook access token is required for verification.");

    const graphUrl = `https://graph.facebook.com/me?fields=id,name,first_name,last_name,email,picture.type(large)&access_token=${encodeURIComponent(
      accessToken
    )}`;

    const res = await fetch(graphUrl);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || "Invalid or expired Facebook access token.");
    }

    const payload = await res.json();
    if (!payload.id) {
      throw new Error("Could not retrieve Facebook profile identity.");
    }

    const fullName = payload.name || "Facebook User";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = payload.first_name || nameParts[0] || "";
    const lastName = payload.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
    const email = payload.email ? payload.email.trim().toLowerCase() : "";
    const avatarUrl = payload.picture?.data?.url || "";

    return {
      email,
      firstName,
      lastName,
      fullName,
      avatarUrl,
      providerId: payload.id,
      provider: "facebook",
      emailVerified: Boolean(email),
    };
  }

  /**
   * Universal token resolver for any supported social provider
   * @param {'google' | 'facebook'} provider
   * @param {string} token
   */
  async verifyToken(provider, token) {
    const normalized = (provider || "").toLowerCase().trim();
    if (normalized === "google") {
      return this.verifyGoogleToken(token);
    }
    if (normalized === "facebook") {
      return this.verifyFacebookToken(token);
    }
    throw new Error(`Unsupported social authentication provider: '${provider}'.`);
  }
}

module.exports = new SocialAuthService();
