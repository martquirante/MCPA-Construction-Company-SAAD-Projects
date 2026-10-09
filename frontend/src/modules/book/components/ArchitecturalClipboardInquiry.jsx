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
  SparkleBadgeIcon,
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
  {
    val: "Other",
    labelEn: "Other / Custom Project",
    labelFil: "Iba Pa / Custom na Proyekto",
    descEn: "Specify your own project type below",
    descFil: "Ilagay ang sariling uri ng proyekto sa ibaba",
    icon: SparkleBadgeIcon,
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
  { val: "Other", label: "Other (Specify)" },
];

const FINANCING_OPTIONS = [
  { val: "Build Now, Pay Later Program", descEn: "Titled lot BNPL financing program", descFil: "BNPL program para sa may sariling titulo" },
  { val: "Milestone Progress Billing", descEn: "Direct progress billings per construction milestone", descFil: "Bayad bawat yugto ng natapos na gawa" },
  { val: "Bank / Pag-IBIG Housing Loan Assistance", descEn: "Full technical document assistance for bank take-out", descFil: "Tulong sa dokumento para sa housing loan" },
  { val: "Other", descEn: "Specify financing arrangement", descFil: "Ilagay ang ibang paraan ng pagbabayad" },
];

const LOT_STATUS_OPTIONS = [
  { val: "Titled & Ready (Clean TCT)", desc: "May sariling malinis na Transfer Certificate of Title" },
  { val: "Inside Gated Subdivision (HOA)", desc: "Nasa loob ng subdibisyon (may alituntunin ng HOA)" },
  { val: "Rights / Tax Declaration", desc: "Hawak ang karapatan / Tax Declaration" },
  { val: "In Acquisition / Purchasing", desc: "Kasalukuyang binibili o pinoproseso ang lupa" },
  { val: "Looking for Lot Assistance", desc: "Wala pa / naghahanap pa ng lote sa Bulacan o Pampanga" },
  { val: "Other", desc: "Other lot status — please specify" },
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

  // Validation errors per sheet
  const [errors, setErrors] = useState({});
  const [shakeKey, setShakeKey] = useState(0);
  const [addressAttempted, setAddressAttempted] = useState(false);

  // --- SHEET 1: PROJECT CLASSIFICATION & AESTHETIC ---
  const [projectType, setProjectType] = useState("");
  const [projectTypeOther, setProjectTypeOther] = useState("");
  const [preferredStyle, setPreferredStyle] = useState(selectedStyle || "");
  const [preferredStyleCustom, setPreferredStyleCustom] = useState("");
  const [storeys, setStoreys] = useState("");
  const [storeysOther, setStoreysOther] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("");
  const [targetTimelineOther, setTargetTimelineOther] = useState("");

  // --- SHEET 2: PROPOSED CONSTRUCTION SITE & SATELLITE MAP ---
  const [buildProvince, setBuildProvince] = useState("");
  const [buildProvinceCode, setBuildProvinceCode] = useState("");
  const [buildCity, setBuildCity] = useState("");
  const [buildCityCode, setBuildCityCode] = useState("");
  const [buildBarangay, setBuildBarangay] = useState("");
  const [buildBarangayCode, setBuildBarangayCode] = useState("");
  const [buildSubdivision, setBuildSubdivision] = useState("");
  const [buildStreet, setBuildStreet] = useState("");
  const [buildHouseNo, setBuildHouseNo] = useState("");
  const [buildBlkLot, setBuildBlkLot] = useState("");

  const [mapCoordinates, setMapCoordinates] = useState("");
  const [lotStatus, setLotStatus] = useState("");
  const [lotStatusOther, setLotStatusOther] = useState("");
  const [lotArea, setLotArea] = useState("");

  // --- SHEET 3: SPATIAL WISHLIST, BUDGET & MEETING ---
  const [bedrooms, setBedrooms] = useState("");
  const [bedroomsOther, setBedroomsOther] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bathroomsOther, setBathroomsOther] = useState("");
  const [carGarage, setCarGarage] = useState("");
  const [carGarageOther, setCarGarageOther] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [budgetRange, setBudgetRange] = useState("");
  const [financingOption, setFinancingOption] = useState("");
  const [financingOptionOther, setFinancingOptionOther] = useState("");

  const [meetingMode, setMeetingMode] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTimeOther, setMeetingTimeOther] = useState("");
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
  const validateSheet1 = () => {
    const e = {};
    if (!projectType) e.projectType = "Please select a project category.";
    if (projectType === "Other" && !projectTypeOther.trim()) e.projectTypeOther = "Please describe your project type.";
    if (!preferredStyle) e.preferredStyle = "Please select an architectural style.";
    if (preferredStyle === "Custom Architectural Concept" && !preferredStyleCustom.trim()) e.preferredStyleCustom = "Please describe your custom concept.";
    if (!storeys) e.storeys = "Please select the number of storeys.";
    if (storeys === "Other" && !storeysOther.trim()) e.storeysOther = "Please specify the number of storeys.";
    if (!targetTimeline) e.targetTimeline = "Please select a target construction timeline.";
    if (targetTimeline === "Other" && !targetTimelineOther.trim()) e.targetTimelineOther = "Please describe your target timeline.";
    return e;
  };

  const validateSheet2 = () => {
    const e = {};
    if (!buildProvince) e.buildProvince = "Please select a province.";
    if (!buildCity) e.buildCity = "Please select a city/municipality.";
    if (!buildBarangay) e.buildBarangay = "Please select a barangay.";
    if (!lotStatus) e.lotStatus = "Please select the lot title status.";
    if (lotStatus === "Other" && !lotStatusOther.trim()) e.lotStatusOther = "Please describe your lot status.";
    if (!lotArea || isNaN(Number(lotArea)) || Number(lotArea) < 20) e.lotArea = "Please enter a valid lot area (min. 20 sqm).";
    return e;
  };

  const validateSheet3 = () => {
    const e = {};
    if (!bedrooms) e.bedrooms = "Please select the number of bedrooms.";
    if (bedrooms === "Other" && !bedroomsOther.trim()) e.bedroomsOther = "Please specify the number of bedrooms.";
    if (!bathrooms) e.bathrooms = "Please select the number of bathrooms.";
    if (bathrooms === "Other" && !bathroomsOther.trim()) e.bathroomsOther = "Please specify the number of bathrooms.";
    if (!carGarage) e.carGarage = "Please select garage capacity.";
    if (carGarage === "Other" && !carGarageOther.trim()) e.carGarageOther = "Please specify your garage requirement.";
    if (!budgetRange || !budgetRange.trim()) e.budgetRange = "Please enter your target budget range.";
    if (!financingOption) e.financingOption = "Please select a financing option.";
    if (financingOption === "Other" && !financingOptionOther.trim()) e.financingOptionOther = "Please describe your financing arrangement.";
    if (!meetingMode) e.meetingMode = "Please select a meeting mode.";
    if (!meetingDate) e.meetingDate = "Please select a consultation date.";
    if (!meetingTime) e.meetingTime = "Please select a preferred time slot.";
    if (meetingTime === "Other" && !meetingTimeOther.trim()) e.meetingTimeOther = "Please specify your preferred time.";
    return e;
  };

  const goToSheet = (targetSheet, direction = "next") => {
    if (isAnimating || targetSheet === sheet) return;

    // Validate before advancing forward
    if (direction === "next") {
      let errs = {};
      if (sheet === 1) errs = validateSheet1();
      if (sheet === 2) errs = validateSheet2();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setShakeKey((k) => k + 1);
        if (sheet === 2) setAddressAttempted(true);
        return;
      }
    }

    setErrors({});
    setAddressAttempted(false);
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
    // Validate Sheet 3 before submitting
    const errs = validateSheet3();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
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
      projectType: projectType === "Other" ? (projectTypeOther || "Other") : projectType,
      preferredStyle: preferredStyle === "Custom Architectural Concept" ? (preferredStyleCustom || "Custom Architectural Concept") : preferredStyle,
      storeys: storeys === "Other" ? (storeysOther || "Other") : storeys,
      targetDate: targetTimeline === "Other" ? (targetTimelineOther || "Other") : targetTimeline,
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
      lotStatus: lotStatus === "Other" ? (lotStatusOther || "Other") : lotStatus,
      lotArea: lotArea ? `${lotArea} sqm` : "Not specified",
      budgetRange: budgetRange === "Other" ? (budgetRangeOther || "Other") : budgetRange,
      financingOption: financingOption === "Other" ? (financingOptionOther || "Other") : financingOption,
      spatialWishlist: {
        bedrooms: bedrooms === "Other" ? (bedroomsOther || "Other") : bedrooms,
        bathrooms: bathrooms === "Other" ? (bathroomsOther || "Other") : bathrooms,
        carGarage: carGarage === "Other" ? (carGarageOther || "Other") : carGarage,
        featureTags: Array.from(selectedFeatures),
      },
      meetingMode,
      meetingDate: meetingDate || "Earliest Available Slot",
      meetingTime: meetingTime === "Other" ? (meetingTimeOther || "Other") : meetingTime,
      message: specialNotes || `Storeys: ${storeys === "Other" ? (storeysOther || "Other") : storeys} • Bedrooms: ${bedrooms === "Other" ? (bedroomsOther || "Other") : bedrooms} • Bathrooms: ${bathrooms === "Other" ? (bathroomsOther || "Other") : bathrooms} • Garage: ${carGarage === "Other" ? (carGarageOther || "Other") : carGarage}`,
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
          : "w-full pt-12 sm:pt-14 md:pt-16 pb-6 sm:pb-8 px-2 sm:px-4 md:px-6 max-w-[960px] mx-auto"
      }`}
    >
      {/* =========================================================================
          THE CLIPBOARD CONTAINER (Architectural Yellow Hardboard with Tactile Fiber Texture)
          ========================================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 md:p-6 mcpa-clipboard-board transition-all">
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
              className={`relative rounded-xl sm:rounded-2xl mcpa-paper-sheet p-4 sm:p-6 md:p-8 transition-all ${animClass}`}
            >
              {/* STAMPED VERIFIED CLIENT PROFILE HEADER (NO REDUNDANT INPUTS) */}
              <div className="border-b border-neutral-200 dark:border-white/10 pb-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                  {/* Left: Document Branding & Reference Number */}
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400 font-bold mb-1">
                      <span>PROJECT INTAKE DOSSIER</span>
                      <span>•</span>
                      <span>STAGE 1: BRIEF</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
                      {isFil ? "Architectural Client Profiling" : "Architectural Client Profiling"}
                    </h2>
                  </div>

                  {/* Right: Sheet Tab Indicator */}
                  <div className="flex items-center gap-1 self-start sm:self-auto bg-neutral-100 dark:bg-white/[0.05] p-1 rounded-xl border border-neutral-200 dark:border-white/10 font-mono text-xs shrink-0">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => goToSheet(num, num > sheet ? "next" : "prev")}
                        className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all font-bold cursor-pointer text-[11px] sm:text-xs ${
                          sheet === num
                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        {isFil ? `P${num}` : `Sheet ${num}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stamped Verified Client Profile Strip */}
                {currentUser && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      {currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture ? (
                        <img
                          src={currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture}
                          alt={`${currentUser.fullName || "Client"} profile`}
                          className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0"
                        />
                      ) : (
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <span className="font-bold text-neutral-900 dark:text-white truncate">
                        {currentUser.fullName || "Valued Client"}
                      </span>
                      <span className="text-neutral-400 hidden sm:inline">•</span>
                      <span className="text-neutral-500 dark:text-neutral-400 truncate hidden sm:inline">{currentUser.email}</span>
                      {currentUser.phoneNumber && (
                        <span className="text-neutral-500 dark:text-neutral-400 hidden md:inline">• {currentUser.phoneNumber}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SHEET 1: PROJECT CLASSIFICATION & AESTHETIC STYLE
                  ========================================================================= */}
              {sheet === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                      1. {isFil ? "Uri ng Proyekto (Project Category) *" : "Project Classification & Category *"}
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl transition-all ${errors.projectType ? "ring-2 ring-red-500/50 p-2 bg-red-500/5" : ""}`}>
                      {PROJECT_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = projectType === cat.val;
                        return (
                          <button
                            key={cat.val}
                            type="button"
                            onClick={() => {
                              // Toggle off if already selected
                              setProjectType(isSelected ? "" : cat.val);
                              if (isSelected || cat.val !== "Other") setProjectTypeOther("");
                              if (errors.projectType) setErrors((p) => ({ ...p, projectType: undefined }));
                            }}
                            className={`p-3 sm:p-4 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? "bg-amber-500/12 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 text-neutral-900 dark:text-white shadow-md"
                                : "bg-neutral-50 dark:bg-white/[0.03] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/50"
                            }`}
                          >
                            <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-600 dark:text-neutral-300"}`}>
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
                    {errors.projectType && <p className="mt-1.5 text-[11px] text-red-500 font-mono">{errors.projectType}</p>}
                    {projectType === "Other" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={projectTypeOther}
                          onChange={(e) => {
                            setProjectTypeOther(e.target.value);
                            if (errors.projectTypeOther) setErrors((p) => ({ ...p, projectTypeOther: undefined }));
                          }}
                          placeholder={isFil ? "Ilarawan ang uri ng inyong proyekto..." : "Describe your project type (e.g. Chapel, School Building, Gym...)"}
                          className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.projectTypeOther ? "border-red-500" : "border-amber-400"}`}
                          autoFocus
                        />
                        {errors.projectTypeOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.projectTypeOther}</p>}
                      </div>
                    )}
                  </div>

                  {/* Architectural Style Peg */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                      2. {isFil ? "Estilong Pang-Arkitektura (Aesthetic Style Peg) *" : "Architectural Style & Design Peg *"}
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 rounded-xl transition-all ${errors.preferredStyle ? "ring-2 ring-red-500/50 p-2 bg-red-500/5" : ""}`}>
                      {ARCH_STYLES.map((style) => {
                        const isSelected = preferredStyle === style.name;
                        return (
                          <button
                            key={style.name}
                            type="button"
                            onClick={() => {
                              setPreferredStyle(isSelected ? "" : style.name);
                              if (isSelected || style.name !== "Custom Architectural Concept") setPreferredStyleCustom("");
                              if (errors.preferredStyle) setErrors((p) => ({ ...p, preferredStyle: undefined }));
                            }}
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
                    {errors.preferredStyle && <p className="mt-1.5 text-[11px] text-red-500 font-mono">{errors.preferredStyle}</p>}
                    {preferredStyle === "Custom Architectural Concept" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={preferredStyleCustom}
                          onChange={(e) => {
                            setPreferredStyleCustom(e.target.value);
                            if (errors.preferredStyleCustom) setErrors((p) => ({ ...p, preferredStyleCustom: undefined }));
                          }}
                          placeholder={
                            isFil
                              ? "Ilarawan ang inyong sariling architectural concept o peg..."
                              : "Describe your custom architectural concept or design peg (e.g. Modern Farmhouse, Brutalist, Japandi...)"
                          }
                          className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.preferredStyleCustom ? "border-red-500" : "border-amber-400"}`}
                          autoFocus
                        />
                        {errors.preferredStyleCustom && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.preferredStyleCustom}</p>}
                      </div>
                    )}
                  </div>

                  {/* Intended Storeys & Target Start */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        3. {isFil ? "Bilang ng Palapag (Target Storeys) *" : "Intended Number of Storeys *"}
                      </label>
                      <select
                        value={storeys}
                        onChange={(e) => {
                          setStoreys(e.target.value);
                          if (e.target.value !== "Other") setStoreysOther("");
                          if (errors.storeys) setErrors((p) => ({ ...p, storeys: undefined }));
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.storeys ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                      >
                        <option value="">— Select number of storeys —</option>
                        {STOREY_OPTIONS.map((opt) => (
                          <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                      </select>
                      {errors.storeys && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.storeys}</p>}
                      {storeys === "Other" && (
                        <input
                          type="text"
                          value={storeysOther}
                          onChange={(e) => setStoreysOther(e.target.value)}
                          placeholder={isFil ? "Ilagay ang bilang ng palapag..." : "Specify number of storeys..."}
                          className="mt-2 w-full h-11 px-3.5 rounded-xl border border-amber-400 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400"
                          autoFocus
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        4. {isFil ? "Kailan Balak Simulan (Target Timeline) *" : "Target Construction Timeline *"}
                      </label>
                      <select
                        value={targetTimeline}
                        onChange={(e) => {
                          setTargetTimeline(e.target.value);
                          if (e.target.value !== "Other") setTargetTimelineOther("");
                          if (errors.targetTimeline) setErrors((p) => ({ ...p, targetTimeline: undefined }));
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.targetTimeline ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                      >
                        <option value="">— Select target timeline —</option>
                        <option value="Immediate (Within 1-3 Months)">Immediate (Within 1-3 Months)</option>
                        <option value="Within 3-6 Months">Within 3-6 Months</option>
                        <option value="Planning for Next Year (6-12 Months)">Planning for Next Year (6-12 Months)</option>
                        <option value="Flexible / Exploratory">Flexible / Exploratory</option>
                        <option value="Other">Other (Specify)</option>
                      </select>
                      {errors.targetTimeline && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.targetTimeline}</p>}
                      {targetTimeline === "Other" && (
                        <div className="mt-2">
                          <input type="text" value={targetTimelineOther} onChange={(e) => { setTargetTimelineOther(e.target.value); if (errors.targetTimelineOther) setErrors((p) => ({ ...p, targetTimelineOther: undefined })); }} placeholder="e.g. Within 2 years, After OFW contract ends..." className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.targetTimelineOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                          {errors.targetTimelineOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.targetTimelineOther}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sheet 1 Footer Action */}
                  <div className="pt-5 border-t border-neutral-200 dark:border-white/10 space-y-3">
                    {/* Validation error summary */}
                    {Object.keys(errors).length > 0 && (
                      <div key={shakeKey} className="mcpa-shake text-red-600 dark:text-red-500 text-xs font-mono space-y-1">
                        <p className="font-bold uppercase tracking-wider mb-1">⚠ Please complete the following before continuing:</p>
                        {Object.values(errors).filter(Boolean).map((msg, i) => (
                          <p key={i}>• {msg}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => goToSheet(2, "next")}
                        className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <span>Next: Site & Satellite Map →</span>
                      </button>
                    </div>
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

                  {/* Philippine Structured Address Cascade */}
                  <div>
                    <PhAddressCascadeSection
                      province={buildProvince}
                      provinceCode={buildProvinceCode}
                      onProvinceChange={(nameOrObj, code) => {
                        const name = typeof nameOrObj === "object" ? nameOrObj.name : nameOrObj;
                        const pCode = typeof nameOrObj === "object" ? nameOrObj.code : code;
                        setBuildProvince(name ?? "");
                        setBuildProvinceCode(pCode ?? "");
                        setErrors((p) => ({ ...p, buildProvince: undefined, buildCity: undefined, buildBarangay: undefined }));
                      }}
                      city={buildCity}
                      cityCode={buildCityCode}
                      onCityChange={(nameOrObj, code) => {
                        const name = typeof nameOrObj === "object" ? nameOrObj.name : nameOrObj;
                        const cCode = typeof nameOrObj === "object" ? nameOrObj.code : code;
                        setBuildCity(name ?? "");
                        setBuildCityCode(cCode ?? "");
                        setErrors((p) => ({ ...p, buildCity: undefined, buildBarangay: undefined }));
                      }}
                      barangay={buildBarangay}
                      barangayCode={buildBarangayCode}
                      onBarangayChange={(nameOrObj, code) => {
                        const name = typeof nameOrObj === "object" ? nameOrObj.name : nameOrObj;
                        const bCode = typeof nameOrObj === "object" ? nameOrObj.code : code;
                        setBuildBarangay(name ?? "");
                        setBuildBarangayCode(bCode ?? "");
                        setErrors((p) => ({ ...p, buildBarangay: undefined }));
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
                      attempted={addressAttempted}
                      onClearErrors={() => setErrors((p) => ({ ...p, buildProvince: undefined, buildCity: undefined, buildBarangay: undefined }))}
                    />
                    {/* Address field-level errors shown below the cascade */}
                    {(errors.buildProvince || errors.buildCity || errors.buildBarangay) && (
                      <div className="mt-2 space-y-1">
                        {errors.buildProvince && <p className="text-[11px] text-red-500 font-mono">• {errors.buildProvince}</p>}
                        {errors.buildCity && <p className="text-[11px] text-red-500 font-mono">• {errors.buildCity}</p>}
                        {errors.buildBarangay && <p className="text-[11px] text-red-500 font-mono">• {errors.buildBarangay}</p>}
                      </div>
                    )}
                  </div>

                  {/* Interactive Google / Satellite Map with Fullscreen */}
                  <div className="pt-2">
                    <LotMapPicker
                      coordinates={mapCoordinates}
                      onCoordinatesChange={setMapCoordinates}
                      locationAddress={formattedBuildAddress}
                      city={buildCity}
                      province={buildProvince}
                      barangay={buildBarangay}
                      subdivision={buildSubdivision}
                      street={buildStreet}
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
                        onChange={(e) => {
                          setLotStatus(e.target.value);
                          if (e.target.value !== "Other") setLotStatusOther("");
                          if (errors.lotStatus) setErrors((p) => ({ ...p, lotStatus: undefined }));
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.lotStatus ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                      >
                        <option value="">— Select lot status —</option>
                        {LOT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.val} value={opt.val}>{opt.val}</option>
                        ))}
                      </select>
                      {errors.lotStatus && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.lotStatus}</p>}
                      {lotStatus === "Other" && (
                        <div className="mt-2">
                          <input type="text" value={lotStatusOther} onChange={(e) => { setLotStatusOther(e.target.value); if (errors.lotStatusOther) setErrors((p) => ({ ...p, lotStatusOther: undefined })); }} placeholder="e.g. Inherited land, Foreclosed property..." className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.lotStatusOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                          {errors.lotStatusOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.lotStatusOther}</p>}
                        </div>
                      )}
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
                        onChange={(e) => {
                          setLotArea(e.target.value);
                          if (errors.lotArea) setErrors((p) => ({ ...p, lotArea: undefined }));
                        }}
                        placeholder="e.g. 240"
                        className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.lotArea ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                      />
                      {errors.lotArea && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.lotArea}</p>}
                    </div>
                  </div>

                  {/* Sheet 2 Navigation */}
                  <div className="pt-5 border-t border-neutral-200 dark:border-white/10 space-y-3">
                    {Object.keys(errors).length > 0 && (
                      <div key={shakeKey} className="mcpa-shake text-red-600 dark:text-red-500 text-xs font-mono space-y-1">
                        <p className="font-bold uppercase tracking-wider mb-1">⚠ Please complete the following before continuing:</p>
                        {Object.values(errors).filter(Boolean).map((msg, i) => (
                          <p key={i}>• {msg}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => goToSheet(1, "prev")}
                        className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Back (Sheet 1)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => goToSheet(3, "next")}
                        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <span>Next: Wishlist & Budget →</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
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
                          onChange={(e) => {
                            setBedrooms(e.target.value);
                            if (e.target.value !== "Other") setBedroomsOther("");
                            if (errors.bedrooms) setErrors((p) => ({ ...p, bedrooms: undefined }));
                          }}
                          className={`w-full h-10 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.bedrooms ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          <option value="">— Select —</option>
                          <option value="2 Bedrooms">2 Bedrooms</option>
                          <option value="3 Bedrooms">3 Bedrooms</option>
                          <option value="3 - 4 Bedrooms">3 - 4 Bedrooms</option>
                          <option value="4 - 5 Bedrooms">4 - 5 Bedrooms</option>
                          <option value="5+ Bedrooms">5+ Luxury Bedrooms</option>
                          <option value="Other">Other (Specify)</option>
                        </select>
                        {errors.bedrooms && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.bedrooms}</p>}
                        {bedrooms === "Other" && (
                          <div className="mt-1.5">
                            <input type="text" value={bedroomsOther} onChange={(e) => { setBedroomsOther(e.target.value); if (errors.bedroomsOther) setErrors((p) => ({ ...p, bedroomsOther: undefined })); }} placeholder="e.g. 6 Bedrooms, Studio..." className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.bedroomsOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                            {errors.bedroomsOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.bedroomsOther}</p>}
                          </div>
                        )}
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Bilang ng Banyo (Bathrooms)" : "Target Bathrooms"}
                        </span>
                        <select
                          value={bathrooms}
                          onChange={(e) => {
                            setBathrooms(e.target.value);
                            if (e.target.value !== "Other") setBathroomsOther("");
                            if (errors.bathrooms) setErrors((p) => ({ ...p, bathrooms: undefined }));
                          }}
                          className={`w-full h-10 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.bathrooms ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          <option value="">— Select —</option>
                          <option value="2 Bathrooms">2 Bathrooms</option>
                          <option value="2 - 3 Bathrooms">2 - 3 Bathrooms</option>
                          <option value="3 - 4 Bathrooms">3 - 4 Bathrooms</option>
                          <option value="4+ Bathrooms">4+ Bathrooms</option>
                          <option value="Other">Other (Specify)</option>
                        </select>
                        {errors.bathrooms && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.bathrooms}</p>}
                        {bathrooms === "Other" && (
                          <div className="mt-1.5">
                            <input type="text" value={bathroomsOther} onChange={(e) => { setBathroomsOther(e.target.value); if (errors.bathroomsOther) setErrors((p) => ({ ...p, bathroomsOther: undefined })); }} placeholder="e.g. 5 Bathrooms, 1 powder room..." className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.bathroomsOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                            {errors.bathroomsOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.bathroomsOther}</p>}
                          </div>
                        )}
                      </div>

                      {/* Garage */}
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Garahe (Carport / Garage)" : "Car Garage Capacity"}
                        </span>
                        <select
                          value={carGarage}
                          onChange={(e) => {
                            setCarGarage(e.target.value);
                            if (e.target.value !== "Other") setCarGarageOther("");
                            if (errors.carGarage) setErrors((p) => ({ ...p, carGarage: undefined }));
                          }}
                          className={`w-full h-10 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.carGarage ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          <option value="">— Select —</option>
                          <option value="1-Car Garage">1-Car Garage</option>
                          <option value="2-Car Garage">2-Car Garage</option>
                          <option value="3-Car Garage">3-Car Garage</option>
                          <option value="4+ Car Luxury Garage">4+ Car Luxury Garage</option>
                          <option value="No Garage / Carport Only">No Garage / Carport Only</option>
                          <option value="Other">Other (Specify)</option>
                        </select>
                        {errors.carGarage && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.carGarage}</p>}
                        {carGarage === "Other" && (
                          <div className="mt-1.5">
                            <input type="text" value={carGarageOther} onChange={(e) => { setCarGarageOther(e.target.value); if (errors.carGarageOther) setErrors((p) => ({ ...p, carGarageOther: undefined })); }} placeholder="e.g. Basement parking, Tandem garage..." className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.carGarageOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                            {errors.carGarageOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.carGarageOther}</p>}
                          </div>
                        )}
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
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-mono text-sm pointer-events-none">₱</span>
                        <input
                          type="text"
                          value={budgetRange}
                          onChange={(e) => {
                            setBudgetRange(e.target.value);
                            if (errors.budgetRange) setErrors((p) => ({ ...p, budgetRange: undefined }));
                          }}
                          placeholder="e.g. 4,000,000 – 7,000,000"
                          className={`w-full h-11 pl-7 pr-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.budgetRange ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        />
                      </div>
                      {errors.budgetRange && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.budgetRange}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        4. {isFil ? "Paraan ng Pagbabayad / Financing *" : "Financing Program Preference *"}
                      </label>
                      <select
                        value={financingOption}
                        onChange={(e) => {
                          setFinancingOption(e.target.value);
                          if (e.target.value !== "Other") setFinancingOptionOther("");
                          if (errors.financingOption) setErrors((p) => ({ ...p, financingOption: undefined }));
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.financingOption ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                      >
                        <option value="">— Select financing option —</option>
                        {FINANCING_OPTIONS.map((f) => (
                          <option key={f.val} value={f.val}>
                            {f.val === "Other" ? "Other (Specify)" : f.val}
                          </option>
                        ))}
                      </select>
                      {errors.financingOption && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.financingOption}</p>}
                      {financingOption === "Other" && (
                        <div className="mt-2">
                          <input type="text" value={financingOptionOther} onChange={(e) => { setFinancingOptionOther(e.target.value); if (errors.financingOptionOther) setErrors((p) => ({ ...p, financingOptionOther: undefined })); }} placeholder="e.g. Cash payment, Personal loan, OFW remittance..." className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.financingOptionOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                          {errors.financingOptionOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.financingOptionOther}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Setup (Google Meet vs MCPA Office) */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-4">
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200">
                      5. {isFil ? "Unang Konsultasyon (Initial Consultation Meeting) *" : "Initial Consultation Meeting Preference *"}
                    </label>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl transition-all ${errors.meetingMode ? "ring-2 ring-red-500/50 p-2 bg-red-500/5" : ""}`}>
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
                            onClick={() => {
                              setMeetingMode(isSelected ? "" : mode.val);
                              if (errors.meetingMode) setErrors((p) => ({ ...p, meetingMode: undefined }));
                            }}
                            className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500/30"
                                : "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10"}`}>
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

                    {errors.meetingMode && <p className="text-[11px] text-red-500 font-mono">{errors.meetingMode}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Napiling Araw" : "Target Consultation Date"}
                        </span>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => {
                            setMeetingDate(e.target.value);
                            if (errors.meetingDate) setErrors((p) => ({ ...p, meetingDate: undefined }));
                          }}
                          className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.meetingDate ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        />
                        {errors.meetingDate && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.meetingDate}</p>}
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                          {isFil ? "Oras ng Pagpupulong" : "Preferred Time Slot"}
                        </span>
                        <select
                          value={meetingTime}
                          onChange={(e) => {
                            setMeetingTime(e.target.value);
                            if (e.target.value !== "Other") setMeetingTimeOther("");
                            if (errors.meetingTime) setErrors((p) => ({ ...p, meetingTime: undefined }));
                          }}
                          className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none ${errors.meetingTime ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        >
                          <option value="">— Select time slot —</option>
                          <option value="09:00 AM - 10:30 AM PHT">09:00 AM - 10:30 AM PHT (Morning)</option>
                          <option value="02:00 PM - 03:30 PM PHT">02:00 PM - 03:30 PM PHT (Afternoon)</option>
                          <option value="04:00 PM - 05:30 PM PHT">04:00 PM - 05:30 PM PHT (Late Afternoon)</option>
                          <option value="08:00 PM - 09:30 PM PHT (OFW Evening Slot)">08:00 PM - 09:30 PM PHT (OFW Evening Slot)</option>
                          <option value="Other">Other (Specify)</option>
                        </select>
                        {errors.meetingTime && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.meetingTime}</p>}
                        {meetingTime === "Other" && (
                          <div className="mt-1.5">
                            <input type="text" value={meetingTimeOther} onChange={(e) => { setMeetingTimeOther(e.target.value); if (errors.meetingTimeOther) setErrors((p) => ({ ...p, meetingTimeOther: undefined })); }} placeholder="e.g. 7:00 AM, Weekend morning..." className={`w-full h-9 px-3 rounded-xl border bg-white dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.meetingTimeOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                            {errors.meetingTimeOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.meetingTimeOther}</p>}
                          </div>
                        )}
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

                  {/* Error Notification & Sheet 3 Navigation */}
                  <div className="pt-6 border-t border-neutral-200 dark:border-white/10 space-y-3">
                    {(submitError || Object.keys(errors).length > 0) && (
                      <div key={shakeKey} className="mcpa-shake text-red-600 dark:text-red-500 text-xs font-mono space-y-1">
                        <p className="font-bold uppercase tracking-wider mb-1">⚠ Please complete the following before submitting:</p>
                        {Object.values(errors).filter(Boolean).map((msg, i) => (
                          <p key={i}>• {msg}</p>
                        ))}
                        {submitError && <p>• {submitError}</p>}
                      </div>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => goToSheet(2, "prev")}
                        disabled={isSubmitting}
                        className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Back (Sheet 2)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Brief...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            <span>Submit Brief & Book Meeting ✔</span>
                          </>
                        )}
                      </button>
                    </div>
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
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">
                    {projectType === "Other" ? (projectTypeOther || "Other") : projectType}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                  <span className="text-neutral-400 block text-[9px]">STYLE PEG</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">
                    {preferredStyle === "Custom Architectural Concept" ? (preferredStyleCustom || "Custom Architectural Concept") : preferredStyle}
                  </span>
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
