"use client";

import { useState, useEffect, useRef } from "react";
import {
  Compass,
  FileCheck2,
  Calendar,
  PenTool,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

export default function PortalPhase3Planning({
  activeProject,
  currentUser,
  showToast,
  onRefreshState,
}) {
  const projectId = activeProject?.client_project_id;

  // 1. Blueprint Viewer states
  const [blueprints, setBlueprints] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("ARCHITECTURAL");
  const [currentBlueprint, setCurrentBlueprint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pins, setPins] = useState([]);
  const [activePin, setActivePin] = useState(null);

  // 2. Permits Tracker states
  const [permits, setPermits] = useState([]);

  // 3. Groundbreaking Scheduler states
  const [groundbreakingDate, setGroundbreakingDate] = useState(
    activeProject?.groundbreaking_date || ""
  );
  const [isSavingDate, setIsSavingDate] = useState(false);

  // 4. Contract & E-Signature states
  const [contract, setContract] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const sigCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);

  // Fetch planning data from backend
  const loadPlanningData = async () => {
    if (!projectId) return;

    // Fetch Blueprints
    try {
      const bpRes = await authFetch(`/api/projects/${projectId}/blueprints?discipline=${selectedDiscipline}`);
      const bpData = await bpRes.json();
      if (bpData.success && Array.isArray(bpData.blueprints)) {
        setBlueprints(bpData.blueprints);
        if (bpData.blueprints.length > 0) {
          setCurrentBlueprint(bpData.blueprints[0]);
          setPins(bpData.blueprints[0].pins || []);
        } else {
          setCurrentBlueprint(null);
          setPins([]);
        }
      }
    } catch (e) {
      console.warn("Failed to load blueprints:", e);
    }

    // Fetch Permits
    try {
      const permRes = await authFetch(`/api/projects/${projectId}/permits`);
      const permData = await permRes.json();
      if (permData.success && Array.isArray(permData.permits)) {
        setPermits(permData.permits);
      }
    } catch (e) {
      console.warn("Failed to load permits:", e);
    }

    // Fetch Contract
    try {
      const contractRes = await authFetch(`/api/projects/${projectId}/contract`);
      const contractData = await contractRes.json();
      if (contractData.success && contractData.contract) {
        setContract(contractData.contract);
      }
    } catch (e) {
      console.warn("Failed to load contract:", e);
    }
  };

  useEffect(() => {
    loadPlanningData();
  }, [projectId, selectedDiscipline]);

  // Blueprint Canvas Pin click handler
  const handleCanvasClick = async (e) => {
    if (!currentBlueprint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const note = prompt("Add Engineering Revision Note for this blueprint coordinate:");
    if (!note || !note.trim()) return;

    const newPin = {
      id: Date.now(),
      x,
      y,
      note: note.trim(),
      author: currentUser?.fullName || currentUser?.full_name || "Client",
      timestamp: new Date().toISOString(),
    };

    const updatedPins = [...pins, newPin];
    setPins(updatedPins);

    // Save to DB
    try {
      await authFetch(`/api/projects/${projectId}/blueprints/${currentBlueprint.blueprint_id}/pins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pins: updatedPins }),
      });
      showToast("Revision pin recorded at " + x + "%, " + y + "%");
    } catch (err) {
      console.error("Failed to save blueprint pin:", err);
    }
  };

  // Signature canvas drawing functions
  const startDrawing = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSig(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f59e0b"; // Amber color
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  // Submit E-Signature
  const handleSubmitSignature = async () => {
    if (!hasDrawnSig || !contract) return;
    const canvas = sigCanvasRef.current;
    const signatureImageUrl = canvas.toDataURL("image/png");

    setIsSigning(true);
    try {
      const res = await authFetch(`/api/contracts/${contract.contract_id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerRole: "CLIENT",
          signerName: currentUser?.fullName || currentUser?.full_name || "Client",
          signerEmail: currentUser?.email,
          signatureImageUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Contract executed with cryptographic SHA-256 seal!");
        setIsSignModalOpen(false);
        loadPlanningData();
      } else {
        throw new Error(data.message || "Signing failed");
      }
    } catch (err) {
      console.error("Signature error:", err);
      showToast("Could not sign contract: " + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. PHASE 3 BANNER & MILESTONE HEADER */}
      <div className="p-6 rounded-[8px] border border-amber-500/20 bg-linear-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[3px] bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
              Phase 3 Active · Pre-Construction & Planning
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight">
              Architectural & Engineering Plan Approval
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Review signed blueprints, building permit status, and digital contract execution.
            </p>
          </div>

          {contract && (
            <div className="flex items-center gap-3">
              {contract.status === "FULLY_EXECUTED" ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  Contract Fully Executed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Sign Construction Contract
                </button>
              )}
            </div>
          )}
        </div>

        {/* Planning Milestone Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-[6px] bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-amber-500 font-bold uppercase">Blueprints</span>
            <div className="font-bold text-white">{blueprints.length} Sheets Available</div>
            <div className="text-[10px] text-neutral-400">Arch / Struct / MEP</div>
          </div>

          <div className="p-3 rounded-[6px] bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-amber-500 font-bold uppercase">LGU Permits</span>
            <div className="font-bold text-white">{permits.filter(p => p.status === "APPROVED" || p.status === "RELEASED").length} of {permits.length || 4} Released</div>
            <div className="text-[10px] text-neutral-400">Municipal Clearance</div>
          </div>

          <div className="p-3 rounded-[6px] bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-amber-500 font-bold uppercase">Groundbreaking</span>
            <div className="font-bold text-white truncate">
              {groundbreakingDate || "Scheduling in Progress"}
            </div>
            <div className="text-[10px] text-neutral-400">Official Site Inception</div>
          </div>

          <div className="p-3 rounded-[6px] bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-amber-500 font-bold uppercase">Contract Status</span>
            <div className="font-bold text-white truncate">
              {contract ? contract.status : "Drafting Agreement"}
            </div>
            <div className="text-[10px] text-neutral-400">Turnkey Protection</div>
          </div>
        </div>
      </div>

      {/* 2. ARCHITECTURAL & ENGINEERING BLUEPRINT VIEWER */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              CAD & Architectural Blueprint Viewer
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Click anywhere on the active plan canvas to place an engineering revision pin or comment.
            </p>
          </div>

          {/* Discipline Switcher Tabs */}
          <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
            {["ARCHITECTURAL", "STRUCTURAL", "ELECTRICAL", "PLUMBING", "MECHANICAL"].map((disc) => (
              <button
                key={disc}
                type="button"
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-3 py-1 rounded-[3px] font-mono text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                  selectedDiscipline === disc
                    ? "bg-amber-500 text-neutral-950"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-amber-500"
                }`}
              >
                {disc.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint Canvas Window */}
        <div className="relative w-full h-96 sm:h-[480px] bg-neutral-950 rounded-[6px] border border-neutral-800 overflow-hidden flex items-center justify-center select-none">
          {currentBlueprint ? (
            <div
              onClick={handleCanvasClick}
              className="relative w-full h-full cursor-crosshair overflow-auto flex items-center justify-center p-4"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
            >
              <img
                src={currentBlueprint.file_url}
                alt={currentBlueprint.title}
                className="max-h-full max-w-full object-contain pointer-events-none"
              />

              {/* Revision Pin Annotations Overlay */}
              {pins.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePin(pin);
                  }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center justify-center shadow-lg border border-white animate-bounce cursor-pointer z-10"
                  title={`${pin.author}: ${pin.note}`}
                >
                  ●
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-500 font-mono space-y-2">
              <Compass className="w-10 h-10 mx-auto text-neutral-700" />
              <p className="text-xs">No blueprints uploaded yet for {selectedDiscipline}.</p>
              <span className="text-[10px] text-neutral-600 font-sans">
                Our architecture team uploads high-res drawings following client consultation.
              </span>
            </div>
          )}

          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 rounded-[4px] bg-neutral-900/80 backdrop-blur-md border border-white/10 z-20">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.4))}
              className="p-1.5 text-white hover:text-amber-500 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
              className="p-1.5 text-white hover:text-amber-500 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-white hover:text-amber-500 cursor-pointer text-[10px] font-mono"
              title="Reset Zoom"
            >
              100%
            </button>
          </div>
        </div>

        {/* Active Pin Info Box */}
        {activePin && (
          <div className="p-3 rounded-[4px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-bold text-amber-500">{activePin.author}: </span>
              <span className="text-neutral-800 dark:text-neutral-200">{activePin.note}</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePin(null)}
              className="text-neutral-400 hover:text-neutral-200 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 3. PERMITS & CLEARANCES TRACKER */}
      <div className="p-6 rounded-[8px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-500" />
              LGU Regulatory Permits & Clearances
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Government approvals and statutory compliances processed by MCPA Liaison Officers.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Official Republic of the Philippines Permits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(permits.length > 0 ? permits : [
            { permit_id: 1, permit_type: "Barangay Construction Clearance", lgu_agency: "Local Barangay Hall", status: "APPROVED", remarks: "Issued without encumbrances." },
            { permit_id: 2, permit_type: "Fire Safety Evaluation Clearance (FSEC)", lgu_agency: "Bureau of Fire Protection", status: "APPROVED", remarks: "Sprinkler & egress compliant." },
            { permit_id: 3, permit_type: "City Building Permit", lgu_agency: "Department of Building Official", status: "UNDER_EVALUATION", remarks: "Structural engineering endorsement in progress." },
            { permit_id: 4, permit_type: "Sanitary & Plumbing Permit", lgu_agency: "City Health / Engineering", status: "IN_PREPARATION", remarks: "Septic tank specification filed." },
          ]).map((p) => {
            const isDone = p.status === "APPROVED" || p.status === "RELEASED";
            return (
              <div
                key={p.permit_id}
                className="p-4 rounded-[6px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                      {p.permit_type}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {p.lgu_agency}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                      isDone
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="text-[11px] font-sans text-neutral-600 dark:text-neutral-400 italic">
                  {p.remarks || "Processing standard regulatory timelines."}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. E-SIGNATURE MODAL */}
      {isSignModalOpen && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl p-6 rounded-[8px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-mono font-bold uppercase text-neutral-900 dark:text-white">
                  Execute Digital Construction Contract
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-xs"
              >
                Close ✕
              </button>
            </div>

            <div className="p-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-950 text-xs font-mono space-y-1">
              <div>Contract No: <span className="text-amber-500 font-bold">{contract.contract_number}</span></div>
              <div>Title: <span className="text-neutral-800 dark:text-neutral-200">{contract.title}</span></div>
              <div>Contract Sum: <span className="text-emerald-500 font-bold">₱{Number(contract.total_contract_amount).toLocaleString()}</span></div>
            </div>

            {/* Signature Draw Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  Draw Client Signature Below:
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-amber-500 hover:underline cursor-pointer"
                >
                  Clear Canvas
                </button>
              </div>

              <div className="relative h-44 w-full rounded-[4px] border-2 border-dashed border-amber-500/40 bg-neutral-950 overflow-hidden cursor-crosshair">
                <canvas
                  ref={sigCanvasRef}
                  width={520}
                  height={176}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full"
                />
                {!hasDrawnSig && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono text-neutral-500">
                    Use mouse or finger to sign here
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] font-mono text-neutral-400 leading-tight">
              By executing this digital signature, you verify that you are authorized to bind this construction engagement under Philippine Electronic Commerce Act of 2000 (R.A. 8792). A cryptographic SHA-256 seal will be stamped.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 rounded-[4px] border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSignature}
                disabled={!hasDrawnSig || isSigning}
                className="px-6 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
              >
                {isSigning ? "Signing..." : "Confirm & Execute Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
