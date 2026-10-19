"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CreditCard,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Building,
  Check,
  Plus,
  Trash2,
  Edit3,
  Save,
  Send,
  Search,
  ChevronDown,
  RefreshCw,
  Sliders,
  Sparkles,
  Calculator,
  HelpCircle,
  HardHat,
  ArrowRight,
  User,
  MapPin,
} from "lucide-react";
import authFetch from "@/modules/shared/authFetch";
import LordIcon from "@/modules/shared/LordIcon";
import { resolveClientAvatar } from "@/modules/admin/components/InquiryPipelineTab";

// Clean blank slate: Zero pre-filled trades by default (Admin adds trades on demand)
const DEFAULT_BOQ_TEMPLATE = [];

const COMMON_TRADE_SUGGESTIONS = [
  "General Requirements & Mobilization",
  "Earthworks & Structural Concrete",
  "Masonry & CHB Works",
  "Structural Steel & Metal Roofing",
  "Plumbing, Sanitary & Drainage Lines",
  "Electrical & Lighting Works",
  "Doors, Windows & Glazing",
  "Architectural Finishes",
  "Others / Special Scopes",
];

const DEFAULT_MILESTONES = [
  { milestone: "Mobilization & Downpayment", percentage: 15, trigger: "Contract Execution & Building Permit Release" },
  { milestone: "Foundation & Substructure", percentage: 20, trigger: "Footing Concrete Pouring & Ground Slab Curing" },
  { milestone: "Structural Framing & Slabs", percentage: 25, trigger: "Second Floor Slab & Column Beam Completion" },
  { milestone: "Roofing & Enclosure", percentage: 20, trigger: "Trusses, Longspan Roofing & Exterior CHB Walls" },
  { milestone: "Finishes & MEP Roughing-in", percentage: 15, trigger: "Tiling, Painting, Doors, Windows & Electrical Fixtures" },
  { milestone: "Final Punchlist & Turnover", percentage: 5, trigger: "Occupancy Permit & Golden Key Handover Ceremony" },
];
 
