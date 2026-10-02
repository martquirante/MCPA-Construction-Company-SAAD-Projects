"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/modules/shared/LanguageContext";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import { setReturnToCompletedHome } from "@/modules/home/homeState";
import {
  ShieldCheck,
  FileSignature,
  HardHat,
  Search,
  Share2,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Award,
  ScrollText,
  FileCheck2,
  Home,
  ArrowRight,
  Download,
  Loader2,
  X,
} from "lucide-react";

/**
 * Recursively extracts plain text from a React JSX node / component tree.
 */
function extractText(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(" ");
  }
  if (React.isValidElement(node)) {
    return extractText(node.props?.children);
  }
  return "";
}

/**
 * Recursively walks a React node tree and wraps matching query tokens in a vibrant yellow <mark> tag.
 */
function highlightMatches(node, query) {
  if (!query || !query.trim() || node == null) return node;

  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return node;

  const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escapedTokens.join("|")})`, "gi");

  if (typeof node === "string") {
    if (!regex.test(node)) return node;
    const parts = node.split(regex);
    return parts.map((part, index) => {
      const isMatch = tokens.some((t) => t.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={index}
            className="bg-amber-400/30 text-amber-950 dark:text-amber-300 font-semibold px-1 py-0.5 rounded-[2px]"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }

  if (typeof node === "number" || typeof node === "boolean") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => {
      if (React.isValidElement(child)) {
        if (child.props && child.props.children !== undefined) {
          return React.cloneElement(child, {
            key: child.key != null ? child.key : index,
            children: highlightMatches(child.props.children, query),
          });
        }
        return React.cloneElement(child, {
          key: child.key != null ? child.key : index,
        });
      }
      const highlighted = highlightMatches(child, query);
      return <React.Fragment key={index}>{highlighted}</React.Fragment>;
    });
  }

  if (React.isValidElement(node)) {
    if (node.props && node.props.children !== undefined) {
      return React.cloneElement(node, {
        children: highlightMatches(node.props.children, query),
      });
    }
    return node;
  }

  return node;
}

export default function LegalDocViewer({ initialDoc = "privacy" }) {
  const router = useRouter();
  const { language } = useLanguage();
  const isFil = language === "fil";

  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [downloadingDoc, setDownloadingDoc] = useState(false);

  useEffect(() => {
    if (initialDoc && ["privacy", "terms", "safety"].includes(initialDoc)) {
      setActiveDoc(initialDoc);
    }
  }, [initialDoc]);

  // Keep URL updated without full page refresh
  const switchDocument = (docKey) => {
    setActiveDoc(docKey);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined") {
      router.push(`/legal/${docKey}`, { scroll: false });
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    if (downloadingDoc) return;
    setDownloadingDoc(true);
    try {
      const url = `/api/legal/pdf/${activeDoc}?lang=${isFil ? "fil" : "en"}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download request failed with status " + res.status);
      const blob = await res.blob();

      const disposition = res.headers.get("Content-Disposition");
      let filename = `MCPA_${activeDoc}_${new Date().getFullYear()}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.error("[LegalDocViewer] PDF download fallback:", err);
      window.open(`/api/legal/pdf/${activeDoc}?lang=${isFil ? "fil" : "en"}`, "_blank");
    } finally {
      setDownloadingDoc(false);
    }
  };


  const currentYear = new Date().getFullYear();

  const documents = [
    {
      id: "privacy",
      title: isFil ? "Patakaran sa Privacy" : "Privacy Policy",
      shortTitle: isFil ? "Privacy" : "Privacy",
      subtitle: isFil
        ? "Proteksyon ng Personal na Datos, Titulo ng Lupa, at Kumpidensyal na Blueprints alinsunod sa RA 10173"
        : "Client Data Protection, Land Title Privacy & Blueprint Confidentiality under RA 10173",
      icon: ShieldCheck,
      regulatoryBadge: isFil ? "Batas Republika Blg. 10173 (DPA 2012)" : "Republic Act No. 10173 (DPA 2012)",
      lastUpdated: isFil ? `Setyembre ${currentYear}` : `September ${currentYear}`,
    },
    {
      id: "terms",
      title: isFil ? "Kasunduan sa Serbisyo" : "Terms of Engagement",
      shortTitle: isFil ? "Kasunduan" : "Terms",
      subtitle: isFil
        ? "Mga Tuntunin sa Kontrata, BNPL Milestone Billing, at Labinlimang Taong (15-Year) Structural Warranty"
        : "Contract Conditions, BNPL Milestone Billing Schedule & 15-Year Structural Warranty",
      icon: FileSignature,
      regulatoryBadge: isFil ? "CIAP Doc 102 · Civil Code Art. 1713–1731" : "CIAP Doc 102 · Civil Code Art. 1713–1731",
      lastUpdated: isFil ? `Setyembre ${currentYear}` : `September ${currentYear}`,
    },
    {
      id: "safety",
      title: isFil ? "Kodigo sa Kaligtasan" : "Safety Code & Site Standards",
      shortTitle: isFil ? "Kaligtasan" : "Safety Code",
      subtitle: isFil
        ? "Pamantayan sa Kaligtasan sa Trabaho, DOLE OSHS Compliance, at mga Patakaran sa Konstruksyon"
        : "Occupational Safety, DOLE OSHS Compliance, Mandatory PPE & Jobsite Protocols",
      icon: HardHat,
      regulatoryBadge: isFil ? "DOLE D.O. 13-98 · Batas Republika 11058" : "DOLE D.O. 13-98 · Republic Act 11058",
      lastUpdated: isFil ? `Setyembre ${currentYear}` : `September ${currentYear}`,
    },
  ];

  const currentDocMeta = documents.find((d) => d.id === activeDoc) || documents[0];

  // ---------------------------------------------------------------------------
  // 1. PRIVACY POLICY SECTIONS (BILINGUAL)
  // ---------------------------------------------------------------------------
  const privacySections = [
    {
      id: "privacy-intro",
      number: "1.0",
      title: isFil ? "Pambungad at Saklaw ng Patakaran" : "Introduction & Scope",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Sa <strong>MCPA Construction and Supply</strong>, lubos kaming nakatuon sa paggalang at pangangalaga sa personal at sensitibong impormasyon ng aming mga kliyente, may-ari ng lupa, nagpaplanong magpagawa ng bahay, at mga bumibisita sa aming mga proyekto. Saklaw ng Patakaran sa Privacy na ito ang lahat ng datos na kinokolekta sa pamamagitan ng aming punong tanggapan sa Plaridel, Bulacan, mga pansamantalang tanggapan sa bawat jobsite, aming opisyal na website, portal ng konsultasyon, at mga digital na channel ng komunikasyon.
          </p>
          <p>
            Ang aming mga pamamaraan sa paghawak ng datos ay mahigpit na sumusunod sa <strong>Batas Republika Blg. 10173</strong>, na kilala bilang <em>Data Privacy Act of 2012 (DPA)</em>, ang mga Alituntunin at Regulasyong Pampatupad nito (IRR), at lahat ng opisyal na sirkular na inilabas ng <strong>National Privacy Commission (NPC)</strong> ng Pilipinas.
          </p>
          <div className="p-3.5 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-neutral-800 dark:text-neutral-200 text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
              Mahalagang Pangako:
            </span>
            Kailanman ay hindi nagbebenta, nagpapaupa, o nagbabahagi ang MCPA Construction and Supply ng personal na impormasyon ng kliyente, mga detalye ng titulo ng lupa, o mga planong arkitektural sa sinumang hindi awtorisadong kumpanya para sa komersyal na layunin o marketing.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            At <strong>MCPA Construction and Supply</strong>, we are committed to respecting and protecting the personal and sensitive information of our clients, property owners, prospective homeowners, and site visitors. This Privacy Policy governs all personal data collected through our headquarters in Plaridel, Bulacan, our jobsite field offices, our official website, client consultation portals, and digital communication channels.
          </p>
          <p>
            Our data protection practices strictly adhere to the provisions of <strong>Republic Act No. 10173</strong>, otherwise known as the <em>Data Privacy Act of 2012 (DPA)</em>, its Implementing Rules and Regulations (IRR), and all relevant circulars issued by the <strong>National Privacy Commission (NPC)</strong> of the Philippines.
          </p>
          <div className="p-3.5 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-neutral-800 dark:text-neutral-200 text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
              Key Commitment:
            </span>
            MCPA Construction and Supply never sells, rents, monetizes, or shares client data, property lot details, or architectural plans with unauthorized third-party commercial marketing entities.
          </div>
        </div>
      ),
    },
    {
      id: "privacy-collection",
      number: "2.0",
      title: isFil ? "Mga Impormasyong Aming Kinokolekta" : "Personal & Property Information We Collect",
      content: isFil ? (
        <div className="space-y-4">
          <p>
            Upang maayos na maisagawa ang disenyong arkitektural, kalkulasyong pang-inhenyeriya, aplikasyon para sa Municipal Building Permit, at financing sa ilalim ng aming programang <strong>Build Now, Pay Later (BNPL)</strong>, kinokolekta namin ang mga sumusunod na kategorya ng datos:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Kategorya ng Datos</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Mga Partikular na Impormasyon</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Layunin sa Paggamit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Pagkakakilanlan at Kontak</td>
                  <td className="p-3">Buong pangalan, katayuang sibil, tirahan, numero ng telepono/mobile, Viber account, email, at opisyal na ID ng gobyerno (Pasaporte, UMID, Driver&apos;s License, PhilID).</td>
                  <td className="p-3">Paghahanda ng kontrata, beripikasyon ng kliyente, opisyal na komunikasyon sa bawat yugto, at pagpapanotaryo.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Titulo at Rekord ng Lupa</td>
                  <td className="p-3">Certified True Copy ng Transfer Certificate of Title (TCT) o Original Certificate of Title (OCT), Tax Declaration, Geodetic Lot Plan, at Soil Test Report.</td>
                  <td className="p-3">Kailangan para sa pag-apruba ng BNPL sa tituladong lote, pagsusuri ng structural foundation, at pagkuha ng Building Permit sa Munisipyo (OBO).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Espesipikasyon sa Disenyo</td>
                  <td className="p-3">Floor plan, kagustuhan sa laki ng mga kuwarto, mga materyales na nais gamitin, lokasyon ng mga saksakan at ilaw, at mga rebisyon sa 3D render.</td>
                  <td className="p-3">Paggawa ng signed and sealed blueprints at structural calculations na alinsunod sa National Building Code ng Pilipinas.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Pinansyal at Milestone</td>
                  <td className="p-3">Kumpirmasyon ng bank transfer, resibo ng bayad sa progress billing, Pag-IBIG (HDMF) member ID, at mga dokumento ng housing loan.</td>
                  <td className="p-3">Pagtatala ng bayad sa bawat natapos na yugto ng konstruksyon at pagsusuri sa pananalapi.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            To properly execute architectural design, civil engineering calculations, municipal building permit applications, and construction financing under our <strong>Build Now, Pay Later (BNPL)</strong> program, we collect the following classifications of information:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Data Category</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Specific Items Collected</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Operational Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Client Identity & Contact</td>
                  <td className="p-3">Full legal name, civil status, spouse name, residential address, contact number, Viber account, official email, valid government photo ID.</td>
                  <td className="p-3">Contract preparation, client verification, official milestone communication, and notary registration.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Property & Lot Title Records</td>
                  <td className="p-3">Certified True Copy of TCT or OCT, Real Property Tax Declaration, Geodetic Lot Plan, Site Topography, Soil Test Reports.</td>
                  <td className="p-3">Required for titled lot verification under BNPL, structural foundation engineering, and Municipal Building Permit processing (OBO).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Architectural & Build Specs</td>
                  <td className="p-3">Space requirements, lifestyle preferences, room dimensions, electrical fixture locations, aesthetic finish choices, 3D render revisions.</td>
                  <td className="p-3">Drafting signed and sealed architectural blueprints and structural calculations ready for building code compliance.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Financial & Milestone Records</td>
                  <td className="p-3">Progress billing deposit slips, bank payment confirmation, official receipts, Pag-IBIG (HDMF) member ID, commercial bank loan documents.</td>
                  <td className="p-3">Step-by-step progress accounting, stage sign-off verification, and financial auditing.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "privacy-purpose",
      number: "3.0",
      title: isFil ? "Layunin at Legal na Basehan ng Pagproseso" : "Purpose & Legal Grounds for Processing",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Pinoproseso ng MCPA ang personal at pampari-ariang datos para lamang sa mga lehitimong pangangailangan ng kontrata, batas, at inhenyeriya:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Pagsasagawa ng Kasunduan sa Konstruksyon:</strong> Paghahanda, paglagda, at pagpapanotaryo ng mga kontrata sa disenyo at pagtatayo, kasunduan sa suplay ng materyales, at kasunduan sa BNPL sa ilalim ng Batas Republika Blg. 386 (Civil Code ng Pilipinas).
            </li>
            <li>
              <strong>Building Permits at Pag-apruba sa Munisipyo:</strong> Pagsusumite ng opisyal na architectural, civil, structural, electrical, sanitary, at mechanical plans sa Tanggapan ng Building Official (OBO) sa mga munisipyo at lungsod sa Bulacan, Metro Manila, at Gitnang Luzon.
            </li>
            <li>
              <strong>Pagproseso ng Pag-IBIG Fund (HDMF) at Bank Loan:</strong> Pagtulong sa aplikasyon ng construction loan, pag-iinspeksyon sa bawat yugto (milestone inspection certification), at pag-asikaso sa pagpapalabas ng pondo.
            </li>
            <li>
              <strong>Pangangasiwa sa 15-Taong Structural Warranty (Art. 1723):</strong> Pagpapanatili ng rekord ng kalidad ng semento (cylinder test), sertipiko ng bakal, at serbisyo sa ilalim ng 15-taong legal na pananagutan at garantiya sa tibay ng estruktura alinsunod sa batas.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            MCPA processes personal and property data strictly in connection with legitimate contractual, regulatory, and engineering requirements, including:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Execution of Construction Agreements:</strong> Preparing, signing, and notarizing residential design-and-build contracts, supply agreements, and BNPL installment agreements under Republic Act 386.
            </li>
            <li>
              <strong>Municipal Building Permits & Regulatory Approvals:</strong> Submitting official architectural, civil, structural, electrical, sanitary, and mechanical documents to the Office of the Building Official (OBO) in municipal and city halls across Bulacan, Metro Manila, and Central Luzon.
            </li>
            <li>
              <strong>Pag-IBIG Fund (HDMF) & Bank Loan Processing:</strong> Facilitating construction loan applications, milestone inspection certifications, and release of takeout disbursements on behalf of the client.
            </li>
            <li>
              <strong>15-Year Structural Warranty Administration (Art. 1723):</strong> Tracking build records, concrete batch test certificates, steel mill certificates, and warranty service requests over the 15-year statutory guarantee period under Philippine Civil Code.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "privacy-sharing",
      number: "4.0",
      title: isFil ? "Pagbabahagi sa mga Awtorisadong Partido" : "Authorized Third-Party Disclosures",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Pinangangalagaan namin ang inyong impormasyon nang may mataas na antas ng pagiging kumpidensyal. Ibinabahagi lamang ito sa mga sumusunod na awtorisadong partido kung kinakailangan sa inyong proyekto:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Mga Lisensyadong Propesyonal
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Mga PRC-licensed Architects, Civil/Structural Engineers, at Master Plumbers na pumipirma at nagtatatak (dry-seal) sa inyong mga blueprints.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Tanggapan ng Building Official (Munisipyo)
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Engineering departments ng Plaridel, Malolos, Guiguinto, Balagtas, at iba pang LGU para sa Building Permits at Certificate of Occupancy.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Awtorisadong Institusyong Pinansyal
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Pag-IBIG Fund (HDMF) at mga partner commercial bank para sa inspeksyon at pagpapalabas ng loan alinsunod sa nakasulat na pahintulot ng kliyente.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Mga Ahensya ng Pamahalaan
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Bureau of Internal Revenue (BIR) para sa opisyal na resibo at buwis, DOLE para sa kaligtasan sa konstruksyon, at mga hukuman kung ipinag-uutos ng batas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Your personal information is handled with the highest level of confidentiality. Data is shared strictly on a need-to-know basis with the following verified entities:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Licensed Design Professionals
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                PRC-licensed Architects, Civil/Structural Engineers, Master Plumbers, and Professional Electrical Engineers who sign and seal your blueprints.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Municipal Building Officials (LGUs)
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Engineering departments of Plaridel, Malolos, Guiguinto, Balagtas, and respective LGUs for Building Permits and Certificates of Occupancy.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Authorized Financing Institutions
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Pag-IBIG Fund (HDMF) or accredited partner commercial banks for verified milestone inspection and loan release with written client authorization.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Government Compliance Agencies
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Bureau of Internal Revenue (BIR) for official receipts and tax compliance, DOLE for Construction Safety Programs, and competent courts under Philippine law.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "privacy-retention",
      number: "5.0",
      title: isFil ? "Pangangalaga, Seguridad, at Tagal ng Pag-iimbak" : "Storage Security & Retention Period",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Ang mga digital na rekord ay iniingatan sa mga secure na server gamit ang 256-bit encryption at mahigpit na password access. Ang mga pisikal na blueprint, orihinal na plano, at nilagdaang kontrata ay nakalagay sa fire-resistant archive room sa aming punong tanggapan sa Plaridel, Bulacan.
          </p>
          <p>
            <strong>Panahon ng Pag-iimbak:</strong> Alinsunod sa <strong>Artikulo 1723 ng Civil Code ng Pilipinas</strong>, kung saan mananagot ang inhenyero at arkitekto sa tibay ng estruktura sa loob ng 15 taon mula nang matapos ang gusali, ang mga structural calculations at kontrata ay iingatan nang hindi bababa sa <strong>labinlimang (15) taon</strong>. Ang mga pangkalahatang katanungan sa konsultasyon ay ligtas na sinisira pagkalipas ng tatlong (3) taon kung walang naging proyekto.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Digital records are stored on secure cloud servers with 256-bit encryption, role-based administrative access, and multi-factor authentication. Physical paper blueprints, land titles, and signed contracts are secured in fire-resistant architectural archives at our Plaridel headquarters.
          </p>
          <p>
            <strong>Retention Schedule:</strong> In compliance with <strong>Article 1723 of the Civil Code of the Philippines</strong>, which holds architects and engineers liable for structural defects within 15 years from construction completion, structural calculations and contract drawings are retained for a minimum of <strong>fifteen (15) years</strong> post-turnover. Other general consultation inquiries are archived or securely shredded after three (3) years of inactivity.
          </p>
        </div>
      ),
    },
    {
      id: "privacy-rights",
      number: "6.0",
      title: isFil ? "Mga Karapatan ng Kliyente sa Ilalim ng Batas" : "Your Rights as a Data Subject",
      content: isFil ? (
        <div className="space-y-2">
          <p>Sa ilalim ng Data Privacy Act of 2012, mayroon kayong mga sumusunod na karapatan bilang data subject:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Karapatang Malaman (Right to be Informed):</strong> Malaman kung ang inyong datos ay kinokolekta, paano ito ginagamit, at sino ang may hawak nito.</li>
            <li><strong>Karapatang Sumuri (Right to Access):</strong> Humiling ng kopya o pagsusuri sa inyong personal na rekord at mga dokumento ng proyekto na hawak namin.</li>
            <li><strong>Karapatang Magwasto (Right to Rectification):</strong> Humiling na itama ang anumang mali, lumang impormasyon, o pagkukulang sa inyong datos.</li>
            <li><strong>Karapatang Magpabura (Right to Erasure or Blocking):</strong> Humiling na tanggalin o harangin ang inyong datos kapag wala nang legal o kontraktuwal na basehan para panatilihin ito.</li>
            <li><strong>Karapatang Magreklamo (Right to File a Complaint):</strong> Dumulog at maghain ng reklamo sa National Privacy Commission (NPC) kung may paglabag sa inyong karapatan sa privacy.</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-2">
          <p>Under the Data Privacy Act of 2012, you possess the following statutory rights:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Right to be Informed:</strong> To know whether personal data pertaining to you is being collected and processed.</li>
            <li><strong>Right to Access:</strong> To request reasonable access to your personal information and architectural project records in our custody.</li>
            <li><strong>Right to Rectification:</strong> To dispute inaccuracies or errors in your personal details and have them promptly corrected.</li>
            <li><strong>Right to Erasure or Blocking:</strong> To suspend, withdraw, or order the removal of personal data upon reasonable grounds permitted by law.</li>
            <li><strong>Right to File a Complaint:</strong> To file a complaint with the National Privacy Commission (NPC) if your privacy rights have been violated.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "privacy-contact",
      number: "7.0",
      title: isFil ? "Makipag-ugnayan sa Data Protection Officer" : "Data Protection Officer (DPO) Contact",
      content: isFil ? (
        <div className="p-4 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 text-xs space-y-2">
          <p className="font-semibold text-neutral-900 dark:text-white">
            Para sa mga katanungan, kahilingan sa datos, o alalahanin sa inyong privacy, maaaring makipag-ugnayan sa aming compliance desk:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-neutral-500 block">Tanggapan:</span>
              <span>Data Protection Officer, MCPA Construction and Supply</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Address:</span>
              <a
                href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-amber-600 dark:text-amber-400"
              >
                2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block">Email:</span>
              <a href="mailto:mcpa.construction@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">
                mcpa.construction@gmail.com
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block">Direktang Linya:</span>
              <a href="tel:+639497758239" className="hover:underline text-amber-600 dark:text-amber-400">
                (0949) 775 8239 / +63 949 775 8239
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 text-xs space-y-2">
          <p className="font-semibold text-neutral-900 dark:text-white">
            For inquiries, data access requests, or privacy concerns, contact our designated compliance desk:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-neutral-500 block">Office:</span>
              <span>Data Protection Officer, MCPA Construction and Supply</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Address:</span>
              <a
                href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-amber-600 dark:text-amber-400"
              >
                2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block">Email:</span>
              <a href="mailto:mcpa.construction@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">
                mcpa.construction@gmail.com
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block">Direct Line:</span>
              <a href="tel:+639497758239" className="hover:underline text-amber-600 dark:text-amber-400">
                (0949) 775 8239 / +63 949 775 8239
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // 2. TERMS OF ENGAGEMENT SECTIONS (BILINGUAL)
  // ---------------------------------------------------------------------------
  const termsSections = [
    {
      id: "terms-framework",
      number: "1.0",
      title: isFil ? "Balangkas ng Kontrata at Batas na Sumasaklaw" : "Contractual Framework & Governing Law",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Ang Kasunduan sa Serbisyo na ito ang pangkalahatang alituntuning sumasaklaw sa lahat ng residential, commercial, industrial, at renovation projects na isinasagawa ng <strong>MCPA Construction and Supply</strong> (ang &quot;Kontratista&quot;).
          </p>
          <p>
            Bawat kasunduan ay pinamamahalaan ng <strong>Civil Code ng Pilipinas (Batas Republika Blg. 386)</strong>, partikular ang Title VIII, Chapter 3 ukol sa <em>&quot;Work and Labor / Contracts for a Piece of Work&quot; (Artikulo 1713 hanggang 1731)</em>, ang <strong>National Building Code ng Pilipinas (Presidential Decree No. 1096)</strong>, ang <strong>National Structural Code of the Philippines (NSCP 2015 7th Edition)</strong>, at ang mga pamantayan ng <strong>CIAP Document 102</strong> (Uniform General Conditions of Contract for Private Construction).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            These Terms of Engagement constitute the standard contractual conditions governing all residential, commercial, industrial, and renovation projects undertaken by <strong>MCPA Construction and Supply</strong> (the &quot;Contractor&quot;).
          </p>
          <p>
            Every project agreement is governed by the <strong>Civil Code of the Philippines (Republic Act No. 386)</strong>, particularly Title VIII, Chapter 3 on <em>&quot;Work and Labor / Contracts for a Piece of Work&quot; (Articles 1713 through 1731)</em>, the <strong>National Building Code of the Philippines (Presidential Decree No. 1096)</strong>, the <strong>National Structural Code of the Philippines (NSCP 2015 7th Edition)</strong>, and the uniform provisions of <strong>CIAP Document 102</strong> (Uniform General Conditions of Contract for Private Construction).
          </p>
        </div>
      ),
    },
    {
      id: "terms-scope",
      number: "2.0",
      title: isFil ? "Saklaw ng Trabaho at Propesyonal na Plano" : "Scope of Works & Signed Architectural Plans",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Isasagawa ng Kontratista ang lahat ng trabaho alinsunod sa naaprubahang Saklaw ng Proyekto, Bill of Quantities (BOQ), Technical Specifications, at Iskedyul ng Konstruksyon na nakasaad sa nilagdaang Kontrata sa Konstruksyon.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Pirma at Selyo ng Lisensyadong Propesyonal:</strong> Lahat ng blueprints sa arkitektura, kalkulasyong estruktural, electrical plans, at sanitary schematics ay nilagdaan at may dry-seal ng mga lisensyadong Pilipinong Arkitekto at Civil/Structural Engineers na may aktibong PRC at PTR numbers.
            </li>
            <li>
              <strong>Permit sa Munisipyo:</strong> Nagbibigay ang MCPA ng buong tulong sa pagproseso ng Municipal Building Permit, Electrical Permit, Sanitary Permit, at Fire Safety Evaluation Clearance (FSEC) sa mga LGU sa buong Bulacan at Gitnang Luzon.
            </li>
            <li>
              <strong>Sariling Suplay ng Materyales:</strong> Ang mga buhangin, graba, hollow blocks, at bakal na direktang inihahatid sa pamamagitan ng MCPA in-house logistics ay pumapasa sa pamantayan ng DPWH at ASTM.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            The Contractor shall execute works strictly according to the approved Project Scope, Bill of Quantities (BOQ), Technical Specifications, and Construction Timetable detailed in the signed Construction Agreement.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Licensed Signatures:</strong> All architectural blueprints, structural calculations, electrical drawings, and sanitary schematics are prepared, signed, and dry-sealed by licensed Filipino professionals (PRC registered Architects and Civil/Structural Engineers) with valid PTR numbers.
            </li>
            <li>
              <strong>Municipal Permitting:</strong> MCPA provides end-to-end guidance and filing assistance for Municipal Building Permits, Electrical Permits, Sanitary Permits, and Fire Safety Evaluation Clearances (FSEC) with local government units across Bulacan and Central Luzon.
            </li>
            <li>
              <strong>In-House Logistics:</strong> Aggregates, hollow blocks, and structural materials supplied directly through MCPA&apos;s logistics network meet DPWH specifications and ASTM standards.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "terms-bnpl",
      number: "3.0",
      title: isFil ? "Build Now, Pay Later (BNPL) at Milestone Billing" : "Build Now, Pay Later (BNPL) & Milestone Billing",
      content: isFil ? (
        <div className="space-y-4">
          <p>
            Upang masiguro ang kapayapaan ng isip ng bawat may-ari ng bahay, nagpapatupad ang MCPA ng malinaw na bayaran batay sa natapos na yugto (milestone-based billing). Sa ilalim ng aming programang <strong>Build Now, Pay Later (BNPL)</strong> para sa mga may tituladong lote, hindi nagbabayad nang maaga ang kliyente sa trabahong hindi pa nasusuri. Ang bawat disbursement ay katumbas ng aktwal na natapos na yugto ng bahay:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Yugto ng Proyekto</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Aktwal na Saklaw ng Trabaho</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Bahagdan (%)</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Kailangan sa Pag-apruba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 1: Mobilisasyon</td>
                  <td className="p-3">Site layout, bakod ng site, barracks ng trabahador, at paghuhukay sa pundasyon.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">10%</td>
                  <td className="p-3">Inspeksyon sa layout at sukat ng lote.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 2: Substructure</td>
                  <td className="p-3">Footing tie beams, bakal ng pundasyon, gravel bed, at pagbubuhos ng semento.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">20%</td>
                  <td className="p-3">Pagsusuri sa rebar at concrete cylinder test.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 3: Superstructure</td>
                  <td className="p-3">Poste, structural beam sa ikalawang palapag, suspended slab, at roof beam.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">25%</td>
                  <td className="p-3">Inspeksyon pagkabuhos ng structural framing.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 4: Bubong at Pader</td>
                  <td className="p-3">Steel roof trusses, insulated roofing sheets, pader na CHB, at exterior plastering.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">20%</td>
                  <td className="p-3">Sign-off sa weather-tight enclosure.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 5: MEPFS Rough-Ins</td>
                  <td className="p-3">Tubo ng kuryente at tubig, sanitary pipes sa banyo, at kisame drywall framing.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">15%</td>
                  <td className="p-3">Water leak test at electrical continuity test.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Yugto 6: Turnkey Handover</td>
                  <td className="p-3">Tiles, pintura, pinto, bintana, lababo, gripo, punchlisting, at susi ng bahay.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">10%</td>
                  <td className="p-3">Joint inspection at Certificate of Acceptance.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            To provide homeowners with complete peace of mind, MCPA implements a transparent, milestone-based billing schedule under our <strong>Build Now, Pay Later (BNPL)</strong> program:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Milestone Stage</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Physical Scope Covered</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Disbursement %</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Sign-Off Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 1: Mobilization</td>
                  <td className="p-3">Site layout, temporary facility setup, perimeter enclosure, earthworks & foundation excavation.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">10%</td>
                  <td className="p-3">Site inspection & layout verification.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 2: Substructure</td>
                  <td className="p-3">Footing tie beams, foundation rebar installation, gravel bed, and concrete pouring.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">20%</td>
                  <td className="p-3">Rebar inspection & cylinder strength test.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 3: Superstructure</td>
                  <td className="p-3">Reinforced concrete columns, second floor structural slab, roof beams & load-bearing framing.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">25%</td>
                  <td className="p-3">Post-pour structural milestone check.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 4: Enclosure & Roofing</td>
                  <td className="p-3">Steel roof trusses, insulated roofing sheets, CHB masonry walls, and exterior plastering.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">20%</td>
                  <td className="p-3">Weather-tight enclosure sign-off.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 5: MEPFS Rough-Ins</td>
                  <td className="p-3">Electrical rough-in conduits, plumbing supply & drainage pipes, ceiling drywall framing.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">15%</td>
                  <td className="p-3">Water leak & electrical continuity test.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Phase 6: Turnkey Handover</td>
                  <td className="p-3">Floor tiles, painting, doors, windows, sanitary fixtures, punchlisting & Certificate of Turnover.</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">10%</td>
                  <td className="p-3">Client joint inspection & Certificate of Acceptance.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "terms-change-orders",
      number: "4.0",
      title: isFil ? "Pagbabago sa Disenyo at Change Orders" : "Variations, Modifications & Change Orders",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Anumang pagbabago, dagdag, o bawas sa naaprubahang plano na hihilingin ng may-ari pagkatapos malagdaan ang kontrata ay kailangang isumite nang nakasulat gamit ang opisyal na <strong>Change Order Form (COF)</strong> ng MCPA.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Pahintulot Bago Simulan:</strong> Hindi sisimulan ang anumang binagong trabaho sa jobsite nang walang nakasulat na kasunduan sa eksaktong dagdag o bawas sa presyo at pagsasaayos sa iskedyul.
            </li>
            <li>
              <strong>Kalkulasyon ng Gastos:</strong> Ang halaga ng dagdag na materyales at labor ay kinakalkula batay sa aktwal na bill-of-quantities (BOQ) rates nang walang di-makatwirang patong.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Any alteration, addition, or deduction from the approved plans requested by the Owner after contract execution must be submitted in writing using MCPA&apos;s formal <strong>Change Order Form (COF)</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Prior Written Approval:</strong> No variation work shall begin on the jobsite without mutual written agreement specifying the exact adjustment in cost and project timeline.
            </li>
            <li>
              <strong>Cost Calculation:</strong> Added materials and labor are computed strictly based on actual bill-of-quantities (BOQ) rates without arbitrary surcharges.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "terms-warranty",
      number: "5.0",
      title: isFil ? "Labinlimang Taong (15-Year) Structural Warranty at Handover (Artikulo 1723 ng Civil Code)" : "15-Year Structural Warranty & Handover (Civil Code Art. 1723)",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Alinsunod sa <strong>Artikulo 1723 ng Civil Code ng Pilipinas (Republic Act Blg. 386)</strong> at mga pambansang pamantayan sa gusali, nagkakaloob ang MCPA Construction and Supply ng komprehensibong <strong>Labinlimang Taong (15-Year) Structural Warranty</strong> sa lahat ng turnkey residential homes at commercial buildings, simula sa araw ng pinal na turnover at paglagda sa Certificate of Acceptance.
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Sa ilalim ng Artikulo 1723 ng Civil Code, ang lisensyadong arkitekto at civil/structural engineer na pumirma at nagtatak (signed & sealed) sa mga plano, katuwang ang kontratista (MCPA Construction and Supply), ay may legal na pananagutan (statutory liability) sa loob ng labinlimang (15) taon mula sa pagkatapos ng gusali laban sa anumang pagbagsak o depekto sa estruktura dulot ng depekto sa plano, depekto sa lupa, o mahinang kalidad ng materyales. Ang pagtanggap sa gusali sa araw ng turnover ay hindi nagpapawalang-bisa sa proteksyong ito sa ilalim ng batas.
          </p>
          <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 text-xs space-y-2">
            <span className="font-semibold text-neutral-900 dark:text-white block">
              Saklaw ng 15-Taong Structural Warranty:
            </span>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
              <li>Katatagan ng pundasyon (structural footings, grade beams, tie beams, at retaining walls).</li>
              <li>Mga poste (reinforced concrete columns), shear walls, at suspended structural slabs.</li>
              <li>Mga bakal na roof trusses, rafters, purlins, at pangunahing framing laban sa paglaylay o structural deflection.</li>
              <li>Pananagutan ng lisensyadong arkitekto at inhinyero para sa pinirmahang structural computations at katatagan ng lupa.</li>
              <li>May hiwalay na isang (1) taong warranty para sa workmanship ng mga architectural finishes at fixtures (tiles, fittings, pintura, at plumbing fixtures).</li>
            </ul>
            <span className="font-semibold text-neutral-900 dark:text-white block pt-2">
              Hindi Saklaw ng Warranty:
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Kalamidad o Acts of God na lagpas sa pamantayan ng engineering design threshold (matinding lindol na higit sa seismic zone specs, pagsabog ng bulkan, o pagguho ng lupa sanhi ng hindi awtorisadong paghuhukay ng katabing lote ng ikatlong partido), hindi awtorisadong pagtibag sa mga structural na poste pagkatapos ng turnover, o hindi awtorisadong pagpapatong ng dagdag na palapag ng ibang kontratista.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            In strict compliance with <strong>Article 1723 of the Civil Code of the Philippines (Republic Act No. 386)</strong> and Philippine building standards, MCPA Construction and Supply provides an explicit <strong>Fifteen (15) Year Structural Warranty</strong> on all complete turnkey residential homes and commercial buildings, commencing from the date of final turnover and execution of the Certificate of Acceptance.
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Under Article 1723, the licensed architect and civil/structural engineer who drafted and signed & sealed the plans, along with the contractor (MCPA Construction and Supply), hold statutory liability for fifteen (15) years from the completion of the structure for collapse or structural defects resulting from defects in plans and specifications, defects in the ground, construction defects, or the use of inferior materials. Acceptance of the building does not waive this statutory cause of action under Philippine law.
          </p>
          <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 text-xs space-y-2">
            <span className="font-semibold text-neutral-900 dark:text-white block">
              15-Year Warranty Coverage Includes:
            </span>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
              <li>Structural foundation integrity, including footings, grade beams, tie beams, and retaining structures.</li>
              <li>Load-bearing reinforced concrete columns, shear walls, and suspended slabs.</li>
              <li>Structural roof trusses, rafters, purlins, and primary framing against structural deflection.</li>
              <li>Professional engineering liability for signed and sealed structural calculations and soil foundation adequacy.</li>
              <li>Architectural finishes & fixtures carry a standard one (1) year workmanship warranty.</li>
            </ul>
            <span className="font-semibold text-neutral-900 dark:text-white block pt-2">
              Warranty Exclusions:
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Acts of God beyond engineering design thresholds (severe earthquakes exceeding design seismic zone specs, volcanic eruptions, soil liquefaction resulting from unauthorized adjacent excavation by third parties), unauthorized post-turnover structural demolitions, or unapproved third-party structural additions.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "terms-disputes",
      number: "6.0",
      title: isFil ? "Pangangasiwa ng Hindi Pagkakaunawaan" : "Dispute Resolution & Arbitration",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Sakaling magkaroon ng hindi pagkakaunawaan o alitan kaugnay ng kontrata, kapwa sumasang-ayon ang dalawang panig na unahing lutasin ito sa pamamagitan ng tapat at maayos na negosasyon (amicable settlement) sa loob ng tatlumpung (30) araw.
          </p>
          <p>
            Kung hindi magkasundo, isusumite ang usapin para sa voluntary arbitration sa <strong>Construction Industry Arbitration Commission (CIAC)</strong> ng Pilipinas alinsunod sa Executive Order No. 1008, na ang desisyon ay pinal at may bisa sa ilalim ng batas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            In the event of any disagreement or dispute arising out of or in connection with the construction contract, both parties agree to first exhaust amicable discussions in good faith within thirty (30) days from written notice.
          </p>
          <p>
            Failing amicable settlement, the dispute shall be submitted to voluntary arbitration before the <strong>Construction Industry Arbitration Commission (CIAC)</strong> in the Philippines pursuant to Executive Order No. 1008.
          </p>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // 3. SAFETY CODE & SITE STANDARDS (BILINGUAL)
  // ---------------------------------------------------------------------------
  const safetySections = [
    {
      id: "safety-policy",
      number: "1.0",
      title: isFil ? "Patakaran sa Kaligtasan at Zero-Harm" : "Health, Safety & Environment (HSE) Policy",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Ang <strong>MCPA Construction and Supply</strong> ay mahigpit na nagpapatupad ng panuntunang <em>Zero-Harm</em> sa lahat ng aming aktibong proyekto sa Bulacan, Metro Manila, at Gitnang Luzon. Para sa amin, ang buhay at kaligtasan ng mga manggagawa, inhenyero, at ng publiko ang pinakamahalaga sa lahat.
          </p>
          <p>
            Lahat ng patakaran sa site ay sumusunod sa <strong>Department of Labor and Employment (DOLE) Department Order No. 13, Series of 1998 (DO 13-98)</strong> ukol sa <em>Occupational Safety and Health in the Construction Industry</em>, at sa <strong>Batas Republika Blg. 11058</strong> (OSH Standards).
          </p>
          <div className="p-3.5 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-neutral-800 dark:text-neutral-200 text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
              DOLE Construction Safety Program (CSHP):
            </span>
            Bawat indibidwal na proyekto ng MCPA ay may opisyal na Construction Safety and Health Program (CSHP) na dumaan sa pagsusuri at aprubado ng DOLE bago magsimula ang aktwal na konstruksyon sa site.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            <strong>MCPA Construction and Supply</strong> upholds a strict <em>Zero-Harm</em> safety commitment across all active jobsites in Bulacan, Metro Manila, and Central Luzon. We consider human safety, worker health, and public protection paramount above all project operational milestones.
          </p>
          <p>
            Our site safety protocols comply fully with <strong>Department of Labor and Employment (DOLE) Department Order No. 13, Series of 1998 (DO 13-98)</strong>, <em>Guidelines Governing Occupational Safety and Health in the Construction Industry</em>, and <strong>Republic Act No. 11058</strong> (OSH Standards).
          </p>
          <div className="p-3.5 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-neutral-800 dark:text-neutral-200 text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
              DOLE Construction Safety Program (CSHP):
            </span>
            Every individual MCPA construction site operates under a comprehensive, project-specific Construction Safety and Health Program (CSHP) reviewed and approved by DOLE prior to physical mobilization.
          </div>
        </div>
      ),
    },
    {
      id: "safety-ppe",
      number: "2.0",
      title: isFil ? "Mandatory Personal Protective Equipment (PPE)" : "Mandatory Personal Protective Equipment (PPE)",
      content: isFil ? (
        <div className="space-y-4">
          <p>
            Ipinatutupad ng MCPA ang mahigpit na patakarang <strong>&quot;Walang PPE, Bawal Pumasok&quot; (No PPE, No Entry)</strong>. Lahat ng manggagawa, inhenyero, bisita, at may-ari ng bahay ay kailangang magsuot ng tamang safety gear bago pumasok sa bakod ng konstruksyon:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Uri ng Kagamitan</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Pamantayan sa Kaligtasan</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Patakaran at Kulay sa Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Safety Hard Hat</td>
                  <td className="p-3">ANSI Z89.1 / OSHS Type I, Class E & G</td>
                  <td className="p-3">May Color Code: Dilaw (Karpintero/Mason/Laborer), Puti (Arkitekto at Inhenyero), Asul (Elektrisyan), Pula (Safety Officer), Berde (Kliyente at Bisita).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Safety Shoes (Bakal ang Nguso)</td>
                  <td className="p-3">ASTM F2413 / EN ISO 20345 (Steel Toe)</td>
                  <td className="p-3">Sapatos na may bakal sa unahan at puncture-resistant steel midsole upang maiwasan ang tusok ng pako o bakal sa talampakan.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Reflective Safety Vest</td>
                  <td className="p-3">ANSI/ISEA 107 Class 2 Reflective</td>
                  <td className="p-3">Maliwanag na neon orange o lime green vest na may reflective strips para madaling makita lalo na sa delivery ng materyales.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Fall Arrest Safety Harness</td>
                  <td className="p-3">ANSI Z359.11 Full-Body Double Lanyard</td>
                  <td className="p-3">Sapilitan para sa sinumang gumagawa sa taas na 2.0 metro (6 feet) pataas sa plantsa (scaffolding) o sa bubong.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Proteksyon sa Mata at Mukha</td>
                  <td className="p-3">ANSI Z87.1 High-Impact Polycarbonate</td>
                  <td className="p-3">Safety goggles para sa pagkakaltas/grinding at welding mask para sa pagwewelding ng mga bakal.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            MCPA enforces a strict <strong>&quot;No PPE, No Entry&quot;</strong> rule. All workers, engineers, subcontractor personnel, and authorized project visitors must wear standard-compliant protective gear before crossing the jobsite perimeter:
          </p>

          <div className="overflow-x-auto rounded-[4px] border border-neutral-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 dark:bg-white/[0.04] text-neutral-900 dark:text-white uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Equipment Type</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Compliance Standard</th>
                  <th className="p-3 border-b border-neutral-200 dark:border-white/10">Site Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Safety Hard Hats</td>
                  <td className="p-3">ANSI Z89.1 / OSHS Type I, Class E & G</td>
                  <td className="p-3">Color-coded: Yellow (Carpenters/Masons), White (Architects & Engineers), Blue (Electricians), Red (Safety Officers), Green (Clients & Visitors).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Safety Footwear</td>
                  <td className="p-3">ASTM F2413 / EN ISO 20345 (Steel Toe)</td>
                  <td className="p-3">Steel-toe, puncture-resistant steel midsole boots to prevent rebar puncture and crushing injuries.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">High-Visibility Vests</td>
                  <td className="p-3">ANSI/ISEA 107 Class 2 Reflective</td>
                  <td className="p-3">Neon orange or lime green reflective vests worn at all times, especially during heavy logistics delivery.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Fall Arrest Harnesses</td>
                  <td className="p-3">ANSI Z359.11 Full-Body Double Lanyard</td>
                  <td className="p-3">Mandatory for any work elevated 2.0 meters (6 feet) or higher on scaffolding, roof beams, and floor edges.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">Eye & Face Protection</td>
                  <td className="p-3">ANSI Z87.1 High-Impact Polycarbonate</td>
                  <td className="p-3">Safety goggles for grinding/chipping and DIN 10–12 shade welding shields for rebar welding.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "safety-scaffolding",
      number: "3.0",
      title: isFil ? "Scaffolding, Formworks, at Fall Protection" : "Scaffolding, Formworks & Fall Protection",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Ang pagtatrabaho sa mataas na bahagi ng bahay o gusali ay may kaakibat na panganib, kaya ipinatutupad namin ang mga sumusunod na pag-iingat:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>TESDA-Certified Scaffolders:</strong> Ang mga tubular steel frame scaffolding ay itinatayo, binabago, at binabaklas lamang ng mga sertipikadong erectors.
            </li>
            <li>
              <strong>Pang-araw-araw na Tagging:</strong> Bawat plantsa ay sinusuri tuwing umaga ng Safety Officer bago simulan ang trabaho gamit ang BERDE (Ligtas Gamitin), DILAW (Kasalukuyang Inaayos), o PULA (Bawal Gamitin).
            </li>
            <li>
              <strong>Inspeksyon Bago Magbuhos:</strong> Sinusuri ang plumbness, suporta, at shoring jacks ng formworks bago magbuhos ng semento sa mga poste at slab.
            </li>
            <li>
              <strong>Proteksyon sa Nakatayong Bakal (Rebar Caps):</strong> Lahat ng nakatayong bakal (rebars) ay nilalagyan ng kulay kahel na safety mushroom caps upang maiwasan ang malubhang pinsala sakaling may madapa o mahulog.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Working at heights presents high operational risks in multi-storey residential and commercial building construction. MCPA enforces the following safety controls:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>TESDA-Certified Scaffolders:</strong> All tubular steel frame scaffoldings must be erected, modified, and dismantled exclusively by certified scaffold erectors.
            </li>
            <li>
              <strong>Daily Tagging System:</strong> Every scaffold tower is inspected daily by the Site Safety Officer before shift start, marked with a visible GREEN, YELLOW, or RED tag.
            </li>
            <li>
              <strong>Pre-Pour Formwork Audit:</strong> Formworks, shoring jacks, and falsework undergo rigid inspection for structural plumbness, bracing, and load capacity prior to concrete pouring.
            </li>
            <li>
              <strong>Rebar Impalement Protection:</strong> All vertically protruding steel reinforcement bars (rebars) are capped with bright orange protective mushroom caps to eliminate puncture hazards.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "safety-equipment",
      number: "4.0",
      title: isFil ? "Makinarya, Logistika, at Kaligtasan sa Kalsada" : "Heavy Equipment & Public Traffic Safety",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Dahil ang MCPA ay may sariling armada ng delivery trucks para sa buhangin, graba, ready-mix concrete, at bakal sa buong Bulacan at Metro Manila, mahigpit ang aming patakaran sa trapiko at kagamitan:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Mga Sinanay na Flagmen:</strong> May mga sertipikadong signalmen na may hawak na warning flags, safety batons, at pito upang ligtas na gabayan ang pagpasok at paglabas ng mga trak sa mga pampublikong kalsada (tulad ng Cagayan Valley Road at mga municipal bypass).
            </li>
            <li>
              <strong>Sertipikadong Operator:</strong> Ang mga nagpapatakbo ng boom truck, crane, backhoe, at concrete vibrator ay may hawak na balidong TESDA National Certificate (NC II) at DOLE accreditation.
            </li>
            <li>
              <strong>Harang sa Paligid:</strong> Naka-barricade ang paligid ng proyekto na may karatulang &quot;Banta: May Konstruksyon sa Loob&quot; upang maiwasan ang pagpasok ng mga batang naglalaro o hindi awtorisadong tao.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Because MCPA operates in-house logistics delivering aggregates, ready-mix concrete, and structural steel throughout Bulacan and Metro Manila, strict public road and equipment protocols are maintained:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Trained Signalmen / Flagmen:</strong> Certified flagmen equipped with high-visibility flags, safety batons, and warning whistles manage all truck ingress and egress along public roads.
            </li>
            <li>
              <strong>Heavy Equipment Operator Certification:</strong> All operators of boom trucks, mobile cranes, backhoes, and concrete vibrators hold valid TESDA National Certificates (NC II) and DOLE accreditation.
            </li>
            <li>
              <strong>Perimeter Barricades:</strong> Jobsite perimeters are fully enclosed with rigid safety barricades and warning signage to prevent unauthorized public entry.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "safety-emergency",
      number: "5.0",
      title: isFil ? "Paghahanda sa Sakuna at Emergency Protocol" : "Emergency Preparedness & Weather Contingency",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Ang bawat jobsite ng MCPA ay may nakalatag na Emergency Response Plan (ERP) na nakikipag-ugnayan sa mga lokal na ahensya ng kalamidad at pagsaklolo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Patakaran sa Bagyo at Panahon
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Awtomatikong ititigil ang trabaho sa itaas at pagpapatakbo ng crane sa oras na magtaas ang PAGASA ng Tropical Cyclone Wind Signal (TCWS) No. 2 o higit pa. Agad na itatali at seselyuhan ang lahat ng maluwag na materyales.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                First-Aid Station sa Site
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Bawat site ay may kompletong first-aid kit at may sinanay na First Aider (Philippine Red Cross certified) na nakabantay sa oras ng trabaho.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Fire Safety at Hot Work Permit
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                May nakahandang ABC dry chemical fire extinguishers na hindi lalayo sa 10 metro mula sa anumang lugar kung saan nagpuputol o nagwewelding. May pormal na permit bago simulan ang welding.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Direktang Linya sa Saklolo
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Direktang nakakonekta sa Plaridel Emergency Rescue, Bulacan Provincial Disaster Risk Reduction and Management Office (PDRRMC), at Bureau of Fire Protection (BFP).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Every MCPA jobsite maintains an active Emergency Response Plan (ERP) coordinated with local disaster management and rescue offices:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Typhoon & Weather Protocol
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Automatic suspension of height and crane operations upon PAGASA Tropical Cyclone Wind Signal (TCWS) No. 2. All loose materials and formworks secured immediately.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Certified First-Aid Stations
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Each jobsite is equipped with an industrial first-aid station and a Philippine Red Cross-trained first aider present throughout working hours.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Fire Safety & Hot Work Permits
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Operating dry chemical ABC fire extinguishers stationed within 10 meters of any welding or cutting area. Formal Hot Work Permit required prior to torch cutting.
              </p>
            </div>
            <div className="p-3.5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white block text-xs mb-1">
                Local Emergency Links
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Direct hotline integration with Plaridel Emergency Rescue, Bulacan Provincial PDRRMC, and Bureau of Fire Protection (BFP) stations.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "safety-compliance",
      number: "6.0",
      title: isFil ? "Inspeksyon at Pagpapatupad ng Kaligtasan" : "Inspections, Audits & Incident Reporting",
      content: isFil ? (
        <div className="space-y-3">
          <p>
            Nagsasagawa ang aming mga safety officers ng regular at biglaang inspeksyon sa site linggu-linggo. Sinumang manggagawa o subcontractor na lumalabag sa mga pamantayan sa kaligtasan ay sumasailalim sa kaukulang aksyong pandisiplina o pag-aalis sa site.
          </p>
          <p>
            Upang mag-ulat ng anumang obserbasyon sa kaligtasan o humingi ng kopya ng naaprubahang DOLE Construction Safety and Health Program (CSHP) para sa inyong proyekto, sumulat sa MCPA Safety Directorate sa <a href="mailto:mcpa.construction@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">mcpa.construction@gmail.com</a>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            Our safety officers conduct unannounced site audits weekly. Any worker or subcontractor caught violating mandatory safety protocols faces disciplinary action, retraining, or removal from the site.
          </p>
          <p>
            To report safety observations or request copies of our DOLE-approved Construction Safety and Health Program (CSHP) for your project, contact the MCPA Safety Directorate at <a href="mailto:mcpa.construction@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">mcpa.construction@gmail.com</a>.
          </p>
        </div>
      ),
    },
  ];

  // Active section list based on selected document
  const currentSections = useMemo(() => {
    if (activeDoc === "terms") return termsSections;
    if (activeDoc === "safety") return safetySections;
    return privacySections;
  }, [activeDoc, isFil]);

  // Filter sections if search is entered across title, number, and full content text
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentSections;
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return currentSections;
    return currentSections.filter((section) => {
      const titleText = section.title.toLowerCase();
      const numText = section.number.toLowerCase();
      const contentText = extractText(section.content).toLowerCase();
      const fullText = `${numText} ${titleText} ${contentText}`;
      return tokens.every((token) => fullText.includes(token));
    });
  }, [currentSections, searchQuery]);

  return (
    <>
      <ClientNavbar />

      <main className="min-h-screen bg-neutral-50 dark:bg-[#07090c] text-neutral-900 dark:text-neutral-100 pt-24 pb-20 font-sans transition-colors duration-300 print:min-h-0 print:bg-white print:text-black print:pt-0 print:pb-0 print:m-0">
        
        {/* 1. DOCUMENT HEADER & BREADCRUMBS */}
        <section className="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#07090c] print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-4">
              <Link
                href="/"
                onClick={() => setReturnToCompletedHome(true)}
                className="hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isFil ? "Tahanan" : "Home"}</span>
              </Link>
              <ChevronRight className="w-3 h-3 opacity-60" />
              <span>{isFil ? "Pagsunod sa Batas at Legal na Dokumento" : "Compliance & Legal Docs"}</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {currentDocMeta.title}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Document Identity */}
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 mb-2.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <Award className="w-3.5 h-3.5" />
                  <span>{currentDocMeta.regulatoryBadge}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
                  {currentDocMeta.title}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl font-light">
                  {currentDocMeta.subtitle}
                </p>
              </div>

              {/* Document Utilities: Download PDF, Print & Share */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={`/api/legal/pdf/${activeDoc}?lang=${isFil ? "fil" : "en"}`}
                  download
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono uppercase tracking-wider text-xs transition-colors shadow-xs cursor-pointer"
                  title={isFil ? "I-download ang Opisyal na PDF (May Awtomatikong File Name)" : "Download Official PDF (With Automatic File Name)"}
                >
                  {downloadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isFil ? "Dina-download..." : "Downloading..."}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{isFil ? "I-download ang PDF" : "Download PDF"}</span>
                    </>
                  )}
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  title={isFil ? "Kopyahin ang Link ng Dokumento" : "Copy Document Link"}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">
                        {isFil ? "Nakopya na ang Link!" : "Link Copied!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-neutral-500" />
                      <span>{isFil ? "Ibahagi ang Link" : "Share Link"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Metadata Strip */}
            <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">
                  {isFil ? "Hurisdiksyon" : "Jurisdiction"}
                </span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono text-xs">
                  {isFil ? "Republika ng Pilipinas" : "Republic of the Philippines"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">
                  {isFil ? "Opisyal na Kontratista" : "Official Contractor"}
                </span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono text-xs">
                  MCPA Construction &amp; Supply
                </span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">
                  {isFil ? "Pangunahing Tanggapan" : "Headquarters"}
                </span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono text-xs">
                  Plaridel, Bulacan
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. DOCUMENT SELECTOR TABS */}
        <section className="sticky top-[56px] sm:top-[64px] z-40 bg-white/95 dark:bg-[#07090c]/95 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 shadow-xs print:hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-2 sm:py-2.5">
              {/* Document Tabs: 3-column grid on mobile so all 3 tabs (Privacy, Terms, Safety Code) are immediately visible without overflow */}
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto shrink-0">
                {documents.map((doc) => {
                  const Icon = doc.icon;
                  const isActive = activeDoc === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => switchDocument(doc.id)}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-[4px] text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
                        isActive
                          ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                          : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.08] border border-neutral-200/60 dark:border-white/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="hidden sm:inline truncate">{doc.title}</span>
                      <span className="inline sm:hidden truncate">{doc.shortTitle}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Document Search Bar: Full width on mobile below tabs, docked right on sm+ */}
              <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-xs flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isFil ? `Maghanap sa ${currentDocMeta.shortTitle || currentDocMeta.title}...` : `Search ${currentDocMeta.shortTitle || currentDocMeta.title}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 rounded-[4px] bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                    title={isFil ? "Burahin ang paghahanap" : "Clear search"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. MAIN DOCUMENT BODY: TWO-COLUMN DOCUMENTATION LAYOUT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:max-w-none print:px-0 print:pt-0 print:m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start print:block">
            
            {/* LEFT SIDEBAR: Table of Contents & Compliance Seals (Sticky) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-[132px] print:hidden">
              
              {/* Table of Contents Card */}
              <div className="rounded-[6px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      {isFil ? "Balangkas ng Dokumento" : "Document Outline"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {searchQuery.trim()
                      ? `${filteredSections.length}/${currentSections.length} ${isFil ? "resulta" : "results"}`
                      : `${currentSections.length} ${isFil ? "na Seksyon" : "Sections"}`}
                  </span>
                </div>

                <nav className="space-y-1 text-xs">
                  {filteredSections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`flex items-start gap-2 px-2.5 py-1.5 rounded-[4px] transition-colors group ${
                        activeSectionId === sec.id
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="font-mono text-neutral-400 group-hover:text-amber-500 shrink-0">
                        {sec.number}
                      </span>
                      <span className="truncate">{highlightMatches(sec.title, searchQuery)}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Contractor & Legal Help Card */}
              <div className="rounded-[6px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 p-5 space-y-3.5 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
                  <FileCheck2 className="w-4 h-4 text-amber-500" />
                  <span>{isFil ? "Opisyal na Tanggapan ng Kontratista" : "Official Contractor Desk"}</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">
                  {isFil
                    ? "May katanungan ukol sa aming mga kontrata, BNPL financing verification, o pamantayan sa kaligtasan? Makipag-ugnayan sa aming legal at engineering desk."
                    : "Have inquiries regarding our contracts, BNPL financing verification, or safety standards? Contact our legal & engineering desk."}
                </p>
                <div className="space-y-2.5 pt-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                  <a
                    href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    title={isFil ? "Buksan ang Lokasyon ng MCPA sa Google Maps" : "Open MCPA Headquarters in Google Maps"}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline underline-offset-2">2826 Le Cagayan Valley Rd, Plaridel, Bulacan</span>
                  </a>

                  <a
                    href="tel:+639497758239"
                    className="flex items-center gap-2 group hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    title={isFil ? "Tawagan ang MCPA: (0949) 775 8239" : "Call MCPA: (0949) 775 8239"}
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline underline-offset-2">(0949) 775 8239</span>
                  </a>

                  <a
                    href="mailto:mcpa.construction@gmail.com"
                    className="flex items-center gap-2 group hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    title={isFil ? "Mag-email sa MCPA: mcpa.construction@gmail.com" : "Email MCPA: mcpa.construction@gmail.com"}
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline underline-offset-2">mcpa.construction@gmail.com</span>
                  </a>
                </div>
                <div className="pt-2">
                  <Link
                    href="/book"
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors shadow-xs"
                  >
                    <span>{isFil ? "Kumonsulta sa MCPA" : "Consult with MCPA"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT: The Complete Legal Document */}
            <article className="lg:col-span-8 bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 rounded-[6px] p-6 sm:p-10 lg:p-12 shadow-xs space-y-10 print:col-span-12 print:w-full print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-6 print:bg-white print:text-black">
              
              {/* ========================================================================= */}
              {/* 1. PRINT-ONLY OFFICIAL CORPORATE LETTERHEAD (Authentic Contractor Document) */}
              {/* ========================================================================= */}
              <div className="hidden print:block mb-8 pb-4 border-b-2 border-neutral-950">
                <div className="flex items-start justify-between gap-6 pb-4">
                  {/* Left: Company Logo & Identity */}
                  <div className="flex items-center gap-4">
                    <img
                      src="/assets/mcpa-logo.png"
                      alt="MCPA Construction and Supply"
                      className="w-44 h-auto object-contain shrink-0"
                    />
                    <div className="border-l-2 border-neutral-950 pl-3.5 space-y-0.5">
                      <h1 className="text-base font-black tracking-tight text-neutral-950 uppercase font-sans">
                        MCPA Construction and Supply
                      </h1>
                      <p className="text-[10px] font-bold text-neutral-800 tracking-wide uppercase">
                        General Engineering &amp; Building Contractor · Hardware Supplies
                      </p>
                      <p className="text-[9px] text-neutral-600 font-mono">
                        PCAB License Registered · CIAP Accredited · DOLE CSHP Compliant
                      </p>
                    </div>
                  </div>

                  {/* Right: Operations & Contact Headquarters */}
                  <div className="text-right text-[9.5px] text-neutral-700 font-mono leading-tight space-y-0.5 shrink-0">
                    <p className="font-bold text-neutral-950">HEADQUARTERS &amp; OPERATIONS DESK</p>
                    <p>2826 Le Cagayan Valley Road, Tabang</p>
                    <p>Plaridel, Bulacan 3004, Philippines</p>
                    <p>Tel: +63 (0949) 775 8239</p>
                    <p>Email: mcpa.construction@gmail.com</p>
                  </div>
                </div>

                {/* Document Reference Strip */}
                <div className="mt-2 pt-3 border-t border-neutral-300 grid grid-cols-3 gap-3 text-[9.5px] font-mono bg-neutral-100/80 p-2.5 rounded border border-neutral-200">
                  <div>
                    <span className="text-neutral-500 block uppercase text-[8px] font-sans font-bold">
                      {isFil ? "Opisyal na Pamagat" : "Document Title"}
                    </span>
                    <span className="font-bold text-neutral-950">{currentDocMeta.title}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase text-[8px] font-sans font-bold">
                      {isFil ? "Batayan sa Regulasyon" : "Statutory Instrument"}
                    </span>
                    <span className="font-bold text-neutral-950">{currentDocMeta.regulatoryBadge}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase text-[8px] font-sans font-bold">
                      {isFil ? "Hurisdiksyon at Bisa" : "Jurisdiction & Status"}
                    </span>
                    <span className="font-bold text-neutral-950">Plaridel, Bulacan / PH · Active</span>
                  </div>
                </div>
              </div>

              {/* Document Banner */}
              <div className="p-4 sm:p-5 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 flex items-start gap-4 print:hidden">
                <currentDocMeta.icon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    {isFil ? `Patalastas sa ${currentDocMeta.title}` : `${currentDocMeta.title} Notice`}
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isFil
                      ? "Inilalahad ng dokumentong ito ang sertipikadong patakaran sa operasyon at legal na alituntunin ng MCPA Construction and Supply alinsunod sa mga batas sa konstruksyon ng Pilipinas, mga regulasyon ng National Building Code, at mga mandato sa kaligtasan."
                      : "This document reflects the certified operating policy and legal terms of MCPA Construction and Supply in accordance with Philippine construction statutes, National Building Code regulations, and safety mandates."}
                  </p>
                </div>
              </div>

              {/* Active Search Results Feedback Banner */}
              {searchQuery.trim() && (
                <div className="p-3 sm:p-4 rounded-[4px] bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300 print:hidden">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {isFil ? (
                        <>
                          May <strong>{filteredSections.length}</strong> na seksyong natagpuan para sa &ldquo;<span className="bg-amber-400/30 text-amber-950 dark:text-amber-300 px-1 py-0.5 rounded-[2px] font-semibold font-mono">{searchQuery}</span>&rdquo;
                        </>
                      ) : (
                        <>
                          Found <strong>{filteredSections.length}</strong> matching {filteredSections.length === 1 ? "section" : "sections"} for &ldquo;<span className="bg-amber-400/30 text-amber-950 dark:text-amber-300 px-1 py-0.5 rounded-[2px] font-semibold font-mono">{searchQuery}</span>&rdquo;
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase font-mono tracking-wider transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isFil ? "Alisin ang filter" : "Clear filter"}</span>
                  </button>
                </div>
              )}

              {/* Render Sections */}
              {filteredSections.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Search className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {isFil
                      ? `Walang natagpuang seksyon para sa "${searchQuery}".`
                      : `No matching sections found for "${searchQuery}".`}
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-amber-500 font-bold hover:underline cursor-pointer"
                  >
                    {isFil ? "Burahin ang paghahanap" : "Clear search query"}
                  </button>
                </div>
              ) : (
                filteredSections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-36 pt-4 border-t first:border-t-0 border-neutral-200/80 dark:border-white/10 space-y-4 print:pt-4 print:border-t print:border-neutral-300 print:break-inside-avoid print:page-break-inside-avoid"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 print:text-neutral-900 shrink-0 select-none">
                        {highlightMatches(sec.number, searchQuery)}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white tracking-tight print:text-black print:text-sm">
                        {highlightMatches(sec.title, searchQuery)}
                      </h3>
                    </div>

                    <div className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed font-light print:text-neutral-900 print:text-[11px] print:leading-normal print:font-normal">
                      {highlightMatches(sec.content, searchQuery)}
                    </div>
                  </section>
                ))
              )}

              {/* ========================================================================= */}
              {/* 2. PRINT-ONLY OFFICIAL ATTESTATION & SIGN-OFF BLOCK                       */}
              {/* ========================================================================= */}
              <div className="hidden print:block mt-12 pt-6 border-t-2 border-neutral-950 print:break-inside-avoid print:page-break-inside-avoid">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                      {isFil ? "Opisyal na Sertipikasyon at Pagpapatibay ng Kontratista" : "Official Certification & Statutory Attestation"}
                    </h4>
                    <p className="mt-1.5 text-[10px] text-neutral-700 leading-relaxed font-sans">
                      {isFil
                        ? "Pinatutunayan at pinagtitibay ng MCPA Construction and Supply na ang lahat ng alituntunin, teknikal na pamantayan, Labinlimang Taong (15-Year) pananagutan sa estruktura alinsunod sa Artikulo 1723 ng Civil Code ng Pilipinas, mga regulasyon ng DOLE sa kaligtasan sa pagtatayo, at mga probisyon sa proteksyon ng personal at pampari-ariang datos sa ilalim ng RA 10173 na nakasaad sa dokumentong ito ay opisyal, sertipikado, at legal na umiiral sa lahat ng kasunduan, proyekto, at proseso ng turnover."
                        : "MCPA Construction and Supply hereby certifies and attests that all operational guidelines, engineering standards, statutory Fifteen (15) Year Structural Warranty obligations pursuant to Article 1723 of the Civil Code of the Philippines, DOLE construction safety mandates, and data governance provisions under Republic Act No. 10173 set forth herein represent the official certified instruments governing all active client agreements, project milestones, and turnover executions."}
                    </p>
                  </div>

                  {/* Dual Professional Signatory Lines */}
                  <div className="grid grid-cols-2 gap-12 pt-10 pb-4">
                    {/* Engineering & Technical Standards Authority */}
                    <div className="border-t border-neutral-950 pt-2 space-y-0.5">
                      <p className="text-xs font-bold text-neutral-950 uppercase tracking-tight">
                        ENGR. / ARCH. TECHNICAL DIRECTOR
                      </p>
                      <p className="text-[10px] text-neutral-700 font-medium">
                        {isFil ? "Direktorado ng Inhenyeriya at Disenyo" : "Directorate of Structural & Technical Standards"}
                      </p>
                      <p className="text-[8.5px] font-mono text-neutral-500">
                        PRC Reg. Licensed Professional Engineer / Architect · MCPA Construction
                      </p>
                    </div>

                    {/* Managing Contractor Authority */}
                    <div className="border-t border-neutral-950 pt-2 space-y-0.5">
                      <p className="text-xs font-bold text-neutral-950 uppercase tracking-tight">
                        MANAGING GENERAL CONTRACTOR
                      </p>
                      <p className="text-[10px] text-neutral-700 font-medium">
                        {isFil ? "Pangkalahatang Pamamahala at Operasyon" : "Executive Operations & Corporate Governance"}
                      </p>
                      <p className="text-[8.5px] font-mono text-neutral-500">
                        MCPA Construction and Supply · Plaridel, Bulacan, Philippines
                      </p>
                    </div>
                  </div>

                  {/* Legal Document Footer Strip */}
                  <div className="pt-3 border-t border-neutral-300 flex items-center justify-between text-[8px] font-mono text-neutral-500">
                    <span>MCPA Construction and Supply · Official Corporate Instrument</span>
                    <span>Plaridel, Bulacan, Philippines · Certified Authentic</span>
                  </div>
                </div>
              </div>
            </article>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
