/**
 * MCPA Construction and Supply — Official Chatbot Seed Data
 * Strictly grounded in verified website pages:
 * - /services (Residential, BNPL, Blueprints/Permits, Commercial/Warehouses, In-House Supply, Renovations)
 * - /process (4-Stage Construction Process & Verification Schedule)
 * - / (Hero, 15-Year Structural Warranty, Civil Code Art. 1723, Plaridel Bulacan Office, Consultation Booking)
 * - Official Contact Channels (Messenger, Viber/Phone, Email, Socials)
 */

const DEFAULT_CATEGORIES = [
  {
    slug: "construction-services",
    name_en: "Construction Services",
    name_tl: "Mga Serbisyo sa Konstruksyon",
    description: "Overview of turnkey design-and-build and structural services offered by MCPA.",
    sort_order: 1,
  },
  {
    slug: "bnpl-program",
    name_en: "Build Now, Pay Later (BNPL)",
    name_tl: "Build Now, Pay Later Program",
    description: "Flexible milestone financing and loan assistance for titled property owners.",
    sort_order: 2,
  },
  {
    slug: "plans-permits",
    name_en: "Signed & Sealed Blueprints & Permits",
    name_tl: "Permit at Blueprints",
    description: "PRC-licensed architectural and engineering plans ready for municipal LGU approval.",
    sort_order: 3,
  },
  {
    slug: "residential-build",
    name_en: "Residential Design & Build",
    name_tl: "Pagtatayo ng Bahay",
    description: "Custom turnkey homes built to withstand typhoons and earthquakes.",
    sort_order: 4,
  },
  {
    slug: "commercial-build",
    name_en: "Commercial Buildings & Warehouses",
    name_tl: "Komersyal at Bodega",
    description: "Heavy-duty structural steel framing, storage facilities, and commercial rental spaces.",
    sort_order: 5,
  },
  {
    slug: "in-house-supply",
    name_en: "In-House Project Materials & Supply",
    name_tl: "Suplay ng Materyales",
    description: "Dedicated materials and logistics fleet exclusive to MCPA build projects.",
    sort_order: 6,
  },
  {
    slug: "process-timeline",
    name_en: "4-Stage Construction Process",
    name_tl: "Proseso ng Paggawa",
    description: "Step-by-step progress from site inspection to ceremonial house key turnover.",
    sort_order: 7,
  },
  {
    slug: "quotation-booking",
    name_en: "Quotations & Consultation Booking",
    name_tl: "Presyo at Konsultasyon",
    description: "How to schedule site visits, submit project briefs, and receive engineering estimates.",
    sort_order: 8,
  },
  {
    slug: "warranty-standards",
    name_en: "15-Year Structural Warranty",
    name_tl: "15-Taong Garantiya",
    description: "Guaranteed structural resilience standards and post-construction coverage.",
    sort_order: 9,
  },
  {
    slug: "renovations",
    name_en: "Renovations & Home Extensions",
    name_tl: "Renobasyon at Dagdag-Bahay",
    description: "Structural evaluations, second-floor additions, and modern exterior upgrades.",
    sort_order: 10,
  },
  {
    slug: "company-contact",
    name_en: "Company Office & Contacts",
    name_tl: "Opisina at Kontak",
    description: "Physical headquarters in Plaridel, Bulacan, office hours, and official channels.",
    sort_order: 11,
  },
];

