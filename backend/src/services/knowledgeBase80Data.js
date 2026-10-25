/**
 * MCPA Construction and Supply
 * Customer Support Knowledge Base — 80 Frequently Asked Questions
 * 
 * Official 9 Categories & 80 Verified FAQs with bilingual support (English & Filipino),
 * expanded alternative question variations, and searchable keywords.
 */

const OFFICIAL_CATEGORIES = [
  {
    slug: "company-info",
    name_en: "Company Information",
    name_tl: "Impormasyon sa Kompanya",
    description: "Overview of MCPA Construction and Supply, office location, business hours, and contact channels.",
    sort_order: 1,
  },
  {
    slug: "construction-services",
    name_en: "Construction Services",
    name_tl: "Mga Serbisyo sa Konstruksyon",
    description: "Residential houses, architectural design, design-and-build, renovations, two-storey builds, commercial projects, and material supply.",
    sort_order: 2,
  },
  {
    slug: "estimates-quotations",
    name_en: "Project Estimates & Quotations",
    name_tl: "Tantiya ng Proyekto at Presyo",
    description: "Quotation requests, building costs, cost per square meter, required information, and budget suitability.",
    sort_order: 3,
  },
  {
    slug: "payment-contracts",
    name_en: "Payment & Contract Terms",
    name_tl: "Kabayaran at Kontrata",
    description: "Payment methods, down payments, payment schedules, installments, BNPL program, official contracts, and payment verification.",
    sort_order: 4,
  },
  {
    slug: "timeline-management",
    name_en: "Project Timeline & Management",
    name_tl: "Oras at Pamamahala ng Proyekto",
    description: "Construction duration, completion dates, project supervision, progress updates, site visits, and weather delays.",
    sort_order: 5,
  },
  {
    slug: "materials-design-scope",
    name_en: "Materials, Design & Scope of Work",
    name_tl: "Materyales, Disenyo, at Saklaw",
    description: "Material selection and specifications, inclusions and exclusions, building permits, and custom finishes.",
    sort_order: 6,
  },
  {
    slug: "licenses-permits-safety",
    name_en: "Licenses, Permits, Safety & Quality",
    name_tl: "Lisensya, Permit, Kaligtasan, at Kalidad",
    description: "Contractor licensing and insurance, permit processing, quality control, site safety, and warranties.",
    sort_order: 7,
  },
  {
    slug: "portfolio-references",
    name_en: "References, Portfolio & Communication",
    name_tl: "Mga Halimbawang Proyekto at Komunikasyon",
    description: "Past projects, completed photos, client references, consultation scheduling, and submitting project plans.",
    sort_order: 8,
  },
  {
    slug: "changes-aftersales",
    name_en: "Project Changes & After-Sales Support",
    name_tl: "Pagbabago sa Proyekto at After-Sales Support",
    description: "Change orders, final cost adjustments, project turnover procedure, and reporting after-turnover issues.",
    sort_order: 9,
  },
];

