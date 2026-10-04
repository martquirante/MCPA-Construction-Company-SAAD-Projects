"use client";

import React, { useState, useEffect } from "react";
import { CheckIcon, MailIcon, ShieldCheckIcon } from "@/modules/shared/Icons";

/**
 * ArchitecturalEntranceAnimation
 * 
 * High-tier, human-designed architectural onboarding animation.
 * 1.5-second (1500ms) calibrated sequence transitioning new clients into the portal.
 * 
 * Features authentic architectural & structural engineering motifs:
 * 1. Drafting Compass & CAD Grid (0ms - 500ms)
 * 2. Crane Hoist & Structural Steel I-Beam (500ms - 1000ms)
 * 3. Modern Villa Elevation & Gold Architectural Seal (1000ms - 1500ms)
 * 
 * Anti-vibe-coded: Editorial typography, precision drafting coordinates,
 * zero cheap cartoon cliparts or generic bouncing blobs.
 */
export default function ArchitecturalEntranceAnimation({
  clientName = "Valued Client",
  email = "",
  projectType = "Modern Residence",
  activeLang = "en",
  onComplete,
}) {
  const [phase, setPhase] = useState(1); // 1: Blueprint, 2: Structure, 3: Unlocked
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < 500) {
        setPhase(1);
      } else if (elapsed < 1000) {
        setPhase(2);
      } else {
        setPhase(3);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-[500px] bg-[#0a0d14] border border-amber-500/30 rounded-[28px] shadow-2xl shadow-amber-500/10 p-6 sm:p-7.5 overflow-hidden text-white flex flex-col justify-between min-h-[470px]">
        {/* 1. Architectural CAD Technical Drafting Grid (Hairline 1px) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(217, 119, 6, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(217, 119, 6, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Crosshair Corner Registration Marks (Cadastral Survey Notation) */}
        <div className="absolute top-3 left-4 font-mono text-[9px] text-amber-500/50 pointer-events-none">
          + 120.9842° E
        </div>
        <div className="absolute top-3 right-4 font-mono text-[9px] text-amber-500/50 pointer-events-none">
          + 14.5995° N
        </div>
        <div className="absolute bottom-3 left-4 font-mono text-[9px] text-amber-500/50 pointer-events-none">
          SEC. NSCP-2015
        </div>
        <div className="absolute bottom-3 right-4 font-mono text-[9px] text-amber-500/50 pointer-events-none">
          ELEV. +0.00m
        </div>

        {/* TOP HEADER: Architectural Lab Brand & Live Telemetry */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-xs bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-neutral-300 font-semibold">
              MCPA Architecture & Construction
            </span>
          </div>
          <div className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-sm">
            {progress}% INITIALIZED
          </div>
        </div>

        {/* CENTER: Morphing Technical Architectural Vector Construction Sequence */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-2">
          {/* Dynamic Graphic Stage with Blueprint Dial */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-3.5">
            {/* Circular Blueprint Dial with Degree Ticks */}
            <svg className="absolute inset-0 w-full h-full text-amber-500/20" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <circle
                cx="50"
                cy="50"
                r="39"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeOpacity="0.4"
              />
              {/* Ticks at 0, 90, 180, 270 deg */}
              <line x1="50" y1="2" x2="50" y2="7" stroke="currentColor" strokeWidth="1.5" />
              <line x1="50" y1="93" x2="50" y2="98" stroke="currentColor" strokeWidth="1.5" />
              <line x1="2" y1="50" x2="7" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <line x1="93" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            {/* PHASE 1: Architectural Drafting Compass & Architect's Set Square (0-500ms) */}
            {phase === 1 && (
              <div className="relative animate-in fade-in zoom-in-75 duration-200 flex items-center justify-center">
                <svg className="w-20 h-20 text-amber-400 stroke-current" viewBox="0 0 80 80" fill="none">
                  {/* Architect's 45-degree Set Square (Triangle Ruler in background) */}
                  <polygon
                    points="14,66 66,66 14,14"
                    strokeWidth="1.5"
                    className="stroke-amber-500/40 fill-amber-500/5"
                  />
                  <polygon
                    points="22,58 52,58 22,28"
                    strokeWidth="1"
                    className="stroke-amber-500/30"
                  />
                  {/* Millimetric ruler ticks along the base */}
                  <line x1="26" y1="66" x2="26" y2="62" strokeWidth="1" className="stroke-amber-400/60" />
                  <line x1="34" y1="66" x2="34" y2="60" strokeWidth="1.2" className="stroke-amber-400/80" />
                  <line x1="42" y1="66" x2="42" y2="62" strokeWidth="1" className="stroke-amber-400/60" />
                  <line x1="50" y1="66" x2="50" y2="60" strokeWidth="1.2" className="stroke-amber-400/80" />
                  <line x1="58" y1="66" x2="58" y2="62" strokeWidth="1" className="stroke-amber-400/60" />

                  {/* Drafting Compass In Foreground */}
                  <circle cx="40" cy="18" r="4.5" strokeWidth="2.2" className="fill-amber-500/20" />
                  <circle cx="40" cy="18" r="1.5" className="fill-white" />
                  {/* Compass Legs */}
                  <path d="M38 23 L22 66" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M42 23 L58 66" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Knurled Adjustment Screw Bar */}
                  <line x1="28" y1="44" x2="52" y2="44" strokeWidth="2" strokeDasharray="2 1" />
                  <circle cx="40" cy="44" r="2.5" className="fill-amber-400" />
                  {/* Glowing Blueprint Radius Arc */}
                  <path
                    d="M18 66 A26 26 0 0 1 62 66"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    className="stroke-amber-300"
                  />
                  {/* Lead needle point */}
                  <circle cx="22" cy="66" r="1.5" className="fill-amber-400" />
                  <circle cx="58" cy="66" r="1.5" className="fill-amber-300" />
                </svg>
              </div>
            )}

            {/* PHASE 2: Tower Crane Rigging + Structural Steel I-Beam + Spirit Level (500-1000ms) */}
            {phase === 2 && (
              <div className="relative animate-in fade-in zoom-in-75 duration-200 flex items-center justify-center">
                <svg className="w-20 h-20 text-amber-400 stroke-current" viewBox="0 0 80 80" fill="none">
                  {/* Tower Crane Vertical Lattice Mast */}
                  <line x1="20" y1="12" x2="20" y2="68" strokeWidth="2.5" />
                  <line x1="20" y1="18" x2="26" y2="24" strokeWidth="1" className="stroke-amber-500/40" />
                  <line x1="20" y1="30" x2="26" y2="36" strokeWidth="1" className="stroke-amber-500/40" />
                  <line x1="20" y1="42" x2="26" y2="48" strokeWidth="1" className="stroke-amber-500/40" />
                  
                  {/* Crane Horizontal Jib & Counter-Jib */}
                  <line x1="10" y1="18" x2="68" y2="18" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Cab & A-Frame Apex */}
                  <polygon points="16,18 20,8 24,18" strokeWidth="1.5" className="fill-amber-500/30" />
                  <line x1="20" y1="8" x2="48" y2="18" strokeWidth="1" />

                  {/* Hoist Trolley & Dual Steel Rigging Cables */}
                  <rect x="44" y="16" width="8" height="4" rx="1" className="fill-amber-400" />
                  <line x1="46" y1="20" x2="36" y2="34" strokeWidth="1.5" strokeDasharray="3 1" />
                  <line x1="50" y1="20" x2="60" y2="34" strokeWidth="1.5" strokeDasharray="3 1" />

                  {/* Heavy Structural Steel I-Beam (Wide Flange) */}
                  <g className="filter drop-shadow-md">
                    {/* Top Flange */}
                    <line x1="30" y1="34" x2="66" y2="34" strokeWidth="3.5" strokeLinecap="square" />
                    {/* Vertical Web */}
                    <line x1="48" y1="34" x2="48" y2="42" strokeWidth="3" />
                    {/* Bottom Flange */}
                    <line x1="30" y1="42" x2="66" y2="42" strokeWidth="3.5" strokeLinecap="square" />
                    {/* Structural Web Rivets */}
                    <circle cx="36" cy="38" r="1" className="fill-amber-200" />
                    <circle cx="60" cy="38" r="1" className="fill-amber-200" />
                  </g>

                  {/* Utilitarian Spirit Level Tool (Bottom) */}
                  <rect
                    x="24"
                    y="54"
                    width="44"
                    height="10"
                    rx="2"
                    strokeWidth="1.5"
                    className="stroke-amber-400/80 fill-neutral-900"
                  />
                  {/* Liquid Vial */}
                  <rect
                    x="38"
                    y="57"
                    width="16"
                    height="4"
                    rx="1.5"
                    strokeWidth="1"
                    className="stroke-emerald-400/80 fill-emerald-950/60"
                  />
                  {/* Centered Emerald Bubble (Indicates 100% Plumb Level) */}
                  <circle cx="46" cy="59" r="1.5" className="fill-emerald-400 animate-pulse" />
                </svg>
              </div>
            )}

            {/* PHASE 3: Contemporary Residence Elevation & Certified Gold Seal (1000-1500ms) */}
            {phase === 3 && (
              <div className="relative animate-in zoom-in-75 duration-200 flex items-center justify-center">
                {/* Outer Emerald & Golden Pulse Ring */}
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping duration-700 pointer-events-none" />
                
                {/* Certified Architectural Stamp Graphic */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full text-amber-400 stroke-current" viewBox="0 0 80 80" fill="none">
                    {/* Modernist Villa Elevation Profile in Background */}
                    <path
                      d="M14 58 L14 44 L32 44 L32 32 L66 32 L66 58 Z"
                      strokeWidth="1.2"
                      className="stroke-amber-500/40 fill-amber-500/5"
                    />
                    {/* Cantilever Roofline Overhang */}
                    <line x1="28" y1="30" x2="70" y2="30" strokeWidth="2.5" className="stroke-amber-400/70" />
                    {/* Ribbon Glass Mullions */}
                    <line x1="38" y1="36" x2="38" y2="44" strokeWidth="1" className="stroke-amber-500/40" />
                    <line x1="48" y1="36" x2="48" y2="44" strokeWidth="1" className="stroke-amber-500/40" />
                    <line x1="58" y1="36" x2="58" y2="44" strokeWidth="1" className="stroke-amber-500/40" />

                    {/* Circular Architectural Seal Emblem */}
                    <circle
                      cx="40"
                      cy="44"
                      r="22"
                      strokeWidth="2.5"
                      className="stroke-amber-400 fill-[#0a0d14]/90"
                    />
                    <circle
                      cx="40"
                      cy="44"
                      r="18"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="stroke-amber-500/70"
                    />
                  </svg>

                  {/* Certified Checkmark in Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                      <CheckIcon className="w-6 h-6 stroke-[3.2] text-neutral-950 animate-in zoom-in duration-150" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phase Indicator & Title */}
          <div className="space-y-1.5 max-w-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-wider text-amber-400 uppercase">
              {phase === 1 && (activeLang === "fil" ? "YUGTO 1: CAD DRAFTING & BLUEPRINT" : "PHASE 01: ARCHITECTURAL DRAFTING")}
              {phase === 2 && (activeLang === "fil" ? "YUGTO 2: STRUCTURAL ENGINEERING & LEVELING" : "PHASE 02: STRUCTURAL ENGINEERING")}
              {phase === 3 && (activeLang === "fil" ? "YUGTO 3: PORTAL ACCESS NAIPAGKALOOB" : "PHASE 03: CLIENT ACCESS AUTHORIZED")}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {phase === 3
                ? activeLang === "fil"
                  ? `Maligayang Pagdating, ${clientName}!`
                  : `Welcome to MCPA, ${clientName}!`
                : activeLang === "fil"
                ? "Inihahanda ang Iyong Client Portal"
                : "Calibrating Your Project Portal"}
            </h3>

            <p className="text-xs text-neutral-400 font-mono">
              {phase === 1 && "Drafting precision cadastral coordinates & building envelope..."}
              {phase === 2 && `Calibrating engineering specifications: ${projectType}...`}
              {phase === 3 && (
                <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>
                    {activeLang === "fil"
                      ? "Ligtas na access naipagkaloob na · Pasok sa Portal"
                      : "Client access credentials authorized · Entering Portal"}
                  </span>
                </span>
              )}
            </p>
          </div>

          {/* Email Dispatched Confirmation Notice */}
          {email && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900/90 border border-white/10 text-neutral-300 text-[11px] font-mono max-w-[360px] truncate">
              <MailIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {activeLang === "fil" ? "Welcome brief naipadala sa: " : "Welcome brief dispatched to: "}
                <strong className="text-white font-semibold">{email}</strong>
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM: High-Precision Progress Bar & Technical Telemetry */}
        <div className="relative z-10 space-y-2 border-t border-white/10 pt-3.5">
          {/* Dual-track hairline progress line */}
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Technical Footer Telemetry */}
          <div className="flex items-center justify-between text-[9.5px] font-mono text-neutral-400">
            <span>NSCP 2015 · PHILIPPINES</span>
            <span className="text-amber-500 font-medium">BUILDING CODE COMPLIANT</span>
            <span className="text-neutral-500">ENTERING PORTAL...</span>
          </div>
        </div>
      </div>
    </div>
  );
}



