const db = require("../services/dbFailoverEngine");
const realtimeService = require("../services/realtimeService");

// In-memory LRU cache for IP geolocation (keyed by masked /24 subnet or IP)
const geoCache = new Map();
let cachedLocalPublicGeo = null;
let lastBroadcastTime = 0;

/**
 * Privacy-preserving IP masking (truncates last octet of IPv4 or last 80 bits of IPv6).
 * Raw IP addresses are NEVER stored in the database.
 */
function maskIpAddress(rawIp) {
  if (!rawIp || typeof rawIp !== "string") return "0.0.0.xxx";
  const clean = rawIp.replace(/^::ffff:/i, "").trim();
  if (clean === "127.0.0.1" || clean === "::1") return "127.0.0.xxx";
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  if (clean.includes(":")) {
    const parts = clean.split(":");
    return `${parts.slice(0, 3).join(":")}::xxxx`;
  }
  return "0.0.0.xxx";
}

function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/i, "").trim();
  return (
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "localhost" ||
    clean.startsWith("10.") ||
    clean.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)
  );
}

function enrichLocationHierarchy(geo) {
  const cityLower = String(geo.city || "").toLowerCase().trim();
  const countryCode = String(geo.country_code || "").toUpperCase();

  const countryNameMap = {
    PH: { name: "Philippines", continent: "Asia" },
    US: { name: "United States", continent: "North America" },
    SG: { name: "Singapore", continent: "Asia" },
    AE: { name: "United Arab Emirates", continent: "Asia" },
    JP: { name: "Japan", continent: "Asia" },
    CA: { name: "Canada", continent: "North America" },
    AU: { name: "Australia", continent: "Oceania" },
    GB: { name: "United Kingdom", continent: "Europe" },
    SA: { name: "Saudi Arabia", continent: "Asia" },
    QA: { name: "Qatar", continent: "Asia" },
  };

  if (countryNameMap[countryCode]) {
    if (!geo.country || geo.country.length === 2) {
      geo.country = countryNameMap[countryCode].name;
    }
    if (!geo.continent || geo.continent === "Unknown") {
      geo.continent = countryNameMap[countryCode].continent;
    }
  }

  if (countryCode === "PH") {
    if (
      /plaridel|malolos|baliwag|baliuag|meycauayan|marilao|bocaue|santa maria|guiguinto|pulilan|calumpit|hagonoy|pandi|bustos|san jose del monte|balagtas|obando|paombong|san ildefonso|san miguel|san rafael|norzagaray|angat/i.test(
        cityLower
      )
    ) {
      geo.province = "Bulacan";
      geo.region = "Central Luzon (Region III)";
    } else if (/san fernando|angeles|mabalacat|clark|apalit|lubao|guagua|mexico/i.test(cityLower)) {
      geo.province = "Pampanga";
      geo.region = "Central Luzon (Region III)";
    } else if (/quezon city|makati|manila|taguig|pasig|mandaluyong|pasay|paranaque|las pinas|muntinlupa|caloocan|valenzuela|marikina|san juan/i.test(cityLower)) {
      geo.province = "Metro Manila";
      geo.region = "NCR (Metro Manila)";
    } else if (/cebu/i.test(cityLower)) {
      geo.province = "Cebu";
      geo.region = "Central Visayas (Region VII)";
    } else if (/davao/i.test(cityLower)) {
      geo.province = "Davao del Sur";
      geo.region = "Davao Region (Region XI)";
    }
  }
  return geo;
}

/**
 * Resolves approximate geographic metadata from IP address or edge headers.
 * Never uses invasive browser GPS.
 */
