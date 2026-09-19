"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckIcon,
  HardHatIcon,
  ShieldCheckIcon,
  UserIcon,
  WrenchIcon,
  HammerIcon,
  SparkleBadgeIcon,
  ConstructionIcon,
} from "@/modules/shared/Icons";

export default function WarrantyTicketsTab({
  warranty = [],
  onUpdateStatus,
  showToast,
}) {
  const [tickets, setTickets] = useState(warranty);

  useEffect(() => {
    setTickets(warranty);
  }, [warranty]);

  const handleToggle = async (ticketId, nextStatus) => {
    const updated = tickets.map((t) => (t.ticket_id === ticketId ? { ...t, status: nextStatus } : t));
    setTickets(updated);
    if (onUpdateStatus) {
      await onUpdateStatus(ticketId, nextStatus);
    }
    showToast(`Warranty ticket ${ticketId} updated to ${nextStatus}.`);
  };

  const getCategoryIcon = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("plumb")) return <WrenchIcon className="w-3.5 h-3.5" />;
    if (c.includes("elect")) return <SparkleBadgeIcon className="w-3.5 h-3.5" />;
    if (c.includes("struct") || c.includes("mason")) return <ConstructionIcon className="w-3.5 h-3.5" />;
    return <HammerIcon className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold uppercase">
            After-Sales Care &amp; Warranty Support
          </span>
          <span className="text-xs font-mono text-neutral-400">Flowchart Phase 5: Post-Turnover Warranty</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
          Client Warranty &amp; Maintenance Tickets
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light max-w-3xl leading-relaxed">
          When projects reach 100% turnover, client portals transition into Warranty Mode. Clients report issues (plumbing, electrical, structural) and track repair team dispatches directly here.
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-900/40">
          <WrenchIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            No Warranty Tickets Reported
          </h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
            All completed projects have zero active defect tickets. When clients report issues via the portal, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <div
              key={t.ticket_id}
              className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                    {t.ticket_id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      t.status === "Resolved"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold"
                        : t.status === "In-Progress"
                        ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 font-bold"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {getCategoryIcon(t.category)}
                    <span>{t.category} Issue</span>
                  </span>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 mt-2 leading-relaxed font-sans">
                    {t.description}
                  </p>
                </div>

                {t.photo_url && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <Image src={t.photo_url} alt="Defect Photo" fill className="object-cover" />
                  </div>
                )}

                <div className="text-[11px] font-mono text-neutral-400 pt-1">
                  <span>Client: {t.client_email}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400">
                  Reported: {new Date(t.reported_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggle(t.ticket_id, "In-Progress")}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] font-mono uppercase cursor-pointer transition-colors"
                  >
                    Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(t.ticket_id, "Resolved")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-[11px] font-mono font-bold uppercase cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
