"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  CloseIcon,
  UploadCloudIcon,
  CheckIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  LockIcon,
} from "../../shared/Icons";

export default function AdminUploadModal({ isOpen, onClose, onAddProject }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [category, setCategory] = useState("Residential");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [secondaryImageUrl, setSecondaryImageUrl] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setLocation("");
      setYear(new Date().getFullYear().toString());
      setCategory("Residential");
      setDescription("");
      setImageUrl("");
      setSecondaryImageUrl("");
      setPreviewImages([]);
      setErrorMsg("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle local file selection via FileReader
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setImageUrl(dataUrl);
        setPreviewImages((prev) => [dataUrl, ...prev.slice(0, 1)]);
        setErrorMsg("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (val) => {
    setImageUrl(val);
    if (val.trim()) {
      setPreviewImages([val, secondaryImageUrl].filter(Boolean));
    } else {
      setPreviewImages(secondaryImageUrl ? [secondaryImageUrl] : []);
    }
  };

  const handleSecondaryUrlChange = (val) => {
    setSecondaryImageUrl(val);
    if (val.trim()) {
      setPreviewImages([imageUrl, val].filter(Boolean));
    } else {
      setPreviewImages(imageUrl ? [imageUrl] : []);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a project title.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Please enter the project location.");
      return;
    }

    const finalImages = [imageUrl.trim(), secondaryImageUrl.trim()].filter(Boolean);
    if (finalImages.length === 0) {
      // Provide an architectural fallback image if none provided
      finalImages.push(
        "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1200&h=800&fit=crop&auto=format"
      );
    }

    setIsSubmitting(true);

    const newProject = {
      id: Date.now(),
      name: title.trim(),
      location: location.trim(),
      year: year.trim() || new Date().getFullYear().toString(),
      category: category,
      description: description.trim(),
      images: finalImages,
      isAdminAdded: true,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onAddProject(newProject);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  const categories = [
    "Residential",
    "Commercial",
    "Luxury Villa",
    "Modern Zen",
    "Architectural Renovation",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md transition-opacity">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <LockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white uppercase tracking-tight">
                Admin Project Upload
              </h2>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Publish recent completed work directly to MCPA Portfolio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Title & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Project Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Obsidian Ridge Villa"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Year Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Plaridel, Bulacan or Malolos"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Year Completed
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2025"
                className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Project Photos (Primary & Optional Secondary)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* File upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 text-xs font-mono uppercase transition-all bg-neutral-50 dark:bg-neutral-800/40"
              >
                <UploadCloudIcon className="w-4 h-4 text-amber-500" />
                <span>Upload From Computer</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* URL input */}
              <input
                type="url"
                value={imageUrl.startsWith("data:") ? "[Local File Loaded]" : imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Or paste primary image URL"
                disabled={imageUrl.startsWith("data:")}
                className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-75"
              />
            </div>

            {/* Optional 2nd URL */}
            <input
              type="url"
              value={secondaryImageUrl}
              onChange={(e) => handleSecondaryUrlChange(e.target.value)}
              placeholder="Optional second photo URL (for multi-image dots)"
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors mb-2"
            />

            {/* Live image preview if available */}
            {imageUrl && (
              <div className="relative mt-2 w-full h-36 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-900">
                <Image
                  src={imageUrl}
                  alt="Upload Preview"
                  fill
                  sizes="600px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 text-white text-[10px] font-mono tracking-wider">
                  Live Preview
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Project Description / Architectural Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cantilevered second-storey master suite, custom travertine cladding, and solar micro-grid."
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isSubmitting ? "Publishing..." : "Publish To Portfolio"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
