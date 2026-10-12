/**
 * Shared Signaling Server URL resolver for MCPA Construction & Supply
 * 
 * Automatically routes WebRTC signaling to:
 * - Local Machine (http://localhost:5000) when on localhost
 * - LAN / Wi-Fi Device (http://<your-lan-ip>:5000) when accessing from a phone or other computer on the same Wi-Fi
 * - Cloud Production (Azure Web App) when running on Vercel or custom domain
 */
export const getSignalingServerUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;

  const host = window.location.hostname;
  // Local development: localhost, 127.0.0.1, or local LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x, .local)
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host.endsWith(".local")
  ) {
    return `http://${host}:5000`;
  }

  // Cloud Production deployment (Vercel connecting to Azure backend)
  return "https://mcpa-backend-gvcjbnh7dragbtc4.japaneast-01.azurewebsites.net";
};
