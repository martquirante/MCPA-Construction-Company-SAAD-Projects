"use client";

import ScrollMorph from "../../shared/ScrollMorph";
import { useLanguage } from "../../shared/LanguageContext";

export default function StatsSection() {
  const { language } = useLanguage();
  const isFil = language === "fil";

  const stats = [
    {
      custom: true,
      render: () => (
        <div className="flex flex-col leading-tight">
          <span className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {isFil ? "Ligtas sa Lindol" : "Earthquake &"}
          </span>
          <span className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-neutral-900 dark:text-white inline-flex items-baseline gap-1.5">
            <span>{isFil ? "at" : "Typhoon"}</span>
            <span className="text-base sm:text-lg xl:text-xl text-amber-500 dark:text-amber-400 font-semibold">
              {isFil ? "Bagyo" : "Ready"}
            </span>
          </span>
        </div>
      ),
      label: isFil ? "Tibay ng Istruktura" : "Structural Resilience",
      desc: isFil
        ? "Idinisenyo para sa lindol at lakas ng hanging dala ng bagyo"
        : "Engineered for major faults & super typhoon wind loads",
    },
    {
      value: isFil ? "Direktang" : "Direct",
      suffix: isFil ? "Suplay" : "Supply",
      label: isFil ? "Sariling Materyales" : "In-House Materials",
      desc: isFil
        ? "Buhangin, graba, semento, at bakal na nakalaan sa proyekto"
        : "Project-dedicated aggregates, cement & structural steel",
    },
    {
      value: "100",
      suffix: "%",
      label: isFil ? "May Pirma at Tatak" : "Signed & Sealed",
      desc: isFil
        ? "Mga Lisensyadong Arkitekto at Civil Engineer"
        : "Licensed Architects & Civil Engineers",
    },
    {
      value: "BNPL",
      suffix: isFil ? "Programa" : "Program",
      label: "Build Now, Pay Later",
      desc: isFil
        ? "Financing sa tituladong lote at tulong sa Pag-IBIG"
        : "Titled lot financing & Pag-IBIG assistance",
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-neutral-200 dark:border-neutral-900/80">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {stats.map((stat, idx) => (
          <ScrollMorph
            key={idx}
            variant="isometric-pop"
            delay={idx * 130}
            duration={750}
            className="h-full"
          >
            <div className="relative overflow-hidden text-left flex flex-col group p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 hover:shadow-[0_10px_30px_rgba(245,158,11,0.12)] transition-all duration-500 backdrop-blur-sm shadow-xs h-full">
              {/* Ambient gold bottom line on hover */}
              <div className="absolute bottom-0 inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Title / Value + Suffix */}
              <div className="group-hover:translate-x-0.5 transition-transform duration-300">
                {stat.custom ? (
                  stat.render()
                ) : (
                  <div className="flex flex-wrap items-baseline gap-x-1.5 leading-tight text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    <span className="break-words">{stat.value}</span>
                    {stat.suffix && (
                      <span className="text-base sm:text-lg xl:text-xl text-amber-500 dark:text-amber-400 font-semibold inline-flex items-center shrink-0">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Label */}
              <p className="mt-2.5 text-xs sm:text-sm uppercase tracking-wider font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                {stat.label}
              </p>

              {/* Description directly under label with no gap */}
              <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-snug">
                {stat.desc}
              </p>
            </div>
          </ScrollMorph>
        ))}
      </div>
    </section>
  );
}
