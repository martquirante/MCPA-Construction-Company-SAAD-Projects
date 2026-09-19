"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "./ProjectCard";
import ScrollMorph from "../../shared/ScrollMorph";
import { INITIAL_PROJECTS, deduplicateProjects } from "../../shared/projectsHelper";

export default function PortfolioSection({
  onSelectProjectForInquiry,
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeCategory, setActiveCategory] = useState("All");

  // Load projects from localStorage and backend API with strict deduplication
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      // 1. Instant local hydration & deduplication
      try {
        const saved = localStorage.getItem("mcpa_portfolio_projects");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const deduplicated = deduplicateProjects(parsed, INITIAL_PROJECTS);
            if (isMounted) {
              setProjects(deduplicated);
            }
            // Self-heal localStorage so duplicated IDs are cleaned up
            localStorage.setItem("mcpa_portfolio_projects", JSON.stringify(deduplicated));
          }
        }
      } catch (err) {
        console.warn("Could not load stored projects:", err);
      }

      // 2. Fetch fresh backend projects if available
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.projects) && data.projects.length > 0) {
            const formatted = data.projects.map((p) => ({
              id: p.project_id || p.id,
              name: p.name,
              location: p.location,
              year: p.year,
              category: p.category,
              description: p.description,
              images: p.images || [],
              isAdminAdded: Boolean(p.is_admin_added),
            }));
            const deduplicated = deduplicateProjects(formatted, INITIAL_PROJECTS);
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

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInquire = (project) => {
    router.push(`/book?style=${encodeURIComponent(project.name)}`);
  };

  const categories = ["All", "Residential", "Commercial", "Luxury Villa", "Modern Zen"];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter(
          (p) =>
            p.category?.toLowerCase() === activeCategory.toLowerCase() ||
            (activeCategory === "Residential" && p.category?.toLowerCase().includes("residential"))
        );

  return (
    <section id="projects" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <ScrollMorph variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-600 dark:text-amber-400 mb-3">
            Portfolio · Selected Works
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

        {/* Category Filter Pills */}
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
      </ScrollMorph>

      {/* Projects Grid: Clean client showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Render Project Cards with Varied Alternating 3D ScrollMorph */}
        {filteredProjects.map((project, idx) => {
          const cardVariant =
            idx % 3 === 0
              ? "fan-left"
              : idx % 3 === 1
              ? "isometric-pop"
              : "fan-right";

          return (
            <ScrollMorph
              key={project.id ?? `project-${idx}`}
              variant={cardVariant}
              delay={(idx % 3) * 130}
              duration={800}
              className="h-full"
            >
              <ProjectCard
                project={project}
                onInquire={handleInquire}
              />
            </ScrollMorph>
          );
        })}
      </div>
    </section>
  );
}