const DEFAULT_FAQS = [
  {
    category_slug: "construction-services",
    question_en: "What construction services does MCPA offer?",
    question_tl: "Anong mga serbisyo sa konstruksyon ang iniaalok ng MCPA?",
    alt_questions: [
      "What services do you offer?",
      "What construction work do you do?",
      "What can MCPA help me with?",
      "Anong services ninyo?",
      "Ano ang mga ginagawa ng MCPA Construction?",
      "Ano ang covered sa services ninyo?",
      "Do you handle complete construction?",
      "Services offered by MCPA",
    ],
    keywords: ["services", "serbisyo", "turnkey", "design", "build", "scope", "residential", "commercial", "warehouse", "renovation"],
    answer_en:
      "MCPA Construction and Supply provides full-service turnkey design-and-build contracting.\n\nOur services include:\n1. Custom Residential Design & Build for single- and multi-storey family homes\n2. The Build Now, Pay Later (BNPL) financing program for titled lot owners\n3. PRC Signed & Sealed Architectural & Engineering Blueprints with municipal building permit assistance\n4. Commercial Buildings & Warehouses with structural steel framing\n5. Dedicated In-House Project Materials & Supply\n6. Residential Renovations & Second-Floor Additions.",
    answer_tl:
      "Ang MCPA Construction and Supply ay nagbibigay ng kumpletong turnkey design-and-build contracting services.\n\nKabilang sa aming mga serbisyo:\n1. Custom Residential Design & Build para sa bago at matitibay na tahanan\n2. Build Now, Pay Later (BNPL) financing program para sa mga may tituladong lote\n3. PRC Signed & Sealed Blueprints at tulong sa Building Permits\n4. Commercial Buildings at Warehouses\n5. Direktang In-House Project Materials & Supply\n6. Home Renovations at Second-Floor Extensions.",
  },
  {
    category_slug: "bnpl-program",
    question_en: "What is the Build Now, Pay Later (BNPL) program and who is eligible?",
    question_tl: "Ano ang Build Now, Pay Later (BNPL) program at sino ang kwalipikado rito?",
    alt_questions: [
      "How does Build Now Pay Later work?",
      "Do you offer BNPL?",
      "May hulugan ba kayo sa bahay?",
      "Paano mag-apply sa Build Now Pay Later?",
      "Puwede ba magpagawa ng bahay kahit hindi buo ang pera?",
      "Ano ang requirements para sa BNPL?",
      "Do you assist with Pag-IBIG housing loans?",
      "Financing options for construction",
    ],
    keywords: ["bnpl", "build now pay later", "hulugan", "financing", "pag-ibig", "loan", "installment", "titled lot", "titulo"],
    answer_en:
      "The Build Now, Pay Later (BNPL) program is an exclusive financing assistance pathway for titled lot owners across Bulacan, Metro Manila, and Central Luzon. It allows you to begin construction without requiring 100% full cash upfront.\n\nMCPA provides step-by-step progress billing with zero surprise costs, full assistance with Pag-IBIG Housing Loan documentation, and commercial bank loan packaging so you only pay as each construction milestone is inspected and completed.",
    answer_tl:
      "Ang Build Now, Pay Later (BNPL) program ay isang espesyal na programa para sa mga may-ari ng tituladong lupa sa Bulacan, Metro Manila, at Central Luzon. Pinapayagan ka nitong simulan ang pagpapatayo ng iyong bahay kahit hindi buo ang cash upfront.\n\nNagbibigay ang MCPA ng milestone progress billing kung saan babayaran mo lamang ang bawat natapos at na-inspeksyong yugto, kasama ang tulong sa Pag-IBIG Housing Loan at bank financing documentation.",
  },
  {
    category_slug: "plans-permits",
    question_en: "Do you provide signed and sealed blueprints and assist with building permits?",
    question_tl: "Nagbibigay ba kayo ng signed and sealed na blueprints at tulong sa building permits?",
    alt_questions: [
      "Do you provide architectural blueprints?",
      "Are your plans signed and sealed by licensed engineers?",
      "Kayo ba ang mag-aayos ng building permit?",
      "May arkitekto at civil engineer ba kayo?",
      "Can I order just the blueprint package?",
      "Kasama ba sa serbisyo ang LGU municipal permit?",
      "PRC licensed engineers and architects",
    ],
    keywords: ["blueprints", "plano", "permits", "building permit", "signed and sealed", "architect", "engineer", "lgu", "prc"],
    answer_en:
      "Yes. MCPA provides complete, fully certified architectural and engineering plans signed and sealed by PRC-licensed Architects, Civil Engineers, Professional Electrical Engineers, and Master Plumbers.\n\nOur blueprint packages include:\n• Architectural floor plans and 3D exterior/interior color views\n• Earthquake-resistant structural computations\n• Electrical wiring layouts and plumbing diagrams\n• End-to-end assistance in filing and securing your local LGU Building Permits in Bulacan and NCR",
    answer_tl:
      "Oo. Ang MCPA ay nagbibigay ng kumpletong architectural at engineering plans na pirmado at selyado (signed and sealed) ng mga lisensyadong Arkitekto, Civil Engineer, Electrical Engineer, at Master Plumber.\n\nKasama sa aming package:\n• Makatotohanang 3D views at kumpletong floor plans\n• Earthquake-resistant structural calculations\n• Electrical at plumbing layouts\n• Buong tulong sa pag-asikaso ng City o Municipal Building Permit sa iyong lokal na LGU",
  },
  {
    category_slug: "residential-build",
    question_en: "What is included in your custom residential house construction?",
    question_tl: "Ano ang mga kasama sa custom residential house construction ng MCPA?",
    alt_questions: [
      "What is included in a turnkey house build?",
      "Do you build single-storey and two-storey homes?",
      "Ano ang kasama sa pagpapagawa ng bahay?",
      "Turnkey package inclusions",
      "Kayo na ba bahala mula pundasyon hanggang susi?",
      "Custom residential package scope",
    ],
    keywords: ["residential", "house", "bahay", "inclusions", "turnkey", "foundation", "single-storey", "two-storey", "plumbing", "finishing"],
    answer_en:
      "Our Custom Residential Design & Build is a complete turnkey service.\n\nIt covers:\n1. 3D realistic exterior/interior views and complete working floor plans\n2. Soil strength evaluation and solid reinforced concrete foundation using certified steel rebars\n3. Supervised concrete pouring for structural columns, beams, and slabs\n4. High-grade plumbing, electrical wiring, and sanitary installations\n5. Premium tilework, doors, windows, and finishes\n6. Certificate of Occupancy assistance with key turnover backed by a 15-Year Structural Warranty.",
    answer_tl:
      "Ang aming Custom Residential Design & Build ay isang buong turnkey package.\n\nKasama rito ang:\n1. Makatotohanang 3D designs at complete floor plans\n2. Pagsusuri ng lupa at matibay na pundasyong may certified steel rebars\n3. Binabantayang buhos ng semento sa mga poste at biga\n4. Mataas na kalidad ng electrical at plumbing installations\n5. Paglalagay ng tiles, bintana, pinto, at finishing\n6. Tulong sa Certificate of Occupancy, turnover ng susi, at 15-Taong Structural Warranty.",
  },
  {
    category_slug: "commercial-build",
    question_en: "Do you construct commercial buildings, rental units, and warehouses?",
    question_tl: "Nagtatayo ba kayo ng mga komersyal na gusali, paupahan, at bodega?",
    alt_questions: [
      "Do you build commercial spaces?",
      "Do you build warehouses?",
      "Nagtatayo ba kayo ng commercial building?",
      "Puwede ba commercial warehouse o storage facility?",
      "Commercial rental space construction",
    ],
    keywords: ["commercial", "warehouse", "bodega", "steel framing", "industrial", "rental", "storage", "komersyal"],
    answer_en:
      "Yes. MCPA designs and constructs durable commercial buildings, logistics facilities, retail rental units, and storage warehouses. We utilize heavy-duty structural steel framing for wide column-free floor layouts, reinforced concrete slab pours engineered for heavy vehicle traffic, and integrated safety standards including industrial ventilation and fire protection compliance.",
    answer_tl:
      "Oo. Nagdidisenyo at nagtatayo ang MCPA ng matitibay na commercial buildings, rental units, logistics hubs, at industrial warehouses. Gumagamit kami ng heavy-duty structural steel framing para sa malalawak na espasyo, reinforced concrete slab na kayang magbuhat ng mabibigat na sasakyan, at mga pasilidad para sa bentilasyon at proteksyon sa sunog.",
  },
  {
    category_slug: "in-house-supply",
    question_en: "Can I buy construction materials from MCPA as an open retail hardware store?",
    question_tl: "Puwede bang bumili ng materyales sa MCPA na parang hardware store?",
    alt_questions: [
      "Are you an open hardware store?",
      "Nagtitinda ba kayo ng semento at bakal nang tingi?",
      "Can I purchase steel rebars and gravel from you directly?",
      "Tumatanggap ba kayo ng retail supply orders?",
      "Bumibili ba kayo o nagbebenta ng construction supplies?",
    ],
    keywords: ["supply", "materials", "hardware", "retail", "semento", "bakal", "rebars", "aggregates", "trucks"],
    answer_en:
      "No. MCPA Construction and Supply is not an open retail hardware store. Our direct materials supply, ready-mix concrete, certified steel rebars, aggregates, and logistics dump truck fleet are dedicated exclusively to our own construction and design-and-build projects. This operational model eliminates third-party hardware markups and guarantees zero site delivery delays for our contracted project clients.",
    answer_tl:
      "Hindi. Ang MCPA Construction and Supply ay hindi isang bukas na retail hardware store. Ang aming sariling suplay ng certified steel rebars, structural concrete, aggregates (buhangin at graba), at dump truck fleet ay nakalaan lamang para sa sarili naming mga proyekto sa konstruksyon. Sa ganitong paraan, naiiwasan ang patong ng mga tindahan at naiiwasan ang anumang antala sa pagdating ng materyales sa inyong bahay.",
  },
  {
    category_slug: "process-timeline",
    question_en: "What are the 4 stages of MCPA's construction process?",
    question_tl: "Ano ang 4 na yugto sa proseso ng konstruksyon ng MCPA?",
    alt_questions: [
      "How does the construction process work?",
      "What are the steps to build a house with MCPA?",
      "Paano ang proseso ng pagpapagawa mula simula hanggang matapos?",
      "Proseso ng pagpapatayo ng bahay",
      "What is Phase 1 to Phase 4?",
      "Construction stages and workflow",
    ],
    keywords: ["process", "proseso", "stages", "phase 1", "phase 2", "phase 3", "phase 4", "timeline", "hakbang", "walkthrough"],
    answer_en:
      "MCPA follows an organized 4-Stage Construction Process:\n\n1. Phase 1: Initial Planning & Site Visit — Property land title verification, lot boundary survey, ground soil strength testing, and dream house consultation\n2. Phase 2: Architectural Blueprints & Permits — PRC signed and sealed plans, 3D renderings, earthquake calculations, and municipal building permit approval\n3. Phase 3: Structural Building & Framing — Solid foundation, certified steel rebars, 3000 PSI concrete pouring, and weekly photo reports sent to your phone/portal\n4. Phase 4: Final Inspection & House Turnover — Room-by-room client walkthrough, Certificate of Occupancy, ceremonial key handover, and 15-Year Structural Warranty certificate.",
    answer_tl:
      "Ipinapatupad ng MCPA ang malinaw na 4-Stage Construction Process:\n\n1. Yugto 1: Planning at Site Visit — Pagsusuri ng titulo, sukat ng lote, tibay ng lupa, at unang konsultasyon sa disenyo\n2. Yugto 2: Blueprints at Building Permits — Paggawa ng kumpletong signed & sealed plans, 3D renders, at pagkuha ng permit sa munisipyo\n3. Yugto 3: Structural Construction — Paghuhukay ng pundasyon, pagtali ng bakal, buhos ng semento, at lingguhang photo updates sa iyong phone\n4. Yugto 4: Huling Inspeksyon at Turnover — Masusing walkthrough, Certificate of Occupancy, seremonya ng susi, at 15-Taong Structural Warranty.",
  },
  {
    category_slug: "quotation-booking",
    question_en: "How can I request a construction quotation or book an initial consultation?",
    question_tl: "Paano ako makakahingi ng quotation o makakapag-book ng konsultasyon sa MCPA?",
    alt_questions: [
      "How do I request a quote?",
      "Paano humingi ng quotation sa pagpapatayo ng bahay?",
      "How to book an appointment with MCPA?",
      "Where can I submit my project brief?",
      "Paano magpa-estimate ng project?",
      "How do I start an inquiry?",
      "Can I schedule a site visit?",
    ],
    keywords: ["quotation", "quote", "inquire", "estimate", "consultation", "booking", "brief", "appointment", "site visit", "presyo"],
    answer_en:
      "You can request an official construction quotation by navigating to our 'Inquire Now!' booking page (/book) on our website. Simply provide your name, contact details, project location, lot status (e.g. titled), target building type, and approximate budget or floor size. Our engineering team reviews your brief, schedules an on-site visit or consultation at our Plaridel office, and prepares an itemized project cost breakdown.",
    answer_tl:
      "Makakahingi ka ng opisyal na quotation sa pamamagitan ng pagpunta sa aming 'Inquire Now!' page (/book). Ilagay lamang ang iyong pangalan, contact details, lokasyon ng lote, katayuan ng titulo, uri ng ipapatayo, at target na budget o sukat. Susuriin ng aming engineering team ang iyong brief upang mai-schedule ang ocular site inspection o konsultasyon sa aming opisina sa Plaridel para sa detalyadong breakdown.",
  },
  {
    category_slug: "warranty-standards",
    question_en: "What warranty does MCPA provide for constructed homes?",
    question_tl: "Anong garantiya o warranty ang ibinibigay ng MCPA sa mga naitayong bahay?",
    alt_questions: [
      "Do you provide a warranty?",
      "May warranty ba ang gawa ninyo?",
      "Gaano katagal ang warranty sa structure?",
      "Is there a guarantee for earthquake resistance?",
      "What is your 15-year structural warranty?",
      "Civil Code Article 1723 warranty",
    ],
    keywords: ["warranty", "garantiya", "15 years", "structural", "lindol", "civil code", "resilience", "matibay"],
    answer_en:
      "Every turnkey home constructed by MCPA comes with an official 15-Year Structural Warranty in compliance with Article 1723 of the Philippine Civil Code. This covers the integrity of the foundation, reinforced concrete columns, beams, and primary load-bearing framing against structural failure. All structural components are engineered to withstand Philippine typhoon wind speeds and seismic earthquake loads.",
    answer_tl:
      "Bawat tahanang itinayo ng MCPA ay may opisyal na 15-Taong Structural Warranty alinsunod sa Article 1723 ng Philippine Civil Code. Sakop nito ang tibay ng pundasyon, mga poste, biga, at structural framing laban sa pagkasira. Ang bawat bahay ay sadyang idinisenyo upang makatiis sa malalakas na bagyo at lindol sa Pilipinas.",
  },
  {
    category_slug: "renovations",
    question_en: "Do you accept home renovations, extensions, and second-floor additions?",
    question_tl: "Tumatanggap ba kayo ng renobasyon, extension, o dagdag na ikalawang palapag?",
    alt_questions: [
      "Do you do house renovations?",
      "Puwede bang magpadagdag ng second floor?",
      "Tumatanggap ba kayo ng renobasyon ng lumang bahay?",
      "Home extensions and exterior upgrades",
      "Puwede ba magpa-renovate sa Bulacan?",
    ],
    keywords: ["renovation", "renobasyon", "extension", "second floor", "dagdag palapag", "upgrade", "re-piping", "roof deck"],
    answer_en:
      "Yes. MCPA undertakes residential renovations, modern exterior upgrades, vertical second-floor additions, and roof deck conversions. Before commencing any vertical extension work, our licensed Civil Engineers conduct an on-site structural audit of your existing foundation and posts to guarantee that your current structure can safely support additional floors.",
    answer_tl:
      "Oo. Tumatanggap ang MCPA ng home renovations, vertical second-floor additions, modern exterior upgrades, at roof deck conversions. Bago simulan ang pagpapatong ng ikalawang palapag, magsasagawa muna ang aming mga Civil Engineer ng masusing structural audit sa iyong kasalukuyang pundasyon at mga poste upang masigurong ligtas itong magbuhat ng dagdag na bigat.",
  },
  {
    category_slug: "company-contact",
    question_en: "Where is MCPA's office located, and what are your operating hours?",
    question_tl: "Saan matatagpuan ang opisina ng MCPA at anong oras kayo bukas?",
    alt_questions: [
      "Where is your office located?",
      "Saan ang office ninyo sa Bulacan?",
      "What are your business hours?",
      "Anong oras kayo bukas?",
      "MCPA office address and location",
      "May physical office ba kayo na puwedeng bisitahin?",
      "Plaridel Bulacan office address",
    ],
    keywords: ["office", "location", "address", "opisina", "plaridel", "bulacan", "hours", "bukas", "contact", "phone", "email"],
    answer_en:
      "Our office is located at 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines.\n\nOperating Hours:\n• Monday to Saturday: 8:00 AM – 5:00 PM PST (closed on Sundays)\n\nDirect Contact:\n• Phone / Viber: (0949) 775 8239\n• Email: mcpa.construction@gmail.com\n• Messenger: https://www.messenger.com/t/101780969082788",
    answer_tl:
      "Ang aming punong tanggapan ay matatagpuan sa 2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Pilipinas.\n\nOras ng Operasyon:\n• Lunes hanggang Sabado: 8:00 AM – 5:00 PM PST (sarado tuwing Linggo)\n\nDirektang Kontak:\n• Telepono / Viber: (0949) 775 8239\n• Email: mcpa.construction@gmail.com\n• Messenger: https://www.messenger.com/t/101780969082788",
  },
  {
    category_slug: "company-contact",
    question_en: "What areas or provinces does MCPA serve?",
    question_tl: "Anong mga lugar o probinsya ang sakop ng serbisyo ng MCPA?",
    alt_questions: [
      "What is your service area?",
      "Saan kayo nagtatayo ng bahay?",
      "Do you build outside Bulacan?",
      "Nagtatayo ba kayo sa Metro Manila?",
      "Do you accept projects in Pampanga or Nueva Ecija?",
      "Areas covered by MCPA",
    ],
    keywords: ["service area", "coverage", "lugar", "bulacan", "metro manila", "central luzon", "ncr", "pampanga"],
    answer_en:
      "MCPA Construction and Supply provides full turnkey construction services throughout:\n• Bulacan (entire province)\n• Metro Manila (NCR)\n• Central Luzon (Pampanga, Nueva Ecija, and surrounding provinces with accessible titled project sites)",
    answer_tl:
      "Naglilingkod ang MCPA Construction and Supply sa mga sumusunod na lugar:\n• Lalawigan ng Bulacan (buong probinsya)\n• Metro Manila (NCR)\n• Central Luzon (Pampanga, Nueva Ecija, at mga karatig-probinsya na may accessible at tituladong lote)",
  },
  {
    category_slug: "bnpl-program",
    question_en: "Can I apply for Build Now, Pay Later if my lot does not have a clean land title?",
    question_tl: "Maaari ba akong mag-apply sa Build Now, Pay Later kung wala pang malinis na titulo ang aking lote?",
    alt_questions: [
      "Puwede ba mag-BNPL kung rights lang ang lupa?",
      "Do you accept rights only property for financing?",
      "Can I build if the title is still in process?",
      "Kailangan ba may sariling titulo para sa Build Now Pay Later?",
      "Titled property requirement for BNPL",
    ],
    keywords: ["title", "titulo", "clean title", "rights", "rights only", "bnpl", "financing", "requirements"],
    answer_en:
      "The Build Now, Pay Later (BNPL) program strictly requires an officially titled property (Transfer Certificate of Title / TCT or Condominium Certificate of Title / CCT in the name of the owner or immediate family) because banks and Pag-IBIG require a clear collateral title to approve loan proceeds.\n\nFor untitled or rights-only properties, we cannot offer the BNPL financing program, but you may still inquire regarding standard cash milestone-based construction.",
    answer_tl:
      "Ang aming Build Now, Pay Later (BNPL) program ay mahigpit na nangangailangan ng may sariling malinis na titulo (TCT o CCT) sa ilalim ng pangalan ng aplikante o pamilya dahil kailangan ng Pag-IBIG at mga bangko ang malinis na titulo bilang collateral.\n\nKung 'rights only' o wala pang titulo ang lupa, hindi ito pasok sa BNPL, subalit maaari pa ring mag-inquire para sa karaniwang cash milestone progress billing.",
  },
  {
    category_slug: "quotation-booking",
    question_en: "How can I track the progress of my ongoing construction project with MCPA?",
    question_tl: "Paano ko masusubaybayan ang progreso ng aking ginagawang bahay sa MCPA?",
    alt_questions: [
      "How do I see photo updates of my build?",
      "May online portal ba para sa ongoing project?",
      "Paano malalaman ang status ng construction?",
      "Do you send regular progress photos?",
      "Client Portal project tracking",
    ],
    keywords: ["client portal", "tracking", "progress", "photos", "updates", "status", "online portal"],
    answer_en:
      "Contracted MCPA clients gain access to our secure Client Portal on our website (/portal).\n\nThrough your personal portal dashboard, you can:\n• View weekly high-resolution construction photo logs\n• Track verified completion percentages for each milestone\n• Review approved blueprints and engineering documents\n• Monitor billing ledgers and payment receipts in real time from any phone or computer",
    answer_tl:
      "Ang mga kliyente ng MCPA ay mayroong sariling account sa aming Client Portal (/portal).\n\nSa iyong personal portal dashboard, maaari mong:\n• Tingnan ang mga lingguhang photo updates sa site\n• Subaybayan ang verified completion percentage ng bawat milestone\n• Suriin ang mga inaprubahang blueprints at dokumento\n• Bantayan ang billing ledgers at resibo nang real-time sa iyong telepono o computer",
  },
];

