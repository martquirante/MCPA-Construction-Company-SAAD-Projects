"use client";

import { useState, useRef, useEffect } from "react";
import {
  SparkleBadgeIcon,
  CheckIcon,
  UploadCloudIcon,
  ArrowRightIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from "../../shared/Icons";

export default function PreConsultationBooking({ selectedStyle }) {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState("Residential");
  const [lotStatus, setLotStatus] = useState("Titled & Ready (TCT)");
  const [lotArea, setLotArea] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
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
      timestamp: new Date().toISOString(),
      clientName,
      clientEmail,
      clientPhone,
      projectType,
      preferredStyle: preferredStyle || "Contemporary Modern",
      lotStatus,
      lotArea: lotArea ? `${lotArea} sqm` : "Not specified",
      targetDate: targetDate || "Flexible / ASAP",
      location: location || "Bulacan / Metro Manila",
      financingOption,
      uploadedFiles,
      status: "Pending Consultation Review",
    };

    try {
      const existing = JSON.parse(localStorage.getItem("mcpa_client_briefs") || "[]");
      localStorage.setItem("mcpa_client_briefs", JSON.stringify([brief, ...existing]));
    } catch (err) {
      console.warn("Storage error:", err);
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
    setUploadedFiles([]);
  };

  return (
    <section id="book-appointment" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-10 lg:p-14 transition-colors">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono tracking-widest uppercase mb-4 border border-amber-500/30">
            <SparkleBadgeIcon className="w-3.5 h-3.5" />
            <span>Smart Pre-Consultation Booking · PCAB Licensed & DTI Registered</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight text-neutral-900 dark:text-white">
            Dynamic Client Profiling
          </h2>

          <p className="mt-4 text-neutral-600 dark:text-neutral-300 text-base md:text-lg leading-relaxed font-light">
            Skip intimidating and uninformative contact forms. Provide your project parameters below, and our engineering team compiles an actionable Client Profile Brief prior to our first meeting. Serving Bulacan, Metro Manila, Pampanga, and Central Luzon.
          </p>

          {preferredStyle && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono">
              <CheckIcon className="w-3.5 h-3.5" />
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
                          ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {step > s.num ? (
                        <CheckIcon className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
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
                        {["Residential Design & Build", "Commercial / Industrial", "Luxury Villa", "Renovation & Fit-Out"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setProjectType(type)}
                            className={`p-4 rounded-xl text-left border transition-all text-xs font-mono uppercase ${
                              projectType === type
                                ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                                : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600"
                            }`}
                          >
                            {type}
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
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
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
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all"
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
                            className={`p-4 rounded-xl text-left border transition-all ${
                              lotStatus === lot.val
                                ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                                : "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-mono uppercase mb-1">{lot.val}</div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">{lot.desc}</div>
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

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        <span>Proceed To Client Brief</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONTACT & FILE PEGS */}
                {step === 3 && (
                  <div className="space-y-6 animate-fadeIn">
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
                        className="w-full p-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 bg-neutral-50 dark:bg-neutral-800/40 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                      >
                        <UploadCloudIcon className="w-8 h-8 text-neutral-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 mb-2" />
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            >
                              <CheckIcon className="w-3 h-3" />
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
                        className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Generate Client Profile Brief & Book</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* SUBMITTED STATE: FORMAL CLIENT PROFILE BRIEF CARD */
            <div className="bg-neutral-50 dark:bg-black/60 border border-amber-500/50 rounded-2xl p-6 sm:p-10 animate-fadeIn transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono tracking-wider uppercase mb-2">
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Brief Compiled & Registered</span>
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                    Client Profile Brief Prepared
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-neutral-500 uppercase block">Reference ID</span>
                  <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">{submissionId}</span>
                </div>
              </div>

              {/* Summary specifications table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8 text-xs font-mono">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">CLIENT NAME</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{clientName}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">PROJECT TYPE</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{projectType}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">LOT STATUS</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{lotStatus}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">ESTIMATED AREA</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{lotArea ? `${lotArea} sqm` : "N/A"}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">LOCATION</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{location}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">STYLE PEG</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{preferredStyle || "Custom"}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">PROGRAM</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{financingOption}</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 shadow-sm dark:shadow-none">
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-1">CONTACT</span>
                  <span className="text-neutral-900 dark:text-white font-bold">{clientPhone}</span>
                </div>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 font-light leading-relaxed mb-6">
                Our Chief Architect & Estimator is currently cross-referencing your site coordinates and selected aesthetic peg. A calendar invitation and preliminary engineering brief has been routed to <strong>{clientEmail}</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  Submit Another Project Inquiry
                </button>
                <a
                  href="#projects"
                  className="px-6 py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider hover:bg-amber-400 transition-colors"
                >
                  Return to Portfolio
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
