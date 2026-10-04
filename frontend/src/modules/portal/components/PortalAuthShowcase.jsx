"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ProjectDetailsModal from "@/modules/home/components/ProjectDetailsModal";
import { ChevronRightIcon } from "@/modules/shared/Icons";
import { useLanguage } from "@/modules/shared/LanguageContext";
import { PORTAL_TRANSLATIONS } from "../data/portalTranslations";

// Dedicated Vector Icon Renderer for Scattered Background Icons
function ShowcaseVectorIcon({ iconType, className }) {
  switch (iconType) {
    case "crane":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="10" y1="22" x2="10" y2="4" strokeWidth="2" />
          <g className="animate-crane-jib">
            <line x1="4" y1="6" x2="22" y2="6" strokeWidth="2" stroke="currentColor" />
            <polygon points="10,2 14,2 12,6" fill="currentColor" />
            <line x1="18" y1="6" x2="18" y2="12" strokeWidth="1.5" strokeDasharray="1.5 1.5" stroke="currentColor" />
            <circle cx="18" cy="13.5" r="1.5" fill="currentColor" />
          </g>
        </svg>
      );
    case "compass":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="4" r="1.5" />
          <path d="M12 5.5 L6 20" />
          <path d="M12 5.5 L18 20" />
          <path d="M8.5 14 A 6 6 0 0 0 15.5 14" strokeDasharray="2 2" stroke="currentColor" />
          <circle cx="6" cy="20" r="1" fill="currentColor" />
          <circle cx="18" cy="20" r="1" fill="currentColor" />
        </svg>
      );
    case "helmet":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 14 A 9 9 0 0 1 21 14 L22 17 L2 17 Z" fill="currentColor" fillOpacity="0.2" />
          <line x1="2" y1="17" x2="22" y2="17" strokeWidth="2" />
          <path d="M10 5 L10 14" strokeWidth="1.8" />
          <path d="M14 5 L14 14" strokeWidth="1.8" />
          <circle cx="12" cy="4" r="1" fill="currentColor" />
        </svg>
      );
    case "seal":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" strokeDasharray="2 2" stroke="currentColor" />
          <circle cx="12" cy="12" r="6" />
          <path d="M12 8 L13.2 10.8 L16.2 11.1 L13.9 13.1 L14.6 16 L12 14.5 L9.4 16 L10.1 13.1 L7.8 11.1 L10.8 10.8 Z" fill="currentColor" />
        </svg>
      );
    case "blueprint":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.1" />
          <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" />
          <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" />
          <line x1="7" y1="16" x2="17" y2="16" strokeDasharray="2 2" />
          <rect x="13" y="10" width="4" height="4" stroke="currentColor" />
        </svg>
      );
    case "ruler":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 21 L21 3 L21 21 Z" fill="currentColor" fillOpacity="0.12" />
          <path d="M8 18 L16 10 L16 18 Z" stroke="currentColor" />
          <line x1="6" y1="21" x2="6" y2="18" />
          <line x1="10" y1="21" x2="10" y2="17" />
          <line x1="14" y1="21" x2="14" y2="18" />
          <line x1="18" y1="21" x2="18" y2="17" />
        </svg>
      );
    case "beam":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5 L20 5 M4 19 L20 19 M12 5 L12 19" strokeWidth="2.5" />
          <circle cx="8" cy="5" r="1" fill="currentColor" />
          <circle cx="16" cy="5" r="1" fill="currentColor" />
          <circle cx="8" cy="19" r="1" fill="currentColor" />
          <circle cx="16" cy="19" r="1" fill="currentColor" />
        </svg>
      );
    case "cube3d":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2 L20 7 L12 12 L4 7 Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M4 7 L4 17 L12 22 L12 12 Z" />
          <path d="M20 7 L20 17 L12 22 Z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "theodolite":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="11" x2="5" y2="22" strokeWidth="2" />
          <line x1="12" y1="11" x2="19" y2="22" strokeWidth="2" />
          <line x1="12" y1="11" x2="12" y2="22" strokeDasharray="2 2" stroke="currentColor" />
          <rect x="9" y="7" width="6" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
          <line x1="6" y1="6" x2="18" y2="6" strokeWidth="2.5" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        </svg>
      );
    case "drone":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
          <line x1="5" y1="6" x2="10" y2="10" strokeWidth="1.5" />
          <line x1="19" y1="6" x2="14" y2="10" strokeWidth="1.5" />
          <line x1="5" y1="18" x2="10" y2="14" strokeWidth="1.5" />
          <line x1="19" y1="18" x2="14" y2="14" strokeWidth="1.5" />
          <circle cx="5" cy="6" r="2.5" stroke="currentColor" />
          <circle cx="19" cy="6" r="2.5" stroke="currentColor" />
          <circle cx="5" cy="18" r="2.5" stroke="currentColor" />
          <circle cx="19" cy="18" r="2.5" stroke="currentColor" />
        </svg>
      );
    case "tape":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="13" r="8" fill="currentColor" fillOpacity="0.15" />
          <circle cx="11" cy="13" r="3" stroke="currentColor" />
          <path d="M16 7 L22 7 L22 10" strokeWidth="2" />
          <line x1="18" y1="7" x2="18" y2="9" />
          <line x1="20" y1="7" x2="20" y2="9" />
        </svg>
      );
    default:
      return null;
  }
}

