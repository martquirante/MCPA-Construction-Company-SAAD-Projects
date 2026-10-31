"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Building,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Check,
  Calendar,
  Heart,
  Briefcase,
  Layers,
  Globe2,
  Sparkles,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Co-owner",
  "Widowed",
  "Separated",
];

const LOT_OWNERSHIP_OPTIONS = [
  "Titled under my name",
  "Under Family / Parents",
  "Currently being purchased / in-process",
  "No lot yet",
];

const PROJECT_TYPE_OPTIONS = [
  "2-Storey Modern Villa",
  "Single-Storey Bungalow",
  "3-Storey Luxury Estate",
  "Commercial Building",
  "Major Renovation",
  "Custom Residential Architectural Build",
];

const CONTACT_TIME_OPTIONS = [
  "Anytime (PH Daytime 08:00 - 17:00 PHT)",
  "Morning (08:00 - 12:00 PHT)",
  "Afternoon (13:00 - 17:00 PHT)",
  "Evening (18:00 - 21:00 PHT)",
  "Weekends Only",
];

const MONTHLY_INCOME_OPTIONS = [
  "Below ₱100,000",
  "₱100,000 - ₱200,000",
  "₱200,000 - ₱400,000",
  "₱400,000 - ₱800,000",
  "Above ₱800,000 (HNW / Executive)",
  "Confidential (Enrolled in Project Financing)",
];

