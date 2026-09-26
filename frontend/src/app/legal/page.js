import LegalDocViewer from "@/modules/legal/LegalDocViewer";

export const metadata = {
  title: "Compliance & Legal Documentation | MCPA Construction and Supply",
  description:
    "Official legal documentation, Privacy Policy (RA 10173), Terms of Engagement, BNPL milestone agreements, and Safety Code (DOLE DO-13) for MCPA Construction and Supply.",
};

export default async function LegalIndexPage({ searchParams }) {
  const sp = await searchParams;
  const doc = sp?.doc || sp?.tab || "privacy";
  const validDoc = ["privacy", "terms", "safety"].includes(doc) ? doc : "privacy";
  return <LegalDocViewer initialDoc={validDoc} />;
}
