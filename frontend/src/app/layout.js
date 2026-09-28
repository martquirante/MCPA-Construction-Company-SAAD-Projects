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
      { url: "/icon.svg?v=3", type: "image/svg+xml" },
      { url: "/icon.png?v=3", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=3", sizes: "any" },
    ],
    shortcut: "/icon.svg?v=3",
    apple: "/icon.png?v=3",
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
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('mcpa-theme');var d=p==='dark'||(!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
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
