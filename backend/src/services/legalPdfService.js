const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Statically require standard fonts so Vercel's bundler (NFT) bundles them
try {
  require("pdfkit/standard-fonts/Helvetica");
  require("pdfkit/standard-fonts/HelveticaBold");
  require("pdfkit/standard-fonts/HelveticaOblique");
  require("pdfkit/standard-fonts/HelveticaBoldOblique");
  require("pdfkit/standard-fonts/TimesRoman");
  require("pdfkit/standard-fonts/TimesBold");
  require("pdfkit/standard-fonts/TimesItalic");
  require("pdfkit/standard-fonts/TimesBoldItalic");
  require("pdfkit/standard-fonts/Courier");
  require("pdfkit/standard-fonts/CourierBold");
} catch (_) {}

/**
 * MCPA Construction and Supply - Corporate Legal PDF Generator Service
 * Pure server-side PDF generator using PDFKit.
 * Authentic corporate documents with letterhead, regulatory metadata,
 * structured sections, full tables, and dual professional signatures.
 */

const LEGAL_DOCS_DATA = {
  // =========================================================================
  // 1. PRIVACY POLICY
  // =========================================================================
  privacy: {
    en: {
      docTitle: "Privacy Policy & Client Data Protection",
      docCode: "MCPA-POL-PRIVACY",
      statutoryBadge: "Republic Act No. 10173 (Data Privacy Act of 2012)",
      subtitle: "Client Data Protection, Land Title Privacy & Blueprint Confidentiality under RA 10173",
      sections: [
        {
          number: "1.0",
          title: "Introduction & Scope",
          body: [
            "At MCPA Construction and Supply, we are committed to respecting and protecting the personal and sensitive information of our clients, property owners, prospective homeowners, and site visitors. This Privacy Policy governs all personal data collected through our headquarters in Plaridel, Bulacan, our jobsite field offices, our official website, client consultation portals, and digital communication channels.",
            "Our data protection practices strictly comply with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), and all issuance circulars of the National Privacy Commission (NPC) of the Philippines.",
            "KEY COMMITMENT: MCPA Construction and Supply never sells, rents, monetizes, or shares client personal information, land title records, or architectural blueprints with unauthorized third-party commercial entities for marketing purposes."
          ]
        },
        {
          number: "2.0",
          title: "Personal & Property Information We Collect",
          body: [
            "To properly evaluate construction feasibility, draft architectural blueprints, secure municipal building permits, and process Build Now, Pay Later (BNPL) financing, we collect the following classifications of information:",
            "• Client Contact & Identity Details: Full legal name, civil status, spouse information, residential address, email address, mobile/Viber telephone numbers, and government-issued photo identification (TIN, SSS, Passport, Driver's License) for contract formalization and notary requirements.",
            "• Real Property & Land Title Records: Certified True Copies of Transfer Certificates of Title (TCT) or Original Certificates of Title (OCT), Real Property Tax Declarations, Lot Plans, Vicinity Maps, and Soil Test Reports required to verify lot ownership, prepare structural computations, and process Municipal Building Permits (OBO).",
            "• Architectural & Engineering Specifications: Desired floor plans, room dimensions, stylistic finish preferences, electrical and plumbing specifications, and 3D architectural models developed during the pre-construction phase.",
            "• Financial & Milestone Payment Verification: Milestone payment receipts, bank deposit slips, Pag-IBIG (HDMF) or commercial bank financing approval letters, and proof of income for clients applying for staggered disbursement under our BNPL program."
          ]
        },
        {
          number: "3.0",
          title: "Purpose of Data Processing",
          body: [
            "MCPA processes personal and property data exclusively for legitimate operational, statutory, and contractual purposes:",
            "• Turnkey Construction Services: Fulfilling obligations under the Standard Construction Agreement, including architectural design, civil/structural calculations, electrical and plumbing rough-ins, and turnkey finishing.",
            "• Regulatory Permit Processing: Filing signed and sealed architectural and engineering blueprints, structural calculations, and lot ownership proof with Municipal Building Officials (OBO), Bureau of Fire Protection (BFP), and concerned local government units (LGUs).",
            "• Milestone Billing & Financial Audits: Calculating progress disbursements corresponding strictly to actual site completion percentages under the verified milestone billing framework.",
            "• 15-Year Structural Warranty Administration: Archiving structural computations, concrete compressive test results, steel mill certificates, and project turnover documents throughout the statutory guarantee period mandated by Article 1723 of the Civil Code of the Philippines."
          ]
        },
        {
          number: "4.0",
          title: "Authorized Third-Party Disclosures & Data Sharing",
          body: [
            "MCPA Construction and Supply shares client information strictly on a need-to-know basis with trusted regulatory and professional partners:",
            "• Municipal Building Officials (OBO) & LGUs: Official submission of blueprints, structural calculations, and lot ownership proof for Building, Electrical, Sanitary, and Occupancy Permits.",
            "• PRC-Licensed Professional Engineers & Architects: Subcontracted specialists (Geotechnical, Structural, Master Plumber, PECE) who must review, compute, sign, and seal plans under their respective professional regulatory boards.",
            "• Partner Financial Institutions: Commercial banks and Pag-IBIG Fund (HDMF) for client-initiated construction loan applications and staged milestone draw-downs.",
            "• Materials Logistics & Delivery Drivers: Delivery site address and on-site receiver contact number for in-house truck delivery of cement, steel rebar, sand, gravel, and hardware supplies."
          ]
        },
        {
          number: "5.0",
          title: "Data Storage Security & Retention Period",
          body: [
            "• Digital Infrastructure: Client records, consultation briefs, and milestone receipts are encrypted in transit (TLS 1.3) and at rest (AES-256) within secure enterprise cloud databases.",
            "• Physical Blueprints & Documents: Physical copies of signed and sealed blueprints, structural calculations, and notarized contracts are securely archived at our Plaridel Headquarters.",
            "• Statutory Retention Period: Under Article 1723 of the Civil Code of the Philippines, structural engineering build plans and contracts are retained for a minimum of fifteen (15) years from the date of final project turnover."
          ]
        },
        {
          number: "6.0",
          title: "Your Rights as a Data Subject under RA 10173",
          body: [
            "As a valued client of MCPA Construction and Supply, you are fully entitled to all statutory rights under Chapter VIII of the Data Privacy Act of 2012, including: the Right to be Informed, the Right to Access, the Right to Object, the Right to Rectification / Correction, and the Right to File a Complaint with the National Privacy Commission (NPC)."
          ]
        },
        {
          number: "7.0",
          title: "Data Protection Officer & Contractor Inquiries",
          body: [
            "For inquiries regarding your personal data, title privacy, or blueprint confidentiality, contact our dedicated Data Protection Officer:",
            "• Office: Data Protection Officer, MCPA Construction and Supply",
            "• Headquarters: 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan 3004, Philippines",
            "• Direct Phone / Viber: +63 (0949) 775 8239",
            "• Official Email: mcpa.construction@gmail.com",
            "• Operating Hours: Monday – Saturday: 8:00 AM – 5:00 PM PST"
          ]
        }
      ]
    },
    fil: {
      docTitle: "Patakaran sa Privacy at Proteksyon ng Datos",
      docCode: "MCPA-POL-PRIVACY-FIL",
      statutoryBadge: "Batas Republika Blg. 10173 (Data Privacy Act of 2012)",
      subtitle: "Proteksyon ng Personal na Datos, Titulo ng Lupa, at Kumpidensyal na Blueprints alinsunod sa RA 10173",
      sections: [
        {
          number: "1.0",
          title: "Pambungad at Saklaw ng Patakaran",
          body: [
            "Sa MCPA Construction and Supply, lubos kaming nakatuon sa paggalang at pangangalaga sa personal at sensitibong impormasyon ng aming mga kliyente, may-ari ng lupa, nagpaplanong magpagawa ng bahay, at mga bumibisita sa aming mga proyekto. Saklaw ng Patakaran sa Privacy na ito ang lahat ng datos na kinokolekta sa pamamagitan ng aming punong tanggapan sa Plaridel, Bulacan, mga pansamantalang tanggapan sa bawat jobsite, aming opisyal na website, portal ng konsultasyon, at mga digital na channel ng komunikasyon.",
            "Ang aming mga pamamaraan sa paghawak ng datos ay mahigpit na sumusunod sa Batas Republika Blg. 10173, na kilala bilang Data Privacy Act of 2012 (DPA), ang mga Alituntunin at Regulasyong Pampatupad nito (IRR), at lahat ng opisyal na sirkular na inilabas ng National Privacy Commission (NPC) ng Pilipinas.",
            "MAHALAGANG PANGAKO: Kailanman ay hindi nagbebenta, nagpapaupa, o nagbabahagi ang MCPA Construction and Supply ng personal na impormasyon ng kliyente, mga detalye ng titulo ng lupa, o mga planong arkitektural sa sinumang hindi awtorisadong kumpanya para sa komersyal na layunin o marketing."
          ]
        },
        {
          number: "2.0",
          title: "Mga Impormasyong Personal at Pampari-arian na Aming Kinokolekta",
          body: [
            "Upang maayos na mapag-aralan ang pagtatayo, gumawa ng planong arkitektural, mag-asikaso ng permit sa munisipyo, at magproseso ng Build Now, Pay Later (BNPL) financing, kinokolekta namin ang mga sumusunod na impormasyon:",
            "• Pagkakakilanlan at Kontak ng Kliyente: Buong legal na pangalan, estado sibil, pangalan ng asawa, tirahan, email address, numero ng telepono/Viber, at balidong ID ng gobyerno (TIN, SSS, Pasaporte, Lisensya) para sa paghahanda ng kontrata at pagpapanotaryo.",
            "• Titulo ng Lupa at Dokumento ng Ari-arian: Certified True Copy ng Transfer Certificate of Title (TCT) o Original Certificate of Title (OCT), Tax Declaration, Lot Plan, Vicinity Map, at Soil Test Report na kailangan upang kumpirmahin ang pagmamay-ari ng lupa, pagkuha ng Municipal Building Permit (OBO), at pagkalkula ng estruktura.",
            "• Disenyo at Espesipikasyon ng Bahay: Ninanais na sukat ng mga kuwarto, mga materyales na napili, electrical at plumbing specifications, at 3D blueprints na ginawa sa yugto ng pre-construction.",
            "• Rekord sa Pananalapi at Milestone Billing: Resibo ng deposito, kumpirmasyon sa bangko, approval letter mula sa Pag-IBIG (HDMF) o bangko, at patunay ng kita para sa mga sumasailalim sa aming programang BNPL."
          ]
        },
        {
          number: "3.0",
          title: "Layunin at Legal na Batayan ng Pagproseso ng Datos",
          body: [
            "Pinoproseso ng MCPA Construction and Supply ang personal at pampari-ariang datos para lamang sa mga legal na layunin ng operasyon at kontrata:",
            "• Pagsasagawa ng Turnkey Construction: Pagtupad sa mga napagkasunduan sa Kontrata sa Konstruksyon tulad ng pagdidisenyo, paggawa ng structural framing, electrical at plumbing rough-ins, at finishing.",
            "• Pagproseso ng mga Permit sa Munisipyo: Pagsumite ng mga pinirmahan at may selyong blueprints at kalkulasyon sa Office of the Building Official (OBO), BFP, at kinauukulang LGU.",
            "• Pamamahala sa Milestone Billing: Pagkwenta ng tamang disbursement batay sa aktwal na natapos na trabaho sa site nang may kumpletong transparency.",
            "• Pagtupad sa 15-Taong Structural Warranty: Pag-iingat ng mga build logs, batch test ng semento, at mill certificate ng bakal sa loob ng 15 taon alinsunod sa Artikulo 1723 ng Civil Code ng Pilipinas."
          ]
        },
        {
          number: "4.0",
          title: "Awtorisadong Pagbabahagi sa mga Ikatlong Partido",
          body: [
            "Ibinabahagi lamang ng MCPA ang impormasyon sa mga pinagkakatiwalaang ahensya at propesyonal sa opisyal na pangangailangan:",
            "• Tanggapan ng Opisyal ng Gusali (OBO) at LGU: Opisyal na pagsumite ng blueprints, kalkulasyong estruktural, at patunay ng pagmamay-ari ng lupa para sa Building, Electrical, Sanitary, at Occupancy Permits.",
            "• Mga Propesyonal na Arkitekto at Inhenyero: Mga espesyalistang may lisensya ng PRC na kailangang sumuri, magkalkula, pumirma, at maglagay ng dry-seal sa mga plano.",
            "• Mga Kasosyong Bangko at Pag-IBIG Fund: Para sa mga aplikasyon ng kliyente sa loan at pag-release ng pondo para sa bawat yugto ng bahay.",
            "• Logistika at mga Delivery Driver: Address ng jobsite at numero ng tatanggap para sa ligtas na paghahatid ng buhangin, graba, bakal, at semento."
          ]
        },
        {
          number: "5.0",
          title: "Seguridad ng Datos at Panahon ng Pag-iingat",
          body: [
            "• Digital na Imprastraktura: Lahat ng datos at dokumento sa cloud ay protektado ng TLS 1.3 sa pagpapadala at AES-256 encryption sa imbakan.",
            "• Pisikal na Dokumento at Blueprints: Ang mga orihinal na pinirmahan at may selyong plano at notarized contracts ay nakatago sa secure archive sa aming Headquarters sa Plaridel.",
            "• Panahon ng Pag-iingat: Alinsunod sa Artikulo 1723 ng Civil Code ng Pilipinas, ang mga dokumentong may kaugnayan sa estruktura ay iniingatan ng hindi bababa sa labinlimang (15) taon mula sa araw ng pinal na turnover."
          ]
        },
        {
          number: "6.0",
          title: "Mga Karapatan Mo sa Ilalim ng DPA (RA 10173)",
          body: [
            "Bilang kliyente, protektado ka ng lahat ng karapatang nakasaad sa Kabanata VIII ng Data Privacy Act of 2012: Karapatang Malaman (Informed), Karapatang Sumuri (Access), Karapatang Tumutol (Object), Karapatang Magwasto (Rectification), at Karapatang Maghain ng Reklamo sa National Privacy Commission (NPC)."
          ]
        },
        {
          number: "7.0",
          title: "Data Protection Officer at Pakikipag-ugnayan",
          body: [
            "Para sa anumang katanungan ukol sa iyong datos at privacy, makipag-ugnayan sa aming opisyal na DPO:",
            "• Tanggapan: Data Protection Officer, MCPA Construction and Supply",
            "• Punong Tanggapan: 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan 3004, Philippines",
            "• Direct Phone / Viber: +63 (0949) 775 8239",
            "• Opisyal na Email: mcpa.construction@gmail.com",
            "• Oras ng Opisina: Lunes – Sabado: 8:00 AM – 5:00 PM PST"
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 2. TERMS OF ENGAGEMENT
  // =========================================================================
  terms: {
    en: {
      docTitle: "Terms of Engagement & BNPL Guidelines",
      docCode: "MCPA-TERMS-ENGAGEMENT",
      statutoryBadge: "CIAP Doc 102 · Civil Code Art. 1713–1731",
      subtitle: "Contract Conditions, BNPL Milestone Billing Schedule & 15-Year Structural Warranty",
      sections: [
        {
          number: "1.0",
          title: "Contractual Framework & Governing Law",
          body: [
            "These Terms of Engagement constitute the standard contractual conditions governing all residential, commercial, industrial, and renovation projects undertaken by MCPA Construction and Supply (the 'Contractor').",
            "Every project agreement is governed by the Civil Code of the Philippines (Republic Act No. 386), particularly Title VIII, Chapter 3 on 'Work and Labor / Contracts for a Piece of Work' (Articles 1713 through 1731), the National Building Code of the Philippines (Presidential Decree No. 1096), the National Structural Code of the Philippines (NSCP 2015 7th Edition), and the uniform provisions of CIAP Document 102 (Uniform General Conditions of Contract for Private Construction)."
          ]
        },
        {
          number: "2.0",
          title: "Scope of Works & Signed Architectural Plans",
          body: [
            "The Contractor shall execute works strictly according to the approved Project Scope, Bill of Quantities (BOQ), Technical Specifications, and Construction Timetable detailed in the signed Construction Agreement.",
            "• Licensed Signatures: All architectural blueprints, structural calculations, electrical drawings, and sanitary schematics are prepared, signed, and dry-sealed by licensed Filipino professionals (PRC registered Architects and Civil/Structural Engineers) with valid PTR numbers.",
            "• Municipal Permitting: MCPA provides end-to-end guidance and filing assistance for Municipal Building Permits, Electrical Permits, Sanitary Permits, and Fire Safety Evaluation Clearances (FSEC) with local government units across Bulacan and Central Luzon.",
            "• In-House Logistics: Aggregates, hollow blocks, and structural materials supplied directly through MCPA's logistics network meet DPWH specifications and ASTM standards."
          ]
        },
        {
          number: "3.0",
          title: "Build Now, Pay Later (BNPL) & Milestone Billing",
          body: [
            "To provide homeowners with complete peace of mind, MCPA implements a transparent, milestone-based billing schedule under our Build Now, Pay Later (BNPL) program. Clients never advance funds for unverified work. Progress billing corresponds strictly to verified physical site milestones:"
          ],
          table: {
            headers: ["Milestone Stage", "Physical Scope Covered", "Disb. %", "Sign-Off Requirement"],
            colWidths: [22, 44, 12, 22],
            rows: [
              ["Phase 1: Mobilization", "Site layout, temporary facility setup, perimeter enclosure, earthworks & foundation excavation.", "10%", "Site inspection & layout verification."],
              ["Phase 2: Substructure", "Footing tie beams, foundation rebar installation, gravel bed, and concrete pouring.", "20%", "Rebar inspection & cylinder strength test."],
              ["Phase 3: Superstructure", "Reinforced concrete columns, second floor structural slab, roof beams & load-bearing framing.", "25%", "Post-pour structural milestone check."],
              ["Phase 4: Enclosure & Roofing", "Steel roof trusses, insulated roofing sheets, CHB masonry walls, and exterior plastering.", "20%", "Weather-tight enclosure sign-off."],
              ["Phase 5: MEPFS Rough-Ins", "Electrical rough-in conduits, plumbing supply & drainage pipes, ceiling drywall framing.", "15%", "Water leak & electrical continuity test."],
              ["Phase 6: Turnkey Handover", "Floor tiles, painting, doors, windows, sanitary fixtures, punchlisting & Certificate of Turnover.", "10%", "Client joint inspection & Certificate of Acceptance."]
            ]
          }
        },
        {
          number: "4.0",
          title: "Variations, Modifications & Change Orders",
          body: [
            "Any alteration, addition, or deduction from the approved plans requested by the Owner after contract execution must be submitted in writing using MCPA's formal Change Order Form (COF).",
            "• Prior Written Approval: No variation work shall begin on the jobsite without mutual written agreement specifying the exact adjustment in cost and project timeline.",
            "• Cost Calculation: Added materials and labor are computed strictly based on actual bill-of-quantities (BOQ) rates without arbitrary surcharges."
          ]
        },
        {
          number: "5.0",
          title: "15-Year Structural Warranty & Handover (Civil Code Art. 1723)",
          body: [
            "In strict compliance with Article 1723 of the Civil Code of the Philippines (Republic Act No. 386) and Philippine building standards, MCPA Construction and Supply provides an explicit Fifteen (15) Year Structural Warranty on all complete turnkey residential homes and commercial buildings, commencing from the date of final turnover and execution of the Certificate of Acceptance.",
            "STATUTORY LIABILITY UNDER ARTICLE 1723: The licensed architect and civil/structural engineer who drafted and signed & sealed the plans, along with the contractor (MCPA Construction and Supply), hold statutory liability for fifteen (15) years from completion for collapse or structural defects resulting from defects in plans, ground defects, or inferior construction quality. Acceptance of the building does not waive this statutory cause of action under Philippine law.",
            "• 15-Year Warranty Coverage: Structural foundation integrity (footings, grade beams, tie beams, retaining structures), load-bearing reinforced concrete columns, shear walls, suspended slabs, and structural roof trusses against deflection.",
            "• 1-Year Architectural Finishes Warranty: Architectural fixtures, waterproofing, plumbing fittings, and paint finishes carry a standard one (1) year workmanship warranty.",
            "• Warranty Exclusions: Acts of God beyond engineering design thresholds (severe earthquakes exceeding design seismic zone specs, volcanic eruptions, soil liquefaction resulting from unauthorized adjacent excavation by third parties), unauthorized post-turnover structural demolitions, or unapproved third-party structural additions."
          ]
        },
        {
          number: "6.0",
          title: "Dispute Resolution & Arbitration",
          body: [
            "In the event of any disagreement or dispute arising out of or in connection with the construction contract, both parties agree to first exhaust amicable discussions in good faith within thirty (30) days from written notice.",
            "Failing amicable settlement, the dispute shall be submitted to voluntary arbitration before the Construction Industry Arbitration Commission (CIAC) in the Philippines pursuant to Executive Order No. 1008, whose decision shall be final and legally binding."
          ]
        }
      ]
    },
    fil: {
      docTitle: "Pamantayan sa Kasunduan at Structural Warranty",
      docCode: "MCPA-TERMS-ENGAGEMENT-FIL",
      statutoryBadge: "CIAP Doc 102 · Civil Code Art. 1713–1731",
      subtitle: "Mga Tuntunin sa Kontrata, BNPL Milestone Billing, at Labinlimang Taong (15-Year) Structural Warranty",
      sections: [
        {
          number: "1.0",
          title: "Balangkas ng Kontrata at Batas na Sumasaklaw",
          body: [
            "Ang Kasunduan sa Serbisyo na ito ang pangkalahatang alituntuning sumasaklaw sa lahat ng residential, commercial, industrial, at renovation projects na isinasagawa ng MCPA Construction and Supply (ang 'Kontratista').",
            "Bawat kasunduan ay pinamamahalaan ng Civil Code ng Pilipinas (Batas Republika Blg. 386), partikular ang Title VIII, Chapter 3 ukol sa 'Work and Labor / Contracts for a Piece of Work' (Artikulo 1713 hanggang 1731), ang National Building Code ng Pilipinas (Presidential Decree No. 1096), ang National Structural Code of the Philippines (NSCP 2015 7th Edition), at ang mga pamantayan ng CIAP Document 102 (Uniform General Conditions of Contract for Private Construction)."
          ]
        },
        {
          number: "2.0",
          title: "Saklaw ng Trabaho at Propesyonal na Plano",
          body: [
            "Isasagawa ng Kontratista ang lahat ng trabaho alinsunod sa naaprubahang Saklaw ng Proyekto, Bill of Quantities (BOQ), Technical Specifications, at Iskedyul ng Konstruksyon na nakasaad sa nilagdaang Kontrata sa Konstruksyon.",
            "• Pirma at Selyo ng Lisensyadong Propesyonal: Lahat ng blueprints sa arkitektura, kalkulasyong estruktural, electrical plans, at sanitary schematics ay nilagdaan at may dry-seal ng mga lisensyadong Pilipinong Arkitekto at Civil/Structural Engineers na may aktibong PRC at PTR numbers.",
            "• Permit sa Munisipyo: Nagbibigay ang MCPA ng buong tulong sa pagproseso ng Municipal Building Permit, Electrical Permit, Sanitary Permit, at Fire Safety Evaluation Clearance (FSEC) sa mga LGU sa buong Bulacan at Gitnang Luzon.",
            "• Sariling Suplay ng Materyales: Ang mga buhangin, graba, hollow blocks, at bakal na direktang inihahatid sa pamamagitan ng MCPA in-house logistics ay pumapasa sa pamantayan ng DPWH at ASTM."
          ]
        },
        {
          number: "3.0",
          title: "Build Now, Pay Later (BNPL) at Milestone Billing",
          body: [
            "Upang masiguro ang kapayapaan ng isip ng bawat may-ari ng bahay, nagpapatupad ang MCPA ng malinaw na bayaran batay sa natapos na yugto (milestone-based billing). Sa ilalim ng aming programang Build Now, Pay Later (BNPL) para sa mga may tituladong lote, hindi nagbabayad nang maaga ang kliyente sa trabahong hindi pa nasusuri. Ang bawat disbursement ay katumbas ng aktwal na natapos na yugto ng bahay:"
          ],
          table: {
            headers: ["Yugto ng Proyekto", "Aktwal na Saklaw ng Trabaho", "Bahagdan (%)", "Kailangan sa Pag-apruba"],
            colWidths: [22, 44, 12, 22],
            rows: [
              ["Yugto 1: Mobilisasyon", "Site layout, bakod ng site, barracks ng trabahador, at paghuhukay sa pundasyon.", "10%", "Inspeksyon sa layout at sukat ng lote."],
              ["Yugto 2: Substructure", "Footing tie beams, bakal ng pundasyon, gravel bed, at pagbubuhos ng semento.", "20%", "Pagsusuri sa rebar at concrete cylinder test."],
              ["Yugto 3: Superstructure", "Poste, structural beam sa ikalawang palapag, suspended slab, at roof beam.", "25%", "Inspeksyon pagkabuhos ng structural framing."],
              ["Yugto 4: Bubong at Pader", "Steel roof trusses, insulated roofing sheets, pader na CHB, at exterior plastering.", "20%", "Sign-off sa weather-tight enclosure."],
              ["Yugto 5: MEPFS Rough-Ins", "Tubo ng kuryente at tubig, sanitary pipes sa banyo, at kisame drywall framing.", "15%", "Water leak test at electrical continuity test."],
              ["Yugto 6: Turnkey Handover", "Tiles, pintura, pinto, bintana, lababo, gripo, punchlisting, at susi ng bahay.", "10%", "Joint inspection at Certificate of Acceptance."]
            ]
          }
        },
        {
          number: "4.0",
          title: "Pagbabago sa Disenyo at Change Orders",
          body: [
            "Anumang pagbabago, dagdag, o bawas sa naaprubahang plano na hihilingin ng may-ari pagkatapos malagdaan ang kontrata ay kailangang isumite nang nakasulat gamit ang opisyal na Change Order Form (COF) ng MCPA.",
            "• Pahintulot Bago Simulan: Hindi sisimulan ang anumang binagong trabaho sa jobsite nang walang nakasulat na kasunduan sa eksaktong dagdag o bawas sa presyo at pagsasaayos sa iskedyul.",
            "• Kalkulasyon ng Gastos: Ang halaga ng dagdag na materyales at labor ay kinakalkula batay sa aktwal na bill-of-quantities (BOQ) rates nang walang di-makatwirang patong."
          ]
        },
        {
          number: "5.0",
          title: "Labinlimang Taong (15-Year) Structural Warranty at Handover (Artikulo 1723 ng Civil Code)",
          body: [
            "Alinsunod sa Artikulo 1723 ng Civil Code ng Pilipinas (Republic Act Blg. 386) at mga pambansang pamantayan sa gusali, nagkakaloob ang MCPA Construction and Supply ng komprehensibong Labinlimang Taong (15-Year) Structural Warranty sa lahat ng turnkey residential homes at commercial buildings, simula sa araw ng pinal na turnover at paglagda sa Certificate of Acceptance.",
            "PANANAGUTAN SA ILALIM NG ARTIKULO 1723: Sa ilalim ng Artikulo 1723, ang lisensyadong arkitekto at inhinyero katuwang ang kontratista (MCPA) ay may legal na pananagutan sa loob ng 15 taon laban sa pagbagsak o depekto sa estruktura dulot ng depekto sa plano, lupa, o materyales. Ang pagtanggap sa gusali sa turnover ay hindi nagpapawalang-bisa sa proteksyong ito sa ilalim ng batas.",
            "• Saklaw ng 15-Taong Structural Warranty: Katatagan ng pundasyon (footings, grade beams, tie beams, retaining walls), mga poste (reinforced concrete columns), shear walls, suspended slabs, at steel roof trusses laban sa paglaylay.",
            "• 1-Taong Warranty sa Finishes: May hiwalay na isang (1) taong warranty para sa workmanship ng mga architectural finishes at fixtures (tiles, fittings, pintura, at plumbing fixtures).",
            "• Hindi Saklaw ng Warranty: Kalamidad o Acts of God na lagpas sa seismic threshold, hindi awtorisadong pagtibag sa mga poste pagkatapos ng turnover, o hindi awtorisadong pagpapatong ng dagdag na palapag ng ibang kontratista."
          ]
        },
        {
          number: "6.0",
          title: "Pangangasiwa ng Hindi Pagkakaunawaan",
          body: [
            "Sakaling magkaroon ng hindi pagkakaunawaan o alitan kaugnay ng kontrata, kapwa sumasang-ayon ang dalawang panig na unahing lutasin ito sa pamamagitan ng tapat at maayos na negosasyon (amicable settlement) sa loob ng tatlumpung (30) araw.",
            "Kung hindi magkasundo, isusumite ang usapin para sa voluntary arbitration sa Construction Industry Arbitration Commission (CIAC) ng Pilipinas alinsunod sa Executive Order No. 1008, na ang desisyon ay pinal at may bisa sa ilalim ng batas."
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 3. SAFETY CODE & SITE STANDARDS
  // =========================================================================
  safety: {
    en: {
      docTitle: "Occupational Safety Code & Site Standards",
      docCode: "MCPA-CODE-SAFETY",
      statutoryBadge: "DOLE D.O. 13-98 · Republic Act 11058",
      subtitle: "Occupational Safety, DOLE OSHS Compliance, Mandatory PPE & Jobsite Protocols",
      sections: [
        {
          number: "1.0",
          title: "Health, Safety & Environment (HSE) Policy",
          body: [
            "MCPA Construction and Supply upholds a strict Zero-Harm safety commitment across all active jobsites in Bulacan, Metro Manila, and Central Luzon. We consider human safety, worker health, and public protection paramount above all project operational milestones.",
            "Our site safety protocols comply fully with Department of Labor and Employment (DOLE) Department Order No. 13, Series of 1998 (DO 13-98), Guidelines Governing Occupational Safety and Health in the Construction Industry, and Republic Act No. 11058 (OSH Standards).",
            "KEY COMMITMENT: Every individual MCPA construction site operates under a comprehensive, project-specific Construction Safety and Health Program (CSHP) reviewed and approved by DOLE prior to physical mobilization."
          ]
        },
        {
          number: "2.0",
          title: "Mandatory Personal Protective Equipment (PPE)",
          body: [
            "MCPA enforces a strict 'No PPE, No Entry' rule. All workers, engineers, subcontractor personnel, and authorized project visitors must wear standard-compliant protective gear before crossing the jobsite perimeter:"
          ],
          table: {
            headers: ["Equipment Type", "Compliance Standard", "Site Specification"],
            colWidths: [26, 32, 42],
            rows: [
              ["Safety Hard Hats", "ANSI Z89.1 / OSHS Type I, Class E & G", "Color-coded: Yellow (Carpenters/Masons), White (Engineers), Blue (Electricians), Red (Safety Officers), Green (Clients/Visitors)."],
              ["Safety Footwear", "ASTM F2413 / EN ISO 20345 (Steel Toe)", "Steel-toe, puncture-resistant steel midsole boots to prevent rebar puncture and crushing injuries."],
              ["High-Visibility Vests", "ANSI/ISEA 107 Class 2 Reflective", "Neon orange or lime green reflective vests worn at all times, especially during heavy logistics delivery."],
              ["Fall Arrest Harnesses", "ANSI Z359.11 Full-Body Double Lanyard", "Mandatory for any work elevated 2.0 meters (6 feet) or higher on scaffolding, roof beams, and floor edges."],
              ["Eye & Face Protection", "ANSI Z87.1 High-Impact Polycarbonate", "Safety goggles for grinding/chipping and DIN 10–12 shade welding shields for rebar welding."]
            ]
          }
        },
        {
          number: "3.0",
          title: "Scaffolding, Formworks & Fall Protection",
          body: [
            "Working at heights presents high operational risks in multi-storey residential and commercial building construction. MCPA enforces the following safety controls:",
            "• TESDA-Certified Scaffolders: All tubular steel frame scaffoldings must be erected, modified, and dismantled exclusively by certified scaffold erectors.",
            "• Daily Tagging System: Every scaffold tower is inspected daily by the Site Safety Officer before shift start, marked with a visible GREEN (Safe), YELLOW (Under Modification), or RED (Do Not Use) tag.",
            "• Pre-Pour Formwork Audit: Formworks, shoring jacks, and falsework undergo rigid inspection for structural plumbness, bracing, and load capacity prior to concrete pouring.",
            "• Rebar Impalement Protection: All vertically protruding steel reinforcement bars (rebars) are capped with bright orange protective mushroom caps to eliminate puncture hazards."
          ]
        },
        {
          number: "4.0",
          title: "Heavy Equipment & Public Traffic Safety",
          body: [
            "Because MCPA operates in-house logistics delivering aggregates, ready-mix concrete, and structural steel throughout Bulacan and Metro Manila, strict public road and equipment protocols are maintained:",
            "• Trained Signalmen / Flagmen: Certified flagmen equipped with high-visibility flags, safety batons, and warning whistles manage all truck ingress and egress along public roads.",
            "• Heavy Equipment Operator Certification: All operators of boom trucks, mobile cranes, backhoes, and concrete vibrators hold valid TESDA National Certificates (NC II) and DOLE accreditation.",
            "• Perimeter Barricades: Jobsite perimeters are fully enclosed with rigid safety barricades and warning signage to prevent unauthorized public entry."
          ]
        },
        {
          number: "5.0",
          title: "Emergency Preparedness & Weather Contingency",
          body: [
            "Every MCPA jobsite maintains an active Emergency Response Plan (ERP) coordinated with local disaster management and rescue offices:",
            "• Typhoon & Weather Protocol: Automatic suspension of height and crane operations upon PAGASA Tropical Cyclone Wind Signal (TCWS) No. 2. All loose materials and formworks secured immediately.",
            "• Certified First-Aid Stations: Each jobsite is equipped with an industrial first-aid station and a Philippine Red Cross-trained first aider present throughout working hours.",
            "• Fire Safety & Hot Work Permits: Operating dry chemical ABC fire extinguishers stationed within 10 meters of any welding or cutting area. Formal Hot Work Permit required prior to torch cutting.",
            "• Local Emergency Links: Direct hotline integration with Plaridel Emergency Rescue, Bulacan Provincial PDRRMC, and Bureau of Fire Protection (BFP) stations."
          ]
        },
        {
          number: "6.0",
          title: "Inspections, Audits & Incident Reporting",
          body: [
            "Our safety officers conduct unannounced site audits weekly. Any worker or subcontractor caught violating mandatory safety protocols faces disciplinary action, retraining, or removal from the site.",
            "To report safety observations or request copies of our DOLE-approved Construction Safety and Health Program (CSHP) for your project, contact the MCPA Safety Directorate at mcpa.construction@gmail.com."
          ]
        }
      ]
    },
    fil: {
      docTitle: "Kodigo sa Kaligtasan at Pamantayan sa Jobsite",
      docCode: "MCPA-CODE-SAFETY-FIL",
      statutoryBadge: "DOLE D.O. 13-98 · Batas Republika 11058",
      subtitle: "Pamantayan sa Kaligtasan sa Trabaho, DOLE OSHS Compliance, at mga Patakaran sa Konstruksyon",
      sections: [
        {
          number: "1.0",
          title: "Patakaran sa Kaligtasan at Zero-Harm",
          body: [
            "Ang MCPA Construction and Supply ay mahigpit na nagpapatupad ng panuntunang Zero-Harm sa lahat ng aming aktibong proyekto sa Bulacan, Metro Manila, at Gitnang Luzon. Para sa amin, ang buhay at kaligtasan ng mga manggagawa, inhenyero, at ng publiko ang pinakamahalaga sa lahat.",
            "Lahat ng patakaran sa site ay sumusunod sa Department of Labor and Employment (DOLE) Department Order No. 13, Series of 1998 (DO 13-98) ukol sa Occupational Safety and Health in the Construction Industry, at sa Batas Republika Blg. 11058 (OSH Standards).",
            "MAHALAGANG PANGAKO: Bawat indibidwal na proyekto ng MCPA ay may opisyal na Construction Safety and Health Program (CSHP) na dumaan sa pagsusuri at aprubado ng DOLE bago magsimula ang aktwal na konstruksyon sa site."
          ]
        },
        {
          number: "2.0",
          title: "Mandatory Personal Protective Equipment (PPE)",
          body: [
            "Ipinatutupad ng MCPA ang mahigpit na patakarang 'Walang PPE, Bawal Pumasok' (No PPE, No Entry). Lahat ng manggagawa, inhenyero, bisita, at may-ari ng bahay ay kailangang magsuot ng tamang safety gear bago pumasok sa bakod ng konstruksyon:"
          ],
          table: {
            headers: ["Uri ng Kagamitan", "Pamantayan sa Kaligtasan", "Patakaran at Kulay sa Site"],
            colWidths: [26, 32, 42],
            rows: [
              ["Safety Hard Hat", "ANSI Z89.1 / OSHS Type I, Class E & G", "May Color Code: Dilaw (Karpintero/Mason), Puti (Inhenyero), Asul (Elektrisyan), Pula (Safety Officer), Berde (Kliyente/Bisita)."],
              ["Safety Shoes (Bakal ang Nguso)", "ASTM F2413 / EN ISO 20345 (Steel Toe)", "Sapatos na may bakal sa unahan at puncture-resistant steel midsole upang maiwasan ang tusok ng bakal o pako."],
              ["Reflective Safety Vest", "ANSI/ISEA 107 Class 2 Reflective", "Maliwanag na neon orange o lime green vest na may reflective strips para madaling makita sa delivery ng materyales."],
              ["Fall Arrest Safety Harness", "ANSI Z359.11 Full-Body Double Lanyard", "Sapilitan para sa sinumang gumagawa sa taas na 2.0 metro (6 feet) pataas sa plantsa (scaffolding) o bubong."],
              ["Proteksyon sa Mata at Mukha", "ANSI Z87.1 High-Impact Polycarbonate", "Safety goggles para sa pagkakaltas/grinding at welding mask para sa pagwewelding ng mga bakal."]
            ]
          }
        },
        {
          number: "3.0",
          title: "Scaffolding, Formworks, at Fall Protection",
          body: [
            "Ang pagtatrabaho sa mataas na bahagi ng bahay o gusali ay may kaakibat na panganib, kaya ipinatutupad namin ang mga sumusunod na pag-iingat:",
            "• TESDA-Certified Scaffolders: Ang mga tubular steel frame scaffolding ay itinatayo, binabago, at binabaklas lamang ng mga sertipikadong erectors.",
            "• Pang-araw-araw na Tagging: Bawat plantsa ay sinusuri tuwing umaga ng Safety Officer bago simulan ang trabaho gamit ang BERDE (Ligtas Gamitin), DILAW (Kasalukuyang Inaayos), o PULA (Bawal Gamitin).",
            "• Inspeksyon Bago Magbuhos: Sinusuri ang plumbness, suporta, at shoring jacks ng formworks bago magbuhos ng semento sa mga poste at slab.",
            "• Proteksyon sa Nakatayong Bakal (Rebar Caps): Lahat ng nakatayong bakal (rebars) ay nilalagyan ng kulay kahel na safety mushroom caps upang maiwasan ang malubhang pinsala."
          ]
        },
        {
          number: "4.0",
          title: "Makinarya, Logistika, at Kaligtasan sa Kalsada",
          body: [
            "Dahil ang MCPA ay may sariling armada ng delivery trucks para sa buhangin, graba, ready-mix concrete, at bakal sa buong Bulacan at Metro Manila, mahigpit ang aming patakaran sa trapiko at kagamitan:",
            "• Mga Sinanay na Flagmen: May mga sertipikadong signalmen na may hawak na warning flags, safety batons, at pito upang ligtas na gabayan ang pagpasok at paglabas ng mga trak sa mga pampublikong kalsada.",
            "• Sertipikadong Operator: Ang mga nagpapatakbo ng boom truck, crane, backhoe, at concrete vibrator ay may hawak na balidong TESDA National Certificate (NC II) at DOLE accreditation.",
            "• Harang sa Paligid: Naka-barricade ang paligid ng proyekto na may karatulang 'Banta: May Konstruksyon sa Loob' upang maiwasan ang pagpasok ng mga hindi awtorisadong tao."
          ]
        },
        {
          number: "5.0",
          title: "Paghahanda sa Sakuna at Emergency Protocol",
          body: [
            "Ang bawat jobsite ng MCPA ay may nakalatag na Emergency Response Plan (ERP) na nakikipag-ugnayan sa mga lokal na ahensya ng kalamidad at pagsaklolo:",
            "• Patakaran sa Bagyo at Panahon: Awtomatikong ititigil ang trabaho sa itaas at pagpapatakbo ng crane sa oras na magtaas ang PAGASA ng Tropical Cyclone Wind Signal (TCWS) No. 2 o higit pa. Agad na itatali at seselyuhan ang lahat ng maluwag na materyales.",
            "• First-Aid Station sa Site: Bawat site ay may kompletong first-aid kit at may sinanay na First Aider (Philippine Red Cross certified) na nakabantay sa oras ng trabaho.",
            "• Fire Safety at Hot Work Permit: May nakahandang ABC dry chemical fire extinguishers na hindi lalayo sa 10 metro mula sa anumang lugar kung saan nagpuputol o nagwewelding. May pormal na permit bago simulan ang welding.",
            "• Direktang Linya sa Saklolo: Direktang nakakonekta sa Plaridel Emergency Rescue, Bulacan Provincial Disaster Risk Reduction and Management Office (PDRRMC), at Bureau of Fire Protection (BFP)."
          ]
        },
        {
          number: "6.0",
          title: "Inspeksyon at Pagpapatupad ng Kaligtasan",
          body: [
            "Nagsasagawa ang aming mga safety officers ng regular at biglaang inspeksyon sa site linggu-linggo. Sinumang manggagawa o subcontractor na lumalabag sa mga pamantayan sa kaligtasan ay sumasailalim sa kaukulang aksyong pandisiplina o pag-aalis sa site.",
            "Upang mag-ulat ng anumang obserbasyon sa kaligtasan o humingi ng kopya ng naaprubahang DOLE Construction Safety and Health Program (CSHP) para sa inyong proyekto, sumulat sa MCPA Safety Directorate sa mcpa.construction@gmail.com."
          ]
        }
      ]
    }
  }
};

/**
 * Generates an official, certified corporate PDF buffer
 * @param {string} docType - 'privacy' | 'terms' | 'safety'
 * @param {string} lang - 'en' | 'fil'
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
function generateLegalPdf(docType = "privacy", lang = "en") {
  return new Promise((resolve, reject) => {
    const activeDocType = LEGAL_DOCS_DATA[docType] ? docType : "privacy";
    const activeLang = lang === "fil" ? "fil" : "en";
    const data = LEGAL_DOCS_DATA[activeDocType][activeLang];
    const currentYear = new Date().getFullYear();

    // Auto filename matching official standard
    let baseName = "MCPA_Corporate_Document";
    if (activeDocType === "privacy")  baseName = activeLang === "fil" ? "MCPA_Patakaran_sa_Privacy" : "MCPA_Privacy_Policy";
    else if (activeDocType === "terms")  baseName = activeLang === "fil" ? "MCPA_Kasunduan_sa_Serbisyo" : "MCPA_Terms_of_Engagement";
    else if (activeDocType === "safety") baseName = activeLang === "fil" ? "MCPA_Kodigo_sa_Kaligtasan" : "MCPA_Safety_Code";
    const filename = `${baseName}_${currentYear}.pdf`;

    // ── Document Layout Constants (A4 Paper & 1.5 cm Margins) ──────────────────
    // A4: 210mm x 297mm = 595.28pt x 841.89pt
    // 1.5 cm = (1.5 / 2.54) * 72 = 42.52 pt
    const PAGE_W = 595.28, PAGE_H = 841.89;
    const ML = 42.52, MR = 42.52, MT = 42.52, MB = 42.52;
    const CW = PAGE_W - ML - MR;            // 510.24 pt content width
    const FOOTER_Y = PAGE_H - MB + 14;      // 813.37 pt footer baseline
    const BODY_BOTTOM = PAGE_H - MB - 10;   // 789.37 pt max body y before page break

    // ── Formal Monochrome & Grayscale Corporate Palette ────────────────────────
    const BLACK       = "#0A0A0A"; // Deepest crisp black for headings and primary titles
    const CHARCOAL    = "#1F2937"; // Strong charcoal for tables, badges and section rules
    const BODY_TEXT   = "#262626"; // High-contrast, crystal-clear body copy
    const MUTED_TEXT  = "#525252"; // Supporting metadata, subtitles, and labels
    const LIGHT_TEXT  = "#737373"; // Captions, running headers, and page numbers
    const BORDER_DARK = "#171717"; // Formal divider rules and double lines
    const BORDER_MID  = "#737373"; // Box borders and table headers
    const BORDER_LGT  = "#E5E5E5"; // Table cell dividers and subtle grid lines
    const BG_TINT     = "#F5F5F5"; // Subtle background fill for tables, callouts, and boxes
    const BG_WHITE    = "#FFFFFF";

    const logoPath = path.resolve(__dirname, "../../../frontend/public/assets/mcpa-logo.png");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MT, bottom: MB, left: ML, right: MR },
      bufferPages: true,
      info: {
        Title: `${data.docTitle} - MCPA Construction and Supply`,
        Author: "MCPA Construction and Supply",
        Subject: data.subtitle,
        Creator: "MCPA Corporate Legal & Compliance Directorate",
      },
    });

    // ── Register True Arial Font (with standard Helvetica fallback) ───────────
    const hasArial = fs.existsSync("C:/Windows/Fonts/arial.ttf") && fs.existsSync("C:/Windows/Fonts/arialbd.ttf");
    if (hasArial) {
      doc.registerFont("Arial", "C:/Windows/Fonts/arial.ttf");
      doc.registerFont("Arial-Bold", "C:/Windows/Fonts/arialbd.ttf");
      if (fs.existsSync("C:/Windows/Fonts/ariali.ttf")) {
        doc.registerFont("Arial-Italic", "C:/Windows/Fonts/ariali.ttf");
      }
    }
    const FONT_REG = hasArial ? "Arial" : "Helvetica";
    const FONT_BOLD = hasArial ? "Arial-Bold" : "Helvetica-Bold";
    const FONT_ITALIC = (hasArial && fs.existsSync("C:/Windows/Fonts/ariali.ttf")) ? "Arial-Italic" : "Helvetica-Oblique";

    const buffers = [];
    doc.on("data", (c) => buffers.push(c));
    doc.on("end",  () => resolve({ buffer: Buffer.concat(buffers), filename }));
    doc.on("error", reject);

    // ── Helper Functions ───────────────────────────────────────────────────────

    /**
     * Draw the formal corporate letterhead (Page 1)
     * Strictly styled like an official Philippine corporate legal instrument
     */
    function drawLetterhead() {
      const startY = MT - 10; // Y ~ 32.5

      // Top formal double rule across full content width
      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(1.5)
        .moveTo(ML, startY).lineTo(ML + CW, startY).stroke()
        .strokeColor(BORDER_DARK).lineWidth(0.5)
        .moveTo(ML, startY + 2.5).lineTo(ML + CW, startY + 2.5).stroke()
        .restore();

      const mastheadY = startY + 8;

      // 1. TOP-LEFT LOGO (Clean rendering of official system logo)
      let logoRenderW = 0;
      try {
        if (fs.existsSync(logoPath)) {
          const logoBuf = fs.readFileSync(logoPath);
          doc.image(logoBuf, ML, mastheadY + 1, { width: 80 });
          logoRenderW = 90;
        }
      } catch (_) { /* fallback if logo missing */ }

      // Vertical subtle divider after logo
      const divX = ML + logoRenderW;
      doc.save()
        .strokeColor(BORDER_LGT).lineWidth(0.75)
        .moveTo(divX, mastheadY + 2)
        .lineTo(divX, mastheadY + 38)
        .stroke().restore();

      // 2. COMPANY IDENTITY BLOCK (Beside the logo)
      const textX = divX + 10;

      doc.font(FONT_BOLD).fontSize(12).fillColor(BLACK)
        .text("MCPA CONSTRUCTION AND SUPPLY", textX, mastheadY + 2, { lineBreak: false });

      doc.font(FONT_BOLD).fontSize(7).fillColor(CHARCOAL)
        .text("GENERAL ENGINEERING & BUILDING CONTRACTOR", textX, mastheadY + 16, { lineBreak: false });

      doc.font(FONT_REG).fontSize(6.5).fillColor(MUTED_TEXT)
        .text("Headquarters: 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan 3004, Philippines", textX, mastheadY + 25, { lineBreak: false })
        .text("National Hotline / Viber: +63 (0949) 775 8239   |   Email: mcpa.construction@gmail.com", textX, mastheadY + 33, { lineBreak: false });

      // 3. FORMAL DOCUMENT CONTROL BOX (Top Right)
      const ctrlW = 160;
      const ctrlX = ML + CW - ctrlW;
      const ctrlH = 39;

      doc.save()
        .rect(ctrlX, mastheadY - 1, ctrlW, ctrlH)
        .fillColor(BG_TINT).fill()
        .strokeColor(BORDER_DARK).lineWidth(0.75)
        .rect(ctrlX, mastheadY - 1, ctrlW, ctrlH).stroke()
        .restore();

      const padX = ctrlX + 5;
      doc.font(FONT_BOLD).fontSize(6).fillColor(BLACK)
        .text("OFFICIAL LEGAL & COMPLIANCE INSTRUMENT", padX, mastheadY + 2, { width: ctrlW - 10, align: "center" });

      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(0.5)
        .moveTo(ctrlX, mastheadY + 11).lineTo(ctrlX + ctrlW, mastheadY + 11).stroke()
        .restore();

      doc.font(FONT_BOLD).fontSize(6).fillColor(CHARCOAL)
        .text("DOC CODE: ", padX, mastheadY + 14, { lineBreak: false });
      doc.font("Courier-Bold").fontSize(6.5).fillColor(BLACK)
        .text(data.docCode || "MCPA-LEG-DOC", doc.x, mastheadY + 14);

      doc.font(FONT_BOLD).fontSize(6).fillColor(CHARCOAL)
        .text("EFFECTIVITY: ", padX, mastheadY + 22, { lineBreak: false });
      doc.font(FONT_REG).fontSize(6).fillColor(BLACK)
        .text(`Calendar Year ${currentYear} (Certified)`, doc.x, mastheadY + 22);

      doc.font(FONT_BOLD).fontSize(6).fillColor(CHARCOAL)
        .text("JURISDICTION: ", padX, mastheadY + 30, { lineBreak: false });
      doc.font(FONT_REG).fontSize(6).fillColor(BLACK)
        .text("Republic of the Philippines", doc.x, mastheadY + 30);

      // Bottom masthead divider double rule
      const divY = mastheadY + 45;
      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(1.25)
        .moveTo(ML, divY).lineTo(ML + CW, divY).stroke()
        .strokeColor(BORDER_DARK).lineWidth(0.5)
        .moveTo(ML, divY + 2.5).lineTo(ML + CW, divY + 2.5).stroke()
        .restore();

      doc.y = divY + 9;
    }

    /** Title & Statutory Instrument strip */
    function drawTitleBlock() {
      const curY = doc.y;

      // Formal centered Document Title
      doc.font(FONT_BOLD).fontSize(15).fillColor(BLACK)
        .text(data.docTitle.toUpperCase(), ML, curY, { width: CW, align: "center", lineGap: 3 });

      doc.font(FONT_ITALIC).fontSize(10).fillColor(MUTED_TEXT)
        .text(data.subtitle, ML, doc.y + 2, { width: CW, align: "center", lineGap: 2 });

      // Statutory Authority outlined badge (centered formal box with 0.5pt border)
      const badgeText = `STATUTORY AUTHORITY: ${data.statutoryBadge.toUpperCase()}`;
      const badgeW = doc.font(FONT_BOLD).fontSize(7.5).widthOfString(badgeText) + 18;
      const badgeX = ML + (CW - badgeW) / 2;
      const badgeY = doc.y + 6;

      doc.save()
        .rect(badgeX, badgeY, badgeW, 15)
        .fillColor(BG_TINT).fill()
        .strokeColor(BORDER_MID).lineWidth(0.5)
        .rect(badgeX, badgeY, badgeW, 15).stroke()
        .restore();

      doc.font(FONT_BOLD).fontSize(7).fillColor(BLACK)
        .text(badgeText, badgeX, badgeY + 4, { width: badgeW, align: "center" });

      // Formal Corporate Recital statement (12pt / 1.5 line spacing compliant)
      const recitalY = badgeY + 22;
      const recitalText = activeLang === "fil"
        ? "SA KAPANGYARIHAN NG MGA NAKALAGDA: Ang MCPA Construction and Supply, isang rehistradong pangkalahatang kontratista sa inhenyeriya at konstruksyon sa ilalim ng mga batas ng Republika ng Pilipinas, ay opisyal na nagpapatupad at nagpapatibay sa legal na instrumentong ito upang pangasiwaan ang lahat ng kasunduan, pamantayan sa kaligtasan, at pananagutan sa ilalim ng batas."
        : "KNOW ALL MEN BY THESE PRESENTS: MCPA Construction and Supply, an authorized general engineering contractor operating under the laws of the Republic of the Philippines, hereby officially promulgates and certifies this legal compliance instrument governing all corporate operations, client agreements, construction contracts, and statutory guarantees.";

      doc.font(FONT_ITALIC).fontSize(9.5).fillColor(MUTED_TEXT)
        .text(recitalText, ML + 6, recitalY, { width: CW - 12, align: "justify", lineGap: 4, indent: 24 });

      doc.y = doc.y + 8;
    }

    /** Slim header for continuation pages */
    function drawContinuationHeader() {
      const hY = MT - 12;

      let contLogoW = 0;
      try {
        if (fs.existsSync(logoPath)) {
          const buf = fs.readFileSync(logoPath);
          doc.image(buf, ML, hY - 2, { width: 44 });
          contLogoW = 50;
        }
      } catch (_) {}

      // Left: Company Name + Document Code
      doc.font(FONT_BOLD).fontSize(8).fillColor(BLACK)
        .text("MCPA CONSTRUCTION AND SUPPLY", ML + contLogoW, hY + 1, { lineBreak: false });

      doc.font(FONT_REG).fontSize(7).fillColor(MUTED_TEXT)
        .text(`  |  ${data.docCode || "MCPA-LEG-DOC"}`, doc.x, hY + 1.5, { lineBreak: false });

      // Right: Clean official document label
      doc.font(FONT_BOLD).fontSize(6.5).fillColor(CHARCOAL)
        .text("OFFICIAL LEGAL INSTRUMENT", ML, hY + 1.5, { width: CW, align: "right", lineBreak: false });

      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(0.75)
        .moveTo(ML, hY + 15).lineTo(ML + CW, hY + 15).stroke()
        .restore();

      doc.y = hY + 24;
    }

    /** Ensure space on the page before rendering an element */
    function ensureSpace(needed = 35) {
      if (doc.y + needed > BODY_BOTTOM) {
        doc.addPage();
        drawContinuationHeader();
      }
    }

    /** Draw official formal table */
    function drawTable(tableData) {
      const { headers, rows, colWidths } = tableData;
      const tableW = CW;
      const actualWidths = colWidths.map((w) => (w / 100) * tableW);
      const rowPad = 5;
      const headerFontSize = 9.5;
      const bodyFontSize = 9;

      // 1. Measure header height
      let maxHeaderH = 18;
      headers.forEach((h, i) => {
        doc.font(FONT_BOLD).fontSize(headerFontSize);
        const textH = doc.heightOfString(h, { width: actualWidths[i] - 10 });
        if (textH + rowPad * 2 > maxHeaderH) maxHeaderH = textH + rowPad * 2;
      });

      ensureSpace(maxHeaderH + 24);
      const hY = doc.y;

      // Draw formal charcoal header background
      doc.save().fillColor(CHARCOAL).rect(ML, hY, tableW, maxHeaderH).fill().restore();

      // Draw header cells in crisp white
      let curX = ML;
      headers.forEach((h, i) => {
        doc.font(FONT_BOLD).fontSize(headerFontSize).fillColor(BG_WHITE)
          .text(h.toUpperCase(), curX + 5, hY + rowPad, { width: actualWidths[i] - 10, align: i === 2 ? "center" : "left" });
        curX += actualWidths[i];
      });

      doc.y = hY + maxHeaderH;

      // 2. Render rows
      rows.forEach((row, rIdx) => {
        let maxRowH = 18;
        row.forEach((cell, cIdx) => {
          const isBold = cIdx === 0 || cIdx === 2;
          doc.font(isBold ? FONT_BOLD : FONT_REG).fontSize(bodyFontSize);
          const textH = doc.heightOfString(cell, { width: actualWidths[cIdx] - 10, lineGap: 2 });
          if (textH + rowPad * 2 > maxRowH) maxRowH = textH + rowPad * 2;
        });

        ensureSpace(maxRowH + 4);
        const rY = doc.y;
        const isAlt = rIdx % 2 === 1;

        // Subtle alternating row background
        if (isAlt) {
          doc.save().fillColor(BG_TINT).rect(ML, rY, tableW, maxRowH).fill().restore();
        }

        // Bottom border
        doc.save()
          .strokeColor(BORDER_LGT).lineWidth(0.5)
          .moveTo(ML, rY + maxRowH).lineTo(ML + tableW, rY + maxRowH)
          .stroke().restore();

        // Render text
        curX = ML;
        row.forEach((cell, cIdx) => {
          const isFirst = cIdx === 0;
          const isDisb = cIdx === 2;
          const font = (isFirst || isDisb) ? FONT_BOLD : FONT_REG;
          const color = isFirst || isDisb ? BLACK : BODY_TEXT;

          doc.font(font).fontSize(bodyFontSize).fillColor(color)
            .text(cell, curX + 5, rY + rowPad, { width: actualWidths[cIdx] - 10, align: isDisb ? "center" : "left", lineGap: 2 });
          curX += actualWidths[cIdx];
        });

        doc.y = rY + maxRowH;
      });

      // Bottom boundary table line
      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(0.75)
        .moveTo(ML, doc.y).lineTo(ML + tableW, doc.y).stroke()
        .restore();

      doc.y += 8;
    }

    /** Draw bottom footer on each page */
    function drawFooter(pageNum, totalPages) {
      // Temporarily clear bottom margin so PDFKit's LineWrapper never triggers an accidental auto-pagebreak
      const origBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(0.75)
        .moveTo(ML, FOOTER_Y - 5).lineTo(ML + CW, FOOTER_Y - 5)
        .stroke().restore();

      // Clean, uncolliding 2-column footer
      doc.font(FONT_REG).fontSize(7).fillColor(MUTED_TEXT)
        .text("MCPA CONSTRUCTION AND SUPPLY  |  OFFICIAL CORPORATE LEGAL INSTRUMENT", ML, FOOTER_Y, { lineBreak: false });

      doc.font(FONT_BOLD).fontSize(7).fillColor(CHARCOAL)
        .text(`Page ${pageNum} of ${totalPages}`, ML, FOOTER_Y, { width: CW, align: "right", lineBreak: false });

      doc.page.margins.bottom = origBottom;
    }

    // ── RENDER CONTENT ─────────────────────────────────────────────────────────

    // 1. First Page Letterhead & Title Block
    drawLetterhead();
    drawTitleBlock();

    // 2. Sections Loop (Strictly 12pt Arial with 1.5 line spacing [lineGap: 6])
    data.sections.forEach((sec) => {
      // Prevent orphan headings (Academic/Research standard widow-orphan control)
      // Ensure space for Section Title + Divider + at least first paragraph or entire table/callout unit
      let neededForSectionStart = 150;
      if (sec.body && sec.body.length > 0) {
        const firstPara = sec.body[0];
        const isCallout =
          firstPara.startsWith("KEY COMMITMENT:") ||
          firstPara.startsWith("MAHALAGANG PANGAKO:") ||
          firstPara.startsWith("STATUTORY LIABILITY UNDER ARTICLE 1723:") ||
          firstPara.startsWith("PANANAGUTAN SA ILALIM NG ARTIKULO 1723:");
        const paraH = doc
          .font(isCallout ? FONT_BOLD : FONT_REG)
          .fontSize(12)
          .heightOfString(firstPara, {
            width: isCallout ? CW - 24 : CW,
            lineGap: 6,
            indent: isCallout ? 18 : 28,
          });
        neededForSectionStart = Math.max(neededForSectionStart, 44 + paraH + (isCallout ? 26 : 14));
      }

      // If section contains a callout box, require enough room so callout doesn't break right after intro
      const hasCallout = sec.body && sec.body.some(
        (p) =>
          p.startsWith("KEY COMMITMENT:") ||
          p.startsWith("MAHALAGANG PANGAKO:") ||
          p.startsWith("STATUTORY LIABILITY UNDER ARTICLE 1723:") ||
          p.startsWith("PANANAGUTAN SA ILALIM NG ARTIKULO 1723:")
      );
      if (hasCallout) {
        neededForSectionStart = Math.max(neededForSectionStart, 210);
      }

      // If section contains a table (like BNPL Section 3.0), require room for heading + intro + table
      if (sec.table) {
        neededForSectionStart = Math.max(neededForSectionStart, 230);
      }

      ensureSpace(neededForSectionStart);

      const sY = doc.y;

      // Section Title (13pt Bold Arial)
      doc.font(FONT_BOLD).fontSize(13).fillColor(BLACK)
        .text(`SECTION ${sec.number} — ${sec.title.toUpperCase()}`, ML, sY, { width: CW });

      // Clean formal divider rule under section title
      doc.save()
        .strokeColor(BORDER_DARK).lineWidth(0.75)
        .moveTo(ML, doc.y + 3).lineTo(ML + CW, doc.y + 3).stroke()
        .restore();

      doc.y += 8;

      // Section Body Paragraphs (12pt Arial, 1.5 Line Spacing [lineGap: 6], First-line Indent)
      sec.body.forEach((para) => {
        const isCallout =
          para.startsWith("KEY COMMITMENT:") ||
          para.startsWith("MAHALAGANG PANGAKO:") ||
          para.startsWith("STATUTORY LIABILITY UNDER ARTICLE 1723:") ||
          para.startsWith("PANANAGUTAN SA ILALIM NG ARTIKULO 1723:");

        if (isCallout) {
          const innerW = CW - 24;
          const textH = doc.font(FONT_BOLD).fontSize(12)
            .heightOfString(para, { width: innerW, lineGap: 6, indent: 18 });
          const boxH = textH + 16;

          ensureSpace(boxH + 10);
          const cY = doc.y + 3;

          // Formal High-Contrast Legal Box:
          // 3.5pt solid black left vertical bar + subtle gray background + 0.5pt outer border
          doc.save()
            .rect(ML, cY, CW, boxH).fillColor(BG_TINT).fill()
            .strokeColor(BORDER_DARK).lineWidth(0.5).rect(ML, cY, CW, boxH).stroke()
            .rect(ML, cY, 4, boxH).fillColor(BLACK).fill()
            .restore();

          // Callout text in 12pt bold black, 1.5 line spacing, first line indent
          doc.font(FONT_BOLD).fontSize(12).fillColor(BLACK)
            .text(para, ML + 14, cY + 8, { width: innerW, lineGap: 6, align: "justify", indent: 18 });

          doc.y = cY + boxH + 8;

        } else if (para.startsWith("•") || para.startsWith("- ")) {
          const textH = doc.font(FONT_REG).fontSize(12)
            .heightOfString(para, { width: CW - 14, lineGap: 6 });
          ensureSpace(textH + 6);
          doc.font(FONT_REG).fontSize(12).fillColor(BODY_TEXT)
            .text(para, ML + 14, doc.y, { width: CW - 14, lineGap: 6, align: "justify" });
          doc.y += 6;

        } else {
          // Standard Paragraph with MS Word style First-Line Indent (tab: 28pt / ~1cm)
          const textH = doc.font(FONT_REG).fontSize(12)
            .heightOfString(para, { width: CW, lineGap: 6, indent: 28 });
          ensureSpace(textH + 6);
          doc.font(FONT_REG).fontSize(12).fillColor(BODY_TEXT)
            .text(para, ML, doc.y, { width: CW, lineGap: 6, align: "justify", indent: 28 });
          doc.y += 8;
        }
      });

      // Render Section Table if defined
      if (sec.table) {
        drawTable(sec.table);
      }

      doc.y += 6;
    });

    // 3. Official Attestation, Dual Signatures & Notarial Block (Unified Authentication Unit)
    // Kept together as an indivisible legal block so signatures and notarial act never orphan
    ensureSpace(230);
    doc.y += 4;

    doc.save()
      .strokeColor(BORDER_DARK).lineWidth(1)
      .moveTo(ML, doc.y).lineTo(ML + CW, doc.y).stroke()
      .restore();

    doc.y += 6;
    doc.font(FONT_BOLD).fontSize(11).fillColor(BLACK)
      .text(
        activeLang === "fil"
          ? "OPISYAL NA SERTIPIKASYON AT PAGPAPATIBAY NG KONTRATISTA"
          : "OFFICIAL STATUTORY ATTESTATION & CORPORATE CERTIFICATION",
        ML, doc.y, { width: CW }
      );

    const attestText = activeLang === "fil"
      ? "Pinatutunayan at pinagtitibay ng MCPA Construction and Supply na ang lahat ng alituntunin, teknikal na pamantayan, Labinlimang Taong (15-Year) pananagutan sa estruktura alinsunod sa Artikulo 1723 ng Civil Code ng Pilipinas, mga regulasyon ng DOLE sa kaligtasan sa pagtatayo, at mga probisyon sa proteksyon ng datos sa ilalim ng RA 10173 na nakasaad dito ay opisyal, sertipikado, at legal na umiiral sa lahat ng kasunduan, proyekto, at proseso ng turnover."
      : "MCPA Construction and Supply hereby certifies and attests that all operational guidelines, engineering standards, statutory Fifteen (15) Year Structural Warranty obligations pursuant to Article 1723 of the Civil Code of the Philippines, DOLE construction safety mandates, and data governance provisions under Republic Act No. 10173 set forth herein represent official certified instruments governing all active client agreements, project milestones, and turnover executions.";

    doc.y += 3;
    doc.font(FONT_REG).fontSize(9.5).fillColor(MUTED_TEXT)
      .text(attestText, ML, doc.y, { width: CW, lineGap: 4, align: "justify", indent: 24 });

    doc.y += 20; // clean breathing space before signature lines

    const sigW = 225;
    const sigY = doc.y;

    // Sig 1 — Technical & Engineering Director (Left Column)
    doc.save()
      .strokeColor(BORDER_DARK).lineWidth(0.5)
      .moveTo(ML, sigY).lineTo(ML + sigW, sigY)
      .stroke().restore();
    doc.font(FONT_BOLD).fontSize(10).fillColor(BLACK)
      .text("ENGR. / ARCH. TECHNICAL DIRECTOR", ML, sigY + 5, { width: sigW });
    doc.font(FONT_REG).fontSize(8).fillColor(MUTED_TEXT)
      .text("Directorate of Structural & Technical Standards", ML, doc.y + 2, { width: sigW })
      .text("PRC Licensed Professional · MCPA Construction and Supply", ML, doc.y + 1.5, { width: sigW });

    const leftSigEndY = doc.y;

    // Sig 2 — Managing General Contractor (Right Column)
    const s2X = ML + CW - sigW;
    doc.save()
      .strokeColor(BORDER_DARK).lineWidth(0.5)
      .moveTo(s2X, sigY).lineTo(s2X + sigW, sigY)
      .stroke().restore();
    doc.font(FONT_BOLD).fontSize(10).fillColor(BLACK)
      .text("MANAGING GENERAL CONTRACTOR", s2X, sigY + 5, { width: sigW });
    doc.font(FONT_REG).fontSize(8).fillColor(MUTED_TEXT)
      .text("Executive Operations & Corporate Governance", s2X, doc.y + 2, { width: sigW })
      .text("MCPA Construction and Supply · Plaridel, Bulacan", s2X, doc.y + 1.5, { width: sigW });

    const rightSigEndY = doc.y;
    const sigEndY = Math.max(leftSigEndY, rightSigEndY);

    // 4. Sworn Notarial Acknowledgment Box
    // Positioned safely below the entire dual signature text block
    const notarialY = sigEndY + 14;

    const juratTitle = "REPUBLIC OF THE PHILIPPINES  )  PROVINCE OF BULACAN, MUNICIPALITY OF PLARIDEL  )  S.S.";
    const juratTitleH = doc.font(FONT_BOLD).fontSize(6.5).heightOfString(juratTitle, { width: CW - 16 });

    const notarialText = activeLang === "fil"
      ? "SINUMPAAN AT NILAGDAAN sa aking harapan ngayong taong 2026 sa Plaridel, Bulacan, personal na humarap ang mga kinatawan ng MCPA Construction and Supply na may hawak ng mga balidong ID at nagpatibay na ito ay kanilang malaya at boluntaryong gawa."
      : "SUBSCRIBED AND SWORN to before me this calendar year 2026 at Plaridel, Bulacan, affiants exhibiting competent evidence of identities, acknowledging this corporate legal instrument as their free and voluntary act and deed.";
    const juratBodyH = doc.font(FONT_REG).fontSize(6.5).heightOfString(notarialText, { width: CW - 16, lineGap: 1.5, indent: 14 });

    const docLineText = "Doc. No. ______;  Page No. ______;  Book No. ______;  Series of 2026.  [OFFICIAL NOTARIAL SEAL AFFIXED]";
    const docLineH = doc.font(FONT_BOLD).fontSize(6.5).heightOfString(docLineText, { width: CW - 16 });

    // Dynamic calculated height with comfortable 6pt padding top/bottom and 3-4pt element gaps
    const notarialH = 6 + juratTitleH + 3 + juratBodyH + 4 + docLineH + 6;

    doc.save()
      .rect(ML, notarialY, CW, notarialH)
      .fillColor(BG_TINT).fill()
      .strokeColor(BORDER_MID).lineWidth(0.5)
      .rect(ML, notarialY, CW, notarialH).stroke()
      .restore();

    let curNotaryY = notarialY + 6;
    doc.font(FONT_BOLD).fontSize(6.5).fillColor(BLACK)
      .text(juratTitle, ML + 8, curNotaryY, { width: CW - 16 });
    curNotaryY = doc.y + 3;

    doc.font(FONT_REG).fontSize(6.5).fillColor(MUTED_TEXT)
      .text(notarialText, ML + 8, curNotaryY, { width: CW - 16, lineGap: 1.5, indent: 14 });
    curNotaryY = doc.y + 4;

    doc.font(FONT_BOLD).fontSize(6.5).fillColor(CHARCOAL)
      .text(docLineText, ML + 8, curNotaryY, { width: CW - 16 });

    doc.y = notarialY + notarialH + 6;

    // 5. Stamp Running Footers on Every Buffered Page
    const range = doc.bufferedPageRange();
    console.log(`[LEGAL PDF] ${activeDocType} (${activeLang}) Total Pages: ${range.count}`);
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(i + 1, range.count);
    }

    doc.end();
  });
}

module.exports = { generateLegalPdf };
