"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Curated UI key translations (for direct t(key) calls)
export const translations = {
  en: {
    // Utility Bar
    announcements: [
      "Looking to turn your ideas into reality?",
      "Collaborate with us at MCPA Construction and Supply and let's build your dream home",
      "We Have Build Now, Pay Later Program Available",
      "Message Us Now — Inquire for Your Project",
    ],
    aboutUs: "About Us",
    helpCenter: "Help Center",
    theme: "Theme",
    appearance: "Select Appearance",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    systemAuto: "System Auto",
    networkStatus: "Network Status",
    online: "Online",
    offline: "Offline",
    connectedCloud: "Connected to MCPA Cloud",
    disconnectedCloud: "Offline — Local Cache Active",
    testConnection: "Check Connection",
    checkingConnection: "Checking...",
    connectionHealthy: "All systems online and synced.",
    connectionLost: "No internet connection detected.",
    networkOfflineBanner: "No internet connection. Please check your network.",
    networkRestoredBanner: "Internet connection restored! You are back online.",

    // Navbar & Pages
    navHome: "Home",
    navProjects: "Projects",
    navServices: "Services",
    navProcess: "Process",
    bookAppointment: "Inquire Now!",
    clientPortal: "Client Portal",
    bookingTitle: "Booking",

    // Hero Section
    heroBadge: "Build Now, Pay Later Program Available",
    heroHeading: "Looking to turn your ideas into reality?",
    heroSubPre: "Collaborate with us at ",
    heroSubBold: "MCPA Construction and Supply",
    heroSubPost: " and let's build your enduring legacy.",
    scrollExplore: "Scroll to Explore",
    scrollToContinue: "Scroll to Continue",
    replayBuild: "Replay Build",

    // Services Section
    whatWeDo: "What We Do",
    servicesThat: "Services That",
    defineEras: "Define Eras",
    servicesSubtitle:
      "We build on time and built to last. We work closely with you from initial idea to completed build, creating a home your family can enjoy for generations.",
    serviceTurnkeyTag: "Turnkey Design & Build",
    serviceTurnkeyTitle: "Custom Residential",
    serviceTurnkeyDesc:
      "Custom homes designed for your family's daily living. From modern bungalow homes to two-storey family residences with a 15-year structural warranty.",
    serviceBnplTag: "Titled Lot Financing",
    serviceBnplTitle: "Build Now, Pay Later",
    serviceBnplDesc:
      "Special program for titled lot owners across Bulacan and Central Luzon. Build your dream home with flexible payment stages and Pag-IBIG or bank loan assistance.",
    servicePlansTag: "Architectural & Engineering",
    servicePlansTitle: "Signed & Sealed Plans",
    servicePlansDesc:
      "Complete architectural blueprints and structural calculations prepared by licensed professionals, with full assistance in getting city building permits.",
    serviceSupplyTag: "Warehouses & In-House Logistics",
    serviceSupplyTitle: "Commercial & Project Supply",
    serviceSupplyDesc:
      "Commercial buildings, steel warehouses, home renovations, and dedicated in-house materials delivered right to your job site.",
    inquire: "Inquire",

    // Project Cards
    inquireStyle: "Inquire for this Style",
    readMore: "more",
    readLess: "less",

    // Modals
    aboutTitle: "About MCPA Construction",
    aboutSub: "Design & Build Contractor · Plaridel, Bulacan",
    aboutBio:
      "Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. We specialize in custom residential homes, modern commercial facilities, warehouse structures, signed and sealed engineering plans, and in-house construction supplies across Bulacan, Metro Manila, and Central Luzon.",
    officialSocialChannels: "Official Social Channels",
    warrantyTitle: "15-Year Structural Warranty",
    warrantyDesc:
      "Every residential and commercial project constructed by MCPA includes our comprehensive 15-year structural warranty (Civil Code Art. 1723), engineered with certified steel bars and reinforced concrete.",
    bnplTitle: "Build Now, Pay Later Program",
    bnplDesc:
      "Exclusive milestone-based financing for titled property owners across Bulacan, Metro Manila, and Central Luzon. Progress billing ensures you only pay as each verified phase is completed.",
    signedPlansTitle: "Signed & Sealed Blueprints",
    signedPlansDesc:
      "All architectural, structural, electrical, and sanitary plans are certified and sealed by licensed Filipino Architects, Civil Engineers, and Master Plumbers for seamless municipal permit approval.",
    viewAllServices: "View All Services",

    // Legal Shortcuts
    legalShortcutsTitle: "Legal & Regulatory Compliance",
    legalShortcutsSubtitle: "Official Philippine Engineering & Building Standards",
    termsShortcutTitle: "Terms & 15-Yr Warranty",
    termsShortcutDesc: "Civil Code Art. 1723 & BNPL",
    privacyShortcutTitle: "Privacy Policy",
    privacyShortcutDesc: "RA 10173 & Title Security",
    safetyShortcutTitle: "Safety Standards",
    safetyShortcutDesc: "DOLE DO-13 & OSH Guidelines",
    viewAllLegalDocs: "View All Legal Documentation",

    helpTitle: "MCPA Help Center & Support",
    headquarters: "Headquarters",
    headquartersDesc: "Plaridel, Bulacan, Philippines",
    emailInquiries: "Email Inquiries",
    phoneSupport: "Phone / Viber Support",
    bookFreeConsultation: "Book Free Site Consultation",

    // Appearance Drawer
    appearanceLabel: "Appearance",

    // Home Overview
    overviewEyebrow: "Quality Construction · Direct Materials",
    overviewHeading: "Why Homeowners Build With MCPA",
    overviewDescription:
      "No guesswork and no hidden fees. We provide clear communication, regular photo updates, and guaranteed quality materials so you always know how your home is being built.",
    pillarStrengthTitle: "Built For Lasting Strength",
    pillarStrengthDescription:
      "Reinforced concrete, certified steel framing, and solid engineering built to keep your family safe against typhoons and earthquakes.",
    pillarUpdatesTitle: "Clear Photo & Progress Updates",
    pillarUpdatesDescription:
      "Regular photo updates and status reports sent directly to your phone and online portal from foundation up to key turnover.",
    pillarPaymentTitle: "Build Now, Pay Later Program",
    pillarPaymentDescription:
      "Flexible payment options and clear stage-by-stage billing, so you only pay as each verified phase of your home is completed.",
  },
  fil: {
    // Utility Bar
    announcements: [
      "Nais mo bang gawing totoo ang iyong mga ideya?",
      "Makipagtulungan sa MCPA Construction and Supply at buuin natin ang iyong pangarap na tahanan",
      "Mayroon Kaming Programang Build Now, Pay Later",
      "Mag-message sa Amin Ngayon — Mag-inquire para sa Iyong Proyekto",
    ],
    aboutUs: "Tungkol sa Amin",
    helpCenter: "Sentro ng Tulong",
    theme: "Tema",
    appearance: "Pumili ng Tema",
    lightTheme: "Maliwanag na Tema",
    darkTheme: "Madilim na Tema",
    systemAuto: "Awtomatikong Tema",
    networkStatus: "Katayuan ng Network",
    online: "Online",
    offline: "Offline",
    connectedCloud: "Konektado sa MCPA Cloud",
    disconnectedCloud: "Offline — Naka-save Lokal",
    testConnection: "Suriin ang Koneksyon",
    checkingConnection: "Sinusuri...",
    connectionHealthy: "Lahat ng serbisyo ay aktibo at naka-sync.",
    connectionLost: "Walang nakitang koneksyon sa internet.",
    networkOfflineBanner: "Walang koneksyon sa internet. Pakisuri ang iyong network.",
    networkRestoredBanner: "Naibalik na ang koneksyon sa internet! Online ka na muli.",

    // Navbar & Pages
    navHome: "Tahanan",
    navProjects: "Mga Proyekto",
    navServices: "Mga Serbisyo",
    navProcess: "Proseso",
    bookAppointment: "Mag-inquire Na!",
    clientPortal: "Portal ng Kliyente",
    bookingTitle: "Pag-book",

    // Hero Section
    heroBadge: "May Programang Build Now, Pay Later",
    heroHeading: "Nais mo bang gawing totoo ang iyong mga plano?",
    heroSubPre: "Makipagtulungan sa ",
    heroSubBold: "MCPA Construction and Supply",
    heroSubPost: " at buuin natin ang iyong matatag na tahanan.",
    scrollExplore: "Mag-scroll upang Tuklasin",
    scrollToContinue: "Mag-scroll upang Magpatuloy",
    replayBuild: "Ulitin ang Pagtatayo",

    // Services Section
    whatWeDo: "Ang Aming Ginagawa",
    servicesThat: "Mga Serbisyong",
    defineEras: "Tumatak sa Panahon",
    servicesSubtitle:
      "Nagtatayo kami sa tamang oras at matibay para tumagal. Kasama mo kami mula sa unang plano hanggang sa matapos ang gawa, lumilikha ng tahanan na maipagmamalaki ng iyong pamilya sa mga susunod na henerasyon.",
    serviceTurnkeyTag: "Kumpletong Disenyo at Gawa",
    serviceTurnkeyTitle: "Pasadyang Residensyal",
    serviceTurnkeyDesc:
      "Pasadyang mga tahanan na idinisenyo para sa pang-araw-araw na pamumuhay ng iyong pamilya. Mula sa modernong bungalow hanggang sa dalawang palapag na tirahan na may 15-taong structural warranty.",
    serviceBnplTag: "Financing sa Tituladong Lote",
    serviceBnplTitle: "Build Now, Pay Later",
    serviceBnplDesc:
      "Espesyal na programa para sa may-ari ng may titulong lote sa Bulacan at Gitnang Luzon. Ipatayo ang iyong pangarap na tahanan na may flexible na hulog at tulong sa Pag-IBIG o bank loan.",
    servicePlansTag: "Arkitektura at Inhinyeriya",
    servicePlansTitle: "Plano na May Pirma at Tatak",
    servicePlansDesc:
      "Kumpletong mga blueprint sa arkitektura at kalkulasyon sa istruktura na inihanda ng mga lisensyadong propesyonal, na may buong tulong sa pagkuha ng building permit sa lungsod.",
    serviceSupplyTag: "Bodega at Direktang Suplay",
    serviceSupplyTitle: "Komersyal at Suplay ng Proyekto",
    serviceSupplyDesc:
      "Mga gusaling komersyal, bodega ng bakal, pagkukumpuni ng bahay, at direktang materyales na inihahatid sa mismong gawaan.",
    inquire: "Mag-inquire",

    // Project Cards
    inquireStyle: "Mag-inquire sa Estilong Ito",
    readMore: "higit pa",
    readLess: "itiklop",

    // Modals
    aboutTitle: "Tungkol sa MCPA Construction",
    aboutSub: "Kontratista sa Disenyo at Pagtatayo · Plaridel, Bulacan",
    aboutBio:
      "Nais mo bang gawing totoo ang iyong mga ideya? Ang MCPA Construction and Supply ay isang full-service design and build contractor na nakabase sa Plaridel, Bulacan. Dalubhasa kami sa mga pasadyang tahanan, modernong pasilidad na komersyal, bodega, signed and sealed na mga planong pang-inhinyeriya, at direktang suplay ng materyales sa konstruksyon sa buong Bulacan, Metro Manila, at Gitnang Luzon.",
    officialSocialChannels: "Opisyal na Social Media Channels",
    warrantyTitle: "15-Taong Structural Warranty",
    warrantyDesc:
      "Bawat proyektong residensyal at komersyal ng MCPA ay may 15-taong structural warranty (Art. 1723 ng Civil Code), gamit ang sertipikadong bakal at pinatibay na kongkreto.",
    bnplTitle: "Programang Build Now, Pay Later",
    bnplDesc:
      "Eksklusibong tulong pinansyal para sa mga may tituladong lote sa Bulacan, Metro Manila, at Gitnang Luzon. Magbabayad lamang habang natatapos ang bawat yugto ng bahay.",
    signedPlansTitle: "Pirma at Tatak ng mga Propesyonal",
    signedPlansDesc:
      "Lahat ng plano ay aprubado at may tatak ng mga lisensyadong Arkitekto, Civil Engineer, at Master Plumber para sa madaling pagkuha ng building permit.",
    viewAllServices: "Tingnan Lahat ng Serbisyo",

    // Legal Shortcuts
    legalShortcutsTitle: "Mga Dokumento sa Batas at Patakaran",
    legalShortcutsSubtitle: "Opisyal na Pamantayan sa Inhinyeriya at Gusali ng Pilipinas",
    termsShortcutTitle: "Kasunduan at 15-Taong Warranty",
    termsShortcutDesc: "Artikulo 1723 ng Civil Code at BNPL",
    privacyShortcutTitle: "Patakaran sa Privacy",
    privacyShortcutDesc: "RA 10173 at Seguridad sa Titulo",
    safetyShortcutTitle: "Pamantayan sa Kaligtasan",
    safetyShortcutDesc: "DOLE DO-13 at Alituntunin sa OSH",
    viewAllLegalDocs: "Tingnan ang Lahat ng Dokumento sa Batas",

    helpTitle: "MCPA Sentro ng Tulong at Suporta",
    headquarters: "Pangunahing Tanggapan",
    headquartersDesc: "Plaridel, Bulacan, Pilipinas",
    emailInquiries: "Mga Katanungan sa Email",
    phoneSupport: "Telepono / Viber Support",
    bookFreeConsultation: "Mag-iskedyul ng Libreng Konsultasyon",

    // Appearance Drawer
    appearanceLabel: "Tema",

    // Home Overview
    overviewEyebrow: "De-kalidad na Konstruksyon · Direktang Materyales",
    overviewHeading: "Bakit Nagpapagawa ng Bahay sa MCPA ang mga May-ari",
    overviewDescription:
      "Walang hulaan at walang nakatagong bayarin. Nagbibigay kami ng malinaw na komunikasyon, regular na update sa larawan, at garantisadong de-kalidad na materyales para alam mo lagi ang progreso ng iyong bahay.",
    pillarStrengthTitle: "Matibay na Itinatayo para sa Pangmatagalan",
    pillarStrengthDescription:
      "Pinatibay na kongkreto, sertipikadong bakal, at maaasahang inhinyeriya para mapanatiling ligtas ang iyong pamilya laban sa bagyo at lindol.",
    pillarUpdatesTitle: "Malinaw na Update sa Larawan at Progreso",
    pillarUpdatesDescription:
      "Regular na update sa larawan at status report sa iyong telepono at online portal mula pundasyon hanggang turnover ng susi.",
    pillarPaymentTitle: "Build Now, Pay Later Program",
    pillarPaymentDescription:
      "Flexible na bayaran at malinaw na billing bawat yugto, kaya magbabayad ka lamang kapag nakumpleto ang bawat beripikadong phase ng iyong bahay.",
  },
};

