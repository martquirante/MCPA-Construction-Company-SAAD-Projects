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

// Standard Document Suggestions for Admin requesting from Clients (with Combobox support)
export const STANDARD_REQUEST_DOCUMENTS = [
  {
    id: "tct",
    title: "Transfer Certificate of Title (TCT)",
    category: "Lot & Ownership",
    defaultNote: "Kailangan ang malinaw na kopya ng lahat ng pahina kasama ang technical description para sa zoning at boundary confirmation.",
    urgency: "Urgent",
  },
  {
    id: "tax_dec",
    title: "Latest Real Property Tax Declaration (Tax Dec)",
    category: "Tax & Assessor",
    defaultNote: "Pinakabagong resibo at certification ng tax declaration para sa zoning at assessment verification.",
    urgency: "Required for Phase 2",
  },
  {
    id: "survey_plan",
    title: "Certified Lot Subdivision & Survey Plan",
    category: "Lot & Engineering",
    defaultNote: "Kailangan para sa setback calculation at architectural site positioning.",
    urgency: "Required for Phase 2",
  },
  {
    id: "valid_id",
    title: "Valid Government-Issued ID (Primary Owner & Spouse)",
    category: "Identification",
    defaultNote: "Passport, Driver's License, o UMID para sa notarized engineering documents.",
    urgency: "Required for Phase 2",
  },
  {
    id: "spa",
    title: "Special Power of Attorney (SPA)",
    category: "Legal Authorization",
    defaultNote: "Kung kinatawan o kamag-anak ang namamahala sa transaksyon habang nasa ibang bansa.",
    urgency: "Standard",
  },
  {
    id: "brgy_clearance",
    title: "Barangay Construction Clearance & HOA Approval",
    category: "Permits & Clearances",
    defaultNote: "Clearance mula sa Barangay o Homeowners Association bago simulan ang mobilization.",
    urgency: "Standard",
  },
  {
    id: "soil_test",
    title: "Soil Test / Geotechnical Investigation Report",
    category: "Engineering & Structural",
    defaultNote: "Ulat ng structural soil bearing capacity para sa foundation engineering design.",
    urgency: "Standard",
  },
  {
    id: "architectural_wishlist",
    title: "Structural Blueprint / Architectural Wishlist",
    category: "Design Reference",
    defaultNote: "Inyong mga peg, gustong floor layout, o lumang structural sketch para sa architectural review.",
    urgency: "Standard",
  },
  {
    id: "others",
    title: "Others (Custom Specification)",
    category: "Custom Request",
    defaultNote: "Tukuyin ang partikular na dokumento na kinakailangan ng MCPA para sa inyong proyekto.",
    urgency: "Standard",
  },
];

// Standard Suggestions for Admin Directly Uploading Documents from MCPA to Client
export const STANDARD_MCPA_TRANSMITTALS = [
  {
    id: "quotation_index",
    title: "Formal Quotation & Detailed Cost Index",
    category: "Financial & Estimation",
    defaultNote: "Detalyadong presyo at material cost estimation mula sa MCPA Estimating Desk.",
  },
  {
    id: "schematic_set",
    title: "Preliminary Architectural Schematic Set (Plans & Elevations)",
    category: "Architectural Drawings",
    defaultNote: "Paunang floor plan at 3D exterior perspective para sa inyong pagsusuri at feedback.",
  },
  {
    id: "boq_breakdown",
    title: "Bill of Quantities (BOQ) Summary Breakdown",
    category: "Engineering Breakdown",
    defaultNote: "Talaan ng mga materyales, lakas-paggawa, at schedule ng pagbuhos.",
  },
  {
    id: "contract_draft",
    title: "Signed Construction Agreement & Conditions",
    category: "Legal & Contract",
    defaultNote: "Opisyal na kontrata sa pagitan ng kliyente at MCPA Construction and Supply.",
  },
  {
    id: "notice_proceed",
    title: "Notice to Proceed & Engineering Transmittal",
    category: "Mobilization & Permits",
    defaultNote: "Opisyal na pabatid para sa pagsisimula ng gawaing-sibil at site mobilization.",
  },
  {
    id: "soil_assessment",
    title: "Soil Test Geological Assessment & Recommendations",
    category: "Engineering & Soil",
    defaultNote: "Opisyal na ulat ng geological validation at footings specification.",
  },
  {
    id: "others_mcpa",
    title: "Others (Custom Transmittal)",
    category: "MCPA Transmittal",
    defaultNote: "Opisyal na dokumentong ipinapadala ng MCPA sa may-ari ng proyekto.",
  },
];

