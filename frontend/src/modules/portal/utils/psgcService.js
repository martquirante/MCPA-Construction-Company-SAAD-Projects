/**
 * PSGC (Philippine Standard Geographic Code) Client Service
 * 
 * Provides dynamic cascading geographic data (Provinces -> Cities/Municipalities -> Barangays)
 * directly from public APIs (psgc.cloud with psgc.gitlab.io fallback).
 * 
 * Zero backend database storage required. All data is fetched on-demand and cached in-memory
 * and sessionStorage for instantaneous (0ms) repeat access.
 */

const MEMORY_CACHE = {
  provinces: null,
  cities: {},
  barangays: {},
};

// Popular construction regions/provinces prioritized for MCPA clients
export const PRIORITY_PROVINCES = [
  "Bulacan",
  "Metro Manila (NCR)",
  "Pampanga",
  "Cavite",
  "Laguna",
  "Rizal",
  "Batangas",
  "Bataan",
  "Nueva Ecija",
  "Tarlac",
];

const FALLBACK_PROVINCES = [
  { name: "Bulacan", code: "0301400000" },
  { name: "Metro Manila (NCR)", code: "1300000000", isRegion: true },
  { name: "Pampanga", code: "0305400000" },
  { name: "Cavite", code: "0402100000" },
  { name: "Laguna", code: "0403400000" },
  { name: "Rizal", code: "0405800000" },
  { name: "Batangas", code: "0401000000" },
  { name: "Bataan", code: "0300800000" },
  { name: "Nueva Ecija", code: "0304900000" },
  { name: "Tarlac", code: "0306900000" },
  { name: "Zambales", code: "0307100000" },
  { name: "Pangasinan", code: "0105500000" },
  { name: "Quezon", code: "0405600000" },
  { name: "Albay", code: "0500500000" },
  { name: "Cebu", code: "0702200000" },
  { name: "Iloilo", code: "0603000000" },
  { name: "Davao del Sur", code: "1102400000" },
];

const FALLBACK_BULACAN_CITIES = [
  { name: "Angat", code: "0301401000" },
  { name: "Balagtas", code: "0301402000" },
  { name: "Baliwag", code: "0301403000" },
  { name: "Bocaue", code: "0301404000" },
  { name: "Bulakan", code: "0301405000" },
  { name: "Bustos", code: "0301406000" },
  { name: "Calumpit", code: "0301407000" },
  { name: "Doña Remedios Trinidad", code: "0301408000" },
  { name: "Guiguinto", code: "0301409000" },
  { name: "Hagonoy", code: "0301410000" },
  { name: "City of Malolos", code: "0301410000" },
  { name: "Marilao", code: "0301411000" },
  { name: "City of Meycauayan", code: "0301412000" },
  { name: "Norzagaray", code: "0301413000" },
  { name: "Obando", code: "0301414000" },
  { name: "Pandi", code: "0301415000" },
  { name: "Paombong", code: "0301416000" },
  { name: "Plaridel", code: "0301417000" },
  { name: "Pulilan", code: "0301418000" },
  { name: "San Ildefonso", code: "0301419000" },
  { name: "City of San Jose del Monte", code: "0301420000" },
  { name: "San Miguel", code: "0301421000" },
  { name: "San Rafael", code: "0301422000" },
  { name: "Santa Maria", code: "0301423000" },
];

const FALLBACK_NCR_CITIES = [
  { name: "Quezon City", code: "1381300000" },
  { name: "City of Manila", code: "1380600000" },
  { name: "City of Caloocan", code: "1380100000" },
  { name: "City of Makati", code: "1380300000" },
  { name: "City of Taguig", code: "1381500000" },
  { name: "City of Pasig", code: "1381200000" },
  { name: "City of Parañaque", code: "1381000000" },
  { name: "City of Valenzuela", code: "1381600000" },
  { name: "City of Las Piñas", code: "1380200000" },
  { name: "City of Mandaluyong", code: "1380500000" },
  { name: "City of Marikina", code: "1380700000" },
  { name: "City of Muntinlupa", code: "1380800000" },
  { name: "Pasay City", code: "1381100000" },
  { name: "City of Malabon", code: "1380400000" },
  { name: "City of Navotas", code: "1380900000" },
  { name: "City of San Juan", code: "1381400000" },
  { name: "Pateros", code: "1381701000" },
];

/**
 * Fetch and return sorted list of Philippine Provinces + NCR
 */
