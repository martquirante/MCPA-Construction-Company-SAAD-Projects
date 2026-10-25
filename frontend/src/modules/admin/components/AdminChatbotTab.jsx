/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { authFetch } from "@/modules/shared/authFetch";
import {
  SearchIcon,
  CloseIcon,
  CheckIcon,
  RefreshCwIcon,
  UserIcon,
  MailIcon,
  ExternalLinkIcon,
} from "@/modules/shared/Icons";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Send,
  Sliders,
  HelpCircle,
  Layers,
  ArrowRight,
  Eye,
  Settings,
  FolderPlus,
  Bot,
  Check,
  RefreshCw,
} from "lucide-react";

export default function AdminChatbotTab({ currentUser, onShowToast }) {
  // Active sub-tab: 'faqs' | 'unanswered' | 'live' | 'settings'
  const [subTab, setSubTab] = useState("faqs");

  // Summary counts
  const [summary, setSummary] = useState({
    awaitingHumanCount: 0,
    unreadSupportCount: 0,
    openUnansweredCount: 0,
    activeFaqsCount: 0,
  });

  // ---------------------------------------------------------------------------
  // 1. FAQs & Categories State
  // ---------------------------------------------------------------------------
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  // FAQ Modal (Create / Edit)
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    categoryId: "",
    questionEn: "",
    questionTl: "",
    altQuestions: [],
    keywords: [],
    answerEn: "",
    answerTl: "",
    isActive: true,
  });
  const [newAltInput, setNewAltInput] = useState("");
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [previewLang, setPreviewLang] = useState("en");

  // Categories Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatNameTl, setNewCatNameTl] = useState("");

  // ---------------------------------------------------------------------------
  // 2. Unanswered Questions State
  // ---------------------------------------------------------------------------
  const [unanswered, setUnanswered] = useState([]);
  const [isLoadingUnanswered, setIsLoadingUnanswered] = useState(false);
  const [linkTargetModal, setLinkTargetModal] = useState(null); // { unansweredId, phrasing }
  const [selectedLinkFaqId, setSelectedLinkFaqId] = useState("");

  // ---------------------------------------------------------------------------
  // 3. Live Support Inbox State
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [activeConvDetails, setActiveConvDetails] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [adminReplyInput, setAdminReplyInput] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [convFilter, setConvFilter] = useState("ALL"); // ALL | AWAITING | ACTIVE | RESOLVED
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const livePollTimer = useRef(null);

  // ---------------------------------------------------------------------------
  // 4. Settings State
  // ---------------------------------------------------------------------------
  const [settingsData, setSettingsData] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ===========================================================================
  // INITIAL DATA LOADING
  // ===========================================================================
  const loadSummary = async () => {
    try {
      const res = await authFetch("/api/admin/chatbot/summary");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSummary({
            awaitingHumanCount: data.awaitingHumanCount,
            unreadSupportCount: data.unreadSupportCount,
            openUnansweredCount: data.openUnansweredCount,
            activeFaqsCount: data.activeFaqsCount,
          });
        }
      }
    } catch (_) {}
  };

  const loadCategories = async () => {
    try {
      const res = await authFetch("/api/admin/chatbot/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setCategories(data.categories || []);
      }
    } catch (_) {}
  };

  const loadFaqs = async () => {
    setIsLoadingFaqs(true);
    try {
      let queryUrl = `/api/admin/chatbot/faqs?search=${encodeURIComponent(faqSearch)}`;
      if (selectedCatFilter) queryUrl += `&categoryId=${selectedCatFilter}`;
      if (statusFilter) queryUrl += `&status=${statusFilter}`;

      const res = await authFetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFaqs(data.faqs || []);
      }
    } catch (err) {
      console.warn("loadFaqs error:", err);
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  const loadUnanswered = async () => {
    setIsLoadingUnanswered(true);
    try {
      const res = await authFetch("/api/admin/chatbot/unanswered?status=OPEN");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnanswered(data.unanswered || []);
      }
    } catch (_) {
    } finally {
      setIsLoadingUnanswered(false);
    }
  };

  const loadConversations = async () => {
    setIsLoadingConv(true);
    try {
      let url = "/api/admin/chatbot/conversations";
      if (convFilter === "AWAITING") url += "?status=AWAITING_HUMAN";
      else if (convFilter === "ACTIVE") url += "?status=HUMAN_ACTIVE";
      else if (convFilter === "RESOLVED") url += "?status=RESOLVED";

      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConversations(data.conversations || []);
          if (!selectedConvId && data.conversations?.length > 0) {
            setSelectedConvId(data.conversations[0].conversation_id);
          }
        }
      }
    } catch (_) {
    } finally {
      setIsLoadingConv(false);
    }
  };

  const loadConversationDetails = async (convId) => {
    if (!convId) return;
    try {
      const res = await authFetch(`/api/admin/chatbot/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveConvDetails(data.conversation);
          setConvMessages(data.messages || []);
        }
      }
    } catch (_) {}
  };

  const loadSettings = async () => {
    try {
      const res = await authFetch("/api/admin/chatbot/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSettingsData(data.settings);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadSummary();
    loadCategories();
  }, []);

  useEffect(() => {
    if (subTab === "faqs") {
      loadFaqs();
    } else if (subTab === "unanswered") {
      loadUnanswered();
    } else if (subTab === "live") {
      loadConversations();
    } else if (subTab === "settings") {
      loadSettings();
    }
  }, [subTab, selectedCatFilter, statusFilter]);

  // Polling for live support
  useEffect(() => {
    if (subTab === "live" && selectedConvId) {
      loadConversationDetails(selectedConvId);
      livePollTimer.current = setInterval(() => {
        loadConversationDetails(selectedConvId);
        loadSummary();
      }, 3500);

      return () => {
        if (livePollTimer.current) clearInterval(livePollTimer.current);
      };
    }
  }, [subTab, selectedConvId]);

  // ===========================================================================
  // FAQ HANDLERS
  // ===========================================================================
  const openCreateFaqModal = () => {
    setEditingFaq(null);
    setFaqForm({
      categoryId: categories[0]?.category_id || "",
      questionEn: "",
      questionTl: "",
      altQuestions: [],
      keywords: [],
      answerEn: "",
      answerTl: "",
      isActive: true,
    });
    setIsFaqModalOpen(true);
  };

  const openEditFaqModal = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      categoryId: faq.category_id || "",
      questionEn: faq.question_en || "",
      questionTl: faq.question_tl || "",
      altQuestions: Array.isArray(faq.alt_questions) ? [...faq.alt_questions] : [],
      keywords: Array.isArray(faq.keywords) ? [...faq.keywords] : [],
      answerEn: faq.answer_en || "",
      answerTl: faq.answer_tl || "",
      isActive: faq.is_active !== false,
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.questionEn.trim() || !faqForm.answerEn.trim()) {
      onShowToast?.("Primary English question and answer are required.", "error");
      return;
    }

    try {
      const payload = {
        categoryId: faqForm.categoryId ? parseInt(faqForm.categoryId, 10) : null,
        questionEn: faqForm.questionEn.trim(),
        questionTl: faqForm.questionTl.trim() || null,
        altQuestions: faqForm.altQuestions,
        keywords: faqForm.keywords,
        answerEn: faqForm.answerEn.trim(),
        answerTl: faqForm.answerTl.trim() || null,
        isActive: faqForm.isActive,
      };

      const url = editingFaq
        ? `/api/admin/chatbot/faqs/${editingFaq.faq_id}`
        : "/api/admin/chatbot/faqs";
      const method = editingFaq ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFaqModalOpen(false);
        onShowToast?.(
          editingFaq ? "FAQ entry updated successfully." : "New approved FAQ added.",
          "success"
        );
        loadFaqs();
        loadSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        onShowToast?.(err.message || "Failed to save FAQ.", "error");
      }
    } catch (err) {
      onShowToast?.("Network error while saving FAQ.", "error");
    }
  };

  const handleToggleFaqStatus = async (faq) => {
    try {
      const newStatus = !faq.is_active;
      const res = await authFetch(`/api/admin/chatbot/faqs/${faq.faq_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        onShowToast?.(`FAQ ${newStatus ? "enabled" : "disabled"}.`, "success");
        loadFaqs();
        loadSummary();
      }
    } catch (_) {}
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm("Are you sure you want to delete this FAQ entry?")) return;
    try {
      const res = await authFetch(`/api/admin/chatbot/faqs/${faqId}`, { method: "DELETE" });
      if (res.ok) {
        onShowToast?.("FAQ deleted.", "success");
        loadFaqs();
        loadSummary();
      }
    } catch (_) {}
  };

  // ===========================================================================
  // CATEGORY HANDLERS
  // ===========================================================================
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatNameEn.trim() || !newCatNameTl.trim()) {
      onShowToast?.("English and Tagalog names are required.", "error");
      return;
    }

    try {
      const res = await authFetch("/api/admin/chatbot/categories", {
        method: "POST",
        body: JSON.stringify({
          slug: newCatSlug.trim() || undefined,
          nameEn: newCatNameEn.trim(),
          nameTl: newCatNameTl.trim(),
        }),
      });
      if (res.ok) {
        setNewCatSlug("");
        setNewCatNameEn("");
        setNewCatNameTl("");
        loadCategories();
        onShowToast?.("Category added.", "success");
      }
    } catch (_) {}
  };

  // ===========================================================================
  // UNANSWERED QUESTIONS HANDLERS
  // ===========================================================================
  const handleConvertUnanswered = (item) => {
    setEditingFaq(null);
    setFaqForm({
      categoryId: categories[0]?.category_id || "",
      questionEn: item.original_question,
      questionTl: item.detected_language === "fil" ? item.original_question : "",
      altQuestions: [],
      keywords: [],
      answerEn: "",
      answerTl: "",
      isActive: true,
    });
    setIsFaqModalOpen(true);
  };

  const handleLinkUnanswered = async () => {
    if (!linkTargetModal || !selectedLinkFaqId) return;
    try {
      const res = await authFetch(`/api/admin/chatbot/unanswered/${linkTargetModal.unansweredId}/link`, {
        method: "POST",
        body: JSON.stringify({
          targetFaqId: parseInt(selectedLinkFaqId, 10),
          phrasing: linkTargetModal.phrasing,
        }),
      });
      if (res.ok) {
        setLinkTargetModal(null);
        setSelectedLinkFaqId("");
        onShowToast?.("Question linked as alternative phrasing.", "success");
        loadUnanswered();
        loadSummary();
      }
    } catch (_) {}
  };

  const handleDismissUnanswered = async (unansweredId) => {
    try {
      const res = await authFetch(`/api/admin/chatbot/unanswered/${unansweredId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      if (res.ok) {
        onShowToast?.("Question dismissed.", "info");
        loadUnanswered();
        loadSummary();
      }
    } catch (_) {}
  };

  // ===========================================================================
  // LIVE SUPPORT HANDLERS
  // ===========================================================================
  const handleClaimConversation = async (convId) => {
    try {
      const res = await authFetch(`/api/admin/chatbot/conversations/${convId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        onShowToast?.("You have claimed this support conversation.", "success");
        loadConversationDetails(convId);
        loadConversations();
        loadSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        onShowToast?.(err.message || "Failed to claim conversation.", "error");
      }
    } catch (_) {
      onShowToast?.("Failed to claim conversation.", "error");
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminReplyInput.trim() || !selectedConvId || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const res = await authFetch(`/api/admin/chatbot/conversations/${selectedConvId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminReplyInput.trim() }),
      });
      if (res.ok) {
        setAdminReplyInput("");
        onShowToast?.("Reply sent to customer.", "success");
        loadConversationDetails(selectedConvId);
        loadConversations();
      } else {
        const err = await res.json().catch(() => ({}));
        onShowToast?.(err.message || "Failed to deliver reply.", "error");
      }
    } catch (_) {
      onShowToast?.("Failed to deliver reply.", "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateConvStatus = async (status) => {
    if (!selectedConvId) return;
    try {
      const res = await authFetch(`/api/admin/chatbot/conversations/${selectedConvId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const label =
          status === "BOT_ACTIVE"
            ? "Conversation returned to bot."
            : status === "RESOLVED"
            ? "Conversation marked as resolved."
            : `Conversation status set to ${status}.`;
        onShowToast?.(label, "success");
        loadConversationDetails(selectedConvId);
        loadConversations();
        loadSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        onShowToast?.(err.message || "Failed to update conversation status.", "error");
      }
    } catch (_) {
      onShowToast?.("Failed to update conversation status.", "error");
    }
  };

  // ===========================================================================
  // SETTINGS HANDLERS
  // ===========================================================================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsData) return;
    setIsSavingSettings(true);
    try {
      const res = await authFetch("/api/admin/chatbot/settings", {
        method: "PUT",
        body: JSON.stringify({
          general: {
            min_match_threshold: parseFloat(settingsData.min_match_threshold),
            ambiguity_delta: parseFloat(settingsData.ambiguity_delta),
            max_suggestions: parseInt(settingsData.max_suggestions, 10),
            debounce_ms: parseInt(settingsData.debounce_ms, 10),
            messenger_url: settingsData.messenger_url,
            social_links: settingsData.social_links,
          },
          messages: settingsData.messages,
        }),
      });
      if (res.ok) {
        onShowToast?.("Chatbot settings saved successfully.", "success");
      }
    } catch (_) {
      onShowToast?.("Failed to update settings.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------
          TOP SUB-NAVIGATION BAR & BADGE COUNTS
      -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab: Knowledge Base */}
          <button
            onClick={() => setSubTab("faqs")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "faqs"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-neutral-900/10 dark:bg-white/10 font-mono">
              {summary.activeFaqsCount}
            </span>
          </button>

          {/* Sub-tab: Unanswered Questions */}
          <button
            onClick={() => setSubTab("unanswered")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "unanswered"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unanswered Questions</span>
            {summary.openUnansweredCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-rose-500 text-white font-mono font-bold animate-pulse">
                {summary.openUnansweredCount}
              </span>
            )}
          </button>

          {/* Sub-tab: Live Support Inbox */}
          <button
            onClick={() => setSubTab("live")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "live"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Human Support</span>
            {summary.awaitingHumanCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-amber-600 text-white font-mono font-bold animate-bounce">
                {summary.awaitingHumanCount} waiting
              </span>
            )}
          </button>

          {/* Sub-tab: Settings */}
          <button
            onClick={() => setSubTab("settings")}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "settings"
                ? "bg-amber-500 text-neutral-950"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings &amp; Thresholds</span>
          </button>
        </div>

        {/* Global Action: Add Question */}
        {subTab === "faqs" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="px-3 py-1.5 rounded-[4px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-neutral-200 dark:border-white/10 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Categories</span>
            </button>
            <button
              onClick={openCreateFaqModal}
              className="px-3 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================
          SUB-TAB 1: KNOWLEDGE BASE (FAQS TABLE)
      ==================================================================== */}
      {subTab === "faqs" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5">
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadFaqs()}
                placeholder="Search stored questions and approved answers..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-none text-neutral-900 dark:text-white"
              />
              <SearchIcon className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* FAQs List Table */}
          <div className="rounded-[6px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-16">Status</th>
                    <th className="p-3">Primary Question</th>
                    <th className="p-3 w-36">Category</th>
                    <th className="p-3 w-28 text-center">Matches</th>
                    <th className="p-3 w-28 text-center">Helpfulness</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-white/5">
                  {isLoadingFaqs ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 font-mono">
                        Loading knowledge base entries...
                      </td>
                    </tr>
                  ) : faqs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 font-mono">
                        No FAQ entries found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    faqs.map((faq) => (
                      <tr
                        key={faq.faq_id}
                        className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Status Toggle */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleFaqStatus(faq)}
                            className={`px-2 py-0.5 rounded-[3px] font-mono text-[9.5px] font-bold uppercase transition-colors cursor-pointer ${
                              faq.is_active
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-neutral-200 dark:bg-white/10 text-neutral-500 border border-neutral-300 dark:border-white/10"
                            }`}
                          >
                            {faq.is_active ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Primary Question + Tagalog Preview */}
                        <td className="p-3">
                          <p className="font-bold text-neutral-900 dark:text-white leading-snug">
                            {faq.question_en}
                          </p>
                          {faq.question_tl && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {faq.question_tl}
                            </p>
                          )}
                          {Array.isArray(faq.alt_questions) && faq.alt_questions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {faq.alt_questions.slice(0, 3).map((alt, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/5"
                                >
                                  {alt}
                                </span>
                              ))}
                              {faq.alt_questions.length > 3 && (
                                <span className="text-[9px] font-mono text-neutral-400">
                                  +{faq.alt_questions.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                          {faq.category_name_en || "General"}
                        </td>

                        {/* Match Count */}
                        <td className="p-3 text-center font-mono text-xs">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {faq.match_count || 0}
                          </span>
                        </td>

                        {/* Helpfulness */}
                        <td className="p-3 text-center font-mono text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{faq.helpful_count || 0}
                          </span>{" "}
                          /{" "}
                          <span className="text-rose-600 dark:text-rose-400">
                            -{faq.not_helpful_count || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditFaqModal(faq)}
                              title="Edit FAQ"
                              className="p-1.5 rounded-[3px] text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFaq(faq.faq_id)}
                              title="Delete FAQ"
                              className="p-1.5 rounded-[3px] text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 2: UNANSWERED QUESTIONS
      ==================================================================== */}
      {subTab === "unanswered" && (
        <div className="space-y-4">
          <div className="p-4 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Unanswered Customer Questions Log
              </p>
              <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                These questions were asked by website visitors but did not reliably match any approved answer.
                You can convert them into new FAQs or link them as alternative phrasings to make the search engine smarter.
              </p>
            </div>
          </div>

          <div className="rounded-[6px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="p-3">Customer Question</th>
                    <th className="p-3 w-36">Customer</th>
                    <th className="p-3 w-28 text-center">Count</th>
                    <th className="p-3 w-32">Date</th>
                    <th className="p-3 w-48 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-white/5">
                  {isLoadingUnanswered ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-400 font-mono">
                        Loading unanswered questions...
                      </td>
                    </tr>
                  ) : unanswered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-400 font-mono">
                        No open unanswered questions! All inquiries have been reviewed or answered.
                      </td>
                    </tr>
                  ) : (
                    unanswered.map((item) => (
                      <tr
                        key={item.unanswered_id}
                        className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-3">
                          <p className="font-bold text-neutral-900 dark:text-white leading-snug">
                            &ldquo;{item.original_question}&rdquo;
                          </p>
                          {item.customer_feedback === "NOT_HELPFUL" && (
                            <span className="inline-block mt-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Customer clicked &ldquo;No, I need more help&rdquo;
                            </span>
                          )}
                          {item.human_support_requested && (
                            <span className="inline-block ml-1.5 mt-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Requested Human Support
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <p className="font-mono text-neutral-900 dark:text-white font-semibold">
                            {item.customer_name || "Guest"}
                          </p>
                          {item.customer_email && (
                            <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400 truncate">
                              {item.customer_email}
                            </p>
                          )}
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-neutral-900 dark:text-white">
                          {item.occurrence_count || 1}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleConvertUnanswered(item)}
                              title="Create new FAQ from this question"
                              className="px-2 py-1 rounded-[3px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Add to FAQ
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLinkTargetModal({
                                  unansweredId: item.unanswered_id,
                                  phrasing: item.original_question,
                                })
                              }
                              title="Link as alternative phrasing of existing FAQ"
                              className="px-2 py-1 rounded-[3px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Link
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDismissUnanswered(item.unanswered_id)}
                              title="Dismiss / Mark Reviewed"
                              className="p-1 rounded-[3px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                            >
                              <CloseIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 3: LIVE HUMAN SUPPORT INBOX
      ==================================================================== */}
      {subTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px]">
          {/* Left Column: Conversations List */}
          <div className="lg:col-span-4 flex flex-col rounded-[6px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] overflow-hidden shadow-xs">
            {/* Filter Bar */}
            <div className="p-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Support Queue
              </span>
              <select
                value={convFilter}
                onChange={(e) => setConvFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded-[3px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              >
                <option value="ALL">All Conversations</option>
                <option value="AWAITING">Awaiting Admin</option>
                <option value="ACTIVE">Active Live Chat</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-150 dark:divide-white/5">
              {isLoadingConv ? (
                <div className="p-8 text-center text-neutral-400 font-mono text-xs">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 font-mono text-xs">
                  No conversations matching criteria.
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = selectedConvId === c.conversation_id;
                  const isAwaiting = c.status === "AWAITING_HUMAN";
                  return (
                    <div
                      key={c.conversation_id}
                      onClick={() => setSelectedConvId(c.conversation_id)}
                      className={`p-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/10 border-l-2 border-l-amber-500"
                          : "hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {c.customer_name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] font-bold uppercase ${
                            isAwaiting
                              ? "bg-amber-500 text-neutral-950 animate-pulse"
                              : c.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </div>

                      {c.customer_email && (
                        <p className="font-mono text-[10.5px] text-amber-600 dark:text-amber-400 truncate mb-1">
                          {c.customer_email}
                        </p>
                      )}

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                        {c.last_message_preview || "No message content"}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-150 dark:border-white/5 text-[9.5px] font-mono text-neutral-400">
                        <span>{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {c.unread_admin_count > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                            {c.unread_admin_count} new
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation History & Reply Composer */}
          <div className="lg:col-span-8 flex flex-col rounded-[6px] border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#101218] overflow-hidden shadow-xs">
            {activeConvDetails ? (
              <>
                {/* Thread Header */}
                <div className="p-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/[0.02]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900 dark:text-white">
                        {activeConvDetails.customer_name}
                      </span>
                      {activeConvDetails.customer_email && (
                        <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                          ({activeConvDetails.customer_email})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                      Status: <span className="text-amber-500 font-bold">{activeConvDetails.status}</span>
                      {activeConvDetails.assigned_admin_name && ` · Assigned to: ${activeConvDetails.assigned_admin_name}`}
                    </p>
                  </div>

                  {/* Actions: Claim / Resolve / Return to bot */}
                  <div className="flex items-center gap-1.5">
                    {activeConvDetails.status === "AWAITING_HUMAN" && (
                      <button
                        type="button"
                        onClick={() => handleClaimConversation(activeConvDetails.conversation_id)}
                        className="px-2.5 py-1 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono text-xs font-bold uppercase transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        Claim / Join Chat
                      </button>
                    )}
                    {activeConvDetails.status !== "RESOLVED" ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateConvStatus("RESOLVED")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold uppercase">
                        Resolved
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdateConvStatus("BOT_ACTIVE")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-neutral-200 hover:bg-neutral-300 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white font-mono text-xs font-medium uppercase transition-all cursor-pointer active:scale-95 border border-neutral-300 dark:border-white/15"
                      title="Return control to automated chatbot"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                      <span>Return to Bot</span>
                    </button>
                  </div>
                </div>

                {/* Message History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F7F5] dark:bg-[#080a0e] text-xs">
                  {convMessages.map((m, idx) => {
                    const isCustomer = m.sender_type === "CUSTOMER";
                    const isBot = m.sender_type === "BOT";
                    const isAdmin = m.sender_type === "ADMIN";
                    const isSystem = m.sender_type === "SYSTEM";

                    if (isSystem) {
                      return (
                        <div key={m.message_id ? `admin_sys_${m.message_id}` : `admin_sys_idx_${idx}`} className="text-center my-2">
                          <span className="inline-block px-2 py-0.5 rounded-[2px] bg-neutral-200/60 dark:bg-white/[0.04] text-[10px] font-mono text-neutral-500">
                            {m.message_text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.message_id ? `admin_msg_${m.message_id}` : `admin_msg_idx_${idx}`}
                        className={`flex gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-[6px] shadow-xs ${
                            isAdmin
                              ? "bg-amber-500 text-neutral-950 font-medium"
                              : isCustomer
                              ? "bg-white dark:bg-[#141821] text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10"
                              : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[9.5px] font-mono opacity-70 mb-1">
                            <span className="font-bold uppercase">{m.sender_type}</span>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{m.message_text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer */}
                <form
                  onSubmit={handleSendAdminReply}
                  className="p-3 border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#101218] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={adminReplyInput}
                    onChange={(e) => setAdminReplyInput(e.target.value)}
                    placeholder="Type reply as MCPA administrator..."
                    className="flex-1 px-3 py-2 text-xs rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 focus:border-amber-500 focus:outline-none text-neutral-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !adminReplyInput.trim()}
                    className="px-3 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 font-mono text-xs">
                Select a conversation from the list to view and reply.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 4: SETTINGS & THRESHOLDS
      ==================================================================== */}
      {subTab === "settings" && settingsData && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Thresholds Card */}
            <div className="p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs space-y-4">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Matching Engine Thresholds</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Minimum Matching Threshold (Default: 0.42)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="0.95"
                    value={settingsData.min_match_threshold}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, min_match_threshold: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Questions scoring below this confidence value trigger the honest fallback.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Ambiguity Delta (Default: 0.06)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.20"
                    value={settingsData.ambiguity_delta}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, ambiguity_delta: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    If top 2 questions score within this difference, the bot offers clarifying options.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Max Live Suggestions (Default: 5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settingsData.max_suggestions}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, max_suggestions: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Official External Links Card */}
            <div className="p-5 rounded-[6px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 shadow-xs space-y-4">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <ExternalLinkIcon className="w-4 h-4" />
                <span>Official External Support Channels</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Official Messenger Destination URL
                  </label>
                  <input
                    type="text"
                    value={settingsData.messenger_url}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, messenger_url: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="text"
                    value={settingsData.social_links?.facebook || ""}
                    onChange={(e) =>
                      setSettingsData((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, facebook: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={settingsData.social_links?.instagram || ""}
                    onChange={(e) =>
                      setSettingsData((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, instagram: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors shadow-xs cursor-pointer"
            >
              {isSavingSettings ? "Saving Settings..." : "Save Configuration"}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================
          MODAL: CREATE / EDIT FAQ (With Live Answer Preview)
      ==================================================================== */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-[8px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-neutral-50 dark:bg-white/[0.02]">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {editingFaq ? "Edit Knowledge Base Entry" : "Create Approved Knowledge Base Entry"}
              </span>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveFaq} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Category *
                  </label>
                  <select
                    value={faqForm.categoryId}
                    onChange={(e) => setFaqForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name_en} ({c.name_tl})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={faqForm.isActive}
                    onChange={(e) => setFaqForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <label htmlFor="isActiveToggle" className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    Active (Searchable by customers)
                  </label>
                </div>
              </div>

              {/* Primary Questions */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Primary Question (English) *
                  </label>
                  <input
                    type="text"
                    value={faqForm.questionEn}
                    onChange={(e) => setFaqForm((p) => ({ ...p, questionEn: e.target.value }))}
                    placeholder="e.g. What construction services does MCPA offer?"
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Primary Question (Tagalog / Filipino)
                  </label>
                  <input
                    type="text"
                    value={faqForm.questionTl}
                    onChange={(e) => setFaqForm((p) => ({ ...p, questionTl: e.target.value }))}
                    placeholder="e.g. Anong mga serbisyo sa konstruksyon ang iniaalok ng MCPA?"
                    className="w-full px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Alternative Phrasings */}
              <div>
                <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                  Alternative Phrasings (Tagalog, Taglish &amp; English)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAltInput}
                    onChange={(e) => setNewAltInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newAltInput.trim()) {
                        e.preventDefault();
                        if (!faqForm.altQuestions.includes(newAltInput.trim())) {
                          setFaqForm((p) => ({ ...p, altQuestions: [...p.altQuestions, newAltInput.trim()] }));
                        }
                        setNewAltInput("");
                      }
                    }}
                    placeholder="Type variation and press Enter..."
                    className="flex-1 px-3 py-1.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAltInput.trim() && !faqForm.altQuestions.includes(newAltInput.trim())) {
                        setFaqForm((p) => ({ ...p, altQuestions: [...p.altQuestions, newAltInput.trim()] }));
                        setNewAltInput("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 font-mono text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {faqForm.altQuestions.map((alt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-neutral-100 dark:bg-white/5 text-[11px] font-mono border border-neutral-200 dark:border-white/10"
                    >
                      <span>{alt}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFaqForm((p) => ({
                            ...p,
                            altQuestions: p.altQuestions.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-neutral-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Approved Answers */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Approved Answer (English) *
                  </label>
                  <textarea
                    rows={3}
                    value={faqForm.answerEn}
                    onChange={(e) => setFaqForm((p) => ({ ...p, answerEn: e.target.value }))}
                    placeholder="Official approved answer explaining MCPA services..."
                    className="w-full p-2.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                    Approved Answer (Tagalog / Filipino)
                  </label>
                  <textarea
                    rows={3}
                    value={faqForm.answerTl}
                    onChange={(e) => setFaqForm((p) => ({ ...p, answerTl: e.target.value }))}
                    placeholder="Opisyal na sagot sa wikang Tagalog..."
                    className="w-full p-2.5 rounded-[4px] bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Widget Preview */}
              <div className="p-3.5 rounded-[6px] bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Widget Bubble Preview</span>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewLang("en")}
                      className={`px-1.5 py-0.2 rounded font-mono ${previewLang === "en" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"}`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLang("fil")}
                      className={`px-1.5 py-0.2 rounded font-mono ${previewLang === "fil" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"}`}
                    >
                      FIL
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-white dark:bg-[#141821] border border-neutral-200 dark:border-white/10 shadow-xs text-xs text-neutral-800 dark:text-neutral-200">
                  <p className="whitespace-pre-line leading-relaxed">
                    {previewLang === "fil" && faqForm.answerTl
                      ? faqForm.answerTl
                      : faqForm.answerEn || "Answer will appear here..."}
                  </p>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-3 py-1.5 rounded-[4px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors shadow-xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: MANAGE CATEGORIES
      ==================================================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-[8px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-neutral-50 dark:bg-white/[0.02]">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Knowledge Base Categories
              </span>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              {/* Add category form */}
              <form onSubmit={handleCreateCategory} className="p-3 rounded-[4px] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-2.5">
                <p className="font-mono font-bold text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Add New Category
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    placeholder="Name (English)"
                    className="px-2.5 py-1.5 text-xs rounded bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newCatNameTl}
                    onChange={(e) => setNewCatNameTl(e.target.value)}
                    placeholder="Name (Tagalog)"
                    className="px-2.5 py-1.5 text-xs rounded bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider"
                >
                  Create Category
                </button>
              </form>

              {/* Categories list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c.category_id}
                    className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5"
                  >
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">{c.name_en}</p>
                      <p className="text-[10px] text-neutral-500">{c.name_tl} · slug: {c.slug}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: LINK QUESTION TO EXISTING FAQ
      ==================================================================== */}
      {linkTargetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-[8px] bg-white dark:bg-[#0c0e12] border border-neutral-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Link Alternative Phrasing
            </span>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Link the customer&apos;s question as a recognized variation of an existing approved FAQ:
            </p>

            <div className="p-2.5 rounded bg-neutral-100 dark:bg-white/5 font-mono text-xs font-semibold text-neutral-900 dark:text-white">
              &ldquo;{linkTargetModal.phrasing}&rdquo;
            </div>

            <div>
              <label className="block font-mono text-[11px] text-neutral-500 mb-1">
                Select Target FAQ:
              </label>
              <select
                value={selectedLinkFaqId}
                onChange={(e) => setSelectedLinkFaqId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              >
                <option value="">-- Choose an approved FAQ --</option>
                {faqs.map((f) => (
                  <option key={f.faq_id} value={f.faq_id}>
                    {f.question_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkTargetModal(null)}
                className="px-3 py-1.5 rounded bg-neutral-200 dark:bg-white/10 font-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedLinkFaqId}
                onClick={handleLinkUnanswered}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider disabled:opacity-40"
              >
                Link Phrasing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
