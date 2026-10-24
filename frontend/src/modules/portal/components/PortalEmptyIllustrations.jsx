"use client";

import React from "react";

/**
 * Bespoke Architectural & Construction Empty State Illustrations
 * - Truly relevant to Civil Engineering, Construction, Site Execution & Milestone Escrow
 * - Fluid CSS keyframe animations (swaying crane, floating gold coins, scanning laser, spinning drone rotors)
 * - 100% Vector SVG — crisp at any resolution
 * - Seamless Light & Dark mode adaptation
 */

export function BillingEmptyIllustration({ className = "w-44 h-44 sm:w-52 sm:h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <style>{`
          @keyframes coinFloatA {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(-3deg); }
          }
          @keyframes coinFloatB {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(4deg); }
          }
          @keyframes coinFloatC {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes shieldPulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(245,158,11,0)); }
            50% { transform: scale(1.04); filter: drop-shadow(0 4px 12px rgba(245,158,11,0.35)); }
          }
          @keyframes docGleam {
            0% { transform: translateX(-120px) skewX(-20deg); opacity: 0; }
            30% { opacity: 0.6; }
            60%, 100% { transform: translateX(260px) skewX(-20deg); opacity: 0; }
          }
          @keyframes checkPop {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .anim-coin-a { animation: coinFloatA 3.6s ease-in-out infinite; }
          .anim-coin-b { animation: coinFloatB 4.2s ease-in-out infinite 0.4s; }
          .anim-coin-c { animation: coinFloatC 3.2s ease-in-out infinite 0.8s; }
          .anim-shield { animation: shieldPulse 3.5s ease-in-out infinite; transform-origin: 65px 155px; }
          .anim-gleam { animation: docGleam 4.5s ease-in-out infinite; }
          .anim-pop { animation: checkPop 2.8s ease-in-out infinite; transform-origin: 205px 70px; }
        `}</style>

        <defs>
          <radialGradient id="billingAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="coinRimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <clipPath id="docClip">
            <rect x="75" y="32" width="135" height="152" rx="10" />
          </clipPath>
        </defs>

        {/* Ambient Warm Golden Aura */}
        <circle cx="140" cy="110" r="95" fill="url(#billingAura)" />

        {/* Base Foundation Platform / Shadow */}
        <ellipse cx="140" cy="192" rx="90" ry="14" fill="#000000" fillOpacity="0.08" className="dark:fill-black dark:fill-opacity-40" />

        {/* Backdrop Document (Layer 2 - Supporting Ledger Sheet) */}
        <g opacity="0.65" transform="rotate(-4 140 110)">
          <rect
            x="80"
            y="36"
            width="130"
            height="146"
            rx="10"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-[#0d1017] dark:stroke-white/10"
          />
        </g>

        {/* Primary Invoice Document (Layer 1 - Architectural Progress Billing) */}
        <g>
          <rect
            x="75"
            y="32"
            width="135"
            height="152"
            rx="10"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            className="dark:fill-[#121622] dark:stroke-white/15"
          />

          {/* Document Header Accent Strip */}
          <rect x="75" y="32" width="135" height="12" rx="10" fill="url(#goldGradient)" />
          <rect x="75" y="40" width="135" height="4" fill="url(#goldGradient)" />

          {/* MCPA Billing Title Bar */}
          <rect x="90" y="52" width="46" height="5" rx="2.5" fill="#f59e0b" />
          <rect x="90" y="60" width="70" height="3" rx="1.5" fill="#94a3b8" className="dark:fill-neutral-500" />
          <rect x="90" y="65" width="40" height="3" rx="1.5" fill="#cbd5e1" className="dark:fill-neutral-600" />

          {/* Progress Ledger Lines / Tranches */}
          <g transform="translate(90, 78)">
            {/* Row 1 - Phase 1 Foundation Escrow */}
            <rect x="0" y="0" width="105" height="14" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" className="dark:fill-white/5 dark:stroke-white/5" />
            <rect x="6" y="5" width="45" height="4" rx="2" fill="#64748b" className="dark:fill-neutral-400" />
            <circle cx="68" cy="7" r="2.5" fill="#10b981" />
            <rect x="76" y="5" width="22" height="4" rx="2" fill="#10b981" fillOpacity="0.8" />

            {/* Row 2 - Phase 2 Structural Shell */}
            <rect x="0" y="18" width="105" height="14" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" className="dark:fill-white/5 dark:stroke-white/5" />
            <rect x="6" y="23" width="55" height="4" rx="2" fill="#94a3b8" className="dark:fill-neutral-500" />
            <circle cx="68" cy="25" r="2.5" fill="#f59e0b" />
            <rect x="76" y="23" width="22" height="4" rx="2" fill="#f59e0b" fillOpacity="0.8" />

            {/* Row 3 - Phase 3 Finishing Tranche */}
            <rect x="0" y="36" width="105" height="14" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" className="dark:fill-white/5 dark:stroke-white/5" />
            <rect x="6" y="41" width="38" height="4" rx="2" fill="#cbd5e1" className="dark:fill-neutral-600" />
            <circle cx="68" cy="43" r="2.5" fill="#cbd5e1" className="dark:fill-neutral-600" />
            <rect x="76" y="41" width="22" height="4" rx="2" fill="#cbd5e1" className="dark:fill-neutral-600" />
          </g>

          {/* Total Due Plinth / Footer */}
          <rect x="90" y="140" width="105" height="18" rx="5" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" className="dark:fill-amber-500/10 dark:stroke-amber-500/30" />
          <rect x="98" y="147" width="28" height="4" rx="2" fill="#b45309" className="dark:fill-amber-400" />
          <rect x="156" y="146" width="32" height="6" rx="3" fill="#b45309" className="dark:fill-amber-400" />

          {/* Certified Seal / Stamp */}
          <g className="anim-pop">
            <circle cx="195" cy="58" r="14" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" className="dark:fill-amber-500/15" />
            <circle cx="195" cy="58" r="11" fill="url(#goldGradient)" />
            {/* Checkmark inside seal */}
            <path d="M191 58 L194 61 L199 55" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Gleam light effect over document */}
          <g clipPath="url(#docClip)">
            <rect x="0" y="0" width="40" height="220" fill="url(#billingAura)" className="anim-gleam" />
          </g>
        </g>

        {/* Escrow Security Shield (Bottom Left) */}
        <g className="anim-shield">
          <circle cx="65" cy="155" r="20" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" className="dark:fill-[#161a26] dark:stroke-white/10" />
          <path
            d="M65 142 L77 146 C77 156 72 165 65 169 C58 165 53 156 53 146 Z"
            fill="url(#shieldGrad)"
          />
          {/* Keyhole / Lock mark */}
          <circle cx="65" cy="153" r="2" fill="#ffffff" />
          <path d="M64 154 L66 154 L66.5 161 L63.5 161 Z" fill="#ffffff" />
        </g>

        {/* Floating Gold Coin 1 (Large - Left) */}
        <g className="anim-coin-a">
          <circle cx="48" cy="98" r="16" fill="url(#goldGradient)" stroke="url(#coinRimGradient)" strokeWidth="2" />
          <circle cx="48" cy="98" r="13" fill="none" stroke="#fef3c7" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.8" />
          {/* Philippine Peso ₱ Sign */}
          <text
            x="48"
            y="104"
            fontSize="15"
            fontWeight="bold"
            fontFamily="sans-serif"
            fill="#ffffff"
            textAnchor="middle"
          >
            ₱
          </text>
        </g>

        {/* Floating Gold Coin 2 (Medium - Right) */}
        <g className="anim-coin-b">
          <circle cx="225" cy="115" r="14" fill="url(#goldGradient)" stroke="url(#coinRimGradient)" strokeWidth="1.5" />
          <circle cx="225" cy="115" r="11" fill="none" stroke="#fef3c7" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.8" />
          <text
            x="225"
            y="120"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
            fill="#ffffff"
            textAnchor="middle"
          >
            ₱
          </text>
        </g>

        {/* Floating Token 3 (Small - Top Right Star) */}
        <g className="anim-coin-c">
          <circle cx="218" cy="40" r="9" fill="url(#goldGradient)" stroke="#fef3c7" strokeWidth="1" />
          <polygon points="218,34 220,38 224,39 221,42 222,46 218,44 214,46 215,42 212,39 216,38" fill="#ffffff" />
        </g>

        {/* Sparkle Gleams */}
        <g opacity="0.85">
          <path d="M42 68 Q42 75 35 75 Q42 75 42 82 Q42 75 49 75 Q42 75 42 68 Z" fill="#fbbf24" />
          <path d="M236 78 Q236 83 231 83 Q236 83 236 88 Q236 83 241 83 Q236 83 236 78 Z" fill="#fbbf24" />
        </g>
      </svg>
    </div>
  );
}

export function MilestonesEmptyIllustration({ className = "w-44 h-44 sm:w-52 sm:h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <style>{`
          @keyframes craneSway {
            0%, 100% { transform: rotate(-3.5deg); }
            50% { transform: rotate(3.5deg); }
          }
          @keyframes laserScan {
            0%, 100% { transform: translateY(0px); opacity: 0.2; }
            50% { transform: translateY(55px); opacity: 0.8; }
          }
          @keyframes beaconPing {
            0% { r: 3; opacity: 1; }
            100% { r: 12; opacity: 0; }
          }
          @keyframes helmetBob {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          .anim-sway { animation: craneSway 4.2s ease-in-out infinite; transform-origin: 165px 44px; }
          .anim-scan { animation: laserScan 4s ease-in-out infinite; }
          .anim-beacon { animation: beaconPing 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
          .anim-helmet { animation: helmetBob 3.4s ease-in-out infinite; }
        `}</style>

        <defs>
          <radialGradient id="milestoneAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.20" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="craneYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="beamSteel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="140" cy="110" r="95" fill="url(#milestoneAura)" />

        {/* Ground Platform Shadow */}
        <ellipse cx="140" cy="195" rx="95" ry="14" fill="#000000" fillOpacity="0.08" className="dark:fill-black dark:fill-opacity-40" />

        {/* Architectural Blueprint Grid Base */}
        <g opacity="0.85">
          {/* Isometric Blueprint Plane */}
          <polygon
            points="55,160 140,125 225,160 140,195"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-[#0c1018] dark:stroke-white/15"
          />

          {/* Blueprint Grid Lines */}
          <path
            d="
              M83,148 L168,183
              M112,136 L197,171
              M168,136 L83,171
              M197,148 L112,183
            "
            stroke="#38bdf8"
            strokeWidth="1"
            strokeOpacity="0.4"
            className="dark:stroke-[#38bdf8] dark:stroke-opacity-35"
          />

          {/* Laser Scanning Line across Blueprint Grid */}
          <g className="anim-scan">
            <line x1="60" y1="140" x2="220" y2="140" stroke="url(#laserGrad)" strokeWidth="2" />
          </g>
        </g>

        {/* Milestone Foundation Footing Plinths (Progress: 01, 02, 03) */}
        {/* Plinth 1 - Completed Stage */}
        <g transform="translate(80, 150)">
          <path d="M0,8 L16,0 L32,8 L16,16 Z" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="1.2" />
          <path d="M0,8 L0,16 L16,24 L16,16 Z" fill="#059669" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.2" />
          <path d="M16,16 L16,24 L32,16 L32,8 Z" fill="#047857" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.2" />
          {/* Node Badge */}
          <circle cx="16" cy="8" r="4" fill="#10b981" />
          <polyline points="14,8 15.5,9.5 18,6.5" stroke="#ffffff" strokeWidth="1" fill="none" />
        </g>

        {/* Plinth 2 - Active Target Milestone (Center) */}
        <g transform="translate(124, 132)">
          <path d="M0,10 L16,0 L32,10 L16,20 Z" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M0,10 L0,22 L16,32 L16,20 Z" fill="#d97706" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M16,20 L16,32 L32,22 L32,10 Z" fill="#b45309" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Pulsing Beacon */}
          <circle cx="16" cy="10" r="5" fill="#f59e0b" />
          <circle cx="16" cy="10" r="3" stroke="#f59e0b" className="anim-beacon" fill="none" strokeWidth="1.5" />
        </g>

        {/* Plinth 3 - Future Milestone (Right) */}
        <g transform="translate(168, 150)">
          <path d="M0,8 L16,0 L32,8 L16,16 Z" fill="#94a3b8" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-white/20" />
          <circle cx="16" cy="8" r="3" fill="#cbd5e1" className="dark:fill-neutral-600" />
        </g>

        {/* Timeline Roadmap Track Joining the 3 Milestones */}
        <path
          d="M96 158 Q120 148 140 142 T184 158"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.8"
        />

        {/* Tower Crane (Left Mast & Overhead Jib) */}
        <g>
          {/* Vertical Lattice Steel Tower Mast */}
          <rect x="195" y="40" width="12" height="135" fill="url(#craneYellow)" rx="2" />
          {/* Cross Bracing on Mast */}
          <g stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2">
            <line x1="195" y1="55" x2="207" y2="70" />
            <line x1="207" y1="55" x2="195" y2="70" />
            <line x1="195" y1="75" x2="207" y2="90" />
            <line x1="207" y1="75" x2="195" y2="90" />
            <line x1="195" y1="95" x2="207" y2="110" />
            <line x1="207" y1="95" x2="195" y2="110" />
            <line x1="195" y1="115" x2="207" y2="130" />
            <line x1="207" y1="115" x2="195" y2="130" />
            <line x1="195" y1="135" x2="207" y2="150" />
            <line x1="207" y1="135" x2="195" y2="150" />
          </g>

          {/* Tower Crane Base Footing Plinth */}
          <rect x="191" y="172" width="20" height="8" rx="2" fill="#475569" />

          {/* Operator Cab & Slewing Ring */}
          <rect x="187" y="36" width="16" height="12" rx="2" fill="#1e293b" />
          <rect x="189" y="38" width="6" height="6" rx="1" fill="#38bdf8" />

          {/* Horizontal Jib Arm (Extending Left) */}
          <polygon points="110,40 230,40 230,44 110,44" fill="url(#craneYellow)" />
          {/* Jib top tie bars */}
          <polygon points="190,22 201,36 195,36" fill="#d97706" />
          <line x1="190" y1="22" x2="120" y2="40" stroke="#f59e0b" strokeWidth="1.2" />
          <line x1="190" y1="22" x2="228" y2="40" stroke="#f59e0b" strokeWidth="1.2" />

          {/* Counterweight Block (Right) */}
          <rect x="220" y="44" width="14" height="10" rx="1" fill="#334155" />
          {/* Hazard stripes on counterweight */}
          <line x1="222" y1="54" x2="226" y2="44" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="228" y1="54" x2="232" y2="44" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Hoist Trolley on Jib */}
          <rect x="160" y="42" width="10" height="5" rx="1" fill="#1e293b" />
        </g>

        {/* Suspended Steel Beam & Milestone Marker (Swaying Motion) */}
        <g className="anim-sway">
          {/* Hoist Twin Steel Cables */}
          <line x1="163" y1="46" x2="160" y2="82" stroke="#64748b" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="167" y1="46" x2="170" y2="82" stroke="#64748b" strokeWidth="1" strokeDasharray="1 1" />

          {/* Crane Heavy Hook Block */}
          <circle cx="165" cy="84" r="3.5" fill="#1e293b" />
          <path d="M165 87 C163 89 161 91 163 93 C165 94 167 93 167 91" stroke="#f59e0b" strokeWidth="1.5" fill="none" />

          {/* Rigging Slings */}
          <line x1="165" y1="92" x2="145" y2="102" stroke="#64748b" strokeWidth="1" />
          <line x1="165" y1="92" x2="185" y2="102" stroke="#64748b" strokeWidth="1" />

          {/* Structural Steel I-Beam */}
          <g transform="translate(135, 100)">
            {/* Top Flange */}
            <rect x="0" y="0" width="60" height="3" fill="url(#beamSteel)" rx="1" />
            {/* Web */}
            <rect x="2" y="3" width="56" height="8" fill="#1e293b" />
            {/* Bottom Flange */}
            <rect x="0" y="11" width="60" height="3" fill="url(#beamSteel)" rx="1" />

            {/* Milestone Label Badge on Beam */}
            <rect x="10" y="4" width="40" height="6" rx="2" fill="#f59e0b" />
            <text
              x="30"
              y="9"
              fontSize="4.5"
              fontFamily="monospace"
              fontWeight="bold"
              fill="#000000"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              MILESTONE
            </text>
          </g>
        </g>

        {/* Civil Engineering Safety Hard Hat (Foreground Left) */}
        <g className="anim-helmet" transform="translate(48, 148)">
          {/* Shadow */}
          <ellipse cx="22" cy="24" rx="16" ry="4" fill="#000000" fillOpacity="0.1" />

          {/* Hard Hat Shell */}
          <path
            d="M8,18 C8,8 16,3 22,3 C28,3 36,8 36,18 Z"
            fill="url(#craneYellow)"
          />
          {/* Ridge / Crown reinforcement */}
          <path d="M20,3 L24,3 L24,18 L20,18 Z" fill="#d97706" />
          {/* Reflective safety stripe */}
          <path d="M10,13 C14,11 30,11 34,13" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" fill="none" />
          {/* Brim */}
          <ellipse cx="22" cy="18" rx="17" ry="4" fill="#d97706" />
          <ellipse cx="22" cy="17" rx="16" ry="3.5" fill="#f59e0b" />
        </g>
      </svg>
    </div>
  );
}

export function ConstructionEmptyIllustration({ className = "w-44 h-44 sm:w-52 sm:h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <style>{`
          @keyframes girderFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes laserPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .anim-girder { animation: girderFloat 3.8s ease-in-out infinite; }
          .anim-laser { animation: laserPulse 2s ease-in-out infinite; }
        `}</style>

        <defs>
          <radialGradient id="constAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="yellowConst" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        <circle cx="140" cy="110" r="95" fill="url(#constAura)" />
        <ellipse cx="140" cy="192" rx="90" ry="12" fill="#000000" fillOpacity="0.08" className="dark:fill-black dark:fill-opacity-40" />

        {/* Structural Building Framework Columns (Concrete + Rebar) */}
        <g transform="translate(70, 70)">
          {/* Column 1 */}
          <rect x="0" y="30" width="14" height="85" fill="#94a3b8" rx="2" className="dark:fill-neutral-700" />
          {/* Rebar sticks protruding */}
          <line x1="3" y1="30" x2="3" y2="16" stroke="#475569" strokeWidth="1.5" />
          <line x1="7" y1="30" x2="7" y2="12" stroke="#475569" strokeWidth="1.5" />
          <line x1="11" y1="30" x2="11" y2="18" stroke="#475569" strokeWidth="1.5" />

          {/* Column 2 */}
          <rect x="65" y="10" width="14" height="105" fill="#94a3b8" rx="2" className="dark:fill-neutral-700" />
          <line x1="68" y1="10" x2="68" y2="-2" stroke="#475569" strokeWidth="1.5" />
          <line x1="72" y1="10" x2="72" y2="-6" stroke="#475569" strokeWidth="1.5" />
          <line x1="76" y1="10" x2="76" y2="0" stroke="#475569" strokeWidth="1.5" />

          {/* Column 3 */}
          <rect x="130" y="25" width="14" height="90" fill="#94a3b8" rx="2" className="dark:fill-neutral-700" />
          <line x1="133" y1="25" x2="133" y2="12" stroke="#475569" strokeWidth="1.5" />
          <line x1="137" y1="25" x2="137" y2="8" stroke="#475569" strokeWidth="1.5" />
          <line x1="141" y1="25" x2="141" y2="14" stroke="#475569" strokeWidth="1.5" />

          {/* Horizontal Scaffolding Beam */}
          <rect x="-8" y="55" width="160" height="6" fill="#cbd5e1" rx="1" className="dark:fill-neutral-600" />
          {/* Cross diagonal pipe bracings */}
          <line x1="14" y1="61" x2="65" y2="110" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="65" y1="61" x2="14" y2="110" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="79" y1="61" x2="130" y2="110" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="130" y1="61" x2="79" y2="110" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
        </g>

        {/* Hazard Safety Warning Barrier (Foreground) */}
        <g transform="translate(65, 160)">
          {/* Left Post */}
          <rect x="0" y="0" width="8" height="28" fill="#334155" rx="1" />
          <rect x="-2" y="26" width="12" height="4" fill="#1e293b" rx="1" />

          {/* Right Post */}
          <rect x="142" y="0" width="8" height="28" fill="#334155" rx="1" />
          <rect x="140" y="26" width="12" height="4" fill="#1e293b" rx="1" />

          {/* Barrier Board with Amber & Black Stripes */}
          <rect x="4" y="4" width="142" height="14" fill="#f59e0b" rx="2" />
          <path
            d="
              M15 4 L23 18 M35 4 L43 18 M55 4 L63 18
              M75 4 L83 18 M95 4 L103 18 M115 4 L123 18 M135 4 L143 18
            "
            stroke="#1e293b"
            strokeWidth="5"
          />
        </g>

        {/* Surveyor Tripod with Laser Level */}
        <g transform="translate(195, 120)">
          {/* Tripod Legs */}
          <line x1="20" y1="18" x2="6" y2="65" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="20" y1="18" x2="20" y2="65" stroke="#d97706" strokeWidth="2.5" />
          <line x1="20" y1="18" x2="34" y2="65" stroke="#f59e0b" strokeWidth="2.5" />
          {/* Level Instrument */}
          <rect x="11" y="8" width="18" height="10" rx="2" fill="#0284c7" />
          <circle cx="20" cy="13" r="3" fill="#38bdf8" />
          {/* Laser Emission */}
          <line x1="11" y1="13" x2="-140" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" className="anim-laser" />
        </g>

        {/* Safety Hard Hat on Barrier */}
        <g transform="translate(105, 142)" className="anim-girder">
          <path d="M6,14 C6,6 12,2 17,2 C22,2 28,6 28,14 Z" fill="url(#yellowConst)" />
          <ellipse cx="17" cy="14" rx="13" ry="3" fill="#d97706" />
        </g>
      </svg>
    </div>
  );
}

export function GalleryEmptyIllustration({ className = "w-44 h-44 sm:w-52 sm:h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <style>{`
          @keyframes droneHover {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-7px) rotate(1deg); }
          }
          @keyframes propSpin {
            0% { transform: scaleX(1); }
            50% { transform: scaleX(0.1); }
            100% { transform: scaleX(1); }
          }
          @keyframes camBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
          .anim-drone { animation: droneHover 3.5s ease-in-out infinite; }
          .anim-prop { animation: propSpin 0.15s linear infinite; transform-origin: center; }
          .anim-rec { animation: camBlink 1.2s ease-in-out infinite; }
        `}</style>

        <defs>
          <radialGradient id="galleryAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="140" cy="110" r="95" fill="url(#galleryAura)" />
        <ellipse cx="140" cy="195" rx="85" ry="12" fill="#000000" fillOpacity="0.08" className="dark:fill-black dark:fill-opacity-40" />

        {/* Fanned Out Site Photo Logs (Foreground Base) */}
        <g transform="translate(85, 120)">
          {/* Photo Card 1 (Left Tilted) */}
          <g transform="rotate(-12 40 40)">
            <rect x="0" y="0" width="75" height="65" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-[#121622] dark:stroke-white/15" />
            <rect x="6" y="6" width="63" height="42" rx="3" fill="#e2e8f0" className="dark:fill-neutral-800" />
            {/* Architectural Frame graphic inside photo */}
            <polygon points="12,42 26,22 40,36 50,26 62,42" fill="#94a3b8" opacity="0.6" />
          </g>

          {/* Photo Card 2 (Right Straight) */}
          <g transform="translate(35, 10) rotate(8 40 40)">
            <rect x="0" y="0" width="75" height="65" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-[#141824] dark:stroke-white/20" />
            <rect x="6" y="6" width="63" height="42" rx="3" fill="#fef3c7" className="dark:fill-amber-500/10" />
            {/* Drone symbol on photo */}
            <circle cx="37" cy="24" r="8" fill="#f59e0b" fillOpacity="0.3" />
            <circle cx="37" cy="24" r="4" fill="#f59e0b" />
          </g>
        </g>

        {/* Aerial Site Inspection Drone (Hovering Above) */}
        <g className="anim-drone" transform="translate(90, 40)">
          {/* Drone Arms */}
          <line x1="20" y1="20" x2="80" y2="40" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" className="dark:stroke-neutral-300" />
          <line x1="80" y1="20" x2="20" y2="40" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" className="dark:stroke-neutral-300" />

          {/* Rotor Discs (Spinning) */}
          <g className="anim-prop" transform="translate(20, 18)">
            <ellipse cx="0" cy="0" rx="15" ry="3" fill="#38bdf8" opacity="0.75" />
            <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
          </g>
          <g className="anim-prop" transform="translate(80, 18)">
            <ellipse cx="0" cy="0" rx="15" ry="3" fill="#38bdf8" opacity="0.75" />
            <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
          </g>
          <g className="anim-prop" transform="translate(20, 42)">
            <ellipse cx="0" cy="0" rx="15" ry="3" fill="#38bdf8" opacity="0.75" />
            <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
          </g>
          <g className="anim-prop" transform="translate(80, 42)">
            <ellipse cx="0" cy="0" rx="15" ry="3" fill="#38bdf8" opacity="0.75" />
            <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
          </g>

          {/* Drone Fuselage Body */}
          <rect x="36" y="20" width="28" height="20" rx="8" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          {/* Top GPS sensor dome */}
          <circle cx="50" cy="25" r="4" fill="#ffffff" />

          {/* 4K Gimbal Camera Below Body */}
          <circle cx="50" cy="45" r="7" fill="#1e293b" />
          <circle cx="50" cy="45" r="4.5" fill="#0284c7" />
          <circle cx="51" cy="44" r="1.5" fill="#ffffff" />

          {/* Recording Red Indicator LED */}
          <circle cx="39" cy="30" r="2" fill="#ef4444" className="anim-rec" />
          <circle cx="61" cy="30" r="2" fill="#10b981" />
        </g>
      </svg>
    </div>
  );
}

export function InquiriesEmptyIllustration({ className = "w-44 h-44 sm:w-52 sm:h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <style>{`
          @keyframes compassDraw {
            0%, 100% { transform: rotate(-8deg); }
            50% { transform: rotate(12deg); }
          }
          @keyframes paperFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          .anim-compass { animation: compassDraw 4s ease-in-out infinite; transform-origin: 155px 65px; }
          .anim-paper { animation: paperFloat 3.8s ease-in-out infinite; }
        `}</style>

        <defs>
          <radialGradient id="inquiryAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="140" cy="110" r="95" fill="url(#inquiryAura)" />
        <ellipse cx="140" cy="192" rx="85" ry="12" fill="#000000" fillOpacity="0.08" className="dark:fill-black dark:fill-opacity-40" />

        {/* Rolled Blueprint Tube (Behind) */}
        <g transform="translate(60, 45) rotate(-22)">
          <rect x="0" y="0" width="140" height="20" rx="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
          <ellipse cx="8" cy="10" rx="5" ry="10" fill="#38bdf8" />
          <ellipse cx="140" cy="10" rx="5" ry="10" fill="#0369a1" />
          {/* Gold MCPA band */}
          <rect x="40" y="0" width="10" height="20" fill="#f59e0b" />
          <rect x="90" y="0" width="10" height="20" fill="#f59e0b" />
        </g>

        {/* Unfolded Architectural Consultation Brief Sheet */}
        <g className="anim-paper" transform="translate(85, 55)">
          <rect x="0" y="0" width="115" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-[#121622] dark:stroke-white/15" />

          {/* Blueprint Title Block Header */}
          <rect x="12" y="14" width="40" height="5" rx="2" fill="#f59e0b" />
          <rect x="12" y="23" width="75" height="3" rx="1.5" fill="#94a3b8" />

          {/* Architectural Elevation Sketch (House Wireframe) */}
          <g transform="translate(18, 38)" stroke="#0284c7" strokeWidth="1.2" fill="none">
            {/* Gable Roof */}
            <polygon points="40,5 5,28 75,28" fill="#e0f2fe" fillOpacity="0.4" className="dark:fill-sky-500/10" />
            {/* Building Box */}
            <rect x="12" y="28" width="56" height="34" />
            {/* Door */}
            <rect x="34" y="44" width="12" height="18" fill="#f59e0b" fillOpacity="0.3" />
            {/* Windows */}
            <rect x="18" y="34" width="10" height="10" />
            <line x1="23" y1="34" x2="23" y2="44" />
            <line x1="18" y1="39" x2="28" y2="39" />
            <rect x="52" y="34" width="10" height="10" />
            <line x1="57" y1="34" x2="57" y2="44" />
            <line x1="52" y1="39" x2="62" y2="39" />
          </g>

          {/* Official Seal at Bottom Right */}
          <circle cx="92" cy="110" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" className="dark:fill-amber-500/20" />
          <polygon points="92,104 94,108 98,109 95,112 96,116 92,114 88,116 89,112 86,109 90,108" fill="#f59e0b" />
        </g>

        {/* Drafting Compass / Divider Tool (Foreground Drawing Arc) */}
        <g className="anim-compass">
          {/* Top Hinge */}
          <circle cx="155" cy="65" r="5" fill="#d97706" />
          <circle cx="155" cy="65" r="2.5" fill="#ffffff" />
          {/* Left Leg with needle */}
          <line x1="155" y1="65" x2="140" y2="120" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="140" y1="120" x2="138" y2="128" stroke="#64748b" strokeWidth="1.5" />
          {/* Right Leg with pencil */}
          <line x1="155" y1="65" x2="175" y2="120" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="175,120 178,128 172,128" fill="#1e293b" />
          {/* Arc being drawn on paper */}
          <path d="M140 128 A 35 35 0 0 1 176 128" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
        </g>
      </svg>
    </div>
  );
}
