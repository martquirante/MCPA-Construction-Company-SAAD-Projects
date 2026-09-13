"use client";

import { useState } from "react";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import ScrollVideoHero from "./components/ScrollVideoHero";
import QuickOverview from "./components/QuickOverview";

export default function HomePanel() {
  const [heroCompleted, setHeroCompleted] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-500">
      {/* 0. Globally Fixed Client Navbar */}
      <ClientNavbar isCompleted={heroCompleted} />

      {/* 1. Interactive Scroll-to-Build Hero Section (600vh) */}
      <ScrollVideoHero onCompletionChange={setHeroCompleted} />

      {/* 2. Overview & Service Showcases Unlocked After Completion */}
      <QuickOverview />
    </main>
  );
}
