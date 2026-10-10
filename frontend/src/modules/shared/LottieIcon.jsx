"use client";
import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const emptySubscribe = () => () => {};

// Dynamically import Lottie from lottie-react to prevent any SSR hydration mismatch
const LottieComponent = dynamic(
  () =>
    import("lottie-react").then((mod) => {
      return mod.Lottie || mod.default || mod;
    }),
  { ssr: false }
);

/**
 * LottieIcon
 * Seamless LottieFiles animation renderer powered by lottie-react.
 */
export default function LottieIcon({
  src,
  animationData,
  className = "w-16 h-16",
  loop = true,
  autoplay = true,
  fallback = null,
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const animSource = src || animationData;

  if (!mounted || !animSource) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <LottieComponent
        src={animSource}
        loop={loop}
        autoplay={autoplay}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
