/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
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
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";
    return [
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
