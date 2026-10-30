"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import ScrollVideoHero from "./components/ScrollVideoHero";
import QuickOverview from "./components/QuickOverview";
import { getReturnToCompletedHome } from "./homeState";

export default function HomePanel() {
  const [heroCompleted, setHeroCompleted] = useState(false);

  useEffect(() => {
    if (getReturnToCompletedHome()) {
      setHeroCompleted(true);
    }
  }, []);

  return (
    <main className="w-full min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 transition-colors duration-500">
      <h1 className="sr-only">
        MCPA Construction and Supply — Design and Build Contractor, Custom House Construction, Build Now Pay Later, and Construction Supply in Plaridel, Bulacan, Metro Manila, and Central Luzon
      </h1>

      {/* 0. Globally Fixed Client Navbar */}
      <ClientNavbar isCompleted={heroCompleted} />

      {/* 1. Interactive 3-Scroll Video Build Hero Section (400vh) */}
      <ScrollVideoHero onCompletionChange={setHeroCompleted} />

      {/* 2. Overview & Service Showcases */}
      <QuickOverview />
    </main>
  );
}