export async function fetchProvinces() {
  if (MEMORY_CACHE.provinces && MEMORY_CACHE.provinces.length > 0) {
    return MEMORY_CACHE.provinces;
  }

  // Check sessionStorage
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("mcpa_psgc_provinces");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          MEMORY_CACHE.provinces = parsed;
          return parsed;
        }
      }
    } catch {}
  }

  let list = [];

  try {
    const res = await fetch("https://psgc.cloud/api/provinces", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        list = data.map((p) => ({
          name: p.name.trim(),
          code: p.code,
          isRegion: false,
        }));
      }
    }
  } catch (err) {
    console.warn("psgc.cloud provinces failed, attempting fallback...", err);
  }

  // If psgc.cloud failed or returned empty, try gitlab mirror
  if (list.length === 0) {
    try {
      const res = await fetch("https://psgc.gitlab.io/api/provinces/");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((p) => ({
            name: p.name.trim(),
            code: p.psgc10DigitCode || p.code,
            isRegion: false,
          }));
        }
      }
    } catch (err) {
      console.warn("psgc.gitlab.io provinces failed, using bundled list...", err);
    }
  }

  // If both failed, use bundled fallback
  if (list.length === 0) {
    list = [...FALLBACK_PROVINCES];
  }

  // Ensure "Metro Manila (NCR)" is included
  const hasNcr = list.some(
    (p) => p.name.toLowerCase().includes("ncr") || p.name.toLowerCase().includes("metro manila")
  );
  if (!hasNcr) {
    list.unshift({
      name: "Metro Manila (NCR)",
      code: "1300000000",
      isRegion: true,
    });
  }

  // Sort: Priority items first in defined order, then remaining alphabetically
  const prioritySet = new Map(PRIORITY_PROVINCES.map((name, idx) => [name.toLowerCase(), idx]));

  list.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const aPri = prioritySet.has(aLower) ? prioritySet.get(aLower) : 999;
    const bPri = prioritySet.has(bLower) ? prioritySet.get(bLower) : 999;

    if (aPri !== bPri) {
      return aPri - bPri;
    }
    return a.name.localeCompare(b.name);
  });

  MEMORY_CACHE.provinces = list;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("mcpa_psgc_provinces", JSON.stringify(list));
    } catch {}
  }

  return list;
}

/**
 * Fetch and return sorted list of Cities / Municipalities for a given province or NCR
 */
export async function fetchCitiesMunicipalities(provinceCode, provinceName = "") {
  if (!provinceCode) return [];

  const isNcr =
    provinceCode === "1300000000" ||
    provinceName.toLowerCase().includes("metro manila") ||
    provinceName.toLowerCase().includes("ncr");

  const cacheKey = isNcr ? "NCR_1300000000" : provinceCode;

  if (MEMORY_CACHE.cities[cacheKey] && MEMORY_CACHE.cities[cacheKey].length > 0) {
    return MEMORY_CACHE.cities[cacheKey];
  }

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(`mcpa_psgc_cities_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          MEMORY_CACHE.cities[cacheKey] = parsed;
          return parsed;
        }
      }
    } catch {}
  }

  let list = [];

  try {
    const url = isNcr
      ? "https://psgc.cloud/api/regions/1300000000/cities-municipalities"
      : `https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        list = data.map((c) => ({
          name: c.name.trim(),
          code: c.code,
          type: c.type || (c.isCity ? "City" : "Mun"),
        }));
      }
    }
  } catch (err) {
    console.warn(`psgc.cloud cities failed for ${provinceCode}:`, err);
  }

  // Fallback to gitlab
  if (list.length === 0) {
    try {
      const gitlabUrl = isNcr
        ? "https://psgc.gitlab.io/api/regions/1300000000/cities-municipalities/"
        : `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`;

      const res = await fetch(gitlabUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((c) => ({
            name: c.name.trim(),
            code: c.psgc10DigitCode || c.code,
            type: c.isCity ? "City" : "Mun",
          }));
        }
      }
    } catch (err) {
      console.warn(`psgc.gitlab.io cities failed for ${provinceCode}:`, err);
    }
  }

  // Built-in fallback for Bulacan or NCR if offline
  if (list.length === 0) {
    if (isNcr) {
      list = [...FALLBACK_NCR_CITIES];
    } else if (provinceName.toLowerCase().includes("bulacan") || provinceCode.startsWith("03014")) {
      list = [...FALLBACK_BULACAN_CITIES];
    }
  }

  // Sort alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name));

  MEMORY_CACHE.cities[cacheKey] = list;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`mcpa_psgc_cities_${cacheKey}`, JSON.stringify(list));
    } catch {}
  }

  return list;
}

/**
 * Fetch and return sorted list of Barangays for a given City/Municipality
 */
export async function fetchBarangays(cityMunCode, cityName = "") {
  if (!cityMunCode) return [];

  if (MEMORY_CACHE.barangays[cityMunCode] && MEMORY_CACHE.barangays[cityMunCode].length > 0) {
    return MEMORY_CACHE.barangays[cityMunCode];
  }

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(`mcpa_psgc_brgys_${cityMunCode}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          MEMORY_CACHE.barangays[cityMunCode] = parsed;
          return parsed;
        }
      }
    } catch {}
  }

  let list = [];

  try {
    const res = await fetch(
      `https://psgc.cloud/api/cities-municipalities/${cityMunCode}/barangays`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        list = data.map((b) => ({
          name: b.name.trim(),
          code: b.code,
        }));
      }
    }
  } catch (err) {
    console.warn(`psgc.cloud barangays failed for ${cityMunCode}:`, err);
  }

  // Fallback to gitlab
  if (list.length === 0) {
    try {
      const res = await fetch(
        `https://psgc.gitlab.io/api/cities-municipalities/${cityMunCode}/barangays/`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((b) => ({
            name: b.name.trim(),
            code: b.psgc10DigitCode || b.code,
          }));
        }
      }
    } catch (err) {
      console.warn(`psgc.gitlab.io barangays failed for ${cityMunCode}:`, err);
    }
  }

  // Sort alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name));

  MEMORY_CACHE.barangays[cityMunCode] = list;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`mcpa_psgc_brgys_${cityMunCode}`, JSON.stringify(list));
    } catch {}
  }

  return list;
}
