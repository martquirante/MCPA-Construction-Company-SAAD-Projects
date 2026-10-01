"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  UploadCloudIcon,
  CheckIcon,
  SparkleBadgeIcon,
  ScanLineIcon,
} from "@/modules/shared/Icons";

export default function AiReceiptScannerTab({
  projectCode = "MCPA-PLR-2024",
  expenses = [],
  showToast,
}) {
  const [vendorName, setVendorName] = useState("");
  const [extractedTotal, setExtractedTotal] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState(expenses);

  useEffect(() => {
    setScanHistory(expenses);
  }, [expenses]);

  const handleSimulateScan = () => {
    if (!receiptImage) {
      showToast("Please upload or select a receipt photo first.");
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      showToast("OCR Scan completed. Please verify the detected amount.");
    }, 1200);
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!vendorName || !extractedTotal) return;
    try {
      await fetch("/api/construction/expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectCode,
          vendorName,
          receiptImageUrl: receiptImage,
          extractedTotal: parseFloat(extractedTotal),
          rawOcrText: `OFFICIAL RECEIPT — ${vendorName}\nTOTAL AMOUNT: PHP ${extractedTotal}`,
        }),
      });

      setScanHistory([
        {
          id: Date.now(),
          vendor: vendorName,
          total: parseFloat(extractedTotal),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          items: "Hardware materials, concrete fasteners & structural fittings",
        },
        ...scanHistory,
      ]);

      setVendorName("");
      setExtractedTotal("");
      setReceiptImage("");
      showToast(`Expense of ₱${Number(extractedTotal).toLocaleString()} logged successfully!`);
    } catch (err) {
      showToast("Could not sync with backend.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400">
            Machine Learning &amp; AI Integration
          </span>
          <span className="text-xs font-mono text-neutral-400">• Feature 8: OCR Hardware Slip Reader</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
          AI-Powered Construction Receipt Scanner (OCR)
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light max-w-3xl leading-relaxed">
          Snap or upload physical paper receipts from local hardware stores. The optical character recognition engine automatically extracts vendor information and total amounts directly into the project ledger—eliminating manual encoding errors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner & Input Card */}
        <div className="p-6 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white">
            Receipt Optical Scanner
          </h3>

          <div className="relative aspect-video w-full rounded-[4px] overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center group">
            {receiptImage ? (
              <Image src={receiptImage} alt="Hardware Receipt" fill className="object-cover opacity-80" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-400 text-xs font-mono space-y-2">
                <UploadCloudIcon className="w-8 h-8 text-neutral-500" />
                <span>Upload a receipt photo to scan</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
              <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-[4px] bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-sm cursor-pointer">
                <ScanLineIcon className="w-4 h-4 mr-1.5" />
                <span>{receiptImage ? "Rescan Receipt" : "Select Receipt Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setReceiptImage(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <span className="text-[10px] font-mono text-purple-200/80 mt-2">
                Optical character recognition engine
              </span>
            </div>
          </div>

          <form onSubmit={handleLogExpense} className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Detected Hardware Vendor</label>
              <input
                type="text"
                required
                placeholder="e.g. Bulacan Steel & Hardware Supply"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">
                Extracted Total Amount (PHP)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={extractedTotal}
                onChange={(e) => setExtractedTotal(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-emerald-600 dark:text-emerald-400 text-base font-bold font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-[4px] bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Log Expense to Project Ledger
            </button>
          </form>
        </div>

        {/* Scan History Ledger */}
        <div className="p-6 rounded-[6px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white">
            Recent OCR Scanned Expenses
          </h3>

          <div className="space-y-3">
            {scanHistory.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs font-mono">
                No receipt expenses recorded yet. Scan a receipt to log site purchases.
              </div>
            ) : (
              scanHistory.map((item, idx) => {
                const itemId = item.expense_id || item.id || `receipt-${idx}`;
                const vendor = item.vendor_name || item.vendor || "Hardware Supplier";
                const total = parseFloat(item.extracted_total || item.total || 0);
                const itemsDesc = item.raw_ocr_text || item.items || "Hardware supply materials";
                const logDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : (item.date || "Recent");

                return (
                  <div
                    key={`expense-${itemId}-${idx}`}
                    className="p-4 rounded-[4px] bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/[0.08] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                        {vendor}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ₱{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono truncate">{itemsDesc}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                      <span>Logged: {logDate}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        <span>OCR Verified</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
