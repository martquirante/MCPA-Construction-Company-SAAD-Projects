export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mcpa-construction.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/portal", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
