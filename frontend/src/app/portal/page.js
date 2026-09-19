"use client";

import ClientNavbar from "@/modules/shared/ClientNavbar";

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col transition-colors duration-500">
      {/* Top Sticky Navigation */}
      <ClientNavbar isCompleted={true} />

      {/* Clean Blank Space with only Client Portal text */}
      <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-widest text-neutral-950 dark:text-white">
          Client Portal
        </h1>
      </main>
    </div>
  );
}