// Comprehensive English -> Tagalog Translation Dictionary
// Contains every sentence, phrase, button, badge, label, heading, and description across the entire site.
export const TAGALOG_DICTIONARY = {
  // Navigation & General
  "Home": "Tahanan",
  "Projects": "Mga Proyekto",
  "Services": "Mga Serbisyo",
  "Process": "Proseso",
  "Book an Appointment": "Mag-inquire Na!",
  "BOOK AN APPOINTMENT": "INQUIRE NOW!",
  "Inquire Now!": "Mag-inquire Na!",
  "INQUIRE NOW!": "MAG-INQUIRE NA!",
  "Inquire Now": "Mag-inquire Na!",
  "Client Portal": "Portal ng Kliyente",
  "CLIENT PORTAL": "PORTAL NG KLIYENTE",
  "Booking": "Pag-book",
  "BOOKING": "PAG-BOOK",
  "About Us": "Tungkol sa Amin",
  "Help Center": "Sentro ng Tulong",
  "Theme": "Tema",
  "Appearance": "Tema",
  "Select Appearance": "Pumili ng Tema",
  "Light Theme": "Maliwanag na Tema",
  "Dark Theme": "Madilim na Tema",
  "System Auto": "Awtomatikong Tema",
  "Light": "Maliwanag",
  "Dark": "Madilim",
  "Back": "Bumalik",
  "Next Step": "Susunod na Hakbang",
  "more": "higit pa",
  "less": "itiklop",
  "Inquire": "Mag-inquire",
  "Inquire for this Style": "Mag-inquire sa Estilong Ito",
  "Scroll to Explore": "Mag-scroll upang Tuklasin",
  "Scroll to Continue": "Mag-scroll upang Magpatuloy",
  "Replay Build": "Ulitin ang Pagtatayo",
  "Close": "Isara",
  "Isara": "Isara",
  "Language": "Wika",
  "Wika": "Wika",
  "All": "Lahat",
  "Residential": "Residensyal",
  "Commercial": "Komersyal",
  "Luxury Villa": "Marangyang Villa",
  "Modern Zen": "Modernong Zen",

  "MCPA Construction and Supply": "MCPA Construction and Supply",
  "MCPA Construction & Supply": "MCPA Construction and Supply",
  "MCPA Construction": "MCPA Construction",

  // Top Utility Announcements
  "Looking to turn your ideas into reality?": "Nais mo bang gawing totoo ang iyong mga ideya?",
  "Collaborate with us at MCPA Construction and Supply and let's build your dream home":
    "Makipagtulungan sa MCPA Construction and Supply at buuin natin ang iyong pangarap na tahanan",
  "We Have Build Now, Pay Later Program Available": "Mayroon Kaming Programang Build Now, Pay Later",
  "Message Us Now — Inquire for Your Project": "Mag-message sa Amin Ngayon — Mag-inquire para sa Iyong Proyekto",

  // Hero Section
  "Build Now, Pay Later Program Available": "May Programang Build Now, Pay Later",
  "Collaborate with us at": "Makipagtulungan sa amin sa",
  "Collaborate with us at ": "Makipagtulungan sa amin sa ",
  "and let's build your enduring legacy.": "at buuin natin ang iyong matatag na tahanan.",
  "and let's build your enduring legacy": "at buuin natin ang iyong matatag na tahanan",
  "and let’s build your enduring legacy.": "at buuin natin ang iyong matatag na tahanan.",
  "and let’s build your enduring legacy": "at buuin natin ang iyong matatag na tahanan",

  // Stats Section
  "Earthquake &": "Ligtas sa Lindol at",
  "Typhoon": "Bagyo",
  "Ready": "Handa",
  "Structural Resilience": "Tibay ng Istruktura",
  "Engineered for major faults & super typhoon wind loads":
    "Idinisenyo para sa lindol at lakas ng hanging dala ng bagyo",
  "Direct": "Direktang",
  "Supply": "Suplay",
  "In-House Materials": "Sariling Materyales",
  "Project-dedicated aggregates, cement & structural steel":
    "Buhangin, graba, semento, at bakal na nakalaan sa proyekto",
  "Signed & Sealed": "May Pirma at Tatak",
  "Licensed Architects & Civil Engineers": "Mga Lisensyadong Arkitekto at Civil Engineer",
  "BNPL": "BNPL",
  "Program": "Programa",
  "Build Now, Pay Later": "Build Now, Pay Later",
  "Titled lot financing & Pag-IBIG assistance": "Financing sa tituladong lote at tulong sa Pag-IBIG",
  "100%": "100%",
  "PRC Signed & Sealed": "May Pirma at Tatak ng PRC",
  "In-House Cement & Steel": "Sariling Semento at Bakal",
  "Structural Resilience Standard": "Pamantayan sa Katatagan ng Istruktura",

  // Quick Overview / Pillars
  "Quality Construction · Direct Materials": "De-kalidad na Konstruksyon · Direktang Materyales",
  "Why Homeowners Build With MCPA": "Bakit Nagpapagawa ng Bahay sa MCPA ang mga May-ari",
  "No guesswork and no hidden fees. We provide clear communication, regular photo updates, and guaranteed quality materials so you always know how your home is being built.":
    "Walang hulaan at walang nakatagong bayarin. Nagbibigay kami ng malinaw na komunikasyon, regular na update sa larawan, at garantisadong de-kalidad na materyales para alam mo lagi ang progreso ng iyong bahay.",
  "Built For Lasting Strength": "Matibay na Itinatayo para sa Pangmatagalan",
  "Reinforced concrete, certified steel framing, and solid engineering built to keep your family safe against typhoons and earthquakes.":
    "Pinatibay na kongkreto, sertipikadong bakal, at maaasahang inhinyeriya para mapanatiling ligtas ang iyong pamilya laban sa bagyo at lindol.",
  "Clear Photo & Progress Updates": "Malinaw na Update sa Larawan at Progreso",
  "Regular photo updates and status reports sent directly to your phone and online portal from foundation up to key turnover.":
    "Regular na update sa larawan at status report sa iyong telepono at online portal mula pundasyon hanggang turnover ng susi.",
  "Build Now, Pay Later Program": "Programang Build Now, Pay Later",
  "Flexible payment options and clear stage-by-stage billing, so you only pay as each verified phase of your home is completed.":
    "Flexible na bayaran at malinaw na billing bawat yugto, kaya magbabayad ka lamang kapag nakumpleto ang bawat beripikadong phase ng iyong bahay.",

  // Services Section & /services Page
  "What We Do": "Ang Aming Ginagawa",
  "WHAT WE DO": "ANG AMING GINAGAWA",
  "Services That": "Mga Serbisyong",
  "SERVICES THAT": "MGA SERBISYONG",
  "Define Eras": "Tumatak sa Panahon",
  "DEFINE ERAS": "TUMATAK SA PANAHON",
  "Endure For Eras": "Tumatak sa Panahon",
  "Services That Endure For Eras": "Mga Serbisyong Tumatak sa Panahon",
  "We build on time and built to last. We work closely with you from initial idea to completed build, creating a home your family can enjoy for generations.":
    "Nagtatayo kami sa tamang oras at matibay para tumagal. Kasama mo kami mula sa unang plano hanggang sa matapos ang gawa, lumilikha ng tahanan na maipagmamalaki ng iyong pamilya sa mga susunod na henerasyon.",
  "MCPA Construction and Supply brings together licensed architectural design, skilled engineering, and our own dedicated materials for each project. We eliminate retail hardware markups and ensure reliable, long-lasting quality from foundation to key turnover.":
    "Pinagsasama ng MCPA Construction and Supply ang lisensyadong arkitektura, mahusay na inhinyeriya, at sarili naming materyales para sa bawat proyekto. Inaalis namin ang patong sa presyo ng hardware at tinitiyak ang matibay na kalidad mula sa pundasyon hanggang sa turnover ng susi.",
  "Design & Build Excellence · Dedicated In-House Materials": "Kahusayan sa Disenyo at Pagtatayo · Sariling Materyales",
  "Complete Turnkey Build": "Kumpletong Turnkey na Pagtatayo",
  "Turnkey Design & Build": "Kumpletong Disenyo at Gawa",
  "TURNKEY DESIGN & BUILD": "KUMPLETONG DISENYO AT GAWA",
  "Custom Residential": "Pasadyang Residensyal",
  "Custom Residential Design & Build": "Pasadyang Residensyal na Disenyo at Pagtatayo",
  "Custom family homes built to last for generations": "Pasadyang mga tahanan ng pamilya na itinayo upang tumagal sa maraming henerasyon",
  "Custom homes designed for your family's daily living. From modern bungalow homes to two-storey family residences with a 15-year structural warranty.":
    "Pasadyang mga tahanan na idinisenyo para sa pang-araw-araw na pamumuhay ng iyong pamilya. Mula sa modernong bungalow hanggang sa dalawang palapag na tirahan na may 15-taong structural warranty.",
  "Custom homes designed for your family's daily living. From modern bungalow homes to two-storey family residences with a 5-year structural warranty.":
    "Pasadyang mga tahanan na idinisenyo para sa pang-araw-araw na pamumuhay ng iyong pamilya. Mula sa modernong bungalow hanggang sa dalawang palapag na tirahan na may 15-taong structural warranty.",
  "From initial floor plans to final key handover, we handle your entire build. Whether you envision a modern single-storey home or a multi-storey family residence, every home is built strong to withstand heavy typhoons and earthquakes.":
    "Mula sa unang plano sa sahig hanggang sa pag-abot ng susi, kami ang bahala sa kabuuan ng iyong bahay. Modernong bungalow man o may ilang palapag na tirahan, bawat bahay ay matibay laban sa malalakas na bagyo at lindol.",
  "3D realistic color views & floor plan designs": "Makatotohanang 3D color views at mga disenyo ng floor plan",
  "Solid concrete foundation & certified heavy-duty steel bars": "Matatag na pundasyon ng semento at sertipikadong bakal",
  "High-grade plumbing, electrical wiring & sanitary installations": "Mataas na kalidad ng tubo, kable ng kuryente at linya ng sanitasyon",
  "Full house handover with a 15-Year Structural Warranty": "Kumpletong turnover ng bahay na may 15-Taong Structural Warranty",
  "Full house handover with a 5-Year Structural Warranty": "Kumpletong turnover ng bahay na may 15-Taong Structural Warranty",
  "Inquire Residential Build": "Mag-inquire sa Bahay",
  "Flexible Payment Options": "May Kakayahang Umangkop na Bayaran",
  "Financing built around your titled property": "Financing na iniaakma sa iyong lupang may titulo",
  "Titled Lot Financing": "Financing sa Tituladong Lote",
  "TITLED LOT FINANCING": "FINANCING SA TITULADONG LOTE",
  "Special program for titled lot owners across Bulacan and Central Luzon. Build your dream home with flexible payment stages and Pag-IBIG or bank loan assistance.":
    "Espesyal na programa para sa may-ari ng may titulong lote sa Bulacan at Gitnang Luzon. Ipatayo ang iyong pangarap na tahanan na may flexible na hulog at tulong sa Pag-IBIG o bank loan.",
  "An exclusive program for lot owners across Bulacan, Metro Manila, and Central Luzon. Start building your home without waiting for full cash upfront, backed by flexible step-by-step payments and loan guidance.":
    "Isang eksklusibong programa para sa mga may-ari ng lote sa Bulacan, Metro Manila, at Gitnang Luzon. Simulan ang pagpapatayo ng bahay kahit walang buong cash agad, sa tulong ng hulugan bawat yugto at gabay sa pautang.",
  "Step-by-step progress billing with zero surprise costs": "Hulugan bawat yugto nang walang nakatagong bayarin",
  "Pag-IBIG Housing Loan end-to-end processing & documentation": "Buong pag-aasikaso ng papeles sa Pag-IBIG Housing Loan",
  "Major commercial bank loan packaging assistance": "Tulong sa pag-aayos ng loan sa mga bangko",
  "Transparent milestone billing so you only pay as each stage is done": "Tapat na singil bawat yugto kaya magbabayad ka lamang habang natatapos ang bawat bahagi",
  "Apply for BNPL": "Mag-apply sa BNPL",
  "Architectural & Engineering": "Arkitektura at Inhinyeriya",
  "ARCHITECTURAL & ENGINEERING": "ARKITEKTURA AT INHINYERIYA",
  "Signed & Sealed Plans": "Plano na May Pirma at Tatak",
  "Signed & Sealed Plans & Permits": "Plano na May Pirma at Tatak at Permit",
  "Licensed Architects & Engineers": "Mga Lisensyadong Arkitekto at Inhinyero",
  "Full engineering blueprints ready for municipal approval": "Kumpletong blueprint na handa para sa pag-apruba sa munisipyo",
  "Complete architectural blueprints and structural calculations prepared by licensed professionals, with full assistance in getting city building permits.":
    "Kumpletong mga blueprint sa arkitektura at kalkulasyon sa istruktura na inihanda ng mga lisensyadong propesyonal, na may buong tulong sa pagkuha ng building permit sa lungsod.",
  "Complete, fully certified architectural and engineering plans signed and sealed by licensed Architects, Civil Engineers, Master Plumbers, and Electrical Engineers, backed by full assistance in securing city building permits.":
    "Kumpleto at sertipikadong mga plano na may pirma at tatak ng mga lisensyadong Arkitekto, Civil Engineer, Master Plumber, at Electrical Engineer, kalakip ang buong tulong sa pagkuha ng permit.",
  "Architectural blueprints, site plans & room layouts": "Architectural blueprints, site plans at layout ng mga kwarto",
  "Earthquake-tested structural plan & soil condition analysis": "Disenyong sinubok sa lindol at pagsusuri sa lupa",
  "Electrical wiring layout, load computations & plumbing diagrams": "Plano ng kuryente, load computations at linya ng tubo",
  "Bulacan & NCR LGU Building Permit submission assistance": "Tulong sa pagpapasa ng Building Permit sa LGU ng Bulacan at NCR",
  "Order Blueprint Package": "Kumuha ng Blueprint Package",
  "Commercial & Warehouses": "Komersyal at Bodega",
  "Commercial Buildings & Warehouses": "Mga Gusaling Komersyal at Bodega",
  "Commercial & Project Supply": "Komersyal at Suplay ng Proyekto",
  "Warehouses & In-House Logistics": "Bodega at Direktang Suplay",
  "WAREHOUSES & IN-HOUSE LOGISTICS": "BODEGA AT DIREKTANG SUPLAY",
  "Spacious steel buildings and commercial rental spaces": "Maluluwag na gusaling bakal at paupahang komersyal",
  "We construct durable commercial spaces, logistics buildings, retail units, and storage warehouses built with strong structural steel framing for wide open floor space and heavy daily use.":
    "Nagtatayo kami ng matitibay na komersyal na espasyo, gusali para sa logistika, puwesto sa negosyo, at mga bodega gamit ang bakal na balangkas para sa malawak na espasyo.",
  "Commercial buildings, steel warehouses, home renovations, and dedicated in-house materials delivered right to your job site.":
    "Mga gusaling komersyal, bodega ng bakal, pagkukumpuni ng bahay, at direktang materyales na inihahatid sa mismong gawaan.",
  "Heavy-duty structural steel framing and wide columns": "Matibay na structural steel framing at malalapad na poste",
  "Reinforced heavy-duty concrete slab pouring for vehicle traffic": "Pinatibay na sahig na semento na angkop sa mabibigat na sasakyan",
  "Integrated fire protection, industrial ventilation & loading bays": "Proteksyon sa sunog, bentilasyon at mga loading bay",
  "Clear project milestone scheduling with on-site safety standards": "Malinaw na iskedyul ng bawat yugto na may mataas na pamantayan sa kaligtasan",
  "Inquire Commercial Space": "Mag-inquire sa Komersyal",
  "In-House Materials & Supply": "Sariling Materyales at Suplay",
  "In-House Project Materials & Supply": "Direktang Materyales at Suplay sa Proyekto",
  "Materials dedicated exclusively to our own construction builds": "Mga materyales na eksklusibong nakalaan sa sarili naming mga proyekto",
  "Zero retail markups and zero site delays. MCPA is not an open retail hardware store—our direct materials supply and logistics fleet are dedicated exclusively to our own construction and design-and-build projects. We test, prepare, and transport certified steel rebars, structural concrete, and aggregates directly to your build site.":
    "Walang patong na presyo at walang pagkaantala sa gawaan. Ang MCPA ay hindi tingiang tindahan ng hardware—ang aming direktang suplay at sariling mga truck ay nakalaan lamang para sa sarili naming mga proyekto sa konstruksyon. Sinusuri, inihahanda, at inihahatid namin ang sertipikadong bakal, semento, buhangin, at graba nang direkta sa iyong gawaan.",
  "Certified heavy-duty steel rebars tested for strength": "Sertipikadong bakal na sinubok ang katatagan",
  "Tested ready-mix structural concrete for strong foundations": "Nasubok na ready-mix na semento para sa matibay na pundasyon",
  "Quality-screened clean washed sand, crushed gravel, and base aggregates": "Malinis na buhangin, graba, at mga base aggregate na de-kalidad",
  "Dedicated fleet of dump trucks ensuring zero project delivery delays": "Sariling mga dump truck upang masigurong walang antala sa paghahatid",
  "Inquire Design & Build": "Mag-inquire sa Disenyo at Gawa",
  "Home Renovations & Upgrades": "Renovasyon at Pagpapaganda ng Bahay",
  "Renovations & Home Extensions": "Renovasyon at Pagpapalawak ng Bahay",
  "Refresh, expand, and strengthen existing homes": "Pagandahin, palawakin, at patibayin ang kasalukuyang bahay",
  "Complete residential extensions, modern exterior upgrades, vertical second-floor additions, and commercial tenant fit-outs with careful structural checks before any work begins.":
    "Kumpletong pagpapalawak ng bahay, modernong exterior, pagdadagdag ng ikalawang palapag, at pagsasaayos ng commercial space na may masusing pagsusuri sa istruktura bago magsimula.",
  "Thorough structural check of existing posts and foundations": "Masusing pagsusuri sa istruktura ng mga kasalukuyang poste at pundasyon",
  "Second-floor vertical expansions & roof deck conversions": "Pagpapatayo ng ikalawang palapag at roof deck",
  "Modern architectural cladding, glass railings & lighting updates": "Modernong cladding sa arkitektura, glass railing, at bagong mga ilaw",
  "Complete plumbing and electrical re-piping & rewiring": "Kumpletong pagpapalit ng linya ng tubo at kable ng kuryente",
  "Plan Renovation": "Magplano ng Renovasyon",
  "Key Deliverables:": "Mga Pangunahing Matatanggap:",
  "Key Deliverables": "Mga Pangunahing Matatanggap",
  "Why MCPA Services Stand Out": "Bakit Namumukod-tangi ang mga Serbisyo ng MCPA",
  "No Contractor Markups. No Compromised Blueprints.": "Walang Patong ng Kontratista. Walang Mahinang Plano.",
  "Traditional contractors purchase materials from third-party hardware stores at retail prices, passing high markup costs and delivery delays onto the client. Because MCPA operates its own dedicated in-house supply and logistics fleet exclusively for our construction projects, your build receives certified, batch-tested materials directly on-site—guaranteeing authentic structural quality with zero middleman markups.":
    "Ang mga karaniwang kontratista ay bumibili ng materyales sa mga tindahan ng hardware sa presyong tingi, kaya naipapasa ang mataas na patong sa gastos at pagkaantala sa paghahatid sa kliyente. Dahil ang MCPA ay may sariling imbakan ng materyales at mga sasakyan para sa aming mga proyekto, ang iyong bahay ay tumatanggap ng mga sertipikado at nasubok na materyales nang direkta sa mismong gawaan—garantisadong de-kalidad at walang patong ng ahente.",
  "Book a Consultation": "Mag-book ng Konsultasyon",
  "Explore Completed Projects": "Tuklasin ang mga Natapos na Proyekto",

  // Craft in Motion
  "Built by hands.": "Itinayo ng mga Kamay.",
  "Perfected by process.": "Pinasakdal ng Proseso.",
  "Every project is managed with dedicated on-site principals and transparent weekly reporting.":
    "Bawat proyekto ay pinamamahalaan ng mga lisensyadong eksperto sa mismong gawaan at may tapat na lingguhang ulat.",
  "Explore The Process": "Tuklasin ang Proseso",
  "Ground-Up Construction Timelapse": "Timelapse ng Pagtatayo mula Pundasyon",
  "Modern Tropical Bungalow": "Modernong Tropikal na Bungalow",
  "2-Storey Luxury Residence": "2-Palapag na Marangyang Tirahan",
  "Structural Elevation Timelapse": "Timelapse ng Pagpapatayo ng Istruktura",
  "Single-Storey Modern Estate": "Isang Palapag na Modernong Tirahan",
  "Foundation & Framing Timelapse": "Timelapse ng Pundasyon at Balangkas",
  "Flickertech Commercial Facility": "Pasilidad Pangkomersyo ng Flickertech",
  "Industrial Steel Canopy Build": "Pagtatayo ng Industriyal na Bakal na Canopy",
  "Tropical Open-Concept Living": "Tropikal na Bukas na Sala",
  "Interior Architectural Walkthrough": "Arkitektural na Paglilibot sa Loob ng Bahay",
  "Courtyard Villa & Grand Suite": "Courtyard Villa at Malaking Kwarto",
  "Interior Architectural Montage": "Montage ng Disenyo sa Loob ng Bahay",

  // Portfolio & Projects Page
  "Portfolio · Selected Works": "Portfolio · Mga Napiling Proyekto",
  "Built to": "Itinayo Para",
  "Last Centuries": "Tumagal ng Ilang Daang Taon",
  "Real structures built across Bulacan and Central Luzon. Each project reflects our commitment to structural excellence and transparent execution.":
    "Mga totoong proyektong naitayo sa Bulacan at Gitnang Luzon. Bawat proyekto ay patunay ng aming tibay sa paggawa at tapat na serbisyo.",
  "Ready to construct your modern sanctuary?": "Handa ka na bang itayo ang iyong modernong tahanan?",
  "Schedule a pre-consultation session to review lot feasibility, custom architectural floor plans, and flexible financing timelines.":
    "Mag-iskedyul ng pre-consultation para masuri ang lote, makita ang mga floor plan, at malaman ang mga opsyon sa pagbabayad.",
  "Schedule a Consultation": "Mag-iskedyul ng Konsultasyon",
  "Explore Services": "Tuklasin ang mga Serbisyo",
  "Meridian Modern Residence": "Meridian Modern Residence",
  "Two-storey contemporary home with a spacious second-floor balcony, reinforced concrete framing, perimeter fence, and complete turnkey finishing.":
    "Dalawang palapag na modernong tahanan na may maluwag na balkonahe sa ikalawang palapag, pinatibay na kongkretong balangkas, bakod, at kumpletong turnkey finishing.",
  "Tabang Commercial Complex": "Tabang Commercial Complex",
  "Commercial facility and supply yard featuring high-spec structural steel trusses, modern storefront facades, and heavy-duty logistics access.":
    "Pasilidad na pangkomersyo at imbakan ng suplay na may matibay na bakal na trusses, modernong harapan, at daanan para sa mabibigat na sasakyan.",
  "Grand Royale Executive Villa": "Grand Royale Executive Villa",
  "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 15-year structural warranty.":
    "Pasadyang dalawang palapag na marangyang tahanan na itinayo gamit ang mga planong may pirma at tatak, granite finishes, de-kalidad na kagamitan, at 15-taong structural warranty.",
  "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 5-year structural warranty.":
    "Pasadyang dalawang palapag na marangyang tahanan na itinayo gamit ang mga planong may pirma at tatak, granite finishes, de-kalidad na kagamitan, at 15-taong structural warranty.",
  "Pampanga Zen Sanctuary": "Pampanga Zen Sanctuary",
  "Tropical minimalist residence with high-ceiling living zones, climate-resilient roof overhangs, and funded via our Build Now, Pay Later program.":
    "Tropikal at minimalistang tirahan na may mataas na kisame, bubong na angkop sa klima, at pinondohan sa pamamagitan ng aming programang Build Now, Pay Later.",
  "North Industrial Logistics Hub": "North Industrial Logistics Hub",
  "Heavy-duty commercial warehouse with reinforced concrete flooring, wide open storage bays, and built using our dedicated in-house materials.":
    "Matibay na komersyal na bodega na may pinatibay na sahig na kongkreto, malalawak na imbakan, at itinayo gamit ang aming sariling mga materyales.",
  "Skyline Contemporary Residence": "Skyline Contemporary Residence",
  "Modern multi-level urban residence with earthquake-tested structural framing, spacious balcony views, and complete municipal building permits.":
    "Modernong multi-level na urban residence na may balangkas na sinubok laban sa lindol, malawak na tanawin sa balkonahe, at kumpletong building permit sa munisipyo.",

  // Process Section & /process Page
  "Our 4-Step Building Journey": "Aming 4 na Hakbang sa Pagpapatayo",
  "The MCPA Process": "Ang Proseso ng MCPA",
  "The": "Ang",
  "Current Step:": "Kasalukuyang Hakbang:",
  "Stage 01": "Yugto 01",
  "Stage 02": "Yugto 02",
  "Stage 03": "Yugto 03",
  "Stage 04": "Yugto 04",
  "STAGE 01": "YUGTO 01",
  "STAGE 02": "YUGTO 02",
  "STAGE 03": "YUGTO 03",
  "STAGE 04": "YUGTO 04",
  "Site Visit": "Pagbisita sa Lote",
  "Plans & Permits": "Plano at Permit",
  "Construction": "Konstruksyon",
  "Turnover": "Turnover",
  "Discovery & Site Inspection": "Pagsusuri at Pagbisita sa Lote",
  "Discovery, Lot Check & Site Inspection": "Pagsusuri, Pagtingin sa Lote at Inspeksyon",
  "Soil evaluation, boundary check & design planning": "Pagsusuri sa lupa, hangganan at pagpaplano ng disenyo",
  "We meet with you, inspect your lot, check the land title, and evaluate the ground to ensure your property is ready for building.":
    "Makikipagkita kami sa iyo, susuriin ang lote, titingnan ang titulo, at susukatin ang lupa upang matiyak na handa na itong tayuan ng bahay.",
  "Before any construction begins, our licensed engineers and builders visit your titled property across Bulacan, Metro Manila, or Central Luzon to verify the land title and test the ground condition.":
    "Bago magsimula ang anumang gawa, bibisitahin ng aming mga lisensyadong inhinyero ang inyong lupang may titulo sa Bulacan, Metro Manila, o Gitnang Luzon upang beripikahin ang titulo at suriin ang kondisyon ng lupa.",
  "Phase 1: Initial Planning & Site Visit": "Yugto 1: Panimulang Plano at Pagbisita sa Lote",
  "Signed & Sealed Blueprints": "Plano na May Pirma at Tatak",
  "Signed & Sealed Blueprints & City Permits": "Plano na May Pirma at Tatak at Permit sa Lungsod",
  "Complete blueprints ready for municipal approval": "Kumpletong blueprint na handa para sa pag-apruba ng munisipyo",
  "Our licensed architects and engineers prepare your complete house plans, 3D color designs, and take care of your city building permits.":
    "Inihahanda ng aming mga lisensyadong arkitekto at inhinyero ang kumpletong plano, makabagong 3D na disenyo, at kami na ang bahala sa pag-aasikaso ng inyong building permit.",
  "Our licensed architects and civil engineers draft your complete house plans, detailed 3D color designs, and handle municipal building permit submissions.":
    "Ang aming mga lisensyadong arkitekto at civil engineer ang gagawa ng inyong kumpletong plano, 3D color design, at mag-aasikaso ng building permit sa munisipyo.",
  "Phase 2: Architectural Plans & Permits": "Yugto 2: Planong Pang-arkitektura at Permit",
  "Phase 2: Architectural Blueprints & Permits": "Yugto 2: Planong Pang-arkitektura at Permit",
  "Strong & Careful Construction": "Matibay at Maingat na Pagtatayo",
  "Solid Construction & Quality Materials": "Matatag na Konstruksyon at De-kalidad na Materyales",
  "Built with tested concrete, steel, and regular photo updates": "Itinayo gamit ang nasubok na semento, bakal, at regular na update sa larawan",
  "Our dedicated team builds your home using tested high-grade concrete and steel, sending you weekly photo updates every step of the way.":
    "Itinatayo ng aming bihasang manggagawa ang inyong tahanan gamit ang nasubok na semento at bakal, kalakip ang lingguhang update sa larawan sa bawat hakbang.",
  "We build your home strong from the ground up. Using our dedicated supply of certified high-grade steel and strong concrete, every stage is documented with photo updates.":
    "Itinatayo namin ang iyong bahay nang matibay mula sa lupa. Gamit ang aming sariling suplay ng sertipikadong bakal at de-kalidad na semento, bawat yugto ay may patunay sa larawan.",
  "Phase 3: Structural Building & Framing": "Yugto 3: Pagtatayo ng Istruktura at Balangkas",
  "House Turnover & Move-In": "Turnover ng Bahay at Paglipat",
  "Final Quality Inspection & Key Turnover": "Huling Inspeksyon sa Kalidad at Pag-abot ng Susi",
  "Room-by-room walkthrough and official key handover": "Pagsusuri sa bawat kwarto at opisyal na pagbibigay ng susi",
  "We do a thorough room-by-room walkthrough with you, secure your official Certificate of Occupancy, and hand over your house keys.":
    "Magsasagawa kami ng masusing pagsusuri sa bawat silid kasama ka, kukunin ang opisyal na Certificate of Occupancy, at ihahatid ang susi ng iyong bagong tahanan.",
  "The milestone you've waited for. We conduct a thorough room-by-room walkthrough with you, finalize the Certificate of Occupancy, and hand you the keys to your new home.":
    "Ang pinakahihintay mong sandali. Magsasagawa kami ng masusing pagsusuri sa bawat kwarto kasama ka, tatapusin ang Certificate of Occupancy, at iaabot ang mga susi ng iyong bagong bahay.",
  "The milestone you’ve waited for. We conduct a thorough room-by-room walkthrough with you, finalize the Certificate of Occupancy, and hand you the keys to your new home.":
    "Ang pinakahihintay mong sandali. Magsasagawa kami ng masusing pagsusuri sa bawat kwarto kasama ka, tatapusin ang Certificate of Occupancy, at iaabot ang mga susi ng iyong bagong bahay.",
  "Phase 4: Final Inspection & Move-In": "Yugto 4: Huling Inspeksyon at Paglipat",
  "Phase 4: Final Inspection & House Turnover": "Yugto 4: Huling Inspeksyon at Turnover ng Bahay",
  "What Happens In This Step:": "Ang Mangyayari sa Hakbang na Ito:",
  "Step Verification Checklist": "Talaan ng Pagsusuri sa Hakbang",
  "Land Title & Property Check": "Pagsusuri sa Titulo at Lote",
  "Soil Strength Inspection": "Pagsusuri sa Tibay ng Lupa",
  "Lot Boundary & Area Survey": "Pagsusuri sa Sukat at Hangganan ng Lote",
  "Architectural Design Consultation": "Konsultasyon sa Disenyo ng Bahay",
  "Complete Floor Plans & Elevations": "Kumpletong Floor Plan at Elevations",
  "Earthquake-Resistant Structural Design": "Disenyong Matibay Laban sa Lindol",
  "City & Municipal Building Permits": "Building Permit sa Lungsod at Munisipyo",
  "3D Exterior & Interior Color Views": "Makatotohanang 3D Exterior at Interior",
  "Solid Foundation & Footing Pouring": "Matatag na Pundasyon at Pagbuhos ng Semento",
  "Strong Reinforced Columns & Beams": "Pinatibay na mga Poste at Bigas",
  "Direct In-House Quality Materials": "Direkta at De-kalidad na Materyales",
  "Regular Progress Photo Reports": "Regular na Ulat ng Progreso sa Larawan",
  "Room-by-Room Quality Walkthrough": "Pagsusuri sa Bawat Kwarto Kasama ang May-ari",
  "Certificate of Occupancy Assistance": "Tulong sa Pagkuha ng Certificate of Occupancy",
  "Official House Key Turnover": "Opisyal na Pag-abot ng Susi ng Bahay",
  "Complete Final House Blueprints & Warranty": "Kumpletong Blueprint at Dokumento ng Warranty",
  "Stage Highlights": "Mga Tampok sa Yugto",
  "Key Details": "Pangunahing Detalye",
  "Main Activity:": "Pangunahing Aktibidad:",
  "Main Activity": "Pangunahing Aktibidad",
  "Quality Standards & Clearances:": "Pamantayan sa Kalidad at mga Clearance:",
  "Quality Standards & Clearances": "Pamantayan sa Kalidad at mga Clearance",
  "Project Coverage & Supervision:": "Sakop ng Proyekto at Pangangasiwa:",
  "Project Coverage & Supervision": "Sakop ng Proyekto at Pangangasiwa",
  "Bulacan, Metro Manila & Central Luzon": "Bulacan, Metro Manila at Gitnang Luzon",
  "Solid Ground Tested & Land Title Checked": "Nasubok ang Tibay ng Lupa at Natingnan ang Titulo",
  "Property Boundary Survey & Consultation": "Pagsusuri sa Hangganan ng Lote at Konsultasyon",
  "Licensed Architects & Civil Engineers": "Mga Lisensyadong Arkitekto at Civil Engineer",
  "Complete City Building Permits & Approvals": "Kumpletong Building Permit at Pag-apruba sa Lungsod",
  "Realistic 3D House Renders & Blueprints": "Makatotohanang 3D House Renders at Blueprint",
  "Certified Heavy-Duty Steel Bars": "Sertipikadong Matibay na Bakal",
  "Strong Ready-Mix Concrete (3000 PSI)": "Matibay na Ready-Mix na Semento (3000 PSI)",
  "Weekly Photo Updates to Your Phone": "Lingguhang Update sa Larawan sa Iyong Telepono",
  "Official House Acceptance & Handover": "Opisyal na Pagtanggap at Turnover ng Bahay",
  "City Certificate of Occupancy Approved": "Aprubadong Certificate of Occupancy mula sa Lungsod",
  "Official Key Handover & House Plans Package": "Opisyal na Pag-abot ng Susi at Pakete ng Plano",
  "Land Title Verification · Ground Soil Strength Check": "Beripikasyon ng Titulo · Pagsusuri sa Tibay ng Lupa",
  "Land title verification with official property records": "Beripikasyon ng titulo sa mga opisyal na talaan ng ari-arian",
  "Ground and soil inspection to ensure a strong foundation": "Inspeksyon sa lupa upang masigurado ang matibay na pundasyon",
  "Lot boundary check and orientation survey": "Pagsusuri sa hangganan ng lote at tamang pwesto ng araw at hangin",
  "Personal consultation on your dream house style and budget": "Personal na konsultasyon sa estilo ng iyong pangarap na bahay at badyet",
  "Site Inspection Report & Estimated Project Cost Breakdown": "Ulat sa Inspeksyon ng Lote at Pagtatantya ng Gastos sa Proyekto",
  "Licensed Architects & Engineers · Earthquake-Resistant Design · Building Permits":
    "Mga Lisensyadong Arkitekto at Inhinyero · Disenyong Laban sa Lindol · Mga Permit sa Pagtatayo",
  "Complete architectural floor plans, exterior looks & room layouts":
    "Kumpletong architectural floor plans, exterior na anyo at layout ng bawat kwarto",
  "Earthquake-resistant structural calculations for columns and foundation":
    "Kalkulasyon sa istruktura na laban sa lindol para sa mga poste at pundasyon",
  "Complete electrical wiring plans and plumbing layouts": "Kumpletong plano sa kable ng kuryente at linya ng tubig",
  "Full assistance in submitting and securing City Building Permits":
    "Buong tulong sa pagpapasa at pagkuha ng Building Permit sa Lungsod",
  "Approved City Building Permits & Official Sealed Blueprints": "Aprubadong Building Permit at Opisyal na Selyadong Blueprint",
  "Certified Steel Bars · Strong 3000 PSI Concrete · Weekly Photo Reports":
    "Sertipikadong Bakal · Matibay na 3000 PSI Semento · Lingguhang Ulat sa Larawan",
  "Foundation excavation, solid footing and steel rebar tying": "Paghukay ng pundasyon, matibay na footing at pagtatali ng bakal",
  "Supervised concrete pouring with strength testing": "Pinangangasiwaang pagbuhos ng semento na may pagsusuri sa tibay",
  "Reinforced concrete posts, beams, and floor slabs": "Pinatibay na poste, biga, at sahig na semento",
  "Weekly photo updates sent directly to your phone and online portal":
    "Lingguhang update sa larawan na ipinapadala sa iyong telepono at online portal",
  "Weather-tight, solid house structure ready for finishing": "Matatag na istruktura ng bahay na handa na para sa finishing",
  "Official Certificate of Occupancy · Joint Walkthrough · 15-Year Structural Warranty":
    "Opisyal na Certificate of Occupancy · Pagsusuri Kasama Ka · 15-Taong Structural Warranty",
  "Official Certificate of Occupancy · Joint Walkthrough · 5-Year Structural Warranty":
    "Opisyal na Certificate of Occupancy · Pagsusuri Kasama Ka · 15-Taong Structural Warranty",
  "Complete tile works, paint, lighting, windows and bathroom fixtures": "Kumpletong tiles, pintura, ilaw, bintana, at gamit sa banyo",
  "Detailed room-by-room quality walkthrough with the homeowner": "Detalyadong pagsusuri sa kalidad ng bawat silid kasama ang may-ari ng bahay",
  "Assistance in securing the official Certificate of Occupancy": "Tulong sa pagkuha ng opisyal na Certificate of Occupancy",
  "Ceremonial house key turnover, complete house plans & 15-year warranty":
    "Opisyal na pag-abot ng susi ng bahay, kumpletong plano at 15-taong warranty",
  "Ceremonial house key turnover, complete house plans & 5-year warranty":
    "Opisyal na pag-abot ng susi ng bahay, kumpletong plano at 15-taong warranty",
  "Official Certificate of Occupancy, House Keys & 15-Year Structural Warranty":
    "Opisyal na Certificate of Occupancy, mga Susi ng Bahay at 15-Taong Structural Warranty",
  "Official Certificate of Occupancy, House Keys & 5-Year Structural Warranty":
    "Opisyal na Certificate of Occupancy, mga Susi ng Bahay at 15-Taong Structural Warranty",
  "Milestone-Based Payments": "Bayad Nakabatay sa Natapos na Yugto",
  "You only pay for construction stages that are inspected, approved, and verified with photos.":
    "Magbabayad ka lamang para sa mga yugto ng paggawa na nainspeksyon, naaprubahan, at napatunayan sa larawan.",
  "Direct In-House Materials": "Direktang Sariling Materyales",
  "Zero compromised materials. All steel bars and concrete aggregates come directly from our own verified logistics fleet.":
    "Walang tipid o mahinang materyales. Lahat ng bakal, buhangin, at graba ay galing sa sarili naming sasakyan at imbakan.",
  "Regular Photo Updates": "Regular na Update sa Larawan",
  "Clear photo updates sent directly to your phone and online portal, so you always know the exact status of your home.":
    "Malinaw na update sa larawan na ipinapadala sa iyong telepono at online portal upang lagi mong alam ang lagay ng iyong bahay.",
  "Licensed On-Site Supervision": "May Lisensyadong Tagapangasiwa sa Gawaan",
  "Every major construction stage is supervised in person by licensed Civil Engineers and Master Builders.":
    "Bawat mahalagang yugto ng konstruksyon ay personal na binabantayan ng mga lisensyadong Civil Engineer at Master Builder.",
  "Clear Step-by-Step Progress · Regular Updates": "Malinaw na Hakbang-hakbang na Progreso · Regular na Updates",
  "Our 4-Stage": "Aming 4 na Yugto sa",
  "Construction Process": "Proseso ng Pagtatayo",
  "We remove worries from building your home through clear step-by-step updates, weekly photo logs sent to your phone, and guaranteed quality materials. Here is how your dream home is built.":
    "Inaalis namin ang iyong pangamba sa pagpapatayo ng bahay sa pamamagitan ng malinaw na ulat bawat hakbang, lingguhang larawan sa iyong telepono, at de-kalidad na materyales. Ganito itinatayo ang iyong pangarap na tahanan.",
  "What You Receive After This Step:": "Ang Matatanggap Mo Pagkatapos ng Hakbang na Ito:",
  "Inquire About This Step": "Magtanong Tungkol sa Hakbang na Ito",
  "The MCPA Standard": "Ang Pamantayan ng MCPA",
  "Why Our Process Builds Trust": "Bakit Maaasahan ang Aming Proseso",
  "Step 01 Starts Here": "Dito Nagsisimula ang Hakbang 01",
  "Ready to Begin Your Site Visit & Consultation?": "Handa Ka Na Bang Simulan ang Pagbisita sa Lote at Konsultasyon?",
  "Talk directly with our licensed builders. We'll visit your property, answer your questions, and guide you through each step of building your home.":
    "Makipag-usap nang direkta sa aming mga lisensyadong tagapagtayo. Bibisitahin namin ang iyong lote, sasagutin ang iyong mga katanungan, at gagabayan ka sa bawat hakbang.",
  "Talk directly with our licensed builders. We’ll visit your property, answer your questions, and guide you through each step of building your home.":
    "Makipag-usap nang direkta sa aming mga lisensyadong tagapagtayo. Bibisitahin namin ang iyong lote, sasagutin ang iyong mga katanungan, at gagabayan ka sa bawat hakbang.",
  "Book Free Consultation": "Mag-book ng Libreng Konsultasyon",
  "View Full Services": "Tingnan Lahat ng Serbisyo",

  // Callout Banner (Home)
  "Begin Your Project": "Simulan ang Iyong Proyekto",
  "Let's Build Something": "Bumuo Tayo ng Isang",
  "Let’s Build Something": "Bumuo Tayo ng Isang",
  "Extraordinary": "Pambihirang Tahanan",
  "Whether you have land ready to develop or need guidance from site profiling to turnover, our engineering team is ready to collaborate.":
    "May lupa ka mang handa nang tayuan o kailangan ng gabay mula sa pagsusuri hanggang sa turnover, handang makipagtulungan ang aming engineering team.",
  "Review Portfolio": "Tingnan ang Portfolio",
  "Official Channels:": "Mga Opisyal na Channel:",

  // Pre-Consultation Booking Form (/book & module)
  "Pre-Consultation Booking": "Pagpapareserba ng Konsultasyon",
  "Pre-Consultation Booking · Full-Service Design & Build": "Pagpapareserba ng Konsultasyon · Kumpletong Disenyo at Gawa",
  "Schedule Your Project Consultation": "Mag-iskedyul ng Konsultasyon sa Proyekto",
  "Dynamic Client Profiling": "Detalyadong Profile ng Kliyente",
  "Skip intimidating and uninformative contact forms. Provide your project parameters below, and our engineering team compiles an actionable Client Profile Brief prior to our first meeting. Serving Bulacan, Metro Manila, Pampanga, and Central Luzon.":
    "Iwanan ang mga nakalilitong form. Ibigay ang mga detalye ng iyong proyekto sa ibaba, at ihahanda ng aming engineering team ang Client Profile Brief bago ang ating unang pagpupulong. Naglilingkod sa Bulacan, Metro Manila, Pampanga, at Gitnang Luzon.",
  "Inquiring for Architectural Style:": "Nagtatanong para sa Estilong Pang-arkitektura:",
  "Inquiring for Architectural Style": "Nagtatanong para sa Estilong Pang-arkitektura",
  "Step 1: Project Details": "Hakbang 1: Detalye ng Proyekto",
  "Step 2: Schedule & Meeting Mode": "Hakbang 2: Iskedyul at Paraan ng Pagpupulong",
  "Step 3: Contact Information": "Hakbang 3: Impormasyon sa Pakikipag-ugnayan",
  "Project Type": "Uri ng Proyekto",
  "PROJECT TYPE": "URI NG PROYEKTO",
  "Site & Lot": "Lote at Lokasyon",
  "SITE & LOT": "LOTE AT LOKASYON",
  "Client Info & Pegs": "Impormasyon ng Kliyente at mga Peg",
  "CLIENT INFO & PEGS": "IMPORMASYON NG KLIYENTE AT MGA PEG",
  "Select Project Category": "Pumili ng Kategorya ng Proyekto",
  "Commercial Building": "Gusaling Komersyal",
  "Commercial / Industrial": "Komersyal / Industriyal",
  "Warehouse Structure": "Istruktura ng Bodega",
  "Renovation & Fit-Out": "Renovasyon at Pagsasaayos",
  "Renovation & Extension": "Renovasyon at Pagpapalawak",
  "Blueprint Package Only": "Pakete ng Blueprint Lamang",
  "Preferred Style / Inspiration": "Gustong Estilo / Inspirasyon",
  "e.g. Meridian Residence, Modern Zen, Industrial Minimalist": "hal. Meridian Residence, Modern Zen, Industrial Minimalist",
  "Financing / Payment Program": "Programa sa Pagbabayad / Financing",
  "Financing Preference": "Paraan ng Pagbabayad",
  "Build Now, Pay Later Program (Titled Lot)": "Programang Build Now, Pay Later (May Titulo)",
  "Spot Cash / Progress Billing": "Spot Cash / Progress Billing",
  "Pag-IBIG Housing Loan": "Pag-IBIG Housing Loan",
  "Bank Financing": "Pautang sa Bangko",
  "Pag-IBIG / Bank Loan Assistance": "Tulong sa Pag-IBIG / Bank Loan",
  "Milestone Progress Billing": "Bayad Bawat Yugto ng Gawa",
  "Direct Cash Contract": "Direktang Kontratang Cash",
  "Continue To Site Status": "Magpatuloy sa Katayuan ng Lote",
  "Property / Lot Status (May Lupa Na Ba?)": "Katayuan ng Ari-arian / Lote (May Lupa Na Ba?)",
  "Lot Status": "Katayuan ng Lote",
  "Titled & Ready (TCT)": "May Titulo at Handa Na (TCT)",
  "Clean Transfer Certificate of Title (Eligible for BNPL)": "Malinis na Transfer Certificate of Title (Kwalipikado sa BNPL)",
  "Inside Gated Subdivision": "Nasa Loob ng Subdibisyon",
  "Bulacan / Pampanga / NCR HOA Guidelines": "Mga Alituntunin ng HOA sa Bulacan / Pampanga / NCR",
  "Looking / In Acquisition": "Naghahanap / Bibilhin Pa Lamang",
  "Need site evaluation and assistance": "Kailangan ng pagsusuri sa lote at gabay",
  "Rights / Tax Declaration": "Rights / Tax Declaration",
  "Purchasing / In Process": "Bibilhin Pa Lamang / Pinoproseso",
  "No Lot Yet (Looking)": "Wala Pa (Naghahanap Pa)",
  "Site Location (City / Province) *": "Lokasyon ng Lote (Lungsod / Lalawigan) *",
  "Site Location (City / Province)": "Lokasyon ng Lote (Lungsod / Lalawigan)",
  "e.g. Plaridel Bulacan, Malolos, or Quezon City": "hal. Plaridel Bulacan, Malolos, o Lungsod Quezon",
  "Lot Area (sqm)": "Sukat ng Lote (sqm)",
  "Estimated Lot Area (sqm)": "Tinatayang Sukat ng Lote (sqm)",
  "e.g. 250": "hal. 250",
  "Target Start Date": "Target na Petsa ng Simula",
  "e.g. Q4 2025 or Within 3 Months": "hal. Q4 2025 o sa loob ng 3 Buwan",
  "Project Location": "Lokasyon ng Proyekto",
  "Lot Geolocation & Map Coordinates (Flowchart Step 4)": "Koordinasyon at Mapa ng Lote (Hakbang 4)",
  "Selected Coordinates / Lot Pin": "Napiling Koordinasyon / Pin sa Mapa",
  "Quick Presets:": "Mabilisang Pagpili:",
  "Plaridel HQ": "Plaridel HQ",
  "Malolos": "Malolos",
  "Guiguinto": "Guiguinto",
  "San Fernando": "San Fernando",
  "NCR / QC": "NCR / QC",
  "Proceed To Meeting Booking": "Magpatuloy sa Pag-book ng Pagpupulong",
  "Location Type": "Uri ng Lokasyon",
  "Client Demographic / Current Location *": "Kinaroroonan ng Kliyente / Kasalukuyang Lokasyon *",
  "Client Demographic / Current Location": "Kinaroroonan ng Kliyente / Kasalukuyang Lokasyon",
  "Local": "Lokal (Pilipinas)",
  "OFW": "OFW (Ibang Bansa)",
  "Local Resident (Philippines)": "Nasa Pilipinas (Lokal)",
  "Based locally in Bulacan, Metro Manila, or Central Luzon": "Nakatira sa Bulacan, Metro Manila, o Gitnang Luzon",
  "OFW / Based Overseas": "OFW / Nasa Ibang Bansa",
  "OFW Priority": "Prayoridad sa OFW",
  "Building a dream home from abroad (Requires online video meet)": "Nagtatayo ng pangarap na tahanan mula sa ibang bansa (Online video meeting)",
  "Meeting Mode": "Paraan ng Pagpupulong",
  "1st Consultation Meeting Mode Preference *": "Gustong Paraan ng Unang Konsultasyon *",
  "1st Consultation Meeting Mode Preference": "Gustong Paraan ng Unang Konsultasyon",
  "Online Meeting (Google Meet)": "Online Meeting (Google Meet)",
  "Online Meeting (Google Meet / Zoom)": "Online Meeting (Google Meet / Zoom)",
  "Ideal for OFWs & remote homeowners": "Angkop para sa mga OFW at malalayong may-ari ng bahay",
  "In-Person Office Visit": "Personal na Pagbisita sa Tanggapan",
  "Personal meeting at MCPA Tabang, Plaridel Office": "Personal na pakikipagkita sa Tanggapan ng MCPA sa Tabang, Plaridel",
  "Preferred Date": "Gustong Petsa",
  "Preferred Meeting Date": "Gustong Petsa ng Pagpupulong",
  "Preferred Time Slot": "Gustong Oras",
  "09:00 AM - 10:30 AM": "09:00 AM - 10:30 AM",
  "09:00 AM - 10:30 AM (Morning)": "09:00 AM - 10:30 AM (Umaga)",
  "02:00 PM - 03:30 PM": "02:00 PM - 03:30 PM",
  "02:00 PM - 03:30 PM (Afternoon)": "02:00 PM - 03:30 PM (Hapon)",
  "07:00 PM - 08:30 PM (OFW Friendly)": "07:00 PM - 08:30 PM (Oras para sa OFW)",
  "07:00 PM - 08:30 PM (Special OFW Evening Slot)": "07:00 PM - 08:30 PM (Eksklusibong Oras sa Gabi para sa OFW)",
  "Full Name": "Buong Pangalan",
  "Your Full Name *": "Iyong Buong Pangalan *",
  "Your Full Name": "Iyong Buong Pangalan",
  "e.g. Arch. Roberto Cruz": "hal. Roberto Cruz",
  "Email Address": "Email Address",
  "Email Address *": "Email Address *",
  "Phone Number": "Numero ng Telepono",
  "Viber / Mobile Number *": "Numero ng Viber / Mobile *",
  "Viber / Mobile Number": "Numero ng Viber / Mobile",
  "+63 949 775 8239 or 09XX XXX XXXX": "+63 949 775 8239 o 09XX XXX XXXX",
  "Upload Land Title or Site Photos (Optional)": "Mag-upload ng Titulo o Larawan ng Lote (Opsyonal)",
  "Drop files here or click to browse": "Ilagay ang mga file dito o mag-click para pumili",
  "Attach Design Pegs / Lot Plan / Sketches (Optional)": "Maglakip ng mga Peg sa Disenyo / Plano ng Lote / Guhit (Opsyonal)",
  "Click to select design pegs (PDF, Images)": "Mag-click upang pumili ng mga peg sa disenyo (PDF, Larawan)",
  "Files will be securely indexed in your Client Profile Brief": "Ligtas na mai-index ang mga file sa iyong Client Profile Brief",
  "Submit Booking Request": "Ipasa ang Kahilingan sa Pag-book",
  "Submit Inquiry & Book 1st Meeting": "Ipasa ang Inquiry at I-book ang Unang Pagpupulong",
  "Booking Confirmed!": "Nakumpirma ang Pag-book!",
  "Reference Number:": "Numero ng Sanggunian:",
  "Thank you for scheduling a pre-consultation with MCPA Construction and Supply.":
    "Maraming salamat sa pagpapareserba ng pre-consultation sa MCPA Construction and Supply.",
  "Book Another Consultation": "Mag-book ng Isa Pang Konsultasyon",
  "Return to Home": "Bumalik sa Tahanan",
  "STATUS: PENDING REVIEW": "KATAYUAN: NAGHIHINTAY NG PAGSUSURI",
  "Inquiry & Appointment Registered": "Nairerehistro ang Inquiry at Appointment",
  "Bagong submit — naghihintay ma-review ng kumpanya. (Hindi pa quotation agad — for initial review & meeting scheduling)":
    "Bagong submit — naghihintay masuri ng kumpanya. (Hindi pa pinal na quotation — para sa unang pagsusuri at pag-iskedyul ng pulong)",
  "Reference Brief ID": "ID ng Sanggunian ng Brief",
  "CLIENT NAME": "PANGALAN NG KLIYENTE",
  "CLIENT STATUS": "KATAYUAN NG KLIYENTE",
  "MEETING MODE": "PARAAN NG PAGPUPULONG",
  "PREFERRED SLOT": "GUSTONG ORAS",
  "LOCATION": "LOKASYON",
  "LOT COORDINATES": "KOORDINASYON NG LOTE",
  "STYLE PEG": "ESTILONG PEG",
  "CONTACT": "KONTAK",
  "Submit Another Inquiry": "Magpasa ng Isa Pang Inquiry",
  "Return to Portfolio": "Bumalik sa Portfolio",
  "View Client Portal Demo →": "Tingnan ang Demo ng Client Portal →",
  "View Client Portal Demo &rarr;": "Tingnan ang Demo ng Client Portal →",

  // Footer & Legal
  "Direct Supply": "Direktang Suplay",
  "In-House Materials & Aggregates": "Sariling Materyales at Buhangin/Graba",
  "Project Delivery": "Paghahatid ng Proyekto",
  "Full-Service Design & Build": "Kumpletong Disenyo at Pagtatayo",
  "Financing Programs": "Mga Programa sa Pagbabayad",
  "Build Now, Pay Later (Titled Lot) & Pag-IBIG": "Build Now, Pay Later (May Titulo) at Pag-IBIG",
  "Engineering Standard": "Pamantayan sa Inhinyeriya",
  "Signed & Sealed Plans · Earthquake & Typhoon Ready": "Plano na May Pirma at Tatak · Handa sa Lindol at Bagyo",
  "Navigation": "Gabay sa Pahina",
  "Selected Works": "Mga Napiling Proyekto",
  "Our Process": "Aming Proseso",
  "Capabilities & Supply": "Kakayahan at Suplay",
  "Commercial & Industrial Warehouses": "Komersyal at Industriyal na Bodega",
  "House Renovations & Fit-Outs": "Renovasyon at Pag-aayos ng Bahay",
  "Construction Supply Logistics": "Logistika ng Suplay sa Konstruksyon",
  "Build Now, Pay Later (Titled Lot)": "Build Now, Pay Later (Tituladong Lote)",
  "Site Office & Contact": "Tanggapan at Kontak",
  "Headquarters & Office": "Pangunahing Tanggapan at Opisina",
  "Direct Mobile / Viber": "Direktang Mobile / Viber",
  "Available for Calls, SMS & Viber": "Maaaring Tawagan, I-text at I-Viber",
  "Available for Calls, SMS &amp; Viber": "Maaaring Tawagan, I-text at I-Viber",
  "Official Email": "Opisyal na Email",
  "Operating Hours": "Oras ng Operasyon",
  "Monday – Saturday: 8:00 AM – 5:00 PM PST": "Lunes – Sabado: 8:00 AM – 5:00 PM PST",
  "Monday - Saturday: 8:00 AM - 5:00 PM PST": "Lunes - Sabado: 8:00 AM - 5:00 PM PST",
  "Official Channels": "Mga Opisyal na Channel",
  "Project Briefings & Updates": "Mga Balita at Update sa Proyekto",
  "Enter client email...": "Ilagay ang iyong email...",
  "Subscribed to MCPA Briefings.": "Naka-subscribe na sa Balita ng MCPA.",
  "ALL RIGHTS RESERVED.": "LAHAT NG KARAPATAN AY NAKALAAN.",
  "ALL RIGHTS RESERVED": "LAHAT NG KARAPATAN AY NAKALAAN",
  "MCPA CONSTRUCTION AND SUPPLY. ALL RIGHTS RESERVED.": "MCPA CONSTRUCTION AND SUPPLY. LAHAT NG KARAPATAN AY NAKALAAN.",
  "Privacy Policy": "Patakaran sa Privacy",
  "Terms of Engagement": "Kasunduan sa Serbisyo",
  "Safety Code": "Kodigo sa Kaligtasan",
  "BACK TO TOP": "BUMALIK SA ITAAS",
  "Back to Top": "Bumalik sa Itaas",
};

