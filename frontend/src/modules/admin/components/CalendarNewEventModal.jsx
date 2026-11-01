"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  FileText,
  HardHat,
  CreditCard,
  Video,
  Sparkles,
} from "lucide-react";

export default function CalendarNewEventModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("operations");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:30 AM");
  const [priority, setPriority] = useState("standard");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        startDate,
        startTime,
        endTime,
        priority,
        location: location.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Save event error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#11141c] border border-neutral-200 dark:border-white/10 shadow-2xl text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-neutral-50 dark:bg-[#181a24] border-b border-neutral-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Schedule Company Event
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Add an operational milestone, meeting, or reminder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2nd Floor Beam Concrete Pouring"
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-white"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-white cursor-pointer"
              >
                <option value="operations">Company Operations</option>
                <option value="site">Site Milestone / Pouring</option>
                <option value="meeting">Team / Client Meeting</option>
                <option value="billing">Financial & Billing Due</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#181a24] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-white cursor-pointer"
              >
                <option value="standard">Standard Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority (Pouring / Turnover)</option>
              </select>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs text-neutral-900 dark:text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs text-neutral-900 dark:text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs text-neutral-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Location / Link
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Rocka Village Site / Google Meet / Office"
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Notes & Directive Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda, personnel in charge, supplier requirements, or safety reminders..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
