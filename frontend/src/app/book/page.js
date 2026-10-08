"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ClientNavbar from "@/modules/shared/ClientNavbar";
import Footer from "@/modules/shared/Footer";
import ArchitecturalClipboardInquiry from "@/modules/book/components/ArchitecturalClipboardInquiry";
import BookingAuthModal from "@/modules/book/components/BookingAuthModal";
import { useLanguage } from "@/modules/shared/LanguageContext";
import { getStoredClientUser, isClientAuthenticated } from "@/modules/shared/bookingAuthHelper";

function BookingPageContent() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const isFil = language === "fil";

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Extract selected style or project preference from URL parameters
  const selectedStyle = useMemo(() => {
    return searchParams?.get("style") || searchParams?.get("interest") || "";
  }, [searchParams]);

  // Construct current target URL with query params to preserve user intent
  const currentUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `/book?${qs}` : "/book";
  }, [searchParams]);

  // Check client authentication on mount & listen for multi-tab/event changes
  useEffect(() => {
    const checkAuth = () => {
      const user = getStoredClientUser();
      setCurrentUser(user);
      setIsLoadingAuth(false);
    };

    checkAuth();

    // Event listener for cross-tab or in-page storage updates
    const handleStorageChange = (e) => {
      if (e.key === "mcpa_client_user" || e.key === "mcpa_client_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-500">
      {/* Top Sticky Navigation */}
      <ClientNavbar isCompleted={true} />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col pt-20 sm:pt-24 overflow-hidden">
        {isLoadingAuth ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              {isFil ? "Sinusuri ang sesyon ng kliyente..." : "Verifying client session..."}
            </p>
          </div>
        ) : currentUser ? (
          /* AUTHENTICATED USER: Directly display the Architectural Clipboard Form */
          <ArchitecturalClipboardInquiry
            selectedStyle={selectedStyle}
            currentUser={currentUser}
          />
        ) : (
          /* UNAUTHENTICATED USER: Show background placeholder and prominent Auth Gate Modal */
          <BookingAuthModal isOpen={true} redirectUrl={currentUrl} selectedStyle={selectedStyle} />
        )}
      </main>

      {/* Architectural Multi-Column Footer */}
      <Footer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#080a0e] flex items-center justify-center text-amber-500 font-mono text-xs">
          Loading Booking Engine...
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
