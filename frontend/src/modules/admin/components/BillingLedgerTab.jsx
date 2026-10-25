"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Plus,
  X,
  FileText,
  UploadCloud,
  ScanLine,
  Receipt,
  Sparkles,
  ShieldCheck,
  Check,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import Stage3CustomerSelector from "./Stage3CustomerSelector";
import AdminEmptyState from "./AdminEmptyState";
import { authFetch } from "@/modules/shared/authFetch";

export default function BillingLedgerTab({
  project = null,
  projects = [],
  billing = [],
  expenses: initialExpenses = [],
  onSelectProject,
  onVerifyPayment,
  onUploadProof,
  onCreateBillingTranche,
  showToast,
}) {
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [uploadingBillId, setUploadingBillId] = useState(null);
  const [isAddTrancheOpen, setIsAddTrancheOpen] = useState(false);
  const [trancheTitle, setTrancheTitle] = useState("");
  const [trancheAmount, setTrancheAmount] = useState("");
  const [trancheDueDate, setTrancheDueDate] = useState("");
  const [isSubmittingTranche, setIsSubmittingTranche] = useState(false);

  // Supply Receipts & OCR Scanner state
  const [expenses, setExpenses] = useState(initialExpenses);
  const [boqTrades, setBoqTrades] = useState([]);
  const [boqMilestones, setBoqMilestones] = useState([]);

  useEffect(() => {
    if (!project?.project_code && !project?.client_project_id) return;
    const projId = project.client_project_id || project.project_code;
    let isMounted = true;
    authFetch(`/api/projects/${encodeURIComponent(projId)}/quotation`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.quotation) {
          if (Array.isArray(data.quotation.items_breakdown)) {
            setBoqTrades(data.quotation.items_breakdown);
          }
          if (Array.isArray(data.quotation.payment_milestones)) {
            setBoqMilestones(data.quotation.payment_milestones);
          }
        }
      })
      .catch((err) => console.warn("[BillingLedgerTab] Could not load project BOQ quotation:", err));

    return () => {
      isMounted = false;
    };
  }, [project?.project_code, project?.client_project_id]);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [extractedTotal, setExtractedTotal] = useState("");
  const [rawOcrNotes, setRawOcrNotes] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [isReceiptFullscreenOpen, setIsReceiptFullscreenOpen] = useState(false);
  const [ocrZoom, setOcrZoom] = useState(1);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptUploadError, setReceiptUploadError] = useState("");
  const [useManualReceiptUrl, setUseManualReceiptUrl] = useState(false);
  const receiptFileInputRef = useRef(null);

  const resetOcrModal = () => {
    setIsOcrModalOpen(false);
    setReceiptImage("");
    setReceiptPreview("");
    setReceiptUploadError("");
    setVendorName("");
    setExtractedTotal("");
    setRawOcrNotes("");
    setParsedItems([]);
    setUseManualReceiptUrl(false);
    setIsUploadingReceipt(false);
    setIsScanningOcr(false);
    setIsReceiptFullscreenOpen(false);
    setOcrZoom(1);
    if (receiptFileInputRef.current) receiptFileInputRef.current.value = "";
  };

  const handleRemoveItem = (indexToRemove) => {
    setParsedItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      const newSum = updated.reduce((acc, it) => {
        const lineVal = it.lineTotal || (it.unitPrice && it.quantity ? it.unitPrice * parseFloat(it.quantity) : 0);
        return acc + (lineVal || 0);
      }, 0);
      if (newSum > 0) {
        setExtractedTotal(formatCommaNumber(newSum));
      }
      return updated;
    });
  };

  const handleReceiptFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setReceiptUploadError("Please select a valid image file (PNG, JPG, WebP) or PDF receipt.");
      return;
    }
    setReceiptUploadError("");
    const localUrl = URL.createObjectURL(file);
    setReceiptPreview(localUrl);
    setIsUploadingReceipt(true);
    setIsScanningOcr(true);

    try {
      // 1. Storage upload for permanent cloud asset
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadPromise = authFetch("/api/upload?category=briefs", {
        method: "POST",
        body: uploadFormData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
        return data.url;
      });

      // 2. Real AI / OCR Analysis directly on the file
      const ocrFormData = new FormData();
      ocrFormData.append("file", file);
      const ocrPromise = authFetch("/api/construction/scan-receipt", {
        method: "POST",
        body: ocrFormData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "OCR Scan failed");
        return data;
      });

      // Await both simultaneously
      const [uploadedUrl, ocrData] = await Promise.all([uploadPromise, ocrPromise]);

      setReceiptImage(uploadedUrl);

      // Auto-fill Detected Hardware / Store
      if (ocrData.vendorName) {
        setVendorName(ocrData.vendorName);
      }

      // Auto-fill Extracted Total (with comma formatting)
      if (ocrData.extractedTotalFormatted) {
        setExtractedTotal(ocrData.extractedTotalFormatted);
      } else if (ocrData.extractedTotal) {
        setExtractedTotal(formatCommaNumber(ocrData.extractedTotal));
      }

      // Auto-fill OCR Verification Summary / Item Lines
      if (ocrData.summaryText) {
        setRawOcrNotes(ocrData.summaryText);
      }

      if (Array.isArray(ocrData.items)) {
        setParsedItems(ocrData.items);
      }

      if (showToast) {
        showToast(`Receipt analyzed: ${ocrData.vendorName || "Store"} • Total: ₱${ocrData.extractedTotalFormatted || ocrData.extractedTotal}`);
      }
    } catch (err) {
      console.error("Receipt upload/OCR error:", err);
      setReceiptUploadError(err.message || "Upload/OCR analysis failed. Please verify connection.");
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsUploadingReceipt(false);
      setIsScanningOcr(false);
    }
  };

  const handleAutoScanReceipt = async (url) => {
    if (!url) return;
    setIsScanningOcr(true);
    setReceiptUploadError("");
    try {
      const res = await authFetch("/api/construction/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const ocrData = await res.json();
      if (!res.ok) throw new Error(ocrData.message || "OCR Scan failed");

      if (ocrData.vendorName) setVendorName(ocrData.vendorName);
      if (ocrData.extractedTotalFormatted) {
        setExtractedTotal(ocrData.extractedTotalFormatted);
      } else if (ocrData.extractedTotal) {
        setExtractedTotal(formatCommaNumber(ocrData.extractedTotal));
      }
      if (ocrData.summaryText) setRawOcrNotes(ocrData.summaryText);
      if (Array.isArray(ocrData.items)) setParsedItems(ocrData.items);

      if (showToast) {
        showToast(`OCR Scan Completed: ₱${ocrData.extractedTotalFormatted || ocrData.extractedTotal}`);
      }
    } catch (err) {
      console.error("Manual URL OCR error:", err);
      setReceiptUploadError(err.message || "Failed to scan URL.");
      if (showToast) showToast("Scan error: " + err.message);
    } finally {
      setIsScanningOcr(false);
    }
  };

  useEffect(() => {
    if (initialExpenses && initialExpenses.length > 0) {
      setExpenses(initialExpenses);
      return;
    }
    if (!project?.project_code) return;
    let isMounted = true;
    authFetch(`/api/construction/expenses/${encodeURIComponent(project.project_code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.expenses) {
          setExpenses(data.expenses);
        }
      })
      .catch((err) => console.warn("[BillingLedgerTab] Error loading expenses:", err));
    return () => {
      isMounted = false;
    };
  }, [project?.project_code, initialExpenses]);

  const totalContract = billing.reduce((acc, curr) => acc + parseFloat(curr.amount_due || 0), 0);
  const totalPaid = billing
    .filter((b) => b.status === "Paid")
    .reduce((acc, curr) => acc + parseFloat(curr.amount_due || 0), 0);
  const remainingBalance = totalContract - totalPaid;
  const totalMaterialExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.extracted_total || 0), 0);

  // Number formatting with comma thousands separators (e.g. 150000 -> "150,000")
  const formatCommaNumber = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const cleaned = String(val).replace(/[^\d.]/g, "");
    if (cleaned === "") return "";
    const parts = cleaned.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? integerPart + "." + parts.slice(1).join("") : integerPart;
  };

  const handleAmountChange = (val, setter) => {
    if (val === "") {
      setter("");
      return;
    }
    const formatted = formatCommaNumber(val);
    setter(formatted);
  };

  const handleVerify = async (billId, hasProof) => {
    if (!hasProof) {
      if (showToast) showToast("Cannot verify: Client proof of payment must be uploaded first.");
      return;
    }
    try {
      if (onVerifyPayment) {
        await onVerifyPayment(billId);
      } else {
        const res = await authFetch(`/api/construction/billing/${billId}/verify`, { method: "PATCH" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to verify");
      }
      if (showToast) showToast("Payment verified! Digital Official Receipt (OR) generated.");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    }
  };

  const handleAdminUploadProof = async (billId, file) => {
    if (!file) return;
    setUploadingBillId(billId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch("/api/upload?category=briefs", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");

      if (onUploadProof) {
        await onUploadProof(billId, data.url);
      } else {
        const patchRes = await authFetch(`/api/construction/billing/${billId}/proof`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proofUrl: data.url }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchData.message || "Failed to attach proof");
      }
      if (showToast) showToast("Proof slip attached! Ready for payment verification.");
    } catch (err) {
      if (showToast) showToast("Error attaching slip: " + err.message);
    } finally {
      setUploadingBillId(null);
    }
  };

  const handleCreateTranche = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(String(trancheAmount).replace(/,/g, ""));
    if (!trancheTitle || !cleanAmount || !project) return;

    setIsSubmittingTranche(true);
    try {
      if (onCreateBillingTranche) {
        await onCreateBillingTranche({
          projectCode: project.project_code,
          milestoneTitle: trancheTitle,
          amountDue: cleanAmount,
          dueDate: trancheDueDate,
        });
      } else {
        const res = await authFetch("/api/construction/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            milestoneTitle: trancheTitle,
            amountDue: cleanAmount,
            dueDate: trancheDueDate,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create tranche");
      }
      if (showToast) showToast("Billing tranche added successfully!");
      setIsAddTrancheOpen(false);
      setTrancheTitle("");
      setTrancheAmount("");
      setTrancheDueDate("");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSubmittingTranche(false);
    }
  };


  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const cleanTotal = parseFloat(String(extractedTotal).replace(/,/g, ""));
    if (!vendorName || !cleanTotal || !project) return;

    setIsSavingExpense(true);
    try {
      const res = await authFetch("/api/construction/expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectCode: project.project_code,
          vendorName,
          receiptImageUrl: receiptImage,
          extractedTotal: cleanTotal,
          rawOcrText: rawOcrNotes || `RECEIPT: ${vendorName}\nAMOUNT: ₱${cleanTotal}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save expense");

      setExpenses((prev) => [data.expense, ...prev]);
      if (showToast) showToast(`Material receipt of ₱${Number(cleanTotal).toLocaleString()} logged!`);
      resetOcrModal();
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingExpense(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STAGE 3 CUSTOMER SELECTOR */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Stage3CustomerSelector
          selectedProject={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />

        {project && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-3.5 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-amber-500" />
              <span>Upload Material Receipt (OCR)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddTrancheOpen(true)}
              className="px-3.5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Billing Tranche</span>
            </button>
          </div>
        )}
      </div>

      {!project ? (
        <AdminEmptyState
          variant="card"
          iconSrc="https://cdn.lordicon.com/qhviklyi.json"
          fallback={CreditCard}
          size={104}
          colors="primary:#f59e0b,secondary:#10b981"
          badgeText="Stage 3 • Financial Tranches & Billing"
          title="No Stage 3 Client Project Selected"
          description="Select an active Stage 3 project above to manage milestone tranches, verify digital official receipts, and audit OCR supplier invoices."
        />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Financial Summary Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 block mb-1">
                Total Contract Value
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                ₱{totalContract.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono block mt-1">Based on approved BOQ quotation</span>
            </div>

            <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 block mb-1">
                Total Verified Paid
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                ₱{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-600/80 font-mono block mt-1">Issued with Digital OR</span>
            </div>

            <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 block mb-1">
                Remaining Balance
              </span>
              <span className="text-2xl font-bold text-amber-500 font-mono tabular-nums">
                ₱{remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono block mt-1">Payable in milestone tranches</span>
            </div>

            <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 block mb-1">
                Procurement / OCR Receipts
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                ₱{totalMaterialExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono block mt-1">{expenses.length} verified supplier slips</span>
            </div>
          </div>

          {/* Payment Method Banner */}
          <div className="p-4 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="text-neutral-500 uppercase">Assigned Payment Terms:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {project.payment_mode || "Milestone Escrow (Progressive Release)"}
              </span>
            </div>
            <span className="text-neutral-400">
              Client: {project.client_name} ({project.project_code})
            </span>
          </div>

          {/* Milestone Billing Table */}
          <div className="rounded-[8px] border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] overflow-hidden shadow-xs space-y-4">
            <div className="p-5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono">
                  Milestone Payment Schedule &amp; Receipt Ledger
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Client submits deposit slips or online payment proofs. Proof is required before clicking &quot;Verify Payment&quot; to issue an official Digital OR.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">{billing.length} Invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/5 text-neutral-500 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Milestone Tranche</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Proof of Payment</th>
                    <th className="py-3 px-4">Official Receipt (OR)</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/5 font-mono">
                  {billing.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-neutral-400 font-mono">
                        No billing tranches created for this project yet. Click &quot;Add Billing Tranche&quot; to schedule milestone billings.
                      </td>
                    </tr>
                  ) : (
                    billing.map((item, idx) => {
                      const isPaid = (item.status || "").toLowerCase() === "paid";
                      const isUnderReview = (item.status || "").toLowerCase().includes("review");
                      const hasProof = Boolean(item.proof_url && item.proof_url.trim() !== "");
                      const isRowUploading = uploadingBillId === item.bill_id;

                      return (
                        <tr key={item.bill_id || idx} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 font-sans font-semibold text-neutral-900 dark:text-white">
                            {item.milestone_title}
                          </td>
                          <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400 text-sm">
                            ₱{parseFloat(item.amount_due || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-neutral-500">
                            {item.due_date || "Upon Milestone"}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isPaid
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : isUnderReview
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                  : "bg-neutral-100 dark:bg-white/5 text-neutral-500 border-neutral-200 dark:border-white/10"
                              }`}
                            >
                              {item.status || "Pending"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {hasProof ? (
                              <button
                                type="button"
                                onClick={() => setSelectedProofUrl(item.proof_url)}
                                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Inspect Slip</span>
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="text-neutral-400 italic text-[11px] inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-500/70 shrink-0" />
                                  <span>No proof uploaded</span>
                                </span>
                                {!isPaid && (
                                  <label className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer hover:underline">
                                    {isRowUploading ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <UploadCloud className="w-3 h-3" />
                                        <span>Attach Slip</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      disabled={isRowUploading}
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleAdminUploadProof(item.bill_id, file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {item.or_number ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {item.or_number}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[11px]">Pending Payment</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {!isPaid ? (
                              hasProof ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(item.bill_id, hasProof)}
                                  className="px-3 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Verify &amp; Issue OR</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="Proof of payment is required before verification. Wait for client to upload deposit slip or click 'Attach Slip'."
                                  className="px-3 py-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-400 dark:text-neutral-500 font-mono font-medium text-xs cursor-not-allowed inline-flex items-center gap-1 opacity-70"
                                >
                                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Awaiting Proof</span>
                                </button>
                              )
                            ) : (
                              <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verified Supply Invoices & OCR Audit Feed */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
              <div>
                <h4 className="text-sm font-bold uppercase font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <span>Verified Material Invoices ({expenses.length} Records)</span>
                </h4>
                <p className="text-xs text-neutral-500 font-light">
                  Direct hardware store slips scanned via OCR and reflected onto client billing for 100% cost transparency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="px-3 py-1.5 rounded-[6px] bg-amber-500 text-neutral-950 font-bold font-mono text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Receipt Slip</span>
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs font-mono text-neutral-400 italic">
                Zero material slips logged for this project yet. Use the OCR scanner to upload supply receipts.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expenses.map((exp, idx) => (
                  <div
                    key={exp.expense_id || idx}
                    className="p-3.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-white/5 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="uppercase">{exp.created_at ? new Date(exp.created_at).toLocaleDateString() : "Recent"}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">OCR Verified</span>
                    </div>
                    <h5 className="font-bold text-neutral-900 dark:text-white truncate">
                      {exp.vendor_name || "Hardware Supply Depot"}
                    </h5>
                    <p className="text-[11px] text-neutral-500 line-clamp-2">
                      {exp.raw_ocr_text || "Official Store Invoice"}
                    </p>
                    <div className="pt-2 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                        ₱{Number(exp.extracted_total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      {exp.receipt_image_url && (
                        <a
                          href={exp.receipt_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-600 hover:underline"
                        >
                          View Image
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BILLING TRANCHE */}
      {isAddTrancheOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-[14px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4 my-auto overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Add Milestone Billing Tranche</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddTrancheOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTranche} className="space-y-3.5 text-xs font-mono">
              {(boqMilestones.length > 0 || boqTrades.length > 0) && (
                <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick-fill from Project BOQ / Quotation:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {boqMilestones.length > 0
                      ? boqMilestones.map((bm, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setTrancheTitle(bm.milestone || `Milestone ${idx + 1}`);
                              if (bm.amount) {
                                handleAmountChange(String(bm.amount), setTrancheAmount);
                              }
                            }}
                            className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#12151e] hover:bg-amber-500 hover:text-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            + {bm.milestone} ({bm.percentage}%)
                          </button>
                        ))
                      : boqTrades.map((bt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setTrancheTitle(bt.category);
                            }}
                            className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#12151e] hover:bg-amber-500 hover:text-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            + {bt.category}
                          </button>
                        ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-neutral-500 mb-1">Tranche / Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={trancheTitle}
                  onChange={(e) => setTrancheTitle(e.target.value)}
                  placeholder="e.g. 1st Progress Billing (Substructure & Foundation)"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Amount Due (PHP ₱) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-amber-500 select-none pointer-events-none">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={trancheAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setTrancheAmount)}
                    placeholder="e.g. 150,000"
                    className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={trancheDueDate}
                  onChange={(e) => setTrancheDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddTrancheOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors cursor-pointer font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTranche}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingTranche ? "Saving..." : "Save Tranche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OCR SUPPLY RECEIPT SCANNER */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-[14px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden my-auto">
            {/* STICKY HEADER */}
            <div className="shrink-0 px-5 py-3.5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#12151e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>AI Construction Receipt Scanner</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">OCR</span>
                  </h4>
                  <p className="text-[10.5px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Reads handwritten &amp; printed official hardware receipts, invoices &amp; cash slips
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetOcrModal}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <form onSubmit={handleSaveExpense} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[11px] font-bold uppercase">
                    Official Hardware Receipt File *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseManualReceiptUrl(!useManualReceiptUrl)}
                    className="text-[10.5px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {useManualReceiptUrl ? (
                      <>
                        <UploadCloud className="w-3 h-3" />
                        <span>Switch to File Upload</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3 h-3" />
                        <span>Or Paste Direct URL</span>
                      </>
                    )}
                  </button>
                </div>

                {useManualReceiptUrl ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={receiptImage}
                      onChange={(e) => setReceiptImage(e.target.value)}
                      placeholder="https://.../receipt-slip.jpg"
                      className="flex-1 px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#0c0e14] font-mono text-xs transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoScanReceipt(receiptImage)}
                      className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-bold cursor-pointer transition-colors"
                    >
                      Scan
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={receiptFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleReceiptFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />

                    {receiptImage || receiptPreview ? (
                      <div className="relative rounded-[8px] overflow-hidden border border-neutral-200 dark:border-amber-500/30 bg-neutral-100/80 dark:bg-[#0c0e14] p-2 space-y-2">
                        <div
                          className="group relative w-full h-48 rounded-[6px] overflow-hidden bg-white dark:bg-neutral-950 flex items-center justify-center cursor-pointer border border-neutral-200 dark:border-neutral-800 shadow-2xs"
                          onClick={() => {
                            setOcrZoom(1);
                            setIsReceiptFullscreenOpen(true);
                          }}
                          title="Click to view receipt in Fullscreen"
                        >
                          {receiptPreview?.endsWith(".pdf") ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 text-neutral-400">
                              <FileText className="w-10 h-10 text-amber-500" />
                              <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">PDF Receipt Document</span>
                            </div>
                          ) : (
                            <img
                              src={receiptPreview || receiptImage}
                              alt="Receipt Slip"
                              className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
                            />
                          )}

                          {/* Fullscreen Quick-Action Badge */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                            <span className="px-2.5 py-1 rounded-[6px] bg-white/95 hover:bg-white text-neutral-800 dark:bg-black/80 dark:hover:bg-black dark:text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-sm border border-neutral-200 dark:border-white/10 backdrop-blur-xs transition-colors">
                              <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                              Fullscreen
                            </span>
                          </div>

                          {isUploadingReceipt && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-neutral-900 dark:text-white p-3 text-center z-20">
                              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">Processing Receipt Slip...</span>
                              <span className="text-[10.5px] font-mono text-neutral-600 dark:text-neutral-300">Scanning products, quantities &amp; prices</span>
                            </div>
                          )}
                        </div>

                        {!isUploadingReceipt && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Official Receipt Attached &amp; Analyzed</span>
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setOcrZoom(1);
                                  setIsReceiptFullscreenOpen(true);
                                }}
                                className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Maximize2 className="w-3 h-3" /> Fullscreen
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptImage("");
                                  setReceiptPreview("");
                                  setParsedItems([]);
                                  if (receiptFileInputRef.current) receiptFileInputRef.current.value = "";
                                }}
                                className="text-[11px] font-mono text-rose-500 hover:underline cursor-pointer self-end sm:self-auto"
                              >
                                Change File
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleReceiptFileSelect(file);
                        }}
                        onClick={() => receiptFileInputRef.current?.click()}
                        className="w-full p-6 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/70 hover:bg-neutral-100/60 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            Click to upload or drag &amp; drop hardware receipt slip
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            PNG, JPG, WebP, PDF
                          </p>
                        </div>
                      </div>
                    )}

                    {receiptUploadError && (
                      <p className="text-[11px] font-mono text-rose-500 mt-1.5">{receiptUploadError}</p>
                    )}
                  </div>
                )}
              </div>

              {isScanningOcr && (
                <div className="p-3 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-2.5">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-mono">
                    AI OCR reading receipt text &amp; summarizing line items, quantities, and prices...
                  </span>
                </div>
              )}

              {/* Extracted Products & Itemized Summary */}
              {parsedItems && parsedItems.length > 0 && (
                <div className="rounded-[8px] border border-amber-500/30 bg-amber-50/50 dark:bg-[#0c0e14] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Extracted Itemized Summary ({parsedItems.length} items)</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      Total: <span className="font-bold text-neutral-900 dark:text-white">₱ {extractedTotal || "0.00"}</span>
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {parsedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-2 px-2.5 rounded-[6px] bg-white dark:bg-[#161922] border border-neutral-200 dark:border-white/5 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold w-4 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {item.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          {(item.quantity || item.qty) && (
                            <span className="text-neutral-500 dark:text-neutral-400 text-[10.5px]">
                              {item.quantity || item.qty} {item.unit || "pc"}
                              {item.unitPrice ? ` @ ₱${formatCommaNumber(item.unitPrice)}` : ""}
                            </span>
                          )}
                          <span className="font-bold text-neutral-900 dark:text-white">
                            ₱{formatCommaNumber(item.lineTotal || item.amount || (item.unitPrice && item.quantity ? item.unitPrice * parseFloat(item.quantity) : 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 dark:text-neutral-400 mb-1 text-xs font-medium">Detected Hardware / Store *</label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. New Lite Lumber or Wilcon Depot"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#0c0e14] font-sans text-xs transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 dark:text-neutral-400 mb-1 text-xs font-medium">Extracted Total (PHP ₱) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-bold text-amber-500 select-none pointer-events-none">
                      ₱
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={extractedTotal}
                      onChange={(e) => handleAmountChange(e.target.value, setExtractedTotal)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#0c0e14] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 dark:text-neutral-400 mb-1 text-xs font-medium">OCR Verification Summary / Item Lines</label>
                <textarea
                  rows={3}
                  value={rawOcrNotes}
                  onChange={(e) => setRawOcrNotes(e.target.value)}
                  placeholder="Official receipt lines, cement bags, rebar specifications..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#0c0e14] font-mono text-xs leading-relaxed transition-colors"
                />
              </div>
            </div>

            {/* STICKY FOOTER - ALWAYS ACCESSIBLE */}
            <div className="shrink-0 px-5 py-3.5 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/90 dark:bg-[#0e1017] flex items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                {extractedTotal ? (
                  <span>
                    Total: <strong className="text-neutral-900 dark:text-white">₱{extractedTotal}</strong>
                    {parsedItems?.length > 0 && ` (${parsedItems.length} items)`}
                  </span>
                ) : (
                  <span>Upload a hardware receipt to auto-extract</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetOcrModal}
                  className="px-3.5 py-1.5 rounded-[6px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5 font-medium transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense || isUploadingReceipt || !vendorName || !extractedTotal || !receiptImage}
                  className="px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 text-xs select-none"
                >
                  {isSavingExpense ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : isUploadingReceipt ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Save Slip</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* FULLSCREEN RECEIPT INSPECTOR MODAL */}
      {isReceiptFullscreenOpen && (receiptPreview || receiptImage) && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReceiptFullscreenOpen(false);
          }}
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 text-white shrink-0 bg-neutral-950/90 rounded-t-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Receipt Inspector
              </span>
              {vendorName && (
                <span className="text-xs font-medium text-neutral-300">
                  • {vendorName}
                </span>
              )}
              {extractedTotal && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  (₱ {extractedTotal})
                </span>
              )}
            </div>

            {/* Controls: Zoom In, Zoom Out, Reset, Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOcrZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-1.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOcrZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-1.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOcrZoom(1)}
                className="px-2.5 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-xs font-mono text-white cursor-pointer transition-colors"
                title="Reset Zoom"
              >
                {Math.round(ocrZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptFullscreenOpen(false)}
                className="p-1.5 rounded-[6px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 cursor-pointer transition-colors ml-2"
                title="Close Fullscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Canvas with Pan / Scroll / Zoom */}
          <div className="flex-1 bg-black/80 rounded-b-[10px] overflow-auto flex items-center justify-center p-4">
            {receiptPreview?.endsWith(".pdf") ? (
              <iframe
                src={receiptPreview || receiptImage}
                className="w-full h-full rounded-[6px] border border-white/10"
                title="PDF Receipt Viewer"
              />
            ) : (
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center"
                style={{ transform: `scale(${ocrZoom})`, transformOrigin: "center center" }}
              >
                <img
                  src={receiptPreview || receiptImage}
                  alt="Receipt Fullscreen"
                  className="max-h-[82vh] max-w-full object-contain rounded-[6px] shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW PAYMENT PROOF SLIP */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-950 rounded-[12px] border border-white/10 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between text-white">
              <span className="text-xs font-mono font-bold">Uploaded Proof of Payment</span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[400px] bg-black">
              <Image
                src={selectedProofUrl}
                alt="Proof of Payment"
                fill
                sizes="100vw"
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
