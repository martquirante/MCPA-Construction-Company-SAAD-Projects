"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  UserIcon,
  MenuIcon,
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "./Icons";

export default function ClientNavbar({ isCompleted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled beyond the hero section (600vh scroll travel in 700vh container)
      if (typeof window !== "undefined") {
        setScrolledPastHero(window.scrollY > window.innerHeight * 6.1);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/", active: true },
    { label: "Projects", href: "#projects" },
    { label: "Services", href: "#services" },
    { label: "Process", href: "#process" },
    { label: "Book Consultation", href: "/book" },
  ];

  const handleNavClick = (e, href) => {
    if (href === "/") {
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.replaceState(null, "", "/");
      }
    } else if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", href);
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-700 ease-out ${
          scrolledPastHero
            ? "bg-white/90 dark:bg-neutral-950/85 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 py-3 shadow-lg text-neutral-900 dark:text-white"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* 1. BRAND LOGO - ALWAYS VISIBLE (ROUTES CLEANLY TO /) */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className="flex items-center gap-3 group focus:outline-none select-none"
            aria-label="MCPA Construction and Supply Home"
          >
            <div className="relative w-36 sm:w-44 md:w-52 h-10 transition-transform duration-300 group-hover:scale-105">
              {scrolledPastHero ? (
                <>
                  <Image
                    src="/assets/mcpa-logo.png"
                    alt="MCPA Construction and Supply"
                    fill
                    priority
                    className="object-contain object-left block dark:hidden"
                    sizes="(max-width: 768px) 180px, 220px"
                  />
                  <Image
                    src="/assets/logo-white.png"
                    alt="MCPA Construction and Supply"
                    fill
                    priority
                    className="object-contain object-left hidden dark:block"
                    sizes="(max-width: 768px) 180px, 220px"
                  />
                </>
              ) : (
                <Image
                  src="/assets/logo-white.png"
                  alt="MCPA Construction and Supply"
                  fill
                  priority
                  className="object-contain object-left"
                  sizes="(max-width: 768px) 180px, 220px"
                />
              )}
            </div>
          </Link>

          {/* 2. CENTER NAVIGATION LINKS - REVEALS ONLY WHEN 100% COMPLETED */}
          <nav
            aria-label="Primary Navigation"
            className={`hidden md:flex items-center gap-8 transition-all duration-700 ease-out ${
              isCompleted
                ? "opacity-100 transform translate-y-0 pointer-events-auto"
                : "opacity-0 transform -translate-y-4 pointer-events-none"
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative py-1 text-sm font-medium tracking-wide transition-colors duration-200 ${
                  scrolledPastHero
                    ? link.active
                      ? "text-neutral-950 dark:text-white font-bold"
                      : "text-neutral-700 hover:text-amber-600 dark:text-neutral-300 dark:hover:text-amber-400"
                    : link.active
                    ? "text-white font-semibold"
                    : "text-neutral-300 hover:text-amber-400"
                }`}
              >
                {link.label}
                {/* Active indicator bar matching user mockup under 'Home' */}
                {link.active && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </Link>
            ))}
          </nav>

          {/* 3. RIGHT UTILITY ACTIONS (THEME TOGGLE + USER ACCOUNT) - REVEALS ONLY WHEN 100% COMPLETED */}
          <div
            className={`flex items-center gap-3 transition-all duration-700 ease-out ${
              isCompleted
                ? "opacity-100 transform translate-y-0 pointer-events-auto"
                : "opacity-0 transform -translate-y-4 pointer-events-none"
            }`}
          >
            {/* Theme Toggle (Light / Dark mode SVG) */}
            <ThemeToggle className={scrolledPastHero ? "text-neutral-800 dark:text-white" : "text-white hover:text-amber-400"} />

            {/* Client Portal / Account Icon Button */}
            <Link
              href="#client-portal"
              aria-label="Client Account Portal"
              title="Client Portal & Project Tracker"
              className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${
                scrolledPastHero
                  ? "text-neutral-700 hover:text-amber-600 hover:bg-neutral-100 dark:text-white/90 dark:hover:text-amber-400 dark:hover:bg-white/10"
                  : "text-white/90 hover:text-amber-400 hover:bg-white/10"
              }`}
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            {/* Mobile Menu Hamburger Toggle (hidden on desktop) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                scrolledPastHero
                  ? "text-neutral-800 hover:text-amber-600 hover:bg-neutral-100 dark:text-white dark:hover:text-amber-400 dark:hover:bg-white/10"
                  : "text-white hover:text-amber-400 hover:bg-white/10"
              }`}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 4. MOBILE DRAWER MENU */}
      <div
        className={`fixed inset-x-0 top-0 z-30 pt-24 pb-8 px-6 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-200 dark:border-white/10 shadow-2xl md:hidden transition-all duration-500 ease-in-out ${
          mobileMenuOpen && isCompleted
            ? "opacity-100 transform translate-y-0 pointer-events-auto"
            : "opacity-0 transform -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col space-y-4 text-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => {
                handleNavClick(e, link.href);
                setMobileMenuOpen(false);
              }}
              className={`text-lg font-medium tracking-wide py-2 transition-colors ${
                link.active
                  ? "text-amber-600 dark:text-amber-400 font-bold"
                  : "text-neutral-800 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-center gap-6">
            <ThemeToggle />
            <Link
              href="#client-portal"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400"
            >
              <UserIcon className="w-4 h-4" />
              <span>Client Portal</span>
            </Link>
          </div>

          {/* Mobile Social Links */}
          <div className="pt-3 flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/MCPA.ConstructionandSupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook: MCPA Construction and Supply"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-blue-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <FacebookIcon className="w-4 h-4 rounded-full" />
            </a>
            <a
              href="https://www.instagram.com/mcpa.constructionandsupply/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram: @mcpa.constructionandsupply"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-pink-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <InstagramIcon className="w-4 h-4 rounded-xs" />
            </a>
            <a
              href="https://www.tiktok.com/@mcpa.construction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok: @mcpa.construction"
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-cyan-500/50 text-neutral-800 dark:text-white transition-colors"
            >
              <TikTokIcon className="w-4 h-4 rounded-full" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
