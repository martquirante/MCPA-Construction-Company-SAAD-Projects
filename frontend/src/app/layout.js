import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mcpa-construction.vercel.app"),
  title: {
    default: "MCPA Construction and Supply | Design and Build Contractor Bulacan",
    template: "%s | MCPA Construction and Supply",
  },
  description:
    "Looking to turn your ideas into reality? MCPA Construction and Supply is a premier design-and-build contractor based in Plaridel, Bulacan. Specializing in residential homes, commercial buildings, signed and sealed plans, and turnkey construction supply across Bulacan, Metro Manila, and Central Luzon.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    title: "MCPA Construction and Supply | Design and Build Contractor Bulacan",
    description:
      "Full-service design and build contractor based in Plaridel, Bulacan. Specializing in residential homes, commercial buildings, and turnkey construction supply.",
    url: "https://mcpa-construction.vercel.app",
    siteName: "MCPA Construction and Supply",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCPA Construction and Supply",
    description:
      "Full-service design and build contractor based in Plaridel, Bulacan.",
  },
  keywords: [
    "MCPA Construction and Supply",
    "Design and Build Contractor Bulacan",
    "Bulacan Construction Company",
    "Plaridel Bulacan Contractor",
    "Build Now Pay Later Program",
    "Signed and Sealed Architectural Plans",
    "House Construction Bulacan",
    "Commercial Building Contractor Bulacan",
  ],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg?v=5", type: "image/svg+xml" },
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/icon.png?v=5", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg?v=5",
    apple: [
      { url: "/apple-touch-icon.png?v=5", sizes: "180x180", type: "image/png" },
    ],
  },
};

import ScrollToTop from "@/modules/shared/ScrollToTop";
import SystemThemeSync from "@/modules/shared/SystemThemeSync";
import NetworkStatusBar from "@/modules/shared/NetworkStatusBar";
import { LanguageProvider } from "@/modules/shared/LanguageContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GeneralContractor",
              "name": "MCPA Construction and Supply",
              "image": "https://mcpa-construction.vercel.app/icon.png",
              "url": "https://mcpa-construction.vercel.app",
              "telephone": "+63-917-123-4567",
              "priceRange": "₱₱₱",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Plaridel",
                "addressLocality": "Plaridel",
                "addressRegion": "Bulacan",
                "postalCode": "3004",
                "addressCountry": "PH"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 14.8872,
                "longitude": 120.8572
              },
              "sameAs": [
                "https://www.facebook.com/MCPA.ConstructionandSupply/",
                "https://www.instagram.com/mcpa.constructionandsupply/",
                "https://www.tiktok.com/@mcpa.construction"
              ]
            })
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="lazyOnload" />
        <LanguageProvider>
          <NetworkStatusBar />
          <SystemThemeSync />
          <ScrollToTop />
          {children}
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
