/**
 * Centralized Projects Helper and Canonical Initial Projects
 * Ensures project lists across the frontend (showcase, admin, etc.)
 * maintain strict uniqueness to prevent duplicate React rendering keys.
 */

export const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Meridian Modern Residence",
    location: "Plaridel, Bulacan",
    year: "2024",
    category: "Residential",
    description:
      "Two-storey contemporary home with a spacious second-floor balcony, reinforced concrete framing, perimeter fence, and complete turnkey finishing.",
    images: [
      "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1785746730462-74049651fa26?w=1200&h=800&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
  {
    id: 2,
    name: "Tabang Commercial Complex",
    location: "Plaridel, Bulacan",
    year: "2024",
    category: "Commercial",
    description:
      "Commercial facility and supply yard featuring high-spec structural steel trusses, modern storefront facades, and heavy-duty logistics access.",
    images: [
      "https://images.unsplash.com/photo-1706164971302-e30c0640cc3b?w=800&h=1200&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=800&h=1200&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
  {
    id: 3,
    name: "Grand Royale Executive Villa",
    location: "Malolos, Bulacan",
    year: "2023",
    category: "Luxury Villa",
    description:
      "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 5-year structural warranty.",
    images: [
      "https://images.unsplash.com/photo-1762811054947-605b20298615?w=800&h=600&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
  {
    id: 4,
    name: "Pampanga Zen Sanctuary",
    location: "San Fernando, Pampanga",
    year: "2023",
    category: "Modern Zen",
    description:
      "Tropical minimalist residence with high-ceiling living zones, climate-resilient roof overhangs, and funded via our Build Now, Pay Later program.",
    images: [
      "https://images.unsplash.com/photo-1657346088167-b982455bf29a?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
  {
    id: 5,
    name: "North Industrial Logistics Hub",
    location: "Guiguinto, Bulacan",
    year: "2024",
    category: "Commercial",
    description:
      "Heavy-duty commercial warehouse with reinforced concrete flooring, wide open storage bays, and built using our dedicated in-house materials.",
    images: [
      "https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=1400&h=700&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1400&h=700&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
  {
    id: 6,
    name: "Skyline Contemporary Residence",
    location: "Quezon City, Metro Manila",
    year: "2023",
    category: "Residential",
    description:
      "Modern multi-level urban residence with earthquake-tested structural framing, spacious balcony views, and complete municipal building permits.",
    images: [
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format",
    ],
    isAdminAdded: false,
  },
];

/**
 * Normalizes a title for deduplication comparison (ignores "The", "MCPA", casing, punctuation).
 */
export function normalizeProjectName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/^(the|mcpa)\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Deduplicates and merges projects from a primary source (e.g. backend API or localStorage)
 * with fallback projects (canonical INITIAL_PROJECTS).
 *
 * Guarantees that:
 * 1. No two projects share the same normalized name.
 * 2. No two projects share the same id.
 * 3. Every project has a strictly unique `id` for React rendering keys.
 */
export function deduplicateProjects(primaryProjects = [], fallbackProjects = []) {
  const seenIds = new Set();
  const seenNames = new Set();
  const merged = [];

  const addProject = (project) => {
    if (!project || typeof project !== "object") return;

    const rawId = project.id ?? project.project_id;
    const strId = rawId !== undefined && rawId !== null ? String(rawId) : null;
    const normName = normalizeProjectName(project.name);

    // Skip if identical ID or title was already incorporated
    if (strId && seenIds.has(strId)) {
      return;
    }
    if (normName && seenNames.has(normName)) {
      return;
    }

    if (strId) seenIds.add(strId);
    if (normName) seenNames.add(normName);

    merged.push({
      ...project,
      id: rawId ?? `proj-${merged.length + 1}`,
      isAdminAdded: Boolean(project.isAdminAdded ?? project.is_admin_added),
    });
  };

  if (Array.isArray(primaryProjects)) {
    primaryProjects.forEach(addProject);
  }
  if (Array.isArray(fallbackProjects)) {
    fallbackProjects.forEach(addProject);
  }

  // Hard safety invariant: guarantee that even in bizarre data edge cases,
  // every returned item has a strictly distinct id attribute.
  const uniqueKeySet = new Set();
  return merged.map((p, idx) => {
    let finalId = p.id;
    if (uniqueKeySet.has(String(finalId))) {
      finalId = `${p.id}_dup_${idx}`;
    }
    uniqueKeySet.add(String(finalId));
    return { ...p, id: finalId };
  });
}
