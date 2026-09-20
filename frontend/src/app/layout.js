import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  title: "MCPA Construction and Supply",
  description:
    "Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. Specializing in residential homes, commercial buildings, signed and sealed plans, and turnkey construction supply across Bulacan, Metro Manila, and Central Luzon.",
  openGraph: {
    title: "MCPA Construction and Supply",
    description:
      "Full-service design and build contractor based in Plaridel, Bulacan. Specializing in residential homes, commercial buildings, and turnkey construction supply.",
    siteName: "MCPA Construction and Supply",
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
    "Build Now Pay Later Program",
    "Design and Build Bulacan",
    "Plaridel Bulacan Contractor",
    "Signed and Sealed Architectural Plans",
    "House Construction Bulacan",
  ],
  icons: {
    icon: [
      { url: "/icon.png?v=2", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
};

import ScrollToTop from "@/modules/shared/ScrollToTop";
import SystemThemeSync from "@/modules/shared/SystemThemeSync";
import { LanguageProvider } from "@/modules/shared/LanguageContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <LanguageProvider>
          <SystemThemeSync />
          <ScrollToTop />
          {children}
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
