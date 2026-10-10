"use client";
import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
} from "lucide-react";
import PortalEmptyState from "./PortalEmptyState";

export default function PortalBillingLedgerSection({
  billing = [],
  projectCode = "PRJ-ACTIVE",
  onProofUploaded,
}) {
  const [selectedBillForProof, setSelectedBillForProof] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState("");

  if (!billing || billing.length === 0) {
    return (
      <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-4">
          <CreditCard className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Progress Billing &amp; Escrow
          </h3>
        </div>

        <PortalEmptyState
          type="billing"
          badge="Escrow & Ledgers"
          title="No Billing Invoices Issued"
          description="Progress billings and official receipts will generate as milestones complete."
        />
      </div>
    );
  }

  // Calculate live financial figures from database rows
  const totalContract = billing.reduce((sum, b) => sum + (Number(b.amount_due) || 0), 0);
  const totalPaid = billing
    .filter((b) => (b.status || "").toLowerCase() === "paid")
    .reduce((sum, b) => sum + (Number(b.amount_due) || 0), 0);
  const nextDueBill = billing.find((b) => (b.status || "").toLowerCase() !== "paid");
  const paidPct = totalContract > 0 ? Math.round((totalPaid / totalContract) * 100) : 0;

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedBillForProof) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      // Upload file to cloud storage endpoint
      const uploadRes = await fetch("/api/upload?category=briefs", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload receipt");
      }

      // Attach proof to billing record in database
      const billId = selectedBillForProof.bill_id;
      await fetch(`/api/construction/billing/${billId}/proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: uploadData.url }),
      });

      setUploadToast("Proof of payment submitted successfully! MCPA finance team will verify.");
      setSelectedBillForProof(null);
      setUploadFile(null);
      if (onProofUploaded) onProofUploaded();
    } catch (err) {
      alert("Error uploading proof: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
      {/* Toast Alert */}
      {uploadToast && (
        <div className="p-3.5 rounded-[12px] bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-neutral-950" />
            <span>{uploadToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadToast("")}
            className="text-xs p-1 cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Progress Billing &amp; Escrow
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Milestone Financial Transparency
          </h3>
        </div>

        <span className="text-xs font-mono text-neutral-400">
          Ref: {projectCode}
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Contract */}
        <div className="p-5 rounded-[18px] bg-neutral-900 dark:bg-black text-white space-y-1">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Total Contract
          </span>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-white">
            ₱{totalContract.toLocaleString("en-PH")}
          </p>
        </div>

        {/* Total Paid */}
        <div className="p-5 rounded-[18px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Settled to Date
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {paidPct}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
            ₱{totalPaid.toLocaleString("en-PH")}
          </p>
          <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>

        {/* Next Due */}
        <div className="p-5 rounded-[18px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Next Milestone Due
          </span>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-neutral-900 dark:text-white">
            ₱{nextDueBill ? Number(nextDueBill.amount_due).toLocaleString("en-PH") : "0"}
          </p>
          <p className="text-[11px] font-mono text-neutral-400 truncate">
            {nextDueBill ? nextDueBill.milestone_title : "All payments settled"}
          </p>
        </div>
      </div>

      {/* Informational Banner (As seen in Mobile/Tablet mockup Screen 4) */}
      <div className="p-3.5 rounded-[12px] bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
        <span>
          Next progress billing release is scheduled upon structural sign-off of active milestone.
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
          Escrow Guaranteed
        </span>
      </div>

      {/* Billing Milestones Table */}
      <div className="overflow-x-auto rounded-[16px] border border-neutral-200 dark:border-white/5">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-50 dark:bg-white/[0.02] text-neutral-400 border-b border-neutral-200 dark:border-white/5 text-[10.5px] uppercase">
            <tr>
              <th className="p-3.5">Milestone Description</th>
              <th className="p-3.5">Official Receipt</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
            {billing.map((item, idx) => {
              const isPaid = (item.status || "").toLowerCase() === "paid";
              const isPending = (item.status || "").toLowerCase().includes("awaiting");

              return (
                <tr
                  key={item.bill_id || idx}
                  className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <td className="p-3.5 font-bold text-neutral-900 dark:text-white">
                    <span>{item.milestone_title}</span>
                    {item.due_date && (
                      <span className="block text-[10px] text-neutral-400 font-normal">
                        Due: {item.due_date}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-neutral-500">
                    {item.or_number ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.or_number}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-neutral-900 dark:text-white">
                    ₱{Number(item.amount_due).toLocaleString("en-PH")}
                  </td>
                  <td className="p-3.5">
                    {/* Clean status text with dot, no background pill on non-buttons */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPaid
                            ? "bg-amber-500"
                            : isPending
                            ? "bg-amber-400 animate-pulse"
                            : "bg-neutral-400"
                        }`}
                      />
                      <span
                        className={
                          isPaid
                            ? "text-amber-600 dark:text-amber-400"
                            : isPending
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-neutral-500"
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={() => setSelectedBillForProof(item)}
                        className="px-3 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Submit Proof
                      </button>
                    ) : item.proof_url ? (
                      <a
                        href={item.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>View Slip</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-neutral-400">Verified</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Proof of Payment Upload Modal */}
      {selectedBillForProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[20px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-500" />
                <span>Upload Proof of Payment</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedBillForProof(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono space-y-1">
              <p className="text-neutral-500">
                Milestone: <strong>{selectedBillForProof.milestone_title}</strong>
              </p>
              <p className="text-neutral-500">
                Amount Due:{" "}
                <strong className="text-amber-600 dark:text-amber-400">
                  ₱{Number(selectedBillForProof.amount_due).toLocaleString("en-PH")}
                </strong>
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
              <div className="p-6 rounded-[12px] border-2 border-dashed border-neutral-300 dark:border-white/10 text-center space-y-2">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="text-xs"
                />
                <p className="text-[10px] font-mono text-neutral-400">
                  Upload bank deposit slip, online transfer receipt (JPG, PNG, PDF up to 10MB)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedBillForProof(null)}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-4 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  {isUploading ? "Uploading..." : "Submit Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
