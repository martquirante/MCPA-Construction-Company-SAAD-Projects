"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import PreConsultationBooking from "@/modules/book/components/PreConsultationBooking";
import Footer from "@/modules/shared/Footer";
import { ArrowLeftIcon } from "@/modules/shared/Icons";
import { setReturnToCompletedHome } from "@/modules/home/homeState";

function BookingContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-500">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-200 dark:border-white/10 bg-white/85 dark:bg-black/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setReturnToCompletedHome(true)}
            className="flex items-center gap-3 group focus:outline-none select-none"
            aria-label="MCPA Construction and Supply Home"
          >
            <div className="relative w-36 sm:w-44 h-9">
              {/* Light Mode Logo */}
              <Image
                src="/assets/mcpa-logo.png"
                alt="MCPA Construction and Supply"
                fill
                priority
                className="object-contain object-left block dark:hidden"
                sizes="180px"
              />
              {/* Dark Mode Logo */}
              <Image
                src="/assets/logo-white.png"
                alt="MCPA Construction and Supply"
                fill
                priority
                className="object-contain object-left hidden dark:block"
                sizes="180px"
              />
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={() => setReturnToCompletedHome(true)}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/10 hover:border-neutral-900 dark:hover:border-white/30 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Booking Form */}
      <main className="flex-1 flex flex-col justify-center py-8">
        <PreConsultationBooking />
      </main>

      {/* Architectural Multi-Column Footer */}
      <Footer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#09090b] flex items-center justify-center text-neutral-900 dark:text-white font-mono">Loading Booking Engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
