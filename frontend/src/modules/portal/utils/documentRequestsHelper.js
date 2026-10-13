// Comprehensive Helper & Synchronization Store for Document Requests and MCPA Transmittals
// Supports Admin document requests to clients, Client uploads with 0-100% animations,
// and Direct MCPA document issuance to clients.

export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (strictly enforced)

export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

// Known legacy mock IDs to purge from existing client/admin browser storage
const LEGACY_DUMMY_IDS = new Set([
  "req-tct-001",
  "req-taxdec-002",
  "req-validid-003",
  "tx-brief-001",
]);

// Standard Document Suggestions for Admin requesting from Clients (with Combobox support)
export const STANDARD_REQUEST_DOCUMENTS = [
  {
    id: "tct",
    title: "Transfer Certificate of Title (TCT)",
    category: "Lot & Ownership",
    defaultNote: "Please provide a clear and complete copy of all pages including the technical boundary description on the back for setback and zoning verification.",
    urgency: "Urgent",
  },
  {
    id: "tax_dec",
    title: "Latest Real Property Tax Declaration (Tax Dec)",
    category: "Tax & Assessor",
    defaultNote: "Most recent certified true copy or official tax receipt from the City or Municipal Assessor's office for property assessment verification.",
    urgency: "Required for Phase 2",
  },
  {
    id: "survey_plan",
    title: "Certified Lot Subdivision & Survey Plan",
    category: "Lot & Engineering",
    defaultNote: "Required for accurate building setback calculations and architectural site layout.",
    urgency: "Required for Phase 2",
  },
  {
    id: "valid_id",
    title: "Valid Government-Issued ID (Primary Owner & Spouse)",
    category: "Identification",
    defaultNote: "Clear copy of Passport, Driver's License, or National ID (with three specimen signatures) for notarized building permit applications.",
    urgency: "Required for Phase 2",
  },
  {
    id: "spa",
    title: "Special Power of Attorney (SPA)",
    category: "Legal Authorization",
    defaultNote: "Required if an authorized representative or family member is managing the project on behalf of an owner residing overseas.",
    urgency: "Standard",
  },
  {
    id: "brgy_clearance",
    title: "Barangay Construction Clearance & HOA Approval",
    category: "Permits & Clearances",
    defaultNote: "Clearance issued by the local Barangay hall or Homeowners Association prior to equipment mobilization.",
    urgency: "Standard",
  },
  {
    id: "soil_test",
    title: "Soil Test / Geotechnical Investigation Report",
    category: "Engineering & Structural",
    defaultNote: "Official structural soil bearing capacity report for structural foundation and footing design.",
    urgency: "Standard",
  },
  {
    id: "architectural_wishlist",
    title: "Structural Blueprint / Architectural Wishlist",
    category: "Design Reference",
    defaultNote: "Your preferred floor plan sketches, inspiration photos, or design pegs for architectural review.",
    urgency: "Standard",
  },
  {
    id: "others",
    title: "Others (Custom Specification)",
    category: "Custom Request",
    defaultNote: "Specify the particular document required by MCPA engineering for your project.",
    urgency: "Standard",
  },
];

// Standard Suggestions for Admin Directly Uploading Documents from MCPA to Client
export const STANDARD_MCPA_TRANSMITTALS = [
  {
    id: "quotation_index",
    title: "Formal Quotation & Detailed Cost Index",
    category: "Financial & Estimation",
    defaultNote: "Itemized project cost breakdown and material specifications prepared by the MCPA Estimating Department.",
  },
  {
    id: "schematic_set",
    title: "Preliminary Architectural Schematic Set (Plans & Elevations)",
    category: "Architectural Drawings",
    defaultNote: "Initial 2D floor plans and 3D exterior perspectives prepared for your review and feedback.",
  },
  {
    id: "boq_breakdown",
    title: "Bill of Quantities (BOQ) Summary Breakdown",
    category: "Engineering Breakdown",
    defaultNote: "Comprehensive breakdown of structural materials, labor allocation, and project timeline.",
  },
  {
    id: "contract_draft",
    title: "Signed Construction Agreement & Conditions",
    category: "Legal & Contract",
    defaultNote: "Official construction agreement terms between the client and MCPA Construction and Supply.",
  },
  {
    id: "notice_proceed",
    title: "Notice to Proceed & Engineering Transmittal",
    category: "Mobilization & Permits",
    defaultNote: "Official engineering clearance to commence site mobilization and civil construction works.",
  },
  {
    id: "soil_assessment",
    title: "Soil Test Geological Assessment & Recommendations",
    category: "Engineering & Soil",
    defaultNote: "Geological validation summary and structural foundation engineering recommendations.",
  },
  {
    id: "others_mcpa",
    title: "Others (Custom Transmittal)",
    category: "MCPA Transmittal",
    defaultNote: "Official project document transmitted directly by MCPA Construction and Supply.",
  },
];

