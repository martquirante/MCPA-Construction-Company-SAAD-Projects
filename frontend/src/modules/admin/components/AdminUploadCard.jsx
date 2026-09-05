"use client";

import { PlusIcon, LockIcon, UploadCloudIcon } from "../../shared/Icons";

export default function AdminUploadCard({ onOpenUploadModal }) {
  return (
    <div
      onClick={onOpenUploadModal}
      className="group relative cursor-pointer rounded-2xl p-8 border-2 border-dashed border-amber-500/40 hover:border-amber-500/90 bg-amber-500/[0.03] hover:bg-amber-500/[0.07] dark:bg-amber-500/[0.02] dark:hover:bg-amber-500/[0.06] transition-all duration-300 flex flex-col justify-center items-center text-center min-h-[380px] shadow-sm hover:shadow-xl hover:-translate-y-1 select-none backdrop-blur-sm"
    >
      {/* Admin badge */}
      <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
        <LockIcon className="w-3 h-3" />
        <span>Admin Portal</span>
      </div>

      {/* Center Icon */}
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] mb-6">
        <PlusIcon className="w-8 h-8" />
      </div>

      <p className="text-xs font-mono uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 mb-2">
        Portfolio Management
      </p>

      <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
        Publish New Project
      </h3>

      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed font-light mb-6">
        Upload site photography, location, turnover date, and architectural specifications directly to the client showcase.
      </p>

      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-semibold text-xs tracking-wider uppercase shadow-md group-hover:bg-amber-400 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
        <UploadCloudIcon className="w-4 h-4" />
        <span>Upload Project Card</span>
      </div>
    </div>
  );
}
