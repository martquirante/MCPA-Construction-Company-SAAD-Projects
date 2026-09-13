"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePanel from "@/modules/home";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#projects") {
      router.replace("/projects");
    }
  }, [router]);

  return <HomePanel />;
}
