"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  ShieldCheckIcon,
  LockIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "@/modules/shared/Icons";

export default function BillingLedgerTab({
  project,
  billing = [],
  onVerifyPayment,
  showToast,
}) {
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  const totalContract = billing.reduce((acc, curr) => acc + parseFloat(curr.amount_due || 0), 0);
  const totalPaid = billing
    .filter((b) => b.status === "Paid")
    .reduce((acc, curr) => acc + parseFloat(curr.amount_due || 0), 0);
  const remainingBalance = totalContract - totalPaid;

  const handleVerify = async (billId) => {
    await onVerifyPayment(billId);
    showToast("Payment verified! Digital Official Receipt (OR) generated.");
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
            Total Contract Milestone Value
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
            ₱{totalContract.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono block mt-1">Based on signed construction contract</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
            Total Verified Payments (Paid)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ₱{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono block mt-1">Verified with digital Official Receipts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
            Auto-Computed Remaining Balance
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
            ₱{remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono block mt-1">Real-time ledger balance</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
              Milestone Payment Schedule &amp; Receipt Ledger
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Payments remain &quot;Pending&quot; or &quot;Under Review&quot; until verified by admin. Once marked &quot;Paid&quot;, an official Digital OR is issued automatically.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Milestone Tranche</th>
                <th className="py-3.5 px-4">Amount Due</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Proof of Payment</th>
                <th className="py-3.5 px-4">Official Receipt (OR)</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5 font-mono">
              {billing.map((item) => {
                const isPaid = item.status === "Paid";
                return (
                  <tr key={item.bill_id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-sans font-semibold text-neutral-900 dark:text-white">
                      {item.milestone_title}
                    </td>
                    <td className="py-4 px-4 font-bold text-neutral-900 dark:text-white">
                      ₱{parseFloat(item.amount_due).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-neutral-500">{item.due_date || "—"}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isPaid
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                            : item.proof_url
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-bold animate-pulse"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold"
                        }`}
                      >
                        {isPaid ? "Paid / Verified" : item.proof_url ? "Proof Uploaded" : "Pending Due"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {item.proof_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(item.proof_url)}
                          className="text-sky-600 dark:text-sky-400 underline hover:text-sky-500 text-[11px] cursor-pointer font-semibold"
                        >
                          View Slip
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">— No Slip —</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {item.or_number ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>{item.or_number}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Unissued</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isPaid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          ✓ Verified ({item.paid_date})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerify(item.bill_id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] uppercase transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          Verify &amp; Issue OR
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PROOF OF PAYMENT PREVIEW */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white">
                Client Proof of Payment Slip
              </h4>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-700">
              <Image src={selectedProofUrl} alt="Bank Deposit Slip" fill className="object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase cursor-pointer transition-colors shadow-md shadow-amber-500/20"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
