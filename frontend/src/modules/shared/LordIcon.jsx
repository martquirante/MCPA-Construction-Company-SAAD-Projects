"use client";

import { useEffect, useState, isValidElement } from "react";

export default function LordIcon({
  src,
  trigger = "loop",
  colors = "primary:#f59e0b,secondary:#64748b",
  size = 64,
  className = "",
  style = {},
  fallback: FallbackIcon = null,
  fallbackClassName = "text-amber-500 animate-pulse",
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

  const fallbackSize = size <= 28 ? Math.round(size * 0.8) : Math.min(Math.round(size * 0.45), 52);

  const renderFallback = () => {
    if (!FallbackIcon) return null;
    if (isValidElement(FallbackIcon)) {
      return FallbackIcon;
    }
    const FallbackComponent = FallbackIcon;
    return (
      <FallbackComponent
        style={{ width: `${fallbackSize}px`, height: `${fallbackSize}px` }}
        className={fallbackClassName}
      />
    );
  };

  if (!isClient) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, ...style }}
      >
        {renderFallback()}
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
      {!scriptLoaded && FallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {renderFallback()}
        </div>
      )}
    </div>
  );
}