// Project title translations dictionary
const PROJECT_TITLE_TRANSLATIONS = {
  "Modern Contemporary Two-Storey Residence": "Modernong Kontemporaryong Dalawang-Palapag na Bahay",
  "La Residencia Duplex Project": "Proyektong Duplex sa La Residencia",
};

// 4 Architectural Vector Sets
const SCATTERED_ICON_SETS = [
  [
    { id: "crane", icon: "crane", title: "Tower Crane Jib", titleFil: "Jib ng Tower Crane", style: { top: "-6%", right: "4%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-amber-500", floatAnim: "animate-float-1" },
    { id: "beam", icon: "beam", title: "Structural Steel I-Beam", titleFil: "Bakal na I-Beam ng Istruktura", style: { top: "36%", left: "-3%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-600 dark:text-amber-400", floatAnim: "animate-float-2" },
    { id: "helmet", icon: "helmet", title: "PRC Safety Hard Hat", titleFil: "Hard Hat Pang-kaligtasan ng PRC", style: { top: "-8%", left: "6%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-3" },
    { id: "seal", icon: "seal", title: "PRC Engineering Licensure", titleFil: "Tatak ng Lisensya sa Inhinyeriya", style: { bottom: "-4%", left: "10%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-emerald-500", floatAnim: "animate-float-1" },
    { id: "compass", icon: "compass", title: "Drafting Divider Compass", titleFil: "Drafting Divider Compass", style: { top: "28%", right: "-2%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-500", floatAnim: "animate-float-2" },
    { id: "theodolite", icon: "theodolite", title: "Topographic Theodolite", titleFil: "Theodolite sa Pagsusukat ng Lupa", style: { bottom: "-2%", right: "8%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-neutral-400 dark:text-neutral-300", floatAnim: "animate-float-3" },
    { id: "cube", icon: "cube3d", title: "3D BIM Isometric Model", titleFil: "3D BIM Isometric Model", style: { top: "62%", right: "18%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-1" },
  ],
  [
    { id: "blueprint", icon: "blueprint", title: "5-Master Set Blueprints", titleFil: "5-Master Set ng Blueprint", style: { top: "-5%", right: "10%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-emerald-500", floatAnim: "animate-float-1" },
    { id: "seal", icon: "seal", title: "Official LGU Approval Seal", titleFil: "Opisyal na Tatak ng LGU", style: { top: "20%", right: "-3%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-amber-500", floatAnim: "animate-float-3" },
    { id: "ruler", icon: "ruler", title: "Drafting Triangle Set-Square", titleFil: "Drafting Triangle Set-Square", style: { top: "4%", right: "14%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-neutral-400 dark:text-neutral-300", floatAnim: "animate-float-1" },
    { id: "tape", icon: "tape", title: "Precision Measuring Tape", titleFil: "Medida sa Pagsusukat", style: { top: "26%", left: "0%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-3" },
    { id: "cube", icon: "cube3d", title: "3D BIM Isometric Model", titleFil: "3D BIM Isometric Model", style: { bottom: "6%", right: "2%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-emerald-500", floatAnim: "animate-float-3" },
    { id: "helmet", icon: "helmet", title: "PRC Safety Hard Hat", titleFil: "Hard Hat Pang-kaligtasan ng PRC", style: { top: "66%", left: "-4%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-2" },
    { id: "crane", icon: "crane", title: "Structural Tower Crane", titleFil: "Structural Tower Crane", style: { top: "56%", left: "-4%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-600 dark:text-amber-400", floatAnim: "animate-float-2" },
  ],
  [
    { id: "compass", icon: "compass", title: "Drafting Divider Compass", titleFil: "Drafting Divider Compass", style: { top: "34%", left: "-4%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-amber-400", floatAnim: "animate-float-2" },
    { id: "ruler", icon: "ruler", title: "Set-Square Ruler", titleFil: "Set-Square Ruler", style: { top: "-7%", left: "16%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-600 dark:text-amber-400", floatAnim: "animate-float-2" },
    { id: "helmet", icon: "helmet", title: "Civil Engineer Helmet", titleFil: "Helmet ng Civil Engineer", style: { top: "64%", right: "6%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-500", floatAnim: "animate-float-3" },
    { id: "crane", icon: "crane", title: "Tower Crane Jib", titleFil: "Jib ng Tower Crane", style: { bottom: "-5%", right: "-1%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-500", floatAnim: "animate-float-1" },
    { id: "beam", icon: "beam", title: "Structural Steel I-Beam", titleFil: "Bakal na I-Beam ng Istruktura", style: { top: "36%", left: "-3%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-600 dark:text-amber-400", floatAnim: "animate-float-2" },
    { id: "theodolite", icon: "theodolite", title: "Topographic Theodolite", titleFil: "Theodolite sa Pagsusukat ng Lupa", style: { bottom: "-2%", right: "8%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-neutral-400 dark:text-neutral-300", floatAnim: "animate-float-3" },
    { id: "drone", icon: "drone", title: "Aerial Site Survey Drone", titleFil: "Drone sa Pagsusuri ng Site", style: { top: "-7%", right: "26%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-amber-500", floatAnim: "animate-float-2" },
  ],
  [
    { id: "drone", icon: "drone", title: "Aerial Site Survey Drone", titleFil: "Drone sa Pagsusuri ng Site", style: { top: "-7%", right: "26%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-amber-500", floatAnim: "animate-float-2" },
    { id: "theodolite", icon: "theodolite", title: "Total Station Surveyor", titleFil: "Total Station Surveyor", style: { top: "38%", right: "-3%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-neutral-400 dark:text-neutral-300", floatAnim: "animate-float-1" },
    { id: "seal", icon: "seal", title: "3-Stage Quality Audit Seal", titleFil: "3-Stage Quality Audit Seal", style: { top: "-7%", left: "4%" }, size: "w-8 h-8 sm:w-9 sm:h-9", color: "text-emerald-500", floatAnim: "animate-float-3" },
    { id: "beam", icon: "beam", title: "Seismic Steel Column", titleFil: "Kolum na Bakal Laban sa Lindol", style: { bottom: "-6%", left: "48%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-1" },
    { id: "cube", icon: "cube3d", title: "Concrete Strength Test Cube", titleFil: "Cube sa Pagsubok ng Tibay ng Semento", style: { bottom: "6%", right: "14%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-500", floatAnim: "animate-float-3" },
    { id: "tape", icon: "tape", title: "Precision Measuring Tape", titleFil: "Medida sa Pagsusukat", style: { top: "14%", right: "0%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-400", floatAnim: "animate-float-2" },
    { id: "crane", icon: "crane", title: "Tower Crane Jib", titleFil: "Jib ng Tower Crane", style: { bottom: "-5%", right: "-1%" }, size: "w-7 h-7 sm:w-8 sm:h-8", color: "text-amber-500", floatAnim: "animate-float-1" },
  ],
];

// Stagger Pattern for 2 Project Cards (Alternates Left / Right Zigzag)
const CARD_POSITION_PATTERNS_2 = [
  [
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-10", floatAnim: "animate-float-1" },
    { offsetClass: "ml-6 sm:ml-16", zClass: "z-20", floatAnim: "animate-float-2" },
  ],
  [
    { offsetClass: "ml-7 sm:ml-18", zClass: "z-10", floatAnim: "animate-float-2" },
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-20", floatAnim: "animate-float-1" },
  ],
  [
    { offsetClass: "ml-3 sm:ml-10", zClass: "z-20", floatAnim: "animate-float-1" },
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-10", floatAnim: "animate-float-3" },
  ],
  [
    { offsetClass: "ml-1 sm:ml-3", zClass: "z-10", floatAnim: "animate-float-2" },
    { offsetClass: "ml-8 sm:ml-20", zClass: "z-20", floatAnim: "animate-float-1" },
  ],
];

// Stagger Pattern for 3 Project Cards
const CARD_POSITION_PATTERNS_3 = [
  [
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-10", floatAnim: "animate-float-1" },
    { offsetClass: "ml-5 sm:ml-14", zClass: "z-20", floatAnim: "animate-float-2" },
    { offsetClass: "ml-1 sm:ml-6", zClass: "z-10", floatAnim: "animate-float-3" },
  ],
  [
    { offsetClass: "ml-6 sm:ml-18", zClass: "z-10", floatAnim: "animate-float-2" },
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-20", floatAnim: "animate-float-1" },
    { offsetClass: "ml-7 sm:ml-20", zClass: "z-10", floatAnim: "animate-float-3" },
  ],
  [
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-10", floatAnim: "animate-float-3" },
    { offsetClass: "ml-7 sm:ml-18", zClass: "z-20", floatAnim: "animate-float-1" },
    { offsetClass: "ml-2 sm:ml-7", zClass: "z-10", floatAnim: "animate-float-2" },
  ],
  [
    { offsetClass: "ml-6 sm:ml-16", zClass: "z-10", floatAnim: "animate-float-2" },
    { offsetClass: "ml-0 sm:ml-2", zClass: "z-10", floatAnim: "animate-float-3" },
    { offsetClass: "ml-5 sm:ml-14", zClass: "z-20", floatAnim: "animate-float-1" },
  ],
];

// Default Real Projects from Database
const DEFAULT_PROJECTS = [
  {
    id: 7,
    name: "Modern Contemporary Two-Storey Residence",
    location: "Tagaytay, Cavite",
    category: "Residential",
    year: "2025",
    month: "April",
    status: "completed",
    description: "A modern residence constructed using heavy-duty full I-beam structural steel framing in Buena Vista Hills, Tagaytay, Cavite. The contract covers a complete design-and-build scope—from architectural and engineering blueprints to the turnkey turnover of the project. It features three bedrooms, three bathrooms, a powder room, a spacious living and dining area with a custom TV console and wall accents, a modular kitchen with a dedicated pantry and stock room, an outdoor lanai, a dirty kitchen, a service area, and a 2-car garage.",
    images: [
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999081087_5c55cf752012.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999081099_a48cbf78ba66.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999085530_99c99cdf6e75.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999085546_49e2cc0f823b.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999089666_42799e5ba057.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790999089668_0ec1b6568a18.jpg",
    ],
    lotArea: "250 sqm",
    floorArea: "240 sqm",
    bedrooms: "3 Bedrooms",
    bathrooms: "3 Toilet and Bath, 1 Powder Room",
    features: [
      "I-Beam Structural Steel Framing",
      "Complete Building Plans",
      "Turnkey Project Construction",
      "Open-Concept Living & Dining Area",
      "Modular Kitchen Cabinets",
      "Outdoor Lanai Area",
      "2-Car Garage"
    ],
    architecturalDetails: "Structural Full I-Beam Steel Framing, Signed & Sealed PRC Blueprints (Architectural, Structural, Electrical, Sanitary), High-Strength Reinforced Concrete Footings and Pedestals, Engineered for High Wind and Seismic Load Standards (Tagaytay Ridge Elevation), LGU Building and Occupancy Permit Compliant"
  },
  {
    id: 6,
    name: "La Residencia Duplex Project",
    location: "Calumpit, Bulacan",
    category: "Residential",
    year: "2024",
    month: "September",
    status: "completed",
    description: "A two-storey modern duplex residence located in La Residencia Subdivision, Calumpit, Bulacan. The project scope encompasses complete design and build services—from the preparation of architectural and engineering plans to full project turnover. It features 4 bedrooms, a spacious living and dining area, modular kitchen cabinets, modern wall accents, a dirty kitchen, and dedicated car parking.",
    images: [
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790918419253_95af38a2989c.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790918419262_8020f49eb7c8.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790918421972_36bffe743e73.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790918424565_471a2e8eeb5d.jpg",
      "https://mcpastorage.blob.core.windows.net/mcpa-portfolio/1790918427521_908aa08d83bf.jpg",
    ],
    lotArea: "108 sq.m",
    floorArea: "130 sq.m.",
    bedrooms: "4 Bedrooms",
    bathrooms: "2 Toilet and Bath, 2 Powder Rooms",
    features: [
      "Complete Architectural & Engineering Plans",
      "Turnkey Construction",
      "Duplex Structure",
      "4 Bedrooms",
      "Custom Modular Cabinets",
      "Dedicated Car Parking",
      "Formal & Dirty Kitchen",
      "Balcony Railings"
    ],
    architecturalDetails: "Signed & Sealed PRC Building Plans, LGU Building Permit Compliant, Reinforced Concrete Structure, Complete Electrical and Sanitary Engineering Layout, Standard Structural Load Safety Specifications"
  }
];

// Fisher-Yates True Random Shuffle Algorithm
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Builds dynamic switch slides with truly randomized real project selections
function buildProjectSlides(allProjects) {
  if (!allProjects || allProjects.length === 0) return [];

  // Truly randomize the master project pool across all available database projects
  const shuffledProjects = shuffleArray(allProjects);
  const count = shuffledProjects.length;
  // If 3+ projects exist, show 3 project cards per switch. If 2 exist, show 2 per switch.
  const cardsPerSwitch = count >= 3 ? 3 : 2;
  const totalSlides = 4;

  const slides = [];

  for (let i = 0; i < totalSlides; i++) {
    // Pick unique random projects from the catalog for this switch
    let selectedForThisSlide = [];
    if (count > cardsPerSwitch) {
      // Pick fresh distinct random projects from the full catalog (kahit more than 6 pa)
      const pool = shuffleArray(allProjects);
      selectedForThisSlide = pool.slice(0, cardsPerSwitch);
    } else {
      // When 2 projects exist, shuffle their order per slide
      selectedForThisSlide = shuffleArray(allProjects);
    }

    const cardItems = selectedForThisSlide.map((p, c) => {
      const pImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/assets/hero-residence-day.jpg"];
      // Pick a random perspective photo from the project gallery
      const randomImg = pImages[Math.floor(Math.random() * pImages.length)] || pImages[0];
      const lot = p.lotArea || p.lot_area || "250 sqm";
      const beds = p.bedrooms || "3 BR";

      return {
        id: `${p.id || c}-card-${i}-${c}-${Math.random().toString(36).substring(2, 6)}`,
        project: p,
        title: p.name,
        tag: `${p.category || "Residential"} · ${p.location}`,
        specs: `${lot} · ${beds}`,
        image: randomImg,
        fallbackImage: "/assets/hero-residence-day.jpg",
      };
    });

    const cardPositions =
      cardsPerSwitch === 3
        ? CARD_POSITION_PATTERNS_3[i % CARD_POSITION_PATTERNS_3.length]
        : CARD_POSITION_PATTERNS_2[i % CARD_POSITION_PATTERNS_2.length];

    slides.push({
      id: `switch-${i}`,
      theme: cardItems[0]?.title || "MCPA Architectural Project",
      tagline: `${cardItems[0]?.project?.location || "Bulacan"} · Design & Build`,
      items: cardItems,
      cardPositions,
      scatteredIcons: SCATTERED_ICON_SETS[i % SCATTERED_ICON_SETS.length],
    });
  }

  return slides;
}

export default function PortalAuthShowcase() {
  const { language } = useLanguage();
  const activeLang = language === "fil" ? "fil" : "en";
  const t = PORTAL_TRANSLATIONS[activeLang];

  // Slides state initialized with randomized real project slides ("pili ka randomly sa mga project")
  const [slides, setSlides] = useState(() => {
    return buildProjectSlides(DEFAULT_PROJECTS);
  });

  const [activeIdx, setActiveIdx] = useState(0);
  // Animation state: "idle" | "exiting" | "entering"
  const [animState, setAnimState] = useState("idle");
  // Interactive modal state for viewing full real project details (Image 1)
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch all projects from the full projects catalog (/api/projects) and randomize
  useEffect(() => {
    let isMounted = true;

    const loadProjectsData = async () => {
      // 1. Try local cache first for instant hydration
      try {
        const saved = localStorage.getItem("mcpa_portfolio_projects");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            const built = buildProjectSlides(parsed);
            if (built.length > 0) {
              setSlides(built);
            }
          }
        }
      } catch (e) {}

      // 2. Fetch fresh backend projects directly from PostgreSQL
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.projects) && data.projects.length > 0 && isMounted) {
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
              lotArea: p.lot_area || p.lotArea,
              floorArea: p.floor_area || p.floorArea,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              features: p.features || [],
              architecturalDetails: p.architectural_details || p.architecturalDetails,
            }));
            const built = buildProjectSlides(formatted);
            if (built.length > 0) {
              setSlides(built);
            }
          }
        }
      } catch (e) {
        // Fallback projects already in state
      }
    };

    loadProjectsData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Function to switch slides with smooth 3D spin & fade-in / fade-out
  const changeSlide = (nextIdx) => {
    if (animState !== "idle" || nextIdx === activeIdx) return;
    setAnimState("exiting");

    setTimeout(() => {
      setActiveIdx(nextIdx);
      setAnimState("entering");

      setTimeout(() => {
        setAnimState("idle");
      }, 50);
    }, 380);
  };

  // Automatic cycle every 4.8 seconds (pauses while modal is open)
  useEffect(() => {
    if (selectedProject || slides.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIdx + 1) % slides.length;
      changeSlide(next);
    }, 4800);

    return () => clearInterval(timer);
  }, [activeIdx, animState, selectedProject, slides.length]);

  const slide = slides[activeIdx] || slides[0];

  // Animation CSS classes for rotation, fade in/out
  const transitionClass =
    animState === "exiting"
      ? "opacity-0 -translate-y-3 scale-95 rotate-[-1.5deg] blur-[2px] transition-all duration-380 ease-in"
      : animState === "entering"
      ? "opacity-0 translate-y-3 scale-105 rotate-[1.5deg] transition-none"
      : "opacity-100 translate-y-0 scale-100 rotate-0 blur-none transition-all duration-500 ease-out";

  return (
    <div className="relative w-full max-w-lg lg:max-w-xl flex flex-col justify-center select-none py-1 -translate-y-2 sm:-translate-y-3 lg:-translate-y-4 transition-transform duration-300">
      {/* 1. BRAND HEADER */}
      <div className="mb-3 lg:mb-4">
        <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
          {/* Light mode: crisp black vector logo */}
          <Image
            src="/assets/mcpa-logo.svg"
            alt="MCPA Architectural Design & General Contractor"
            width={185}
            height={50}
            unoptimized
            className="block dark:hidden object-contain h-10 sm:h-11 lg:h-12 w-auto transition-all"
            priority
          />
          {/* Dark mode: 100% pure solid white vector logo */}
          <Image
            src="/assets/logo-white.svg"
            alt="MCPA Architectural Design & General Contractor"
            width={185}
            height={50}
            unoptimized
            className="hidden dark:block object-contain h-10 sm:h-11 lg:h-12 w-auto transition-all"
            priority
          />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.18] mb-1.5">
          {t.showcaseHeadline1} <br />
          <span className="text-neutral-800 dark:text-neutral-200">
            {t.showcaseHeadline2}
          </span>
        </h1>

        <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md">
          {t.showcaseDescription}
        </p>
      </div>

      {/* 2. DYNAMIC ROTATING & SPINNING CARDS CONTAINER */}
      <div className="relative min-h-[250px] sm:min-h-[265px] w-full max-w-lg flex flex-col justify-center">
        {/* Golden Curved Guideline Arc */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible opacity-70 dark:opacity-40"
          viewBox="0 0 460 300"
          fill="none"
        >
          <path
            d="M 50 50 C 170 50, 230 140, 150 205 S 250 280, 330 250"
            stroke="url(#amberGradientArcCompact)"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="amberGradientArcCompact" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Dynamic Animated Real Project Cards (2 or 3 projects per switch) */}
        <div className={`space-y-3.5 ${transitionClass}`}>
          {slide?.items &&
            slide.items.map((item, idx) => {
              const pos = slide.cardPositions?.[idx] || {
                offsetClass: idx === 0 ? "ml-0 sm:ml-2" : "ml-6 sm:ml-16",
                zClass: idx === 0 ? "z-10" : "z-20",
                floatAnim: idx === 0 ? "animate-float-1" : "animate-float-2",
              };

              const categoryRaw = item.project?.category || "Residential";
              const categoryLower = categoryRaw.toLowerCase();
              const categoryLabel =
                activeLang === "fil"
                  ? categoryLower.includes("commercial") || categoryLower.includes("komersyal")
                    ? t.showcaseCommercial
                    : categoryLower.includes("renov")
                    ? t.showcaseRenovation
                    : t.showcaseResidential
                  : categoryLower.includes("commercial")
                  ? t.showcaseCommercial
                  : categoryLower.includes("renov")
                  ? t.showcaseRenovation
                  : t.showcaseResidential;

              const locationText = item.project?.location || item.tag?.split("·")?.[1]?.trim() || "";
              const displayTag = locationText ? `${categoryLabel} · ${locationText}` : categoryLabel;

              const displaySpecs =
                activeLang === "fil"
                  ? item.specs
                      .replace(/(\d+)\s*(?:Bedrooms|Bedroom|BR)/gi, "$1 na Kwarto")
                      .replace(/Bedrooms/gi, t.showcaseBedrooms)
                      .replace(/Bedroom/gi, t.showcaseBedroomSingle)
                      .replace(/BR/gi, t.showcaseBedroomSingle)
                  : item.specs;

              const displayTitle =
                activeLang === "fil" && PROJECT_TITLE_TRANSLATIONS[item.title]
                  ? PROJECT_TITLE_TRANSLATIONS[item.title]
                  : item.title;

              return (
                <div
                  key={`${slide.id}-${item.id}-${idx}`}
                  className={`relative ${pos.zClass || "z-10"} ${pos.floatAnim || "animate-float-1"} ${pos.offsetClass || ""} transition-all duration-500`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProject(item.project)}
                    className="group inline-flex items-center gap-3.5 p-2.5 sm:p-3 pr-4 sm:pr-5 bg-white dark:bg-[#11141e] rounded-[18px] border border-neutral-200/90 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/30 backdrop-blur-xs hover:border-amber-500/60 hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.99] transition-all text-left cursor-pointer w-full max-w-[340px] sm:max-w-[375px]"
                  >
                    {/* Project Photo Thumbnail */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[12px] overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-white/5 shadow-2xs">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = item.fallbackImage;
                        }}
                      />
                    </div>

                    {/* Project Metadata & Title */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-0.5">
                        <span className="truncate max-w-[170px] uppercase tracking-wider">{displayTag}</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
                          <span>{t.showcaseViewInfo}</span>
                          <ChevronRightIcon className="w-3 h-3" />
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-white leading-tight truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {displayTitle}
                      </h4>

                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-mono text-[10px] truncate">{displaySpecs}</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
        </div>

        {/* =====================================================================
            SCATTERED PURE VECTOR ICONS (NO BACKGROUND)
            ===================================================================== */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {slide?.scatteredIcons &&
            slide.scatteredIcons.map((item, idx) => {
              const isExiting = animState === "exiting";
              const isEntering = animState === "entering";

              return (
                <div
                  key={`${slide.id}-${item.id}`}
                  style={{
                    ...item.style,
                    transitionDelay: isExiting ? `${idx * 25}ms` : `${idx * 35}ms`,
                  }}
                  className={`absolute transition-all duration-400 ${
                    isExiting
                      ? "rotate-[360deg] scale-0 opacity-0 blur-[1px] ease-in"
                      : isEntering
                      ? "rotate-[-180deg] scale-0 opacity-0 transition-none"
                      : "rotate-0 scale-100 opacity-100 ease-out"
                  }`}
                >
                  <div className={item.floatAnim}>
                    <div
                      className={`${item.color} filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)] dark:drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] transition-all duration-300`}
                      title={activeLang === "fil" && item.titleFil ? item.titleFil : (item.title || item.icon)}
                    >
                      <ShowcaseVectorIcon
                        iconType={item.icon}
                        className={`${item.size} transition-all duration-300`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. INTERACTIVE CAROUSEL DOT INDICATORS & TAGLINE */}
      <div className="mt-3 flex items-center justify-between max-w-sm text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => changeSlide(idx)}
              title={s.theme}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIdx === idx
                  ? "w-6 bg-amber-500 shadow-xs"
                  : "w-1.5 bg-neutral-300 dark:bg-white/20 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
        <span className="uppercase tracking-[0.2em] font-semibold text-[9px] truncate max-w-[190px]">
          {slide?.items?.[0]?.project?.location
            ? `${slide.items[0].project.location} · ${t.showcaseDesignAndBuild}`
            : slide?.tagline}
        </span>
      </div>

      {/* =========================================================================
          AUTHENTIC ARCHITECTURAL PROJECT DETAILS MODAL (Exact match to Image 1)
          ========================================================================= */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