// Compile multi-word phrases for deep substring and sentence replacement (sorted longest first)
const SORTED_PHRASES = Object.keys(TAGALOG_DICTIONARY)
  .filter((k) => k.length >= 4)
  .sort((a, b) => b.length - a.length)
  .map((k) => ({
    key: k,
    val: TAGALOG_DICTIONARY[k],
    hasSpaces: k.includes(" ") || k.includes("·") || k.includes("&") || k.includes(":") || k.includes("/"),
  }));

// Quick regex patterns for dynamic and parameterized UI strings
const DYNAMIC_PATTERNS = [
  {
    regex: /^Stage\s*0?(\d+)\s*\/\s*0?(\d+)$/i,
    replace: (_, p1, p2) => `Yugto 0${p1} / 0${p2}`,
  },
  {
    regex: /^Stage\s*0?(\d+)\s*of\s*0?(\d+)$/i,
    replace: (_, p1, p2) => `Yugto 0${p1} ng 0${p2}`,
  },
  {
    regex: /^Step\s*0?(\d+)\s*of\s*0?(\d+)$/i,
    replace: (_, p1, p2) => `Hakbang 0${p1} ng 0${p2}`,
  },
  {
    regex: /^Progress:\s*Step\s*0?(\d+)\s*of\s*0?(\d+)$/i,
    replace: (_, p1, p2) => `Progreso: Hakbang 0${p1} ng 0${p2}`,
  },
  {
    regex: /^Key Details\s*[·•\-]\s*Step\s*0?(\d+)$/i,
    replace: (_, p1) => `Pangunahing Detalye · Hakbang 0${p1}`,
  },
  {
    regex: /^Stage\s*0?(\d+)$/i,
    replace: (_, p1) => `Yugto 0${p1}`,
  },
  {
    regex: /^STAGE\s*0?(\d+)$/,
    replace: (_, p1) => `YUGTO 0${p1}`,
  },
  {
    regex: /^Step\s*0?(\d+)$/i,
    replace: (_, p1) => `Hakbang 0${p1}`,
  },
  {
    regex: /^STEP\s*0?(\d+)$/,
    replace: (_, p1) => `HAKBANG 0${p1}`,
  },
  {
    regex: /©\s*(\d{4})\s*MCPA CONSTRUCTION AND SUPPLY\.\s*ALL RIGHTS RESERVED\.?/i,
    replace: (_, year) => `© ${year} MCPA CONSTRUCTION AND SUPPLY. LAHAT NG KARAPATAN AY NAKALAAN.`,
  },
];

