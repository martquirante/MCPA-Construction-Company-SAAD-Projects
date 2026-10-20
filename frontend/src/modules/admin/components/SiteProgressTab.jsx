"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Film,
  Camera,
  Maximize2,
  X,
  UploadCloud,
  ChevronRight,
  HardHat,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  UserCheck,
  User,
  AlertCircle,
  CheckCircle,
  Play,
  Eye,
  FileVideo,
} from "lucide-react";
import Stage3CustomerSelector from "./Stage3CustomerSelector";
import { authFetch } from "@/modules/shared/authFetch";

export function resolveAdminAvatar(user) {
  if (!user) return null;
  const direct = user.avatar_url || user.avatarUrl;
  if (
    direct &&
    typeof direct === "string" &&
    direct.trim() &&
    direct !== "null" &&
    direct !== "undefined"
  ) {
    return direct.trim();
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mcpa_admin_avatar");
      if (stored && stored.trim() && stored !== "null" && stored !== "undefined") {
        return stored.trim();
      }
    } catch {}
  }

  const email = (user.email || "").toLowerCase().trim();
  const name = (user.full_name || user.fullName || user.name || "").toLowerCase().trim();
  if (
    email.includes("quirante") ||
    email === "dbprojectmartquirante@gmail.com" ||
    email === "martquirante@gmail.com" ||
    email === "martquirante04@gmail.com" ||
    name.includes("raymart") ||
    name.includes("quirante")
  ) {
    return "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c";
  }

  return null;
}

