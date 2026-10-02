"use client";

import { useState, useEffect, useRef } from "react";
import {
  CloseIcon,
  SaveIcon,
  UploadCloudIcon,
  MapPinIcon,
  CalendarIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  CheckCircle2Icon,
  Maximize2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LightbulbIcon,
  StarIcon,
} from "../../shared/Icons";
import { verifyAdminPassword } from "../utils/adminAuth";
import { compressImageFile } from "../../shared/imageUtils";

const PRESET_CATEGORIES = [
  "Residential",
  "Commercial",
  "Luxury Villa",
  "Modern Zen",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Generate years from 2015 (past portfolio) to 2030 (future scheduled completions)
const YEARS = Array.from({ length: 2030 - 2015 + 1 }, (_, i) => (2015 + i).toString());

export default function ProjectEditorModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    category: "Residential",
    customCategory: "",
    month: "January",
    year: new Date().getFullYear().toString(),
    status: "completed",
    description: "",
    isWebVisible: true,
    featuredOnHome: false,
    lotArea: "",
    floorArea: "",
    bedrooms: "",
    bathrooms: "",
    architecturalDetails: "",
  });

  // Dynamic Features & Scope List State
  const [featuresList, setFeaturesList] = useState([""]);
  const featureInputRefs = useRef([]);

  // Inline Field Validation Errors State
  const [fieldErrors, setFieldErrors] = useState({});
  const nameInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const gallerySectionRef = useRef(null);

  // Images state
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  // Fullscreen Lightbox State
  const [fullscreenImage, setFullscreenImage] = useState(null); // { url, index, total }

  // Confirmation Modals State
  const [photoToDelete, setPhotoToDelete] = useState(null); // { type: 'existing' | 'new', index, url }
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Deletion Authorization Password State
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleOpenDeletePhoto = (photoInfo) => {
    setPhotoToDelete(photoInfo);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
    setIsVerifyingPassword(false);
  };

  const handleCloseDeletePhoto = () => {
    setPhotoToDelete(null);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
    setIsVerifyingPassword(false);
  };

  // Friendly Non-IT Error Modal State
  const [friendlyError, setFriendlyError] = useState(null); // { title, message, tip, type }

  // Upload Progress Tracking (0-100%)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");

  // Location suggestions state (pure API, 0 frontend storage)
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDebounceRef = useRef(null);
  const locationContainerRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Initialize or reset form
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initialData) {
      const isPreset = PRESET_CATEGORIES.includes(initialData.category);
      let initialFeatures = [""];
      if (initialData.features) {
        if (Array.isArray(initialData.features)) {
          const list = initialData.features
            .map((f) => (typeof f === "string" ? f.trim() : ""))
            .filter(Boolean);
          initialFeatures = list.length > 0 ? list : [""];
        } else if (typeof initialData.features === "string") {
          const list = initialData.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
          initialFeatures = list.length > 0 ? list : [""];
        }
      }

      setFormData({
        name: initialData.name || "",
        location: initialData.location || "",
        category: isPreset ? initialData.category : "Other",
        customCategory: isPreset ? "" : (initialData.category || ""),
        month: initialData.month || "January",
        year: initialData.year || new Date().getFullYear().toString(),
        status: initialData.status || "completed",
        description: initialData.description || "",
        isWebVisible: initialData.isWebVisible !== false,
        featuredOnHome: Boolean(initialData.featuredOnHome || initialData.featured_on_home),
        lotArea: initialData.lotArea || initialData.lot_area || "",
        floorArea: initialData.floorArea || initialData.floor_area || "",
        bedrooms: initialData.bedrooms || "",
        bathrooms: initialData.bathrooms || "",
        architecturalDetails: initialData.architecturalDetails || initialData.architectural_details || "",
      });
      setFeaturesList(initialFeatures);
      setExistingImages(Array.isArray(initialData.images) ? initialData.images : []);
    } else {
      setFormData({
        name: "",
        location: "",
        category: "Residential",
        customCategory: "",
        month: "January",
        year: new Date().getFullYear().toString(),
        status: "completed",
        description: "",
        isWebVisible: true,
        featuredOnHome: false,
        lotArea: "",
        floorArea: "",
        bedrooms: "",
        bathrooms: "",
        architecturalDetails: "",
      });
      setFeaturesList([""]);
      setExistingImages([]);
    }
    setNewFiles([]);
    setNewPreviews([]);
    setUploadError("");
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
    setFullscreenImage(null);
    setPhotoToDelete(null);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeletePassword(false);
    setIsVerifyingPassword(false);
    setShowSaveConfirm(false);
    setFieldErrors({});
    setFriendlyError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, [initialData, isOpen]);

  // Click outside to dismiss location dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (locationContainerRef.current && !locationContainerRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for Fullscreen Lightbox & Modals
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (fullscreenImage) {
          setFullscreenImage(null);
        } else if (photoToDelete) {
          handleCloseDeletePhoto();
        } else if (showSaveConfirm) {
          setShowSaveConfirm(false);
        } else if (friendlyError) {
          setFriendlyError(null);
        }
      }

      if (fullscreenImage) {
        const allImgs = [...existingImages, ...newPreviews];
        if (e.key === "ArrowRight") {
          const next = (fullscreenImage.index + 1) % allImgs.length;
          setFullscreenImage({ url: allImgs[next], index: next, total: allImgs.length });
        } else if (e.key === "ArrowLeft") {
          const prev = (fullscreenImage.index - 1 + allImgs.length) % allImgs.length;
          setFullscreenImage({ url: allImgs[prev], index: prev, total: allImgs.length });
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fullscreenImage, photoToDelete, showSaveConfirm, friendlyError, existingImages, newPreviews]);

  const descriptionRef = useRef(null);
  const archDetailsRef = useRef(null);

  const autoResize = (target) => {
    if (!target) return;
    target.style.height = "auto";
    target.style.height = `${Math.max(target.scrollHeight, 60)}px`;
  };

  const handleTextareaChange = (e) => {
    handleChange(e);
    autoResize(e.target);
  };

  // Auto-resize on open or when form data is populated
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (descriptionRef.current) autoResize(descriptionRef.current);
        if (archDetailsRef.current) autoResize(archDetailsRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, formData.description, formData.architecturalDetails]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle Location typing & Philippine API search
  const handleLocationChange = (e) => {
    const query = e.target.value;
    setFormData((prev) => ({ ...prev, location: query }));
    if (fieldErrors.location) {
      setFieldErrors((prev) => ({ ...prev, location: "" }));
    }

    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    if (query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    setIsSearchingLocation(true);
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations/ph?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.locations)) {
            setLocationSuggestions(data.locations);
            setShowLocationDropdown(data.locations.length > 0);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch location suggestions:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);
  };

  const handleSelectLocation = (loc) => {
    setFormData((prev) => ({ ...prev, location: loc }));
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
    if (fieldErrors.location) {
      setFieldErrors((prev) => ({ ...prev, location: "" }));
    }
  };

  // Dynamic features handlers
  const handleFeatureChange = (index, value) => {
    // Smart split if user pastes a comma-separated string
    if (value.includes(",")) {
      const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        setFeaturesList((prev) => {
          const next = [...prev];
          next.splice(index, 1, ...parts);
          return next.length > 0 ? next : [""];
        });
        return;
      }
    }
    setFeaturesList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddFeature = () => {
    setFeaturesList((prev) => {
      const next = [...prev, ""];
      setTimeout(() => {
        const nextIdx = next.length - 1;
        featureInputRefs.current[nextIdx]?.focus();
      }, 50);
      return next;
    });
  };

  const handleRemoveFeature = (index) => {
    setFeaturesList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleFeatureKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === featuresList.length - 1) {
        handleAddFeature();
      } else {
        featureInputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Multi-photo file selection with validation & friendly non-IT warnings
  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError("");

    // 1. Check for non-image files
    const nonImageFiles = files.filter(
      (file) => file.type && !file.type.startsWith("image/")
    );
    if (nonImageFiles.length > 0) {
      setFriendlyError({
        title: "Unsupported File Format",
        message: `We noticed that the selected file (${nonImageFiles.map((f) => f.name).join(", ")}) is not an image. Only image formats (JPG, PNG, WEBP) can be added to the project gallery.`,
        tip: "Please make sure to select image files and not PDFs, Word documents, or installers.",
        type: "warning",
      });
      e.target.value = "";
      return;
    }

    // 2. Check 10MB per-picture limit
    const validFiles = [];
    const oversizedFiles = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (oversizedFiles.length > 0) {
      setFriendlyError({
        title: "Image Too Large (Over 10MB)",
        message: `The ${oversizedFiles.length === 1 ? "image" : "images"} "${oversizedFiles.join(", ")}" exceed the maximum limit of 10MB each and could not be added.`,
        tip: "You can compress the photos or select smaller files before uploading.",
        type: "warning",
      });
    }

    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles]);
      const newUrls = validFiles.map((file) => URL.createObjectURL(file));
      setNewPreviews((prev) => [...prev, ...newUrls]);
      if (fieldErrors.images) {
        setFieldErrors((prev) => ({ ...prev, images: "" }));
      }
    }

    e.target.value = "";
  };

  // Execute Photo Deletion after admin password authorization & confirmation
  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError("Please enter the admin password or PIN to authorize deletion.");
      return;
    }

    setIsVerifyingPassword(true);
    setDeletePasswordError("");

    try {
      const isValid = await verifyAdminPassword(deletePassword);
      if (!isValid) {
        setDeletePasswordError("Incorrect admin password. Please enter a valid admin credential.");
        setIsVerifyingPassword(false);
        return;
      }

      if (photoToDelete.type === "existing") {
        setExistingImages((prev) => prev.filter((_, idx) => idx !== photoToDelete.index));
      } else {
        setNewFiles((prev) => prev.filter((_, idx) => idx !== photoToDelete.index));
        setNewPreviews((prev) => prev.filter((_, idx) => idx !== photoToDelete.index));
      }

      handleCloseDeletePhoto();
    } catch (err) {
      setDeletePasswordError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Pre-submit validation and trigger save confirmation modal
  const handleInitiateSave = (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Project Name validation
    if (!formData.name.trim()) {
      errors.name = "Project name is required and cannot be blank.";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Project name must be at least 3 characters long.";
    }

    // 2. Location validation
    if (!formData.location.trim()) {
      errors.location = "Project location is required (City/Municipality and Province).";
    } else if (formData.location.trim().length < 3) {
      errors.location = "Please enter a valid Philippine location (at least 3 characters).";
    }

    // 3. Category validation ("Other" option requires custom category name)
    if (formData.category === "Other" && !formData.customCategory.trim()) {
      errors.customCategory = "Because you selected 'Other', please specify the custom category name.";
    }

    // 4. Description validation
    if (!formData.description.trim()) {
      errors.description = "Project description is required to explain scope, concept, and materials.";
    } else if (formData.description.trim().length < 15) {
      errors.description = "Project description is too short (minimum 15 characters required).";
    }

    // 5. Photos validation (at least 1 photo required for cover/card)
    const totalPhotos = existingImages.length + newFiles.length;
    if (totalPhotos === 0) {
      errors.images = "At least one project photo is required for the portfolio card and modal showcase.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      // Focus first invalid input or scroll into view
      if (errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (errors.location && locationInputRef.current) {
        locationInputRef.current.focus();
      } else if (errors.description && descriptionRef.current) {
        descriptionRef.current.focus();
      } else if (errors.images && gallerySectionRef.current) {
        gallerySectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const firstKey = Object.keys(errors)[0];
      const errorMeta = {
        name: {
          title: "Project Name Required",
          tip: "Example: 'Modern Zen Sanctuary' or 'Bulacan 2-Storey Villa'.",
        },
        location: {
          title: "Project Location Required",
          tip: "Example: 'Calumpit, Bulacan' or 'Angeles City, Pampanga'.",
        },
        customCategory: {
          title: "Custom Category Required",
          tip: "Example: 'Commercial Warehouse', 'Architectural Renovation', or 'Interior Fit-out'.",
        },
        description: {
          title: "Project Description Required",
          tip: "Example: 'A modern 2-storey duplex featuring turnkey construction, reinforced concrete, and custom cabinetry.'",
        },
        images: {
          title: "Project Photo Required",
          tip: "Every portfolio entry needs at least 1 image to serve as its cover photo on the website.",
        },
      };

      setFriendlyError({
        title: errorMeta[firstKey]?.title || "Required Fields Missing",
        message: errors[firstKey],
        tip: errorMeta[firstKey]?.tip || "Please fill in all fields marked with a red asterisk (*) before saving.",
        type: "warning",
      });
      return;
    }

    setFieldErrors({});

    // Open Save Confirmation Modal
    setShowSaveConfirm(true);
  };

  // Actual Save Handler with 0-100% Upload Progress Tracking
  const executeActualSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);
    setUploadError("");

    try {
      let finalCategory = formData.category;
      if (formData.category === "Other") {
        finalCategory = formData.customCategory.trim() || "Special Project";
      }

      let uploadedUrls = [];
      if (newFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatusText(`Optimizing ${newFiles.length} ${newFiles.length === 1 ? "photo" : "photos"} for web...`);

        // 1. Client-side web compression (scales down 4K/raw phone photos to web-optimal 1920px max, ~300KB)
        const compressedFiles = [];
        for (let i = 0; i < newFiles.length; i++) {
          const comp = await compressImageFile(newFiles[i]);
          compressedFiles.push(comp);
          const prepPercent = Math.round(((i + 1) / newFiles.length) * 30);
          setUploadProgress(prepPercent);
          setUploadStatusText(`Optimizing photo ${i + 1} of ${newFiles.length}...`);
        }

        // 2. Upload in safe chunks of 2 files to guarantee request stays < 2MB (well under Vercel's 4.5MB ceiling)
        const BATCH_SIZE = 2;
        const totalBatches = Math.ceil(compressedFiles.length / BATCH_SIZE);
        const allUrls = [];

        for (let b = 0; b < totalBatches; b++) {
          const batchFiles = compressedFiles.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
          const uploadedSoFar = Math.min((b + 1) * BATCH_SIZE, compressedFiles.length);
          setUploadStatusText(`Uploading photos ${uploadedSoFar} of ${compressedFiles.length} (Batch ${b + 1}/${totalBatches})...`);

          const batchUrls = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const uploadFormData = new FormData();
            batchFiles.forEach((file) => {
              uploadFormData.append("files", file);
            });

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const batchBase = 30 + Math.round((b / totalBatches) * 65);
                const batchProg = Math.round((event.loaded / event.total) * (65 / totalBatches));
                const currentPercent = Math.min(batchBase + batchProg, 98);
                setUploadProgress(currentPercent);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const res = JSON.parse(xhr.responseText);
                  if (res.success && Array.isArray(res.urls)) {
                    resolve(res.urls);
                  } else {
                    reject(new Error(res.message || "Unable to process the server response."));
                  }
                } catch (e) {
                  reject(new Error("Invalid response received from server. Please try again."));
                }
              } else {
                reject(new Error(`Server error (${xhr.status}): Could not upload photos.`));
              }
            };

            xhr.onerror = () => {
              reject(new Error("A network connection error occurred while uploading photos."));
            };

            xhr.open("POST", "/api/upload-multiple?category=portfolio");
            xhr.send(uploadFormData);
          });

          allUrls.push(...batchUrls);
        }

        uploadedUrls = allUrls;
        setUploadProgress(100);
        setUploadStatusText("Photos uploaded successfully! Saving project...");

        // Give a brief moment for the 100% indicator to be seen
        await new Promise((r) => setTimeout(r, 450));
      }

      const parsedFeatures = featuresList
        .map((f) => (typeof f === "string" ? f.trim() : ""))
        .filter(Boolean);

      const finalImages = [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedUrls];

      setUploadStatusText("Saving project details to portfolio database...");

      const saveResult = await onSave({
        ...formData,
        category: finalCategory,
        images: finalImages,
        lotArea: formData.lotArea?.trim() || null,
        floorArea: formData.floorArea?.trim() || null,
        bedrooms: formData.bedrooms?.trim() || null,
        bathrooms: formData.bathrooms?.trim() || null,
        features: parsedFeatures,
        architecturalDetails: formData.architecturalDetails?.trim() || null,
      });

      if (saveResult === false || saveResult?.success === false) {
        throw new Error(
          saveResult?.error ||
          "Unable to complete save to the portfolio database. Please try again."
        );
      }
    } catch (err) {
      console.error("Failed to save project:", err);
      const isNetworkError = err.message && (
        err.message.toLowerCase().includes("network") ||
        err.message.toLowerCase().includes("offline") ||
        err.message.toLowerCase().includes("failed to fetch")
      );
      setFriendlyError({
        title: "Could Not Complete Save",
        message: err.message || "An issue occurred while saving the project.",
        tip: isNetworkError
          ? "Please check your internet connection and try saving again. Your form details and uploaded photos are safely preserved."
          : "Your form details and uploaded photos are safely preserved in this window. You can make adjustments and try saving again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const totalPhotosCount = existingImages.length + newPreviews.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-white/[0.08] rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
              {initialData ? "Edit Project" : "Add New Project"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Portfolio showcase and architectural specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[4px] hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="project-form" onSubmit={handleInitiateSave} noValidate className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Project Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Pampanga Zen Sanctuary"
                className={`w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border text-neutral-900 dark:text-white transition-colors ${
                  fieldErrors.name
                    ? "border-rose-500 ring-1 ring-rose-500/30"
                    : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1.5">
                  <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Location & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location with Philippine Autocomplete */}
              <div ref={locationContainerRef} className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2 flex items-center justify-between">
                  <span>
                    Location (Philippines) <span className="text-rose-500 font-bold">*</span>
                  </span>
                  {isSearchingLocation && (
                    <span className="text-[10px] text-amber-500 font-normal lowercase animate-pulse">
                      searching...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={formData.location}
                    onChange={handleLocationChange}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                    }}
                    placeholder="e.g. Pulilan, Bulacan or Pampanga"
                    className={`w-full pl-10 pr-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border text-neutral-900 dark:text-white transition-colors ${
                      fieldErrors.location
                        ? "border-rose-500 ring-1 ring-rose-500/30"
                        : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    }`}
                  />
                  <MapPinIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {fieldErrors.location && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1.5">
                    <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.location}</span>
                  </p>
                )}

                {/* Autocomplete Suggestions Dropdown */}
                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[4px] shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800">
                      Suggested Philippine Locations
                    </div>
                    {locationSuggestions.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors border-b border-neutral-100 dark:border-neutral-800/40 last:border-0"
                      >
                        <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category with "Other" Custom Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Category <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-neutral-900 dark:text-white transition-colors"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Category)</option>
                </select>
              </div>
            </div>

            {/* Custom Category Input if "Other" is selected */}
            {formData.category === "Other" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[4px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                  Enter Custom Category Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  placeholder="e.g. Industrial Warehouse, Renovation, Interior Fit-out"
                  className={`w-full px-4 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border text-neutral-900 dark:text-white transition-colors text-sm ${
                    fieldErrors.customCategory
                      ? "border-rose-500 ring-1 ring-rose-500/30"
                      : "border-amber-500/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                />
                {fieldErrors.customCategory && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1.5">
                    <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.customCategory}</span>
                  </p>
                )}
              </div>
            )}

            {/* Completion Month & Year Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5 h-5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Completion Month</span>
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-neutral-900 dark:text-white transition-colors"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5 h-5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Completion Year</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-neutral-900 dark:text-white transition-colors"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Status Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Project Development Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-neutral-900 dark:text-white transition-colors font-medium"
              >
                <option value="completed">Completed Project (Fully Constructed)</option>
                <option value="in_progress">In Progress (Active Development & Construction)</option>
                <option value="planning">Planning Phase (Architectural Plans & Blueprints)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Description <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {formData.description.trim().length} chars (min 15)
                </span>
              </div>
              <textarea
                ref={descriptionRef}
                name="description"
                value={formData.description}
                onChange={handleTextareaChange}
                rows={3}
                placeholder="Brief project details, architectural materials, lot size, or scope..."
                className={`w-full px-4 py-3 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border text-neutral-900 dark:text-white transition-all resize-none overflow-hidden ${
                  fieldErrors.description
                    ? "border-rose-500 ring-1 ring-rose-500/30"
                    : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1.5">
                  <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.description}</span>
                </p>
              )}
            </div>

            {/* Architectural & Engineering Specifications */}
            <div className="p-4 rounded-[6px] border border-neutral-200 dark:border-white/[0.08] bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Architectural & Engineering Specifications
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Detailed specs displayed in the project details overlay modal on your website
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Lot Area
                  </label>
                  <input
                    type="text"
                    name="lotArea"
                    value={formData.lotArea}
                    onChange={handleChange}
                    placeholder="e.g. 240 sq.m."
                    className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Floor Area
                  </label>
                  <input
                    type="text"
                    name="floorArea"
                    value={formData.floorArea}
                    onChange={handleChange}
                    placeholder="e.g. 210 sq.m."
                    className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="text"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="e.g. 4 Bedrooms"
                    className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="text"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="e.g. 3 Bathrooms"
                    className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                      Features & Scope Delivered
                    </label>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Add individual deliverables or scope items. Each item is displayed as a numbered specification on the public modal.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {featuresList.filter((f) => f && f.trim()).length} {featuresList.filter((f) => f && f.trim()).length === 1 ? "Item" : "Items"}
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {featuresList.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <span className="shrink-0 w-8 h-9 rounded-[4px] bg-neutral-200/70 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-neutral-300/70 dark:border-white/10 select-none">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <input
                        ref={(el) => (featureInputRefs.current[idx] = el)}
                        id={`feature-input-${idx}`}
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        onKeyDown={(e) => handleFeatureKeyDown(e, idx)}
                        placeholder={
                          idx === 0
                            ? "e.g. Complete Architectural & Engineering Plans"
                            : idx === 1
                            ? "e.g. Turnkey Construction"
                            : idx === 2
                            ? "e.g. Duplex Structure"
                            : idx === 3
                            ? "e.g. 4 Bedrooms"
                            : "Enter scope or feature item..."
                        }
                        className="flex-1 px-3.5 py-2 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        disabled={featuresList.length === 1 && !feature.trim()}
                        className={`shrink-0 p-2 rounded-[4px] border border-transparent transition-all cursor-pointer ${
                          featuresList.length === 1 && !feature.trim()
                            ? "opacity-25 cursor-not-allowed text-neutral-400"
                            : "text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95"
                        }`}
                        title="Delete item"
                        aria-label={`Delete item ${idx + 1}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>

                  <span className="text-[10.5px] text-neutral-500 dark:text-neutral-400 italic">
                    Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono text-[9.5px] not-italic text-neutral-700 dark:text-neutral-300">Enter</kbd> to add row, or paste comma-separated text
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                  Engineering & Structural Compliance Notes
                </label>
                <textarea
                  ref={archDetailsRef}
                  name="architecturalDetails"
                  value={formData.architecturalDetails}
                  onChange={handleTextareaChange}
                  rows={2}
                  placeholder="e.g. Grade 60 Rebars, 3000 PSI Ready-Mix, Signed & Sealed PRC Blueprints..."
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none resize-none overflow-hidden transition-all"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center gap-4 p-4 rounded-[6px] border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Client Web Visibility
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      formData.isWebVisible
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {formData.isWebVisible ? "Live on Web" : "Hidden / Draft"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {formData.status === "in_progress"
                    ? "If enabled, shows on client portfolio with an 'IN PROGRESS Â· PLANS & RENDERS' badge."
                    : formData.status === "planning"
                    ? "If enabled, showcases architectural blueprints & conceptual plans."
                    : "Determines if this project is displayed on the main client portfolio site."}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="isWebVisible"
                  checked={formData.isWebVisible}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Feature on Home Page Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/[0.08] rounded-[6px]">
              <div>
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Feature on Home Page
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      formData.featuredOnHome
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-extrabold"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {formData.featuredOnHome ? "Featured (Home)" : "Projects Page Only"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Feature this project in the curated 6-project showcase on the Homepage. (Max 6 projects total).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="featuredOnHome"
                  checked={formData.featuredOnHome}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Multi-Photo Gallery & Upload */}
            <div ref={gallerySectionRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Project Gallery Photos <span className="text-rose-500 font-bold">*</span> ({totalPhotosCount})
                </label>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  At least 1 photo required (Max 10MB per photo)
                </span>
              </div>

              {fieldErrors.images && (
                <div className="p-3 rounded-[4px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 mb-3">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{fieldErrors.images}</span>
                </div>
              )}

              {/* Photo Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {/* Existing Photos */}
                {existingImages.map((url, idx) => {
                  const allImgs = [...existingImages, ...newPreviews];
                  return (
                    <div
                      key={`existing-${idx}`}
                      onClick={() =>
                        setFullscreenImage({
                          url,
                          index: idx,
                          total: allImgs.length,
                          label: idx === 0 ? "Cover Photo" : `Gallery Photo ${idx + 1}`,
                        })
                      }
                      className="relative group h-24 rounded-[4px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-[2px] bg-amber-500 text-neutral-950 font-bold text-[9px] uppercase shadow z-10">
                          Cover
                        </span>
                      )}

                      {/* Hover Actions: Fullscreen Preview & Delete */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage({
                              url,
                              index: idx,
                              total: allImgs.length,
                              label: idx === 0 ? "Cover Photo" : `Gallery Photo ${idx + 1}`,
                            });
                          }}
                          title="Fullscreen View"
                          className="p-1.5 bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white rounded-[4px] hover:scale-105 transition-transform shadow cursor-pointer"
                        >
                          <Maximize2Icon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeletePhoto({ type: "existing", index: idx, url });
                          }}
                          title="Delete Photo"
                          className="p-1.5 bg-rose-600 text-white rounded-[4px] hover:bg-rose-700 hover:scale-105 transition-transform shadow cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Staged New Photos */}
                {newPreviews.map((url, idx) => {
                  const globalIdx = existingImages.length + idx;
                  const allImgs = [...existingImages, ...newPreviews];
                  return (
                    <div
                      key={`new-${idx}`}
                      onClick={() =>
                        setFullscreenImage({
                          url,
                          index: globalIdx,
                          total: allImgs.length,
                          label: globalIdx === 0 ? "Cover Photo" : `New Upload ${idx + 1}`,
                        })
                      }
                      className="relative group h-24 rounded-[4px] overflow-hidden border-2 border-amber-500/60 bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      <img
                        src={url}
                        alt={`New upload ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-[2px] bg-emerald-500 text-white font-bold text-[9px] uppercase shadow z-10">
                        New
                      </span>

                      {/* Hover Actions: Fullscreen Preview & Delete */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage({
                              url,
                              index: globalIdx,
                              total: allImgs.length,
                              label: globalIdx === 0 ? "Cover Photo" : `New Upload ${idx + 1}`,
                            });
                          }}
                          title="Fullscreen View"
                          className="p-1.5 bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white rounded-[4px] hover:scale-105 transition-transform shadow cursor-pointer"
                        >
                          <Maximize2Icon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeletePhoto({ type: "new", index: idx, url });
                          }}
                          title="Delete Photo"
                          className="p-1.5 bg-rose-600 text-white rounded-[4px] hover:bg-rose-700 hover:scale-105 transition-transform shadow cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Photo Button */}
                <label className="h-24 rounded-[4px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex flex-col items-center justify-center text-neutral-500 hover:text-amber-600 transition-colors cursor-pointer">
                  <PlusIcon className="w-6 h-6 mb-1 text-amber-500" />
                  <span className="text-[11px] font-bold">+ Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                </label>
              </div>

              {/* Upload Helper & Size Note */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-[6px] border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300/90 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <UploadCloudIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Multi-Photo Upload Supported</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
                  Upload multiple architectural perspectives, floor plans, or site progress images.
                  Maximum <strong>10MB per picture</strong>. Formats: JPG, PNG, WEBP.
                </p>
              </div>

              {uploadError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                  {uploadError}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[4px] text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            disabled={isSaving || isUploading}
            className="px-6 py-2.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Project"}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FULLSCREEN LIGHTBOX PREVIEW                                             */}
      {/* ========================================================================= */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Top Header */}
          <div
            className="w-full max-w-6xl flex items-center justify-between z-10 text-white py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-[4px] bg-white/10 border border-white/20 text-xs font-mono text-white/90">
                Photo {fullscreenImage.index + 1} of {fullscreenImage.total}
              </span>
              {fullscreenImage.label && (
                <span className="text-xs font-bold text-amber-400">
                  {fullscreenImage.label}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="px-3 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Close (ESC)"
            >
              <span>Close (ESC)</span>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Central Image View with Navigation Arrows */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenImage.total > 1 && (
              <button
                type="button"
                onClick={() => {
                  const allImgs = [...existingImages, ...newPreviews];
                  const prev = (fullscreenImage.index - 1 + allImgs.length) % allImgs.length;
                  setFullscreenImage({
                    url: allImgs[prev],
                    index: prev,
                    total: allImgs.length,
                    label: prev === 0 ? "Cover Photo" : `Gallery Photo ${prev + 1}`,
                  });
                }}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-xl"
                title="Previous Photo (Arrow Left)"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            <img
              src={fullscreenImage.url}
              alt="Fullscreen View"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-[4px] shadow-2xl border border-white/10"
            />

            {fullscreenImage.total > 1 && (
              <button
                type="button"
                onClick={() => {
                  const allImgs = [...existingImages, ...newPreviews];
                  const next = (fullscreenImage.index + 1) % allImgs.length;
                  setFullscreenImage({
                    url: allImgs[next],
                    index: next,
                    total: allImgs.length,
                    label: next === 0 ? "Cover Photo" : `Gallery Photo ${next + 1}`,
                  });
                }}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-xl"
                title="Next Photo (Arrow Right)"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Caption / Thumbnail indicator */}
          <div
            className="py-2 text-center text-xs text-neutral-400 font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">ESC</kbd> to close, or use arrow keys <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">&larr;</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">&rarr;</kbd> to browse photos
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONFIRMATION MODAL: DELETE PHOTO (PROTECTED BY ADMIN PASSWORD / PIN)   */}
      {/* ========================================================================= */}
      {photoToDelete && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141824] rounded-[8px] border border-neutral-200 dark:border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <TrashIcon className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  Remove This Photo?
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Confirmation to remove photo from gallery
                </p>
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div className="w-full h-36 rounded-[4px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800">
              <img
                src={photoToDelete.url}
                alt="Photo to remove"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to remove this photo? If this is currently the cover photo, the next photo will automatically become the new cover of the project.
            </p>

            {/* Admin Password Authorization Input */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <LockIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Password *</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Required for delete
                </span>
              </div>

              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (deletePasswordError) setDeletePasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmDeletePhoto();
                    }
                  }}
                  placeholder="Enter admin password"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-[4px] bg-neutral-100 dark:bg-neutral-900 border text-xs text-neutral-900 dark:text-white placeholder-neutral-400 transition-colors focus:outline-none ${
                    deletePasswordError
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showDeletePassword ? "Hide password" : "Show password"}
                >
                  {showDeletePassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {deletePasswordError && (
                <div className="flex items-start gap-1.5 text-[11px] text-rose-500 font-medium animate-in fade-in duration-150">
                  <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{deletePasswordError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={handleCloseDeletePhoto}
                disabled={isVerifyingPassword}
                className="px-4 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePhoto}
                disabled={isVerifyingPassword}
                className="px-5 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isVerifyingPassword ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <TrashIcon className="w-3.5 h-3.5" />
                )}
                <span>{isVerifyingPassword ? "Verifying..." : "Yes, Remove Photo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONFIRMATION MODAL: SAVE PROJECT                                       */}
      {/* ========================================================================= */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#141824] rounded-[8px] border border-neutral-200 dark:border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2Icon className="w-7 h-7 text-amber-500 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  Confirm Project Changes
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Review details before saving to your live portfolio
                </p>
              </div>
            </div>

            {/* Project Summary Card */}
            <div className="p-4 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/[0.08] text-xs space-y-2 font-mono">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Name:</span>
                <span className="font-bold text-neutral-900 dark:text-white text-right font-sans">
                  {formData.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Category:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formData.category === "Other" ? formData.customCategory : formData.category}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Location:</span>
                <span className="text-neutral-800 dark:text-neutral-200">
                  {formData.location || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                <span className="uppercase font-bold text-neutral-900 dark:text-white">
                  {formData.status === "completed"
                    ? "Completed"
                    : formData.status === "in_progress"
                    ? "In Progress"
                    : "Planning"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Total Photos:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {totalPhotosCount} {totalPhotosCount === 1 ? "photo" : "photos"}{" "}
                  {newFiles.length > 0 ? `(${newFiles.length} new)` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500 dark:text-neutral-400">Website Status:</span>
                <span
                  className={`font-bold uppercase ${
                    formData.isWebVisible ? "text-emerald-500" : "text-neutral-400"
                  }`}
                >
                  {formData.isWebVisible ? "Live on Client Web" : "Hidden (Draft)"}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              This will update and save the project details to your live portfolio database. Do you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="px-4 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={executeActualSave}
                className="px-6 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <SaveIcon className="w-3.5 h-3.5" />
                <span>Yes, Save Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL-TIME 0-100% UPLOAD PROGRESS OVERLAY                               */}
      {/* ========================================================================= */}
      {isUploading && (
        <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141824] rounded-[8px] border border-neutral-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-5">
            {/* Animated Upload Icon */}
            <div className="relative">
              <UploadCloudIcon className="w-10 h-10 text-amber-500 dark:text-amber-400" />
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
                Uploading Photos
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {uploadStatusText || "Processing files..."}
              </p>
            </div>

            {/* 0-100% Progress Bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-3 rounded-[3px] bg-neutral-200 dark:bg-neutral-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-[2px] bg-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-neutral-500 dark:text-neutral-400">Progress:</span>
                <span className="text-amber-600 dark:text-amber-400 text-sm">
                  {uploadProgress}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xs">
              Please wait while your photos are being uploaded securely to the server. Do not close or refresh this window.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FRIENDLY NON-IT ERROR MODAL                                            */}
      {/* ========================================================================= */}
      {friendlyError && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141824] rounded-[8px] border border-neutral-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <AlertCircleIcon className="w-7 h-7 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  {friendlyError.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {friendlyError.message}
                </p>
              </div>
            </div>

            {/* Friendly Non-IT Tip Box */}
            {friendlyError.tip && (
              <div className="p-3.5 rounded-[6px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300/90 flex items-start gap-2.5">
                <LightbulbIcon className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Tip:</strong> {friendlyError.tip}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setFriendlyError(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-[4px] text-xs font-mono font-bold uppercase bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


