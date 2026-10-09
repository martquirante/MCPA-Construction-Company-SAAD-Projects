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
import { Building2, MapPin, Coffee, ExternalLink, Sparkles, Video, Calendar } from "lucide-react";
import LottieSuccessCheck from "@/modules/shared/LottieSuccessCheck";
import VenueSearchModal, { EstablishmentLogo } from "./VenueSearchModal";
import VenueCombobox from "./VenueCombobox";

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
  { id: "other", labelEn: "Others (Specify)", labelFil: "Iba Pa (Tukuyin)" },
];

function formatSingleBudgetNumber(numStr) {
  const hasTrailingDot = numStr.endsWith(".");
  const clean = numStr.replace(/,/g, "").trim();
  if (!clean) return "";

  const dotParts = clean.split(".");
  const intPart = dotParts[0];
  const decPart = dotParts.length > 1 ? dotParts.slice(1).join("") : null;
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (decPart !== null) return `${formattedInt}.${decPart}`;
  if (hasTrailingDot) return `${formattedInt}.`;
  return formattedInt;
}

function formatBudgetInput(raw) {
  if (!raw) return "";
  // Disallow letters and invalid characters (allow only numbers, commas, dots, dashes, and spaces)
  const sanitized = raw.replace(/[^0-9,.\-\s–—]/g, "");
  if (!sanitized) return "";

  const dashMatch = sanitized.match(/(\s*[-–—]\s*)/);
  if (dashMatch) {
    const parts = sanitized.split(/[-–—]/);
    const formattedParts = parts.map((p) => formatSingleBudgetNumber(p));
    if (sanitized.endsWith("-") || sanitized.endsWith("–") || sanitized.endsWith("—") || sanitized.endsWith(" ")) {
      return `${formattedParts[0]} - ${formattedParts[1] || ""}`;
    }
    return formattedParts.join(" - ");
  }

  const res = formatSingleBudgetNumber(sanitized);
  return sanitized.endsWith(" ") ? `${res} ` : res;
}

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
  const [featuresOther, setFeaturesOther] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false);
  const [budgetCustom, setBudgetCustom] = useState("");
  const [financingOption, setFinancingOption] = useState("");
  const [financingOptionOther, setFinancingOptionOther] = useState("");

  const [meetingMode, setMeetingMode] = useState("");
  const [inPersonVenue, setInPersonVenue] = useState("office"); // "office" | "site" | "cafe"
  const [venueCafeDetails, setVenueCafeDetails] = useState("");
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTimeOther, setMeetingTimeOther] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const notesTextareaRef = useRef(null);

  // Auto-resize textarea as content grows or shrinks
  useEffect(() => {
    const el = notesTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextH = Math.max(92, el.scrollHeight);
    el.style.height = `${nextH}px`;
  }, [specialNotes, sheet]);

  // Detected Peg Links extracted from Special Notes
  const detectedLinks = useMemo(() => {
    if (!specialNotes) return [];
    const matches = specialNotes.match(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi) || [];
    const unique = Array.from(new Set(matches));

    return unique.map((raw) => {
      const href = raw.startsWith("http") ? raw : `https://${raw}`;
      try {
        const urlObj = new URL(href);
        const host = urlObj.hostname.replace(/^www\./, "").toLowerCase();

        let label = "Web Reference";
        let brandName = host;
        let categoryColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";

        if (host.includes("pinterest") || host === "pin.it") {
          label = "Pinterest Peg / Moodboard";
          brandName = "Pinterest";
          categoryColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
        } else if (host.includes("drive.google")) {
          label = "Google Drive Folder";
          brandName = "Google Drive";
          categoryColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
        } else if (host.includes("youtube") || host === "youtu.be") {
          label = "YouTube Video / Tour";
          brandName = "YouTube";
          categoryColor = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
        } else if (host.includes("instagram")) {
          label = "Instagram Post / Reel";
          brandName = "Instagram";
          categoryColor = "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30";
        } else if (host.includes("facebook") || host.includes("fb.watch")) {
          label = "Facebook Album / Post";
          brandName = "Facebook";
          categoryColor = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
        } else if (host.includes("tiktok")) {
          label = "TikTok Peg Video";
          brandName = "TikTok";
          categoryColor = "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/30";
        } else if (host.includes("canva")) {
          label = "Canva Moodboard";
          brandName = "Canva";
          categoryColor = "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";
        } else if (host.includes("dropbox")) {
          label = "Dropbox Peg Folder";
          brandName = "Dropbox";
          categoryColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
        } else if (host.includes("houzz")) {
          label = "Houzz Architectural Design";
          brandName = "Houzz";
          categoryColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        } else if (host.includes("archdaily")) {
          label = "ArchDaily Architectural Feature";
          brandName = "ArchDaily";
          categoryColor = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
        } else if (host.includes("behance")) {
          label = "Behance Design Concept";
          brandName = "Behance";
          categoryColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
        }

        const favicon = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
          urlObj.origin
        )}&size=64`;

        return {
          raw,
          href,
          hostname: host,
          brandName,
          label,
          categoryColor,
          pathname: urlObj.pathname.length > 28 ? urlObj.pathname.slice(0, 28) + "..." : urlObj.pathname,
          favicon,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }, [specialNotes]);

  // Calculate today's date in local time (YYYY-MM-DD) to disallow past dates
  const todayDateString = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Check if current authenticated client logged in via Google OAuth
  const isGoogleUser = useMemo(() => {
    if (!currentUser) return false;
    const provider = (
      currentUser.authProvider ||
      currentUser.auth_provider ||
      currentUser.provider ||
      ""
    ).toLowerCase();
    if (provider === "google") return true;

    const avatar =
      currentUser.avatarUrl ||
      currentUser.avatar_url ||
      currentUser.photoURL ||
      currentUser.picture ||
      "";
    if (avatar.includes("googleusercontent.com")) return true;

    if (currentUser.googleId || currentUser.google_id) return true;
    return false;
  }, [currentUser]);

  // Robust client phone resolution across all profile and storage keys
  const clientPhone = useMemo(() => {
    if (!currentUser) return "";
    const direct =
      currentUser.phoneNumber ||
      currentUser.phone ||
      currentUser.contactNumber ||
      currentUser.contact_number ||
      currentUser.mobileNumber ||
      currentUser.mobile;
    if (direct) return direct;

    if (typeof window !== "undefined") {
      try {
        const savedPhone = localStorage.getItem("mcpa_client_phone");
        if (savedPhone) return savedPhone;

        const briefs = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
        const found = briefs.find(
          (b) =>
            (b.client_email === currentUser.email || b.email === currentUser.email) &&
            (b.client_phone || b.phone)
        );
        if (found?.client_phone || found?.phone) return found.client_phone || found.phone;
      } catch {}
    }
    return "";
  }, [currentUser]);

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
      if (next.has(id)) {
        next.delete(id);
        if (id === "other") {
          setFeaturesOther("");
          setErrors((p) => ({ ...p, featuresOther: undefined }));
        }
      } else {
        next.add(id);
      }
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
    if (selectedFeatures.has("other") && !featuresOther.trim()) {
      e.featuresOther = isFil
        ? "Pakitukoy ang iba pang katangian o provision."
        : "Please specify your custom architectural feature(s).";
    }
    if (!budgetRange || !budgetRange.trim()) e.budgetRange = "Please enter your target budget range.";
    if (!financingOption) e.financingOption = "Please select a financing option.";
    if (financingOption === "Other" && !financingOptionOther.trim()) e.financingOptionOther = "Please describe your financing arrangement.";
    if (!meetingMode) e.meetingMode = "Please select a meeting mode.";
    if (meetingMode.includes("In-Person") && inPersonVenue === "cafe" && !venueCafeDetails.trim()) {
      e.venueCafeDetails = isFil
        ? "Pakitukoy ang coffee shop o lugar ng pagpupulong."
        : "Please select or search your preferred coffee shop or venue.";
    }
    if (!meetingDate) {
      e.meetingDate = isFil ? "Pumili ng araw ng pagpupulong." : "Please select a consultation date.";
    } else if (meetingDate < todayDateString) {
      e.meetingDate = isFil
        ? "Hindi maaaring pumili ng nakaraang petsa. Piliin ang kasalukuyan o darating na araw."
        : "Past dates are not allowed. Please choose today or a future date.";
    }
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

    const isF2F = meetingMode.includes("In-Person");
    const resolvedVenueType = !isF2F
      ? null
      : inPersonVenue === "office"
      ? "MCPA Head Office"
      : inPersonVenue === "site"
      ? "Project Site"
      : "Coffee Shop / Public Venue";

    const resolvedVenueDetails = !isF2F
      ? null
      : inPersonVenue === "office"
      ? "2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan"
      : inPersonVenue === "site"
      ? (formattedBuildAddress || "Proposed Project Site")
      : venueCafeDetails;

    const userAvatar =
      currentUser?.avatarUrl ||
      currentUser?.avatar_url ||
      currentUser?.photoURL ||
      currentUser?.picture ||
      (currentUser?.email?.toLowerCase() === "rayquirante@gmail.com" || currentUser?.email?.toLowerCase() === "martquirante04@gmail.com"
        ? "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c"
        : null);

    const briefPayload = {
      id,
      submissionId: id,
      clientName: currentUser?.fullName || "Valued Client",
      clientEmail: currentUser?.email || "",
      clientPhone: currentUser?.phoneNumber || "",
      userId: currentUser?.userId || currentUser?.id || null,
      avatarUrl: userAvatar,
      avatar_url: userAvatar,
      authProvider: isGoogleUser ? "google" : (currentUser?.authProvider || currentUser?.provider || "local"),
      auth_provider: isGoogleUser ? "google" : (currentUser?.authProvider || currentUser?.provider || "local"),
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
        featureTags: Array.from(selectedFeatures).map((id) =>
          id === "other"
            ? (featuresOther.trim() ? `Other: ${featuresOther.trim()}` : "Other")
            : id
        ),
        featureTagsOther: selectedFeatures.has("other") ? featuresOther.trim() : "",
      },
      meetingMode: isF2F ? `In-Person (${resolvedVenueType})` : meetingMode,
      venueType: resolvedVenueType,
      venueDetails: resolvedVenueDetails,
      wantsMeeting: true,
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
    setSelectedFeatures(new Set());
    setFeaturesOther("");
    setMeetingMode("");
    setInPersonVenue("office");
    setVenueCafeDetails("");
    setIsVenueModalOpen(false);
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
        {/* TOP CLAMP ASSEMBLY: HEAVY-DUTY ARCHITECTURAL SPRING CLAMP WITH STEEL WIRE & RIVETS */}
        <div className="absolute -top-6 sm:-top-7 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="relative flex flex-col items-center">
            {/* Arched Steel Hanging Wire Bracket */}
            <div className="w-12 h-5 -mb-2.5 rounded-t-xl border-x-[3.5px] border-t-[3.5px] border-neutral-300 dark:border-neutral-500 bg-transparent shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-15" />

            {/* Heavy-Duty Industrial Brushed Metal Clamp Bar */}
            <div className="relative w-72 sm:w-96 h-12 sm:h-13 rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 dark:from-neutral-600 dark:via-neutral-700 dark:to-neutral-800 border-x-2 border-b-2 border-slate-300 dark:border-neutral-600 shadow-[0_16px_30px_rgba(0,0,0,0.65)] flex items-center justify-between px-4 sm:px-6 z-20">
              {/* Metallic Top Bevel Highlight Strip */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/90 dark:bg-white/30 rounded-t-none" />

              {/* Left Industrial Cross-Head Rivet Bolt */}
              <div className="relative w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 border border-slate-600 dark:border-neutral-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <div className="absolute w-2 h-[1px] bg-slate-700 dark:bg-neutral-900 rotate-45" />
                <div className="absolute w-[1px] h-2 bg-slate-700 dark:bg-neutral-900 rotate-45" />
              </div>

              {/* Embossed Company Logo & INQUIRY SHEET Title on Clip */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 min-w-0 px-2">
                <img
                  src="/assets/mcpa-logo.svg"
                  alt="MCPA Logo"
                  className="h-3.5 sm:h-4 w-auto object-contain block dark:hidden drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
                />
                <img
                  src="/assets/logo-white.svg"
                  alt="MCPA Logo"
                  className="h-3.5 sm:h-4 w-auto object-contain hidden dark:block drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                />
                <span className="h-3 w-[1px] bg-slate-400/80 dark:bg-white/20 shrink-0" />
                <span className="font-mono text-[9px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.22em] sm:tracking-[0.28em] text-slate-800 dark:text-neutral-100 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] truncate select-none">
                  INQUIRY SHEET
                </span>
              </div>

              {/* Right Industrial Cross-Head Rivet Bolt */}
              <div className="relative w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 border border-slate-600 dark:border-neutral-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <div className="absolute w-2 h-[1px] bg-slate-700 dark:bg-neutral-900 -rotate-45" />
                <div className="absolute w-[1px] h-2 bg-slate-700 dark:bg-neutral-900 -rotate-45" />
              </div>

              {/* Bottom Clamp Gripping Jaw Lip */}
              <div className="absolute -bottom-1 inset-x-2 h-1 rounded-b-sm bg-slate-700 dark:bg-neutral-900 border-b border-black/90" />
            </div>

            {/* Direct Contact Clamp Shadow biting into paper */}
            <div className="w-72 sm:w-96 h-2 bg-black/65 blur-[1.5px] -mt-0.5 z-10 pointer-events-none" />
            {/* Soft Ambient Shadow Spreading Downward */}
            <div className="w-80 sm:w-[28rem] h-5 bg-black/45 blur-md -mt-1 pointer-events-none" />
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
        <div className="relative clipboard-perspective mt-6 sm:mt-5">
          {/* Physical Stacked Sheets Illusion (Underlying Sheet 3 & Sheet 2 visible edges) */}
          <div className="absolute inset-0 translate-y-2 translate-x-1 rotate-[0.35deg] rounded-xl sm:rounded-2xl bg-[#f0e4d0] dark:bg-[#141922] border border-amber-900/25 dark:border-white/5 shadow-md pointer-events-none opacity-85" />
          <div className="absolute inset-0 translate-y-1 -translate-x-0.5 -rotate-[0.2deg] rounded-xl sm:rounded-2xl bg-[#f7eedf] dark:bg-[#1a1f2b] border border-amber-900/18 dark:border-white/8 shadow-sm pointer-events-none opacity-95" />

          {!isSubmitted ? (
            <div
              className={`relative rounded-xl sm:rounded-2xl mcpa-paper-sheet p-4 sm:p-6 md:p-8 transition-all ${animClass}`}
            >
              {/* Technical Blueprint Corner Crosshair Registration Marks (+) */}
              <div className="absolute top-3 left-3 text-amber-800/35 dark:text-amber-400/25 font-mono text-[11px] font-bold select-none pointer-events-none leading-none">+</div>
              <div className="absolute top-3 right-3 text-amber-800/35 dark:text-amber-400/25 font-mono text-[11px] font-bold select-none pointer-events-none leading-none">+</div>
              <div className="absolute bottom-3 left-3 text-amber-800/35 dark:text-amber-400/25 font-mono text-[11px] font-bold select-none pointer-events-none leading-none">+</div>
              <div className="absolute bottom-3 right-3 text-amber-800/35 dark:text-amber-400/25 font-mono text-[11px] font-bold select-none pointer-events-none leading-none">+</div>
              {/* STAMPED VERIFIED CLIENT PROFILE HEADER (NO REDUNDANT INPUTS) */}
              <div className="border-b border-neutral-200 dark:border-white/10 pb-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                  {/* Left: Document Branding & Reference Number */}
                  <div>

                    <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white leading-tight">
                      CLIENT INQUIRY SHEET
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
                  <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-neutral-100/90 dark:bg-white/[0.04] border border-neutral-200/90 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar with Google badge */}
                      <div className="relative shrink-0">
                        {currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture ? (
                          <img
                            src={currentUser.avatarUrl || currentUser.avatar_url || currentUser.photoURL || currentUser.picture}
                            alt={`${currentUser.fullName || "Client"} profile`}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-emerald-500/50 shadow-xs"
                          />
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                            {(currentUser.fullName || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isGoogleUser && (
                          <div
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/20 shadow-xs flex items-center justify-center p-0.5"
                            title="Signed in with Google"
                          >
                            <svg className="w-full h-full" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name, Google Badge & Contacts (Visible on ALL devices) */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-neutral-900 dark:text-white text-xs truncate">
                            {currentUser.fullName || currentUser.name || "Valued Client"}
                          </span>

                          {/* Google Badge on ALL Devices */}
                          {isGoogleUser && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 shadow-2xs text-[10px] font-medium text-neutral-700 dark:text-neutral-200">
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span className="leading-none text-[9.5px]">Google</span>
                            </span>
                          )}
                        </div>

                        {/* Email & Phone Contact Line (Visible on Mobile + Desktop) */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                          {currentUser.email && (
                            <span className="flex items-center gap-1 break-all">
                              <span className="text-neutral-400 dark:text-neutral-500">✉</span>
                              <span>{currentUser.email}</span>
                            </span>
                          )}

                          {clientPhone ? (
                            <>
                              <span className="text-neutral-300 dark:text-neutral-600">•</span>
                              <span className="flex items-center gap-1">
                                <span className="text-neutral-400 dark:text-neutral-500">☎</span>
                                <span>{clientPhone}</span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
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
                          placeholder={isFil ? "Ilagay ang inyong uri ng proyekto (hal. Kapilya, Gusali ng Paaralan, Gym)" : "Enter your project type (ex. Chapel, School Building, Gym)"}
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
                              ? "Ilagay ang inyong architectural peg (hal. Modern Farmhouse, Brutalist, Japandi)"
                              : "Enter your architectural concept (ex. Modern Farmhouse, Brutalist, Japandi)"
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
                          placeholder={isFil ? "Ilagay ang bilang ng palapag (hal. 4 Storeys, Penthouse)" : "Enter your number of storeys (ex. 4 Storeys, Penthouse)"}
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
                          <input type="text" value={targetTimelineOther} onChange={(e) => { setTargetTimelineOther(e.target.value); if (errors.targetTimelineOther) setErrors((p) => ({ ...p, targetTimelineOther: undefined })); }} placeholder={isFil ? "Ilagay ang target timeline (hal. Sa loob ng 2 taon, Pagkatapos ng kontrata)" : "Enter your target timeline (ex. Within 2 years, After OFW contract ends)"} className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.targetTimelineOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
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
                          <input type="text" value={lotStatusOther} onChange={(e) => { setLotStatusOther(e.target.value); if (errors.lotStatusOther) setErrors((p) => ({ ...p, lotStatusOther: undefined })); }} placeholder={isFil ? "Ilagay ang kalagayan ng lote (hal. Pamanang lupa, Nabili sa subasta)" : "Enter your lot status (ex. Inherited land, Foreclosed property)"} className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.lotStatusOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
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
                        placeholder={isFil ? "Ilagay ang sukat ng lote (hal. 240)" : "Enter your lot area in sqm (ex. 240)"}
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
                            <input type="text" value={bedroomsOther} onChange={(e) => { setBedroomsOther(e.target.value); if (errors.bedroomsOther) setErrors((p) => ({ ...p, bedroomsOther: undefined })); }} placeholder={isFil ? "Ilagay ang bilang ng kwarto (hal. 6 Bedrooms, Studio)" : "Enter your bedrooms (ex. 6 Bedrooms, Studio)"} className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.bedroomsOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
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
                            <input type="text" value={bathroomsOther} onChange={(e) => { setBathroomsOther(e.target.value); if (errors.bathroomsOther) setErrors((p) => ({ ...p, bathroomsOther: undefined })); }} placeholder={isFil ? "Ilagay ang bilang ng banyo (hal. 5 Bathrooms, 1 Powder Room)" : "Enter your bathrooms (ex. 5 Bathrooms, 1 Powder Room)"} className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.bathroomsOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
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
                            <input type="text" value={carGarageOther} onChange={(e) => { setCarGarageOther(e.target.value); if (errors.carGarageOther) setErrors((p) => ({ ...p, carGarageOther: undefined })); }} placeholder={isFil ? "Ilagay ang kapasidad ng garahe (hal. Basement parking, Tandem garage)" : "Enter your garage capacity (ex. Basement parking, Tandem garage)"} className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.carGarageOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
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
                    {selectedFeatures.has("other") && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={featuresOther}
                          onChange={(e) => {
                            setFeaturesOther(e.target.value);
                            if (errors.featuresOther) setErrors((p) => ({ ...p, featuresOther: undefined }));
                          }}
                          placeholder={
                            isFil
                              ? "Ilagay ang iba pang katangian (hal. Solar panels, Roof deck bar, Home elevator)"
                              : "Enter your other features (ex. Solar panels, Roof deck bar, Home elevator)"
                          }
                          className={`w-full h-9 px-3 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${
                            errors.featuresOther ? "border-red-500" : "border-amber-400"
                          }`}
                          autoFocus
                        />
                        {errors.featuresOther && (
                          <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.featuresOther}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Budget & Financing Program */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        3. {isFil ? "Target na Budget Scope *" : "Target Budget Scope *"}
                      </label>
                      <div className="relative">
                        {/* Peso sign */}
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-mono text-sm pointer-events-none select-none">₱</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={budgetRange}
                          onChange={(e) => {
                            // Strip everything except digits
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            // Format with commas
                            const formatted = raw ? Number(raw).toLocaleString("en-PH") : "";
                            setBudgetRange(formatted);
                            if (errors.budgetRange) setErrors((p) => ({ ...p, budgetRange: undefined }));
                          }}
                          placeholder={isFil ? "Ilagay ang inyong budget (hal. 4,000,000)" : "Enter your target budget (ex. 4,000,000)"}
                          className={`w-full h-12 pl-8 pr-28 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.budgetRange ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"}`}
                        />
                        {/* Smart label badge — K / M / B */}
                        {budgetRange && (() => {
                          const raw = Number(budgetRange.replace(/,/g, ""));
                          let label = "";
                          if (raw >= 1_000_000_000) label = `${(raw / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
                          else if (raw >= 1_000_000) label = `${(raw / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
                          else if (raw >= 1_000) label = `${(raw / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
                          if (!label) return null;
                          return (
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold tracking-wide select-none">
                              ₱{label}
                            </span>
                          );
                        })()}
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
                          <input type="text" value={financingOptionOther} onChange={(e) => { setFinancingOptionOther(e.target.value); if (errors.financingOptionOther) setErrors((p) => ({ ...p, financingOptionOther: undefined })); }} placeholder={isFil ? "Ilagay ang paraan ng pagbabayad (hal. Cash payment, Personal loan, OFW remittance)" : "Enter your financing option (ex. Cash payment, Personal loan, OFW remittance)"} className={`w-full h-10 px-3.5 rounded-xl border bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.financingOptionOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                          {errors.financingOptionOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.financingOptionOther}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Setup (Google Meet vs In-Person with 3 Venue Sub-Options) */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-4">
                    <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200">
                      5. {isFil ? "Unang Konsultasyon (Initial Consultation Meeting) *" : "Initial Consultation Meeting Preference *"}
                    </label>

                    {/* Top Choice: Online vs In-Person */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl transition-all ${errors.meetingMode ? "ring-2 ring-red-500/50 p-2 bg-red-500/5" : ""}`}>
                      {[
                        {
                          val: "Online Meeting",
                          labelEn: "Online Meeting",
                          labelFil: "Online Call",
                          desc: isFil ? "Perpekto para sa OFW o may trabaho" : "Priority for OFWs & busy homeowners",
                          icon: VideoIcon,
                        },
                        {
                          val: "In-Person",
                          labelEn: "In-Person Consultation",
                          labelFil: "Face-to-Face sa Personal",
                          desc: isFil ? "Tanggapan ng MCPA, Site, o Cafe" : "Office HQ, Project Site, or Cafe",
                          icon: BuildingIcon,
                        },
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = meetingMode === mode.val || (mode.val === "Online Meeting" && meetingMode === "Online Meeting (Google Meet)");
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

                    {/* SUB-OPTIONS FOR IN-PERSON: 1) MCPA Office, 2) On-Site, 3) Coffee Shop / Restaurant */}
                    {meetingMode === "In-Person" && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-neutral-950/70 border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>{isFil ? "Pumili ng Lokasyon ng Pagpupulong *" : "Select In-Person Meeting Venue *"}</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                            {inPersonVenue === "office" ? "Office HQ" : inPersonVenue === "site" ? "On-Site" : "Cafe / Public"}
                          </span>
                        </div>

                        {/* 3 Selectable Venue Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* 1. Visit MCPA Office */}
                          <button
                            type="button"
                            onClick={() => setInPersonVenue("office")}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              inPersonVenue === "office"
                                ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white"
                                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenue === "office" ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10 text-neutral-500"}`}>
                                <Building2 className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold">
                                {isFil ? "Tanggapan ng MCPA" : "Visit MCPA Office"}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              {isFil ? "Plaridel, Bulacan HQ" : "Plaridel, Bulacan Head Office"}
                            </span>
                          </button>

                          {/* 2. On-Site Consultation */}
                          <button
                            type="button"
                            onClick={() => setInPersonVenue("site")}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              inPersonVenue === "site"
                                ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white"
                                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenue === "site" ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10 text-neutral-500"}`}>
                                <MapPin className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold">
                                {isFil ? "Mismong Project Site" : "Proposed Project Site"}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              {isFil ? "Ocular sa lote mula sa Step 2" : "On-site ocular at lot in Step 2"}
                            </span>
                          </button>

                          {/* 3. Coffee Shop / Restaurant */}
                          <button
                            type="button"
                            onClick={() => {
                              setInPersonVenue("cafe");
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              inPersonVenue === "cafe"
                                ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-neutral-900 dark:text-white"
                                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg shrink-0 ${inPersonVenue === "cafe" ? "bg-amber-500 text-neutral-950" : "bg-neutral-200 dark:bg-white/10 text-neutral-500"}`}>
                                <Coffee className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold">
                                {isFil ? "Coffee Shop / Cafe" : "Coffee Shop / Venue"}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              {isFil ? "Starbucks, fast food, mall sa PH" : "Starbucks, fast food, mall in PH"}
                            </span>
                          </button>
                        </div>

                        {/* Card 1 Details: Office Address + Google Maps Link */}
                        {inPersonVenue === "office" && (
                          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                                  {isFil ? "Opisyal na Address ng Tanggapan:" : "Official Headquarters Address:"}
                                </span>
                                <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5">
                                  MCPA Construction &amp; Supply Head Office
                                </p>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono mt-0.5">
                                  2826 Le Cagayan Valley Rd, Tabang, Plaridel, Bulacan, Philippines
                                </p>
                                <span className="text-[10px] text-neutral-500 block mt-0.5">
                                  (Near Tabang Tollway Exit &amp; WalterMart Plaridel • Private Client Parking Available)
                                </span>
                              </div>
                              <a
                                href="https://www.google.com/maps/search/?api=1&query=MCPA+Construction+and+Supply+Tabang+Plaridel+Bulacan"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                              >
                                <span>Open in Google Maps</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Card 2 Details: Project Lot from Step 2 */}
                        {inPersonVenue === "site" && (
                          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                                  {isFil ? "Lokasyon ng Lote ng Proyekto (Galing sa Step 2):" : "Proposed Construction Lot Address (From Step 2):"}
                                </span>
                                <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>
                                    {formattedBuildAddress
                                      ? formattedBuildAddress.replace(/Ã±/g, "ñ").replace(/Ã‘/g, "Ñ")
                                      : (isFil ? "Nailagay na lote sa Step 2" : "Location specified in Step 2")}
                                  </span>
                                </p>
                                {mapCoordinates && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                    GPS Pin: {mapCoordinates}
                                  </p>
                                )}
                                <p className="text-[10px] text-neutral-500 mt-1 italic">
                                  * {isFil
                                    ? "Ang aming lead architect at civil engineer ang pupunta sa mismong lote ninyo para sa ocular at terrain assessment."
                                    : "Our architectural and engineering team will meet you directly at your property for preliminary ocular and terrain inspection."}
                                </p>
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapCoordinates || formattedBuildAddress || "Bulacan")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                              >
                                <span>Open in Google Maps</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Card 3 Details: Coffee Shop / Fast Food / Public Venue Combobox */}
                        {inPersonVenue === "cafe" && (
                          <div className="pt-2">
                            <VenueCombobox
                              value={venueCafeDetails}
                              onChange={(venue) => {
                                setVenueCafeDetails(venue);
                                if (errors.venueCafeDetails) setErrors((p) => ({ ...p, venueCafeDetails: undefined }));
                              }}
                              onClear={() => setVenueCafeDetails("")}
                              isFil={isFil}
                              hasError={Boolean(errors.venueCafeDetails)}
                              errorMessage={errors.venueCafeDetails}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono text-neutral-500 block">
                            {isFil ? "Napiling Araw" : "Target Consultation Date"}
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            {isFil ? "Ngayon o Pa-usog Lamang" : "Today onwards only"}
                          </span>
                        </div>
                        <input
                          type="date"
                          min={todayDateString}
                          value={meetingDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && val < todayDateString) {
                              setErrors((p) => ({
                                ...p,
                                meetingDate: isFil
                                  ? "Hindi maaaring pumili ng nakaraang petsa. Piliin ang kasalukuyan o darating na araw."
                                  : "Past dates are not allowed. Please choose today or a future date.",
                              }));
                              setMeetingDate(val);
                              return;
                            }
                            setMeetingDate(val);
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
                            <input type="text" value={meetingTimeOther} onChange={(e) => { setMeetingTimeOther(e.target.value); if (errors.meetingTimeOther) setErrors((p) => ({ ...p, meetingTimeOther: undefined })); }} placeholder={isFil ? "Ilagay ang inyong gustong oras (hal. 7:00 AM, Sabado ng umaga)" : "Enter your preferred time (ex. 7:00 AM, Weekend morning)"} className={`w-full h-9 px-3 rounded-xl border bg-white dark:bg-neutral-900 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-neutral-400 ${errors.meetingTimeOther ? "border-red-500" : "border-amber-400"}`} autoFocus />
                            {errors.meetingTimeOther && <p className="mt-1 text-[11px] text-red-500 font-mono">{errors.meetingTimeOther}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Special Design Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-800 dark:text-neutral-200">
                        6. {isFil ? "Espesyal na Kahilingan / Peg Link (Opsyonal)" : "Special Architectural Notes / Peg Links (Optional)"}
                      </label>
                      <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                        {isFil ? "Kusang lumalaki • May link preview" : "Auto-expanding • Link preview"}
                      </span>
                    </div>
                    <textarea
                      ref={notesTextareaRef}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder={isFil ? "Ilagay ang inyong espesyal na kahilingan (hal. May modern dirty kitchen, 2-car garage, Pinterest peg: https://pin.it/...)" : "Enter your special architectural notes or peg links (ex. Master balcony, open concept kitchen, Pinterest peg: https://...)"}
                      className="w-full p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:border-amber-500 focus:outline-none min-h-[92px] resize-none overflow-hidden transition-[height] duration-150 leading-relaxed"
                    />

                    {/* Detected Peg Links List */}
                    {detectedLinks.length > 0 && (
                      <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {isFil
                                ? `Nadetect na Peg Link (${detectedLinks.length}):`
                                : `Detected Peg Links (${detectedLinks.length}):`}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 italic">
                            {isFil ? "Awtomatikong babasahin ng arkitekto" : "Ready for architect review"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {detectedLinks.map((link, idx) => (
                            <div
                              key={`peg-link-${idx}`}
                              className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2.5 shadow-2xs hover:border-amber-500/50 transition-all group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/10 p-1 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-white/10 overflow-hidden">
                                  <img
                                    src={link.favicon}
                                    alt={link.brandName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                      {link.brandName}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${link.categoryColor}`}
                                    >
                                      {link.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                    {link.hostname}{link.pathname || "/"}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] font-bold tracking-wider inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                title="Open link in new tab"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
              {/* Lottie Animated Success Badge */}
              <div className="mb-2 flex items-center justify-center">
                <LottieSuccessCheck className="w-24 h-24 sm:w-28 sm:h-28" />
              </div>

              <p className="text-amber-600 dark:text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-2">
                INQUIRY &amp; APPOINTMENT CONFIRMED
              </p>

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

              {/* Summary Table with icons and wrapping without truncation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto my-6 text-left font-mono text-[11px]">
                <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex flex-col justify-start">
                  <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">CATEGORY</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs break-words whitespace-normal leading-snug">
                    {projectType === "Other" ? (projectTypeOther || "Other") : projectType}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex flex-col justify-start">
                  <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">STYLE PEG</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs break-words whitespace-normal leading-snug">
                    {preferredStyle === "Custom Architectural Concept" ? (preferredStyleCustom || "Custom Architectural Concept") : preferredStyle}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex flex-col justify-start">
                  <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">LOT LOCATION</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs break-words whitespace-normal leading-snug">
                    {buildCity}{buildProvince ? `, ${buildProvince}` : ""}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex flex-col justify-start">
                  <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                    {meetingMode?.toLowerCase().includes("video") || meetingMode?.toLowerCase().includes("online") ? (
                      <Video className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : meetingMode?.toLowerCase().includes("cafe") ? (
                      <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider">MEETING MODE</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs break-words whitespace-normal leading-snug">
                    {meetingMode || "Online"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center pt-4">
                <Link
                  href="/portal?tab=inquiries"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>{isFil ? "Tingnan ang Inquiry sa Client Portal →" : "View Inquiries in Client Portal →"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Maps Style Philippines Venue Search Modal */}
      <VenueSearchModal
        isOpen={isVenueModalOpen}
        onClose={() => setIsVenueModalOpen(false)}
        onSelectVenue={(v) => {
          setVenueCafeDetails(v);
          setInPersonVenue("cafe");
          if (errors.venueCafeDetails) setErrors((p) => ({ ...p, venueCafeDetails: undefined }));
        }}
        currentVenue={venueCafeDetails}
        isFil={isFil}
      />
    </section>
  );
}