export default function ClientProfileEditModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  initialTab = "personal",
  language = "en",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasViberWhatsapp, setHasViberWhatsapp] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [civilStatus, setCivilStatus] = useState("Single");
  const [spouseName, setSpouseName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [preferredContactTime, setPreferredContactTime] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [targetProjectType, setTargetProjectType] = useState("");
  const [lotOwnershipStatus, setLotOwnershipStatus] = useState("");
  const [subdivisionLotDetails, setSubdivisionLotDetails] = useState("");
  const [targetBuildLocation, setTargetBuildLocation] = useState("");

  // OFW specific fields
  const [ofwCountry, setOfwCountry] = useState("");
  const [phRepName, setPhRepName] = useState("");
  const [phRepRelationship, setPhRepRelationship] = useState("");
  const [phRepPhone, setPhRepPhone] = useState("");

  // Email Change State
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailChangeStatus, setEmailChangeStatus] = useState({
    loading: false,
    success: false,
    message: "",
    error: "",
  });

  // Saving Profile State
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  const isOfw =
    currentUser?.clientType === "OFW" || currentUser?.client_type === "OFW";

  // Hydrate fields on open or user change
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || currentUser.full_name || "");
      setPhoneNumber(currentUser.phoneNumber || currentUser.phone_number || "");
      setHasViberWhatsapp(
        Boolean(currentUser.hasViberWhatsapp ?? currentUser.has_viber_whatsapp)
      );
      setBirthDate(currentUser.birthDate || currentUser.birth_date || "");
      setCivilStatus(currentUser.civilStatus || currentUser.civil_status || "Single");
      setSpouseName(currentUser.spouseName || currentUser.spouse_name || "");
      setOccupation(currentUser.occupation || "");
      setEmployerName(currentUser.employerName || currentUser.employer_name || "");
      setMonthlyIncome(currentUser.monthlyIncome || currentUser.monthly_income || "");
      setPreferredContactTime(
        currentUser.preferredContactTime ||
          currentUser.preferred_contact_time ||
          "Anytime (PH Daytime 08:00 - 17:00 PHT)"
      );
      setEmergencyContact(
        currentUser.emergencyContact || currentUser.emergency_contact || ""
      );
      setLocationAddress(
        currentUser.locationAddress || currentUser.location_address || ""
      );
      setTargetProjectType(
        currentUser.targetProjectType ||
          currentUser.target_project_type ||
          "Custom Residential Architectural Build"
      );
      setLotOwnershipStatus(
        currentUser.lotOwnershipStatus ||
          currentUser.lot_ownership_status ||
          "Titled under my name"
      );
      setSubdivisionLotDetails(
        currentUser.subdivisionLotDetails ||
          currentUser.subdivision_lot_details ||
          ""
      );
      setTargetBuildLocation(
        currentUser.targetBuildLocation ||
          currentUser.target_build_location ||
          ""
      );
      setOfwCountry(currentUser.ofwCountry || currentUser.ofw_country || "");
      setPhRepName(currentUser.phRepName || currentUser.ph_rep_name || "");
      setPhRepRelationship(
        currentUser.phRepRelationship || currentUser.ph_rep_relationship || ""
      );
      setPhRepPhone(currentUser.phRepPhone || currentUser.ph_rep_phone || "");

      setActiveTab(initialTab);
      setIsChangingEmail(false);
      setNewEmail("");
      setConfirmNewEmail("");
      setEmailChangeStatus({ loading: false, success: false, message: "", error: "" });
      setSaveMessage({ type: "", text: "" });
    }
  }, [isOpen, currentUser, initialTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSaving && !emailChangeStatus.loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, emailChangeStatus.loading, onClose]);

  if (!isOpen) return null;

  // Submit Profile Information
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (isSaving) return;

    if (!fullName.trim()) {
      setSaveMessage({ type: "error", text: "Legal Full Name cannot be left blank." });
      setActiveTab("personal");
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });

    try {
      const payload = {
        email: currentUser.email,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        hasViberWhatsapp,
        birthDate: birthDate.trim(),
        civilStatus,
        spouseName:
          civilStatus === "Married" || civilStatus === "Co-owner"
            ? spouseName.trim()
            : "",
        occupation: occupation.trim(),
        employerName: employerName.trim(),
        monthlyIncome,
        preferredContactTime,
        emergencyContact: emergencyContact.trim(),
        locationAddress: locationAddress.trim(),
        targetProjectType,
        lotOwnershipStatus,
        subdivisionLotDetails: subdivisionLotDetails.trim(),
        targetBuildLocation: targetBuildLocation.trim(),
        ofwCountry: ofwCountry.trim(),
        phRepName: phRepName.trim(),
        phRepRelationship: phRepRelationship.trim(),
        phRepPhone: phRepPhone.trim(),
      };

      const res = await authFetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveMessage({
          type: "success",
          text: language === "fil"
            ? "Matagumpay na na-update ang impormasyon sa inyong profile!"
            : "Your profile dossier has been successfully updated and saved!",
        });

        const updatedUser = {
          ...currentUser,
          ...data.user,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("mcpa_client_user", JSON.stringify(updatedUser));
        }

        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSaveMessage({
          type: "error",
          text: data.message || "Failed to update profile. Please try again.",
        });
      }
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err.message || "Network error occurred while updating profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Email Change Verification Request
  const handleRequestEmailChange = async (e) => {
    e?.preventDefault();
    const cleanNew = newEmail.trim().toLowerCase();
    const cleanConfirm = confirmNewEmail.trim().toLowerCase();

    if (!cleanNew) {
      setEmailChangeStatus({
        loading: false,
        success: false,
        message: "",
        error: "Please enter your new email address.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNew)) {
      setEmailChangeStatus({
        loading: false,
        success: false,
        message: "",
        error: "Please enter a valid email format (e.g., name@example.com).",
      });
      return;
    }

    if (cleanNew === (currentUser?.email || "").toLowerCase()) {
      setEmailChangeStatus({
        loading: false,
        success: false,
        message: "",
        error: "The new email cannot be the same as your current registered email.",
      });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setEmailChangeStatus({
        loading: false,
        success: false,
        message: "",
        error: "Confirmation email does not match. Please verify both fields.",
      });
      return;
    }

    setEmailChangeStatus({ loading: true, success: false, message: "", error: "" });

    try {
      const res = await authFetch("/api/client/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: currentUser?.email,
          newEmail: cleanNew,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEmailChangeStatus({
          loading: false,
          success: true,
          message: data.message || `Verification link sent to ${cleanNew}. Please check your inbox.`,
          error: "",
        });
      } else {
        setEmailChangeStatus({
          loading: false,
          success: false,
          message: "",
          error: data.message || "Unable to send email verification link.",
        });
      }
    } catch (err) {
      setEmailChangeStatus({
        loading: false,
        success: false,
        message: "",
        error: err.message || "Network error while requesting email change.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-md transition-opacity"
        onClick={() => !isSaving && onClose()}
      />

      {/* Main Dialog Container */}
      <div className="relative w-full max-w-3xl my-auto rounded-[24px] bg-white dark:bg-[#11141c] border border-neutral-200/90 dark:border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-10 transition-colors animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle Architectural Grid Background on Header */}
        <div className="relative border-b border-neutral-100 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02] px-6 py-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold tracking-wider uppercase border border-amber-500/20">
                <Sparkles className="w-3 h-3" />
                MCPA Client Dossier
              </span>
              <span className="text-neutral-400 text-xs">•</span>
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Profile ID: #{currentUser?.userId || currentUser?.user_id || "CL-01"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Edit Client Profile &amp; Preferences
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage your civil information, contact channels, and architectural project baseline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-100 dark:border-white/5 bg-white dark:bg-[#11141c]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "personal"
                  ? "bg-amber-500 text-white shadow-xs shadow-amber-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal &amp; Career</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "contact"
                  ? "bg-amber-500 text-white shadow-xs shadow-amber-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact &amp; Address</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("project")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "project"
                  ? "bg-amber-500 text-white shadow-xs shadow-amber-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Project &amp; Lot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "security"
                  ? "bg-amber-500 text-white shadow-xs shadow-amber-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Account Email</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 max-h-[62vh] overflow-y-auto">
          {/* TAB 1: PERSONAL & DEMOGRAPHIC PROFILE */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Full Legal Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Engr. Raymart Quirante"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Must match government-issued identification for legal project documentation.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Civil Status
                  </label>
                  <select
                    value={civilStatus}
                    onChange={(e) => setCivilStatus(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    {CIVIL_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {(civilStatus === "Married" || civilStatus === "Co-owner") && (
                  <div className="sm:col-span-2 space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                      Spouse / Co-Owner Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      placeholder="e.g., Maria Clara Santos-Quirante"
                      className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Occupation / Profession
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g., Chief Architect / Senior Executive"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Employer / Company
                  </label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="e.g., MCPA Engineering Group"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Monthly Income Classification
                  </label>
                  <select
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    <option value="">-- Select Income Range (Confidential) --</option>
                    {MONTHLY_INCOME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & RESIDENCE */}
          {activeTab === "contact" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Emergency Contact Number / Liaison
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g., 0918 765 4321 (Brother / Representative)"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 cursor-pointer transition-colors hover:border-amber-500/40">
                    <input
                      type="checkbox"
                      checked={hasViberWhatsapp}
                      onChange={(e) => setHasViberWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#11141c]"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-neutral-900 dark:text-white block">
                        I can be reached on this mobile number via Viber or WhatsApp
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                        Allows our architectural consultants to share instantaneous photo updates and milestone alerts.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Preferred Consultation Window
                  </label>
                  <select
                    value={preferredContactTime}
                    onChange={(e) => setPreferredContactTime(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    {CONTACT_TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Permanent Residential Address
                  </label>
                  <textarea
                    rows={2}
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Unit / House No., Street, Barangay, City / Municipality, Province, Zip Code"
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT & LOT PARAMETERS */}
          {activeTab === "project" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Target Architectural Project Type
                  </label>
                  <select
                    value={targetProjectType}
                    onChange={(e) => setTargetProjectType(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    {PROJECT_TYPE_OPTIONS.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Lot Title &amp; Ownership Status
                  </label>
                  <select
                    value={lotOwnershipStatus}
                    onChange={(e) => setLotOwnershipStatus(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    {LOT_OWNERSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Subdivision &amp; Lot / Block Details
                  </label>
                  <input
                    type="text"
                    value={subdivisionLotDetails}
                    onChange={(e) => setSubdivisionLotDetails(e.target.value)}
                    placeholder="e.g., Lot 14 Block 2, Phase 3"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Target Philippine Construction Location
                  </label>
                  <input
                    type="text"
                    value={targetBuildLocation}
                    onChange={(e) => setTargetBuildLocation(e.target.value)}
                    placeholder="e.g., Plaridel, Bulacan / Alabang, Muntinlupa"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* OFW Section if applicable */}
                {isOfw && (
                  <div className="sm:col-span-2 space-y-4 pt-3 border-t border-neutral-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Overseas Filipino Worker (OFW) Profile
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                          Current Country of Deployment
                        </label>
                        <input
                          type="text"
                          value={ofwCountry}
                          onChange={(e) => setOfwCountry(e.target.value)}
                          placeholder="e.g., Singapore / United Arab Emirates"
                          className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                          Philippine Representative Full Name
                        </label>
                        <input
                          type="text"
                          value={phRepName}
                          onChange={(e) => setPhRepName(e.target.value)}
                          placeholder="e.g., Juan Santos"
                          className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                          Representative Relationship
                        </label>
                        <input
                          type="text"
                          value={phRepRelationship}
                          onChange={(e) => setPhRepRelationship(e.target.value)}
                          placeholder="e.g., Sister / Attorney-in-Fact"
                          className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                          Representative Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phRepPhone}
                          onChange={(e) => setPhRepPhone(e.target.value)}
                          placeholder="0919 888 7766"
                          className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a24] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT EMAIL & SECURITY (WITH AUTHENTICATION FLOW) */}
          {activeTab === "security" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Primary Email Banner Card */}
              <div className="rounded-[18px] bg-neutral-50 dark:bg-[#151923] border border-neutral-200 dark:border-white/10 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Primary Client Identifier
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Account
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Registered Email Address
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-200/60 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] font-semibold border border-neutral-300 dark:border-white/10">
                    <Lock className="w-3 h-3 text-amber-500" />
                    Locked for Security
                  </span>
                </div>

                {/* Current Email Display Box */}
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#10131b] border border-neutral-200 dark:border-white/10">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {currentUser?.email}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    To maintain strict chain-of-custody for structural blueprints, milestone certificates, and financial invoicing, your registered email cannot be edited directly without cryptographic authentication.
                  </p>
                </div>

                {!isChangingEmail && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingEmail(true);
                        setEmailChangeStatus({ loading: false, success: false, message: "", error: "" });
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-mono font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs shadow-amber-500/20"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Request Email Address Change</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Email Change Flow Drawer */}
              {isChangingEmail && (
                <div className="rounded-[18px] bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/30 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Email Change Verification Flow
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsChangingEmail(false)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs font-mono"
                    >
                      Cancel
                    </button>
                  </div>

                  {emailChangeStatus.success ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Authentication Link Successfully Dispatched!</span>
                      </div>
                      <p className="text-xs font-mono leading-relaxed">
                        We sent a secure confirmation link to <span className="underline font-bold text-white">{newEmail}</span>.
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Please open your new email and click the confirmation link within <strong>15 minutes</strong>. Your account will automatically transition to your new email upon clicking the link.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestEmailChange} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="your-new-email@example.com"
                          required
                          className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-[#121620] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block">
                          Confirm New Email Address
                        </label>
                        <input
                          type="email"
                          value={confirmNewEmail}
                          onChange={(e) => setConfirmNewEmail(e.target.value)}
                          placeholder="Re-enter your new email address"
                          required
                          className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-[#121620] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      {emailChangeStatus.error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{emailChangeStatus.error}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono text-neutral-400">
                          Expires in 15 minutes after dispatch
                        </span>

                        <button
                          type="submit"
                          disabled={emailChangeStatus.loading}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-mono font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {emailChangeStatus.loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching Link...</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Send Verification Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="min-w-0">
            {saveMessage.text && (
              <div
                className={`text-xs font-mono flex items-center gap-1.5 truncate ${
                  saveMessage.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{saveMessage.text}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-mono font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Dossier...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Profile Information</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

