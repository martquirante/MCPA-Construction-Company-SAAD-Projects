/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    "192.168.1.6",
    "192.168.1.6:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "jaw-crust-95466427.figma.site",
      },
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.neon.tech",
      },
      {
        protocol: "https",
        hostname: "mcpa-backend.vercel.app",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://mcpa-backend-gvcjbnh7dragbtc4.japaneast-01.azurewebsites.net"
        : "http://localhost:5000");
    return [
      {
        source: "/api/icons/:path*",
        destination: "/assets/icons/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
