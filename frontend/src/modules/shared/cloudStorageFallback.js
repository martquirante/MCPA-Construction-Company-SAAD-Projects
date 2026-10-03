/**
 * MCPA Construction - Multi-Cloud Resilient Image Fallback Utilities
 * Provides deterministic mirror URL resolution across:
 * 1. Azure Blob Storage (Primary)
 * 2. Supabase Storage (Hot Standby)
 * 3. Neon S3 Object Storage (Standby)
 * 4. Safe Architectural Fallback Placeholder
 */

const SUPABASE_STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dzqqyqothtttccplvvnb.supabase.co";
const NEON_S3_ENDPOINT =
  process.env.NEXT_PUBLIC_AWS_ENDPOINT_URL_S3 ||
  "https://br-muddy-firefly-b33z1wff.storage.c-4.ap-southeast-1.aws.neon.tech";

const ARCHITECTURAL_PLACEHOLDER =
  "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format";

/**
 * Extracts the clean unique filename and category from any image URL
 * @param {string} url 
 * @returns {{ fileName: string, category: string } | null}
 */
export function parseCloudStorageUrl(url) {
  if (!url || typeof url !== "string") return null;

  // External third-party URLs (Unsplash, etc.) or data URIs
  if (
    url.startsWith("data:") ||
    url.includes("unsplash.com") ||
    url.includes("cloudinary.com") ||
    url.includes("wikipedia.org") ||
    url.includes("wikimedia.org")
  ) {
    return null;
  }

  try {
    const urlObj = new URL(url.startsWith("http") ? url : `http://localhost${url}`);
    const segments = urlObj.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const rawFileName = segments[segments.length - 1].split("?")[0];
    const fileName = decodeURIComponent(rawFileName);

    let category = "portfolio";
    if (url.includes("brief") || segments.some((s) => s.toLowerCase().includes("brief"))) {
      category = "briefs";
    }

    return { fileName, category };
  } catch (e) {
    const segments = url.split("/");
    const fileName = decodeURIComponent(segments[segments.length - 1].split("?")[0]);
    return { fileName, category: "portfolio" };
  }
}

/**
 * Generates an array of prioritized mirror URLs for zero-downtime failover
 * @param {string} originalUrl 
 * @returns {string[]} Ordered fallback mirrors [Primary, Supabase, Neon S3, Placeholder]
 */
export function getCloudMirrorUrls(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") {
    return [ARCHITECTURAL_PLACEHOLDER];
  }

  const parsed = parseCloudStorageUrl(originalUrl);
  if (!parsed || !parsed.fileName) {
    return [originalUrl];
  }

  const { fileName, category } = parsed;
  const supaBucket = category === "briefs" ? "briefs" : "portfolio";
  const s3Bucket = category === "briefs" ? "mcpa-briefs" : "mcpa-portfolio";

  const azureUrl = `https://mcpastorage.blob.core.windows.net/${s3Bucket}/${fileName}`;
  const supabaseUrl = `${SUPABASE_STORAGE_URL}/storage/v1/object/public/${supaBucket}/${fileName}`;
  const neonS3Url = `${NEON_S3_ENDPOINT}/${s3Bucket}/${fileName}`;

  // Prioritize based on original URL source, ensuring every mirror is available
  const mirrorList = [];

  if (originalUrl.includes("blob.core.windows.net")) {
    mirrorList.push(originalUrl, supabaseUrl, neonS3Url);
  } else if (originalUrl.includes("supabase.co")) {
    mirrorList.push(originalUrl, azureUrl, neonS3Url);
  } else if (originalUrl.includes(NEON_S3_ENDPOINT) || originalUrl.includes("neon.tech")) {
    mirrorList.push(originalUrl, azureUrl, supabaseUrl);
  } else {
    // Local development or relative path
    mirrorList.push(originalUrl, azureUrl, supabaseUrl, neonS3Url);
  }

  // De-duplicate in order of priority, append safe placeholder as last resort
  const uniqueMirrors = [...new Set(mirrorList)];
  uniqueMirrors.push(ARCHITECTURAL_PLACEHOLDER);

  return uniqueMirrors;
}
