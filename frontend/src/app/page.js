"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "./components/LoadingScreen";
import HomePanel from "@/modules/home";
import { getReturnToCompletedHome, consumeReturnToCompletedHome } from "@/modules/home/homeState";

export default function Home() {
  const router = useRouter();
  // Only skip intro loading screen if explicitly navigating back to Home from a subpage
  const shouldReturnToCompleted = getReturnToCompletedHome();
  const [showLoading, setShowLoading] = useState(!shouldReturnToCompleted);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      if (window.location.hash === "#projects") {
        router.replace("/projects");
        return;
      }

      const isCompleted = getReturnToCompletedHome();
      // If returning to Home from explicit link click, position directly at the completed residence screen (Step 3)
      if (isCompleted || shouldReturnToCompleted) {
        setShowLoading(false);
        const vh = window.innerHeight;
        window.scrollTo({ top: 3 * vh, behavior: "instant" });
        // Consume the flag so subsequent reloads or fresh visits start from Step 0 with the videos
        setTimeout(() => {
          consumeReturnToCompletedHome();
        }, 400);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [router, shouldReturnToCompleted]);

  useEffect(() => {
    if (showLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLoading]);

  const handleComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={handleComplete} />
      )}
      <HomePanel />
    </>
  );
}
