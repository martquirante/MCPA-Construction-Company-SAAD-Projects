import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased font-sans`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@1,2&f[]=satoshi@1,2&display=swap"
          rel="stylesheet"
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <SystemThemeSync />
        <ScrollToTop />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
