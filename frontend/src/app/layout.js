import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mcpaconstruction.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "MCPA Construction and Supply",
  title: {
    default: "MCPA Construction and Supply | Design & Build Contractor in Plaridel, Bulacan",
    template: "%s | MCPA Construction and Supply",
  },
  description:
    "MCPA Construction and Supply is a trusted Design & Build Contractor in Plaridel, Bulacan serving Metro Manila & Central Luzon. Specializing in custom residential homes, Build Now Pay Later (for titled lots), commercial warehouses, signed & sealed architectural plans, and construction supply.",
  verification: {
    google: "8LgSqeoLB_-J63YMp_uUZ2sy-p7DBmjIuTi2XCPoZqU",
  },
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "MCPA Construction and Supply | Design & Build Contractor in Plaridel, Bulacan",
    description:
      "Full-service design and build contractor in Plaridel, Bulacan. Custom residential homes, Build Now Pay Later program, commercial buildings, signed & sealed plans, and turnkey construction supply.",
    url: SITE_URL,
    siteName: "MCPA Construction and Supply",
    images: [
      {
        url: "/assets/hero-residence-day-wide-v2.jpg",
        width: 1200,
        height: 630,
        alt: "MCPA Construction and Supply — Custom Design & Build Residence in Bulacan",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCPA Construction and Supply | Design & Build Contractor Bulacan",
    description:
      "Full-service design and build contractor in Plaridel, Bulacan serving Metro Manila & Central Luzon.",
    images: ["/assets/hero-residence-day-wide-v2.jpg"],
  },
  keywords: [
    "MCPA",
    "MCPA Construction",
    "MCPA Construction and Supply",
    "MCPA Construction Bulacan",
    "MCPA Plaridel",
    "Design and Build Contractor Bulacan",
    "Bulacan Construction Company",
    "Plaridel Bulacan Contractor",
    "General Contractor Bulacan",
    "House Construction Bulacan",
    "Build Now Pay Later Program",
    "Build Now Pay Later House Construction Bulacan",
    "Pag-IBIG Housing Loan Contractor Bulacan",
    "Signed and Sealed Architectural Plans",
    "Commercial Building Contractor Bulacan",
    "Warehouse Contractor Central Luzon",
    "Home Renovation Contractor Bulacan",
    "Construction Supply Plaridel Bulacan",
    "Design and Build Metro Manila",
    "Contractor Central Luzon",
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
import ChatWidgetRoot from "@/modules/chatbot/ChatWidgetRoot";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  "url": SITE_URL,
                  "name": "MCPA Construction and Supply",
                  "alternateName": [
                    "MCPA",
                    "MCPA Construction",
                    "MCPA Construction & Supply"
                  ],
                  "publisher": {
                    "@id": `${SITE_URL}/#organization`
                  },
                  "inLanguage": "en-PH"
                },
                {
                  "@type": "GeneralContractor",
                  "@id": `${SITE_URL}/#organization`,
                  "name": "MCPA Construction and Supply",
                  "alternateName": [
                    "MCPA",
                    "MCPA Construction",
                    "MCPA Construction & Supply"
                  ],
                  "url": SITE_URL,
                  "logo": `${SITE_URL}/icon.png`,
                  "image": `${SITE_URL}/assets/hero-residence-day-wide-v2.jpg`,
                  "description":
                    "Full-service design and build contractor based in Plaridel, Bulacan specializing in custom residential homes, Build Now Pay Later programs, commercial warehouses, signed and sealed architectural plans, and construction supply across Bulacan, Metro Manila, and Central Luzon.",
                  "telephone": "+63-949-775-8239",
                  "email": "mcpa.construction@gmail.com",
                  "priceRange": "₱₱₱",
                  "hasMap": "https://maps.app.goo.gl/hPB6X66NdhViSvCp7",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "2826 Le Cagayan Valley Rd, Tabang",
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
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                      ],
                      "opens": "08:00",
                      "closes": "17:00"
                    }
                  ],
                  "areaServed": [
                    { "@type": "City", "name": "Plaridel" },
                    { "@type": "City", "name": "Malolos" },
                    { "@type": "AdministrativeArea", "name": "Bulacan" },
                    { "@type": "AdministrativeArea", "name": "Metro Manila" },
                    { "@type": "AdministrativeArea", "name": "Central Luzon" }
                  ],
                  "sameAs": [
                    "https://www.facebook.com/MCPA.ConstructionandSupply/",
                    "https://www.instagram.com/mcpa.constructionandsupply/",
                    "https://www.tiktok.com/@mcpa.construction"
                  ]
                }
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
          <ChatWidgetRoot />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
