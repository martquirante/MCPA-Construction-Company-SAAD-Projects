"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Send,
  Plus,
  Edit,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  MousePointer,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Upload,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Calendar,
  Settings,
  Layers,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Type,
  Layout,
  Check,
  X,
  Play
} from "lucide-react";
import { authFetch } from "@/modules/shared/authFetch";

// Official MCPA Website Page Links for Email Link Comboboxes
const MCPA_SITE_LINKS = [
  { label: "Home Page (Hero & Overview)", url: "https://mcpaconstruction.com/", path: "/" },
  { label: "Projects & Portfolio Showcase", url: "https://mcpaconstruction.com/projects", path: "/projects" },
  { label: "Design & Build Services", url: "https://mcpaconstruction.com/services", path: "/services" },
  { label: "Our 5-Stage Turnkey Process", url: "https://mcpaconstruction.com/process", path: "/process" },
  { label: "Book Consultation / Inquire", url: "https://mcpaconstruction.com/book", path: "/book" },
  { label: "Company Updates & Milestones", url: "https://mcpaconstruction.com/updates", path: "/updates" },
  { label: "Architectural Blog & Articles", url: "https://mcpaconstruction.com/blog", path: "/blog" },
  { label: "Client Portal & Project Hub", url: "https://mcpaconstruction.com/portal", path: "/portal" },
  { label: "Safety Standards & DPA Compliance", url: "https://mcpaconstruction.com/safety", path: "/safety" },
  { label: "Terms & Conditions", url: "https://mcpaconstruction.com/terms", path: "/terms" },
  { label: "Privacy Policy", url: "https://mcpaconstruction.com/privacy", path: "/privacy" },
];

