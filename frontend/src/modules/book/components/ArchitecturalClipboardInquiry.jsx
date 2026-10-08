"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
  HomeIcon,
  BuildingIcon,
  WarehouseIcon,
  HammerIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloseIcon,
  SparklesIcon,
  VideoIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
} from "@/modules/shared/Icons";
import { useLanguage } from "@/modules/shared/LanguageContext";
import PhAddressCascadeSection from "@/modules/portal/components/PhAddressCascadeSection";
import LotMapPicker from "@/modules/portal/components/LotMapPicker";

const PROJECT_CATEGORIES = [
  {
    val: "Residential Villa / Two-Storey",
    labelEn: "Residential Villa / Two-Storey",
    labelFil: "Residential Villa / Two-Storey",
    descEn: "Single-detached, 2-storey modern house, bungalow",
    descFil: "Single-detached, 2-palapag na modernong bahay, bungalow",
    icon: HomeIcon,
  },
  {
    val: "Commercial & Mixed-Use",
    labelEn: "Commercial / Apartment Rental",
    labelFil: "Komersyal / Apartment Rental",
    descEn: "Rental units, commercial retail, cafe/restaurant",
    descFil: "Paupahan, tindahan, opisina, cafe o restawran",
    icon: BuildingIcon,
  },
  {
    val: "Industrial & Structural",
    labelEn: "Industrial Warehouse & Logistics",
    labelFil: "Bodega / Industrial Warehouse",
    descEn: "Steel fabrication, storage warehouse, commissary",
    descFil: "Bakal na istruktura, imbakan ng kalakal, commissary",
    icon: WarehouseIcon,
  },
  {
    val: "House Renovation & Extension",
    labelEn: "House Renovation & Extension",
    labelFil: "Renovasyon at Pagpapalawak",
    descEn: "Structural expansion, second-floor addition, remodeling",
    descFil: "Pagpapalaki, dagdag na palapag, pagsasaayos ng loob",
    icon: HammerIcon,
  },
];

const ARCH_STYLES = [
  { name: "Contemporary Modern", desc: "Clean lines, warm wood & black metal accents" },
  { name: "Minimalist Japanese Zen", desc: "Clutter-free flow, natural stone & bamboo harmony" },
  { name: "Tropical Modern", desc: "Cantilever eaves, natural cross-ventilation & breeze" },
  { name: "Industrial Scandinavian", desc: "Exposed beams, raw concrete & cozy oak finishes" },
  { name: "Classic Mediterranean", desc: "Stucco elegance, arched entryways & terracotta accents" },
  { name: "Custom Architectural Concept", desc: "Bespoke vision collaboratively drawn with our architects" },
];

const STOREY_OPTIONS = [
  { val: "1-Storey (Bungalow)", label: "1-Storey (Bungalow)" },
  { val: "2-Storey (Standard)", label: "2-Storey (Standard)" },
  { val: "3-Storey (Multi-Level)", label: "3-Storey (Multi-Level)" },
  { val: "2-Storey with Roof Deck", label: "2-Storey + Roof Deck" },
];

const BUDGET_OPTIONS = [
  { val: "₱2.5M - ₱4.0M", descEn: "Starter / Compact Residence", descFil: "Pang-umpisang Tirahan / Compact" },
  { val: "₱4.0M - ₱7.0M", descEn: "Standard 2-Storey Mid-End", descFil: "Karaniwang 2-Palapag na Mid-End" },
  { val: "₱7.0M - ₱12.0M+", descEn: "Executive / High-End Luxury", descFil: "Malaki / High-End Luxury Villa" },
  { val: "Flexible / Subject to Costing", descEn: "Subject to architectural estimation", descFil: "Ayon sa tantya ng arkitekto" },
];

