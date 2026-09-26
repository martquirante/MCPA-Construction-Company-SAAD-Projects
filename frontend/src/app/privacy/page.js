import LegalDocViewer from "@/modules/legal/LegalDocViewer";

export const metadata = {
  title: "Privacy Policy | MCPA Construction and Supply",
  description:
    "Official Privacy Policy of MCPA Construction and Supply under Republic Act No. 10173 (Data Privacy Act of 2012).",
};

export default function PrivacyPage() {
  return <LegalDocViewer initialDoc="privacy" />;
}