function ClientAvatar({ client, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = useMemo(() => {
    return resolveClientAvatar({
      ...client,
      clientName: client?.client_name,
      clientEmail: client?.client_email,
    });
  }, [client]);

  const isGoogle =
    client?.client_email?.toLowerCase().endsWith("@gmail.com") ||
    client?.auth_provider === "google";

  const sizeClasses = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  }[size] || "w-9 h-9 text-xs";

  const initials = (client?.client_name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl && !imgError ? (
        <img
          key={avatarUrl || client?.client_project_id || "avatar"}
          src={avatarUrl}
          alt={client?.client_name || "Client"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`${sizeClasses} rounded-full object-cover border border-amber-500/30 shadow-xs`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-white/[0.08] dark:to-white/[0.02] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-bold items-center justify-center font-mono uppercase shadow-xs flex`}
        >
          {initials}
        </div>
      )}
      {isGoogle && (size === "md" || size === "lg") && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs"
          title="Google Account Verified"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
        </span>
      )}
    </div>
  );
}

// Format string or number with thousands comma separators (e.g. 1500000 -> "1,500,000", 1250.5 -> "1,250.5")
export const formatCommaNumber = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const cleaned = String(val).replace(/[^\d.]/g, "");
  if (cleaned === "") return "";
  const parts = cleaned.split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? integerPart + "." + parts.slice(1).join("") : integerPart;
};

// Input change handler for text inputs that format numbers with commas on the fly
export const handleCommaInputChange = (e, setter) => {
  const inputVal = e.target.value;
  if (inputVal === "") {
    setter("");
    return;
  }
  const formatted = formatCommaNumber(inputVal);
  setter(formatted);
};

// Format budget range string with commas if it contains raw numbers
export const formatBudgetDisplay = (str) => {
  if (!str) return "Pending";
  return String(str).replace(/\b\d{4,}\b/g, (m) => Number(m).toLocaleString("en-PH"));
};

// Extract duration months from client brief inquiry (e.g. "Within 3-6 Months" -> 6, "1 Year & 6 Months" -> 18)
export const parseDurationMonths = (target) => {
  if (!target) return "";
  const str = String(target).toLowerCase();

  // Check for combined e.g. "1 year & 6 months", "1.5 years", "2 years"
  if (str.includes("year") || str.includes("taon") || str.includes("yr")) {
    const yMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:year|taon|yr)s?/);
    const mMatch = str.match(/(\d+)\s*(?:month|buwan|mo)s?/);
    let total = 0;
    if (yMatch) total += parseFloat(yMatch[1]) * 12;
    if (mMatch) total += parseInt(mMatch[1], 10);
    if (total > 0) return String(Math.round(total));
    return "12";
  }

  if (str.includes("month") || str.includes("buwan") || str.includes("mo")) {
    const numbers = str.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return String(Number(numbers[numbers.length - 1]));
    }
  }

  const pureNum = str.match(/^\d+$/);
  if (pureNum) return String(Number(pureNum[0]));

  return "";
};

// Format months into human-readable years and months (e.g. 14 -> "1 Year & 2 Months", 18 -> "1 Year & 6 Months", 12 -> "1 Year")
export const formatDurationHuman = (months) => {
  const num = Number(months);
  if (!num || isNaN(num) || num <= 0) return "";
  if (num < 12) {
    return `${num} ${num === 1 ? "Month" : "Months"}`;
  }
  const years = Math.floor(num / 12);
  const remainingMonths = num % 12;
  const yearStr = `${years} ${years === 1 ? "Year" : "Years"}`;
  if (remainingMonths === 0) {
    return yearStr;
  }
  const monthStr = `${remainingMonths} ${remainingMonths === 1 ? "Month" : "Months"}`;
  return `${yearStr} & ${monthStr}`;
};

export default function AdminBudgetQuotationTab({
  clientBriefs = [],
  allProjects = [],
  currentUser = null,
  showToast = () => {},
}) {
  // State: Overview of all projects & quotations
  const [clients, setClients] = useState([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL" | "REQUESTED" | "PUBLISHED" | "DRAFT"

  // State: Active Quotation Form / Workbench (Clean blank slate: Zero pre-filled dummy values)
  const [quotationId, setQuotationId] = useState(null);
  const [status, setStatus] = useState("PUBLISHED"); // "DRAFT" | "PUBLISHED"
  const [durationMonths, setDurationMonths] = useState("");
  const [financingType, setFinancingType] = useState("Bank Financing");
  const [clientTargetBudget, setClientTargetBudget] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [laborRateBasis, setLaborRateBasis] = useState("Custom Labor Sizing");
  const [architectFee, setArchitectFee] = useState("");
  const [engineerFee, setEngineerFee] = useState("");
  const [contractorProfitPct, setContractorProfitPct] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [itemsBreakdown, setItemsBreakdown] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newScopeTitle, setNewScopeTitle] = useState("");
  const [newScopeQty, setNewScopeQty] = useState("");
  const [newScopeUnit, setNewScopeUnit] = useState("");
  const [newScopeUnitCost, setNewScopeUnitCost] = useState("");
  const [newScopeNotes, setNewScopeNotes] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Admin Quotations Overview
  const fetchOverview = async (silent = false) => {
    if (!silent) setIsLoadingOverview(true);
    try {
      const res = await authFetch("/api/admin/quotations/overview");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.clients)) {
          setClients(data.clients);
          setPendingRequestsCount(data.pendingRequestsCount || 0);

          // Update active selected client if already chosen
          if (selectedClient) {
            const updated = data.clients.find(
              (c) => c.client_project_id === selectedClient.client_project_id
            );
            if (updated) setSelectedClient(updated);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch quotations overview:", err);
    } finally {
      if (!silent) setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await authFetch("/api/admin/quotations/overview");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && Array.isArray(data.clients)) {
            setClients(data.clients);
            setPendingRequestsCount(data.pendingRequestsCount || 0);
          }
        }
      } catch (err) {
        console.warn("Initial load error:", err);
      } finally {
        if (isMounted) setIsLoadingOverview(false);
      }
    })();

    const handleSync = () => fetchOverview(true);
    window.addEventListener("mcpa-quotations-updated", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("mcpa-quotations-updated", handleSync);
    };
  }, []);

  // Parse numerical budget value from client inquiry
  const parseBudgetValue = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const match = String(val).replace(/,/g, "").match(/\d+(\.\d+)?/g);
    if (match && match.length > 0) {
      const parsed = parseFloat(match[0]);
      if (String(val).toLowerCase().includes("m")) {
        return parsed < 100 ? parsed * 1000000 : parsed;
      } else if (String(val).toLowerCase().includes("k")) {
        return parsed * 1000;
      }
      return parsed;
    }
    return 0;
  };

  // When a client is selected, populate the Estimating Workbench
  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setIsClientDropdownOpen(false);

    // Initial inquiry target budget
    const target = parseBudgetValue(client.budget_range);
    setClientTargetBudget(target > 0 ? formatCommaNumber(target) : "");
    setFinancingType(client.financing_option || client.quotation_financing || "Bank Financing");

    // Auto-adjust months from client inquiry timeline or quotation
    const clientMonths = parseDurationMonths(client.target_date || client.preferred_timeline);
    setDurationMonths(client.duration_months ? String(client.duration_months) : (clientMonths || ""));

    // Fetch existing quotation record from backend if any
    try {
      const res = await authFetch(`/api/projects/${client.client_project_id}/quotation`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quotation) {
          const q = data.quotation;
          setQuotationId(q.quotation_id);
          setStatus(q.status === "DRAFT" ? "DRAFT" : "PUBLISHED");
          const qMonths =
            q.duration_months !== undefined && q.duration_months !== null && q.duration_months !== ""
              ? String(q.duration_months)
              : clientMonths || "";
          setDurationMonths(qMonths);
          setFinancingType(q.financing_type || "Bank Financing");
          setClientTargetBudget(
            q.client_target_budget
              ? formatCommaNumber(q.client_target_budget)
              : target > 0
              ? formatCommaNumber(target)
              : ""
          );
          setLaborCost(q.labor_cost ? formatCommaNumber(q.labor_cost) : "");
          setLaborRateBasis(q.labor_rate_basis || "Custom Labor Sizing");
          setArchitectFee(q.architect_fee ? formatCommaNumber(q.architect_fee) : "");
          setEngineerFee(q.engineer_fee ? formatCommaNumber(q.engineer_fee) : "");
          setContractorProfitPct(
            q.contractor_profit_pct !== undefined && q.contractor_profit_pct !== null && q.contractor_profit_pct !== ""
              ? String(q.contractor_profit_pct)
              : ""
          );
          setAdminNotes(q.admin_notes || "");
          if (q.items_breakdown && Array.isArray(q.items_breakdown) && q.items_breakdown.length > 0) {
            const hasAnyItems = q.items_breakdown.some((cat) => (cat.items || []).length > 0);
            if (!hasAnyItems && q.items_breakdown.length === 9) {
              setItemsBreakdown([]);
            } else {
              const formattedItems = q.items_breakdown.map((cat) => ({
                ...cat,
                items: (cat.items || []).map((it) => ({
                  ...it,
                  qty: it.qty !== undefined && it.qty !== null && it.qty !== "" ? formatCommaNumber(it.qty) : "",
                  unitCost: it.unitCost !== undefined && it.unitCost !== null && it.unitCost !== "" ? formatCommaNumber(it.unitCost) : "",
                })),
              }));
              setItemsBreakdown(formattedItems);
            }
          } else {
            setItemsBreakdown([]);
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch project quotation details:", err);
    }

    // Fallback: new draft initialized with clean blank slate (Zero dummy values, zero default trades)
    setQuotationId(null);
    setStatus("PUBLISHED");
    setItemsBreakdown([]);
    setLaborCost("");
    setLaborRateBasis("Custom Labor Sizing");
    setArchitectFee("");
    setEngineerFee("");
    setContractorProfitPct("");
    setAdminNotes("");
    setDurationMonths(clientMonths || "");
  };

  // Calculations for Estimating Workbench
  const totalMaterialsCost = useMemo(() => {
    return itemsBreakdown.reduce((acc, cat) => {
      const items = cat.items || [];
      return acc + items.reduce((s, it) => {
        const q = Number(String(it.qty || 0).replace(/,/g, "")) || 0;
        const uc = Number(String(it.unitCost || 0).replace(/,/g, "")) || 0;
        return s + (Number(it.total) || (q * uc) || 0);
      }, 0);
    }, 0);
  }, [itemsBreakdown]);

  const numLaborCost = Number(String(laborCost || 0).replace(/,/g, "")) || 0;
  const numArchitectFee = Number(String(architectFee || 0).replace(/,/g, "")) || 0;
  const numEngineerFee = Number(String(engineerFee || 0).replace(/,/g, "")) || 0;
  const numClientTargetBudget = Number(String(clientTargetBudget || 0).replace(/,/g, "")) || 0;
  const numContractorProfitPct = Number(contractorProfitPct) || 0;

  // Effective labor cost (if linked to 35% standard labor allocation, recalculate dynamically)
  const effectiveLaborCost = useMemo(() => {
    if (laborRateBasis.includes("35%")) {
      return Math.round(totalMaterialsCost * 0.35);
    }
    return numLaborCost;
  }, [laborRateBasis, totalMaterialsCost, numLaborCost]);

  const contractorProfitAmount = useMemo(() => {
    const directCost = totalMaterialsCost + Number(effectiveLaborCost || 0) + numArchitectFee + numEngineerFee;
    return Math.round(directCost * (numContractorProfitPct / 100));
  }, [totalMaterialsCost, effectiveLaborCost, numArchitectFee, numEngineerFee, numContractorProfitPct]);

  const totalAmount = useMemo(() => {
    return totalMaterialsCost + Number(effectiveLaborCost || 0) + numArchitectFee + numEngineerFee + contractorProfitAmount;
  }, [totalMaterialsCost, effectiveLaborCost, numArchitectFee, numEngineerFee, contractorProfitAmount]);

  // Budget Variance in PHP and %
  const varianceAmount = useMemo(() => {
    if (!numClientTargetBudget) return 0;
    return totalAmount - numClientTargetBudget;
  }, [totalAmount, numClientTargetBudget]);

  const variancePct = useMemo(() => {
    if (!numClientTargetBudget) return 0;
    return (varianceAmount / numClientTargetBudget) * 100;
  }, [varianceAmount, numClientTargetBudget]);

  // Dynamically computed payment milestones
  const paymentMilestones = useMemo(() => {
    return DEFAULT_MILESTONES.map((m) => ({
      milestone: m.milestone,
      percentage: m.percentage,
      amount: Math.round(totalAmount * (m.percentage / 100)),
      trigger: m.trigger,
    }));
  }, [totalAmount]);

  // Formatting helpers (with comma thousand separators)
  const formatPHP = (val) => {
    const num = Number(String(val || 0).replace(/,/g, "")) || 0;
    return (
      "₱" +
      num.toLocaleString("en-PH", {
        minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })
    );
  };

  // Update item in items breakdown
  const handleItemChange = (catIdx, itemIdx, field, val) => {
    setItemsBreakdown((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const targetItem = copy[catIdx].items[itemIdx];
      
      if (field === "qty" || field === "unitCost") {
        const formatted = val === "" ? "" : formatCommaNumber(val);
        targetItem[field] = formatted;
        const q = Number(String(field === "qty" ? formatted : targetItem.qty).replace(/,/g, "")) || 0;
        const uc = Number(String(field === "unitCost" ? formatted : targetItem.unitCost).replace(/,/g, "")) || 0;
        targetItem.total = q * uc;
      } else {
        targetItem[field] = val;
      }
      return copy;
    });
  };

  // Add line item to a specific category
  const handleAddItemToCategory = (catIdx) => {
    setItemsBreakdown((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[catIdx].items.push({
        item: "",
        qty: "",
        unit: "",
        unitCost: "",
        total: 0,
        notes: "",
      });
      return copy;
    });
  };

  // Remove line item
  const handleDeleteItem = (catIdx, itemIdx) => {
    setItemsBreakdown((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[catIdx].items.splice(itemIdx, 1);
      return copy;
    });
  };

  // Add custom scope item to "Others"
  const handleAddCustomOtherScope = () => {
    if (!newScopeTitle.trim()) {
      showToast?.("Please enter a title for the custom scope item.", "error");
      return;
    }
    const q = Number(String(newScopeQty).replace(/,/g, "")) || 1;
    const uc = Number(String(newScopeUnitCost).replace(/,/g, "")) || 0;
    const newItem = {
      item: newScopeTitle.trim(),
      qty: formatCommaNumber(q),
      unit: newScopeUnit || "lot",
      unitCost: formatCommaNumber(uc),
      total: q * uc,
      notes: newScopeNotes.trim(),
    };

    setItemsBreakdown((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let othersCat = copy.find((c) => c.category.toLowerCase().includes("other"));
      if (!othersCat) {
        othersCat = { category: "Others / Special Scopes", items: [] };
        copy.push(othersCat);
      }
      othersCat.items.push(newItem);
      return copy;
    });

    setNewScopeTitle("");
    setNewScopeQty("");
    setNewScopeUnit("");
    setNewScopeUnitCost("");
    setNewScopeNotes("");
    showToast?.("Custom scope item added to quotation.", "success");
  };

  const handleApplyStandardTemplate = () => {
    setItemsBreakdown(
      COMMON_TRADE_SUGGESTIONS.map((trade) => ({ category: trade, items: [] }))
    );
    setIsTemplateModalOpen(false);
    showToast?.("Applied standard 9 Philippine construction trades as clean template.", "success");
  };

  const handleApplyTemplateFromQuotation = async (sourceClient) => {
    setIsLoadingTemplate(true);
    try {
      const res = await authFetch(`/api/projects/${sourceClient.client_project_id}/quotation`);
      if (!res.ok) throw new Error("Could not load quotation record");
      const data = await res.json();
      if (
        !data.success ||
        !data.quotation ||
        !Array.isArray(data.quotation.items_breakdown) ||
        data.quotation.items_breakdown.length === 0
      ) {
        showToast?.("No trade breakdown found in this project to use as template.", "error");
        return;
      }

      // Strip all numerical values (qty, unitCost, total) while keeping trade categories, item names, units, and notes
      const strippedTemplate = data.quotation.items_breakdown.map((cat) => ({
        category: cat.category,
        items: (cat.items || []).map((it) => ({
          item: it.item || "",
          qty: "",
          unit: it.unit || "lot",
          unitCost: "",
          total: 0,
          notes: it.notes || "",
        })),
      }));

      setItemsBreakdown(strippedTemplate);
      setIsTemplateModalOpen(false);
      showToast?.(
        `Applied BOQ structure from ${sourceClient.project_code || sourceClient.client_name} as template. All quantities and rates are cleared for this project!`,
        "success"
      );
    } catch (err) {
      showToast?.("Error loading template: " + err.message, "error");
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Save or Publish Quotation
  const handleSaveQuotation = async (newStatus) => {
    if (!selectedClient) return;
    setIsSaving(true);
    try {
      const payload = {
        quotationId,
        clientProjectId: selectedClient.client_project_id,
        projectCode: selectedClient.project_code,
        briefId: selectedClient.brief_id,
        clientName: selectedClient.client_name,
        clientEmail: selectedClient.client_email,
        clientPhone: selectedClient.client_phone,
        projectType: selectedClient.project_type,
        location: selectedClient.location,
        durationMonths: Number(durationMonths) || 6,
        financingType,
        status: newStatus,
        clientTargetBudget: numClientTargetBudget,
        materialsCost: totalMaterialsCost,
        laborCost: Number(String(effectiveLaborCost).replace(/,/g, "")) || 0,
        laborRateBasis,
        architectFee: numArchitectFee,
        engineerFee: numEngineerFee,
        contractorProfitPct: Number(contractorProfitPct) || 0,
        contractorProfitAmount,
        totalAmount,
        varianceAmount,
        variancePct,
        itemsBreakdown: itemsBreakdown.map((cat) => ({
          category: cat.category,
          items: (cat.items || []).map((it) => {
            const q = Number(String(it.qty).replace(/,/g, "")) || 0;
            const uc = Number(String(it.unitCost).replace(/,/g, "")) || 0;
            return {
              item: it.item || "",
              qty: q,
              unit: it.unit || "",
              unitCost: uc,
              total: q * uc,
              notes: it.notes || "",
            };
          }),
        })),
        paymentMilestones,
        adminNotes,
      };

      const res = await authFetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(newStatus);
        if (data.quotation?.quotation_id) {
          setQuotationId(data.quotation.quotation_id);
        }
        showToast?.(
          newStatus === "PUBLISHED"
            ? "Official Quotation published to Client Portal with PDF ready!"
            : "Quotation draft saved successfully.",
          "success"
        );
        fetchOverview(true);
        window.dispatchEvent(new CustomEvent("mcpa-quotations-updated"));
      } else {
        showToast?.(data.message || "Failed to save quotation.", "error");
      }
    } catch (err) {
      showToast?.("Network connection issue saving quotation.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = clientSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        (c.project_code && c.project_code.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filterStatus === "REQUESTED") return c.quotation_status === "REQUESTED";
      if (filterStatus === "PUBLISHED") return c.quotation_status === "PUBLISHED";
      if (filterStatus === "DRAFT") return c.quotation_status === "DRAFT";
      return true;
    });
  }, [clients, clientSearchQuery, filterStatus]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: Project Selector & Status Filter                      */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[11px] font-mono">
            <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Phase 2: Consultation &amp; Planning
            </span>
            {pendingRequestsCount > 0 && (
              <>
                <span className="text-neutral-400">•</span>
                <span className="font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {pendingRequestsCount} Pending Client Request{pendingRequestsCount > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>Budget &amp; Official Quotation Workbench</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
            Formulate itemized Bill of Quantities (BOQ), materials takeoff, labor sizing, and professional fees with real-time budget reconciliation.
          </p>
        </div>

        {/* Project Selector Combobox */}
        <div className="relative shrink-0 w-full sm:w-80" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsClientDropdownOpen((prev) => !prev)}
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs font-mono text-left flex items-center justify-between hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <div className="truncate flex items-center gap-2.5 min-w-0">
              {selectedClient ? (
                <>
                  <ClientAvatar client={selectedClient} size="sm" />
                  <div className="truncate min-w-0">
                    <span className="font-bold text-neutral-900 dark:text-white block truncate">
                      {selectedClient.client_name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono block truncate">
                      {selectedClient.project_code} • {selectedClient.quotation_status || "No Quotation"}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-neutral-400">Select Client Project to Quote...</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
          </button>

          {isClientDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-96 rounded-[14px] bg-white dark:bg-[#12141c] border border-neutral-200 dark:border-white/10 shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Search client name or code..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 pt-1 pb-1 border-b border-neutral-200 dark:border-white/5 text-[10px] font-mono">
                {["ALL", "REQUESTED", "PUBLISHED", "DRAFT"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-0.5 rounded uppercase font-bold transition-colors cursor-pointer ${
                      filterStatus === st
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-neutral-100 dark:divide-white/5">
                {filteredClients.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono text-neutral-400">
                    No matching projects found
                  </div>
                ) : (
                  filteredClients.map((c) => (
                    <div
                      key={c.client_project_id}
                      onClick={() => handleSelectClient(c)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-colors text-left flex items-center gap-3 ${
                        selectedClient?.client_project_id === c.client_project_id
                          ? "bg-amber-500/10 border border-amber-500/30"
                          : "hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <ClientAvatar client={c} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold font-mono text-xs text-neutral-900 dark:text-white truncate">
                            {c.client_name}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                              c.quotation_status === "REQUESTED"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : c.quotation_status === "PUBLISHED"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-neutral-200 dark:bg-white/10 text-neutral-500"
                            }`}
                          >
                            {c.quotation_status || "UNQUOTED"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                          <span>{c.project_code}</span>
                          <span>•</span>
                          <span className="truncate">Target: {formatBudgetDisplay(c.budget_range)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEWPORT: EMPTY STATE VS ACTIVE ESTIMATING WORKBENCH          */}
      {/* ------------------------------------------------------------- */}
      {!selectedClient ? (
        /* EMPTY STATE: Large Animated LordIcon from CDN API */
        <div className="p-12 sm:p-20 text-center rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-6 shadow-xs">
          <LordIcon
            src="https://cdn.lordicon.com/qhgmphtg.json"
            size={96}
            trigger="loop"
            colors="primary:#f59e0b,secondary:#38bdf8"
            fallback={CreditCard}
          />
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-bold font-mono uppercase text-neutral-900 dark:text-white">
              Select a Client Project to Formulate Budget &amp; Quotation
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
              Use the project selector above to open a client&apos;s quotation workbench. Formulate trade line-items, calculate structural labor and engineering professional fees, compare live variance against the client&apos;s stated budget, and publish an official monochrome A4 PDF quotation.
            </p>
          </div>

          {/* Quick Pending Requests Queue */}
          {clients.filter((c) => c.quotation_status === "REQUESTED").length > 0 && (
            <div className="max-w-2xl mx-auto text-left pt-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
                Clients Awaiting Quotation ({clients.filter((c) => c.quotation_status === "REQUESTED").length})
              </span>
              <div className="divide-y divide-neutral-200 dark:divide-white/5 rounded-xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] overflow-hidden">
                {clients
                  .filter((c) => c.quotation_status === "REQUESTED")
                  .map((c) => (
                    <div
                      key={c.client_project_id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ClientAvatar client={c} size="md" />
                        <div className="min-w-0">
                          <span className="font-bold font-mono text-neutral-900 dark:text-white block truncate">
                            {c.client_name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 truncate block">
                            {c.project_code} • Stated Budget: {formatBudgetDisplay(c.budget_range)} • {c.location || "Bulacan"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="px-3.5 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Estimate Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE ESTIMATING WORKBENCH */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Client Baseline & Status Header Card */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/5">
              <div className="flex items-center gap-3.5">
                <ClientAvatar client={selectedClient} size="lg" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                    Quoting Project
                  </span>
                  <h3 className="text-lg font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>{selectedClient.client_name}</span>
                    <span className="text-xs font-mono text-neutral-400">({selectedClient.project_code})</span>
                  </h3>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    status === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {status === "PUBLISHED" ? "Official Published" : "Draft Formulation"}
                </span>

                <a
                  href={`/api/projects/${selectedClient.client_project_id}/quotation/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>A4 PDF</span>
                </a>
              </div>
            </div>

            {/* Baseline Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Stated Inquiry Budget</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={clientTargetBudget}
                  onChange={(e) => handleCommaInputChange(e, setClientTargetBudget)}
                  placeholder="0"
                  className="w-full bg-transparent font-bold font-mono text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Financing Scheme</span>
                <select
                  value={financingType}
                  onChange={(e) => setFinancingType(e.target.value)}
                  className="w-full bg-transparent font-bold font-mono text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Bank Financing" className="dark:bg-[#12141c]">Bank Financing</option>
                  <option value="Pag-IBIG Housing Loan" className="dark:bg-[#12141c]">Pag-IBIG Housing Loan</option>
                  <option value="Build Now Pay Later (Deferred)" className="dark:bg-[#12141c]">Build Now Pay Later (Deferred)</option>
                  <option value="Milestone Progress Billing" className="dark:bg-[#12141c]">Milestone Progress Billing</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Project Scope</span>
                <p className="font-bold font-mono text-neutral-900 dark:text-white truncate">
                  {selectedClient.project_type || "Residential Turnkey"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-0.5">Location</span>
                <p className="font-bold font-mono text-neutral-900 dark:text-white truncate">
                  {selectedClient.location || "Bulacan"}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Real-Time Budget Reconciliation Bar (KPIs & Variance) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Construction Investment */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                <span>Quotation Total</span>
                <Calculator className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                {formatPHP(totalAmount)}
              </p>
              <p className="text-[11px] text-neutral-500 font-sans mt-1">
                Turnkey Contract Guaranteed Total
              </p>
            </div>

            {/* Client Stated Budget */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                <span>Client Stated Budget</span>
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                {numClientTargetBudget > 0 ? formatPHP(numClientTargetBudget) : "Unspecified"}
              </p>
              <p className="text-[11px] text-neutral-500 font-sans mt-1">
                Baseline from Client Brief
              </p>
            </div>

            {/* Real-Time Variance in ₱ and % */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                <span>Budget Variance</span>
                {varianceAmount <= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p
                className={`text-2xl font-bold font-mono ${
                  varianceAmount < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : varianceAmount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {numClientTargetBudget > 0
                  ? varianceAmount < 0
                    ? `-${formatPHP(Math.abs(varianceAmount))}`
                    : varianceAmount > 0
                    ? `+${formatPHP(varianceAmount)}`
                    : "₱0"
                  : "Balanced"}
              </p>
              <p className="text-[11px] text-neutral-500 font-sans mt-1">
                {numClientTargetBudget > 0
                  ? varianceAmount < 0
                    ? `-${Math.abs(variancePct).toFixed(1)}% Under Client Budget (Savings)`
                    : varianceAmount > 0
                    ? `+${variancePct.toFixed(1)}% Above Client Budget`
                    : "0.0% Exact Budget Match"
                  : "No Target Specified"}
              </p>
            </div>

            {/* Construction Timeline */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase mb-2">
                <span>Construction Duration</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  className="w-16 text-2xl font-bold font-mono text-neutral-900 dark:text-white bg-transparent border-b border-neutral-300 dark:border-white/10 focus:outline-none focus:border-amber-500"
                />
                <span className="text-base font-mono font-bold text-neutral-500">
                  {Number(durationMonths) === 1 ? "Month" : "Months"}
                </span>
                {Number(durationMonths) >= 12 && (
                  <span className="text-xs font-mono font-semibold text-amber-500 dark:text-amber-400">
                    ({formatDurationHuman(durationMonths)})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 font-sans mt-1">
                {Number(durationMonths) >= 12
                  ? `${formatDurationHuman(durationMonths)} Turnkey Construction Schedule`
                  : "Turnkey Construction Schedule"}
              </p>
            </div>
          </div>

          {/* 3. Cost Component Sizing (Materials, Labor, Professional Fees, Profit Margin) */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Major Cost Sizing &amp; Markups
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                General Contractor Financial Parameters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Direct Materials Takeoff */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  1. Direct Materials Takeoff
                </span>
                <p className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                  {formatPHP(totalMaterialsCost)}
                </p>
                <span className="text-[10px] text-neutral-500 font-sans">
                  Computed from {itemsBreakdown.reduce((acc, cat) => acc + (cat.items || []).length, 0)} line-items
                </span>
              </div>

              {/* Direct Labor Sizing */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">
                    2. Direct Labor Cost
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLaborRateBasis("Standard Labor Allocation (35%)");
                      setLaborCost(formatCommaNumber(Math.round(totalMaterialsCost * 0.35)));
                    }}
                    className="text-[9px] font-mono uppercase text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Set 35%
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-neutral-400">₱</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={laborRateBasis.includes("35%") ? formatCommaNumber(effectiveLaborCost) : laborCost}
                    onChange={(e) => {
                      handleCommaInputChange(e, setLaborCost);
                      setLaborRateBasis("Custom Labor Sizing");
                    }}
                    placeholder="0"
                    className="w-full text-base font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 font-sans block">
                  {durationMonths
                    ? `${formatDurationHuman(durationMonths)} Crew Allocation${Number(durationMonths) >= 12 ? ` (${durationMonths} mos)` : ""}`
                    : "Turnkey Crew Allocation"}
                </span>
              </div>

              {/* Professional Fees */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                  3. Professional Fees (Archi + Engr)
                </span>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 block">Architect:</span>
                    <div className="flex items-center">
                      <span className="text-[10px] font-mono text-neutral-400 mr-0.5">₱</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={architectFee}
                        onChange={(e) => handleCommaInputChange(e, setArchitectFee)}
                        placeholder="0"
                        className="w-full font-bold font-mono text-xs text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-white/10 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 block">Engineer:</span>
                    <div className="flex items-center">
                      <span className="text-[10px] font-mono text-neutral-400 mr-0.5">₱</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={engineerFee}
                        onChange={(e) => handleCommaInputChange(e, setEngineerFee)}
                        placeholder="0"
                        className="w-full font-bold font-mono text-xs text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-white/10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 font-sans block">
                  Total: {formatPHP(numArchitectFee + numEngineerFee)}
                </span>
              </div>

              {/* Contractor Profit Margin */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                  4. Contractor Margin &amp; Overhead
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={contractorProfitPct}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d.]/g, "");
                      const parts = cleaned.split(".");
                      setContractorProfitPct(parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned);
                    }}
                    placeholder="0"
                    className="w-16 font-bold font-mono text-base text-amber-600 dark:text-amber-400 bg-transparent border-b border-neutral-200 dark:border-white/10 focus:outline-none"
                  />
                  <span className="font-mono text-xs text-neutral-400">% Markup</span>
                </div>
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                  = {formatPHP(contractorProfitAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Trade-by-Trade BOQ Estimating Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white tracking-wider">
                  Itemized Bill of Quantities (BOQ) Breakdown
                </h3>
                <p className="text-xs text-neutral-500 font-sans">
                  Edit line items, quantities, and rates for each construction trade.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-3 py-1.5 rounded-[8px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use BOQ Template</span>
                </button>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  {itemsBreakdown.length} Trades Active
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {itemsBreakdown.length === 0 ? (
                <div className="p-8 sm:p-10 rounded-[16px] bg-white dark:bg-[#101218] border border-dashed border-neutral-300 dark:border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping opacity-35" />
                    <LordIcon
                      src="https://cdn.lordicon.com/wzwygmng.json"
                      trigger="loop"
                      delay="2000"
                      colors="primary:#f59e0b,secondary:#e5e7eb"
                      size={64}
                    />
                  </div>
                  <div className="max-w-md mx-auto">
                    <p className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Clean Slate: No Trades Active
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1">
                      Walang default trades. Maaari kang mag-umpisa mula sa blangko, gumamit ng past project quotation bilang template (walang kasamang values), o pumili ng standard trades sa ibaba.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="px-4 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choose Template from Past Projects</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyStandardTemplate}
                      className="px-3.5 py-2 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Standard 9 Trades (Blank)</span>
                    </button>
                  </div>
                </div>
              ) : (
                itemsBreakdown.map((categoryGroup, catIdx) => {
                const isOthers = categoryGroup.category.toLowerCase().includes("other");
                return (
                  <div
                    key={catIdx}
                    className={`rounded-[14px] bg-white dark:bg-[#101218] border overflow-hidden ${
                      isOthers ? "border-amber-500/40" : "border-neutral-200 dark:border-white/5"
                    }`}
                  >
                    <div className="px-5 py-3.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                          {categoryGroup.category}
                        </span>
                        {isOthers && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            Custom Client Scopes
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                          {formatPHP(
                            (categoryGroup.items || []).reduce(
                              (s, it) =>
                                s +
                                (Number(it.total) ||
                                  Number(String(it.qty || 0).replace(/,/g, "")) *
                                    Number(String(it.unitCost || 0).replace(/,/g, "")) ||
                                  0),
                              0
                            )
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItemToCategory(catIdx)}
                          className="px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemsBreakdown((prev) => prev.filter((_, idx) => idx !== catIdx));
                            showToast?.(`Removed ${categoryGroup.category} trade category.`, "info");
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove Trade Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Category Items */}
                    <div className="divide-y divide-neutral-200 dark:divide-white/5">
                      {(categoryGroup.items || []).length === 0 ? (
                        <div className="py-6 px-4 text-center">
                          <p className="text-xs font-mono text-neutral-400 dark:text-neutral-500 mb-2">
                            No items added yet for this trade.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddItemToCategory(catIdx)}
                            className="px-3 py-1.5 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Item</span>
                          </button>
                        </div>
                      ) : (
                        (categoryGroup.items || []).map((row, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            {/* Item Description & Notes */}
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={row.item}
                                onChange={(e) => handleItemChange(catIdx, rIdx, "item", e.target.value)}
                                placeholder="Enter item description (e.g. 10mm Deformed Rebar)..."
                                className="w-full font-medium text-neutral-900 dark:text-white bg-transparent placeholder:text-neutral-400 focus:outline-none focus:border-b focus:border-amber-500"
                              />
                              <input
                                type="text"
                                value={row.notes || ""}
                                onChange={(e) => handleItemChange(catIdx, rIdx, "notes", e.target.value)}
                                placeholder="Specifications / engineering notes..."
                                className="w-full text-[11px] text-neutral-400 font-sans bg-transparent placeholder:text-neutral-500 focus:outline-none"
                              />
                            </div>

                            {/* Quantity, Unit, Unit Cost, and Line Total */}
                            <div className="flex items-center gap-4 shrink-0 font-mono">
                              <div className="flex items-center gap-1 w-28">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={row.qty}
                                  onChange={(e) => handleItemChange(catIdx, rIdx, "qty", e.target.value)}
                                  placeholder="Qty"
                                  className="w-14 text-right px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none text-xs"
                                />
                                <input
                                  type="text"
                                  value={row.unit || ""}
                                  onChange={(e) => handleItemChange(catIdx, rIdx, "unit", e.target.value)}
                                  placeholder="unit"
                                  className="w-12 text-neutral-400 text-xs bg-transparent placeholder:text-neutral-500 focus:outline-none text-left"
                                />
                              </div>

                              <div className="w-28 text-right">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={row.unitCost}
                                  onChange={(e) => handleItemChange(catIdx, rIdx, "unitCost", e.target.value)}
                                  placeholder="Rate (₱)"
                                  className="w-24 text-right px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none text-xs"
                                />
                              </div>

                              <span className="w-28 text-right font-bold text-neutral-900 dark:text-white">
                                {formatPHP(
                                  Number(row.total) ||
                                    Number(String(row.qty || 0).replace(/,/g, "")) *
                                      Number(String(row.unitCost || 0).replace(/,/g, "")) ||
                                    0
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(catIdx, rIdx)}
                                className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}

              {/* Quick-Add Common Trades Suggestions */}
              {COMMON_TRADE_SUGGESTIONS.filter(
                (name) => !itemsBreakdown.some((cat) => cat.category.toLowerCase() === name.toLowerCase())
              ).length > 0 && (
                <div className="p-3.5 rounded-[12px] bg-neutral-50/60 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5">
                  <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold mb-2">
                    Quick-Add Common Construction Trades:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TRADE_SUGGESTIONS.filter(
                      (name) => !itemsBreakdown.some((cat) => cat.category.toLowerCase() === name.toLowerCase())
                    ).map((tradeName) => (
                      <button
                        key={tradeName}
                        type="button"
                        onClick={() => {
                          setItemsBreakdown((prev) => [
                            ...prev,
                            { category: tradeName, items: [] },
                          ]);
                          showToast?.(`Added "${tradeName}" trade category.`, "success");
                        }}
                        className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/40 dark:hover:bg-amber-500/10 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 text-[10.5px] font-mono transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{tradeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Trade Category Bar */}
              <div className="p-4 rounded-[14px] bg-white dark:bg-[#101218] border border-dashed border-neutral-300 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Add custom trade category (e.g. Mechanical &amp; HVAC, Swimming Pool, Landscaping)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newCategoryName.trim()) {
                        setItemsBreakdown((prev) => [
                          ...prev,
                          { category: newCategoryName.trim(), items: [] },
                        ]);
                        setNewCategoryName("");
                        showToast?.("Added new trade category.", "success");
                      }
                    }
                  }}
                  className="flex-1 bg-transparent text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCategoryName.trim()) {
                      showToast?.("Please enter a trade category name.", "error");
                      return;
                    }
                    setItemsBreakdown((prev) => [
                      ...prev,
                      { category: newCategoryName.trim(), items: [] },
                    ]);
                    setNewCategoryName("");
                    showToast?.("Added new trade category.", "success");
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Trade Category</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Custom "Others" Scope Formulation Workbench */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-amber-500/[0.04] border border-amber-500/30 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Special Scopes Formulation
                </span>
              </div>
              <h3 className="text-base font-mono font-bold uppercase text-neutral-900 dark:text-white">
                Add Custom &quot;Others&quot; Scopes
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                Specify client-requested add-on scopes such as perimeter fencing, deep well, solar PV systems, or landscaping.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Item Title / Scope Name</label>
                <input
                  type="text"
                  value={newScopeTitle}
                  onChange={(e) => setNewScopeTitle(e.target.value)}
                  placeholder="e.g. 5kW Hybrid Solar PV System"
                  className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Quantity &amp; Unit</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newScopeQty}
                    onChange={(e) => handleCommaInputChange(e, setNewScopeQty)}
                    placeholder="Qty"
                    className="w-16 px-2 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none text-right"
                  />
                  <input
                    type="text"
                    value={newScopeUnit}
                    onChange={(e) => setNewScopeUnit(e.target.value)}
                    placeholder="unit"
                    className="w-16 px-2 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Unit Rate (₱)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newScopeUnitCost}
                  onChange={(e) => handleCommaInputChange(e, setNewScopeUnitCost)}
                  placeholder="₱ Rate"
                  className="w-full px-3 py-2 rounded-[8px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none text-right"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddCustomOtherScope}
                  className="w-full px-4 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Scope</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. Milestone Payment Terms & Schedule */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/5">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Milestone Disbursement Schedule
                </span>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  Progress payments calculated proportionally from the {formatPHP(totalAmount)} turnkey total.
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-white/5">
              {paymentMilestones.map((ms, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-white font-mono uppercase">
                        {ms.milestone} ({ms.percentage}%)
                      </span>
                      <p className="text-[11px] text-neutral-500 font-sans">{ms.trigger}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white text-right">
                    {formatPHP(ms.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Engineering Notes & Inclusions / Exclusions */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 space-y-2 shadow-xs">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Engineering Inclusions, Exclusions &amp; Warranty Terms
            </label>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter inclusions, exclusions, and warranty clauses to appear on the official A4 quotation..."
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
            />
          </div>

          {/* 8. Sticky Action Footer */}
          <div className="p-4 sm:p-5 rounded-[16px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl transition-colors">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Turnkey Investment: {formatPHP(totalAmount)}
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans mt-0.5">
                Ready to publish official quotation and pure vector Word-style A4 PDF to client portal.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveQuotation("DRAFT")}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuotation("PUBLISHED")}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Official Quotation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BOQ Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[16px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white">
                    BOQ Structure Templates
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Use existing project BOQs or standard trades as a template. All values &amp; quantities are stripped clean.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Option: Standard 9 Trades */}
            <div className="p-3.5 rounded-[12px] bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 block">
                  Standard 9 Philippine Contracting Trades
                </span>
                <span className="text-[10px] text-neutral-400 font-sans">
                  General Requirements, Earthworks, Masonry, Steel, Plumbing, Electrical, Finishes...
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyStandardTemplate}
                className="px-3 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
              >
                Apply (Blank)
              </button>
            </div>

            {/* Search Filter for Past Projects */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search past project or client to copy BOQ template..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Past Projects List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {clients
                .filter(
                  (c) =>
                    c.client_project_id !== selectedClient?.client_project_id &&
                    (c.client_name?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                      c.project_code?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                      c.project_type?.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                )
                .map((clientItem) => (
                  <div
                    key={clientItem.client_project_id}
                    className="p-3 rounded-[10px] bg-neutral-50/70 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                          {clientItem.project_code || "PROJECT"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-mono">
                          {clientItem.project_type || "Residential"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-sans truncate mt-0.5">
                        {clientItem.client_name} &bull; {clientItem.location || "Philippines"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isLoadingTemplate}
                      onClick={() => handleApplyTemplateFromQuotation(clientItem)}
                      className="px-3 py-1.5 rounded-[6px] bg-neutral-200/80 hover:bg-amber-500 hover:text-neutral-950 dark:bg-white/5 dark:hover:bg-amber-500 dark:hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                    >
                      Use as Template
                    </button>
                  </div>
                ))}

              {clients.filter((c) => c.client_project_id !== selectedClient?.client_project_id).length === 0 && (
                <div className="py-8 text-center text-xs font-mono text-neutral-400">
                  No other client projects available yet. You can use the Standard 9 Trades template above.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5 text-[11px] font-mono text-neutral-400 shrink-0">
              <span>Notice: Rates, Qty, and Totals will be reset to 0 / blank.</span>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-3 py-1.5 rounded-[6px] hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
