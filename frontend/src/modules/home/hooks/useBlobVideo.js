"use client";

import { useState, useEffect } from "react";

// In-memory cache map so identical video paths are fetched only once per browser session
const blobCache = new Map();

/**
 * useBlobVideo
 * Fetches the target video file and masks it as an in-memory Blob URL (blob:http://...)
 * Prevents raw static video paths from appearing directly in the DOM tree and DevTools Sources tab.
 *
 * @param {string} rawSrc - Path to video asset (e.g. "/videos/landscape-build.mp4")
 * @returns {string} blobUrl or fallback rawSrc
 */
export function useBlobVideo(rawSrc) {
  const cached = rawSrc ? blobCache.get(rawSrc) : "";
  const [blobSrc, setBlobSrc] = useState(cached);

  useEffect(() => {
    if (!rawSrc || blobCache.has(rawSrc)) return;

    let isMounted = true;

    fetch(rawSrc)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (!isMounted) return;
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(rawSrc, objectUrl);
        setBlobSrc(objectUrl);
      })
      .catch((err) => {
        console.warn("[useBlobVideo] Blob masking fallback to rawSrc:", err.message);
        if (isMounted) {
          setBlobSrc(rawSrc);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawSrc]);

  return cached || blobSrc;
}