function AdminAvatarPfp({ user, name, size = "w-6 h-6", text = "text-[10px]" }) {
  const avatarUrl = resolveAdminAvatar(user);
  const [hasFailed, setHasFailed] = useState(false);
  const displayName = name || user?.full_name || user?.fullName || user?.name || "Admin";
  const initials = displayName
    .replace(/^Engr\.\s*/i, "")
    .replace(/^Arch\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  if (avatarUrl && !hasFailed) {
    return (
      <div className={`${size} rounded-full overflow-hidden bg-neutral-900 border border-amber-500/40 shrink-0 shadow-xs flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 font-mono font-bold text-amber-600 dark:text-amber-400 ${text} shadow-xs`}>
      {initials}
    </div>
  );
}

export default function SiteProgressTab({
  currentUser = null,
  project = null,
  projects = [],
  milestones = [],
  photos = [],
  onSelectProject,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateVirtualTour,
  onAddPhoto,
  onDeletePhoto,
  showToast,
}) {
  // Modal states
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [activeUpdateMilestone, setActiveUpdateMilestone] = useState(null);
  const [is3DVideoModalOpen, setIs3DVideoModalOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);

  // Admin combobox & accounts state
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [isInspectorDropdownOpen, setIsInspectorDropdownOpen] = useState(false);
  const [isCustomInspector, setIsCustomInspector] = useState(false);
  const inspectorDropdownRef = useRef(null);

  // Fetch registered admin / engineer accounts from database
  useEffect(() => {
    let isMounted = true;
    const loadAdmins = async () => {
      try {
        const res = await authFetch("/api/admin/accounts");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.accounts)) {
            const staffList = data.accounts.filter(
              (acc) =>
                acc.role === "admin" ||
                acc.role === "super_admin" ||
                acc.role === "engineer" ||
                (acc.full_name && acc.full_name.toLowerCase().includes("engr"))
            );
            if (isMounted && staffList.length > 0) {
              setAdminAccounts(staffList);
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch admin list:", e);
      }
    };
    loadAdmins();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close inspector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inspectorDropdownRef.current && !inspectorDropdownRef.current.contains(e.target)) {
        setIsInspectorDropdownOpen(false);
      }
    };
    if (isInspectorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInspectorDropdownOpen]);

  // Combine currentUser, database accounts, and fallback active admins
  const availableAdmins = useMemo(() => {
    const map = new Map();

    // 1. Current logged-in admin if available
    if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName) {
        map.set(uName.toLowerCase(), {
          user_id: currentUser.user_id || currentUser.id || "current",
          full_name: uName,
          email: currentUser.email || "",
          role: currentUser.role || "admin",
          avatar_url: currentUser.avatar_url || currentUser.avatarUrl,
        });
      }
    }

    // 2. Accounts from DB
    adminAccounts.forEach((acc) => {
      const name = acc.full_name || acc.fullName;
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), acc);
      }
    });

    // 3. Fallback active company admins
    const defaults = [
      {
        user_id: 1,
        full_name: "Engr. Raymart Quirante",
        email: "dbprojectmartquirante@gmail.com",
        role: "admin",
        avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocJtqo6hgPKFhgTY1VobAyP9OC7g3kTeHOzrS0D18Z4Zi8A8H0Kk=s96-c",
      },
      {
        user_id: 3,
        full_name: "MCPA Lead Administrator",
        email: "admin@mcpa.com",
        role: "admin",
        avatar_url: null,
      },
    ];

    defaults.forEach((def) => {
      if (!map.has(def.full_name.toLowerCase())) {
        map.set(def.full_name.toLowerCase(), def);
      }
    });

    return Array.from(map.values());
  }, [adminAccounts, currentUser]);

  const getInitialInspector = () => {
    if (project?.lead_engineer && project.lead_engineer !== "Engr. Reyes") {
      return project.lead_engineer;
    }
    if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName) return uName;
    }
    return "Engr. Raymart Quirante";
  };

  // Add Milestone Form state
  const [newPhaseCode, setNewPhaseCode] = useState("");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newWeight, setNewWeight] = useState("20");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Update Milestone Form state
  const [updatePct, setUpdatePct] = useState(0);
  const [updateStatus, setUpdateStatus] = useState("In Progress");
  const [updateNotes, setUpdateNotes] = useState("");
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // 3D Video Walkthrough Form state (Multiple videos supported, no file size limit)
  const [walkthroughVideos, setWalkthroughVideos] = useState([]);
  const [manualWalkthroughUrl, setManualWalkthroughUrl] = useState("");
  const [manualWalkthroughTitle, setManualWalkthroughTitle] = useState("");
  const [walkthroughUploadError, setWalkthroughUploadError] = useState("");
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const [isSavingWalkthrough, setIsSavingWalkthrough] = useState(false);
  const [isHandingOver, setIsHandingOver] = useState(false);
  const walkthroughFileInputRef = useRef(null);
  const walkthroughXhrsRef = useRef({});
  const [boqTrades, setBoqTrades] = useState([]);

  // Resolve initial list of walkthrough videos from project
  const resolveInitialWalkthroughs = useCallback((proj) => {
    if (!proj) return [];
    let list = [];
    if (Array.isArray(proj.virtual_tour_urls) && proj.virtual_tour_urls.length > 0) {
      list = proj.virtual_tour_urls;
    } else if (typeof proj.virtual_tour_urls === "string") {
      try {
        const parsed = JSON.parse(proj.virtual_tour_urls);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    if (list.length === 0 && proj.virtual_tour_url) {
      try {
        const parsed = JSON.parse(proj.virtual_tour_url);
        if (Array.isArray(parsed)) list = parsed;
        else list = [{ url: proj.virtual_tour_url, title: "Full 3D Architectural Walk-Around" }];
      } catch {
        list = [{ url: proj.virtual_tour_url, title: "Full 3D Architectural Walk-Around" }];
      }
    }
    return list
      .map((item, idx) => ({
        id: `vt-init-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file: null,
        previewUrl: typeof item === "string" ? item : item.url,
        url: typeof item === "string" ? item : item.url,
        title: typeof item === "object" && item.title ? item.title : `Walkaround Part ${idx + 1}`,
        name: typeof item === "object" && item.name ? item.name : `Video ${idx + 1}`,
        size: typeof item === "object" && item.size ? item.size : 0,
        isUploading: false,
        uploadProgress: 100,
        error: null,
      }))
      .filter((v) => Boolean(v.url));
  }, []);

  // Friendly error formatter for non-technical users
  const formatFriendlyVideoError = (err) => {
    if (!err) return "";
    const msg = typeof err === "string" ? err : err.message || "";
    const lower = msg.toLowerCase();

    if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("offline") || lower.includes("connection")) {
      return "Nawala po ang koneksyon sa internet habang nag-a-upload. Pakisuri po ang inyong Wi-Fi o data connection at subukan muli.";
    }
    if (lower.includes("format") || lower.includes("type") || lower.includes("mimetype") || lower.includes("not a video")) {
      return "Pakipili po ang isang video file (tulad ng MP4, MOV, o WebM). Hindi po suportado ang ibang uri ng file.";
    }
    if (lower.includes("abort") || lower.includes("cancelled")) {
      return "Kinansela po ang pag-upload ng video.";
    }
    return "Hindi po matapos ang pag-upload ng video sa ngayon. Pakisubukang i-upload muli makalipas ang ilang sandali o i-refresh ang inyong browser.";
  };

  const resetVideoModal = () => {
    if (walkthroughXhrsRef.current) {
      Object.values(walkthroughXhrsRef.current).forEach((xhr) => {
        try {
          xhr.abort();
        } catch {}
      });
      walkthroughXhrsRef.current = {};
    }
    setIs3DVideoModalOpen(false);
    setWalkthroughUploadError("");
    setManualWalkthroughUrl("");
    setManualWalkthroughTitle("");
    setShowAddUrlInput(false);
    if (walkthroughFileInputRef.current) walkthroughFileInputRef.current.value = "";
  };

  const uploadWalkthroughItem = (item) => {
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();
    walkthroughXhrsRef.current[item.id] = xhr;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setWalkthroughVideos((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploadProgress: pct } : it))
        );
      }
    });

    xhr.addEventListener("load", () => {
      delete walkthroughXhrsRef.current[item.id];
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.url) {
            setWalkthroughVideos((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, isUploading: false, uploadProgress: 100, url: data.url, error: null }
                  : it
              )
            );
            if (showToast) {
              showToast(`🎉 "${item.title || item.name}" uploaded successfully!`);
            }
          } else {
            throw new Error(data.message || "Invalid upload response");
          }
        } catch (e) {
          const friendly = formatFriendlyVideoError(e);
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: friendly } : it))
          );
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          const friendly = formatFriendlyVideoError(data.message || "Upload error");
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: friendly } : it))
          );
        } catch {
          setWalkthroughVideos((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Upload failed" } : it))
          );
        }
      }
    });

    xhr.addEventListener("error", () => {
      delete walkthroughXhrsRef.current[item.id];
      setWalkthroughVideos((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Network error during upload" } : it))
      );
    });

    xhr.addEventListener("abort", () => {
      delete walkthroughXhrsRef.current[item.id];
      setWalkthroughVideos((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isUploading: false, error: "Cancelled" } : it))
      );
    });

    xhr.open("POST", "/api/upload?category=portfolio");
    xhr.send(formData);
  };

  const handleWalkthroughFilesSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const newItems = [];

    const defaultLabels = [
      "Full House Walkthrough",
      "Ground Living & Dining",
      "2nd Floor Bedrooms",
      "Facade & Exterior",
      "Roof Deck & Balcony",
      "Kitchen & Utility",
      "Master Suite & Bath",
    ];

    fileList.forEach((file, fileIdx) => {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      if (!isVideo) {
        if (showToast) showToast(`"${file.name}" is not a recognized video file.`);
        return;
      }

      // No size limit on videos! (cloud storage streaming)
      const id = `vt-${Date.now()}-${fileIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const previewUrl = URL.createObjectURL(file);
      const existingCount = walkthroughVideos.length + newItems.length;

      let autoTitle = "";
      if (existingCount < defaultLabels.length) {
        autoTitle = defaultLabels[existingCount];
      } else {
        autoTitle = `Walkaround Zone ${existingCount + 1}`;
      }

      const itemObj = {
        id,
        file,
        previewUrl,
        url: "",
        title: autoTitle,
        name: file.name,
        size: file.size,
        isUploading: true,
        uploadProgress: 0,
        error: null,
      };
      newItems.push(itemObj);
    });

    if (newItems.length === 0) return;
    setWalkthroughUploadError("");
    setWalkthroughVideos((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadWalkthroughItem(item));
  };

  const handleAddManualWalkthroughUrl = () => {
    if (!manualWalkthroughUrl || !manualWalkthroughUrl.trim()) return;
    const url = manualWalkthroughUrl.trim();
    const id = `vt-url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const title = (manualWalkthroughTitle || "").trim() || `Walkaround View ${walkthroughVideos.length + 1}`;

    setWalkthroughVideos((prev) => [
      ...prev,
      {
        id,
        file: null,
        previewUrl: url,
        url,
        title,
        name: url.split("/").pop() || "Direct Video Stream",
        size: 0,
        isUploading: false,
        uploadProgress: 100,
        error: null,
      },
    ]);
    setManualWalkthroughUrl("");
    setManualWalkthroughTitle("");
    setShowAddUrlInput(false);
  };

  const handleRemoveWalkthrough = (id) => {
    if (walkthroughXhrsRef.current[id]) {
      try {
        walkthroughXhrsRef.current[id].abort();
      } catch {}
      delete walkthroughXhrsRef.current[id];
    }
    setWalkthroughVideos((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateWalkthroughTitle = (id, newTitle) => {
    setWalkthroughVideos((prev) =>
      prev.map((it) => (it.id === id ? { ...it, title: newTitle } : it))
    );
  };

  useEffect(() => {
    if (!project?.project_code && !project?.client_project_id) return;
    const projId = project.client_project_id || project.project_code;
    let isMounted = true;
    fetch(`/api/projects/${encodeURIComponent(projId)}/quotation`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.quotation?.items_breakdown && Array.isArray(data.quotation.items_breakdown)) {
          setBoqTrades(data.quotation.items_breakdown);
        }
      })
      .catch((err) => console.warn("[SiteProgressTab] Could not load project BOQ quotation:", err));

    return () => {
      isMounted = false;
    };
  }, [project?.project_code, project?.client_project_id]);

  useEffect(() => {
    setWalkthroughVideos(resolveInitialWalkthroughs(project));
  }, [project?.project_code, project?.virtual_tour_url, project?.virtual_tour_urls, resolveInitialWalkthroughs]);

  // Post Photo/Video Log Form state
  const [logType, setLogType] = useState("Daily Log");
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoInspector, setPhotoInspector] = useState(getInitialInspector);
  const [mediaItems, setMediaItems] = useState([]); // [{ id, file, previewUrl, url, mediaType, name, size, isUploading, uploadProgress, is360, error }]
  const [useManualPhotoUrl, setUseManualPhotoUrl] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [manualMediaType, setManualMediaType] = useState("image");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState(null);
  const photoFileInputRef = useRef(null);

  // Sync photoInspector when project or currentUser changes
  useEffect(() => {
    if (project?.lead_engineer && project.lead_engineer !== "Engr. Reyes") {
      setPhotoInspector(project.lead_engineer);
    } else if (currentUser) {
      const uName = currentUser.fullName || currentUser.full_name || currentUser.name;
      if (uName && (!photoInspector || photoInspector === "Engr. Reyes")) {
        setPhotoInspector(uName);
      }
    }
  }, [project?.lead_engineer, currentUser]);

  const selectedAdminObj = useMemo(() => {
    return (
      availableAdmins.find(
        (a) => (a.full_name || "").trim().toLowerCase() === (photoInspector || "").trim().toLowerCase()
      ) || null
    );
  }, [availableAdmins, photoInspector]);

  const resetPhotoForm = () => {
    setIsAddPhotoOpen(false);
    setPhotoTitle("");
    setPhotoCaption("");
    setMediaItems([]);
    setPhotoUploadError("");
    setUseManualPhotoUrl(false);
    setManualMediaUrl("");
    setIsInspectorDropdownOpen(false);
    setIsCustomInspector(false);
    if (photoFileInputRef.current) photoFileInputRef.current.value = "";
  };

  const uploadMediaItem = (item) => {
    if (!item.file) return;
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setMediaItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploadProgress: pct } : it))
        );
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.url) {
            setMediaItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, url: data.url, isUploading: false, uploadProgress: 100 }
                  : it
              )
            );
          } else {
            throw new Error(data.message || "Upload failed");
          }
        } catch (e) {
          setMediaItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, isUploading: false, error: e.message || "Upload error" }
                : it
            )
          );
        }
      } else {
        setMediaItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, isUploading: false, error: "Upload failed" }
              : it
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      setMediaItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, isUploading: false, error: "Network error during upload" }
            : it
        )
      );
    });

    xhr.open("POST", "/api/upload?category=portfolio");
    xhr.send(formData);
  };

  const handleMediaFilesSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const newItems = [];
    const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB limit strictly for images
    let hasOversizedImage = false;

    for (const file of fileList) {
      const isVid = file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

      if (!isVid && !isImg) {
        if (showToast) showToast(`"${file.name}" is not a supported image or video.`);
        continue;
      }

      // Strict 10MB limit for images ONLY - videos have NO limit
      if (isImg && file.size > MAX_IMG_SIZE) {
        hasOversizedImage = true;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const err = `Larawan "${file.name}" (${sizeMB}MB) ay lumampas sa 10MB limit. Hanggang 10MB lamang po ang mga larawan.`;
        setPhotoUploadError(err);
        if (showToast) showToast(err);
        continue;
      }

      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const localPreview = URL.createObjectURL(file);
      const itemObj = {
        id,
        file,
        previewUrl: localPreview,
        url: "",
        mediaType: isVid ? "video" : "image",
        name: file.name,
        size: file.size,
        isUploading: true,
        uploadProgress: 0,
        is360: false,
        error: null,
      };
      newItems.push(itemObj);
    }

    if (!hasOversizedImage) {
      setPhotoUploadError("");
    }

    if (newItems.length === 0) return;

    setMediaItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadMediaItem(item));
  };

  const handleAddManualUrl = () => {
    if (!manualMediaUrl || !manualMediaUrl.trim()) return;
    const url = manualMediaUrl.trim();
    const isVid = manualMediaType === "video" || /\.(mp4|mov|webm|avi|mkv)$/i.test(url);
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMediaItems((prev) => [
      ...prev,
      {
        id,
        file: null,
        previewUrl: url,
        url,
        mediaType: isVid ? "video" : "image",
        name: url.split("/").pop() || "Direct URL",
        size: 0,
        isUploading: false,
        uploadProgress: 100,
        is360: false,
        error: null,
      },
    ]);
    setManualMediaUrl("");
  };

  const handleRemoveMediaItem = (id) => {
    setMediaItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleToggle360 = (id) => {
    setMediaItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is360: !it.is360 } : it))
    );
  };

  // Handlers
  const handleOpenUpdateModal = (ms) => {
    setActiveUpdateMilestone(ms);
    setUpdatePct(ms.completion_pct || 0);
    setUpdateStatus(ms.status || "In Progress");
    setUpdateNotes(ms.notes || "");
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!activeUpdateMilestone) return;

    setIsSubmittingUpdate(true);
    try {
      const pctNum = Math.min(100, Math.max(0, parseInt(updatePct, 10) || 0));
      const resolvedStatus = pctNum === 100 ? "Completed" : pctNum > 0 ? "In Progress" : "Upcoming";

      await onUpdateMilestone(activeUpdateMilestone.milestone_id, {
        completionPct: pctNum,
        status: resolvedStatus,
        notes: updateNotes,
      });

      if (showToast) showToast(`Milestone updated to ${pctNum}% (${resolvedStatus})`);
      setActiveUpdateMilestone(null);
    } catch (err) {
      if (showToast) showToast("Error updating milestone: " + err.message);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newPhaseCode || !newPhaseName || !project) return;

    setIsSavingMilestone(true);
    try {
      if (onAddMilestone) {
        await onAddMilestone({
          projectCode: project.project_code,
          phaseCode: newPhaseCode,
          phaseName: newPhaseName,
          weight: parseInt(newWeight, 10) || 20,
          targetDate: newTargetDate,
          notes: newNotes,
        });
      } else {
        // Direct API call
        const res = await fetch("/api/construction/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectCode: project.project_code,
            phaseCode: newPhaseCode,
            phaseName: newPhaseName,
            weight: parseInt(newWeight, 10) || 20,
            targetDate: newTargetDate,
            notes: newNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create milestone");
      }

      if (showToast) showToast(`Milestone ${newPhaseCode} added successfully!`);
      setIsAddMilestoneOpen(false);
      setNewPhaseCode("");
      setNewPhaseName("");
      setNewNotes("");
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleImportMilestonesFromBOQ = async () => {
    if (!project || boqTrades.length === 0) return;
    if (!confirm(`Import all ${boqTrades.length} trade categories from the project's BOQ as site milestone phases?`)) return;

    setIsSavingMilestone(true);
    try {
      const evenWeight = Math.max(1, Math.floor(100 / boqTrades.length));
      for (let i = 0; i < boqTrades.length; i++) {
        const trade = boqTrades[i];
        const phaseCode = `M${milestones.length + i + 1}`;
        const itemsNotes = (trade.items || []).map((it) => it.item).filter(Boolean).slice(0, 4).join(", ");
        const phaseWeight = i === boqTrades.length - 1 ? (100 - evenWeight * (boqTrades.length - 1)) : evenWeight;

        if (onAddMilestone) {
          await onAddMilestone({
            projectCode: project.project_code,
            phaseCode,
            phaseName: trade.category,
            weight: phaseWeight,
            targetDate: "",
            notes: itemsNotes,
          });
        } else {
          await fetch("/api/construction/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectCode: project.project_code,
              phaseCode,
              phaseName: trade.category,
              weight: phaseWeight,
              targetDate: "",
              notes: itemsNotes,
            }),
          });
        }
      }
      if (showToast) showToast(`Successfully imported ${boqTrades.length} milestone phases from project BOQ!`);
    } catch (err) {
      if (showToast) showToast("Error importing from BOQ: " + err.message);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleDeleteMilestoneClick = async (milestoneId, phaseCode) => {
    if (!confirm(`Are you sure you want to delete milestone ${phaseCode}?`)) return;
    try {
      if (onDeleteMilestone) {
        await onDeleteMilestone(milestoneId);
      } else {
        const res = await fetch(`/api/construction/milestones/${milestoneId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (showToast) showToast(`Milestone ${phaseCode} deleted.`);
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    }
  };

  const handleSaveWalkthroughVideos = async (e) => {
    e.preventDefault();
    if (!project) return;

    const readyItems = walkthroughVideos.filter((v) => v.url && !v.error);
    if (readyItems.length === 0) {
      setWalkthroughUploadError("Pakipili po o mag-upload ng kahit isang walkthrough video bago i-publish.");
      return;
    }

    const stillUploading = walkthroughVideos.some((v) => v.isUploading);
    if (stillUploading) {
      setWalkthroughUploadError("Pakihintay po munang matapos ang pag-upload ng lahat ng video bago i-publish.");
      return;
    }

    setIsSavingWalkthrough(true);
    setWalkthroughUploadError("");
    try {
      const formattedList = readyItems.map((v, idx) => ({
        url: v.url,
        title: (v.title || "").trim() || `Walkaround View ${idx + 1}`,
        name: v.name || "",
        size: v.size || 0,
      }));
      const primaryUrl = formattedList[0].url;

      const payload = {
        projectCode: project.project_code,
        virtualTourUrl: primaryUrl,
        virtualTourUrls: formattedList,
      };

      if (onUpdateVirtualTour) {
        await onUpdateVirtualTour(payload);
      } else {
        const res = await fetch("/api/construction/virtual-tour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update tour");
      }

      if (showToast) {
        showToast(`🎉 Na-publish ang ${formattedList.length} 3D architectural walk-around video sa client portal!`);
      }
      resetVideoModal();
    } catch (err) {
      const friendly = formatFriendlyVideoError(err);
      setWalkthroughUploadError(friendly);
      if (showToast) showToast(friendly);
    } finally {
      setIsSavingWalkthrough(false);
    }
  };

  const handleSavePhotoLog = async (e) => {
    e.preventDefault();
    if (!photoTitle || !project) return;

    const readyItems = mediaItems.filter((it) => it.url && !it.error);
    if (readyItems.length === 0) {
      setPhotoUploadError("Please attach at least one uploaded photo or video before publishing.");
      return;
    }

    const stillUploading = mediaItems.some((it) => it.isUploading);
    if (stillUploading) {
      setPhotoUploadError("Please wait for all media files to finish uploading before publishing.");
      return;
    }

    setIsSavingPhoto(true);
    setPhotoUploadError("");
    try {
      const fullTitle = `[${logType}] ${photoTitle}`;
      const payload = {
        projectCode: project.project_code,
        title: fullTitle,
        caption: photoCaption,
        inspector: photoInspector,
        imageUrl: readyItems[0].url,
        mediaItems: readyItems.map((it) => ({
          url: it.url,
          mediaType: it.mediaType,
          is360: !!it.is360,
        })),
        is360: readyItems.some((it) => it.is360),
      };

      if (onAddPhoto) {
        await onAddPhoto(payload);
      } else {
        const res = await fetch("/api/construction/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add media log");
      }

      if (showToast) {
        showToast(`🎉 ${readyItems.length} media item(s) published to client portal!`);
      }
      resetPhotoForm();
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
      setPhotoUploadError(err.message || "Failed to publish media update.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhotoClick = async (logId, title) => {
    if (!confirm(`Are you sure you want to delete this media log?\n"${title || "Site Progress Log"}"`)) return;
    setIsDeletingPhotoId(logId);
    try {
      if (onDeletePhoto) {
        await onDeletePhoto(logId);
      } else {
        const res = await fetch(`/api/construction/photos/${logId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (showToast) showToast("Media log deleted successfully.");
    } catch (err) {
      if (showToast) showToast("Error deleting media: " + err.message);
    } finally {
      setIsDeletingPhotoId(null);
    }
  };

  const handleHandoverTurnover = async () => {
    if (!project) return;
    const projectRef = project.client_project_id || project.project_code;
    const confirmMsg = `I-turnover na ba ang proyektong "${project.name || project.project_code}" sa kliyente at i-promote sa Stage 4: Handover & 15-Year Structural Warranty?`;
    if (!confirm(confirmMsg)) return;

    setIsHandingOver(true);
    try {
      const res = await authFetch(`/api/admin/projects/${encodeURIComponent(projectRef)}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStage: "COMPLETED",
          reason: "100% Construction Accomplishment & Formal Turnkey Handover",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) {
          showToast("🎉 Matagumpay na nai-turnover ang proyekto sa Stage 4: Handover & 15-Year Structural Warranty!");
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mcpa-project-stage-updated", {
              detail: {
                clientProjectId: project.client_project_id,
                projectCode: project.project_code,
                targetStage: "COMPLETED",
              },
            })
          );
        }
      } else {
        throw new Error(data.message || "Failed to advance stage to COMPLETED");
      }
    } catch (err) {
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsHandingOver(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STAGE 3 CUSTOMER COMBOBOX */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Stage3CustomerSelector
          selectedProject={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />

        {project && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            <button
              type="button"
              disabled={isHandingOver}
              onClick={handleHandoverTurnover}
              className="px-3 py-2 rounded-[6px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Promote to Stage 4 (Turnover & 15-Year Warranty)"
            >
              {isHandingOver ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>Turn Over (Stage 4)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWalkthroughVideos(resolveInitialWalkthroughs(project));
                setWalkthroughUploadError("");
                setIs3DVideoModalOpen(true);
              }}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-amber-500" />
              <span>3D Walkthrough Videos</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddPhotoOpen(true)}
              className="px-3 py-2 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Post Progress Update</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextNum = milestones.length + 1;
                setNewPhaseCode(`M${nextNum}`);
                setIsAddMilestoneOpen(true);
              }}
              className="px-3.5 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CONDITIONAL VIEW: EMPTY STATE VS ACTIVE PROJECT MANAGEMENT */}
      {!project ? (
        <div className="p-12 text-center rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <HardHat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            No Stage 3 Client Project Selected
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Please use the customer selector above to choose an active construction client. You can configure milestone phases (M1-Mn), update progress %, and upload 3D walkthrough videos.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Project Details Banner */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-neutral-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                    {project.project_code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold">
                    Stage 3 • Active Build
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  {project.name || project.project_title}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.location || project.target_location}</span>
                  <span>•</span>
                  <span>Owner: {project.client_name}</span>
                </p>
              </div>

              {/* Overall Accomplishment Gauge */}
              <div className="lg:text-right min-w-[260px] space-y-1.5">
                <div className="flex items-baseline justify-between lg:justify-end gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 font-mono">
                    Overall % Accomplishment
                  </span>
                  <span className="text-3xl font-extrabold text-amber-500 font-mono">
                    {project.progress_pct || 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress_pct || 0}%` }}
                  />
                </div>
                <p className="text-[10.5px] text-neutral-400 font-mono">
                  Supervising Engineer: {project.lead_engineer || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Timetable Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Mobilization Date</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {project.contract_date || "Pending Mobilization"}
                </span>
              </div>
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Original Turnover</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {project.original_turnover || "Pending Schedule"}
                </span>
              </div>
              <div className="p-3 rounded-[6px] bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5">
                <span className="text-[10px] text-neutral-400 uppercase block">Revised Turnover (Critical Path)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {project.revised_turnover || project.original_turnover || "Pending Schedule"}
                </span>
              </div>
            </div>

            {/* Stage 4 Turnover Callout Banner */}
            {project.stage_id === "COMPLETED" || (project.status || "").toLowerCase().includes("handover") || (project.status || "").toLowerCase().includes("completed") ? (
              <div className="p-4 rounded-[8px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Nasa Stage 4 Na: Handover &amp; 15-Year Structural Warranty</p>
                    <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Naka-unlock na ang Project Wrapped, bago/tapos slider, digital warranty certificate, at turnover photo vault sa client portal.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase text-[10px] shrink-0">
                  Stage 4 Active
                </span>
              </div>
            ) : (project.progress_pct >= 100) ? (
              <div className="p-4 rounded-[8px] bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-5 h-5 shrink-0 animate-pulse text-amber-500" />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">100% Accomplished! Handa na para sa Formal Turnover</p>
                    <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Natapos na ang lahat ng milestone phases. Pindutin ang button upang i-turnover at buksan ang Stage 4 (Warranty &amp; Wrapped) sa client portal.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isHandingOver}
                  onClick={handleHandoverTurnover}
                  className="px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 shadow-xs"
                >
                  {isHandingOver ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Turn Over to Stage 4</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* 3. MILESTONE PHASES LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono">
                  Milestone Phases (M1–Mn) &amp; Accomplishment Controls
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Click &quot;Update Progress&quot; on any milestone to record verified accomplishments with notes. The overall project percentage updates automatically.
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                {milestones.length} {milestones.length === 1 ? "Milestone" : "Milestones"}
              </span>
            </div>

            {milestones.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-dashed border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-400 space-y-3">
                <p>No milestone phases created for {project.project_code} yet.</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhaseCode("M1");
                      setIsAddMilestoneOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Milestone 1</span>
                  </button>

                  {boqTrades.length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingMilestone}
                      onClick={handleImportMilestonesFromBOQ}
                      className="px-3 py-1.5 rounded-[6px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 border border-neutral-200 dark:border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Import {boqTrades.length} Phases from Project BOQ</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((ms, idx) => {
                  const isDone = ms.completion_pct === 100 || ms.status === "Completed";
                  const isInProgress = ms.completion_pct > 0 && ms.completion_pct < 100;
                  return (
                    <div
                      key={ms.milestone_id || idx}
                      className="p-4 sm:p-5 rounded-[8px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold uppercase border border-amber-500/20">
                            {ms.phase_code}
                          </span>
                          <span
                            className={`text-[10.5px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                              isDone
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : isInProgress
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-neutral-100 dark:bg-white/5 text-neutral-500 border-neutral-200 dark:border-white/10"
                            }`}
                          >
                            {ms.status || "Upcoming"}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            Weight: {ms.weight || 20}%
                          </span>
                          {ms.target_date && (
                            <span className="text-[11px] font-mono text-neutral-400">
                              • Target: {ms.target_date}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {ms.phase_name}
                        </h4>
                        {ms.notes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 font-light">
                            {ms.notes}
                          </p>
                        )}
                      </div>

                      {/* Percentage & Actions */}
                      <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-white/5">
                        <div className="text-right min-w-[70px]">
                          <span className="text-xl font-bold font-mono text-amber-500">
                            {ms.completion_pct || 0}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(ms)}
                          className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update Progress</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMilestoneClick(ms.milestone_id, ms.phase_code)}
                          className="p-1.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. SITE PROGRESS & INSPECTION GALLERY (PHOTOS & VIDEOS) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Site Progress &amp; Media Gallery</span>
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Inspection photos and videos published to the client portal. Clients can stream and inspect them directly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  {photos.length} {photos.length === 1 ? "Record" : "Records"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post Media Update</span>
                </button>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] bg-neutral-50 dark:bg-neutral-900/30 border border-dashed border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-400 space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    No site photos or videos posted yet for {project.project_code}.
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Upload multiple photos (max 10MB each) or videos (unlimited size) to show live construction progress to the client.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Site Photos &amp; Videos</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((p, idx) => {
                  const isVideo =
                    p.media_type === "video" ||
                    /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i.test(p.image_url || "");
                  return (
                    <div
                      key={p.log_id || idx}
                      className="group rounded-[10px] bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/[0.08] overflow-hidden shadow-xs hover:border-amber-500/50 transition-all flex flex-col"
                    >
                      {/* Media Thumbnail Container */}
                      <div
                        onClick={() => setPreviewModalItem(p)}
                        className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer"
                      >
                        {isVideo ? (
                          <>
                            <video
                              src={p.image_url}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-11 h-11 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={p.image_url}
                              alt={p.title || "Site Progress"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                          </>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                          {isVideo ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/90 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <Film className="w-3 h-3" />
                              <span>Video</span>
                            </span>
                          ) : p.is_360 ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/90 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider shadow-xs">
                              360° Photo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                              Photo
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            type="button"
                            disabled={isDeletingPhotoId === p.log_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhotoClick(p.log_id, p.title);
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-40"
                            title="Delete Media Record"
                          >
                            {isDeletingPhotoId === p.log_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Date overlay bottom right */}
                        {p.log_date && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-mono text-neutral-300 z-10">
                            {p.log_date}
                          </div>
                        )}
                      </div>

                      {/* Info Body */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1">
                          <h4
                            onClick={() => setPreviewModalItem(p)}
                            className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 cursor-pointer hover:text-amber-500 transition-colors"
                            title={p.title}
                          >
                            {p.title}
                          </h4>
                          {p.caption && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                              {p.caption}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span className="truncate">By {p.inspector || "Field Engineer"}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewModalItem(p)}
                            className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD MILESTONE (M1, M2, M3...) */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add Milestone Phase ({newPhaseCode || "Mn"})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMilestoneOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3.5 text-xs font-mono">
              {boqTrades.length > 0 && (
                <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick-fill from Project BOQ Trades:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {boqTrades.map((trade, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setNewPhaseName(trade.category);
                          if (!newPhaseCode) setNewPhaseCode(`M${milestones.length + 1}`);
                          if (trade.items?.length > 0) {
                            setNewNotes(trade.items.map((it) => it.item).filter(Boolean).slice(0, 4).join(", "));
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#12151e] hover:bg-amber-500 hover:text-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        + {trade.category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Phase Code *</label>
                  <input
                    type="text"
                    required
                    value={newPhaseCode}
                    onChange={(e) => setNewPhaseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. M1, M2"
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Weight (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="e.g. Foundation & Substructure"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Scope / Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Footing tie beams, rebar layout, column starter bars"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMilestone}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer"
                >
                  {isSavingMilestone ? "Saving..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE MILESTONE PROGRESS (%) */}
      {activeUpdateMilestone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">
                  {activeUpdateMilestone.phase_code}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Update Progress: {activeUpdateMilestone.phase_name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveUpdateMilestone(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-500 mb-1">
                  Completion Percentage (0–100%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={updatePct}
                    onChange={(e) => setUpdatePct(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold text-base focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-lg font-bold text-amber-500">%</span>
                </div>

                {/* Quick Increment Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUpdatePct(val)}
                      className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                      {val}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUpdatePct((prev) => Math.min(100, Number(prev || 0) + 10))}
                    className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]"
                  >
                    +10%
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Work Log &amp; Inspection Notes</label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Enter concrete pouring records, rebar tie inspection details..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveUpdateMilestone(null)}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingUpdate ? "Calculating..." : "Apply & Recalculate Overall %"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 3D WALKTHROUGH VIDEO UPLOAD / URL (MULTIPLE VIDEOS) */}
      {is3DVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[14px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 p-4 sm:p-5 shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm sm:text-base font-bold font-mono uppercase text-neutral-900 dark:text-white">
                    3D Architectural Walk-Around Videos
                  </h4>
                  {walkthroughVideos.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                      {walkthroughVideos.length} Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Mag-upload ng maramihang walkthrough videos (hal. Exterior, Ground Floor, 2nd Floor, Roofing) na may sariling label/title para sa client portal.
                </p>
              </div>
              <button
                type="button"
                onClick={resetVideoModal}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1.5 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveWalkthroughVideos} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
              {/* Hidden file input */}
              <input
                ref={walkthroughFileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/*"
                onChange={(e) => {
                  handleWalkthroughFilesSelect(e.target.files);
                  if (e.target) e.target.value = "";
                }}
                className="hidden"
              />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => walkthroughFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-[6px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Videos (Multiple)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUrlInput(!showAddUrlInput);
                      setWalkthroughUploadError("");
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{showAddUrlInput ? "Hide URL Input" : "Add Direct URL"}</span>
                  </button>
                </div>

                <span className="text-[10px] text-neutral-400 font-mono">
                  No size limit • MP4, WebM, MOV
                </span>
              </div>

              {/* Inline Direct URL Card */}
              {showAddUrlInput && (
                <div className="p-3.5 rounded-[8px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Add Direct Video / Streaming Link
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddUrlInput(false)}
                      className="text-neutral-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={manualWalkthroughUrl}
                      onChange={(e) => setManualWalkthroughUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="px-3 py-2 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={manualWalkthroughTitle}
                      onChange={(e) => setManualWalkthroughTitle(e.target.value)}
                      placeholder="Title (e.g. 2nd Floor Bedrooms)"
                      className="px-3 py-2 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!manualWalkthroughUrl.trim()}
                      onClick={handleAddManualWalkthroughUrl}
                      className="px-3 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer text-xs"
                    >
                      + Add to Walkthrough List
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State / Dropzone when no videos */}
              {walkthroughVideos.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) handleWalkthroughFilesSelect(e.dataTransfer.files);
                  }}
                  onClick={() => walkthroughFileInputRef.current?.click()}
                  className="w-full p-10 rounded-[10px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Film className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      Click to select or drag &amp; drop 3D Walk-Around Videos
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-1">
                      Puwede mag-upload ng maramihang videos (Exterior, Ground Floor, 2nd Floor, Roofing) • Walang size limit
                    </p>
                  </div>
                </div>
              ) : (
                /* Videos Queue Cards */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>Attached Walkthrough Videos ({walkthroughVideos.length})</span>
                    <span>Client Portal Order</span>
                  </div>

                  <div className="space-y-2.5">
                    {walkthroughVideos.map((vid, idx) => (
                      <div
                        key={vid.id}
                        className="rounded-[10px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0c0e14] p-3 space-y-2.5 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Video Thumbnail / Preview */}
                          <div className="w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-[6px] overflow-hidden bg-black shrink-0 relative flex items-center justify-center border border-black/20">
                            {vid.previewUrl || vid.url ? (
                              <video
                                src={vid.previewUrl || vid.url}
                                controls
                                playsInline
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center text-neutral-500">
                                <Film className="w-6 h-6 animate-pulse" />
                              </div>
                            )}
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[9.5px] font-mono font-bold">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Video Info & Editable Title */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                  Part / Zone Name (Ipapakita sa client tab)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWalkthrough(vid.id)}
                                  className="text-neutral-400 hover:text-rose-500 p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                                  title="Remove this video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <input
                                type="text"
                                value={vid.title}
                                onChange={(e) => handleUpdateWalkthroughTitle(vid.id, e.target.value)}
                                placeholder="hal. Ground Living & Dining"
                                className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                              />

                              <p className="text-[10px] text-neutral-400 truncate font-mono">
                                {vid.name} {vid.size ? `• ${(vid.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                              </p>
                            </div>

                            {/* Status & Progress */}
                            <div>
                              {vid.isUploading ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10.5px]">
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>
                                        {vid.uploadProgress < 100
                                          ? "Uploading to Cloud Storage..."
                                          : "Finalizing stream..."}
                                      </span>
                                    </span>
                                    <span className="font-bold text-neutral-900 dark:text-white">
                                      {vid.uploadProgress}%
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                                      style={{ width: `${vid.uploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : vid.error ? (
                                <div className="text-[10.5px] text-rose-500 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{vid.error}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-500 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                  <span>Video Attached &amp; Streaming Ready</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more videos dashed drop strip */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files) handleWalkthroughFilesSelect(e.dataTransfer.files);
                    }}
                    onClick={() => walkthroughFileInputRef.current?.click()}
                    className="p-3.5 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-center gap-2 cursor-pointer transition-colors text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300"
                  >
                    <Plus className="w-4 h-4 text-amber-500" />
                    <span>+ Add More Walk-Around Videos</span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {walkthroughUploadError && (
                <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Paunawa sa Pag-Upload
                    </p>
                    <p className="text-[11.5px] leading-relaxed font-sans">{walkthroughUploadError}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                <span className="text-[11px] text-neutral-400 font-mono">
                  {walkthroughVideos.filter((v) => v.url && !v.error).length} of {walkthroughVideos.length} video(s) ready to stream
                </span>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetVideoModal}
                    className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSavingWalkthrough ||
                      walkthroughVideos.some((v) => v.isUploading) ||
                      walkthroughVideos.filter((v) => v.url && !v.error).length === 0
                    }
                    className="px-4 py-2 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    {isSavingWalkthrough ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {walkthroughVideos.length > 1
                            ? `Publish ${walkthroughVideos.length} Walkthrough Videos`
                            : "Publish Walkthrough"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: POST SITE PROGRESS & GALLERY UPDATE (MULTIPLE PHOTOS & VIDEOS) */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[12px] bg-white dark:bg-[#12151e] border border-neutral-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-bold font-mono uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Post Site Progress &amp; Gallery Update</span>
                </h4>
                <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
                  Upload multiple photos (max 10MB) &amp; videos (unlimited size) for the client portal.
                </p>
              </div>
              <button
                type="button"
                onClick={resetPhotoForm}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhotoLog} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Update Frequency *</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Daily Log">Daily Progress Log</option>
                    <option value="Weekly Recap">Weekly Milestone Recap</option>
                    <option value="Inspection Proof">QC Inspection Proof</option>
                  </select>
                </div>
                <div className="relative" ref={inspectorDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-500">Inspector Sign-off</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomInspector((prev) => !prev);
                        setIsInspectorDropdownOpen(false);
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isCustomInspector ? "Admin Pick" : "+ Custom"}
                    </button>
                  </div>

                  {isCustomInspector ? (
                    <input
                      type="text"
                      value={photoInspector}
                      onChange={(e) => setPhotoInspector(e.target.value)}
                      placeholder="e.g. Engr. Santos / QC Inspector"
                      className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsInspectorDropdownOpen((prev) => !prev)}
                        className="w-full px-2.5 py-1.5 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white hover:border-amber-500/50 focus:outline-none focus:border-amber-500 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AdminAvatarPfp
                            user={selectedAdminObj}
                            name={photoInspector}
                            size="w-6 h-6"
                            text="text-[10px]"
                          />
                          <div className="truncate">
                            <span className="font-semibold text-neutral-900 dark:text-white block truncate text-xs">
                              {photoInspector || "Select Admin"}
                            </span>
                            <span className="text-[9.5px] text-neutral-400 dark:text-neutral-500 block truncate">
                              {selectedAdminObj?.role === "super_admin"
                                ? "Super Admin"
                                : selectedAdminObj?.role === "admin"
                                ? "Admin / Engineer"
                                : "Site QC Lead"}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                            isInspectorDropdownOpen ? "rotate-180 text-amber-500" : ""
                          }`}
                        />
                      </button>

                      {isInspectorDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 max-h-56 overflow-y-auto rounded-[8px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 shadow-xl p-1 z-50 space-y-1">
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 border-b border-neutral-100 dark:border-white/5">
                            Authorize As Admin
                          </div>
                          {availableAdmins.map((admin) => {
                            const isSelected =
                              photoInspector.trim().toLowerCase() === (admin.full_name || "").trim().toLowerCase();
                            return (
                              <button
                                key={admin.user_id || admin.email}
                                type="button"
                                onClick={() => {
                                  setPhotoInspector(admin.full_name);
                                  setIsInspectorDropdownOpen(false);
                                }}
                                className={`w-full px-2 py-1.5 rounded-[5px] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                    : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <AdminAvatarPfp
                                    user={admin}
                                    name={admin.full_name}
                                    size="w-6 h-6"
                                    text="text-[10px]"
                                  />
                                  <div className="truncate">
                                    <span className="block truncate text-xs">{admin.full_name}</span>
                                    <span className="block truncate text-[9.5px] text-neutral-400">
                                      {admin.email || admin.role}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              </button>
                            );
                          })}

                          <div className="border-t border-neutral-100 dark:border-white/5 pt-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomInspector(true);
                                setIsInspectorDropdownOpen(false);
                              }}
                              className="w-full px-2 py-1 text-[10.5px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-[4px] text-left flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Type custom inspector name...</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Log Title *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Ground Floor Slab Concreting Complete"
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* MEDIA ATTACHMENTS (PHOTOS & VIDEOS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-500 font-mono text-[11px] font-bold uppercase">
                    Site Progress Media Files *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseManualPhotoUrl(!useManualPhotoUrl)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {useManualPhotoUrl ? (
                      <>
                        <UploadCloud className="w-3 h-3" />
                        <span>Switch to Multi-File Upload</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3 h-3" />
                        <span>Or Add Direct URL</span>
                      </>
                    )}
                  </button>
                </div>

                {useManualPhotoUrl ? (
                  <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={manualMediaType}
                        onChange={(e) => setManualMediaType(e.target.value)}
                        className="px-2.5 py-1.5 rounded-[5px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs cursor-pointer"
                      >
                        <option value="image">Photo (Image)</option>
                        <option value="video">Site Video</option>
                      </select>
                      <input
                        type="url"
                        value={manualMediaUrl}
                        onChange={(e) => setManualMediaUrl(e.target.value)}
                        placeholder="https://.../site-photo.jpg or video.mp4"
                        className="flex-1 px-3 py-1.5 rounded-[5px] bg-white dark:bg-[#151922] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualUrl}
                        disabled={!manualMediaUrl.trim()}
                        className="px-3 py-1.5 rounded-[5px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs cursor-pointer shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Paste a direct link to an image or MP4/WebM video, then click &quot;+ Add&quot;.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Hidden multi-file input */}
                    <input
                      ref={photoFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => handleMediaFilesSelect(e.target.files)}
                      className="hidden"
                    />

                    {/* Drag & drop upload area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files?.length > 0) {
                          handleMediaFilesSelect(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => photoFileInputRef.current?.click()}
                      className="w-full p-6 rounded-[8px] border-2 border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Click to select or drag &amp; drop multiple photos &amp; videos
                        </p>
                        <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Photos:</span> Max 10MB each (PNG, JPG, WebP) •{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Videos:</span> No size limit (MP4, WebM, MOV)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Error Alert */}
                {photoUploadError && (
                  <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{photoUploadError}</span>
                  </div>
                )}

                {/* Queued Media Items List */}
                {mediaItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>
                        Attached Media ({mediaItems.filter((i) => i.url && !i.error).length}/{mediaItems.length} Ready):
                      </span>
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add More Files</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative rounded-[8px] bg-neutral-900 border border-neutral-200 dark:border-white/10 p-2 overflow-hidden flex flex-col justify-between space-y-2"
                        >
                          <div className="relative aspect-video rounded-[6px] overflow-hidden bg-neutral-950 flex items-center justify-center">
                            {item.mediaType === "video" ? (
                              <video
                                src={item.previewUrl || item.url}
                                preload="metadata"
                                muted
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.previewUrl || item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Type Badge */}
                            <span
                              className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                item.mediaType === "video"
                                  ? "bg-amber-500 text-neutral-950"
                                  : "bg-black/70 text-white"
                              }`}
                            >
                              {item.mediaType === "video" ? "Video" : "Photo"}
                            </span>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaItem(item.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                              title="Remove File"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* Upload Spinner Overlay */}
                            {item.isUploading && (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1.5 text-white p-2 text-center">
                                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                <span className="text-[10px] font-mono font-bold">
                                  Uploading {item.uploadProgress}%
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="truncate text-white max-w-[120px]" title={item.name}>
                                {item.name}
                              </span>
                              {item.size > 0 && (
                                <span className="text-neutral-400 shrink-0">
                                  {(item.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>

                            {/* 360 Toggle for images */}
                            {item.mediaType === "image" && (
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={!!item.is360}
                                  onChange={() => handleToggle360(item.id)}
                                  className="rounded border-neutral-600 text-amber-500 focus:ring-0 cursor-pointer"
                                />
                                <span>360° Panorama Photo</span>
                              </label>
                            )}

                            {/* Status indicator */}
                            {item.url && !item.isUploading && !item.error && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-emerald-400">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Uploaded &amp; Mirrored</span>
                              </span>
                            )}
                            {item.error && (
                              <span className="text-[9.5px] font-mono text-rose-400 truncate block">
                                {item.error}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Engineer Notes / Field Summary</label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Describe on-site accomplishments, cement curing status, or rebar count..."
                  className="w-full px-3 py-2 rounded-[6px] bg-neutral-50 dark:bg-[#0c0e14] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={resetPhotoForm}
                  className="px-3 py-1.5 rounded-[6px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSavingPhoto ||
                    mediaItems.some((it) => it.isUploading) ||
                    mediaItems.filter((it) => it.url && !it.error).length === 0 ||
                    !photoTitle
                  }
                  className="px-4 py-1.5 rounded-[6px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {isSavingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : mediaItems.some((it) => it.isUploading) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Files...</span>
                    </>
                  ) : (
                    <span>
                      Publish {mediaItems.filter((it) => it.url && !it.error).length}{" "}
                      {mediaItems.filter((it) => it.url && !it.error).length === 1 ? "Item" : "Items"} to Client
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: FULL PREVIEW FOR PHOTOS & VIDEOS */}
      {previewModalItem && (
        <div
          onClick={() => setPreviewModalItem(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-neutral-900 border border-white/10 rounded-[12px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-950/60">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-white truncate font-mono">
                  {previewModalItem.title || "Site Progress Media"}
                </h4>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Inspector: {previewModalItem.inspector || "Field Engineer"} • {previewModalItem.log_date || "Live"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Media Player */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px] max-h-[68vh] overflow-hidden">
              {previewModalItem.media_type === "video" ||
              /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i.test(previewModalItem.image_url || "") ? (
                <video
                  src={previewModalItem.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[65vh] rounded-[6px]"
                />
              ) : (
                <img
                  src={previewModalItem.image_url}
                  alt={previewModalItem.title}
                  className="max-w-full max-h-[65vh] object-contain rounded-[6px]"
                />
              )}
            </div>

            {/* Lightbox Footer Notes */}
            {previewModalItem.caption && (
              <div className="p-3.5 border-t border-white/10 bg-neutral-950/80 text-xs text-neutral-300">
                <span className="font-bold text-amber-500 font-mono text-[11px] block mb-0.5">FIELD NOTES:</span>
                <p className="font-sans leading-relaxed">{previewModalItem.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
