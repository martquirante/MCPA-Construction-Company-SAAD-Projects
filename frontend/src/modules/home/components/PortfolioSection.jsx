"use client";

import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import ScrollMorph from "../../shared/ScrollMorph";

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Meridian Modern Residence",
    location: "Plaridel, Bulacan",
    year: "2024",
    category: "Residential",
    description: "Two-storey contemporary home with cantilevered balcony, reinforced concrete framing, perimeter fence, and complete turnkey architectural finishing.",
    images: [
      "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1785746730462-74049651fa26?w=1200&h=800&fit=crop&auto=format",
    ],
  },
  {
    id: 2,
    name: "Tabang Commercial Complex",
    location: "Plaridel, Bulacan",
    year: "2024",
    category: "Commercial",
    description: "Commercial facility and supply yard featuring high-spec structural steel trusses, modern storefront facades, and heavy-duty logistics access.",
    images: [
      "https://images.unsplash.com/photo-1706164971302-e30c0640cc3b?w=800&h=1200&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=800&h=1200&fit=crop&auto=format",
    ],
  },
  {
    id: 3,
    name: "Grand Royale Executive Villa",
    location: "Malolos, Bulacan",
    year: "2023",
    category: "Luxury Villa",
    description: "Custom two-storey luxury home built with signed & sealed plans, bespoke granite finishes, premium fixtures, and a 5-year structural warranty.",
    images: [
      "https://images.unsplash.com/photo-1762811054947-605b20298615?w=800&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 4,
    name: "Pampanga Zen Sanctuary",
    location: "San Fernando, Pampanga",
    year: "2023",
    category: "Modern Zen",
    description: "Tropical minimalist residence with high-ceiling living zones, climate-resilient roof overhangs, and funded via our Build Now, Pay Later program.",
    images: [
      "https://images.unsplash.com/photo-1657346088167-b982455bf29a?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 5,
    name: "North Industrial Logistics Hub",
    location: "Guiguinto, Bulacan",
    year: "2024",
    category: "Commercial",
    description: "Heavy-duty commercial warehouse with high-load concrete flooring, post-tensioned spans, and direct batch-tested construction supply materials.",
    images: [
      "https://images.unsplash.com/photo-1783490244502-cd5f236e3780?w=1400&h=700&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1400&h=700&fit=crop&auto=format",
    ],
  },
  {
    id: 6,
    name: "Skyline Contemporary Residence",
    location: "Quezon City, Metro Manila",
    year: "2023",
    category: "Residential",
    description: "Modern multi-level urban residence with seismic-certified structural engineering, panoramic balcony views, and complete LGU building permits.",
    images: [
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=800&h=600&fit=crop&auto=format",
    ],
  },
];

export default function PortfolioSection({
  onSelectProjectForInquiry,
}) {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeCategory, setActiveCategory] = useState("All");

  // Load any admin uploaded projects stored in localStorage so client showcase includes them
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mcpa_portfolio_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const adminItems = parsed.filter((p) => p.isAdminAdded);
          setProjects([...adminItems, ...INITIAL_PROJECTS]);
        }
      }
    } catch (err) {
      console.warn("Could not load stored projects:", err);
    }
  }, []);

  const handleInquire = (project) => {
    if (typeof window !== "undefined") {
      window.location.href = `/book?style=${encodeURIComponent(project.name)}`;
    }
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
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal">
            Every project represents a distinct vision realized with full structural and aesthetic integrity.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide uppercase transition-all duration-300 ${
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
              key={project.id}
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