const DEFAULT_SETTINGS = {
  min_match_threshold: 0.42,
  ambiguity_delta: 0.06,
  max_suggestions: 5,
  debounce_ms: 250,
  messenger_url: "https://www.messenger.com/t/101780969082788",
  social_links: {
    facebook: "https://www.facebook.com/MCPA.ConstructionandSupply/",
    instagram: "https://www.instagram.com/mcpa.constructionandsupply/",
    tiktok: "https://www.tiktok.com/@mcpa.construction",
  },
  messages: {
    en: {
      initial_greeting:
        "Hello! Welcome to MCPA Construction and Supply. I'm here to help answer your questions about our services, projects, and construction inquiries.",
      name_request: "Before we begin, what should I call you?",
      personalized_welcome: "Nice to meet you, {name}! How can I help you today?",
      feedback_prompt: "Did this answer your question?",
      resolved_closing: "Glad I could help, {name}! Thank you for contacting MCPA Construction and Supply.",
      escalation_intro:
        "No problem, {name}. Let me help you connect with the MCPA team so you can get the information you need.",
      unknown_fallback:
        "Sorry, {name}. I couldn't find a reliable answer to that question in our current information. I don't want to give you incorrect details.",
      email_gate_prompt:
        "Before I connect you with an MCPA administrator, please provide your email address so our team can follow up with you.",
      email_gate_placeholder: "yourname@example.com",
      email_gate_submit: "Connect to MCPA Admin",
      human_waiting:
        "Thank you, {name}. Your inquiry and email ({email}) have been received. An authorized MCPA administrator has been notified and will respond as soon as they are available.",
      start_new_conversation: "Start a New Conversation",
      talk_to_real_person: "Talk to a Real Person",
      continue_chatting: "Continue Chatting",
      yes_helps: "Yes, that helps",
      no_more_help: "No, I need more help",
    },
    fil: {
      initial_greeting:
        "Kumusta! Maligayang pagdating sa MCPA Construction and Supply. Narito ako upang sagutin ang iyong mga katanungan tungkol sa aming mga serbisyo, proyekto, at inquiries sa pagpapatayo.",
      name_request: "Bago tayo magsimula, ano ang itatawag ko sa iyo?",
      personalized_welcome: "Ikinagagalak kitang makilala, {name}! Paano kita matutulungan ngayon?",
      feedback_prompt: "Nakatulong ba ang sagot na ito sa iyong katanungan?",
      resolved_closing: "Masaya akong nakatulong, {name}! Maraming salamat sa pagkontak sa MCPA Construction and Supply.",
      escalation_intro:
        "Walang anuman, {name}. Tutulungan kitang kumonekta sa MCPA team upang makuha mo ang eksaktong impormasyong kailangan mo.",
      unknown_fallback:
        "Paumanhin, {name}. Wala akong nahanap na sapat at maaasahang sagot sa kasalukuyan naming impormasyon. Ayaw naming magbigay ng maling detalye.",
      email_gate_prompt:
        "Bago kita ikonekta sa isang MCPA administrator, pakilagay ang iyong email address upang ma-follow up ka ng aming team.",
      email_gate_placeholder: "iyong.email@example.com",
      email_gate_submit: "Kumonekta sa MCPA Admin",
      human_waiting:
        "Salamat, {name}. Natanggap na ang iyong mensahe at email ({email}). Naabisuhan na ang aming MCPA administrator at tutugon sa lalong madaling panahon.",
      start_new_conversation: "Magsimula ng Bagong Usapan",
      talk_to_real_person: "Kausapin ang Tunay na Tao",
      continue_chatting: "Magpatuloy sa Chat",
      yes_helps: "Oo, nakatulong ito",
      no_more_help: "Hindi, kailangan ko pa ng tulong",
    },
  },
};

module.exports = {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_SETTINGS,
};
