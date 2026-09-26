import LegalDocViewer from "@/modules/legal/LegalDocViewer";

export function generateStaticParams() {
  return [
    { doc: "privacy" },
    { doc: "terms" },
    { doc: "safety" },
  ];
}

export async function generateMetadata({ params }) {
  const { doc } = await params;
  const titles = {
    privacy: "Privacy Policy | MCPA Construction and Supply",
    terms: "Terms of Engagement & BNPL Guidelines | MCPA Construction and Supply",
    safety: "Safety Code & DOLE OSH Standards | MCPA Construction and Supply",
  };

  const descriptions = {
    privacy: "Review MCPA Construction and Supply's official Privacy Policy under Republic Act No. 10173 (Data Privacy Act of 2012) regarding property titles, blueprints, and client data.",
    terms: "Official Terms of Engagement, Build Now Pay Later (BNPL) milestone disbursements, and 15-Year Structural Warranty conditions for MCPA Construction and Supply.",
    safety: "Occupational Safety and Health Standards, mandatory PPE rules, scaffolding guidelines, and DOLE DO-13 compliance for MCPA Construction and Supply.",
  };

  return {
    title: titles[doc] || "Compliance & Legal Documentation | MCPA Construction and Supply",
    description: descriptions[doc] || "Certified legal documents, policies, and safety standards of MCPA Construction and Supply in Bulacan and Central Luzon.",
  };
}

export default async function LegalDocPage({ params }) {
  const { doc } = await params;
  const validDoc = ["privacy", "terms", "safety"].includes(doc) ? doc : "privacy";
  return <LegalDocViewer initialDoc={validDoc} />;
}
