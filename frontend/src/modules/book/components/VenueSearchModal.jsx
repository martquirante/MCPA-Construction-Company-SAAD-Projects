"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  MapPin,
  X,
  Coffee,
  UtensilsCrossed,
  Store,
  Building,
  Navigation,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Comprehensive Brand Domains Registry (Food, Cafes, Retail & Philippine Establishments)
export const TENANT_BRANDS = {
  // Coffee, Tea & Cafes
  starbucks: ["starbucks.com", "starbucks.ph"],
  "tim hortons": ["timhortons.com", "timhortons.ph"],
  timhortons: ["timhortons.com", "timhortons.ph"],
  "coffee bean": ["coffeebean.com", "coffeebean.com.ph"],
  cbtl: ["coffeebean.com", "coffeebean.com.ph"],
  "coffee project": ["coffeeproject.com.ph", "coffeeproject.ph"],
  coffeeproject: ["coffeeproject.com.ph", "coffeeproject.ph"],
  highlands: ["highlandscoffee.com.ph", "highlandscoffee.com"],
  "highlands coffee": ["highlandscoffee.com.ph", "highlandscoffee.com"],
  "seattles best": ["seattlesbest.com", "seattlesbest.com.ph"],
  "bos coffee": ["boscoffee.com", "boscoffee.ph"],
  boscoffee: ["boscoffee.com", "boscoffee.ph"],
  "tom n toms": ["tomntoms.com"],
  dunkin: ["dunkin.com.ph", "dunkindonuts.com"],
  "dunkin donuts": ["dunkin.com.ph", "dunkindonuts.com"],
  "krispy kreme": ["krispykreme.com.ph", "krispykreme.com"],
  "mister donut": ["misterdonut.ph", "misterdonut.com.ph"],
  "pickup coffee": ["pickup-coffee.com", "pickup-coffee.ph"],
  "zus coffee": ["zuscoffee.com", "zuscoffee.com.ph"],
  zus: ["zuscoffee.com"],
  "mary grace": ["marygracecafe.com", "marygrace.ph", "marygrace.com.ph"],
  contis: ["contis.ph", "contis.com.ph"],
  breadtalk: ["breadtalk.com", "breadtalk.com.ph"],
  "french baker": ["frenchbaker.com"],
  "tous les jours": ["touslesjoursph.com"],
  cinnabon: ["cinnabon.ph", "cinnabon.com"],
  "auntie annes": ["auntieannes.com.ph", "auntieannes.com"],
  wildflour: ["wildflour.com.ph", "wildflourcafe.com"],
  bizu: ["bizupatisserie.com"],
  chatime: ["chatime.com.ph", "chatime.com"],
  "macao imperial": ["macaoimperialtea.com.ph"],
  "coco fresh": ["coco-tea.com"],
  "coco tea": ["coco-tea.com"],
  "gong cha": ["gongcha.com.ph", "gongcha.com"],
  "tiger sugar": ["tigersugar.com"],
  sharetea: ["sharetea.com.ph", "sharetea.com"],
  infinitea: ["infiniteaphilippines.com"],
  serenitea: ["iloveserenitea.com"],
  "black scoop": ["blackscoopcafe.com"],
  koomi: ["koomi.ph"],
  "the alley": ["thealley.ph"],
  "yi fang": ["yifangtea.com.ph"],
  "but first coffee": ["butfirstcoffee.ph"],
  "big brew": ["bigbrew.ph"],
  "dear joe": ["dearjoe.com.ph"],
  figaro: ["figarocoffee.com"],
  "cafe france": ["cafefrance.net"],
  ucc: ["ucc-coffee.com.ph"],
  "jco": ["jcodonuts.com"],
  "j.co": ["jcodonuts.com"],
  "dairy queen": ["dairyqueen.com"],
  dq: ["dairyqueen.com"],
  "baskin robbins": ["baskinrobbins.ph", "baskinrobbins.com"],
  llaollao: ["llaollaoweb.com"],
  "llao llao": ["llaollaoweb.com"],
  "blk 513": ["blk513.ph"],
  blk513: ["blk513.ph"],
  "zagu": ["zagushakes.com"],
  "fruitas": ["fruitasholdings.com"],
  "waffle time": ["waffletime.com"],

  // Fast Food & Casual Dining
  jollibee: ["jollibee.com.ph", "jollibee.com"],
  mcdonalds: ["mcdonalds.com.ph", "mcdonalds.com"],
  mcdo: ["mcdonalds.com.ph", "mcdonalds.com"],
  kfc: ["kfc.com", "kfc.ph", "kfc.com.ph"],
  wendys: ["wendys.com.ph", "wendys.com"],
  "burger king": ["burgerking.com", "burgerking.com.ph"],
  popeyes: ["popeyes.ph", "popeyes.com"],
  "army navy": ["armynavy.com.ph", "armynavyburgerburrito.com"],
  bonchon: ["bonchon.com.ph", "bonchon.com"],
  subway: ["subway.com", "subway.com.ph"],
  chowking: ["chowking.com", "chowking.com.ph"],
  "mang inasal": ["manginasal.com", "manginasal.ph"],
  greenwich: ["greenwich.com.ph", "greenwichpizza.com"],
  shakeys: ["shakeyspizza.ph", "shakeys.com"],
  "pizza hut": ["pizzahut.com.ph", "pizzahut.com"],
  "yellow cab": ["yellowcabpizza.com", "yellowcab.ph"],
  dominos: ["dominospizza.ph", "dominos.com"],
  "angels pizza": ["angelspizza.com.ph"],
  "angel's pizza": ["angelspizza.com.ph"],
  "pancake house": ["pancakehouse.com.ph"],
  "kenny rogers": ["kennyrogersdelivery.com.ph", "kennyrogers.com"],
  "potato corner": ["potatocorner.com", "potatocorner.ph"],
  turks: ["turks.ph", "turks.com.ph"],
  sbarro: ["sbarro.ph", "sbarro.com"],
  "tokyo tokyo": ["tokyotokyo.com.ph"],
  "marugame udon": ["marugameudon.ph", "marugame.ph"],
  marugame: ["marugameudon.ph"],
  botejyu: ["botejyu.com.ph"],
  "pepper lunch": ["pepperlunch.com.ph"],
  yabu: ["yabu.ph"],
  ippudo: ["ippudo.com.ph", "ippudo.com"],
  "ramen nagi": ["ramennagi.com.ph"],
  "ramen kuroda": ["kuroda.ph"],
  mendokoro: ["nipponhasha.com"],
  "peri peri": ["periperichicken.ph"],
  "24 chicken": ["24chicken.ph"],
  andoks: ["andoks.com.ph"],
  "baliwag lechon": ["baliwaglechonmanok.com"],
  chooks: ["chookstogo.com.ph"],
  "chooks to go": ["chookstogo.com.ph"],
  goldilocks: ["goldilocks.com.ph", "goldilocks.com"],
  "red ribbon": ["redribbonbakeshop.com.ph"],
  maxs: ["maxschicken.com", "maxsrestaurant.com"],
  "kuya j": ["kuyaj.ph"],
  "gerrys grill": ["gerrysgrill.com"],
  aristocrat: ["aristocrat.com.ph"],
  dencios: ["dencios.com.ph"],
  giligans: ["giligansrestaurant.com"],
  "giligan's": ["giligansrestaurant.com"],
  racks: ["racks.ph"],
  blakes: ["blakes.ph"],
  "blake's": ["blakes.ph"],
  frankies: ["orderfrankies.com"],
  "frankie's": ["orderfrankies.com"],
  wingstop: ["wingstop.com"],
  "minute burger": ["minuteburger.com"],
  "master siomai": ["mastersiomai.com"],
  mastersiomai: ["mastersiomai.com"],
  "siomai king": ["siomaiking.ph"],
  "tapa king": ["tapaking.com.ph"],
  "sinangag express": ["sinangagexpress.com"],
  razons: ["razonsofguagua.net", "razons.ph"],
  manam: ["manam.ph"],
  ooma: ["ooma.ph"],
  mesa: ["mesaphilippines.com"],
  cabalen: ["cabalen.ph"],
  "tgi fridays": ["fridays.com.ph", "tgifridays.com"],
  italiannis: ["italiannis.com.ph"],
  "texas roadhouse": ["texasroadhouse.com.ph", "texasroadhouse.com"],
  chilis: ["chilisphilippines.com", "chilis.com"],
  dennys: ["dennys.ph", "dennys.com"],
  "tim ho wan": ["timhowan.com"],
  "din tai fung": ["dintaifung.com.ph"],
  "north park": ["northpark.com.ph"],
  "hap chan": ["hapchan.com.ph"],

  // Retail, Convenience & Supermarkets
  "7 eleven": ["7-eleven.com.ph", "7-eleven.com"],
  "7-eleven": ["7-eleven.com.ph", "7-eleven.com"],
  alfamart: ["alfamart.com.ph", "alfamart.com"],
  "uncle johns": ["robinsonsretailholdings.com.ph"],
  lawson: ["lawson-philippines.com", "lawson.ph"],
  familymart: ["familymart.com.ph"],
  watsons: ["watsons.com.ph", "watsons.com"],
  "mercury drug": ["mercurydrug.com"],
  "southstar drug": ["southstardrug.com.ph"],
  tgp: ["tgp.com.ph"],
  "the generics pharmacy": ["tgp.com.ph"],
  generika: ["generika.com.ph"],
  uniqlo: ["uniqlo.com"],
  decathlon: ["decathlon.ph", "decathlon.com"],
  "ace hardware": ["acehardware.ph"],
  "true value": ["truevalue.com.ph"],
  "wilcon depot": ["wilcon.com.ph"],
  "national book store": ["nationalbookstore.com"],
  nbs: ["nationalbookstore.com"],
  "fully booked": ["fullybookedonline.com"],
  bdo: ["bdo.com.ph"],
  bpi: ["bpi.com.ph"],
  metrobank: ["metrobank.com.ph"],
  "security bank": ["securitybank.com"],
  unionbank: ["unionbankph.com"],
  shell: ["shell.com.ph"],
  petron: ["petron.com"],
  caltex: ["caltex.com"],
  seaoil: ["seaoil.com.ph"],
};

