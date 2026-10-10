"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import successCheckData from "@/assets/animations/success-check.json";

const emptySubscribe = () => () => {};

// Dynamically import Lottie from lottie-react to prevent any SSR hydration mismatch
const LottieComponent = dynamic(
  () =>
    import("lottie-react").then((mod) => {
      return mod.Lottie || mod.default || mod;
    }),
  { ssr: false }
);

export default function LottieSuccessCheck({ className = "w-24 h-24" }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  return (
    <div className={`relative flex items-center justify-center mx-auto ${className}`}>
      {mounted ? (
        <LottieComponent
          src={successCheckData}
          loop={false}
          autoplay={true}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20 animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