const FAQS_80 = [
  // ==================== CATEGORY 1: COMPANY INFORMATION ====================
  {
    id: 1,
    category_slug: "company-info",
    question_en: "What is MCPA Construction and Supply?",
    question_tl: "Ano ang MCPA Construction and Supply?",
    alt_questions: [
      "What is MCPA?",
      "Tell me about MCPA",
      "Ano ang MCPA Construction?",
      "Sino ang MCPA?",
      "Tungkol sa MCPA",
      "About MCPA Construction and Supply"
    ],
    keywords: ["mcpa", "company", "information", "about", "tungkol", "kompanya", "profile"],
    answer_en: "MCPA Construction and Supply is a construction-related company. For more information about our company, services, and projects, please explore our website or contact our team through our official communication channels.",
    answer_tl: "Ang MCPA Construction and Supply ay isang kompanyang may kinalaman sa konstruksyon. Para sa karagdagang impormasyon tungkol sa aming kompanya, mga serbisyo, at mga proyekto, mangyaring bisitahin ang aming website o makipag-ugnayan sa aming team sa pamamagitan ng aming opisyal na communication channels."
  },
  {
    id: 2,
    category_slug: "company-info",
    question_en: "What services does MCPA offer?",
    question_tl: "Anong mga serbisyo ang iniaalok ng MCPA?",
    alt_questions: [
      "What services do you provide?",
      "What can MCPA do for me?",
      "Anong mga serbisyo meron kayo?",
      "Ano ang offer ng MCPA?",
      "Anong serbisyo ang available sa inyo?",
      "List of construction services"
    ],
    keywords: ["services", "offer", "serbisyo", "scope", "work", "gawa", "trabaho"],
    answer_en: "Our available services depend on the scope of work offered by MCPA. Please visit our Services page to explore our offerings or contact our team to discuss your specific construction requirements.",
    answer_tl: "Ang aming mga available na serbisyo ay nakadepende sa saklaw ng trabahong iniaalok ng MCPA. Mangyaring bisitahin ang aming Services page upang makita ang aming mga serbisyo o makipag-ugnayan sa aming team upang pag-usapan ang inyong partikular na pangangailangan sa konstruksyon."
  },
  {
    id: 3,
    category_slug: "company-info",
    question_en: "Where is MCPA Construction and Supply located?",
    question_tl: "Saan matatagpuan ang MCPA Construction and Supply?",
    alt_questions: [
      "Where is your office located?",
      "What is your business address?",
      "Where are you located?",
      "Saan ang opisina ng MCPA?",
      "Nasaan ang opisina ninyo?",
      "Address ng MCPA Construction"
    ],
    keywords: ["location", "office", "address", "saan", "lugar", "opisina", "plaridel", "bulacan", "address"],
    answer_en: "For our current business address and service coverage, please contact our team through our official website or social media accounts.",
    answer_tl: "Para sa aming kasalukuyang business address at service coverage, mangyaring makipag-ugnayan sa aming team sa pamamagitan ng aming opisyal na website o social media accounts."
  },
  {
    id: 4,
    category_slug: "company-info",
    question_en: "How can I contact MCPA?",
    question_tl: "Paano ako makikipag-ugnayan sa MCPA?",
    alt_questions: [
      "How to contact MCPA?",
      "What is your contact number or messenger?",
      "How can I reach MCPA?",
      "Paano tumawag sa MCPA?",
      "Pano kayo makontak?",
      "Official contact channels"
    ],
    keywords: ["contact", "reach", "kontak", "tawag", "messenger", "social media", "facebook", "instagram", "tiktok"],
    answer_en: "You can contact MCPA through our official Facebook, Instagram, or TikTok accounts. You may also message us directly through Messenger: https://www.messenger.com/t/101780969082788",
    answer_tl: "Maaari kang makipag-ugnayan sa MCPA sa pamamagitan ng aming opisyal na Facebook, Instagram, o TikTok accounts. Maaari mo rin kaming i-message nang direkta sa Messenger: https://www.messenger.com/t/101780969082788"
  },
  {
    id: 5,
    category_slug: "company-info",
    question_en: "What makes MCPA different from other construction companies?",
    question_tl: "Ano ang pinagkaiba ng MCPA sa ibang construction companies?",
    alt_questions: [
      "Why should I choose MCPA?",
      "What sets MCPA apart?",
      "Bakit MCPA ang pipiliin ko?",
      "Bakit kayo kaysa sa ibang contractor?",
      "Ano ang edge ng MCPA?"
    ],
    keywords: ["different", "advantage", "why choose", "pinagkaiba", "advantage", "edge", "differ"],
    answer_en: "Choosing the right contractor depends on your project requirements, budget, timeline, and expectations. We encourage you to discuss your needs with our team so we can explain how our available services may suit your project.",
    answer_tl: "Ang pagpili ng tamang contractor ay nakadepende sa inyong project requirements, budget, timeline, at mga inaasahan. Hinihikayat namin kayong makipag-usap sa aming team upang maipaliwanag namin kung paano aangkop ang aming mga serbisyo sa inyong proyekto."
  },
  {
    id: 6,
    category_slug: "company-info",
    question_en: "Is MCPA accepting new construction projects?",
    question_tl: "Tumatanggap ba ang MCPA ng mga bagong proyekto sa konstruksyon?",
    alt_questions: [
      "Are you accepting new projects?",
      "Can I hire MCPA now for a build?",
      "Available ba kayo para sa bagong project?",
      "Tumatanggap ba kayo ng bagong gawa ngayon?",
      "May available slots ba kayo?"
    ],
    keywords: ["accepting", "new projects", "availability", "slots", "tumatanggap", "bagong proyekto", "available"],
    answer_en: "Project availability depends on our current workload, project requirements, and schedule. Please contact our team to discuss your proposed project and check our availability.",
    answer_tl: "Ang availability ng proyekto ay nakadepende sa aming kasalukuyang workload, project requirements, at schedule. Mangyaring makipag-ugnayan sa aming team upang pag-usapan ang inyong planong proyekto at tingnan ang aming availability."
  },
  {
    id: 7,
    category_slug: "company-info",
    question_en: "Can I visit your office?",
    question_tl: "Pwede ba akong bumisita sa inyong opisina?",
    alt_questions: [
      "Can I visit the MCPA office?",
      "Do you accept walk-in clients?",
      "Pwede bang pumunta sa inyong office?",
      "Walk in consultation ba pwede sa MCPA?",
      "Saan ako pwede bumisita?"
    ],
    keywords: ["visit", "office", "walk-in", "appointment", "bisita", "pumunta", "opisina"],
    answer_en: "Please contact our team to confirm our current office location, business hours, and whether an appointment is necessary before visiting.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma ang aming kasalukuyang lokasyon ng opisina, oras ng operasyon, at kung kailangan ng appointment bago bumisita."
  },
  {
    id: 8,
    category_slug: "company-info",
    question_en: "What are your business hours?",
    question_tl: "Ano ang inyong business hours o oras ng operasyon?",
    alt_questions: [
      "What time are you open?",
      "What are your office hours?",
      "Anong oras bukas ang inyong opisina?",
      "Kailan kayo bukas?",
      "Operating hours"
    ],
    keywords: ["business hours", "office hours", "schedule", "operating hours", "oras", "bukas", "time"],
    answer_en: "Our current business hours have not been confirmed in this chatbot. Please contact our team through our official communication channels to check our availability.",
    answer_tl: "Ang aming kasalukuyang business hours ay hindi pa nakumpirma sa chatbot na ito. Mangyaring makipag-ugnayan sa aming team sa pamamagitan ng aming opisyal na communication channels upang malaman ang aming availability."
  },
  {
    id: 9,
    category_slug: "company-info",
    question_en: "How can I learn more about MCPA's projects?",
    question_tl: "Paano ako makakakuha ng karagdagang impormasyon tungkol sa mga proyekto ng MCPA?",
    alt_questions: [
      "Where can I see your past projects?",
      "Can I see your project portfolio?",
      "Saan makikita ang mga nagawa ninyong bahay?",
      "May portfolio ba kayo ng projects?"
    ],
    keywords: ["projects", "portfolio", "past works", "proyekto", "gawa", "samples", "learn more"],
    answer_en: "You can explore our website and official social media accounts for available project photos, updates, and other company information. For additional project references, please contact our team.",
    answer_tl: "Maaari mong bisitahin ang aming website at opisyal na social media accounts para sa mga available na larawan ng proyekto, updates, at iba pang impormasyon ng kompanya. Para sa karagdagang project references, makipag-ugnayan sa aming team."
  },
  {
    id: 10,
    category_slug: "company-info",
    question_en: "Does MCPA accept inquiries through social media?",
    question_tl: "Tumatanggap ba ang MCPA ng mga inquiry sa social media?",
    alt_questions: [
      "Can I message you on Facebook or TikTok?",
      "Do you reply on Instagram?",
      "Pwede ba mag-inquire sa FB o TikTok?",
      "Nagrereply ba kayo sa social media messages?"
    ],
    keywords: ["inquiries", "social media", "facebook", "instagram", "tiktok", "tanong", "message"],
    answer_en: "You can reach out through our official social media accounts. Please send a message describing your inquiry so our team can direct you to the appropriate contact person.",
    answer_tl: "Maaari kang mag-inquire sa aming opisyal na social media accounts. Magpadala lamang ng mensahe na naglalarawan ng iyong katanungan upang maipasa ito ng aming team sa tamang tauhan."
  },

  // ==================== CATEGORY 2: CONSTRUCTION SERVICES ====================
  {
    id: 11,
    category_slug: "construction-services",
    question_en: "Does MCPA build residential houses?",
    question_tl: "Nagtatayo ba ang MCPA ng mga residential houses o bahay?",
    alt_questions: [
      "Do you build houses?",
      "Can you construct my home?",
      "Nagtatayo ba kayo ng bahay?",
      "Gumagawa ba kayo ng residential house?",
      "Paggawa ng bahay"
    ],
    keywords: ["residential", "house", "home", "bahay", "pabahay", "build", "construct"],
    answer_en: "Please contact our team to confirm whether we currently accept residential construction projects and to discuss your preferred house design, location, and requirements.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma kung tumatanggap kami ng mga residential construction project sa kasalukuyan at mapag-usapan ang inyong gustong disenyo ng bahay, lokasyon, at mga kinakailangan."
  },
  {
    id: 12,
    category_slug: "construction-services",
    question_en: "Does MCPA offer architectural design services?",
    question_tl: "Nag-aalok ba ang MCPA ng architectural design services?",
    alt_questions: [
      "Do you have architects?",
      "Can you design my house?",
      "May architectural design ba kayo?",
      "Nagdidisenyo ba kayo ng plano ng bahay?",
      "Architectural services"
    ],
    keywords: ["architectural", "design", "architect", "arkitekto", "disenyo", "plano"],
    answer_en: "Please contact our team to confirm the availability of architectural design services and discuss the design requirements for your project.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma ang availability ng architectural design services at pag-usapan ang mga kinakailangan sa disenyo ng inyong proyekto."
  },
  {
    id: 13,
    category_slug: "construction-services",
    question_en: "Do you offer design-and-build services?",
    question_tl: "Nag-aalok ba kayo ng design-and-build services?",
    alt_questions: [
      "Is MCPA design and build?",
      "Do you handle both design and construction?",
      "Design and build ba kayo?",
      "Kasama na ba disenyo at pagtayo?",
      "Turnkey package"
    ],
    keywords: ["design and build", "turnkey", "disenyo at gawa", "design-and-build", "package"],
    answer_en: "Design-and-build arrangements depend on the services available from MCPA and the requirements of your project. Please contact our team to confirm whether this arrangement is available.",
    answer_tl: "Ang design-and-build arrangements ay nakadepende sa mga serbisyong available mula sa MCPA at sa mga kinakailangan ng inyong proyekto. Mangyaring makipag-ugnayan sa aming team upang makumpirma kung available ang ganitong arrangement."
  },
  {
    id: 14,
    category_slug: "construction-services",
    question_en: "Does MCPA handle house renovations?",
    question_tl: "Tumatanggap ba ang MCPA ng house renovations o renobasyon ng bahay?",
    alt_questions: [
      "Can you renovate my house?",
      "Do you do renovations?",
      "Nagrerennovate ba kayo ng bahay?",
      "Pwede ba renobasyon lang?",
      "House repairs and remodeling"
    ],
    keywords: ["renovation", "renovate", "renobasyon", "remodel", "repair", "ayos", "pagpapaganda"],
    answer_en: "Renovation services depend on the scope and condition of the property. Please describe the improvements you have in mind so our team can assess whether your project is suitable.",
    answer_tl: "Ang mga serbisyo sa renobasyon ay nakadepende sa saklaw at kalagayan ng ari-arian. Mangyaring ilarawan ang mga nais ninyong pagbabago upang masuri ng aming team kung angkop ang inyong proyekto."
  },
  {
    id: 15,
    category_slug: "construction-services",
    question_en: "Can MCPA construct a two-storey house?",
    question_tl: "Kaya ba ng MCPA magtayo ng two-storey house o dalawang palapag na bahay?",
    alt_questions: [
      "Do you build two-storey houses?",
      "Can you construct a 2 storey house?",
      "Nagtatayo ba kayo ng 2 palapag na bahay?",
      "Kaya ba 2-storey home?",
      "Two storey residential construction"
    ],
    keywords: ["two-storey", "2-storey", "dalawang palapag", "multi-storey", "palapag", "second floor"],
    answer_en: "The feasibility of a two-storey house depends on the design, site conditions, structural requirements, budget, and available services. Please contact our team to discuss your project.",
    answer_tl: "Ang pagtatayo ng dalawang palapag na bahay ay nakadepende sa disenyo, kalagayan ng lote, structural requirements, budget, at available na serbisyo. Mangyaring makipag-ugnayan sa aming team upang pag-usapan ang inyong proyekto."
  },
  {
    id: 16,
    category_slug: "construction-services",
    question_en: "Do you accept commercial construction projects?",
    question_tl: "Tumatanggap ba kayo ng commercial construction projects?",
    alt_questions: [
      "Do you build commercial buildings?",
      "Can you construct warehouses?",
      "Nagtatayo ba kayo ng commercial building o bodega?",
      "Commercial project pwede ba sa inyo?",
      "Warehouse construction"
    ],
    keywords: ["commercial", "warehouse", "building", "bodega", "komersyal", "negosyo", "industrial"],
    answer_en: "Please contact our team to confirm whether we can accommodate your commercial project and discuss its scope, location, and schedule.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma kung matutugunan namin ang inyong commercial project at mapag-usapan ang saklaw, lokasyon, at schedule nito."
  },
  {
    id: 17,
    category_slug: "construction-services",
    question_en: "Can you build a house based on my own design?",
    question_tl: "Pwede ba kayong magtayo ng bahay gamit ang sarili kong disenyo o plano?",
    alt_questions: [
      "Can you build from my existing plans?",
      "I have my own blueprints can you build it?",
      "May sarili na akong plano pwede ba ninyo itayo?",
      "Kayo ba magtatayo kung may sariling design na ako?"
    ],
    keywords: ["own design", "own plan", "sariling plano", "blueprints", "sariling disenyo", "client plan"],
    answer_en: "You may share your proposed design with our team for an initial assessment. We will need to review the plans, site conditions, technical requirements, and project scope before confirming whether we can accommodate the project.",
    answer_tl: "Maaari ninyong ibahagi ang inyong planong disenyo sa aming team para sa panimulang pagsusuri. Kakailanganin naming suriin ang mga plano, kalagayan ng lote, technical requirements, at saklaw ng proyekto bago makumpirma kung kaya itong tanggapin."
  },
  {
    id: 18,
    category_slug: "construction-services",
    question_en: "Can you help me plan a house from scratch?",
    question_tl: "Matutulungan niyo ba akong magplano ng bahay mula sa simula?",
    alt_questions: [
      "Can you help plan from scratch?",
      "I don't have plans yet can you help?",
      "Wala pa akong plano matutulungan niyo ba ako mula simula?",
      "Simula sa scratch pwede ba magpatulong?"
    ],
    keywords: ["plan from scratch", "planning", "simula", "magplano", "start", "scratch"],
    answer_en: "Please tell us about your preferred house size, design, number of bedrooms, location, and budget. Our team can explain which planning and construction services are available for your project.",
    answer_tl: "Mangyaring sabihin sa amin ang inyong gustong sukat ng bahay, disenyo, bilang ng kwarto, lokasyon, at budget. Maipapaliwanag ng aming team kung anong planning at construction services ang available para sa inyong proyekto."
  },
  {
    id: 19,
    category_slug: "construction-services",
    question_en: "Do you handle interior finishing?",
    question_tl: "Kasama ba o ginagawa niyo ba ang interior finishing?",
    alt_questions: [
      "Do you do interior finishes?",
      "Is interior design and finishing included?",
      "Gumagawa ba kayo ng interior finishing?",
      "Finishes ng bahay kasama ba?"
    ],
    keywords: ["interior finishing", "finishes", "interior", "tiles", "kisame", "pintura", "ceiling"],
    answer_en: "Interior finishing requirements vary depending on the project and agreed scope of work. Please provide details about the finishes you need so our team can confirm which services are available.",
    answer_tl: "Ang mga pangangailangan sa interior finishing ay nag-iiba depende sa proyekto at napagkasunduang saklaw ng trabaho. Mangyaring magbigay ng detalye tungkol sa mga finish na kailangan ninyo upang makumpirma ng aming team kung anong serbisyo ang available."
  },
  {
    id: 20,
    category_slug: "construction-services",
    question_en: "Can MCPA supply construction materials?",
    question_tl: "Nagsu-supply ba ang MCPA ng mga construction materials?",
    alt_questions: [
      "Do you sell construction materials?",
      "Can I buy materials from you?",
      "Nagbebenta ba kayo ng materyales?",
      "Pwede ba bumili ng semento o bakal sa inyo?",
      "Supply of materials"
    ],
    keywords: ["supply", "materials", "materyales", "semento", "bakal", "hardware", "aggregates"],
    answer_en: "Please contact our team to confirm the construction materials and supply services currently available. You may include the material type, quantity, specifications, and delivery location in your inquiry.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma ang mga construction materials at supply services na kasalukuyang available. Maaari ninyong isama ang uri ng materyales, dami, specifications, at delivery location sa inyong inquiry."
  },

  // ==================== CATEGORY 3: PROJECT ESTIMATES AND QUOTATIONS ====================
  {
    id: 21,
    category_slug: "estimates-quotations",
    question_en: "How can I request a construction quotation?",
    question_tl: "Paano ako makakahingi ng quotation para sa konstruksyon?",
    alt_questions: [
      "How to get a quote?",
      "Can I ask for an estimate?",
      "Paano humingi ng quotation?",
      "Pano magpa-quote sa MCPA?",
      "Gusto ko magpa-estimate"
    ],
    keywords: ["quotation", "quote", "estimate", "humingi", "presyo", "inquire", "request quote"],
    answer_en: "You can send us an inquiry through our website or official communication channels. Include your project location, proposed construction type, approximate floor area, preferred design, and estimated budget so our team can understand your requirements.",
    answer_tl: "Maaari kayong magpadala ng inquiry sa pamamagitan ng aming website o opisyal na communication channels. Isama ang lokasyon ng proyekto, uri ng konstruksyon, tinatayang floor area, gustong disenyo, at tinatayang budget upang maunawaan ng aming team ang inyong mga pangangailangan."
  },
  {
    id: 22,
    category_slug: "estimates-quotations",
    question_en: "Is the construction quotation free?",
    question_tl: "Libre ba ang construction quotation?",
    alt_questions: [
      "Is the quote free?",
      "May bayad ba ang quotation?",
      "Libre ba magpa-estimate?",
      "Free consultation ba?",
      "Free quotation"
    ],
    keywords: ["free quotation", "libre", "bayad", "cost of quotation", "free estimate", "consultation"],
    answer_en: "Please confirm with our team whether an initial quotation or consultation is free for your specific project. Additional services, assessments, or professional work may have separate charges depending on the agreed arrangement.",
    answer_tl: "Mangyaring kumpirmahin sa aming team kung libre ang paunang quotation o konsultasyon para sa inyong partikular na proyekto. Ang karagdagang serbisyo, pagsusuri, o propesyonal na trabaho ay maaaring may hiwalay na bayad depende sa napagkasunduang arrangement."
  },
  {
    id: 23,
    category_slug: "estimates-quotations",
    question_en: "How much does it cost to build a house?",
    question_tl: "Magkano ang magagastos sa pagpapatayo ng bahay?",
    alt_questions: [
      "What is the total cost to build a house?",
      "Cost of building a house?",
      "Magkano magpatayo ng bahay?",
      "Magkano aabutin sa pagpagawa ng bahay?",
      "House building cost estimate"
    ],
    keywords: ["cost to build", "magkano", "gastos", "house cost", "total cost", "pagpapatayo", "halaga"],
    answer_en: "The cost of building a house depends on its floor area, design, structural requirements, materials, labor, location, site conditions, and scope of work. Please share your project details so our team can assess the requirements for a quotation.",
    answer_tl: "Ang halaga ng pagpapatayo ng bahay ay nakadepende sa floor area, disenyo, structural requirements, materyales, labor, lokasyon, kalagayan ng lote, at saklaw ng trabaho. Mangyaring ibahagi ang mga detalye ng inyong proyekto upang masuri ng aming team para sa quotation."
  },
  {
    id: 24,
    category_slug: "estimates-quotations",
    question_en: "How much is the construction cost per square meter?",
    question_tl: "Magkano ang construction cost bawat square meter (sqm)?",
    alt_questions: [
      "What is the cost per sqm?",
      "Cost per square meter?",
      "Magkano per sqm?",
      "Presyo kada square meter?",
      "Rate per sqm"
    ],
    keywords: ["cost per sqm", "square meter", "per sqm", "kada sqm", "bawat metro", "sqm rate"],
    answer_en: "Construction cost per square meter varies depending on the design, specifications, materials, location, and level of finishing. MCPA's current rates must be confirmed by our team. Please provide your estimated floor area and preferred specifications for an initial assessment.",
    answer_tl: "Ang halaga ng konstruksyon kada square meter ay nag-iiba depende sa disenyo, specifications, materyales, lokasyon, at antas ng finishing. Ang kasalukuyang rates ng MCPA ay dapat kumpirmahin sa aming team. Mangyaring ibigay ang inyong tinatayang floor area at gustong specifications para sa panimulang pagsusuri."
  },
  {
    id: 25,
    category_slug: "estimates-quotations",
    question_en: "What information do I need to provide to get a quotation?",
    question_tl: "Anong impormasyon ang kailangan kong ibigay para makakuha ng quotation?",
    alt_questions: [
      "What details are needed for a quote?",
      "Requirements for quotation?",
      "Ano kailangan ibigay para sa estimate?",
      "Anong kailangang detalye para sa presyo?",
      "Quote requirements"
    ],
    keywords: ["information needed", "details", "requirements", "impormasyon", "detalye", "quotation"],
    answer_en: "Helpful information includes your project location, proposed floor area, house design or reference images, number of floors, preferred materials, target budget, and desired completion date. Available architectural or engineering plans can also help our team understand the project.",
    answer_tl: "Ang mga makatutulong na impormasyon ay kinabibilangan ng lokasyon ng proyekto, planong floor area, disenyo ng bahay o reference images, bilang ng palapag, gustong materyales, target budget, at gustong completion date. Ang mga available na architectural o engineering plans ay makatutulong din upang maunawaan ang proyekto."
  },
  {
    id: 26,
    category_slug: "estimates-quotations",
    question_en: "Can I request a quotation without architectural plans?",
    question_tl: "Pwede ba akong humingi ng quotation kahit wala pang architectural plans?",
    alt_questions: [
      "Can I get a quote without blueprints?",
      "No plans yet can I get an estimate?",
      "Pwede ba magpa-quote kahit walang plano?",
      "Wala pa akong blueprint pwede ba humingi ng estimate?"
    ],
    keywords: ["without plans", "no blueprints", "walang plano", "walang blueprint", "concept only"],
    answer_en: "You may send an initial inquiry even if you do not have complete plans. Please provide your project concept, approximate floor area, location, and budget. Our team can explain what additional information is needed before preparing a detailed quotation.",
    answer_tl: "Maaari kayong magpadala ng panimulang inquiry kahit wala pang kumpletong plano. Mangyaring ibigay ang konsepto ng inyong proyekto, tinatayang floor area, lokasyon, at budget. Maipapaliwanag ng aming team kung anong karagdagang impormasyon ang kailangan bago maihanda ang detalyadong quotation."
  },
  {
    id: 27,
    category_slug: "estimates-quotations",
    question_en: "How long does it take to prepare a quotation?",
    question_tl: "Gaano katagal bago maihanda ang isang quotation?",
    alt_questions: [
      "Turnaround time for quote?",
      "How many days for estimate?",
      "Ilang araw bago makuha ang quotation?",
      "Gaano katagal ang estimate?",
      "Quotation lead time"
    ],
    keywords: ["turnaround time", "how long", "gaano katagal", "quotation time", "ilang araw", "lead time"],
    answer_en: "The preparation time depends on the complexity of the project and the completeness of the information provided. Please contact our team to confirm the expected turnaround time for your inquiry.",
    answer_tl: "Ang tagal ng paghahanda ay nakadepende sa pagiging kumplikado ng proyekto at sa pagiging kumpleto ng impormasyong ibinigay. Mangyaring makipag-ugnayan sa aming team upang makumpirma ang inaasahang turnaround time para sa inyong inquiry."
  },
  {
    id: 28,
    category_slug: "estimates-quotations",
    question_en: "Can I request a quotation for a renovation only?",
    question_tl: "Pwede ba akong humingi ng quotation para sa renobasyon lamang?",
    alt_questions: [
      "Can I get a quote for renovation?",
      "Renovation estimate only?",
      "Pwede ba estimate sa renovation lang?",
      "Quotation para sa renobasyon lamang?",
      "Remodel quote"
    ],
    keywords: ["renovation quotation", "renovation only", "renobasyon lang", "remodel quote"],
    answer_en: "Yes, you may submit an inquiry about a proposed renovation. Please provide the property location, areas to be renovated, desired improvements, and available photos so our team can assess whether the project is within our service scope.",
    answer_tl: "Opo, maaari kayong magsumite ng inquiry para sa planong renobasyon. Mangyaring ibigay ang lokasyon ng ari-arian, mga bahaging aayusin, mga gustong pagbabago, at mga larawan upang masuri ng aming team kung pasok ito sa aming service scope."
  },
  {
    id: 29,
    category_slug: "estimates-quotations",
    question_en: "Can you revise my quotation if my budget changes?",
    question_tl: "Pwede bang baguhin o i-revise ang quotation kung nagbago ang aking budget?",
    alt_questions: [
      "Can a quote be adjusted?",
      "What if my budget changes?",
      "Pwede ba i-adjust ang estimate pag nagbago budget?",
      "Pwedeng pababain ang quote?",
      "Budget revision"
    ],
    keywords: ["revise quotation", "budget changes", "adjustment", "baguhin", "adjust quote", "revise"],
    answer_en: "You may request a quotation review if your budget or project requirements change. Any revised scope, material specifications, or pricing will need to be reviewed and confirmed by our team.",
    answer_tl: "Maaari kayong humiling ng pagsusuri sa quotation kung magbago ang inyong budget o mga kinakailangan sa proyekto. Ang anumang binagong saklaw, material specifications, o presyo ay kailangang suriin at kumpirmahin ng aming team."
  },
  {
    id: 30,
    category_slug: "estimates-quotations",
    question_en: "How can I know whether my budget is enough?",
    question_tl: "Paano ko malalaman kung sapat ang aking budget?",
    alt_questions: [
      "Is my budget enough?",
      "How do I check if my budget fits?",
      "Kasya ba ang budget ko?",
      "Sapat ba ang pera ko para magpatayo?",
      "Affordability check"
    ],
    keywords: ["budget enough", "kasya ba", "sapat ba", "affordability", "kaya ba ng budget", "budget fit"],
    answer_en: "The suitability of your budget depends on the project size, design, materials, site conditions, and required work. Share your estimated budget and project details with our team so we can discuss the available options without assuming that every requirement will fit within your budget.",
    answer_tl: "Ang kaangkupan ng inyong budget ay nakadepende sa laki ng proyekto, disenyo, materyales, kalagayan ng lote, at kinakailangang trabaho. Ibahagi ang inyong tinatayang budget at mga detalye ng proyekto sa aming team upang mapag-usapan ang mga posibleng opsyon nang may makatotohanang pagsusuri."
  },

  // ==================== CATEGORY 4: PAYMENT AND CONTRACT TERMS ====================
  {
    id: 31,
    category_slug: "payment-contracts",
    question_en: "What payment methods does MCPA accept?",
    question_tl: "Anong mga paraan ng pagbabayad ang tinatanggap ng MCPA?",
    alt_questions: [
      "What are your payment methods?",
      "How can I pay?",
      "Anong mode of payment meron kayo?",
      "Paano magbayad sa MCPA?",
      "Payment channels"
    ],
    keywords: ["payment methods", "mode of payment", "paraan ng pagbabayad", "pay", "bank transfer", "cash", "cheque"],
    answer_en: "Our available payment methods must be confirmed by our team. Please ask for the official payment instructions before making any payment.",
    answer_tl: "Ang aming mga available na paraan ng pagbabayad ay dapat kumpirmahin sa aming team. Mangyaring humingi ng opisyal na tagubilin sa pagbabayad bago magbayad ng anuman."
  },
  {
    id: 32,
    category_slug: "payment-contracts",
    question_en: "Do you require a down payment?",
    question_tl: "Kailangan ba ng down payment o paunang bayad?",
    alt_questions: [
      "Is downpayment required?",
      "How much is down payment?",
      "May downpayment ba?",
      "Kailangan ba ng paunang bayad?",
      "Initial deposit required"
    ],
    keywords: ["down payment", "downpayment", "paunang bayad", "deposit", "initial payment"],
    answer_en: "Any required down payment will depend on the agreed contract and payment terms. Our team will explain the applicable amount and schedule before the agreement is finalized.",
    answer_tl: "Ang anumang kinakailangang down payment ay nakadepende sa napagkasunduang kontrata at terms of payment. Ipapaliwanag ng aming team ang kaukulang halaga at schedule bago maisapinal ang kasunduan."
  },
  {
    id: 33,
    category_slug: "payment-contracts",
    question_en: "What is your payment schedule for construction projects?",
    question_tl: "Ano ang payment schedule para sa mga proyekto sa konstruksyon?",
    alt_questions: [
      "How are payments scheduled?",
      "Milestone billing schedule?",
      "Ano ang schedule ng bayad?",
      "Kailan magbabayad habang ginagawa ang bahay?",
      "Progress payment milestones"
    ],
    keywords: ["payment schedule", "schedule ng bayad", "milestones", "progress billing", "hulog", "billing"],
    answer_en: "Payment schedules depend on the signed agreement and the approved project milestones. Please request a written payment schedule showing the amounts, due dates, and conditions before construction begins.",
    answer_tl: "Ang payment schedules ay nakadepende sa nilagdaang kasunduan at sa mga naaprubahang milestones ng proyekto. Mangyaring humiling ng nakasulat na payment schedule na nagpapakita ng halaga, due dates, at kondisyon bago magsimula ang konstruksyon."
  },
  {
    id: 34,
    category_slug: "payment-contracts",
    question_en: "Can I pay in installments?",
    question_tl: "Pwede ba akong magbayad nang hulugan o installments?",
    alt_questions: [
      "Can I pay via installment?",
      "Is installment accepted?",
      "Pwede ba hulugan ang bayad?",
      "Tumatanggap ba kayo ng installment?",
      "Installment basis"
    ],
    keywords: ["installment", "hulugan", "pay in installments", "hulog-hulog", "terms"],
    answer_en: "Installment arrangements depend on the payment terms approved for your project. Please discuss your preferred payment arrangement with our team before signing the contract.",
    answer_tl: "Ang mga installment arrangement ay nakadepende sa payment terms na naaprubahan para sa inyong proyekto. Mangyaring talakayin ang inyong gustong paraan ng pagbabayad sa aming team bago lumagda sa kontrata."
  },
  {
    id: 35,
    category_slug: "payment-contracts",
    question_en: "Do you offer a build-now-pay-later program?",
    question_tl: "Nag-aalok ba kayo ng build-now-pay-later program?",
    alt_questions: [
      "Do you have BNPL?",
      "Is Build Now Pay Later available?",
      "May build now pay later ba kayo?",
      "Ano ang BNPL ng MCPA?",
      "BNPL financing"
    ],
    keywords: ["build now pay later", "bnpl", "financing", "pautang", "hulugan bahay", "loan"],
    answer_en: "Please contact our team to confirm the current availability, eligibility requirements, and terms of any build-now-pay-later program. Program availability and conditions should be verified before making a financial commitment.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang makumpirma ang kasalukuyang availability, eligibility requirements, at mga tuntunin ng anumang build-now-pay-later program. Ang availability at kondisyon ng programa ay dapat munang kumpirmahin bago gumawa ng pinansyal na pangako."
  },
  {
    id: 36,
    category_slug: "payment-contracts",
    question_en: "Will I receive an official quotation and contract?",
    question_tl: "Makakatanggap ba ako ng opisyal na quotation at kontrata?",
    alt_questions: [
      "Do you provide written contracts?",
      "Is there an official contract?",
      "May opisyal bang kontrata?",
      "Pirmadong kontrata at quotation meron ba?",
      "Contract documentation"
    ],
    keywords: ["official contract", "written agreement", "kontrata", "kasunduan", "quotation", "legal document"],
    answer_en: "Please ask our team which project documents will be provided for your proposed arrangement. Before proceeding, ensure that the approved scope of work, contract price, payment schedule, timeline, and applicable conditions are documented in writing.",
    answer_tl: "Mangyaring itanong sa aming team kung anong mga dokumento ng proyekto ang ibibigay para sa inyong napag-usapang arrangement. Bago magpatuloy, tiyaking ang naaprubahang saklaw ng trabaho, presyo ng kontrata, payment schedule, timeline, at mga kaukulang kondisyon ay nakasulat sa opisyal na dokumento."
  },
  {
    id: 37,
    category_slug: "payment-contracts",
    question_en: "Can I cancel my construction contract?",
    question_tl: "Pwede ko bang kanselahin ang aking construction contract?",
    alt_questions: [
      "Can I cancel the contract?",
      "What is your cancellation policy?",
      "Pwede ba i-cancel ang kontrata?",
      "Paano mag-cancel ng kasunduan?",
      "Contract termination"
    ],
    keywords: ["cancel contract", "cancellation", "kanselahin", "pagkansela", "terminate", "pre-termination"],
    answer_en: "Contract cancellation depends on the terms of your signed agreement and the circumstances of the cancellation. Please review the relevant provisions and contact our team to discuss the appropriate process.",
    answer_tl: "Ang pagkansela ng kontrata ay nakadepende sa mga probisyon ng inyong nilagdaang kasunduan at sa mga dahilan ng pagkansela. Mangyaring suriin ang kaukulang mga probisyon at makipag-ugnayan sa aming team upang mapag-usapan ang tamang proseso."
  },
  {
    id: 38,
    category_slug: "payment-contracts",
    question_en: "Are there additional charges beyond the quotation?",
    question_tl: "May karagdagang bayad ba lampas sa ibinigay na quotation?",
    alt_questions: [
      "Are there hidden fees?",
      "Will the price increase?",
      "May dagdag bayad ba?",
      "May hidden charges ba?",
      "Sisingilin pa ba ako ng sobra?",
      "Unexpected extra fees"
    ],
    keywords: ["additional charges", "hidden fees", "dagdag bayad", "sobrang singil", "extra cost", "hidden cost"],
    answer_en: "Additional charges may arise if the agreed scope changes, unforeseen conditions are discovered, or excluded items require additional work. Any applicable additional cost should be explained and documented for your review before the extra work proceeds.",
    answer_tl: "Ang karagdagang singil ay maaaring maganap kung magbago ang napagkasunduang saklaw, may matuklasang hindi inaasahang kalagayan sa site, o kailangan ng karagdagang trabaho sa mga ibinukod na aytem. Ang anumang karagdagang gastos ay dapat ipaliwanag at idokumento bago simulan ang karagdagang trabaho."
  },
  {
    id: 39,
    category_slug: "payment-contracts",
    question_en: "Can I change the payment schedule after signing the contract?",
    question_tl: "Pwede ko bang baguhin ang payment schedule pagkatapos mapirmahan ang kontrata?",
    alt_questions: [
      "Can payment schedule be altered?",
      "What if I can't pay on schedule?",
      "Pwede ba i-adjust ang petsa ng bayad?",
      "Mababago ba ang payment terms pag pumirma na?"
    ],
    keywords: ["change payment schedule", "adjust payment", "baguhin ang bayad", "reschedule payment", "payment terms"],
    answer_en: "Changes to the payment schedule require review and agreement between the parties. Please contact the assigned project representative to discuss the requested changes and have any approved revisions documented properly.",
    answer_tl: "Ang mga pagbabago sa payment schedule ay nangangailangan ng pagsusuri at pagsang-ayon ng magkabilang panig. Mangyaring makipag-ugnayan sa inyong assigned project representative upang talakayin ang hiniling na pagbabago at maipasaayos ang dokumentasyon."
  },
  {
    id: 40,
    category_slug: "payment-contracts",
    question_en: "How can I verify that a payment request is legitimate?",
    question_tl: "Paano ko makukumpirma kung lehitimo ang isang payment request?",
    alt_questions: [
      "How to avoid payment scams?",
      "Is this official MCPA account?",
      "Paano malalaman kung totoo ang singil?",
      "Baka scam ang humihingi ng bayad?",
      "Verify bank account"
    ],
    keywords: ["verify payment", "legitimate payment", "scam protection", "lehitimo", "opisyal na bayaran", "bank verification"],
    answer_en: "Please verify payment instructions directly with an authorized MCPA representative using a trusted official communication channel. Do not send money to an unfamiliar account or rely solely on an unverified message or social media profile.",
    answer_tl: "Mangyaring kumpirmahin ang mga tagubilin sa pagbabayad nang direkta sa awtorisadong kinatawan ng MCPA gamit ang pinagkakatiwalaang opisyal na channel. Huwag magpadala ng pera sa hindi kilalang account o magtiwala lamang sa hindi beripikadong mensahe o social media profile."
  },

  // ==================== CATEGORY 5: PROJECT TIMELINE AND MANAGEMENT ====================
  {
    id: 41,
    category_slug: "timeline-management",
    question_en: "How long does it take to build a house?",
    question_tl: "Gaano katagal magtayo ng bahay?",
    alt_questions: [
      "Construction duration for a house?",
      "How many months to finish a house?",
      "Ilang buwan bago matapos ang bahay?",
      "Gaano katagal ang pagpapagawa?",
      "House construction timeline"
    ],
    keywords: ["how long", "timeline", "duration", "ilang buwan", "gaano katagal", "completion", "tagal"],
    answer_en: "The construction timeline depends on the floor area, design complexity, site conditions, material availability, weather, permits, and project scope. Our team can provide an estimated timeline after reviewing your project requirements.",
    answer_tl: "Ang tagal ng konstruksyon ay nakadepende sa floor area, pagiging kumplikado ng disenyo, kalagayan ng lote, supply ng materyales, panahon, permit, at saklaw ng proyekto. Makapagbibigay ang aming team ng tinatayang timeline pagkatapos masuri ang inyong mga pangangailangan."
  },
  {
    id: 42,
    category_slug: "timeline-management",
    question_en: "Can you guarantee the completion date?",
    question_tl: "Magagarantiya ba ninyo ang eksaktong completion date o petsa ng pagtatapos?",
    alt_questions: [
      "Is completion date guaranteed?",
      "Can you promise exact completion date?",
      "Garantisado ba ang petsa ng tapos?",
      "Sigurado bang matatapos sa takdang araw?",
      "Guaranteed schedule"
    ],
    keywords: ["guarantee completion", "completion date", "eksaktong petsa", "garantisado", "deadline", "guarantee date"],
    answer_en: "The target completion date should be established in the project agreement based on the approved scope and schedule. Actual progress may be affected by circumstances addressed in the contract, so please discuss the applicable timeline and delay provisions with our team.",
    answer_tl: "Ang target completion date ay dapat nakalagay sa kasunduan ng proyekto batay sa naaprubahang saklaw at schedule. Ang aktwal na pag-usad ay maaaring maapektuhan ng mga pangyayaring tinutukoy sa kontrata, kaya talakayin sa aming team ang mga probisyon sa timeline at posibleng pagkaantala."
  },
  {
    id: 43,
    category_slug: "timeline-management",
    question_en: "Who will manage my construction project?",
    question_tl: "Sino ang mamamahala sa aking construction project?",
    alt_questions: [
      "Who is the project manager?",
      "Who oversees the site?",
      "Sino ang magha-handle ng project ko?",
      "May engineer ba na nakatoka sa bahay ko?",
      "Site supervisor"
    ],
    keywords: ["project manager", "engineer", "supervision", "mamamahala", "tagapamahala", "oversee", "supervisor"],
    answer_en: "The assigned project manager or engineer, if applicable, should be identified during project coordination. Please ask our team who will oversee your project and serve as your main point of contact.",
    answer_tl: "Ang nakatalagang project manager o engineer, kung naaangkop, ay tutukuyin habang isinasagawa ang project coordination. Mangyaring itanong sa aming team kung sino ang mamamahala sa inyong proyekto at magsisilbing pangunahing contact person."
  },
  {
    id: 44,
    category_slug: "timeline-management",
    question_en: "How often can I receive construction progress updates?",
    question_tl: "Gaano kadalas ako makakatanggap ng construction progress updates?",
    alt_questions: [
      "How frequent are project updates?",
      "Will I get weekly reports?",
      "Gaano kadalas ang update sa gawa?",
      "May report ba sa progreso ng bahay?",
      "Frequency of updates"
    ],
    keywords: ["progress updates", "updates", "reports", "kadalas", "ulat", "progreso", "reporting frequency"],
    answer_en: "Progress reporting should follow the communication arrangement agreed upon for your project. Please discuss your preferred update frequency and reporting method with the assigned project representative.",
    answer_tl: "Ang pag-uulat ng progreso ay dapat sumunod sa communication arrangement na napagkasunduan para sa inyong proyekto. Mangyaring pag-usapan ang inyong gustong dalas ng updates at paraan ng pag-uulat sa inyong assigned project representative."
  },
  {
    id: 45,
    category_slug: "timeline-management",
    question_en: "Can I visit the construction site?",
    question_tl: "Pwede ba akong bumisita sa construction site habang ginagawa?",
    alt_questions: [
      "Can I inspect the construction site?",
      "Are site visits allowed during construction?",
      "Pwede ba pumunta sa site habang ginagawa?",
      "Bawal ba bumisita sa site?",
      "Site visit policy"
    ],
    keywords: ["visit site", "site inspection", "bisita sa site", "pumunta sa construction site", "site visit"],
    answer_en: "Site visits should be coordinated with the assigned project representative to maintain safety and avoid disrupting ongoing work. Please arrange a visit in advance and follow the site's safety requirements.",
    answer_tl: "Ang pagbisita sa site ay dapat i-coordinate sa assigned project representative upang mapanatili ang kaligtasan at maiwasan ang abala sa kasalukuyang trabaho. Mangyaring mag-abiso nang maaga at sundin ang mga alituntunin sa kaligtasan sa site."
  },
  {
    id: 46,
    category_slug: "timeline-management",
    question_en: "What happens if construction is delayed by bad weather?",
    question_tl: "Ano ang mangyayari kung maantala ang konstruksyon dahil sa masamang panahon?",
    alt_questions: [
      "What if it rains or typhoons delay work?",
      "Weather delay policy?",
      "Paano pag umulan o may bagyo?",
      "Maaantala ba pag masama ang panahon?",
      "Typhoon delays"
    ],
    keywords: ["weather delay", "bad weather", "bagyo", "ulan", "antala", "masamang panahon", "rain"],
    answer_en: "Bad weather may affect certain construction activities and the overall schedule. The project team should assess the impact, communicate any relevant changes, and follow the delay-management provisions agreed upon in the contract.",
    answer_tl: "Ang masamang panahon ay maaaring makaapekto sa ilang aktibidad sa konstruksyon at sa pangkalahatang schedule. Susuriin ng project team ang epekto, ipapaalam ang mga kaukulang pagbabago, at susundin ang delay-management provisions na nakasaad sa kontrata."
  },
  {
    id: 47,
    category_slug: "timeline-management",
    question_en: "What happens if construction materials become unavailable?",
    question_tl: "Ano ang mangyayari kung hindi maging available ang mga construction materials?",
    alt_questions: [
      "What if materials are out of stock?",
      "Material shortage handling?",
      "Paano kung maubos ang materyales sa merkado?",
      "Paano pag walang supply ng materyales?",
      "Material availability issues"
    ],
    keywords: ["material shortage", "unavailable materials", "walang supply", "out of stock", "pamalit na materyales", "shortage"],
    answer_en: "Material shortages may affect procurement and scheduling. The project team should discuss suitable alternatives, confirm any differences in specifications or cost, and obtain the necessary approval before implementing changes.",
    answer_tl: "Ang kakulangan sa materyales ay maaaring makaapekto sa procurement at scheduling. Tatalakayin ng project team ang mga angkop na alternatibo, kukumpirmahin ang anumang kaibahan sa specifications o gastos, at kukuha ng inyong pahintulot bago ipatupad ang pagbabago."
  },
  {
    id: 48,
    category_slug: "timeline-management",
    question_en: "Can I request changes while construction is ongoing?",
    question_tl: "Pwede ba akong humiling ng pagbabago habang ginagawa na ang konstruksyon?",
    alt_questions: [
      "Can I change plans during construction?",
      "Modifications while building?",
      "Pwede ba magbago ng isip habang ginagawa?",
      "Pwedeng palitan ang plano habang on-going?",
      "Mid construction changes"
    ],
    keywords: ["request changes", "ongoing construction", "change order", "pagbabago", "palitan", "mid-project"],
    answer_en: "You may request changes during construction, but the impact on cost, materials, and completion time must be assessed. Approved changes should be documented in writing before the additional work proceeds.",
    answer_tl: "Maaari kayong humiling ng mga pagbabago habang ginagawa ang konstruksyon, ngunit kailangang suriin ang epekto nito sa gastos, materyales, at oras ng pagtatapos. Ang mga naaprubahang pagbabago ay dapat maidokumento nang nakasulat bago simulan ang karagdagang trabaho."
  },
  {
    id: 49,
    category_slug: "timeline-management",
    question_en: "How will I know if my project is on schedule?",
    question_tl: "Paano ko malalaman kung on schedule o nasa tamang takbo ang aking proyekto?",
    alt_questions: [
      "Is my project on track?",
      "How to track progress against milestones?",
      "Nasa oras ba ang gawa ng bahay ko?",
      "Paano malalaman kung delayed ang project?",
      "Tracking project schedule"
    ],
    keywords: ["on schedule", "on track", "project schedule", "nasa oras", "progreso", "milestone tracking"],
    answer_en: "Your assigned project representative can explain the approved project schedule and available progress reports. Ask for updates comparing completed work against the planned milestones.",
    answer_tl: "Maipapaliwanag ng inyong assigned project representative ang naaprubahang schedule ng proyekto at ang mga available na progress reports. Humingi ng regular na ulat na nagkukumpara sa natapos na trabaho laban sa nakatakdang milestones."
  },
  {
    id: 50,
    category_slug: "timeline-management",
    question_en: "Who should I contact if I have concerns about construction progress?",
    question_tl: "Sino ang dapat kong tawagan o kontakin kung may alalahanin ako sa progreso ng konstruksyon?",
    alt_questions: [
      "Who to call for complaints about site work?",
      "Concern about project progress?",
      "Sino kakausapin pag may reklamo sa gawa?",
      "May problema sa gawa sino kokontakin?",
      "Escalate progress issues"
    ],
    keywords: ["contact for concerns", "complaints", "progress concerns", "alalahanin", "reklamo", "problema"],
    answer_en: "Contact your assigned project representative first and explain your concern clearly. If you do not have their contact details, reach out through an official MCPA communication channel and request assistance.",
    answer_tl: "Makipag-ugnayan muna sa inyong assigned project representative at ipaliwanag nang malinaw ang inyong alalahanin. Kung wala kayong contact details nila, makipag-ugnayan sa pamamagitan ng opisyal na communication channel ng MCPA at humingi ng tulong."
  },

  // ==================== CATEGORY 6: MATERIALS, DESIGN, AND SCOPE OF WORK ====================
  {
    id: 51,
    category_slug: "materials-design-scope",
    question_en: "What materials will be used for my construction project?",
    question_tl: "Anong mga materyales ang gagamitin para sa aking construction project?",
    alt_questions: [
      "What materials do you use?",
      "What are the material specifications?",
      "Anong klase ng materyales ang gagamitin?",
      "Anong brand ng materyales ang gamit ninyo?",
      "Project materials list"
    ],
    keywords: ["materials used", "specifications", "materyales", "klase ng semento", "materyales ng bahay", "brands"],
    answer_en: "Materials depend on the approved plans, specifications, quotation, and contract. Ask our team for the material specifications applicable to your project before approving the final scope.",
    answer_tl: "Ang mga materyales ay nakadepende sa naaprubahang plano, specifications, quotation, at kontrata. Hingin sa aming team ang material specifications na naaangkop sa inyong proyekto bago aprubahan ang pinal na saklaw."
  },
  {
    id: 52,
    category_slug: "materials-design-scope",
    question_en: "Can I choose my own construction materials?",
    question_tl: "Pwede ba akong pumili ng sarili kong construction materials?",
    alt_questions: [
      "Can I select the materials for my house?",
      "Can I provide my own tiles or fixtures?",
      "Pwede ba ako mamili ng materyales?",
      "Ako ba pipili ng tiles at pintura?",
      "Client supplied materials"
    ],
    keywords: ["choose materials", "own materials", "pumili ng materyales", "sariling materyales", "select fixtures"],
    answer_en: "You may discuss your preferred materials with our team. Their suitability depends on the design, technical specifications, availability, budget, and applicable professional requirements.",
    answer_tl: "Maaari ninyong talakayin ang inyong gustong materyales sa aming team. Ang kaangkupan ng mga ito ay nakadepende sa disenyo, technical specifications, availability, budget, at mga propesyonal na pamantayan."
  },
  {
    id: 53,
    category_slug: "materials-design-scope",
    question_en: "Can I change the materials after the quotation is approved?",
    question_tl: "Pwede ko bang palitan ang mga materyales pagkatapos maaprubahan ang quotation?",
    alt_questions: [
      "Can I change materials after quote approval?",
      "Can I upgrade materials later on?",
      "Pwede ba palitan ang materyales pag approved na ang estimate?",
      "Palit ng materyales habang ginagawa?",
      "Material upgrade"
    ],
    keywords: ["change materials", "upgrade materials", "palitan ang materyales", "re-spec", "material changes"],
    answer_en: "Material changes may affect the cost, availability, and construction schedule. Please request a formal review and obtain approval for any revised specifications and associated costs before implementation.",
    answer_tl: "Ang pagpapalit ng materyales ay maaaring makaapekto sa presyo, availability, at schedule ng konstruksyon. Mangyaring humiling ng pormal na pagsusuri at kumuha ng pag-apruba para sa anumang binagong specifications at kaukulang gastos bago ito ipatupad."
  },
  {
    id: 54,
    category_slug: "materials-design-scope",
    question_en: "What is included in the construction quotation?",
    question_tl: "Ano ang mga kasama o included sa construction quotation?",
    alt_questions: [
      "What is covered in the quotation?",
      "What scope of work is included in the price?",
      "Ano ang kasama sa presyo?",
      "Included ba ang labor at materials sa quote?",
      "Inclusions in quote"
    ],
    keywords: ["included in quotation", "scope of work", "kasama sa quotation", "saklaw", "inclusions", "labor materials"],
    answer_en: "The included work should be specified in the approved quotation or contract. Ask for an itemized breakdown covering the applicable labor, materials, equipment, supervision, and other project requirements.",
    answer_tl: "Ang mga kasamang trabaho ay dapat malinaw na nakasaad sa naaprubahang quotation o kontrata. Humingi ng detalyadong breakdown na sumasaklaw sa kaukulang labor, materyales, kagamitan, supervision, at iba pang pangangailangan ng proyekto."
  },
  {
    id: 55,
    category_slug: "materials-design-scope",
    question_en: "What is excluded from the construction quotation?",
    question_tl: "Ano ang mga hindi kasama o excluded sa construction quotation?",
    alt_questions: [
      "What is not included in the quotation?",
      "What are the exclusions in the quote?",
      "Ano ang hindi kasama sa presyo?",
      "Excluded items sa quotation?",
      "Quotation exclusions"
    ],
    keywords: ["excluded from quotation", "exclusions", "hindi kasama", "bukod sa quotation", "not included"],
    answer_en: "Excluded items vary by project. Please review the quotation's exclusions carefully and ask our team to clarify any items that are not explicitly included.",
    answer_tl: "Ang mga hindi kasamang aytem ay nag-iiba depende sa proyekto. Mangyaring suriing mabuti ang exclusions sa quotation at hilingin sa aming team na linawin ang anumang bagay na hindi tahasang nakasaad."
  },
  {
    id: 56,
    category_slug: "materials-design-scope",
    question_en: "Are building permits included in the construction cost?",
    question_tl: "Kasama ba ang building permits sa halaga o bayad sa konstruksyon?",
    alt_questions: [
      "Are building permits included in the price?",
      "Do you pay for permits or is it separate?",
      "Kasama ba building permit sa bayad?",
      "Permit fees kasama na ba?",
      "LGU permits included"
    ],
    keywords: ["permits included", "building permit cost", "kasama ba permit", "permit fees", "lgu fees"],
    answer_en: "Permit-related responsibilities and fees depend on the agreed scope of work. Please ask our team whether permit processing assistance, professional documents, government fees, and related requirements are included or charged separately.",
    answer_tl: "Ang mga responsibilidad at bayarin sa permit ay nakadepende sa napagkasunduang saklaw ng trabaho. Mangyaring itanong sa aming team kung ang tulong sa pagproseso ng permit, mga propesyonal na dokumento, bayarin sa gobyerno, at kaugnay na requirements ay kasama na o hiwalay na sisingilin."
  },
  {
    id: 57,
    category_slug: "materials-design-scope",
    question_en: "Can I provide my own architectural and engineering plans?",
    question_tl: "Pwede ba akong magbigay ng sarili kong architectural at engineering plans?",
    alt_questions: [
      "Can I bring my own blueprints?",
      "Do you accept client provided plans?",
      "Pwede ba sariling plano galing sa ibang architect?",
      "May blueprint na ako pwede ba gamitin sa inyo?"
    ],
    keywords: ["own plans", "bring own plans", "sariling blueprints", "sariling plano", "engineering plans", "client blueprints"],
    answer_en: "You may submit your available plans for review. Our team will need to confirm whether the documents are suitable for the proposed work and identify any additional requirements before construction can proceed.",
    answer_tl: "Maaari ninyong isumite ang inyong mga available na plano para masuri. Kakailanganin ng aming team na kumpirmahin kung ang mga dokumento ay angkop para sa planong trabaho at tukuyin ang anumang karagdagang kinakailangan bago makapagsimula ang konstruksyon."
  },
  {
    id: 58,
    category_slug: "materials-design-scope",
    question_en: "Can I request a different house design from the original plan?",
    question_tl: "Pwede ba akong humiling ng ibang disenyo ng bahay mula sa orihinal na plano?",
    alt_questions: [
      "Can design be modified from the original plan?",
      "Can I change the floor plan layout?",
      "Pwede ba baguhin ang design ng bahay mula sa plano?",
      "Custom design revision from original"
    ],
    keywords: ["different design", "change house design", "baguhin ang disenyo", "modify plan", "design revision"],
    answer_en: "You may request design revisions, subject to technical feasibility, applicable approvals, cost implications, and schedule changes. The revised design should be reviewed and approved before the corresponding work is carried out.",
    answer_tl: "Maaari kayong humiling ng mga rebisyon sa disenyo, alinsunod sa technical feasibility, mga kaukulang pag-apruba, epekto sa presyo, at pagbabago sa schedule. Ang binagong disenyo ay dapat munang suriin at aprubahan bago simulan ang kaugnay na trabaho."
  },
  {
    id: 59,
    category_slug: "materials-design-scope",
    question_en: "Can I request premium or customized finishes?",
    question_tl: "Pwede ba akong humiling ng premium o customized finishes?",
    alt_questions: [
      "Do you offer high-end or luxury finishes?",
      "Can I request custom tiles, lighting, or cabinets?",
      "Pwede ba premium materials o luxury finish?",
      "Customized finish pwede ba sa bahay?",
      "Upgraded interior finishes"
    ],
    keywords: ["premium finishes", "customized finishes", "luxury finishes", "high-end", "pasadyang finish", "custom finish"],
    answer_en: "Customized finishes may be possible depending on their availability, specifications, and compatibility with the project. Please share your preferred materials or reference images so the team can assess the requirements and any additional cost.",
    answer_tl: "Ang customized finishes ay maaaring maging posible depende sa availability, specifications, at kaangkupan sa proyekto. Mangyaring ibahagi ang inyong gustong materyales o reference photos upang masuri ng team ang mga kinakailangan at anumang karagdagang gastos."
  },
  {
    id: 60,
    category_slug: "materials-design-scope",
    question_en: "How do you handle unexpected site conditions?",
    question_tl: "Paano ninyo hinahawakan ang mga hindi inaasahang kondisyon sa site (hal. matubig o malambot na lupa)?",
    alt_questions: [
      "What if soil is soft or rocky?",
      "Unexpected underground issues?",
      "Paano kung may problema sa lupa?",
      "Hindi inaasahang sitwasyon sa site?",
      "Unforeseen site conditions"
    ],
    keywords: ["unexpected site conditions", "soil conditions", "problema sa lupa", "site issues", "unforeseen", "matubig"],
    answer_en: "Unexpected site conditions should be assessed by the appropriate project personnel. Any necessary changes to the scope, schedule, or cost should be explained and documented for approval in accordance with the project agreement.",
    answer_tl: "Ang mga hindi inaasahang kalagayan sa site ay dapat suriin ng mga karampatang tauhan ng proyekto. Ang anumang kinakailangang pagbabago sa saklaw, schedule, o gastos ay dapat ipaliwanag at idokumento para sa pag-apruba alinsunod sa kasunduan."
  },

  // ==================== CATEGORY 7: LICENSES, PERMITS, SAFETY, AND QUALITY ====================
  {
    id: 61,
    category_slug: "licenses-permits-safety",
    question_en: "Is MCPA licensed, bonded, and insured?",
    question_tl: "Lisensyado, bonded, at insured ba ang MCPA?",
    alt_questions: [
      "Are you a licensed contractor?",
      "Is MCPA insured and bonded?",
      "May lisensya ba ang MCPA?",
      "Insured at bonded ba kayo?",
      "Contractor licensing status"
    ],
    keywords: ["licensed", "bonded", "insured", "lisensyado", "insurance", "contractor license", "pcab", "bonds"],
    answer_en: "Please contact our authorized representative to confirm MCPA's current contractor licensing status and the availability and coverage of any applicable bonds or insurance. Supporting documentation should be provided when appropriate.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming awtorisadong kinatawan upang makumpirma ang kasalukuyang contractor licensing status ng MCPA at ang availability at saklaw ng anumang naaangkop na bonds o insurance. Ang kaukulang dokumentasyon ay maaaring ibigay kung nararapat."
  },
  {
    id: 62,
    category_slug: "licenses-permits-safety",
    question_en: "Will MCPA handle the necessary building permits?",
    question_tl: "Aayusin o hahawakan ba ng MCPA ang mga kinakailangang building permits?",
    alt_questions: [
      "Do you process building permits?",
      "Will you apply for permits for my project?",
      "Kayo ba mag-aayos ng building permit?",
      "Kasama ba permit processing assistance?",
      "Permit application coordination"
    ],
    keywords: ["handle permits", "building permits", "permit processing", "mag-aayos ng permit", "munisipyo", "city hall"],
    answer_en: "Permit-related responsibilities depend on the services included in the project agreement. Please confirm with our team whether permit preparation, application assistance, coordination, and government fees are included in your proposed arrangement.",
    answer_tl: "Ang mga responsibilidad sa permit ay nakadepende sa mga serbisyong kasama sa kasunduan ng proyekto. Mangyaring kumpirmahin sa aming team kung ang paghahanda ng permit, tulong sa aplikasyon, koordinasyon, at government fees ay kasama sa inyong napagkasunduan."
  },
  {
    id: 63,
    category_slug: "licenses-permits-safety",
    question_en: "Who is responsible for building permit fees?",
    question_tl: "Sino ang responsable o magbabayad para sa building permit fees?",
    alt_questions: [
      "Who pays for building permits?",
      "Is permit fee on the client or the contractor?",
      "Sino magbabayad ng permit fees sa munisipyo?",
      "Sino sasagot sa building permit?",
      "Responsibility for permit costs"
    ],
    keywords: ["permit fees", "who pays permit", "bayad sa permit", "responsable sa permit", "government fees"],
    answer_en: "Responsibility for permit fees should be specified in the quotation or contract. Please ask our team to identify the applicable fees, who will pay them, and whether they are included in the quoted amount.",
    answer_tl: "Ang responsibilidad para sa permit fees ay dapat malinaw na nakasaad sa quotation o kontrata. Mangyaring itanong sa aming team kung ano ang mga kaukulang bayarin, sino ang magbabayad ng mga ito, at kung kasama na ito sa naunang presyo."
  },
  {
    id: 64,
    category_slug: "licenses-permits-safety",
    question_en: "How do you maintain construction quality?",
    question_tl: "Paano ninyo pinapanatili ang kalidad sa konstruksyon?",
    alt_questions: [
      "What are your quality control standards?",
      "How to ensure high construction quality?",
      "Paano sinisiguro ang kalidad ng gawa?",
      "Quality assurance sa proyekto?",
      "Quality standards"
    ],
    keywords: ["construction quality", "quality control", "kalidad", "tibay", "standards", "inspections", "quality assurance"],
    answer_en: "Quality requirements should be based on the approved plans, material specifications, contract, and applicable technical standards. Ask our team about the quality-control procedures and inspections applicable to your project.",
    answer_tl: "Ang mga pamantayan sa kalidad ay dapat nakabatay sa naaprubahang plano, material specifications, kontrata, at mga teknikal na pamantayan. Itanong sa aming team ang mga pamamaraan sa quality-control at inspections na naaangkop sa inyong proyekto."
  },
  {
    id: 65,
    category_slug: "licenses-permits-safety",
    question_en: "What safety measures are followed at the construction site?",
    question_tl: "Anong mga hakbang sa kaligtasan ang sinusunod sa construction site?",
    alt_questions: [
      "What are the site safety protocols?",
      "What safety gear is used on site?",
      "Ano ang safety measures sa site?",
      "Ligtas ba ang inyong construction site?",
      "Occupational safety on site"
    ],
    keywords: ["safety measures", "site safety", "kaligtasan", "protective equipment", "ppe", "safety protocol", "osh"],
    answer_en: "Construction safety requirements depend on the work being performed and the applicable regulations. Ask our team about the site-specific safety procedures, protective equipment, and access requirements for your project.",
    answer_tl: "Ang mga kinakailangan sa kaligtasan sa konstruksyon ay nakadepende sa isinasagawang trabaho at sa mga umiiral na regulasyon. Itanong sa aming team ang mga safety procedures, protective equipment, at access requirements para sa inyong proyekto."
  },
  {
    id: 66,
    category_slug: "licenses-permits-safety",
    question_en: "Will my construction project undergo inspections?",
    question_tl: "Sasailalim ba sa mga inspeksyon ang aking construction project?",
    alt_questions: [
      "Are there site inspections?",
      "Do engineers inspect the build during construction?",
      "May inspeksyon ba habang ginagawa ang bahay?",
      "Iniinspeksyon ba ng engineer ang trabaho?",
      "Project inspection stages"
    ],
    keywords: ["inspections", "undergo inspections", "inspeksyon", "site visit engineer", "quality check"],
    answer_en: "Inspections depend on the project requirements, applicable regulations, and agreed scope of work. Our team should clarify the required inspections, responsible parties, and documentation applicable to your project.",
    answer_tl: "Ang mga inspeksyon ay nakadepende sa requirements ng proyekto, umiiral na regulasyon, at napagkasunduang saklaw ng trabaho. Dapat linawin ng aming team ang mga kinakailangang inspeksyon, mga responsableng tauhan, at dokumentasyon para sa inyong proyekto."
  },
  {
    id: 67,
    category_slug: "licenses-permits-safety",
    question_en: "What happens if I notice a construction defect?",
    question_tl: "Ano ang dapat kong gawin kung may mapansin akong depekto sa konstruksyon?",
    alt_questions: [
      "What if there is a construction defect?",
      "How to report defects during build?",
      "Paano kung may sira o mali sa gawa?",
      "Paano mag-report ng depekto sa bahay?",
      "Defect reporting procedure"
    ],
    keywords: ["construction defect", "defect", "depekto", "sira", "mali sa gawa", "report defect"],
    answer_en: "Document the issue and report it to your assigned project representative as soon as possible. The team should review the concern and explain the appropriate inspection, corrective action, and any applicable contractual provisions.",
    answer_tl: "Idokumento ang problema (kumuha ng litrato) at i-report ito agad sa inyong assigned project representative. Susuriin ng team ang inyong alalahanin at ipapaliwanag ang tamang inspeksyon, aksyon para maayos ito, at ang mga nakasaad sa kontrata."
  },
  {
    id: 68,
    category_slug: "licenses-permits-safety",
    question_en: "Is there a warranty for completed construction work?",
    question_tl: "May warranty o garantiya ba para sa mga natapos na gawa sa konstruksyon?",
    alt_questions: [
      "Do you offer a construction warranty?",
      "What is your warranty period?",
      "May warranty ba ang natapos na bahay?",
      "Garantiya sa gawang bahay meron ba?",
      "Warranty coverage"
    ],
    keywords: ["warranty", "garantiya", "coverage", "warranty period", "damage protection", "structural warranty"],
    answer_en: "Any applicable warranty depends on the contract, type of work, and relevant terms and conditions. Please request written details regarding warranty coverage, duration, exclusions, and the process for reporting defects.",
    answer_tl: "Ang anumang naaangkop na warranty ay nakadepende sa kontrata, uri ng trabaho, at mga kaukulang tuntunin at kondisyon. Mangyaring humingi ng nakasulat na detalye tungkol sa saklaw ng warranty, tagal, mga ibinukod, at proseso ng pag-uulat ng depekto."
  },
  {
    id: 69,
    category_slug: "licenses-permits-safety",
    question_en: "Can I request a final inspection before turnover?",
    question_tl: "Pwede ba akong humiling ng final inspection o huling pagsusuri bago ang turnover?",
    alt_questions: [
      "Can we do a punch list inspection before turnover?",
      "Final walkthrough before accepting keys?",
      "Pwede ba mag-inspect bago i-turnover?",
      "Final inspection bago tanggapin ang bahay?",
      "Pre-turnover punch listing"
    ],
    keywords: ["final inspection", "turnover", "punch list", "walkthrough", "bago tanggapin", "final walkthrough"],
    answer_en: "Please discuss the inspection and turnover procedure with your project representative. The applicable checklist, completion requirements, and documentation should be agreed upon before final acceptance.",
    answer_tl: "Mangyaring pag-usapan ang pamamaraan ng inspeksyon at turnover sa inyong project representative. Ang checklist, completion requirements, at kaukulang dokumentasyon ay dapat mapagkasunduan bago ang pinal na pagtanggap."
  },
  {
    id: 70,
    category_slug: "licenses-permits-safety",
    question_en: "What documents will I receive after project completion?",
    question_tl: "Anong mga dokumento ang matatanggap ko pagkatapos makumpleto ang proyekto?",
    alt_questions: [
      "What turnover documents will I receive?",
      "What paperwork is provided at completion?",
      "Anong papeles ang ibibigay pag tapos na ang bahay?",
      "Dokumento pagkatapos ng turnover?",
      "Turnover package documents"
    ],
    keywords: ["turnover documents", "completion documents", "as-built plans", "papeles pagkatapos", "dokumento", "certificates"],
    answer_en: "Handover documents depend on the project scope and contract. Ask our team which records will be provided, such as applicable warranties, approved plans, inspection records, completion documents, and maintenance information.",
    answer_tl: "Ang mga dokumento sa handover ay nakadepende sa saklaw ng proyekto at kontrata. Itanong sa aming team kung anong mga rekord ang ibibigay, tulad ng naaangkop na warranties, aprubadong plano, inspection records, completion documents, at gabay sa pagpapanatili."
  },

  // ==================== CATEGORY 8: REFERENCES, PROJECT PORTFOLIO, AND CLIENT COMMUNICATION ====================
  {
    id: 71,
    category_slug: "portfolio-references",
    question_en: "Can you provide references or examples of past projects?",
    question_tl: "Makapagbibigay ba kayo ng mga halimbawa o references ng mga nakaraang proyekto?",
    alt_questions: [
      "Can I see sample past projects?",
      "Do you have past client references?",
      "Pwede ba makakita ng sample projects ninyo?",
      "May sample ba ng mga natapos na gawa?",
      "Project references"
    ],
    keywords: ["references", "past projects", "sample projects", "halimbawa", "portfolio", "gawa", "examples"],
    answer_en: "You may explore the available project photos and updates on our official website and social media accounts. For additional portfolio materials or client references, please contact our team to confirm what can be shared.",
    answer_tl: "Maaari mong tingnan ang mga available na larawan ng proyekto at updates sa aming opisyal na website at social media accounts. Para sa karagdagang portfolio materials o client references, makipag-ugnayan sa aming team upang makumpirma kung ano ang maaaring ibahagi."
  },
  {
    id: 72,
    category_slug: "portfolio-references",
    question_en: "Can I see photos of completed construction projects?",
    question_tl: "Pwede ba akong makakita ng mga larawan ng mga natapos na construction projects?",
    alt_questions: [
      "Do you have actual photos of finished homes?",
      "Where are the pictures of completed projects?",
      "Makakakita ba ako ng pictures ng mga natapos na bahay?",
      "Mga litrato ng natapos na project?",
      "Completed house photos"
    ],
    keywords: ["photos", "completed projects", "pictures", "larawan", "litrato", "finished projects", "gallery"],
    answer_en: "You can browse the available photos and project updates on our official social media accounts. You may also ask our team whether additional project photographs are available for your preferred type of construction.",
    answer_tl: "Maaari kang mag-browse ng mga larawan at project updates sa aming opisyal na social media accounts. Maaari mo ring itanong sa aming team kung may karagdagang litrato para sa inyong gustong uri ng konstruksyon."
  },
  {
    id: 73,
    category_slug: "portfolio-references",
    question_en: "Can I speak with a previous MCPA client?",
    question_tl: "Pwede ba akong makausap ng dating kliyente ng MCPA?",
    alt_questions: [
      "Can I talk to past clients?",
      "Do you provide client testimonials or references?",
      "Pwede ba makausap ang dating nagpagawa sa inyo?",
      "May client referral ba kayo?",
      "Past client contact"
    ],
    keywords: ["previous client", "past client", "dating kliyente", "client reference", "testimonial", "referral"],
    answer_en: "Please contact our team to ask whether a suitable client reference is available. Any referral will depend on the client's consent and the information that can appropriately be shared.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team upang itanong kung may angkop na client reference na available. Ang anumang referral ay nakadepende sa pahintulot ng kliyente at sa impormasyong maaaring ibahagi."
  },
  {
    id: 74,
    category_slug: "portfolio-references",
    question_en: "How can I schedule a consultation?",
    question_tl: "Paano ako makakapag-iskedyul ng konsultasyon sa MCPA?",
    alt_questions: [
      "How to book a consultation?",
      "Can I schedule a meeting with your team?",
      "Paano magpa-schedule ng consultation?",
      "Gusto ko mag-set ng meeting sa engineer ninyo",
      "Consultation booking"
    ],
    keywords: ["schedule consultation", "book consultation", "appointment", "meeting", "iskedyul", "konsultasyon"],
    answer_en: "Send us a message through our official website or communication channels and explain your proposed project. Our team can discuss the next steps and confirm available consultation arrangements.",
    answer_tl: "Magpadala sa amin ng mensahe sa pamamagitan ng aming opisyal na website o communication channels at ipaliwanag ang inyong planong proyekto. Tatalakayin ng aming team ang susunod na mga hakbang at kukumpirmahin ang available na consultation arrangements."
  },
  {
    id: 75,
    category_slug: "portfolio-references",
    question_en: "Can I submit photos or plans of my proposed project?",
    question_tl: "Pwede ba akong magsumite ng mga litrato o plano ng aking planong proyekto?",
    alt_questions: [
      "Can I send drawings or lot photos?",
      "How can I submit my floor plan or site photos?",
      "Pwede ba magpadala ng picture ng lote o plano?",
      "Paano magpasa ng floor plan sa inyo?",
      "Send project plans"
    ],
    keywords: ["submit photos", "submit plans", "send drawings", "magsumite ng litrato", "magpasa ng plano", "upload drawings"],
    answer_en: "Yes, you can ask our team how to submit your project photos, drawings, or other relevant documents through an official communication channel. Avoid sending sensitive personal or financial information unless it is necessary and the channel is appropriate.",
    answer_tl: "Opo, maaari kayong magtanong sa aming team kung paano isusumite ang inyong project photos, drawings, o iba pang kaugnay na dokumento sa opisyal na communication channel. Iwasang magpadala ng sensitibong personal o pinansyal na impormasyon maliban kung kinakailangan at angkop ang channel."
  },

  // ==================== CATEGORY 9: PROJECT CHANGES, COMPLETION, AND AFTER-SALES SUPPORT ====================
  {
    id: 76,
    category_slug: "changes-aftersales",
    question_en: "What is a Change Order?",
    question_tl: "Ano ang isang Change Order?",
    alt_questions: [
      "What does Change Order mean in construction?",
      "Explain Change Order",
      "Ano ang ibig sabihin ng change order?",
      "Ano ang change order sa kontrata?",
      "Definition of change order"
    ],
    keywords: ["change order", "scope change", "pagbabago sa plano", "order ng pagbabago", "variation order"],
    answer_en: "A Change Order is a written record of an agreed change to the original project scope, specifications, cost, or schedule. The proposed change should be reviewed, approved by the appropriate parties, and documented before the additional work proceeds.",
    answer_tl: "Ang Change Order ay isang nakasulat na rekord ng napagkasunduang pagbabago sa orihinal na saklaw, specifications, gastos, o schedule ng proyekto. Ang iminungkahing pagbabago ay dapat suriin, aprubahan ng mga kinauukulan, at idokumento bago simulan ang karagdagang trabaho."
  },
  {
    id: 77,
    category_slug: "changes-aftersales",
    question_en: "What happens if the final construction cost changes?",
    question_tl: "Ano ang mangyayari kung magbago ang huling halaga o final cost ng konstruksyon?",
    alt_questions: [
      "What if total construction cost changes?",
      "How are cost adjustments handled?",
      "Paano pag tumaas ang kabuuang gastos?",
      "Mababago ba ang final price ng project?",
      "Cost escalation policy"
    ],
    keywords: ["final cost changes", "cost adjustment", "tumaas ang presyo", "pagbabago sa presyo", "price adjustment"],
    answer_en: "Any cost adjustment should be supported by the contract terms and an explanation of the change. Ask for a written breakdown of the reason, amount, and any required approval before agreeing to additional charges.",
    answer_tl: "Ang anumang adjustment sa gastos ay dapat suportado ng mga probisyon ng kontrata at malinaw na paliwanag sa pagbabago. Humingi ng nakasulat na breakdown ng dahilan, halaga, at anumang kinakailangang pag-apruba bago pumayag sa karagdagang singil."
  },
  {
    id: 78,
    category_slug: "changes-aftersales",
    question_en: "What happens during project turnover?",
    question_tl: "Ano ang mga nangyayari habang isinasagawa ang project turnover?",
    alt_questions: [
      "What is the turnover process?",
      "What happens during handover and key turnover?",
      "Ano ginagawa sa turnover?",
      "Paano ang proseso ng turnover ng bahay?",
      "Handover ceremony and inspection"
    ],
    keywords: ["project turnover", "turnover process", "handover", "turnover ng bahay", "pagtanggap ng susi", "key handover"],
    answer_en: "Project turnover generally involves reviewing the completed work, identifying any remaining items, discussing applicable documentation, and confirming the agreed handover requirements. The exact procedure should follow your project contract.",
    answer_tl: "Ang turnover ng proyekto ay karaniwang kinapapalooban ng pagsusuri sa natapos na gawa, pagtukoy sa anumang natitirang aytem, pagtalakay sa kaukulang dokumentasyon, at pagkumpirma sa napagkasunduang handover requirements alinsunod sa kontrata."
  },
  {
    id: 79,
    category_slug: "changes-aftersales",
    question_en: "Can I report an issue after the project is completed?",
    question_tl: "Pwede pa ba akong mag-report ng problema pagkatapos makumpleto at ma-turnover ang proyekto?",
    alt_questions: [
      "Can I report issues after turnover?",
      "How to report defects after moving in?",
      "Pwede ba magreklamo pagkatapos ng turnover?",
      "May problema pagkalipat pwede ba ipaayos sa inyo?",
      "After sales warranty claim"
    ],
    keywords: ["report issue after completion", "after-sales", "post turnover issue", "problema pagkatapos", "after turnover", "warranty claim"],
    answer_en: "Please contact our team and provide your project details, a description of the issue, and relevant photographs if available. Our team can explain the appropriate review process and whether the concern falls within the applicable contractual or warranty terms.",
    answer_tl: "Mangyaring makipag-ugnayan sa aming team at ibigay ang mga detalye ng inyong proyekto, paglalarawan ng problema, at mga larawan kung mayroon. Maipapaliwanag ng aming team ang tamang proseso ng pagsusuri at kung pasok ang problema sa warranty o kontrata."
  },
  {
    id: 80,
    category_slug: "changes-aftersales",
    question_en: "How can I request assistance if my concern has not been resolved?",
    question_tl: "Paano ako makakahingi ng tulong kung hindi pa nareresolba ang aking alalahanin o problema?",
    alt_questions: [
      "What to do if my concern is not resolved?",
      "How to escalate an unresolved issue?",
      "Hindi pa naayos ang problema sino kokontakin?",
      "Paano magpa-escalate ng concern sa management?",
      "Unresolved customer issue"
    ],
    keywords: ["unresolved concern", "request assistance", "escalate", "hindi nareresolba", "humingi ng tulong", "authorized representative"],
    answer_en: "Please contact MCPA through an official communication channel and explain your concern, including any relevant project reference and previous communication. You may also request to speak with an authorized representative for further assistance.",
    answer_tl: "Mangyaring makipag-ugnayan sa MCPA sa pamamagitan ng opisyal na communication channel at ipaliwanag ang inyong alalahanin, kasama ang project reference at mga nakaraang mensahe. Maaari rin kayong humiling na makausap ang awtorisadong kinatawan para sa karagdagang tulong."
  }
];

module.exports = {
  OFFICIAL_CATEGORIES,
  FAQS_80,
};
