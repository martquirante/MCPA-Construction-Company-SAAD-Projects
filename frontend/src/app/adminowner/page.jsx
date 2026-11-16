"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOwnerRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect /adminowner to /admin with email-marketing active tab
    router.replace("/admin?tab=email-marketing");
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-amber-500 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Redirecting to MCPA Email Marketing Console...</span>
      </div>
    </div>
  );
}
