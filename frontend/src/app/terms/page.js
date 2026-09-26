import LegalDocViewer from "@/modules/legal/LegalDocViewer";

export const metadata = {
  title: "Terms of Engagement & BNPL Financing | MCPA Construction and Supply",
  description:
    "Official Terms of Engagement, Build Now Pay Later milestone disbursements, and 15-Year Structural Warranty conditions for MCPA Construction and Supply.",
};

export default function TermsPage() {
  return <LegalDocViewer initialDoc="terms" />;
}
