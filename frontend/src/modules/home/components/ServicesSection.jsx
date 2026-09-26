"use client";

import Link from "next/link";
import ScrollMorph from "../../shared/ScrollMorph";
import { useLanguage } from "../../shared/LanguageContext";
import {
  ArrowRightIcon,
  HomeIcon,
  BadgePercentIcon,
  FileSignatureIcon,
  WarehouseIcon,
} from "../../shared/Icons";

export default function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    {
      id: "residential",
      icon: <HomeIcon className="w-8 h-8 text-amber-500" strokeWidth={1.8} />,
      title: t("serviceTurnkeyTitle"),
      tag: t("serviceTurnkeyTag"),
      desc: t("serviceTurnkeyDesc"),
    },
    {
      id: "bnpl",
      icon: <BadgePercentIcon className="w-8 h-8 text-amber-500" strokeWidth={1.8} />,
      title: t("serviceBnplTitle"),
      tag: t("serviceBnplTag"),
      desc: t("serviceBnplDesc"),
    },
    {
      id: "plans",
      icon: <FileSignatureIcon className="w-8 h-8 text-amber-500" strokeWidth={1.8} />,
      title: t("servicePlansTitle"),
      tag: t("servicePlansTag"),
      desc: t("servicePlansDesc"),
    },
    {
      id: "commercial-supply",
      icon: <WarehouseIcon className="w-8 h-8 text-amber-500" strokeWidth={1.8} />,
      title: t("serviceSupplyTitle"),
      tag: t("serviceSupplyTag"),
      desc: t("serviceSupplyDesc"),
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-200 dark:border-neutral-800">
      <ScrollMorph variant="fade-up" className="mb-16 grid lg:grid-cols-2 gap-8 items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-600 dark:text-amber-400 mb-3">
            {t("whatWeDo")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
            {t("servicesThat")}
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              {t("defineEras")}
            </span>
          </h2>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-normal max-w-md">
          {t("servicesSubtitle")}
        </p>
      </ScrollMorph>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((item, idx) => (
          <ScrollMorph
            key={item.id}
            variant="shutter-rise"
            delay={idx * 140}
            duration={850}
            className="h-full"
          >
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1.5 backdrop-blur-sm h-full">
              {/* Top ambient shimmer beam on hover */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div>
                <div className="mb-6 p-3 w-fit rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>

                <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {item.tag}
                </span>

                <h3 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white mt-2 mb-3 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform"
                >
                  <span>{t("inquire")}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </ScrollMorph>
        ))}
      </div>
    </section>
  );
}
