"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import ProjectDetailsModal from "./ProjectDetailsModal";
import ScrollMorph from "../../shared/ScrollMorph";
import { ArrowRightIcon } from "../../shared/Icons";
import { deduplicateProjects, subscribeProjectsChange } from "../../shared/projectsHelper";

export default function PortfolioSection({
  isHomePage = false,
  onSelectProjectForInquiry,
}) {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);

  // Load projects purely from backend API with real-time sync
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      // 1. Instant local hydration from cached DB copy
      try {
        const saved = localStorage.getItem("mcpa_portfolio_projects");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            setProjects(deduplicateProjects(parsed));
          }
        }
      } catch (err) {
        console.warn("Could not load stored projects:", err);
      }

      // 2. Fetch fresh backend projects directly from PostgreSQL
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.projects)) {
            const formatted = data.projects.map((p) => ({
              id: p.project_id || p.id,
              name: p.name,
              location: p.location,
              year: p.year,
              month: p.month,
              category: p.category,
              status: p.status || "completed",
              description: p.description,
              images: p.images || [],
              isAdminAdded: Boolean(p.is_admin_added),
              isWebVisible: p.is_web_visible !== false,
              featuredOnHome: Boolean(p.featured_on_home),
              lotArea: p.lot_area,
              floorArea: p.floor_area,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              features: p.features || [],
              architecturalDetails: p.architectural_details,
            }));
            const deduplicated = deduplicateProjects(formatted);
            if (isMounted) {
              setProjects(deduplicated);
            }
            try {
              localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(deduplicated));
            } catch (e) {
              // Ignore storage errors
            }
          }
        }
      } catch (err) {
        // Backend offline or error; fallback / cached projects remain active
      }
    };

    loadProjects();

    // 3. Real-time synchronization subscription (cross-tab & window events)
    const unsubscribe = subscribeProjectsChange(() => {
      loadProjects();
    });

    // 4. Background revalidation polling (every 10 seconds for real-time live sync)
    const pollInterval = setInterval(() => {
      loadProjects();
    }, 10000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const handleInquire = (project) => {
    router.push(`/book?style=${encodeURIComponent(project.name)}`);
  };

  const visibleProjects = projects.filter((p) => p.isWebVisible !== false);

  const baseCategories = ["All", "Residential", "Commercial", "Luxury Villa", "Modern Zen"];
  // Dynamically include any custom categories added by admin via "Other"
  const categories = Array.from(
    new Set([
      ...baseCategories,
      ...visibleProjects.map((p) => p.category).filter(Boolean),
    ])
  );

  // On Home Page: limit to max 6 projects, prioritize admin-featured projects
  const displayProjects = (() => {
    let list = visibleProjects;

    if (activeCategory !== "All") {
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === activeCategory.toLowerCase() ||
          (activeCategory === "Residential" && p.category?.toLowerCase().includes("residential"))
      );
    }

    if (!isHomePage) {
      return list;
    }

    // On Home Page: Prioritize admin-picked featured projects, fill remaining up to 6
    const featured = list.filter((p) => p.featuredOnHome);
    const nonFeatured = list.filter((p) => !p.featuredOnHome);
    const combined = [...featured, ...nonFeatured];
    return combined.slice(0, 6);
  })();

  const count = displayProjects.length;

  // Auto-Layout: Balances cards across rows so NO single card is left alone at the bottom
  const getGridClasses = (n) => {
    if (n === 1) return "grid grid-cols-1 max-w-xl mx-auto gap-6 lg:gap-8";
    if (n === 2) return "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 lg:gap-8";
    if (n === 3) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto gap-6 lg:gap-8";
    if (n === 4) return "grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6 lg:gap-8"; // Symmetrical 2x2 grid
    if (n === 5) return "flex flex-wrap justify-center gap-6 lg:gap-8 max-w-7xl mx-auto";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto gap-6 lg:gap-8"; // 6 projects: 3x2 grid
  };

  const getCardWrapperClasses = (n, idx) => {
    if (n === 5) {
      return "w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-18px)] flex flex-col";
    }
    if (n === 3 && idx === 2) {
      return "w-full md:col-span-2 md:max-w-md md:mx-auto lg:col-span-1 lg:max-w-none flex flex-col";
    }
    return "w-full flex flex-col";
  };

  return (
    <section id="projects" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <ScrollMorph variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-600 dark:text-amber-400 mb-3">
            {isHomePage ? "Portfolio · Selected Works" : "Portfolio · Full Architecture Catalog"}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
            Built to{" "}
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Last Centuries
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
            Real structures built across Bulacan and Central Luzon. Each project reflects our commitment to structural excellence and transparent execution.
          </p>
        </div>

        {/* Category Filter Pills: Only shown on full /projects page, completely removed from Home Page */}
        {!isHomePage && (
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </ScrollMorph>

      {/* Projects Grid: Auto-balancing layout with responsive centering */}
      <div className={getGridClasses(count)}>
        {displayProjects.map((project, idx) => {
          const cardVariant =
            idx % 3 === 0
              ? "fan-left"
              : idx % 3 === 1
              ? "isometric-pop"
              : "fan-right";

          return (
            <div key={project.id ?? `project-${idx}`} className={getCardWrapperClasses(count, idx)}>
              <ScrollMorph
                variant={cardVariant}
                delay={(idx % 3) * 130}
                duration={800}
                className="h-full w-full"
              >
                <ProjectCard
                  project={project}
                  onInquire={handleInquire}
                  onOpenDetails={(p) => setSelectedProjectForModal(p)}
                />
              </ScrollMorph>
            </div>
          );
        })}
      </div>

      {/* Call to Action: Direct user to dedicated /projects page if on homepage */}
      {isHomePage && (
        <div className="mt-14 sm:mt-16 flex flex-col items-center justify-center text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-102 group cursor-pointer"
          >
            <span>Explore All Projects ({visibleProjects.length})</span>
            <ArrowRightIcon className="w-4 h-4 text-neutral-950 group-hover:translate-x-1.5 transition-transform" />
          </Link>
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            Curated showcase · Click to view full portfolio & architectural floor plans
          </p>
        </div>
      )}

      {/* Interactive Project Details Overlay Modal */}
      <ProjectDetailsModal
        project={selectedProjectForModal}
        isOpen={Boolean(selectedProjectForModal)}
        onClose={() => setSelectedProjectForModal(null)}
        onInquire={handleInquire}
      />
    </section>
  );
}