// Clean initial state with zero dummy / seed records
export const INITIAL_DOCUMENT_REQUESTS = [];

// Clean initial state with zero dummy / seed transmittals
export const INITIAL_MCPA_TRANSMITTALS = [];

/**
 * Validates a selected file against format and 25MB limits.
 * Returns human-readable, non-IT friendly error message in clear English.
 */
export function validateDocumentFile(file) {
  if (!file) {
    return {
      valid: false,
      title: "No File Selected",
      message: "Please choose a document from your computer or phone before proceeding.",
    };
  }

  const fileName = file.name || "";
  const fileExt = fileName.split(".").pop().toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type) || (fileExt === "pdf" && file.type === "application/pdf");

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      title: "Unsupported File Format",
      message: `The selected file format (.${fileExt || "unknown"}) is not supported. Please upload a PDF document or image file (JPG, PNG) so our engineering team can review it clearly.`,
    };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      title: "File Exceeds Size Limit",
      message: `The selected file is too large (${sizeInMb} MB). The maximum allowed file size is 25 MB to ensure smooth and secure upload. Please choose a compressed copy or smaller file.`,
    };
  }

  return { valid: true, title: "", message: "" };
}

/**
 * Formats bytes into human-readable MB / KB
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 KB";
  const num = Number(bytes);
  if (num >= 1024 * 1024) {
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.round(num / 1024)} KB`;
}

/**
 * Format ISO date string into readable Philippine time format
 */
export function formatDocDate(isoDateStr) {
  if (!isoDateStr) return "Just now";
  try {
    const d = new Date(isoDateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Recently";
  }
}

/**
 * Loads Document Requests from LocalStorage without dummy seed data
 */
export function loadDocumentRequests() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("mcpa_document_requests");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Purge any legacy dummy records that may be stuck in the browser
        const clean = parsed.filter((item) => item && !LEGACY_DUMMY_IDS.has(item.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem("mcpa_document_requests", JSON.stringify(clean));
        }
        return clean;
      }
    }
    return [];
  } catch (e) {
    console.warn("Could not read mcpa_document_requests:", e);
    return [];
  }
}

/**
 * Saves Document Requests and notifies all listening tabs/components
 */
export function saveDocumentRequests(requests) {
  if (typeof window === "undefined") return;
  try {
    const clean = Array.isArray(requests)
      ? requests.filter((item) => item && !LEGACY_DUMMY_IDS.has(item.id))
      : [];
    localStorage.setItem("mcpa_document_requests", JSON.stringify(clean));
    window.dispatchEvent(
      new CustomEvent("mcpa-document-requests-updated", {
        detail: { requests: clean },
      })
    );
  } catch (e) {
    console.warn("Could not save mcpa_document_requests:", e);
  }
}

/**
 * Loads MCPA Transmittals without dummy seed data
 */
export function loadAdminTransmittals() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("mcpa_admin_transmittals");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Purge any legacy dummy transmittal records
        const clean = parsed.filter((item) => item && !LEGACY_DUMMY_IDS.has(item.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem("mcpa_admin_transmittals", JSON.stringify(clean));
        }
        return clean;
      }
    }
    return [];
  } catch (e) {
    console.warn("Could not read mcpa_admin_transmittals:", e);
    return [];
  }
}

/**
 * Saves MCPA Transmittals and notifies all listening tabs/components
 */
export function saveAdminTransmittals(transmittals) {
  if (typeof window === "undefined") return;
  try {
    const clean = Array.isArray(transmittals)
      ? transmittals.filter((item) => item && !LEGACY_DUMMY_IDS.has(item.id))
      : [];
    localStorage.setItem("mcpa_admin_transmittals", JSON.stringify(clean));
    window.dispatchEvent(
      new CustomEvent("mcpa-admin-transmittals-updated", {
        detail: { transmittals: clean },
      })
    );
  } catch (e) {
    console.warn("Could not save mcpa_admin_transmittals:", e);
  }
}
