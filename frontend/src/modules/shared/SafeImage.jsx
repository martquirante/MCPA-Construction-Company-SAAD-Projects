"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { getCloudMirrorUrls } from "./cloudStorageFallback";

/**
 * SafeImage
 * 
 * Multi-Cloud Resilient Image Component with Automatic Zero-Downtime Failover.
 * If Azure Blob Storage is unreachable or down, it automatically and silently
 * cascades to Supabase Storage, then Neon S3, and finally an architectural fallback.
 * 
 * Fully compatible with all Next.js <Image /> props (fill, sizes, priority, etc.)
 */
export default function SafeImage({
  src,
  alt = "MCPA Project Media",
  className = "",
  onError: externalOnError,
  unoptimized = true,
  ...props
}) {
  const mirrors = useMemo(() => getCloudMirrorUrls(src), [src]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Reset mirror index whenever the source URL prop changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [src]);

  const currentSrc = mirrors[currentIdx] || mirrors[0];

  const handleFailoverError = (e) => {
    if (currentIdx < mirrors.length - 1) {
      const nextIdx = currentIdx + 1;
      console.warn(
        `[SafeImage] Failover triggered: Could not load ${currentSrc}. Switching to mirror ${nextIdx + 1}/${mirrors.length}: ${mirrors[nextIdx]}`
      );
      setCurrentIdx(nextIdx);
    } else {
      console.error(`[SafeImage] All mirrors exhausted for: ${src}`);
      if (typeof externalOnError === "function") {
        externalOnError(e);
      }
    }
  };

  const isNextImageCompatible = Boolean(props.fill || (props.width && props.height));

  if (isNextImageCompatible) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        className={className}
        unoptimized={unoptimized}
        onError={handleFailoverError}
        {...props}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleFailoverError}
      {...props}
    />
  );
}