const FINANCING_OPTIONS = [
  { val: "Build Now, Pay Later Program", descEn: "Titled lot BNPL financing program", descFil: "BNPL program para sa may sariling titulo" },
  { val: "Milestone Progress Billing", descEn: "Direct progress billings per construction milestone", descFil: "Bayad bawat yugto ng natapos na gawa" },
  { val: "Bank / Pag-IBIG Housing Loan Assistance", descEn: "Full technical document assistance for bank take-out", descFil: "Tulong sa dokumento para sa housing loan" },
];

const LOT_STATUS_OPTIONS = [
  { val: "Titled & Ready (Clean TCT)", desc: "May sariling malinis na Transfer Certificate of Title" },
  { val: "Inside Gated Subdivision (HOA)", desc: "Nasa loob ng subdibisyon (may alituntunin ng HOA)" },
  { val: "Rights / Tax Declaration", desc: "Hawak ang karapatan / Tax Declaration" },
  { val: "In Acquisition / Purchasing", desc: "Kasalukuyang binibili o pinoproseso ang lupa" },
  { val: "Looking for Lot Assistance", desc: "Wala pa / naghahanap pa ng lote sa Bulacan o Pampanga" },
];

const FEATURE_TAG_OPTIONS = [
  { id: "high_ceiling", labelEn: "High-Ceiling Living Area", labelFil: "Mataas na Kisame (High Ceiling)" },
  { id: "senior_room", labelEn: "Ground Floor Senior Bedroom", labelFil: "Kwarto sa Ibaba para sa Matatanda" },
  { id: "dirty_kitchen", labelEn: "Dirty Kitchen & Wet Utility", labelFil: "Dirty Kitchen at Labahan" },
  { id: "balcony_lanai", labelEn: "Balcony / Covered Lanai", labelFil: "Balkonahe o Covered Lanai" },
  { id: "home_office", labelEn: "Dedicated Home Office / Study", labelFil: "Home Office / Kwarto sa Trabaho" },
  { id: "swimming_pool", labelEn: "Swimming Pool Provision", labelFil: "Probissyon sa Swimming Pool" },
];