// Host Malls & Shopping Centers Registry
export const MALL_BRANDS = {
  "sm city": ["smsupermalls.com", "smmalls.com"],
  "sm center": ["smsupermalls.com", "smmalls.com"],
  "sm malls": ["smsupermalls.com", "smmalls.com"],
  "sm supermalls": ["smsupermalls.com", "smmalls.com"],
  "sm megamall": ["smsupermalls.com", "smmalls.com"],
  "sm hypermarket": ["smsupermalls.com", "smmalls.com"],
  sm: ["smsupermalls.com", "smmalls.com"],
  "robinsons place": ["robinsonsmalls.com", "robinsonsland.com"],
  "robinsons galleria": ["robinsonsmalls.com", "robinsonsland.com"],
  "robinsons townville": ["robinsonsmalls.com", "robinsonsland.com"],
  "robinsons malls": ["robinsonsmalls.com", "robinsonsland.com"],
  robinsons: ["robinsonsmalls.com", "robinsonsland.com"],
  waltermart: ["waltermartdelivery.com.ph", "waltermart.com.ph"],
  "ayala malls": ["ayalamalls.com"],
  ayala: ["ayalamalls.com"],
  trinoma: ["ayalamalls.com"],
  "vertis north": ["ayalamalls.com"],
  glorietta: ["ayalamalls.com"],
  greenbelt: ["ayalamalls.com"],
  "market market": ["ayalamalls.com"],
  "vista mall": ["vistamalls.com.ph"],
  vistamall: ["vistamalls.com.ph"],
  puregold: ["puregold.com.ph"],
  "snr shopping": ["snrshopping.com"],
  "s&r": ["snrshopping.com"],
  snr: ["snrshopping.com"],
  landers: ["landers.ph"],
  allday: ["allday.com.ph"],
  megaworld: ["megaworldcorp.com"],
  "uptown mall": ["megaworldcorp.com"],
  "fisher mall": ["fishermall.com.ph"],
  "power plant mall": ["powerplantmall.com"],
  rockwell: ["powerplantmall.com"],
  greenhills: ["ortigasmalls.com"],
  landmark: ["landmark.com.ph"],
};

