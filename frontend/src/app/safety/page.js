import LegalDocViewer from "@/modules/legal/LegalDocViewer";

export const metadata = {
  title: "Safety Code & Site Standards | MCPA Construction and Supply",
  description:
    "Occupational Safety and Health Standards, mandatory PPE rules, scaffolding guidelines, and DOLE DO-13 compliance for MCPA Construction and Supply.",
};

export default function SafetyPage() {
  return <LegalDocViewer initialDoc="safety" />;
}