// Memoization cache for translated text nodes
const translationCache = new Map();

// Fast, intelligent translation helper for any text string
export function getTranslation(text) {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Check cache
  if (translationCache.has(trimmed)) {
    const cached = translationCache.get(trimmed);
    return text.replace(trimmed, cached);
  }

  // 1. Direct match
  if (TAGALOG_DICTIONARY[trimmed]) {
    const res = TAGALOG_DICTIONARY[trimmed];
    translationCache.set(trimmed, res);
    return text.replace(trimmed, res);
  }

  // 2. Case-insensitive direct match
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [enKey, tlVal] of Object.entries(TAGALOG_DICTIONARY)) {
    if (enKey.toLowerCase() === lowerTrimmed) {
      translationCache.set(trimmed, tlVal);
      return text.replace(trimmed, tlVal);
    }
  }

  // 3. Dynamic patterns (Stages, Steps, Copyright years)
  for (const pattern of DYNAMIC_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      const res = trimmed.replace(pattern.regex, pattern.replace);
      translationCache.set(trimmed, res);
      return text.replace(trimmed, res);
    }
  }

  // 4. Normalized quote / dash lookup
  const normalized = trimmed
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "—")
    .replace(/–/g, "-");

  if (TAGALOG_DICTIONARY[normalized]) {
    const res = TAGALOG_DICTIONARY[normalized];
    translationCache.set(trimmed, res);
    return text.replace(trimmed, res);
  }

  // 5. Deep Multi-word phrase replacement for composite or multi-sentence text nodes
  let output = trimmed;
  let hasReplaced = false;

  for (const item of SORTED_PHRASES) {
    if (item.hasSpaces) {
      if (output.includes(item.key)) {
        output = output.split(item.key).join(item.val);
        hasReplaced = true;
      }
    } else {
      // Word boundary match for single words (e.g. "Home", "Projects")
      const wordRegex = new RegExp(`\\b${item.key}\\b`, "g");
      if (wordRegex.test(output)) {
        output = output.replace(wordRegex, item.val);
        hasReplaced = true;
      }
    }
  }

  if (hasReplaced) {
    translationCache.set(trimmed, output);
    return text.replace(trimmed, output);
  }

  return text;
}

