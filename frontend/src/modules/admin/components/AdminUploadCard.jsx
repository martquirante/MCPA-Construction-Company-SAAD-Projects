"use client";

import { PlusIcon, LockIcon, UploadCloudIcon } from "../../shared/Icons";

export default function AdminUploadCard({ onOpenUploadModal }) {
  return (
    <div
      onClick={onOpenUploadModal}
      className="group relative cursor-pointer rounded-[6px] p-8 border-2 border-dashed border-amber-500/40 hover:border-amber-500/90 bg-amber-500/[0.03] hover:bg-amber-500/[0.07] dark:bg-amber-500/[0.02] dark:hover:bg-amber-500/[0.06] transition-all duration-200 flex flex-col justify-center items-center text-center min-h-[380px] shadow-sm select-none"
    >
      {/* Admin badge */}
      <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[10px] font-mono tracking-[0.14em] uppercase bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
        <LockIcon className="w-3 h-3" />
        <span>Admin Portal</span>
      </div>

      {/* Center Icon */}
      <PlusIcon className="w-10 h-10 text-amber-500 dark:text-amber-400 mb-6" />

      <div className="inline-flex items-center text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-amber-600 dark:text-amber-400 mb-2 select-none">
        <span>Portfolio Management</span>
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
        Publish New Project
      </h3>

      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed font-light mb-6">
        Upload site photography, location, turnover date, and architectural specifications directly to the client showcase.
      </p>

      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-amber-500 text-neutral-950 font-bold text-xs tracking-wider uppercase transition-colors">
        <UploadCloudIcon className="w-4 h-4" />
        <span>Upload Project Card</span>
      </div>
    </div>
  );
}


