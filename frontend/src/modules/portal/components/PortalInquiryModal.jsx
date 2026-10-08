"use client";

import ArchitecturalClipboardInquiry from "@/modules/book/components/ArchitecturalClipboardInquiry";

export default function PortalInquiryModal({ isOpen, onClose, currentUser, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-auto py-6">
        <ArchitecturalClipboardInquiry
          currentUser={currentUser}
          isModal={true}
          onClose={onClose}
          onSuccess={(brief) => {
            if (onSuccess) onSuccess(brief);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
