"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getReturnToCompletedHome } from "@/modules/home/homeState";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (pathname === "/") {
        if (getReturnToCompletedHome()) {
          const vh = window.innerHeight;
          window.scrollTo({ top: 3 * vh, left: 0, behavior: "instant" });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      } else {
        // Ensure navigation to subpages always starts at the top of content, never at footer
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  }, [pathname]);

  return null;
}
