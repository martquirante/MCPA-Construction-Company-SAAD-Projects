import { formatRoomCode } from "@/modules/portal/utils/roomCodeHelper";
import MeetClientController from "./MeetClientController";

export async function generateMetadata({ params }) {
  const { code } = await params;
  const normalizedCode = formatRoomCode(code);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mcpaconstruction.com";

  return {
    title: `MCPA Consultation Room · ${normalizedCode}`,
    description: `Join the encrypted video consultation with MCPA Construction & Supply. Architectural review, engineering discussion, and site planning.`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title: `MCPA Consultation Room · ${normalizedCode}`,
      description: `Join the live encrypted video consultation with MCPA architects, engineers, and project owners. Room: ${normalizedCode}`,
      url: `${siteUrl}/meet/${normalizedCode}`,
      siteName: "MCPA Construction and Supply",
      images: [
        {
          url: `${siteUrl}/icon.png`,
          width: 512,
          height: 512,
          alt: "MCPA Construction and Supply",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `MCPA Consultation Room · ${normalizedCode}`,
      description: `Encrypted live consultation with MCPA Construction & Supply engineering & design team.`,
    },
  };
}

export default async function MeetPage({ params }) {
  const { code } = await params;
  return <MeetClientController roomCode={code} />;
}
