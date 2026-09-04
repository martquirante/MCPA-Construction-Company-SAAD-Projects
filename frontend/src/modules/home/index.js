"use client";

import ScrollVideoHero from "./components/ScrollVideoHero";
import QuickOverview from "./components/QuickOverview";

export default function HomePanel() {
  return (
    <main className="w-full min-h-screen bg-[#f8f7f5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-500">
      {/* 1. Interactive Scroll-to-Build Hero Section (600vh) */}
      <ScrollVideoHero />

      {/* 2. Overview & Service Showcases Unlocked After Completion */}
      <QuickOverview />
    </main>
  );
}
