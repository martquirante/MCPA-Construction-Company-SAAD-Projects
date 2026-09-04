"use client";

import LoadingScreen from "./components/LoadingScreen";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <LoadingScreen initialTheme="dark" />
    </main>
  );
}
