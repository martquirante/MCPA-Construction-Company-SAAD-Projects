"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  CheckIcon,
  CameraIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  GlobeIcon,
  PlaneIcon,
  UserCheckIcon,
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
  FileTextIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
} from "@/modules/shared/Icons";
import CountryPicker from "./CountryPicker";
import PuzzleCaptchaModal from "./PuzzleCaptchaModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import MediaPipeLivenessModal, { getHumanFriendlyCameraMessage } from "./MediaPipeLivenessModal";
import PhAddressCascadeSection from "./PhAddressCascadeSection";
import ArchitecturalEntranceAnimation from "./ArchitecturalEntranceAnimation";
import { COUNTRIES, getFlagUrl, PHILIPPINES } from "../data/countries";
import { PORTAL_TRANSLATIONS } from "../data/portalTranslations";
import { useLanguage } from "@/modules/shared/LanguageContext";
import {
  formatPhPhone,
  formatIntlPhone,
  isValidPhPhone,
  isValidName,
  isValidEmail,
  evaluatePassword,
  calculateAge,
  isValidAge,
  isValidOccupation,
} from "../utils/validation";

/**
 * Admin-Grade Philippine Location Autocomplete Input
 * Features: live /api/locations/ph autocomplete, client caching, debounced search, keyboard navigation & outside-click dismiss.
 */
function PhLocationAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  required = false,
  activeLang = "en",
  t = {},
  hasError = false,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = (query) => {
    const trimmed = (query || "").trim();
    const cacheKey = (trimmed || "__popular__").toLowerCase();

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      if (Array.isArray(cached) && cached.length > 0) {
        setSuggestions(cached);
        setShowDropdown(true);
        setIsSearching(false);
        setActiveIndex(-1);
        return;
      }
    }

    setIsSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/locations/ph?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.locations)) {
            if (data.locations.length > 0) {
              cacheRef.current.set(cacheKey, data.locations);
            }
            setSuggestions(data.locations);
            setShowDropdown(true);
            setActiveIndex(-1);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Location search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, trimmed.length <= 1 ? 50 : 120);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    searchLocations(val);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      const chosen = suggestions[activeIndex];
      onSelect(chosen);
      setShowDropdown(false);
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelect = (loc) => {
    onSelect(loc);
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500 font-bold">*</span>}
          </span>
          {isSearching && (
            <span className="text-[10px] text-amber-500 font-normal lowercase animate-pulse">
              {activeLang === "fil" ? "naghahanap..." : "searching..."}
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowDropdown(true);
            if (suggestions.length === 0) {
              searchLocations(value);
            }
          }}
          className={`w-full h-10 pl-10 pr-3.5 rounded-xl border ${
            hasError
              ? "bg-red-500/10 dark:bg-red-950/35 border-red-500 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          } text-sm focus:outline-none transition-all`}
        />
        <MapPinIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto scrollbar-thin">
          {isSearching && suggestions.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>{activeLang === "fil" ? "Naghahanap ng lokasyon sa Pilipinas..." : "Searching Philippine locations..."}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span>
                  {value?.trim()
                    ? activeLang === "fil"
                      ? "Mga Mungkahing Lokasyon"
                      : "Suggested Locations"
                    : activeLang === "fil"
                    ? "Mga Pangunahing Lokasyon sa Pilipinas"
                    : "Popular Philippine Locations"}
                </span>
                {isSearching && (
                  <span className="text-[9px] text-amber-500 font-normal lowercase animate-pulse">
                    {activeLang === "fil" ? "ina-update..." : "updating..."}
                  </span>
                )}
              </div>
              {suggestions.map((loc, idx) => {
                const isHighlighted = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 transition-colors border-b border-neutral-100 dark:border-neutral-800/40 last:border-0 cursor-pointer ${
                      isHighlighted
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium"
                        : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <MapPinIcon className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? "text-amber-500" : "text-neutral-400"}`} />
                    <span className="truncate">{loc}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="px-3.5 py-3 text-xs text-neutral-400 dark:text-neutral-500 italic text-center">
              {activeLang === "fil" ? "Walang nahanap na lokasyon sa Pilipinas" : "No matching Philippine locations found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalAuthCard({ onLoginSuccess }) {
  const { language } = useLanguage();
  const activeLang = language === "fil" ? "fil" : "en";
  const t = PORTAL_TRANSLATIONS[activeLang];

  // Mode: "login" | "signup"
  const [authMode, setAuthMode] = useState("login");

  // Signup Multi-Step Wizard: 1 | 2 | 3 | 4
  const [signupStep, setSignupStep] = useState(1);

  // Common status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgressText, setSubmissionProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPuzzleModalOpen, setIsPuzzleModalOpen] = useState(false);
  const [isSuccessAnimation, setIsSuccessAnimation] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState(null);
  const [registeredUserToken, setRegisteredUserToken] = useState(null);

  // --- VALIDATION ATTEMPT TRACKING (FOR RED FIELD HIGHLIGHTING) ---
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  const [attemptedStep1, setAttemptedStep1] = useState(false);
  const [attemptedStep2, setAttemptedStep2] = useState(false);
  const [attemptedStep4, setAttemptedStep4] = useState(false);

  // --- LOGIN & SECURITY LOCKOUT FIELDS ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // --- GOOGLE MEDIAPIPE LIVENESS VERIFICATION ---
  const [isLivenessModalOpen, setIsLivenessModalOpen] = useState(false);
  const [livenessPurpose, setLivenessPurpose] = useState("kyc"); // "kyc" | "login"
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);

  // --- SOCIAL AUTHENTICATION (GOOGLE & FACEBOOK) ---
  const [socialConnected, setSocialConnected] = useState(null); // { provider, providerId, avatarUrl, email }
  const [socialSuccessBanner, setSocialSuccessBanner] = useState("");

  // --- SIGNUP FIELDS ---
  // Step 1: Account Credentials & Identity
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Computed live validations
  const passwordEval = useMemo(() => evaluatePassword(registerPassword, activeLang), [registerPassword, activeLang]);
  const isEmailValid = useMemo(() => isValidEmail(registerEmail), [registerEmail]);

  const fullName = [firstName.trim(), middleName.trim(), lastName.trim(), suffix.trim()]
    .filter(Boolean)
    .join(" ");

  // Step 2: Personal, Employment & Contact Demographics
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [civilStatus, setCivilStatus] = useState("Single");
  const [spouseName, setSpouseName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("₱75,000 – ₱150,000 / month");
  const [preferredContactTime, setPreferredContactTime] = useState("Anytime (PH Daytime)");
  const [countryCode, setCountryCode] = useState("+63");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientType, setClientType] = useState("Local"); // "Local" | "OFW"
  const [ofwCountry, setOfwCountry] = useState("United Arab Emirates (UAE / Dubai)");
  const [selectedCountryCode, setSelectedCountryCode] = useState("ae");
  const [locationAddress, setLocationAddress] = useState("");

  // Step 2 Structured Residential Address (Philippines) - Hierarchical (Province -> City -> Barangay)
  const [resProvince, setResProvince] = useState("Bulacan");
  const [resProvinceCode, setResProvinceCode] = useState("0301400000");
  const [resCity, setResCity] = useState("");
  const [resCityCode, setResCityCode] = useState("");
  const [resBarangay, setResBarangay] = useState("");
  const [resBarangayCode, setResBarangayCode] = useState("");
  const [resSubdivision, setResSubdivision] = useState("");
  const [resStreet, setResStreet] = useState("");
  const [resHouseNo, setResHouseNo] = useState("");
  const [resBlkLot, setResBlkLot] = useState("");

  // Sync structured address into full locationAddress
  useEffect(() => {
    const parts = [
      resHouseNo ? `Unit/House ${resHouseNo.trim()}` : "",
      resBlkLot ? `Blk ${resBlkLot.trim()}` : "",
      resStreet.trim(),
      resSubdivision.trim(),
      resBarangay ? `Brgy. ${resBarangay.trim()}` : "",
      resCity.trim(),
      resProvince.trim(),
    ].filter(Boolean);

    setLocationAddress(parts.join(", "));
  }, [resHouseNo, resBlkLot, resStreet, resSubdivision, resBarangay, resCity, resProvince]);

  const [phRepName, setPhRepName] = useState("");
  const [phRepRelationship, setPhRepRelationship] = useState("Spouse");
  const [phRepPhone, setPhRepPhone] = useState("");

  // Computed client age
  const clientAge = useMemo(() => calculateAge(birthDate), [birthDate]);

  // OFW Contact Number Selection (PH Roaming vs Overseas SIM)
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");
  const phoneDropdownRef = useRef(null);

  // Determine host country object from ofwCountry
  const hostCountryObj = useMemo(() => {
    return (
      COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === (ofwCountry || "").toLowerCase() ||
          c.name.toLowerCase().includes((ofwCountry || "").toLowerCase())
      ) || COUNTRIES[2]
    );
  }, [ofwCountry]);

  // Filtered countries for the dial code search
  const filteredPhoneCountries = useMemo(() => {
    const q = phoneSearchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [phoneSearchQuery]);

  // Click outside handler for phone dial dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target)) {
        setIsPhoneDropdownOpen(false);
      }
    }
    if (isPhoneDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPhoneDropdownOpen]);

  // Step 3: Biometric KYC & Face Recognition
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isFaceChecking, setIsFaceChecking] = useState(false);
  const [faceCheckFeedback, setFaceCheckFeedback] = useState("");
  const [faceObstructionError, setFaceObstructionError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Step 4: Lot & Project Profile & Privacy - Hierarchical (Province -> City -> Barangay)
  const [projectType, setProjectType] = useState("2-Storey Modern Villa");
  const [lotOwnershipStatus, setLotOwnershipStatus] = useState("Titled under my name");
  const [buildProvince, setBuildProvince] = useState("Bulacan");
  const [buildProvinceCode, setBuildProvinceCode] = useState("0301400000");
  const [buildCity, setBuildCity] = useState("");
  const [buildCityCode, setBuildCityCode] = useState("");
  const [buildBarangay, setBuildBarangay] = useState("");
  const [buildBarangayCode, setBuildBarangayCode] = useState("");
  const [subdivisionLotDetails, setSubdivisionLotDetails] = useState("");
  const [lotBlkLot, setLotBlkLot] = useState("");
  const [lotPhaseStreet, setLotPhaseStreet] = useState("");
  const [lotSubdivision, setLotSubdivision] = useState("");
  const [targetLocation, setTargetLocation] = useState("");

  // Sync structured build location into targetLocation
  useEffect(() => {
    const parts = [
      buildBarangay ? `Brgy. ${buildBarangay.trim()}` : "",
      buildCity.trim(),
      buildProvince.trim(),
    ].filter(Boolean);
    if (parts.length > 0) {
      setTargetLocation(parts.join(", "));
    }
  }, [buildBarangay, buildCity, buildProvince]);

  // Sync structured lot details into subdivisionLotDetails
  useEffect(() => {
    const parts = [
      lotBlkLot ? `Blk/Lot: ${lotBlkLot.trim()}` : "",
      lotPhaseStreet ? `Phase/St: ${lotPhaseStreet.trim()}` : "",
      lotSubdivision.trim(),
    ].filter(Boolean);
    if (parts.length > 0) {
      setSubdivisionLotDetails(parts.join(", "));
    }
  }, [lotBlkLot, lotPhaseStreet, lotSubdivision]);

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const legalScrollRef = useRef(null);

  const handleLegalScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const pct = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
      setScrollProgress(pct);
      if (maxScroll - scrollTop <= 20) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const scrollToBottom = () => {
    if (legalScrollRef.current) {
      legalScrollRef.current.scrollTo({
        top: legalScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setHasScrolledToBottom(true);
      setScrollProgress(100);
    }
  };

  // Clean up camera stream on unmount or step change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Pre-load Google Identity Services and Facebook SDK for instant popup interaction
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Google Identity Services (GIS)
    if (!window.google?.accounts && !document.getElementById("google-gis-script")) {
      const gScript = document.createElement("script");
      gScript.id = "google-gis-script";
      gScript.src = "https://accounts.google.com/gsi/client";
      gScript.async = true;
      gScript.defer = true;
      document.body.appendChild(gScript);
    }

    // 2. Facebook JavaScript SDK
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1398929332394441",
          cookie: true,
          xfbml: true,
          version: "v20.0",
        });
      };
      if (!document.getElementById("facebook-jssdk")) {
        const fbScript = document.createElement("script");
        fbScript.id = "facebook-jssdk";
        fbScript.src = "https://connect.facebook.net/en_US/sdk.js";
        fbScript.async = true;
        fbScript.defer = true;
        document.body.appendChild(fbScript);
      }
    }
  }, []);

  // Live countdown timer for 15-minute brute-force lockout
  useEffect(() => {
    if (!lockoutEndTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = lockoutEndTime - now;
      if (diffMs <= 0) {
        setLockoutMinutes(0);
        setLockoutEndTime(null);
        setAttemptsRemaining(null);
        setErrorMessage("");
        clearInterval(interval);
      } else {
        setLockoutMinutes(Math.ceil(diffMs / 60000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  // --- CAMERA HELPERS ---
  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("HTTP_INSECURE_OR_UNSUPPORTED");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access notice:", err);
      setCameraError(getHumanFriendlyCameraMessage(err, activeLang));
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
    setCapturedSelfie(dataUrl);
    stopCamera();

    // Call Python face recognition verification
    try {
      setIsFaceChecking(true);
      setFaceCheckFeedback("");
      setFaceObstructionError("");
      const res = await fetch("/api/auth/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (data && data.passed && !data.obstructions?.has_obstruction) {
        setIsLivenessVerified(true);
        setFaceObstructionError("");
        setFaceCheckFeedback(
          activeLang === "fil"
            ? "Na-verify ng Neural Vision: Maayos ang talas, liwanag, at walang sagabal sa mukha."
            : "Neural Vision: Clear face focus, optimal lighting, and zero obstructions verified."
        );
      } else {
        setIsLivenessVerified(false);
        const obsMsg = data?.obstructions?.issues?.[0] || data?.issues?.[0];
        const errorText = obsMsg
          ? (activeLang === "fil" ? obsMsg.fil : obsMsg.en)
          : (activeLang === "fil"
              ? "May sagabal sa mukha. Pakitanggal ang sumbrero, salamin sa mata, o mask bago magpatuloy."
              : "Face is obstructed. Please remove hat, glasses, or mask before continuing.");
        setFaceObstructionError(errorText);
        setFaceCheckFeedback(errorText);
      }
    } catch (e) {
      console.warn("Python face check fallback:", e);
    } finally {
      setIsFaceChecking(false);
    }
  };

  const handleFileUploadSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        setCapturedSelfie(dataUrl);

        try {
          setIsFaceChecking(true);
          setFaceCheckFeedback("");
          setFaceObstructionError("");
          const res = await fetch("/api/auth/verify-face", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });
          const data = await res.json();
          if (data && data.passed && !data.obstructions?.has_obstruction) {
            setIsLivenessVerified(true);
            setFaceObstructionError("");
            setFaceCheckFeedback(
              activeLang === "fil"
                ? "Na-verify ng Neural Vision: Maayos ang talas, liwanag, at walang sagabal sa mukha."
                : "Neural Vision: Clear face focus, optimal lighting, and zero obstructions verified."
            );
          } else {
            setIsLivenessVerified(false);
            const obsMsg = data?.obstructions?.issues?.[0] || data?.issues?.[0];
            const errorText = obsMsg
              ? (activeLang === "fil" ? obsMsg.fil : obsMsg.en)
              : (activeLang === "fil"
                  ? "May sagabal sa mukha. Pakitanggal ang sumbrero, salamin sa mata, o mask bago magpatuloy."
                  : "Face is obstructed. Please remove hat, glasses, or mask before continuing.");
            setFaceObstructionError(errorText);
            setFaceCheckFeedback(errorText);
          }
        } catch (err) {
          console.warn("Python face check fallback:", err);
        } finally {
          setIsFaceChecking(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SOCIAL AUTHENTICATION HELPERS ---
  const ensureGoogleLoaded = () => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) return resolve(window.google);
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(window.google);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(
            new Error(
              activeLang === "fil"
                ? "Hindi maikonekta ang Google Sign-In. Pakisuri ang network connection."
                : "Google Sign-In initialization timed out. Please check your connection."
            )
          );
        }
      }, 100);
    });
  };

  const ensureFacebookLoaded = () => {
    return new Promise((resolve, reject) => {
      if (window.FB) return resolve(window.FB);
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.FB) {
          clearInterval(interval);
          resolve(window.FB);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(
            new Error(
              activeLang === "fil"
                ? "Hindi maikonekta ang Facebook SDK. Pakisuri ang network connection."
                : "Facebook SDK initialization timed out. Please check your connection."
            )
          );
        }
      }, 100);
    });
  };

  const sendSocialAuthToServer = async (provider, token) => {
    setIsSubmitting(true);
    setSubmissionProgressText(
      provider === "google" ? t.socialConnectingGoogle : t.socialConnectingFacebook
    );

    try {
      const res = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423 || data.locked) {
          const rem = data.remainingMinutes || 15;
          setLockoutMinutes(rem);
          setLockoutEndTime(Date.now() + rem * 60 * 1000);
          setAttemptsRemaining(0);
        }
        setErrorMessage(data.message || (activeLang === "fil" ? "Nabigo ang social authentication." : "Social authentication failed."));
        return;
      }

      if (data.success) {
        // CASE 1: EXISTING USER -> Instant 1-Click Login
        if (!data.isNewUser) {
          if (data.user && ((data.user.role || "").toLowerCase() === "admin" || (data.user.role || "").toLowerCase() === "super_admin")) {
            setErrorMessage(
              activeLang === "fil"
                ? "Pansin: Ang account na ito ay may Administrator privileges. Mangyaring gamitin ang Admin Portal sa /admin."
                : "Notice: This account has Administrator privileges. Please access the Admin Portal at /admin."
            );
            return;
          }
          setLockoutMinutes(0);
          setLockoutEndTime(null);
          setAttemptsRemaining(null);
          if (onLoginSuccess) {
            onLoginSuccess(data.user, data.token);
          }
          return;
        }

        // CASE 2: NEW USER -> Prefill Wizard
        const profile = data.profile || {};
        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        if (profile.email) setRegisterEmail(profile.email);
        if (profile.avatarUrl) setCapturedSelfie(profile.avatarUrl);

        setSocialConnected({
          provider: profile.provider || provider,
          providerId: profile.providerId || "",
          avatarUrl: profile.avatarUrl || "",
          email: profile.email || "",
        });

        const wasInLoginMode = authMode === "login";
        setAuthMode("signup");
        setSignupStep(1);
        setSocialSuccessBanner(
          activeLang === "fil"
            ? (wasInLoginMode
                ? `Wala pang rehistradong account para sa iyong ${provider === "google" ? "Google" : "Facebook"}. Pakikumpleto ang iyong impormasyon upang malikha ang iyong account.`
                : `Beripikado na ang ${provider === "google" ? "Google" : "Facebook"} identity! Pakisuri ang impormasyon at magpatuloy sa registration.`)
            : (wasInLoginMode
                ? `No existing account found for this ${provider === "google" ? "Google" : "Facebook"} account. Please complete your registration details to create your account.`
                : `Verified via ${provider === "google" ? "Google" : "Facebook"}! Please review your details and proceed with registration.`)
        );
        setErrorMessage("");
      }
    } catch (err) {
      console.error("[sendSocialAuthToServer] Error:", err);
      setErrorMessage(t.errNetwork);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgressText("");
    }
  };

  // --- SOCIAL LOGIN TRIGGER (GOOGLE & FACEBOOK POPUP) ---
  const handleSocialClick = async (provider) => {
    setErrorMessage("");
    setSocialSuccessBanner("");

    if (lockoutMinutes > 0) {
      setErrorMessage(
        activeLang === "fil"
          ? `Naka-lock ang account dahil sa sunod-sunod na maling pagsubok. Pakihintay ang natitirang ${lockoutMinutes} minuto.`
          : `Account locked due to consecutive failed attempts. Please try again in ${lockoutMinutes} minute(s).`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgressText(
      provider === "google" ? t.socialConnectingGoogle : t.socialConnectingFacebook
    );

    try {
      if (provider === "google") {
        const google = await ensureGoogleLoaded();
        let timeoutId;
        const client = google.accounts.oauth2.initTokenClient({
          client_id:
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "1093667864037-45r4ollo6jaqaso55547ckmhma6bgt2v.apps.googleusercontent.com",
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (timeoutId) clearTimeout(timeoutId);
            if (tokenResponse.error) {
              setIsSubmitting(false);
              setSubmissionProgressText("");
              if (tokenResponse.error !== "popup_closed_by_user") {
                setErrorMessage(tokenResponse.error_description || "Google sign-in was cancelled or encountered an error.");
              }
              return;
            }
            if (tokenResponse.access_token) {
              await sendSocialAuthToServer("google", tokenResponse.access_token);
            }
          },
          error_callback: (err) => {
            if (timeoutId) clearTimeout(timeoutId);
            setIsSubmitting(false);
            setSubmissionProgressText("");
            setErrorMessage(err.message || (activeLang === "fil" ? "Nabigo ang koneksyon sa Google." : "Google authentication encountered an error."));
          },
        });

        // 45-second fallback timeout in case popup was blocked or closed without callback
        timeoutId = setTimeout(() => {
          setIsSubmitting((prev) => {
            if (prev) {
              setSubmissionProgressText("");
              setErrorMessage(
                activeLang === "fil"
                  ? "Nag-timeout ang Google Sign-In. Pakisubukang muli."
                  : "Google Sign-In timed out. Please try again."
              );
              return false;
            }
            return prev;
          });
        }, 45000);

        client.requestAccessToken();
      } else if (provider === "facebook") {
        // Meta blocks FB.login on plain-http pages (even localhost). Fail gracefully.
        if (typeof window !== "undefined" && window.location.protocol !== "https:") {
          setErrorMessage(
            activeLang === "fil"
              ? "Kailangan ng HTTPS para sa Facebook login. Buksan ang site gamit ang https:// (hal. https://localhost:3000/portal) o gamitin ang Google / email."
              : "Facebook login requires HTTPS. Open the site via https:// (e.g. https://localhost:3000/portal), or use Google / email instead."
          );
          setIsSubmitting(false);
          setSubmissionProgressText("");
          return;
        }
        const fb = await ensureFacebookLoaded();
        fb.login(
          (response) => {
            if (response.authResponse?.accessToken) {
              sendSocialAuthToServer("facebook", response.authResponse.accessToken);
            } else {
              setIsSubmitting(false);
              setSubmissionProgressText("");
            }
          },
          { scope: "email,public_profile" }
        );
      }
    } catch (err) {
      console.error("[handleSocialClick] Error:", err);
      setErrorMessage(err.message || t.errNetwork);
      setIsSubmitting(false);
      setSubmissionProgressText("");
    }
  };

  // --- SUBMIT LOGIN (WITH 5-ATTEMPT 15-MINUTE LOCKOUT) ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAttemptedLogin(true);
    setErrorMessage("");
    setSocialSuccessBanner("");

    if (lockoutMinutes > 0) {
      setErrorMessage(
        `${t.accountLockedTitle}. ${t.tryAgainIn} ${lockoutMinutes} ${t.minutesRemainingSuffix}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          portalType: "client",
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.isRoleMismatch) {
        setErrorMessage(
          activeLang === "fil"
            ? "Pansin: Ang account na ito ay may Administrator privileges. Mangyaring mag-log in sa Admin Portal (/admin)."
            : "Notice: This account has Administrator privileges. Please sign in via the Admin Portal (/admin)."
        );
        return;
      }

      if (res.ok && data.success) {
        if (data.user && (data.user.role || "").toLowerCase() === "admin") {
          setErrorMessage(
            activeLang === "fil"
              ? "Pansin: Ang account na ito ay may Administrator privileges. Mangyaring mag-log in sa Admin Portal (/admin)."
              : "Notice: This account has Administrator privileges. Please sign in via the Admin Portal (/admin)."
          );
          return;
        }

        setLockoutMinutes(0);
        setLockoutEndTime(null);
        setAttemptsRemaining(null);
        if (onLoginSuccess) onLoginSuccess(data.user, data.token);
        return;
      }

      // Check if locked out (Status 423)
      if (res.status === 423 || data.locked) {
        const rem = data.remainingMinutes || 15;
        setLockoutMinutes(rem);
        setLockoutEndTime(Date.now() + rem * 60 * 1000);
        setAttemptsRemaining(0);
        setErrorMessage(
          data.message ||
            `${t.accountLockedTitle}. ${t.tryAgainIn} ${rem} ${t.minutesRemainingSuffix}.`
        );
        return;
      }

      // Check attempts remaining (Status 401)
      if (typeof data.attemptsRemaining === "number") {
        setAttemptsRemaining(data.attemptsRemaining);
      }

      setErrorMessage(data.message || t.errInvalidCredentials);
    } catch (err) {
      setErrorMessage(t.errAuthNetwork);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-scrolls and focuses any invalid or missing form field
  const scrollToField = (fieldId) => {
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof el.focus === "function") {
          el.focus();
        }
      }
    }, 60);
  };

  // --- SUBMIT FINAL SIGNUP (STEP 4) ---
  const handleCompleteRegistration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAttemptedStep4(true);

    if (!buildProvince.trim()) {
      setErrorMessage(
        activeLang === "fil"
          ? "Pumili po ng Probinsya kung saan itatayo ang inyong proyekto."
          : "Please select the target construction Province or Region."
      );
      scrollToField("field-buildProvince");
      return;
    }
    if (!buildCity.trim()) {
      setErrorMessage(
        activeLang === "fil"
          ? "Pumili po ng Lungsod / Bayan para sa inyong proyekto."
          : "Please select the target construction City / Municipality."
      );
      scrollToField("field-buildCity");
      return;
    }
    if (!buildBarangay.trim()) {
      setErrorMessage(
        activeLang === "fil"
          ? "Pumili po ng Barangay kung saan itatayo ang proyekto."
          : "Please select the target construction Barangay."
      );
      scrollToField("field-buildBarangay");
      return;
    }
    if (!lotBlkLot.trim() && !lotPhaseStreet.trim() && !lotSubdivision.trim()) {
      setErrorMessage(t.errLotDetails || "Please specify your lot, subdivision, or street details.");
      scrollToField("field-buildBarangay");
      return;
    }
    if (!targetLocation.trim() || targetLocation.trim().length < 3) {
      setErrorMessage(t.errTargetLocation);
      scrollToField("field-buildProvince");
      return;
    }
    const foreignKeywords = [
      "dubai", "uae", "united arab emirates", "saudi", "riyadh", "jeddah",
      "canada", "usa", "united states", "california", "texas", "new york",
      "singapore", "japan", "tokyo", "uk", "united kingdom", "london",
      "australia", "sydney", "melbourne", "qatar", "doha", "kuwait",
      "hong kong", "germany", "new zealand"
    ];
    const locLower = targetLocation.toLowerCase();
    const isForeignOnly = foreignKeywords.some((k) => locLower.includes(k)) &&
      !locLower.includes("philippines") &&
      !locLower.includes("pilipinas") &&
      !locLower.includes("bulacan") &&
      !locLower.includes("pampanga") &&
      !locLower.includes("manila") &&
      !locLower.includes("luzon");

    if (isForeignOnly) {
      setErrorMessage(t.errTargetLocationPhOnly || "MCPA constructs exclusively within the Philippines (Bulacan, Pampanga, Metro Manila, and Central Luzon). Please provide your Philippine lot location.");
      scrollToField("field-buildProvince");
      return;
    }
    if (!hasScrolledToBottom || !hasAcceptedTerms || !hasAcceptedPrivacy) {
      setErrorMessage(t.errLegalAccept);
      scrollToField("field-legalSection");
      setIsLegalModalOpen(true);
      return;
    }

    setErrorMessage("");
    // Trigger Human Security Verification Puzzle CAPTCHA
    setIsPuzzleModalOpen(true);
  };

  // Called when user successfully completes the puzzle slider
  const handlePuzzleSuccess = async () => {
    setIsPuzzleModalOpen(false);
    setIsSubmitting(true);
    setSubmissionProgressText(t.processingRegistration);

    try {
      const fullLocation =
        clientType === "OFW"
          ? `${ofwCountry} (Build: ${targetLocation})`
          : `${locationAddress || "Bulacan / NCR"} (Build: ${targetLocation})`;

      const res = await fetch("/api/auth/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          suffix: suffix.trim(),
          occupation: occupation.trim(),
          employerName: employerName.trim(),
          civilStatus,
          spouseName: spouseName.trim(),
          birthDate: birthDate.trim(),
          monthlyIncome,
          preferredContactTime,
          emergencyContact: "",
          lotOwnershipStatus,
          subdivisionLotDetails: subdivisionLotDetails.trim(),
          targetBuildLocation: targetLocation.trim(),
          targetProjectType: projectType,
          ofwCountry: clientType === "OFW" ? ofwCountry : "",
          phRepName: clientType === "OFW" ? phRepName.trim() : "",
          phRepRelationship: clientType === "OFW" ? phRepRelationship.trim() : "",
          phRepPhone: clientType === "OFW" ? (phRepPhone ? `+63 ${phRepPhone.trim()}` : "") : "",
          email: registerEmail.trim(),
          password: registerPassword,
          phoneNumber: `${countryCode} ${phoneNumber.trim()}`,
          clientType,
          locationAddress: fullLocation,
          avatarUrl: capturedSelfie || socialConnected?.avatarUrl || "",
          authProvider: socialConnected?.provider || "local",
          providerId: socialConnected?.providerId || "",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubmitting(false);
        setRegisteredUserData(data.user);
        setRegisteredUserToken(data.token);
        setIsSuccessAnimation(true);
        return;
      }

      setErrorMessage(data.message || t.errRegistrationFailed);
    } catch (err) {
      setErrorMessage(t.errNetwork);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgressText("");
    }
  };

  return (
    <>
      <div className="relative w-full max-w-[465px] sm:max-w-[495px] mx-auto bg-white dark:bg-[#11141e] rounded-[24px] border border-neutral-200/90 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/40 px-6 py-5 sm:px-7.5 sm:py-6 transition-all duration-300">
        {/* SUBMISSION LOADING OVERLAY SPINNER ("SPINNER PAG MAG SUSUBMIT") */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#11141e]/95 backdrop-blur-xs rounded-[24px] z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="relative mb-3.5">
              <div className="w-14 h-14 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              {t.securingAccountTitle}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[260px] font-mono">
              {submissionProgressText || t.processingRegistration}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSubmitting(false);
                setSubmissionProgressText("");
              }}
              className="mt-4 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
            >
              {activeLang === "fil" ? "Kanselahin" : "Cancel"}
            </button>
          </div>
        )}

        {/* REGISTRATION SUCCESS 1.5-SECOND ARCHITECTURAL ONBOARDING ANIMATION OVERLAY */}
        {isSuccessAnimation && (
          <ArchitecturalEntranceAnimation
            clientName={registeredUserData?.fullName || fullName || "Valued Client"}
            email={registeredUserData?.email || registerEmail || ""}
            projectType={projectType || "Modern Residence"}
            activeLang={activeLang}
            onComplete={() => {
              setIsSuccessAnimation(false);
              if (onLoginSuccess) {
                onLoginSuccess(
                  registeredUserData || { fullName: fullName || "Valued Client", email: registerEmail },
                  registeredUserToken
                );
              }
            }}
          />
        )}
      {/* BRAND LOGO AT TOP (Crisp Black in Light Mode, Pure White in Dark Mode) */}
      <div className="flex justify-center mb-3 sm:mb-3.5">
        <Image
          src="/assets/mcpa-logo.svg"
          alt="MCPA Construction & Supply"
          width={145}
          height={38}
          unoptimized
          className="block dark:hidden object-contain h-8 sm:h-8.5 w-auto"
          priority
        />
        <Image
          src="/assets/logo-white.svg"
          alt="MCPA Construction & Supply"
          width={145}
          height={38}
          unoptimized
          className="hidden dark:block object-contain h-8 sm:h-8.5 w-auto"
          priority
        />
      </div>

      {/* SOCIAL SUCCESS BANNER: Clean green text only, no background */}
      {socialSuccessBanner && (
        <div className="mb-3 text-emerald-600 dark:text-emerald-400 text-xs sm:text-[12.5px] font-medium flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
          <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
          <p className="flex-1 break-words">{socialSuccessBanner}</p>
        </div>
      )}

      {/* 15-MINUTE SECURITY LOCKOUT ALERT BANNER */}
      {lockoutMinutes > 0 && (
        <div className="mb-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold mb-1">
            <LockIcon className="w-4 h-4 text-red-500 shrink-0" />
            <span>{t.accountLockedTitle}</span>
            <span className="ml-auto font-mono text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-300">
              {lockoutMinutes}m
            </span>
          </div>
          <p className="text-[11.5px] leading-snug">
            {t.accountLockedDesc} {t.tryAgainIn}{" "}
            <strong className="underline underline-offset-1">
              {lockoutMinutes} {t.minutesRemainingSuffix}
            </strong>.
          </p>
          <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {t.forgotPassword}
            </button>
            <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
              MCPA Security Engine
            </span>
          </div>
        </div>
      )}

      {/* ERROR BANNER: Clean red text only, no background, fully visible without truncation */}
      {errorMessage && !lockoutMinutes && (
        <div className="mb-3 text-red-600 dark:text-red-400 text-xs sm:text-[12.5px] font-medium flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
          <p className="flex-1 break-words">{errorMessage}</p>
        </div>
      )}

      {/* =========================================================================
          VIEW A: LOGIN CARD (Expanded Comfortably - "Sakto at Hindi Masikip")
          ========================================================================= */}
      {authMode === "login" && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-4 sm:mb-5">
            <h2 className="text-2xl sm:text-[25px] font-black text-neutral-900 dark:text-white tracking-tight">
              {t.welcomeTitle}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-normal">
              {t.welcomeSubtitle}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* Email Address */}
            <div className="relative">
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="email"
                required
                disabled={lockoutMinutes > 0}
                placeholder={t.emailPlaceholder}
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className={`w-full pl-11 pr-4 py-3 rounded-[13px] border ${
                  attemptedLogin && (!loginEmail.trim() || !isValidEmail(loginEmail))
                    ? "bg-red-500/10 dark:bg-red-950/35 border-red-500 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                } text-sm focus:outline-none transition-all disabled:opacity-50`}
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={lockoutMinutes > 0}
                  placeholder={t.passwordPlaceholder}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  className={`w-full pl-11 pr-11 py-3 rounded-[13px] border ${
                    attemptedLogin && !loginPassword
                      ? "bg-red-500/10 dark:bg-red-950/35 border-red-500 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  } text-sm focus:outline-none transition-all disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                >
                  {showPassword ? <EyeOffIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Security Attempts Warning Counter */}
              {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 3 && !lockoutMinutes && (
                <div className="mt-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 animate-in fade-in">
                  <span>⚠️</span>
                  <span>
                    {t.attemptsWarningPrefix} {attemptsRemaining} {t.attemptsRemainingSuffix}
                  </span>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-medium text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            {/* Primary Action Button (Amber) */}
            <button
              type="submit"
              disabled={isSubmitting || lockoutMinutes > 0}
              className="w-full py-3 rounded-[13px] bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 font-bold text-sm shadow-sm shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCwIcon className="w-4.5 h-4.5 animate-spin" />
                  <span>{t.verifyingCredentials}</span>
                </>
              ) : (
                <span>{t.logInButton}</span>
              )}
            </button>
          </form>

          {/* OR DIVIDER */}
          <div className="relative my-3.5 sm:my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-white/10" />
            </div>
            <span className="relative px-3 bg-white dark:bg-[#11141e] text-[10.5px] sm:text-[11.5px] font-mono text-neutral-400 uppercase tracking-widest">
              {t.orDivider}
            </span>
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleSocialClick("google")}
              disabled={isSubmitting || lockoutMinutes > 0}
              className="w-full py-3 px-4 rounded-[13px] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 active:scale-[0.99] text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t.continueWithGoogle}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialClick("facebook")}
              disabled={isSubmitting || lockoutMinutes > 0}
              className="w-full py-3 px-4 rounded-[13px] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 active:scale-[0.99] text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4.5 h-4.5 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{t.continueWithFacebook}</span>
            </button>
          </div>

          {/* BOTTOM TOGGLE TO SIGNUP */}
          <div className="mt-4 text-center text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            <span>{t.noAccountPrompt} </span>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setAuthMode("signup");
                setSignupStep(1);
              }}
              className="font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 underline underline-offset-2 ml-1 cursor-pointer"
            >
              {t.signUpButton}
            </button>
          </div>

          {/* LEGAL FOOTER */}
          <div className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              {t.termsOfService}
            </Link>
            <span className="mx-2 opacity-50">·</span>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              {t.privacyPolicy}
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: MULTI-STEP SIGN UP WIZARD (Compact Viewport Fitting)
          ========================================================================= */}
      {authMode === "signup" && (
        <div className="animate-in fade-in duration-300">
          {/* Header */}
          <div className="text-center mb-2.5 sm:mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {t.signupTitle}
            </h2>
            <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t.signupSubtitle}
            </p>
          </div>

          {/* 4-STEP SEGMENTED PROGRESS STEPPER */}
          <div className="mb-3 sm:mb-3.5">
            <div className="grid grid-cols-4 gap-2 mb-1">
              {[
                { num: 1, title: t.steps.account },
                { num: 2, title: t.steps.profile },
                { num: 3, title: t.steps.identity },
                { num: 4, title: t.steps.project },
              ].map((s) => (
                <div key={s.num} className="flex flex-col">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      signupStep >= s.num
                        ? "bg-amber-500"
                        : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  />
                  <span
                    className={`text-[11px] sm:text-xs mt-1 text-center font-medium transition-colors ${
                      signupStep === s.num
                        ? "text-neutral-900 dark:text-white font-semibold"
                        : signupStep > s.num
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* -----------------------------------------------------------------
              STEP 1: Account Credentials & Identity
              ----------------------------------------------------------------- */}
          {signupStep === 1 && (
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
              {/* Social Signup / Connected Identity */}
              {socialConnected ? (
                <div className="py-2.5 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {capturedSelfie ? (
                      <img
                        src={capturedSelfie}
                        alt="Profile Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                      />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <span>{t.socialConnectedBadge} <span className="capitalize">{socialConnected.provider === "google" ? "Google" : "Facebook"}</span></span>
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {registerEmail}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSocialConnected(null);
                      setSocialSuccessBanner("");
                    }}
                    className="text-[11px] font-medium text-neutral-400 hover:text-red-500 dark:hover:text-red-400 underline ml-2 shrink-0 cursor-pointer transition-colors"
                  >
                    {activeLang === "fil" ? "Ihiwalay" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSocialClick("google")}
                      disabled={isSubmitting}
                      className="h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.99] text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialClick("facebook")}
                      disabled={isSubmitting}
                      className="h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.99] text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>

                  {/* OR DIVIDER */}
                  <div className="relative my-2 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                    </div>
                    <span className="relative px-2.5 bg-white dark:bg-[#11141e] text-[11px] sm:text-xs text-neutral-400">
                      {t.orRegisterWithEmail}
                    </span>
                  </div>
                </>
              )}

              {/* NAME FIELDS */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>{t.fullNameLabel}</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      id="field-firstName"
                      type="text"
                      required
                      placeholder={t.firstNamePlaceholder}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]/g, ""));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl border ${
                        (attemptedStep1 && !isValidName(firstName)) || (firstName && !isValidName(firstName))
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-xs sm:text-sm focus:outline-none transition-all`}
                    />
                    {attemptedStep1 && !isValidName(firstName) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errFirstName}
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      id="field-middleName"
                      type="text"
                      placeholder={t.middleNamePlaceholder}
                      value={middleName}
                      onChange={(e) => {
                        setMiddleName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]/g, ""));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl border ${
                        middleName && !isValidName(middleName)
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-xs sm:text-sm focus:outline-none transition-all`}
                    />
                    {middleName && !isValidName(middleName) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errMiddleName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      id="field-lastName"
                      type="text"
                      required
                      placeholder={t.lastNamePlaceholder}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]/g, ""));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl border ${
                        (attemptedStep1 && !isValidName(lastName)) || (lastName && !isValidName(lastName))
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-xs sm:text-sm focus:outline-none transition-all`}
                    />
                    {attemptedStep1 && !isValidName(lastName) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errLastName}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <select
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                    >
                      <option value="">{t.suffixOptions.none}</option>
                      <option value="Jr.">{t.suffixOptions.jr}</option>
                      <option value="Sr.">{t.suffixOptions.sr}</option>
                      <option value="II">{t.suffixOptions.ii}</option>
                      <option value="III">{t.suffixOptions.iii}</option>
                      <option value="IV">{t.suffixOptions.iv}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  <span>{t.emailFieldLabel}</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="field-registerEmail"
                    type="email"
                    required
                    readOnly={Boolean(socialConnected)}
                    placeholder={t.emailFieldPlaceholder}
                    value={registerEmail}
                    onChange={(e) => {
                      if (!socialConnected) {
                        setRegisterEmail(e.target.value.trim());
                      }
                    }}
                    className={`w-full h-10 pl-10 pr-9 rounded-xl border ${
                      attemptedStep1 && !isEmailValid
                        ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                        : registerEmail && !isEmailValid
                        ? "border-2 border-red-500/70 focus:border-red-500 bg-red-50 dark:bg-red-950/20 text-neutral-900 dark:text-white"
                        : registerEmail && isEmailValid
                        ? "bg-neutral-50 dark:bg-[#161a23] border-emerald-500/60 focus:border-emerald-500"
                        : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 focus:border-amber-500"
                    } text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all ${
                      socialConnected ? "cursor-not-allowed opacity-90 font-medium" : ""
                    }`}
                  />
                  {registerEmail && isEmailValid && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  )}
                </div>
                {attemptedStep1 && !isEmailValid && (
                  <span className="text-[11px] text-red-500 font-medium mt-1 block pl-0.5">
                    {t.errEmail}
                  </span>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  <span>{t.passwordFieldLabel}</span>
                  {!socialConnected && <span className="text-red-500 font-bold ml-1">*</span>}
                  {socialConnected && (
                    <span className="font-normal text-emerald-600 dark:text-emerald-400 ml-1">
                      ({t.socialOptionalPassword})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="field-registerPassword"
                    type={showPassword ? "text" : "password"}
                    required={!socialConnected}
                    placeholder={
                      socialConnected
                        ? t.socialOptionalPassword
                        : t.passwordFieldPlaceholder
                    }
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className={`w-full h-10 pl-10 pr-9 rounded-xl border ${
                      ((!socialConnected && attemptedStep1 && !passwordEval.isValid) || (registerPassword && !passwordEval.isValid))
                        ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                        : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                    } text-xs sm:text-sm focus:outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>

                {attemptedStep1 && !socialConnected && !passwordEval.isValid && (
                  <span className="text-[11px] text-red-500 font-medium mt-1 block">
                    {t.errPassword}
                  </span>
                )}

                {registerPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className={`h-1.5 rounded-full ${passwordEval.score >= 1 ? passwordEval.bg : "bg-neutral-200 dark:bg-neutral-800"}`} />
                      <div className={`h-1.5 rounded-full ${passwordEval.score >= 2 ? passwordEval.bg : "bg-neutral-200 dark:bg-neutral-800"}`} />
                      <div className={`h-1.5 rounded-full ${passwordEval.score >= 3 ? passwordEval.bg : "bg-neutral-200 dark:bg-neutral-800"}`} />
                      <div className={`h-1.5 rounded-full ${passwordEval.score >= 4 ? passwordEval.bg : "bg-neutral-200 dark:bg-neutral-800"}`} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${passwordEval.color}`}>{t.passwordStrengthPrefix} {passwordEval.label}</span>
                      <span className="text-neutral-400">{t.passwordCriteriaHelper}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => {
                  setAttemptedStep1(true);
                  if (!isValidName(firstName)) {
                    setErrorMessage(t.errFirstName);
                    scrollToField("field-firstName");
                    return;
                  }
                  if (middleName && !isValidName(middleName)) {
                    setErrorMessage(t.errMiddleName);
                    scrollToField("field-middleName");
                    return;
                  }
                  if (!isValidName(lastName)) {
                    setErrorMessage(t.errLastName);
                    scrollToField("field-lastName");
                    return;
                  }
                  if (!isEmailValid) {
                    setErrorMessage(t.errEmail);
                    scrollToField("field-registerEmail");
                    return;
                  }
                  // Password check: Mandatory for standard registration, optional if social account linked
                  if (!socialConnected) {
                    if (!passwordEval.isValid) {
                      setErrorMessage(t.errPassword);
                      scrollToField("field-registerPassword");
                      return;
                    }
                  } else if (registerPassword && !passwordEval.isValid) {
                    setErrorMessage(t.errPassword);
                    scrollToField("field-registerPassword");
                    return;
                  }
                  setErrorMessage("");
                  setSignupStep(2);
                }}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{t.continueToProfile}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STEP 2: Personal, Employment & Financing Profile
              ----------------------------------------------------------------- */}
          {signupStep === 2 && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="space-y-3 max-h-[min(55vh,400px)] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Client Residency */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    {t.classificationLabel}
                  </label>
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setClientType("Local");
                        setCountryCode("+63");
                      }}
                      className={`h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        clientType === "Local"
                          ? "bg-amber-500 text-neutral-950 shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <img
                        src="https://flagcdn.com/w40/ph.png"
                        alt="PH"
                        className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10"
                      />
                      <span>{t.localTitle}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClientType("OFW");
                        const match = COUNTRIES.find((c) => c.name === ofwCountry) || COUNTRIES[2];
                        setCountryCode(match.dial);
                        setSelectedCountryCode(match.code);
                      }}
                      className={`h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        clientType === "OFW"
                          ? "bg-amber-500 text-neutral-950 shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <PlaneIcon className="w-3.5 h-3.5" />
                      <span>{t.ofwTitle}</span>
                    </button>
                  </div>
                </div>

                {/* Searchable OFW Country Picker */}
                {clientType === "OFW" && (
                  <CountryPicker
                    selectedCountryName={ofwCountry}
                    onSelectCountry={(country) => {
                      setOfwCountry(country.name);
                      if (countryCode !== "+63") {
                        setSelectedCountryCode(country.code);
                        setCountryCode(country.dial);
                      }
                    }}
                  />
                )}

                {/* 2. Date of Birth & Civil Status */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center">
                        <span>{t.birthDateLabel}</span>
                        <span className="text-red-500 font-bold ml-1">*</span>
                      </label>
                      {clientAge !== null && (
                        <span className={`text-[11px] font-medium ${isValidAge(birthDate) ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          {isValidAge(birthDate)
                            ? `(${clientAge} ${activeLang === "fil" ? "taon" : "yrs old"})`
                            : `(${clientAge} ${activeLang === "fil" ? "taon - 18+ lamang" : "yrs old - 18+ only"})`}
                        </span>
                      )}
                    </div>
                    <input
                      id="field-birthDate"
                      type="date"
                      value={birthDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3 rounded-xl border ${
                        (attemptedStep2 && !isValidAge(birthDate)) || (birthDate && !isValidAge(birthDate))
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-xs sm:text-sm focus:outline-none transition-all`}
                    />
                    {attemptedStep2 && !isValidAge(birthDate) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errAge}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                      {t.civilStatusLabel}
                    </label>
                    <select
                      value={civilStatus}
                      onChange={(e) => setCivilStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                    >
                      <option value="Single">{t.civilStatuses.single}</option>
                      <option value="Married">{t.civilStatuses.married}</option>
                      <option value="Co-owner">{t.civilStatuses.coOwner}</option>
                      <option value="Widowed">{t.civilStatuses.widowed}</option>
                      <option value="Separated">{t.civilStatuses.separated}</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Spouse / Co-borrower Name if Married or Co-owner */}
                {(civilStatus === "Married" || civilStatus === "Co-owner") && (
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center mb-1.5">
                      <span>{t.spouseNameLabel}</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      id="field-spouseName"
                      type="text"
                      placeholder={t.spouseNamePlaceholder}
                      value={spouseName}
                      onChange={(e) => {
                        setSpouseName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]/g, ""));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl border ${
                        (attemptedStep2 && !isValidName(spouseName)) || (spouseName && !isValidName(spouseName))
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-sm focus:outline-none transition-all`}
                    />
                    {attemptedStep2 && !isValidName(spouseName) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errSpouse}
                      </span>
                    )}
                  </div>
                )}

                {/* 3. Occupation & Employer */}
                <div className="grid grid-cols-2 gap-2.5 items-start">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center h-5 mb-1.5 truncate" title={t.occupationLabel}>
                      <span>{t.occupationLabel}</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      id="field-occupation"
                      type="text"
                      placeholder={t.occupationPlaceholder}
                      value={occupation}
                      onChange={(e) => {
                        setOccupation(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\/\&.,]/g, ""));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl border ${
                        (attemptedStep2 && !isValidOccupation(occupation)) || (occupation && !isValidOccupation(occupation))
                          ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                          : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      } text-sm focus:outline-none transition-all`}
                    />
                    {((attemptedStep2 && !isValidOccupation(occupation)) || (occupation && !isValidOccupation(occupation))) && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 block">
                        {t.errOccupation || "Please enter your occupation or profession (letters only)."}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center h-5 mb-1.5 truncate" title={t.employerLabel}>
                      {t.employerLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={t.employerPlaceholder}
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* 4. Estimated Monthly Household Income Range */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    {t.monthlyIncomeLabel}
                  </label>
                  <select
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  >
                    <option value="Under ₱75,000 / month">Under ₱75,000 / month</option>
                    <option value="₱75,000 – ₱150,000 / month">₱75,000 – ₱150,000 / month (Standard)</option>
                    <option value="₱150,000 – ₱300,000 / month">₱150,000 – ₱300,000 / month (Executive)</option>
                    <option value="₱300,000 – ₱500,000 / month">₱300,000 – ₱500,000 / month (High Net Worth)</option>
                    <option value="₱500,000+ / month (Luxury Construction)">₱500,000+ / month (Luxury Estate)</option>
                  </select>
                </div>

                {/* 5. Mobile Phone Number */}
                {clientType === "Local" ? (
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center mb-1.5">
                      <span>{t.contactNumberLabel}</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="w-20 shrink-0 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-neutral-100 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        <img
                          src="https://flagcdn.com/w40/ph.png"
                          alt="PH"
                          className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10"
                        />
                        <span>+63</span>
                      </div>
                      <input
                        id="field-phoneNumber"
                        type="tel"
                        required
                        maxLength={12}
                        placeholder="912 345 6789"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(formatPhPhone(e.target.value));
                          if (errorMessage) setErrorMessage("");
                        }}
                        className={`flex-1 h-10 px-3.5 rounded-xl border ${
                          (attemptedStep2 && !isValidPhPhone(phoneNumber)) || (phoneNumber && !isValidPhPhone(phoneNumber))
                            ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                            : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                        } text-sm focus:outline-none font-mono tracking-wider transition-all`}
                      />
                    </div>
                    {attemptedStep2 && !isValidPhPhone(phoneNumber) && (
                      <span className="text-xs text-red-500 font-medium mt-1 block">
                        {t.errPhPhone}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center">
                        <span>{t.contactNumberLabel}</span>
                        <span className="text-red-500 font-bold ml-1">*</span>
                      </label>
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {countryCode === "+63" ? "Philippine SIM (+63)" : `Overseas (${countryCode})`}
                      </span>
                    </div>

                    {/* Quick 2-Way Switcher */}
                    <div className="grid grid-cols-2 p-1 mb-2 rounded-xl bg-neutral-100 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCountryCode("+63");
                          setSelectedCountryCode("ph");
                          setPhoneNumber("");
                        }}
                        className={`h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          countryCode === "+63"
                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        <img
                          src="https://flagcdn.com/w40/ph.png"
                          alt="PH"
                          className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10 shrink-0"
                        />
                        <span className="truncate">{t.phSimLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCountryCode(hostCountryObj.dial);
                          setSelectedCountryCode(hostCountryObj.code);
                          setPhoneNumber("");
                        }}
                        className={`h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          countryCode !== "+63"
                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        <img
                          src={getFlagUrl(hostCountryObj.code)}
                          alt=""
                          className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10 shrink-0"
                        />
                        <span className="truncate">
                          {t.overseasSimLabel} ({hostCountryObj.dial})
                        </span>
                      </button>
                    </div>

                    {/* Dial Code Dropdown + Phone Input */}
                    <div className="flex gap-2 relative">
                      <div className="relative" ref={phoneDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                          className="h-10 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
                        >
                          <img
                            src={getFlagUrl(selectedCountryCode)}
                            alt=""
                            className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10 shrink-0"
                          />
                          <span>{countryCode}</span>
                          <ChevronDownIcon
                            className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                              isPhoneDropdownOpen ? "rotate-180 text-amber-500" : ""
                            }`}
                          />
                        </button>

                        {/* Dial Code Menu */}
                        {isPhoneDropdownOpen && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-64 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                            <div className="relative mb-1">
                              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                              <input
                                type="text"
                                value={phoneSearchQuery}
                                onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                placeholder={t.searchCountryPlaceholder}
                                className="w-full pl-8 pr-2.5 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-neutral-100 dark:divide-neutral-800">
                              {filteredPhoneCountries.length === 0 ? (
                                <div className="p-3 text-center text-neutral-400 text-xs">
                                  {activeLang === "fil" ? "Walang nahanap na bansa" : "No country found"}
                                </div>
                              ) : (
                                filteredPhoneCountries.map((c) => {
                                  const isSelected = countryCode === c.dial && selectedCountryCode === c.code;
                                  return (
                                    <button
                                      key={c.code + c.dial}
                                      type="button"
                                      onClick={() => {
                                        setCountryCode(c.dial);
                                        setSelectedCountryCode(c.code);
                                        setIsPhoneDropdownOpen(false);
                                        setPhoneSearchQuery("");
                                        setPhoneNumber("");
                                      }}
                                      className={`w-full px-2.5 py-1.5 flex items-center justify-between rounded-lg text-left transition-colors cursor-pointer ${
                                        isSelected
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img
                                          src={getFlagUrl(c.code)}
                                          alt=""
                                          className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10 shrink-0"
                                        />
                                        <span className="truncate text-xs">{c.name}</span>
                                      </div>
                                      <span className="font-mono text-xs text-neutral-400 shrink-0 ml-1.5">
                                        {c.dial}
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Phone Input Box */}
                      {countryCode === "+63" ? (
                        <input
                          id="field-phoneNumber"
                          type="tel"
                          required
                          maxLength={12}
                          placeholder="912 345 6789"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(formatPhPhone(e.target.value));
                            if (errorMessage) setErrorMessage("");
                          }}
                          className={`flex-1 h-10 px-3.5 rounded-xl border ${
                            (attemptedStep2 && !isValidPhPhone(phoneNumber)) || (phoneNumber && !isValidPhPhone(phoneNumber))
                              ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                              : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                          } text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 font-mono tracking-wider transition-all`}
                        />
                      ) : (
                        <input
                          id="field-phoneNumber"
                          type="tel"
                          required
                          placeholder={activeLang === "fil" ? "Numero sa ibang bansa" : "Overseas Contact Number"}
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(formatIntlPhone(e.target.value));
                            if (errorMessage) setErrorMessage("");
                          }}
                          className={`flex-1 h-10 px-3.5 rounded-xl border ${
                            attemptedStep2 && (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 6)
                              ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                              : "bg-neutral-50 dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                          } text-sm focus:outline-none font-mono tracking-wider transition-all`}
                        />
                      )}
                    </div>
                    {attemptedStep2 && countryCode === "+63" && phoneNumber && !isValidPhPhone(phoneNumber) && (
                      <span className="text-xs text-red-500 font-medium mt-1 block">
                        {t.errPhPhone}
                      </span>
                    )}
                    {attemptedStep2 && countryCode !== "+63" && (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 6) && (
                      <span className="text-xs text-red-500 font-medium mt-1 block">
                        {t.errIntlPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* 6. Structured Current / Residential Address (Philippines - Cascading PSGC) */}
                <PhAddressCascadeSection
                  province={resProvince}
                  provinceCode={resProvinceCode}
                  onProvinceChange={(p) => {
                    setResProvince(p.name);
                    setResProvinceCode(p.code);
                  }}
                  city={resCity}
                  cityCode={resCityCode}
                  onCityChange={(c) => {
                    setResCity(c.name);
                    setResCityCode(c.code);
                  }}
                  barangay={resBarangay}
                  barangayCode={resBarangayCode}
                  onBarangayChange={(b) => {
                    setResBarangay(b.name);
                    setResBarangayCode(b.code);
                  }}
                  subdivision={resSubdivision}
                  onSubdivisionChange={setResSubdivision}
                  street={resStreet}
                  onStreetChange={setResStreet}
                  houseNo={resHouseNo}
                  onHouseNoChange={setResHouseNo}
                  blkLot={resBlkLot}
                  onBlkLotChange={setResBlkLot}
                  attempted={attemptedStep2}
                  t={t}
                  activeLang={activeLang}
                  title={t.residentialAddressTitle || "Current Residential Address (Philippines)"}
                  idPrefix="field-res"
                  onClearErrors={() => {
                    if (errorMessage) setErrorMessage("");
                  }}
                />

                {/* 7. OFW Local Project Representative */}
                {clientType === "OFW" && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <UserCheckIcon className="w-4 h-4 stroke-[2.2]" />
                      <span className="text-xs font-bold">
                        {t.phRepBoxTitle}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">
                      {t.phRepBoxSubtitle}
                    </p>

                    {/* Rep Name & Relationship */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          id="field-phRepName"
                          type="text"
                          placeholder={t.phRepNamePlaceholder}
                          value={phRepName}
                          onChange={(e) => {
                            setPhRepName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]/g, ""));
                            if (errorMessage) setErrorMessage("");
                          }}
                          className={`w-full h-9 px-3 rounded-lg border ${
                            (attemptedStep2 && !isValidName(phRepName)) || (phRepName && !isValidName(phRepName))
                              ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                              : "bg-white dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500"
                          } text-xs focus:outline-none`}
                        />
                        {attemptedStep2 && !isValidName(phRepName) && (
                          <span className="text-[10px] text-red-500 font-medium mt-0.5 block">
                            {t.errRepName}
                          </span>
                        )}
                      </div>
                      <select
                        value={phRepRelationship}
                        onChange={(e) => setPhRepRelationship(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="Spouse">{t.phRepRelationships.spouse}</option>
                        <option value="Parent">{t.phRepRelationships.parent}</option>
                        <option value="Sibling">{t.phRepRelationships.sibling}</option>
                        <option value="Child">{t.phRepRelationships.child}</option>
                        <option value="Trustee">{t.phRepRelationships.trustee}</option>
                      </select>
                    </div>

                    {/* Rep Philippine Mobile */}
                    <div>
                      <div className="flex gap-2">
                        <div className="w-18 shrink-0 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-neutral-100 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          <img
                            src="https://flagcdn.com/w40/ph.png"
                            alt="PH"
                            className="w-4 h-3 object-cover rounded-xs border border-black/10 dark:border-white/10"
                          />
                          <span>+63</span>
                        </div>
                        <input
                          id="field-phRepPhone"
                          type="tel"
                          maxLength={12}
                          placeholder="917 123 4567 *"
                          value={phRepPhone}
                          onChange={(e) => {
                            setPhRepPhone(formatPhPhone(e.target.value));
                            if (errorMessage) setErrorMessage("");
                          }}
                          className={`flex-1 h-9 px-3 rounded-lg border ${
                            (attemptedStep2 && !isValidPhPhone(phRepPhone)) || (phRepPhone && !isValidPhPhone(phRepPhone))
                              ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30"
                              : "bg-white dark:bg-[#161a23] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500"
                          } text-xs focus:outline-none font-mono tracking-wider`}
                        />
                      </div>
                      {attemptedStep2 && !isValidPhPhone(phRepPhone) && (
                        <span className="text-xs text-red-500 font-medium mt-1 block">
                          {t.errRepPhone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 8. Preferred Contact Schedule */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    {t.preferredTimeLabel}
                  </label>
                  <select
                    value={preferredContactTime}
                    onChange={(e) => setPreferredContactTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  >
                    <option value="Anytime (PH Daytime)">{t.consultationTimes.anytime}</option>
                    <option value="Morning (8AM - 12PM PHT)">{t.consultationTimes.morning}</option>
                    <option value="Afternoon (1PM - 5PM PHT)">{t.consultationTimes.afternoon}</option>
                    <option value="Evening (6PM - 9PM PHT)">{t.consultationTimes.evening}</option>
                    <option value="Weekend Consultations Only">{t.consultationTimes.weekends}</option>
                  </select>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className="h-11 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>{t.backButton}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAttemptedStep2(true);
                    if (!isValidAge(birthDate)) {
                      setErrorMessage(t.errAge);
                      scrollToField("field-birthDate");
                      return;
                    }
                    if ((civilStatus === "Married" || civilStatus === "Co-owner") && !isValidName(spouseName)) {
                      setErrorMessage(t.errSpouse);
                      scrollToField("field-spouseName");
                      return;
                    }
                    if (!isValidOccupation(occupation)) {
                      setErrorMessage(t.errOccupation);
                      scrollToField("field-occupation");
                      return;
                    }
                    if (clientType === "Local" || countryCode === "+63") {
                      if (!isValidPhPhone(phoneNumber)) {
                        setErrorMessage(t.errPhPhone);
                        scrollToField("field-phoneNumber");
                        return;
                      }
                    } else {
                      const cleanDigits = phoneNumber.replace(/\D/g, "");
                      if (!cleanDigits || cleanDigits.length < 6) {
                        setErrorMessage(t.errIntlPhone);
                        scrollToField("field-phoneNumber");
                        return;
                      }
                    }

                    if (!resProvince.trim()) {
                      setErrorMessage(
                        activeLang === "fil"
                          ? "Kailangan pong pumili ng Probinsya / Rehiyon sa inyong tirahan."
                          : "Please select your residential Province or Region."
                      );
                      scrollToField("field-resProvince");
                      return;
                    }
                    if (!resCity.trim()) {
                      setErrorMessage(
                        activeLang === "fil"
                          ? "Kailangan pong pumili ng Lungsod / Bayan sa inyong tirahan."
                          : "Please select your residential City / Municipality."
                      );
                      scrollToField("field-resCity");
                      return;
                    }
                    if (!resBarangay.trim()) {
                      setErrorMessage(
                        activeLang === "fil"
                          ? "Kailangan pong pumili ng Barangay sa inyong tirahan."
                          : "Please select your residential Barangay."
                      );
                      scrollToField("field-resBarangay");
                      return;
                    }

                    if (clientType === "OFW") {
                      if (!isValidName(phRepName)) {
                        setErrorMessage(t.errRepName);
                        scrollToField("field-phRepName");
                        return;
                      }
                      if (!isValidPhPhone(phRepPhone)) {
                        setErrorMessage(t.errRepPhone);
                        scrollToField("field-phRepPhone");
                        return;
                      }
                    }
                    setErrorMessage("");
                    setSignupStep(3);
                  }}
                  className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>{t.continueToIdentity}</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STEP 3: Identity Verification (KYC)
              ----------------------------------------------------------------- */}
          {signupStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-center px-1">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  {activeLang === "fil" ? "Pagpapatunay ng Pagkakakilanlan (Biometric KYC)" : "Biometric Identity Verification"}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {activeLang === "fil"
                    ? "Seguridad para sa mga architectural consultations, permits, at project monitoring."
                    : "Verified biometric security for architectural consultations, permits, and project tracking."}
                </p>
              </div>

              <div className="space-y-3 max-h-[min(56vh,420px)] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. STANDBY STATE: EDITORIAL BIOMETRIC REQUIREMENTS (NO GCASH CLENLINESS) */}
                {!isCameraActive && !capturedSelfie && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {/* Visual Do & Don't KYC Instruction Guide */}
                    <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-900/60 transition-colors">
                      <img
                        src="/assets/kyc-face-guide.jpg"
                        alt={activeLang === "fil" ? "Gabay sa Pagsusuri ng Mukha: DO vs DON'T" : "Face Verification Guide: DO vs DON'T"}
                        className="w-full h-auto object-cover max-h-52 sm:max-h-60 mx-auto"
                      />
                    </div>

                    {/* Camera Error Alert if Live Cam blocked by HTTP Wi-Fi */}
                    {cameraError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">{cameraError}</p>
                        </div>
                      </div>
                    )}

                    {/* Guidance Card adapting to Light and Dark Mode */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 text-left space-y-2.5 transition-colors">
                      <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-bold">
                        <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                        <span>
                          {activeLang === "fil" ? "Mga Gabay sa Pagkuha ng Litrato" : "Verification Guidelines"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] leading-snug">
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            ✓
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            <strong className="text-neutral-900 dark:text-white font-medium">
                              {activeLang === "fil" ? "Maliwanag na Ilaw: " : "Good Lighting: "}
                            </strong>
                            {activeLang === "fil" ? "Iwasan ang anino o matinding silaw." : "Avoid dark shadows or direct backlight."}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            ✓
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            <strong className="text-neutral-900 dark:text-white font-medium">
                              {activeLang === "fil" ? "Walang Harang: " : "Uncovered Face: "}
                            </strong>
                            {activeLang === "fil" ? "Tanggalin ang sumbrero, shades, o mask." : "No hardhats, caps, shades, or masks."}
                          </span>
                        </div>
                      </div>

                      {/* 5-step movement overview */}
                      <div className="pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-1">
                          {activeLang === "fil" ? "Pagkakasunod-sunod ng Paggalaw (Motion Steps):" : "Biometric Motion Sequence:"}
                        </span>
                        <div className="flex items-center justify-between text-[10.5px] font-medium text-neutral-600 dark:text-neutral-300 gap-1 flex-wrap">
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "1. Gitna" : "1. Center"}</span>
                          <span className="text-neutral-300 dark:text-neutral-700">→</span>
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "2. Pakanan" : "2. Right"}</span>
                          <span className="text-neutral-300 dark:text-neutral-700">→</span>
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "3. Pakaliwa" : "3. Left"}</span>
                          <span className="text-neutral-300 dark:text-neutral-700">→</span>
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "4. Itingala" : "4. Tilt Up"}</span>
                          <span className="text-neutral-300 dark:text-neutral-700">→</span>
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "5. Iyuko" : "5. Tilt Down"}</span>
                          <span className="text-neutral-300 dark:text-neutral-700">→</span>
                          <span className="flex items-center gap-1">{activeLang === "fil" ? "6. Kurap" : "6. Blink"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Camera or Upload Photo */}
                    <div className="pt-1 flex flex-col items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLivenessPurpose("kyc");
                          setIsLivenessModalOpen(true);
                        }}
                        className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <CameraIcon className="w-4 h-4" />
                        <span>
                          {activeLang === "fil"
                            ? "Simulan ang Biometric Verification"
                            : "Start Biometric Face Verification"}
                        </span>
                      </button>

                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs flex-wrap">
                        <label className="text-amber-600 dark:text-amber-400 font-semibold underline cursor-pointer hover:opacity-80 flex items-center gap-1">
                          <CameraIcon className="w-3.5 h-3.5" />
                          <span>{activeLang === "fil" ? "Kunan gamit ang Phone Camera" : "Snap with Phone Camera"}</span>
                          <input type="file" accept="image/*" capture="user" onChange={handleFileUploadSelfie} className="hidden" />
                        </label>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 underline cursor-pointer"
                        >
                          {activeLang === "fil" ? "Buksan ang Circular Cam" : "Open In-page Camera"}
                        </button>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <label className="text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 underline cursor-pointer">
                          {t.uploadFromDevice}
                          <input type="file" accept="image/*" onChange={handleFileUploadSelfie} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LIVE CAMERA STREAM (PURE CIRCLE FRAME WITH CIRCULAR PROGRESS RING) */}
                {isCameraActive && (
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center animate-in fade-in duration-150 transition-colors">
                    {/* Circular Frame with SVG Ring */}
                    <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center mb-3">
                      {/* Circular SVG Ring */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          className="text-neutral-200 dark:text-neutral-800"
                          strokeWidth="4"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="4"
                          strokeDasharray="680"
                          strokeDashoffset="120"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>

                      {/* Pure Circular Viewport */}
                      <div className="relative w-[84%] h-[84%] rounded-full overflow-hidden bg-neutral-950 border border-white/20 shadow-inner flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1] rounded-full"
                        />
                        {/* Inside dashed guide circle */}
                        <div className="absolute inset-3 border-2 border-dashed border-amber-400/40 rounded-full pointer-events-none animate-pulse" />
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium mb-3">
                      {activeLang === "fil"
                        ? "Igitna ang iyong mukha sa bilog at kumuha ng litrato"
                        : "Center your face in the circle and capture photo"}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={isFaceChecking}
                        className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        {isFaceChecking ? (
                          <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CameraIcon className="w-3.5 h-3.5" />
                        )}
                        <span>{isFaceChecking ? (activeLang === "fil" ? "Sinusuri..." : "Checking...") : t.capturePhotoButton}</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        {activeLang === "fil" ? "Kanselahin" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. CAPTURED SELFIE CONFIRMATION (PURE CIRCULAR PORTRAIT WITH VERIFIED / OBSTRUCTION BADGE) */}
                {!isCameraActive && capturedSelfie && (
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center animate-in fade-in duration-150 transition-colors">
                    {/* Pure Circular Image Container */}
                    <div
                      className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 ${
                        faceObstructionError
                          ? "border-rose-500 shadow-rose-500/20"
                          : "border-emerald-500 shadow-emerald-500/20"
                      } bg-neutral-950 flex items-center justify-center mb-2.5 shadow-lg`}
                    >
                      <img src={capturedSelfie} alt="Selfie Verification" className="w-full h-full object-cover rounded-full" />
                      <div
                        className={`absolute bottom-1 right-1 w-7 h-7 rounded-full ${
                          faceObstructionError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                        } flex items-center justify-center shadow-md border-2 border-white dark:border-[#161a23]`}
                      >
                        {faceObstructionError ? (
                          <AlertTriangleIcon className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <CheckIcon className="w-4 h-4 stroke-[3]" />
                        )}
                      </div>
                    </div>

                    {faceObstructionError ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-1.5">
                        <AlertTriangleIcon className="w-3.5 h-3.5" />
                        <span>
                          {activeLang === "fil" ? "May Sagabal sa Mukha (Di Pa Na-verify)" : "Face Obstructed (Not Verified)"}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-1.5">
                        <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{t.identityPhotoVerified}</span>
                      </div>
                    )}

                    {/* Specific Obstruction Warning Box */}
                    {faceObstructionError && (
                      <div className="w-full p-3 my-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2 text-left">
                        <AlertTriangleIcon className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {activeLang === "fil" ? "May Sagabal sa Mukha:" : "Facial Obstruction:"}
                          </p>
                          <p className="text-[11.5px] mt-0.5">{faceObstructionError}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                            {activeLang === "fil"
                              ? "Hindi maaaring magpatuloy sa registration hangga't may sumbrero, salamin, o mask."
                              : "Registration is blocked until hats, sunglasses, eyeglasses, or masks are removed."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Python Neural Vision Feedback */}
                    {isFaceChecking ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mb-2">
                        <RefreshCwIcon className="w-3 h-3 animate-spin" />
                        <span>{activeLang === "fil" ? "Sinusuri sa Neural Face Model..." : "Verifying with Neural Vision..."}</span>
                      </p>
                    ) : faceCheckFeedback && !faceObstructionError ? (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mb-2">
                        {faceCheckFeedback}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedSelfie(null);
                          setFaceCheckFeedback("");
                          setFaceObstructionError("");
                          startCamera();
                        }}
                        className="h-8.5 px-3.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCwIcon className="w-3 h-3" />
                        <span>{t.retakePhotoButton}</span>
                      </button>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Navigation */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSignupStep(2);
                  }}
                  className="h-11 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>{t.backButton}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(faceObstructionError) || isFaceChecking}
                  onClick={() => {
                    if (!capturedSelfie) {
                      setErrorMessage(t.errFacePhoto);
                      return;
                    }
                    if (faceObstructionError) {
                      setErrorMessage(faceObstructionError);
                      return;
                    }
                    setErrorMessage("");
                    stopCamera();
                    setSignupStep(4);
                  }}
                  className={`h-11 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                    faceObstructionError || isFaceChecking
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 cursor-pointer"
                  }`}
                >
                  <span>{t.continueToProject}</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STEP 4: Project Profile, Lot Ownership & Verification
              ----------------------------------------------------------------- */}
          {signupStep === 4 && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="space-y-3 max-h-[min(55vh,400px)] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Project Type & Scope */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    {t.projectTypeLabel}
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  >
                    <option value="2-Storey Modern Villa">{t.projectTypes.twoStorey}</option>
                    <option value="Single-Storey Bungalow">{t.projectTypes.bungalow}</option>
                    <option value="3-Storey Luxury Estate">{t.projectTypes.threeStorey}</option>
                    <option value="Commercial Building">{t.projectTypes.commercial}</option>
                    <option value="Major Renovation">{t.projectTypes.renovation}</option>
                  </select>
                </div>

                {/* 2. Lot Ownership Status */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    {t.lotOwnershipLabel}
                  </label>
                  <select
                    value={lotOwnershipStatus}
                    onChange={(e) => setLotOwnershipStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  >
                    <option value="Titled under my name">{t.lotOwnershipOptions.titled}</option>
                    <option value="Under Family / Parents">{t.lotOwnershipOptions.family}</option>
                    <option value="Currently being purchased / in-process">{t.lotOwnershipOptions.purchasing}</option>
                    <option value="No lot yet">{t.lotOwnershipOptions.noLot}</option>
                  </select>
                </div>

                {/* 3. Target Construction Lot Location (Philippines - Cascading PSGC) */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {activeLang === "fil" ? "Lokasyon sa Pilipinas" : "Philippine Build Location"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    🇵🇭 {activeLang === "fil" ? "Eksklusibo sa Pilipinas" : "Philippines Coverage Only"}
                  </span>
                </div>
                {clientType === "OFW" && (
                  <div className="mb-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <span>
                      {activeLang === "fil"
                        ? "Paalala para sa mga OFW: Kahit kayo ay nasa abroad, ang lot o pagtatayuan ng proyekto ay dapat nasa loob ng Pilipinas."
                        : "Notice for Overseas Clients: While you reside abroad, your target construction lot must be located within the Philippines."}
                    </span>
                  </div>
                )}
                <PhAddressCascadeSection
                  province={buildProvince}
                  provinceCode={buildProvinceCode}
                  onProvinceChange={(p) => {
                    setBuildProvince(p.name);
                    setBuildProvinceCode(p.code);
                  }}
                  city={buildCity}
                  cityCode={buildCityCode}
                  onCityChange={(c) => {
                    setBuildCity(c.name);
                    setBuildCityCode(c.code);
                  }}
                  barangay={buildBarangay}
                  barangayCode={buildBarangayCode}
                  onBarangayChange={(b) => {
                    setBuildBarangay(b.name);
                    setBuildBarangayCode(b.code);
                  }}
                  subdivision={lotSubdivision}
                  onSubdivisionChange={setLotSubdivision}
                  street={lotPhaseStreet}
                  onStreetChange={setLotPhaseStreet}
                  houseNo=""
                  onHouseNoChange={() => {}}
                  blkLot={lotBlkLot}
                  onBlkLotChange={setLotBlkLot}
                  attempted={attemptedStep4}
                  t={t}
                  activeLang={activeLang}
                  title={activeLang === "fil" ? "Lokasyon ng Proyekto / Lote (Pilipinas)" : "Target Construction Lot Location (Philippines)"}
                  isBuildSite={true}
                  idPrefix="field-build"
                  onClearErrors={() => {
                    if (errorMessage) setErrorMessage("");
                  }}
                />

                {/* Refined Client Summary Review Card */}
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-1 border-b border-neutral-200 dark:border-neutral-800">
                    {t.summaryTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[11px]">{t.summaryClientName}</span>
                      <span className="font-semibold text-neutral-900 dark:text-white break-words">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[11px]">{t.summaryContactNumber}</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{countryCode} {phoneNumber}</span>
                    </div>
                    {clientType === "OFW" && (
                      <>
                        <div>
                          <span className="text-neutral-400 block text-[11px]">{t.summaryResidency}</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">OFW · {ofwCountry.split("(")[0].trim()}</span>
                        </div>
                        {phRepName && (
                          <div>
                            <span className="text-neutral-400 block text-[11px]">{t.summaryRepresentative}</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">{phRepName}</span>
                          </div>
                        )}
                      </>
                    )}
                    {occupation && (
                      <div>
                        <span className="text-neutral-400 block text-[11px]">{t.summaryProfession}</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{occupation}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-400 block text-[11px]">{t.summaryLotOwnership}</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{lotOwnershipStatus.split("(")[0].trim()}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[11px]">{t.summaryIdentityStatus}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{t.summaryPhotoVerified}</span>
                      </span>
                    </div>
                    {locationAddress && (
                      <div className="col-span-2 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 truncate mr-2">
                          {activeLang === "fil" ? "Kasalukuyang Tirahan" : "Residential Address"}
                        </span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]" title={locationAddress}>
                          {locationAddress}
                        </span>
                      </div>
                    )}
                    {targetLocation && (
                      <div className="col-span-2 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between">
                        <span className="text-neutral-400 text-[11px] flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3 text-amber-500" />
                          <span>{t.targetLocationLabel}</span>
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">
                          {targetLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal & Data Privacy Agreement Framework */}
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {t.legalSectionTitle}
                      </span>
                    </div>
                    {hasAcceptedTerms && hasAcceptedPrivacy ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-3 h-3 stroke-[2.5]" />
                        <span>{t.statusAccepted}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold">
                        {t.statusSignatureRequired}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {t.legalSectionSummary}
                  </p>

                  <button
                    id="field-legalSection"
                    type="button"
                    onClick={() => setIsLegalModalOpen(true)}
                    className={`w-full h-10 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      hasAcceptedTerms && hasAcceptedPrivacy
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-750 border border-neutral-300 dark:border-neutral-700"
                        : attemptedStep4
                        ? "bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500/20"
                        : "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    <FileTextIcon className="w-4 h-4" />
                    <span>
                      {hasAcceptedTerms && hasAcceptedPrivacy
                        ? t.btnReviewSignedTerms
                        : t.btnOpenLegalAgreement}
                    </span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>

                  {/* Direct links to full official legal pages */}
                  <div className="flex items-center justify-between pt-1 px-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="text-[10.5px]">
                      {t.officialLegalPages || "Official legal pages:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{t.termsOfService}</span>
                        <ExternalLinkIcon className="w-3 h-3 opacity-75" />
                      </Link>
                      <span className="opacity-40">·</span>
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{t.privacyPolicy}</span>
                        <ExternalLinkIcon className="w-3 h-3 opacity-75" />
                      </Link>
                    </div>
                  </div>

                  {/* Status Checklist */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                          hasAcceptedTerms
                            ? "bg-emerald-500 text-white"
                            : attemptedStep4
                            ? "border-2 border-red-500 bg-red-500/10 ring-2 ring-red-500/20"
                            : "border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      >
                        {hasAcceptedTerms && <CheckIcon className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                      <span className={hasAcceptedTerms ? "text-neutral-900 dark:text-white font-medium" : attemptedStep4 ? "text-red-500 font-medium" : "text-neutral-400"}>
                        {t.termCheckbox1Title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                          hasAcceptedPrivacy
                            ? "bg-emerald-500 text-white"
                            : attemptedStep4
                            ? "border-2 border-red-500 bg-red-500/10 ring-2 ring-red-500/20"
                            : "border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      >
                        {hasAcceptedPrivacy && <CheckIcon className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                      <span className={hasAcceptedPrivacy ? "text-neutral-900 dark:text-white font-medium" : attemptedStep4 ? "text-red-500 font-medium" : "text-neutral-400"}>
                        {t.termCheckbox2Title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSignupStep(3)}
                  className="h-11 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>{t.backButton}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-neutral-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>{t.creatingAccountButton}</span>
                    </>
                  ) : (
                    <span>{t.completeSignUpButton}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TOGGLE BACK TO LOGIN */}
          <div className="mt-4 text-center text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            <span>{t.haveAccountPrompt} </span>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                stopCamera();
                setAuthMode("login");
              }}
              className="font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 underline underline-offset-2 ml-1 cursor-pointer"
            >
              {t.logInButton}
            </button>
          </div>

          {/* LEGAL FOOTER */}
          <div className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              {t.termsOfService}
            </Link>
            <span className="mx-2 opacity-50">·</span>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline underline-offset-2 transition-colors cursor-pointer font-medium"
            >
              {t.privacyPolicy}
            </Link>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* LEGAL TERMS & DATA PRIVACY AGREEMENT MODAL OVERLAY ("NAKA-PATONG SA PAGE") */}
      {/* ========================================================================= */}
      {isLegalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-[#11141e] rounded-[22px] border border-neutral-200 dark:border-white/15 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50/70 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[11px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-4.5 h-4.5 text-amber-500 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
                    {t.legalModalTitle}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                    {t.legalModalSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 mr-1">
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Open full Terms of Service in a new tab"
                  >
                    <span>{t.termsOfService}</span>
                    <ExternalLinkIcon className="w-3 h-3 opacity-70" />
                  </Link>
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Open full Privacy Policy in a new tab"
                  >
                    <span>{t.privacyPolicy}</span>
                    <ExternalLinkIcon className="w-3 h-3 opacity-70" />
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLegalModalOpen(false)}
                  className="w-8 h-8 rounded-[9px] hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reading Progress Indicator */}
            <div className="h-1 bg-neutral-100 dark:bg-white/5 w-full shrink-0 relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Scrollable Terms Content */}
            <div
              ref={legalScrollRef}
              onScroll={handleLegalScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 space-y-4 scrollbar-thin select-none"
            >
              {/* Notice Banner */}
              <div className="p-3 rounded-[12px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-neutral-800 dark:text-neutral-200">
                <FileTextIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug">
                  {t.legalScrollInstruction}
                </p>
              </div>

              {/* SECTION 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-white/10 gap-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider">
                    SECTION 1: STATUTORY COMPLIANCE & PERSONAL INFORMATION CONTROLLER (PIC)
                  </h4>
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{t.privacyPolicy}</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </Link>
                </div>
                <p>
                  <strong>1.1 Statutory Authority & Compliance:</strong> In strict adherence to the <em>Data Privacy Act of 2012 (Republic Act No. 10173)</em>, its Implementing Rules and Regulations (IRR), and applicable National Privacy Commission (NPC) Circulars, MCPA Construction and Supply acts as a registered Personal Information Controller (PIC) committed to protecting the fundamental constitutional right to privacy and safeguarding all client records.
                </p>
                <p>
                  <strong>1.2 Privacy Core Principles:</strong> All processing operations adhere strictly to the foundational tenets of Transparency (clear and prior notice of all data collection), Legitimate Purpose (data is utilized exclusively for authenticated architectural, engineering, and project delivery workflows), and Proportionality (data collection is strictly adequate, relevant, and not excessive).
                </p>
              </div>

              {/* SECTION 2 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-white/10">
                  SECTION 2: NATURE, CATEGORIES & SCOPE OF COLLECTED DATA
                </h4>
                <p>
                  <strong>2.1 Personal Identity & Contact Telemetry:</strong> Full legal name (first, middle, last, and suffix), civil status, spouse/co-borrower identification, birthdate, verified legal age eligibility (strictly 18 years and above), active Philippine mobile number, international contact details, and electronic mail address.
                </p>
                <p>
                  <strong>2.2 Overseas Client (OFW) Demographics:</strong> Host country of employment, overseas residency coordinates, and the designated legal name and verified contact number of authorized representatives situated in the Philippines.
                </p>
                <p>
                  <strong>2.3 Biometric Facial KYC Image Capture:</strong> Live camera facial snapshots and liveness detection telemetry gathered solely during onboarding to authenticate identity, prevent bot-driven spoofing or identity theft, and validate client consent.
                </p>
                <p>
                  <strong>2.4 Real Property, Cadastral & Lot Custody Records:</strong> Declared target construction location (province, city/municipality), subdivision or village identifiers, block and lot designations, transfer certificates of title (TCT / CCT), and cadastral survey markers.
                </p>
                <p>
                  <strong>2.5 Professional & Financing Profile:</strong> Occupation, employer / business name, monthly household income bracket, and chosen financing path (e.g., Pag-IBIG HDMF Housing Loan, Commercial Bank Financing, or Milestone In-House).
                </p>
              </div>

              {/* SECTION 3 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-white/10">
                  SECTION 3: EXCLUSIVE PURPOSES OF PROCESSING & REGULATORY FILINGS
                </h4>
                <p>
                  <strong>3.1 Client Authentication & Security:</strong> Generating encrypted portal authentication credentials, protecting blueprint access, and preventing unauthorized account takeover.
                </p>
                <p>
                  <strong>3.2 Architectural Feasibility & Municipal Permitting:</strong> Verifying local zoning setback requirements, structural engineering codes, and filing mandatory municipal building, electrical, sanitary, and fire safety (FSEC) permits with local government units (LGUs).
                </p>
                <p>
                  <strong>3.3 Housing Loan Pre-Evaluation & Coordination:</strong> Preparing and endorsing client-consented financial documentation to accredited Pag-IBIG Fund (HDMF) or commercial bank housing loan underwriters upon client instruction.
                </p>
                <p>
                  <strong>3.4 Transparent Site Governance:</strong> Transmitting authenticated milestone progress updates, timestamped inspection photos, and direct architectural consultations between the client and project engineers.
                </p>
              </div>

              {/* SECTION 4 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-white/10">
                  SECTION 4: DATA SECURITY, ENCRYPTION & CUSTODY STANDARDS (AES-256)
                </h4>
                <p>
                  <strong>4.1 Military-Grade Cloud Encryption:</strong> All personal records, uploaded property documents, and biometric images are encrypted using TLS 1.3 in transit and AES-256 bit encryption at rest within ISO-certified data centers.
                </p>
                <p>
                  <strong>4.2 Role-Based Access Control (RBAC):</strong> Administrative access is strictly limited to authorized project architects, structural engineers, and compliance officers bound by binding Non-Disclosure Agreements (NDAs).
                </p>
                <p>
                  <strong>4.3 Strict Non-Disclosure & Anti-Commercialization:</strong> MCPA maintains an absolute zero-monetization policy: client data is never sold, traded, rented, or shared with third-party advertising or commercial lead agencies.
                </p>
              </div>

              {/* SECTION 5 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-white/10">
                  SECTION 5: DATA RETENTION, ARCHIVAL & DISPOSAL PROTOCOLS
                </h4>
                <p>
                  <strong>5.1 Active Project Lifecycle:</strong> Personal data is maintained active only during active design planning, construction milestones, and client portal operations.
                </p>
                <p>
                  <strong>5.2 Statutory Archival:</strong> Records associated with issued building permits and official tax receipts are archived in conformity with BIR and statutory recordkeeping mandates (10 years).
                </p>
                <p>
                  <strong>5.3 Secure Destruction:</strong> Digital files scheduled for deletion undergo cryptographic erasure, and physical paperwork is shredded in compliance with NPC disposal guidelines.
                </p>
              </div>

              {/* SECTION 6 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-white/10">
                  SECTION 6: EXERCISE OF DATA SUBJECT RIGHTS (SECTION 16, R.A. 10173)
                </h4>
                <p>
                  <strong>6.1 Rights of the Client:</strong> Under Section 16 of R.A. 10173, the client possesses the: (a) <em>Right to be Informed</em>; (b) <em>Right to Access</em> personal records; (c) <em>Right to Rectify</em> inaccurate or outdated profile entries; (d) <em>Right to Object or Erasure</em>, subject to statutory constraints; and (e) <em>Right to File Complaints</em> with the National Privacy Commission.
                </p>
                <p>
                  <strong>6.2 Data Protection Officer Contact:</strong> To exercise your privacy rights or submit inquiries, clients may reach our designated Data Protection Officer (DPO) at <strong>privacy@mcpaconstruction.com</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckIcon className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>{t.legalScrolledSuccess}</span>
              </div>
            </div>

            {/* Modal Sticky Footer with Checkboxes and Actions */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-50/90 dark:bg-neutral-900/90 shrink-0 space-y-3">
              {/* Scroll down prompt if not yet scrolled */}
              {!hasScrolledToBottom ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <ChevronDownIcon className="w-4 h-4 animate-bounce" />
                    <span>{t.legalScrollPrompt} ({scrollProgress}%)</span>
                  </span>
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="text-xs font-bold underline cursor-pointer hover:text-amber-600 flex items-center gap-1"
                  >
                    <span>{t.legalScrollToEnd}</span>
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Checkboxes when unlocked */
                <div className="space-y-2">
                  {/* Checkbox 1 */}
                  <label
                    className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-white dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={hasAcceptedTerms}
                      onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white block">
                        {t.termCheckbox1Title}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                        {t.legalTerm1Desc}
                      </span>
                    </div>
                  </label>

                  {/* Checkbox 2 */}
                  <label
                    className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-white dark:bg-[#161a23] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={hasAcceptedPrivacy}
                      onChange={(e) => setHasAcceptedPrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white block">
                        {t.termCheckbox2Title}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                        {t.legalTerm2Desc}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-neutral-200/50 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="hidden sm:inline">{t.viewFullOfficialDoc || "View full documents:"}</span>
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{t.termsOfService}</span>
                    <ExternalLinkIcon className="w-2.5 h-2.5 opacity-70" />
                  </Link>
                  <span>·</span>
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{t.privacyPolicy}</span>
                    <ExternalLinkIcon className="w-2.5 h-2.5 opacity-70" />
                  </Link>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLegalModalOpen(false)}
                    className="px-4 py-2 rounded-[9px] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {t.modalClose}
                  </button>

                  <button
                    type="button"
                    disabled={!hasScrolledToBottom || !hasAcceptedTerms || !hasAcceptedPrivacy}
                    onClick={() => {
                      setIsLegalModalOpen(false);
                    }}
                    className="px-5 py-2 rounded-[9px] bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.modalAcceptAndAgree}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HUMAN VERIFICATION PUZZLE SLIDER CAPTCHA MODAL ("LIKE PUZZLE NA RECAPTCHA") */}
      {/* ========================================================================= */}
      <PuzzleCaptchaModal
        isOpen={isPuzzleModalOpen}
        onClose={() => setIsPuzzleModalOpen(false)}
        onSuccess={handlePuzzleSuccess}
        lang={activeLang}
      />

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (CLIENT & HOMEOWNER ACCOUNT RECOVERY) */}
      {/* ========================================================================= */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={loginEmail}
        onSuccessReturn={(verifiedEmail) => {
          setLoginEmail(verifiedEmail);
          setLoginPassword("");
          setErrorMessage("");
        }}
      />
      {/* ========================================================================= */}
      {/* GOOGLE MEDIAPIPE BIOMETRIC LIVENESS MODAL (CIRCULAR VISION WITH ARROWS) */}
      {/* ========================================================================= */}
      <MediaPipeLivenessModal
        isOpen={isLivenessModalOpen}
        onClose={() => setIsLivenessModalOpen(false)}
        activeLang={activeLang}
        purpose={livenessPurpose}
        onVerified={async (verifiedImage) => {
          setIsLivenessModalOpen(false);

          if (livenessPurpose === "login") {
            setIsSubmitting(true);
            setSubmissionProgressText(
              activeLang === "fil"
                ? "Sinusuri ang Biometric Face Login..."
                : "Authenticating Biometric Face Login..."
            );
            try {
              const res = await fetch("/api/auth/face-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: loginEmail.trim(),
                  faceImage: verifiedImage,
                  livenessVerified: true,
                  portalType: "client",
                }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                if (onLoginSuccess) onLoginSuccess(data.user, data.token);
                return;
              }
              setErrorMessage(
                data.message ||
                  (activeLang === "fil"
                    ? "Nabigo ang Face Verification login."
                    : "Face recognition login failed.")
              );
            } catch (err) {
              setErrorMessage(t.errNetwork);
            } finally {
              setIsSubmitting(false);
              setSubmissionProgressText("");
            }
          } else {
            // KYC Mode in Sign up Step 3
            setCapturedSelfie(verifiedImage);
            setIsLivenessVerified(true);
            setFaceObstructionError("");
            setErrorMessage("");
            setFaceCheckFeedback(
              activeLang === "fil"
                ? "Na-verify ng Neural Vision: Maayos ang talas, liwanag, at walang sagabal sa mukha."
                : "Neural Vision: Clear face focus, optimal lighting, and zero obstructions verified."
            );
          }
        }}
      />
    </>
  );
}
