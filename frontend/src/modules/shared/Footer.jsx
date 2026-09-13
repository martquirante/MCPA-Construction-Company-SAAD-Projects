"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollMorph from "./ScrollMorph";
import {
  ArrowRightIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  GoogleMapsPinIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowUpIcon,
} from "./Icons";

export default function Footer() {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmailInput("");
      }, 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <footer
      id="contact-section"
      className="relative bg-neutral-100 dark:bg-[#080a0e] text-neutral-800 dark:text-neutral-300 border-t border-neutral-200 dark:border-white/10 transition-colors duration-500 overflow-hidden font-sans"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-48 bg-radial from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none blur-2xl" />

      {/* 1. PRE-FOOTER TRUST & ACCREDITATION RIBBON */}
      <ScrollMorph variant="curtain-wipe" duration={750} className="border-b border-neutral-200 dark:border-white/10 bg-neutral-200/40 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-neutral-200 dark:divide-white/10">
            <div className="px-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold">
                Direct Supply
              </p>
              <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white mt-0.5">
                In-House Materials & Aggregates
              </p>
            </div>
            <div className="px-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold">
                Project Delivery
              </p>
              <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white mt-0.5">
                Full-Service Design & Build
              </p>
            </div>
            <div className="px-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold">
                Financing Programs
              </p>
              <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white mt-0.5">
                Build Now, Pay Later (Titled Lot) & Pag-IBIG
              </p>
            </div>
            <div className="px-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold">
                Engineering Standard
              </p>
              <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white mt-0.5">
                Signed & Sealed Plans · Earthquake & Typhoon Ready
              </p>
            </div>
          </div>
        </div>
      </ScrollMorph>

      {/* 2. MAIN 4-COLUMN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          
          {/* COLUMN 1: BRAND PROFILE & HERITAGE (4 cols) */}
          <ScrollMorph variant="fan-left" delay={0} duration={800} className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link
                href="/"
                onClick={(e) => {
                  if (typeof window !== "undefined" && window.location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    window.history.replaceState(null, "", "/");
                  }
                }}
                className="inline-block mb-5 group"
              >
                <div className="relative w-48 sm:w-56 h-12 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/assets/mcpa-logo.png"
                    alt="MCPA Construction and Supply"
                    fill
                    className="object-contain object-left block dark:hidden"
                    sizes="220px"
                  />
                  <Image
                    src="/assets/logo-white.png"
                    alt="MCPA Construction and Supply"
                    fill
                    className="object-contain object-left hidden dark:block"
                    sizes="220px"
                  />
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mb-6 font-light">
                Looking to turn your ideas into reality? MCPA Construction and Supply is a full-service design and build contractor based in Plaridel, Bulacan. We specialize in custom residential homes, modern commercial facilities, warehouse structures, signed and sealed engineering plans, and in-house construction supplies across Bulacan, Metro Manila, and Central Luzon.
              </p>

              {/* Status Badge with Google Maps Link */}
              <a
                href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-medium mb-6 transition-all group cursor-pointer"
                title="View MCPA Headquarters in Google Maps"
              >
                <GoogleMapsPinIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                <span>Design & Build Contractor · Plaridel, Bulacan</span>
              </a>
            </div>

            {/* Social Media Links */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
                Official Social Channels
              </p>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 hover:border-blue-500/60 hover:bg-blue-500/10 text-neutral-800 dark:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  aria-label="Facebook: MCPA Construction and Supply"
                  title="Facebook: MCPA Construction and Supply"
                >
                  <FacebookIcon className="w-5 h-5 rounded-full" />
                </a>
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/mcpa.constructionandsupply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 hover:border-pink-500/60 hover:bg-pink-500/10 text-neutral-800 dark:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  aria-label="Instagram: @mcpa.constructionandsupply"
                  title="Instagram: @mcpa.constructionandsupply"
                >
                  <InstagramIcon className="w-5 h-5 rounded-md" />
                </a>
                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@mcpa.construction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-neutral-800 dark:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs"
                  aria-label="TikTok: @mcpa.construction"
                  title="TikTok: @mcpa.construction"
                >
                  <TikTokIcon className="w-5 h-5 rounded-full" />
                </a>
              </div>
            </div>
          </ScrollMorph>

          {/* COLUMN 2: QUICK NAVIGATION (2 cols) */}
          <ScrollMorph variant="fade-up" delay={120} duration={800} className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  onClick={(e) => {
                    if (typeof window !== "undefined" && window.location.pathname === "/") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      window.history.replaceState(null, "", "/");
                    }
                  }}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Selected Works</span>
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Services</span>
                </Link>
              </li>
              <li>
                <Link href="/process" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Our Process</span>
                </Link>
              </li>
              <li>
                <Link href="/book" className="text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group font-medium">
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Book Consultation</span>
                </Link>
              </li>
              <li>
                <Link href="/portal" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRightIcon className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span>Client Portal</span>
                </Link>
              </li>
            </ul>
          </ScrollMorph>

          {/* COLUMN 3: SERVICES & SUPPLY CAPABILITIES (3 cols) */}
          <ScrollMorph variant="fade-up" delay={220} duration={800} className="lg:col-span-3">
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold mb-4">
              Capabilities & Supply
            </p>
            <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/services" className="flex items-center justify-between group">
                  <span>Custom Residential Design & Build</span>
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500">01</span>
                </Link>
              </li>
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/services" className="flex items-center justify-between group">
                  <span>Commercial & Industrial Warehouses</span>
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500">02</span>
                </Link>
              </li>
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/services" className="flex items-center justify-between group">
                  <span>Signed & Sealed Plans & Permits</span>
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500">03</span>
                </Link>
              </li>
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/services" className="flex items-center justify-between group">
                  <span>House Renovations & Fit-Outs</span>
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500">04</span>
                </Link>
              </li>
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/services" className="flex items-center justify-between group">
                  <span>Construction Supply Logistics</span>
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500">05</span>
                </Link>
              </li>
              <li className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                <Link href="/book" className="flex items-center justify-between group text-amber-600 dark:text-amber-400 font-medium">
                  <span>Build Now, Pay Later (Titled Lot)</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-500">BNPL</span>
                </Link>
              </li>
            </ul>
          </ScrollMorph>

          {/* COLUMN 4: SITE OFFICE & CONTACT INQUIRIES (3 cols) */}
          <ScrollMorph variant="fan-right" delay={320} duration={800} className="lg:col-span-3">
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-semibold mb-4">
              Site Office & Contact
            </p>
            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-normal">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1">
                  Headquarters & Office
                </p>
                <a
                  href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-800 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 mt-0.5 inline-flex items-start gap-2 transition-colors group cursor-pointer"
                  title="Open MCPA Headquarters in Google Maps"
                >
                  <GoogleMapsPinIcon className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0 mt-0.5" />
                  <span className="group-hover:underline">2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines</span>
                </a>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                  Direct Mobile / Viber
                </p>
                <a
                  href="tel:+639497758239"
                  className="text-neutral-900 dark:text-neutral-200 hover:text-amber-600 dark:hover:text-amber-400 text-sm block mt-0.5 transition-colors font-medium tabular-nums"
                >
                  (0949) 775 8239
                </a>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                  Available for Calls, SMS &amp; Viber
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                  Official Email
                </p>
                <a
                  href="mailto:mcpa.construction@gmail.com"
                  className="text-amber-600 dark:text-amber-400 hover:underline text-xs"
                >
                  mcpa.construction@gmail.com
                </a>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                  Operating Hours
                </p>
                <p className="text-neutral-700 dark:text-neutral-300 text-xs">
                  Monday – Saturday: 8:00 AM – 5:00 PM PST
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
                  Official Channels
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <a
                    href="https://www.facebook.com/MCPA.ConstructionandSupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <FacebookIcon className="w-5 h-5 rounded-full shadow-xs" />
                    </div>
                    <span className="font-mono truncate">/MCPA.ConstructionandSupply</span>
                  </a>
                  <a
                    href="https://www.instagram.com/mcpa.constructionandsupply/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-white transition-colors group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <InstagramIcon className="w-5 h-5 rounded-md shadow-xs" />
                    </div>
                    <span className="font-mono truncate">@mcpa.constructionandsupply</span>
                  </a>
                  <a
                    href="https://www.tiktok.com/@mcpa.construction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-white transition-colors group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <TikTokIcon className="w-5 h-5 rounded-full shadow-xs" />
                    </div>
                    <span className="font-mono truncate">@mcpa.construction</span>
                  </a>
                </div>
              </div>

              {/* Newsletter / Project Briefing Sign Up */}
              <div className="pt-2">
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <label htmlFor="footer-newsletter" className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Project Briefings & Updates
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="footer-newsletter"
                      type="email"
                      required
                      placeholder="Enter client email..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                      title="Subscribe to briefings"
                    >
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {subscribed && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono animate-fade-in inline-flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Subscribed to MCPA Briefings.</span>
                    </p>
                  )}
                </form>
              </div>
            </div>
          </ScrollMorph>
        </div>
      </div>

      {/* 3. SUB-FOOTER LEGAL & UTILITY BAR */}
      <div className="border-t border-neutral-200 dark:border-white/10 bg-neutral-200/40 dark:bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-600 dark:text-neutral-500 font-mono">
          {/* Left: Copyright */}
          <div>
            © {new Date().getFullYear()} MCPA CONSTRUCTION AND SUPPLY. ALL RIGHTS RESERVED.
          </div>

          {/* Center: Legal & System Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <a
              href="https://maps.app.goo.gl/hPB6X66NdhViSvCp7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 group cursor-pointer shadow-xs"
              title="Open MCPA Headquarters in Google Maps"
            >
              {/* Live operational radar beacon */}
              <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>

              <span className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Headquarters
              </span>
              <span className="text-neutral-400 dark:text-neutral-600">·</span>
              <span className="text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                Plaridel, Bulacan
              </span>

              <GoogleMapsPinIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 group-hover:scale-110 transition-all shrink-0 ml-0.5" />
            </a>

            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">|</span>

            <Link href="#contact-section" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <Link href="#contact-section" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Terms of Engagement
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <Link href="#contact-section" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Safety Code
            </Link>
          </div>

          {/* Right: Back to Top */}
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer group"
            >
              <span>BACK TO TOP</span>
              <ArrowUpIcon className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