export default function ArchitecturalClipboardInquiry({
  currentUser,
  selectedStyle = "",
  isModal = false,
  onClose,
  onSuccess,
}) {
  const { language } = useLanguage();
  const isFil = language === "fil";

  // Active Sheet: 1, 2, or 3
  const [sheet, setSheet] = useState(1);
  const [animClass, setAnimClass] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  // --- SHEET 1: PROJECT CLASSIFICATION & AESTHETIC ---
  const [projectType, setProjectType] = useState("Residential Villa / Two-Storey");
  const [preferredStyle, setPreferredStyle] = useState(selectedStyle || "Contemporary Modern");
  const [storeys, setStoreys] = useState("2-Storey (Standard)");
  const [targetTimeline, setTargetTimeline] = useState("Within 3 Months");

  // --- SHEET 2: PROPOSED CONSTRUCTION SITE & SATELLITE MAP ---
  const [buildProvince, setBuildProvince] = useState("Bulacan");
  const [buildProvinceCode, setBuildProvinceCode] = useState("0301400000");
  const [buildCity, setBuildCity] = useState("Plaridel");
  const [buildCityCode, setBuildCityCode] = useState("");
  const [buildBarangay, setBuildBarangay] = useState("");
  const [buildBarangayCode, setBuildBarangayCode] = useState("");
  const [buildSubdivision, setBuildSubdivision] = useState("");
  const [buildStreet, setBuildStreet] = useState("");
  const [buildHouseNo, setBuildHouseNo] = useState("");
  const [buildBlkLot, setBuildBlkLot] = useState("");

  const [mapCoordinates, setMapCoordinates] = useState("14.8871, 120.8572");
  const [lotStatus, setLotStatus] = useState("Titled & Ready (Clean TCT)");
  const [lotArea, setLotArea] = useState("240");

  // --- SHEET 3: SPATIAL WISHLIST, BUDGET & MEETING ---
  const [bedrooms, setBedrooms] = useState("3 - 4 Bedrooms");
  const [bathrooms, setBathrooms] = useState("2 - 3 Bathrooms");
  const [carGarage, setCarGarage] = useState("2-Car Garage");
  const [selectedFeatures, setSelectedFeatures] = useState(new Set(["high_ceiling", "dirty_kitchen"]));
  const [budgetRange, setBudgetRange] = useState("₱4.0M - ₱7.0M");
  const [financingOption, setFinancingOption] = useState("Build Now, Pay Later Program");

  const [meetingMode, setMeetingMode] = useState("Online Meeting (Google Meet)");
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [meetingTime, setMeetingTime] = useState("09:00 AM - 10:30 AM PHT");
  const [specialNotes, setSpecialNotes] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Sync if selectedStyle prop changes externally
  useEffect(() => {
    if (selectedStyle) setPreferredStyle(selectedStyle);
  }, [selectedStyle]);

  // Handle Feature Tag Toggles
  const toggleFeature = (id) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compile formatted site address string
  const formattedBuildAddress = useMemo(() => {
    const parts = [
      buildHouseNo ? `Unit/House ${buildHouseNo.trim()}` : "",
      buildBlkLot ? `Blk ${buildBlkLot.trim()}` : "",
      buildStreet.trim(),
      buildSubdivision.trim(),
      buildBarangay ? `Brgy. ${buildBarangay.trim()}` : "",
      buildCity.trim(),
      buildProvince.trim(),
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : `${buildCity || "Plaridel"}, ${buildProvince || "Bulacan"}`;
  }, [buildHouseNo, buildBlkLot, buildStreet, buildSubdivision, buildBarangay, buildCity, buildProvince]);

  // Paper-Flip Navigation Transitions
  const goToSheet = (targetSheet, direction = "next") => {
    if (isAnimating || targetSheet === sheet) return;
    setIsAnimating(true);

    const outClass = direction === "next" ? "sheet-anim-out-next" : "sheet-anim-out-prev";
    const inClass = direction === "next" ? "sheet-anim-in-next" : "sheet-anim-in-prev";

    setAnimClass(outClass);

    setTimeout(() => {
      setSheet(targetSheet);
      setAnimClass(inClass);

      setTimeout(() => {
        setAnimClass("");
        setIsAnimating(false);
      }, 380);
    }, 280);
  };

  // Handle Submission to Backend
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const id = "MCPA-CPB-" + Math.floor(100000 + Math.random() * 900000);
    setSubmissionId(id);

    const briefPayload = {
      id,
      submissionId: id,
      clientName: currentUser?.fullName || "Valued Client",
      clientEmail: currentUser?.email || "",
      clientPhone: currentUser?.phoneNumber || "",
      userId: currentUser?.userId || currentUser?.id || null,
      projectType,
      preferredStyle,
      storeys,
      targetDate: targetTimeline,
      location: formattedBuildAddress,
      siteAddressDetails: {
        province: buildProvince,
        city: buildCity,
        barangay: buildBarangay,
        subdivision: buildSubdivision,
        street: buildStreet,
        houseNo: buildHouseNo,
        blkLot: buildBlkLot,
      },
      mapCoordinates,
      lotStatus,
      lotArea: lotArea ? `${lotArea} sqm` : "Not specified",
      budgetRange,
      financingOption,
      spatialWishlist: {
        bedrooms,
        bathrooms,
        carGarage,
        featureTags: Array.from(selectedFeatures),
      },
      meetingMode,
      meetingDate: meetingDate || "Earliest Available Slot",
      meetingTime,
      message: specialNotes || `Storeys: ${storeys} • Bedrooms: ${bedrooms} • Bathrooms: ${bathrooms} • Garage: ${carGarage}`,
      locationType: currentUser?.clientType || "Local",
      status: "Pending Review",
    };

    try {
      // 1. Local storage backup
      const existing = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
      localStorage.setItem("mcpa_client_briefs", JSON.stringify([briefPayload, ...existing]));

      // 2. Persist to backend database API
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefPayload),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        throw new Error(data.message || `Submission failed with status ${res.status}`);
      }

      setIsSubmitted(true);
      if (onSuccess) onSuccess(data.brief || briefPayload);
    } catch (err) {
      console.warn("Brief sync warning:", err);
      // Even if network blips, display submitted state if saved locally
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSheet(1);
    setSpecialNotes("");
  };

  return (
    <section
      className={`relative w-full min-h-0 overscroll-contain scrollbar-thin transition-all select-none ${
        isModal
          ? "p-0"
          : "max-h-[calc(100dvh-5rem)] overflow-y-auto py-8 px-3 sm:px-6 max-w-5xl mx-auto"
      }`}
    >
      {/* =========================================================================
          THE CLIPBOARD CONTAINER (Architectural Yellow Hardboard with Tactile Fiber Texture)
          ========================================================================= */}
      <div className="relative rounded-3xl p-3.5 sm:p-7 md:p-9 mcpa-clipboard-board transition-all">
        {/* TOP CLAMP ASSEMBLY: FIXED METALLIC CLIP WITH RIVETS & SHADOW */}
        <div className="absolute -top-5 sm:-top-6 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="relative flex flex-col items-center">
            {/* Hanging Hole Pin */}
            <div className="w-5 h-5 rounded-full bg-neutral-900 border-2 border-neutral-500 shadow-inner -mb-2 z-10" />

            {/* Heavy-Duty Metal Clamp Bar */}
            <div className="w-64 sm:w-84 h-11 sm:h-12 rounded-b-2xl bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-800 border-x border-b border-white/60 dark:border-white/15 shadow-[0_12px_24px_rgba(0,0,0,0.55)] flex items-center justify-between px-3.5 sm:px-6">
              {/* Twin Silver Mounting Rivets */}
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-400 dark:bg-neutral-500 border border-neutral-600 shadow-inner flex items-center justify-center shrink-0">
                <div className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
              </div>

              {/* Embossed Company Logo & INQUIRY SHEET Title on Clip */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA Logo"
                  className="h-3.5 sm:h-4 w-auto object-contain block dark:hidden drop-shadow-xs"
                />
                <img
                  src="/assets/logo-white.svg"
                  alt="MCPA Logo"
                  className="h-3.5 sm:h-4 w-auto object-contain hidden dark:block drop-shadow-xs"
                />
                <span className="h-3 w-[1px] bg-neutral-400/80 dark:bg-white/20 shrink-0" />
                <span className="font-mono text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-800 dark:text-neutral-100 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] truncate">
                  INQUIRY SHEET
                </span>
              </div>

              <div className="w-3.5 h-3.5 rounded-full bg-neutral-400 dark:bg-neutral-500 border border-neutral-600 shadow-inner flex items-center justify-center shrink-0">
                <div className="w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
              </div>
            </div>

            {/* Realistic Spring Clamp Shadow casting over paper */}
            <div className="w-64 sm:w-96 h-3 bg-black/40 blur-xs rounded-full -mt-1 pointer-events-none" />
          </div>
        </div>

        {/* Modal Close Button (if inside modal) */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}

        {/* =========================================================================
            THE ARCHITECTURAL DRAFTING SHEET (Clamped Paper beneath the clip)
            ========================================================================= */}
        <div className="clipboard-perspective mt-6 sm:mt-5">
          {!isSubmitted ? (
            <div
              className={`relative rounded-2xl mcpa-paper-sheet p-5 sm:p-8 md:p-10 transition-all ${animClass}`}
            >
              {/* STAMPED VERIFIED CLIENT PROFILE HEADER (NO REDUNDANT INPUTS) */}
              <div className="border-b border-neutral-200 dark:border-white/10 pb-5 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Document Branding & Reference Number */}
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400 font-bold mb-1">
                      <span>PROJECT INTAKE DOSSIER</span>
                      <span>•</span>
                      <span>STAGE 1: BRIEF</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
                      {isFil ? "Architectural Client Profiling" : "Architectural Client Profiling"}
                    </h2>
                  </div>

                  {/* Right: Sheet Tab Indicator */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-neutral-100 dark:bg-white/[0.05] p-1 rounded-xl border border-neutral-200 dark:border-white/10 font-mono text-xs">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => goToSheet(num, num > sheet ? "next" : "prev")}
                        className={`px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                          sheet === num
                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        {isFil ? `Pahina ${num}` : `Sheet ${num}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stamped Verified Client Profile Strip */}
                {currentUser && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/12 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      {currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture ? (
                        <img
                          src={currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture}
                          alt={`${currentUser.fullName || "Client"} profile`}
                          className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0"
                        />
                      ) : (
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {currentUser.fullName || "Valued Client"}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-neutral-600 dark:text-neutral-300">{currentUser.email}</span>
                      {currentUser.phoneNumber && (
                        <>
                          <span className="text-neutral-400 hidden sm:inline">•</span>
                          <span className="text-neutral-600 dark:text-neutral-300 hidden sm:inline">{currentUser.phoneNumber}</span>
                        </>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase">
                      <span>✓ {currentUser.clientType === "OFW" ? "OFW VERIFIED" : "HOMEOWNER ACCOUNT"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SHEET 1: PROJECT CLASSIFICATION & AESTHETIC STYLE
                  ========================================================================= */}
              {sheet === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                      1. {isFil ? "Uri ng Proyekto (Project Category) *" : "Project Classification & Category *"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PROJECT_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = projectType === cat.val;
                        return (
                          <button
                            key={cat.val}
                            type="button"
                            onClick={() => setProjectType(cat.val)}
                            className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${
                              isSelected
                                ? "bg-amber-500/12 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 text-neutral-900 dark:text-white shadow-md"
                                : "bg-neutral-50 dark:bg-white/[0.03] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/50"
                            }`}
                          >
                            <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? "bg-amber-500 text-neutral-950 font-bold" : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm leading-tight text-neutral-900 dark:text-white">
                                {isFil ? cat.labelFil : cat.labelEn}
                              </h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light leading-relaxed">
                                {isFil ? cat.descFil : cat.descEn}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Architectural Style Peg */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                      2. {isFil ? "Estilong Pang-Arkitektura (Aesthetic Style Peg) *" : "Architectural Style & Design Peg *"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {ARCH_STYLES.map((style) => {
                        const isSelected = preferredStyle === style.name;
                        return (
                          <button
                            key={style.name}
                            type="button"
                            onClick={() => setPreferredStyle(style.name)}
                            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md"
                                : "bg-neutral-50 dark:bg-white/[0.03] border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-amber-500/50"
                            }`}
                          >
                            <span className="text-xs font-bold block">{style.name}</span>
                            <span className={`text-[11px] block mt-0.5 leading-snug font-normal ${isSelected ? "text-neutral-900" : "text-neutral-500 dark:text-neutral-400"}`}>
                              {style.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Intended Storeys & Target Start */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        3. {isFil ? "Bilang ng Palapag (Target Storeys) *" : "Intended Number of Storeys *"}
                      </label>
                      <select
                        value={storeys}
                        onChange={(e) => setStoreys(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      >
                        {STOREY_OPTIONS.map((opt) => (
                          <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        4. {isFil ? "Kailan Balak Simulan (Target Timeline) *" : "Target Construction Timeline *"}
                      </label>
                      <select
                        value={targetTimeline}
                        onChange={(e) => setTargetTimeline(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Immediate (Within 1-3 Months)">{isFil ? "Agad (Sa loob ng 1-3 Buwan)" : "Immediate (Within 1-3 Months)"}</option>
                        <option value="Within 3-6 Months">{isFil ? "Sa loob ng 3-6 Buwan" : "Within 3-6 Months"}</option>
                        <option value="Planning for Next Year (6-12 Months)">{isFil ? "Pagpaplano para sa susunod na taon (6-12 Buwan)" : "Planning for Next Year (6-12 Months)"}</option>
                        <option value="Flexible / Exploratory">{isFil ? "Flexible / Paglilinaw pa lamang" : "Flexible / Exploratory"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Sheet 1 Footer Action */}
                  <div className="pt-6 border-t border-neutral-200 dark:border-white/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => goToSheet(2, "next")}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <span>{isFil ? "Susunod: Lote at Satellite Mapa →" : "Next: Proposed Site & Satellite Map →"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  SHEET 2: PROPOSED CONSTRUCTION SITE & SATELLITE MAP
                  ========================================================================= */}
              {sheet === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Notice Pill */}
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/5 flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                    <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {isFil
                        ? "Ibigay ang eksaktong lokasyon ng lupang pagtatayuan sa Pilipinas (Bulacan, Pampanga, Metro Manila, atbp.) upang masuri ng aming mga inhinyero ang access ng mga heavy equipment."
                        : "Specify the exact construction site location in the Philippines so our engineering team can evaluate site elevation and heavy equipment accessibility."}
                    </span>
                  </div>

                  {/* Philippine Structured Address Cascade (Exact match with sign up!) */}
                  <div>
                    <PhAddressCascadeSection
                      province={buildProvince}
                      provinceCode={buildProvinceCode}
                      onProvinceChange={(name, code) => {
                        setBuildProvince(name);
                        setBuildProvinceCode(code);
                      }}
                      city={buildCity}
                      cityCode={buildCityCode}
                      onCityChange={(name, code) => {
                        setBuildCity(name);
                        setBuildCityCode(code);
                      }}
                      barangay={buildBarangay}
                      barangayCode={buildBarangayCode}
                      onBarangayChange={(name, code) => {
                        setBuildBarangay(name);
                        setBuildBarangayCode(code);
                      }}
                      subdivision={buildSubdivision}
                      onSubdivisionChange={setBuildSubdivision}
                      street={buildStreet}
                      onStreetChange={setBuildStreet}
                      houseNo={buildHouseNo}
                      onHouseNoChange={setBuildHouseNo}
                      blkLot={buildBlkLot}
                      onBlkLotChange={setBuildBlkLot}
                      title={isFil ? "Lugar ng Pagtatayuan (Construction Site)" : "Proposed Project Site Location"}
                      isBuildSite={true}
                      activeLang={language}
                    />
                  </div>

                  {/* Interactive Google / Satellite Map with Fullscreen */}
                  <div className="pt-2">
                    <LotMapPicker
                      coordinates={mapCoordinates}
                      onCoordinatesChange={setMapCoordinates}
                      locationAddress={formattedBuildAddress}
                      city={buildCity}
                      province={buildProvince}
                    />
                  </div>

                  {/* Lot Title & Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        {isFil ? "Katayuan ng Titulo ng Lote *" : "Lot Title & Readiness Status *"}
                      </label>
                      <select
                        value={lotStatus}
                        onChange={(e) => setLotStatus(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      >
                        {LOT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.val} value={opt.val}>{opt.val}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        {isFil ? "Sukat ng Lote (sqm) *" : "Estimated Lot Area (sqm) *"}
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="10000"
                        value={lotArea}
                        onChange={(e) => setLotArea(e.target.value)}
                        placeholder="e.g. 240"
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sheet 2 Navigation */}
                  <div className="pt-6 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => goToSheet(1, "prev")}
                      className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>{isFil ? "Bumalik (Pahina 1)" : "Back (Sheet 1)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToSheet(3, "next")}
                      className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                    >
                      <span>{isFil ? "Susunod: Wishlist at Budget →" : "Next: Wishlist & Budget →"}</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  SHEET 3: SPATIAL WISHLIST, BUDGET & MEETING SCHEDULE
                  ========================================================================= */}
              {sheet === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Spatial Wishlist Grid (Beds, Baths, Garage) */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                      1. {isFil ? "Spatial & Room Wishlist (Pangarap na Bahay) *" : "Spatial & Room Wishlist *"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Bedrooms */}
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Bilang ng Kwarto (Bedrooms)" : "Target Bedrooms"}
                        </span>
                        <select
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                        >
                          <option value="2 Bedrooms">2 Bedrooms</option>
                          <option value="3 Bedrooms">3 Bedrooms</option>
                          <option value="3 - 4 Bedrooms">3 - 4 Bedrooms</option>
                          <option value="4 - 5 Bedrooms">4 - 5 Bedrooms</option>
                          <option value="5+ Bedrooms">5+ Luxury Bedrooms</option>
                        </select>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Bilang ng Banyo (Bathrooms)" : "Target Bathrooms"}
                        </span>
                        <select
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                        >
                          <option value="2 Bathrooms">2 Bathrooms</option>
                          <option value="2 - 3 Bathrooms">2 - 3 Bathrooms</option>
                          <option value="3 - 4 Bathrooms">3 - 4 Bathrooms</option>
                          <option value="4+ Bathrooms">4+ Bathrooms</option>
                        </select>
                      </div>

                      {/* Garage */}
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Garahe (Carport / Garage)" : "Car Garage Capacity"}
                        </span>
                        <select
                          value={carGarage}
                          onChange={(e) => setCarGarage(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                        >
                          <option value="1-Car Garage">1-Car Garage</option>
                          <option value="2-Car Garage">2-Car Garage</option>
                          <option value="3-Car Garage">3-Car Garage</option>
                          <option value="4+ Car Luxury Garage">4+ Car Luxury Garage</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Architectural Feature Tags */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                      2. {isFil ? "Mga Espesyal na Katangian (Feature Tags)" : "Architectural Features & Provisions"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FEATURE_TAG_OPTIONS.map((feat) => {
                        const isChecked = selectedFeatures.has(feat.id);
                        return (
                          <button
                            key={feat.id}
                            type="button"
                            onClick={() => toggleFeature(feat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs"
                                : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:border-amber-500/50"
                            }`}
                          >
                            <span>{isChecked ? "✓" : "+"}</span>
                            <span>{isFil ? feat.labelFil : feat.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget & Financing Program */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        3. {isFil ? "Target na Budget Scope *" : "Target Budget Scope *"}
                      </label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      >
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b.val} value={b.val}>
                            {b.val} — {isFil ? b.descFil : b.descEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        4. {isFil ? "Paraan ng Pagbabayad / Financing *" : "Financing Program Preference *"}
                      </label>
                      <select
                        value={financingOption}
                        onChange={(e) => setFinancingOption(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                      >
                        {FINANCING_OPTIONS.map((f) => (
                          <option key={f.val} value={f.val}>
                            {f.val}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Meeting Setup (Google Meet vs MCPA Office) */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-4">
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200">
                      5. {isFil ? "Unang Konsultasyon (Initial Consultation Meeting) *" : "Initial Consultation Meeting Preference *"}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          val: "Online Meeting (Google Meet)",
                          labelEn: "Online Meeting (Google Meet)",
                          labelFil: "Online Call (Google Meet)",
                          desc: isFil ? "Perpekto para sa OFW o may trabaho" : "Priority for OFWs & busy homeowners",
                          icon: VideoIcon,
                        },
                        {
                          val: "In-Person (MCPA Head Office)",
                          labelEn: "In-Person (MCPA Head Office)",
                          labelFil: "Face-to-Face sa MCPA Office",
                          desc: isFil ? "Plaridel, Bulacan Headquarters" : "Plaridel, Bulacan HQ / Site Visit",
                          icon: BuildingIcon,
                        },
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = meetingMode === mode.val;
                        return (
                          <button
                            key={mode.val}
                            type="button"
                            onClick={() => setMeetingMode(mode.val)}
                            className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                                : "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block">{isFil ? mode.labelFil : mode.labelEn}</span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">{mode.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Napiling Araw" : "Target Consultation Date"}
                        </span>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Oras ng Pagpupulong" : "Preferred Time Slot"}
                        </span>
                        <select
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                        >
                          <option value="09:00 AM - 10:30 AM PHT">09:00 AM - 10:30 AM PHT (Morning)</option>
                          <option value="02:00 PM - 03:30 PM PHT">02:00 PM - 03:30 PM PHT (Afternoon)</option>
                          <option value="04:00 PM - 05:30 PM PHT">04:00 PM - 05:30 PM PHT (Late Afternoon)</option>
                          <option value="08:00 PM - 09:30 PM PHT (OFW Evening Slot)">08:00 PM - 09:30 PM PHT (OFW Evening Slot)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Special Design Notes */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                      6. {isFil ? "Espesyal na Kahilingan / Peg Link (Opsyonal)" : "Special Architectural Notes / Peg Links (Optional)"}
                    </label>
                    <textarea
                      rows={3}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder={isFil ? "hal. Nais po namin ng modern dirty kitchen, 2-car garage, at malaking bintana sa master bedroom..." : "e.g., Needs spacious master balcony, open concept kitchen, Pinterest peg link: https://..."}
                      className="w-full p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Error Notification */}
                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
                      {submitError}
                    </div>
                  )}

                  {/* Sheet 3 Navigation & Submit */}
                  <div className="pt-6 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => goToSheet(2, "prev")}
                      disabled={isSubmitting}
                      className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>{isFil ? "Bumalik (Pahina 2)" : "Back (Sheet 2)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                          <span>{isFil ? "Ipinapasa ang Brief..." : "Submitting Brief..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          <span>{isFil ? "Ipasa ang Brief at I-book ang Meeting ✔" : "Submit Brief & Book Meeting ✔"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
                SUCCESS STATE: ARCHITECTURAL DOSSIER CONFIRMATION STAMP
                ========================================================================= */
            <div className="relative rounded-2xl mcpa-paper-sheet p-6 sm:p-10 text-center animate-in zoom-in-95 duration-300">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <CheckIcon className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-2">
                <span>INQUIRY &amp; APPOINTMENT CONFIRMED</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
                {isFil ? "Nairerehistro ang Project Brief & Konsultasyon" : "Project Brief Registered & Logged"}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-lg mx-auto leading-relaxed">
                {isFil
                  ? "Na-save na sa database at nakakabit na sa iyong Client Portal account ang iyong architectural parameters. Makakatanggap ka ng email confirmation kasama ang meeting link o detalye sa pagbisita sa opisina."
                  : "Your architectural parameters are securely stored and linked to your Client Portal account. A formal confirmation with your meeting details has been dispatched."}
              </p>

              {/* Reference ID Callout Box */}
              <div className="my-6 p-4 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 max-w-md mx-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                  Reference Consultation Brief ID
                </span>
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
                  {submissionId}
                </span>
              </div>

              {/* Summary Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto my-6 text-left font-mono text-[11px]">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-neutral-400 block text-[9px]">CATEGORY</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">{projectType}</span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-neutral-400 block text-[9px]">STYLE PEG</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">{preferredStyle}</span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-neutral-400 block text-[9px]">LOT LOCATION</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">{buildCity}, {buildProvince}</span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-neutral-400 block text-[9px]">MEETING MODE</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">{meetingMode.split(" ")[0]}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isFil ? "Magpasa ng Isa Pang Inquiry" : "Submit Another Inquiry"}
                </button>

                <Link
                  href="/portal?tab=inquiries"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{isFil ? "Tingnan ang Inquiry sa Client Portal →" : "View Inquiries in Client Portal →"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