export default function AdminEmailMarketingTab({ showToast = () => {} }) {
  // Navigation Subtabs & Combobox
  const [activeSubTab, setActiveSubTab] = useState("overview"); // overview, campaigns, templates, subscribers, audience, scheduled, analytics, settings
  const [isTabComboboxOpen, setIsTabComboboxOpen] = useState(false);
  const [tabComboboxQuery, setTabComboboxQuery] = useState("");
  const tabComboboxRef = useRef(null);

  // State: Metrics & Dashboard Data
  const [metrics, setMetrics] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    unsubscribedCount: 0,
    registeredOptedIn: 0,
    inquiriesOptedIn: 0,
    totalCampaigns: 0,
    sentCampaigns: 0,
    scheduledCampaigns: 0,
    totalRecipients: 0,
    totalSent: 0,
    totalDelivered: 0,
    openRate: 0,
    clickRate: 0,
    failedCount: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // State: Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // State: Templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // State: Subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberFilter, setSubscriberFilter] = useState("all");
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberTotal, setSubscriberTotal] = useState(0);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // State: Campaign Editor / Visual Builder
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorCampaign, setEditorCampaign] = useState(null);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop (600px), tablet (768px), mobile (375px)
  const [previewMode, setPreviewMode] = useState("html"); // html | text
  const [mobileEditorTab, setMobileEditorTab] = useState("editor"); // "editor" | "preview" (for mobile-first responsiveness)
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // State: AI Copy Assistant Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLanguage, setAiLanguage] = useState("en"); // en | tl
  const [aiAction, setAiAction] = useState("subject_lines"); // subject_lines | generate_copy
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  // State: Multi-file uploading & Logo Drag/Drop
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaFileInputRef = useRef(null);
  const [isDraggingOverLogo, setIsDraggingOverLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef(null);

  // 1. Fetch Overview Metrics
  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await authFetch("/api/email-marketing/overview");
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
        setRecentCampaigns(data.recentCampaigns || []);
      }
    } catch (err) {
      console.error("Error fetching overview metrics:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // 2. Fetch Campaigns
  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await authFetch(`/api/email-marketing/campaigns?status=${campaignFilter}`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // 3. Fetch Templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await authFetch("/api/email-marketing/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // 4. Fetch Subscribers
  const fetchSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const res = await authFetch(
        `/api/email-marketing/subscribers?status=${subscriberFilter}&search=${encodeURIComponent(
          subscriberSearch
        )}&page=${subscriberPage}&limit=25`
      );
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setSubscriberTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Trigger loads based on subtab
  useEffect(() => {
    if (activeSubTab === "overview") fetchOverview();
    if (activeSubTab === "campaigns" || activeSubTab === "scheduled") fetchCampaigns();
    if (activeSubTab === "templates") fetchTemplates();
    if (activeSubTab === "subscribers" || activeSubTab === "audience") fetchSubscribers();
  }, [activeSubTab, campaignFilter, subscriberFilter, subscriberSearch, subscriberPage]);

  // Initial load
  useEffect(() => {
    fetchOverview();
  }, []);

  // Close Combobox on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (tabComboboxRef.current && !tabComboboxRef.current.contains(event.target)) {
        setIsTabComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close Combobox on Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsTabComboboxOpen(false);
      }
    }
    if (isTabComboboxOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isTabComboboxOpen]);

  // -------------------------------------------------------------
  // Visual Email Builder Handlers
  // -------------------------------------------------------------
  const handleOpenNewCampaign = () => {
    setEditorCampaign({
      campaign_id: null,
      title: "New Architectural Campaign",
      subject: "Exclusive MCPA Architectural Update & Project Highlights",
      preview_text: "Discover our latest structural milestones and design innovations.",
      from_name: "MCPA Construction & Supply",
      from_email: "contact@mcpaconstruction.com",
      reply_to: "contact@mcpaconstruction.com",
      target_audience: "ALL_SUBSCRIBERS",
      logo_config: {
        position: "top-center",
        width: 180,
        height: "auto",
        padding: 20,
        link: "https://mcpaconstruction.com",
        src: "/assets/email/email_logo_dark.png",
      },
      blocks: [
        {
          id: `heading-${Date.now()}`,
          type: "heading",
          data: {
            text: "Building with Confidence: 2026 Structural Showcase",
            level: "h1",
            align: "center",
            color: "#0f172a",
          },
        },
        {
          id: `sub-${Date.now()}`,
          type: "subheading",
          data: {
            text: "Engineered Excellence Across Central Luzon",
            align: "center",
            color: "#d97706",
          },
        },
        {
          id: `img-${Date.now()}`,
          type: "image",
          data: {
            src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern Residence Showcase",
            caption: "Custom Scandinavian Residence in Bulacan by MCPA",
            align: "center",
            link: "https://mcpaconstruction.com/projects",
          },
        },
        {
          id: `p-${Date.now()}`,
          type: "paragraph",
          data: {
            text: "We are excited to share our recently completed two-storey modern architectural projects. With our licensed site engineers, earthquake-resistant design, and in-house wholesale material supply, MCPA offers complete end-to-end design and construction with guaranteed quality.",
            align: "left",
            color: "#334155",
          },
        },
        {
          id: `btn-${Date.now()}`,
          type: "button",
          data: {
            text: "Explore Our Portfolio",
            url: "https://mcpaconstruction.com/projects",
            align: "center",
            bgColor: "#d97706",
            textColor: "#ffffff",
            borderRadius: 8,
          },
        },
        {
          id: `footer-${Date.now()}`,
          type: "footer",
          data: {
            company: "MCPA Construction & Supply",
            address: "Plaridel, Bulacan, Philippines",
            phone: "+63 917 123 4567",
            website: "https://mcpaconstruction.com",
          },
        },
      ],
      scheduled_at: null,
      is_recurring: false,
      recurring_pattern: "MONTHLY",
    });
    setMobileEditorTab("editor");
    setIsEditorOpen(true);
  };

  const handleEditCampaign = async (camp) => {
    try {
      const res = await authFetch(`/api/email-marketing/campaigns/${camp.campaign_id}`);
      const data = await res.json();
      if (data.success && data.campaign) {
        setEditorCampaign(data.campaign);
        setMobileEditorTab("editor");
        setIsEditorOpen(true);
      }
    } catch (err) {
      showToast("Error loading campaign details.", "error");
    }
  };

  const handleUseTemplate = (tpl) => {
    setEditorCampaign({
      campaign_id: null,
      title: `Campaign from ${tpl.title}`,
      subject: tpl.subject_default || "MCPA Construction Update",
      preview_text: tpl.preview_text || "",
      from_name: "MCPA Construction & Supply",
      from_email: "contact@mcpaconstruction.com",
      reply_to: "contact@mcpaconstruction.com",
      target_audience: "ALL_SUBSCRIBERS",
      logo_config: {
        position: "top-center",
        width: 180,
        height: "auto",
        padding: 20,
        link: "https://mcpaconstruction.com",
        src: "/assets/email/email_logo_dark.png",
      },
      blocks: Array.isArray(tpl.blocks) ? JSON.parse(JSON.stringify(tpl.blocks)) : [],
      scheduled_at: null,
      is_recurring: false,
    });
    setMobileEditorTab("editor");
    setIsEditorOpen(true);
    showToast(`Template loaded into campaign editor!`, "success");
  };

  // Block Manipulation
  const handleAddBlock = (type) => {
    if (!editorCampaign) return;
    const newBlock = {
      id: `${type}-${Date.now()}`,
      type,
      data: getDefaultBlockData(type),
    };
    setEditorCampaign({
      ...editorCampaign,
      blocks: [...(editorCampaign.blocks || []), newBlock],
    });
  };

  const handleUpdateBlock = (id, updatedData) => {
    if (!editorCampaign) return;
    setEditorCampaign({
      ...editorCampaign,
      blocks: editorCampaign.blocks.map((b) =>
        b.id === id ? { ...b, data: { ...b.data, ...updatedData } } : b
      ),
    });
  };

  const handleRemoveBlock = (id) => {
    if (!editorCampaign) return;
    setEditorCampaign({
      ...editorCampaign,
      blocks: editorCampaign.blocks.filter((b) => b.id !== id),
    });
  };

  const handleMoveBlock = (index, direction) => {
    if (!editorCampaign) return;
    const blocks = [...editorCampaign.blocks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    setEditorCampaign({ ...editorCampaign, blocks });
  };

  function getDefaultBlockData(type) {
    switch (type) {
      case "heading":
        return { text: "Architectural Design Spotlight", level: "h2", align: "left", color: "#0f172a" };
      case "subheading":
        return { text: "Modern Innovations in Central Luzon", align: "left", color: "#d97706" };
      case "paragraph":
        return { text: "Enter your custom campaign description here. Describe your latest milestones, materials arrival, or architectural updates.", align: "left", color: "#334155" };
      case "image":
        return { src: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80", alt: "Construction Project", caption: "", align: "center", link: "" };
      case "gallery":
        return {
          images: [
            { src: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=600&q=80", caption: "Foundation Inspection" },
            { src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80", caption: "Structural Curing" },
          ],
        };
      case "video":
        return { thumbnail: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80", url: "https://mcpaconstruction.com", title: "Watch Project Walkthrough" };
      case "button":
        return { text: "Inquire About This Project", url: "https://mcpaconstruction.com/inquire", align: "center", bgColor: "#d97706", textColor: "#ffffff", borderRadius: 8 };
      case "divider":
        return { color: "#e2e8f0" };
      case "spacer":
        return { height: 24 };
      case "social":
        return { facebook: "https://facebook.com/mcpaconstruction", instagram: "https://instagram.com/mcpaconstruction", tiktok: "https://tiktok.com/@mcpa.construction" };
      case "contact":
        return { name: "MCPA Construction & Supply", address: "Plaridel, Bulacan, Philippines", phone: "(0949) 775 8239", email: "contact@mcpaconstruction.com" };
      case "footer":
        return { company: "MCPA Construction & Supply", address: "Bulacan, Philippines" };
      case "custom_html":
        return { html: "<div style='padding: 10px; background: #f8fafc; border-radius: 6px; text-align: center; color: #64748b; font-size: 13px;'>Custom HTML Container</div>" };
      default:
        return {};
    }
  }

  // -------------------------------------------------------------
  // Dedicated Drag & Drop / Upload Handler for Campaign Logo
  // -------------------------------------------------------------
  const handleApplyLogoFile = async (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      showToast("Please select or drop an image file (PNG, JPG, SVG, WebP).", "error");
      return;
    }

    // 1. Instant local preview via DataURL so user immediately sees their logo
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      if (editorCampaign) {
        setEditorCampaign((prev) => ({
          ...prev,
          logo_config: {
            ...(prev?.logo_config || {}),
            src: dataUrl,
          },
        }));
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to backend/cloud to get a persistent public URL
    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("files", file);

      const res = await authFetch("/api/email-marketing/upload-media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media?.[0]?.url) {
        const uploadedUrl = data.media[0].url;
        setEditorCampaign((prev) => ({
          ...prev,
          logo_config: {
            ...(prev?.logo_config || {}),
            src: uploadedUrl,
          },
        }));
        showToast("MCPA brand logo updated and uploaded successfully!", "success");
      } else {
        showToast("Logo applied to email builder.", "success");
      }
    } catch (err) {
      console.error("Error uploading logo:", err);
      showToast("Logo applied locally to campaign.", "success");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // -------------------------------------------------------------
  // Real Multi-File Upload Handler (Photos & Videos)
  // Constraint: Must be actual file uploads, supporting multiple files!
  // -------------------------------------------------------------
  const handleUploadMediaFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setIsUploadingMedia(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await authFetch("/api/email-marketing/upload-media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media) {
        showToast(`Successfully uploaded ${data.media.length} media file(s)!`, "success");

        // Automatically add uploaded files as image/gallery or video blocks
        if (editorCampaign) {
          const newBlocks = [...editorCampaign.blocks];
          data.media.forEach((m) => {
            if (m.isVideo) {
              newBlocks.push({
                id: `video-${Date.now()}-${Math.random()}`,
                type: "video",
                data: {
                  url: m.url,
                  title: m.filename,
                  thumbnail: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80",
                },
              });
            } else {
              newBlocks.push({
                id: `img-${Date.now()}-${Math.random()}`,
                type: "image",
                data: {
                  src: m.url,
                  alt: m.filename,
                  caption: m.filename,
                  align: "center",
                },
              });
            }
          });
          setEditorCampaign({ ...editorCampaign, blocks: newBlocks });
        }
      } else {
        showToast(data.message || "Upload failed.", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("File upload error: " + err.message, "error");
    } finally {
      setIsUploadingMedia(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    }
  };

  // -------------------------------------------------------------
  // Save Campaign (Draft or Scheduled)
  // -------------------------------------------------------------
  const handleSaveCampaign = async (targetStatus = "DRAFT") => {
    if (!editorCampaign.title || !editorCampaign.subject) {
      showToast("Campaign title and subject are required.", "error");
      return;
    }

    try {
      const payload = {
        ...editorCampaign,
        status: targetStatus,
      };

      const isUpdate = Boolean(editorCampaign.campaign_id);
      const url = isUpdate
        ? `/api/email-marketing/campaigns/${editorCampaign.campaign_id}`
        : "/api/email-marketing/campaigns";
      const method = isUpdate ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          targetStatus === "SCHEDULED"
            ? "Campaign scheduled successfully!"
            : "Campaign draft saved!",
          "success"
        );
        setIsEditorOpen(false);
        fetchCampaigns();
        fetchOverview();
      } else {
        showToast(data.message || "Failed to save campaign.", "error");
      }
    } catch (err) {
      showToast("Error saving campaign: " + err.message, "error");
    }
  };

  // -------------------------------------------------------------
  // Send Immediate Dispatch
  // -------------------------------------------------------------
  const handleSendNow = async (campaignId) => {
    if (!confirm("Are you sure you want to dispatch this email campaign now to all eligible subscribers? This cannot be undone.")) {
      return;
    }

    try {
      const res = await authFetch(`/api/email-marketing/campaigns/${campaignId}/send-now`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Campaign dispatch started!", "success");
        fetchCampaigns();
        fetchOverview();
        if (isEditorOpen) setIsEditorOpen(false);
      } else {
        showToast(data.message || "Failed to send campaign.", "error");
      }
    } catch (err) {
      showToast("Error triggering send: " + err.message, "error");
    }
  };

  // -------------------------------------------------------------
  // Send Test Email to Developer / Admin
  // -------------------------------------------------------------
  const handleSendTestEmail = async () => {
    const targetEmail = (testEmailAddress || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      showToast("Please enter a valid test recipient email address.", "error");
      return;
    }

    try {
      setSendingTest(true);

      // Directly dispatch current live editorCampaign to the test endpoint
      const res = await authFetch("/api/email-marketing/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: targetEmail,
          campaign: editorCampaign,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Test email delivered to ${targetEmail}! Please check inbox/spam.`, "success");
      } else {
        showToast(data.message || "Test email delivery failed.", "error");
      }
    } catch (err) {
      showToast("Error sending test email: " + err.message, "error");
    } finally {
      setSendingTest(false);
    }
  };

  // -------------------------------------------------------------
  // AI Copywriting Assistant
  // -------------------------------------------------------------
  const handleRunAiAssist = async () => {
    if (!aiTopic.trim()) {
      showToast("Please enter a topic for the AI assistant.", "error");
      return;
    }

    try {
      setAiLoading(true);
      setAiResults(null);

      const res = await authFetch("/api/email-marketing/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAction,
          topic: aiTopic,
          tone: aiTone,
          language: aiLanguage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        let parsed = data.result;
        try {
          if (typeof parsed === "string") {
            const clean = parsed.replace(/```json/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(clean);
          }
        } catch (e) {
          // Keep as string
        }
        setAiResults(parsed);
      } else {
        showToast(data.message || "AI generation failed.", "error");
      }
    } catch (err) {
      showToast("AI Assistant error: " + err.message, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSubject = (sub) => {
    if (!editorCampaign) return;
    setEditorCampaign({
      ...editorCampaign,
      subject: sub.subject,
      preview_text: sub.preview || editorCampaign.preview_text,
    });
    setIsAiModalOpen(false);
    showToast("Applied subject line to campaign!", "success");
  };

  const handleApplyAiBody = (body) => {
    if (!editorCampaign) return;
    const newBlocks = [...editorCampaign.blocks];
    if (body.heading) {
      newBlocks.unshift({
        id: `heading-${Date.now()}`,
        type: "heading",
        data: { text: body.heading, level: "h1", align: "center", color: "#0f172a" },
      });
    }
    if (body.subheading) {
      newBlocks.splice(1, 0, {
        id: `sub-${Date.now()}`,
        type: "subheading",
        data: { text: body.subheading, align: "center", color: "#d97706" },
      });
    }
    if (body.paragraph) {
      newBlocks.push({
        id: `p-${Date.now()}`,
        type: "paragraph",
        data: { text: body.paragraph, align: "left", color: "#334155" },
      });
    }
    if (body.cta) {
      newBlocks.push({
        id: `btn-${Date.now()}`,
        type: "button",
        data: { text: body.cta, url: "https://mcpaconstruction.com/inquire", align: "center", bgColor: "#d97706", textColor: "#ffffff", borderRadius: 8 },
      });
    }

    setEditorCampaign({ ...editorCampaign, blocks: newBlocks });
    setIsAiModalOpen(false);
    showToast("Applied AI generated copy to campaign!", "success");
  };

  return (
    <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100">
      {!isEditorOpen && (
        <>
          {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Email Marketing & Campaigns
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Targeted project briefings, milestone showcases, consent tracking & visual campaign builder
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewCampaign}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Combobox Bar */}
      {(() => {
        const EMAIL_TABS = [
          { id: "overview", label: "Overview", icon: Layout, description: "Metrics, recent deliveries & quick insights" },
          { id: "campaigns", label: "Campaigns", icon: Send, badge: metrics.totalCampaigns, description: "Drafts, blasts & campaign management" },
          { id: "templates", label: "Email Templates", icon: Layers, description: "Reusable architectural newsletters" },
          { id: "subscribers", label: "Subscribers", icon: Users, badge: metrics.activeSubscribers, description: "Audience contacts, statuses & consent" },
          { id: "audience", label: "Audience & Segments", icon: Filter, description: "Target segments & DPA compliance filters" },
          { id: "scheduled", label: "Scheduled Emails", icon: Clock, badge: metrics.scheduledCampaigns, description: "Automated recurring sends & calendar releases" },
          { id: "analytics", label: "Email Analytics", icon: MousePointer, description: "Open rates, CTR & conversion tracking" },
          { id: "settings", label: "Settings", icon: Settings, description: "Sender credentials & delivery settings" },
        ];
        const currentTab = EMAIL_TABS.find((t) => t.id === activeSubTab) || EMAIL_TABS[0];
        const CurrentTabIcon = currentTab.icon;
        const filteredTabs = EMAIL_TABS.filter((t) =>
          t.label.toLowerCase().includes(tabComboboxQuery.toLowerCase().trim())
        );

        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800 relative z-30">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 shrink-0">
                View / Section:
              </span>

              {/* Combobox Dropdown */}
              <div className="relative" ref={tabComboboxRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTabComboboxOpen(!isTabComboboxOpen);
                    setTabComboboxQuery("");
                  }}
                  className={`group flex items-center justify-between gap-3 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-mono border transition-all cursor-pointer shadow-xs min-w-[240px] sm:min-w-[270px] ${
                    isTabComboboxOpen
                      ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-neutral-950 dark:text-white ring-2 ring-amber-500/20"
                      : "bg-white dark:bg-[#10131a] hover:bg-neutral-100 dark:hover:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isTabComboboxOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
                      <CurrentTabIcon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 truncate text-left">
                      <span className="font-bold text-xs tracking-tight text-neutral-900 dark:text-white truncate">
                        {currentTab.label}
                      </span>
                      {currentTab.badge !== undefined && currentTab.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 shrink-0">
                          {currentTab.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${
                      isTabComboboxOpen
                        ? "rotate-180 text-amber-500"
                        : "group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
                    }`}
                  />
                </button>

                {/* Dropdown Popover */}
                {isTabComboboxOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0f1117] border border-neutral-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="p-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/60 dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-500" />
                          Email Marketing Views
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {EMAIL_TABS.length} sections
                        </span>
                      </div>

                      {/* Quick Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search section..."
                          value={tabComboboxQuery}
                          onChange={(e) => setTabComboboxQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                          autoFocus
                        />
                        {tabComboboxQuery && (
                          <button
                            type="button"
                            onClick={() => setTabComboboxQuery("")}
                            className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5">
                      {filteredTabs.length === 0 ? (
                        <div className="p-4 text-center text-xs font-mono text-neutral-400">
                          No matching section found
                        </div>
                      ) : (
                        filteredTabs.map((tab) => {
                          const TabIcon = tab.icon;
                          const isSelected = activeSubTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveSubTab(tab.id);
                                setIsTabComboboxOpen(false);
                              }}
                              className={`w-full group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                                  : "hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`p-1 rounded-lg shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-neutral-950/20 text-neutral-950"
                                      : "bg-neutral-100 dark:bg-neutral-800 text-amber-500"
                                  }`}
                                >
                                  <TabIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isSelected ? "text-neutral-950" : "text-neutral-900 dark:text-white"
                                      }`}
                                    >
                                      {tab.label}
                                    </span>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                          isSelected
                                            ? "bg-neutral-950 text-amber-400"
                                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                        }`}
                                      >
                                        {tab.badge}
                                      </span>
                                    )}
                                  </div>
                                  {tab.description && (
                                    <p
                                      className={`text-[10px] font-mono truncate ${
                                        isSelected ? "text-neutral-950/80" : "text-neutral-400"
                                      }`}
                                    >
                                      {tab.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {isSelected && <Check className="w-4 h-4 text-neutral-950 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Section Quick Badge / Status */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Active:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1.5">
                <CurrentTabIcon className="w-3.5 h-3.5" />
                <span>{currentTab.label}</span>
                {currentTab.badge !== undefined && currentTab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-neutral-950 font-bold ml-1">
                    {currentTab.badge}
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SUBTAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeSubTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Active Subscribers", value: metrics.activeSubscribers, icon: Users, color: "text-amber-500" },
              { label: "Registered Opted-in", value: metrics.registeredOptedIn, icon: ShieldCheck, color: "text-blue-500" },
              { label: "Client Inquiries Opted-in", value: metrics.inquiriesOptedIn, icon: FileText, color: "text-emerald-500" },
              { label: "Campaigns Sent", value: metrics.sentCampaigns, icon: Send, color: "text-purple-500" },
              { label: "Total Emails Delivered", value: metrics.totalDelivered, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Avg Open Rate", value: `${metrics.openRate}%`, icon: Eye, color: "text-amber-400" },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {kpi.label}
                    </span>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {loadingOverview ? "..." : kpi.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions & Recent Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Campaign Activity */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-500" />
                    <span>Recent Campaign Dispatches</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">Real-time status and delivery counts</p>
                </div>
                <button
                  onClick={() => setActiveSubTab("campaigns")}
                  className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              {recentCampaigns.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                  <p className="text-xs">No email campaigns created yet.</p>
                  <button
                    onClick={handleOpenNewCampaign}
                    className="text-xs text-amber-500 underline font-mono cursor-pointer"
                  >
                    Create your first campaign now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {recentCampaigns.map((camp) => (
                    <div key={camp.campaign_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {camp.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              camp.status === "SENT"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : camp.status === "SCHEDULED"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : camp.status === "SENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          Subject: {camp.subject}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right font-mono text-xs">
                        <div>
                          <div className="font-bold text-neutral-800 dark:text-neutral-200">
                            {camp.sent_count || 0} / {camp.total_recipients || 0}
                          </div>
                          <div className="text-[10px] text-neutral-400">recipients</div>
                        </div>
                        <button
                          onClick={() => handleEditCampaign(camp)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Open Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Quick Launch & Audience Summary */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>DPA Compliance & Consent</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Every campaign sent strictly checks explicit marketing consent. Unsubscribed recipients and suppressed addresses are automatically filtered out.
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-neutral-400">
                    <span>Suppressed / Unsubscribed:</span>
                    <span className="font-bold text-neutral-200">{metrics.unsubscribedCount}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Double Opt-in State:</span>
                    <span className="font-bold text-emerald-400">Active (Automatic)</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Primary Mail Engine:</span>
                    <span className="font-bold text-neutral-200">Resend REST API</span>
                  </div>
                </div>
              </div>

              {/* Ready-to-use Template Shortcuts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Pre-Built Template Starters
                </h3>
                <div className="space-y-2">
                  {[
                    "Architectural Milestone Announcement",
                    "Client Project Progress Briefing",
                    "In-House Supply & Financing Promotion",
                  ].map((tplName, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const matched = templates.find((t) => t.title.toLowerCase().includes(tplName.toLowerCase().slice(0, 10)));
                        if (matched) handleUseTemplate(matched);
                        else handleOpenNewCampaign();
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-xs font-medium flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate">{tplName}</span>
                      <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CAMPAIGNS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {["all", "draft", "scheduled", "sending", "sent"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCampaignFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    campaignFilter === filter
                      ? "bg-amber-500 text-neutral-950 font-bold"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenNewCampaign}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
          </div>

          {/* Campaigns Table / Cards */}
          <div className="rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            {loadingCampaigns ? (
              <div className="p-12 text-center text-neutral-400 font-mono text-xs">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 space-y-2">
                <Send className="w-8 h-8 mx-auto opacity-30 text-amber-500" />
                <p className="text-xs">No campaigns found in this view.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-mono uppercase text-[10px] tracking-wider bg-neutral-50 dark:bg-neutral-900/40">
                      <th className="py-3 px-4">Campaign Title & Subject</th>
                      <th className="py-3 px-4">Audience</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Recipients</th>
                      <th className="py-3 px-4 text-center">Delivery / Open</th>
                      <th className="py-3 px-4">Schedule / Sent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {campaigns.map((camp) => (
                      <tr key={camp.campaign_id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-neutral-900 dark:text-white truncate max-w-xs">
                            {camp.title}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                            {camp.subject}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                          {camp.target_audience}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              camp.status === "SENT"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : camp.status === "SCHEDULED"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : camp.status === "SENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {camp.total_recipients || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                          <div>{camp.delivered_count || 0} sent</div>
                          <div className="text-neutral-400">{camp.opened_count || 0} opened</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                          {camp.scheduled_at
                            ? new Date(camp.scheduled_at).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : camp.sent_at
                            ? new Date(camp.sent_at).toLocaleDateString()
                            : "Draft"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {camp.status !== "SENT" && camp.status !== "SENDING" && (
                              <button
                                onClick={() => handleSendNow(camp.campaign_id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
                                title="Send campaign now"
                              >
                                Send
                              </button>
                            )}
                            <button
                              onClick={() => handleEditCampaign(camp)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Edit campaign"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: EMAIL TEMPLATES */}
      {/* ========================================================================= */}
      {activeSubTab === "templates" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Email Template Library</h2>
              <p className="text-xs text-neutral-400 font-mono">Pre-built, responsive templates for MCPA Construction</p>
            </div>
            <button
              onClick={handleOpenNewCampaign}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs cursor-pointer"
            >
              + Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.template_id}
                className="rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between group"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {tpl.category}
                    </span>
                    {tpl.is_system && (
                      <span className="text-[10px] font-mono text-neutral-400">Official MCPA</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                    Default Subject: &quot;{tpl.subject_default}&quot;
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">
                    {Array.isArray(tpl.blocks) ? tpl.blocks.length : 0} content blocks
                  </span>
                  <button
                    onClick={() => handleUseTemplate(tpl)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Use in Campaign &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SUBSCRIBERS */}
      {/* ========================================================================= */}
      {activeSubTab === "subscribers" && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={subscriberFilter}
                onChange={(e) => setSubscriberFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-300 focus:outline-none"
              >
                <option value="all">All Subscribers</option>
                <option value="SUBSCRIBED">Active Opted-in</option>
                <option value="UNSUBSCRIBED">Unsubscribed</option>
              </select>
            </div>

            <div className="text-xs font-mono text-neutral-400">
              Total Recorded: <strong className="text-white">{subscriberTotal}</strong>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            {loadingSubscribers ? (
              <div className="p-12 text-center text-neutral-400 font-mono text-xs">Loading subscribers...</div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-xs">No subscribers found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-mono uppercase text-[10px] tracking-wider bg-neutral-50 dark:bg-neutral-900/40">
                      <th className="py-3 px-4">Email & Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Consent Timestamp (PHT)</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {subscribers.map((sub) => (
                      <tr key={sub.subscriber_id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-900 dark:text-white font-mono">
                            {sub.email}
                          </div>
                          {sub.name && (
                            <div className="text-[11px] text-neutral-400">{sub.name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              sub.status === "SUBSCRIBED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                          {sub.source}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                          {sub.consent_timestamp
                            ? new Date(sub.consent_timestamp).toLocaleString("en-US", { timeZone: "Asia/Manila" })
                            : "Recorded"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                          {sub.ip_address || "Truncated"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: AUDIENCE & SEGMENTS */}
      {/* ========================================================================= */}
      {activeSubTab === "audience" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Audience Segments & Consent Filtering</h2>
            <p className="text-xs text-neutral-400 font-mono">
              Campaigns only reach recipients with explicit marketing consent in compliance with the Data Privacy Act.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: "All Consented Subscribers",
                audience: "ALL_SUBSCRIBERS",
                desc: "Website footer signups, client portal opt-ins, and verified newsletter subscribers.",
                badge: `${metrics.activeSubscribers} recipients`,
              },
              {
                title: "Registered Portal Customers",
                audience: "REGISTERED_CUSTOMERS",
                desc: "Verified accounts on the MCPA client portal who opted into project briefings.",
                badge: `${metrics.registeredOptedIn} accounts`,
              },
              {
                title: "Client Consultation Inquiries",
                audience: "PREVIOUS_INQUIRIES",
                desc: "Clients who submitted design/build consultation briefs and gave marketing consent.",
                badge: `${metrics.inquiriesOptedIn} leads`,
              },
              {
                title: "Warm Leads (Registered, No Inquiries)",
                audience: "NO_INQUIRIES",
                desc: "Portal users who registered an account but haven't submitted a project brief yet.",
                badge: "High Conversion Target",
              },
            ].map((seg, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{seg.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {seg.badge}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{seg.desc}</p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">Target Key: {seg.audience}</span>
                  <button
                    onClick={() => {
                      handleOpenNewCampaign();
                      setTimeout(() => {
                        if (editorCampaign) {
                          setEditorCampaign((prev) => ({ ...prev, target_audience: seg.audience }));
                        }
                      }, 100);
                    }}
                    className="text-xs font-mono text-amber-500 hover:underline cursor-pointer"
                  >
                    Compose Campaign &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: SCHEDULED EMAILS */}
      {/* ========================================================================= */}
      {activeSubTab === "scheduled" && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Scheduled & Recurring Campaigns</h2>
            <p className="text-xs text-neutral-400 font-mono">
              Server-side background worker automatically dispatches these at the scheduled time (Asia/Manila PHT).
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 p-6">
            {campaigns.filter((c) => c.status === "SCHEDULED").length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-30 text-amber-500" />
                <p className="text-xs">No campaigns currently scheduled.</p>
                <button
                  onClick={handleOpenNewCampaign}
                  className="text-xs text-amber-500 underline font-mono cursor-pointer"
                >
                  Create a campaign and choose Schedule Later
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns
                  .filter((c) => c.status === "SCHEDULED")
                  .map((camp) => (
                    <div
                      key={camp.campaign_id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{camp.title}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">Subject: {camp.subject}</div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-amber-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {camp.scheduled_at
                              ? new Date(camp.scheduled_at).toLocaleString("en-US", { timeZone: "Asia/Manila" })
                              : "Pending"}
                          </span>
                          {camp.is_recurring && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Recurring: {camp.recurring_pattern}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditCampaign(camp)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-white transition-colors cursor-pointer"
                      >
                        Edit Schedule
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 7: EMAIL ANALYTICS & DELIVERABILITY */}
      {/* ========================================================================= */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Email Deliverability & Performance Analytics</h2>
            <p className="text-xs text-neutral-400 font-mono">
              RFC 2046 MIME compliant metrics, open rate tracking pixels & anti-spam deliverability health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Total Sent vs Delivered</span>
              <div className="text-2xl font-bold text-white">
                {metrics.totalDelivered} / {metrics.totalSent}
              </div>
              <div className="text-xs text-emerald-400 font-mono">
                {metrics.totalSent > 0
                  ? `${((metrics.totalDelivered / metrics.totalSent) * 100).toFixed(1)}% Delivery Rate`
                  : "100% Deliverability Health"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Aggregate Open Rate</span>
              <div className="text-2xl font-bold text-amber-500">{metrics.openRate}%</div>
              <div className="text-xs text-neutral-400 font-mono">Industry avg for construction: ~21.5%</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Click-Through Rate (CTR)</span>
              <div className="text-2xl font-bold text-purple-400">{metrics.clickRate}%</div>
              <div className="text-xs text-neutral-400 font-mono">Calculated from unique click tracking links</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 8: SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === "settings" && (
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Marketing Dispatch Settings</h2>
            <p className="text-xs text-neutral-400 font-mono">Sender verification, reply-to routing, and privacy policies</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-neutral-400">Default Sender Display Name</label>
              <input
                type="text"
                defaultValue="MCPA Construction & Supply"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-white focus:outline-none"
                readOnly
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-neutral-400">Verified From Email (Resend Domain)</label>
              <input
                type="text"
                defaultValue="contact@mcpaconstruction.com"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-white focus:outline-none font-mono"
                readOnly
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-neutral-400">Inbound Reply-To Address</label>
              <input
                type="text"
                defaultValue="contact@mcpaconstruction.com"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-white focus:outline-none font-mono"
                readOnly
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 leading-relaxed">
              <strong className="text-white">Data Privacy Act (RA 10173) Notice:</strong> Unsubscribe tokens are cryptographically generated per subscriber. Each marketing dispatch automatically embeds a 1-click unsubscribe URL.
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* ========================================================================= */}
      {/* DEDICATED FULL-PAGE CAMPAIGN EDITOR (NON-OVERLAY, RESPONSIVE & MOBILE-FIRST) */}
      {/* ========================================================================= */}
      {isEditorOpen && editorCampaign && (
        <div className="space-y-3 animate-fade-in w-full text-neutral-900 dark:text-neutral-100">
          {/* Top Breadcrumb & Status Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-amber-500/15 hover:text-amber-500 text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Campaigns</span>
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-neutral-500 dark:text-neutral-400">Email Marketing</span>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-amber-500 font-bold truncate max-w-[200px] sm:max-w-xs">
                {editorCampaign.title || "Untitled Campaign"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                Audience: <strong className="text-neutral-800 dark:text-neutral-200">{editorCampaign.target_audience}</strong>
              </span>
              {editorCampaign.status && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  {editorCampaign.status}
                </span>
              )}
            </div>
          </div>

          {/* Full Page Editor Container (Takes Full Desktop Screen & Responsive Mobile Layout) */}
          <div className="w-full min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] bg-white dark:bg-[#0c0e14] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* 1. Desktop Editor Header (hidden on mobile, visible lg+) */}
            <div className="hidden lg:flex px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between gap-4 bg-neutral-50 dark:bg-[#10131a] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer shrink-0"
                  title="Close and return to Campaigns list"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-700 shrink-0" />

                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <Layout className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={editorCampaign.title}
                    onChange={(e) => setEditorCampaign({ ...editorCampaign, title: e.target.value })}
                    className="font-extrabold text-base text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-amber-500 focus:outline-none transition-colors truncate w-64 xl:w-96"
                    placeholder="Campaign Title..."
                  />
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Target: {editorCampaign.target_audience}
                  </div>
                </div>
              </div>

              {/* Center: Device Preview Switcher */}
              <div className="flex items-center bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Desktop Preview (600px)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === "tablet"
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Tablet Preview (520px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="Mobile Preview (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCampaign("DRAFT")}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const when = prompt("Enter scheduled date/time (e.g., 2026-11-20 09:00):", new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace("T", " "));
                    if (when) {
                      setEditorCampaign({ ...editorCampaign, scheduled_at: new Date(when).toISOString() });
                      handleSaveCampaign("SCHEDULED");
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Schedule Later
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (editorCampaign.campaign_id) {
                      handleSendNow(editorCampaign.campaign_id);
                    } else {
                      handleSaveCampaign("DRAFT").then(() => {
                        showToast("Campaign draft saved! You can now click Send Now.", "success");
                      });
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Campaign Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer ml-1"
                  title="Close Editor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 1b. Mobile-First Editor Header (visible < lg, hidden on desktop) */}
            <div className="flex lg:hidden flex-col gap-2 p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#10131a] shrink-0">
              {/* Row 1: Back, Title, Send */}
              <div className="flex items-center gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shrink-0"
                  title="Back to Campaigns"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={editorCampaign.title}
                  onChange={(e) => setEditorCampaign({ ...editorCampaign, title: e.target.value })}
                  className="font-bold text-sm text-neutral-900 dark:text-white bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-amber-500 focus:outline-none flex-1 truncate mx-1"
                  placeholder="Campaign Title..."
                />

                <button
                  type="button"
                  onClick={() => {
                    if (editorCampaign.campaign_id) {
                      handleSendNow(editorCampaign.campaign_id);
                    } else {
                      handleSaveCampaign("DRAFT").then(() => {
                        showToast("Campaign draft saved! You can now click Send Now.", "success");
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>

              {/* Row 2: Secondary action bar & preview device pills */}
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSaveCampaign("DRAFT")}
                    className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                  </button>
                </div>

                {/* Mobile device preview switcher */}
                <div className="flex items-center bg-neutral-200 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-300 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1 rounded text-[10px] ${previewDevice === "desktop" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"}`}
                    title="Desktop View"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className={`p-1 rounded text-[10px] ${previewDevice === "tablet" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"}`}
                    title="Tablet View"
                  >
                    <Tablet className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1 rounded text-[10px] ${previewDevice === "mobile" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 3: Mobile View Toggle (Segmented Pill: Compose vs Live Preview) */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs font-bold mt-0.5">
                <button
                  type="button"
                  onClick={() => setMobileEditorTab("editor")}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mobileEditorTab === "editor"
                      ? "bg-amber-500 text-neutral-950 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Editor &amp; Blocks ({editorCampaign.blocks?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileEditorTab("preview")}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mobileEditorTab === "preview"
                      ? "bg-amber-500 text-neutral-950 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              </div>
            </div>

            {/* 2. Editor Workspace (2-Column on Desktop: Left Controls & Blocks, Right Real-time Preview; Tabbed on Mobile) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
              {/* Left Column: Subject, Logo Setup, Block Palette & Block Inspector */}
              <div
                className={`${
                  mobileEditorTab === "editor" ? "flex" : "hidden"
                } lg:flex w-full lg:w-1/2 border-r border-neutral-200 dark:border-neutral-800 flex-col h-full overflow-hidden bg-white dark:bg-[#0c0e14]`}
              >
                {/* Campaign Metadata Fields */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400">Subject Line</label>
                      <input
                        type="text"
                        value={editorCampaign.subject}
                        onChange={(e) => setEditorCampaign({ ...editorCampaign, subject: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                        placeholder="Email subject..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400">Preview Text</label>
                      <input
                        type="text"
                        value={editorCampaign.preview_text || ""}
                        onChange={(e) => setEditorCampaign({ ...editorCampaign, preview_text: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                        placeholder="In-box preheader preview..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400">Target Audience</label>
                      <select
                        value={editorCampaign.target_audience}
                        onChange={(e) => setEditorCampaign({ ...editorCampaign, target_audience: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                      >
                        <option value="ALL_SUBSCRIBERS">All Consented Subscribers</option>
                        <option value="REGISTERED_CUSTOMERS">Registered Customers (Opted-in)</option>
                        <option value="PREVIOUS_INQUIRIES">Consultation Inquiries (Consented)</option>
                        <option value="NO_INQUIRIES">Warm Leads (Registered, No Inquiries)</option>
                      </select>
                    </div>

                    {/* Logo Configuration & Drag-and-Drop Panel */}
                    <div className="space-y-2.5 col-span-1 sm:col-span-2 p-3 rounded-xl bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase text-amber-500 font-bold flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          MCPA Brand Logo Header
                        </label>
                        <span className="text-[9px] font-mono text-neutral-400">Drag &amp; drop or upload</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Position */}
                        <div>
                          <label className="text-[9px] font-mono text-neutral-400 block mb-1">Position</label>
                          <select
                            value={editorCampaign.logo_config?.position || "top-center"}
                            onChange={(e) =>
                              setEditorCampaign({
                                ...editorCampaign,
                                logo_config: { ...editorCampaign.logo_config, position: e.target.value },
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                          </select>
                        </div>

                        {/* Width / Size Slider */}
                        <div>
                          <label className="text-[9px] font-mono text-neutral-400 block mb-1">
                            Width: {editorCampaign.logo_config?.width || 180}px
                          </label>
                          <input
                            type="range"
                            min="100"
                            max="300"
                            step="10"
                            value={editorCampaign.logo_config?.width || 180}
                            onChange={(e) =>
                              setEditorCampaign({
                                ...editorCampaign,
                                logo_config: { ...editorCampaign.logo_config, width: parseInt(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Drag & Drop Box in Sidebar */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleApplyLogoFile(file);
                        }}
                        onClick={() => logoFileInputRef.current?.click()}
                        className="p-2 border border-dashed border-amber-500/40 hover:border-amber-500 rounded-lg bg-white dark:bg-neutral-900/60 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              editorCampaign.logo_config?.src &&
                              !editorCampaign.logo_config.src.includes("https://mcpaconstruction.com/images/mcpa-logo-dark.png")
                                ? editorCampaign.logo_config.src
                                : "/assets/email/email_logo_dark.png"
                            }
                            alt="Logo preview"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/mcpa-logo.png";
                            }}
                            className="h-6 max-w-[80px] object-contain shrink-0"
                          />
                          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 group-hover:text-amber-500 truncate">
                            Drag &amp; drop logo file here
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 font-bold shrink-0">
                          {isUploadingLogo ? "Uploading..." : "Browse"}
                        </span>
                      </div>

                      {/* Brand Logo Presets */}
                      <div>
                        <span className="text-[9px] font-mono text-neutral-400 block mb-1">Quick Presets:</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: "Dark Logo", src: "/assets/email/email_logo_dark.png" },
                            { label: "Adaptive V2", src: "/assets/email/email_logo_adaptive_v2.png" },
                            { label: "White Badge", src: "/assets/email/email_logo_white.png" },
                            { label: "Brand Primary", src: "/assets/mcpa-logo.png" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                setEditorCampaign({
                                  ...editorCampaign,
                                  logo_config: { ...editorCampaign.logo_config, src: preset.src },
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                                (editorCampaign.logo_config?.src || "/assets/email/email_logo_dark.png") === preset.src
                                  ? "bg-amber-500 text-neutral-950 font-bold border-amber-500"
                                  : "bg-white/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-amber-500"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Logo Destination Link */}
                      <div className="pt-1 border-t border-neutral-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-mono text-neutral-400">Logo Destination Link</label>
                          <span className="text-[9px] font-mono text-amber-500 font-bold">Select Page ▾</span>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editorCampaign.logo_config?.link || "https://mcpaconstruction.com"}
                            onChange={(e) =>
                              setEditorCampaign({
                                ...editorCampaign,
                                logo_config: { ...editorCampaign.logo_config, link: e.target.value },
                              })
                            }
                            className="w-full px-2.5 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[11px] font-mono text-neutral-900 dark:text-white focus:outline-none"
                            placeholder="https://mcpaconstruction.com"
                          />
                          <div className="relative">
                            <select
                              value={
                                MCPA_SITE_LINKS.some(
                                  (p) => p.url === (editorCampaign.logo_config?.link || "https://mcpaconstruction.com")
                                )
                                  ? editorCampaign.logo_config?.link
                                  : "custom"
                              }
                              onChange={(e) => {
                                if (e.target.value !== "custom") {
                                  setEditorCampaign({
                                    ...editorCampaign,
                                    logo_config: { ...editorCampaign.logo_config, link: e.target.value },
                                  });
                                }
                              }}
                              className="w-full appearance-none pl-2.5 pr-7 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                            >
                              <option value="custom" disabled>
                                -- Select Official Site Page Link --
                              </option>
                              {MCPA_SITE_LINKS.map((page) => (
                                <option key={page.url} value={page.url}>
                                  {page.label} ({page.path})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Content Blocks Palette */}
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/60 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      Add Content Block:
                    </span>
                    {/* Multi-file Upload Trigger */}
                    <div>
                      <input
                        type="file"
                        ref={mediaFileInputRef}
                        multiple
                        accept="image/*,video/*"
                        onChange={handleUploadMediaFiles}
                        className="hidden"
                      />
                      <button
                        onClick={() => mediaFileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isUploadingMedia ? "Uploading Files..." : "Upload Photos / Videos"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { type: "heading", label: "Heading", icon: Type },
                      { type: "paragraph", label: "Paragraph", icon: FileText },
                      { type: "image", label: "Image", icon: ImageIcon },
                      { type: "gallery", label: "Gallery", icon: Layers },
                      { type: "video", label: "Video", icon: Video },
                      { type: "button", label: "Button CTA", icon: MousePointer },
                      { type: "divider", label: "Divider", icon: Layout },
                      { type: "spacer", label: "Spacer", icon: Layout },
                      { type: "contact", label: "Contact Info", icon: Mail },
                      { type: "footer", label: "Footer", icon: Layout },
                    ].map((b) => {
                      const Icon = b.icon;
                      return (
                        <button
                          key={b.type}
                          onClick={() => handleAddBlock(b.type)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Icon className="w-3 h-3" />
                          <span>{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Blocks List & Inline Inspector */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {editorCampaign.blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold uppercase text-amber-500 text-[10px] flex items-center gap-1">
                          <span>#{index + 1}</span>
                          <span>{block.type}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(index, "down")}
                            disabled={index === editorCampaign.blocks.length - 1}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveBlock(block.id)}
                            className="p-1 text-neutral-400 hover:text-red-400 cursor-pointer ml-1"
                            title="Delete Block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Block Form Fields */}
                      {block.type === "heading" && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={block.data.text || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
                            placeholder="Headline text..."
                          />
                        </div>
                      )}

                      {block.type === "subheading" && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={block.data.text || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none"
                            placeholder="Subheading text..."
                          />
                        </div>
                      )}

                      {block.type === "paragraph" && (
                        <div className="space-y-1">
                          <textarea
                            rows={3}
                            value={block.data.text || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none resize-y"
                            placeholder="Paragraph body..."
                          />
                        </div>
                      )}

                      {block.type === "image" && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={block.data.src || ""}
                              onChange={(e) => handleUpdateBlock(block.id, { src: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none font-mono"
                              placeholder="Image file URL or upload..."
                            />
                          </div>
                          <input
                            type="text"
                            value={block.data.caption || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { caption: e.target.value })}
                            className="w-full px-2.5 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-400"
                            placeholder="Image caption (optional)..."
                          />
                          {/* Image Destination Link with Website Page Combobox */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-mono text-neutral-400">
                                Click Destination Link (Optional)
                              </label>
                              <span className="text-[9px] font-mono text-amber-500 font-bold">
                                Select Page ▾
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={block.data.link || ""}
                                onChange={(e) => handleUpdateBlock(block.id, { link: e.target.value })}
                                className="flex-1 px-2.5 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-900 dark:text-white font-mono focus:outline-none"
                                placeholder="https://mcpaconstruction.com/projects"
                              />
                              <div className="relative">
                                <select
                                  value={
                                    MCPA_SITE_LINKS.some((p) => p.url === block.data.link)
                                      ? block.data.link
                                      : "custom"
                                  }
                                  onChange={(e) => {
                                    if (e.target.value !== "custom") {
                                      handleUpdateBlock(block.id, { link: e.target.value });
                                    }
                                  }}
                                  className="w-36 appearance-none pl-2 pr-6 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                                >
                                  <option value="custom">Site Page ▾</option>
                                  {MCPA_SITE_LINKS.map((page) => (
                                    <option key={page.url} value={page.url}>
                                      {page.path}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === "button" && (
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-neutral-400 block">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={block.data.text || ""}
                              onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
                              placeholder="Button label..."
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono uppercase text-neutral-400">
                                Destination Link (Website Page)
                              </label>
                              <span className="text-[10px] font-mono text-amber-500 font-bold">
                                Select Page ▾
                              </span>
                            </div>

                            {/* Direct URL input with external link test button */}
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                value={block.data.url || ""}
                                onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                                className="w-full pl-2.5 pr-8 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none font-mono"
                                placeholder="https://mcpaconstruction.com/projects"
                              />
                              {block.data.url && (
                                <a
                                  href={block.data.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open destination link in new tab"
                                  className="absolute right-2 text-neutral-400 hover:text-amber-500 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            {/* Combobox Dropdown for all official site page links */}
                            <div className="relative">
                              <select
                                value={
                                  MCPA_SITE_LINKS.some((p) => p.url === block.data.url)
                                    ? block.data.url
                                    : "custom"
                                }
                                onChange={(e) => {
                                  if (e.target.value !== "custom") {
                                    handleUpdateBlock(block.id, { url: e.target.value });
                                  }
                                }}
                                className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                              >
                                <option value="custom" disabled={MCPA_SITE_LINKS.some((p) => p.url === block.data.url)}>
                                  -- Select MCPA Website Page Link --
                                </option>
                                {MCPA_SITE_LINKS.map((page) => (
                                  <option key={page.url} value={page.url}>
                                    {page.label} — {page.path}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === "video" && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={block.data.url || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none font-mono"
                            placeholder="Video URL (YouTube, Vimeo or Hosted Video)..."
                          />
                          <input
                            type="text"
                            value={block.data.title || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                            className="w-full px-2.5 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                            placeholder="Video title..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Responsive Email Preview */}
              <div
                className={`${
                  mobileEditorTab === "preview" ? "flex" : "hidden"
                } lg:flex w-full lg:w-1/2 flex-col h-full bg-neutral-100 dark:bg-[#07090d] overflow-hidden`}
              >
                {/* Preview Toolbar */}
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-white dark:bg-[#0e1118] shrink-0">
                  <span className="font-mono text-neutral-400">
                    Live Rendering ({previewDevice})
                  </span>

                  {/* Send Test Email Quick Box */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      placeholder="Enter test recipient email..."
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendTestEmail();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 w-36 sm:w-56 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      onClick={handleSendTestEmail}
                      disabled={sendingTest}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {sendingTest ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Send Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Email Canvas Preview Container */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      const files = Array.from(e.dataTransfer.files || []);
                      if (files.length > 0 && files.some((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))) {
                        e.preventDefault();
                        handleUploadMediaFiles({ target: { files } });
                      }
                    }}
                    className="bg-white text-neutral-900 rounded-xl shadow-xl transition-all duration-300 overflow-hidden max-w-full"
                    style={{
                      width: previewDevice === "mobile" ? "375px" : previewDevice === "tablet" ? "520px" : "600px",
                      padding: "28px 24px",
                    }}
                  >
                    {/* Rendered Logo with Interactive Drag & Drop */}
                    {editorCampaign.logo_config && (
                      <div
                        className="mb-5 relative group"
                        style={{
                          textAlign:
                            editorCampaign.logo_config.position === "top-left"
                              ? "left"
                              : editorCampaign.logo_config.position === "top-right"
                              ? "right"
                              : "center",
                        }}
                      >
                        {/* Hidden File Input for Logo upload */}
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleApplyLogoFile(file);
                          }}
                        />

                        {/* Interactive Dropzone Wrapper */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverLogo(true);
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverLogo(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverLogo(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverLogo(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleApplyLogoFile(file);
                          }}
                          onClick={() => logoFileInputRef.current?.click()}
                          title="Click or drag and drop an image file here to change logo"
                          className={`relative inline-block transition-all duration-200 cursor-pointer rounded-xl p-2 select-none group/logo ${
                            isDraggingOverLogo
                              ? "ring-2 ring-amber-500 bg-amber-500/10 scale-105 border-2 border-dashed border-amber-500"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border border-transparent hover:border-dashed hover:border-amber-500/50"
                          }`}
                        >
                          <img
                            src={
                              editorCampaign.logo_config.src &&
                              !editorCampaign.logo_config.src.includes("https://mcpaconstruction.com/images/mcpa-logo-dark.png")
                                ? editorCampaign.logo_config.src
                                : "/assets/email/email_logo_dark.png"
                            }
                            alt="MCPA Construction & Supply"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/mcpa-logo.png";
                            }}
                            style={{
                              maxWidth: `${editorCampaign.logo_config.width || 180}px`,
                              display: "inline-block",
                              height: "auto",
                            }}
                            className="transition-opacity"
                          />

                          {/* Drag & Drop Visual State Overlay */}
                          {isDraggingOverLogo && (
                            <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-2 text-center animate-pulse">
                              <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1" />
                              <span className="text-[10px] font-mono font-bold text-neutral-950 bg-amber-400 px-2 py-0.5 rounded shadow-sm">
                                Drop Image Here to Apply Logo
                              </span>
                            </div>
                          )}

                          {/* Hover Tooltip / Action Bar */}
                          {!isDraggingOverLogo && (
                            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-neutral-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md flex items-center gap-1.5 border border-white/10">
                              <Upload className="w-3 h-3 text-amber-400" />
                              <span>Drag &amp; drop logo or click to upload</span>
                            </div>
                          )}

                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-black/60 rounded-xl flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rendered Blocks Preview */}
                    <div className="space-y-4">
                      {editorCampaign.blocks.map((b) => (
                        <div key={b.id}>
                          {b.type === "heading" && (
                            <h1
                              style={{
                                color: b.data.color || "#0f172a",
                                textAlign: b.data.align || "left",
                                fontSize: "22px",
                                fontWeight: "800",
                                lineHeight: "1.3",
                              }}
                            >
                              {b.data.text || "Heading"}
                            </h1>
                          )}

                          {b.type === "subheading" && (
                            <h2
                              style={{
                                color: b.data.color || "#d97706",
                                textAlign: b.data.align || "left",
                                fontSize: "14px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {b.data.text || "Subheading"}
                            </h2>
                          )}

                          {b.type === "paragraph" && (
                            <p
                              style={{
                                color: b.data.color || "#334155",
                                textAlign: b.data.align || "left",
                                fontSize: "14px",
                                lineHeight: "1.6",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {b.data.text || "Paragraph"}
                            </p>
                          )}

                          {b.type === "image" && b.data.src && (
                            <div style={{ textAlign: b.data.align || "center" }}>
                              <img
                                src={b.data.src}
                                alt={b.data.alt || "MCPA Project"}
                                style={{ width: "100%", borderRadius: "8px", display: "inline-block" }}
                              />
                              {b.data.caption && (
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                                  {b.data.caption}
                                </div>
                              )}
                            </div>
                          )}

                          {b.type === "gallery" && Array.isArray(b.data.images) && (
                            <div className="grid grid-cols-2 gap-2">
                              {b.data.images.map((img, i) => (
                                <div key={i} className="text-center">
                                  <img src={img.src} alt="Gallery" className="w-full rounded-md object-cover" />
                                  {img.caption && <div className="text-[10px] text-neutral-500 mt-1">{img.caption}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          {b.type === "video" && (
                            <div className="relative text-center rounded-lg overflow-hidden border border-neutral-200">
                              <img src={b.data.thumbnail} alt="Video" className="w-full object-cover" />
                              <div className="p-2 bg-neutral-900 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                                <Play className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{b.data.title || "Watch Video"}</span>
                              </div>
                            </div>
                          )}

                          {b.type === "button" && (
                            <div style={{ textAlign: b.data.align || "center", margin: "16px 0" }}>
                              <a
                                href={b.data.url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  backgroundColor: b.data.bgColor || "#d97706",
                                  color: b.data.textColor || "#ffffff",
                                  borderRadius: `${b.data.borderRadius || 8}px`,
                                  padding: "12px 24px",
                                  fontWeight: "700",
                                  fontSize: "14px",
                                  textDecoration: "none",
                                  display: "inline-block",
                                }}
                              >
                                {b.data.text || "Call to Action"}
                              </a>
                            </div>
                          )}

                          {b.type === "divider" && (
                            <hr style={{ borderColor: b.data.color || "#e2e8f0", margin: "16px 0" }} />
                          )}

                          {b.type === "contact" && (
                            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", fontSize: "12px", color: "#475569" }}>
                              <strong style={{ color: "#0f172a" }}>{b.data.name || "MCPA Construction"}</strong><br />
                              📍 {b.data.address || "Bulacan, Philippines"}<br />
                              📞 {b.data.phone || "(0949) 775 8239"} &bull; ✉️ {b.data.email || "contact@mcpaconstruction.com"}
                            </div>
                          )}

                          {b.type === "footer" && (
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "20px", fontSize: "11px", color: "#94a3b8", textAlign: "center", lineHeight: "1.5" }}>
                              <strong>{b.data.company || "MCPA Construction & Supply"}</strong> &bull; Licensed General Contractor<br />
                              You received this email because you opted into project updates.<br />
                              <span style={{ color: "#64748b", textDecoration: "underline" }}>Unsubscribe</span> &bull; <span style={{ color: "#64748b", textDecoration: "underline" }}>Privacy Policy</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI EMAIL WRITING & COPY ASSISTANT */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">AI Construction Copy Assistant</h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase text-neutral-400">Campaign Objective / Topic</label>
                <textarea
                  rows={2}
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Announcing our 2026 two-storey modern Scandinavian villa in Plaridel with wholesale in-house material discounts..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 mt-1 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400">Tool</label>
                  <select
                    value={aiAction}
                    onChange={(e) => setAiAction(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-mono text-white mt-1"
                  >
                    <option value="subject_lines">Subject Lines</option>
                    <option value="generate_copy">Full Body Copy</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400">Tone</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-mono text-white mt-1"
                  >
                    <option value="professional">Professional</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="warm">Warm & Welcoming</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-neutral-400">Language</label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-mono text-white mt-1"
                  >
                    <option value="en">English</option>
                    <option value="tl">Filipino / Taglish</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunAiAssist}
                disabled={aiLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Suggestions</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Results Display */}
            {aiResults && (
              <div className="pt-3 border-t border-neutral-800 space-y-2 max-h-60 overflow-y-auto">
                {Array.isArray(aiResults) ? (
                  aiResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 hover:border-purple-500 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.subject}</div>
                        {item.preview && <div className="text-[11px] text-neutral-400 truncate">{item.preview}</div>}
                      </div>
                      <button
                        onClick={() => handleApplyAiSubject(item)}
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white shrink-0 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ))
                ) : typeof aiResults === "object" ? (
                  <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2 text-xs">
                    <div className="font-bold text-purple-300">{aiResults.heading}</div>
                    <div className="text-neutral-400 italic">{aiResults.subheading}</div>
                    <div className="text-neutral-300 whitespace-pre-line">{aiResults.paragraph}</div>
                    <button
                      onClick={() => handleApplyAiBody(aiResults)}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-white cursor-pointer mt-2"
                    >
                      Apply All to Campaign
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-300 whitespace-pre-line p-3 bg-neutral-800 rounded-xl">
                    {aiResults}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
