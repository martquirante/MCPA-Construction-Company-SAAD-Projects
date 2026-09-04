import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MCPA Construction and Supply | PCAB Licensed Design & Build Contractor",
  description:
    "MCPA Construction and Supply is a PCAB-licensed and DTI-registered design and build contractor based in Plaridel, Bulacan. Specializing in residential homes, commercial buildings, signed and sealed plans, and our Build Now, Pay Later program across Bulacan, Metro Manila, and Central Luzon.",
  keywords: [
    "MCPA Construction and Supply",
    "PCAB Licensed Contractor Bulacan",
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('mcpa-theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