// Backward-compatibility export
export const BRAND_DOMAINS = Object.fromEntries(
  Object.entries(TENANT_BRANDS).map(([k, v]) => [k, v[0]])
);

// Pre-sorted brand keys (longest match first)
const SORTED_TENANTS = Object.keys(TENANT_BRANDS).sort((a, b) => b.length - a.length);
const SORTED_MALLS = Object.keys(MALL_BRANDS).sort((a, b) => b.length - a.length);

// Central Luzon & NCR location stops to clean out from brand queries
const PH_LOCATIONS = new Set([
  "bulacan", "plaridel", "malolos", "guiguinto", "pulilan", "baliwag", "baliuag",
  "marilao", "bocaue", "meycauayan", "balagtas", "calumpit", "hagonoy", "paombong",
  "bustos", "pandan", "san rafael", "san ildefonso", "san miguel", "angad", "norzagaray",
  "sta maria", "santa maria", "san jose del monte", "sjdm",
  "pampanga", "angeles", "san fernando", "clark", "mabalacat", "lubao", "guagua",
  "bataan", "nueva ecija", "tarlac", "zambales", "olongapo",
  "manila", "quezon city", "qc", "makati", "bgc", "taguig", "pasig", "ortigas",
  "mandaluyong", "san juan", "pasay", "paranaque", "las pinas", "muntinlupa",
  "alabang", "caloocan", "valenzuela", "malabon", "navotas", "marikina"
]);

const STOP_WORDS = new Set([
  "branch", "city", "mall", "supermarket", "center", "centre", "express",
  "kiosk", "philippines", "crossing", "highway", "bayan", "avenue", "street",
  "road", "ave", "st", "rd", "hwy", "bypass", "exit", "drive thru", "drivethru",
  "near", "cor", "corner", "along", "in", "at", "the", "of", "and"
]);