// Initial Realistic Seed Requests
export const INITIAL_DOCUMENT_REQUESTS = [
  {
    id: "req-tct-001",
    title: "Transfer Certificate of Title (TCT)",
    category: "Lot & Ownership",
    clientName: "Raymart Quirante",
    clientEmail: "rayquirante@gmail.com",
    projectCode: "MCPA-CPB-748294",
    urgency: "Urgent",
    note: "Pakisiguradong malinaw ang technical description sa likod ng titulo para sa setback at boundary verification ng building permit.",
    requestedBy: "Engr. Raymart Quirante (Admin)",
    requestedAt: "2026-10-13T09:00:00.000Z",
    status: "pending", // "pending" | "uploaded" | "verified"
    file: null,
  },
  {
    id: "req-taxdec-002",
    title: "Latest Real Property Tax Declaration (Tax Dec)",
    category: "Tax & Assessor",
    clientName: "Raymart Quirante",
    clientEmail: "rayquirante@gmail.com",
    projectCode: "MCPA-CPB-748294",
    urgency: "Required for Phase 2",
    note: "Pinakabagong certified true copy o official receipt ng amilyar/tax declaration mula sa City/Municipal Assessor.",
    requestedBy: "Engr. Raymart Quirante (Admin)",
    requestedAt: "2026-10-13T09:30:00.000Z",
    status: "pending",
    file: null,
  },
  {
    id: "req-validid-003",
    title: "Valid Government-Issued ID (Primary Owner)",
    category: "Identification",
    clientName: "Raymart Quirante",
    clientEmail: "rayquirante@gmail.com",
    projectCode: "MCPA-CPB-748294",
    urgency: "Standard",
    note: "Malinaw na kopya ng Passport, UMID, o Driver's License na may tatlong pirma para sa legal notarization.",
    requestedBy: "Engr. Raymart Quirante (Admin)",
    requestedAt: "2026-10-12T14:20:00.000Z",
    status: "uploaded",
    file: {
      fileName: "Raymart_Quirante_Government_ID_Verified.pdf",
      fileSize: 2450892,
      fileUrl: "/assets/mcpa-logo.svg",
      mimeType: "application/pdf",
      uploadedAt: "2026-10-12T16:15:00.000Z",
    },
    verified: true,
  },
];

// Initial Realistic Seed MCPA Transmittals (Issued directly by MCPA to client)
export const INITIAL_MCPA_TRANSMITTALS = [
  {
    id: "tx-brief-001",
    title: "Preliminary Architectural Consultation Brief & Site Zoning Guidelines",
    category: "Architectural Drawings",
    clientName: "Raymart Quirante",
    clientEmail: "rayquirante@gmail.com",
    projectCode: "MCPA-CPB-748294",
    note: "Opisyal na preliminary zoning guidelines at structural setback summary na inihanda ng MCPA Central Architecture Studio.",
    issuedBy: "Engr. Raymart Quirante (MCPA Principal)",
    issuedAt: "2026-10-13T08:15:00.000Z",
    fileName: "MCPA_Preliminary_Zoning_Brief_MQ04.pdf",
    fileSize: 4218760,
    fileUrl: "/assets/mcpa-logo.svg",
    mimeType: "application/pdf",
  },
];

/**
 * Validates a selected file against format and 25MB limits.
 * Returns human-readable, non-IT friendly error message in Tagalog & English.
 */
export function validateDocumentFile(file) {
  if (!file) {
    return {
      valid: false,
      title: "Walang Napiling File",
      message: "Mangyaring pumili muna ng dokumento na nais i-upload bago magpatuloy.",
    };
  }

  const fileName = file.name || "";
  const fileExt = fileName.split(".").pop().toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type) || (fileExt === "pdf" && file.type === "application/pdf");

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      title: "Hindi Suportadong Uri ng File",
      message: `Ang napiling file (.${fileExt || "unknown"}) ay hindi suportado. Tanging mga dokumentong PDF at Larawan (JPG, PNG) lamang ang tinatanggap para sa malinaw at opisyal na pagsusuri ng MCPA engineering team.`,
    };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      title: "Masyadong Malaki ang File",
      message: `Masyadong malaki ang napiling file (${sizeInMb} MB). Ang pinapayagang pinakamataas na sukat ay 25 MB lamang upang masigurong mabilis at maayos itong ma-upload. Pakipaliit o pumili ng ibang file.`,
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
 * Loads Document Requests from LocalStorage or seeds with defaults
 */
export function loadDocumentRequests() {
  if (typeof window === "undefined") return INITIAL_DOCUMENT_REQUESTS;
  try {
    const saved = localStorage.getItem("mcpa_document_requests");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed defaults
    localStorage.setItem("mcpa_document_requests", JSON.stringify(INITIAL_DOCUMENT_REQUESTS));
    return INITIAL_DOCUMENT_REQUESTS;
  } catch (e) {
    console.warn("Could not read mcpa_document_requests:", e);
    return INITIAL_DOCUMENT_REQUESTS;
  }
}

/**
 * Saves Document Requests and notifies all listening tabs/components
 */
export function saveDocumentRequests(requests) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mcpa_document_requests", JSON.stringify(requests));
    window.dispatchEvent(
      new CustomEvent("mcpa-document-requests-updated", {
        detail: { requests },
      })
    );
  } catch (e) {
    console.warn("Could not save mcpa_document_requests:", e);
  }
}

/**
 * Loads MCPA Transmittals (Documents issued directly by MCPA to client)
 */
export function loadAdminTransmittals() {
  if (typeof window === "undefined") return INITIAL_MCPA_TRANSMITTALS;
  try {
    const saved = localStorage.getItem("mcpa_admin_transmittals");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem("mcpa_admin_transmittals", JSON.stringify(INITIAL_MCPA_TRANSMITTALS));
    return INITIAL_MCPA_TRANSMITTALS;
  } catch (e) {
    console.warn("Could not read mcpa_admin_transmittals:", e);
    return INITIAL_MCPA_TRANSMITTALS;
  }
}

/**
 * Saves MCPA Transmittals and notifies all listening tabs/components
 */
export function saveAdminTransmittals(transmittals) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mcpa_admin_transmittals", JSON.stringify(transmittals));
    window.dispatchEvent(
      new CustomEvent("mcpa-admin-transmittals-updated", {
        detail: { transmittals },
      })
    );
  } catch (e) {
    console.warn("Could not save mcpa_admin_transmittals:", e);
  }
}
