"use client";

import { useState, useCallback } from "react";
import LoadingScreen from "./components/LoadingScreen";
import HomePanel from "@/modules/home";

export default function Home() {
  const [showLoading, setShowLoading] = useState(true);

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