// Precompute Reverse Dictionary (Tagalog -> English) for instant clean reverting
const REVERSE_TAGALOG_MAP = new Map();
for (const [enKey, tlVal] of Object.entries(TAGALOG_DICTIONARY)) {
  if (enKey && tlVal && typeof tlVal === "string" && enKey.trim() !== tlVal.trim()) {
    REVERSE_TAGALOG_MAP.set(tlVal.trim(), enKey.trim());
  }
}

// Pre-sort reverse phrases longest first
const SORTED_REVERSE_PHRASES = Array.from(REVERSE_TAGALOG_MAP.entries()).sort(
  (a, b) => b[0].length - a[0].length
);

let activeObserver = null;
let isTranslatingActive = false;

export function stopAutomaticPageTranslation() {
  isTranslatingActive = false;
  if (activeObserver) {
    try {
      activeObserver.disconnect();
    } catch (e) {}
    activeObserver = null;
  }
}

const shouldSkipElement = (el) => {
  if (!el) return true;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(el.tagName)) return true;
  if (
    el.closest &&
    el.closest('[data-no-translate], [data-admin], #admin-root, .admin-page, [id*="admin"]')
  ) {
    return true;
  }
  return false;
};

// TreeWalker DOM Auto-Translator (Zero rate-limit, 100% offline, reactive & debounced)
export function installAutomaticPageTranslation() {
  if (typeof document === "undefined" || !document.body) return () => {};

  // NEVER translate admin pages! (Obey "pwera sa admin")
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return () => {};
  }

  // Stop any previous observer first
  stopAutomaticPageTranslation();
  isTranslatingActive = true;

  const translateNode = (node) => {
    if (!isTranslatingActive || !node) return;
    const parent = node.parentElement;
    if (shouldSkipElement(parent)) return;

    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;

    // Do not re-translate already translated nodes
    if (node.__mcpaTranslated) return;

    // Save original English content before any modification
    if (!node.__mcpaOriginal) {
      node.__mcpaOriginal = raw;
    }

    const translated = getTranslation(raw);
    if (translated && translated !== raw) {
      node.nodeValue = translated;
      node.__mcpaTranslated = true;
    }
  };

  const translateAttributes = (el) => {
    if (shouldSkipElement(el)) return;

    // Placeholder
    if (el.hasAttribute && el.hasAttribute("placeholder")) {
      const p = el.getAttribute("placeholder");
      if (!el.__mcpaOriginalPlaceholder) el.__mcpaOriginalPlaceholder = p;
      const trans = getTranslation(p);
      if (trans && trans !== p) el.setAttribute("placeholder", trans);
    }

    // Title attribute
    if (el.hasAttribute && el.hasAttribute("title")) {
      const t = el.getAttribute("title");
      if (!el.__mcpaOriginalTitle) el.__mcpaOriginalTitle = t;
      const trans = getTranslation(t);
      if (trans && trans !== t) el.setAttribute("title", trans);
    }

    // Aria-label
    if (el.hasAttribute && el.hasAttribute("aria-label")) {
      const a = el.getAttribute("aria-label");
      if (!el.__mcpaOriginalAriaLabel) el.__mcpaOriginalAriaLabel = a;
      const trans = getTranslation(a);
      if (trans && trans !== a) el.setAttribute("aria-label", trans);
    }
  };

  let scanScheduled = false;
  const scan = () => {
    if (!isTranslatingActive) return;
    scanScheduled = false;

    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      translateNode(node);
    }

    // Also translate interactive element attributes
    const interactiveEls = document.querySelectorAll(
      "input[placeholder], textarea[placeholder], button[title], a[title], [aria-label]"
    );
    interactiveEls.forEach(translateAttributes);
  };

  // Only observe element child additions/removals — NEVER characterData to avoid self-triggering feedback loops
  activeObserver = new MutationObserver(() => {
    if (isTranslatingActive && !scanScheduled) {
      scanScheduled = true;
      setTimeout(scan, 60);
    }
  });

  activeObserver.observe(document.body, { childList: true, subtree: true });
  scan();

  return () => {
    stopAutomaticPageTranslation();
  };
}

