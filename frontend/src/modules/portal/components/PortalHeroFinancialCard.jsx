"use client";
import { useState } from "react";
import { Eye, EyeOff, CreditCard, Calendar, TrendingUp } from "lucide-react";

export default function PortalHeroFinancialCard({
  billingLedger = [],
  contractValue = null,
  onViewBilling,
  onScheduleSite,
}) {
  const [showBalance, setShowBalance] = useState(true);

  // Compute live financial totals from database billing ledger
  const totalContract = contractValue
    ? Number(contractValue)
    : billingLedger.reduce((sum, b) => sum + (Number(b.amount_due) || 0), 0);

  const totalPaid = billingLedger
    .filter((b) => (b.status || "").toLowerCase() === "paid")
    .reduce((sum, b) => sum + (Number(b.amount_due) || 0), 0);

  const remainingBalance = Math.max(0, totalContract - totalPaid);
  const paidPct = totalContract > 0 ? Math.round((totalPaid / totalContract) * 100) : 0;

  const formattedBalance = remainingBalance.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-900 dark:bg-[#0c0d12] text-white p-5 sm:p-7 shadow-xl border border-neutral-800 dark:border-white/10 transition-all duration-300">
      {/* Ambient brand amber background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-5 sm:space-y-6">
        {/* Top Header Label & Privacy Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-400 font-semibold">
              Project Investment Balance
            </span>
            <span className="text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>{paidPct}% Settled</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={showBalance ? "Hide Balance" : "Show Balance"}
            aria-label="Toggle balance visibility"
          >
            {showBalance ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Currency Display */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-mono tracking-tight text-white">
              {showBalance ? `₱${formattedBalance}` : "••••••••••"}
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            {showBalance
              ? `Total Contract: ₱${totalContract.toLocaleString("en-PH")} • Paid: ₱${totalPaid.toLocaleString("en-PH")}`
              : "Financial balance hidden for privacy"}
          </p>
        </div>

        {/* Quick Action Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onViewBilling}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 text-white font-mono font-semibold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <span>View Billing</span>
          </button>

          <button
            type="button"
            onClick={onScheduleSite}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 border border-amber-400 text-neutral-950 font-mono font-bold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
          >
            <Calendar className="w-4 h-4 text-neutral-950 shrink-0" />
            <span>Site Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}
