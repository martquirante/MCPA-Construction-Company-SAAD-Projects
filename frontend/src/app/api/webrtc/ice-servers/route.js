import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cloudflareTurnCache = {
  expiresAt: 0,
  servers: [],
};

export async function GET() {
  const cfTurnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID || "";
  const cfTurnApiToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN || "";
  const now = Date.now();

  // 1. Primary: Cloudflare Calls Realtime Edge TURN (1,000 GB/month)
  if (cfTurnKeyId && cfTurnApiToken) {
    if (cloudflareTurnCache.expiresAt > now && cloudflareTurnCache.servers.length > 0) {
      return NextResponse.json({
        success: true,
        iceServers: cloudflareTurnCache.servers,
        source: "cloudflare-calls-cached",
      });
    }

    try {
      const cfRes = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${cfTurnKeyId}/credentials/generate-ice-servers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfTurnApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 86400 }),
        }
      );

      if (cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData && Array.isArray(cfData.iceServers) && cfData.iceServers.length > 0) {
          const combinedCfServers = [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            ...cfData.iceServers,
          ];
          cloudflareTurnCache = {
            expiresAt: now + 12 * 60 * 60 * 1000, // 12 hours
            servers: combinedCfServers,
          };
          return NextResponse.json({
            success: true,
            iceServers: combinedCfServers,
            source: "cloudflare-calls",
          });
        }
      }
    } catch (cfErr) {
      console.warn("[WEBRTC API] Cloudflare Calls error, falling back:", cfErr?.message || cfErr);
    }
  }

  // 2. Fallback: Google & Twilio STUN
  const fallbackServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  return NextResponse.json({
    success: true,
    iceServers: fallbackServers,
    source: "fallback-stun",
  });
}
