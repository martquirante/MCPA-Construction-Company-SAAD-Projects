"use client";

import { useState, useEffect, useRef } from "react";
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  SettingsIcon,
  UserIcon,
  LockIcon,
  CameraIcon,
  CloseIcon,
  CheckIcon,
  RefreshCwIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  KeyRoundIcon,
} from "@/modules/shared/Icons";
import { getThemePreference, setThemePreference } from "@/modules/shared/SystemThemeSync";
import { authFetch } from "@/modules/shared/authFetch";

// Helper to compute age from birthdate
function computeAge(birthDateStr) {
  if (!birthDateStr) return null;
  const b = new Date(birthDateStr);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

// Inline SVG Icons for Social Media Profiles
function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export default function AdminSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenResetPin,
  initialTab = "profile",
}) {
  // Navigation tabs: "profile" | "security" | "appearance"
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasViberWhatsapp, setHasViberWhatsapp] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [civilStatus, setCivilStatus] = useState("Single");
  const [locationAddress, setLocationAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Location suggestions autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
  const locationDebounceRef = useRef(null);
  const locationAbortRef = useRef(null);
  const locationContainerRef = useRef(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState({ text: "", type: "success" }); // type: "success" | "error"
  const fileInputRef = useRef(null);

  // Theme states
  const [themePref, setThemePref] = useState("system");
  const [activeMode, setActiveMode] = useState("dark");
  const [systemIsDark, setSystemIsDark] = useState(false);

  // Synchronize form when modal opens or currentUser updates
  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentUser ? initialTab : "appearance");
      setNotification({ text: "", type: "success" });

      if (currentUser) {
        setFullName(currentUser.fullName || currentUser.name || "");
        setOccupation(currentUser.occupation || "");
        setPhoneNumber(currentUser.phoneNumber || currentUser.phone_number || "");
        setHasViberWhatsapp(Boolean(currentUser.hasViberWhatsapp || currentUser.has_viber_whatsapp));
        setBirthDate(currentUser.birthDate || currentUser.birth_date || "");
        setCivilStatus(currentUser.civilStatus || currentUser.civil_status || "Single");
        setLocationAddress(currentUser.locationAddress || currentUser.location_address || "");
        setAvatarUrl(currentUser.avatarUrl || currentUser.avatar_url || "");
        setFacebookUrl(currentUser.facebookUrl || currentUser.facebook_url || "");
        setLinkedinUrl(currentUser.linkedinUrl || currentUser.linkedin_url || "");
        setInstagramUrl(currentUser.instagramUrl || currentUser.instagram_url || "");
      }

      // Reset security fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowLocationDropdown(false);

      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
      if (locationAbortRef.current) locationAbortRef.current.abort();
    };
  }, [isOpen, currentUser, initialTab]);

  // Synchronize Theme Preferences
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    setSystemIsDark(mq ? mq.matches : false);

    const pref = getThemePreference();
    setThemePref(pref);
    setActiveMode(document.documentElement.classList.contains("dark") ? "dark" : "light");

    const handleThemeChange = (e) => {
      if (e?.detail) {
        setThemePref(e.detail.mode || "system");
        setActiveMode(e.detail.isDark ? "dark" : "light");
      }
    };

    window.addEventListener("mcpa-theme-change", handleThemeChange);
    return () => window.removeEventListener("mcpa-theme-change", handleThemeChange);
  }, []);

  // Keyboard escape handler & outside click for location dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        if (showLocationDropdown) {
          setShowLocationDropdown(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (locationContainerRef.current && !locationContainerRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, showLocationDropdown]);

  if (!isOpen) return null;

  const triggerNotification = (text, type = "success") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification({ text: "", type: "success" });
    }, 3500);
  };

  // --- Location Autocomplete Search ---
  const handleLocationInputChange = (e) => {
    const query = e.target.value;
    setLocationAddress(query);

    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (locationAbortRef.current) locationAbortRef.current.abort();

    const trimmed = query.trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    locationDebounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      locationAbortRef.current = controller;

      try {
        const res = await fetch(`/api/locations/ph?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.locations)) {
            setLocationSuggestions(data.locations);
            setShowLocationDropdown(true);
            setActiveLocationIndex(-1);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Location search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingLocation(false);
        }
      }
    }, 100);
  };

  const handleSelectLocation = (loc) => {
    setLocationAddress(loc);
    setShowLocationDropdown(false);
    setActiveLocationIndex(-1);
  };

  const handleLocationKeyDown = (e) => {
    if (!showLocationDropdown || locationSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveLocationIndex((prev) =>
        prev < locationSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveLocationIndex((prev) =>
        prev > 0 ? prev - 1 : locationSuggestions.length - 1
      );
    } else if (e.key === "Enter" && activeLocationIndex >= 0) {
      e.preventDefault();
      handleSelectLocation(locationSuggestions[activeLocationIndex]);
    }
  };

  // --- Photo Upload Handler ---
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerNotification("Please choose a valid photo file (JPG or PNG).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerNotification("The selected photo is too large. Maximum size is 5MB.", "error");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?category=avatars", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setAvatarUrl(data.url);
        triggerNotification("Photo uploaded! Click 'Save Profile Information' below to apply.");
      } else {
        throw new Error(data.message || "Failed to upload photo.");
      }
    } catch (err) {
      triggerNotification(err.message || "Photo upload failed. Please try again.", "error");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    triggerNotification("Photo removed. Click 'Save Profile Information' to revert to your initials.");
  };

  // --- Save Profile Changes ---
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!currentUser?.email) {
      triggerNotification("Unable to detect an active account.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        email: currentUser.email,
        fullName: fullName.trim(),
        occupation: occupation.trim(),
        phoneNumber: phoneNumber.trim(),
        hasViberWhatsapp: Boolean(hasViberWhatsapp),
        birthDate: birthDate.trim(),
        civilStatus: civilStatus,
        locationAddress: locationAddress.trim(),
        avatarUrl: avatarUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        instagramUrl: instagramUrl.trim(),
      };

      const res = await authFetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification("Your profile information has been saved successfully!");
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }
      } else {
        throw new Error(data.message || "Failed to save profile.");
      }
    } catch (err) {
      triggerNotification(err.message || "Could not save your changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Save Password Update ---
  const handleSavePassword = async (e) => {
    e?.preventDefault();
    if (!currentUser?.email) {
      triggerNotification("Unable to detect an active account.", "error");
      return;
    }

    if (!currentPassword) {
      triggerNotification("Please enter your current password.", "error");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      triggerNotification("Your new password must be at least 6 characters long.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerNotification("The new password and confirmation password do not match.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await authFetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification("Your password has been changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data.message || "Failed to update password.");
      }
    } catch (err) {
      triggerNotification(err.message || "Password change failed. Please check your current password.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Forgot Password Modal
  const handleLaunchForgotPassword = () => {
    onClose();
    if (onOpenResetPin) {
      onOpenResetPin();
    }
  };

  // --- Theme Mode Selectors ---
  const handleToggleSwitch = () => {
    const nextMode = activeMode === "dark" ? "light" : "dark";
    setThemePreference(nextMode);
    setThemePref(nextMode);
    setActiveMode(nextMode);
    triggerNotification(`Display theme set to ${nextMode.toUpperCase()}`);
  };

  const handleSelectMode = (mode) => {
    setThemePreference(mode);
    setThemePref(mode);
    if (mode === "system") {
      setActiveMode(systemIsDark ? "dark" : "light");
      triggerNotification("Theme is now matching your computer/phone setting");
    } else {
      setActiveMode(mode);
      triggerNotification(`Display theme set to ${mode.toUpperCase()}`);
    }
  };

  // Monogram calculation
  const computedMonogram = (fullName || currentUser?.fullName || currentUser?.name || "RQ")
    .replace(/^(Engr\.|Arch\.|Dr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const computedAge = computeAge(birthDate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-[6px] bg-white dark:bg-[#121418] border border-neutral-200 dark:border-white/[0.08] shadow-2xl overflow-hidden transition-all duration-200 z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {/* Settings Icon: No background, black in light mode, white in dark mode */}
            <SettingsIcon className="w-6 h-6 text-neutral-900 dark:text-white shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Account & Profile Settings
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Update your personal details, profile picture, password, and screen display
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center border-b border-neutral-200 dark:border-white/5 bg-neutral-100/50 dark:bg-black/20 px-5 sm:px-6 gap-1 overflow-x-auto no-scrollbar">
          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-white/[0.03]"
                    : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "security"
                    ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-white/[0.03]"
                    : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <LockIcon className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "appearance"
                ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-white/[0.03]"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <MonitorIcon className="w-3.5 h-3.5" />
            <span>Display Theme</span>
          </button>
        </div>

        {/* Global Alert Notification Banner */}
        {notification.text && (
          <div
            className={`mx-5 sm:mx-6 mt-4 p-2.5 rounded-[4px] border text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150 ${
              notification.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            {notification.type === "error" ? (
              <CloseIcon className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckIcon className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-neutral-800 dark:text-neutral-200">
          {/* ============================================================== */}
          {/* TAB 1: PROFILE & PERSONAL INFORMATION                          */}
          {/* ============================================================== */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Photo Upload Section */}
              <div className="p-4 rounded-[4px] border border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar Display */}
                    <div className="relative w-16 h-16 rounded-[4px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold font-mono text-lg text-amber-700 dark:text-amber-400 overflow-hidden shrink-0 shadow-xs">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{computedMonogram}</span>
                      )}
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RefreshCwIcon className="w-5 h-5 text-amber-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          Profile Picture
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                          {avatarUrl ? "Uploaded Photo" : "Using Initials"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xs">
                        Upload a clear photo of yourself (up to 5MB, JPG or PNG format).
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-mono font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 border border-neutral-200 dark:border-white/10 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove photo and use initials"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1: Personal Details */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-white/5 pb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                    Personal Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Raymart Quirante"
                      className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Job Title or Role */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Job Title or Role
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Lead Project Engineer & Super Admin"
                      className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Birthday
                      </label>
                      {computedAge !== null && (
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          {computedAge} years old
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Civil Status */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Civil Status
                    </label>
                    <select
                      value={civilStatus}
                      onChange={(e) => setCivilStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                </div>

                {/* Home Address with Autocomplete Suggestions */}
                <div ref={locationContainerRef} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Home Address / City & Province
                    </label>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      Suggestions appear as you type
                    </span>
                  </div>

                  <div className="relative">
                    <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={handleLocationInputChange}
                      onKeyDown={handleLocationKeyDown}
                      onFocus={() => {
                        if (locationAddress.trim() && locationSuggestions.length > 0) {
                          setShowLocationDropdown(true);
                        }
                      }}
                      placeholder="Start typing your city or province (e.g. San Jose, Quezon City...)"
                      className="w-full pl-8 pr-8 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                    />
                    {isSearchingLocation && (
                      <div className="absolute right-3 top-2.5">
                        <RefreshCwIcon className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Philippine Location Suggestions Dropdown */}
                  {showLocationDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[4px] shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {isSearchingLocation && locationSuggestions.length === 0 ? (
                        <div className="px-3.5 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                          <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                          <span>Searching Philippine locations...</span>
                        </div>
                      ) : locationSuggestions.length > 0 ? (
                        <>
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <span>Suggested Philippine Locations</span>
                            <span className="text-[9px] text-neutral-400">Click to select</span>
                          </div>
                          {locationSuggestions.map((loc, idx) => {
                            const isHighlighted = idx === activeLocationIndex;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectLocation(loc)}
                                onMouseEnter={() => setActiveLocationIndex(idx)}
                                className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors border-b border-neutral-100 dark:border-neutral-800/40 last:border-0 cursor-pointer ${
                                  isHighlighted
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium"
                                    : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                }`}
                              >
                                <MapPinIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isHighlighted ? "text-amber-500" : "text-neutral-400"
                                  }`}
                                />
                                <span className="truncate">{loc}</span>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <div className="px-3.5 py-2.5 text-xs text-neutral-400 italic text-center">
                          No matching Philippine city or province found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-white/5 pb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                    Contact Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Official Work Email */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Official Work Email
                    </label>
                    <div className="relative">
                      <MailIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        readOnly
                        value={currentUser?.email || ""}
                        className="w-full pl-8 pr-3 py-2 rounded-[4px] bg-neutral-100 dark:bg-white/[0.01] border border-neutral-200 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400 font-mono cursor-not-allowed select-all"
                        title="Used for logging in and receiving system notifications"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                      Your primary sign-in account
                    </p>
                  </div>

                  {/* Direct Mobile / Contact Number */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <PhoneIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0917 123 4567"
                        className="w-full pl-8 pr-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Viber / WhatsApp Active Toggle */}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasViberWhatsapp}
                      onChange={(e) => setHasViberWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded-[3px] border-neutral-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      I can be contacted on this number via Viber or WhatsApp
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 3: Social Media & Online Profiles */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-white/5 pb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                    Social Media & Professional Profiles
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Optional links so your company team can easily connect with you
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Facebook Profile */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Facebook Profile URL
                    </label>
                    <div className="relative flex items-center">
                      <div className="w-8 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <FacebookIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/your.name"
                        className="flex-1 px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* LinkedIn Profile */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative flex items-center">
                      <div className="w-8 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                        <LinkedInIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/your.profile"
                        className="flex-1 px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Instagram / Professional Portfolio */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Instagram or Portfolio Link
                    </label>
                    <div className="relative flex items-center">
                      <div className="w-8 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                        <InstagramIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/your.handle"
                        className="flex-1 px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-[4px] bg-amber-500 text-neutral-950 font-mono font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save Profile Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CHANGE PASSWORD & PASSWORD RECOVERY                     */}
          {/* ============================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Password Change Form */}
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-white/5 pb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                    Change Password
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    If you know your current password, enter it below to create a new one.
                  </p>
                </div>

                <div className="space-y-3 max-w-lg">
                  {/* Current Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Current Password
                      </label>
                      <button
                        type="button"
                        onClick={handleLaunchForgotPassword}
                        className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-semibold"
                      >
                        Forgot current password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full pl-3 pr-10 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Must be at least 6 characters"
                        className="w-full pl-3 pr-10 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Type your new password again"
                      className="w-full px-3 py-2 rounded-[4px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-[4px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-mono font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <KeyRoundIcon className="w-3.5 h-3.5" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Forgot Password / OTP Email Reset Box */}
              <div className="p-4 rounded-[4px] border border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <KeyRoundIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      Forgot Your Password?
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                      If you don&apos;t remember your current password, you can reset it by sending a 6-digit verification code to your email ({currentUser?.email || "registered email"}).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchForgotPassword}
                    className="px-3.5 py-2 rounded-[4px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    Reset via Email Code (Forgot Password)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CONSOLE APPEARANCE & THEMES                             */}
          {/* ============================================================== */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              {/* THEME TOGGLE SWITCH */}
              <div className="p-5 rounded-[4px] bg-neutral-50/70 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                      Screen Appearance
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                      Light & Dark Mode Switch
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                      Switch between bright daytime view and comfortable dark screen view.
                    </p>
                  </div>

                  {/* TOGGLE SWITCH COMPONENT */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={activeMode === "dark"}
                      onClick={handleToggleSwitch}
                      className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                        activeMode === "dark"
                          ? "bg-neutral-900 border-amber-500/50"
                          : "bg-amber-100 border-amber-400/60"
                      }`}
                      title={`Switch to ${activeMode === "dark" ? "Light" : "Dark"} Mode`}
                    >
                      <span className="sr-only">Toggle Theme</span>
                      <span
                        className={`pointer-events-none flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition duration-300 ease-in-out mt-[2px] ml-[2px] ${
                          activeMode === "dark"
                            ? "translate-x-8 bg-amber-500 text-neutral-950"
                            : "translate-x-0 bg-white text-amber-600 border border-amber-200"
                        }`}
                      >
                        {activeMode === "dark" ? (
                          <MoonIcon className="w-3.5 h-3.5" />
                        ) : (
                          <SunIcon className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>

                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                      {activeMode === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                </div>

                {/* THREE THEME SELECTION CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Option 1: Light Theme */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode("light")}
                    className={`p-3.5 rounded-[4px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                      themePref === "light"
                        ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <SunIcon className="w-5 h-5 text-amber-500" />
                      {themePref === "light" && (
                        <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                          <CheckIcon className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">
                        Light Theme
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500">
                        Clean daytime view
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Dark Theme */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode("dark")}
                    className={`p-3.5 rounded-[4px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                      themePref === "dark"
                        ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <MoonIcon className="w-5 h-5 text-amber-400" />
                      {themePref === "dark" && (
                        <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                          <CheckIcon className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">
                        Dark Theme
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500">
                        Deep industrial dark view
                      </p>
                    </div>
                  </button>

                  {/* Option 3: System Default Sync */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode("system")}
                    className={`p-3.5 rounded-[4px] border text-left transition-colors cursor-pointer flex flex-col justify-between h-28 relative ${
                      themePref === "system"
                        ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                        : "border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <MonitorIcon className="w-5 h-5 text-sky-500" />
                      {themePref === "system" && (
                        <span className="w-4 h-4 rounded-[2px] bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                          <CheckIcon className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">
                          Automatic
                        </p>
                        <span className="px-1 py-0.2 rounded-[2px] bg-neutral-200 dark:bg-white/10 text-[9px] font-mono text-neutral-600 dark:text-neutral-400">
                          Auto
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-neutral-500">
                        Follows your computer or phone
                      </p>
                    </div>
                  </button>
                </div>

                {/* SYSTEM STATUS ROW */}
                <div className="pt-2 border-t border-neutral-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <MonitorIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      Detected Device Theme:{" "}
                      <strong className="text-neutral-900 dark:text-white">
                        {systemIsDark ? "Dark" : "Light"}
                      </strong>
                    </span>
                  </div>
                  {themePref !== "system" && (
                    <button
                      type="button"
                      onClick={() => handleSelectMode("system")}
                      className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-bold shrink-0"
                    >
                      <RefreshCwIcon className="w-3 h-3" />
                      <span>Sync with Device</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-200 dark:border-white/5 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-500">
              Account: <strong className="text-neutral-800 dark:text-neutral-200">{currentUser?.email || "System"}</strong>
            </span>
            {currentUser?.role && (
              <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold">
                {currentUser.role}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-white font-mono font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
