"use client";

import { useState } from "react";
import LotMapPicker from "./LotMapPicker";
import SmartCaptchaSlider from "./SmartCaptchaSlider";
import {
  CloseIcon,
  CheckIcon,
  RefreshCwIcon,
  HomeIcon,
  BuildingIcon,
  WarehouseIcon,
  HammerIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@/modules/shared/Icons";

const PROJECT_TYPES = [
  { val: "Residential Design & Build", label: "Residential Villa / Two-Storey", desc: "Single-detached, 2-storey modern house, bungalow", icon: HomeIcon },
  { val: "Commercial & Mixed-Use", label: "Commercial / Apartment Rental", desc: "Rental units, commercial retail, cafe/restaurant", icon: BuildingIcon },
  { val: "Industrial & Structural", label: "Industrial Warehouse", desc: "Steel fabrication, storage warehouse, commissary", icon: WarehouseIcon },
  { val: "House Renovation & Extension", label: "Renovation & Fit-out", desc: "Structural expansion, second-floor addition, remodeling", icon: HammerIcon },
];

const ARCH_STYLES = [
  "Contemporary Modern",
  "Minimalist Japanese Zen",
  "Tropical Modern",
  "Industrial Scandinavian",
  "Classic Mediterranean",
];

const BUDGET_OPTIONS = [
  { val: "₱2.5M - ₱4.0M", desc: "Starter / Compact Residence" },
  { val: "₱4.0M - ₱7.0M", desc: "Standard 2-Storey Mid-End" },
  { val: "₱7.0M - ₱12.0M+", desc: "Executive / High-End Luxury" },
  { val: "Flexible / To Be Estimated", desc: "Subject to architectural costing" },
];

export default function PortalInquiryModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [projectType, setProjectType] = useState("Residential Design & Build");
  const [preferredStyle, setPreferredStyle] = useState("Contemporary Modern");
  const [lotStatus, setLotStatus] = useState("Titled & Ready (TCT)");
  const [lotArea, setLotArea] = useState("240");
  const [locationAddress, setLocationAddress] = useState(currentUser?.locationAddress || "Plaridel, Bulacan");
  const [mapCoordinates, setMapCoordinates] = useState("14.8871, 120.8572");
  const [budgetRange, setBudgetRange] = useState("₱4.0M - ₱7.0M");
  const [targetDate, setTargetDate] = useState("Within 3 Months");

  // Meeting options
  const [wantsMeeting, setWantsMeeting] = useState(true);
  const [meetingMode, setMeetingMode] = useState("Face-to-Face"); // "Online" | "Face-to-Face"
  const [venueType, setVenueType] = useState("Coffee Shop"); // "Office" | "Coffee Shop" | "On-Site" | "Custom"
  const [venueDetails, setVenueDetails] = useState("Starbucks Malolos, MacArthur Highway");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("02:00 PM - 03:30 PM PHT");

  // Captcha & Submission
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!isCaptchaVerified) {
      setSubmitError("Please slide the security verification bar before submitting.");
      return;
    }

    const foreignKeywords = [
      "dubai", "uae", "abu dhabi", "canada", "united states", "usa",
      "singapore", "australia", "saudi", "riyadh", "jeddah", "qatar",
      "kuwait", "japan", "tokyo", "uk", "london", "italy", "taiwan",
      "hong kong", "germany", "new zealand"
    ];
    const locLower = (locationAddress || "").toLowerCase();
    const isForeignOnly = foreignKeywords.some((k) => locLower.includes(k)) &&
      !locLower.includes("philippines") &&
      !locLower.includes("pilipinas") &&
      !locLower.includes("bulacan") &&
      !locLower.includes("pampanga") &&
      !locLower.includes("manila") &&
      !locLower.includes("luzon");

    if (isForeignOnly) {
      setSubmitError("Paalala: Sa Pilipinas lamang po nagpapatayo ng proyekto ang MCPA (Bulacan, Pampanga, Metro Manila, atbp.). Pakilagay po ang inyong lote sa Pilipinas.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      clientName: currentUser?.fullName || "Valued Client",
      clientEmail: currentUser?.email,
      clientPhone: currentUser?.phoneNumber || "",
      projectType,
      preferredStyle,
      budgetRange,
      lotStatus,
      lotArea: lotArea ? `${lotArea} sqm` : "Not specified",
      targetDate,
      location: locationAddress,
      mapCoordinates,
      locationType: currentUser?.clientType || "Local",
      userId: currentUser?.userId,
      wantsMeeting,
      meetingMode: wantsMeeting ? (meetingMode === "Online" ? "Online Meeting (Google Meet)" : `In-Person (${venueType})`) : "No Preliminary Meeting",
      venueType: wantsMeeting && meetingMode === "Face-to-Face" ? venueType : null,
      venueDetails: wantsMeeting && meetingMode === "Face-to-Face" ? venueDetails : null,
      meetingDate: wantsMeeting ? (meetingDate || "Earliest Available Slot") : null,
      meetingTime: wantsMeeting ? meetingTime : null,
      availabilityStatus: "Pending Availability Confirmation",
    };

    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Submission rejected (${res.status})`);
      }

      if (onSuccess) onSuccess(data.brief);
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit project brief.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-[8px] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50 dark:bg-white/[0.02]">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 font-bold mb-1">
              <span>Architectural Project Brief</span>
              <span>•</span>
              <span>Step-by-Step Scope</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Submit New Consultation Inquiry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 text-xs">
          {submitError && (
            <div className="p-3.5 rounded-[4px] border-l-2 border-l-rose-500 border-y border-r border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs font-mono">
              {submitError}
            </div>
          )}

          {/* SECTION 1: PROJECT ARCHETYPE & STYLE */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300 mb-3">
              1. Project Classification &amp; Architectural Style *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              {PROJECT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = projectType === type.val;
                return (
                  <button
                    key={type.val}
                    type="button"
                    onClick={() => setProjectType(type.val)}
                    className={`p-3.5 rounded-[6px] text-left border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-neutral-950 dark:text-white font-bold"
                        : "bg-neutral-50 dark:bg-[#141722] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-amber-500" : "text-neutral-400"}`} />
                    <div>
                      <div className="text-xs font-mono font-semibold">{type.label}</div>
                      <div className="text-[11px] text-neutral-400 font-normal mt-0.5">{type.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Style Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-neutral-400 mr-1">Style Intent:</span>
              {ARCH_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setPreferredStyle(style)}
                  className={`px-2.5 py-1 rounded-[4px] text-[10px] font-mono border transition-colors cursor-pointer ${
                    preferredStyle === style
                      ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                      : "bg-white dark:bg-[#121620] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/50"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE LOT GEOLOCATION & MAP PINNING */}
          <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
            <div className="mb-3">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300">
                  2. Site Location in the Philippines &amp; Specifications *
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  🇵🇭 Philippine Projects Only
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Ang MCPA ay eksklusibong nagpapatayo sa Pilipinas (Bulacan, Pampanga, Metro Manila, atbp.). Pin your exact lot location so our engineers can assess elevation, road access, and subdivision orientation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Site Municipality / City / Province (Philippines Only) *
                </label>
                <input
                  type="text"
                  required
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. Grand Royale, Malolos / Rocka Village, Plaridel, Bulacan (PH Only)"
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Estimated Lot Area (sqm)
                </label>
                <input
                  type="number"
                  required
                  value={lotArea}
                  onChange={(e) => setLotArea(e.target.value)}
                  placeholder="240"
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-mono placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Embedded Interactive Map Picker */}
            <LotMapPicker
              coordinates={mapCoordinates}
              onCoordinatesChange={setMapCoordinates}
              locationAddress={locationAddress}
              onLocationChange={setLocationAddress}
            />

            {/* Lot Ownership Status */}
            <div className="mt-4">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                Lot Title / Ownership Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "Titled & Ready (TCT)",
                  "Bank / Pag-IBIG Loan",
                  "Rights / Tax Dec",
                  "Still Acquiring Lot",
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLotStatus(st)}
                    className={`py-2 px-2 text-center rounded-[4px] border text-[11px] font-mono transition-all cursor-pointer ${
                      lotStatus === st
                        ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold"
                        : "bg-white dark:bg-[#141722] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: BUDGET & TARGET TIMELINE */}
          <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              3. Estimated Construction Budget &amp; Target Timeline
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div>
                <span className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Target Budget Bracket</span>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b.val} value={b.val}>
                      {b.val} ({b.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Target Groundbreaking</span>
                <select
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Within 1 Month (Immediate)">Within 1 Month (Immediate)</option>
                  <option value="Within 3 Months">Within 3 Months</option>
                  <option value="Within 6 Months">Within 6 Months</option>
                  <option value="Next Year / Planning Stage">Next Year / Planning Stage</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: OPTIONAL CONSULTATION MEETING & VENUE PICKER */}
          <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300 block">
                  4. Preliminary Consultation Meeting Preference (Optional)
                </label>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Discuss blueprints, material samples, and feasibility with Lead Architect Raymart Quirante, UAP.
                </span>
              </div>
              <input
                type="checkbox"
                checked={wantsMeeting}
                onChange={(e) => setWantsMeeting(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {wantsMeeting && (
              <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-[#141722] border border-neutral-200 dark:border-white/10 space-y-4">
                {/* Meeting Mode Switcher */}
                <div className="flex rounded-[4px] bg-neutral-200 dark:bg-white/[0.05] p-1 border border-neutral-300 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setMeetingMode("Face-to-Face")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-[3px] transition-all cursor-pointer ${
                      meetingMode === "Face-to-Face"
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Face-to-Face Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode("Online")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-[3px] transition-all cursor-pointer ${
                      meetingMode === "Online"
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Online (Google Meet)
                  </button>
                </div>

                {/* Face-to-Face 4 Venue Options */}
                {meetingMode === "Face-to-Face" && (
                  <div className="space-y-3">
                    <span className="block text-[10px] font-mono uppercase text-neutral-500">
                      Select Preferred Face-to-Face Venue:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "Office",
                          title: "MCPA Main Office Studio",
                          desc: "Plaridel, Bulacan (Review material swatches, finishes catalog & 3D models)",
                        },
                        {
                          id: "Coffee Shop",
                          title: "Coffee Shop / Public Cafe",
                          desc: "Client-preferred cafe (e.g. Starbucks Malolos / SM Marilao / Cafe near you)",
                        },
                        {
                          id: "On-Site",
                          title: "On-Site Lot Visit",
                          desc: "Direct ocular and ground elevation inspection at your pinned lot",
                        },
                        {
                          id: "Custom",
                          title: "Client's Home or Office",
                          desc: "Custom private venue requested by the client",
                        },
                      ].map((venue) => (
                        <button
                          key={venue.id}
                          type="button"
                          onClick={() => setVenueType(venue.id)}
                          className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer ${
                            venueType === venue.id
                              ? "bg-amber-500/10 border-amber-500 font-bold text-neutral-900 dark:text-white"
                              : "bg-white dark:bg-[#0c0e14] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="text-xs font-mono">{venue.title}</div>
                          <div className="text-[11px] text-neutral-400 font-normal mt-0.5 leading-relaxed">{venue.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Venue Details Input (especially for Coffee Shop or Custom) */}
                    {(venueType === "Coffee Shop" || venueType === "Custom") && (
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                          {venueType === "Coffee Shop" ? "Specify Preferred Cafe & Branch *" : "Specify Meeting Address *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={venueDetails}
                          onChange={(e) => setVenueDetails(e.target.value)}
                          placeholder="e.g. Starbucks Malolos, MacArthur Highway or Coffee Project SM Marilao"
                          className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Date & Time Slot Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Target Meeting Date</span>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-[4px] bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Preferred Time Window</span>
                    <select
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-[4px] bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="09:30 AM - 11:00 AM PHT">Morning (09:30 AM - 11:00 AM PHT)</option>
                      <option value="02:00 PM - 03:30 PM PHT">Afternoon (02:00 PM - 03:30 PM PHT)</option>
                      <option value="04:30 PM - 06:00 PM PHT">Late Afternoon (04:30 PM - 06:00 PM PHT)</option>
                      <option value="07:00 PM - 08:30 PM PHT">Evening / OFW Video Call (07:00 PM - 08:30 PM PHT)</option>
                    </select>
                  </div>
                </div>

                {/* Availability Notice */}
                <div className="p-2.5 rounded-[4px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-mono flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                  <span>
                    Schedule Advisory: All consultation requests are subject to Lead Architect field schedule availability. Confirmation will be dispatched to your email within 24 hours.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: SMART CAPTCHA SLIDER (ANTI-SPAM) */}
          <div className="pt-2 border-t border-neutral-200 dark:border-white/10">
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              5. Human Verification &amp; Security Shield *
            </label>
            <SmartCaptchaSlider
              onVerified={setIsCaptchaVerified}
              isVerified={isCaptchaVerified}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-[4px] border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-mono text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isCaptchaVerified}
              className="px-7 py-3 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Submitting Brief...</span>
                </>
              ) : (
                <>
                  <span>Submit Consultation Brief</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