// Revert all translated nodes back to their original English state
export function revertAutomaticPageTranslation() {
  stopAutomaticPageTranslation();
  if (typeof document === "undefined" || !document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (shouldSkipElement(node.parentElement)) continue;

    const raw = node.nodeValue;
    if (!raw || !raw.trim()) continue;
    const trimmed = raw.trim();

    // 1. If clean original English was preserved and is not itself Tagalog
    if (node.__mcpaOriginal && !REVERSE_TAGALOG_MAP.has(node.__mcpaOriginal.trim())) {
      node.nodeValue = node.__mcpaOriginal;
    } else if (REVERSE_TAGALOG_MAP.has(trimmed)) {
      // 2. Direct exact reverse lookup
      const en = REVERSE_TAGALOG_MAP.get(trimmed);
      node.nodeValue = raw.replace(trimmed, en);
    } else {
      // 3. Composite multi-word reverse lookup
      let output = trimmed;
      let hasReverted = false;
      for (const [tlKey, enVal] of SORTED_REVERSE_PHRASES) {
        if (tlKey.length > 2 && output.includes(tlKey)) {
          output = output.split(tlKey).join(enVal);
          hasReverted = true;
        }
      }
      if (hasReverted) {
        node.nodeValue = raw.replace(trimmed, output);
      }
    }

    node.__mcpaOriginal = null;
    node.__mcpaTranslated = false;
  }

  // Restore interactive attributes
  const interactiveEls = document.querySelectorAll(
    "input[placeholder], textarea[placeholder], button[title], a[title], [aria-label]"
  );
  interactiveEls.forEach((el) => {
    if (el.__mcpaOriginalPlaceholder) {
      el.setAttribute("placeholder", el.__mcpaOriginalPlaceholder);
      el.__mcpaOriginalPlaceholder = null;
    } else if (el.hasAttribute("placeholder")) {
      const p = el.getAttribute("placeholder");
      if (REVERSE_TAGALOG_MAP.has(p)) {
        el.setAttribute("placeholder", REVERSE_TAGALOG_MAP.get(p));
      }
    }

    if (el.__mcpaOriginalTitle) {
      el.setAttribute("title", el.__mcpaOriginalTitle);
      el.__mcpaOriginalTitle = null;
    } else if (el.hasAttribute("title")) {
      const t = el.getAttribute("title");
      if (REVERSE_TAGALOG_MAP.has(t)) {
        el.setAttribute("title", REVERSE_TAGALOG_MAP.get(t));
      }
    }

    if (el.__mcpaOriginalAriaLabel) {
      el.setAttribute("aria-label", el.__mcpaOriginalAriaLabel);
      el.__mcpaOriginalAriaLabel = null;
    } else if (el.hasAttribute("aria-label")) {
      const a = el.getAttribute("aria-label");
      if (REVERSE_TAGALOG_MAP.has(a)) {
        el.setAttribute("aria-label", REVERSE_TAGALOG_MAP.get(a));
      }
    }
  });
}

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mcpa-lang");
        if (saved === "fil" || saved === "en") {
          return saved;
        }
      } catch (e) {}
    }
    return "en";
  });

  // Read saved preference from localStorage on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("mcpa-lang");
        if (saved === "fil" || saved === "en") {
          setLanguageState(saved);
        }
      } catch (e) {}
    });
  }, []);

  // Listen to language changes and activate DOM translator
  useEffect(() => {
    // If on admin route, do nothing
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return undefined;
    }

    if (language === "fil") {
      return installAutomaticPageTranslation();
    } else {
      revertAutomaticPageTranslation();
      return undefined;
    }
  }, [language]);

  const setLanguage = (lang) => {
    // 1. Immediately kill any background translation loops
    stopAutomaticPageTranslation();

    // 2. Set React state
    setLanguageState(lang);
    try {
      localStorage.setItem("mcpa-lang", lang);
    } catch (e) {}

    // 3. Immediately apply or revert DOM translation
    if (typeof window !== "undefined") {
      if (lang === "en") {
        revertAutomaticPageTranslation();
      } else if (lang === "fil") {
        setTimeout(installAutomaticPageTranslation, 40);
      }
      window.dispatchEvent(
        new CustomEvent("mcpa-language-change", { detail: { language: lang } })
      );
    }
  };

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    return langDict[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
