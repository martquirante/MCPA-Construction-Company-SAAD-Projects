export const metadata = {
  title: "Client Portal & Account Registration | MCPA Construction and Supply",
  description:
    "Sign in or register for the MCPA Client Portal. Track your architectural design progress, milestone schedules, site execution logs, contracts, and digital handover documents.",
  alternates: {
    canonical: "/portal",
  },
  openGraph: {
    title: "Client Portal & Account Registration | MCPA Construction and Supply",
    description:
      "Access your personalized construction project dashboard, blueprints, engineering schedule, and digital handover files.",
    url: "/portal",
    type: "website",
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
};

export default function PortalLayout({ children }) {
  return <>{children}</>;
}

