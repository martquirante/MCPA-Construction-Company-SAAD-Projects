"use client";

import { useState } from "react";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import ScrollVideoHero from "./components/ScrollVideoHero";
import QuickOverview from "./components/QuickOverview";
import { getReturnToCompletedHome } from "./homeState";

export default function HomePanel() {
  const isReturning = getReturnToCompletedHome();
  const [heroCompleted, setHeroCompleted] = useState(isReturning);

  return (
    <main className="w-full min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 transition-colors duration-500">
      {/* 0. Globally Fixed Client Navbar */}
      <ClientNavbar key={heroCompleted ? "completed" : "building"} isCompleted={heroCompleted} />

      {/* 1. Interactive 3-Scroll Video Build Hero Section (400vh) */}
      <ScrollVideoHero onCompletionChange={setHeroCompleted} />

      {/* 2. Overview & Service Showcases */}
      <QuickOverview />
    </main>
  );
}