// Normalizes brand query strings cleanly
export function normalizeBrandQuery(text) {
  return (text || "")
    .toLowerCase()
    .replace(/['"’`]/g, "") // remove apostrophes without space (e.g. Wendy's -> wendys)
    .replace(/[—–\-.,()|/]/g, " ") // replace dividers with spaces
    .replace(/\s+/g, " ")
    .trim();
}

// Extracts candidate domains for ANY establishment or brand name
export function resolveCandidateDomains(text) {
  if (!text) return [];
  const clean = normalizeBrandQuery(text);
  if (!clean) return [];

  // 1. Highest Priority: Specific store/tenant brand (e.g. KFC, Wendy's, Starbucks)
  for (const k of SORTED_TENANTS) {
    const normKey = normalizeBrandQuery(k);
    if (normKey.length <= 2) {
      const regex = new RegExp("(\\b|^)" + normKey + "(\\b|$)", "i");
      if (regex.test(clean)) return TENANT_BRANDS[k];
    } else if (clean.includes(normKey)) {
      return TENANT_BRANDS[k];
    }
  }

  // 2. Second Priority: Shopping Center / Mall host (e.g. SM City, Robinsons)
  for (const k of SORTED_MALLS) {
    const normKey = normalizeBrandQuery(k);
    if (normKey.length <= 2) {
      const regex = new RegExp("(\\b|^)" + normKey + "(\\b|$)", "i");
      if (regex.test(clean)) return MALL_BRANDS[k];
    } else if (clean.includes(normKey)) {
      return MALL_BRANDS[k];
    }
  }

  // 3. Third Priority: Dynamic arbitrary brand name resolution
  const words = clean.split(" ").filter((w) => !PH_LOCATIONS.has(w) && !STOP_WORDS.has(w));
  if (words.length === 0) return [];

  const slug = words.slice(0, 2).join("");
  const firstWord = words[0];

  const results = [
    `${slug}.com.ph`,
    `${slug}.com`,
    `${slug}.ph`,
    `${firstWord}.com.ph`,
    `${firstWord}.com`,
    `${firstWord}.ph`,
  ];

  return Array.from(new Set(results));
}

// Backward-compatible single domain helper
export function resolveEstablishmentDomain(text) {
  const domains = resolveCandidateDomains(text);
  return domains.length > 0 ? domains[0] : null;
}

// Generates live logo endpoint URLs across all candidate domains
export function getCandidateLogoUrls(domains) {
  const domainList = Array.isArray(domains) ? domains : domains ? [domains] : [];
  if (domainList.length === 0) return [];

  const urls = [];
  for (const domain of domainList) {
    // 1. Google Favicon v2 (High-Res 128px direct gstatic)
    urls.push(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`);
    // 2. Google S2 Favicon API
    urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    // 3. DuckDuckGo High-Definition Icon
    urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    // 4. Clearbit Logo Service
    urls.push(`https://logo.clearbit.com/${domain}`);
  }

  return urls;
}

// Computes 2-letter monogram for brand fallback
function getBrandInitials(text) {
  if (!text) return "VN";
  const clean = normalizeBrandQuery(text);
  const words = clean.split(" ").filter((w) => !STOP_WORDS.has(w) && w.length > 0);
  if (words.length === 0) return "VN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Gradient hues for elegant brand monogram fallback
const BRAND_GRADIENTS = [
  "from-amber-500 to-orange-600 text-white",
  "from-rose-500 to-red-600 text-white",
  "from-emerald-500 to-teal-600 text-white",
  "from-blue-500 to-indigo-600 text-white",
  "from-violet-500 to-purple-600 text-white",
  "from-amber-600 to-yellow-500 text-neutral-950",
];

function getBrandGradient(text) {
  let hash = 0;
  for (let i = 0; i < (text || "").length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % BRAND_GRADIENTS.length;
  return BRAND_GRADIENTS[idx];
}

// Official Robinsons Malls Vector Logo (Green circle with stylized white 'R' & lime leaf)
export function RobinsonsLogo({ className = "w-full h-full" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Robinsons"
    >
      <circle cx="50" cy="50" r="48" fill="#006A38" />
      {/* Lime green leaf accent perched on top-right */}
      <path
        d="M58 16 C68 17, 78 25, 75 36 C64 36, 56 28, 58 16 Z"
        fill="#8DC63F"
      />
      {/* Robinsons White Stylized 'R' */}
      <path
        d="M28 24 H52 C64 24, 71 30.5, 71 41 C71 50, 64 56, 52 56 H40 V76 H28 V24 Z M40 33.5 V46.5 H51 C56 46.5, 59.5 44, 59.5 40 C59.5 36, 56 33.5, 51 33.5 H40 Z"
        fill="#FFFFFF"
      />
      {/* Diagonal leg of the 'R' */}
      <path
        d="M48 53 L69 76 H56 L39 55 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 100% Flexible Establishment Logo component (Never breaks, handles ANY brand)
export function EstablishmentLogo({
  name,
  brand,
  category,
  className = "w-4.5 h-4.5",
  iconClassName = "w-2.5 h-2.5",
}) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  // Authenticated Brand Intercept: Robinsons Malls (always render official green logo, never supermarket cherry)
  const cleanStr = `${brand || ""} ${name || ""}`.toLowerCase();
  const isRobinsons = cleanStr.includes("robinson");

  const candidateDomains = useMemo(() => {
    return resolveCandidateDomains(brand || name);
  }, [brand, name]);

  const candidateUrls = useMemo(() => {
    return getCandidateLogoUrls(candidateDomains);
  }, [candidateDomains]);

  useEffect(() => {
    setUrlIndex(0);
    setFailedAll(false);
  }, [candidateUrls]);

  const handleImgError = () => {
    if (urlIndex + 1 < candidateUrls.length) {
      setUrlIndex((prev) => prev + 1);
    } else {
      setFailedAll(true);
    }
  };

  // Direct High-Fidelity Robinsons Logo (Green circle with stylized white 'R' & leaf)
  if (isRobinsons) {
    return (
      <span
        className={`${className} rounded-full bg-white p-0.5 border border-neutral-200 dark:border-white/15 inline-flex items-center justify-center shrink-0 shadow-2xs overflow-hidden align-middle`}
        title={brand || name || "Robinsons Malls"}
      >
        <RobinsonsLogo className="w-full h-full" />
      </span>
    );
  }

  // 1. Render Live API Logo if available
  if (candidateUrls.length > 0 && !failedAll) {
    return (
      <span
        className={`${className} rounded-full bg-white p-0.5 border border-neutral-200 dark:border-white/15 inline-flex items-center justify-center shrink-0 shadow-2xs overflow-hidden align-middle`}
        title={brand || name}
      >
        <img
          key={candidateUrls[urlIndex]}
          src={candidateUrls[urlIndex]}
          alt={name || "Venue Logo"}
          onError={handleImgError}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
        />
      </span>
    );
  }

  // 2. High-End Monogram Brand Badge fallback (For local unlisted shops)
  const initials = getBrandInitials(brand || name);
  const gradientClass = getBrandGradient(brand || name);

  return (
    <span
      className={`${className} rounded-full bg-gradient-to-br ${gradientClass} inline-flex items-center justify-center shrink-0 shadow-2xs font-mono font-bold text-[9px] tracking-tight select-none align-middle border border-white/20`}
      title={name || "Venue"}
    >
      {initials}
    </span>
  );
}

// Curated Instant Directory of Popular Consultation Venues in Bulacan, Pampanga, Central Luzon & NCR
export const CURATED_PH_VENUES = [
  // --- STARBUCKS ---
  {
    name: "Starbucks — WalterMart Plaridel",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "Cagayan Valley Rd, Banga 1st, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["starbucks", "plaridel", "waltermart", "coffee", "cafe"],
  },
  {
    name: "Starbucks — Robinsons Townville Malolos",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "McArthur Highway, Dakila, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["starbucks", "malolos", "robinsons", "townville", "coffee"],
  },
  {
    name: "Starbucks — Tikay Drive-Thru",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "McArthur Highway, Tikay, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["starbucks", "malolos", "tikay", "drive-thru", "coffee"],
  },
  {
    name: "Starbucks — The Cabanas Malolos",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "The Cabanas, Km 44.5 McArthur Hwy, Longos, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["starbucks", "cabanas", "malolos", "coffee"],
  },
  {
    name: "Starbucks — SM City Baliwag",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "Doña Remedios Trinidad Hwy, Pagala, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["starbucks", "baliwag", "sm", "coffee"],
  },
  {
    name: "Starbucks — SM Center Pulilan",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "Plaridel-Pulilan Diversion Rd, Sto. Cristo, Pulilan, Bulacan",
    city: "Pulilan, Bulacan",
    tags: ["starbucks", "pulilan", "sm", "coffee"],
  },
  {
    name: "Starbucks — SM City Marilao",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "McArthur Highway, Ibayo, Marilao, Bulacan",
    city: "Marilao, Bulacan",
    tags: ["starbucks", "marilao", "sm", "coffee"],
  },
  {
    name: "Starbucks — SM City Clark",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "M.A. Roxas Highway, Clark Freeport, Angeles, Pampanga",
    city: "Angeles City, Pampanga",
    tags: ["starbucks", "clark", "angeles", "pampanga", "coffee"],
  },
  {
    name: "Starbucks — SM City Pampanga",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "Jose Abad Santos Ave, City of San Fernando, Pampanga",
    city: "San Fernando, Pampanga",
    tags: ["starbucks", "san fernando", "pampanga", "coffee"],
  },
  {
    name: "Starbucks — Vertis North / Trinoma",
    category: "Coffee Shop",
    brand: "Starbucks",
    address: "North Ave cor EDSA, Quezon City, Metro Manila",
    city: "Quezon City, Metro Manila",
    tags: ["starbucks", "vertis", "trinoma", "quezon city", "qc", "coffee"],
  },

  // --- JOLLIBEE ---
  {
    name: "Jollibee — Plaridel Crossing",
    category: "Fast Food",
    brand: "Jollibee",
    address: "Gov. Padilla Rd, Poblacion, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["jollibee", "plaridel", "crossing", "fast food", "chickenjoy"],
  },
  {
    name: "Jollibee — Tabang Guiguinto",
    category: "Fast Food",
    brand: "Jollibee",
    address: "Tabang Exit, McArthur Hwy, Guiguinto, Bulacan",
    city: "Guiguinto, Bulacan",
    tags: ["jollibee", "tabang", "guiguinto", "fast food"],
  },
  {
    name: "Jollibee — Pulilan Junction",
    category: "Fast Food",
    brand: "Jollibee",
    address: "Doña Remedios Trinidad Hwy, Pulilan, Bulacan",
    city: "Pulilan, Bulacan",
    tags: ["jollibee", "pulilan", "junction", "fast food"],
  },
  {
    name: "Jollibee — Malolos Bayan",
    category: "Fast Food",
    brand: "Jollibee",
    address: "Pariancillo St, Sto. Rosario, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["jollibee", "malolos", "bayan", "fast food"],
  },
  {
    name: "Jollibee — Malolos Crossing",
    category: "Fast Food",
    brand: "Jollibee",
    address: "McArthur Hwy cor Paseo del Congreso, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["jollibee", "malolos", "crossing", "fast food"],
  },
  {
    name: "Jollibee — SM City Baliwag",
    category: "Fast Food",
    brand: "Jollibee",
    address: "DRT Hwy, Pagala, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["jollibee", "baliwag", "sm", "fast food"],
  },
  {
    name: "Jollibee — Balagtas Town Center",
    category: "Fast Food",
    brand: "Jollibee",
    address: "McArthur Highway, Borol 1st, Balagtas, Bulacan",
    city: "Balagtas, Bulacan",
    tags: ["jollibee", "balagtas", "fast food"],
  },
  {
    name: "Jollibee — Dolores San Fernando",
    category: "Fast Food",
    brand: "Jollibee",
    address: "Dolores Intersection, McArthur Hwy, San Fernando, Pampanga",
    city: "San Fernando, Pampanga",
    tags: ["jollibee", "san fernando", "pampanga", "fast food"],
  },

  // --- MCDONALD'S ---
  {
    name: "McDonald's — Plaridel Bypass",
    category: "Fast Food",
    brand: "McDonald's",
    address: "Plaridel Bypass Rd, Bulihan, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["mcdonalds", "mcdo", "plaridel", "bypass", "fast food"],
  },
  {
    name: "McDonald's — Malolos McArthur Highway",
    category: "Fast Food",
    brand: "McDonald's",
    address: "McArthur Hwy, Bulihan, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["mcdonalds", "mcdo", "malolos", "fast food"],
  },
  {
    name: "McDonald's — Pulilan",
    category: "Fast Food",
    brand: "McDonald's",
    address: "Cagayan Valley Rd, Poblacion, Pulilan, Bulacan",
    city: "Pulilan, Bulacan",
    tags: ["mcdonalds", "mcdo", "pulilan", "fast food"],
  },
  {
    name: "McDonald's — Guiguinto NLEX Exit",
    category: "Fast Food",
    brand: "McDonald's",
    address: "Tabang, Guiguinto, Bulacan",
    city: "Guiguinto, Bulacan",
    tags: ["mcdonalds", "mcdo", "guiguinto", "tabang", "nlex", "fast food"],
  },
  {
    name: "McDonald's — Baliwag Flyover",
    category: "Fast Food",
    brand: "McDonald's",
    address: "DRT Hwy cor Benigno Aquino Ave, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["mcdonalds", "mcdo", "baliwag", "fast food"],
  },
  {
    name: "McDonald's — Dolores San Fernando",
    category: "Fast Food",
    brand: "McDonald's",
    address: "McArthur Hwy, Dolores, City of San Fernando, Pampanga",
    city: "San Fernando, Pampanga",
    tags: ["mcdonalds", "mcdo", "san fernando", "pampanga", "fast food"],
  },

  // --- OTHER NOTABLE CAFES & RESTAURANTS ---
  {
    name: "Coffee Project — Vista Mall Malolos",
    category: "Coffee Shop",
    brand: "Coffee Project",
    address: "Vista Mall, McArthur Hwy, Longos, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["coffee project", "malolos", "vista mall", "cafe", "coffee"],
  },
  {
    name: "The Coffee Bean & Tea Leaf — SM City Clark",
    category: "Coffee Shop",
    brand: "CBTL",
    address: "SM City Clark, M.A. Roxas Hwy, Clark, Pampanga",
    city: "Angeles City, Pampanga",
    tags: ["coffee bean", "cbtl", "clark", "angeles", "pampanga", "tea", "coffee"],
  },
  {
    name: "Tim Hortons — Trinoma Mall",
    category: "Coffee Shop",
    brand: "Tim Hortons",
    address: "Level 1 Trinoma, EDSA cor North Ave, Quezon City",
    city: "Quezon City, Metro Manila",
    tags: ["tim hortons", "trinoma", "quezon city", "coffee"],
  },
  {
    name: "Highlands Coffee — Balagtas Town Center",
    category: "Coffee Shop",
    brand: "Highlands Coffee",
    address: "Balagtas Town Center, McArthur Hwy, Balagtas, Bulacan",
    city: "Balagtas, Bulacan",
    tags: ["highlands coffee", "balagtas", "coffee", "cafe"],
  },
  {
    name: "Seattle's Best Coffee — Robinsons Place Malolos",
    category: "Coffee Shop",
    brand: "Seattle's Best",
    address: "Robinsons Place Malolos, McArthur Hwy, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["seattles best", "malolos", "robinsons", "coffee"],
  },
  {
    name: "Bo's Coffee — Malolos Capitol View",
    category: "Coffee Shop",
    brand: "Bo's Coffee",
    address: "Capitol Compound, Guinhawa, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["bos coffee", "malolos", "capitol", "coffee"],
  },
  {
    name: "Tom N Toms Coffee — Friendship Highway",
    category: "Coffee Shop",
    brand: "Tom N Toms",
    address: "Fil-Am Friendship Hwy, Angeles City, Pampanga",
    city: "Angeles City, Pampanga",
    tags: ["tom n toms", "angeles", "clark", "pampanga", "coffee"],
  },
  {
    name: "Dunkin' — Plaridel Bayan",
    category: "Coffee Shop",
    brand: "Dunkin'",
    address: "Poblacion, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["dunkin", "plaridel", "donuts", "coffee"],
  },

  // --- KFC ---
  {
    name: "KFC — Plaridel Crossing",
    category: "Fast Food",
    brand: "KFC",
    address: "Cagayan Valley Rd, Poblacion, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["kfc", "plaridel", "chicken", "fast food"],
  },
  {
    name: "KFC — Robinsons Place Malolos",
    category: "Fast Food",
    brand: "KFC",
    address: "Robinsons Place Malolos, McArthur Hwy, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["kfc", "malolos", "robinsons", "fast food"],
  },
  {
    name: "KFC — SM City Baliwag",
    category: "Fast Food",
    brand: "KFC",
    address: "DRT Hwy, SM City Baliwag, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["kfc", "baliwag", "sm", "fast food"],
  },

  // --- MANG INASAL ---
  {
    name: "Mang Inasal — Plaridel Bayan",
    category: "Fast Food",
    brand: "Mang Inasal",
    address: "Gov. Padilla Rd, Poblacion, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["mang inasal", "plaridel", "inasal", "fast food"],
  },
  {
    name: "Mang Inasal — WalterMart Plaridel",
    category: "Fast Food",
    brand: "Mang Inasal",
    address: "WalterMart Plaridel, Cagayan Valley Rd, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["mang inasal", "waltermart", "plaridel", "fast food"],
  },
  {
    name: "Mang Inasal — Malolos Crossing",
    category: "Fast Food",
    brand: "Mang Inasal",
    address: "McArthur Hwy, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["mang inasal", "malolos", "crossing", "fast food"],
  },

  // --- CHOWKING ---
  {
    name: "Chowking — Plaridel",
    category: "Fast Food",
    brand: "Chowking",
    address: "Cagayan Valley Rd cor Gov Padilla, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["chowking", "plaridel", "chinese", "fast food"],
  },
  {
    name: "Chowking — Guiguinto Tabang Exit",
    category: "Fast Food",
    brand: "Chowking",
    address: "Tabang Exit, McArthur Hwy, Guiguinto, Bulacan",
    city: "Guiguinto, Bulacan",
    tags: ["chowking", "guiguinto", "tabang", "fast food"],
  },
  {
    name: "Chowking — Malolos Bayan",
    category: "Fast Food",
    brand: "Chowking",
    address: "Paseo del Congreso, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["chowking", "malolos", "fast food"],
  },

  // --- GREENWICH ---
  {
    name: "Greenwich — Plaridel Bayan",
    category: "Fast Food",
    brand: "Greenwich",
    address: "Poblacion, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["greenwich", "plaridel", "pizza", "lasagna", "fast food"],
  },
  {
    name: "Greenwich — Malolos McArthur",
    category: "Fast Food",
    brand: "Greenwich",
    address: "McArthur Hwy, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["greenwich", "malolos", "fast food"],
  },

  // --- WENDY'S ---
  {
    name: "Wendy's — SM City Baliwag",
    category: "Fast Food",
    brand: "Wendy's",
    address: "Ground Floor, SM City Baliwag, DRT Hwy, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["wendys", "baliwag", "sm", "burger", "fast food"],
  },
  {
    name: "Wendy's — San Fernando Intersection",
    category: "Fast Food",
    brand: "Wendy's",
    address: "Dolores Intersection, San Fernando, Pampanga",
    city: "San Fernando, Pampanga",
    tags: ["wendys", "san fernando", "pampanga", "fast food"],
  },

  // --- MARY GRACE & CONTI'S ---
  {
    name: "Mary Grace Cafe — SM City Marilao",
    category: "Cafe & Bakery",
    brand: "Mary Grace",
    address: "Ground Level, SM City Marilao, McArthur Hwy, Marilao, Bulacan",
    city: "Marilao, Bulacan",
    tags: ["mary grace", "marilao", "sm", "cafe", "ensaymada"],
  },
  {
    name: "Mary Grace Cafe — Trinoma Mall",
    category: "Cafe & Bakery",
    brand: "Mary Grace",
    address: "Level 2 Trinoma, EDSA cor North Ave, Quezon City",
    city: "Quezon City, Metro Manila",
    tags: ["mary grace", "trinoma", "cafe", "quezon city"],
  },
  {
    name: "Conti's Bakeshop & Restaurant — SM City Marilao",
    category: "Cafe & Bakery",
    brand: "Conti's",
    address: "SM City Marilao, McArthur Hwy, Marilao, Bulacan",
    city: "Marilao, Bulacan",
    tags: ["contis", "marilao", "sm", "mango bravo", "cake"],
  },

  // --- PICKUP COFFEE & ZUS COFFEE ---
  {
    name: "Pickup Coffee — Malolos Capitol",
    category: "Coffee Shop",
    brand: "Pickup Coffee",
    address: "Capitol Compound, Guinhawa, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["pickup coffee", "malolos", "coffee", "cafe"],
  },
  {
    name: "Zus Coffee — Plaridel",
    category: "Coffee Shop",
    brand: "Zus Coffee",
    address: "Gov. Padilla Rd, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["zus coffee", "plaridel", "coffee", "cafe"],
  },

  // --- ARMY NAVY & SHAKEY'S ---
  {
    name: "Army Navy Burger + Burrito — Malolos",
    category: "Casual Dining",
    brand: "Army Navy",
    address: "McArthur Highway, Tikay, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["army navy", "malolos", "burger", "burrito"],
  },
  {
    name: "Shakey's Pizza Parlor — Malolos",
    category: "Casual Dining",
    brand: "Shakey's",
    address: "McArthur Hwy, Tikay, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["shakeys", "malolos", "pizza", "chicken"],
  },

  // --- SHOPPING MALLS & LIFESTYLE CENTERS ---
  {
    name: "SM City Baliwag",
    category: "Shopping Mall",
    brand: "SM Malls",
    address: "DRT Highway, Pagala, Baliuag, Bulacan",
    city: "Baliwag, Bulacan",
    tags: ["sm", "baliwag", "mall", "food court"],
  },
  {
    name: "SM Center Pulilan",
    category: "Shopping Mall",
    brand: "SM Malls",
    address: "Plaridel-Pulilan Diversion Rd, Pulilan, Bulacan",
    city: "Pulilan, Bulacan",
    tags: ["sm", "pulilan", "mall"],
  },
  {
    name: "SM City Marilao",
    category: "Shopping Mall",
    brand: "SM Malls",
    address: "McArthur Highway, Ibayo, Marilao, Bulacan",
    city: "Marilao, Bulacan",
    tags: ["sm", "marilao", "mall"],
  },
  {
    name: "Robinsons Place Malolos",
    category: "Shopping Mall",
    brand: "Robinsons Malls",
    address: "McArthur Highway, Dakila, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["robinsons", "malolos", "mall"],
  },
  {
    name: "WalterMart Plaridel",
    category: "Commercial Center",
    brand: "WalterMart",
    address: "Cagayan Valley Rd, Banga 1st, Plaridel, Bulacan",
    city: "Plaridel, Bulacan",
    tags: ["waltermart", "plaridel", "mall"],
  },
  {
    name: "The Cabanas Lifestyle Center",
    category: "Lifestyle Mall",
    brand: "The Cabanas",
    address: "Km 44.5 McArthur Highway, Longos, Malolos, Bulacan",
    city: "Malolos, Bulacan",
    tags: ["cabanas", "malolos", "mall", "restaurants"],
  },
  {
    name: "SM City Pampanga",
    category: "Shopping Mall",
    brand: "SM Malls",
    address: "Jose Abad Santos Ave, City of San Fernando, Pampanga",
    city: "San Fernando, Pampanga",
    tags: ["sm", "pampanga", "san fernando", "mall"],
  },
  {
    name: "SM City Clark",
    category: "Shopping Mall",
    brand: "SM Malls",
    address: "M.A. Roxas Highway, Clark Freeport, Angeles, Pampanga",
    city: "Angeles City, Pampanga",
    tags: ["sm", "clark", "angeles", "pampanga", "mall"],
  },
  {
    name: "Trinoma Mall",
    category: "Shopping Mall",
    brand: "Ayala Malls",
    address: "EDSA cor North Ave, Quezon City, Metro Manila",
    city: "Quezon City, Metro Manila",
    tags: ["trinoma", "ayala", "quezon city", "mall"],
  },
];

export const FILTER_PRESETS = [
  { label: "All Spots", brand: "ALL", icon: Sparkles },
  { label: "Starbucks", brand: "Starbucks", icon: Coffee },
  { label: "Jollibee", brand: "Jollibee", icon: UtensilsCrossed },
  { label: "McDonald's", brand: "McDonald's", icon: UtensilsCrossed },
  { label: "KFC", brand: "KFC", icon: UtensilsCrossed },
  { label: "SM Malls", brand: "SM Malls", icon: Building },
  { label: "Robinsons", brand: "Robinsons Malls", icon: Building },
  { label: "WalterMart", brand: "WalterMart", icon: Building },
  { label: "Cafes & Coffee", brand: "Coffee Shop", icon: Coffee },
  { label: "Fast Food", brand: "Fast Food", icon: UtensilsCrossed },
  { label: "Malls & Plazas", brand: "Shopping Mall", icon: Building },
];

export default function VenueSearchModal({
  isOpen,
  onClose,
  onSelectVenue,
  currentVenue = "",
  isFil = false,
}) {
  const [query, setQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef(null);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    } else {
      setQuery("");
      setOnlineResults([]);
      setIsSearchingOnline(false);
    }
  }, [isOpen]);

  // Online search with OpenStreetMap Nominatim restricted strictly to Philippines (countrycodes=ph)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingOnline(true);
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ph&q=${encodeURIComponent(
          trimmed
        )}&limit=6&addressdetails=1`;
        const res = await fetch(endpoint, {
          headers: {
            "Accept-Language": "en-PH, fil, en",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = (data || []).map((item) => ({
            name: item.name || item.display_name?.split(",")[0] || trimmed,
            category: item.type || "Venue / Landmark",
            brand: item.name || trimmed,
            address: item.display_name,
            city:
              item.address?.city ||
              item.address?.municipality ||
              item.address?.province ||
              "Philippines",
            isOnline: true,
          }));
          setOnlineResults(parsed);
        }
      } catch (err) {
        // Silently fallback to offline curated
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter curated PH venues
  const filteredCurated = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURATED_PH_VENUES.filter((venue) => {
      if (selectedBrand !== "ALL") {
        if (selectedBrand === "Coffee Shop") {
          if (venue.category !== "Coffee Shop") return false;
        } else if (selectedBrand === "Shopping Mall") {
          if (!venue.category.includes("Mall") && !venue.category.includes("Center")) return false;
        } else {
          if (venue.brand !== selectedBrand) return false;
        }
      }

      if (!q) return true;
      return (
        venue.name.toLowerCase().includes(q) ||
        venue.address.toLowerCase().includes(q) ||
        venue.city.toLowerCase().includes(q) ||
        venue.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, selectedBrand]);

  const handleChoose = (venueString) => {
    onSelectVenue(venueString);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Search Modal Box (Google Maps style card) */}
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header / Google Maps Style Search Bar Area */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-gradient-to-b from-neutral-50/80 to-white dark:from-neutral-900/90 dark:to-neutral-900">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 font-mono uppercase tracking-wide">
                  <span>{isFil ? "Pumili ng Lugar ng Konsultasyon" : "Choose Meeting Venue"}</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-medium normal-case tracking-normal">
                    Philippines Only
                  </span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Google Maps Style Search Field */}
          <div className="relative flex items-center bg-white dark:bg-neutral-950 rounded-xl border-2 border-neutral-200 dark:border-white/15 focus-within:border-amber-500 dark:focus-within:border-amber-500 shadow-sm transition-all">
            <div className="pl-3.5 pr-2 text-amber-600 dark:text-amber-400 shrink-0">
              <Search className="w-4 h-4" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isFil
                  ? "Ilagay ang meeting venue (hal. Starbucks, Jollibee, McDo, SM Mall)"
                  : "Enter your meeting venue (ex. Starbucks, Jollibee, McDonald's, SM Mall)"
              }
              className="w-full h-11 text-xs sm:text-sm bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 font-sans pr-8"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Google Maps Quick Preset Filter Chips with API Brand Logos */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-3 pb-1 -mx-1 px-1">
            {FILTER_PRESETS.map((p) => {
              const Icon = p.icon;
              const isActive = selectedBrand === p.brand;
              const isSpecificBrand =
                p.brand !== "ALL" &&
                p.brand !== "Coffee Shop" &&
                p.brand !== "Fast Food" &&
                p.brand !== "Shopping Mall";
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSelectedBrand(p.brand)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs"
                      : "bg-white dark:bg-neutral-950/50 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:border-amber-500/50"
                  }`}
                >
                  {isSpecificBrand ? (
                    <EstablishmentLogo
                      brand={p.brand}
                      className="w-4 h-4 !rounded-full !p-0.5 overflow-hidden"
                      iconClassName="w-2.5 h-2.5"
                    />
                  ) : (
                    <Icon className="w-3 h-3 shrink-0" />
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
          
          {/* Custom Venue Option (If user typed something specific) */}
          {query.trim().length > 1 && (
            <div
              onClick={() => handleChoose(query.trim())}
              className="p-3 rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <EstablishmentLogo name={query.trim()} className="w-4.5 h-4.5" iconClassName="w-2.5 h-2.5" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {isFil ? "Gamitin ang sariling lokasyon:" : "Use this exact venue/address:"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white break-words leading-relaxed mt-1">
                  &ldquo;{query.trim()}&rdquo;
                </p>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold shrink-0 flex items-center gap-1">
                <span>Select</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}

          {/* Online Nominatim Live PH Results with Logos */}
          {onlineResults.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1 block">
                Live Online Search Results (Philippines)
              </span>
              {onlineResults.map((item, idx) => (
                <button
                  key={`online-${idx}`}
                  type="button"
                  onClick={() => handleChoose(`${item.name} (${item.address})`)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 hover:border-amber-500/70 hover:bg-amber-500/5 text-left transition-all flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EstablishmentLogo
                        name={item.name}
                        category={item.category}
                        className="w-4.5 h-4.5"
                        iconClassName="w-2.5 h-2.5"
                      />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                        {item.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 uppercase font-mono">
                        {item.city}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed break-words">
                      {item.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Curated Local Branches with Establishment Logos from API */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {isSearchingOnline
                  ? "Searching Philippine locations..."
                  : `Popular Branches in Bulacan & Central Luzon (${filteredCurated.length})`}
              </span>
            </div>

            {filteredCurated.length === 0 && onlineResults.length === 0 && (
              <div className="py-8 text-center text-neutral-400 font-mono text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p>No matching preset branches found.</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  You can click &ldquo;Use this exact venue/address&rdquo; above to enter any custom spot!
                </p>
              </div>
            )}

            {filteredCurated.map((venue, idx) => {
              const venueText = `${venue.name} — ${venue.address}`;
              const isSelected = currentVenue === venueText || currentVenue === venue.name;
              return (
                <button
                  key={`curated-${idx}`}
                  type="button"
                  onClick={() => handleChoose(venueText)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40"
                      : "bg-white dark:bg-neutral-950/40 border-neutral-200 dark:border-white/10 hover:border-amber-500/50 hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EstablishmentLogo
                        name={venue.name}
                        brand={venue.brand}
                        category={venue.category}
                        className="w-4.5 h-4.5"
                        iconClassName="w-2.5 h-2.5"
                      />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                        {venue.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-medium">
                        {venue.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed break-words">
                      {venue.address}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 self-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer / Custom Manual Input */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={
                isFil
                  ? "Ilagay ang branch o landmark (hal. Starbucks WalterMart Plaridel)"
                  : "Enter your specific branch or landmark (ex. Starbucks WalterMart Plaridel)"
              }
              className="w-full h-9 px-3 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
            />
            {customInput.trim() && (
              <button
                type="button"
                onClick={() => handleChoose(customInput.trim())}
                className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs whitespace-nowrap cursor-pointer transition-all"
              >
                Apply
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
