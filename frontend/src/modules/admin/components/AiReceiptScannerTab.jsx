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
  const [vendorName, setVendorName] = useState("Bulacan Steel & Hardware Supply");
  const [extractedTotal, setExtractedTotal] = useState("18450.00");
  const [receiptImage, setReceiptImage] = useState("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop");
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState(expenses);

  useEffect(() => {
    setScanHistory(expenses);
  }, [expenses]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const randomTotals = ["14,250.00", "28,900.50", "9,800.00", "45,120.00"];
      const randomTotal = randomTotals[Math.floor(Math.random() * randomTotals.length)];
      setExtractedTotal(randomTotal.replace(",", ""));
      showToast("OCR Scan complete! Total amount extracted via pattern regex.");
    }, 1200);
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
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

      showToast(`Expense of ₱${Number(extractedTotal).toLocaleString()} logged successfully!`);
    } catch (err) {
      showToast("Could not sync with backend.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold uppercase">
            Machine Learning &amp; AI Integration
          </span>
          <span className="text-xs font-mono text-neutral-400">Feature 8: OCR Hardware Slip Reader</span>
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
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white">
            Receipt Optical Scanner
          </h3>

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-purple-500/30 bg-neutral-950 flex items-center justify-center group">
            <Image src={receiptImage} alt="Hardware Receipt" fill className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs font-mono uppercase transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                {isScanning ? (
                  "Scanning Receipt Text..."
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <ScanLineIcon className="w-4 h-4" />
                    <span>Run OCR Scan</span>
                  </span>
                )}
              </button>
              <span className="text-[10px] font-mono text-purple-200/80 mt-2">
                Simulates Tesseract.js optical regex reader
              </span>
            </div>
          </div>

          <form onSubmit={handleLogExpense} className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Detected Hardware Vendor</label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
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
                value={extractedTotal}
                onChange={(e) => setExtractedTotal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-emerald-600 dark:text-emerald-400 text-base font-bold font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono uppercase transition-all cursor-pointer shadow-md shadow-purple-600/25"
            >
              Log Expense to Project Ledger
            </button>
          </form>
        </div>

        {/* Scan History Ledger */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white">
            Recent OCR Scanned Expenses
          </h3>

          <div className="space-y-3">
            {scanHistory.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs font-mono">
                No receipt expenses recorded yet. Scan a receipt to log site purchases.
              </div>
            ) : (
              scanHistory.map((item) => {
                const itemId = item.expense_id || item.id;
                const vendor = item.vendor_name || item.vendor || "Hardware Supplier";
                const total = parseFloat(item.extracted_total || item.total || 0);
                const itemsDesc = item.raw_ocr_text || item.items || "Hardware supply materials";
                const logDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : (item.date || "Recent");

                return (
                  <div
                    key={itemId}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-white/5 space-y-1"
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
