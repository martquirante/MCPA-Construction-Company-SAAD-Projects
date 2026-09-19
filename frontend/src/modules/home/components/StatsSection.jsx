"use client";

import ScrollMorph from "../../shared/ScrollMorph";

export default function StatsSection() {
  const stats = [
    {
      value: (
        <span className="flex flex-col items-center lg:items-start leading-tight">
          <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Earthquake &
          </span>
          <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-neutral-900 dark:text-white inline-flex items-baseline gap-1">
            <span>Typhoon</span>
            <span className="text-lg sm:text-xl text-amber-500 dark:text-amber-400 font-semibold">
              Ready
            </span>
          </span>
        </span>
      ),
      custom: true,
      label: "Structural Resilience",
      desc: "Engineered for major faults & super typhoon wind loads",
    },
    {
      value: "Direct",
      suffix: "Supply",
      label: "In-House Materials",
      desc: "Direct wholesale aggregates, cement & structural steel",
    },
    {
      value: "100",
      suffix: "%",
      label: "Signed & Sealed",
      desc: "Licensed Architects & Civil Engineers",
    },
    {
      value: "BNPL",
      suffix: "Program",
      label: "Build Now, Pay Later",
      desc: "Titled lot financing & Pag-IBIG assistance",
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-neutral-200 dark:border-neutral-900/80">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {stats.map((stat, idx) => (
          <ScrollMorph
            key={idx}
            variant="isometric-pop"
            delay={idx * 130}
            duration={750}
            className="relative overflow-hidden text-center lg:text-left flex flex-col items-center lg:items-start group p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 hover:shadow-[0_10px_30px_rgba(245,158,11,0.12)] transition-all duration-500 backdrop-blur-sm shadow-xs"
          >
            {/* Ambient gold bottom line on hover */}
            <div className="absolute bottom-0 inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="group-hover:scale-105 group-hover:translate-x-0.5 transition-transform duration-300">
              {stat.custom ? (
                stat.value
              ) : (
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white tabular-nums flex items-baseline gap-1">
                  <span>{stat.value}</span>
                  <span className="text-xl sm:text-2xl text-amber-500 dark:text-amber-400 font-semibold inline-flex items-center">
                    {stat.suffix}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs sm:text-sm uppercase tracking-wider font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
              {stat.label}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-snug">
              {stat.desc}
            </p>
          </ScrollMorph>
        ))}
      </div>
    </section>
  );
}
