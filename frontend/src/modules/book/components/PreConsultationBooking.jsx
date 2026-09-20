"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CheckIcon,
  UploadCloudIcon,
  ArrowRightIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
  LordIcon,
  HomeIcon,
  WarehouseIcon,
  HammerIcon,
  VideoIcon,
} from "../../shared/Icons";

export default function PreConsultationBooking({ selectedStyle }) {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState("Residential Design & Build");
  const [lotStatus, setLotStatus] = useState("Titled & Ready (TCT)");
  const [lotArea, setLotArea] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
  const [mapCoordinates, setMapCoordinates] = useState("14.8871, 120.8572 (Plaridel)");
  const [locationType, setLocationType] = useState("Local"); // "Local" | "OFW"
  const [meetingMode, setMeetingMode] = useState("Online Meeting (Google Meet)"); // "Online Meeting (Google Meet)" | "In-Person Office Visit"
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("09:00 AM - 10:30 AM");
  const [preferredStyle, setPreferredStyle] = useState(() => {
    if (selectedStyle) return selectedStyle;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("style") || params.get("interest") || "";
    }
    return "";
  });
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [financingOption, setFinancingOption] = useState("Build Now, Pay Later Program");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  const fileInputRef = useRef(null);
  const prevSelectedStyleRef = useRef(selectedStyle);

  // Sync if selectedStyle prop changes externally after initial mount
  useEffect(() => {
    if (selectedStyle && selectedStyle !== prevSelectedStyleRef.current) {
      prevSelectedStyleRef.current = selectedStyle;
      setPreferredStyle(selectedStyle);
    }
  }, [selectedStyle]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const names = files.map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = "MCPA-CPB-" + Math.floor(100000 + Math.random() * 900000);
    setSubmissionId(id);

    const brief = {
      id,
      submissionId: id,
      timestamp: new Date().toISOString(),
      clientName,
      clientEmail,
      clientPhone,
      projectType,
      preferredStyle: preferredStyle || "Contemporary Modern",
      lotStatus,
      lotArea: lotArea ? `${lotArea} sqm` : "Not specified",
      targetDate: targetDate || "Flexible / ASAP",
      location: location || "Bulacan / Central Luzon",
      mapCoordinates,
      locationType,
      meetingMode,
      meetingDate: meetingDate || "Earliest Available Slot",
      meetingTime,
      financingOption,
      uploadedFiles,
      status: "Pending Review",
    };

    try {
      const existing = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
      localStorage.setItem("mcpa_client_briefs", JSON.stringify([brief, ...existing]));
    } catch (err) {
      console.warn("Storage error:", err);
    }

    // Persist to backend database
    try {
      fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      }).catch((e) => console.warn("Could not sync brief with backend:", e));
    } catch (e) {
      // Offline fallback
    }

    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setLotArea("");
    setMeetingDate("");
    setUploadedFiles([]);
  };

  return (
    <section id="book-appointment" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-10 lg:p-14 transition-colors">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-mono tracking-widest uppercase mb-4 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Pre-Consultation Booking · Full-Service Design & Build</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight text-neutral-900 dark:text-white">
            Dynamic Client Profiling
          </h2>

          <p className="mt-4 text-neutral-600 dark:text-neutral-300 text-base md:text-lg leading-relaxed font-light">
            Skip intimidating and uninformative contact forms. Provide your project parameters below, and our engineering team compiles an actionable Client Profile Brief prior to our first meeting. Serving Bulacan, Metro Manila, Pampanga, and Central Luzon.
          </p>

          {preferredStyle && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono">
              <CheckIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Inquiring for Architectural Style: <strong>{preferredStyle}</strong></span>
            </div>
          )}
        </div>

        {/* Form Container / Submitted State */}
        <div className="relative z-10">
          {!isSubmitted ? (
            <div>
              {/* Stepper Progress Indicator */}
              <div className="flex items-center justify-between mb-8 max-w-xl">
                {[
                  { num: 1, label: "Project Type" },
                  { num: 2, label: "Site & Lot" },
                  { num: 3, label: "Client Info & Pegs" },
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        step >= s.num
                          ? "bg-amber-500 text-neutral-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {step > s.num ? (
                        <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        s.num
                      )}
                    </div>
                    <span
                      className={`text-xs font-mono uppercase tracking-wider hidden sm:inline ${
                        step >= s.num ? "text-neutral-900 dark:text-white font-medium" : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Form Multi-step Body */}
              <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                {/* STEP 1: PROJECT PARAMETERS */}
                {step === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
                        Select Project Category
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { type: "Residential Design & Build", icon: <HomeIcon className="w-5 h-5 mb-1.5" /> },
                          { type: "Commercial / Industrial", icon: <WarehouseIcon className="w-5 h-5 mb-1.5" /> },
                          { type: "Luxury Villa", icon: <BuildingIcon className="w-5 h-5 mb-1.5" /> },
                          { type: "Renovation & Fit-Out", icon: <HammerIcon className="w-5 h-5 mb-1.5" /> },
                        ].map((cat) => (
                          <button
                            key={cat.type}
                            type="button"
                            onClick={() => setProjectType(cat.type)}
                            className={`p-4 rounded-xl text-left border transition-all text-xs font-mono uppercase cursor-pointer flex flex-col justify-between ${
                              projectType === cat.type
                                ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/20"
                                : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-amber-500/40"
                            }`}
                          >
                            <div>{cat.icon}</div>
                            <span>{cat.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Preferred Style / Inspiration
                        </label>
                        <input
                          type="text"
                          value={preferredStyle}
                          onChange={(e) => setPreferredStyle(e.target.value)}
                          placeholder="e.g. Meridian Residence, Modern Zen, Industrial Minimalist"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Financing / Payment Program
                        </label>
                        <select
                          value={financingOption}
                          onChange={(e) => setFinancingOption(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                        >
                          <option value="Build Now, Pay Later Program (Titled Lot)">Build Now, Pay Later Program (Titled Lot)</option>
                          <option value="Pag-IBIG / Bank Loan Assistance">Pag-IBIG / Bank Loan Assistance</option>
                          <option value="Milestone Progress Billing">Milestone Progress Billing</option>
                          <option value="Direct Cash Contract">Direct Cash Contract</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <span>Continue To Site Status</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: LOT & SITE STATUS */}
                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
                        Property / Lot Status (May Lupa Na Ba?)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { val: "Titled & Ready (TCT)", desc: "Clean Transfer Certificate of Title (Eligible for BNPL)" },
                          { val: "Inside Gated Subdivision", desc: "Bulacan / Pampanga / NCR HOA Guidelines" },
                          { val: "Looking / In Acquisition", desc: "Need site evaluation and assistance" },
                        ].map((lot) => (
                          <button
                            key={lot.val}
                            type="button"
                            onClick={() => setLotStatus(lot.val)}
                            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                              lotStatus === lot.val
                                ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/20"
                                : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-amber-500/40"
                            }`}
                          >
                            <div className="text-xs font-mono uppercase mb-1">{lot.val}</div>
                            <div className="text-[11px] text-neutral-400 dark:text-neutral-400 font-normal">{lot.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Site Location (City / Province) *
                        </label>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Plaridel Bulacan, Malolos, or Quezon City"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Estimated Lot Area (sqm)
                        </label>
                        <input
                          type="number"
                          value={lotArea}
                          onChange={(e) => setLotArea(e.target.value)}
                          placeholder="e.g. 250"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Target Start Date
                        </label>
                        <input
                          type="text"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          placeholder="e.g. Q4 2025 or Within 3 Months"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Interactive Lot Map Pin & Geolocation Coordinates (Flowchart Step 4) */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                        Lot Geolocation & Map Coordinates (Flowchart Step 4)
                      </label>
                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 shrink-0">
                            <MapPinIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Selected Coordinates / Lot Pin</span>
                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{mapCoordinates}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono text-neutral-400 mr-1 hidden sm:inline">Quick Presets:</span>
                          {[
                            { label: "Plaridel HQ", coord: "14.8871° N, 120.8572° E" },
                            { label: "Malolos", coord: "14.8527° N, 120.8160° E" },
                            { label: "Guiguinto", coord: "14.8311° N, 120.8797° E" },
                            { label: "San Fernando", coord: "15.0286° N, 120.6897° E" },
                            { label: "NCR / QC", coord: "14.6760° N, 121.0437° E" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setMapCoordinates(`${preset.coord} (${preset.label})`)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer ${
                                mapCoordinates.includes(preset.label)
                                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs"
                                  : "border-neutral-300 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-600 dark:text-neutral-300"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <span>Proceed To Meeting Booking</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONTACT, DEMOGRAPHICS & 1ST MEETING SCHEDULER (Flowchart Step 5) */}
                {step === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Location Status: Local vs OFW */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                        Client Demographic / Current Location *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLocationType("Local")}
                          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                            locationType === "Local"
                              ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/20"
                              : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <HomeIcon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-mono uppercase">Local Resident (Philippines)</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-400 font-normal">Based locally in Bulacan, Metro Manila, or Central Luzon</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationType("OFW")}
                          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                            locationType === "OFW"
                              ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/20"
                              : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <VideoIcon className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-mono uppercase">OFW / Based Overseas</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[9px] font-bold">OFW Priority</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-400 font-normal">Building a dream home from abroad (Requires online video meet)</div>
                        </button>
                      </div>
                    </div>

                    {/* 1st Consultation Meeting Mode & Schedule */}
                    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-900 dark:text-white font-bold mb-2">
                          1st Consultation Meeting Mode Preference *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setMeetingMode("Online Meeting (Google Meet)")}
                            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                              meetingMode.includes("Online")
                                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20 border-amber-500"
                                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <VideoIcon className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-mono uppercase">Online Meeting (Google Meet / Zoom)</span>
                            </div>
                            <div className={`text-[10px] ${meetingMode.includes("Online") ? "text-neutral-800" : "text-neutral-500"}`}>
                              Ideal for OFWs & remote homeowners
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMeetingMode("In-Person Office Visit")}
                            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                              meetingMode.includes("In-Person")
                                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20 border-amber-500"
                                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <BuildingIcon className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-mono uppercase">In-Person Office Visit</span>
                            </div>
                            <div className={`text-[10px] ${meetingMode.includes("In-Person") ? "text-neutral-800" : "text-neutral-500"}`}>
                              Personal meeting at MCPA Tabang, Plaridel Office
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                            Preferred Meeting Date
                          </label>
                          <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-neutral-600 dark:text-neutral-300 mb-1">
                            Preferred Time Slot
                          </label>
                          <select
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM (Morning)</option>
                            <option value="02:00 PM - 03:30 PM">02:00 PM - 03:30 PM (Afternoon)</option>
                            <option value="07:00 PM - 08:30 PM (OFW Friendly)">07:00 PM - 08:30 PM (Special OFW Evening Slot)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Arch. Roberto Cruz"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="client@gmail.com"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                          Viber / Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+63 949 775 8239 or 09XX XXX XXXX"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* File / Pegs Upload */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                        Attach Design Pegs / Lot Plan / Sketches (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 bg-neutral-50 dark:bg-neutral-800/40 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                      >
                        <UploadCloudIcon className="w-8 h-8 text-neutral-400 group-hover:text-amber-500 mb-2 transition-colors" />
                        <span className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                          Click to select design pegs (PDF, Images)
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          Files will be securely indexed in your Client Profile Brief
                        </span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      {uploadedFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {uploadedFiles.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            >
                              <CheckIcon className="w-3 h-3 text-amber-500" />
                              <span>{name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Submit Inquiry & Book 1st Meeting</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* SUBMITTED STATE: FORMAL CLIENT PROFILE BRIEF & PENDING REVIEW NOTICE */
            <div className="bg-neutral-50 dark:bg-black/60 border border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-6 sm:p-10 animate-fadeIn transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckIcon className="w-8 h-8 text-emerald-500 animate-in zoom-in-50 duration-300" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-2 border border-amber-500/30">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>STATUS: PENDING REVIEW</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white">
                      Inquiry & Appointment Registered
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-1">
                      Bagong submit — naghihintay ma-review ng kumpanya. (Hindi pa quotation agad — for initial review & meeting scheduling)
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-neutral-500 uppercase block">Reference Brief ID</span>
                  <span className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">{submissionId}</span>
                </div>
              </div>

              {/* Summary specifications table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">CLIENT NAME</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{clientName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">CLIENT STATUS</span>
                  <span className="text-neutral-950 dark:text-white font-bold">{locationType === "OFW" ? "OFW / Abroad Priority" : "Local Homeowner"}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">MEETING MODE</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{meetingMode}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">PREFERRED SLOT</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{meetingDate || "Earliest"} ({meetingTime.split(" ")[0]})</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">LOCATION</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{location}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">LOT COORDINATES</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{mapCoordinates.split(" ")[0]}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">STYLE PEG</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{preferredStyle || "Custom"}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5 text-[10px]">CONTACT</span>
                  <span className="text-neutral-900 dark:text-white font-bold truncate block">{clientPhone}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-6 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                <p>
                  <strong>Susunod na Hakbang (Next Steps):</strong> Makakatanggap ka ng confirmation sa iyong email (<strong>{clientEmail}</strong>) at Viber kasama ang opisyal na Google Meet / Zoom link o kumpirmasyon sa pagbisita sa MCPA Office. Dito ilalatag ang totoong plano at vision bago ihanda ang opisyal na quotation at BOQ.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
                <Link
                  href="/projects"
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors inline-block text-center cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Return to Portfolio
                </Link>
                <Link
                  href="/portal"
                  className="px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-amber-500 text-neutral-900 dark:text-white font-mono text-xs uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-block text-center cursor-pointer"
                >
                  View Client Portal Demo &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
