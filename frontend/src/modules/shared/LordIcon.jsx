"use client";

import { useEffect, useState } from "react";

export default function LordIcon({
  src,
  trigger = "loop",
  colors = "primary:#f59e0b,secondary:#64748b",
  size = 64,
  className = "",
  style = {},
  fallback: FallbackIcon = null,
}) {
  const [isClient, setIsClient] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window === "undefined") return;

    if (window.customElements && window.customElements.get("lord-icon")) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="lordicon.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
      if (window.customElements?.get("lord-icon")) {
        setScriptLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.lordicon.com/lordicon.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, ...style }}
      >
        {FallbackIcon && <FallbackIcon className="w-8 h-8 text-amber-500 animate-pulse" />}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      <lord-icon
        src={src}
        trigger={trigger}
        colors={colors}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  );
}