async function resolveGeolocation(req, clientTimezone = "Asia/Manila") {
  // 1. Check cloud proxy headers first (Cloudflare / Vercel / Azure Front Door)
  const rawForwarded = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip || "";
  const clientIp = String(rawForwarded).split(",")[0].trim().replace(/^::ffff:/i, "");
  const ipMasked = maskIpAddress(clientIp);

  // Check Vercel / Cloudflare headers if deployed on edge
  const edgeCountryCode = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"];
  const edgeCity = req.headers["x-vercel-ip-city"] || req.headers["cf-ipcity"];
  const edgeRegion = req.headers["x-vercel-ip-country-region"] || req.headers["cf-region"];
  const edgeContinent = req.headers["x-vercel-ip-continent"] || req.headers["cf-ipcontinent"];
  const edgeLat = parseFloat(req.headers["x-vercel-ip-latitude"] || req.headers["cf-iplatitude"] || "");
  const edgeLon = parseFloat(req.headers["x-vercel-ip-longitude"] || req.headers["cf-iplongitude"] || "");

  // When explicit edge city & country headers are present, honor them immediately for accuracy
  if (edgeCountryCode && edgeCity) {
    return enrichLocationHierarchy({
      ip_masked: ipMasked,
      continent: edgeContinent || "Asia",
      country: edgeCountryCode.toUpperCase(),
      country_code: edgeCountryCode.toUpperCase(),
      region: edgeRegion || "Unknown",
      province: edgeRegion || "Unknown",
      city: decodeURIComponent(edgeCity),
      county: "Unknown",
      timezone: clientTimezone || "Asia/Manila",
      latitude: !isNaN(edgeLat) ? edgeLat : 14.8872,
      longitude: !isNaN(edgeLon) ? edgeLon : 120.8572,
    });
  }

  const cacheKey = isPrivateOrLocalIp(clientIp) ? `local_public_${clientTimezone}` : ipMasked;
  if (geoCache.has(cacheKey)) {
    const cached = geoCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
      return { ...cached.data, ip_masked: ipMasked };
    }
  }

  // 2. Query reliable IP geolocation API (ipwho.is -> fallback ipapi.co)
  try {
    const lookupTarget = isPrivateOrLocalIp(clientIp) ? "https://ipwho.is/" : `https://ipwho.is/${encodeURIComponent(clientIp)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2200);
    const resp = await fetch(lookupTarget, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "MCPAConstructionAnalytics/1.0" },
    });
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.success !== false && data.country) {
        const geo = {
          ip_masked: ipMasked,
          continent: data.continent || edgeContinent || "Asia",
          country: data.country || "Philippines",
          country_code: (data.country_code || edgeCountryCode || "PH").toUpperCase(),
          region: data.region || edgeRegion || "Unknown",
          province: data.region || edgeRegion || "Unknown",
          city: data.city || (edgeCity ? decodeURIComponent(edgeCity) : "Unknown"),
          county: data.district || data.postal || "Unknown",
          timezone: data.timezone?.id || clientTimezone || "Asia/Manila",
          latitude: typeof data.latitude === "number" ? data.latitude : !isNaN(edgeLat) ? edgeLat : 14.8872,
          longitude: typeof data.longitude === "number" ? data.longitude : !isNaN(edgeLon) ? edgeLon : 120.8572,
        };
        geoCache.set(cacheKey, { timestamp: Date.now(), data: geo });
        return geo;
      }
    }
  } catch (_) {
    // Proceed to fallback
  }

  // 3. Fallback using edge headers or timezone mapping
  const tzMap = {
    "Asia/Manila": {
      continent: "Asia",
      country: "Philippines",
      country_code: "PH",
      region: "Central Luzon",
      province: "Bulacan",
      city: "Plaridel",
      county: "District II",
      latitude: 14.8872,
      longitude: 120.8572,
    },
    "Asia/Singapore": {
      continent: "Asia",
      country: "Singapore",
      country_code: "SG",
      region: "Central Singapore",
      province: "Singapore",
      city: "Singapore",
      county: "Central",
      latitude: 1.3521,
      longitude: 103.8198,
    },
    "Asia/Tokyo": {
      continent: "Asia",
      country: "Japan",
      country_code: "JP",
      region: "Kanto",
      province: "Tokyo",
      city: "Tokyo",
      county: "Chiyoda",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    "America/Los_Angeles": {
      continent: "North America",
      country: "United States",
      country_code: "US",
      region: "West Coast",
      province: "California",
      city: "Los Angeles",
      county: "Los Angeles County",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    "America/New_York": {
      continent: "North America",
      country: "United States",
      country_code: "US",
      region: "Northeast",
      province: "New York",
      city: "New York",
      county: "New York County",
      latitude: 40.7128,
      longitude: -74.006,
    },
    "Asia/Dubai": {
      continent: "Asia",
      country: "United Arab Emirates",
      country_code: "AE",
      region: "Dubai",
      province: "Dubai",
      city: "Dubai",
      county: "Unknown",
      latitude: 25.2048,
      longitude: 55.2708,
    },
    "Europe/London": {
      continent: "Europe",
      country: "United Kingdom",
      country_code: "GB",
      region: "England",
      province: "Greater London",
      city: "London",
      county: "Unknown",
      latitude: 51.5072,
      longitude: -0.1276,
    },
    "Australia/Sydney": {
      continent: "Oceania",
      country: "Australia",
      country_code: "AU",
      region: "New South Wales",
      province: "New South Wales",
      city: "Sydney",
      county: "Unknown",
      latitude: -33.8688,
      longitude: 151.2093,
    },
  };

  const fallback = tzMap[clientTimezone] || tzMap["Asia/Manila"];
  return {
    ip_masked: ipMasked,
    continent: edgeContinent || fallback.continent,
    country: edgeCountryCode ? edgeCountryCode : fallback.country,
    country_code: (edgeCountryCode || fallback.country_code).toUpperCase(),
    region: edgeRegion || fallback.region,
    province: edgeRegion || fallback.province,
    city: edgeCity ? decodeURIComponent(edgeCity) : fallback.city,
    county: fallback.county || "Unknown",
    timezone: clientTimezone || "Asia/Manila",
    latitude: !isNaN(edgeLat) ? edgeLat : fallback.latitude,
    longitude: !isNaN(edgeLon) ? edgeLon : fallback.longitude,
  };
}

/**
 * Non-invasive User-Agent + User-Agent Client Hints parser.
 * Classifies Operating System, Device Category, Brand/Manufacturer/Model, and Browser.
 * Displays "Unknown" instead of guessing when browser privacy hides exact sub-models/versions.
 */
function parseDeviceAndOsAndBrowser(userAgent = "", uaHints = {}, clientDeviceMeta = {}) {
  const ua = String(userAgent || "");
  const hintsPlatform = String(uaHints.platform || "").trim();
  const hintsPlatformVersion = String(uaHints.platformVersion || "").trim();
  const hintsModel = String(uaHints.model || "").trim();
  const hintsMobile = Boolean(uaHints.mobile);
  const hintsBrands = Array.isArray(uaHints.brands) ? uaHints.brands : [];

  // ---------------------------------------------------------------------------
  // 1. OPERATING SYSTEM DETECTION
  // Supported: Windows, macOS, Linux, Android, iOS, ChromeOS, Other, Unknown
  // ---------------------------------------------------------------------------
  let operating_system = "Unknown";
  let os_version = "Unknown";
  let platform = hintsPlatform || clientDeviceMeta.platform || "Unknown";

  if (/CrOS/i.test(ua) || /Chrome OS|Chromium OS/i.test(hintsPlatform)) {
    operating_system = "ChromeOS";
    const m = ua.match(/CrOS\s+[^\s]+\s+([\d.]+)/i);
    os_version = hintsPlatformVersion || (m ? m[1] : "Unknown");
  } else if (/Android/i.test(ua) || /Android/i.test(hintsPlatform)) {
    operating_system = "Android";
    const m = ua.match(/Android\s+([\d.]+)/i);
    os_version = (m ? m[1] : "") || hintsPlatformVersion || "Unknown";
  } else if (/iPhone|iPad|iPod/i.test(ua) || /iOS/i.test(hintsPlatform)) {
    operating_system = "iOS";
    const m = ua.match(/OS\s+([\d_]+)\s+like\s+Mac\s+OS\s+X/i);
    os_version = m ? m[1].replace(/_/g, ".") : hintsPlatformVersion || "Unknown";
  } else if (/Windows NT/i.test(ua) || /Windows/i.test(hintsPlatform)) {
    operating_system = "Windows";
    if (hintsPlatformVersion) {
      const major = parseInt(hintsPlatformVersion.split(".")[0], 10);
      if (!isNaN(major) && major >= 13) {
        os_version = "11";
      } else if (!isNaN(major) && major > 0) {
        os_version = "10";
      } else {
        os_version = hintsPlatformVersion;
      }
    } else if (/Windows NT 10\.0/i.test(ua)) {
      os_version = "10 / 11"; // Browser freezes NT 10.0 without Client Hints
    } else if (/Windows NT 6\.3/i.test(ua)) {
      os_version = "8.1";
    } else if (/Windows NT 6\.1/i.test(ua)) {
      os_version = "7";
    } else {
      os_version = "Unknown";
    }
  } else if (/Macintosh|Mac OS X/i.test(ua) || /macOS|MacIntel/i.test(hintsPlatform)) {
    // Distinguish iPadOS desktop-mode if touchPoints > 1
    if (Number(clientDeviceMeta.maxTouchPoints) > 1 && /Macintosh/i.test(ua)) {
      operating_system = "iOS";
      os_version = "iPadOS";
    } else {
      operating_system = "macOS";
      if (hintsPlatformVersion && hintsPlatformVersion !== "0.0.0") {
        os_version = hintsPlatformVersion;
      } else {
        const m = ua.match(/Mac OS X\s+([\d_.]+)/i);
        os_version = m ? m[1].replace(/_/g, ".") : "Unknown";
      }
    }
  } else if (/Linux|X11|Ubuntu|Fedora|Debian/i.test(ua) || /Linux/i.test(hintsPlatform)) {
    operating_system = "Linux";
    os_version = hintsPlatformVersion || "Unknown";
  } else if (ua.trim()) {
    operating_system = "Other";
  }

  // ---------------------------------------------------------------------------
  // 2. DEVICE CATEGORY DETECTION
  // Supported: Desktop, Laptop, Mobile, Tablet, Other, Unknown
  // ---------------------------------------------------------------------------
  let device_type = "Unknown";
  const screenW = parseInt(String(clientDeviceMeta.screenResolution || "").split("x")[0], 10) || 0;
  const screenH = parseInt(String(clientDeviceMeta.screenResolution || "").split("x")[1], 10) || 0;
  const maxDim = Math.max(screenW, screenH);
  const minDim = Math.min(screenW, screenH);

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (operating_system === "Android" && !/Mobile/i.test(ua)) || os_version === "iPadOS") {
    device_type = "Tablet";
  } else if (hintsMobile || /Mobile|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    device_type = "Mobile";
  } else if (["Windows", "macOS", "Linux", "ChromeOS"].includes(operating_system)) {
    // Reliably distinguish Laptop only when explicit indicators exist (e.g., ChromeOS Chromebook or standard laptop retina/FHD panels with high DPR)
    if (
      operating_system === "ChromeOS" ||
      clientDeviceMeta.formFactor === "Laptop" ||
      (operating_system === "macOS" && maxDim > 0 && maxDim <= 1728 && Number(clientDeviceMeta.pixelRatio) >= 2)
    ) {
      device_type = "Laptop";
    } else {
      device_type = "Desktop";
    }
  } else if (ua.trim()) {
    device_type = "Other";
  }

  // ---------------------------------------------------------------------------
  // 3. DEVICE BRAND, MANUFACTURER & MODEL DETECTION
  // Supported brands: Apple, Samsung, Google, Xiaomi, Huawei, Oppo, Vivo, OnePlus, Motorola, Lenovo, Microsoft, Other, Unknown
  // ---------------------------------------------------------------------------
  let device_brand = "Unknown";
  let device_manufacturer = "Unknown";
  let device_model = hintsModel || "Unknown";

  const combinedModelSource = `${hintsModel} ${ua}`;

  if (operating_system === "iOS" || operating_system === "macOS" || /iPhone|iPad|Macintosh/i.test(ua)) {
    device_brand = "Apple";
    device_manufacturer = "Apple";
    if (/iPhone/i.test(ua)) {
      device_model = hintsModel && hintsModel !== "iPhone" ? hintsModel : "iPhone (Model Protected by iOS)";
    } else if (/iPad/i.test(ua) || os_version === "iPadOS") {
      device_model = hintsModel || "iPad";
    } else if (/Macintosh/i.test(ua)) {
      device_model = hintsModel || "Mac";
    }
  } else if (/Samsung|SM-[A-Z0-9]+|GT-[A-Z0-9]+|SCH-[A-Z0-9]+/i.test(combinedModelSource)) {
    device_brand = "Samsung";
    device_manufacturer = "Samsung";
    const m = combinedModelSource.match(/\b(SM-[A-Z0-9]+|Galaxy\s+[A-Za-z0-9+\s]+)\b/i);
    device_model = hintsModel || (m ? m[1].trim() : "Unknown");
  } else if (/Pixel\s+[0-9a-zA-Z\s]+|Google/i.test(combinedModelSource) && operating_system === "Android") {
    device_brand = "Google";
    device_manufacturer = "Google";
    const m = combinedModelSource.match(/\b(Pixel\s+[0-9a-zA-Z]+(?:\s+Pro|\s+XL|\s+Fold)?)\b/i);
    device_model = hintsModel || (m ? m[1].trim() : "Unknown");
  } else if (/Xiaomi|Redmi|POCO|Mi\s+[0-9A-Z]+|\b2[1234][01][0-9]{4}[A-Z]{1,2}\b/i.test(combinedModelSource)) {
    device_brand = "Xiaomi";
    device_manufacturer = "Xiaomi";
    const m = combinedModelSource.match(/\b(Redmi\s+[^\s;)]+|POCO\s+[^\s;)]+|Mi\s+[^\s;)]+)\b/i);
    device_model = hintsModel || (m ? m[1].trim() : "Unknown");
  } else if (/Huawei|HUAWEI|Honor|HONOR|\b(?:ELS|NOH|ANA|VOG|LYA|MAR|STK|JNY)-[A-Z0-9]+\b/i.test(combinedModelSource)) {
    device_brand = "Huawei";
    device_manufacturer = "Huawei";
    const m = combinedModelSource.match(/\b([A-Z]{3}-[A-Z0-9]+)\b/);
    device_model = hintsModel || (m ? m[1] : "Unknown");
  } else if (/OPPO|CPH[0-9]{4}|PG[A-Z0-9]{4}/i.test(combinedModelSource)) {
    device_brand = "Oppo";
    device_manufacturer = "Oppo";
    const m = combinedModelSource.match(/\b(CPH[0-9]{4}|OPPO\s+[^\s;)]+)\b/i);
    device_model = hintsModel || (m ? m[1] : "Unknown");
  } else if (/vivo|\bV[0-9]{4}[A-Z]?\b/i.test(combinedModelSource)) {
    device_brand = "Vivo";
    device_manufacturer = "Vivo";
    const m = combinedModelSource.match(/\b(vivo\s+[^\s;)]+|V[0-9]{4}[A-Z]?)\b/i);
    device_model = hintsModel || (m ? m[1] : "Unknown");
  } else if (/OnePlus|\b(?:IN20|KB20|LE21|MT21|NE22|CPH24)[0-9]{2}\b/i.test(combinedModelSource)) {
    device_brand = "OnePlus";
    device_manufacturer = "OnePlus";
    const m = combinedModelSource.match(/\b(OnePlus\s+[^\s;)]+|[A-Z]{2}[0-9]{4})\b/i);
    device_model = hintsModel || (m ? m[1] : "Unknown");
  } else if (/Motorola|moto\s+[a-z0-9]+|\bXT[0-9]{4}-[0-9]\b/i.test(combinedModelSource)) {
    device_brand = "Motorola";
    device_manufacturer = "Motorola";
    const m = combinedModelSource.match(/\b(moto\s+[^;)]+|XT[0-9]{4}-[0-9])\b/i);
    device_model = hintsModel || (m ? m[1].trim() : "Unknown");
  } else if (/Lenovo|ThinkPad|IdeaPad|\bTB-[A-Z0-9]+\b/i.test(combinedModelSource)) {
    device_brand = "Lenovo";
    device_manufacturer = "Lenovo";
    device_model = hintsModel || "Unknown";
  } else if (/Surface|Xbox/i.test(combinedModelSource)) {
    device_brand = "Microsoft";
    device_manufacturer = "Microsoft";
    device_model = hintsModel || "Surface";
  } else if (operating_system === "Android") {
    // Attempt generic Android Build model extraction if present before "Build/"
    const androidModelMatch = ua.match(/;\s*([^;)]+?)\s+Build\//i);
    if (androidModelMatch && androidModelMatch[1] && androidModelMatch[1] !== "K") {
      device_model = hintsModel || androidModelMatch[1].trim();
      device_brand = "Other";
      device_manufacturer = "Other";
    }
  }

  // Clean Android "K" reduced UA model token
  if (device_model === "K" || !device_model) {
    device_model = "Unknown";
  }

  // ---------------------------------------------------------------------------
  // 4. BROWSER DETECTION
  // Supported: Google Chrome, Safari, Microsoft Edge, Mozilla Firefox, Opera, Samsung Internet, Brave, Other
  // ---------------------------------------------------------------------------
  let browser = "Unknown";
  let browser_version = "Unknown";

  const brandNames = hintsBrands.map((b) => `${b.brand || ""} ${b.version || ""}`).join(" ");

  if (clientDeviceMeta.isBrave || /Brave/i.test(ua) || /Brave/i.test(brandNames)) {
    browser = "Brave";
    const m = ua.match(/Chrome\/([\d.]+)/i);
    browser_version = m ? m[1].split(".")[0] : "Unknown";
  } else if (/SamsungBrowser\/([\d.]+)/i.test(ua)) {
    browser = "Samsung Internet";
    browser_version = ua.match(/SamsungBrowser\/([\d.]+)/i)[1];
  } else if (/OPR\/([\d.]+)|Opera\/([\d.]+)/i.test(ua) || /Opera/i.test(brandNames)) {
    browser = "Opera";
    const m = ua.match(/(?:OPR|Opera)\/([\d.]+)/i);
    browser_version = m ? m[1].split(".")[0] : "Unknown";
  } else if (/EdgA?\/([\d.]+)|EdgiOS\/([\d.]+)/i.test(ua) || /Microsoft Edge/i.test(brandNames)) {
    browser = "Microsoft Edge";
    const m = ua.match(/Edg(?:A|iOS)?\/([\d.]+)/i);
    browser_version = m ? m[1].split(".")[0] : "Unknown";
  } else if (/Firefox\/([\d.]+)|FxiOS\/([\d.]+)/i.test(ua)) {
    browser = "Mozilla Firefox";
    const m = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/i);
    browser_version = m ? m[1].split(".")[0] : "Unknown";
  } else if (/Chrome\/([\d.]+)|CriOS\/([\d.]+)/i.test(ua)) {
    browser = "Google Chrome";
    const m = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/i);
    browser_version = m ? m[1].split(".")[0] : "Unknown";
  } else if (/Version\/([\d.]+).*Safari/i.test(ua) || (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS/i.test(ua))) {
    browser = "Safari";
    const m = ua.match(/Version\/([\d.]+)/i);
    browser_version = m ? m[1] : "Unknown";
  } else if (ua.trim()) {
    browser = "Other";
  }

  return {
    operating_system,
    os_version,
    platform,
    device_type,
    device_brand,
    device_manufacturer,
    device_model,
    browser,
    browser_version,
  };
}

/**
 * Classifies traffic acquisition channel from referrer URL and UTM campaign tags.
 */
function classifyTrafficSource(referrer = "", utmSource = "", utmMedium = "", utmCampaign = "") {
  if (utmMedium && /cpc|ppc|paid|ads|display|sponsored/i.test(utmMedium)) {
    return { source: "Paid Campaigns", domain: utmSource || "Paid Campaign" };
  }
  if (utmSource) {
    if (/facebook|instagram|tiktok|linkedin|twitter|x\.com|youtube|fb/i.test(utmSource)) {
      return { source: "Social Media", domain: utmSource };
    }
    if (/google|bing|yahoo|duckduckgo|baidu/i.test(utmSource)) {
      return { source: "Organic Search", domain: utmSource };
    }
  }

  if (!referrer || !String(referrer).trim()) {
    return { source: "Direct Traffic", domain: "Direct" };
  }

  try {
    const parsed = new URL(referrer);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (host.includes("mcpaconstruction.com") || host.includes("localhost") || host.includes("127.0.0.1")) {
      return { source: "Direct Traffic", domain: "Direct" };
    }
    if (/google\.|bing\.com|yahoo\.com|duckduckgo\.com|ecosia\.org|baidu\.com|yandex\./i.test(host)) {
      return { source: "Organic Search", domain: host };
    }
    if (/facebook\.com|fb\.com|l\.facebook\.com|instagram\.com|tiktok\.com|youtube\.com|youtu\.be|t\.co|twitter\.com|x\.com|linkedin\.com|pinterest\.com|reddit\.com/i.test(host)) {
      return { source: "Social Media", domain: host };
    }
    return { source: "Referral", domain: host };
  } catch (_) {
    return { source: "Other", domain: "Unknown" };
  }
}

function classifyPageCategory(pagePath = "/") {
  const p = String(pagePath || "/").toLowerCase();
  if (p === "/" || p === "/home") return "home";
  if (p.startsWith("/projects")) return "projects";
  if (p.startsWith("/blog") || p.startsWith("/updates") || p.startsWith("/hashtag") || p.startsWith("/category")) return "blog";
  if (p.startsWith("/services")) return "services";
  if (p.startsWith("/process")) return "process";
  if (p.startsWith("/book") || p.startsWith("/contact")) return "contact";
  if (p.startsWith("/portal")) return "portal";
  return "other";
}

/**
 * Marks sessions inactive for > 65 seconds as offline.
 */
async function expireStaleSessions() {
  try {
    await db.query(`
      UPDATE analytics_sessions
      SET is_online = FALSE,
          ended_at = COALESCE(ended_at, last_activity_at)
      WHERE is_online = TRUE
        AND last_activity_at < (NOW() - INTERVAL '65 seconds')
    `);
  } catch (_) {}
}

/**
 * Throttled realtime broadcast to Admin Dashboard via WebSocket & SSE.
 */
function broadcastAnalyticsUpdate(eventType, payload = {}) {
  const now = Date.now();
  if (eventType === "HEARTBEAT" && now - lastBroadcastTime < 4000) return;
  lastBroadcastTime = now;
  try {
    realtimeService.broadcast("ANALYTICS_LIVE_UPDATE", {
      eventType,
      timestamp: now,
      ...payload,
    });
  } catch (_) {}
}

/**
 * Resolves start/end timestamps for current & comparison periods.
 */
function resolveDateRange(range = "30d", customStart = null, customEnd = null) {
  const now = new Date();
  let start = new Date(now);
  // Add a 10-minute upper-bound buffer for live ranges to tolerate minor clock skew between Node and cloud DB NOW()
  let end = new Date(now.getTime() + 10 * 60 * 1000);

  switch (range) {
    case "today": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    }
    case "yesterday": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    }
    case "7d": {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case "30d": {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    }
    case "90d": {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    }
    case "this_month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      break;
    }
    case "prev_month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case "this_year": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      break;
    }
    case "custom": {
      if (customStart) start = new Date(customStart);
      else start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
    default: {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  const spanMs = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime());
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    prevStartIso: prevStart.toISOString(),
    prevEndIso: prevEnd.toISOString(),
  };
}

function calcComparison(currentVal, prevVal) {
  const cur = Number(currentVal) || 0;
  const prev = Number(prevVal) || 0;
  if (prev === 0) {
    return {
      current: cur,
      previous: prev,
      changePct: cur > 0 ? 100 : 0,
      trend: cur > 0 ? "up" : "neutral",
    };
  }
  const pct = Number((((cur - prev) / prev) * 100).toFixed(1));
  return {
    current: cur,
    previous: prev,
    changePct: pct,
    trend: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
  };
}

class AnalyticsController {
  // ===========================================================================
  // 1. PUBLIC ANALYTICS INGESTION ENDPOINT (POST /api/analytics/collect)
  // ===========================================================================
  async collectAnalytics(req, res) {
    try {
      const {
        type = "pageview", // "pageview" | "heartbeat" | "event" | "leave" | "consent"
        visitorId,
        sessionId,
        pagePath = "/",
        pageTitle = "MCPA Construction and Supply",
        previousPage = null,
        referrer = null,
        utmSource = null,
        utmMedium = null,
        utmCampaign = null,
        consentStatus = "granted",
        timeOnPageSeconds = 0,
        scrollDepthPct = 0,
        eventName = null,
        eventCategory = "engagement",
        eventLabel = null,
        eventMetadata = {},
        deviceMeta = {},
        uaHints = {},
        overrideUserAgent = null,
        overrideGeo = null,
      } = req.body || {};

      // Respect opt-out consent immediately
      if (consentStatus === "opt_out") {
        return res.json({ success: true, status: "opted_out" });
      }

      if (!visitorId || !sessionId) {
        return res.status(400).json({ success: false, message: "Anonymous visitorId and sessionId are required." });
      }

      // Skip tracking internal /admin dashboard routes unless explicitly testing
      if (String(pagePath).startsWith("/admin") && !req.body.allowAdminRoute) {
        return res.json({ success: true, status: "skipped_admin" });
      }

      // Expire stale sessions periodically
      await expireStaleSessions();

      const uaString = overrideUserAgent || req.headers["user-agent"] || "";
      const parsedDevice = parseDeviceAndOsAndBrowser(uaString, uaHints, deviceMeta);
      const geo = overrideGeo
        ? {
            ip_masked: "0.0.0.xxx",
            continent: overrideGeo.continent || "Asia",
            country: overrideGeo.country || "Philippines",
            country_code: (overrideGeo.country_code || "PH").toUpperCase(),
            region: overrideGeo.region || "Central Luzon",
            province: overrideGeo.province || "Bulacan",
            city: overrideGeo.city || "Plaridel",
            county: overrideGeo.county || "Unknown",
            timezone: overrideGeo.timezone || deviceMeta.timezone || "Asia/Manila",
            latitude: overrideGeo.latitude ?? 14.8872,
            longitude: overrideGeo.longitude ?? 120.8572,
          }
        : await resolveGeolocation(req, deviceMeta.timezone);

      const { source: trafficSource, domain: referrerDomain } = classifyTrafficSource(
        referrer,
        utmSource,
        utmMedium,
        utmCampaign
      );

      const screenResolution = deviceMeta.screenResolution || "Unknown";
      const viewportSize = deviceMeta.viewportSize || "Unknown";
      const pixelRatio = Number(deviceMeta.pixelRatio) || 1.0;
      const touchCapable = Boolean(deviceMeta.touchCapable || Number(deviceMeta.maxTouchPoints) > 0);

      // 1. Check if Visitor already exists to determine New vs Returning
      const existingVisitorRes = await db.query(
        `SELECT visitor_id, visit_count FROM analytics_visitors WHERE visitor_id = $1 LIMIT 1`,
        [visitorId]
      );
      const existingVisitor = existingVisitorRes.rows?.[0] || null;

      // Check if Session already exists
      const existingSessionRes = await db.query(
        `SELECT session_id, started_at, pageviews_count, is_returning FROM analytics_sessions WHERE session_id = $1 LIMIT 1`,
        [sessionId]
      );
      const existingSession = existingSessionRes.rows?.[0] || null;

      const isReturningVisitor = existingSession
        ? Boolean(existingSession.is_returning)
        : Boolean(existingVisitor);

      // Upsert Visitor
      if (!existingVisitor) {
        await db.query(
          `INSERT INTO analytics_visitors (
             visitor_id, first_seen_at, last_seen_at, first_referrer, first_landing_page, consent_status,
             visit_count, total_pageviews, device_type, device_brand, device_model, device_manufacturer,
             operating_system, os_version, browser, browser_version, screen_resolution,
             continent, country, country_code, region, province, city, county, timezone, latitude, longitude
           ) VALUES (
             $1, NOW(), NOW(), $2, $3, $4,
             1, 1, $5, $6, $7, $8,
             $9, $10, $11, $12, $13,
             $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
           )
           ON CONFLICT (visitor_id) DO UPDATE SET last_seen_at = NOW()`,
          [
            visitorId,
            referrer || null,
            pagePath,
            consentStatus,
            parsedDevice.device_type,
            parsedDevice.device_brand,
            parsedDevice.device_model,
            parsedDevice.device_manufacturer,
            parsedDevice.operating_system,
            parsedDevice.os_version,
            parsedDevice.browser,
            parsedDevice.browser_version,
            screenResolution,
            geo.continent,
            geo.country,
            geo.country_code,
            geo.region,
            geo.province,
            geo.city,
            geo.county,
            geo.timezone,
            geo.latitude,
            geo.longitude,
          ]
        );
      } else {
        await db.query(
          `UPDATE analytics_visitors
           SET last_seen_at = NOW(),
               visit_count = CASE WHEN $2 THEN visit_count + 1 ELSE visit_count END,
               total_pageviews = CASE WHEN $3 THEN total_pageviews + 1 ELSE total_pageviews END,
               consent_status = $4
           WHERE visitor_id = $1`,
          [visitorId, !existingSession, type === "pageview", consentStatus]
        );
      }

      // 2. Upsert Session
      if (!existingSession) {
        await db.query(
          `INSERT INTO analytics_sessions (
             session_id, visitor_id, is_returning, started_at, last_activity_at, is_online,
             current_page, previous_page, landing_page, exit_page, referrer, referrer_domain, traffic_source,
             utm_source, utm_medium, utm_campaign, pageviews_count, events_count, duration_seconds, is_engaged, is_bounce,
             device_type, device_brand, device_model, device_manufacturer, operating_system, os_version, platform,
             browser, browser_version, screen_resolution, viewport_size, pixel_ratio, touch_capable,
             ip_masked, continent, country, country_code, region, province, city, county, timezone, latitude, longitude, consent_status
           ) VALUES (
             $1, $2, $3, NOW(), NOW(), TRUE,
             $4, $5, $4, $4, $6, $7, $8,
             $9, $10, $11, 1, 0, 0, FALSE, TRUE,
             $12, $13, $14, $15, $16, $17, $18,
             $19, $20, $21, $22, $23, $24,
             $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
           )
           ON CONFLICT (session_id) DO UPDATE SET last_activity_at = NOW(), is_online = TRUE`,
          [
            sessionId,
            visitorId,
            isReturningVisitor,
            pagePath,
            previousPage,
            referrer,
            referrerDomain,
            trafficSource,
            utmSource,
            utmMedium,
            utmCampaign,
            parsedDevice.device_type,
            parsedDevice.device_brand,
            parsedDevice.device_model,
            parsedDevice.device_manufacturer,
            parsedDevice.operating_system,
            parsedDevice.os_version,
            parsedDevice.platform,
            parsedDevice.browser,
            parsedDevice.browser_version,
            screenResolution,
            viewportSize,
            pixelRatio,
            touchCapable,
            geo.ip_masked,
            geo.continent,
            geo.country,
            geo.country_code,
            geo.region,
            geo.province,
            geo.city,
            geo.county,
            geo.timezone,
            geo.latitude,
            geo.longitude,
            consentStatus,
          ]
        );

        // Upsert aggregated geolocation entry
        const locKey = `${geo.country_code}|${geo.region}|${geo.province}|${geo.city}`;
        await db.query(
          `INSERT INTO analytics_geolocation (
             location_key, continent, country, country_code, region, province, city, county, timezone, latitude, longitude,
             visitors_count, sessions_count, pageviews_count, last_visit_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, 1, 1, NOW())
           ON CONFLICT (location_key) DO UPDATE SET
             visitors_count = analytics_geolocation.visitors_count + 1,
             sessions_count = analytics_geolocation.sessions_count + 1,
             pageviews_count = analytics_geolocation.pageviews_count + 1,
             last_visit_at = NOW()`,
          [
            locKey,
            geo.continent,
            geo.country,
            geo.country_code,
            geo.region,
            geo.province,
            geo.city,
            geo.county,
            geo.timezone,
            geo.latitude,
            geo.longitude,
          ]
        );
      } else {
        const isPageview = type === "pageview";
        const isLeave = type === "leave";
        const isEvent = type === "event";

        const reportedDuration = Math.max(0, parseInt(timeOnPageSeconds, 10) || 0);
        await db.query(
          `UPDATE analytics_sessions
           SET last_activity_at = NOW(),
               is_online = CASE WHEN $2 THEN FALSE ELSE TRUE END,
               ended_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
               previous_page = CASE WHEN $3 AND current_page != $4 THEN current_page ELSE previous_page END,
               current_page = COALESCE($4, current_page),
               exit_page = COALESCE($4, exit_page),
               pageviews_count = CASE WHEN $3 THEN pageviews_count + 1 ELSE pageviews_count END,
               events_count = CASE WHEN $5 THEN events_count + 1 ELSE events_count END,
               duration_seconds = GREATEST(
                 duration_seconds,
                 $6,
                 EXTRACT(EPOCH FROM (NOW() - started_at))::INT
               ),
               is_bounce = CASE
                 WHEN $3 OR pageviews_count > 1 OR $6 >= 15 OR EXTRACT(EPOCH FROM (NOW() - started_at)) >= 15 THEN FALSE
                 ELSE is_bounce
               END,
               is_engaged = CASE
                 WHEN $3 OR pageviews_count > 1 OR $5 OR $6 >= 15 OR EXTRACT(EPOCH FROM (NOW() - started_at)) >= 15 THEN TRUE
                 ELSE is_engaged
               END
           WHERE session_id = $1`,
          [sessionId, isLeave, isPageview, pagePath, isEvent, reportedDuration]
        );
      }

      // 3. Record Pageview or Update Time-on-Page
      if (type === "pageview") {
        const pageCat = classifyPageCategory(pagePath);
        await db.query(
          `INSERT INTO analytics_pageviews (
             session_id, visitor_id, page_path, page_title, page_category, previous_page, referrer, viewed_at, time_on_page_seconds, scroll_depth_pct
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)`,
          [
            sessionId,
            visitorId,
            pagePath,
            pageTitle || pagePath,
            pageCat,
            previousPage,
            referrer,
            parseInt(timeOnPageSeconds, 10) || 0,
            parseInt(scrollDepthPct, 10) || 0,
          ]
        );

        const locKey = `${geo.country_code}|${geo.region}|${geo.province}|${geo.city}`;
        if (existingSession) {
          await db.query(
            `UPDATE analytics_geolocation
             SET pageviews_count = pageviews_count + 1, last_visit_at = NOW()
             WHERE location_key = $1`,
            [locKey]
          ).catch(() => {});
        }
      } else if ((type === "heartbeat" || type === "leave") && (timeOnPageSeconds > 0 || scrollDepthPct > 0)) {
        // Update most recent pageview for this session
        await db.query(
          `UPDATE analytics_pageviews
           SET time_on_page_seconds = GREATEST(time_on_page_seconds, $3),
               scroll_depth_pct = GREATEST(scroll_depth_pct, $4)
           WHERE pageview_id = (
             SELECT pageview_id FROM analytics_pageviews
             WHERE session_id = $1 AND page_path = $2
             ORDER BY viewed_at DESC LIMIT 1
           )`,
          [
            sessionId,
            pagePath,
            parseInt(timeOnPageSeconds, 10) || 0,
            parseInt(scrollDepthPct, 10) || 0,
          ]
        ).catch(() => {});
      }

      // 4. Record Custom / Engagement Event
      if (type === "event" && eventName) {
        await db.query(
          `INSERT INTO analytics_events (
             session_id, visitor_id, event_name, event_category, event_label, page_path, metadata, occurred_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            sessionId,
            visitorId,
            String(eventName).substring(0, 100),
            String(eventCategory || "engagement").substring(0, 80),
            eventLabel ? String(eventLabel).substring(0, 255) : null,
            pagePath,
            JSON.stringify(eventMetadata || {}),
          ]
        );
      }

      // Broadcast real-time update to connected Admin Dashboards
      broadcastAnalyticsUpdate(type.toUpperCase(), {
        sessionId,
        visitorId,
        pagePath,
        deviceType: parsedDevice.device_type,
        os: parsedDevice.operating_system,
        browser: parsedDevice.browser,
        country: geo.country,
        city: geo.city,
        isNewSession: !existingSession,
      });

      return res.json({
        success: true,
        status: "recorded",
        sessionId,
        detected: {
          ...parsedDevice,
          country: geo.country,
          country_code: geo.country_code,
          region: geo.region,
          province: geo.province,
          city: geo.city,
        },
      });
    } catch (err) {
      console.error("[AnalyticsController.collectAnalytics] Error:", err.message);
      return res.status(500).json({ success: false, message: "Analytics ingestion error." });
    }
  }

  // ===========================================================================
  // 2. REAL-TIME LIVE VISITORS ENDPOINT (GET /api/admin/analytics/live)
  // ===========================================================================
  async getLiveVisitors(req, res) {
    try {
      await expireStaleSessions();

      const [onlineRes, activePagesRes, recentEndedRes] = await Promise.all([
        db.query(`
          SELECT *
          FROM analytics_sessions
          WHERE is_online = TRUE
            AND last_activity_at >= (NOW() - INTERVAL '65 seconds')
          ORDER BY last_activity_at DESC
          LIMIT 100
        `),
        db.query(`
          SELECT current_page AS page_path, COUNT(*)::INT AS active_visitors
          FROM analytics_sessions
          WHERE is_online = TRUE
            AND last_activity_at >= (NOW() - INTERVAL '65 seconds')
          GROUP BY current_page
          ORDER BY active_visitors DESC
        `),
        db.query(`
          SELECT *
          FROM analytics_sessions
          WHERE (is_online = FALSE OR last_activity_at < (NOW() - INTERVAL '65 seconds'))
          ORDER BY COALESCE(ended_at, last_activity_at) DESC
          LIMIT 25
        `),
      ]);

      const onlineVisitors = onlineRes.rows || [];
      return res.json({
        success: true,
        onlineCount: onlineVisitors.length,
        onlineVisitors,
        activePages: activePagesRes.rows || [],
        recentlyEndedSessions: recentEndedRes.rows || [],
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[AnalyticsController.getLiveVisitors] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to load live visitors." });
    }
  }

  // ===========================================================================
  // 3. COMPREHENSIVE ADMIN ANALYTICS DASHBOARD (GET /api/admin/analytics/dashboard)
  // ===========================================================================
  async getDashboardAnalytics(req, res) {
    try {
      await expireStaleSessions();

      const {
        range = "30d",
        startDate,
        endDate,
        country,
        region,
        province,
        city,
      } = req.query;

      const { startIso, endIso, prevStartIso, prevEndIso } = resolveDateRange(range, startDate, endDate);

      // Build optional Geographic Filter clauses for sessions
      const geoConditions = [];
      const geoParams = [];
      if (country && country !== "all") {
        geoParams.push(country);
        geoConditions.push(`(s.country_code = $${geoParams.length} OR s.country ILIKE $${geoParams.length})`);
      }
      if (region && region !== "all") {
        geoParams.push(region);
        geoConditions.push(`s.region ILIKE $${geoParams.length}`);
      }
      if (province && province !== "all") {
        geoParams.push(province);
        geoConditions.push(`s.province ILIKE $${geoParams.length}`);
      }
      if (city && city !== "all") {
        geoParams.push(city);
        geoConditions.push(`s.city ILIKE $${geoParams.length}`);
      }
      const geoSql = geoConditions.length > 0 ? `AND ${geoConditions.join(" AND ")}` : "";

      const curParams = [...geoParams, startIso, endIso];
      const startIdx = curParams.length - 1;
      const endIdx = curParams.length;

      const prevParams = [...geoParams, prevStartIso, prevEndIso];

      // 1. Period KPI Summary (Current vs Previous Period) + Fixed Today/Week/Month KPIs
      const [
        onlineRes,
        fixedWindowsRes,
        curKpiRes,
        prevKpiRes,
        timeSeriesRes,
        deviceTypeRes,
        osRes,
        brandModelRes,
        browserRes,
        screenRes,
        continentRes,
        countryRes,
        regionRes,
        provinceRes,
        cityRes,
        trafficSourceRes,
        referrersRes,
        topPagesRes,
        eventsSummaryRes,
        liveVisitorsRes,
        recentEndedRes,
      ] = await Promise.all([
        // Currently Online
        db.query(`
          SELECT COUNT(*)::INT AS count
          FROM analytics_sessions
          WHERE is_online = TRUE AND last_activity_at >= (NOW() - INTERVAL '65 seconds')
        `),
        // Today, This Week, This Month fixed KPIs (with comparison to Yesterday, Prev Week, Prev Month)
        db.query(`
          SELECT
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('day', NOW()))::INT AS today_visitors,
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day') AND started_at < DATE_TRUNC('day', NOW()))::INT AS yesterday_visitors,
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('week', NOW()))::INT AS week_visitors,
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('week', NOW() - INTERVAL '1 week') AND started_at < DATE_TRUNC('week', NOW()))::INT AS prev_week_visitors,
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('month', NOW()))::INT AS month_visitors,
            COUNT(DISTINCT visitor_id) FILTER (WHERE started_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND started_at < DATE_TRUNC('month', NOW()))::INT AS prev_month_visitors
          FROM analytics_sessions s
          WHERE 1=1 ${geoSql}
        `, geoParams),
        // Selected Range KPIs
        db.query(`
          SELECT
            COUNT(*)::INT AS total_sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS unique_visitors,
            COUNT(DISTINCT s.visitor_id) FILTER (WHERE s.is_returning = TRUE)::INT AS returning_visitors,
            COUNT(DISTINCT s.visitor_id) FILTER (WHERE s.is_returning = FALSE)::INT AS new_visitors,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS total_pageviews,
            COALESCE(AVG(s.duration_seconds), 0)::NUMERIC(10,1) AS avg_session_duration,
            COALESCE(AVG(s.pageviews_count), 0)::NUMERIC(10,2) AS avg_pages_per_session,
            COUNT(*) FILTER (WHERE s.is_bounce = TRUE)::INT AS bounced_sessions,
            COUNT(*) FILTER (WHERE s.is_engaged = TRUE)::INT AS engaged_sessions
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
        `, curParams),
        // Previous Period KPIs
        db.query(`
          SELECT
            COUNT(*)::INT AS total_sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS unique_visitors,
            COUNT(DISTINCT s.visitor_id) FILTER (WHERE s.is_returning = TRUE)::INT AS returning_visitors,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS total_pageviews,
            COALESCE(AVG(s.duration_seconds), 0)::NUMERIC(10,1) AS avg_session_duration,
            COALESCE(AVG(s.pageviews_count), 0)::NUMERIC(10,2) AS avg_pages_per_session,
            COUNT(*) FILTER (WHERE s.is_bounce = TRUE)::INT AS bounced_sessions
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
        `, prevParams),
        // Time-series chart (Visitors, Unique Visitors, Pageviews by Date)
        db.query(`
          SELECT
            TO_CHAR(DATE_TRUNC('day', s.started_at), 'YYYY-MM-DD') AS date,
            TO_CHAR(DATE_TRUNC('day', s.started_at), 'Mon DD') AS label,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS unique_visitors,
            COUNT(DISTINCT s.visitor_id) FILTER (WHERE s.is_returning = TRUE)::INT AS returning_visitors,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY DATE_TRUNC('day', s.started_at)
          ORDER BY DATE_TRUNC('day', s.started_at) ASC
        `, curParams),
        // Device Type Distribution
        db.query(`
          SELECT
            COALESCE(NULLIF(s.device_type, ''), 'Unknown') AS name,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1
          ORDER BY sessions DESC
        `, curParams),
        // Operating System Distribution
        db.query(`
          SELECT
            COALESCE(NULLIF(s.operating_system, ''), 'Unknown') AS name,
            COALESCE(NULLIF(s.os_version, ''), 'Unknown') AS version,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2
          ORDER BY sessions DESC
        `, curParams),
        // Device Brand, Manufacturer & Model
        db.query(`
          SELECT
            COALESCE(NULLIF(s.device_brand, ''), 'Unknown') AS brand,
            COALESCE(NULLIF(s.device_manufacturer, ''), 'Unknown') AS manufacturer,
            COALESCE(NULLIF(s.device_model, ''), 'Unknown') AS model,
            COALESCE(NULLIF(s.device_type, ''), 'Unknown') AS device_type,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3, 4
          ORDER BY sessions DESC
          LIMIT 30
        `, curParams),
        // Browser Distribution
        db.query(`
          SELECT
            COALESCE(NULLIF(s.browser, ''), 'Unknown') AS name,
            COALESCE(NULLIF(s.browser_version, ''), 'Unknown') AS version,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2
          ORDER BY sessions DESC
        `, curParams),
        // Screen Resolution Distribution
        db.query(`
          SELECT
            COALESCE(NULLIF(s.screen_resolution, ''), 'Unknown') AS resolution,
            COUNT(*)::INT AS sessions
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1
          ORDER BY sessions DESC
          LIMIT 15
        `, curParams),
        // Geographic: By Continent
        db.query(`
          SELECT
            COALESCE(NULLIF(s.continent, ''), 'Unknown') AS continent,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COUNT(*)::INT AS sessions,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1
          ORDER BY visitors DESC
        `, curParams),
        // Geographic: By Country (with lat/lng for Interactive World Map)
        db.query(`
          SELECT
            COALESCE(NULLIF(s.country, ''), 'Unknown') AS country,
            COALESCE(NULLIF(s.country_code, ''), 'UN') AS country_code,
            COALESCE(NULLIF(s.continent, ''), 'Unknown') AS continent,
            AVG(s.latitude)::NUMERIC(9,4) AS latitude,
            AVG(s.longitude)::NUMERIC(9,4) AS longitude,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COUNT(*)::INT AS sessions,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3
          ORDER BY visitors DESC
        `, curParams),
        // Geographic: By Region
        db.query(`
          SELECT
            COALESCE(NULLIF(s.region, ''), 'Unknown') AS region,
            COALESCE(NULLIF(s.country, ''), 'Unknown') AS country,
            COALESCE(NULLIF(s.country_code, ''), 'UN') AS country_code,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COUNT(*)::INT AS sessions,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3
          ORDER BY visitors DESC
          LIMIT 30
        `, curParams),
        // Geographic: By Province / State
        db.query(`
          SELECT
            COALESCE(NULLIF(s.province, ''), 'Unknown') AS province,
            COALESCE(NULLIF(s.region, ''), 'Unknown') AS region,
            COALESCE(NULLIF(s.country, ''), 'Unknown') AS country,
            COALESCE(NULLIF(s.country_code, ''), 'UN') AS country_code,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COUNT(*)::INT AS sessions,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3, 4
          ORDER BY visitors DESC
          LIMIT 30
        `, curParams),
        // Geographic: By City (with lat/lng markers for map)
        db.query(`
          SELECT
            COALESCE(NULLIF(s.city, ''), 'Unknown') AS city,
            COALESCE(NULLIF(s.province, ''), 'Unknown') AS province,
            COALESCE(NULLIF(s.region, ''), 'Unknown') AS region,
            COALESCE(NULLIF(s.country, ''), 'Unknown') AS country,
            COALESCE(NULLIF(s.country_code, ''), 'UN') AS country_code,
            AVG(s.latitude)::NUMERIC(9,4) AS latitude,
            AVG(s.longitude)::NUMERIC(9,4) AS longitude,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COUNT(*)::INT AS sessions,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3, 4, 5
          ORDER BY visitors DESC
          LIMIT 40
        `, curParams),
        // Traffic Acquisition Sources
        db.query(`
          SELECT
            COALESCE(NULLIF(s.traffic_source, ''), 'Direct Traffic') AS source,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors,
            COALESCE(SUM(s.pageviews_count), 0)::INT AS pageviews,
            COUNT(*) FILTER (WHERE s.is_engaged = TRUE)::INT AS engaged_sessions
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1
          ORDER BY sessions DESC
        `, curParams),
        // Top Referrer Domains & Campaigns
        db.query(`
          SELECT
            COALESCE(NULLIF(s.referrer_domain, ''), 'Direct') AS referrer_domain,
            COALESCE(s.traffic_source, 'Direct Traffic') AS traffic_source,
            s.utm_campaign,
            COUNT(*)::INT AS sessions,
            COUNT(DISTINCT s.visitor_id)::INT AS visitors
          FROM analytics_sessions s
          WHERE s.started_at >= $${startIdx} AND s.started_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3
          ORDER BY sessions DESC
          LIMIT 20
        `, curParams),
        // Content Performance: Most Visited Pages
        db.query(`
          SELECT
            pv.page_path,
            MAX(pv.page_title) AS page_title,
            MAX(pv.page_category) AS page_category,
            COUNT(*)::INT AS views,
            COUNT(DISTINCT pv.visitor_id)::INT AS unique_visitors,
            COALESCE(AVG(NULLIF(pv.time_on_page_seconds, 0)), 42)::INT AS avg_time_seconds,
            COALESCE(AVG(NULLIF(pv.scroll_depth_pct, 0)), 68)::INT AS avg_scroll_pct
          FROM analytics_pageviews pv
          JOIN analytics_sessions s ON s.session_id = pv.session_id
          WHERE pv.viewed_at >= $${startIdx} AND pv.viewed_at <= $${endIdx} ${geoSql}
          GROUP BY pv.page_path
          ORDER BY views DESC
          LIMIT 30
        `, curParams),
        // Content Engagement Events (Projects, Blog Posts, Services, Media)
        db.query(`
          SELECT
            e.event_name,
            e.event_category,
            COALESCE(e.event_label, e.page_path) AS label,
            COUNT(*)::INT AS count,
            COUNT(DISTINCT e.visitor_id)::INT AS unique_visitors
          FROM analytics_events e
          JOIN analytics_sessions s ON s.session_id = e.session_id
          WHERE e.occurred_at >= $${startIdx} AND e.occurred_at <= $${endIdx} ${geoSql}
          GROUP BY 1, 2, 3
          ORDER BY count DESC
          LIMIT 40
        `, curParams),
        // Live Online Visitors right now
        db.query(`
          SELECT *
          FROM analytics_sessions
          WHERE is_online = TRUE AND last_activity_at >= (NOW() - INTERVAL '65 seconds')
          ORDER BY last_activity_at DESC
          LIMIT 50
        `),
        // Recently Active / Ended Sessions
        db.query(`
          SELECT *
          FROM analytics_sessions
          ORDER BY last_activity_at DESC
          LIMIT 25
        `),
      ]);

      const cur = curKpiRes.rows?.[0] || {};
      const prev = prevKpiRes.rows?.[0] || {};
      const fw = fixedWindowsRes.rows?.[0] || {};
      const onlineCount = onlineRes.rows?.[0]?.count || 0;

      const curBounceRate =
        cur.total_sessions > 0
          ? Number(((cur.bounced_sessions / cur.total_sessions) * 100).toFixed(1))
          : 0;
      const prevBounceRate =
        prev.total_sessions > 0
          ? Number(((prev.bounced_sessions / prev.total_sessions) * 100).toFixed(1))
          : 0;

      const curEngagementRate =
        cur.total_sessions > 0
          ? Number(((cur.engaged_sessions / cur.total_sessions) * 100).toFixed(1))
          : 0;

      // Aggregate OS by family + version breakdown
      const osFamilyMap = {};
      for (const row of osRes.rows || []) {
        if (!osFamilyMap[row.name]) {
          osFamilyMap[row.name] = { name: row.name, sessions: 0, visitors: 0, versions: [] };
        }
        osFamilyMap[row.name].sessions += row.sessions;
        osFamilyMap[row.name].visitors += row.visitors;
        osFamilyMap[row.name].versions.push({ version: row.version, sessions: row.sessions });
      }

      // Aggregate Browser by family + version breakdown
      const browserFamilyMap = {};
      for (const row of browserRes.rows || []) {
        if (!browserFamilyMap[row.name]) {
          browserFamilyMap[row.name] = { name: row.name, sessions: 0, visitors: 0, versions: [] };
        }
        browserFamilyMap[row.name].sessions += row.sessions;
        browserFamilyMap[row.name].visitors += row.visitors;
        browserFamilyMap[row.name].versions.push({ version: row.version, sessions: row.sessions });
      }

      // Aggregate Brand distribution
      const brandMap = {};
      for (const row of brandModelRes.rows || []) {
        if (!brandMap[row.brand]) {
          brandMap[row.brand] = { name: row.brand, sessions: 0, visitors: 0 };
        }
        brandMap[row.brand].sessions += row.sessions;
        brandMap[row.brand].visitors += row.visitors;
      }

      // Also pull actual Blog Posts & Projects view statistics for Content Performance
      const [blogViewsRes, projectsCountRes] = await Promise.all([
        db.query(`
          SELECT post_id, title, slug, post_type, COALESCE(view_count, 0)::INT AS view_count, COALESCE(likes_count, 0)::INT AS likes_count, published_at
          FROM blog_posts
          WHERE status = 'published'
          ORDER BY view_count DESC NULLS LAST, published_at DESC
          LIMIT 10
        `).catch(() => ({ rows: [] })),
        db.query(`
          SELECT project_id, name, category, location, year
          FROM projects
          WHERE is_web_visible IS NOT FALSE
          ORDER BY featured_on_home DESC NULLS LAST, project_id DESC
          LIMIT 10
        `).catch(() => ({ rows: [] })),
      ]);

      return res.json({
        success: true,
        range,
        period: { startIso, endIso, prevStartIso, prevEndIso },
        kpis: {
          currentlyOnline: {
            current: onlineCount,
            previous: onlineCount,
            changePct: 0,
            trend: "live",
          },
          visitorsToday: calcComparison(fw.today_visitors, fw.yesterday_visitors),
          visitorsThisWeek: calcComparison(fw.week_visitors, fw.prev_week_visitors),
          visitorsThisMonth: calcComparison(fw.month_visitors, fw.prev_month_visitors),
          totalPageviews: calcComparison(cur.total_pageviews, prev.total_pageviews),
          uniqueVisitors: calcComparison(cur.unique_visitors, prev.unique_visitors),
          returningVisitors: calcComparison(cur.returning_visitors, prev.returning_visitors),
          avgSessionDuration: calcComparison(
            Math.round(Number(cur.avg_session_duration || 0)),
            Math.round(Number(prev.avg_session_duration || 0))
          ),
          avgPagesPerSession: calcComparison(
            Number(cur.avg_pages_per_session || 0),
            Number(prev.avg_pages_per_session || 0)
          ),
          bounceRate: calcComparison(curBounceRate, prevBounceRate),
          totalSessions: calcComparison(cur.total_sessions, prev.total_sessions),
          engagedSessions: cur.engaged_sessions || 0,
          engagementRate: curEngagementRate,
          newVisitors: cur.new_visitors || 0,
          returningPercentage:
            cur.unique_visitors > 0
              ? Number(((cur.returning_visitors / cur.unique_visitors) * 100).toFixed(1))
              : 0,
          newPercentage:
            cur.unique_visitors > 0
              ? Number(((cur.new_visitors / cur.unique_visitors) * 100).toFixed(1))
              : 0,
        },
        charts: {
          timeSeries: timeSeriesRes.rows || [],
          devices: deviceTypeRes.rows || [],
          operatingSystems: Object.values(osFamilyMap).sort((a, b) => b.sessions - a.sessions),
          osVersions: osRes.rows || [],
          deviceBrands: Object.values(brandMap).sort((a, b) => b.sessions - a.sessions),
          deviceModels: brandModelRes.rows || [],
          browsers: Object.values(browserFamilyMap).sort((a, b) => b.sessions - a.sessions),
          browserVersions: browserRes.rows || [],
          screenResolutions: screenRes.rows || [],
          continents: continentRes.rows || [],
          countries: countryRes.rows || [],
          regions: regionRes.rows || [],
          provinces: provinceRes.rows || [],
          cities: cityRes.rows || [],
          trafficSources: trafficSourceRes.rows || [],
          referrers: referrersRes.rows || [],
        },
        contentPerformance: {
          topPages: topPagesRes.rows || [],
          topBlogPosts: blogViewsRes.rows || [],
          topProjects: projectsCountRes.rows || [],
          events: eventsSummaryRes.rows || [],
        },
        live: {
          onlineCount,
          onlineVisitors: liveVisitorsRes.rows || [],
          recentSessions: recentEndedRes.rows || [],
        },
      });
    } catch (err) {
      console.error("[AnalyticsController.getDashboardAnalytics] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load analytics dashboard data.",
        error: err.message,
      });
    }
  }

  // ===========================================================================
  // 4. EXPORT REPORTS (CSV / JSON) (GET /api/admin/analytics/export)
  // ===========================================================================
  async exportReport(req, res) {
    try {
      const { type = "traffic", range = "30d", startDate, endDate, format = "csv" } = req.query;
      const { startIso, endIso } = resolveDateRange(range, startDate, endDate);

      let rows = [];
      let headers = [];

      if (type === "geographic") {
        const r = await db.query(
          `SELECT continent, country, country_code, region, province, city, timezone,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COUNT(*)::INT AS sessions,
                  COALESCE(SUM(pageviews_count), 0)::INT AS pageviews
           FROM analytics_sessions
           WHERE started_at >= $1 AND started_at <= $2
           GROUP BY 1, 2, 3, 4, 5, 6, 7
           ORDER BY unique_visitors DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["continent", "country", "country_code", "region", "province", "city", "timezone", "unique_visitors", "sessions", "pageviews"];
      } else if (type === "devices") {
        const r = await db.query(
          `SELECT device_type, device_brand, device_manufacturer, device_model, screen_resolution,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COUNT(*)::INT AS sessions
           FROM analytics_sessions
           WHERE started_at >= $1 AND started_at <= $2
           GROUP BY 1, 2, 3, 4, 5
           ORDER BY sessions DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["device_type", "device_brand", "device_manufacturer", "device_model", "screen_resolution", "unique_visitors", "sessions"];
      } else if (type === "os") {
        const r = await db.query(
          `SELECT operating_system, os_version, platform,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COUNT(*)::INT AS sessions
           FROM analytics_sessions
           WHERE started_at >= $1 AND started_at <= $2
           GROUP BY 1, 2, 3
           ORDER BY sessions DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["operating_system", "os_version", "platform", "unique_visitors", "sessions"];
      } else if (type === "browsers") {
        const r = await db.query(
          `SELECT browser, browser_version,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COUNT(*)::INT AS sessions
           FROM analytics_sessions
           WHERE started_at >= $1 AND started_at <= $2
           GROUP BY 1, 2
           ORDER BY sessions DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["browser", "browser_version", "unique_visitors", "sessions"];
      } else if (type === "content") {
        const r = await db.query(
          `SELECT page_path, MAX(page_title) AS page_title, MAX(page_category) AS category,
                  COUNT(*)::INT AS pageviews,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COALESCE(AVG(NULLIF(time_on_page_seconds, 0)), 40)::INT AS avg_time_seconds,
                  COALESCE(AVG(NULLIF(scroll_depth_pct, 0)), 65)::INT AS avg_scroll_pct
           FROM analytics_pageviews
           WHERE viewed_at >= $1 AND viewed_at <= $2
           GROUP BY page_path
           ORDER BY pageviews DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["page_path", "page_title", "category", "pageviews", "unique_visitors", "avg_time_seconds", "avg_scroll_pct"];
      } else {
        // Default: traffic over time
        const r = await db.query(
          `SELECT TO_CHAR(DATE_TRUNC('day', started_at), 'YYYY-MM-DD') AS date,
                  COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
                  COUNT(DISTINCT visitor_id) FILTER (WHERE is_returning = FALSE)::INT AS new_visitors,
                  COUNT(DISTINCT visitor_id) FILTER (WHERE is_returning = TRUE)::INT AS returning_visitors,
                  COUNT(*)::INT AS sessions,
                  COALESCE(SUM(pageviews_count), 0)::INT AS pageviews,
                  COALESCE(AVG(duration_seconds), 0)::INT AS avg_duration_seconds
           FROM analytics_sessions
           WHERE started_at >= $1 AND started_at <= $2
           GROUP BY DATE_TRUNC('day', started_at)
           ORDER BY DATE_TRUNC('day', started_at) DESC`,
          [startIso, endIso]
        );
        rows = r.rows || [];
        headers = ["date", "unique_visitors", "new_visitors", "returning_visitors", "sessions", "pageviews", "avg_duration_seconds"];
      }

      if (format === "json") {
        return res.json({ success: true, reportType: type, range, rows });
      }

      // Build RFC-4180 CSV
      const escapeCsv = (val) => {
        const s = String(val ?? "");
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      const csvLines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
      ];

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="mcpa-analytics-${type}-${range}.csv"`);
      return res.send(csvLines.join("\n"));
    } catch (err) {
      console.error("[AnalyticsController.exportReport] Error:", err);
      return res.status(500).json({ success: false, message: "Failed to generate report export." });
    }
  }

  // ===========================================================================
  // 5. PRIVACY & RETENTION SETTINGS (GET / PUT /api/admin/analytics/settings)
  // ===========================================================================
  async getSettings(req, res) {
    try {
      const r = await db.query(
        `SELECT setting_value, updated_at FROM analytics_settings WHERE setting_key = 'privacy_and_retention' LIMIT 1`
      );
      return res.json({
        success: true,
        settings: r.rows?.[0]?.setting_value || {
          retentionDays: 180,
          heartbeatIntervalSeconds: 20,
          sessionTimeoutSeconds: 65,
          anonymizeIp: true,
          respectDoNotTrack: false,
          consentBannerEnabled: true,
        },
        updatedAt: r.rows?.[0]?.updated_at || null,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to load analytics settings." });
    }
  }

  async updateSettings(req, res) {
    try {
      const { settings, purgeExpiredNow } = req.body || {};
      if (settings) {
        await db.query(
          `INSERT INTO analytics_settings (setting_key, setting_value, updated_at)
           VALUES ('privacy_and_retention', $1, NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [JSON.stringify(settings)]
        );
      }

      let purgedSessions = 0;
      if (purgeExpiredNow) {
        const retentionDays = Math.max(7, parseInt(settings?.retentionDays || 180, 10));
        const delRes = await db.query(
          `DELETE FROM analytics_sessions WHERE started_at < (NOW() - ($1 || ' days')::INTERVAL) RETURNING session_id`,
          [String(retentionDays)]
        );
        purgedSessions = delRes.rows?.length || 0;
        await db.query(
          `DELETE FROM analytics_pageviews WHERE viewed_at < (NOW() - ($1 || ' days')::INTERVAL)`,
          [String(retentionDays)]
        ).catch(() => {});
        await db.query(
          `DELETE FROM analytics_events WHERE occurred_at < (NOW() - ($1 || ' days')::INTERVAL)`,
          [String(retentionDays)]
        ).catch(() => {});
      }

      return res.json({
        success: true,
        message: purgeExpiredNow
          ? `Privacy settings saved and ${purgedSessions} expired session(s) purged.`
          : "Privacy and retention settings updated.",
        purgedSessions,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to update analytics settings." });
    }
  }
}

const controllerInstance = new AnalyticsController();
controllerInstance.parseDeviceAndOsAndBrowser = parseDeviceAndOsAndBrowser;
controllerInstance.resolveGeolocation = resolveGeolocation;
controllerInstance.maskIpAddress = maskIpAddress;

module.exports = controllerInstance;
